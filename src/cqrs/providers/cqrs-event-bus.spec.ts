import { Test, TestingModule } from '@nestjs/testing';
import { TypegooseModule } from 'nestjs-typegoose';
import { KafkaModule } from 'nestjs-rdkafka';
import { CqrsEvent } from '../models/cqrs-event';
import { CqrsEventBus } from './cqrs-event-bus';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CqrsModule } from '../cqrs.module';
import { disconnect } from 'mongoose';
import { ICqrsEventHandler } from '../interfaces/ICqrsEventHandler';
import { EventsHandler } from '../decorators/events-handler.decorator';
import { ConcurrencyViolationError } from '../errors/concurrency-violation-error';
import { EventNotRegisteredError } from '../errors/event-not-registered-error';

class ExampleCqrsEvent extends CqrsEvent {
  public readonly _id: string;
  public readonly aggregateType: string = 'Example';
  public readonly createdAt: Date;
  constructor(public readonly aggregateId: string, public readonly version: number) {
    super(aggregateId, version);
  }
}

@EventsHandler(ExampleCqrsEvent)
class ExampleEventHandler implements ICqrsEventHandler<ExampleCqrsEvent> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(cqrsEvent: ExampleCqrsEvent): Promise<void> {
    return;
  }
}

@EventsHandler(ExampleCqrsEvent)
class NotInitExampleEventHandler implements ICqrsEventHandler<ExampleCqrsEvent> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async handle(cqrsEvent: ExampleCqrsEvent): Promise<void> {
    return;
  }
}

describe('CqrsEventBus', () => {
  let provider: CqrsEventBus<ExampleCqrsEvent>;
  let mongod: MongoMemoryServer;
  let module: TestingModule;

  beforeEach(async () => {
    mongod = new MongoMemoryServer({
      binary: {
        version: '4.2.10'
      }
    });
    module = await Test.createTestingModule({
      providers: [CqrsEventBus, ExampleEventHandler],
      imports: [
        CqrsModule.forRootAsync({
          eventBusOptions: {
            kafka: {
              replicationFactor: 1,
              num_partitions: 1,
              'delete.retention.ms': '1000000'
            }
          }
        }),
        TypegooseModule.forRootAsync({
          useFactory: async () => {
            const uri = await mongod.getUri();
            return {
              uri,
              useNewUrlParser: true,
              useCreateIndex: true,
              useUnifiedTopology: true,
              useFindAndModify: false
            };
          },
        }),
        TypegooseModule.forFeature([
          { typegooseClass: CqrsEvent, schemaOptions: { collection: 'cqrsEvents', timestamps: true, ...{ autoCreate: true } } }
        ]),
        KafkaModule.forRootAsync({
          consumer: {
            conf: {
              "group.id": 'nestjs-rdkafka-test',
              "metadata.broker.list": '127.0.0.1:9092',
              "security.protocol": 'plaintext'
            }
          },
          producer: {
            conf: {
              "metadata.broker.list": '127.0.0.1:9092',
              "security.protocol": 'plaintext'
            }
          },
          adminClient: {
            conf: {
              "metadata.broker.list": '127.0.0.1:9092',
              "security.protocol": 'plaintext'
            }
          }
        })
      ]
    }).compile();

    provider = module.get<CqrsEventBus<ExampleCqrsEvent>>(CqrsEventBus);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should publish event', async () => {
    expect(await provider.publish(new ExampleCqrsEvent('aggregateId1', 0))).not.toThrow;
  });

  it('should throw ConcurrencyViolationError when publish event with older version', async () => {
    await provider.publish(new ExampleCqrsEvent('aggregateId2', 0))
    await expect(provider.publish(new ExampleCqrsEvent('aggregateId2', 0))).rejects.toThrow(ConcurrencyViolationError);
  });

  it('should publish all event (no event)', async () => {
    expect(await provider.publishAll([])).not.toThrow;
  });

  it('should execute event (multiple events)', async () => {
    expect(await provider.publishAll([new ExampleCqrsEvent('aggregateId3', 0), new ExampleCqrsEvent('aggregateId3', 1)])).not.toThrow;
  });

  it('should throw ConcurrencyViolationError when publish multiple events with older version', async () => {
    await expect(provider.publishAll([new ExampleCqrsEvent('aggregateId4', 0), new ExampleCqrsEvent('aggregateId4', 0)]))
      .rejects.toThrow(ConcurrencyViolationError);
  });

  it('should register event handler', async () => {
    expect(provider.registerEventHandler(ExampleCqrsEvent, new ExampleEventHandler()));
  });

  it('should throw error when register event handler twice', async () => {
    provider.registerEventHandler(ExampleCqrsEvent, new ExampleEventHandler())
    expect(() => provider.registerEventHandler(ExampleCqrsEvent, new ExampleEventHandler())).toThrow(ReferenceError);
  });

  it('should hanle event', async () => {
    provider.registerEventHandler(ExampleCqrsEvent, new ExampleEventHandler());
    const exampleMessage = {
      key: 'key', value: JSON.stringify(new ExampleCqrsEvent('aggregateId4', 0)), timestamp: new Date().getTime(), headers: {}
    };
    expect(await provider.handleEvent(exampleMessage)).not.toThrow;
  });

  it('should hanle event if event has no handler registered', async () => {
    const exampleMessage = {
      key: 'key', value: JSON.stringify(new ExampleCqrsEvent('aggregateId4', 0)), timestamp: new Date().getTime(), headers: {}
    };
    await expect(provider.handleEvent(exampleMessage)).rejects.toThrow(EventNotRegisteredError);
  });

  afterEach(async () => {
    await disconnect();
    await mongod.stop();
    await module.close();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { TypegooseModule } from 'nestjs-typegoose';
import { KafkaModule } from 'nestjs-rdkafka';
import { CqrsEvent } from '../models/cqrs-event';
import { CqrsEventBus } from './cqrs-event-bus';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CqrsModule } from '../cqrs.module';
import { disconnect } from 'mongoose';
import { ICqrsEventHandler } from '../interfaces/ICqrsEventHandler';
import { ICqrsEventConstructor } from '../interfaces/ICqrsEventConstructor';

describe('CqrsEventBus', () => {
  let provider: CqrsEventBus;
  let mongod: MongoMemoryServer;
  let module: TestingModule;

  beforeEach(async () => {
    mongod = new MongoMemoryServer({
      binary: {
        version: '4.2.10'
      }
    });
    module = await Test.createTestingModule({
      providers: [CqrsEventBus],
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

    provider = module.get<CqrsEventBus>(CqrsEventBus);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should execute event (no event)', async () => {
    expect(await provider.execute([])).not.toThrow;
  });

  it('should execute event (single event)', async () => {
    expect(await provider.execute([new CqrsEvent('aggregateId', 0)])).not.toThrow;
  });

  it('should execute event (multiple events)', async () => {
    expect(await provider.execute([new CqrsEvent('aggregateId', 0), new CqrsEvent('aggregateId', 1)])).not.toThrow;
  });

  it('should register event handler', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    class ExampleCqrsEvent extends CqrsEvent {
      public readonly aggregateType: string = this.constructor.name;;
      constructor(aggregateId: string, version: number) {
        super(aggregateId, version);
      }
    }
    class ExampleEventHandler implements ICqrsEventHandler {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async execute(cqrsEvent: ExampleCqrsEvent): Promise<void> {
        return;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    expect(provider.registerEventHandler(ExampleCqrsEvent, new ExampleEventHandler()));
  });

  it('should throw error when register event handler twice', async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    class ExampleCqrsEvent extends CqrsEvent {
      public readonly aggregateType: string = this.constructor.name;;
      constructor(aggregateId: string, version: number) {
        super(aggregateId, version);
      }
    }
    class ExampleEventHandler implements ICqrsEventHandler {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async execute(cqrsEvent: ExampleCqrsEvent): Promise<void> {
        return;
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    provider.registerEventHandler(ExampleCqrsEvent, new ExampleEventHandler())
    expect(() => provider.registerEventHandler(ExampleCqrsEvent, new ExampleEventHandler())).toThrow(ReferenceError);
  });

  afterEach(async () => {
    await disconnect();
    await mongod.stop();
    await module.close();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CqrsEventBus } from '../providers/cqrs-event-bus';
import { AggregateRoot } from './aggregate-root';
import { CqrsEvent } from './cqrs-event';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TypegooseModule } from 'nestjs-typegoose';
import { KafkaModule } from 'nestjs-rdkafka';
import { CqrsModule } from '../cqrs.module';
import { disconnect } from 'mongoose';

class ExampleAggregateRoot extends AggregateRoot {
  event1 = false;
  event2 = false;

  onExampleCqrsEvent1(cqrsEvent: CqrsEvent) {
    this.event1 = true;
  }

  onExampleCqrsEvent2(cqrsEvent: CqrsEvent) {
    this.event2 = true;
  }
}

class ExampleCqrsEvent1 extends CqrsEvent { }

class ExampleCqrsEvent2 extends CqrsEvent { }

describe('AggregateRoot', () => {
  let provider: CqrsEventBus<CqrsEvent>;
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

    provider = module.get<CqrsEventBus<CqrsEvent>>(CqrsEventBus);
  });

  it('should be defined', () => {
    expect(new ExampleAggregateRoot()).toBeDefined();
  });

  it('should get uncommit event', () => {
    const aggregateRoot = new ExampleAggregateRoot();
    aggregateRoot.apply(new ExampleCqrsEvent1('aggregateRoot1', 0));
    expect(aggregateRoot.getUncommittedEvents().length).toBeGreaterThan(0);
  });

  it('should uncommit event', () => {
    const aggregateRoot = new ExampleAggregateRoot();
    aggregateRoot.apply(new ExampleCqrsEvent1('aggregateRoot1', 0));
    aggregateRoot.uncommit();
    expect(aggregateRoot.getUncommittedEvents().length).toEqual(0);
  });

  it('should commit no event', async () => {
    const aggregateRoot = new ExampleAggregateRoot();
    await aggregateRoot.commit(provider)
    expect(
      aggregateRoot.event1 === false && aggregateRoot.event2 === false && aggregateRoot.getUncommittedEvents().length === 0
    ).toBeTruthy();
  });

  it('should commit sigle event', async () => {
    const aggregateRoot = new ExampleAggregateRoot();
    aggregateRoot.apply(new ExampleCqrsEvent1('aggregateRoot1', 0));
    await aggregateRoot.commit(provider)
    expect(aggregateRoot.event1 === true && aggregateRoot.event2 === false).toBeTruthy();
    aggregateRoot.apply(new ExampleCqrsEvent2('aggregateRoot1', 1));
    await aggregateRoot.commit(provider)
    expect(
      aggregateRoot.event1 === true && aggregateRoot.event2 === true && aggregateRoot.getUncommittedEvents().length === 0
    ).toBeTruthy();
  });

  it('should commit multiple events', async () => {
    const aggregateRoot = new ExampleAggregateRoot();
    aggregateRoot.apply(new ExampleCqrsEvent1('aggregateRoot1', 0));
    aggregateRoot.apply(new ExampleCqrsEvent2('aggregateRoot1', 1));
    await aggregateRoot.commit(provider);
    expect(
      aggregateRoot.event1 === true && aggregateRoot.event2 === true && aggregateRoot.getUncommittedEvents().length === 0
    ).toBeTruthy();
  });

  it('should load aggregate root from history', async () => {
    const aggregateRoot = new ExampleAggregateRoot();
    aggregateRoot.loadFromHistory([
      new ExampleCqrsEvent1('aggregateRoot1', 0),
      new ExampleCqrsEvent2('aggregateRoot1', 1)
    ]);
    expect(aggregateRoot.event1 === true && aggregateRoot.event2 === true).toBeTruthy();
  });

  afterEach(async () => {
    await disconnect();
    await mongod.stop();
    await module.close();
  });
});

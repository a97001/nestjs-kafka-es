import { Test, TestingModule } from '@nestjs/testing';
import { TypegooseModule } from 'nestjs-typegoose';
import { KafkaModule } from '@a97001/nestjs-rdkafka';
import { CqrsEvent } from '../models/cqrs-event';
import { CqrsEventBus } from './cqrs-event-bus';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('CqrsEventBus', () => {
  let provider: CqrsEventBus;
  let mongod: MongoMemoryServer;

  beforeEach(async () => {
    mongod = new MongoMemoryServer({
      binary: {
        version: '4.2.10'
      }
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [CqrsEventBus],
      imports: [
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
          "group.id": 'nestjs-rdkafka-test',
          "metadata.broker.list": '127.0.0.1:9092',
          "security.protocol": false
        }),
        // getKafkaConnectionProvider({
        //   "group.id": 'nestjs-rdkafka-test',
        //   "metadata.broker.list": '127.0.0.1:9092',
        //   "security.protocol": false
        // })
      ]
    }).compile();

    provider = module.get<CqrsEventBus>(CqrsEventBus);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  afterEach(async () => {
    await mongod.stop();
  });
});

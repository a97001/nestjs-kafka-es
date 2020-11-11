import { Test, TestingModule } from '@nestjs/testing';
import { TypegooseModule } from 'nestjs-typegoose';
import { KafkaModule } from 'nestjs-rdkafka';
import { CqrsEvent } from '../models/cqrs-event';
import { CqrsEventBus } from './cqrs-event-bus';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CqrsModule } from '../cqrs.module';
import { disconnect } from 'mongoose';

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
          replicationFactor: 1,
          "delete.retention.ms": '1000000'
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

  afterEach(async () => {
    await disconnect();
    await mongod.stop();
    await module.close();
  });
});

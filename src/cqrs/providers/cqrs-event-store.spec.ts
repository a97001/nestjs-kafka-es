import { Test, TestingModule } from '@nestjs/testing';
import { TypegooseModule } from 'nestjs-typegoose';
import { CqrsEvent } from '../models/cqrs-event';
import { CqrsEventStore } from './cqrs-event-store';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnect } from 'mongoose';

describe('CqrsEvevntStore', () => {
  let provider: CqrsEventStore;
  let mongod: MongoMemoryServer;

  beforeEach(async () => {
    mongod = new MongoMemoryServer({
      binary: {
        version: '4.2.10'
      }
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [CqrsEventStore],
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
      ]
    }).compile();

    provider = module.get<CqrsEventStore>(CqrsEventStore);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  afterEach(async () => {
    await disconnect();
    await mongod.stop();
  });
});

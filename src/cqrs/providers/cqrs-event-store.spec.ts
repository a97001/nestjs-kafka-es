import { Test, TestingModule } from '@nestjs/testing';
import { TypegooseModule } from 'nestjs-typegoose';
import { CqrsEvent } from '../models/cqrs-event';
import { CqrsEventStore } from './cqrs-event-store';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnect } from 'mongoose';

describe('CqrsEvevntStore', () => {
  let provider: CqrsEventStore;
  let mongod: MongoMemoryServer;
  let module: TestingModule;

  beforeEach(async () => {
    mongod = new MongoMemoryServer({
      binary: {
        version: '4.2.10'
      }
    });
    module = await Test.createTestingModule({
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

  it('should get events for aggregate', async () => {
    expect(await provider.getEventsForAggregate('no this id')).toEqual([]);
  });

  afterEach(async () => {
    await disconnect();
    await mongod.stop();
    await module.close();
  });
});

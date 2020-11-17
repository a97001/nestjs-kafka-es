import { Test, TestingModule } from '@nestjs/testing';
import { CqrsEventPublisher } from './cqrs-event-publisher';

describe('CqrsEventPublisher', () => {
  let provider: CqrsEventPublisher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CqrsEventPublisher],
    }).compile();

    provider = module.get<CqrsEventPublisher>(CqrsEventPublisher);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});

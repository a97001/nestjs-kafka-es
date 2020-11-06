import { Test, TestingModule } from '@nestjs/testing';
import { CqrsCommandBus } from './cqrs-command-bus';

describe('CqrsCommandBus', () => {
  let provider: CqrsCommandBus;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CqrsCommandBus],
    }).compile();

    provider = module.get<CqrsCommandBus>(CqrsCommandBus);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});

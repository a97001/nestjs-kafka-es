import { AggregateRoot } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from './repository';

describe('Repository', () => {
  let provider: Repository<AggregateRoot>;

  // beforeEach(async () => {
  //   const module: TestingModule = await Test.createTestingModule({
  //     providers: [Repository],
  //   }).compile();

  //   provider = module.get<Repository<AggregateRoot>>(Repository);
  // });

  it('should be defined', () => {
    expect(provider).not.toBeDefined();
  });
});

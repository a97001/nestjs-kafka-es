import { ConcurrencyViolationError } from './concurrency-violation-error';

describe('ConcurrencyViolationError', () => {
  it('should be defined', () => {
    expect(new ConcurrencyViolationError()).toBeDefined();
  });
});

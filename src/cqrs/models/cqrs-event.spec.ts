import { CqrsEvent } from './cqrs-event';

describe('CqrsEvent', () => {
  it('should be defined', () => {
    expect(new CqrsEvent('aggregateId', 0)).toBeDefined();
  });
});

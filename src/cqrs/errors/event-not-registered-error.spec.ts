import { EventNotRegisteredError } from './event-not-registered-error';

describe('EventNotRegisteredError', () => {
  it('should be defined', () => {
    expect(new EventNotRegisteredError()).toBeDefined();
  });
});

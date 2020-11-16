import { AggregateRoot } from './aggregate-root';
import { CqrsEvent } from './cqrs-event';

describe('AggregateRoot', () => {
  class ExampleAggregate extends AggregateRoot {};

  let exampleAggregate: ExampleAggregate;

  beforeEach(async () => {
    exampleAggregate = new ExampleAggregate();
  });

  it('should be defined', () => {
    expect(AggregateRoot).toBeDefined();
  });

  // it('should load from history', () => {
  //   expect(exampleAggregate.loadFromHistory([new CqrsEvent('', 0)]));
  // })
});

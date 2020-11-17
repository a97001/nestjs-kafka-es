import { CqrsEvent } from '../models/cqrs-event';
import { defaultGetEventName } from './default-get-event-name';

describe('DefaultGetEventName', () => {
  it('should be defined', () => {
    expect(defaultGetEventName).toBeDefined();
  });

  it('should get event name', () => {
    const event = new CqrsEvent('', 0);
    const eventName = defaultGetEventName(event);
    expect(eventName).toEqual(event.constructor.name);
  })
});

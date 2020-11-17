import 'reflect-metadata';
import { CqrsEvent } from '../models/cqrs-event';
import { EVENTS_HANDLER_METADATA } from './constant';

/**
 * Decorator that marks a class as a Nest event handler. An event handler
 * handles events executed by your application code.
 *
 * The decorated class must implement the `IEventHandler` interface.
 *
 * @param events one or more event *types* to be handled by this handler.
 *
 * @see https://docs.nestjs.com/recipes/cqrs#events
 */
export const EventsHandler = (...events: typeof CqrsEvent[]): ClassDecorator => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (target: object) => {
    Reflect.defineMetadata(EVENTS_HANDLER_METADATA, events, target);
  };
};
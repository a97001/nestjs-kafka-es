import { CqrsEvent } from "../models/cqrs-event";

export interface ICqrsEventBus<EventBase extends CqrsEvent> {
  publish<T extends EventBase>(event: T): Promise<void>;
  publishAll(events: EventBase[]): Promise<void>;
}
import { CqrsEvent } from "../models/cqrs-event";

export interface ICqrsEventHandler<T extends CqrsEvent> {
    handle(event: T): Promise<void>;
}
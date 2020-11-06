import { CqrsEvent } from "../models/cqrs-event";

export interface ICqrsEventHandler {
    execute(event: CqrsEvent): Promise<void>;
}
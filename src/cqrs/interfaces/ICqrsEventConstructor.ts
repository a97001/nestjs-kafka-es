import { CqrsEvent } from "../models/cqrs-event";

export interface ICqrsEventConstructor {
    new(aggregateId: string, version: number): CqrsEvent;
}
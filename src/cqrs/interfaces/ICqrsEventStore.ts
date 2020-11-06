import { CqrsEvent } from "../models/cqrs-event";

export interface ICqrsEventStore {
    // saveEvents(
    //     aggregateId: string,
    //     events: CqrsEvent[],
    //     expectedVersion: number
    // ): Promise<void>

    getEventsForAggregate(aggregateId: string): Promise<CqrsEvent[]>
}
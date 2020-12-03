import { Injectable } from '@nestjs/common';
import { AggregateRoot } from '@nestjs/cqrs';
import { CqrsEventStore } from './cqrs-event-store';

@Injectable()
export abstract class Repository<T extends AggregateRoot> {
    constructor(
        private readonly cqrsEventStore: CqrsEventStore,
        private readonly AggregateType: new () => T
    ) { }

    async getById(_id: string): Promise<T> {
        const aggregateObj = new this.AggregateType();
        const history = await this.cqrsEventStore.getEventsForAggregate(_id);
        aggregateObj.loadFromHistory(history);
        return aggregateObj;
    }
}

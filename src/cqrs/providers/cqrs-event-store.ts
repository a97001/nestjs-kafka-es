import { Injectable } from '@nestjs/common';
import { ReturnModelType } from '@typegoose/typegoose';
import { InjectModel } from 'nestjs-typegoose';
import { CqrsEvent } from '../models/cqrs-event';

@Injectable()
export class CqrsEventStore {
    constructor(
        @InjectModel(CqrsEvent) private readonly cqrsEventModel: ReturnModelType<typeof CqrsEvent>
    ) { }

    async getEventsForAggregate(aggregateId: string): Promise<CqrsEvent[]> {
        return this.cqrsEventModel.find({ aggregateId }).sort({ createdAt: 1 }).lean().exec();
    }
}

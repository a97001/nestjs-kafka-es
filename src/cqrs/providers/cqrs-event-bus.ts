// import { Inject, Injectable } from '@nestjs/common';
// import { InjectModel } from 'nestjs-typegoose/dist/typegoose.decorators';
// import { CqrsEvent } from '../models/cqrs-event';
// import { ReturnModelType } from '@typegoose/typegoose';
// import { KafkaService } from 'nestjs-rdkafka';
// import { plainToClass } from 'class-transformer';
// import { ClientSession } from 'mongoose';
// import { ConcurrencyViolationError } from '../errors/concurrency-violation-error';
// import { ICqrsEventConstructor } from '../interfaces/ICqrsEventConstructor';
// import { ICqrsEventHandler } from '../interfaces/ICqrsEventHandler';
// import { CqrsModuleOptions } from '../interfaces/cqrs-module-options';

import { Injectable, OnModuleDestroy, Type } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ObservableBus } from "@nestjs/cqrs";
import { ReturnModelType } from "@typegoose/typegoose";
import { ClientSession } from "mongoose";
import { InjectModel } from "nestjs-typegoose";
import { Subscription } from "rxjs";
import { EVENTS_HANDLER_METADATA } from "../decorators/constant";
import { ConcurrencyViolationError } from "../errors/concurrency-violation-error";
import { defaultGetEventName } from "../helpers/default-get-event-name";
import { ICqrsEventBus } from "../interfaces/ICqrsEventBus";
import { ICqrsEventHandler } from "../interfaces/ICqrsEventHandler";
import { CqrsEvent } from "../models/cqrs-event";
import { CqrsCommandBus } from "./cqrs-command-bus";
import { filter } from 'rxjs/operators';

// @Injectable()
// export class CqrsEventBus {
//     private aggregateEventMap = new Map<string, Map<string, { eventClass: ICqrsEventConstructor, handler: ICqrsEventHandler<CqrsEvent> }>>();

//     constructor(
//         @Inject('CqrsModuleOptions') private readonly cqrsModuleOptions: CqrsModuleOptions,
//         @InjectModel(CqrsEvent) private readonly cqrsEventModel: ReturnModelType<typeof CqrsEvent>,
//         private readonly kafkaService: KafkaService
//     ) { }

//     public async execute(events: CqrsEvent[]): Promise<void> {
//         if (events.length === 0) {
//             return;
//         }
//         // const producer = this.kafkaService.getProducer();
//         console.time('event producer');

//         const tempCqrsEventModel: any = this.cqrsEventModel; // temp work-round. Since wrong typing def for startSession() below
//         if (events.length === 1) {
//             const result = await this.cqrsEventModel.updateOne(
//                 { aggregateId: events[0].aggregateId, version: { $gt: events[0].version - 1 } },
//                 { $setOnInsert: events[0] },
//                 { upsert: true }
//             ).exec();
//             if (result.nUpserted === 0) {
//                 throw new ConcurrencyViolationError();
//             }
//         } else {
//             const session: ClientSession = await tempCqrsEventModel.startSession();
//             session.startTransaction();
//             try {
//                 for (const event of events) {
//                     const result = await this.cqrsEventModel.updateOne(
//                         { aggregateId: event.aggregateId, version: { $gt: event.version - 1 } },
//                         { $setOnInsert: event },
//                         { upsert: true }
//                     );
//                     if (result.nUpserted === 0) {
//                         throw new ConcurrencyViolationError();
//                     }
//                 }
//                 // await this.cqrsEventModel.insertMany(events, { session });
//                 await session.commitTransaction();

//             } catch (err) {
//                 await session.abortTransaction();
//                 console.log(err);
//                 // if (err instanceof BadRequestException) {
//                 //     return { errorMsg: err.getResponse(), statusCode: err.getStatus() } as any;
//                 // } else if (err instanceof NotFoundException) {
//                 //     return { errorMsg: err.getResponse(), statusCode: err.getStatus() } as any;
//                 // } else {
//                 //     return { errorMsg: 'Internal Server Error', statusCode: 500 } as any;
//                 // }
//             } finally {
//                 session.endSession();
//             }
//         }
//     }

//     public registerEventHandler(eventClass: ICqrsEventConstructor, handler: ICqrsEventHandler<CqrsEvent>) {
//         const eventInstance = new eventClass('', 0);
//         if (!this.aggregateEventMap.has(eventInstance.aggregateType)) {
//             const newEventMap = new Map<string, { eventClass: any, handler: any }>();
//             this.aggregateEventMap.set(eventInstance.aggregateType, newEventMap);
//             this.kafkaService.subscribeTopic({
//                 topic: `es.evt.${eventInstance.aggregateType}`,
//                 num_partitions: this.cqrsModuleOptions.eventBusOptions.kafka.num_partitions,
//                 replication_factor: this.cqrsModuleOptions.eventBusOptions.kafka.replicationFactor,
//                 config: { 'delete.retention.ms': this.cqrsModuleOptions["delete.retention.ms"] }

//             }, async (receivedMessage) => {
//                 const eventPlain = JSON.parse(receivedMessage.value);
//                 const eventMapObj = newEventMap.get(eventPlain.name);
//                 if (eventMapObj) {
//                     const eventToBeExec = plainToClass(eventMapObj.eventClass, eventPlain);
//                     const eventResult = await eventMapObj.handler.execute(eventToBeExec);
//                     console.log(eventResult);
//                 } else {
//                     console.log(`CQRS Event ${eventPlain.name} has not been registered`);
//                 }
//             });
//         }
//         if (this.aggregateEventMap.get(eventInstance.aggregateType).has(eventClass.name)) {
//             throw new ReferenceError(`Event "${eventClass.name}" already registered!`)
//         }
//         this.aggregateEventMap.get(eventInstance.aggregateType).set(eventClass.name, { eventClass, handler });
//     }
// }


export type EventHandlerType<EventBase extends CqrsEvent = CqrsEvent> = Type<ICqrsEventHandler<EventBase>>;

@Injectable()
export class CqrsEventBus<EventBase extends CqrsEvent> extends ObservableBus<EventBase> implements ICqrsEventBus<EventBase>, OnModuleDestroy {
    protected getEventName: (event: EventBase) => string;
    protected readonly subscriptionMap: Map<string, Subscription>;

    // private _publisher: IEventPublisher<EventBase>;

    constructor(
        private readonly cqrsCommandBus: CqrsCommandBus,
        private readonly moduleRef: ModuleRef,
        @InjectModel(CqrsEvent) private readonly cqrsEventModel: ReturnModelType<typeof CqrsEvent>,
    ) {
        super();
        this.subscriptionMap = new Map();
        this.getEventName = defaultGetEventName;
    }

    onModuleDestroy() {
        Array.from(this.subscriptionMap.values()).forEach((subscription) => subscription.unsubscribe());
    }

    async publish<T extends EventBase>(event: T): Promise<void> {
        const result = await this.cqrsEventModel.updateOne(
            { aggregateId: event.aggregateId, version: { $gt: event.version - 1 } },
            { $setOnInsert: event },
            { upsert: true }
        ).exec();
        if (!result.upserted || result.upserted.length === 0) {
            throw new ConcurrencyViolationError();
        }
    }

    async publishAll<T extends EventBase>(events: T[]): Promise<void> {
        if (events.length == 0) {
            return;
        }
        const tempCqrsEventModel: any = this.cqrsEventModel; // temp work-round. Since wrong typing def for startSession() below
        const session: ClientSession = await tempCqrsEventModel.startSession();
        session.startTransaction();
        try {
            for (const event of events) {
                const result = await this.cqrsEventModel.updateOne(
                    { aggregateId: event.aggregateId, version: { $gt: event.version - 1 } },
                    { $setOnInsert: event },
                    { upsert: true }
                );
                if (!result.upserted || result.upserted.length === 0) {
                    throw new ConcurrencyViolationError();
                }
            }
            // await this.cqrsEventModel.insertMany(events, { session });
            await session.commitTransaction();

        } catch (err) {
            await session.abortTransaction();
            throw err;
            // if (err instanceof BadRequestException) {
            //     return { errorMsg: err.getResponse(), statusCode: err.getStatus() } as any;
            // } else if (err instanceof NotFoundException) {
            //     return { errorMsg: err.getResponse(), statusCode: err.getStatus() } as any;
            // } else {
            //     return { errorMsg: 'Internal Server Error', statusCode: 500 } as any;
            // }
        } finally {
            session.endSession();
        }
    }

    bind(handler: ICqrsEventHandler<EventBase>, name: string) {
        const stream$ = name ? this.ofEventName(name) : this.subject$;
        const subscription = stream$.subscribe((event) => handler.handle(event));
        if (this.subscriptionMap.has(name)) {
            throw new ReferenceError(`Event "${name}" already registered to ${this.constructor.name}!`) 
        }
        this.subscriptionMap.set(name, subscription);
    }

    register(handlers: EventHandlerType<EventBase>[] = []) {
        handlers.forEach((handler) => this.registerHandler(handler));
    }

    protected registerHandler(handler: EventHandlerType<EventBase>) {
        const instance = this.moduleRef.get(handler, { strict: false });
        // if (!instance) {
        //     return;
        // }
        const eventsNames = this.reflectEventsNames(handler);
        eventsNames.map((event) =>
            this.bind(instance as ICqrsEventHandler<EventBase>, event.name),
        );
    }

    protected ofEventName(name: string) {
        return this.subject$.pipe(filter((event) => this.getEventName(event) === name));
    }

    private reflectEventsNames(
        handler: EventHandlerType<EventBase>,
    ): FunctionConstructor[] {
        return Reflect.getMetadata(EVENTS_HANDLER_METADATA, handler);
    }
}
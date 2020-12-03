import { CqrsEventBus } from "../providers/cqrs-event-bus";
import { CqrsEvent } from "./cqrs-event";

const INTERNAL_EVENTS = Symbol();

export abstract class AggregateRoot<EventBase extends CqrsEvent = CqrsEvent> {
    private readonly [INTERNAL_EVENTS]: EventBase[] = [];

    async commit(cqrsEventBus: CqrsEventBus): Promise<void> {
        // this[INTERNAL_EVENTS].forEach((event) => this.publish(event));
        if (this[INTERNAL_EVENTS].length === 1) {
            await cqrsEventBus.publish(this[INTERNAL_EVENTS][0]);
        } else if (this[INTERNAL_EVENTS].length > 1) {
            await cqrsEventBus.publishAll(this[INTERNAL_EVENTS]);
        }
        this[INTERNAL_EVENTS].length = 0;
    }

    uncommit(): void {
        this[INTERNAL_EVENTS].length = 0;
    }

    getUncommittedEvents(): EventBase[] {
        return this[INTERNAL_EVENTS];
    }

    loadFromHistory(history: EventBase[]) {
        history.forEach((event) => this.apply(event, true));
    }

    apply<T extends EventBase = EventBase>(event: T, isFromHistory = false) {
        if (!isFromHistory) {
            this[INTERNAL_EVENTS].push(event);
        }
        // this.autoCommit && this.publish(event);

        const handler = this.getEventHandler(event);
        handler && handler.call(this, event);
    }

    protected getEventHandler<T extends EventBase = EventBase>(
        event: T,
    // eslint-disable-next-line @typescript-eslint/ban-types
    ): Function | undefined {
        const handler = `on${this.getEventName(event)}`;
        return this[handler];
    }

    protected getEventName(event: any): string {
        const { constructor } = Object.getPrototypeOf(event);
        return constructor.name as string;
    }
}

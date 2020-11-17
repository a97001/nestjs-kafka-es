import { CqrsEvent } from "../models/cqrs-event";

export const defaultGetEventName = <EventBase extends CqrsEvent = CqrsEvent>(
    event: EventBase,
): string => {
    const { constructor } = Object.getPrototypeOf(event);
    return constructor.name as string;
};
import { CqrsCommand } from "../models/cqrs-command";
import { CqrsEvent } from "../models/cqrs-event";
import { ICqrsMessage } from "./ICqrsMessage";

export interface ICqrsMessageBus {
    registerEventHandler<T extends CqrsEvent>(
        event: T,
        handler: (e: ICqrsMessage) => Promise<void>
    ): void;

    registerCommandHandler<T extends CqrsCommand>(
        command: T,
        handler: (e: ICqrsMessage) => Promise<void>
    ): void;

    send<T extends CqrsCommand>(command: T): void;

    publish<T extends CqrsEvent>(event: T[]): Promise<void>;
}
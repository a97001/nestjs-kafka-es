import { CqrsCommand } from "../models/cqrs-command";

export interface ICqrsCommandHandler {
    execute(command: CqrsCommand): Promise<void>;
}
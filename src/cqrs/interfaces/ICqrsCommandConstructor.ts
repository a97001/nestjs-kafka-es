import { CqrsCommand } from "../models/cqrs-command";

export interface ICqrsCommandConstructor {
    new(content: any): CqrsCommand;
}
import { CqrsCommand } from "../models/cqrs-command";

export interface ICqrsCommandHandler<TCommand extends CqrsCommand, TResult> {
    execute(command: TCommand): Promise<TResult>;
}
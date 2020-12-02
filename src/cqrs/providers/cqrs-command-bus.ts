import { Injectable } from '@nestjs/common';
import { ICqrsCommandConstructor } from '../interfaces/ICqrsCommandConstructor';
import { ICqrsCommandHandler } from '../interfaces/ICqrsCommandHandler';
import { CqrsCommand } from '../models/cqrs-command';

@Injectable()
export class CqrsCommandBus<TCommand extends CqrsCommand, TResult> {
    private aggregateCommandMap = new Map<string, { commandClass: ICqrsCommandConstructor, handler: ICqrsCommandHandler<TCommand, TResult> }>();

    public async execute(command: TCommand): Promise<void> {
        await this.publish(command);
    }

    public registerCommandHandler(commandClass: ICqrsCommandConstructor, handler: ICqrsCommandHandler<TCommand, TResult>) {
        if (this.aggregateCommandMap.has(commandClass.name)) {
            throw new ReferenceError(`Command "${commandClass.name}" already registered!`)
        }
        this.aggregateCommandMap.set(commandClass.name, { commandClass, handler });
    }

    private async publish(command: TCommand): Promise<TResult> {
        if (!this.aggregateCommandMap.has(command.constructor.name)) {
            throw new ReferenceError(`Command "${command.constructor.name}" has not been registered!`)
        }
        const commandMapObj = this.aggregateCommandMap.get(command.constructor.name);
        // const commandToBeExec = plainToClass(commandMapObj.commandClass, commandPlain);
        return commandMapObj.handler.execute(command);
    }
}

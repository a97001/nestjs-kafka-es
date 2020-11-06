import { Injectable } from '@nestjs/common';
import { ICqrsCommandConstructor } from '../interfaces/ICqrsCommandConstructor';
import { ICqrsCommandHandler } from '../interfaces/ICqrsCommandHandler';
import { CqrsCommand } from '../models/cqrs-command';

@Injectable()
export class CqrsCommandBus {
    private aggregateCommandMap = new Map<string, { commandClass: ICqrsCommandConstructor, handler: ICqrsCommandHandler }>();

    public async execute(command: CqrsCommand): Promise<void> {
        await this.publish(command);
    }

    public registerCommandHandler(commandClass: ICqrsCommandConstructor, handler: ICqrsCommandHandler) {
        if (this.aggregateCommandMap.has(commandClass.name)) {
            throw new ReferenceError(`Command "${commandClass.name}" already registered!`)
        }
        this.aggregateCommandMap.set(commandClass.name, { commandClass, handler });
    }

    private async publish(command: CqrsCommand): Promise<void> {
        if (!this.aggregateCommandMap.has(command.constructor.name)) {
            throw new ReferenceError(`Command "${command.constructor.name}" has not been registered!`)
        }
        const commandMapObj = this.aggregateCommandMap.get(command.constructor.name);
        // const commandToBeExec = plainToClass(commandMapObj.commandClass, commandPlain);
        await commandMapObj.handler.execute(command);
    }
}

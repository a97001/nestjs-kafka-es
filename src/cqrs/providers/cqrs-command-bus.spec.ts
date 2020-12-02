import { Test, TestingModule } from '@nestjs/testing';
import { ICqrsCommandHandler } from '../interfaces/ICqrsCommandHandler';
import { CqrsCommand } from '../models/cqrs-command';
import { CqrsCommandBus } from './cqrs-command-bus';

describe('CqrsCommandBus', () => {
  let provider: CqrsCommandBus<CqrsCommand, void>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CqrsCommandBus],
    }).compile();

    provider = module.get<CqrsCommandBus<CqrsCommand, void>>(CqrsCommandBus);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should register command handler', () => {
    class ExapmleCommand extends CqrsCommand {
      public readonly aggregateId: string = this.constructor.name;;

      constructor(content: any) {
        super(content);
      }
    }
    class ExampleCommandHandler implements ICqrsCommandHandler<ExapmleCommand, void> {
      async execute(command: ExapmleCommand): Promise<void> { return; };
    }
    expect(provider.registerCommandHandler(ExapmleCommand, new ExampleCommandHandler()));
  });

  it('should throw error when register command handler twice', async () => {
    class ExapmleCommand extends CqrsCommand {
      public readonly aggregateId: string = this.constructor.name;;

      constructor(content: any) {
        super(content);
      }
    }
    class ExampleCommandHandler implements ICqrsCommandHandler<ExapmleCommand, void> {
      async execute(command: ExapmleCommand): Promise<void> { return; };
    }
    provider.registerCommandHandler(ExapmleCommand, new ExampleCommandHandler());
    expect(() => provider.registerCommandHandler(ExapmleCommand, new ExampleCommandHandler())).toThrow(ReferenceError);
  });

  it('shoud execute command', async () => {
    class ExapmleCommand extends CqrsCommand {
      public readonly aggregateId: string = this.constructor.name;;

      constructor(content: any) {
        super(content);
      }
    }
    class ExampleCommandHandler implements ICqrsCommandHandler<ExapmleCommand, void> {
      async execute(command: ExapmleCommand): Promise<void> { return; };
    }
    provider.registerCommandHandler(ExapmleCommand, new ExampleCommandHandler());
    expect(await provider.execute(new ExapmleCommand({})));
  });

  it('shoud failed to execute command (handler not registered)', async () => {
    class ExapmleCommand extends CqrsCommand {
      public readonly aggregateId: string = this.constructor.name;;

      constructor(content: any) {
        super(content);
      }
    }
    await expect(provider.execute(new ExapmleCommand({}))).rejects.toThrow(ReferenceError);
  });
});

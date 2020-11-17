import { plainToClass } from 'class-transformer';
import { CqrsCommand } from './cqrs-command';


describe('CqrsCommand', () => {
  it('should be defined', () => {
    expect(new CqrsCommand()).toBeDefined();
  });

  it('should auto generate id if no id provided', () => {
    const cqrsCommand = new CqrsCommand();
    expect(cqrsCommand._id).toBeDefined();
    expect(cqrsCommand.createdAt).toBeDefined();
    expect(cqrsCommand.expectedAggregateVersion).toBeDefined();
  });

  it('should not auto generate id if provided', () => {
    const existId = 'id'
    const cqrsCommand = new CqrsCommand(existId);
    expect(cqrsCommand._id).toEqual(existId);
  });
});

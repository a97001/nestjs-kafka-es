import { CqrsCommand } from './cqrs-command';

describe('CqrsCommand', () => {
  it('should be defined', () => {
    expect(new CqrsCommand(0)).toBeDefined();
  });
});

import { ObservableBus } from './observable-bus';

describe('ObservableBus', () => {
  it('should be defined', () => {
    expect(new ObservableBus()).toBeDefined();
  });

  it('should get subject', () => {
    expect(new ObservableBus().subject$).toBeDefined();
  });
});

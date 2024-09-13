import { AppTimer, AppTimerStrings, AppTimerValues, Microseconds } from '../src/apptimer';

class MockAppTimer extends AppTimer {
  private mockTime: number = 0;

  constructor(initialTime: Microseconds = 0) {
    super();
    this._startTime = initialTime;
    this._lastMeasurement = initialTime;
    this.mockTime = initialTime;
  }

  protected now(): Microseconds {
    return this.mockTime;
  }

  public advanceTime(microseconds: Microseconds): void {
    this.mockTime += microseconds;
  }
}

describe('AppTimer', () => {
  let timer: MockAppTimer;

  beforeEach(() => {
    timer = new MockAppTimer();
  });

  it('should measure elapsed time', () => {
    timer.advanceTime(1000 * 1000); // Advance by 1 second
    const result: AppTimerValues = timer.measure();
    expect(result.total).toBe(1000);
    expect(result.interval).toBe(1000);
  });

  it('should reset interval time', () => {
    timer.advanceTime(1000 * 1000);
    timer.resetInterval();
    timer.advanceTime(500 * 1000);
    const result: AppTimerValues = timer.measure();
    expect(result.total).toBe(1500);
    expect(result.interval).toBe(500);
  });

  it('should reset all times', () => {
    timer.advanceTime(1000 * 1000);
    timer.resetAll();
    timer.advanceTime(500 * 1000);
    const result: AppTimerValues = timer.measure();
    expect(result.total).toBe(500);
    expect(result.interval).toBe(500);
  });

  it('should format time as strings', () => {
    timer.advanceTime(1234);
    const result: AppTimerStrings = timer.measureFormatted();
    expect(result.total).toBe('1.234');
    expect(result.interval).toBe('1.234');
  });

  it('should handle multiple measurements', () => {
    timer.advanceTime(1000 * 1000);
    timer.measure();
    timer.advanceTime(500 * 1000);
    const result: AppTimerValues = timer.measure();
    expect(result.total).toBe(1500);
    expect(result.interval).toBe(500);
  });
});

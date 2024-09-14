import { AppTimer, Microseconds } from '../src';

export class MockAppTimer extends AppTimer {
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

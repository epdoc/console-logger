import { Milliseconds } from '@epdoc/timeutil';

export type Microseconds = number;

/**
 * Represents the elapsed time since the start of the program with total and
 * delta properties, where delta is the time since the last call to elapsedTime.
 */
export type ElapsedTime = {
  total: Milliseconds;
  interval: Milliseconds;
};

export type ElapsedTimeString = {
  total: string;
  interval: string;
};

function formatTime(time: Milliseconds): string {
  return time.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/**
 * Measures elapsed time with total and interval properties. Measures in
 * microseconds.
 */
export class Elapsed {
  private _startTime: Microseconds;
  private _lastMeasurement: Microseconds;

  constructor() {
    this._startTime = performance.now();
    this._lastMeasurement = this._startTime;
  }

  /**
   * Resets both the start time and last measurement to the current time.
   * @returns {this} The current instance for method chaining.
   */
  resetAll(): this {
    this._startTime = performance.now();
    this._lastMeasurement = this._startTime;
    return this;
  }

  /**
   * Resets only the last measurement to the current time.
   * @returns {this} The current instance for method chaining.
   */
  resetInterval(): this {
    this._lastMeasurement = performance.now();
    return this;
  }

  /**
   * Measures the elapsed time since the start and last measurement.
   * @returns {ElapsedTime} An object containing total and interval elapsed times in milliseconds.
   */
  measure(): ElapsedTime {
    const now: Microseconds = performance.now();
    const result = {
      total: (now - this._startTime) / 1000,
      interval: (now - this._lastMeasurement) / 1000
    };
    this._lastMeasurement = now;
    return result;
  }

  /**
   * Measures the elapsed time and returns it as formatted strings.
   * @returns {ElapsedTimeString} An object containing formatted total and interval elapsed times.
   */
  measureFormatted(): ElapsedTimeString {
    const result = this.measure();
    return {
      total: formatTime(result.total),
      interval: formatTime(result.interval)
    };
  }
}

/**
 * Measures elapsed time with total and interval properties. Measures in
 * microseconds. Initialized at construction.
 */
export const elapsed = new Elapsed();

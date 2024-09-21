import { isNonEmptyArray, isNonEmptyString } from '@epdoc/typeutil';
import { logLevel, LogLevel, logLevelToValue, LogLevelValue } from './levels';
import { LoggerLine, LoggerLineInstance } from './line';
// import { LoggerState, StateOptions, TimePrefix } from './state';
import { LineTransportOpts, LoggerOptions } from './types';

let reqId = 0;

/**
 * Logger class
 * @example
 * ```typescript
 * const log:LoggerInstance = new Logger();
 * log.info('Hello, world!');
 * ```
 */
export class Logger {
  protected _emitter?: string;
  protected _transportOpts: LineTransportOpts[] = [];
  // protected _msgParams: LogMessage = {};
  // protected _state: LoggerState;
  protected _reqId?: string = String(reqId++);
  protected _line: LoggerLineInstance;
  protected _initialized = false;

  /**
   * Constructor for the Logger class.
   * @param {LoggerOptions} options - The options for the logger.
   */
  constructor(options: LoggerOptions) {
    if (!isNonEmptyString(options.emitter)) {
      throw new Error('Logger requires an emitter');
    }
    if (!isNonEmptyArray(options.transportOpts)) {
      throw new Error('Logger requires transports and transports are managed by the LogManager');
    }
    this._emitter = options.emitter;
    this._transportOpts = options.transportOpts;
    this._line = new LoggerLine(options.transportOpts) as LoggerLineInstance;
  }

  /**
   * Gets the lines stored in memory. Only applicable if keepLines is true.
   * @returns {string[]} The lines stored in memory.
   */
  // get lines(): string[] {
  //   return this._state.lines;
  // }

  setLevelThreshold(val: LogLevel | LogLevelValue): this {
    this._line.setLevelThreshold(logLevelToValue(val));
    return this;
  }

  // setTimePrefix(val: TimePrefix): this {
  //   this._state.setTimePrefix(val);
  //   return this;
  // }

  // setLevelPrefix(val: boolean): this {
  //   this._state.setLevelPrefix(val);
  //   return this;
  // }

  // setTab(val: Integer): this {
  //   this._state.setTab(val);
  //   return this;
  // }

  // setTimer(val: AppTimer): this {
  //   this._state.setAppTimer(val);
  //   return this;
  // }

  // clearLines(): this {
  //   this._state.clearLines();
  //   return this;
  // }

  /**
   * Clears the current line, essentially resetting the output line.
   * @returns {this} The Logger instance.
   */
  clearLine(): this {
    this._line.clear();
    return this;
  }

  skip(...args: any[]): LoggerLineInstance {
    return this.initLine(logLevel.skip, ...args);
  }

  trace(...args: any[]): LoggerLineInstance {
    return this.initLine(logLevel.trace, ...args);
  }

  debug(...args: any[]): LoggerLineInstance {
    return this.initLine(logLevel.debug, ...args);
  }

  verbose(...args: any[]): LoggerLineInstance {
    return this.initLine(logLevel.verbose, ...args);
  }

  info(...args: any[]): LoggerLineInstance {
    return this.initLine(logLevel.info, ...args);
  }

  warn(...args: any[]): LoggerLineInstance {
    return this.initLine(logLevel.warn, ...args);
  }

  error(...args: any[]): LoggerLineInstance {
    return this.initLine(logLevel.error, ...args);
  }

  private initLine(level: LogLevelValue, ...args: any[]): LoggerLineInstance {
    if (this._initialized) {
      const unemitted = this._line.partsAsString();
      throw new Error(`Emit the previous log message before logging a new one: ${unemitted}`);
    }
    return this._line
      .clear()
      .setLevel(level)
      .setInitialString(...args);
  }
}

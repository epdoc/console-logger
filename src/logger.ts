import { Integer } from '@epdoc/typeutil';
import { AppTimer } from './apptimer';
import { logLevel, LogLevel, logLevelToValue, LogLevelValue } from './levels';
import { LoggerLine, LoggerLineInstance, LoggerLineOpts } from './line';
// import { LoggerState, StateOptions, TimePrefix } from './state';
import { StyleInstance } from './styles/color';
import { LoggerTransport } from './transports';
import { LoggerOptions, LoggerShowOpts, LogMessage, TimePrefix } from './types';

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
  protected _showOpts: LoggerShowOpts = {};
  protected _transports: LoggerTransport[] = [];
  protected _style: StyleInstance;
  protected _msgParams: LogMessage = {};
  // protected _state: LoggerState;
  protected _time: TimePrefix = 'local';
  protected _level: LogLevelValue = logLevel.info;
  protected _reqId?: string = String(reqId++);
  protected _action?: string;
  protected _emitter?: string;
  protected _data?: any;
  protected _line: LoggerLineInstance;

  /**
   * Constructor for the Logger class.
   * @param {LoggerOptions} options - The options for the logger.
   */
  constructor(options: LoggerOptions = {}) {
    this._transports = options.transports ??= [];
    this._showOpts = options.show ??= {};
    this._style = options.style ??= new Style();
    const lineOpts: LoggerLineOpts = {
      format: formatOpts
    };

    this._line = new LoggerLine(this._showOpts) as LoggerLineInstance;
  }

  /**
   * Gets the lines stored in memory. Only applicable if keepLines is true.
   * @returns {string[]} The lines stored in memory.
   */
  // get lines(): string[] {
  //   return this._state.lines;
  // }

  get state(): LoggerState {
    return this._state;
  }

  get style(): StyleInstance {
    return this._state.style as StyleInstance;
  }

  setLevel(val: LogLevel | LogLevelValue): this {
    this._state.setLevel(val);
    return this;
  }

  setTimePrefix(val: TimePrefix): this {
    this._state.setTimePrefix(val);
    return this;
  }

  setLevelPrefix(val: boolean): this {
    this._state.setLevelPrefix(val);
    return this;
  }

  setTab(val: Integer): this {
    this._state.setTab(val);
    return this;
  }

  setTimer(val: AppTimer): this {
    this._state.setAppTimer(val);
    return this;
  }

  /**
   * Sets whether to keep lines in memory rather than outputting them immediately to the console.
   * @param {boolean} val - Whether to keep lines in memory.
   * @returns {this} The Logger instance.
   */
  setKeepLines(val: boolean): this {
    this._state.setKeepLines(val);
    return this;
  }

  /**
   * Checks if the logger is enabled for the given log level. This can eliminate
   * running logging code if the log level is not enabled and the logging would
   * not be output anyway.
   * @param {LogLevel} val - The log level to check.
   * @returns {boolean} True if the logger is enabled for the given level, false
   * otherwise.
   */
  isEnabledFor(val: LogLevel | LogLevelValue): boolean {
    return this._state.level <= logLevelToValue(val);
  }

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
    if (!this._line.isEmpty()) {
      const unemitted = this._line.partsAsString();
      throw new Error(`Emit the previous log message before logging a new one: ${unemitted}`);
    }
    this._line.clear().level(level);
    if (this._state.level <= level) {
      this._line.enable();
    }
    if (args.length) {
      const count = countTabsAtBeginningOfString(args[0]);
      if (count) {
        this._line.tab(count);
        args[0] = args[0].slice(count);
      }
    }
    this._line.text(...args);
    return this._line;
  }
}

/** LLM generated function to count and remove tabs at the beginning of a string */
function countTabsAtBeginningOfString(str: string): Integer {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\t') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

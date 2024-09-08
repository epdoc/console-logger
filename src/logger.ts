import { asInt, Integer, isString } from '@epdoc/typeutil';
import { elapsedTime, Style } from './style';

const REG = {
  isDigit: new RegExp(/^\d$/)
};

export enum LogLevel {
  trace = 1,
  debug = 3,
  verbose = 5,
  info = 7,
  warn = 8,
  error = 9
}

/**
 * Checks if the given value is a valid LogLevel.
 * @param {any} val - The value to check.
 * @returns {boolean} True if the value is a valid LogLevel, false otherwise.
 */
export function isLogLevel(val: any): val is LogLevel {
  return [1, 3, 5, 7, 8, 9].includes(val);
}

/**
 * Logger class
 * @example
 * ```typescript
 * const log = new Logger();
 * log.info('Hello, world!');
 * ```
 */
export class Logger {
  protected _level: LogLevel = LogLevel.info;
  protected _elapsed = false;
  protected _pre: string[] = [];
  public mock = {
    enable: false,
    value: []
  };

  /**
   * Creates a new Logger instance.
   * @param {LogLevel} level - The initial log level (default: LogLevel.info).
   */
  constructor(level: LogLevel = LogLevel.info) {
    this.setLevel(level);
  }

  /**
   * Sets the log level.
   * @param {LogLevel | 'trace' | 'debug' | 'verbose' | 'info' | 'error'} level - The log level to set.
   * @returns {this} The Logger instance.
   */
  setLevel(level: LogLevel | 'trace' | 'debug' | 'verbose' | 'info' | 'error'): this {
    if (isLogLevel(level)) {
      this._level = level;
    } else if (isString(level) && REG.isDigit.test(level)) {
      this._level = asInt(level);
    } else if (level === 'trace') {
      this._level = LogLevel.trace;
    } else if (level === 'debug') {
      this._level = LogLevel.debug;
    } else if (level === 'verbose') {
      this._level = LogLevel.verbose;
    } else if (level === 'info') {
      this._level = LogLevel.info;
    } else if (level === 'error') {
      this._level = LogLevel.error;
    }
    return this;
  }

  /**
   * Gets the current log level.
   * @returns {LogLevel} The current log level.
   */
  getLevel(): LogLevel {
    return this._level;
  }

  /**
   * Checks if the logger is enabled for the given log level. This can eliminate
   * running logging code if the log level is not enabled and the logging would
   * not be output anyway.
   * @param {LogLevel} val - The log level to check.
   * @returns {boolean} True if the logger is enabled for the given level, false
   * otherwise.
   */
  isEnabledFor(val: LogLevel): boolean {
    return this._level <= val;
  }

  /**
   * Enables elapsed time logging.
   * @returns {this} The Logger instance.
   * @throws {Error} If elapsed time logging is already enabled.
   */
  elapsed(): this {
    if (this._elapsed === true) {
      throw new Error('log elapsed already set');
    }
    this._elapsed = true;
    return this;
  }

  /**
   * Clears the logger's internal state.
   * @returns {this} The Logger instance.
   */
  clear(): this {
    this._elapsed = false;
    this._pre = [];
    return this;
  }

  /**
   * Adds unformattedtext to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  text(...args: any[]): this {
    this._pre.push(args.join(' '));
    return this;
  }

  /**
   * Adds stringified data to the log message.
   * @param {any} arg - The data to stringify and add.
   * @returns {this} The Logger instance.
   */
  data(arg: any): this {
    this._pre.push(JSON.stringify(arg, null, 2));
    return this;
  }

  /**
   * Adds indentation to the log message.
   * @param {number} n - The number of spaces to indent. The minimum indent is 2.
   * @returns {this} The Logger instance.
   */
  indent(n: Integer = 2): this {
    this._pre.push(' '.repeat(n - 1));
    return this;
  }

  /**
   * Adds indented text to the log message. 'res' stands for 'response', and
   * might be used to indent the response to an action.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  res(...args): this {
    args.unshift(' ');
    this._pre.push(args.join(' '));
    return this;
  }

  /**
   * Adds double-indented text to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  res2(...args): this {
    args.unshift('   ');
    this._pre.push(args.join(' '));
    return this;
  }

  /**
   * Adds styled action text to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  action(...args): this {
    this._pre.push(Style.action(args.join(' ')));
    return this;
  }

  /**
   * Adds a styled h1 header to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  h1(...args): this {
    this._pre.push(Style.h1(args.join(' ')));
    return this;
  }

  /**
   * Adds a styled h2 header to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  h2(...args): this {
    this._pre.push(Style.h2(args.join(' ')));
    return this;
  }

  /**
   * Adds a styled h3 header to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  h3(...args): this {
    this._pre.push(Style.h3(args.join(' ')));
    return this;
  }

  /**
   * Adds a styled label to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  label(...args): this {
    this._pre.push(Style.label(args.join(' ')));
    return this;
  }

  /**
   * Adds a styled value to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  value(...args): this {
    this._pre.push(Style.value(args.join(' ')));
    return this;
  }

  /**
   * Adds a styled path to the log message.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   */
  path(...args): this {
    this._pre.push(Style.path(args.join(' ')));
    return this;
  }

  /**
   * Adds a styled date to the log message.
   * @param {any} arg - The date to add.
   * @returns {this} The Logger instance.
   */
  date(arg): this {
    this._pre.push(Style.date(arg));
    return this;
  }

  /**
   * Adds a styled alert to the log message.
   * @param {any} arg - The alert message to add.
   * @returns {this} The Logger instance.
   */
  alert(arg): this {
    this._pre.push(Style.warn(arg));
    return this;
  }

  /**
   * Adds a styled warning to the log message.
   * @param {...any[]} args - The warning message arguments to add.
   * @returns {this} The Logger instance.
   */
  warn(...args): this {
    this._pre.push(Style.warn('WARNING:'));
    this._pre.push(Style.warn(args.join(' ')));
    return this;
  }

  /**
   * Adds a styled error to the log message.
   * @param {...any[]} args - The error message arguments to add.
   * @returns {this} The Logger instance.
   */
  error(...args): this {
    this._pre.push(Style.error('ERROR:'));
    this._pre.push(Style.error(args.join(' ')));
    return this;
  }

  /**
   * Outputs a trace level log message if the current log level allows it.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  trace(...args): this {
    if (this._level <= LogLevel.trace) {
      return this.output(...args);
    }
    return this.clear();
  }

  /**
   * Outputs a debug level log message if the current log level allows it.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  debug(...args): this {
    if (this._level <= LogLevel.debug) {
      return this.output(...args);
    }
    return this.clear();
  }

  /**
   * Outputs a verbose level log message if the current log level allows it.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  verbose(...args): this {
    if (this._level <= LogLevel.verbose) {
      return this.output(...args);
    }
    return this.clear();
  }

  /**
   * Outputs an info level log message if the current log level allows it.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  info(...args): this {
    if (this._level <= LogLevel.info) {
      return this.output(...args);
    }
    return this.clear();
  }

  /**
   * Outputs the log message.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  output(...args: any[]): this {
    if (this.mock.enable) {
      let line = [...this._pre, ...args].join(' ');
      if (this._elapsed) {
        line += ' ' + elapsedTime();
      }
      this.mock.value.push(line);
    } else {
      if (this._elapsed) {
        console.log(...this._pre, ...args, elapsedTime());
      } else {
        console.log(...this._pre, ...args);
      }
    }
    return this.clear();
  }

  /**
   * Placeholder method for skipping log messages.
   * @param {any} val - The value to potentially skip.
   * @returns {boolean} Always returns false in this implementation.
   */
  skip(val: any): boolean {
    return false;
  }
}

/**
 * Default logger instance.
 */
export const log = new Logger();

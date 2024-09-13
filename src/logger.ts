import { dateUtil } from '@epdoc/timeutil';
import { asInt, Integer, isBoolean, isInteger, isNonEmptyString, isString } from '@epdoc/typeutil';
import { Elapsed, elapsed } from './elapsed';
import { Style, StyleDef, StyleName, StyleOptions } from './style';

const REG = {
  isDigit: new RegExp(/^\d$/)
};

export const logLevel = {
  trace: 1,
  debug: 3,
  verbose: 5,
  info: 7,
  warn: 8,
  error: 9
} as const;

export type LogLevel = keyof typeof logLevel;
export type LogLevelValue = (typeof logLevel)[LogLevel];

function logLevelToValue(level: LogLevel | LogLevelValue): LogLevelValue {
  if (isLogLevelValue(level)) {
    return level;
  } else if (isString(level) && isLogLevelValue(asInt(level))) {
    return asInt(level) as LogLevelValue;
  } else if (level in logLevel) {
    return logLevel[level];
  }
}

/**
 * Checks if the given value is a valid LogLevel.
 * @param {any} val - The value to check.
 * @returns {boolean} True if the value is a valid LogLevel, false otherwise.
 */
export function isLogLevelValue(val: any): val is LogLevelValue {
  return [1, 3, 5, 7, 8, 9].includes(val);
}

export type TimePrefix = 'local' | 'utc' | 'elapsed' | false;

export function isValidTimePrefix(val: any): val is TimePrefix {
  return ['local', 'utc', 'elapsed', false].includes(val);
}

/**
 * Options for the Logger class that are applied across all logger output lines.
 */
export type LoggerOptions = StyleOptions & {
  style?: Style;
  level?: LogLevel | LogLevelValue;
  tab?: Integer;
  levelPrefix?: boolean;
  timePrefix?: TimePrefix;
  elapsed?: Elapsed;
  keepLines?: boolean;
};

/**
 * Logger class
 * @example
 * ```typescript
 * const log:LoggerInstance = new Logger();
 * log.info('Hello, world!');
 * ```
 */
export class Logger {
  protected _style: Style = new Style();
  protected _level: LogLevelValue = logLevel.info;
  protected _tab: Integer = 2;
  protected _levelPrefix = false;
  protected _timePrefix: TimePrefix = false;
  protected _elapsed: Elapsed = elapsed;
  protected _pre: string[] = [];
  protected _showElapsed = false;
  protected _keepLines = false;
  protected _lines = [];
  [key: string]: ((val: any) => this) | any;

  /**
   * Creates a new Logger instance using the default style.
   * @param {LogLevel} level - The initial log level (default: LogLevel.info).
   */
  constructor(
    options: LoggerOptions = {
      level: logLevel.info,
      tab: 2,
      levelPrefix: false,
      timePrefix: 'local',
      elapsed: elapsed,
      keepLines: false
    }
  ) {
    this.setLevel(options.level)
      .setStyle(options.style)
      .setLevelPrefix(options.levelPrefix)
      .setTab(options.tab)
      .setTimePrefix(options.timePrefix)
      .setElapsed(options.elapsed)
      .setKeepLines(options.keepLines);
    this.addStyleMethods();
  }

  /**
   * Sets an alternate style for the logger.
   * @param {Style} style - The style to set.
   */
  setStyle(style: Style): this {
    if (style instanceof Style) {
      this._style = style;
    }
    return this;
  }

  /**
   * Gets the current style.
   * @returns {Style} The current style.
   */
  getStyle(): Style {
    return this._style;
  }

  get lines(): string[] {
    return this._lines;
  }

  /**
   * Sets the log level.
   * @param {LogLevel | 'trace' | 'debug' | 'verbose' | 'info' | 'error'} level - The log level to set.
   * @returns {this} The Logger instance.
   */
  setLevel(level: LogLevel | LogLevelValue): this {
    const val: LogLevelValue = logLevelToValue(level);
    if (isLogLevelValue(val)) {
      this._level = val;
    }
    return this;
  }

  /**
   * Gets the current log level.
   * @returns {LogLevel} The current log level.
   */
  getLevel(): LogLevelValue {
    return this._level;
  }

  /**
   * Sets whether to include a prefix with the log level.
   * @param {boolean} val - Whether to include a prefix with the log level.
   * @returns {this} The Logger instance.
   */
  setLevelPrefix(val: boolean): this {
    if (isBoolean(val)) {
      this._levelPrefix = val;
    }
    return this;
  }

  setTab(val: Integer): this {
    this._tab = isInteger(val) ? val : this._tab;
    return this;
  }

  setTimePrefix(val: TimePrefix): this {
    this._timePrefix = isValidTimePrefix(val) ? val : this._timePrefix;
    return this;
  }

  setElapsed(val: Elapsed): this {
    if (val instanceof Elapsed) {
      this._elapsed = val;
    }
    return this;
  }

  setKeepLines(val: boolean): this {
    if (isBoolean(val)) {
      this._keepLines = val;
    }
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
    return this._level <= logLevelToValue(val);
  }

  /**
   * Enables elapsed time logging for this line of output.
   * @returns {this} The Logger instance.
   * @throws {Error} If elapsed time logging is already enabled.
   */
  elapsed(): this {
    if (this._showElapsed === true) {
      throw new Error('log elapsed already set');
    }
    this.showElapsed = true;
    return this;
  }

  clearLines(): this {
    this._lines = [];
    return this;
  }

  /**
   * Clears the logger's internal state, essentially resetting the output line.
   * @returns {this} The Logger instance.
   */
  clearLine(): this {
    this.showElapsed = false;
    this._pre = [];
    return this;
  }

  /**
   * Adds stringified data to the log message. This text will be formatted with
   * the default style.
   * @param {any} arg - The data to stringify and add.
   * @returns {this} The Logger instance.
   */
  data(arg: any): this {
    this._pre.push(JSON.stringify(arg, null, 2));
    return this;
  }

  /**
   * Indents the log message by this many characters or the string to indent with.
   * @param {Integer | string} n - The number of spaces to indent or the string to indent with.
   * @returns {this} The Logger instance.
   */
  indent(n: Integer | string = 2): this {
    if (isInteger(n)) {
      this._pre.push(' '.repeat(n - 1));
    } else if (isNonEmptyString(n)) {
      this._pre.push(n);
    }
    return this;
  }

  /**
   * Adds indented text to the log message.
   * @param {Integer} n - The number of tabs by which to indent.
   * @returns {this} The Logger instance.
   */
  tab(n: Integer = 1): this {
    this._pre.push(' '.repeat(n * this._tab - 1));
    return this;
  }

  /**
   * Adds indented text to the log message. 'res' stands for 'response', and
   * might be used to indent the response to an action.
   * @param {...any[]} args - The text arguments to add.
   * @returns {this} The Logger instance.
   * @deprecated Use indent() instead.
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
   * @deprecated Use indent() instead.
   */
  res2(...args): this {
    args.unshift('   ');
    this._pre.push(args.join(' '));
    return this;
  }

  /**
   * Adds styled text to the log message.
   * @param {any} val - The value to style.
   * @param {StyleName | StyleDef} style - The style to use.
   * @returns {this} The Logger instance.
   */
  stylize(style: StyleName | StyleDef, ...args): this {
    const styleDef: StyleDef = isNonEmptyString(style) ? this._style.styles[style] : style;
    this._pre.push(this._style.format(args.join(' '), styleDef));
    return this;
  }

  addStyleMethods() {
    for (const name in this._style.styles) {
      (this as any)[name] = (...args: any[]) => this.stylize(name, ...args);
    }
  }

  /**
   * Outputs a trace level log message if the current log level allows it.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  trace(...args): this {
    if (this._level <= logLevel.trace) {
      return this.addPrefix('trace').output(...args);
    }
  }

  /**
   * Outputs a debug level log message if the current log level allows it.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  debug(...args): this {
    if (this._level <= logLevel.debug) {
      return this.addPrefix('debug').output(...args);
    }
  }

  /**
   * Outputs a verbose level log message if the current log level allows it.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  verbose(...args): this {
    if (this._level <= logLevel.verbose) {
      return this.addPrefix('verbose').output(...args);
    }
  }

  /**
   * Outputs an info level log message if the current log level allows it.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  info(...args): this {
    if (this._level <= logLevel.info) {
      return this.addPrefix('info').output(...args);
    }
  }

  warn(...args): this {
    if (this._level <= logLevel.warn) {
      return this.addPrefix('warn').output(...args);
    }
  }

  error(...args): this {
    if (this._level <= logLevel.error) {
      return this.addPrefix('error').output(...args);
    }
  }

  protected addPrefix(level: string) {
    if (this._levelPrefix === true) {
      this._pre.unshift(this._style.levelPrefix(`[${level.toUpperCase()}]`));
    }
    if (this._timePrefix) {
      let time = '';
      if (this._timePrefix === 'elapsed') {
        time = elapsed.measureFormatted().total;
      } else if (this._timePrefix === 'local') {
        time = dateUtil(Date.now()).format('HH:mm:ss');
      } else if (this._timePrefix === 'utc') {
        time = dateUtil(Date.now()).tz('Z').format('HH:mm:ss');
      }
      this._pre.unshift(this._style.timePrefix(time));
    }
    return this;
  }

  /**
   * Outputs the log message.
   * @param {...any[]} args - The message arguments to log.
   * @returns {this} The Logger instance.
   */
  output(...args: any[]): this {
    if (this._keepLines) {
      let line = [...this._pre, ...args].join(' ');
      if (this._showElapsed) {
        const et = this._elapsed.measureFormatted();
        line += ' ' + `${et.total} (${et.interval})`;
      }
      this._lines.push(line);
    } else {
      if (this.showElapsed) {
        const et = this._elapsed.measureFormatted();
        console.log(...this._pre, ...args, `${et.total} (${et.interval})`);
      } else {
        console.log(...this._pre, ...args);
      }
    }
    return this.clearLine();
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

export type LoggerInstance = Logger & Record<StyleName, (...args: any[]) => Logger>;

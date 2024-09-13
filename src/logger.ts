import { asInt, Integer, isInteger, isNonEmptyString, isString } from '@epdoc/typeutil';
import { Style, StyleDef, StyleName, StyleOptions } from './style';
import { elapsedTime } from './util';

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

export type LoggerOptions = StyleOptions & {
  level?: LogLevel | LogLevelValue;
};

/**
 * Logger class
 * @example
 * ```typescript
 * const log = new Logger();
 * log.info('Hello, world!');
 * ```
 */
export class Logger {
  protected _style: Style;
  protected _level: LogLevelValue;
  protected _elapsed = false;
  protected _pre: string[] = [];
  [key: string]: ((val: any) => this) | any;
  public mock = {
    enable: false,
    value: []
  };

  /**
   * Creates a new Logger instance using the default style.
   * @param {LogLevel} level - The initial log level (default: LogLevel.info).
   */
  constructor(options: LoggerOptions = { level: logLevel.info }) {
    this.setLevel(options.level);
    // Set the default style
    this._style = new Style(options);
    this.addStyleMethods();
  }

  /**
   * Sets an alternate style for the logger.
   * @param {Style} style - The style to set.
   * @throws {Error} If the style is not a Style.
   */
  set style(style: Style) {
    if (!(style instanceof Style)) {
      throw new Error('style must be a Style');
    }
    this._style = style;
  }

  /**
   * Gets the current style.
   * @returns {Style} The current style.
   */
  get style(): Style {
    return this._style;
  }

  /**
   * Sets the log level.
   * @param {LogLevel | 'trace' | 'debug' | 'verbose' | 'info' | 'error'} level - The log level to set.
   * @returns {this} The Logger instance.
   */
  setLevel(level: LogLevel | LogLevelValue): this {
    this._level = logLevelToValue(level);
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
   * Indents the log message.
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
   * Indents the log message.
   * @param {Integer | string} n - The number of spaces to indent or the string to indent with.
   * @returns {this} The Logger instance.
   */
  in(n: Integer | string = 2): this {
    return this.indent(n);
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
    if (this._level <= logLevel.debug) {
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
    if (this._level <= logLevel.verbose) {
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
    if (this._level <= logLevel.info) {
      return this.output(...args);
    }
    return this.clear();
  }

  // protected format(val: any, style: StyleName | StyleDef): string {
  //   return this._style.format(val, style);
  // }

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

  // /**
  //  * Adds styled action text to the log message.
  //  * @param {...any[]} args - The text arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  // action(...args): this {
  //   this._pre.push(this.style.format(args.join(' '), this.style.styles.action));
  //   return this;
  // }

  // /**
  //  * Adds a styled h1 header to the log message.
  //  * @param {...any[]} args - The text arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  // h1(...args): this {
  //   this._pre.push(this.format(args.join(' '), 'h1'));
  //   return this;
  // }

  // /**
  //  * Adds a styled h2 header to the log message.
  //  * @param {...any[]} args - The text arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  // h2(...args): this {
  //   this._pre.push(this.format(args.join(' '), 'h2'));
  //   return this;
  // }

  // /**
  //  * Adds a styled h3 header to the log message.
  //  * @param {...any[]} args - The text arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  // h3(...args): this {
  //   this._pre.push(this.format(args.join(' '), 'h3'));
  //   return this;
  // }

  // /**
  //  * Adds a styled label to the log message.
  //  * @param {...any[]} args - The text arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  // label(...args): this {
  //   this._pre.push(this.format(args.join(' '), 'label'));
  //   return this;
  // }

  // /**
  //  * Adds a styled value to the log message.
  //  * @param {...any[]} args - The text arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  // value(...args): this {
  //   this._pre.push(this.format(args.join(' '), 'value'));
  //   return this;
  // }

  // /**
  //  * Adds a styled path to the log message.
  //  * @param {...any[]} args - The text arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  // path(...args): this {
  //   this._pre.push(this.format(args.join(' '), 'path'));
  //   return this;
  // }

  //   /**
  //  * Adds unformatted text to the log message.
  //  * @param {...any[]} args - The text arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  //   text(...args: any[]): this {
  //     this._pre.push(args.join(' '));
  //     return this;
  //   }

  // /**
  //  * Adds a styled date to the log message.
  //  * @param {any} arg - The date to add.
  //  * @returns {this} The Logger instance.
  //  */
  // date(arg): this {
  //   this._pre.push(this.format(arg, 'date'));
  //   return this;
  // }

  // /**
  //  * Adds a styled alert to the log message.
  //  * @param {any} arg - The alert message to add.
  //  * @returns {this} The Logger instance.
  //  */
  // alert(arg): this {
  //   this._pre.push(this.format(arg, 'warn'));
  //   return this;
  // }

  //   /**
  //  * Adds a styled warning to the log message.
  //  * @param {...any[]} args - The warning message arguments to add.
  //  * @returns {this} The Logger instance.
  //  */
  //   warn(...args): this {
  //     this._pre.push(this.format('WARNING:', 'warn'));
  //     this._pre.push(this.format(args.join(' '), 'warn'));
  //     return this;
  //   }

  //   /**
  //    * Adds a styled error to the log message.
  //    * @param {...any[]} args - The error message arguments to add.
  //    * @returns {this} The Logger instance.
  //    */
  //   error(...args): this {
  //     this._pre.push(this.format('ERROR:', 'error'));
  //     this._pre.push(this.format(args.join(' '), 'error'));
  //     return this;
  //   }
}

export type LoggerInstance = Logger & Record<StyleName, (...args: any[]) => Logger>;

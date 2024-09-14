import { dateUtil } from '@epdoc/timeutil';
import { Integer, isInteger, isNonEmptyString } from '@epdoc/typeutil';
import { AppTimer } from './apptimer';
import { getLogLevelString, logLevel, LogLevelValue } from './levels';
import { LoggerState } from './state';
import { StyleDef, StyleName } from './style';

const rightPadAndTruncate = (str: string, length: Integer, char = ' ') => {
  return str.length > length ? str.slice(0, length - 1) : str + char.repeat(length - str.length);
};

export class LoggerLine {
  protected _state: LoggerState;
  protected _parts: string[] = [];
  protected _timer: AppTimer;
  protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;
  protected _enabled = false;

  constructor(state: LoggerState) {
    this._state = state;
    this.addStyleMethods();
  }

  isEmpty(): boolean {
    return this._parts.length === 0;
  }

  /**
   * Enables logging for this line of output. This will be set true by
   * `Logger.initLine()` if the log level for this line is higher than the log
   * level set for the Logger.
   * @returns {this} The LoggerLine instance.
   */
  enable(): this {
    this._enabled = true;
    return this;
  }

  /**
   * Exposed for unit testing only.
   * @returns {Record<string, any>} The current state of the LoggerLine.
   */
  unitState(): Record<string, any> {
    return {
      state: this._state,
      enabled: this._enabled,
      elapsed: this._showElapsed,
      level: this._level
    };
  }

  /**
   * Clears the current line, essentially resetting the output line.
   * @returns {this} The LoggerLine instance.
   */
  clear(): this {
    this._enabled = false;
    this._showElapsed = false;
    this._parts = [];
    return this;
  }

  /**
   * Enables elapsed time logging for this line of output, which will result in
   * the elapsed time being output at the end the log line.
   * @returns {this} The Logger instance.
   * @throws {Error} If elapsed time logging is already enabled.
   */
  elapsed(): this {
    this._showElapsed = true;
    return this;
  }

  level(val: LogLevelValue): this {
    this._level = val;
    return this;
  }

  /**
   * Indents the log message by this many characters or the string to indent with.
   * @param {Integer | string} n - The number of spaces to indent or the string to indent with.
   * @returns {this} The Logger instance.
   */
  indent(n: Integer | string = 2): this {
    if (this._enabled) {
      if (isInteger(n)) {
        this._parts.push(' '.repeat(n - 1));
      } else if (isNonEmptyString(n)) {
        this._parts.push(n);
      }
    }
    return this;
  }

  /**
   * Adds indented text to the log message.
   * @param {Integer} n - The number of tabs by which to indent.
   * @returns {this} The Logger instance.
   */
  tab(n: Integer = 1): this {
    if (this._enabled) {
      this._parts.push(' '.repeat(n * this._state.tab - 1));
    }
    return this;
  }

  /**
   * Adds stringified data to the log message. This text will be formatted with
   * the text style.
   * @param {any} arg - The data to stringify and add.
   * @returns {this} The Logger instance.
   */
  data(arg: any): this {
    if (this._enabled) {
      this._parts.push(JSON.stringify(arg, null, 2));
    }
    return this;
  }

  /**
   * Adds styled text to the log line.
   * @param {any} val - The value to stylize.
   * @param {StyleName | StyleDef} style - The style to use.
   * @returns {this} The Logger instance.
   */
  stylize(style: StyleName | StyleDef, ...args): this {
    if (this._enabled && args.length) {
      const styleDef: StyleDef = isNonEmptyString(style) ? this._state.style.styles[style] : style;
      this._parts.push(this._state.style.format(args.join(' '), styleDef));
    }
    return this;
  }

  protected addLevelPrefix() {
    if (this._state.levelPrefix) {
      let str = `[${getLogLevelString(this._level).toUpperCase()}]`;
      this._parts.unshift(this._state.style.levelPrefix(rightPadAndTruncate(str, 9)));
    }
    return this;
  }

  protected addTimePrefix(): this {
    if (this._state.timePrefix) {
      let time = '';
      if (this._state.timePrefix === 'elapsed') {
        time = this._state.timer.measureFormatted().total;
      } else if (this._state.timePrefix === 'local') {
        time = dateUtil(Date.now()).format('HH:mm:ss');
      } else if (this._state.timePrefix === 'utc') {
        time = dateUtil(Date.now()).tz('Z').format('HH:mm:ss');
      }
      this._parts.unshift(this._state.style.timePrefix(time));
    }
    return this;
  }

  emit(...args: any[]): void {
    if (this._enabled) {
      this.addLevelPrefix().addTimePrefix();
      let line = [...this._parts, ...args].join(' ');
      if (this._showElapsed) {
        const et = this._state.timer.measureFormatted();
        line += ' ' + this.stylize('_elapsed', `${et.total} (${et.interval})`);
      }
      if (this._state.setKeepLines) {
        this._state.lines.push(line);
      } else {
        console.log(line);
      }
      this.clear();
    }
  }

  /**
   * Adds our dynamic style methods to the logger instance.
   * @returns {void}
   */
  private addStyleMethods(): this {
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

    for (const name in this._state.style.styles) {
      if (methodNames.includes(name)) {
        throw new Error(`Cannot declare style with reserved name ${name}`);
      }
      if (!name.startsWith('_')) {
        (this as any)[name] = (...args: any[]) => this.stylize(name, ...args);
      }
    }
    return this;
  }
}

export type LoggerLineInstance = LoggerLine & Record<StyleName, (...args: any[]) => LoggerLine>;

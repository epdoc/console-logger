import { dateUtil } from '@epdoc/timeutil';
import { Integer, isInteger, isNonEmptyArray, isNonEmptyString } from '@epdoc/typeutil';
import { AppTimer } from './apptimer';
import { getLogLevelString, logLevel, LogLevelValue } from './levels';
import { LoggerState } from './state';
import { MethodName, StyleDef, StyleName } from './style';

const rightPadAndTruncate = (str: string, length: Integer, char = ' ') => {
  return str.length > length ? str.slice(0, length - 1) : str + char.repeat(length - str.length);
};

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class LoggerLine {
  protected _state: LoggerState;
  protected _tab: string = '';
  protected _parts: string[] = [];
  protected _suffix: string[] = [];
  protected _timer: AppTimer;
  protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;
  protected _reqId: string;
  protected _sid: string;
  protected _emitter: string;
  protected _action: string;
  protected _enabled = false;

  /**
   * Creates a new LoggerLine.
   * @param {LoggerState} state - The state of the Logger.
   */
  constructor(state: LoggerState) {
    this._state = state;
    this.addStyleMethods();
  }

  /**
   * Returns true if the line is empty.
   * @returns {boolean} - True if the line is empty, false otherwise.
   */
  isEmpty(): boolean {
    return this._parts.length === 0;
  }

  /**
   * Enables logging for this line of output. This will be set true by
   * `Logger.initLine()` if the log level for this line is higher than the log
   * level set for the Logger. By inspecting this value, we can determine if
   * formatting and other code can be skipped.
   * @returns {this} The LoggerLine instance.
   */
  enable(): this {
    this._enabled = true;
    return this;
  }

  /**
   * For logging in an Express or Koa environment, sets the request ID for this
   * line of output. Use is entirely optional.
   * @param {string} id - The request ID.
   * @returns {this} The LoggerLine instance.
   */
  reqId(id: string): this {
    this._reqId = id;
    return this;
  }

  /**
   * Add the session ID for this line of output. Use is entirely optional.
   * @param {string} id - The session ID.
   * @returns {this} The LoggerLine instance.
   */
  sid(id: string): this {
    this._sid = id;
    return this;
  }

  /**
   * Add the emitter for this line of output. The emitter can be a class name,
   * module name, or other identifier. Use is entirely optional.
   * @param {string} name - The emitter name.
   * @returns {this} The LoggerLine instance.
   */
  emitter(name: string): this {
    this._emitter = name;
    return this;
  }

  /**
   * Add the action for this line of output. The action is usually a verb for
   * what this line is doing. Use is entirely optional.
   * @param {string} name - The action name.
   * @returns {this} The LoggerLine instance.
   */
  action(name: string): this {
    this._action = name;
    return this;
  }

  /**
   * Clears the current line, essentially resetting the output line. This does
   * not clear the reqId, sid or emitter values.
   * @returns {this} The LoggerLine instance.
   */
  clear(): this {
    this._enabled = false;
    this._showElapsed = false;
    this._action = undefined;
    this._parts = [];
    this._suffix = [];
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
        this._tab = ' '.repeat(n - 1);
      } else if (isNonEmptyString(n)) {
        this._tab = n;
      }
    }
    return this;
  }

  /**
   * Sets the indentation level of this line of log output..
   * @param {Integer} n - The number of tabs by which to indent.
   * @returns {this} The Logger instance.
   */
  tab(n: Integer = 1): this {
    if (this._enabled) {
      this._tab = ' '.repeat(n * this._state.tabSize - 1);
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
   * Adds a comment to the end of the log line.
   * @param {any} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  comment(...args: string[]): this {
    this._suffix.push(...args);
    return this;
  }

  /**
   * Adds styled text to the log line.
   * @param {any} val - The value to stylize.
   * @param {StyleName | StyleDef} style - The style to use.
   * @returns {this} The Logger instance.
   */
  stylize(style: StyleName | StyleDef, ...args): LoggerLineInstance {
    if (this._enabled && args.length) {
      if (this._state.colorize && this._state.transport.supportsColor) {
        const styleDef: StyleDef = isNonEmptyString(style)
          ? this._state.style.styles[style]
          : style;
        this._parts.push(this._state.style.format(args.join(' '), styleDef));
      } else {
        this._parts.push(...args);
      }
    }
    return this as unknown as LoggerLineInstance;
  }

  /**
   * Adds plain text to the log line.
   * @param {any} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  plain(...args: any[]): this {
    if (this._enabled && isNonEmptyArray(args)) {
      this._parts.push(...args);
    }
    return this;
  }

  /**
   * Emits the log line with elapsed time. This is a convenience method for
   * emitting the log line with elapsed time without having to call `elapsed()`
   * first.
   * @param {any[]} args - The arguments to emit.
   * @returns {void}
   * @see elapsed()
   * @see emit()
   */
  emitWithTime(...args: any[]): void {
    this._showElapsed = true;
    return this.emit(...args);
  }

  /**
   * Emits the log line with elapsed time (Emit With Time = EWT). This is a
   * convenience method for emitting the log line with elapsed time without
   * having to call `elapsed()` first.
   * @param {any[]} args - The arguments to emit.
   * @returns {void}
   * @see elapsed()
   * @see emit()
   * @see emitWithTime()
   */
  ewt(...args: any[]): void {
    this._showElapsed = true;
    return this.emit(...args);
  }

  /**
   * Emits the log line.
   * @param {any[]} args - The arguments to emit.
   * @returns {void}
   * @see ewt()
   * @see emitWithTime()
   */
  emit(...args: any[]): void {
    if (this._enabled) {
      this.addPlain(...args);
      this.addLevelPrefix()
        .addTimePrefix()
        .addPlain(...args)
        .addSuffix()
        .addElapsed();
      const line = this._parts.join(' ');
      this._state.transport.write(this);
      this.clear();
    }
  }

  formatAsString(): string {
    this.addLevelPrefix()
      .addTimePrefix()
      .addReqId()
      .addSid()
      .addEmitter()
      .addAction()
      .addSuffix()
      .addElapsed();
    return this._parts.join(' ');
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

  /**
   * For logging in an Express or Koa environment, adds the request ID to the
   * log line. This is for internal use by the emit method.
   * @returns {this} The LoggerLine instance.
   */
  protected addReqId(): this {
    if (this._reqId) {
      this._parts.unshift(this._state.style.reqId(this._reqId));
    }
    return this;
  }

  /**
   * Adds the session ID to the log line.
   * @returns {this} The LoggerLine instance.
   */
  protected addSid(): this {
    if (this._sid) {
      this._parts.unshift(this._state.style.sid(this._sid));
    }
    return this;
  }

  protected addEmitter(): this {
    if (this._emitter) {
      this._parts.unshift(this._state.style.emitter(this._emitter));
    }
    return this;
  }

  protected addAction(): this {
    if (this._action) {
      this._parts.unshift(this._state.style.action(this._action));
    }
    return this;
  }

  protected addPlain(...args: any[]): this {
    this._parts.push(...args);
    return this;
  }

  protected addSuffix(): this {
    if (this._suffix.length) {
      this.stylize('_suffix', ...this._suffix);
    }
    return this;
  }

  protected addElapsed(): this {
    if (this._showElapsed) {
      const et = this._state.timer.measureFormatted();
      this.stylize('_elapsed', `${et.total} (${et.interval})`);
    }
    return this;
  }

  /**
   * Returns the parts of the line as an unformatted string. This should only be
   * used in situations where the line is not going to be emitted to the console
   * or a log file, but is instead going to be emitted elsewhere, such as in a
   * unit test or error message.
   * @returns {string} - The parts of the line as a string.
   */
  partsAsString(): string {
    return [...this._parts, ...this._suffix].join(' ');
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
   * Adds our dynamic style methods to the logger instance.
   * @returns {void}
   */
  private addStyleMethods(): this {
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

    for (const name in this._state.style.styles) {
      if (!name.startsWith('_')) {
        if (methodNames.includes(name)) {
          throw new Error(`Cannot declare style with reserved name ${name}`);
        }
        (this as any)[name] = (...args: any[]): LoggerLineInstance => {
          this.stylize(name as StyleName, ...args);
          return this as unknown as LoggerLineInstance;
        };
      }
    }
    return this;
  }
}

export type LoggerLineInstance = LoggerLine & {
  [key in MethodName]: (...args: any[]) => LoggerLineInstance; // Ensure dynamic methods return LoggerLineInstance
};

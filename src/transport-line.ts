import { dateUtil } from '@epdoc/timeutil';
import { Integer, isInteger, isNonEmptyString } from '@epdoc/typeutil';
import { AppTimer } from './apptimer';
import { getLogLevelString, logLevel, LogLevelValue } from './levels';
import { Logger } from './logger';
import { Style, StyleName } from './styles/base';
import { LoggerTransport, TransportType } from './transports';
import { LineTransportOpts, LoggerLineFormatOpts, LoggerShowOpts } from './types';

const DEFAULT_TAB_SIZE = 2;

const rightPadAndTruncate = (str: string, length: Integer, char = ' ') => {
  return str.length > length ? str.slice(0, length - 1) : str + char.repeat(length - str.length);
};

export type LoggerLineTransportFormatOpts = Record<TransportType, LoggerLineFormatOpts>;

type MsgPart = {
  str: string;
  style?: StyleName;
};

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class TransportLine {
  protected _logger: Logger;
  // protected _showOpts: LoggerShowOpts;
  // protected _lineFormat: LoggerLineFormatOpts;
  // protected _style: StyleInstance;
  protected _transport: LoggerTransport;
  protected _showOpts: LoggerShowOpts;
  protected _style: Style;
  protected _lineFormat: LoggerLineFormatOpts;
  protected _levelThreshold: LogLevelValue;
  protected _msgParts: MsgPart[] = [];
  protected _suffix: string[] = [];

  protected _msgIndent: string = '';
  protected _timer: AppTimer;
  protected _level: LogLevelValue = logLevel.info;
  protected _showElapsed: boolean = false;
  protected _reqId: string;
  protected _sid: string;
  protected _emitter: string;
  protected _action: string;
  protected _enabled = false;

  constructor(opts: LineTransportOpts) {
    this._transport = opts.transport;
    this._showOpts = opts.show;
    this._style = opts.style;
    this._levelThreshold = opts.levelThreshold;
    this._lineFormat = opts.lineFormat;
    // this._style = options.lineFormat.style ??= new Style() as StyleInstance;
    // this._levelThreshold = levelThreshold;
    this.disableIfThresholdNotMet();
    // this.addStyleMethods();
  }

  setLevelThreshold(val: LogLevelValue): this {
    this._levelThreshold = val;
    this.disableIfThresholdNotMet();
    return this;
  }

  /**
   * Returns true if the line is empty of a composed string message
   * @returns {boolean} - True if the line is empty, false otherwise.
   */
  isEmpty(): boolean {
    return this._msgParts.length === 0;
  }

  get stylizeEnabled(): boolean {
    return this._lineFormat.stylize ?? false;
  }

  get style(): Style {
    return this._style;
  }

  /**
   * If false, disables line processing for this line. This will be set false if
   * the log level for all transports for this line is higher than the log level
   * set for the Logger. By inspecting this value, we can determine if
   * formatting and other code can be skipped, thus improving performance by a
   * picosecond.
   * @returns {this} The LoggerLine instance.
   */
  disableIfThresholdNotMet(): this {
    this._enabled = this._levelThreshold <= this._level;
    return this;
  }

  /**
   * Clears the current line, essentially resetting the output line. This does
   * not clear the reqId, sid or emitter values.
   * @returns {this} The LoggerLine instance.
   */
  clear(): this {
    this._enabled = false;
    this._msgParts = [];
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

  setLevel(val: LogLevelValue): this {
    this._level = val;
    return this;
  }

  get tabSize(): Integer {
    return this._lineFormat.tabSize ?? DEFAULT_TAB_SIZE;
  }

  /**
   * Indents the log message by this many characters or the string to indent with.
   * @param {Integer | string} n - The number of spaces to indent or the string to indent with.
   * @returns {this} The Logger instance.
   */
  indent(n: Integer | string = DEFAULT_TAB_SIZE): this {
    if (this._enabled) {
      if (isInteger(n)) {
        this.addMsgPart(' '.repeat(n - 1));
      } else if (isNonEmptyString(n)) {
        this.addMsgPart(n);
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
      this._msgIndent = ' '.repeat(n * this.tabSize - 1);
    }
    return this;
  }

  addMsgPart(str: string, style?: StyleName): this {
    // const _style = this.stylizeEnabled ? style : undefined;
    this._msgParts.push({ str: str, style: style });
    return this;
  }

  appendMsg(...args: string[]): this {
    this._msgParts.push({ str: args.join(' ') });
    return this;
  }

  appendSuffix(...args: string[]): this {
    this._suffix.push(args.join(' '));
    return this;
  }

  /**
   * Adds styled text to the log line.
   * @param {any} val - The value to stylize.
   * @param {StyleName | StyleDef} style - The style to use.
   * @returns {this} The Logger instance.
   */
  stylize(style: StyleName, ...args): TransportLine {
    if (this._enabled) {
      // const styleDef: StyleDef = isNonEmptyString(style) ? this._style.styles[style] : style;
      this.addMsgPart(args.join(' '), style);
      // if (this.stylizeEnabled && this._state.transport.supportsColor) {
      //   const styleDef: StyleDef = isNonEmptyString(style) ? this._style.styles[style] : style;
      //   this._msgParts.push(this._style.format(args.join(' '), styleDef));
      // } else {
      //   this._msgParts.push(...args);
      // }
    }
    return this;
  }

  /**
   * Adds plain text to the log line.
   * @param {any} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  plain(...args: any[]): this {
    if (this._enabled) {
      this._msgParts.push(...args);
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
      this.addLevelPrefix()
        .addTimePrefix()
        .addReqId()
        .addSid()
        .addEmitter()
        .addAction()
        .addSuffix()
        .addElapsed();

      let parts: string[] = [];
      this._msgParts.forEach((part) => {
        parts.push(this._style.format(part.str, part.style));
      });
      this._transport.write(parts.join(' '));

      // const line = this._msgParts.join(' ');
      // this._state.transport.write(this);
      this.clear();
    }
  }

  /**
   * Returns the parts of the line as a string. This is only used when throwing
   * errors and for testing.
   * @returns {string} - The parts of the line as a string.
   */
  formatAsString(): string {
    this.addLevelPrefix()
      .addTimePrefix()
      .addReqId()
      .addSid()
      .addEmitter()
      .addAction()
      .addSuffix()
      .addElapsed();
    return this._msgParts
      .map((part) => {
        return part.str;
      })
      .join(' ');
  }

  protected addLevelPrefix(): this {
    if (this._showOpts.level) {
      const levelAsString = getLogLevelString(this._level);
      const str = `[${levelAsString.toUpperCase()}]`;
      const styleName = `_${levelAsString.toLowerCase()}Prefix` as StyleName;
      this.addMsgPart(rightPadAndTruncate(str, 9), styleName);
    }
    return this;
  }

  protected addTimePrefix() {
    const timePrefix = this._showOpts.timestamp;
    if (timePrefix) {
      let time = '';
      if (timePrefix === 'elapsed') {
        time = this._timer.measureFormatted().total;
      } else if (timePrefix === 'local') {
        time = dateUtil(Date.now()).format('HH:mm:ss');
      } else if (timePrefix === 'utc') {
        time = dateUtil(Date.now()).tz('Z').format('HH:mm:ss');
      }
      this.addMsgPart(time, '_timePrefix');
    }
    return this;
  }

  /**
   * For logging in an Express or Koa environment, adds the request ID to the
   * log line. This is for internal use by the emit method.
   * @returns {this} The LoggerLine instance.
   */
  protected addReqId(): this {
    if (this._showOpts.reqId) {
      this.addMsgPart(this._reqId, '_reqId');
    }
    return this;
  }

  /**
   * Adds the session ID to the log line.
   * @returns {this} The LoggerLine instance.
   */
  protected addSid(): this {
    if (this._showOpts.sid) {
      this.addMsgPart(this._reqId, '_sid');
      // this._msgParts.unshift(this._state.style.sid(this._sid));
    }
    return this;
  }

  protected addEmitter(): this {
    if (this._showOpts.emitter) {
      this.addMsgPart(this._reqId, '_emitter');
      // this._msgParts.unshift(this._state.style.emitter(this._emitter));
    }
    return this;
  }

  protected addAction(): this {
    if (this._showOpts.action) {
      this.addMsgPart(this._reqId, '_action');
      // this._msgParts.unshift(this._state.style.action(this._action));
    }
    return this;
  }

  // protected addPlain(...args: any[]): this {
  //   this.addMsgPart(args.join(' '), '_plain');
  //   return this;
  // }

  protected addSuffix(): this {
    this.addMsgPart(this._suffix.join(' '), '_suffix');
    return this;
  }

  protected addElapsed(): this {
    if (this._showOpts.elapsed && this._timer) {
      const et = this._timer.measureFormatted();
      this.addMsgPart(`${et.total} (${et.interval})`, '_elapsed');
      // this.stylize('_elapsed', `${et.total} (${et.interval})`);
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
    return [...this._msgParts, ...this._suffix].join(' ');
  }

  /**
   * Exposed for unit testing only.
   * @returns {Record<string, any>} The current state of the LoggerLine.
   */
  unitState(): Record<string, any> {
    return {
      showOpts: this._showOpts,
      enabled: this._enabled,
      elapsed: this._showElapsed,
      level: this._level
    };
  }

  // /**
  //  * Adds our dynamic style methods to the logger instance.
  //  * @returns {void}
  //  */
  // private addStyleMethods(): this {
  //   const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

  //   for (const name in this._lineFormat.style.styles) {
  //     if (!name.startsWith('_')) {
  //       if (methodNames.includes(name)) {
  //         throw new Error(`Cannot declare style with reserved name ${name}`);
  //       }
  //       (this as any)[name] = (...args: any[]): LoggerLineInstance => {
  //         this.stylize(name as StyleName, ...args);
  //         return this as unknown as LoggerLineInstance;
  //       };
  //     }
  //   }
  //   return this;
  // }
}

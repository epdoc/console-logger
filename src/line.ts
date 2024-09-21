import { Integer, isNonEmptyArray } from '@epdoc/typeutil';
import { MethodName } from './../dist/src/style.d';
import { AppTimer } from './apptimer';
import { LogLevelValue } from './levels';
import { Logger } from './logger';
import { defaultStyles, StyleName } from './styles/base';
import { TransportLine } from './transport-line';
import { TransportType } from './transports';
import { LineTransportOpts, LoggerLineFormatOpts } from './types';
import { countTabsAtBeginningOfString } from './util';

const DEFAULT_TAB_SIZE = 2;

const rightPadAndTruncate = (str: string, length: Integer, char = ' ') => {
  return str.length > length ? str.slice(0, length - 1) : str + char.repeat(length - str.length);
};

export type LoggerLineTransportFormatOpts = Record<TransportType, LoggerLineFormatOpts>;

type MsgPart = {
  str: string;
  style: StyleName;
};

/**
 * A LoggerLine is a line of output from a Logger. It is used to build up a log
 * line, add styling, and emit the log line.
 */
export class LoggerLine {
  protected _logger: Logger;
  // protected _showOpts: LoggerShowOpts;
  // protected _lineFormat: LoggerLineFormatOpts;
  // protected _style: StyleInstance;
  protected _transportOpts: LineTransportOpts[];
  protected _transportLines: TransportLine[];
  // protected _msgIndent: string = '';
  // protected _msgParts: MsgPart[] = [];
  // protected _suffix: string[] = [];
  protected _timer: AppTimer;
  // protected _level: LogLevelValue = logLevel.info;
  // protected _levelThreshold: LogLevelValue;
  protected _showElapsed: boolean = false;
  protected _reqId: string;
  protected _sid: string;
  protected _emitter: string;
  protected _action: string;

  constructor(lineTransports: LineTransportOpts[]) {
    lineTransports.forEach((transportOpts) => {
      const transportLine = new TransportLine(transportOpts);
      this._transportLines.push(transportLine);
    });
    // this.disableIfAllThresholdsNotMet();
    this.addStyleMethods();
  }

  /**
   * Changes the level threshold that was initially set. Does so equally for all
   * transports.
   * @param {LogLevelValue} val - The level threshold.
   * @returns {this} The LoggerLine instance.
   */
  setLevelThreshold(val: LogLevelValue): this {
    this._transportLines.forEach((transportLine) => transportLine.setLevelThreshold(val));
    return this;
  }

  setLevel(val: LogLevelValue): this {
    this._transportLines.forEach((transportLine) => transportLine.setLevel(val));
    return this;
  }

  /**
   * Returns true if the line is empty of a composed string message
   * @returns {boolean} - True if the line is empty, false otherwise.
   */
  // isEmpty(): boolean {
  //   return this._msgParts.length === 0;
  // }

  // get stylizeEnabled(): boolean {
  //   return this._lineFormat.stylize ?? false;
  // }

  // get style(): StyleInstance {
  //   return this._style;
  // }

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
    this._showElapsed = false;
    this._action = undefined;
    this._transportLines.forEach((transportLine) => transportLine.clear());
    return this;
  }

  setInitialString(...args: any[]): LoggerLineInstance {
    if (args.length) {
      const count = countTabsAtBeginningOfString(args[0]);
      if (count) {
        this.tab(count);
        args[0] = args[0].slice(count);
      }
    }
    return this.stylize('text', ...args);
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
    this._transportLines.forEach((transportLine) => transportLine.setLevel(val));
    return this;
  }

  /**
   * Indents the log message by this many characters or the string to indent with.
   * @param {Integer | string} n - The number of spaces to indent or the string to indent with.
   * @returns {this} The Logger instance.
   */
  indent(n: Integer | string = DEFAULT_TAB_SIZE): this {
    this._transportLines.forEach((transportLine) => transportLine.indent(n));
    return this;
  }

  /**
   * Sets the indentation level of this line of log output..
   * @param {Integer} n - The number of tabs by which to indent.
   * @returns {this} The Logger instance.
   */
  tab(n: Integer = 1): this {
    this._transportLines.forEach((transportLine) => transportLine.tab(n));
    return this;
  }

  /**
   * Adds stringified data to the log message. This text will be formatted with
   * the text style.
   * @param {any} arg - The data to stringify and add.
   * @returns {this} The Logger instance.
   */
  data(arg: any): this {
    const str = JSON.stringify(arg, null, DEFAULT_TAB_SIZE);
    this._transportLines.forEach((transportLine) => transportLine.addMsgPart(str));
    return this;
  }

  /**
   * Adds a comment to the end of the log line.
   * @param {any} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  comment(...args: string[]): this {
    this._transportLines.forEach((transportLine) => transportLine.appendSuffix(...args));
    return this;
  }

  // addMsgPart(str: string, style?: StyleName): this {
  //   // const _style = this.stylizeEnabled ? style : undefined;
  //   this._msgParts.push({ str: str, style: style });
  //   return this;
  // }

  /**
   * Adds styled text to the log line.
   * @param {any} val - The value to stylize.
   * @param {StyleName | StyleDef} style - The style to use.
   * @returns {this} The Logger instance.
   */
  stylize(style: StyleName, ...args): LoggerLineInstance {
    if (args.length) {
      this._transportLines.forEach((transportLine) => transportLine.stylize(style, ...args));
    }
    return this as unknown as LoggerLineInstance;
  }

  /**
   * Adds plain text to the log line.
   * @param {any} args - The arguments to add.
   * @returns {this} The Logger instance.
   */
  plain(...args: any[]): this {
    if (isNonEmptyArray(args)) {
      this._transportLines.forEach((transportLine) => transportLine.appendMsg(...args));
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
    this.plain(...args);
    this._transportLines.forEach((transportLine) => transportLine.emit());
    this.clear();
  }

  // /**
  //  * Returns the parts of the line as an unformatted string. This should only be
  //  * used in situations where the line is not going to be emitted to the console
  //  * or a log file, but is instead going to be emitted elsewhere, such as in a
  //  * unit test or error message.
  //  * @returns {string} - The parts of the line as a string.
  //  */
  partsAsString(): string {
    return this._transportLines[0].formatAsString();
  }

  // /**
  //  * Exposed for unit testing only.
  //  * @returns {Record<string, any>} The current state of the LoggerLine.
  //  */
  // unitState(): Record<string, any> {
  //   return {
  //     showOpts: this._showOpts,
  //     enabled: this._enabled,
  //     elapsed: this._showElapsed,
  //     level: this._level
  //   };
  // }

  /**
   * Adds our dynamic style methods to the logger instance.
   * @returns {void}
   */
  private addStyleMethods(): this {
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

    for (const name in defaultStyles) {
      if (!name.startsWith('_')) {
        if (methodNames.includes(name)) {
          throw new Error(`Cannot declare style with reserved name ${name}`);
        }
        (this as any)[name] = (...args: any[]): LoggerLineInstance => {
          // @ts-ignore
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

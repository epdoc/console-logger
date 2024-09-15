import { Integer } from '@epdoc/typeutil';
import { isLogLevelValue, logLevel, LogLevelValue } from '../levels';
import { LoggerLine, LoggerLineInstance } from '../line';
import { TimePrefix } from '../state';

let transportId = 0;

export type TransportType =
  | 'console'
  | 'buffer'
  | 'file'
  | 'socket'
  | 'http'
  | 'https'
  | 'stream'
  | 'wss'
  | 'ws';

export type TransportOptions = Partial<{
  level: LogLevelValue;
  timePrefix: TimePrefix;
  levelPrefix: boolean;
  sid: boolean;
  reqId: boolean;
  emitter: boolean;
  action: boolean;
  static: boolean;
  colorize: boolean;
  message: boolean;
}>;

export type LogMessage = {
  time: Date;
  level: LogLevelValue;
  reqId: string;
  sid: string;
  emitter: string;
  action: string;
  message: LoggerLineInstance;
};

export class LoggerTransport {
  protected _id: Integer;
  protected _bReady: boolean = false;
  protected _sType: TransportType = undefined;
  protected _level: LogLevelValue = logLevel.info;
  protected _options: TransportOptions = {};

  constructor(options: TransportOptions) {
    this.setLevel(options.level);
    this._options = options;
    this._id = transportId++;
  }

  get type(): TransportType {
    return this._sType;
  }

  get id(): string {
    return `${this._sType}:${this._id}`;
  }

  get supportsColor(): boolean {
    return false;
  }

  validateOptions() {
    return null;
  }

  /**
   * Return true if this logger is ready to accept write operations.
   * Otherwise the caller should buffer writes and call write when ready is true.
   * @returns {boolean}
   */
  ready(): boolean {
    return this._bReady;
  }

  /**
   * Used to clear the logger display. This is applicable only to certain transports, such
   * as socket transports that direct logs to a UI.
   */
  clear() {}

  async open(): Promise<any> {
    this._bReady = true;
    return Promise.resolve(true);
  }

  async flush(): Promise<void> {
    return Promise.resolve();
  }

  async stop(): Promise<void> {
    return this.end();
  }

  async end(): Promise<void> {
    this._bReady = false;
    return Promise.resolve();
  }

  write(params: LoggerLine): void {}

  setLevel(level: LogLevelValue): this {
    if (isLogLevelValue(level)) {
      this._level = level;
    }
    return this;
  }

  toString() {
    return 'Console';
  }

  getOptions() {
    return undefined;
  }
}

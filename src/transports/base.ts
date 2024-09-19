import { Integer } from '@epdoc/typeutil';
import { isLogLevelValue, logLevel, LogLevelValue } from '../levels';
import { LoggerLineInstance } from '../line';
import { LoggerLineFormatOpts, LoggerShowOpts, TimePrefix } from '../types';
import { TransportType } from './factory';

let transportId = 0;

export type TransportOptions = Partial<{
  name: TransportType; // not required internally
  show: LoggerShowOpts;
  time: TimePrefix;
  levelThreshold: LogLevelValue;
  format: LoggerLineFormatOpts;
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
  protected _levelThreshold: LogLevelValue = logLevel.info;
  protected _options: TransportOptions = {};

  constructor(options: TransportOptions) {
    this.setLevelThreshold(options.levelThreshold);
    this._options = options;
    this._id = transportId++;
  }

  get name(): TransportType {
    return undefined;
  }

  get id(): string {
    return `${this.name}:${this._id}`;
  }

  get supportsColor(): boolean {
    return false;
  }

  setLevelThreshold(level: LogLevelValue): this {
    if (isLogLevelValue(level)) {
      this._levelThreshold = level;
    }
    return this;
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

  write(str: string): void {}

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

  getOptions() {
    return undefined;
  }
}

import { Dict, Integer } from '@epdoc/typeutil';
import { AppTimer } from './apptimer';
import { LogLevelValue } from './levels';
import { LoggerLineInstance } from './line';
import { StyleInstance } from './styles/color';
import { LoggerTransport, TransportOptions } from './transports';

export type TimePrefix = 'local' | 'utc' | 'elapsed' | false;

export function isValidTimePrefix(val: any): val is TimePrefix {
  return ['local', 'utc', 'elapsed', false].includes(val);
}

export type LoggerLineFormatOpts = Partial<{
  tabSize: Integer;
  stylize: boolean;
  style: StyleInstance;
}>;

export type LoggerShowOpts = Partial<{
  timestamp: TimePrefix;
  level: boolean;
  reqId: boolean;
  sid: boolean;
  static: boolean;
  emitter: boolean;
  action: boolean;
  data: boolean;
}>;

export type LineTransportOpts = Partial<{
  transport: LoggerTransport;
  style: StyleInstance;
  levelThreshold: LogLevelValue;
}>;

export type LoggerLineOpts = {
  show: LoggerShowOpts;
  lineFormat: LoggerLineFormatOpts;
  transports: LineTransportOpts[];
};

export type LogMessage = {
  level?: LogLevelValue;
  reqId?: string;
  static?: string;
  action?: string;
  emitter?: string;
  message?: LoggerLineInstance;
  data?: Dict;
};

export type SeparatorOpts = Partial<{
  char: string;
  length: number;
}>;

export type LoggerRunOpts = Partial<{
  /**
   * If true, logging will be enabled immediately without needing to call start().
   * If no transports are provided, a default console transport will be added.
   * @type {boolean}
   */
  autoRun: boolean;

  /**
   * If true, all transports must be ready before messages are written.
   * If false, messages can be written as soon as any transport is ready.
   * @type {boolean}
   */
  allTransportsReady: boolean;
}>;

export type LogManagerOptions = Partial<{
  timer: AppTimer;
  show: LoggerShowOpts;
  separatorOpts: SeparatorOpts;
  levelThreshold: LogLevelValue;
  errorStackThreshold: LogLevelValue;
  run: LoggerRunOpts;
  /**
   * Array of transport options for logging.
   * Each transport must include a 'name' property.
   * @type {TransportOptions[]}
   */
  transports: TransportOptions[];
}>;

export type GetLoggerOptions = Partial<{
  show: LoggerShowOpts;
  separatorOpts: SeparatorOpts;
  transports: TransportOptions[];
  timer: AppTimer;
  reqId: string;
}>;

export type LoggerOptions = Partial<{
  show: LoggerShowOpts;
  separatorOpts: SeparatorOpts;
  transports: LoggerTransport[];
  timer: AppTimer;
  reqId: string;
}>;

import { Dict, Integer } from '@epdoc/typeutil';
import { AppTimer } from './apptimer';
import { LogLevelValue } from './levels';
import { LoggerLineInstance } from './line';
import { Style } from './styles';
import { LoggerTransport, TransportOptions } from './transports';
import { LineTransportOpts } from './types';

export type TimePrefix = 'local' | 'utc' | 'elapsed' | false;

export function isValidTimePrefix(val: any): val is TimePrefix {
  return ['local', 'utc', 'elapsed', false].includes(val);
}

export type LoggerLineFormatOpts = Partial<{
  tabSize: Integer;
  stylize: boolean;
  style: Style;
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
  elapsed: boolean; // not sure if we will show this
}>;

export type LineTransportOpts = Partial<{
  transport: LoggerTransport;
  show: LoggerShowOpts;
  style: Style;
  levelThreshold: LogLevelValue;
  errorStackThreshold: LogLevelValue;
  lineFormat: LoggerLineFormatOpts;
}>;

// export type LoggerLineOpts = {
//   show: LoggerShowOpts;
//   lineFormat: LoggerLineFormatOpts;
//   transports: LineTransportOpts[];
// };

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

export type LogMgrDefaults = Partial<{
  show: LoggerShowOpts;
  style: Style;
  separatorOpts: SeparatorOpts;
  levelThreshold: LogLevelValue;
  errorStackThreshold: LogLevelValue;
}>;

export type LogMgrOpts = Partial<{
  timer: AppTimer;
  defaults: LogMgrDefaults;
  run: LoggerRunOpts;
  /**
   * Array of transport options for logging.
   * Each transport must include a 'name' property.
   * @type {TransportOptions[]}
   */
  transports: TransportOptions[];
}>;

export type GetLoggerOptions = Partial<{
  // separatorOpts: SeparatorOpts;
  transportOpts: LineTransportOpts[];
  timer: AppTimer;
  // reqId: string;
}>;

export type LoggerOptions = Partial<{
  emitter: string;
  transportOpts: LineTransportOpts[];
  timer: AppTimer;
  reqId: string;
}>;

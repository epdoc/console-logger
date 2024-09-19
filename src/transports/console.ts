import { LoggerLine } from '../line';
import { LoggerTransport, TransportOptions } from './base';
import { TransportType } from './factory';

export type ConsoleTransportOpts = TransportOptions & {
  colorize?: boolean;
};

export function getNewConsoleTransport(options: ConsoleTransportOpts): ConsoleTransport {
  return new ConsoleTransport(options);
}

export class ConsoleTransport extends LoggerTransport {
  get supportsColor(): boolean {
    return true;
  }

  get name(): TransportType {
    return 'console';
  }

  // var ConsoleTransportOld = function (options) {
  //   this.options = options || {};
  //   this.bIncludeSid =
  //     this.options.sid === false || this.options.bIncludeSid === false ? false : true;
  //   this.bIncludeStatic = this.options.static === false ? false : true;
  //   this.colorize = this.options.colorize !== false;
  //   this.timestampFormat = this.options.timestamp || 'ms';
  //   this.level = this.options.level;
  //   this.sType = 'console';
  //   this.bReady = true;
  // };

  write(msg: LoggerLine): void {
    const s: string = msg.formatAsString();
    console.log(s);
  }
}

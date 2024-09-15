import { LoggerLine } from '../line';
import { LoggerTransport, TransportType } from './transport';

export class ConsoleTransport extends LoggerTransport {
  protected _sType: TransportType = 'console';

  get supportsColor(): boolean {
    return true;
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

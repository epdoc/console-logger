import { LoggerLine } from '../line';
import { LoggerTransport, TransportType } from './transport';

export class BufferTransport extends LoggerTransport {
  protected _sType: TransportType = 'buffer';
  protected _buffer: string[] = [];

  get supportsColor(): boolean {
    return true;
  }

  write(msg: LoggerLine): void {
    const s: string = msg.formatAsString();
    this._buffer.push(s);
  }

  clear(): void {
    this._buffer = [];
  }
}

import { LoggerLine } from '../line';
import { LoggerTransport, TransportOptions } from './base';
import { TransportType } from './factory';

export type BufferTransportOptions = TransportOptions;

export function getNewBufferTransport(options: BufferTransportOptions): BufferTransport {
  return new BufferTransport(options);
}

export class BufferTransport extends LoggerTransport {
  protected _sType: TransportType = 'buffer';
  protected _buffer: string[] = [];

  get supportsColor(): boolean {
    return true;
  }

  get name(): TransportType {
    return 'buffer';
  }

  write(msg: LoggerLine): void {
    const s: string = msg.formatAsString();
    this._buffer.push(s);
  }

  clear(): void {
    this._buffer = [];
  }
}

import { LoggerTransport, TransportOptions } from './base';
import { getNewBufferTransport } from './buffer';
import { getNewConsoleTransport } from './console';
import { getNewFileTransport } from './file';

export type TransportType = 'console' | 'buffer' | 'file' | string;

export type TransportFactoryMethod = (options: TransportOptions) => LoggerTransport;

export class TransportFactory {
  protected _transports: Record<TransportType, TransportFactoryMethod> = {
    console: getNewConsoleTransport,
    file: getNewFileTransport,
    buffer: getNewBufferTransport
  };

  register(name: string, factoryMethod: TransportFactoryMethod): void {
    this._transports[name] = factoryMethod;
  }

  getTransport(name: string, options: TransportOptions = {}): LoggerTransport {
    let factory = this._transports[name];
    if (!factory) {
      throw new Error(`Transport ${name} not found`);
    }
    return factory(options);
  }
}

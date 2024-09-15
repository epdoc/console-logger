import fs from 'node:fs';
import path from 'path';
import { promisify } from 'util';
import { LoggerLine } from '../line';
import { LoggerTransport, TransportOptions } from './transport';

const mkdir = promisify(fs.mkdir);

export type FileTransportOptions = TransportOptions & {
  filename: string;
};

export class FileTransport extends LoggerTransport {
  protected _filePath: string;
  private _stream: fs.WriteStream | null = null;
  private _buffer: string[] = [];
  private _writable: boolean = true;
  private _ready: boolean = false;

  constructor(options: FileTransportOptions) {
    super(options);
    this._filePath = options.filename;
  }

  /**
   * Opens the write stream to the specified file asynchronously.
   * Creates the parent directory if it does not exist.
   */
  async open(): Promise<void> {
    const dir = path.dirname(this._filePath);
    try {
      await mkdir(dir, { recursive: true }); // Create the directory if it doesn't exist
      this._stream = fs.createWriteStream(this._filePath, { flags: 'a' });
      this._ready = true;

      this._stream.on('error', () => {
        this._writable = false;
      });

      this._stream.on('drain', () => {
        this._writable = true;
        this.flush();
      });

      this._stream.on('close', () => {
        this._ready = false;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Closes the write stream asynchronously.
   */
  async close(): Promise<void> {
    if (this._stream) {
      return new Promise((resolve, reject) => {
        this._stream!.end((err: Error) => {
          if (err) {
            reject(err);
          } else {
            this._stream = null;
            resolve();
          }
        });
      });
    }
  }

  /**
   * Flushes the buffer to the stream if writable.
   */
  async flush(): Promise<void> {
    if (this._buffer.length && this._stream) {
      const flushing = this._buffer.slice();
      this._buffer = [];
      for (const msg of flushing) {
        this._write(msg);
      }
    }
    return Promise.resolve();
  }

  /**
   * Writes a message to the stream or buffer.
   * @param message The message to write.
   */
  write(msg: LoggerLine): void {
    const s: string = msg.formatAsString();
    this._write(s);
  }

  _write(msg: string): void {
    if (this._stream && this._writable) {
      this._writable = this._stream.write(msg + '\n', 'utf8');
    } else {
      this._buffer.push(msg);
      if (!this._stream?.writableFinished) {
        this._stream.once('drain', () => this.flush());
      }
    }
  }
}

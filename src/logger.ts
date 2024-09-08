import { asInt, isString } from '@epdoc/typeutil';
import { Style, elapsedTime } from './style';

const REG = {
  isDigit: new RegExp(/^\d$/)
};

export enum LogLevel {
  trace = 1,
  debug = 3,
  verbose = 5,
  info = 7,
  warn = 8,
  error = 9
}

// const logLevel = {
//   trace: 1,
//   debug: 3,
//   verbose: 5,
//   info: 7,
//   warn: 8,
//   error: 9
// } as const;
// export type LogLevel = (typeof logLevel)[keyof typeof logLevel];

export function isLogLevel(val: any): val is LogLevel {
  return [1, 3, 5, 7, 8, 9].includes(val);
}

export class Logger {
  protected _level: LogLevel = LogLevel.info;
  protected _elapsed = false;
  protected _pre: string[] = [];
  public mock = {
    enable: false,
    value: []
  };

  constructor(level: LogLevel = LogLevel.info) {
    this.setLevel(level);
  }
  setLevel(level: LogLevel | 'trace' | 'debug' | 'verbose' | 'info' | 'error'): this {
    if (isLogLevel(level)) {
      this._level = level;
    } else if (isString(level) && REG.isDigit.test(level)) {
      this._level = asInt(level);
    } else if (level === 'trace') {
      this._level = LogLevel.trace;
    } else if (level === 'debug') {
      this._level = LogLevel.debug;
    } else if (level === 'verbose') {
      this._level = LogLevel.verbose;
    } else if (level === 'info') {
      this._level = LogLevel.info;
    } else if (level === 'error') {
      this._level = LogLevel.error;
    }
    return this;
  }

  getLevel(): LogLevel {
    return this._level;
  }

  isEnabledFor(val: LogLevel): boolean {
    return this._level <= val;
  }

  elapsed(): this {
    if (this._elapsed === true) {
      throw new Error('log elapsed already set');
    }
    this._elapsed = true;
    return this;
  }

  clear(): this {
    this._elapsed = false;
    this._pre = [];
    return this;
  }

  text(...args: any[]): this {
    this._pre.push(args.join(' '));
    return this;
  }

  data(arg: any): this {
    this._pre.push(JSON.stringify(arg, null, 2));
    return this;
  }

  res(...args): this {
    args.unshift(' ');
    this._pre.push(args.join(' '));
    return this;
  }

  res2(...args): this {
    args.unshift('   ');
    this._pre.push(args.join(' '));
    return this;
  }

  action(...args): this {
    this._pre.push(Style.action(args.join(' ')));
    return this;
  }

  h1(...args): this {
    this._pre.push(Style.h1(args.join(' ')));
    return this;
  }

  h2(...args): this {
    this._pre.push(Style.h2(args.join(' ')));
    return this;
  }

  h3(...args): this {
    this._pre.push(Style.h3(args.join(' ')));
    return this;
  }

  label(...args): this {
    this._pre.push(Style.label(args.join(' ')));
    return this;
  }

  value(...args): this {
    this._pre.push(Style.value(args.join(' ')));
    return this;
  }

  path(...args): this {
    this._pre.push(Style.path(args.join(' ')));
    return this;
  }

  date(arg): this {
    this._pre.push(Style.date(arg));
    return this;
  }

  alert(arg): this {
    this._pre.push(Style.warn(arg));
    return this;
  }

  warn(...args): this {
    this._pre.push(Style.warn('WARNING:'));
    this._pre.push(Style.warn(args.join(' ')));
    return this;
  }

  error(...args): this {
    this._pre.push(Style.error('ERROR:'));
    this._pre.push(Style.error(args.join(' ')));
    return this;
  }

  /**
   * Output methods
   * @param args
   * @returns
   */

  trace(...args): this {
    if (this._level <= LogLevel.trace) {
      return this.output(...args);
    }
    return this.clear();
  }

  debug(...args): this {
    if (this._level <= LogLevel.debug) {
      return this.output(...args);
    }
    return this.clear();
  }

  verbose(...args): this {
    if (this._level <= LogLevel.verbose) {
      return this.output(...args);
    }
    return this.clear();
  }

  info(...args): this {
    if (this._level <= LogLevel.info) {
      return this.output(...args);
    }
    return this.clear();
  }

  output(...args: any[]): this {
    if (this.mock.enable) {
      let line = [...this._pre, ...args].join(' ');
      if (this._elapsed) {
        line += ' ' + elapsedTime();
      }
      this.mock.value.push(line);
    } else {
      if (this._elapsed) {
        console.log(...this._pre, ...args, elapsedTime());
      } else {
        console.log(...this._pre, ...args);
      }
    }
    return this.clear();
  }

  skip(val: any): boolean {
    return false;
  }
}

export const log = new Logger();

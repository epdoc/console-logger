import { AppTimer } from './apptimer';
import { logLevel } from './levels';
import { LogManager } from './mgr';
import { TransportOptions } from './transports';
import { LoggerOptions, LogManagerOptions } from './types';

const appTimer = new AppTimer();

const transports: Record<string, TransportOptions> = {
  console: {
    name: 'console',
    format: {
      tabSize: 4,
      stylize: true
    }
  },
  file1: {
    name: 'file',
    filename: 'demo1.log'
  },
  file2: {
    name: 'file',
    filename: 'demo2.log'
  },
  buffer: {
    name: 'buffer',
    format: {
      tabSize: 2,
      stylize: true
    },
    show: {
      timestamp: 'local'
    }
  }
};

const opts: LogManagerOptions = {
  transports: [transports.console, transports.buffer],
  run: {
    autoRun: true
  },
  timer: appTimer,
  show: {
    timestamp: 'elapsed',
    level: true
  },
  levelThreshold: logLevel.info
};

const logMgr = new LogManager(opts);

logMgr.start();

const loggerOpts: LoggerOptions = {
  transports: [transports.file1],
  reqId: '001'
};
const log: LoggerInstance = logMgr.getLogger(loggerOpts);

log.info('Hello, world!');

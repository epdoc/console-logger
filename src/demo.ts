import { AppTimer } from './apptimer';
import { logLevel } from './levels';
import { Logger } from './logger';
import { LogManager } from './mgr';
import { TransportOptions } from './transports';
import { LoggerOptions, LogMgrOpts } from './types';

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

const opts: LogMgrOpts = {
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
const log: Logger = logMgr.getLogger('emitterName');

log.info('Hello, world!');

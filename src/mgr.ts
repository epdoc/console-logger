import { isArray, isDefined, isNonEmptyArray } from '@epdoc/typeutil';
import { AppTimer, Microseconds } from './apptimer';
import { logLevel, LogLevelValue, meetsLogThreshold } from './levels';
import { Logger } from './logger';
import { TransportFactory } from './transports';
import { LoggerTransport, TransportOptions } from './transports/base';
import {
  GetLoggerOptions,
  LoggerOptions,
  LoggerRunOpts,
  LogMessage,
  LogMgrDefaults,
  LogMgrOpts
} from './types';

let mgrIdx = 0;
let emitterIdx = 0;

/**
 * Create a new LogManager object with no transports. Logged messages will not begin
 * writing to the transport until a transport is added and [start()]{@link LogManager#start} is
 * called. Pass in configuration options to configure the logger and transports.
 *
 * <p>To manually add a transport call [addTransport()]{@link LogManager#addTransport}. More than
 * one transport can be configured at the same time. Alternatively the LogManager can be started up
 * immediately by setting <code>options.autoRun</code> to true. In this situation, if
 * <code>options.transports</code> is set, then the specified transports will be used. But if
 * <code>options.transports</code> is not set, then the default {@link ConsoleTransport} is used.
 *
 * <p>It is normal to have one LogManager per application, and to call
 * [get(emitterName)]{@link LogManager#getLogger} to get a new {@link Logger} object for each
 * emitter and then call methods on this {@link Logger} object to log messages.
 *
 * <p>Refer to {@link LogManager#setOptions} for options documentation.
 *
 * @class A LogManager is used to manage logging, including transports, startup, shutdown and
 *   various options.
 * @constructor
 */

export type LogManagerCount = Partial<Record<LogLevelValue, number>>;

export class LogManager {
  protected _defaults: LogMgrDefaults;
  // protected _showOpts: LoggerShowOpts;
  // protected _separatorOpts: SeparatorOpts;
  protected _runOpts: LoggerRunOpts;
  protected _timer: AppTimer;
  // protected _levelThreshold: LogLevelValue;
  // protected _errorStackThreshold: LogLevelValue;

  protected _transports: LoggerTransport[] = [];
  protected _queue: LogMessage[] = [];
  /** have we started logging? */
  protected _running: boolean = false;

  protected _transportFactory: TransportFactory = new TransportFactory();
  protected _count: LogManagerCount = {};

  constructor(options: LogMgrOpts) {
    this.setOptions(options);
    performance.mark('logmgr');
  }

  setOptions(options: LogMgrOpts = {}) {
    // this._showOpts = options.show ??= {};
    // this._timer = options.timer ??= new AppTimer(startTime);
    this._runOpts = options.run ??= { autoRun: true, allTransportsReady: true };
    this._defaults.levelThreshold = this._defaults.levelThreshold ??= logLevel.info;
    this._defaults.errorStackThreshold = this._defaults.errorStackThreshold ??= logLevel.error;
    // this._separatorOpts = options.separatorOpts ??= { char: '#', length: 70 };
    // this._sep = Array(this._sepLen).join(this._sepChar);

    this._running = false;
    if (isArray(options.transports)) {
      options.transports.forEach((transport) => {
        this.addTransport(transport);
      });
    }
  }

  start(): Promise<any> {
    if (!this._running) {
      return Promise.resolve()
        .then(() => {
          if (this._runOpts.autoRun === true) {
            return this.startTransports();
          }
        })
        .then(() => {
          return this.start();
        })
        .then(() => {
          this._running = true;
          return this.flushQueue();
        });
    }
  }

  getTransportByName(name: string, id?: string | number): LoggerTransport {
    return this._transports.find((transport) => {
      if (isDefined(id)) {
        return transport.uid === `${name}:${id}`;
      }
      return transport.name === name;
    });
  }

  addTransport(options: TransportOptions): LoggerTransport {
    const transport = this._transportFactory.getTransport(options.name, options);
    if (transport) {
      this._transports.push(transport);
    }
    return transport;
  }

  /**
   * Starts all transports, if not already started. This enables logs to be written to the
   * transports. It is necessary to manually start the transports if not using the default
   * transport, to allow time for the transports to be setup. Log messages will be buffered until
   * all transports are ready. If there are no transports configured then this method will
   * add the console transport to ensure that there is at least one transport.
   * @param {function} [callback] Called when all transports are ready to receive messages. It is
   *   not normally necessary to wait for this callback.
   * @return {LogManager}
   */
  startTransports(): Promise<any> {
    let jobs = [];
    if (!this._transports.length) {
      this.addTransport({ name: 'console' });
    }
    this._transports.forEach((transport) => {
      jobs.push(this.startTransport(transport));
    });

    return Promise.all(jobs);
  }

  startTransport(transport: LoggerTransport): Promise<void> {
    return transport
      .open()
      .then(() => {
        transport.clear();
        this.logLogMgrMessage({
          level: logLevel.info,
          action: 'logger.start.success',
          message: `Started transport ${transport.name}`
        });
      })
      .catch((err) => {
        // this.logMessage(
        //   this.LEVEL_WARN,
        //   'logger.warn',
        //   "Tried but failed to start transport '" + name + "'. " + err
        // );
        this.removeTransport(transport);
      });
  }

  logger(emitter: string, options: GetLoggerOptions = {}): Logger {
    const opts: LoggerOptions = {
      emitter: (emitter ??= `emitter-${emitterIdx++}`)
    };
    if (isNonEmptyArray(options.transportOpts)) {
      opts.transportOpts = [
        {
          transport: this.getTransportByName('console'),
          show: this._defaults.show,
          style: this._defaults.style,
          levelThreshold: this._defaults.levelThreshold,
          errorStackThreshold: this._defaults.errorStackThreshold
        }
      ];
    } else {
      opts.transportOpts = options.transportOpts;
    }
    return new Logger(opts);
  }

  // function onClose() {
  //   this.logMessage(this.LEVEL_INFO, 'logger.close', "Closed transport '" + name + "'");
  //   this.removeTransport(transport);
  // }
  //}

  /**
   * Remove a particular transport. Pauses log output. The caller should call [start()]{@link
   * LogManager#start} to restart logging.
   * @param transport {string|object} If a string then all transports of this type will be
   *   removed. If an object then all transports that match the object specification will be
   *   removed. Refer to the individual classes' <code>match</code> method.
   * @param {function} [callback] The caller can wait for transports to be flushed and destroyed,
   *   but this is not necessary for normal use.
   * @return {Promise}
   */
  removeTransport(transport: LoggerTransport) {
    this._running = false;
    let remainingTransports = [];
    let jobs = [];
    this._transports.forEach((t) => {
      if (transport.uid === t.uid) {
        jobs.push(t.stop());
        this.logLogMgrMessage({
          level: logLevel.info,
          action: 'logger.transport.remove',
          message: `Removed transport ${t.uid}`,
          data: { transport: t.uid }
        });
      } else {
        remainingTransports.push(t);
      }
    });
    this._transports = remainingTransports;
    return Promise.all(jobs);
  }

  // /**
  //  * Test if this is a known transport
  //  * @param s {string} Name of the transport
  //  * @returns {boolean}
  //  */
  // isValidTransport(s) {
  //   if (_.isString(s) && ['console', 'file', 'callback', 'loggly', 'sos'].indexOf(s) >= 0) {
  //     return true;
  //   }
  //   return false;
  // }

  /**
   * Get the list of currently set transports.
   * @returns {*} The current array of transports. Call type() on the return value to determine
   *   it's type.
   */
  getTransports(): LoggerTransport[] {
    return this._transports;
  }

  /**
   * Log messages may first be written to a buffer (this._queue) if transports
   * are not ready, then flushed. Calling this function will force the queue to
   * be flushed. Normally this function should not need to be called. Will only
   * flush the queue if all transports are ready to receive messages.
   * @returns {LogManager}
   * @private
   */
  private flushQueue() {
    if (this._running && this._queue.length) {
      if (this._transports.length) {
        if (this._runOpts.allTransportsReady || !this.checkIfAllTransportsAreReady()) {
          let nextMsg: LogMessage = this._queue.shift();
          if (nextMsg) {
            this._transports.forEach((transport) => {
              let logLevel = transport.level || nextMsg._logLevel || this.logLevel;
              if (meetsLogThreshold(nextMsg.level, logLevel)) {
                nextMsg._logLevel = undefined;
                transport.write(nextMsg);
              }
            });
            this.flushQueue();
          }
        }
      }
    }
    return this;
  }

  /**
   * Test if all transports are ready to receive messages.
   * @returns {boolean}
   * @private
   */
  private checkIfAllTransportsAreReady() {
    let result = true;
    this._transports.forEach((transport) => {
      if (!transport.ready()) {
        result = false;
      }
    });
    return result;
  }

  /**
   * Set automatically when the epdoc-logger module is initialized, but can be set manually to
   * the earliest known time that the application was started.
   * @param d {Date} The application start time
   * @return {LogManager}
   */
  setStartTime(d: Microseconds | Date | undefined) {
    this._timer.startTime = d;
    return this;
  }

  /**
   * Get the time at which the app or this module was initialized
   * @return {Number} Start time in milliseconds
   */
  getStartTime(): Microseconds {
    return this._timer.startTime;
  }

  /**
   * Return a new {@link Logger} object with the specified emitter name.
   * Although it's a new logger instance, it still uses the same underlying
   * 'writeMessageParams' method, and whatever transport is set globally by this LogManager.
   * @param {string} emitter Name of emitter, module or file, added as a column to log output
   * @param {object} [context] A context object. For Express or koa this would have 'req' and
   *   'res' properties. The context.req may also have reqId and sid/sessionId/session.id
   *   properties that are used to populate their respective columns of output. Otherwise these
   *   columns are left blank on output.
   * @return A new {logger} object.
   */
  getLogger(emitter, context) {
    const options: LoggerOptions = {};
    return new Logger(options);
  }

  /**
   * @deprecated
   */
  get(moduleName, context) {
    return this.getLogger(moduleName, context);
  }

  /**
   * A wrapper for logParams with a more limited set of properties.
   * @param {string} level
   * @param {string} action
   * @param {string} message
   * @param {Object} [data]
   * @return {LogManager}
   * @see {LogManager#logParams}
   */
  logLogMgrMessage(msg: LogMessage) {
    //level: LogLevelValue, action: string, message: string, data: Dict) {
    let params = Object.assign({ emitter: 'logger', timestamp:  }, msg);
    return this.logParams(params);
  }

  /**
   * Write a raw message to the transport. The LogManager will buffer messages to handle the
   * situation where we are switching transports and the new transport is not yet ready. It is
   * possible to log directly to a transport using this method and never need to create a {@link
   * Logger} object.
   *
   * @param {Object} msgParams - The message to be written
   * @param {string} [msgParams.level=info] - Must be one of LEVEL_ORDER values, all lower case
   * @param {string} [msgParams.sid] - sessionID to display
   * @param {string} [msgParams.emitter] - Module or emitter descriptor to display (usually of
   *   form route.obj.function)
   * @param {string} [msgParams.time=now] - A date object with the current time
   * @param {string} [msgParams.timeDiff=calculated] - The difference in milliseconds between
   *   'time' and when the application was started, based on reading {@link
   *   LogManager#getStartTime}
   * @param {string|string[]} msgParams.message - A string or an array of strings. If an array
   *   the string will be printed on multiple lines where supported (e.g. SOS). The string must
   *   already formatted (e.g.. no '%s')
   * @params {string} [logLevel] - Specify the threshold log level above which to display
   *   this log message, overriding the log level set for the LogManager, but not overriding the
   *   setting set for the transport.
   * @return {LogManager}
   */
  logParams(msgParams: LogMessage) {
    let params = Object.assign({ level: logLevel.info }, msgParams);
    if (msgParams && meetsLogThreshold(msgParams.level, this._showOpts.levelThreshold)) {
      this._queue.push(msgParams);
      // if (msgParams.length && msgParams.message && msgParams.message.length > msgParams.length) {
      //   msgParams.message = msgParams.message.substr(0, msgParams.length) + '...';
      // }
      this._count[msgParams.level] = this._count[msgParams.level]
        ? 1
        : this._count[msgParams.level] + 1;
    }
    return this.flushQueue();
  }

  /**
   * Set the {@link LogManager} objects's minimum log level.
   * @param level {string} - Must be one of {@link LogManager#LEVEL_ORDER}
   * @param [options] {Object}
   * @param [options.transports=false] {Boolean} Set the level for all transports as well.
   * @return {LogManager}
   */
  setLevel(level, options) {
    this._showOpts.levelThreshold = level;
    this._transports.forEach((transport) => {
      transport.setLevelThreshold(level);
    });
    return this;
  }

  /**
   * Return true if the level is equal to or greater then the {@link LogManager#logLevel}
   * property.
   * @param level {string} Level that is to be tested
   * @param [thresholdLevel] {string} Threshold level against which <code>level</code> is to be
   *   tested. If this is not supplied then the level will be tested against {@link
   *   LogManager#logLevel}.
   * @return {boolean}
   */
  isAboveLevel(level: LogLevelValue, thresholdLevel: LogLevelValue) {
    return meetsLogThreshold(level, thresholdLevel);
  }

  /**
   * Write a log line to the transport with a count of how many of each level of message has been
   * output. This is a useful function to call when the application is shutdown.
   * @param {string} [message]
   * @return {LogManager}
   */
  writeCount(message: string) {
    const msg: LogMessage = {
      emitter: 'logger',
      action: 'counts',
      data: this._count,
      message: message
    };
    return this.logParams(msg);
  }

  /**
   * Set whether to show an error stack as data when an Error is encountered.
   * This option can also be set in the {@link LogManager} constructor. The property is
   * referenced by {@link Logger} objects when they are created, and is used by the {@link
   * Logger} to determine whether to output an error stack trace in the data column when an
   * Error is logged.
   * @param {boolean} [bShow=true] Set whether to log the call stack for logged errors.
   * @returns {LogManager}
   */
  errorStack(bShow = false): this {
    this._includeErrorStack = bShow === false ? false : true;
    return this;
  }

  /**
   * Return a count object containing a count of the number of log messages produced at the
   * various log levels defined in {@link LogManager#LEVEL_ORDER}.
   * @returns {Object} with properties for 'warn', 'info', etc. where the value of each property
   *   is a number.
   */
  // getCount () {
  //     return this.logCount;
  // }

  /**
   * Stops and removes all transports. Should be called before a shutdown.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  destroying() {
    return this.stopping().then(() => {
      this._transports = [];
    });
  }

  /**
   * Flushes all transport queues, disconnects all logging transports, but leaves the list of
   * transports intact. Call the start method to restart logging and reconnect all transports.
   * @param {function} [callback] - Called with err when complete.
   * @returns {Promise}
   */
  stopping() {
    this._running = false;
    let jobs = [];
    this._transports.forEach((transport) => {
      let job = transport.stop();
      jobs.push(job);
    });
    return Promise.all(jobs);
  }

  /**
   * Flush the buffers for all transports.
   * @returns {Promise}
   */
  flushing() {
    let jobs = [];
    this._transports.forEach((transport) => {
      let job = transport.flush();
      jobs.push(job);
    });
    return Promise.all(jobs);
  }
}

module.exports = LogManager;

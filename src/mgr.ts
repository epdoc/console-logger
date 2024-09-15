import { isArray, isDefined, isNonEmptyString, isString } from '@epdoc/typeutil';
import path from 'node:path';
import { AppTimer, Microseconds } from './apptimer';
import { logLevel, LogLevelValue } from './levels';
import { LoggerLineInstance } from './line';
import { Logger, LoggerOptions } from './logger';
import { LoggerTransport, TransportOptions, TransportType } from './transports/transport';

let mgrIdx = 0;

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
let LogManagerOld = function (options) {
  options || (options = {});
  this.name = 'LogManager#' + ++mgrIdx;
  this.t0 = options.t0 ? options.t0.getTime() : new Date().getTime();
  // Count of how many errors, warnings, etc
  this.logCount = {};

  this.setOptions(options);
};

export type LogManagerOptions = {
  /**
   * Timer instance used for logging timestamps.
   * @type {AppTimer}
   */
  timer: AppTimer;

  /**
   * Indicates whether to show the session ID in log output.
   * @type {boolean}
   */
  showSid: boolean;

  /**
   * Indicates whether to show a static column in log output.
   * @type {boolean}
   */
  showStatic: boolean;

  /**
   * The log level at which messages will be logged.
   * Must be one of the predefined log levels.
   * @type {LogLevelValue}
   */
  defaultLevel: LogLevelValue;

  /**
   * Character used for separator lines in log output.
   * @type {string}
   */
  sepChar: string;

  /**
   * Length of separator lines in log output.
   * @type {number}
   */
  sepLen: number;

  /**
   * Indicates whether to include the error stack in the log output
   * when logging Error objects.
   * @type {boolean}
   */
  errorStack: boolean;

  /**
   * Array of transport options for logging.
   * Each transport must include a 'type' property.
   * @type {TransportOptions[]}
   */
  transports: TransportOptions[];

  /**
   * If true, logging will be enabled immediately without needing to call start().
   * If no transports are provided, a default console transport will be added.
   * @type {boolean}
   */
  autoRun: boolean;

  /**
   * If true, all transports must be ready before messages are written.
   * If false, messages can be written as soon as any transport is ready.
   * @type {boolean}
   */
  allTransportsReady: boolean;

  /**
   * Options for the console transport.
   * @type {TransportOptions}
   */
  consoleOptions: TransportOptions;
};

export class LogManager {
  private _options: LogManagerOptions;
  private _timer: AppTimer;
  private _showSid: boolean;
  private _showStatic: boolean;
  private _defaultLevel: LogLevelValue;
  private _sepChar: string;
  private _sepLen: number;
  private _includeErrorStack: boolean;
  private _transports: LoggerTransport[] = [];
  private _autoRun: boolean;
  private _allTransportsReady: boolean;
  private _queue: LoggerLineInstance[] = [];
  /** have we started logging? */
  private _running: boolean;

  constructor(options: LogManagerOptions) {
    this._options = options;
    this.setOptions(options);
  }

  setOptions(options: LogManagerOptions) {
    this._timer = options.timer;
    this._showSid = options.showSid === true ? true : false;
    this._showStatic = options.showStatic === true ? true : false;
    // Default threshold level for outputting logs
    this._defaultLevel = options.defaultLevel || logLevel.info;
    this._sepLen = options.sepLen ? options.sepLen : 70;
    this._sepChar = options.sepChar ? options.sepChar : '#';
    // this._sep = Array(this._sepLen).join(this._sepChar);
    this._includeErrorStack = options.errorStack === true ? true : false;
    this._running = false;
    this._allTransportsReady = options.allTransportsReady === false ? false : true;
    this._transports = [];
    let transportArray = [];
    if (isArray(options.transports)) {
      transportArray = options.transports;
    } else if (options.transports) {
      transportArray.push(options.transports);
    }
    if (transportArray.length) {
      for (let tdx = 0; tdx < transportArray.length; tdx++) {
        this.addTransport(transportArray[tdx], options[transportArray[tdx]]);
      }
    } else {
      // this.consoleOptions = options.console;
    }
    if (options.autoRun === true) {
      this.start();
    }
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
  start(): Promise<any> {
    if (!this._running) {
      let jobs = [];
      if (!this._transports.length) {
        this.addTransport('console', this._options.consoleOptions);
      }
      if (this._transports.length) {
        this._transports.forEach((transport) => {
          jobs.push(this.startingTransport(transport));
        });
      }
      return Promise.all(jobs)
        .then(() => {
          return this.start();
        })
        .then(() => {
          this._running = true;
          return this.flushQueue();
        });
    }
  }

  startingTransport(transport: LoggerTransport): Promise<void> {
    return transport
      .open()
      .then(() => {
        transport.clear();
        // this.logMessage(
        //   this.LEVEL_INFO,
        //   'logger.start.success',
        //   "Started transport '" + transport.type + "'",
        //);
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

  // function onClose() {
  //   this.logMessage(this.LEVEL_INFO, 'logger.close', "Closed transport '" + name + "'");
  //   this.removeTransport(transport);
  // }
  //}

  /**
   * Add a log transport. Multiple transports can be in operation at the same time, allowing log
   * messages to be sent to more than one destination.
   * If you are adding a transport while logging is on, you should first call logMgr.stopping,
   * add the transport, then call logMgr.start.
   *
   * @param {string|Object} [type] - For the provided loggers, one of 'sos', 'file', 'callback',
   *   'console' or 'loggly'. For a custom transport this should be a transport class object that
   *   can be instantiated with 'new'. To create your own transport class, consider using
   *   getLoggerClass('console') and then subclassing this class. If the params option contains a
   *   'type' property, this field is optional.
   * @param options {Object} These are directly passed to the transport when constructing the new
   *   transport object. Please refer to the individual transport for properties. Some common
   *   properties are listed here.
   * @param [options.sid] {boolean} - If true then output express request and session IDs,
   *   otherwise do not output these values. Default is to use LogManager's sid setting.
   * @param [options.timestamp=ms] {string} - Set the format for timestamp output, must be one of
   *   'ms' or 'iso'.
   * @param [options.static=true] {boolean} - Set whether to output a 'static' column. By default
   *   this inherits the value from the LogManager.
   * @param [options.level=debug] {string} - Log level for this transport.
   * @return {LogManager}
   */
  addTransport(type: TransportType, options: TransportOptions): this {
    let newTransport = this._getNewTransport(type, options);
    if (newTransport) {
      this._running = false;
      this._transports.unshift(newTransport);
      let name = newTransport.toString();
      let topts = newTransport.getOptions();
      let sOptions = topts ? ' (' + JSON.stringify(topts) + ')' : '';
      // this.logMessage(
      //   this.LEVEL_INFO,
      //   'logger.transport.add',
      //   "Added transport '" + name + "'" + sOptions,
      //   { transport: name, options: topts }
      // );
    }
    return this;
  }

  _getNewTransport(type: TransportType | LoggerTransport, options: TransportOptions) {
    let t: TransportType;
    if (type instanceof LoggerTransport) {
      t = type.type;
    } else if (isString(type)) {
      t = type;
    }
    if (!isDefined(options.sid)) {
      options.sid = this._sid;
    }
    if (!isDefined(options.static)) {
      options.static = this.static;
    }
    if (!isDefined(options.level)) {
      options.level = this.logLevel;
    }

    let Transport;
    let name: TransportType;

    if (type) {
      let p = path.resolve(__dirname, 'transports', type);
      Transport = import(p);
      name = type;
    } else if (options) {
      Transport = type;
    } else {
      let p = path.resolve(__dirname, 'transports/console');
      Transport = import(p);
      name = 'console';
    }

    if (Transport) {
      let newTransport = new Transport(options);
      let err = newTransport.validateOptions();
      if (!err) {
        return newTransport;
      } else {
        // this.logMessage(
        //   this.LEVEL_WARN,
        //   'logger.transport.add.warn',
        //   "Could not add transport '" + name + "'. " + err.message,
        //   { options: options }
        // );
        return;
      }
    }
    return this;
  }

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
      if (transport.id === t.id) {
        jobs.push(t.stop());
        // this.logMessage(
        //   this.LEVEL_INFO,
        //   'logger.transport.remove',
        //   "Removed transport '" + t.toString() + "'",
        //   { transport: t.toString() }
        // );
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
   * Return one of the predefined transport classes by name. If you want to define your own class,
   * it is suggested you subclass or copy one of the existing transports.
   * @returns {*} LogManager Class for which you should call new with options, or if creating
   *   your own transport you may subclass this object.
   */
  getTransportByName(type: string) {
    if (isNonEmptyString(type)) {
      // get the transport, dynamically load it if we can, otherwise just return it
      // const transport = require('./transports/' + type);
      // return transport;
    }
  }

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
        if (!this._allTransportsReady || this.checkIfAllTransportsAreReady()) {
          let nextMsg: LoggerLineInstance = this._queue.shift();
          if (nextMsg) {
            this._transports.forEach((transport) => {
              let logLevel = transport.level || nextMsg._logLevel || this.logLevel;
              if (this.isAboveLevel(nextMsg.level, logLevel)) {
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
  logMessage(level, action, message, data) {
    let params = { emitter: 'logger', level: level, action: action, message: message };
    if (data) {
      params.data = data;
    }
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
  logParams(msgParams, logLevel) {
    if (msgParams) {
      if (!msgParams.level) {
        msgParams.level = this.LEVEL_INFO;
      }
      // Set for later comparison
      msgParams._logLevel = logLevel || this.logLevel;
      if (!msgParams.time) {
        msgParams.time = new Date();
      }
      if (!msgParams.timeDiff) {
        msgParams.timeDiff = msgParams.time.getTime() - this.t0;
      }
      this.queue.push(msgParams);
      if (msgParams.length && msgParams.message && msgParams.message.length > msgParams.length) {
        msgParams.message = msgParams.message.substr(0, msgParams.length) + '...';
      }
      this.logCount[msgParams.level] = 1 + (this.logCount[msgParams.level] || 0);
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
    this.logLevel = level;
    if (this.transports) {
      for (let tdx = 0; tdx < this.transports.length; tdx++) {
        let transport = this.transports[tdx];
        transport.setLevel(level);
      }
    }
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
  isAboveLevel(level, thresholdLevel) {
    let threshold = thresholdLevel || this.logLevel;
    if (this.LEVEL_ORDER.indexOf(level) >= this.LEVEL_ORDER.indexOf(threshold)) {
      return true;
    }
    return false;
  }

  /**
   * Write a log line to the transport with a count of how many of each level of message has been
   * output. This is a useful function to call when the application is shutdown.
   * @param {string} [message]
   * @return {LogManager}
   */
  writeCount(message) {
    return this.logParams({
      emitter: 'logger',
      action: 'counts',
      data: this.logCount,
      message: message
    });
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

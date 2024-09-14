import { Integer, isBoolean, isInteger } from '@epdoc/typeutil';
import { AppTimer } from './apptimer';
import { isLogLevelValue, LogLevel, logLevel, logLevelToValue, LogLevelValue } from './levels';
import { Style } from './style';

export type TimePrefix = 'local' | 'utc' | 'elapsed' | false;

export function isValidTimePrefix(val: any): val is TimePrefix {
  return ['local', 'utc', 'elapsed', false].includes(val);
}

/**
 * Configuration options for the Logger.
 * @typedef {Object} LoggerOptions
 * @property {boolean} [enableStyles] - Whether to enable styling of console messages or to leave as plain text. Defaults to false.
 * @property {Style} [style] - Custom Style instance to use for formatting. Defaults to the default style.
 * @property {LogLevel | LogLevelValue} [level] - The minimum log level to output.
 * @property {Integer} [tab] - The number of spaces to use for indentation. Defaults to 2.
 * @property {boolean} [levelPrefix] - Whether to prefix log messages with their level. Defaults to false.
 * @property {TimePrefix} [timePrefix] - The type of time prefix to use ('local', 'utc', 'elapsed', or false). Defaults to false.
 * @property {AppTimer} [timer] - Custom AppTimer instance for tracking time. Defaults to the elapsed time object.
 * @property {boolean} [keepLines] - Whether to keep log lines in memory instead of outputting immediately. Defaults to false.
 */
export type StateOptions = {
  enableStyles?: boolean;
  style?: Style;
  level?: LogLevel | LogLevelValue;
  tab?: Integer;
  levelPrefix?: boolean;
  timePrefix?: TimePrefix;
  timer?: AppTimer;
  keepLines?: boolean;
};

export class LoggerState {
  protected _style: Style = new Style();
  protected _loggerLevel: LogLevelValue = logLevel.info;
  protected _tab: Integer = 2;
  protected _levelPrefix = false;
  protected _timePrefix: TimePrefix = false;
  protected _appTimer: AppTimer = new AppTimer();
  protected _keepLines: boolean = false;
  protected _lines: string[] = [];

  constructor(options: StateOptions) {
    this.setLevel(options.level)
      .setStyle(options.style)
      .setLevelPrefix(options.levelPrefix)
      .setTab(options.tab)
      .setTimePrefix(options.timePrefix)
      .setAppTimer(options.timer)
      .setKeepLines(options.keepLines);
    if (options.enableStyles === true) {
      this._style.enable(true);
    }
  }

  get lines(): string[] {
    return this._lines;
  }

  clearLines(): this {
    this._lines = [];
    return this;
  }

  /**
   * Sets an alternate style for the logger.
   * @param {Style} style - The style to set.
   */
  setStyle(style: Style): this {
    if (style instanceof Style) {
      this._style = style;
    }
    return this;
  }

  /**
   * Gets the current style.
   * @returns {Style} The current style.
   */
  get style(): Style {
    return this._style;
  }

  /**
   * Sets the log level.
   * @param {LogLevel | 'trace' | 'debug' | 'verbose' | 'info' | 'error'} level - The log level to set.
   * @returns {this} The Logger instance.
   */
  setLevel(level: LogLevel | LogLevelValue): this {
    const val: LogLevelValue = logLevelToValue(level);
    if (isLogLevelValue(val)) {
      this._loggerLevel = val;
    }
    return this;
  }

  /**
   * Gets the current log level.
   * @returns {LogLevel} The current log level.
   */
  get level(): LogLevelValue {
    return this._loggerLevel;
  }

  /**
   * Sets whether to include a prefix with the log level.
   * @param {boolean} val - Whether to include a prefix with the log level.
   * @returns {this} The Logger instance.
   */
  setLevelPrefix(val: boolean): this {
    if (isBoolean(val)) {
      this._levelPrefix = val;
    }
    return this;
  }

  get levelPrefix(): boolean {
    return this._levelPrefix;
  }

  /**
   * Sets the number of spaces to use for indentation.
   * @param {Integer} val - The number of spaces to use for indentation.
   * @returns {this} The Logger instance.
   */
  setTab(val: Integer): this {
    this._tab = isInteger(val) ? val : this._tab;
    return this;
  }

  get tab(): Integer {
    return this._tab;
  }

  /**
   * Sets the time prefix.
   * @param {TimePrefix} val - The time prefix to set.
   * @returns {this} The Logger instance.
   */
  setTimePrefix(val: TimePrefix): this {
    this._timePrefix = isValidTimePrefix(val) ? val : this._timePrefix;
    return this;
  }

  get timePrefix(): TimePrefix {
    return this._timePrefix;
  }

  /**
   * Sets the elapsed time object.
   * @param {AppTimer} val - The elapsed time object to set.
   * @returns {this} The Logger instance.
   */
  setAppTimer(val: AppTimer): this {
    if (val instanceof AppTimer) {
      this._appTimer = val;
    }
    return this;
  }

  get timer(): AppTimer {
    return this._appTimer;
  }

  /**
   * Sets whether to keep lines in memory rather than outputting them immediately to the console.
   * @param {boolean} val - Whether to keep lines in memory.
   * @returns {this} The Logger instance.
   */
  setKeepLines(val: boolean): this {
    if (isBoolean(val)) {
      this._keepLines = val;
    }
    return this;
  }

  /**
   * Gets whether to keep lines in memory or output them immediately to the console.
   * @returns {boolean} Whether to keep lines in memory.
   */
  get keepLines(): boolean {
    return this._keepLines;
  }

  /**
   * Checks if the logger is enabled for the given log level. This can eliminate
   * running logging code if the log level is not enabled and the logging would
   * not be output anyway.
   * @param {LogLevel} val - The log level to check.
   * @returns {boolean} True if the logger is enabled for the given level, false
   * otherwise.
   */
  isEnabledFor(val: LogLevel | LogLevelValue): boolean {
    return this._loggerLevel <= logLevelToValue(val);
  }
}

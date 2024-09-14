import { asInt, isString } from '@epdoc/typeutil';

export const logLevel = {
  skip: 0,
  trace: 1,
  debug: 3,
  verbose: 5,
  info: 7,
  warn: 8,
  error: 9
} as const;

export type LogLevel = keyof typeof logLevel;
export type LogLevelValue = (typeof logLevel)[LogLevel];

export function logLevelToValue(level: LogLevel | LogLevelValue): LogLevelValue {
  if (isLogLevelValue(level)) {
    return level;
  } else if (isString(level) && isLogLevelValue(asInt(level))) {
    return asInt(level) as LogLevelValue;
  } else if (level in logLevel) {
    return logLevel[level];
  }
}

/**
 * Checks if the given value is a valid LogLevel.
 * @param {any} val - The value to check.
 * @returns {boolean} True if the value is a valid LogLevel, false otherwise.
 */
export function isLogLevelValue(val: any): val is LogLevelValue {
  return [1, 3, 5, 7, 8, 9].includes(val);
}

/**
 * Converts a LogLevel or LogLevelValue to a LogLevelValue.
 * If the input is a LogLevel, it returns the corresponding LogLevelValue.
 * If the input is a LogLevelValue, it returns the input.
 * If the input is a string representation of a LogLevelValue, it converts and returns the LogLevelValue.
 * @param {LogLevel | LogLevelValue} level - The LogLevel or LogLevelValue to convert.
 * @returns {LogLevelValue} The converted LogLevelValue.
 */
export function getLogLevelString(value: LogLevel | LogLevelValue): LogLevel | undefined {
  return Object.keys(logLevel).find((key) => logLevel[key] === value) as LogLevel | undefined;
}

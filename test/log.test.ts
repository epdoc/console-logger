import { Logger, LogLevel } from '../src';

describe('log', () => {
  describe('constructor', () => {
    it('getLevel default', () => {
      const log1 = new Logger();
      expect(log1.getLevel()).toBe(7);
      expect(log1.isEnabledFor(LogLevel.trace)).toBe(false);
      expect(log1.isEnabledFor(LogLevel.debug)).toBe(false);
      expect(log1.isEnabledFor(LogLevel.verbose)).toBe(false);
      expect(log1.isEnabledFor(LogLevel.info)).toBe(true);
      expect(log1.isEnabledFor(LogLevel.warn)).toBe(true);
      expect(log1.isEnabledFor(LogLevel.error)).toBe(true);
    });
    it('getLevel others', () => {
      const log1 = new Logger(5);
      expect(log1.getLevel()).toBe(5);
      const log2 = new Logger(LogLevel.verbose);
      expect(log2.getLevel()).toBe(5);
      expect(log2.isEnabledFor(LogLevel.trace)).toBe(false);
      expect(log2.isEnabledFor(LogLevel.debug)).toBe(false);
      expect(log2.isEnabledFor(LogLevel.verbose)).toBe(true);
      expect(log2.isEnabledFor(LogLevel.info)).toBe(true);
      expect(log2.isEnabledFor(LogLevel.warn)).toBe(true);
      expect(log2.isEnabledFor(LogLevel.error)).toBe(true);
    });
  });
  describe('text', () => {
    const log1 = new Logger(5);
    log1.mock.enable = true;
    log1.mock.value = [];

    log1.res().h2('hello').info();
    expect(log1.mock.value).toEqual(['  hello']);
  });
  describe('text2', () => {
    const log1 = new Logger(5);
    log1.mock.enable = true;
    log1.mock.value = [];

    it('should log h2 header', () => {
      log1.res().h2('hello').info();
      expect(log1.mock.value).toEqual(['  hello']);
    });

    it('should log h1 header', () => {
      log1.mock.value = [];
      log1.h1('big header').info();
      expect(log1.mock.value).toEqual(['big header']);
    });
    it('should log indented h1 header', () => {
      log1.mock.value = [];
      log1.res2().h1('big header').info();
      expect(log1.mock.value).toEqual(['    big header']);
    });
  });

  describe('log levels', () => {
    let log: Logger;

    beforeEach(() => {
      log = new Logger(LogLevel.debug);
      log.mock.enable = true;
      log.mock.value = [];
    });

    it('should log debug message', () => {
      log.debug('Debug message');
      expect(log.mock.value).toContain('Debug message');
    });

    it('should log info message', () => {
      log.info('Info message');
      expect(log.mock.value).toContain('Info message');
    });

    it('should not log trace message', () => {
      log.trace('Trace message');
      expect(log.mock.value).not.toContain('Trace message');
    });
  });

  describe('setLevel', () => {
    it('should change log level', () => {
      const log = new Logger(LogLevel.info);
      expect(log.isEnabledFor(LogLevel.debug)).toBe(false);
      log.setLevel(LogLevel.debug);
      expect(log.isEnabledFor(LogLevel.debug)).toBe(true);
    });
  });
});

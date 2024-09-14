import { Logger, logLevel } from '../src';

describe('log', () => {
  describe('constructor', () => {
    it('getLevel default', () => {
      const log1: Logger = new Logger({ keepLines: true });
      expect(log1.state.level).toBe(7);
      expect(log1.isEnabledFor(logLevel.trace)).toBe(false);
      expect(log1.isEnabledFor(logLevel.debug)).toBe(false);
      expect(log1.isEnabledFor(logLevel.verbose)).toBe(false);
      expect(log1.isEnabledFor(logLevel.info)).toBe(true);
      expect(log1.isEnabledFor(logLevel.warn)).toBe(true);
      expect(log1.isEnabledFor(logLevel.error)).toBe(true);
    });
    it('getLevel others', () => {
      const log1: Logger = new Logger({ level: 5, keepLines: true });
      expect(log1.state.level).toBe(5);
      const log2: Logger = new Logger({ level: logLevel.verbose, keepLines: true });
      expect(log1.state.level).toBe(5);
      expect(log2.isEnabledFor(logLevel.trace)).toBe(false);
      expect(log2.isEnabledFor(logLevel.debug)).toBe(false);
      expect(log2.isEnabledFor(logLevel.verbose)).toBe(true);
      expect(log2.isEnabledFor(logLevel.info)).toBe(true);
      expect(log2.isEnabledFor(logLevel.warn)).toBe(true);
      expect(log2.isEnabledFor(logLevel.error)).toBe(true);
    });
  });
  describe('text', () => {
    const log1: Logger = new Logger({ level: 1, keepLines: true });
    log1.trace().tab().h2('hello').emit();
    expect(log1.lines).toEqual(['  hello']);
  });
  describe('text2', () => {
    const log1: Logger = new Logger({ level: 5, keepLines: true });

    it('should log h2 header', () => {
      log1.info().tab().h2('hello').emit();
      expect(log1.lines).toEqual(['  hello']);
    });

    it('should log h1 header', () => {
      log1.clearLines();
      log1.info().h1('big header').emit();
      expect(log1.lines).toEqual(['big header']);
    });
    it('should log indented h1 header', () => {
      log1.clearLines();
      log1.info().tab(2).h1('big header').emit();
      expect(log1.lines).toEqual(['    big header']);
    });
  });

  describe('log levels', () => {
    let log: Logger;

    beforeEach(() => {
      log = new Logger({ level: logLevel.debug, keepLines: true });
    });

    it('should log debug message', () => {
      log.debug('Debug message').emit();
      expect(log.lines).toContain('Debug message');
    });

    it('should log info message', () => {
      log.info('Info message').emit();
      expect(log.lines).toContain('Info message');
    });

    it('should not log trace message', () => {
      log.trace('Trace message').emit();
      expect(log.lines).not.toContain('Trace message');
    });
  });

  describe('setLevel', () => {
    it('should change log level', () => {
      const log = new Logger({ level: logLevel.info });
      expect(log.isEnabledFor(logLevel.debug)).toBe(false);
      log.state.setLevel(logLevel.debug);
      expect(log.isEnabledFor(logLevel.debug)).toBe(true);
    });
  });

  describe('tab method', () => {
    let log: Logger;

    beforeEach(() => {
      log = new Logger({ level: logLevel.debug, keepLines: true });
    });

    it('should add indentation to the log message', () => {
      log.info().tab(2).emit('Indented message');
      expect(log.lines).toEqual(['    Indented message']);
    });

    it('should work with chained methods', () => {
      log.info().tab(1).h2('Header').emit('Subtext');
      expect(log.lines).toEqual(['  Header Subtext']);
    });

    it('should reset indentation after log', () => {
      log.info().tab(2).emit('Indented');
      log.info('Not indented').emit();
      expect(log.lines).toEqual(['    Indented', 'Not indented']);
    });
  });

  describe('Logger with level prefixes', () => {
    let log: Logger;

    beforeEach(() => {
      log = new Logger({
        level: logLevel.trace,
        levelPrefix: true,
        timePrefix: 'utc',
        keepLines: true
      });
    });

    it('should prefix trace messages', () => {
      log.trace('Trace message').emit();
      expect(log.lines[0]).toMatch(/^\d{2}:\d{2}:\d{2} \[TRACE\]   Trace message$/);
    });

    it('should fail to output trace message', () => {
      log.state.setLevel('debug');
      log.trace('Trace message').emit();
      expect(log.lines.length).toEqual(0);
    });

    it('should prefix debug messages', () => {
      log.debug('Debug message').emit();
      expect(log.lines[0]).toMatch(/^\d{2}:\d{2}:\d{2} \[DEBUG\]   Debug message$/);
    });

    it('should prefix info messages', () => {
      log.verbose('Verbose message').emit();
      expect(log.lines[0]).toMatch(/^\d{2}:\d{2}:\d{2} \[VERBOSE\] Verbose message$/);
    });

    it('should should fail to output info message', () => {
      log.state.setLevel('info');
      log.verbose('Verbose message').emit();
      expect(log.lines.length).toEqual(0);
    });

    it('should prefix info messages', () => {
      log.info('Info message').emit();
      expect(log.lines[0]).toMatch(/^\d{2}:\d{2}:\d{2} \[INFO\]    Info message$/);
    });

    it('should prefix warn messages', () => {
      log.warn('Warning message').emit();
      expect(log.lines[0]).toMatch(/^\d{2}:\d{2}:\d{2} \[WARN\]    Warning message$/);
    });

    it('should prefix error messages', () => {
      log.error('Error message').emit();
      expect(log.lines[0]).toMatch(/^\d{2}:\d{2}:\d{2} \[ERROR\]   Error message$/);
    });

    it('should work with style methods', () => {
      log.state.setTimePrefix(false);
      log.info().h2('Header').emit('Styled message');
      expect(log.lines).toEqual(['[INFO]    Header Styled message']);
    });

    it('should not prefix when levelPrefix is false', () => {
      const logWithoutPrefix: Logger = new Logger({
        level: logLevel.debug,
        levelPrefix: false,
        keepLines: true
      });

      logWithoutPrefix.info('No prefix').emit();
      expect(logWithoutPrefix.lines).toEqual(['No prefix']);
    });

    it('should throw an error if calling log method before emit', () => {
      expect(() => {
        log.debug('First message');
        log.info('Second message'); // This should throw an error
      }).toThrow('Emit the previous log message before logging a new one');
    });
  });
});

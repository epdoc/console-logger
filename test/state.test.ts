import { LoggerState, logLevel, Style } from '../src';

describe('LoggerState Class', () => {
  let loggerState: LoggerState;

  beforeEach(() => {
    loggerState = new LoggerState({ level: logLevel.info, keepLines: true });
  });

  describe('Constructor', () => {
    it('should initialize with default values', () => {
      expect(loggerState.level).toBe(logLevel.info);
      expect(loggerState.keepLines).toBe(true);
      expect(loggerState.lines).toEqual([]);
    });
  });

  describe('setLevel method', () => {
    it('should set the log level correctly', () => {
      loggerState.setLevel(logLevel.debug);
      expect(loggerState.level).toBe(logLevel.debug);
    });

    it('should not change the log level for invalid values', () => {
      const initialLevel = loggerState.level;
      loggerState.setLevel('invalidLevel' as any);
      expect(loggerState.level).toBe(initialLevel);
    });

    it('should handle setting the level to the same value', () => {
      loggerState.setLevel(logLevel.info);
      expect(loggerState.level).toBe(logLevel.info); // No change
    });
  });

  describe('setStyle method', () => {
    it('should set the style correctly', () => {
      const newStyle = new Style();
      loggerState.setStyle(newStyle);
      expect(loggerState.style).toBe(newStyle);
    });

    it('should not change style if the same style is set', () => {
      const currentStyle = loggerState.style;
      loggerState.setStyle(currentStyle);
      expect(loggerState.style).toBe(currentStyle); // No change
    });
  });

  describe('setKeepLines method', () => {
    it('should set keepLines correctly', () => {
      loggerState.setKeepLines(true);
      expect(loggerState.keepLines).toBe(true);
      loggerState.setKeepLines(false);
      expect(loggerState.keepLines).toBe(false);
    });

    it('should not change keepLines if the same value is set', () => {
      loggerState.setKeepLines(true);
      loggerState.setKeepLines(true); // No change
      expect(loggerState.keepLines).toBe(true);
    });
  });

  describe('isEnabledFor method', () => {
    it('should return true for enabled log levels', () => {
      expect(loggerState.isEnabledFor(logLevel.info)).toBe(true);
      expect(loggerState.isEnabledFor(logLevel.warn)).toBe(true);
    });

    it('should return false for disabled log levels', () => {
      loggerState.setLevel(logLevel.error);
      expect(loggerState.isEnabledFor(logLevel.info)).toBe(false); // Info is lower than error
    });
  });

  describe('clearLines method', () => {
    it('should clear the lines array', () => {
      loggerState.clearLines();
      expect(loggerState.lines).toEqual([]);
    });

    it('should not throw an error when clearing an already empty lines array', () => {
      expect(() => loggerState.clearLines()).not.toThrow();
    });
  });
});

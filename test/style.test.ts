import { Color, ColorStyle, ColorStyleDef, ColorStyleOpts } from '../src';

describe('Style Class', () => {
  let style: ColorStyle;

  beforeEach(() => {
    style = new ColorStyle();
  });

  describe('Constructor', () => {
    it('should initialize with default styles', () => {
      expect(style._styles).toHaveProperty('text');
      expect(style._styles.text.fg).toBe(Color.white);
    });

    it('should initialize with custom styles', () => {
      const customStyles: ColorStyleOpts = {
        styles: {
          custom: { fg: Color.red }
        }
      };
      style = new ColorStyle(customStyles);
      expect(style._styles.custom.fg).toBe(Color.red);
    });
  });

  describe('addStyle method', () => {
    it('should add a new style', () => {
      const newStyle: ColorStyleDef = { fg: Color.blue };
      style.addStyle('newStyle', newStyle);
      expect(style._styles.newStyle).toEqual(newStyle);
    });
  });

  describe('enable method', () => {
    it('should enable color formatting', () => {
      style.enable(true);
      expect(style.colorFormat).toBe(true);
    });

    it('should keep color formatting enabled when called with true', () => {
      style.enable(true);
      style.enable(true);
      expect(style.colorFormat).toBe(true);
    });
  });

  describe('format method', () => {
    it('should format a string without color', () => {
      const result = style.format('Hello', 'text');
      expect(result).toBe('Hello');
    });

    it('should format a string with color', () => {
      style.enable(true);
      const result = style.format('Hello', { fg: Color.green });

      // Create a buffer for the expected output
      const expectedOutput = Buffer.from('\u001b[92mHello\u001b[0m').toString('hex');

      // Create a buffer from the result
      const resultBuffer = Buffer.from(result).toString('hex');

      // Compare the byte values
      expect(expectedOutput).toBe(resultBuffer);
    });

    it('should handle objects and arrays', () => {
      const result = style.format({ key: 'value' }, 'text');
      expect(result).toBe(JSON.stringify({ key: 'value' }));
    });
  });
});

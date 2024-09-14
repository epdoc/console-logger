import { Color, isValidColor, plural } from '../src/util';

describe('Utility Functions', () => {
  describe('plural function', () => {
    it('should return singular form for count 1', () => {
      expect(plural('cat', 1)).toBe('cat');
    });

    it('should return plural form for count greater than 1', () => {
      expect(plural('cat', 2)).toBe('cats');
    });

    it('should return custom plural form if provided', () => {
      expect(plural('child', 2, 'children')).toBe('children');
    });

    it('should return default plural form if no custom plural is provided', () => {
      expect(plural('dog', 3)).toBe('dogs');
    });
  });

  describe('isValidColor function', () => {
    it('should return true for valid color values', () => {
      expect(isValidColor(Color.red)).toBe(true);
      expect(isValidColor(Color.green)).toBe(true);
    });

    it('should return false for invalid color values', () => {
      expect(isValidColor(100)).toBe(false); // Out of range
      expect(isValidColor(-1)).toBe(false); // Negative value
      expect(isValidColor('blue')).toBe(false); // Non-integer value
    });
  });
});

import { Integer, isInteger } from '@epdoc/typeutil';

/**
 * Returns the plural form of a word based on the given count.
 * @param {string} singular - The singular form of the word.
 * @param {Integer} n - The count of items.
 * @param {string} [plural] - The plural form of the word (optional).
 * @returns {string} The plural form of the word.
 */
export function plural(singular: string, n: Integer, plural?: string) {
  if (n === 1) {
    return singular;
  }
  return plural ? plural : singular + 's';
}

export enum Color {
  italic = 3,
  underline = 4,
  inverse = 7,
  black = 30,
  dark_red = 31,
  dark_green = 32,
  yellow = 33,
  dark_blue = 34,
  purple = 35,
  teal = 36,
  gray = 37,
  dark_gray = 90,
  red = 91,
  green = 92,
  orange = 93,
  blue = 94,
  magenta = 95,
  cyan = 96,
  white = 97
}

export function isValidColor(val: any): val is Integer {
  if (isInteger(val)) {
    return val >= Color.black && val <= Color.white;
  }
  return false;
}

/** LLM generated function to count and remove tabs at the beginning of a string */
export function countTabsAtBeginningOfString(str: string): Integer {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '\t') {
      count++;
    } else {
      break;
    }
  }
  return count;
}

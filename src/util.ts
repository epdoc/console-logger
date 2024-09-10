import { Integer, isInteger } from '@epdoc/typeutil';

let tLast = performance.now();
let tStart = tLast;

export function elapsedTime(): string {
  let now = performance.now();
  let t0: number = (now - tLast) / 1000;
  let t1: number = (now - tStart) / 1000;
  tLast = now;
  let s0 = t0.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  let s1 = t1.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return `${s1} (${s0})`;
  // return stylize(`${s1} (${s0})`, styles.elapsed);
}

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

import { dateUtil } from '@epdoc/timeutil';
import { Integer, isArray, isDate, isDict, isInteger } from '@epdoc/typeutil';

let tLast = performance.now();
let tStart = tLast;
let colorFormat: boolean = false;

export function setStyle(val: boolean = true) {
  if (val === true) {
    colorFormat = true;
  }
}

export function elapsedTime(): string {
  let now = performance.now();
  let t0: number = (now - tLast) / 1000;
  let t1: number = (now - tStart) / 1000;
  tLast = now;
  let s0 = t0.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  let s1 = t1.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return Style.elapsed(`${s1} (${s0})`);
}

export function plural(singular: string, n: Integer, plural?: string) {
  if (n === 1) {
    return singular;
  }
  return plural ? plural : singular + 's';
}

// See color codes: https://en.wikipedia.org/wiki/ANSI_escape_code
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
export type ColorOpts = {
  bright?: boolean;
  bg?: boolean;
};
export type StyleName = string;
export type StyleDef = {
  fg?: Color;
  bg?: Color;
};
// export const styles: Record<StyleName, StyleDef> = {
//   h2: { color: Color.blue, opts: { bg: true, bright: false } },
//   h3: { color: Color.green },
//   elapsed: { color: Color.yellow, opts: { bg: true, bright: false } },
//   label: { color: Color.teal },
//   error: { color: Color.red }
// };

function isValidColor(val: any): val is Integer {
  if (isInteger(val)) {
    return val >= Color.black && val <= Color.white;
  }
  return false;
}

type StyleFunction = (s: any) => string;
export const Style: Record<StyleName, StyleFunction> = {
  default: (s: any) => {
    return stylize(s, { fg: Color.white });
  },
  h1: (s: any) => {
    return stylize(s, { fg: Color.magenta });
  },
  h2: (s: any) => {
    return stylize(s, { fg: Color.magenta });
  },
  h3: (s: any) => {
    return stylize(s, { fg: Color.green });
  },
  action: (s: any) => {
    return stylize(s, { fg: Color.black, bg: Color.orange });
  },
  elapsed: (s: any) => {
    return stylize(s, { fg: Color.dark_gray });
  },
  label: (s: any) => {
    return stylize(s, { fg: Color.teal });
  },
  highlight: (s: any) => {
    return stylize(s, { fg: Color.purple });
  },
  value: (s: any) => {
    return stylize(s, { fg: Color.blue });
  },
  path: (s: any) => {
    return stylize(s, { fg: Color.dark_blue });
  },
  date: (s: any) => {
    return stylize(s, { fg: Color.purple });
  },
  error: (s: any) => {
    return stylize(s, { fg: Color.dark_red });
  },
  warn: (s: any) => {
    return stylize(s, { fg: Color.cyan });
  },
  strikethru: (s: any) => {
    return stylize(s, { fg: Color.inverse });
  }
};

export function stylize(val: any, styleDef: StyleDef): string {
  let s = '';
  if (isDict(val) || isArray(val)) {
    s = JSON.stringify(val);
  } else if (isDate(val)) {
    s = dateUtil(val).format('YYYY-MM-dd HH:mm:ss');
  } else {
    s = String(val);
  }
  if (colorFormat === false) {
    return s;
  } else {
    let pre = '';
    let post = '';
    if (isValidColor(styleDef.fg)) {
      pre += `\u001b[${styleDef.fg}m`;
      post = '\u001b[0m';
    }
    if (isValidColor(styleDef.bg)) {
      pre += `\u001b[${styleDef.bg + 10}m`;
      post = '\u001b[0m';
    }
    return `${pre}${s}${post}`;
  }
}

export function color(s: string, c: Color, opts?: ColorOpts): string {
  return s;
}

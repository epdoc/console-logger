import { dateUtil } from '@epdoc/timeutil';
import { isArray, isDate, isDict } from '@epdoc/typeutil';
import { Color, isValidColor } from './util';

export type StyleDef = {
  fg?: Color;
  bg?: Color;
};

export const styles: Record<string, StyleDef> = {
  default: { fg: Color.white },
  h1: { fg: Color.magenta },
  h2: { fg: Color.magenta },
  h3: { fg: Color.green },
  action: { fg: Color.black, bg: Color.orange },
  elapsed: { fg: Color.dark_gray },
  label: { fg: Color.teal },
  highlight: { fg: Color.purple },
  value: { fg: Color.blue },
  path: { fg: Color.dark_blue },
  date: { fg: Color.purple },
  error: { fg: Color.dark_red },
  warn: { fg: Color.cyan },
  strikethru: { fg: Color.inverse }
};
export type StyleName = keyof typeof styles;

export class Style {
  protected colorFormat: boolean = false;
  public readonly styles: Record<string, StyleDef> = Object.assign({}, styles);

  /**
   * Enables or disables color formatting.
   * @param {boolean} [val=true] - If true, color formatting is enabled.
   */
  enable(val: boolean = true) {
    if (val === true) {
      this.colorFormat = true;
    }
  }

  /**
   * Adds a style to the style map or replace an existing style
   * @param {string} name - The name of the style.
   * @param {StyleDef} styleDef - The style definition.
   */
  addStyle(name: string, styleDef: StyleDef) {
    this.styles[name] = styleDef;
  }

  format(val: any, styleDef: StyleDef): string {
    let s = '';
    if (isDict(val) || isArray(val)) {
      s = JSON.stringify(val);
    } else if (isDate(val)) {
      s = dateUtil(val).format('YYYY-MM-dd HH:mm:ss');
    } else {
      s = String(val);
    }
    if (this.colorFormat === false) {
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
}

// export type StyleName = keyof typeof styles;

// type StyleFunction = (s: any) => string;
// export const Style: Record<StyleName, StyleFunction> = {
//   default: (s: any) => {
//     return stylize(s, { fg: Color.white });
//   },
//   h1: (s: any) => {
//     return stylize(s, { fg: Color.magenta });
//   },
//   h2: (s: any) => {
//     return stylize(s, { fg: Color.magenta });
//   },
//   h3: (s: any) => {
//     return stylize(s, { fg: Color.green });
//   },
//   action: (s: any) => {
//     return stylize(s, { fg: Color.black, bg: Color.orange });
//   },
//   elapsed: (s: any) => {
//     return stylize(s, { fg: Color.dark_gray });
//   },
//   label: (s: any) => {
//     return stylize(s, { fg: Color.teal });
//   },
//   highlight: (s: any) => {
//     return stylize(s, { fg: Color.purple });
//   },
//   value: (s: any) => {
//     return stylize(s, { fg: Color.blue });
//   },
//   path: (s: any) => {
//     return stylize(s, { fg: Color.dark_blue });
//   },
//   date: (s: any) => {
//     return stylize(s, { fg: Color.purple });
//   },
//   error: (s: any) => {
//     return stylize(s, { fg: Color.dark_red });
//   },
//   warn: (s: any) => {
//     return stylize(s, { fg: Color.cyan });
//   },
//   strikethru: (s: any) => {
//     return stylize(s, { fg: Color.inverse });
//   }
// };

// export function color(s: string, c: Color, opts?: ColorOpts): string {
//   return s;
// }

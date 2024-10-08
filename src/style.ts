import { dateUtil } from '@epdoc/timeutil';
import { isArray, isDate, isDict } from '@epdoc/typeutil';
import { Color, isValidColor } from './util';

export type StyleDef = {
  fg?: Color;
  bg?: Color;
};

export const styles = {
  text: { fg: Color.white },
  h1: { fg: Color.magenta },
  h2: { fg: Color.magenta },
  h3: { fg: Color.green },
  action: { fg: Color.black, bg: Color.orange },
  label: { fg: Color.teal },
  highlight: { fg: Color.purple },
  value: { fg: Color.blue },
  path: { fg: Color.dark_blue },
  date: { fg: Color.purple },
  warn: { fg: Color.cyan },
  error: { fg: Color.dark_red },
  strikethru: { fg: Color.inverse },
  _elapsed: { fg: Color.dark_gray },
  _levelPrefix: { fg: Color.dark_gray },
  _timePrefix: { fg: Color.dark_gray }
} as const;

export type StyleName = keyof typeof styles;
export type MethodName = Exclude<StyleName, `_${string}`>;

export type StyleOptions = {
  styles?: Record<string, StyleDef>;
};

export class Style {
  protected _colorFormat: boolean = false;
  public readonly styles: Record<string, StyleDef>;
  [key: string]: ((val: any) => string) | any;

  constructor(options: StyleOptions = {}) {
    this.styles = Object.assign({}, options.styles ? options.styles : styles);
    this.addStyleMethods();
  }

  addStyleMethods() {
    for (const name in this.styles) {
      let methodName = name.replace(/^_/, '');
      (this as any)[methodName] = (val: any) => this.format(val, name as StyleName);
    }
  }

  /**
   * Enables or disables color formatting.
   * @param {boolean} [val=true] - If true, color formatting is enabled.
   */
  enable(val: boolean = true) {
    if (val === true) {
      this._colorFormat = true;
    }
  }

  /**
   * Returns the current color format state. colorFormat indicates whether the
   * format method will format the output with ANSI escape codes for color.
   * @returns {boolean} - The current color format state.
   */
  get colorFormat(): boolean {
    return this._colorFormat;
  }

  /**
   * Adds a style to the style map or replace an existing style
   * @param {string} name - The name of the style.
   * @param {StyleDef} styleDef - The style definition.
   */
  addStyle(name: string, styleDef: StyleDef) {
    this.styles[name] = styleDef;
  }

  format(val: any, style: StyleName | StyleDef): string {
    let styleDef = typeof style === 'string' ? this.styles[style] : style;
    let s = '';
    if (isDict(val) || isArray(val)) {
      s = JSON.stringify(val);
    } else if (isDate(val)) {
      s = dateUtil(val).format('YYYY-MM-dd HH:mm:ss');
    } else {
      s = String(val);
    }
    if (this._colorFormat === false) {
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
        post += '\u001b[0m';
      }
      return `${pre}${s}${post}`;
    }
  }
}

// Add this type declaration
export type StyleInstance = Style & Record<StyleName, (val: any) => string>;

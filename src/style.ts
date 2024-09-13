import { dateUtil } from '@epdoc/timeutil';
import { isArray, isDate, isDict } from '@epdoc/typeutil';
import { Color, isValidColor } from './util';

export type StyleDef = {
  fg?: Color;
  bg?: Color;
};

export const styles: Record<string, StyleDef> = {
  // default: { fg: Color.white },
  text: { fg: Color.white },
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

export type StyleOptions = {
  styles?: Record<string, StyleDef>;
};

export class Style {
  protected colorFormat: boolean = false;
  public readonly styles: Record<string, StyleDef>;
  [key: string]: ((val: any) => string) | any;

  constructor(options: StyleOptions = {}) {
    this.styles = Object.assign({}, options.styles ? options.styles : styles);
    this.addStyleMethods();
  }

  addStyleMethods() {
    for (const name in this.styles) {
      (this as any)[name] = (val: any) => this.format(val, name);
    }
  }

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

// Add this type declaration
export type StyleInstance = Style & Record<StyleName, (val: any) => string>;

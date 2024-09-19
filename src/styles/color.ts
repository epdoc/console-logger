import { getLogLevelString, LogLevelValue } from '../levels';
import { Color, isValidColor } from '../util';
import { BaseStyle, StyleOptions } from './base';

export type StyleDef = {
  fg?: Color;
  bg?: Color;
};

/**
 * The default styles for the logger. Styles are defined as a key-value pair
 * where the key is the name of the style and the value is the style definition.
 * The style definition is an object with optional fg and bg properties. The fg
 * property is the foreground color. The bg property is the background color.
 *
 * The constructors for both the Style and LoggerLine classes add methods for
 * each of these styles. Styles that begin with an underscore are only added as
 * style methods to the Style class.
 */
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
  _reqId: { fg: Color.orange },
  _sid: { fg: Color.yellow },
  _emitter: { fg: Color.green },
  _action: { fg: Color.blue },
  _plain: { fg: Color.white },
  _suffix: { fg: Color.dark_gray },
  _elapsed: { fg: Color.dark_gray },
  _errorPrefix: { fg: Color.dark_red },
  _warnPrefix: { fg: Color.cyan },
  _levelPrefix: { fg: Color.dark_gray },
  _timePrefix: { fg: Color.dark_gray }
} as const;

export type ColorStyleName = keyof typeof styles;

export type ColorStyleOpts = StyleOptions & {
  styles?: Record<string, StyleDef>;
};

export class ColorStyle extends BaseStyle {
  public readonly styles: Record<string, StyleDef>;
  [key: string]: ((val: any) => string) | any;

  constructor(options: ColorStyleOpts = {}) {
    super(options);
    this.styles = Object.assign({}, options.styles ? options.styles : styles);
    this.addStyleMethods();
  }

  get styles(): ColorStyleName[] {
    return Object.keys(styles);
  }

  getStyleDef(name: ColorStyleName): StyleDef {
    return this.styles[name];
  }

  getLevelStyleName(level: LogLevelValue): ColorStyleName {
    const styleName = `${getLogLevelString(level)}Prefix` as ColorStyleName;
    if (styles['_' + styleName]) {
      return styleName;
    }
    return '_levelPrefix';
  }

  // addStyleMethods() {
  //   for (const name in this.styles) {
  //     let methodName = name.replace(/^_/, '');
  //     (this as any)[methodName] = (val: any) => this.format(val, name as ColorStyleName);
  //   }
  // }

  /**
   * Adds a style to the style map or replace an existing style
   * @param {string} name - The name of the style.
   * @param {StyleDef} styleDef - The style definition.
   */
  // addStyle(name: string, styleDef: StyleDef) {
  //   this.styles[name] = styleDef;
  // }

  format(val: any, style: ColorStyleName | StyleDef): string {
    const s = super.format(val);
    let styleDef = typeof style === 'string' ? this.styles[style] : style;
    if (!styleDef) {
      return s;
    } else if (styleDef) {
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

// // Add this type declaration
// export type StyleInstance = ColorStyle & Record<ColorStyleName, (val: any) => string>;

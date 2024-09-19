import { dateUtil } from '@epdoc/timeutil';
import { isArray, isDate, isDict } from '@epdoc/typeutil';
import { LogLevelValue } from '../levels';

export type StyleName = string;

export const styles = {
  text: {},
  h1: {},
  h2: {},
  h3: {},
  action: {},
  label: {},
  highlight: {},
  value: {},
  path: {},
  date: {},
  warn: {},
  error: {},
  strikethru: {}
} as const;

export type StyleOptions = {
  dateFormat?: string;
};

export class BaseStyle {
  protected _dateFormat: string;

  constructor(options: StyleOptions = { dateFormat: 'YYYY-MM-dd HH:mm:ss' }) {
    this._dateFormat = options.dateFormat;
  }

  get styles(): StyleName[] {
    return Object.keys(styles);
  }

  format(val: any, style?: StyleName | any): string {
    if (isDict(val) || isArray(val)) {
      return JSON.stringify(val);
    } else if (isDate(val)) {
      return dateUtil(val).format(this._dateFormat);
    }
    return String(val);
  }

  getLevelStyleName(level: LogLevelValue): StyleName {
    return null;
  }
}

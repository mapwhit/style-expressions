import assert from 'assert';
import Color from '../util/color.js';
import { Collator } from './types/collator.js';
import { Formatted } from './types/formatted.js';
import {
  array,
  BooleanType,
  CollatorType,
  ColorType,
  FormattedType,
  NullType,
  NumberType,
  ObjectType,
  StringType,
  ValueType
} from './types.js';

export { Color, Collator };

export function validateRGBA(r, g, b, a) {
  if (
    !(
      typeof r === 'number' &&
      r >= 0 &&
      r <= 255 &&
      typeof g === 'number' &&
      g >= 0 &&
      g <= 255 &&
      typeof b === 'number' &&
      b >= 0 &&
      b <= 255
    )
  ) {
    const value = typeof a === 'number' ? [r, g, b, a] : [r, g, b];
    return `Invalid rgba value [${value.join(', ')}]: 'r', 'g', and 'b' must be between 0 and 255.`;
  }

  if (!(typeof a === 'undefined' || (typeof a === 'number' && a >= 0 && a <= 1))) {
    return `Invalid rgba value [${[r, g, b, a].join(', ')}]: 'a' must be between 0 and 1.`;
  }

  return null;
}

export function isValue(mixed) {
  if (mixed === null) {
    return true;
  }
  if (typeof mixed === 'string') {
    return true;
  }
  if (typeof mixed === 'boolean') {
    return true;
  }
  if (typeof mixed === 'number') {
    return true;
  }
  if (mixed instanceof Color) {
    return true;
  }
  if (mixed instanceof Collator) {
    return true;
  }
  if (mixed instanceof Formatted) {
    return true;
  }
  if (Array.isArray(mixed)) {
    for (const item of mixed) {
      if (!isValue(item)) {
        return false;
      }
    }
    return true;
  }
  if (typeof mixed === 'object') {
    for (const key in mixed) {
      if (!isValue(mixed[key])) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export function typeOf(value) {
  if (value === null) {
    return NullType;
  }
  if (typeof value === 'string') {
    return StringType;
  }
  if (typeof value === 'boolean') {
    return BooleanType;
  }
  if (typeof value === 'number') {
    return NumberType;
  }
  if (value instanceof Color) {
    return ColorType;
  }
  if (value instanceof Collator) {
    return CollatorType;
  }
  if (value instanceof Formatted) {
    return FormattedType;
  }
  if (Array.isArray(value)) {
    const length = value.length;
    let itemType;

    for (const item of value) {
      const t = typeOf(item);
      if (!itemType) {
        itemType = t;
      } else if (itemType === t) {
      } else {
        itemType = ValueType;
        break;
      }
    }

    return array(itemType || ValueType, length);
  }
  assert(typeof value === 'object');
  return ObjectType;
}

export function toString(value) {
  const type = typeof value;
  if (value === null) {
    return '';
  }
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return String(value);
  }
  if (value instanceof Color || value instanceof Formatted) {
    return value.toString();
  }
  return JSON.stringify(value);
}

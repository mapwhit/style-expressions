import CompoundExpression from '../compound_expression.js';
import RuntimeError from '../runtime_error.js';
import {
  array,
  BooleanType,
  CollatorType,
  ColorType,
  ErrorType,
  NumberType,
  ObjectType,
  StringType,
  toString as typeToString,
  ValueType
} from '../types.js';
import { Color, typeOf, validateRGBA, toString as valueToString } from '../values.js';
import Assertion from './assertion.js';
import At from './at.js';
import Case from './case.js';
import Coalesce from './coalesce.js';
import Coercion from './coercion.js';
import { CollatorExpression } from './collator.js';
import { Equals, GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, NotEquals } from './comparison.js';
import { FormatExpression } from './format.js';
import Interpolate from './interpolate.js';
import Length from './length.js';
import Let from './let.js';
import Literal from './literal.js';
import Match from './match.js';
import Step from './step.js';
import Var from './var.js';

const expressions = {
  // special forms
  '==': Equals,
  '!=': NotEquals,
  '>': GreaterThan,
  '<': LessThan,
  '>=': GreaterThanOrEqual,
  '<=': LessThanOrEqual,
  array: Assertion,
  at: At,
  boolean: Assertion,
  case: Case,
  coalesce: Coalesce,
  collator: CollatorExpression,
  format: FormatExpression,
  interpolate: Interpolate,
  'interpolate-hcl': Interpolate,
  'interpolate-lab': Interpolate,
  length: Length,
  let: Let,
  literal: Literal,
  match: Match,
  number: Assertion,
  object: Assertion,
  step: Step,
  string: Assertion,
  'to-boolean': Coercion,
  'to-color': Coercion,
  'to-number': Coercion,
  'to-string': Coercion,
  var: Var
};

export default expressions;

function rgba(ctx, [r, g, b, a]) {
  r = r.evaluate(ctx);
  g = g.evaluate(ctx);
  b = b.evaluate(ctx);
  const alpha = a ? a.evaluate(ctx) : 1;
  const error = validateRGBA(r, g, b, alpha);
  if (error) throw new RuntimeError(error);
  return new Color((r / 255) * alpha, (g / 255) * alpha, (b / 255) * alpha, alpha);
}

function has(key, obj) {
  return key in obj;
}

function get(key, obj) {
  const v = obj[key];
  return typeof v === 'undefined' ? null : v;
}

function binarySearch(v, a, i, j) {
  while (i <= j) {
    const m = (i + j) >> 1;
    if (a[m] === v) return true;
    if (a[m] > v) j = m - 1;
    else i = m + 1;
  }
  return false;
}

function varargs(type) {
  return { type };
}

CompoundExpression.register(expressions, {
  error: [
    ErrorType,
    [StringType],
    (ctx, [v]) => {
      throw new RuntimeError(v.evaluate(ctx));
    }
  ],
  typeof: [StringType, [ValueType], (ctx, [v]) => typeToString(typeOf(v.evaluate(ctx)))],
  'to-rgba': [
    array(NumberType, 4),
    [ColorType],
    (ctx, [v]) => {
      return v.evaluate(ctx).toArray();
    }
  ],
  rgb: [ColorType, [NumberType, NumberType, NumberType], rgba],
  rgba: [ColorType, [NumberType, NumberType, NumberType, NumberType], rgba],
  has: {
    type: BooleanType,
    overloads: [
      [[StringType], (ctx, [key]) => has(key.evaluate(ctx), ctx.properties())],
      [[StringType, ObjectType], (ctx, [key, obj]) => has(key.evaluate(ctx), obj.evaluate(ctx))]
    ]
  },
  get: {
    type: ValueType,
    overloads: [
      [[StringType], (ctx, [key]) => get(key.evaluate(ctx), ctx.properties())],
      [[StringType, ObjectType], (ctx, [key, obj]) => get(key.evaluate(ctx), obj.evaluate(ctx))]
    ]
  },
  'feature-state': [ValueType, [StringType], (ctx, [key]) => get(key.evaluate(ctx), ctx.featureState || {})],
  properties: [ObjectType, [], ctx => ctx.properties()],
  'geometry-type': [StringType, [], ctx => ctx.geometryType()],
  id: [ValueType, [], ctx => ctx.id()],
  zoom: [NumberType, [], ctx => ctx.globals.zoom],
  'heatmap-density': [NumberType, [], ctx => ctx.globals.heatmapDensity || 0],
  'line-progress': [NumberType, [], ctx => ctx.globals.lineProgress || 0],
  '+': [
    NumberType,
    varargs(NumberType),
    (ctx, args) => {
      let result = 0;
      for (const arg of args) {
        result += arg.evaluate(ctx);
      }
      return result;
    }
  ],
  '*': [
    NumberType,
    varargs(NumberType),
    (ctx, args) => {
      let result = 1;
      for (const arg of args) {
        result *= arg.evaluate(ctx);
      }
      return result;
    }
  ],
  '-': {
    type: NumberType,
    overloads: [
      [[NumberType, NumberType], (ctx, [a, b]) => a.evaluate(ctx) - b.evaluate(ctx)],
      [[NumberType], (ctx, [a]) => -a.evaluate(ctx)]
    ]
  },
  '/': [NumberType, [NumberType, NumberType], (ctx, [a, b]) => a.evaluate(ctx) / b.evaluate(ctx)],
  '%': [NumberType, [NumberType, NumberType], (ctx, [a, b]) => a.evaluate(ctx) % b.evaluate(ctx)],
  ln2: [NumberType, [], () => Math.LN2],
  pi: [NumberType, [], () => Math.PI],
  e: [NumberType, [], () => Math.E],
  '^': [NumberType, [NumberType, NumberType], (ctx, [b, e]) => b.evaluate(ctx) ** e.evaluate(ctx)],
  sqrt: [NumberType, [NumberType], (ctx, [x]) => Math.sqrt(x.evaluate(ctx))],
  log10: [NumberType, [NumberType], (ctx, [n]) => Math.log10(n.evaluate(ctx))],
  ln: [NumberType, [NumberType], (ctx, [n]) => Math.log(n.evaluate(ctx))],
  log2: [NumberType, [NumberType], (ctx, [n]) => Math.log2(n.evaluate(ctx))],
  sin: [NumberType, [NumberType], (ctx, [n]) => Math.sin(n.evaluate(ctx))],
  cos: [NumberType, [NumberType], (ctx, [n]) => Math.cos(n.evaluate(ctx))],
  tan: [NumberType, [NumberType], (ctx, [n]) => Math.tan(n.evaluate(ctx))],
  asin: [NumberType, [NumberType], (ctx, [n]) => Math.asin(n.evaluate(ctx))],
  acos: [NumberType, [NumberType], (ctx, [n]) => Math.acos(n.evaluate(ctx))],
  atan: [NumberType, [NumberType], (ctx, [n]) => Math.atan(n.evaluate(ctx))],
  min: [NumberType, varargs(NumberType), (ctx, args) => Math.min(...args.map(arg => arg.evaluate(ctx)))],
  max: [NumberType, varargs(NumberType), (ctx, args) => Math.max(...args.map(arg => arg.evaluate(ctx)))],
  abs: [NumberType, [NumberType], (ctx, [n]) => Math.abs(n.evaluate(ctx))],
  round: [
    NumberType,
    [NumberType],
    (ctx, [n]) => {
      const v = n.evaluate(ctx);
      // Javascript's Math.round() rounds towards +Infinity for halfway
      // values, even when they're negative. It's more common to round
      // away from 0 (e.g., this is what python and C++ do)
      return v < 0 ? -Math.round(-v) : Math.round(v);
    }
  ],
  floor: [NumberType, [NumberType], (ctx, [n]) => Math.floor(n.evaluate(ctx))],
  ceil: [NumberType, [NumberType], (ctx, [n]) => Math.ceil(n.evaluate(ctx))],
  'filter-==': [BooleanType, [StringType, ValueType], (ctx, [k, v]) => ctx.properties()[k.value] === v.value],
  'filter-id-==': [BooleanType, [ValueType], (ctx, [v]) => ctx.id() === v.value],
  'filter-type-==': [BooleanType, [StringType], (ctx, [v]) => ctx.geometryType() === v.value],
  'filter-<': [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => {
      const a = ctx.properties()[k.value];
      const b = v.value;
      return typeof a === typeof b && a < b;
    }
  ],
  'filter-id-<': [
    BooleanType,
    [ValueType],
    (ctx, [v]) => {
      const a = ctx.id();
      const b = v.value;
      return typeof a === typeof b && a < b;
    }
  ],
  'filter->': [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => {
      const a = ctx.properties()[k.value];
      const b = v.value;
      return typeof a === typeof b && a > b;
    }
  ],
  'filter-id->': [
    BooleanType,
    [ValueType],
    (ctx, [v]) => {
      const a = ctx.id();
      const b = v.value;
      return typeof a === typeof b && a > b;
    }
  ],
  'filter-<=': [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => {
      const a = ctx.properties()[k.value];
      const b = v.value;
      return typeof a === typeof b && a <= b;
    }
  ],
  'filter-id-<=': [
    BooleanType,
    [ValueType],
    (ctx, [v]) => {
      const a = ctx.id();
      const b = v.value;
      return typeof a === typeof b && a <= b;
    }
  ],
  'filter->=': [
    BooleanType,
    [StringType, ValueType],
    (ctx, [k, v]) => {
      const a = ctx.properties()[k.value];
      const b = v.value;
      return typeof a === typeof b && a >= b;
    }
  ],
  'filter-id->=': [
    BooleanType,
    [ValueType],
    (ctx, [v]) => {
      const a = ctx.id();
      const b = v.value;
      return typeof a === typeof b && a >= b;
    }
  ],
  'filter-has': [BooleanType, [ValueType], (ctx, [k]) => k.value in ctx.properties()],
  'filter-has-id': [BooleanType, [], ctx => ctx.id() !== null],
  'filter-type-in': [BooleanType, [array(StringType)], (ctx, [v]) => v.value.indexOf(ctx.geometryType()) >= 0],
  'filter-id-in': [BooleanType, [array(ValueType)], (ctx, [v]) => v.value.indexOf(ctx.id()) >= 0],
  'filter-in-small': [
    BooleanType,
    [StringType, array(ValueType)],
    // assumes v is an array literal
    (ctx, [k, v]) => v.value.indexOf(ctx.properties()[k.value]) >= 0
  ],
  'filter-in-large': [
    BooleanType,
    [StringType, array(ValueType)],
    // assumes v is a array literal with values sorted in ascending order and of a single type
    (ctx, [k, v]) => binarySearch(ctx.properties()[k.value], v.value, 0, v.value.length - 1)
  ],
  all: {
    type: BooleanType,
    overloads: [
      [[BooleanType, BooleanType], (ctx, [a, b]) => a.evaluate(ctx) && b.evaluate(ctx)],
      [
        varargs(BooleanType),
        (ctx, args) => {
          for (const arg of args) {
            if (!arg.evaluate(ctx)) return false;
          }
          return true;
        }
      ]
    ]
  },
  any: {
    type: BooleanType,
    overloads: [
      [[BooleanType, BooleanType], (ctx, [a, b]) => a.evaluate(ctx) || b.evaluate(ctx)],
      [
        varargs(BooleanType),
        (ctx, args) => {
          for (const arg of args) {
            if (arg.evaluate(ctx)) return true;
          }
          return false;
        }
      ]
    ]
  },
  '!': [BooleanType, [BooleanType], (ctx, [b]) => !b.evaluate(ctx)],
  'is-supported-script': [
    BooleanType,
    [StringType],
    // At parse time this will always return true, so we need to exclude this expression with isGlobalPropertyConstant
    (ctx, [s]) => {
      const isSupportedScript = ctx.globals?.isSupportedScript;
      if (isSupportedScript) {
        return isSupportedScript(s.evaluate(ctx));
      }
      return true;
    }
  ],
  upcase: [StringType, [StringType], (ctx, [s]) => s.evaluate(ctx).toUpperCase()],
  downcase: [StringType, [StringType], (ctx, [s]) => s.evaluate(ctx).toLowerCase()],
  concat: [StringType, varargs(ValueType), (ctx, args) => args.map(arg => valueToString(arg.evaluate(ctx))).join('')],
  'resolved-locale': [StringType, [CollatorType], (ctx, [collator]) => collator.evaluate(ctx).resolvedLocale()]
});

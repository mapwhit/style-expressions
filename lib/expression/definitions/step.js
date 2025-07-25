import { findStopLessThanOrEqualTo } from '../stops.js';
import { NumberType } from '../types.js';

export default class Step {
  constructor(type, input, stops) {
    this.type = type;
    this.input = input;

    this.labels = [];
    this.outputs = [];
    for (const [label, expression] of stops) {
      this.labels.push(label);
      this.outputs.push(expression);
    }
  }

  static parse(args, context) {
    let [, input, ...rest] = args;

    if (args.length - 1 < 4) {
      return context.error(`Expected at least 4 arguments, but found only ${args.length - 1}.`);
    }

    if ((args.length - 1) % 2 !== 0) {
      return context.error('Expected an even number of arguments.');
    }

    input = context.parse(input, 1, NumberType);
    if (!input) return null;

    const stops = [];

    let outputType = null;
    if (context.expectedType && context.expectedType.kind !== 'value') {
      outputType = context.expectedType;
    }

    rest.unshift(Number.NEGATIVE_INFINITY);

    for (let i = 0; i < rest.length; i += 2) {
      const label = rest[i];
      const value = rest[i + 1];

      const labelKey = i + 1;
      const valueKey = i + 2;

      if (typeof label !== 'number') {
        return context.error(
          'Input/output pairs for "step" expressions must be defined using literal numeric values (not computed expressions) for the input values.',
          labelKey
        );
      }

      if (stops.length && stops[stops.length - 1][0] >= label) {
        return context.error(
          'Input/output pairs for "step" expressions must be arranged with input values in strictly ascending order.',
          labelKey
        );
      }

      const parsed = context.parse(value, valueKey, outputType);
      if (!parsed) return null;
      outputType = outputType || parsed.type;
      stops.push([label, parsed]);
    }

    return new Step(outputType, input, stops);
  }

  evaluate(ctx) {
    const labels = this.labels;
    const outputs = this.outputs;

    if (labels.length === 1) {
      return outputs[0].evaluate(ctx);
    }

    const value = this.input.evaluate(ctx);
    if (value <= labels[0]) {
      return outputs[0].evaluate(ctx);
    }

    const stopCount = labels.length;
    if (value >= labels[stopCount - 1]) {
      return outputs[stopCount - 1].evaluate(ctx);
    }

    const index = findStopLessThanOrEqualTo(labels, value);
    return outputs[index].evaluate(ctx);
  }

  eachChild(fn) {
    fn(this.input);
    for (const expression of this.outputs) {
      fn(expression);
    }
  }

  possibleOutputs() {
    return [].concat(...this.outputs.map(output => output.possibleOutputs()));
  }

  serialize() {
    const serialized = ['step', this.input.serialize()];
    for (let i = 0; i < this.labels.length; i++) {
      if (i > 0) {
        serialized.push(this.labels[i]);
      }
      serialized.push(this.outputs[i].serialize());
    }
    return serialized;
  }
}

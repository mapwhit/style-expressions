import RuntimeError from '../runtime_error.js';
import { NumberType, toString } from '../types.js';
import { typeOf } from '../values.js';

export default class Length {
  constructor(input) {
    this.type = NumberType;
    this.input = input;
  }

  static parse(args, context) {
    if (args.length !== 2) return context.error(`Expected 1 argument, but found ${args.length - 1} instead.`);

    const input = context.parse(args[1], 1);
    if (!input) return null;

    if (input.type.kind !== 'array' && input.type.kind !== 'string' && input.type.kind !== 'value')
      return context.error(`Expected argument of type string or array, but found ${toString(input.type)} instead.`);

    return new Length(input);
  }

  evaluate(ctx) {
    const input = this.input.evaluate(ctx);
    if (typeof input === 'string') {
      return input.length;
    }
    if (Array.isArray(input)) {
      return input.length;
    }
    throw new RuntimeError(
      `Expected value to be of type string or array, but found ${toString(typeOf(input))} instead.`
    );
  }

  eachChild(fn) {
    fn(this.input);
  }

  possibleOutputs() {
    return [undefined];
  }
}

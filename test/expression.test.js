import { createPropertyExpression } from '../lib/expression/index.js';
import { toString } from '../lib/expression/types.js';
import { isFunction } from '../lib/function/index.js';
import { expression as expressionSuite } from './integration/index.js';
import convertFunction from './util/convert.js';

let tests;

if (process.argv[1] === import.meta.filename && process.argv.length > 2) {
  tests = process.argv.slice(2);
}

expressionSuite('js', { tests, testReporter: process.env.TEST_REPORTER }, fixture => {
  const spec = Object.assign({}, fixture.propertySpec);

  if (!spec['property-type']) {
    spec['property-type'] = 'data-driven';
  }

  if (!spec.expression) {
    spec.expression = {
      interpolated: true,
      parameters: ['zoom', 'feature']
    };
  }

  const evaluateExpression = (expression, compilationResult) => {
    if (expression.result === 'error') {
      compilationResult.result = 'error';
      compilationResult.errors = expression.value.map(err => ({
        key: err.key,
        error: err.message
      }));
      return;
    }

    const evaluationResult = [];

    expression = expression.value;
    const type = expression._styleExpression.expression.type; // :scream:

    compilationResult.result = 'success';
    compilationResult.isFeatureConstant = expression.kind === 'constant' || expression.kind === 'camera';
    compilationResult.isZoomConstant = expression.kind === 'constant' || expression.kind === 'source';
    compilationResult.type = toString(type);

    for (const input of fixture.inputs || []) {
      try {
        const feature = { properties: input[1].properties || {} };
        if ('id' in input[1]) {
          feature.id = input[1].id;
        }
        if ('geometry' in input[1]) {
          feature.type = input[1].geometry.type;
        }
        let value = expression.evaluateWithoutErrorHandling(input[0], feature);
        if (type.kind === 'color') {
          value = [value.r, value.g, value.b, value.a];
        }
        evaluationResult.push(value);
      } catch (error) {
        if (error.name === 'ExpressionEvaluationError') {
          evaluationResult.push({ error: error.toJSON() });
        } else {
          evaluationResult.push({ error: error.message });
        }
      }
    }

    if (fixture.inputs) {
      return evaluationResult;
    }
  };

  const result = { compiled: {}, recompiled: {} };
  const expression = (() => {
    if (isFunction(fixture.expression)) {
      return createPropertyExpression(convertFunction(fixture.expression, spec), spec);
    }
    return createPropertyExpression(fixture.expression, spec);
  })();

  result.outputs = evaluateExpression(expression, result.compiled);
  if (expression.result === 'success') {
    result.serialized = expression.value._styleExpression.expression.serialize();
    result.roundTripOutputs = evaluateExpression(createPropertyExpression(result.serialized, spec), result.recompiled);
    // Type is allowed to change through serialization
    // (eg "array" -> "array<number, 3>")
    // Override the round-tripped type here so that the equality check passes
    result.recompiled.type = result.compiled.type;
  }

  return result;
});

import { createPropertyExpression } from '../../../lib/expression/index.js';
import { toString } from '../../../lib/expression/types.js';
import { isFunction } from '../../../lib/function/index.js';
import convertFunction from '../../util/convert.js';

/**
 * Runs a single integration test fixture, compiling an expression and evaluating it against a set of inputs.
 *
 * @param {object} fixture - The test fixture object.
 * @param {object} fixture.expression - The expression definition to compile and evaluate.
 * @param {object} [fixture.propertySpec] - Optional property specification for the expression.
 * @param {Array<Array<any>>} [fixture.inputs] - Optional array of inputs for evaluation.
 *   Each input is an array where the first element is the zoom level and the second
 *   is the feature object (with properties and optional id/geometry).
 * @returns {{compiled: object, outputs: Array<any>}} An object containing the compiled
 *   expression details and the evaluation outputs.
 * @returns {object} returns.compiled - Details about the compiled expression, including
 *   `result`, `errors`, `isFeatureConstant`, `isZoomConstant`, and `type`.
 * @returns {Array<any>} returns.outputs - An array of evaluation results for each input.
 *   Each element can be a value or an error object.
 */
export function runFixture(fixture) {
  const spec = { ...fixture.propertySpec };

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

  const result = { compiled: {} };
  const expression = (() => {
    if (isFunction(fixture.expression)) {
      return createPropertyExpression(convertFunction(fixture.expression, spec), spec, fixture.globalState);
    }
    return createPropertyExpression(fixture.expression, spec, fixture.globalState);
  })();

  result.outputs = evaluateExpression(expression, result.compiled);

  return result;
}

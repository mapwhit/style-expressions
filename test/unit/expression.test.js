import test from 'node:test';
import definitions from '../../lib/expression/definitions/index.js';
import { createExpression, createPropertyExpression } from '../../lib/expression/index.js';
import ParsingError from '../../lib/expression/parsing_error.js';
import v8 from '../../reference/v8.json' with { type: 'json' };

// filter out interal "error" and "filter-*" expressions from definition list
const filterExpressionRegex = /filter-/;
const definitionList = Object.keys(definitions)
  .filter(expression => {
    return expression !== 'error' && !filterExpressionRegex.exec(expression);
  })
  .sort();

test('v8.json includes all definitions from style-spec', t => {
  const v8List = Object.keys(v8.expression_name.values);
  t.assert.deepEqual(definitionList, v8List.sort());
});

test('createPropertyExpression', async t => {
  await t.test('prohibits non-interpolable properties from using an "interpolate" expression', t => {
    const { result, value } = createPropertyExpression(['interpolate', ['linear'], ['zoom'], 0, 0, 10, 10], {
      type: 'number',
      'property-type': 'data-constant',
      expression: {
        interpolated: false,
        parameters: ['zoom']
      }
    });
    t.assert.equal(result, 'error');
    t.assert.equal(value.length, 1);
    t.assert.equal(value[0].message, '"interpolate" expressions cannot be used with this property');
  });

  await t.test('sets globalStateRefs', () => {
    const { value } = createPropertyExpression(
      ['case', ['>', ['global-state', 'stateKey'], 0], 100, ['global-state', 'anotherStateKey']],
      {
        type: 'number',
        'property-type': 'data-driven',
        expression: {
          interpolated: false,
          parameters: ['zoom', 'feature']
        }
      }
    );

    t.assert.deepEqual(value.globalStateRefs, new Set(['stateKey', 'anotherStateKey']));
  });
});

test('evaluate expression', async t => {
  await t.test('warns and falls back to default for invalid enum values', t => {
    const { value } = createPropertyExpression(['get', 'x'], {
      type: 'enum',
      values: ['a', 'b', 'c'],
      default: 'a',
      'property-type': 'data-driven',
      expression: {
        interpolated: false,
        parameters: ['zoom', 'feature']
      }
    });

    t.mock.method(console, 'warn');

    t.assert.equal(value.kind, 'source');

    t.assert.equal(value.evaluate({}, { properties: { x: 'b' } }), 'b');
    t.assert.equal(value.evaluate({}, { properties: { x: 'invalid' } }), 'a');
    t.assert.equal(
      console.warn.mock.calls[0].arguments[0],
      `Expected value to be one of "a", "b", "c", but found "invalid" instead.`
    );
  });
});

test('global-state expression', async t => {
  await t.test('requires a property argument', () => {
    const response = createExpression(['global-state']);
    t.assert.equal(response.result, 'error');
    t.assert.ok(response.value[0] instanceof ParsingError);
    t.assert.equal(response.value[0].message, 'Expected 1 argument, but found 0 instead.');
  });
  await t.test('requires a string as the property argument', () => {
    const response = createExpression(['global-state', true]);
    t.assert.equal(response.result, 'error');
    t.assert.ok(response.value[0] instanceof ParsingError);
    t.assert.equal(response.value[0].message, 'Global state property must be string, but found boolean instead.');
  });
  await t.test('rejects a second argument', () => {
    const response = createExpression(['global-state', 'foo', 'bar']);
    t.assert.equal(response.result, 'error');
    t.assert.ok(response.value[0] instanceof ParsingError);
    t.assert.equal(response.value[0].message, 'Expected 1 argument, but found 2 instead.');
  });
  await t.test('evaluates a global state property', () => {
    const response = createExpression(['global-state', 'foo']);
    if (response.result === 'success') {
      t.assert.equal(response.value.evaluate({ globalState: { foo: 'bar' }, zoom: 0 }, {}), 'bar');
    } else {
      throw new Error('Failed to parse GlobalState expression');
    }
  });
});

import test from 'node:test';
import definitions from '../../lib/expression/definitions/index.js';
import { createPropertyExpression } from '../../lib/expression/index.js';
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
  await t.test('silently falls back to default for nullish values', t => {
    const { value } = createPropertyExpression(['global-state', 'x'], {
      type: null,
      default: 42,
      'property-type': 'data-driven',
      transition: false
    });

    t.mock.method(console, 'warn');

    t.assert.equal(value.evaluate({ globalState: { x: 5 }, zoom: 10 }), 5);
    t.assert.equal(console.warn.mock.callCount(), 0);

    t.assert.equal(value.evaluate({ globalState: {}, zoom: 10 }), 42);
    t.assert.equal(console.warn.mock.callCount(), 0);
  });

  await t.test('global state as expression property', t => {
    const { value } = createPropertyExpression(['global-state', 'x'], {
      type: null,
      default: 42,
      'property-type': 'data-driven',
      transition: false
    });

    t.mock.method(console, 'warn');

    value.globalState = { x: 5 };
    t.assert.equal(value.evaluate({ globalState: { x: 15 }, zoom: 10 }), 5);
    t.assert.equal(console.warn.mock.callCount(), 0);
  });

  await t.test('global state as expression property of zoom dependent expression', t => {
    const { value } = createPropertyExpression(
      ['interpolate', ['linear'], ['zoom'], 10, ['global-state', 'x'], 20, 50],
      {
        type: 'number',
        default: 42,
        'property-type': 'data-driven',
        expression: {
          interpolated: true,
          parameters: ['zoom']
        }
      }
    );

    t.mock.method(console, 'warn');

    value.globalState = { x: 5 };
    t.assert.equal(value.evaluate({ globalState: { x: 15 }, zoom: 10 }), 5);
    t.assert.equal(console.warn.mock.callCount(), 0);
  });

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

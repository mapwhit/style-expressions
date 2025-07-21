const { test } = require('../util/mapbox-gl-js-test');
const { createPropertyExpression } = require('../../lib/expression');
const definitions = require('../../lib/expression/definitions');
const v8 = require('../../reference/v8');

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

    t.stub(console, 'warn');

    t.assert.equal(value.kind, 'source');

    t.assert.equal(value.evaluate({}, { properties: { x: 'b' } }), 'b');
    t.assert.equal(value.evaluate({}, { properties: { x: 'invalid' } }), 'a');
    t.assert.ok(console.warn.calledWith(`Expected value to be one of "a", "b", "c", but found "invalid" instead.`));
  });
});

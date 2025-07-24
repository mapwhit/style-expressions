import test from 'node:test';
import Color from '../../../lib/util/color.js';
import { array, color, number } from '../../../lib/util/interpolate.js';

test('interpolate.number', t => {
  t.assert.equal(number(0, 1, 0.5), 0.5);
});

test('interpolate.color', t => {
  t.assert.deepEqual(color(new Color(0, 0, 0, 0), new Color(1, 2, 3, 4), 0.5), new Color(0.5, 1, 3 / 2, 2));
});

test('interpolate.array', t => {
  t.assert.deepEqual(array([0, 0, 0, 0], [1, 2, 3, 4], 0.5), [0.5, 1, 3 / 2, 2]);
});

import test from 'node:test';
import Color from '../../../lib/util/color.js';

test('Color.parse', t => {
  t.assert.deepEqual(Color.parse('red'), new Color(1, 0, 0, 1));
  t.assert.deepEqual(Color.parse('#ff00ff'), new Color(1, 0, 1, 1));
  t.assert.deepEqual(Color.parse('invalid'), undefined);
  t.assert.deepEqual(Color.parse(null), undefined);
  t.assert.deepEqual(Color.parse(undefined), undefined);
});

test('Color#toString', t => {
  const purple = Color.parse('purple');
  t.assert.equal(purple?.toString(), 'rgba(128,0,128,1)');
  const translucentGreen = Color.parse('rgba(26, 207, 26, .73)');
  t.assert.equal(translucentGreen?.toString(), 'rgba(26,207,26,0.73)');
});

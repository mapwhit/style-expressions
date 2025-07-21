const { test } = require('../../util/mapbox-gl-js-test');
const colorSpaces = require('../../../lib/util/color_spaces');
const Color = require('../../../lib/util/color');

test('#hclToRgb zero', t => {
  const hclColor = { h: 0, c: 0, l: 0, alpha: null };
  const rgbColor = new Color(0, 0, 0, null);
  t.assert.deepEqual(colorSpaces.hcl.reverse(hclColor), rgbColor);
});

test('#hclToRgb', t => {
  const hclColor = { h: 20, c: 20, l: 20, alpha: null };
  const rgbColor = new Color(76.04087881379073, 36.681898967046166, 39.08743507357837, null);
  t.assert.deepEqual(colorSpaces.hcl.reverse(hclColor), rgbColor);
});

test('#rgbToHcl zero', t => {
  const hclColor = { h: 0, c: 0, l: 0, alpha: null };
  const rgbColor = new Color(0, 0, 0, null);
  t.assert.deepEqual(colorSpaces.hcl.forward(rgbColor), hclColor);
});

test('#rgbToHcl', t => {
  const hclColor = { h: 158.19859051364818, c: 0.0000029334887311101764, l: 6.318928745123017, alpha: null };
  const rgbColor = new Color(20, 20, 20, null);
  t.assert.deepEqual(colorSpaces.hcl.forward(rgbColor), hclColor);
});

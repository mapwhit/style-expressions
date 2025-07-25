const Color = require('./color');

const { number: interpolateNumber } = require('./interpolate');

// Constants
const Xn = 0.95047; // D65 standard referent
const Yn = 1;
const Zn = 1.08883;
const t0 = 4 / 29;
const t1 = 6 / 29;
const t2 = 3 * t1 * t1;
const t3 = t1 * t1 * t1;
const deg2rad = Math.PI / 180;
const rad2deg = 180 / Math.PI;

// Utilities
function xyz2lab(t) {
  return t > t3 ? t ** (1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  x /= 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

// LAB
function rgbToLab(rgbColor) {
  const b = rgb2xyz(rgbColor.r);
  const a = rgb2xyz(rgbColor.g);
  const l = rgb2xyz(rgbColor.b);
  const x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn);
  const y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.072175 * l) / Yn);
  const z = xyz2lab((0.0193339 * b + 0.119192 * a + 0.9503041 * l) / Zn);

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
    alpha: rgbColor.a
  };
}

function labToRgb(labColor) {
  let y = (labColor.l + 16) / 116;
  let x = Number.isNaN(labColor.a) ? y : y + labColor.a / 500;
  let z = Number.isNaN(labColor.b) ? y : y - labColor.b / 200;
  y = Yn * lab2xyz(y);
  x = Xn * lab2xyz(x);
  z = Zn * lab2xyz(z);
  return new Color(
    xyz2rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
    xyz2rgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z),
    xyz2rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
    labColor.alpha
  );
}

function interpolateLab(from, to, t) {
  return {
    l: interpolateNumber(from.l, to.l, t),
    a: interpolateNumber(from.a, to.a, t),
    b: interpolateNumber(from.b, to.b, t),
    alpha: interpolateNumber(from.alpha, to.alpha, t)
  };
}

// HCL
function rgbToHcl(rgbColor) {
  const { l, a, b } = rgbToLab(rgbColor);
  const h = Math.atan2(b, a) * rad2deg;
  return {
    h: h < 0 ? h + 360 : h,
    c: Math.sqrt(a * a + b * b),
    l,
    alpha: rgbColor.a
  };
}

function hclToRgb(hclColor) {
  const h = hclColor.h * deg2rad;
  const c = hclColor.c;
  const l = hclColor.l;
  return labToRgb({
    l,
    a: Math.cos(h) * c,
    b: Math.sin(h) * c,
    alpha: hclColor.alpha
  });
}

function interpolateHue(a, b, t) {
  const d = b - a;
  return a + t * (d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d);
}

function interpolateHcl(from, to, t) {
  return {
    h: interpolateHue(from.h, to.h, t),
    c: interpolateNumber(from.c, to.c, t),
    l: interpolateNumber(from.l, to.l, t),
    alpha: interpolateNumber(from.alpha, to.alpha, t)
  };
}

const lab = {
  forward: rgbToLab,
  reverse: labToRgb,
  interpolate: interpolateLab
};

const hcl = {
  forward: rgbToHcl,
  reverse: hclToRgb,
  interpolate: interpolateHcl
};

module.exports = {
  lab,
  hcl
};

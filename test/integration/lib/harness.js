import { glob, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

/**
 * Runs integration tests by iterating over test fixtures.
 * @param {string} cwd - The current working directory for finding fixtures.
 * @param {function(object): {outputs, compiled}} runFixture - A function that takes a
 *   fixture object and returns its outputs and compiled result.
 * @returns {Promise<void>} promise that resolves when all tests are completed
 */
export default async function harness(cwd, runFixture) {
  const files = glob('**/test.json', { cwd });
  // iterate over files
  for await (const file of files) {
    const id = path.dirname(file);
    const filename = path.resolve(cwd, file);

    test(id, { concurrency: true }, async t => {
      const data = await readFile(filename, 'utf8');
      const fixture = JSON.parse(data);
      const { outputs: rawOutputs, compiled } = runFixture(fixture);
      const outputs = stripPrecision(rawOutputs);

      if (process.env.UPDATE) {
        fixture.expected = {
          compiled,
          outputs
        };

        await writeFile(filename, `${stringify(fixture, null, 2)}\n`);
        return;
      }

      const { expected } = fixture;
      t.assert.deepStrictEqual(compiled, expected.compiled, 'compiled should be equal');
      t.assert.deepStrictEqual(outputs, expected.outputs, 'outputs should be equal');
    });
  }
}

/**
 * Stringifies a JavaScript value into a JSON string, handling Unicode line and paragraph
 * separators.
 *
 * This is necessary because JSON.stringify does not escape U+2028 (line separator) or
 * U+2029 (paragraph separator), which can cause issues if the output is embedded in HTML.
 *
 * @param {any} v - The value to stringify.
 * @returns {string} The JSON string representation of the value.
 */
function stringify(v) {
  let s = JSON.stringify(v);
  if (s.indexOf('\u2028') >= 0) {
    s = s.replace(/\u2028/g, '\\u2028');
  }
  if (s.indexOf('\u2029') >= 0) {
    s = s.replace(/\u2029/g, '\\u2029');
  }
  return s;
}

const decimalSigFigs = 6;

/**
 * Strips a number down to a specified number of decimal significant figures,
 * or recursively processes arrays and objects. This is used to normalize
 * floating-point output for comparisons in tests.
 *
 * @param {number|object|Array<any>|null} x - The value to strip precision from.
 * @returns {number|object|Array<any>|null} The value with precision stripped.
 */
function stripPrecision(x) {
  // strips down to 6 decimal sigfigs but stops at decimal point
  if (typeof x === 'number') {
    if (x === 0) {
      return x;
    }
    const multiplier = 10 ** Math.max(0, decimalSigFigs - Math.ceil(Math.log10(Math.abs(x))));
    // We strip precision twice in a row here to avoid cases where
    // stripping an already stripped number will modify its value
    // due to bad floating point precision luck
    // eg `Math.floor(8.16598 * 100000) / 100000` -> 8.16597
    const firstStrip = Math.floor(x * multiplier) / multiplier;
    return Math.floor(firstStrip * multiplier) / multiplier;
  }
  if (x == null || typeof x !== 'object') {
    return x;
  }
  return Array.isArray(x)
    ? x.map(stripPrecision)
    : Object.fromEntries(Object.entries(x).map(p => [p[0], stripPrecision(p[1])]));
}

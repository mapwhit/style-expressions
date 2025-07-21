/**
 * A type used for returning and propagating errors. The first element of the union
 * represents success and contains a value, and the second represents an error and
 * contains an error value.
 * @private
 */

function success(value) {
  return { result: 'success', value };
}

function error(value) {
  return { result: 'error', value };
}

module.exports = {
  success,
  error
};

import RuntimeError from './runtime_error.js';

/**
 * Returns the index of the last stop <= input, or 0 if it doesn't exist.
 * @private
 */
export function findStopLessThanOrEqualTo(stops, input) {
  const n = stops.length;
  let lowerIndex = 0;
  let upperIndex = n - 1;
  let currentIndex = 0;
  let currentValue;
  let upperValue;

  while (lowerIndex <= upperIndex) {
    currentIndex = Math.floor((lowerIndex + upperIndex) / 2);
    currentValue = stops[currentIndex];
    upperValue = stops[currentIndex + 1];
    if (input === currentValue || (input > currentValue && input < upperValue)) {
      // Search complete
      return currentIndex;
    }
    if (currentValue < input) {
      lowerIndex = currentIndex + 1;
    } else if (currentValue > input) {
      upperIndex = currentIndex - 1;
    } else {
      throw new RuntimeError('Input is not a number.');
    }
  }

  return Math.max(currentIndex - 1, 0);
}

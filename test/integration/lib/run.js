import { runFixture } from './fixture.js';
import harness from './harness.js';

export default function run(directory) {
  harness(directory, runFixture);
}

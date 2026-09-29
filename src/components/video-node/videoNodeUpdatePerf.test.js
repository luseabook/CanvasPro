import test from 'node:test';
import assert from 'node:assert/strict';

import { createVideoNodeUpdatePerf } from './videoNodeUpdatePerf.js';

function withGlobals({ enabled, clock }, run) {
  const originalWindow = globalThis.window;
  const originalPerformance = globalThis.performance;
  globalThis.window = { __perfProbeEnabled: enabled };
  globalThis.performance = { now: clock };
  try {
    return run();
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalPerformance === undefined) delete globalThis.performance;
    else globalThis.performance = originalPerformance;
  }
}

test('createVideoNodeUpdatePerf: returns null unless the probe is enabled', () => {
  withGlobals({ enabled: false, clock: () => 0 }, () => {
    assert.equal(createVideoNodeUpdatePerf(), null);
  });
});

test('createVideoNodeUpdatePerf: records details, filters tiny sections, and sorts by duration', () => {
  const ticks = [0, 10, 10, 30];
  withGlobals({ enabled: true, clock: () => ticks.shift() }, () => {
    const perf = createVideoNodeUpdatePerf();
    perf.detail('node', 'x'.repeat(600));
    perf.mark('first');
    perf.mark('zero');
    const result = perf.finish();

    assert.equal(result.totalMs, 30);
    assert.equal(result.details.node.length, 500);
    assert.deepEqual(result.sections, [{ name: 'first', durationMs: 10 }]);
  });
});

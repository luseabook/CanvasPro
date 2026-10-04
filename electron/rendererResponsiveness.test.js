import assert from 'node:assert/strict';
import test from 'node:test';
import {
  __rendererResponsivenessForTest,
  configureRendererResponsiveness,
} from './rendererResponsiveness.js';
test('configureRendererResponsiveness installs Electron background throttling switches', () => {
  const list = [];
  configureRendererResponsiveness({
    commandLine: { appendSwitch: (...args) => list.push(args) },
  });
  for (const value of __rendererResponsivenessForTest.BACKGROUND_THROTTLE_SWITCHES) {
    assert.ok(list.some((item) => item[0] === value));
  }
  assert.ok(
    list.some(
      (item2) =>
        item2[0] === 'disable-features' &&
        item2[1] === __rendererResponsivenessForTest.DISABLED_BACKGROUND_FEATURES,
    ),
  );
});

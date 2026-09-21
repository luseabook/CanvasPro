import assert from 'node:assert/strict';
import test from 'node:test';
import {
  __rendererResponsivenessForTest,
  configureRendererResponsiveness,
} from './rendererResponsiveness.js';
test('configureRendererResponsiveness installs Electron background throttling switches', () => {
  const _0x47bfdc = [];
  configureRendererResponsiveness({
    commandLine: { appendSwitch: (..._0x167fff) => _0x47bfdc.push(_0x167fff) },
  });
  for (const _0x17a46a of __rendererResponsivenessForTest.BACKGROUND_THROTTLE_SWITCHES) {
    assert.ok(_0x47bfdc.some((_0x3314d7) => _0x3314d7[0] === _0x17a46a));
  }
  assert.ok(
    _0x47bfdc.some(
      (_0x4bc8c9) =>
        _0x4bc8c9[0] === 'disable-features' &&
        _0x4bc8c9[1] === __rendererResponsivenessForTest.DISABLED_BACKGROUND_FEATURES,
    ),
  );
});

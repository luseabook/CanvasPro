import test from 'node:test';
import assert from 'node:assert/strict';
import { createUpdateInstallPreparation } from './updateInstallPreparation.js';
const window = { isDestroyed: () => false };
function harness(overrides = {}) {
  const calls = [];
  const helper = createUpdateInstallPreparation({
    getMainWindow: () => window,
    requestRendererRecoverySnapshot: async () => { calls.push('save'); return { success: true }; },
    getSpawnedServer: () => ({ pid: 123456789 }),
    terminate: (_, { force }) => calls.push(force ? 'force' : 'stop'),
    waitForExit: async () => true,
    clearSpawnedServer: () => calls.push('clear'),
    markQuittingForUpdate: () => calls.push('commit'),
    destroyScreenshotOverlayWindow: () => calls.push('overlay'),
    stopAllPowerSaveBlockers: () => calls.push('blockers'),
    ...overrides,
  });
  return { helper, calls };
}
test('installer waits for save, then backend exit, before committed cleanup', async () => {
  let finish;
  const { helper, calls } = harness({ requestRendererRecoverySnapshot: () => new Promise(resolve => { finish = resolve; }) });
  const result = helper.prepareForUpdateInstall();
  assert.equal(helper.prepareForUpdateInstall(), result); assert.deepEqual(calls, []);
  finish({ success: true }); await result;
  assert.deepEqual(calls, ['stop','clear','commit','overlay','blockers']);
});
test('save failure or exception never stops the backend or marks update quitting', async () => {
  for (const requestRendererRecoverySnapshot of [async () => ({ success: false }), async () => { throw new Error('fixture'); }]) {
    const { helper, calls } = harness({ requestRendererRecoverySnapshot });
    await assert.rejects(helper.prepareForUpdateInstall()); assert.deepEqual(calls, []);
  }
});
test('failed backend termination refuses installation and preserves the owned process reference', async () => {
  const { helper, calls } = harness({ waitForExit: async () => false });
  await assert.rejects(helper.prepareForUpdateInstall(), /后台服务/);
  assert.deepEqual(calls, ['save','stop','force']);
});
test('pending spawn is not mistaken for an exited backend', async () => {
  const { helper, calls } = harness({ getSpawnedServer: () => ({ pid: undefined, exitCode: null }) });
  await assert.rejects(helper.prepareForUpdateInstall()); assert.deepEqual(calls, ['save']);
});
test('independent cleanup continues if screenshot teardown fails', async () => {
  const { helper, calls } = harness({ destroyScreenshotOverlayWindow: () => { throw new Error('fixture'); } });
  await helper.prepareForUpdateInstall(); assert.deepEqual(calls, ['save','stop','clear','commit','blockers']);
});

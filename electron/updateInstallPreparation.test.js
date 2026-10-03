import test from 'node:test';
import assert from 'node:assert/strict';
import { createUpdateInstallPreparation } from './updateInstallPreparation.js';

test('dirty workspace aborts update installation when recovery snapshot fails', async () => {
  const calls = [];
  const preparation = createUpdateInstallPreparation({
    getSpawnedServer: () => null,
    getMainWindow: () => ({ isDestroyed: () => false }),
    getRendererProjectState: () => ({ hasUnsavedChanges: true }),
    requestRendererRecoverySnapshot: async () => ({ success: false, reason: 'disk-full' }),
    markQuittingForUpdate: () => calls.push('mark-quitting'),
    destroyScreenshotOverlayWindow: () => calls.push('destroy-overlay'),
    stopAllPowerSaveBlockers: () => calls.push('stop-power'),
    logEvent: event => calls.push(event.type),
  });

  await assert.rejects(preparation.prepareForUpdateInstall(), /disk-full|恢复快照失败/u);
  assert.equal(calls.includes('mark-quitting'), false);
  assert.equal(calls.includes('destroy-overlay'), false);
  assert.equal(calls.includes('stop-power'), false);
  assert.equal(calls.includes('updater.recovery_snapshot_before_install_failed'), true);
});

test('clean workspace does not require a recovery snapshot before installation', async () => {
  const calls = [];
  const preparation = createUpdateInstallPreparation({
    getSpawnedServer: () => null,
    getRendererProjectState: () => ({ hasUnsavedChanges: false }),
    markQuittingForUpdate: () => calls.push('mark-quitting'),
    destroyScreenshotOverlayWindow: () => calls.push('destroy-overlay'),
    stopAllPowerSaveBlockers: () => calls.push('stop-power'),
  });

  await preparation.prepareForUpdateInstall();
  assert.deepEqual(calls, ['mark-quitting', 'destroy-overlay', 'stop-power']);
});

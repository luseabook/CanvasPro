import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTO_UPDATE_PRIMARY_ACTIONS,
  resolveAutoUpdatePrimaryAction,
  ensureDesktopUpdateAvailable,
} from './autoUpdatePolicy.js';

test('freezes the primary action vocabulary', () => {
  assert.equal(Object.isFrozen(AUTO_UPDATE_PRIMARY_ACTIONS), true);
  assert.deepEqual(
    { ...AUTO_UPDATE_PRIMARY_ACTIONS },
    {
      CLOSE: 'close',
      INSTALL_DESKTOP: 'install-desktop',
      RETRY_DESKTOP: 'retry-desktop',
      DOWNLOAD_DESKTOP: 'download-desktop',
      HOT_APPLY: 'hot-apply',
      UNAVAILABLE: 'unavailable',
    },
  );
});

test('closes when there is no update or the dialog is a preview', () => {
  assert.equal(resolveAutoUpdatePrimaryAction(), 'close');
  assert.equal(resolveAutoUpdatePrimaryAction({}), 'close');
  assert.equal(resolveAutoUpdatePrimaryAction({ hasUpdate: false, canHotApply: true }), 'close');
  assert.equal(resolveAutoUpdatePrimaryAction({ previewOnly: true, hasUpdate: true }), 'close');
  assert.equal(
    resolveAutoUpdatePrimaryAction({ previewOnly: true, hasUpdate: true, installDownloadedUpdate: true }),
    'close',
  );
});

test('installs a downloaded update before any other desktop action', () => {
  assert.equal(
    resolveAutoUpdatePrimaryAction({
      hasUpdate: true,
      installDownloadedUpdate: true,
      retryDesktopDownload: true,
      startDesktopDownload: true,
      canHotApply: true,
    }),
    'install-desktop',
  );
});

test('retries a failed desktop download before starting a new one', () => {
  assert.equal(
    resolveAutoUpdatePrimaryAction({
      hasUpdate: true,
      retryDesktopDownload: true,
      startDesktopDownload: true,
      canHotApply: true,
    }),
    'retry-desktop',
  );
});

test('offers the desktop download when the updater is available', () => {
  assert.equal(
    resolveAutoUpdatePrimaryAction({ hasUpdate: true, startDesktopDownload: true }),
    'download-desktop',
  );
  assert.equal(
    resolveAutoUpdatePrimaryAction({ hasUpdate: true }, { desktopUpdaterAvailable: true }),
    'download-desktop',
  );
});

test('prefers the desktop download over a hot apply', () => {
  assert.equal(
    resolveAutoUpdatePrimaryAction({ hasUpdate: true, canHotApply: true }, { desktopUpdaterAvailable: true }),
    'download-desktop',
  );
});

test('hot-applies when that is the only option', () => {
  assert.equal(resolveAutoUpdatePrimaryAction({ hasUpdate: true, canHotApply: true }), 'hot-apply');
});

test('reports unavailable when an update exists but nothing can act on it', () => {
  assert.equal(resolveAutoUpdatePrimaryAction({ hasUpdate: true }), 'unavailable');
  assert.equal(resolveAutoUpdatePrimaryAction({ hasUpdate: true, canHotApply: false }), 'unavailable');
});

test('returns a fresh state that is already available or downloaded', async () => {
  for (const state of ['available', 'downloaded']) {
    const calls = [];
    const bridge = {
      getUpdateState: async () => {
        calls.push('get');
        return { state };
      },
      checkForUpdates: async () => {
        calls.push('check');
        return { ok: true };
      },
    };
    const result = await ensureDesktopUpdateAvailable(bridge);
    assert.deepEqual(result, { state });
    assert.deepEqual(calls, ['get']);
  }
});

test('treats an errored state with details as a usable update state', async () => {
  const bridge = {
    getUpdateState: async () => ({ state: 'error', latestInfo: { version: '1.2.3' } }),
    checkForUpdates: async () => {
      throw new Error('should not be called');
    },
  };
  assert.deepEqual(await ensureDesktopUpdateAvailable(bridge), {
    state: 'error',
    latestInfo: { version: '1.2.3' },
  });
});

test('re-checks once when the fresh state is idle', async () => {
  const states = [{ state: 'idle' }, { state: 'available', latestInfo: { version: '9' } }];
  const calls = [];
  const bridge = {
    getUpdateState: async () => {
      calls.push('get');
      return states.shift();
    },
    checkForUpdates: async () => {
      calls.push('check');
      return { ok: true };
    },
  };
  assert.deepEqual(await ensureDesktopUpdateAvailable(bridge), {
    state: 'available',
    latestInfo: { version: '9' },
  });
  assert.deepEqual(calls, ['get', 'check', 'get']);
});

test('throws when the desktop updater skips the check or fails', async () => {
  for (const check of [{ skipped: true }, { ok: false }]) {
    const bridge = {
      getUpdateState: async () => ({ state: 'idle' }),
      checkForUpdates: async () => check,
    };
    await assert.rejects(() => ensureDesktopUpdateAvailable(bridge), /desktop updater unavailable/);
  }
});

test('throws when the re-checked state is still not actionable', async () => {
  for (const state of [
    { state: 'idle' },
    { state: 'error' },
    { state: 'error', latestInfo: null },
    undefined,
  ]) {
    const bridge = {
      getUpdateState: async () => state,
      checkForUpdates: async () => ({ ok: true }),
    };
    await assert.rejects(() => ensureDesktopUpdateAvailable(bridge), /desktop update not available/);
  }
});

test('accepts a downloaded state discovered only after the re-check', async () => {
  const states = [{ state: 'idle' }, { state: 'downloaded' }];
  const bridge = {
    getUpdateState: async () => states.shift(),
    checkForUpdates: async () => ({ ok: true }),
  };
  assert.deepEqual(await ensureDesktopUpdateAvailable(bridge), { state: 'downloaded' });
});

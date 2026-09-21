const DEFAULT_CLOSE_RECOVERY_TIMEOUT_MS = 0x9c4;
function delay(_0x3f3fab) {
  return new Promise((_0x2f8570) => {
    setTimeout(_0x2f8570, _0x3f3fab);
  });
}
export async function requestRendererRecoverySnapshot(
  _0x589313,
  _0x4bbf5e = 'window-close',
  { timeoutMs: timeoutMs = DEFAULT_CLOSE_RECOVERY_TIMEOUT_MS } = {},
) {
  if (!_0x589313 || _0x589313.isDestroyed()) return { success: false, reason: 'window-unavailable' };
  const _0x401782 =
    '(() => {\n    const writer = window.__aiCanvasWriteRecoverySnapshotForClose;\n    if (typeof writer !== "function") {\n      return { success: false, reason: "writer-unavailable" };\n    }\n    return Promise.resolve(writer(' +
    JSON.stringify(_0x4bbf5e) +
    ')).catch((error) => ({\n      success: false,\n      error: String(error && error.message ? error.message : error),\n    }));\n  })()';
  return await Promise.race([
    _0x589313.webContents.executeJavaScript(_0x401782, true),
    delay(timeoutMs).then(() => ({ success: false, reason: 'timeout' })),
  ]);
}
export function installRecoverySnapshotBeforeClose(_0x212f51, _0x5ef38e = {}) {
  if (!_0x212f51) return;
  const _0x1bb744 =
      typeof _0x5ef38e.getRendererProjectState === 'function'
        ? _0x5ef38e.getRendererProjectState
        : () => ({}),
    _0x29fbc3 = typeof _0x5ef38e.shouldBypassClose === 'function' ? _0x5ef38e.shouldBypassClose : () => false,
    _0x38a9a0 =
      typeof _0x5ef38e.requestSnapshot === 'function'
        ? _0x5ef38e.requestSnapshot
        : requestRendererRecoverySnapshot,
    _0x16f3cd = typeof _0x5ef38e.logEvent === 'function' ? _0x5ef38e.logEvent : () => {};
  let _0xa642a8 = false,
    _0x434767 = false;
  _0x212f51.on('close', (_0x2400e4) => {
    if (_0x29fbc3()) return;
    if (_0xa642a8) {
      _0xa642a8 = false;
      return;
    }
    const _0x1a8233 = _0x1bb744();
    if (_0x1a8233?.hasUnsavedChanges !== true) return;
    _0x2400e4.preventDefault();
    if (_0x434767) return;
    ((_0x434767 = true),
      void (async () => {
        try {
          const _0x5d2506 = await _0x38a9a0(_0x212f51, 'window-close');
          _0x5d2506?.success === false &&
            _0x16f3cd({
              type: 'project.recovery_snapshot_before_close_failed',
              level: 'warn',
              source: 'main',
              message: 'Recovery snapshot before close failed',
              context: { reason: _0x5d2506.reason || '', error: _0x5d2506.error || '' },
            });
        } catch (_0x373eb8) {
          _0x16f3cd({
            type: 'project.recovery_snapshot_before_close_failed',
            level: 'warn',
            source: 'main',
            message: 'Recovery snapshot before close failed',
            error: _0x373eb8,
          });
        } finally {
          ((_0x434767 = false), (_0xa642a8 = true));
          if (!_0x212f51.isDestroyed()) _0x212f51.close();
        }
      })());
  });
}

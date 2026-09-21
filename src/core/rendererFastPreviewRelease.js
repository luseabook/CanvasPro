const DEFAULT_RELEASE_RETRY_MS = 80,
  DEFAULT_RELEASE_MAX_ATTEMPTS = 24;
function isElementVisible(_0x1121d6) {
  if (!_0x1121d6 || _0x1121d6.isConnected === false) return false;
  const _0x1a8bbd = _0x1121d6.style || {};
  return _0x1a8bbd.display !== 'none' && _0x1a8bbd.visibility !== 'hidden' && _0x1a8bbd.opacity !== '0';
}
function hasReadyImage(_0x3464a1) {
  for (const _0x14be90 of _0x3464a1?.querySelectorAll?.('img') || []) {
    const _0x2867b0 = _0x14be90.currentSrc || _0x14be90.src || _0x14be90.getAttribute?.('src') || '';
    if (!_0x2867b0 || !isElementVisible(_0x14be90)) continue;
    if (_0x14be90.complete === false) continue;
    if (Number(_0x14be90.naturalWidth || 0) > 0 || _0x14be90.complete === undefined) return true;
  }
  return false;
}
function hasReadyVideo(_0x3d46ce) {
  for (const _0x57ede3 of _0x3d46ce?.querySelectorAll?.('video') || []) {
    const _0x13e9fd = _0x57ede3.currentSrc || _0x57ede3.src || _0x57ede3.getAttribute?.('src') || '';
    if (!_0x13e9fd || !isElementVisible(_0x57ede3)) continue;
    if (Number(_0x57ede3.readyState || 0) >= 2) return true;
  }
  return false;
}
function hasAnyMedia(_0x130261) {
  return !!(_0x130261?.querySelector?.('img') || _0x130261?.querySelector?.('video'));
}
function isRealMediaReady(_0x368bde) {
  if (!hasAnyMedia(_0x368bde)) return true;
  return hasReadyImage(_0x368bde) || hasReadyVideo(_0x368bde);
}
function isStillDetailDeferred(_0x285f2f) {
  return (
    _0x285f2f?.classList?.contains?.('v2-node-detail-deferred') ||
    _0x285f2f?.dataset?.detailStage === 'deferred'
  );
}
export function createFastPreviewReleaseScheduler({
  getWrapper: _0x3d67ae,
  isInteractionBusy: _0x7b7fd6,
  releasePreview: _0x26cdcb,
  retryMs: retryMs = DEFAULT_RELEASE_RETRY_MS,
  maxAttempts: maxAttempts = DEFAULT_RELEASE_MAX_ATTEMPTS,
} = {}) {
  const _0x2337c8 = new Map();
  function _0x3e8cb5(_0x231270) {
    const _0x3e8486 = String(_0x231270 || ''),
      _0x517e6a = _0x2337c8.get(_0x3e8486);
    if (_0x517e6a !== undefined) clearTimeout(_0x517e6a);
    _0x2337c8.delete(_0x3e8486);
  }
  function _0x1cbfc0(_0x1080a6, _0x4e9099 = 0) {
    const _0x4ba4cb = String(_0x1080a6 || '');
    if (!_0x4ba4cb) return;
    _0x3e8cb5(_0x4ba4cb);
    const _0x1416e0 = _0x3d67ae?.(_0x4ba4cb);
    if (!_0x1416e0?.isConnected) {
      _0x26cdcb?.(_0x4ba4cb);
      return;
    }
    if (
      !_0x7b7fd6?.() &&
      !isStillDetailDeferred(_0x1416e0) &&
      (isRealMediaReady(_0x1416e0) || _0x4e9099 >= maxAttempts)
    ) {
      _0x26cdcb?.(_0x4ba4cb);
      return;
    }
    _0x2337c8.set(
      _0x4ba4cb,
      setTimeout(() => _0x1cbfc0(_0x4ba4cb, _0x4e9099 + 1), retryMs),
    );
  }
  function _0x222ab4() {
    for (const _0x59333f of _0x2337c8.values()) clearTimeout(_0x59333f);
    _0x2337c8.clear();
  }
  return { clear: _0x222ab4, forget: _0x3e8cb5, schedule: _0x1cbfc0 };
}

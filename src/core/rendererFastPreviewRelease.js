const DEFAULT_RELEASE_RETRY_MS = 80,
  DEFAULT_RELEASE_MAX_ATTEMPTS = 24;
function isElementVisible(el) {
  if (!el || el.isConnected === false) return false;
  const value = el.style || {};
  return value.display !== 'none' && value.visibility !== 'hidden' && value.opacity !== '0';
}
function hasReadyImage(el2) {
  for (const item of el2?.querySelectorAll?.('img') || []) {
    const enabled = item.currentSrc || item.src || item.getAttribute?.('src') || '';
    if (!enabled || !isElementVisible(item)) continue;
    if (item.complete === false) continue;
    if (Number(item.naturalWidth || 0) > 0 || item.complete === undefined) return true;
  }
  return false;
}
function hasReadyVideo(el3) {
  for (const key of el3?.querySelectorAll?.('video') || []) {
    const enabled2 = key.currentSrc || key.src || key.getAttribute?.('src') || '';
    if (!enabled2 || !isElementVisible(key)) continue;
    if (Number(key.readyState || 0) >= 2) return true;
  }
  return false;
}
function hasAnyMedia(el4) {
  return !!(el4?.querySelector?.('img') || el4?.querySelector?.('video'));
}
function isRealMediaReady(index) {
  if (!hasAnyMedia(index)) return true;
  return hasReadyImage(index) || hasReadyVideo(index);
}
function isStillDetailDeferred(el5) {
  return el5?.classList?.contains?.('v2-node-detail-deferred') || el5?.dataset?.detailStage === 'deferred';
}
export function createFastPreviewReleaseScheduler({
  getWrapper: getWrapper,
  isInteractionBusy: isInteractionBusy,
  releasePreview: releasePreview,
  retryMs: retryMs = DEFAULT_RELEASE_RETRY_MS,
  maxAttempts: maxAttempts = DEFAULT_RELEASE_MAX_ATTEMPTS,
} = {}) {
  const map = new Map();
  function forget(result) {
    const data = String(result || ''),
      options = map.get(data);
    if (options !== undefined) clearTimeout(options);
    map.delete(data);
  }
  function schedule(target, source = 0) {
    const enabled3 = String(target || '');
    if (!enabled3) return;
    forget(enabled3);
    const el6 = getWrapper?.(enabled3);
    if (!el6?.isConnected) {
      releasePreview?.(enabled3);
      return;
    }
    if (
      !isInteractionBusy?.() &&
      !isStillDetailDeferred(el6) &&
      (isRealMediaReady(el6) || source >= maxAttempts)
    ) {
      releasePreview?.(enabled3);
      return;
    }
    map.set(
      enabled3,
      setTimeout(() => schedule(enabled3, source + 1), retryMs),
    );
  }
  function clear() {
    for (const next of map.values()) clearTimeout(next);
    map.clear();
  }
  return { clear: clear, forget: forget, schedule: schedule };
}

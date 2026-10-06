const HANDOFF_CLASS = 'is-canvas-image-handoff',
  HANDOFF_FALLBACK_PROPERTY = '--canvas-image-handoff-fallback',
  HANDOFF_FALLBACK_POSITION_PROPERTY = '--canvas-image-handoff-fallback-position',
  HANDOFF_FALLBACK_SIZE_PROPERTY = '--canvas-image-handoff-fallback-size',
  handoffByImage = new WeakMap();
function readImageSource(value) {
  return String(value?.getAttribute?.('src') || value?.currentSrc || value?.src || '').trim();
}
function isImagePaintReady(item) {
  return !!(item?.complete === true && Number(item?.naturalWidth || 0) > 0);
}
function hasPaintedImageSource(el, key) {
  return !!(
    key &&
    el?.style?.display !== 'none' &&
    el?.complete !== false &&
    (el?.naturalWidth === undefined || Number(el.naturalWidth || 0) > 0)
  );
}
function readFallbackLayout(el2) {
  let index = null;
  if (typeof globalThis.getComputedStyle === 'function')
    try {
      index = globalThis.getComputedStyle(el2);
    } catch {}
  const result = String(el2?.style?.objectFit || index?.objectFit || 'cover').trim(),
    position = String(el2?.style?.objectPosition || index?.objectPosition || 'center').trim(),
    size =
      result === 'contain' || result === 'scale-down'
        ? 'contain'
        : result === 'fill'
          ? '100% 100%'
          : result === 'none'
            ? 'auto'
            : 'cover';
  return { position: position || 'center', size: size };
}
function removeStateListeners(el3, enabled) {
  if (!enabled || typeof el3?.removeEventListener !== 'function') return;
  (el3.removeEventListener('load', enabled.onLoad),
    el3.removeEventListener('error', enabled.onError));
}
function clearFallbackStyle(el4) {
  (el4?.classList?.remove?.(HANDOFF_CLASS),
    el4?.style?.removeProperty?.(HANDOFF_FALLBACK_PROPERTY),
    el4?.style?.removeProperty?.(HANDOFF_FALLBACK_POSITION_PROPERTY),
    el4?.style?.removeProperty?.(HANDOFF_FALLBACK_SIZE_PROPERTY));
}
function releaseFallbackCallbacks(args) {
  if (!args?.fallbackReleaseCallbacks?.size) return;
  const data = [...args.fallbackReleaseCallbacks];
  args.fallbackReleaseCallbacks.clear();
  for (const run of data) {
    try {
      run(args.fallbackSource);
    } catch {}
  }
}
function finishHandoff(enabled2, options, target = {}) {
  if (!enabled2 || handoffByImage.get(enabled2) !== options) return false;
  return (
    removeStateListeners(enabled2, options),
    handoffByImage.delete(enabled2),
    clearFallbackStyle(enabled2),
    target.releaseFallback !== false
      ? releaseFallbackCallbacks(options)
      : options.fallbackReleaseCallbacks?.clear?.(),
    true
  );
}
function schedulePaintedHandoffFinish(enabled3, source) {
  if (
    !enabled3 ||
    handoffByImage.get(enabled3) !== source ||
    readImageSource(enabled3) !== source.targetSource ||
    source.finishScheduled
  )
    return;
  source.finishScheduled = true;
  const promise =
    typeof enabled3.decode === 'function'
      ? Promise.resolve()
          .then(() => enabled3.decode())
          .catch(() => {})
      : Promise.resolve();
  promise.then(() => {
    if (handoffByImage.get(enabled3) !== source || readImageSource(enabled3) !== source.targetSource)
      return;
    if (!isImagePaintReady(enabled3)) {
      source.finishScheduled = false;
      return;
    }
    finishHandoff(enabled3, source);
  });
}
function restoreFallbackAfterError(el5, enabled4) {
  if (!el5 || handoffByImage.get(el5) !== enabled4 || readImageSource(el5) !== enabled4.targetSource)
    return;
  (removeStateListeners(el5, enabled4), (enabled4.finishScheduled = false));
  if (!enabled4.fallbackSource) {
    finishHandoff(el5, enabled4);
    return;
  }
  if (el5.dataset) {
    if (enabled4.fallbackLod) el5.dataset.lodSrc = enabled4.fallbackLod;
    else delete el5.dataset.lodSrc;
  }
  enabled4.targetSource = enabled4.fallbackSource;
  const run2 = () => {
    if (handoffByImage.get(el5) !== enabled4) return;
    (removeStateListeners(el5, enabled4),
      (enabled4.finishScheduled = false),
      (enabled4.restoredFallback = true),
      clearFallbackStyle(el5));
  };
  ((enabled4.onLoad = run2),
    (enabled4.onError = () => finishHandoff(el5, enabled4, { releaseFallback: false })),
    el5.addEventListener?.('load', enabled4.onLoad, { once: true }),
    el5.addEventListener?.('error', enabled4.onError, { once: true }),
    (el5.src = enabled4.fallbackSource),
    isImagePaintReady(el5) && run2());
}
export function deferCanvasImageDisplayFallbackRelease(next, current, entry) {
  const enabled5 = String(current || '').trim(),
    enabled6 = next ? handoffByImage.get(next) : null;
  if (!enabled5 || !enabled6 || enabled6.fallbackSource !== enabled5 || typeof entry !== 'function')
    return false;
  return (enabled6.fallbackReleaseCallbacks.add(entry), true);
}
export function clearCanvasImageDisplayHandoff(enabled7) {
  if (!enabled7) return false;
  const enabled8 = handoffByImage.get(enabled7);
  if (enabled8) return finishHandoff(enabled7, enabled8);
  return (clearFallbackStyle(enabled7), !!enabled8);
}
export function assignCanvasImageDisplaySource(el6, record) {
  const targetSource = String(record || '').trim();
  if (!el6 || !targetSource) return false;
  const imageSource = readImageSource(el6),
    enabled9 = handoffByImage.get(el6);
  if (imageSource === targetSource && (!enabled9 || enabled9.targetSource === targetSource)) return false;
  let fallbackSource = '',
    fallbackLod = '';
  const payload = !!(
    enabled9 &&
    imageSource === enabled9.targetSource &&
    hasPaintedImageSource(el6, imageSource) &&
    isImagePaintReady(el6)
  );
  if (payload) ((fallbackSource = imageSource), (fallbackLod = String(el6?.dataset?.lodSrc || '')));
  else {
    if (enabled9?.fallbackSource)
      ((fallbackSource = enabled9.fallbackSource), (fallbackLod = enabled9.fallbackLod));
    else
      hasPaintedImageSource(el6, imageSource) &&
        ((fallbackSource = imageSource), (fallbackLod = String(el6?.dataset?.lodSrc || '')));
  }
  enabled9 && (removeStateListeners(el6, enabled9), handoffByImage.delete(el6));
  const fallbackReleaseCallbacks =
    enabled9?.fallbackSource === fallbackSource
      ? new Set(enabled9.fallbackReleaseCallbacks || [])
      : new Set();
  enabled9?.fallbackReleaseCallbacks?.size &&
    enabled9.fallbackSource !== fallbackSource &&
    releaseFallbackCallbacks(enabled9);
  if (!fallbackSource) return (clearFallbackStyle(el6), (el6.src = targetSource), true);
  const handle = {
    fallbackSource: fallbackSource,
    fallbackLod: fallbackLod,
    targetSource: targetSource,
    finishScheduled: false,
    fallbackReleaseCallbacks: fallbackReleaseCallbacks,
    onLoad: null,
    onError: null,
  };
  ((handle.onLoad = () => schedulePaintedHandoffFinish(el6, handle)),
    (handle.onError = () => restoreFallbackAfterError(el6, handle)),
    handoffByImage.set(el6, handle),
    el6.style?.setProperty?.(
      HANDOFF_FALLBACK_PROPERTY,
      'url(' + JSON.stringify(fallbackSource) + ')',
    ));
  const fallbackLayout = readFallbackLayout(el6);
  return (
    el6.style?.setProperty?.(HANDOFF_FALLBACK_POSITION_PROPERTY, fallbackLayout.position),
    el6.style?.setProperty?.(HANDOFF_FALLBACK_SIZE_PROPERTY, fallbackLayout.size),
    el6.classList?.add?.(HANDOFF_CLASS),
    el6.addEventListener?.('load', handle.onLoad, { once: true }),
    el6.addEventListener?.('error', handle.onError, { once: true }),
    (el6.src = targetSource),
    true
  );
}

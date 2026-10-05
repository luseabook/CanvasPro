const STARTUP_LOADER_ID = 'v2-initial-loader',
  STARTUP_VISUAL_FALLBACK_POLL_MS = 100;
function readLoaderPresentation(element, windowObject) {
  if (typeof windowObject?.['getComputedStyle'] === 'function')
    try {
      return windowObject['getComputedStyle'](element);
    } catch {}
  return element?.['style'] || null;
}
export function isStartupVisualComplete({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const loader = documentObject?.['getElementById']?.(STARTUP_LOADER_ID);
  if (!loader || loader['isConnected'] === false || loader['hidden'] === true) return true;
  const presentation = readLoaderPresentation(loader, windowObject);
  if (!presentation) return false;
  const display = String(presentation['display'] || '')
      ['trim']()
      ['toLowerCase'](),
    visibility = String(presentation['visibility'] || '')
      ['trim']()
      ['toLowerCase'](),
    opacity = Number['parseFloat'](String(presentation['opacity'] || '1'));
  return display === 'none' || visibility === 'hidden' || (Number['isFinite'](opacity) && opacity <= 0.001);
}
export function waitForStartupVisualComplete({
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
} = {}) {
  if (isStartupVisualComplete({ documentObject: documentObject, windowObject: windowObject }))
    return Promise['resolve']();
  const schedulePoll =
      typeof windowObject?.['setTimeout'] === 'function'
        ? windowObject['setTimeout']['bind'](windowObject)
        : globalThis['setTimeout'],
    cancelPoll =
      typeof windowObject?.['clearTimeout'] === 'function'
        ? windowObject['clearTimeout']['bind'](windowObject)
        : globalThis['clearTimeout'];
  return new Promise((resolve) => {
    let settled = false,
      observer = null,
      pollTimer = null;
    const loaderElement = documentObject?.['getElementById']?.(STARTUP_LOADER_ID),
      finish = () => {
        if (settled) return;
        ((settled = true),
          observer?.['disconnect']?.(),
          loaderElement?.['removeEventListener']?.('animationend', checkComplete),
          loaderElement?.['removeEventListener']?.('transitionend', checkComplete),
          pollTimer !== null && typeof cancelPoll === 'function' && cancelPoll(pollTimer),
          resolve());
      },
      checkComplete = () => {
        if (isStartupVisualComplete({ documentObject: documentObject, windowObject: windowObject }))
          return (finish(), true);
        return false;
      },
      poll = () => {
        if (settled || checkComplete()) return;
        typeof schedulePoll === 'function' &&
          (pollTimer = schedulePoll(poll, STARTUP_VISUAL_FALLBACK_POLL_MS));
      },
      MutationObserverCtor = windowObject?.['MutationObserver'] || globalThis['MutationObserver'],
      observeTarget =
        documentObject?.['documentElement'] || documentObject?.['getElementById']?.(STARTUP_LOADER_ID);
    typeof MutationObserverCtor === 'function' &&
      observeTarget &&
      ((observer = new MutationObserverCtor(checkComplete)),
      observer['observe'](observeTarget, {
        attributes: true,
        attributeFilter: ['class', 'hidden', 'style'],
        childList: true,
        subtree: true,
      }));
    (loaderElement?.['addEventListener']?.('animationend', checkComplete),
      loaderElement?.['addEventListener']?.('transitionend', checkComplete));
    if (checkComplete()) return;
    !observer &&
      typeof schedulePoll === 'function' &&
      (pollTimer = schedulePoll(poll, STARTUP_VISUAL_FALLBACK_POLL_MS));
  });
}
export function createLatestStartupVisualTaskQueue({
  isReady: isReady = () => isStartupVisualComplete(),
  waitUntilReady: waitUntilReady = () => waitForStartupVisualComplete(),
} = {}) {
  let pending = null,
    running = null;
  const startRun = () => {
    if (running) return;
    running = Promise['resolve']()
      ['then'](() => waitUntilReady())
      ['catch'](() => {})
      ['then'](() => {
        running = null;
        const task = pending;
        ((pending = null), task?.());
      });
  };
  return {
    clear() {
      pending = null;
    },
    defer(task) {
      if (typeof task !== 'function' || isReady()) return false;
      return ((pending = task), startRun(), true);
    },
    hasPending() {
      return typeof pending === 'function';
    },
  };
}

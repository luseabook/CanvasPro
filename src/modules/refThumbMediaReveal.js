import { preloadCanvasImage, resetCanvasMediaSchedulerForTests } from './canvasMediaScheduler.js';
let _decodePromiseMap = new Map(),
  _revealTokenMap = new WeakMap();
const REVEAL_RETRY_DELAYS_MS = [120, 0x140, 0x2d0],
  ATTACH_RETRY_DELAYS_MS = [0, 16, 50, 120];
function nextRevealToken(value) {
  const item = (_revealTokenMap.get(value) || 0) + 1;
  return (_revealTokenMap.set(value, item), item);
}
function isRevealCurrent(el, el2, key, index, enabled = false) {
  if (!el) return false;
  if (!enabled && el.isConnected === false) return false;
  if (key && el2?.dataset?.sig !== key) return false;
  return _revealTokenMap.get(el) === index;
}
function afterFrame(result) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(result);
    return;
  }
  setTimeout(result, 0);
}
function setThumbErrorState(el3, el4, data) {
  if (el3?.dataset) {
    if (data) el3.dataset.thumbError = '1';
    else delete el3.dataset.thumbError;
  }
  if (el4?.dataset) {
    if (data) el4.dataset.thumbError = '1';
    else delete el4.dataset.thumbError;
  }
}
function refreshImageElement(enabled2, enabled3) {
  if (!enabled2 || !enabled3) return;
  try {
    const options = String(enabled2.getAttribute?.('src') || enabled2.src || '').trim();
    (options === enabled3 && (enabled2.src = ''), (enabled2.src = enabled3));
  } catch {}
}
export function ensureThumbDecoded(target) {
  const enabled4 = String(target || '').trim();
  if (!enabled4) return Promise.resolve(false);
  const source = _decodePromiseMap.get(enabled4);
  if (source) return source;
  if (typeof Image !== 'function') return Promise.resolve(false);
  let next = null;
  const promise = preloadCanvasImage(enabled4, {
    priority: 40,
    fetchPriority: 'auto',
    decode: true,
    rejectTtlMs: 0,
  }).then(
    () => true,
    () => false,
  );
  return (
    (next = promise.then(
      (enabled5) => {
        return (
          !enabled5 && _decodePromiseMap.get(enabled4) === next && _decodePromiseMap.delete(enabled4),
          enabled5
        );
      },
      () => {
        return (_decodePromiseMap.get(enabled4) === next && _decodePromiseMap.delete(enabled4), false);
      },
    )),
    _decodePromiseMap.set(enabled4, next),
    next
  );
}
function revealSingleRefThumb(
  el5,
  current,
  entry,
  record,
  payload = 0,
  handle = 0,
  state = el5?.isConnected !== false,
) {
  if (!isRevealCurrent(el5, current, entry, record, true)) return;
  if (el5.isConnected === false) {
    if (state) return;
    const config = ATTACH_RETRY_DELAYS_MS[handle];
    if (config == null) return;
    setTimeout(() => {
      revealSingleRefThumb(el5, current, entry, record, payload, handle + 1, false);
    }, config);
    return;
  }
  el5.decoding = 'async';
  const scope = true,
    input = () => {
      if (!isRevealCurrent(el5, current, entry, record)) return;
      (setThumbErrorState(el5, current, false),
        el5.classList.remove('is-pending'),
        el5.classList.add('is-ready'));
    },
    handler = () => {
      if (!isRevealCurrent(el5, current, entry, record)) return;
      setThumbErrorState(el5, current, true);
    };
  if (el5.complete && el5.naturalWidth > 0) {
    afterFrame(input);
    return;
  }
  const enabled6 = String(el5.getAttribute('src') || '').trim();
  if (!enabled6) {
    handler();
    return;
  }
  (setThumbErrorState(el5, current, false),
    ensureThumbDecoded(enabled6)
      .then((output) => {
        if (!isRevealCurrent(el5, current, entry, record)) return;
        if (output) {
          (refreshImageElement(el5, enabled6), afterFrame(input));
          return;
        }
        const value2 = REVEAL_RETRY_DELAYS_MS[payload];
        if (value2 == null) {
          afterFrame(handler);
          return;
        }
        setTimeout(() => {
          revealSingleRefThumb(el5, current, entry, record, payload + 1, handle, scope);
        }, value2);
      })
      .catch(() => {
        if (!isRevealCurrent(el5, current, entry, record)) return;
        const value3 = REVEAL_RETRY_DELAYS_MS[payload];
        if (value3 == null) {
          afterFrame(handler);
          return;
        }
        setTimeout(() => {
          revealSingleRefThumb(el5, current, entry, record, payload + 1, handle, scope);
        }, value3);
      }));
}
export function revealRefThumbMedia(el6, value4 = '') {
  if (!el6) return;
  const value5 = String(value4 || ''),
    value6 = Array.from(el6.querySelectorAll('img.ref-thumb-media.is-pending'));
  for (const value7 of value6) {
    revealSingleRefThumb(value7, el6, value5, nextRevealToken(value7));
  }
}
export function _resetRefThumbMediaRevealForTests() {
  ((_decodePromiseMap = new Map()), (_revealTokenMap = new WeakMap()), resetCanvasMediaSchedulerForTests());
}

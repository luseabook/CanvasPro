const DEFAULT_IMAGE_PRELOAD_CONCURRENCY = 6,
  DEFAULT_PAUSED_BYPASS_PRIORITY = 95,
  imagePreloadQueue = [],
  imagePreloadInflight = new Map(),
  imagePreloadQueuedJobs = new Map();
let imagePreloadActive = 0,
  imagePreloadSequence = 0,
  imagePreloadStarted = 0,
  imagePreloadResolved = 0,
  imagePreloadRejected = 0,
  imagePreloadDeduped = 0,
  imagePreloadPromoted = 0,
  imagePreloadPeakActive = 0,
  imagePreloadCanceled = 0,
  imagePreloadPaused = false,
  imagePreloadPausedBypassPriority = DEFAULT_PAUSED_BYPASS_PRIORITY;
function normalizeUrl(_0xf231b4) {
  return String(_0xf231b4 || '').trim();
}
function isLikelyVideoUrl(_0x1e05f3) {
  return /\.(?:mp4|mov|webm|m4v|avi|mkv)(?:[?#].*)?$/i.test(String(_0x1e05f3 || '').trim());
}
function configureImage(_0x4208f3, { fetchPriority: fetchPriority = 'auto' } = {}) {
  if (!_0x4208f3) return;
  try {
    _0x4208f3.decoding = 'async';
  } catch {}
  try {
    if ('fetchPriority' in _0x4208f3) _0x4208f3.fetchPriority = fetchPriority;
  } catch {}
}
function normalizePriority(_0x4e1b40) {
  const _0x5e3841 = Number(_0x4e1b40);
  return Number.isFinite(_0x5e3841) ? _0x5e3841 : 0;
}
function getImagePreloadConcurrency() {
  const _0x203725 = Number(globalThis.__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__);
  if (Number.isFinite(_0x203725) && _0x203725 > 0) return Math.max(1, Math.floor(_0x203725));
  return DEFAULT_IMAGE_PRELOAD_CONCURRENCY;
}
function isImagePreloadJobEligible(_0x37ca42) {
  if (!imagePreloadPaused) return true;
  if (_0x37ca42?.allowWhenPaused === true) return true;
  return normalizePriority(_0x37ca42?.priority) >= imagePreloadPausedBypassPriority;
}
function pickNextImagePreloadJob() {
  let _0x38a6d9 = -1,
    _0x1ed744 = null;
  for (let _0x45ffca = 0; _0x45ffca < imagePreloadQueue.length; _0x45ffca += 1) {
    const _0x4aa26b = imagePreloadQueue[_0x45ffca];
    if (!isImagePreloadJobEligible(_0x4aa26b)) continue;
    (!_0x1ed744 ||
      _0x4aa26b.priority > _0x1ed744.priority ||
      (_0x4aa26b.priority === _0x1ed744.priority && _0x4aa26b.sequence < _0x1ed744.sequence)) &&
      ((_0x1ed744 = _0x4aa26b), (_0x38a6d9 = _0x45ffca));
  }
  if (_0x38a6d9 < 0) return null;
  return (imagePreloadQueue.splice(_0x38a6d9, 1), imagePreloadQueuedJobs.delete(_0x1ed744.url), _0x1ed744);
}
function cancelQueuedImagePreloadJob(_0x4c1ee0, _0x42a4d9 = 'canceled') {
  if (!_0x4c1ee0 || !imagePreloadQueuedJobs.has(_0x4c1ee0.url)) return false;
  imagePreloadQueuedJobs.delete(_0x4c1ee0.url);
  imagePreloadInflight.get(_0x4c1ee0.url) === _0x4c1ee0.promise && imagePreloadInflight.delete(_0x4c1ee0.url);
  imagePreloadCanceled += 1;
  try {
    _0x4c1ee0.reject(new Error('Image preload ' + _0x42a4d9));
  } catch {}
  return true;
}
export function cancelQueuedCanvasImagePreloads({
  scope: scope = '',
  belowPriority: belowPriority = null,
  reason: reason = 'canceled',
} = {}) {
  const _0x220845 = String(scope || '').trim(),
    _0x3f8da4 = Number(belowPriority),
    _0x246a4e = belowPriority !== null && belowPriority !== undefined && Number.isFinite(_0x3f8da4);
  let _0x159e67 = 0;
  for (let _0x39e64e = imagePreloadQueue.length - 1; _0x39e64e >= 0; _0x39e64e -= 1) {
    const _0x50659c = imagePreloadQueue[_0x39e64e];
    if (_0x220845 && _0x50659c.scope !== _0x220845) continue;
    if (_0x246a4e && normalizePriority(_0x50659c.priority) >= _0x3f8da4) continue;
    imagePreloadQueue.splice(_0x39e64e, 1);
    if (cancelQueuedImagePreloadJob(_0x50659c, reason)) _0x159e67 += 1;
  }
  return _0x159e67;
}
export function setCanvasMediaSchedulerPaused(_0x403852, _0x1c7f19 = {}) {
  const _0x4b4249 = _0x403852 === true;
  imagePreloadPaused = _0x4b4249;
  Number.isFinite(Number(_0x1c7f19.bypassPriority)) &&
    (imagePreloadPausedBypassPriority = Number(_0x1c7f19.bypassPriority));
  if (!_0x4b4249) pumpImagePreloadQueue();
}
function promoteQueuedImagePreloadJob(_0x21cd19, _0x48170b = {}) {
  const _0x4724c0 = imagePreloadQueuedJobs.get(_0x21cd19);
  if (!_0x4724c0) return false;
  const _0x18e468 = normalizePriority(_0x48170b.priority);
  let _0x1cb092 = false;
  _0x18e468 > _0x4724c0.priority && ((_0x4724c0.priority = _0x18e468), (_0x1cb092 = true));
  _0x48170b.fetchPriority === 'high' &&
    _0x4724c0.fetchPriority !== 'high' &&
    ((_0x4724c0.fetchPriority = 'high'), (_0x1cb092 = true));
  if (_0x1cb092) imagePreloadPromoted += 1;
  return _0x1cb092;
}
function pumpImagePreloadQueue() {
  const _0x2b7f94 = getImagePreloadConcurrency();
  while (imagePreloadActive < _0x2b7f94 && imagePreloadQueue.length > 0) {
    const _0x2e57fc = pickNextImagePreloadJob();
    if (!_0x2e57fc) return;
    ((imagePreloadActive += 1),
      (imagePreloadStarted += 1),
      (imagePreloadPeakActive = Math.max(imagePreloadPeakActive, imagePreloadActive)));
    let _0xb38b75 = false;
    const _0x420fa9 = (_0x2c649d, _0xb22543) => {
        if (_0xb38b75) return;
        ((_0xb38b75 = true),
          (imagePreloadActive = Math.max(0, imagePreloadActive - 1)),
          _0x2c649d(_0xb22543),
          pumpImagePreloadQueue());
      },
      _0x52bcea = (_0x10f73a) => {
        if (_0xb38b75) return;
        ((imagePreloadResolved += 1), _0x420fa9(_0x2e57fc.resolve, _0x10f73a));
      },
      _0x409c9d = (_0x581ab4) => {
        if (_0xb38b75) return;
        ((imagePreloadRejected += 1), _0x420fa9(_0x2e57fc.reject, _0x581ab4));
      };
    try {
      const _0x541472 = new Image();
      (configureImage(_0x541472, { fetchPriority: _0x2e57fc.fetchPriority }),
        (_0x541472.onload = () => {
          _0x52bcea({
            image: _0x541472,
            naturalWidth: _0x541472.naturalWidth || 0,
            naturalHeight: _0x541472.naturalHeight || 0,
          });
        }),
        (_0x541472.onerror = () => {
          _0x409c9d(new Error('Image preload failed'));
        }),
        (_0x541472.src = _0x2e57fc.url),
        typeof _0x541472.decode === 'function' &&
          _0x541472.decode().then(
            () => {
              _0x52bcea({
                image: _0x541472,
                naturalWidth: _0x541472.naturalWidth || 0,
                naturalHeight: _0x541472.naturalHeight || 0,
              });
            },
            (_0x111734) => {
              _0x409c9d(_0x111734 || new Error('Image decode failed'));
            },
          ));
    } catch (_0x530cad) {
      _0x409c9d(_0x530cad);
    }
  }
}
export function preloadCanvasImage(_0x378a5a, _0x5b298a = {}) {
  const _0x14f5d3 = normalizeUrl(_0x378a5a);
  if (!_0x14f5d3) return Promise.reject(new Error('Image source is empty'));
  if (isLikelyVideoUrl(_0x14f5d3)) return Promise.reject(new Error('Image preload skipped video source'));
  const _0x807068 = imagePreloadInflight.get(_0x14f5d3);
  if (_0x807068)
    return (
      (imagePreloadDeduped += 1),
      promoteQueuedImagePreloadJob(_0x14f5d3, _0x5b298a) && pumpImagePreloadQueue(),
      _0x807068
    );
  let _0x479aa2 = null;
  const _0x1fd7e8 = new Promise((_0x4e2426, _0x2354cc) => {
      _0x479aa2 = {
        url: _0x14f5d3,
        resolve: _0x4e2426,
        reject: _0x2354cc,
        promise: null,
        priority: normalizePriority(_0x5b298a.priority),
        fetchPriority: _0x5b298a.fetchPriority === 'high' ? 'high' : 'auto',
        scope: String(_0x5b298a.scope || '').trim(),
        allowWhenPaused: _0x5b298a.allowWhenPaused === true,
        sequence: imagePreloadSequence++,
      };
    }),
    _0x4b4a10 = _0x1fd7e8.finally(() => {
      imagePreloadInflight.get(_0x14f5d3) === _0x4b4a10 && imagePreloadInflight.delete(_0x14f5d3);
    });
  return (
    (_0x479aa2.promise = _0x4b4a10),
    imagePreloadQueue.push(_0x479aa2),
    imagePreloadQueuedJobs.set(_0x14f5d3, _0x479aa2),
    imagePreloadInflight.set(_0x14f5d3, _0x4b4a10),
    pumpImagePreloadQueue(),
    _0x4b4a10
  );
}
export function getCanvasMediaSchedulerStats() {
  return {
    imagePreloadActive: imagePreloadActive,
    imagePreloadQueued: imagePreloadQueue.length,
    imagePreloadInflight: imagePreloadInflight.size,
    imagePreloadConcurrency: getImagePreloadConcurrency(),
    imagePreloadStarted: imagePreloadStarted,
    imagePreloadResolved: imagePreloadResolved,
    imagePreloadRejected: imagePreloadRejected,
    imagePreloadDeduped: imagePreloadDeduped,
    imagePreloadPromoted: imagePreloadPromoted,
    imagePreloadPeakActive: imagePreloadPeakActive,
    imagePreloadCanceled: imagePreloadCanceled,
    imagePreloadPaused: imagePreloadPaused,
    imagePreloadPausedBypassPriority: imagePreloadPausedBypassPriority,
  };
}
export function resetCanvasMediaSchedulerForTests() {
  ((imagePreloadQueue.length = 0),
    imagePreloadInflight.clear(),
    imagePreloadQueuedJobs.clear(),
    (imagePreloadActive = 0),
    (imagePreloadSequence = 0),
    (imagePreloadStarted = 0),
    (imagePreloadResolved = 0),
    (imagePreloadRejected = 0),
    (imagePreloadDeduped = 0),
    (imagePreloadPromoted = 0),
    (imagePreloadPeakActive = 0),
    (imagePreloadCanceled = 0),
    (imagePreloadPaused = false),
    (imagePreloadPausedBypassPriority = DEFAULT_PAUSED_BYPASS_PRIORITY));
}

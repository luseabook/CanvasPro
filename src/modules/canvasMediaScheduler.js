import { localPathToUrl, urlToLocalPath } from '../utils/localMediaPath.js';
const DEFAULT_IMAGE_PRELOAD_CONCURRENCY = 0x6,
  DEFAULT_PAUSED_BYPASS_PRIORITY = 0x5f,
  DEFAULT_IMAGE_PRELOAD_TIMEOUT_MS = 0x1388,
  DEFAULT_IMAGE_PRELOAD_CACHE_TTL_MS = 0x7530,
  DEFAULT_IMAGE_PRELOAD_REJECT_TTL_MS = 0x2ee0,
  MAX_IMAGE_PRELOAD_CACHE_ENTRIES = 0x200,
  MAX_IMAGE_PRELOAD_DRAWABLE_BYTES = 0x80 * 0x400 * 0x400,
  HIGH_PRIORITY_OVERFLOW_THRESHOLD = 0x64,
  HIGH_PRIORITY_OVERFLOW_EXTRA_SLOTS = 0x1,
  imagePreloadQueue = [],
  imagePreloadInflight = new Map(),
  imagePreloadQueuedJobs = new Map(),
  imagePreloadActiveJobs = new Map(),
  imagePreloadResolvedCache = new Map();
let resolvedCacheTimer = null,
  imagePreloadDrawableEvictions = 0x0;
function drawableBytes(value) {
  return value?.['image']
    ? Math['max'](0x0, Number(value['naturalWidth']) || 0x0) *
        Math['max'](0x0, Number(value['naturalHeight']) || 0x0) *
        0x4
    : 0x0;
}
const imagePreloadRejectedCache = new Map(),
  imageDisplayLoadsByKey = new Map(),
  imageDisplayLoadByElement = new WeakMap();
let sharedCanvasImageElements = new WeakSet(),
  imagePreloadActive = 0x0,
  imagePreloadSequence = 0x0,
  imagePreloadStarted = 0x0,
  imagePreloadResolved = 0x0,
  imagePreloadRejected = 0x0,
  imagePreloadDeduped = 0x0,
  imagePreloadCacheHits = 0x0,
  imagePreloadRejectCacheHits = 0x0,
  imagePreloadPromoted = 0x0,
  imagePreloadPeakActive = 0x0,
  imagePreloadCanceled = 0x0,
  imagePreloadResolvedCachePrimes = 0x0,
  imagePreloadPaused = ![],
  imagePreloadPausedBypassPriority = DEFAULT_PAUSED_BYPASS_PRIORITY;
const imagePreloadPauseSources = new Set();
function normalizeUrl(item) {
  return String(item || '')['trim']();
}
function normalizeImagePreloadKey(key) {
  const url = normalizeUrl(key);
  if (!url) return '';
  const localPath = urlToLocalPath(url);
  return localPath ? localPathToUrl(localPath) || url : url;
}
function nowMs() {
  return Date['now']();
}
function isLikelyVideoUrl(index) {
  return /\.(?:mp4|mov|webm|m4v|avi|mkv)(?:[?#].*)?$/i['test'](String(index || '')['trim']());
}
function isLikelyAudioUrl(result) {
  return /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i['test'](String(result || '')['trim']());
}
function isLikelyNonImageMediaUrl(data) {
  const options = String(data || '')['trim']();
  return isLikelyVideoUrl(options) || isLikelyAudioUrl(options);
}
function configureImage(enabled, { fetchPriority: fetchPriority = 'auto' } = {}) {
  if (!enabled) return;
  try {
    enabled['decoding'] = 'async';
  } catch {}
  try {
    if ('fetchPriority' in enabled) enabled['fetchPriority'] = fetchPriority;
  } catch {}
}
function normalizePriority(target) {
  const source = Number(target);
  return Number['isFinite'](source) ? source : 0x0;
}
function getImagePreloadConcurrency() {
  const count = Number(globalThis['__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__']);
  if (Number['isFinite'](count) && count > 0x0) return Math['max'](0x1, Math['floor'](count));
  return DEFAULT_IMAGE_PRELOAD_CONCURRENCY;
}
function isImagePreloadJobEligible(next) {
  if (!imagePreloadPaused) return !![];
  if (next?.['allowWhenPaused'] === !![]) return !![];
  if (next?.['deferWhenPaused'] === !![]) return ![];
  return normalizePriority(next?.['priority']) >= imagePreloadPausedBypassPriority;
}
function isImagePreloadOverflowEligible(current) {
  return (
    current?.['allowWhenPaused'] === !![] &&
    current?.['deferWhenPaused'] !== !![] &&
    normalizePriority(current?.['priority']) >= HIGH_PRIORITY_OVERFLOW_THRESHOLD
  );
}
function pickNextImagePreloadJob({ overflowOnly: overflowOnly = ![] } = {}) {
  let count2 = -0x1,
    enabled2 = null;
  for (let entry = 0x0; entry < imagePreloadQueue['length']; entry += 0x1) {
    const record = imagePreloadQueue[entry];
    if (!isImagePreloadJobEligible(record)) continue;
    if (overflowOnly && !isImagePreloadOverflowEligible(record)) continue;
    (!enabled2 ||
      record['priority'] > enabled2['priority'] ||
      (record['priority'] === enabled2['priority'] && record['sequence'] < enabled2['sequence'])) &&
      ((enabled2 = record), (count2 = entry));
  }
  if (count2 < 0x0) return null;
  return (
    imagePreloadQueue['splice'](count2, 0x1),
    imagePreloadQueuedJobs['delete'](jobCacheKey(enabled2)),
    enabled2
  );
}
function jobCacheKey(response) {
  return response?.['cacheKey'] || response?.['url'] || '';
}
function summarizeImagePreloadJob(allowWhenPaused) {
  if (!allowWhenPaused) return null;
  return {
    url: String(allowWhenPaused['url'] || ''),
    cacheKey: String(allowWhenPaused['cacheKey'] || ''),
    scope: String(allowWhenPaused['scope'] || ''),
    priority: normalizePriority(allowWhenPaused['priority']),
    fetchPriority: String(allowWhenPaused['fetchPriority'] || 'auto'),
    allowWhenPaused: allowWhenPaused['allowWhenPaused'] === !![],
    deferWhenPaused: allowWhenPaused['deferWhenPaused'] === !![],
    decode: allowWhenPaused['decode'] === !![],
    sequence: Number(allowWhenPaused['sequence'] || 0x0),
  };
}
function cancelQueuedImagePreloadJob(promise, payload = 'canceled') {
  const jobCacheKey2 = jobCacheKey(promise);
  if (!promise || !imagePreloadQueuedJobs['has'](jobCacheKey2)) return ![];
  imagePreloadQueuedJobs['delete'](jobCacheKey2);
  imagePreloadInflight['get'](jobCacheKey2) === promise['promise'] &&
    imagePreloadInflight['delete'](jobCacheKey2);
  imagePreloadCanceled += 0x1;
  try {
    promise['reject'](new Error('Image preload ' + payload));
  } catch {}
  return !![];
}
function shouldCancelImagePreloadJob(
  enabled3,
  { scope: scope2, hasPriorityLimit: hasPriorityLimit, priorityLimit: priorityLimit },
) {
  if (!enabled3) return ![];
  if (scope2 && enabled3['scope'] !== scope2) return ![];
  if (hasPriorityLimit && normalizePriority(enabled3['priority']) >= priorityLimit) return ![];
  return !![];
}
export function cancelQueuedCanvasImagePreloads({
  scope: scope = '',
  belowPriority: belowPriority = null,
  reason: reason = 'canceled',
  includeActive: includeActive = ![],
} = {}) {
  const scope3 = String(scope || '')['trim'](),
    priorityLimit2 = Number(belowPriority),
    hasPriorityLimit2 =
      belowPriority !== null && belowPriority !== undefined && Number['isFinite'](priorityLimit2);
  let handle = 0x0;
  for (let count3 = imagePreloadQueue['length'] - 0x1; count3 >= 0x0; count3 -= 0x1) {
    const state = imagePreloadQueue[count3];
    if (
      !shouldCancelImagePreloadJob(state, {
        scope: scope3,
        hasPriorityLimit: hasPriorityLimit2,
        priorityLimit: priorityLimit2,
      })
    )
      continue;
    imagePreloadQueue['splice'](count3, 0x1);
    if (cancelQueuedImagePreloadJob(state, reason)) handle += 0x1;
  }
  if (includeActive === !![]) {
    const config = Array['from'](imagePreloadActiveJobs['values']());
    for (const input of config) {
      if (
        !shouldCancelImagePreloadJob(input, {
          scope: scope3,
          hasPriorityLimit: hasPriorityLimit2,
          priorityLimit: priorityLimit2,
        })
      )
        continue;
      typeof input['cancelActive'] === 'function' && input['cancelActive'](reason) && (handle += 0x1);
    }
  }
  return handle;
}
export function setCanvasMediaSchedulerPaused(output, value2 = {}) {
  const value3 = output === !![],
    value4 = String(value2['source'] || 'default')['trim']() || 'default';
  value3 ? imagePreloadPauseSources['add'](value4) : imagePreloadPauseSources['delete'](value4);
  imagePreloadPaused = imagePreloadPauseSources['size'] > 0x0;
  Number['isFinite'](Number(value2['bypassPriority'])) &&
    (imagePreloadPausedBypassPriority = Number(value2['bypassPriority']));
  if (!imagePreloadPaused) pumpImagePreloadQueue();
}
function promoteQueuedImagePreloadJob(value5, value6 = {}) {
  const enabled4 = imagePreloadQueuedJobs['get'](normalizeImagePreloadKey(value5));
  if (!enabled4) return ![];
  const priority = normalizePriority(value6['priority']);
  let value7 = ![];
  priority > enabled4['priority'] && ((enabled4['priority'] = priority), (value7 = !![]));
  value6['fetchPriority'] === 'high' &&
    enabled4['fetchPriority'] !== 'high' &&
    ((enabled4['fetchPriority'] = 'high'), (value7 = !![]));
  if (value7) imagePreloadPromoted += 0x1;
  return value7;
}
function pruneResolvedImagePreloadCache(nowMs2 = nowMs()) {
  (clearTimeout(resolvedCacheTimer), (resolvedCacheTimer = null));
  for (const [value8, enabled5] of imagePreloadResolvedCache) {
    (!enabled5 || Number(enabled5['expiresAt'] || 0x0) <= nowMs2) &&
      imagePreloadResolvedCache['delete'](value8);
  }
  while (imagePreloadResolvedCache['size'] > MAX_IMAGE_PRELOAD_CACHE_ENTRIES) {
    const enabled6 = imagePreloadResolvedCache['keys']()['next']()['value'];
    if (!enabled6) break;
    imagePreloadResolvedCache['delete'](enabled6);
  }
  let value9 = Array['from'](imagePreloadResolvedCache['values']())['reduce'](
    (value10, el) => value10 + drawableBytes(el['value']),
    0x0,
  );
  for (const el2 of imagePreloadResolvedCache['values']()) {
    if (value9 <= MAX_IMAGE_PRELOAD_DRAWABLE_BYTES) break;
    const drawableBytes2 = drawableBytes(el2['value']);
    if (!drawableBytes2) continue;
    ((value9 -= drawableBytes2),
      (el2['value'] = { ...el2['value'], image: null }),
      imagePreloadDrawableEvictions++);
  }
  if (imagePreloadResolvedCache['size']) {
    const value11 = Math['min'](
      ...Array['from'](imagePreloadResolvedCache['values'](), (value12) => value12['expiresAt']),
    );
    ((resolvedCacheTimer = setTimeout(
      () => pruneResolvedImagePreloadCache(),
      Math['max'](0x1, value11 - nowMs2),
    )),
      resolvedCacheTimer?.['unref']?.());
  }
}
function pruneRejectedImagePreloadCache(nowMs3 = nowMs()) {
  for (const [value13, enabled7] of imagePreloadRejectedCache) {
    (!enabled7 || Number(enabled7['expiresAt'] || 0x0) <= nowMs3) &&
      imagePreloadRejectedCache['delete'](value13);
  }
  while (imagePreloadRejectedCache['size'] > MAX_IMAGE_PRELOAD_CACHE_ENTRIES) {
    const enabled8 = imagePreloadRejectedCache['keys']()['next']()['value'];
    if (!enabled8) break;
    imagePreloadRejectedCache['delete'](enabled8);
  }
}
function getResolvedImagePreloadCacheHit(value14, value15 = {}) {
  const imagePreloadKey = normalizeImagePreloadKey(value14);
  if (!imagePreloadKey) return null;
  const count4 = Number['isFinite'](Number(value15['ttlMs']))
    ? Math['max'](0x0, Number(value15['ttlMs']))
    : DEFAULT_IMAGE_PRELOAD_CACHE_TTL_MS;
  if (count4 <= 0x0) return null;
  const el3 = imagePreloadResolvedCache['get'](imagePreloadKey);
  if (!el3) return null;
  const nowMs4 = nowMs();
  if (Number(el3['expiresAt'] || 0x0) <= nowMs4)
    return (imagePreloadResolvedCache['delete'](imagePreloadKey), null);
  return (
    imagePreloadResolvedCache['delete'](imagePreloadKey),
    imagePreloadResolvedCache['set'](imagePreloadKey, el3),
    el3['value'] || null
  );
}
function getRejectedImagePreloadCacheHit(value16, value17 = {}) {
  const imagePreloadKey2 = normalizeImagePreloadKey(value16);
  if (!imagePreloadKey2) return null;
  const count5 = Number['isFinite'](Number(value17['rejectTtlMs']))
    ? Math['max'](0x0, Number(value17['rejectTtlMs']))
    : DEFAULT_IMAGE_PRELOAD_REJECT_TTL_MS;
  if (count5 <= 0x0) return null;
  const enabled9 = imagePreloadRejectedCache['get'](imagePreloadKey2);
  if (!enabled9) return null;
  const nowMs5 = nowMs();
  if (Number(enabled9['expiresAt'] || 0x0) <= nowMs5)
    return (imagePreloadRejectedCache['delete'](imagePreloadKey2), null);
  return enabled9['error'] || new Error('Image preload recently failed');
}
function rememberResolvedImagePreload(value18, value19, value20 = {}) {
  const imagePreloadKey3 = normalizeImagePreloadKey(value18);
  if (!imagePreloadKey3 || !value19) return;
  const count6 = Number['isFinite'](Number(value20['cacheTtlMs']))
    ? Math['max'](0x0, Number(value20['cacheTtlMs']))
    : DEFAULT_IMAGE_PRELOAD_CACHE_TTL_MS;
  if (count6 <= 0x0) return;
  const expiresAt = nowMs();
  (imagePreloadRejectedCache['delete'](imagePreloadKey3),
    imagePreloadResolvedCache['delete'](imagePreloadKey3),
    imagePreloadResolvedCache['set'](imagePreloadKey3, { expiresAt: expiresAt + count6, value: value19 }),
    pruneResolvedImagePreloadCache(expiresAt));
}
function rememberRejectedImagePreload(value21, error, value22 = {}) {
  const imagePreloadKey4 = normalizeImagePreloadKey(value21);
  if (!imagePreloadKey4) return;
  const count7 = Number['isFinite'](Number(value22['rejectTtlMs']))
    ? Math['max'](0x0, Number(value22['rejectTtlMs']))
    : DEFAULT_IMAGE_PRELOAD_REJECT_TTL_MS;
  if (count7 <= 0x0) return;
  const expiresAt2 = nowMs();
  (imagePreloadRejectedCache['delete'](imagePreloadKey4),
    imagePreloadRejectedCache['set'](imagePreloadKey4, {
      expiresAt: expiresAt2 + count7,
      error: error instanceof Error ? error : new Error('Image\x20preload\x20failed'),
    }),
    pruneRejectedImagePreloadCache(expiresAt2));
}
function pumpImagePreloadQueue() {
  const imagePreloadConcurrency = getImagePreloadConcurrency(),
    value23 = imagePreloadConcurrency + HIGH_PRIORITY_OVERFLOW_EXTRA_SLOTS;
  while (imagePreloadActive < value23 && imagePreloadQueue['length'] > 0x0) {
    const overflowOnly2 = imagePreloadActive >= imagePreloadConcurrency,
      fetchPriority2 = pickNextImagePreloadJob({ overflowOnly: overflowOnly2 });
    if (!fetchPriority2) return;
    ((imagePreloadActive += 0x1),
      (imagePreloadStarted += 0x1),
      (imagePreloadPeakActive = Math['max'](imagePreloadPeakActive, imagePreloadActive)));
    const jobCacheKey3 = jobCacheKey(fetchPriority2);
    imagePreloadActiveJobs['set'](jobCacheKey3, fetchPriority2);
    let value24 = ![],
      setTimeout2 = null;
    const run = () => {
        if (setTimeout2 === null || typeof clearTimeout !== 'function') return;
        (clearTimeout(setTimeout2), (setTimeout2 = null));
      },
      handler = (handler2, value25) => {
        if (value24) return;
        ((value24 = !![]),
          run(),
          imagePreloadActiveJobs['get'](jobCacheKey3) === fetchPriority2 &&
            imagePreloadActiveJobs['delete'](jobCacheKey3),
          (imagePreloadActive = Math['max'](0x0, imagePreloadActive - 0x1)),
          handler2(value25),
          pumpImagePreloadQueue());
      },
      handler3 = (value26) => {
        if (value24) return;
        ((imagePreloadResolved += 0x1),
          rememberResolvedImagePreload(fetchPriority2['url'], value26, fetchPriority2),
          handler(fetchPriority2['resolve'], value26));
      },
      handler4 = (value27) => {
        if (value24) return;
        ((imagePreloadRejected += 0x1),
          rememberRejectedImagePreload(fetchPriority2['url'], value27, fetchPriority2),
          handler(fetchPriority2['reject'], value27));
      };
    try {
      const image = new Image(),
        handler5 = () => {
          try {
            ((image['onload'] = null), (image['onerror'] = null), (image['src'] = ''));
          } catch {}
        };
      (typeof setTimeout === 'function' &&
        (setTimeout2 = setTimeout(() => {
          (handler5(), handler4(new Error('Image\x20preload\x20timed\x20out')));
        }, DEFAULT_IMAGE_PRELOAD_TIMEOUT_MS)),
        configureImage(image, { fetchPriority: fetchPriority2['fetchPriority'] }),
        (fetchPriority2['cancelActive'] = (value28 = 'canceled') => {
          if (value24) return ![];
          return (
            (imagePreloadCanceled += 0x1),
            handler5(),
            imagePreloadInflight['get'](jobCacheKey3) === fetchPriority2['promise'] &&
              imagePreloadInflight['delete'](jobCacheKey3),
            handler(fetchPriority2['reject'], new Error('Image preload ' + value28)),
            !![]
          );
        }),
        (image['onload'] = () => {
          if (fetchPriority2['decode'] === !![] && typeof image['decode'] === 'function') return;
          handler3({
            image: image,
            naturalWidth: image['naturalWidth'] || 0x0,
            naturalHeight: image['naturalHeight'] || 0x0,
            decoded: ![],
          });
        }),
        (image['onerror'] = () => {
          handler4(new Error('Image preload failed'));
        }),
        (image['src'] = fetchPriority2['url']),
        fetchPriority2['decode'] === !![] &&
          typeof image['decode'] === 'function' &&
          image['decode']()['then'](
            () => {
              handler3({
                image: image,
                naturalWidth: image['naturalWidth'] || 0x0,
                naturalHeight: image['naturalHeight'] || 0x0,
                decoded: !![],
              });
            },
            (value29) => {
              handler4(value29 || new Error('Image decode failed'));
            },
          ));
    } catch (value30) {
      handler4(value30);
    }
  }
}
export function preloadCanvasImage(value31, ttlMs = {}) {
  const url2 = normalizeUrl(value31);
  if (!url2) return Promise['reject'](new Error('Image source is empty'));
  if (isLikelyNonImageMediaUrl(url2))
    return Promise['reject'](new Error('Image preload skipped non-image media source'));
  if (ttlMs['revalidate'] !== !![]) {
    const args = getResolvedImagePreloadCacheHit(url2, { ttlMs: ttlMs['cacheTtlMs'] });
    if (args && (ttlMs['requireImage'] !== !![] || args['image'])) {
      if (ttlMs['decode'] !== !![] || args['decoded'] === !![])
        return ((imagePreloadCacheHits += 0x1), Promise['resolve'](args));
      if (typeof args['image']?.['decode'] === 'function')
        return (
          (imagePreloadCacheHits += 0x1),
          args['image']['decode']()['then'](() => {
            const value32 = { ...args, decoded: !![] };
            return (rememberResolvedImagePreload(url2, value32, ttlMs), value32);
          })
        );
      if (args['image']) return ((imagePreloadCacheHits += 0x1), Promise['resolve'](args));
    }
    const rejectedImagePreloadCacheHit = getRejectedImagePreloadCacheHit(url2, {
      rejectTtlMs: ttlMs['rejectTtlMs'],
    });
    if (rejectedImagePreloadCacheHit)
      return ((imagePreloadRejectCacheHits += 0x1), Promise['reject'](rejectedImagePreloadCacheHit));
  }
  const cacheKey = normalizeImagePreloadKey(url2),
    promise2 = imagePreloadInflight['get'](cacheKey);
  if (promise2) {
    imagePreloadDeduped += 0x1;
    promoteQueuedImagePreloadJob(url2, ttlMs) && pumpImagePreloadQueue();
    if (ttlMs['decode'] === !![])
      return promise2['then']((args2) => {
        if (args2?.['decoded'] === !![]) return args2;
        if (typeof args2?.['image']?.['decode'] === 'function')
          return args2['image']['decode']()['then'](() => {
            const value33 = { ...args2, decoded: !![] };
            return (rememberResolvedImagePreload(url2, value33, ttlMs), value33);
          });
        if (args2?.['image']) return args2;
        return preloadCanvasImage(url2, { ...ttlMs, revalidate: !![] });
      });
    return promise2;
  }
  let value34 = null;
  const promise3 = new Promise((resolve, reject) => {
      value34 = {
        url: url2,
        cacheKey: cacheKey,
        resolve: resolve,
        reject: reject,
        promise: null,
        priority: normalizePriority(ttlMs['priority']),
        fetchPriority: ttlMs['fetchPriority'] === 'high' ? 'high' : 'auto',
        scope: String(ttlMs['scope'] || '')['trim'](),
        allowWhenPaused: ttlMs['allowWhenPaused'] === !![],
        deferWhenPaused: ttlMs['deferWhenPaused'] === !![],
        cacheTtlMs: Number['isFinite'](Number(ttlMs['cacheTtlMs']))
          ? Number(ttlMs['cacheTtlMs'])
          : DEFAULT_IMAGE_PRELOAD_CACHE_TTL_MS,
        rejectTtlMs: Number['isFinite'](Number(ttlMs['rejectTtlMs']))
          ? Number(ttlMs['rejectTtlMs'])
          : DEFAULT_IMAGE_PRELOAD_REJECT_TTL_MS,
        decode: ttlMs['decode'] === !![],
        sequence: imagePreloadSequence++,
      };
    }),
    value35 = promise3['finally'](() => {
      imagePreloadInflight['get'](cacheKey) === value35 && imagePreloadInflight['delete'](cacheKey);
    });
  return (
    (value34['promise'] = value35),
    imagePreloadQueue['push'](value34),
    imagePreloadQueuedJobs['set'](cacheKey, value34),
    imagePreloadInflight['set'](cacheKey, value35),
    pumpImagePreloadQueue(),
    value35
  );
}
export function rememberCanvasImagePreloadResolved(value36, decoded = {}, value37 = {}) {
  const url3 = normalizeUrl(value36);
  if (!url3 || isLikelyNonImageMediaUrl(url3)) return ![];
  const image2 = value37['retainImage'] === !![] ? decoded?.['image'] || null : null;
  if (image2) sharedCanvasImageElements['add'](image2);
  const naturalWidth = Math['max'](
      0x0,
      Math['round'](
        Number(decoded?.['naturalWidth'] || image2?.['naturalWidth'] || image2?.['width'] || 0x0) || 0x0,
      ),
    ),
    naturalHeight = Math['max'](
      0x0,
      Math['round'](
        Number(decoded?.['naturalHeight'] || image2?.['naturalHeight'] || image2?.['height'] || 0x0) || 0x0,
      ),
    );
  return (
    rememberResolvedImagePreload(
      url3,
      {
        image: image2,
        naturalWidth: naturalWidth,
        naturalHeight: naturalHeight,
        decoded: decoded?.['decoded'] === !![] || value37['decoded'] === !![],
      },
      value37,
    ),
    (imagePreloadResolvedCachePrimes += 0x1),
    !![]
  );
}
function finishTrackedCanvasImageDisplayLoad(el4) {
  const enabled10 = imageDisplayLoadByElement['get'](el4);
  if (!enabled10) return ![];
  (imageDisplayLoadByElement['delete'](el4), enabled10['images']['delete'](el4));
  if (enabled10['images']['size'] === 0x0) imageDisplayLoadsByKey['delete'](enabled10['cacheKey']);
  return (
    el4['removeEventListener']?.('load', enabled10['onLoad']),
    el4['removeEventListener']?.('error', enabled10['onError']),
    !![]
  );
}
export function trackCanvasImageDisplayLoad(value38, el5) {
  const cacheKey2 = normalizeImagePreloadKey(value38);
  if (!cacheKey2 || !el5) return ![];
  const value39 = imageDisplayLoadByElement['get'](el5);
  if (value39?.['cacheKey'] === cacheKey2) return !![];
  if (value39) finishTrackedCanvasImageDisplayLoad(el5);
  let images = imageDisplayLoadsByKey['get'](cacheKey2);
  !images && ((images = new Set()), imageDisplayLoadsByKey['set'](cacheKey2, images));
  const value40 = {
    cacheKey: cacheKey2,
    images: images,
    onLoad: () => finishTrackedCanvasImageDisplayLoad(el5),
    onError: () => finishTrackedCanvasImageDisplayLoad(el5),
  };
  return (
    images['add'](el5),
    imageDisplayLoadByElement['set'](el5, value40),
    el5['addEventListener']?.('load', value40['onLoad'], { once: !![] }),
    el5['addEventListener']?.('error', value40['onError'], { once: !![] }),
    !![]
  );
}
export function forgetCanvasImageDisplayLoad(value41) {
  return finishTrackedCanvasImageDisplayLoad(value41);
}
export function isCanvasImageDisplayLoadPending(value42) {
  const imagePreloadKey5 = normalizeImagePreloadKey(value42);
  return !!imagePreloadKey5 && (imageDisplayLoadsByKey['get'](imagePreloadKey5)?.['size'] || 0x0) > 0x0;
}
export function isCanvasImageDisplayLoadTracked(enabled11) {
  return !!enabled11 && imageDisplayLoadByElement['has'](enabled11);
}
export function isCanvasImagePreloadSharedImage(enabled12) {
  return !!enabled12 && sharedCanvasImageElements['has'](enabled12);
}
export function isCanvasImagePreloadRecentlyResolved(value43, value44 = {}) {
  const resolvedImagePreloadCacheHit = getResolvedImagePreloadCacheHit(value43, value44);
  return (
    !!resolvedImagePreloadCacheHit &&
    (value44['requireImage'] !== !![] || !!resolvedImagePreloadCacheHit['image'])
  );
}
export function isCanvasImagePreloadPending(value45) {
  const imagePreloadKey6 = normalizeImagePreloadKey(value45);
  if (!imagePreloadKey6) return ![];
  return imagePreloadActiveJobs['has'](imagePreloadKey6) || imagePreloadQueuedJobs['has'](imagePreloadKey6);
}
export function isCanvasImagePreloadCoolingDown(value46, rejectTtlMs = {}) {
  return !!getRejectedImagePreloadCacheHit(value46, { rejectTtlMs: rejectTtlMs['rejectTtlMs'] });
}
export function getCanvasMediaSchedulerStats() {
  const imagePreloadActiveJobSamples = Array['from'](imagePreloadActiveJobs['values']())
      ['map'](summarizeImagePreloadJob)
      ['filter'](Boolean)
      ['slice'](0x0, 0x18),
    imagePreloadQueuedJobSamples = imagePreloadQueue['map'](summarizeImagePreloadJob)
      ['filter'](Boolean)
      ['slice'](0x0, 0x18);
  return {
    imagePreloadActive: imagePreloadActive,
    imagePreloadQueued: imagePreloadQueue['length'],
    imagePreloadInflight: imagePreloadInflight['size'],
    imagePreloadConcurrency: getImagePreloadConcurrency(),
    imagePreloadStarted: imagePreloadStarted,
    imagePreloadResolved: imagePreloadResolved,
    imagePreloadRejected: imagePreloadRejected,
    imagePreloadDeduped: imagePreloadDeduped,
    imagePreloadCacheHits: imagePreloadCacheHits,
    imagePreloadRejectCacheHits: imagePreloadRejectCacheHits,
    imagePreloadResolvedCacheSize: imagePreloadResolvedCache['size'],
    imagePreloadDrawableEstimatedBytes: Array['from'](imagePreloadResolvedCache['values']())['reduce'](
      (value47, el6) => value47 + drawableBytes(el6['value']),
      0x0,
    ),
    imagePreloadDrawableEvictions: imagePreloadDrawableEvictions,
    imagePreloadRejectedCacheSize: imagePreloadRejectedCache['size'],
    imagePreloadPromoted: imagePreloadPromoted,
    imagePreloadPeakActive: imagePreloadPeakActive,
    imagePreloadCanceled: imagePreloadCanceled,
    imagePreloadResolvedCachePrimes: imagePreloadResolvedCachePrimes,
    imagePreloadPaused: imagePreloadPaused,
    imagePreloadPausedBypassPriority: imagePreloadPausedBypassPriority,
    imagePreloadPauseSourceCount: imagePreloadPauseSources['size'],
    imageDisplayLoadPending: Array['from'](imageDisplayLoadsByKey['values']())['reduce'](
      (value48, value49) => value48 + value49['size'],
      0x0,
    ),
    imagePreloadActiveJobSamples: imagePreloadActiveJobSamples,
    imagePreloadQueuedJobSamples: imagePreloadQueuedJobSamples,
  };
}
export function resetCanvasMediaSchedulerForTests() {
  (clearTimeout(resolvedCacheTimer),
    (resolvedCacheTimer = null),
    (imagePreloadDrawableEvictions = 0x0),
    (imagePreloadQueue['length'] = 0x0),
    imagePreloadInflight['clear'](),
    imagePreloadQueuedJobs['clear'](),
    imagePreloadActiveJobs['clear'](),
    imagePreloadResolvedCache['clear'](),
    imagePreloadRejectedCache['clear'](),
    imageDisplayLoadsByKey['clear'](),
    (sharedCanvasImageElements = new WeakSet()),
    (imagePreloadActive = 0x0),
    (imagePreloadSequence = 0x0),
    (imagePreloadStarted = 0x0),
    (imagePreloadResolved = 0x0),
    (imagePreloadRejected = 0x0),
    (imagePreloadDeduped = 0x0),
    (imagePreloadCacheHits = 0x0),
    (imagePreloadRejectCacheHits = 0x0),
    (imagePreloadPromoted = 0x0),
    (imagePreloadPeakActive = 0x0),
    (imagePreloadCanceled = 0x0),
    (imagePreloadResolvedCachePrimes = 0x0),
    (imagePreloadPaused = ![]),
    imagePreloadPauseSources['clear'](),
    (imagePreloadPausedBypassPriority = DEFAULT_PAUSED_BYPASS_PRIORITY));
}

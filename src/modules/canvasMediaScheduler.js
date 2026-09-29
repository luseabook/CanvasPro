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
function drawableBytes(_0x2da575) {
  return _0x2da575?.['image']
    ? Math['max'](0x0, Number(_0x2da575['naturalWidth']) || 0x0) *
        Math['max'](0x0, Number(_0x2da575['naturalHeight']) || 0x0) *
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
function normalizeUrl(_0x5f2cc8) {
  return String(_0x5f2cc8 || '')['trim']();
}
function normalizeImagePreloadKey(_0x3c281e) {
  const _0x3707f6 = normalizeUrl(_0x3c281e);
  if (!_0x3707f6) return '';
  const _0x4dcd42 = urlToLocalPath(_0x3707f6);
  return _0x4dcd42 ? localPathToUrl(_0x4dcd42) || _0x3707f6 : _0x3707f6;
}
function nowMs() {
  return Date['now']();
}
function isLikelyVideoUrl(_0xa89aa7) {
  return /\.(?:mp4|mov|webm|m4v|avi|mkv)(?:[?#].*)?$/i['test'](String(_0xa89aa7 || '')['trim']());
}
function isLikelyAudioUrl(_0x51de24) {
  return /\.(?:mp3|wav|m4a|aac|flac|ogg|opus|wma)(?:[?#].*)?$/i['test'](String(_0x51de24 || '')['trim']());
}
function isLikelyNonImageMediaUrl(_0x31015f) {
  const _0x53224a = String(_0x31015f || '')['trim']();
  return isLikelyVideoUrl(_0x53224a) || isLikelyAudioUrl(_0x53224a);
}
function configureImage(_0x1de2ed, { fetchPriority: fetchPriority = 'auto' } = {}) {
  if (!_0x1de2ed) return;
  try {
    _0x1de2ed['decoding'] = 'async';
  } catch {}
  try {
    if ('fetchPriority' in _0x1de2ed) _0x1de2ed['fetchPriority'] = fetchPriority;
  } catch {}
}
function normalizePriority(_0x59f252) {
  const _0x116637 = Number(_0x59f252);
  return Number['isFinite'](_0x116637) ? _0x116637 : 0x0;
}
function getImagePreloadConcurrency() {
  const _0x138a66 = Number(globalThis['__AIC_CANVAS_IMAGE_PRELOAD_CONCURRENCY__']);
  if (Number['isFinite'](_0x138a66) && _0x138a66 > 0x0) return Math['max'](0x1, Math['floor'](_0x138a66));
  return DEFAULT_IMAGE_PRELOAD_CONCURRENCY;
}
function isImagePreloadJobEligible(_0x3f1fad) {
  if (!imagePreloadPaused) return !![];
  if (_0x3f1fad?.['allowWhenPaused'] === !![]) return !![];
  if (_0x3f1fad?.['deferWhenPaused'] === !![]) return ![];
  return normalizePriority(_0x3f1fad?.['priority']) >= imagePreloadPausedBypassPriority;
}
function isImagePreloadOverflowEligible(_0x22892c) {
  return (
    _0x22892c?.['allowWhenPaused'] === !![] &&
    _0x22892c?.['deferWhenPaused'] !== !![] &&
    normalizePriority(_0x22892c?.['priority']) >= HIGH_PRIORITY_OVERFLOW_THRESHOLD
  );
}
function pickNextImagePreloadJob({ overflowOnly: overflowOnly = ![] } = {}) {
  let _0x481f41 = -0x1,
    _0x38c53f = null;
  for (let _0x1bef3f = 0x0; _0x1bef3f < imagePreloadQueue['length']; _0x1bef3f += 0x1) {
    const _0x1dca37 = imagePreloadQueue[_0x1bef3f];
    if (!isImagePreloadJobEligible(_0x1dca37)) continue;
    if (overflowOnly && !isImagePreloadOverflowEligible(_0x1dca37)) continue;
    (!_0x38c53f ||
      _0x1dca37['priority'] > _0x38c53f['priority'] ||
      (_0x1dca37['priority'] === _0x38c53f['priority'] && _0x1dca37['sequence'] < _0x38c53f['sequence'])) &&
      ((_0x38c53f = _0x1dca37), (_0x481f41 = _0x1bef3f));
  }
  if (_0x481f41 < 0x0) return null;
  return (
    imagePreloadQueue['splice'](_0x481f41, 0x1),
    imagePreloadQueuedJobs['delete'](jobCacheKey(_0x38c53f)),
    _0x38c53f
  );
}
function jobCacheKey(_0x51a5c1) {
  return _0x51a5c1?.['cacheKey'] || _0x51a5c1?.['url'] || '';
}
function summarizeImagePreloadJob(_0x4bff05) {
  if (!_0x4bff05) return null;
  return {
    url: String(_0x4bff05['url'] || ''),
    cacheKey: String(_0x4bff05['cacheKey'] || ''),
    scope: String(_0x4bff05['scope'] || ''),
    priority: normalizePriority(_0x4bff05['priority']),
    fetchPriority: String(_0x4bff05['fetchPriority'] || 'auto'),
    allowWhenPaused: _0x4bff05['allowWhenPaused'] === !![],
    deferWhenPaused: _0x4bff05['deferWhenPaused'] === !![],
    decode: _0x4bff05['decode'] === !![],
    sequence: Number(_0x4bff05['sequence'] || 0x0),
  };
}
function cancelQueuedImagePreloadJob(_0x5ce45f, _0x1c724a = 'canceled') {
  const _0x554698 = jobCacheKey(_0x5ce45f);
  if (!_0x5ce45f || !imagePreloadQueuedJobs['has'](_0x554698)) return ![];
  imagePreloadQueuedJobs['delete'](_0x554698);
  imagePreloadInflight['get'](_0x554698) === _0x5ce45f['promise'] &&
    imagePreloadInflight['delete'](_0x554698);
  imagePreloadCanceled += 0x1;
  try {
    _0x5ce45f['reject'](new Error('Image preload ' + _0x1c724a));
  } catch {}
  return !![];
}
function shouldCancelImagePreloadJob(
  _0x5cfc8e,
  { scope: _0x437efa, hasPriorityLimit: _0x2f56e3, priorityLimit: _0x4e90fa },
) {
  if (!_0x5cfc8e) return ![];
  if (_0x437efa && _0x5cfc8e['scope'] !== _0x437efa) return ![];
  if (_0x2f56e3 && normalizePriority(_0x5cfc8e['priority']) >= _0x4e90fa) return ![];
  return !![];
}
export function cancelQueuedCanvasImagePreloads({
  scope: scope = '',
  belowPriority: belowPriority = null,
  reason: reason = 'canceled',
  includeActive: includeActive = ![],
} = {}) {
  const _0x1312a5 = String(scope || '')['trim'](),
    _0x51267e = Number(belowPriority),
    _0x507fd1 = belowPriority !== null && belowPriority !== undefined && Number['isFinite'](_0x51267e);
  let _0x25fa10 = 0x0;
  for (let _0x29ff49 = imagePreloadQueue['length'] - 0x1; _0x29ff49 >= 0x0; _0x29ff49 -= 0x1) {
    const _0x22b92c = imagePreloadQueue[_0x29ff49];
    if (
      !shouldCancelImagePreloadJob(_0x22b92c, {
        scope: _0x1312a5,
        hasPriorityLimit: _0x507fd1,
        priorityLimit: _0x51267e,
      })
    )
      continue;
    imagePreloadQueue['splice'](_0x29ff49, 0x1);
    if (cancelQueuedImagePreloadJob(_0x22b92c, reason)) _0x25fa10 += 0x1;
  }
  if (includeActive === !![]) {
    const _0x15c3d9 = Array['from'](imagePreloadActiveJobs['values']());
    for (const _0x2b06ce of _0x15c3d9) {
      if (
        !shouldCancelImagePreloadJob(_0x2b06ce, {
          scope: _0x1312a5,
          hasPriorityLimit: _0x507fd1,
          priorityLimit: _0x51267e,
        })
      )
        continue;
      typeof _0x2b06ce['cancelActive'] === 'function' &&
        _0x2b06ce['cancelActive'](reason) &&
        (_0x25fa10 += 0x1);
    }
  }
  return _0x25fa10;
}
export function setCanvasMediaSchedulerPaused(_0x4fe64a, _0x3ef234 = {}) {
  const _0x52ae0b = _0x4fe64a === !![],
    _0x26ae59 = String(_0x3ef234['source'] || 'default')['trim']() || 'default';
  _0x52ae0b ? imagePreloadPauseSources['add'](_0x26ae59) : imagePreloadPauseSources['delete'](_0x26ae59);
  imagePreloadPaused = imagePreloadPauseSources['size'] > 0x0;
  Number['isFinite'](Number(_0x3ef234['bypassPriority'])) &&
    (imagePreloadPausedBypassPriority = Number(_0x3ef234['bypassPriority']));
  if (!imagePreloadPaused) pumpImagePreloadQueue();
}
function promoteQueuedImagePreloadJob(_0x1fa450, _0x23cdf8 = {}) {
  const _0x555bfb = imagePreloadQueuedJobs['get'](normalizeImagePreloadKey(_0x1fa450));
  if (!_0x555bfb) return ![];
  const _0x2e4f1c = normalizePriority(_0x23cdf8['priority']);
  let _0x101c65 = ![];
  _0x2e4f1c > _0x555bfb['priority'] && ((_0x555bfb['priority'] = _0x2e4f1c), (_0x101c65 = !![]));
  _0x23cdf8['fetchPriority'] === 'high' &&
    _0x555bfb['fetchPriority'] !== 'high' &&
    ((_0x555bfb['fetchPriority'] = 'high'), (_0x101c65 = !![]));
  if (_0x101c65) imagePreloadPromoted += 0x1;
  return _0x101c65;
}
function pruneResolvedImagePreloadCache(_0x3b9d67 = nowMs()) {
  (clearTimeout(resolvedCacheTimer), (resolvedCacheTimer = null));
  for (const [_0x29af17, _0x623189] of imagePreloadResolvedCache) {
    (!_0x623189 || Number(_0x623189['expiresAt'] || 0x0) <= _0x3b9d67) &&
      imagePreloadResolvedCache['delete'](_0x29af17);
  }
  while (imagePreloadResolvedCache['size'] > MAX_IMAGE_PRELOAD_CACHE_ENTRIES) {
    const _0x2c5724 = imagePreloadResolvedCache['keys']()['next']()['value'];
    if (!_0x2c5724) break;
    imagePreloadResolvedCache['delete'](_0x2c5724);
  }
  let _0x85bbb3 = Array['from'](imagePreloadResolvedCache['values']())['reduce'](
    (_0x5e706d, _0x5c0e04) => _0x5e706d + drawableBytes(_0x5c0e04['value']),
    0x0,
  );
  for (const _0x45a51d of imagePreloadResolvedCache['values']()) {
    if (_0x85bbb3 <= MAX_IMAGE_PRELOAD_DRAWABLE_BYTES) break;
    const _0x1da7c0 = drawableBytes(_0x45a51d['value']);
    if (!_0x1da7c0) continue;
    ((_0x85bbb3 -= _0x1da7c0),
      (_0x45a51d['value'] = { ..._0x45a51d['value'], image: null }),
      imagePreloadDrawableEvictions++);
  }
  if (imagePreloadResolvedCache['size']) {
    const _0x599f09 = Math['min'](
      ...Array['from'](imagePreloadResolvedCache['values'](), (_0x20d103) => _0x20d103['expiresAt']),
    );
    ((resolvedCacheTimer = setTimeout(
      () => pruneResolvedImagePreloadCache(),
      Math['max'](0x1, _0x599f09 - _0x3b9d67),
    )),
      resolvedCacheTimer?.['unref']?.());
  }
}
function pruneRejectedImagePreloadCache(_0x1b4eb7 = nowMs()) {
  for (const [_0x16ec56, _0x4099f5] of imagePreloadRejectedCache) {
    (!_0x4099f5 || Number(_0x4099f5['expiresAt'] || 0x0) <= _0x1b4eb7) &&
      imagePreloadRejectedCache['delete'](_0x16ec56);
  }
  while (imagePreloadRejectedCache['size'] > MAX_IMAGE_PRELOAD_CACHE_ENTRIES) {
    const _0x2d81a2 = imagePreloadRejectedCache['keys']()['next']()['value'];
    if (!_0x2d81a2) break;
    imagePreloadRejectedCache['delete'](_0x2d81a2);
  }
}
function getResolvedImagePreloadCacheHit(_0x3b25c4, _0x316a30 = {}) {
  const _0x2b6333 = normalizeImagePreloadKey(_0x3b25c4);
  if (!_0x2b6333) return null;
  const _0x4ea9bf = Number['isFinite'](Number(_0x316a30['ttlMs']))
    ? Math['max'](0x0, Number(_0x316a30['ttlMs']))
    : DEFAULT_IMAGE_PRELOAD_CACHE_TTL_MS;
  if (_0x4ea9bf <= 0x0) return null;
  const _0x10d47a = imagePreloadResolvedCache['get'](_0x2b6333);
  if (!_0x10d47a) return null;
  const _0x3a6e7f = nowMs();
  if (Number(_0x10d47a['expiresAt'] || 0x0) <= _0x3a6e7f)
    return (imagePreloadResolvedCache['delete'](_0x2b6333), null);
  return (
    imagePreloadResolvedCache['delete'](_0x2b6333),
    imagePreloadResolvedCache['set'](_0x2b6333, _0x10d47a),
    _0x10d47a['value'] || null
  );
}
function getRejectedImagePreloadCacheHit(_0x1a247b, _0x16d666 = {}) {
  const _0x45366f = normalizeImagePreloadKey(_0x1a247b);
  if (!_0x45366f) return null;
  const _0x350bff = Number['isFinite'](Number(_0x16d666['rejectTtlMs']))
    ? Math['max'](0x0, Number(_0x16d666['rejectTtlMs']))
    : DEFAULT_IMAGE_PRELOAD_REJECT_TTL_MS;
  if (_0x350bff <= 0x0) return null;
  const _0x451fd3 = imagePreloadRejectedCache['get'](_0x45366f);
  if (!_0x451fd3) return null;
  const _0x501b2b = nowMs();
  if (Number(_0x451fd3['expiresAt'] || 0x0) <= _0x501b2b)
    return (imagePreloadRejectedCache['delete'](_0x45366f), null);
  return _0x451fd3['error'] || new Error('Image preload recently failed');
}
function rememberResolvedImagePreload(_0x2368e7, _0x370ade, _0x2a27a9 = {}) {
  const _0x3b520 = normalizeImagePreloadKey(_0x2368e7);
  if (!_0x3b520 || !_0x370ade) return;
  const _0x3477a1 = Number['isFinite'](Number(_0x2a27a9['cacheTtlMs']))
    ? Math['max'](0x0, Number(_0x2a27a9['cacheTtlMs']))
    : DEFAULT_IMAGE_PRELOAD_CACHE_TTL_MS;
  if (_0x3477a1 <= 0x0) return;
  const _0x12d32a = nowMs();
  (imagePreloadRejectedCache['delete'](_0x3b520),
    imagePreloadResolvedCache['delete'](_0x3b520),
    imagePreloadResolvedCache['set'](_0x3b520, { expiresAt: _0x12d32a + _0x3477a1, value: _0x370ade }),
    pruneResolvedImagePreloadCache(_0x12d32a));
}
function rememberRejectedImagePreload(_0x253d6a, _0x8a0bd1, _0x4160c2 = {}) {
  const _0x6dd33f = normalizeImagePreloadKey(_0x253d6a);
  if (!_0x6dd33f) return;
  const _0x1d381b = Number['isFinite'](Number(_0x4160c2['rejectTtlMs']))
    ? Math['max'](0x0, Number(_0x4160c2['rejectTtlMs']))
    : DEFAULT_IMAGE_PRELOAD_REJECT_TTL_MS;
  if (_0x1d381b <= 0x0) return;
  const _0x31bc35 = nowMs();
  (imagePreloadRejectedCache['delete'](_0x6dd33f),
    imagePreloadRejectedCache['set'](_0x6dd33f, {
      expiresAt: _0x31bc35 + _0x1d381b,
      error: _0x8a0bd1 instanceof Error ? _0x8a0bd1 : new Error('Image\x20preload\x20failed'),
    }),
    pruneRejectedImagePreloadCache(_0x31bc35));
}
function pumpImagePreloadQueue() {
  const _0x249798 = getImagePreloadConcurrency(),
    _0x5f4164 = _0x249798 + HIGH_PRIORITY_OVERFLOW_EXTRA_SLOTS;
  while (imagePreloadActive < _0x5f4164 && imagePreloadQueue['length'] > 0x0) {
    const _0x10d3f4 = imagePreloadActive >= _0x249798,
      _0x14b0ae = pickNextImagePreloadJob({ overflowOnly: _0x10d3f4 });
    if (!_0x14b0ae) return;
    ((imagePreloadActive += 0x1),
      (imagePreloadStarted += 0x1),
      (imagePreloadPeakActive = Math['max'](imagePreloadPeakActive, imagePreloadActive)));
    const _0x91b748 = jobCacheKey(_0x14b0ae);
    imagePreloadActiveJobs['set'](_0x91b748, _0x14b0ae);
    let _0x2f4496 = ![],
      _0x5dedc8 = null;
    const _0x4de3ff = () => {
        if (_0x5dedc8 === null || typeof clearTimeout !== 'function') return;
        (clearTimeout(_0x5dedc8), (_0x5dedc8 = null));
      },
      _0xb174 = (_0x2bc13c, _0x38c39c) => {
        if (_0x2f4496) return;
        ((_0x2f4496 = !![]),
          _0x4de3ff(),
          imagePreloadActiveJobs['get'](_0x91b748) === _0x14b0ae &&
            imagePreloadActiveJobs['delete'](_0x91b748),
          (imagePreloadActive = Math['max'](0x0, imagePreloadActive - 0x1)),
          _0x2bc13c(_0x38c39c),
          pumpImagePreloadQueue());
      },
      _0xa7dad6 = (_0x115a4f) => {
        if (_0x2f4496) return;
        ((imagePreloadResolved += 0x1),
          rememberResolvedImagePreload(_0x14b0ae['url'], _0x115a4f, _0x14b0ae),
          _0xb174(_0x14b0ae['resolve'], _0x115a4f));
      },
      _0x1a5be9 = (_0x477af2) => {
        if (_0x2f4496) return;
        ((imagePreloadRejected += 0x1),
          rememberRejectedImagePreload(_0x14b0ae['url'], _0x477af2, _0x14b0ae),
          _0xb174(_0x14b0ae['reject'], _0x477af2));
      };
    try {
      const _0x280d86 = new Image(),
        _0x44504b = () => {
          try {
            ((_0x280d86['onload'] = null), (_0x280d86['onerror'] = null), (_0x280d86['src'] = ''));
          } catch {}
        };
      (typeof setTimeout === 'function' &&
        (_0x5dedc8 = setTimeout(() => {
          (_0x44504b(), _0x1a5be9(new Error('Image\x20preload\x20timed\x20out')));
        }, DEFAULT_IMAGE_PRELOAD_TIMEOUT_MS)),
        configureImage(_0x280d86, { fetchPriority: _0x14b0ae['fetchPriority'] }),
        (_0x14b0ae['cancelActive'] = (_0x3fd2c8 = 'canceled') => {
          if (_0x2f4496) return ![];
          return (
            (imagePreloadCanceled += 0x1),
            _0x44504b(),
            imagePreloadInflight['get'](_0x91b748) === _0x14b0ae['promise'] &&
              imagePreloadInflight['delete'](_0x91b748),
            _0xb174(_0x14b0ae['reject'], new Error('Image preload ' + _0x3fd2c8)),
            !![]
          );
        }),
        (_0x280d86['onload'] = () => {
          if (_0x14b0ae['decode'] === !![] && typeof _0x280d86['decode'] === 'function') return;
          _0xa7dad6({
            image: _0x280d86,
            naturalWidth: _0x280d86['naturalWidth'] || 0x0,
            naturalHeight: _0x280d86['naturalHeight'] || 0x0,
            decoded: ![],
          });
        }),
        (_0x280d86['onerror'] = () => {
          _0x1a5be9(new Error('Image preload failed'));
        }),
        (_0x280d86['src'] = _0x14b0ae['url']),
        _0x14b0ae['decode'] === !![] &&
          typeof _0x280d86['decode'] === 'function' &&
          _0x280d86['decode']()['then'](
            () => {
              _0xa7dad6({
                image: _0x280d86,
                naturalWidth: _0x280d86['naturalWidth'] || 0x0,
                naturalHeight: _0x280d86['naturalHeight'] || 0x0,
                decoded: !![],
              });
            },
            (_0x31435f) => {
              _0x1a5be9(_0x31435f || new Error('Image decode failed'));
            },
          ));
    } catch (_0x4ee80d) {
      _0x1a5be9(_0x4ee80d);
    }
  }
}
export function preloadCanvasImage(_0x322054, _0x98e6cb = {}) {
  const _0x42564d = normalizeUrl(_0x322054);
  if (!_0x42564d) return Promise['reject'](new Error('Image source is empty'));
  if (isLikelyNonImageMediaUrl(_0x42564d))
    return Promise['reject'](new Error('Image preload skipped non-image media source'));
  if (_0x98e6cb['revalidate'] !== !![]) {
    const _0x5754bf = getResolvedImagePreloadCacheHit(_0x42564d, { ttlMs: _0x98e6cb['cacheTtlMs'] });
    if (_0x5754bf && (_0x98e6cb['requireImage'] !== !![] || _0x5754bf['image'])) {
      if (_0x98e6cb['decode'] !== !![] || _0x5754bf['decoded'] === !![])
        return ((imagePreloadCacheHits += 0x1), Promise['resolve'](_0x5754bf));
      if (typeof _0x5754bf['image']?.['decode'] === 'function')
        return (
          (imagePreloadCacheHits += 0x1),
          _0x5754bf['image']['decode']()['then'](() => {
            const _0x28a655 = { ..._0x5754bf, decoded: !![] };
            return (rememberResolvedImagePreload(_0x42564d, _0x28a655, _0x98e6cb), _0x28a655);
          })
        );
      if (_0x5754bf['image']) return ((imagePreloadCacheHits += 0x1), Promise['resolve'](_0x5754bf));
    }
    const _0x5c2ac7 = getRejectedImagePreloadCacheHit(_0x42564d, { rejectTtlMs: _0x98e6cb['rejectTtlMs'] });
    if (_0x5c2ac7) return ((imagePreloadRejectCacheHits += 0x1), Promise['reject'](_0x5c2ac7));
  }
  const _0x21df22 = normalizeImagePreloadKey(_0x42564d),
    _0x33b205 = imagePreloadInflight['get'](_0x21df22);
  if (_0x33b205) {
    imagePreloadDeduped += 0x1;
    promoteQueuedImagePreloadJob(_0x42564d, _0x98e6cb) && pumpImagePreloadQueue();
    if (_0x98e6cb['decode'] === !![])
      return _0x33b205['then']((_0x242628) => {
        if (_0x242628?.['decoded'] === !![]) return _0x242628;
        if (typeof _0x242628?.['image']?.['decode'] === 'function')
          return _0x242628['image']['decode']()['then'](() => {
            const _0x350005 = { ..._0x242628, decoded: !![] };
            return (rememberResolvedImagePreload(_0x42564d, _0x350005, _0x98e6cb), _0x350005);
          });
        if (_0x242628?.['image']) return _0x242628;
        return preloadCanvasImage(_0x42564d, { ..._0x98e6cb, revalidate: !![] });
      });
    return _0x33b205;
  }
  let _0x26719c = null;
  const _0x3863d2 = new Promise((_0x1e123c, _0x41077d) => {
      _0x26719c = {
        url: _0x42564d,
        cacheKey: _0x21df22,
        resolve: _0x1e123c,
        reject: _0x41077d,
        promise: null,
        priority: normalizePriority(_0x98e6cb['priority']),
        fetchPriority: _0x98e6cb['fetchPriority'] === 'high' ? 'high' : 'auto',
        scope: String(_0x98e6cb['scope'] || '')['trim'](),
        allowWhenPaused: _0x98e6cb['allowWhenPaused'] === !![],
        deferWhenPaused: _0x98e6cb['deferWhenPaused'] === !![],
        cacheTtlMs: Number['isFinite'](Number(_0x98e6cb['cacheTtlMs']))
          ? Number(_0x98e6cb['cacheTtlMs'])
          : DEFAULT_IMAGE_PRELOAD_CACHE_TTL_MS,
        rejectTtlMs: Number['isFinite'](Number(_0x98e6cb['rejectTtlMs']))
          ? Number(_0x98e6cb['rejectTtlMs'])
          : DEFAULT_IMAGE_PRELOAD_REJECT_TTL_MS,
        decode: _0x98e6cb['decode'] === !![],
        sequence: imagePreloadSequence++,
      };
    }),
    _0x66b6c8 = _0x3863d2['finally'](() => {
      imagePreloadInflight['get'](_0x21df22) === _0x66b6c8 && imagePreloadInflight['delete'](_0x21df22);
    });
  return (
    (_0x26719c['promise'] = _0x66b6c8),
    imagePreloadQueue['push'](_0x26719c),
    imagePreloadQueuedJobs['set'](_0x21df22, _0x26719c),
    imagePreloadInflight['set'](_0x21df22, _0x66b6c8),
    pumpImagePreloadQueue(),
    _0x66b6c8
  );
}
export function rememberCanvasImagePreloadResolved(_0x427c66, _0x4f2945 = {}, _0x29e862 = {}) {
  const _0x1db1c1 = normalizeUrl(_0x427c66);
  if (!_0x1db1c1 || isLikelyNonImageMediaUrl(_0x1db1c1)) return ![];
  const _0x479700 = _0x29e862['retainImage'] === !![] ? _0x4f2945?.['image'] || null : null;
  if (_0x479700) sharedCanvasImageElements['add'](_0x479700);
  const _0xa6e92e = Math['max'](
      0x0,
      Math['round'](
        Number(_0x4f2945?.['naturalWidth'] || _0x479700?.['naturalWidth'] || _0x479700?.['width'] || 0x0) ||
          0x0,
      ),
    ),
    _0x34000b = Math['max'](
      0x0,
      Math['round'](
        Number(
          _0x4f2945?.['naturalHeight'] || _0x479700?.['naturalHeight'] || _0x479700?.['height'] || 0x0,
        ) || 0x0,
      ),
    );
  return (
    rememberResolvedImagePreload(
      _0x1db1c1,
      {
        image: _0x479700,
        naturalWidth: _0xa6e92e,
        naturalHeight: _0x34000b,
        decoded: _0x4f2945?.['decoded'] === !![] || _0x29e862['decoded'] === !![],
      },
      _0x29e862,
    ),
    (imagePreloadResolvedCachePrimes += 0x1),
    !![]
  );
}
function finishTrackedCanvasImageDisplayLoad(_0xaa6cb9) {
  const _0x25d05c = imageDisplayLoadByElement['get'](_0xaa6cb9);
  if (!_0x25d05c) return ![];
  (imageDisplayLoadByElement['delete'](_0xaa6cb9), _0x25d05c['images']['delete'](_0xaa6cb9));
  if (_0x25d05c['images']['size'] === 0x0) imageDisplayLoadsByKey['delete'](_0x25d05c['cacheKey']);
  return (
    _0xaa6cb9['removeEventListener']?.('load', _0x25d05c['onLoad']),
    _0xaa6cb9['removeEventListener']?.('error', _0x25d05c['onError']),
    !![]
  );
}
export function trackCanvasImageDisplayLoad(_0x478ae9, _0x4ef789) {
  const _0x134665 = normalizeImagePreloadKey(_0x478ae9);
  if (!_0x134665 || !_0x4ef789) return ![];
  const _0x4919cf = imageDisplayLoadByElement['get'](_0x4ef789);
  if (_0x4919cf?.['cacheKey'] === _0x134665) return !![];
  if (_0x4919cf) finishTrackedCanvasImageDisplayLoad(_0x4ef789);
  let _0x3556a8 = imageDisplayLoadsByKey['get'](_0x134665);
  !_0x3556a8 && ((_0x3556a8 = new Set()), imageDisplayLoadsByKey['set'](_0x134665, _0x3556a8));
  const _0x33f868 = {
    cacheKey: _0x134665,
    images: _0x3556a8,
    onLoad: () => finishTrackedCanvasImageDisplayLoad(_0x4ef789),
    onError: () => finishTrackedCanvasImageDisplayLoad(_0x4ef789),
  };
  return (
    _0x3556a8['add'](_0x4ef789),
    imageDisplayLoadByElement['set'](_0x4ef789, _0x33f868),
    _0x4ef789['addEventListener']?.('load', _0x33f868['onLoad'], { once: !![] }),
    _0x4ef789['addEventListener']?.('error', _0x33f868['onError'], { once: !![] }),
    !![]
  );
}
export function forgetCanvasImageDisplayLoad(_0x2c2c63) {
  return finishTrackedCanvasImageDisplayLoad(_0x2c2c63);
}
export function isCanvasImageDisplayLoadPending(_0x18ce38) {
  const _0x4d5aec = normalizeImagePreloadKey(_0x18ce38);
  return !!_0x4d5aec && (imageDisplayLoadsByKey['get'](_0x4d5aec)?.['size'] || 0x0) > 0x0;
}
export function isCanvasImageDisplayLoadTracked(_0x5b21c3) {
  return !!_0x5b21c3 && imageDisplayLoadByElement['has'](_0x5b21c3);
}
export function isCanvasImagePreloadSharedImage(_0x1b018f) {
  return !!_0x1b018f && sharedCanvasImageElements['has'](_0x1b018f);
}
export function isCanvasImagePreloadRecentlyResolved(_0x437800, _0x58fcea = {}) {
  const _0x40efdc = getResolvedImagePreloadCacheHit(_0x437800, _0x58fcea);
  return !!_0x40efdc && (_0x58fcea['requireImage'] !== !![] || !!_0x40efdc['image']);
}
export function isCanvasImagePreloadPending(_0xda3ebc) {
  const _0x448762 = normalizeImagePreloadKey(_0xda3ebc);
  if (!_0x448762) return ![];
  return imagePreloadActiveJobs['has'](_0x448762) || imagePreloadQueuedJobs['has'](_0x448762);
}
export function isCanvasImagePreloadCoolingDown(_0x5a3ce9, _0x5c9a83 = {}) {
  return !!getRejectedImagePreloadCacheHit(_0x5a3ce9, { rejectTtlMs: _0x5c9a83['rejectTtlMs'] });
}
export function getCanvasMediaSchedulerStats() {
  const _0x552518 = Array['from'](imagePreloadActiveJobs['values']())
      ['map'](summarizeImagePreloadJob)
      ['filter'](Boolean)
      ['slice'](0x0, 0x18),
    _0x27f56e = imagePreloadQueue['map'](summarizeImagePreloadJob)['filter'](Boolean)['slice'](0x0, 0x18);
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
      (_0x15e107, _0x2d7e71) => _0x15e107 + drawableBytes(_0x2d7e71['value']),
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
      (_0x5ca8dd, _0x3a0046) => _0x5ca8dd + _0x3a0046['size'],
      0x0,
    ),
    imagePreloadActiveJobSamples: _0x552518,
    imagePreloadQueuedJobSamples: _0x27f56e,
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

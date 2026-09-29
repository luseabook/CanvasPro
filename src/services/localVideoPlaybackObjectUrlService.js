import { fetchLocalMediaPlaybackBlob } from '../../api/localMediaPlaybackApi.js';
import { createTrackedMediaObjectUrl, revokeTrackedMediaObjectUrl } from './mediaObjectUrlRegistry.js';
const LOCAL_VIDEO_PLAYBACK_MAX_BYTES = 0x40 * 0x400 * 0x400,
  LOCAL_VIDEO_PLAYBACK_TOTAL_BYTES = 0x100 * 0x400 * 0x400,
  LOCAL_VIDEO_PLAYBACK_MAX_REQUEST_BYTES = 0x80 * 0x400 * 0x400,
  LOCAL_VIDEO_WARMUP_MAX_BYTES = 0x8 * 0x400 * 0x400,
  LOCAL_VIDEO_WARMUP_TOTAL_BYTES = 0x18 * 0x400 * 0x400,
  LOCAL_VIDEO_WARMUP_TTL_MS = 0x3a98,
  LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS = 0x5dc,
  LOCAL_VIDEO_PLAYBACK_MAX_REQUEST_TIMEOUT_MS = 0x3a98,
  LOCAL_VIDEO_PLAYBACK_CONCURRENCY = 0x2,
  LOCAL_VIDEO_PATH_RE = /^\/(?:output|data\/assets|data\/uploads)\//i,
  entriesBySource = new Map(),
  sourceByOwner = new Map(),
  sourcesByWarmupScope = new Map(),
  warmupBypassUntilBySource = new Map();
let queuedEntries = [],
  activeFetchCount = 0x0;
function resolveCanonicalLocalSource(_0x4ead17) {
  const _0x253d35 = String(_0x4ead17 || '')['trim'](),
    _0xac5b1d = globalThis['location'] || globalThis['window']?.['location'],
    _0x17eba7 = String(_0xac5b1d?.['href'] || '')['trim'](),
    _0x69c436 = String(_0xac5b1d?.['origin'] || '')['trim']();
  if (!_0x253d35 || !_0x17eba7 || !_0x69c436 || _0x69c436 === 'null') return '';
  try {
    const _0x5d2756 = new URL(_0x253d35, _0x17eba7);
    if (
      _0x5d2756['origin'] !== _0x69c436 ||
      _0x5d2756['username'] ||
      _0x5d2756['password'] ||
      !LOCAL_VIDEO_PATH_RE['test'](_0x5d2756['pathname'])
    )
      return '';
    return ((_0x5d2756['hash'] = ''), _0x5d2756['href']);
  } catch {
    return '';
  }
}
function isWarmupBypassed(_0xc7f31f) {
  const _0x47fdc9 = Number(warmupBypassUntilBySource['get'](_0xc7f31f) || 0x0);
  if (!(_0x47fdc9 > Date['now']())) return (warmupBypassUntilBySource['delete'](_0xc7f31f), ![]);
  return !![];
}
function hasReferences(_0x1bbf98) {
  return (
    _0x1bbf98['ownerRefs']['size'] > 0x0 ||
    _0x1bbf98['warmupRefs']['size'] > 0x0 ||
    _0x1bbf98['handoffRetained'] === !![]
  );
}
function clearWarmupExpiry(_0x1a6f1d) {
  if (_0x1a6f1d?.['warmupExpiryTimer'] == null) return;
  (clearTimeout(_0x1a6f1d['warmupExpiryTimer']), (_0x1a6f1d['warmupExpiryTimer'] = null));
}
function getWarmupBlobBytes(_0x3d720a = null) {
  let _0x5077d7 = 0x0;
  for (const _0x40a828 of entriesBySource['values']()) {
    if (_0x40a828 === _0x3d720a || !_0x40a828['blob'] || _0x40a828['ownerRefs']['size'] > 0x0) continue;
    _0x5077d7 += Number(_0x40a828['blob']['size'] || 0x0);
  }
  return _0x5077d7;
}
function expireWarmupEntry(_0x4c6de8) {
  clearWarmupExpiry(_0x4c6de8);
  if (!_0x4c6de8 || _0x4c6de8['ownerRefs']['size'] > 0x0) return;
  for (const _0x118581 of _0x4c6de8['warmupRefs']) {
    const _0x443726 = sourcesByWarmupScope['get'](_0x118581);
    _0x443726?.['delete'](_0x4c6de8['sourceUrl']);
    if (_0x443726?.['size'] === 0x0) sourcesByWarmupScope['delete'](_0x118581);
  }
  (_0x4c6de8['warmupRefs']['clear'](),
    (_0x4c6de8['handoffRetained'] = ![]),
    removeEntryIfUnreferenced(_0x4c6de8));
}
function scheduleWarmupExpiry(_0x4a1125) {
  clearWarmupExpiry(_0x4a1125);
  if (!_0x4a1125 || _0x4a1125['ownerRefs']['size'] > 0x0) return;
  ((_0x4a1125['warmupExpiryTimer'] = setTimeout(
    () => expireWarmupEntry(_0x4a1125),
    LOCAL_VIDEO_WARMUP_TTL_MS,
  )),
    _0x4a1125['warmupExpiryTimer']?.['unref']?.());
}
function evictWarmupBlobsForBudget(_0x6dd77e, _0x214d8c = null) {
  let _0x3f3064 = getWarmupBlobBytes(_0x214d8c);
  if (_0x3f3064 + _0x6dd77e <= LOCAL_VIDEO_WARMUP_TOTAL_BYTES) return !![];
  const _0x2ded7f = Array['from'](entriesBySource['values']())
    ['filter'](
      (_0x2c6118) => _0x2c6118 !== _0x214d8c && _0x2c6118['blob'] && _0x2c6118['ownerRefs']['size'] === 0x0,
    )
    ['sort'](
      (_0x41a84e, _0x117d00) =>
        Number(_0x41a84e['blobReadyAt'] || 0x0) - Number(_0x117d00['blobReadyAt'] || 0x0),
    );
  for (const _0x1dc0a of _0x2ded7f) {
    const _0x87824e = Number(_0x1dc0a['blob']?.['size'] || 0x0);
    (expireWarmupEntry(_0x1dc0a), (_0x3f3064 = Math['max'](0x0, _0x3f3064 - _0x87824e)));
    if (_0x3f3064 + _0x6dd77e <= LOCAL_VIDEO_WARMUP_TOTAL_BYTES) return !![];
  }
  return _0x3f3064 + _0x6dd77e <= LOCAL_VIDEO_WARMUP_TOTAL_BYTES;
}
function settleEntry(_0x5cfe8f, _0x4c8c2f = '') {
  if (_0x5cfe8f['settled']) return;
  ((_0x5cfe8f['settled'] = !![]), _0x5cfe8f['resolvePromise'](_0x4c8c2f));
}
function createPlaybackResult(_0x556b24, _0x1e76aa = '', _0x21c7bc = 0x0) {
  return {
    status: String(_0x556b24 || 'failed'),
    playbackUrl: String(_0x1e76aa || ''),
    httpStatus: Number(_0x21c7bc || 0x0),
  };
}
function disposeEntry(_0x39db9f) {
  if (!_0x39db9f || _0x39db9f['disposed']) return;
  ((_0x39db9f['disposed'] = !![]),
    clearWarmupExpiry(_0x39db9f),
    _0x39db9f['controller']['abort'](),
    (_0x39db9f['queued'] = ![]),
    _0x39db9f['objectUrl'] &&
      (revokeTrackedMediaObjectUrl(_0x39db9f['objectUrl']), (_0x39db9f['objectUrl'] = '')),
    (_0x39db9f['blob'] = null),
    settleEntry(_0x39db9f, ''));
}
function syncEntryObjectUrl(_0x23fb95) {
  if (!_0x23fb95 || _0x23fb95['disposed']) return '';
  if (_0x23fb95['ownerRefs']['size'] === 0x0) {
    _0x23fb95['objectUrl'] &&
      (revokeTrackedMediaObjectUrl(_0x23fb95['objectUrl']), (_0x23fb95['objectUrl'] = ''));
    if (
      _0x23fb95['blob'] &&
      (_0x23fb95['blob']['size'] > LOCAL_VIDEO_WARMUP_MAX_BYTES ||
        !evictWarmupBlobsForBudget(_0x23fb95['blob']['size'], _0x23fb95))
    )
      return (expireWarmupEntry(_0x23fb95), '');
    return (scheduleWarmupExpiry(_0x23fb95), '');
  }
  return (
    (_0x23fb95['handoffRetained'] = ![]),
    clearWarmupExpiry(_0x23fb95),
    !_0x23fb95['objectUrl'] &&
      _0x23fb95['blob'] &&
      (_0x23fb95['objectUrl'] = createTrackedMediaObjectUrl(_0x23fb95['blob'], {
        kind: 'video',
        ownerId: _0x23fb95['firstOwnerId'],
        sourceUrl: _0x23fb95['sourceUrl'],
      })),
    _0x23fb95['objectUrl']
  );
}
function removeEntryIfUnreferenced(_0x411b17) {
  if (!_0x411b17 || hasReferences(_0x411b17)) return ![];
  return (
    entriesBySource['get'](_0x411b17['sourceUrl']) === _0x411b17 &&
      entriesBySource['delete'](_0x411b17['sourceUrl']),
    disposeEntry(_0x411b17),
    !![]
  );
}
function createEntry(_0xacebb2, _0x156aea = '') {
  let _0x229d78;
  const _0x3ba0b5 = new Promise((_0x1564dd) => {
      _0x229d78 = _0x1564dd;
    }),
    _0x236e1a = {
      sourceUrl: _0xacebb2,
      firstOwnerId: String(_0x156aea || ''),
      playbackMaxBytes: LOCAL_VIDEO_PLAYBACK_MAX_BYTES,
      playbackTimeoutMs: LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS,
      ownerRefs: new Set(),
      warmupRefs: new Set(),
      handoffRetained: ![],
      controller: new AbortController(),
      blob: null,
      blobReadyAt: 0x0,
      objectUrl: '',
      status: 'pending',
      httpStatus: 0x0,
      promise: _0x3ba0b5,
      resolvePromise: _0x229d78,
      settled: ![],
      disposed: ![],
      queued: ![],
      active: ![],
      bypassConcurrencyLimitRequested: ![],
      warmupExpiryTimer: null,
    };
  return (entriesBySource['set'](_0xacebb2, _0x236e1a), _0x236e1a);
}
function getOrCreateEntry(_0x3e0d80, _0x1bf67c = '') {
  return entriesBySource['get'](_0x3e0d80) || createEntry(_0x3e0d80, _0x1bf67c);
}
function removeOwnerReference(_0x534ed5) {
  const _0x2cf027 = String(_0x534ed5 || '')['trim'](),
    _0x2c01e2 = sourceByOwner['get'](_0x2cf027);
  if (!_0x2cf027 || !_0x2c01e2) return ![];
  sourceByOwner['delete'](_0x2cf027);
  const _0x1c22b6 = entriesBySource['get'](_0x2c01e2);
  if (!_0x1c22b6) return ![];
  return (
    _0x1c22b6['ownerRefs']['delete'](_0x2cf027),
    syncEntryObjectUrl(_0x1c22b6),
    removeEntryIfUnreferenced(_0x1c22b6),
    !![]
  );
}
async function startEntryFetch(_0x37a074) {
  ((_0x37a074['active'] = !![]), (activeFetchCount += 0x1));
  const _0x214130 = _0x37a074['ownerRefs']['size'] === 0x0;
  let _0x3b1cf3 = ![];
  const _0x344865 = () =>
    _0x214130 &&
    _0x37a074['ownerRefs']['size'] > 0x0 &&
    !_0x37a074['disposed'] &&
    !_0x37a074['controller']['signal']['aborted'] &&
    entriesBySource['get'](_0x37a074['sourceUrl']) === _0x37a074;
  try {
    const _0x487fb0 = _0x214130 ? LOCAL_VIDEO_WARMUP_MAX_BYTES : _0x37a074['playbackMaxBytes'],
      _0x149686 = Array['from'](entriesBySource['values']())['reduce'](
        (_0x1b1dc8, _0xe6d2e) =>
          _0x1b1dc8 + Number(_0xe6d2e['blob']?.['size'] || _0xe6d2e['reservedBytes'] || 0x0),
        0x0,
      );
    if (_0x149686 + _0x487fb0 > LOCAL_VIDEO_PLAYBACK_TOTAL_BYTES) {
      ((_0x37a074['status'] = 'budget-exceeded'), settleEntry(_0x37a074, ''));
      return;
    }
    _0x37a074['reservedBytes'] = _0x487fb0;
    const _0x3bbd3f = await fetchLocalMediaPlaybackBlob(_0x37a074['sourceUrl'], {
        signal: _0x37a074['controller']['signal'],
        timeout: _0x214130 ? LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS : _0x37a074['playbackTimeoutMs'],
        maxBytes: _0x487fb0,
        resultMode: 'typed',
      }),
      _0x8259f2 = _0x3bbd3f?.['blob'] || null;
    ((_0x37a074['status'] = String(_0x3bbd3f?.['status'] || (_0x8259f2 ? 'ready' : 'failed'))),
      (_0x37a074['httpStatus'] = Number(_0x3bbd3f?.['httpStatus'] || 0x0)));
    if (
      !_0x8259f2 ||
      _0x37a074['disposed'] ||
      _0x37a074['controller']['signal']['aborted'] ||
      entriesBySource['get'](_0x37a074['sourceUrl']) !== _0x37a074 ||
      !hasReferences(_0x37a074)
    ) {
      if (_0x344865()) {
        _0x3b1cf3 = !![];
        return;
      }
      _0x214130 &&
        !_0x37a074['disposed'] &&
        !_0x37a074['controller']['signal']['aborted'] &&
        warmupBypassUntilBySource['set'](_0x37a074['sourceUrl'], Date['now']() + LOCAL_VIDEO_WARMUP_TTL_MS);
      settleEntry(_0x37a074, '');
      return;
    }
    const _0x2c4efb = Number(_0x8259f2['size'] || 0x0);
    if (
      _0x37a074['ownerRefs']['size'] === 0x0 &&
      (_0x2c4efb > LOCAL_VIDEO_WARMUP_MAX_BYTES || !evictWarmupBlobsForBudget(_0x2c4efb, _0x37a074))
    ) {
      settleEntry(_0x37a074, '');
      return;
    }
    ((_0x37a074['blob'] = _0x8259f2),
      (_0x37a074['blobReadyAt'] = Date['now']()),
      (_0x37a074['status'] = 'ready'),
      (_0x37a074['httpStatus'] = 0x0));
    const _0xcabd40 = syncEntryObjectUrl(_0x37a074);
    settleEntry(_0x37a074, _0xcabd40);
  } catch {
    ((_0x37a074['status'] = _0x37a074['controller']['signal']['aborted'] ? 'aborted' : 'failed'),
      (_0x37a074['httpStatus'] = 0x0));
    if (_0x344865()) _0x3b1cf3 = !![];
    else settleEntry(_0x37a074, '');
  } finally {
    ((_0x37a074['reservedBytes'] = 0x0),
      (_0x37a074['active'] = ![]),
      (activeFetchCount = Math['max'](0x0, activeFetchCount - 0x1)));
    if (_0x3b1cf3)
      ((_0x37a074['controller'] = new AbortController()),
        (_0x37a074['status'] = 'pending'),
        (_0x37a074['httpStatus'] = 0x0),
        enqueueEntry(_0x37a074, {
          urgent: !![],
          bypassConcurrencyLimit: _0x37a074['bypassConcurrencyLimitRequested'],
        }));
    else {
      if (
        !_0x37a074['blob'] &&
        !_0x37a074['objectUrl'] &&
        entriesBySource['get'](_0x37a074['sourceUrl']) === _0x37a074
      ) {
        entriesBySource['delete'](_0x37a074['sourceUrl']);
        for (const _0x1a9b3a of _0x37a074['ownerRefs']) {
          if (sourceByOwner['get'](_0x1a9b3a) === _0x37a074['sourceUrl']) sourceByOwner['delete'](_0x1a9b3a);
        }
        (_0x37a074['ownerRefs']['clear'](), _0x37a074['warmupRefs']['clear']());
      }
    }
    drainQueue();
  }
}
function drainQueue() {
  while (activeFetchCount < LOCAL_VIDEO_PLAYBACK_CONCURRENCY && queuedEntries['length'] > 0x0) {
    const _0x52b9cb = queuedEntries['shift']();
    if (!_0x52b9cb) continue;
    _0x52b9cb['queued'] = ![];
    if (
      _0x52b9cb['disposed'] ||
      _0x52b9cb['active'] ||
      _0x52b9cb['objectUrl'] ||
      entriesBySource['get'](_0x52b9cb['sourceUrl']) !== _0x52b9cb ||
      !hasReferences(_0x52b9cb)
    )
      continue;
    void startEntryFetch(_0x52b9cb);
  }
}
function enqueueEntry(
  _0x2fc4e4,
  { urgent: urgent = ![], bypassConcurrencyLimit: bypassConcurrencyLimit = ![] } = {},
) {
  if (
    !_0x2fc4e4 ||
    _0x2fc4e4['disposed'] ||
    _0x2fc4e4['active'] ||
    _0x2fc4e4['blob'] ||
    _0x2fc4e4['objectUrl']
  )
    return;
  if (bypassConcurrencyLimit) {
    _0x2fc4e4['queued'] &&
      ((queuedEntries = queuedEntries['filter']((_0x3abe7e) => _0x3abe7e !== _0x2fc4e4)),
      (_0x2fc4e4['queued'] = ![]));
    void startEntryFetch(_0x2fc4e4);
    return;
  }
  if (_0x2fc4e4['queued']) {
    urgent &&
      (queuedEntries = [_0x2fc4e4, ...queuedEntries['filter']((_0x1d3bbd) => _0x1d3bbd !== _0x2fc4e4)]);
    return;
  }
  _0x2fc4e4['queued'] = !![];
  if (urgent) queuedEntries['unshift'](_0x2fc4e4);
  else queuedEntries['push'](_0x2fc4e4);
  drainQueue();
}
function removeOwnerReferenceForSource(_0x96681e, _0x58c3a5) {
  const _0x590cf3 = String(_0x96681e || '')['trim'](),
    _0x52eb8e = String(_0x58c3a5 || '')['trim']();
  if (!_0x590cf3 || !_0x52eb8e || sourceByOwner['get'](_0x590cf3) !== _0x52eb8e) return ![];
  return removeOwnerReference(_0x590cf3);
}
function waitForPlaybackEntry(
  _0x5ab66c,
  _0x13a006,
  _0x3e2646,
  { signal: _0x21d92d, timeout: _0x4e898a } = {},
) {
  if (_0x5ab66c['settled']) return Promise['resolve']('settled');
  const _0x591853 = Number['isFinite'](Number(_0x4e898a))
    ? Math['max'](0x0, Number(_0x4e898a))
    : LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS;
  return new Promise((_0x337140) => {
    let _0xef6138 = ![],
      _0x2d64a1 = null,
      _0x40f8ea = null;
    const _0x479ff3 = (_0x30075b) => {
      if (_0xef6138) return;
      _0xef6138 = !![];
      if (_0x2d64a1 !== null) clearTimeout(_0x2d64a1);
      if (_0x21d92d && _0x40f8ea) _0x21d92d['removeEventListener']?.('abort', _0x40f8ea);
      _0x337140(_0x30075b);
    };
    if (_0x21d92d?.['aborted']) {
      _0x479ff3('aborted');
      return;
    }
    (_0x21d92d &&
      ((_0x40f8ea = () => _0x479ff3('aborted')),
      _0x21d92d['addEventListener']?.('abort', _0x40f8ea, { once: !![] })),
      _0x591853 > 0x0 &&
        ((_0x2d64a1 = setTimeout(() => _0x479ff3('timeout'), _0x591853)), _0x2d64a1?.['unref']?.()),
      _0x5ab66c['promise']['then'](
        () => _0x479ff3('settled'),
        () => _0x479ff3('settled'),
      ));
  })['then']((_0x475934) => {
    return (_0x475934 !== 'settled' && removeOwnerReferenceForSource(_0x13a006, _0x3e2646), _0x475934);
  });
}
export async function acquireLocalVideoPlaybackObjectUrlResult(
  _0x165807,
  _0x4e8e5a,
  {
    bypassConcurrencyLimit: bypassConcurrencyLimit = ![],
    maxBytes: maxBytes = LOCAL_VIDEO_PLAYBACK_MAX_BYTES,
    timeout: timeout = LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS,
    signal: signal = null,
    playbackStrategy: playbackStrategy = 'blob',
  } = {},
) {
  const _0xa7cd69 = resolveCanonicalLocalSource(_0x165807),
    _0x5e300d = String(_0x4e8e5a || '')['trim']();
  if (!_0x5e300d) return createPlaybackResult('missing-owner');
  const _0x457518 = sourceByOwner['get'](_0x5e300d) || '';
  if (!_0xa7cd69) return (removeOwnerReference(_0x5e300d), createPlaybackResult('not-local'));
  if (_0x457518 && _0x457518 !== _0xa7cd69) removeOwnerReference(_0x5e300d);
  if (signal?.['aborted']) return createPlaybackResult('aborted');
  if (playbackStrategy === 'range' && !_0x457518 && !entriesBySource['has'](_0xa7cd69))
    return createPlaybackResult('ready', _0xa7cd69);
  warmupBypassUntilBySource['delete'](_0xa7cd69);
  const _0x2dbc3d = getOrCreateEntry(_0xa7cd69, _0x5e300d);
  ((_0x2dbc3d['playbackMaxBytes'] = Math['max'](
    _0x2dbc3d['playbackMaxBytes'],
    Math['min'](
      LOCAL_VIDEO_PLAYBACK_MAX_REQUEST_BYTES,
      Math['max'](LOCAL_VIDEO_PLAYBACK_MAX_BYTES, Math['trunc'](Number(maxBytes) || 0x0)),
    ),
  )),
    (_0x2dbc3d['playbackTimeoutMs'] = Math['max'](
      _0x2dbc3d['playbackTimeoutMs'],
      Math['min'](
        LOCAL_VIDEO_PLAYBACK_MAX_REQUEST_TIMEOUT_MS,
        Math['max'](LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS, Math['trunc'](Number(timeout) || 0x0)),
      ),
    )));
  (!_0x2dbc3d['firstOwnerId'] || _0x2dbc3d['firstOwnerId']['startsWith']('warmup:')) &&
    (_0x2dbc3d['firstOwnerId'] = _0x5e300d);
  (_0x2dbc3d['ownerRefs']['add'](_0x5e300d), sourceByOwner['set'](_0x5e300d, _0xa7cd69));
  if (bypassConcurrencyLimit) _0x2dbc3d['bypassConcurrencyLimitRequested'] = !![];
  const _0x44963f = syncEntryObjectUrl(_0x2dbc3d);
  if (_0x44963f) return createPlaybackResult('ready', _0x44963f);
  enqueueEntry(_0x2dbc3d, { urgent: !![], bypassConcurrencyLimit: bypassConcurrencyLimit });
  const _0x3fee7e = await waitForPlaybackEntry(_0x2dbc3d, _0x5e300d, _0xa7cd69, {
    signal: signal,
    timeout: timeout,
  });
  if (_0x3fee7e === 'timeout') return createPlaybackResult('timeout');
  if (_0x3fee7e === 'aborted') return createPlaybackResult('aborted');
  const _0x803d2e = syncEntryObjectUrl(_0x2dbc3d);
  if (sourceByOwner['get'](_0x5e300d) === _0xa7cd69 && _0x2dbc3d['ownerRefs']['has'](_0x5e300d) && _0x803d2e)
    return createPlaybackResult('ready', _0x803d2e);
  return createPlaybackResult(_0x2dbc3d['status'], '', _0x2dbc3d['httpStatus']);
}
export async function acquireLocalVideoPlaybackObjectUrl(_0x4a4c4e, _0x2a0a4a, _0x3a42a9 = {}) {
  const _0x350761 = await acquireLocalVideoPlaybackObjectUrlResult(_0x4a4c4e, _0x2a0a4a, _0x3a42a9);
  return _0x350761['playbackUrl'];
}
export function releaseLocalVideoPlaybackObjectUrlOwner(_0x166518) {
  return removeOwnerReference(_0x166518);
}
export function releaseLocalVideoPlaybackObjectUrlOwnerScope(_0x36c40a) {
  const _0x423ddb = String(_0x36c40a || '')['trim']();
  if (!_0x423ddb) return 0x0;
  let _0x50bd0c = 0x0;
  for (const _0x44a9ae of Array['from'](sourceByOwner['keys']())) {
    (_0x44a9ae === _0x423ddb || _0x44a9ae['startsWith'](_0x423ddb + ':')) &&
      (_0x50bd0c += removeOwnerReference(_0x44a9ae) ? 0x1 : 0x0);
  }
  return _0x50bd0c;
}
export function syncLocalVideoPlaybackWarmupSources(
  _0x37766a,
  { scope: scope = 'canvas-low-zoom', maxSources: maxSources = 0x3 } = {},
) {
  const _0x109b36 = String(scope || '')['trim']();
  if (!_0x109b36) return { sources: [], scheduledCount: 0x0 };
  const _0xf737ed = Math['max'](0x0, Math['min'](0x3, Math['trunc'](Number(maxSources) || 0x0))),
    _0x38fcf2 = [],
    _0x5f3390 = new Set();
  for (const _0x1efc88 of _0x37766a || []) {
    const _0x1533f2 = resolveCanonicalLocalSource(_0x1efc88);
    if (!_0x1533f2 || _0x5f3390['has'](_0x1533f2)) continue;
    (_0x5f3390['add'](_0x1533f2), _0x38fcf2['push'](_0x1533f2));
    if (_0x38fcf2['length'] >= _0xf737ed) break;
  }
  const _0x35d2a8 = sourcesByWarmupScope['get'](_0x109b36) || new Set(),
    _0x149969 = new Set(_0x38fcf2);
  for (const _0x3afca8 of _0x35d2a8) {
    if (_0x149969['has'](_0x3afca8)) continue;
    const _0x3c2fd4 = entriesBySource['get'](_0x3afca8);
    (_0x3c2fd4?.['warmupRefs']['delete'](_0x109b36),
      _0x3c2fd4 &&
      _0x3c2fd4['ownerRefs']['size'] === 0x0 &&
      _0x3c2fd4['warmupRefs']['size'] === 0x0 &&
      (_0x3c2fd4['blob'] || _0x3c2fd4['active'] || _0x3c2fd4['queued'])
        ? ((_0x3c2fd4['handoffRetained'] = !![]), scheduleWarmupExpiry(_0x3c2fd4))
        : removeEntryIfUnreferenced(_0x3c2fd4));
  }
  if (_0x149969['size'] > 0x0) sourcesByWarmupScope['set'](_0x109b36, _0x149969);
  else sourcesByWarmupScope['delete'](_0x109b36);
  for (const _0x397d1c of _0x38fcf2) {
    if (isWarmupBypassed(_0x397d1c)) continue;
    const _0x148ffb = getOrCreateEntry(_0x397d1c, 'warmup:' + _0x109b36);
    ((_0x148ffb['handoffRetained'] = ![]),
      _0x148ffb['warmupRefs']['add'](_0x109b36),
      scheduleWarmupExpiry(_0x148ffb),
      enqueueEntry(_0x148ffb));
  }
  return { sources: _0x38fcf2, scheduledCount: _0x38fcf2['length'] };
}
export function clearLocalVideoPlaybackWarmupScope(_0xe195a8 = 'canvas-low-zoom') {
  const _0x48ea31 = String(_0xe195a8 || '')['trim'](),
    _0x10163a = sourcesByWarmupScope['get'](_0x48ea31)?.['size'] || 0x0;
  return (syncLocalVideoPlaybackWarmupSources([], { scope: _0x48ea31, maxSources: 0x0 }), _0x10163a);
}
export const __localVideoPlaybackObjectUrlServiceForTest = {
  clear() {
    for (const _0x23c465 of entriesBySource['values']()) disposeEntry(_0x23c465);
    (entriesBySource['clear'](),
      sourceByOwner['clear'](),
      sourcesByWarmupScope['clear'](),
      warmupBypassUntilBySource['clear'](),
      (queuedEntries = []),
      (activeFetchCount = 0x0));
  },
  snapshot() {
    return {
      activeFetchCount: activeFetchCount,
      queuedCount: queuedEntries['filter']((_0x586016) => _0x586016['queued'])['length'],
      warmupBlobBytes: getWarmupBlobBytes(),
      warmupBypassedSources: Array['from'](warmupBypassUntilBySource['keys']()),
      entries: Array['from'](entriesBySource['values']())['map']((_0x29da42) => ({
        sourceUrl: _0x29da42['sourceUrl'],
        blobSize: Number(_0x29da42['blob']?.['size'] || 0x0),
        objectUrl: _0x29da42['objectUrl'],
        status: _0x29da42['status'],
        httpStatus: _0x29da42['httpStatus'],
        ownerRefs: Array['from'](_0x29da42['ownerRefs']),
        warmupRefs: Array['from'](_0x29da42['warmupRefs']),
        handoffRetained: _0x29da42['handoffRetained'] === !![],
        queued: _0x29da42['queued'],
        active: _0x29da42['active'],
        aborted: _0x29da42['controller']['signal']['aborted'],
      })),
    };
  },
};

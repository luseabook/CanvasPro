import { fetchLocalMediaPlaybackBlob } from '../../api/localMediaPlaybackApi.js';
import { createTrackedMediaObjectUrl, revokeTrackedMediaObjectUrl } from './mediaObjectUrlRegistry.js';
const LOCAL_VIDEO_PLAYBACK_MAX_BYTES = 64 * 1024 * 1024,
  LOCAL_VIDEO_PLAYBACK_TOTAL_BYTES = 256 * 1024 * 1024,
  LOCAL_VIDEO_PLAYBACK_MAX_REQUEST_BYTES = 128 * 1024 * 1024,
  LOCAL_VIDEO_WARMUP_MAX_BYTES = 8 * 1024 * 1024,
  LOCAL_VIDEO_WARMUP_TOTAL_BYTES = 24 * 1024 * 1024,
  LOCAL_VIDEO_WARMUP_TTL_MS = 15000,
  LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS = 1500,
  LOCAL_VIDEO_PLAYBACK_MAX_REQUEST_TIMEOUT_MS = 15000,
  LOCAL_VIDEO_PLAYBACK_CONCURRENCY = 2,
  LOCAL_VIDEO_PATH_RE = /^\/(?:output|data\/assets|data\/uploads)\//i,
  entriesBySource = new Map(),
  sourceByOwner = new Map(),
  sourcesByWarmupScope = new Map(),
  warmupBypassUntilBySource = new Map();
let queuedEntries = [],
  activeFetchCount = 0;
function resolveCanonicalLocalSource(value) {
  const enabled = String(value || '').trim(),
    item = globalThis.location || globalThis.window?.location,
    enabled2 = String(item?.href || '').trim(),
    enabled3 = String(item?.origin || '').trim();
  if (!enabled || !enabled2 || !enabled3 || enabled3 === 'null') return '';
  try {
    const uRL = new URL(enabled, enabled2);
    if (
      uRL.origin !== enabled3 ||
      uRL.username ||
      uRL.password ||
      !LOCAL_VIDEO_PATH_RE.test(uRL.pathname)
    )
      return '';
    return ((uRL.hash = ''), uRL.href);
  } catch {
    return '';
  }
}
function isWarmupBypassed(key) {
  const index = Number(warmupBypassUntilBySource.get(key) || 0);
  if (!(index > Date.now())) return (warmupBypassUntilBySource.delete(key), false);
  return true;
}
function hasReferences(result) {
  return (
    result.ownerRefs.size > 0 ||
    result.warmupRefs.size > 0 ||
    result.handoffRetained === true
  );
}
function clearWarmupExpiry(data) {
  if (data?.warmupExpiryTimer == null) return;
  (clearTimeout(data.warmupExpiryTimer), (data.warmupExpiryTimer = null));
}
function getWarmupBlobBytes(value2 = null) {
  let options = 0;
  for (const enabled4 of entriesBySource.values()) {
    if (enabled4 === value2 || !enabled4.blob || enabled4.ownerRefs.size > 0) continue;
    options += Number(enabled4.blob.size || 0);
  }
  return options;
}
function expireWarmupEntry(enabled5) {
  clearWarmupExpiry(enabled5);
  if (!enabled5 || enabled5.ownerRefs.size > 0) return;
  for (const target of enabled5.warmupRefs) {
    const map = sourcesByWarmupScope.get(target);
    map?.delete(enabled5.sourceUrl);
    if (map?.size === 0) sourcesByWarmupScope.delete(target);
  }
  (enabled5.warmupRefs.clear(),
    (enabled5.handoffRetained = false),
    removeEntryIfUnreferenced(enabled5));
}
function scheduleWarmupExpiry(enabled6) {
  clearWarmupExpiry(enabled6);
  if (!enabled6 || enabled6.ownerRefs.size > 0) return;
  ((enabled6.warmupExpiryTimer = setTimeout(() => expireWarmupEntry(enabled6), LOCAL_VIDEO_WARMUP_TTL_MS)),
    enabled6.warmupExpiryTimer?.unref?.());
}
function evictWarmupBlobsForBudget(source, next = null) {
  let warmupBlobBytes = getWarmupBlobBytes(next);
  if (warmupBlobBytes + source <= LOCAL_VIDEO_WARMUP_TOTAL_BYTES) return true;
  const current = Array.from(entriesBySource.values())
    .filter((entry) => entry !== next && entry.blob && entry.ownerRefs.size === 0)
    .sort(
      (record, payload) => Number(record.blobReadyAt || 0) - Number(payload.blobReadyAt || 0),
    );
  for (const handle of current) {
    const state = Number(handle.blob?.size || 0);
    (expireWarmupEntry(handle), (warmupBlobBytes = Math.max(0, warmupBlobBytes - state)));
    if (warmupBlobBytes + source <= LOCAL_VIDEO_WARMUP_TOTAL_BYTES) return true;
  }
  return warmupBlobBytes + source <= LOCAL_VIDEO_WARMUP_TOTAL_BYTES;
}
function settleEntry(config, input = '') {
  if (config.settled) return;
  ((config.settled = true), config.resolvePromise(input));
}
function createPlaybackResult(output, value3 = '', value4 = 0) {
  return {
    status: String(output || 'failed'),
    playbackUrl: String(value3 || ''),
    httpStatus: Number(value4 || 0),
  };
}
function disposeEntry(enabled7) {
  if (!enabled7 || enabled7.disposed) return;
  ((enabled7.disposed = true),
    clearWarmupExpiry(enabled7),
    enabled7.controller.abort(),
    (enabled7.queued = false),
    enabled7.objectUrl &&
      (revokeTrackedMediaObjectUrl(enabled7.objectUrl), (enabled7.objectUrl = '')),
    (enabled7.blob = null),
    settleEntry(enabled7, ''));
}
function syncEntryObjectUrl(ownerId) {
  if (!ownerId || ownerId.disposed) return '';
  if (ownerId.ownerRefs.size === 0) {
    ownerId.objectUrl && (revokeTrackedMediaObjectUrl(ownerId.objectUrl), (ownerId.objectUrl = ''));
    if (
      ownerId.blob &&
      (ownerId.blob.size > LOCAL_VIDEO_WARMUP_MAX_BYTES ||
        !evictWarmupBlobsForBudget(ownerId.blob.size, ownerId))
    )
      return (expireWarmupEntry(ownerId), '');
    return (scheduleWarmupExpiry(ownerId), '');
  }
  return (
    (ownerId.handoffRetained = false),
    clearWarmupExpiry(ownerId),
    !ownerId.objectUrl &&
      ownerId.blob &&
      (ownerId.objectUrl = createTrackedMediaObjectUrl(ownerId.blob, {
        kind: 'video',
        ownerId: ownerId.firstOwnerId,
        sourceUrl: ownerId.sourceUrl,
      })),
    ownerId.objectUrl
  );
}
function removeEntryIfUnreferenced(enabled8) {
  if (!enabled8 || hasReferences(enabled8)) return false;
  return (
    entriesBySource.get(enabled8.sourceUrl) === enabled8 &&
      entriesBySource.delete(enabled8.sourceUrl),
    disposeEntry(enabled8),
    true
  );
}
function createEntry(sourceUrl, value5 = '') {
  let resolvePromise;
  const promise = new Promise((value6) => {
      resolvePromise = value6;
    }),
    value7 = {
      sourceUrl: sourceUrl,
      firstOwnerId: String(value5 || ''),
      playbackMaxBytes: LOCAL_VIDEO_PLAYBACK_MAX_BYTES,
      playbackTimeoutMs: LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS,
      ownerRefs: new Set(),
      warmupRefs: new Set(),
      handoffRetained: false,
      controller: new AbortController(),
      blob: null,
      blobReadyAt: 0,
      objectUrl: '',
      status: 'pending',
      httpStatus: 0,
      promise: promise,
      resolvePromise: resolvePromise,
      settled: false,
      disposed: false,
      queued: false,
      active: false,
      bypassConcurrencyLimitRequested: false,
      warmupExpiryTimer: null,
    };
  return (entriesBySource.set(sourceUrl, value7), value7);
}
function getOrCreateEntry(value8, value9 = '') {
  return entriesBySource.get(value8) || createEntry(value8, value9);
}
function removeOwnerReference(value10) {
  const enabled9 = String(value10 || '').trim(),
    enabled10 = sourceByOwner.get(enabled9);
  if (!enabled9 || !enabled10) return false;
  sourceByOwner.delete(enabled9);
  const enabled11 = entriesBySource.get(enabled10);
  if (!enabled11) return false;
  return (
    enabled11.ownerRefs.delete(enabled9),
    syncEntryObjectUrl(enabled11),
    removeEntryIfUnreferenced(enabled11),
    true
  );
}
async function startEntryFetch(signal2) {
  ((signal2.active = true), (activeFetchCount += 1));
  const timeout2 = signal2.ownerRefs.size === 0;
  let value11 = false;
  const run = () =>
    timeout2 &&
    signal2.ownerRefs.size > 0 &&
    !signal2.disposed &&
    !signal2.controller.signal.aborted &&
    entriesBySource.get(signal2.sourceUrl) === signal2;
  try {
    const maxBytes2 = timeout2 ? LOCAL_VIDEO_WARMUP_MAX_BYTES : signal2.playbackMaxBytes,
      value12 = Array.from(entriesBySource.values()).reduce(
        (value13, value14) => value13 + Number(value14.blob?.size || value14.reservedBytes || 0),
        0,
      );
    if (value12 + maxBytes2 > LOCAL_VIDEO_PLAYBACK_TOTAL_BYTES) {
      ((signal2.status = 'budget-exceeded'), settleEntry(signal2, ''));
      return;
    }
    signal2.reservedBytes = maxBytes2;
    const response = await fetchLocalMediaPlaybackBlob(signal2.sourceUrl, {
        signal: signal2.controller.signal,
        timeout: timeout2 ? LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS : signal2.playbackTimeoutMs,
        maxBytes: maxBytes2,
        resultMode: 'typed',
      }),
      enabled12 = response?.blob || null;
    ((signal2.status = String(response?.status || (enabled12 ? 'ready' : 'failed'))),
      (signal2.httpStatus = Number(response?.httpStatus || 0)));
    if (
      !enabled12 ||
      signal2.disposed ||
      signal2.controller.signal.aborted ||
      entriesBySource.get(signal2.sourceUrl) !== signal2 ||
      !hasReferences(signal2)
    ) {
      if (run()) {
        value11 = true;
        return;
      }
      timeout2 &&
        !signal2.disposed &&
        !signal2.controller.signal.aborted &&
        warmupBypassUntilBySource.set(signal2.sourceUrl, Date.now() + LOCAL_VIDEO_WARMUP_TTL_MS);
      settleEntry(signal2, '');
      return;
    }
    const value15 = Number(enabled12.size || 0);
    if (
      signal2.ownerRefs.size === 0 &&
      (value15 > LOCAL_VIDEO_WARMUP_MAX_BYTES || !evictWarmupBlobsForBudget(value15, signal2))
    ) {
      settleEntry(signal2, '');
      return;
    }
    ((signal2.blob = enabled12),
      (signal2.blobReadyAt = Date.now()),
      (signal2.status = 'ready'),
      (signal2.httpStatus = 0));
    const syncEntryObjectUrl2 = syncEntryObjectUrl(signal2);
    settleEntry(signal2, syncEntryObjectUrl2);
  } catch {
    ((signal2.status = signal2.controller.signal.aborted ? 'aborted' : 'failed'),
      (signal2.httpStatus = 0));
    if (run()) value11 = true;
    else settleEntry(signal2, '');
  } finally {
    ((signal2.reservedBytes = 0),
      (signal2.active = false),
      (activeFetchCount = Math.max(0, activeFetchCount - 1)));
    if (value11)
      ((signal2.controller = new AbortController()),
        (signal2.status = 'pending'),
        (signal2.httpStatus = 0),
        enqueueEntry(signal2, {
          urgent: true,
          bypassConcurrencyLimit: signal2.bypassConcurrencyLimitRequested,
        }));
    else {
      if (
        !signal2.blob &&
        !signal2.objectUrl &&
        entriesBySource.get(signal2.sourceUrl) === signal2
      ) {
        entriesBySource.delete(signal2.sourceUrl);
        for (const value16 of signal2.ownerRefs) {
          if (sourceByOwner.get(value16) === signal2.sourceUrl) sourceByOwner.delete(value16);
        }
        (signal2.ownerRefs.clear(), signal2.warmupRefs.clear());
      }
    }
    drainQueue();
  }
}
function drainQueue() {
  while (activeFetchCount < LOCAL_VIDEO_PLAYBACK_CONCURRENCY && queuedEntries.length > 0) {
    const enabled13 = queuedEntries.shift();
    if (!enabled13) continue;
    enabled13.queued = false;
    if (
      enabled13.disposed ||
      enabled13.active ||
      enabled13.objectUrl ||
      entriesBySource.get(enabled13.sourceUrl) !== enabled13 ||
      !hasReferences(enabled13)
    )
      continue;
    void startEntryFetch(enabled13);
  }
}
function enqueueEntry(
  enabled14,
  { urgent: urgent = false, bypassConcurrencyLimit: bypassConcurrencyLimit = false } = {},
) {
  if (
    !enabled14 ||
    enabled14.disposed ||
    enabled14.active ||
    enabled14.blob ||
    enabled14.objectUrl
  )
    return;
  if (bypassConcurrencyLimit) {
    enabled14.queued &&
      ((queuedEntries = queuedEntries.filter((value17) => value17 !== enabled14)),
      (enabled14.queued = false));
    void startEntryFetch(enabled14);
    return;
  }
  if (enabled14.queued) {
    urgent && (queuedEntries = [enabled14, ...queuedEntries.filter((value18) => value18 !== enabled14)]);
    return;
  }
  enabled14.queued = true;
  if (urgent) queuedEntries.unshift(enabled14);
  else queuedEntries.push(enabled14);
  drainQueue();
}
function removeOwnerReferenceForSource(value19, value20) {
  const enabled15 = String(value19 || '').trim(),
    enabled16 = String(value20 || '').trim();
  if (!enabled15 || !enabled16 || sourceByOwner.get(enabled15) !== enabled16) return false;
  return removeOwnerReference(enabled15);
}
function waitForPlaybackEntry(value21, value22, value23, { signal: signal3, timeout: timeout3 } = {}) {
  if (value21.settled) return Promise.resolve('settled');
  const count = Number.isFinite(Number(timeout3))
    ? Math.max(0, Number(timeout3))
    : LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS;
  return new Promise((handler) => {
    let value24 = false,
      timer = null,
      value25 = null;
    const run2 = (value26) => {
      if (value24) return;
      value24 = true;
      if (timer !== null) clearTimeout(timer);
      if (signal3 && value25) signal3.removeEventListener?.('abort', value25);
      handler(value26);
    };
    if (signal3?.aborted) {
      run2('aborted');
      return;
    }
    (signal3 &&
      ((value25 = () => run2('aborted')), signal3.addEventListener?.('abort', value25, { once: true })),
      count > 0 && ((timer = setTimeout(() => run2('timeout'), count)), timer?.unref?.()),
      value21.promise.then(
        () => run2('settled'),
        () => run2('settled'),
      ));
  }).then((value27) => {
    return (value27 !== 'settled' && removeOwnerReferenceForSource(value22, value23), value27);
  });
}
export async function acquireLocalVideoPlaybackObjectUrlResult(
  value28,
  value29,
  {
    bypassConcurrencyLimit: bypassConcurrencyLimit = false,
    maxBytes: maxBytes = LOCAL_VIDEO_PLAYBACK_MAX_BYTES,
    timeout: timeout = LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS,
    signal: signal = null,
    playbackStrategy: playbackStrategy = 'blob',
  } = {},
) {
  const canonicalLocalSource = resolveCanonicalLocalSource(value28),
    enabled17 = String(value29 || '').trim();
  if (!enabled17) return createPlaybackResult('missing-owner');
  const enabled18 = sourceByOwner.get(enabled17) || '';
  if (!canonicalLocalSource) return (removeOwnerReference(enabled17), createPlaybackResult('not-local'));
  if (enabled18 && enabled18 !== canonicalLocalSource) removeOwnerReference(enabled17);
  if (signal?.aborted) return createPlaybackResult('aborted');
  if (playbackStrategy === 'range' && !enabled18 && !entriesBySource.has(canonicalLocalSource))
    return createPlaybackResult('ready', canonicalLocalSource);
  warmupBypassUntilBySource.delete(canonicalLocalSource);
  const response2 = getOrCreateEntry(canonicalLocalSource, enabled17);
  ((response2.playbackMaxBytes = Math.max(
    response2.playbackMaxBytes,
    Math.min(
      LOCAL_VIDEO_PLAYBACK_MAX_REQUEST_BYTES,
      Math.max(LOCAL_VIDEO_PLAYBACK_MAX_BYTES, Math.trunc(Number(maxBytes) || 0)),
    ),
  )),
    (response2.playbackTimeoutMs = Math.max(
      response2.playbackTimeoutMs,
      Math.min(
        LOCAL_VIDEO_PLAYBACK_MAX_REQUEST_TIMEOUT_MS,
        Math.max(LOCAL_VIDEO_PLAYBACK_TIMEOUT_MS, Math.trunc(Number(timeout) || 0)),
      ),
    )));
  (!response2.firstOwnerId || response2.firstOwnerId.startsWith('warmup:')) &&
    (response2.firstOwnerId = enabled17);
  (response2.ownerRefs.add(enabled17), sourceByOwner.set(enabled17, canonicalLocalSource));
  if (bypassConcurrencyLimit) response2.bypassConcurrencyLimitRequested = true;
  const syncEntryObjectUrl3 = syncEntryObjectUrl(response2);
  if (syncEntryObjectUrl3) return createPlaybackResult('ready', syncEntryObjectUrl3);
  enqueueEntry(response2, { urgent: true, bypassConcurrencyLimit: bypassConcurrencyLimit });
  const waitForPlaybackEntry2 = await waitForPlaybackEntry(response2, enabled17, canonicalLocalSource, {
    signal: signal,
    timeout: timeout,
  });
  if (waitForPlaybackEntry2 === 'timeout') return createPlaybackResult('timeout');
  if (waitForPlaybackEntry2 === 'aborted') return createPlaybackResult('aborted');
  const syncEntryObjectUrl4 = syncEntryObjectUrl(response2);
  if (
    sourceByOwner.get(enabled17) === canonicalLocalSource &&
    response2.ownerRefs.has(enabled17) &&
    syncEntryObjectUrl4
  )
    return createPlaybackResult('ready', syncEntryObjectUrl4);
  return createPlaybackResult(response2.status, '', response2.httpStatus);
}
export async function acquireLocalVideoPlaybackObjectUrl(value30, value31, value32 = {}) {
  const acquireLocalVideoPlaybackObjectUrlResult2 = await acquireLocalVideoPlaybackObjectUrlResult(
    value30,
    value31,
    value32,
  );
  return acquireLocalVideoPlaybackObjectUrlResult2.playbackUrl;
}
export function releaseLocalVideoPlaybackObjectUrlOwner(value33) {
  return removeOwnerReference(value33);
}
export function releaseLocalVideoPlaybackObjectUrlOwnerScope(value34) {
  const enabled19 = String(value34 || '').trim();
  if (!enabled19) return 0;
  let value35 = 0;
  for (const value36 of Array.from(sourceByOwner.keys())) {
    (value36 === enabled19 || value36.startsWith(enabled19 + ':')) &&
      (value35 += removeOwnerReference(value36) ? 1 : 0);
  }
  return value35;
}
export function syncLocalVideoPlaybackWarmupSources(
  value37,
  { scope: scope = 'canvas-low-zoom', maxSources: maxSources = 3 } = {},
) {
  const enabled20 = String(scope || '').trim();
  if (!enabled20) return { sources: [], scheduledCount: 0 };
  const value38 = Math.max(0, Math.min(3, Math.trunc(Number(maxSources) || 0))),
    sources = [],
    map2 = new Set();
  for (const value39 of value37 || []) {
    const canonicalLocalSource2 = resolveCanonicalLocalSource(value39);
    if (!canonicalLocalSource2 || map2.has(canonicalLocalSource2)) continue;
    (map2.add(canonicalLocalSource2), sources.push(canonicalLocalSource2));
    if (sources.length >= value38) break;
  }
  const value40 = sourcesByWarmupScope.get(enabled20) || new Set(),
    map3 = new Set(sources);
  for (const value41 of value40) {
    if (map3.has(value41)) continue;
    const value42 = entriesBySource.get(value41);
    (value42?.warmupRefs.delete(enabled20),
      value42 &&
      value42.ownerRefs.size === 0 &&
      value42.warmupRefs.size === 0 &&
      (value42.blob || value42.active || value42.queued)
        ? ((value42.handoffRetained = true), scheduleWarmupExpiry(value42))
        : removeEntryIfUnreferenced(value42));
  }
  if (map3.size > 0) sourcesByWarmupScope.set(enabled20, map3);
  else sourcesByWarmupScope.delete(enabled20);
  for (const value43 of sources) {
    if (isWarmupBypassed(value43)) continue;
    const orCreateEntry = getOrCreateEntry(value43, 'warmup:' + enabled20);
    ((orCreateEntry.handoffRetained = false),
      orCreateEntry.warmupRefs.add(enabled20),
      scheduleWarmupExpiry(orCreateEntry),
      enqueueEntry(orCreateEntry));
  }
  return { sources: sources, scheduledCount: sources.length };
}
export function clearLocalVideoPlaybackWarmupScope(value44 = 'canvas-low-zoom') {
  const scope2 = String(value44 || '').trim(),
    value45 = sourcesByWarmupScope.get(scope2)?.size || 0;
  return (syncLocalVideoPlaybackWarmupSources([], { scope: scope2, maxSources: 0 }), value45);
}
export const __localVideoPlaybackObjectUrlServiceForTest = {
  clear() {
    for (const value46 of entriesBySource.values()) disposeEntry(value46);
    (entriesBySource.clear(),
      sourceByOwner.clear(),
      sourcesByWarmupScope.clear(),
      warmupBypassUntilBySource.clear(),
      (queuedEntries = []),
      (activeFetchCount = 0));
  },
  snapshot() {
    return {
      activeFetchCount: activeFetchCount,
      queuedCount: queuedEntries.filter((value47) => value47.queued).length,
      warmupBlobBytes: getWarmupBlobBytes(),
      warmupBypassedSources: Array.from(warmupBypassUntilBySource.keys()),
      entries: Array.from(entriesBySource.values()).map((sourceUrl2) => ({
        sourceUrl: sourceUrl2.sourceUrl,
        blobSize: Number(sourceUrl2.blob?.size || 0),
        objectUrl: sourceUrl2.objectUrl,
        status: sourceUrl2.status,
        httpStatus: sourceUrl2.httpStatus,
        ownerRefs: Array.from(sourceUrl2.ownerRefs),
        warmupRefs: Array.from(sourceUrl2.warmupRefs),
        handoffRetained: sourceUrl2.handoffRetained === true,
        queued: sourceUrl2.queued,
        active: sourceUrl2.active,
        aborted: sourceUrl2.controller.signal.aborted,
      })),
    };
  },
};

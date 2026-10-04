import { fetchLocalMediaPlaybackBlob } from '../../api/localMediaPlaybackApi.js';
import { createTrackedMediaObjectUrl, revokeTrackedMediaObjectUrl } from './mediaObjectUrlRegistry.js';
const LOCAL_AUDIO_PLAYBACK_MAX_BYTES = 0x20 * 0x400 * 0x400,
  ALLOWED_LOCAL_AUDIO_PATH = /^\/(?:output|data\/assets|data\/uploads)\//i,
  entriesBySource = new Map();
function resolveCanonicalLocalSource(value) {
  const enabled = String(value || '')['trim'](),
    item = globalThis['location'] || globalThis['window']?.['location'],
    enabled2 = String(item?.['href'] || '')['trim'](),
    enabled3 = String(item?.['origin'] || '')['trim']();
  if (!enabled || !enabled2 || !enabled3 || enabled3 === 'null') return '';
  try {
    const uRL = new URL(enabled, enabled2);
    if (
      uRL['origin'] !== enabled3 ||
      uRL['username'] ||
      uRL['password'] ||
      !ALLOWED_LOCAL_AUDIO_PATH['test'](uRL['pathname'])
    )
      return '';
    return ((uRL['hash'] = ''), uRL['href']);
  } catch {
    return '';
  }
}
function countOwnerRefs(key) {
  return key['ownerRefs']['size'];
}
function disposeEntry(index) {
  (index['controller']['abort'](),
    index['objectUrl'] && (revokeTrackedMediaObjectUrl(index['objectUrl']), (index['objectUrl'] = '')));
}
function startSharedFetch(signal, timeout) {
  return (async () => {
    try {
      const fetchLocalMediaPlaybackBlob2 = await fetchLocalMediaPlaybackBlob(signal['sourceUrl'], {
        signal: signal['controller']['signal'],
        timeout: timeout,
        maxBytes: LOCAL_AUDIO_PLAYBACK_MAX_BYTES,
      });
      if (
        !fetchLocalMediaPlaybackBlob2 ||
        signal['controller']['signal']['aborted'] ||
        entriesBySource['get'](signal['sourceUrl']) !== signal ||
        countOwnerRefs(signal) === 0x0
      )
        return '';
      return (
        (signal['objectUrl'] = createTrackedMediaObjectUrl(fetchLocalMediaPlaybackBlob2, {
          kind: 'audio',
          ownerId: signal['firstOwnerId'],
          sourceUrl: signal['sourceUrl'],
        })),
        signal['objectUrl']
      );
    } catch {
      return '';
    } finally {
      !signal['objectUrl'] &&
        entriesBySource['get'](signal['sourceUrl']) === signal &&
        (entriesBySource['delete'](signal['sourceUrl']), signal['ownerRefs']['clear']());
    }
  })();
}
export async function acquireLocalAudioPlaybackObjectUrl(result, data, { timeout: timeout2 } = {}) {
  const sourceUrl = resolveCanonicalLocalSource(result),
    firstOwnerId = String(data || '')['trim']();
  if (!sourceUrl || !firstOwnerId) return '';
  let enabled4 = entriesBySource['get'](sourceUrl);
  !enabled4 &&
    ((enabled4 = {
      sourceUrl: sourceUrl,
      firstOwnerId: firstOwnerId,
      ownerRefs: new Set(),
      controller: new AbortController(),
      objectUrl: '',
      promise: null,
    }),
    entriesBySource['set'](sourceUrl, enabled4),
    (enabled4['promise'] = startSharedFetch(enabled4, timeout2)));
  enabled4['ownerRefs']['add'](firstOwnerId);
  const options = await enabled4['promise'];
  return enabled4['ownerRefs']['has'](firstOwnerId) ? options : '';
}
export function releaseLocalAudioPlaybackObjectUrl(target, source) {
  const canonicalLocalSource = resolveCanonicalLocalSource(target),
    enabled5 = String(source || '')['trim'](),
    enabled6 = canonicalLocalSource ? entriesBySource['get'](canonicalLocalSource) : null;
  if (!enabled6 || !enabled5 || !enabled6['ownerRefs']['has'](enabled5)) return ![];
  return (
    enabled6['ownerRefs']['delete'](enabled5),
    countOwnerRefs(enabled6) === 0x0 &&
      (entriesBySource['delete'](canonicalLocalSource), disposeEntry(enabled6)),
    !![]
  );
}
export const __localAudioPlaybackObjectUrlServiceForTest = {
  clear() {
    for (const next of entriesBySource['values']()) disposeEntry(next);
    entriesBySource['clear']();
  },
  snapshot() {
    return Array['from'](entriesBySource['values']())['map']((sourceUrl2) => ({
      sourceUrl: sourceUrl2['sourceUrl'],
      objectUrl: sourceUrl2['objectUrl'],
      totalRefs: countOwnerRefs(sourceUrl2),
      ownerRefs: Object['fromEntries'](Array['from'](sourceUrl2['ownerRefs'], (current) => [current, 0x1])),
      aborted: sourceUrl2['controller']['signal']['aborted'],
    }));
  },
};

import { fetchLocalMediaPlaybackBlob } from '../../api/localMediaPlaybackApi.js';
import { createTrackedMediaObjectUrl, revokeTrackedMediaObjectUrl } from './mediaObjectUrlRegistry.js';
const LOCAL_AUDIO_PLAYBACK_MAX_BYTES = 0x20 * 0x400 * 0x400,
  ALLOWED_LOCAL_AUDIO_PATH = /^\/(?:output|data\/assets|data\/uploads)\//i,
  entriesBySource = new Map();
function resolveCanonicalLocalSource(_0x448ef3) {
  const _0x26b98d = String(_0x448ef3 || '')['trim'](),
    _0x247c69 = globalThis['location'] || globalThis['window']?.['location'],
    _0x59d0b4 = String(_0x247c69?.['href'] || '')['trim'](),
    _0xc83440 = String(_0x247c69?.['origin'] || '')['trim']();
  if (!_0x26b98d || !_0x59d0b4 || !_0xc83440 || _0xc83440 === 'null') return '';
  try {
    const _0x47836d = new URL(_0x26b98d, _0x59d0b4);
    if (
      _0x47836d['origin'] !== _0xc83440 ||
      _0x47836d['username'] ||
      _0x47836d['password'] ||
      !ALLOWED_LOCAL_AUDIO_PATH['test'](_0x47836d['pathname'])
    )
      return '';
    return ((_0x47836d['hash'] = ''), _0x47836d['href']);
  } catch {
    return '';
  }
}
function countOwnerRefs(_0x1727e9) {
  return _0x1727e9['ownerRefs']['size'];
}
function disposeEntry(_0xd5fb64) {
  (_0xd5fb64['controller']['abort'](),
    _0xd5fb64['objectUrl'] &&
      (revokeTrackedMediaObjectUrl(_0xd5fb64['objectUrl']), (_0xd5fb64['objectUrl'] = '')));
}
function startSharedFetch(_0x382880, _0x37dd24) {
  return (async () => {
    try {
      const _0x2be84d = await fetchLocalMediaPlaybackBlob(_0x382880['sourceUrl'], {
        signal: _0x382880['controller']['signal'],
        timeout: _0x37dd24,
        maxBytes: LOCAL_AUDIO_PLAYBACK_MAX_BYTES,
      });
      if (
        !_0x2be84d ||
        _0x382880['controller']['signal']['aborted'] ||
        entriesBySource['get'](_0x382880['sourceUrl']) !== _0x382880 ||
        countOwnerRefs(_0x382880) === 0x0
      )
        return '';
      return (
        (_0x382880['objectUrl'] = createTrackedMediaObjectUrl(_0x2be84d, {
          kind: 'audio',
          ownerId: _0x382880['firstOwnerId'],
          sourceUrl: _0x382880['sourceUrl'],
        })),
        _0x382880['objectUrl']
      );
    } catch {
      return '';
    } finally {
      !_0x382880['objectUrl'] &&
        entriesBySource['get'](_0x382880['sourceUrl']) === _0x382880 &&
        (entriesBySource['delete'](_0x382880['sourceUrl']), _0x382880['ownerRefs']['clear']());
    }
  })();
}
export async function acquireLocalAudioPlaybackObjectUrl(_0x18aff4, _0x16b581, { timeout: _0x5d9030 } = {}) {
  const _0x22137a = resolveCanonicalLocalSource(_0x18aff4),
    _0x1fd4d3 = String(_0x16b581 || '')['trim']();
  if (!_0x22137a || !_0x1fd4d3) return '';
  let _0x4cdb90 = entriesBySource['get'](_0x22137a);
  !_0x4cdb90 &&
    ((_0x4cdb90 = {
      sourceUrl: _0x22137a,
      firstOwnerId: _0x1fd4d3,
      ownerRefs: new Set(),
      controller: new AbortController(),
      objectUrl: '',
      promise: null,
    }),
    entriesBySource['set'](_0x22137a, _0x4cdb90),
    (_0x4cdb90['promise'] = startSharedFetch(_0x4cdb90, _0x5d9030)));
  _0x4cdb90['ownerRefs']['add'](_0x1fd4d3);
  const _0x21404e = await _0x4cdb90['promise'];
  return _0x4cdb90['ownerRefs']['has'](_0x1fd4d3) ? _0x21404e : '';
}
export function releaseLocalAudioPlaybackObjectUrl(_0x11207d, _0x5ebdf6) {
  const _0x19d74f = resolveCanonicalLocalSource(_0x11207d),
    _0x2f265c = String(_0x5ebdf6 || '')['trim'](),
    _0x50bb05 = _0x19d74f ? entriesBySource['get'](_0x19d74f) : null;
  if (!_0x50bb05 || !_0x2f265c || !_0x50bb05['ownerRefs']['has'](_0x2f265c)) return ![];
  return (
    _0x50bb05['ownerRefs']['delete'](_0x2f265c),
    countOwnerRefs(_0x50bb05) === 0x0 && (entriesBySource['delete'](_0x19d74f), disposeEntry(_0x50bb05)),
    !![]
  );
}
export const __localAudioPlaybackObjectUrlServiceForTest = {
  clear() {
    for (const _0x4bfb94 of entriesBySource['values']()) disposeEntry(_0x4bfb94);
    entriesBySource['clear']();
  },
  snapshot() {
    return Array['from'](entriesBySource['values']())['map']((_0x2e2480) => ({
      sourceUrl: _0x2e2480['sourceUrl'],
      objectUrl: _0x2e2480['objectUrl'],
      totalRefs: countOwnerRefs(_0x2e2480),
      ownerRefs: Object['fromEntries'](
        Array['from'](_0x2e2480['ownerRefs'], (_0x172487) => [_0x172487, 0x1]),
      ),
      aborted: _0x2e2480['controller']['signal']['aborted'],
    }));
  },
};

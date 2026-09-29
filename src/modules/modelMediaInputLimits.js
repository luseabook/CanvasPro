const MEDIA_KINDS = Object['freeze'](['image', 'video', 'audio']);
export const SEEDANCE2_INPUT_MAX_BY_KIND = Object['freeze']({ image: 0x9, video: 0x3, audio: 0x3 });
export const SEEDANCE25_INPUT_MAX_BY_KIND = Object['freeze']({ image: 0x1e, video: 0xa, audio: 0xa });
export const SEEDANCE2_MAX_TOTAL_DURATION_SECONDS_BY_KIND = Object['freeze']({ video: 15.09, audio: 0xf });
export const SEEDANCE25_MAX_TOTAL_DURATION_SECONDS_BY_KIND = Object['freeze']({ video: 0x1e, audio: 0x1e });
function normalizeUrl(_0x3475b3) {
  return String(_0x3475b3 || '')['trim']();
}
function normalizeDurationSeconds(..._0x9adf67) {
  for (const _0x34bb9c of _0x9adf67) {
    const _0x3b6fca = Number(_0x34bb9c);
    if (Number['isFinite'](_0x3b6fca) && _0x3b6fca > 0x0) return _0x3b6fca;
  }
  return 0x0;
}
function normalizeSizeBytes(..._0x46c1dc) {
  for (const _0x380a54 of _0x46c1dc) {
    const _0x5e9d7c = Number(_0x380a54);
    if (Number['isFinite'](_0x5e9d7c) && _0x5e9d7c > 0x0) return _0x5e9d7c;
  }
  return 0x0;
}
function collectUniqueUrls(_0x1e37f2 = []) {
  return Array['from'](
    new Set((Array['isArray'](_0x1e37f2) ? _0x1e37f2 : [])['map'](normalizeUrl)['filter'](Boolean)),
  );
}
function collectMediaStats(_0x40cc0a = [], _0xf97dd3 = []) {
  const _0x35e417 = new Map(
    collectUniqueUrls(_0x40cc0a)['map']((_0x3cf32b) => [
      _0x3cf32b,
      { url: _0x3cf32b, duration: 0x0, sizeBytes: 0x0 },
    ]),
  );
  for (const _0x3477f5 of Array['isArray'](_0xf97dd3) ? _0xf97dd3 : []) {
    const _0x190bb5 = normalizeUrl(_0x3477f5?.['url']);
    if (!_0x190bb5) continue;
    const _0x3799e0 = normalizeDurationSeconds(
        _0x3477f5?.['duration'],
        _0x3477f5?.['durationSeconds'],
        _0x3477f5?.['videoDuration'],
        _0x3477f5?.['audioDuration'],
      ),
      _0x1cfd3c = normalizeSizeBytes(
        _0x3477f5?.['sizeBytes'],
        _0x3477f5?.['fileSize'],
        _0x3477f5?.['byteSize'],
      ),
      _0x325cf8 = _0x35e417['get'](_0x190bb5) || { url: _0x190bb5, duration: 0x0, sizeBytes: 0x0 };
    _0x35e417['set'](_0x190bb5, {
      url: _0x190bb5,
      duration: Math['max'](_0x325cf8['duration'], _0x3799e0),
      sizeBytes: Math['max'](_0x325cf8['sizeBytes'], _0x1cfd3c),
    });
  }
  const _0x2c672d = Array['from'](_0x35e417['values']())['map'](Object['freeze']);
  return Object['freeze']({
    count: _0x2c672d['length'],
    totalDurationSeconds: _0x2c672d['reduce'](
      (_0x4e135a, _0x68063e) => _0x4e135a + _0x68063e['duration'],
      0x0,
    ),
    entries: Object['freeze'](_0x2c672d),
  });
}
function readPositiveLimit(_0x2e5f2a, _0x2dc67e) {
  const _0x162514 = Number(_0x2e5f2a?.[_0x2dc67e]);
  return Number['isFinite'](_0x162514) && _0x162514 > 0x0 ? _0x162514 : null;
}
function getMediaExtension(_0x20d754) {
  const _0x522508 = normalizeUrl(_0x20d754);
  if (!_0x522508 || _0x522508['startsWith']('data:')) return '';
  const _0x31583a = [_0x522508['split'](/[?#]/, 0x1)[0x0]];
  try {
    const _0x1d1815 = new URL(_0x522508, 'https://local.invalid');
    for (const _0x4d8d9d of _0x1d1815['searchParams']['values']()) _0x31583a['push'](_0x4d8d9d);
  } catch {}
  for (const _0x5086b1 of _0x31583a) {
    let _0x2cea1b = String(_0x5086b1 || '');
    try {
      _0x2cea1b = decodeURIComponent(_0x2cea1b);
    } catch {}
    const _0x43abc1 = _0x2cea1b['toLowerCase']()['match'](/\.([a-z0-9]+)(?:$|[?#])/);
    if (_0x43abc1?.[0x1]) return _0x43abc1[0x1];
  }
  return '';
}
function capitalizeKind(_0x380b8e) {
  return '' + _0x380b8e[0x0]['toUpperCase']() + _0x380b8e['slice'](0x1);
}
export function validateModelMediaInputLimits({
  inputSlots: inputSlots = null,
  images: images = [],
  videos: videos = [],
  audios: audios = [],
  imageEntries: imageEntries = [],
  videoEntries: videoEntries = [],
  audioEntries: audioEntries = [],
  outputDurationSeconds: outputDurationSeconds = 0x0,
} = {}) {
  const _0x5d3f7a = {
      image: collectMediaStats(images, imageEntries),
      video: collectMediaStats(videos, videoEntries),
      audio: collectMediaStats(audios, audioEntries),
    },
    _0x37eb1d = inputSlots?.['maxByKind'];
  for (const _0x2ff84f of MEDIA_KINDS) {
    const _0x43d40b = readPositiveLimit(_0x37eb1d, _0x2ff84f),
      _0x181eaf = _0x5d3f7a[_0x2ff84f]['count'];
    if (_0x43d40b !== null && _0x181eaf > _0x43d40b)
      return Object['freeze']({
        ok: ![],
        code: 'max' + _0x2ff84f[0x0]['toUpperCase']() + _0x2ff84f['slice'](0x1) + 's',
        kind: _0x2ff84f,
        max: _0x43d40b,
        actual: _0x181eaf,
      });
  }
  const _0x326625 = inputSlots?.['mediaConstraintsByKind'] || {};
  for (const _0x5e4177 of MEDIA_KINDS) {
    const _0x565aa2 = _0x326625?.[_0x5e4177];
    if (!_0x565aa2 || typeof _0x565aa2 !== 'object') continue;
    const _0x1df634 = new Set(
        (Array['isArray'](_0x565aa2['allowedExtensions']) ? _0x565aa2['allowedExtensions'] : [])
          ['map']((_0x4470e3) =>
            String(_0x4470e3 || '')
              ['trim']()
              ['toLowerCase']()
              ['replace'](/^\./, ''),
          )
          ['filter'](Boolean),
      ),
      _0xd3e122 = Number(_0x565aa2['minDurationSeconds']),
      _0x47d828 = Number(_0x565aa2['maxDurationSeconds']),
      _0x1212bc = Number(_0x565aa2['maxBytes']);
    for (const _0x3387bf of _0x5d3f7a[_0x5e4177]['entries']) {
      if (
        Number['isFinite'](_0xd3e122) &&
        _0xd3e122 > 0x0 &&
        _0x3387bf['duration'] > 0x0 &&
        _0x3387bf['duration'] < _0xd3e122
      )
        return Object['freeze']({
          ok: ![],
          code: 'min' + capitalizeKind(_0x5e4177) + 'Seconds',
          kind: _0x5e4177,
          min: _0xd3e122,
          actual: _0x3387bf['duration'],
          url: _0x3387bf['url'],
        });
      if (Number['isFinite'](_0x47d828) && _0x47d828 > 0x0 && _0x3387bf['duration'] > _0x47d828)
        return Object['freeze']({
          ok: ![],
          code: 'max' + capitalizeKind(_0x5e4177) + 'Seconds',
          kind: _0x5e4177,
          max: _0x47d828,
          actual: _0x3387bf['duration'],
          url: _0x3387bf['url'],
        });
      const _0x100b5a = getMediaExtension(_0x3387bf['url']);
      if (_0x1df634['size'] > 0x0 && _0x100b5a && !_0x1df634['has'](_0x100b5a))
        return Object['freeze']({
          ok: ![],
          code: 'invalid' + capitalizeKind(_0x5e4177) + 'Extension',
          kind: _0x5e4177,
          actual: _0x100b5a,
          allowed: Array['from'](_0x1df634)['join'](',\x20'),
          url: _0x3387bf['url'],
        });
      if (Number['isFinite'](_0x1212bc) && _0x1212bc > 0x0 && _0x3387bf['sizeBytes'] > _0x1212bc)
        return Object['freeze']({
          ok: ![],
          code: 'max' + capitalizeKind(_0x5e4177) + 'Megabytes',
          kind: _0x5e4177,
          max: _0x1212bc / (0x400 * 0x400),
          actual: _0x3387bf['sizeBytes'] / (0x400 * 0x400),
          url: _0x3387bf['url'],
        });
    }
  }
  const _0x58e7ef = inputSlots?.['maxTotalDurationSecondsByKind'];
  for (const _0xe99888 of ['video', 'audio']) {
    const _0x3bbcb3 = readPositiveLimit(_0x58e7ef, _0xe99888),
      _0xaeacc0 = _0x5d3f7a[_0xe99888]['totalDurationSeconds'];
    if (_0x3bbcb3 !== null && _0xaeacc0 > _0x3bbcb3)
      return Object['freeze']({
        ok: ![],
        code: 'maxTotal' + _0xe99888[0x0]['toUpperCase']() + _0xe99888['slice'](0x1) + 'Seconds',
        kind: _0xe99888,
        max: _0x3bbcb3,
        actual: _0xaeacc0,
      });
  }
  const _0x33990e = Number(inputSlots?.['maxVideoInputAndOutputDurationSeconds']),
    _0x27a5ec = Number(outputDurationSeconds),
    _0x4f285c = _0x5d3f7a['video']['totalDurationSeconds'] + Math['max'](0x0, _0x27a5ec || 0x0);
  if (_0x33990e > 0x0 && _0x27a5ec > 0x0 && _0x4f285c > _0x33990e)
    return Object['freeze']({
      ok: ![],
      code: 'maxVideoInputAndOutputSeconds',
      kind: 'video',
      max: _0x33990e,
      actual: _0x4f285c,
    });
  return Object['freeze']({ ok: !![], statsByKind: Object['freeze'](_0x5d3f7a) });
}

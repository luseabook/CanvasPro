export const STORY_MAX_SPOKEN_UNITS_PER_SECOND = 0x4;
function normalizeText(_0x28d2ff) {
  return String(_0x28d2ff || '')['trim']();
}
function getSpeakerParts(_0x42094c = '') {
  const _0x5701ab = String(_0x42094c || '')['match'](/^([^：:\n]{1,20}[：:]\s*)([\s\S]*)$/u);
  return { prefix: _0x5701ab?.[0x1] || '', body: _0x5701ab?.[0x2] ?? String(_0x42094c || '') };
}
export function countStorySpokenUnits(_0x3c2f02 = '') {
  const _0x28304d = String(_0x3c2f02 || '')
      ['split'](/\r?\n/u)
      ['map']((_0x3994b1) => getSpeakerParts(_0x3994b1)['body'])
      ['join']('\x0a'),
    _0x20f6b7 = (_0x28304d['match'](/[\p{Script=Han}]/gu) || [])['length'],
    _0x14fa56 = (_0x28304d['match'](/[\p{Script=Latin}\p{N}]+(?:['’][\p{Script=Latin}\p{N}]+)*/gu) || [])[
      'length'
    ];
  return _0x20f6b7 + _0x14fa56;
}
function splitAtAuthoredPauses(_0x291d8d = '') {
  const _0x4cd022 = [...String(_0x291d8d || '')],
    _0x15c9d5 = [];
  let _0x510912 = '';
  for (let _0x4a8908 = 0x0; _0x4a8908 < _0x4cd022['length']; _0x4a8908 += 0x1) {
    const _0xd5ca9d = _0x4cd022[_0x4a8908];
    _0x510912 += _0xd5ca9d;
    const _0x5752d9 =
      /[。！？!?；;，,]/u['test'](_0xd5ca9d) ||
      (_0xd5ca9d === '…' && _0x4cd022[_0x4a8908 + 0x1] !== '…') ||
      (_0xd5ca9d === '—' && _0x4cd022[_0x4a8908 + 0x1] !== '—');
    _0x5752d9 && _0x510912['trim']() && (_0x15c9d5['push'](_0x510912), (_0x510912 = ''));
  }
  if (_0x510912['trim']()) _0x15c9d5['push'](_0x510912);
  return _0x15c9d5['length'] ? _0x15c9d5 : [String(_0x291d8d || '')];
}
function hardSplitSpokenPart(_0x3ab62e, _0x41d23e) {
  const _0x4a37f2 = [];
  let _0x482555 = '';
  const _0x3844ca =
    String(_0x3ab62e || '')['match'](/[\p{Script=Latin}\p{N}]+(?:['’][\p{Script=Latin}\p{N}]+)*|[\s\S]/gu) ||
    [];
  for (const _0x4917d4 of _0x3844ca) {
    const _0x44e7b = '' + _0x482555 + _0x4917d4;
    _0x482555 && countStorySpokenUnits(_0x44e7b) > _0x41d23e
      ? (_0x4a37f2['push'](_0x482555), (_0x482555 = _0x4917d4))
      : (_0x482555 = _0x44e7b);
  }
  if (_0x482555) _0x4a37f2['push'](_0x482555);
  return _0x4a37f2;
}
function splitSpokenLine(_0xd88775, _0x25cc88) {
  const { prefix: _0x10ca18, body: _0xc43f98 } = getSpeakerParts(_0xd88775),
    _0x4837dc = splitAtAuthoredPauses(_0xc43f98)['flatMap']((_0x1fa4ed) =>
      countStorySpokenUnits(_0x1fa4ed) > _0x25cc88 ? hardSplitSpokenPart(_0x1fa4ed, _0x25cc88) : [_0x1fa4ed],
    ),
    _0x32b632 = [];
  let _0xe52d30 = '';
  _0x4837dc['forEach']((_0x33af2e) => {
    const _0xae9b06 = '' + _0xe52d30 + _0x33af2e;
    _0xe52d30 && countStorySpokenUnits(_0xae9b06) > _0x25cc88
      ? (_0x32b632['push'](_0xe52d30), (_0xe52d30 = _0x33af2e))
      : (_0xe52d30 = _0xae9b06);
  });
  if (_0xe52d30) _0x32b632['push'](_0xe52d30);
  return _0x32b632['map']((_0x131102) => '' + _0x10ca18 + _0x131102);
}
function splitSpokenText(_0x33702c, _0x3c866a) {
  return String(_0x33702c || '')
    ['split'](/\r?\n/u)
    ['map']((_0xb86e44) => _0xb86e44['trim']())
    ['filter'](Boolean)
    ['flatMap']((_0x27fc5f) => splitSpokenLine(_0x27fc5f, _0x3c866a));
}
function splitImpossibleSpokenShot(
  _0x122b84 = {},
  { maxClipDurationSeconds: _0x538244, maxSpokenUnitsPerSecond: _0x57b290 },
) {
  const _0x512323 = Math['max'](0x0, Number(_0x122b84?.['durationSec']) || 0x0),
    _0x400e2f = ['dialogue', 'voiceover']['filter']((_0x5e6b82) => normalizeText(_0x122b84?.[_0x5e6b82]));
  if (_0x400e2f['length'] !== 0x1 || !_0x512323) return [_0x122b84];
  const _0xa0353e = _0x400e2f[0x0],
    _0x3c108d = countStorySpokenUnits(_0x122b84[_0xa0353e]);
  if (_0x3c108d < 0x8 || _0x3c108d / _0x512323 <= _0x57b290) return [_0x122b84];
  const _0x190f7b = Math['max'](0x1, Math['floor'](_0x538244 * _0x57b290)),
    _0x3cd4f9 = splitSpokenText(_0x122b84[_0xa0353e], _0x190f7b)['filter'](normalizeText);
  if (!_0x3cd4f9['length']) return [_0x122b84];
  return _0x3cd4f9['map']((_0x423e23) => ({
    ..._0x122b84,
    durationSec: Math['max'](0x1, Math['ceil'](countStorySpokenUnits(_0x423e23) / _0x57b290)),
    [_0xa0353e]: _0x423e23,
  }));
}
function finalizeClipShots(_0x5b16db = []) {
  let _0x3cda0e = 0x0;
  return _0x5b16db['map']((_0x1cddb8) => {
    const _0x20e1b2 = Math['max'](0x0, Number(_0x1cddb8?.['durationSec']) || 0x0),
      _0x5549d1 =
        Object['hasOwn'](_0x1cddb8 || {}, 'startSec') || Object['hasOwn'](_0x1cddb8 || {}, 'endSec'),
      _0x213f01 = _0x5549d1
        ? { ..._0x1cddb8, startSec: _0x3cda0e, endSec: _0x3cda0e + _0x20e1b2 }
        : _0x1cddb8;
    return ((_0x3cda0e += _0x20e1b2), _0x213f01);
  });
}
function buildTimedClip(_0x4ace97, _0x2166f5, _0x2541d6) {
  const _0x275ace = finalizeClipShots(_0x2166f5),
    _0x27ffbd = _0x275ace['reduce'](
      (_0x3029ef, _0x3a34d6) => _0x3029ef + Math['max'](0x0, Number(_0x3a34d6?.['durationSec']) || 0x0),
      0x0,
    ),
    _0x56d6a2 = _0x275ace['flatMap']((_0xbff1ec) => [
      normalizeText(_0xbff1ec?.['visual']),
      normalizeText(_0xbff1ec?.['dialogue']),
      normalizeText(_0xbff1ec?.['voiceover']),
    ])
      ['filter'](Boolean)
      ['join']('；');
  return {
    ..._0x4ace97,
    ref: _0x2541d6,
    script: _0x56d6a2 || _0x4ace97['script'],
    shots: _0x275ace,
    durationSec: _0x27ffbd,
    ...(Object['hasOwn'](_0x4ace97 || {}, 'contentDurationSec') ? { contentDurationSec: _0x27ffbd } : {}),
    assetRefs: [...new Set(_0x275ace['flatMap']((_0x2c7df3) => _0x2c7df3?.['assetRefs'] || []))],
  };
}
export function normalizeStoryEpisodeSpokenTiming(
  _0x35a22 = [],
  {
    maxClipDurationSeconds: maxClipDurationSeconds = 0xf,
    maxSpokenUnitsPerSecond: maxSpokenUnitsPerSecond = STORY_MAX_SPOKEN_UNITS_PER_SECOND,
  } = {},
) {
  const _0x147379 = Math['max'](0x1, Number(maxClipDurationSeconds) || 0xf),
    _0x5b86cc = Math['max'](0.1, Number(maxSpokenUnitsPerSecond) || STORY_MAX_SPOKEN_UNITS_PER_SECOND);
  return (Array['isArray'](_0x35a22) ? _0x35a22 : [])['flatMap']((_0x195f51, _0x4e979e) => {
    const _0x1258c0 = Array['isArray'](_0x195f51?.['shots']) ? _0x195f51['shots'] : [],
      _0x258148 = _0x1258c0['flatMap']((_0x6b114e) =>
        splitImpossibleSpokenShot(_0x6b114e, {
          maxClipDurationSeconds: _0x147379,
          maxSpokenUnitsPerSecond: _0x5b86cc,
        }),
      ),
      _0x1ddb2f =
        _0x258148['length'] !== _0x1258c0['length'] ||
        _0x258148['some']((_0x20bf69, _0x5c09a1) => _0x20bf69 !== _0x1258c0[_0x5c09a1]);
    if (!_0x1ddb2f) return [_0x195f51];
    const _0xeba80a = [];
    let _0x3a8cbf = [],
      _0x3f7b01 = 0x0;
    _0x258148['forEach']((_0x577361) => {
      const _0x32cad9 = Math['max'](0x0, Number(_0x577361?.['durationSec']) || 0x0);
      (_0x3a8cbf['length'] &&
        _0x3f7b01 + _0x32cad9 > _0x147379 &&
        (_0xeba80a['push'](_0x3a8cbf), (_0x3a8cbf = []), (_0x3f7b01 = 0x0)),
        _0x3a8cbf['push'](_0x577361),
        (_0x3f7b01 += _0x32cad9));
    });
    if (_0x3a8cbf['length']) _0xeba80a['push'](_0x3a8cbf);
    const _0x4a451d = normalizeText(_0x195f51?.['ref']) || 'clip-' + (_0x4e979e + 0x1);
    return _0xeba80a['map']((_0x230c64, _0x385d25) =>
      buildTimedClip(
        _0x195f51,
        _0x230c64,
        _0xeba80a['length'] === 0x1 ? _0x4a451d : _0x4a451d + '-timing-' + (_0x385d25 + 0x1),
      ),
    );
  });
}

const kinds = ['voiceover', 'dialogue'];
export function getReplicationEventSpeech(_0x4e6faf) {
  const _0x50c1c7 = kinds['flatMap']((_0x26b5ff) =>
    (_0x4e6faf[_0x26b5ff] || [])['map']((_0xafa085, _0x1e9069) => ({
      ..._0xafa085,
      kind: _0x26b5ff,
      key: _0x26b5ff + ':' + _0x1e9069,
    })),
  );
  if (_0x4e6faf['speechOrder']?.['length']) {
    const _0xfdda2a = _0x4e6faf['speechOrder']['map']((_0x429d09) =>
      _0x50c1c7['find']((_0x3db6e1) => _0x3db6e1['key'] === _0x429d09),
    );
    if (
      _0xfdda2a['length'] !== _0x50c1c7['length'] ||
      _0xfdda2a['some']((_0x202c05) => !_0x202c05) ||
      new Set(_0x4e6faf['speechOrder'])['size'] !== _0x50c1c7['length']
    )
      return null;
    return _0xfdda2a;
  }
  if (
    !_0x50c1c7['some']((_0x446a72) => _0x446a72['kind'] === 'dialogue') ||
    !_0x50c1c7['some']((_0x549391) => _0x549391['kind'] === 'voiceover')
  )
    return _0x50c1c7;
  const _0x52d00c = _0x50c1c7['filter']((_0x1ff904) => _0x1ff904['kind'] === 'voiceover'),
    _0x3d1a0e = _0x50c1c7['filter']((_0x5dfcc4) => _0x5dfcc4['kind'] === 'dialogue');
  if (
    _0x52d00c['length'] !== 0x1 ||
    _0x50c1c7['some']((_0x5e6f54) => _0x5e6f54['uncertain'] || !_0x5e6f54['text'])
  )
    return null;
  const _0x393ed0 = [...String(_0x4e6faf['sound'] || '')['matchAll'](/“([^”]+)”/gu)]['flatMap'](
    (_0xfee8e0) => {
      const _0x3f35c5 = _0xfee8e0[0x1],
        _0x3b11cf = _0x3d1a0e['map']((_0x423679) => ({
          part: _0x423679,
          index: _0x3f35c5['indexOf'](_0x423679['text']),
        }));
      if (
        _0x3b11cf['some'](
          ({ part: _0x845814, index: _0xaf6d9a }) =>
            _0xaf6d9a < 0x0 || _0x3f35c5['indexOf'](_0x845814['text'], _0xaf6d9a + 0x1) >= 0x0,
        )
      )
        return [];
      _0x3b11cf['sort']((_0xa7e4a3, _0x1debdd) => _0xa7e4a3['index'] - _0x1debdd['index']);
      const _0x19905a = [];
      let _0x137ea4 = 0x0;
      for (const { part: _0x34feb0, index: _0x32d71a } of _0x3b11cf) {
        if (_0x32d71a < _0x137ea4) return [];
        if (_0x32d71a > _0x137ea4)
          _0x19905a['push']({ ..._0x52d00c[0x0], text: _0x3f35c5['slice'](_0x137ea4, _0x32d71a) });
        (_0x19905a['push'](_0x34feb0), (_0x137ea4 = _0x32d71a + _0x34feb0['text']['length']));
      }
      if (_0x137ea4 < _0x3f35c5['length'])
        _0x19905a['push']({ ..._0x52d00c[0x0], text: _0x3f35c5['slice'](_0x137ea4) });
      return _0x19905a['filter']((_0x50f853) => _0x50f853['kind'] === 'voiceover')
        ['map']((_0x46c3fb) => _0x46c3fb['text'])
        ['join']('') === _0x52d00c[0x0]['text']
        ? [_0x19905a]
        : [];
    },
  );
  return _0x393ed0['length'] === 0x1 ? _0x393ed0[0x0] : null;
}
export function orderReplicationShotSpeech(_0x1d59cd, _0x4f33a6) {
  const _0x5c7421 = _0x1d59cd['map']((_0x587dc5) => ({
    part: _0x587dc5,
    range: findReplicationAsrSpeechRange(_0x4f33a6, _0x587dc5['kind'], _0x587dc5['text']),
  }));
  if (
    _0x5c7421['length'] &&
    _0x5c7421['every'](
      (_0x1f72fc) => _0x1f72fc['range'] && Number['isFinite'](_0x1f72fc['range']['startSec']),
    )
  )
    return _0x5c7421['sort'](
      (_0x4cf770, _0x143067) => _0x4cf770['range']['startSec'] - _0x143067['range']['startSec'],
    )['map']((_0x50982b) => ({ ..._0x50982b['part'] }));
  const _0x27dc66 = _0x4f33a6['map'](getReplicationEventSpeech)['filter'](Boolean);
  if (_0x27dc66['length'] > 0x1) _0x27dc66['push'](_0x27dc66['flat']());
  const _0x4102c2 = _0x27dc66['filter']((_0x4bf3a5) =>
    kinds['every'](
      (_0x5b1dc4) =>
        _0x4bf3a5['filter']((_0xfcd622) => _0xfcd622['kind'] === _0x5b1dc4)
          ['map']((_0xd4e94c) => _0xd4e94c['text'])
          ['join']('') ===
        _0x1d59cd['filter']((_0x15ca65) => _0x15ca65['kind'] === _0x5b1dc4)
          ['map']((_0x3fba86) => _0x3fba86['text'])
          ['join'](''),
    ),
  );
  if (_0x4102c2['length'] !== 0x1) return null;
  const _0x5e2716 = Object['fromEntries'](
      kinds['map']((_0x27d933) => [
        _0x27d933,
        _0x1d59cd['filter']((_0x262fb8) => _0x262fb8['kind'] === _0x27d933)['map']((_0x210ff4) => ({
          ..._0x210ff4,
        })),
      ]),
    ),
    _0x4ab212 = [];
  for (const _0x3f57c4 of _0x4102c2[0x0]) {
    let _0x17d00c = _0x3f57c4['text'];
    while (_0x17d00c) {
      const _0x803141 = _0x5e2716[_0x3f57c4['kind']][0x0];
      if (!_0x803141) return null;
      const _0x3064f7 = Math['min'](_0x17d00c['length'], _0x803141['text']['length']);
      if (_0x17d00c['slice'](0x0, _0x3064f7) !== _0x803141['text']['slice'](0x0, _0x3064f7)) return null;
      (_0x4ab212['push']({ ..._0x803141, text: _0x17d00c['slice'](0x0, _0x3064f7) }),
        (_0x17d00c = _0x17d00c['slice'](_0x3064f7)),
        (_0x803141['text'] = _0x803141['text']['slice'](_0x3064f7)));
      if (!_0x803141['text']) _0x5e2716[_0x3f57c4['kind']]['shift']();
    }
  }
  return _0x4ab212;
}
export function findReplicationAsrSpeechRange(_0x45f089, _0x2d8a12, _0x2c9153) {
  const _0x1ca912 = _0x45f089['flatMap']((_0x3ec0f4) => getReplicationEventSpeech(_0x3ec0f4) || []),
    _0x48b477 = [];
  for (let _0x14435d = 0x0; _0x14435d < _0x1ca912['length']; _0x14435d++) {
    let _0x206d6f = '';
    for (let _0x2673e5 = _0x14435d; _0x2673e5 < _0x1ca912['length']; _0x2673e5++) {
      const _0x36a98a = _0x1ca912[_0x2673e5];
      if (
        _0x36a98a['kind'] !== _0x2d8a12 ||
        _0x36a98a['timingSource'] !== 'asr' ||
        _0x36a98a['speakerId'] !== _0x1ca912[_0x14435d]['speakerId']
      )
        break;
      _0x206d6f += _0x36a98a['text'];
      if (_0x2c9153 && _0x206d6f === _0x2c9153) {
        _0x48b477['push']({ startSec: _0x1ca912[_0x14435d]['startSec'], endSec: _0x36a98a['endSec'] });
        break;
      }
      if (_0x206d6f['length'] >= _0x2c9153['length']) break;
    }
  }
  return _0x48b477['length'] === 0x1 ? _0x48b477[0x0] : null;
}

const text = (_0x44f6dc) => String(_0x44f6dc || '')['trim'](),
  matches = (_0x114ffb, _0x1d6b65) =>
    Boolean(_0x1d6b65) &&
    [_0x114ffb['id'], _0x114ffb['ref'], _0x114ffb['planningRef']]['includes'](_0x1d6b65);
export function completeReplicationScenePropUsages(_0x5b0361, _0x280926) {
  const _0x4935c4 = _0x280926['filter']((_0x59135d) => ['scene', 'prop']['includes'](_0x59135d['kind']));
  return _0x5b0361['map']((_0xb2f4f6) => {
    const _0x23c850 = (_0xb2f4f6['visual'] || '') + '\x20' + (_0xb2f4f6['camera'] || ''),
      _0x151fe7 = [...(_0xb2f4f6['assetUsages'] || [])];
    for (const _0x536508 of _0x4935c4) {
      if (_0x151fe7['some']((_0xadc9c) => matches(_0x536508, _0xadc9c['assetRef']))) continue;
      const _0x3ad1dc = text(_0x536508['name']),
        _0x31ed74 = [_0x3ad1dc, text(_0x536508['replicationSource']?.['name'])];
      for (let _0x574714 = _0x3ad1dc['length'] - 0x1; _0x574714 >= 0x2; _0x574714--) {
        const _0x4be227 = _0x3ad1dc['slice'](-_0x574714);
        if (
          _0x4935c4['filter']((_0x33fdd4) => text(_0x33fdd4['name'])['endsWith'](_0x4be227))['length'] === 0x1
        )
          _0x31ed74['push'](_0x4be227);
      }
      const _0x176ed2 = _0x536508['appearances'] || [];
      if (
        _0x176ed2['length'] !== 0x1 ||
        !_0x31ed74['some']((_0x56000c) => _0x56000c['length'] >= 0x2 && _0x23c850['includes'](_0x56000c))
      )
        continue;
      _0x151fe7['push']({
        assetRef: _0x536508['planningRef'] || _0x536508['ref'] || _0x536508['id'],
        appearanceRef: _0x176ed2[0x0]['planningRef'] || _0x176ed2[0x0]['ref'] || _0x176ed2[0x0]['id'],
      });
    }
    return { ..._0xb2f4f6, assetUsages: _0x151fe7 };
  });
}
export function defineReplicationPromptMaterials(_0x1d8d28, _0x4a78b1, _0x5a47b8, _0x57d9c8 = '') {
  const _0x3d027d = [];
  for (const _0x55671e of _0x5a47b8)
    for (const _0x77d1b6 of _0x55671e['appearances'] || []) {
      const _0x5e7299 = '@' + _0x55671e['name'] + ' · ' + _0x77d1b6['name'],
        _0x3f4eb2 = _0x4a78b1['some']((_0x24ff10) =>
          (_0x24ff10['assetUsages'] || [])['some'](
            (_0x18deb4) =>
              matches(_0x55671e, _0x18deb4['assetRef']) && matches(_0x77d1b6, _0x18deb4['appearanceRef']),
          ),
        );
      if (!_0x3f4eb2 && !_0x1d8d28['includes'](_0x5e7299)) continue;
      const _0x641851 =
          _0x55671e['kind'] === 'character'
            ? _0x55671e['name']
            : (_0x55671e['appearances'] || [])['length'] > 0x1
              ? _0x55671e['name'] + '（' + _0x77d1b6['name'] + '）'
              : _0x55671e['name'],
        _0x4c3ff0 =
          _0x55671e['kind'] === 'character'
            ? '角色'
            : _0x55671e['kind'] === 'scene'
              ? '参考场景'
              : '参考道具',
        _0x301668 = text(_0x77d1b6['description'] || _0x55671e['description'])['replace'](/[。]+$/u, ''),
        _0x5df6f4 =
          _0x55671e['kind'] === 'character'
            ? '将\x20' + _0x5e7299 + ' 中的角色定义为' + _0x641851 + '。'
            : '将\x20' + _0x5e7299 + ' 定义为' + _0x641851 + '的' + _0x4c3ff0 + '。',
        _0x590719 = _0x4a78b1['flatMap']((_0x276be8, _0x3ae8a9) =>
          (_0x276be8['assetUsages'] || [])['some'](
            (_0x4443ca) =>
              matches(_0x55671e, _0x4443ca['assetRef']) && matches(_0x77d1b6, _0x4443ca['appearanceRef']),
          )
            ? [_0x3ae8a9 + 0x1]
            : [],
        ),
        _0x2f3368 =
          _0x55671e['kind'] === 'character' && _0x55671e['appearances']['length'] > 0x1 && _0x590719['length']
            ? '用于第' + _0x590719['join']('、') + '个镜头。'
            : '';
      _0x3d027d['push']({
        mention: _0x5e7299,
        alias: _0x641851,
        line:
          _0x5df6f4 +
          _0x2f3368 +
          (_0x55671e['kind'] !== 'character' && _0x301668 ? '外观与状态：' + _0x301668 + '。' : ''),
      });
    }
  const _0x4cd199 = [..._0x3d027d]['sort'](
      (_0x2a9b87, _0x4e1953) => _0x4e1953['mention']['length'] - _0x2a9b87['mention']['length'],
    ),
    _0x539689 = _0x1d8d28['split']('\x0a')
      ['map']((_0x249f51) =>
        _0x249f51['startsWith']('画面文字：')
          ? _0x249f51
          : _0x249f51['split'](/(“[^”]*”)/u)
              ['map']((_0x832718, _0x15180a) =>
                _0x15180a % 0x2
                  ? _0x832718
                  : _0x4cd199['reduce'](
                      (_0x8e2334, _0x34f004) =>
                        _0x8e2334['split'](_0x34f004['mention'])['join'](_0x34f004['alias']),
                      _0x832718,
                    ),
              )
              ['join'](''),
      )
      ['join']('\x0a'),
    _0x511b61 =
      '按下方分镜描述呈现画面、镜头和声音；人物参考图确定外观，人物位置与持物按具体站位和动作呈现。片段结束站位是已有动作的结果，不额外定格或延长时间；不添加未描述的画面文字或背景音乐。';
  return [
    '【统一风格与约束】',
    ...(text(_0x57d9c8) ? [text(_0x57d9c8)] : []),
    _0x511b61,
    '',
    '【参考素材】',
    ..._0x3d027d['map']((_0x27c14e) => _0x27c14e['line']),
    '',
    '【分镜与声音】',
    _0x539689,
  ]['join']('\x0a');
}

export function collectDirectorKeys(_0x362e2e) {
  return [
    ..._0x362e2e['cameraKeyframes']['map']((_0x5d515c) => ({
      key: _0x5d515c,
      type: 'camera',
      objectId: '',
      property: '',
    })),
    ..._0x362e2e['objectTracks']['flatMap']((_0x3405a6) =>
      ['position', 'rotation', 'scale']['flatMap']((_0x3deb25) =>
        _0x3405a6[_0x3deb25 + 'Keyframes']['map']((_0x580902) => ({
          key: _0x580902,
          type: 'object',
          objectId: _0x3405a6['objectId'],
          property: _0x3deb25,
        })),
      ),
    ),
  ];
}
export function directorKeyIdentity(_0x3af02f) {
  return (
    _0x3af02f['type'] +
    ':' +
    (_0x3af02f['objectId'] || '') +
    ':' +
    (_0x3af02f['property'] || '') +
    ':' +
    (_0x3af02f['key']?.['id'] || _0x3af02f['keyframeId'])
  );
}
export function shiftDirectorKeys(_0x573f5b, _0x574020, _0x2cd960) {
  const _0x4772ba = structuredClone(_0x573f5b),
    _0x50c1d0 = new Set(_0x574020),
    _0x3708e5 = collectDirectorKeys(_0x4772ba),
    _0x3f5f82 = _0x3708e5['filter']((_0x39f52e) => _0x50c1d0['has'](directorKeyIdentity(_0x39f52e)));
  if (!_0x3f5f82['length']) return _0x4772ba;
  const _0x1090ed = Math['round'](Number(_0x2cd960) * _0x4772ba['fps']) / _0x4772ba['fps'];
  if (!Number['isFinite'](_0x1090ed)) throw new Error('请输入有效时间。');
  const _0x241d96 = _0x3f5f82['map'](({ key: _0x213d4c }) => _0x213d4c['time'] + _0x1090ed);
  if (Math['min'](..._0x241d96) < 0x0 || Math['max'](..._0x241d96) > 0xe10)
    throw new Error('移动后关键帧超出 0–3600 秒范围。');
  for (const _0x365adf of _0x3f5f82) {
    if (
      _0x3708e5['some'](
        (_0x30638f) =>
          !_0x50c1d0['has'](directorKeyIdentity(_0x30638f)) &&
          _0x30638f['type'] === _0x365adf['type'] &&
          _0x30638f['objectId'] === _0x365adf['objectId'] &&
          _0x30638f['property'] === _0x365adf['property'] &&
          Math['abs'](_0x30638f['key']['time'] - _0x365adf['key']['time'] - _0x1090ed) <
            0.5 / _0x4772ba['fps'],
      )
    )
      throw new Error('移动后与已有关键帧冲突。');
  }
  return (
    _0x3f5f82['forEach'](({ key: _0x5952cb }) => {
      _0x5952cb['time'] += _0x1090ed;
    }),
    _0x4772ba
  );
}
export function copyDirectorKeys(_0xca0621, _0x33c131) {
  const _0x30d02f = new Set(_0x33c131),
    _0x2ca6d1 = collectDirectorKeys(_0xca0621)['filter']((_0x265c60) =>
      _0x30d02f['has'](directorKeyIdentity(_0x265c60)),
    );
  if (!_0x2ca6d1['length']) return [];
  const _0x597091 = Math['min'](..._0x2ca6d1['map'](({ key: _0x5fa4c2 }) => _0x5fa4c2['time']));
  return _0x2ca6d1['map']((_0x49c464) => ({
    ...structuredClone(_0x49c464),
    key: { ...structuredClone(_0x49c464['key']), time: _0x49c464['key']['time'] - _0x597091 },
  }));
}
export function pasteDirectorKeys(_0x40c8f1, _0x32ae5d, _0x474080) {
  const _0x322351 = structuredClone(_0x40c8f1);
  for (const _0x5eaa30 of _0x32ae5d) {
    const _0x471078 = {
      ...structuredClone(_0x5eaa30['key']),
      id: 'key-' + globalThis['crypto']['randomUUID'](),
      time: Math['round']((_0x5eaa30['key']['time'] + _0x474080) * _0x322351['fps']) / _0x322351['fps'],
    };
    if (_0x471078['time'] < 0x0 || _0x471078['time'] > 0xe10) throw new Error('粘贴超出镜头时长范围。');
    const _0x4f6d18 = _0x322351['objectTracks']['find'](
        (_0x278087) => _0x278087['objectId'] === _0x5eaa30['objectId'],
      ),
      _0x2575c3 =
        _0x5eaa30['type'] === 'camera'
          ? _0x322351['cameraKeyframes']
          : _0x4f6d18?.[_0x5eaa30['property'] + 'Keyframes'];
    if (!_0x2575c3) throw new Error('粘贴目标轨道已不存在。');
    if (
      _0x2575c3['some'](
        (_0x12e396) => Math['abs'](_0x12e396['time'] - _0x471078['time']) < 0.5 / _0x322351['fps'],
      )
    )
      throw new Error('粘贴位置已有关键帧，请移动播放头。');
    _0x2575c3['push'](_0x471078);
  }
  return _0x322351;
}
export function deleteDirectorKeys(_0x116ea8, _0x2a9c59) {
  const _0x4501fd = structuredClone(_0x116ea8),
    _0x283bd1 = new Set(_0x2a9c59);
  for (const _0x4db3ed of collectDirectorKeys(_0x4501fd)) {
    if (!_0x283bd1['has'](directorKeyIdentity(_0x4db3ed))) continue;
    const _0x27d531 =
      _0x4db3ed['type'] === 'camera'
        ? _0x4501fd['cameraKeyframes']
        : _0x4501fd['objectTracks']['find']((_0x2b5ce6) => _0x2b5ce6['objectId'] === _0x4db3ed['objectId'])[
            _0x4db3ed['property'] + 'Keyframes'
          ];
    if (_0x4db3ed['type'] === 'camera' && _0x27d531['length'] <= 0x1)
      throw new Error('至少保留一个摄像机关键帧。');
    _0x27d531['splice'](
      _0x27d531['findIndex']((_0x1dc831) => _0x1dc831['id'] === _0x4db3ed['key']['id']),
      0x1,
    );
  }
  return _0x4501fd;
}
export function directorSnapTime(_0x586f5c, _0x2335d6, _0x47918b = 0x0, _0x2c1317 = []) {
  const _0x5c282c = Math['round'](_0x586f5c * _0x2335d6['fps']) / _0x2335d6['fps'],
    _0x19e9b0 = new Set(_0x2c1317),
    _0x1793f3 = [
      0x0,
      _0x2335d6['duration'],
      ...collectDirectorKeys(_0x2335d6)
        ['filter']((_0x23170b) => !_0x19e9b0['has'](_0x23170b['key']['id']))
        ['map'](({ key: _0x4cdfa4 }) => _0x4cdfa4['time']),
      ...[..._0x2335d6['actionClips'], ...(_0x2335d6['motionClips'] || [])]['flatMap']((_0x19f335) => [
        _0x19f335['start'],
        _0x19f335['end'],
      ]),
    ],
    _0x40512f = _0x1793f3['reduce'](
      (_0x368e88, _0x1c3b93) =>
        Math['abs'](_0x1c3b93 - _0x5c282c) < Math['abs'](_0x368e88 - _0x5c282c) ? _0x1c3b93 : _0x368e88,
      _0x5c282c + _0x47918b + 0x1,
    );
  return Math['abs'](_0x40512f - _0x5c282c) <= _0x47918b ? _0x40512f : _0x5c282c;
}

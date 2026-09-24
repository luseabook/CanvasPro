import { collectDirectorKeys } from './directorTimelineOperations.js';
const finite = (_0x33b00f, _0x2da2c2) =>
  Number['isFinite'](Number(_0x33b00f)) ? Number(_0x33b00f) : _0x2da2c2;
export function normalizeDirectorClips(_0x1ea59b, _0x121207) {
  const _0xcbbea5 = collectDirectorKeys(_0x121207),
    _0x328b0b = new Set(_0xcbbea5['map'](({ key: _0x55e2c9 }) => _0x55e2c9['id'])),
    _0x18f4f0 = new Set();
  return (Array['isArray'](_0x1ea59b) ? _0x1ea59b : [])
    ['slice'](0x0, 0x12c)
    ['map']((_0x565b59, _0x1c4410) => {
      const _0x3f5365 = [
        ...new Set(Array['isArray'](_0x565b59?.['keyframeIds']) ? _0x565b59['keyframeIds'] : []),
      ]['filter']((_0xf49de2) => _0x328b0b['has'](_0xf49de2) && !_0x18f4f0['has'](_0xf49de2));
      if (!_0x3f5365['length']) return null;
      _0x3f5365['forEach']((_0x3451f2) => _0x18f4f0['add'](_0x3451f2));
      const _0x42da68 = _0xcbbea5['filter'](({ key: _0x368708 }) => _0x3f5365['includes'](_0x368708['id'])),
        _0x274bdd = Math['max'](
          0x0,
          Math['min'](
            3599.9,
            finite(
              _0x565b59['start'],
              Math['min'](..._0x42da68['map'](({ key: _0x28fc41 }) => _0x28fc41['time'])),
            ),
          ),
        );
      return {
        id: String(_0x565b59['id'] || 'motion-clip-' + _0x1c4410),
        name: String(_0x565b59['name'] || '运动片段')['slice'](0x0, 0x78),
        keyframeIds: _0x3f5365,
        start: _0x274bdd,
        end: Math['max'](
          _0x274bdd + 0.1,
          Math['min'](
            0xe10,
            finite(
              _0x565b59['end'],
              Math['max'](..._0x42da68['map'](({ key: _0x3cf1b9 }) => _0x3cf1b9['time'])),
            ),
          ),
        ),
      };
    })
    ['filter'](Boolean)
    ['sort'](
      (_0x4d68e3, _0x1b3723) =>
        _0x4d68e3['start'] - _0x1b3723['start'] || _0x4d68e3['id']['localeCompare'](_0x1b3723['id']),
    );
}
export function resolveDirectorClipSample(_0x38abfb, _0x3e05f0, _0x54874f) {
  const _0x5d5454 = new Set(_0x3e05f0['map']((_0x36d9e0) => _0x36d9e0['id'])),
    _0x296883 = (_0x38abfb || [])['filter']((_0x207355) =>
      _0x207355['keyframeIds']['some']((_0x192d80) => _0x5d5454['has'](_0x192d80)),
    );
  if (!_0x296883['length']) return { keys: _0x3e05f0, time: _0x54874f };
  const _0x330df8 = new Set(_0x296883['flatMap']((_0xa2d649) => _0xa2d649['keyframeIds'])),
    _0x4a48b6 = _0x296883['filter']((_0x38333d) => _0x38333d['start'] <= _0x54874f)['at'](-0x1);
  if (!_0x4a48b6)
    return { keys: _0x3e05f0['filter']((_0x54d236) => !_0x330df8['has'](_0x54d236['id'])), time: _0x54874f };
  const _0xc69d2a = _0x3e05f0['filter'](
    (_0x2a3700) => !_0x330df8['has'](_0x2a3700['id']) && _0x2a3700['time'] > _0x4a48b6['end'],
  );
  if (_0x54874f >= _0x4a48b6['end'] && _0xc69d2a['length'] && _0x54874f >= _0xc69d2a[0x0]['time'])
    return { keys: _0xc69d2a, time: _0x54874f };
  const _0x25a38e = new Set(_0x4a48b6['keyframeIds']);
  return {
    keys: _0x3e05f0['filter']((_0x25b651) => _0x25a38e['has'](_0x25b651['id'])),
    time: Math['min'](_0x54874f, _0x4a48b6['end']),
  };
}
export function createDirectorClip(_0x55294e, _0x14fc43, _0x47788d = '运动片段') {
  const _0x2af37c = new Set(_0x14fc43),
    _0x444d51 = collectDirectorKeys(_0x55294e)['filter'](({ key: _0x34e33c }) =>
      _0x2af37c['has'](_0x34e33c['id']),
    );
  if (!_0x444d51['length']) throw new Error('请先选择关键帧或创建轨迹。');
  if (
    (_0x55294e['motionClips'] || [])['some']((_0x50bc5c) =>
      _0x50bc5c['keyframeIds']['some']((_0x48e044) => _0x2af37c['has'](_0x48e044)),
    )
  )
    throw new Error('选中关键帧已属于运动片段，请编辑或复制原片段。');
  const _0x5a9709 = structuredClone(_0x55294e),
    _0x53d6ab = Math['min'](..._0x444d51['map'](({ key: _0x2d176d }) => _0x2d176d['time'])),
    _0x5aaa07 = Math['max'](..._0x444d51['map'](({ key: _0x13bc87 }) => _0x13bc87['time']));
  return (
    (_0x5a9709['motionClips'] = [
      ...(_0x5a9709['motionClips'] || []),
      {
        id: 'motion-' + globalThis['crypto']['randomUUID'](),
        name: _0x47788d,
        keyframeIds: [..._0x2af37c],
        start: _0x53d6ab,
        end: Math['max'](_0x53d6ab + 0.1, _0x5aaa07),
      },
    ]),
    _0x5a9709
  );
}
export function editDirectorClip(
  _0x32f2cd,
  { kind: _0x561880, id: _0x1d6876, start: _0x5ede74, end: _0x3f46d6, move: move = ![] },
) {
  const _0x14503b = structuredClone(_0x32f2cd),
    _0x237910 = (_0x561880 === 'action' ? _0x14503b['actionClips'] : _0x14503b['motionClips'])?.['find'](
      (_0x4489f9) => _0x4489f9['id'] === _0x1d6876,
    );
  if (!_0x237910) return _0x14503b;
  const _0x38ea76 = Math['round'](Number(_0x5ede74) * _0x14503b['fps']) / _0x14503b['fps'],
    _0x2c2c67 = Math['round'](Number(_0x3f46d6) * _0x14503b['fps']) / _0x14503b['fps'];
  if (
    !Number['isFinite'](_0x38ea76) ||
    !Number['isFinite'](_0x2c2c67) ||
    _0x38ea76 < 0x0 ||
    _0x2c2c67 > 0xe10 ||
    _0x2c2c67 - _0x38ea76 < 0x1 / _0x14503b['fps']
  )
    throw new Error('片段范围必须在 0–3600 秒内且至少一帧。');
  if (_0x561880 === 'action' && !move) {
    const _0x1c281c = _0x237910['offset'] + (_0x38ea76 - _0x237910['start']) * _0x237910['speed'];
    if (_0x1c281c < 0x0) throw new Error('无法向前扩展到动作源起点之前。');
    _0x237910['offset'] = _0x1c281c;
  }
  if (_0x561880 === 'motion' && move) {
    const _0x397d99 = _0x38ea76 - _0x237910['start'],
      _0x2faadf = new Set(_0x237910['keyframeIds']),
      _0x338135 = collectDirectorKeys(_0x14503b)['filter'](({ key: _0x58d7a0 }) =>
        _0x2faadf['has'](_0x58d7a0['id']),
      );
    if (
      _0x338135['some'](
        ({ key: _0x56aacd }) => _0x56aacd['time'] + _0x397d99 < 0x0 || _0x56aacd['time'] + _0x397d99 > 0xe10,
      )
    )
      throw new Error('移动后源关键帧超出范围。');
    _0x338135['forEach'](({ key: _0x3a6b6a }) => {
      _0x3a6b6a['time'] += _0x397d99;
    });
  }
  return ((_0x237910['start'] = _0x38ea76), (_0x237910['end'] = _0x2c2c67), _0x14503b);
}
export function duplicateDirectorClip(_0x28c4db, _0x2057be, _0x472d41, _0x4ffad2) {
  return pasteDirectorClip(_0x28c4db, copyDirectorClip(_0x28c4db, _0x2057be, _0x472d41), _0x4ffad2);
}
export function copyDirectorClip(_0x4cb34e, _0x520e25, _0xe69ac8) {
  const _0x2bdd06 = (_0x520e25 === 'action' ? _0x4cb34e['actionClips'] : _0x4cb34e['motionClips'])?.['find'](
    (_0x33e05b) => _0x33e05b['id'] === _0xe69ac8,
  );
  if (!_0x2bdd06) throw new Error('片段已不存在。');
  return structuredClone({
    kind: _0x520e25,
    clip: _0x2bdd06,
    entries:
      _0x520e25 === 'motion'
        ? collectDirectorKeys(_0x4cb34e)['filter'](({ key: _0x150330 }) =>
            _0x2bdd06['keyframeIds']['includes'](_0x150330['id']),
          )
        : [],
  });
}
export function pasteDirectorClip(_0x596f58, _0x506d39, _0x5603b9) {
  const _0x329c82 = structuredClone(_0x596f58),
    { kind: _0x3acc01, clip: _0x2b4e24, entries: _0x1e49a8 } = _0x506d39;
  if (!_0x2b4e24) throw new Error('片段已不存在。');
  const _0x4c1ed8 = structuredClone(_0x2b4e24),
    _0x1cb089 = _0x5603b9 - _0x4c1ed8['start'];
  if (_0x5603b9 < 0x0 || _0x4c1ed8['end'] + _0x1cb089 > 0xe10) throw new Error('复制片段超出镜头时长范围。');
  ((_0x4c1ed8['id'] = 'clip-' + globalThis['crypto']['randomUUID']()),
    (_0x4c1ed8['start'] += _0x1cb089),
    (_0x4c1ed8['end'] += _0x1cb089));
  if (_0x3acc01 === 'motion') {
    const _0x417b73 = new Map();
    for (const _0x4dde14 of _0x1e49a8) {
      const _0x5a8003 = {
        ...structuredClone(_0x4dde14['key']),
        id: 'key-' + globalThis['crypto']['randomUUID'](),
        time: _0x4dde14['key']['time'] + _0x1cb089,
      };
      if (_0x5a8003['time'] < 0x0 || _0x5a8003['time'] > 0xe10) throw new Error('源关键帧超出复制范围。');
      _0x417b73['set'](_0x4dde14['key']['id'], _0x5a8003['id']);
      const _0x10e48b = _0x329c82['objectTracks']['find'](
        (_0xf18c51) => _0xf18c51['objectId'] === _0x4dde14['objectId'],
      );
      if (_0x4dde14['type'] !== 'camera' && !_0x10e48b) throw new Error('片段对应物体轨道已不存在。');
      const _0x22e0ec =
        _0x4dde14['type'] === 'camera'
          ? _0x329c82['cameraKeyframes']
          : _0x10e48b[_0x4dde14['property'] + 'Keyframes'];
      _0x22e0ec['push'](_0x5a8003);
    }
    ((_0x4c1ed8['keyframeIds'] = _0x4c1ed8['keyframeIds']['map']((_0x3bfc5b) => _0x417b73['get'](_0x3bfc5b))),
      (_0x329c82['motionClips'] ||= [])['push'](_0x4c1ed8));
  } else _0x329c82['actionClips']['push'](_0x4c1ed8);
  return _0x329c82;
}

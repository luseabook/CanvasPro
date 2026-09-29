import { STORYBOARD_3D_BODY_PRESETS } from './characterRig.js';
const SPATIAL_ROLE_SET = new Set(['character', 'floor', 'seat', 'support', 'table', 'tabletop-item', 'wall']),
  BODY_PRESETS_BY_ID = new Map(
    STORYBOARD_3D_BODY_PRESETS['map']((_0x2038b7) => [_0x2038b7['id'], _0x2038b7]),
  ),
  DEFAULT_FAMILY_BODY_PRESETS = Object['freeze']([
    'adult-male',
    'adult-female',
    'child-male',
    'child-female',
  ]),
  DEFAULT_SPATIAL_METADATA = Object['freeze']({
    dimensions: Object['freeze']({ width: 0x2, height: 0x2, depth: 0x2 }),
    anchor: 'ground',
    roles: Object['freeze']([]),
    supportHeight: 0x0,
    seatHeight: 0x0,
  });
function finite(_0x5edbf9, _0x41b000, _0x1440eb = 0.01, _0x4b90bc = 0x64) {
  const _0x4946d7 = Number(_0x5edbf9);
  return Number['isFinite'](_0x4946d7)
    ? Math['min'](_0x4b90bc, Math['max'](_0x1440eb, _0x4946d7))
    : _0x41b000;
}
function normalizedText(_0x5a9aff) {
  return String(_0x5a9aff || '')['toLocaleLowerCase']();
}
function searchableAssetText(_0x54e428 = {}) {
  return [
    _0x54e428['id'],
    _0x54e428['familyId'],
    _0x54e428['name'],
    _0x54e428['category'],
    ...(Array['isArray'](_0x54e428['tags']) ? _0x54e428['tags'] : []),
    ...(Array['isArray'](_0x54e428['keywords']) ? _0x54e428['keywords'] : []),
  ]
    ['map'](normalizedText)
    ['join']('\x20');
}
function includesAny(_0x1d527f, _0xd6a3c3) {
  return _0xd6a3c3['some']((_0x3eab69) => {
    const _0x1c2f21 = normalizedText(_0x3eab69);
    if (!_0x1c2f21) return ![];
    if (/^[a-z0-9]+$/['test'](_0x1c2f21))
      return new RegExp('(^|[^a-z0-9])' + _0x1c2f21 + '(?=$|[^a-z0-9])')['test'](_0x1d527f);
    return _0x1d527f['includes'](_0x1c2f21);
  });
}
function dimensionsFrom(_0x146585, _0x109958) {
  const _0x124871 = _0x146585 && typeof _0x146585 === 'object' ? _0x146585 : {},
    _0x1962f9 = _0x124871['dimensionsMeters'] || _0x124871['dimensions'] || _0x124871['size'] || _0x124871;
  return {
    width: finite(_0x1962f9?.['width'] ?? _0x1962f9?.['x'], _0x109958['width']),
    height: finite(_0x1962f9?.['height'] ?? _0x1962f9?.['y'], _0x109958['height']),
    depth: finite(_0x1962f9?.['depth'] ?? _0x1962f9?.['z'], _0x109958['depth']),
  };
}
function hasDimensions(_0x16ff4c) {
  const _0x508047 = _0x16ff4c && typeof _0x16ff4c === 'object' ? _0x16ff4c : {},
    _0x5ba318 = _0x508047['dimensionsMeters'] || _0x508047['dimensions'] || _0x508047['size'] || _0x508047;
  return [
    _0x5ba318?.['width'] ?? _0x5ba318?.['x'],
    _0x5ba318?.['height'] ?? _0x5ba318?.['y'],
    _0x5ba318?.['depth'] ?? _0x5ba318?.['z'],
  ]['every']((_0x3c7995) => Number['isFinite'](Number(_0x3c7995)) && Number(_0x3c7995) > 0x0);
}
function measuredDimensions(_0x50ab02 = {}) {
  const _0x298423 = _0x50ab02?.['assetRecord']?.['bounds'] || _0x50ab02?.['normalization']?.['sourceBounds'],
    _0x812edf = _0x298423?.['min'],
    _0x59f872 = _0x298423?.['max'],
    _0x324422 = {
      width: Number(_0x59f872?.['x']) - Number(_0x812edf?.['x']),
      height: Number(_0x59f872?.['y']) - Number(_0x812edf?.['y']),
      depth: Number(_0x59f872?.['z']) - Number(_0x812edf?.['z']),
    };
  if (!Object['values'](_0x324422)['every']((_0x108222) => Number['isFinite'](_0x108222) && _0x108222 > 0x0))
    return null;
  const _0xa42ff6 = finite(
    _0x50ab02?.['assetRecord']?.['defaultScale'] ?? _0x50ab02?.['normalization']?.['uniformScale'],
    0x1,
    0.000001,
    0x3e8,
  );
  return {
    width: finite(_0x324422['width'] * _0xa42ff6, 0x1),
    height: finite(_0x324422['height'] * _0xa42ff6, 0x1),
    depth: finite(_0x324422['depth'] * _0xa42ff6, 0x1),
  };
}
function normalizedRoles(_0x3bb586) {
  return [
    ...new Set(
      (Array['isArray'](_0x3bb586) ? _0x3bb586 : [])
        ['map']((_0x5398db) => String(_0x5398db || '')['trim']())
        ['filter']((_0x225010) => SPATIAL_ROLE_SET['has'](_0x225010)),
    ),
  ];
}
function bodySpatialMetadata(_0x84c34f = {}) {
  const _0x58d3b7 = String(_0x84c34f['id'] || _0x84c34f['familyId'] || _0x84c34f['bodyPresetId'] || '')[
      'trim'
    ](),
    _0x2e40a8 = BODY_PRESETS_BY_ID['get'](_0x58d3b7);
  if (!_0x2e40a8) return null;
  return {
    dimensions: {
      width: Number((0.5 * _0x2e40a8['shoulderScale'])['toFixed'](0x3)),
      height: _0x2e40a8['height'],
      depth: Number((0.38 * _0x2e40a8['depthScale'])['toFixed'](0x3)),
    },
    anchor: 'ground',
    roles: ['character'],
    supportHeight: 0x0,
    seatHeight: 0.45,
  };
}
function inferredSpatialMetadata(_0x3eeefc = {}) {
  const _0x5bfe41 = searchableAssetText(_0x3eeefc),
    _0x43d60e = normalizedText(_0x3eeefc['category']),
    _0x7fbfcf = bodySpatialMetadata(_0x3eeefc);
  if (_0x7fbfcf || _0x43d60e === 'character')
    return (
      _0x7fbfcf || {
        dimensions: { width: 0.52, height: 1.72, depth: 0.4 },
        anchor: 'ground',
        roles: ['character'],
        supportHeight: 0x0,
        seatHeight: 0.45,
      }
    );
  if (
    _0x43d60e !== 'food' &&
    _0x43d60e !== 'tableware' &&
    _0x43d60e !== 'kitchenware' &&
    includesAny(_0x5bfe41, ['tableround', 'round table', '圆桌'])
  )
    return {
      dimensions: { width: 1.2, height: 0.75, depth: 1.2 },
      anchor: 'ground',
      roles: ['table', 'support'],
      supportHeight: 0.75,
      seatHeight: 0x0,
    };
  if (
    _0x43d60e !== 'food' &&
    _0x43d60e !== 'tableware' &&
    _0x43d60e !== 'kitchenware' &&
    includesAny(_0x5bfe41, ['table', 'desk', '餐桌', '书桌', '桌子', '茶几', '吧台'])
  ) {
    const _0x41106e = includesAny(_0x5bfe41, ['coffee', '茶几']);
    return {
      dimensions: _0x41106e
        ? { width: 1.2, height: 0.45, depth: 0.65 }
        : { width: 1.6, height: 0.75, depth: 0.85 },
      anchor: 'ground',
      roles: ['table', 'support'],
      supportHeight: _0x41106e ? 0.45 : 0.75,
      seatHeight: 0x0,
    };
  }
  if (includesAny(_0x5bfe41, ['chair', 'stool', 'seat', '椅', '凳', '座位']))
    return {
      dimensions: { width: 0.5, height: 0.9, depth: 0.52 },
      anchor: 'ground',
      roles: ['seat'],
      supportHeight: 0x0,
      seatHeight: 0.45,
    };
  if (_0x43d60e === 'food' || _0x43d60e === 'tableware' || _0x43d60e === 'kitchenware')
    return {
      dimensions: { width: 0.24, height: 0.12, depth: 0.24 },
      anchor: 'support',
      roles: ['tabletop-item'],
      supportHeight: 0x0,
      seatHeight: 0x0,
    };
  if (includesAny(_0x5bfe41, ['floor', '地板', '地面']))
    return {
      dimensions: { width: 0x4, height: 0.1, depth: 0x4 },
      anchor: 'ground',
      roles: ['floor', 'support'],
      supportHeight: 0.1,
      seatHeight: 0x0,
    };
  if (includesAny(_0x5bfe41, ['wall', '墙', 'window', '窗', 'door', '门']))
    return {
      dimensions: { width: 2.4, height: 2.5, depth: 0.15 },
      anchor: 'ground',
      roles: ['wall'],
      supportHeight: 0x0,
      seatHeight: 0x0,
    };
  return DEFAULT_SPATIAL_METADATA;
}
export function resolveStoryboard3DAssetSpatialMetadata(_0x16feb0 = {}) {
  const _0x310284 = inferredSpatialMetadata(_0x16feb0),
    _0x422056 =
      _0x16feb0?.['spatial'] && typeof _0x16feb0['spatial'] === 'object' ? _0x16feb0['spatial'] : {},
    _0x475ffc = measuredDimensions(_0x16feb0),
    _0x109774 = dimensionsFrom(_0x422056, _0x475ffc || _0x310284['dimensions']),
    _0x79bdc8 = normalizedRoles(_0x422056['roles']);
  return {
    dimensions: _0x109774,
    source: hasDimensions(_0x422056) ? 'provided' : _0x475ffc ? 'measured' : 'semantic',
    anchor: _0x422056['anchor'] === 'support' ? 'support' : _0x310284['anchor'],
    roles: _0x79bdc8['length'] > 0x0 ? _0x79bdc8 : [..._0x310284['roles']],
    supportHeight: finite(_0x422056['supportHeight'], _0x310284['supportHeight'], 0x0, 0x64),
    seatHeight: finite(_0x422056['seatHeight'], _0x310284['seatHeight'], 0x0, 0x64),
  };
}
export function getStoryboard3DAssetSpatialExtent(_0x5892e = {}) {
  const _0x1d6ac6 = resolveStoryboard3DAssetSpatialMetadata(_0x5892e)['dimensions'];
  return Math['max'](_0x1d6ac6['width'], _0x1d6ac6['height'], _0x1d6ac6['depth']);
}
export function describeStoryboard3DAssetSpatialMetadata(_0x3e4293 = {}) {
  const _0x5010db = resolveStoryboard3DAssetSpatialMetadata(_0x3e4293),
    _0x315ee8 = _0x5010db['dimensions'],
    _0x432278 = [
      'size=' +
        _0x315ee8['width']['toFixed'](0x2) +
        'x' +
        _0x315ee8['height']['toFixed'](0x2) +
        'x' +
        _0x315ee8['depth']['toFixed'](0x2) +
        'm',
      'source=' + _0x5010db['source'],
      'anchor=' + _0x5010db['anchor'],
    ];
  if (_0x5010db['roles']['length'] > 0x0) _0x432278['push']('roles=' + _0x5010db['roles']['join'](','));
  if (_0x5010db['supportHeight'] > 0x0)
    _0x432278['push']('supportY=' + _0x5010db['supportHeight']['toFixed'](0x2) + 'm');
  if (_0x5010db['seatHeight'] > 0x0)
    _0x432278['push']('seatY=' + _0x5010db['seatHeight']['toFixed'](0x2) + 'm');
  return _0x432278['join'](';\x20');
}
export function normalizeStoryboard3DGeneratedLayout(_0x5231ac = {}) {
  const _0x42d871 = _0x5231ac && typeof _0x5231ac === 'object' ? _0x5231ac : {},
    _0x17fe5f = _0x42d871['kind'] === 'dining' ? 'dining' : 'generic',
    _0x545c3b = Math['max'](
      0x0,
      Math['min'](0x8, Math['floor'](Number(_0x42d871['participantCount']) || 0x0)),
    );
  return { kind: _0x17fe5f, participantCount: _0x545c3b };
}
function cloneObject(_0x136e1a) {
  return {
    ..._0x136e1a,
    transform: {
      position: [...(_0x136e1a?.['transform']?.['position'] || [0x0, 0x0, 0x0])],
      rotation: [...(_0x136e1a?.['transform']?.['rotation'] || [0x0, 0x0, 0x0])],
      scale: [...(_0x136e1a?.['transform']?.['scale'] || [0x1, 0x1, 0x1])],
    },
  };
}
function assetForObject(_0x2cf7fb, _0x101dd1) {
  if (_0x2cf7fb?.['type'] === 'character') return { id: _0x2cf7fb['bodyPresetId'], category: 'character' };
  return _0x101dd1['get'](_0x2cf7fb?.['assetId']) || null;
}
function hasSpatialRole(_0x454439, _0x1ccb0b) {
  return resolveStoryboard3DAssetSpatialMetadata(_0x454439)['roles']['includes'](_0x1ccb0b);
}
function createGeneratedCharacter(_0x31ba20) {
  return {
    type: 'character',
    name: 'Dining participant ' + (_0x31ba20 + 0x1),
    bodyPresetId: DEFAULT_FAMILY_BODY_PRESETS[_0x31ba20 % DEFAULT_FAMILY_BODY_PRESETS['length']],
    transform: { position: [0x0, 0x0, 0x0], rotation: [0x0, 0x0, 0x0], scale: [0x1, 0x1, 0x1] },
  };
}
function createGeneratedProp(_0x244927, _0x585b6e) {
  return {
    type: 'prop',
    name: _0x585b6e || _0x244927['name'],
    assetId: _0x244927['id'],
    transform: { position: [0x0, 0x0, 0x0], rotation: [0x0, 0x0, 0x0], scale: [0x1, 0x1, 0x1] },
    castShadow: !![],
    receiveShadow: !![],
  };
}
function firstAssetByRole(_0x3b4dae, _0x2abdcc) {
  return (
    (Array['isArray'](_0x3b4dae) ? _0x3b4dae : [])['find']((_0x5289e7) =>
      hasSpatialRole(_0x5289e7, _0x2abdcc),
    ) || null
  );
}
function angleForSlot(_0x95d28, _0x4564de) {
  return -Math['PI'] / 0x2 + (Math['PI'] * 0x2 * _0x95d28) / Math['max'](0x1, _0x4564de);
}
function faceTowards(_0x2ba362, _0x3b8079) {
  return Math['atan2'](_0x2ba362[0x0] - _0x3b8079[0x0], _0x2ba362[0x2] - _0x3b8079[0x2]);
}
export function applyStoryboard3DDiningLayout(
  _0x53ee69 = [],
  { assets: assets = [], participantCount: participantCount = 0x0 } = {},
) {
  const _0x41e8d4 = (Array['isArray'](_0x53ee69) ? _0x53ee69 : [])['map'](cloneObject),
    _0x5f486e = new Map(
      (Array['isArray'](assets) ? assets : [])
        ['filter']((_0x1aa82b) => _0x1aa82b?.['id'])
        ['map']((_0x33e55f) => [_0x33e55f['id'], _0x33e55f]),
    );
  let _0xb0a4c2 = _0x41e8d4['find']((_0x5489aa) =>
    hasSpatialRole(assetForObject(_0x5489aa, _0x5f486e), 'table'),
  );
  const _0xa81e79 = Math['max'](0x0, Math['min'](0x8, Math['floor'](Number(participantCount) || 0x0)));
  let _0x4bd872 = _0x41e8d4['filter']((_0x59b714) => _0x59b714['type'] === 'character');
  const _0xcf04a7 = Math['max'](_0xa81e79, _0x4bd872['length']);
  if (!_0xb0a4c2 && _0xcf04a7 > 0x0) {
    const _0xdf342b = firstAssetByRole(assets, 'table');
    _0xdf342b &&
      ((_0xb0a4c2 = createGeneratedProp(_0xdf342b, 'Dining\x20table')), _0x41e8d4['push'](_0xb0a4c2));
  }
  if (!_0xb0a4c2 || _0xcf04a7 === 0x0)
    return { objects: _0x41e8d4, applied: ![], participantCount: _0xcf04a7 };
  while (_0x4bd872['length'] < _0xcf04a7) {
    const _0x5c6961 = createGeneratedCharacter(_0x4bd872['length']);
    (_0x41e8d4['push'](_0x5c6961), _0x4bd872['push'](_0x5c6961));
  }
  let _0x1e1df3 = _0x41e8d4['filter']((_0x1bb491) =>
    hasSpatialRole(assetForObject(_0x1bb491, _0x5f486e), 'seat'),
  );
  const _0xbf9996 = firstAssetByRole(assets, 'seat');
  while (_0x1e1df3['length'] < _0x4bd872['length'] && _0xbf9996) {
    const _0x1de271 = createGeneratedProp(_0xbf9996, 'Dining chair');
    (_0x41e8d4['push'](_0x1de271), _0x1e1df3['push'](_0x1de271));
  }
  const _0x2ef688 = resolveStoryboard3DAssetSpatialMetadata(assetForObject(_0xb0a4c2, _0x5f486e)),
    _0x533ce2 = _0xb0a4c2['transform']['position'];
  _0x533ce2[0x1] = 0x0;
  const _0x25dc3f = _0x2ef688['dimensions']['width'] / 0x2 + 0.6,
    _0x3f7905 = _0x2ef688['dimensions']['depth'] / 0x2 + 0.6,
    _0x9edbac = Math['min'](_0x1e1df3['length'], _0x4bd872['length']);
  for (let _0x34de14 = 0x0; _0x34de14 < _0x9edbac; _0x34de14 += 0x1) {
    const _0x14c65b = angleForSlot(_0x34de14, _0x9edbac),
      _0x36ba6a = [
        _0x533ce2[0x0] + Math['cos'](_0x14c65b) * _0x25dc3f,
        0x0,
        _0x533ce2[0x2] + Math['sin'](_0x14c65b) * _0x3f7905,
      ],
      _0x288b0a = faceTowards(_0x533ce2, _0x36ba6a),
      _0x1b1de4 = _0x1e1df3[_0x34de14];
    ((_0x1b1de4['transform']['position'] = _0x36ba6a), (_0x1b1de4['transform']['rotation'][0x1] = _0x288b0a));
    const _0x1c4911 = _0x4bd872[_0x34de14],
      _0x20a6fc = resolveStoryboard3DAssetSpatialMetadata(assetForObject(_0x1b1de4, _0x5f486e));
    ((_0x1c4911['transform']['position'] = [_0x36ba6a[0x0], _0x20a6fc['seatHeight'], _0x36ba6a[0x2]]),
      (_0x1c4911['transform']['rotation'][0x1] = _0x288b0a),
      (_0x1c4911['actionId'] = 'seated'),
      (_0x1c4911['actionPlaying'] = ![]));
  }
  const _0x2b7e7b = _0x41e8d4['filter']((_0x448b32) =>
    hasSpatialRole(assetForObject(_0x448b32, _0x5f486e), 'tabletop-item'),
  );
  return (
    _0x2b7e7b['forEach']((_0x52ee11, _0x446dbc) => {
      const _0x30ab1b = resolveStoryboard3DAssetSpatialMetadata(assetForObject(_0x52ee11, _0x5f486e)),
        _0x405551 = angleForSlot(_0x446dbc, Math['max'](0x1, _0x2b7e7b['length'])),
        _0x72804 = Math['min'](_0x2ef688['dimensions']['width'], _0x2ef688['dimensions']['depth']) * 0.22;
      _0x52ee11['transform']['position'] = [
        _0x533ce2[0x0] + Math['cos'](_0x405551) * _0x72804,
        _0x533ce2[0x1] + _0x2ef688['supportHeight'] + _0x30ab1b['dimensions']['height'] / 0x2,
        _0x533ce2[0x2] + Math['sin'](_0x405551) * _0x72804,
      ];
    }),
    { objects: _0x41e8d4, applied: !![], participantCount: _0x4bd872['length'] }
  );
}

const COLOR_VARIANTS = Object['freeze']([
    Object['freeze']({ id: 'blue', label: 'Blue' }),
    Object['freeze']({ id: 'red', label: 'Red' }),
    Object['freeze']({ id: 'green', label: 'Green' }),
    Object['freeze']({ id: 'yellow', label: 'Yellow' }),
    Object['freeze']({ id: 'purple', label: 'Purple' }),
  ]),
  SIZE_VARIANTS = Object['freeze']([
    Object['freeze']({ id: 'small', label: 'Small', scale: 0.75 }),
    Object['freeze']({ id: 'medium', label: 'Medium', scale: 0x1 }),
    Object['freeze']({ id: 'large', label: 'Large', scale: 1.35 }),
  ]),
  vector3 = (_0x2034d7 = 0x0, _0x3f06f7 = 0x0, _0xa2b9ca = 0x0) => ({
    x: _0x2034d7,
    y: _0x3f06f7,
    z: _0xa2b9ca,
  }),
  box = (_0x5841ac, _0x45a6fe, _0x55b01d = {}) => ({
    primitive: 'box',
    size: { ..._0x5841ac },
    position: { ..._0x45a6fe },
    rotation: { ...vector3(), ...(_0x55b01d['rotation'] || {}) },
    colorKey: _0x55b01d['colorKey'] || null,
  }),
  cylinder = (_0x149888, _0x50050a, _0x5c21c2, _0x25d6eb = {}) => ({
    primitive: 'cylinder',
    radiusTop: _0x25d6eb['radiusTop'] ?? _0x149888,
    radiusBottom: _0x25d6eb['radiusBottom'] ?? _0x149888,
    height: _0x50050a,
    position: { ..._0x5c21c2 },
    rotation: { ...vector3(), ...(_0x25d6eb['rotation'] || {}) },
    colorKey: _0x25d6eb['colorKey'] || null,
  }),
  sphere = (_0x2455e4, _0x3e5ce0, _0x32ad1c = {}) => ({
    primitive: 'sphere',
    radius: _0x2455e4,
    position: { ..._0x3e5ce0 },
    rotation: { ...vector3(), ...(_0x32ad1c['rotation'] || {}) },
    colorKey: _0x32ad1c['colorKey'] || null,
  }),
  torus = (_0x13ec81, _0x193dbb, _0x33815a, _0x34692b = {}) => ({
    primitive: 'torus',
    radius: _0x13ec81,
    tube: _0x193dbb,
    position: { ..._0x33815a },
    rotation: { ...vector3(), ...(_0x34692b['rotation'] || {}) },
    colorKey: _0x34692b['colorKey'] || null,
  }),
  FAMILY_TEMPLATES = Object['freeze']([
    {
      id: 'building',
      name: 'Building',
      category: 'architecture',
      tags: ['tower', 'office', 'city'],
      parts: [
        box(vector3(4.6, 5.4, 3.6), vector3(0x0, 2.7, 0x0)),
        box(vector3(4.9, 0.18, 3.9), vector3(0x0, 5.48, 0x0), { colorKey: 'white' }),
      ],
    },
    {
      id: 'room',
      name: 'Open Room',
      category: 'architecture',
      tags: ['interior', 'studio', 'wall'],
      parts: [
        box(vector3(0x5, 0.16, 0x4), vector3(0x0, 0.08, 0x0)),
        box(vector3(0x5, 0x3, 0.16), vector3(0x0, 1.5, -1.92)),
        box(vector3(0.16, 0x3, 0x4), vector3(-2.42, 1.5, 0x0)),
      ],
    },
    {
      id: 'wall',
      name: 'Wall',
      category: 'architecture',
      tags: ['partition', 'backdrop'],
      parts: [box(vector3(0x4, 2.8, 0.18), vector3(0x0, 1.4, 0x0))],
    },
    {
      id: 'doorway',
      name: 'Doorway',
      category: 'architecture',
      tags: ['door', 'entrance', 'arch'],
      parts: [
        box(vector3(0.45, 0x3, 0.35), vector3(-1.15, 1.5, 0x0)),
        box(vector3(0.45, 0x3, 0.35), vector3(1.15, 1.5, 0x0)),
        box(vector3(2.75, 0.45, 0.35), vector3(0x0, 2.78, 0x0)),
      ],
    },
    {
      id: 'stairs',
      name: 'Stairs',
      category: 'architecture',
      tags: ['steps', 'platform'],
      parts: Array['from']({ length: 0x5 }, (_0x1ba89b, _0x2d0ff4) =>
        box(vector3(2.5, 0.28, 0.65), vector3(0x0, 0.14 + _0x2d0ff4 * 0.28, _0x2d0ff4 * 0.55)),
      ),
    },
    {
      id: 'column',
      name: 'Column',
      category: 'architecture',
      tags: ['pillar', 'temple'],
      parts: [
        cylinder(0.42, 3.4, vector3(0x0, 1.9, 0x0)),
        cylinder(0.58, 0.25, vector3(0x0, 0.125, 0x0)),
        cylinder(0.58, 0.25, vector3(0x0, 3.675, 0x0)),
      ],
    },
    {
      id: 'table',
      name: 'Table',
      category: 'furniture',
      tags: ['desk', 'dining'],
      parts: [
        box(vector3(2.2, 0.16, 1.1), vector3(0x0, 1.05, 0x0)),
        ...[-0.9, 0.9]['flatMap']((_0x4d4018) =>
          [-0.38, 0.38]['map']((_0x16682b) =>
            box(vector3(0.14, 0x1, 0.14), vector3(_0x4d4018, 0.5, _0x16682b)),
          ),
        ),
      ],
    },
    {
      id: 'chair',
      name: 'Chair',
      category: 'furniture',
      tags: ['seat', 'dining'],
      parts: [
        box(vector3(0.85, 0.14, 0.85), vector3(0x0, 0.72, 0x0)),
        box(vector3(0.85, 1.05, 0.14), vector3(0x0, 1.3, 0.36)),
        ...[-0.32, 0.32]['flatMap']((_0xa629a1) =>
          [-0.32, 0.32]['map']((_0x46b370) =>
            box(vector3(0.1, 0.7, 0.1), vector3(_0xa629a1, 0.35, _0x46b370)),
          ),
        ),
      ],
    },
    {
      id: 'sofa',
      name: 'Sofa',
      category: 'furniture',
      tags: ['couch', 'lounge'],
      parts: [
        box(vector3(2.5, 0.5, 0.9), vector3(0x0, 0.45, 0x0)),
        box(vector3(2.5, 1.05, 0.28), vector3(0x0, 1.05, 0.35)),
        box(vector3(0.28, 0.8, 0x1), vector3(-1.12, 0.78, 0x0)),
        box(vector3(0.28, 0.8, 0x1), vector3(1.12, 0.78, 0x0)),
      ],
    },
    {
      id: 'shelf',
      name: 'Shelf',
      category: 'furniture',
      tags: ['bookcase', 'storage'],
      parts: [
        box(vector3(0.16, 2.8, 0.65), vector3(-1.05, 1.4, 0x0)),
        box(vector3(0.16, 2.8, 0.65), vector3(1.05, 1.4, 0x0)),
        ...[0.12, 0.95, 1.78, 2.62]['map']((_0x51a44d) =>
          box(vector3(2.25, 0.12, 0.65), vector3(0x0, _0x51a44d, 0x0)),
        ),
      ],
    },
    {
      id: 'bed',
      name: 'Bed',
      category: 'furniture',
      tags: ['bedroom', 'mattress'],
      parts: [
        box(vector3(0x2, 0.34, 3.5), vector3(0x0, 0.42, 0x0)),
        box(vector3(2.1, 1.5, 0.18), vector3(0x0, 0.9, 1.66)),
        box(vector3(0.85, 0.18, 0.65), vector3(-0.48, 0.68, 1.15), { colorKey: 'white' }),
        box(vector3(0.85, 0.18, 0.65), vector3(0.48, 0.68, 1.15), { colorKey: 'white' }),
      ],
    },
    {
      id: 'cabinet',
      name: 'Cabinet',
      category: 'furniture',
      tags: ['storage', 'wardrobe'],
      parts: [
        box(vector3(1.8, 2.5, 0.75), vector3(0x0, 1.25, 0x0)),
        sphere(0.07, vector3(-0.18, 1.25, -0.41), { colorKey: 'yellow' }),
        sphere(0.07, vector3(0.18, 1.25, -0.41), { colorKey: 'yellow' }),
      ],
    },
    {
      id: 'stage',
      name: 'Stage',
      category: 'stage',
      tags: ['performance', 'dance', 'platform'],
      parts: [box(vector3(0x5, 0.55, 3.2), vector3(0x0, 0.275, 0x0))],
    },
    {
      id: 'dance-floor',
      name: 'Dance\x20Floor',
      category: 'stage',
      tags: ['dance', 'club', 'floor'],
      parts: Array['from']({ length: 0x10 }, (_0x435666, _0xc8e2ff) => {
        const _0x4aec25 = ((_0xc8e2ff % 0x4) - 1.5) * 0.82,
          _0x472dd5 = (Math['floor'](_0xc8e2ff / 0x4) - 1.5) * 0.82;
        return box(vector3(0.78, 0.12, 0.78), vector3(_0x4aec25, 0.06, _0x472dd5), {
          colorKey: ['blue', 'purple', 'cyan', 'yellow'][_0xc8e2ff % 0x4],
        });
      }),
    },
    {
      id: 'speaker',
      name: 'Speaker',
      category: 'stage',
      tags: ['audio', 'music', 'concert'],
      parts: [
        box(vector3(0.9, 1.65, 0.65), vector3(0x0, 0.825, 0x0)),
        cylinder(0.28, 0.08, vector3(0x0, 0.55, -0.36), {
          rotation: vector3(Math['PI'] / 0x2, 0x0, 0x0),
          colorKey: 'black',
        }),
        cylinder(0.18, 0.08, vector3(0x0, 1.2, -0.36), {
          rotation: vector3(Math['PI'] / 0x2, 0x0, 0x0),
          colorKey: 'black',
        }),
      ],
    },
    {
      id: 'spotlight',
      name: 'Spotlight',
      category: 'stage',
      tags: ['light', 'film', 'concert'],
      parts: [
        cylinder(0.18, 1.6, vector3(0x0, 0.8, 0x0)),
        cylinder(0.42, 0.65, vector3(0x0, 1.72, 0x0), {
          radiusTop: 0.28,
          radiusBottom: 0.46,
          rotation: vector3(Math['PI'] / 0x2, 0x0, 0x0),
        }),
        sphere(0.24, vector3(0x0, 1.72, -0.35), { colorKey: 'yellow' }),
      ],
    },
    {
      id: 'truss',
      name: 'Truss',
      category: 'stage',
      tags: ['rig', 'concert', 'frame'],
      parts: [
        ...[-1.7, 1.7]['flatMap']((_0x2b0c0e) =>
          [-0.22, 0.22]['map']((_0x11f19c) => cylinder(0.06, 0x3, vector3(_0x2b0c0e, 1.5, _0x11f19c))),
        ),
        ...[-0.22, 0.22]['map']((_0x36b170) => box(vector3(3.5, 0.1, 0.1), vector3(0x0, 2.95, _0x36b170))),
      ],
    },
    {
      id: 'backdrop',
      name: 'Backdrop',
      category: 'stage',
      tags: ['studio', 'screen', 'cyclorama'],
      parts: [
        box(vector3(4.5, 2.8, 0.12), vector3(0x0, 1.4, 0x0)),
        cylinder(0.08, 3.2, vector3(-2.35, 1.6, 0x0)),
        cylinder(0.08, 3.2, vector3(2.35, 1.6, 0x0)),
      ],
    },
    {
      id: 'cube',
      name: 'Cube',
      category: 'props',
      tags: ['box', 'primitive', 'legacy'],
      parts: [box(vector3(0x1, 0x1, 0x1), vector3(0x0, 0x0, 0x0))],
    },
    {
      id: 'crate',
      name: 'Crate',
      category: 'props',
      tags: ['box', 'cargo'],
      parts: [box(vector3(0x1, 0x1, 0x1), vector3(0x0, 0.5, 0x0))],
    },
    {
      id: 'barrel',
      name: 'Barrel',
      category: 'props',
      tags: ['drum', 'industrial'],
      parts: [
        cylinder(0.48, 1.2, vector3(0x0, 0.6, 0x0), { radiusTop: 0.4, radiusBottom: 0.4 }),
        torus(0.43, 0.045, vector3(0x0, 0.2, 0x0), { rotation: vector3(Math['PI'] / 0x2, 0x0, 0x0) }),
        torus(0.43, 0.045, vector3(0x0, 0x1, 0x0), { rotation: vector3(Math['PI'] / 0x2, 0x0, 0x0) }),
      ],
    },
    {
      id: 'traffic-cone',
      name: 'Traffic Cone',
      category: 'props',
      tags: ['cone', 'street', 'marker'],
      parts: [
        box(vector3(0.75, 0.08, 0.75), vector3(0x0, 0.04, 0x0)),
        cylinder(0.34, 1.05, vector3(0x0, 0.56, 0x0), { radiusTop: 0.04, radiusBottom: 0.34 }),
      ],
    },
    {
      id: 'planter',
      name: 'Planter',
      category: 'props',
      tags: ['pot', 'decor'],
      parts: [
        cylinder(0.45, 0.7, vector3(0x0, 0.35, 0x0), { radiusTop: 0.38, radiusBottom: 0.48 }),
        sphere(0.58, vector3(0x0, 1.03, 0x0), { colorKey: 'green' }),
      ],
    },
    {
      id: 'tree',
      name: 'Tree',
      category: 'nature',
      tags: ['plant', 'outdoor', 'forest'],
      parts: [
        cylinder(0.24, 2.2, vector3(0x0, 1.1, 0x0), { colorKey: 'yellow' }),
        sphere(1.05, vector3(0x0, 2.45, 0x0), { colorKey: 'green' }),
        sphere(0.72, vector3(-0.65, 2.2, 0.1), { colorKey: 'green' }),
        sphere(0.72, vector3(0.65, 2.2, -0.1), { colorKey: 'green' }),
      ],
    },
    {
      id: 'rock',
      name: 'Rock',
      category: 'nature',
      tags: ['stone', 'outdoor', 'terrain'],
      parts: [sphere(0.75, vector3(0x0, 0.45, 0x0)), sphere(0.48, vector3(0.52, 0.3, 0.15))],
    },
  ]);
function scalePart(_0x1dbda6, _0x2aa307) {
  const _0x29836a = {
    ..._0x1dbda6,
    position: {
      x: _0x1dbda6['position']['x'] * _0x2aa307,
      y: _0x1dbda6['position']['y'] * _0x2aa307,
      z: _0x1dbda6['position']['z'] * _0x2aa307,
    },
    rotation: { ..._0x1dbda6['rotation'] },
  };
  _0x1dbda6['size'] &&
    (_0x29836a['size'] = {
      x: _0x1dbda6['size']['x'] * _0x2aa307,
      y: _0x1dbda6['size']['y'] * _0x2aa307,
      z: _0x1dbda6['size']['z'] * _0x2aa307,
    });
  for (const _0x17b637 of ['radius', 'radiusTop', 'radiusBottom', 'height', 'tube']) {
    if (Number['isFinite'](_0x1dbda6[_0x17b637])) _0x29836a[_0x17b637] = _0x1dbda6[_0x17b637] * _0x2aa307;
  }
  return _0x29836a;
}
const ASSETS = Object['freeze'](
    FAMILY_TEMPLATES['flatMap']((_0x39c2c4) =>
      SIZE_VARIANTS['flatMap']((_0x180c6e) =>
        COLOR_VARIANTS['map']((_0x15ba33) =>
          Object['freeze']({
            id: _0x39c2c4['category'] + '-' + _0x39c2c4['id'] + '-' + _0x180c6e['id'] + '-' + _0x15ba33['id'],
            familyId: _0x39c2c4['id'],
            name: _0x39c2c4['name'] + '\x20' + _0x180c6e['label'] + '\x20' + _0x15ba33['label'],
            category: _0x39c2c4['category'],
            tags: Object['freeze']([..._0x39c2c4['tags'], _0x180c6e['id'], _0x15ba33['id']]),
            kind: 'procedural',
            colorKey: _0x15ba33['id'],
            size: _0x180c6e['id'],
            parts: Object['freeze'](
              _0x39c2c4['parts']['map']((_0x30a817) =>
                Object['freeze'](scalePart(_0x30a817, _0x180c6e['scale'])),
              ),
            ),
          }),
        ),
      ),
    ),
  ),
  ASSET_BY_ID = new Map(ASSETS['map']((_0x2442e4) => [_0x2442e4['id'], _0x2442e4]));
export const DEFAULT_SCENE_ASSET_ID = 'props-cube-medium-blue';
export const SCENE_ASSET_COUNT = ASSETS['length'];
export function listSceneAssets() {
  return [...ASSETS];
}
export function getSceneAssetCategories() {
  return [...new Set(ASSETS['map']((_0x473853) => _0x473853['category']))];
}
export function findSceneAsset(_0x198548) {
  return ASSET_BY_ID['get'](String(_0x198548 || '')['trim']()) || null;
}
function getPartHalfExtents(_0x341f87 = {}) {
  if (_0x341f87['primitive'] === 'sphere') {
    const _0x498510 = Math['max'](0x0, Number(_0x341f87['radius']) || 0x0);
    return vector3(_0x498510, _0x498510, _0x498510);
  }
  if (_0x341f87['primitive'] === 'torus') {
    const _0x332552 = Math['max'](
      0x0,
      (Number(_0x341f87['radius']) || 0x0) + (Number(_0x341f87['tube']) || 0x0),
    );
    return vector3(_0x332552, _0x332552, _0x332552);
  }
  if (_0x341f87['primitive'] === 'cylinder') {
    const _0x4b1656 = Math['max'](
        0x0,
        Number(_0x341f87['radiusTop']) || 0x0,
        Number(_0x341f87['radiusBottom']) || 0x0,
      ),
      _0x5a3c0e = Math['max'](0x0, (Number(_0x341f87['height']) || 0x0) / 0x2),
      _0x2b6b68 = Math['max'](_0x4b1656, _0x5a3c0e);
    return vector3(_0x2b6b68, _0x2b6b68, _0x2b6b68);
  }
  return vector3(
    Math['max'](0x0, (Number(_0x341f87?.['size']?.['x']) || 0x0) / 0x2),
    Math['max'](0x0, (Number(_0x341f87?.['size']?.['y']) || 0x0) / 0x2),
    Math['max'](0x0, (Number(_0x341f87?.['size']?.['z']) || 0x0) / 0x2),
  );
}
export function estimateSceneAssetBoundingRadius(_0xfdf9e6) {
  const _0x50c384 = typeof _0xfdf9e6 === 'string' ? findSceneAsset(_0xfdf9e6) : _0xfdf9e6,
    _0x4b8c75 = Array['isArray'](_0x50c384?.['parts']) ? _0x50c384['parts'] : [];
  if (_0x4b8c75['length'] === 0x0) return 0.5;
  const _0x3a8a13 = _0x4b8c75['reduce'](
      (_0x2ac0e6, _0x23255c) => {
        const _0x5ea493 = _0x23255c?.['position'] || vector3(),
          _0x595fb0 = getPartHalfExtents(_0x23255c);
        return (
          (_0x2ac0e6['min']['x'] = Math['min'](
            _0x2ac0e6['min']['x'],
            (Number(_0x5ea493['x']) || 0x0) - _0x595fb0['x'],
          )),
          (_0x2ac0e6['min']['y'] = Math['min'](
            _0x2ac0e6['min']['y'],
            (Number(_0x5ea493['y']) || 0x0) - _0x595fb0['y'],
          )),
          (_0x2ac0e6['min']['z'] = Math['min'](
            _0x2ac0e6['min']['z'],
            (Number(_0x5ea493['z']) || 0x0) - _0x595fb0['z'],
          )),
          (_0x2ac0e6['max']['x'] = Math['max'](
            _0x2ac0e6['max']['x'],
            (Number(_0x5ea493['x']) || 0x0) + _0x595fb0['x'],
          )),
          (_0x2ac0e6['max']['y'] = Math['max'](
            _0x2ac0e6['max']['y'],
            (Number(_0x5ea493['y']) || 0x0) + _0x595fb0['y'],
          )),
          (_0x2ac0e6['max']['z'] = Math['max'](
            _0x2ac0e6['max']['z'],
            (Number(_0x5ea493['z']) || 0x0) + _0x595fb0['z'],
          )),
          _0x2ac0e6
        );
      },
      { min: vector3(Infinity, Infinity, Infinity), max: vector3(-Infinity, -Infinity, -Infinity) },
    ),
    _0x2a07ea = vector3(
      Math['max'](0.01, (_0x3a8a13['max']['x'] - _0x3a8a13['min']['x']) / 0x2),
      Math['max'](0.01, (_0x3a8a13['max']['y'] - _0x3a8a13['min']['y']) / 0x2),
      Math['max'](0.01, (_0x3a8a13['max']['z'] - _0x3a8a13['min']['z']) / 0x2),
    );
  return Math['max'](0.5, Math['hypot'](_0x2a07ea['x'], _0x2a07ea['y'], _0x2a07ea['z']));
}
export function resolveSceneAsset(_0x11b132, _0x3cf378 = DEFAULT_SCENE_ASSET_ID) {
  const _0x5d0fd4 = String(_0x11b132 || '')['trim']();
  return ASSET_BY_ID['get'](_0x5d0fd4) || ASSET_BY_ID['get'](_0x3cf378) || ASSETS[0x0] || null;
}
export function searchSceneAssets({
  query: query = '',
  category: category = 'all',
  limit: limit = 0x50,
  offset: offset = 0x0,
} = {}) {
  const _0x57e09f = String(query || '')
      ['trim']()
      ['toLowerCase'](),
    _0x21a16b = String(category || 'all')
      ['trim']()
      ['toLowerCase'](),
    _0x5ab792 = Math['max'](0x0, Math['floor'](Number(offset) || 0x0)),
    _0x22fa92 = Math['max'](0x1, Math['min'](0x168, Math['floor'](Number(limit) || 0x50)));
  return ASSETS['filter']((_0x1d1fd5) => {
    if (_0x21a16b !== 'all' && _0x1d1fd5['category'] !== _0x21a16b) return ![];
    if (!_0x57e09f) return !![];
    const _0x2e6866 = [
      _0x1d1fd5['id'],
      _0x1d1fd5['familyId'],
      _0x1d1fd5['name'],
      _0x1d1fd5['category'],
      ..._0x1d1fd5['tags'],
    ]
      ['join']('\x20')
      ['toLowerCase']();
    return _0x2e6866['includes'](_0x57e09f);
  })['slice'](_0x5ab792, _0x5ab792 + _0x22fa92);
}

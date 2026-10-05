const COLOR_VARIANTS = Object['freeze']([
    Object['freeze']({ id: 'blue', label: 'Blue' }),
    Object['freeze']({ id: 'red', label: 'Red' }),
    Object['freeze']({ id: 'green', label: 'Green' }),
    Object['freeze']({ id: 'yellow', label: 'Yellow' }),
    Object['freeze']({ id: 'purple', label: 'Purple' }),
  ]),
  SIZE_VARIANTS = Object['freeze']([
    Object['freeze']({ id: 'small', label: 'Small', scale: 0.75 }),
    Object['freeze']({ id: 'medium', label: 'Medium', scale: 1 }),
    Object['freeze']({ id: 'large', label: 'Large', scale: 1.35 }),
  ]),
  vector3 = (x = 0, y = 0, z = 0) => ({
    x: x,
    y: y,
    z: z,
  }),
  box = (args, args2, colorKey = {}) => ({
    primitive: 'box',
    size: { ...args },
    position: { ...args2 },
    rotation: { ...vector3(), ...(colorKey['rotation'] || {}) },
    colorKey: colorKey['colorKey'] || null,
  }),
  cylinder = (value, height, args3, radiusTop = {}) => ({
    primitive: 'cylinder',
    radiusTop: radiusTop['radiusTop'] ?? value,
    radiusBottom: radiusTop['radiusBottom'] ?? value,
    height: height,
    position: { ...args3 },
    rotation: { ...vector3(), ...(radiusTop['rotation'] || {}) },
    colorKey: radiusTop['colorKey'] || null,
  }),
  sphere = (radius, args4, colorKey2 = {}) => ({
    primitive: 'sphere',
    radius: radius,
    position: { ...args4 },
    rotation: { ...vector3(), ...(colorKey2['rotation'] || {}) },
    colorKey: colorKey2['colorKey'] || null,
  }),
  torus = (radius2, tube, args5, colorKey3 = {}) => ({
    primitive: 'torus',
    radius: radius2,
    tube: tube,
    position: { ...args5 },
    rotation: { ...vector3(), ...(colorKey3['rotation'] || {}) },
    colorKey: colorKey3['colorKey'] || null,
  }),
  FAMILY_TEMPLATES = Object['freeze']([
    {
      id: 'building',
      name: 'Building',
      category: 'architecture',
      tags: ['tower', 'office', 'city'],
      parts: [
        box(vector3(4.6, 5.4, 3.6), vector3(0, 2.7, 0)),
        box(vector3(4.9, 0.18, 3.9), vector3(0, 5.48, 0), { colorKey: 'white' }),
      ],
    },
    {
      id: 'room',
      name: 'Open Room',
      category: 'architecture',
      tags: ['interior', 'studio', 'wall'],
      parts: [
        box(vector3(5, 0.16, 4), vector3(0, 0.08, 0)),
        box(vector3(5, 3, 0.16), vector3(0, 1.5, -1.92)),
        box(vector3(0.16, 3, 4), vector3(-2.42, 1.5, 0)),
      ],
    },
    {
      id: 'wall',
      name: 'Wall',
      category: 'architecture',
      tags: ['partition', 'backdrop'],
      parts: [box(vector3(4, 2.8, 0.18), vector3(0, 1.4, 0))],
    },
    {
      id: 'doorway',
      name: 'Doorway',
      category: 'architecture',
      tags: ['door', 'entrance', 'arch'],
      parts: [
        box(vector3(0.45, 3, 0.35), vector3(-1.15, 1.5, 0)),
        box(vector3(0.45, 3, 0.35), vector3(1.15, 1.5, 0)),
        box(vector3(2.75, 0.45, 0.35), vector3(0, 2.78, 0)),
      ],
    },
    {
      id: 'stairs',
      name: 'Stairs',
      category: 'architecture',
      tags: ['steps', 'platform'],
      parts: Array['from']({ length: 5 }, (item, key) =>
        box(vector3(2.5, 0.28, 0.65), vector3(0, 0.14 + key * 0.28, key * 0.55)),
      ),
    },
    {
      id: 'column',
      name: 'Column',
      category: 'architecture',
      tags: ['pillar', 'temple'],
      parts: [
        cylinder(0.42, 3.4, vector3(0, 1.9, 0)),
        cylinder(0.58, 0.25, vector3(0, 0.125, 0)),
        cylinder(0.58, 0.25, vector3(0, 3.675, 0)),
      ],
    },
    {
      id: 'table',
      name: 'Table',
      category: 'furniture',
      tags: ['desk', 'dining'],
      parts: [
        box(vector3(2.2, 0.16, 1.1), vector3(0, 1.05, 0)),
        ...[-0.9, 0.9]['flatMap']((index) =>
          [-0.38, 0.38]['map']((result) => box(vector3(0.14, 1, 0.14), vector3(index, 0.5, result))),
        ),
      ],
    },
    {
      id: 'chair',
      name: 'Chair',
      category: 'furniture',
      tags: ['seat', 'dining'],
      parts: [
        box(vector3(0.85, 0.14, 0.85), vector3(0, 0.72, 0)),
        box(vector3(0.85, 1.05, 0.14), vector3(0, 1.3, 0.36)),
        ...[-0.32, 0.32]['flatMap']((data) =>
          [-0.32, 0.32]['map']((options) => box(vector3(0.1, 0.7, 0.1), vector3(data, 0.35, options))),
        ),
      ],
    },
    {
      id: 'sofa',
      name: 'Sofa',
      category: 'furniture',
      tags: ['couch', 'lounge'],
      parts: [
        box(vector3(2.5, 0.5, 0.9), vector3(0, 0.45, 0)),
        box(vector3(2.5, 1.05, 0.28), vector3(0, 1.05, 0.35)),
        box(vector3(0.28, 0.8, 1), vector3(-1.12, 0.78, 0)),
        box(vector3(0.28, 0.8, 1), vector3(1.12, 0.78, 0)),
      ],
    },
    {
      id: 'shelf',
      name: 'Shelf',
      category: 'furniture',
      tags: ['bookcase', 'storage'],
      parts: [
        box(vector3(0.16, 2.8, 0.65), vector3(-1.05, 1.4, 0)),
        box(vector3(0.16, 2.8, 0.65), vector3(1.05, 1.4, 0)),
        ...[0.12, 0.95, 1.78, 2.62]['map']((target) =>
          box(vector3(2.25, 0.12, 0.65), vector3(0, target, 0)),
        ),
      ],
    },
    {
      id: 'bed',
      name: 'Bed',
      category: 'furniture',
      tags: ['bedroom', 'mattress'],
      parts: [
        box(vector3(2, 0.34, 3.5), vector3(0, 0.42, 0)),
        box(vector3(2.1, 1.5, 0.18), vector3(0, 0.9, 1.66)),
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
        box(vector3(1.8, 2.5, 0.75), vector3(0, 1.25, 0)),
        sphere(0.07, vector3(-0.18, 1.25, -0.41), { colorKey: 'yellow' }),
        sphere(0.07, vector3(0.18, 1.25, -0.41), { colorKey: 'yellow' }),
      ],
    },
    {
      id: 'stage',
      name: 'Stage',
      category: 'stage',
      tags: ['performance', 'dance', 'platform'],
      parts: [box(vector3(5, 0.55, 3.2), vector3(0, 0.275, 0))],
    },
    {
      id: 'dance-floor',
      name: 'Dance Floor',
      category: 'stage',
      tags: ['dance', 'club', 'floor'],
      parts: Array['from']({ length: 16 }, (source, next) => {
        const current = ((next % 4) - 1.5) * 0.82,
          entry = (Math['floor'](next / 4) - 1.5) * 0.82;
        return box(vector3(0.78, 0.12, 0.78), vector3(current, 0.06, entry), {
          colorKey: ['blue', 'purple', 'cyan', 'yellow'][next % 4],
        });
      }),
    },
    {
      id: 'speaker',
      name: 'Speaker',
      category: 'stage',
      tags: ['audio', 'music', 'concert'],
      parts: [
        box(vector3(0.9, 1.65, 0.65), vector3(0, 0.825, 0)),
        cylinder(0.28, 0.08, vector3(0, 0.55, -0.36), {
          rotation: vector3(Math['PI'] / 2, 0, 0),
          colorKey: 'black',
        }),
        cylinder(0.18, 0.08, vector3(0, 1.2, -0.36), {
          rotation: vector3(Math['PI'] / 2, 0, 0),
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
        cylinder(0.18, 1.6, vector3(0, 0.8, 0)),
        cylinder(0.42, 0.65, vector3(0, 1.72, 0), {
          radiusTop: 0.28,
          radiusBottom: 0.46,
          rotation: vector3(Math['PI'] / 2, 0, 0),
        }),
        sphere(0.24, vector3(0, 1.72, -0.35), { colorKey: 'yellow' }),
      ],
    },
    {
      id: 'truss',
      name: 'Truss',
      category: 'stage',
      tags: ['rig', 'concert', 'frame'],
      parts: [
        ...[-1.7, 1.7]['flatMap']((record) =>
          [-0.22, 0.22]['map']((payload) => cylinder(0.06, 3, vector3(record, 1.5, payload))),
        ),
        ...[-0.22, 0.22]['map']((handle) => box(vector3(3.5, 0.1, 0.1), vector3(0, 2.95, handle))),
      ],
    },
    {
      id: 'backdrop',
      name: 'Backdrop',
      category: 'stage',
      tags: ['studio', 'screen', 'cyclorama'],
      parts: [
        box(vector3(4.5, 2.8, 0.12), vector3(0, 1.4, 0)),
        cylinder(0.08, 3.2, vector3(-2.35, 1.6, 0)),
        cylinder(0.08, 3.2, vector3(2.35, 1.6, 0)),
      ],
    },
    {
      id: 'cube',
      name: 'Cube',
      category: 'props',
      tags: ['box', 'primitive', 'legacy'],
      parts: [box(vector3(1, 1, 1), vector3(0, 0, 0))],
    },
    {
      id: 'crate',
      name: 'Crate',
      category: 'props',
      tags: ['box', 'cargo'],
      parts: [box(vector3(1, 1, 1), vector3(0, 0.5, 0))],
    },
    {
      id: 'barrel',
      name: 'Barrel',
      category: 'props',
      tags: ['drum', 'industrial'],
      parts: [
        cylinder(0.48, 1.2, vector3(0, 0.6, 0), { radiusTop: 0.4, radiusBottom: 0.4 }),
        torus(0.43, 0.045, vector3(0, 0.2, 0), { rotation: vector3(Math['PI'] / 2, 0, 0) }),
        torus(0.43, 0.045, vector3(0, 1, 0), { rotation: vector3(Math['PI'] / 2, 0, 0) }),
      ],
    },
    {
      id: 'traffic-cone',
      name: 'Traffic Cone',
      category: 'props',
      tags: ['cone', 'street', 'marker'],
      parts: [
        box(vector3(0.75, 0.08, 0.75), vector3(0, 0.04, 0)),
        cylinder(0.34, 1.05, vector3(0, 0.56, 0), { radiusTop: 0.04, radiusBottom: 0.34 }),
      ],
    },
    {
      id: 'planter',
      name: 'Planter',
      category: 'props',
      tags: ['pot', 'decor'],
      parts: [
        cylinder(0.45, 0.7, vector3(0, 0.35, 0), { radiusTop: 0.38, radiusBottom: 0.48 }),
        sphere(0.58, vector3(0, 1.03, 0), { colorKey: 'green' }),
      ],
    },
    {
      id: 'tree',
      name: 'Tree',
      category: 'nature',
      tags: ['plant', 'outdoor', 'forest'],
      parts: [
        cylinder(0.24, 2.2, vector3(0, 1.1, 0), { colorKey: 'yellow' }),
        sphere(1.05, vector3(0, 2.45, 0), { colorKey: 'green' }),
        sphere(0.72, vector3(-0.65, 2.2, 0.1), { colorKey: 'green' }),
        sphere(0.72, vector3(0.65, 2.2, -0.1), { colorKey: 'green' }),
      ],
    },
    {
      id: 'rock',
      name: 'Rock',
      category: 'nature',
      tags: ['stone', 'outdoor', 'terrain'],
      parts: [sphere(0.75, vector3(0, 0.45, 0)), sphere(0.48, vector3(0.52, 0.3, 0.15))],
    },
  ]);
function scalePart(x2, state) {
  const config = {
    ...x2,
    position: {
      x: x2['position']['x'] * state,
      y: x2['position']['y'] * state,
      z: x2['position']['z'] * state,
    },
    rotation: { ...x2['rotation'] },
  };
  x2['size'] &&
    (config['size'] = {
      x: x2['size']['x'] * state,
      y: x2['size']['y'] * state,
      z: x2['size']['z'] * state,
    });
  for (const scope of ['radius', 'radiusTop', 'radiusBottom', 'height', 'tube']) {
    if (Number['isFinite'](x2[scope])) config[scope] = x2[scope] * state;
  }
  return config;
}
const ASSETS = Object['freeze'](
    FAMILY_TEMPLATES['flatMap']((id) =>
      SIZE_VARIANTS['flatMap']((size) =>
        COLOR_VARIANTS['map']((colorKey4) =>
          Object['freeze']({
            id: id['category'] + '-' + id['id'] + '-' + size['id'] + '-' + colorKey4['id'],
            familyId: id['id'],
            name: id['name'] + ' ' + size['label'] + ' ' + colorKey4['label'],
            category: id['category'],
            tags: Object['freeze']([...id['tags'], size['id'], colorKey4['id']]),
            kind: 'procedural',
            colorKey: colorKey4['id'],
            size: size['id'],
            parts: Object['freeze'](
              id['parts']['map']((input) => Object['freeze'](scalePart(input, size['scale']))),
            ),
          }),
        ),
      ),
    ),
  ),
  ASSET_BY_ID = new Map(ASSETS['map']((output) => [output['id'], output]));
export const DEFAULT_SCENE_ASSET_ID = 'props-cube-medium-blue';
export const SCENE_ASSET_COUNT = ASSETS['length'];
export function listSceneAssets() {
  return [...ASSETS];
}
export function getSceneAssetCategories() {
  return [...new Set(ASSETS['map']((value2) => value2['category']))];
}
export function findSceneAsset(value3) {
  return ASSET_BY_ID['get'](String(value3 || '')['trim']()) || null;
}
function getPartHalfExtents(box2 = {}) {
  if (box2['primitive'] === 'sphere') {
    const value4 = Math['max'](0, Number(box2['radius']) || 0);
    return vector3(value4, value4, value4);
  }
  if (box2['primitive'] === 'torus') {
    const value5 = Math['max'](0, (Number(box2['radius']) || 0) + (Number(box2['tube']) || 0));
    return vector3(value5, value5, value5);
  }
  if (box2['primitive'] === 'cylinder') {
    const value6 = Math['max'](0, Number(box2['radiusTop']) || 0, Number(box2['radiusBottom']) || 0),
      value7 = Math['max'](0, (Number(box2['height']) || 0) / 2),
      value8 = Math['max'](value6, value7);
    return vector3(value8, value8, value8);
  }
  return vector3(
    Math['max'](0, (Number(box2?.['size']?.['x']) || 0) / 2),
    Math['max'](0, (Number(box2?.['size']?.['y']) || 0) / 2),
    Math['max'](0, (Number(box2?.['size']?.['z']) || 0) / 2),
  );
}
export function estimateSceneAssetBoundingRadius(value9) {
  const value10 = typeof value9 === 'string' ? findSceneAsset(value9) : value9,
    list = Array['isArray'](value10?.['parts']) ? value10['parts'] : [];
  if (list['length'] === 0) return 0.5;
  const value11 = list['reduce'](
      (value12, value13) => {
        const box3 = value13?.['position'] || vector3(),
          box4 = getPartHalfExtents(value13);
        return (
          (value12['min']['x'] = Math['min'](value12['min']['x'], (Number(box3['x']) || 0) - box4['x'])),
          (value12['min']['y'] = Math['min'](value12['min']['y'], (Number(box3['y']) || 0) - box4['y'])),
          (value12['min']['z'] = Math['min'](value12['min']['z'], (Number(box3['z']) || 0) - box4['z'])),
          (value12['max']['x'] = Math['max'](value12['max']['x'], (Number(box3['x']) || 0) + box4['x'])),
          (value12['max']['y'] = Math['max'](value12['max']['y'], (Number(box3['y']) || 0) + box4['y'])),
          (value12['max']['z'] = Math['max'](value12['max']['z'], (Number(box3['z']) || 0) + box4['z'])),
          value12
        );
      },
      { min: vector3(Infinity, Infinity, Infinity), max: vector3(-Infinity, -Infinity, -Infinity) },
    ),
    box5 = vector3(
      Math['max'](0.01, (value11['max']['x'] - value11['min']['x']) / 2),
      Math['max'](0.01, (value11['max']['y'] - value11['min']['y']) / 2),
      Math['max'](0.01, (value11['max']['z'] - value11['min']['z']) / 2),
    );
  return Math['max'](0.5, Math['hypot'](box5['x'], box5['y'], box5['z']));
}
export function resolveSceneAsset(value14, value15 = DEFAULT_SCENE_ASSET_ID) {
  const value16 = String(value14 || '')['trim']();
  return ASSET_BY_ID['get'](value16) || ASSET_BY_ID['get'](value15) || ASSETS[0] || null;
}
export function searchSceneAssets({
  query: query = '',
  category: category = 'all',
  limit: limit = 80,
  offset: offset = 0,
} = {}) {
  const enabled = String(query || '')
      ['trim']()
      ['toLowerCase'](),
    value17 = String(category || 'all')
      ['trim']()
      ['toLowerCase'](),
    value18 = Math['max'](0, Math['floor'](Number(offset) || 0)),
    value19 = Math['max'](1, Math['min'](360, Math['floor'](Number(limit) || 80)));
  return ASSETS['filter']((error) => {
    if (value17 !== 'all' && error['category'] !== value17) return false;
    if (!enabled) return true;
    const list2 = [error['id'], error['familyId'], error['name'], error['category'], ...error['tags']]
      ['join'](' ')
      ['toLowerCase']();
    return list2['includes'](enabled);
  })['slice'](value18, value18 + value19);
}

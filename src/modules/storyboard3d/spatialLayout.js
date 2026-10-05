import { STORYBOARD_3D_BODY_PRESETS } from './characterRig.js';
const SPATIAL_ROLE_SET = new Set(['character', 'floor', 'seat', 'support', 'table', 'tabletop-item', 'wall']),
  BODY_PRESETS_BY_ID = new Map(STORYBOARD_3D_BODY_PRESETS['map']((value) => [value['id'], value])),
  DEFAULT_FAMILY_BODY_PRESETS = Object['freeze']([
    'adult-male',
    'adult-female',
    'child-male',
    'child-female',
  ]),
  DEFAULT_SPATIAL_METADATA = Object['freeze']({
    dimensions: Object['freeze']({ width: 2, height: 2, depth: 2 }),
    anchor: 'ground',
    roles: Object['freeze']([]),
    supportHeight: 0,
    seatHeight: 0,
  });
function finite(item, key, index = 0.01, result = 100) {
  const data = Number(item);
  return Number['isFinite'](data) ? Math['min'](result, Math['max'](index, data)) : key;
}
function normalizedText(options) {
  return String(options || '')['toLocaleLowerCase']();
}
function searchableAssetText(error = {}) {
  return [
    error['id'],
    error['familyId'],
    error['name'],
    error['category'],
    ...(Array['isArray'](error['tags']) ? error['tags'] : []),
    ...(Array['isArray'](error['keywords']) ? error['keywords'] : []),
  ]
    ['map'](normalizedText)
    ['join'](' ');
}
function includesAny(list, list2) {
  return list2['some']((target) => {
    const dText = normalizedText(target);
    if (!dText) return ![];
    if (/^[a-z0-9]+$/['test'](dText))
      return new RegExp('(^|[^a-z0-9])' + dText + '(?=$|[^a-z0-9])')['test'](list);
    return list['includes'](dText);
  });
}
function dimensionsFrom(source, box) {
  const next = source && typeof source === 'object' ? source : {},
    box2 = next['dimensionsMeters'] || next['dimensions'] || next['size'] || next;
  return {
    width: finite(box2?.['width'] ?? box2?.['x'], box['width']),
    height: finite(box2?.['height'] ?? box2?.['y'], box['height']),
    depth: finite(box2?.['depth'] ?? box2?.['z'], box['depth']),
  };
}
function hasDimensions(current) {
  const entry = current && typeof current === 'object' ? current : {},
    box3 = entry['dimensionsMeters'] || entry['dimensions'] || entry['size'] || entry;
  return [box3?.['width'] ?? box3?.['x'], box3?.['height'] ?? box3?.['y'], box3?.['depth'] ?? box3?.['z']][
    'every'
  ]((record) => Number['isFinite'](Number(record)) && Number(record) > 0);
}
function measuredDimensions(options2 = {}) {
  const payload = options2?.['assetRecord']?.['bounds'] || options2?.['normalization']?.['sourceBounds'],
    box4 = payload?.['min'],
    box5 = payload?.['max'],
    box6 = {
      width: Number(box5?.['x']) - Number(box4?.['x']),
      height: Number(box5?.['y']) - Number(box4?.['y']),
      depth: Number(box5?.['z']) - Number(box4?.['z']),
    };
  if (!Object['values'](box6)['every']((count) => Number['isFinite'](count) && count > 0)) return null;
  const finite2 = finite(
    options2?.['assetRecord']?.['defaultScale'] ?? options2?.['normalization']?.['uniformScale'],
    1,
    0.000001,
    1000,
  );
  return {
    width: finite(box6['width'] * finite2, 1),
    height: finite(box6['height'] * finite2, 1),
    depth: finite(box6['depth'] * finite2, 1),
  };
}
function normalizedRoles(handle) {
  return [
    ...new Set(
      (Array['isArray'](handle) ? handle : [])
        ['map']((state) => String(state || '')['trim']())
        ['filter']((config) => SPATIAL_ROLE_SET['has'](config)),
    ),
  ];
}
function bodySpatialMetadata(options3 = {}) {
  const scope = String(options3['id'] || options3['familyId'] || options3['bodyPresetId'] || '')['trim'](),
    height = BODY_PRESETS_BY_ID['get'](scope);
  if (!height) return null;
  return {
    dimensions: {
      width: Number((0.5 * height['shoulderScale'])['toFixed'](3)),
      height: height['height'],
      depth: Number((0.38 * height['depthScale'])['toFixed'](3)),
    },
    anchor: 'ground',
    roles: ['character'],
    supportHeight: 0,
    seatHeight: 0.45,
  };
}
function inferredSpatialMetadata(options4 = {}) {
  const searchableAssetText2 = searchableAssetText(options4),
    dText2 = normalizedText(options4['category']),
    bodySpatialMetadata2 = bodySpatialMetadata(options4);
  if (bodySpatialMetadata2 || dText2 === 'character')
    return (
      bodySpatialMetadata2 || {
        dimensions: { width: 0.52, height: 1.72, depth: 0.4 },
        anchor: 'ground',
        roles: ['character'],
        supportHeight: 0,
        seatHeight: 0.45,
      }
    );
  if (
    dText2 !== 'food' &&
    dText2 !== 'tableware' &&
    dText2 !== 'kitchenware' &&
    includesAny(searchableAssetText2, ['tableround', 'round table', '圆桌'])
  )
    return {
      dimensions: { width: 1.2, height: 0.75, depth: 1.2 },
      anchor: 'ground',
      roles: ['table', 'support'],
      supportHeight: 0.75,
      seatHeight: 0,
    };
  if (
    dText2 !== 'food' &&
    dText2 !== 'tableware' &&
    dText2 !== 'kitchenware' &&
    includesAny(searchableAssetText2, ['table', 'desk', '餐桌', '书桌', '桌子', '茶几', '吧台'])
  ) {
    const dimensions2 = includesAny(searchableAssetText2, ['coffee', '茶几']);
    return {
      dimensions: dimensions2
        ? { width: 1.2, height: 0.45, depth: 0.65 }
        : { width: 1.6, height: 0.75, depth: 0.85 },
      anchor: 'ground',
      roles: ['table', 'support'],
      supportHeight: dimensions2 ? 0.45 : 0.75,
      seatHeight: 0,
    };
  }
  if (includesAny(searchableAssetText2, ['chair', 'stool', 'seat', '椅', '凳', '座位']))
    return {
      dimensions: { width: 0.5, height: 0.9, depth: 0.52 },
      anchor: 'ground',
      roles: ['seat'],
      supportHeight: 0,
      seatHeight: 0.45,
    };
  if (dText2 === 'food' || dText2 === 'tableware' || dText2 === 'kitchenware')
    return {
      dimensions: { width: 0.24, height: 0.12, depth: 0.24 },
      anchor: 'support',
      roles: ['tabletop-item'],
      supportHeight: 0,
      seatHeight: 0,
    };
  if (includesAny(searchableAssetText2, ['floor', '地板', '地面']))
    return {
      dimensions: { width: 4, height: 0.1, depth: 4 },
      anchor: 'ground',
      roles: ['floor', 'support'],
      supportHeight: 0.1,
      seatHeight: 0,
    };
  if (includesAny(searchableAssetText2, ['wall', '墙', 'window', '窗', 'door', '门']))
    return {
      dimensions: { width: 2.4, height: 2.5, depth: 0.15 },
      anchor: 'ground',
      roles: ['wall'],
      supportHeight: 0,
      seatHeight: 0,
    };
  return DEFAULT_SPATIAL_METADATA;
}
export function resolveStoryboard3DAssetSpatialMetadata(options5 = {}) {
  const args = inferredSpatialMetadata(options5),
    anchor2 = options5?.['spatial'] && typeof options5['spatial'] === 'object' ? options5['spatial'] : {},
    measuredDimensions2 = measuredDimensions(options5),
    dimensions3 = dimensionsFrom(anchor2, measuredDimensions2 || args['dimensions']),
    roles2 = normalizedRoles(anchor2['roles']);
  return {
    dimensions: dimensions3,
    source: hasDimensions(anchor2) ? 'provided' : measuredDimensions2 ? 'measured' : 'semantic',
    anchor: anchor2['anchor'] === 'support' ? 'support' : args['anchor'],
    roles: roles2['length'] > 0 ? roles2 : [...args['roles']],
    supportHeight: finite(anchor2['supportHeight'], args['supportHeight'], 0, 100),
    seatHeight: finite(anchor2['seatHeight'], args['seatHeight'], 0, 100),
  };
}
export function getStoryboard3DAssetSpatialExtent(options6 = {}) {
  const box7 = resolveStoryboard3DAssetSpatialMetadata(options6)['dimensions'];
  return Math['max'](box7['width'], box7['height'], box7['depth']);
}
export function describeStoryboard3DAssetSpatialMetadata(options7 = {}) {
  const storyboard3DAssetSpatialMetadata = resolveStoryboard3DAssetSpatialMetadata(options7),
    box8 = storyboard3DAssetSpatialMetadata['dimensions'],
    list3 = [
      'size=' +
        box8['width']['toFixed'](2) +
        'x' +
        box8['height']['toFixed'](2) +
        'x' +
        box8['depth']['toFixed'](2) +
        'm',
      'source=' + storyboard3DAssetSpatialMetadata['source'],
      'anchor=' + storyboard3DAssetSpatialMetadata['anchor'],
    ];
  if (storyboard3DAssetSpatialMetadata['roles']['length'] > 0)
    list3['push']('roles=' + storyboard3DAssetSpatialMetadata['roles']['join'](','));
  if (storyboard3DAssetSpatialMetadata['supportHeight'] > 0)
    list3['push']('supportY=' + storyboard3DAssetSpatialMetadata['supportHeight']['toFixed'](2) + 'm');
  if (storyboard3DAssetSpatialMetadata['seatHeight'] > 0)
    list3['push']('seatY=' + storyboard3DAssetSpatialMetadata['seatHeight']['toFixed'](2) + 'm');
  return list3['join']('; ');
}
export function normalizeStoryboard3DGeneratedLayout(options8 = {}) {
  const input = options8 && typeof options8 === 'object' ? options8 : {},
    kind = input['kind'] === 'dining' ? 'dining' : 'generic',
    participantCount2 = Math['max'](
      0,
      Math['min'](8, Math['floor'](Number(input['participantCount']) || 0)),
    );
  return { kind: kind, participantCount: participantCount2 };
}
function cloneObject(args2) {
  return {
    ...args2,
    transform: {
      position: [...(args2?.['transform']?.['position'] || [0, 0, 0])],
      rotation: [...(args2?.['transform']?.['rotation'] || [0, 0, 0])],
      scale: [...(args2?.['transform']?.['scale'] || [1, 1, 1])],
    },
  };
}
function assetForObject(id, map) {
  if (id?.['type'] === 'character') return { id: id['bodyPresetId'], category: 'character' };
  return map['get'](id?.['assetId']) || null;
}
function hasSpatialRole(output, value2) {
  return resolveStoryboard3DAssetSpatialMetadata(output)['roles']['includes'](value2);
}
function createGeneratedCharacter(value3) {
  return {
    type: 'character',
    name: 'Dining participant ' + (value3 + 1),
    bodyPresetId: DEFAULT_FAMILY_BODY_PRESETS[value3 % DEFAULT_FAMILY_BODY_PRESETS['length']],
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
  };
}
function createGeneratedProp(assetId, name) {
  return {
    type: 'prop',
    name: name || assetId['name'],
    assetId: assetId['id'],
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    castShadow: !![],
    receiveShadow: !![],
  };
}
function firstAssetByRole(value4, value5) {
  return (Array['isArray'](value4) ? value4 : [])['find']((value6) => hasSpatialRole(value6, value5)) || null;
}
function angleForSlot(value7, value8) {
  return -Math['PI'] / 2 + (Math['PI'] * 2 * value7) / Math['max'](1, value8);
}
function faceTowards(value9, value10) {
  return Math['atan2'](value9[0] - value10[0], value9[2] - value10[2]);
}
export function applyStoryboard3DDiningLayout(
  list4 = [],
  { assets: assets = [], participantCount: participantCount = 0 } = {},
) {
  const objects = (Array['isArray'](list4) ? list4 : [])['map'](cloneObject),
    value11 = new Map(
      (Array['isArray'](assets) ? assets : [])
        ['filter']((value12) => value12?.['id'])
        ['map']((value13) => [value13['id'], value13]),
    );
  let generatedProp = objects['find']((value14) => hasSpatialRole(assetForObject(value14, value11), 'table'));
  const value15 = Math['max'](0, Math['min'](8, Math['floor'](Number(participantCount) || 0)));
  let participantCount3 = objects['filter']((value16) => value16['type'] === 'character');
  const participantCount4 = Math['max'](value15, participantCount3['length']);
  if (!generatedProp && participantCount4 > 0) {
    const assetByRole = firstAssetByRole(assets, 'table');
    assetByRole &&
      ((generatedProp = createGeneratedProp(assetByRole, 'Dining table')), objects['push'](generatedProp));
  }
  if (!generatedProp || participantCount4 === 0)
    return { objects: objects, applied: ![], participantCount: participantCount4 };
  while (participantCount3['length'] < participantCount4) {
    const generatedCharacter = createGeneratedCharacter(participantCount3['length']);
    (objects['push'](generatedCharacter), participantCount3['push'](generatedCharacter));
  }
  let list5 = objects['filter']((value17) => hasSpatialRole(assetForObject(value17, value11), 'seat'));
  const assetByRole2 = firstAssetByRole(assets, 'seat');
  while (list5['length'] < participantCount3['length'] && assetByRole2) {
    const generatedProp2 = createGeneratedProp(assetByRole2, 'Dining chair');
    (objects['push'](generatedProp2), list5['push'](generatedProp2));
  }
  const storyboard3DAssetSpatialMetadata2 = resolveStoryboard3DAssetSpatialMetadata(
      assetForObject(generatedProp, value11),
    ),
    value18 = generatedProp['transform']['position'];
  value18[1] = 0;
  const value19 = storyboard3DAssetSpatialMetadata2['dimensions']['width'] / 2 + 0.6,
    value20 = storyboard3DAssetSpatialMetadata2['dimensions']['depth'] / 2 + 0.6,
    value21 = Math['min'](list5['length'], participantCount3['length']);
  for (let value22 = 0; value22 < value21; value22 += 1) {
    const angleForSlot2 = angleForSlot(value22, value21),
      value23 = [
        value18[0] + Math['cos'](angleForSlot2) * value19,
        0,
        value18[2] + Math['sin'](angleForSlot2) * value20,
      ],
      faceTowards2 = faceTowards(value18, value23),
      value24 = list5[value22];
    ((value24['transform']['position'] = value23), (value24['transform']['rotation'][1] = faceTowards2));
    const value25 = participantCount3[value22],
      storyboard3DAssetSpatialMetadata3 = resolveStoryboard3DAssetSpatialMetadata(
        assetForObject(value24, value11),
      );
    ((value25['transform']['position'] = [
      value23[0],
      storyboard3DAssetSpatialMetadata3['seatHeight'],
      value23[2],
    ]),
      (value25['transform']['rotation'][1] = faceTowards2),
      (value25['actionId'] = 'seated'),
      (value25['actionPlaying'] = ![]));
  }
  const list6 = objects['filter']((value26) =>
    hasSpatialRole(assetForObject(value26, value11), 'tabletop-item'),
  );
  return (
    list6['forEach']((value27, value28) => {
      const storyboard3DAssetSpatialMetadata4 = resolveStoryboard3DAssetSpatialMetadata(
          assetForObject(value27, value11),
        ),
        angleForSlot3 = angleForSlot(value28, Math['max'](1, list6['length'])),
        value29 =
          Math['min'](
            storyboard3DAssetSpatialMetadata2['dimensions']['width'],
            storyboard3DAssetSpatialMetadata2['dimensions']['depth'],
          ) * 0.22;
      value27['transform']['position'] = [
        value18[0] + Math['cos'](angleForSlot3) * value29,
        value18[1] +
          storyboard3DAssetSpatialMetadata2['supportHeight'] +
          storyboard3DAssetSpatialMetadata4['dimensions']['height'] / 2,
        value18[2] + Math['sin'](angleForSlot3) * value29,
      ];
    }),
    { objects: objects, applied: !![], participantCount: participantCount3['length'] }
  );
}

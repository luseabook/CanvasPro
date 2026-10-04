const FLOAT_PATTERN = '[-+]?(?:\\d*\\.\\d+|\\d+\\.?)(?:[eE][-+]?\\d+)?';
function finiteNumber(value, item = 0x0) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function emptyBounds() {
  return {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
}
function expandBounds(index, result, data, options) {
  ((index['min']['x'] = Math['min'](index['min']['x'], result)),
    (index['min']['y'] = Math['min'](index['min']['y'], data)),
    (index['min']['z'] = Math['min'](index['min']['z'], options)),
    (index['max']['x'] = Math['max'](index['max']['x'], result)),
    (index['max']['y'] = Math['max'](index['max']['y'], data)),
    (index['max']['z'] = Math['max'](index['max']['z'], options)));
}
function finalizeBounds(target) {
  const list = [
    target['min']['x'],
    target['min']['y'],
    target['min']['z'],
    target['max']['x'],
    target['max']['y'],
    target['max']['z'],
  ];
  return list['every'](Number['isFinite']) ? target : null;
}
function floatAttribute(list2, itemSize) {
  if (!list2?.['length']) return null;
  const array = new Float32Array(list2);
  return { array: array['buffer'], itemSize: itemSize, count: array['length'] / itemSize };
}
function createMeshPayload({
  name: name2,
  materialName: materialName,
  positions: positions,
  normals: normals,
  uvs: uvs,
  colors: colors,
}) {
  const attributes = { position: floatAttribute(positions, 0x3) },
    floatAttribute2 = floatAttribute(normals, 0x3),
    floatAttribute3 = floatAttribute(uvs, 0x2),
    floatAttribute4 = floatAttribute(colors, 0x3);
  if (floatAttribute2) attributes['normal'] = floatAttribute2;
  if (floatAttribute3) attributes['uv'] = floatAttribute3;
  if (floatAttribute4) attributes['color'] = floatAttribute4;
  return {
    name: String(name2 || 'Mesh'),
    materialName: String(materialName || ''),
    attributes: attributes,
    triangleCount: Math['floor'](positions['length'] / 0x9),
  };
}
function resolveObjIndex(source, next) {
  const count = Number['parseInt'](source, 0xa);
  if (!Number['isInteger'](count) || count === 0x0) return -0x1;
  const count2 = count > 0x0 ? count - 0x1 : next + count;
  return count2 >= 0x0 && count2 < next ? count2 : -0x1;
}
function objVertex(current, entry) {
  const [record, uv, normal] = String(current || '')['split']('/');
  return {
    position: resolveObjIndex(record, entry['positions']),
    uv: uv ? resolveObjIndex(uv, entry['uvs']) : -0x1,
    normal: normal ? resolveObjIndex(normal, entry['normals']) : -0x1,
  };
}
function pushTuple(list3, payload, handle, state, config = 0x0) {
  for (let scope = 0x0; scope < state; scope += 0x1) {
    list3['push'](finiteNumber(payload[handle * state + scope], config));
  }
}
export function parseStoryboard3DObjGeometry(
  input,
  { name: name = 'OBJ\x20model', onProgress: onProgress } = {},
) {
  const textDecoder = new TextDecoder()['decode'](input),
    list4 = textDecoder['split'](/\r?\n/),
    positions2 = [],
    normals2 = [],
    uvs2 = [],
    meshes = [],
    materialLibraries = [],
    emptyBounds2 = emptyBounds();
  let name3 = String(name || 'OBJ model')['replace'](/\.obj$/i, ''),
    materialName2 = '',
    normals3 = null;
  const run = () => {
      return (
        !normals3 &&
          (normals3 = {
            name: name3,
            materialName: materialName2,
            positions: [],
            normals: [],
            uvs: [],
            hasNormals: !![],
            hasUvs: !![],
          }),
        normals3
      );
    },
    handler = () => {
      if (!normals3?.['positions']['length']) {
        normals3 = null;
        return;
      }
      (meshes['push'](
        createMeshPayload({
          ...normals3,
          normals: normals3['hasNormals'] ? normals3['normals'] : [],
          uvs: normals3['hasUvs'] ? normals3['uvs'] : [],
        }),
      ),
        (normals3 = null));
    };
  onProgress?.(0.08);
  for (let count3 = 0x0; count3 < list4['length']; count3 += 0x1) {
    const list5 = list4[count3]['trim']();
    if (!list5 || list5['startsWith']('#')) continue;
    const count4 = list5['search'](/\s/),
      output = count4 < 0x0 ? list5 : list5['slice'](0x0, count4),
      value2 = count4 < 0x0 ? '' : list5['slice'](count4)['trim']();
    if (output === 'v') {
      const list6 = value2['split'](/\s+/)['slice'](0x0, 0x3)['map'](Number);
      if (list6['length'] === 0x3 && list6['every'](Number['isFinite'])) positions2['push'](...list6);
    } else {
      if (output === 'vn') {
        const list7 = value2['split'](/\s+/)['slice'](0x0, 0x3)['map'](Number);
        if (list7['length'] === 0x3 && list7['every'](Number['isFinite'])) normals2['push'](...list7);
      } else {
        if (output === 'vt') {
          const list8 = value2['split'](/\s+/)['slice'](0x0, 0x2)['map'](Number);
          if (list8['length'] >= 0x2 && list8['every'](Number['isFinite'])) uvs2['push'](...list8);
        } else {
          if (output === 'o' || output === 'g') (handler(), (name3 = value2 || name3));
          else {
            if (output === 'usemtl') (handler(), (materialName2 = value2));
            else {
              if (output === 'mtllib') {
                if (value2) materialLibraries['push'](value2);
              } else {
                if (output === 'f') {
                  const list9 = value2['split'](/\s+/)
                    ['filter'](Boolean)
                    ['map']((value3) =>
                      objVertex(value3, {
                        positions: positions2['length'] / 0x3,
                        normals: normals2['length'] / 0x3,
                        uvs: uvs2['length'] / 0x2,
                      }),
                    );
                  if (list9['length'] < 0x3 || list9['some']((value4) => value4['position'] < 0x0)) continue;
                  const value5 = run();
                  for (let value6 = 0x1; value6 < list9['length'] - 0x1; value6 += 0x1) {
                    for (const value7 of [list9[0x0], list9[value6], list9[value6 + 0x1]]) {
                      pushTuple(value5['positions'], positions2, value7['position'], 0x3);
                      const value8 = value5['positions']['length'] - 0x3;
                      expandBounds(
                        emptyBounds2,
                        value5['positions'][value8],
                        value5['positions'][value8 + 0x1],
                        value5['positions'][value8 + 0x2],
                      );
                      if (value7['normal'] >= 0x0)
                        pushTuple(value5['normals'], normals2, value7['normal'], 0x3);
                      else value5['hasNormals'] = ![];
                      if (value7['uv'] >= 0x0) pushTuple(value5['uvs'], uvs2, value7['uv'], 0x2);
                      else value5['hasUvs'] = ![];
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    count3 > 0x0 &&
      count3 % 0x1000 === 0x0 &&
      onProgress?.(0.08 + (count3 / Math['max'](0x1, list4['length'])) * 0.82);
  }
  handler();
  if (!meshes['length']) throw new Error('OBJ did not contain any triangle faces.');
  return (
    onProgress?.(0x1),
    {
      format: 'obj',
      name: String(name || 'OBJ model')['replace'](/\.obj$/i, ''),
      meshes: meshes,
      bounds: finalizeBounds(emptyBounds2),
      triangleCount: meshes['reduce']((value9, value10) => value9 + value10['triangleCount'], 0x0),
      materialLibraries: materialLibraries,
    }
  );
}
function isBinaryStl(value11) {
  if (value11['byteLength'] < 0x54) return ![];
  const dataView = new DataView(value11['buffer'], value11['byteOffset'], value11['byteLength'])['getUint32'](
    0x50,
    !![],
  );
  return 0x54 + dataView * 0x32 <= value11['byteLength'];
}
function parseBinaryStl(value12, value13) {
  const dataView2 = new DataView(value12['buffer'], value12['byteOffset'], value12['byteLength']),
    triangleCount = dataView2['getUint32'](0x50, !![]),
    positions3 = new Float32Array(triangleCount * 0x9),
    normals4 = new Float32Array(triangleCount * 0x9),
    emptyBounds3 = emptyBounds();
  let value14 = 0x0,
    value15 = 0x54;
  value13?.(0.08);
  for (let count5 = 0x0; count5 < triangleCount; count5 += 0x1) {
    const value16 = dataView2['getFloat32'](value15, !![]),
      value17 = dataView2['getFloat32'](value15 + 0x4, !![]),
      value18 = dataView2['getFloat32'](value15 + 0x8, !![]);
    value15 += 0xc;
    for (let count6 = 0x0; count6 < 0x3; count6 += 0x1) {
      const value19 = dataView2['getFloat32'](value15, !![]),
        value20 = dataView2['getFloat32'](value15 + 0x4, !![]),
        value21 = dataView2['getFloat32'](value15 + 0x8, !![]);
      ((positions3[value14] = value19),
        (positions3[value14 + 0x1] = value20),
        (positions3[value14 + 0x2] = value21),
        (normals4[value14] = value16),
        (normals4[value14 + 0x1] = value17),
        (normals4[value14 + 0x2] = value18),
        expandBounds(emptyBounds3, value19, value20, value21),
        (value14 += 0x3),
        (value15 += 0xc));
    }
    ((value15 += 0x2),
      count5 > 0x0 &&
        count5 % 0x2000 === 0x0 &&
        value13?.(0.08 + (count5 / Math['max'](0x1, triangleCount)) * 0.82));
  }
  return {
    positions: positions3,
    normals: normals4,
    bounds: finalizeBounds(emptyBounds3),
    triangleCount: triangleCount,
  };
}
function parseAsciiStl(value22, value23) {
  const list10 = new TextDecoder()['decode'](value22),
    regExp = new RegExp(
      'facet\\s+normal\\s+(' +
        FLOAT_PATTERN +
        ')\\s+(' +
        FLOAT_PATTERN +
        ')\x5cs+(' +
        FLOAT_PATTERN +
        ')\\s+outer\\s+loop([\\s\\S]*?)endloop',
      'gi',
    ),
    regExp2 = new RegExp(
      'vertex\\s+(' + FLOAT_PATTERN + ')\\s+(' + FLOAT_PATTERN + ')\\s+(' + FLOAT_PATTERN + ')',
      'gi',
    ),
    list11 = [],
    list12 = [],
    emptyBounds4 = emptyBounds();
  let list13,
    triangleCount2 = 0x0;
  value23?.(0.08);
  while ((list13 = regExp['exec'](list10))) {
    const args = list13['slice'](0x1, 0x4)['map'](Number),
      list14 = [...list13[0x4]['matchAll'](regExp2)]['slice'](0x0, 0x3);
    if (list14['length'] !== 0x3) continue;
    for (const list15 of list14) {
      const args2 = list15['slice'](0x1, 0x4)['map'](Number);
      (list11['push'](...args2),
        list12['push'](...args),
        expandBounds(emptyBounds4, args2[0x0], args2[0x1], args2[0x2]));
    }
    triangleCount2 += 0x1;
    if (triangleCount2 % 0x1000 === 0x0)
      value23?.(Math['min'](0.9, regExp['lastIndex'] / Math['max'](0x1, list10['length'])));
  }
  if (!triangleCount2) throw new Error('STL did not contain any triangle facets.');
  return {
    positions: new Float32Array(list11),
    normals: new Float32Array(list12),
    bounds: finalizeBounds(emptyBounds4),
    triangleCount: triangleCount2,
  };
}
export function parseStoryboard3DStlGeometry(
  value24,
  { name: name = 'STL\x20model', onProgress: onProgress2 } = {},
) {
  const value25 = value24 instanceof Uint8Array ? value24 : new Uint8Array(value24),
    array2 = isBinaryStl(value25)
      ? parseBinaryStl(value25, onProgress2)
      : parseAsciiStl(value25, onProgress2);
  return (
    onProgress2?.(0x1),
    {
      format: 'stl',
      name: String(name || 'STL model')['replace'](/\.stl$/i, ''),
      meshes: [
        {
          name: String(name || 'STL model')['replace'](/\.stl$/i, ''),
          materialName: '',
          attributes: {
            position: {
              array: array2['positions']['buffer'],
              itemSize: 0x3,
              count: array2['positions']['length'] / 0x3,
            },
            normal: {
              array: array2['normals']['buffer'],
              itemSize: 0x3,
              count: array2['normals']['length'] / 0x3,
            },
          },
          triangleCount: array2['triangleCount'],
        },
      ],
      bounds: array2['bounds'],
      triangleCount: array2['triangleCount'],
      materialLibraries: [],
    }
  );
}
export function parseStoryboard3DWorkerGeometry({
  format: format,
  buffer: buffer,
  name: name4,
  onProgress: onProgress3,
} = {}) {
  if (!(buffer instanceof ArrayBuffer))
    throw new TypeError('Worker\x20geometry\x20import\x20requires\x20an\x20ArrayBuffer.');
  if (format === 'obj') return parseStoryboard3DObjGeometry(buffer, { name: name4, onProgress: onProgress3 });
  if (format === 'stl') return parseStoryboard3DStlGeometry(buffer, { name: name4, onProgress: onProgress3 });
  throw new Error(
    'Worker geometry import does not support ' + String(format || 'unknown')['toUpperCase']() + '.',
  );
}
export function collectStoryboard3DGeometryTransferables(value26) {
  const list16 = [];
  for (const value27 of value26?.['meshes'] || []) {
    for (const value28 of Object['values'](value27?.['attributes'] || {})) {
      if (value28?.['array'] instanceof ArrayBuffer) list16['push'](value28['array']);
    }
    if (value27?.['index']?.['array'] instanceof ArrayBuffer) list16['push'](value27['index']['array']);
  }
  return list16;
}

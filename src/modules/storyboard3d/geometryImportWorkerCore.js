const FLOAT_PATTERN = '[-+]?(?:\\d*\\.\\d+|\\d+\\.?)(?:[eE][-+]?\\d+)?';
function finiteNumber(_0x2dafaf, _0xbc88db = 0x0) {
  const _0x4d681a = Number(_0x2dafaf);
  return Number['isFinite'](_0x4d681a) ? _0x4d681a : _0xbc88db;
}
function emptyBounds() {
  return {
    min: { x: Infinity, y: Infinity, z: Infinity },
    max: { x: -Infinity, y: -Infinity, z: -Infinity },
  };
}
function expandBounds(_0x1c2e0c, _0x44b7d1, _0xa175a7, _0x4a71ba) {
  ((_0x1c2e0c['min']['x'] = Math['min'](_0x1c2e0c['min']['x'], _0x44b7d1)),
    (_0x1c2e0c['min']['y'] = Math['min'](_0x1c2e0c['min']['y'], _0xa175a7)),
    (_0x1c2e0c['min']['z'] = Math['min'](_0x1c2e0c['min']['z'], _0x4a71ba)),
    (_0x1c2e0c['max']['x'] = Math['max'](_0x1c2e0c['max']['x'], _0x44b7d1)),
    (_0x1c2e0c['max']['y'] = Math['max'](_0x1c2e0c['max']['y'], _0xa175a7)),
    (_0x1c2e0c['max']['z'] = Math['max'](_0x1c2e0c['max']['z'], _0x4a71ba)));
}
function finalizeBounds(_0x5025d1) {
  const _0x31ce9d = [
    _0x5025d1['min']['x'],
    _0x5025d1['min']['y'],
    _0x5025d1['min']['z'],
    _0x5025d1['max']['x'],
    _0x5025d1['max']['y'],
    _0x5025d1['max']['z'],
  ];
  return _0x31ce9d['every'](Number['isFinite']) ? _0x5025d1 : null;
}
function floatAttribute(_0x255168, _0x5ccc9d) {
  if (!_0x255168?.['length']) return null;
  const _0x5cad04 = new Float32Array(_0x255168);
  return { array: _0x5cad04['buffer'], itemSize: _0x5ccc9d, count: _0x5cad04['length'] / _0x5ccc9d };
}
function createMeshPayload({
  name: _0x20a84a,
  materialName: _0xc89c2f,
  positions: _0x3b2b24,
  normals: _0x256dd9,
  uvs: _0x33c30b,
  colors: _0x27dac7,
}) {
  const _0x26a3a6 = { position: floatAttribute(_0x3b2b24, 0x3) },
    _0x4d14c3 = floatAttribute(_0x256dd9, 0x3),
    _0x2f870e = floatAttribute(_0x33c30b, 0x2),
    _0x1b2361 = floatAttribute(_0x27dac7, 0x3);
  if (_0x4d14c3) _0x26a3a6['normal'] = _0x4d14c3;
  if (_0x2f870e) _0x26a3a6['uv'] = _0x2f870e;
  if (_0x1b2361) _0x26a3a6['color'] = _0x1b2361;
  return {
    name: String(_0x20a84a || 'Mesh'),
    materialName: String(_0xc89c2f || ''),
    attributes: _0x26a3a6,
    triangleCount: Math['floor'](_0x3b2b24['length'] / 0x9),
  };
}
function resolveObjIndex(_0x542502, _0x333d74) {
  const _0x1886e4 = Number['parseInt'](_0x542502, 0xa);
  if (!Number['isInteger'](_0x1886e4) || _0x1886e4 === 0x0) return -0x1;
  const _0x2f6785 = _0x1886e4 > 0x0 ? _0x1886e4 - 0x1 : _0x333d74 + _0x1886e4;
  return _0x2f6785 >= 0x0 && _0x2f6785 < _0x333d74 ? _0x2f6785 : -0x1;
}
function objVertex(_0x310b14, _0x22490d) {
  const [_0x5b0b82, _0x4b9b57, _0x4e5dfb] = String(_0x310b14 || '')['split']('/');
  return {
    position: resolveObjIndex(_0x5b0b82, _0x22490d['positions']),
    uv: _0x4b9b57 ? resolveObjIndex(_0x4b9b57, _0x22490d['uvs']) : -0x1,
    normal: _0x4e5dfb ? resolveObjIndex(_0x4e5dfb, _0x22490d['normals']) : -0x1,
  };
}
function pushTuple(_0x2021df, _0x59cba4, _0xb415ac, _0x29c85b, _0x203820 = 0x0) {
  for (let _0x1f90f1 = 0x0; _0x1f90f1 < _0x29c85b; _0x1f90f1 += 0x1) {
    _0x2021df['push'](finiteNumber(_0x59cba4[_0xb415ac * _0x29c85b + _0x1f90f1], _0x203820));
  }
}
export function parseStoryboard3DObjGeometry(
  _0x59ed4c,
  { name: name = 'OBJ\x20model', onProgress: _0x23e7f3 } = {},
) {
  const _0x12c37e = new TextDecoder()['decode'](_0x59ed4c),
    _0x1a41d9 = _0x12c37e['split'](/\r?\n/),
    _0x996894 = [],
    _0x5f0d6e = [],
    _0x1782b4 = [],
    _0x46cf8c = [],
    _0x1c88b2 = [],
    _0x127b43 = emptyBounds();
  let _0x5c474b = String(name || 'OBJ model')['replace'](/\.obj$/i, ''),
    _0x4689ed = '',
    _0x485d6e = null;
  const _0x41231f = () => {
      return (
        !_0x485d6e &&
          (_0x485d6e = {
            name: _0x5c474b,
            materialName: _0x4689ed,
            positions: [],
            normals: [],
            uvs: [],
            hasNormals: !![],
            hasUvs: !![],
          }),
        _0x485d6e
      );
    },
    _0x2651ab = () => {
      if (!_0x485d6e?.['positions']['length']) {
        _0x485d6e = null;
        return;
      }
      (_0x46cf8c['push'](
        createMeshPayload({
          ..._0x485d6e,
          normals: _0x485d6e['hasNormals'] ? _0x485d6e['normals'] : [],
          uvs: _0x485d6e['hasUvs'] ? _0x485d6e['uvs'] : [],
        }),
      ),
        (_0x485d6e = null));
    };
  _0x23e7f3?.(0.08);
  for (let _0xf26087 = 0x0; _0xf26087 < _0x1a41d9['length']; _0xf26087 += 0x1) {
    const _0x8d5560 = _0x1a41d9[_0xf26087]['trim']();
    if (!_0x8d5560 || _0x8d5560['startsWith']('#')) continue;
    const _0x5bfe0 = _0x8d5560['search'](/\s/),
      _0xec5335 = _0x5bfe0 < 0x0 ? _0x8d5560 : _0x8d5560['slice'](0x0, _0x5bfe0),
      _0x45c772 = _0x5bfe0 < 0x0 ? '' : _0x8d5560['slice'](_0x5bfe0)['trim']();
    if (_0xec5335 === 'v') {
      const _0x40a616 = _0x45c772['split'](/\s+/)['slice'](0x0, 0x3)['map'](Number);
      if (_0x40a616['length'] === 0x3 && _0x40a616['every'](Number['isFinite']))
        _0x996894['push'](..._0x40a616);
    } else {
      if (_0xec5335 === 'vn') {
        const _0x52cfd0 = _0x45c772['split'](/\s+/)['slice'](0x0, 0x3)['map'](Number);
        if (_0x52cfd0['length'] === 0x3 && _0x52cfd0['every'](Number['isFinite']))
          _0x5f0d6e['push'](..._0x52cfd0);
      } else {
        if (_0xec5335 === 'vt') {
          const _0x4f9fdd = _0x45c772['split'](/\s+/)['slice'](0x0, 0x2)['map'](Number);
          if (_0x4f9fdd['length'] >= 0x2 && _0x4f9fdd['every'](Number['isFinite']))
            _0x1782b4['push'](..._0x4f9fdd);
        } else {
          if (_0xec5335 === 'o' || _0xec5335 === 'g') (_0x2651ab(), (_0x5c474b = _0x45c772 || _0x5c474b));
          else {
            if (_0xec5335 === 'usemtl') (_0x2651ab(), (_0x4689ed = _0x45c772));
            else {
              if (_0xec5335 === 'mtllib') {
                if (_0x45c772) _0x1c88b2['push'](_0x45c772);
              } else {
                if (_0xec5335 === 'f') {
                  const _0x2d15b0 = _0x45c772['split'](/\s+/)
                    ['filter'](Boolean)
                    ['map']((_0x4497ce) =>
                      objVertex(_0x4497ce, {
                        positions: _0x996894['length'] / 0x3,
                        normals: _0x5f0d6e['length'] / 0x3,
                        uvs: _0x1782b4['length'] / 0x2,
                      }),
                    );
                  if (
                    _0x2d15b0['length'] < 0x3 ||
                    _0x2d15b0['some']((_0x48732e) => _0x48732e['position'] < 0x0)
                  )
                    continue;
                  const _0xc343b3 = _0x41231f();
                  for (let _0x107263 = 0x1; _0x107263 < _0x2d15b0['length'] - 0x1; _0x107263 += 0x1) {
                    for (const _0x1d4379 of [
                      _0x2d15b0[0x0],
                      _0x2d15b0[_0x107263],
                      _0x2d15b0[_0x107263 + 0x1],
                    ]) {
                      pushTuple(_0xc343b3['positions'], _0x996894, _0x1d4379['position'], 0x3);
                      const _0x14fa09 = _0xc343b3['positions']['length'] - 0x3;
                      expandBounds(
                        _0x127b43,
                        _0xc343b3['positions'][_0x14fa09],
                        _0xc343b3['positions'][_0x14fa09 + 0x1],
                        _0xc343b3['positions'][_0x14fa09 + 0x2],
                      );
                      if (_0x1d4379['normal'] >= 0x0)
                        pushTuple(_0xc343b3['normals'], _0x5f0d6e, _0x1d4379['normal'], 0x3);
                      else _0xc343b3['hasNormals'] = ![];
                      if (_0x1d4379['uv'] >= 0x0)
                        pushTuple(_0xc343b3['uvs'], _0x1782b4, _0x1d4379['uv'], 0x2);
                      else _0xc343b3['hasUvs'] = ![];
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    _0xf26087 > 0x0 &&
      _0xf26087 % 0x1000 === 0x0 &&
      _0x23e7f3?.(0.08 + (_0xf26087 / Math['max'](0x1, _0x1a41d9['length'])) * 0.82);
  }
  _0x2651ab();
  if (!_0x46cf8c['length']) throw new Error('OBJ did not contain any triangle faces.');
  return (
    _0x23e7f3?.(0x1),
    {
      format: 'obj',
      name: String(name || 'OBJ model')['replace'](/\.obj$/i, ''),
      meshes: _0x46cf8c,
      bounds: finalizeBounds(_0x127b43),
      triangleCount: _0x46cf8c['reduce'](
        (_0x34faff, _0x42be0c) => _0x34faff + _0x42be0c['triangleCount'],
        0x0,
      ),
      materialLibraries: _0x1c88b2,
    }
  );
}
function isBinaryStl(_0x463d21) {
  if (_0x463d21['byteLength'] < 0x54) return ![];
  const _0x3f8da5 = new DataView(_0x463d21['buffer'], _0x463d21['byteOffset'], _0x463d21['byteLength'])[
    'getUint32'
  ](0x50, !![]);
  return 0x54 + _0x3f8da5 * 0x32 <= _0x463d21['byteLength'];
}
function parseBinaryStl(_0xdfef42, _0x42cca2) {
  const _0x27f180 = new DataView(_0xdfef42['buffer'], _0xdfef42['byteOffset'], _0xdfef42['byteLength']),
    _0x1ad5b3 = _0x27f180['getUint32'](0x50, !![]),
    _0x2c73fe = new Float32Array(_0x1ad5b3 * 0x9),
    _0xd101dc = new Float32Array(_0x1ad5b3 * 0x9),
    _0x5f021e = emptyBounds();
  let _0x1ebb2b = 0x0,
    _0x219980 = 0x54;
  _0x42cca2?.(0.08);
  for (let _0x33ddf4 = 0x0; _0x33ddf4 < _0x1ad5b3; _0x33ddf4 += 0x1) {
    const _0x19ccf9 = _0x27f180['getFloat32'](_0x219980, !![]),
      _0x1d7b1a = _0x27f180['getFloat32'](_0x219980 + 0x4, !![]),
      _0x5aec07 = _0x27f180['getFloat32'](_0x219980 + 0x8, !![]);
    _0x219980 += 0xc;
    for (let _0x6dbef1 = 0x0; _0x6dbef1 < 0x3; _0x6dbef1 += 0x1) {
      const _0x3ee81e = _0x27f180['getFloat32'](_0x219980, !![]),
        _0x364dc9 = _0x27f180['getFloat32'](_0x219980 + 0x4, !![]),
        _0x16f81c = _0x27f180['getFloat32'](_0x219980 + 0x8, !![]);
      ((_0x2c73fe[_0x1ebb2b] = _0x3ee81e),
        (_0x2c73fe[_0x1ebb2b + 0x1] = _0x364dc9),
        (_0x2c73fe[_0x1ebb2b + 0x2] = _0x16f81c),
        (_0xd101dc[_0x1ebb2b] = _0x19ccf9),
        (_0xd101dc[_0x1ebb2b + 0x1] = _0x1d7b1a),
        (_0xd101dc[_0x1ebb2b + 0x2] = _0x5aec07),
        expandBounds(_0x5f021e, _0x3ee81e, _0x364dc9, _0x16f81c),
        (_0x1ebb2b += 0x3),
        (_0x219980 += 0xc));
    }
    ((_0x219980 += 0x2),
      _0x33ddf4 > 0x0 &&
        _0x33ddf4 % 0x2000 === 0x0 &&
        _0x42cca2?.(0.08 + (_0x33ddf4 / Math['max'](0x1, _0x1ad5b3)) * 0.82));
  }
  return {
    positions: _0x2c73fe,
    normals: _0xd101dc,
    bounds: finalizeBounds(_0x5f021e),
    triangleCount: _0x1ad5b3,
  };
}
function parseAsciiStl(_0x46897f, _0x233c5e) {
  const _0x40184b = new TextDecoder()['decode'](_0x46897f),
    _0x272193 = new RegExp(
      'facet\\s+normal\\s+(' +
        FLOAT_PATTERN +
        ')\\s+(' +
        FLOAT_PATTERN +
        ')\x5cs+(' +
        FLOAT_PATTERN +
        ')\\s+outer\\s+loop([\\s\\S]*?)endloop',
      'gi',
    ),
    _0x1d2395 = new RegExp(
      'vertex\\s+(' + FLOAT_PATTERN + ')\\s+(' + FLOAT_PATTERN + ')\\s+(' + FLOAT_PATTERN + ')',
      'gi',
    ),
    _0x2cda6f = [],
    _0x56acab = [],
    _0xb17793 = emptyBounds();
  let _0x28def6,
    _0x3ec4c3 = 0x0;
  _0x233c5e?.(0.08);
  while ((_0x28def6 = _0x272193['exec'](_0x40184b))) {
    const _0x74e019 = _0x28def6['slice'](0x1, 0x4)['map'](Number),
      _0x3e55f1 = [..._0x28def6[0x4]['matchAll'](_0x1d2395)]['slice'](0x0, 0x3);
    if (_0x3e55f1['length'] !== 0x3) continue;
    for (const _0x566a8f of _0x3e55f1) {
      const _0x31e1ba = _0x566a8f['slice'](0x1, 0x4)['map'](Number);
      (_0x2cda6f['push'](..._0x31e1ba),
        _0x56acab['push'](..._0x74e019),
        expandBounds(_0xb17793, _0x31e1ba[0x0], _0x31e1ba[0x1], _0x31e1ba[0x2]));
    }
    _0x3ec4c3 += 0x1;
    if (_0x3ec4c3 % 0x1000 === 0x0)
      _0x233c5e?.(Math['min'](0.9, _0x272193['lastIndex'] / Math['max'](0x1, _0x40184b['length'])));
  }
  if (!_0x3ec4c3) throw new Error('STL did not contain any triangle facets.');
  return {
    positions: new Float32Array(_0x2cda6f),
    normals: new Float32Array(_0x56acab),
    bounds: finalizeBounds(_0xb17793),
    triangleCount: _0x3ec4c3,
  };
}
export function parseStoryboard3DStlGeometry(
  _0x214341,
  { name: name = 'STL\x20model', onProgress: _0xb25776 } = {},
) {
  const _0x388af7 = _0x214341 instanceof Uint8Array ? _0x214341 : new Uint8Array(_0x214341),
    _0x49e64a = isBinaryStl(_0x388af7)
      ? parseBinaryStl(_0x388af7, _0xb25776)
      : parseAsciiStl(_0x388af7, _0xb25776);
  return (
    _0xb25776?.(0x1),
    {
      format: 'stl',
      name: String(name || 'STL model')['replace'](/\.stl$/i, ''),
      meshes: [
        {
          name: String(name || 'STL model')['replace'](/\.stl$/i, ''),
          materialName: '',
          attributes: {
            position: {
              array: _0x49e64a['positions']['buffer'],
              itemSize: 0x3,
              count: _0x49e64a['positions']['length'] / 0x3,
            },
            normal: {
              array: _0x49e64a['normals']['buffer'],
              itemSize: 0x3,
              count: _0x49e64a['normals']['length'] / 0x3,
            },
          },
          triangleCount: _0x49e64a['triangleCount'],
        },
      ],
      bounds: _0x49e64a['bounds'],
      triangleCount: _0x49e64a['triangleCount'],
      materialLibraries: [],
    }
  );
}
export function parseStoryboard3DWorkerGeometry({
  format: _0x4471ea,
  buffer: _0x4da9f3,
  name: _0xb7b555,
  onProgress: _0x22d314,
} = {}) {
  if (!(_0x4da9f3 instanceof ArrayBuffer))
    throw new TypeError('Worker\x20geometry\x20import\x20requires\x20an\x20ArrayBuffer.');
  if (_0x4471ea === 'obj')
    return parseStoryboard3DObjGeometry(_0x4da9f3, { name: _0xb7b555, onProgress: _0x22d314 });
  if (_0x4471ea === 'stl')
    return parseStoryboard3DStlGeometry(_0x4da9f3, { name: _0xb7b555, onProgress: _0x22d314 });
  throw new Error(
    'Worker geometry import does not support ' + String(_0x4471ea || 'unknown')['toUpperCase']() + '.',
  );
}
export function collectStoryboard3DGeometryTransferables(_0x139f4b) {
  const _0x4a0e7c = [];
  for (const _0x43a8d6 of _0x139f4b?.['meshes'] || []) {
    for (const _0x525534 of Object['values'](_0x43a8d6?.['attributes'] || {})) {
      if (_0x525534?.['array'] instanceof ArrayBuffer) _0x4a0e7c['push'](_0x525534['array']);
    }
    if (_0x43a8d6?.['index']?.['array'] instanceof ArrayBuffer)
      _0x4a0e7c['push'](_0x43a8d6['index']['array']);
  }
  return _0x4a0e7c;
}

import {
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InterleavedBuffer,
  InterleavedBufferAttribute,
  TriangleFanDrawMode,
  TriangleStripDrawMode,
  TrianglesDrawMode,
  Vector3,
} from '../../../three.module.js';
function computeMikkTSpaceTangents(_0x568215, _0x472b91, _0x315cfe = true) {
  if (!_0x472b91 || !_0x472b91.isReady)
    throw new Error('BufferGeometryUtils: Initialized MikkTSpace library required.');
  if (
    !_0x568215.hasAttribute('position') ||
    !_0x568215.hasAttribute('normal') ||
    !_0x568215.hasAttribute('uv')
  )
    throw new Error('BufferGeometryUtils: Tangents require "position", "normal", and "uv" attributes.');
  function _0x1ae59f(_0x59a388) {
    if (_0x59a388.normalized || _0x59a388.isInterleavedBufferAttribute) {
      const _0x26784f = new Float32Array(_0x59a388.count * _0x59a388.itemSize);
      for (let _0x1e4e76 = 0, _0x402dd4 = 0; _0x1e4e76 < _0x59a388.count; _0x1e4e76++) {
        ((_0x26784f[_0x402dd4++] = _0x59a388.getX(_0x1e4e76)),
          (_0x26784f[_0x402dd4++] = _0x59a388.getY(_0x1e4e76)),
          _0x59a388.itemSize > 2 && (_0x26784f[_0x402dd4++] = _0x59a388.getZ(_0x1e4e76)));
      }
      return _0x26784f;
    }
    if (_0x59a388.array instanceof Float32Array) return _0x59a388.array;
    return new Float32Array(_0x59a388.array);
  }
  const _0x5493e5 = _0x568215.index ? _0x568215.toNonIndexed() : _0x568215,
    _0x326e23 = _0x472b91.generateTangents(
      _0x1ae59f(_0x5493e5.attributes.position),
      _0x1ae59f(_0x5493e5.attributes.normal),
      _0x1ae59f(_0x5493e5.attributes.uv),
    );
  if (_0x315cfe)
    for (let _0x375edb = 3; _0x375edb < _0x326e23.length; _0x375edb += 4) {
      _0x326e23[_0x375edb] *= -1;
    }
  return (
    _0x5493e5.setAttribute('tangent', new BufferAttribute(_0x326e23, 4)),
    _0x568215 !== _0x5493e5 && _0x568215.copy(_0x5493e5),
    _0x568215
  );
}
function mergeGeometries(_0x2bc894, _0x222847 = false) {
  const _0x2e2b59 = _0x2bc894[0].index !== null,
    _0x587990 = new Set(Object.keys(_0x2bc894[0].attributes)),
    _0x57a5ee = new Set(Object.keys(_0x2bc894[0].morphAttributes)),
    _0x21c7f3 = {},
    _0x5a032b = {},
    _0x3bda74 = _0x2bc894[0].morphTargetsRelative,
    _0x2d2eeb = new BufferGeometry();
  let _0xf7ff8c = 0;
  for (let _0x428f37 = 0; _0x428f37 < _0x2bc894.length; ++_0x428f37) {
    const _0x48067d = _0x2bc894[_0x428f37];
    let _0x46c1d7 = 0;
    if (_0x2e2b59 !== (_0x48067d.index !== null))
      return (
        console.error(
          'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' +
            _0x428f37 +
            '. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.',
        ),
        null
      );
    for (const _0x367c37 in _0x48067d.attributes) {
      if (!_0x587990.has(_0x367c37))
        return (
          console.error(
            'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' +
              _0x428f37 +
              '. All geometries must have compatible attributes; make sure "' +
              _0x367c37 +
              '" attribute exists among all geometries, or in none of them.',
          ),
          null
        );
      if (_0x21c7f3[_0x367c37] === undefined) _0x21c7f3[_0x367c37] = [];
      (_0x21c7f3[_0x367c37].push(_0x48067d.attributes[_0x367c37]), _0x46c1d7++);
    }
    if (_0x46c1d7 !== _0x587990.size)
      return (
        console.error(
          'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' +
            _0x428f37 +
            '. Make sure all geometries have the same number of attributes.',
        ),
        null
      );
    if (_0x3bda74 !== _0x48067d.morphTargetsRelative)
      return (
        console.error(
          'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' +
            _0x428f37 +
            '. .morphTargetsRelative must be consistent throughout all geometries.',
        ),
        null
      );
    for (const _0x330e8e in _0x48067d.morphAttributes) {
      if (!_0x57a5ee.has(_0x330e8e))
        return (
          console.error(
            'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' +
              _0x428f37 +
              '.  .morphAttributes must be consistent throughout all geometries.',
          ),
          null
        );
      if (_0x5a032b[_0x330e8e] === undefined) _0x5a032b[_0x330e8e] = [];
      _0x5a032b[_0x330e8e].push(_0x48067d.morphAttributes[_0x330e8e]);
    }
    if (_0x222847) {
      let _0x19b800;
      if (_0x2e2b59) _0x19b800 = _0x48067d.index.count;
      else {
        if (_0x48067d.attributes.position !== undefined) _0x19b800 = _0x48067d.attributes.position.count;
        else
          return (
            console.error(
              'THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' +
                _0x428f37 +
                '. The geometry must have either an index or a position attribute',
            ),
            null
          );
      }
      (_0x2d2eeb.addGroup(_0xf7ff8c, _0x19b800, _0x428f37), (_0xf7ff8c += _0x19b800));
    }
  }
  if (_0x2e2b59) {
    let _0x52617d = 0;
    const _0x4d3040 = [];
    for (let _0x5df326 = 0; _0x5df326 < _0x2bc894.length; ++_0x5df326) {
      const _0x1eeda3 = _0x2bc894[_0x5df326].index;
      for (let _0x31e6a1 = 0; _0x31e6a1 < _0x1eeda3.count; ++_0x31e6a1) {
        _0x4d3040.push(_0x1eeda3.getX(_0x31e6a1) + _0x52617d);
      }
      _0x52617d += _0x2bc894[_0x5df326].attributes.position.count;
    }
    _0x2d2eeb.setIndex(_0x4d3040);
  }
  for (const _0x3b79e8 in _0x21c7f3) {
    const _0x4f8caf = mergeAttributes(_0x21c7f3[_0x3b79e8]);
    if (!_0x4f8caf)
      return (
        console.error(
          'THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' +
            _0x3b79e8 +
            ' attribute.',
        ),
        null
      );
    _0x2d2eeb.setAttribute(_0x3b79e8, _0x4f8caf);
  }
  for (const _0x3e29ab in _0x5a032b) {
    const _0x598e4c = _0x5a032b[_0x3e29ab][0].length;
    if (_0x598e4c === 0) break;
    ((_0x2d2eeb.morphAttributes = _0x2d2eeb.morphAttributes || {}),
      (_0x2d2eeb.morphAttributes[_0x3e29ab] = []));
    for (let _0x196067 = 0; _0x196067 < _0x598e4c; ++_0x196067) {
      const _0x1a25e3 = [];
      for (let _0x33f8e7 = 0; _0x33f8e7 < _0x5a032b[_0x3e29ab].length; ++_0x33f8e7) {
        _0x1a25e3.push(_0x5a032b[_0x3e29ab][_0x33f8e7][_0x196067]);
      }
      const _0x164028 = mergeAttributes(_0x1a25e3);
      if (!_0x164028)
        return (
          console.error(
            'THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' +
              _0x3e29ab +
              ' morphAttribute.',
          ),
          null
        );
      _0x2d2eeb.morphAttributes[_0x3e29ab].push(_0x164028);
    }
  }
  return _0x2d2eeb;
}
function mergeAttributes(_0x449597) {
  let _0x6051c,
    _0x539b63,
    _0x4925bd,
    _0x2f22bf = -1,
    _0x3acde8 = 0;
  for (let _0x4a32de = 0; _0x4a32de < _0x449597.length; ++_0x4a32de) {
    const _0x192a4b = _0x449597[_0x4a32de];
    if (_0x6051c === undefined) _0x6051c = _0x192a4b.array.constructor;
    if (_0x6051c !== _0x192a4b.array.constructor)
      return (
        console.error(
          'THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.',
        ),
        null
      );
    if (_0x539b63 === undefined) _0x539b63 = _0x192a4b.itemSize;
    if (_0x539b63 !== _0x192a4b.itemSize)
      return (
        console.error(
          'THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.',
        ),
        null
      );
    if (_0x4925bd === undefined) _0x4925bd = _0x192a4b.normalized;
    if (_0x4925bd !== _0x192a4b.normalized)
      return (
        console.error(
          'THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.',
        ),
        null
      );
    if (_0x2f22bf === -1) _0x2f22bf = _0x192a4b.gpuType;
    if (_0x2f22bf !== _0x192a4b.gpuType)
      return (
        console.error(
          'THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.',
        ),
        null
      );
    _0x3acde8 += _0x192a4b.count * _0x539b63;
  }
  const _0x432774 = new _0x6051c(_0x3acde8),
    _0x52f682 = new BufferAttribute(_0x432774, _0x539b63, _0x4925bd);
  let _0x502ae2 = 0;
  for (let _0x2aeeec = 0; _0x2aeeec < _0x449597.length; ++_0x2aeeec) {
    const _0x188e3a = _0x449597[_0x2aeeec];
    if (_0x188e3a.isInterleavedBufferAttribute) {
      const _0xb68c62 = _0x502ae2 / _0x539b63;
      for (let _0x1549a5 = 0, _0x4e9f83 = _0x188e3a.count; _0x1549a5 < _0x4e9f83; _0x1549a5++) {
        for (let _0x159486 = 0; _0x159486 < _0x539b63; _0x159486++) {
          const _0x1069d1 = _0x188e3a.getComponent(_0x1549a5, _0x159486);
          _0x52f682.setComponent(_0x1549a5 + _0xb68c62, _0x159486, _0x1069d1);
        }
      }
    } else _0x432774.set(_0x188e3a.array, _0x502ae2);
    _0x502ae2 += _0x188e3a.count * _0x539b63;
  }
  return (_0x2f22bf !== undefined && (_0x52f682.gpuType = _0x2f22bf), _0x52f682);
}
function deepCloneAttribute(_0x36c128) {
  if (_0x36c128.isInstancedInterleavedBufferAttribute || _0x36c128.isInterleavedBufferAttribute)
    return deinterleaveAttribute(_0x36c128);
  if (_0x36c128.isInstancedBufferAttribute) return new InstancedBufferAttribute().copy(_0x36c128);
  return new BufferAttribute().copy(_0x36c128);
}
function interleaveAttributes(_0x44ad3d) {
  let _0x43681c,
    _0xd393f1 = 0,
    _0x2482b4 = 0;
  for (let _0x4933ba = 0, _0x2c42ab = _0x44ad3d.length; _0x4933ba < _0x2c42ab; ++_0x4933ba) {
    const _0x5cf2fa = _0x44ad3d[_0x4933ba];
    if (_0x43681c === undefined) _0x43681c = _0x5cf2fa.array.constructor;
    if (_0x43681c !== _0x5cf2fa.array.constructor)
      return (console.error('AttributeBuffers of different types cannot be interleaved'), null);
    ((_0xd393f1 += _0x5cf2fa.array.length), (_0x2482b4 += _0x5cf2fa.itemSize));
  }
  const _0x4cdfe8 = new InterleavedBuffer(new _0x43681c(_0xd393f1), _0x2482b4);
  let _0x5213a7 = 0;
  const _0x493ba3 = [],
    _0x5704c1 = ['getX', 'getY', 'getZ', 'getW'],
    _0x516de = ['setX', 'setY', 'setZ', 'setW'];
  for (let _0x5ce3b0 = 0, _0x251348 = _0x44ad3d.length; _0x5ce3b0 < _0x251348; _0x5ce3b0++) {
    const _0x56246c = _0x44ad3d[_0x5ce3b0],
      _0x15275b = _0x56246c.itemSize,
      _0x3f3b19 = _0x56246c.count,
      _0x1348f2 = new InterleavedBufferAttribute(_0x4cdfe8, _0x15275b, _0x5213a7, _0x56246c.normalized);
    (_0x493ba3.push(_0x1348f2), (_0x5213a7 += _0x15275b));
    for (let _0x5ee25a = 0; _0x5ee25a < _0x3f3b19; _0x5ee25a++) {
      for (let _0x5a8f67 = 0; _0x5a8f67 < _0x15275b; _0x5a8f67++) {
        _0x1348f2[_0x516de[_0x5a8f67]](_0x5ee25a, _0x56246c[_0x5704c1[_0x5a8f67]](_0x5ee25a));
      }
    }
  }
  return _0x493ba3;
}
function deinterleaveAttribute(_0x187423) {
  const _0x5937d2 = _0x187423.data.array.constructor,
    _0x7c2e2f = _0x187423.count,
    _0x4768bf = _0x187423.itemSize,
    _0x5cd961 = _0x187423.normalized,
    _0xb95e6c = new _0x5937d2(_0x7c2e2f * _0x4768bf);
  let _0x35e42e;
  _0x187423.isInstancedInterleavedBufferAttribute
    ? (_0x35e42e = new InstancedBufferAttribute(_0xb95e6c, _0x4768bf, _0x5cd961, _0x187423.meshPerAttribute))
    : (_0x35e42e = new BufferAttribute(_0xb95e6c, _0x4768bf, _0x5cd961));
  for (let _0x156e8b = 0; _0x156e8b < _0x7c2e2f; _0x156e8b++) {
    (_0x35e42e.setX(_0x156e8b, _0x187423.getX(_0x156e8b)),
      _0x4768bf >= 2 && _0x35e42e.setY(_0x156e8b, _0x187423.getY(_0x156e8b)),
      _0x4768bf >= 3 && _0x35e42e.setZ(_0x156e8b, _0x187423.getZ(_0x156e8b)),
      _0x4768bf >= 4 && _0x35e42e.setW(_0x156e8b, _0x187423.getW(_0x156e8b)));
  }
  return _0x35e42e;
}
function deinterleaveGeometry(_0x3e754e) {
  const _0x3f865e = _0x3e754e.attributes,
    _0x36ace1 = _0x3e754e.morphTargets,
    _0x526913 = new Map();
  for (const _0x556bd4 in _0x3f865e) {
    const _0x2a7d9d = _0x3f865e[_0x556bd4];
    _0x2a7d9d.isInterleavedBufferAttribute &&
      (!_0x526913.has(_0x2a7d9d) && _0x526913.set(_0x2a7d9d, deinterleaveAttribute(_0x2a7d9d)),
      (_0x3f865e[_0x556bd4] = _0x526913.get(_0x2a7d9d)));
  }
  for (const _0x43c566 in _0x36ace1) {
    const _0x312c6c = _0x36ace1[_0x43c566];
    _0x312c6c.isInterleavedBufferAttribute &&
      (!_0x526913.has(_0x312c6c) && _0x526913.set(_0x312c6c, deinterleaveAttribute(_0x312c6c)),
      (_0x36ace1[_0x43c566] = _0x526913.get(_0x312c6c)));
  }
}
function estimateBytesUsed(_0x27858f) {
  let _0x25383a = 0;
  for (const _0x11ce2a in _0x27858f.attributes) {
    const _0x2f5d26 = _0x27858f.getAttribute(_0x11ce2a);
    _0x25383a += _0x2f5d26.count * _0x2f5d26.itemSize * _0x2f5d26.array.BYTES_PER_ELEMENT;
  }
  const _0x424419 = _0x27858f.getIndex();
  return (
    (_0x25383a += _0x424419 ? _0x424419.count * _0x424419.itemSize * _0x424419.array.BYTES_PER_ELEMENT : 0),
    _0x25383a
  );
}
function mergeVertices(_0x264e5b, _0x632099 = 0.0001) {
  _0x632099 = Math.max(_0x632099, Number.EPSILON);
  const _0x4b734b = {},
    _0x3c1a49 = _0x264e5b.getIndex(),
    _0x200ad9 = _0x264e5b.getAttribute('position'),
    _0x367b16 = _0x3c1a49 ? _0x3c1a49.count : _0x200ad9.count;
  let _0x1492b7 = 0;
  const _0x38c740 = Object.keys(_0x264e5b.attributes),
    _0x4cf6ac = {},
    _0x9f19d0 = {},
    _0x237282 = [],
    _0x417497 = ['getX', 'getY', 'getZ', 'getW'],
    _0x30b5c1 = ['setX', 'setY', 'setZ', 'setW'];
  for (let _0x59a1ac = 0, _0x34c631 = _0x38c740.length; _0x59a1ac < _0x34c631; _0x59a1ac++) {
    const _0xb2f24a = _0x38c740[_0x59a1ac],
      _0x5f223a = _0x264e5b.attributes[_0xb2f24a];
    _0x4cf6ac[_0xb2f24a] = new _0x5f223a['constructor'](
      new _0x5f223a.array['constructor'](_0x5f223a.count * _0x5f223a.itemSize),
      _0x5f223a.itemSize,
      _0x5f223a.normalized,
    );
    const _0x73b48f = _0x264e5b.morphAttributes[_0xb2f24a];
    if (_0x73b48f) {
      if (!_0x9f19d0[_0xb2f24a]) _0x9f19d0[_0xb2f24a] = [];
      _0x73b48f.forEach((_0x474d32, _0x14c97e) => {
        const _0x1ac541 = new _0x474d32.array['constructor'](_0x474d32.count * _0x474d32.itemSize);
        _0x9f19d0[_0xb2f24a][_0x14c97e] = new _0x474d32.constructor(
          _0x1ac541,
          _0x474d32.itemSize,
          _0x474d32.normalized,
        );
      });
    }
  }
  const _0xf57b84 = _0x632099 * 0.5,
    _0x551d65 = Math.log10(1 / _0x632099),
    _0x1ed525 = Math.pow(10, _0x551d65),
    _0x1ce453 = _0xf57b84 * _0x1ed525;
  for (let _0x1b96b = 0; _0x1b96b < _0x367b16; _0x1b96b++) {
    const _0x532c3a = _0x3c1a49 ? _0x3c1a49.getX(_0x1b96b) : _0x1b96b;
    let _0x306fea = '';
    for (let _0x2c97c5 = 0, _0x40f147 = _0x38c740.length; _0x2c97c5 < _0x40f147; _0x2c97c5++) {
      const _0x50eec2 = _0x38c740[_0x2c97c5],
        _0x4d02d4 = _0x264e5b.getAttribute(_0x50eec2),
        _0x3d4d94 = _0x4d02d4.itemSize;
      for (let _0x1621c4 = 0; _0x1621c4 < _0x3d4d94; _0x1621c4++) {
        _0x306fea += ~~(_0x4d02d4[_0x417497[_0x1621c4]](_0x532c3a) * _0x1ed525 + _0x1ce453) + ',';
      }
    }
    if (_0x306fea in _0x4b734b) _0x237282.push(_0x4b734b[_0x306fea]);
    else {
      for (let _0x512671 = 0, _0x4c6d05 = _0x38c740.length; _0x512671 < _0x4c6d05; _0x512671++) {
        const _0x3b24f7 = _0x38c740[_0x512671],
          _0x63b717 = _0x264e5b.getAttribute(_0x3b24f7),
          _0x1cd723 = _0x264e5b.morphAttributes[_0x3b24f7],
          _0x23a843 = _0x63b717.itemSize,
          _0x28d2f1 = _0x4cf6ac[_0x3b24f7],
          _0x3ad922 = _0x9f19d0[_0x3b24f7];
        for (let _0x3a67ff = 0; _0x3a67ff < _0x23a843; _0x3a67ff++) {
          const _0xd27152 = _0x417497[_0x3a67ff],
            _0x299b28 = _0x30b5c1[_0x3a67ff];
          _0x28d2f1[_0x299b28](_0x1492b7, _0x63b717[_0xd27152](_0x532c3a));
          if (_0x1cd723)
            for (let _0x19d663 = 0, _0x55fca3 = _0x1cd723.length; _0x19d663 < _0x55fca3; _0x19d663++) {
              _0x3ad922[_0x19d663][_0x299b28](_0x1492b7, _0x1cd723[_0x19d663][_0xd27152](_0x532c3a));
            }
        }
      }
      ((_0x4b734b[_0x306fea] = _0x1492b7), _0x237282.push(_0x1492b7), _0x1492b7++);
    }
  }
  const _0x2bfff0 = _0x264e5b.clone();
  for (const _0x303c1c in _0x264e5b.attributes) {
    const _0x2c4e4b = _0x4cf6ac[_0x303c1c];
    _0x2bfff0.setAttribute(
      _0x303c1c,
      new _0x2c4e4b['constructor'](
        _0x2c4e4b.array.slice(0, _0x1492b7 * _0x2c4e4b.itemSize),
        _0x2c4e4b.itemSize,
        _0x2c4e4b.normalized,
      ),
    );
    if (!(_0x303c1c in _0x9f19d0)) continue;
    for (let _0x4dd5f1 = 0; _0x4dd5f1 < _0x9f19d0[_0x303c1c].length; _0x4dd5f1++) {
      const _0x378c7 = _0x9f19d0[_0x303c1c][_0x4dd5f1];
      _0x2bfff0.morphAttributes[_0x303c1c][_0x4dd5f1] = new _0x378c7['constructor'](
        _0x378c7.array.slice(0, _0x1492b7 * _0x378c7.itemSize),
        _0x378c7.itemSize,
        _0x378c7.normalized,
      );
    }
  }
  return (_0x2bfff0.setIndex(_0x237282), _0x2bfff0);
}
function toTrianglesDrawMode(_0x5b717c, _0x20d0a3) {
  if (_0x20d0a3 === TrianglesDrawMode)
    return (
      console.warn('THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.'),
      _0x5b717c
    );
  if (_0x20d0a3 === TriangleFanDrawMode || _0x20d0a3 === TriangleStripDrawMode) {
    let _0x58862c = _0x5b717c.getIndex();
    if (_0x58862c === null) {
      const _0x569f04 = [],
        _0x5bf8de = _0x5b717c.getAttribute('position');
      if (_0x5bf8de !== undefined) {
        for (let _0x38f82b = 0; _0x38f82b < _0x5bf8de.count; _0x38f82b++) {
          _0x569f04.push(_0x38f82b);
        }
        (_0x5b717c.setIndex(_0x569f04), (_0x58862c = _0x5b717c.getIndex()));
      } else
        return (
          console.error(
            'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.',
          ),
          _0x5b717c
        );
    }
    const _0x488c5e = _0x58862c.count - 2,
      _0x2bbbf7 = [];
    if (_0x20d0a3 === TriangleFanDrawMode)
      for (let _0x43097d = 1; _0x43097d <= _0x488c5e; _0x43097d++) {
        (_0x2bbbf7.push(_0x58862c.getX(0)),
          _0x2bbbf7.push(_0x58862c.getX(_0x43097d)),
          _0x2bbbf7.push(_0x58862c.getX(_0x43097d + 1)));
      }
    else
      for (let _0xc14197 = 0; _0xc14197 < _0x488c5e; _0xc14197++) {
        _0xc14197 % 2 === 0
          ? (_0x2bbbf7.push(_0x58862c.getX(_0xc14197)),
            _0x2bbbf7.push(_0x58862c.getX(_0xc14197 + 1)),
            _0x2bbbf7.push(_0x58862c.getX(_0xc14197 + 2)))
          : (_0x2bbbf7.push(_0x58862c.getX(_0xc14197 + 2)),
            _0x2bbbf7.push(_0x58862c.getX(_0xc14197 + 1)),
            _0x2bbbf7.push(_0x58862c.getX(_0xc14197)));
      }
    _0x2bbbf7.length / 3 !== _0x488c5e &&
      console.error(
        'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.',
      );
    const _0x24d79f = _0x5b717c.clone();
    return (_0x24d79f.setIndex(_0x2bbbf7), _0x24d79f.clearGroups(), _0x24d79f);
  } else
    return (
      console.error('THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', _0x20d0a3),
      _0x5b717c
    );
}
function computeMorphedAttributes(_0x18aed6) {
  const _0x106dbe = new Vector3(),
    _0x5487ef = new Vector3(),
    _0x323594 = new Vector3(),
    _0x3efa27 = new Vector3(),
    _0x5bfc33 = new Vector3(),
    _0x4d4963 = new Vector3(),
    _0xf7eb13 = new Vector3(),
    _0x2c16b8 = new Vector3(),
    _0x4eb74b = new Vector3();
  function _0x1942fa(_0x35ed19, _0xbc0aa8, _0x1f239d, _0x209c28, _0x4f2a34, _0x39a4bd, _0xefbb80, _0x601294) {
    (_0x106dbe.fromBufferAttribute(_0xbc0aa8, _0x4f2a34),
      _0x5487ef.fromBufferAttribute(_0xbc0aa8, _0x39a4bd),
      _0x323594.fromBufferAttribute(_0xbc0aa8, _0xefbb80));
    const _0x1616cb = _0x35ed19.morphTargetInfluences;
    if (_0x1f239d && _0x1616cb) {
      (_0xf7eb13.set(0, 0, 0), _0x2c16b8.set(0, 0, 0), _0x4eb74b.set(0, 0, 0));
      for (let _0x2689aa = 0, _0x22631d = _0x1f239d.length; _0x2689aa < _0x22631d; _0x2689aa++) {
        const _0x4c6a6d = _0x1616cb[_0x2689aa],
          _0x4ed9b8 = _0x1f239d[_0x2689aa];
        if (_0x4c6a6d === 0) continue;
        (_0x3efa27.fromBufferAttribute(_0x4ed9b8, _0x4f2a34),
          _0x5bfc33.fromBufferAttribute(_0x4ed9b8, _0x39a4bd),
          _0x4d4963.fromBufferAttribute(_0x4ed9b8, _0xefbb80),
          _0x209c28
            ? (_0xf7eb13.addScaledVector(_0x3efa27, _0x4c6a6d),
              _0x2c16b8.addScaledVector(_0x5bfc33, _0x4c6a6d),
              _0x4eb74b.addScaledVector(_0x4d4963, _0x4c6a6d))
            : (_0xf7eb13.addScaledVector(_0x3efa27.sub(_0x106dbe), _0x4c6a6d),
              _0x2c16b8.addScaledVector(_0x5bfc33.sub(_0x5487ef), _0x4c6a6d),
              _0x4eb74b.addScaledVector(_0x4d4963.sub(_0x323594), _0x4c6a6d)));
      }
      (_0x106dbe.add(_0xf7eb13), _0x5487ef.add(_0x2c16b8), _0x323594.add(_0x4eb74b));
    }
    (_0x35ed19.isSkinnedMesh &&
      (_0x35ed19.applyBoneTransform(_0x4f2a34, _0x106dbe),
      _0x35ed19.applyBoneTransform(_0x39a4bd, _0x5487ef),
      _0x35ed19.applyBoneTransform(_0xefbb80, _0x323594)),
      (_0x601294[_0x4f2a34 * 3 + 0] = _0x106dbe.x),
      (_0x601294[_0x4f2a34 * 3 + 1] = _0x106dbe.y),
      (_0x601294[_0x4f2a34 * 3 + 2] = _0x106dbe.z),
      (_0x601294[_0x39a4bd * 3 + 0] = _0x5487ef.x),
      (_0x601294[_0x39a4bd * 3 + 1] = _0x5487ef.y),
      (_0x601294[_0x39a4bd * 3 + 2] = _0x5487ef.z),
      (_0x601294[_0xefbb80 * 3 + 0] = _0x323594.x),
      (_0x601294[_0xefbb80 * 3 + 1] = _0x323594.y),
      (_0x601294[_0xefbb80 * 3 + 2] = _0x323594.z));
  }
  const _0x3878b1 = _0x18aed6.geometry,
    _0x3429c7 = _0x18aed6.material;
  let _0x4ccda4, _0x153be3, _0x7df15;
  const _0x4d1b3a = _0x3878b1.index,
    _0x34aff7 = _0x3878b1.attributes.position,
    _0x2db0ef = _0x3878b1.morphAttributes.position,
    _0x3b630f = _0x3878b1.morphTargetsRelative,
    _0xc14e28 = _0x3878b1.attributes.normal,
    _0x1d6895 = _0x3878b1.morphAttributes.position,
    _0x107ae0 = _0x3878b1.groups,
    _0x56a1c3 = _0x3878b1.drawRange;
  let _0xef1e96, _0x3997a7, _0x43d60e, _0x255902, _0x5c75a1, _0x51fd2f, _0x38c7ca;
  const _0x592488 = new Float32Array(_0x34aff7.count * _0x34aff7.itemSize),
    _0x5ef1da = new Float32Array(_0xc14e28.count * _0xc14e28.itemSize);
  if (_0x4d1b3a !== null) {
    if (Array.isArray(_0x3429c7))
      for (_0xef1e96 = 0, _0x43d60e = _0x107ae0.length; _0xef1e96 < _0x43d60e; _0xef1e96++) {
        ((_0x5c75a1 = _0x107ae0[_0xef1e96]),
          (_0x51fd2f = Math.max(_0x5c75a1.start, _0x56a1c3.start)),
          (_0x38c7ca = Math.min(_0x5c75a1.start + _0x5c75a1.count, _0x56a1c3.start + _0x56a1c3.count)));
        for (_0x3997a7 = _0x51fd2f, _0x255902 = _0x38c7ca; _0x3997a7 < _0x255902; _0x3997a7 += 3) {
          ((_0x4ccda4 = _0x4d1b3a.getX(_0x3997a7)),
            (_0x153be3 = _0x4d1b3a.getX(_0x3997a7 + 1)),
            (_0x7df15 = _0x4d1b3a.getX(_0x3997a7 + 2)),
            _0x1942fa(_0x18aed6, _0x34aff7, _0x2db0ef, _0x3b630f, _0x4ccda4, _0x153be3, _0x7df15, _0x592488),
            _0x1942fa(_0x18aed6, _0xc14e28, _0x1d6895, _0x3b630f, _0x4ccda4, _0x153be3, _0x7df15, _0x5ef1da));
        }
      }
    else {
      ((_0x51fd2f = Math.max(0, _0x56a1c3.start)),
        (_0x38c7ca = Math.min(_0x4d1b3a.count, _0x56a1c3.start + _0x56a1c3.count)));
      for (_0xef1e96 = _0x51fd2f, _0x43d60e = _0x38c7ca; _0xef1e96 < _0x43d60e; _0xef1e96 += 3) {
        ((_0x4ccda4 = _0x4d1b3a.getX(_0xef1e96)),
          (_0x153be3 = _0x4d1b3a.getX(_0xef1e96 + 1)),
          (_0x7df15 = _0x4d1b3a.getX(_0xef1e96 + 2)),
          _0x1942fa(_0x18aed6, _0x34aff7, _0x2db0ef, _0x3b630f, _0x4ccda4, _0x153be3, _0x7df15, _0x592488),
          _0x1942fa(_0x18aed6, _0xc14e28, _0x1d6895, _0x3b630f, _0x4ccda4, _0x153be3, _0x7df15, _0x5ef1da));
      }
    }
  } else {
    if (Array.isArray(_0x3429c7))
      for (_0xef1e96 = 0, _0x43d60e = _0x107ae0.length; _0xef1e96 < _0x43d60e; _0xef1e96++) {
        ((_0x5c75a1 = _0x107ae0[_0xef1e96]),
          (_0x51fd2f = Math.max(_0x5c75a1.start, _0x56a1c3.start)),
          (_0x38c7ca = Math.min(_0x5c75a1.start + _0x5c75a1.count, _0x56a1c3.start + _0x56a1c3.count)));
        for (_0x3997a7 = _0x51fd2f, _0x255902 = _0x38c7ca; _0x3997a7 < _0x255902; _0x3997a7 += 3) {
          ((_0x4ccda4 = _0x3997a7),
            (_0x153be3 = _0x3997a7 + 1),
            (_0x7df15 = _0x3997a7 + 2),
            _0x1942fa(_0x18aed6, _0x34aff7, _0x2db0ef, _0x3b630f, _0x4ccda4, _0x153be3, _0x7df15, _0x592488),
            _0x1942fa(_0x18aed6, _0xc14e28, _0x1d6895, _0x3b630f, _0x4ccda4, _0x153be3, _0x7df15, _0x5ef1da));
        }
      }
    else {
      ((_0x51fd2f = Math.max(0, _0x56a1c3.start)),
        (_0x38c7ca = Math.min(_0x34aff7.count, _0x56a1c3.start + _0x56a1c3.count)));
      for (_0xef1e96 = _0x51fd2f, _0x43d60e = _0x38c7ca; _0xef1e96 < _0x43d60e; _0xef1e96 += 3) {
        ((_0x4ccda4 = _0xef1e96),
          (_0x153be3 = _0xef1e96 + 1),
          (_0x7df15 = _0xef1e96 + 2),
          _0x1942fa(_0x18aed6, _0x34aff7, _0x2db0ef, _0x3b630f, _0x4ccda4, _0x153be3, _0x7df15, _0x592488),
          _0x1942fa(_0x18aed6, _0xc14e28, _0x1d6895, _0x3b630f, _0x4ccda4, _0x153be3, _0x7df15, _0x5ef1da));
      }
    }
  }
  const _0x223b1c = new Float32BufferAttribute(_0x592488, 3),
    _0x39854c = new Float32BufferAttribute(_0x5ef1da, 3);
  return {
    positionAttribute: _0x34aff7,
    normalAttribute: _0xc14e28,
    morphedPositionAttribute: _0x223b1c,
    morphedNormalAttribute: _0x39854c,
  };
}
function mergeGroups(_0xe11015) {
  if (_0xe11015.groups.length === 0)
    return (
      console.warn('THREE.BufferGeometryUtils.mergeGroups(): No groups are defined. Nothing to merge.'),
      _0xe11015
    );
  let _0x314c09 = _0xe11015.groups;
  _0x314c09 = _0x314c09.sort((_0x3c996c, _0x2662e6) => {
    if (_0x3c996c.materialIndex !== _0x2662e6.materialIndex)
      return _0x3c996c.materialIndex - _0x2662e6.materialIndex;
    return _0x3c996c.start - _0x2662e6.start;
  });
  if (_0xe11015.getIndex() === null) {
    const _0x5a53e0 = _0xe11015.getAttribute('position'),
      _0xf7e2a4 = [];
    for (let _0x15f33d = 0; _0x15f33d < _0x5a53e0.count; _0x15f33d += 3) {
      _0xf7e2a4.push(_0x15f33d, _0x15f33d + 1, _0x15f33d + 2);
    }
    _0xe11015.setIndex(_0xf7e2a4);
  }
  const _0x4398f5 = _0xe11015.getIndex(),
    _0x77e070 = [];
  for (let _0x5450ed = 0; _0x5450ed < _0x314c09.length; _0x5450ed++) {
    const _0xd5f00c = _0x314c09[_0x5450ed],
      _0x109ee0 = _0xd5f00c.start,
      _0x5ddb52 = _0x109ee0 + _0xd5f00c.count;
    for (let _0x471266 = _0x109ee0; _0x471266 < _0x5ddb52; _0x471266++) {
      _0x77e070.push(_0x4398f5.getX(_0x471266));
    }
  }
  (_0xe11015.dispose(), _0xe11015.setIndex(_0x77e070));
  let _0x59945f = 0;
  for (let _0xd2840a = 0; _0xd2840a < _0x314c09.length; _0xd2840a++) {
    const _0x1f43c8 = _0x314c09[_0xd2840a];
    ((_0x1f43c8.start = _0x59945f), (_0x59945f += _0x1f43c8.count));
  }
  let _0x42b018 = _0x314c09[0];
  _0xe11015.groups = [_0x42b018];
  for (let _0x2958c9 = 1; _0x2958c9 < _0x314c09.length; _0x2958c9++) {
    const _0x5c3aaa = _0x314c09[_0x2958c9];
    _0x42b018.materialIndex === _0x5c3aaa.materialIndex
      ? (_0x42b018.count += _0x5c3aaa.count)
      : ((_0x42b018 = _0x5c3aaa), _0xe11015.groups.push(_0x42b018));
  }
  return _0xe11015;
}
function toCreasedNormals(_0x39ff14, _0x5dd0cf = Math.PI / 3) {
  const _0x26aa73 = Math.cos(_0x5dd0cf),
    _0x257982 = (1 + 1e-10) * 100,
    _0x2820ec = [new Vector3(), new Vector3(), new Vector3()],
    _0x578e90 = new Vector3(),
    _0x52d9dc = new Vector3(),
    _0xf23681 = new Vector3(),
    _0x352971 = new Vector3();
  function _0x353a9b(_0x36fab8) {
    const _0x16d967 = ~~(_0x36fab8.x * _0x257982),
      _0xd965a5 = ~~(_0x36fab8.y * _0x257982),
      _0x3a138a = ~~(_0x36fab8.z * _0x257982);
    return _0x16d967 + ',' + _0xd965a5 + ',' + _0x3a138a;
  }
  const _0x3321f4 = _0x39ff14.index ? _0x39ff14.toNonIndexed() : _0x39ff14,
    _0x546042 = _0x3321f4.attributes.position,
    _0x560148 = {};
  for (let _0x4328aa = 0, _0x22b4cf = _0x546042.count / 3; _0x4328aa < _0x22b4cf; _0x4328aa++) {
    const _0x580799 = 3 * _0x4328aa,
      _0x411be7 = _0x2820ec[0].fromBufferAttribute(_0x546042, _0x580799 + 0),
      _0x5386ca = _0x2820ec[1].fromBufferAttribute(_0x546042, _0x580799 + 1),
      _0x156e93 = _0x2820ec[2].fromBufferAttribute(_0x546042, _0x580799 + 2);
    (_0x578e90.subVectors(_0x156e93, _0x5386ca), _0x52d9dc.subVectors(_0x411be7, _0x5386ca));
    const _0x37ef2c = new Vector3().crossVectors(_0x578e90, _0x52d9dc).normalize();
    for (let _0xcee805 = 0; _0xcee805 < 3; _0xcee805++) {
      const _0x55828d = _0x2820ec[_0xcee805],
        _0x1dbd7e = _0x353a9b(_0x55828d);
      (!(_0x1dbd7e in _0x560148) && (_0x560148[_0x1dbd7e] = []), _0x560148[_0x1dbd7e].push(_0x37ef2c));
    }
  }
  const _0xd1ea04 = new Float32Array(_0x546042.count * 3),
    _0x9ce8bf = new BufferAttribute(_0xd1ea04, 3, false);
  for (let _0x52dfbe = 0, _0x5ea14e = _0x546042.count / 3; _0x52dfbe < _0x5ea14e; _0x52dfbe++) {
    const _0xd83bc9 = 3 * _0x52dfbe,
      _0x1d1daf = _0x2820ec[0].fromBufferAttribute(_0x546042, _0xd83bc9 + 0),
      _0xd21cd2 = _0x2820ec[1].fromBufferAttribute(_0x546042, _0xd83bc9 + 1),
      _0x5bbd46 = _0x2820ec[2].fromBufferAttribute(_0x546042, _0xd83bc9 + 2);
    (_0x578e90.subVectors(_0x5bbd46, _0xd21cd2),
      _0x52d9dc.subVectors(_0x1d1daf, _0xd21cd2),
      _0xf23681.crossVectors(_0x578e90, _0x52d9dc).normalize());
    for (let _0x1c8c10 = 0; _0x1c8c10 < 3; _0x1c8c10++) {
      const _0x40fda7 = _0x2820ec[_0x1c8c10],
        _0x25353a = _0x353a9b(_0x40fda7),
        _0x145cd5 = _0x560148[_0x25353a];
      _0x352971.set(0, 0, 0);
      for (let _0x2359cd = 0, _0x361547 = _0x145cd5.length; _0x2359cd < _0x361547; _0x2359cd++) {
        const _0x3e4024 = _0x145cd5[_0x2359cd];
        _0xf23681.dot(_0x3e4024) > _0x26aa73 && _0x352971.add(_0x3e4024);
      }
      (_0x352971.normalize(), _0x9ce8bf.setXYZ(_0xd83bc9 + _0x1c8c10, _0x352971.x, _0x352971.y, _0x352971.z));
    }
  }
  return (_0x3321f4.setAttribute('normal', _0x9ce8bf), _0x3321f4);
}
export {
  computeMikkTSpaceTangents,
  mergeGeometries,
  mergeAttributes,
  deepCloneAttribute,
  deinterleaveAttribute,
  deinterleaveGeometry,
  interleaveAttributes,
  estimateBytesUsed,
  mergeVertices,
  toTrianglesDrawMode,
  computeMorphedAttributes,
  mergeGroups,
  toCreasedNormals,
};

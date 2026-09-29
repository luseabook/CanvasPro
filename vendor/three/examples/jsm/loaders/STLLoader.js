import {
  BufferAttribute,
  BufferGeometry,
  Color,
  FileLoader,
  Float32BufferAttribute,
  Loader,
  Vector3,
  SRGBColorSpace,
} from '../../../three.module.js';
class STLLoader extends Loader {
  constructor(_0x8c1b85) {
    super(_0x8c1b85);
  }
  ['load'](_0x8a6dea, _0x1dc08e, _0xe97af1, _0x15cdc5) {
    const _0x21b1ad = this,
      _0x4c3510 = new FileLoader(this['manager']);
    (_0x4c3510['setPath'](this['path']),
      _0x4c3510['setResponseType']('arraybuffer'),
      _0x4c3510['setRequestHeader'](this['requestHeader']),
      _0x4c3510['setWithCredentials'](this['withCredentials']),
      _0x4c3510['load'](
        _0x8a6dea,
        function (_0x20658d) {
          try {
            _0x1dc08e(_0x21b1ad['parse'](_0x20658d));
          } catch (_0x15c487) {
            (_0x15cdc5 ? _0x15cdc5(_0x15c487) : console['error'](_0x15c487),
              _0x21b1ad['manager']['itemError'](_0x8a6dea));
          }
        },
        _0xe97af1,
        _0x15cdc5,
      ));
  }
  ['parse'](_0x3904ca) {
    function _0x49ef2e(_0x52c9f8) {
      const _0x545ea2 = new DataView(_0x52c9f8),
        _0x4a445a = (0x20 / 0x8) * 0x3 + (0x20 / 0x8) * 0x3 * 0x3 + 0x10 / 0x8,
        _0x5415d4 = _0x545ea2['getUint32'](0x50, !![]),
        _0x1cf734 = 0x50 + 0x20 / 0x8 + _0x5415d4 * _0x4a445a;
      if (_0x1cf734 === _0x545ea2['byteLength']) return !![];
      const _0x3f7967 = [0x73, 0x6f, 0x6c, 0x69, 0x64];
      for (let _0x2bfc23 = 0x0; _0x2bfc23 < 0x5; _0x2bfc23++) {
        if (_0x230ab3(_0x3f7967, _0x545ea2, _0x2bfc23)) return ![];
      }
      return !![];
    }
    function _0x230ab3(_0x1017b2, _0x2b4b58, _0xc34fbb) {
      for (let _0x32720a = 0x0, _0x48ad24 = _0x1017b2['length']; _0x32720a < _0x48ad24; _0x32720a++) {
        if (_0x1017b2[_0x32720a] !== _0x2b4b58['getUint8'](_0xc34fbb + _0x32720a)) return ![];
      }
      return !![];
    }
    function _0xf2707b(_0x44f79a) {
      const _0x4c3763 = new DataView(_0x44f79a),
        _0x4d2dcd = _0x4c3763['getUint32'](0x50, !![]);
      let _0x4d01ef,
        _0x3f323f,
        _0x4f0e60,
        _0x1a0e1b = ![],
        _0x5c784c,
        _0x46415c,
        _0x107c0e,
        _0x609d81,
        _0x3854bf;
      for (let _0x58e82c = 0x0; _0x58e82c < 0x50 - 0xa; _0x58e82c++) {
        _0x4c3763['getUint32'](_0x58e82c, ![]) == 0x434f4c4f &&
          _0x4c3763['getUint8'](_0x58e82c + 0x4) == 0x52 &&
          _0x4c3763['getUint8'](_0x58e82c + 0x5) == 0x3d &&
          ((_0x1a0e1b = !![]),
          (_0x5c784c = new Float32Array(_0x4d2dcd * 0x3 * 0x3)),
          (_0x46415c = _0x4c3763['getUint8'](_0x58e82c + 0x6) / 0xff),
          (_0x107c0e = _0x4c3763['getUint8'](_0x58e82c + 0x7) / 0xff),
          (_0x609d81 = _0x4c3763['getUint8'](_0x58e82c + 0x8) / 0xff),
          (_0x3854bf = _0x4c3763['getUint8'](_0x58e82c + 0x9) / 0xff));
      }
      const _0xf5f894 = 0x54,
        _0x21f82f = 0xc * 0x4 + 0x2,
        _0x23d5f8 = new BufferGeometry(),
        _0x4fcdfe = new Float32Array(_0x4d2dcd * 0x3 * 0x3),
        _0xea351a = new Float32Array(_0x4d2dcd * 0x3 * 0x3),
        _0x96dd72 = new Color();
      for (let _0x491c1a = 0x0; _0x491c1a < _0x4d2dcd; _0x491c1a++) {
        const _0x3d7185 = _0xf5f894 + _0x491c1a * _0x21f82f,
          _0x5ba8e4 = _0x4c3763['getFloat32'](_0x3d7185, !![]),
          _0x1c64cd = _0x4c3763['getFloat32'](_0x3d7185 + 0x4, !![]),
          _0x4f54f2 = _0x4c3763['getFloat32'](_0x3d7185 + 0x8, !![]);
        if (_0x1a0e1b) {
          const _0x1a9cbf = _0x4c3763['getUint16'](_0x3d7185 + 0x30, !![]);
          (_0x1a9cbf & 0x8000) === 0x0
            ? ((_0x4d01ef = (_0x1a9cbf & 0x1f) / 0x1f),
              (_0x3f323f = ((_0x1a9cbf >> 0x5) & 0x1f) / 0x1f),
              (_0x4f0e60 = ((_0x1a9cbf >> 0xa) & 0x1f) / 0x1f))
            : ((_0x4d01ef = _0x46415c), (_0x3f323f = _0x107c0e), (_0x4f0e60 = _0x609d81));
        }
        for (let _0x1774e2 = 0x1; _0x1774e2 <= 0x3; _0x1774e2++) {
          const _0x62d0cd = _0x3d7185 + _0x1774e2 * 0xc,
            _0x3d640e = _0x491c1a * 0x3 * 0x3 + (_0x1774e2 - 0x1) * 0x3;
          ((_0x4fcdfe[_0x3d640e] = _0x4c3763['getFloat32'](_0x62d0cd, !![])),
            (_0x4fcdfe[_0x3d640e + 0x1] = _0x4c3763['getFloat32'](_0x62d0cd + 0x4, !![])),
            (_0x4fcdfe[_0x3d640e + 0x2] = _0x4c3763['getFloat32'](_0x62d0cd + 0x8, !![])),
            (_0xea351a[_0x3d640e] = _0x5ba8e4),
            (_0xea351a[_0x3d640e + 0x1] = _0x1c64cd),
            (_0xea351a[_0x3d640e + 0x2] = _0x4f54f2),
            _0x1a0e1b &&
              (_0x96dd72['setRGB'](_0x4d01ef, _0x3f323f, _0x4f0e60, SRGBColorSpace),
              (_0x5c784c[_0x3d640e] = _0x96dd72['r']),
              (_0x5c784c[_0x3d640e + 0x1] = _0x96dd72['g']),
              (_0x5c784c[_0x3d640e + 0x2] = _0x96dd72['b'])));
        }
      }
      return (
        _0x23d5f8['setAttribute']('position', new BufferAttribute(_0x4fcdfe, 0x3)),
        _0x23d5f8['setAttribute']('normal', new BufferAttribute(_0xea351a, 0x3)),
        _0x1a0e1b &&
          (_0x23d5f8['setAttribute']('color', new BufferAttribute(_0x5c784c, 0x3)),
          (_0x23d5f8['hasColors'] = !![]),
          (_0x23d5f8['alpha'] = _0x3854bf)),
        _0x23d5f8
      );
    }
    function _0x59f79e(_0x1288e3) {
      const _0xc58f0c = new BufferGeometry(),
        _0x332e4d = /solid([\s\S]*?)endsolid/g,
        _0x95f826 = /facet([\s\S]*?)endfacet/g,
        _0x5e370f = /solid\s(.+)/;
      let _0xd085f7 = 0x0;
      const _0xf85695 = /[\s]+([+-]?(?:\d*)(?:\.\d*)?(?:[eE][+-]?\d+)?)/['source'],
        _0x581f33 = new RegExp('vertex' + _0xf85695 + _0xf85695 + _0xf85695, 'g'),
        _0x109865 = new RegExp('normal' + _0xf85695 + _0xf85695 + _0xf85695, 'g'),
        _0x253734 = [],
        _0x319399 = [],
        _0x53c238 = [],
        _0x3b31d2 = new Vector3();
      let _0x3dfb60,
        _0x4825b1 = 0x0,
        _0x23afbd = 0x0,
        _0x34744f = 0x0;
      while ((_0x3dfb60 = _0x332e4d['exec'](_0x1288e3)) !== null) {
        _0x23afbd = _0x34744f;
        const _0xad448a = _0x3dfb60[0x0],
          _0x98ffa4 = (_0x3dfb60 = _0x5e370f['exec'](_0xad448a)) !== null ? _0x3dfb60[0x1] : '';
        _0x53c238['push'](_0x98ffa4);
        while ((_0x3dfb60 = _0x95f826['exec'](_0xad448a)) !== null) {
          let _0x5adef9 = 0x0,
            _0x5aae3e = 0x0;
          const _0x422137 = _0x3dfb60[0x0];
          while ((_0x3dfb60 = _0x109865['exec'](_0x422137)) !== null) {
            ((_0x3b31d2['x'] = parseFloat(_0x3dfb60[0x1])),
              (_0x3b31d2['y'] = parseFloat(_0x3dfb60[0x2])),
              (_0x3b31d2['z'] = parseFloat(_0x3dfb60[0x3])),
              _0x5aae3e++);
          }
          while ((_0x3dfb60 = _0x581f33['exec'](_0x422137)) !== null) {
            (_0x253734['push'](
              parseFloat(_0x3dfb60[0x1]),
              parseFloat(_0x3dfb60[0x2]),
              parseFloat(_0x3dfb60[0x3]),
            ),
              _0x319399['push'](_0x3b31d2['x'], _0x3b31d2['y'], _0x3b31d2['z']),
              _0x5adef9++,
              _0x34744f++);
          }
          (_0x5aae3e !== 0x1 &&
            console['error'](
              "THREE.STLLoader: Something isn't right with the normal of face number " + _0xd085f7,
            ),
            _0x5adef9 !== 0x3 &&
              console['error'](
                "THREE.STLLoader: Something isn't right with the vertices of face number " + _0xd085f7,
              ),
            _0xd085f7++);
        }
        const _0x2466ce = _0x23afbd,
          _0x1c0bbf = _0x34744f - _0x23afbd;
        ((_0xc58f0c['userData']['groupNames'] = _0x53c238),
          _0xc58f0c['addGroup'](_0x2466ce, _0x1c0bbf, _0x4825b1),
          _0x4825b1++);
      }
      return (
        _0xc58f0c['setAttribute']('position', new Float32BufferAttribute(_0x253734, 0x3)),
        _0xc58f0c['setAttribute']('normal', new Float32BufferAttribute(_0x319399, 0x3)),
        _0xc58f0c
      );
    }
    function _0xb472ca(_0x390094) {
      if (typeof _0x390094 !== 'string') return new TextDecoder()['decode'](_0x390094);
      return _0x390094;
    }
    function _0x58b4a8(_0x30dc9c) {
      if (typeof _0x30dc9c === 'string') {
        const _0x44bf6e = new Uint8Array(_0x30dc9c['length']);
        for (let _0x31ea5f = 0x0; _0x31ea5f < _0x30dc9c['length']; _0x31ea5f++) {
          _0x44bf6e[_0x31ea5f] = _0x30dc9c['charCodeAt'](_0x31ea5f) & 0xff;
        }
        return _0x44bf6e['buffer'] || _0x44bf6e;
      } else return _0x30dc9c;
    }
    const _0x426596 = _0x58b4a8(_0x3904ca);
    return _0x49ef2e(_0x426596) ? _0xf2707b(_0x426596) : _0x59f79e(_0xb472ca(_0x3904ca));
  }
}
export { STLLoader };

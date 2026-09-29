import {
  BufferGeometry,
  FileLoader,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Loader,
  Material,
  Mesh,
  MeshPhongMaterial,
  Points,
  PointsMaterial,
  Vector3,
  Color,
  SRGBColorSpace,
} from '../../../three.module.js';
const _object_pattern = /^[og]\s*(.+)?/,
  _material_library_pattern = /^mtllib /,
  _material_use_pattern = /^usemtl /,
  _map_use_pattern = /^usemap /,
  _face_vertex_data_separator_pattern = /\s+/,
  _vA = new Vector3(),
  _vB = new Vector3(),
  _vC = new Vector3(),
  _ab = new Vector3(),
  _cb = new Vector3(),
  _color = new Color();
function ParserState() {
  const _0x496982 = {
    objects: [],
    object: {},
    vertices: [],
    normals: [],
    colors: [],
    uvs: [],
    materials: {},
    materialLibraries: [],
    startObject: function (_0x2b2c56, _0x5a620e) {
      if (this['object'] && this['object']['fromDeclaration'] === ![]) {
        ((this['object']['name'] = _0x2b2c56), (this['object']['fromDeclaration'] = _0x5a620e !== ![]));
        return;
      }
      const _0x263103 =
        this['object'] && typeof this['object']['currentMaterial'] === 'function'
          ? this['object']['currentMaterial']()
          : undefined;
      this['object'] &&
        typeof this['object']['_finalize'] === 'function' &&
        this['object']['_finalize'](!![]);
      this['object'] = {
        name: _0x2b2c56 || '',
        fromDeclaration: _0x5a620e !== ![],
        geometry: { vertices: [], normals: [], colors: [], uvs: [], hasUVIndices: ![] },
        materials: [],
        smooth: !![],
        startMaterial: function (_0x7c3845, _0x175b70) {
          const _0x4b08b7 = this['_finalize'](![]);
          _0x4b08b7 &&
            (_0x4b08b7['inherited'] || _0x4b08b7['groupCount'] <= 0x0) &&
            this['materials']['splice'](_0x4b08b7['index'], 0x1);
          const _0x22808b = {
            index: this['materials']['length'],
            name: _0x7c3845 || '',
            mtllib:
              Array['isArray'](_0x175b70) && _0x175b70['length'] > 0x0
                ? _0x175b70[_0x175b70['length'] - 0x1]
                : '',
            smooth: _0x4b08b7 !== undefined ? _0x4b08b7['smooth'] : this['smooth'],
            groupStart: _0x4b08b7 !== undefined ? _0x4b08b7['groupEnd'] : 0x0,
            groupEnd: -0x1,
            groupCount: -0x1,
            inherited: ![],
            clone: function (_0x5cd311) {
              const _0x57a0f9 = {
                index: typeof _0x5cd311 === 'number' ? _0x5cd311 : this['index'],
                name: this['name'],
                mtllib: this['mtllib'],
                smooth: this['smooth'],
                groupStart: 0x0,
                groupEnd: -0x1,
                groupCount: -0x1,
                inherited: ![],
              };
              return ((_0x57a0f9['clone'] = this['clone']['bind'](_0x57a0f9)), _0x57a0f9);
            },
          };
          return (this['materials']['push'](_0x22808b), _0x22808b);
        },
        currentMaterial: function () {
          if (this['materials']['length'] > 0x0) return this['materials'][this['materials']['length'] - 0x1];
          return undefined;
        },
        _finalize: function (_0x43286d) {
          const _0x4c3d6d = this['currentMaterial']();
          _0x4c3d6d &&
            _0x4c3d6d['groupEnd'] === -0x1 &&
            ((_0x4c3d6d['groupEnd'] = this['geometry']['vertices']['length'] / 0x3),
            (_0x4c3d6d['groupCount'] = _0x4c3d6d['groupEnd'] - _0x4c3d6d['groupStart']),
            (_0x4c3d6d['inherited'] = ![]));
          if (_0x43286d && this['materials']['length'] > 0x1)
            for (let _0x2b166d = this['materials']['length'] - 0x1; _0x2b166d >= 0x0; _0x2b166d--) {
              this['materials'][_0x2b166d]['groupCount'] <= 0x0 &&
                this['materials']['splice'](_0x2b166d, 0x1);
            }
          return (
            _0x43286d &&
              this['materials']['length'] === 0x0 &&
              this['materials']['push']({ name: '', smooth: this['smooth'] }),
            _0x4c3d6d
          );
        },
      };
      if (_0x263103 && _0x263103['name'] && typeof _0x263103['clone'] === 'function') {
        const _0x21bb78 = _0x263103['clone'](0x0);
        ((_0x21bb78['inherited'] = !![]), this['object']['materials']['push'](_0x21bb78));
      }
      this['objects']['push'](this['object']);
    },
    finalize: function () {
      this['object'] &&
        typeof this['object']['_finalize'] === 'function' &&
        this['object']['_finalize'](!![]);
    },
    parseVertexIndex: function (_0x511027, _0x57016e) {
      const _0x459c43 = parseInt(_0x511027, 0xa);
      return (_0x459c43 >= 0x0 ? _0x459c43 - 0x1 : _0x459c43 + _0x57016e / 0x3) * 0x3;
    },
    parseNormalIndex: function (_0x53f003, _0x512611) {
      const _0x157d1d = parseInt(_0x53f003, 0xa);
      return (_0x157d1d >= 0x0 ? _0x157d1d - 0x1 : _0x157d1d + _0x512611 / 0x3) * 0x3;
    },
    parseUVIndex: function (_0xb2d94f, _0x3488e5) {
      const _0x1ff6bc = parseInt(_0xb2d94f, 0xa);
      return (_0x1ff6bc >= 0x0 ? _0x1ff6bc - 0x1 : _0x1ff6bc + _0x3488e5 / 0x2) * 0x2;
    },
    addVertex: function (_0x441be8, _0x5ba25e, _0x261766) {
      const _0x360832 = this['vertices'],
        _0x36221c = this['object']['geometry']['vertices'];
      (_0x36221c['push'](_0x360832[_0x441be8 + 0x0], _0x360832[_0x441be8 + 0x1], _0x360832[_0x441be8 + 0x2]),
        _0x36221c['push'](_0x360832[_0x5ba25e + 0x0], _0x360832[_0x5ba25e + 0x1], _0x360832[_0x5ba25e + 0x2]),
        _0x36221c['push'](
          _0x360832[_0x261766 + 0x0],
          _0x360832[_0x261766 + 0x1],
          _0x360832[_0x261766 + 0x2],
        ));
    },
    addVertexPoint: function (_0x1e6b41) {
      const _0x1a43c1 = this['vertices'],
        _0x210c2d = this['object']['geometry']['vertices'];
      _0x210c2d['push'](_0x1a43c1[_0x1e6b41 + 0x0], _0x1a43c1[_0x1e6b41 + 0x1], _0x1a43c1[_0x1e6b41 + 0x2]);
    },
    addVertexLine: function (_0x244b1f) {
      const _0x234f4e = this['vertices'],
        _0xe40233 = this['object']['geometry']['vertices'];
      _0xe40233['push'](_0x234f4e[_0x244b1f + 0x0], _0x234f4e[_0x244b1f + 0x1], _0x234f4e[_0x244b1f + 0x2]);
    },
    addNormal: function (_0x544c24, _0x255a2b, _0x52c017) {
      const _0x12c26e = this['normals'],
        _0xe88b17 = this['object']['geometry']['normals'];
      (_0xe88b17['push'](_0x12c26e[_0x544c24 + 0x0], _0x12c26e[_0x544c24 + 0x1], _0x12c26e[_0x544c24 + 0x2]),
        _0xe88b17['push'](_0x12c26e[_0x255a2b + 0x0], _0x12c26e[_0x255a2b + 0x1], _0x12c26e[_0x255a2b + 0x2]),
        _0xe88b17['push'](
          _0x12c26e[_0x52c017 + 0x0],
          _0x12c26e[_0x52c017 + 0x1],
          _0x12c26e[_0x52c017 + 0x2],
        ));
    },
    addFaceNormal: function (_0x364c57, _0x180a43, _0xc1adbc) {
      const _0x253c29 = this['vertices'],
        _0x5936e1 = this['object']['geometry']['normals'];
      (_vA['fromArray'](_0x253c29, _0x364c57),
        _vB['fromArray'](_0x253c29, _0x180a43),
        _vC['fromArray'](_0x253c29, _0xc1adbc),
        _cb['subVectors'](_vC, _vB),
        _ab['subVectors'](_vA, _vB),
        _cb['cross'](_ab),
        _cb['normalize'](),
        _0x5936e1['push'](_cb['x'], _cb['y'], _cb['z']),
        _0x5936e1['push'](_cb['x'], _cb['y'], _cb['z']),
        _0x5936e1['push'](_cb['x'], _cb['y'], _cb['z']));
    },
    addColor: function (_0xd2372a, _0x59556b, _0x571683) {
      const _0x5d0daa = this['colors'],
        _0x174d4c = this['object']['geometry']['colors'];
      if (_0x5d0daa[_0xd2372a] !== undefined)
        _0x174d4c['push'](_0x5d0daa[_0xd2372a + 0x0], _0x5d0daa[_0xd2372a + 0x1], _0x5d0daa[_0xd2372a + 0x2]);
      if (_0x5d0daa[_0x59556b] !== undefined)
        _0x174d4c['push'](_0x5d0daa[_0x59556b + 0x0], _0x5d0daa[_0x59556b + 0x1], _0x5d0daa[_0x59556b + 0x2]);
      if (_0x5d0daa[_0x571683] !== undefined)
        _0x174d4c['push'](_0x5d0daa[_0x571683 + 0x0], _0x5d0daa[_0x571683 + 0x1], _0x5d0daa[_0x571683 + 0x2]);
    },
    addUV: function (_0x20db2c, _0x17504d, _0x57038c) {
      const _0x5b2213 = this['uvs'],
        _0x378fed = this['object']['geometry']['uvs'];
      (_0x378fed['push'](_0x5b2213[_0x20db2c + 0x0], _0x5b2213[_0x20db2c + 0x1]),
        _0x378fed['push'](_0x5b2213[_0x17504d + 0x0], _0x5b2213[_0x17504d + 0x1]),
        _0x378fed['push'](_0x5b2213[_0x57038c + 0x0], _0x5b2213[_0x57038c + 0x1]));
    },
    addDefaultUV: function () {
      const _0x3f7db3 = this['object']['geometry']['uvs'];
      (_0x3f7db3['push'](0x0, 0x0), _0x3f7db3['push'](0x0, 0x0), _0x3f7db3['push'](0x0, 0x0));
    },
    addUVLine: function (_0x4760b2) {
      const _0x496222 = this['uvs'],
        _0x288ceb = this['object']['geometry']['uvs'];
      _0x288ceb['push'](_0x496222[_0x4760b2 + 0x0], _0x496222[_0x4760b2 + 0x1]);
    },
    addFace: function (
      _0x5833c3,
      _0x4c231c,
      _0x6d0ba1,
      _0x37e8d9,
      _0x296e4d,
      _0x130862,
      _0x186c91,
      _0x6c0851,
      _0x4d5d14,
    ) {
      const _0x4d74a0 = this['vertices']['length'];
      let _0x161ac8 = this['parseVertexIndex'](_0x5833c3, _0x4d74a0),
        _0xda16e7 = this['parseVertexIndex'](_0x4c231c, _0x4d74a0),
        _0x208219 = this['parseVertexIndex'](_0x6d0ba1, _0x4d74a0);
      (this['addVertex'](_0x161ac8, _0xda16e7, _0x208219), this['addColor'](_0x161ac8, _0xda16e7, _0x208219));
      if (_0x186c91 !== undefined && _0x186c91 !== '') {
        const _0x201d40 = this['normals']['length'];
        ((_0x161ac8 = this['parseNormalIndex'](_0x186c91, _0x201d40)),
          (_0xda16e7 = this['parseNormalIndex'](_0x6c0851, _0x201d40)),
          (_0x208219 = this['parseNormalIndex'](_0x4d5d14, _0x201d40)),
          this['addNormal'](_0x161ac8, _0xda16e7, _0x208219));
      } else this['addFaceNormal'](_0x161ac8, _0xda16e7, _0x208219);
      if (_0x37e8d9 !== undefined && _0x37e8d9 !== '') {
        const _0x102a2d = this['uvs']['length'];
        ((_0x161ac8 = this['parseUVIndex'](_0x37e8d9, _0x102a2d)),
          (_0xda16e7 = this['parseUVIndex'](_0x296e4d, _0x102a2d)),
          (_0x208219 = this['parseUVIndex'](_0x130862, _0x102a2d)),
          this['addUV'](_0x161ac8, _0xda16e7, _0x208219),
          (this['object']['geometry']['hasUVIndices'] = !![]));
      } else this['addDefaultUV']();
    },
    addPointGeometry: function (_0x205c50) {
      this['object']['geometry']['type'] = 'Points';
      const _0x1d3315 = this['vertices']['length'];
      for (let _0x2a2dec = 0x0, _0x3d0aa4 = _0x205c50['length']; _0x2a2dec < _0x3d0aa4; _0x2a2dec++) {
        const _0x10833b = this['parseVertexIndex'](_0x205c50[_0x2a2dec], _0x1d3315);
        (this['addVertexPoint'](_0x10833b), this['addColor'](_0x10833b));
      }
    },
    addLineGeometry: function (_0x3d2ad4, _0x548abc) {
      this['object']['geometry']['type'] = 'Line';
      const _0x237eb0 = this['vertices']['length'],
        _0x12eb29 = this['uvs']['length'];
      for (let _0x52d130 = 0x0, _0x9bf314 = _0x3d2ad4['length']; _0x52d130 < _0x9bf314; _0x52d130++) {
        this['addVertexLine'](this['parseVertexIndex'](_0x3d2ad4[_0x52d130], _0x237eb0));
      }
      for (let _0x3ba76c = 0x0, _0x2d7729 = _0x548abc['length']; _0x3ba76c < _0x2d7729; _0x3ba76c++) {
        this['addUVLine'](this['parseUVIndex'](_0x548abc[_0x3ba76c], _0x12eb29));
      }
    },
  };
  return (_0x496982['startObject']('', ![]), _0x496982);
}
class OBJLoader extends Loader {
  constructor(_0x3a910e) {
    (super(_0x3a910e), (this['materials'] = null));
  }
  ['load'](_0x199088, _0x3a4205, _0x5a8c6a, _0xc6dac7) {
    const _0x1e88ee = this,
      _0x215b53 = new FileLoader(this['manager']);
    (_0x215b53['setPath'](this['path']),
      _0x215b53['setRequestHeader'](this['requestHeader']),
      _0x215b53['setWithCredentials'](this['withCredentials']),
      _0x215b53['load'](
        _0x199088,
        function (_0x5607ac) {
          try {
            _0x3a4205(_0x1e88ee['parse'](_0x5607ac));
          } catch (_0x3d087b) {
            (_0xc6dac7 ? _0xc6dac7(_0x3d087b) : console['error'](_0x3d087b),
              _0x1e88ee['manager']['itemError'](_0x199088));
          }
        },
        _0x5a8c6a,
        _0xc6dac7,
      ));
  }
  ['setMaterials'](_0xf3dece) {
    return ((this['materials'] = _0xf3dece), this);
  }
  ['parse'](_0x3dec21) {
    const _0x4880b3 = new ParserState();
    _0x3dec21['indexOf']('\x0d\x0a') !== -0x1 && (_0x3dec21 = _0x3dec21['replace'](/\r\n/g, '\x0a'));
    _0x3dec21['indexOf']('\x5c\x0a') !== -0x1 && (_0x3dec21 = _0x3dec21['replace'](/\\\n/g, ''));
    const _0x476e66 = _0x3dec21['split']('\x0a');
    let _0x2268ea = [];
    for (let _0x24a7cb = 0x0, _0x54831c = _0x476e66['length']; _0x24a7cb < _0x54831c; _0x24a7cb++) {
      const _0x28f4a2 = _0x476e66[_0x24a7cb]['trimStart']();
      if (_0x28f4a2['length'] === 0x0) continue;
      const _0x477ef7 = _0x28f4a2['charAt'](0x0);
      if (_0x477ef7 === '#') continue;
      if (_0x477ef7 === 'v') {
        const _0x53d167 = _0x28f4a2['split'](_face_vertex_data_separator_pattern);
        switch (_0x53d167[0x0]) {
          case 'v':
            _0x4880b3['vertices']['push'](
              parseFloat(_0x53d167[0x1]),
              parseFloat(_0x53d167[0x2]),
              parseFloat(_0x53d167[0x3]),
            );
            _0x53d167['length'] >= 0x7
              ? (_color['setRGB'](
                  parseFloat(_0x53d167[0x4]),
                  parseFloat(_0x53d167[0x5]),
                  parseFloat(_0x53d167[0x6]),
                  SRGBColorSpace,
                ),
                _0x4880b3['colors']['push'](_color['r'], _color['g'], _color['b']))
              : _0x4880b3['colors']['push'](undefined, undefined, undefined);
            break;
          case 'vn':
            _0x4880b3['normals']['push'](
              parseFloat(_0x53d167[0x1]),
              parseFloat(_0x53d167[0x2]),
              parseFloat(_0x53d167[0x3]),
            );
            break;
          case 'vt':
            _0x4880b3['uvs']['push'](parseFloat(_0x53d167[0x1]), parseFloat(_0x53d167[0x2]));
            break;
        }
      } else {
        if (_0x477ef7 === 'f') {
          const _0x3cc7ef = _0x28f4a2['slice'](0x1)['trim'](),
            _0x1374d8 = _0x3cc7ef['split'](_face_vertex_data_separator_pattern),
            _0x3b07dd = [];
          for (let _0x17d993 = 0x0, _0x46928d = _0x1374d8['length']; _0x17d993 < _0x46928d; _0x17d993++) {
            const _0x4a22d8 = _0x1374d8[_0x17d993];
            if (_0x4a22d8['length'] > 0x0) {
              const _0x216d6f = _0x4a22d8['split']('/');
              _0x3b07dd['push'](_0x216d6f);
            }
          }
          const _0x26a595 = _0x3b07dd[0x0];
          for (
            let _0x3631b6 = 0x1, _0x4dd7c5 = _0x3b07dd['length'] - 0x1;
            _0x3631b6 < _0x4dd7c5;
            _0x3631b6++
          ) {
            const _0x2893fd = _0x3b07dd[_0x3631b6],
              _0x551b82 = _0x3b07dd[_0x3631b6 + 0x1];
            _0x4880b3['addFace'](
              _0x26a595[0x0],
              _0x2893fd[0x0],
              _0x551b82[0x0],
              _0x26a595[0x1],
              _0x2893fd[0x1],
              _0x551b82[0x1],
              _0x26a595[0x2],
              _0x2893fd[0x2],
              _0x551b82[0x2],
            );
          }
        } else {
          if (_0x477ef7 === 'l') {
            const _0x22ad4f = _0x28f4a2['substring'](0x1)['trim']()['split']('\x20');
            let _0x382c94 = [];
            const _0x450afa = [];
            if (_0x28f4a2['indexOf']('/') === -0x1) _0x382c94 = _0x22ad4f;
            else
              for (let _0x1dd52d = 0x0, _0x44ed4a = _0x22ad4f['length']; _0x1dd52d < _0x44ed4a; _0x1dd52d++) {
                const _0x58fd4b = _0x22ad4f[_0x1dd52d]['split']('/');
                if (_0x58fd4b[0x0] !== '') _0x382c94['push'](_0x58fd4b[0x0]);
                if (_0x58fd4b[0x1] !== '') _0x450afa['push'](_0x58fd4b[0x1]);
              }
            _0x4880b3['addLineGeometry'](_0x382c94, _0x450afa);
          } else {
            if (_0x477ef7 === 'p') {
              const _0x3a07b2 = _0x28f4a2['slice'](0x1)['trim'](),
                _0x2911ed = _0x3a07b2['split']('\x20');
              _0x4880b3['addPointGeometry'](_0x2911ed);
            } else {
              if ((_0x2268ea = _object_pattern['exec'](_0x28f4a2)) !== null) {
                const _0x55fb5d = ('\x20' + _0x2268ea[0x0]['slice'](0x1)['trim']())['slice'](0x1);
                _0x4880b3['startObject'](_0x55fb5d);
              } else {
                if (_material_use_pattern['test'](_0x28f4a2))
                  _0x4880b3['object']['startMaterial'](
                    _0x28f4a2['substring'](0x7)['trim'](),
                    _0x4880b3['materialLibraries'],
                  );
                else {
                  if (_material_library_pattern['test'](_0x28f4a2))
                    _0x4880b3['materialLibraries']['push'](_0x28f4a2['substring'](0x7)['trim']());
                  else {
                    if (_map_use_pattern['test'](_0x28f4a2))
                      console['warn'](
                        'THREE.OBJLoader:\x20Rendering\x20identifier\x20\x22usemap\x22\x20not\x20supported.\x20Textures\x20must\x20be\x20defined\x20in\x20MTL\x20files.',
                      );
                    else {
                      if (_0x477ef7 === 's') {
                        _0x2268ea = _0x28f4a2['split']('\x20');
                        if (_0x2268ea['length'] > 0x1) {
                          const _0x4bcf22 = _0x2268ea[0x1]['trim']()['toLowerCase']();
                          _0x4880b3['object']['smooth'] = _0x4bcf22 !== '0' && _0x4bcf22 !== 'off';
                        } else _0x4880b3['object']['smooth'] = !![];
                        const _0x3e0ca3 = _0x4880b3['object']['currentMaterial']();
                        if (_0x3e0ca3) _0x3e0ca3['smooth'] = _0x4880b3['object']['smooth'];
                      } else {
                        if (_0x28f4a2 === '\x00') continue;
                        console['warn'](
                          'THREE.OBJLoader:\x20Unexpected\x20line:\x20\x22' + _0x28f4a2 + '\x22',
                        );
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    _0x4880b3['finalize']();
    const _0x89c056 = new Group();
    _0x89c056['materialLibraries'] = []['concat'](_0x4880b3['materialLibraries']);
    const _0xa0778b = !(
      _0x4880b3['objects']['length'] === 0x1 &&
      _0x4880b3['objects'][0x0]['geometry']['vertices']['length'] === 0x0
    );
    if (_0xa0778b === !![])
      for (
        let _0x2314f3 = 0x0, _0x1be563 = _0x4880b3['objects']['length'];
        _0x2314f3 < _0x1be563;
        _0x2314f3++
      ) {
        const _0x19e809 = _0x4880b3['objects'][_0x2314f3],
          _0x5ac128 = _0x19e809['geometry'],
          _0x8b6d2e = _0x19e809['materials'],
          _0x40b2ca = _0x5ac128['type'] === 'Line',
          _0x319342 = _0x5ac128['type'] === 'Points';
        let _0x14f6c2 = ![];
        if (_0x5ac128['vertices']['length'] === 0x0) continue;
        const _0x3c8e43 = new BufferGeometry();
        _0x3c8e43['setAttribute']('position', new Float32BufferAttribute(_0x5ac128['vertices'], 0x3));
        _0x5ac128['normals']['length'] > 0x0 &&
          _0x3c8e43['setAttribute']('normal', new Float32BufferAttribute(_0x5ac128['normals'], 0x3));
        _0x5ac128['colors']['length'] > 0x0 &&
          ((_0x14f6c2 = !![]),
          _0x3c8e43['setAttribute']('color', new Float32BufferAttribute(_0x5ac128['colors'], 0x3)));
        _0x5ac128['hasUVIndices'] === !![] &&
          _0x3c8e43['setAttribute']('uv', new Float32BufferAttribute(_0x5ac128['uvs'], 0x2));
        const _0x5ae5b7 = [];
        for (let _0x2c38cc = 0x0, _0x147313 = _0x8b6d2e['length']; _0x2c38cc < _0x147313; _0x2c38cc++) {
          const _0xa0c5fc = _0x8b6d2e[_0x2c38cc],
            _0x527dba = _0xa0c5fc['name'] + '_' + _0xa0c5fc['smooth'] + '_' + _0x14f6c2;
          let _0xb1caef = _0x4880b3['materials'][_0x527dba];
          if (this['materials'] !== null) {
            _0xb1caef = this['materials']['create'](_0xa0c5fc['name']);
            if (_0x40b2ca && _0xb1caef && !(_0xb1caef instanceof LineBasicMaterial)) {
              const _0x2b561a = new LineBasicMaterial();
              (Material['prototype']['copy']['call'](_0x2b561a, _0xb1caef),
                _0x2b561a['color']['copy'](_0xb1caef['color']),
                (_0xb1caef = _0x2b561a));
            } else {
              if (_0x319342 && _0xb1caef && !(_0xb1caef instanceof PointsMaterial)) {
                const _0x8899fa = new PointsMaterial({ size: 0xa, sizeAttenuation: ![] });
                (Material['prototype']['copy']['call'](_0x8899fa, _0xb1caef),
                  _0x8899fa['color']['copy'](_0xb1caef['color']),
                  (_0x8899fa['map'] = _0xb1caef['map']),
                  (_0xb1caef = _0x8899fa));
              }
            }
          }
          if (_0xb1caef === undefined) {
            if (_0x40b2ca) _0xb1caef = new LineBasicMaterial();
            else
              _0x319342
                ? (_0xb1caef = new PointsMaterial({ size: 0x1, sizeAttenuation: ![] }))
                : (_0xb1caef = new MeshPhongMaterial());
            ((_0xb1caef['name'] = _0xa0c5fc['name']),
              (_0xb1caef['flatShading'] = _0xa0c5fc['smooth'] ? ![] : !![]),
              (_0xb1caef['vertexColors'] = _0x14f6c2),
              (_0x4880b3['materials'][_0x527dba] = _0xb1caef));
          }
          _0x5ae5b7['push'](_0xb1caef);
        }
        let _0x458b15;
        if (_0x5ae5b7['length'] > 0x1) {
          for (let _0x37b2a2 = 0x0, _0x1eed9d = _0x8b6d2e['length']; _0x37b2a2 < _0x1eed9d; _0x37b2a2++) {
            const _0x407ae0 = _0x8b6d2e[_0x37b2a2];
            _0x3c8e43['addGroup'](_0x407ae0['groupStart'], _0x407ae0['groupCount'], _0x37b2a2);
          }
          if (_0x40b2ca) _0x458b15 = new LineSegments(_0x3c8e43, _0x5ae5b7);
          else
            _0x319342
              ? (_0x458b15 = new Points(_0x3c8e43, _0x5ae5b7))
              : (_0x458b15 = new Mesh(_0x3c8e43, _0x5ae5b7));
        } else {
          if (_0x40b2ca) _0x458b15 = new LineSegments(_0x3c8e43, _0x5ae5b7[0x0]);
          else
            _0x319342
              ? (_0x458b15 = new Points(_0x3c8e43, _0x5ae5b7[0x0]))
              : (_0x458b15 = new Mesh(_0x3c8e43, _0x5ae5b7[0x0]));
        }
        ((_0x458b15['name'] = _0x19e809['name']), _0x89c056['add'](_0x458b15));
      }
    else {
      if (_0x4880b3['vertices']['length'] > 0x0) {
        const _0x903ce1 = new PointsMaterial({ size: 0x1, sizeAttenuation: ![] }),
          _0x5959b = new BufferGeometry();
        _0x5959b['setAttribute']('position', new Float32BufferAttribute(_0x4880b3['vertices'], 0x3));
        _0x4880b3['colors']['length'] > 0x0 &&
          _0x4880b3['colors'][0x0] !== undefined &&
          (_0x5959b['setAttribute']('color', new Float32BufferAttribute(_0x4880b3['colors'], 0x3)),
          (_0x903ce1['vertexColors'] = !![]));
        const _0x1c7f65 = new Points(_0x5959b, _0x903ce1);
        _0x89c056['add'](_0x1c7f65);
      }
    }
    return _0x89c056;
  }
}
export { OBJLoader };

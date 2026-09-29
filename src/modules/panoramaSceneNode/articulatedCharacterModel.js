import * as threeRuntime from './threeRuntime.js';
import { mergeGeometries } from '../../../vendor/three/examples/jsm/utils/BufferGeometryUtils.js';
export function createCharacterClayMaterial(_0x2209e9) {
  return new threeRuntime['MeshStandardMaterial']({
    color: _0x2209e9?.['isColor'] ? _0x2209e9['clone']() : new threeRuntime['Color'](_0x2209e9),
    roughness: 0.72,
    metalness: 0x0,
    vertexColors: !![],
  });
}
export function buildArticulatedCharacterShell(_0x479de1) {
  _0x479de1['updateMatrixWorld'](!![]);
  const _0x1da167 = [];
  let _0x100e21;
  _0x479de1['traverse']((_0x539f12) => {
    if (_0x539f12['isMesh']) _0x1da167['push'](_0x539f12);
    if (_0x539f12['isSkinnedMesh']) _0x100e21 ||= _0x539f12['skeleton'];
  });
  if (!_0x100e21) throw new Error('人偶模型缺少骨骼。');
  const _0x5e60d3 = _0x100e21['bones'],
    _0x4f45a9 = [],
    _0x450485 = _0x479de1['matrixWorld']['clone']()['invert'](),
    _0x1280db = (_0x10799e) =>
      _0x479de1['getObjectByName'](_0x10799e)?.['getWorldPosition'](new threeRuntime['Vector3']()),
    _0x3fe3f6 = (
      _0x469ac9,
      _0x234b03,
      _0x2c38ad,
      _0x587a21,
      _0x465506 = new threeRuntime['Quaternion'](),
      _0xb83d9 = 0x1,
    ) => {
      const _0x548af8 = _0x5e60d3['findIndex']((_0x2b07f0) => _0x2b07f0['name'] === _0x234b03);
      if (_0x548af8 < 0x0 || !_0x2c38ad) {
        _0x469ac9['dispose']();
        return;
      }
      (_0x469ac9['applyMatrix4'](
        new threeRuntime['Matrix4']()['compose'](
          _0x2c38ad,
          _0x465506,
          new threeRuntime['Vector3'](..._0x587a21),
        ),
      ),
        _0x469ac9['applyMatrix4'](_0x450485));
      const _0x2611f6 = _0x469ac9['getAttribute']('position')['count'],
        _0x48c96e = new Uint16Array(_0x2611f6 * 0x4),
        _0xc0cf96 = new Float32Array(_0x2611f6 * 0x4),
        _0x21bd28 = new Float32Array(_0x2611f6 * 0x3)['fill'](_0xb83d9);
      for (let _0x58e60d = 0x0; _0x58e60d < _0x2611f6; _0x58e60d += 0x1) {
        ((_0x48c96e[_0x58e60d * 0x4] = _0x548af8), (_0xc0cf96[_0x58e60d * 0x4] = 0x1));
      }
      (_0x469ac9['setAttribute']('skinIndex', new threeRuntime['Uint16BufferAttribute'](_0x48c96e, 0x4)),
        _0x469ac9['setAttribute']('skinWeight', new threeRuntime['Float32BufferAttribute'](_0xc0cf96, 0x4)),
        _0x469ac9['setAttribute']('color', new threeRuntime['Float32BufferAttribute'](_0x21bd28, 0x3)),
        _0x4f45a9['push'](_0x469ac9));
    },
    _0x17bff8 = (_0x55a041, _0x3bc1ce, _0x511284, _0x22a2be = 0x1) =>
      _0x3fe3f6(
        new threeRuntime['SphereGeometry'](0x1, 0x10, 0xc),
        _0x55a041,
        _0x3bc1ce,
        _0x511284,
        undefined,
        _0x22a2be,
      ),
    _0x4ccb58 = (_0x2a4922, _0x403168, _0x5c149c, _0x229b7e = _0x5c149c * 0.8) => {
      const _0x1a7ad6 = _0x1280db(_0x2a4922),
        _0x4ea345 = _0x1280db(_0x403168);
      if (!_0x1a7ad6 || !_0x4ea345) return;
      const _0x1f4315 = _0x4ea345['clone']()['sub'](_0x1a7ad6),
        _0x25ac0b = _0x1f4315['length']();
      (_0x3fe3f6(
        new threeRuntime['CylinderGeometry'](
          _0x229b7e,
          _0x5c149c,
          Math['max'](0.005, _0x25ac0b - _0x5c149c * 1.35),
          0xc,
        ),
        _0x2a4922,
        _0x1a7ad6['clone']()['lerp'](_0x4ea345, 0.5),
        [0x1, 0x1, 0x1],
        new threeRuntime['Quaternion']()['setFromUnitVectors'](
          new threeRuntime['Vector3'](0x0, 0x1, 0x0),
          _0x1f4315['normalize'](),
        ),
      ),
        _0x17bff8(_0x2a4922, _0x1a7ad6, [_0x5c149c * 0.92, _0x5c149c * 0.92, _0x5c149c * 0.92], 0.55));
    };
  for (const _0x4119c8 of ['l', 'r']) {
    (_0x4ccb58('upperarm_' + _0x4119c8, 'lowerarm_' + _0x4119c8, 0.063, 0.051),
      _0x4ccb58('lowerarm_' + _0x4119c8, 'hand_' + _0x4119c8, 0.05, 0.036),
      _0x4ccb58('thigh_' + _0x4119c8, 'calf_' + _0x4119c8, 0.096, 0.067),
      _0x4ccb58('calf_' + _0x4119c8, 'foot_' + _0x4119c8, 0.066, 0.043),
      _0x17bff8(
        'foot_' + _0x4119c8,
        _0x1280db('foot_' + _0x4119c8)?.['add'](new threeRuntime['Vector3'](0x0, -0.015, 0.045)),
        [0.055, 0.04, 0.11],
      ),
      _0x17bff8('hand_' + _0x4119c8, _0x1280db('hand_' + _0x4119c8), [0.034, 0.06, 0.026]));
  }
  _0x17bff8('pelvis', _0x1280db('pelvis'), [0.16, 0.105, 0.11]);
  const _0x5b990b = _0x1280db('spine_02'),
    _0x3831d1 = _0x1280db('neck_01');
  if (_0x5b990b && _0x3831d1)
    _0x17bff8('spine_02', _0x5b990b['clone']()['lerp'](_0x3831d1, 0.15), [
      0.205,
      Math['max'](0.17, _0x3831d1['y'] - _0x5b990b['y']),
      0.115,
    ]);
  (_0x17bff8('spine_01', _0x1280db('spine_01'), [0.11, 0.1, 0.095], 0.55),
    _0x4ccb58('neck_01', 'Head', 0.041));
  const _0x10c2aa = _0x1280db('Head');
  _0x10c2aa &&
    (_0x17bff8(
      'Head',
      _0x10c2aa['clone']()['add'](new threeRuntime['Vector3'](0x0, 0.065, 0x0)),
      [0.093, 0.127, 0.097],
    ),
    _0x17bff8(
      'Head',
      _0x10c2aa['clone']()['add'](new threeRuntime['Vector3'](0x0, 0.048, 0.094)),
      [0.019, 0.028, 0.018],
      0.65,
    ));
  for (const _0x3cf097 of _0x5e60d3) {
    if (!/(thumb|index|middle|ring|pinky)/i['test'](_0x3cf097['name'])) continue;
    const _0x4fd2f8 = _0x3cf097['children']['find']((_0x30dcb1) => _0x30dcb1['isBone']);
    if (_0x4fd2f8) _0x4ccb58(_0x3cf097['name'], _0x4fd2f8['name'], 0.009, 0.007);
  }
  const _0x1ddc38 = mergeGeometries(_0x4f45a9);
  _0x4f45a9['forEach']((_0x47a190) => _0x47a190['dispose']());
  const _0x186acf = createCharacterClayMaterial(new threeRuntime['Color'](0x1, 0x1, 0x1)),
    _0xc57a3f = new threeRuntime['SkinnedMesh'](_0x1ddc38, _0x186acf);
  return (
    (_0xc57a3f['name'] = 'ArticulatedDirectorMannequin'),
    _0x1da167['forEach']((_0x46bf99) => _0x46bf99['removeFromParent']()),
    _0x479de1['add'](_0xc57a3f),
    _0x479de1['updateMatrixWorld'](!![]),
    _0xc57a3f['bind'](new threeRuntime['Skeleton'](_0x5e60d3)),
    (_0xc57a3f['frustumCulled'] = ![]),
    (_0xc57a3f['receiveShadow'] = !![]),
    (_0x479de1['userData']['characterStyle'] = 'articulated'),
    _0x479de1
  );
}

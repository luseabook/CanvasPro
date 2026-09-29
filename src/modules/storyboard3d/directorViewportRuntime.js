import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { clientToViewportNdc, ndcToViewportPoint, intersectRayWithAxisPlane } from '../../core/math.js';
import { focalLengthToFov, cameraPoseToSceneView } from '../../core/panoramaSceneMath.js';
export class DirectorViewportRuntime {
  constructor(_0x50443b) {
    this['bridge'] = _0x50443b;
  }
  get ['canvas']() {
    return this['bridge']['renderer']['domElement'];
  }
  ['project'](_0x500169) {
    const _0x3266d6 = new threeRuntime['Vector3'](..._0x500169)['project'](this['bridge']['camera']);
    return ndcToViewportPoint(_0x3266d6, this['canvas']['getBoundingClientRect']());
  }
  ['pointOnPlane'](_0x4efcd3, _0x6bd78a, _0x592db7, _0x3603c0) {
    const _0x20bd1 = clientToViewportNdc(_0x4efcd3, _0x6bd78a, this['canvas']['getBoundingClientRect']());
    if (!_0x20bd1) return null;
    const _0x5475ac = new threeRuntime['Raycaster']();
    return (
      _0x5475ac['setFromCamera'](_0x20bd1, this['bridge']['camera']),
      intersectRayWithAxisPlane(
        _0x5475ac['ray']['origin']['toArray'](),
        _0x5475ac['ray']['direction']['toArray'](),
        _0x592db7,
        _0x3603c0,
      )
    );
  }
  ['frameSceneView'](_0xf9b2cd) {
    if (!_0xf9b2cd['length']) return null;
    const _0x56a71c = new threeRuntime['Box3']()['setFromPoints'](
        _0xf9b2cd['map']((_0x5b6d99) => new threeRuntime['Vector3'](..._0x5b6d99)),
      ),
      _0x229cb4 = _0x56a71c['getBoundingSphere'](new threeRuntime['Sphere']()),
      _0x3025f5 = Math['max'](
        0x3,
        (_0x229cb4['radius'] /
          Math['sin']((Math['min'](0x23, 0x23 * this['bridge']['camera']['aspect']) * Math['PI']) / 0x168)) *
          1.2,
      ),
      _0x101e03 = this['bridge']['camera']['getWorldDirection'](new threeRuntime['Vector3']()),
      _0x18017b = _0x229cb4['center']['clone']()['addScaledVector'](_0x101e03, -_0x3025f5);
    return cameraPoseToSceneView({ position: _0x18017b, forward: _0x101e03 }, _0x3025f5);
  }
  async ['renderMonitor'](_0x12a603, _0x30794c) {
    if (!_0x30794c || !_0x12a603?.['isConnected']) return;
    this['monitor']?.['domElement'] !== _0x12a603 &&
      (this['disposeMonitor'](),
      (this['monitor'] = new threeRuntime['WebGLRenderer']({
        canvas: _0x12a603,
        antialias: !![],
        alpha: !![],
      })),
      (this['monitor']['outputColorSpace'] = this['bridge']['renderer']['outputColorSpace']),
      (this['monitor']['toneMapping'] = this['bridge']['renderer']['toneMapping']),
      (this['monitor']['toneMappingExposure'] = this['bridge']['renderer']['toneMappingExposure']),
      (this['monitor']['shadowMap']['enabled'] = this['bridge']['renderer']['shadowMap']['enabled']),
      (this['monitor']['shadowMap']['type'] = this['bridge']['renderer']['shadowMap']['type']),
      (this['monitorCamera'] = new threeRuntime['PerspectiveCamera']()));
    const _0x117f2a = Math['max'](0x1, Math['round'](_0x12a603['clientWidth'])),
      _0x4f08b3 = String(_0x30794c['aspectRatio'] || '16:9')
        ['split'](':')
        ['map'](Number),
      _0x2e4a83 = _0x4f08b3[0x0] > 0x0 && _0x4f08b3[0x1] > 0x0 ? _0x4f08b3[0x0] / _0x4f08b3[0x1] : 0x10 / 0x9,
      _0x47bcf1 = Math['max'](0x1, Math['round'](_0x117f2a / _0x2e4a83));
    if (_0x12a603['width'] !== _0x117f2a || _0x12a603['height'] !== _0x47bcf1)
      this['monitor']['setSize'](_0x117f2a, _0x47bcf1, ![]);
    const _0x42e9ee = this['monitorCamera'];
    return (
      Object['assign'](_0x42e9ee, {
        aspect: _0x2e4a83,
        near: _0x30794c['near'] || 0.1,
        far: _0x30794c['far'] || 0x3e8,
        fov: _0x30794c['fov'] ?? focalLengthToFov(_0x30794c['focalLength']),
      }),
      _0x42e9ee['position']['fromArray'](_0x30794c['position']),
      _0x42e9ee['up']['set'](0x0, 0x1, 0x0),
      _0x42e9ee['lookAt'](new threeRuntime['Vector3'](..._0x30794c['target'])),
      _0x42e9ee['rotateZ'](_0x30794c['roll'] || 0x0),
      _0x42e9ee['updateProjectionMatrix'](),
      this['bridge']['_withCleanCaptureFrame'](() =>
        this['monitor']['render'](this['bridge']['scene'], _0x42e9ee),
      )
    );
  }
  ['disposeMonitor']() {
    (this['monitor']?.['dispose'](),
      this['monitor']?.['forceContextLoss'](),
      (this['monitor'] = null),
      (this['monitorCamera'] = null));
  }
}

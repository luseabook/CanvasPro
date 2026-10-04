import * as threeRuntime from '../panoramaSceneNode/threeRuntime.js';
import { clientToViewportNdc, ndcToViewportPoint, intersectRayWithAxisPlane } from '../../core/math.js';
import { focalLengthToFov, cameraPoseToSceneView } from '../../core/panoramaSceneMath.js';
export class DirectorViewportRuntime {
  constructor(value) {
    this['bridge'] = value;
  }
  get ['canvas']() {
    return this['bridge']['renderer']['domElement'];
  }
  ['project'](args) {
    const item = new threeRuntime['Vector3'](...args)['project'](this['bridge']['camera']);
    return ndcToViewportPoint(item, this['canvas']['getBoundingClientRect']());
  }
  ['pointOnPlane'](key, index, result, data) {
    const viewportNdc = clientToViewportNdc(key, index, this['canvas']['getBoundingClientRect']());
    if (!viewportNdc) return null;
    const options = new threeRuntime['Raycaster']();
    return (
      options['setFromCamera'](viewportNdc, this['bridge']['camera']),
      intersectRayWithAxisPlane(
        options['ray']['origin']['toArray'](),
        options['ray']['direction']['toArray'](),
        result,
        data,
      )
    );
  }
  ['frameSceneView'](list) {
    if (!list['length']) return null;
    const target = new threeRuntime['Box3']()['setFromPoints'](
        list['map']((args2) => new threeRuntime['Vector3'](...args2)),
      ),
      source = target['getBoundingSphere'](new threeRuntime['Sphere']()),
      next = Math['max'](
        0x3,
        (source['radius'] /
          Math['sin']((Math['min'](0x23, 0x23 * this['bridge']['camera']['aspect']) * Math['PI']) / 0x168)) *
          1.2,
      ),
      forward = this['bridge']['camera']['getWorldDirection'](new threeRuntime['Vector3']()),
      position = source['center']['clone']()['addScaledVector'](forward, -next);
    return cameraPoseToSceneView({ position: position, forward: forward }, next);
  }
  async ['renderMonitor'](canvas, near) {
    if (!near || !canvas?.['isConnected']) return;
    this['monitor']?.['domElement'] !== canvas &&
      (this['disposeMonitor'](),
      (this['monitor'] = new threeRuntime['WebGLRenderer']({
        canvas: canvas,
        antialias: !![],
        alpha: !![],
      })),
      (this['monitor']['outputColorSpace'] = this['bridge']['renderer']['outputColorSpace']),
      (this['monitor']['toneMapping'] = this['bridge']['renderer']['toneMapping']),
      (this['monitor']['toneMappingExposure'] = this['bridge']['renderer']['toneMappingExposure']),
      (this['monitor']['shadowMap']['enabled'] = this['bridge']['renderer']['shadowMap']['enabled']),
      (this['monitor']['shadowMap']['type'] = this['bridge']['renderer']['shadowMap']['type']),
      (this['monitorCamera'] = new threeRuntime['PerspectiveCamera']()));
    const current = Math['max'](0x1, Math['round'](canvas['clientWidth'])),
      entry = String(near['aspectRatio'] || '16:9')
        ['split'](':')
        ['map'](Number),
      aspect = entry[0x0] > 0x0 && entry[0x1] > 0x0 ? entry[0x0] / entry[0x1] : 0x10 / 0x9,
      record = Math['max'](0x1, Math['round'](current / aspect));
    if (canvas['width'] !== current || canvas['height'] !== record)
      this['monitor']['setSize'](current, record, ![]);
    const payload = this['monitorCamera'];
    return (
      Object['assign'](payload, {
        aspect: aspect,
        near: near['near'] || 0.1,
        far: near['far'] || 0x3e8,
        fov: near['fov'] ?? focalLengthToFov(near['focalLength']),
      }),
      payload['position']['fromArray'](near['position']),
      payload['up']['set'](0x0, 0x1, 0x0),
      payload['lookAt'](new threeRuntime['Vector3'](...near['target'])),
      payload['rotateZ'](near['roll'] || 0x0),
      payload['updateProjectionMatrix'](),
      this['bridge']['_withCleanCaptureFrame'](() =>
        this['monitor']['render'](this['bridge']['scene'], payload),
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

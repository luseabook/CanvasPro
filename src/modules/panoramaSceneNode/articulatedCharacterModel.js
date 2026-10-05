import * as threeRuntime from './threeRuntime.js';
import { mergeGeometries } from '../../../vendor/three/examples/jsm/utils/BufferGeometryUtils.js';
export function createCharacterClayMaterial(color) {
  return new threeRuntime['MeshStandardMaterial']({
    color: color?.['isColor'] ? color['clone']() : new threeRuntime['Color'](color),
    roughness: 0.72,
    metalness: 0,
    vertexColors: !![],
  });
}
export function buildArticulatedCharacterShell(value) {
  value['updateMatrixWorld'](!![]);
  const list = [];
  let enabled;
  value['traverse']((item) => {
    if (item['isMesh']) list['push'](item);
    if (item['isSkinnedMesh']) enabled ||= item['skeleton'];
  });
  if (!enabled) throw new Error('人偶模型缺少骨骼。');
  const list2 = enabled['bones'],
    list3 = [],
    key = value['matrixWorld']['clone']()['invert'](),
    handler = (index) => value['getObjectByName'](index)?.['getWorldPosition'](new threeRuntime['Vector3']()),
    handler2 = (el, result, enabled2, args, data = new threeRuntime['Quaternion'](), options = 1) => {
      const count = list2['findIndex']((error) => error['name'] === result);
      if (count < 0 || !enabled2) {
        el['dispose']();
        return;
      }
      (el['applyMatrix4'](
        new threeRuntime['Matrix4']()['compose'](enabled2, data, new threeRuntime['Vector3'](...args)),
      ),
        el['applyMatrix4'](key));
      const target = el['getAttribute']('position')['count'],
        uint16Array = new Uint16Array(target * 4),
        float32Array = new Float32Array(target * 4),
        float32Array2 = new Float32Array(target * 3)['fill'](options);
      for (let source = 0; source < target; source += 1) {
        ((uint16Array[source * 4] = count), (float32Array[source * 4] = 1));
      }
      (el['setAttribute']('skinIndex', new threeRuntime['Uint16BufferAttribute'](uint16Array, 4)),
        el['setAttribute']('skinWeight', new threeRuntime['Float32BufferAttribute'](float32Array, 4)),
        el['setAttribute']('color', new threeRuntime['Float32BufferAttribute'](float32Array2, 3)),
        list3['push'](el));
    },
    handler3 = (next, current, entry, record = 1) =>
      handler2(new threeRuntime['SphereGeometry'](1, 16, 12), next, current, entry, undefined, record),
    handler4 = (payload, handle, state, config = state * 0.8) => {
      const enabled3 = handler(payload),
        enabled4 = handler(handle);
      if (!enabled3 || !enabled4) return;
      const list4 = enabled4['clone']()['sub'](enabled3),
        scope = list4['length']();
      (handler2(
        new threeRuntime['CylinderGeometry'](config, state, Math['max'](0.005, scope - state * 1.35), 12),
        payload,
        enabled3['clone']()['lerp'](enabled4, 0.5),
        [1, 1, 1],
        new threeRuntime['Quaternion']()['setFromUnitVectors'](
          new threeRuntime['Vector3'](0, 1, 0),
          list4['normalize'](),
        ),
      ),
        handler3(payload, enabled3, [state * 0.92, state * 0.92, state * 0.92], 0.55));
    };
  for (const input of ['l', 'r']) {
    (handler4('upperarm_' + input, 'lowerarm_' + input, 0.063, 0.051),
      handler4('lowerarm_' + input, 'hand_' + input, 0.05, 0.036),
      handler4('thigh_' + input, 'calf_' + input, 0.096, 0.067),
      handler4('calf_' + input, 'foot_' + input, 0.066, 0.043),
      handler3(
        'foot_' + input,
        handler('foot_' + input)?.['add'](new threeRuntime['Vector3'](0, -0.015, 0.045)),
        [0.055, 0.04, 0.11],
      ),
      handler3('hand_' + input, handler('hand_' + input), [0.034, 0.06, 0.026]));
  }
  handler3('pelvis', handler('pelvis'), [0.16, 0.105, 0.11]);
  const box = handler('spine_02'),
    box2 = handler('neck_01');
  if (box && box2)
    handler3('spine_02', box['clone']()['lerp'](box2, 0.15), [
      0.205,
      Math['max'](0.17, box2['y'] - box['y']),
      0.115,
    ]);
  (handler3('spine_01', handler('spine_01'), [0.11, 0.1, 0.095], 0.55), handler4('neck_01', 'Head', 0.041));
  const output = handler('Head');
  output &&
    (handler3(
      'Head',
      output['clone']()['add'](new threeRuntime['Vector3'](0, 0.065, 0)),
      [0.093, 0.127, 0.097],
    ),
    handler3(
      'Head',
      output['clone']()['add'](new threeRuntime['Vector3'](0, 0.048, 0.094)),
      [0.019, 0.028, 0.018],
      0.65,
    ));
  for (const el2 of list2) {
    if (!/(thumb|index|middle|ring|pinky)/i['test'](el2['name'])) continue;
    const error2 = el2['children']['find']((value2) => value2['isBone']);
    if (error2) handler4(el2['name'], error2['name'], 0.009, 0.007);
  }
  const geometries = mergeGeometries(list3);
  list3['forEach']((value3) => value3['dispose']());
  const characterClayMaterial = createCharacterClayMaterial(new threeRuntime['Color'](1, 1, 1)),
    error3 = new threeRuntime['SkinnedMesh'](geometries, characterClayMaterial);
  return (
    (error3['name'] = 'ArticulatedDirectorMannequin'),
    list['forEach']((value4) => value4['removeFromParent']()),
    value['add'](error3),
    value['updateMatrixWorld'](!![]),
    error3['bind'](new threeRuntime['Skeleton'](list2)),
    (error3['frustumCulled'] = ![]),
    (error3['receiveShadow'] = !![]),
    (value['userData']['characterStyle'] = 'articulated'),
    value
  );
}

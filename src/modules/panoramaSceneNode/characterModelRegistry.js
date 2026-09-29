import { PANORAMA_CHARACTER_BONES, normalizeBonePose } from './poseCatalog.js';
import * as threeRuntime from './threeRuntime.js';
import { GLTFLoader } from '../../../vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from '../../../vendor/three/examples/jsm/utils/SkeletonUtils.js';
const TARGET_CHARACTER_HEIGHT = 1.92;
export const PANORAMA_CHARACTER_MODEL_SOURCES = Object.freeze({
  male: new URL(
    '../../../assets/characters/quaternius/universal-base/Superhero_Male_FullBody.gltf',
    import.meta.url,
  ).href,
  female: new URL(
    '../../../assets/characters/quaternius/universal-base/Superhero_Female_FullBody.gltf',
    import.meta.url,
  ).href,
});
const loader = new GLTFLoader(),
  loadCache = new Map(),
  NATURAL_ARM_POSE_BY_GENDER = Object.freeze({
    male: Object.freeze({ upperArmDropRadians: 1.34, lowerArmRelaxRadians: 0 }),
    female: Object.freeze({ upperArmDropRadians: 1.38, lowerArmRelaxRadians: 0 }),
  });
export function resolvePanoramaCharacterGender(_0x5dd0f2) {
  return _0x5dd0f2 === 'female' ? 'female' : 'male';
}
export function resolvePanoramaCharacterModelUrl(_0x1f2216) {
  return PANORAMA_CHARACTER_MODEL_SOURCES[resolvePanoramaCharacterGender(_0x1f2216)];
}
function loadCharacterTemplate(_0x5f42bd) {
  const _0x3a5178 = resolvePanoramaCharacterGender(_0x5f42bd);
  if (loadCache.has(_0x3a5178)) return loadCache.get(_0x3a5178);
  if (typeof window === 'undefined')
    return Promise.reject(new Error('Quaternius character models are only loaded in browser runtime'));
  const _0x1e6f7d = new Promise((_0x251890, _0x563b0e) => {
    loader.load(
      resolvePanoramaCharacterModelUrl(_0x3a5178),
      (_0x1b4fe6) => {
        if (!_0x1b4fe6?.scene) {
          _0x563b0e(new Error('Quaternius ' + _0x3a5178 + ' model did not contain a scene'));
          return;
        }
        _0x251890(normalizeCharacterModel(_0x1b4fe6.scene, _0x3a5178));
      },
      undefined,
      _0x563b0e,
    );
  });
  return (loadCache.set(_0x3a5178, _0x1e6f7d), _0x1e6f7d);
}
function cloneCharacterTemplate(_0x34ec55) {
  return clone(_0x34ec55);
}
function resolvePanoramaCharacterNaturalArmPose(_0x2df0ca) {
  return NATURAL_ARM_POSE_BY_GENDER[resolvePanoramaCharacterGender(_0x2df0ca)];
}
function rotateBoneLocal(_0x14ad36, _0x52f63a, _0x29752b, _0x2b7d1d) {
  const _0x35dc0d = _0x14ad36?.getObjectByName?.(_0x52f63a);
  if (!_0x35dc0d) return false;
  const _0x1c827c = new threeRuntime['Quaternion']().setFromAxisAngle(_0x29752b, _0x2b7d1d);
  return (_0x35dc0d.quaternion.multiply(_0x1c827c), true);
}
export function applyPanoramaCharacterNaturalArmPose(_0x577a8a, _0x2254ca) {
  const _0x5cdbf2 = resolvePanoramaCharacterNaturalArmPose(_0x2254ca),
    _0x1e1c71 = new threeRuntime['Vector3'](0, 0, 1);
  return (
    rotateBoneLocal(_0x577a8a, 'upperarm_l', _0x1e1c71, -_0x5cdbf2.upperArmDropRadians),
    rotateBoneLocal(_0x577a8a, 'upperarm_r', _0x1e1c71, _0x5cdbf2.upperArmDropRadians),
    rotateBoneLocal(_0x577a8a, 'lowerarm_l', _0x1e1c71, -_0x5cdbf2.lowerArmRelaxRadians),
    rotateBoneLocal(_0x577a8a, 'lowerarm_r', _0x1e1c71, _0x5cdbf2.lowerArmRelaxRadians),
    _0x577a8a?.updateMatrixWorld?.(true),
    _0x577a8a
  );
}
function normalizeCharacterModel(_0x54fc56, _0x45ce1a) {
  (applyPanoramaCharacterNaturalArmPose(_0x54fc56, _0x45ce1a), _0x54fc56.updateMatrixWorld(true));
  const _0x1e4612 = new threeRuntime['Box3']().setFromObject(_0x54fc56),
    _0x2e8913 = new threeRuntime['Vector3']();
  _0x1e4612.getSize(_0x2e8913);
  const _0x34b6f2 = Math.max(0.001, _0x2e8913.y),
    _0x693204 = TARGET_CHARACTER_HEIGHT / _0x34b6f2;
  (_0x54fc56.scale.multiplyScalar(_0x693204), _0x54fc56.updateMatrixWorld(true));
  const _0x585e2b = new threeRuntime['Box3']().setFromObject(_0x54fc56),
    _0x1bcc27 = new threeRuntime['Vector3']();
  return (
    _0x585e2b.getCenter(_0x1bcc27),
    (_0x54fc56.position.x -= _0x1bcc27.x),
    (_0x54fc56.position.y -= _0x585e2b.min.y),
    (_0x54fc56.position.z -= _0x1bcc27.z),
    _0x54fc56.traverse((_0x2cb2ef) => {
      ((_0x2cb2ef.frustumCulled = false),
        _0x2cb2ef.isMesh && ((_0x2cb2ef.castShadow = false), (_0x2cb2ef.receiveShadow = true)));
    }),
    _0x54fc56
  );
}
export function preloadPanoramaCharacterModels(_0x41d598 = ['male', 'female']) {
  const _0x185e4d = Array.isArray(_0x41d598) ? _0x41d598 : [_0x41d598];
  return Promise.all(
    _0x185e4d.map((_0x436ad0) => loadCharacterTemplate(resolvePanoramaCharacterGender(_0x436ad0))),
  );
}
export async function createPanoramaCharacterModelInstance(_0x1e1883) {
  const _0x2aa706 = await loadCharacterTemplate(_0x1e1883);
  return cloneCharacterTemplate(_0x2aa706);
}

export function capturePanoramaCharacterBoneBase(_0x12857a){const _0x4b11b2={};for(const _0x1e97ed of PANORAMA_CHARACTER_BONES){const _0x8ce9d=_0x12857a?.['getObjectByName']?.(_0x1e97ed);if(!_0x8ce9d?.["quaternion"])continue;_0x4b11b2[_0x1e97ed]={'x':_0x8ce9d["quaternion"]['x'],'y':_0x8ce9d["quaternion"]['y'],'z':_0x8ce9d['quaternion']['z'],'w':_0x8ce9d["quaternion"]['w']};}return _0x4b11b2;}

export function applyPanoramaCharacterBonePose(_0x4f5e3e,_0x43eeef,_0x23f96b={}){const _0x1f1b0d=normalizeBonePose(_0x43eeef);for(const _0x393845 of PANORAMA_CHARACTER_BONES){const _0x52e33f=_0x4f5e3e?.["getObjectByName"]?.(_0x393845);if(!_0x52e33f?.["quaternion"])continue;const _0x258c19=_0x23f96b?.[_0x393845];if(_0x258c19)_0x52e33f["quaternion"]['set'](_0x258c19['x'],_0x258c19['y'],_0x258c19['z'],_0x258c19['w']);const _0x4c90af=_0x1f1b0d[_0x393845];if(!_0x4c90af)continue;const _0x27f85d=new threeRuntime[("Quaternion")]()["setFromEuler"](new threeRuntime[("Euler")](_0x4c90af['x'],_0x4c90af['y'],_0x4c90af['z'],"XYZ"));_0x52e33f['quaternion']["multiply"](_0x27f85d);}return _0x4f5e3e?.["updateMatrixWorld"]?.(!![]),_0x4f5e3e;}

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
export function resolvePanoramaCharacterGender(value) {
  return value === 'female' ? 'female' : 'male';
}
export function resolvePanoramaCharacterModelUrl(item) {
  return PANORAMA_CHARACTER_MODEL_SOURCES[resolvePanoramaCharacterGender(item)];
}
function loadCharacterTemplate(key) {
  const panoramaCharacterGender = resolvePanoramaCharacterGender(key);
  if (loadCache.has(panoramaCharacterGender)) return loadCache.get(panoramaCharacterGender);
  if (typeof window === 'undefined')
    return Promise.reject(new Error('Quaternius character models are only loaded in browser runtime'));
  const index = new Promise((handler, handler2) => {
    loader.load(
      resolvePanoramaCharacterModelUrl(panoramaCharacterGender),
      (enabled) => {
        if (!enabled?.scene) {
          handler2(new Error('Quaternius ' + panoramaCharacterGender + ' model did not contain a scene'));
          return;
        }
        handler(normalizeCharacterModel(enabled.scene, panoramaCharacterGender));
      },
      undefined,
      handler2,
    );
  });
  return (loadCache.set(panoramaCharacterGender, index), index);
}
function cloneCharacterTemplate(result) {
  return clone(result);
}
function resolvePanoramaCharacterNaturalArmPose(data) {
  return NATURAL_ARM_POSE_BY_GENDER[resolvePanoramaCharacterGender(data)];
}
function rotateBoneLocal(options, target, source, next) {
  const enabled2 = options?.getObjectByName?.(target);
  if (!enabled2) return false;
  const current = new threeRuntime.Quaternion().setFromAxisAngle(source, next);
  return (enabled2.quaternion.multiply(current), true);
}
export function applyPanoramaCharacterNaturalArmPose(entry, record) {
  const panoramaCharacterNaturalArmPose = resolvePanoramaCharacterNaturalArmPose(record),
    payload = new threeRuntime.Vector3(0, 0, 1);
  return (
    rotateBoneLocal(entry, 'upperarm_l', payload, -panoramaCharacterNaturalArmPose.upperArmDropRadians),
    rotateBoneLocal(entry, 'upperarm_r', payload, panoramaCharacterNaturalArmPose.upperArmDropRadians),
    rotateBoneLocal(entry, 'lowerarm_l', payload, -panoramaCharacterNaturalArmPose.lowerArmRelaxRadians),
    rotateBoneLocal(entry, 'lowerarm_r', payload, panoramaCharacterNaturalArmPose.lowerArmRelaxRadians),
    entry?.updateMatrixWorld?.(true),
    entry
  );
}
function normalizeCharacterModel(box, handle) {
  (applyPanoramaCharacterNaturalArmPose(box, handle), box.updateMatrixWorld(true));
  const state = new threeRuntime.Box3().setFromObject(box),
    box2 = new threeRuntime.Vector3();
  state.getSize(box2);
  const config = Math.max(0.001, box2.y),
    scope = TARGET_CHARACTER_HEIGHT / config;
  (box.scale.multiplyScalar(scope), box.updateMatrixWorld(true));
  const input = new threeRuntime.Box3().setFromObject(box),
    box3 = new threeRuntime.Vector3();
  return (
    input.getCenter(box3),
    (box.position.x -= box3.x),
    (box.position.y -= input.min.y),
    (box.position.z -= box3.z),
    box.traverse((output) => {
      ((output.frustumCulled = false),
        output.isMesh && ((output.castShadow = false), (output.receiveShadow = true)));
    }),
    box
  );
}
export function preloadPanoramaCharacterModels(value2 = ['male', 'female']) {
  const list = Array.isArray(value2) ? value2 : [value2];
  return Promise.all(list.map((item2) => loadCharacterTemplate(resolvePanoramaCharacterGender(item2))));
}
export async function createPanoramaCharacterModelInstance(value3) {
  const characterTemplate = await loadCharacterTemplate(value3);
  return cloneCharacterTemplate(characterTemplate);
}

export function capturePanoramaCharacterBoneBase(value4) {
  const value5 = {};
  for (const value6 of PANORAMA_CHARACTER_BONES) {
    const enabled3 = value4?.getObjectByName?.(value6);
    if (!enabled3?.quaternion) continue;
    value5[value6] = {
      x: enabled3.quaternion.x,
      y: enabled3.quaternion.y,
      z: enabled3.quaternion.z,
      w: enabled3.quaternion.w,
    };
  }
  return value5;
}

export function applyPanoramaCharacterBonePose(value7, value8, value9 = {}) {
  const bonePose = normalizeBonePose(value8);
  for (const value10 of PANORAMA_CHARACTER_BONES) {
    const enabled4 = value7?.getObjectByName?.(value10);
    if (!enabled4?.quaternion) continue;
    const box4 = value9?.[value10];
    if (box4) enabled4.quaternion.set(box4.x, box4.y, box4.z, box4.w);
    const box5 = bonePose[value10];
    if (!box5) continue;
    const value11 = new threeRuntime.Quaternion().setFromEuler(
      new threeRuntime.Euler(box5.x, box5.y, box5.z, 'XYZ'),
    );
    enabled4.quaternion.multiply(value11);
  }
  return (value7?.updateMatrixWorld?.(true), value7);
}

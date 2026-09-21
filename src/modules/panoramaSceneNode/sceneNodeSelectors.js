import {
  PANORAMA_SCENE_CAMERA_LIMIT,
  PANORAMA_360_NODE_ALIASES,
  PANORAMA_360_NODE_TYPE,
  PANORAMA_SCENE_NODE_ALIASES,
  PANORAMA_SCENE_NODE_TYPE,
  isPanorama360NodeType as isPanorama360NodeType_2,
  isPanoramaSceneNodeType as isPanoramaSceneNodeType_2,
  normalizePanorama360State,
  normalizeSceneOnlyPanoramaSceneState,
} from './sceneNode.js';
const TYPE_SET = new Set([
  PANORAMA_SCENE_NODE_TYPE,
  ...PANORAMA_SCENE_NODE_ALIASES,
  PANORAMA_360_NODE_TYPE,
  ...PANORAMA_360_NODE_ALIASES,
]);
export function isPanoramaSceneNodeType(_0x4432c9) {
  return TYPE_SET.has(String(_0x4432c9 || '').trim());
}
export function isPanorama360NodeType(_0x5d2fcb) {
  return isPanorama360NodeType_2(_0x5d2fcb);
}
export function isLegacyPanoramaSceneNodeType(_0x10ed03) {
  return isPanoramaSceneNodeType_2(_0x10ed03);
}
export function isPanoramaSceneNode(_0x4c88b0) {
  return !!_0x4c88b0 && isPanoramaSceneNodeType(_0x4c88b0.type);
}
export function getPanoramaSceneState(_0x3e01b4) {
  if (isPanorama360NodeType_2(_0x3e01b4?.type))
    return { ...normalizePanorama360State(_0x3e01b4?.panorama360Node), type: PANORAMA_360_NODE_TYPE };
  return { ...normalizeSceneOnlyPanoramaSceneState(_0x3e01b4?.sceneNode), type: PANORAMA_SCENE_NODE_TYPE };
}
export function getPanoramaSceneNode(_0x3ea145, _0x325d36) {
  return _0x3ea145?.getStateRaw?.().nodes?.[_0x325d36] || null;
}
export function getSelectedSceneObject(_0x14ed63) {
  const _0x1c67f0 = getPanoramaSceneState(_0x14ed63),
    { selectedObjectType: _0x1b03f5, selectedObjectId: _0x45b5db } = _0x1c67f0.selection;
  if (!_0x1b03f5 || !_0x45b5db) return null;
  return { type: _0x1b03f5, id: _0x45b5db };
}
export function getActiveSceneCamera(_0x5b8bb2) {
  const _0x3c4ef1 = getPanoramaSceneState(_0x5b8bb2);
  if (_0x3c4ef1.viewport.activeView !== 'camera' || !_0x3c4ef1.viewport.activeCameraId) return null;
  return _0x3c4ef1.cameras.find((_0x3de7cc) => _0x3de7cc.id === _0x3c4ef1.viewport.activeCameraId) || null;
}
export function canAddSceneCamera(_0x28db51) {
  if (isPanorama360NodeType_2(_0x28db51?.type)) return false;
  return getPanoramaSceneState(_0x28db51).cameras.length < PANORAMA_SCENE_CAMERA_LIMIT;
}
export function getSceneCameraCount(_0x3817d4) {
  return getPanoramaSceneState(_0x3817d4).cameras.length;
}
export function getSceneMannequinById(_0x2aa59a, _0xb73e43) {
  return getPanoramaSceneState(_0x2aa59a).mannequins.find((_0xbd119b) => _0xbd119b.id === _0xb73e43) || null;
}
export function getSceneCameraById(_0x4dd142, _0x2d9eea) {
  return getPanoramaSceneState(_0x4dd142).cameras.find((_0x5503c2) => _0x5503c2.id === _0x2d9eea) || null;
}

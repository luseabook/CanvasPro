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
export function isPanoramaSceneNodeType(value) {
  return TYPE_SET.has(String(value || '').trim());
}
export function isPanorama360NodeType(item) {
  return isPanorama360NodeType_2(item);
}
export function isLegacyPanoramaSceneNodeType(key) {
  return isPanoramaSceneNodeType_2(key);
}
export function isPanoramaSceneNode(enabled) {
  return !!enabled && isPanoramaSceneNodeType(enabled.type);
}
export function getPanoramaSceneState(index) {
  if (isPanorama360NodeType_2(index?.type))
    return { ...normalizePanorama360State(index?.panorama360Node), type: PANORAMA_360_NODE_TYPE };
  return { ...normalizeSceneOnlyPanoramaSceneState(index?.sceneNode), type: PANORAMA_SCENE_NODE_TYPE };
}
export function getPanoramaSceneNode(store, result) {
  return store?.getStateRaw?.().nodes?.[result] || null;
}
export function getSelectedSceneObject(data) {
  const panoramaSceneState = getPanoramaSceneState(data),
    { selectedObjectType: selectedObjectType, selectedObjectId: selectedObjectId } =
      panoramaSceneState.selection;
  if (!selectedObjectType || !selectedObjectId) return null;
  return { type: selectedObjectType, id: selectedObjectId };
}
export function getActiveSceneCamera(options) {
  const panoramaSceneState2 = getPanoramaSceneState(options);
  if (panoramaSceneState2.viewport.activeView !== 'camera' || !panoramaSceneState2.viewport.activeCameraId)
    return null;
  return (
    panoramaSceneState2.cameras.find((item2) => item2.id === panoramaSceneState2.viewport.activeCameraId) ||
    null
  );
}
export function canAddSceneCamera(target) {
  if (isPanorama360NodeType_2(target?.type)) return false;
  return getPanoramaSceneState(target).cameras.length < PANORAMA_SCENE_CAMERA_LIMIT;
}
export function getSceneCameraCount(source) {
  return getPanoramaSceneState(source).cameras.length;
}
export function getSceneMannequinById(next, current) {
  return getPanoramaSceneState(next).mannequins.find((item3) => item3.id === current) || null;
}
export function getSceneCameraById(entry, record) {
  return getPanoramaSceneState(entry).cameras.find((item4) => item4.id === record) || null;
}

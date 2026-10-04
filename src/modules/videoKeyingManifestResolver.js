import { RH_VIDEO_MATTING_MODEL_ID, getModelManifest } from '../manifests/index.js';
export function getVideoKeyingExtension() {
  const modelManifest = getModelManifest(RH_VIDEO_MATTING_MODEL_ID)?.extensions?.videoKeying;
  if (!modelManifest) throw new Error('Video keying manifest extension missing');
  return modelManifest;
}
export function getVideoKeyingModelId() {
  return getVideoKeyingExtension().modelId || RH_VIDEO_MATTING_MODEL_ID;
}
export function getVideoKeyingExecutionId(value) {
  return value === 'remove'
    ? getVideoKeyingExtension().removeExecutionId
    : getVideoKeyingExtension().keyingExecutionId;
}
export function isVideoKeyingModel(item) {
  return (
    String(item || '').trim() === getVideoKeyingModelId() || !!getModelManifest(item)?.extensions?.videoKeying
  );
}

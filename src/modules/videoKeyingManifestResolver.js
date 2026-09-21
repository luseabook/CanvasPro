import { RH_VIDEO_MATTING_MODEL_ID, getModelManifest } from '../manifests/index.js';
export function getVideoKeyingExtension() {
  const _0x2d0be7 = getModelManifest(RH_VIDEO_MATTING_MODEL_ID)?.extensions?.videoKeying;
  if (!_0x2d0be7) throw new Error('Video keying manifest extension missing');
  return _0x2d0be7;
}
export function getVideoKeyingModelId() {
  return getVideoKeyingExtension().modelId || RH_VIDEO_MATTING_MODEL_ID;
}
export function getVideoKeyingExecutionId(_0x46ab21) {
  return _0x46ab21 === 'remove'
    ? getVideoKeyingExtension().removeExecutionId
    : getVideoKeyingExtension().keyingExecutionId;
}
export function isVideoKeyingModel(_0xade4d9) {
  return (
    String(_0xade4d9 || '').trim() === getVideoKeyingModelId() ||
    !!getModelManifest(_0xade4d9)?.extensions?.videoKeying
  );
}

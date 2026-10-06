import { FilesetResolver, PoseLandmarker } from '../../../vendor/mediapipe/tasks-vision/vision_bundle.mjs';
import { STORYBOARD_3D_IMAGE_POSE_RUNTIME } from './imagePoseRuntimeManifest.js';
const WASM_ROOT_URL = new URL('../../../vendor/mediapipe/tasks-vision/wasm', import.meta.url).href,
  MODEL_URL = new URL(
    '../../../assets/models/pose-landmarker/pose_landmarker_heavy.task',
    import.meta.url,
  ).href;
let poseLandmarkerPromise = null;
function serializeLandmark(box = {}) {
  return {
    x: Number(box.x) || 0,
    y: Number(box.y) || 0,
    z: Number(box.z) || 0,
    visibility: Number.isFinite(Number(box.visibility)) ? Number(box.visibility) : 1,
    presence: Number.isFinite(Number(box.presence)) ? Number(box.presence) : 1,
  };
}
async function getPoseLandmarker() {
  return (
    !poseLandmarkerPromise &&
      (poseLandmarkerPromise = (async () => {
        const value = await FilesetResolver.forVisionTasks(WASM_ROOT_URL, true);
        return PoseLandmarker.createFromOptions(value, {
          baseOptions: { modelAssetPath: MODEL_URL },
          ...STORYBOARD_3D_IMAGE_POSE_RUNTIME.options,
          numPoses: STORYBOARD_3D_IMAGE_POSE_RUNTIME.maxPoses,
          outputSegmentationMasks: false,
        });
      })().catch((item) => {
        poseLandmarkerPromise = null;
        throw item;
      })),
    poseLandmarkerPromise
  );
}
async function estimatePose(key) {
  if (typeof createImageBitmap !== 'function') {
    const error = new Error('当前运行环境不支持离屏图片解码。');
    error.code = 'POSE_IMAGE_BITMAP_UNAVAILABLE';
    throw error;
  }
  const imageBitmap = await createImageBitmap(key);
  let index = null;
  try {
    const poseLandmarker = await getPoseLandmarker();
    index = poseLandmarker.detect(imageBitmap);
    const imageLandmarks = index?.landmarks?.[0],
      worldLandmarks = index?.worldLandmarks?.[0];
    if (!Array.isArray(imageLandmarks) || !Array.isArray(worldLandmarks)) {
      const error2 = new Error('没有在图片中识别到完整人物姿势。');
      error2.code = 'POSE_NOT_FOUND';
      throw error2;
    }
    return {
      imageLandmarks: imageLandmarks.map(serializeLandmark),
      worldLandmarks: worldLandmarks.map(serializeLandmark),
    };
  } finally {
    (index?.close?.(), imageBitmap.close?.());
  }
}
function errorPayload(error3) {
  return {
    name: String(error3?.name || 'Error'),
    code: String(error3?.code || 'POSE_ESTIMATION_FAILED'),
    message: String(error3?.message || '姿势识别失败。'),
  };
}
self.addEventListener('message', async (result) => {
  const requestId = result?.data || {};
  if (requestId.type !== 'estimate' || !requestId.requestId) return;
  try {
    const payload = await estimatePose(requestId.image);
    self.postMessage({ type: 'result', requestId: requestId.requestId, payload: payload });
  } catch (data) {
    self.postMessage({ type: 'error', requestId: requestId.requestId, error: errorPayload(data) });
  }
});

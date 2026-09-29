import { FilesetResolver, PoseLandmarker } from '../../../vendor/mediapipe/tasks-vision/vision_bundle.mjs';
import { STORYBOARD_3D_IMAGE_POSE_RUNTIME } from './imagePoseRuntimeManifest.js';
const WASM_ROOT_URL = new URL('../../../vendor/mediapipe/tasks-vision/wasm', import.meta['url'])['href'],
  MODEL_URL = new URL(
    '../../../assets/models/pose-landmarker/pose_landmarker_heavy.task',
    import.meta['url'],
  )['href'];
let poseLandmarkerPromise = null;
function serializeLandmark(_0x576c4a = {}) {
  return {
    x: Number(_0x576c4a['x']) || 0x0,
    y: Number(_0x576c4a['y']) || 0x0,
    z: Number(_0x576c4a['z']) || 0x0,
    visibility: Number['isFinite'](Number(_0x576c4a['visibility'])) ? Number(_0x576c4a['visibility']) : 0x1,
    presence: Number['isFinite'](Number(_0x576c4a['presence'])) ? Number(_0x576c4a['presence']) : 0x1,
  };
}
async function getPoseLandmarker() {
  return (
    !poseLandmarkerPromise &&
      (poseLandmarkerPromise = (async () => {
        const _0x58963b = await FilesetResolver['forVisionTasks'](WASM_ROOT_URL, !![]);
        return PoseLandmarker['createFromOptions'](_0x58963b, {
          baseOptions: { modelAssetPath: MODEL_URL },
          ...STORYBOARD_3D_IMAGE_POSE_RUNTIME['options'],
          numPoses: STORYBOARD_3D_IMAGE_POSE_RUNTIME['maxPoses'],
          outputSegmentationMasks: ![],
        });
      })()['catch']((_0x379c58) => {
        poseLandmarkerPromise = null;
        throw _0x379c58;
      })),
    poseLandmarkerPromise
  );
}
async function estimatePose(_0x10f1c0) {
  if (typeof createImageBitmap !== 'function') {
    const _0x16d99f = new Error('当前运行环境不支持离屏图片解码。');
    _0x16d99f['code'] = 'POSE_IMAGE_BITMAP_UNAVAILABLE';
    throw _0x16d99f;
  }
  const _0x1097a7 = await createImageBitmap(_0x10f1c0);
  let _0x558712 = null;
  try {
    const _0x46ed44 = await getPoseLandmarker();
    _0x558712 = _0x46ed44['detect'](_0x1097a7);
    const _0x44a670 = _0x558712?.['landmarks']?.[0x0],
      _0x1b5b9e = _0x558712?.['worldLandmarks']?.[0x0];
    if (!Array['isArray'](_0x44a670) || !Array['isArray'](_0x1b5b9e)) {
      const _0x5cde5c = new Error('没有在图片中识别到完整人物姿势。');
      _0x5cde5c['code'] = 'POSE_NOT_FOUND';
      throw _0x5cde5c;
    }
    return {
      imageLandmarks: _0x44a670['map'](serializeLandmark),
      worldLandmarks: _0x1b5b9e['map'](serializeLandmark),
    };
  } finally {
    (_0x558712?.['close']?.(), _0x1097a7['close']?.());
  }
}
function errorPayload(_0x31793b) {
  return {
    name: String(_0x31793b?.['name'] || 'Error'),
    code: String(_0x31793b?.['code'] || 'POSE_ESTIMATION_FAILED'),
    message: String(_0x31793b?.['message'] || '姿势识别失败。'),
  };
}
self['addEventListener']('message', async (_0x357254) => {
  const _0x593cae = _0x357254?.['data'] || {};
  if (_0x593cae['type'] !== 'estimate' || !_0x593cae['requestId']) return;
  try {
    const _0x2543b2 = await estimatePose(_0x593cae['image']);
    self['postMessage']({ type: 'result', requestId: _0x593cae['requestId'], payload: _0x2543b2 });
  } catch (_0x10b1e1) {
    self['postMessage']({ type: 'error', requestId: _0x593cae['requestId'], error: errorPayload(_0x10b1e1) });
  }
});

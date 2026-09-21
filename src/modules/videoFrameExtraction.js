import appStore from '../core/stores/appStore.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import {
  captureVideoFrameSnapshot,
  getVideoFrameSource,
  isVideoFrameReady,
  saveVideoFrameSnapshot,
  waitForVideoFrame,
} from '../components/videoFrameCapture.js';
import { saveOutputBlob } from './project.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { t } from '../i18n/index.js';
function frameExtractionText(_0x55c645, _0x48166f = {}) {
  return t('videoFrameExtraction.' + _0x55c645, _0x48166f);
}
function getToast(_0x1259dc) {
  if (typeof _0x1259dc === 'function') return _0x1259dc;
  return globalThis.window?.showToast;
}
function createCapturePreviewUrl(_0x1657cb) {
  const _0x4a55a8 = globalThis.window?.URL || globalThis.URL;
  if (!_0x1657cb || typeof _0x4a55a8?.createObjectURL !== 'function') return '';
  try {
    return _0x4a55a8.createObjectURL(_0x1657cb);
  } catch {
    return '';
  }
}
export function resolveVideoFrameCaptureIndex(
  _0x55abdf,
  { currentTimeSec: currentTimeSec = 0, fallbackDurationSec: fallbackDurationSec = 0 } = {},
) {
  const _0x2ee153 = Number(_0x55abdf?.videoFps),
    _0x5238fa = Number(_0x55abdf?.videoFrameCount),
    _0x5eb703 = Number(_0x55abdf?.videoDuration),
    _0x39b9d9 = Number.isFinite(_0x5eb703) && _0x5eb703 > 0 ? _0x5eb703 : Number(fallbackDurationSec),
    _0x40f3ca =
      Number.isFinite(_0x2ee153) && _0x2ee153 > 0
        ? _0x2ee153
        : Number.isFinite(_0x5238fa) && _0x5238fa > 0 && Number.isFinite(_0x39b9d9) && _0x39b9d9 > 0
          ? _0x5238fa / _0x39b9d9
          : 0;
  if (Number.isFinite(_0x40f3ca) && _0x40f3ca > 0) {
    let _0x9229df = Math.floor(Math.max(0, Number(currentTimeSec) || 0) * _0x40f3ca) + 1;
    return (
      Number.isFinite(_0x5238fa) && _0x5238fa > 0
        ? (_0x9229df = Math.max(1, Math.min(Math.round(_0x5238fa), _0x9229df)))
        : (_0x9229df = Math.max(1, _0x9229df)),
      { frameIndex: _0x9229df, nextSnapSeq: null, usedSequence: false }
    );
  }
  const _0x51c3fd = Math.max(1, Math.floor(Number(_0x55abdf?.snapSeq) || 0) + 1);
  return { frameIndex: _0x51c3fd, nextSnapSeq: _0x51c3fd, usedSequence: true };
}
export async function extractCurrentVideoFrameToImageNode({
  videoEl: _0x2d8603,
  anchorNodeId: _0x5857ba,
  fallbackDurationSec: fallbackDurationSec = 0,
  fileNamePrefix: fileNamePrefix = 'source_video_frame',
  onMissingMetadata: _0x34bcdd,
  logPrefix: logPrefix = '[VideoFrameExtraction]',
  showToast: _0x3f0d87,
} = {}) {
  const _0xb480ee = getToast(_0x3f0d87),
    _0x222d0a = _0x2d8603;
  if (!_0x222d0a || !getVideoFrameSource(_0x222d0a))
    return (
      _0xb480ee?.(frameExtractionText('videoNotLoaded'), 'info'),
      { ok: false, reason: 'video-not-loaded' }
    );
  if (!isVideoFrameReady(_0x222d0a)) {
    const _0x4b34c3 = await waitForVideoFrame(_0x222d0a);
    if (!_0x4b34c3)
      return (
        _0xb480ee?.(frameExtractionText('videoNotLoaded'), 'info'),
        { ok: false, reason: 'frame-not-ready' }
      );
  }
  const _0x4f1d32 = Number(_0x222d0a.videoWidth) || 0,
    _0x13b4c2 = Number(_0x222d0a.videoHeight) || 0;
  if (!_0x4f1d32 || !_0x13b4c2) return { ok: false, reason: 'missing-size' };
  let _0x178118 = null;
  try {
    _0x178118 = await captureVideoFrameSnapshot(_0x222d0a, { fileNamePrefix: fileNamePrefix });
  } catch (_0x5821a4) {
    return (
      console.warn(logPrefix + ' capture frame failed:', _0x5821a4),
      _0xb480ee?.(frameExtractionText('captureUnsupported'), 'error'),
      { ok: false, reason: 'capture-failed', error: _0x5821a4 }
    );
  }
  if (!_0x178118?.blob) return { ok: false, reason: 'missing-blob' };
  const _0x5f34d0 = String(_0x5857ba || '').trim(),
    _0x28f7c8 = appStore.getState().nodes || {},
    _0x2d1932 = _0x28f7c8[_0x5f34d0];
  if (!_0x2d1932) return { ok: false, reason: 'missing-anchor-node' };
  const {
    frameIndex: _0x23a302,
    nextSnapSeq: _0x116eae,
    usedSequence: _0x496f81,
  } = resolveVideoFrameCaptureIndex(_0x2d1932, {
    currentTimeSec: Number(_0x222d0a.currentTime) || 0,
    fallbackDurationSec: fallbackDurationSec,
  });
  if (_0x116eae) {
    appStore.updateNodeData(_0x5f34d0, { snapSeq: _0x116eae });
    if (typeof _0x34bcdd === 'function') _0x34bcdd(_0x2d1932);
  }
  const _0x196dc6 = getAutoMediaSizeByShortSide(_0x4f1d32, _0x13b4c2),
    _0x110f27 = calcSafeSpawnPosNearNode(
      appStore.getState().nodes,
      _0x2d1932,
      _0x196dc6.width,
      _0x196dc6.height,
    ),
    _0x5b5325 = 'src-img-' + Date.now(),
    _0x3c1139 = createCapturePreviewUrl(_0x178118.blob);
  return (
    appStore.addNode(
      buildSourceMediaNodePayload({
        id: _0x5b5325,
        type: 'source-image',
        name: frameExtractionText('capturedFrameName', { frameIndex: _0x23a302 }),
        capturePreviewUrl: _0x3c1139,
        captureSavePending: true,
        captureSaveError: null,
        originalWidth: _0x178118.originalWidth,
        originalHeight: _0x178118.originalHeight,
        fileName: _0x178118.fileName,
        x: _0x110f27.x,
        y: _0x110f27.y,
        width: _0x196dc6.width,
        height: _0x196dc6.height,
        needsAutoResize: false,
      }),
    ),
    saveVideoFrameSnapshot(_0x178118, saveOutputBlob)
      .then((_0x53d01d) => {
        if (!appStore.getStateRaw().nodes?.[_0x5b5325]) return;
        appStore.updateNodeData(_0x5b5325, {
          src: _0x53d01d.src,
          localPath: _0x53d01d.localPath,
          originalLocalPath: _0x53d01d.originalLocalPath,
          displayLocalPath: _0x53d01d.displayLocalPath,
          thumbLocalPath: _0x53d01d.thumbLocalPath,
          originalWidth: _0x53d01d.originalWidth,
          originalHeight: _0x53d01d.originalHeight,
          fileName: _0x53d01d.fileName,
          captureSavePending: false,
          captureSaveError: null,
        });
      })
      .catch((_0x4ff524) => {
        const _0x2fe8cd = String(_0x4ff524?.message || frameExtractionText('localSaveFailed'));
        (console.warn(logPrefix + ' save captured frame failed:', _0x4ff524),
          appStore.getStateRaw().nodes?.[_0x5b5325] &&
            appStore.updateNodeData(_0x5b5325, { captureSavePending: false, captureSaveError: _0x2fe8cd }),
          _0xb480ee?.(frameExtractionText('shownButSaveFailed'), 'warning'));
      }),
    { ok: true, nodeId: _0x5b5325, frameIndex: _0x23a302, usedSequence: _0x496f81 }
  );
}

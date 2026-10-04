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
function frameExtractionText(value, item = {}) {
  return t('videoFrameExtraction.' + value, item);
}
function getToast(key) {
  if (typeof key === 'function') return key;
  return globalThis.window?.showToast;
}
function createCapturePreviewUrl(enabled) {
  const index = globalThis.window?.URL || globalThis.URL;
  if (!enabled || typeof index?.createObjectURL !== 'function') return '';
  try {
    return index.createObjectURL(enabled);
  } catch {
    return '';
  }
}
export function resolveVideoFrameCaptureIndex(
  result,
  { currentTimeSec: currentTimeSec = 0, fallbackDurationSec: fallbackDurationSec = 0 } = {},
) {
  const count = Number(result?.videoFps),
    count2 = Number(result?.videoFrameCount),
    count3 = Number(result?.videoDuration),
    count4 = Number.isFinite(count3) && count3 > 0 ? count3 : Number(fallbackDurationSec),
    count5 =
      Number.isFinite(count) && count > 0
        ? count
        : Number.isFinite(count2) && count2 > 0 && Number.isFinite(count4) && count4 > 0
          ? count2 / count4
          : 0;
  if (Number.isFinite(count5) && count5 > 0) {
    let frameIndex = Math.floor(Math.max(0, Number(currentTimeSec) || 0) * count5) + 1;
    return (
      Number.isFinite(count2) && count2 > 0
        ? (frameIndex = Math.max(1, Math.min(Math.round(count2), frameIndex)))
        : (frameIndex = Math.max(1, frameIndex)),
      { frameIndex: frameIndex, nextSnapSeq: null, usedSequence: false }
    );
  }
  const frameIndex2 = Math.max(1, Math.floor(Number(result?.snapSeq) || 0) + 1);
  return { frameIndex: frameIndex2, nextSnapSeq: frameIndex2, usedSequence: true };
}
export async function extractCurrentVideoFrameToImageNode({
  videoEl: videoEl,
  anchorNodeId: anchorNodeId,
  fallbackDurationSec: fallbackDurationSec = 0,
  fileNamePrefix: fileNamePrefix = 'source_video_frame',
  onMissingMetadata: onMissingMetadata,
  logPrefix: logPrefix = '[VideoFrameExtraction]',
  showToast: showToast,
} = {}) {
  const toast = getToast(showToast),
    enabled2 = videoEl;
  if (!enabled2 || !getVideoFrameSource(enabled2))
    return (
      toast?.(frameExtractionText('videoNotLoaded'), 'info'),
      { ok: false, reason: 'video-not-loaded' }
    );
  if (!isVideoFrameReady(enabled2)) {
    const waitForVideoFrame2 = await waitForVideoFrame(enabled2);
    if (!waitForVideoFrame2)
      return (
        toast?.(frameExtractionText('videoNotLoaded'), 'info'),
        { ok: false, reason: 'frame-not-ready' }
      );
  }
  const enabled3 = Number(enabled2.videoWidth) || 0,
    enabled4 = Number(enabled2.videoHeight) || 0;
  if (!enabled3 || !enabled4) return { ok: false, reason: 'missing-size' };
  let originalWidth = null;
  try {
    originalWidth = await captureVideoFrameSnapshot(enabled2, { fileNamePrefix: fileNamePrefix });
  } catch (error) {
    return (
      console.warn(logPrefix + ' capture frame failed:', error),
      toast?.(frameExtractionText('captureUnsupported'), 'error'),
      { ok: false, reason: 'capture-failed', error: error }
    );
  }
  if (!originalWidth?.blob) return { ok: false, reason: 'missing-blob' };
  const data = String(anchorNodeId || '').trim(),
    options = appStore.getState().nodes || {},
    enabled5 = options[data];
  if (!enabled5) return { ok: false, reason: 'missing-anchor-node' };
  const {
    frameIndex: frameIndex3,
    nextSnapSeq: nextSnapSeq,
    usedSequence: usedSequence,
  } = resolveVideoFrameCaptureIndex(enabled5, {
    currentTimeSec: Number(enabled2.currentTime) || 0,
    fallbackDurationSec: fallbackDurationSec,
  });
  if (nextSnapSeq) {
    appStore.updateNodeData(data, { snapSeq: nextSnapSeq });
    if (typeof onMissingMetadata === 'function') onMissingMetadata(enabled5);
  }
  const width = getAutoMediaSizeByShortSide(enabled3, enabled4),
    x = calcSafeSpawnPosNearNode(appStore.getState().nodes, enabled5, width.width, width.height),
    id = 'src-img-' + Date.now(),
    capturePreviewUrl = createCapturePreviewUrl(originalWidth.blob);
  return (
    appStore.addNode(
      buildSourceMediaNodePayload({
        id: id,
        type: 'source-image',
        name: frameExtractionText('capturedFrameName', { frameIndex: frameIndex3 }),
        capturePreviewUrl: capturePreviewUrl,
        captureSavePending: true,
        captureSaveError: null,
        originalWidth: originalWidth.originalWidth,
        originalHeight: originalWidth.originalHeight,
        fileName: originalWidth.fileName,
        x: x.x,
        y: x.y,
        width: width.width,
        height: width.height,
        needsAutoResize: false,
      }),
    ),
    saveVideoFrameSnapshot(originalWidth, saveOutputBlob)
      .then((src) => {
        if (!appStore.getStateRaw().nodes?.[id]) return;
        appStore.updateNodeData(id, {
          src: src.src,
          localPath: src.localPath,
          originalLocalPath: src.originalLocalPath,
          displayLocalPath: src.displayLocalPath,
          thumbLocalPath: src.thumbLocalPath,
          originalWidth: src.originalWidth,
          originalHeight: src.originalHeight,
          fileName: src.fileName,
          captureSavePending: false,
          captureSaveError: null,
        });
      })
      .catch((error2) => {
        const captureSaveError = String(error2?.message || frameExtractionText('localSaveFailed'));
        (console.warn(logPrefix + ' save captured frame failed:', error2),
          appStore.getStateRaw().nodes?.[id] &&
            appStore.updateNodeData(id, { captureSavePending: false, captureSaveError: captureSaveError }),
          toast?.(frameExtractionText('shownButSaveFailed'), 'warning'));
      }),
    { ok: true, nodeId: id, frameIndex: frameIndex3, usedSequence: usedSequence }
  );
}

import appStore from '../core/stores/appStore.js';
import { findAvailablePosition, generateId } from '../core/math.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode, calcSpawnStartFromAnchor, getNodeSpawnPrefs } from './nodeSpawn.js';
import { requester } from '../../api/requester.js';
import { canUseElectronMediaTask, enqueueElectronMediaTask } from '../../api/localMediaTaskApi.js';
import { fetchVideoMetaFromServer } from '../../api/videoMetaApi.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { resolveCanvasVideoUrl } from '../services/canvasMediaLocalService.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { attachDesktopMediaPlaybackSource } from '../services/desktopMediaBlobSource.js';
import { extractCurrentVideoFrameToImageNode } from './videoFrameExtraction.js';
import { t } from '../i18n/index.js';
import {
  captureVideoFrameSnapshot,
  saveVideoFrameSnapshot,
  waitForVideoFrame,
} from '../components/videoFrameCapture.js';
import { playVideoWithRecovery } from '../components/video-node/mediaPlaybackRecovery.js';
import { saveOutputBlob } from './project.js';
export function normalizeVideoCutResultLocalPath(value) {
  return pickResultLocalPath(value);
}
const SMART_CLIP_MIN_SEGMENTS = 2,
  SMART_CLIP_MAX_SEGMENTS = 25,
  SMART_CLIP_DEFAULT_SEGMENTS = 20,
  SMART_CLIP_FPS_OPTIONS = Object.freeze([16, 24, 30]),
  SMART_CLIP_DEFAULT_FPS = 24,
  SMART_CLIP_OUTPUT_MODE_SEGMENTS = 'videoSegments',
  SMART_CLIP_OUTPUT_MODE_KEYFRAMES = 'keyframes',
  SMART_CLIP_DEFAULT_OUTPUT_MODE = SMART_CLIP_OUTPUT_MODE_SEGMENTS,
  SMART_CLIP_MODE_OPTIONS = Object.freeze(['stable', 'balanced', 'sensitive']),
  SMART_CLIP_IMAGE_EXT_RE = /\.(?:png|jpe?g|webp|bmp|gif)(?:[?#]|$)/i,
  VIDEO_CLIP_SEEK_EPSILON_SEC = 0.035,
  VIDEO_CLIP_PLAY_SEEK_TIMEOUT_MS = 0x384;
export const SMART_CLIP_KEYFRAME_DEFAULT_OPTIONS = Object.freeze({
  mode: 'stable',
  maxSegments: SMART_CLIP_DEFAULT_SEGMENTS,
  fps: SMART_CLIP_DEFAULT_FPS,
  outputMode: SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
});
function videoClipText(item, key = {}) {
  return t('videoClip.' + item, key);
}
function escapeClipHelperHtml(index) {
  return String(index ?? '').replace(/[&<>"']/g, (result) => {
    if (result === '&') return '&amp;';
    if (result === '<') return '&lt;';
    if (result === '>') return '&gt;';
    if (result === '"') return '&quot;';
    return '&#39;';
  });
}
function clipHelperLabel(data, options = {}) {
  return escapeClipHelperHtml(videoClipText(data, options));
}
export function normalizeSmartClipMaxSegments(target) {
  const source = Number(target),
    next = Number.isFinite(source) ? Math.round(source) : SMART_CLIP_DEFAULT_SEGMENTS;
  return Math.max(SMART_CLIP_MIN_SEGMENTS, Math.min(SMART_CLIP_MAX_SEGMENTS, next));
}
export function normalizeSmartClipFps(current) {
  const entry = Number(current),
    record = Number.isFinite(entry) ? Math.round(entry) : SMART_CLIP_DEFAULT_FPS;
  return SMART_CLIP_FPS_OPTIONS.includes(record) ? record : SMART_CLIP_DEFAULT_FPS;
}
export function normalizeSmartClipOutputMode(payload) {
  const handle = String(payload || '').trim();
  return handle === SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    ? SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    : SMART_CLIP_DEFAULT_OUTPUT_MODE;
}
function normalizeSmartClipMode(state) {
  const config = String(state || '')
    .trim()
    .toLowerCase();
  return SMART_CLIP_MODE_OPTIONS.includes(config) ? config : 'stable';
}
function normalizeSmartClipRunOptions(options2 = {}) {
  const scope = options2 && typeof options2 === 'object' ? options2 : {};
  return {
    mode: normalizeSmartClipMode(scope.mode),
    maxSegments: normalizeSmartClipMaxSegments(scope.maxSegments),
    fps: normalizeSmartClipFps(scope.fps),
    outputMode: normalizeSmartClipOutputMode(scope.outputMode),
  };
}
export function isSmartClipImageResult(response, resultLocalPath = pickResultLocalPath(response)) {
  const input = String(response?.outputType || response?.type || '')
      .trim()
      .toLowerCase(),
    output = String(response?.mimeType || response?.contentType || '')
      .trim()
      .toLowerCase();
  return (
    input === 'image' ||
    output.startsWith('image/') ||
    SMART_CLIP_IMAGE_EXT_RE.test(String(resultLocalPath || response?.url || response?.path || ''))
  );
}
function resolveSmartClipResultUrl(response2, value2) {
  return (
    localPathToUrl(value2) || String(response2?.url || response2?.src || response2?.imageUrl || '').trim()
  );
}
function getWindowTimer(value3) {
  const value4 = globalThis.window?.[value3] || globalThis[value3];
  return typeof value4 === 'function' ? value4.bind(globalThis.window || globalThis) : null;
}
function waitForSmartClipVideoEvent(el, value5, value6 = 0x2710) {
  const run = getWindowTimer('setTimeout'),
    handler = getWindowTimer('clearTimeout');
  if (!el || typeof run !== 'function') return Promise.resolve(false);
  return new Promise((handler2) => {
    let value7 = false,
      value8 = null;
    const run2 = () => {
        for (const value9 of value5) {
          el.removeEventListener?.(value9, value10);
        }
        (el.removeEventListener?.('error', value11), el.removeEventListener?.('abort', value11));
        if (value8 && typeof handler === 'function') handler(value8);
      },
      handler3 = (value12) => {
        if (value7) return;
        ((value7 = true), run2(), handler2(value12 === true));
      },
      value10 = () => handler3(true),
      value11 = () => handler3(false);
    for (const value13 of value5) {
      el.addEventListener?.(value13, value10, { once: true });
    }
    (el.addEventListener?.('error', value11, { once: true }),
      el.addEventListener?.('abort', value11, { once: true }),
      (value8 = run(() => handler3(false), value6)));
  });
}
async function captureSmartClipVideoFirstFrame(enabled, fileNamePrefix) {
  const el2 = globalThis.document;
  if (!el2 || !enabled) throw new Error('missing video url');
  const el3 = el2.createElement('video');
  ((el3.muted = true),
    (el3.playsInline = true),
    (el3.preload = 'auto'),
    (el3.crossOrigin = 'anonymous'),
    (el3.style.position = 'fixed'),
    (el3.style.left = '-10000px'),
    (el3.style.top = '-10000px'),
    (el3.style.width = '1px'),
    (el3.style.height = '1px'),
    (el3.style.opacity = '0'),
    el2.body?.appendChild(el3));
  try {
    el3.src = enabled;
    try {
      el3.load?.();
    } catch {}
    const waitForVideoFrame2 = await waitForVideoFrame(el3, { timeoutMs: 0x2710 });
    if (!waitForVideoFrame2) throw new Error('video frame is not ready');
    return (
      Number(el3.currentTime || 0) > 0.001 &&
        ((el3.currentTime = 0), await waitForSmartClipVideoEvent(el3, ['seeked', 'timeupdate'], 0x1388)),
      await captureVideoFrameSnapshot(el3, { fileNamePrefix: fileNamePrefix })
    );
  } finally {
    try {
      (el3.pause?.(), el3.removeAttribute?.('src'), el3.load?.());
    } catch {}
    el3.remove?.();
  }
}
async function extractSmartClipVideoResultFirstFrame(value14, value15, value16) {
  const smartClipResultUrl = resolveSmartClipResultUrl(value14, value15);
  if (!smartClipResultUrl) throw new Error('missing video segment url');
  const captureSmartClipVideoFirstFrame2 = await captureSmartClipVideoFirstFrame(
    smartClipResultUrl,
    'smart_clip_keyframe_' + (value16 + 1),
  );
  return saveVideoFrameSnapshot(captureSmartClipVideoFirstFrame2, saveOutputBlob);
}
function emitSmartClipProgress(handler4, value17) {
  if (typeof handler4 !== 'function') return;
  try {
    handler4(value17);
  } catch {}
}
function getSmartClipStageText(value18) {
  if (value18 === 'detect') return videoClipText('smartClip.stages.detect');
  if (value18 === 'cut') return videoClipText('smartClip.stages.cut');
  if (value18 === 'frame') return videoClipText('smartClip.stages.frame');
  return videoClipText('smartClip.stages.processing');
}
function buildSmartClipProgressPayload(options3 = {}) {
  const progress = Math.max(0, Math.min(1, Number(options3.progress || 0))),
    pct = Math.round(progress * 100),
    doneCount = Number(options3.doneCount || 0),
    total = Number(options3.total || 0),
    stage = String(options3.stage || ''),
    stageText = getSmartClipStageText(stage);
  return {
    stage: stage,
    stageText: stageText,
    progress: progress,
    pct: pct,
    doneCount: doneCount,
    total: total,
    text:
      total > 0
        ? videoClipText('smartClip.progressWithTotal', {
            stage: stageText,
            done: doneCount,
            total: total,
            pct: pct,
          })
        : videoClipText('smartClip.progressPercent', { stage: stageText, pct: pct }),
  };
}
function pickPositiveNumber(...args) {
  for (const value19 of args) {
    const count = Number(value19);
    if (Number.isFinite(count) && count > 0) return count;
  }
  return 0;
}
function pickSelectedVideoItem(value20) {
  const list = Array.isArray(value20?.videos) ? value20.videos : [];
  if (!list.length) return null;
  const value21 = Number(value20?.mainVideoIndex),
    value22 = Number.isFinite(value21) ? Math.max(0, Math.trunc(value21)) : 0;
  return list[Math.min(value22, list.length - 1)] || list[0] || null;
}
const DIRECT_VIDEO_SOURCE_RE = /^(?:https?:|blob:|data:)/i,
  BLOCKED_VIDEO_SOURCE_RE = /^(?:file|javascript):/i;
function normalizeDirectVideoSource(value23) {
  const enabled2 = String(value23 || '').trim();
  if (!enabled2 || BLOCKED_VIDEO_SOURCE_RE.test(enabled2)) return '';
  const url = localPathToUrl(enabled2);
  if (url) return url;
  if (enabled2.startsWith('/') && !enabled2.startsWith('//')) return enabled2;
  return DIRECT_VIDEO_SOURCE_RE.test(enabled2) ? enabled2 : '';
}
export function resolveVideoClipSourceUrl(enabled3) {
  if (!enabled3) return '';
  const selectedVideoItem = pickSelectedVideoItem(enabled3),
    value24 = selectedVideoItem ? [selectedVideoItem, enabled3] : [enabled3];
  for (const value25 of value24) {
    const canvasVideoUrl = resolveCanvasVideoUrl(value25);
    if (canvasVideoUrl) return canvasVideoUrl;
    for (const value26 of ['src', 'videoUrl', 'url', 'resultUrl', 'sourceUrl']) {
      const directVideoSource = normalizeDirectVideoSource(value25?.[value26]);
      if (directVideoSource) return directVideoSource;
    }
  }
  return '';
}
export function buildVideoCutNodeMeta(value27, value28, value29, value30) {
  const value31 = Number(value28),
    value32 = Number(value29),
    count2 =
      Number.isFinite(value31) && Number.isFinite(value32) && value32 > value31 ? value32 - value31 : 0,
    box = pickSelectedVideoItem(value27),
    positiveNumber = pickPositiveNumber(
      box?.videoDuration,
      box?.duration,
      value27?.videoDuration,
      value27?.duration,
    ),
    positiveNumber2 = pickPositiveNumber(
      box?.videoFrameCount,
      box?.frameCount,
      value27?.videoFrameCount,
      value27?.frameCount,
    ),
    positiveNumber3 =
      pickPositiveNumber(value30, box?.videoFps, box?.fps, value27?.videoFps, value27?.fps) ||
      (positiveNumber2 > 0 && positiveNumber > 0 ? positiveNumber2 / positiveNumber : 0),
    positiveNumber4 = pickPositiveNumber(
      box?.videoWidth,
      box?.width,
      value27?.videoWidth,
      value27?.selectedVideoWidth,
    ),
    positiveNumber5 = pickPositiveNumber(
      box?.videoHeight,
      box?.height,
      value27?.videoHeight,
      value27?.selectedVideoHeight,
    ),
    value33 = {};
  if (count2 > 0) value33.videoDuration = count2;
  if (positiveNumber3 > 0) value33.videoFps = positiveNumber3;
  count2 > 0 &&
    positiveNumber3 > 0 &&
    (value33.videoFrameCount = Math.max(1, Math.round(count2 * positiveNumber3)));
  if (positiveNumber4 > 0) value33.videoWidth = Math.round(positiveNumber4);
  if (positiveNumber5 > 0) value33.videoHeight = Math.round(positiveNumber5);
  return value33;
}
export function buildVideoCutNodePlaybackFields(localPath) {
  const localPath2 = pickResultLocalPath({ localPath: localPath }),
    src = localPathToUrl(localPath2);
  return {
    src: src,
    videoUrl: src,
    localPath: localPath2,
    originalLocalPath: localPath2,
    videoThumbSrc: src,
  };
}
function applyVideoCutThumbResultToNode(value34, value35, response3 = {}) {
  const enabled4 = String(value34 || '').trim(),
    videoThumbSrc = String(value35 || '').trim();
  if (!enabled4 || !videoThumbSrc) return;
  const enabled5 = String(response3.thumbUrl || response3.url || '').trim(),
    resultLocalPath2 = pickResultLocalPath(response3);
  if (!enabled5 && !resultLocalPath2) return;
  const enabled6 = appStore.getState().nodes?.[enabled4];
  if (!enabled6) return;
  const canvasVideoUrl2 = resolveCanvasVideoUrl(enabled6);
  if (canvasVideoUrl2 && canvasVideoUrl2 !== videoThumbSrc) return;
  const value36 = { videoThumbSrc: videoThumbSrc, videoThumbUnavailableSource: '' };
  (enabled5 && !String(enabled6.thumbUrl || '').trim() && (value36.thumbUrl = enabled5),
    resultLocalPath2 &&
      !String(enabled6.posterLocalPath || '').trim() &&
      (value36.posterLocalPath = resultLocalPath2),
    appStore.updateNodeData(enabled4, value36));
}
function ensureVideoCutNodeThumb(value37, value38) {
  const url2 = localPathToUrl(value38);
  if (!url2) return;
  fetchVideoFirstFrameThumbFromServer(url2)
    .then((value39) => applyVideoCutThumbResultToNode(value37, url2, value39))
    .catch(() => {});
}
export async function runSmartClipFromVideoNode({
  nodeId: nodeId,
  options: options4,
  onProgress: onProgress,
  shouldContinue: shouldContinue,
} = {}) {
  const outputMode = normalizeSmartClipRunOptions(options4),
    value40 = String(nodeId || '').trim(),
    value41 = appStore.getState().nodes,
    enabled7 = value41[value40];
  if (!enabled7) throw new Error(videoClipText('errors.videoNodeMissing'));
  const src2 =
    localPathToUrl(enabled7.localPath) || enabled7.src || enabled7.videoUrl || enabled7.resultUrl || '';
  if (!src2) throw new Error(videoClipText('errors.invalidSource'));
  emitSmartClipProgress(onProgress, {
    stage: 'prepare',
    stageText: videoClipText('smartClip.stages.prepare'),
    text: videoClipText('smartClip.preparing'),
    outputMode: outputMode.outputMode,
  });
  const response4 = await requester({
    url: '/api/v2/video/smart_clip',
    method: 'POST',
    provider: 'local',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src: src2, options: outputMode }),
    allow404Null: true,
    returnMeta: true,
  });
  if (response4?.status === 0x194 || response4?.data == null)
    throw new Error(videoClipText('errors.smartClipEndpointMissing'));
  if (!response4?.data?.success)
    throw new Error(response4?.data?.error || videoClipText('errors.startFailed'));
  const enabled8 = response4.data.jobId;
  if (!enabled8) throw new Error(videoClipText('errors.startMissingJobId'));
  for (;;) {
    if (typeof shouldContinue === 'function' && shouldContinue() === false)
      throw new Error(videoClipText('errors.exitedClipMode'));
    const requester2 = await requester({
        url: '/api/v2/video/smart_clip/status?jobId=' + encodeURIComponent(enabled8),
        method: 'GET',
        provider: 'local',
        timeout: 0x4e20,
        returnMeta: true,
      }),
      response5 = requester2.data || {};
    if (response5.status === 'error')
      throw new Error(response5.error || videoClipText('errors.smartClipFailed'));
    emitSmartClipProgress(onProgress, {
      ...buildSmartClipProgressPayload(response5),
      outputMode: outputMode.outputMode,
    });
    if (response5.status !== 'done') {
      await new Promise((value42) => setTimeout(value42, 0x320));
      continue;
    }
    const progress2 = Array.isArray(response5.segments) ? response5.segments : [];
    if (!progress2.length)
      return { ok: false, reason: 'no-segments', nodeIds: [], outputMode: outputMode.outputMode };
    const box2 = appStore.getState().nodes[value40];
    if (!box2) throw new Error(videoClipText('errors.sourceNodeMissing'));
    const outputMode2 = normalizeSmartClipOutputMode(response5.outputMode || outputMode.outputMode),
      reason = outputMode2 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
      autoMediaSizeByShortSide = getAutoMediaSizeByShortSide(box2.width || 0x200, box2.height || 0x120),
      { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
      { startX: startX, startY: startY } = calcSpawnStartFromAnchor(box2, spacing, direction),
      nodeIds = [],
      value43 = { ...(appStore.getState().nodes || {}) };
    for (let doneCount2 = 0; doneCount2 < progress2.length; doneCount2++) {
      const value44 = progress2[doneCount2] || {},
        resultLocalPath3 = pickResultLocalPath(value44);
      if (!resultLocalPath3) continue;
      let originalLocalPath = value44,
        localPath3 = resultLocalPath3;
      if (reason && !isSmartClipImageResult(value44, resultLocalPath3)) {
        emitSmartClipProgress(onProgress, {
          stage: 'frame',
          stageText: videoClipText('smartClip.stages.frame'),
          progress: progress2.length > 0 ? doneCount2 / progress2.length : 0,
          pct: progress2.length > 0 ? Math.round((doneCount2 / progress2.length) * 100) : 0,
          doneCount: doneCount2,
          total: progress2.length,
          text: videoClipText('smartClip.extractingFrame', {
            current: doneCount2 + 1,
            total: progress2.length,
          }),
          outputMode: outputMode2,
        });
        try {
          ((originalLocalPath = await extractSmartClipVideoResultFirstFrame(
            value44,
            resultLocalPath3,
            doneCount2,
          )),
            (localPath3 = pickResultLocalPath(originalLocalPath)));
        } catch (value45) {
          console.warn('[VideoClipController] smart clip keyframe fallback failed:', value45);
          continue;
        }
        if (!localPath3) continue;
      }
      const videoFps = normalizeSmartClipFps(value44.fps || outputMode.fps),
        videoDuration = Number(value44.duration) > 0 ? Number(value44.duration) : 0,
        naturalWidth = pickPositiveNumber(
          originalLocalPath.width,
          originalLocalPath.imageWidth,
          originalLocalPath.originalWidth,
          box2.videoWidth,
          box2.selectedVideoWidth,
          box2.originalWidth,
          box2.width,
          0x200,
        ),
        naturalHeight = pickPositiveNumber(
          originalLocalPath.height,
          originalLocalPath.imageHeight,
          originalLocalPath.originalHeight,
          box2.videoHeight,
          box2.selectedVideoHeight,
          box2.originalHeight,
          box2.height,
          0x120,
        ),
        width = reason ? getAutoMediaSizeByShortSide(naturalWidth, naturalHeight) : autoMediaSizeByShortSide,
        x = avoidOverlap
          ? findAvailablePosition(value43, startX, startY, width.width, width.height, spacing, direction)
          : { x: startX, y: startY },
        id = generateId(reason ? 'source-image-smart-frame' : 'source-video-scene'),
        args2 = reason ? null : buildVideoCutNodePlaybackFields(localPath3),
        value46 = reason
          ? buildSourceMediaNodePayload({
              id: id,
              type: 'source-image',
              x: x.x,
              y: x.y,
              width: width.width,
              height: width.height,
              name: videoClipText('smartClip.keyframeNodeName', { index: doneCount2 + 1 }),
              src: localPathToUrl(localPath3),
              localPath: localPath3,
              originalLocalPath: originalLocalPath.originalLocalPath || localPath3,
              displayLocalPath: originalLocalPath.displayLocalPath || '',
              thumbLocalPath: originalLocalPath.thumbLocalPath || '',
              fileName: originalLocalPath.fileName || value44.fileName || '',
              naturalWidth: naturalWidth,
              naturalHeight: naturalHeight,
              originalWidth: naturalWidth,
              originalHeight: naturalHeight,
              needsAutoResize: false,
              fixedSize: true,
            })
          : buildSourceMediaNodePayload({
              id: id,
              type: 'source-video',
              x: x.x,
              y: x.y,
              width: width.width,
              height: width.height,
              name: videoClipText('smartClip.segmentNodeName', { index: doneCount2 + 1 }),
              ...args2,
              videoDuration: videoDuration || undefined,
              videoFps: videoFps,
              videoFrameCount:
                videoDuration > 0 ? Math.max(1, Math.round(videoDuration * videoFps)) : undefined,
              needsAutoResize: false,
              fixedSize: true,
            });
      (appStore.addNode(value46),
        (value43[id] = value46),
        nodeIds.push(id),
        !reason && ensureVideoCutNodeThumb(id, localPath3));
    }
    if (!nodeIds.length)
      return {
        ok: false,
        reason: reason ? 'no-keyframes' : 'no-results',
        nodeIds: [],
        outputMode: outputMode2,
      };
    return (
      appStore.setSelectedNodes(nodeIds),
      commit(),
      window.v2FocusOnNodes?.([value40, ...nodeIds]),
      window._triggerLocalCacheSave?.(),
      { ok: true, nodeIds: nodeIds, outputMode: outputMode2 }
    );
  }
}
export function runSmartClipKeyframeExtractionFromVideoNode({
  nodeId: nodeId2,
  options: options5,
  onProgress: onProgress2,
  shouldContinue: shouldContinue2,
} = {}) {
  return runSmartClipFromVideoNode({
    nodeId: nodeId2,
    options: {
      ...SMART_CLIP_KEYFRAME_DEFAULT_OPTIONS,
      ...(options5 && typeof options5 === 'object' ? options5 : {}),
      outputMode: SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
    },
    onProgress: onProgress2,
    shouldContinue: shouldContinue2,
  });
}
const VideoClipController = {
  active: false,
  nodeId: null,
  anchorNodeId: null,
  wrapperEl: null,
  barEl: null,
  trackEl: null,
  selectionEl: null,
  leftHandleEl: null,
  rightHandleEl: null,
  playheadEl: null,
  labelEl: null,
  cancelBtnEl: null,
  confirmBtnEl: null,
  thumbEls: null,
  videoEl: null,
  durationSec: 0,
  startSec: 0,
  endSec: 0,
  _dragMode: null,
  _dragOffsetPx: 0,
  _onKeyDown: null,
  _onDocClick: null,
  _onLoadedMeta: null,
  _onDurationChange: null,
  _onPointerMove: null,
  _onPointerUp: null,
  _smartClipFps: SMART_CLIP_DEFAULT_FPS,
  _smartClipMaxSegmentDrag: null,
  _onSmartClipMaxSegmentDragMove: null,
  _onSmartClipMaxSegmentDragUp: null,
  _suppressSmartClipMaxSegmentClick: false,
  _retryRaf: 0,
  _retryCount: 0,
  _thumbToken: 0,
  _sourceToken: 0,
  _playheadRaf: 0,
  _rangeLoopSeekPending: false,
  _rangePlaybackSeq: 0,
  _hiddenEls: null,
  init(nodeId3) {
    if (!nodeId3) return;
    if (this.active) this.exit({ silent: true });
    const enabled9 = appStore.getState().nodes[nodeId3];
    if (!enabled9) return;
    ((this.active = true),
      (this.nodeId = nodeId3),
      (this.anchorNodeId = nodeId3),
      (this._rangeLoopSeekPending = false),
      (this._rangePlaybackSeq += 1),
      appStore.setVideoClipState({ active: true, nodeId: nodeId3 }),
      (this._retryCount = 0),
      this._mountWhenReady());
  },
  _applyDimMode(value47) {
    const el4 = document.getElementById('v2-wrap');
    if (el4) {
      if (value47) el4.classList.add('is-video-clip-mode');
      else el4.classList.remove('is-video-clip-mode');
    }
    if (this.wrapperEl) {
      if (value47) this.wrapperEl.classList.add('is-video-clip-target');
      else this.wrapperEl.classList.remove('is-video-clip-target');
    }
  },
  _applyFrozenUI(value48) {
    if (!this.wrapperEl) return;
    const value49 = 'is-video-clipping';
    if (value48) this.wrapperEl.classList.add(value49);
    else this.wrapperEl.classList.remove(value49);
    this._applyFrozenOverlaysHidden(value48);
  },
  _applyFrozenOverlaysHidden(value50) {
    if (!this.wrapperEl) return;
    if (value50) {
      if (Array.isArray(this._hiddenEls) && this._hiddenEls.length) return;
      const list2 = [
          '.video-controls',
          '.video-mute-btn',
          '.node-upload-hint',
          '.video-center-indicator',
          '.gen-video-center-indicator',
          '.multi-toggle-btn',
        ],
        list3 = [];
      (list2.forEach((item2) => {
        this.wrapperEl.querySelectorAll(item2).forEach((el5) => {
          (list3.push({ el: el5, prevDisplay: el5.style.display }), (el5.style.display = 'none'));
        });
      }),
        (this._hiddenEls = list3));
      return;
    }
    const list4 = Array.isArray(this._hiddenEls) ? this._hiddenEls : [];
    ((this._hiddenEls = null),
      list4.forEach(({ el: el6, prevDisplay: prevDisplay }) => {
        if (!el6 || !el6.isConnected) return;
        el6.style.display = prevDisplay || '';
      }));
  },
  _mountWhenReady() {
    const value51 = this.nodeId,
      value52 = () => {
        if (!this.active || this.nodeId !== value51) return;
        const enabled10 = document.getElementById(value51);
        if (!enabled10) {
          this._retryCount++;
          if (this._retryCount > 10) {
            this.exit({ silent: true });
            return;
          }
          this._retryRaf = requestAnimationFrame(value52);
          return;
        }
        ((this.wrapperEl = enabled10),
          this._applyFrozenUI(true),
          this._applyDimMode(true),
          this._createUI(),
          this._bindEvents(),
          this._syncDurationAndDefaults(),
          this._render());
      };
    this._retryRaf = requestAnimationFrame(value52);
  },
  _createUI() {
    if (!this.wrapperEl) return;
    this.wrapperEl.querySelectorAll('.v2-video-clipbar').forEach((el7) => el7.remove());
    const el8 = document.createElement('div');
    ((el8.className = 'v2-video-clipbar'),
      el8.addEventListener('pointerdown', (event) => event.stopPropagation()),
      el8.addEventListener('click', (event2) => event2.stopPropagation()),
      el8.addEventListener('dblclick', (event3) => {
        (event3.preventDefault(), event3.stopPropagation());
      }));
    const el9 = document.createElement('button');
    ((el9.type = 'button'),
      (el9.className = 'v2-video-clipbtn cancel'),
      (el9.title = videoClipText('controls.cancel')));
    {
      const value53 = 'http://www.w3.org/2000/svg',
        el10 = document.createElementNS(value53, 'svg');
      (el10.setAttribute('width', '20'),
        el10.setAttribute('height', '20'),
        el10.setAttribute('viewBox', '0 0 24 24'),
        el10.setAttribute('fill', 'none'),
        el10.setAttribute('stroke', 'currentColor'),
        el10.setAttribute('stroke-width', '2'));
      const el11 = document.createElementNS(value53, 'path');
      el11.setAttribute('d', 'M18 6L6 18');
      const el12 = document.createElementNS(value53, 'path');
      (el12.setAttribute('d', 'M6 6l12 12'),
        el10.appendChild(el11),
        el10.appendChild(el12),
        el9.appendChild(el10));
    }
    const el13 = document.createElement('button');
    ((el13.type = 'button'),
      (el13.className = 'v2-video-clipbtn confirm'),
      (el13.title = videoClipText('controls.done')));
    {
      const value54 = 'http://www.w3.org/2000/svg',
        el14 = document.createElementNS(value54, 'svg');
      (el14.setAttribute('width', '24'),
        el14.setAttribute('height', '24'),
        el14.setAttribute('viewBox', '0 0 24 24'),
        el14.setAttribute('fill', 'none'),
        el14.setAttribute('stroke', 'currentColor'),
        el14.setAttribute('stroke-width', '2.5'));
      const el15 = document.createElementNS(value54, 'polyline');
      (el15.setAttribute('points', '20 6 9 17 4 12'), el14.appendChild(el15), el13.appendChild(el14));
    }
    const el16 = document.createElement('div');
    el16.className = 'v2-video-cliprow';
    const el17 = document.createElement('div');
    el17.className = 'v2-video-cliptrack';
    const value55 = document.createElement('div');
    value55.className = 'v2-video-clipticks';
    const el18 = document.createElement('div');
    el18.className = 'v2-video-clipthumbs';
    const list5 = [];
    for (let count3 = 0; count3 < 10; count3++) {
      const value56 = document.createElement('div');
      ((value56.className = 'v2-video-clipthumb'), el18.appendChild(value56), list5.push(value56));
    }
    const el19 = document.createElement('div');
    el19.className = 'v2-video-cliprange';
    const value57 = document.createElement('div');
    value57.className = 'v2-video-clipselection';
    const value58 = document.createElement('div');
    value58.className = 'v2-video-clipplayhead';
    const el20 = document.createElement('div');
    ((el20.className = 'v2-video-cliphandle left'), (el20.dataset.handle = 'left'));
    const el21 = document.createElement('div');
    ((el21.className = 'v2-video-cliphandle right'), (el21.dataset.handle = 'right'));
    const el22 = document.createElement('div');
    ((el22.className = 'v2-video-cliplabel'), (el22.textContent = '0.00s'));
    const el23 = document.createElement('div');
    el23.className = 'v2-video-cliphelper-row';
    const el24 = document.createElement('div');
    el24.className = 'v2-video-cliphelper-left';
    const list6 = [
      {
        html:
          '<span class="v2-video-cliphelperkbd">Esc</span><span>' +
          clipHelperLabel('helper.cancel') +
          '</span>\n               <span style="display:flex;align-items:center;margin-left:4px;">\n                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect><path d="M6 8h.001"></path><path d="M10 8h.001"></path><path d="M14 8h.001"></path><path d="M18 8h.001"></path><path d="M8 12h.001"></path><path d="M12 12h.001"></path><path d="M16 12h.001"></path><path d="M7 16h10"></path></svg>\n               </span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">Space</span><span>' +
          clipHelperLabel('helper.rangePlayPause') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">←</span> <span class="v2-video-cliphelperkbd">→</span> <span>' +
          clipHelperLabel('helper.moveSelectionByFrame') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">Shift</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>' +
          clipHelperLabel('helper.moveSelectionByLargeStep', { frames: 10 }) +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">I</span>/<span class="v2-video-cliphelperkbd">O</span> <span>' +
          clipHelperLabel('helper.setInOut') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">Ctrl</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>' +
          clipHelperLabel('helper.fineTuneInPoint', { frames: 1 }) +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">Alt</span> + <span class="v2-video-cliphelperkbd">←</span>/<span class="v2-video-cliphelperkbd">→</span> <span>' +
          clipHelperLabel('helper.fineTuneOutPoint', { frames: 1 }) +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">' +
          clipHelperLabel('helper.wheelKey') +
          '</span><span>' +
          clipHelperLabel('helper.wheelMove') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">' +
          clipHelperLabel('helper.clickKey') +
          '</span><span>' +
          clipHelperLabel('helper.jumpPlayhead') +
          '</span>',
      },
      {
        html:
          '<span class="v2-video-cliphelperkbd">' +
          clipHelperLabel('helper.doubleClickRangeKey') +
          '</span><span>' +
          clipHelperLabel('helper.resetDefaultRange', { seconds: 3 }) +
          '</span>',
      },
    ];
    this._msgEls = list6.map((item3, count4) => {
      const el25 = document.createElement('div');
      el25.className = 'v2-video-cliphelper-msg';
      if (count4 !== 0) el25.classList.add('hide-down');
      return ((el25.innerHTML = item3.html), el24.appendChild(el25), el25);
    });
    let value59 = 0;
    ((this._msgInterval = setInterval(() => {
      if (!this.active || !this._msgEls) return;
      const el26 = this._msgEls[value59];
      value59 = (value59 + 1) % this._msgEls.length;
      const el27 = this._msgEls[value59];
      (el26.classList.remove('hide-down'),
        el26.classList.add('hide-up'),
        el27.classList.remove('hide-up'),
        el27.classList.remove('hide-down'),
        setTimeout(() => {
          el26 &&
            el26.classList.contains('hide-up') &&
            (el26.classList.remove('hide-up'), el26.classList.add('hide-down'));
        }, 0x12c));
    }, 0xfa0)),
      (this._smartClipMode = this._smartClipMode || 'stable'),
      (this._smartClipMaxSegments = normalizeSmartClipMaxSegments(this._smartClipMaxSegments)),
      (this._smartClipFps = normalizeSmartClipFps(this._smartClipFps)),
      (this._smartClipOutputMode = normalizeSmartClipOutputMode(this._smartClipOutputMode)));
    const el28 = document.createElement('div');
    el28.className = 'v2-video-clip-actions';
    const el29 = document.createElement('div');
    el29.className = 'v2-video-clip-smartwrap';
    const el30 = document.createElement('button');
    el30.className = 'v2-video-clip-smartbtn';
    const value60 =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
      value61 =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>',
      handler5 = () => escapeClipHelperHtml(videoClipText('smartPanel.smartClipButton'));
    el30.innerHTML = value60 + ' ' + handler5();
    const el31 = document.createElement('button');
    ((el31.type = 'button'),
      (el31.className = 'v2-video-clip-smartbtn v2-video-clip-framebtn'),
      (el31.title = videoClipText('smartPanel.extractFrame')),
      el31.setAttribute('aria-label', videoClipText('smartPanel.extractFrame')));
    const value62 =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>';
    el31.innerHTML = value62;
    const el32 = document.createElement('div');
    el32.className = 'v2-video-clip-smartpanel';
    const el33 = document.createElement('div');
    ((el33.className = 'v2-video-clip-smartpanel-title'),
      (el33.textContent = videoClipText('smartPanel.title')));
    const el34 = document.createElement('div');
    el34.className = 'v2-video-clip-smartpanel-row';
    const el35 = document.createElement('div');
    ((el35.className = 'v2-video-clip-smartpanel-label'),
      (el35.textContent = videoClipText('smartPanel.output')));
    const el36 = document.createElement('span');
    ((el36.className = 'rh-tip'),
      el36.setAttribute('data-tooltip', videoClipText('smartPanel.outputTip')),
      (el36.textContent = '!'),
      el35.appendChild(el36));
    const el37 = document.createElement('div');
    el37.className = 'v2-video-clip-modegroup v2-video-clip-outputgroup';
    const el38 = document.createElement('button');
    ((el38.type = 'button'),
      (el38.className = 'v2-video-clip-modebtn'),
      (el38.dataset.outputMode = SMART_CLIP_OUTPUT_MODE_SEGMENTS),
      (el38.textContent = videoClipText('smartPanel.outputSegments')));
    const el39 = document.createElement('button');
    ((el39.type = 'button'),
      (el39.className = 'v2-video-clip-modebtn'),
      (el39.dataset.outputMode = SMART_CLIP_OUTPUT_MODE_KEYFRAMES),
      (el39.textContent = videoClipText('smartPanel.outputKeyframes')),
      el37.appendChild(el38),
      el37.appendChild(el39),
      el34.appendChild(el35),
      el34.appendChild(el37));
    const el40 = document.createElement('div');
    el40.className = 'v2-video-clip-smartpanel-row';
    const el41 = document.createElement('div');
    ((el41.className = 'v2-video-clip-smartpanel-label'),
      (el41.textContent = videoClipText('smartPanel.mode')));
    const el42 = document.createElement('span');
    ((el42.className = 'rh-tip'),
      el42.setAttribute('data-tooltip', videoClipText('smartPanel.modeTip')),
      (el42.textContent = '!'),
      el41.appendChild(el42));
    const el43 = document.createElement('div');
    el43.className = 'v2-video-clip-modegroup';
    const el44 = document.createElement('button');
    ((el44.type = 'button'),
      (el44.className = 'v2-video-clip-modebtn'),
      (el44.dataset.mode = 'stable'),
      (el44.textContent = videoClipText('smartPanel.modeStable')));
    const el45 = document.createElement('button');
    ((el45.type = 'button'),
      (el45.className = 'v2-video-clip-modebtn'),
      (el45.dataset.mode = 'balanced'),
      (el45.textContent = videoClipText('smartPanel.modeBalanced')));
    const el46 = document.createElement('button');
    ((el46.type = 'button'),
      (el46.className = 'v2-video-clip-modebtn'),
      (el46.dataset.mode = 'sensitive'),
      (el46.textContent = videoClipText('smartPanel.modeSensitive')),
      el43.appendChild(el44),
      el43.appendChild(el45),
      el43.appendChild(el46),
      el40.appendChild(el41),
      el40.appendChild(el43));
    const el47 = document.createElement('div');
    el47.className = 'v2-video-clip-smartpanel-row';
    const el48 = document.createElement('div');
    ((el48.className = 'v2-video-clip-smartpanel-label'),
      (el48.textContent = videoClipText('smartPanel.fps')));
    const el49 = document.createElement('span');
    ((el49.className = 'rh-tip'),
      el49.setAttribute('data-tooltip', videoClipText('smartPanel.fpsTip')),
      (el49.textContent = '!'),
      el48.appendChild(el49));
    const el50 = document.createElement('div');
    el50.className = 'v2-video-clip-modegroup v2-video-clip-fpsgroup';
    const list7 = SMART_CLIP_FPS_OPTIONS.map((fps) => {
      const el51 = document.createElement('button');
      return (
        (el51.type = 'button'),
        (el51.className = 'v2-video-clip-modebtn v2-video-clip-fpsbtn'),
        (el51.dataset.fps = String(fps)),
        (el51.textContent = videoClipText('smartPanel.fpsValue', { fps: fps })),
        el50.appendChild(el51),
        el51
      );
    });
    (el47.appendChild(el48), el47.appendChild(el50));
    const el52 = document.createElement('div');
    el52.className = 'v2-video-clip-smartpanel-row';
    const el53 = document.createElement('div');
    ((el53.className = 'v2-video-clip-smartpanel-label'),
      (el53.textContent = videoClipText('smartPanel.maxSegments')));
    const el54 = document.createElement('span');
    ((el54.className = 'rh-tip'),
      el54.setAttribute(
        'data-tooltip',
        videoClipText('smartPanel.maxSegmentsTip', { max: SMART_CLIP_MAX_SEGMENTS }),
      ),
      (el54.textContent = '!'),
      el53.appendChild(el54));
    const el55 = document.createElement('div');
    el55.className = 'v2-video-clip-maxsegwrap';
    const el56 = document.createElement('div');
    ((el56.className = 'rh-stepper-value v2-video-clip-maxseg'),
      el56.setAttribute('role', 'spinbutton'),
      el56.setAttribute('aria-label', videoClipText('smartPanel.maxSegmentsAria')),
      el56.setAttribute('aria-valuemin', String(SMART_CLIP_MIN_SEGMENTS)),
      el56.setAttribute('aria-valuemax', String(SMART_CLIP_MAX_SEGMENTS)),
      (el56.tabIndex = 0));
    const el57 = document.createElement('span');
    ((el57.className = 'v2-video-clip-maxseg-suffix'),
      (el57.textContent = videoClipText('smartPanel.segmentUnit')),
      el55.appendChild(el56),
      el55.appendChild(el57),
      el52.appendChild(el53),
      el52.appendChild(el55));
    const el58 = document.createElement('div');
    ((el58.className = 'v2-video-clip-smartpanel-hint'),
      (el58.textContent = videoClipText('smartPanel.hintDefault')));
    const el59 = document.createElement('div');
    el59.className = 'v2-video-clip-smartpanel-actions';
    const el60 = document.createElement('button');
    ((el60.type = 'button'),
      (el60.className = 'v2-video-clip-panelbtn'),
      (el60.textContent = videoClipText('controls.cancel')));
    const el61 = document.createElement('button');
    ((el61.type = 'button'),
      (el61.className = 'v2-video-clip-panelbtn primary'),
      (el61.textContent = videoClipText('controls.start')),
      el59.appendChild(el60),
      el59.appendChild(el61),
      el32.appendChild(el33),
      el32.appendChild(el34),
      el32.appendChild(el40),
      el32.appendChild(el47),
      el32.appendChild(el52),
      el32.appendChild(el58),
      el32.appendChild(el59));
    const list8 = [el38, el39],
      handler6 = () => {
        const smartClipOutputMode = normalizeSmartClipOutputMode(this._smartClipOutputMode);
        ((this._smartClipOutputMode = smartClipOutputMode),
          list8.forEach((el62) => {
            el62.classList.toggle('is-active', el62.dataset.outputMode === smartClipOutputMode);
          }));
        const value63 = smartClipOutputMode === SMART_CLIP_OUTPUT_MODE_KEYFRAMES;
        (el47.classList.toggle('is-disabled', value63),
          list7.forEach((el63) => {
            ((el63.disabled = value63), el63.setAttribute('aria-disabled', value63 ? 'true' : 'false'));
          }),
          (el58.textContent = value63
            ? videoClipText('smartPanel.hintKeyframes')
            : videoClipText('smartPanel.hintDefault')));
        const value64 = this._smartClipMode || 'stable';
        [el44, el45, el46].forEach((el64) => {
          if (!el64) return;
          if (el64.dataset.mode === value64) el64.classList.add('is-active');
          else el64.classList.remove('is-active');
        });
        const smartClipFps = normalizeSmartClipFps(this._smartClipFps);
        ((this._smartClipFps = smartClipFps),
          list7.forEach((el65) => {
            el65.classList.toggle('is-active', Number(el65.dataset.fps) === smartClipFps);
          }));
        const smartClipMaxSegments = normalizeSmartClipMaxSegments(this._smartClipMaxSegments);
        ((this._smartClipMaxSegments = smartClipMaxSegments),
          (el56.textContent = String(smartClipMaxSegments)),
          el56.setAttribute('aria-valuenow', String(smartClipMaxSegments)));
      };
    handler6();
    const run3 = () => {
        if (!this._smartClipMaxSegmentDrag) return;
        (this._smartClipMaxSegmentDrag.el?.classList?.remove('is-dragging'),
          this._smartClipMaxSegmentDrag.doc?.removeEventListener?.(
            'mousemove',
            this._onSmartClipMaxSegmentDragMove,
          ),
          this._smartClipMaxSegmentDrag.doc?.removeEventListener?.(
            'mouseup',
            this._onSmartClipMaxSegmentDragUp,
          ),
          (this._smartClipMaxSegmentDrag = null));
      },
      handler7 = (value65) => {
        ((this._smartClipMaxSegments = normalizeSmartClipMaxSegments(value65)), handler6());
      },
      handler8 = () => {
        if (!el56?.isConnected) return;
        const smartClipMaxSegments2 = normalizeSmartClipMaxSegments(this._smartClipMaxSegments),
          el66 = document.createElement('input');
        ((el66.className = 'rh-stepper-input v2-video-clip-maxseg-input'),
          (el66.type = 'number'),
          (el66.min = String(SMART_CLIP_MIN_SEGMENTS)),
          (el66.max = String(SMART_CLIP_MAX_SEGMENTS)),
          (el66.step = '1'),
          (el66.value = String(smartClipMaxSegments2)));
        let value66 = false;
        const run4 = (value67) => {
          if (value66) return;
          ((value66 = true),
            handler7(value67 ? el66.value : smartClipMaxSegments2),
            el66.replaceWith(el56),
            handler6());
        };
        (el66.addEventListener('click', (event4) => event4.stopPropagation()),
          el66.addEventListener('mousedown', (event5) => event5.stopPropagation()),
          el66.addEventListener('keydown', (event6) => {
            event6.stopPropagation();
            if (event6.key === 'Enter') run4(true);
            if (event6.key === 'Escape') run4(false);
          }),
          el66.addEventListener('blur', () => run4(true)),
          el56.replaceWith(el66),
          el66.focus(),
          el66.select());
      };
    ((this._onSmartClipMaxSegmentDragMove = (event7) => {
      const box3 = this._smartClipMaxSegmentDrag;
      if (!box3) return;
      const value68 = event7.clientX - box3.x,
        value69 = Math.trunc(value68 / 6),
        smartClipMaxSegments3 = normalizeSmartClipMaxSegments(box3.base + value69);
      smartClipMaxSegments3 !== box3.last &&
        ((box3.moved = true), (box3.last = smartClipMaxSegments3), handler7(smartClipMaxSegments3));
    }),
      (this._onSmartClipMaxSegmentDragUp = () => {
        const enabled11 = this._smartClipMaxSegmentDrag;
        if (!enabled11) return;
        (run3(),
          enabled11.moved && ((this._suppressSmartClipMaxSegmentClick = true), handler7(enabled11.last)));
      }));
    const run5 = () => {
        (el32.classList.remove('is-open'),
          this._onSmartClipDocDown &&
            (document.removeEventListener('pointerdown', this._onSmartClipDocDown, true),
            (this._onSmartClipDocDown = null)));
      },
      handler9 = () => {
        if (el30.dataset.loading === 'true') return;
        (handler6(),
          el32.classList.add('is-open'),
          !this._onSmartClipDocDown &&
            ((this._onSmartClipDocDown = (event8) => {
              if (!this.active) return;
              const enabled12 = event8?.target;
              if (!enabled12) return;
              if (el29.contains(enabled12)) return;
              run5();
            }),
            document.addEventListener('pointerdown', this._onSmartClipDocDown, true)));
      },
      handler10 = () => {
        if (el32.classList.contains('is-open')) run5();
        else handler9();
      },
      handler11 = (value70) => {
        ((this._smartClipMode = value70), handler6());
      },
      handler12 = (value71) => {
        ((this._smartClipOutputMode = normalizeSmartClipOutputMode(value71)), handler6());
      },
      handler13 = (value72) => {
        ((this._smartClipFps = normalizeSmartClipFps(value72)), handler6());
      };
    (list8.forEach((el67) => {
      el67.onclick = (event9) => {
        (event9.stopPropagation(), handler12(el67.dataset.outputMode));
      };
    }),
      [el44, el45, el46].forEach((el68) => {
        el68.onclick = (event10) => {
          (event10.stopPropagation(), handler11(el68.dataset.mode || 'stable'));
        };
      }),
      list7.forEach((el69) => {
        el69.onclick = (event11) => {
          (event11.stopPropagation(), handler13(el69.dataset.fps));
        };
      }),
      (el56.onmousedown = (x2) => {
        if (x2.button !== 0) return;
        (x2.preventDefault(), x2.stopPropagation());
        const doc = document,
          base = normalizeSmartClipMaxSegments(this._smartClipMaxSegments);
        (run3(),
          (this._smartClipMaxSegmentDrag = {
            x: x2.clientX,
            base: base,
            last: base,
            moved: false,
            el: el56,
            doc: doc,
          }),
          el56.classList.add('is-dragging'),
          doc.addEventListener('mousemove', this._onSmartClipMaxSegmentDragMove),
          doc.addEventListener('mouseup', this._onSmartClipMaxSegmentDragUp));
      }),
      (el56.onclick = (event12) => {
        event12.stopPropagation();
        if (this._suppressSmartClipMaxSegmentClick) {
          this._suppressSmartClipMaxSegmentClick = false;
          return;
        }
        handler8();
      }),
      (el56.onkeydown = (event13) => {
        event13.stopPropagation();
        if (event13.key === 'Enter' || event13.key === ' ') {
          (event13.preventDefault(), handler8());
          return;
        }
        if (event13.key === 'ArrowRight' || event13.key === 'ArrowUp') {
          (event13.preventDefault(), handler7(Number(this._smartClipMaxSegments) + 1));
          return;
        }
        (event13.key === 'ArrowLeft' || event13.key === 'ArrowDown') &&
          (event13.preventDefault(), handler7(Number(this._smartClipMaxSegments) - 1));
      }),
      (el60.onclick = (event14) => {
        (event14.stopPropagation(), run5());
      }));
    const run6 = async ({ mode: mode, maxSegments: maxSegments, fps: fps2, outputMode: outputMode3 }) => {
      const outputMode4 = normalizeSmartClipOutputMode(outputMode3),
        value73 = outputMode4 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES;
      ((el30.dataset.loading = 'true'),
        (el30.disabled = true),
        (el30.innerHTML = value61 + ' ' + escapeClipHelperHtml(videoClipText('smartClip.preparing'))),
        window.showToast?.(
          value73 ? videoClipText('smartClip.startedKeyframes') : videoClipText('smartClip.startedSegments'),
          'info',
        ));
      try {
        const count5 = await runSmartClipFromVideoNode({
          nodeId: this.anchorNodeId,
          options: { mode: mode, maxSegments: maxSegments, fps: fps2, outputMode: outputMode4 },
          shouldContinue: () => this.active,
          onProgress: (response6) => {
            if (!el30?.isConnected || !response6?.text) return;
            el30.innerHTML = value61 + ' ' + response6.text;
          },
        });
        if (!count5?.ok) {
          window.showToast?.(
            count5?.reason === 'no-segments'
              ? videoClipText('smartClip.noSegments')
              : value73
                ? videoClipText('smartClip.noKeyframes')
                : videoClipText('smartClip.noResults'),
            count5?.reason === 'no-segments' ? 'info' : 'error',
          );
          return;
        }
        (window.showToast?.(
          value73
            ? videoClipText('smartClip.completeKeyframes', { count: count5.nodeIds.length })
            : videoClipText('smartClip.completeSegments', { count: count5.nodeIds.length }),
          'success',
        ),
          this.exit({ silent: true }));
      } catch (error) {
        const error2 =
          error instanceof Error ? error.message : String(error || videoClipText('errors.smartClipFailed'));
        window.showToast?.(videoClipText('smartClip.failedWithError', { error: error2 }), 'error');
      } finally {
        (run5(),
          el30 &&
            el30.isConnected &&
            ((el30.dataset.loading = 'false'),
            (el30.disabled = false),
            (el30.innerHTML = value60 + ' ' + handler5())));
      }
    };
    ((el61.onclick = async (event15) => {
      (event15.stopPropagation(), run5());
      const mode2 = this._smartClipMode || 'stable',
        maxSegments2 = normalizeSmartClipMaxSegments(this._smartClipMaxSegments),
        fps3 = normalizeSmartClipFps(this._smartClipFps),
        outputMode5 = normalizeSmartClipOutputMode(this._smartClipOutputMode);
      await run6({ mode: mode2, maxSegments: maxSegments2, fps: fps3, outputMode: outputMode5 });
    }),
      (el30.onclick = (event16) => {
        (event16.stopPropagation(), handler10());
      }),
      (el31.onclick = async (event17) => {
        (event17.stopPropagation(), run5());
        if (el31.dataset.loading === 'true') return;
        ((el31.dataset.loading = 'true'), (el31.disabled = true), (el31.innerHTML = value61));
        try {
          const videoEl = this.videoEl || this._getVideoEl();
          await extractCurrentVideoFrameToImageNode({
            videoEl: videoEl,
            anchorNodeId: this.anchorNodeId,
            fallbackDurationSec: this._readDurationSec(videoEl) || this.durationSec,
            logPrefix: '[VideoClipController]',
          });
        } finally {
          el31 &&
            el31.isConnected &&
            ((el31.dataset.loading = 'false'), (el31.disabled = false), (el31.innerHTML = value62));
        }
      }),
      el29.appendChild(el30),
      el29.appendChild(el32),
      el28.appendChild(el29),
      el28.appendChild(el31),
      el23.appendChild(el24),
      el23.appendChild(el28),
      el19.appendChild(value57),
      el19.appendChild(el20),
      el19.appendChild(el21),
      el17.appendChild(el18),
      el17.appendChild(el19),
      el17.appendChild(value58),
      el17.appendChild(value55),
      el17.appendChild(el22),
      el16.appendChild(el9),
      el16.appendChild(el17),
      el16.appendChild(el13),
      el8.appendChild(el16),
      el8.appendChild(el23),
      this.wrapperEl.appendChild(el8),
      (this.barEl = el8),
      (this.cancelBtnEl = el9),
      (this.confirmBtnEl = el13),
      (this.trackEl = el17),
      (this.selectionEl = value57),
      (this.leftHandleEl = el20),
      (this.rightHandleEl = el21),
      (this.playheadEl = value58),
      (this.labelEl = el22),
      (this.thumbEls = list5));
  },
  _bindEvents() {
    if (!this.barEl) return;
    (this.cancelBtnEl?.addEventListener('click', (event18) => {
      (event18.stopPropagation(), this.exit());
    }),
      this.confirmBtnEl?.addEventListener('click', (event19) => {
        (event19.stopPropagation(), this._confirm());
      }));
    const value74 = (event20) => {
      if (!this.trackEl || !this.active || this._dragMode) return;
      const value75 = event20.clientX,
        box4 = this.selectionEl.getBoundingClientRect(),
        value76 = 20,
        value77 = Math.abs(value75 - box4.left) < value76,
        value78 = Math.abs(value75 - box4.right) < value76;
      if (value77)
        (this.leftHandleEl.classList.add('hover-active'),
          this.rightHandleEl.classList.remove('hover-active'),
          (this.selectionEl.style.cursor = 'var(--resize-ew-cursor)'));
      else
        value78
          ? (this.rightHandleEl.classList.add('hover-active'),
            this.leftHandleEl.classList.remove('hover-active'),
            (this.selectionEl.style.cursor = 'var(--resize-ew-cursor)'))
          : (this.leftHandleEl.classList.remove('hover-active'),
            this.rightHandleEl.classList.remove('hover-active'),
            (this.selectionEl.style.cursor = 'var(--grab-cursor)'));
    };
    this.trackEl?.addEventListener('pointermove', value74);
    const value79 = 30,
      handler14 = (value80) => (Number(value80 || 1) / value79) * 1,
      handler15 = () => {
        const count6 = this.durationSec;
        if (!Number.isFinite(count6) || count6 <= 0) return 0.1;
        return Math.min(0.1, count6);
      },
      handler16 = (value81, value82, value83) => Math.max(value82, Math.min(value83, value81)),
      handler17 = (value84) => {
        if (!this.trackEl || !this.active) return;
        const count7 = this.durationSec;
        if (!Number.isFinite(count7) || count7 <= 0) return;
        const enabled13 = this.videoEl || this._getVideoEl();
        if (!enabled13) return;
        const box5 = this.trackEl.getBoundingClientRect();
        if (!box5.width) return;
        const value85 = value84 - box5.left,
          value86 = handler16(value85 / box5.width, 0, 1),
          value87 = value86 * count7,
          value88 = Math.max(0, count7 - 0.001);
        try {
          enabled13.currentTime = handler16(value87, 0, value88);
        } catch (value89) {}
        this._renderPlayhead();
      },
      handler18 = () => {
        const enabled14 = this.videoEl || this._getVideoEl();
        if (!enabled14) return;
        if (!enabled14.paused) return;
        const value90 = Number(enabled14.currentTime) || 0;
        if (value90 >= this.startSec && value90 <= this.endSec) return;
        try {
          enabled14.currentTime = this.startSec;
        } catch (value91) {}
      },
      handler19 = (count8, value92) => {
        const count9 = this.durationSec;
        if (!Number.isFinite(count9) || count9 <= 0) return;
        const value93 = this._pauseRangePlaybackForRangeEdit(),
          value94 = handler14(value92) * (count8 >= 0 ? 1 : -1),
          value95 = handler15(),
          value96 = Math.max(value95, this.endSec - this.startSec);
        let count10 = this.startSec + value94,
          value97 = this.endSec + value94;
        count10 < 0 && ((count10 = 0), (value97 = value96));
        value97 > count9 && ((value97 = count9), (count10 = Math.max(0, count9 - value96)));
        ((this.startSec = count10), (this.endSec = value97));
        if (value93)
          try {
            value93.currentTime = count10;
          } catch (value98) {}
        else handler18();
        this._render();
      },
      handler20 = (count11) => {
        const count12 = this.durationSec;
        if (!Number.isFinite(count12) || count12 <= 0) return;
        const value99 = this._pauseRangePlaybackForRangeEdit(),
          value100 = handler14(1) * (count11 >= 0 ? 1 : -1),
          value101 = handler15(),
          value102 = Math.max(0, this.endSec - value101);
        this.startSec = handler16(this.startSec + value100, 0, value102);
        if (value99)
          try {
            value99.currentTime = this.startSec;
          } catch (value103) {}
        this._render();
      },
      handler21 = (count13) => {
        const count14 = this.durationSec;
        if (!Number.isFinite(count14) || count14 <= 0) return;
        const value104 = this._pauseRangePlaybackForRangeEdit(),
          value105 = handler14(1) * (count13 >= 0 ? 1 : -1),
          value106 = handler15(),
          value107 = Math.min(count14, this.startSec + value106);
        this.endSec = handler16(this.endSec + value105, value107, count14);
        if (value104)
          try {
            value104.currentTime = this.endSec;
          } catch (value108) {}
        this._render();
      },
      handler22 = (value109) => {
        const count15 = this.durationSec;
        if (!Number.isFinite(count15) || count15 <= 0) return;
        const enabled15 = this.videoEl || this._getVideoEl();
        if (!enabled15) return;
        this._pauseRangePlaybackForRangeEdit(enabled15);
        let value110 = Number(enabled15.currentTime) || 0;
        value110 = handler16(value110, 0, count15);
        const value111 = handler15();
        if (value109 === 'in') {
          const value112 = Math.max(0, this.endSec - value111);
          this.startSec = handler16(value110, 0, value112);
        } else {
          const value113 = Math.min(count15, this.startSec + value111);
          this.endSec = handler16(value110, value113, count15);
        }
        this._render();
      },
      value114 = (event21) => {
        if (!this.trackEl || !this.active) return;
        const el70 = event21.target.closest('.v2-video-cliphandle'),
          value115 = !!event21.target.closest('.v2-video-clipselection'),
          box6 = this.trackEl.getBoundingClientRect();
        if (!box6.width) return;
        const value116 = event21.clientX,
          box7 = this.selectionEl.getBoundingClientRect(),
          value117 = 20,
          value118 = Math.abs(value116 - box7.left) < value117,
          value119 = Math.abs(value116 - box7.right) < value117;
        if (value118 || (el70 && el70.dataset.handle === 'left'))
          ((this._dragMode = 'left'), this.leftHandleEl.classList.add('hover-active'));
        else {
          if (value119 || (el70 && el70.dataset.handle === 'right'))
            ((this._dragMode = 'right'), this.rightHandleEl.classList.add('hover-active'));
          else {
            if (value115) this._dragMode = 'move';
            else {
              this._dragMode = 'scrub';
              const enabled16 = this.videoEl || this._getVideoEl();
              if (enabled16)
                try {
                  if (!enabled16.paused) enabled16.pause();
                } catch (value120) {}
            }
          }
        }
        if (this._dragMode === 'move') {
          const box8 = this.selectionEl.getBoundingClientRect();
          this._dragOffsetPx = event21.clientX - box8.left;
        } else this._dragOffsetPx = 0;
        (event21.preventDefault(), event21.stopPropagation());
        if (this._dragMode === 'scrub') handler17(event21.clientX);
        else this._handleDragAtClientX(event21.clientX);
        ((this._onPointerMove = (event22) => {
          (event22.preventDefault(), event22.stopPropagation());
          if (this._dragMode === 'scrub') handler17(event22.clientX);
          else this._handleDragAtClientX(event22.clientX);
        }),
          (this._onPointerUp = (event23) => {
            (event23.preventDefault(),
              event23.stopPropagation(),
              window.removeEventListener('pointermove', this._onPointerMove, true),
              window.removeEventListener('pointerup', this._onPointerUp, true),
              (this._dragMode = null),
              this.leftHandleEl?.classList.remove('hover-active'),
              this.rightHandleEl?.classList.remove('hover-active'));
          }),
          window.addEventListener('pointermove', this._onPointerMove, true),
          window.addEventListener('pointerup', this._onPointerUp, true));
      };
    (this.trackEl?.addEventListener('pointerdown', value114),
      this.trackEl?.addEventListener(
        'wheel',
        (event24) => {
          if (!this.active) return;
          (event24.preventDefault(), event24.stopPropagation());
          const value121 = Number(event24.deltaX) || 0,
            value122 = Number(event24.deltaY) || 0,
            enabled17 = Math.abs(value121) > Math.abs(value122) ? value121 : value122;
          if (!enabled17) return;
          const value123 = enabled17 > 0 ? 1 : -1;
          if (event24.ctrlKey || event24.metaKey) handler20(value123);
          else {
            if (event24.altKey) handler21(value123);
            else {
              const value124 = event24.shiftKey ? 10 : 1;
              handler19(value123, value124);
            }
          }
        },
        { passive: false },
      ),
      this.selectionEl?.addEventListener('dblclick', (event25) => {
        if (!this.active) return;
        (event25.preventDefault(), event25.stopPropagation());
        const enabled18 = this.durationSec;
        if (!enabled18 || !Number.isFinite(enabled18) || enabled18 <= 0) return;
        const box9 = this.selectionEl.getBoundingClientRect(),
          value125 = event25.clientX,
          value126 = 24;
        if (value125 - box9.left < value126 || box9.right - value125 < value126) return;
        const value127 = Math.min(3, enabled18),
          value128 = (this.startSec + this.endSec) / 2,
          value129 = Math.max(0, Math.min(enabled18 - value127, value128 - value127 / 2)),
          value130 = this._pauseRangePlaybackForRangeEdit();
        ((this.startSec = value129), (this.endSec = value129 + value127));
        if (value130 && value130.paused) value130.currentTime = this.startSec;
        this._render();
      }),
      (this._onKeyDown = (event26) => {
        if (!this.active) return;
        if (event26.key === 'Escape') {
          (event26.preventDefault(), this.exit());
          return;
        }
        if (event26.key === ' ' || event26.code === 'Space') {
          this._handlePlaybackShortcutKey(event26);
          return;
        }
        if (event26.key === 'i' || event26.key === 'I') {
          (event26.preventDefault(), handler22('in'));
          return;
        }
        if (event26.key === 'o' || event26.key === 'O') {
          (event26.preventDefault(), handler22('out'));
          return;
        }
        if (event26.key === 'ArrowLeft' || event26.key === 'ArrowRight') {
          event26.preventDefault();
          const value131 = event26.key === 'ArrowRight' ? 1 : -1;
          if (event26.ctrlKey || event26.metaKey) {
            handler20(value131);
            return;
          }
          if (event26.altKey) {
            handler21(value131);
            return;
          }
          const value132 = event26.shiftKey ? 10 : 1;
          handler19(value131, value132);
        }
      }),
      window.addEventListener('keydown', this._onKeyDown, true),
      this._onDocClick &&
        (document.removeEventListener('pointerdown', this._onDocClick, true), (this._onDocClick = null)),
      (this._onDocClick = (event27) => {
        if (!this.active || !this.barEl) return;
        if (this.barEl.contains(event27.target)) return;
        this.exit({ silent: true });
      }),
      document.addEventListener('pointerdown', this._onDocClick, true));
  },
  _getVideoEl() {
    if (!this.wrapperEl) return null;
    const value133 = Array.from(this.wrapperEl.querySelectorAll('video'));
    let enabled19 = null,
      value134 = null;
    for (const el71 of value133) {
      if (!el71) continue;
      const value135 = window.getComputedStyle(el71);
      if (value135.display === 'none' || value135.visibility === 'hidden') continue;
      const count16 = Number(value135.opacity);
      if (Number.isFinite(count16) && count16 <= 0) continue;
      const box10 = el71.getBoundingClientRect();
      if (!box10.width || !box10.height) continue;
      if (!enabled19) enabled19 = el71;
      const value136 = String(el71.currentSrc || el71.getAttribute('src') || '').trim();
      if (value136) {
        value134 = el71;
        break;
      }
    }
    return ((this.videoEl = value134 || enabled19 || null), this.videoEl);
  },
  _getVideoElementSource(value137) {
    return String(value137?.getAttribute?.('src') || value137?.currentSrc || value137?.src || '').trim();
  },
  _setClipMediaKeepAlive(el72, value138) {
    if (!el72?.dataset) return;
    if (value138) {
      el72.dataset.desktopMediaKeepAlive = 'video-clip';
      return;
    }
    el72.dataset.desktopMediaKeepAlive === 'video-clip' && delete el72.dataset.desktopMediaKeepAlive;
  },
  _readDurationSec(enabled20) {
    if (!enabled20) return 0;
    const count17 = Number(enabled20.duration);
    if (Number.isFinite(count17) && count17 > 0) return count17;
    const list9 = enabled20.seekable;
    if (list9 && list9.length) {
      const count18 = Number(list9.end(list9.length - 1));
      if (Number.isFinite(count18) && count18 > 0) return count18;
    }
    return 0;
  },
  _resolveKnownDurationSec(value139) {
    const selectedVideoItem2 = pickSelectedVideoItem(value139),
      positiveNumber6 = pickPositiveNumber(
        selectedVideoItem2?.videoDuration,
        selectedVideoItem2?.duration,
        value139?.videoDuration,
        value139?.duration,
      );
    if (positiveNumber6 > 0) return positiveNumber6;
    const positiveNumber7 = pickPositiveNumber(
        selectedVideoItem2?.videoFrameCount,
        selectedVideoItem2?.frameCount,
        value139?.videoFrameCount,
        value139?.frameCount,
      ),
      positiveNumber8 = pickPositiveNumber(
        selectedVideoItem2?.videoFps,
        selectedVideoItem2?.fps,
        value139?.videoFps,
        value139?.fps,
      );
    return positiveNumber7 > 0 && positiveNumber8 > 0 ? positiveNumber7 / positiveNumber8 : 0;
  },
  _applyDurationSec(value140) {
    const count19 = Number(value140);
    if (!Number.isFinite(count19) || count19 <= 0) return false;
    this.durationSec = count19;
    if (!(this.endSec > this.startSec)) {
      const value141 = Math.min(3, count19),
        value142 = Math.max(0, (count19 - value141) / 2);
      return ((this.startSec = value142), (this.endSec = value142 + value141), true);
    }
    ((this.startSec = Math.max(0, Math.min(this.startSec, count19))),
      (this.endSec = Math.max(0, Math.min(this.endSec, count19))));
    if (this.endSec <= this.startSec) {
      const value143 = Math.min(3, count19);
      ((this.startSec = 0), (this.endSec = value143));
    }
    return true;
  },
  async _applyVideoMetaDurationFallback(value144, value145) {
    const enabled21 = String(value144 || '').trim();
    if (!enabled21) return;
    try {
      const fetchVideoMetaFromServer2 = await fetchVideoMetaFromServer(enabled21);
      if (!this.active || value145 !== this._sourceToken) return;
      const value146 =
          fetchVideoMetaFromServer2 &&
          typeof fetchVideoMetaFromServer2 === 'object' &&
          fetchVideoMetaFromServer2.data
            ? fetchVideoMetaFromServer2.data
            : fetchVideoMetaFromServer2,
        positiveNumber9 = pickPositiveNumber(
          value146?.duration,
          value146?.videoDuration,
          value146?.format?.duration,
          value146?.stream?.duration,
        );
      this._applyDurationSec(positiveNumber9) && (this._render(), this._startPlayheadLoop());
    } catch (value147) {}
  },
  async _syncDurationAndDefaults() {
    const value148 = appStore.getState().nodes?.[this.nodeId],
      value149 = this._resolveVideoSrcFromNode(value148),
      value150 = String(value149 || '').trim(),
      value151 = ++this._sourceToken;
    this.videoEl = this._getVideoEl();
    this._applyDurationSec(this._resolveKnownDurationSec(value148)) && this._render();
    if (this.videoEl) {
      const value152 = String(this.videoEl.dataset?.videoClipSourceUrl || '').trim();
      this._setClipMediaKeepAlive(this.videoEl, true);
      try {
        this.videoEl.pause();
      } catch (value153) {}
      try {
        this.videoEl.loop = false;
      } catch (value154) {}
      if (value150 && value152 !== value150) {
        await attachDesktopMediaPlaybackSource(this.videoEl, value150);
        if (!this.active || value151 !== this._sourceToken) return;
        if (!this._getVideoElementSource(this.videoEl)) {
          ((this.videoEl.preload = 'metadata'), (this.videoEl.src = value150));
          try {
            this.videoEl.load?.();
          } catch (value155) {}
        }
        this.videoEl.dataset && (this.videoEl.dataset.videoClipSourceUrl = value150);
      }
    }
    const value156 = this._readDurationSec(this.videoEl);
    if (this._applyDurationSec(value156)) this._render();
    else !(this.durationSec > 0) && value150 && void this._applyVideoMetaDurationFallback(value150, value151);
    (this.videoEl &&
      ((this._onLoadedMeta = () => {
        if (!this.active) return;
        const value157 = this._readDurationSec(this.videoEl);
        (this._applyDurationSec(value157, this.videoEl), this._render());
      }),
      (this._onDurationChange = () => {
        if (!this.active) return;
        const value158 = this._readDurationSec(this.videoEl);
        (this._applyDurationSec(value158, this.videoEl), this._render());
      }),
      this.videoEl.addEventListener('loadedmetadata', this._onLoadedMeta, { once: true }),
      this.videoEl.addEventListener('durationchange', this._onDurationChange)),
      this._renderThumbs(),
      this._startPlayheadLoop());
  },
  _startPlayheadLoop() {
    if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
    const value159 = () => {
      if (!this.active) return;
      (this._renderPlayhead(), (this._playheadRaf = requestAnimationFrame(value159)));
    };
    this._playheadRaf = requestAnimationFrame(value159);
  },
  _renderPlayhead() {
    if (!this.playheadEl || !this.trackEl) return;
    const count20 = this.durationSec;
    if (!Number.isFinite(count20) || count20 <= 0) {
      this.playheadEl.style.display = 'none';
      return;
    }
    const enabled22 = this.videoEl || this._getVideoEl();
    if (!enabled22) {
      this.playheadEl.style.display = 'none';
      return;
    }
    let value160 = Number(enabled22.currentTime) || 0;
    if (value160 < this.startSec || value160 > this.endSec) {
      if (!enabled22.paused && !enabled22.seeking && this._rangeLoopSeekPending !== true) {
        this._rangeLoopSeekPending = true;
        try {
          enabled22.currentTime = this.startSec;
        } catch (value161) {}
        value160 = this.startSec;
      }
    } else !enabled22.seeking && (this._rangeLoopSeekPending = false);
    const value162 = Math.max(0, Math.min(1, value160 / count20));
    ((this.playheadEl.style.display = 'block'), (this.playheadEl.style.left = value162 * 100 + '%'));
  },
  _handlePlaybackShortcutKey(event28) {
    if (!this.active) return false;
    if (!(event28?.key === ' ' || event28?.code === 'Space')) return false;
    (event28.preventDefault?.(), event28.stopPropagation?.());
    if (!event28.repeat) void this._togglePlayRange();
    return true;
  },
  _pauseRangePlaybackForRangeEdit(enabled23 = this.videoEl || this._getVideoEl()) {
    ((this._rangePlaybackSeq += 1), (this._rangeLoopSeekPending = false));
    if (!enabled23) return null;
    try {
      if (!enabled23.paused) enabled23.pause();
    } catch (value163) {}
    return enabled23;
  },
  async _togglePlayRange() {
    const value164 = ++this._rangePlaybackSeq,
      enabled24 = this._getVideoEl();
    if (!enabled24) return false;
    await this._ensureVideoPlaybackSource(enabled24);
    if (!this.active || value164 !== this._rangePlaybackSeq) return false;
    let count21 = Number(this.durationSec);
    if (!Number.isFinite(count21) || count21 <= 0) {
      count21 = this._readDurationSec(enabled24);
      if (!Number.isFinite(count21) || count21 <= 0) return false;
      if (this._applyDurationSec(count21)) this._render();
    }
    try {
      if (!enabled24.paused) return (enabled24.pause(), this._renderPlayhead(), true);
    } catch (value165) {}
    const value166 = Math.max(0, Math.min(this.startSec, count21)),
      value167 = Math.max(value166, Math.min(this.endSec, count21));
    if (!(value167 > value166)) return false;
    const value168 = Number(enabled24.currentTime) || 0;
    (value168 < value166 || value168 >= value167) &&
      (await this._seekVideoForRangePlayback(enabled24, value166));
    if (!this.active || value164 !== this._rangePlaybackSeq) return false;
    const playVideoWithRecovery2 = await playVideoWithRecovery(enabled24, {
      label: 'video-clip:' + (this.nodeId || 'unknown') + ':range',
      ensureSrc: () => this._ensureVideoPlaybackSource(enabled24),
      minBufferAhead: 0.5,
      readyTimeoutMs: 0x1f4,
      recoveryDebounceMs: 150,
      recoveryCooldownMs: 0x1f4,
      shouldRecover: (el73) =>
        this.active === true && this.videoEl === el73 && el73?.isConnected !== false && !el73?.paused,
      shouldContinue: () =>
        this.active === true && value164 === this._rangePlaybackSeq && this.videoEl === enabled24,
    });
    return (
      playVideoWithRecovery2 && ((this._rangeLoopSeekPending = false), this._renderPlayhead()),
      playVideoWithRecovery2
    );
  },
  async _ensureVideoPlaybackSource(el74 = this.videoEl) {
    if (!el74) return false;
    if (this._getVideoElementSource(el74)) {
      if (el74.preload !== 'auto') el74.preload = 'auto';
      return true;
    }
    const value169 = appStore.getState().nodes?.[this.nodeId],
      enabled25 = String(this._resolveVideoSrcFromNode(value169) || '').trim();
    if (!enabled25) return false;
    await attachDesktopMediaPlaybackSource(el74, enabled25, { preload: 'auto' });
    if (el74.dataset) el74.dataset.videoClipSourceUrl = enabled25;
    return !!this._getVideoElementSource(el74);
  },
  async _seekVideoForRangePlayback(enabled26, value170) {
    if (!enabled26) return false;
    const value171 = Math.max(0, Number(value170) || 0),
      value172 = Number(enabled26.currentTime || 0);
    if (
      Math.abs(value172 - value171) <= VIDEO_CLIP_SEEK_EPSILON_SEC &&
      Number(enabled26.readyState || 0) >= 2 &&
      !enabled26.seeking
    )
      return true;
    this._rangeLoopSeekPending = true;
    try {
      enabled26.currentTime = value171;
    } catch (value173) {}
    return (await this._waitForRangePlaybackSeek(enabled26), (this._rangeLoopSeekPending = false), true);
  },
  _waitForRangePlaybackSeek(el75) {
    if (!el75 || (Number(el75.readyState || 0) >= 2 && !el75.seeking)) return Promise.resolve(true);
    return new Promise((handler23) => {
      let value174 = false;
      const list10 = ['seeked', 'canplay', 'canplaythrough', 'loadeddata', 'timeupdate'],
        handler24 = () => {
          if (value174) return;
          ((value174 = true),
            clearTimeout(setTimeout2),
            list10.forEach((item4) => el75.removeEventListener?.(item4, value175)),
            el75.removeEventListener?.('error', value175),
            el75.removeEventListener?.('abort', value175),
            handler23(true));
        },
        value175 = () => {
          if (Number(el75.readyState || 0) >= 2 || !el75.seeking) handler24();
        },
        setTimeout2 = setTimeout(handler24, VIDEO_CLIP_PLAY_SEEK_TIMEOUT_MS);
      (list10.forEach((item5) => el75.addEventListener?.(item5, value175)),
        el75.addEventListener?.('error', value175),
        el75.addEventListener?.('abort', value175));
    });
  },
  _resolveVideoSrcFromNode(value176) {
    return resolveVideoClipSourceUrl(value176);
  },
  async _renderThumbs() {
    const value177 = ++this._thumbToken,
      list11 = Array.isArray(this.thumbEls) ? this.thumbEls : [];
    if (!list11.length) return;
    const value178 = appStore.getState().nodes[this.nodeId],
      enabled27 = this._resolveVideoSrcFromNode(value178);
    if (!enabled27) return;
    const value179 = list11.length;
    let el76, box11, ctx;
    const run7 = (el77, value180) =>
      new Promise((handler25, handler26) => {
        let value181 = false;
        const run8 = () => {
            (el77.removeEventListener('seeked', value182), el77.removeEventListener('error', handler27));
          },
          value182 = () => {
            if (value181) return;
            ((value181 = true), run8(), handler25());
          },
          handler27 = () => {
            if (value181) return;
            ((value181 = true), run8(), handler26(new Error('video seek error')));
          };
        (el77.addEventListener('seeked', value182), el77.addEventListener('error', handler27));
        const value183 = Math.max(0, (Number(el77.duration) || 0) - 0.05),
          value184 = Math.max(0, Math.min(value183, value180));
        try {
          el77.currentTime = value184;
        } catch (value185) {
          handler27();
        }
        window.setTimeout(() => {
          if (value181) return;
          ((value181 = true), run8(), handler25());
        }, 0x1c2);
      });
    try {
      ((el76 = document.createElement('video')),
        (el76.muted = true),
        (el76.playsInline = true),
        (el76.preload = 'auto'),
        (el76.crossOrigin = 'anonymous'),
        await attachDesktopMediaPlaybackSource(el76, enabled27));
      if (!this._getVideoElementSource(el76)) {
        el76.src = enabled27;
        try {
          el76.load?.();
        } catch (value186) {}
      }
      await new Promise((handler28, handler29) => {
        let value187 = false,
          value188 = null;
        const run9 = () => {
            (el76.removeEventListener('loadedmetadata', value189),
              el76.removeEventListener('error', value190));
            if (value188) window.clearTimeout(value188);
          },
          value189 = () => {
            if (value187) return;
            ((value187 = true), run9(), handler28());
          },
          value190 = () => {
            if (value187) return;
            ((value187 = true), run9(), handler29(new Error('video load error')));
          };
        (el76.addEventListener('loadedmetadata', value189, { once: true }),
          el76.addEventListener('error', value190),
          (value188 = window.setTimeout(() => {
            if (value187) return;
            if (Number(el76.readyState || 0) >= 1 || this._readDurationSec(el76) > 0) {
              ((value187 = true), run9(), handler28());
              return;
            }
            ((value187 = true), run9(), handler29(new Error('video metadata timeout')));
          }, 0x1f40)));
      });
      const waitForVideoFrame3 = await waitForVideoFrame(el76, { timeoutMs: 0xbb8 });
      if (!waitForVideoFrame3) throw new Error('video frame timeout');
      if (!this.active || this._thumbToken !== value177) return;
      const enabled28 = this._readDurationSec(el76);
      if (!enabled28 || !Number.isFinite(enabled28)) return;
      if (this._applyDurationSec(enabled28, el76)) this._render();
      const value191 = el76.videoWidth || 1,
        value192 = el76.videoHeight || 1,
        value193 = 44,
        value194 = Math.max(1, Math.round((value191 / value192) * value193));
      ((box11 = document.createElement('canvas')),
        (box11.width = value194),
        (box11.height = value193),
        (ctx = box11.getContext('2d')));
      if (!ctx) return;
      for (let value195 = 0; value195 < value179; value195++) {
        if (!this.active || this._thumbToken !== value177) return;
        const value196 = ((value195 + 0.5) / value179) * enabled28;
        (await run7(el76, value196), await waitForVideoFrame(el76, { timeoutMs: 0x4b0 }));
        if (!this.active || this._thumbToken !== value177) return;
        (ctx.clearRect(0, 0, value194, value193), ctx.drawImage(el76, 0, 0, value194, value193));
        let enabled29;
        try {
          enabled29 = box11.toDataURL('image/jpeg', 0.7);
        } catch (value197) {
          return;
        }
        if (!enabled29) return;
        list11[value195].style.backgroundImage = 'url(' + enabled29 + ')';
      }
    } catch (value198) {
      return;
    } finally {
      if (el76) {
        try {
          el76.pause();
        } catch (value199) {}
        el76.removeAttribute('src');
        try {
          el76.load();
        } catch (value200) {}
      }
      ((box11 = null), (ctx = null));
    }
  },
  _handleDragAtClientX(value201) {
    if (!this.trackEl || !this.active) return;
    const enabled30 = this.durationSec;
    if (!enabled30 || !Number.isFinite(enabled30) || enabled30 <= 0) {
      this._render();
      return;
    }
    const box12 = this.trackEl.getBoundingClientRect();
    if (!box12.width) return;
    const value202 = value201 - box12.left,
      value203 = Math.max(0, Math.min(1, value202 / box12.width)),
      value204 = value203 * enabled30,
      value205 = Math.min(0.1, enabled30),
      value206 = Math.max(value205, this.endSec - this.startSec),
      value207 =
        this._dragMode === 'left' ||
        this._dragMode === 'right' ||
        this._dragMode === 'move' ||
        this._dragMode === 'set'
          ? this._pauseRangePlaybackForRangeEdit()
          : null;
    if (this._dragMode === 'left') {
      const value208 = Math.max(0, Math.min(value204, this.endSec - value205));
      this.startSec = value208;
      if (value207)
        try {
          value207.currentTime = value208;
        } catch (value209) {}
    } else {
      if (this._dragMode === 'right') {
        const value210 = Math.max(this.startSec + value205, Math.min(enabled30, value204));
        this.endSec = value210;
      } else {
        if (this._dragMode === 'move') {
          const value211 = this.selectionEl.getBoundingClientRect().left - box12.left,
            value212 = value201 - box12.left - this._dragOffsetPx,
            value213 = value212 - value211,
            value214 = (value213 / box12.width) * enabled30,
            value215 = Math.max(0, Math.min(enabled30 - value206, this.startSec + value214));
          ((this.startSec = value215), (this.endSec = value215 + value206));
          if (value207)
            try {
              value207.currentTime = value215;
            } catch (value216) {}
        } else {
          if (this._dragMode === 'set') {
            const value217 = Math.min(3, enabled30),
              value218 = Math.max(0, Math.min(enabled30 - value217, value204 - value217 / 2));
            ((this.startSec = value218), (this.endSec = value218 + value217));
          }
        }
      }
    }
    this._render();
  },
  _render() {
    if (!this.active || !this.trackEl || !this.selectionEl || !this.leftHandleEl || !this.rightHandleEl)
      return;
    const count22 = this.durationSec,
      value219 = Number.isFinite(count22) && count22 > 0,
      value220 = value219 ? Math.max(0, Math.min(this.startSec, count22)) : 0,
      value221 = value219 ? Math.max(0, Math.min(this.endSec, count22)) : 0,
      count23 = Math.max(0, value221 - value220);
    if (value219) {
      const value222 = (value220 / count22) * 100,
        value223 = (count23 / count22) * 100;
      ((this.selectionEl.style.left = value222 + '%'),
        (this.selectionEl.style.width = value223 + '%'),
        (this.leftHandleEl.style.left = value222 + '%'),
        (this.rightHandleEl.style.left = value222 + value223 + '%'),
        this.labelEl &&
          ((this.labelEl.textContent = count23.toFixed(2) + 's'),
          (this.labelEl.style.left = value222 + value223 / 2 + '%')));
    } else
      ((this.selectionEl.style.left = '0%'),
        (this.selectionEl.style.width = '0%'),
        (this.leftHandleEl.style.left = '0%'),
        (this.rightHandleEl.style.left = '0%'),
        this.labelEl &&
          ((this.labelEl.textContent = videoClipText('controls.loading')),
          (this.labelEl.style.left = '50%')));
    this._renderPlayhead();
    if (this.confirmBtnEl) {
      const enabled31 = value219 && count23 >= 0.1;
      ((this.confirmBtnEl.disabled = !enabled31),
        (this.confirmBtnEl.dataset.disabled = enabled31 ? 'false' : 'true'),
        this.confirmBtnEl.dataset.loading !== 'true' &&
          (this.confirmBtnEl.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'));
    }
  },
  async _confirm() {
    if (!this.confirmBtnEl) return;
    const el78 = this.confirmBtnEl;
    if (el78.dataset.disabled === 'true') return;
    const value224 = appStore.getState().nodes,
      name = value224[this.anchorNodeId];
    if (!name) {
      this.exit({ silent: true });
      return;
    }
    const enabled32 = this.durationSec;
    if (!enabled32 || !Number.isFinite(enabled32) || enabled32 <= 0) return;
    const start = Math.max(0, Math.min(this.startSec, enabled32)),
      end = Math.max(0, Math.min(this.endSec, enabled32));
    if (!(end > start)) return;
    const src3 = localPathToUrl(name.localPath) || name.src || name.videoUrl || name.resultUrl || '';
    if (!src3) return;
    ((el78.dataset.disabled = 'true'),
      (el78.dataset.loading = 'true'),
      (el78.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>'),
      window.showToast?.(videoClipText('cut.processing'), 'info'));
    try {
      let error3 = null;
      if (canUseElectronMediaTask())
        error3 = await enqueueElectronMediaTask(
          {
            kind: 'videoCut',
            nodeId: this.anchorNodeId,
            src: src3,
            args: { start: start, end: end },
          },
          { wait: true, timeout: 0x493e0 },
        );
      else {
        const response7 = await requester({
          url: '/api/v2/video/cut',
          method: 'POST',
          provider: 'local',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ src: src3, start: start, end: end }),
          allow404Null: true,
          returnMeta: true,
        });
        if (response7?.status === 0x194 || response7?.data == null)
          throw new Error(videoClipText('errors.cutEndpointMissing'));
        error3 = response7.data || {};
      }
      const response8 = error3?.result && typeof error3.result === 'object' ? error3.result : error3,
        videoCutResultLocalPath = normalizeVideoCutResultLocalPath(error3);
      if (!videoCutResultLocalPath || error3?.success === false || response8?.success === false)
        throw new Error(
          response8?.error || error3?.error || error3?.message || videoClipText('errors.cutFailed'),
        );
      const { width: width2, height: height } = getAutoMediaSizeByShortSide(
          name.width || 0x200,
          name.height || 0x120,
        ),
        x3 = calcSafeSpawnPosNearNode(appStore.getState().nodes, name, width2, height),
        id2 = generateId('source-video-cut'),
        positiveNumber10 = pickPositiveNumber(response8?.fps, error3?.fps),
        args3 = buildVideoCutNodeMeta(name, start, end, positiveNumber10),
        args4 = buildVideoCutNodePlaybackFields(videoCutResultLocalPath);
      (appStore.addNode(
        buildSourceMediaNodePayload({
          id: id2,
          type: 'source-video',
          x: x3.x,
          y: x3.y,
          width: width2,
          height: height,
          name: videoClipText('cut.newNodeName', {
            name: name.name || videoClipText('cut.videoFallback'),
          }),
          ...args4,
          ...args3,
          needsAutoResize: false,
          fixedSize: true,
        }),
      ),
        appStore.setSelectedNodes([id2]),
        commit(),
        ensureVideoCutNodeThumb(id2, videoCutResultLocalPath),
        window.v2FocusOnNodes?.([this.anchorNodeId, id2]),
        window._triggerLocalCacheSave?.(),
        window.showToast?.(videoClipText('cut.success'), 'success'),
        this.exit({ silent: true }));
    } catch (error4) {
      const error5 =
        error4 instanceof Error ? error4.message : String(error4 || videoClipText('errors.cutFailed'));
      (window.showToast?.(videoClipText('cut.failedWithError', { error: error5 }), 'error'),
        (el78.dataset.loading = 'false'),
        this._render(),
        (el78.dataset.loading = 'false'));
    }
    el78.dataset.loading = 'false';
  },
  exit({ silent: silent = false } = {}) {
    if (!this.active) return;
    ((this.active = false),
      this._thumbToken++,
      this._sourceToken++,
      (this._rangeLoopSeekPending = false),
      (this._rangePlaybackSeq += 1),
      appStore.setVideoClipState({ active: false, nodeId: null }));
    if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
    this._playheadRaf = 0;
    if (this._retryRaf) cancelAnimationFrame(this._retryRaf);
    this._retryRaf = 0;
    if (this.videoEl) {
      this._setClipMediaKeepAlive(this.videoEl, false);
      if (this._onLoadedMeta) this.videoEl.removeEventListener('loadedmetadata', this._onLoadedMeta);
      if (this._onDurationChange) this.videoEl.removeEventListener('durationchange', this._onDurationChange);
    }
    this._onKeyDown &&
      (window.removeEventListener('keydown', this._onKeyDown, true), (this._onKeyDown = null));
    this._onSmartClipDocDown &&
      (document.removeEventListener('pointerdown', this._onSmartClipDocDown, true),
      (this._onSmartClipDocDown = null));
    this._smartClipMaxSegmentDrag &&
      (this._smartClipMaxSegmentDrag.el?.classList?.remove('is-dragging'),
      this._smartClipMaxSegmentDrag.doc?.removeEventListener?.(
        'mousemove',
        this._onSmartClipMaxSegmentDragMove,
      ),
      this._smartClipMaxSegmentDrag.doc?.removeEventListener?.('mouseup', this._onSmartClipMaxSegmentDragUp),
      (this._smartClipMaxSegmentDrag = null));
    ((this._onSmartClipMaxSegmentDragMove = null),
      (this._onSmartClipMaxSegmentDragUp = null),
      (this._suppressSmartClipMaxSegmentClick = false));
    if (this._onPointerMove) window.removeEventListener('pointermove', this._onPointerMove, true);
    if (this._onPointerUp) window.removeEventListener('pointerup', this._onPointerUp, true);
    ((this._onLoadedMeta = null),
      (this._onDurationChange = null),
      (this._onPointerMove = null),
      (this._onPointerUp = null),
      (this._dragMode = null),
      (this._dragOffsetPx = 0));
    this._onDocClick &&
      (document.removeEventListener('pointerdown', this._onDocClick, true), (this._onDocClick = null));
    ((this.durationSec = 0),
      (this.startSec = 0),
      (this.endSec = 0),
      (this.nodeId = null),
      (this.anchorNodeId = null),
      (this.videoEl = null),
      (this.trackEl = null),
      (this.selectionEl = null),
      (this.leftHandleEl = null),
      (this.rightHandleEl = null),
      (this.playheadEl = null),
      (this.labelEl = null),
      (this.cancelBtnEl = null),
      (this.confirmBtnEl = null),
      (this.thumbEls = null));
    this._msgInterval && (clearInterval(this._msgInterval), (this._msgInterval = null));
    ((this._msgEls = null), this._applyFrozenUI(false), this._applyDimMode(false));
    if (this.barEl) this.barEl.remove();
    ((this.barEl = null), (this.wrapperEl = null));
    if (!silent) window.showToast?.(videoClipText('cut.cancelled'), 'info');
  },
};
const VIDEO_CLIP_CONTROLLER_METHOD_KEYS = new Set(
    Object.entries(VideoClipController)
      .filter(([, value225]) => typeof value225 === 'function')
      .map(([value226]) => value226),
  ),
  VIDEO_CLIP_CONTROLLER_INITIAL_STATE = Object.freeze(
    Object.fromEntries(
      Object.entries(VideoClipController).filter(
        ([value227]) => !VIDEO_CLIP_CONTROLLER_METHOD_KEYS.has(value227),
      ),
    ),
  );
export default VideoClipController;
export function createVideoClipController() {
  const value228 = Object.create(VideoClipController);
  for (const value229 of Object.keys(VideoClipController)) {
    if (VIDEO_CLIP_CONTROLLER_METHOD_KEYS.has(value229)) continue;
    const args5 = Object.hasOwn(VIDEO_CLIP_CONTROLLER_INITIAL_STATE, value229)
      ? VIDEO_CLIP_CONTROLLER_INITIAL_STATE[value229]
      : undefined;
    value228[value229] = Array.isArray(args5)
      ? [...args5]
      : args5 && typeof args5 === 'object'
        ? { ...args5 }
        : args5;
  }
  return value228;
}

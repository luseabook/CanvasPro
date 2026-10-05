import appStore from '../core/stores/appStore.js';
import { findAvailablePosition, generateId } from '../core/math.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode, calcSpawnStartFromAnchor, getNodeSpawnPrefs } from './nodeSpawn.js';
import { cutVideoRangeToLocal } from '../services/videoCutService.js';
import { fetchVideoMetaFromServer } from '../../api/videoMetaApi.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { resolveCanvasVideoPosterUrl, resolveCanvasVideoUrl } from '../services/canvasMediaLocalService.js';
import {
  SMART_CLIP_DEFAULT_FPS,
  SMART_CLIP_DEFAULT_SEGMENTS,
  SMART_CLIP_FPS_OPTIONS,
  SMART_CLIP_MAX_SEGMENTS,
  SMART_CLIP_MIN_SEGMENTS,
  SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
  SMART_CLIP_OUTPUT_MODE_SEGMENTS,
  normalizeSmartClipFps,
  normalizeSmartClipMaxSegments,
  normalizeSmartClipOutputMode,
  normalizeSmartClipRunOptions,
  runSmartClipJob,
} from '../services/smartClipJobService.js';
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
import { renderVideoTimelineThumbnails } from './videoTimelineThumbnails.js';
import { resolveNodeVideoElement } from './nodeVideoElement.js';
import {
  mirrorMediaClipRange,
  renderMediaClipReverseIcon,
  resolveMediaClipReverseControlState,
} from '../components/media-clip/mediaClipReverseControl.js';
import { createVideoRangeTimelineView } from '../components/media-clip/videoRangeTimelineView.js';
export function normalizeVideoCutResultLocalPath(value) {
  return pickResultLocalPath(value);
}
export function shouldVideoClipSelectionPointerUpSeek(item = '', key = false) {
  return String(item || '') === 'move' && key !== true;
}
export function resolveVideoClipSelectionBodyCursor(index = 'grab') {
  return index === 'pointer' ? 'var(--pointer-cursor)' : 'var(--grab-cursor)';
}
const SMART_CLIP_IMAGE_EXT_RE = /\.(?:png|jpe?g|webp|bmp|gif)(?:[?#]|$)/i,
  VIDEO_CLIP_SEEK_EPSILON_SEC = 0.035,
  VIDEO_CLIP_PLAY_SEEK_TIMEOUT_MS = 900;
export const SMART_CLIP_KEYFRAME_DEFAULT_OPTIONS = Object['freeze']({
  mode: 'stable',
  maxSegments: SMART_CLIP_DEFAULT_SEGMENTS,
  fps: SMART_CLIP_DEFAULT_FPS,
  outputMode: SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
});
function videoClipText(result, data = {}) {
  return t('videoClip.' + result, data);
}
function escapeClipHelperHtml(options) {
  return String(options ?? '')['replace'](/[&<>"']/g, (target) => {
    if (target === '&') return '&amp;';
    if (target === '<') return '&lt;';
    if (target === '>') return '&gt;';
    if (target === '"') return '&quot;';
    return '&#39;';
  });
}
function clipHelperLabel(source, next = {}) {
  return escapeClipHelperHtml(videoClipText(source, next));
}
export { normalizeSmartClipFps, normalizeSmartClipMaxSegments, normalizeSmartClipOutputMode };
export function isSmartClipImageResult(response, resultLocalPath = pickResultLocalPath(response)) {
  const current = String(response?.['outputType'] || response?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    entry = String(response?.['mimeType'] || response?.['contentType'] || '')
      ['trim']()
      ['toLowerCase']();
  return (
    current === 'image' ||
    entry['startsWith']('image/') ||
    SMART_CLIP_IMAGE_EXT_RE['test'](String(resultLocalPath || response?.['url'] || response?.['path'] || ''))
  );
}
function resolveSmartClipResultUrl(response2, record) {
  return (
    localPathToUrl(record) ||
    String(response2?.['url'] || response2?.['src'] || response2?.['imageUrl'] || '')['trim']()
  );
}
function getWindowTimer(payload) {
  const handle = globalThis['window']?.[payload] || globalThis[payload];
  return typeof handle === 'function' ? handle['bind'](globalThis['window'] || globalThis) : null;
}
function waitForSmartClipVideoEvent(el, state, config = 10000) {
  const run = getWindowTimer('setTimeout'),
    handler = getWindowTimer('clearTimeout');
  if (!el || typeof run !== 'function') return Promise['resolve'](false);
  return new Promise((handler2) => {
    let scope = false,
      input = null;
    const run2 = () => {
        for (const output of state) {
          el['removeEventListener']?.(output, value2);
        }
        (el['removeEventListener']?.('error', value3),
          el['removeEventListener']?.('abort', value3));
        if (input && typeof handler === 'function') handler(input);
      },
      handler3 = (value4) => {
        if (scope) return;
        ((scope = true), run2(), handler2(value4 === true));
      },
      value2 = () => handler3(true),
      value3 = () => handler3(false);
    for (const value5 of state) {
      el['addEventListener']?.(value5, value2, { once: true });
    }
    (el['addEventListener']?.('error', value3, { once: true }),
      el['addEventListener']?.('abort', value3, { once: true }),
      (input = run(() => handler3(false), config)));
  });
}
async function captureSmartClipVideoFirstFrame(enabled, fileNamePrefix) {
  const el2 = globalThis['document'];
  if (!el2 || !enabled) throw new Error('missing video url');
  const el3 = el2['createElement']('video');
  ((el3['muted'] = true),
    (el3['playsInline'] = true),
    (el3['preload'] = 'auto'),
    (el3['crossOrigin'] = 'anonymous'),
    (el3['style']['position'] = 'fixed'),
    (el3['style']['left'] = '-10000px'),
    (el3['style']['top'] = '-10000px'),
    (el3['style']['width'] = '1px'),
    (el3['style']['height'] = '1px'),
    (el3['style']['opacity'] = '0'),
    el2['body']?.['appendChild'](el3));
  try {
    el3['src'] = enabled;
    try {
      el3['load']?.();
    } catch {}
    const waitForVideoFrame2 = await waitForVideoFrame(el3, { timeoutMs: 10000 });
    if (!waitForVideoFrame2) throw new Error('video frame is not ready');
    return (
      Number(el3['currentTime'] || 0) > 0.001 &&
        ((el3['currentTime'] = 0),
        await waitForSmartClipVideoEvent(el3, ['seeked', 'timeupdate'], 5000)),
      await captureVideoFrameSnapshot(el3, { fileNamePrefix: fileNamePrefix })
    );
  } finally {
    try {
      (el3['pause']?.(), el3['removeAttribute']?.('src'), el3['load']?.());
    } catch {}
    el3['remove']?.();
  }
}
async function extractSmartClipVideoResultFirstFrame(value6, value7, value8) {
  const smartClipResultUrl = resolveSmartClipResultUrl(value6, value7);
  if (!smartClipResultUrl) throw new Error('missing video segment url');
  const captureSmartClipVideoFirstFrame2 = await captureSmartClipVideoFirstFrame(
    smartClipResultUrl,
    'smart_clip_keyframe_' + (value8 + 1),
  );
  return saveVideoFrameSnapshot(captureSmartClipVideoFirstFrame2, saveOutputBlob);
}
function emitSmartClipProgress(handler4, value9) {
  if (typeof handler4 !== 'function') return;
  try {
    handler4(value9);
  } catch {}
}
function getSmartClipStageText(value10) {
  if (value10 === 'detect') return videoClipText('smartClip.stages.detect');
  if (value10 === 'cut') return videoClipText('smartClip.stages.cut');
  if (value10 === 'frame') return videoClipText('smartClip.stages.frame');
  return videoClipText('smartClip.stages.processing');
}
function buildSmartClipProgressPayload(options2 = {}) {
  const progress = Math['max'](0, Math['min'](1, Number(options2['progress'] || 0))),
    pct = Math['round'](progress * 100),
    doneCount = Number(options2['doneCount'] || 0),
    total = Number(options2['total'] || 0),
    stage = String(options2['stage'] || ''),
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
  for (const value11 of args) {
    const count = Number(value11);
    if (Number['isFinite'](count) && count > 0) return count;
  }
  return 0;
}
function normalizeVideoClipReverseControl(onChange) {
  if (!onChange || typeof onChange['onChange'] !== 'function') return null;
  const isReversed = onChange['isReversed'] === true;
  return {
    isReversed: isReversed,
    materializedIsReversed:
      typeof onChange['materializedIsReversed'] === 'boolean'
        ? onChange['materializedIsReversed']
        : isReversed,
    pending: false,
    onChange: onChange['onChange'],
  };
}
function pickSelectedVideoItem(value12) {
  const list = Array['isArray'](value12?.['videos']) ? value12['videos'] : [];
  if (!list['length']) return null;
  const value13 = Number(value12?.['mainVideoIndex']),
    value14 = Number['isFinite'](value13) ? Math['max'](0, Math['trunc'](value13)) : 0;
  return list[Math['min'](value14, list['length'] - 1)] || list[0] || null;
}
const DIRECT_VIDEO_SOURCE_RE = /^(?:https?:|blob:|data:)/i,
  BLOCKED_VIDEO_SOURCE_RE = /^(?:file|javascript):/i;
function normalizeDirectVideoSource(value15) {
  const enabled2 = String(value15 || '')['trim']();
  if (!enabled2 || BLOCKED_VIDEO_SOURCE_RE['test'](enabled2)) return '';
  const url = localPathToUrl(enabled2);
  if (url) return url;
  if (enabled2['startsWith']('/') && !enabled2['startsWith']('//')) return enabled2;
  return DIRECT_VIDEO_SOURCE_RE['test'](enabled2) ? enabled2 : '';
}
export function resolveVideoClipSourceUrl(enabled3) {
  if (!enabled3) return '';
  const selectedVideoItem = pickSelectedVideoItem(enabled3),
    value16 = selectedVideoItem ? [selectedVideoItem, enabled3] : [enabled3];
  for (const value17 of value16) {
    const canvasVideoUrl = resolveCanvasVideoUrl(value17);
    if (canvasVideoUrl) return canvasVideoUrl;
    for (const value18 of ['src', 'videoUrl', 'url', 'resultUrl', 'sourceUrl']) {
      const directVideoSource = normalizeDirectVideoSource(value17?.[value18]);
      if (directVideoSource) return directVideoSource;
    }
  }
  return '';
}
export function buildVideoCutNodeMeta(value19, value20, value21, value22) {
  const value23 = Number(value20),
    value24 = Number(value21),
    count2 =
      Number['isFinite'](value23) && Number['isFinite'](value24) && value24 > value23
        ? value24 - value23
        : 0,
    box = pickSelectedVideoItem(value19),
    positiveNumber = pickPositiveNumber(
      box?.['videoDuration'],
      box?.['duration'],
      value19?.['videoDuration'],
      value19?.['duration'],
    ),
    positiveNumber2 = pickPositiveNumber(
      box?.['videoFrameCount'],
      box?.['frameCount'],
      value19?.['videoFrameCount'],
      value19?.['frameCount'],
    ),
    positiveNumber3 =
      pickPositiveNumber(
        value22,
        box?.['videoFps'],
        box?.['fps'],
        value19?.['videoFps'],
        value19?.['fps'],
      ) || (positiveNumber2 > 0 && positiveNumber > 0 ? positiveNumber2 / positiveNumber : 0),
    positiveNumber4 = pickPositiveNumber(
      box?.['videoWidth'],
      box?.['width'],
      value19?.['videoWidth'],
      value19?.['selectedVideoWidth'],
    ),
    positiveNumber5 = pickPositiveNumber(
      box?.['videoHeight'],
      box?.['height'],
      value19?.['videoHeight'],
      value19?.['selectedVideoHeight'],
    ),
    value25 = {};
  if (count2 > 0) value25['videoDuration'] = count2;
  if (positiveNumber3 > 0) value25['videoFps'] = positiveNumber3;
  count2 > 0 &&
    positiveNumber3 > 0 &&
    (value25['videoFrameCount'] = Math['max'](1, Math['round'](count2 * positiveNumber3)));
  if (positiveNumber4 > 0) value25['videoWidth'] = Math['round'](positiveNumber4);
  if (positiveNumber5 > 0) value25['videoHeight'] = Math['round'](positiveNumber5);
  return value25;
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
function applyVideoCutThumbResultToNode(value26, value27, response3 = {}) {
  const enabled4 = String(value26 || '')['trim'](),
    videoThumbSrc = String(value27 || '')['trim']();
  if (!enabled4 || !videoThumbSrc) return;
  const enabled5 = String(response3['thumbUrl'] || response3['url'] || '')['trim'](),
    resultLocalPath2 = pickResultLocalPath(response3);
  if (!enabled5 && !resultLocalPath2) return;
  const enabled6 = appStore['getState']()['nodes']?.[enabled4];
  if (!enabled6) return;
  const canvasVideoUrl2 = resolveCanvasVideoUrl(enabled6);
  if (canvasVideoUrl2 && canvasVideoUrl2 !== videoThumbSrc) return;
  const value28 = { videoThumbSrc: videoThumbSrc, videoThumbUnavailableSource: '' };
  (enabled5 && !String(enabled6['thumbUrl'] || '')['trim']() && (value28['thumbUrl'] = enabled5),
    resultLocalPath2 &&
      !String(enabled6['posterLocalPath'] || '')['trim']() &&
      (value28['posterLocalPath'] = resultLocalPath2),
    appStore['updateNodeData'](enabled4, value28));
}
function ensureVideoCutNodeThumb(value29, value30) {
  const url2 = localPathToUrl(value30);
  if (!url2) return;
  fetchVideoFirstFrameThumbFromServer(url2)
    ['then']((value31) => applyVideoCutThumbResultToNode(value29, url2, value31))
    ['catch'](() => {});
}
export async function runSmartClipFromVideoNode({
  nodeId: nodeId,
  options: options3,
  onProgress: onProgress,
  shouldContinue: shouldContinue,
} = {}) {
  const outputMode = normalizeSmartClipRunOptions(options3),
    value32 = String(nodeId || '')['trim'](),
    value33 = appStore['getState']()['nodes'],
    enabled7 = value33[value32];
  if (!enabled7) throw new Error(videoClipText('errors.videoNodeMissing'));
  const src2 =
    localPathToUrl(enabled7['localPath']) ||
    enabled7['src'] ||
    enabled7['videoUrl'] ||
    enabled7['resultUrl'] ||
    '';
  if (!src2) throw new Error(videoClipText('errors.invalidSource'));
  emitSmartClipProgress(onProgress, {
    stage: 'prepare',
    stageText: videoClipText('smartClip.stages.prepare'),
    text: videoClipText('smartClip.preparing'),
    outputMode: outputMode['outputMode'],
  });
  let runSmartClipJob2;
  try {
    runSmartClipJob2 = await runSmartClipJob({
      src: src2,
      options: outputMode,
      shouldContinue: shouldContinue,
      onProgress: (value34) => {
        emitSmartClipProgress(onProgress, {
          ...buildSmartClipProgressPayload(value34),
          outputMode: outputMode['outputMode'],
        });
      },
    });
  } catch (value35) {
    if (value35?.['code'] === 'endpoint_unavailable')
      throw new Error(videoClipText('errors.smartClipEndpointMissing'));
    if (value35?.['code'] === 'missing_job_id') throw new Error(videoClipText('errors.startMissingJobId'));
    if (value35?.['code'] === 'cancelled') throw new Error(videoClipText('errors.exitedClipMode'));
    throw value35;
  }
  {
    const value36 = runSmartClipJob2['job'] || {},
      progress2 = runSmartClipJob2['segments'];
    if (!progress2['length'])
      return { ok: false, reason: 'no-segments', nodeIds: [], outputMode: outputMode['outputMode'] };
    const box2 = appStore['getState']()['nodes'][value32];
    if (!box2) throw new Error(videoClipText('errors.sourceNodeMissing'));
    const outputMode2 = normalizeSmartClipOutputMode(value36['outputMode'] || outputMode['outputMode']),
      reason2 = outputMode2 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
      autoMediaSizeByShortSide = getAutoMediaSizeByShortSide(box2['width'] || 512, box2['height'] || 288),
      { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
      { startX: startX, startY: startY } = calcSpawnStartFromAnchor(box2, spacing, direction),
      nodeIds = [],
      value37 = { ...(appStore['getState']()['nodes'] || {}) };
    for (let doneCount2 = 0; doneCount2 < progress2['length']; doneCount2++) {
      const value38 = progress2[doneCount2] || {},
        resultLocalPath3 = pickResultLocalPath(value38);
      if (!resultLocalPath3) continue;
      let originalLocalPath = value38,
        localPath3 = resultLocalPath3;
      if (reason2 && !isSmartClipImageResult(value38, resultLocalPath3)) {
        emitSmartClipProgress(onProgress, {
          stage: 'frame',
          stageText: videoClipText('smartClip.stages.frame'),
          progress: progress2['length'] > 0 ? doneCount2 / progress2['length'] : 0,
          pct: progress2['length'] > 0 ? Math['round']((doneCount2 / progress2['length']) * 100) : 0,
          doneCount: doneCount2,
          total: progress2['length'],
          text: videoClipText('smartClip.extractingFrame', {
            current: doneCount2 + 1,
            total: progress2['length'],
          }),
          outputMode: outputMode2,
        });
        try {
          ((originalLocalPath = await extractSmartClipVideoResultFirstFrame(value38, resultLocalPath3, doneCount2)),
            (localPath3 = pickResultLocalPath(originalLocalPath)));
        } catch (value39) {
          console['warn']('[VideoClipController] smart clip keyframe fallback failed:', value39);
          continue;
        }
        if (!localPath3) continue;
      }
      const videoFps = normalizeSmartClipFps(value38['fps'] || outputMode['fps']),
        videoDuration = Number(value38['duration']) > 0 ? Number(value38['duration']) : 0,
        naturalWidth = pickPositiveNumber(
          originalLocalPath['width'],
          originalLocalPath['imageWidth'],
          originalLocalPath['originalWidth'],
          box2['videoWidth'],
          box2['selectedVideoWidth'],
          box2['originalWidth'],
          box2['width'],
          512,
        ),
        naturalHeight = pickPositiveNumber(
          originalLocalPath['height'],
          originalLocalPath['imageHeight'],
          originalLocalPath['originalHeight'],
          box2['videoHeight'],
          box2['selectedVideoHeight'],
          box2['originalHeight'],
          box2['height'],
          288,
        ),
        width = reason2 ? getAutoMediaSizeByShortSide(naturalWidth, naturalHeight) : autoMediaSizeByShortSide,
        x = avoidOverlap
          ? findAvailablePosition(
              value37,
              startX,
              startY,
              width['width'],
              width['height'],
              spacing,
              direction,
            )
          : { x: startX, y: startY },
        id = generateId(reason2 ? 'source-image-smart-frame' : 'source-video-scene'),
        args2 = reason2 ? null : buildVideoCutNodePlaybackFields(localPath3),
        value40 = reason2
          ? buildSourceMediaNodePayload({
              id: id,
              type: 'source-image',
              x: x['x'],
              y: x['y'],
              width: width['width'],
              height: width['height'],
              name: videoClipText('smartClip.keyframeNodeName', { index: doneCount2 + 1 }),
              src: localPathToUrl(localPath3),
              localPath: localPath3,
              originalLocalPath: originalLocalPath['originalLocalPath'] || localPath3,
              displayLocalPath: originalLocalPath['displayLocalPath'] || '',
              thumbLocalPath: originalLocalPath['thumbLocalPath'] || '',
              fileName: originalLocalPath['fileName'] || value38['fileName'] || '',
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
              x: x['x'],
              y: x['y'],
              width: width['width'],
              height: width['height'],
              name: videoClipText('smartClip.segmentNodeName', { index: doneCount2 + 1 }),
              ...args2,
              videoDuration: videoDuration || undefined,
              videoFps: videoFps,
              videoFrameCount:
                videoDuration > 0 ? Math['max'](1, Math['round'](videoDuration * videoFps)) : undefined,
              needsAutoResize: false,
              fixedSize: true,
            });
      (appStore['addNode'](value40),
        (value37[id] = value40),
        nodeIds['push'](id),
        !reason2 && ensureVideoCutNodeThumb(id, localPath3));
    }
    if (!nodeIds['length'])
      return {
        ok: false,
        reason: reason2 ? 'no-keyframes' : 'no-results',
        nodeIds: [],
        outputMode: outputMode2,
      };
    return (
      appStore['setSelectedNodes'](nodeIds),
      commit(),
      window['_triggerLocalCacheSave']?.(),
      { ok: true, nodeIds: nodeIds, outputMode: outputMode2 }
    );
  }
}
export function runSmartClipKeyframeExtractionFromVideoNode({
  nodeId: nodeId2,
  options: options4,
  onProgress: onProgress2,
  shouldContinue: shouldContinue2,
} = {}) {
  return runSmartClipFromVideoNode({
    nodeId: nodeId2,
    options: {
      ...SMART_CLIP_KEYFRAME_DEFAULT_OPTIONS,
      ...(options4 && typeof options4 === 'object' ? options4 : {}),
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
    reverseBtnEl: null,
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
    _reverseRequestToken: 0,
    _clipSessionToken: 0,
    _playheadRaf: 0,
    _rangeLoopSeekPending: false,
    _rangePlaybackSeq: 0,
    _pendingPlaybackStartSec: null,
    _hiddenEls: null,
    _sourceOptions: null,
    _reverseControl: null,
    _msgInterval: null,
    _msgEls: null,
    init(nodeId3) {
      if (!nodeId3) return;
      if (this['active']) this['exit']({ silent: true });
      ((this['_sourceOptions'] = null), (this['_reverseControl'] = null));
      const enabled8 = appStore['getState']()['nodes'][nodeId3];
      if (!enabled8) return;
      (this['_clipSessionToken']++,
        (this['active'] = true),
        (this['nodeId'] = nodeId3),
        (this['anchorNodeId'] = nodeId3),
        (this['_rangeLoopSeekPending'] = false),
        (this['_rangePlaybackSeq'] += 1),
        (this['_pendingPlaybackStartSec'] = null),
        appStore['setVideoClipState']({ active: true, nodeId: nodeId3 }),
        (this['_retryCount'] = 0),
        this['_mountWhenReady']());
    },
    initForSource(dimMode = {}) {
      const enabled9 = dimMode['wrapperEl'],
        sourceUrl =
          localPathToUrl(dimMode['sourceLocalPath']) || String(dimMode['sourceUrl'] || '')['trim']();
      if (!enabled9 || !sourceUrl)
        return (window['showToast']?.(videoClipText('errors.invalidSource'), 'warn'), false);
      if (this['active']) this['exit']({ silent: true });
      return (
        this['_clipSessionToken']++,
        (this['active'] = true),
        (this['videoEl'] = dimMode['videoEl'] || null),
        (this['nodeId'] = String(dimMode['anchorId'] || dimMode['nodeId'] || 'video-source-clip')),
        (this['anchorNodeId'] = this['nodeId']),
        (this['wrapperEl'] = enabled9),
        (this['durationSec'] = 0),
        (this['startSec'] = Math['max'](0, Number(dimMode['initialStartSec']) || 0)),
        (this['endSec'] = Math['max'](
          this['startSec'],
          Number(dimMode['initialEndSec']) || this['startSec'],
        )),
        (this['_rangeLoopSeekPending'] = false),
        (this['_rangePlaybackSeq'] += 1),
        (this['_pendingPlaybackStartSec'] = null),
        (this['_retryCount'] = 0),
        (this['_sourceOptions'] = {
          ...dimMode,
          sourceUrl: sourceUrl,
          dimMode: dimMode['dimMode'] === true,
          embedded: dimMode['embedded'] === true,
        }),
        !this['_sourceOptions']['embedded'] &&
          appStore['setVideoClipState']({ active: true, nodeId: this['nodeId'] }),
        (this['_reverseControl'] = normalizeVideoClipReverseControl(dimMode['reverseControl'])),
        !this['_sourceOptions']['embedded'] &&
          (this['_applyFrozenUI'](true), this['_applyDimMode'](this['_sourceOptions']['dimMode'])),
        this['_createUI'](),
        this['_bindEvents'](),
        this['_syncDurationAndDefaults'](),
        this['_render'](),
        true
      );
    },
    _applyDimMode(value41) {
      const el4 = document['getElementById']('v2-wrap');
      if (el4) {
        if (value41) el4['classList']['add']('is-video-clip-mode');
        else el4['classList']['remove']('is-video-clip-mode');
      }
      if (this['wrapperEl']) {
        if (value41) this['wrapperEl']['classList']['add']('is-video-clip-target');
        else this['wrapperEl']['classList']['remove']('is-video-clip-target');
      }
    },
    _applyFrozenUI(value42) {
      if (!this['wrapperEl']) return;
      const value43 = 'is-video-clipping';
      if (value42) this['wrapperEl']['classList']['add'](value43);
      else this['wrapperEl']['classList']['remove'](value43);
      this['_applyFrozenOverlaysHidden'](value42);
    },
    _applyFrozenOverlaysHidden(value44) {
      if (!this['wrapperEl']) return;
      if (value44) {
        if (Array['isArray'](this['_hiddenEls']) && this['_hiddenEls']['length']) return;
        const list2 = [
            '.video-controls',
            '.video-mute-btn',
            '.node-upload-hint',
            '.video-center-indicator',
            '.gen-video-center-indicator',
            '.multi-toggle-btn',
          ],
          list3 = [];
        (list2['forEach']((value45) => {
          this['wrapperEl']['querySelectorAll'](value45)['forEach']((el5) => {
            (list3['push']({ el: el5, prevDisplay: el5['style']['display'] }),
              (el5['style']['display'] = 'none'));
          });
        }),
          (this['_hiddenEls'] = list3));
        return;
      }
      const list4 = Array['isArray'](this['_hiddenEls']) ? this['_hiddenEls'] : [];
      ((this['_hiddenEls'] = null),
        list4['forEach'](({ el: el6, prevDisplay: prevDisplay }) => {
          if (!el6 || !el6['isConnected']) return;
          el6['style']['display'] = prevDisplay || '';
        }));
    },
    _mountWhenReady() {
      const value46 = this['nodeId'],
        value47 = () => {
          if (!this['active'] || this['nodeId'] !== value46) return;
          const enabled10 = document['getElementById'](value46);
          if (!enabled10) {
            this['_retryCount']++;
            if (this['_retryCount'] > 10) {
              this['exit']({ silent: true });
              return;
            }
            this['_retryRaf'] = requestAnimationFrame(value47);
            return;
          }
          ((this['wrapperEl'] = enabled10),
            this['_applyFrozenUI'](true),
            this['_applyDimMode'](true),
            this['_createUI'](),
            this['_bindEvents'](),
            this['_syncDurationAndDefaults'](),
            this['_render']());
        };
      this['_retryRaf'] = requestAnimationFrame(value47);
    },
    _createUI() {
      if (!this['wrapperEl']) return;
      this['wrapperEl']
        ['querySelectorAll']('.v2-video-clipbar')
        ['forEach']((el7) => el7['remove']());
      const el8 = document['createElement']('div');
      el8['className'] = 'v2-video-clipbar';
      if (this['_sourceOptions']) el8['classList']['add']('v2-video-source-clipbar');
      this['_sourceOptions']?.['embedded'] && el8['classList']['add']('v2-video-clipbar--embedded');
      (el8['addEventListener']('pointerdown', (event) => event['stopPropagation']()),
        el8['addEventListener']('click', (event2) => event2['stopPropagation']()),
        el8['addEventListener']('dblclick', (event3) => {
          (event3['preventDefault'](), event3['stopPropagation']());
        }));
      if (this['_sourceOptions']?.['embedded']) {
        const el9 = document['createElement']('div');
        el9['className'] = 'v2-video-cliprow';
        const videoRangeTimelineView = createVideoRangeTimelineView({ documentRef: document });
        (el9['appendChild'](videoRangeTimelineView['trackEl']),
          el8['appendChild'](el9),
          this['wrapperEl']['appendChild'](el8),
          (this['barEl'] = el8),
          (this['cancelBtnEl'] = null),
          (this['reverseBtnEl'] = null),
          (this['confirmBtnEl'] = null),
          (this['trackEl'] = videoRangeTimelineView['trackEl']),
          (this['selectionEl'] = videoRangeTimelineView['selectionEl']),
          (this['leftHandleEl'] = videoRangeTimelineView['leftHandleEl']),
          (this['rightHandleEl'] = videoRangeTimelineView['rightHandleEl']),
          (this['playheadEl'] = videoRangeTimelineView['playheadEl']),
          (this['labelEl'] = videoRangeTimelineView['labelEl']),
          (this['thumbEls'] = videoRangeTimelineView['thumbEls']),
          (this['_msgInterval'] = null),
          (this['_msgEls'] = null));
        return;
      }
      const el10 = document['createElement']('button');
      ((el10['type'] = 'button'),
        (el10['className'] = 'v2-video-clipbtn cancel'),
        (el10['title'] = videoClipText('controls.cancel')));
      {
        const value48 = 'http://www.w3.org/2000/svg',
          el11 = document['createElementNS'](value48, 'svg');
        (el11['setAttribute']('width', '20'),
          el11['setAttribute']('height', '20'),
          el11['setAttribute']('viewBox', '0 0 24 24'),
          el11['setAttribute']('fill', 'none'),
          el11['setAttribute']('stroke', 'currentColor'),
          el11['setAttribute']('stroke-width', '2'));
        const el12 = document['createElementNS'](value48, 'path');
        el12['setAttribute']('d', 'M18 6L6 18');
        const el13 = document['createElementNS'](value48, 'path');
        (el13['setAttribute']('d', 'M6 6l12 12'),
          el11['appendChild'](el12),
          el11['appendChild'](el13),
          el10['appendChild'](el11));
      }
      const el14 = document['createElement']('button');
      ((el14['type'] = 'button'),
        (el14['className'] = 'v2-video-clipbtn confirm'),
        (el14['title'] = videoClipText('controls.done')));
      {
        const value49 = 'http://www.w3.org/2000/svg',
          el15 = document['createElementNS'](value49, 'svg');
        (el15['setAttribute']('width', '24'),
          el15['setAttribute']('height', '24'),
          el15['setAttribute']('viewBox', '0 0 24 24'),
          el15['setAttribute']('fill', 'none'),
          el15['setAttribute']('stroke', 'currentColor'),
          el15['setAttribute']('stroke-width', '2.5'));
        const el16 = document['createElementNS'](value49, 'polyline');
        (el16['setAttribute']('points', '20 6 9 17 4 12'),
          el15['appendChild'](el16),
          el14['appendChild'](el15));
      }
      let el17 = null;
      this['_reverseControl'] &&
        ((el17 = document['createElement']('button')),
        (el17['type'] = 'button'),
        (el17['className'] = 'v2-video-clipbtn reverse'),
        (el17['innerHTML'] = renderMediaClipReverseIcon({ className: 'v2-video-clip-reverse-icon' })));
      const el18 = document['createElement']('div');
      el18['className'] = 'v2-video-cliprow';
      const {
          trackEl: trackEl,
          selectionEl: selectionEl,
          leftHandleEl: leftHandleEl,
          rightHandleEl: rightHandleEl,
          playheadEl: playheadEl,
          labelEl: labelEl,
          thumbEls: thumbEls,
        } = createVideoRangeTimelineView({ documentRef: document }),
        el19 = document['createElement']('div');
      el19['className'] = 'v2-video-cliphelper-row';
      const el20 = document['createElement']('div');
      el20['className'] = 'v2-video-cliphelper-left';
      const list5 = [
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
      this['_msgEls'] = list5['map']((value50, count3) => {
        const el21 = document['createElement']('div');
        el21['className'] = 'v2-video-cliphelper-msg';
        if (count3 !== 0) el21['classList']['add']('hide-down');
        return ((el21['innerHTML'] = value50['html']), el20['appendChild'](el21), el21);
      });
      let value51 = 0;
      ((this['_msgInterval'] = setInterval(() => {
        if (!this['active'] || !this['_msgEls']) return;
        const el22 = this['_msgEls'][value51];
        value51 = (value51 + 1) % this['_msgEls']['length'];
        const el23 = this['_msgEls'][value51];
        (el22['classList']['remove']('hide-down'),
          el22['classList']['add']('hide-up'),
          el23['classList']['remove']('hide-up'),
          el23['classList']['remove']('hide-down'),
          setTimeout(() => {
            el22 &&
              el22['classList']['contains']('hide-up') &&
              (el22['classList']['remove']('hide-up'), el22['classList']['add']('hide-down'));
          }, 300));
      }, 4000)),
        (this['_smartClipMode'] = this['_smartClipMode'] || 'stable'),
        (this['_smartClipMaxSegments'] = normalizeSmartClipMaxSegments(this['_smartClipMaxSegments'])),
        (this['_smartClipFps'] = normalizeSmartClipFps(this['_smartClipFps'])),
        (this['_smartClipOutputMode'] = normalizeSmartClipOutputMode(this['_smartClipOutputMode'])));
      const el24 = document['createElement']('div');
      el24['className'] = 'v2-video-clip-actions';
      const el25 = document['createElement']('div');
      el25['className'] = 'v2-video-clip-smartwrap';
      const el26 = document['createElement']('button');
      el26['className'] = 'v2-video-clip-smartbtn';
      const value52 =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
        value53 =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>',
        handler5 = () => escapeClipHelperHtml(videoClipText('smartPanel.smartClipButton'));
      el26['innerHTML'] = value52 + ' ' + handler5();
      const el27 = document['createElement']('button');
      ((el27['type'] = 'button'),
        (el27['className'] = 'v2-video-clip-smartbtn v2-video-clip-framebtn'),
        (el27['title'] = videoClipText('smartPanel.extractFrame')),
        el27['setAttribute']('aria-label', videoClipText('smartPanel.extractFrame')));
      const value54 =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>';
      el27['innerHTML'] = value54;
      const el28 = document['createElement']('div');
      el28['className'] = 'v2-video-clip-smartpanel';
      const el29 = document['createElement']('div');
      ((el29['className'] = 'v2-video-clip-smartpanel-title'),
        (el29['textContent'] = videoClipText('smartPanel.title')));
      const el30 = document['createElement']('div');
      el30['className'] = 'v2-video-clip-smartpanel-row';
      const el31 = document['createElement']('div');
      ((el31['className'] = 'v2-video-clip-smartpanel-label'),
        (el31['textContent'] = videoClipText('smartPanel.output')));
      const el32 = document['createElement']('span');
      ((el32['className'] = 'rh-tip'),
        el32['setAttribute']('data-tooltip', videoClipText('smartPanel.outputTip')),
        (el32['textContent'] = '!'),
        el31['appendChild'](el32));
      const el33 = document['createElement']('div');
      el33['className'] = 'v2-video-clip-modegroup v2-video-clip-outputgroup';
      const el34 = document['createElement']('button');
      ((el34['type'] = 'button'),
        (el34['className'] = 'v2-video-clip-modebtn'),
        (el34['dataset']['outputMode'] = SMART_CLIP_OUTPUT_MODE_SEGMENTS),
        (el34['textContent'] = videoClipText('smartPanel.outputSegments')));
      const el35 = document['createElement']('button');
      ((el35['type'] = 'button'),
        (el35['className'] = 'v2-video-clip-modebtn'),
        (el35['dataset']['outputMode'] = SMART_CLIP_OUTPUT_MODE_KEYFRAMES),
        (el35['textContent'] = videoClipText('smartPanel.outputKeyframes')),
        el33['appendChild'](el34),
        el33['appendChild'](el35),
        el30['appendChild'](el31),
        el30['appendChild'](el33));
      const el36 = document['createElement']('div');
      el36['className'] = 'v2-video-clip-smartpanel-row';
      const el37 = document['createElement']('div');
      ((el37['className'] = 'v2-video-clip-smartpanel-label'),
        (el37['textContent'] = videoClipText('smartPanel.mode')));
      const el38 = document['createElement']('span');
      ((el38['className'] = 'rh-tip'),
        el38['setAttribute']('data-tooltip', videoClipText('smartPanel.modeTip')),
        (el38['textContent'] = '!'),
        el37['appendChild'](el38));
      const el39 = document['createElement']('div');
      el39['className'] = 'v2-video-clip-modegroup';
      const el40 = document['createElement']('button');
      ((el40['type'] = 'button'),
        (el40['className'] = 'v2-video-clip-modebtn'),
        (el40['dataset']['mode'] = 'stable'),
        (el40['textContent'] = videoClipText('smartPanel.modeStable')));
      const el41 = document['createElement']('button');
      ((el41['type'] = 'button'),
        (el41['className'] = 'v2-video-clip-modebtn'),
        (el41['dataset']['mode'] = 'balanced'),
        (el41['textContent'] = videoClipText('smartPanel.modeBalanced')));
      const el42 = document['createElement']('button');
      ((el42['type'] = 'button'),
        (el42['className'] = 'v2-video-clip-modebtn'),
        (el42['dataset']['mode'] = 'sensitive'),
        (el42['textContent'] = videoClipText('smartPanel.modeSensitive')),
        el39['appendChild'](el40),
        el39['appendChild'](el41),
        el39['appendChild'](el42),
        el36['appendChild'](el37),
        el36['appendChild'](el39));
      const el43 = document['createElement']('div');
      el43['className'] = 'v2-video-clip-smartpanel-row';
      const el44 = document['createElement']('div');
      ((el44['className'] = 'v2-video-clip-smartpanel-label'),
        (el44['textContent'] = videoClipText('smartPanel.fps')));
      const el45 = document['createElement']('span');
      ((el45['className'] = 'rh-tip'),
        el45['setAttribute']('data-tooltip', videoClipText('smartPanel.fpsTip')),
        (el45['textContent'] = '!'),
        el44['appendChild'](el45));
      const el46 = document['createElement']('div');
      el46['className'] = 'v2-video-clip-modegroup v2-video-clip-fpsgroup';
      const list6 = SMART_CLIP_FPS_OPTIONS['map']((fps) => {
        const el47 = document['createElement']('button');
        return (
          (el47['type'] = 'button'),
          (el47['className'] = 'v2-video-clip-modebtn v2-video-clip-fpsbtn'),
          (el47['dataset']['fps'] = String(fps)),
          (el47['textContent'] = videoClipText('smartPanel.fpsValue', { fps: fps })),
          el46['appendChild'](el47),
          el47
        );
      });
      (el43['appendChild'](el44), el43['appendChild'](el46));
      const el48 = document['createElement']('div');
      el48['className'] = 'v2-video-clip-smartpanel-row';
      const el49 = document['createElement']('div');
      ((el49['className'] = 'v2-video-clip-smartpanel-label'),
        (el49['textContent'] = videoClipText('smartPanel.maxSegments')));
      const el50 = document['createElement']('span');
      ((el50['className'] = 'rh-tip'),
        el50['setAttribute'](
          'data-tooltip',
          videoClipText('smartPanel.maxSegmentsTip', { max: SMART_CLIP_MAX_SEGMENTS }),
        ),
        (el50['textContent'] = '!'),
        el49['appendChild'](el50));
      const el51 = document['createElement']('div');
      el51['className'] = 'v2-video-clip-maxsegwrap';
      const el52 = document['createElement']('div');
      ((el52['className'] = 'rh-stepper-value v2-video-clip-maxseg'),
        el52['setAttribute']('role', 'spinbutton'),
        el52['setAttribute']('aria-label', videoClipText('smartPanel.maxSegmentsAria')),
        el52['setAttribute']('aria-valuemin', String(SMART_CLIP_MIN_SEGMENTS)),
        el52['setAttribute']('aria-valuemax', String(SMART_CLIP_MAX_SEGMENTS)),
        (el52['tabIndex'] = 0));
      const el53 = document['createElement']('span');
      ((el53['className'] = 'v2-video-clip-maxseg-suffix'),
        (el53['textContent'] = videoClipText('smartPanel.segmentUnit')),
        el51['appendChild'](el52),
        el51['appendChild'](el53),
        el48['appendChild'](el49),
        el48['appendChild'](el51));
      const el54 = document['createElement']('div');
      ((el54['className'] = 'v2-video-clip-smartpanel-hint'),
        (el54['textContent'] = videoClipText('smartPanel.hintDefault')));
      const el55 = document['createElement']('div');
      el55['className'] = 'v2-video-clip-smartpanel-actions';
      const el56 = document['createElement']('button');
      ((el56['type'] = 'button'),
        (el56['className'] = 'v2-video-clip-panelbtn'),
        (el56['textContent'] = videoClipText('controls.cancel')));
      const el57 = document['createElement']('button');
      ((el57['type'] = 'button'),
        (el57['className'] = 'v2-video-clip-panelbtn primary'),
        (el57['textContent'] = videoClipText('controls.start')),
        el55['appendChild'](el56),
        el55['appendChild'](el57),
        el28['appendChild'](el29),
        el28['appendChild'](el30),
        el28['appendChild'](el36),
        el28['appendChild'](el43),
        el28['appendChild'](el48),
        el28['appendChild'](el54),
        el28['appendChild'](el55));
      const list7 = [el34, el35],
        handler6 = () => {
          const smartClipOutputMode = normalizeSmartClipOutputMode(this['_smartClipOutputMode']);
          ((this['_smartClipOutputMode'] = smartClipOutputMode),
            list7['forEach']((el58) => {
              el58['classList']['toggle']('is-active', el58['dataset']['outputMode'] === smartClipOutputMode);
            }));
          const value55 = smartClipOutputMode === SMART_CLIP_OUTPUT_MODE_KEYFRAMES;
          (el43['classList']['toggle']('is-disabled', value55),
            list6['forEach']((el59) => {
              ((el59['disabled'] = value55),
                el59['setAttribute']('aria-disabled', value55 ? 'true' : 'false'));
            }),
            (el54['textContent'] = value55
              ? videoClipText('smartPanel.hintKeyframes')
              : videoClipText('smartPanel.hintDefault')));
          const value56 = this['_smartClipMode'] || 'stable';
          [el40, el41, el42]['forEach']((el60) => {
            if (!el60) return;
            if (el60['dataset']['mode'] === value56) el60['classList']['add']('is-active');
            else el60['classList']['remove']('is-active');
          });
          const smartClipFps = normalizeSmartClipFps(this['_smartClipFps']);
          ((this['_smartClipFps'] = smartClipFps),
            list6['forEach']((el61) => {
              el61['classList']['toggle'](
                'is-active',
                Number(el61['dataset']['fps']) === smartClipFps,
              );
            }));
          const smartClipMaxSegments = normalizeSmartClipMaxSegments(this['_smartClipMaxSegments']);
          ((this['_smartClipMaxSegments'] = smartClipMaxSegments),
            (el52['textContent'] = String(smartClipMaxSegments)),
            el52['setAttribute']('aria-valuenow', String(smartClipMaxSegments)));
        };
      handler6();
      const run3 = () => {
          if (!this['_smartClipMaxSegmentDrag']) return;
          (this['_smartClipMaxSegmentDrag']['el']?.['classList']?.['remove']('is-dragging'),
            this['_smartClipMaxSegmentDrag']['doc']?.['removeEventListener']?.(
              'mousemove',
              this['_onSmartClipMaxSegmentDragMove'],
            ),
            this['_smartClipMaxSegmentDrag']['doc']?.['removeEventListener']?.(
              'mouseup',
              this['_onSmartClipMaxSegmentDragUp'],
            ),
            (this['_smartClipMaxSegmentDrag'] = null));
        },
        handler7 = (value57) => {
          ((this['_smartClipMaxSegments'] = normalizeSmartClipMaxSegments(value57)), handler6());
        },
        handler8 = () => {
          if (!el52?.['isConnected']) return;
          const smartClipMaxSegments2 = normalizeSmartClipMaxSegments(this['_smartClipMaxSegments']),
            el62 = document['createElement']('input');
          ((el62['className'] = 'rh-stepper-input v2-video-clip-maxseg-input'),
            (el62['type'] = 'number'),
            (el62['min'] = String(SMART_CLIP_MIN_SEGMENTS)),
            (el62['max'] = String(SMART_CLIP_MAX_SEGMENTS)),
            (el62['step'] = '1'),
            (el62['value'] = String(smartClipMaxSegments2)));
          let value58 = false;
          const run4 = (value59) => {
            if (value58) return;
            ((value58 = true),
              handler7(value59 ? el62['value'] : smartClipMaxSegments2),
              el62['replaceWith'](el52),
              handler6());
          };
          (el62['addEventListener']('click', (event4) => event4['stopPropagation']()),
            el62['addEventListener']('mousedown', (event5) => event5['stopPropagation']()),
            el62['addEventListener']('keydown', (event6) => {
              event6['stopPropagation']();
              if (event6['key'] === 'Enter') run4(true);
              if (event6['key'] === 'Escape') run4(false);
            }),
            el62['addEventListener']('blur', () => run4(true)),
            el52['replaceWith'](el62),
            el62['focus'](),
            el62['select']());
        };
      ((this['_onSmartClipMaxSegmentDragMove'] = (event7) => {
        const box3 = this['_smartClipMaxSegmentDrag'];
        if (!box3) return;
        const value60 = event7['clientX'] - box3['x'],
          value61 = Math['trunc'](value60 / 6),
          smartClipMaxSegments3 = normalizeSmartClipMaxSegments(box3['base'] + value61);
        smartClipMaxSegments3 !== box3['last'] &&
          ((box3['moved'] = true), (box3['last'] = smartClipMaxSegments3), handler7(smartClipMaxSegments3));
      }),
        (this['_onSmartClipMaxSegmentDragUp'] = () => {
          const enabled11 = this['_smartClipMaxSegmentDrag'];
          if (!enabled11) return;
          (run3(),
            enabled11['moved'] &&
              ((this['_suppressSmartClipMaxSegmentClick'] = true), handler7(enabled11['last'])));
        }));
      const run5 = () => {
          (el28['classList']['remove']('is-open'),
            this['_onSmartClipDocDown'] &&
              (document['removeEventListener']('pointerdown', this['_onSmartClipDocDown'], true),
              (this['_onSmartClipDocDown'] = null)));
        },
        handler9 = () => {
          if (el26['dataset']['loading'] === 'true') return;
          (handler6(),
            el28['classList']['add']('is-open'),
            !this['_onSmartClipDocDown'] &&
              ((this['_onSmartClipDocDown'] = (event8) => {
                if (!this['active']) return;
                const enabled12 = event8?.['target'];
                if (!enabled12) return;
                if (el25['contains'](enabled12)) return;
                run5();
              }),
              document['addEventListener']('pointerdown', this['_onSmartClipDocDown'], true)));
        },
        handler10 = () => {
          if (el28['classList']['contains']('is-open')) run5();
          else handler9();
        },
        handler11 = (value62) => {
          ((this['_smartClipMode'] = value62), handler6());
        },
        handler12 = (value63) => {
          ((this['_smartClipOutputMode'] = normalizeSmartClipOutputMode(value63)), handler6());
        },
        handler13 = (value64) => {
          ((this['_smartClipFps'] = normalizeSmartClipFps(value64)), handler6());
        };
      (list7['forEach']((el63) => {
        el63['onclick'] = (event9) => {
          (event9['stopPropagation'](), handler12(el63['dataset']['outputMode']));
        };
      }),
        [el40, el41, el42]['forEach']((el64) => {
          el64['onclick'] = (event10) => {
            (event10['stopPropagation'](), handler11(el64['dataset']['mode'] || 'stable'));
          };
        }),
        list6['forEach']((el65) => {
          el65['onclick'] = (event11) => {
            (event11['stopPropagation'](), handler13(el65['dataset']['fps']));
          };
        }),
        (el52['onmousedown'] = (x2) => {
          if (x2['button'] !== 0) return;
          (x2['preventDefault'](), x2['stopPropagation']());
          const doc = document,
            base = normalizeSmartClipMaxSegments(this['_smartClipMaxSegments']);
          (run3(),
            (this['_smartClipMaxSegmentDrag'] = {
              x: x2['clientX'],
              base: base,
              last: base,
              moved: false,
              el: el52,
              doc: doc,
            }),
            el52['classList']['add']('is-dragging'),
            doc['addEventListener']('mousemove', this['_onSmartClipMaxSegmentDragMove']),
            doc['addEventListener']('mouseup', this['_onSmartClipMaxSegmentDragUp']));
        }),
        (el52['onclick'] = (event12) => {
          event12['stopPropagation']();
          if (this['_suppressSmartClipMaxSegmentClick']) {
            this['_suppressSmartClipMaxSegmentClick'] = false;
            return;
          }
          handler8();
        }),
        (el52['onkeydown'] = (event13) => {
          event13['stopPropagation']();
          if (event13['key'] === 'Enter' || event13['key'] === ' ') {
            (event13['preventDefault'](), handler8());
            return;
          }
          if (event13['key'] === 'ArrowRight' || event13['key'] === 'ArrowUp') {
            (event13['preventDefault'](), handler7(Number(this['_smartClipMaxSegments']) + 1));
            return;
          }
          (event13['key'] === 'ArrowLeft' || event13['key'] === 'ArrowDown') &&
            (event13['preventDefault'](), handler7(Number(this['_smartClipMaxSegments']) - 1));
        }),
        (el56['onclick'] = (event14) => {
          (event14['stopPropagation'](), run5());
        }));
      const run6 = async ({
        mode: mode,
        maxSegments: maxSegments,
        fps: fps2,
        outputMode: outputMode3,
      }) => {
        const outputMode4 = normalizeSmartClipOutputMode(outputMode3),
          value65 = outputMode4 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES;
        ((el26['dataset']['loading'] = 'true'),
          (el26['disabled'] = true),
          (el26['innerHTML'] =
            value53 + ' ' + escapeClipHelperHtml(videoClipText('smartClip.preparing'))),
          window['showToast']?.(
            value65
              ? videoClipText('smartClip.startedKeyframes')
              : videoClipText('smartClip.startedSegments'),
            'info',
          ));
        try {
          const count4 = await runSmartClipFromVideoNode({
            nodeId: this['anchorNodeId'],
            options: { mode: mode, maxSegments: maxSegments, fps: fps2, outputMode: outputMode4 },
            shouldContinue: () => this['active'],
            onProgress: (response4) => {
              if (!el26?.['isConnected'] || !response4?.['text']) return;
              el26['innerHTML'] = value53 + ' ' + response4['text'];
            },
          });
          if (!count4?.['ok']) {
            window['showToast']?.(
              count4?.['reason'] === 'no-segments'
                ? videoClipText('smartClip.noSegments')
                : value65
                  ? videoClipText('smartClip.noKeyframes')
                  : videoClipText('smartClip.noResults'),
              count4?.['reason'] === 'no-segments' ? 'info' : 'error',
            );
            return;
          }
          (window['showToast']?.(
            value65
              ? videoClipText('smartClip.completeKeyframes', { count: count4['nodeIds']['length'] })
              : videoClipText('smartClip.completeSegments', { count: count4['nodeIds']['length'] }),
            'success',
          ),
            this['exit']({ silent: true }));
        } catch (error) {
          const error2 =
            error instanceof Error
              ? error['message']
              : String(error || videoClipText('errors.smartClipFailed'));
          window['showToast']?.(videoClipText('smartClip.failedWithError', { error: error2 }), 'error');
        } finally {
          (run5(),
            el26 &&
              el26['isConnected'] &&
              ((el26['dataset']['loading'] = 'false'),
              (el26['disabled'] = false),
              (el26['innerHTML'] = value52 + ' ' + handler5())));
        }
      };
      ((el57['onclick'] = async (event15) => {
        (event15['stopPropagation'](), run5());
        const mode2 = this['_smartClipMode'] || 'stable',
          maxSegments2 = normalizeSmartClipMaxSegments(this['_smartClipMaxSegments']),
          fps3 = normalizeSmartClipFps(this['_smartClipFps']),
          outputMode5 = normalizeSmartClipOutputMode(this['_smartClipOutputMode']);
        await run6({ mode: mode2, maxSegments: maxSegments2, fps: fps3, outputMode: outputMode5 });
      }),
        (el26['onclick'] = (event16) => {
          (event16['stopPropagation'](), handler10());
        }),
        (el27['onclick'] = async (event17) => {
          (event17['stopPropagation'](), run5());
          if (el27['dataset']['loading'] === 'true') return;
          ((el27['dataset']['loading'] = 'true'),
            (el27['disabled'] = true),
            (el27['innerHTML'] = value53));
          try {
            const videoEl = this['videoEl'] || this['_getVideoEl']();
            await extractCurrentVideoFrameToImageNode({
              videoEl: videoEl,
              anchorNodeId: this['anchorNodeId'],
              fallbackDurationSec: this['_readDurationSec'](videoEl) || this['durationSec'],
              logPrefix: '[VideoClipController]',
            });
          } finally {
            el27 &&
              el27['isConnected'] &&
              ((el27['dataset']['loading'] = 'false'),
              (el27['disabled'] = false),
              (el27['innerHTML'] = value54));
          }
        }),
        el25['appendChild'](el26),
        el25['appendChild'](el28),
        el24['appendChild'](el25),
        el24['appendChild'](el27),
        el19['appendChild'](el20));
      if (!this['_sourceOptions']) el19['appendChild'](el24);
      (el18['appendChild'](el10), el18['appendChild'](trackEl));
      if (el17) el18['appendChild'](el17);
      (el18['appendChild'](el14),
        el8['appendChild'](el18),
        el8['appendChild'](el19),
        this['wrapperEl']['appendChild'](el8),
        (this['barEl'] = el8),
        (this['cancelBtnEl'] = el10),
        (this['reverseBtnEl'] = el17),
        (this['confirmBtnEl'] = el14),
        (this['trackEl'] = trackEl),
        (this['selectionEl'] = selectionEl),
        (this['leftHandleEl'] = leftHandleEl),
        (this['rightHandleEl'] = rightHandleEl),
        (this['playheadEl'] = playheadEl),
        (this['labelEl'] = labelEl),
        (this['thumbEls'] = thumbEls));
    },
    _isSourceReverseEditLocked() {
      const value66 = this['_reverseControl'];
      return Boolean(
        value66 &&
        (value66['pending'] === true || value66['isReversed'] !== value66['materializedIsReversed']),
      );
    },
    _renderSourceReverseControl() {
      const enabled13 = this['_reverseControl'],
        el66 = this['reverseBtnEl'],
        value67 = this['_isSourceReverseEditLocked']();
      this['barEl'] &&
        (this['barEl']['classList']['toggle']('is-reverse-locked', value67),
        this['barEl']['setAttribute']('aria-busy', String(enabled13?.['pending'] === true)));
      this['trackEl'] && this['trackEl']['setAttribute']('aria-disabled', String(value67));
      if (!enabled13 || !el66) return;
      const mediaClipReverseControlState = resolveMediaClipReverseControlState(enabled13),
        value68 = this['confirmBtnEl']?.['dataset']?.['loading'] === 'true';
      (el66['classList']['toggle']('is-active', mediaClipReverseControlState['isReversed']),
        el66['classList']['toggle']('is-loading', mediaClipReverseControlState['pending']),
        (el66['disabled'] = mediaClipReverseControlState['pending'] || value68),
        (el66['dataset']['tooltip'] = mediaClipReverseControlState['label']),
        (el66['title'] = mediaClipReverseControlState['label']),
        el66['setAttribute']('aria-label', mediaClipReverseControlState['label']),
        el66['setAttribute']('aria-pressed', mediaClipReverseControlState['ariaPressed']),
        el66['setAttribute']('aria-busy', mediaClipReverseControlState['ariaBusy']));
    },
    async _replaceSourceAfterReverse(options5 = {}) {
      const args3 = this['_sourceOptions'];
      if (!args3) throw new Error('当前裁剪视频源已失效');
      const sourceLocalPath = String(options5['sourceLocalPath'] || '')['trim'](),
        sourceUrl2 = localPathToUrl(sourceLocalPath) || String(options5['sourceUrl'] || '')['trim']();
      if (!sourceUrl2) throw new Error('倒放完成后未返回可用的视频源');
      const durationSec = Number(this['durationSec']) || 0,
        value69 = { startSec: this['startSec'], endSec: this['endSec'] },
        mirrorMediaClipRange2 = mirrorMediaClipRange({
          startSec: this['startSec'],
          endSec: this['endSec'],
          durationSec: durationSec,
        });
      ((this['startSec'] = mirrorMediaClipRange2['startSec']), (this['endSec'] = mirrorMediaClipRange2['endSec']));
      this['videoEl'] &&
        (this['_onLoadedMeta'] &&
          this['videoEl']['removeEventListener']('loadedmetadata', this['_onLoadedMeta']),
        this['_onDurationChange'] &&
          this['videoEl']['removeEventListener']('durationchange', this['_onDurationChange']));
      ((this['_onLoadedMeta'] = null),
        (this['_onDurationChange'] = null),
        (this['_sourceOptions'] = {
          ...args3,
          sourceLocalPath: sourceLocalPath,
          sourceUrl: sourceUrl2,
          durationSec: durationSec,
          ...(options5['posterUrl'] ? { posterUrl: String(options5['posterUrl'])['trim']() } : {}),
          sourceData: { ...(args3['sourceData'] || {}), localPath: sourceLocalPath, videoDuration: durationSec },
        }));
      try {
        await this['_syncDurationAndDefaults']();
      } catch (value70) {
        ((this['_sourceOptions'] = args3),
          (this['startSec'] = value69['startSec']),
          (this['endSec'] = value69['endSec']));
        if (this['active'])
          try {
            await this['_syncDurationAndDefaults']();
          } catch (value71) {}
        throw value70;
      }
      if (!this['active']) return false;
      const value72 = this['videoEl'] || this['_getVideoEl']();
      if (value72)
        try {
          value72['currentTime'] = this['startSec'];
        } catch (value73) {}
      return (this['_render'](), true);
    },
    async _toggleSourceReverse() {
      const isReversed2 = this['_reverseControl'];
      if (
        !this['active'] ||
        !isReversed2 ||
        isReversed2['pending'] === true ||
        this['confirmBtnEl']?.['dataset']?.['loading'] === 'true'
      )
        return false;
      const value74 = ++this['_reverseRequestToken'],
        value75 = {
          isReversed: isReversed2['isReversed'],
          materializedIsReversed: isReversed2['materializedIsReversed'],
        },
        value76 = !isReversed2['isReversed'];
      let enabled14 = false;
      (this['_pauseRangePlaybackForRangeEdit'](),
        (isReversed2['isReversed'] = value76),
        (isReversed2['pending'] = true),
        this['_render']());
      try {
        const response5 = await isReversed2['onChange'](value76);
        if (
          !this['active'] ||
          value74 !== this['_reverseRequestToken'] ||
          isReversed2 !== this['_reverseControl']
        )
          return false;
        enabled14 = true;
        const value77 =
            typeof response5?.['isReversed'] === 'boolean' ? response5['isReversed'] : value76,
          value78 =
            typeof response5?.['materializedIsReversed'] === 'boolean'
              ? response5['materializedIsReversed']
              : response5?.['ok'] === false
                ? value75['materializedIsReversed']
                : value77;
        isReversed2['isReversed'] = value77;
        if (response5?.['ok'] === false)
          return (
            (isReversed2['materializedIsReversed'] = value75['materializedIsReversed']),
            !response5?.['suppressToast'] &&
              response5?.['error'] &&
              window['showToast']?.(String(response5['error']), 'error'),
            false
          );
        if (value77 !== value78) return ((isReversed2['materializedIsReversed'] = value78), false);
        return (
          value78 !== value75['materializedIsReversed'] &&
            (await this['_replaceSourceAfterReverse'](response5)),
          (isReversed2['materializedIsReversed'] = value78),
          true
        );
      } catch (error3) {
        return (
          this['active'] &&
            value74 === this['_reverseRequestToken'] &&
            isReversed2 === this['_reverseControl'] &&
            (!enabled14 && (isReversed2['isReversed'] = value75['isReversed']),
            (isReversed2['materializedIsReversed'] = value75['materializedIsReversed']),
            window['showToast']?.(error3?.['message'] || '视频倒放失败，请重试。', 'error')),
          false
        );
      } finally {
        this['active'] &&
          value74 === this['_reverseRequestToken'] &&
          isReversed2 === this['_reverseControl'] &&
          ((isReversed2['pending'] = false), this['_render']());
      }
    },
    _bindEvents() {
      if (!this['barEl']) return;
      const videoClipSelectionBodyCursor = resolveVideoClipSelectionBodyCursor(this['_sourceOptions']?.['selectionBodyCursor']);
      if (this['selectionEl']) this['selectionEl']['style']['cursor'] = videoClipSelectionBodyCursor;
      (this['cancelBtnEl']?.['addEventListener']('click', (event18) => {
        (event18['stopPropagation'](), this['exit']());
      }),
        this['confirmBtnEl']?.['addEventListener']('click', (event19) => {
          (event19['stopPropagation'](), this['_confirm']());
        }),
        this['reverseBtnEl']?.['addEventListener']('click', (event20) => {
          (event20['stopPropagation'](), void this['_toggleSourceReverse']());
        }));
      const value79 = (event21) => {
        if (!this['trackEl'] || !this['active'] || this['_dragMode'] || this['_isSourceReverseEditLocked']())
          return;
        const value80 = event21['clientX'],
          box4 = this['selectionEl']['getBoundingClientRect'](),
          value81 = 20,
          value82 = Math['abs'](value80 - box4['left']) < value81,
          value83 = Math['abs'](value80 - box4['right']) < value81;
        if (value82)
          (this['leftHandleEl']['classList']['add']('hover-active'),
            this['rightHandleEl']['classList']['remove']('hover-active'),
            (this['selectionEl']['style']['cursor'] = 'var(--resize-ew-cursor)'));
        else
          value83
            ? (this['rightHandleEl']['classList']['add']('hover-active'),
              this['leftHandleEl']['classList']['remove']('hover-active'),
              (this['selectionEl']['style']['cursor'] = 'var(--resize-ew-cursor)'))
            : (this['leftHandleEl']['classList']['remove']('hover-active'),
              this['rightHandleEl']['classList']['remove']('hover-active'),
              (this['selectionEl']['style']['cursor'] = videoClipSelectionBodyCursor));
      };
      this['trackEl']?.['addEventListener']('pointermove', value79);
      const value84 = 30,
        handler14 = (value85) => (Number(value85 || 1) / value84) * 1,
        handler15 = () => {
          const count5 = this['durationSec'];
          if (!Number['isFinite'](count5) || count5 <= 0) return 0.1;
          return Math['min'](0.1, count5);
        },
        handler16 = (value86, value87, value88) =>
          Math['max'](value87, Math['min'](value88, value86)),
        handler17 = (value89) => {
          if (!this['trackEl'] || !this['active']) return;
          const count6 = this['durationSec'];
          if (!Number['isFinite'](count6) || count6 <= 0) return;
          const enabled15 = this['videoEl'] || this['_getVideoEl']();
          if (!enabled15) return;
          const box5 = this['trackEl']['getBoundingClientRect']();
          if (!box5['width']) return;
          const value90 = value89 - box5['left'],
            value91 = handler16(value90 / box5['width'], 0, 1),
            value92 = value91 * count6,
            value93 = Math['max'](0, count6 - 0.001),
            value94 = handler16(value92, 0, value93);
          (this['_pauseRangePlaybackForRangeEdit'](enabled15),
            (this['_pendingPlaybackStartSec'] = value94));
          try {
            enabled15['currentTime'] = value94;
          } catch (value95) {}
          this['_renderPlayhead']();
        },
        handler18 = () => {
          const enabled16 = this['videoEl'] || this['_getVideoEl']();
          if (!enabled16) return;
          if (!enabled16['paused']) return;
          const value96 = Number(enabled16['currentTime']) || 0;
          if (value96 >= this['startSec'] && value96 <= this['endSec']) return;
          try {
            enabled16['currentTime'] = this['startSec'];
          } catch (value97) {}
        },
        handler19 = (count7, value98) => {
          const count8 = this['durationSec'];
          if (!Number['isFinite'](count8) || count8 <= 0) return;
          const value99 = this['_pauseRangePlaybackForRangeEdit'](),
            value100 = handler14(value98) * (count7 >= 0 ? 1 : -1),
            value101 = handler15(),
            value102 = Math['max'](value101, this['endSec'] - this['startSec']);
          let count9 = this['startSec'] + value100,
            value103 = this['endSec'] + value100;
          count9 < 0 && ((count9 = 0), (value103 = value102));
          value103 > count8 &&
            ((value103 = count8), (count9 = Math['max'](0, count8 - value102)));
          ((this['startSec'] = count9), (this['endSec'] = value103));
          if (value99)
            try {
              value99['currentTime'] = count9;
            } catch (value104) {}
          else handler18();
          this['_render']();
        },
        handler20 = (count10) => {
          const count11 = this['durationSec'];
          if (!Number['isFinite'](count11) || count11 <= 0) return;
          const value105 = this['_pauseRangePlaybackForRangeEdit'](),
            value106 = handler14(1) * (count10 >= 0 ? 1 : -1),
            value107 = handler15(),
            value108 = Math['max'](0, this['endSec'] - value107);
          this['startSec'] = handler16(this['startSec'] + value106, 0, value108);
          if (value105)
            try {
              value105['currentTime'] = this['startSec'];
            } catch (value109) {}
          this['_render']();
        },
        handler21 = (count12) => {
          const count13 = this['durationSec'];
          if (!Number['isFinite'](count13) || count13 <= 0) return;
          const value110 = this['_pauseRangePlaybackForRangeEdit'](),
            value111 = handler14(1) * (count12 >= 0 ? 1 : -1),
            value112 = handler15(),
            value113 = Math['min'](count13, this['startSec'] + value112);
          this['endSec'] = handler16(this['endSec'] + value111, value113, count13);
          if (value110)
            try {
              value110['currentTime'] = this['endSec'];
            } catch (value114) {}
          this['_render']();
        },
        handler22 = (value115) => {
          const count14 = this['durationSec'];
          if (!Number['isFinite'](count14) || count14 <= 0) return;
          const enabled17 = this['videoEl'] || this['_getVideoEl']();
          if (!enabled17) return;
          this['_pauseRangePlaybackForRangeEdit'](enabled17);
          let value116 = Number(enabled17['currentTime']) || 0;
          value116 = handler16(value116, 0, count14);
          const value117 = handler15();
          if (value115 === 'in') {
            const value118 = Math['max'](0, this['endSec'] - value117);
            this['startSec'] = handler16(value116, 0, value118);
          } else {
            const value119 = Math['min'](count14, this['startSec'] + value117);
            this['endSec'] = handler16(value116, value119, count14);
          }
          this['_render']();
        },
        value120 = (event22) => {
          if (!this['trackEl'] || !this['active'] || this['_isSourceReverseEditLocked']()) return;
          const el67 = event22['target']['closest']('.v2-video-cliphandle'),
            value121 = !!event22['target']['closest']('.v2-video-clipselection'),
            box6 = this['trackEl']['getBoundingClientRect']();
          if (!box6['width']) return;
          const value122 = event22['clientX'],
            box7 = this['selectionEl']['getBoundingClientRect'](),
            value123 = 20,
            value124 = Math['abs'](value122 - box7['left']) < value123,
            value125 = Math['abs'](value122 - box7['right']) < value123;
          if (value124 || (el67 && el67['dataset']['handle'] === 'left'))
            ((this['_dragMode'] = 'left'), this['leftHandleEl']['classList']['add']('hover-active'));
          else {
            if (value125 || (el67 && el67['dataset']['handle'] === 'right'))
              ((this['_dragMode'] = 'right'), this['rightHandleEl']['classList']['add']('hover-active'));
            else value121 ? (this['_dragMode'] = 'move') : (this['_dragMode'] = 'scrub');
          }
          if (this['_dragMode'] === 'move') {
            const box8 = this['selectionEl']['getBoundingClientRect']();
            this['_dragOffsetPx'] = event22['clientX'] - box8['left'];
          } else this['_dragOffsetPx'] = 0;
          (event22['preventDefault'](), event22['stopPropagation']());
          const value126 = Number(event22['clientX'] || 0);
          let enabled18 = false;
          if (this['_dragMode'] === 'scrub') handler17(event22['clientX']);
          else {
            if (this['_dragMode'] !== 'move') this['_handleDragAtClientX'](event22['clientX']);
          }
          ((this['_onPointerMove'] = (event23) => {
            if (!this['active'] || !this['trackEl']) return;
            (event23['preventDefault'](), event23['stopPropagation']());
            const value127 = Number(event23['clientX'] || 0);
            if (this['_dragMode'] === 'scrub') {
              handler17(value127);
              return;
            }
            if (this['_dragMode'] === 'move') {
              if (!enabled18 && Math['abs'](value127 - value126) <= 2) return;
              enabled18 = true;
            }
            this['_handleDragAtClientX'](value127);
          }),
            (this['_onPointerUp'] = (event24) => {
              if (!this['active']) return;
              (event24['preventDefault'](), event24['stopPropagation']());
              const value128 = this['_dragMode'],
                shouldVideoClipSelectionPointerUpSeek2 = shouldVideoClipSelectionPointerUpSeek(value128, enabled18),
                value129 = Number['isFinite'](Number(event24['clientX']))
                  ? Number(event24['clientX'])
                  : value126;
              (window['removeEventListener']('pointermove', this['_onPointerMove'], true),
                window['removeEventListener']('pointerup', this['_onPointerUp'], true),
                (this['_dragMode'] = null),
                (this['_dragOffsetPx'] = 0),
                this['leftHandleEl']?.['classList']['remove']('hover-active'),
                this['rightHandleEl']?.['classList']['remove']('hover-active'),
                (this['_onPointerMove'] = null),
                (this['_onPointerUp'] = null));
              if (shouldVideoClipSelectionPointerUpSeek2) handler17(value129);
              else this['_render']();
            }),
            window['addEventListener']('pointermove', this['_onPointerMove'], true),
            window['addEventListener']('pointerup', this['_onPointerUp'], true));
        };
      (this['trackEl']?.['addEventListener']('pointerdown', value120),
        this['trackEl']?.['addEventListener'](
          'wheel',
          (event25) => {
            if (!this['active'] || this['_isSourceReverseEditLocked']()) return;
            (event25['preventDefault'](), event25['stopPropagation']());
            const value130 = Number(event25['deltaX']) || 0,
              value131 = Number(event25['deltaY']) || 0,
              enabled19 = Math['abs'](value130) > Math['abs'](value131) ? value130 : value131;
            if (!enabled19) return;
            const value132 = enabled19 > 0 ? 1 : -1;
            if (event25['ctrlKey'] || event25['metaKey']) handler20(value132);
            else {
              if (event25['altKey']) handler21(value132);
              else {
                const value133 = event25['shiftKey'] ? 10 : 1;
                handler19(value132, value133);
              }
            }
          },
          { passive: false },
        ),
        this['selectionEl']?.['addEventListener']('dblclick', (event26) => {
          if (!this['active'] || this['_isSourceReverseEditLocked']()) return;
          (event26['preventDefault'](), event26['stopPropagation']());
          const enabled20 = this['durationSec'];
          if (!enabled20 || !Number['isFinite'](enabled20) || enabled20 <= 0) return;
          const box9 = this['selectionEl']['getBoundingClientRect'](),
            value134 = event26['clientX'],
            value135 = 24;
          if (value134 - box9['left'] < value135 || box9['right'] - value134 < value135) return;
          const value136 = Math['min'](3, enabled20),
            value137 = (this['startSec'] + this['endSec']) / 2,
            value138 = Math['max'](0, Math['min'](enabled20 - value136, value137 - value136 / 2)),
            value139 = this['_pauseRangePlaybackForRangeEdit']();
          ((this['startSec'] = value138), (this['endSec'] = value138 + value136));
          if (value139 && value139['paused']) value139['currentTime'] = this['startSec'];
          this['_render']();
        }),
        (this['_onKeyDown'] = (event27) => {
          if (!this['active']) return;
          const value140 = event27['target'];
          if (
            value140?.['isContentEditable'] ||
            ['INPUT', 'TEXTAREA', 'SELECT']['includes'](String(value140?.['tagName'] || ''))
          )
            return;
          if (event27['key'] === 'Escape') {
            if (this['_sourceOptions']?.['embedded']) {
              this['_sourceOptions']?.['onEscape']?.();
              return;
            }
            (event27['preventDefault'](), this['exit']());
            return;
          }
          if (this['_isSourceReverseEditLocked']()) return;
          if (event27['key'] === ' ' || event27['code'] === 'Space') {
            this['_handlePlaybackShortcutKey'](event27);
            return;
          }
          if (event27['key'] === 'i' || event27['key'] === 'I') {
            (event27['preventDefault'](), handler22('in'));
            return;
          }
          if (event27['key'] === 'o' || event27['key'] === 'O') {
            (event27['preventDefault'](), handler22('out'));
            return;
          }
          if (event27['key'] === 'ArrowLeft' || event27['key'] === 'ArrowRight') {
            event27['preventDefault']();
            const value141 = event27['key'] === 'ArrowRight' ? 1 : -1;
            if (event27['ctrlKey'] || event27['metaKey']) {
              handler20(value141);
              return;
            }
            if (event27['altKey']) {
              handler21(value141);
              return;
            }
            const value142 = event27['shiftKey'] ? 10 : 1;
            handler19(value141, value142);
          }
        }),
        window['addEventListener']('keydown', this['_onKeyDown'], true),
        this['_onDocClick'] &&
          (document['removeEventListener']('pointerdown', this['_onDocClick'], true),
          (this['_onDocClick'] = null)),
        !this['_sourceOptions']?.['embedded'] &&
          ((this['_onDocClick'] = (event28) => {
            if (!this['active'] || !this['barEl']) return;
            if (this['barEl']['contains'](event28['target'])) return;
            this['exit']({ silent: true, reason: 'dismiss' });
          }),
          document['addEventListener']('pointerdown', this['_onDocClick'], true)));
    },
    _getVideoEl() {
      if (!this['wrapperEl']) return null;
      if (this['_sourceOptions'] && this['videoEl']) return this['videoEl'];
      const value143 = this['_resolveActiveVideoData']();
      return (
        (this['videoEl'] = resolveNodeVideoElement(this['wrapperEl'], value143?.['mainVideoIndex'])),
        this['videoEl']
      );
    },
    _getVideoElementSource(value144) {
      return String(
        value144?.['getAttribute']?.('src') || value144?.['currentSrc'] || value144?.['src'] || '',
      )['trim']();
    },
    _setClipMediaKeepAlive(el68, value145) {
      if (!el68?.['dataset']) return;
      if (value145) {
        el68['dataset']['desktopMediaKeepAlive'] = 'video-clip';
        return;
      }
      el68['dataset']['desktopMediaKeepAlive'] === 'video-clip' &&
        delete el68['dataset']['desktopMediaKeepAlive'];
    },
    _readDurationSec(enabled21) {
      if (!enabled21) return 0;
      const count15 = Number(enabled21['duration']);
      if (Number['isFinite'](count15) && count15 > 0) return count15;
      const list8 = enabled21['seekable'];
      if (list8 && list8['length']) {
        const count16 = Number(list8['end'](list8['length'] - 1));
        if (Number['isFinite'](count16) && count16 > 0) return count16;
      }
      return 0;
    },
    _resolveKnownDurationSec(value146) {
      const selectedVideoItem2 = pickSelectedVideoItem(value146),
        positiveNumber6 = pickPositiveNumber(
          selectedVideoItem2?.['videoDuration'],
          selectedVideoItem2?.['duration'],
          value146?.['videoDuration'],
          value146?.['duration'],
        );
      if (positiveNumber6 > 0) return positiveNumber6;
      const positiveNumber7 = pickPositiveNumber(
          selectedVideoItem2?.['videoFrameCount'],
          selectedVideoItem2?.['frameCount'],
          value146?.['videoFrameCount'],
          value146?.['frameCount'],
        ),
        positiveNumber8 = pickPositiveNumber(
          selectedVideoItem2?.['videoFps'],
          selectedVideoItem2?.['fps'],
          value146?.['videoFps'],
          value146?.['fps'],
        );
      return positiveNumber7 > 0 && positiveNumber8 > 0 ? positiveNumber7 / positiveNumber8 : 0;
    },
    _resolveActiveVideoData() {
      if (!this['_sourceOptions']) return appStore['getState']()['nodes']?.[this['nodeId']] || null;
      const box10 =
        this['_sourceOptions']['sourceData'] && typeof this['_sourceOptions']['sourceData'] === 'object'
          ? this['_sourceOptions']['sourceData']
          : {};
      return {
        ...box10,
        src: this['_sourceOptions']['sourceUrl'],
        videoUrl: this['_sourceOptions']['sourceUrl'],
        localPath: String(this['_sourceOptions']['sourceLocalPath'] || box10['localPath'] || ''),
        videoDuration: pickPositiveNumber(
          this['_sourceOptions']['durationSec'],
          box10['videoDuration'],
          box10['duration'],
        ),
        videoWidth: pickPositiveNumber(
          this['_sourceOptions']['videoWidth'],
          box10['videoWidth'],
          box10['width'],
        ),
        videoHeight: pickPositiveNumber(
          this['_sourceOptions']['videoHeight'],
          box10['videoHeight'],
          box10['height'],
        ),
        thumbUrl: String(
          this['_sourceOptions']['posterUrl'] || box10['thumbUrl'] || box10['posterUrl'] || '',
        ),
      };
    },
    _resolveActiveVideoSrc() {
      if (this['_sourceOptions'])
        return (
          localPathToUrl(this['_sourceOptions']['sourceLocalPath']) ||
          String(this['_sourceOptions']['sourceUrl'] || '')['trim']()
        );
      return this['_resolveVideoSrcFromNode'](this['_resolveActiveVideoData']());
    },
    _applyDurationSec(value147) {
      const count17 = Number(value147);
      if (!Number['isFinite'](count17) || count17 <= 0) return false;
      this['durationSec'] = count17;
      if (!(this['endSec'] > this['startSec'])) {
        const value148 = Math['min'](3, count17),
          value149 = Math['max'](0, (count17 - value148) / 2);
        return ((this['startSec'] = value149), (this['endSec'] = value149 + value148), true);
      }
      ((this['startSec'] = Math['max'](0, Math['min'](this['startSec'], count17))),
        (this['endSec'] = Math['max'](0, Math['min'](this['endSec'], count17))));
      if (this['endSec'] <= this['startSec']) {
        const value150 = Math['min'](3, count17);
        ((this['startSec'] = 0), (this['endSec'] = value150));
      }
      return true;
    },
    async _applyVideoMetaDurationFallback(value151, value152) {
      const enabled22 = String(value151 || '')['trim']();
      if (!enabled22) return;
      try {
        const fetchVideoMetaFromServer2 = await fetchVideoMetaFromServer(enabled22);
        if (!this['active'] || value152 !== this['_sourceToken']) return;
        const value153 =
            fetchVideoMetaFromServer2 && typeof fetchVideoMetaFromServer2 === 'object' && fetchVideoMetaFromServer2['data'] ? fetchVideoMetaFromServer2['data'] : fetchVideoMetaFromServer2,
          positiveNumber9 = pickPositiveNumber(
            value153?.['duration'],
            value153?.['videoDuration'],
            value153?.['format']?.['duration'],
            value153?.['stream']?.['duration'],
          );
        this['_applyDurationSec'](positiveNumber9) && (this['_render'](), this['_startPlayheadLoop']());
      } catch (value154) {}
    },
    async _syncDurationAndDefaults() {
      const value155 = this['_resolveActiveVideoData'](),
        value156 = this['_resolveActiveVideoSrc'](),
        value157 = String(value156 || '')['trim'](),
        value158 = ++this['_sourceToken'];
      this['videoEl'] = this['_getVideoEl']();
      this['_applyDurationSec'](this['_resolveKnownDurationSec'](value155)) && this['_render']();
      if (this['videoEl']) {
        const value159 = this['videoEl'],
          value160 = this['_sourceOptions'],
          shouldAssign = () =>
            this['active'] &&
            value158 === this['_sourceToken'] &&
            this['videoEl'] === value159 &&
            this['_sourceOptions'] === value160,
          value161 = String(this['videoEl']['dataset']?.['videoClipSourceUrl'] || '')['trim']();
        this['_setClipMediaKeepAlive'](this['videoEl'], true);
        try {
          this['videoEl']['pause']();
        } catch (value162) {}
        try {
          this['videoEl']['loop'] = false;
        } catch (value163) {}
        if (value157 && value161 !== value157) {
          await attachDesktopMediaPlaybackSource(this['videoEl'], value157, { shouldAssign: shouldAssign });
          if (!shouldAssign()) return;
          if (!this['_getVideoElementSource'](this['videoEl'])) {
            ((this['videoEl']['preload'] = 'metadata'), (this['videoEl']['src'] = value157));
            try {
              this['videoEl']['load']?.();
            } catch (value164) {}
          }
          this['videoEl']['dataset'] && (this['videoEl']['dataset']['videoClipSourceUrl'] = value157);
        }
      }
      const value165 = this['_readDurationSec'](this['videoEl']);
      if (this['_applyDurationSec'](value165)) this['_render']();
      else
        !(this['durationSec'] > 0) &&
          value157 &&
          void this['_applyVideoMetaDurationFallback'](value157, value158);
      (this['videoEl'] &&
        ((this['_onLoadedMeta'] = () => {
          if (!this['active']) return;
          const value166 = this['_readDurationSec'](this['videoEl']);
          (this['_applyDurationSec'](value166, this['videoEl']), this['_render']());
        }),
        (this['_onDurationChange'] = () => {
          if (!this['active']) return;
          const value167 = this['_readDurationSec'](this['videoEl']);
          (this['_applyDurationSec'](value167, this['videoEl']), this['_render']());
        }),
        this['videoEl']['addEventListener']('loadedmetadata', this['_onLoadedMeta'], { once: true }),
        this['videoEl']['addEventListener']('durationchange', this['_onDurationChange'])),
        this['_renderThumbs'](),
        this['_startPlayheadLoop']());
    },
    _startPlayheadLoop() {
      if (this['_playheadRaf']) cancelAnimationFrame(this['_playheadRaf']);
      const value168 = () => {
        if (!this['active']) return;
        (this['_renderPlayhead'](), (this['_playheadRaf'] = requestAnimationFrame(value168)));
      };
      this['_playheadRaf'] = requestAnimationFrame(value168);
    },
    _renderPlayhead() {
      if (!this['playheadEl'] || !this['trackEl']) return;
      const count18 = this['durationSec'];
      if (!Number['isFinite'](count18) || count18 <= 0) {
        this['playheadEl']['style']['display'] = 'none';
        return;
      }
      const enabled23 = this['videoEl'] || this['_getVideoEl']();
      if (!enabled23) {
        this['playheadEl']['style']['display'] = 'none';
        return;
      }
      let value169 = Number(enabled23['currentTime']) || 0;
      const value170 = Number(this['_pendingPlaybackStartSec']);
      enabled23['paused'] &&
        enabled23['seeking'] &&
        this['_pendingPlaybackStartSec'] !== null &&
        Number['isFinite'](value170) &&
        (value169 = value170);
      if (value169 < this['startSec'] || value169 > this['endSec']) {
        if (!enabled23['paused'] && !enabled23['seeking'] && this['_rangeLoopSeekPending'] !== true) {
          this['_rangeLoopSeekPending'] = true;
          try {
            enabled23['currentTime'] = this['startSec'];
          } catch (value171) {}
          value169 = this['startSec'];
        }
      } else !enabled23['seeking'] && (this['_rangeLoopSeekPending'] = false);
      const value172 = Math['max'](0, Math['min'](1, value169 / count18));
      ((this['playheadEl']['style']['display'] = 'block'),
        (this['playheadEl']['style']['left'] = value172 * 100 + '%'));
    },
    _handlePlaybackShortcutKey(event29) {
      if (!this['active'] || this['_isSourceReverseEditLocked']()) return false;
      if (!(event29?.['key'] === ' ' || event29?.['code'] === 'Space')) return false;
      (event29['preventDefault']?.(), event29['stopPropagation']?.());
      if (!event29['repeat']) void this['_togglePlayRange']();
      return true;
    },
    _pauseRangePlaybackForRangeEdit(enabled24 = this['videoEl'] || this['_getVideoEl']()) {
      ((this['_rangePlaybackSeq'] += 1),
        (this['_rangeLoopSeekPending'] = false),
        (this['_pendingPlaybackStartSec'] = null));
      if (!enabled24) return null;
      try {
        if (!enabled24['paused']) enabled24['pause']();
      } catch (value173) {}
      return enabled24;
    },
    async _togglePlayRange() {
      if (this['_isSourceReverseEditLocked']()) return false;
      const value174 = ++this['_rangePlaybackSeq'],
        enabled25 = this['_getVideoEl']();
      if (!enabled25) return false;
      await this['_ensureVideoPlaybackSource'](enabled25);
      if (!this['active'] || value174 !== this['_rangePlaybackSeq']) return false;
      let count19 = Number(this['durationSec']);
      if (!Number['isFinite'](count19) || count19 <= 0) {
        count19 = this['_readDurationSec'](enabled25);
        if (!Number['isFinite'](count19) || count19 <= 0) return false;
        if (this['_applyDurationSec'](count19)) this['_render']();
      }
      try {
        if (!enabled25['paused'])
          return (
            enabled25['pause'](),
            (this['_pendingPlaybackStartSec'] = null),
            this['_renderPlayhead'](),
            true
          );
      } catch (value175) {}
      const value176 = Math['max'](0, Math['min'](this['startSec'], count19)),
        value177 = Math['max'](value176, Math['min'](this['endSec'], count19));
      if (!(value177 > value176)) return false;
      const value178 = Number(enabled25['currentTime']) || 0,
        value179 = this['_pendingPlaybackStartSec'],
        value180 = Number(value179),
        value181 =
          value179 !== null &&
          value179 !== undefined &&
          Number['isFinite'](value180) &&
          value180 >= value176 &&
          value180 < value177,
        value182 = value181 ? value180 : value176;
      (value181 || value178 < value176 || value178 >= value177) &&
        (await this['_seekVideoForRangePlayback'](enabled25, value182));
      if (!this['active'] || value174 !== this['_rangePlaybackSeq']) return false;
      this['_pendingPlaybackStartSec'] === value179 && (this['_pendingPlaybackStartSec'] = null);
      const playVideoWithRecovery2 = await playVideoWithRecovery(enabled25, {
        label: 'video-clip:' + (this['nodeId'] || 'unknown') + ':range',
        ensureSrc: () => this['_ensureVideoPlaybackSource'](enabled25),
        minBufferAhead: 0.5,
        readyTimeoutMs: 500,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 500,
        shouldRecover: (el69) =>
          this['active'] === true &&
          this['videoEl'] === el69 &&
          el69?.['isConnected'] !== false &&
          !el69?.['paused'],
        shouldContinue: () =>
          this['active'] === true && value174 === this['_rangePlaybackSeq'] && this['videoEl'] === enabled25,
      });
      return (playVideoWithRecovery2 && ((this['_rangeLoopSeekPending'] = false), this['_renderPlayhead']()), playVideoWithRecovery2);
    },
    async _ensureVideoPlaybackSource(el70 = this['videoEl']) {
      if (!el70) return false;
      if (this['_getVideoElementSource'](el70)) {
        if (el70['preload'] !== 'auto') el70['preload'] = 'auto';
        return true;
      }
      const enabled26 = String(this['_resolveActiveVideoSrc']() || '')['trim']();
      if (!enabled26) return false;
      await attachDesktopMediaPlaybackSource(el70, enabled26, { preload: 'auto' });
      if (el70['dataset']) el70['dataset']['videoClipSourceUrl'] = enabled26;
      return !!this['_getVideoElementSource'](el70);
    },
    async _seekVideoForRangePlayback(enabled27, value183) {
      if (!enabled27) return false;
      const value184 = Math['max'](0, Number(value183) || 0),
        value185 = Number(enabled27['currentTime'] || 0);
      if (
        Math['abs'](value185 - value184) <= VIDEO_CLIP_SEEK_EPSILON_SEC &&
        Number(enabled27['readyState'] || 0) >= 2 &&
        !enabled27['seeking']
      )
        return true;
      this['_rangeLoopSeekPending'] = true;
      try {
        enabled27['currentTime'] = value184;
      } catch (value186) {}
      return (
        await this['_waitForRangePlaybackSeek'](enabled27),
        (this['_rangeLoopSeekPending'] = false),
        true
      );
    },
    _waitForRangePlaybackSeek(el71) {
      if (!el71 || (Number(el71['readyState'] || 0) >= 2 && !el71['seeking']))
        return Promise['resolve'](true);
      return new Promise((handler23) => {
        let value187 = false;
        const list9 = ['seeked', 'canplay', 'canplaythrough', 'loadeddata', 'timeupdate'],
          handler24 = () => {
            if (value187) return;
            ((value187 = true),
              clearTimeout(setTimeout2),
              list9['forEach']((value188) => el71['removeEventListener']?.(value188, value189)),
              el71['removeEventListener']?.('error', value189),
              el71['removeEventListener']?.('abort', value189),
              handler23(true));
          },
          value189 = () => {
            if (Number(el71['readyState'] || 0) >= 2 || !el71['seeking']) handler24();
          },
          setTimeout2 = setTimeout(handler24, VIDEO_CLIP_PLAY_SEEK_TIMEOUT_MS);
        (list9['forEach']((value190) => el71['addEventListener']?.(value190, value189)),
          el71['addEventListener']?.('error', value189),
          el71['addEventListener']?.('abort', value189));
      });
    },
    _resolveVideoSrcFromNode(value191) {
      return resolveVideoClipSourceUrl(value191);
    },
    async _renderThumbs() {
      const value192 = ++this['_thumbToken'],
        thumbs = Array['isArray'](this['thumbEls']) ? this['thumbEls'] : [];
      if (!thumbs['length']) return;
      const value193 = this['_resolveActiveVideoData'](),
        src3 = this['_resolveActiveVideoSrc'](),
        posterUrl = resolveCanvasVideoPosterUrl(value193),
        renderVideoTimelineThumbnails2 = await renderVideoTimelineThumbnails({
          src: src3,
          posterUrl: posterUrl,
          thumbs: thumbs,
          isCurrent: () => this['active'] && this['_thumbToken'] === value192,
        });
      if (!this['active'] || this['_thumbToken'] !== value192) return;
      (this['trackEl']?.['dataset'] && (this['trackEl']['dataset']['thumbnailState'] = renderVideoTimelineThumbnails2['source']),
        renderVideoTimelineThumbnails2['errors']['length'] >= 2 &&
          (renderVideoTimelineThumbnails2['source'] === 'poster' || renderVideoTimelineThumbnails2['source'] === 'empty') &&
          console['warn'](
            '[VideoClipController] timeline thumbnail extraction fell back:',
            renderVideoTimelineThumbnails2['errors']['map']((error4) => error4['message']),
          ));
    },
    _handleDragAtClientX(value194) {
      if (!this['trackEl'] || !this['active'] || this['_isSourceReverseEditLocked']()) return;
      const enabled28 = this['durationSec'];
      if (!enabled28 || !Number['isFinite'](enabled28) || enabled28 <= 0) {
        this['_render']();
        return;
      }
      const box11 = this['trackEl']['getBoundingClientRect']();
      if (!box11['width']) return;
      const value195 = value194 - box11['left'],
        value196 = Math['max'](0, Math['min'](1, value195 / box11['width'])),
        value197 = value196 * enabled28,
        value198 = Math['min'](0.1, enabled28),
        value199 = Math['max'](value198, this['endSec'] - this['startSec']),
        value200 =
          this['_dragMode'] === 'left' ||
          this['_dragMode'] === 'right' ||
          this['_dragMode'] === 'move' ||
          this['_dragMode'] === 'set'
            ? this['_pauseRangePlaybackForRangeEdit']()
            : null;
      if (this['_dragMode'] === 'left') {
        const value201 = Math['max'](0, Math['min'](value197, this['endSec'] - value198));
        this['startSec'] = value201;
        if (value200)
          try {
            value200['currentTime'] = value201;
          } catch (value202) {}
      } else {
        if (this['_dragMode'] === 'right') {
          const value203 = Math['max'](this['startSec'] + value198, Math['min'](enabled28, value197));
          this['endSec'] = value203;
        } else {
          if (this['_dragMode'] === 'move') {
            const value204 = this['selectionEl']['getBoundingClientRect']()['left'] - box11['left'],
              value205 = value194 - box11['left'] - this['_dragOffsetPx'],
              value206 = value205 - value204,
              value207 = (value206 / box11['width']) * enabled28,
              value208 = Math['max'](0, Math['min'](enabled28 - value199, this['startSec'] + value207));
            ((this['startSec'] = value208), (this['endSec'] = value208 + value199));
            if (value200)
              try {
                value200['currentTime'] = value208;
              } catch (value209) {}
          } else {
            if (this['_dragMode'] === 'set') {
              const value210 = Math['min'](3, enabled28),
                value211 = Math['max'](0, Math['min'](enabled28 - value210, value197 - value210 / 2));
              ((this['startSec'] = value211), (this['endSec'] = value211 + value210));
            }
          }
        }
      }
      this['_render']();
    },
    _render() {
      this['_renderSourceReverseControl']();
      if (
        !this['active'] ||
        !this['trackEl'] ||
        !this['selectionEl'] ||
        !this['leftHandleEl'] ||
        !this['rightHandleEl']
      )
        return;
      const sourceDurationSec = this['durationSec'],
        value212 = Number['isFinite'](sourceDurationSec) && sourceDurationSec > 0,
        startSec = value212 ? Math['max'](0, Math['min'](this['startSec'], sourceDurationSec)) : 0,
        endSec = value212 ? Math['max'](0, Math['min'](this['endSec'], sourceDurationSec)) : 0,
        durationSec2 = Math['max'](0, endSec - startSec);
      if (value212) {
        const value213 = (startSec / sourceDurationSec) * 100,
          value214 = (durationSec2 / sourceDurationSec) * 100;
        ((this['selectionEl']['style']['left'] = value213 + '%'),
          (this['selectionEl']['style']['width'] = value214 + '%'),
          (this['leftHandleEl']['style']['left'] = value213 + '%'),
          (this['rightHandleEl']['style']['left'] = value213 + value214 + '%'),
          this['labelEl'] &&
            ((this['labelEl']['textContent'] = durationSec2['toFixed'](2) + 's'),
            (this['labelEl']['style']['left'] = value213 + value214 / 2 + '%')));
      } else
        ((this['selectionEl']['style']['left'] = '0%'),
          (this['selectionEl']['style']['width'] = '0%'),
          (this['leftHandleEl']['style']['left'] = '0%'),
          (this['rightHandleEl']['style']['left'] = '0%'),
          this['labelEl'] &&
            ((this['labelEl']['textContent'] = videoClipText('controls.loading')),
            (this['labelEl']['style']['left'] = '50%')));
      this['_renderPlayhead']();
      if (this['confirmBtnEl']) {
        const enabled29 = value212 && durationSec2 >= 0.1 && !this['_isSourceReverseEditLocked']();
        ((this['confirmBtnEl']['disabled'] = !enabled29),
          (this['confirmBtnEl']['dataset']['disabled'] = enabled29 ? 'false' : 'true'),
          this['confirmBtnEl']['dataset']['loading'] !== 'true' &&
            (this['confirmBtnEl']['innerHTML'] =
              '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'));
      }
      if (value212 && typeof this['_sourceOptions']?.['onRangeChange'] === 'function')
        try {
          this['_sourceOptions']['onRangeChange']({
            startSec: startSec,
            endSec: endSec,
            durationSec: durationSec2,
            sourceDurationSec: sourceDurationSec,
            transient: Boolean(this['_dragMode']),
          });
        } catch (value215) {}
    },
    setSourceRange(value216, value217, { seek: seek = true } = {}) {
      if (!this['active'] || !this['_sourceOptions']) return false;
      const count20 = Number(this['durationSec']) || 0;
      if (count20 <= 0) return false;
      const value218 = Math['max'](0, Math['min'](count20, Number(value216) || 0)),
        value219 = Math['max'](value218, Math['min'](count20, Number(value217) || count20));
      ((this['startSec'] = value218), (this['endSec'] = value219));
      if (seek) {
        const value220 = this['videoEl'] || this['_getVideoEl']();
        if (value220) {
          this['_pauseRangePlaybackForRangeEdit'](value220);
          try {
            value220['currentTime'] = value218;
          } catch (value221) {}
        }
      }
      return (this['_render'](), true);
    },
    getSourceTimelineElements() {
      if (!this['active'] || !this['_sourceOptions']) return null;
      return {
        barEl: this['barEl'],
        trackEl: this['trackEl'],
        playheadEl: this['playheadEl'],
        selectionEl: this['selectionEl'],
      };
    },
    async _confirm() {
      if (!this['confirmBtnEl']) return;
      const el72 = this['confirmBtnEl'];
      if (el72['dataset']['disabled'] === 'true') return;
      if (this['_isSourceReverseEditLocked']()) return;
      const value222 = this['_clipSessionToken'],
        value223 = this['_sourceOptions'],
        value224 = appStore['getState']()['nodes'],
        name = value223 ? this['_resolveActiveVideoData']() : value224[this['anchorNodeId']];
      if (!name) {
        this['exit']({ silent: true });
        return;
      }
      const enabled30 = this['durationSec'];
      if (!enabled30 || !Number['isFinite'](enabled30) || enabled30 <= 0) return;
      const startSec2 = Math['max'](0, Math['min'](this['startSec'], enabled30)),
        endSec2 = Math['max'](0, Math['min'](this['endSec'], enabled30));
      if (!(endSec2 > startSec2)) return;
      const src4 = value223
        ? this['_resolveActiveVideoSrc']()
        : localPathToUrl(name['localPath']) ||
          name['src'] ||
          name['videoUrl'] ||
          name['resultUrl'] ||
          '';
      if (!src4) return;
      ((el72['dataset']['disabled'] = 'true'),
        (el72['dataset']['loading'] = 'true'),
        (el72['innerHTML'] =
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>'),
        window['showToast']?.(videoClipText('cut.processing'), 'info'),
        this['_renderSourceReverseControl']());
      try {
        const local = await cutVideoRangeToLocal({
            src: src4,
            startSec: startSec2,
            endSec: endSec2,
            nodeId: this['anchorNodeId'],
          }),
          data2 = local['data'];
        if (value222 !== this['_clipSessionToken'] || value223 !== this['_sourceOptions']) return;
        const result2 = local['result'],
          cutLocalPath = local['localPath'];
        if (value223) {
          typeof value223['onConfirm'] === 'function' &&
            (await value223['onConfirm']({
              startSec: startSec2,
              endSec: endSec2,
              durationSec: endSec2 - startSec2,
              sourceUrl: src4,
              sourceLocalPath: String(value223['sourceLocalPath'] || ''),
              cutLocalPath: cutLocalPath,
              videoUrl: localPathToUrl(cutLocalPath),
              ...(this['_reverseControl']
                ? {
                    isReversed: this['_reverseControl']['isReversed'],
                    materializedIsReversed: this['_reverseControl']['materializedIsReversed'],
                  }
                : {}),
              fps: pickPositiveNumber(result2?.['fps'], data2?.['fps']),
              data: data2,
              result: result2,
            }));
          if (value222 !== this['_clipSessionToken'] || value223 !== this['_sourceOptions']) return;
          (window['showToast']?.(videoClipText('cut.success'), 'success'),
            this['exit']({ silent: true, reason: 'confirm' }));
          return;
        }
        const { width: width2, height: height } = getAutoMediaSizeByShortSide(
            name['width'] || 512,
            name['height'] || 288,
          ),
          x3 = calcSafeSpawnPosNearNode(
            appStore['getState']()['nodes'],
            name,
            width2,
            height,
          ),
          id2 = generateId('source-video-cut'),
          positiveNumber10 = pickPositiveNumber(result2?.['fps'], data2?.['fps']),
          args4 = buildVideoCutNodeMeta(name, startSec2, endSec2, positiveNumber10),
          args5 = buildVideoCutNodePlaybackFields(cutLocalPath);
        (appStore['addNode'](
          buildSourceMediaNodePayload({
            id: id2,
            type: 'source-video',
            x: x3['x'],
            y: x3['y'],
            width: width2,
            height: height,
            name: videoClipText('cut.newNodeName', {
              name: name['name'] || videoClipText('cut.videoFallback'),
            }),
            ...args5,
            ...args4,
            needsAutoResize: false,
            fixedSize: true,
          }),
        ),
          appStore['setSelectedNodes']([id2]),
          commit(),
          ensureVideoCutNodeThumb(id2, cutLocalPath),
          window['_triggerLocalCacheSave']?.(),
          window['showToast']?.(videoClipText('cut.success'), 'success'),
          this['exit']({ silent: true, reason: 'confirm' }));
      } catch (error5) {
        if (value222 !== this['_clipSessionToken'] || value223 !== this['_sourceOptions']) return;
        const error6 =
          error5 instanceof Error
            ? error5['message']
            : String(error5 || videoClipText('errors.cutFailed'));
        (window['showToast']?.(videoClipText('cut.failedWithError', { error: error6 }), 'error'),
          (el72['dataset']['loading'] = 'false'),
          this['_render'](),
          (el72['dataset']['loading'] = 'false'));
      }
      el72['dataset']['loading'] = 'false';
    },
    exit({ silent: silent = false, reason: reason = '' } = {}) {
      if (!this['active']) return;
      const enabled31 = this['_sourceOptions'],
        args6 = this['_reverseControl']
          ? {
              isReversed: this['_reverseControl']['isReversed'],
              materializedIsReversed: this['_reverseControl']['materializedIsReversed'],
            }
          : null,
        reason3 = String(reason || (silent ? 'silent' : 'cancel'));
      ((this['active'] = false),
        this['_thumbToken']++,
        this['_sourceToken']++,
        this['_reverseRequestToken']++,
        this['_clipSessionToken']++,
        (this['_rangeLoopSeekPending'] = false),
        (this['_rangePlaybackSeq'] += 1),
        (this['_pendingPlaybackStartSec'] = null));
      !enabled31?.['embedded'] && appStore['setVideoClipState']({ active: false, nodeId: null });
      if (this['_playheadRaf']) cancelAnimationFrame(this['_playheadRaf']);
      this['_playheadRaf'] = 0;
      if (this['_retryRaf']) cancelAnimationFrame(this['_retryRaf']);
      this['_retryRaf'] = 0;
      if (this['videoEl']) {
        this['_setClipMediaKeepAlive'](this['videoEl'], false);
        if (this['_onLoadedMeta'])
          this['videoEl']['removeEventListener']('loadedmetadata', this['_onLoadedMeta']);
        if (this['_onDurationChange'])
          this['videoEl']['removeEventListener']('durationchange', this['_onDurationChange']);
      }
      this['_onKeyDown'] &&
        (window['removeEventListener']('keydown', this['_onKeyDown'], true), (this['_onKeyDown'] = null));
      this['_onSmartClipDocDown'] &&
        (document['removeEventListener']('pointerdown', this['_onSmartClipDocDown'], true),
        (this['_onSmartClipDocDown'] = null));
      this['_smartClipMaxSegmentDrag'] &&
        (this['_smartClipMaxSegmentDrag']['el']?.['classList']?.['remove']('is-dragging'),
        this['_smartClipMaxSegmentDrag']['doc']?.['removeEventListener']?.(
          'mousemove',
          this['_onSmartClipMaxSegmentDragMove'],
        ),
        this['_smartClipMaxSegmentDrag']['doc']?.['removeEventListener']?.(
          'mouseup',
          this['_onSmartClipMaxSegmentDragUp'],
        ),
        (this['_smartClipMaxSegmentDrag'] = null));
      ((this['_onSmartClipMaxSegmentDragMove'] = null),
        (this['_onSmartClipMaxSegmentDragUp'] = null),
        (this['_suppressSmartClipMaxSegmentClick'] = false));
      if (this['_onPointerMove']) window['removeEventListener']('pointermove', this['_onPointerMove'], true);
      if (this['_onPointerUp']) window['removeEventListener']('pointerup', this['_onPointerUp'], true);
      ((this['_onLoadedMeta'] = null),
        (this['_onDurationChange'] = null),
        (this['_onPointerMove'] = null),
        (this['_onPointerUp'] = null),
        (this['_dragMode'] = null),
        (this['_dragOffsetPx'] = 0));
      this['_onDocClick'] &&
        (document['removeEventListener']('pointerdown', this['_onDocClick'], true),
        (this['_onDocClick'] = null));
      ((this['durationSec'] = 0),
        (this['startSec'] = 0),
        (this['endSec'] = 0),
        (this['nodeId'] = null),
        (this['anchorNodeId'] = null),
        (this['_sourceOptions'] = null),
        (this['_reverseControl'] = null),
        (this['videoEl'] = null),
        (this['trackEl'] = null),
        (this['selectionEl'] = null),
        (this['leftHandleEl'] = null),
        (this['rightHandleEl'] = null),
        (this['playheadEl'] = null),
        (this['labelEl'] = null),
        (this['cancelBtnEl'] = null),
        (this['reverseBtnEl'] = null),
        (this['confirmBtnEl'] = null),
        (this['thumbEls'] = null));
      this['_msgInterval'] && (clearInterval(this['_msgInterval']), (this['_msgInterval'] = null));
      ((this['_msgEls'] = null), this['_applyFrozenUI'](false), this['_applyDimMode'](false));
      if (this['barEl']) this['barEl']['remove']();
      ((this['barEl'] = null), (this['wrapperEl'] = null));
      if (!silent) window['showToast']?.(videoClipText('cut.cancelled'), 'info');
      try {
        enabled31?.['onExit']?.({ reason: reason3, ...args6 });
      } catch (value225) {}
    },
  },
  VIDEO_CLIP_CONTROLLER_METHOD_KEYS = new Set(
    Object['entries'](VideoClipController)
      ['filter'](([, value226]) => typeof value226 === 'function')
      ['map'](([value227]) => value227),
  ),
  VIDEO_CLIP_CONTROLLER_INITIAL_STATE = Object['freeze'](
    Object['fromEntries'](
      Object['entries'](VideoClipController)['filter'](
        ([value228]) => !VIDEO_CLIP_CONTROLLER_METHOD_KEYS['has'](value228),
      ),
    ),
  );
export default VideoClipController;
export function createVideoClipController() {
  const value229 = Object['create'](VideoClipController);
  for (const value230 of Object['keys'](VideoClipController)) {
    if (VIDEO_CLIP_CONTROLLER_METHOD_KEYS['has'](value230)) continue;
    const args7 = Object['hasOwn'](VIDEO_CLIP_CONTROLLER_INITIAL_STATE, value230)
      ? VIDEO_CLIP_CONTROLLER_INITIAL_STATE[value230]
      : undefined;
    value229[value230] = Array['isArray'](args7)
      ? [...args7]
      : args7 && typeof args7 === 'object'
        ? { ...args7 }
        : args7;
  }
  return value229;
}

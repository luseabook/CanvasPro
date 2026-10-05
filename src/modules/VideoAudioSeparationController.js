import { separateVideoAudio } from '../../api/videoAudioSeparationApi.js';
import { findAvailablePosition, generateId } from '../core/math.js';
import { t } from '../i18n/index.js';
import appStore from '../core/stores/appStore.js';
import { resolveCanvasVideoLocalPath } from '../services/canvasMediaLocalService.js';
import {
  buildSourceAudioNodePayload,
  buildSourceMediaNodePayload,
  getAutoMediaSizeByShortSide,
  getNodeDefaultSize,
} from '../services/fileService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import { buildLocalAudioGenerationResultPatch } from '../components/audio-node/audioGenerationResultRenderer.js';
import { buildVideoGenerationResultPatch } from '../components/video-node/videoGenerationResultRenderer.js';
import { commit } from './history.js';
import { getNodeSpawnPrefs } from './nodeSpawn.js';
let _separateVideoAudioImpl = separateVideoAudio;
function videoAudioSeparationText(value, item = {}) {
  return t('mediaProcessing.videoAudioSeparation.' + value, item);
}
function _getState() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function _getNode(key) {
  return _getState().nodes?.[key] || null;
}
function _isVideoNodeType(index) {
  const result = String(index || '')
    .trim()
    .toLowerCase();
  return result === 'source-video' || result === 'ai-video' || result === 'video';
}
function _cleanLocalPath(data) {
  return normalizeLocalPath(data);
}
function _resolveSourcePath(options) {
  return _cleanLocalPath(resolveCanvasVideoLocalPath(options));
}
function _getResultLocalPath(target) {
  return pickResultLocalPath(target);
}
function _fileNameFromPath(source) {
  const _cleanLocalPath2 = _cleanLocalPath(source);
  if (!_cleanLocalPath2) return '';
  const list = _cleanLocalPath2.split('/');
  return String(list[list.length - 1] || '').trim();
}
function _getSpawnLayout(box) {
  const { spacing: spacing, direction: direction, avoidOverlap: avoidOverlap } = getNodeSpawnPrefs(),
    audio = direction === 'down' ? 'down' : 'right',
    next = Math.max(24, Math.min(80, Math.round(Number(spacing || 0) / 2))),
    width = getAutoMediaSizeByShortSide(Number(box?.width) || 512, Number(box?.height) || 288),
    width2 = getNodeDefaultSize('source-audio'),
    current = Number(box?.x) || 0,
    entry = Number(box?.y) || 0,
    record = Number(box?.width) || 512,
    payload = Number(box?.height) || 288;
  let x =
      audio === 'right'
        ? current + record + spacing
        : current + Math.round((record - Math.max(width.width, width2.width)) / 2),
    y =
      audio === 'down'
        ? entry + payload + spacing
        : entry + Math.round((payload - Math.max(width.height, width2.height)) / 2);
  const handle = audio === 'right' ? width.width + width2.width + next : Math.max(width.width, width2.width),
    state = audio === 'down' ? width.height + width2.height + next : Math.max(width.height, width2.height);
  if (avoidOverlap) {
    const box2 = findAvailablePosition(_getState().nodes || {}, x, y, handle, state, spacing, audio);
    ((x = box2.x), (y = box2.y));
  }
  return {
    video: { x: x, y: y, width: width.width, height: width.height },
    audio:
      audio === 'right'
        ? {
            x: x + width.width + next,
            y: y + Math.round((width.height - width2.height) / 2),
            width: width2.width,
            height: width2.height,
          }
        : {
            x: x + Math.round((width.width - width2.width) / 2),
            y: y + width.height + next,
            width: width2.width,
            height: width2.height,
          },
  };
}
function _focusCreatedNodes(config, list2) {
  const list3 = Array.isArray(list2) ? list2.map((item2) => String(item2 || '').trim()).filter(Boolean) : [];
  if (!list3.length) return;
  appStore.setSelectedNodes(list3);
  if (typeof window.v2FocusOnNodes === 'function') window.v2FocusOnNodes([config, ...list3]);
  else typeof window.v2FocusOnNode === 'function' && window.v2FocusOnNode(list3[0]);
}
function _persistLocalCache() {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
}
function _createResultNodes(error, videoUrl) {
  const localPath = _getResultLocalPath(videoUrl?.video),
    localPath2 = _getResultLocalPath(videoUrl?.audio);
  if (!localPath || !localPath2) throw new Error(videoAudioSeparationText('incompleteResult'));
  const x2 = _getSpawnLayout(error),
    name = String(error?.name || '').trim() || videoAudioSeparationText('videoFallback'),
    id = generateId('source-video-separate-av'),
    id2 = generateId('source-audio-separate-av'),
    fileName = videoUrl?.video?.filename || _fileNameFromPath(localPath),
    fileName2 = videoUrl?.audio?.filename || _fileNameFromPath(localPath2),
    args =
      buildVideoGenerationResultPatch({
        localPath: localPath,
        videoUrl: videoUrl?.video?.url,
        fileName: fileName,
      }) || {},
    args2 =
      buildLocalAudioGenerationResultPatch({
        localPath: localPath2,
        audioUrl: videoUrl?.audio?.url,
        fileName: fileName2,
      }) || {},
    sourceMediaNodePayload = buildSourceMediaNodePayload({
      id: id,
      type: 'source-video',
      x: x2.video.x,
      y: x2.video.y,
      width: x2.video.width,
      height: x2.video.height,
      name: videoAudioSeparationText('videoNodeName', { name: name }),
      ...args,
      src: localPathToUrl(args.localPath) || args.videoUrl || '',
      fileName: fileName,
      needsAutoResize: false,
      fixedSize: true,
    }),
    sourceAudioNodePayload = buildSourceAudioNodePayload({
      id: id2,
      x: x2.audio.x,
      y: x2.audio.y,
      width: x2.audio.width,
      height: x2.audio.height,
      name: videoAudioSeparationText('audioNodeName', { name: name }),
      ...args2,
      fileName: fileName2,
    });
  return (
    typeof appStore.batch === 'function'
      ? appStore.batch(() => {
          (appStore.addNode(sourceMediaNodePayload), appStore.addNode(sourceAudioNodePayload));
        })
      : (appStore.addNode(sourceMediaNodePayload), appStore.addNode(sourceAudioNodePayload)),
    { videoId: id, audioId: id2 }
  );
}
export async function runVideoAudioSeparationFromNode(scope) {
  const _getNode2 = _getNode(scope);
  if (!_getNode2 || !_isVideoNodeType(_getNode2.type))
    return (window.showToast?.(videoAudioSeparationText('unsupportedNode'), 'warn'), null);
  if (_getNode2.isGenerating) return (window.showToast?.(videoAudioSeparationText('busy'), 'info'), null);
  const src = _resolveSourcePath(_getNode2);
  if (!src) return (window.showToast?.(videoAudioSeparationText('notLocalFile'), 'warn'), null);
  window.showToast?.(videoAudioSeparationText('progress'), 'info');
  try {
    const _separateVideoAudioImpl2 = await _separateVideoAudioImpl({ src: src }),
      { videoId: videoId, audioId: audioId } = _createResultNodes(_getNode2, _separateVideoAudioImpl2);
    return (
      _focusCreatedNodes(_getNode2.id, [videoId, audioId]),
      commit(),
      _persistLocalCache(),
      window.showToast?.(videoAudioSeparationText('success'), 'success'),
      { videoId: videoId, audioId: audioId }
    );
  } catch (error2) {
    const message =
      error2 instanceof Error ? error2.message : String(error2 || videoAudioSeparationText('fallback'));
    return (
      window.showToast?.(videoAudioSeparationText('failedWithMessage', { message: message }), 'error'),
      null
    );
  }
}
export function __setVideoAudioSeparationDepsForTest({
  separateVideoAudioImpl: separateVideoAudioImpl,
} = {}) {
  _separateVideoAudioImpl =
    typeof separateVideoAudioImpl === 'function' ? separateVideoAudioImpl : separateVideoAudio;
}
export function __resetVideoAudioSeparationDepsForTest() {
  _separateVideoAudioImpl = separateVideoAudio;
}

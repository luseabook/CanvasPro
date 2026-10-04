import { reverseVideo } from '../../api/videoReverseApi.js';
import { generateId } from '../core/math.js';
import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import {
  buildCanvasLocalVideoFields,
  resolveCanvasVideoLocalPath,
} from '../services/canvasMediaLocalService.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
import { buildVideoGenerationResultPatch } from '../components/video-node/videoGenerationResultRenderer.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
let _reverseVideoImpl = reverseVideo;
function videoReverseText(value, item = {}) {
  return t('videoReverse.' + value, item);
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
function _pickMainVideoItem(options) {
  const target = Array.isArray(options?.videos) ? options.videos : [],
    source = Number.isFinite(Number(options?.mainVideoIndex))
      ? Math.max(0, Math.trunc(Number(options.mainVideoIndex)))
      : 0;
  return target[source] || target[0] || null;
}
function _resolveSourcePath(next) {
  const _pickMainVideoItem2 = _pickMainVideoItem(next);
  return _cleanLocalPath(
    resolveCanvasVideoLocalPath(_pickMainVideoItem2) || resolveCanvasVideoLocalPath(next),
  );
}
function _getResultLocalPath(current) {
  return pickResultLocalPath(current);
}
function _fileNameFromPath(entry) {
  const _cleanLocalPath2 = _cleanLocalPath(entry);
  if (!_cleanLocalPath2) return '';
  const list = _cleanLocalPath2.split('/');
  return String(list[list.length - 1] || '').trim();
}
function _focusCreatedNode(record, payload) {
  const enabled = String(payload || '').trim();
  if (!enabled) return;
  appStore.setSelectedNodes([enabled]);
  if (typeof window.v2FocusOnNodes === 'function') window.v2FocusOnNodes([record, enabled]);
  else typeof window.v2FocusOnNode === 'function' && window.v2FocusOnNode(enabled);
}
function _persistLocalCache() {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
}
function _createResultNode(box, videoUrl) {
  const localPath = _getResultLocalPath(videoUrl);
  if (!localPath) throw new Error(videoReverseText('errors.incompleteResult'));
  const handle = Number(box?.width) || Number(videoUrl?.videoWidth) || 0x200,
    state = Number(box?.height) || Number(videoUrl?.videoHeight) || 0x120,
    { width: width, height: height } = getAutoMediaSizeByShortSide(handle, state),
    { x: x, y: y } = calcSafeSpawnPosNearNode(_getState().nodes || {}, box, width, height),
    name = String(box?.name || '').trim() || videoReverseText('fallback.video'),
    id = generateId('source-video-reverse'),
    fileName = videoUrl?.filename || _fileNameFromPath(localPath),
    args = buildCanvasLocalVideoFields({
      localPath: localPath,
      videoUrl: videoUrl?.url,
      videoWidth: Number(videoUrl?.videoWidth || 0) || 0,
      videoHeight: Number(videoUrl?.videoHeight || 0) || 0,
      videoDuration: Number(videoUrl?.videoDuration || 0) || 0,
      videoFps: Number(videoUrl?.fps || 0) || 0,
    }),
    args2 =
      buildVideoGenerationResultPatch({
        localPath: localPath,
        videoUrl: videoUrl?.url,
        fileName: fileName,
        videoWidth: Number(videoUrl?.videoWidth || 0) || 0,
        videoHeight: Number(videoUrl?.videoHeight || 0) || 0,
        videoDuration: Number(videoUrl?.videoDuration || 0) || 0,
        fps: Number(videoUrl?.fps || 0) || 0,
      }) || {},
    sourceMediaNodePayload = buildSourceMediaNodePayload({
      id: id,
      type: 'source-video',
      x: x,
      y: y,
      width: width,
      height: height,
      name: videoReverseText('output.nodeName', { name: name }),
      ...args2,
      ...args,
      src: localPathToUrl(localPath) || videoUrl?.url || '',
      fileName: fileName,
      videoWidth: Number(videoUrl?.videoWidth || 0) || 0,
      videoHeight: Number(videoUrl?.videoHeight || 0) || 0,
      videoDuration: Number(videoUrl?.videoDuration || 0) || 0,
      videoFps: Number(videoUrl?.fps || 0) || 0,
      needsAutoResize: false,
      fixedSize: true,
    });
  return (appStore.addNode(sourceMediaNodePayload), id);
}
export async function runVideoReverseFromNode(config) {
  const nodeId = _getNode(config);
  if (!nodeId || !_isVideoNodeType(nodeId.type))
    return (window.showToast?.(videoReverseText('toasts.unsupportedNode'), 'warn'), null);
  if (nodeId.isGenerating) return (window.showToast?.(videoReverseText('toasts.videoBusy'), 'info'), null);
  const src = _resolveSourcePath(nodeId);
  if (!src) return (window.showToast?.(videoReverseText('toasts.notLocalFile'), 'warn'), null);
  window.showToast?.(videoReverseText('toasts.running'), 'info');
  try {
    const _reverseVideoImpl2 = await _reverseVideoImpl({ src: src, nodeId: nodeId.id }),
      videoId = _createResultNode(nodeId, _reverseVideoImpl2);
    return (
      _focusCreatedNode(nodeId.id, videoId),
      commit(),
      _persistLocalCache(),
      window.showToast?.(videoReverseText('toasts.completed'), 'success'),
      { videoId: videoId }
    );
  } catch (error) {
    const error2 =
      error instanceof Error ? error.message : String(error || videoReverseText('toasts.failed'));
    return (window.showToast?.(videoReverseText('toasts.failedWithError', { error: error2 }), 'error'), null);
  }
}
export function __setVideoReverseDepsForTest({ reverseVideoImpl: reverseVideoImpl } = {}) {
  _reverseVideoImpl = typeof reverseVideoImpl === 'function' ? reverseVideoImpl : reverseVideo;
}
export function __resetVideoReverseDepsForTest() {
  _reverseVideoImpl = reverseVideo;
}

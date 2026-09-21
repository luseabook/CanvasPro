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
function videoReverseText(_0xeb87fa, _0x38405f = {}) {
  return t('videoReverse.' + _0xeb87fa, _0x38405f);
}
function _getState() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function _getNode(_0x583bd7) {
  return _getState().nodes?.[_0x583bd7] || null;
}
function _isVideoNodeType(_0x35a511) {
  const _0x223d35 = String(_0x35a511 || '')
    .trim()
    .toLowerCase();
  return _0x223d35 === 'source-video' || _0x223d35 === 'ai-video' || _0x223d35 === 'video';
}
function _cleanLocalPath(_0x5eb22e) {
  return normalizeLocalPath(_0x5eb22e);
}
function _pickMainVideoItem(_0x4121f5) {
  const _0x25f96a = Array.isArray(_0x4121f5?.videos) ? _0x4121f5.videos : [],
    _0x18b938 = Number.isFinite(Number(_0x4121f5?.mainVideoIndex))
      ? Math.max(0, Math.trunc(Number(_0x4121f5.mainVideoIndex)))
      : 0;
  return _0x25f96a[_0x18b938] || _0x25f96a[0] || null;
}
function _resolveSourcePath(_0x4801f1) {
  const _0x5f1026 = _pickMainVideoItem(_0x4801f1);
  return _cleanLocalPath(resolveCanvasVideoLocalPath(_0x5f1026) || resolveCanvasVideoLocalPath(_0x4801f1));
}
function _getResultLocalPath(_0x282ce7) {
  return pickResultLocalPath(_0x282ce7);
}
function _fileNameFromPath(_0x4a246c) {
  const _0x5322bd = _cleanLocalPath(_0x4a246c);
  if (!_0x5322bd) return '';
  const _0x18fb44 = _0x5322bd.split('/');
  return String(_0x18fb44[_0x18fb44.length - 1] || '').trim();
}
function _focusCreatedNode(_0x167184, _0x4798fa) {
  const _0x48d705 = String(_0x4798fa || '').trim();
  if (!_0x48d705) return;
  appStore.setSelectedNodes([_0x48d705]);
  if (typeof window.v2FocusOnNodes === 'function') window.v2FocusOnNodes([_0x167184, _0x48d705]);
  else typeof window.v2FocusOnNode === 'function' && window.v2FocusOnNode(_0x48d705);
}
function _persistLocalCache() {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
}
function _createResultNode(_0x17356f, _0x21a6a3) {
  const _0x2da20a = _getResultLocalPath(_0x21a6a3);
  if (!_0x2da20a) throw new Error(videoReverseText('errors.incompleteResult'));
  const _0x5aac1a = Number(_0x17356f?.width) || Number(_0x21a6a3?.videoWidth) || 0x200,
    _0x4b43dd = Number(_0x17356f?.height) || Number(_0x21a6a3?.videoHeight) || 0x120,
    { width: _0x2dba1f, height: _0x1f449d } = getAutoMediaSizeByShortSide(_0x5aac1a, _0x4b43dd),
    { x: _0x2fd0e4, y: _0x53dbad } = calcSafeSpawnPosNearNode(
      _getState().nodes || {},
      _0x17356f,
      _0x2dba1f,
      _0x1f449d,
    ),
    _0x4aa1cf = String(_0x17356f?.name || '').trim() || videoReverseText('fallback.video'),
    _0xe0e74c = generateId('source-video-reverse'),
    _0x4a8f2d = _0x21a6a3?.filename || _fileNameFromPath(_0x2da20a),
    _0x2f0d94 = buildCanvasLocalVideoFields({
      localPath: _0x2da20a,
      videoUrl: _0x21a6a3?.url,
      videoWidth: Number(_0x21a6a3?.videoWidth || 0) || 0,
      videoHeight: Number(_0x21a6a3?.videoHeight || 0) || 0,
      videoDuration: Number(_0x21a6a3?.videoDuration || 0) || 0,
      videoFps: Number(_0x21a6a3?.fps || 0) || 0,
    }),
    _0x419289 =
      buildVideoGenerationResultPatch({
        localPath: _0x2da20a,
        videoUrl: _0x21a6a3?.url,
        fileName: _0x4a8f2d,
        videoWidth: Number(_0x21a6a3?.videoWidth || 0) || 0,
        videoHeight: Number(_0x21a6a3?.videoHeight || 0) || 0,
        videoDuration: Number(_0x21a6a3?.videoDuration || 0) || 0,
        fps: Number(_0x21a6a3?.fps || 0) || 0,
      }) || {},
    _0x720fab = buildSourceMediaNodePayload({
      id: _0xe0e74c,
      type: 'source-video',
      x: _0x2fd0e4,
      y: _0x53dbad,
      width: _0x2dba1f,
      height: _0x1f449d,
      name: videoReverseText('output.nodeName', { name: _0x4aa1cf }),
      ..._0x419289,
      ..._0x2f0d94,
      src: localPathToUrl(_0x2da20a) || _0x21a6a3?.url || '',
      fileName: _0x4a8f2d,
      videoWidth: Number(_0x21a6a3?.videoWidth || 0) || 0,
      videoHeight: Number(_0x21a6a3?.videoHeight || 0) || 0,
      videoDuration: Number(_0x21a6a3?.videoDuration || 0) || 0,
      videoFps: Number(_0x21a6a3?.fps || 0) || 0,
      needsAutoResize: false,
      fixedSize: true,
    });
  return (appStore.addNode(_0x720fab), _0xe0e74c);
}
export async function runVideoReverseFromNode(_0x20075c) {
  const _0x197752 = _getNode(_0x20075c);
  if (!_0x197752 || !_isVideoNodeType(_0x197752.type))
    return (window.showToast?.(videoReverseText('toasts.unsupportedNode'), 'warn'), null);
  if (_0x197752.isGenerating) return (window.showToast?.(videoReverseText('toasts.videoBusy'), 'info'), null);
  const _0x21fd77 = _resolveSourcePath(_0x197752);
  if (!_0x21fd77) return (window.showToast?.(videoReverseText('toasts.notLocalFile'), 'warn'), null);
  window.showToast?.(videoReverseText('toasts.running'), 'info');
  try {
    const _0x1f2863 = await _reverseVideoImpl({ src: _0x21fd77, nodeId: _0x197752.id }),
      _0xbdb4c6 = _createResultNode(_0x197752, _0x1f2863);
    return (
      _focusCreatedNode(_0x197752.id, _0xbdb4c6),
      commit(),
      _persistLocalCache(),
      window.showToast?.(videoReverseText('toasts.completed'), 'success'),
      { videoId: _0xbdb4c6 }
    );
  } catch (_0xe6128c) {
    const _0x201d38 =
      _0xe6128c instanceof Error ? _0xe6128c.message : String(_0xe6128c || videoReverseText('toasts.failed'));
    return (
      window.showToast?.(videoReverseText('toasts.failedWithError', { error: _0x201d38 }), 'error'),
      null
    );
  }
}
export function __setVideoReverseDepsForTest({ reverseVideoImpl: _0x4163e3 } = {}) {
  _reverseVideoImpl = typeof _0x4163e3 === 'function' ? _0x4163e3 : reverseVideo;
}
export function __resetVideoReverseDepsForTest() {
  _reverseVideoImpl = reverseVideo;
}

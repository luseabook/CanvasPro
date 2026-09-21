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
function videoAudioSeparationText(_0x1ae152, _0x458b0d = {}) {
  return t('mediaProcessing.videoAudioSeparation.' + _0x1ae152, _0x458b0d);
}
function _getState() {
  return typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
}
function _getNode(_0x2b7ba1) {
  return _getState().nodes?.[_0x2b7ba1] || null;
}
function _isVideoNodeType(_0x29940d) {
  const _0x405540 = String(_0x29940d || '')
    .trim()
    .toLowerCase();
  return _0x405540 === 'source-video' || _0x405540 === 'ai-video' || _0x405540 === 'video';
}
function _cleanLocalPath(_0x17105a) {
  return normalizeLocalPath(_0x17105a);
}
function _resolveSourcePath(_0x163bd8) {
  return _cleanLocalPath(resolveCanvasVideoLocalPath(_0x163bd8));
}
function _getResultLocalPath(_0x375b6d) {
  return pickResultLocalPath(_0x375b6d);
}
function _fileNameFromPath(_0x3a29b9) {
  const _0x3dc19e = _cleanLocalPath(_0x3a29b9);
  if (!_0x3dc19e) return '';
  const _0x483246 = _0x3dc19e.split('/');
  return String(_0x483246[_0x483246.length - 1] || '').trim();
}
function _getSpawnLayout(_0x389fcf) {
  const { spacing: _0x483416, direction: _0x595fd7, avoidOverlap: _0x4a4d7c } = getNodeSpawnPrefs(),
    _0x35e831 = _0x595fd7 === 'down' ? 'down' : 'right',
    _0x4ec38f = Math.max(24, Math.min(80, Math.round(Number(_0x483416 || 0) / 2))),
    _0x4b0b66 = getAutoMediaSizeByShortSide(
      Number(_0x389fcf?.width) || 0x200,
      Number(_0x389fcf?.height) || 0x120,
    ),
    _0x197e89 = getNodeDefaultSize('source-audio'),
    _0x3358de = Number(_0x389fcf?.x) || 0,
    _0x2fb241 = Number(_0x389fcf?.y) || 0,
    _0x57b7bd = Number(_0x389fcf?.width) || 0x200,
    _0x3a462f = Number(_0x389fcf?.height) || 0x120;
  let _0x531d73 =
      _0x35e831 === 'right'
        ? _0x3358de + _0x57b7bd + _0x483416
        : _0x3358de + Math.round((_0x57b7bd - Math.max(_0x4b0b66.width, _0x197e89.width)) / 2),
    _0x40b667 =
      _0x35e831 === 'down'
        ? _0x2fb241 + _0x3a462f + _0x483416
        : _0x2fb241 + Math.round((_0x3a462f - Math.max(_0x4b0b66.height, _0x197e89.height)) / 2);
  const _0x2b70ab =
      _0x35e831 === 'right'
        ? _0x4b0b66.width + _0x197e89.width + _0x4ec38f
        : Math.max(_0x4b0b66.width, _0x197e89.width),
    _0x56890b =
      _0x35e831 === 'down'
        ? _0x4b0b66.height + _0x197e89.height + _0x4ec38f
        : Math.max(_0x4b0b66.height, _0x197e89.height);
  if (_0x4a4d7c) {
    const _0x4575e9 = findAvailablePosition(
      _getState().nodes || {},
      _0x531d73,
      _0x40b667,
      _0x2b70ab,
      _0x56890b,
      _0x483416,
      _0x35e831,
    );
    ((_0x531d73 = _0x4575e9.x), (_0x40b667 = _0x4575e9.y));
  }
  return {
    video: { x: _0x531d73, y: _0x40b667, width: _0x4b0b66.width, height: _0x4b0b66.height },
    audio:
      _0x35e831 === 'right'
        ? {
            x: _0x531d73 + _0x4b0b66.width + _0x4ec38f,
            y: _0x40b667 + Math.round((_0x4b0b66.height - _0x197e89.height) / 2),
            width: _0x197e89.width,
            height: _0x197e89.height,
          }
        : {
            x: _0x531d73 + Math.round((_0x4b0b66.width - _0x197e89.width) / 2),
            y: _0x40b667 + _0x4b0b66.height + _0x4ec38f,
            width: _0x197e89.width,
            height: _0x197e89.height,
          },
  };
}
function _focusCreatedNodes(_0x286d6c, _0xff2be9) {
  const _0xf481d = Array.isArray(_0xff2be9)
    ? _0xff2be9.map((_0x2efe10) => String(_0x2efe10 || '').trim()).filter(Boolean)
    : [];
  if (!_0xf481d.length) return;
  appStore.setSelectedNodes(_0xf481d);
  if (typeof window.v2FocusOnNodes === 'function') window.v2FocusOnNodes([_0x286d6c, ..._0xf481d]);
  else typeof window.v2FocusOnNode === 'function' && window.v2FocusOnNode(_0xf481d[0]);
}
function _persistLocalCache() {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
}
function _createResultNodes(_0x5a7779, _0x9f139d) {
  const _0x108cdb = _getResultLocalPath(_0x9f139d?.video),
    _0x7310ca = _getResultLocalPath(_0x9f139d?.audio);
  if (!_0x108cdb || !_0x7310ca) throw new Error(videoAudioSeparationText('incompleteResult'));
  const _0x2706cf = _getSpawnLayout(_0x5a7779),
    _0x5b1e87 = String(_0x5a7779?.name || '').trim() || videoAudioSeparationText('videoFallback'),
    _0x406f18 = generateId('source-video-separate-av'),
    _0x348969 = generateId('source-audio-separate-av'),
    _0x4f052 = _0x9f139d?.video?.filename || _fileNameFromPath(_0x108cdb),
    _0x28221e = _0x9f139d?.audio?.filename || _fileNameFromPath(_0x7310ca),
    _0x1433f6 =
      buildVideoGenerationResultPatch({
        localPath: _0x108cdb,
        videoUrl: _0x9f139d?.video?.url,
        fileName: _0x4f052,
      }) || {},
    _0x4cb0d4 =
      buildLocalAudioGenerationResultPatch({
        localPath: _0x7310ca,
        audioUrl: _0x9f139d?.audio?.url,
        fileName: _0x28221e,
      }) || {},
    _0x43b06a = buildSourceMediaNodePayload({
      id: _0x406f18,
      type: 'source-video',
      x: _0x2706cf.video.x,
      y: _0x2706cf.video.y,
      width: _0x2706cf.video.width,
      height: _0x2706cf.video.height,
      name: videoAudioSeparationText('videoNodeName', { name: _0x5b1e87 }),
      ..._0x1433f6,
      src: localPathToUrl(_0x1433f6.localPath) || _0x1433f6.videoUrl || '',
      fileName: _0x4f052,
      needsAutoResize: false,
      fixedSize: true,
    }),
    _0x749cfa = buildSourceAudioNodePayload({
      id: _0x348969,
      x: _0x2706cf.audio.x,
      y: _0x2706cf.audio.y,
      width: _0x2706cf.audio.width,
      height: _0x2706cf.audio.height,
      name: videoAudioSeparationText('audioNodeName', { name: _0x5b1e87 }),
      ..._0x4cb0d4,
      fileName: _0x28221e,
    });
  return (
    typeof appStore.batch === 'function'
      ? appStore.batch(() => {
          (appStore.addNode(_0x43b06a), appStore.addNode(_0x749cfa));
        })
      : (appStore.addNode(_0x43b06a), appStore.addNode(_0x749cfa)),
    { videoId: _0x406f18, audioId: _0x348969 }
  );
}
export async function runVideoAudioSeparationFromNode(_0x372d89) {
  const _0x39c70d = _getNode(_0x372d89);
  if (!_0x39c70d || !_isVideoNodeType(_0x39c70d.type))
    return (window.showToast?.(videoAudioSeparationText('unsupportedNode'), 'warn'), null);
  if (_0x39c70d.isGenerating) return (window.showToast?.(videoAudioSeparationText('busy'), 'info'), null);
  const _0x34150d = _resolveSourcePath(_0x39c70d);
  if (!_0x34150d) return (window.showToast?.(videoAudioSeparationText('notLocalFile'), 'warn'), null);
  window.showToast?.(videoAudioSeparationText('progress'), 'info');
  try {
    const _0x7b3415 = await _separateVideoAudioImpl({ src: _0x34150d }),
      { videoId: _0x321f6a, audioId: _0x26a535 } = _createResultNodes(_0x39c70d, _0x7b3415);
    return (
      _focusCreatedNodes(_0x39c70d.id, [_0x321f6a, _0x26a535]),
      commit(),
      _persistLocalCache(),
      window.showToast?.(videoAudioSeparationText('success'), 'success'),
      { videoId: _0x321f6a, audioId: _0x26a535 }
    );
  } catch (_0x2d6659) {
    const _0x1f064b =
      _0x2d6659 instanceof Error
        ? _0x2d6659.message
        : String(_0x2d6659 || videoAudioSeparationText('fallback'));
    return (
      window.showToast?.(videoAudioSeparationText('failedWithMessage', { message: _0x1f064b }), 'error'),
      null
    );
  }
}
export function __setVideoAudioSeparationDepsForTest({ separateVideoAudioImpl: _0x3f08e8 } = {}) {
  _separateVideoAudioImpl = typeof _0x3f08e8 === 'function' ? _0x3f08e8 : separateVideoAudio;
}
export function __resetVideoAudioSeparationDepsForTest() {
  _separateVideoAudioImpl = separateVideoAudio;
}

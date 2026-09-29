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
export function normalizeVideoCutResultLocalPath(_0x9835b7) {
  return pickResultLocalPath(_0x9835b7);
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
function videoClipText(_0x1c56c1, _0x52dd5b = {}) {
  return t('videoClip.' + _0x1c56c1, _0x52dd5b);
}
function escapeClipHelperHtml(_0x582382) {
  return String(_0x582382 ?? '').replace(/[&<>"']/g, (_0x41526e) => {
    if (_0x41526e === '&') return '&amp;';
    if (_0x41526e === '<') return '&lt;';
    if (_0x41526e === '>') return '&gt;';
    if (_0x41526e === '"') return '&quot;';
    return '&#39;';
  });
}
function clipHelperLabel(_0x3279df, _0x3bf9e6 = {}) {
  return escapeClipHelperHtml(videoClipText(_0x3279df, _0x3bf9e6));
}
export function normalizeSmartClipMaxSegments(_0x5628b5) {
  const _0x5f5489 = Number(_0x5628b5),
    _0xf52e4d = Number.isFinite(_0x5f5489) ? Math.round(_0x5f5489) : SMART_CLIP_DEFAULT_SEGMENTS;
  return Math.max(SMART_CLIP_MIN_SEGMENTS, Math.min(SMART_CLIP_MAX_SEGMENTS, _0xf52e4d));
}
export function normalizeSmartClipFps(_0x5f0e28) {
  const _0x132905 = Number(_0x5f0e28),
    _0x14f2ff = Number.isFinite(_0x132905) ? Math.round(_0x132905) : SMART_CLIP_DEFAULT_FPS;
  return SMART_CLIP_FPS_OPTIONS.includes(_0x14f2ff) ? _0x14f2ff : SMART_CLIP_DEFAULT_FPS;
}
export function normalizeSmartClipOutputMode(_0x24e83e) {
  const _0x27b274 = String(_0x24e83e || '').trim();
  return _0x27b274 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    ? SMART_CLIP_OUTPUT_MODE_KEYFRAMES
    : SMART_CLIP_DEFAULT_OUTPUT_MODE;
}
function normalizeSmartClipMode(_0x73d604) {
  const _0x3bfd05 = String(_0x73d604 || '')
    .trim()
    .toLowerCase();
  return SMART_CLIP_MODE_OPTIONS.includes(_0x3bfd05) ? _0x3bfd05 : 'stable';
}
function normalizeSmartClipRunOptions(_0x4942d1 = {}) {
  const _0x58bcbe = _0x4942d1 && typeof _0x4942d1 === 'object' ? _0x4942d1 : {};
  return {
    mode: normalizeSmartClipMode(_0x58bcbe.mode),
    maxSegments: normalizeSmartClipMaxSegments(_0x58bcbe.maxSegments),
    fps: normalizeSmartClipFps(_0x58bcbe.fps),
    outputMode: normalizeSmartClipOutputMode(_0x58bcbe.outputMode),
  };
}
export function isSmartClipImageResult(_0x3db377, _0xe884a5 = pickResultLocalPath(_0x3db377)) {
  const _0x210ed2 = String(_0x3db377?.outputType || _0x3db377?.type || '')
      .trim()
      .toLowerCase(),
    _0x5514f5 = String(_0x3db377?.mimeType || _0x3db377?.contentType || '')
      .trim()
      .toLowerCase();
  return (
    _0x210ed2 === 'image' ||
    _0x5514f5.startsWith('image/') ||
    SMART_CLIP_IMAGE_EXT_RE.test(String(_0xe884a5 || _0x3db377?.url || _0x3db377?.path || ''))
  );
}
function resolveSmartClipResultUrl(_0x33b4c0, _0x3a8a5a) {
  return (
    localPathToUrl(_0x3a8a5a) || String(_0x33b4c0?.url || _0x33b4c0?.src || _0x33b4c0?.imageUrl || '').trim()
  );
}
function getWindowTimer(_0x579346) {
  const _0x16ed48 = globalThis.window?.[_0x579346] || globalThis[_0x579346];
  return typeof _0x16ed48 === 'function' ? _0x16ed48.bind(globalThis.window || globalThis) : null;
}
function waitForSmartClipVideoEvent(_0x85450, _0x2473e9, _0x26b236 = 0x2710) {
  const _0x1b7db8 = getWindowTimer('setTimeout'),
    _0x526dc9 = getWindowTimer('clearTimeout');
  if (!_0x85450 || typeof _0x1b7db8 !== 'function') return Promise.resolve(false);
  return new Promise((_0x45b387) => {
    let _0x2fe4e4 = false,
      _0x3c5366 = null;
    const _0x4828b9 = () => {
        for (const _0x30cb9d of _0x2473e9) {
          _0x85450.removeEventListener?.(_0x30cb9d, _0x39a0d1);
        }
        (_0x85450.removeEventListener?.('error', _0x1b2afb),
          _0x85450.removeEventListener?.('abort', _0x1b2afb));
        if (_0x3c5366 && typeof _0x526dc9 === 'function') _0x526dc9(_0x3c5366);
      },
      _0x3a4deb = (_0x307c7d) => {
        if (_0x2fe4e4) return;
        ((_0x2fe4e4 = true), _0x4828b9(), _0x45b387(_0x307c7d === true));
      },
      _0x39a0d1 = () => _0x3a4deb(true),
      _0x1b2afb = () => _0x3a4deb(false);
    for (const _0xa7070b of _0x2473e9) {
      _0x85450.addEventListener?.(_0xa7070b, _0x39a0d1, { once: true });
    }
    (_0x85450.addEventListener?.('error', _0x1b2afb, { once: true }),
      _0x85450.addEventListener?.('abort', _0x1b2afb, { once: true }),
      (_0x3c5366 = _0x1b7db8(() => _0x3a4deb(false), _0x26b236)));
  });
}
async function captureSmartClipVideoFirstFrame(_0x348f6e, _0x550790) {
  const _0x51c882 = globalThis.document;
  if (!_0x51c882 || !_0x348f6e) throw new Error('missing video url');
  const _0x5498ae = _0x51c882.createElement('video');
  ((_0x5498ae.muted = true),
    (_0x5498ae.playsInline = true),
    (_0x5498ae.preload = 'auto'),
    (_0x5498ae.crossOrigin = 'anonymous'),
    (_0x5498ae.style.position = 'fixed'),
    (_0x5498ae.style.left = '-10000px'),
    (_0x5498ae.style.top = '-10000px'),
    (_0x5498ae.style.width = '1px'),
    (_0x5498ae.style.height = '1px'),
    (_0x5498ae.style.opacity = '0'),
    _0x51c882.body?.appendChild(_0x5498ae));
  try {
    _0x5498ae.src = _0x348f6e;
    try {
      _0x5498ae.load?.();
    } catch {}
    const _0x58402 = await waitForVideoFrame(_0x5498ae, { timeoutMs: 0x2710 });
    if (!_0x58402) throw new Error('video frame is not ready');
    return (
      Number(_0x5498ae.currentTime || 0) > 0.001 &&
        ((_0x5498ae.currentTime = 0),
        await waitForSmartClipVideoEvent(_0x5498ae, ['seeked', 'timeupdate'], 0x1388)),
      await captureVideoFrameSnapshot(_0x5498ae, { fileNamePrefix: _0x550790 })
    );
  } finally {
    try {
      (_0x5498ae.pause?.(), _0x5498ae.removeAttribute?.('src'), _0x5498ae.load?.());
    } catch {}
    _0x5498ae.remove?.();
  }
}
async function extractSmartClipVideoResultFirstFrame(_0x3bef22, _0x7612ef, _0x1d0936) {
  const _0x3256fa = resolveSmartClipResultUrl(_0x3bef22, _0x7612ef);
  if (!_0x3256fa) throw new Error('missing video segment url');
  const _0x21a5bd = await captureSmartClipVideoFirstFrame(
    _0x3256fa,
    'smart_clip_keyframe_' + (_0x1d0936 + 1),
  );
  return saveVideoFrameSnapshot(_0x21a5bd, saveOutputBlob);
}
function emitSmartClipProgress(_0xccdeb7, _0x21aabb) {
  if (typeof _0xccdeb7 !== 'function') return;
  try {
    _0xccdeb7(_0x21aabb);
  } catch {}
}
function getSmartClipStageText(_0x5a5b9a) {
  if (_0x5a5b9a === 'detect') return videoClipText('smartClip.stages.detect');
  if (_0x5a5b9a === 'cut') return videoClipText('smartClip.stages.cut');
  if (_0x5a5b9a === 'frame') return videoClipText('smartClip.stages.frame');
  return videoClipText('smartClip.stages.processing');
}
function buildSmartClipProgressPayload(_0x5d6639 = {}) {
  const _0xde2b6f = Math.max(0, Math.min(1, Number(_0x5d6639.progress || 0))),
    _0x6db1c7 = Math.round(_0xde2b6f * 100),
    _0xd6c46e = Number(_0x5d6639.doneCount || 0),
    _0x1825e6 = Number(_0x5d6639.total || 0),
    _0x43fb5b = String(_0x5d6639.stage || ''),
    _0xe96b00 = getSmartClipStageText(_0x43fb5b);
  return {
    stage: _0x43fb5b,
    stageText: _0xe96b00,
    progress: _0xde2b6f,
    pct: _0x6db1c7,
    doneCount: _0xd6c46e,
    total: _0x1825e6,
    text:
      _0x1825e6 > 0
        ? videoClipText('smartClip.progressWithTotal', {
            stage: _0xe96b00,
            done: _0xd6c46e,
            total: _0x1825e6,
            pct: _0x6db1c7,
          })
        : videoClipText('smartClip.progressPercent', { stage: _0xe96b00, pct: _0x6db1c7 }),
  };
}
function pickPositiveNumber(..._0x16dd95) {
  for (const _0x23bbaf of _0x16dd95) {
    const _0x54383a = Number(_0x23bbaf);
    if (Number.isFinite(_0x54383a) && _0x54383a > 0) return _0x54383a;
  }
  return 0;
}
function pickSelectedVideoItem(_0x325456) {
  const _0x423d69 = Array.isArray(_0x325456?.videos) ? _0x325456.videos : [];
  if (!_0x423d69.length) return null;
  const _0x54e80d = Number(_0x325456?.mainVideoIndex),
    _0x51c123 = Number.isFinite(_0x54e80d) ? Math.max(0, Math.trunc(_0x54e80d)) : 0;
  return _0x423d69[Math.min(_0x51c123, _0x423d69.length - 1)] || _0x423d69[0] || null;
}
const DIRECT_VIDEO_SOURCE_RE = /^(?:https?:|blob:|data:)/i,
  BLOCKED_VIDEO_SOURCE_RE = /^(?:file|javascript):/i;
function normalizeDirectVideoSource(_0x41839a) {
  const _0x2f22f8 = String(_0x41839a || '').trim();
  if (!_0x2f22f8 || BLOCKED_VIDEO_SOURCE_RE.test(_0x2f22f8)) return '';
  const _0x40251a = localPathToUrl(_0x2f22f8);
  if (_0x40251a) return _0x40251a;
  if (_0x2f22f8.startsWith('/') && !_0x2f22f8.startsWith('//')) return _0x2f22f8;
  return DIRECT_VIDEO_SOURCE_RE.test(_0x2f22f8) ? _0x2f22f8 : '';
}
export function resolveVideoClipSourceUrl(_0x13dbfb) {
  if (!_0x13dbfb) return '';
  const _0x4c0c30 = pickSelectedVideoItem(_0x13dbfb),
    _0x2dceff = _0x4c0c30 ? [_0x4c0c30, _0x13dbfb] : [_0x13dbfb];
  for (const _0x41ad30 of _0x2dceff) {
    const _0xb3a2c6 = resolveCanvasVideoUrl(_0x41ad30);
    if (_0xb3a2c6) return _0xb3a2c6;
    for (const _0xb42647 of ['src', 'videoUrl', 'url', 'resultUrl', 'sourceUrl']) {
      const _0x592df6 = normalizeDirectVideoSource(_0x41ad30?.[_0xb42647]);
      if (_0x592df6) return _0x592df6;
    }
  }
  return '';
}
export function buildVideoCutNodeMeta(_0x4426b8, _0x2dd3c0, _0x38b686, _0x415df5) {
  const _0x4c23d2 = Number(_0x2dd3c0),
    _0x26da9a = Number(_0x38b686),
    _0x359fd9 =
      Number.isFinite(_0x4c23d2) && Number.isFinite(_0x26da9a) && _0x26da9a > _0x4c23d2
        ? _0x26da9a - _0x4c23d2
        : 0,
    _0x5c45f7 = pickSelectedVideoItem(_0x4426b8),
    _0xdfbc38 = pickPositiveNumber(
      _0x5c45f7?.videoDuration,
      _0x5c45f7?.duration,
      _0x4426b8?.videoDuration,
      _0x4426b8?.duration,
    ),
    _0x558f92 = pickPositiveNumber(
      _0x5c45f7?.videoFrameCount,
      _0x5c45f7?.frameCount,
      _0x4426b8?.videoFrameCount,
      _0x4426b8?.frameCount,
    ),
    _0x307148 =
      pickPositiveNumber(
        _0x415df5,
        _0x5c45f7?.videoFps,
        _0x5c45f7?.fps,
        _0x4426b8?.videoFps,
        _0x4426b8?.fps,
      ) || (_0x558f92 > 0 && _0xdfbc38 > 0 ? _0x558f92 / _0xdfbc38 : 0),
    _0x3c63d1 = pickPositiveNumber(
      _0x5c45f7?.videoWidth,
      _0x5c45f7?.width,
      _0x4426b8?.videoWidth,
      _0x4426b8?.selectedVideoWidth,
    ),
    _0x398edc = pickPositiveNumber(
      _0x5c45f7?.videoHeight,
      _0x5c45f7?.height,
      _0x4426b8?.videoHeight,
      _0x4426b8?.selectedVideoHeight,
    ),
    _0x34690d = {};
  if (_0x359fd9 > 0) _0x34690d.videoDuration = _0x359fd9;
  if (_0x307148 > 0) _0x34690d.videoFps = _0x307148;
  _0x359fd9 > 0 &&
    _0x307148 > 0 &&
    (_0x34690d.videoFrameCount = Math.max(1, Math.round(_0x359fd9 * _0x307148)));
  if (_0x3c63d1 > 0) _0x34690d.videoWidth = Math.round(_0x3c63d1);
  if (_0x398edc > 0) _0x34690d.videoHeight = Math.round(_0x398edc);
  return _0x34690d;
}
export function buildVideoCutNodePlaybackFields(_0x17e853) {
  const _0x2ee1b9 = pickResultLocalPath({ localPath: _0x17e853 }),
    _0x52e648 = localPathToUrl(_0x2ee1b9);
  return {
    src: _0x52e648,
    videoUrl: _0x52e648,
    localPath: _0x2ee1b9,
    originalLocalPath: _0x2ee1b9,
    videoThumbSrc: _0x52e648,
  };
}
function applyVideoCutThumbResultToNode(_0x6715e8, _0xcac0c5, _0x3c1f32 = {}) {
  const _0x57b6f7 = String(_0x6715e8 || '').trim(),
    _0x1d118d = String(_0xcac0c5 || '').trim();
  if (!_0x57b6f7 || !_0x1d118d) return;
  const _0x57abfb = String(_0x3c1f32.thumbUrl || _0x3c1f32.url || '').trim(),
    _0x492656 = pickResultLocalPath(_0x3c1f32);
  if (!_0x57abfb && !_0x492656) return;
  const _0x14279d = appStore.getState().nodes?.[_0x57b6f7];
  if (!_0x14279d) return;
  const _0x47a27b = resolveCanvasVideoUrl(_0x14279d);
  if (_0x47a27b && _0x47a27b !== _0x1d118d) return;
  const _0xfcc8ef = { videoThumbSrc: _0x1d118d, videoThumbUnavailableSource: '' };
  (_0x57abfb && !String(_0x14279d.thumbUrl || '').trim() && (_0xfcc8ef.thumbUrl = _0x57abfb),
    _0x492656 && !String(_0x14279d.posterLocalPath || '').trim() && (_0xfcc8ef.posterLocalPath = _0x492656),
    appStore.updateNodeData(_0x57b6f7, _0xfcc8ef));
}
function ensureVideoCutNodeThumb(_0x1b01d8, _0x28ed89) {
  const _0x1a2e1d = localPathToUrl(_0x28ed89);
  if (!_0x1a2e1d) return;
  fetchVideoFirstFrameThumbFromServer(_0x1a2e1d)
    .then((_0x3afc25) => applyVideoCutThumbResultToNode(_0x1b01d8, _0x1a2e1d, _0x3afc25))
    .catch(() => {});
}
export async function runSmartClipFromVideoNode({
  nodeId: _0x129cd6,
  options: _0x4c2d0c,
  onProgress: _0x89acfa,
  shouldContinue: _0x4325fc,
} = {}) {
  const _0x169019 = normalizeSmartClipRunOptions(_0x4c2d0c),
    _0x59be81 = String(_0x129cd6 || '').trim(),
    _0x186819 = appStore.getState().nodes,
    _0x1d60a6 = _0x186819[_0x59be81];
  if (!_0x1d60a6) throw new Error(videoClipText('errors.videoNodeMissing'));
  const _0x557246 =
    localPathToUrl(_0x1d60a6.localPath) || _0x1d60a6.src || _0x1d60a6.videoUrl || _0x1d60a6.resultUrl || '';
  if (!_0x557246) throw new Error(videoClipText('errors.invalidSource'));
  emitSmartClipProgress(_0x89acfa, {
    stage: 'prepare',
    stageText: videoClipText('smartClip.stages.prepare'),
    text: videoClipText('smartClip.preparing'),
    outputMode: _0x169019.outputMode,
  });
  const _0x339551 = await requester({
    url: '/api/v2/video/smart_clip',
    method: 'POST',
    provider: 'local',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src: _0x557246, options: _0x169019 }),
    allow404Null: true,
    returnMeta: true,
  });
  if (_0x339551?.status === 0x194 || _0x339551?.data == null)
    throw new Error(videoClipText('errors.smartClipEndpointMissing'));
  if (!_0x339551?.data?.success)
    throw new Error(_0x339551?.data?.error || videoClipText('errors.startFailed'));
  const _0x5cf701 = _0x339551.data.jobId;
  if (!_0x5cf701) throw new Error(videoClipText('errors.startMissingJobId'));
  for (;;) {
    if (typeof _0x4325fc === 'function' && _0x4325fc() === false)
      throw new Error(videoClipText('errors.exitedClipMode'));
    const _0x358980 = await requester({
        url: '/api/v2/video/smart_clip/status?jobId=' + encodeURIComponent(_0x5cf701),
        method: 'GET',
        provider: 'local',
        timeout: 0x4e20,
        returnMeta: true,
      }),
      _0x3f07fe = _0x358980.data || {};
    if (_0x3f07fe.status === 'error')
      throw new Error(_0x3f07fe.error || videoClipText('errors.smartClipFailed'));
    emitSmartClipProgress(_0x89acfa, {
      ...buildSmartClipProgressPayload(_0x3f07fe),
      outputMode: _0x169019.outputMode,
    });
    if (_0x3f07fe.status !== 'done') {
      await new Promise((_0x284751) => setTimeout(_0x284751, 0x320));
      continue;
    }
    const _0x2c7a3c = Array.isArray(_0x3f07fe.segments) ? _0x3f07fe.segments : [];
    if (!_0x2c7a3c.length)
      return { ok: false, reason: 'no-segments', nodeIds: [], outputMode: _0x169019.outputMode };
    const _0xb0bc3a = appStore.getState().nodes[_0x59be81];
    if (!_0xb0bc3a) throw new Error(videoClipText('errors.sourceNodeMissing'));
    const _0x4936d9 = normalizeSmartClipOutputMode(_0x3f07fe.outputMode || _0x169019.outputMode),
      _0x5ed133 = _0x4936d9 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
      _0x403914 = getAutoMediaSizeByShortSide(_0xb0bc3a.width || 0x200, _0xb0bc3a.height || 0x120),
      { spacing: _0x3e5d11, direction: _0x4ba01e, avoidOverlap: _0x594d02 } = getNodeSpawnPrefs(),
      { startX: _0x5cc06f, startY: _0x5445cf } = calcSpawnStartFromAnchor(_0xb0bc3a, _0x3e5d11, _0x4ba01e),
      _0x34e12a = [],
      _0x529402 = { ...(appStore.getState().nodes || {}) };
    for (let _0x14aeaf = 0; _0x14aeaf < _0x2c7a3c.length; _0x14aeaf++) {
      const _0x568107 = _0x2c7a3c[_0x14aeaf] || {},
        _0x520e05 = pickResultLocalPath(_0x568107);
      if (!_0x520e05) continue;
      let _0x428f75 = _0x568107,
        _0x1af4c5 = _0x520e05;
      if (_0x5ed133 && !isSmartClipImageResult(_0x568107, _0x520e05)) {
        emitSmartClipProgress(_0x89acfa, {
          stage: 'frame',
          stageText: videoClipText('smartClip.stages.frame'),
          progress: _0x2c7a3c.length > 0 ? _0x14aeaf / _0x2c7a3c.length : 0,
          pct: _0x2c7a3c.length > 0 ? Math.round((_0x14aeaf / _0x2c7a3c.length) * 100) : 0,
          doneCount: _0x14aeaf,
          total: _0x2c7a3c.length,
          text: videoClipText('smartClip.extractingFrame', {
            current: _0x14aeaf + 1,
            total: _0x2c7a3c.length,
          }),
          outputMode: _0x4936d9,
        });
        try {
          ((_0x428f75 = await extractSmartClipVideoResultFirstFrame(_0x568107, _0x520e05, _0x14aeaf)),
            (_0x1af4c5 = pickResultLocalPath(_0x428f75)));
        } catch (_0x3543c1) {
          console.warn('[VideoClipController] smart clip keyframe fallback failed:', _0x3543c1);
          continue;
        }
        if (!_0x1af4c5) continue;
      }
      const _0x2d3296 = normalizeSmartClipFps(_0x568107.fps || _0x169019.fps),
        _0x55c9bc = Number(_0x568107.duration) > 0 ? Number(_0x568107.duration) : 0,
        _0x2e12ec = pickPositiveNumber(
          _0x428f75.width,
          _0x428f75.imageWidth,
          _0x428f75.originalWidth,
          _0xb0bc3a.videoWidth,
          _0xb0bc3a.selectedVideoWidth,
          _0xb0bc3a.originalWidth,
          _0xb0bc3a.width,
          0x200,
        ),
        _0x2ceaf0 = pickPositiveNumber(
          _0x428f75.height,
          _0x428f75.imageHeight,
          _0x428f75.originalHeight,
          _0xb0bc3a.videoHeight,
          _0xb0bc3a.selectedVideoHeight,
          _0xb0bc3a.originalHeight,
          _0xb0bc3a.height,
          0x120,
        ),
        _0x595bf9 = _0x5ed133 ? getAutoMediaSizeByShortSide(_0x2e12ec, _0x2ceaf0) : _0x403914,
        _0x373b34 = _0x594d02
          ? findAvailablePosition(
              _0x529402,
              _0x5cc06f,
              _0x5445cf,
              _0x595bf9.width,
              _0x595bf9.height,
              _0x3e5d11,
              _0x4ba01e,
            )
          : { x: _0x5cc06f, y: _0x5445cf },
        _0x232937 = generateId(_0x5ed133 ? 'source-image-smart-frame' : 'source-video-scene'),
        _0x321d8a = _0x5ed133 ? null : buildVideoCutNodePlaybackFields(_0x1af4c5),
        _0x35749f = _0x5ed133
          ? buildSourceMediaNodePayload({
              id: _0x232937,
              type: 'source-image',
              x: _0x373b34.x,
              y: _0x373b34.y,
              width: _0x595bf9.width,
              height: _0x595bf9.height,
              name: videoClipText('smartClip.keyframeNodeName', { index: _0x14aeaf + 1 }),
              src: localPathToUrl(_0x1af4c5),
              localPath: _0x1af4c5,
              originalLocalPath: _0x428f75.originalLocalPath || _0x1af4c5,
              displayLocalPath: _0x428f75.displayLocalPath || '',
              thumbLocalPath: _0x428f75.thumbLocalPath || '',
              fileName: _0x428f75.fileName || _0x568107.fileName || '',
              naturalWidth: _0x2e12ec,
              naturalHeight: _0x2ceaf0,
              originalWidth: _0x2e12ec,
              originalHeight: _0x2ceaf0,
              needsAutoResize: false,
              fixedSize: true,
            })
          : buildSourceMediaNodePayload({
              id: _0x232937,
              type: 'source-video',
              x: _0x373b34.x,
              y: _0x373b34.y,
              width: _0x595bf9.width,
              height: _0x595bf9.height,
              name: videoClipText('smartClip.segmentNodeName', { index: _0x14aeaf + 1 }),
              ..._0x321d8a,
              videoDuration: _0x55c9bc || undefined,
              videoFps: _0x2d3296,
              videoFrameCount: _0x55c9bc > 0 ? Math.max(1, Math.round(_0x55c9bc * _0x2d3296)) : undefined,
              needsAutoResize: false,
              fixedSize: true,
            });
      (appStore.addNode(_0x35749f),
        (_0x529402[_0x232937] = _0x35749f),
        _0x34e12a.push(_0x232937),
        !_0x5ed133 && ensureVideoCutNodeThumb(_0x232937, _0x1af4c5));
    }
    if (!_0x34e12a.length)
      return {
        ok: false,
        reason: _0x5ed133 ? 'no-keyframes' : 'no-results',
        nodeIds: [],
        outputMode: _0x4936d9,
      };
    return (
      appStore.setSelectedNodes(_0x34e12a),
      commit(),
      window.v2FocusOnNodes?.([_0x59be81, ..._0x34e12a]),
      window._triggerLocalCacheSave?.(),
      { ok: true, nodeIds: _0x34e12a, outputMode: _0x4936d9 }
    );
  }
}
export function runSmartClipKeyframeExtractionFromVideoNode({
  nodeId: _0x4031da,
  options: _0x5e459f,
  onProgress: _0x2efe59,
  shouldContinue: _0x3c2eff,
} = {}) {
  return runSmartClipFromVideoNode({
    nodeId: _0x4031da,
    options: {
      ...SMART_CLIP_KEYFRAME_DEFAULT_OPTIONS,
      ...(_0x5e459f && typeof _0x5e459f === 'object' ? _0x5e459f : {}),
      outputMode: SMART_CLIP_OUTPUT_MODE_KEYFRAMES,
    },
    onProgress: _0x2efe59,
    shouldContinue: _0x3c2eff,
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
  init(_0x2e560e) {
    if (!_0x2e560e) return;
    if (this.active) this.exit({ silent: true });
    const _0x38a4fe = appStore.getState().nodes[_0x2e560e];
    if (!_0x38a4fe) return;
    ((this.active = true),
      (this.nodeId = _0x2e560e),
      (this.anchorNodeId = _0x2e560e),
      (this._rangeLoopSeekPending = false),
      (this._rangePlaybackSeq += 1),
      appStore.setVideoClipState({ active: true, nodeId: _0x2e560e }),
      (this._retryCount = 0),
      this._mountWhenReady());
  },
  _applyDimMode(_0x27639b) {
    const _0xce06eb = document.getElementById('v2-wrap');
    if (_0xce06eb) {
      if (_0x27639b) _0xce06eb.classList.add('is-video-clip-mode');
      else _0xce06eb.classList.remove('is-video-clip-mode');
    }
    if (this.wrapperEl) {
      if (_0x27639b) this.wrapperEl.classList.add('is-video-clip-target');
      else this.wrapperEl.classList.remove('is-video-clip-target');
    }
  },
  _applyFrozenUI(_0x193656) {
    if (!this.wrapperEl) return;
    const _0x452ca8 = 'is-video-clipping';
    if (_0x193656) this.wrapperEl.classList.add(_0x452ca8);
    else this.wrapperEl.classList.remove(_0x452ca8);
    this._applyFrozenOverlaysHidden(_0x193656);
  },
  _applyFrozenOverlaysHidden(_0x224a37) {
    if (!this.wrapperEl) return;
    if (_0x224a37) {
      if (Array.isArray(this._hiddenEls) && this._hiddenEls.length) return;
      const _0xfb700b = [
          '.video-controls',
          '.video-mute-btn',
          '.node-upload-hint',
          '.video-center-indicator',
          '.gen-video-center-indicator',
          '.multi-toggle-btn',
        ],
        _0x486672 = [];
      (_0xfb700b.forEach((_0x296386) => {
        this.wrapperEl.querySelectorAll(_0x296386).forEach((_0x585e8c) => {
          (_0x486672.push({ el: _0x585e8c, prevDisplay: _0x585e8c.style.display }),
            (_0x585e8c.style.display = 'none'));
        });
      }),
        (this._hiddenEls = _0x486672));
      return;
    }
    const _0x3e8b88 = Array.isArray(this._hiddenEls) ? this._hiddenEls : [];
    ((this._hiddenEls = null),
      _0x3e8b88.forEach(({ el: _0x4bbfb2, prevDisplay: _0x58a6d4 }) => {
        if (!_0x4bbfb2 || !_0x4bbfb2.isConnected) return;
        _0x4bbfb2.style.display = _0x58a6d4 || '';
      }));
  },
  _mountWhenReady() {
    const _0x306460 = this.nodeId,
      _0x15b673 = () => {
        if (!this.active || this.nodeId !== _0x306460) return;
        const _0x33b834 = document.getElementById(_0x306460);
        if (!_0x33b834) {
          this._retryCount++;
          if (this._retryCount > 10) {
            this.exit({ silent: true });
            return;
          }
          this._retryRaf = requestAnimationFrame(_0x15b673);
          return;
        }
        ((this.wrapperEl = _0x33b834),
          this._applyFrozenUI(true),
          this._applyDimMode(true),
          this._createUI(),
          this._bindEvents(),
          this._syncDurationAndDefaults(),
          this._render());
      };
    this._retryRaf = requestAnimationFrame(_0x15b673);
  },
  _createUI() {
    if (!this.wrapperEl) return;
    this.wrapperEl.querySelectorAll('.v2-video-clipbar').forEach((_0x4713ee) => _0x4713ee.remove());
    const _0x5e4f92 = document.createElement('div');
    ((_0x5e4f92.className = 'v2-video-clipbar'),
      _0x5e4f92.addEventListener('pointerdown', (_0x1351e3) => _0x1351e3.stopPropagation()),
      _0x5e4f92.addEventListener('click', (_0x18da54) => _0x18da54.stopPropagation()),
      _0x5e4f92.addEventListener('dblclick', (_0x688371) => {
        (_0x688371.preventDefault(), _0x688371.stopPropagation());
      }));
    const _0x1b72a6 = document.createElement('button');
    ((_0x1b72a6.type = 'button'),
      (_0x1b72a6.className = 'v2-video-clipbtn cancel'),
      (_0x1b72a6.title = videoClipText('controls.cancel')));
    {
      const _0x14362b = 'http://www.w3.org/2000/svg',
        _0x5c7434 = document.createElementNS(_0x14362b, 'svg');
      (_0x5c7434.setAttribute('width', '20'),
        _0x5c7434.setAttribute('height', '20'),
        _0x5c7434.setAttribute('viewBox', '0 0 24 24'),
        _0x5c7434.setAttribute('fill', 'none'),
        _0x5c7434.setAttribute('stroke', 'currentColor'),
        _0x5c7434.setAttribute('stroke-width', '2'));
      const _0x174586 = document.createElementNS(_0x14362b, 'path');
      _0x174586.setAttribute('d', 'M18 6L6 18');
      const _0x94b70b = document.createElementNS(_0x14362b, 'path');
      (_0x94b70b.setAttribute('d', 'M6 6l12 12'),
        _0x5c7434.appendChild(_0x174586),
        _0x5c7434.appendChild(_0x94b70b),
        _0x1b72a6.appendChild(_0x5c7434));
    }
    const _0xd8c9ed = document.createElement('button');
    ((_0xd8c9ed.type = 'button'),
      (_0xd8c9ed.className = 'v2-video-clipbtn confirm'),
      (_0xd8c9ed.title = videoClipText('controls.done')));
    {
      const _0x5ef147 = 'http://www.w3.org/2000/svg',
        _0x222fa0 = document.createElementNS(_0x5ef147, 'svg');
      (_0x222fa0.setAttribute('width', '24'),
        _0x222fa0.setAttribute('height', '24'),
        _0x222fa0.setAttribute('viewBox', '0 0 24 24'),
        _0x222fa0.setAttribute('fill', 'none'),
        _0x222fa0.setAttribute('stroke', 'currentColor'),
        _0x222fa0.setAttribute('stroke-width', '2.5'));
      const _0x226fa7 = document.createElementNS(_0x5ef147, 'polyline');
      (_0x226fa7.setAttribute('points', '20 6 9 17 4 12'),
        _0x222fa0.appendChild(_0x226fa7),
        _0xd8c9ed.appendChild(_0x222fa0));
    }
    const _0x266f0c = document.createElement('div');
    _0x266f0c.className = 'v2-video-cliprow';
    const _0x13f4c5 = document.createElement('div');
    _0x13f4c5.className = 'v2-video-cliptrack';
    const _0x24fae7 = document.createElement('div');
    _0x24fae7.className = 'v2-video-clipticks';
    const _0x57bef5 = document.createElement('div');
    _0x57bef5.className = 'v2-video-clipthumbs';
    const _0x4ed579 = [];
    for (let _0x50357c = 0; _0x50357c < 10; _0x50357c++) {
      const _0x1e225e = document.createElement('div');
      ((_0x1e225e.className = 'v2-video-clipthumb'),
        _0x57bef5.appendChild(_0x1e225e),
        _0x4ed579.push(_0x1e225e));
    }
    const _0x5a4086 = document.createElement('div');
    _0x5a4086.className = 'v2-video-cliprange';
    const _0x359137 = document.createElement('div');
    _0x359137.className = 'v2-video-clipselection';
    const _0x1d6625 = document.createElement('div');
    _0x1d6625.className = 'v2-video-clipplayhead';
    const _0x218b70 = document.createElement('div');
    ((_0x218b70.className = 'v2-video-cliphandle left'), (_0x218b70.dataset.handle = 'left'));
    const _0x20411f = document.createElement('div');
    ((_0x20411f.className = 'v2-video-cliphandle right'), (_0x20411f.dataset.handle = 'right'));
    const _0x2cbb58 = document.createElement('div');
    ((_0x2cbb58.className = 'v2-video-cliplabel'), (_0x2cbb58.textContent = '0.00s'));
    const _0x1e4ae9 = document.createElement('div');
    _0x1e4ae9.className = 'v2-video-cliphelper-row';
    const _0x3d4236 = document.createElement('div');
    _0x3d4236.className = 'v2-video-cliphelper-left';
    const _0x51662d = [
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
    this._msgEls = _0x51662d.map((_0x37c907, _0x45510d) => {
      const _0x2dbfaf = document.createElement('div');
      _0x2dbfaf.className = 'v2-video-cliphelper-msg';
      if (_0x45510d !== 0) _0x2dbfaf.classList.add('hide-down');
      return ((_0x2dbfaf.innerHTML = _0x37c907.html), _0x3d4236.appendChild(_0x2dbfaf), _0x2dbfaf);
    });
    let _0x5134eb = 0;
    ((this._msgInterval = setInterval(() => {
      if (!this.active || !this._msgEls) return;
      const _0x30964a = this._msgEls[_0x5134eb];
      _0x5134eb = (_0x5134eb + 1) % this._msgEls.length;
      const _0x2ee7d7 = this._msgEls[_0x5134eb];
      (_0x30964a.classList.remove('hide-down'),
        _0x30964a.classList.add('hide-up'),
        _0x2ee7d7.classList.remove('hide-up'),
        _0x2ee7d7.classList.remove('hide-down'),
        setTimeout(() => {
          _0x30964a &&
            _0x30964a.classList.contains('hide-up') &&
            (_0x30964a.classList.remove('hide-up'), _0x30964a.classList.add('hide-down'));
        }, 0x12c));
    }, 0xfa0)),
      (this._smartClipMode = this._smartClipMode || 'stable'),
      (this._smartClipMaxSegments = normalizeSmartClipMaxSegments(this._smartClipMaxSegments)),
      (this._smartClipFps = normalizeSmartClipFps(this._smartClipFps)),
      (this._smartClipOutputMode = normalizeSmartClipOutputMode(this._smartClipOutputMode)));
    const _0x1c5d2a = document.createElement('div');
    _0x1c5d2a.className = 'v2-video-clip-actions';
    const _0x50a197 = document.createElement('div');
    _0x50a197.className = 'v2-video-clip-smartwrap';
    const _0x198e16 = document.createElement('button');
    _0x198e16.className = 'v2-video-clip-smartbtn';
    const _0x42c4c0 =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>',
      _0xb9e80d =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>',
      _0x1da1ba = () => escapeClipHelperHtml(videoClipText('smartPanel.smartClipButton'));
    _0x198e16.innerHTML = _0x42c4c0 + ' ' + _0x1da1ba();
    const _0x29a0a9 = document.createElement('button');
    ((_0x29a0a9.type = 'button'),
      (_0x29a0a9.className = 'v2-video-clip-smartbtn v2-video-clip-framebtn'),
      (_0x29a0a9.title = videoClipText('smartPanel.extractFrame')),
      _0x29a0a9.setAttribute('aria-label', videoClipText('smartPanel.extractFrame')));
    const _0x1471ca =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>';
    _0x29a0a9.innerHTML = _0x1471ca;
    const _0x4f56f1 = document.createElement('div');
    _0x4f56f1.className = 'v2-video-clip-smartpanel';
    const _0x1634da = document.createElement('div');
    ((_0x1634da.className = 'v2-video-clip-smartpanel-title'),
      (_0x1634da.textContent = videoClipText('smartPanel.title')));
    const _0x319510 = document.createElement('div');
    _0x319510.className = 'v2-video-clip-smartpanel-row';
    const _0x2f0e7f = document.createElement('div');
    ((_0x2f0e7f.className = 'v2-video-clip-smartpanel-label'),
      (_0x2f0e7f.textContent = videoClipText('smartPanel.output')));
    const _0x28a5c7 = document.createElement('span');
    ((_0x28a5c7.className = 'rh-tip'),
      _0x28a5c7.setAttribute('data-tooltip', videoClipText('smartPanel.outputTip')),
      (_0x28a5c7.textContent = '!'),
      _0x2f0e7f.appendChild(_0x28a5c7));
    const _0x52a92a = document.createElement('div');
    _0x52a92a.className = 'v2-video-clip-modegroup v2-video-clip-outputgroup';
    const _0x10b220 = document.createElement('button');
    ((_0x10b220.type = 'button'),
      (_0x10b220.className = 'v2-video-clip-modebtn'),
      (_0x10b220.dataset.outputMode = SMART_CLIP_OUTPUT_MODE_SEGMENTS),
      (_0x10b220.textContent = videoClipText('smartPanel.outputSegments')));
    const _0x4c50c3 = document.createElement('button');
    ((_0x4c50c3.type = 'button'),
      (_0x4c50c3.className = 'v2-video-clip-modebtn'),
      (_0x4c50c3.dataset.outputMode = SMART_CLIP_OUTPUT_MODE_KEYFRAMES),
      (_0x4c50c3.textContent = videoClipText('smartPanel.outputKeyframes')),
      _0x52a92a.appendChild(_0x10b220),
      _0x52a92a.appendChild(_0x4c50c3),
      _0x319510.appendChild(_0x2f0e7f),
      _0x319510.appendChild(_0x52a92a));
    const _0x5b2f4c = document.createElement('div');
    _0x5b2f4c.className = 'v2-video-clip-smartpanel-row';
    const _0xcc0b08 = document.createElement('div');
    ((_0xcc0b08.className = 'v2-video-clip-smartpanel-label'),
      (_0xcc0b08.textContent = videoClipText('smartPanel.mode')));
    const _0x4701f1 = document.createElement('span');
    ((_0x4701f1.className = 'rh-tip'),
      _0x4701f1.setAttribute('data-tooltip', videoClipText('smartPanel.modeTip')),
      (_0x4701f1.textContent = '!'),
      _0xcc0b08.appendChild(_0x4701f1));
    const _0x2786dc = document.createElement('div');
    _0x2786dc.className = 'v2-video-clip-modegroup';
    const _0x3e3401 = document.createElement('button');
    ((_0x3e3401.type = 'button'),
      (_0x3e3401.className = 'v2-video-clip-modebtn'),
      (_0x3e3401.dataset.mode = 'stable'),
      (_0x3e3401.textContent = videoClipText('smartPanel.modeStable')));
    const _0x5333fb = document.createElement('button');
    ((_0x5333fb.type = 'button'),
      (_0x5333fb.className = 'v2-video-clip-modebtn'),
      (_0x5333fb.dataset.mode = 'balanced'),
      (_0x5333fb.textContent = videoClipText('smartPanel.modeBalanced')));
    const _0x118aed = document.createElement('button');
    ((_0x118aed.type = 'button'),
      (_0x118aed.className = 'v2-video-clip-modebtn'),
      (_0x118aed.dataset.mode = 'sensitive'),
      (_0x118aed.textContent = videoClipText('smartPanel.modeSensitive')),
      _0x2786dc.appendChild(_0x3e3401),
      _0x2786dc.appendChild(_0x5333fb),
      _0x2786dc.appendChild(_0x118aed),
      _0x5b2f4c.appendChild(_0xcc0b08),
      _0x5b2f4c.appendChild(_0x2786dc));
    const _0x18acdc = document.createElement('div');
    _0x18acdc.className = 'v2-video-clip-smartpanel-row';
    const _0x4c1ed9 = document.createElement('div');
    ((_0x4c1ed9.className = 'v2-video-clip-smartpanel-label'),
      (_0x4c1ed9.textContent = videoClipText('smartPanel.fps')));
    const _0x33da81 = document.createElement('span');
    ((_0x33da81.className = 'rh-tip'),
      _0x33da81.setAttribute('data-tooltip', videoClipText('smartPanel.fpsTip')),
      (_0x33da81.textContent = '!'),
      _0x4c1ed9.appendChild(_0x33da81));
    const _0x504774 = document.createElement('div');
    _0x504774.className = 'v2-video-clip-modegroup v2-video-clip-fpsgroup';
    const _0x362143 = SMART_CLIP_FPS_OPTIONS.map((_0x5792a5) => {
      const _0x8ce4c8 = document.createElement('button');
      return (
        (_0x8ce4c8.type = 'button'),
        (_0x8ce4c8.className = 'v2-video-clip-modebtn v2-video-clip-fpsbtn'),
        (_0x8ce4c8.dataset.fps = String(_0x5792a5)),
        (_0x8ce4c8.textContent = videoClipText('smartPanel.fpsValue', { fps: _0x5792a5 })),
        _0x504774.appendChild(_0x8ce4c8),
        _0x8ce4c8
      );
    });
    (_0x18acdc.appendChild(_0x4c1ed9), _0x18acdc.appendChild(_0x504774));
    const _0x1f0d97 = document.createElement('div');
    _0x1f0d97.className = 'v2-video-clip-smartpanel-row';
    const _0xb9169 = document.createElement('div');
    ((_0xb9169.className = 'v2-video-clip-smartpanel-label'),
      (_0xb9169.textContent = videoClipText('smartPanel.maxSegments')));
    const _0x4f93bd = document.createElement('span');
    ((_0x4f93bd.className = 'rh-tip'),
      _0x4f93bd.setAttribute(
        'data-tooltip',
        videoClipText('smartPanel.maxSegmentsTip', { max: SMART_CLIP_MAX_SEGMENTS }),
      ),
      (_0x4f93bd.textContent = '!'),
      _0xb9169.appendChild(_0x4f93bd));
    const _0x875c9b = document.createElement('div');
    _0x875c9b.className = 'v2-video-clip-maxsegwrap';
    const _0x176c84 = document.createElement('div');
    ((_0x176c84.className = 'rh-stepper-value v2-video-clip-maxseg'),
      _0x176c84.setAttribute('role', 'spinbutton'),
      _0x176c84.setAttribute('aria-label', videoClipText('smartPanel.maxSegmentsAria')),
      _0x176c84.setAttribute('aria-valuemin', String(SMART_CLIP_MIN_SEGMENTS)),
      _0x176c84.setAttribute('aria-valuemax', String(SMART_CLIP_MAX_SEGMENTS)),
      (_0x176c84.tabIndex = 0));
    const _0x38d445 = document.createElement('span');
    ((_0x38d445.className = 'v2-video-clip-maxseg-suffix'),
      (_0x38d445.textContent = videoClipText('smartPanel.segmentUnit')),
      _0x875c9b.appendChild(_0x176c84),
      _0x875c9b.appendChild(_0x38d445),
      _0x1f0d97.appendChild(_0xb9169),
      _0x1f0d97.appendChild(_0x875c9b));
    const _0x233f9a = document.createElement('div');
    ((_0x233f9a.className = 'v2-video-clip-smartpanel-hint'),
      (_0x233f9a.textContent = videoClipText('smartPanel.hintDefault')));
    const _0x371829 = document.createElement('div');
    _0x371829.className = 'v2-video-clip-smartpanel-actions';
    const _0x436f98 = document.createElement('button');
    ((_0x436f98.type = 'button'),
      (_0x436f98.className = 'v2-video-clip-panelbtn'),
      (_0x436f98.textContent = videoClipText('controls.cancel')));
    const _0x28ee11 = document.createElement('button');
    ((_0x28ee11.type = 'button'),
      (_0x28ee11.className = 'v2-video-clip-panelbtn primary'),
      (_0x28ee11.textContent = videoClipText('controls.start')),
      _0x371829.appendChild(_0x436f98),
      _0x371829.appendChild(_0x28ee11),
      _0x4f56f1.appendChild(_0x1634da),
      _0x4f56f1.appendChild(_0x319510),
      _0x4f56f1.appendChild(_0x5b2f4c),
      _0x4f56f1.appendChild(_0x18acdc),
      _0x4f56f1.appendChild(_0x1f0d97),
      _0x4f56f1.appendChild(_0x233f9a),
      _0x4f56f1.appendChild(_0x371829));
    const _0x4c48d0 = [_0x10b220, _0x4c50c3],
      _0x4a0e1e = () => {
        const _0x44fa81 = normalizeSmartClipOutputMode(this._smartClipOutputMode);
        ((this._smartClipOutputMode = _0x44fa81),
          _0x4c48d0.forEach((_0x4dd3b2) => {
            _0x4dd3b2.classList.toggle('is-active', _0x4dd3b2.dataset.outputMode === _0x44fa81);
          }));
        const _0x28e818 = _0x44fa81 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES;
        (_0x18acdc.classList.toggle('is-disabled', _0x28e818),
          _0x362143.forEach((_0x542ac2) => {
            ((_0x542ac2.disabled = _0x28e818),
              _0x542ac2.setAttribute('aria-disabled', _0x28e818 ? 'true' : 'false'));
          }),
          (_0x233f9a.textContent = _0x28e818
            ? videoClipText('smartPanel.hintKeyframes')
            : videoClipText('smartPanel.hintDefault')));
        const _0x59e025 = this._smartClipMode || 'stable';
        [_0x3e3401, _0x5333fb, _0x118aed].forEach((_0x103103) => {
          if (!_0x103103) return;
          if (_0x103103.dataset.mode === _0x59e025) _0x103103.classList.add('is-active');
          else _0x103103.classList.remove('is-active');
        });
        const _0x4f480d = normalizeSmartClipFps(this._smartClipFps);
        ((this._smartClipFps = _0x4f480d),
          _0x362143.forEach((_0x42d882) => {
            _0x42d882.classList.toggle('is-active', Number(_0x42d882.dataset.fps) === _0x4f480d);
          }));
        const _0x40e606 = normalizeSmartClipMaxSegments(this._smartClipMaxSegments);
        ((this._smartClipMaxSegments = _0x40e606),
          (_0x176c84.textContent = String(_0x40e606)),
          _0x176c84.setAttribute('aria-valuenow', String(_0x40e606)));
      };
    _0x4a0e1e();
    const _0xee7079 = () => {
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
      _0x595ecb = (_0x426659) => {
        ((this._smartClipMaxSegments = normalizeSmartClipMaxSegments(_0x426659)), _0x4a0e1e());
      },
      _0x1fd6bd = () => {
        if (!_0x176c84?.isConnected) return;
        const _0x118833 = normalizeSmartClipMaxSegments(this._smartClipMaxSegments),
          _0xd3d309 = document.createElement('input');
        ((_0xd3d309.className = 'rh-stepper-input v2-video-clip-maxseg-input'),
          (_0xd3d309.type = 'number'),
          (_0xd3d309.min = String(SMART_CLIP_MIN_SEGMENTS)),
          (_0xd3d309.max = String(SMART_CLIP_MAX_SEGMENTS)),
          (_0xd3d309.step = '1'),
          (_0xd3d309.value = String(_0x118833)));
        let _0x1c5243 = false;
        const _0x237ad4 = (_0x44b2e4) => {
          if (_0x1c5243) return;
          ((_0x1c5243 = true),
            _0x595ecb(_0x44b2e4 ? _0xd3d309.value : _0x118833),
            _0xd3d309.replaceWith(_0x176c84),
            _0x4a0e1e());
        };
        (_0xd3d309.addEventListener('click', (_0x31ff36) => _0x31ff36.stopPropagation()),
          _0xd3d309.addEventListener('mousedown', (_0x127c0f) => _0x127c0f.stopPropagation()),
          _0xd3d309.addEventListener('keydown', (_0x4613cc) => {
            _0x4613cc.stopPropagation();
            if (_0x4613cc.key === 'Enter') _0x237ad4(true);
            if (_0x4613cc.key === 'Escape') _0x237ad4(false);
          }),
          _0xd3d309.addEventListener('blur', () => _0x237ad4(true)),
          _0x176c84.replaceWith(_0xd3d309),
          _0xd3d309.focus(),
          _0xd3d309.select());
      };
    ((this._onSmartClipMaxSegmentDragMove = (_0x201b3a) => {
      const _0x387499 = this._smartClipMaxSegmentDrag;
      if (!_0x387499) return;
      const _0x1e8c81 = _0x201b3a.clientX - _0x387499.x,
        _0x1150ef = Math.trunc(_0x1e8c81 / 6),
        _0x5062bf = normalizeSmartClipMaxSegments(_0x387499.base + _0x1150ef);
      _0x5062bf !== _0x387499.last &&
        ((_0x387499.moved = true), (_0x387499.last = _0x5062bf), _0x595ecb(_0x5062bf));
    }),
      (this._onSmartClipMaxSegmentDragUp = () => {
        const _0xf1ebf8 = this._smartClipMaxSegmentDrag;
        if (!_0xf1ebf8) return;
        (_0xee7079(),
          _0xf1ebf8.moved && ((this._suppressSmartClipMaxSegmentClick = true), _0x595ecb(_0xf1ebf8.last)));
      }));
    const _0x1eb3cc = () => {
        (_0x4f56f1.classList.remove('is-open'),
          this._onSmartClipDocDown &&
            (document.removeEventListener('pointerdown', this._onSmartClipDocDown, true),
            (this._onSmartClipDocDown = null)));
      },
      _0x295efd = () => {
        if (_0x198e16.dataset.loading === 'true') return;
        (_0x4a0e1e(),
          _0x4f56f1.classList.add('is-open'),
          !this._onSmartClipDocDown &&
            ((this._onSmartClipDocDown = (_0xa1ffd3) => {
              if (!this.active) return;
              const _0x1fd237 = _0xa1ffd3?.target;
              if (!_0x1fd237) return;
              if (_0x50a197.contains(_0x1fd237)) return;
              _0x1eb3cc();
            }),
            document.addEventListener('pointerdown', this._onSmartClipDocDown, true)));
      },
      _0x1f2a30 = () => {
        if (_0x4f56f1.classList.contains('is-open')) _0x1eb3cc();
        else _0x295efd();
      },
      _0x32dd56 = (_0x3b1572) => {
        ((this._smartClipMode = _0x3b1572), _0x4a0e1e());
      },
      _0x162a34 = (_0x578546) => {
        ((this._smartClipOutputMode = normalizeSmartClipOutputMode(_0x578546)), _0x4a0e1e());
      },
      _0x210508 = (_0xaec7e7) => {
        ((this._smartClipFps = normalizeSmartClipFps(_0xaec7e7)), _0x4a0e1e());
      };
    (_0x4c48d0.forEach((_0x5be4d3) => {
      _0x5be4d3.onclick = (_0x34c680) => {
        (_0x34c680.stopPropagation(), _0x162a34(_0x5be4d3.dataset.outputMode));
      };
    }),
      [_0x3e3401, _0x5333fb, _0x118aed].forEach((_0x5e37e2) => {
        _0x5e37e2.onclick = (_0x46f12f) => {
          (_0x46f12f.stopPropagation(), _0x32dd56(_0x5e37e2.dataset.mode || 'stable'));
        };
      }),
      _0x362143.forEach((_0x26f6f1) => {
        _0x26f6f1.onclick = (_0x2774ca) => {
          (_0x2774ca.stopPropagation(), _0x210508(_0x26f6f1.dataset.fps));
        };
      }),
      (_0x176c84.onmousedown = (_0xc0206e) => {
        if (_0xc0206e.button !== 0) return;
        (_0xc0206e.preventDefault(), _0xc0206e.stopPropagation());
        const _0x46e344 = document,
          _0x17d6db = normalizeSmartClipMaxSegments(this._smartClipMaxSegments);
        (_0xee7079(),
          (this._smartClipMaxSegmentDrag = {
            x: _0xc0206e.clientX,
            base: _0x17d6db,
            last: _0x17d6db,
            moved: false,
            el: _0x176c84,
            doc: _0x46e344,
          }),
          _0x176c84.classList.add('is-dragging'),
          _0x46e344.addEventListener('mousemove', this._onSmartClipMaxSegmentDragMove),
          _0x46e344.addEventListener('mouseup', this._onSmartClipMaxSegmentDragUp));
      }),
      (_0x176c84.onclick = (_0x2e5d91) => {
        _0x2e5d91.stopPropagation();
        if (this._suppressSmartClipMaxSegmentClick) {
          this._suppressSmartClipMaxSegmentClick = false;
          return;
        }
        _0x1fd6bd();
      }),
      (_0x176c84.onkeydown = (_0x3572f5) => {
        _0x3572f5.stopPropagation();
        if (_0x3572f5.key === 'Enter' || _0x3572f5.key === ' ') {
          (_0x3572f5.preventDefault(), _0x1fd6bd());
          return;
        }
        if (_0x3572f5.key === 'ArrowRight' || _0x3572f5.key === 'ArrowUp') {
          (_0x3572f5.preventDefault(), _0x595ecb(Number(this._smartClipMaxSegments) + 1));
          return;
        }
        (_0x3572f5.key === 'ArrowLeft' || _0x3572f5.key === 'ArrowDown') &&
          (_0x3572f5.preventDefault(), _0x595ecb(Number(this._smartClipMaxSegments) - 1));
      }),
      (_0x436f98.onclick = (_0x4f168b) => {
        (_0x4f168b.stopPropagation(), _0x1eb3cc());
      }));
    const _0x5822e4 = async ({
      mode: _0x3c59d3,
      maxSegments: _0x48dfa5,
      fps: _0x262daf,
      outputMode: _0x1db762,
    }) => {
      const _0x52eb6 = normalizeSmartClipOutputMode(_0x1db762),
        _0x11d6c2 = _0x52eb6 === SMART_CLIP_OUTPUT_MODE_KEYFRAMES;
      ((_0x198e16.dataset.loading = 'true'),
        (_0x198e16.disabled = true),
        (_0x198e16.innerHTML = _0xb9e80d + ' ' + escapeClipHelperHtml(videoClipText('smartClip.preparing'))),
        window.showToast?.(
          _0x11d6c2
            ? videoClipText('smartClip.startedKeyframes')
            : videoClipText('smartClip.startedSegments'),
          'info',
        ));
      try {
        const _0x1c110c = await runSmartClipFromVideoNode({
          nodeId: this.anchorNodeId,
          options: { mode: _0x3c59d3, maxSegments: _0x48dfa5, fps: _0x262daf, outputMode: _0x52eb6 },
          shouldContinue: () => this.active,
          onProgress: (_0x210102) => {
            if (!_0x198e16?.isConnected || !_0x210102?.text) return;
            _0x198e16.innerHTML = _0xb9e80d + ' ' + _0x210102.text;
          },
        });
        if (!_0x1c110c?.ok) {
          window.showToast?.(
            _0x1c110c?.reason === 'no-segments'
              ? videoClipText('smartClip.noSegments')
              : _0x11d6c2
                ? videoClipText('smartClip.noKeyframes')
                : videoClipText('smartClip.noResults'),
            _0x1c110c?.reason === 'no-segments' ? 'info' : 'error',
          );
          return;
        }
        (window.showToast?.(
          _0x11d6c2
            ? videoClipText('smartClip.completeKeyframes', { count: _0x1c110c.nodeIds.length })
            : videoClipText('smartClip.completeSegments', { count: _0x1c110c.nodeIds.length }),
          'success',
        ),
          this.exit({ silent: true }));
      } catch (_0x1f457b) {
        const _0x56d457 =
          _0x1f457b instanceof Error
            ? _0x1f457b.message
            : String(_0x1f457b || videoClipText('errors.smartClipFailed'));
        window.showToast?.(videoClipText('smartClip.failedWithError', { error: _0x56d457 }), 'error');
      } finally {
        (_0x1eb3cc(),
          _0x198e16 &&
            _0x198e16.isConnected &&
            ((_0x198e16.dataset.loading = 'false'),
            (_0x198e16.disabled = false),
            (_0x198e16.innerHTML = _0x42c4c0 + ' ' + _0x1da1ba())));
      }
    };
    ((_0x28ee11.onclick = async (_0x56bfe6) => {
      (_0x56bfe6.stopPropagation(), _0x1eb3cc());
      const _0x32c4f8 = this._smartClipMode || 'stable',
        _0x427188 = normalizeSmartClipMaxSegments(this._smartClipMaxSegments),
        _0xe5ddcd = normalizeSmartClipFps(this._smartClipFps),
        _0x50bb4f = normalizeSmartClipOutputMode(this._smartClipOutputMode);
      await _0x5822e4({ mode: _0x32c4f8, maxSegments: _0x427188, fps: _0xe5ddcd, outputMode: _0x50bb4f });
    }),
      (_0x198e16.onclick = (_0x254bc7) => {
        (_0x254bc7.stopPropagation(), _0x1f2a30());
      }),
      (_0x29a0a9.onclick = async (_0x47b6f4) => {
        (_0x47b6f4.stopPropagation(), _0x1eb3cc());
        if (_0x29a0a9.dataset.loading === 'true') return;
        ((_0x29a0a9.dataset.loading = 'true'),
          (_0x29a0a9.disabled = true),
          (_0x29a0a9.innerHTML = _0xb9e80d));
        try {
          const _0x2604d4 = this.videoEl || this._getVideoEl();
          await extractCurrentVideoFrameToImageNode({
            videoEl: _0x2604d4,
            anchorNodeId: this.anchorNodeId,
            fallbackDurationSec: this._readDurationSec(_0x2604d4) || this.durationSec,
            logPrefix: '[VideoClipController]',
          });
        } finally {
          _0x29a0a9 &&
            _0x29a0a9.isConnected &&
            ((_0x29a0a9.dataset.loading = 'false'),
            (_0x29a0a9.disabled = false),
            (_0x29a0a9.innerHTML = _0x1471ca));
        }
      }),
      _0x50a197.appendChild(_0x198e16),
      _0x50a197.appendChild(_0x4f56f1),
      _0x1c5d2a.appendChild(_0x50a197),
      _0x1c5d2a.appendChild(_0x29a0a9),
      _0x1e4ae9.appendChild(_0x3d4236),
      _0x1e4ae9.appendChild(_0x1c5d2a),
      _0x5a4086.appendChild(_0x359137),
      _0x5a4086.appendChild(_0x218b70),
      _0x5a4086.appendChild(_0x20411f),
      _0x13f4c5.appendChild(_0x57bef5),
      _0x13f4c5.appendChild(_0x5a4086),
      _0x13f4c5.appendChild(_0x1d6625),
      _0x13f4c5.appendChild(_0x24fae7),
      _0x13f4c5.appendChild(_0x2cbb58),
      _0x266f0c.appendChild(_0x1b72a6),
      _0x266f0c.appendChild(_0x13f4c5),
      _0x266f0c.appendChild(_0xd8c9ed),
      _0x5e4f92.appendChild(_0x266f0c),
      _0x5e4f92.appendChild(_0x1e4ae9),
      this.wrapperEl.appendChild(_0x5e4f92),
      (this.barEl = _0x5e4f92),
      (this.cancelBtnEl = _0x1b72a6),
      (this.confirmBtnEl = _0xd8c9ed),
      (this.trackEl = _0x13f4c5),
      (this.selectionEl = _0x359137),
      (this.leftHandleEl = _0x218b70),
      (this.rightHandleEl = _0x20411f),
      (this.playheadEl = _0x1d6625),
      (this.labelEl = _0x2cbb58),
      (this.thumbEls = _0x4ed579));
  },
  _bindEvents() {
    if (!this.barEl) return;
    (this.cancelBtnEl?.addEventListener('click', (_0x3e51e4) => {
      (_0x3e51e4.stopPropagation(), this.exit());
    }),
      this.confirmBtnEl?.addEventListener('click', (_0x53020a) => {
        (_0x53020a.stopPropagation(), this._confirm());
      }));
    const _0x594cbf = (_0x456ef4) => {
      if (!this.trackEl || !this.active || this._dragMode) return;
      const _0x261522 = _0x456ef4.clientX,
        _0xb88501 = this.selectionEl.getBoundingClientRect(),
        _0x22e2b8 = 20,
        _0x185a4e = Math.abs(_0x261522 - _0xb88501.left) < _0x22e2b8,
        _0x4d5971 = Math.abs(_0x261522 - _0xb88501.right) < _0x22e2b8;
      if (_0x185a4e)
        (this.leftHandleEl.classList.add('hover-active'),
          this.rightHandleEl.classList.remove('hover-active'),
          (this.selectionEl.style.cursor = 'var(--resize-ew-cursor)'));
      else
        _0x4d5971
          ? (this.rightHandleEl.classList.add('hover-active'),
            this.leftHandleEl.classList.remove('hover-active'),
            (this.selectionEl.style.cursor = 'var(--resize-ew-cursor)'))
          : (this.leftHandleEl.classList.remove('hover-active'),
            this.rightHandleEl.classList.remove('hover-active'),
            (this.selectionEl.style.cursor = 'var(--grab-cursor)'));
    };
    this.trackEl?.addEventListener('pointermove', _0x594cbf);
    const _0x3f4bf9 = 30,
      _0x1f3109 = (_0x272d46) => (Number(_0x272d46 || 1) / _0x3f4bf9) * 1,
      _0x1b9f2b = () => {
        const _0x3c2c5e = this.durationSec;
        if (!Number.isFinite(_0x3c2c5e) || _0x3c2c5e <= 0) return 0.1;
        return Math.min(0.1, _0x3c2c5e);
      },
      _0x409ea2 = (_0x1824fc, _0x24a51e, _0x4712c1) => Math.max(_0x24a51e, Math.min(_0x4712c1, _0x1824fc)),
      _0x25a17d = (_0x455632) => {
        if (!this.trackEl || !this.active) return;
        const _0x123158 = this.durationSec;
        if (!Number.isFinite(_0x123158) || _0x123158 <= 0) return;
        const _0x2cbacc = this.videoEl || this._getVideoEl();
        if (!_0x2cbacc) return;
        const _0x49c662 = this.trackEl.getBoundingClientRect();
        if (!_0x49c662.width) return;
        const _0x558994 = _0x455632 - _0x49c662.left,
          _0x193213 = _0x409ea2(_0x558994 / _0x49c662.width, 0, 1),
          _0x460ecc = _0x193213 * _0x123158,
          _0x56e518 = Math.max(0, _0x123158 - 0.001);
        try {
          _0x2cbacc.currentTime = _0x409ea2(_0x460ecc, 0, _0x56e518);
        } catch (_0x216f1d) {}
        this._renderPlayhead();
      },
      _0x72c8d4 = () => {
        const _0x558f78 = this.videoEl || this._getVideoEl();
        if (!_0x558f78) return;
        if (!_0x558f78.paused) return;
        const _0x1e74b8 = Number(_0x558f78.currentTime) || 0;
        if (_0x1e74b8 >= this.startSec && _0x1e74b8 <= this.endSec) return;
        try {
          _0x558f78.currentTime = this.startSec;
        } catch (_0x1f123b) {}
      },
      _0x3d603a = (_0x329d93, _0x3dda7c) => {
        const _0x252694 = this.durationSec;
        if (!Number.isFinite(_0x252694) || _0x252694 <= 0) return;
        const _0x5f5dab = this._pauseRangePlaybackForRangeEdit(),
          _0x399a11 = _0x1f3109(_0x3dda7c) * (_0x329d93 >= 0 ? 1 : -1),
          _0x5284ff = _0x1b9f2b(),
          _0x3dfd0a = Math.max(_0x5284ff, this.endSec - this.startSec);
        let _0x412d8b = this.startSec + _0x399a11,
          _0x4e53a8 = this.endSec + _0x399a11;
        _0x412d8b < 0 && ((_0x412d8b = 0), (_0x4e53a8 = _0x3dfd0a));
        _0x4e53a8 > _0x252694 && ((_0x4e53a8 = _0x252694), (_0x412d8b = Math.max(0, _0x252694 - _0x3dfd0a)));
        ((this.startSec = _0x412d8b), (this.endSec = _0x4e53a8));
        if (_0x5f5dab)
          try {
            _0x5f5dab.currentTime = _0x412d8b;
          } catch (_0x76e327) {}
        else _0x72c8d4();
        this._render();
      },
      _0x1e7d77 = (_0xc688e7) => {
        const _0x1809c7 = this.durationSec;
        if (!Number.isFinite(_0x1809c7) || _0x1809c7 <= 0) return;
        const _0x131dd6 = this._pauseRangePlaybackForRangeEdit(),
          _0xe6df2e = _0x1f3109(1) * (_0xc688e7 >= 0 ? 1 : -1),
          _0x4bc57a = _0x1b9f2b(),
          _0x5fd772 = Math.max(0, this.endSec - _0x4bc57a);
        this.startSec = _0x409ea2(this.startSec + _0xe6df2e, 0, _0x5fd772);
        if (_0x131dd6)
          try {
            _0x131dd6.currentTime = this.startSec;
          } catch (_0xbf00d9) {}
        this._render();
      },
      _0x5cb3f8 = (_0x283bbb) => {
        const _0x314e98 = this.durationSec;
        if (!Number.isFinite(_0x314e98) || _0x314e98 <= 0) return;
        const _0x46eed5 = this._pauseRangePlaybackForRangeEdit(),
          _0x2bd4f9 = _0x1f3109(1) * (_0x283bbb >= 0 ? 1 : -1),
          _0x525c1a = _0x1b9f2b(),
          _0x3864cc = Math.min(_0x314e98, this.startSec + _0x525c1a);
        this.endSec = _0x409ea2(this.endSec + _0x2bd4f9, _0x3864cc, _0x314e98);
        if (_0x46eed5)
          try {
            _0x46eed5.currentTime = this.endSec;
          } catch (_0x52d384) {}
        this._render();
      },
      _0x3fa9de = (_0x4768b7) => {
        const _0x27b31d = this.durationSec;
        if (!Number.isFinite(_0x27b31d) || _0x27b31d <= 0) return;
        const _0xfe661b = this.videoEl || this._getVideoEl();
        if (!_0xfe661b) return;
        this._pauseRangePlaybackForRangeEdit(_0xfe661b);
        let _0x491ba6 = Number(_0xfe661b.currentTime) || 0;
        _0x491ba6 = _0x409ea2(_0x491ba6, 0, _0x27b31d);
        const _0x191a0d = _0x1b9f2b();
        if (_0x4768b7 === 'in') {
          const _0x4642c4 = Math.max(0, this.endSec - _0x191a0d);
          this.startSec = _0x409ea2(_0x491ba6, 0, _0x4642c4);
        } else {
          const _0x40e658 = Math.min(_0x27b31d, this.startSec + _0x191a0d);
          this.endSec = _0x409ea2(_0x491ba6, _0x40e658, _0x27b31d);
        }
        this._render();
      },
      _0x1dce06 = (_0x308d5f) => {
        if (!this.trackEl || !this.active) return;
        const _0x199335 = _0x308d5f.target.closest('.v2-video-cliphandle'),
          _0xaf0e91 = !!_0x308d5f.target.closest('.v2-video-clipselection'),
          _0x14a385 = this.trackEl.getBoundingClientRect();
        if (!_0x14a385.width) return;
        const _0x19b4f3 = _0x308d5f.clientX,
          _0x4b304a = this.selectionEl.getBoundingClientRect(),
          _0x4f832d = 20,
          _0x4c791f = Math.abs(_0x19b4f3 - _0x4b304a.left) < _0x4f832d,
          _0x53a108 = Math.abs(_0x19b4f3 - _0x4b304a.right) < _0x4f832d;
        if (_0x4c791f || (_0x199335 && _0x199335.dataset.handle === 'left'))
          ((this._dragMode = 'left'), this.leftHandleEl.classList.add('hover-active'));
        else {
          if (_0x53a108 || (_0x199335 && _0x199335.dataset.handle === 'right'))
            ((this._dragMode = 'right'), this.rightHandleEl.classList.add('hover-active'));
          else {
            if (_0xaf0e91) this._dragMode = 'move';
            else {
              this._dragMode = 'scrub';
              const _0x41f752 = this.videoEl || this._getVideoEl();
              if (_0x41f752)
                try {
                  if (!_0x41f752.paused) _0x41f752.pause();
                } catch (_0x3e1f70) {}
            }
          }
        }
        if (this._dragMode === 'move') {
          const _0x250eaa = this.selectionEl.getBoundingClientRect();
          this._dragOffsetPx = _0x308d5f.clientX - _0x250eaa.left;
        } else this._dragOffsetPx = 0;
        (_0x308d5f.preventDefault(), _0x308d5f.stopPropagation());
        if (this._dragMode === 'scrub') _0x25a17d(_0x308d5f.clientX);
        else this._handleDragAtClientX(_0x308d5f.clientX);
        ((this._onPointerMove = (_0x14dc3b) => {
          (_0x14dc3b.preventDefault(), _0x14dc3b.stopPropagation());
          if (this._dragMode === 'scrub') _0x25a17d(_0x14dc3b.clientX);
          else this._handleDragAtClientX(_0x14dc3b.clientX);
        }),
          (this._onPointerUp = (_0x1cfb18) => {
            (_0x1cfb18.preventDefault(),
              _0x1cfb18.stopPropagation(),
              window.removeEventListener('pointermove', this._onPointerMove, true),
              window.removeEventListener('pointerup', this._onPointerUp, true),
              (this._dragMode = null),
              this.leftHandleEl?.classList.remove('hover-active'),
              this.rightHandleEl?.classList.remove('hover-active'));
          }),
          window.addEventListener('pointermove', this._onPointerMove, true),
          window.addEventListener('pointerup', this._onPointerUp, true));
      };
    (this.trackEl?.addEventListener('pointerdown', _0x1dce06),
      this.trackEl?.addEventListener(
        'wheel',
        (_0x447c18) => {
          if (!this.active) return;
          (_0x447c18.preventDefault(), _0x447c18.stopPropagation());
          const _0x2cb54a = Number(_0x447c18.deltaX) || 0,
            _0x5292a7 = Number(_0x447c18.deltaY) || 0,
            _0x1e2752 = Math.abs(_0x2cb54a) > Math.abs(_0x5292a7) ? _0x2cb54a : _0x5292a7;
          if (!_0x1e2752) return;
          const _0x44b134 = _0x1e2752 > 0 ? 1 : -1;
          if (_0x447c18.ctrlKey || _0x447c18.metaKey) _0x1e7d77(_0x44b134);
          else {
            if (_0x447c18.altKey) _0x5cb3f8(_0x44b134);
            else {
              const _0x433367 = _0x447c18.shiftKey ? 10 : 1;
              _0x3d603a(_0x44b134, _0x433367);
            }
          }
        },
        { passive: false },
      ),
      this.selectionEl?.addEventListener('dblclick', (_0x308505) => {
        if (!this.active) return;
        (_0x308505.preventDefault(), _0x308505.stopPropagation());
        const _0x4226a9 = this.durationSec;
        if (!_0x4226a9 || !Number.isFinite(_0x4226a9) || _0x4226a9 <= 0) return;
        const _0x477f7b = this.selectionEl.getBoundingClientRect(),
          _0x20d9d5 = _0x308505.clientX,
          _0x1e387e = 24;
        if (_0x20d9d5 - _0x477f7b.left < _0x1e387e || _0x477f7b.right - _0x20d9d5 < _0x1e387e) return;
        const _0x40c2d1 = Math.min(3, _0x4226a9),
          _0x4d14b6 = (this.startSec + this.endSec) / 2,
          _0x810af = Math.max(0, Math.min(_0x4226a9 - _0x40c2d1, _0x4d14b6 - _0x40c2d1 / 2)),
          _0x126f60 = this._pauseRangePlaybackForRangeEdit();
        ((this.startSec = _0x810af), (this.endSec = _0x810af + _0x40c2d1));
        if (_0x126f60 && _0x126f60.paused) _0x126f60.currentTime = this.startSec;
        this._render();
      }),
      (this._onKeyDown = (_0x6ba148) => {
        if (!this.active) return;
        if (_0x6ba148.key === 'Escape') {
          (_0x6ba148.preventDefault(), this.exit());
          return;
        }
        if (_0x6ba148.key === ' ' || _0x6ba148.code === 'Space') {
          this._handlePlaybackShortcutKey(_0x6ba148);
          return;
        }
        if (_0x6ba148.key === 'i' || _0x6ba148.key === 'I') {
          (_0x6ba148.preventDefault(), _0x3fa9de('in'));
          return;
        }
        if (_0x6ba148.key === 'o' || _0x6ba148.key === 'O') {
          (_0x6ba148.preventDefault(), _0x3fa9de('out'));
          return;
        }
        if (_0x6ba148.key === 'ArrowLeft' || _0x6ba148.key === 'ArrowRight') {
          _0x6ba148.preventDefault();
          const _0x4ea91a = _0x6ba148.key === 'ArrowRight' ? 1 : -1;
          if (_0x6ba148.ctrlKey || _0x6ba148.metaKey) {
            _0x1e7d77(_0x4ea91a);
            return;
          }
          if (_0x6ba148.altKey) {
            _0x5cb3f8(_0x4ea91a);
            return;
          }
          const _0x3da4db = _0x6ba148.shiftKey ? 10 : 1;
          _0x3d603a(_0x4ea91a, _0x3da4db);
        }
      }),
      window.addEventListener('keydown', this._onKeyDown, true),
      this._onDocClick &&
        (document.removeEventListener('pointerdown', this._onDocClick, true), (this._onDocClick = null)),
      (this._onDocClick = (_0x1369c2) => {
        if (!this.active || !this.barEl) return;
        if (this.barEl.contains(_0x1369c2.target)) return;
        this.exit({ silent: true });
      }),
      document.addEventListener('pointerdown', this._onDocClick, true));
  },
  _getVideoEl() {
    if (!this.wrapperEl) return null;
    const _0x5e13e1 = Array.from(this.wrapperEl.querySelectorAll('video'));
    let _0x4b0045 = null,
      _0x2a9971 = null;
    for (const _0xc8f95c of _0x5e13e1) {
      if (!_0xc8f95c) continue;
      const _0x5a8cd7 = window.getComputedStyle(_0xc8f95c);
      if (_0x5a8cd7.display === 'none' || _0x5a8cd7.visibility === 'hidden') continue;
      const _0x127d7d = Number(_0x5a8cd7.opacity);
      if (Number.isFinite(_0x127d7d) && _0x127d7d <= 0) continue;
      const _0x3b6bfe = _0xc8f95c.getBoundingClientRect();
      if (!_0x3b6bfe.width || !_0x3b6bfe.height) continue;
      if (!_0x4b0045) _0x4b0045 = _0xc8f95c;
      const _0x30df40 = String(_0xc8f95c.currentSrc || _0xc8f95c.getAttribute('src') || '').trim();
      if (_0x30df40) {
        _0x2a9971 = _0xc8f95c;
        break;
      }
    }
    return ((this.videoEl = _0x2a9971 || _0x4b0045 || null), this.videoEl);
  },
  _getVideoElementSource(_0x28fab9) {
    return String(_0x28fab9?.getAttribute?.('src') || _0x28fab9?.currentSrc || _0x28fab9?.src || '').trim();
  },
  _setClipMediaKeepAlive(_0xe35b8b, _0x5eb777) {
    if (!_0xe35b8b?.dataset) return;
    if (_0x5eb777) {
      _0xe35b8b.dataset.desktopMediaKeepAlive = 'video-clip';
      return;
    }
    _0xe35b8b.dataset.desktopMediaKeepAlive === 'video-clip' &&
      delete _0xe35b8b.dataset.desktopMediaKeepAlive;
  },
  _readDurationSec(_0x45a952) {
    if (!_0x45a952) return 0;
    const _0x1fdd14 = Number(_0x45a952.duration);
    if (Number.isFinite(_0x1fdd14) && _0x1fdd14 > 0) return _0x1fdd14;
    const _0x255989 = _0x45a952.seekable;
    if (_0x255989 && _0x255989.length) {
      const _0x5ca9d6 = Number(_0x255989.end(_0x255989.length - 1));
      if (Number.isFinite(_0x5ca9d6) && _0x5ca9d6 > 0) return _0x5ca9d6;
    }
    return 0;
  },
  _resolveKnownDurationSec(_0x556c3e) {
    const _0x452d96 = pickSelectedVideoItem(_0x556c3e),
      _0x52dacf = pickPositiveNumber(
        _0x452d96?.videoDuration,
        _0x452d96?.duration,
        _0x556c3e?.videoDuration,
        _0x556c3e?.duration,
      );
    if (_0x52dacf > 0) return _0x52dacf;
    const _0x40cbc8 = pickPositiveNumber(
        _0x452d96?.videoFrameCount,
        _0x452d96?.frameCount,
        _0x556c3e?.videoFrameCount,
        _0x556c3e?.frameCount,
      ),
      _0x447d0e = pickPositiveNumber(
        _0x452d96?.videoFps,
        _0x452d96?.fps,
        _0x556c3e?.videoFps,
        _0x556c3e?.fps,
      );
    return _0x40cbc8 > 0 && _0x447d0e > 0 ? _0x40cbc8 / _0x447d0e : 0;
  },
  _applyDurationSec(_0x4b1b3c) {
    const _0x41ee23 = Number(_0x4b1b3c);
    if (!Number.isFinite(_0x41ee23) || _0x41ee23 <= 0) return false;
    this.durationSec = _0x41ee23;
    if (!(this.endSec > this.startSec)) {
      const _0x1bb468 = Math.min(3, _0x41ee23),
        _0x4ab9bb = Math.max(0, (_0x41ee23 - _0x1bb468) / 2);
      return ((this.startSec = _0x4ab9bb), (this.endSec = _0x4ab9bb + _0x1bb468), true);
    }
    ((this.startSec = Math.max(0, Math.min(this.startSec, _0x41ee23))),
      (this.endSec = Math.max(0, Math.min(this.endSec, _0x41ee23))));
    if (this.endSec <= this.startSec) {
      const _0x2e2797 = Math.min(3, _0x41ee23);
      ((this.startSec = 0), (this.endSec = _0x2e2797));
    }
    return true;
  },
  async _applyVideoMetaDurationFallback(_0x227ce1, _0x27c21b) {
    const _0x3d0e7d = String(_0x227ce1 || '').trim();
    if (!_0x3d0e7d) return;
    try {
      const _0xc3947c = await fetchVideoMetaFromServer(_0x3d0e7d);
      if (!this.active || _0x27c21b !== this._sourceToken) return;
      const _0xf9ad91 =
          _0xc3947c && typeof _0xc3947c === 'object' && _0xc3947c.data ? _0xc3947c.data : _0xc3947c,
        _0x32fcef = pickPositiveNumber(
          _0xf9ad91?.duration,
          _0xf9ad91?.videoDuration,
          _0xf9ad91?.format?.duration,
          _0xf9ad91?.stream?.duration,
        );
      this._applyDurationSec(_0x32fcef) && (this._render(), this._startPlayheadLoop());
    } catch (_0x45efe6) {}
  },
  async _syncDurationAndDefaults() {
    const _0x4cf8b8 = appStore.getState().nodes?.[this.nodeId],
      _0x2ba67a = this._resolveVideoSrcFromNode(_0x4cf8b8),
      _0xa62c19 = String(_0x2ba67a || '').trim(),
      _0x4b0244 = ++this._sourceToken;
    this.videoEl = this._getVideoEl();
    this._applyDurationSec(this._resolveKnownDurationSec(_0x4cf8b8)) && this._render();
    if (this.videoEl) {
      const _0x4717ce = String(this.videoEl.dataset?.videoClipSourceUrl || '').trim();
      this._setClipMediaKeepAlive(this.videoEl, true);
      try {
        this.videoEl.pause();
      } catch (_0x203196) {}
      try {
        this.videoEl.loop = false;
      } catch (_0x5f3001) {}
      if (_0xa62c19 && _0x4717ce !== _0xa62c19) {
        await attachDesktopMediaPlaybackSource(this.videoEl, _0xa62c19);
        if (!this.active || _0x4b0244 !== this._sourceToken) return;
        if (!this._getVideoElementSource(this.videoEl)) {
          ((this.videoEl.preload = 'metadata'), (this.videoEl.src = _0xa62c19));
          try {
            this.videoEl.load?.();
          } catch (_0x2ca1f7) {}
        }
        this.videoEl.dataset && (this.videoEl.dataset.videoClipSourceUrl = _0xa62c19);
      }
    }
    const _0x1a7e9c = this._readDurationSec(this.videoEl);
    if (this._applyDurationSec(_0x1a7e9c)) this._render();
    else
      !(this.durationSec > 0) && _0xa62c19 && void this._applyVideoMetaDurationFallback(_0xa62c19, _0x4b0244);
    (this.videoEl &&
      ((this._onLoadedMeta = () => {
        if (!this.active) return;
        const _0x582d12 = this._readDurationSec(this.videoEl);
        (this._applyDurationSec(_0x582d12, this.videoEl), this._render());
      }),
      (this._onDurationChange = () => {
        if (!this.active) return;
        const _0x22687e = this._readDurationSec(this.videoEl);
        (this._applyDurationSec(_0x22687e, this.videoEl), this._render());
      }),
      this.videoEl.addEventListener('loadedmetadata', this._onLoadedMeta, { once: true }),
      this.videoEl.addEventListener('durationchange', this._onDurationChange)),
      this._renderThumbs(),
      this._startPlayheadLoop());
  },
  _startPlayheadLoop() {
    if (this._playheadRaf) cancelAnimationFrame(this._playheadRaf);
    const _0x13ea6a = () => {
      if (!this.active) return;
      (this._renderPlayhead(), (this._playheadRaf = requestAnimationFrame(_0x13ea6a)));
    };
    this._playheadRaf = requestAnimationFrame(_0x13ea6a);
  },
  _renderPlayhead() {
    if (!this.playheadEl || !this.trackEl) return;
    const _0x265c3d = this.durationSec;
    if (!Number.isFinite(_0x265c3d) || _0x265c3d <= 0) {
      this.playheadEl.style.display = 'none';
      return;
    }
    const _0xf09a2b = this.videoEl || this._getVideoEl();
    if (!_0xf09a2b) {
      this.playheadEl.style.display = 'none';
      return;
    }
    let _0xc331ae = Number(_0xf09a2b.currentTime) || 0;
    if (_0xc331ae < this.startSec || _0xc331ae > this.endSec) {
      if (!_0xf09a2b.paused && !_0xf09a2b.seeking && this._rangeLoopSeekPending !== true) {
        this._rangeLoopSeekPending = true;
        try {
          _0xf09a2b.currentTime = this.startSec;
        } catch (_0x475d68) {}
        _0xc331ae = this.startSec;
      }
    } else !_0xf09a2b.seeking && (this._rangeLoopSeekPending = false);
    const _0x3bc06a = Math.max(0, Math.min(1, _0xc331ae / _0x265c3d));
    ((this.playheadEl.style.display = 'block'), (this.playheadEl.style.left = _0x3bc06a * 100 + '%'));
  },
  _handlePlaybackShortcutKey(_0x1e3c0e) {
    if (!this.active) return false;
    if (!(_0x1e3c0e?.key === ' ' || _0x1e3c0e?.code === 'Space')) return false;
    (_0x1e3c0e.preventDefault?.(), _0x1e3c0e.stopPropagation?.());
    if (!_0x1e3c0e.repeat) void this._togglePlayRange();
    return true;
  },
  _pauseRangePlaybackForRangeEdit(_0x1b0a06 = this.videoEl || this._getVideoEl()) {
    ((this._rangePlaybackSeq += 1), (this._rangeLoopSeekPending = false));
    if (!_0x1b0a06) return null;
    try {
      if (!_0x1b0a06.paused) _0x1b0a06.pause();
    } catch (_0x278547) {}
    return _0x1b0a06;
  },
  async _togglePlayRange() {
    const _0x354ea8 = ++this._rangePlaybackSeq,
      _0x360919 = this._getVideoEl();
    if (!_0x360919) return false;
    await this._ensureVideoPlaybackSource(_0x360919);
    if (!this.active || _0x354ea8 !== this._rangePlaybackSeq) return false;
    let _0x1988b5 = Number(this.durationSec);
    if (!Number.isFinite(_0x1988b5) || _0x1988b5 <= 0) {
      _0x1988b5 = this._readDurationSec(_0x360919);
      if (!Number.isFinite(_0x1988b5) || _0x1988b5 <= 0) return false;
      if (this._applyDurationSec(_0x1988b5)) this._render();
    }
    try {
      if (!_0x360919.paused) return (_0x360919.pause(), this._renderPlayhead(), true);
    } catch (_0x563d72) {}
    const _0x14bb47 = Math.max(0, Math.min(this.startSec, _0x1988b5)),
      _0x475b16 = Math.max(_0x14bb47, Math.min(this.endSec, _0x1988b5));
    if (!(_0x475b16 > _0x14bb47)) return false;
    const _0x3d25f3 = Number(_0x360919.currentTime) || 0;
    (_0x3d25f3 < _0x14bb47 || _0x3d25f3 >= _0x475b16) &&
      (await this._seekVideoForRangePlayback(_0x360919, _0x14bb47));
    if (!this.active || _0x354ea8 !== this._rangePlaybackSeq) return false;
    const _0x41226c = await playVideoWithRecovery(_0x360919, {
      label: 'video-clip:' + (this.nodeId || 'unknown') + ':range',
      ensureSrc: () => this._ensureVideoPlaybackSource(_0x360919),
      minBufferAhead: 0.5,
      readyTimeoutMs: 0x1f4,
      recoveryDebounceMs: 150,
      recoveryCooldownMs: 0x1f4,
      shouldRecover: (_0x3a49) =>
        this.active === true &&
        this.videoEl === _0x3a49 &&
        _0x3a49?.isConnected !== false &&
        !_0x3a49?.paused,
      shouldContinue: () =>
        this.active === true && _0x354ea8 === this._rangePlaybackSeq && this.videoEl === _0x360919,
    });
    return (_0x41226c && ((this._rangeLoopSeekPending = false), this._renderPlayhead()), _0x41226c);
  },
  async _ensureVideoPlaybackSource(_0x534dcf = this.videoEl) {
    if (!_0x534dcf) return false;
    if (this._getVideoElementSource(_0x534dcf)) {
      if (_0x534dcf.preload !== 'auto') _0x534dcf.preload = 'auto';
      return true;
    }
    const _0x1e6d7a = appStore.getState().nodes?.[this.nodeId],
      _0x2d5626 = String(this._resolveVideoSrcFromNode(_0x1e6d7a) || '').trim();
    if (!_0x2d5626) return false;
    await attachDesktopMediaPlaybackSource(_0x534dcf, _0x2d5626, { preload: 'auto' });
    if (_0x534dcf.dataset) _0x534dcf.dataset.videoClipSourceUrl = _0x2d5626;
    return !!this._getVideoElementSource(_0x534dcf);
  },
  async _seekVideoForRangePlayback(_0x131bbd, _0x1108aa) {
    if (!_0x131bbd) return false;
    const _0xaac938 = Math.max(0, Number(_0x1108aa) || 0),
      _0x4f37f4 = Number(_0x131bbd.currentTime || 0);
    if (
      Math.abs(_0x4f37f4 - _0xaac938) <= VIDEO_CLIP_SEEK_EPSILON_SEC &&
      Number(_0x131bbd.readyState || 0) >= 2 &&
      !_0x131bbd.seeking
    )
      return true;
    this._rangeLoopSeekPending = true;
    try {
      _0x131bbd.currentTime = _0xaac938;
    } catch (_0x22f155) {}
    return (await this._waitForRangePlaybackSeek(_0x131bbd), (this._rangeLoopSeekPending = false), true);
  },
  _waitForRangePlaybackSeek(_0x137e8e) {
    if (!_0x137e8e || (Number(_0x137e8e.readyState || 0) >= 2 && !_0x137e8e.seeking))
      return Promise.resolve(true);
    return new Promise((_0x1c692c) => {
      let _0x1d6939 = false;
      const _0x15fde1 = ['seeked', 'canplay', 'canplaythrough', 'loadeddata', 'timeupdate'],
        _0x2185d8 = () => {
          if (_0x1d6939) return;
          ((_0x1d6939 = true),
            clearTimeout(_0x5da656),
            _0x15fde1.forEach((_0x3a429a) => _0x137e8e.removeEventListener?.(_0x3a429a, _0x24890e)),
            _0x137e8e.removeEventListener?.('error', _0x24890e),
            _0x137e8e.removeEventListener?.('abort', _0x24890e),
            _0x1c692c(true));
        },
        _0x24890e = () => {
          if (Number(_0x137e8e.readyState || 0) >= 2 || !_0x137e8e.seeking) _0x2185d8();
        },
        _0x5da656 = setTimeout(_0x2185d8, VIDEO_CLIP_PLAY_SEEK_TIMEOUT_MS);
      (_0x15fde1.forEach((_0x3ad41d) => _0x137e8e.addEventListener?.(_0x3ad41d, _0x24890e)),
        _0x137e8e.addEventListener?.('error', _0x24890e),
        _0x137e8e.addEventListener?.('abort', _0x24890e));
    });
  },
  _resolveVideoSrcFromNode(_0x3feeca) {
    return resolveVideoClipSourceUrl(_0x3feeca);
  },
  async _renderThumbs() {
    const _0xa52178 = ++this._thumbToken,
      _0x3335e8 = Array.isArray(this.thumbEls) ? this.thumbEls : [];
    if (!_0x3335e8.length) return;
    const _0x59bb7a = appStore.getState().nodes[this.nodeId],
      _0x355cb0 = this._resolveVideoSrcFromNode(_0x59bb7a);
    if (!_0x355cb0) return;
    const _0xf73ba8 = _0x3335e8.length;
    let _0x4a79f0, _0x56986a, _0x4570b7;
    const _0xbdfd80 = (_0x13d800, _0x77db7b) =>
      new Promise((_0x3f4592, _0x10c3f0) => {
        let _0xf2abdd = false;
        const _0x47d17f = () => {
            (_0x13d800.removeEventListener('seeked', _0x186335),
              _0x13d800.removeEventListener('error', _0x508699));
          },
          _0x186335 = () => {
            if (_0xf2abdd) return;
            ((_0xf2abdd = true), _0x47d17f(), _0x3f4592());
          },
          _0x508699 = () => {
            if (_0xf2abdd) return;
            ((_0xf2abdd = true), _0x47d17f(), _0x10c3f0(new Error('video seek error')));
          };
        (_0x13d800.addEventListener('seeked', _0x186335), _0x13d800.addEventListener('error', _0x508699));
        const _0x3b9222 = Math.max(0, (Number(_0x13d800.duration) || 0) - 0.05),
          _0x7adbe2 = Math.max(0, Math.min(_0x3b9222, _0x77db7b));
        try {
          _0x13d800.currentTime = _0x7adbe2;
        } catch (_0x144382) {
          _0x508699();
        }
        window.setTimeout(() => {
          if (_0xf2abdd) return;
          ((_0xf2abdd = true), _0x47d17f(), _0x3f4592());
        }, 0x1c2);
      });
    try {
      ((_0x4a79f0 = document.createElement('video')),
        (_0x4a79f0.muted = true),
        (_0x4a79f0.playsInline = true),
        (_0x4a79f0.preload = 'auto'),
        (_0x4a79f0.crossOrigin = 'anonymous'),
        await attachDesktopMediaPlaybackSource(_0x4a79f0, _0x355cb0));
      if (!this._getVideoElementSource(_0x4a79f0)) {
        _0x4a79f0.src = _0x355cb0;
        try {
          _0x4a79f0.load?.();
        } catch (_0x440857) {}
      }
      await new Promise((_0x2f66da, _0xd7e19f) => {
        let _0x217424 = false,
          _0x1ff587 = null;
        const _0xc54af3 = () => {
            (_0x4a79f0.removeEventListener('loadedmetadata', _0x36a82d),
              _0x4a79f0.removeEventListener('error', _0x1a79af));
            if (_0x1ff587) window.clearTimeout(_0x1ff587);
          },
          _0x36a82d = () => {
            if (_0x217424) return;
            ((_0x217424 = true), _0xc54af3(), _0x2f66da());
          },
          _0x1a79af = () => {
            if (_0x217424) return;
            ((_0x217424 = true), _0xc54af3(), _0xd7e19f(new Error('video load error')));
          };
        (_0x4a79f0.addEventListener('loadedmetadata', _0x36a82d, { once: true }),
          _0x4a79f0.addEventListener('error', _0x1a79af),
          (_0x1ff587 = window.setTimeout(() => {
            if (_0x217424) return;
            if (Number(_0x4a79f0.readyState || 0) >= 1 || this._readDurationSec(_0x4a79f0) > 0) {
              ((_0x217424 = true), _0xc54af3(), _0x2f66da());
              return;
            }
            ((_0x217424 = true), _0xc54af3(), _0xd7e19f(new Error('video metadata timeout')));
          }, 0x1f40)));
      });
      const _0x1a1bac = await waitForVideoFrame(_0x4a79f0, { timeoutMs: 0xbb8 });
      if (!_0x1a1bac) throw new Error('video frame timeout');
      if (!this.active || this._thumbToken !== _0xa52178) return;
      const _0x41af3c = this._readDurationSec(_0x4a79f0);
      if (!_0x41af3c || !Number.isFinite(_0x41af3c)) return;
      if (this._applyDurationSec(_0x41af3c, _0x4a79f0)) this._render();
      const _0x437722 = _0x4a79f0.videoWidth || 1,
        _0x42af06 = _0x4a79f0.videoHeight || 1,
        _0x523bf1 = 44,
        _0x3abf62 = Math.max(1, Math.round((_0x437722 / _0x42af06) * _0x523bf1));
      ((_0x56986a = document.createElement('canvas')),
        (_0x56986a.width = _0x3abf62),
        (_0x56986a.height = _0x523bf1),
        (_0x4570b7 = _0x56986a.getContext('2d')));
      if (!_0x4570b7) return;
      for (let _0x199bda = 0; _0x199bda < _0xf73ba8; _0x199bda++) {
        if (!this.active || this._thumbToken !== _0xa52178) return;
        const _0x3c1dbe = ((_0x199bda + 0.5) / _0xf73ba8) * _0x41af3c;
        (await _0xbdfd80(_0x4a79f0, _0x3c1dbe), await waitForVideoFrame(_0x4a79f0, { timeoutMs: 0x4b0 }));
        if (!this.active || this._thumbToken !== _0xa52178) return;
        (_0x4570b7.clearRect(0, 0, _0x3abf62, _0x523bf1),
          _0x4570b7.drawImage(_0x4a79f0, 0, 0, _0x3abf62, _0x523bf1));
        let _0x253636;
        try {
          _0x253636 = _0x56986a.toDataURL('image/jpeg', 0.7);
        } catch (_0xd231c3) {
          return;
        }
        if (!_0x253636) return;
        _0x3335e8[_0x199bda].style.backgroundImage = 'url(' + _0x253636 + ')';
      }
    } catch (_0x652da7) {
      return;
    } finally {
      if (_0x4a79f0) {
        try {
          _0x4a79f0.pause();
        } catch (_0x41b1db) {}
        _0x4a79f0.removeAttribute('src');
        try {
          _0x4a79f0.load();
        } catch (_0xeea4e5) {}
      }
      ((_0x56986a = null), (_0x4570b7 = null));
    }
  },
  _handleDragAtClientX(_0x1ddb7c) {
    if (!this.trackEl || !this.active) return;
    const _0x25a652 = this.durationSec;
    if (!_0x25a652 || !Number.isFinite(_0x25a652) || _0x25a652 <= 0) {
      this._render();
      return;
    }
    const _0x29af73 = this.trackEl.getBoundingClientRect();
    if (!_0x29af73.width) return;
    const _0x502f49 = _0x1ddb7c - _0x29af73.left,
      _0x8f728 = Math.max(0, Math.min(1, _0x502f49 / _0x29af73.width)),
      _0x417540 = _0x8f728 * _0x25a652,
      _0x40e62e = Math.min(0.1, _0x25a652),
      _0x2a76fd = Math.max(_0x40e62e, this.endSec - this.startSec),
      _0x59aeae =
        this._dragMode === 'left' ||
        this._dragMode === 'right' ||
        this._dragMode === 'move' ||
        this._dragMode === 'set'
          ? this._pauseRangePlaybackForRangeEdit()
          : null;
    if (this._dragMode === 'left') {
      const _0x8a8bd2 = Math.max(0, Math.min(_0x417540, this.endSec - _0x40e62e));
      this.startSec = _0x8a8bd2;
      if (_0x59aeae)
        try {
          _0x59aeae.currentTime = _0x8a8bd2;
        } catch (_0x394231) {}
    } else {
      if (this._dragMode === 'right') {
        const _0x5f4226 = Math.max(this.startSec + _0x40e62e, Math.min(_0x25a652, _0x417540));
        this.endSec = _0x5f4226;
      } else {
        if (this._dragMode === 'move') {
          const _0x4d31fa = this.selectionEl.getBoundingClientRect().left - _0x29af73.left,
            _0x36d6ab = _0x1ddb7c - _0x29af73.left - this._dragOffsetPx,
            _0x1dcb8b = _0x36d6ab - _0x4d31fa,
            _0x439379 = (_0x1dcb8b / _0x29af73.width) * _0x25a652,
            _0xa4ae05 = Math.max(0, Math.min(_0x25a652 - _0x2a76fd, this.startSec + _0x439379));
          ((this.startSec = _0xa4ae05), (this.endSec = _0xa4ae05 + _0x2a76fd));
          if (_0x59aeae)
            try {
              _0x59aeae.currentTime = _0xa4ae05;
            } catch (_0xff031a) {}
        } else {
          if (this._dragMode === 'set') {
            const _0x134b77 = Math.min(3, _0x25a652),
              _0x41675b = Math.max(0, Math.min(_0x25a652 - _0x134b77, _0x417540 - _0x134b77 / 2));
            ((this.startSec = _0x41675b), (this.endSec = _0x41675b + _0x134b77));
          }
        }
      }
    }
    this._render();
  },
  _render() {
    if (!this.active || !this.trackEl || !this.selectionEl || !this.leftHandleEl || !this.rightHandleEl)
      return;
    const _0x302c34 = this.durationSec,
      _0x2f2dbb = Number.isFinite(_0x302c34) && _0x302c34 > 0,
      _0x6d5427 = _0x2f2dbb ? Math.max(0, Math.min(this.startSec, _0x302c34)) : 0,
      _0x5e0a21 = _0x2f2dbb ? Math.max(0, Math.min(this.endSec, _0x302c34)) : 0,
      _0x355ea5 = Math.max(0, _0x5e0a21 - _0x6d5427);
    if (_0x2f2dbb) {
      const _0x599fe9 = (_0x6d5427 / _0x302c34) * 100,
        _0xcee6b9 = (_0x355ea5 / _0x302c34) * 100;
      ((this.selectionEl.style.left = _0x599fe9 + '%'),
        (this.selectionEl.style.width = _0xcee6b9 + '%'),
        (this.leftHandleEl.style.left = _0x599fe9 + '%'),
        (this.rightHandleEl.style.left = _0x599fe9 + _0xcee6b9 + '%'),
        this.labelEl &&
          ((this.labelEl.textContent = _0x355ea5.toFixed(2) + 's'),
          (this.labelEl.style.left = _0x599fe9 + _0xcee6b9 / 2 + '%')));
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
      const _0x4916d5 = _0x2f2dbb && _0x355ea5 >= 0.1;
      ((this.confirmBtnEl.disabled = !_0x4916d5),
        (this.confirmBtnEl.dataset.disabled = _0x4916d5 ? 'false' : 'true'),
        this.confirmBtnEl.dataset.loading !== 'true' &&
          (this.confirmBtnEl.innerHTML =
            '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'));
    }
  },
  async _confirm() {
    if (!this.confirmBtnEl) return;
    const _0x36c9dc = this.confirmBtnEl;
    if (_0x36c9dc.dataset.disabled === 'true') return;
    const _0x13340d = appStore.getState().nodes,
      _0x1ff025 = _0x13340d[this.anchorNodeId];
    if (!_0x1ff025) {
      this.exit({ silent: true });
      return;
    }
    const _0x599a90 = this.durationSec;
    if (!_0x599a90 || !Number.isFinite(_0x599a90) || _0x599a90 <= 0) return;
    const _0xe5d6a9 = Math.max(0, Math.min(this.startSec, _0x599a90)),
      _0xf69853 = Math.max(0, Math.min(this.endSec, _0x599a90));
    if (!(_0xf69853 > _0xe5d6a9)) return;
    const _0x2f5967 =
      localPathToUrl(_0x1ff025.localPath) || _0x1ff025.src || _0x1ff025.videoUrl || _0x1ff025.resultUrl || '';
    if (!_0x2f5967) return;
    ((_0x36c9dc.dataset.disabled = 'true'),
      (_0x36c9dc.dataset.loading = 'true'),
      (_0x36c9dc.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g style="animation:spin 1s linear infinite;transform-origin:50% 50%;transform-box:fill-box;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g></svg>'),
      window.showToast?.(videoClipText('cut.processing'), 'info'));
    try {
      let _0x11f8be = null;
      if (canUseElectronMediaTask())
        _0x11f8be = await enqueueElectronMediaTask(
          {
            kind: 'videoCut',
            nodeId: this.anchorNodeId,
            src: _0x2f5967,
            args: { start: _0xe5d6a9, end: _0xf69853 },
          },
          { wait: true, timeout: 0x493e0 },
        );
      else {
        const _0x354c56 = await requester({
          url: '/api/v2/video/cut',
          method: 'POST',
          provider: 'local',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ src: _0x2f5967, start: _0xe5d6a9, end: _0xf69853 }),
          allow404Null: true,
          returnMeta: true,
        });
        if (_0x354c56?.status === 0x194 || _0x354c56?.data == null)
          throw new Error(videoClipText('errors.cutEndpointMissing'));
        _0x11f8be = _0x354c56.data || {};
      }
      const _0x30b31f =
          _0x11f8be?.result && typeof _0x11f8be.result === 'object' ? _0x11f8be.result : _0x11f8be,
        _0x4979f4 = normalizeVideoCutResultLocalPath(_0x11f8be);
      if (!_0x4979f4 || _0x11f8be?.success === false || _0x30b31f?.success === false)
        throw new Error(
          _0x30b31f?.error || _0x11f8be?.error || _0x11f8be?.message || videoClipText('errors.cutFailed'),
        );
      const { width: _0x33de00, height: _0x34cbf0 } = getAutoMediaSizeByShortSide(
          _0x1ff025.width || 0x200,
          _0x1ff025.height || 0x120,
        ),
        _0x5ad9c4 = calcSafeSpawnPosNearNode(appStore.getState().nodes, _0x1ff025, _0x33de00, _0x34cbf0),
        _0x2a448d = generateId('source-video-cut'),
        _0x56d7bb = pickPositiveNumber(_0x30b31f?.fps, _0x11f8be?.fps),
        _0x278f12 = buildVideoCutNodeMeta(_0x1ff025, _0xe5d6a9, _0xf69853, _0x56d7bb),
        _0x4cfd35 = buildVideoCutNodePlaybackFields(_0x4979f4);
      (appStore.addNode(
        buildSourceMediaNodePayload({
          id: _0x2a448d,
          type: 'source-video',
          x: _0x5ad9c4.x,
          y: _0x5ad9c4.y,
          width: _0x33de00,
          height: _0x34cbf0,
          name: videoClipText('cut.newNodeName', {
            name: _0x1ff025.name || videoClipText('cut.videoFallback'),
          }),
          ..._0x4cfd35,
          ..._0x278f12,
          needsAutoResize: false,
          fixedSize: true,
        }),
      ),
        appStore.setSelectedNodes([_0x2a448d]),
        commit(),
        ensureVideoCutNodeThumb(_0x2a448d, _0x4979f4),
        window.v2FocusOnNodes?.([this.anchorNodeId, _0x2a448d]),
        window._triggerLocalCacheSave?.(),
        window.showToast?.(videoClipText('cut.success'), 'success'),
        this.exit({ silent: true }));
    } catch (_0x15d986) {
      const _0x31a270 =
        _0x15d986 instanceof Error
          ? _0x15d986.message
          : String(_0x15d986 || videoClipText('errors.cutFailed'));
      (window.showToast?.(videoClipText('cut.failedWithError', { error: _0x31a270 }), 'error'),
        (_0x36c9dc.dataset.loading = 'false'),
        this._render(),
        (_0x36c9dc.dataset.loading = 'false'));
    }
    _0x36c9dc.dataset.loading = 'false';
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
      .filter(([, _0x422a0a]) => typeof _0x422a0a === 'function')
      .map(([_0x591c70]) => _0x591c70),
  ),
  VIDEO_CLIP_CONTROLLER_INITIAL_STATE = Object.freeze(
    Object.fromEntries(
      Object.entries(VideoClipController).filter(([_0x359388]) => !VIDEO_CLIP_CONTROLLER_METHOD_KEYS.has(_0x359388)),
    ),
  );
export default VideoClipController;
export function createVideoClipController() {
  const _0x34f032 = Object.create(VideoClipController);
  for (const _0x37bb9c of Object.keys(VideoClipController)) {
    if (VIDEO_CLIP_CONTROLLER_METHOD_KEYS.has(_0x37bb9c)) continue;
    const _0x13287f = Object.hasOwn(VIDEO_CLIP_CONTROLLER_INITIAL_STATE, _0x37bb9c)
      ? VIDEO_CLIP_CONTROLLER_INITIAL_STATE[_0x37bb9c]
      : undefined;
    _0x34f032[_0x37bb9c] = Array.isArray(_0x13287f)
      ? [..._0x13287f]
      : _0x13287f && typeof _0x13287f === 'object'
        ? { ..._0x13287f }
        : _0x13287f;
  }
  return _0x34f032;
}

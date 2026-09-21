import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { resumeAsyncVideoTask, resumeRunningHubVideoTask } from '../../api/aiVideoApi.js';
import { ensureConfig, getProviderConfig } from '../../api/configApi.js';
import { fetchVideoMetaFromServer } from '../../api/videoMetaApi.js';
import { fetchVideoFirstFrameThumbFromServer } from '../../api/videoThumbApi.js';
import {
  getModelManifest,
  listModelManifests,
  normalizeProviderId,
  resolveModelExecution,
  RH_VIDEO_MATTING_MODEL_ID,
} from '../manifests/index.js';
import { fetchRemoteBlob, saveOutputFromUrlToServer, saveOutputToServer } from '../../api/projectsV2Api.js';
import { resumeRunninghubWorkflowTask } from '../../api/runninghubWorkflowApi.js';
import { uploadFile } from '../modules/project.js';
import { startLoading, stopLoading } from '../modules/loadingOverlay.js';
import VideoKeyingController from '../modules/VideoKeyingController.js';
import { commit } from '../modules/history.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { VIDEO_TOOLBAR_HTML, bindVideoToolbarEvents } from './NodeToolbarConfig.js';
import { registerStaticInnerHTML, setStaticInnerHTML } from '../utils/dom.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { buildCanvasLocalVideoFields, resolveCanvasVideoUrl } from '../services/canvasMediaLocalService.js';
import { isTaskTerminal, shouldShowGenerationResultLoadingUi } from '../core/generationTaskUiState.js';
import { resumeTask } from '../core/generationTaskRuntime.js';
import { extractCurrentVideoFrameToImageNode } from '../modules/videoFrameExtraction.js';
import {
  attachVideoPlaybackRecovery,
  getVideoCurrentSource,
  logVideoPlaybackEvent,
  playVideoWithRecovery,
} from './video-node/mediaPlaybackRecovery.js';
import {
  attachMediaElementPlaybackSource,
  clearDesktopMediaPlaybackSourceMetadata,
} from '../services/desktopMediaBlobSource.js';
import { localPathToUrl, pickResultLocalPath, urlToLocalPath } from '../utils/localMediaPath.js';
import { buildVideoGenerationFailurePatch } from './video-node/videoGenerationResultRenderer.js';
import { buildVideoMutedPatch, resolveVideoMutedPreference } from './video-node/videoMuteState.js';
import { preloadCanvasImage } from '../modules/canvasMediaScheduler.js';
import { shouldDeferRendererMediaOnMount } from '../core/rendererDeferredMedia.js';
const SOURCE_VIDEO_MIN_SIZE = 150,
  SOURCE_VIDEO_POSTER_PRELOAD = 'metadata',
  SOURCE_VIDEO_IDLE_MEDIA_TIMEOUT_MS = 120,
  SOURCE_VIDEO_BUSY_RETRY_MS = 80,
  SOURCE_VIDEO_MAX_BUSY_WAIT_MS = 0x384;
function sourceVideoText(_0x14967f, _0x21681b = {}) {
  return t('sourceVideoNode.' + _0x14967f, _0x21681b);
}
function isDesktopRenderer() {
  return !!globalThis.window?.electronAPI;
}
const getVideoMattingModelId = () =>
    getModelManifest(RH_VIDEO_MATTING_MODEL_ID)?.extensions?.videoKeying?.modelId ||
    RH_VIDEO_MATTING_MODEL_ID,
  RH_VIDEO_STATUS_ALIASES = {
    success: new Set(['success', 'succeeded', 'completed', 'complete', 'done']),
    failed: new Set(['failed', 'fail', 'error']),
    cancelled: new Set(['cancelled', 'canceled']),
    pending: new Set(['pending', 'queued', 'submitted']),
    running: new Set(['running', 'processing', 'generating']),
  };
function getSourceVideoSchedulerNow() {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}
function isSourceVideoInteractionBusy() {
  const _0x11e8c2 = typeof document !== 'undefined' ? document.body?.classList : null;
  return !!(
    _0x11e8c2?.contains?.('is-panning') ||
    _0x11e8c2?.contains?.('is-zooming') ||
    _0x11e8c2?.contains?.('is-viewport-animating')
  );
}
function scheduleSourceVideoIdleTask(
  _0x8e2a13,
  { timeout: timeout = SOURCE_VIDEO_IDLE_MEDIA_TIMEOUT_MS } = {},
) {
  if (typeof _0x8e2a13 !== 'function') return () => {};
  let _0x489798 = false,
    _0x1d4211 = () => {};
  const _0x3d2d8a = getSourceVideoSchedulerNow(),
    _0x176aeb = globalThis.window?.requestIdleCallback || globalThis.requestIdleCallback,
    _0x1961f4 = globalThis.window?.cancelIdleCallback || globalThis.cancelIdleCallback;
  function _0x3fd147(_0x4ccc32) {
    const _0x539b5a = setTimeout(_0x3d43bd, _0x4ccc32);
    _0x1d4211 = () => clearTimeout(_0x539b5a);
  }
  const _0x3d43bd = () => {
    if (_0x489798) return;
    const _0x564d8c = getSourceVideoSchedulerNow() - _0x3d2d8a;
    if (isSourceVideoInteractionBusy() && _0x564d8c < SOURCE_VIDEO_MAX_BUSY_WAIT_MS) {
      _0x3fd147(SOURCE_VIDEO_BUSY_RETRY_MS);
      return;
    }
    _0x8e2a13();
  };
  if (typeof _0x176aeb === 'function') {
    const _0x53b5d1 = _0x176aeb(_0x3d43bd, { timeout: timeout });
    _0x1d4211 = () => {
      if (typeof _0x1961f4 === 'function') _0x1961f4(_0x53b5d1);
    };
  } else _0x3fd147(16);
  return () => {
    ((_0x489798 = true), _0x1d4211());
  };
}
function buildSourceVideoRecoveryFailurePatch(
  _0xda8720,
  { error: error = '', startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const _0x499f4e =
      String(error?.message || error || sourceVideoText('recovery.taskFailed')).trim() ||
      sourceVideoText('recovery.taskFailed'),
    _0xe0756 = String(_0xda8720?.outputText || '').trim(),
    _0x634716 = _0xe0756
      ? _0xe0756 + '\n' + sourceVideoText('recovery.failedWithMessage', { message: _0x499f4e })
      : sourceVideoText('recovery.failedWithMessage', { message: _0x499f4e });
  return {
    ...buildVideoGenerationFailurePatch({
      error: _0x499f4e,
      startedAt: startedAt,
      duration: duration,
      clearMediaFields: false,
    }),
    outputText: _0x634716,
  };
}
function normalizeUploadMediaDimensions(_0x3d808c, _0x17f314) {
  const _0x6c5032 = Math.round(Number(_0x3d808c) || 0),
    _0x139c1a = Math.round(Number(_0x17f314) || 0);
  if (_0x6c5032 <= 0 || _0x139c1a <= 0) return null;
  return { width: _0x6c5032, height: _0x139c1a };
}
export function buildSourceVideoUploadSizePatch(..._0x26289d) {
  for (const _0x3f2ec5 of _0x26289d) {
    const _0x307fcb = normalizeUploadMediaDimensions(_0x3f2ec5?.width, _0x3f2ec5?.height);
    if (!_0x307fcb) continue;
    const _0x36d40e = getAutoMediaSizeByShortSide(_0x307fcb.width, _0x307fcb.height);
    return {
      width: _0x36d40e.width,
      height: _0x36d40e.height,
      videoWidth: _0x307fcb.width,
      videoHeight: _0x307fcb.height,
      needsAutoResize: false,
    };
  }
  return { needsAutoResize: true };
}
function readVideoFileNaturalSize(_0x1b2e99) {
  const _0x23312e = globalThis.document;
  if (!_0x1b2e99 || typeof _0x23312e?.createElement !== 'function') return Promise.resolve(null);
  const _0x1f7c09 = globalThis.window?.URL || globalThis.URL;
  if (typeof _0x1f7c09?.createObjectURL !== 'function') return Promise.resolve(null);
  let _0x4a569e = '';
  try {
    _0x4a569e = _0x1f7c09.createObjectURL(_0x1b2e99);
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((_0xc7c133) => {
    const _0x56fd3a = _0x23312e.createElement('video');
    let _0x3a6fe2 = false,
      _0x5f43cd = null;
    const _0x530a0a = (_0x5a1263) => {
        if (_0x3a6fe2) return;
        _0x3a6fe2 = true;
        if (_0x5f43cd) clearTimeout(_0x5f43cd);
        (_0x3c0e19(), _0xc7c133(_0x5a1263));
      },
      _0x3c0e19 = () => {
        _0x56fd3a.removeAttribute?.('src');
        try {
          _0x56fd3a.load?.();
        } catch {}
        try {
          _0x1f7c09.revokeObjectURL(_0x4a569e);
        } catch {}
      };
    ((_0x56fd3a.preload = 'metadata'),
      (_0x56fd3a.muted = true),
      (_0x56fd3a.onloadedmetadata = () => {
        const _0x555945 = normalizeUploadMediaDimensions(_0x56fd3a.videoWidth, _0x56fd3a.videoHeight);
        _0x530a0a(_0x555945);
      }),
      (_0x56fd3a.onerror = () => _0x530a0a(null)),
      (_0x5f43cd = setTimeout(() => _0x530a0a(null), 0xbb8)),
      (_0x56fd3a.src = _0x4a569e));
  });
}
function createVideoCapturePreviewUrl(_0x2fbb8f) {
  if (!_0x2fbb8f || !String(_0x2fbb8f.type || '').startsWith('video/')) return '';
  const _0x79fff = globalThis.window?.URL || globalThis.URL;
  if (typeof _0x79fff?.createObjectURL !== 'function') return '';
  try {
    return _0x79fff.createObjectURL(_0x2fbb8f);
  } catch {
    return '';
  }
}
function waitForNextPaint() {
  const _0x164c28 = globalThis.window?.requestAnimationFrame || globalThis.requestAnimationFrame;
  if (typeof _0x164c28 === 'function')
    return new Promise((_0x22a471) => {
      let _0x16710c = false,
        _0x11a5ed = null;
      const _0x516464 = () => {
        if (_0x16710c) return;
        _0x16710c = true;
        if (_0x11a5ed) clearTimeout(_0x11a5ed);
        _0x22a471();
      };
      ((_0x11a5ed = setTimeout(_0x516464, 50)), _0x164c28(_0x516464));
    });
  return new Promise((_0x1d649e) => setTimeout(_0x1d649e, 0));
}
function asStringArray(_0x52f6bb) {
  return Array.isArray(_0x52f6bb)
    ? _0x52f6bb.map((_0x4ea012) => String(_0x4ea012 || '').trim()).filter(Boolean)
    : [];
}
function createManagedNameRegex(_0xd67639, _0x3cd8a5, _0x29a634) {
  const _0x1bdd15 = String(_0xd67639 || '').trim();
  if (!_0x1bdd15) return /^$/;
  try {
    return new RegExp(_0x1bdd15);
  } catch (_0x41f8b6) {
    throw new Error(
      '[source-video] invalid sourceVideoTaskName pattern for ' +
        (_0x3cd8a5?.modelId || '') +
        '/' +
        (_0x29a634 || ''),
    );
  }
}
function getSourceVideoTaskNameConfigs(_0x44253e) {
  const _0x79cb79 = _0x44253e?.extensions || {};
  if (Array.isArray(_0x79cb79.sourceVideoTaskNameRules)) return _0x79cb79.sourceVideoTaskNameRules;
  return _0x79cb79.sourceVideoTaskName ? [_0x79cb79.sourceVideoTaskName] : [];
}
function createSourceVideoTaskNameRule(_0x1e5466, _0x2bb226) {
  if (!_0x1e5466 || !_0x2bb226) return null;
  const _0x2ff137 = String(_0x2bb226.modelId || _0x1e5466.modelId || '')
      .trim()
      .toLowerCase(),
    _0x13cd0f = String(_0x2bb226.key || _0x2ff137 || 'sourceVideoTask').trim();
  return {
    key: _0x13cd0f,
    matchModel: _0x2bb226.matchModel !== false,
    models: new Set(_0x2ff137 ? [_0x2ff137] : []),
    textNeedles: asStringArray(_0x2bb226.textNeedles),
    managedNameRe: createManagedNameRegex(_0x2bb226.managedNamePattern, _0x1e5466, _0x13cd0f),
    names: { ...(_0x2bb226.names || {}) },
  };
}
function buildSourceVideoTaskNameRules() {
  return listModelManifests()
    .flatMap((_0x268055) =>
      getSourceVideoTaskNameConfigs(_0x268055).map((_0x169dce) =>
        createSourceVideoTaskNameRule(_0x268055, _0x169dce),
      ),
    )
    .filter(Boolean);
}
const RH_VIDEO_TASK_NAME_RULES = buildSourceVideoTaskNameRules();
function normalizeRunningHubVideoStatus(_0x10e274) {
  const _0x4213d4 = String(_0x10e274 || '')
    .trim()
    .toLowerCase();
  for (const [_0x3fde45, _0x158486] of Object.entries(RH_VIDEO_STATUS_ALIASES)) {
    if (_0x158486.has(_0x4213d4)) return _0x3fde45;
  }
  return _0x4213d4;
}
function isRunningHubVideoTask(_0xb18aa7) {
  if (!_0xb18aa7 || typeof _0xb18aa7 !== 'object') return false;
  const _0x5e437d = normalizeProviderId(_0xb18aa7.provider);
  if (_0x5e437d === 'runninghubwf' || _0x5e437d === 'runninghub') return true;
  const _0x2f6335 = resolveModelExecution(_0xb18aa7.model, { providerHint: _0x5e437d }),
    _0x3c3e08 = normalizeProviderId(_0x2f6335?.modelManifest?.provider),
    _0x4716eb = normalizeProviderId(_0x2f6335?.executionManifest?.provider);
  return _0x3c3e08 === 'runninghubwf' || _0x4716eb === 'runninghubwf';
}
function resolveRunningHubVideoTaskNameRule(_0xb4f8b5) {
  if (!isRunningHubVideoTask(_0xb4f8b5)) return '';
  const _0x3be210 = String(_0xb4f8b5?.model || '')
      .trim()
      .toLowerCase(),
    _0x502b32 = String(_0xb4f8b5?.name || '').trim(),
    _0x3622cd = String(_0xb4f8b5?.outputText || ''),
    _0x13390d = RH_VIDEO_TASK_NAME_RULES.find(
      (_0x2f6b00) => _0x502b32 && _0x2f6b00.managedNameRe.test(_0x502b32),
    );
  if (_0x13390d) return _0x13390d;
  const _0x1d6f81 = RH_VIDEO_TASK_NAME_RULES.find((_0x5a8f49) =>
    _0x5a8f49.textNeedles.some((_0x49bae6) => _0x3622cd.includes(_0x49bae6)),
  );
  if (_0x1d6f81) return _0x1d6f81;
  return (
    RH_VIDEO_TASK_NAME_RULES.find((_0x5a5fa9) => {
      if (_0x5a5fa9.matchModel !== false && _0x5a5fa9.models?.has(_0x3be210)) return true;
      return false;
    }) || null
  );
}
function resolveRunningHubVideoStatusName(_0x10feb9, _0x222bde) {
  const _0x30f5e2 = resolveRunningHubVideoTaskNameRule(_0x10feb9);
  if (!_0x30f5e2?.names) return '';
  const _0x33ad10 = String(_0x10feb9?.name || '').trim();
  if (!_0x33ad10 || !_0x30f5e2.managedNameRe.test(_0x33ad10)) return '';
  return _0x30f5e2.names[normalizeRunningHubVideoStatus(_0x222bde)] || '';
}
function buildChangedPatch(_0x3c234f, _0x4a757f) {
  const _0x32c416 = {};
  for (const [_0x1a4741, _0x509602] of Object.entries(_0x4a757f || {})) {
    if (!Object.is(_0x3c234f?.[_0x1a4741], _0x509602)) _0x32c416[_0x1a4741] = _0x509602;
  }
  return _0x32c416;
}
function buildRunningHubVideoTerminalStatePatch(_0xbc7d3a, _0x563ddb, _0x572aa1) {
  if (!isRunningHubVideoTask(_0xbc7d3a)) return null;
  const _0x1f4355 = normalizeRunningHubVideoStatus(_0x563ddb || _0xbc7d3a?.rhTaskStatus);
  if (!['success', 'failed', 'cancelled'].includes(_0x1f4355)) return null;
  const _0x5d85bc = { isGenerating: false, rhTaskStatus: _0x1f4355, rhTaskRecovering: false };
  if (_0x1f4355 === 'success') _0x5d85bc.jobStatus = 'success';
  if (_0x1f4355 === 'failed') _0x5d85bc.jobStatus = 'error';
  if (_0x1f4355 === 'cancelled') _0x5d85bc.jobStatus = null;
  typeof _0xbc7d3a?.generationDuration !== 'number' && (_0x5d85bc.generationDuration = _0x572aa1);
  const _0x2865ed = resolveRunningHubVideoStatusName(_0xbc7d3a, _0x1f4355);
  if (_0x2865ed) _0x5d85bc.name = _0x2865ed;
  const _0x1550a8 = buildChangedPatch(_0xbc7d3a, _0x5d85bc);
  return Object.keys(_0x1550a8).length > 0 ? _0x1550a8 : null;
}
function shouldFetchVideoMetaForNodeInfo() {
  try {
    const _0x4b374c =
      typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
    return _0x4b374c?.ui?.showVideoMeta === true;
  } catch {
    return false;
  }
}
function normalizeVideoPreviewUrl(_0x5268d1, { localOnly: localOnly = false } = {}) {
  const _0x526dc9 = String(_0x5268d1 || '').trim();
  if (!_0x526dc9) return '';
  if (/^data:image\//i.test(_0x526dc9) || /^blob:/i.test(_0x526dc9) || /^aic-local-preview:/i.test(_0x526dc9))
    return _0x526dc9;
  if (/^(?:https?:|file:)/i.test(_0x526dc9)) return '';
  const _0x32de48 = localPathToUrl(_0x526dc9);
  if (_0x32de48) return _0x32de48;
  return localOnly ? '' : _0x526dc9;
}
export function resolveSourceVideoPosterSrc(_0x60e30f = {}) {
  const _0x21911d = Array.isArray(_0x60e30f?.videos) ? _0x60e30f.videos : [],
    _0x4cf68c = Math.max(0, Number(_0x60e30f?.mainVideoIndex) || 0),
    _0x5b8a35 = _0x21911d[_0x4cf68c] || _0x21911d[0] || null,
    _0x4f0471 = [
      [_0x5b8a35?.posterLocalPath, true],
      [_0x5b8a35?.previewLocalPath, true],
      [_0x5b8a35?.thumbLocalPath, true],
      [_0x5b8a35?.thumbnailLocalPath, true],
      [_0x5b8a35?.posterUrl, false],
      [_0x5b8a35?.previewUrl, false],
      [_0x5b8a35?.thumbUrl, false],
      [_0x5b8a35?.thumbnailUrl, false],
      [_0x60e30f?.posterLocalPath, true],
      [_0x60e30f?.previewLocalPath, true],
      [_0x60e30f?.thumbLocalPath, true],
      [_0x60e30f?.thumbnailLocalPath, true],
      [_0x60e30f?.posterUrl, false],
      [_0x60e30f?.previewUrl, false],
      [_0x60e30f?.thumbUrl, false],
      [_0x60e30f?.thumbnailUrl, false],
    ];
  for (const [_0x2d57ff, _0x3ffc18] of _0x4f0471) {
    const _0x44d4e0 = normalizeVideoPreviewUrl(_0x2d57ff, { localOnly: _0x3ffc18 });
    if (_0x44d4e0) return _0x44d4e0;
  }
  return '';
}
export function resolveSourceVideoMediaTaskSrc(_0x2cb261 = {}) {
  const _0x3ad877 = Array.isArray(_0x2cb261?.videos) ? _0x2cb261.videos : [],
    _0x57166d = Math.max(0, Number(_0x2cb261?.mainVideoIndex) || 0),
    _0x4dad6a = _0x3ad877[_0x57166d] || _0x3ad877[0] || null,
    _0x27ada9 = [
      _0x2cb261?.originalLocalPath,
      _0x2cb261?.localPath,
      _0x2cb261?.displayLocalPath,
      _0x2cb261?.videoLocalPath,
      _0x2cb261?.videoUrl,
      _0x2cb261?.src,
      _0x2cb261?.url,
      _0x2cb261?.resultUrl,
      _0x2cb261?.sourceUrl,
      _0x4dad6a?.originalLocalPath,
      _0x4dad6a?.localPath,
      _0x4dad6a?.displayLocalPath,
      _0x4dad6a?.videoUrl,
      _0x4dad6a?.src,
      _0x4dad6a?.url,
      _0x4dad6a?.resultUrl,
    ];
  for (const _0x4a6773 of _0x27ada9) {
    const _0x469383 = urlToLocalPath(_0x4a6773) || pickResultLocalPath(_0x4a6773);
    if (_0x469383) return _0x469383;
  }
  return '';
}
const _SOURCE_VIDEO_NODE_TEMPLATE_ID = 'node:source-video';
registerStaticInnerHTML(
  _SOURCE_VIDEO_NODE_TEMPLATE_ID,
  VIDEO_TOOLBAR_HTML +
    '\n        <div class="node-card media-card video-card" style="width: 100%; height: 100%; padding: 0; background: var(--white-05); border: 1px solid var(--stroke-08); border-radius: 18px; overflow: hidden; position: relative; display: flex; align-items: stretch; pointer-events: auto; cursor: var(--link-cursor);">\n        <img class="source-video-poster-frame" alt="" draggable="false">\n        \n        <div class="video-mute-btn">\n          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-unmuted" style="display:none;"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>\n          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-muted"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="1" x2="1" y2="23"></line><line x1="15.54" y1="8.46" x2="19.07" y2="12"></line></svg>\n        </div>\n\n        <div class="video-center-indicator">\n          <div class="indicator-inner">\n          </div>\n        </div>\n        \n        <div class="node-upload-hint source-upload-hint">\n          <button type="button" class="upload-btn source-upload-btn">\n            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>\n            <span class="source-upload-label"></span>\n          </button>\n        </div>\n\n        <div class="video-controls">\n          <div class="video-play-btn">\n            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>\n          </div>\n          <span class="video-time-current">0:00</span>\n          <div class="media-progress-bar">\n             <div class="media-progress-fill">\n                <div class="media-progress-knob"></div>\n             </div>\n          </div>\n          <span class="video-time-total">0:00</span>\n          <div class="video-snap-btn">\n            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>\n          </div>\n        </div>\n        <div class="node-port out-port"></div>\n        <div class="node-resizer"></div>\n      </div>',
);
export class SourceVideoNode {
  constructor(_0x17f5a8) {
    ((this._data = _0x17f5a8),
      (this.el = document.createElement('div')),
      (this.id = _0x17f5a8.id),
      (this.el.className = 'v2-node-component'),
      (this._currentSrc = null),
      (this._objUrl = null),
      (this._isMuted = resolveVideoMutedPreference(_0x17f5a8)),
      (this._isManualControl = false),
      (this._isHovered = false),
      (this._hoverManualPause = false),
      (this._isManualLoopPlayback = false),
      (this._autoPlayToken = 0),
      (this._seekToken = 0),
      (this._isSeeking = false),
      (this._clickTimer = null),
      (this._clip = null),
      (this._metaFetchToken = 0),
      (this._thumbFetchToken = 0),
      (this._activeCapturePreviewUrl = ''),
      (this._lastPosterSrc = ''),
      (this._rhResumeAbortController = null),
      (this._rhResumeTaskId = ''),
      (this._rhResumePromise = null),
      (this._asyncResumeAbortController = null),
      (this._asyncResumeTaskId = ''),
      (this._asyncResumePromise = null),
      (this._idleVideoThumbCancel = null),
      (this._isUploading = false),
      (this._unsubscribeLocale = null),
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(_0x17f5a8)),
      (this._videoEventsBound = false));
  }
  ['_ensureVideoElement']() {
    if (this._video) return this._video;
    if (!this._card) return null;
    const _0x5f1ba7 = document.createElement('video');
    ((_0x5f1ba7.className = 'video-player'),
      _0x5f1ba7.setAttribute('playsinline', ''),
      (_0x5f1ba7.preload = 'none'),
      (_0x5f1ba7.muted = this._isMuted),
      Object.assign(_0x5f1ba7.style, {
        width: '100%',
        height: '100%',
        display: 'block',
        opacity: '0',
        visibility: 'hidden',
        objectFit: 'cover',
        borderRadius: '0',
        margin: '0',
        pointerEvents: 'none',
      }));
    if (this._posterFrame?.parentNode === this._card) this._card.insertBefore(_0x5f1ba7, this._posterFrame);
    else
      typeof this._card.prepend === 'function'
        ? this._card.prepend(_0x5f1ba7)
        : this._card.appendChild(_0x5f1ba7);
    return ((this._video = _0x5f1ba7), this._bindVideoElementEvents(), _0x5f1ba7);
  }
  ['_bindVideoElementEvents']() {
    if (!this._video || this._videoEventsBound === true) return;
    ((this._videoEventsBound = true),
      this._video.addEventListener('play', () => {
        (this._syncPosterFrameVisibility(), this._updatePlayIcon(false), this._hideCenterIndicator());
      }),
      this._video.addEventListener('pause', () => {
        (this._syncPosterFrameVisibility(), this._updatePlayIcon(true), this._showPausedCenterIndicator());
      }));
    for (const _0x36404f of ['loadeddata', 'playing', 'timeupdate', 'seeked']) {
      this._video.addEventListener(_0x36404f, () => this._syncPosterFrameVisibility());
    }
    (this._video.addEventListener('timeupdate', () => {
      if (this._isSeeking || (this._bar && this._bar.dataset.dragging === 'true')) return;
      const _0x36a8d9 = this._getBaseDuration();
      if (!_0x36a8d9 || !Number.isFinite(_0x36a8d9)) return;
      const _0x17f72a = this._getClipRange(_0x36a8d9),
        _0x1b495a = _0x17f72a.active ? Math.max(0, _0x17f72a.end - _0x17f72a.start) : _0x36a8d9;
      if (!_0x1b495a || !Number.isFinite(_0x1b495a)) return;
      let _0x46bde7 = this._video.currentTime || 0;
      if (_0x17f72a.active) {
        if (_0x46bde7 < _0x17f72a.start)
          ((this._video.currentTime = _0x17f72a.start), (_0x46bde7 = _0x17f72a.start));
        else
          _0x46bde7 > _0x17f72a.end - 0.03 &&
            ((this._video.currentTime = _0x17f72a.start), (_0x46bde7 = _0x17f72a.start));
      }
      const _0x367bbd = _0x17f72a.active
        ? Math.max(0, Math.min(_0x1b495a, _0x46bde7 - _0x17f72a.start))
        : _0x46bde7;
      ((this._fill.style.width = (_0x367bbd / _0x1b495a) * 100 + '%'),
        (this._timeCurrent.textContent = this._fmt(_0x367bbd)),
        (this._timeTotal.textContent = this._fmt(_0x1b495a)));
    }),
      this._video.addEventListener('loadedmetadata', () => {
        this._syncVideoDurationUi();
        const _0x42c409 = this._video.videoWidth || 0,
          _0xc75eb7 = this._video.videoHeight || 0;
        if (_0x42c409 > 0 && _0xc75eb7 > 0) {
          const _0x3ea90d = appStore.getState().nodes[this.id];
          if (_0x3ea90d) {
            const _0x1722e3 = {};
            if (Number(_0x3ea90d.videoWidth || 0) !== _0x42c409) _0x1722e3.videoWidth = _0x42c409;
            if (Number(_0x3ea90d.videoHeight || 0) !== _0xc75eb7) _0x1722e3.videoHeight = _0xc75eb7;
            if (Object.keys(_0x1722e3).length) appStore.updateNodeData(this.id, _0x1722e3);
          }
        }
        if (this._data.fixedSize) return;
        if (!this._data.needsAutoResize) return;
        const { width: _0x5b8f6c, height: _0x8b94a7 } = getAutoMediaSizeByShortSide(
          _0x42c409 || 0x3e8,
          _0xc75eb7 || 0x3e8,
        );
        appStore.updateNodeData(this.id, { width: _0x5b8f6c, height: _0x8b94a7, needsAutoResize: false });
      }));
  }
  ['mount']() {
    const _0x4420ba = this.el;
    (setStaticInnerHTML(_0x4420ba, _SOURCE_VIDEO_NODE_TEMPLATE_ID),
      (this._card = _0x4420ba.querySelector('.node-card')),
      (this._video = null),
      (this._posterFrame = _0x4420ba.querySelector('.source-video-poster-frame')));
    this._posterFrame &&
      ((this._posterFrame.decoding = 'async'),
      (this._posterFrame.loading = 'eager'),
      'fetchPriority' in this._posterFrame && (this._posterFrame.fetchPriority = 'high'));
    (this._applyVideoPoster(this._data),
      this._attachPlaybackRecovery(),
      (this._hint = _0x4420ba.querySelector('.node-upload-hint')),
      (this._uploadBtn = _0x4420ba.querySelector('.upload-btn')),
      (this._controls = _0x4420ba.querySelector('.video-controls')),
      (this._playBtn = _0x4420ba.querySelector('.video-play-btn')),
      (this._muteBtn = _0x4420ba.querySelector('.video-mute-btn')),
      (this._iconUnmuted = _0x4420ba.querySelector('.icon-unmuted')),
      (this._iconMuted = _0x4420ba.querySelector('.icon-muted')),
      this._syncMutedStateFromData(this._data),
      (this._fill = _0x4420ba.querySelector('.media-progress-fill')),
      (this._bar = _0x4420ba.querySelector('.media-progress-bar')),
      (this._timeCurrent = _0x4420ba.querySelector('.video-time-current')),
      (this._timeTotal = _0x4420ba.querySelector('.video-time-total')),
      (this._snapBtn = _0x4420ba.querySelector('.video-snap-btn')),
      (this._centerIndicator = _0x4420ba.querySelector('.video-center-indicator')),
      (this._indicatorInner = _0x4420ba.querySelector('.indicator-inner')),
      (this._centerIndicatorTimer = null),
      (this._resizer = _0x4420ba.querySelector('.node-resizer')),
      this._syncLocaleTexts(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())));
    if (this._data?.isGenerating && !this._resolveVideoSrc(this._data)) {
      startLoading(this._card, { variant: 'full' });
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    }
    (this._card.addEventListener('dblclick', (_0x343122) => {
      _0x343122.stopPropagation();
      this._clickTimer && (clearTimeout(this._clickTimer), (this._clickTimer = null));
      const _0x10d7ad =
        (this._video ? getVideoCurrentSource(this._video) : '') ||
        this._currentSrc ||
        this._resolveVideoSrc(this._data);
      _0x10d7ad && ((this._currentSrc = _0x10d7ad), void this._openFullscreenFromCurrentVideo());
    }),
      this._card.addEventListener('click', (_0x59814e) => {
        if (_0x59814e.detail && _0x59814e.detail > 1) return;
        if (
          _0x59814e.target.closest('.video-controls') ||
          _0x59814e.target.closest('.video-mute-btn') ||
          _0x59814e.target.closest('.node-upload-hint') ||
          _0x59814e.target.closest('.node-floating-toolbar')
        )
          return;
        _0x59814e.stopPropagation();
        if (this._clickTimer) clearTimeout(this._clickTimer);
        this._clickTimer = setTimeout(() => {
          this._clickTimer = null;
          if (!this._currentSrc) return;
          this._toggleManualPlayback({ forcePlay: this._shouldKeepHoverPlaybackOnManualClick() });
        }, 180);
      }),
      (this._input = document.createElement('input')),
      (this._input.type = 'file'),
      (this._input.accept = 'video/*'),
      (this._input.style.display = 'none'),
      _0x4420ba.appendChild(this._input),
      this._uploadBtn.addEventListener('click', (_0x4f2a85) => {
        (_0x4f2a85.stopPropagation(), this._input.click());
      }));
    this._resizer &&
      this._resizer.addEventListener('pointerdown', (_0x381b9e) => {
        const _0x3f042a = appStore.getStateRaw().ui?.imageVideoNodeResizeEnabled === true,
          _0x3ea589 = document.getElementById('v2-wrap')?.classList.contains('v2-media-node-resize-enabled');
        if (!(_0x3f042a && _0x3ea589)) return;
        startNodeResizePreview({
          event: _0x381b9e,
          nodeId: this.id,
          getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
          getViewport: () => appStore.getStateRaw().viewport,
          resolveSize: ({ startWidth: _0x20cf87, startHeight: _0x5e408d, dx: _0x3b98ca, dy: _0x3243ae }) => {
            const _0x31c6f2 = _0x20cf87 / _0x5e408d,
              _0x544e9e = Math.max(_0x3b98ca / _0x20cf87, _0x3243ae / _0x5e408d),
              _0x17f65c = Math.max(SOURCE_VIDEO_MIN_SIZE / _0x20cf87, SOURCE_VIDEO_MIN_SIZE / _0x5e408d),
              _0x2b25bd = Math.max(_0x17f65c, 1 + _0x544e9e),
              _0x5f2235 = Math.max(SOURCE_VIDEO_MIN_SIZE, Math.round(_0x20cf87 * _0x2b25bd)),
              _0x493adc = Math.max(SOURCE_VIDEO_MIN_SIZE, Math.round(_0x5f2235 / _0x31c6f2));
            return { width: _0x5f2235, height: _0x493adc };
          },
          buildFinalPatch: ({ startNode: _0x1881ed }) =>
            _0x1881ed?.needsAutoResize ? { needsAutoResize: false } : {},
          applyPatch: (_0x16cc4f) => appStore.updateNodeData(this.id, _0x16cc4f),
          commit: commit,
        });
      });
    (this._input.addEventListener('change', async (_0x527e6b) => {
      const _0x189616 = _0x527e6b.target.files[0];
      if (!_0x189616) return;
      await this._handleUploadInputFile(_0x189616);
    }),
      this._muteBtn.addEventListener('click', (_0x496b93) => {
        _0x496b93.stopPropagation();
        if (VideoKeyingController.isActiveFor(this._data?.id)) return;
        this._setMuted(!this._isMuted, { persist: true });
      }),
      this._playBtn.addEventListener('click', (_0x107aff) => {
        _0x107aff.stopPropagation();
        if (VideoKeyingController.isActiveFor(this._data?.id)) return;
        if (!this._currentSrc) return;
        this._toggleManualPlayback({
          loop: _0x107aff.altKey === true,
          forcePlay: this._shouldKeepHoverPlaybackOnManualClick(),
        });
      }));
    if (this._bar) {
      let _0x2faf64 = false,
        _0x31f29d = 0;
      this._updateDragVisual = (_0x427f1f) => {
        if (this._fill) this._fill.style.width = _0x427f1f * 100 + '%';
        if (!this._timeCurrent) return;
        const _0x429f3e = this._getBaseDuration(),
          _0x503d50 = this._getClipRange(_0x429f3e),
          _0xc50c03 = _0x503d50.active ? Math.max(0, _0x503d50.end - _0x503d50.start) : _0x429f3e;
        if (_0xc50c03 && Number.isFinite(_0xc50c03))
          this._timeCurrent.textContent = this._fmt(_0x427f1f * _0xc50c03);
      };
      const _0x5c8dcc = (_0x5ce6e0) => {
          const _0x36f63c = this._bar;
          if (!_0x36f63c) return 0;
          const _0x3a3881 = _0x36f63c.getBoundingClientRect(),
            _0x8cceb4 = _0x3a3881.width || 0;
          if (!_0x8cceb4) return 0;
          const _0x468a63 = _0x5ce6e0.clientX - _0x3a3881.left;
          if (!Number.isFinite(_0x468a63)) return 0;
          return Math.max(0, Math.min(1, _0x468a63 / _0x8cceb4));
        },
        _0x4b4db4 = (_0x555328) => {
          if (!Number.isFinite(_0x555328)) return;
          const _0x5611e3 = this._getBaseDuration();
          if (!_0x5611e3 || !Number.isFinite(_0x5611e3)) return;
          const _0x480bb4 = this._getClipRange(_0x5611e3),
            _0x2a4d8c = _0x480bb4.active ? Math.max(0, _0x480bb4.end - _0x480bb4.start) : _0x5611e3;
          if (!_0x2a4d8c || !Number.isFinite(_0x2a4d8c)) return;
          const _0x3f7174 = Math.max(
            0,
            Math.min(_0x5611e3, (_0x480bb4.active ? _0x480bb4.start : 0) + _0x555328 * _0x2a4d8c),
          );
          if (!Number.isFinite(_0x3f7174)) return;
          const _0x3b0880 = this._ensureVideoElement();
          if (!_0x3b0880) return;
          this._isSeeking = true;
          const _0x343b62 = ++this._seekToken;
          _0x3b0880.currentTime = _0x3f7174;
          const _0x163523 = () => {
            if (_0x343b62 !== this._seekToken) return;
            this._isSeeking = false;
            const _0x52fa0c = this._getBaseDuration(),
              _0x502752 = this._getClipRange(_0x52fa0c),
              _0xcf3e95 = _0x502752.active ? Math.max(0, _0x502752.end - _0x502752.start) : _0x52fa0c,
              _0x1f43e5 = _0x3b0880.currentTime || 0;
            if (_0xcf3e95 && Number.isFinite(_0xcf3e95)) {
              const _0x4837c4 = _0x502752.active
                ? Math.max(0, Math.min(_0xcf3e95, _0x1f43e5 - _0x502752.start))
                : _0x1f43e5;
              ((this._fill.style.width = (_0x4837c4 / _0xcf3e95) * 100 + '%'),
                (this._timeCurrent.textContent = this._fmt(_0x4837c4)),
                (this._timeTotal.textContent = this._fmt(_0xcf3e95)));
            }
          };
          (_0x3b0880.addEventListener('seeked', _0x163523, { once: true }),
            window.setTimeout(_0x163523, 0x12c));
        },
        _0xbfcc9a = (_0x50988d) => {
          if (!_0x2faf64) return;
          (_0x50988d.stopPropagation(),
            _0x50988d.preventDefault(),
            (_0x31f29d = _0x5c8dcc(_0x50988d)),
            this._updateDragVisual(_0x31f29d));
        },
        _0x52dbfa = (_0x67149) => {
          if (!_0x2faf64) return;
          ((_0x2faf64 = false),
            (this._bar.dataset.dragging = 'false'),
            window.removeEventListener('pointermove', _0xbfcc9a, true),
            window.removeEventListener('pointerup', _0x52dbfa, true),
            _0x4b4db4(_0x31f29d));
        };
      this._bar.addEventListener('pointerdown', (_0x33d2a1) => {
        (_0x33d2a1.stopPropagation(), _0x33d2a1.preventDefault());
        if (VideoKeyingController.isActiveFor(this._data?.id)) return;
        if (!this._currentSrc) return;
        ((this._isManualControl = true),
          this._setManualLoopPlayback(false),
          this._autoPlayToken++,
          (this._hoverManualPause = true),
          this._ensureVideoElement()?.pause?.(),
          (_0x2faf64 = true),
          (this._bar.dataset.dragging = 'true'),
          (_0x31f29d = _0x5c8dcc(_0x33d2a1)),
          this._updateDragVisual(_0x31f29d),
          _0x4b4db4(_0x31f29d),
          window.addEventListener('pointermove', _0xbfcc9a, true),
          window.addEventListener('pointerup', _0x52dbfa, true));
      });
    }
    (this._snapBtn.addEventListener('click', (_0x45bd89) => {
      _0x45bd89.stopPropagation();
      if (VideoKeyingController.isActiveFor(this._data?.id)) return;
      void this._captureFrame();
    }),
      _0x4420ba.addEventListener('mouseenter', () => {
        const _0x406085 = appStore.getState().videoClip;
        if (_0x406085 && _0x406085.active && _0x406085.nodeId === this._data?.id) return;
        if (this._currentSrc && this._rendererMediaDeferred !== true) {
          const _0x47d412 = this._ensureVideoElement();
          if (!_0x47d412) return;
          this._isHovered = true;
          if (VideoKeyingController.isActiveFor(this._data?.id)) {
            _0x47d412.pause();
            return;
          }
          if (this._hoverManualPause) return;
          if (this._isManualLoopPlayback) return;
          const _0x33ee4a = this._getBaseDuration(),
            _0x46ab17 = this._getClipRange(_0x33ee4a);
          _0x47d412.loop = _0x46ab17.active ? false : true;
          if (_0x46ab17.active) {
            const _0x35d9dc = _0x47d412.currentTime || 0;
            if (_0x35d9dc < _0x46ab17.start || _0x35d9dc > _0x46ab17.end)
              _0x47d412.currentTime = _0x46ab17.start;
          }
          const _0x33054c = ++this._autoPlayToken;
          (logVideoPlaybackEvent(_0x47d412, 'hover-enter', { label: this._getPlaybackLabel('hover') }),
            void this._playVideoWithRecovery(
              'hover',
              () => this._autoPlayToken === _0x33054c && !this._hoverManualPause,
            ));
        }
      }),
      _0x4420ba.addEventListener('mouseleave', () => {
        const _0x28a6fe = appStore.getState().videoClip;
        if (_0x28a6fe && _0x28a6fe.active && _0x28a6fe.nodeId === this._data?.id) return;
        if (this._currentSrc) {
          const _0x2cb7de = this._isManualControl;
          ((this._isHovered = false), this._autoPlayToken++);
          const _0xab9a3c = this._video;
          if (!_0xab9a3c) {
            this._hoverManualPause = false;
            if (!this._isManualLoopPlayback) this._isManualControl = false;
            return;
          }
          !this._isManualLoopPlayback && (_0xab9a3c.loop = false);
          logVideoPlaybackEvent(_0xab9a3c, 'hover-leave', { label: this._getPlaybackLabel('hover') });
          !_0x2cb7de && _0xab9a3c.pause();
          this._hoverManualPause = false;
          if (!this._isManualLoopPlayback) this._isManualControl = false;
        }
      }),
      this._controls.addEventListener('pointerdown', (_0xc94325) => _0xc94325.stopPropagation()),
      this._muteBtn.addEventListener('pointerdown', (_0x48a0c1) => _0x48a0c1.stopPropagation()));
    const _0x4693ab = this._resolveVideoSrc(this._data);
    if (this._rendererMediaDeferred === true)
      ((this._currentSrc = _0x4693ab || ''),
        this._syncPosterFrameVisibility({ force: !!this._lastPosterSrc }));
    else {
      if (_0x4693ab) this._loadVideo(_0x4693ab);
      else this._loadVideo('');
    }
    this._clearResolvedVideoTimer(this._data, _0x4693ab);
    this._rendererMediaDeferred !== true && this._maybeFetchVideoMeta(this._data);
    (this._syncRunningHubVideoTaskState(this._data),
      this._maybeResumeRunningHubTask(),
      this._maybeResumeAsyncTask());
    const _0x3ca216 = _0x4420ba.querySelector('.node-floating-toolbar');
    return (bindVideoToolbarEvents(_0x3ca216, this._data), _0x4420ba);
  }
  ['_waitForUploadPaint']() {
    return waitForNextPaint();
  }
  ['_syncLocaleTexts']() {
    if (this._muteBtn) this._muteBtn.title = sourceVideoText('controls.toggleMute');
    if (this._snapBtn) this._snapBtn.title = sourceVideoText('controls.captureFrame');
    if (this._uploadBtn && !this._isUploading) {
      const _0x5a7d4f = this._uploadBtn.querySelector?.('.source-upload-label');
      _0x5a7d4f
        ? (_0x5a7d4f.textContent = sourceVideoText('upload.button'))
        : (this._uploadBtn.textContent = sourceVideoText('upload.button'));
    }
  }
  ['_syncMuteButtonIcon']() {
    if (!this._iconMuted || !this._iconUnmuted) return;
    ((this._iconMuted.style.display = this._isMuted ? 'block' : 'none'),
      (this._iconUnmuted.style.display = this._isMuted ? 'none' : 'block'));
  }
  ['_applyMutedState']() {
    if (this._video) this._video.muted = !!this._isMuted;
    this._syncMuteButtonIcon();
  }
  ['_syncMutedStateFromData'](_0x1bf310 = this._data) {
    ((this._isMuted = resolveVideoMutedPreference(_0x1bf310)), this._applyMutedState());
  }
  ['_setMuted'](_0x5724d5, { persist: persist = false } = {}) {
    ((this._isMuted = !!_0x5724d5), this._applyMutedState());
    if (!persist) return;
    const _0x21721a = appStore.getState().nodes?.[this.id] || this._data || {},
      _0x10ea34 = buildVideoMutedPatch(_0x21721a, this._isMuted);
    if (!_0x10ea34) return;
    (appStore.updateNodeData(this.id, _0x10ea34), (this._data = { ..._0x21721a, ..._0x10ea34 }));
  }
  ['_readUploadVideoNaturalSize'](_0x40e622) {
    return readVideoFileNaturalSize(_0x40e622);
  }
  ['_uploadSourceVideoFile'](_0x4fe96b, _0x240729) {
    return uploadFile(_0x4fe96b, _0x240729);
  }
  async ['_handleUploadInputFile'](_0x4a500e) {
    ((this._isUploading = true), startLoading(this._card, { variant: 'static' }));
    const _0x444ce5 = this._ensureVideoElement();
    if (_0x444ce5) _0x444ce5.style.display = 'none';
    this._controls.style.opacity = '0';
    const _0x501190 = Array.from(this._uploadBtn.childNodes).map((_0x30147f) => _0x30147f.cloneNode(true));
    ((this._uploadBtn.textContent = sourceVideoText('upload.uploading')),
      (this._uploadBtn.style.pointerEvents = 'none'));
    const _0x490f94 = this._currentSrc,
      _0x789555 = createVideoCapturePreviewUrl(_0x4a500e);
    _0x789555 && ((this._data = { ...this._data, capturePreviewUrl: _0x789555 }), this._loadVideo(_0x789555));
    try {
      const _0x8a5812 = window.currentProjectId || 'default_v2_project';
      await this._waitForUploadPaint();
      const _0x1bd193 = Promise.resolve()
          .then(() => this._readUploadVideoNaturalSize(_0x4a500e))
          .catch(() => null),
        _0x57ebec = await this._uploadSourceVideoFile(_0x4a500e, _0x8a5812),
        _0x3462a3 = await _0x1bd193,
        _0xecacd1 = _0x4a500e.name.replace(/\.[^/.]+$/, '');
      appStore.renameNode(this.id, _0xecacd1);
      const _0x1f5775 = document.getElementById(this.id),
        _0x478a78 = _0x1f5775?.__v2_name_el;
      if (_0x478a78) _0x478a78.textContent = _0xecacd1;
      const _0x1d3cc9 = _0x57ebec.url,
        _0x175d52 = pickResultLocalPath(_0x57ebec) || urlToLocalPath(_0x1d3cc9),
        _0xd9b633 = String(_0x57ebec.videoProxyStatus || '').trim(),
        _0x538997 = _0xd9b633 === 'processing' && !!_0x789555,
        _0x3d5506 =
          _0xd9b633 === 'processing'
            ? ''
            : String(_0x57ebec.displayUrl || '').trim() ||
              String(_0x57ebec.displayLocalPath ? '/' + _0x57ebec.displayLocalPath : '').trim() ||
              _0x1d3cc9,
        _0x19d852 = buildSourceVideoUploadSizePatch(
          {
            width: _0x57ebec.videoWidth || _0x57ebec.width,
            height: _0x57ebec.videoHeight || _0x57ebec.height,
          },
          _0x3462a3,
        );
      appStore.updateNodeData(this.id, {
        src: _0x3d5506,
        localPath: _0x175d52,
        assetId: _0x57ebec.assetId || '',
        originalLocalPath: _0x57ebec.originalLocalPath || _0x57ebec.localPath || '',
        displayLocalPath: _0x57ebec.displayLocalPath || '',
        posterLocalPath: _0x57ebec.posterLocalPath || '',
        thumbLocalPath: _0x57ebec.posterLocalPath || _0x57ebec.thumbLocalPath || '',
        thumbUrl: _0x57ebec.posterUrl || _0x57ebec.thumbUrl || '',
        derivativeStatus: _0x57ebec.derivativeStatus || _0x57ebec.status || '',
        mediaTaskId: _0x57ebec.mediaTaskId || '',
        mediaTaskKind: _0x57ebec.mediaTaskKind || '',
        mediaTaskStatus: _0x57ebec.mediaTaskStatus || '',
        mediaTaskProgress: Number(_0x57ebec.mediaTaskProgress || 0) || 0,
        mediaTaskError: _0x57ebec.mediaTaskError || '',
        videoProxyStatus: _0xd9b633,
        videoCodec: _0x57ebec.videoCodec || '',
        videoDuration: Number(_0x57ebec.videoDuration || 0) || 0,
        videoFps: Number(_0x57ebec.videoFps || 0) || 0,
        fileName: _0x57ebec.filename || _0x4a500e.name,
        capturePreviewUrl: _0x538997 ? _0x789555 : '',
        ..._0x19d852,
      });
    } catch (_0xa37ae7) {
      (console.error('视频上传失败:', _0xa37ae7),
        window.showToast(sourceVideoText('upload.failedRetry')),
        stopLoading(this._card));
      if (_0x789555 && this._currentSrc === _0x789555) {
        this._releaseActiveCapturePreviewUrl();
        if (_0x490f94) this._loadVideo(_0x490f94);
        else ((this._currentSrc = ''), this._loadVideo(''));
      }
      if (this._currentSrc) {
        const _0x34565b = this._ensureVideoElement();
        if (_0x34565b) _0x34565b.style.display = 'block';
        this._controls.style.opacity = '1';
      }
    } finally {
      ((this._isUploading = false),
        this._uploadBtn.replaceChildren(..._0x501190.map((_0x577ae4) => _0x577ae4.cloneNode(true))),
        this._syncLocaleTexts(),
        (this._uploadBtn.style.pointerEvents = 'auto'),
        (this._input.value = ''));
    }
  }
  ['_applyVideoPoster'](_0x4f2c22 = this._data) {
    const _0x24534b = resolveSourceVideoPosterSrc(_0x4f2c22);
    if (_0x24534b)
      (this._video && this._video.poster !== _0x24534b && (this._video.poster = _0x24534b),
        (this._lastPosterSrc = _0x24534b),
        this._applyPosterFrameSource(_0x24534b));
    else {
      if (this._video?.poster) {
        this._video.removeAttribute?.('poster');
        if (this._posterFrame) this._posterFrame.removeAttribute?.('src');
        this._lastPosterSrc = '';
      } else {
        if (this._posterFrame) this._posterFrame.removeAttribute?.('src');
        this._lastPosterSrc = '';
      }
    }
    return (this._syncPosterFrameVisibility({ force: !!_0x24534b }), _0x24534b);
  }
  ['_getPosterFrameSrc']() {
    if (!this._posterFrame) return '';
    return String(this._posterFrame.getAttribute?.('src') || this._posterFrame.src || '').trim();
  }
  ['_setPosterFrameSrc'](_0x3bd124) {
    if (!this._posterFrame) return;
    typeof this._posterFrame.setAttribute === 'function'
      ? this._posterFrame.setAttribute('src', _0x3bd124)
      : (this._posterFrame.src = _0x3bd124);
  }
  ['_applyPosterFrameSource'](_0x2caa8e) {
    if (!this._posterFrame || !_0x2caa8e) return;
    const _0x2a525e = this._getPosterFrameSrc();
    if (_0x2a525e === _0x2caa8e) return;
    const _0x5a078a = ({ requireConnected: requireConnected = false } = {}) => {
      if (
        !this._posterFrame ||
        (requireConnected && this._posterFrame.isConnected === false) ||
        this._lastPosterSrc !== _0x2caa8e
      )
        return;
      (this._setPosterFrameSrc(_0x2caa8e), this._syncPosterFrameVisibility({ force: true }));
    };
    if (!_0x2a525e || _0x2caa8e.startsWith('data:') || typeof Image !== 'function') {
      _0x5a078a();
      return;
    }
    const _0x52a829 = (this._posterFramePreloadToken || 0) + 1;
    ((this._posterFramePreloadToken = _0x52a829),
      preloadCanvasImage(_0x2caa8e, { priority: 85, fetchPriority: 'auto' }).then(
        () => {
          if (this._posterFramePreloadToken === _0x52a829) _0x5a078a({ requireConnected: true });
        },
        () => {
          if (this._posterFramePreloadToken === _0x52a829) _0x5a078a({ requireConnected: true });
        },
      ));
  }
  ['_setPosterFrameVisible'](_0x3c5f11) {
    if (!this._posterFrame) return;
    this._posterFrame.classList?.toggle('is-visible', !!_0x3c5f11);
  }
  ['_isVideoFrameReadyToShow']() {
    if (!this._video) return false;
    const _0x545552 = Number(this._video.readyState || 0);
    if (_0x545552 < 2) return false;
    if (!String(this._lastPosterSrc || '').trim()) return true;
    if (this._video.paused === false) return true;
    const _0x9bfad = Number(this._video.currentTime || 0);
    return _0x9bfad > 0.05;
  }
  ['_syncVideoElementFrameVisibility']({ forceHidden: forceHidden = false } = {}) {
    if (!this._video) return;
    if (!this._video.style) this._video.style = {};
    const _0x3a7b4f = !!(this._currentSrc || getVideoCurrentSource(this._video));
    if (!_0x3a7b4f) {
      ((this._video.style.display = 'none'),
        (this._video.style.opacity = ''),
        (this._video.style.visibility = ''));
      return;
    }
    this._video.style.display = 'block';
    if (!String(this._lastPosterSrc || '').trim()) {
      ((this._video.style.opacity = '1'), (this._video.style.visibility = 'visible'));
      return;
    }
    const _0x845f4e = forceHidden ? false : this._isVideoFrameReadyToShow();
    ((this._video.style.opacity = _0x845f4e ? '1' : '0'),
      (this._video.style.visibility = _0x845f4e ? 'visible' : 'hidden'));
  }
  ['_syncPosterFrameVisibility'](_0x2611e9 = {}) {
    this._syncVideoElementFrameVisibility();
    if (!this._posterFrame) return;
    const _0x1715f3 = String(this._lastPosterSrc || '').trim();
    if (!_0x1715f3) {
      this._setPosterFrameVisible(false);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(_0x2611e9, 'force')) {
      this._setPosterFrameVisible(!!_0x2611e9.force);
      _0x2611e9.force === true && this._syncVideoElementFrameVisibility({ forceHidden: true });
      return;
    }
    if (this._isVideoFrameReadyToShow()) {
      this._setPosterFrameVisible(false);
      return;
    }
    this._setPosterFrameVisible(true);
  }
  ['_clearVideoElementSource']({ load: load = true } = {}) {
    if (!this._video) return;
    (clearDesktopMediaPlaybackSourceMetadata(this._video), this._video.removeAttribute?.('src'));
    if (load !== false)
      try {
        this._video.load?.();
      } catch {}
  }
  ['_resolveVideoSrc'](_0x1cdfc8) {
    return resolveCanvasVideoUrl(_0x1cdfc8) || this._getCapturePreviewUrl(_0x1cdfc8);
  }
  ['_clearResolvedVideoTimer'](_0x3e25d4, _0xcb44e1) {
    if (!_0xcb44e1 || !_0x3e25d4 || typeof _0x3e25d4 !== 'object') return;
    const _0x456efa =
      !!String(_0x3e25d4.rhTaskId || _0x3e25d4.asyncTaskId || _0x3e25d4.dreaminaSubmitId || '').trim() ||
      _0x3e25d4.rhTaskRecovering === true ||
      _0x3e25d4.asyncTaskRecovering === true ||
      _0x3e25d4.dreaminaTaskRecovering === true;
    if (_0x456efa) return;
    if (!_0x3e25d4.generationStartTime && _0x3e25d4.generationDuration == null) return;
    const _0x138034 = appStore.getState().nodes?.[this.id];
    if (!_0x138034) return;
    const _0x256ddb = {};
    if (_0x138034.generationStartTime) _0x256ddb.generationStartTime = null;
    if (_0x138034.generationDuration != null) _0x256ddb.generationDuration = null;
    if (_0x138034.isGenerating === true) _0x256ddb.isGenerating = false;
    Object.keys(_0x256ddb).length > 0 && appStore.updateNodeData(this.id, _0x256ddb);
  }
  ['_clearMediaUnavailableAfterPlayback'](_0x50e068) {
    const _0x4a4b4c = appStore.getState().nodes?.[this.id] || this._data || null;
    if (!_0x4a4b4c || _0x4a4b4c.mediaUnavailable !== true) return;
    const _0x396344 = String(_0x4a4b4c.mediaUnavailableSource || '').trim();
    if (!_0x396344) return;
    const _0x2fcfdd = new Set(),
      _0x223107 = (_0x4dca99) => {
        const _0x5e62cf = String(_0x4dca99 || '').trim();
        if (!_0x5e62cf) return;
        _0x2fcfdd.add(_0x5e62cf);
        const _0x1cc3e3 = urlToLocalPath(_0x5e62cf);
        if (_0x1cc3e3) _0x2fcfdd.add(_0x1cc3e3);
        const _0x48a22a = localPathToUrl(_0x5e62cf);
        if (_0x48a22a) _0x2fcfdd.add(_0x48a22a);
      };
    [
      _0x4a4b4c.localPath,
      _0x4a4b4c.displayLocalPath,
      _0x4a4b4c.originalLocalPath,
      _0x4a4b4c.videoLocalPath,
      _0x4a4b4c.videoUrl,
      _0x4a4b4c.src,
      _0x4a4b4c.url,
      _0x4a4b4c.resultUrl,
      _0x4a4b4c.sourceUrl,
      _0x50e068,
    ].forEach(_0x223107);
    if (!_0x2fcfdd.has(_0x396344)) return;
    appStore.updateNodeData(this.id, { mediaUnavailable: false, mediaUnavailableSource: '' });
  }
  ['_getCapturePreviewUrl'](_0x4f2517 = this._data) {
    const _0x117692 = String(_0x4f2517?.capturePreviewUrl || '').trim();
    return _0x117692.startsWith('blob:') || _0x117692.startsWith('aic-local-preview:') ? _0x117692 : '';
  }
  ['_revokeCapturePreviewUrl'](_0x3b1efd) {
    const _0x1c5855 = String(_0x3b1efd || '').trim();
    if (!_0x1c5855.startsWith('blob:')) return;
    const _0x911d86 = globalThis.window?.URL || globalThis.URL;
    if (typeof _0x911d86?.revokeObjectURL !== 'function') return;
    try {
      _0x911d86.revokeObjectURL(_0x1c5855);
    } catch {}
  }
  ['_adoptCapturePreviewUrl'](_0x18515f) {
    const _0x565295 = String(_0x18515f || '').trim();
    (this._activeCapturePreviewUrl &&
      this._activeCapturePreviewUrl !== _0x565295 &&
      this._revokeCapturePreviewUrl(this._activeCapturePreviewUrl),
      (this._activeCapturePreviewUrl = _0x565295));
  }
  ['_releaseActiveCapturePreviewUrl']() {
    if (!this._activeCapturePreviewUrl) return;
    const _0xa7d44a = this._activeCapturePreviewUrl;
    ((this._activeCapturePreviewUrl = ''), this._revokeCapturePreviewUrl(_0xa7d44a));
  }
  ['_resolveVideoMetaSrc'](_0x44cf5b) {
    if (!_0x44cf5b) return '';
    const _0x47e581 = resolveSourceVideoMediaTaskSrc(_0x44cf5b);
    if (_0x47e581) return _0x47e581;
    const _0xb6ac42 = this._resolveVideoSrc(_0x44cf5b);
    if (!_0xb6ac42) return '';
    const _0x4e214f = String(_0xb6ac42);
    if (
      _0x4e214f.startsWith('http://') ||
      _0x4e214f.startsWith('https://') ||
      _0x4e214f.startsWith('blob:') ||
      _0x4e214f.startsWith('aic-local-preview:') ||
      _0x4e214f.startsWith('data:')
    )
      return '';
    return urlToLocalPath(_0x4e214f) || '';
  }
  async ['_maybeFetchVideoMeta'](_0x117ed7) {
    if (!shouldFetchVideoMetaForNodeInfo()) return;
    const _0x55e406 = this._resolveVideoMetaSrc(_0x117ed7);
    if (!_0x55e406) return;
    const _0x362823 = appStore.getState().nodes[this.id];
    if (!_0x362823) return;
    const _0x572539 = String(_0x362823.videoMetaSrc || ''),
      _0x32a461 =
        Number.isFinite(Number(_0x362823.videoFps)) &&
        Number(_0x362823.videoFps) > 0 &&
        Number.isFinite(Number(_0x362823.videoFrameCount)) &&
        Number(_0x362823.videoFrameCount) > 0;
    if (_0x32a461 && _0x572539 === _0x55e406) return;
    _0x572539 &&
      _0x572539 !== _0x55e406 &&
      appStore.updateNodeData(this.id, {
        videoMetaSrc: _0x55e406,
        videoFps: null,
        videoFrameCount: null,
        videoDuration: null,
        videoWidth: null,
        videoHeight: null,
      });
    const _0x574e75 = ++this._metaFetchToken;
    try {
      const _0x32249b = await fetchVideoMetaFromServer(_0x55e406);
      if (_0x574e75 !== this._metaFetchToken) return;
      if (!_0x32249b || _0x32249b.success !== true) return;
      const _0x56bfbd = Number(_0x32249b.fps),
        _0x177100 = Number(_0x32249b.frameCount),
        _0x35ae5c = Number(_0x32249b.duration),
        _0x4d6f7f = Number(_0x32249b.width),
        _0x49fa43 = Number(_0x32249b.height),
        _0x3acfb4 = { videoMetaSrc: _0x55e406 };
      if (Number.isFinite(_0x56bfbd) && _0x56bfbd > 0) _0x3acfb4.videoFps = _0x56bfbd;
      if (Number.isFinite(_0x177100) && _0x177100 > 0) _0x3acfb4.videoFrameCount = Math.round(_0x177100);
      if (Number.isFinite(_0x35ae5c) && _0x35ae5c > 0) _0x3acfb4.videoDuration = _0x35ae5c;
      if (Number.isFinite(_0x4d6f7f) && _0x4d6f7f > 0) _0x3acfb4.videoWidth = Math.round(_0x4d6f7f);
      if (Number.isFinite(_0x49fa43) && _0x49fa43 > 0) _0x3acfb4.videoHeight = Math.round(_0x49fa43);
      const _0x3c9bfc = appStore.getState().nodes[this.id];
      if (!_0x3c9bfc) return;
      const _0x3e66c9 =
        String(_0x3c9bfc.videoMetaSrc || '') !== String(_0x3acfb4.videoMetaSrc || '') ||
        Number(_0x3c9bfc.videoFps || 0) !== Number(_0x3acfb4.videoFps || 0) ||
        Number(_0x3c9bfc.videoFrameCount || 0) !== Number(_0x3acfb4.videoFrameCount || 0) ||
        Number(_0x3c9bfc.videoDuration || 0) !== Number(_0x3acfb4.videoDuration || 0) ||
        Number(_0x3c9bfc.videoWidth || 0) !== Number(_0x3acfb4.videoWidth || 0) ||
        Number(_0x3c9bfc.videoHeight || 0) !== Number(_0x3acfb4.videoHeight || 0);
      if (_0x3e66c9) appStore.updateNodeData(this.id, _0x3acfb4);
    } catch {}
  }
  ['_scheduleMaybeEnsureVideoThumb']() {
    if (this._idleVideoThumbCancel) return;
    this._idleVideoThumbCancel = scheduleSourceVideoIdleTask(() => {
      ((this._idleVideoThumbCancel = null), void this._maybeEnsureVideoThumb(this._data));
    });
  }
  async ['_maybeEnsureVideoThumb'](_0x41ccc7) {
    const _0x585a95 = this._resolveVideoMetaSrc(_0x41ccc7);
    if (!_0x585a95) return;
    const _0x257b68 = appStore.getState().nodes[this.id];
    if (!_0x257b68) return;
    const _0x1ad733 = String(_0x257b68.videoThumbSrc || ''),
      _0x1492a2 = !!String(_0x257b68.thumbUrl || '').trim();
    if (_0x1492a2 && _0x1ad733 === _0x585a95) return;
    if (
      _0x1ad733 === _0x585a95 &&
      ['waiting', 'processing'].includes(String(_0x257b68.mediaTaskStatus || '')) &&
      ['videoFirstFrame', 'videoPoster'].includes(String(_0x257b68.mediaTaskKind || ''))
    )
      return;
    if (_0x1ad733 && _0x1ad733 !== _0x585a95)
      appStore.updateNodeData(this.id, { videoThumbSrc: _0x585a95, thumbUrl: null });
    else !_0x1ad733 && appStore.updateNodeData(this.id, { videoThumbSrc: _0x585a95 });
    const _0x43d3ea = ++this._thumbFetchToken;
    try {
      const _0x41db1b = await fetchVideoFirstFrameThumbFromServer(_0x585a95, {
        nodeId: this.id,
        assetId: String(_0x257b68.assetId || ''),
      });
      if (_0x43d3ea !== this._thumbFetchToken) return;
      if (!_0x41db1b || _0x41db1b.success === false) return;
      const _0x3c5b0b = String(_0x41db1b.thumbUrl || _0x41db1b.url || '').trim();
      if (!_0x3c5b0b) return;
      const _0x52e108 = appStore.getState().nodes[this.id];
      if (!_0x52e108) return;
      const _0x1f12ee =
        String(_0x52e108.videoThumbSrc || '') !== String(_0x585a95 || '') ||
        String(_0x52e108.thumbUrl || '') !== _0x3c5b0b;
      _0x1f12ee && appStore.updateNodeData(this.id, { videoThumbSrc: _0x585a95, thumbUrl: _0x3c5b0b });
    } catch {}
  }
  ['_getBaseDuration']() {
    const _0x3ed3d5 = this._video;
    if (!_0x3ed3d5) return 0;
    const _0x3fb73b = Number(_0x3ed3d5.duration);
    if (Number.isFinite(_0x3fb73b) && _0x3fb73b > 0) return _0x3fb73b;
    const _0x504c7c = _0x3ed3d5.seekable;
    if (_0x504c7c && _0x504c7c.length) {
      const _0x2f8fbb = Number(_0x504c7c.end(_0x504c7c.length - 1));
      if (Number.isFinite(_0x2f8fbb) && _0x2f8fbb > 0) return _0x2f8fbb;
    }
    return 0;
  }
  ['_getClipRange'](_0x343ad5) {
    const _0x26c3fb = Number(_0x343ad5);
    if (!Number.isFinite(_0x26c3fb) || _0x26c3fb <= 0) return { active: false, start: 0, end: 0 };
    const _0x5f1a7b = Number(this._data?.clipStart),
      _0x5f48a1 = Number(this._data?.clipEnd);
    if (!Number.isFinite(_0x5f1a7b) || !Number.isFinite(_0x5f48a1) || !(_0x5f48a1 > _0x5f1a7b))
      return { active: false, start: 0, end: _0x26c3fb };
    const _0x413135 = Math.max(0, Math.min(_0x26c3fb, _0x5f1a7b)),
      _0x3917b0 = Math.max(0, Math.min(_0x26c3fb, _0x5f48a1));
    if (!(_0x3917b0 > _0x413135)) return { active: false, start: 0, end: _0x26c3fb };
    return { active: true, start: _0x413135, end: _0x3917b0 };
  }
  ['_setManualLoopPlayback'](_0x1a39fb) {
    this._isManualLoopPlayback = _0x1a39fb === true;
    if (!this._video) return;
    if (!this._isManualLoopPlayback) {
      this._video.loop = false;
      return;
    }
    const _0xfc1710 = this._getClipRange(this._getBaseDuration());
    this._video.loop = !_0xfc1710.active;
  }
  ['_shouldKeepHoverPlaybackOnManualClick']() {
    if (!this._video) return false;
    if (!this._isHovered || this._isManualControl || this._hoverManualPause) return false;
    if (this._video.paused) return false;
    const _0x11f0d3 = Number(this._video.currentTime || 0);
    return !(_0x11f0d3 > 0.05);
  }
  ['_toggleManualPlayback']({ loop: loop = false, forcePlay: forcePlay = false } = {}) {
    if (!this._currentSrc) return;
    const _0x391fd3 = this._ensureVideoElement();
    if (!_0x391fd3) return;
    ((this._isManualControl = true), this._autoPlayToken++);
    if (_0x391fd3.paused || forcePlay === true) {
      ((this._hoverManualPause = false), this._setManualLoopPlayback(loop === true));
      const _0x28ba64 = this._getBaseDuration(),
        _0x119676 = this._getClipRange(_0x28ba64);
      if (_0x119676.active) {
        const _0x3f0cb7 = _0x391fd3.currentTime || 0;
        if (_0x3f0cb7 < _0x119676.start || _0x3f0cb7 > _0x119676.end) _0x391fd3.currentTime = _0x119676.start;
      }
      void this._playVideoWithRecovery('manual', () => this._isManualControl).then((_0x5e9ec5) => {
        _0x5e9ec5 ? this._flashCenterIndicator('play') : this._setManualLoopPlayback(false);
      });
    } else
      ((this._hoverManualPause = true),
        this._setManualLoopPlayback(false),
        _0x391fd3.pause(),
        this._flashCenterIndicator('pause'));
  }
  ['_getPlaybackLabel'](_0x4ca9d5 = 'preview') {
    return 'source-video:' + this.id + ':' + _0x4ca9d5;
  }
  async ['_openFullscreenFromCurrentVideo']() {
    const _0x37acce = this._ensureVideoElement();
    if (!_0x37acce) return;
    const _0x3c5726 = getVideoCurrentSource(_0x37acce) || this._currentSrc;
    if (!_0x3c5726) return;
    !getVideoCurrentSource(_0x37acce) &&
      (await attachMediaElementPlaybackSource(_0x37acce, _0x3c5726, {
        preload: 'auto',
        warmRanges: false,
        load: false,
      }));
    const _0x137112 = document.createElement('div');
    Object.assign(_0x137112.style, {
      position: 'fixed',
      inset: '0',
      background: 'var(--overlay-dim)',
      zIndex: '99999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'zoom-out',
    });
    const _0x2efffa = _0x37acce.parentNode,
      _0x4d5b45 = _0x37acce.nextSibling,
      _0x35eb3c = this._isManualControl,
      _0x13ac84 = this._hoverManualPause,
      _0x21f669 = {
        controls: _0x37acce.controls,
        loop: _0x37acce.loop,
        muted: _0x37acce.muted,
        position: _0x37acce.style.position,
        inset: _0x37acce.style.inset,
        width: _0x37acce.style.width,
        height: _0x37acce.style.height,
        maxWidth: _0x37acce.style.maxWidth,
        maxHeight: _0x37acce.style.maxHeight,
        objectFit: _0x37acce.style.objectFit,
        borderRadius: _0x37acce.style.borderRadius,
        margin: _0x37acce.style.margin,
        pointerEvents: _0x37acce.style.pointerEvents,
        boxShadow: _0x37acce.style.boxShadow,
      };
    ((this._isManualControl = true),
      (this._hoverManualPause = false),
      (_0x37acce.controls = true),
      (_0x37acce.loop = true),
      (_0x37acce.muted = !!this._isMuted),
      Object.assign(_0x37acce.style, {
        position: 'static',
        inset: '',
        width: 'auto',
        height: 'auto',
        maxWidth: '90%',
        maxHeight: '90%',
        objectFit: 'contain',
        borderRadius: '8px',
        margin: '0',
        pointerEvents: 'auto',
        boxShadow: '0 0 50px var(--black-80)',
      }),
      attachVideoPlaybackRecovery(_0x37acce, {
        label: this._getPlaybackLabel('fullscreen'),
        minBufferAhead: 0.5,
        readyTimeoutMs: 0x15e,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 0x1f4,
        shouldRecover: () => _0x37acce.isConnected !== false && !_0x37acce.paused,
      }));
    let _0x4347f9 = false;
    const _0x56b80e = () => {
      if (_0x4347f9) return;
      _0x4347f9 = true;
      try {
        _0x37acce.pause();
      } catch {}
      ((_0x37acce.controls = _0x21f669.controls),
        (_0x37acce.loop = _0x21f669.loop),
        (_0x37acce.muted = _0x21f669.muted),
        Object.assign(_0x37acce.style, {
          position: _0x21f669.position,
          inset: _0x21f669.inset,
          width: _0x21f669.width,
          height: _0x21f669.height,
          maxWidth: _0x21f669.maxWidth,
          maxHeight: _0x21f669.maxHeight,
          objectFit: _0x21f669.objectFit,
          borderRadius: _0x21f669.borderRadius,
          margin: _0x21f669.margin,
          pointerEvents: _0x21f669.pointerEvents,
          boxShadow: _0x21f669.boxShadow,
        }));
      if (_0x2efffa) _0x2efffa.insertBefore(_0x37acce, _0x4d5b45);
      (_0x137112.remove(),
        (this._isManualControl = _0x35eb3c),
        (this._hoverManualPause = _0x13ac84),
        this._attachPlaybackRecovery());
    };
    (_0x137112.addEventListener('click', (_0xd28ca6) => {
      if (_0xd28ca6.target === _0x137112) _0x56b80e();
    }),
      _0x137112.appendChild(_0x37acce),
      document.body.appendChild(_0x137112),
      void playVideoWithRecovery(_0x37acce, {
        label: this._getPlaybackLabel('fullscreen'),
        minBufferAhead: 0.5,
        readyTimeoutMs: 0x15e,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 0x1f4,
        shouldRecover: () => _0x37acce.isConnected !== false && !_0x37acce.paused,
      }));
  }
  async ['_ensurePlaybackVideoSrc']({ forPlayback: forPlayback = false } = {}) {
    const _0x58d922 = this._ensureVideoElement();
    if (!_0x58d922) return false;
    if (getVideoCurrentSource(_0x58d922))
      return (forPlayback && _0x58d922.preload !== 'auto' && (_0x58d922.preload = 'auto'), true);
    const _0x50ebc0 = String(this._currentSrc || this._resolveVideoSrc(this._data) || '').trim();
    if (!_0x50ebc0) return false;
    this._currentSrc = _0x50ebc0;
    if (this._currentSrc !== _0x50ebc0) return false;
    return (
      await attachMediaElementPlaybackSource(_0x58d922, _0x50ebc0, {
        preload: forPlayback ? 'auto' : SOURCE_VIDEO_POSTER_PRELOAD,
        warmRanges: false,
        load: forPlayback || (!forPlayback && !isDesktopRenderer()),
      }),
      true
    );
  }
  ['_attachPlaybackRecovery'](_0x1d6540 = 'preview') {
    if (!this._video) return null;
    const _0xc4c614 = _0x1d6540 === 'hover' || _0x1d6540 === 'fullscreen';
    return attachVideoPlaybackRecovery(this._video, {
      label: this._getPlaybackLabel(_0x1d6540),
      ensureSrc: () => this._ensurePlaybackVideoSrc({ forPlayback: true }),
      minBufferAhead: _0xc4c614 ? 0.5 : undefined,
      readyTimeoutMs: _0xc4c614 ? 0x15e : undefined,
      recoveryDebounceMs: _0xc4c614 ? 150 : undefined,
      recoveryCooldownMs: _0xc4c614 ? 0x1f4 : undefined,
      shouldRecover: () =>
        this._video?.isConnected !== false &&
        (this._isHovered || this._isManualControl || !this._video?.paused),
    });
  }
  async ['_playVideoWithRecovery'](_0x553876, _0x6d200) {
    const _0x4b5467 = this._ensureVideoElement();
    if (!_0x4b5467) return false;
    return (
      this._attachPlaybackRecovery(_0x553876),
      playVideoWithRecovery(_0x4b5467, {
        label: this._getPlaybackLabel(_0x553876),
        ensureSrc: () => this._ensurePlaybackVideoSrc({ forPlayback: true }),
        minBufferAhead: _0x553876 === 'hover' ? 0.5 : undefined,
        readyTimeoutMs: _0x553876 === 'hover' ? 0x15e : undefined,
        recoveryDebounceMs: _0x553876 === 'hover' ? 150 : undefined,
        recoveryCooldownMs: _0x553876 === 'hover' ? 0x1f4 : undefined,
        shouldRecover: () =>
          this._video?.isConnected !== false &&
          (this._isHovered || this._isManualControl || !this._video?.paused),
        shouldContinue: _0x6d200,
      })
    );
  }
  ['_loadVideo'](_0x13664b) {
    const _0x4251bc = String(_0x13664b || '').trim();
    if (this._rendererMediaDeferred === true) {
      ((this._currentSrc = _0x4251bc), this._applyVideoPoster(this._data));
      return;
    }
    this._setManualLoopPlayback(false);
    const _0x3ea479 = this._applyVideoPoster(this._data);
    if (!_0x4251bc) {
      this._idleVideoThumbCancel && (this._idleVideoThumbCancel(), (this._idleVideoThumbCancel = null));
      ((this._loadVideoToken = null), this._releaseActiveCapturePreviewUrl());
      this._video &&
        ((this._video.onloadeddata = null),
        (this._video.onerror = null),
        (this._video.preload = 'none'),
        this._clearVideoElementSource(),
        (this._video.style.display = 'none'));
      this._setPosterFrameVisible(false);
      this._data?.isGenerating && startLoading(this._card, { variant: 'full' });
      !this._data?.isGenerating && stopLoading(this._card);
      if (this._hint) this._hint.style.display = this._data?.isGenerating ? 'none' : 'block';
      ((this._controls.style.opacity = '0'), (this._muteBtn.style.display = 'none'));
      if (this._centerIndicator) this._centerIndicator.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = !!this._data?.isGenerating;
      return;
    }
    const _0x20470e = this._getCapturePreviewUrl(this._data);
    if (_0x4251bc === _0x20470e) this._adoptCapturePreviewUrl(_0x4251bc);
    else this._activeCapturePreviewUrl && this._releaseActiveCapturePreviewUrl();
    this._currentSrc = _0x4251bc;
    if (_0x3ea479) {
      this._idleVideoThumbCancel && (this._idleVideoThumbCancel(), (this._idleVideoThumbCancel = null));
      this._loadVideoToken = null;
      if (this._video) {
        ((this._video.onloadeddata = null), (this._video.onerror = null));
        const _0x480cda = getVideoCurrentSource(this._video);
        (_0x480cda && _0x480cda !== _0x4251bc && this._clearVideoElementSource({ load: false }),
          (this._video.preload = 'none'),
          this._syncVideoElementFrameVisibility({ forceHidden: true }));
      }
      (this._syncVideoDurationUi(),
        stopLoading(this._card),
        this._syncPosterFrameVisibility({ force: true }),
        (this._controls.style.opacity = '1'),
        (this._muteBtn.style.display = 'flex'));
      this._centerIndicator &&
        ((this._centerIndicator.style.display = 'flex'), this._showPausedCenterIndicator());
      if (this._hint) this._hint.style.display = 'block';
      return;
    }
    let _0x3392dd = false;
    const _0x2d064d = () => {
      if (_0x3392dd || this._currentSrc !== _0x4251bc) return;
      ((_0x3392dd = true), stopLoading(this._card), this._clearMediaUnavailableAfterPlayback(_0x4251bc));
      this._activeCapturePreviewUrl &&
        this._activeCapturePreviewUrl !== _0x4251bc &&
        this._releaseActiveCapturePreviewUrl();
      ((this._controls.style.opacity = '1'), (this._muteBtn.style.display = 'flex'));
      this._centerIndicator &&
        ((this._centerIndicator.style.display = 'flex'),
        this._video?.paused !== false ? this._showPausedCenterIndicator() : this._hideCenterIndicator());
      if (this._hint) this._hint.style.display = 'block';
      (this._maybeEnsureVideoThumb(this._data), this._syncPosterFrameVisibility());
    };
    if (isDesktopRenderer()) {
      this._loadVideoToken = null;
      this._video && getVideoCurrentSource(this._video) && this._clearVideoElementSource();
      this._video &&
        ((this._video.onloadeddata = _0x2d064d),
        (this._video.onerror = () => {
          if (this._currentSrc === _0x4251bc) stopLoading(this._card);
        }),
        (this._video.preload = 'none'),
        this._syncVideoElementFrameVisibility({ forceHidden: true }));
      (this._syncPosterFrameVisibility({ force: !!_0x3ea479 }),
        (this._controls.style.opacity = '1'),
        (this._muteBtn.style.display = 'flex'));
      this._centerIndicator &&
        ((this._centerIndicator.style.display = 'flex'), this._showPausedCenterIndicator());
      if (this._hint) this._hint.style.display = 'block';
      (stopLoading(this._card), this._scheduleMaybeEnsureVideoThumb(), this._attachPlaybackRecovery());
      return;
    }
    const _0x1c3a96 = this._ensureVideoElement();
    if (!_0x1c3a96) {
      stopLoading(this._card);
      return;
    }
    ((_0x1c3a96.onloadeddata = _0x2d064d),
      (_0x1c3a96.onerror = () => {
        if (this._currentSrc === _0x4251bc) stopLoading(this._card);
      }),
      startLoading(this._card, { variant: 'static' }),
      (_0x1c3a96.style.display = 'block'),
      this._syncVideoElementFrameVisibility(),
      this._setPosterFrameVisible(false),
      (this._controls.style.opacity = '0'),
      (this._muteBtn.style.display = 'none'));
    if (this._centerIndicator) this._centerIndicator.style.display = 'none';
    const _0x1cf916 = {};
    this._loadVideoToken = _0x1cf916;
    const _0x2c6b4a = () => {
      if (!this._video || this._loadVideoToken !== _0x1cf916 || this._currentSrc !== _0x4251bc) return;
      ((this._video.preload = 'auto'), (this._video.src = _0x4251bc));
      try {
        this._video.load?.();
      } catch {}
      if (Number(this._video.readyState || 0) >= 2) _0x2d064d();
    };
    (_0x2c6b4a(), this._attachPlaybackRecovery());
    if (this._hint) this._hint.style.display = 'block';
  }
  ['_fmt'](_0x1f6ff1) {
    if (!_0x1f6ff1 || isNaN(_0x1f6ff1)) return '0:00';
    return Math.floor(_0x1f6ff1 / 60) + ':' + String(Math.floor(_0x1f6ff1 % 60)).padStart(2, '0');
  }
  ['_getNodeDuration'](_0x5cff46 = this._data) {
    const _0x34a5cf = Number(_0x5cff46?.videoDuration || _0x5cff46?.duration || 0);
    if (Number.isFinite(_0x34a5cf) && _0x34a5cf > 0) return _0x34a5cf;
    const _0x4ab51c = Number(_0x5cff46?.videoFrameCount || _0x5cff46?.frameCount || 0),
      _0xe38a36 = Number(_0x5cff46?.videoFps || _0x5cff46?.fps || 0);
    if (Number.isFinite(_0x4ab51c) && _0x4ab51c > 0 && Number.isFinite(_0xe38a36) && _0xe38a36 > 0)
      return _0x4ab51c / _0xe38a36;
    return 0;
  }
  ['_syncVideoDurationUi']() {
    if (!this._timeTotal) return;
    const _0x2b163a = this._getBaseDuration() || this._getNodeDuration(this._data);
    if (!_0x2b163a || !Number.isFinite(_0x2b163a)) return;
    const _0x2d4c01 = this._getClipRange(_0x2b163a),
      _0x258982 = _0x2d4c01.active ? Math.max(0, _0x2d4c01.end - _0x2d4c01.start) : _0x2b163a;
    if (!_0x258982 || !Number.isFinite(_0x258982)) return;
    this._timeTotal.textContent = this._fmt(_0x258982);
  }
  ['_setCenterIndicatorIcon'](_0x1045b0) {
    if (!this._indicatorInner) return;
    const _0x375596 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    (_0x375596.setAttribute('width', '28'),
      _0x375596.setAttribute('height', '28'),
      _0x375596.setAttribute('viewBox', '0 0 24 24'),
      _0x375596.setAttribute('fill', 'currentColor'),
      (_0x375596.style.color = 'var(--canvas-white)'),
      _0x1045b0 === 'play'
        ? (_0x375596.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"></polygon>')
        : (_0x375596.innerHTML =
            '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>'),
      (this._indicatorInner.innerHTML = ''),
      this._indicatorInner.appendChild(_0x375596));
  }
  ['_showPausedCenterIndicator']() {
    if (!this._indicatorInner) return;
    (this._centerIndicatorTimer &&
      (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
      this._setCenterIndicatorIcon('play'),
      (this._indicatorInner.style.opacity = '1'),
      (this._indicatorInner.style.transform = 'scale(1)'));
  }
  ['_hideCenterIndicator']() {
    if (!this._indicatorInner) return;
    (this._centerIndicatorTimer &&
      (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
      (this._indicatorInner.style.opacity = '0'),
      (this._indicatorInner.style.transform = 'scale(0.92)'));
  }
  ['_flashCenterIndicator'](_0x125930) {
    if (!this._indicatorInner) return;
    (this._centerIndicatorTimer &&
      (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
      this._setCenterIndicatorIcon(_0x125930),
      (this._indicatorInner.style.opacity = '1'),
      (this._indicatorInner.style.transform = 'scale(1)'),
      (this._centerIndicatorTimer = setTimeout(() => {
        if (!this._indicatorInner) return;
        if (_0x125930 === 'pause') this._showPausedCenterIndicator();
        else this._hideCenterIndicator();
        this._centerIndicatorTimer = null;
      }, 0x208)));
  }
  ['_updatePlayIcon'](_0x2b97a8) {
    if (!this._playBtn) return;
    this._playBtn.replaceChildren();
    const _0x3743a5 = 'http://www.w3.org/2000/svg',
      _0x364aaf = document.createElementNS(_0x3743a5, 'svg');
    (_0x364aaf.setAttribute('width', '16'),
      _0x364aaf.setAttribute('height', '16'),
      _0x364aaf.setAttribute('viewBox', '0 0 24 24'),
      _0x364aaf.setAttribute('fill', 'currentColor'));
    if (_0x2b97a8) {
      const _0x1b1942 = document.createElementNS(_0x3743a5, 'polygon');
      (_0x1b1942.setAttribute('points', '5 3 19 12 5 21 5 3'), _0x364aaf.appendChild(_0x1b1942));
    } else {
      const _0x449141 = document.createElementNS(_0x3743a5, 'rect');
      (_0x449141.setAttribute('x', '6'),
        _0x449141.setAttribute('y', '4'),
        _0x449141.setAttribute('width', '4'),
        _0x449141.setAttribute('height', '16'));
      const _0x19388d = document.createElementNS(_0x3743a5, 'rect');
      (_0x19388d.setAttribute('x', '14'),
        _0x19388d.setAttribute('y', '4'),
        _0x19388d.setAttribute('width', '4'),
        _0x19388d.setAttribute('height', '16'),
        _0x364aaf.appendChild(_0x449141),
        _0x364aaf.appendChild(_0x19388d));
    }
    this._playBtn.appendChild(_0x364aaf);
  }
  async ['_captureFrame']() {
    const _0x3ed9e7 = await this._ensurePlaybackVideoSrc();
    if (!_0x3ed9e7 || !this._video) return;
    await extractCurrentVideoFrameToImageNode({
      videoEl: this._video,
      anchorNodeId: this.id,
      fallbackDurationSec: this._getBaseDuration(),
      onMissingMetadata: (_0x2e1920) => this._maybeFetchVideoMeta(_0x2e1920),
      logPrefix: '[SourceVideoNode]',
    });
  }
  ['_computeGenerationDuration'](_0x3c6a3e = this._data) {
    if (!_0x3c6a3e) return 0;
    if (typeof _0x3c6a3e.generationDuration === 'number') return _0x3c6a3e.generationDuration;
    const _0x203b93 = Number(_0x3c6a3e.generationStartTime || 0);
    if (!Number.isFinite(_0x203b93) || _0x203b93 <= 0) return 0;
    return Math.max(0, Date.now() - _0x203b93);
  }
  ['_isRunningHubRecoverableTask'](_0x53dd34 = this._data) {
    if (!_0x53dd34 || typeof _0x53dd34 !== 'object') return false;
    const _0x5a81e6 = String(_0x53dd34.rhTaskId || '').trim();
    if (!_0x5a81e6) return false;
    const _0x329b65 = String(_0x53dd34.rhTaskStatus || '')
      .trim()
      .toLowerCase();
    if (['success', 'failed', 'idle', 'cancelled'].includes(_0x329b65)) return false;
    return isRunningHubVideoTask(_0x53dd34);
  }
  ['_syncRunningHubVideoTaskState'](_0x53b16b = this._data) {
    if (!_0x53b16b || typeof _0x53b16b !== 'object') return false;
    const _0x288c35 = buildRunningHubVideoTerminalStatePatch(
      _0x53b16b,
      _0x53b16b.rhTaskStatus,
      this._computeGenerationDuration(_0x53b16b),
    );
    if (!_0x288c35) return false;
    return (appStore.updateNodeData(this.id, _0x288c35), true);
  }
  ['_isAsyncRecoverableTask'](_0x2804b7 = this._data) {
    if (!_0x2804b7 || typeof _0x2804b7 !== 'object') return false;
    const _0x1b0246 = String(_0x2804b7.asyncTaskId || '').trim();
    if (!_0x1b0246) return false;
    const _0xe87727 = String(_0x2804b7.asyncTaskProvider || _0x2804b7.provider || '')
      .trim()
      .toLowerCase();
    if (!_0xe87727 || _0xe87727 === 'runninghubwf' || _0xe87727 === 'runninghub' || _0xe87727 === 'dreamina')
      return false;
    const _0x2eee49 = String(_0x2804b7.asyncTaskKind || '')
      .trim()
      .toLowerCase();
    if (_0x2eee49 && _0x2eee49 !== 'video') return false;
    const _0x480230 = String(_0x2804b7.asyncTaskStatus || '')
      .trim()
      .toLowerCase();
    if (['success', 'failed', 'idle', 'cancelled'].includes(_0x480230)) return false;
    return true;
  }
  ['_stopRunningHubRecovery'](_0x367081 = true) {
    try {
      this._rhResumeAbortController?.abort?.();
    } catch {}
    ((this._rhResumeAbortController = null), (this._rhResumePromise = null), (this._rhResumeTaskId = ''));
    if (!_0x367081) return;
    const _0x24487f = appStore.getState().nodes?.[this.id];
    if (!_0x24487f || _0x24487f.rhTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { rhTaskRecovering: false });
  }
  ['_stopAsyncRecovery'](_0x5a3b58 = true) {
    try {
      this._asyncResumeAbortController?.abort?.();
    } catch {}
    ((this._asyncResumeAbortController = null),
      (this._asyncResumePromise = null),
      (this._asyncResumeTaskId = ''));
    if (!_0x5a3b58) return;
    const _0x54f297 = appStore.getState().nodes?.[this.id];
    if (!_0x54f297 || _0x54f297.asyncTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { asyncTaskRecovering: false });
  }
  ['_extractFirstVideoUrl'](_0x28e3f1) {
    const _0x1a1266 = new Set(),
      _0x55b9d9 = (_0x4a2b39) => {
        if (_0x4a2b39 == null) return '';
        if (typeof _0x4a2b39 === 'string') {
          const _0x4af949 = _0x4a2b39.trim();
          if (!_0x4af949) return '';
          if (
            _0x4af949.startsWith('http://') ||
            _0x4af949.startsWith('https://') ||
            _0x4af949.startsWith('/')
          )
            return _0x4af949;
          if (_0x4af949.startsWith('{') || _0x4af949.startsWith('['))
            try {
              return _0x55b9d9(JSON.parse(_0x4af949));
            } catch {
              return '';
            }
          const _0x1555a3 = _0x4af949.match(/https?:\/\/[^\s"'<>]+/);
          return _0x1555a3 && _0x1555a3[0] ? _0x1555a3[0] : '';
        }
        if (typeof _0x4a2b39 !== 'object') return '';
        if (_0x1a1266.has(_0x4a2b39)) return '';
        _0x1a1266.add(_0x4a2b39);
        if (Array.isArray(_0x4a2b39)) {
          for (const _0x3d2f89 of _0x4a2b39) {
            const _0xabf367 = _0x55b9d9(_0x3d2f89);
            if (_0xabf367) return _0xabf367;
          }
          return '';
        }
        const _0x386ea2 = [
          'url',
          'videoUrl',
          'video_url',
          'fileUrl',
          'file_url',
          'download_url',
          'output',
          'result',
          'data',
          'results',
          'outputs',
        ];
        for (const _0x5ee08b of _0x386ea2) {
          const _0x230e9b = _0x55b9d9(_0x4a2b39[_0x5ee08b]);
          if (_0x230e9b) return _0x230e9b;
        }
        return '';
      };
    return _0x55b9d9(_0x28e3f1);
  }
  ['_toLocalPathIfSameOrigin'](_0x4f3a2d) {
    return urlToLocalPath(_0x4f3a2d);
  }
  async ['_saveVideoToOutput'](_0x5e1434) {
    const _0x1d766b = String(_0x5e1434 || '').trim();
    if (!/^https?:\/\//i.test(_0x1d766b)) return this._toLocalPathIfSameOrigin(_0x1d766b);
    let _0x5bf2e0 = '';
    try {
      const _0x3cdcbf = new AbortController(),
        _0x5782d7 = setTimeout(() => _0x3cdcbf.abort(), 0x1d4c0);
      let _0x377239 = null;
      try {
        _0x377239 = await fetchRemoteBlob(_0x1d766b, { signal: _0x3cdcbf.signal });
      } finally {
        clearTimeout(_0x5782d7);
      }
      const _0x277017 = await saveOutputToServer(_0x377239, { ext: 'mp4' });
      _0x277017?.success && (_0x5bf2e0 = pickResultLocalPath(_0x277017));
    } catch (_0x24f61c) {
      const _0x3cadff = _0x24f61c instanceof Error ? _0x24f61c.message : String(_0x24f61c || ''),
        _0x2a9961 =
          _0x3cadff.includes('Failed to fetch') ||
          _0x3cadff.includes('NetworkError') ||
          _0x3cadff.toLowerCase().includes('cors');
      if (_0x2a9961) {
        const _0x5213d8 = await saveOutputFromUrlToServer({ url: _0x1d766b, ext: 'mp4' });
        _0x5bf2e0 = pickResultLocalPath(_0x5213d8);
      }
    }
    return _0x5bf2e0;
  }
  async ['_buildRecoveredVideoResultPatch'](_0x37f33b) {
    let _0x1eee48 = buildCanvasLocalVideoFields(_0x37f33b);
    if (_0x1eee48.src && _0x1eee48.localPath) return _0x1eee48;
    const _0x22dede = this._extractFirstVideoUrl(_0x37f33b);
    if (!_0x22dede) throw new Error(sourceVideoText('recovery.noOutputVideoUrl'));
    const _0x468689 = this._toLocalPathIfSameOrigin(_0x22dede) || (await this._saveVideoToOutput(_0x22dede));
    _0x1eee48 = buildCanvasLocalVideoFields({ localPath: _0x468689, videoUrl: _0x22dede });
    if (!_0x1eee48.src || !_0x1eee48.localPath) throw new Error(sourceVideoText('recovery.noOutputVideoUrl'));
    return _0x1eee48;
  }
  ['_resolveAsyncResumePayload'](_0x4272d5) {
    return {
      model: String(_0x4272d5?.model || '').trim(),
      provider: String(_0x4272d5?.asyncTaskProvider || _0x4272d5?.provider || '').trim(),
    };
  }
  ['_maybeResumeRunningHubTask']() {
    const _0x1c0862 = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isRunningHubRecoverableTask(_0x1c0862)) {
      this._stopRunningHubRecovery(true);
      return;
    }
    const _0x13142f = String(_0x1c0862?.rhTaskId || '').trim();
    if (!_0x13142f) return;
    if (this._rhResumePromise && this._rhResumeTaskId === _0x13142f) return;
    const _0x51c154 = Number(_0x1c0862?.rhTaskStartedAt || _0x1c0862?.generationStartTime || 0) || Date.now(),
      _0x3eb6c6 = String(_0x1c0862?.model || '')
        .trim()
        .toLowerCase(),
      _0x10988d = _0x1c0862?.rhTaskUseOpenapiQuery === true,
      _0x800e77 = getVideoMattingModelId(),
      _0x1e6e07 = _0x3eb6c6 === _0x800e77,
      _0x61eaea = _0x1e6e07
        ? { provider: 'runninghubwf', model: _0x800e77 }
        : {
            provider: String(_0x1c0862?.provider || 'runninghubwf').trim() || 'runninghubwf',
            model: String(_0x1c0862?.model || '').trim(),
          },
      _0x13f163 =
        typeof this._resumeRunningHubTaskPoller === 'function' ? this._resumeRunningHubTaskPoller : null,
      _0x518a8a = new AbortController();
    ((this._rhResumeAbortController = _0x518a8a), (this._rhResumeTaskId = _0x13142f));
    const _0x380969 = (async () => {
      try {
        const _0x4ee1da = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'video-generation',
            provider: _0x61eaea.provider || _0x1c0862?.provider || 'runninghubwf',
            adapterType: 'workflow',
            modelId: _0x61eaea.model || _0x1c0862?.model || '',
            executionId: 'runninghub.source-video.' + (_0x61eaea.model || _0x1c0862?.model || 'workflow'),
            payload: _0x61eaea,
            taskId: _0x13142f,
            cancellable: false,
            resumable: true,
            pauseOnAbort: true,
            startBuilder: () => ({
              rhTaskStatus:
                String(_0x1c0862?.rhTaskStatus || '')
                  .trim()
                  .toLowerCase() === 'pending'
                  ? 'pending'
                  : 'running',
              rhTaskUseOpenapiQuery: _0x10988d,
            }),
            poll: async () => {
              if (_0x13f163)
                return _0x13f163(_0x13142f, _0x1c0862, {
                  signal: _0x518a8a.signal,
                  payload: _0x61eaea,
                  useOpenapiQuery: _0x10988d,
                });
              if (_0x1e6e07)
                return resumeRunningHubVideoTask(_0x13142f, _0x61eaea, {
                  signal: _0x518a8a.signal,
                  useOpenapiQuery: _0x10988d,
                });
              await ensureConfig();
              const _0x2c4e1d = getProviderConfig('runninghubwf'),
                _0x3fbdd1 = String(_0x2c4e1d?.apiKey || '').trim();
              if (!_0x3fbdd1) throw new Error(sourceVideoText('recovery.runninghubApiKeyMissing'));
              return resumeRunninghubWorkflowTask(
                { apiKey: _0x3fbdd1, taskId: _0x13142f },
                { signal: _0x518a8a.signal, useOpenapiQuery: _0x10988d },
              );
            },
            resultBuilder: async (_0x59cfc8) => {
              const _0x2ddab4 = appStore.getState().nodes?.[this.id] || {},
                _0x50a5aa =
                  resolveRunningHubVideoStatusName(_0x2ddab4, 'success') ||
                  (_0x2ddab4?.name?.includes(sourceVideoText('result.hdVideo'))
                    ? sourceVideoText('result.hdVideo')
                    : _0x2ddab4?.name || sourceVideoText('result.defaultName'));
              return {
                ...(await this._buildRecoveredVideoResultPatch(_0x59cfc8)),
                name: _0x50a5aa,
                generationDuration: this._computeGenerationDuration(_0x2ddab4),
              };
            },
            failureBuilder: (_0x2edfe6, _0x54d224) => {
              const _0x15e5de =
                  _0x2edfe6 instanceof Error
                    ? _0x2edfe6.message
                    : String(_0x2edfe6 || sourceVideoText('recovery.taskFailed')),
                _0x4882b3 = appStore.getState().nodes?.[this.id] || {},
                _0x567751 =
                  buildRunningHubVideoTerminalStatePatch(
                    _0x4882b3,
                    'failed',
                    this._computeGenerationDuration(_0x4882b3),
                  ) || {},
                _0x28488a = _0x567751.generationDuration ?? this._computeGenerationDuration(_0x4882b3);
              return {
                ...buildSourceVideoRecoveryFailurePatch(_0x4882b3, {
                  error: _0x15e5de,
                  startedAt: _0x54d224.startedAt,
                  duration: _0x28488a,
                }),
                ..._0x567751,
                generationDuration: _0x28488a,
              };
            },
            parseError: (_0x2863e6) =>
              _0x2863e6 instanceof Error
                ? _0x2863e6.message
                : String(_0x2863e6 || sourceVideoText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: _0x51c154, abortController: _0x518a8a },
        );
        _0x4ee1da.status === 'success' && window._triggerLocalCacheSave?.();
      } catch (_0x3ee998) {
        if (_0x518a8a.signal.aborted || String(_0x3ee998?.message || '') === 'CANCELLED') return;
        const _0x304372 =
            _0x3ee998 instanceof Error
              ? _0x3ee998.message
              : String(_0x3ee998 || sourceVideoText('recovery.taskFailed')),
          _0x3860c5 = appStore.getState().nodes?.[this.id];
        if (!_0x3860c5) return;
        const _0x31666f =
          buildRunningHubVideoTerminalStatePatch(
            _0x3860c5,
            'failed',
            this._computeGenerationDuration(_0x3860c5),
          ) || {};
        appStore.updateNodeData(this.id, {
          ...buildSourceVideoRecoveryFailurePatch(_0x3860c5, {
            error: _0x304372,
            startedAt: _0x51c154,
            duration: _0x31666f.generationDuration ?? this._computeGenerationDuration(_0x3860c5),
          }),
          ..._0x31666f,
          isGenerating: false,
          generationDuration: _0x31666f.generationDuration ?? this._computeGenerationDuration(_0x3860c5),
          rhTaskStatus: 'failed',
          rhTaskRecovering: false,
        });
      } finally {
        (this._rhResumeAbortController === _0x518a8a && (this._rhResumeAbortController = null),
          this._rhResumeTaskId === _0x13142f && (this._rhResumeTaskId = ''),
          (this._rhResumePromise = null));
      }
    })();
    this._rhResumePromise = _0x380969;
  }
  ['_maybeResumeAsyncTask']() {
    const _0x54a355 = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isAsyncRecoverableTask(_0x54a355)) {
      this._stopAsyncRecovery(true);
      return;
    }
    const _0x1c1b77 = String(_0x54a355?.asyncTaskId || '').trim();
    if (!_0x1c1b77) return;
    if (this._asyncResumePromise && this._asyncResumeTaskId === _0x1c1b77) return;
    const _0x49885c =
        Number(_0x54a355?.asyncTaskStartedAt || _0x54a355?.generationStartTime || 0) || Date.now(),
      _0x312ddc = this._resolveAsyncResumePayload(_0x54a355),
      _0x179b4d = String(_0x312ddc.provider || _0x54a355?.asyncTaskProvider || _0x54a355?.provider || '')
        .trim()
        .toLowerCase(),
      _0x5c697e =
        typeof this._resumeAsyncTaskPoller === 'function'
          ? this._resumeAsyncTaskPoller
          : resumeAsyncVideoTask,
      _0x70ab51 = new AbortController();
    ((this._asyncResumeAbortController = _0x70ab51), (this._asyncResumeTaskId = _0x1c1b77));
    const _0x22dda1 = (async () => {
      try {
        const _0x2298b0 = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'video-generation',
            provider: _0x179b4d || _0x312ddc.provider || _0x54a355?.provider || '',
            adapterType: 'modelApi',
            modelId: _0x312ddc.model || _0x54a355?.model || '',
            executionId: (_0x179b4d || _0x312ddc.provider || 'model') + '.source-video.async',
            payload: _0x312ddc,
            taskId: _0x1c1b77,
            async: true,
            cancellable: false,
            resumable: true,
            pauseOnAbort: true,
            startBuilder: () => ({
              asyncTaskProvider: _0x179b4d,
              asyncTaskKind: 'video',
              asyncTaskStatus:
                String(_0x54a355?.asyncTaskStatus || '')
                  .trim()
                  .toLowerCase() === 'pending'
                  ? 'pending'
                  : 'running',
            }),
            poll: async () => _0x5c697e(_0x1c1b77, _0x312ddc, { signal: _0x70ab51.signal }),
            resultBuilder: async (_0x2a7f82) => {
              const _0x51aadc = appStore.getState().nodes?.[this.id] || {};
              return {
                ...(await this._buildRecoveredVideoResultPatch(_0x2a7f82)),
                name: _0x51aadc?.name?.includes(sourceVideoText('result.hdVideo'))
                  ? sourceVideoText('result.hdVideo')
                  : _0x51aadc?.name || sourceVideoText('result.defaultName'),
                generationDuration: this._computeGenerationDuration(_0x51aadc),
              };
            },
            failureBuilder: (_0x425452, _0x425d3d) => {
              const _0x4bf888 =
                  _0x425452 instanceof Error
                    ? _0x425452.message
                    : String(_0x425452 || sourceVideoText('recovery.taskFailed')),
                _0x32f7f7 = appStore.getState().nodes?.[this.id] || {};
              return buildSourceVideoRecoveryFailurePatch(_0x32f7f7, {
                error: _0x4bf888,
                startedAt: _0x425d3d.startedAt,
                duration: this._computeGenerationDuration(_0x32f7f7),
              });
            },
            parseError: (_0x123ff3) =>
              _0x123ff3 instanceof Error
                ? _0x123ff3.message
                : String(_0x123ff3 || sourceVideoText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: _0x49885c, abortController: _0x70ab51 },
        );
        _0x2298b0.status === 'success' && window._triggerLocalCacheSave?.();
      } catch (_0x398ef1) {
        if (
          _0x70ab51.signal.aborted ||
          String(_0x398ef1?.message || '') === 'CANCELLED' ||
          _0x398ef1?.name === 'AbortError'
        )
          return;
        const _0x4e9b4a =
            _0x398ef1 instanceof Error
              ? _0x398ef1.message
              : String(_0x398ef1 || sourceVideoText('recovery.taskFailed')),
          _0x15f65a = appStore.getState().nodes?.[this.id];
        if (!_0x15f65a) return;
        appStore.updateNodeData(this.id, {
          ...buildSourceVideoRecoveryFailurePatch(_0x15f65a, {
            error: _0x4e9b4a,
            startedAt: _0x49885c,
            duration: this._computeGenerationDuration(_0x15f65a),
          }),
          isGenerating: false,
          asyncTaskStatus: 'failed',
          asyncTaskRecovering: false,
        });
      } finally {
        (this._asyncResumeAbortController === _0x70ab51 && (this._asyncResumeAbortController = null),
          this._asyncResumeTaskId === _0x1c1b77 && (this._asyncResumeTaskId = ''),
          (this._asyncResumePromise = null));
      }
    })();
    this._asyncResumePromise = _0x22dda1;
  }
  ['update'](_0x2efbda) {
    this._data = _0x2efbda;
    this._syncRunningHubVideoTaskState(_0x2efbda) &&
      ((this._data = appStore.getState().nodes?.[this.id] || _0x2efbda), (_0x2efbda = this._data));
    this._syncMutedStateFromData(_0x2efbda);
    const _0x43b3c4 = this._resolveVideoSrc(_0x2efbda),
      _0x40bddc = shouldShowGenerationResultLoadingUi(_0x2efbda, { hasResult: !!_0x43b3c4 });
    if (_0x40bddc) {
      startLoading(this._card, { variant: 'full' });
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    } else {
      if (isTaskTerminal(_0x2efbda)) {
        stopLoading(this._card);
        if (this._uploadBtn) this._uploadBtn.disabled = false;
      } else {
        if (this._uploadBtn) this._uploadBtn.disabled = false;
        if (!_0x43b3c4) stopLoading(this._card);
      }
    }
    this._clearResolvedVideoTimer(_0x2efbda, _0x43b3c4);
    const _0x4af7a9 = resolveSourceVideoPosterSrc(_0x2efbda),
      _0x1d1db1 = _0x4af7a9 !== this._lastPosterSrc;
    if (this._rendererMediaDeferred === true) {
      this._currentSrc = _0x43b3c4 || '';
      this._video && ((this._video.preload = 'none'), this._clearVideoElementSource({ load: false }));
      if (_0x1d1db1 || _0x4af7a9) this._applyVideoPoster(_0x2efbda);
      else this._setPosterFrameVisible(false);
      (this._maybeResumeRunningHubTask(), this._maybeResumeAsyncTask());
      this._label &&
        _0x2efbda.name &&
        document.activeElement !== this._label &&
        (this._label.innerText = _0x2efbda.name);
      return;
    }
    if (_0x43b3c4 && _0x43b3c4 !== this._currentSrc) this._loadVideo(_0x43b3c4);
    else {
      if (_0x43b3c4 && _0x1d1db1 && (!this._video || this._video.paused)) this._loadVideo(_0x43b3c4);
      else {
        if (_0x1d1db1) this._applyVideoPoster(_0x2efbda);
        else {
          if (!_0x43b3c4) this._loadVideo('');
        }
      }
    }
    (this._maybeFetchVideoMeta(_0x2efbda),
      this._maybeResumeRunningHubTask(),
      this._maybeResumeAsyncTask(),
      this._label &&
        _0x2efbda.name &&
        document.activeElement !== this._label &&
        (this._label.innerText = _0x2efbda.name));
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null),
      (this._posterFramePreloadToken = (this._posterFramePreloadToken || 0) + 1),
      this._idleVideoThumbCancel && (this._idleVideoThumbCancel(), (this._idleVideoThumbCancel = null)),
      this._releaseActiveCapturePreviewUrl(),
      this._stopRunningHubRecovery(false),
      this._stopAsyncRecovery(false),
      this._centerIndicatorTimer &&
        (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
      this._video && (this._setManualLoopPlayback(false), this._video.pause(), (this._video.src = '')),
      this._objUrl && (URL.revokeObjectURL(this._objUrl), (this._objUrl = null)));
  }
  ['hydrateDeferredMedia']() {
    if (this._rendererMediaDeferred !== true) return;
    this._rendererMediaDeferred = false;
    const _0x67d090 = appStore.getStateRaw().nodes?.[this.id] || this._data,
      _0x32d288 = this._resolveVideoSrc(_0x67d090);
    if (_0x32d288) this._loadVideo(_0x32d288);
    else this._loadVideo('');
    this._maybeFetchVideoMeta(_0x67d090);
  }
}

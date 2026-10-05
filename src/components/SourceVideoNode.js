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
  SOURCE_VIDEO_MAX_BUSY_WAIT_MS = 900;
function sourceVideoText(value, item = {}) {
  return t('sourceVideoNode.' + value, item);
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
  const key = typeof document !== 'undefined' ? document.body?.classList : null;
  return !!(
    key?.contains?.('is-panning') ||
    key?.contains?.('is-zooming') ||
    key?.contains?.('is-viewport-animating')
  );
}
function scheduleSourceVideoIdleTask(
  handler,
  { timeout: timeout = SOURCE_VIDEO_IDLE_MEDIA_TIMEOUT_MS } = {},
) {
  if (typeof handler !== 'function') return () => {};
  let index = false,
    handler2 = () => {};
  const sourceVideoSchedulerNow = getSourceVideoSchedulerNow(),
    handler3 = globalThis.window?.requestIdleCallback || globalThis.requestIdleCallback,
    handler4 = globalThis.window?.cancelIdleCallback || globalThis.cancelIdleCallback;
  function run(result) {
    const setTimeout2 = setTimeout(data, result);
    handler2 = () => clearTimeout(setTimeout2);
  }
  const data = () => {
    if (index) return;
    const sourceVideoSchedulerNow2 = getSourceVideoSchedulerNow() - sourceVideoSchedulerNow;
    if (isSourceVideoInteractionBusy() && sourceVideoSchedulerNow2 < SOURCE_VIDEO_MAX_BUSY_WAIT_MS) {
      run(SOURCE_VIDEO_BUSY_RETRY_MS);
      return;
    }
    handler();
  };
  if (typeof handler3 === 'function') {
    const options = handler3(data, { timeout: timeout });
    handler2 = () => {
      if (typeof handler4 === 'function') handler4(options);
    };
  } else run(16);
  return () => {
    ((index = true), handler2());
  };
}
function buildSourceVideoRecoveryFailurePatch(
  target,
  { error: error = '', startedAt: startedAt = 0, duration: duration = null } = {},
) {
  const message =
      String(error?.message || error || sourceVideoText('recovery.taskFailed')).trim() ||
      sourceVideoText('recovery.taskFailed'),
    source = String(target?.outputText || '').trim(),
    outputText = source
      ? source + '\n' + sourceVideoText('recovery.failedWithMessage', { message: message })
      : sourceVideoText('recovery.failedWithMessage', { message: message });
  return {
    ...buildVideoGenerationFailurePatch({
      error: message,
      startedAt: startedAt,
      duration: duration,
      clearMediaFields: false,
    }),
    outputText: outputText,
  };
}
function normalizeUploadMediaDimensions(next, current) {
  const width = Math.round(Number(next) || 0),
    height = Math.round(Number(current) || 0);
  if (width <= 0 || height <= 0) return null;
  return { width: width, height: height };
}
export function buildSourceVideoUploadSizePatch(...args) {
  for (const box of args) {
    const videoWidth = normalizeUploadMediaDimensions(box?.width, box?.height);
    if (!videoWidth) continue;
    const width2 = getAutoMediaSizeByShortSide(videoWidth.width, videoWidth.height);
    return {
      width: width2.width,
      height: width2.height,
      videoWidth: videoWidth.width,
      videoHeight: videoWidth.height,
      needsAutoResize: false,
    };
  }
  return { needsAutoResize: true };
}
function readVideoFileNaturalSize(enabled) {
  const el = globalThis.document;
  if (!enabled || typeof el?.createElement !== 'function') return Promise.resolve(null);
  const entry = globalThis.window?.URL || globalThis.URL;
  if (typeof entry?.createObjectURL !== 'function') return Promise.resolve(null);
  let record = '';
  try {
    record = entry.createObjectURL(enabled);
  } catch {
    return Promise.resolve(null);
  }
  return new Promise((handler5) => {
    const payload = el.createElement('video');
    let handle = false,
      setTimeout3 = null;
    const run2 = (state) => {
        if (handle) return;
        handle = true;
        if (setTimeout3) clearTimeout(setTimeout3);
        (handler6(), handler5(state));
      },
      handler6 = () => {
        payload.removeAttribute?.('src');
        try {
          payload.load?.();
        } catch {}
        try {
          entry.revokeObjectURL(record);
        } catch {}
      };
    ((payload.preload = 'metadata'),
      (payload.muted = true),
      (payload.onloadedmetadata = () => {
        const uploadMediaDimensions = normalizeUploadMediaDimensions(payload.videoWidth, payload.videoHeight);
        run2(uploadMediaDimensions);
      }),
      (payload.onerror = () => run2(null)),
      (setTimeout3 = setTimeout(() => run2(null), 3000)),
      (payload.src = record));
  });
}
function createVideoCapturePreviewUrl(enabled2) {
  if (!enabled2 || !String(enabled2.type || '').startsWith('video/')) return '';
  const config = globalThis.window?.URL || globalThis.URL;
  if (typeof config?.createObjectURL !== 'function') return '';
  try {
    return config.createObjectURL(enabled2);
  } catch {
    return '';
  }
}
function waitForNextPaint() {
  const run3 = globalThis.window?.requestAnimationFrame || globalThis.requestAnimationFrame;
  if (typeof run3 === 'function')
    return new Promise((handler7) => {
      let scope = false,
        setTimeout4 = null;
      const input = () => {
        if (scope) return;
        scope = true;
        if (setTimeout4) clearTimeout(setTimeout4);
        handler7();
      };
      ((setTimeout4 = setTimeout(input, 50)), run3(input));
    });
  return new Promise((output) => setTimeout(output, 0));
}
function asStringArray(list) {
  return Array.isArray(list) ? list.map((item2) => String(item2 || '').trim()).filter(Boolean) : [];
}
function createManagedNameRegex(value2, value3, value4) {
  const enabled3 = String(value2 || '').trim();
  if (!enabled3) return /^$/;
  try {
    return new RegExp(enabled3);
  } catch (value5) {
    throw new Error(
      '[source-video] invalid sourceVideoTaskName pattern for ' +
        (value3?.modelId || '') +
        '/' +
        (value4 || ''),
    );
  }
}
function getSourceVideoTaskNameConfigs(value6) {
  const value7 = value6?.extensions || {};
  if (Array.isArray(value7.sourceVideoTaskNameRules)) return value7.sourceVideoTaskNameRules;
  return value7.sourceVideoTaskName ? [value7.sourceVideoTaskName] : [];
}
function createSourceVideoTaskNameRule(enabled4, matchModel) {
  if (!enabled4 || !matchModel) return null;
  const value8 = String(matchModel.modelId || enabled4.modelId || '')
      .trim()
      .toLowerCase(),
    key2 = String(matchModel.key || value8 || 'sourceVideoTask').trim();
  return {
    key: key2,
    matchModel: matchModel.matchModel !== false,
    models: new Set(value8 ? [value8] : []),
    textNeedles: asStringArray(matchModel.textNeedles),
    managedNameRe: createManagedNameRegex(matchModel.managedNamePattern, enabled4, key2),
    names: { ...(matchModel.names || {}) },
  };
}
function buildSourceVideoTaskNameRules() {
  return listModelManifests()
    .flatMap((item3) =>
      getSourceVideoTaskNameConfigs(item3).map((item4) => createSourceVideoTaskNameRule(item3, item4)),
    )
    .filter(Boolean);
}
const RH_VIDEO_TASK_NAME_RULES = buildSourceVideoTaskNameRules();
function normalizeRunningHubVideoStatus(value9) {
  const value10 = String(value9 || '')
    .trim()
    .toLowerCase();
  for (const [value11, map] of Object.entries(RH_VIDEO_STATUS_ALIASES)) {
    if (map.has(value10)) return value11;
  }
  return value10;
}
function isRunningHubVideoTask(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object') return false;
  const providerHint = normalizeProviderId(enabled5.provider);
  if (providerHint === 'runninghubwf' || providerHint === 'runninghub') return true;
  const modelExecution = resolveModelExecution(enabled5.model, { providerHint: providerHint }),
    providerId = normalizeProviderId(modelExecution?.modelManifest?.provider),
    providerId2 = normalizeProviderId(modelExecution?.executionManifest?.provider);
  return providerId === 'runninghubwf' || providerId2 === 'runninghubwf';
}
function resolveRunningHubVideoTaskNameRule(error2) {
  if (!isRunningHubVideoTask(error2)) return '';
  const value12 = String(error2?.model || '')
      .trim()
      .toLowerCase(),
    value13 = String(error2?.name || '').trim(),
    list2 = String(error2?.outputText || ''),
    value14 = RH_VIDEO_TASK_NAME_RULES.find((item5) => value13 && item5.managedNameRe.test(value13));
  if (value14) return value14;
  const value15 = RH_VIDEO_TASK_NAME_RULES.find((item6) =>
    item6.textNeedles.some((item7) => list2.includes(item7)),
  );
  if (value15) return value15;
  return (
    RH_VIDEO_TASK_NAME_RULES.find((item8) => {
      if (item8.matchModel !== false && item8.models?.has(value12)) return true;
      return false;
    }) || null
  );
}
function resolveRunningHubVideoStatusName(error3, value16) {
  const runningHubVideoTaskNameRule = resolveRunningHubVideoTaskNameRule(error3);
  if (!runningHubVideoTaskNameRule?.names) return '';
  const enabled6 = String(error3?.name || '').trim();
  if (!enabled6 || !runningHubVideoTaskNameRule.managedNameRe.test(enabled6)) return '';
  return runningHubVideoTaskNameRule.names[normalizeRunningHubVideoStatus(value16)] || '';
}
function buildChangedPatch(value17, value18) {
  const value19 = {};
  for (const [value20, value21] of Object.entries(value18 || {})) {
    if (!Object.is(value17?.[value20], value21)) value19[value20] = value21;
  }
  return value19;
}
function buildRunningHubVideoTerminalStatePatch(value22, value23, value24) {
  if (!isRunningHubVideoTask(value22)) return null;
  const rhTaskStatus = normalizeRunningHubVideoStatus(value23 || value22?.rhTaskStatus);
  if (!['success', 'failed', 'cancelled'].includes(rhTaskStatus)) return null;
  const error4 = { isGenerating: false, rhTaskStatus: rhTaskStatus, rhTaskRecovering: false };
  if (rhTaskStatus === 'success') error4.jobStatus = 'success';
  if (rhTaskStatus === 'failed') error4.jobStatus = 'error';
  if (rhTaskStatus === 'cancelled') error4.jobStatus = null;
  typeof value22?.generationDuration !== 'number' && (error4.generationDuration = value24);
  const runningHubVideoStatusName = resolveRunningHubVideoStatusName(value22, rhTaskStatus);
  if (runningHubVideoStatusName) error4.name = runningHubVideoStatusName;
  const changedPatch = buildChangedPatch(value22, error4);
  return Object.keys(changedPatch).length > 0 ? changedPatch : null;
}
function shouldFetchVideoMetaForNodeInfo() {
  try {
    const value25 = typeof appStore.getStateRaw === 'function' ? appStore.getStateRaw() : appStore.getState();
    return value25?.ui?.showVideoMeta === true;
  } catch {
    return false;
  }
}
function normalizeVideoPreviewUrl(value26, { localOnly: localOnly = false } = {}) {
  const enabled7 = String(value26 || '').trim();
  if (!enabled7) return '';
  if (/^data:image\//i.test(enabled7) || /^blob:/i.test(enabled7) || /^aic-local-preview:/i.test(enabled7))
    return enabled7;
  if (/^(?:https?:|file:)/i.test(enabled7)) return '';
  const url = localPathToUrl(enabled7);
  if (url) return url;
  return localOnly ? '' : enabled7;
}
export function resolveSourceVideoPosterSrc(options2 = {}) {
  const value27 = Array.isArray(options2?.videos) ? options2.videos : [],
    value28 = Math.max(0, Number(options2?.mainVideoIndex) || 0),
    value29 = value27[value28] || value27[0] || null,
    value30 = [
      [value29?.posterLocalPath, true],
      [value29?.previewLocalPath, true],
      [value29?.thumbLocalPath, true],
      [value29?.thumbnailLocalPath, true],
      [value29?.posterUrl, false],
      [value29?.previewUrl, false],
      [value29?.thumbUrl, false],
      [value29?.thumbnailUrl, false],
      [options2?.posterLocalPath, true],
      [options2?.previewLocalPath, true],
      [options2?.thumbLocalPath, true],
      [options2?.thumbnailLocalPath, true],
      [options2?.posterUrl, false],
      [options2?.previewUrl, false],
      [options2?.thumbUrl, false],
      [options2?.thumbnailUrl, false],
    ];
  for (const [value31, localOnly2] of value30) {
    const videoPreviewUrl = normalizeVideoPreviewUrl(value31, { localOnly: localOnly2 });
    if (videoPreviewUrl) return videoPreviewUrl;
  }
  return '';
}
export function resolveSourceVideoMediaTaskSrc(response = {}) {
  const value32 = Array.isArray(response?.videos) ? response.videos : [],
    value33 = Math.max(0, Number(response?.mainVideoIndex) || 0),
    response2 = value32[value33] || value32[0] || null,
    value34 = [
      response?.originalLocalPath,
      response?.localPath,
      response?.displayLocalPath,
      response?.videoLocalPath,
      response?.videoUrl,
      response?.src,
      response?.url,
      response?.resultUrl,
      response?.sourceUrl,
      response2?.originalLocalPath,
      response2?.localPath,
      response2?.displayLocalPath,
      response2?.videoUrl,
      response2?.src,
      response2?.url,
      response2?.resultUrl,
    ];
  for (const value35 of value34) {
    const localPath = urlToLocalPath(value35) || pickResultLocalPath(value35);
    if (localPath) return localPath;
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
  constructor(value36) {
    ((this._data = value36),
      (this.el = document.createElement('div')),
      (this.id = value36.id),
      (this.el.className = 'v2-node-component'),
      (this._currentSrc = null),
      (this._objUrl = null),
      (this._isMuted = resolveVideoMutedPreference(value36)),
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
      (this._rendererMediaDeferred = shouldDeferRendererMediaOnMount(value36)),
      (this._videoEventsBound = false));
  }
  ['_ensureVideoElement']() {
    if (this._video) return this._video;
    if (!this._card) return null;
    const el2 = document.createElement('video');
    ((el2.className = 'video-player'),
      el2.setAttribute('playsinline', ''),
      (el2.preload = 'none'),
      (el2.muted = this._isMuted),
      Object.assign(el2.style, {
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
    if (this._posterFrame?.parentNode === this._card) this._card.insertBefore(el2, this._posterFrame);
    else typeof this._card.prepend === 'function' ? this._card.prepend(el2) : this._card.appendChild(el2);
    return ((this._video = el2), this._bindVideoElementEvents(), el2);
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
    for (const value37 of ['loadeddata', 'playing', 'timeupdate', 'seeked']) {
      this._video.addEventListener(value37, () => this._syncPosterFrameVisibility());
    }
    (this._video.addEventListener('timeupdate', () => {
      if (this._isSeeking || (this._bar && this._bar.dataset.dragging === 'true')) return;
      const enabled8 = this._getBaseDuration();
      if (!enabled8 || !Number.isFinite(enabled8)) return;
      const value38 = this._getClipRange(enabled8),
        enabled9 = value38.active ? Math.max(0, value38.end - value38.start) : enabled8;
      if (!enabled9 || !Number.isFinite(enabled9)) return;
      let value39 = this._video.currentTime || 0;
      if (value38.active) {
        if (value39 < value38.start) ((this._video.currentTime = value38.start), (value39 = value38.start));
        else
          value39 > value38.end - 0.03 &&
            ((this._video.currentTime = value38.start), (value39 = value38.start));
      }
      const value40 = value38.active ? Math.max(0, Math.min(enabled9, value39 - value38.start)) : value39;
      ((this._fill.style.width = (value40 / enabled9) * 100 + '%'),
        (this._timeCurrent.textContent = this._fmt(value40)),
        (this._timeTotal.textContent = this._fmt(enabled9)));
    }),
      this._video.addEventListener('loadedmetadata', () => {
        this._syncVideoDurationUi();
        const count = this._video.videoWidth || 0,
          count2 = this._video.videoHeight || 0;
        if (count > 0 && count2 > 0) {
          const value41 = appStore.getState().nodes[this.id];
          if (value41) {
            const value42 = {};
            if (Number(value41.videoWidth || 0) !== count) value42.videoWidth = count;
            if (Number(value41.videoHeight || 0) !== count2) value42.videoHeight = count2;
            if (Object.keys(value42).length) appStore.updateNodeData(this.id, value42);
          }
        }
        if (this._data.fixedSize) return;
        if (!this._data.needsAutoResize) return;
        const { width: width3, height: height2 } = getAutoMediaSizeByShortSide(
          count || 1000,
          count2 || 1000,
        );
        appStore.updateNodeData(this.id, { width: width3, height: height2, needsAutoResize: false });
      }));
  }
  ['mount']() {
    const el3 = this.el;
    (setStaticInnerHTML(el3, _SOURCE_VIDEO_NODE_TEMPLATE_ID),
      (this._card = el3.querySelector('.node-card')),
      (this._video = null),
      (this._posterFrame = el3.querySelector('.source-video-poster-frame')));
    this._posterFrame &&
      ((this._posterFrame.decoding = 'async'),
      (this._posterFrame.loading = 'eager'),
      'fetchPriority' in this._posterFrame && (this._posterFrame.fetchPriority = 'high'));
    (this._applyVideoPoster(this._data),
      this._attachPlaybackRecovery(),
      (this._hint = el3.querySelector('.node-upload-hint')),
      (this._uploadBtn = el3.querySelector('.upload-btn')),
      (this._controls = el3.querySelector('.video-controls')),
      (this._playBtn = el3.querySelector('.video-play-btn')),
      (this._muteBtn = el3.querySelector('.video-mute-btn')),
      (this._iconUnmuted = el3.querySelector('.icon-unmuted')),
      (this._iconMuted = el3.querySelector('.icon-muted')),
      this._syncMutedStateFromData(this._data),
      (this._fill = el3.querySelector('.media-progress-fill')),
      (this._bar = el3.querySelector('.media-progress-bar')),
      (this._timeCurrent = el3.querySelector('.video-time-current')),
      (this._timeTotal = el3.querySelector('.video-time-total')),
      (this._snapBtn = el3.querySelector('.video-snap-btn')),
      (this._centerIndicator = el3.querySelector('.video-center-indicator')),
      (this._indicatorInner = el3.querySelector('.indicator-inner')),
      (this._centerIndicatorTimer = null),
      (this._resizer = el3.querySelector('.node-resizer')),
      this._syncLocaleTexts(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())));
    if (this._data?.isGenerating && !this._resolveVideoSrc(this._data)) {
      startLoading(this._card, { variant: 'full' });
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    }
    (this._card.addEventListener('dblclick', (event) => {
      event.stopPropagation();
      this._clickTimer && (clearTimeout(this._clickTimer), (this._clickTimer = null));
      const value43 =
        (this._video ? getVideoCurrentSource(this._video) : '') ||
        this._currentSrc ||
        this._resolveVideoSrc(this._data);
      value43 && ((this._currentSrc = value43), void this._openFullscreenFromCurrentVideo());
    }),
      this._card.addEventListener('click', (event2) => {
        if (event2.detail && event2.detail > 1) return;
        if (
          event2.target.closest('.video-controls') ||
          event2.target.closest('.video-mute-btn') ||
          event2.target.closest('.node-upload-hint') ||
          event2.target.closest('.node-floating-toolbar')
        )
          return;
        event2.stopPropagation();
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
      el3.appendChild(this._input),
      this._uploadBtn.addEventListener('click', (event3) => {
        (event3.stopPropagation(), this._input.click());
      }));
    this._resizer &&
      this._resizer.addEventListener('pointerdown', (event4) => {
        const value44 = appStore.getStateRaw().ui?.imageVideoNodeResizeEnabled === true,
          value45 = document.getElementById('v2-wrap')?.classList.contains('v2-media-node-resize-enabled');
        if (!(value44 && value45)) return;
        startNodeResizePreview({
          event: event4,
          nodeId: this.id,
          getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
          getViewport: () => appStore.getStateRaw().viewport,
          resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) => {
            const value46 = startWidth / startHeight,
              value47 = Math.max(dx / startWidth, dy / startHeight),
              value48 = Math.max(SOURCE_VIDEO_MIN_SIZE / startWidth, SOURCE_VIDEO_MIN_SIZE / startHeight),
              value49 = Math.max(value48, 1 + value47),
              width4 = Math.max(SOURCE_VIDEO_MIN_SIZE, Math.round(startWidth * value49)),
              height3 = Math.max(SOURCE_VIDEO_MIN_SIZE, Math.round(width4 / value46));
            return { width: width4, height: height3 };
          },
          buildFinalPatch: ({ startNode: startNode }) =>
            startNode?.needsAutoResize ? { needsAutoResize: false } : {},
          applyPatch: (value50) => appStore.updateNodeData(this.id, value50),
          commit: commit,
        });
      });
    (this._input.addEventListener('change', async (event5) => {
      const enabled10 = event5.target.files[0];
      if (!enabled10) return;
      await this._handleUploadInputFile(enabled10);
    }),
      this._muteBtn.addEventListener('click', (event6) => {
        event6.stopPropagation();
        if (VideoKeyingController.isActiveFor(this._data?.id)) return;
        this._setMuted(!this._isMuted, { persist: true });
      }),
      this._playBtn.addEventListener('click', (loop2) => {
        loop2.stopPropagation();
        if (VideoKeyingController.isActiveFor(this._data?.id)) return;
        if (!this._currentSrc) return;
        this._toggleManualPlayback({
          loop: loop2.altKey === true,
          forcePlay: this._shouldKeepHoverPlaybackOnManualClick(),
        });
      }));
    if (this._bar) {
      let enabled11 = false,
        value51 = 0;
      this._updateDragVisual = (value52) => {
        if (this._fill) this._fill.style.width = value52 * 100 + '%';
        if (!this._timeCurrent) return;
        const value53 = this._getBaseDuration(),
          value54 = this._getClipRange(value53),
          value55 = value54.active ? Math.max(0, value54.end - value54.start) : value53;
        if (value55 && Number.isFinite(value55)) this._timeCurrent.textContent = this._fmt(value52 * value55);
      };
      const run4 = (event7) => {
          const el4 = this._bar;
          if (!el4) return 0;
          const box2 = el4.getBoundingClientRect(),
            enabled12 = box2.width || 0;
          if (!enabled12) return 0;
          const value56 = event7.clientX - box2.left;
          if (!Number.isFinite(value56)) return 0;
          return Math.max(0, Math.min(1, value56 / enabled12));
        },
        handler8 = (value57) => {
          if (!Number.isFinite(value57)) return;
          const enabled13 = this._getBaseDuration();
          if (!enabled13 || !Number.isFinite(enabled13)) return;
          const value58 = this._getClipRange(enabled13),
            enabled14 = value58.active ? Math.max(0, value58.end - value58.start) : enabled13;
          if (!enabled14 || !Number.isFinite(enabled14)) return;
          const value59 = Math.max(
            0,
            Math.min(enabled13, (value58.active ? value58.start : 0) + value57 * enabled14),
          );
          if (!Number.isFinite(value59)) return;
          const el5 = this._ensureVideoElement();
          if (!el5) return;
          this._isSeeking = true;
          const value60 = ++this._seekToken;
          el5.currentTime = value59;
          const value61 = () => {
            if (value60 !== this._seekToken) return;
            this._isSeeking = false;
            const value62 = this._getBaseDuration(),
              value63 = this._getClipRange(value62),
              value64 = value63.active ? Math.max(0, value63.end - value63.start) : value62,
              value65 = el5.currentTime || 0;
            if (value64 && Number.isFinite(value64)) {
              const value66 = value63.active
                ? Math.max(0, Math.min(value64, value65 - value63.start))
                : value65;
              ((this._fill.style.width = (value66 / value64) * 100 + '%'),
                (this._timeCurrent.textContent = this._fmt(value66)),
                (this._timeTotal.textContent = this._fmt(value64)));
            }
          };
          (el5.addEventListener('seeked', value61, { once: true }), window.setTimeout(value61, 300));
        },
        value67 = (event8) => {
          if (!enabled11) return;
          (event8.stopPropagation(),
            event8.preventDefault(),
            (value51 = run4(event8)),
            this._updateDragVisual(value51));
        },
        value68 = (value69) => {
          if (!enabled11) return;
          ((enabled11 = false),
            (this._bar.dataset.dragging = 'false'),
            window.removeEventListener('pointermove', value67, true),
            window.removeEventListener('pointerup', value68, true),
            handler8(value51));
        };
      this._bar.addEventListener('pointerdown', (event9) => {
        (event9.stopPropagation(), event9.preventDefault());
        if (VideoKeyingController.isActiveFor(this._data?.id)) return;
        if (!this._currentSrc) return;
        ((this._isManualControl = true),
          this._setManualLoopPlayback(false),
          this._autoPlayToken++,
          (this._hoverManualPause = true),
          this._ensureVideoElement()?.pause?.(),
          (enabled11 = true),
          (this._bar.dataset.dragging = 'true'),
          (value51 = run4(event9)),
          this._updateDragVisual(value51),
          handler8(value51),
          window.addEventListener('pointermove', value67, true),
          window.addEventListener('pointerup', value68, true));
      });
    }
    (this._snapBtn.addEventListener('click', (event10) => {
      event10.stopPropagation();
      if (VideoKeyingController.isActiveFor(this._data?.id)) return;
      void this._captureFrame();
    }),
      el3.addEventListener('mouseenter', () => {
        const value70 = appStore.getState().videoClip;
        if (value70 && value70.active && value70.nodeId === this._data?.id) return;
        if (this._currentSrc && this._rendererMediaDeferred !== true) {
          const enabled15 = this._ensureVideoElement();
          if (!enabled15) return;
          this._isHovered = true;
          if (VideoKeyingController.isActiveFor(this._data?.id)) {
            enabled15.pause();
            return;
          }
          if (this._hoverManualPause) return;
          if (this._isManualLoopPlayback) return;
          const value71 = this._getBaseDuration(),
            value72 = this._getClipRange(value71);
          enabled15.loop = value72.active ? false : true;
          if (value72.active) {
            const value73 = enabled15.currentTime || 0;
            if (value73 < value72.start || value73 > value72.end) enabled15.currentTime = value72.start;
          }
          const value74 = ++this._autoPlayToken;
          (logVideoPlaybackEvent(enabled15, 'hover-enter', { label: this._getPlaybackLabel('hover') }),
            void this._playVideoWithRecovery(
              'hover',
              () => this._autoPlayToken === value74 && !this._hoverManualPause,
            ));
        }
      }),
      el3.addEventListener('mouseleave', () => {
        const value75 = appStore.getState().videoClip;
        if (value75 && value75.active && value75.nodeId === this._data?.id) return;
        if (this._currentSrc) {
          const enabled16 = this._isManualControl;
          ((this._isHovered = false), this._autoPlayToken++);
          const enabled17 = this._video;
          if (!enabled17) {
            this._hoverManualPause = false;
            if (!this._isManualLoopPlayback) this._isManualControl = false;
            return;
          }
          !this._isManualLoopPlayback && (enabled17.loop = false);
          logVideoPlaybackEvent(enabled17, 'hover-leave', { label: this._getPlaybackLabel('hover') });
          !enabled16 && enabled17.pause();
          this._hoverManualPause = false;
          if (!this._isManualLoopPlayback) this._isManualControl = false;
        }
      }),
      this._controls.addEventListener('pointerdown', (event11) => event11.stopPropagation()),
      this._muteBtn.addEventListener('pointerdown', (event12) => event12.stopPropagation()));
    const value76 = this._resolveVideoSrc(this._data);
    if (this._rendererMediaDeferred === true)
      ((this._currentSrc = value76 || ''), this._syncPosterFrameVisibility({ force: !!this._lastPosterSrc }));
    else {
      if (value76) this._loadVideo(value76);
      else this._loadVideo('');
    }
    this._clearResolvedVideoTimer(this._data, value76);
    this._rendererMediaDeferred !== true && this._maybeFetchVideoMeta(this._data);
    (this._syncRunningHubVideoTaskState(this._data),
      this._maybeResumeRunningHubTask(),
      this._maybeResumeAsyncTask());
    const value77 = el3.querySelector('.node-floating-toolbar');
    return (bindVideoToolbarEvents(value77, this._data), el3);
  }
  ['_waitForUploadPaint']() {
    return waitForNextPaint();
  }
  ['_syncLocaleTexts']() {
    if (this._muteBtn) this._muteBtn.title = sourceVideoText('controls.toggleMute');
    if (this._snapBtn) this._snapBtn.title = sourceVideoText('controls.captureFrame');
    if (this._uploadBtn && !this._isUploading) {
      const el6 = this._uploadBtn.querySelector?.('.source-upload-label');
      el6
        ? (el6.textContent = sourceVideoText('upload.button'))
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
  ['_syncMutedStateFromData'](value78 = this._data) {
    ((this._isMuted = resolveVideoMutedPreference(value78)), this._applyMutedState());
  }
  ['_setMuted'](enabled18, { persist: persist = false } = {}) {
    ((this._isMuted = !!enabled18), this._applyMutedState());
    if (!persist) return;
    const args2 = appStore.getState().nodes?.[this.id] || this._data || {},
      args3 = buildVideoMutedPatch(args2, this._isMuted);
    if (!args3) return;
    (appStore.updateNodeData(this.id, args3), (this._data = { ...args2, ...args3 }));
  }
  ['_readUploadVideoNaturalSize'](value79) {
    return readVideoFileNaturalSize(value79);
  }
  ['_uploadSourceVideoFile'](value80, value81) {
    return uploadFile(value80, value81);
  }
  async ['_handleUploadInputFile'](error5) {
    ((this._isUploading = true), startLoading(this._card, { variant: 'static' }));
    const el7 = this._ensureVideoElement();
    if (el7) el7.style.display = 'none';
    this._controls.style.opacity = '0';
    const list3 = Array.from(this._uploadBtn.childNodes).map((item9) => item9.cloneNode(true));
    ((this._uploadBtn.textContent = sourceVideoText('upload.uploading')),
      (this._uploadBtn.style.pointerEvents = 'none'));
    const value82 = this._currentSrc,
      capturePreviewUrl = createVideoCapturePreviewUrl(error5);
    capturePreviewUrl &&
      ((this._data = { ...this._data, capturePreviewUrl: capturePreviewUrl }),
      this._loadVideo(capturePreviewUrl));
    try {
      const value83 = window.currentProjectId || 'default_v2_project';
      await this._waitForUploadPaint();
      const value84 = Promise.resolve()
          .then(() => this._readUploadVideoNaturalSize(error5))
          .catch(() => null),
        width5 = await this._uploadSourceVideoFile(error5, value83),
        value85 = await value84,
        value86 = error5.name.replace(/\.[^/.]+$/, '');
      appStore.renameNode(this.id, value86);
      const value87 = document.getElementById(this.id),
        el8 = value87?.__v2_name_el;
      if (el8) el8.textContent = value86;
      const value88 = width5.url,
        localPath2 = pickResultLocalPath(width5) || urlToLocalPath(value88),
        videoProxyStatus = String(width5.videoProxyStatus || '').trim(),
        capturePreviewUrl2 = videoProxyStatus === 'processing' && !!capturePreviewUrl,
        src =
          videoProxyStatus === 'processing'
            ? ''
            : String(width5.displayUrl || '').trim() ||
              String(width5.displayLocalPath ? '/' + width5.displayLocalPath : '').trim() ||
              value88,
        args4 = buildSourceVideoUploadSizePatch(
          {
            width: width5.videoWidth || width5.width,
            height: width5.videoHeight || width5.height,
          },
          value85,
        );
      appStore.updateNodeData(this.id, {
        src: src,
        localPath: localPath2,
        assetId: width5.assetId || '',
        originalLocalPath: width5.originalLocalPath || width5.localPath || '',
        displayLocalPath: width5.displayLocalPath || '',
        posterLocalPath: width5.posterLocalPath || '',
        thumbLocalPath: width5.posterLocalPath || width5.thumbLocalPath || '',
        thumbUrl: width5.posterUrl || width5.thumbUrl || '',
        derivativeStatus: width5.derivativeStatus || width5.status || '',
        mediaTaskId: width5.mediaTaskId || '',
        mediaTaskKind: width5.mediaTaskKind || '',
        mediaTaskStatus: width5.mediaTaskStatus || '',
        mediaTaskProgress: Number(width5.mediaTaskProgress || 0) || 0,
        mediaTaskError: width5.mediaTaskError || '',
        videoProxyStatus: videoProxyStatus,
        videoCodec: width5.videoCodec || '',
        videoDuration: Number(width5.videoDuration || 0) || 0,
        videoFps: Number(width5.videoFps || 0) || 0,
        fileName: width5.filename || error5.name,
        capturePreviewUrl: capturePreviewUrl2 ? capturePreviewUrl : '',
        ...args4,
      });
    } catch (value89) {
      (console.error('视频上传失败:', value89),
        window.showToast(sourceVideoText('upload.failedRetry')),
        stopLoading(this._card));
      if (capturePreviewUrl && this._currentSrc === capturePreviewUrl) {
        this._releaseActiveCapturePreviewUrl();
        if (value82) this._loadVideo(value82);
        else ((this._currentSrc = ''), this._loadVideo(''));
      }
      if (this._currentSrc) {
        const el9 = this._ensureVideoElement();
        if (el9) el9.style.display = 'block';
        this._controls.style.opacity = '1';
      }
    } finally {
      ((this._isUploading = false),
        this._uploadBtn.replaceChildren(...list3.map((item10) => item10.cloneNode(true))),
        this._syncLocaleTexts(),
        (this._uploadBtn.style.pointerEvents = 'auto'),
        (this._input.value = ''));
    }
  }
  ['_applyVideoPoster'](value90 = this._data) {
    const sourceVideoPosterSrc = resolveSourceVideoPosterSrc(value90);
    if (sourceVideoPosterSrc)
      (this._video &&
        this._video.poster !== sourceVideoPosterSrc &&
        (this._video.poster = sourceVideoPosterSrc),
        (this._lastPosterSrc = sourceVideoPosterSrc),
        this._applyPosterFrameSource(sourceVideoPosterSrc));
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
    return (this._syncPosterFrameVisibility({ force: !!sourceVideoPosterSrc }), sourceVideoPosterSrc);
  }
  ['_getPosterFrameSrc']() {
    if (!this._posterFrame) return '';
    return String(this._posterFrame.getAttribute?.('src') || this._posterFrame.src || '').trim();
  }
  ['_setPosterFrameSrc'](value91) {
    if (!this._posterFrame) return;
    typeof this._posterFrame.setAttribute === 'function'
      ? this._posterFrame.setAttribute('src', value91)
      : (this._posterFrame.src = value91);
  }
  ['_applyPosterFrameSource'](enabled19) {
    if (!this._posterFrame || !enabled19) return;
    const enabled20 = this._getPosterFrameSrc();
    if (enabled20 === enabled19) return;
    const run5 = ({ requireConnected: requireConnected = false } = {}) => {
      if (
        !this._posterFrame ||
        (requireConnected && this._posterFrame.isConnected === false) ||
        this._lastPosterSrc !== enabled19
      )
        return;
      (this._setPosterFrameSrc(enabled19), this._syncPosterFrameVisibility({ force: true }));
    };
    if (!enabled20 || enabled19.startsWith('data:') || typeof Image !== 'function') {
      run5();
      return;
    }
    const value92 = (this._posterFramePreloadToken || 0) + 1;
    ((this._posterFramePreloadToken = value92),
      preloadCanvasImage(enabled19, { priority: 85, fetchPriority: 'auto' }).then(
        () => {
          if (this._posterFramePreloadToken === value92) run5({ requireConnected: true });
        },
        () => {
          if (this._posterFramePreloadToken === value92) run5({ requireConnected: true });
        },
      ));
  }
  ['_setPosterFrameVisible'](enabled21) {
    if (!this._posterFrame) return;
    this._posterFrame.classList?.toggle('is-visible', !!enabled21);
  }
  ['_isVideoFrameReadyToShow']() {
    if (!this._video) return false;
    const count3 = Number(this._video.readyState || 0);
    if (count3 < 2) return false;
    if (!String(this._lastPosterSrc || '').trim()) return true;
    if (this._video.paused === false) return true;
    const count4 = Number(this._video.currentTime || 0);
    return count4 > 0.05;
  }
  ['_syncVideoElementFrameVisibility']({ forceHidden: forceHidden = false } = {}) {
    if (!this._video) return;
    if (!this._video.style) this._video.style = {};
    const enabled22 = !!(this._currentSrc || getVideoCurrentSource(this._video));
    if (!enabled22) {
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
    const value93 = forceHidden ? false : this._isVideoFrameReadyToShow();
    ((this._video.style.opacity = value93 ? '1' : '0'),
      (this._video.style.visibility = value93 ? 'visible' : 'hidden'));
  }
  ['_syncPosterFrameVisibility'](enabled23 = {}) {
    this._syncVideoElementFrameVisibility();
    if (!this._posterFrame) return;
    const enabled24 = String(this._lastPosterSrc || '').trim();
    if (!enabled24) {
      this._setPosterFrameVisible(false);
      return;
    }
    if (Object.prototype.hasOwnProperty.call(enabled23, 'force')) {
      this._setPosterFrameVisible(!!enabled23.force);
      enabled23.force === true && this._syncVideoElementFrameVisibility({ forceHidden: true });
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
  ['_resolveVideoSrc'](value94) {
    return resolveCanvasVideoUrl(value94) || this._getCapturePreviewUrl(value94);
  }
  ['_clearResolvedVideoTimer'](enabled25, enabled26) {
    if (!enabled26 || !enabled25 || typeof enabled25 !== 'object') return;
    const value95 =
      !!String(enabled25.rhTaskId || enabled25.asyncTaskId || enabled25.dreaminaSubmitId || '').trim() ||
      enabled25.rhTaskRecovering === true ||
      enabled25.asyncTaskRecovering === true ||
      enabled25.dreaminaTaskRecovering === true;
    if (value95) return;
    if (!enabled25.generationStartTime && enabled25.generationDuration == null) return;
    const enabled27 = appStore.getState().nodes?.[this.id];
    if (!enabled27) return;
    const value96 = {};
    if (enabled27.generationStartTime) value96.generationStartTime = null;
    if (enabled27.generationDuration != null) value96.generationDuration = null;
    if (enabled27.isGenerating === true) value96.isGenerating = false;
    Object.keys(value96).length > 0 && appStore.updateNodeData(this.id, value96);
  }
  ['_clearMediaUnavailableAfterPlayback'](value97) {
    const response3 = appStore.getState().nodes?.[this.id] || this._data || null;
    if (!response3 || response3.mediaUnavailable !== true) return;
    const enabled28 = String(response3.mediaUnavailableSource || '').trim();
    if (!enabled28) return;
    const map2 = new Set(),
      item11 = (value98) => {
        const enabled29 = String(value98 || '').trim();
        if (!enabled29) return;
        map2.add(enabled29);
        const localPath3 = urlToLocalPath(enabled29);
        if (localPath3) map2.add(localPath3);
        const url2 = localPathToUrl(enabled29);
        if (url2) map2.add(url2);
      };
    [
      response3.localPath,
      response3.displayLocalPath,
      response3.originalLocalPath,
      response3.videoLocalPath,
      response3.videoUrl,
      response3.src,
      response3.url,
      response3.resultUrl,
      response3.sourceUrl,
      value97,
    ].forEach(item11);
    if (!map2.has(enabled28)) return;
    appStore.updateNodeData(this.id, { mediaUnavailable: false, mediaUnavailableSource: '' });
  }
  ['_getCapturePreviewUrl'](value99 = this._data) {
    const value100 = String(value99?.capturePreviewUrl || '').trim();
    return value100.startsWith('blob:') || value100.startsWith('aic-local-preview:') ? value100 : '';
  }
  ['_revokeCapturePreviewUrl'](value101) {
    const enabled30 = String(value101 || '').trim();
    if (!enabled30.startsWith('blob:')) return;
    const value102 = globalThis.window?.URL || globalThis.URL;
    if (typeof value102?.revokeObjectURL !== 'function') return;
    try {
      value102.revokeObjectURL(enabled30);
    } catch {}
  }
  ['_adoptCapturePreviewUrl'](value103) {
    const value104 = String(value103 || '').trim();
    (this._activeCapturePreviewUrl &&
      this._activeCapturePreviewUrl !== value104 &&
      this._revokeCapturePreviewUrl(this._activeCapturePreviewUrl),
      (this._activeCapturePreviewUrl = value104));
  }
  ['_releaseActiveCapturePreviewUrl']() {
    if (!this._activeCapturePreviewUrl) return;
    const value105 = this._activeCapturePreviewUrl;
    ((this._activeCapturePreviewUrl = ''), this._revokeCapturePreviewUrl(value105));
  }
  ['_resolveVideoMetaSrc'](enabled31) {
    if (!enabled31) return '';
    const sourceVideoMediaTaskSrc = resolveSourceVideoMediaTaskSrc(enabled31);
    if (sourceVideoMediaTaskSrc) return sourceVideoMediaTaskSrc;
    const enabled32 = this._resolveVideoSrc(enabled31);
    if (!enabled32) return '';
    const value106 = String(enabled32);
    if (
      value106.startsWith('http://') ||
      value106.startsWith('https://') ||
      value106.startsWith('blob:') ||
      value106.startsWith('aic-local-preview:') ||
      value106.startsWith('data:')
    )
      return '';
    return urlToLocalPath(value106) || '';
  }
  async ['_maybeFetchVideoMeta'](value107) {
    if (!shouldFetchVideoMetaForNodeInfo()) return;
    const videoMetaSrc = this._resolveVideoMetaSrc(value107);
    if (!videoMetaSrc) return;
    const enabled33 = appStore.getState().nodes[this.id];
    if (!enabled33) return;
    const value108 = String(enabled33.videoMetaSrc || ''),
      value109 =
        Number.isFinite(Number(enabled33.videoFps)) &&
        Number(enabled33.videoFps) > 0 &&
        Number.isFinite(Number(enabled33.videoFrameCount)) &&
        Number(enabled33.videoFrameCount) > 0;
    if (value109 && value108 === videoMetaSrc) return;
    value108 &&
      value108 !== videoMetaSrc &&
      appStore.updateNodeData(this.id, {
        videoMetaSrc: videoMetaSrc,
        videoFps: null,
        videoFrameCount: null,
        videoDuration: null,
        videoWidth: null,
        videoHeight: null,
      });
    const value110 = ++this._metaFetchToken;
    try {
      const box3 = await fetchVideoMetaFromServer(videoMetaSrc);
      if (value110 !== this._metaFetchToken) return;
      if (!box3 || box3.success !== true) return;
      const count5 = Number(box3.fps),
        count6 = Number(box3.frameCount),
        count7 = Number(box3.duration),
        count8 = Number(box3.width),
        count9 = Number(box3.height),
        value111 = { videoMetaSrc: videoMetaSrc };
      if (Number.isFinite(count5) && count5 > 0) value111.videoFps = count5;
      if (Number.isFinite(count6) && count6 > 0) value111.videoFrameCount = Math.round(count6);
      if (Number.isFinite(count7) && count7 > 0) value111.videoDuration = count7;
      if (Number.isFinite(count8) && count8 > 0) value111.videoWidth = Math.round(count8);
      if (Number.isFinite(count9) && count9 > 0) value111.videoHeight = Math.round(count9);
      const enabled34 = appStore.getState().nodes[this.id];
      if (!enabled34) return;
      const value112 =
        String(enabled34.videoMetaSrc || '') !== String(value111.videoMetaSrc || '') ||
        Number(enabled34.videoFps || 0) !== Number(value111.videoFps || 0) ||
        Number(enabled34.videoFrameCount || 0) !== Number(value111.videoFrameCount || 0) ||
        Number(enabled34.videoDuration || 0) !== Number(value111.videoDuration || 0) ||
        Number(enabled34.videoWidth || 0) !== Number(value111.videoWidth || 0) ||
        Number(enabled34.videoHeight || 0) !== Number(value111.videoHeight || 0);
      if (value112) appStore.updateNodeData(this.id, value111);
    } catch {}
  }
  ['_scheduleMaybeEnsureVideoThumb']() {
    if (this._idleVideoThumbCancel) return;
    this._idleVideoThumbCancel = scheduleSourceVideoIdleTask(() => {
      ((this._idleVideoThumbCancel = null), void this._maybeEnsureVideoThumb(this._data));
    });
  }
  async ['_maybeEnsureVideoThumb'](value113) {
    const videoThumbSrc = this._resolveVideoMetaSrc(value113);
    if (!videoThumbSrc) return;
    const enabled35 = appStore.getState().nodes[this.id];
    if (!enabled35) return;
    const enabled36 = String(enabled35.videoThumbSrc || ''),
      value114 = !!String(enabled35.thumbUrl || '').trim();
    if (value114 && enabled36 === videoThumbSrc) return;
    if (
      enabled36 === videoThumbSrc &&
      ['waiting', 'processing'].includes(String(enabled35.mediaTaskStatus || '')) &&
      ['videoFirstFrame', 'videoPoster'].includes(String(enabled35.mediaTaskKind || ''))
    )
      return;
    if (enabled36 && enabled36 !== videoThumbSrc)
      appStore.updateNodeData(this.id, { videoThumbSrc: videoThumbSrc, thumbUrl: null });
    else !enabled36 && appStore.updateNodeData(this.id, { videoThumbSrc: videoThumbSrc });
    const value115 = ++this._thumbFetchToken;
    try {
      const response4 = await fetchVideoFirstFrameThumbFromServer(videoThumbSrc, {
        nodeId: this.id,
        assetId: String(enabled35.assetId || ''),
      });
      if (value115 !== this._thumbFetchToken) return;
      if (!response4 || response4.success === false) return;
      const thumbUrl = String(response4.thumbUrl || response4.url || '').trim();
      if (!thumbUrl) return;
      const enabled37 = appStore.getState().nodes[this.id];
      if (!enabled37) return;
      const value116 =
        String(enabled37.videoThumbSrc || '') !== String(videoThumbSrc || '') ||
        String(enabled37.thumbUrl || '') !== thumbUrl;
      value116 && appStore.updateNodeData(this.id, { videoThumbSrc: videoThumbSrc, thumbUrl: thumbUrl });
    } catch {}
  }
  ['_getBaseDuration']() {
    const enabled38 = this._video;
    if (!enabled38) return 0;
    const count10 = Number(enabled38.duration);
    if (Number.isFinite(count10) && count10 > 0) return count10;
    const list4 = enabled38.seekable;
    if (list4 && list4.length) {
      const count11 = Number(list4.end(list4.length - 1));
      if (Number.isFinite(count11) && count11 > 0) return count11;
    }
    return 0;
  }
  ['_getClipRange'](value117) {
    const end = Number(value117);
    if (!Number.isFinite(end) || end <= 0) return { active: false, start: 0, end: 0 };
    const value118 = Number(this._data?.clipStart),
      value119 = Number(this._data?.clipEnd);
    if (!Number.isFinite(value118) || !Number.isFinite(value119) || !(value119 > value118))
      return { active: false, start: 0, end: end };
    const start = Math.max(0, Math.min(end, value118)),
      end2 = Math.max(0, Math.min(end, value119));
    if (!(end2 > start)) return { active: false, start: 0, end: end };
    return { active: true, start: start, end: end2 };
  }
  ['_setManualLoopPlayback'](value120) {
    this._isManualLoopPlayback = value120 === true;
    if (!this._video) return;
    if (!this._isManualLoopPlayback) {
      this._video.loop = false;
      return;
    }
    const enabled39 = this._getClipRange(this._getBaseDuration());
    this._video.loop = !enabled39.active;
  }
  ['_shouldKeepHoverPlaybackOnManualClick']() {
    if (!this._video) return false;
    if (!this._isHovered || this._isManualControl || this._hoverManualPause) return false;
    if (this._video.paused) return false;
    const count12 = Number(this._video.currentTime || 0);
    return !(count12 > 0.05);
  }
  ['_toggleManualPlayback']({ loop: loop = false, forcePlay: forcePlay = false } = {}) {
    if (!this._currentSrc) return;
    const enabled40 = this._ensureVideoElement();
    if (!enabled40) return;
    ((this._isManualControl = true), this._autoPlayToken++);
    if (enabled40.paused || forcePlay === true) {
      ((this._hoverManualPause = false), this._setManualLoopPlayback(loop === true));
      const value121 = this._getBaseDuration(),
        value122 = this._getClipRange(value121);
      if (value122.active) {
        const value123 = enabled40.currentTime || 0;
        if (value123 < value122.start || value123 > value122.end) enabled40.currentTime = value122.start;
      }
      void this._playVideoWithRecovery('manual', () => this._isManualControl).then((value124) => {
        value124 ? this._flashCenterIndicator('play') : this._setManualLoopPlayback(false);
      });
    } else
      ((this._hoverManualPause = true),
        this._setManualLoopPlayback(false),
        enabled40.pause(),
        this._flashCenterIndicator('pause'));
  }
  ['_getPlaybackLabel'](value125 = 'preview') {
    return 'source-video:' + this.id + ':' + value125;
  }
  async ['_openFullscreenFromCurrentVideo']() {
    const controls = this._ensureVideoElement();
    if (!controls) return;
    const videoCurrentSource = getVideoCurrentSource(controls) || this._currentSrc;
    if (!videoCurrentSource) return;
    !getVideoCurrentSource(controls) &&
      (await attachMediaElementPlaybackSource(controls, videoCurrentSource, {
        preload: 'auto',
        warmRanges: false,
        load: false,
      }));
    const el10 = document.createElement('div');
    Object.assign(el10.style, {
      position: 'fixed',
      inset: '0',
      background: 'var(--overlay-dim)',
      zIndex: '99999',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'zoom-out',
    });
    const el11 = controls.parentNode,
      value126 = controls.nextSibling,
      value127 = this._isManualControl,
      value128 = this._hoverManualPause,
      position = {
        controls: controls.controls,
        loop: controls.loop,
        muted: controls.muted,
        position: controls.style.position,
        inset: controls.style.inset,
        width: controls.style.width,
        height: controls.style.height,
        maxWidth: controls.style.maxWidth,
        maxHeight: controls.style.maxHeight,
        objectFit: controls.style.objectFit,
        borderRadius: controls.style.borderRadius,
        margin: controls.style.margin,
        pointerEvents: controls.style.pointerEvents,
        boxShadow: controls.style.boxShadow,
      };
    ((this._isManualControl = true),
      (this._hoverManualPause = false),
      (controls.controls = true),
      (controls.loop = true),
      (controls.muted = !!this._isMuted),
      Object.assign(controls.style, {
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
      attachVideoPlaybackRecovery(controls, {
        label: this._getPlaybackLabel('fullscreen'),
        minBufferAhead: 0.5,
        readyTimeoutMs: 350,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 500,
        shouldRecover: () => controls.isConnected !== false && !controls.paused,
      }));
    let value129 = false;
    const run6 = () => {
      if (value129) return;
      value129 = true;
      try {
        controls.pause();
      } catch {}
      ((controls.controls = position.controls),
        (controls.loop = position.loop),
        (controls.muted = position.muted),
        Object.assign(controls.style, {
          position: position.position,
          inset: position.inset,
          width: position.width,
          height: position.height,
          maxWidth: position.maxWidth,
          maxHeight: position.maxHeight,
          objectFit: position.objectFit,
          borderRadius: position.borderRadius,
          margin: position.margin,
          pointerEvents: position.pointerEvents,
          boxShadow: position.boxShadow,
        }));
      if (el11) el11.insertBefore(controls, value126);
      (el10.remove(),
        (this._isManualControl = value127),
        (this._hoverManualPause = value128),
        this._attachPlaybackRecovery());
    };
    (el10.addEventListener('click', (event13) => {
      if (event13.target === el10) run6();
    }),
      el10.appendChild(controls),
      document.body.appendChild(el10),
      void playVideoWithRecovery(controls, {
        label: this._getPlaybackLabel('fullscreen'),
        minBufferAhead: 0.5,
        readyTimeoutMs: 350,
        recoveryDebounceMs: 150,
        recoveryCooldownMs: 500,
        shouldRecover: () => controls.isConnected !== false && !controls.paused,
      }));
  }
  async ['_ensurePlaybackVideoSrc']({ forPlayback: forPlayback = false } = {}) {
    const enabled41 = this._ensureVideoElement();
    if (!enabled41) return false;
    if (getVideoCurrentSource(enabled41))
      return (forPlayback && enabled41.preload !== 'auto' && (enabled41.preload = 'auto'), true);
    const enabled42 = String(this._currentSrc || this._resolveVideoSrc(this._data) || '').trim();
    if (!enabled42) return false;
    this._currentSrc = enabled42;
    if (this._currentSrc !== enabled42) return false;
    return (
      await attachMediaElementPlaybackSource(enabled41, enabled42, {
        preload: forPlayback ? 'auto' : SOURCE_VIDEO_POSTER_PRELOAD,
        warmRanges: false,
        load: forPlayback || (!forPlayback && !isDesktopRenderer()),
      }),
      true
    );
  }
  ['_attachPlaybackRecovery'](value130 = 'preview') {
    if (!this._video) return null;
    const minBufferAhead = value130 === 'hover' || value130 === 'fullscreen';
    return attachVideoPlaybackRecovery(this._video, {
      label: this._getPlaybackLabel(value130),
      ensureSrc: () => this._ensurePlaybackVideoSrc({ forPlayback: true }),
      minBufferAhead: minBufferAhead ? 0.5 : undefined,
      readyTimeoutMs: minBufferAhead ? 350 : undefined,
      recoveryDebounceMs: minBufferAhead ? 150 : undefined,
      recoveryCooldownMs: minBufferAhead ? 500 : undefined,
      shouldRecover: () =>
        this._video?.isConnected !== false &&
        (this._isHovered || this._isManualControl || !this._video?.paused),
    });
  }
  async ['_playVideoWithRecovery'](minBufferAhead2, shouldContinue) {
    const enabled43 = this._ensureVideoElement();
    if (!enabled43) return false;
    return (
      this._attachPlaybackRecovery(minBufferAhead2),
      playVideoWithRecovery(enabled43, {
        label: this._getPlaybackLabel(minBufferAhead2),
        ensureSrc: () => this._ensurePlaybackVideoSrc({ forPlayback: true }),
        minBufferAhead: minBufferAhead2 === 'hover' ? 0.5 : undefined,
        readyTimeoutMs: minBufferAhead2 === 'hover' ? 350 : undefined,
        recoveryDebounceMs: minBufferAhead2 === 'hover' ? 150 : undefined,
        recoveryCooldownMs: minBufferAhead2 === 'hover' ? 500 : undefined,
        shouldRecover: () =>
          this._video?.isConnected !== false &&
          (this._isHovered || this._isManualControl || !this._video?.paused),
        shouldContinue: shouldContinue,
      })
    );
  }
  ['_loadVideo'](value131) {
    const enabled44 = String(value131 || '').trim();
    if (this._rendererMediaDeferred === true) {
      ((this._currentSrc = enabled44), this._applyVideoPoster(this._data));
      return;
    }
    this._setManualLoopPlayback(false);
    const enabled45 = this._applyVideoPoster(this._data);
    if (!enabled44) {
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
    const value132 = this._getCapturePreviewUrl(this._data);
    if (enabled44 === value132) this._adoptCapturePreviewUrl(enabled44);
    else this._activeCapturePreviewUrl && this._releaseActiveCapturePreviewUrl();
    this._currentSrc = enabled44;
    if (enabled45) {
      this._idleVideoThumbCancel && (this._idleVideoThumbCancel(), (this._idleVideoThumbCancel = null));
      this._loadVideoToken = null;
      if (this._video) {
        ((this._video.onloadeddata = null), (this._video.onerror = null));
        const videoCurrentSource2 = getVideoCurrentSource(this._video);
        (videoCurrentSource2 &&
          videoCurrentSource2 !== enabled44 &&
          this._clearVideoElementSource({ load: false }),
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
    let value133 = false;
    const run7 = () => {
      if (value133 || this._currentSrc !== enabled44) return;
      ((value133 = true), stopLoading(this._card), this._clearMediaUnavailableAfterPlayback(enabled44));
      this._activeCapturePreviewUrl &&
        this._activeCapturePreviewUrl !== enabled44 &&
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
        ((this._video.onloadeddata = run7),
        (this._video.onerror = () => {
          if (this._currentSrc === enabled44) stopLoading(this._card);
        }),
        (this._video.preload = 'none'),
        this._syncVideoElementFrameVisibility({ forceHidden: true }));
      (this._syncPosterFrameVisibility({ force: !!enabled45 }),
        (this._controls.style.opacity = '1'),
        (this._muteBtn.style.display = 'flex'));
      this._centerIndicator &&
        ((this._centerIndicator.style.display = 'flex'), this._showPausedCenterIndicator());
      if (this._hint) this._hint.style.display = 'block';
      (stopLoading(this._card), this._scheduleMaybeEnsureVideoThumb(), this._attachPlaybackRecovery());
      return;
    }
    const el12 = this._ensureVideoElement();
    if (!el12) {
      stopLoading(this._card);
      return;
    }
    ((el12.onloadeddata = run7),
      (el12.onerror = () => {
        if (this._currentSrc === enabled44) stopLoading(this._card);
      }),
      startLoading(this._card, { variant: 'static' }),
      (el12.style.display = 'block'),
      this._syncVideoElementFrameVisibility(),
      this._setPosterFrameVisible(false),
      (this._controls.style.opacity = '0'),
      (this._muteBtn.style.display = 'none'));
    if (this._centerIndicator) this._centerIndicator.style.display = 'none';
    const value134 = {};
    this._loadVideoToken = value134;
    const run8 = () => {
      if (!this._video || this._loadVideoToken !== value134 || this._currentSrc !== enabled44) return;
      ((this._video.preload = 'auto'), (this._video.src = enabled44));
      try {
        this._video.load?.();
      } catch {}
      if (Number(this._video.readyState || 0) >= 2) run7();
    };
    (run8(), this._attachPlaybackRecovery());
    if (this._hint) this._hint.style.display = 'block';
  }
  ['_fmt'](enabled46) {
    if (!enabled46 || isNaN(enabled46)) return '0:00';
    return Math.floor(enabled46 / 60) + ':' + String(Math.floor(enabled46 % 60)).padStart(2, '0');
  }
  ['_getNodeDuration'](value135 = this._data) {
    const count13 = Number(value135?.videoDuration || value135?.duration || 0);
    if (Number.isFinite(count13) && count13 > 0) return count13;
    const count14 = Number(value135?.videoFrameCount || value135?.frameCount || 0),
      count15 = Number(value135?.videoFps || value135?.fps || 0);
    if (Number.isFinite(count14) && count14 > 0 && Number.isFinite(count15) && count15 > 0)
      return count14 / count15;
    return 0;
  }
  ['_syncVideoDurationUi']() {
    if (!this._timeTotal) return;
    const enabled47 = this._getBaseDuration() || this._getNodeDuration(this._data);
    if (!enabled47 || !Number.isFinite(enabled47)) return;
    const value136 = this._getClipRange(enabled47),
      enabled48 = value136.active ? Math.max(0, value136.end - value136.start) : enabled47;
    if (!enabled48 || !Number.isFinite(enabled48)) return;
    this._timeTotal.textContent = this._fmt(enabled48);
  }
  ['_setCenterIndicatorIcon'](value137) {
    if (!this._indicatorInner) return;
    const el13 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    (el13.setAttribute('width', '28'),
      el13.setAttribute('height', '28'),
      el13.setAttribute('viewBox', '0 0 24 24'),
      el13.setAttribute('fill', 'currentColor'),
      (el13.style.color = 'var(--canvas-white)'),
      value137 === 'play'
        ? (el13.innerHTML = '<polygon points="6 4 20 12 6 20 6 4"></polygon>')
        : (el13.innerHTML =
            '<rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect>'),
      (this._indicatorInner.innerHTML = ''),
      this._indicatorInner.appendChild(el13));
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
  ['_flashCenterIndicator'](value138) {
    if (!this._indicatorInner) return;
    (this._centerIndicatorTimer &&
      (clearTimeout(this._centerIndicatorTimer), (this._centerIndicatorTimer = null)),
      this._setCenterIndicatorIcon(value138),
      (this._indicatorInner.style.opacity = '1'),
      (this._indicatorInner.style.transform = 'scale(1)'),
      (this._centerIndicatorTimer = setTimeout(() => {
        if (!this._indicatorInner) return;
        if (value138 === 'pause') this._showPausedCenterIndicator();
        else this._hideCenterIndicator();
        this._centerIndicatorTimer = null;
      }, 520)));
  }
  ['_updatePlayIcon'](value139) {
    if (!this._playBtn) return;
    this._playBtn.replaceChildren();
    const value140 = 'http://www.w3.org/2000/svg',
      el14 = document.createElementNS(value140, 'svg');
    (el14.setAttribute('width', '16'),
      el14.setAttribute('height', '16'),
      el14.setAttribute('viewBox', '0 0 24 24'),
      el14.setAttribute('fill', 'currentColor'));
    if (value139) {
      const el15 = document.createElementNS(value140, 'polygon');
      (el15.setAttribute('points', '5 3 19 12 5 21 5 3'), el14.appendChild(el15));
    } else {
      const el16 = document.createElementNS(value140, 'rect');
      (el16.setAttribute('x', '6'),
        el16.setAttribute('y', '4'),
        el16.setAttribute('width', '4'),
        el16.setAttribute('height', '16'));
      const el17 = document.createElementNS(value140, 'rect');
      (el17.setAttribute('x', '14'),
        el17.setAttribute('y', '4'),
        el17.setAttribute('width', '4'),
        el17.setAttribute('height', '16'),
        el14.appendChild(el16),
        el14.appendChild(el17));
    }
    this._playBtn.appendChild(el14);
  }
  async ['_captureFrame']() {
    const enabled49 = await this._ensurePlaybackVideoSrc();
    if (!enabled49 || !this._video) return;
    await extractCurrentVideoFrameToImageNode({
      videoEl: this._video,
      anchorNodeId: this.id,
      fallbackDurationSec: this._getBaseDuration(),
      onMissingMetadata: (value141) => this._maybeFetchVideoMeta(value141),
      logPrefix: '[SourceVideoNode]',
    });
  }
  ['_computeGenerationDuration'](enabled50 = this._data) {
    if (!enabled50) return 0;
    if (typeof enabled50.generationDuration === 'number') return enabled50.generationDuration;
    const count16 = Number(enabled50.generationStartTime || 0);
    if (!Number.isFinite(count16) || count16 <= 0) return 0;
    return Math.max(0, Date.now() - count16);
  }
  ['_isRunningHubRecoverableTask'](enabled51 = this._data) {
    if (!enabled51 || typeof enabled51 !== 'object') return false;
    const enabled52 = String(enabled51.rhTaskId || '').trim();
    if (!enabled52) return false;
    const value142 = String(enabled51.rhTaskStatus || '')
      .trim()
      .toLowerCase();
    if (['success', 'failed', 'idle', 'cancelled'].includes(value142)) return false;
    return isRunningHubVideoTask(enabled51);
  }
  ['_syncRunningHubVideoTaskState'](enabled53 = this._data) {
    if (!enabled53 || typeof enabled53 !== 'object') return false;
    const runningHubVideoTerminalStatePatch = buildRunningHubVideoTerminalStatePatch(
      enabled53,
      enabled53.rhTaskStatus,
      this._computeGenerationDuration(enabled53),
    );
    if (!runningHubVideoTerminalStatePatch) return false;
    return (appStore.updateNodeData(this.id, runningHubVideoTerminalStatePatch), true);
  }
  ['_isAsyncRecoverableTask'](enabled54 = this._data) {
    if (!enabled54 || typeof enabled54 !== 'object') return false;
    const enabled55 = String(enabled54.asyncTaskId || '').trim();
    if (!enabled55) return false;
    const enabled56 = String(enabled54.asyncTaskProvider || enabled54.provider || '')
      .trim()
      .toLowerCase();
    if (!enabled56 || enabled56 === 'runninghubwf' || enabled56 === 'runninghub' || enabled56 === 'dreamina')
      return false;
    const value143 = String(enabled54.asyncTaskKind || '')
      .trim()
      .toLowerCase();
    if (value143 && value143 !== 'video') return false;
    const value144 = String(enabled54.asyncTaskStatus || '')
      .trim()
      .toLowerCase();
    if (['success', 'failed', 'idle', 'cancelled'].includes(value144)) return false;
    return true;
  }
  ['_stopRunningHubRecovery'](enabled57 = true) {
    try {
      this._rhResumeAbortController?.abort?.();
    } catch {}
    ((this._rhResumeAbortController = null), (this._rhResumePromise = null), (this._rhResumeTaskId = ''));
    if (!enabled57) return;
    const enabled58 = appStore.getState().nodes?.[this.id];
    if (!enabled58 || enabled58.rhTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { rhTaskRecovering: false });
  }
  ['_stopAsyncRecovery'](enabled59 = true) {
    try {
      this._asyncResumeAbortController?.abort?.();
    } catch {}
    ((this._asyncResumeAbortController = null),
      (this._asyncResumePromise = null),
      (this._asyncResumeTaskId = ''));
    if (!enabled59) return;
    const enabled60 = appStore.getState().nodes?.[this.id];
    if (!enabled60 || enabled60.asyncTaskRecovering !== true) return;
    appStore.updateNodeData(this.id, { asyncTaskRecovering: false });
  }
  ['_extractFirstVideoUrl'](value145) {
    const map3 = new Set(),
      handler9 = (value146) => {
        if (value146 == null) return '';
        if (typeof value146 === 'string') {
          const enabled61 = value146.trim();
          if (!enabled61) return '';
          if (
            enabled61.startsWith('http://') ||
            enabled61.startsWith('https://') ||
            enabled61.startsWith('/')
          )
            return enabled61;
          if (enabled61.startsWith('{') || enabled61.startsWith('['))
            try {
              return handler9(JSON.parse(enabled61));
            } catch {
              return '';
            }
          const value147 = enabled61.match(/https?:\/\/[^\s"'<>]+/);
          return value147 && value147[0] ? value147[0] : '';
        }
        if (typeof value146 !== 'object') return '';
        if (map3.has(value146)) return '';
        map3.add(value146);
        if (Array.isArray(value146)) {
          for (const value148 of value146) {
            const value149 = handler9(value148);
            if (value149) return value149;
          }
          return '';
        }
        const value150 = [
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
        for (const value151 of value150) {
          const value152 = handler9(value146[value151]);
          if (value152) return value152;
        }
        return '';
      };
    return handler9(value145);
  }
  ['_toLocalPathIfSameOrigin'](value153) {
    return urlToLocalPath(value153);
  }
  async ['_saveVideoToOutput'](value154) {
    const url3 = String(value154 || '').trim();
    if (!/^https?:\/\//i.test(url3)) return this._toLocalPathIfSameOrigin(url3);
    let resultLocalPath = '';
    try {
      const signal = new AbortController(),
        setTimeout5 = setTimeout(() => signal.abort(), 120000);
      let fetchRemoteBlob2 = null;
      try {
        fetchRemoteBlob2 = await fetchRemoteBlob(url3, { signal: signal.signal });
      } finally {
        clearTimeout(setTimeout5);
      }
      const response5 = await saveOutputToServer(fetchRemoteBlob2, { ext: 'mp4' });
      response5?.success && (resultLocalPath = pickResultLocalPath(response5));
    } catch (error6) {
      const list5 = error6 instanceof Error ? error6.message : String(error6 || ''),
        value155 =
          list5.includes('Failed to fetch') ||
          list5.includes('NetworkError') ||
          list5.toLowerCase().includes('cors');
      if (value155) {
        const server = await saveOutputFromUrlToServer({ url: url3, ext: 'mp4' });
        resultLocalPath = pickResultLocalPath(server);
      }
    }
    return resultLocalPath;
  }
  async ['_buildRecoveredVideoResultPatch'](value156) {
    let canvasLocalVideoFields = buildCanvasLocalVideoFields(value156);
    if (canvasLocalVideoFields.src && canvasLocalVideoFields.localPath) return canvasLocalVideoFields;
    const videoUrl = this._extractFirstVideoUrl(value156);
    if (!videoUrl) throw new Error(sourceVideoText('recovery.noOutputVideoUrl'));
    const localPath4 = this._toLocalPathIfSameOrigin(videoUrl) || (await this._saveVideoToOutput(videoUrl));
    canvasLocalVideoFields = buildCanvasLocalVideoFields({ localPath: localPath4, videoUrl: videoUrl });
    if (!canvasLocalVideoFields.src || !canvasLocalVideoFields.localPath)
      throw new Error(sourceVideoText('recovery.noOutputVideoUrl'));
    return canvasLocalVideoFields;
  }
  ['_resolveAsyncResumePayload'](value157) {
    return {
      model: String(value157?.model || '').trim(),
      provider: String(value157?.asyncTaskProvider || value157?.provider || '').trim(),
    };
  }
  ['_maybeResumeRunningHubTask']() {
    const value158 = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isRunningHubRecoverableTask(value158)) {
      this._stopRunningHubRecovery(true);
      return;
    }
    const taskId = String(value158?.rhTaskId || '').trim();
    if (!taskId) return;
    if (this._rhResumePromise && this._rhResumeTaskId === taskId) return;
    const startedAt2 = Number(value158?.rhTaskStartedAt || value158?.generationStartTime || 0) || Date.now(),
      value159 = String(value158?.model || '')
        .trim()
        .toLowerCase(),
      rhTaskUseOpenapiQuery = value158?.rhTaskUseOpenapiQuery === true,
      model = getVideoMattingModelId(),
      value160 = value159 === model,
      provider = value160
        ? { provider: 'runninghubwf', model: model }
        : {
            provider: String(value158?.provider || 'runninghubwf').trim() || 'runninghubwf',
            model: String(value158?.model || '').trim(),
          },
      handler10 =
        typeof this._resumeRunningHubTaskPoller === 'function' ? this._resumeRunningHubTaskPoller : null,
      signal2 = new AbortController();
    ((this._rhResumeAbortController = signal2), (this._rhResumeTaskId = taskId));
    const value161 = (async () => {
      try {
        const response6 = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'video-generation',
            provider: provider.provider || value158?.provider || 'runninghubwf',
            adapterType: 'workflow',
            modelId: provider.model || value158?.model || '',
            executionId: 'runninghub.source-video.' + (provider.model || value158?.model || 'workflow'),
            payload: provider,
            taskId: taskId,
            cancellable: false,
            resumable: true,
            pauseOnAbort: true,
            startBuilder: () => ({
              rhTaskStatus:
                String(value158?.rhTaskStatus || '')
                  .trim()
                  .toLowerCase() === 'pending'
                  ? 'pending'
                  : 'running',
              rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery,
            }),
            poll: async () => {
              if (handler10)
                return handler10(taskId, value158, {
                  signal: signal2.signal,
                  payload: provider,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                });
              if (value160)
                return resumeRunningHubVideoTask(taskId, provider, {
                  signal: signal2.signal,
                  useOpenapiQuery: rhTaskUseOpenapiQuery,
                });
              await ensureConfig();
              const providerConfig = getProviderConfig('runninghubwf'),
                apiKey = String(providerConfig?.apiKey || '').trim();
              if (!apiKey) throw new Error(sourceVideoText('recovery.runninghubApiKeyMissing'));
              return resumeRunninghubWorkflowTask(
                { apiKey: apiKey, taskId: taskId },
                { signal: signal2.signal, useOpenapiQuery: rhTaskUseOpenapiQuery },
              );
            },
            resultBuilder: async (value162) => {
              const error7 = appStore.getState().nodes?.[this.id] || {},
                name =
                  resolveRunningHubVideoStatusName(error7, 'success') ||
                  (error7?.name?.includes(sourceVideoText('result.hdVideo'))
                    ? sourceVideoText('result.hdVideo')
                    : error7?.name || sourceVideoText('result.defaultName'));
              return {
                ...(await this._buildRecoveredVideoResultPatch(value162)),
                name: name,
                generationDuration: this._computeGenerationDuration(error7),
              };
            },
            failureBuilder: (error8, startedAt3) => {
              const error9 =
                  error8 instanceof Error
                    ? error8.message
                    : String(error8 || sourceVideoText('recovery.taskFailed')),
                value163 = appStore.getState().nodes?.[this.id] || {},
                args5 =
                  buildRunningHubVideoTerminalStatePatch(
                    value163,
                    'failed',
                    this._computeGenerationDuration(value163),
                  ) || {},
                duration2 = args5.generationDuration ?? this._computeGenerationDuration(value163);
              return {
                ...buildSourceVideoRecoveryFailurePatch(value163, {
                  error: error9,
                  startedAt: startedAt3.startedAt,
                  duration: duration2,
                }),
                ...args5,
                generationDuration: duration2,
              };
            },
            parseError: (error10) =>
              error10 instanceof Error
                ? error10.message
                : String(error10 || sourceVideoText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: startedAt2, abortController: signal2 },
        );
        response6.status === 'success' && window._triggerLocalCacheSave?.();
      } catch (error11) {
        if (signal2.signal.aborted || String(error11?.message || '') === 'CANCELLED') return;
        const error12 =
            error11 instanceof Error
              ? error11.message
              : String(error11 || sourceVideoText('recovery.taskFailed')),
          enabled62 = appStore.getState().nodes?.[this.id];
        if (!enabled62) return;
        const duration3 =
          buildRunningHubVideoTerminalStatePatch(
            enabled62,
            'failed',
            this._computeGenerationDuration(enabled62),
          ) || {};
        appStore.updateNodeData(this.id, {
          ...buildSourceVideoRecoveryFailurePatch(enabled62, {
            error: error12,
            startedAt: startedAt2,
            duration: duration3.generationDuration ?? this._computeGenerationDuration(enabled62),
          }),
          ...duration3,
          isGenerating: false,
          generationDuration: duration3.generationDuration ?? this._computeGenerationDuration(enabled62),
          rhTaskStatus: 'failed',
          rhTaskRecovering: false,
        });
      } finally {
        (this._rhResumeAbortController === signal2 && (this._rhResumeAbortController = null),
          this._rhResumeTaskId === taskId && (this._rhResumeTaskId = ''),
          (this._rhResumePromise = null));
      }
    })();
    this._rhResumePromise = value161;
  }
  ['_maybeResumeAsyncTask']() {
    const value164 = appStore.getState().nodes?.[this.id] || this._data;
    if (!this._isAsyncRecoverableTask(value164)) {
      this._stopAsyncRecovery(true);
      return;
    }
    const taskId2 = String(value164?.asyncTaskId || '').trim();
    if (!taskId2) return;
    if (this._asyncResumePromise && this._asyncResumeTaskId === taskId2) return;
    const startedAt4 =
        Number(value164?.asyncTaskStartedAt || value164?.generationStartTime || 0) || Date.now(),
      modelId = this._resolveAsyncResumePayload(value164),
      provider2 = String(modelId.provider || value164?.asyncTaskProvider || value164?.provider || '')
        .trim()
        .toLowerCase(),
      handler11 =
        typeof this._resumeAsyncTaskPoller === 'function'
          ? this._resumeAsyncTaskPoller
          : resumeAsyncVideoTask,
      signal3 = new AbortController();
    ((this._asyncResumeAbortController = signal3), (this._asyncResumeTaskId = taskId2));
    const value165 = (async () => {
      try {
        const response7 = await resumeTask(
          {
            sourceNodeId: this.id,
            targetNodeId: this.id,
            trigger: 'node',
            taskType: 'video-generation',
            provider: provider2 || modelId.provider || value164?.provider || '',
            adapterType: 'modelApi',
            modelId: modelId.model || value164?.model || '',
            executionId: (provider2 || modelId.provider || 'model') + '.source-video.async',
            payload: modelId,
            taskId: taskId2,
            async: true,
            cancellable: false,
            resumable: true,
            pauseOnAbort: true,
            startBuilder: () => ({
              asyncTaskProvider: provider2,
              asyncTaskKind: 'video',
              asyncTaskStatus:
                String(value164?.asyncTaskStatus || '')
                  .trim()
                  .toLowerCase() === 'pending'
                  ? 'pending'
                  : 'running',
            }),
            poll: async () => handler11(taskId2, modelId, { signal: signal3.signal }),
            resultBuilder: async (value166) => {
              const name2 = appStore.getState().nodes?.[this.id] || {};
              return {
                ...(await this._buildRecoveredVideoResultPatch(value166)),
                name: name2?.name?.includes(sourceVideoText('result.hdVideo'))
                  ? sourceVideoText('result.hdVideo')
                  : name2?.name || sourceVideoText('result.defaultName'),
                generationDuration: this._computeGenerationDuration(name2),
              };
            },
            failureBuilder: (error13, startedAt5) => {
              const error14 =
                  error13 instanceof Error
                    ? error13.message
                    : String(error13 || sourceVideoText('recovery.taskFailed')),
                value167 = appStore.getState().nodes?.[this.id] || {};
              return buildSourceVideoRecoveryFailurePatch(value167, {
                error: error14,
                startedAt: startedAt5.startedAt,
                duration: this._computeGenerationDuration(value167),
              });
            },
            parseError: (error15) =>
              error15 instanceof Error
                ? error15.message
                : String(error15 || sourceVideoText('recovery.taskFailed')),
          },
          { store: appStore, startedAt: startedAt4, abortController: signal3 },
        );
        response7.status === 'success' && window._triggerLocalCacheSave?.();
      } catch (error16) {
        if (
          signal3.signal.aborted ||
          String(error16?.message || '') === 'CANCELLED' ||
          error16?.name === 'AbortError'
        )
          return;
        const error17 =
            error16 instanceof Error
              ? error16.message
              : String(error16 || sourceVideoText('recovery.taskFailed')),
          enabled63 = appStore.getState().nodes?.[this.id];
        if (!enabled63) return;
        appStore.updateNodeData(this.id, {
          ...buildSourceVideoRecoveryFailurePatch(enabled63, {
            error: error17,
            startedAt: startedAt4,
            duration: this._computeGenerationDuration(enabled63),
          }),
          isGenerating: false,
          asyncTaskStatus: 'failed',
          asyncTaskRecovering: false,
        });
      } finally {
        (this._asyncResumeAbortController === signal3 && (this._asyncResumeAbortController = null),
          this._asyncResumeTaskId === taskId2 && (this._asyncResumeTaskId = ''),
          (this._asyncResumePromise = null));
      }
    })();
    this._asyncResumePromise = value165;
  }
  ['update'](error18) {
    this._data = error18;
    this._syncRunningHubVideoTaskState(error18) &&
      ((this._data = appStore.getState().nodes?.[this.id] || error18), (error18 = this._data));
    this._syncMutedStateFromData(error18);
    const enabled64 = this._resolveVideoSrc(error18),
      shouldShowGenerationResultLoadingUi2 = shouldShowGenerationResultLoadingUi(error18, {
        hasResult: !!enabled64,
      });
    if (shouldShowGenerationResultLoadingUi2) {
      startLoading(this._card, { variant: 'full' });
      if (this._hint) this._hint.style.display = 'none';
      if (this._uploadBtn) this._uploadBtn.disabled = true;
    } else {
      if (isTaskTerminal(error18)) {
        stopLoading(this._card);
        if (this._uploadBtn) this._uploadBtn.disabled = false;
      } else {
        if (this._uploadBtn) this._uploadBtn.disabled = false;
        if (!enabled64) stopLoading(this._card);
      }
    }
    this._clearResolvedVideoTimer(error18, enabled64);
    const sourceVideoPosterSrc2 = resolveSourceVideoPosterSrc(error18),
      value168 = sourceVideoPosterSrc2 !== this._lastPosterSrc;
    if (this._rendererMediaDeferred === true) {
      this._currentSrc = enabled64 || '';
      this._video && ((this._video.preload = 'none'), this._clearVideoElementSource({ load: false }));
      if (value168 || sourceVideoPosterSrc2) this._applyVideoPoster(error18);
      else this._setPosterFrameVisible(false);
      (this._maybeResumeRunningHubTask(), this._maybeResumeAsyncTask());
      this._label &&
        error18.name &&
        document.activeElement !== this._label &&
        (this._label.innerText = error18.name);
      return;
    }
    if (enabled64 && enabled64 !== this._currentSrc) this._loadVideo(enabled64);
    else {
      if (enabled64 && value168 && (!this._video || this._video.paused)) this._loadVideo(enabled64);
      else {
        if (value168) this._applyVideoPoster(error18);
        else {
          if (!enabled64) this._loadVideo('');
        }
      }
    }
    (this._maybeFetchVideoMeta(error18),
      this._maybeResumeRunningHubTask(),
      this._maybeResumeAsyncTask(),
      this._label &&
        error18.name &&
        document.activeElement !== this._label &&
        (this._label.innerText = error18.name));
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
    const value169 = appStore.getStateRaw().nodes?.[this.id] || this._data,
      value170 = this._resolveVideoSrc(value169);
    if (value170) this._loadVideo(value170);
    else this._loadVideo('');
    this._maybeFetchVideoMeta(value169);
  }
}

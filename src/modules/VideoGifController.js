import {
  cancelElectronMediaTask,
  enqueueElectronMediaTask,
  waitForElectronMediaTask,
} from '../../api/localMediaTaskApi.js';
import { playVideoWithRecovery } from '../components/video-node/mediaPlaybackRecovery.js';
import { createVideoRangeTimelineView } from '../components/media-clip/videoRangeTimelineView.js';
import { GIF_ICON_SVG } from '../components/sharedIconMarkup.js';
import { generateId } from '../core/math.js';
import appStore from '../core/stores/appStore.js';
import { applyI18n, t } from '../i18n/index.js';
import { attachDesktopMediaPlaybackSource } from '../services/desktopMediaBlobSource.js';
import { desktopBridge } from '../services/desktopBridge.js';
import { releaseCanvasPanShortcut } from '../services/canvasPanShortcutState.js';
import {
  buildCanvasLocalImageFields,
  resolveCanvasVideoPosterUrl,
} from '../services/canvasMediaLocalService.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../services/fileService.js';
import { localPathToUrl, pickResultLocalPath } from '../utils/localMediaPath.js';
import { registerStaticInnerHTML, setStaticInnerHTML } from '../utils/dom.js';
import { commit } from './history.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { renderVideoTimelineThumbnails } from './videoTimelineThumbnails.js';
import { resolveNodeVideoElement } from './nodeVideoElement.js';
export const VIDEO_GIF_SETTINGS = Object.freeze({
  sizes: Object.freeze([480, 720, 1080]),
  defaultSizeIndex: 1,
  fpsOptions: Object.freeze([8, 10, 12, 15, 20, 24]),
  defaultFpsIndex: 4,
  defaultDurationSec: 8,
  targetBytes: 1024 * 1024,
});
const QUALITY_OPTIONS = Object.freeze(['compact', 'balanced', 'high']),
  GIF_PREFERENCES_STORAGE_KEY = 'v2-video-gif-preferences',
  GIF_EDITOR_MIN_RANGE_SEC = 0.1,
  GIF_EDITOR_VIEWPORT_MARGIN_PX = 12;
function videoGifText(value, item = {}) {
  return t('videoGif.' + value, item);
}
function clamp(key, index, result) {
  return Math.max(index, Math.min(result, Number(key) || 0));
}
function roundTime(data) {
  return Math.round((Number(data) || 0) * 100) / 100;
}
function formatTime(options) {
  const target = Math.max(0, Number(options) || 0),
    source = Math.floor(target / 60);
  return source + ':' + (target % 60).toFixed(1).padStart(4, '0');
}
export function formatVideoGifFileSize(next) {
  const count = Math.max(0, Number(next) || 0);
  if (count < 1024) return Math.round(count) + ' B';
  if (count < 1024 * 1024) return Math.round(count / 1024) + ' KB';
  return (count / (1024 * 1024)).toFixed(1) + ' MB';
}
export function resolveVideoGifOutputSize({
  size: size = 240,
  sourceWidth: sourceWidth = 0,
  sourceHeight: sourceHeight = 0,
} = {}) {
  const width = Math.max(64, Math.round(Number(size) || 240));
  if (!(sourceWidth > 0) || !(sourceHeight > 0)) return { width: width, height: width };
  const count2 = sourceWidth / sourceHeight;
  if (count2 >= 1) return { width: width, height: Math.max(1, Math.round(width / count2)) };
  return { width: Math.max(1, Math.round(width * count2)), height: width };
}
export function resolveVideoGifDrawRect({
  sourceWidth: sourceWidth2,
  sourceHeight: sourceHeight2,
  targetWidth: targetWidth,
  targetHeight: targetHeight,
  fit: fit = 'contain',
} = {}) {
  const current = Math.max(1, Number(sourceWidth2) || 1),
    entry = Math.max(1, Number(sourceHeight2) || 1),
    record = Math.max(1, Number(targetWidth) || 1),
    payload = Math.max(1, Number(targetHeight) || 1),
    handle =
      fit === 'cover'
        ? Math.max(record / current, payload / entry)
        : Math.min(record / current, payload / entry),
    width2 = current * handle,
    height = entry * handle;
  return {
    x: (record - width2) / 2,
    y: (payload - height) / 2,
    width: width2,
    height: height,
  };
}
function getMainVideoItem(options2 = {}) {
  const state = Array.isArray(options2.videos) ? options2.videos : [],
    config = Number.isFinite(Number(options2.mainVideoIndex))
      ? Math.max(0, Math.trunc(Number(options2.mainVideoIndex)))
      : 0;
  return state[config] || state[0] || null;
}
function getSourceName(error = {}) {
  return String(error.name || '').trim() || videoGifText('fallbackVideoName');
}
function getResultFilename(options3 = {}) {
  const scope = String(options3.filename || options3.fileName || '').trim();
  if (scope) return scope;
  const input = String(pickResultLocalPath(options3) || '').replace(/\\/g, '/');
  return input.split('/').filter(Boolean).pop() || 'video-' + Date.now() + '.gif';
}
function createIconMarkup(output) {
  if (output === 'play')
    return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>';
  if (output === 'pause')
    return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
}
function createPreviewMarkup() {
  return '\n    <div class="v2-gif-node-preview" data-gif-preview>\n      <canvas class="v2-gif-editor-canvas" data-gif-canvas></canvas>\n      <div class="v2-gif-editor-loading" data-gif-loading role="status">\n        <span class="v2-gif-editor-spinner" aria-hidden="true"></span>\n        <span data-i18n="videoGif.loadingPreview">正在加载 GIF 预览…</span>\n      </div>\n    </div>\n  ';
}
function createControlsMarkup() {
  return (
    '\n    <div class="v2-video-gifbar" role="group" data-gif-editor-shell>\n      <div class="v2-gif-editor-timeline" data-gif-timeline>\n        <div class="v2-gif-editor-range-summary">\n          <span data-gif-range-label></span>\n          <span data-gif-output-label></span>\n        </div>\n        <div class="v2-gif-editor-timeline-host" data-gif-timeline-host></div>\n      </div>\n      <div class="v2-annotate-toolbar v2-gif-editor-toolbar" data-gif-toolbar>\n        <button class="v2-annotate-btn icon-only act-cancel" type="button" data-gif-action="cancel" data-i18n-tooltip="videoGif.cancel" data-i18n-aria-label="videoGif.cancel">' +
    createIconMarkup('cancel') +
    '</button>\n        <div class="v2-annotate-divider"></div>\n        <button class="v2-annotate-btn icon-only" type="button" data-gif-action="play" data-i18n-tooltip="videoGif.play" data-i18n-aria-label="videoGif.play"><span data-gif-play-icon>' +
    createIconMarkup('play') +
    '</span><span data-gif-pause-icon hidden>' +
    createIconMarkup('pause') +
    '</span></button>\n        <button class="v2-annotate-btn" type="button" data-gif-action="size"></button>\n        <button class="v2-annotate-btn" type="button" data-gif-action="fps"></button>\n        <button class="v2-annotate-btn" type="button" data-gif-action="quality"></button>\n        <button class="v2-annotate-btn" type="button" role="switch" aria-checked="false" data-gif-action="limit-size" data-i18n="videoGif.limitSize">限制体积 ≤ 1MB（微信表情）</button>\n        <div class="v2-annotate-divider"></div>\n        <button class="v2-annotate-btn v2-annotate-save" type="button" data-gif-action="generate" aria-busy="false" aria-live="polite">\n          ' +
    GIF_ICON_SVG +
    '\n          <span data-gif-generate-label data-i18n="videoGif.generate">生成 GIF</span>\n        </button>\n      </div>\n    </div>\n  '
  );
}
const VIDEO_GIF_PREVIEW_TEMPLATE_ID = 'videoGifPreview',
  VIDEO_GIF_CONTROLS_TEMPLATE_ID = 'videoGifControls';
(registerStaticInnerHTML(VIDEO_GIF_PREVIEW_TEMPLATE_ID, createPreviewMarkup()),
  registerStaticInnerHTML(VIDEO_GIF_CONTROLS_TEMPLATE_ID, createControlsMarkup()));
const VideoGifController = {
  active: false,
  nodeId: '',
  limitSize: false,
  sourceUrl: '',
  sourceLocalPath: '',
  ensureLocalSource: null,
  wrapperEl: null,
  mediaCardEl: null,
  previewEl: null,
  barEl: null,
  canvasEl: null,
  videoEl: null,
  loadingEl: null,
  toolbarEl: null,
  trackEl: null,
  selectionEl: null,
  leftHandleEl: null,
  rightHandleEl: null,
  playheadEl: null,
  timelineLabelEl: null,
  thumbEls: null,
  rangeLabelEl: null,
  outputLabelEl: null,
  playButtonEl: null,
  sizeButtonEl: null,
  fpsButtonEl: null,
  qualityButtonEl: null,
  limitSizeButtonEl: null,
  generateButtonEl: null,
  durationSec: 0,
  startSec: 0,
  endSec: 0,
  sourceWidth: 0,
  sourceHeight: 0,
  sizeIndex: 0,
  fpsIndex: 0,
  qualityIndex: 1,
  _preferences: null,
  taskId: '',
  _raf: 0,
  _lastDrawAt: 0,
  _drawDirty: true,
  _sessionToken: 0,
  _exportToken: 0,
  _busy: false,
  _unsubscribeNode: null,
  _unsubscribeTask: null,
  _onKeyDown: null,
  _onResize: null,
  _retryRaf: 0,
  _retryCount: 0,
  _thumbToken: 0,
  _timelineDragMode: null,
  _timelineDragSnapshot: null,
  _onTimelinePointerMove: null,
  _onTimelinePointerUp: null,
  _hiddenEls: null,
  _boundEvents: [],
  init({
    nodeId: nodeId,
    sourceUrl: sourceUrl = '',
    sourceLocalPath: sourceLocalPath = '',
    ensureLocalSource: ensureLocalSource = null,
  } = {}) {
    const enabled = String(nodeId || '').trim(),
      enabled2 = appStore.getStateRaw().nodes?.[enabled];
    if (!enabled || !enabled2) return false;
    const mainVideoItem = getMainVideoItem(enabled2),
      enabled3 = String(
        sourceUrl ||
          mainVideoItem?.videoUrl ||
          mainVideoItem?.src ||
          enabled2.videoUrl ||
          enabled2.src ||
          '',
      ).trim(),
      enabled4 = String(sourceLocalPath || mainVideoItem?.localPath || enabled2.localPath || '').trim();
    if (!enabled3 && !enabled4) return (window.showToast?.(videoGifText('errors.noSource'), 'warn'), false);
    if (this.active) this.exit({ silent: true });
    return (
      (this.active = true),
      (this.nodeId = enabled),
      (this.sourceUrl = enabled3 || localPathToUrl(enabled4)),
      (this.sourceLocalPath = enabled4),
      (this.ensureLocalSource = typeof ensureLocalSource === 'function' ? ensureLocalSource : null),
      this._restorePreferences(),
      (this.durationSec = 0),
      (this.startSec = 0),
      (this.endSec = 0),
      (this.sourceWidth = 0),
      (this.sourceHeight = 0),
      (this.taskId = ''),
      (this._busy = false),
      (this._drawDirty = true),
      ++this._sessionToken,
      (this._retryCount = 0),
      (this._unsubscribeNode = appStore.subscribeSelector(
        (state2) => Boolean(state2.nodes?.[enabled]),
        (enabled5) => {
          !enabled5 && this.active && this.nodeId === enabled && this.exit({ silent: true });
        },
      )),
      this._mountWhenReady(),
      true
    );
  },
  _mountWhenReady() {
    const value2 = this.nodeId,
      value3 = () => {
        if (!this.active || this.nodeId !== value2) return;
        const enabled6 = document.getElementById(value2);
        if (!enabled6) {
          this._retryCount += 1;
          if (this._retryCount > 10) {
            this.exit({ silent: true });
            return;
          }
          this._retryRaf = requestAnimationFrame(value3);
          return;
        }
        ((this.wrapperEl = enabled6),
          this._applyFrozenUI(true),
          this._applyDimMode(true),
          this._createUI(),
          this._bindEvents(),
          this._startRenderLoop(),
          void this._attachSource(this._sessionToken));
      };
    this._retryRaf = requestAnimationFrame(value3);
  },
  _restorePreferences(value4) {
    let enabled7 = this._preferences;
    if (!enabled7)
      try {
        enabled7 = JSON.parse(
          (value4 || globalThis.localStorage)?.getItem(GIF_PREFERENCES_STORAGE_KEY) || 'null',
        );
      } catch {}
    const count3 = VIDEO_GIF_SETTINGS.sizes.indexOf(enabled7?.size),
      count4 = VIDEO_GIF_SETTINGS.fpsOptions.indexOf(enabled7?.fps),
      count5 = QUALITY_OPTIONS.indexOf(enabled7?.quality);
    ((this.sizeIndex = count3 >= 0 ? count3 : VIDEO_GIF_SETTINGS.defaultSizeIndex),
      (this.fpsIndex = count4 >= 0 ? count4 : VIDEO_GIF_SETTINGS.defaultFpsIndex),
      (this.qualityIndex = count5 >= 0 ? count5 : 1),
      (this.limitSize = enabled7?.limitSize === true));
  },
  _savePreferences(value5) {
    this._preferences = {
      size: VIDEO_GIF_SETTINGS.sizes[this.sizeIndex],
      fps: VIDEO_GIF_SETTINGS.fpsOptions[this.fpsIndex],
      quality: QUALITY_OPTIONS[this.qualityIndex],
      limitSize: this.limitSize,
    };
    try {
      (value5 || globalThis.localStorage)?.setItem(
        GIF_PREFERENCES_STORAGE_KEY,
        JSON.stringify(this._preferences),
      );
    } catch {}
  },
  _applyDimMode(value6) {
    const el = document.getElementById('v2-wrap');
    (el?.classList.toggle('is-video-gif-mode', value6),
      this.wrapperEl?.classList.toggle('is-video-gif-target', value6));
  },
  _applyFrozenUI(value7) {
    if (!this.wrapperEl) return;
    this.wrapperEl.classList.toggle('is-video-gif-editing', value7);
    if (value7) {
      if (Array.isArray(this._hiddenEls) && this._hiddenEls.length) return;
      const list = [];
      for (const value8 of [
        '.video-controls',
        '.video-mute-btn',
        '.node-upload-hint',
        '.video-center-indicator',
        '.gen-video-center-indicator',
        '.multi-toggle-btn',
      ]) {
        this.wrapperEl.querySelectorAll(value8).forEach((element) => {
          (list.push({ element: element, display: element.style.display }),
            (element.style.display = 'none'));
        });
      }
      this._hiddenEls = list;
      return;
    }
    for (const { element: element2, display: display } of this._hiddenEls || []) {
      if (element2?.isConnected) element2.style.display = display || '';
    }
    this._hiddenEls = null;
  },
  _getVideoEl() {
    return resolveNodeVideoElement(
      this.wrapperEl,
      appStore.getStateRaw().nodes?.[this.nodeId]?.mainVideoIndex,
    );
  },
  _createUI() {
    if (!this.wrapperEl) return;
    (this.wrapperEl.querySelectorAll('.v2-video-gifbar').forEach((el2) => el2.remove()),
      this.wrapperEl.querySelectorAll('.v2-gif-node-preview').forEach((el3) => el3.remove()),
      (this.videoEl = this._getVideoEl()),
      (this.mediaCardEl =
        this.videoEl?.closest('.video-card, .media-card, .node-card') ||
        this.wrapperEl.querySelector('.video-card, .media-card, .node-card') ||
        this.wrapperEl));
    const value9 = document.createElement('div');
    (setStaticInnerHTML(value9, VIDEO_GIF_PREVIEW_TEMPLATE_ID),
      (this.previewEl = value9.firstElementChild),
      this.mediaCardEl.appendChild(this.previewEl));
    const value10 = document.createElement('div');
    (setStaticInnerHTML(value10, VIDEO_GIF_CONTROLS_TEMPLATE_ID),
      (this.barEl = value10.firstElementChild),
      this.wrapperEl.appendChild(this.barEl),
      applyI18n(this.previewEl),
      applyI18n(this.barEl),
      this.barEl.setAttribute('aria-label', videoGifText('choosePreset')),
      (this.canvasEl = this.previewEl.querySelector('[data-gif-canvas]')),
      (this.loadingEl = this.previewEl.querySelector('[data-gif-loading]')),
      (this.toolbarEl = this.barEl.querySelector('[data-gif-toolbar]')),
      (this.rangeLabelEl = this.barEl.querySelector('[data-gif-range-label]')),
      (this.outputLabelEl = this.barEl.querySelector('[data-gif-output-label]')));
    const videoRangeTimelineView = createVideoRangeTimelineView({ documentRef: document });
    (this.barEl
      .querySelector('[data-gif-timeline-host]')
      ?.appendChild(videoRangeTimelineView.trackEl),
      (this.trackEl = videoRangeTimelineView.trackEl),
      (this.trackEl.tabIndex = -1),
      (this.selectionEl = videoRangeTimelineView.selectionEl),
      (this.leftHandleEl = videoRangeTimelineView.leftHandleEl),
      (this.rightHandleEl = videoRangeTimelineView.rightHandleEl),
      (this.playheadEl = videoRangeTimelineView.playheadEl),
      (this.timelineLabelEl = videoRangeTimelineView.labelEl),
      (this.thumbEls = videoRangeTimelineView.thumbEls),
      (this.playButtonEl = this.barEl.querySelector('[data-gif-action="play"]')),
      (this.sizeButtonEl = this.barEl.querySelector('[data-gif-action="size"]')),
      (this.fpsButtonEl = this.barEl.querySelector('[data-gif-action="fps"]')),
      (this.qualityButtonEl = this.barEl.querySelector('[data-gif-action="quality"]')),
      (this.limitSizeButtonEl = this.barEl.querySelector('[data-gif-action="limit-size"]')),
      (this.generateButtonEl = this.barEl.querySelector('[data-gif-action="generate"]')),
      this._updateControls(),
      this._updateBarViewportOffset(),
      void this._renderTimelineThumbnails(this._sessionToken));
  },
  _listen(el4, value11, value12, value13) {
    (el4?.addEventListener?.(value11, value12, value13),
      this._boundEvents.push(() => el4?.removeEventListener?.(value11, value12, value13)));
  },
  _bindEvents() {
    (this._listen(this.barEl, 'pointerdown', (event) => event.stopPropagation()),
      this._listen(this.barEl, 'dblclick', (event2) => {
        (event2.preventDefault(), event2.stopPropagation());
      }),
      this._listen(this.barEl?.querySelector('[data-gif-action="cancel"]'), 'click', () =>
        this.exit(),
      ),
      this._listen(this.playButtonEl, 'click', () => void this._togglePlayback()),
      this._listen(this.sizeButtonEl, 'click', () => {
        const list2 = VIDEO_GIF_SETTINGS.sizes;
        ((this.sizeIndex = (this.sizeIndex + 1) % list2.length),
          this._savePreferences(),
          this._resizeCanvas(),
          this._updateControls());
      }),
      this._listen(this.fpsButtonEl, 'click', () => {
        const list3 = VIDEO_GIF_SETTINGS.fpsOptions;
        ((this.fpsIndex = (this.fpsIndex + 1) % list3.length),
          this._savePreferences(),
          (this._lastDrawAt = 0),
          (this._drawDirty = true),
          this._updateControls());
      }),
      this._listen(this.qualityButtonEl, 'click', () => {
        ((this.qualityIndex = (this.qualityIndex + 1) % QUALITY_OPTIONS.length),
          this._savePreferences(),
          this._updateControls());
      }),
      this._listen(this.limitSizeButtonEl, 'click', () => {
        if (this._busy) return;
        ((this.limitSize = !this.limitSize), this._savePreferences(), this._updateControls());
      }),
      this._listen(this.generateButtonEl, 'click', () => void this._generate()),
      this._bindTimelineEvents(),
      this._listen(this.videoEl, 'loadedmetadata', () => this._handleMetadata()),
      this._listen(this.videoEl, 'loadeddata', () => {
        (this.loadingEl?.setAttribute('hidden', ''),
          (this._drawDirty = true),
          this._drawFrame());
      }),
      this._listen(this.videoEl, 'seeked', () => {
        ((this._drawDirty = true), this._drawFrame());
      }),
      this._listen(this.videoEl, 'play', () => this._updatePlayButton()),
      this._listen(this.videoEl, 'pause', () => this._updatePlayButton()),
      (this._onKeyDown = (event3) => {
        if (!this.active || event3.isComposing) return;
        const value14 = String(event3.target?.tagName || '').toLowerCase(),
          enabled8 =
            value14 === 'button' ||
            value14 === 'input' ||
            value14 === 'select' ||
            value14 === 'textarea' ||
            value14 === 'a' ||
            event3.target?.isContentEditable;
        if (event3.key === 'Escape') (event3.preventDefault(), this.exit());
        else {
          if ((event3.key === ' ' || event3.code === 'Space') && !enabled8) {
            (event3.preventDefault(), event3.stopPropagation(), releaseCanvasPanShortcut());
            if (!event3.repeat) void this._togglePlayback();
          } else
            event3.key === 'Enter' &&
              !enabled8 &&
              !this._busy &&
              (event3.preventDefault(), void this._generate());
        }
      }),
      window.addEventListener('keydown', this._onKeyDown, true),
      (this._onResize = () => this._updatePreviewLayout()),
      window.addEventListener('resize', this._onResize, true));
  },
  async _attachSource(value15) {
    const enabled9 = this.videoEl,
      enabled10 = this.sourceUrl || localPathToUrl(this.sourceLocalPath);
    if (!enabled9 || !enabled10) return;
    try {
      const enabled11 = String(enabled9.currentSrc || enabled9.getAttribute('src') || '').trim();
      !enabled11 &&
        (await attachDesktopMediaPlaybackSource(enabled9, enabled10, {
          preload: 'auto',
          shouldAssign: () => this.active && this._sessionToken === value15,
        }));
      if (!this.active || this._sessionToken !== value15) return;
      if (enabled9.readyState >= 1) this._handleMetadata();
    } catch (error2) {
      if (!this.active || this._sessionToken !== value15) return;
      (this.loadingEl?.setAttribute('hidden', ''),
        window.showToast?.(
          videoGifText('errors.previewFailed', {
            error: error2 instanceof Error ? error2.message : String(error2 || ''),
          }),
          'error',
        ),
        this.exit({ silent: true }));
    }
  },
  _handleMetadata() {
    if (!this.active || !this.videoEl) return;
    const count6 = Number(this.videoEl.duration) || 0;
    if (!(count6 > 0)) return;
    if (this.durationSec > 0) return;
    ((this.durationSec = count6),
      (this.sourceWidth = Number(this.videoEl.videoWidth) || 0),
      (this.sourceHeight = Number(this.videoEl.videoHeight) || 0),
      (this.startSec = 0),
      (this.endSec = Math.min(count6, VIDEO_GIF_SETTINGS.defaultDurationSec)),
      this._resizeCanvas(),
      this._updateControls(),
      this.loadingEl?.setAttribute('hidden', ''));
    try {
      this.videoEl.currentTime = 0;
    } catch {}
    this._drawDirty = true;
  },
  _getSettings() {
    const fps = VIDEO_GIF_SETTINGS,
      size2 = fps.sizes[this.sizeIndex] || fps.sizes[0],
      width3 = resolveVideoGifOutputSize({
        size: size2,
        sourceWidth: this.sourceWidth,
        sourceHeight: this.sourceHeight,
      });
    return {
      preset: this.limitSize ? 'wechat' : 'hd',
      size: size2,
      width: width3.width,
      height: width3.height,
      sourceWidth: this.sourceWidth,
      sourceHeight: this.sourceHeight,
      fps: fps.fpsOptions[this.fpsIndex] || fps.fpsOptions[0],
      quality: QUALITY_OPTIONS[this.qualityIndex] || 'balanced',
      targetBytes: this.limitSize ? fps.targetBytes : 0,
      start: this.startSec,
      end: this.endSec,
    };
  },
  _resizeCanvas() {
    const box = this._getSettings();
    if (!this.canvasEl) return;
    if (this.canvasEl.width !== box.width) this.canvasEl.width = box.width;
    if (this.canvasEl.height !== box.height) this.canvasEl.height = box.height;
    ((this.canvasEl.style.aspectRatio = box.width + ' / ' + box.height),
      (this._drawDirty = true),
      this._updatePreviewLayout(),
      this._drawFrame());
  },
  _updatePreviewLayout() {
    if (!this.canvasEl || !this.mediaCardEl) return;
    const box2 = this._getSettings(),
      value16 = Math.max(1, this.mediaCardEl.clientWidth || 1),
      value17 = Math.max(1, this.mediaCardEl.clientHeight || 1),
      value18 = Math.min(value16 / box2.width, value17 / box2.height);
    ((this.canvasEl.style.width = Math.max(1, Math.round(box2.width * value18)) + 'px'),
      (this.canvasEl.style.height =
        Math.max(1, Math.round(box2.height * value18)) + 'px'),
      this._updateBarViewportOffset());
  },
  _updateBarViewportOffset() {
    if (!this.barEl) return;
    this.barEl.style.left = '';
    const box3 = this.barEl.getBoundingClientRect(),
      count7 = Math.max(0, Number(window.innerWidth) || 0);
    if (!(box3.width > 0) || !(count7 > 0)) return;
    const value19 = Math.min(
      GIF_EDITOR_VIEWPORT_MARGIN_PX,
      Math.max(0, (count7 - box3.width) / 2),
    );
    let value20 = 0;
    if (box3.left < value19) value20 = value19 - box3.left;
    else box3.right > count7 - value19 && (value20 = count7 - value19 - box3.right);
    if (Math.abs(value20) < 0.5) return;
    const value21 = Math.max(0.0001, Number(appStore.getStateRaw().viewport?.zoom) || 1);
    this.barEl.style.left = 'calc(50% + ' + value20 / value21 + 'px)';
  },
  async _renderTimelineThumbnails(value22) {
    const value23 = ++this._thumbToken,
      thumbs = Array.isArray(this.thumbEls) ? this.thumbEls : [];
    if (!thumbs.length) return;
    const value24 = appStore.getStateRaw().nodes?.[this.nodeId] || {},
      renderVideoTimelineThumbnails2 = await renderVideoTimelineThumbnails({
        src: this.sourceUrl || localPathToUrl(this.sourceLocalPath),
        posterUrl:
          String(this.videoEl?.poster || '').trim() ||
          resolveCanvasVideoPosterUrl(getMainVideoItem(value24) || value24) ||
          resolveCanvasVideoPosterUrl(value24),
        thumbs: thumbs,
        isCurrent: () =>
          this.active && this._sessionToken === value22 && this._thumbToken === value23,
      });
    if (!this.active || this._sessionToken !== value22 || this._thumbToken !== value23) return;
    this.trackEl?.dataset &&
      (this.trackEl.dataset.thumbnailState = renderVideoTimelineThumbnails2.source);
  },
  _bindTimelineEvents() {
    (this._listen(this.trackEl, 'pointermove', (event4) => {
      if (this._timelineDragMode || this._busy || !this.selectionEl) return;
      const box4 = this.selectionEl.getBoundingClientRect(),
        value25 = Math.abs(event4.clientX - box4.left) < 20,
        value26 = Math.abs(event4.clientX - box4.right) < 20;
      (this.leftHandleEl?.classList.toggle('hover-active', value25),
        this.rightHandleEl?.classList.toggle('hover-active', value26),
        (this.selectionEl.style.cursor =
          value25 || value26 ? 'var(--resize-ew-cursor)' : 'var(--grab-cursor)'));
    }),
      this._listen(this.trackEl, 'pointerleave', () => {
        if (this._timelineDragMode) return;
        (this.leftHandleEl?.classList.remove('hover-active'),
          this.rightHandleEl?.classList.remove('hover-active'));
        if (this.selectionEl) this.selectionEl.style.cursor = '';
      }),
      this._listen(this.trackEl, 'pointerdown', (event5) => {
        if (this._busy || !(this.durationSec > 0) || !this.selectionEl) return;
        this.trackEl.focus({ preventScroll: true });
        const box5 = this.trackEl.getBoundingClientRect(),
          box6 = this.selectionEl.getBoundingClientRect();
        if (!box5.width) return;
        const value27 = Math.abs(event5.clientX - box6.left) < 20,
          value28 = Math.abs(event5.clientX - box6.right) < 20,
          value29 = event5.clientX >= box6.left && event5.clientX <= box6.right;
        ((this._timelineDragMode = value27 ? 'left' : value28 ? 'right' : value29 ? 'move' : 'scrub'),
          (this._timelineDragSnapshot = {
            clientX: Number(event5.clientX) || 0,
            startSec: this.startSec,
            endSec: this.endSec,
          }),
          this.leftHandleEl?.classList.toggle('hover-active', this._timelineDragMode === 'left'),
          this.rightHandleEl?.classList.toggle(
            'hover-active',
            this._timelineDragMode === 'right',
          ),
          event5.preventDefault(),
          event5.stopPropagation());
        const value30 = Number(event5.clientX) || 0;
        let enabled12 = false;
        if (this._timelineDragMode === 'scrub') this._seekTimelineAtClientX(event5.clientX);
        else this._timelineDragMode !== 'move' && this._updateTimelineRangeAtClientX(event5.clientX);
        (this._removeTimelineDragListeners(),
          (this._onTimelinePointerMove = (event6) => {
            if (!this.active || !this._timelineDragMode) return;
            (event6.preventDefault(), event6.stopPropagation());
            if (this._timelineDragMode === 'scrub') this._seekTimelineAtClientX(event6.clientX);
            else {
              if (this._timelineDragMode === 'move') {
                if (!enabled12 && Math.abs(event6.clientX - value30) <= 2) return;
                enabled12 = true;
              }
              this._updateTimelineRangeAtClientX(event6.clientX);
            }
          }),
          (this._onTimelinePointerUp = (event7) => {
            (event7.preventDefault(), event7.stopPropagation());
            const value31 = this._timelineDragMode === 'move' && !enabled12,
              value32 = Number.isFinite(Number(event7.clientX)) ? Number(event7.clientX) : value30;
            this._finishTimelineDrag();
            if (value31) this._seekTimelineAtClientX(value32);
          }),
          window.addEventListener('pointermove', this._onTimelinePointerMove, true),
          window.addEventListener('pointerup', this._onTimelinePointerUp, true));
      }));
  },
  _removeTimelineDragListeners() {
    (this._onTimelinePointerMove &&
      window.removeEventListener('pointermove', this._onTimelinePointerMove, true),
      this._onTimelinePointerUp &&
        window.removeEventListener('pointerup', this._onTimelinePointerUp, true),
      (this._onTimelinePointerMove = null),
      (this._onTimelinePointerUp = null));
  },
  _finishTimelineDrag() {
    (this._removeTimelineDragListeners(),
      (this._timelineDragMode = null),
      (this._timelineDragSnapshot = null),
      this.leftHandleEl?.classList.remove('hover-active'),
      this.rightHandleEl?.classList.remove('hover-active'));
    if (this.selectionEl) this.selectionEl.style.cursor = '';
  },
  _seekTimelineAtClientX(value33) {
    if (!this.trackEl || !(this.durationSec > 0) || !this.videoEl) return;
    const box7 = this.trackEl.getBoundingClientRect();
    if (!box7.width) return;
    const clamp2 = clamp((value33 - box7.left) / box7.width, 0, 1),
      value34 = Math.min(Math.max(0, this.durationSec - 0.001), clamp2 * this.durationSec);
    try {
      (this.videoEl.pause(), (this.videoEl.currentTime = value34));
    } catch {}
    ((this._drawDirty = true), this._renderTimeline());
  },
  _updateTimelineRangeAtClientX(value35) {
    if (!this.trackEl || !(this.durationSec > 0)) return;
    const box8 = this.trackEl.getBoundingClientRect(),
      event8 = this._timelineDragSnapshot;
    if (!box8.width || !event8) return;
    const value36 = Math.min(GIF_EDITOR_MIN_RANGE_SEC, this.durationSec),
      clamp3 = clamp((value35 - box8.left) / box8.width, 0, 1),
      value37 = clamp3 * this.durationSec;
    if (this._timelineDragMode === 'left')
      this.startSec = roundTime(clamp(value37, 0, Math.max(0, this.endSec - value36)));
    else {
      if (this._timelineDragMode === 'right')
        this.endSec = roundTime(clamp(value37, this.startSec + value36, this.durationSec));
      else {
        if (this._timelineDragMode === 'move') {
          const value38 = event8.endSec - event8.startSec,
            value39 = ((Number(value35) - event8.clientX) / box8.width) * this.durationSec;
          ((this.startSec = roundTime(
            clamp(event8.startSec + value39, 0, Math.max(0, this.durationSec - value38)),
          )),
            (this.endSec = roundTime(this.startSec + value38)));
        }
      }
    }
    try {
      (this.videoEl?.pause?.(),
        this.videoEl &&
          (this.videoEl.currentTime =
            this._timelineDragMode === 'right'
              ? Math.max(this.startSec, this.endSec - 0.04)
              : this.startSec));
    } catch {}
    ((this._drawDirty = true), this._updateControls());
  },
  _renderTimeline() {
    if (!this.trackEl || !this.selectionEl || !this.leftHandleEl || !this.rightHandleEl) return;
    const count8 = this.durationSec,
      value40 = Number.isFinite(count8) && count8 > 0,
      value41 = value40 ? clamp(this.startSec, 0, count8) : 0,
      value42 = value40 ? clamp(this.endSec, value41, count8) : 0,
      value43 = Math.max(0, value42 - value41),
      value44 = value40 ? (value41 / count8) * 100 : 0,
      value45 = value40 ? (value43 / count8) * 100 : 0;
    ((this.selectionEl.style.left = value44 + '%'),
      (this.selectionEl.style.width = value45 + '%'),
      (this.leftHandleEl.style.left = value44 + '%'),
      (this.rightHandleEl.style.left = value44 + value45 + '%'),
      this.timelineLabelEl &&
        ((this.timelineLabelEl.textContent = value40
          ? value43.toFixed(2) + 's'
          : videoGifText('loadingPreview')),
        (this.timelineLabelEl.style.left = value44 + value45 / 2 + '%')),
      this._renderTimelinePlayhead());
  },
  _renderTimelinePlayhead() {
    if (!this.playheadEl || !this.videoEl || !(this.durationSec > 0)) {
      if (this.playheadEl) this.playheadEl.style.display = 'none';
      return;
    }
    const clamp4 = clamp((Number(this.videoEl.currentTime) || 0) / this.durationSec, 0, 1);
    ((this.playheadEl.style.display = 'block'),
      (this.playheadEl.style.left = clamp4 * 100 + '%'));
  },
  async _togglePlayback() {
    const enabled13 = this.videoEl;
    if (!this.active || !enabled13 || !(this.durationSec > 0)) return;
    if (!enabled13.paused) {
      enabled13.pause();
      return;
    }
    ((enabled13.currentTime < this.startSec || enabled13.currentTime >= this.endSec - 0.02) &&
      (enabled13.currentTime = this.startSec),
      await playVideoWithRecovery(enabled13, {
        label: 'video-gif:' + this.nodeId,
        sourceUrl: this.sourceUrl,
      }));
  },
  _updatePlayButton() {
    if (!this.playButtonEl || !this.videoEl) return;
    const enabled14 = !this.videoEl.paused,
      el5 = this.playButtonEl.querySelector('[data-gif-play-icon]'),
      el6 = this.playButtonEl.querySelector('[data-gif-pause-icon]');
    if (el5) el5.hidden = enabled14;
    if (el6) el6.hidden = !enabled14;
    const videoGifText2 = videoGifText(enabled14 ? 'pause' : 'play');
    ((this.playButtonEl.dataset.tooltip = videoGifText2),
      this.playButtonEl.setAttribute('aria-label', videoGifText2),
      this.playButtonEl.classList.toggle('active', enabled14));
  },
  _startRenderLoop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    const value46 = (value47) => {
      if (!this.active) return;
      const value48 = this._getSettings(),
        value49 = 1000 / Math.max(1, value48.fps),
        enabled15 = this.videoEl;
      if (enabled15 && !enabled15.paused && enabled15.currentTime >= this.endSec - 0.015)
        try {
          enabled15.currentTime = this.startSec;
        } catch {}
      (this._renderTimelinePlayhead(),
        (this._drawDirty || value47 - this._lastDrawAt >= value49) &&
          (this._drawFrame(), (this._lastDrawAt = value47)),
        (this._raf = requestAnimationFrame(value46)));
    };
    this._raf = requestAnimationFrame(value46);
  },
  _drawFrame() {
    const el7 = this.canvasEl,
      sourceWidth3 = this.videoEl;
    if (
      !el7 ||
      !sourceWidth3 ||
      sourceWidth3.readyState < 2 ||
      !sourceWidth3.videoWidth ||
      !sourceWidth3.videoHeight
    )
      return;
    const ctx = el7.getContext('2d');
    if (!ctx) return;
    const targetWidth2 = this._getSettings(),
      box9 = resolveVideoGifDrawRect({
        sourceWidth: sourceWidth3.videoWidth,
        sourceHeight: sourceWidth3.videoHeight,
        targetWidth: targetWidth2.width,
        targetHeight: targetWidth2.height,
        fit: 'contain',
      });
    (ctx.clearRect(0, 0, targetWidth2.width, targetWidth2.height),
      (ctx.imageSmoothingEnabled = true),
      (ctx.imageSmoothingQuality = 'high'),
      ctx.drawImage(sourceWidth3, box9.x, box9.y, box9.width, box9.height),
      (this._drawDirty = false));
  },
  _updateControls() {
    const size3 = this._getSettings();
    this.sizeButtonEl &&
      (this.sizeButtonEl.textContent = videoGifText('longEdge', { size: size3.size }));
    if (this.fpsButtonEl) this.fpsButtonEl.textContent = size3.fps + ' FPS';
    this.qualityButtonEl &&
      (this.qualityButtonEl.textContent = videoGifText('quality.' + size3.quality));
    this.limitSizeButtonEl &&
      (this.limitSizeButtonEl.setAttribute('aria-checked', String(this.limitSize)),
      this.limitSizeButtonEl.classList.toggle('active', this.limitSize));
    const duration = Math.max(0, this.endSec - this.startSec);
    (this.rangeLabelEl &&
      (this.rangeLabelEl.textContent = videoGifText('rangeSummary', {
        start: formatTime(this.startSec),
        end: formatTime(this.endSec),
        duration: duration.toFixed(1),
      })),
      this.outputLabelEl &&
        (this.outputLabelEl.textContent =
          size3.targetBytes > 0
            ? videoGifText('wechatTarget', { size: formatVideoGifFileSize(size3.targetBytes) })
            : videoGifText('unlimitedOutput')),
      this._renderTimeline(),
      this._updatePlayButton());
  },
  _setGenerateButtonLabel(value50 = '') {
    if (!this.generateButtonEl) return;
    const value51 = String(value50 || '').trim() || videoGifText('generate'),
      el8 = this.generateButtonEl.querySelector('[data-gif-generate-label]');
    if (el8) el8.textContent = value51;
    this.generateButtonEl.setAttribute('aria-label', value51);
  },
  _setBusy(value52, value53 = '') {
    ((this._busy = value52 === true), this.barEl?.setAttribute('aria-busy', String(this._busy)));
    this.generateButtonEl &&
      ((this.generateButtonEl.disabled = this._busy),
      (this.generateButtonEl.dataset.loading = String(this._busy)),
      this.generateButtonEl.setAttribute('aria-busy', String(this._busy)),
      this.generateButtonEl
        .querySelector('svg')
        ?.classList.toggle('v2-spinning', this._busy));
    for (const el9 of [
      this.sizeButtonEl,
      this.fpsButtonEl,
      this.qualityButtonEl,
      this.limitSizeButtonEl,
    ]) {
      if (el9) el9.disabled = this._busy;
    }
    (this.trackEl?.setAttribute('aria-disabled', String(this._busy)),
      this._setGenerateButtonLabel(
        this._busy ? value53 || videoGifText('encoding') : videoGifText('generate'),
      ));
  },
  async _resolveLocalSource() {
    if (this.sourceLocalPath) return this.sourceLocalPath;
    if (!this.ensureLocalSource) throw new Error(videoGifText('errors.localSourceRequired'));
    const enabled16 = String((await this.ensureLocalSource(this.sourceUrl)) || '').trim();
    if (!enabled16) throw new Error(videoGifText('errors.localSourceRequired'));
    return ((this.sourceLocalPath = enabled16), enabled16);
  },
  _subscribeTaskProgress(value54, value55) {
    (this._unsubscribeTask?.(),
      (this._unsubscribeTask = desktopBridge.mediaTask.onUpdate((value56) => {
        if (!this.active || this._exportToken !== value55) return;
        if (String(value56?.taskId || '') !== value54) return;
        this._setGenerateButtonLabel(
          value56?.stage === 'optimize' ? videoGifText('optimizing') : videoGifText('encoding'),
        );
      })));
  },
  async _generate() {
    if (!this.active || this._busy || !(this.endSec > this.startSec)) return;
    const enabled17 = appStore.getStateRaw().nodes?.[this.nodeId];
    if (!enabled17) {
      this.exit({ silent: true });
      return;
    }
    const value57 = ++this._exportToken;
    this._setBusy(true, videoGifText('preparing'));
    try {
      const src = await this._resolveLocalSource();
      if (!this.active || value57 !== this._exportToken) return;
      const args = this._getSettings(),
        enqueueElectronMediaTask2 = await enqueueElectronMediaTask({
          kind: 'videoToGif',
          nodeId: this.nodeId,
          src: src,
          args: args,
          cancellable: true,
        }),
        enabled18 = String(enqueueElectronMediaTask2?.taskId || '').trim();
      if (!enabled18) throw new Error(videoGifText('errors.taskUnavailable'));
      ((this.taskId = enabled18), this._subscribeTaskProgress(enabled18, value57));
      const waitForElectronMediaTask2 = await waitForElectronMediaTask(enabled18, {
        timeout: 10 * 60 * 1000,
        diagnosticPayload: { kind: 'videoToGif', nodeId: this.nodeId, src: src },
      });
      if (!this.active || value57 !== this._exportToken) return;
      await this._createResultNode(enabled17, waitForElectronMediaTask2);
      const size4 = formatVideoGifFileSize(waitForElectronMediaTask2.fileSize);
      (this.exit({ silent: true, keepTask: true }),
        waitForElectronMediaTask2.targetExceeded
          ? window.showToast?.(videoGifText('completedOverTarget', { size: size4 }), 'warn')
          : window.showToast?.(videoGifText('completed', { size: size4 }), 'success'));
    } catch (error3) {
      if (!this.active || value57 !== this._exportToken) return;
      const error4 = error3 instanceof Error ? error3.message : String(error3 || '');
      ((this.taskId = ''),
        this._unsubscribeTask?.(),
        (this._unsubscribeTask = null),
        this._setBusy(false),
        this._updateControls(),
        window.showToast?.(videoGifText('errors.generateFailed', { error: error4 }), 'error'));
    }
  },
  async _createResultNode(value58, imageUrl = {}) {
    const localPath = pickResultLocalPath(imageUrl);
    if (!localPath) throw new Error(videoGifText('errors.incompleteResult'));
    const naturalWidth = Math.max(1, Number(imageUrl.imageWidth) || 1),
      naturalHeight = Math.max(1, Number(imageUrl.imageHeight) || 1),
      box10 = getAutoMediaSizeByShortSide(naturalWidth, naturalHeight),
      x = calcSafeSpawnPosNearNode(
        appStore.getStateRaw().nodes,
        value58,
        box10.width,
        box10.height,
      ),
      fileName = getResultFilename(imageUrl),
      src2 = buildCanvasLocalImageFields(
        {
          ...imageUrl,
          localPath: localPath,
          originalLocalPath: localPath,
          imageUrl: imageUrl.url || localPathToUrl(localPath),
          sourceUrl: imageUrl.url || localPathToUrl(localPath),
          fileName: fileName,
        },
        { includeSrc: true },
      ),
      id = generateId('source-image-gif');
    return (
      appStore.addNode(
        buildSourceMediaNodePayload({
          id: id,
          type: 'source-image',
          x: x.x,
          y: x.y,
          naturalWidth: naturalWidth,
          naturalHeight: naturalHeight,
          name: videoGifText('resultName', { name: getSourceName(value58) }),
          ...src2,
          src: src2.src || imageUrl.url || localPathToUrl(localPath),
          localPath: localPath,
          fileName: fileName,
          mimeType: 'image/gif',
          gifPreset: imageUrl.preset || this._getSettings().preset,
          gifFps: Number(imageUrl.fps) || 0,
          gifMaxColors: Number(imageUrl.maxColors) || 0,
          gifDuration: Number(imageUrl.duration) || 0,
          gifFileSize: Number(imageUrl.fileSize) || 0,
          needsAutoResize: false,
          fixedSize: true,
        }),
      ),
      appStore.setSelectedNodes([id]),
      commit(),
      window.v2Renderer?.flushNode?.(id),
      await window._triggerLocalCacheSave?.(),
      id
    );
  },
  exit({ silent: silent = false, keepTask: keepTask = false } = {}) {
    if (!this.active) return;
    const value59 = this.taskId,
      value60 = this._busy;
    ((this.active = false), (this._sessionToken += 1), (this._exportToken += 1));
    if (!keepTask && value59) void cancelElectronMediaTask(value59);
    ((this.taskId = ''),
      this._unsubscribeTask?.(),
      (this._unsubscribeTask = null),
      this._unsubscribeNode?.(),
      (this._unsubscribeNode = null),
      this._finishTimelineDrag(),
      (this._thumbToken += 1));
    for (const run of this._boundEvents.splice(0)) run();
    if (this._onKeyDown) window.removeEventListener('keydown', this._onKeyDown, true);
    if (this._onResize) window.removeEventListener('resize', this._onResize, true);
    ((this._onKeyDown = null), (this._onResize = null));
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
    if (this._retryRaf) cancelAnimationFrame(this._retryRaf);
    this._retryRaf = 0;
    try {
      this.videoEl?.pause?.();
    } catch {}
    (this.previewEl?.remove(),
      this.barEl?.remove(),
      this._applyFrozenUI(false),
      this._applyDimMode(false));
    if (!silent && value60) window.showToast?.(videoGifText('cancelled'), 'info');
    ((this.nodeId = ''),
      (this.sourceUrl = ''),
      (this.sourceLocalPath = ''),
      (this.ensureLocalSource = null),
      (this.wrapperEl = null),
      (this.mediaCardEl = null),
      (this.previewEl = null),
      (this.barEl = null),
      (this.canvasEl = null),
      (this.videoEl = null),
      (this.loadingEl = null),
      (this.toolbarEl = null),
      (this.trackEl = null),
      (this.selectionEl = null),
      (this.leftHandleEl = null),
      (this.rightHandleEl = null),
      (this.playheadEl = null),
      (this.timelineLabelEl = null),
      (this.thumbEls = null),
      (this.rangeLabelEl = null),
      (this.outputLabelEl = null),
      (this.playButtonEl = null),
      (this.sizeButtonEl = null),
      (this.fpsButtonEl = null),
      (this.qualityButtonEl = null),
      (this.limitSizeButtonEl = null),
      (this.generateButtonEl = null),
      (this._busy = false));
  },
};
export default VideoGifController;

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
export const VIDEO_GIF_SETTINGS = Object['freeze']({
  sizes: Object['freeze']([0x1e0, 0x2d0, 0x438]),
  defaultSizeIndex: 0x1,
  fpsOptions: Object['freeze']([0x8, 0xa, 0xc, 0xf, 0x14, 0x18]),
  defaultFpsIndex: 0x4,
  defaultDurationSec: 0x8,
  targetBytes: 0x400 * 0x400,
});
const QUALITY_OPTIONS = Object['freeze'](['compact', 'balanced', 'high']),
  GIF_PREFERENCES_STORAGE_KEY = 'v2-video-gif-preferences',
  GIF_EDITOR_MIN_RANGE_SEC = 0.1,
  GIF_EDITOR_VIEWPORT_MARGIN_PX = 0xc;
function videoGifText(_0x89868, _0x331322 = {}) {
  return t('videoGif.' + _0x89868, _0x331322);
}
function clamp(_0x597a4f, _0x5d2843, _0x37a17b) {
  return Math['max'](_0x5d2843, Math['min'](_0x37a17b, Number(_0x597a4f) || 0x0));
}
function roundTime(_0x312f94) {
  return Math['round']((Number(_0x312f94) || 0x0) * 0x64) / 0x64;
}
function formatTime(_0x6b0a9d) {
  const _0x510731 = Math['max'](0x0, Number(_0x6b0a9d) || 0x0),
    _0xf3ba9 = Math['floor'](_0x510731 / 0x3c);
  return _0xf3ba9 + ':' + (_0x510731 % 0x3c)['toFixed'](0x1)['padStart'](0x4, '0');
}
export function formatVideoGifFileSize(_0x54f694) {
  const _0x44c5b9 = Math['max'](0x0, Number(_0x54f694) || 0x0);
  if (_0x44c5b9 < 0x400) return Math['round'](_0x44c5b9) + '\x20B';
  if (_0x44c5b9 < 0x400 * 0x400) return Math['round'](_0x44c5b9 / 0x400) + ' KB';
  return (_0x44c5b9 / (0x400 * 0x400))['toFixed'](0x1) + ' MB';
}
export function resolveVideoGifOutputSize({
  size: size = 0xf0,
  sourceWidth: sourceWidth = 0x0,
  sourceHeight: sourceHeight = 0x0,
} = {}) {
  const _0x5690b6 = Math['max'](0x40, Math['round'](Number(size) || 0xf0));
  if (!(sourceWidth > 0x0) || !(sourceHeight > 0x0)) return { width: _0x5690b6, height: _0x5690b6 };
  const _0x50a1cb = sourceWidth / sourceHeight;
  if (_0x50a1cb >= 0x1)
    return { width: _0x5690b6, height: Math['max'](0x1, Math['round'](_0x5690b6 / _0x50a1cb)) };
  return { width: Math['max'](0x1, Math['round'](_0x5690b6 * _0x50a1cb)), height: _0x5690b6 };
}
export function resolveVideoGifDrawRect({
  sourceWidth: _0x1c186c,
  sourceHeight: _0x481e,
  targetWidth: _0x16573d,
  targetHeight: _0x282613,
  fit: fit = 'contain',
} = {}) {
  const _0x378ea0 = Math['max'](0x1, Number(_0x1c186c) || 0x1),
    _0x4aeb94 = Math['max'](0x1, Number(_0x481e) || 0x1),
    _0x47af78 = Math['max'](0x1, Number(_0x16573d) || 0x1),
    _0x381620 = Math['max'](0x1, Number(_0x282613) || 0x1),
    _0x24f5a1 =
      fit === 'cover'
        ? Math['max'](_0x47af78 / _0x378ea0, _0x381620 / _0x4aeb94)
        : Math['min'](_0x47af78 / _0x378ea0, _0x381620 / _0x4aeb94),
    _0x4e1020 = _0x378ea0 * _0x24f5a1,
    _0x55cace = _0x4aeb94 * _0x24f5a1;
  return {
    x: (_0x47af78 - _0x4e1020) / 0x2,
    y: (_0x381620 - _0x55cace) / 0x2,
    width: _0x4e1020,
    height: _0x55cace,
  };
}
function getMainVideoItem(_0x28aa4b = {}) {
  const _0x3a926d = Array['isArray'](_0x28aa4b['videos']) ? _0x28aa4b['videos'] : [],
    _0x4ab1e8 = Number['isFinite'](Number(_0x28aa4b['mainVideoIndex']))
      ? Math['max'](0x0, Math['trunc'](Number(_0x28aa4b['mainVideoIndex'])))
      : 0x0;
  return _0x3a926d[_0x4ab1e8] || _0x3a926d[0x0] || null;
}
function getSourceName(_0x49f43d = {}) {
  return String(_0x49f43d['name'] || '')['trim']() || videoGifText('fallbackVideoName');
}
function getResultFilename(_0x56ea95 = {}) {
  const _0xeabcf2 = String(_0x56ea95['filename'] || _0x56ea95['fileName'] || '')['trim']();
  if (_0xeabcf2) return _0xeabcf2;
  const _0x1f0135 = String(pickResultLocalPath(_0x56ea95) || '')['replace'](/\\/g, '/');
  return _0x1f0135['split']('/')['filter'](Boolean)['pop']() || 'video-' + Date['now']() + '.gif';
}
function createIconMarkup(_0x1cbe96) {
  if (_0x1cbe96 === 'play')
    return '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>';
  if (_0x1cbe96 === 'pause')
    return '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22currentColor\x22\x20width=\x2218\x22\x20height=\x2218\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M7\x205h4v14H7zM13\x205h4v14h-4z\x22/></svg>';
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
}
function createPreviewMarkup() {
  return '\n    <div class="v2-gif-node-preview" data-gif-preview>\n      <canvas class="v2-gif-editor-canvas" data-gif-canvas></canvas>\n      <div class="v2-gif-editor-loading" data-gif-loading role="status">\n        <span class="v2-gif-editor-spinner" aria-hidden="true"></span>\n        <span data-i18n="videoGif.loadingPreview">正在加载 GIF 预览…</span>\n      </div>\n    </div>\n  ';
}
function createControlsMarkup() {
  return (
    '\n    <div class="v2-video-gifbar" role="group" data-gif-editor-shell>\n      <div class="v2-gif-editor-timeline" data-gif-timeline>\n        <div class="v2-gif-editor-range-summary">\n          <span data-gif-range-label></span>\n          <span data-gif-output-label></span>\n        </div>\n        <div class="v2-gif-editor-timeline-host" data-gif-timeline-host></div>\n      </div>\n      <div class="v2-annotate-toolbar v2-gif-editor-toolbar" data-gif-toolbar>\n        <button class="v2-annotate-btn icon-only act-cancel" type="button" data-gif-action="cancel" data-i18n-tooltip="videoGif.cancel" data-i18n-aria-label="videoGif.cancel">' +
    createIconMarkup('cancel') +
    '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22v2-annotate-divider\x22></div>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20class=\x22v2-annotate-btn\x20icon-only\x22\x20type=\x22button\x22\x20data-gif-action=\x22play\x22\x20data-i18n-tooltip=\x22videoGif.play\x22\x20data-i18n-aria-label=\x22videoGif.play\x22><span\x20data-gif-play-icon>' +
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
  active: ![],
  nodeId: '',
  limitSize: ![],
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
  durationSec: 0x0,
  startSec: 0x0,
  endSec: 0x0,
  sourceWidth: 0x0,
  sourceHeight: 0x0,
  sizeIndex: 0x0,
  fpsIndex: 0x0,
  qualityIndex: 0x1,
  _preferences: null,
  taskId: '',
  _raf: 0x0,
  _lastDrawAt: 0x0,
  _drawDirty: !![],
  _sessionToken: 0x0,
  _exportToken: 0x0,
  _busy: ![],
  _unsubscribeNode: null,
  _unsubscribeTask: null,
  _onKeyDown: null,
  _onResize: null,
  _retryRaf: 0x0,
  _retryCount: 0x0,
  _thumbToken: 0x0,
  _timelineDragMode: null,
  _timelineDragSnapshot: null,
  _onTimelinePointerMove: null,
  _onTimelinePointerUp: null,
  _hiddenEls: null,
  _boundEvents: [],
  init({
    nodeId: _0x36bbfd,
    sourceUrl: sourceUrl = '',
    sourceLocalPath: sourceLocalPath = '',
    ensureLocalSource: ensureLocalSource = null,
  } = {}) {
    const _0x3e53f1 = String(_0x36bbfd || '')['trim'](),
      _0x430fbd = appStore['getStateRaw']()['nodes']?.[_0x3e53f1];
    if (!_0x3e53f1 || !_0x430fbd) return ![];
    const _0x27d2dd = getMainVideoItem(_0x430fbd),
      _0x253c1f = String(
        sourceUrl ||
          _0x27d2dd?.['videoUrl'] ||
          _0x27d2dd?.['src'] ||
          _0x430fbd['videoUrl'] ||
          _0x430fbd['src'] ||
          '',
      )['trim'](),
      _0x47f14b = String(sourceLocalPath || _0x27d2dd?.['localPath'] || _0x430fbd['localPath'] || '')[
        'trim'
      ]();
    if (!_0x253c1f && !_0x47f14b)
      return (window['showToast']?.(videoGifText('errors.noSource'), 'warn'), ![]);
    if (this['active']) this['exit']({ silent: !![] });
    return (
      (this['active'] = !![]),
      (this['nodeId'] = _0x3e53f1),
      (this['sourceUrl'] = _0x253c1f || localPathToUrl(_0x47f14b)),
      (this['sourceLocalPath'] = _0x47f14b),
      (this['ensureLocalSource'] = typeof ensureLocalSource === 'function' ? ensureLocalSource : null),
      this['_restorePreferences'](),
      (this['durationSec'] = 0x0),
      (this['startSec'] = 0x0),
      (this['endSec'] = 0x0),
      (this['sourceWidth'] = 0x0),
      (this['sourceHeight'] = 0x0),
      (this['taskId'] = ''),
      (this['_busy'] = ![]),
      (this['_drawDirty'] = !![]),
      ++this['_sessionToken'],
      (this['_retryCount'] = 0x0),
      (this['_unsubscribeNode'] = appStore['subscribeSelector'](
        (_0x378742) => Boolean(_0x378742['nodes']?.[_0x3e53f1]),
        (_0x52a3f7) => {
          !_0x52a3f7 && this['active'] && this['nodeId'] === _0x3e53f1 && this['exit']({ silent: !![] });
        },
      )),
      this['_mountWhenReady'](),
      !![]
    );
  },
  _mountWhenReady() {
    const _0x1c1521 = this['nodeId'],
      _0x5ada3e = () => {
        if (!this['active'] || this['nodeId'] !== _0x1c1521) return;
        const _0x1418a0 = document['getElementById'](_0x1c1521);
        if (!_0x1418a0) {
          this['_retryCount'] += 0x1;
          if (this['_retryCount'] > 0xa) {
            this['exit']({ silent: !![] });
            return;
          }
          this['_retryRaf'] = requestAnimationFrame(_0x5ada3e);
          return;
        }
        ((this['wrapperEl'] = _0x1418a0),
          this['_applyFrozenUI'](!![]),
          this['_applyDimMode'](!![]),
          this['_createUI'](),
          this['_bindEvents'](),
          this['_startRenderLoop'](),
          void this['_attachSource'](this['_sessionToken']));
      };
    this['_retryRaf'] = requestAnimationFrame(_0x5ada3e);
  },
  _restorePreferences(_0x1aa538) {
    let _0x5a6fdb = this['_preferences'];
    if (!_0x5a6fdb)
      try {
        _0x5a6fdb = JSON['parse'](
          (_0x1aa538 || globalThis['localStorage'])?.['getItem'](GIF_PREFERENCES_STORAGE_KEY) || 'null',
        );
      } catch {}
    const _0x5ebdbf = VIDEO_GIF_SETTINGS['sizes']['indexOf'](_0x5a6fdb?.['size']),
      _0x5758a5 = VIDEO_GIF_SETTINGS['fpsOptions']['indexOf'](_0x5a6fdb?.['fps']),
      _0x1a82dc = QUALITY_OPTIONS['indexOf'](_0x5a6fdb?.['quality']);
    ((this['sizeIndex'] = _0x5ebdbf >= 0x0 ? _0x5ebdbf : VIDEO_GIF_SETTINGS['defaultSizeIndex']),
      (this['fpsIndex'] = _0x5758a5 >= 0x0 ? _0x5758a5 : VIDEO_GIF_SETTINGS['defaultFpsIndex']),
      (this['qualityIndex'] = _0x1a82dc >= 0x0 ? _0x1a82dc : 0x1),
      (this['limitSize'] = _0x5a6fdb?.['limitSize'] === !![]));
  },
  _savePreferences(_0x282be3) {
    this['_preferences'] = {
      size: VIDEO_GIF_SETTINGS['sizes'][this['sizeIndex']],
      fps: VIDEO_GIF_SETTINGS['fpsOptions'][this['fpsIndex']],
      quality: QUALITY_OPTIONS[this['qualityIndex']],
      limitSize: this['limitSize'],
    };
    try {
      (_0x282be3 || globalThis['localStorage'])?.['setItem'](
        GIF_PREFERENCES_STORAGE_KEY,
        JSON['stringify'](this['_preferences']),
      );
    } catch {}
  },
  _applyDimMode(_0x147139) {
    const _0x285a14 = document['getElementById']('v2-wrap');
    (_0x285a14?.['classList']['toggle']('is-video-gif-mode', _0x147139),
      this['wrapperEl']?.['classList']['toggle']('is-video-gif-target', _0x147139));
  },
  _applyFrozenUI(_0x4d3467) {
    if (!this['wrapperEl']) return;
    this['wrapperEl']['classList']['toggle']('is-video-gif-editing', _0x4d3467);
    if (_0x4d3467) {
      if (Array['isArray'](this['_hiddenEls']) && this['_hiddenEls']['length']) return;
      const _0x1d2e8b = [];
      for (const _0x2d71ae of [
        '.video-controls',
        '.video-mute-btn',
        '.node-upload-hint',
        '.video-center-indicator',
        '.gen-video-center-indicator',
        '.multi-toggle-btn',
      ]) {
        this['wrapperEl']['querySelectorAll'](_0x2d71ae)['forEach']((_0x53a015) => {
          (_0x1d2e8b['push']({ element: _0x53a015, display: _0x53a015['style']['display'] }),
            (_0x53a015['style']['display'] = 'none'));
        });
      }
      this['_hiddenEls'] = _0x1d2e8b;
      return;
    }
    for (const { element: _0xaf37a6, display: _0x5a38a0 } of this['_hiddenEls'] || []) {
      if (_0xaf37a6?.['isConnected']) _0xaf37a6['style']['display'] = _0x5a38a0 || '';
    }
    this['_hiddenEls'] = null;
  },
  _getVideoEl() {
    return resolveNodeVideoElement(
      this['wrapperEl'],
      appStore['getStateRaw']()['nodes']?.[this['nodeId']]?.['mainVideoIndex'],
    );
  },
  _createUI() {
    if (!this['wrapperEl']) return;
    (this['wrapperEl']
      ['querySelectorAll']('.v2-video-gifbar')
      ['forEach']((_0x175605) => _0x175605['remove']()),
      this['wrapperEl']
        ['querySelectorAll']('.v2-gif-node-preview')
        ['forEach']((_0x16d5d3) => _0x16d5d3['remove']()),
      (this['videoEl'] = this['_getVideoEl']()),
      (this['mediaCardEl'] =
        this['videoEl']?.['closest']('.video-card, .media-card, .node-card') ||
        this['wrapperEl']['querySelector']('.video-card, .media-card, .node-card') ||
        this['wrapperEl']));
    const _0x21e289 = document['createElement']('div');
    (setStaticInnerHTML(_0x21e289, VIDEO_GIF_PREVIEW_TEMPLATE_ID),
      (this['previewEl'] = _0x21e289['firstElementChild']),
      this['mediaCardEl']['appendChild'](this['previewEl']));
    const _0x3053b5 = document['createElement']('div');
    (setStaticInnerHTML(_0x3053b5, VIDEO_GIF_CONTROLS_TEMPLATE_ID),
      (this['barEl'] = _0x3053b5['firstElementChild']),
      this['wrapperEl']['appendChild'](this['barEl']),
      applyI18n(this['previewEl']),
      applyI18n(this['barEl']),
      this['barEl']['setAttribute']('aria-label', videoGifText('choosePreset')),
      (this['canvasEl'] = this['previewEl']['querySelector']('[data-gif-canvas]')),
      (this['loadingEl'] = this['previewEl']['querySelector']('[data-gif-loading]')),
      (this['toolbarEl'] = this['barEl']['querySelector']('[data-gif-toolbar]')),
      (this['rangeLabelEl'] = this['barEl']['querySelector']('[data-gif-range-label]')),
      (this['outputLabelEl'] = this['barEl']['querySelector']('[data-gif-output-label]')));
    const _0x2e5df9 = createVideoRangeTimelineView({ documentRef: document });
    (this['barEl']['querySelector']('[data-gif-timeline-host]')?.['appendChild'](_0x2e5df9['trackEl']),
      (this['trackEl'] = _0x2e5df9['trackEl']),
      (this['trackEl']['tabIndex'] = -0x1),
      (this['selectionEl'] = _0x2e5df9['selectionEl']),
      (this['leftHandleEl'] = _0x2e5df9['leftHandleEl']),
      (this['rightHandleEl'] = _0x2e5df9['rightHandleEl']),
      (this['playheadEl'] = _0x2e5df9['playheadEl']),
      (this['timelineLabelEl'] = _0x2e5df9['labelEl']),
      (this['thumbEls'] = _0x2e5df9['thumbEls']),
      (this['playButtonEl'] = this['barEl']['querySelector']('[data-gif-action="play"]')),
      (this['sizeButtonEl'] = this['barEl']['querySelector']('[data-gif-action="size"]')),
      (this['fpsButtonEl'] = this['barEl']['querySelector']('[data-gif-action="fps"]')),
      (this['qualityButtonEl'] = this['barEl']['querySelector']('[data-gif-action="quality"]')),
      (this['limitSizeButtonEl'] = this['barEl']['querySelector']('[data-gif-action="limit-size"]')),
      (this['generateButtonEl'] = this['barEl']['querySelector']('[data-gif-action="generate"]')),
      this['_updateControls'](),
      this['_updateBarViewportOffset'](),
      void this['_renderTimelineThumbnails'](this['_sessionToken']));
  },
  _listen(_0x407c3f, _0x79f6a3, _0x322080, _0x3d425b) {
    (_0x407c3f?.['addEventListener']?.(_0x79f6a3, _0x322080, _0x3d425b),
      this['_boundEvents']['push'](() =>
        _0x407c3f?.['removeEventListener']?.(_0x79f6a3, _0x322080, _0x3d425b),
      ));
  },
  _bindEvents() {
    (this['_listen'](this['barEl'], 'pointerdown', (_0x50e8b2) => _0x50e8b2['stopPropagation']()),
      this['_listen'](this['barEl'], 'dblclick', (_0x310770) => {
        (_0x310770['preventDefault'](), _0x310770['stopPropagation']());
      }),
      this['_listen'](this['barEl']?.['querySelector']('[data-gif-action=\x22cancel\x22]'), 'click', () =>
        this['exit'](),
      ),
      this['_listen'](this['playButtonEl'], 'click', () => void this['_togglePlayback']()),
      this['_listen'](this['sizeButtonEl'], 'click', () => {
        const _0x375fe4 = VIDEO_GIF_SETTINGS['sizes'];
        ((this['sizeIndex'] = (this['sizeIndex'] + 0x1) % _0x375fe4['length']),
          this['_savePreferences'](),
          this['_resizeCanvas'](),
          this['_updateControls']());
      }),
      this['_listen'](this['fpsButtonEl'], 'click', () => {
        const _0x307ac2 = VIDEO_GIF_SETTINGS['fpsOptions'];
        ((this['fpsIndex'] = (this['fpsIndex'] + 0x1) % _0x307ac2['length']),
          this['_savePreferences'](),
          (this['_lastDrawAt'] = 0x0),
          (this['_drawDirty'] = !![]),
          this['_updateControls']());
      }),
      this['_listen'](this['qualityButtonEl'], 'click', () => {
        ((this['qualityIndex'] = (this['qualityIndex'] + 0x1) % QUALITY_OPTIONS['length']),
          this['_savePreferences'](),
          this['_updateControls']());
      }),
      this['_listen'](this['limitSizeButtonEl'], 'click', () => {
        if (this['_busy']) return;
        ((this['limitSize'] = !this['limitSize']), this['_savePreferences'](), this['_updateControls']());
      }),
      this['_listen'](this['generateButtonEl'], 'click', () => void this['_generate']()),
      this['_bindTimelineEvents'](),
      this['_listen'](this['videoEl'], 'loadedmetadata', () => this['_handleMetadata']()),
      this['_listen'](this['videoEl'], 'loadeddata', () => {
        (this['loadingEl']?.['setAttribute']('hidden', ''),
          (this['_drawDirty'] = !![]),
          this['_drawFrame']());
      }),
      this['_listen'](this['videoEl'], 'seeked', () => {
        ((this['_drawDirty'] = !![]), this['_drawFrame']());
      }),
      this['_listen'](this['videoEl'], 'play', () => this['_updatePlayButton']()),
      this['_listen'](this['videoEl'], 'pause', () => this['_updatePlayButton']()),
      (this['_onKeyDown'] = (_0x51e72c) => {
        if (!this['active'] || _0x51e72c['isComposing']) return;
        const _0x243a9c = String(_0x51e72c['target']?.['tagName'] || '')['toLowerCase'](),
          _0x1b6012 =
            _0x243a9c === 'button' ||
            _0x243a9c === 'input' ||
            _0x243a9c === 'select' ||
            _0x243a9c === 'textarea' ||
            _0x243a9c === 'a' ||
            _0x51e72c['target']?.['isContentEditable'];
        if (_0x51e72c['key'] === 'Escape') (_0x51e72c['preventDefault'](), this['exit']());
        else {
          if ((_0x51e72c['key'] === '\x20' || _0x51e72c['code'] === 'Space') && !_0x1b6012) {
            (_0x51e72c['preventDefault'](), _0x51e72c['stopPropagation'](), releaseCanvasPanShortcut());
            if (!_0x51e72c['repeat']) void this['_togglePlayback']();
          } else
            _0x51e72c['key'] === 'Enter' &&
              !_0x1b6012 &&
              !this['_busy'] &&
              (_0x51e72c['preventDefault'](), void this['_generate']());
        }
      }),
      window['addEventListener']('keydown', this['_onKeyDown'], !![]),
      (this['_onResize'] = () => this['_updatePreviewLayout']()),
      window['addEventListener']('resize', this['_onResize'], !![]));
  },
  async _attachSource(_0x274f73) {
    const _0x246e49 = this['videoEl'],
      _0xb2413e = this['sourceUrl'] || localPathToUrl(this['sourceLocalPath']);
    if (!_0x246e49 || !_0xb2413e) return;
    try {
      const _0x4cc803 = String(_0x246e49['currentSrc'] || _0x246e49['getAttribute']('src') || '')['trim']();
      !_0x4cc803 &&
        (await attachDesktopMediaPlaybackSource(_0x246e49, _0xb2413e, {
          preload: 'auto',
          shouldAssign: () => this['active'] && this['_sessionToken'] === _0x274f73,
        }));
      if (!this['active'] || this['_sessionToken'] !== _0x274f73) return;
      if (_0x246e49['readyState'] >= 0x1) this['_handleMetadata']();
    } catch (_0x3c17a7) {
      if (!this['active'] || this['_sessionToken'] !== _0x274f73) return;
      (this['loadingEl']?.['setAttribute']('hidden', ''),
        window['showToast']?.(
          videoGifText('errors.previewFailed', {
            error: _0x3c17a7 instanceof Error ? _0x3c17a7['message'] : String(_0x3c17a7 || ''),
          }),
          'error',
        ),
        this['exit']({ silent: !![] }));
    }
  },
  _handleMetadata() {
    if (!this['active'] || !this['videoEl']) return;
    const _0x3bb204 = Number(this['videoEl']['duration']) || 0x0;
    if (!(_0x3bb204 > 0x0)) return;
    if (this['durationSec'] > 0x0) return;
    ((this['durationSec'] = _0x3bb204),
      (this['sourceWidth'] = Number(this['videoEl']['videoWidth']) || 0x0),
      (this['sourceHeight'] = Number(this['videoEl']['videoHeight']) || 0x0),
      (this['startSec'] = 0x0),
      (this['endSec'] = Math['min'](_0x3bb204, VIDEO_GIF_SETTINGS['defaultDurationSec'])),
      this['_resizeCanvas'](),
      this['_updateControls'](),
      this['loadingEl']?.['setAttribute']('hidden', ''));
    try {
      this['videoEl']['currentTime'] = 0x0;
    } catch {}
    this['_drawDirty'] = !![];
  },
  _getSettings() {
    const _0x406acc = VIDEO_GIF_SETTINGS,
      _0x4bd7ab = _0x406acc['sizes'][this['sizeIndex']] || _0x406acc['sizes'][0x0],
      _0x12c06c = resolveVideoGifOutputSize({
        size: _0x4bd7ab,
        sourceWidth: this['sourceWidth'],
        sourceHeight: this['sourceHeight'],
      });
    return {
      preset: this['limitSize'] ? 'wechat' : 'hd',
      size: _0x4bd7ab,
      width: _0x12c06c['width'],
      height: _0x12c06c['height'],
      sourceWidth: this['sourceWidth'],
      sourceHeight: this['sourceHeight'],
      fps: _0x406acc['fpsOptions'][this['fpsIndex']] || _0x406acc['fpsOptions'][0x0],
      quality: QUALITY_OPTIONS[this['qualityIndex']] || 'balanced',
      targetBytes: this['limitSize'] ? _0x406acc['targetBytes'] : 0x0,
      start: this['startSec'],
      end: this['endSec'],
    };
  },
  _resizeCanvas() {
    const _0x37a83b = this['_getSettings']();
    if (!this['canvasEl']) return;
    if (this['canvasEl']['width'] !== _0x37a83b['width']) this['canvasEl']['width'] = _0x37a83b['width'];
    if (this['canvasEl']['height'] !== _0x37a83b['height']) this['canvasEl']['height'] = _0x37a83b['height'];
    ((this['canvasEl']['style']['aspectRatio'] = _0x37a83b['width'] + '\x20/\x20' + _0x37a83b['height']),
      (this['_drawDirty'] = !![]),
      this['_updatePreviewLayout'](),
      this['_drawFrame']());
  },
  _updatePreviewLayout() {
    if (!this['canvasEl'] || !this['mediaCardEl']) return;
    const _0x2d1a87 = this['_getSettings'](),
      _0x2325ca = Math['max'](0x1, this['mediaCardEl']['clientWidth'] || 0x1),
      _0x5aadae = Math['max'](0x1, this['mediaCardEl']['clientHeight'] || 0x1),
      _0x178189 = Math['min'](_0x2325ca / _0x2d1a87['width'], _0x5aadae / _0x2d1a87['height']);
    ((this['canvasEl']['style']['width'] =
      Math['max'](0x1, Math['round'](_0x2d1a87['width'] * _0x178189)) + 'px'),
      (this['canvasEl']['style']['height'] =
        Math['max'](0x1, Math['round'](_0x2d1a87['height'] * _0x178189)) + 'px'),
      this['_updateBarViewportOffset']());
  },
  _updateBarViewportOffset() {
    if (!this['barEl']) return;
    this['barEl']['style']['left'] = '';
    const _0x457fe1 = this['barEl']['getBoundingClientRect'](),
      _0x3eae1c = Math['max'](0x0, Number(window['innerWidth']) || 0x0);
    if (!(_0x457fe1['width'] > 0x0) || !(_0x3eae1c > 0x0)) return;
    const _0x531581 = Math['min'](
      GIF_EDITOR_VIEWPORT_MARGIN_PX,
      Math['max'](0x0, (_0x3eae1c - _0x457fe1['width']) / 0x2),
    );
    let _0x5eae04 = 0x0;
    if (_0x457fe1['left'] < _0x531581) _0x5eae04 = _0x531581 - _0x457fe1['left'];
    else
      _0x457fe1['right'] > _0x3eae1c - _0x531581 && (_0x5eae04 = _0x3eae1c - _0x531581 - _0x457fe1['right']);
    if (Math['abs'](_0x5eae04) < 0.5) return;
    const _0x3c07ec = Math['max'](0.0001, Number(appStore['getStateRaw']()['viewport']?.['zoom']) || 0x1);
    this['barEl']['style']['left'] = 'calc(50% + ' + _0x5eae04 / _0x3c07ec + 'px)';
  },
  async _renderTimelineThumbnails(_0x472259) {
    const _0x1b3671 = ++this['_thumbToken'],
      _0x584777 = Array['isArray'](this['thumbEls']) ? this['thumbEls'] : [];
    if (!_0x584777['length']) return;
    const _0xfcefe = appStore['getStateRaw']()['nodes']?.[this['nodeId']] || {},
      _0x68862a = await renderVideoTimelineThumbnails({
        src: this['sourceUrl'] || localPathToUrl(this['sourceLocalPath']),
        posterUrl:
          String(this['videoEl']?.['poster'] || '')['trim']() ||
          resolveCanvasVideoPosterUrl(getMainVideoItem(_0xfcefe) || _0xfcefe) ||
          resolveCanvasVideoPosterUrl(_0xfcefe),
        thumbs: _0x584777,
        isCurrent: () =>
          this['active'] && this['_sessionToken'] === _0x472259 && this['_thumbToken'] === _0x1b3671,
      });
    if (!this['active'] || this['_sessionToken'] !== _0x472259 || this['_thumbToken'] !== _0x1b3671) return;
    this['trackEl']?.['dataset'] && (this['trackEl']['dataset']['thumbnailState'] = _0x68862a['source']);
  },
  _bindTimelineEvents() {
    (this['_listen'](this['trackEl'], 'pointermove', (_0x51102b) => {
      if (this['_timelineDragMode'] || this['_busy'] || !this['selectionEl']) return;
      const _0x18686c = this['selectionEl']['getBoundingClientRect'](),
        _0x1cb9be = Math['abs'](_0x51102b['clientX'] - _0x18686c['left']) < 0x14,
        _0x28a15e = Math['abs'](_0x51102b['clientX'] - _0x18686c['right']) < 0x14;
      (this['leftHandleEl']?.['classList']['toggle']('hover-active', _0x1cb9be),
        this['rightHandleEl']?.['classList']['toggle']('hover-active', _0x28a15e),
        (this['selectionEl']['style']['cursor'] =
          _0x1cb9be || _0x28a15e ? 'var(--resize-ew-cursor)' : 'var(--grab-cursor)'));
    }),
      this['_listen'](this['trackEl'], 'pointerleave', () => {
        if (this['_timelineDragMode']) return;
        (this['leftHandleEl']?.['classList']['remove']('hover-active'),
          this['rightHandleEl']?.['classList']['remove']('hover-active'));
        if (this['selectionEl']) this['selectionEl']['style']['cursor'] = '';
      }),
      this['_listen'](this['trackEl'], 'pointerdown', (_0x2d42fc) => {
        if (this['_busy'] || !(this['durationSec'] > 0x0) || !this['selectionEl']) return;
        this['trackEl']['focus']({ preventScroll: !![] });
        const _0x45585d = this['trackEl']['getBoundingClientRect'](),
          _0x3be3d1 = this['selectionEl']['getBoundingClientRect']();
        if (!_0x45585d['width']) return;
        const _0x3adec3 = Math['abs'](_0x2d42fc['clientX'] - _0x3be3d1['left']) < 0x14,
          _0x59c2db = Math['abs'](_0x2d42fc['clientX'] - _0x3be3d1['right']) < 0x14,
          _0x4b4b92 = _0x2d42fc['clientX'] >= _0x3be3d1['left'] && _0x2d42fc['clientX'] <= _0x3be3d1['right'];
        ((this['_timelineDragMode'] = _0x3adec3
          ? 'left'
          : _0x59c2db
            ? 'right'
            : _0x4b4b92
              ? 'move'
              : 'scrub'),
          (this['_timelineDragSnapshot'] = {
            clientX: Number(_0x2d42fc['clientX']) || 0x0,
            startSec: this['startSec'],
            endSec: this['endSec'],
          }),
          this['leftHandleEl']?.['classList']['toggle']('hover-active', this['_timelineDragMode'] === 'left'),
          this['rightHandleEl']?.['classList']['toggle'](
            'hover-active',
            this['_timelineDragMode'] === 'right',
          ),
          _0x2d42fc['preventDefault'](),
          _0x2d42fc['stopPropagation']());
        const _0x1cd81a = Number(_0x2d42fc['clientX']) || 0x0;
        let _0x30bb57 = ![];
        if (this['_timelineDragMode'] === 'scrub') this['_seekTimelineAtClientX'](_0x2d42fc['clientX']);
        else
          this['_timelineDragMode'] !== 'move' && this['_updateTimelineRangeAtClientX'](_0x2d42fc['clientX']);
        (this['_removeTimelineDragListeners'](),
          (this['_onTimelinePointerMove'] = (_0x4c770d) => {
            if (!this['active'] || !this['_timelineDragMode']) return;
            (_0x4c770d['preventDefault'](), _0x4c770d['stopPropagation']());
            if (this['_timelineDragMode'] === 'scrub') this['_seekTimelineAtClientX'](_0x4c770d['clientX']);
            else {
              if (this['_timelineDragMode'] === 'move') {
                if (!_0x30bb57 && Math['abs'](_0x4c770d['clientX'] - _0x1cd81a) <= 0x2) return;
                _0x30bb57 = !![];
              }
              this['_updateTimelineRangeAtClientX'](_0x4c770d['clientX']);
            }
          }),
          (this['_onTimelinePointerUp'] = (_0x286faf) => {
            (_0x286faf['preventDefault'](), _0x286faf['stopPropagation']());
            const _0x579d9f = this['_timelineDragMode'] === 'move' && !_0x30bb57,
              _0xbc3c53 = Number['isFinite'](Number(_0x286faf['clientX']))
                ? Number(_0x286faf['clientX'])
                : _0x1cd81a;
            this['_finishTimelineDrag']();
            if (_0x579d9f) this['_seekTimelineAtClientX'](_0xbc3c53);
          }),
          window['addEventListener']('pointermove', this['_onTimelinePointerMove'], !![]),
          window['addEventListener']('pointerup', this['_onTimelinePointerUp'], !![]));
      }));
  },
  _removeTimelineDragListeners() {
    (this['_onTimelinePointerMove'] &&
      window['removeEventListener']('pointermove', this['_onTimelinePointerMove'], !![]),
      this['_onTimelinePointerUp'] &&
        window['removeEventListener']('pointerup', this['_onTimelinePointerUp'], !![]),
      (this['_onTimelinePointerMove'] = null),
      (this['_onTimelinePointerUp'] = null));
  },
  _finishTimelineDrag() {
    (this['_removeTimelineDragListeners'](),
      (this['_timelineDragMode'] = null),
      (this['_timelineDragSnapshot'] = null),
      this['leftHandleEl']?.['classList']['remove']('hover-active'),
      this['rightHandleEl']?.['classList']['remove']('hover-active'));
    if (this['selectionEl']) this['selectionEl']['style']['cursor'] = '';
  },
  _seekTimelineAtClientX(_0x2a8fc8) {
    if (!this['trackEl'] || !(this['durationSec'] > 0x0) || !this['videoEl']) return;
    const _0x39b8f6 = this['trackEl']['getBoundingClientRect']();
    if (!_0x39b8f6['width']) return;
    const _0x42377f = clamp((_0x2a8fc8 - _0x39b8f6['left']) / _0x39b8f6['width'], 0x0, 0x1),
      _0x3a76db = Math['min'](Math['max'](0x0, this['durationSec'] - 0.001), _0x42377f * this['durationSec']);
    try {
      (this['videoEl']['pause'](), (this['videoEl']['currentTime'] = _0x3a76db));
    } catch {}
    ((this['_drawDirty'] = !![]), this['_renderTimeline']());
  },
  _updateTimelineRangeAtClientX(_0x20b3d9) {
    if (!this['trackEl'] || !(this['durationSec'] > 0x0)) return;
    const _0x1df1d1 = this['trackEl']['getBoundingClientRect'](),
      _0x1536a6 = this['_timelineDragSnapshot'];
    if (!_0x1df1d1['width'] || !_0x1536a6) return;
    const _0x3ed06d = Math['min'](GIF_EDITOR_MIN_RANGE_SEC, this['durationSec']),
      _0x138852 = clamp((_0x20b3d9 - _0x1df1d1['left']) / _0x1df1d1['width'], 0x0, 0x1),
      _0x40617 = _0x138852 * this['durationSec'];
    if (this['_timelineDragMode'] === 'left')
      this['startSec'] = roundTime(clamp(_0x40617, 0x0, Math['max'](0x0, this['endSec'] - _0x3ed06d)));
    else {
      if (this['_timelineDragMode'] === 'right')
        this['endSec'] = roundTime(clamp(_0x40617, this['startSec'] + _0x3ed06d, this['durationSec']));
      else {
        if (this['_timelineDragMode'] === 'move') {
          const _0x3b1fc1 = _0x1536a6['endSec'] - _0x1536a6['startSec'],
            _0x363c2f =
              ((Number(_0x20b3d9) - _0x1536a6['clientX']) / _0x1df1d1['width']) * this['durationSec'];
          ((this['startSec'] = roundTime(
            clamp(_0x1536a6['startSec'] + _0x363c2f, 0x0, Math['max'](0x0, this['durationSec'] - _0x3b1fc1)),
          )),
            (this['endSec'] = roundTime(this['startSec'] + _0x3b1fc1)));
        }
      }
    }
    try {
      (this['videoEl']?.['pause']?.(),
        this['videoEl'] &&
          (this['videoEl']['currentTime'] =
            this['_timelineDragMode'] === 'right'
              ? Math['max'](this['startSec'], this['endSec'] - 0.04)
              : this['startSec']));
    } catch {}
    ((this['_drawDirty'] = !![]), this['_updateControls']());
  },
  _renderTimeline() {
    if (!this['trackEl'] || !this['selectionEl'] || !this['leftHandleEl'] || !this['rightHandleEl']) return;
    const _0x4fe982 = this['durationSec'],
      _0x48a50e = Number['isFinite'](_0x4fe982) && _0x4fe982 > 0x0,
      _0x5e412c = _0x48a50e ? clamp(this['startSec'], 0x0, _0x4fe982) : 0x0,
      _0x234fce = _0x48a50e ? clamp(this['endSec'], _0x5e412c, _0x4fe982) : 0x0,
      _0x9d54c9 = Math['max'](0x0, _0x234fce - _0x5e412c),
      _0x388e19 = _0x48a50e ? (_0x5e412c / _0x4fe982) * 0x64 : 0x0,
      _0x317dc5 = _0x48a50e ? (_0x9d54c9 / _0x4fe982) * 0x64 : 0x0;
    ((this['selectionEl']['style']['left'] = _0x388e19 + '%'),
      (this['selectionEl']['style']['width'] = _0x317dc5 + '%'),
      (this['leftHandleEl']['style']['left'] = _0x388e19 + '%'),
      (this['rightHandleEl']['style']['left'] = _0x388e19 + _0x317dc5 + '%'),
      this['timelineLabelEl'] &&
        ((this['timelineLabelEl']['textContent'] = _0x48a50e
          ? _0x9d54c9['toFixed'](0x2) + 's'
          : videoGifText('loadingPreview')),
        (this['timelineLabelEl']['style']['left'] = _0x388e19 + _0x317dc5 / 0x2 + '%')),
      this['_renderTimelinePlayhead']());
  },
  _renderTimelinePlayhead() {
    if (!this['playheadEl'] || !this['videoEl'] || !(this['durationSec'] > 0x0)) {
      if (this['playheadEl']) this['playheadEl']['style']['display'] = 'none';
      return;
    }
    const _0x57cb60 = clamp((Number(this['videoEl']['currentTime']) || 0x0) / this['durationSec'], 0x0, 0x1);
    ((this['playheadEl']['style']['display'] = 'block'),
      (this['playheadEl']['style']['left'] = _0x57cb60 * 0x64 + '%'));
  },
  async _togglePlayback() {
    const _0x296eda = this['videoEl'];
    if (!this['active'] || !_0x296eda || !(this['durationSec'] > 0x0)) return;
    if (!_0x296eda['paused']) {
      _0x296eda['pause']();
      return;
    }
    ((_0x296eda['currentTime'] < this['startSec'] || _0x296eda['currentTime'] >= this['endSec'] - 0.02) &&
      (_0x296eda['currentTime'] = this['startSec']),
      await playVideoWithRecovery(_0x296eda, {
        label: 'video-gif:' + this['nodeId'],
        sourceUrl: this['sourceUrl'],
      }));
  },
  _updatePlayButton() {
    if (!this['playButtonEl'] || !this['videoEl']) return;
    const _0x235732 = !this['videoEl']['paused'],
      _0xfe5625 = this['playButtonEl']['querySelector']('[data-gif-play-icon]'),
      _0x45e783 = this['playButtonEl']['querySelector']('[data-gif-pause-icon]');
    if (_0xfe5625) _0xfe5625['hidden'] = _0x235732;
    if (_0x45e783) _0x45e783['hidden'] = !_0x235732;
    const _0x5998b4 = videoGifText(_0x235732 ? 'pause' : 'play');
    ((this['playButtonEl']['dataset']['tooltip'] = _0x5998b4),
      this['playButtonEl']['setAttribute']('aria-label', _0x5998b4),
      this['playButtonEl']['classList']['toggle']('active', _0x235732));
  },
  _startRenderLoop() {
    if (this['_raf']) cancelAnimationFrame(this['_raf']);
    const _0x330861 = (_0x5e9f7f) => {
      if (!this['active']) return;
      const _0x17f8fc = this['_getSettings'](),
        _0x40de2d = 0x3e8 / Math['max'](0x1, _0x17f8fc['fps']),
        _0x2d7b12 = this['videoEl'];
      if (_0x2d7b12 && !_0x2d7b12['paused'] && _0x2d7b12['currentTime'] >= this['endSec'] - 0.015)
        try {
          _0x2d7b12['currentTime'] = this['startSec'];
        } catch {}
      (this['_renderTimelinePlayhead'](),
        (this['_drawDirty'] || _0x5e9f7f - this['_lastDrawAt'] >= _0x40de2d) &&
          (this['_drawFrame'](), (this['_lastDrawAt'] = _0x5e9f7f)),
        (this['_raf'] = requestAnimationFrame(_0x330861)));
    };
    this['_raf'] = requestAnimationFrame(_0x330861);
  },
  _drawFrame() {
    const _0x322726 = this['canvasEl'],
      _0x1e259b = this['videoEl'];
    if (
      !_0x322726 ||
      !_0x1e259b ||
      _0x1e259b['readyState'] < 0x2 ||
      !_0x1e259b['videoWidth'] ||
      !_0x1e259b['videoHeight']
    )
      return;
    const _0x204358 = _0x322726['getContext']('2d');
    if (!_0x204358) return;
    const _0x823978 = this['_getSettings'](),
      _0x3b758b = resolveVideoGifDrawRect({
        sourceWidth: _0x1e259b['videoWidth'],
        sourceHeight: _0x1e259b['videoHeight'],
        targetWidth: _0x823978['width'],
        targetHeight: _0x823978['height'],
        fit: 'contain',
      });
    (_0x204358['clearRect'](0x0, 0x0, _0x823978['width'], _0x823978['height']),
      (_0x204358['imageSmoothingEnabled'] = !![]),
      (_0x204358['imageSmoothingQuality'] = 'high'),
      _0x204358['drawImage'](
        _0x1e259b,
        _0x3b758b['x'],
        _0x3b758b['y'],
        _0x3b758b['width'],
        _0x3b758b['height'],
      ),
      (this['_drawDirty'] = ![]));
  },
  _updateControls() {
    const _0x198d6d = this['_getSettings']();
    this['sizeButtonEl'] &&
      (this['sizeButtonEl']['textContent'] = videoGifText('longEdge', { size: _0x198d6d['size'] }));
    if (this['fpsButtonEl']) this['fpsButtonEl']['textContent'] = _0x198d6d['fps'] + ' FPS';
    this['qualityButtonEl'] &&
      (this['qualityButtonEl']['textContent'] = videoGifText('quality.' + _0x198d6d['quality']));
    this['limitSizeButtonEl'] &&
      (this['limitSizeButtonEl']['setAttribute']('aria-checked', String(this['limitSize'])),
      this['limitSizeButtonEl']['classList']['toggle']('active', this['limitSize']));
    const _0x1a8608 = Math['max'](0x0, this['endSec'] - this['startSec']);
    (this['rangeLabelEl'] &&
      (this['rangeLabelEl']['textContent'] = videoGifText('rangeSummary', {
        start: formatTime(this['startSec']),
        end: formatTime(this['endSec']),
        duration: _0x1a8608['toFixed'](0x1),
      })),
      this['outputLabelEl'] &&
        (this['outputLabelEl']['textContent'] =
          _0x198d6d['targetBytes'] > 0x0
            ? videoGifText('wechatTarget', { size: formatVideoGifFileSize(_0x198d6d['targetBytes']) })
            : videoGifText('unlimitedOutput')),
      this['_renderTimeline'](),
      this['_updatePlayButton']());
  },
  _setGenerateButtonLabel(_0x17abb7 = '') {
    if (!this['generateButtonEl']) return;
    const _0x29ad70 = String(_0x17abb7 || '')['trim']() || videoGifText('generate'),
      _0x16dfda = this['generateButtonEl']['querySelector']('[data-gif-generate-label]');
    if (_0x16dfda) _0x16dfda['textContent'] = _0x29ad70;
    this['generateButtonEl']['setAttribute']('aria-label', _0x29ad70);
  },
  _setBusy(_0x267bba, _0x1cfc9f = '') {
    ((this['_busy'] = _0x267bba === !![]),
      this['barEl']?.['setAttribute']('aria-busy', String(this['_busy'])));
    this['generateButtonEl'] &&
      ((this['generateButtonEl']['disabled'] = this['_busy']),
      (this['generateButtonEl']['dataset']['loading'] = String(this['_busy'])),
      this['generateButtonEl']['setAttribute']('aria-busy', String(this['_busy'])),
      this['generateButtonEl']
        ['querySelector']('svg')
        ?.['classList']['toggle']('v2-spinning', this['_busy']));
    for (const _0x4d0f5e of [
      this['sizeButtonEl'],
      this['fpsButtonEl'],
      this['qualityButtonEl'],
      this['limitSizeButtonEl'],
    ]) {
      if (_0x4d0f5e) _0x4d0f5e['disabled'] = this['_busy'];
    }
    (this['trackEl']?.['setAttribute']('aria-disabled', String(this['_busy'])),
      this['_setGenerateButtonLabel'](
        this['_busy'] ? _0x1cfc9f || videoGifText('encoding') : videoGifText('generate'),
      ));
  },
  async _resolveLocalSource() {
    if (this['sourceLocalPath']) return this['sourceLocalPath'];
    if (!this['ensureLocalSource']) throw new Error(videoGifText('errors.localSourceRequired'));
    const _0x5413c9 = String((await this['ensureLocalSource'](this['sourceUrl'])) || '')['trim']();
    if (!_0x5413c9) throw new Error(videoGifText('errors.localSourceRequired'));
    return ((this['sourceLocalPath'] = _0x5413c9), _0x5413c9);
  },
  _subscribeTaskProgress(_0x47995c, _0x5a3ee4) {
    (this['_unsubscribeTask']?.(),
      (this['_unsubscribeTask'] = desktopBridge['mediaTask']['onUpdate']((_0x2ab314) => {
        if (!this['active'] || this['_exportToken'] !== _0x5a3ee4) return;
        if (String(_0x2ab314?.['taskId'] || '') !== _0x47995c) return;
        this['_setGenerateButtonLabel'](
          _0x2ab314?.['stage'] === 'optimize' ? videoGifText('optimizing') : videoGifText('encoding'),
        );
      })));
  },
  async _generate() {
    if (!this['active'] || this['_busy'] || !(this['endSec'] > this['startSec'])) return;
    const _0xe738f4 = appStore['getStateRaw']()['nodes']?.[this['nodeId']];
    if (!_0xe738f4) {
      this['exit']({ silent: !![] });
      return;
    }
    const _0x25effe = ++this['_exportToken'];
    this['_setBusy'](!![], videoGifText('preparing'));
    try {
      const _0x5d4044 = await this['_resolveLocalSource']();
      if (!this['active'] || _0x25effe !== this['_exportToken']) return;
      const _0x43ca3e = this['_getSettings'](),
        _0x2581f6 = await enqueueElectronMediaTask({
          kind: 'videoToGif',
          nodeId: this['nodeId'],
          src: _0x5d4044,
          args: _0x43ca3e,
          cancellable: !![],
        }),
        _0x37a5c1 = String(_0x2581f6?.['taskId'] || '')['trim']();
      if (!_0x37a5c1) throw new Error(videoGifText('errors.taskUnavailable'));
      ((this['taskId'] = _0x37a5c1), this['_subscribeTaskProgress'](_0x37a5c1, _0x25effe));
      const _0x1fc126 = await waitForElectronMediaTask(_0x37a5c1, {
        timeout: 0xa * 0x3c * 0x3e8,
        diagnosticPayload: { kind: 'videoToGif', nodeId: this['nodeId'], src: _0x5d4044 },
      });
      if (!this['active'] || _0x25effe !== this['_exportToken']) return;
      await this['_createResultNode'](_0xe738f4, _0x1fc126);
      const _0x1ac05b = formatVideoGifFileSize(_0x1fc126['fileSize']);
      (this['exit']({ silent: !![], keepTask: !![] }),
        _0x1fc126['targetExceeded']
          ? window['showToast']?.(videoGifText('completedOverTarget', { size: _0x1ac05b }), 'warn')
          : window['showToast']?.(videoGifText('completed', { size: _0x1ac05b }), 'success'));
    } catch (_0x5d0fb7) {
      if (!this['active'] || _0x25effe !== this['_exportToken']) return;
      const _0x21ae38 = _0x5d0fb7 instanceof Error ? _0x5d0fb7['message'] : String(_0x5d0fb7 || '');
      ((this['taskId'] = ''),
        this['_unsubscribeTask']?.(),
        (this['_unsubscribeTask'] = null),
        this['_setBusy'](![]),
        this['_updateControls'](),
        window['showToast']?.(videoGifText('errors.generateFailed', { error: _0x21ae38 }), 'error'));
    }
  },
  async _createResultNode(_0x49e34a, _0x52392a = {}) {
    const _0x285d8e = pickResultLocalPath(_0x52392a);
    if (!_0x285d8e) throw new Error(videoGifText('errors.incompleteResult'));
    const _0x21be57 = Math['max'](0x1, Number(_0x52392a['imageWidth']) || 0x1),
      _0x1646c9 = Math['max'](0x1, Number(_0x52392a['imageHeight']) || 0x1),
      _0x376f04 = getAutoMediaSizeByShortSide(_0x21be57, _0x1646c9),
      _0x1ec179 = calcSafeSpawnPosNearNode(
        appStore['getStateRaw']()['nodes'],
        _0x49e34a,
        _0x376f04['width'],
        _0x376f04['height'],
      ),
      _0x64c8d1 = getResultFilename(_0x52392a),
      _0x400fb6 = buildCanvasLocalImageFields(
        {
          ..._0x52392a,
          localPath: _0x285d8e,
          originalLocalPath: _0x285d8e,
          imageUrl: _0x52392a['url'] || localPathToUrl(_0x285d8e),
          sourceUrl: _0x52392a['url'] || localPathToUrl(_0x285d8e),
          fileName: _0x64c8d1,
        },
        { includeSrc: !![] },
      ),
      _0x1bfde0 = generateId('source-image-gif');
    return (
      appStore['addNode'](
        buildSourceMediaNodePayload({
          id: _0x1bfde0,
          type: 'source-image',
          x: _0x1ec179['x'],
          y: _0x1ec179['y'],
          naturalWidth: _0x21be57,
          naturalHeight: _0x1646c9,
          name: videoGifText('resultName', { name: getSourceName(_0x49e34a) }),
          ..._0x400fb6,
          src: _0x400fb6['src'] || _0x52392a['url'] || localPathToUrl(_0x285d8e),
          localPath: _0x285d8e,
          fileName: _0x64c8d1,
          mimeType: 'image/gif',
          gifPreset: _0x52392a['preset'] || this['_getSettings']()['preset'],
          gifFps: Number(_0x52392a['fps']) || 0x0,
          gifMaxColors: Number(_0x52392a['maxColors']) || 0x0,
          gifDuration: Number(_0x52392a['duration']) || 0x0,
          gifFileSize: Number(_0x52392a['fileSize']) || 0x0,
          needsAutoResize: ![],
          fixedSize: !![],
        }),
      ),
      appStore['setSelectedNodes']([_0x1bfde0]),
      commit(),
      window['v2Renderer']?.['flushNode']?.(_0x1bfde0),
      await window['_triggerLocalCacheSave']?.(),
      _0x1bfde0
    );
  },
  exit({ silent: silent = ![], keepTask: keepTask = ![] } = {}) {
    if (!this['active']) return;
    const _0x49fe68 = this['taskId'],
      _0x116ead = this['_busy'];
    ((this['active'] = ![]), (this['_sessionToken'] += 0x1), (this['_exportToken'] += 0x1));
    if (!keepTask && _0x49fe68) void cancelElectronMediaTask(_0x49fe68);
    ((this['taskId'] = ''),
      this['_unsubscribeTask']?.(),
      (this['_unsubscribeTask'] = null),
      this['_unsubscribeNode']?.(),
      (this['_unsubscribeNode'] = null),
      this['_finishTimelineDrag'](),
      (this['_thumbToken'] += 0x1));
    for (const _0x3f7b81 of this['_boundEvents']['splice'](0x0)) _0x3f7b81();
    if (this['_onKeyDown']) window['removeEventListener']('keydown', this['_onKeyDown'], !![]);
    if (this['_onResize']) window['removeEventListener']('resize', this['_onResize'], !![]);
    ((this['_onKeyDown'] = null), (this['_onResize'] = null));
    if (this['_raf']) cancelAnimationFrame(this['_raf']);
    this['_raf'] = 0x0;
    if (this['_retryRaf']) cancelAnimationFrame(this['_retryRaf']);
    this['_retryRaf'] = 0x0;
    try {
      this['videoEl']?.['pause']?.();
    } catch {}
    (this['previewEl']?.['remove'](),
      this['barEl']?.['remove'](),
      this['_applyFrozenUI'](![]),
      this['_applyDimMode'](![]));
    if (!silent && _0x116ead) window['showToast']?.(videoGifText('cancelled'), 'info');
    ((this['nodeId'] = ''),
      (this['sourceUrl'] = ''),
      (this['sourceLocalPath'] = ''),
      (this['ensureLocalSource'] = null),
      (this['wrapperEl'] = null),
      (this['mediaCardEl'] = null),
      (this['previewEl'] = null),
      (this['barEl'] = null),
      (this['canvasEl'] = null),
      (this['videoEl'] = null),
      (this['loadingEl'] = null),
      (this['toolbarEl'] = null),
      (this['trackEl'] = null),
      (this['selectionEl'] = null),
      (this['leftHandleEl'] = null),
      (this['rightHandleEl'] = null),
      (this['playheadEl'] = null),
      (this['timelineLabelEl'] = null),
      (this['thumbEls'] = null),
      (this['rangeLabelEl'] = null),
      (this['outputLabelEl'] = null),
      (this['playButtonEl'] = null),
      (this['sizeButtonEl'] = null),
      (this['fpsButtonEl'] = null),
      (this['qualityButtonEl'] = null),
      (this['limitSizeButtonEl'] = null),
      (this['generateButtonEl'] = null),
      (this['_busy'] = ![]));
  },
};
export default VideoGifController;

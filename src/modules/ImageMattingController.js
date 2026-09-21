import appStore from '../core/stores/appStore.js';
import { onLocaleChange, t } from '../i18n/index.js';
import { saveOutputBlob } from './project.js';
import { generateId, screenToWorld, worldToScreen, isPointInRect } from '../core/math.js';
import { commit } from './history.js';
import {
  buildBinaryBoundaryMask,
  floodFillRegion,
  getCachedSealedFillRegion,
  paintFilledRegion,
  sealRegionToBoundary,
} from './bucketFill.js';
import {
  IMAGE_BRUSH_MAX_SIZE_PX,
  clampImageBrushSize,
  drawRoundBrushStroke,
  getEraserClearLineWidth,
  getBrushLineWidth,
  mapBrushPoints,
  syncCircularBrushCursor,
} from './imageEditorBrushStyle.js';
import { getPixelToolPalette } from './pixelToolPalette.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../utils/localMediaPath.js';
const getCssVar = (_0x473875) =>
    getComputedStyle(document.documentElement).getPropertyValue(_0x473875).trim(),
  DEFAULT_MATTING_BRUSH_SIZE_PX = 40,
  MAX_MATTING_BRUSH_SIZE_PX = IMAGE_BRUSH_MAX_SIZE_PX,
  OPAQUE_MASK_PREVIEW_CLEAR = 'black';
function imageMattingText(_0x214412, _0x5619fb = {}) {
  return t('imageMatting.' + _0x214412, _0x5619fb);
}
function clampMattingBrushSize(_0x1c0e18, _0x266794 = DEFAULT_MATTING_BRUSH_SIZE_PX) {
  return clampImageBrushSize(_0x1c0e18, _0x266794);
}
const isFiniteCommandPoint = (_0xc87fd4) =>
    Number.isFinite(Number(_0xc87fd4?.x)) && Number.isFinite(Number(_0xc87fd4?.y)),
  hasDrawableStrokePoints = (_0x121407) =>
    Array.isArray(_0x121407?.points) && _0x121407.points.some(isFiniteCommandPoint),
  shouldDiscardStrokeCommand = (_0x558327) =>
    (_0x558327?.type === 'brush' || _0x558327?.type === 'eraser') && !hasDrawableStrokePoints(_0x558327),
  MATTING_TOOLBAR_HTML =
    '\n      <button class="v2-matting-btn icon-only act-cancel" data-matting-tooltip="cancel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-matting-divider"></div>\n      <button class="v2-matting-btn icon-only tool-btn active" data-tool="brush" data-brush-mode="normal" data-matting-tooltip="brush">\n        <svg class="brush-icon-normal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>\n        <svg class="brush-icon-alpha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="display:none"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="M3 3h6v6H3z" fill="currentColor" fill-opacity="0.3"/></svg>\n      </button>\n      <button class="v2-matting-btn icon-only tool-btn" data-tool="eraser" data-matting-tooltip="eraser"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg></button>\n      <button class="v2-matting-btn icon-only tool-btn" data-tool="bucket" data-matting-tooltip="bucket"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 11l-8-8-8.5 8.5a2.12 2.12 0 0 0 0 3l4 4a2.12 2.12 0 0 0 3 0L19 11z"/><path d="M16 14l-3.5 3.5"/><path d="M12 18l-2 2"/><path d="M20 20l-2-2"/></svg></button>\n      <div class="v2-matting-divider"></div>\n      <div class="v2-matting-size"><span class="v2-matting-size-value"></span><input class="v2-matting-size-range" type="range" min="1" max="' +
    MAX_MATTING_BRUSH_SIZE_PX +
    '" step="1"></div>\n      <div class="v2-matting-divider"></div>\n      <button class="v2-matting-btn icon-only act-undo" data-matting-tooltip="undo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-matting-btn icon-only act-redo" data-matting-tooltip="redo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg></button>\n      <button class="v2-matting-btn icon-only act-clear" data-matting-tooltip="clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n      <button class="v2-matting-btn v2-matting-save act-save" data-matting-tooltip="save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v4h8"/></svg><span class="v2-matting-save-label"></span></button>\n    ',
  ImageMattingController = {
    active: false,
    nodeId: null,
    nodeData: null,
    overlayEl: null,
    containerEl: null,
    imgEl: null,
    canvasEl: null,
    toolbarEl: null,
    sizeValueEl: null,
    sizeRangeEl: null,
    toolButtons: null,
    cursorEl: null,
    _cursorHover: false,
    _cursorLast: { x: 0, y: 0 },
    _cursorRaf: 0,
    _unsubscribe: null,
    _commands: [],
    _redoStack: [],
    _draft: null,
    _dirty: false,
    _baseMaskCleared: false,
    _view: null,
    _normalMaskCanvas: null,
    _normalOverlayCanvas: null,
    _alphaMaskCanvas: null,
    _alphaOverlayCanvas: null,
    _fillRegionCache: null,
    _unsubscribeLocale: null,
    _isSaving: false,
    init(_0x5d135b) {
      if (this.active) return;
      const _0x5bd6d3 = appStore.getStateRaw(),
        _0x4acbc3 = _0x5bd6d3.nodes?.[_0x5d135b];
      if (!_0x4acbc3) return;
      const _0x35f6f2 = this._resolveNodeImageUrl(_0x4acbc3);
      if (!_0x35f6f2) {
        window.showToast?.(imageMattingText('toasts.noImage'), 'warn');
        return;
      }
      const _0x3c7157 = new Set(['brush', 'eraser', 'bucket']),
        _0x100e02 = _0x3c7157.has(_0x5bd6d3.matting?.tool) ? _0x5bd6d3.matting.tool : 'brush',
        _0x355cf8 = clampMattingBrushSize(_0x5bd6d3.matting?.brushSizePx),
        _0x2d228b = _0x5bd6d3.matting?.brushMode || 'normal';
      ((this.active = true),
        (this.nodeId = _0x5d135b),
        (this.nodeData = _0x4acbc3),
        (this._commands = []),
        (this._redoStack = []),
        (this._draft = null),
        (this._dirty = false),
        (this._baseMaskCleared = false),
        (this._fillRegionCache = new Map()),
        (this._isSaving = false),
        (this._view = {
          tool: _0x100e02,
          brushSizePx: _0x355cf8,
          brushMode: _0x2d228b,
          viewport: _0x5bd6d3.viewport,
          node: _0x4acbc3,
        }),
        appStore.setMattingState({
          active: true,
          nodeId: _0x5d135b,
          tool: _0x100e02,
          brushSizePx: _0x355cf8,
          brushMode: _0x2d228b,
        }),
        this._createUI(_0x35f6f2, { tool: _0x100e02, brushSizePx: _0x355cf8, brushMode: _0x2d228b }),
        this._loadExistingMask(),
        this._bindEvents(),
        (this._unsubscribe = appStore.subscribeSelector(
          (_0x122f7e) => {
            const _0x252e3a = _0x122f7e.nodes?.[_0x5d135b],
              _0x487e62 = _0x122f7e.viewport || { x: 0, y: 0, zoom: 1 },
              _0x26ce9c = _0x122f7e.matting || {};
            return {
              hasNode: !!_0x252e3a,
              nx: _0x252e3a ? _0x252e3a.x : 0,
              ny: _0x252e3a ? _0x252e3a.y : 0,
              nw: _0x252e3a ? _0x252e3a.width : 0,
              nh: _0x252e3a ? _0x252e3a.height : 0,
              vx: _0x487e62.x,
              vy: _0x487e62.y,
              vz: _0x487e62.zoom || 1,
              tool: _0x26ce9c.tool || 'brush',
              brushSizePx: clampMattingBrushSize(_0x26ce9c.brushSizePx),
              brushMode: _0x26ce9c.brushMode || 'normal',
            };
          },
          (_0x29e448) => {
            if (!_0x29e448?.hasNode) return;
            ((this._view = {
              tool: _0x29e448.tool,
              brushSizePx: _0x29e448.brushSizePx,
              brushMode: _0x29e448.brushMode,
              viewport: { x: _0x29e448.vx, y: _0x29e448.vy, zoom: _0x29e448.vz },
              node: { x: _0x29e448.nx, y: _0x29e448.ny, width: _0x29e448.nw, height: _0x29e448.nh },
            }),
              this._updateView(this._view));
          },
        )),
        this._waitForImageAndShow());
    },
    _waitForImageAndShow() {
      const _0x18751b = () => {
        if (this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0) {
          if (this._view) this._updateView(this._view);
          requestAnimationFrame(() => {
            if (this.overlayEl) this.overlayEl.classList.add('visible');
          });
        } else requestAnimationFrame(_0x18751b);
      };
      _0x18751b();
    },
    exit({ silent: silent = false } = {}) {
      if (!this.active) return;
      !silent && this._dirty && window.showToast?.(imageMattingText('toasts.cancelled'), 'ok');
      ((this.active = false),
        (this.nodeId = null),
        (this.nodeData = null),
        (this._commands = []),
        (this._redoStack = []),
        (this._draft = null),
        (this._dirty = false),
        (this._normalMaskCanvas = null),
        (this._normalOverlayCanvas = null),
        (this._alphaMaskCanvas = null),
        (this._alphaOverlayCanvas = null),
        this._unsubscribeLocale?.(),
        (this._unsubscribeLocale = null),
        (this._isSaving = false),
        (this._fillRegionCache = null),
        appStore.setMattingState({ active: false, nodeId: null }));
      this._unsubscribe && (this._unsubscribe(), (this._unsubscribe = null));
      if (this.overlayEl) this.overlayEl.remove();
      if (this.toolbarEl) this.toolbarEl.remove();
      ((this.overlayEl = null),
        (this.containerEl = null),
        (this.imgEl = null),
        (this.canvasEl = null),
        (this.toolbarEl = null),
        (this.sizeValueEl = null),
        (this.sizeRangeEl = null),
        (this.toolButtons = null),
        (this.cursorEl = null),
        (this._cursorHover = false),
        (this._cursorLast = { x: 0, y: 0 }),
        (this._cursorRaf = 0),
        (this._view = null));
    },
    _createUI(_0x55a80e, _0x3b1009 = {}) {
      const _0x54aa85 = document.createElement('div');
      _0x54aa85.className = 'v2-matting-overlay';
      const _0x4cab8b = document.createElement('div');
      _0x4cab8b.className = 'v2-matting-container';
      const _0x3685a2 = document.createElement('img');
      ((_0x3685a2.className = 'v2-matting-img'), (_0x3685a2.src = _0x55a80e), (_0x3685a2.draggable = false));
      const _0x27efe7 = document.createElement('canvas');
      _0x27efe7.className = 'v2-matting-canvas';
      const _0x20fb67 = document.createElement('div');
      ((_0x20fb67.className = 'v2-matting-cursor'),
        (_0x20fb67.style.display = 'none'),
        _0x4cab8b.appendChild(_0x3685a2),
        _0x4cab8b.appendChild(_0x27efe7),
        _0x54aa85.appendChild(_0x20fb67),
        _0x54aa85.appendChild(_0x4cab8b),
        document.body.appendChild(_0x54aa85),
        (this.overlayEl = _0x54aa85),
        (this.containerEl = _0x4cab8b),
        (this.imgEl = _0x3685a2),
        (this.canvasEl = _0x27efe7),
        (this.cursorEl = _0x20fb67));
      const _0x53d86e = document.createElement('div');
      ((_0x53d86e.className = 'v2-matting-toolbar'),
        (_0x53d86e.innerHTML = MATTING_TOOLBAR_HTML),
        document.body.appendChild(_0x53d86e),
        (this.toolbarEl = _0x53d86e),
        (this.sizeValueEl = _0x53d86e.querySelector('.v2-matting-size-value')),
        (this.sizeRangeEl = _0x53d86e.querySelector('.v2-matting-size-range')),
        (this.toolButtons = Array.from(_0x53d86e.querySelectorAll('.tool-btn'))),
        this._subscribeLocaleChanges(),
        this._syncLocaleTexts());
      const _0x1151f6 = clampMattingBrushSize(_0x3b1009.brushSizePx),
        _0x15a38f = _0x3b1009.tool || 'brush';
      ((this.sizeRangeEl.value = String(_0x1151f6)),
        (this.sizeValueEl.textContent = String(_0x1151f6)),
        this._updateToolActive(_0x15a38f, _0x1151f6));
      if (this._view) this._updateView(this._view);
    },
    _bindEvents() {
      const _0x238394 = (_0x701c29) => {
        const _0x3e7810 =
          this.canvasEl && (_0x701c29.target === this.canvasEl || this.canvasEl.contains(_0x701c29.target));
        if (_0x3e7810) {
          this._onCanvasWheel(_0x701c29);
          return;
        }
        (_0x701c29.preventDefault(), _0x701c29.stopPropagation());
      };
      this.overlayEl.addEventListener('wheel', _0x238394, { passive: false });
      const _0x3e2524 = () => {
        if (this._view) this._updateView(this._view);
      };
      window.addEventListener('resize', _0x3e2524);
      const _0x338b27 = () => {
          (window.removeEventListener('resize', _0x3e2524),
            this.overlayEl?.removeEventListener('wheel', _0x238394));
        },
        _0x39fecb = this.exit.bind(this);
      ((this.exit = (_0x3f9c4a = {}) => {
        (_0x338b27(), _0x39fecb(_0x3f9c4a));
      }),
        this.toolbarEl.addEventListener('pointerdown', (_0x1c7a0b) => _0x1c7a0b.stopPropagation()),
        this.toolbarEl.querySelector('.act-cancel').addEventListener('click', (_0x43a4ff) => {
          (_0x43a4ff.stopPropagation(), this.exit());
        }),
        this.toolButtons.forEach((_0x266c18) => {
          _0x266c18.addEventListener('click', (_0x4c686c) => {
            _0x4c686c.stopPropagation();
            const _0x1ffb8c = _0x266c18.dataset.tool;
            this._switchTool(_0x1ffb8c);
          });
        }),
        this.sizeRangeEl.addEventListener('input', (_0x165092) => {
          const _0x10b88c = clampMattingBrushSize(_0x165092.target.value, 1);
          (appStore.setMattingState({ brushSizePx: _0x10b88c }),
            (this.sizeValueEl.textContent = String(_0x10b88c)),
            this._syncCursor());
        }),
        this.toolbarEl.querySelector('.act-undo').addEventListener('click', (_0x339753) => {
          (_0x339753.stopPropagation(), this._undo());
        }),
        this.toolbarEl.querySelector('.act-redo').addEventListener('click', (_0x4f242d) => {
          (_0x4f242d.stopPropagation(), this._redo());
        }),
        this.toolbarEl.querySelector('.act-clear').addEventListener('click', (_0x125e6d) => {
          (_0x125e6d.stopPropagation(), this._clear());
        }),
        this.toolbarEl.querySelector('.act-save').addEventListener('click', async (_0x5702f9) => {
          (_0x5702f9.stopPropagation(), await this._save());
        }));
      const _0x14732f = this.canvasEl.getContext('2d');
      ((_0x14732f.lineCap = 'round'), (_0x14732f.lineJoin = 'round'));
      const _0x34815a = { down: false, pointerId: null },
        _0x14c1d7 = (_0x4d7886, _0x27b9f1) => {
          this._cursorLast = { x: _0x4d7886, y: _0x27b9f1 };
          if (this._cursorRaf) return;
          this._cursorRaf = requestAnimationFrame(() => {
            ((this._cursorRaf = 0), this._syncCursor());
          });
        },
        _0x11f6e0 = (_0x58b864, _0x4be19f, _0x14ca76, _0x8bf57b = 0) => {
          const _0x4ca64e = appStore.getStateRaw(),
            _0x5a12bc = _0x4ca64e.nodes?.[this.nodeId];
          if (!_0x5a12bc) return false;
          const _0x2cb614 = screenToWorld(_0x58b864, _0x4be19f, _0x4ca64e.viewport);
          if (
            !isPointInRect(
              _0x2cb614.x,
              _0x2cb614.y,
              _0x5a12bc.x,
              _0x5a12bc.y,
              _0x5a12bc.width,
              _0x5a12bc.height,
            )
          )
            return false;
          const _0x13594f = { x: _0x2cb614.x - _0x5a12bc.x, y: _0x2cb614.y - _0x5a12bc.y },
            _0x45b2d2 = _0x4ca64e.matting?.tool || 'brush';
          if (_0x45b2d2 === 'bucket') {
            const _0x32da84 = clampMattingBrushSize(_0x4ca64e.matting?.brushSizePx),
              _0x599f07 = _0x32da84 / (_0x4ca64e.viewport.zoom || 1);
            return (this._fillArea(_0x13594f, _0x599f07), true);
          }
          const _0x3fd9cc = clampMattingBrushSize(_0x4ca64e.matting?.brushSizePx),
            _0x3a8a23 = _0x3fd9cc / (_0x4ca64e.viewport.zoom || 1),
            _0x255219 = _0x4ca64e.matting?.brushMode || 'normal';
          return (
            _0x45b2d2 === 'eraser'
              ? (this._draft = { type: 'eraser', sizeWorld: _0x3a8a23, points: [_0x13594f] })
              : (this._draft = { type: 'brush', sizeWorld: _0x3a8a23, points: [_0x13594f], mode: _0x255219 }),
            (_0x34815a.down = true),
            (_0x34815a.pointerId = _0x14ca76),
            this.canvasEl.setPointerCapture(_0x14ca76),
            this._render(),
            true
          );
        },
        _0x13d8f7 = (_0x266245, _0x14d769) => {
          if (!_0x34815a.down || !this._draft) return;
          const _0x4924d4 = appStore.getStateRaw(),
            _0x29a64d = _0x4924d4.nodes?.[this.nodeId];
          if (!_0x29a64d) return;
          const _0x48a96c = screenToWorld(_0x266245, _0x14d769, _0x4924d4.viewport),
            _0x35ea73 = { x: _0x48a96c.x - _0x29a64d.x, y: _0x48a96c.y - _0x29a64d.y };
          (this._draft.points.push(_0x35ea73), this._render());
        },
        _0x1fdfb1 = () => {
          if (!_0x34815a.down || !this._draft) return;
          const _0x353d12 = this._draft;
          ((this._draft = null), (_0x34815a.down = false), (_0x34815a.pointerId = null));
          if (shouldDiscardStrokeCommand(_0x353d12)) {
            this._render();
            return;
          }
          (this._commands.push(_0x353d12), (this._redoStack = []), (this._dirty = true), this._render());
        };
      (this.canvasEl.addEventListener('pointerdown', (_0x447c07) => {
        (_0x447c07.preventDefault(),
          _0x447c07.stopPropagation(),
          _0x14c1d7(_0x447c07.clientX, _0x447c07.clientY),
          _0x11f6e0(_0x447c07.clientX, _0x447c07.clientY, _0x447c07.pointerId, _0x447c07.button));
      }),
        this.canvasEl.addEventListener('pointermove', (_0x16334b) => {
          (_0x16334b.preventDefault(),
            _0x16334b.stopPropagation(),
            _0x14c1d7(_0x16334b.clientX, _0x16334b.clientY),
            _0x13d8f7(_0x16334b.clientX, _0x16334b.clientY));
        }),
        this.canvasEl.addEventListener('pointerup', (_0x3a6e82) => {
          (_0x3a6e82.preventDefault(),
            _0x3a6e82.stopPropagation(),
            _0x14c1d7(_0x3a6e82.clientX, _0x3a6e82.clientY),
            _0x1fdfb1());
        }),
        this.canvasEl.addEventListener('pointercancel', (_0x75bc35) => {
          (_0x75bc35.preventDefault(),
            _0x75bc35.stopPropagation(),
            _0x14c1d7(_0x75bc35.clientX, _0x75bc35.clientY),
            _0x1fdfb1());
        }),
        this.canvasEl.addEventListener('pointerenter', (_0x304e94) => {
          ((this._cursorHover = true), _0x14c1d7(_0x304e94.clientX, _0x304e94.clientY));
        }),
        this.canvasEl.addEventListener('pointerleave', () => {
          ((this._cursorHover = false), this._syncCursor());
        }));
    },
    _onCanvasWheel(_0x8ed980) {
      (_0x8ed980.preventDefault(), _0x8ed980.stopPropagation());
      if (!this.active) return;
      if (!this._cursorHover) return;
      const _0x2878a4 = this._view?.tool || 'brush';
      if (_0x2878a4 !== 'brush' && _0x2878a4 !== 'eraser' && _0x2878a4 !== 'bucket') return;
      const _0x1673b9 = _0x8ed980.deltaY || 0,
        _0x1da027 = _0x1673b9 < 0 ? 1 : -1,
        _0x505034 = clampMattingBrushSize(this._view?.brushSizePx),
        _0x256480 = clampMattingBrushSize(_0x505034 + _0x1da027 * 2);
      if (_0x256480 === _0x505034) return;
      appStore.setMattingState({ brushSizePx: _0x256480 });
      if (this.sizeRangeEl) this.sizeRangeEl.value = String(_0x256480);
      if (this.sizeValueEl) this.sizeValueEl.textContent = String(_0x256480);
      this._syncCursor();
    },
    _syncCursor(
      _0x5a0789 = this._view?.tool || 'brush',
      _0x3e4aec = this._view?.brushSizePx || DEFAULT_MATTING_BRUSH_SIZE_PX,
    ) {
      if (!this.cursorEl) return;
      syncCircularBrushCursor({
        cursorEl: this.cursorEl,
        canvasEl: this.canvasEl,
        visible: this._cursorHover,
        tool: _0x5a0789,
        allowedTools: ['brush', 'eraser', 'bucket'],
        sizePx: _0x3e4aec,
        cursorLast: this._cursorLast,
      });
    },
    _subscribeLocaleChanges() {
      if (this._unsubscribeLocale) return;
      this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
    },
    _syncLocaleTexts() {
      if (!this.toolbarEl) return;
      this.toolbarEl.querySelectorAll('[data-matting-tooltip]').forEach((_0x4d2a7b) => {
        const _0x2cd96e = _0x4d2a7b.dataset.mattingTooltip;
        if (!_0x2cd96e) return;
        let _0x2151e3 = imageMattingText('tooltips.' + _0x2cd96e);
        (_0x2cd96e === 'brush' &&
          (_0x2151e3 =
            _0x4d2a7b.dataset.brushMode === 'alpha'
              ? imageMattingText('tooltips.brushAlphaToggle')
              : imageMattingText('tooltips.brushNormal')),
          (_0x4d2a7b.dataset.tooltip = _0x2151e3));
      });
      const _0x5ec3c9 = this.toolbarEl.querySelector('.v2-matting-save-label');
      _0x5ec3c9 && !this._isSaving && (_0x5ec3c9.textContent = imageMattingText('actions.save'));
    },
    _switchTool(_0x3cc2f1) {
      const _0x576d16 = this.toolButtons.find((_0x388e83) => _0x388e83.dataset.tool === _0x3cc2f1);
      if (!_0x576d16) return;
      if (_0x576d16.disabled) return;
      const _0x16ac96 = appStore.getState(),
        _0x2339fd = _0x16ac96.matting?.tool;
      if (_0x3cc2f1 === 'brush') {
        if (_0x2339fd === 'brush') {
          const _0x1c2770 = _0x576d16.dataset.brushMode || 'normal',
            _0x1ec52e = _0x1c2770 === 'normal' ? 'alpha' : 'normal';
          ((_0x576d16.dataset.brushMode = _0x1ec52e),
            appStore.setMattingState({ tool: _0x3cc2f1, brushMode: _0x1ec52e }),
            (_0x576d16.dataset.tooltip =
              _0x1ec52e === 'normal'
                ? imageMattingText('tooltips.brushNormalToggle')
                : imageMattingText('tooltips.brushAlphaToggle')));
          const _0x193634 = _0x576d16.querySelector('.brush-icon-normal'),
            _0x1503c8 = _0x576d16.querySelector('.brush-icon-alpha');
          _0x193634 &&
            _0x1503c8 &&
            ((_0x193634.style.display = _0x1ec52e === 'normal' ? 'block' : 'none'),
            (_0x1503c8.style.display = _0x1ec52e === 'alpha' ? 'block' : 'none'));
        } else appStore.setMattingState({ tool: _0x3cc2f1 });
      } else appStore.setMattingState({ tool: _0x3cc2f1 });
      this._updateToolActive();
    },
    _changeBrushSize(_0x3f2793) {
      const _0x238b78 = clampMattingBrushSize(this._view?.brushSizePx),
        _0x8eb6e7 = clampMattingBrushSize(_0x238b78 + _0x3f2793);
      if (_0x8eb6e7 !== _0x238b78) {
        appStore.setMattingState({ brushSizePx: _0x8eb6e7 });
        if (this.sizeRangeEl) this.sizeRangeEl.value = String(_0x8eb6e7);
        if (this.sizeValueEl) this.sizeValueEl.textContent = String(_0x8eb6e7);
        this._syncCursor();
      }
    },
    _updateToolActive(
      _0x446c28 = this._view?.tool || 'brush',
      _0x35cf63 = this._view?.brushSizePx || DEFAULT_MATTING_BRUSH_SIZE_PX,
    ) {
      (this.toolButtons.forEach((_0x3f3678) => {
        if (_0x3f3678.dataset.tool === _0x446c28) _0x3f3678.classList.add('active');
        else _0x3f3678.classList.remove('active');
      }),
        this._syncCursor(_0x446c28, _0x35cf63));
    },
    _updateView(_0x496a66) {
      if (!this.active) return;
      const _0x24dead = _0x496a66?.node,
        _0x58bf89 = _0x496a66?.viewport;
      if (!_0x24dead) return;
      this.nodeData = _0x24dead;
      const _0x174230 = clampMattingBrushSize(_0x496a66?.brushSizePx);
      if (this.sizeRangeEl && Number(this.sizeRangeEl.value) !== _0x174230)
        this.sizeRangeEl.value = String(_0x174230);
      if (this.sizeValueEl && this.sizeValueEl.textContent !== String(_0x174230))
        this.sizeValueEl.textContent = String(_0x174230);
      this._updateToolActive(_0x496a66?.tool, _0x174230);
      const _0x31b047 = worldToScreen(_0x24dead.x, _0x24dead.y, _0x58bf89),
        _0x2f5af1 = Math.round(_0x24dead.width * _0x58bf89.zoom),
        _0x594f18 = Math.round(_0x24dead.height * _0x58bf89.zoom);
      ((this.containerEl.style.left = Math.round(_0x31b047.x) + 'px'),
        (this.containerEl.style.top = Math.round(_0x31b047.y) + 'px'),
        (this.containerEl.style.width = _0x2f5af1 + 'px'),
        (this.containerEl.style.height = _0x594f18 + 'px'));
      const _0xc90c76 = window.devicePixelRatio || 1,
        _0xbc1423 = Math.max(1, _0x2f5af1),
        _0x42e824 = Math.max(1, _0x594f18);
      if (
        this.canvasEl.width !== Math.round(_0xbc1423 * _0xc90c76) ||
        this.canvasEl.height !== Math.round(_0x42e824 * _0xc90c76)
      ) {
        ((this.canvasEl.width = Math.round(_0xbc1423 * _0xc90c76)),
          (this.canvasEl.height = Math.round(_0x42e824 * _0xc90c76)),
          (this.canvasEl.style.width = _0xbc1423 + 'px'),
          (this.canvasEl.style.height = _0x42e824 + 'px'));
        const _0x2cd88c = this.canvasEl.getContext('2d');
        (_0x2cd88c.setTransform(_0xc90c76, 0, 0, _0xc90c76, 0, 0),
          (_0x2cd88c.lineCap = 'round'),
          (_0x2cd88c.lineJoin = 'round'));
      }
      const _0x1a39bf = Math.max(12, Math.round(_0x31b047.y) - 54);
      ((this.toolbarEl.style.left = Math.round(_0x31b047.x + _0x2f5af1 / 2) + 'px'),
        (this.toolbarEl.style.top = _0x1a39bf + 'px'),
        this._render(_0x58bf89));
    },
    _render(_0x1eb6bd = this._view?.viewport) {
      if (!this.active || !this.canvasEl) return;
      const _0x44bb81 = this.canvasEl.getContext('2d'),
        _0x441573 = Number(this.canvasEl.style.width.replace('px', '')) || 1,
        _0x283f96 = Number(this.canvasEl.style.height.replace('px', '')) || 1;
      _0x44bb81.clearRect(0, 0, _0x441573, _0x283f96);
      const _0x2dcdfa = this._commands,
        _0xb6a84d = this._prepareNormalMaskCanvas(_0x441573, _0x283f96),
        _0x5ce53a = this._prepareAlphaMaskCanvas(_0x441573, _0x283f96);
      this._renderCommands(_0x44bb81, _0x1eb6bd, _0x2dcdfa, false, {
        normalMaskCtx: _0xb6a84d,
        alphaMaskCtx: _0x5ce53a,
        boundarySource: _0x2dcdfa,
      });
      if (this._draft) {
        const _0x2a9937 = _0x2dcdfa.concat([this._draft]);
        this._renderCommands(_0x44bb81, _0x1eb6bd, [this._draft], true, {
          normalMaskCtx: _0xb6a84d,
          alphaMaskCtx: _0x5ce53a,
          boundarySource: _0x2a9937,
        });
      }
      (this._compositeNormalMask(_0x44bb81, _0x441573, _0x283f96),
        this._compositeAlphaMask(_0x44bb81, _0x1eb6bd, _0x441573, _0x283f96));
    },
    _prepareNormalMaskCanvas(_0x5074a7, _0x19b332) {
      const _0x34a9fb = Math.max(1, Math.round(_0x5074a7 || 1)),
        _0x4376c4 = Math.max(1, Math.round(_0x19b332 || 1));
      if (
        !this._normalMaskCanvas ||
        this._normalMaskCanvas.width !== _0x34a9fb ||
        this._normalMaskCanvas.height !== _0x4376c4
      ) {
        const _0x539ed3 = document.createElement('canvas');
        ((_0x539ed3.width = _0x34a9fb), (_0x539ed3.height = _0x4376c4), (this._normalMaskCanvas = _0x539ed3));
      }
      if (
        !this._normalOverlayCanvas ||
        this._normalOverlayCanvas.width !== _0x34a9fb ||
        this._normalOverlayCanvas.height !== _0x4376c4
      ) {
        const _0x5e78af = document.createElement('canvas');
        ((_0x5e78af.width = _0x34a9fb),
          (_0x5e78af.height = _0x4376c4),
          (this._normalOverlayCanvas = _0x5e78af));
      }
      const _0x5a2cc2 = this._normalMaskCanvas.getContext('2d');
      if (!_0x5a2cc2) return null;
      return (
        _0x5a2cc2.clearRect(0, 0, _0x34a9fb, _0x4376c4),
        (_0x5a2cc2.lineCap = 'round'),
        (_0x5a2cc2.lineJoin = 'round'),
        _0x5a2cc2
      );
    },
    _prepareAlphaMaskCanvas(_0x16deef, _0x4e4e7f) {
      const _0x4e4fb1 = Math.max(1, Math.round(_0x16deef || 1)),
        _0x3f2680 = Math.max(1, Math.round(_0x4e4e7f || 1));
      if (
        !this._alphaMaskCanvas ||
        this._alphaMaskCanvas.width !== _0x4e4fb1 ||
        this._alphaMaskCanvas.height !== _0x3f2680
      ) {
        const _0x371d10 = document.createElement('canvas');
        ((_0x371d10.width = _0x4e4fb1), (_0x371d10.height = _0x3f2680), (this._alphaMaskCanvas = _0x371d10));
      }
      if (
        !this._alphaOverlayCanvas ||
        this._alphaOverlayCanvas.width !== _0x4e4fb1 ||
        this._alphaOverlayCanvas.height !== _0x3f2680
      ) {
        const _0x284ad8 = document.createElement('canvas');
        ((_0x284ad8.width = _0x4e4fb1),
          (_0x284ad8.height = _0x3f2680),
          (this._alphaOverlayCanvas = _0x284ad8));
      }
      const _0x5b3cbc = this._alphaMaskCanvas.getContext('2d');
      if (!_0x5b3cbc) return null;
      return (
        _0x5b3cbc.clearRect(0, 0, _0x4e4fb1, _0x3f2680),
        (_0x5b3cbc.lineCap = 'round'),
        (_0x5b3cbc.lineJoin = 'round'),
        _0x5b3cbc
      );
    },
    _compositeNormalMask(_0x487f19, _0x2b856b, _0x35b641) {
      if (!_0x487f19 || !this._normalMaskCanvas || !this._normalOverlayCanvas) return;
      const _0x19ec9a = Math.max(1, Number(_0x2b856b) || 1),
        _0x48a915 = Math.max(1, Number(_0x35b641) || 1),
        _0x593298 = this._normalOverlayCanvas.getContext('2d');
      if (!_0x593298) return;
      const _0x17813b = getPixelToolPalette();
      (_0x593298.clearRect(0, 0, _0x19ec9a, _0x48a915),
        _0x593298.save(),
        (_0x593298.globalCompositeOperation = 'source-over'),
        (_0x593298.globalAlpha = 1),
        (_0x593298.fillStyle = _0x17813b.maskPreviewFill),
        _0x593298.fillRect(0, 0, _0x19ec9a, _0x48a915),
        (_0x593298.globalCompositeOperation = 'destination-in'),
        _0x593298.drawImage(this._normalMaskCanvas, 0, 0, _0x19ec9a, _0x48a915),
        _0x593298.restore(),
        _0x487f19.save(),
        (_0x487f19.globalCompositeOperation = 'source-over'),
        (_0x487f19.globalAlpha = 1),
        _0x487f19.drawImage(this._normalOverlayCanvas, 0, 0, _0x19ec9a, _0x48a915),
        _0x487f19.restore());
    },
    _compositeAlphaMask(_0x19e0a4, _0x315e86, _0x19a3ae, _0x47247e) {
      if (!_0x19e0a4 || !this._alphaMaskCanvas || !this._alphaOverlayCanvas) return;
      const _0x37c22a = Math.max(1, Number(_0x19a3ae) || 1),
        _0x3120c3 = Math.max(1, Number(_0x47247e) || 1),
        _0x598ae1 = this._alphaOverlayCanvas.getContext('2d');
      if (!_0x598ae1) return;
      _0x598ae1.clearRect(0, 0, _0x37c22a, _0x3120c3);
      const _0x4cbda0 = _0x315e86?.zoom || 1,
        _0x5dcb70 = this._createCheckerboardPattern(_0x598ae1, _0x4cbda0);
      (_0x598ae1.save(),
        (_0x598ae1.globalCompositeOperation = 'source-over'),
        (_0x598ae1.globalAlpha = 0.8),
        (_0x598ae1.fillStyle = _0x5dcb70),
        _0x598ae1.fillRect(0, 0, _0x37c22a, _0x3120c3),
        (_0x598ae1.globalCompositeOperation = 'destination-in'),
        (_0x598ae1.globalAlpha = 1),
        _0x598ae1.drawImage(this._alphaMaskCanvas, 0, 0, _0x37c22a, _0x3120c3),
        _0x598ae1.restore(),
        _0x19e0a4.save(),
        (_0x19e0a4.globalCompositeOperation = 'source-over'),
        (_0x19e0a4.globalAlpha = 1),
        _0x19e0a4.drawImage(this._alphaOverlayCanvas, 0, 0, _0x37c22a, _0x3120c3),
        _0x19e0a4.restore());
    },
    _renderCommands(_0x563f4a, _0x5da41c, _0x4ca5f2, _0x3f7f70 = false, _0xf710fb = {}) {
      const _0x452622 = _0x5da41c.zoom || 1,
        _0x30522f = Number(this.canvasEl?.style?.width?.replace('px', '')) || 1,
        _0x1cf5df = Number(this.canvasEl?.style?.height?.replace('px', '')) || 1,
        _0x1fd7e7 = getPixelToolPalette(),
        _0x4868cc = _0xf710fb.normalMaskCtx || null,
        _0x549e12 = _0xf710fb.alphaMaskCtx || null,
        _0x2e4468 = Array.isArray(_0xf710fb.boundarySource) ? _0xf710fb.boundarySource : _0x4ca5f2;
      _0x4ca5f2.forEach((_0x5088c4, _0x422d4e) => {
        if (_0x5088c4.type === 'mask-preview') {
          if (!_0x5088c4.img) return;
          const _0x69d3d8 = Number(this.canvasEl?.style?.width?.replace('px', '')) || 1,
            _0x384263 = Number(this.canvasEl?.style?.height?.replace('px', '')) || 1;
          (_0x563f4a.save(),
            (_0x563f4a.globalCompositeOperation = 'source-over'),
            _0x563f4a.drawImage(_0x5088c4.img, 0, 0, _0x69d3d8, _0x384263),
            _0x563f4a.restore());
          return;
        }
        if (_0x5088c4.type === 'mask-base') {
          if (!_0x5088c4.canvas || !_0x4868cc) return;
          const _0x2f861b = Number(this.canvasEl?.style?.width?.replace('px', '')) || 1,
            _0x2abc32 = Number(this.canvasEl?.style?.height?.replace('px', '')) || 1;
          (_0x4868cc.save(),
            (_0x4868cc.globalCompositeOperation = 'source-over'),
            _0x4868cc.drawImage(_0x5088c4.canvas, 0, 0, _0x2f861b, _0x2abc32),
            _0x4868cc.restore());
          return;
        }
        if (_0x5088c4.type === 'brush') {
          _0x563f4a.save();
          const _0x59cf43 = _0x5088c4.mode === 'alpha',
            _0x242c7f = mapBrushPoints(_0x5088c4.points, _0x452622, _0x452622),
            _0x43c38a = getBrushLineWidth(_0x5088c4.sizeWorld, _0x452622, 'brush');
          if (_0x59cf43) {
            if (_0x549e12)
              (_0x549e12.save(),
                drawRoundBrushStroke(_0x549e12, {
                  points: _0x242c7f,
                  lineWidth: _0x43c38a,
                  strokeStyle: '#fff',
                  fillStyle: '#fff',
                  globalCompositeOperation: 'source-over',
                }),
                _0x549e12.restore());
            else {
              const _0xe8a48d = this._createCheckerboardPattern(_0x563f4a, _0x452622);
              drawRoundBrushStroke(_0x563f4a, {
                points: _0x242c7f,
                lineWidth: _0x43c38a,
                strokeStyle: _0xe8a48d,
                fillStyle: _0xe8a48d,
                globalCompositeOperation: 'source-over',
                globalAlpha: 0.8,
              });
            }
          } else
            _0x4868cc
              ? (_0x4868cc.save(),
                drawRoundBrushStroke(_0x4868cc, {
                  points: _0x242c7f,
                  lineWidth: _0x43c38a,
                  strokeStyle: '#fff',
                  fillStyle: '#fff',
                  globalCompositeOperation: 'source-over',
                }),
                _0x4868cc.restore())
              : (drawRoundBrushStroke(_0x563f4a, {
                  points: _0x242c7f,
                  lineWidth: getEraserClearLineWidth(_0x43c38a),
                  strokeStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  fillStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  globalCompositeOperation: 'destination-out',
                }),
                drawRoundBrushStroke(_0x563f4a, {
                  points: _0x242c7f,
                  lineWidth: _0x43c38a,
                  strokeStyle: _0x1fd7e7.maskPreviewFill,
                  fillStyle: _0x1fd7e7.maskPreviewFill,
                  globalCompositeOperation: 'source-over',
                  globalAlpha: 1,
                }));
          _0x563f4a.restore();
          return;
        }
        if (_0x5088c4.type === 'eraser') {
          const _0x366a01 = mapBrushPoints(_0x5088c4.points, _0x452622, _0x452622),
            _0x265560 = getEraserClearLineWidth(getBrushLineWidth(_0x5088c4.sizeWorld, _0x452622, 'eraser'));
          (_0x563f4a.save(),
            drawRoundBrushStroke(_0x563f4a, {
              points: _0x366a01,
              lineWidth: _0x265560,
              strokeStyle: '#000',
              fillStyle: '#000',
              globalCompositeOperation: 'destination-out',
            }),
            _0x563f4a.restore());
          _0x4868cc &&
            (_0x4868cc.save(),
            drawRoundBrushStroke(_0x4868cc, {
              points: _0x366a01,
              lineWidth: _0x265560,
              strokeStyle: '#000',
              fillStyle: '#000',
              globalCompositeOperation: 'destination-out',
            }),
            _0x4868cc.restore());
          _0x549e12 &&
            (_0x549e12.save(),
            drawRoundBrushStroke(_0x549e12, {
              points: _0x366a01,
              lineWidth: _0x265560,
              strokeStyle: '#000',
              fillStyle: '#000',
              globalCompositeOperation: 'destination-out',
            }),
            _0x549e12.restore());
          return;
        }
        if (_0x5088c4.type === 'fill') {
          const _0x96f0b = _0x5088c4.mode === 'alpha',
            _0x38b790 = Number(_0x5088c4.x ?? _0x5088c4.startPoint?.x) || 0,
            _0x641d38 = Number(_0x5088c4.y ?? _0x5088c4.startPoint?.y) || 0,
            _0x232e75 = _0x2e4468.indexOf(_0x5088c4),
            _0x41f3a0 = _0x232e75 >= 0 ? _0x2e4468.slice(0, _0x232e75) : _0x4ca5f2.slice(0, _0x422d4e),
            _0x14f35d = _0x41f3a0.filter(
              (_0x5dc15c) => _0x5dc15c?.type === 'brush' || _0x5dc15c?.type === 'eraser',
            ),
            _0x184a77 = Math.floor(_0x38b790 * _0x452622),
            _0x242388 = Math.floor(_0x641d38 * _0x452622),
            _0x5b4cfa = getCachedSealedFillRegion({
              cache: _0xf710fb.fillRegionCache || this._fillRegionCache,
              width: _0x30522f,
              height: _0x1cf5df,
              zoom: _0x452622,
              fillCommand: _0x5088c4,
              boundaryCommands: _0x14f35d,
              seedX: _0x184a77,
              seedY: _0x242388,
              extraKey: 'mode:' + (_0x5088c4.mode || ''),
              pointToPixel: (_0x1dc63a) => ({
                x: Number(_0x1dc63a?.x || 0) * _0x452622,
                y: Number(_0x1dc63a?.y || 0) * _0x452622,
              }),
              getStrokeWidth: (_0x3ea12d) =>
                getBrushLineWidth(_0x3ea12d?.sizeWorld, _0x452622, _0x3ea12d?.type),
            });
          if (_0x96f0b) {
            if (_0x549e12)
              paintFilledRegion(_0x549e12, _0x5b4cfa, _0x30522f, _0x1cf5df, {
                fillStyle: '#fff',
                globalCompositeOperation: 'source-over',
                globalAlpha: 1,
              });
            else {
              const _0xf8b49a = this._createCheckerboardPattern(_0x563f4a, _0x452622);
              paintFilledRegion(_0x563f4a, _0x5b4cfa, _0x30522f, _0x1cf5df, {
                fillStyle: _0xf8b49a,
                globalCompositeOperation: 'source-over',
                globalAlpha: 0.8,
              });
            }
          } else
            _0x4868cc
              ? paintFilledRegion(_0x4868cc, _0x5b4cfa, _0x30522f, _0x1cf5df, {
                  fillStyle: '#fff',
                  globalCompositeOperation: 'source-over',
                })
              : (paintFilledRegion(_0x563f4a, _0x5b4cfa, _0x30522f, _0x1cf5df, {
                  fillStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  globalCompositeOperation: 'destination-out',
                }),
                paintFilledRegion(_0x563f4a, _0x5b4cfa, _0x30522f, _0x1cf5df, {
                  fillStyle: _0x1fd7e7.selectionOverlay,
                  globalCompositeOperation: 'source-over',
                }));
          return;
        }
      });
    },
    _createCheckerboardPattern(_0x162613, _0x1ec954) {
      const _0x2bc560 = 8 * _0x1ec954,
        _0x2e3905 = document.createElement('canvas');
      ((_0x2e3905.width = _0x2bc560 * 2), (_0x2e3905.height = _0x2bc560 * 2));
      const _0x24cfc8 = _0x2e3905.getContext('2d'),
        _0x4391a9 = getPixelToolPalette();
      return (
        (_0x24cfc8.fillStyle = _0x4391a9.checkerLight),
        _0x24cfc8.fillRect(0, 0, _0x2bc560 * 2, _0x2bc560 * 2),
        (_0x24cfc8.fillStyle = _0x4391a9.checkerDark),
        _0x24cfc8.fillRect(0, 0, _0x2bc560, _0x2bc560),
        _0x24cfc8.fillRect(_0x2bc560, _0x2bc560, _0x2bc560, _0x2bc560),
        _0x162613.createPattern(_0x2e3905, 'repeat')
      );
    },
    _fillArea(_0x1b3faa, _0x15172a) {
      const _0x2ef24f = appStore.getState(),
        _0x3e3ede = _0x2ef24f.matting?.brushMode || 'normal',
        _0xab41b1 = {
          type: 'fill',
          x: Number(_0x1b3faa?.x) || 0,
          y: Number(_0x1b3faa?.y) || 0,
          mode: _0x3e3ede,
        };
      (this._commands.push(_0xab41b1), (this._redoStack = []), (this._dirty = true), this._render());
    },
    _undo() {
      if (this._commands.length === 0) return;
      const _0xe281d6 = this._commands.pop();
      (this._redoStack.push(_0xe281d6), (this._dirty = true), this._render());
    },
    _redo() {
      if (this._redoStack.length === 0) return;
      const _0x424aa0 = this._redoStack.pop();
      (this._commands.push(_0x424aa0), (this._dirty = true), this._render());
    },
    _clear() {
      if (this._commands.length === 0 && this._redoStack.length === 0) return;
      ((this._commands = []),
        (this._redoStack = []),
        (this._draft = null),
        (this._dirty = true),
        (this._baseMaskCleared = true),
        this._render());
    },
    async _save() {
      if (!this.active) return;
      const _0x3200ad = appStore.getState(),
        _0x34a2ff = _0x3200ad.nodes[this.nodeId];
      if (!_0x34a2ff) return;
      const _0x24d12c = this._resolveNodeImageUrl(_0x34a2ff);
      if (!_0x24d12c) return;
      const _0x1ee9b7 = this.toolbarEl.querySelector('.act-save'),
        _0x4e8055 = _0x1ee9b7.querySelector('span'),
        _0x5e429b = _0x4e8055 ? _0x4e8055.textContent : '';
      this._isSaving = true;
      if (_0x4e8055) _0x4e8055.textContent = imageMattingText('actions.saving');
      _0x1ee9b7.style.pointerEvents = 'none';
      try {
        const _0x36e423 = this.nodeId,
          _0x3ab4dc = Math.max(1, Number(_0x34a2ff.width) || 1),
          _0x2a260d = Math.max(1, Number(_0x34a2ff.height) || 1),
          _0x40b4c1 = generateId('mask_save'),
          _0x32c5e3 = this._commands
            .filter(
              (_0x536e42) =>
                _0x536e42 &&
                (_0x536e42.type === 'brush' || _0x536e42.type === 'eraser' || _0x536e42.type === 'fill'),
            )
            .map((_0x4f3bff) => {
              if (_0x4f3bff.type === 'fill')
                return {
                  type: 'fill',
                  x: Number(_0x4f3bff.x ?? _0x4f3bff.startPoint?.x) || 0,
                  y: Number(_0x4f3bff.y ?? _0x4f3bff.startPoint?.y) || 0,
                  mode: _0x4f3bff.mode,
                };
              return {
                type: _0x4f3bff.type,
                sizeWorld: Number(_0x4f3bff.sizeWorld) || 0,
                mode: _0x4f3bff.mode,
                points: Array.isArray(_0x4f3bff.points)
                  ? _0x4f3bff.points.map((_0x23f042) => ({ x: Number(_0x23f042.x), y: Number(_0x23f042.y) }))
                  : [],
              };
            });
        if (this._baseMaskCleared && _0x32c5e3.length === 0) {
          (appStore.updateNodeData(_0x36e423, {
            mask: '',
            maskPreview: '',
            maskPolarity: '',
            maskPreviewUrl: null,
            maskSaveToken: null,
          }),
            window._triggerLocalCacheSave?.(),
            this.exit({ silent: true }));
          return;
        }
        const _0x5c9f88 = this._baseMaskCleared ? '' : normalizeLocalPath(_0x34a2ff?.mask),
          _0x3fb1ca = await new Promise((_0x8baad0) => this.canvasEl.toBlob(_0x8baad0, 'image/png'));
        if (!_0x3fb1ca) throw new Error(imageMattingText('errors.canvasExportFailed'));
        const _0x336b8f = URL.createObjectURL(_0x3fb1ca);
        (appStore.updateNodeData(_0x36e423, { maskPreviewUrl: _0x336b8f, maskSaveToken: _0x40b4c1 }),
          window._triggerLocalCacheSave?.(),
          this.exit({ silent: true }),
          (async () => {
            const _0x474921 = await this._loadImage(_0x24d12c),
              _0x3131b2 = _0x474921.naturalWidth || _0x474921.width,
              _0x5ac767 = _0x474921.naturalHeight || _0x474921.height,
              _0x5e6b97 = Math.max(_0x3ab4dc / _0x3131b2, _0x2a260d / _0x5ac767) || 1,
              _0x1d3ed9 = _0x3131b2 * _0x5e6b97,
              _0x24dc23 = _0x5ac767 * _0x5e6b97,
              _0x2cbba3 = (_0x3ab4dc - _0x1d3ed9) / 2,
              _0x2f5c97 = (_0x2a260d - _0x24dc23) / 2,
              _0x50915c = (_0x8ab172) => {
                const _0x369ba5 = (Number(_0x8ab172?.x) - _0x2cbba3) / _0x5e6b97,
                  _0x48f3cf = (Number(_0x8ab172?.y) - _0x2f5c97) / _0x5e6b97;
                return {
                  x: Math.max(0, Math.min(_0x3131b2 - 1, _0x369ba5)),
                  y: Math.max(0, Math.min(_0x5ac767 - 1, _0x48f3cf)),
                };
              },
              _0x58dc90 = document.createElement('canvas');
            ((_0x58dc90.width = _0x3131b2), (_0x58dc90.height = _0x5ac767));
            const _0x1ee56a = _0x58dc90.getContext('2d');
            _0x1ee56a.imageSmoothingEnabled = false;
            const _0x2f2f8a = getCssVar('--canvas-white'),
              _0x3cc024 = getCssVar('--canvas-black');
            ((_0x1ee56a.fillStyle = _0x3cc024), _0x1ee56a.fillRect(0, 0, _0x3131b2, _0x5ac767));
            if (_0x5c9f88)
              try {
                const _0x20f89e = await this._loadImage(localPathToUrl(_0x5c9f88));
                _0x1ee56a.drawImage(_0x20f89e, 0, 0, _0x3131b2, _0x5ac767);
                const _0x30c562 = appStore.getState().nodes?.[_0x36e423],
                  _0x2253e4 = String(_0x30c562?.maskPolarity || '').trim();
                _0x2253e4 !== 'paint-white' && this._invertCanvasBinary(_0x1ee56a);
              } catch (_0x29bcd1) {}
            const _0x260254 = (_0x548bd0, _0x228887, _0x491141 = 1) => {
              const _0x9f59af = (Array.isArray(_0x548bd0.points) ? _0x548bd0.points : []).map((_0x32a0b) =>
                _0x50915c(_0x32a0b),
              );
              if (!_0x9f59af.length) return;
              _0x1ee56a.save();
              const _0x24f07a = _0x491141 >= 6 ? 'eraser' : 'brush',
                _0x5c4302 = getBrushLineWidth(_0x548bd0.sizeWorld, 1 / _0x5e6b97, _0x24f07a);
              (drawRoundBrushStroke(_0x1ee56a, {
                points: _0x9f59af,
                lineWidth: _0x24f07a === 'eraser' ? getEraserClearLineWidth(_0x5c4302) : _0x5c4302,
                strokeStyle: _0x228887,
                fillStyle: _0x228887,
                globalCompositeOperation: 'source-over',
              }),
                _0x1ee56a.restore());
            };
            _0x32c5e3.forEach((_0x249793, _0x4d8f6b) => {
              if (!_0x249793) return;
              if (_0x249793.type === 'brush') {
                _0x260254(_0x249793, _0x2f2f8a, 1);
                return;
              }
              if (_0x249793.type === 'eraser') {
                _0x260254(_0x249793, _0x3cc024, 6);
                return;
              }
              if (_0x249793.type === 'fill') {
                const _0x27c9ad = _0x32c5e3
                    .slice(0, _0x4d8f6b)
                    .filter((_0x256220) => _0x256220?.type === 'brush' || _0x256220?.type === 'eraser'),
                  _0x338a37 = buildBinaryBoundaryMask({
                    width: _0x3131b2,
                    height: _0x5ac767,
                    commands: _0x27c9ad,
                    pointToPixel: (_0x318f7a) => {
                      const _0x3f6690 = _0x50915c(_0x318f7a || {});
                      return { x: _0x3f6690.x, y: _0x3f6690.y };
                    },
                    getStrokeWidth: (_0x3cfe92) =>
                      getBrushLineWidth(_0x3cfe92?.sizeWorld, 1 / _0x5e6b97, _0x3cfe92?.type),
                  }),
                  _0xb28f2b = _0x50915c({ x: _0x249793.x, y: _0x249793.y }),
                  _0x2f802b = floodFillRegion(
                    _0x338a37.mask,
                    _0x338a37.width,
                    _0x338a37.height,
                    Math.floor(_0xb28f2b.x),
                    Math.floor(_0xb28f2b.y),
                  ),
                  _0x14999a = sealRegionToBoundary(
                    _0x2f802b,
                    _0x338a37.mask,
                    _0x338a37.width,
                    _0x338a37.height,
                  );
                paintFilledRegion(_0x1ee56a, _0x14999a, _0x3131b2, _0x5ac767, {
                  fillStyle: _0x2f2f8a,
                  globalCompositeOperation: 'source-over',
                });
                return;
              }
            });
            const _0x19908d = _0x1ee56a.getImageData(0, 0, _0x3131b2, _0x5ac767).data,
              _0x558122 = Math.max(1, Math.floor(Math.max(_0x3131b2, _0x5ac767) / 0x100));
            let _0x5ceb34 = false;
            for (let _0x56177f = 0; _0x56177f < _0x5ac767 && !_0x5ceb34; _0x56177f += _0x558122) {
              for (let _0x32c654 = 0; _0x32c654 < _0x3131b2; _0x32c654 += _0x558122) {
                const _0x55c3fe = (_0x56177f * _0x3131b2 + _0x32c654) * 4,
                  _0x3c9688 = _0x19908d[_0x55c3fe],
                  _0x29da36 = _0x19908d[_0x55c3fe + 1],
                  _0x42fba0 = _0x19908d[_0x55c3fe + 2];
                if (_0x3c9688 > 5 || _0x29da36 > 5 || _0x42fba0 > 5) {
                  _0x5ceb34 = true;
                  break;
                }
              }
            }
            if (!_0x5ceb34) {
              const _0x58e44b = appStore.getState().nodes?.[_0x36e423];
              if (!_0x58e44b || _0x58e44b.maskSaveToken !== _0x40b4c1) {
                URL.revokeObjectURL(_0x336b8f);
                return;
              }
              (appStore.updateNodeData(_0x36e423, {
                mask: '',
                maskPreview: '',
                maskPolarity: '',
                maskPreviewUrl: null,
                maskSaveToken: null,
              }),
                appStore.setSelectedNodes([_0x36e423]),
                commit(),
                URL.revokeObjectURL(_0x336b8f),
                window._triggerLocalCacheSave?.());
              return;
            }
            const _0x3a3b1c = await new Promise((_0x3b3de4) => _0x58dc90.toBlob(_0x3b3de4, 'image/png'));
            if (!_0x3a3b1c) throw new Error(imageMattingText('errors.canvasExportFailed'));
            const _0x28efd7 = await saveOutputBlob(_0x3a3b1c, { ext: 'png', subDir: 'mask', kind: 'mask' }),
              _0x1b5af1 = pickResultLocalPath(_0x28efd7),
              _0x287bb2 = await saveOutputBlob(_0x3fb1ca, { ext: 'png', subDir: 'mask_preview' }),
              _0x3db1ec = pickResultLocalPath(_0x287bb2),
              _0x11e29d = appStore.getState().nodes?.[_0x36e423];
            if (!_0x11e29d || _0x11e29d.maskSaveToken !== _0x40b4c1) {
              URL.revokeObjectURL(_0x336b8f);
              return;
            }
            (appStore.updateNodeData(_0x36e423, {
              mask: _0x1b5af1,
              maskPreview: _0x3db1ec,
              maskPolarity: 'paint-white',
              maskPreviewUrl: null,
              maskSaveToken: null,
            }),
              appStore.setSelectedNodes([_0x36e423]),
              commit(),
              URL.revokeObjectURL(_0x336b8f),
              window._triggerLocalCacheSave?.());
          })().catch(() => {
            const _0x1b3f2c = appStore.getState().nodes?.[_0x36e423];
            if (!_0x1b3f2c || _0x1b3f2c.maskSaveToken !== _0x40b4c1) {
              try {
                URL.revokeObjectURL(_0x336b8f);
              } catch (_0x862097) {}
              return;
            }
            (appStore.updateNodeData(_0x36e423, { maskSaveToken: null }),
              window.showToast?.(imageMattingText('toasts.saveFailed'), 'error'));
          }));
      } catch (_0x11ed27) {
        (console.error('[Matting] 保存失败:', _0x11ed27),
          window.showToast?.(imageMattingText('toasts.saveFailed'), 'error'));
      } finally {
        if (_0x4e8055) _0x4e8055.textContent = _0x5e429b;
        ((_0x1ee9b7.style.pointerEvents = 'auto'), (this._isSaving = false), this._syncLocaleTexts());
      }
    },
    _resolveNodeImageUrl(_0x434136) {
      const _0x17377f = _0x434136.mainImageIndex || 0,
        _0x5b8397 = _0x434136.images && _0x434136.images[_0x17377f],
        _0x25a124 = _0x434136.localPath || _0x5b8397?.localPath,
        _0x4f8715 = localPathToUrl(_0x25a124);
      if (_0x4f8715) return _0x4f8715;
      return (
        _0x434136.src ||
        _0x434136.sourceUrl ||
        _0x434136.imageUrl ||
        _0x434136.thumbUrl ||
        _0x5b8397?.imageUrl ||
        _0x5b8397?.thumbUrl ||
        ''
      );
    },
    _invertCanvasBinary(_0x5314db) {
      const _0x4279fc = _0x5314db?.canvas,
        _0x469d10 = _0x4279fc?.width || 0,
        _0x845312 = _0x4279fc?.height || 0;
      if (!_0x469d10 || !_0x845312) return;
      const _0x2cceaf = _0x5314db.getImageData(0, 0, _0x469d10, _0x845312),
        _0x40fbf4 = _0x2cceaf.data;
      for (let _0x53555d = 0; _0x53555d < _0x40fbf4.length; _0x53555d += 4) {
        ((_0x40fbf4[_0x53555d] = 255 - _0x40fbf4[_0x53555d]),
          (_0x40fbf4[_0x53555d + 1] = 255 - _0x40fbf4[_0x53555d + 1]),
          (_0x40fbf4[_0x53555d + 2] = 255 - _0x40fbf4[_0x53555d + 2]));
      }
      _0x5314db.putImageData(_0x2cceaf, 0, 0);
    },
    _createMaskBaseCanvas(_0xc5a10e, _0x1cb92f = 'paint-white') {
      const _0x26eb1f = Math.max(1, Number(_0xc5a10e?.naturalWidth || _0xc5a10e?.width) || 1),
        _0x971eaf = Math.max(1, Number(_0xc5a10e?.naturalHeight || _0xc5a10e?.height) || 1),
        _0x33f32e = document.createElement('canvas');
      ((_0x33f32e.width = _0x26eb1f), (_0x33f32e.height = _0x971eaf));
      const _0x8dd9b1 = _0x33f32e.getContext('2d', { willReadFrequently: true });
      if (!_0x8dd9b1) return null;
      _0x8dd9b1.drawImage(_0xc5a10e, 0, 0, _0x26eb1f, _0x971eaf);
      const _0x35ba08 = _0x8dd9b1.getImageData(0, 0, _0x26eb1f, _0x971eaf),
        { data: _0x53dd5f } = _0x35ba08,
        _0x56e591 = String(_0x1cb92f || '').trim() === 'paint-white';
      for (let _0x40af53 = 0; _0x40af53 < _0x53dd5f.length; _0x40af53 += 4) {
        const _0x9974eb = Math.max(_0x53dd5f[_0x40af53], _0x53dd5f[_0x40af53 + 1], _0x53dd5f[_0x40af53 + 2]),
          _0x169ef3 = _0x56e591 ? _0x9974eb : 255 - _0x9974eb,
          _0x48cbee = _0x169ef3 > 5 ? _0x169ef3 : 0;
        ((_0x53dd5f[_0x40af53] = 255),
          (_0x53dd5f[_0x40af53 + 1] = 255),
          (_0x53dd5f[_0x40af53 + 2] = 255),
          (_0x53dd5f[_0x40af53 + 3] = _0x48cbee));
      }
      return (_0x8dd9b1.putImageData(_0x35ba08, 0, 0), _0x33f32e);
    },
    _loadExistingMask() {
      if (!this.active) return;
      const _0x5a0a20 = appStore.getStateRaw(),
        _0x50565e = _0x5a0a20.nodes?.[this.nodeId],
        _0x264de7 = String(_0x50565e?.mask || '').trim(),
        _0x38b0f3 = String(_0x50565e?.maskPreviewUrl || _0x50565e?.maskPreview || '').trim(),
        _0x3c46af = !!_0x264de7,
        _0x50c00b = _0x3c46af ? _0x264de7 : _0x38b0f3;
      if (!_0x50c00b) return;
      const _0x4723a2 =
        _0x50c00b.startsWith('blob:') || _0x50c00b.startsWith('data:')
          ? _0x50c00b
          : localPathToUrl(_0x50c00b);
      if (!_0x4723a2) return;
      (async () => {
        const _0x32fae6 = await this._loadImage(_0x4723a2);
        if (!this.active) return;
        this._commands = this._commands.filter(
          (_0x33dbe2) => _0x33dbe2?.type !== 'mask-preview' && _0x33dbe2?.type !== 'mask-base',
        );
        if (_0x3c46af) {
          const _0x5b22a6 = this._createMaskBaseCanvas(_0x32fae6, _0x50565e?.maskPolarity);
          if (_0x5b22a6) this._commands.unshift({ type: 'mask-base', canvas: _0x5b22a6 });
        } else this._commands.unshift({ type: 'mask-preview', img: _0x32fae6 });
        ((this._redoStack = []), this._render());
      })().catch(() => {});
    },
    _loadImage(_0x1e8791) {
      return new Promise((_0x1a1570, _0x2cc74d) => {
        const _0x1b4406 = new Image();
        ((_0x1b4406.crossOrigin = 'anonymous'),
          (_0x1b4406.onload = () => _0x1a1570(_0x1b4406)),
          (_0x1b4406.onerror = () => _0x2cc74d(new Error(imageMattingText('errors.imageLoadFailed')))),
          (_0x1b4406.src = _0x1e8791));
      });
    },
  };
export default ImageMattingController;

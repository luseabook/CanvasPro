import appStore from '../core/stores/appStore.js';
import { buildGenerateImageRequest } from '../../api/aiImageApi.js';
import { generateId, screenToWorld, worldToScreen, isPointInRect } from '../core/math.js';
import { setStaticInnerHTML } from '../utils/dom.js';
import { IMAGE_MODELS, getModelProvider } from '../config/modelConfig.js';
import {
  bindImageFunctionModeMenu,
  bindImageFunctionModelMenu,
  closeImageFunctionModelSubmenus,
  getImageFunctionNanoSelection,
  getImageFunctionModelDisplayName,
  getImageFunctionModelTriggerIconHTML,
  resolveImageFunctionModelByMode,
  syncImageFunctionModeControl,
  syncImageFunctionModelMenuActive,
} from './imageFunctionModelMenu.js';
import { bindToolbarUpMenus } from './imageToolbarUpMenu.js';
import { shouldDisableImageSizeControl } from './imageModelCapabilities.js';
import {
  ANNOTATE_TOOLBAR_TEMPLATE_ID,
  createGenerationToolbarMarkup,
  getAnnotateToolbarToolsForScene,
} from './imageAnnotate/annotateToolbarMarkup.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import {
  buildCopiedTextCommand,
  clampTextScale,
  createTextTransformState,
  findTextHit,
  getTextGeometry,
  getTextLayout,
  getTextScalePair,
  resolveAxisTextScale,
  rotateTextLocalPoint,
  TEXT_CONTROL_HIT_RADIUS,
  TEXT_CONTROL_MAX_SCALE,
  TEXT_CONTROL_MIN_SCALE,
  toTextLocalTransformSpace,
} from './imageAnnotate/textControls.js';
import { getNextNumberLabelValue } from './imageAnnotate/numberLabels.js';
import { renderCommands, renderEraseSceneCommands } from './imageAnnotate/rendering.js';
import { createEraseCheckerboardPattern } from './eraseBrushRenderer.js';
import { buildGenerationPayload } from './imageAnnotate/generationPayload.js';
import { exportAnnotateCanvasBlob } from './imageAnnotate/exportCanvas.js';
import { runGenerationResultFlow } from './imageAnnotate/generationResultFlow.js';
import { saveAnnotateExportResult } from './imageAnnotate/saveResultNode.js';
import {
  buildGenerationModelCatalog,
  buildPersistedEraseSelectionState,
  buildSeedreamMigrationPatch,
  ERASE_SELECTION_STATE_KEY,
  findProviderKeyByModel,
  getDefaultGenerationModelState,
  readPersistedEraseSelectionState,
} from './imageAnnotate/stateAdapters.js';
import { buildSelectionMaskCanvas } from './imageAnnotate/selectionMask.js';
import {
  IMAGE_BRUSH_DEFAULT_SIZE_PX,
  clampImageBrushSize,
  syncCircularBrushCursor,
} from './imageEditorBrushStyle.js';
import { formatFinalApiDebugRequest } from '../utils/debugRequestPreview.js';
import { applyI18n, t } from '../i18n/index.js';
function imageAnnotateText(_0x45dd2f, _0xf5016e = {}) {
  return t('imageAnnotate.' + _0x45dd2f, _0xf5016e);
}
const COLOR_VAR_MAP = {
    black: '--black',
    red: '--annotate-red',
    orange: '--annotate-orange',
    yellow: '--annotate-yellow',
    green: '--annotate-green',
    blue: '--annotate-blue',
    purple: '--annotate-purple',
    white: '--canvas-white',
  },
  getCssVar = (_0x51d3f7) => getComputedStyle(document.documentElement).getPropertyValue(_0x51d3f7).trim(),
  COLOR_NAME_BY_VAR = Object.fromEntries(
    Object.entries(COLOR_VAR_MAP).map(([_0x1c28d6, _0x59dbb3]) => [_0x59dbb3, _0x1c28d6]),
  ),
  normalizeColorName = (_0x879a57) => {
    const _0x361683 = String(_0x879a57 || '').trim();
    if (!_0x361683) return 'red';
    if (COLOR_VAR_MAP[_0x361683]) return _0x361683;
    const _0x1560f4 = _0x361683.match(/^var\(\s*(--[^)]+)\s*\)$/);
    if (_0x1560f4 && COLOR_NAME_BY_VAR[_0x1560f4[1]]) return COLOR_NAME_BY_VAR[_0x1560f4[1]];
    return 'red';
  },
  getColorCss = (_0x527499) => {
    const _0x99d4a1 = COLOR_VAR_MAP[_0x527499];
    return _0x99d4a1 ? 'var(' + _0x99d4a1 + ')' : _0x527499;
  },
  getColorCanvas = (_0x27fc52) => {
    const _0x129021 = COLOR_VAR_MAP[_0x27fc52];
    if (!_0x129021) return _0x27fc52;
    return getCssVar(_0x129021) || _0x27fc52;
  },
  isFiniteCommandPoint = (_0xeca2b2) =>
    Number.isFinite(Number(_0xeca2b2?.x)) && Number.isFinite(Number(_0xeca2b2?.y)),
  hasDrawableStrokePoints = (_0x3deaa0) =>
    Array.isArray(_0x3deaa0?.points) && _0x3deaa0.points.some(isFiniteCommandPoint),
  shouldDiscardStrokeCommand = (_0x458baa) =>
    (_0x458baa?.type === 'brush' || _0x458baa?.type === 'eraser') && !hasDrawableStrokePoints(_0x458baa);
export const __textControlTestUtils = { clampTextScale: clampTextScale, getTextScalePair: getTextScalePair };
export const __strokeCommandTestUtils = {
  hasDrawableStrokePoints: hasDrawableStrokePoints,
  shouldDiscardStrokeCommand: shouldDiscardStrokeCommand,
};
const ERASE_GENERATE_PROMPT = '擦除绿色的区域 并且填充背景',
  ROTATE_CURSOR_CSS =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cg transform='rotate(35 14 14)'%3E%3Cpath d='M10.2 22.7a8.6 8.6 0 1 0 0-17.4 6.8 6.8 0 1 1 0 17.4Z' fill='%23ffffff' stroke='%23ffffff' stroke-width='1.6' stroke-linejoin='round'/%3E%3Cpath d='M5.3 22.1h4.8v-4.8' fill='none' stroke='%23ffffff' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M5.3 22.1l3.9-3.9' fill='none' stroke='%23ffffff' stroke-width='1.7' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E\") 14 14",
  ImageAnnotateController = {
    active: false,
    nodeId: null,
    nodeData: null,
    overlayEl: null,
    containerEl: null,
    stageEl: null,
    imgEl: null,
    canvasEl: null,
    toolbarEl: null,
    generationToolbarEl: null,
    sizeValueEl: null,
    sizeRangeEl: null,
    colorWrapEl: null,
    colorDotEl: null,
    colorMenuEl: null,
    colorButtons: null,
    toolButtons: null,
    cursorEl: null,
    _cursorHover: false,
    _cursorLast: { x: 0, y: 0 },
    _cursorRaf: 0,
    _temporaryTool: null,
    _textInputEl: null,
    _selectedTextCommandIndex: null,
    _unsubscribe: null,
    _commands: [],
    _redoStack: [],
    _draft: null,
    _dirty: false,
    _view: null,
    _mode: null,
    imageSize: '1K',
    model: null,
    provider: null,
    promptText: '',
    _checkerPattern: null,
    _eraseMaskCanvasEl: null,
    _useWhiteboardBase: false,
    _generationModelCatalog: null,
    _fillRegionCache: null,
    _unbindGenerationToolbarUpMenus: null,
    _unbindGenerationFunctionMenus: null,
    init(_0x1dd5df, _0x29e356 = {}) {
      if (this.active) return;
      const _0x18e2f0 = appStore.getStateRaw(),
        _0x1b7850 = _0x18e2f0.nodes?.[_0x1dd5df];
      if (!_0x1b7850) return;
      const _0xb38f0c = this._resolveNodeImageUrl(_0x1b7850);
      if (!_0xb38f0c) {
        window.showToast?.(imageAnnotateText('toasts.noImage'), 'warn');
        return;
      }
      const _0x2fb1e4 = String(_0x29e356.scene || 'annotate'),
        _0x3764c8 = _0x2fb1e4 === 'erase' ? readPersistedEraseSelectionState(_0x1b7850) : null,
        _0x51b321 =
          _0x2fb1e4 === 'erase'
            ? _0x3764c8?.tool || 'brush'
            : _0x2fb1e4 === 'repaint'
              ? 'brush'
              : _0x18e2f0.annotate?.tool === 'bucket'
                ? 'brush'
                : _0x18e2f0.annotate?.tool || 'brush',
        _0x2e17b2 = normalizeColorName(_0x18e2f0.annotate?.color),
        _0x2ead26 =
          _0x2fb1e4 === 'erase'
            ? clampImageBrushSize(_0x3764c8?.brushSizePx, 40)
            : clampImageBrushSize(_0x18e2f0.annotate?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX);
      ((this.active = true),
        (this.nodeId = _0x1dd5df),
        (this._generationModelCatalog = buildGenerationModelCatalog()));
      const _0x576537 = this._normalizeLegacySeedreamNode(_0x1b7850);
      ((this.nodeData = _0x576537),
        (this._commands = _0x3764c8?.commands || []),
        (this._redoStack = []),
        (this._draft = null),
        (this._selectedTextCommandIndex = null),
        (this._dirty = false),
        (this._useWhiteboardBase = false),
        (this._fillRegionCache = new Map()));
      const _0x2fb1ce = imageAnnotateText('actions.save'),
        _0x1ee46 = imageAnnotateText('actions.generate'),
        _0x833f10 = t('imageAnnotate.actions.generate', {}, { locale: 'zh-CN' }),
        _0x14506b = String(_0x29e356.submitLabel || _0x2fb1ce).trim(),
        _0x4e21bd = _0x14506b || _0x2fb1ce,
        _0x553ced = _0x4e21bd === _0x1ee46 || _0x4e21bd === _0x833f10;
      this._mode = {
        scene: _0x2fb1e4,
        submitLabel: _0x4e21bd,
        submitBusyLabel:
          String(_0x29e356.submitBusyLabel || '').trim() ||
          (_0x553ced ? imageAnnotateText('actions.generating') : imageAnnotateText('actions.saving')),
        submitNoop: Boolean(_0x29e356.submitNoop),
      };
      const _0x5d6606 = this._getGenerationModelCatalog(),
        _0x73b02 = getDefaultGenerationModelState(_0x5d6606);
      this.imageSize = '1K';
      const _0x270a2e = String(_0x576537?.model || '').trim(),
        _0x81fb18 = String(_0x576537?.provider || '').trim(),
        _0xe0d8d4 = findProviderKeyByModel(_0x5d6606, _0x270a2e);
      (_0xe0d8d4
        ? ((this.model = _0x270a2e), (this.provider = _0xe0d8d4))
        : ((this.model = _0x73b02.model || _0x270a2e || null),
          (this.provider = _0x73b02.provider || _0x81fb18 || getModelProvider(this.model) || null)),
        (this.promptText = _0x2fb1e4 === 'repaint' ? String(_0x29e356.promptText || '').trim() : ''),
        (this._view = {
          tool: _0x51b321,
          color: _0x2e17b2,
          brushSizePx: _0x2ead26,
          viewport: _0x18e2f0.viewport,
          node: _0x576537,
        }),
        appStore.setAnnotateState({
          active: true,
          nodeId: _0x1dd5df,
          tool: _0x51b321,
          color: _0x2e17b2,
          brushSizePx: _0x2ead26,
        }),
        this._createUI(_0xb38f0c, { tool: _0x51b321, color: _0x2e17b2, brushSizePx: _0x2ead26 }),
        this._bindEvents(),
        (this._unsubscribe = appStore.subscribeSelector(
          (_0x36c5d6) => {
            const _0x1cc30e = _0x36c5d6.nodes?.[_0x1dd5df],
              _0x3725fa = _0x36c5d6.viewport || { x: 0, y: 0, zoom: 1 },
              _0x29528d = _0x36c5d6.annotate || {};
            return {
              hasNode: !!_0x1cc30e,
              nx: _0x1cc30e ? _0x1cc30e.x : 0,
              ny: _0x1cc30e ? _0x1cc30e.y : 0,
              nw: _0x1cc30e ? _0x1cc30e.width : 0,
              nh: _0x1cc30e ? _0x1cc30e.height : 0,
              vx: _0x3725fa.x,
              vy: _0x3725fa.y,
              vz: _0x3725fa.zoom || 1,
              tool: _0x29528d.tool || 'brush',
              color: normalizeColorName(_0x29528d.color),
              brushSizePx: clampImageBrushSize(_0x29528d.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX),
            };
          },
          (_0x2162f9) => {
            if (!_0x2162f9?.hasNode) return;
            const _0x2ac28e = appStore.getStateRaw().nodes?.[_0x1dd5df],
              _0x1bd463 = this._normalizeLegacySeedreamNode(_0x2ac28e);
            ((this.nodeData = _0x1bd463 || null),
              (this._view = {
                tool: _0x2162f9.tool,
                color: _0x2162f9.color,
                brushSizePx: _0x2162f9.brushSizePx,
                viewport: { x: _0x2162f9.vx, y: _0x2162f9.vy, zoom: _0x2162f9.vz },
                node: {
                  x: Number(_0x1bd463?.x ?? _0x2162f9.nx),
                  y: Number(_0x1bd463?.y ?? _0x2162f9.ny),
                  width: Number(_0x1bd463?.width ?? _0x2162f9.nw),
                  height: Number(_0x1bd463?.height ?? _0x2162f9.nh),
                },
              }),
              this._updateView(this._view));
          },
        )),
        this._waitForImageAndShow());
    },
    _waitForImageAndShow() {
      const _0x2872df = () => {
        if (this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0) {
          if (this._view) this._updateView(this._view);
          requestAnimationFrame(() => {
            if (this.overlayEl) this.overlayEl.classList.add('visible');
          });
        } else requestAnimationFrame(_0x2872df);
      };
      _0x2872df();
    },
    _getGenerationModelCatalog() {
      return (
        !this._generationModelCatalog && (this._generationModelCatalog = buildGenerationModelCatalog()),
        this._generationModelCatalog
      );
    },
    _normalizeLegacySeedreamNode(_0x28631c) {
      const _0x1d2a07 = buildSeedreamMigrationPatch(_0x28631c);
      if (!_0x1d2a07) return _0x28631c;
      const _0x50e428 = { ...(_0x28631c || {}), ..._0x1d2a07 },
        _0x4aba08 = appStore.getStateRaw().nodes?.[this.nodeId];
      return (_0x4aba08 && appStore.updateNodeData(this.nodeId, _0x1d2a07), _0x50e428);
    },
    exit({ silent: silent = false } = {}) {
      if (!this.active) return;
      !silent && this._dirty && window.showToast?.(imageAnnotateText('toasts.cancelled'), 'ok');
      ((this.active = false),
        (this.nodeId = null),
        (this.nodeData = null),
        (this._commands = []),
        (this._redoStack = []),
        (this._draft = null),
        this._removeTextInput(false),
        (this._dirty = false),
        appStore.setAnnotateState({ active: false, nodeId: null }));
      this._unsubscribe && (this._unsubscribe(), (this._unsubscribe = null));
      (this._unbindGenerationToolbarUpMenus?.(),
        (this._unbindGenerationToolbarUpMenus = null),
        this._unbindGenerationFunctionMenus?.(),
        (this._unbindGenerationFunctionMenus = null));
      if (this.overlayEl) this.overlayEl.remove();
      if (this.toolbarEl) this.toolbarEl.remove();
      if (this.generationToolbarEl) this.generationToolbarEl.remove();
      ((this.overlayEl = null),
        (this.containerEl = null),
        (this.stageEl = null),
        (this.imgEl = null),
        (this.canvasEl = null),
        (this.toolbarEl = null),
        (this.generationToolbarEl = null),
        (this.sizeValueEl = null),
        (this.sizeRangeEl = null),
        (this.colorWrapEl = null),
        (this.colorDotEl = null),
        (this.colorMenuEl = null),
        (this.colorButtons = null),
        (this.toolButtons = null),
        (this.cursorEl = null),
        (this._cursorHover = false),
        (this._cursorLast = { x: 0, y: 0 }),
        (this._cursorRaf = 0),
        (this._temporaryTool = null),
        (this._textInputEl = null),
        (this._selectedTextCommandIndex = null),
        (this._view = null),
        (this._mode = null),
        (this.imageSize = '1K'),
        (this.model = null),
        (this.provider = null),
        (this.promptText = ''),
        (this._checkerPattern = null),
        (this._eraseMaskCanvasEl = null),
        (this._useWhiteboardBase = false),
        (this._generationModelCatalog = null),
        (this._fillRegionCache = null),
        (this._unbindGenerationToolbarUpMenus = null),
        (this._unbindGenerationFunctionMenus = null));
    },
    _isGenerationScene() {
      return this._mode?.scene === 'repaint' || this._mode?.scene === 'erase';
    },
    _isEraseScene() {
      return this._mode?.scene === 'erase';
    },
    _isRepaintScene() {
      return this._mode?.scene === 'repaint';
    },
    _isAnnotateScene() {
      return this._mode?.scene === 'annotate';
    },
    _getFlipState(_0x51b42d = this._commands) {
      const _0x4b5c7 = { horizontal: false, vertical: false };
      return (
        (Array.isArray(_0x51b42d) ? _0x51b42d : []).forEach((_0x24454c) => {
          if (_0x24454c?.type === 'flip-horizontal') _0x4b5c7.horizontal = !_0x4b5c7.horizontal;
          else _0x24454c?.type === 'flip-vertical' && (_0x4b5c7.vertical = !_0x4b5c7.vertical);
        }),
        _0x4b5c7
      );
    },
    _getCurrentFlipState() {
      if (!this._isAnnotateScene()) return { horizontal: false, vertical: false };
      return this._getFlipState(this._commands);
    },
    _applyFlipToLocalPoint(_0x4b5e5a, _0x2bdf20, _0x3193bb = this._getCurrentFlipState()) {
      const _0x236b55 = { x: Number(_0x4b5e5a?.x) || 0, y: Number(_0x4b5e5a?.y) || 0 },
        _0x48cad2 = Math.max(1, Number(_0x2bdf20?.width) || 1),
        _0x1f866c = Math.max(1, Number(_0x2bdf20?.height) || 1);
      if (_0x3193bb?.horizontal) _0x236b55.x = _0x48cad2 - _0x236b55.x;
      if (_0x3193bb?.vertical) _0x236b55.y = _0x1f866c - _0x236b55.y;
      return _0x236b55;
    },
    _getLocalFromClient(_0x494c03, _0x250b45, _0x1ccc53, _0x350672) {
      const _0x49ad07 = screenToWorld(_0x494c03, _0x250b45, _0x1ccc53.viewport),
        _0x3af7f2 = { x: _0x49ad07.x - _0x350672.x, y: _0x49ad07.y - _0x350672.y };
      if (!this._isAnnotateScene()) return _0x3af7f2;
      return this._applyFlipToLocalPoint(_0x3af7f2, _0x350672, this._getCurrentFlipState());
    },
    _applyStageFlip(_0x4579b8 = this._getCurrentFlipState()) {
      if (!this.stageEl) return;
      if (!this._isAnnotateScene()) {
        this.stageEl.style.transform = 'none';
        return;
      }
      const _0x5c1478 = _0x4579b8?.horizontal ? -1 : 1,
        _0x4052c1 = _0x4579b8?.vertical ? -1 : 1;
      ((this.stageEl.style.transformOrigin = '50% 50%'),
        (this.stageEl.style.transform = 'scale(' + _0x5c1478 + ', ' + _0x4052c1 + ')'));
    },
    _applyFlipTransformToContext(_0x4fc5b3, _0x2013de, _0x1373f8, _0xf2d6c = this._getCurrentFlipState()) {
      if (!_0x4fc5b3) return;
      (_0xf2d6c?.horizontal && (_0x4fc5b3.translate(_0x2013de, 0), _0x4fc5b3.scale(-1, 1)),
        _0xf2d6c?.vertical && (_0x4fc5b3.translate(0, _0x1373f8), _0x4fc5b3.scale(1, -1)));
    },
    _closeGenerationMenus() {
      if (!this.generationToolbarEl) return;
      (this.generationToolbarEl.querySelectorAll('[data-toolbar-up-menu-menu]').forEach((_0x35b067) => {
        const _0x38b34d = String(_0x35b067?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
        (_0x35b067.classList.remove(_0x38b34d),
          _0x35b067.classList.remove('open'),
          _0x35b067.classList.remove('show'));
      }),
        this.generationToolbarEl.querySelector('.model-menu')?.classList.remove('show'),
        this.generationToolbarEl.querySelector('.image-function-mode-menu')?.classList.remove('show'),
        closeImageFunctionModelSubmenus(this.generationToolbarEl.querySelector('.model-menu')));
    },
    _createUI(_0x52b9bc, _0x20dfde = {}) {
      const _0x179316 = document.createElement('div');
      _0x179316.className = 'v2-annotate-overlay';
      const _0xf12546 = document.createElement('div');
      _0xf12546.className = 'v2-annotate-container';
      const _0x4e34a3 = document.createElement('div');
      _0x4e34a3.className = 'v2-annotate-stage';
      const _0x2cc3fe = document.createElement('img');
      ((_0x2cc3fe.className = 'v2-annotate-img'), (_0x2cc3fe.src = _0x52b9bc), (_0x2cc3fe.draggable = false));
      const _0xf40b6 = document.createElement('canvas');
      ((_0xf40b6.className = 'v2-annotate-canvas'),
        _0x4e34a3.appendChild(_0x2cc3fe),
        _0x4e34a3.appendChild(_0xf40b6),
        _0xf12546.appendChild(_0x4e34a3));
      const _0x18927d = document.createElement('div');
      ((_0x18927d.className = 'v2-annotate-cursor'),
        (_0x18927d.style.display = 'none'),
        _0x179316.appendChild(_0x18927d),
        _0x179316.appendChild(_0xf12546),
        document.body.appendChild(_0x179316),
        (this.overlayEl = _0x179316),
        (this.containerEl = _0xf12546),
        (this.stageEl = _0x4e34a3),
        (this.imgEl = _0x2cc3fe),
        (this.canvasEl = _0xf40b6),
        (this.cursorEl = _0x18927d),
        this._applyBaseSurface());
      const _0x20060f = document.createElement('div');
      ((_0x20060f.className = 'v2-annotate-toolbar'),
        setStaticInnerHTML(_0x20060f, ANNOTATE_TOOLBAR_TEMPLATE_ID),
        applyI18n(_0x20060f),
        document.body.appendChild(_0x20060f),
        (this.toolbarEl = _0x20060f));
      if (this._isGenerationScene()) {
        const _0x546702 = document.createElement('div');
        ((_0x546702.className = 'v2-annotate-toolbar v2-annotate-generation-toolbar'),
          (_0x546702.innerHTML = createGenerationToolbarMarkup({
            scene: this._mode?.scene || 'annotate',
            promptText: this.promptText,
            imageSize: this.imageSize,
            model: this.model,
            provider: this.provider,
            modelCatalog: this._getGenerationModelCatalog(),
            submitTooltip: this._mode?.submitLabel || imageAnnotateText('actions.generate'),
          })),
          applyI18n(_0x546702),
          document.body.appendChild(_0x546702),
          (this.generationToolbarEl = _0x546702));
      }
      ((this.sizeValueEl = _0x20060f.querySelector('.v2-annotate-size-value')),
        (this.sizeRangeEl = _0x20060f.querySelector('.v2-annotate-size-range')),
        (this.colorWrapEl = _0x20060f.querySelector('.v2-annotate-colorwrap')),
        (this.colorDotEl = _0x20060f.querySelector('.v2-annotate-color-dot')),
        (this.colorMenuEl = _0x20060f.querySelector('.v2-annotate-color-menu')),
        (this.colorButtons = Array.from(_0x20060f.querySelectorAll('.v2-annotate-swatch'))));
      const _0x36649b = getAnnotateToolbarToolsForScene(this._mode?.scene || 'annotate');
      (_0x20060f.querySelectorAll('.tool-btn').forEach((_0x5df653) => {
        if (!_0x36649b.includes(_0x5df653.dataset.tool)) _0x5df653.remove();
      }),
        (this.toolButtons = Array.from(_0x20060f.querySelectorAll('.tool-btn'))));
      this._isGenerationScene() &&
        (this.colorWrapEl?.remove(),
        (this.colorWrapEl = null),
        (this.colorDotEl = null),
        (this.colorMenuEl = null),
        (this.colorButtons = []));
      !this._isAnnotateScene() &&
        (_0x20060f.querySelector('.act-flip-horizontal')?.remove(),
        _0x20060f.querySelector('.act-flip-vertical')?.remove());
      const _0x376fcf = _0x20060f.querySelector('.act-save'),
        _0x560691 = _0x20060f.querySelector('.act-new-board'),
        _0x5b29a1 = _0x376fcf?.querySelector('span'),
        _0xcc78fb = this._mode?.submitLabel || '保存';
      if (_0x5b29a1) _0x5b29a1.textContent = _0xcc78fb;
      if (_0x376fcf) _0x376fcf.setAttribute('data-tooltip', _0xcc78fb);
      _0x376fcf && this._isGenerationScene() && (_0x376fcf.style.display = 'none');
      _0x560691 && this._isGenerationScene() && (_0x560691.style.display = 'none');
      const _0x153a7c = clampImageBrushSize(_0x20dfde.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX),
        _0x43a46c = _0x20dfde.tool || 'brush',
        _0x19eb64 = _0x36649b.includes(_0x43a46c) ? _0x43a46c : 'brush',
        _0x19f5e5 = normalizeColorName(_0x20dfde.color);
      ((this.sizeRangeEl.value = String(_0x153a7c)),
        (this.sizeValueEl.textContent = String(_0x153a7c)),
        this._updateToolActive(_0x19eb64, _0x153a7c),
        this._syncPaletteActive(_0x19f5e5));
      if (this._view) this._updateView(this._view);
    },
    _bindEvents() {
      const _0x282a0f = (_0x233b5b) => {
        const _0x4eb8c7 =
          this.canvasEl && (_0x233b5b.target === this.canvasEl || this.canvasEl.contains(_0x233b5b.target));
        if (_0x4eb8c7) {
          this._onCanvasWheel(_0x233b5b);
          return;
        }
        (_0x233b5b.preventDefault(), _0x233b5b.stopPropagation());
      };
      this.overlayEl.addEventListener('wheel', _0x282a0f, { passive: false });
      const _0x518cd8 = () => {
        if (this._view) this._updateView(this._view);
      };
      window.addEventListener('resize', _0x518cd8);
      const _0x210a30 = (_0x11a1c7) => {
        if (!this.active) return;
        const _0x3db390 = _0x11a1c7.target,
          _0x13d445 = _0x3db390?.tagName?.toLowerCase?.() || '',
          _0xf1112c =
            _0x13d445 === 'input' || _0x13d445 === 'textarea' || _0x3db390?.isContentEditable === true;
        if (_0xf1112c) return;
        if (_0x11a1c7.altKey || _0x11a1c7.ctrlKey || _0x11a1c7.metaKey) return;
        const _0x3e2b1d = String(_0x11a1c7.key || '').toLowerCase();
        if (_0x3e2b1d === 't' && !this._isGenerationScene()) {
          (_0x11a1c7.preventDefault(), this._setTool('text'));
          return;
        }
        const _0x40385a = _0x11a1c7.key === 'Delete' || _0x11a1c7.key === 'Backspace';
        if (!_0x40385a) return;
        const _0x1a39ab = Number(this._selectedTextCommandIndex);
        if (!Number.isInteger(_0x1a39ab) || _0x1a39ab < 0 || _0x1a39ab >= this._commands.length) return;
        if (this._commands[_0x1a39ab]?.type !== 'text') return;
        (_0x11a1c7.preventDefault(), this._deleteTextCommand(_0x1a39ab));
      };
      window.addEventListener('keydown', _0x210a30);
      const _0xee8cf5 = () => {
          (window.removeEventListener('resize', _0x518cd8),
            window.removeEventListener('keydown', _0x210a30),
            this.overlayEl?.removeEventListener('wheel', _0x282a0f),
            document.removeEventListener('pointerdown', _0x3ced82, true));
        },
        _0x1fe41e = this.exit.bind(this);
      ((this.exit = (_0xa5191 = {}) => {
        (_0xee8cf5(), _0x1fe41e(_0xa5191));
      }),
        this.toolbarEl.addEventListener('pointerdown', (_0x258064) => _0x258064.stopPropagation()),
        this.toolbarEl.querySelector('.act-cancel').addEventListener('click', (_0x183a96) => {
          (_0x183a96.stopPropagation(), this.exit());
        }),
        this.toolButtons.forEach((_0x27c08c) => {
          _0x27c08c.addEventListener('click', (_0x5025a2) => {
            _0x5025a2.stopPropagation();
            const _0x3ffcf7 = _0x27c08c.dataset.tool;
            this._setTool(_0x3ffcf7);
          });
        }));
      const _0x530a0e = () => {
          if (!this.colorWrapEl) return;
          this.colorWrapEl.classList.remove('open');
        },
        _0x3ced82 = (_0xfa3374) => {
          (this.colorWrapEl &&
            this.colorWrapEl.classList.contains('open') &&
            !this.colorWrapEl.contains(_0xfa3374.target) &&
            _0x530a0e(),
            this.generationToolbarEl &&
              !this.generationToolbarEl.contains(_0xfa3374.target) &&
              this._closeGenerationMenus());
        };
      (document.addEventListener('pointerdown', _0x3ced82, true),
        this.colorWrapEl?.addEventListener('pointerdown', (_0x470454) => _0x470454.stopPropagation()),
        this.colorWrapEl
          ?.querySelector('.v2-annotate-color-toggle')
          ?.addEventListener('click', (_0x2d8c0b) => {
            _0x2d8c0b.stopPropagation();
            if (!this.colorWrapEl) return;
            this.colorWrapEl.classList.toggle('open');
          }),
        this.colorButtons.forEach((_0x30bb20) => {
          _0x30bb20.addEventListener('click', (_0x5aa26b) => {
            _0x5aa26b.stopPropagation();
            const _0x48916b = _0x30bb20.dataset.color;
            (appStore.setAnnotateState({ color: _0x48916b }), _0x530a0e());
          });
        }),
        this.sizeRangeEl.addEventListener('input', (_0x377a9c) => {
          const _0x197b46 = clampImageBrushSize(_0x377a9c.target.value, 1);
          (appStore.setAnnotateState({ brushSizePx: _0x197b46 }),
            (this.sizeValueEl.textContent = String(_0x197b46)),
            this._syncCursor(),
            this._persistEraseSelectionState());
        }),
        this.toolbarEl.querySelector('.act-undo').addEventListener('click', (_0xf219f2) => {
          (_0xf219f2.stopPropagation(), this._undo());
        }),
        this.toolbarEl.querySelector('.act-flip-horizontal')?.addEventListener('click', (_0x42e1e5) => {
          (_0x42e1e5.stopPropagation(), this._flipHorizontal());
        }),
        this.toolbarEl.querySelector('.act-flip-vertical')?.addEventListener('click', (_0x2994b7) => {
          (_0x2994b7.stopPropagation(), this._flipVertical());
        }),
        this.toolbarEl.querySelector('.act-redo').addEventListener('click', (_0x201095) => {
          (_0x201095.stopPropagation(), this._redo());
        }),
        this.toolbarEl.querySelector('.act-clear').addEventListener('click', (_0x188d00) => {
          (_0x188d00.stopPropagation(), this._clear());
        }),
        this.toolbarEl.querySelector('.act-new-board')?.addEventListener('click', (_0xd32536) => {
          (_0xd32536.stopPropagation(), this._createNewWhiteboard());
        }),
        this.toolbarEl.querySelector('.act-save').addEventListener('click', async (_0x4c3ca7) => {
          _0x4c3ca7.stopPropagation();
          if (this._mode?.submitNoop) return;
          await this._save();
        }));
      if (this.generationToolbarEl) {
        this.generationToolbarEl.addEventListener('pointerdown', (_0x1b977b) => _0x1b977b.stopPropagation());
        const _0x56823c = this.generationToolbarEl.querySelector('.v2-annotate-gen-prompt-input'),
          _0x36e023 = this.generationToolbarEl.querySelector('.size-menu'),
          _0x24bdab = this.generationToolbarEl.querySelector('.model-menu'),
          _0x47398b = this.generationToolbarEl.querySelector('.model-text'),
          _0x372d2f = this.generationToolbarEl.querySelector('.image-function-model-trigger-icon-slot'),
          _0x3aa18a = this.generationToolbarEl.querySelector('.size-toggle'),
          _0x2f9748 = this.generationToolbarEl.querySelector('.image-function-mode-toggle'),
          _0x152298 = this.generationToolbarEl.querySelector('.image-function-mode-menu'),
          _0xd853c0 = () => {
            const _0x292a13 = shouldDisableImageSizeControl(this.model, this.provider);
            (_0x3aa18a &&
              ((_0x3aa18a.disabled = _0x292a13),
              _0x3aa18a.classList.toggle('is-disabled', _0x292a13),
              _0x3aa18a.setAttribute('aria-disabled', _0x292a13 ? 'true' : 'false')),
              _0x36e023?.querySelectorAll('[data-toolbar-up-menu-field="size"]').forEach((_0x18b920) => {
                (_0x18b920.classList.toggle('disabled', _0x292a13),
                  (_0x18b920.dataset.disabled = _0x292a13 ? 'true' : 'false'));
              }),
              _0x292a13 && _0x36e023?.classList.remove('open'));
          },
          _0x6db838 = () =>
            syncImageFunctionModeControl({
              root: this.generationToolbarEl,
              model: this.model,
              provider: this.provider,
              imageSize: this.imageSize,
            }),
          _0x42882e = (_0x2da478, _0x24c1b1, { syncStore: syncStore = true } = {}) => {
            const _0x18b62a = String(_0x2da478 || '').trim(),
              _0x5e91da = String(_0x24c1b1 || getModelProvider(_0x18b62a) || '').trim();
            if (!_0x18b62a || !_0x5e91da) return;
            const _0x191818 = this.model !== _0x18b62a || this.provider !== _0x5e91da;
            ((this.model = _0x18b62a),
              (this.provider = _0x5e91da),
              _0x47398b &&
                (_0x47398b.textContent = getImageFunctionModelDisplayName(
                  _0x18b62a,
                  this._getGenerationModelCatalog(),
                )),
              _0x372d2f && (_0x372d2f.innerHTML = getImageFunctionModelTriggerIconHTML(_0x18b62a, _0x5e91da)),
              syncImageFunctionModelMenuActive({
                modelMenu: _0x24bdab,
                model: _0x18b62a,
                provider: _0x5e91da,
              }),
              _0x6db838(),
              _0xd853c0(),
              syncStore &&
                _0x191818 &&
                this.nodeId &&
                appStore.updateNodeData(this.nodeId, { model: _0x18b62a, provider: _0x5e91da }));
          },
          _0x51d0cd = (_0x16cb31 = null) => {
            this.generationToolbarEl?.querySelectorAll('[data-toolbar-up-menu-menu]').forEach((_0x162f57) => {
              if (_0x162f57 === _0x16cb31) return;
              const _0x47bd23 = String(_0x162f57?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
              (_0x162f57.classList.remove(_0x47bd23),
                _0x162f57.classList.remove('open'),
                _0x162f57.classList.remove('show'));
            });
          },
          _0x5342e7 = () => {
            (_0x51d0cd(),
              _0x24bdab?.classList.remove('show'),
              _0x152298?.classList.remove('show'),
              closeImageFunctionModelSubmenus(_0x24bdab));
          };
        (_0x56823c?.addEventListener('input', (_0x11052a) => {
          this.promptText = String(_0x11052a.target.value || '');
        }),
          (this._unbindGenerationToolbarUpMenus = bindToolbarUpMenus(this.generationToolbarEl, {
            onBeforeOpen: () => {
              (_0x24bdab?.classList.remove('show'),
                _0x152298?.classList.remove('show'),
                closeImageFunctionModelSubmenus(_0x24bdab));
            },
            onSelect: ({ fieldId: _0x48f564, value: _0xa8def4 }) => {
              if (_0x48f564 !== 'size') return;
              if (shouldDisableImageSizeControl(this.model, this.provider)) return;
              this.imageSize = String(_0xa8def4 || '1K').trim() || '1K';
              const _0x27b77e = getImageFunctionNanoSelection(this.model, this.provider, this.imageSize);
              if (_0x27b77e) {
                const _0x403af9 = resolveImageFunctionModelByMode({
                  model: this.model,
                  provider: this.provider,
                  imageSize: this.imageSize,
                  mode: _0x27b77e.mode,
                });
                _0x403af9?.model && _0x42882e(_0x403af9.model, _0x403af9.provider);
              }
              (_0x6db838(), _0xd853c0());
            },
          })),
          this.generationToolbarEl.querySelector('.model-toggle')?.addEventListener('click', (_0x11e896) => {
            (_0x11e896.stopPropagation(),
              _0x24bdab?.classList.toggle('show'),
              _0x51d0cd(),
              _0x152298?.classList.remove('show'));
          }));
        const _0x4276b1 = bindImageFunctionModelMenu({
            modelMenu: _0x24bdab,
            onSelect: ({ model: _0x3ada83, provider: _0x4f294d }) => {
              _0x42882e(_0x3ada83, _0x4f294d);
            },
            closeMenu: () => {
              _0x24bdab?.classList.remove('show');
            },
          }),
          _0x398473 = bindImageFunctionModeMenu({
            modeMenu: _0x152298,
            onSelect: ({ mode: _0x2f2be8 }) => {
              const _0x2db8f1 = resolveImageFunctionModelByMode({
                model: this.model,
                provider: this.provider,
                imageSize: this.imageSize,
                mode: _0x2f2be8,
              });
              if (!_0x2db8f1?.model) return;
              (_0x42882e(_0x2db8f1.model, _0x2db8f1.provider), _0x152298?.classList.remove('show'));
            },
          });
        ((this._unbindGenerationFunctionMenus = () => {
          (_0x4276b1?.(), _0x398473?.());
        }),
          _0x2f9748?.addEventListener('click', (_0x2b5955) => {
            _0x2b5955.stopPropagation();
            if (_0x2f9748.closest('.image-function-mode-wrap')?.classList.contains('is-hidden')) return;
            (_0x152298?.classList.toggle('show'),
              _0x51d0cd(_0x152298),
              _0x24bdab?.classList.remove('show'),
              closeImageFunctionModelSubmenus(_0x24bdab));
          }),
          _0x6db838(),
          _0xd853c0(),
          this.generationToolbarEl.querySelector('.go')?.addEventListener('click', async (_0x159922) => {
            (_0x159922.stopPropagation(), await this._save());
          }),
          this.generationToolbarEl
            .querySelector('.debug-wrench-btn')
            ?.addEventListener('click', async (_0x34b007) => {
              (_0x34b007.stopPropagation(), await this._handleDebugRequest());
            }));
      }
      const _0x5ba86e = this.canvasEl.getContext('2d');
      ((_0x5ba86e.lineCap = 'round'),
        (_0x5ba86e.lineJoin = 'round'),
        (this._checkerPattern = createEraseCheckerboardPattern(_0x5ba86e, 1)));
      const _0x57a4b3 = {
          down: false,
          pointerId: null,
          previousTool: null,
          temporaryTool: null,
          textTransform: null,
        },
        _0x426eb3 = (_0x456f77, _0x538f56) => {
          this._cursorLast = { x: _0x456f77, y: _0x538f56 };
          if (this._cursorRaf) return;
          this._cursorRaf = requestAnimationFrame(() => {
            ((this._cursorRaf = 0), this._syncCursor());
          });
        },
        _0x12c5e7 = (_0x3921a6, _0x346c62, _0x12afdf, _0x2cd122 = 0) => {
          const _0x3e70f2 = appStore.getStateRaw(),
            _0x1d38ba = _0x3e70f2.nodes?.[this.nodeId];
          if (!_0x1d38ba) return false;
          const _0x33bb2d = screenToWorld(_0x3921a6, _0x346c62, _0x3e70f2.viewport);
          if (
            !isPointInRect(
              _0x33bb2d.x,
              _0x33bb2d.y,
              _0x1d38ba.x,
              _0x1d38ba.y,
              _0x1d38ba.width,
              _0x1d38ba.height,
            )
          )
            return false;
          const _0x26f278 = this._getLocalFromClient(_0x3921a6, _0x346c62, _0x3e70f2, _0x1d38ba),
            _0xbe1870 = _0x3e70f2.annotate?.tool || 'brush',
            _0x29f782 = _0x2cd122 === 1 || _0x2cd122 === 2,
            _0x3da93b = _0x29f782 ? 'eraser' : _0xbe1870;
          if (_0x3da93b !== 'text') this._selectedTextCommandIndex = null;
          const _0x255c63 = clampImageBrushSize(_0x3e70f2.annotate?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX),
            _0x3f819a = _0x255c63 / (_0x3e70f2.viewport.zoom || 1);
          _0x29f782
            ? ((_0x57a4b3.previousTool = _0xbe1870),
              (_0x57a4b3.temporaryTool = 'eraser'),
              (this._temporaryTool = 'eraser'),
              this._syncCursor('eraser', _0x255c63))
            : ((_0x57a4b3.previousTool = null),
              (_0x57a4b3.temporaryTool = null),
              (this._temporaryTool = null));
          if (_0x3da93b === 'bucket' && !this._isEraseScene())
            return (this._fillArea(_0x26f278, _0x3f819a), true);
          if (_0x3da93b === 'number-label' && this._isAnnotateScene())
            return (this._addNumberLabel(_0x26f278, _0x3f819a), true);
          if (_0x3da93b === 'text') {
            const _0x44768d = this._findTextHit(_0x26f278, _0x3e70f2.viewport);
            if (_0x44768d) {
              (this._removeTextInput(true), (this._selectedTextCommandIndex = _0x44768d.index));
              if (_0x44768d.mode === 'delete') return (this._deleteTextCommand(_0x44768d.index), true);
              if (_0x44768d.mode === 'copy')
                return (this._copyTextCommand(_0x44768d.index, _0x3e70f2.viewport), true);
              return (
                (_0x57a4b3.down = true),
                (_0x57a4b3.pointerId = _0x12afdf),
                (_0x57a4b3.textTransform = this._createTextTransformState(
                  _0x44768d,
                  _0x26f278,
                  _0x3e70f2.viewport,
                )),
                this.canvasEl.setPointerCapture(_0x12afdf),
                this._render(),
                true
              );
            }
            return (
              (this._selectedTextCommandIndex = null),
              this._openTextInput(_0x26f278, _0x3e70f2, _0x3f819a, _0x3921a6, _0x346c62),
              true
            );
          }
          if (_0x3da93b === 'rect')
            this._draft = {
              type: 'rect',
              color: getColorCanvas(_0x3e70f2.annotate?.color || 'red'),
              sizeWorld: _0x3f819a,
              x1: _0x26f278.x,
              y1: _0x26f278.y,
              x2: _0x26f278.x,
              y2: _0x26f278.y,
            };
          else
            _0x3da93b === 'eraser'
              ? (this._draft = { type: 'eraser', sizeWorld: _0x3f819a, points: [_0x26f278] })
              : (this._draft = {
                  type: 'brush',
                  color: getColorCanvas(_0x3e70f2.annotate?.color || 'red'),
                  sizeWorld: _0x3f819a,
                  points: [_0x26f278],
                });
          return (
            (_0x57a4b3.down = true),
            (_0x57a4b3.pointerId = _0x12afdf),
            this.canvasEl.setPointerCapture(_0x12afdf),
            this._render(),
            true
          );
        },
        _0x180298 = (_0xf6cb4, _0xe550d2) => {
          const _0x521739 = appStore.getStateRaw(),
            _0x291aa = _0x521739.nodes?.[this.nodeId];
          if (!_0x291aa) return;
          const _0x630a45 = this._getLocalFromClient(_0xf6cb4, _0xe550d2, _0x521739, _0x291aa);
          if (_0x57a4b3.down && _0x57a4b3.textTransform) {
            const _0x1a0c58 = _0x57a4b3.textTransform,
              _0x5bc894 = this._commands[_0x1a0c58.index];
            if (_0x5bc894?.type === 'text') {
              const _0x249df6 = _0x521739.viewport?.zoom || 1,
                _0x1e3398 = {
                  x: Number(_0x630a45.x || 0) * _0x249df6,
                  y: Number(_0x630a45.y || 0) * _0x249df6,
                };
              if (_0x1a0c58.mode === 'move')
                ((_0x5bc894.x = _0x630a45.x - _0x1a0c58.offsetWorldX),
                  (_0x5bc894.y = _0x630a45.y - _0x1a0c58.offsetWorldY));
              else {
                if (_0x1a0c58.mode === 'scale-x' || _0x1a0c58.mode === 'scale-y') {
                  const _0x104ae0 = this._resolveAxisTextScale(_0x1a0c58, _0x1e3398);
                  ((_0x5bc894.scale = undefined),
                    (_0x5bc894.scaleX = _0x104ae0.scaleX),
                    (_0x5bc894.scaleY = _0x104ae0.scaleY),
                    (_0x5bc894.x = _0x104ae0.originPx.x / _0x249df6),
                    (_0x5bc894.y = _0x104ae0.originPx.y / _0x249df6));
                } else {
                  if (_0x1a0c58.mode === 'scale-uniform') {
                    const _0x243d10 = this._toTextLocalTransformSpace(
                        _0x1e3398,
                        _0x1a0c58.originPx,
                        _0x1a0c58.rotation,
                      ),
                      _0x3c3572 = _0x243d10.x / _0x1a0c58.baseWidthPx,
                      _0x125880 = _0x243d10.y / _0x1a0c58.baseHeightPx,
                      _0x1c49ea = Math.max(_0x3c3572, _0x125880),
                      _0x24e08d = Number.isFinite(_0x1c49ea) && _0x1c49ea > 0 ? _0x1c49ea : 1;
                    ((_0x5bc894.scale = undefined),
                      (_0x5bc894.scaleX = clampTextScale(_0x1a0c58.baseScaleX * _0x24e08d)),
                      (_0x5bc894.scaleY = clampTextScale(_0x1a0c58.baseScaleY * _0x24e08d)),
                      (_0x5bc894.x = _0x1a0c58.originPx.x / _0x249df6),
                      (_0x5bc894.y = _0x1a0c58.originPx.y / _0x249df6));
                  } else {
                    if (_0x1a0c58.mode === 'rotate') {
                      const _0x23d489 = Math.atan2(
                          _0x1e3398.y - _0x1a0c58.centerPx.y,
                          _0x1e3398.x - _0x1a0c58.centerPx.x,
                        ),
                        _0x122b19 = _0x1a0c58.baseRotation + (_0x23d489 - _0x1a0c58.baseAngle);
                      _0x5bc894.rotation = _0x122b19;
                      const { scaleX: _0x31e8cf, scaleY: _0x3f2264 } = getTextScalePair(_0x5bc894),
                        _0x411754 = {
                          x: (_0x1a0c58.layoutWidth * _0x31e8cf) / 2,
                          y: (_0x1a0c58.layoutHeight * _0x3f2264) / 2,
                        },
                        _0x2e57cc = Math.cos(_0x122b19),
                        _0x5ea1be = Math.sin(_0x122b19),
                        _0x110c01 = _0x411754.x * _0x2e57cc - _0x411754.y * _0x5ea1be,
                        _0x348fc0 = _0x411754.x * _0x5ea1be + _0x411754.y * _0x2e57cc,
                        _0x25b2b7 = {
                          x: _0x1a0c58.centerPx.x - _0x110c01,
                          y: _0x1a0c58.centerPx.y - _0x348fc0,
                        };
                      ((_0x5bc894.x = _0x25b2b7.x / _0x249df6), (_0x5bc894.y = _0x25b2b7.y / _0x249df6));
                    }
                  }
                }
              }
              ((this._selectedTextCommandIndex = _0x1a0c58.index), this._render());
            }
            return;
          }
          if (!_0x57a4b3.down || !this._draft) return;
          (this._draft.type === 'rect'
            ? ((this._draft.x2 = _0x630a45.x), (this._draft.y2 = _0x630a45.y))
            : this._draft.points.push(_0x630a45),
            this._render());
        },
        _0x117a90 = () => {
          if (_0x57a4b3.down && _0x57a4b3.textTransform) {
            ((_0x57a4b3.down = false),
              (_0x57a4b3.pointerId = null),
              (_0x57a4b3.textTransform = null),
              (_0x57a4b3.previousTool = null),
              (_0x57a4b3.temporaryTool = null),
              (this._temporaryTool = null),
              (this._redoStack = []),
              (this._dirty = true),
              this._persistEraseSelectionState(),
              this._render());
            return;
          }
          if (!_0x57a4b3.down || !this._draft) return;
          const _0x580ba9 = this._draft;
          ((this._draft = null), (_0x57a4b3.down = false), (_0x57a4b3.pointerId = null));
          const _0x7a7278 = _0x57a4b3.previousTool;
          ((_0x57a4b3.previousTool = null),
            (_0x57a4b3.temporaryTool = null),
            (_0x57a4b3.textTransform = null),
            (this._temporaryTool = null));
          if (shouldDiscardStrokeCommand(_0x580ba9)) {
            _0x7a7278 ? this._syncCursor(_0x7a7278, this._view?.brushSizePx) : this._syncCursor();
            this._render();
            return;
          }
          if (_0x580ba9.type === 'rect') {
            const _0x5e1fca = Math.abs(_0x580ba9.x2 - _0x580ba9.x1),
              _0xb945fc = Math.abs(_0x580ba9.y2 - _0x580ba9.y1);
            if (_0x5e1fca < 0.5 && _0xb945fc < 0.5) {
              _0x7a7278 ? this._syncCursor(_0x7a7278, this._view?.brushSizePx) : this._syncCursor();
              this._render();
              return;
            }
          }
          (this._commands.push(_0x580ba9),
            (this._redoStack = []),
            (this._dirty = true),
            this._persistEraseSelectionState(),
            _0x7a7278 && this._syncCursor(_0x7a7278, this._view?.brushSizePx),
            this._render());
        };
      (this.canvasEl.addEventListener('pointerdown', (_0x27bd19) => {
        (_0x27bd19.preventDefault(),
          _0x27bd19.stopPropagation(),
          _0x426eb3(_0x27bd19.clientX, _0x27bd19.clientY),
          _0x12c5e7(_0x27bd19.clientX, _0x27bd19.clientY, _0x27bd19.pointerId, _0x27bd19.button));
      }),
        this.canvasEl.addEventListener('contextmenu', (_0x5851a3) => {
          (_0x5851a3.preventDefault(), _0x5851a3.stopPropagation());
        }),
        this.canvasEl.addEventListener('pointermove', (_0x3c1059) => {
          (_0x3c1059.preventDefault(),
            _0x3c1059.stopPropagation(),
            _0x426eb3(_0x3c1059.clientX, _0x3c1059.clientY),
            _0x180298(_0x3c1059.clientX, _0x3c1059.clientY));
        }),
        this.canvasEl.addEventListener('pointerup', (_0x4d71ac) => {
          (_0x4d71ac.preventDefault(),
            _0x4d71ac.stopPropagation(),
            _0x426eb3(_0x4d71ac.clientX, _0x4d71ac.clientY),
            _0x117a90());
        }),
        this.canvasEl.addEventListener('pointercancel', (_0x498adf) => {
          (_0x498adf.preventDefault(),
            _0x498adf.stopPropagation(),
            _0x426eb3(_0x498adf.clientX, _0x498adf.clientY),
            _0x117a90());
        }),
        this.canvasEl.addEventListener('pointerenter', (_0x457814) => {
          ((this._cursorHover = true), _0x426eb3(_0x457814.clientX, _0x457814.clientY));
        }),
        this.canvasEl.addEventListener('pointerleave', () => {
          ((this._cursorHover = false), this._syncCursor());
        }));
    },
    _syncPaletteActive() {
      if (!this.colorButtons) return;
      const _0x90da07 = normalizeColorName(this._view?.color) || 'red',
        _0x8a72cd = getColorCss(_0x90da07);
      (this.colorDotEl &&
        ((this.colorDotEl.style.background = _0x8a72cd),
        (this.colorDotEl.style.borderColor =
          _0x90da07 === 'black'
            ? 'var(--white-35)'
            : _0x90da07 === 'white'
              ? 'var(--white-25)'
              : 'var(--black-20)')),
        this.colorButtons.forEach((_0x15cdc2) => {
          if (_0x15cdc2.dataset.color === _0x90da07) _0x15cdc2.classList.add('active');
          else _0x15cdc2.classList.remove('active');
        }));
    },
    _onCanvasWheel(_0x19b088) {
      (_0x19b088.preventDefault(), _0x19b088.stopPropagation());
      if (!this.active) return;
      if (!this._cursorHover) return;
      const _0x3c6495 = this._view?.tool || 'brush';
      if (
        _0x3c6495 !== 'brush' &&
        _0x3c6495 !== 'eraser' &&
        _0x3c6495 !== 'bucket' &&
        _0x3c6495 !== 'number-label' &&
        _0x3c6495 !== 'text'
      )
        return;
      const _0x97ff07 = _0x19b088.deltaY || 0,
        _0x526d26 = _0x97ff07 < 0 ? 1 : -1,
        _0x3b7158 = clampImageBrushSize(this._view?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX),
        _0x2cffc1 = clampImageBrushSize(_0x3b7158 + _0x526d26 * 2, IMAGE_BRUSH_DEFAULT_SIZE_PX);
      if (_0x2cffc1 === _0x3b7158) return;
      appStore.setAnnotateState({ brushSizePx: _0x2cffc1 });
      if (this.sizeRangeEl) this.sizeRangeEl.value = String(_0x2cffc1);
      if (this.sizeValueEl) this.sizeValueEl.textContent = String(_0x2cffc1);
      this._syncCursor();
    },
    _syncCursor(
      _0x3cb000 = this._temporaryTool || this._view?.tool || 'brush',
      _0x12e9e6 = this._view?.brushSizePx || IMAGE_BRUSH_DEFAULT_SIZE_PX,
    ) {
      if (!this.cursorEl) return;
      if (_0x3cb000 === 'text') {
        ((this.cursorEl.style.display = 'none'),
          this.cursorEl.classList.remove('is-erase-brush'),
          this._syncTextToolCursor());
        return;
      }
      syncCircularBrushCursor({
        cursorEl: this.cursorEl,
        canvasEl: this.canvasEl,
        visible: this._cursorHover,
        tool: _0x3cb000,
        allowedTools: ['brush', 'eraser', 'bucket', 'number-label'],
        sizePx: _0x12e9e6,
        cursorLast: this._cursorLast,
        isEraseBrush: this._isGenerationScene() || _0x3cb000 === 'eraser',
      });
    },
    _getTextScaleCursor(_0x513501) {
      const _0x50a74b =
        document.querySelector('#v2-wrap .group-resizer.v2-resize-move') ||
        document.querySelector('#v2-wrap .v2-resize-move');
      if (_0x50a74b) {
        const _0x4dd226 = getComputedStyle(_0x50a74b).cursor;
        if (_0x4dd226 && _0x4dd226 !== 'auto') return _0x4dd226;
      }
      return 'move';
    },
    _getCanvasPointerCursor() {
      return getCssVar('--pointer-cursor') || 'default';
    },
    _syncTextToolCursor() {
      if (!this.canvasEl) return;
      const _0x19e996 = this._getCanvasPointerCursor();
      if (!this._cursorHover) {
        this.canvasEl.style.cursor = _0x19e996;
        return;
      }
      const _0x5e07c3 = appStore.getStateRaw(),
        _0xa07114 = _0x5e07c3.nodes?.[this.nodeId];
      if (!_0xa07114) {
        this.canvasEl.style.cursor = _0x19e996;
        return;
      }
      const _0x3444f4 = this._getLocalFromClient(
          this._cursorLast.x,
          this._cursorLast.y,
          _0x5e07c3,
          _0xa07114,
        ),
        _0x232c88 = this._findTextHit(_0x3444f4, _0x5e07c3.viewport);
      if (!_0x232c88) {
        this.canvasEl.style.cursor = _0x19e996;
        return;
      }
      if (_0x232c88.mode === 'delete' || _0x232c88.mode === 'copy') {
        this.canvasEl.style.cursor = 'var(--link-cursor)';
        return;
      }
      if (_0x232c88.mode === 'rotate') {
        this.canvasEl.style.cursor = ROTATE_CURSOR_CSS + ', ' + _0x19e996;
        return;
      }
      if (_0x232c88.mode === 'scale-uniform') {
        this.canvasEl.style.cursor = this._getTextScaleCursor(_0x232c88);
        return;
      }
      if (_0x232c88.mode === 'scale-x') {
        this.canvasEl.style.cursor = 'var(--resize-ew-cursor)';
        return;
      }
      if (_0x232c88.mode === 'scale-y') {
        this.canvasEl.style.cursor = 'var(--resize-ns-cursor)';
        return;
      }
      this.canvasEl.style.cursor = _0x19e996;
    },
    _updateToolActive(
      _0xe0a1aa = this._view?.tool || 'brush',
      _0x552a11 = this._view?.brushSizePx || IMAGE_BRUSH_DEFAULT_SIZE_PX,
    ) {
      (this.toolButtons.forEach((_0x2f497e) => {
        if (_0x2f497e.dataset.tool === _0xe0a1aa) _0x2f497e.classList.add('active');
        else _0x2f497e.classList.remove('active');
      }),
        this._syncCursor(_0xe0a1aa, _0x552a11));
    },
    _setTool(_0x3f7bbb) {
      if (_0x3f7bbb !== 'text') this._removeTextInput(true);
      if (_0x3f7bbb !== 'text') this._selectedTextCommandIndex = null;
      const _0x11f578 = getAnnotateToolbarToolsForScene(this._mode?.scene || 'annotate'),
        _0xa8ed63 = _0x11f578.includes(_0x3f7bbb) ? _0x3f7bbb : 'brush';
      (appStore.setAnnotateState({ tool: _0xa8ed63 }), this._persistEraseSelectionState());
    },
    _removeTextInput(_0x321d05 = true, _0x4a0b58 = null) {
      const _0x107453 = _0x4a0b58 || this._textInputEl;
      if (!_0x107453) return;
      const _0x45ecdb = this._textInputEl === _0x107453,
        _0x175fa0 = String(_0x107453.value || '').trim(),
        _0x3a1cce = Number(_0x107453.dataset.localX),
        _0x289419 = Number(_0x107453.dataset.localY),
        _0x1db14c = Number(_0x107453.dataset.sizeWorld),
        _0x53b39b = String(_0x107453.dataset.color || '');
      _0x107453.parentElement && _0x107453.parentElement.removeChild(_0x107453);
      _0x45ecdb && (this._textInputEl = null);
      if (!_0x45ecdb) return;
      if (
        !_0x321d05 ||
        !_0x175fa0 ||
        !Number.isFinite(_0x3a1cce) ||
        !Number.isFinite(_0x289419) ||
        !Number.isFinite(_0x1db14c)
      )
        return;
      (this._commands.push({
        type: 'text',
        text: _0x175fa0.slice(0, 200),
        color: _0x53b39b || getColorCanvas('red'),
        sizeWorld: _0x1db14c,
        x: _0x3a1cce,
        y: _0x289419,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      }),
        (this._selectedTextCommandIndex = this._commands.length - 1),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render());
    },
    _openTextInput(_0x52a4bb, _0xd5ff34, _0x37f8bb, _0x202b33, _0x17ffc9) {
      this._removeTextInput(true);
      const _0x38e743 = document.createElement('input');
      ((_0x38e743.type = 'text'),
        (_0x38e743.maxLength = 200),
        (_0x38e743.className = 'v2-annotate-text-input'),
        (_0x38e743.dataset.localX = String(_0x52a4bb.x)),
        (_0x38e743.dataset.localY = String(_0x52a4bb.y)),
        (_0x38e743.dataset.sizeWorld = String(_0x37f8bb)),
        (_0x38e743.dataset.color = getColorCanvas(_0xd5ff34.annotate?.color || 'red')),
        (_0x38e743.style.left = _0x202b33 + 'px'),
        (_0x38e743.style.top = _0x17ffc9 + 'px'),
        _0x38e743.style.setProperty(
          '--annotate-text-input-size',
          clampImageBrushSize(_0xd5ff34.annotate?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX) + 'px',
        ),
        _0x38e743.style.setProperty(
          '--annotate-text-input-color',
          _0x38e743.dataset.color || getColorCanvas('red'),
        ));
      let _0x586e9c = false;
      const _0x4e67b6 = (_0x4706cf) => {
        if (_0x586e9c) return;
        ((_0x586e9c = true), this._removeTextInput(_0x4706cf, _0x38e743));
      };
      (_0x38e743.addEventListener('pointerdown', (_0x56d76e) => _0x56d76e.stopPropagation()),
        _0x38e743.addEventListener('keydown', (_0x7372e0) => {
          if (_0x7372e0.key === 'Enter' && !_0x7372e0.isComposing)
            (_0x7372e0.preventDefault(), _0x4e67b6(true));
          else _0x7372e0.key === 'Escape' && (_0x7372e0.preventDefault(), _0x4e67b6(false));
        }),
        _0x38e743.addEventListener('blur', () => _0x4e67b6(true)),
        this.overlayEl?.appendChild(_0x38e743),
        (this._textInputEl = _0x38e743),
        requestAnimationFrame(() => {
          if (this._textInputEl === _0x38e743) _0x38e743.focus();
        }));
    },
    _getTextLayout(_0x5bb04e, _0x28475f) {
      return getTextLayout({ canvasEl: this.canvasEl, cmd: _0x5bb04e, viewport: _0x28475f });
    },
    _getTextGeometry(_0x589c62, _0x292564) {
      return getTextGeometry({ canvasEl: this.canvasEl, cmd: _0x589c62, viewport: _0x292564 });
    },
    _toTextLocalTransformSpace(_0xf6056, _0x477924, _0x3e31c0) {
      return toTextLocalTransformSpace(_0xf6056, _0x477924, _0x3e31c0);
    },
    _rotateTextLocalPoint(_0x4af369, _0x508bc9) {
      return rotateTextLocalPoint(_0x4af369, _0x508bc9);
    },
    _resolveAxisTextScale(_0x116c94, _0x51da68) {
      return resolveAxisTextScale(_0x116c94, _0x51da68);
    },
    _deleteTextCommand(_0x5c2751) {
      const _0x5b2071 = Number(_0x5c2751);
      if (!Number.isInteger(_0x5b2071) || this._commands[_0x5b2071]?.type !== 'text') return false;
      return (
        this._commands.splice(_0x5b2071, 1),
        (this._selectedTextCommandIndex = null),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render(),
        true
      );
    },
    _copyTextCommand(_0x2d69ec, _0x1a3aa3 = this._view?.viewport) {
      const _0x35f4e3 = Number(_0x2d69ec),
        _0x94e44f = this._commands[_0x35f4e3];
      if (!Number.isInteger(_0x35f4e3) || _0x94e44f?.type !== 'text') return false;
      const _0x411de4 = buildCopiedTextCommand(_0x94e44f, _0x1a3aa3);
      return (
        this._commands.splice(_0x35f4e3 + 1, 0, _0x411de4),
        (this._selectedTextCommandIndex = _0x35f4e3 + 1),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render(),
        true
      );
    },
    deleteSelectedTextCommand() {
      const _0x1cb97d = Number(this._selectedTextCommandIndex);
      if (!Number.isInteger(_0x1cb97d)) return false;
      return this._deleteTextCommand(_0x1cb97d);
    },
    _findTextHit(_0x492a1b, _0xe799a3) {
      return findTextHit({
        commands: this._commands,
        selectedTextCommandIndex: this._selectedTextCommandIndex,
        local: _0x492a1b,
        viewport: _0xe799a3,
        canvasEl: this.canvasEl,
      });
    },
    _createTextTransformState(_0x5f3104, _0x37fab2, _0x4ce9cf) {
      return createTextTransformState({
        commands: this._commands,
        hit: _0x5f3104,
        local: _0x37fab2,
        viewport: _0x4ce9cf,
        canvasEl: this.canvasEl,
      });
    },
    _normalizeSelectedTextCommand() {
      const _0x16cd03 = Number(this._selectedTextCommandIndex);
      if (!Number.isInteger(_0x16cd03) || _0x16cd03 < 0 || _0x16cd03 >= this._commands.length) {
        this._selectedTextCommandIndex = null;
        return;
      }
      this._commands[_0x16cd03]?.type !== 'text' && (this._selectedTextCommandIndex = null);
    },
    _updateView(_0x4f39cd) {
      if (!this.active) return;
      const _0x57aa85 = _0x4f39cd?.node,
        _0x2740b0 = _0x4f39cd?.viewport;
      if (!_0x57aa85) return;
      this.nodeData = _0x57aa85;
      const _0x1f7ba2 = clampImageBrushSize(_0x4f39cd?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX);
      if (this.sizeRangeEl && Number(this.sizeRangeEl.value) !== _0x1f7ba2)
        this.sizeRangeEl.value = String(_0x1f7ba2);
      if (this.sizeValueEl && this.sizeValueEl.textContent !== String(_0x1f7ba2))
        this.sizeValueEl.textContent = String(_0x1f7ba2);
      (this._updateToolActive(_0x4f39cd?.tool, _0x1f7ba2), this._syncPaletteActive(_0x4f39cd?.color));
      const _0x2c76d3 = worldToScreen(_0x57aa85.x, _0x57aa85.y, _0x2740b0),
        _0xa6852e = Math.round(_0x57aa85.width * _0x2740b0.zoom),
        _0x1ebfe0 = Math.round(_0x57aa85.height * _0x2740b0.zoom);
      ((this.containerEl.style.left = Math.round(_0x2c76d3.x) + 'px'),
        (this.containerEl.style.top = Math.round(_0x2c76d3.y) + 'px'),
        (this.containerEl.style.width = _0xa6852e + 'px'),
        (this.containerEl.style.height = _0x1ebfe0 + 'px'));
      const _0x430019 = window.devicePixelRatio || 1,
        _0xd1eb56 = Math.max(1, _0xa6852e),
        _0x176e51 = Math.max(1, _0x1ebfe0);
      if (
        this.canvasEl.width !== Math.round(_0xd1eb56 * _0x430019) ||
        this.canvasEl.height !== Math.round(_0x176e51 * _0x430019)
      ) {
        ((this.canvasEl.width = Math.round(_0xd1eb56 * _0x430019)),
          (this.canvasEl.height = Math.round(_0x176e51 * _0x430019)),
          (this.canvasEl.style.width = _0xd1eb56 + 'px'),
          (this.canvasEl.style.height = _0x176e51 + 'px'));
        const _0x126506 = this.canvasEl.getContext('2d');
        (_0x126506.setTransform(_0x430019, 0, 0, _0x430019, 0, 0),
          (_0x126506.lineCap = 'round'),
          (_0x126506.lineJoin = 'round'));
      }
      const _0x5abb08 = Math.max(12, Math.round(_0x2c76d3.y) - 54);
      ((this.toolbarEl.style.left = Math.round(_0x2c76d3.x + _0xa6852e / 2) + 'px'),
        (this.toolbarEl.style.top = _0x5abb08 + 'px'),
        this.generationToolbarEl &&
          ((this.generationToolbarEl.style.left = Math.round(_0x2c76d3.x + _0xa6852e / 2) + 'px'),
          (this.generationToolbarEl.style.top = Math.round(_0x2c76d3.y + _0x1ebfe0 + 14) + 'px'),
          (this.generationToolbarEl.style.bottom = 'auto'),
          (this.generationToolbarEl.style.transform = 'translateX(-50%)')),
        this._applyStageFlip(this._getCurrentFlipState()),
        this._render(_0x2740b0));
    },
    _render(_0x254bea = this._view?.viewport) {
      if (!this.active || !this.canvasEl) return;
      this._applyStageFlip(this._getCurrentFlipState());
      const _0xcc2048 = this.canvasEl.getContext('2d'),
        _0x2cfdf6 = Number(this.canvasEl.style.width.replace('px', '')) || 1,
        _0x31ac84 = Number(this.canvasEl.style.height.replace('px', '')) || 1;
      _0xcc2048.clearRect(0, 0, _0x2cfdf6, _0x31ac84);
      if (this._isGenerationScene()) {
        this._renderEraseSceneCommands(_0xcc2048, _0x254bea, this._commands, this._draft);
        return;
      }
      this._renderCommands(_0xcc2048, _0x254bea, this._commands);
      if (this._draft) this._renderCommands(_0xcc2048, _0x254bea, [this._draft], true);
    },
    _renderEraseSceneCommands(_0x273d93, _0x492f30, _0x6443af = [], _0x552257 = null) {
      this._eraseMaskCanvasEl = renderEraseSceneCommands({
        documentRef: document,
        canvasEl: this.canvasEl,
        ctx: _0x273d93,
        viewport: _0x492f30,
        commands: _0x6443af,
        draft: _0x552257,
        checkerPattern: this._checkerPattern,
        eraseMaskCanvasEl: this._eraseMaskCanvasEl,
      });
    },
    _renderCommands(_0x15de10, _0x3a636a, _0x3b98fb, _0x221a84 = false) {
      renderCommands({
        ctx: _0x15de10,
        viewport: _0x3a636a,
        canvasEl: this.canvasEl,
        commands: _0x3b98fb,
        isDraft: _0x221a84,
        isEraseScene: this._isEraseScene(),
        checkerPattern: this._checkerPattern,
        defaultTextColor: getColorCanvas('red'),
        getTextGeometry: (_0x247dde, _0x2d8298) => this._getTextGeometry(_0x247dde, _0x2d8298),
        selectedTextCommandIndex: this._selectedTextCommandIndex,
        selectedCommandsRef: this._commands,
        resolveCssVar: getCssVar,
        fillRegionCache: this._fillRegionCache,
        numberLabelBackgroundColor: getCssVar('--canvas-white'),
      });
    },
    _addNumberLabel(_0x2e1672, _0x132390) {
      if (!this.active || !this._isAnnotateScene()) return null;
      const _0x4c317a = appStore.getStateRaw(),
        _0x5d3060 = Number(_0x2e1672?.x),
        _0x893361 = Number(_0x2e1672?.y);
      if (!Number.isFinite(_0x5d3060) || !Number.isFinite(_0x893361)) return null;
      const _0x290f7a = {
        type: 'number-label',
        number: getNextNumberLabelValue(this._commands),
        x: _0x5d3060,
        y: _0x893361,
        color: getColorCanvas(_0x4c317a.annotate?.color || 'red'),
        sizeWorld: _0x132390,
      };
      return (
        this._commands.push(_0x290f7a),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render(),
        _0x290f7a
      );
    },
    _fillArea(_0x16e841, _0x59ef12) {
      const _0x4ed746 = appStore.getStateRaw(),
        _0x5c5daa = {
          type: 'fill',
          x: Number(_0x16e841?.x) || 0,
          y: Number(_0x16e841?.y) || 0,
          color: getColorCanvas(_0x4ed746.annotate?.color || 'red'),
        };
      (this._commands.push(_0x5c5daa),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render());
    },
    _pushFlipCommand(_0x33482f) {
      if (!this.active || !this._isAnnotateScene()) return;
      if (_0x33482f !== 'flip-horizontal' && _0x33482f !== 'flip-vertical') return;
      (this._removeTextInput(true),
        this._commands.push({ type: _0x33482f }),
        (this._redoStack = []),
        (this._dirty = true),
        this._normalizeSelectedTextCommand(),
        this._render());
    },
    _flipHorizontal() {
      this._pushFlipCommand('flip-horizontal');
    },
    _flipVertical() {
      this._pushFlipCommand('flip-vertical');
    },
    _undo() {
      if (this._commands.length === 0) return;
      const _0x3584b1 = this._commands.pop();
      (this._redoStack.push(_0x3584b1),
        (this._dirty = true),
        this._normalizeSelectedTextCommand(),
        this._persistEraseSelectionState(),
        this._render());
    },
    _redo() {
      if (this._redoStack.length === 0) return;
      const _0x33cdf5 = this._redoStack.pop();
      (this._commands.push(_0x33cdf5),
        (this._dirty = true),
        this._normalizeSelectedTextCommand(),
        this._persistEraseSelectionState(),
        this._render());
    },
    _clear() {
      if (this._commands.length === 0 && this._redoStack.length === 0) return;
      ((this._commands = []),
        (this._redoStack = []),
        (this._draft = null),
        (this._selectedTextCommandIndex = null),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render());
    },
    _applyBaseSurface() {
      if (!this.stageEl || !this.imgEl) return;
      const _0x3c11d7 = Boolean(this._useWhiteboardBase);
      (this.stageEl.classList.toggle('is-whiteboard', _0x3c11d7),
        this.overlayEl?.classList.toggle('is-whiteboard', _0x3c11d7),
        this.imgEl.setAttribute('aria-hidden', _0x3c11d7 ? 'true' : 'false'));
    },
    _createNewWhiteboard() {
      if (!this.active || this._isGenerationScene()) return;
      (this._removeTextInput(false),
        (this._commands = []),
        (this._redoStack = []),
        (this._draft = null),
        (this._selectedTextCommandIndex = null),
        (this._useWhiteboardBase = true),
        (this._dirty = true),
        appStore.setAnnotateState({ color: 'black' }),
        this._applyBaseSurface(),
        this._render(),
        window.showToast?.(imageAnnotateText('toasts.newBoard'), 'ok'));
    },
    _persistEraseSelectionState() {
      if (!this._isEraseScene() || !this.nodeId) return;
      const _0x328b20 = appStore.getStateRaw().nodes?.[this.nodeId];
      if (!_0x328b20) return;
      const _0x420a5d = appStore.getStateRaw().annotate || {},
        _0x127869 = buildPersistedEraseSelectionState({
          commands: this._commands,
          tool: _0x420a5d.tool,
          brushSizePx: _0x420a5d.brushSizePx,
        });
      appStore.updateNodeData(this.nodeId, { [ERASE_SELECTION_STATE_KEY]: _0x127869 });
    },
    _buildSelectionMaskCanvas(_0x2350cb, _0x555189, _0x24c7cf, _0x3b4bef) {
      return buildSelectionMaskCanvas({
        documentRef: document,
        commands: this._commands,
        naturalW: _0x2350cb,
        naturalH: _0x555189,
        scaleX: _0x24c7cf,
        scaleY: _0x3b4bef,
      });
    },
    async _buildGenerationPayload(_0xd42756, _0x2c86b3) {
      return buildGenerationPayload({
        scene: this._mode?.scene,
        commands: this._commands,
        promptText: this.promptText,
        node: _0xd42756,
        imgUrl: _0x2c86b3,
        model: this.model,
        provider: this.provider,
        imageSize: this.imageSize,
        erasePrompt: ERASE_GENERATE_PROMPT,
        loadImage: (_0x34e02f) => this._loadImage(_0x34e02f),
        createSelectionMaskCanvas: (_0x95ace6, _0x15c746, _0x1eb1ea, _0x388548) =>
          this._buildSelectionMaskCanvas(_0x95ace6, _0x15c746, _0x1eb1ea, _0x388548),
        getModelProvider: getModelProvider,
        notify: (_0x47e140, _0x3295f2) => window.showToast?.(_0x47e140, _0x3295f2),
        documentRef: document,
        urlApi: URL,
      });
    },
    async _handleDebugRequest() {
      if (!this.active || !this._isGenerationScene()) return;
      const _0x116935 = appStore.getState(),
        _0x883383 = _0x116935.nodes?.[this.nodeId];
      if (!_0x883383) return;
      const _0x326290 = this._resolveNodeImageUrl(_0x883383);
      if (!_0x326290) return;
      let _0x54ea87 = '';
      try {
        const _0xbfe9b7 = await this._buildGenerationPayload(_0x883383, _0x326290);
        if (!_0xbfe9b7?.payload) return;
        _0x54ea87 = _0xbfe9b7.inputUrl || '';
        const _0x27dcd5 = await buildGenerateImageRequest(_0xbfe9b7.payload),
          _0x2a6c30 = formatFinalApiDebugRequest(_0x27dcd5),
          _0x330dd9 = _0x883383.x + (_0x883383.width || 0x17c) + 50,
          _0xa5f516 = _0x883383.y;
        let _0x226d58 = Object.values(_0x116935.nodes).find((_0x2a843f) => _0x2a843f.type === 'debug');
        (!_0x226d58
          ? appStore.addNode({
              id: 'debug-' + Date.now(),
              type: 'debug',
              x: _0x330dd9,
              y: _0xa5f516,
              width: 0x17c,
              height: 0x12c,
              name: imageAnnotateText('debug.nodeName'),
              outputText: _0x2a6c30,
            })
          : appStore.updateNodeData(_0x226d58.id, { outputText: _0x2a6c30, x: _0x330dd9, y: _0xa5f516 }),
          window.showToast?.(imageAnnotateText('debug.shown'), 'warn'));
      } catch (_0x49518b) {
        window.showToast?.(
          imageAnnotateText('debug.buildRequestFailed', { error: _0x49518b.message }),
          'error',
        );
      } finally {
        if (_0x54ea87) URL.revokeObjectURL(_0x54ea87);
      }
    },
    async _generateEraseResult(_0x5065cf, _0x1754ad) {
      const _0x75072b = await this._buildGenerationPayload(_0x5065cf, _0x1754ad);
      if (!_0x75072b?.payload) return;
      await runGenerationResultFlow({
        scene: 'erase',
        built: _0x75072b,
        sourceNode: _0x5065cf,
        fallbackModel: this.model,
        fallbackProvider: this.provider,
        exitController: (_0x5557eb) => this.exit(_0x5557eb),
        notify: (_0x5051e5, _0xcd049f) => window.showToast?.(_0x5051e5, _0xcd049f),
      });
    },
    async _generateRepaintResult(_0x4d46de, _0x4caeca) {
      const _0x5a1f40 = await this._buildGenerationPayload(_0x4d46de, _0x4caeca);
      if (!_0x5a1f40?.payload) return;
      await runGenerationResultFlow({
        scene: 'repaint',
        built: _0x5a1f40,
        sourceNode: _0x4d46de,
        fallbackModel: this.model,
        fallbackProvider: this.provider,
        exitController: (_0x3af909) => this.exit(_0x3af909),
        notify: (_0x4e7193, _0x2552e2) => window.showToast?.(_0x4e7193, _0x2552e2),
      });
    },
    async _save() {
      if (!this.active) return;
      this._removeTextInput(true);
      const _0xdb9af6 = appStore.getState(),
        _0x16bbef = _0xdb9af6.nodes[this.nodeId];
      if (!_0x16bbef) return;
      const _0x475033 = this._resolveNodeImageUrl(_0x16bbef);
      if (!_0x475033) return;
      const _0x284964 =
          this.generationToolbarEl?.querySelector('.go') || this.toolbarEl.querySelector('.act-save'),
        _0x20e224 = _0x284964?.querySelector('span') || null,
        _0x276f2f = _0x20e224 ? _0x20e224.textContent : '';
      _0x20e224 &&
        (_0x20e224.textContent = this._mode?.submitBusyLabel || imageAnnotateText('actions.saving'));
      if (!_0x284964) return;
      _0x284964.style.pointerEvents = 'none';
      try {
        if (this._isEraseScene()) {
          await this._generateEraseResult(_0x16bbef, _0x475033);
          return;
        }
        if (this._isRepaintScene()) {
          await this._generateRepaintResult(_0x16bbef, _0x475033);
          return;
        }
        const _0x2bf5f8 = this._isEraseScene(),
          _0x2ae44c = !_0x2bf5f8 && this._useWhiteboardBase,
          { blob: _0x43bbe0, exportType: _0x4078ac } = await exportAnnotateCanvasBlob({
            documentRef: document,
            node: _0x16bbef,
            imgEl: this.imgEl,
            imgUrl: _0x475033,
            commands: this._commands,
            useWhiteboardBase: _0x2ae44c,
            isEraseScene: _0x2bf5f8,
            loadImage: (_0x28b7ef) => this._loadImage(_0x28b7ef),
            getCurrentFlipState: () => this._getCurrentFlipState(),
            applyFlipTransformToContext: (_0x597d9f, _0x5655f8, _0x1c1b9, _0x2fafb9) =>
              this._applyFlipTransformToContext(_0x597d9f, _0x5655f8, _0x1c1b9, _0x2fafb9),
            createSelectionMaskCanvas: (_0x6694d1, _0x43a98c, _0x4d356c, _0x5d8c88) =>
              this._buildSelectionMaskCanvas(_0x6694d1, _0x43a98c, _0x4d356c, _0x5d8c88),
            canvasWhiteColor: getCssVar('--canvas-white'),
            defaultTextColor: getColorCanvas('red'),
          });
        (await saveAnnotateExportResult({
          blob: _0x43bbe0,
          exportType: _0x4078ac,
          scene: this._mode?.scene,
          sourceNodeId: this.nodeId,
          baseNode: _0x16bbef,
          notify: (_0x50f127, _0x39d170) => window.showToast?.(_0x50f127, _0x39d170),
          triggerLocalCacheSave: () => window._triggerLocalCacheSave?.(),
        }),
          this.exit({ silent: true }));
      } catch (_0x6e0ae7) {
        (console.error('[Annotate] save failed:', _0x6e0ae7),
          window.showToast?.(imageAnnotateText('toasts.saveFailed'), 'error'));
      } finally {
        if (_0x20e224) _0x20e224.textContent = _0x276f2f;
        _0x284964.style.pointerEvents = 'auto';
      }
    },
    _resolveNodeImageUrl(_0x530a28) {
      const _0x44ffe9 = _0x530a28.mainImageIndex || 0,
        _0x5f35ba = _0x530a28.images && _0x530a28.images[_0x44ffe9],
        _0xd880b4 = _0x530a28.localPath || _0x5f35ba?.localPath,
        _0x1efe34 = localPathToUrl(_0xd880b4);
      if (_0x1efe34) return _0x1efe34;
      return (
        _0x530a28.src ||
        _0x530a28.sourceUrl ||
        _0x530a28.imageUrl ||
        _0x530a28.thumbUrl ||
        _0x5f35ba?.imageUrl ||
        _0x5f35ba?.thumbUrl ||
        ''
      );
    },
    _loadImage(_0x5979c6) {
      return new Promise((_0x4cc61e, _0x18d28f) => {
        const _0x275baa = new Image();
        ((_0x275baa.crossOrigin = 'anonymous'),
          (_0x275baa.onload = () => _0x4cc61e(_0x275baa)),
          (_0x275baa.onerror = () => _0x18d28f(new Error(imageAnnotateText('errors.imageLoadFailed')))),
          (_0x275baa.src = _0x5979c6));
      });
    },
  };
export default ImageAnnotateController;

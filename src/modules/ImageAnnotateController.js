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
function imageAnnotateText(value, item = {}) {
  return t('imageAnnotate.' + value, item);
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
  getCssVar = (key) => getComputedStyle(document.documentElement).getPropertyValue(key).trim(),
  COLOR_NAME_BY_VAR = Object.fromEntries(
    Object.entries(COLOR_VAR_MAP).map(([index, result]) => [result, index]),
  ),
  normalizeColorName = (data) => {
    const enabled = String(data || '').trim();
    if (!enabled) return 'red';
    if (COLOR_VAR_MAP[enabled]) return enabled;
    const options = enabled.match(/^var\(\s*(--[^)]+)\s*\)$/);
    if (options && COLOR_NAME_BY_VAR[options[1]]) return COLOR_NAME_BY_VAR[options[1]];
    return 'red';
  },
  getColorCss = (target) => {
    const source = COLOR_VAR_MAP[target];
    return source ? 'var(' + source + ')' : target;
  },
  getColorCanvas = (next) => {
    const enabled2 = COLOR_VAR_MAP[next];
    if (!enabled2) return next;
    return getCssVar(enabled2) || next;
  },
  isFiniteCommandPoint = (box) => Number.isFinite(Number(box?.x)) && Number.isFinite(Number(box?.y)),
  hasDrawableStrokePoints = (current) =>
    Array.isArray(current?.points) && current.points.some(isFiniteCommandPoint),
  shouldDiscardStrokeCommand = (entry) =>
    (entry?.type === 'brush' || entry?.type === 'eraser') && !hasDrawableStrokePoints(entry);
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
    init(nodeId, record = {}) {
      if (this.active) return;
      const viewport = appStore.getStateRaw(),
        enabled3 = viewport.nodes?.[nodeId];
      if (!enabled3) return;
      const enabled4 = this._resolveNodeImageUrl(enabled3);
      if (!enabled4) {
        window.showToast?.(imageAnnotateText('toasts.noImage'), 'warn');
        return;
      }
      const scene = String(record.scene || 'annotate'),
        payload = scene === 'erase' ? readPersistedEraseSelectionState(enabled3) : null,
        tool =
          scene === 'erase'
            ? payload?.tool || 'brush'
            : scene === 'repaint'
              ? 'brush'
              : viewport.annotate?.tool === 'bucket'
                ? 'brush'
                : viewport.annotate?.tool || 'brush',
        color = normalizeColorName(viewport.annotate?.color),
        brushSizePx =
          scene === 'erase'
            ? clampImageBrushSize(payload?.brushSizePx, 40)
            : clampImageBrushSize(viewport.annotate?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX);
      ((this.active = true),
        (this.nodeId = nodeId),
        (this._generationModelCatalog = buildGenerationModelCatalog()));
      const node = this._normalizeLegacySeedreamNode(enabled3);
      ((this.nodeData = node),
        (this._commands = payload?.commands || []),
        (this._redoStack = []),
        (this._draft = null),
        (this._selectedTextCommandIndex = null),
        (this._dirty = false),
        (this._useWhiteboardBase = false),
        (this._fillRegionCache = new Map()));
      const imageAnnotateText2 = imageAnnotateText('actions.save'),
        imageAnnotateText3 = imageAnnotateText('actions.generate'),
        t2 = t('imageAnnotate.actions.generate', {}, { locale: 'zh-CN' }),
        handle = String(record.submitLabel || imageAnnotateText2).trim(),
        submitLabel = handle || imageAnnotateText2,
        state = submitLabel === imageAnnotateText3 || submitLabel === t2;
      this._mode = {
        scene: scene,
        submitLabel: submitLabel,
        submitBusyLabel:
          String(record.submitBusyLabel || '').trim() ||
          (state ? imageAnnotateText('actions.generating') : imageAnnotateText('actions.saving')),
        submitNoop: Boolean(record.submitNoop),
      };
      const config = this._getGenerationModelCatalog(),
        defaultGenerationModelState = getDefaultGenerationModelState(config);
      this.imageSize = '1K';
      const scope = String(node?.model || '').trim(),
        input = String(node?.provider || '').trim(),
        providerKeyByModel = findProviderKeyByModel(config, scope);
      (providerKeyByModel
        ? ((this.model = scope), (this.provider = providerKeyByModel))
        : ((this.model = defaultGenerationModelState.model || scope || null),
          (this.provider =
            defaultGenerationModelState.provider || input || getModelProvider(this.model) || null)),
        (this.promptText = scene === 'repaint' ? String(record.promptText || '').trim() : ''),
        (this._view = {
          tool: tool,
          color: color,
          brushSizePx: brushSizePx,
          viewport: viewport.viewport,
          node: node,
        }),
        appStore.setAnnotateState({
          active: true,
          nodeId: nodeId,
          tool: tool,
          color: color,
          brushSizePx: brushSizePx,
        }),
        this._createUI(enabled4, { tool: tool, color: color, brushSizePx: brushSizePx }),
        this._bindEvents(),
        (this._unsubscribe = appStore.subscribeSelector(
          (output) => {
            const nx = output.nodes?.[nodeId],
              vx = output.viewport || { x: 0, y: 0, zoom: 1 },
              tool2 = output.annotate || {};
            return {
              hasNode: !!nx,
              nx: nx ? nx.x : 0,
              ny: nx ? nx.y : 0,
              nw: nx ? nx.width : 0,
              nh: nx ? nx.height : 0,
              vx: vx.x,
              vy: vx.y,
              vz: vx.zoom || 1,
              tool: tool2.tool || 'brush',
              color: normalizeColorName(tool2.color),
              brushSizePx: clampImageBrushSize(tool2.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX),
            };
          },
          (tool3) => {
            if (!tool3?.hasNode) return;
            const value2 = appStore.getStateRaw().nodes?.[nodeId],
              box2 = this._normalizeLegacySeedreamNode(value2);
            ((this.nodeData = box2 || null),
              (this._view = {
                tool: tool3.tool,
                color: tool3.color,
                brushSizePx: tool3.brushSizePx,
                viewport: { x: tool3.vx, y: tool3.vy, zoom: tool3.vz },
                node: {
                  x: Number(box2?.x ?? tool3.nx),
                  y: Number(box2?.y ?? tool3.ny),
                  width: Number(box2?.width ?? tool3.nw),
                  height: Number(box2?.height ?? tool3.nh),
                },
              }),
              this._updateView(this._view));
          },
        )),
        this._waitForImageAndShow());
    },
    _waitForImageAndShow() {
      const run = () => {
        if (this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0) {
          if (this._view) this._updateView(this._view);
          requestAnimationFrame(() => {
            if (this.overlayEl) this.overlayEl.classList.add('visible');
          });
        } else requestAnimationFrame(run);
      };
      run();
    },
    _getGenerationModelCatalog() {
      return (
        !this._generationModelCatalog && (this._generationModelCatalog = buildGenerationModelCatalog()),
        this._generationModelCatalog
      );
    },
    _normalizeLegacySeedreamNode(value3) {
      const args = buildSeedreamMigrationPatch(value3);
      if (!args) return value3;
      const value4 = { ...(value3 || {}), ...args },
        value5 = appStore.getStateRaw().nodes?.[this.nodeId];
      return (value5 && appStore.updateNodeData(this.nodeId, args), value4);
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
    _getFlipState(value6 = this._commands) {
      const enabled5 = { horizontal: false, vertical: false };
      return (
        (Array.isArray(value6) ? value6 : []).forEach((item2) => {
          if (item2?.type === 'flip-horizontal') enabled5.horizontal = !enabled5.horizontal;
          else item2?.type === 'flip-vertical' && (enabled5.vertical = !enabled5.vertical);
        }),
        enabled5
      );
    },
    _getCurrentFlipState() {
      if (!this._isAnnotateScene()) return { horizontal: false, vertical: false };
      return this._getFlipState(this._commands);
    },
    _applyFlipToLocalPoint(box3, box4, value7 = this._getCurrentFlipState()) {
      const box5 = { x: Number(box3?.x) || 0, y: Number(box3?.y) || 0 },
        value8 = Math.max(1, Number(box4?.width) || 1),
        value9 = Math.max(1, Number(box4?.height) || 1);
      if (value7?.horizontal) box5.x = value8 - box5.x;
      if (value7?.vertical) box5.y = value9 - box5.y;
      return box5;
    },
    _getLocalFromClient(value10, value11, value12, box6) {
      const x2 = screenToWorld(value10, value11, value12.viewport),
        value13 = { x: x2.x - box6.x, y: x2.y - box6.y };
      if (!this._isAnnotateScene()) return value13;
      return this._applyFlipToLocalPoint(value13, box6, this._getCurrentFlipState());
    },
    _applyStageFlip(value14 = this._getCurrentFlipState()) {
      if (!this.stageEl) return;
      if (!this._isAnnotateScene()) {
        this.stageEl.style.transform = 'none';
        return;
      }
      const value15 = value14?.horizontal ? -1 : 1,
        value16 = value14?.vertical ? -1 : 1;
      ((this.stageEl.style.transformOrigin = '50% 50%'),
        (this.stageEl.style.transform = 'scale(' + value15 + ', ' + value16 + ')'));
    },
    _applyFlipTransformToContext(box7, value17, value18, value19 = this._getCurrentFlipState()) {
      if (!box7) return;
      (value19?.horizontal && (box7.translate(value17, 0), box7.scale(-1, 1)),
        value19?.vertical && (box7.translate(0, value18), box7.scale(1, -1)));
    },
    _closeGenerationMenus() {
      if (!this.generationToolbarEl) return;
      (this.generationToolbarEl.querySelectorAll('[data-toolbar-up-menu-menu]').forEach((el) => {
        const value20 = String(el?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
        (el.classList.remove(value20), el.classList.remove('open'), el.classList.remove('show'));
      }),
        this.generationToolbarEl.querySelector('.model-menu')?.classList.remove('show'),
        this.generationToolbarEl.querySelector('.image-function-mode-menu')?.classList.remove('show'),
        closeImageFunctionModelSubmenus(this.generationToolbarEl.querySelector('.model-menu')));
    },
    _createUI(value21, value22 = {}) {
      const el2 = document.createElement('div');
      el2.className = 'v2-annotate-overlay';
      const el3 = document.createElement('div');
      el3.className = 'v2-annotate-container';
      const el4 = document.createElement('div');
      el4.className = 'v2-annotate-stage';
      const value23 = document.createElement('img');
      ((value23.className = 'v2-annotate-img'), (value23.src = value21), (value23.draggable = false));
      const value24 = document.createElement('canvas');
      ((value24.className = 'v2-annotate-canvas'),
        el4.appendChild(value23),
        el4.appendChild(value24),
        el3.appendChild(el4));
      const el5 = document.createElement('div');
      ((el5.className = 'v2-annotate-cursor'),
        (el5.style.display = 'none'),
        el2.appendChild(el5),
        el2.appendChild(el3),
        document.body.appendChild(el2),
        (this.overlayEl = el2),
        (this.containerEl = el3),
        (this.stageEl = el4),
        (this.imgEl = value23),
        (this.canvasEl = value24),
        (this.cursorEl = el5),
        this._applyBaseSurface());
      const el6 = document.createElement('div');
      ((el6.className = 'v2-annotate-toolbar'),
        setStaticInnerHTML(el6, ANNOTATE_TOOLBAR_TEMPLATE_ID),
        applyI18n(el6),
        document.body.appendChild(el6),
        (this.toolbarEl = el6));
      if (this._isGenerationScene()) {
        const el7 = document.createElement('div');
        ((el7.className = 'v2-annotate-toolbar v2-annotate-generation-toolbar'),
          (el7.innerHTML = createGenerationToolbarMarkup({
            scene: this._mode?.scene || 'annotate',
            promptText: this.promptText,
            imageSize: this.imageSize,
            model: this.model,
            provider: this.provider,
            modelCatalog: this._getGenerationModelCatalog(),
            submitTooltip: this._mode?.submitLabel || imageAnnotateText('actions.generate'),
          })),
          applyI18n(el7),
          document.body.appendChild(el7),
          (this.generationToolbarEl = el7));
      }
      ((this.sizeValueEl = el6.querySelector('.v2-annotate-size-value')),
        (this.sizeRangeEl = el6.querySelector('.v2-annotate-size-range')),
        (this.colorWrapEl = el6.querySelector('.v2-annotate-colorwrap')),
        (this.colorDotEl = el6.querySelector('.v2-annotate-color-dot')),
        (this.colorMenuEl = el6.querySelector('.v2-annotate-color-menu')),
        (this.colorButtons = Array.from(el6.querySelectorAll('.v2-annotate-swatch'))));
      const list = getAnnotateToolbarToolsForScene(this._mode?.scene || 'annotate');
      (el6.querySelectorAll('.tool-btn').forEach((el8) => {
        if (!list.includes(el8.dataset.tool)) el8.remove();
      }),
        (this.toolButtons = Array.from(el6.querySelectorAll('.tool-btn'))));
      this._isGenerationScene() &&
        (this.colorWrapEl?.remove(),
        (this.colorWrapEl = null),
        (this.colorDotEl = null),
        (this.colorMenuEl = null),
        (this.colorButtons = []));
      !this._isAnnotateScene() &&
        (el6.querySelector('.act-flip-horizontal')?.remove(),
        el6.querySelector('.act-flip-vertical')?.remove());
      const el9 = el6.querySelector('.act-save'),
        el10 = el6.querySelector('.act-new-board'),
        el11 = el9?.querySelector('span'),
        value25 = this._mode?.submitLabel || '保存';
      if (el11) el11.textContent = value25;
      if (el9) el9.setAttribute('data-tooltip', value25);
      el9 && this._isGenerationScene() && (el9.style.display = 'none');
      el10 && this._isGenerationScene() && (el10.style.display = 'none');
      const clampImageBrushSize2 = clampImageBrushSize(value22.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX),
        value26 = value22.tool || 'brush',
        value27 = list.includes(value26) ? value26 : 'brush',
        colorName = normalizeColorName(value22.color);
      ((this.sizeRangeEl.value = String(clampImageBrushSize2)),
        (this.sizeValueEl.textContent = String(clampImageBrushSize2)),
        this._updateToolActive(value27, clampImageBrushSize2),
        this._syncPaletteActive(colorName));
      if (this._view) this._updateView(this._view);
    },
    _bindEvents() {
      const value28 = (event) => {
        const value29 =
          this.canvasEl && (event.target === this.canvasEl || this.canvasEl.contains(event.target));
        if (value29) {
          this._onCanvasWheel(event);
          return;
        }
        (event.preventDefault(), event.stopPropagation());
      };
      this.overlayEl.addEventListener('wheel', value28, { passive: false });
      const value30 = () => {
        if (this._view) this._updateView(this._view);
      };
      window.addEventListener('resize', value30);
      const value31 = (event2) => {
        if (!this.active) return;
        const value32 = event2.target,
          value33 = value32?.tagName?.toLowerCase?.() || '',
          value34 = value33 === 'input' || value33 === 'textarea' || value32?.isContentEditable === true;
        if (value34) return;
        if (event2.altKey || event2.ctrlKey || event2.metaKey) return;
        const value35 = String(event2.key || '').toLowerCase();
        if (value35 === 't' && !this._isGenerationScene()) {
          (event2.preventDefault(), this._setTool('text'));
          return;
        }
        const enabled6 = event2.key === 'Delete' || event2.key === 'Backspace';
        if (!enabled6) return;
        const count = Number(this._selectedTextCommandIndex);
        if (!Number.isInteger(count) || count < 0 || count >= this._commands.length) return;
        if (this._commands[count]?.type !== 'text') return;
        (event2.preventDefault(), this._deleteTextCommand(count));
      };
      window.addEventListener('keydown', value31);
      const run2 = () => {
          (window.removeEventListener('resize', value30),
            window.removeEventListener('keydown', value31),
            this.overlayEl?.removeEventListener('wheel', value28),
            document.removeEventListener('pointerdown', value36, true));
        },
        handler = this.exit.bind(this);
      ((this.exit = (options2 = {}) => {
        (run2(), handler(options2));
      }),
        this.toolbarEl.addEventListener('pointerdown', (event3) => event3.stopPropagation()),
        this.toolbarEl.querySelector('.act-cancel').addEventListener('click', (event4) => {
          (event4.stopPropagation(), this.exit());
        }),
        this.toolButtons.forEach((el12) => {
          el12.addEventListener('click', (event5) => {
            event5.stopPropagation();
            const value37 = el12.dataset.tool;
            this._setTool(value37);
          });
        }));
      const run3 = () => {
          if (!this.colorWrapEl) return;
          this.colorWrapEl.classList.remove('open');
        },
        value36 = (event6) => {
          (this.colorWrapEl &&
            this.colorWrapEl.classList.contains('open') &&
            !this.colorWrapEl.contains(event6.target) &&
            run3(),
            this.generationToolbarEl &&
              !this.generationToolbarEl.contains(event6.target) &&
              this._closeGenerationMenus());
        };
      (document.addEventListener('pointerdown', value36, true),
        this.colorWrapEl?.addEventListener('pointerdown', (event7) => event7.stopPropagation()),
        this.colorWrapEl?.querySelector('.v2-annotate-color-toggle')?.addEventListener('click', (event8) => {
          event8.stopPropagation();
          if (!this.colorWrapEl) return;
          this.colorWrapEl.classList.toggle('open');
        }),
        this.colorButtons.forEach((el13) => {
          el13.addEventListener('click', (event9) => {
            event9.stopPropagation();
            const color2 = el13.dataset.color;
            (appStore.setAnnotateState({ color: color2 }), run3());
          });
        }),
        this.sizeRangeEl.addEventListener('input', (event10) => {
          const brushSizePx2 = clampImageBrushSize(event10.target.value, 1);
          (appStore.setAnnotateState({ brushSizePx: brushSizePx2 }),
            (this.sizeValueEl.textContent = String(brushSizePx2)),
            this._syncCursor(),
            this._persistEraseSelectionState());
        }),
        this.toolbarEl.querySelector('.act-undo').addEventListener('click', (event11) => {
          (event11.stopPropagation(), this._undo());
        }),
        this.toolbarEl.querySelector('.act-flip-horizontal')?.addEventListener('click', (event12) => {
          (event12.stopPropagation(), this._flipHorizontal());
        }),
        this.toolbarEl.querySelector('.act-flip-vertical')?.addEventListener('click', (event13) => {
          (event13.stopPropagation(), this._flipVertical());
        }),
        this.toolbarEl.querySelector('.act-redo').addEventListener('click', (event14) => {
          (event14.stopPropagation(), this._redo());
        }),
        this.toolbarEl.querySelector('.act-clear').addEventListener('click', (event15) => {
          (event15.stopPropagation(), this._clear());
        }),
        this.toolbarEl.querySelector('.act-new-board')?.addEventListener('click', (event16) => {
          (event16.stopPropagation(), this._createNewWhiteboard());
        }),
        this.toolbarEl.querySelector('.act-save').addEventListener('click', async (event17) => {
          event17.stopPropagation();
          if (this._mode?.submitNoop) return;
          await this._save();
        }));
      if (this.generationToolbarEl) {
        this.generationToolbarEl.addEventListener('pointerdown', (event18) => event18.stopPropagation());
        const el14 = this.generationToolbarEl.querySelector('.v2-annotate-gen-prompt-input'),
          el15 = this.generationToolbarEl.querySelector('.size-menu'),
          modelMenu = this.generationToolbarEl.querySelector('.model-menu'),
          el16 = this.generationToolbarEl.querySelector('.model-text'),
          el17 = this.generationToolbarEl.querySelector('.image-function-model-trigger-icon-slot'),
          el18 = this.generationToolbarEl.querySelector('.size-toggle'),
          el19 = this.generationToolbarEl.querySelector('.image-function-mode-toggle'),
          modeMenu = this.generationToolbarEl.querySelector('.image-function-mode-menu'),
          handler2 = () => {
            const shouldDisableImageSizeControl2 = shouldDisableImageSizeControl(this.model, this.provider);
            (el18 &&
              ((el18.disabled = shouldDisableImageSizeControl2),
              el18.classList.toggle('is-disabled', shouldDisableImageSizeControl2),
              el18.setAttribute('aria-disabled', shouldDisableImageSizeControl2 ? 'true' : 'false')),
              el15?.querySelectorAll('[data-toolbar-up-menu-field="size"]').forEach((el20) => {
                (el20.classList.toggle('disabled', shouldDisableImageSizeControl2),
                  (el20.dataset.disabled = shouldDisableImageSizeControl2 ? 'true' : 'false'));
              }),
              shouldDisableImageSizeControl2 && el15?.classList.remove('open'));
          },
          handler3 = () =>
            syncImageFunctionModeControl({
              root: this.generationToolbarEl,
              model: this.model,
              provider: this.provider,
              imageSize: this.imageSize,
            }),
          handler4 = (value38, value39, { syncStore: syncStore = true } = {}) => {
            const model = String(value38 || '').trim(),
              provider = String(value39 || getModelProvider(model) || '').trim();
            if (!model || !provider) return;
            const value40 = this.model !== model || this.provider !== provider;
            ((this.model = model),
              (this.provider = provider),
              el16 &&
                (el16.textContent = getImageFunctionModelDisplayName(
                  model,
                  this._getGenerationModelCatalog(),
                )),
              el17 && (el17.innerHTML = getImageFunctionModelTriggerIconHTML(model, provider)),
              syncImageFunctionModelMenuActive({
                modelMenu: modelMenu,
                model: model,
                provider: provider,
              }),
              handler3(),
              handler2(),
              syncStore &&
                value40 &&
                this.nodeId &&
                appStore.updateNodeData(this.nodeId, { model: model, provider: provider }));
          },
          handler5 = (value41 = null) => {
            this.generationToolbarEl?.querySelectorAll('[data-toolbar-up-menu-menu]').forEach((el21) => {
              if (el21 === value41) return;
              const value42 = String(el21?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
              (el21.classList.remove(value42), el21.classList.remove('open'), el21.classList.remove('show'));
            });
          },
          value43 = () => {
            (handler5(),
              modelMenu?.classList.remove('show'),
              modeMenu?.classList.remove('show'),
              closeImageFunctionModelSubmenus(modelMenu));
          };
        (el14?.addEventListener('input', (event19) => {
          this.promptText = String(event19.target.value || '');
        }),
          (this._unbindGenerationToolbarUpMenus = bindToolbarUpMenus(this.generationToolbarEl, {
            onBeforeOpen: () => {
              (modelMenu?.classList.remove('show'),
                modeMenu?.classList.remove('show'),
                closeImageFunctionModelSubmenus(modelMenu));
            },
            onSelect: ({ fieldId: fieldId, value: value44 }) => {
              if (fieldId !== 'size') return;
              if (shouldDisableImageSizeControl(this.model, this.provider)) return;
              this.imageSize = String(value44 || '1K').trim() || '1K';
              const mode = getImageFunctionNanoSelection(this.model, this.provider, this.imageSize);
              if (mode) {
                const imageFunctionModelByMode = resolveImageFunctionModelByMode({
                  model: this.model,
                  provider: this.provider,
                  imageSize: this.imageSize,
                  mode: mode.mode,
                });
                imageFunctionModelByMode?.model &&
                  handler4(imageFunctionModelByMode.model, imageFunctionModelByMode.provider);
              }
              (handler3(), handler2());
            },
          })),
          this.generationToolbarEl.querySelector('.model-toggle')?.addEventListener('click', (event20) => {
            (event20.stopPropagation(),
              modelMenu?.classList.toggle('show'),
              handler5(),
              modeMenu?.classList.remove('show'));
          }));
        const bindImageFunctionModelMenu2 = bindImageFunctionModelMenu({
            modelMenu: modelMenu,
            onSelect: ({ model: model2, provider: provider2 }) => {
              handler4(model2, provider2);
            },
            closeMenu: () => {
              modelMenu?.classList.remove('show');
            },
          }),
          bindImageFunctionModeMenu2 = bindImageFunctionModeMenu({
            modeMenu: modeMenu,
            onSelect: ({ mode: mode2 }) => {
              const imageFunctionModelByMode2 = resolveImageFunctionModelByMode({
                model: this.model,
                provider: this.provider,
                imageSize: this.imageSize,
                mode: mode2,
              });
              if (!imageFunctionModelByMode2?.model) return;
              (handler4(imageFunctionModelByMode2.model, imageFunctionModelByMode2.provider),
                modeMenu?.classList.remove('show'));
            },
          });
        ((this._unbindGenerationFunctionMenus = () => {
          (bindImageFunctionModelMenu2?.(), bindImageFunctionModeMenu2?.());
        }),
          el19?.addEventListener('click', (event21) => {
            event21.stopPropagation();
            if (el19.closest('.image-function-mode-wrap')?.classList.contains('is-hidden')) return;
            (modeMenu?.classList.toggle('show'),
              handler5(modeMenu),
              modelMenu?.classList.remove('show'),
              closeImageFunctionModelSubmenus(modelMenu));
          }),
          handler3(),
          handler2(),
          this.generationToolbarEl.querySelector('.go')?.addEventListener('click', async (event22) => {
            (event22.stopPropagation(), await this._save());
          }),
          this.generationToolbarEl
            .querySelector('.debug-wrench-btn')
            ?.addEventListener('click', async (event23) => {
              (event23.stopPropagation(), await this._handleDebugRequest());
            }));
      }
      const value45 = this.canvasEl.getContext('2d');
      ((value45.lineCap = 'round'),
        (value45.lineJoin = 'round'),
        (this._checkerPattern = createEraseCheckerboardPattern(value45, 1)));
      const event24 = {
          down: false,
          pointerId: null,
          previousTool: null,
          temporaryTool: null,
          textTransform: null,
        },
        handler6 = (x3, y2) => {
          this._cursorLast = { x: x3, y: y2 };
          if (this._cursorRaf) return;
          this._cursorRaf = requestAnimationFrame(() => {
            ((this._cursorRaf = 0), this._syncCursor());
          });
        },
        handler7 = (value46, value47, value48, count2 = 0) => {
          const value49 = appStore.getStateRaw(),
            box8 = value49.nodes?.[this.nodeId];
          if (!box8) return false;
          const box9 = screenToWorld(value46, value47, value49.viewport);
          if (!isPointInRect(box9.x, box9.y, box8.x, box8.y, box8.width, box8.height)) return false;
          const x1 = this._getLocalFromClient(value46, value47, value49, box8),
            value50 = value49.annotate?.tool || 'brush',
            value51 = count2 === 1 || count2 === 2,
            value52 = value51 ? 'eraser' : value50;
          if (value52 !== 'text') this._selectedTextCommandIndex = null;
          const clampImageBrushSize3 = clampImageBrushSize(
              value49.annotate?.brushSizePx,
              IMAGE_BRUSH_DEFAULT_SIZE_PX,
            ),
            sizeWorld = clampImageBrushSize3 / (value49.viewport.zoom || 1);
          value51
            ? ((event24.previousTool = value50),
              (event24.temporaryTool = 'eraser'),
              (this._temporaryTool = 'eraser'),
              this._syncCursor('eraser', clampImageBrushSize3))
            : ((event24.previousTool = null), (event24.temporaryTool = null), (this._temporaryTool = null));
          if (value52 === 'bucket' && !this._isEraseScene()) return (this._fillArea(x1, sizeWorld), true);
          if (value52 === 'number-label' && this._isAnnotateScene())
            return (this._addNumberLabel(x1, sizeWorld), true);
          if (value52 === 'text') {
            const value53 = this._findTextHit(x1, value49.viewport);
            if (value53) {
              (this._removeTextInput(true), (this._selectedTextCommandIndex = value53.index));
              if (value53.mode === 'delete') return (this._deleteTextCommand(value53.index), true);
              if (value53.mode === 'copy')
                return (this._copyTextCommand(value53.index, value49.viewport), true);
              return (
                (event24.down = true),
                (event24.pointerId = value48),
                (event24.textTransform = this._createTextTransformState(value53, x1, value49.viewport)),
                this.canvasEl.setPointerCapture(value48),
                this._render(),
                true
              );
            }
            return (
              (this._selectedTextCommandIndex = null),
              this._openTextInput(x1, value49, sizeWorld, value46, value47),
              true
            );
          }
          if (value52 === 'rect')
            this._draft = {
              type: 'rect',
              color: getColorCanvas(value49.annotate?.color || 'red'),
              sizeWorld: sizeWorld,
              x1: x1.x,
              y1: x1.y,
              x2: x1.x,
              y2: x1.y,
            };
          else
            value52 === 'eraser'
              ? (this._draft = { type: 'eraser', sizeWorld: sizeWorld, points: [x1] })
              : (this._draft = {
                  type: 'brush',
                  color: getColorCanvas(value49.annotate?.color || 'red'),
                  sizeWorld: sizeWorld,
                  points: [x1],
                });
          return (
            (event24.down = true),
            (event24.pointerId = value48),
            this.canvasEl.setPointerCapture(value48),
            this._render(),
            true
          );
        },
        handler8 = (value54, value55) => {
          const value56 = appStore.getStateRaw(),
            enabled7 = value56.nodes?.[this.nodeId];
          if (!enabled7) return;
          const box10 = this._getLocalFromClient(value54, value55, value56, enabled7);
          if (event24.down && event24.textTransform) {
            const x4 = event24.textTransform,
              box11 = this._commands[x4.index];
            if (box11?.type === 'text') {
              const value57 = value56.viewport?.zoom || 1,
                box12 = {
                  x: Number(box10.x || 0) * value57,
                  y: Number(box10.y || 0) * value57,
                };
              if (x4.mode === 'move')
                ((box11.x = box10.x - x4.offsetWorldX), (box11.y = box10.y - x4.offsetWorldY));
              else {
                if (x4.mode === 'scale-x' || x4.mode === 'scale-y') {
                  const value58 = this._resolveAxisTextScale(x4, box12);
                  ((box11.scale = undefined),
                    (box11.scaleX = value58.scaleX),
                    (box11.scaleY = value58.scaleY),
                    (box11.x = value58.originPx.x / value57),
                    (box11.y = value58.originPx.y / value57));
                } else {
                  if (x4.mode === 'scale-uniform') {
                    const box13 = this._toTextLocalTransformSpace(box12, x4.originPx, x4.rotation),
                      value59 = box13.x / x4.baseWidthPx,
                      value60 = box13.y / x4.baseHeightPx,
                      count3 = Math.max(value59, value60),
                      value61 = Number.isFinite(count3) && count3 > 0 ? count3 : 1;
                    ((box11.scale = undefined),
                      (box11.scaleX = clampTextScale(x4.baseScaleX * value61)),
                      (box11.scaleY = clampTextScale(x4.baseScaleY * value61)),
                      (box11.x = x4.originPx.x / value57),
                      (box11.y = x4.originPx.y / value57));
                  } else {
                    if (x4.mode === 'rotate') {
                      const value62 = Math.atan2(box12.y - x4.centerPx.y, box12.x - x4.centerPx.x),
                        value63 = x4.baseRotation + (value62 - x4.baseAngle);
                      box11.rotation = value63;
                      const { scaleX: scaleX, scaleY: scaleY } = getTextScalePair(box11),
                        box14 = {
                          x: (x4.layoutWidth * scaleX) / 2,
                          y: (x4.layoutHeight * scaleY) / 2,
                        },
                        value64 = Math.cos(value63),
                        value65 = Math.sin(value63),
                        value66 = box14.x * value64 - box14.y * value65,
                        value67 = box14.x * value65 + box14.y * value64,
                        box15 = {
                          x: x4.centerPx.x - value66,
                          y: x4.centerPx.y - value67,
                        };
                      ((box11.x = box15.x / value57), (box11.y = box15.y / value57));
                    }
                  }
                }
              }
              ((this._selectedTextCommandIndex = x4.index), this._render());
            }
            return;
          }
          if (!event24.down || !this._draft) return;
          (this._draft.type === 'rect'
            ? ((this._draft.x2 = box10.x), (this._draft.y2 = box10.y))
            : this._draft.points.push(box10),
            this._render());
        },
        handler9 = () => {
          if (event24.down && event24.textTransform) {
            ((event24.down = false),
              (event24.pointerId = null),
              (event24.textTransform = null),
              (event24.previousTool = null),
              (event24.temporaryTool = null),
              (this._temporaryTool = null),
              (this._redoStack = []),
              (this._dirty = true),
              this._persistEraseSelectionState(),
              this._render());
            return;
          }
          if (!event24.down || !this._draft) return;
          const value68 = this._draft;
          ((this._draft = null), (event24.down = false), (event24.pointerId = null));
          const value69 = event24.previousTool;
          ((event24.previousTool = null),
            (event24.temporaryTool = null),
            (event24.textTransform = null),
            (this._temporaryTool = null));
          if (shouldDiscardStrokeCommand(value68)) {
            value69 ? this._syncCursor(value69, this._view?.brushSizePx) : this._syncCursor();
            this._render();
            return;
          }
          if (value68.type === 'rect') {
            const count4 = Math.abs(value68.x2 - value68.x1),
              count5 = Math.abs(value68.y2 - value68.y1);
            if (count4 < 0.5 && count5 < 0.5) {
              value69 ? this._syncCursor(value69, this._view?.brushSizePx) : this._syncCursor();
              this._render();
              return;
            }
          }
          (this._commands.push(value68),
            (this._redoStack = []),
            (this._dirty = true),
            this._persistEraseSelectionState(),
            value69 && this._syncCursor(value69, this._view?.brushSizePx),
            this._render());
        };
      (this.canvasEl.addEventListener('pointerdown', (event25) => {
        (event25.preventDefault(),
          event25.stopPropagation(),
          handler6(event25.clientX, event25.clientY),
          handler7(event25.clientX, event25.clientY, event25.pointerId, event25.button));
      }),
        this.canvasEl.addEventListener('contextmenu', (event26) => {
          (event26.preventDefault(), event26.stopPropagation());
        }),
        this.canvasEl.addEventListener('pointermove', (event27) => {
          (event27.preventDefault(),
            event27.stopPropagation(),
            handler6(event27.clientX, event27.clientY),
            handler8(event27.clientX, event27.clientY));
        }),
        this.canvasEl.addEventListener('pointerup', (event28) => {
          (event28.preventDefault(),
            event28.stopPropagation(),
            handler6(event28.clientX, event28.clientY),
            handler9());
        }),
        this.canvasEl.addEventListener('pointercancel', (event29) => {
          (event29.preventDefault(),
            event29.stopPropagation(),
            handler6(event29.clientX, event29.clientY),
            handler9());
        }),
        this.canvasEl.addEventListener('pointerenter', (event30) => {
          ((this._cursorHover = true), handler6(event30.clientX, event30.clientY));
        }),
        this.canvasEl.addEventListener('pointerleave', () => {
          ((this._cursorHover = false), this._syncCursor());
        }));
    },
    _syncPaletteActive() {
      if (!this.colorButtons) return;
      const colorName2 = normalizeColorName(this._view?.color) || 'red',
        colorCss = getColorCss(colorName2);
      (this.colorDotEl &&
        ((this.colorDotEl.style.background = colorCss),
        (this.colorDotEl.style.borderColor =
          colorName2 === 'black'
            ? 'var(--white-35)'
            : colorName2 === 'white'
              ? 'var(--white-25)'
              : 'var(--black-20)')),
        this.colorButtons.forEach((el22) => {
          if (el22.dataset.color === colorName2) el22.classList.add('active');
          else el22.classList.remove('active');
        }));
    },
    _onCanvasWheel(event31) {
      (event31.preventDefault(), event31.stopPropagation());
      if (!this.active) return;
      if (!this._cursorHover) return;
      const value70 = this._view?.tool || 'brush';
      if (
        value70 !== 'brush' &&
        value70 !== 'eraser' &&
        value70 !== 'bucket' &&
        value70 !== 'number-label' &&
        value70 !== 'text'
      )
        return;
      const count6 = event31.deltaY || 0,
        value71 = count6 < 0 ? 1 : -1,
        clampImageBrushSize4 = clampImageBrushSize(this._view?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX),
        brushSizePx3 = clampImageBrushSize(clampImageBrushSize4 + value71 * 2, IMAGE_BRUSH_DEFAULT_SIZE_PX);
      if (brushSizePx3 === clampImageBrushSize4) return;
      appStore.setAnnotateState({ brushSizePx: brushSizePx3 });
      if (this.sizeRangeEl) this.sizeRangeEl.value = String(brushSizePx3);
      if (this.sizeValueEl) this.sizeValueEl.textContent = String(brushSizePx3);
      this._syncCursor();
    },
    _syncCursor(
      tool4 = this._temporaryTool || this._view?.tool || 'brush',
      sizePx = this._view?.brushSizePx || IMAGE_BRUSH_DEFAULT_SIZE_PX,
    ) {
      if (!this.cursorEl) return;
      if (tool4 === 'text') {
        ((this.cursorEl.style.display = 'none'),
          this.cursorEl.classList.remove('is-erase-brush'),
          this._syncTextToolCursor());
        return;
      }
      syncCircularBrushCursor({
        cursorEl: this.cursorEl,
        canvasEl: this.canvasEl,
        visible: this._cursorHover,
        tool: tool4,
        allowedTools: ['brush', 'eraser', 'bucket', 'number-label'],
        sizePx: sizePx,
        cursorLast: this._cursorLast,
        isEraseBrush: this._isGenerationScene() || tool4 === 'eraser',
      });
    },
    _getTextScaleCursor(value72) {
      const value73 =
        document.querySelector('#v2-wrap .group-resizer.v2-resize-move') ||
        document.querySelector('#v2-wrap .v2-resize-move');
      if (value73) {
        const computedStyle = getComputedStyle(value73).cursor;
        if (computedStyle && computedStyle !== 'auto') return computedStyle;
      }
      return 'move';
    },
    _getCanvasPointerCursor() {
      return getCssVar('--pointer-cursor') || 'default';
    },
    _syncTextToolCursor() {
      if (!this.canvasEl) return;
      const value74 = this._getCanvasPointerCursor();
      if (!this._cursorHover) {
        this.canvasEl.style.cursor = value74;
        return;
      }
      const value75 = appStore.getStateRaw(),
        enabled8 = value75.nodes?.[this.nodeId];
      if (!enabled8) {
        this.canvasEl.style.cursor = value74;
        return;
      }
      const value76 = this._getLocalFromClient(this._cursorLast.x, this._cursorLast.y, value75, enabled8),
        enabled9 = this._findTextHit(value76, value75.viewport);
      if (!enabled9) {
        this.canvasEl.style.cursor = value74;
        return;
      }
      if (enabled9.mode === 'delete' || enabled9.mode === 'copy') {
        this.canvasEl.style.cursor = 'var(--link-cursor)';
        return;
      }
      if (enabled9.mode === 'rotate') {
        this.canvasEl.style.cursor = ROTATE_CURSOR_CSS + ', ' + value74;
        return;
      }
      if (enabled9.mode === 'scale-uniform') {
        this.canvasEl.style.cursor = this._getTextScaleCursor(enabled9);
        return;
      }
      if (enabled9.mode === 'scale-x') {
        this.canvasEl.style.cursor = 'var(--resize-ew-cursor)';
        return;
      }
      if (enabled9.mode === 'scale-y') {
        this.canvasEl.style.cursor = 'var(--resize-ns-cursor)';
        return;
      }
      this.canvasEl.style.cursor = value74;
    },
    _updateToolActive(
      value77 = this._view?.tool || 'brush',
      value78 = this._view?.brushSizePx || IMAGE_BRUSH_DEFAULT_SIZE_PX,
    ) {
      (this.toolButtons.forEach((el23) => {
        if (el23.dataset.tool === value77) el23.classList.add('active');
        else el23.classList.remove('active');
      }),
        this._syncCursor(value77, value78));
    },
    _setTool(value79) {
      if (value79 !== 'text') this._removeTextInput(true);
      if (value79 !== 'text') this._selectedTextCommandIndex = null;
      const list2 = getAnnotateToolbarToolsForScene(this._mode?.scene || 'annotate'),
        tool5 = list2.includes(value79) ? value79 : 'brush';
      (appStore.setAnnotateState({ tool: tool5 }), this._persistEraseSelectionState());
    },
    _removeTextInput(enabled10 = true, value80 = null) {
      const el24 = value80 || this._textInputEl;
      if (!el24) return;
      const enabled11 = this._textInputEl === el24,
        text = String(el24.value || '').trim(),
        x5 = Number(el24.dataset.localX),
        y3 = Number(el24.dataset.localY),
        sizeWorld2 = Number(el24.dataset.sizeWorld),
        color3 = String(el24.dataset.color || '');
      el24.parentElement && el24.parentElement.removeChild(el24);
      enabled11 && (this._textInputEl = null);
      if (!enabled11) return;
      if (!enabled10 || !text || !Number.isFinite(x5) || !Number.isFinite(y3) || !Number.isFinite(sizeWorld2))
        return;
      (this._commands.push({
        type: 'text',
        text: text.slice(0, 200),
        color: color3 || getColorCanvas('red'),
        sizeWorld: sizeWorld2,
        x: x5,
        y: y3,
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
    _openTextInput(box16, value81, value82, value83, value84) {
      this._removeTextInput(true);
      const el25 = document.createElement('input');
      ((el25.type = 'text'),
        (el25.maxLength = 200),
        (el25.className = 'v2-annotate-text-input'),
        (el25.dataset.localX = String(box16.x)),
        (el25.dataset.localY = String(box16.y)),
        (el25.dataset.sizeWorld = String(value82)),
        (el25.dataset.color = getColorCanvas(value81.annotate?.color || 'red')),
        (el25.style.left = value83 + 'px'),
        (el25.style.top = value84 + 'px'),
        el25.style.setProperty(
          '--annotate-text-input-size',
          clampImageBrushSize(value81.annotate?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX) + 'px',
        ),
        el25.style.setProperty('--annotate-text-input-color', el25.dataset.color || getColorCanvas('red')));
      let value85 = false;
      const run4 = (value86) => {
        if (value85) return;
        ((value85 = true), this._removeTextInput(value86, el25));
      };
      (el25.addEventListener('pointerdown', (event32) => event32.stopPropagation()),
        el25.addEventListener('keydown', (event33) => {
          if (event33.key === 'Enter' && !event33.isComposing) (event33.preventDefault(), run4(true));
          else event33.key === 'Escape' && (event33.preventDefault(), run4(false));
        }),
        el25.addEventListener('blur', () => run4(true)),
        this.overlayEl?.appendChild(el25),
        (this._textInputEl = el25),
        requestAnimationFrame(() => {
          if (this._textInputEl === el25) el25.focus();
        }));
    },
    _getTextLayout(cmd, viewport2) {
      return getTextLayout({ canvasEl: this.canvasEl, cmd: cmd, viewport: viewport2 });
    },
    _getTextGeometry(cmd2, viewport3) {
      return getTextGeometry({ canvasEl: this.canvasEl, cmd: cmd2, viewport: viewport3 });
    },
    _toTextLocalTransformSpace(value87, value88, value89) {
      return toTextLocalTransformSpace(value87, value88, value89);
    },
    _rotateTextLocalPoint(value90, value91) {
      return rotateTextLocalPoint(value90, value91);
    },
    _resolveAxisTextScale(value92, value93) {
      return resolveAxisTextScale(value92, value93);
    },
    _deleteTextCommand(value94) {
      const value95 = Number(value94);
      if (!Number.isInteger(value95) || this._commands[value95]?.type !== 'text') return false;
      return (
        this._commands.splice(value95, 1),
        (this._selectedTextCommandIndex = null),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render(),
        true
      );
    },
    _copyTextCommand(value96, value97 = this._view?.viewport) {
      const value98 = Number(value96),
        value99 = this._commands[value98];
      if (!Number.isInteger(value98) || value99?.type !== 'text') return false;
      const copiedTextCommand = buildCopiedTextCommand(value99, value97);
      return (
        this._commands.splice(value98 + 1, 0, copiedTextCommand),
        (this._selectedTextCommandIndex = value98 + 1),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render(),
        true
      );
    },
    deleteSelectedTextCommand() {
      const value100 = Number(this._selectedTextCommandIndex);
      if (!Number.isInteger(value100)) return false;
      return this._deleteTextCommand(value100);
    },
    _findTextHit(local, viewport4) {
      return findTextHit({
        commands: this._commands,
        selectedTextCommandIndex: this._selectedTextCommandIndex,
        local: local,
        viewport: viewport4,
        canvasEl: this.canvasEl,
      });
    },
    _createTextTransformState(hit, local2, viewport5) {
      return createTextTransformState({
        commands: this._commands,
        hit: hit,
        local: local2,
        viewport: viewport5,
        canvasEl: this.canvasEl,
      });
    },
    _normalizeSelectedTextCommand() {
      const count7 = Number(this._selectedTextCommandIndex);
      if (!Number.isInteger(count7) || count7 < 0 || count7 >= this._commands.length) {
        this._selectedTextCommandIndex = null;
        return;
      }
      this._commands[count7]?.type !== 'text' && (this._selectedTextCommandIndex = null);
    },
    _updateView(value101) {
      if (!this.active) return;
      const box17 = value101?.node,
        box18 = value101?.viewport;
      if (!box17) return;
      this.nodeData = box17;
      const clampImageBrushSize5 = clampImageBrushSize(value101?.brushSizePx, IMAGE_BRUSH_DEFAULT_SIZE_PX);
      if (this.sizeRangeEl && Number(this.sizeRangeEl.value) !== clampImageBrushSize5)
        this.sizeRangeEl.value = String(clampImageBrushSize5);
      if (this.sizeValueEl && this.sizeValueEl.textContent !== String(clampImageBrushSize5))
        this.sizeValueEl.textContent = String(clampImageBrushSize5);
      (this._updateToolActive(value101?.tool, clampImageBrushSize5),
        this._syncPaletteActive(value101?.color));
      const box19 = worldToScreen(box17.x, box17.y, box18),
        value102 = Math.round(box17.width * box18.zoom),
        value103 = Math.round(box17.height * box18.zoom);
      ((this.containerEl.style.left = Math.round(box19.x) + 'px'),
        (this.containerEl.style.top = Math.round(box19.y) + 'px'),
        (this.containerEl.style.width = value102 + 'px'),
        (this.containerEl.style.height = value103 + 'px'));
      const value104 = window.devicePixelRatio || 1,
        value105 = Math.max(1, value102),
        value106 = Math.max(1, value103);
      if (
        this.canvasEl.width !== Math.round(value105 * value104) ||
        this.canvasEl.height !== Math.round(value106 * value104)
      ) {
        ((this.canvasEl.width = Math.round(value105 * value104)),
          (this.canvasEl.height = Math.round(value106 * value104)),
          (this.canvasEl.style.width = value105 + 'px'),
          (this.canvasEl.style.height = value106 + 'px'));
        const value107 = this.canvasEl.getContext('2d');
        (value107.setTransform(value104, 0, 0, value104, 0, 0),
          (value107.lineCap = 'round'),
          (value107.lineJoin = 'round'));
      }
      const value108 = Math.max(12, Math.round(box19.y) - 54);
      ((this.toolbarEl.style.left = Math.round(box19.x + value102 / 2) + 'px'),
        (this.toolbarEl.style.top = value108 + 'px'),
        this.generationToolbarEl &&
          ((this.generationToolbarEl.style.left = Math.round(box19.x + value102 / 2) + 'px'),
          (this.generationToolbarEl.style.top = Math.round(box19.y + value103 + 14) + 'px'),
          (this.generationToolbarEl.style.bottom = 'auto'),
          (this.generationToolbarEl.style.transform = 'translateX(-50%)')),
        this._applyStageFlip(this._getCurrentFlipState()),
        this._render(box18));
    },
    _render(value109 = this._view?.viewport) {
      if (!this.active || !this.canvasEl) return;
      this._applyStageFlip(this._getCurrentFlipState());
      const ctx = this.canvasEl.getContext('2d'),
        value110 = Number(this.canvasEl.style.width.replace('px', '')) || 1,
        value111 = Number(this.canvasEl.style.height.replace('px', '')) || 1;
      ctx.clearRect(0, 0, value110, value111);
      if (this._isGenerationScene()) {
        this._renderEraseSceneCommands(ctx, value109, this._commands, this._draft);
        return;
      }
      this._renderCommands(ctx, value109, this._commands);
      if (this._draft) this._renderCommands(ctx, value109, [this._draft], true);
    },
    _renderEraseSceneCommands(ctx2, viewport6, commands = [], draft = null) {
      this._eraseMaskCanvasEl = renderEraseSceneCommands({
        documentRef: document,
        canvasEl: this.canvasEl,
        ctx: ctx2,
        viewport: viewport6,
        commands: commands,
        draft: draft,
        checkerPattern: this._checkerPattern,
        eraseMaskCanvasEl: this._eraseMaskCanvasEl,
      });
    },
    _renderCommands(ctx3, viewport7, commands2, isDraft = false) {
      renderCommands({
        ctx: ctx3,
        viewport: viewport7,
        canvasEl: this.canvasEl,
        commands: commands2,
        isDraft: isDraft,
        isEraseScene: this._isEraseScene(),
        checkerPattern: this._checkerPattern,
        defaultTextColor: getColorCanvas('red'),
        getTextGeometry: (value112, value113) => this._getTextGeometry(value112, value113),
        selectedTextCommandIndex: this._selectedTextCommandIndex,
        selectedCommandsRef: this._commands,
        resolveCssVar: getCssVar,
        fillRegionCache: this._fillRegionCache,
        numberLabelBackgroundColor: getCssVar('--canvas-white'),
      });
    },
    _addNumberLabel(box20, sizeWorld3) {
      if (!this.active || !this._isAnnotateScene()) return null;
      const value114 = appStore.getStateRaw(),
        x6 = Number(box20?.x),
        y4 = Number(box20?.y);
      if (!Number.isFinite(x6) || !Number.isFinite(y4)) return null;
      const value115 = {
        type: 'number-label',
        number: getNextNumberLabelValue(this._commands),
        x: x6,
        y: y4,
        color: getColorCanvas(value114.annotate?.color || 'red'),
        sizeWorld: sizeWorld3,
      };
      return (
        this._commands.push(value115),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render(),
        value115
      );
    },
    _fillArea(box21, value116) {
      const value117 = appStore.getStateRaw(),
        value118 = {
          type: 'fill',
          x: Number(box21?.x) || 0,
          y: Number(box21?.y) || 0,
          color: getColorCanvas(value117.annotate?.color || 'red'),
        };
      (this._commands.push(value118),
        (this._redoStack = []),
        (this._dirty = true),
        this._persistEraseSelectionState(),
        this._render());
    },
    _pushFlipCommand(type) {
      if (!this.active || !this._isAnnotateScene()) return;
      if (type !== 'flip-horizontal' && type !== 'flip-vertical') return;
      (this._removeTextInput(true),
        this._commands.push({ type: type }),
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
      const value119 = this._commands.pop();
      (this._redoStack.push(value119),
        (this._dirty = true),
        this._normalizeSelectedTextCommand(),
        this._persistEraseSelectionState(),
        this._render());
    },
    _redo() {
      if (this._redoStack.length === 0) return;
      const value120 = this._redoStack.pop();
      (this._commands.push(value120),
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
      const value121 = Boolean(this._useWhiteboardBase);
      (this.stageEl.classList.toggle('is-whiteboard', value121),
        this.overlayEl?.classList.toggle('is-whiteboard', value121),
        this.imgEl.setAttribute('aria-hidden', value121 ? 'true' : 'false'));
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
      const enabled12 = appStore.getStateRaw().nodes?.[this.nodeId];
      if (!enabled12) return;
      const tool6 = appStore.getStateRaw().annotate || {},
        persistedEraseSelectionState = buildPersistedEraseSelectionState({
          commands: this._commands,
          tool: tool6.tool,
          brushSizePx: tool6.brushSizePx,
        });
      appStore.updateNodeData(this.nodeId, { [ERASE_SELECTION_STATE_KEY]: persistedEraseSelectionState });
    },
    _buildSelectionMaskCanvas(naturalW, naturalH, scaleX2, scaleY2) {
      return buildSelectionMaskCanvas({
        documentRef: document,
        commands: this._commands,
        naturalW: naturalW,
        naturalH: naturalH,
        scaleX: scaleX2,
        scaleY: scaleY2,
      });
    },
    async _buildGenerationPayload(node2, imgUrl) {
      return buildGenerationPayload({
        scene: this._mode?.scene,
        commands: this._commands,
        promptText: this.promptText,
        node: node2,
        imgUrl: imgUrl,
        model: this.model,
        provider: this.provider,
        imageSize: this.imageSize,
        erasePrompt: ERASE_GENERATE_PROMPT,
        loadImage: (value122) => this._loadImage(value122),
        createSelectionMaskCanvas: (value123, value124, value125, value126) =>
          this._buildSelectionMaskCanvas(value123, value124, value125, value126),
        getModelProvider: getModelProvider,
        notify: (value127, value128) => window.showToast?.(value127, value128),
        documentRef: document,
        urlApi: URL,
      });
    },
    async _handleDebugRequest() {
      if (!this.active || !this._isGenerationScene()) return;
      const value129 = appStore.getState(),
        box22 = value129.nodes?.[this.nodeId];
      if (!box22) return;
      const enabled13 = this._resolveNodeImageUrl(box22);
      if (!enabled13) return;
      let value130 = '';
      try {
        const enabled14 = await this._buildGenerationPayload(box22, enabled13);
        if (!enabled14?.payload) return;
        value130 = enabled14.inputUrl || '';
        const generateImageRequest = await buildGenerateImageRequest(enabled14.payload),
          outputText = formatFinalApiDebugRequest(generateImageRequest),
          x7 = box22.x + (box22.width || 0x17c) + 50,
          y5 = box22.y;
        let enabled15 = Object.values(value129.nodes).find((item3) => item3.type === 'debug');
        (!enabled15
          ? appStore.addNode({
              id: 'debug-' + Date.now(),
              type: 'debug',
              x: x7,
              y: y5,
              width: 0x17c,
              height: 0x12c,
              name: imageAnnotateText('debug.nodeName'),
              outputText: outputText,
            })
          : appStore.updateNodeData(enabled15.id, { outputText: outputText, x: x7, y: y5 }),
          window.showToast?.(imageAnnotateText('debug.shown'), 'warn'));
      } catch (error) {
        window.showToast?.(imageAnnotateText('debug.buildRequestFailed', { error: error.message }), 'error');
      } finally {
        if (value130) URL.revokeObjectURL(value130);
      }
    },
    async _generateEraseResult(sourceNode, value131) {
      const built = await this._buildGenerationPayload(sourceNode, value131);
      if (!built?.payload) return;
      await runGenerationResultFlow({
        scene: 'erase',
        built: built,
        sourceNode: sourceNode,
        fallbackModel: this.model,
        fallbackProvider: this.provider,
        exitController: (value132) => this.exit(value132),
        notify: (value133, value134) => window.showToast?.(value133, value134),
      });
    },
    async _generateRepaintResult(sourceNode2, value135) {
      const built2 = await this._buildGenerationPayload(sourceNode2, value135);
      if (!built2?.payload) return;
      await runGenerationResultFlow({
        scene: 'repaint',
        built: built2,
        sourceNode: sourceNode2,
        fallbackModel: this.model,
        fallbackProvider: this.provider,
        exitController: (value136) => this.exit(value136),
        notify: (value137, value138) => window.showToast?.(value137, value138),
      });
    },
    async _save() {
      if (!this.active) return;
      this._removeTextInput(true);
      const value139 = appStore.getState(),
        node3 = value139.nodes[this.nodeId];
      if (!node3) return;
      const imgUrl2 = this._resolveNodeImageUrl(node3);
      if (!imgUrl2) return;
      const el26 =
          this.generationToolbarEl?.querySelector('.go') || this.toolbarEl.querySelector('.act-save'),
        el27 = el26?.querySelector('span') || null,
        value140 = el27 ? el27.textContent : '';
      el27 && (el27.textContent = this._mode?.submitBusyLabel || imageAnnotateText('actions.saving'));
      if (!el26) return;
      el26.style.pointerEvents = 'none';
      try {
        if (this._isEraseScene()) {
          await this._generateEraseResult(node3, imgUrl2);
          return;
        }
        if (this._isRepaintScene()) {
          await this._generateRepaintResult(node3, imgUrl2);
          return;
        }
        const isEraseScene = this._isEraseScene(),
          useWhiteboardBase = !isEraseScene && this._useWhiteboardBase,
          { blob: blob, exportType: exportType } = await exportAnnotateCanvasBlob({
            documentRef: document,
            node: node3,
            imgEl: this.imgEl,
            imgUrl: imgUrl2,
            commands: this._commands,
            useWhiteboardBase: useWhiteboardBase,
            isEraseScene: isEraseScene,
            loadImage: (value141) => this._loadImage(value141),
            getCurrentFlipState: () => this._getCurrentFlipState(),
            applyFlipTransformToContext: (value142, value143, value144, value145) =>
              this._applyFlipTransformToContext(value142, value143, value144, value145),
            createSelectionMaskCanvas: (value146, value147, value148, value149) =>
              this._buildSelectionMaskCanvas(value146, value147, value148, value149),
            canvasWhiteColor: getCssVar('--canvas-white'),
            defaultTextColor: getColorCanvas('red'),
          });
        (await saveAnnotateExportResult({
          blob: blob,
          exportType: exportType,
          scene: this._mode?.scene,
          sourceNodeId: this.nodeId,
          baseNode: node3,
          notify: (value150, value151) => window.showToast?.(value150, value151),
          triggerLocalCacheSave: () => window._triggerLocalCacheSave?.(),
        }),
          this.exit({ silent: true }));
      } catch (value152) {
        (console.error('[Annotate] save failed:', value152),
          window.showToast?.(imageAnnotateText('toasts.saveFailed'), 'error'));
      } finally {
        if (el27) el27.textContent = value140;
        el26.style.pointerEvents = 'auto';
      }
    },
    _resolveNodeImageUrl(value153) {
      const value154 = value153.mainImageIndex || 0,
        value155 = value153.images && value153.images[value154],
        value156 = value153.localPath || value155?.localPath,
        url = localPathToUrl(value156);
      if (url) return url;
      return (
        value153.src ||
        value153.sourceUrl ||
        value153.imageUrl ||
        value153.thumbUrl ||
        value155?.imageUrl ||
        value155?.thumbUrl ||
        ''
      );
    },
    _loadImage(value157) {
      return new Promise((handler10, handler11) => {
        const image = new Image();
        ((image.crossOrigin = 'anonymous'),
          (image.onload = () => handler10(image)),
          (image.onerror = () => handler11(new Error(imageAnnotateText('errors.imageLoadFailed')))),
          (image.src = value157));
      });
    },
  };
export default ImageAnnotateController;

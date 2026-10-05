import { openDebugRequestWindow } from './debugRequestWindow.js';
import appStore from '../core/stores/appStore.js';
import { getImageFunctionRequestSettings, getImageFunctionSelection } from './imageFunctionControls.js';
import { buildGenerateImageRequest } from '../../api/aiImageApi.js';
import {
  generateId,
  screenToWorld,
  isPointInRect,
  inverseImageRotationPoint,
  getImageRotationLayout,
} from '../core/math.js';
import { setStaticInnerHTML } from '../utils/dom.js';
import { getModelProvider } from '../config/modelConfig.js';
import {
  ANNOTATE_TOOLBAR_TEMPLATE_ID,
  createGenerationToolbarMarkup,
  getAnnotateToolbarToolsForScene,
} from './imageAnnotate/annotateToolbarMarkup.js';
import { resolveImageNodeUrl } from './imageNodeImageUrl.js';
import { waitForImageElementReady } from './imageOverlayReadiness.js';
import { bindImageOverlayViewportPreview } from './imageOverlayViewportPreview.js';
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
import {
  getEditorRotation,
  getKeepImageRatio,
  mountImageEditControls,
  syncImageEditControls,
} from './imageAnnotate/imageEditControls.js';
import {
  bindLocalEditControls,
  persistLocalEditState,
  submitLocalEdit,
} from './imageAnnotate/localEditControls.js';
import {
  createPendingAnnotateExportNode,
  markAnnotateExportNodeFailed,
  saveAnnotateExportResult,
} from './imageAnnotate/saveResultNode.js';
import {
  buildGenerationModelCatalog,
  buildSeedreamMigrationPatch,
  findProviderKeyByModel,
  getDefaultGenerationModelState,
  readLocalEditState,
} from './imageAnnotate/stateAdapters.js';
import { buildSelectionMaskCanvas } from './imageAnnotate/selectionMask.js';
import {
  IMAGE_BRUSH_DEFAULT_SIZE_PX,
  clampImageBrushSize,
  syncCircularBrushCursor,
} from './imageEditorBrushStyle.js';
import { buildFinalApiDebugPreview } from '../utils/debugRequestPreview.js';
import { getNodeDefaultSize } from '../services/fileService.js';
import { applyI18n, t } from '../i18n/index.js';
import {
  createCanvasEditorSurface,
  positionCanvasEditorSurface,
  positionCanvasEditorToolbar,
} from '../components/shared/canvasEditorSurface.js';
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
  getCssVar = (key) =>
    getComputedStyle(document['documentElement'])['getPropertyValue'](key)['trim'](),
  COLOR_NAME_BY_VAR = Object['fromEntries'](
    Object['entries'](COLOR_VAR_MAP)['map'](([index, result]) => [result, index]),
  ),
  normalizeColorName = (data) => {
    const enabled = String(data || '')['trim']();
    if (!enabled) return 'red';
    if (COLOR_VAR_MAP[enabled]) return enabled;
    const options = enabled['match'](/^var\(\s*(--[^)]+)\s*\)$/);
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
  isFiniteCommandPoint = (box) =>
    Number['isFinite'](Number(box?.['x'])) && Number['isFinite'](Number(box?.['y'])),
  hasDrawableStrokePoints = (current) =>
    Array['isArray'](current?.['points']) && current['points']['some'](isFiniteCommandPoint),
  shouldDiscardStrokeCommand = (entry) =>
    (entry?.['type'] === 'brush' || entry?.['type'] === 'eraser') &&
    !hasDrawableStrokePoints(entry),
  toImageLocalRenderViewport = (zoom2) => ({ x: 0, y: 0, zoom: zoom2?.['zoom'] });
export const __textControlTestUtils = { clampTextScale: clampTextScale, getTextScalePair: getTextScalePair };
export const __strokeCommandTestUtils = {
  hasDrawableStrokePoints: hasDrawableStrokePoints,
  shouldDiscardStrokeCommand: shouldDiscardStrokeCommand,
};
const ERASE_GENERATE_PROMPT = '擦除绿色的区域 并且填充背景',
  ROTATE_CURSOR_CSS =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cg transform='rotate(35 14 14)'%3E%3Cpath d='M10.2 22.7a8.6 8.6 0 1 0 0-17.4 6.8 6.8 0 1 1 0 17.4Z' fill='%23ffffff' stroke='%23ffffff' stroke-width='1.6' stroke-linejoin='round'/%3E%3Cpath d='M5.3 22.1h4.8v-4.8' fill='none' stroke='%23ffffff' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M5.3 22.1l3.9-3.9' fill='none' stroke='%23ffffff' stroke-width='1.7' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E\") 14 14",
  ImageAnnotateController = {
    active: ![],
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
    _cursorHover: ![],
    _cursorLast: { x: 0, y: 0 },
    _cursorRaf: 0,
    _temporaryTool: null,
    _textInputEl: null,
    _selectedTextCommandIndex: null,
    _unsubscribe: null,
    _commands: [],
    _redoStack: [],
    _draft: null,
    _dirty: ![],
    _view: null,
    _mode: null,
    imageSize: '1K',
    model: null,
    provider: null,
    promptText: '',
    _checkerPattern: null,
    _eraseMaskCanvasEl: null,
    _useWhiteboardBase: ![],
    _generationModelCatalog: null,
    _fillRegionCache: null,
    _unbindGenerationToolbarUpMenus: null,
    _unbindGenerationFunctionMenus: null,
    _unsubscribeViewportPreview: null,
    init(nodeId, record = {}) {
      if (this['active']) return;
      const viewport = appStore['getStateRaw'](),
        enabled3 = viewport['nodes']?.[nodeId];
      if (!enabled3) return;
      const enabled4 = this['_resolveNodeImageUrl'](enabled3, { preferPreview: !![] });
      if (!enabled4) {
        window['showToast']?.(imageAnnotateText('toasts.noImage'), 'warn');
        return;
      }
      const localEditState = readLocalEditState(enabled3),
        scene =
          record['scene'] === 'local-edit'
            ? localEditState?.['scene'] || 'repaint'
            : String(record['scene'] || 'annotate'),
        payload = scene === 'erase' || scene === 'repaint' ? localEditState : null,
        tool =
          scene === 'erase' || scene === 'repaint'
            ? payload?.['tool'] || 'brush'
            : viewport['annotate']?.['tool'] === 'bucket'
              ? 'brush'
              : viewport['annotate']?.['tool'] || 'brush',
        color = normalizeColorName(viewport['annotate']?.['color']),
        brushSizePx = payload
          ? clampImageBrushSize(payload['brushSizePx'], 40)
          : clampImageBrushSize(viewport['annotate']?.['brushSizePx'], IMAGE_BRUSH_DEFAULT_SIZE_PX);
      ((this['active'] = !![]),
        (this['_localEditSession'] = {}),
        (this['_localEditSubmission'] = null),
        (this['nodeId'] = nodeId),
        (this['_generationModelCatalog'] = buildGenerationModelCatalog()));
      const node = this['_normalizeLegacySeedreamNode'](enabled3);
      ((this['nodeData'] = node),
        (this['_commands'] = payload?.['commands'] || []),
        (this['_redoStack'] = []),
        (this['_draft'] = null),
        (this['_selectedTextCommandIndex'] = null),
        (this['_dirty'] = ![]),
        (this['_useWhiteboardBase'] = ![]),
        (this['_fillRegionCache'] = new Map()));
      const imageAnnotateText2 = imageAnnotateText('actions.save'),
        imageAnnotateText3 = imageAnnotateText('actions.generate'),
        t2 = t('imageAnnotate.actions.generate', {}, { locale: 'zh-CN' }),
        handle = String(record['submitLabel'] || imageAnnotateText2)['trim'](),
        submitLabel = handle || imageAnnotateText2,
        state = submitLabel === imageAnnotateText3 || submitLabel === t2;
      this['_mode'] = {
        scene: scene,
        submitLabel: submitLabel,
        submitBusyLabel:
          String(record['submitBusyLabel'] || '')['trim']() ||
          (state ? imageAnnotateText('actions.generating') : imageAnnotateText('actions.saving')),
        submitNoop: Boolean(record['submitNoop']),
      };
      const config = this['_getGenerationModelCatalog'](),
        defaultGenerationModelState = getDefaultGenerationModelState(config);
      this['imageSize'] = '1K';
      const scope = String(node?.['model'] || '')['trim'](),
        input = String(node?.['provider'] || '')['trim'](),
        providerKeyByModel = findProviderKeyByModel(config, scope);
      (providerKeyByModel
        ? ((this['model'] = scope), (this['provider'] = providerKeyByModel))
        : ((this['model'] = defaultGenerationModelState['model'] || scope || null),
          (this['provider'] = defaultGenerationModelState['provider'] || input || getModelProvider(this['model']) || null)),
        (this['promptText'] = String(record['promptText'] ?? payload?.['promptText'] ?? '')),
        (this['_view'] = {
          tool: tool,
          color: color,
          brushSizePx: brushSizePx,
          viewport: viewport['viewport'],
          node: node,
        }),
        appStore['setAnnotateState']({
          active: !![],
          nodeId: nodeId,
          tool: tool,
          color: color,
          brushSizePx: brushSizePx,
        }),
        this['_createUI'](enabled4, { tool: tool, color: color, brushSizePx: brushSizePx }),
        this['_bindEvents'](),
        (this['_unsubscribe'] = appStore['subscribeSelector'](
          (state2) => {
            const nx = state2['nodes']?.[nodeId],
              vx = state2['viewport'] || { x: 0, y: 0, zoom: 1 },
              tool2 = state2['annotate'] || {};
            return {
              hasNode: !!nx,
              nx: nx ? nx['x'] : 0,
              ny: nx ? nx['y'] : 0,
              nw: nx ? nx['width'] : 0,
              nh: nx ? nx['height'] : 0,
              vx: vx['x'],
              vy: vx['y'],
              vz: vx['zoom'] || 1,
              vox: vx['_screenOriginX'] || 0,
              voy: vx['_screenOriginY'] || 0,
              tool: tool2['tool'] || 'brush',
              color: normalizeColorName(tool2['color']),
              brushSizePx: clampImageBrushSize(tool2['brushSizePx'], IMAGE_BRUSH_DEFAULT_SIZE_PX),
            };
          },
          (tool3) => {
            if (!tool3?.['hasNode']) return;
            const output = appStore['getStateRaw']()['nodes']?.[nodeId],
              box2 = this['_normalizeLegacySeedreamNode'](output);
            ((this['nodeData'] = box2 || null),
              (this['_view'] = {
                tool: tool3['tool'],
                color: tool3['color'],
                brushSizePx: tool3['brushSizePx'],
                viewport: {
                  x: tool3['vx'],
                  y: tool3['vy'],
                  zoom: tool3['vz'],
                  _screenOriginX: tool3['vox'],
                  _screenOriginY: tool3['voy'],
                },
                node: {
                  x: Number(box2?.['x'] ?? tool3['nx']),
                  y: Number(box2?.['y'] ?? tool3['ny']),
                  width: Number(box2?.['width'] ?? tool3['nw']),
                  height: Number(box2?.['height'] ?? tool3['nh']),
                },
              }),
              this['_updateView'](this['_view']));
          },
        )),
        (this['_unsubscribeViewportPreview'] = bindImageOverlayViewportPreview({
          getView: () => this['_view'],
          updateView: (value2) => {
            ((this['_view'] = value2), this['_updateView'](value2));
          },
        })),
        this['_waitForImageAndShow']());
    },
    _waitForImageAndShow() {
      (this['_cancelImageReadyWait']?.(),
        this['overlayEl']?.['classList']['add']('visible'),
        (this['_cancelImageReadyWait'] = waitForImageElementReady({
          image: this['imgEl'],
          onReady: () => {
            this['_cancelImageReadyWait'] = null;
            if (this['active'] && this['_view']) this['_updateView'](this['_view']);
          },
          onError: () => {
            this['_cancelImageReadyWait'] = null;
            if (!this['active']) return;
            (window['showToast']?.(imageAnnotateText('errors.imageLoadFailed'), 'error'),
              this['exit']({ silent: !![] }));
          },
        })));
    },
    _getGenerationModelCatalog() {
      return (
        !this['_generationModelCatalog'] && (this['_generationModelCatalog'] = buildGenerationModelCatalog()),
        this['_generationModelCatalog']
      );
    },
    _normalizeLegacySeedreamNode(value3) {
      const args = buildSeedreamMigrationPatch(value3);
      if (!args) return value3;
      const value4 = { ...(value3 || {}), ...args },
        value5 = appStore['getStateRaw']()['nodes']?.[this['nodeId']];
      return (value5 && appStore['updateNodeData'](this['nodeId'], args), value4);
    },
    exit({ silent: silent = ![] } = {}) {
      if (!this['active']) return;
      (this['_cleanupEvents']?.(),
        (this['_cleanupEvents'] = null),
        this['_imageEditControls']?.['destroy'](),
        (this['_imageEditControls'] = null),
        this['_functionControls']?.['destroy'](),
        (this['_functionControls'] = null),
        this['_cancelImageReadyWait']?.(),
        (this['_cancelImageReadyWait'] = null));
      !silent && this['_dirty'] && window['showToast']?.(imageAnnotateText('toasts.cancelled'), 'ok');
      ((this['active'] = ![]),
        (this['_localEditSession'] = null),
        (this['_localEditSubmission'] = null),
        (this['nodeId'] = null),
        (this['nodeData'] = null),
        (this['_commands'] = []),
        (this['_redoStack'] = []),
        (this['_draft'] = null),
        this['_removeTextInput'](![]),
        (this['_dirty'] = ![]),
        appStore['setAnnotateState']({ active: ![], nodeId: null }));
      this['_unsubscribe'] && (this['_unsubscribe'](), (this['_unsubscribe'] = null));
      (this['_unsubscribeViewportPreview']?.(),
        (this['_unsubscribeViewportPreview'] = null),
        this['_unbindGenerationToolbarUpMenus']?.(),
        (this['_unbindGenerationToolbarUpMenus'] = null),
        this['_unbindGenerationFunctionMenus']?.(),
        (this['_unbindGenerationFunctionMenus'] = null));
      if (this['overlayEl']) this['overlayEl']['remove']();
      if (this['toolbarEl']) this['toolbarEl']['remove']();
      if (this['generationToolbarEl']) this['generationToolbarEl']['remove']();
      ((this['overlayEl'] = null),
        (this['containerEl'] = null),
        (this['stageEl'] = null),
        (this['imgEl'] = null),
        (this['canvasEl'] = null),
        (this['toolbarEl'] = null),
        (this['generationToolbarEl'] = null),
        (this['sizeValueEl'] = null),
        (this['sizeRangeEl'] = null),
        (this['colorWrapEl'] = null),
        (this['colorDotEl'] = null),
        (this['colorMenuEl'] = null),
        (this['colorButtons'] = null),
        (this['toolButtons'] = null),
        (this['cursorEl'] = null),
        (this['_cursorHover'] = ![]),
        (this['_cursorLast'] = { x: 0, y: 0 }),
        (this['_cursorRaf'] = 0),
        (this['_temporaryTool'] = null),
        (this['_textInputEl'] = null),
        (this['_selectedTextCommandIndex'] = null),
        (this['_view'] = null),
        (this['_mode'] = null),
        (this['imageSize'] = '1K'),
        (this['model'] = null),
        (this['provider'] = null),
        (this['promptText'] = ''),
        (this['_checkerPattern'] = null),
        (this['_eraseMaskCanvasEl'] = null),
        (this['_useWhiteboardBase'] = ![]),
        (this['_generationModelCatalog'] = null),
        (this['_fillRegionCache'] = null),
        (this['_unbindGenerationToolbarUpMenus'] = null),
        (this['_unbindGenerationFunctionMenus'] = null));
    },
    _isGenerationScene() {
      return this['_mode']?.['scene'] === 'repaint' || this['_mode']?.['scene'] === 'erase';
    },
    _isEraseScene() {
      return this['_mode']?.['scene'] === 'erase';
    },
    _isRepaintScene() {
      return this['_mode']?.['scene'] === 'repaint';
    },
    _isAnnotateScene() {
      return this['_mode']?.['scene'] === 'annotate';
    },
    _getFlipState(value6 = this['_commands']) {
      const enabled5 = { horizontal: ![], vertical: ![] };
      return (
        (Array['isArray'](value6) ? value6 : [])['forEach']((value7) => {
          if (value7?.['type'] === 'flip-horizontal') enabled5['horizontal'] = !enabled5['horizontal'];
          else value7?.['type'] === 'flip-vertical' && (enabled5['vertical'] = !enabled5['vertical']);
        }),
        enabled5
      );
    },
    _getCurrentFlipState() {
      if (!this['_isAnnotateScene']()) return { horizontal: ![], vertical: ![] };
      return this['_getFlipState'](this['_commands']);
    },
    _applyFlipToLocalPoint(box3, box4, value8 = this['_getCurrentFlipState']()) {
      const box5 = { x: Number(box3?.['x']) || 0, y: Number(box3?.['y']) || 0 },
        value9 = Math['max'](1, Number(box4?.['width']) || 1),
        value10 = Math['max'](1, Number(box4?.['height']) || 1);
      if (value8?.['horizontal']) box5['x'] = value9 - box5['x'];
      if (value8?.['vertical']) box5['y'] = value10 - box5['y'];
      return box5;
    },
    _getLocalFromClient(value11, value12, value13, box6) {
      const x2 = screenToWorld(value11, value12, value13['viewport']);
      let inverseImageRotationPoint2 = { x: x2['x'] - box6['x'], y: x2['y'] - box6['y'] };
      if (!this['_isAnnotateScene']()) return inverseImageRotationPoint2;
      return (
        (inverseImageRotationPoint2 = inverseImageRotationPoint(
          inverseImageRotationPoint2,
          box6['width'],
          box6['height'],
          getEditorRotation(this),
          getKeepImageRatio(this['_commands']),
        )),
        this['_applyFlipToLocalPoint'](inverseImageRotationPoint2, box6, this['_getCurrentFlipState']())
      );
    },
    _applyStageFlip(value14 = this['_getCurrentFlipState']()) {
      if (!this['stageEl']) return;
      if (!this['_isAnnotateScene']()) {
        this['stageEl']['style']['transform'] = 'none';
        return;
      }
      const value15 = value14?.['horizontal'] ? -1 : 1,
        value16 = value14?.['vertical'] ? -1 : 1;
      this['stageEl']['style']['transformOrigin'] = '50% 50%';
      const editorRotation = getEditorRotation(this),
        box7 = this['_view']?.['node'] || this['nodeData'],
        value17 = box7
          ? getImageRotationLayout(
              box7['width'],
              box7['height'],
              editorRotation,
              getKeepImageRatio(this['_commands']),
            )['scale']
          : 1;
      ((this['stageEl']['style']['transform'] =
        'rotate(' +
        editorRotation +
        'deg) scale(' +
        value15 * value17 +
        ', ' +
        value16 * value17 +
        ')'),
        syncImageEditControls(this));
    },
    _applyFlipTransformToContext(
      box8,
      value18,
      value19,
      value20 = this['_getCurrentFlipState'](),
    ) {
      if (!box8) return;
      (value20?.['horizontal'] && (box8['translate'](value18, 0), box8['scale'](-1, 1)),
        value20?.['vertical'] && (box8['translate'](0, value19), box8['scale'](1, -1)));
    },
    _closeGenerationMenus() {
      this['_functionControls']?.['closeMenus']();
    },
    _createUI(value21, value22 = {}) {
      const { overlay: overlay, container: container, stage: stage } = createCanvasEditorSurface(),
        value23 = document['createElement']('img');
      ((value23['className'] = 'v2-annotate-img'),
        (value23['src'] = value21),
        (value23['draggable'] = ![]));
      const value24 = document['createElement']('canvas');
      ((value24['className'] = 'v2-annotate-canvas'),
        stage['appendChild'](value23),
        stage['appendChild'](value24));
      const el = document['createElement']('div');
      ((el['className'] = 'v2-annotate-cursor'),
        (el['style']['display'] = 'none'),
        overlay['appendChild'](el),
        overlay['appendChild'](container),
        document['body']['appendChild'](overlay),
        (this['overlayEl'] = overlay),
        (this['containerEl'] = container),
        (this['stageEl'] = stage),
        (this['imgEl'] = value23),
        (this['canvasEl'] = value24),
        (this['cursorEl'] = el),
        this['_applyBaseSurface']());
      const el2 = document['createElement']('div');
      ((el2['className'] = 'v2-annotate-toolbar'),
        setStaticInnerHTML(el2, ANNOTATE_TOOLBAR_TEMPLATE_ID),
        applyI18n(el2),
        document['body']['appendChild'](el2),
        (this['toolbarEl'] = el2));
      if (this['_isGenerationScene']()) {
        const el3 = document['createElement']('div');
        ((this['_functionSelection'] = getImageFunctionSelection(
          this['model'],
          this['nodeData'],
          this['imageSize'],
        )),
          (el3['className'] = 'v2-annotate-toolbar v2-annotate-generation-toolbar'),
          (el3['innerHTML'] = createGenerationToolbarMarkup({
            selection: this['_functionSelection'],
            scene: this['_mode']?.['scene'] || 'annotate',
            promptText: this['promptText'],
            imageSize: this['imageSize'],
            model: this['model'],
            provider: this['provider'],
            modelCatalog: this['_getGenerationModelCatalog'](),
            submitTooltip: this['_mode']?.['submitLabel'] || imageAnnotateText('actions.generate'),
          })),
          applyI18n(el3),
          document['body']['appendChild'](el3),
          (this['generationToolbarEl'] = el3));
      }
      ((this['sizeValueEl'] = el2['querySelector']('.v2-annotate-size-value')),
        (this['sizeRangeEl'] = el2['querySelector']('.v2-annotate-size-range')),
        (this['colorWrapEl'] = el2['querySelector']('.v2-annotate-colorwrap')),
        (this['colorDotEl'] = el2['querySelector']('.v2-annotate-color-dot')),
        (this['colorMenuEl'] = el2['querySelector']('.v2-annotate-color-menu')),
        (this['colorButtons'] = Array['from'](el2['querySelectorAll']('.v2-annotate-swatch'))));
      const list = getAnnotateToolbarToolsForScene(this['_mode']?.['scene'] || 'annotate');
      (el2['querySelectorAll']('.tool-btn')['forEach']((el4) => {
        if (!list['includes'](el4['dataset']['tool'])) el4['remove']();
      }),
        (this['toolButtons'] = Array['from'](el2['querySelectorAll']('.tool-btn'))));
      this['_isGenerationScene']() &&
        (this['colorWrapEl']?.['remove'](),
        (this['colorWrapEl'] = null),
        (this['colorDotEl'] = null),
        (this['colorMenuEl'] = null),
        (this['colorButtons'] = []));
      !this['_isAnnotateScene']() &&
        (el2['querySelector']('.act-flip-horizontal')?.['remove'](),
        el2['querySelector']('.act-flip-vertical')?.['remove']());
      const el5 = el2['querySelector']('.act-save'),
        el6 = el2['querySelector']('.act-new-board'),
        el7 = el5?.['querySelector']('span'),
        value25 = this['_mode']?.['submitLabel'] || '保存';
      if (el7) el7['textContent'] = value25;
      if (el5) el5['setAttribute']('data-tooltip', value25);
      el5 && this['_isGenerationScene']() && (el5['style']['display'] = 'none');
      el6 && this['_isGenerationScene']() && (el6['style']['display'] = 'none');
      const clampImageBrushSize2 = clampImageBrushSize(value22['brushSizePx'], IMAGE_BRUSH_DEFAULT_SIZE_PX),
        value26 = value22['tool'] || 'brush',
        value27 = list['includes'](value26) ? value26 : 'brush',
        colorName = normalizeColorName(value22['color']);
      ((this['sizeRangeEl']['value'] = String(clampImageBrushSize2)),
        (this['sizeValueEl']['textContent'] = String(clampImageBrushSize2)),
        this['_updateToolActive'](value27, clampImageBrushSize2),
        this['_syncPaletteActive'](colorName));
      if (this['_isAnnotateScene']()) mountImageEditControls(this);
      if (this['_view']) this['_updateView'](this['_view']);
    },
    _bindEvents() {
      const value28 = (event) => {
        const value29 =
          this['canvasEl'] &&
          (event['target'] === this['canvasEl'] || this['canvasEl']['contains'](event['target']));
        if (value29) {
          this['_onCanvasWheel'](event);
          return;
        }
        (event['preventDefault'](), event['stopPropagation']());
      };
      this['overlayEl']['addEventListener']('wheel', value28, { passive: ![] });
      const value30 = () => {
        if (this['_view']) this['_updateView'](this['_view']);
      };
      window['addEventListener']('resize', value30);
      const value31 = (event2) => {
        if (!this['active']) return;
        const value32 = event2['target'],
          value33 = value32?.['tagName']?.['toLowerCase']?.() || '',
          value34 =
            value33 === 'input' || value33 === 'textarea' || value32?.['isContentEditable'] === !![];
        if (value34) return;
        if (event2['altKey'] || event2['ctrlKey'] || event2['metaKey']) return;
        const value35 = String(event2['key'] || '')['toLowerCase']();
        value35 === 't' &&
          !this['_isGenerationScene']() &&
          (event2['preventDefault'](), this['_setTool']('text'));
      };
      window['addEventListener']('keydown', value31);
      const value36 = () => {
        (window['removeEventListener']('resize', value30),
          window['removeEventListener']('keydown', value31),
          this['overlayEl']?.['removeEventListener']('wheel', value28),
          document['removeEventListener']('pointerdown', value37, !![]));
      };
      ((this['_cleanupEvents'] = value36),
        this['toolbarEl']['addEventListener']('pointerdown', (event3) => event3['stopPropagation']()),
        this['toolbarEl']['querySelector']('.act-cancel')['addEventListener']('click', (event4) => {
          (event4['stopPropagation'](), this['exit']());
        }),
        this['toolButtons']['forEach']((el8) => {
          el8['addEventListener']('click', (event5) => {
            event5['stopPropagation']();
            const value38 = el8['dataset']['tool'];
            this['_setTool'](value38);
          });
        }));
      const run = () => {
          this['_imageEditControls']?.['closeColorMenu']();
          if (!this['colorWrapEl']) return;
          this['colorWrapEl']['classList']['remove']('open');
        },
        value37 = (event6) => {
          (this['colorWrapEl'] &&
            this['colorWrapEl']['classList']['contains']('open') &&
            !this['colorWrapEl']['contains'](event6['target']) &&
            run(),
            this['generationToolbarEl'] &&
              !this['generationToolbarEl']['contains'](event6['target']) &&
              !this['_functionControls']?.['containsMenuTarget'](event6['target']) &&
              this['_closeGenerationMenus']());
        };
      (document['addEventListener']('pointerdown', value37, !![]),
        this['colorWrapEl']?.['addEventListener']('pointerdown', (event7) =>
          event7['stopPropagation'](),
        ));
      if (!this['_imageEditControls'])
        this['colorWrapEl']
          ?.['querySelector']('.v2-annotate-color-toggle')
          ?.['addEventListener']('click', (event8) => {
            event8['stopPropagation']();
            if (!this['colorWrapEl']) return;
            this['colorWrapEl']['classList']['toggle']('open');
          });
      (this['colorButtons']['forEach']((el9) => {
        el9['addEventListener']('click', (event9) => {
          event9['stopPropagation']();
          const color2 = el9['dataset']['color'];
          (appStore['setAnnotateState']({ color: color2 }), run());
        });
      }),
        this['sizeRangeEl']['addEventListener']('input', (event10) => {
          const brushSizePx2 = clampImageBrushSize(event10['target']['value'], 1);
          (appStore['setAnnotateState']({ brushSizePx: brushSizePx2 }),
            (this['sizeValueEl']['textContent'] = String(brushSizePx2)),
            this['_syncCursor'](),
            this['_persistLocalEditState']());
        }),
        this['toolbarEl']['querySelector']('.act-undo')['addEventListener']('click', (event11) => {
          (event11['stopPropagation'](), this['_undo']());
        }),
        this['toolbarEl']
          ['querySelector']('.act-flip-horizontal')
          ?.['addEventListener']('click', (event12) => {
            (event12['stopPropagation'](), this['_flipHorizontal']());
          }),
        this['toolbarEl']
          ['querySelector']('.act-flip-vertical')
          ?.['addEventListener']('click', (event13) => {
            (event13['stopPropagation'](), this['_flipVertical']());
          }),
        this['toolbarEl']['querySelector']('.act-redo')['addEventListener']('click', (event14) => {
          (event14['stopPropagation'](), this['_redo']());
        }),
        this['toolbarEl']['querySelector']('.act-clear')['addEventListener']('click', (event15) => {
          (event15['stopPropagation'](), this['_clear']());
        }),
        this['toolbarEl']['querySelector']('.act-new-board')?.['addEventListener']('click', (event16) => {
          (event16['stopPropagation'](), this['_createNewWhiteboard']());
        }),
        this['toolbarEl']['querySelector']('.act-save')['addEventListener']('click', async (event17) => {
          event17['stopPropagation']();
          if (this['_mode']?.['submitNoop']) return;
          await this['_save']();
        }),
        bindLocalEditControls(this));
      const value39 = this['canvasEl']['getContext']('2d');
      ((value39['lineCap'] = 'round'),
        (value39['lineJoin'] = 'round'),
        (this['_checkerPattern'] = createEraseCheckerboardPattern(value39, 1)));
      const event18 = {
          down: ![],
          pointerId: null,
          previousTool: null,
          temporaryTool: null,
          textTransform: null,
        },
        handler = (x3, y2) => {
          this['_cursorLast'] = { x: x3, y: y2 };
          if (this['_cursorRaf']) return;
          this['_cursorRaf'] = requestAnimationFrame(() => {
            ((this['_cursorRaf'] = 0), this['_syncCursor']());
          });
        },
        handler2 = (value40, value41, value42, count = 0) => {
          const state3 = appStore['getStateRaw'](),
            box9 = state3['nodes']?.[this['nodeId']];
          if (!box9) return ![];
          const x1 = this['_getLocalFromClient'](value40, value41, state3, box9);
          if (
            !isPointInRect(x1['x'], x1['y'], 0, 0, box9['width'], box9['height'])
          )
            return ![];
          const value43 = state3['annotate']?.['tool'] || 'brush',
            value44 = count === 1 || count === 2,
            value45 = value44 ? 'eraser' : value43;
          if (value45 !== 'text') this['_selectedTextCommandIndex'] = null;
          const clampImageBrushSize3 = clampImageBrushSize(
              state3['annotate']?.['brushSizePx'],
              IMAGE_BRUSH_DEFAULT_SIZE_PX,
            ),
            value46 = this['_isAnnotateScene']()
              ? getImageRotationLayout(
                  box9['width'],
                  box9['height'],
                  getEditorRotation(this),
                  getKeepImageRatio(this['_commands']),
                )['scale']
              : 1,
            sizeWorld = clampImageBrushSize3 / ((state3['viewport']['zoom'] || 1) * value46);
          value44
            ? ((event18['previousTool'] = value43),
              (event18['temporaryTool'] = 'eraser'),
              (this['_temporaryTool'] = 'eraser'),
              this['_syncCursor']('eraser', clampImageBrushSize3))
            : ((event18['previousTool'] = null),
              (event18['temporaryTool'] = null),
              (this['_temporaryTool'] = null));
          if (value45 === 'bucket' && !this['_isEraseScene']())
            return (this['_fillArea'](x1, sizeWorld), !![]);
          if (value45 === 'number-label' && this['_isAnnotateScene']())
            return (this['_addNumberLabel'](x1, sizeWorld), !![]);
          if (value45 === 'text') {
            const value47 = this['_findTextHit'](x1, state3['viewport']);
            if (value47) {
              (this['_removeTextInput'](!![]), (this['_selectedTextCommandIndex'] = value47['index']));
              if (value47['mode'] === 'delete')
                return (this['_deleteTextCommand'](value47['index']), !![]);
              if (value47['mode'] === 'copy')
                return (this['_copyTextCommand'](value47['index'], state3['viewport']), !![]);
              return (
                (event18['down'] = !![]),
                (event18['pointerId'] = value42),
                (event18['textTransform'] = this['_createTextTransformState'](
                  value47,
                  x1,
                  state3['viewport'],
                )),
                this['canvasEl']['setPointerCapture'](value42),
                this['_render'](),
                !![]
              );
            }
            return (
              (this['_selectedTextCommandIndex'] = null),
              this['_openTextInput'](x1, state3, sizeWorld, value40, value41),
              !![]
            );
          }
          if (value45 === 'rect')
            this['_draft'] = {
              type: 'rect',
              color: getColorCanvas(state3['annotate']?.['color'] || 'red'),
              sizeWorld: sizeWorld,
              x1: x1['x'],
              y1: x1['y'],
              x2: x1['x'],
              y2: x1['y'],
            };
          else
            value45 === 'eraser'
              ? (this['_draft'] = { type: 'eraser', sizeWorld: sizeWorld, points: [x1] })
              : (this['_draft'] = {
                  type: 'brush',
                  color: getColorCanvas(state3['annotate']?.['color'] || 'red'),
                  sizeWorld: sizeWorld,
                  points: [x1],
                });
          return (
            (event18['down'] = !![]),
            (event18['pointerId'] = value42),
            this['canvasEl']['setPointerCapture'](value42),
            this['_render'](),
            !![]
          );
        },
        handler3 = (value48, value49) => {
          const state4 = appStore['getStateRaw'](),
            enabled6 = state4['nodes']?.[this['nodeId']];
          if (!enabled6) return;
          const box10 = this['_getLocalFromClient'](value48, value49, state4, enabled6);
          if (event18['down'] && event18['textTransform']) {
            const x4 = event18['textTransform'],
              box11 = this['_commands'][x4['index']];
            if (box11?.['type'] === 'text') {
              const value50 = state4['viewport']?.['zoom'] || 1,
                box12 = {
                  x: Number(box10['x'] || 0) * value50,
                  y: Number(box10['y'] || 0) * value50,
                };
              if (x4['mode'] === 'move')
                ((box11['x'] = box10['x'] - x4['offsetWorldX']),
                  (box11['y'] = box10['y'] - x4['offsetWorldY']));
              else {
                if (x4['mode'] === 'scale-x' || x4['mode'] === 'scale-y') {
                  const value51 = this['_resolveAxisTextScale'](x4, box12);
                  ((box11['scale'] = undefined),
                    (box11['scaleX'] = value51['scaleX']),
                    (box11['scaleY'] = value51['scaleY']),
                    (box11['x'] = value51['originPx']['x'] / value50),
                    (box11['y'] = value51['originPx']['y'] / value50));
                } else {
                  if (x4['mode'] === 'scale-uniform') {
                    const box13 = this['_toTextLocalTransformSpace'](
                        box12,
                        x4['originPx'],
                        x4['rotation'],
                      ),
                      value52 = box13['x'] / x4['baseWidthPx'],
                      value53 = box13['y'] / x4['baseHeightPx'],
                      count2 = Math['max'](value52, value53),
                      value54 = Number['isFinite'](count2) && count2 > 0 ? count2 : 1;
                    ((box11['scale'] = undefined),
                      (box11['scaleX'] = clampTextScale(x4['baseScaleX'] * value54)),
                      (box11['scaleY'] = clampTextScale(x4['baseScaleY'] * value54)),
                      (box11['x'] = x4['originPx']['x'] / value50),
                      (box11['y'] = x4['originPx']['y'] / value50));
                  } else {
                    if (x4['mode'] === 'rotate') {
                      const value55 = Math['atan2'](
                          box12['y'] - x4['centerPx']['y'],
                          box12['x'] - x4['centerPx']['x'],
                        ),
                        value56 = x4['baseRotation'] + (value55 - x4['baseAngle']);
                      box11['rotation'] = value56;
                      const { scaleX: scaleX, scaleY: scaleY } = getTextScalePair(box11),
                        box14 = {
                          x: (x4['layoutWidth'] * scaleX) / 2,
                          y: (x4['layoutHeight'] * scaleY) / 2,
                        },
                        value57 = Math['cos'](value56),
                        value58 = Math['sin'](value56),
                        value59 = box14['x'] * value57 - box14['y'] * value58,
                        value60 = box14['x'] * value58 + box14['y'] * value57,
                        box15 = {
                          x: x4['centerPx']['x'] - value59,
                          y: x4['centerPx']['y'] - value60,
                        };
                      ((box11['x'] = box15['x'] / value50),
                        (box11['y'] = box15['y'] / value50));
                    }
                  }
                }
              }
              ((this['_selectedTextCommandIndex'] = x4['index']), this['_render']());
            }
            return;
          }
          if (!event18['down'] || !this['_draft']) return;
          (this['_draft']['type'] === 'rect'
            ? ((this['_draft']['x2'] = box10['x']), (this['_draft']['y2'] = box10['y']))
            : this['_draft']['points']['push'](box10),
            this['_render']());
        },
        handler4 = () => {
          if (event18['down'] && event18['textTransform']) {
            ((event18['down'] = ![]),
              (event18['pointerId'] = null),
              (event18['textTransform'] = null),
              (event18['previousTool'] = null),
              (event18['temporaryTool'] = null),
              (this['_temporaryTool'] = null),
              (this['_redoStack'] = []),
              (this['_dirty'] = !![]),
              this['_persistLocalEditState'](),
              this['_render']());
            return;
          }
          if (!event18['down'] || !this['_draft']) return;
          const value61 = this['_draft'];
          ((this['_draft'] = null), (event18['down'] = ![]), (event18['pointerId'] = null));
          const value62 = event18['previousTool'];
          ((event18['previousTool'] = null),
            (event18['temporaryTool'] = null),
            (event18['textTransform'] = null),
            (this['_temporaryTool'] = null));
          if (shouldDiscardStrokeCommand(value61)) {
            value62
              ? this['_syncCursor'](value62, this['_view']?.['brushSizePx'])
              : this['_syncCursor']();
            this['_render']();
            return;
          }
          if (value61['type'] === 'rect') {
            const count3 = Math['abs'](value61['x2'] - value61['x1']),
              count4 = Math['abs'](value61['y2'] - value61['y1']);
            if (count3 < 0.5 && count4 < 0.5) {
              value62
                ? this['_syncCursor'](value62, this['_view']?.['brushSizePx'])
                : this['_syncCursor']();
              this['_render']();
              return;
            }
          }
          (this['_commands']['push'](value61),
            (this['_redoStack'] = []),
            (this['_dirty'] = !![]),
            this['_persistLocalEditState'](),
            value62 && this['_syncCursor'](value62, this['_view']?.['brushSizePx']),
            this['_render']());
        };
      (this['canvasEl']['addEventListener']('pointerdown', (event19) => {
        (event19['preventDefault'](),
          event19['stopPropagation'](),
          handler(event19['clientX'], event19['clientY']),
          handler2(event19['clientX'], event19['clientY'], event19['pointerId'], event19['button']));
      }),
        this['canvasEl']['addEventListener']('contextmenu', (event20) => {
          (event20['preventDefault'](), event20['stopPropagation']());
        }),
        this['canvasEl']['addEventListener']('pointermove', (event21) => {
          (event21['preventDefault'](),
            event21['stopPropagation'](),
            handler(event21['clientX'], event21['clientY']),
            handler3(event21['clientX'], event21['clientY']));
        }),
        this['canvasEl']['addEventListener']('pointerup', (event22) => {
          (event22['preventDefault'](),
            event22['stopPropagation'](),
            handler(event22['clientX'], event22['clientY']),
            handler4());
        }),
        this['canvasEl']['addEventListener']('pointercancel', (event23) => {
          (event23['preventDefault'](),
            event23['stopPropagation'](),
            handler(event23['clientX'], event23['clientY']),
            handler4());
        }),
        this['canvasEl']['addEventListener']('pointerenter', (event24) => {
          ((this['_cursorHover'] = !![]), handler(event24['clientX'], event24['clientY']));
        }),
        this['canvasEl']['addEventListener']('pointerleave', () => {
          ((this['_cursorHover'] = ![]), this['_syncCursor']());
        }));
    },
    _syncPaletteActive() {
      if (!this['colorButtons']) return;
      const colorName2 = normalizeColorName(this['_view']?.['color']) || 'red',
        colorCss = getColorCss(colorName2);
      (this['colorDotEl'] &&
        ((this['colorDotEl']['style']['background'] = colorCss),
        (this['colorDotEl']['style']['borderColor'] =
          colorName2 === 'black'
            ? 'var(--white-35)'
            : colorName2 === 'white'
              ? 'var(--white-25)'
              : 'var(--black-20)')),
        this['colorButtons']['forEach']((el10) => {
          if (el10['dataset']['color'] === colorName2) el10['classList']['add']('active');
          else el10['classList']['remove']('active');
        }));
    },
    _onCanvasWheel(event25) {
      (event25['preventDefault'](), event25['stopPropagation']());
      if (!this['active']) return;
      if (!this['_cursorHover']) return;
      const value63 = this['_view']?.['tool'] || 'brush';
      if (
        value63 !== 'brush' &&
        value63 !== 'eraser' &&
        value63 !== 'bucket' &&
        value63 !== 'number-label' &&
        value63 !== 'text'
      )
        return;
      const count5 = event25['deltaY'] || 0,
        value64 = count5 < 0 ? 1 : -1,
        clampImageBrushSize4 = clampImageBrushSize(this['_view']?.['brushSizePx'], IMAGE_BRUSH_DEFAULT_SIZE_PX),
        brushSizePx3 = clampImageBrushSize(clampImageBrushSize4 + value64 * 2, IMAGE_BRUSH_DEFAULT_SIZE_PX);
      if (brushSizePx3 === clampImageBrushSize4) return;
      appStore['setAnnotateState']({ brushSizePx: brushSizePx3 });
      if (this['sizeRangeEl']) this['sizeRangeEl']['value'] = String(brushSizePx3);
      if (this['sizeValueEl']) this['sizeValueEl']['textContent'] = String(brushSizePx3);
      this['_syncCursor']();
    },
    _syncCursor(
      tool4 = this['_temporaryTool'] || this['_view']?.['tool'] || 'brush',
      sizePx = this['_view']?.['brushSizePx'] || IMAGE_BRUSH_DEFAULT_SIZE_PX,
    ) {
      if (!this['cursorEl']) return;
      if (tool4 === 'text') {
        ((this['cursorEl']['style']['display'] = 'none'),
          this['cursorEl']['classList']['remove']('is-erase-brush'),
          this['_syncTextToolCursor']());
        return;
      }
      syncCircularBrushCursor({
        cursorEl: this['cursorEl'],
        canvasEl: this['canvasEl'],
        visible: this['_cursorHover'],
        tool: tool4,
        allowedTools: ['brush', 'eraser', 'bucket', 'number-label'],
        sizePx: sizePx,
        cursorLast: this['_cursorLast'],
        isEraseBrush: this['_isGenerationScene']() || tool4 === 'eraser',
      });
    },
    _getTextScaleCursor(value65) {
      const value66 =
        document['querySelector']('#v2-wrap .group-resizer.v2-resize-move') ||
        document['querySelector']('#v2-wrap .v2-resize-move');
      if (value66) {
        const computedStyle = getComputedStyle(value66)['cursor'];
        if (computedStyle && computedStyle !== 'auto') return computedStyle;
      }
      return 'move';
    },
    _getCanvasPointerCursor() {
      return getCssVar('--pointer-cursor') || 'default';
    },
    _syncTextToolCursor() {
      if (!this['canvasEl']) return;
      const value67 = this['_getCanvasPointerCursor']();
      if (!this['_cursorHover']) {
        this['canvasEl']['style']['cursor'] = value67;
        return;
      }
      const state5 = appStore['getStateRaw'](),
        enabled7 = state5['nodes']?.[this['nodeId']];
      if (!enabled7) {
        this['canvasEl']['style']['cursor'] = value67;
        return;
      }
      const value68 = this['_getLocalFromClient'](
          this['_cursorLast']['x'],
          this['_cursorLast']['y'],
          state5,
          enabled7,
        ),
        enabled8 = this['_findTextHit'](value68, state5['viewport']);
      if (!enabled8) {
        this['canvasEl']['style']['cursor'] = value67;
        return;
      }
      if (enabled8['mode'] === 'delete' || enabled8['mode'] === 'copy') {
        this['canvasEl']['style']['cursor'] = 'var(--link-cursor)';
        return;
      }
      if (enabled8['mode'] === 'rotate') {
        this['canvasEl']['style']['cursor'] = ROTATE_CURSOR_CSS + ', ' + value67;
        return;
      }
      if (enabled8['mode'] === 'scale-uniform') {
        this['canvasEl']['style']['cursor'] = this['_getTextScaleCursor'](enabled8);
        return;
      }
      if (enabled8['mode'] === 'scale-x') {
        this['canvasEl']['style']['cursor'] = 'var(--resize-ew-cursor)';
        return;
      }
      if (enabled8['mode'] === 'scale-y') {
        this['canvasEl']['style']['cursor'] = 'var(--resize-ns-cursor)';
        return;
      }
      this['canvasEl']['style']['cursor'] = value67;
    },
    _updateToolActive(
      value69 = this['_view']?.['tool'] || 'brush',
      value70 = this['_view']?.['brushSizePx'] || IMAGE_BRUSH_DEFAULT_SIZE_PX,
    ) {
      (this['toolButtons']['forEach']((el11) => {
        if (el11['dataset']['tool'] === value69) el11['classList']['add']('active');
        else el11['classList']['remove']('active');
      }),
        this['_syncCursor'](value69, value70));
    },
    _setTool(value71) {
      if (value71 !== 'text') this['_removeTextInput'](!![]);
      if (value71 !== 'text') this['_selectedTextCommandIndex'] = null;
      const list2 = getAnnotateToolbarToolsForScene(this['_mode']?.['scene'] || 'annotate'),
        tool5 = list2['includes'](value71) ? value71 : 'brush';
      (appStore['setAnnotateState']({ tool: tool5 }), this['_persistLocalEditState']());
    },
    _removeTextInput(enabled9 = !![], value72 = null) {
      const el12 = value72 || this['_textInputEl'];
      if (!el12) return;
      const enabled10 = this['_textInputEl'] === el12,
        text = String(el12['value'] || '')['trim'](),
        x5 = Number(el12['dataset']['localX']),
        y3 = Number(el12['dataset']['localY']),
        sizeWorld2 = Number(el12['dataset']['sizeWorld']),
        color3 = String(el12['dataset']['color'] || '');
      el12['parentElement'] && el12['parentElement']['removeChild'](el12);
      enabled10 && (this['_textInputEl'] = null);
      if (!enabled10) return;
      if (
        !enabled9 ||
        !text ||
        !Number['isFinite'](x5) ||
        !Number['isFinite'](y3) ||
        !Number['isFinite'](sizeWorld2)
      )
        return;
      (this['_commands']['push']({
        type: 'text',
        text: text['slice'](0, 200),
        color: color3 || getColorCanvas('red'),
        sizeWorld: sizeWorld2,
        x: x5,
        y: y3,
        scale: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
      }),
        (this['_selectedTextCommandIndex'] = this['_commands']['length'] - 1),
        (this['_redoStack'] = []),
        (this['_dirty'] = !![]),
        this['_persistLocalEditState'](),
        this['_render']());
    },
    _openTextInput(box16, value73, value74, value75, value76) {
      this['_removeTextInput'](!![]);
      const el13 = document['createElement']('input');
      ((el13['type'] = 'text'),
        (el13['maxLength'] = 200),
        (el13['className'] = 'v2-annotate-text-input'),
        (el13['dataset']['localX'] = String(box16['x'])),
        (el13['dataset']['localY'] = String(box16['y'])),
        (el13['dataset']['sizeWorld'] = String(value74)),
        (el13['dataset']['color'] = getColorCanvas(value73['annotate']?.['color'] || 'red')),
        (el13['style']['left'] = value75 + 'px'),
        (el13['style']['top'] = value76 + 'px'),
        el13['style']['setProperty'](
          '--annotate-text-input-size',
          clampImageBrushSize(value73['annotate']?.['brushSizePx'], IMAGE_BRUSH_DEFAULT_SIZE_PX) + 'px',
        ),
        el13['style']['setProperty'](
          '--annotate-text-input-color',
          el13['dataset']['color'] || getColorCanvas('red'),
        ));
      let value77 = ![];
      const run2 = (value78) => {
        if (value77) return;
        ((value77 = !![]), this['_removeTextInput'](value78, el13));
      };
      (el13['addEventListener']('pointerdown', (event26) => event26['stopPropagation']()),
        el13['addEventListener']('keydown', (event27) => {
          if (event27['key'] === 'Enter' && !event27['isComposing'])
            (event27['preventDefault'](), run2(!![]));
          else event27['key'] === 'Escape' && (event27['preventDefault'](), run2(![]));
        }),
        el13['addEventListener']('blur', () => run2(!![])),
        this['overlayEl']?.['appendChild'](el13),
        (this['_textInputEl'] = el13),
        requestAnimationFrame(() => {
          if (this['_textInputEl'] === el13) el13['focus']();
        }));
    },
    _getTextLayout(cmd, viewport2) {
      return getTextLayout({ canvasEl: this['canvasEl'], cmd: cmd, viewport: viewport2 });
    },
    _getTextGeometry(cmd2, viewport3) {
      return getTextGeometry({ canvasEl: this['canvasEl'], cmd: cmd2, viewport: viewport3 });
    },
    _toTextLocalTransformSpace(value79, value80, value81) {
      return toTextLocalTransformSpace(value79, value80, value81);
    },
    _rotateTextLocalPoint(value82, value83) {
      return rotateTextLocalPoint(value82, value83);
    },
    _resolveAxisTextScale(value84, value85) {
      return resolveAxisTextScale(value84, value85);
    },
    _deleteTextCommand(value86) {
      const value87 = Number(value86);
      if (!Number['isInteger'](value87) || this['_commands'][value87]?.['type'] !== 'text') return ![];
      return (
        this['_commands']['splice'](value87, 1),
        (this['_selectedTextCommandIndex'] = null),
        (this['_redoStack'] = []),
        (this['_dirty'] = !![]),
        this['_persistLocalEditState'](),
        this['_render'](),
        !![]
      );
    },
    _copyTextCommand(value88, value89 = this['_view']?.['viewport']) {
      const value90 = Number(value88),
        value91 = this['_commands'][value90];
      if (!Number['isInteger'](value90) || value91?.['type'] !== 'text') return ![];
      const copiedTextCommand = buildCopiedTextCommand(value91, value89);
      return (
        this['_commands']['splice'](value90 + 1, 0, copiedTextCommand),
        (this['_selectedTextCommandIndex'] = value90 + 1),
        (this['_redoStack'] = []),
        (this['_dirty'] = !![]),
        this['_persistLocalEditState'](),
        this['_render'](),
        !![]
      );
    },
    deleteSelectedTextCommand() {
      const value92 = Number(this['_selectedTextCommandIndex']);
      if (!Number['isInteger'](value92)) return ![];
      return this['_deleteTextCommand'](value92);
    },
    _findTextHit(local, viewport4) {
      return findTextHit({
        commands: this['_commands'],
        selectedTextCommandIndex: this['_selectedTextCommandIndex'],
        local: local,
        viewport: viewport4,
        canvasEl: this['canvasEl'],
      });
    },
    _createTextTransformState(hit, local2, viewport5) {
      return createTextTransformState({
        commands: this['_commands'],
        hit: hit,
        local: local2,
        viewport: viewport5,
        canvasEl: this['canvasEl'],
      });
    },
    _normalizeSelectedTextCommand() {
      const count6 = Number(this['_selectedTextCommandIndex']);
      if (!Number['isInteger'](count6) || count6 < 0 || count6 >= this['_commands']['length']) {
        this['_selectedTextCommandIndex'] = null;
        return;
      }
      this['_commands'][count6]?.['type'] !== 'text' && (this['_selectedTextCommandIndex'] = null);
    },
    _updateView(value93) {
      if (!this['active']) return;
      const enabled11 = value93?.['node'],
        value94 = value93?.['viewport'];
      if (!enabled11) return;
      this['nodeData'] = enabled11;
      const clampImageBrushSize5 = clampImageBrushSize(value93?.['brushSizePx'], IMAGE_BRUSH_DEFAULT_SIZE_PX);
      if (this['sizeRangeEl'] && Number(this['sizeRangeEl']['value']) !== clampImageBrushSize5)
        this['sizeRangeEl']['value'] = String(clampImageBrushSize5);
      if (this['sizeValueEl'] && this['sizeValueEl']['textContent'] !== String(clampImageBrushSize5))
        this['sizeValueEl']['textContent'] = String(clampImageBrushSize5);
      (this['_updateToolActive'](value93?.['tool'], clampImageBrushSize5),
        this['_syncPaletteActive'](value93?.['color']));
      const center = positionCanvasEditorSurface(this['containerEl'], enabled11, value94),
        value95 = center['width'],
        value96 = center['height'],
        value97 = window['devicePixelRatio'] || 1,
        value98 = Math['max'](1, value95),
        value99 = Math['max'](1, value96);
      if (
        this['canvasEl']['width'] !== Math['round'](value98 * value97) ||
        this['canvasEl']['height'] !== Math['round'](value99 * value97)
      ) {
        ((this['canvasEl']['width'] = Math['round'](value98 * value97)),
          (this['canvasEl']['height'] = Math['round'](value99 * value97)),
          (this['canvasEl']['style']['width'] = value98 + 'px'),
          (this['canvasEl']['style']['height'] = value99 + 'px'));
        const value100 = this['canvasEl']['getContext']('2d');
        (value100['setTransform'](value97, 0, 0, value97, 0, 0),
          (value100['lineCap'] = 'round'),
          (value100['lineJoin'] = 'round'));
      }
      if (!this['_isAnnotateScene']()) {
        const value101 = Math['max'](12, Math['round'](center['y']) - 54);
        ((this['toolbarEl']['style']['left'] = Math['round'](center['x'] + value95 / 2) + 'px'),
          (this['toolbarEl']['style']['top'] = value101 + 'px'));
      }
      (this['generationToolbarEl'] &&
        positionCanvasEditorToolbar(this['generationToolbarEl'], {
          center: center['x'] + value95 / 2,
          top: center['y'] + value96 + 14,
        }),
        this['_applyStageFlip'](this['_getCurrentFlipState']()),
        this['_render'](value94));
    },
    _render(value102 = this['_view']?.['viewport']) {
      if (!this['active'] || !this['canvasEl']) return;
      this['_applyStageFlip'](this['_getCurrentFlipState']());
      const ctx = this['canvasEl']['getContext']('2d'),
        value103 = Number(this['canvasEl']['style']['width']['replace']('px', '')) || 1,
        value104 = Number(this['canvasEl']['style']['height']['replace']('px', '')) || 1;
      ctx['clearRect'](0, 0, value103, value104);
      const toImageLocalRenderViewport2 = toImageLocalRenderViewport(value102);
      if (this['_isGenerationScene']()) {
        this['_renderEraseSceneCommands'](ctx, toImageLocalRenderViewport2, this['_commands'], this['_draft']);
        return;
      }
      this['_renderCommands'](ctx, toImageLocalRenderViewport2, this['_commands']);
      if (this['_draft']) this['_renderCommands'](ctx, toImageLocalRenderViewport2, [this['_draft']], !![]);
    },
    _renderEraseSceneCommands(ctx2, viewport6, commands = [], draft = null) {
      this['_eraseMaskCanvasEl'] = renderEraseSceneCommands({
        documentRef: document,
        canvasEl: this['canvasEl'],
        ctx: ctx2,
        viewport: viewport6,
        commands: commands,
        draft: draft,
        checkerPattern: this['_checkerPattern'],
        eraseMaskCanvasEl: this['_eraseMaskCanvasEl'],
      });
    },
    _renderCommands(ctx3, viewport7, commands2, isDraft = ![]) {
      renderCommands({
        ctx: ctx3,
        viewport: viewport7,
        canvasEl: this['canvasEl'],
        commands: commands2,
        isDraft: isDraft,
        isEraseScene: this['_isEraseScene'](),
        checkerPattern: this['_checkerPattern'],
        defaultTextColor: getColorCanvas('red'),
        getTextGeometry: (value105, value106) => this['_getTextGeometry'](value105, value106),
        selectedTextCommandIndex: this['_selectedTextCommandIndex'],
        selectedCommandsRef: this['_commands'],
        resolveCssVar: getCssVar,
        fillRegionCache: this['_fillRegionCache'],
        numberLabelBackgroundColor: getCssVar('--canvas-white'),
      });
    },
    _addNumberLabel(box17, sizeWorld3) {
      if (!this['active'] || !this['_isAnnotateScene']()) return null;
      const value107 = appStore['getStateRaw'](),
        x6 = Number(box17?.['x']),
        y4 = Number(box17?.['y']);
      if (!Number['isFinite'](x6) || !Number['isFinite'](y4)) return null;
      const value108 = {
        type: 'number-label',
        number: getNextNumberLabelValue(this['_commands']),
        x: x6,
        y: y4,
        color: getColorCanvas(value107['annotate']?.['color'] || 'red'),
        sizeWorld: sizeWorld3,
      };
      return (
        this['_commands']['push'](value108),
        (this['_redoStack'] = []),
        (this['_dirty'] = !![]),
        this['_persistLocalEditState'](),
        this['_render'](),
        value108
      );
    },
    _fillArea(box18, value109) {
      const value110 = appStore['getStateRaw'](),
        value111 = {
          type: 'fill',
          x: Number(box18?.['x']) || 0,
          y: Number(box18?.['y']) || 0,
          color: getColorCanvas(value110['annotate']?.['color'] || 'red'),
        };
      (this['_commands']['push'](value111),
        (this['_redoStack'] = []),
        (this['_dirty'] = !![]),
        this['_persistLocalEditState'](),
        this['_render']());
    },
    _pushFlipCommand(type) {
      if (!this['active'] || !this['_isAnnotateScene']()) return;
      if (type !== 'flip-horizontal' && type !== 'flip-vertical') return;
      (this['_removeTextInput'](!![]),
        this['_commands']['push']({ type: type }),
        (this['_redoStack'] = []),
        (this['_dirty'] = !![]),
        this['_normalizeSelectedTextCommand'](),
        this['_render']());
    },
    _flipHorizontal() {
      this['_pushFlipCommand']('flip-horizontal');
    },
    _flipVertical() {
      this['_pushFlipCommand']('flip-vertical');
    },
    _undo() {
      if (this['_commands']['length'] === 0) return;
      const value112 = this['_commands']['pop']();
      (this['_redoStack']['push'](value112),
        (this['_dirty'] = !![]),
        this['_normalizeSelectedTextCommand'](),
        this['_persistLocalEditState'](),
        this['_render']());
    },
    _redo() {
      if (this['_redoStack']['length'] === 0) return;
      const value113 = this['_redoStack']['pop']();
      (this['_commands']['push'](value113),
        (this['_dirty'] = !![]),
        this['_normalizeSelectedTextCommand'](),
        this['_persistLocalEditState'](),
        this['_render']());
    },
    _clear() {
      if (this['_commands']['length'] === 0 && this['_redoStack']['length'] === 0) return;
      ((this['_commands'] = []),
        (this['_redoStack'] = []),
        (this['_draft'] = null),
        (this['_selectedTextCommandIndex'] = null),
        (this['_dirty'] = !![]),
        this['_persistLocalEditState'](),
        this['_render']());
    },
    _applyBaseSurface() {
      if (!this['stageEl'] || !this['imgEl']) return;
      const value114 = Boolean(this['_useWhiteboardBase']);
      (this['stageEl']['classList']['toggle']('is-whiteboard', value114),
        this['overlayEl']?.['classList']['toggle']('is-whiteboard', value114),
        this['imgEl']['setAttribute']('aria-hidden', value114 ? 'true' : 'false'));
    },
    _createNewWhiteboard() {
      if (!this['active'] || this['_isGenerationScene']()) return;
      (this['_removeTextInput'](![]),
        (this['_commands'] = []),
        (this['_redoStack'] = []),
        (this['_draft'] = null),
        (this['_selectedTextCommandIndex'] = null),
        (this['_useWhiteboardBase'] = !![]),
        (this['_dirty'] = !![]),
        appStore['setAnnotateState']({ color: 'black' }),
        this['_applyBaseSurface'](),
        this['_render'](),
        window['showToast']?.(imageAnnotateText('toasts.newBoard'), 'ok'));
    },
    _persistLocalEditState() {
      persistLocalEditState(this);
    },
    _buildSelectionMaskCanvas(naturalW, naturalH, scaleX2, scaleY2, commands3 = this['_commands']) {
      return buildSelectionMaskCanvas({
        documentRef: document,
        commands: commands3,
        naturalW: naturalW,
        naturalH: naturalH,
        scaleX: scaleX2,
        scaleY: scaleY2,
      });
    },
    async _buildGenerationPayload(node2, imgUrl) {
      const imageFunctionRequestSettings = getImageFunctionRequestSettings(this['_functionSelection']),
        commands4 = structuredClone(this['_commands']),
        generationPayload = await buildGenerationPayload({
          scene: this['_mode']?.['scene'],
          commands: commands4,
          promptText: this['promptText'],
          node: node2,
          imgUrl: imgUrl,
          model: this['model'],
          provider: this['provider'],
          imageSize: this['imageSize'],
          erasePrompt: ERASE_GENERATE_PROMPT,
          loadImage: (value115) => this['_loadImage'](value115),
          createSelectionMaskCanvas: (value116, value117, value118, value119) =>
            this['_buildSelectionMaskCanvas'](value116, value117, value118, value119, commands4),
          getModelProvider: getModelProvider,
          notify: (value120, value121) => window['showToast']?.(value120, value121),
          documentRef: document,
          urlApi: URL,
        });
      if (generationPayload?.['payload']) Object['assign'](generationPayload['payload'], imageFunctionRequestSettings);
      return generationPayload;
    },
    async _handleDebugRequest() {
      if (!this['active'] || !this['_isGenerationScene']()) return;
      const state6 = appStore['getState'](),
        enabled12 = state6['nodes']?.[this['nodeId']];
      if (!enabled12) return;
      const enabled13 = this['_resolveNodeImageUrl'](enabled12);
      if (!enabled13) return;
      let value122 = '';
      try {
        const enabled14 = await this['_buildGenerationPayload'](enabled12, enabled13);
        if (!enabled14?.['payload']) return;
        value122 = enabled14['inputUrl'] || '';
        const generateImageRequest = await buildGenerateImageRequest(enabled14['payload']),
          finalApiDebugPreview = buildFinalApiDebugPreview(generateImageRequest);
        (openDebugRequestWindow(finalApiDebugPreview), window['showToast']?.(imageAnnotateText('debug.shown'), 'warn'));
      } catch (error) {
        window['showToast']?.(
          imageAnnotateText('debug.buildRequestFailed', { error: error['message'] }),
          'error',
        );
      } finally {
        if (value122) URL['revokeObjectURL'](value122);
      }
    },
    async _save() {
      if (!this['active']) return;
      this['_removeTextInput'](!![]);
      const state7 = appStore['getState'](),
        baseNode = state7['nodes'][this['nodeId']];
      if (!baseNode) return;
      const enabled15 = this['_isGenerationScene'](),
        rotationDegrees = this['_isAnnotateScene']() ? getEditorRotation(this) : 0,
        keepRatio = this['_isAnnotateScene']() && getKeepImageRatio(this['_commands']),
        imgUrl2 = this['_resolveNodeImageUrl'](baseNode, { preferPreview: !enabled15 && !rotationDegrees });
      if (!imgUrl2) return;
      if (enabled15) return submitLocalEdit(this, baseNode, imgUrl2);
      const el14 =
          this['generationToolbarEl']?.['querySelector']('.go') ||
          this['toolbarEl']['querySelector']('.act-save'),
        el15 = el14?.['querySelector']('span') || null,
        value123 = el15 ? el15['textContent'] : '';
      el15 &&
        (el15['textContent'] =
          this['_mode']?.['submitBusyLabel'] || imageAnnotateText('actions.saving'));
      if (!el14) return;
      el14['style']['pointerEvents'] = 'none';
      let targetNodeId = '',
        startedAt = 0;
      try {
        const isEraseScene = this['_isEraseScene'](),
          useWhiteboardBase = !isEraseScene && this['_useWhiteboardBase'],
          scene2 = this['_mode']?.['scene'],
          sourceNodeId = this['nodeId'],
          commands5 = Array['isArray'](this['_commands'])
            ? this['_commands']['map']((args2) =>
                args2 && typeof args2 === 'object' ? { ...args2 } : args2,
              )
            : [],
          imgEl = this['imgEl'],
          value124 = this['_getCurrentFlipState'](),
          canvasWhiteColor = getCssVar('--canvas-white'),
          defaultTextColor = getColorCanvas('red'),
          startedAt2 = Date['now'](),
          outputSize = getImageRotationLayout(baseNode['width'], baseNode['height'], rotationDegrees, keepRatio),
          targetNodeId2 = createPendingAnnotateExportNode({
            scene: scene2,
            sourceNodeId: sourceNodeId,
            baseNode: baseNode,
            startedAt: startedAt2,
            outputSize: outputSize,
          });
        ((targetNodeId = targetNodeId2['newNodeId']), (startedAt = startedAt2), this['exit']({ silent: !![] }));
        const {
          blob: blob,
          exportType: exportType,
          naturalWidth: naturalWidth,
          naturalHeight: naturalHeight,
        } = await exportAnnotateCanvasBlob({
          documentRef: document,
          node: baseNode,
          imgEl: imgEl,
          imgUrl: imgUrl2,
          commands: commands5,
          rotationDegrees: rotationDegrees,
          keepRatio: keepRatio,
          useWhiteboardBase: useWhiteboardBase,
          isEraseScene: isEraseScene,
          loadImage: (value125) => this['_loadImage'](value125),
          getCurrentFlipState: () => value124,
          applyFlipTransformToContext: (value126, value127, value128, value129) =>
            this['_applyFlipTransformToContext'](value126, value127, value128, value129),
          createSelectionMaskCanvas: (naturalW2, naturalH2, scaleX3, scaleY3) =>
            buildSelectionMaskCanvas({
              documentRef: document,
              commands: commands5,
              naturalW: naturalW2,
              naturalH: naturalH2,
              scaleX: scaleX3,
              scaleY: scaleY3,
            }),
          canvasWhiteColor: canvasWhiteColor,
          defaultTextColor: defaultTextColor,
          fastDisplayExport: !rotationDegrees,
        });
        await saveAnnotateExportResult({
          blob: blob,
          exportType: exportType,
          scene: scene2,
          sourceNodeId: sourceNodeId,
          baseNode: baseNode,
          targetNodeId: targetNodeId2['newNodeId'],
          outputSize: outputSize,
          naturalWidth: naturalWidth,
          naturalHeight: naturalHeight,
          startedAt: startedAt2,
          notify: (value130, value131) => window['showToast']?.(value130, value131),
          triggerLocalCacheSave: () => window['_triggerLocalCacheSave']?.(),
        });
      } catch (error2) {
        (console['error']('[Annotate] save failed:', error2),
          markAnnotateExportNodeFailed({ targetNodeId: targetNodeId, error: error2, startedAt: startedAt }),
          window['showToast']?.(imageAnnotateText('toasts.saveFailed'), 'error'));
      } finally {
        if (el15) el15['textContent'] = value123;
        el14['style']['pointerEvents'] = 'auto';
      }
    },
    _resolveNodeImageUrl(value132, value133 = {}) {
      return resolveImageNodeUrl(value132, value133);
    },
    _loadImage(value134) {
      return new Promise((handler5, handler6) => {
        const image = new Image();
        ((image['crossOrigin'] = 'anonymous'),
          (image['onload'] = () => handler5(image)),
          (image['onerror'] = () => handler6(new Error(imageAnnotateText('errors.imageLoadFailed')))),
          (image['src'] = value134));
      });
    },
  };
export default ImageAnnotateController;

import appStore from '../core/stores/appStore.js';
import { bindImageOverlayViewportPreview } from './imageOverlayViewportPreview.js';
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
import { waitForImageElementReady } from './imageOverlayReadiness.js';
const getCssVar = (value) =>
    getComputedStyle(document['documentElement'])['getPropertyValue'](value)['trim'](),
  DEFAULT_MATTING_BRUSH_SIZE_PX = 0x28,
  MAX_MATTING_BRUSH_SIZE_PX = IMAGE_BRUSH_MAX_SIZE_PX,
  OPAQUE_MASK_PREVIEW_CLEAR = 'black';
function imageMattingText(item, key = {}) {
  return t('imageMatting.' + item, key);
}
function clampMattingBrushSize(index, result = DEFAULT_MATTING_BRUSH_SIZE_PX) {
  return clampImageBrushSize(index, result);
}
const isFiniteCommandPoint = (box) =>
    Number['isFinite'](Number(box?.['x'])) && Number['isFinite'](Number(box?.['y'])),
  hasDrawableStrokePoints = (data) =>
    Array['isArray'](data?.['points']) && data['points']['some'](isFiniteCommandPoint),
  shouldDiscardStrokeCommand = (options) =>
    (options?.['type'] === 'brush' || options?.['type'] === 'eraser') &&
    !hasDrawableStrokePoints(options),
  MATTING_TOOLBAR_HTML =
    '\n      <button class="v2-matting-btn icon-only act-cancel" data-matting-tooltip="cancel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 6L6 18M6 6l12 12"/></svg></button>\n      <div class="v2-matting-divider"></div>\n      <button class="v2-matting-btn icon-only tool-btn active" data-tool="brush" data-brush-mode="normal" data-matting-tooltip="brush">\n        <svg class="brush-icon-normal" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>\n        <svg class="brush-icon-alpha" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" style="display:none"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/><path d="M3 3h6v6H3z" fill="currentColor" fill-opacity="0.3"/></svg>\n      </button>\n      <button class="v2-matting-btn icon-only tool-btn" data-tool="eraser" data-matting-tooltip="eraser"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M20 20H7l-5-5a2 2 0 0 1 0-2.83l9.17-9.17a2 2 0 0 1 2.83 0L22 10a2 2 0 0 1 0 2.83L14.83 20"/></svg></button>\n      <button class="v2-matting-btn icon-only tool-btn" data-tool="bucket" data-matting-tooltip="bucket"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 11l-8-8-8.5 8.5a2.12 2.12 0 0 0 0 3l4 4a2.12 2.12 0 0 0 3 0L19 11z"/><path d="M16 14l-3.5 3.5"/><path d="M12 18l-2 2"/><path d="M20 20l-2-2"/></svg></button>\n      <div class="v2-matting-divider"></div>\n      <div class="v2-matting-size"><span class="v2-matting-size-value"></span><input class="v2-matting-size-range" type="range" min="1" max="' +
    MAX_MATTING_BRUSH_SIZE_PX +
    '" step="1"></div>\n      <div class="v2-matting-divider"></div>\n      <button class="v2-matting-btn icon-only act-undo" data-matting-tooltip="undo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M9 14l-4-4 4-4"/><path d="M5 10h9a6 6 0 1 1 0 12h-3"/></svg></button>\n      <button class="v2-matting-btn icon-only act-redo" data-matting-tooltip="redo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M15 14l4-4-4-4"/><path d="M19 10H10a6 6 0 1 0 0 12h3"/></svg></button>\n      <button class="v2-matting-btn icon-only act-clear" data-matting-tooltip="clear"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 16h10l1-16"/></svg></button>\n      <button class="v2-matting-btn v2-matting-save act-save"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v4h8"/></svg><span class="v2-matting-save-label"></span></button>\n    ',
  ImageMattingController = {
    active: ![],
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
    _cursorHover: ![],
    _cursorLast: { x: 0x0, y: 0x0 },
    _cursorRaf: 0x0,
    _unsubscribe: null,
    _commands: [],
    _redoStack: [],
    _draft: null,
    _dirty: ![],
    _baseMaskCleared: ![],
    _view: null,
    _normalMaskCanvas: null,
    _normalOverlayCanvas: null,
    _alphaMaskCanvas: null,
    _alphaOverlayCanvas: null,
    _fillRegionCache: null,
    _unsubscribeLocale: null,
    _isSaving: ![],
    init(nodeId) {
      if (this['active']) return;
      const viewport = appStore['getStateRaw'](),
        node = viewport['nodes']?.[nodeId];
      if (!node) return;
      const enabled = this['_resolveNodeImageUrl'](node);
      if (!enabled) {
        window['showToast']?.(imageMattingText('toasts.noImage'), 'warn');
        return;
      }
      const map = new Set(['brush', 'eraser', 'bucket']),
        tool = map['has'](viewport['matting']?.['tool']) ? viewport['matting']['tool'] : 'brush',
        brushSizePx = clampMattingBrushSize(viewport['matting']?.['brushSizePx']),
        brushMode = viewport['matting']?.['brushMode'] || 'normal';
      ((this['active'] = !![]),
        (this['nodeId'] = nodeId),
        (this['nodeData'] = node),
        (this['_commands'] = []),
        (this['_redoStack'] = []),
        (this['_draft'] = null),
        (this['_dirty'] = ![]),
        (this['_baseMaskCleared'] = ![]),
        (this['_fillRegionCache'] = new Map()),
        (this['_isSaving'] = ![]),
        (this['_view'] = {
          tool: tool,
          brushSizePx: brushSizePx,
          brushMode: brushMode,
          viewport: viewport['viewport'],
          node: node,
        }),
        appStore['setMattingState']({
          active: !![],
          nodeId: nodeId,
          tool: tool,
          brushSizePx: brushSizePx,
          brushMode: brushMode,
        }),
        this['_createUI'](enabled, { tool: tool, brushSizePx: brushSizePx, brushMode: brushMode }),
        this['_loadExistingMask'](),
        this['_bindEvents'](),
        (this['_unsubscribe'] = appStore['subscribeSelector'](
          (state) => {
            const nx = state['nodes']?.[nodeId],
              vx = state['viewport'] || { x: 0x0, y: 0x0, zoom: 0x1 },
              tool2 = state['matting'] || {};
            return {
              hasNode: !!nx,
              nx: nx ? nx['x'] : 0x0,
              ny: nx ? nx['y'] : 0x0,
              nw: nx ? nx['width'] : 0x0,
              nh: nx ? nx['height'] : 0x0,
              vx: vx['x'],
              vy: vx['y'],
              vz: vx['zoom'] || 0x1,
              vox: vx['_screenOriginX'] || 0x0,
              voy: vx['_screenOriginY'] || 0x0,
              tool: tool2['tool'] || 'brush',
              brushSizePx: clampMattingBrushSize(tool2['brushSizePx']),
              brushMode: tool2['brushMode'] || 'normal',
            };
          },
          (tool3) => {
            if (!tool3?.['hasNode']) return;
            ((this['_view'] = {
              tool: tool3['tool'],
              brushSizePx: tool3['brushSizePx'],
              brushMode: tool3['brushMode'],
              viewport: {
                x: tool3['vx'],
                y: tool3['vy'],
                zoom: tool3['vz'],
                _screenOriginX: tool3['vox'],
                _screenOriginY: tool3['voy'],
              },
              node: {
                x: tool3['nx'],
                y: tool3['ny'],
                width: tool3['nw'],
                height: tool3['nh'],
              },
            }),
              this['_updateView'](this['_view']));
          },
        )),
        (this['_unsubscribeViewportPreview'] = bindImageOverlayViewportPreview({
          getView: () => this['_view'],
          updateView: (target) => {
            ((this['_view'] = target), this['_updateView'](target));
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
            (window['showToast']?.(imageMattingText('errors.imageLoadFailed'), 'error'),
              this['exit']({ silent: !![] }));
          },
        })));
    },
    exit({ silent: silent = ![] } = {}) {
      if (!this['active']) return;
      (this['_unsubscribeViewportPreview']?.(),
        (this['_unsubscribeViewportPreview'] = null),
        this['_cancelImageReadyWait']?.(),
        (this['_cancelImageReadyWait'] = null));
      !silent && this['_dirty'] && window['showToast']?.(imageMattingText('toasts.cancelled'), 'ok');
      ((this['active'] = ![]),
        (this['nodeId'] = null),
        (this['nodeData'] = null),
        (this['_commands'] = []),
        (this['_redoStack'] = []),
        (this['_draft'] = null),
        (this['_dirty'] = ![]),
        (this['_normalMaskCanvas'] = null),
        (this['_normalOverlayCanvas'] = null),
        (this['_alphaMaskCanvas'] = null),
        (this['_alphaOverlayCanvas'] = null),
        this['_unsubscribeLocale']?.(),
        (this['_unsubscribeLocale'] = null),
        (this['_isSaving'] = ![]),
        (this['_fillRegionCache'] = null),
        appStore['setMattingState']({ active: ![], nodeId: null }));
      this['_unsubscribe'] && (this['_unsubscribe'](), (this['_unsubscribe'] = null));
      if (this['overlayEl']) this['overlayEl']['remove']();
      if (this['toolbarEl']) this['toolbarEl']['remove']();
      ((this['overlayEl'] = null),
        (this['containerEl'] = null),
        (this['imgEl'] = null),
        (this['canvasEl'] = null),
        (this['toolbarEl'] = null),
        (this['sizeValueEl'] = null),
        (this['sizeRangeEl'] = null),
        (this['toolButtons'] = null),
        (this['cursorEl'] = null),
        (this['_cursorHover'] = ![]),
        (this['_cursorLast'] = { x: 0x0, y: 0x0 }),
        (this['_cursorRaf'] = 0x0),
        (this['_view'] = null));
    },
    _createUI(source, next = {}) {
      const el = document['createElement']('div');
      el['className'] = 'v2-matting-overlay';
      const el2 = document['createElement']('div');
      el2['className'] = 'v2-matting-container';
      const current = document['createElement']('img');
      ((current['className'] = 'v2-matting-img'),
        (current['src'] = source),
        (current['draggable'] = ![]));
      const entry = document['createElement']('canvas');
      entry['className'] = 'v2-matting-canvas';
      const el3 = document['createElement']('div');
      ((el3['className'] = 'v2-matting-cursor'),
        (el3['style']['display'] = 'none'),
        el2['appendChild'](current),
        el2['appendChild'](entry),
        el['appendChild'](el3),
        el['appendChild'](el2),
        document['body']['appendChild'](el),
        (this['overlayEl'] = el),
        (this['containerEl'] = el2),
        (this['imgEl'] = current),
        (this['canvasEl'] = entry),
        (this['cursorEl'] = el3));
      const el4 = document['createElement']('div');
      ((el4['className'] = 'v2-matting-toolbar'),
        (el4['innerHTML'] = MATTING_TOOLBAR_HTML),
        document['body']['appendChild'](el4),
        (this['toolbarEl'] = el4),
        (this['sizeValueEl'] = el4['querySelector']('.v2-matting-size-value')),
        (this['sizeRangeEl'] = el4['querySelector']('.v2-matting-size-range')),
        (this['toolButtons'] = Array['from'](el4['querySelectorAll']('.tool-btn'))),
        this['_subscribeLocaleChanges'](),
        this['_syncLocaleTexts']());
      const clampMattingBrushSize2 = clampMattingBrushSize(next['brushSizePx']),
        record = next['tool'] || 'brush';
      ((this['sizeRangeEl']['value'] = String(clampMattingBrushSize2)),
        (this['sizeValueEl']['textContent'] = String(clampMattingBrushSize2)),
        this['_updateToolActive'](record, clampMattingBrushSize2));
      if (this['_view']) this['_updateView'](this['_view']);
    },
    _bindEvents() {
      const payload = (event) => {
        const handle =
          this['canvasEl'] &&
          (event['target'] === this['canvasEl'] || this['canvasEl']['contains'](event['target']));
        if (handle) {
          this['_onCanvasWheel'](event);
          return;
        }
        (event['preventDefault'](), event['stopPropagation']());
      };
      this['overlayEl']['addEventListener']('wheel', payload, { passive: ![] });
      const config = () => {
        if (this['_view']) this['_updateView'](this['_view']);
      };
      window['addEventListener']('resize', config);
      const run = () => {
          (window['removeEventListener']('resize', config),
            this['overlayEl']?.['removeEventListener']('wheel', payload));
        },
        handler = this['exit']['bind'](this);
      ((this['exit'] = (options2 = {}) => {
        (run(), handler(options2));
      }),
        this['toolbarEl']['addEventListener']('pointerdown', (event2) => event2['stopPropagation']()),
        this['toolbarEl']['querySelector']('.act-cancel')['addEventListener']('click', (event3) => {
          (event3['stopPropagation'](), this['exit']());
        }),
        this['toolButtons']['forEach']((el5) => {
          el5['addEventListener']('click', (event4) => {
            event4['stopPropagation']();
            const scope = el5['dataset']['tool'];
            this['_switchTool'](scope);
          });
        }),
        this['sizeRangeEl']['addEventListener']('input', (event5) => {
          const brushSizePx2 = clampMattingBrushSize(event5['target']['value'], 0x1);
          (appStore['setMattingState']({ brushSizePx: brushSizePx2 }),
            (this['sizeValueEl']['textContent'] = String(brushSizePx2)),
            this['_syncCursor']());
        }),
        this['toolbarEl']['querySelector']('.act-undo')['addEventListener']('click', (event6) => {
          (event6['stopPropagation'](), this['_undo']());
        }),
        this['toolbarEl']['querySelector']('.act-redo')['addEventListener']('click', (event7) => {
          (event7['stopPropagation'](), this['_redo']());
        }),
        this['toolbarEl']['querySelector']('.act-clear')['addEventListener']('click', (event8) => {
          (event8['stopPropagation'](), this['_clear']());
        }),
        this['toolbarEl']['querySelector']('.act-save')['addEventListener']('click', async (event9) => {
          (event9['stopPropagation'](), await this['_save']());
        }));
      const input = this['canvasEl']['getContext']('2d');
      ((input['lineCap'] = 'round'), (input['lineJoin'] = 'round'));
      const event10 = { down: ![], pointerId: null },
        handler2 = (x2, y2) => {
          this['_cursorLast'] = { x: x2, y: y2 };
          if (this['_cursorRaf']) return;
          this['_cursorRaf'] = requestAnimationFrame(() => {
            ((this['_cursorRaf'] = 0x0), this['_syncCursor']());
          });
        },
        handler3 = (output, value2, value3, value4 = 0x0) => {
          const state2 = appStore['getStateRaw'](),
            box2 = state2['nodes']?.[this['nodeId']];
          if (!box2) return ![];
          const x3 = screenToWorld(output, value2, state2['viewport']);
          if (
            !isPointInRect(
              x3['x'],
              x3['y'],
              box2['x'],
              box2['y'],
              box2['width'],
              box2['height'],
            )
          )
            return ![];
          const value5 = { x: x3['x'] - box2['x'], y: x3['y'] - box2['y'] },
            value6 = state2['matting']?.['tool'] || 'brush';
          if (value6 === 'bucket') {
            const clampMattingBrushSize3 = clampMattingBrushSize(state2['matting']?.['brushSizePx']),
              value7 = clampMattingBrushSize3 / (state2['viewport']['zoom'] || 0x1);
            return (this['_fillArea'](value5, value7), !![]);
          }
          const clampMattingBrushSize4 = clampMattingBrushSize(state2['matting']?.['brushSizePx']),
            sizeWorld = clampMattingBrushSize4 / (state2['viewport']['zoom'] || 0x1),
            mode = state2['matting']?.['brushMode'] || 'normal';
          return (
            value6 === 'eraser'
              ? (this['_draft'] = { type: 'eraser', sizeWorld: sizeWorld, points: [value5] })
              : (this['_draft'] = {
                  type: 'brush',
                  sizeWorld: sizeWorld,
                  points: [value5],
                  mode: mode,
                }),
            (event10['down'] = !![]),
            (event10['pointerId'] = value3),
            this['canvasEl']['setPointerCapture'](value3),
            this['_render'](),
            !![]
          );
        },
        handler4 = (value8, value9) => {
          if (!event10['down'] || !this['_draft']) return;
          const state3 = appStore['getStateRaw'](),
            box3 = state3['nodes']?.[this['nodeId']];
          if (!box3) return;
          const x4 = screenToWorld(value8, value9, state3['viewport']),
            value10 = { x: x4['x'] - box3['x'], y: x4['y'] - box3['y'] };
          (this['_draft']['points']['push'](value10), this['_render']());
        },
        handler5 = () => {
          if (!event10['down'] || !this['_draft']) return;
          const value11 = this['_draft'];
          ((this['_draft'] = null), (event10['down'] = ![]), (event10['pointerId'] = null));
          if (shouldDiscardStrokeCommand(value11)) {
            this['_render']();
            return;
          }
          (this['_commands']['push'](value11),
            (this['_redoStack'] = []),
            (this['_dirty'] = !![]),
            this['_render']());
        };
      (this['canvasEl']['addEventListener']('pointerdown', (event11) => {
        (event11['preventDefault'](),
          event11['stopPropagation'](),
          handler2(event11['clientX'], event11['clientY']),
          handler3(event11['clientX'], event11['clientY'], event11['pointerId'], event11['button']));
      }),
        this['canvasEl']['addEventListener']('pointermove', (event12) => {
          (event12['preventDefault'](),
            event12['stopPropagation'](),
            handler2(event12['clientX'], event12['clientY']),
            handler4(event12['clientX'], event12['clientY']));
        }),
        this['canvasEl']['addEventListener']('pointerup', (event13) => {
          (event13['preventDefault'](),
            event13['stopPropagation'](),
            handler2(event13['clientX'], event13['clientY']),
            handler5());
        }),
        this['canvasEl']['addEventListener']('pointercancel', (event14) => {
          (event14['preventDefault'](),
            event14['stopPropagation'](),
            handler2(event14['clientX'], event14['clientY']),
            handler5());
        }),
        this['canvasEl']['addEventListener']('pointerenter', (event15) => {
          ((this['_cursorHover'] = !![]), handler2(event15['clientX'], event15['clientY']));
        }),
        this['canvasEl']['addEventListener']('pointerleave', () => {
          ((this['_cursorHover'] = ![]), this['_syncCursor']());
        }));
    },
    _onCanvasWheel(event16) {
      (event16['preventDefault'](), event16['stopPropagation']());
      if (!this['active']) return;
      if (!this['_cursorHover']) return;
      const value12 = this['_view']?.['tool'] || 'brush';
      if (value12 !== 'brush' && value12 !== 'eraser' && value12 !== 'bucket') return;
      const count = event16['deltaY'] || 0x0,
        value13 = count < 0x0 ? 0x1 : -0x1,
        clampMattingBrushSize5 = clampMattingBrushSize(this['_view']?.['brushSizePx']),
        brushSizePx3 = clampMattingBrushSize(clampMattingBrushSize5 + value13 * 0x2);
      if (brushSizePx3 === clampMattingBrushSize5) return;
      appStore['setMattingState']({ brushSizePx: brushSizePx3 });
      if (this['sizeRangeEl']) this['sizeRangeEl']['value'] = String(brushSizePx3);
      if (this['sizeValueEl']) this['sizeValueEl']['textContent'] = String(brushSizePx3);
      this['_syncCursor']();
    },
    _syncCursor(
      tool4 = this['_view']?.['tool'] || 'brush',
      sizePx = this['_view']?.['brushSizePx'] || DEFAULT_MATTING_BRUSH_SIZE_PX,
    ) {
      if (!this['cursorEl']) return;
      syncCircularBrushCursor({
        cursorEl: this['cursorEl'],
        canvasEl: this['canvasEl'],
        visible: this['_cursorHover'],
        tool: tool4,
        allowedTools: ['brush', 'eraser', 'bucket'],
        sizePx: sizePx,
        cursorLast: this['_cursorLast'],
      });
    },
    _subscribeLocaleChanges() {
      if (this['_unsubscribeLocale']) return;
      this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']());
    },
    _syncLocaleTexts() {
      if (!this['toolbarEl']) return;
      this['toolbarEl']['querySelectorAll']('[data-matting-tooltip]')['forEach']((el6) => {
        const enabled2 = el6['dataset']['mattingTooltip'];
        if (!enabled2) return;
        let imageMattingText2 = imageMattingText('tooltips.' + enabled2);
        (enabled2 === 'brush' &&
          (imageMattingText2 =
            el6['dataset']['brushMode'] === 'alpha'
              ? imageMattingText('tooltips.brushAlphaToggle')
              : imageMattingText('tooltips.brushNormal')),
          (el6['dataset']['tooltip'] = imageMattingText2));
      });
      const el7 = this['toolbarEl']['querySelector']('.v2-matting-save-label');
      el7 && !this['_isSaving'] && (el7['textContent'] = imageMattingText('actions.save'));
    },
    _switchTool(tool5) {
      const el8 = this['toolButtons']['find'](
        (el9) => el9['dataset']['tool'] === tool5,
      );
      if (!el8) return;
      if (el8['disabled']) return;
      const value14 = appStore['getState'](),
        value15 = value14['matting']?.['tool'];
      if (tool5 === 'brush') {
        if (value15 === 'brush') {
          const value16 = el8['dataset']['brushMode'] || 'normal',
            brushMode2 = value16 === 'normal' ? 'alpha' : 'normal';
          ((el8['dataset']['brushMode'] = brushMode2),
            appStore['setMattingState']({ tool: tool5, brushMode: brushMode2 }),
            (el8['dataset']['tooltip'] =
              brushMode2 === 'normal'
                ? imageMattingText('tooltips.brushNormalToggle')
                : imageMattingText('tooltips.brushAlphaToggle')));
          const el10 = el8['querySelector']('.brush-icon-normal'),
            el11 = el8['querySelector']('.brush-icon-alpha');
          el10 &&
            el11 &&
            ((el10['style']['display'] = brushMode2 === 'normal' ? 'block' : 'none'),
            (el11['style']['display'] = brushMode2 === 'alpha' ? 'block' : 'none'));
        } else appStore['setMattingState']({ tool: tool5 });
      } else appStore['setMattingState']({ tool: tool5 });
      this['_updateToolActive']();
    },
    _changeBrushSize(value17) {
      const clampMattingBrushSize6 = clampMattingBrushSize(this['_view']?.['brushSizePx']),
        brushSizePx4 = clampMattingBrushSize(clampMattingBrushSize6 + value17);
      if (brushSizePx4 !== clampMattingBrushSize6) {
        appStore['setMattingState']({ brushSizePx: brushSizePx4 });
        if (this['sizeRangeEl']) this['sizeRangeEl']['value'] = String(brushSizePx4);
        if (this['sizeValueEl']) this['sizeValueEl']['textContent'] = String(brushSizePx4);
        this['_syncCursor']();
      }
    },
    _updateToolActive(
      value18 = this['_view']?.['tool'] || 'brush',
      value19 = this['_view']?.['brushSizePx'] || DEFAULT_MATTING_BRUSH_SIZE_PX,
    ) {
      (this['toolButtons']['forEach']((el12) => {
        if (el12['dataset']['tool'] === value18) el12['classList']['add']('active');
        else el12['classList']['remove']('active');
      }),
        this['_syncCursor'](value18, value19));
    },
    _updateView(value20) {
      if (!this['active']) return;
      const box4 = value20?.['node'],
        box5 = value20?.['viewport'];
      if (!box4) return;
      this['nodeData'] = box4;
      const clampMattingBrushSize7 = clampMattingBrushSize(value20?.['brushSizePx']);
      if (this['sizeRangeEl'] && Number(this['sizeRangeEl']['value']) !== clampMattingBrushSize7)
        this['sizeRangeEl']['value'] = String(clampMattingBrushSize7);
      if (this['sizeValueEl'] && this['sizeValueEl']['textContent'] !== String(clampMattingBrushSize7))
        this['sizeValueEl']['textContent'] = String(clampMattingBrushSize7);
      this['_updateToolActive'](value20?.['tool'], clampMattingBrushSize7);
      const box6 = worldToScreen(box4['x'], box4['y'], box5),
        value21 = Math['round'](box4['width'] * box5['zoom']),
        value22 = Math['round'](box4['height'] * box5['zoom']);
      ((this['containerEl']['style']['left'] = Math['round'](box6['x']) + 'px'),
        (this['containerEl']['style']['top'] = Math['round'](box6['y']) + 'px'),
        (this['containerEl']['style']['width'] = value21 + 'px'),
        (this['containerEl']['style']['height'] = value22 + 'px'));
      const value23 = window['devicePixelRatio'] || 0x1,
        value24 = Math['max'](0x1, value21),
        value25 = Math['max'](0x1, value22);
      if (
        this['canvasEl']['width'] !== Math['round'](value24 * value23) ||
        this['canvasEl']['height'] !== Math['round'](value25 * value23)
      ) {
        ((this['canvasEl']['width'] = Math['round'](value24 * value23)),
          (this['canvasEl']['height'] = Math['round'](value25 * value23)),
          (this['canvasEl']['style']['width'] = value24 + 'px'),
          (this['canvasEl']['style']['height'] = value25 + 'px'));
        const value26 = this['canvasEl']['getContext']('2d');
        (value26['setTransform'](value23, 0x0, 0x0, value23, 0x0, 0x0),
          (value26['lineCap'] = 'round'),
          (value26['lineJoin'] = 'round'));
      }
      const value27 = Math['max'](0xc, Math['round'](box6['y']) - 0x36);
      ((this['toolbarEl']['style']['left'] = Math['round'](box6['x'] + value21 / 0x2) + 'px'),
        (this['toolbarEl']['style']['top'] = value27 + 'px'),
        this['_render'](box5));
    },
    _render(value28 = this['_view']?.['viewport']) {
      if (!this['active'] || !this['canvasEl']) return;
      const ctx = this['canvasEl']['getContext']('2d'),
        value29 = Number(this['canvasEl']['style']['width']['replace']('px', '')) || 0x1,
        value30 = Number(this['canvasEl']['style']['height']['replace']('px', '')) || 0x1;
      ctx['clearRect'](0x0, 0x0, value29, value30);
      const boundarySource = this['_commands'],
        normalMaskCtx = this['_prepareNormalMaskCanvas'](value29, value30),
        alphaMaskCtx = this['_prepareAlphaMaskCanvas'](value29, value30);
      this['_renderCommands'](ctx, value28, boundarySource, ![], {
        normalMaskCtx: normalMaskCtx,
        alphaMaskCtx: alphaMaskCtx,
        boundarySource: boundarySource,
      });
      if (this['_draft']) {
        const boundarySource2 = boundarySource['concat']([this['_draft']]);
        this['_renderCommands'](ctx, value28, [this['_draft']], !![], {
          normalMaskCtx: normalMaskCtx,
          alphaMaskCtx: alphaMaskCtx,
          boundarySource: boundarySource2,
        });
      }
      (this['_compositeNormalMask'](ctx, value29, value30),
        this['_compositeAlphaMask'](ctx, value28, value29, value30));
    },
    _prepareNormalMaskCanvas(value31, value32) {
      const value33 = Math['max'](0x1, Math['round'](value31 || 0x1)),
        value34 = Math['max'](0x1, Math['round'](value32 || 0x1));
      if (
        !this['_normalMaskCanvas'] ||
        this['_normalMaskCanvas']['width'] !== value33 ||
        this['_normalMaskCanvas']['height'] !== value34
      ) {
        const box7 = document['createElement']('canvas');
        ((box7['width'] = value33),
          (box7['height'] = value34),
          (this['_normalMaskCanvas'] = box7));
      }
      if (
        !this['_normalOverlayCanvas'] ||
        this['_normalOverlayCanvas']['width'] !== value33 ||
        this['_normalOverlayCanvas']['height'] !== value34
      ) {
        const box8 = document['createElement']('canvas');
        ((box8['width'] = value33),
          (box8['height'] = value34),
          (this['_normalOverlayCanvas'] = box8));
      }
      const ctx2 = this['_normalMaskCanvas']['getContext']('2d');
      if (!ctx2) return null;
      return (
        ctx2['clearRect'](0x0, 0x0, value33, value34),
        (ctx2['lineCap'] = 'round'),
        (ctx2['lineJoin'] = 'round'),
        ctx2
      );
    },
    _prepareAlphaMaskCanvas(value35, value36) {
      const value37 = Math['max'](0x1, Math['round'](value35 || 0x1)),
        value38 = Math['max'](0x1, Math['round'](value36 || 0x1));
      if (
        !this['_alphaMaskCanvas'] ||
        this['_alphaMaskCanvas']['width'] !== value37 ||
        this['_alphaMaskCanvas']['height'] !== value38
      ) {
        const box9 = document['createElement']('canvas');
        ((box9['width'] = value37),
          (box9['height'] = value38),
          (this['_alphaMaskCanvas'] = box9));
      }
      if (
        !this['_alphaOverlayCanvas'] ||
        this['_alphaOverlayCanvas']['width'] !== value37 ||
        this['_alphaOverlayCanvas']['height'] !== value38
      ) {
        const box10 = document['createElement']('canvas');
        ((box10['width'] = value37),
          (box10['height'] = value38),
          (this['_alphaOverlayCanvas'] = box10));
      }
      const ctx3 = this['_alphaMaskCanvas']['getContext']('2d');
      if (!ctx3) return null;
      return (
        ctx3['clearRect'](0x0, 0x0, value37, value38),
        (ctx3['lineCap'] = 'round'),
        (ctx3['lineJoin'] = 'round'),
        ctx3
      );
    },
    _compositeNormalMask(ctx4, value39, value40) {
      if (!ctx4 || !this['_normalMaskCanvas'] || !this['_normalOverlayCanvas']) return;
      const value41 = Math['max'](0x1, Number(value39) || 0x1),
        value42 = Math['max'](0x1, Number(value40) || 0x1),
        ctx5 = this['_normalOverlayCanvas']['getContext']('2d');
      if (!ctx5) return;
      const pixelToolPalette = getPixelToolPalette();
      (ctx5['clearRect'](0x0, 0x0, value41, value42),
        ctx5['save'](),
        (ctx5['globalCompositeOperation'] = 'source-over'),
        (ctx5['globalAlpha'] = 0x1),
        (ctx5['fillStyle'] = pixelToolPalette['maskPreviewFill']),
        ctx5['fillRect'](0x0, 0x0, value41, value42),
        (ctx5['globalCompositeOperation'] = 'destination-in'),
        ctx5['drawImage'](this['_normalMaskCanvas'], 0x0, 0x0, value41, value42),
        ctx5['restore'](),
        ctx4['save'](),
        (ctx4['globalCompositeOperation'] = 'source-over'),
        (ctx4['globalAlpha'] = 0x1),
        ctx4['drawImage'](this['_normalOverlayCanvas'], 0x0, 0x0, value41, value42),
        ctx4['restore']());
    },
    _compositeAlphaMask(ctx6, box11, value43, value44) {
      if (!ctx6 || !this['_alphaMaskCanvas'] || !this['_alphaOverlayCanvas']) return;
      const value45 = Math['max'](0x1, Number(value43) || 0x1),
        value46 = Math['max'](0x1, Number(value44) || 0x1),
        ctx7 = this['_alphaOverlayCanvas']['getContext']('2d');
      if (!ctx7) return;
      ctx7['clearRect'](0x0, 0x0, value45, value46);
      const value47 = box11?.['zoom'] || 0x1,
        value48 = this['_createCheckerboardPattern'](ctx7, value47);
      (ctx7['save'](),
        (ctx7['globalCompositeOperation'] = 'source-over'),
        (ctx7['globalAlpha'] = 0.8),
        (ctx7['fillStyle'] = value48),
        ctx7['fillRect'](0x0, 0x0, value45, value46),
        (ctx7['globalCompositeOperation'] = 'destination-in'),
        (ctx7['globalAlpha'] = 0x1),
        ctx7['drawImage'](this['_alphaMaskCanvas'], 0x0, 0x0, value45, value46),
        ctx7['restore'](),
        ctx6['save'](),
        (ctx6['globalCompositeOperation'] = 'source-over'),
        (ctx6['globalAlpha'] = 0x1),
        ctx6['drawImage'](this['_alphaOverlayCanvas'], 0x0, 0x0, value45, value46),
        ctx6['restore']());
    },
    _renderCommands(ctx8, box12, list, value49 = ![], cache = {}) {
      const zoom2 = box12['zoom'] || 0x1,
        width = Number(this['canvasEl']?.['style']?.['width']?.['replace']('px', '')) || 0x1,
        height = Number(this['canvasEl']?.['style']?.['height']?.['replace']('px', '')) || 0x1,
        strokeStyle = getPixelToolPalette(),
        ctx9 = cache['normalMaskCtx'] || null,
        ctx10 = cache['alphaMaskCtx'] || null,
        list2 = Array['isArray'](cache['boundarySource']) ? cache['boundarySource'] : list;
      list['forEach']((fillCommand, value50) => {
        if (fillCommand['type'] === 'mask-preview') {
          if (!fillCommand['img']) return;
          const value51 = Number(this['canvasEl']?.['style']?.['width']?.['replace']('px', '')) || 0x1,
            value52 = Number(this['canvasEl']?.['style']?.['height']?.['replace']('px', '')) || 0x1;
          (ctx8['save'](),
            (ctx8['globalCompositeOperation'] = 'source-over'),
            ctx8['drawImage'](fillCommand['img'], 0x0, 0x0, value51, value52),
            ctx8['restore']());
          return;
        }
        if (fillCommand['type'] === 'mask-base') {
          if (!fillCommand['canvas'] || !ctx9) return;
          const value53 = Number(this['canvasEl']?.['style']?.['width']?.['replace']('px', '')) || 0x1,
            value54 = Number(this['canvasEl']?.['style']?.['height']?.['replace']('px', '')) || 0x1;
          (ctx9['save'](),
            (ctx9['globalCompositeOperation'] = 'source-over'),
            ctx9['drawImage'](fillCommand['canvas'], 0x0, 0x0, value53, value54),
            ctx9['restore']());
          return;
        }
        if (fillCommand['type'] === 'brush') {
          ctx8['save']();
          const value55 = fillCommand['mode'] === 'alpha',
            points = mapBrushPoints(fillCommand['points'], zoom2, zoom2),
            lineWidth = getBrushLineWidth(fillCommand['sizeWorld'], zoom2, 'brush');
          if (value55) {
            if (ctx10)
              (ctx10['save'](),
                drawRoundBrushStroke(ctx10, {
                  points: points,
                  lineWidth: lineWidth,
                  strokeStyle: '#fff',
                  fillStyle: '#fff',
                  globalCompositeOperation: 'source-over',
                }),
                ctx10['restore']());
            else {
              const strokeStyle2 = this['_createCheckerboardPattern'](ctx8, zoom2);
              drawRoundBrushStroke(ctx8, {
                points: points,
                lineWidth: lineWidth,
                strokeStyle: strokeStyle2,
                fillStyle: strokeStyle2,
                globalCompositeOperation: 'source-over',
                globalAlpha: 0.8,
              });
            }
          } else
            ctx9
              ? (ctx9['save'](),
                drawRoundBrushStroke(ctx9, {
                  points: points,
                  lineWidth: lineWidth,
                  strokeStyle: '#fff',
                  fillStyle: '#fff',
                  globalCompositeOperation: 'source-over',
                }),
                ctx9['restore']())
              : (drawRoundBrushStroke(ctx8, {
                  points: points,
                  lineWidth: getEraserClearLineWidth(lineWidth),
                  strokeStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  fillStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  globalCompositeOperation: 'destination-out',
                }),
                drawRoundBrushStroke(ctx8, {
                  points: points,
                  lineWidth: lineWidth,
                  strokeStyle: strokeStyle['maskPreviewFill'],
                  fillStyle: strokeStyle['maskPreviewFill'],
                  globalCompositeOperation: 'source-over',
                  globalAlpha: 0x1,
                }));
          ctx8['restore']();
          return;
        }
        if (fillCommand['type'] === 'eraser') {
          const points2 = mapBrushPoints(fillCommand['points'], zoom2, zoom2),
            lineWidth2 = getEraserClearLineWidth(
              getBrushLineWidth(fillCommand['sizeWorld'], zoom2, 'eraser'),
            );
          (ctx8['save'](),
            drawRoundBrushStroke(ctx8, {
              points: points2,
              lineWidth: lineWidth2,
              strokeStyle: '#000',
              fillStyle: '#000',
              globalCompositeOperation: 'destination-out',
            }),
            ctx8['restore']());
          ctx9 &&
            (ctx9['save'](),
            drawRoundBrushStroke(ctx9, {
              points: points2,
              lineWidth: lineWidth2,
              strokeStyle: '#000',
              fillStyle: '#000',
              globalCompositeOperation: 'destination-out',
            }),
            ctx9['restore']());
          ctx10 &&
            (ctx10['save'](),
            drawRoundBrushStroke(ctx10, {
              points: points2,
              lineWidth: lineWidth2,
              strokeStyle: '#000',
              fillStyle: '#000',
              globalCompositeOperation: 'destination-out',
            }),
            ctx10['restore']());
          return;
        }
        if (fillCommand['type'] === 'fill') {
          const value56 = fillCommand['mode'] === 'alpha',
            value57 = Number(fillCommand['x'] ?? fillCommand['startPoint']?.['x']) || 0x0,
            value58 = Number(fillCommand['y'] ?? fillCommand['startPoint']?.['y']) || 0x0,
            count2 = list2['indexOf'](fillCommand),
            list3 =
              count2 >= 0x0 ? list2['slice'](0x0, count2) : list['slice'](0x0, value50),
            boundaryCommands = list3['filter'](
              (value59) => value59?.['type'] === 'brush' || value59?.['type'] === 'eraser',
            ),
            seedX = Math['floor'](value57 * zoom2),
            seedY = Math['floor'](value58 * zoom2),
            cachedSealedFillRegion = getCachedSealedFillRegion({
              cache: cache['fillRegionCache'] || this['_fillRegionCache'],
              width: width,
              height: height,
              zoom: zoom2,
              fillCommand: fillCommand,
              boundaryCommands: boundaryCommands,
              seedX: seedX,
              seedY: seedY,
              extraKey: 'mode:' + (fillCommand['mode'] || ''),
              pointToPixel: (box13) => ({
                x: Number(box13?.['x'] || 0x0) * zoom2,
                y: Number(box13?.['y'] || 0x0) * zoom2,
              }),
              getStrokeWidth: (value60) =>
                getBrushLineWidth(value60?.['sizeWorld'], zoom2, value60?.['type']),
            });
          if (value56) {
            if (ctx10)
              paintFilledRegion(ctx10, cachedSealedFillRegion, width, height, {
                fillStyle: '#fff',
                globalCompositeOperation: 'source-over',
                globalAlpha: 0x1,
              });
            else {
              const fillStyle = this['_createCheckerboardPattern'](ctx8, zoom2);
              paintFilledRegion(ctx8, cachedSealedFillRegion, width, height, {
                fillStyle: fillStyle,
                globalCompositeOperation: 'source-over',
                globalAlpha: 0.8,
              });
            }
          } else
            ctx9
              ? paintFilledRegion(ctx9, cachedSealedFillRegion, width, height, {
                  fillStyle: '#fff',
                  globalCompositeOperation: 'source-over',
                })
              : (paintFilledRegion(ctx8, cachedSealedFillRegion, width, height, {
                  fillStyle: OPAQUE_MASK_PREVIEW_CLEAR,
                  globalCompositeOperation: 'destination-out',
                }),
                paintFilledRegion(ctx8, cachedSealedFillRegion, width, height, {
                  fillStyle: strokeStyle['selectionOverlay'],
                  globalCompositeOperation: 'source-over',
                }));
          return;
        }
      });
    },
    _createCheckerboardPattern(value61, value62) {
      const value63 = 0x8 * value62,
        box14 = document['createElement']('canvas');
      ((box14['width'] = value63 * 0x2), (box14['height'] = value63 * 0x2));
      const ctx11 = box14['getContext']('2d'),
        pixelToolPalette2 = getPixelToolPalette();
      return (
        (ctx11['fillStyle'] = pixelToolPalette2['checkerLight']),
        ctx11['fillRect'](0x0, 0x0, value63 * 0x2, value63 * 0x2),
        (ctx11['fillStyle'] = pixelToolPalette2['checkerDark']),
        ctx11['fillRect'](0x0, 0x0, value63, value63),
        ctx11['fillRect'](value63, value63, value63, value63),
        value61['createPattern'](box14, 'repeat')
      );
    },
    _fillArea(box15, value64) {
      const value65 = appStore['getState'](),
        mode2 = value65['matting']?.['brushMode'] || 'normal',
        value66 = {
          type: 'fill',
          x: Number(box15?.['x']) || 0x0,
          y: Number(box15?.['y']) || 0x0,
          mode: mode2,
        };
      (this['_commands']['push'](value66),
        (this['_redoStack'] = []),
        (this['_dirty'] = !![]),
        this['_render']());
    },
    _undo() {
      if (this['_commands']['length'] === 0x0) return;
      const value67 = this['_commands']['pop']();
      (this['_redoStack']['push'](value67), (this['_dirty'] = !![]), this['_render']());
    },
    _redo() {
      if (this['_redoStack']['length'] === 0x0) return;
      const value68 = this['_redoStack']['pop']();
      (this['_commands']['push'](value68), (this['_dirty'] = !![]), this['_render']());
    },
    _clear() {
      if (this['_commands']['length'] === 0x0 && this['_redoStack']['length'] === 0x0) return;
      ((this['_commands'] = []),
        (this['_redoStack'] = []),
        (this['_draft'] = null),
        (this['_dirty'] = !![]),
        (this['_baseMaskCleared'] = !![]),
        this['_render']());
    },
    async _save() {
      if (!this['active']) return;
      const state4 = appStore['getState'](),
        box16 = state4['nodes'][this['nodeId']];
      if (!box16) return;
      const enabled3 = this['_resolveNodeImageUrl'](box16);
      if (!enabled3) return;
      const el13 = this['toolbarEl']['querySelector']('.act-save'),
        el14 = el13['querySelector']('span'),
        value69 = el14 ? el14['textContent'] : '';
      this['_isSaving'] = !![];
      if (el14) el14['textContent'] = imageMattingText('actions.saving');
      el13['style']['pointerEvents'] = 'none';
      try {
        const value70 = this['nodeId'],
          value71 = Math['max'](0x1, Number(box16['width']) || 0x1),
          value72 = Math['max'](0x1, Number(box16['height']) || 0x1),
          maskSaveToken = generateId('mask_save'),
          list4 = this['_commands']
            ['filter'](
              (value73) =>
                value73 &&
                (value73['type'] === 'brush' ||
                  value73['type'] === 'eraser' ||
                  value73['type'] === 'fill'),
            )
            ['map']((mode3) => {
              if (mode3['type'] === 'fill')
                return {
                  type: 'fill',
                  x: Number(mode3['x'] ?? mode3['startPoint']?.['x']) || 0x0,
                  y: Number(mode3['y'] ?? mode3['startPoint']?.['y']) || 0x0,
                  mode: mode3['mode'],
                };
              return {
                type: mode3['type'],
                sizeWorld: Number(mode3['sizeWorld']) || 0x0,
                mode: mode3['mode'],
                points: Array['isArray'](mode3['points'])
                  ? mode3['points']['map']((box17) => ({
                      x: Number(box17['x']),
                      y: Number(box17['y']),
                    }))
                  : [],
              };
            });
        if (this['_baseMaskCleared'] && list4['length'] === 0x0) {
          (appStore['updateNodeData'](value70, {
            mask: '',
            maskPreview: '',
            maskPolarity: '',
            maskPreviewUrl: null,
            maskSaveToken: null,
          }),
            window['_triggerLocalCacheSave']?.(),
            this['exit']({ silent: !![] }));
          return;
        }
        const value74 = this['_baseMaskCleared'] ? '' : normalizeLocalPath(box16?.['mask']),
          enabled4 = await new Promise((value75) => this['canvasEl']['toBlob'](value75, 'image/png'));
        if (!enabled4) throw new Error(imageMattingText('errors.canvasExportFailed'));
        const maskPreviewUrl = URL['createObjectURL'](enabled4);
        (appStore['updateNodeData'](value70, { maskPreviewUrl: maskPreviewUrl, maskSaveToken: maskSaveToken }),
          window['_triggerLocalCacheSave']?.(),
          this['exit']({ silent: !![] }),
          (async () => {
            const box18 = await this['_loadImage'](enabled3),
              width2 = box18['naturalWidth'] || box18['width'],
              height2 = box18['naturalHeight'] || box18['height'],
              value76 = Math['max'](value71 / width2, value72 / height2) || 0x1,
              value77 = width2 * value76,
              value78 = height2 * value76,
              value79 = (value71 - value77) / 0x2,
              value80 = (value72 - value78) / 0x2,
              handler6 = (box19) => {
                const value81 = (Number(box19?.['x']) - value79) / value76,
                  value82 = (Number(box19?.['y']) - value80) / value76;
                return {
                  x: Math['max'](0x0, Math['min'](width2 - 0x1, value81)),
                  y: Math['max'](0x0, Math['min'](height2 - 0x1, value82)),
                };
              },
              box20 = document['createElement']('canvas');
            ((box20['width'] = width2), (box20['height'] = height2));
            const ctx12 = box20['getContext']('2d');
            ctx12['imageSmoothingEnabled'] = ![];
            const fillStyle2 = getCssVar('--canvas-white'),
              cssVar = getCssVar('--canvas-black');
            ((ctx12['fillStyle'] = cssVar), ctx12['fillRect'](0x0, 0x0, width2, height2));
            if (value74)
              try {
                const value83 = await this['_loadImage'](localPathToUrl(value74));
                ctx12['drawImage'](value83, 0x0, 0x0, width2, height2);
                const value84 = appStore['getState']()['nodes']?.[value70],
                  value85 = String(value84?.['maskPolarity'] || '')['trim']();
                value85 !== 'paint-white' && this['_invertCanvasBinary'](ctx12);
              } catch (value86) {}
            const run2 = (value87, strokeStyle3, count3 = 0x1) => {
              const points3 = (Array['isArray'](value87['points']) ? value87['points'] : [])['map'](
                (value88) => handler6(value88),
              );
              if (!points3['length']) return;
              ctx12['save']();
              const lineWidth3 = count3 >= 0x6 ? 'eraser' : 'brush',
                brushLineWidth = getBrushLineWidth(value87['sizeWorld'], 0x1 / value76, lineWidth3);
              (drawRoundBrushStroke(ctx12, {
                points: points3,
                lineWidth: lineWidth3 === 'eraser' ? getEraserClearLineWidth(brushLineWidth) : brushLineWidth,
                strokeStyle: strokeStyle3,
                fillStyle: strokeStyle3,
                globalCompositeOperation: 'source-over',
              }),
                ctx12['restore']());
            };
            list4['forEach']((x5, value89) => {
              if (!x5) return;
              if (x5['type'] === 'brush') {
                run2(x5, fillStyle2, 0x1);
                return;
              }
              if (x5['type'] === 'eraser') {
                run2(x5, cssVar, 0x6);
                return;
              }
              if (x5['type'] === 'fill') {
                const commands = list4['slice'](0x0, value89)['filter'](
                    (value90) => value90?.['type'] === 'brush' || value90?.['type'] === 'eraser',
                  ),
                  box21 = buildBinaryBoundaryMask({
                    width: width2,
                    height: height2,
                    commands: commands,
                    pointToPixel: (value91) => {
                      const x6 = handler6(value91 || {});
                      return { x: x6['x'], y: x6['y'] };
                    },
                    getStrokeWidth: (value92) =>
                      getBrushLineWidth(value92?.['sizeWorld'], 0x1 / value76, value92?.['type']),
                  }),
                  box22 = handler6({ x: x5['x'], y: x5['y'] }),
                  floodFillRegion2 = floodFillRegion(
                    box21['mask'],
                    box21['width'],
                    box21['height'],
                    Math['floor'](box22['x']),
                    Math['floor'](box22['y']),
                  ),
                  boundary = sealRegionToBoundary(
                    floodFillRegion2,
                    box21['mask'],
                    box21['width'],
                    box21['height'],
                  );
                paintFilledRegion(ctx12, boundary, width2, height2, {
                  fillStyle: fillStyle2,
                  globalCompositeOperation: 'source-over',
                });
                return;
              }
            });
            const value93 = ctx12['getImageData'](0x0, 0x0, width2, height2)['data'],
              value94 = Math['max'](0x1, Math['floor'](Math['max'](width2, height2) / 0x100));
            let enabled5 = ![];
            for (let value95 = 0x0; value95 < height2 && !enabled5; value95 += value94) {
              for (let value96 = 0x0; value96 < width2; value96 += value94) {
                const value97 = (value95 * width2 + value96) * 0x4,
                  count4 = value93[value97],
                  count5 = value93[value97 + 0x1],
                  count6 = value93[value97 + 0x2];
                if (count4 > 0x5 || count5 > 0x5 || count6 > 0x5) {
                  enabled5 = !![];
                  break;
                }
              }
            }
            if (!enabled5) {
              const enabled6 = appStore['getState']()['nodes']?.[value70];
              if (!enabled6 || enabled6['maskSaveToken'] !== maskSaveToken) {
                URL['revokeObjectURL'](maskPreviewUrl);
                return;
              }
              (appStore['updateNodeData'](value70, {
                mask: '',
                maskPreview: '',
                maskPolarity: '',
                maskPreviewUrl: null,
                maskSaveToken: null,
              }),
                appStore['setSelectedNodes']([value70]),
                commit(),
                URL['revokeObjectURL'](maskPreviewUrl),
                window['_triggerLocalCacheSave']?.());
              return;
            }
            const enabled7 = await new Promise((value98) => box20['toBlob'](value98, 'image/png'));
            if (!enabled7) throw new Error(imageMattingText('errors.canvasExportFailed'));
            const saveOutputBlob2 = await saveOutputBlob(enabled7, { ext: 'png', subDir: 'mask', kind: 'mask' }),
              mask = pickResultLocalPath(saveOutputBlob2),
              saveOutputBlob3 = await saveOutputBlob(enabled4, { ext: 'png', subDir: 'mask_preview' }),
              maskPreview = pickResultLocalPath(saveOutputBlob3),
              enabled8 = appStore['getState']()['nodes']?.[value70];
            if (!enabled8 || enabled8['maskSaveToken'] !== maskSaveToken) {
              URL['revokeObjectURL'](maskPreviewUrl);
              return;
            }
            (appStore['updateNodeData'](value70, {
              mask: mask,
              maskPreview: maskPreview,
              maskPolarity: 'paint-white',
              maskPreviewUrl: null,
              maskSaveToken: null,
            }),
              appStore['setSelectedNodes']([value70]),
              commit(),
              URL['revokeObjectURL'](maskPreviewUrl),
              window['_triggerLocalCacheSave']?.());
          })()['catch'](() => {
            const enabled9 = appStore['getState']()['nodes']?.[value70];
            if (!enabled9 || enabled9['maskSaveToken'] !== maskSaveToken) {
              try {
                URL['revokeObjectURL'](maskPreviewUrl);
              } catch (value99) {}
              return;
            }
            (appStore['updateNodeData'](value70, { maskSaveToken: null }),
              window['showToast']?.(imageMattingText('toasts.saveFailed'), 'error'));
          }));
      } catch (value100) {
        (console['error']('[Matting] 保存失败:', value100),
          window['showToast']?.(imageMattingText('toasts.saveFailed'), 'error'));
      } finally {
        if (el14) el14['textContent'] = value69;
        ((el13['style']['pointerEvents'] = 'auto'),
          (this['_isSaving'] = ![]),
          this['_syncLocaleTexts']());
      }
    },
    _resolveNodeImageUrl(value101) {
      const value102 = value101['mainImageIndex'] || 0x0,
        value103 = value101['images'] && value101['images'][value102],
        value104 = value101['localPath'] || value103?.['localPath'],
        url = localPathToUrl(value104);
      if (url) return url;
      return (
        value101['src'] ||
        value101['sourceUrl'] ||
        value101['imageUrl'] ||
        value101['thumbUrl'] ||
        value103?.['imageUrl'] ||
        value103?.['thumbUrl'] ||
        ''
      );
    },
    _invertCanvasBinary(canvas) {
      const box23 = canvas?.['canvas'],
        enabled10 = box23?.['width'] || 0x0,
        enabled11 = box23?.['height'] || 0x0;
      if (!enabled10 || !enabled11) return;
      const value105 = canvas['getImageData'](0x0, 0x0, enabled10, enabled11),
        list5 = value105['data'];
      for (let value106 = 0x0; value106 < list5['length']; value106 += 0x4) {
        ((list5[value106] = 0xff - list5[value106]),
          (list5[value106 + 0x1] = 0xff - list5[value106 + 0x1]),
          (list5[value106 + 0x2] = 0xff - list5[value106 + 0x2]));
      }
      canvas['putImageData'](value105, 0x0, 0x0);
    },
    _createMaskBaseCanvas(box24, value107 = 'paint-white') {
      const value108 = Math['max'](0x1, Number(box24?.['naturalWidth'] || box24?.['width']) || 0x1),
        value109 = Math['max'](0x1, Number(box24?.['naturalHeight'] || box24?.['height']) || 0x1),
        box25 = document['createElement']('canvas');
      ((box25['width'] = value108), (box25['height'] = value109));
      const ctx13 = box25['getContext']('2d', { willReadFrequently: !![] });
      if (!ctx13) return null;
      ctx13['drawImage'](box24, 0x0, 0x0, value108, value109);
      const value110 = ctx13['getImageData'](0x0, 0x0, value108, value109),
        { data: data2 } = value110,
        value111 = String(value107 || '')['trim']() === 'paint-white';
      for (let value112 = 0x0; value112 < data2['length']; value112 += 0x4) {
        const value113 = Math['max'](
            data2[value112],
            data2[value112 + 0x1],
            data2[value112 + 0x2],
          ),
          count7 = value111 ? value113 : 0xff - value113,
          value114 = count7 > 0x5 ? count7 : 0x0;
        ((data2[value112] = 0xff),
          (data2[value112 + 0x1] = 0xff),
          (data2[value112 + 0x2] = 0xff),
          (data2[value112 + 0x3] = value114));
      }
      return (ctx13['putImageData'](value110, 0x0, 0x0), box25);
    },
    _loadExistingMask() {
      if (!this['active']) return;
      const state5 = appStore['getStateRaw'](),
        value115 = state5['nodes']?.[this['nodeId']],
        enabled12 = String(value115?.['mask'] || '')['trim'](),
        value116 = String(value115?.['maskPreviewUrl'] || value115?.['maskPreview'] || '')['trim'](),
        value117 = !!enabled12,
        enabled13 = value117 ? enabled12 : value116;
      if (!enabled13) return;
      const enabled14 =
        enabled13['startsWith']('blob:') || enabled13['startsWith']('data:')
          ? enabled13
          : localPathToUrl(enabled13);
      if (!enabled14) return;
      (async () => {
        const img = await this['_loadImage'](enabled14);
        if (!this['active']) return;
        this['_commands'] = this['_commands']['filter'](
          (value118) => value118?.['type'] !== 'mask-preview' && value118?.['type'] !== 'mask-base',
        );
        if (value117) {
          const canvas2 = this['_createMaskBaseCanvas'](img, value115?.['maskPolarity']);
          if (canvas2) this['_commands']['unshift']({ type: 'mask-base', canvas: canvas2 });
        } else this['_commands']['unshift']({ type: 'mask-preview', img: img });
        ((this['_redoStack'] = []), this['_render']());
      })()['catch'](() => {});
    },
    _loadImage(value119) {
      return new Promise((handler7, handler8) => {
        const image = new Image();
        ((image['crossOrigin'] = 'anonymous'),
          (image['onload'] = () => handler7(image)),
          (image['onerror'] = () => handler8(new Error(imageMattingText('errors.imageLoadFailed')))),
          (image['src'] = value119));
      });
    },
  };
export default ImageMattingController;

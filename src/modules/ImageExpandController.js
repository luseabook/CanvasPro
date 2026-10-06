import { openDebugRequestWindow } from './debugRequestWindow.js';
import appStore from '../core/stores/appStore.js';
import { positionCanvasEditorToolbar } from '../components/shared/canvasEditorSurface.js';
import {
  bindImageFunctionControls,
  getImageFunctionRequestSettings,
  getImageFunctionSelection,
  renderImageFunctionControls,
} from './imageFunctionControls.js';
import { worldToScreen, generateId } from '../core/math.js';
import { getDisplayModelName } from './providers.js';
import { IMAGE_MODELS } from '../config/modelConfig.js';
import { buildGenerateImageRequest, generateImage } from '../../api/aiImageApi.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceMediaNodePayload, getNodeDefaultSize } from '../services/fileService.js';
import {
  OUTPUT_RATIO_SWITCH_THRESHOLD,
  calcDisplaySizeByMedia,
  resolveInputRatioBasis,
  resolveOutputMediaSize,
  shouldSwitchToOutputRatio,
} from '../services/mediaRatioService.js';
import {
  buildImageFunctionModelCatalog,
  findImageFunctionProviderByModel,
  getDefaultImageFunctionModelState,
} from './imageFunctionModelMenu.js';
import {
  DEBUG_WRENCH_ICON_HTML,
  formatFinalApiDebugRequest,
  buildFinalApiDebugPreview,
} from '../utils/debugRequestPreview.js';
import { resolveImageNodeUrl } from './imageNodeImageUrl.js';
import { waitForImageElementReady } from './imageOverlayReadiness.js';
import { bindImageOverlayViewportPreview } from './imageOverlayViewportPreview.js';
import { bindToolbarUpMenus, renderToolbarUpMenu } from './imageToolbarUpMenu.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from '../components/aigenImage/imageGenerationResultRenderer.js';
import { buildGenerationStartPatch } from '../core/generationTaskLifecycle.js';
import {
  buildAsyncTaskPatch as buildAsyncTaskPatch_2,
  buildDreaminaTaskPatch as buildDreaminaTaskPatch_2,
  buildRunningHubTaskPatch as buildRunningHubTaskPatch_2,
} from '../core/generationTaskProtocolState.js';
import { isTaskCancelled } from '../core/generationTaskUiState.js';
import {
  isDreaminaImageTaskModel,
  isRunningHubImageTaskModel,
  resolveImageTaskProvider,
  shouldUseRunningHubOpenapiQuery,
} from './imageTaskModelResolver.js';
import { onLocaleChange, t } from '../i18n/index.js';
const IMAGE_EXPAND_PROMPT = '移除绿区域，并在绿色区域内生成符合画面的场景';
function imageExpandText(value, item = {}) {
  return t('imageExpand.' + value, item);
}
const EXPAND_RATIO_OPTIONS = [
  { value: 'original', labelKey: 'ratio.original' },
  { value: '21:9', label: '21:9' },
  { value: '16:9', label: '16:9' },
  { value: '9:16', label: '9:16' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '1:1', label: '1:1' },
];
function getExpandRatioOptions() {
  return EXPAND_RATIO_OPTIONS.map((label2) => ({
    ...label2,
    label: label2.labelKey ? imageExpandText(label2.labelKey) : label2.label,
    selectedLabel:
      label2.value === 'original' ? imageExpandText('ratio.selectedOriginal') : label2.label,
  }));
}
function isRunningHubTaskModel(key, index) {
  return isRunningHubImageTaskModel(key, index);
}
function isDreaminaTaskModel(result, data) {
  return isDreaminaImageTaskModel(result, data);
}
function buildRunningHubTaskPatch({
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = false,
  useOpenapiQuery: useOpenapiQuery = false,
} = {}) {
  return buildRunningHubTaskPatch_2({
    taskId: taskId,
    status: status,
    startedAt: startedAt,
    recovering: recovering,
    useOpenapiQuery: useOpenapiQuery,
  });
}
function buildDreaminaTaskPatch({
  submitId: submitId = '',
  status: status = 'pending',
  phase: phase = 'generating',
  label: label = imageExpandText('task.generating'),
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) {
  return buildDreaminaTaskPatch_2({
    submitId: submitId,
    status: status,
    phase: phase,
    label: label,
    startedAt: startedAt,
    recovering: recovering,
    defaultLabel: imageExpandText('task.generating'),
  });
}
function buildAsyncTaskPatch({
  provider: provider = '',
  kind: kind = 'image',
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) {
  return buildAsyncTaskPatch_2({
    provider: provider,
    kind: kind,
    taskId: taskId,
    status: status,
    startedAt: startedAt,
    recovering: recovering,
  });
}
function persistRunningHubResumeCache() {
  try {
    window._triggerLocalCacheSave?.();
  } catch {}
}
function buildImageExpandOutputText(model, { error: error = '' } = {}) {
  const options = { model: model, prompt: imageExpandText('output.promptDisplay'), error: error };
  return error ? imageExpandText('output.failed', options) : imageExpandText('output.started', options);
}
function buildExpandModelCatalog() {
  return buildImageFunctionModelCatalog(IMAGE_MODELS);
}
function findProviderKeyByModel(target, source) {
  const enabled = String(source || '').trim();
  if (!enabled) return null;
  for (const [next, current] of Object.entries(target || {})) {
    const list = Array.isArray(current?.models) ? current.models : [];
    if (list.some((entry) => entry?.id === enabled)) return next;
  }
  return findImageFunctionProviderByModel(target, enabled);
}
function buildSeedreamMigrationPatch(record) {
  return (void record, null);
}
const ImageExpandController = {
  active: false,
  nodeId: null,
  nodeData: null,
  ratioStr: 'original',
  imageSize: '1K',
  model: null,
  provider: null,
  overlayEl: null,
  frameEl: null,
  frameRect: null,
  _pointerState: null,
  imgEl: null,
  toolbarEl: null,
  ratioMenuEl: null,
  sizeMenuEl: null,
  modelMenuEl: null,
  _unsubscribe: null,
  _unsubscribeViewportPreview: null,
  _view: null,
  _expandModelCatalog: null,
  _unbindToolbarUpMenus: null,
  _unsubscribeLocale: null,
  cleanup: null,
  init(payload) {
    if (this.active) return;
    const viewport = appStore.getStateRaw(),
      enabled2 = viewport.nodes?.[payload];
    if (!enabled2) return;
    ((this.active = true),
      (this.nodeId = payload),
      (this._expandModelCatalog = buildExpandModelCatalog()));
    const node = this._normalizeLegacySeedreamNode(enabled2);
    ((this.nodeData = node),
      (this._view = { viewport: viewport.viewport, node: node }),
      (this.ratioStr = 'original'),
      (this.imageSize = '1K'));
    const handle = this._getExpandModelCatalog(),
      defaultImageFunctionModelState = getDefaultImageFunctionModelState(handle),
      state = String(node?.model || '').trim(),
      config = String(node?.provider || '').trim(),
      providerKeyByModel = findProviderKeyByModel(handle, state);
    if (providerKeyByModel) ((this.model = state), (this.provider = providerKeyByModel));
    else
      defaultImageFunctionModelState.model
        ? ((this.model = defaultImageFunctionModelState.model), (this.provider = defaultImageFunctionModelState.provider))
        : ((this.model = state || ''),
          (this.provider = resolveImageTaskProvider(state, config, defaultImageFunctionModelState.provider || '')));
    (this._createUI(),
      this._bindEvents(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      (this._unsubscribe = appStore.subscribeSelector(
        (state2) => {
          const nx = state2.nodes?.[payload],
            vx = state2.viewport || { x: 0, y: 0, zoom: 1 };
          return {
            hasNode: !!nx,
            vx: vx.x,
            vy: vx.y,
            vz: vx.zoom || 1,
            vox: vx._screenOriginX || 0,
            voy: vx._screenOriginY || 0,
            nx: nx ? nx.x : 0,
            ny: nx ? nx.y : 0,
            nw: nx ? nx.width : 0,
            nh: nx ? nx.height : 0,
          };
        },
        (x2) => {
          if (!x2?.hasNode) return;
          const enabled3 = appStore.getStateRaw().nodes?.[payload];
          if (!enabled3) return;
          const node2 = this._normalizeLegacySeedreamNode(enabled3);
          ((this.nodeData = node2),
            (this._view = {
              viewport: {
                x: x2.vx,
                y: x2.vy,
                zoom: x2.vz,
                _screenOriginX: x2.vox,
                _screenOriginY: x2.voy,
              },
              node: node2,
            }),
            this._updateView(this._view));
        },
      )),
      (this._unsubscribeViewportPreview = bindImageOverlayViewportPreview({
        getView: () => this._view,
        updateView: (scope) => {
          ((this._view = scope), this._updateView(scope));
        },
      })),
      this._waitForImageAndShow());
  },
  _waitForImageAndShow() {
    (this._cancelImageReadyWait?.(),
      this.overlayEl?.classList.add('visible'),
      (this._cancelImageReadyWait = waitForImageElementReady({
        image: this.imgEl,
        onReady: () => {
          this._cancelImageReadyWait = null;
          if (this.active) this._updateView(this._view);
        },
        onError: () => {
          this._cancelImageReadyWait = null;
          if (!this.active) return;
          (window.showToast?.(imageExpandText('errors.sourceImageLoadFailed'), 'error'), this.exit());
        },
      })));
  },
  _getExpandModelCatalog() {
    return (
      !this._expandModelCatalog && (this._expandModelCatalog = buildExpandModelCatalog()),
      this._expandModelCatalog
    );
  },
  _normalizeLegacySeedreamNode(input) {
    const args = buildSeedreamMigrationPatch(input);
    if (!args) return input;
    const output = { ...(input || {}), ...args },
      value2 = appStore.getStateRaw().nodes?.[this.nodeId];
    return (value2 && appStore.updateNodeData(this.nodeId, args), output);
  },
  _getImageUrl() {
    return resolveImageNodeUrl(this.nodeData || {}, { preferPreview: true });
  },
  _createExpandedImage(value3, x3) {
    return new Promise((handler, handler2) => {
      const image = new Image();
      ((image.crossOrigin = 'anonymous'),
        (image.onload = async () => {
          try {
            const box = document.createElement('canvas'),
              ctx = box.getContext('2d'),
              value4 = image.naturalWidth,
              value5 = image.naturalHeight,
              box2 = value3,
              box3 = {
                x: x3.x || 0,
                y: x3.y || 0,
                w: x3.width || 1,
                h: x3.height || 1,
              },
              value6 = value4 / box3.w,
              value7 = value5 / box3.h,
              width = Math.round(box2.w * value6),
              height = Math.round(box2.h * value7);
            ((box.width = width),
              (box.height = height),
              (ctx.fillStyle = '#00FF00'),
              ctx.fillRect(0, 0, width, height));
            const value8 = Math.round((box3.x - box2.x) * value6),
              value9 = Math.round((box3.y - box2.y) * value7);
            (ctx.drawImage(image, value8, value9, value4, value5),
              box.toBlob((value10) => {
                if (value10) {
                  const url = URL.createObjectURL(value10);
                  handler({ url: url, width: width, height: height });
                } else handler2(new Error(imageExpandText('errors.createExpandedImageFailed')));
              }, 'image/png'));
          } catch (value11) {
            handler2(value11);
          }
        }),
        (image.onerror = () => {
          handler2(new Error(imageExpandText('errors.sourceImageLoadFailed')));
        }));
      const imageNodeUrl = resolveImageNodeUrl(x3, { preferPreview: false });
      image.src = imageNodeUrl;
    });
  },
  _buildGenerationPayload(
    model2,
    provider2,
    value12,
    args2 = getImageFunctionRequestSettings(this._functionSelection),
    aspectRatio = this.ratioStr,
  ) {
    const value13 = aspectRatio === 'original';
    return {
      prompt: IMAGE_EXPAND_PROMPT,
      model: model2,
      provider: provider2,
      ...(value13 ? { suppressAspectRatio: true } : { aspectRatio: aspectRatio }),
      imageSize: this.imageSize,
      ...args2,
      inputUrls: [value12],
      batchSize: 1,
    };
  },
  _formatDebugRequest(value14) {
    return formatFinalApiDebugRequest(value14);
  },
  _showDebugWindow(outputText, images) {
    openDebugRequestWindow({ outputText: outputText, images: images });
  },
  async _handleDebug() {
    let response = null;
    try {
      const state3 = appStore.getStateRaw(),
        args3 = state3.nodes?.[this.nodeId];
      if (!args3) {
        window.showToast?.(imageExpandText('toasts.sourceNodeMissing'), 'warn');
        return;
      }
      if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
      const value15 = String(this.model || '').trim(),
        imageTaskProvider = resolveImageTaskProvider(value15, this.provider, ''),
        imageFunctionRequestSettings = getImageFunctionRequestSettings(this._functionSelection),
        value16 = this.ratioStr;
      response = await this._createExpandedImage({ ...this.frameRect }, { ...args3 });
      const value17 = this._buildGenerationPayload(
          value15,
          imageTaskProvider,
          response.url,
          imageFunctionRequestSettings,
          value16,
        ),
        generateImageRequest = await buildGenerateImageRequest(value17),
        finalApiDebugPreview = buildFinalApiDebugPreview(generateImageRequest);
      (this._showDebugWindow(finalApiDebugPreview.outputText, finalApiDebugPreview.images),
        window.showToast?.(imageExpandText('toasts.debugShown'), 'warn'));
    } catch (error2) {
      (console.error('[ImageExpandController] 调试请求构建失败:', error2),
        window.showToast?.(
          imageExpandText('toasts.debugBuildFailed', {
            error: error2?.message || imageExpandText('errors.unknown'),
          }),
          'error',
        ));
    } finally {
      response?.url && URL.revokeObjectURL(response.url);
    }
  },
  _parseRatio() {
    if (this.ratioStr === 'original')
      return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    const list2 = this.ratioStr.split(':').map((value18) => Number(value18));
    if (list2.length !== 2 || !list2[0] || !list2[1])
      return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    return list2[0] / list2[1];
  },
  _calcFrameWorldRect() {
    const box4 = this.nodeData,
      value19 = box4.width || 1,
      value20 = box4.height || 1,
      x4 = box4.x + value19 / 2,
      y2 = box4.y + value20 / 2,
      value21 = value19 / value20,
      value22 = this._parseRatio();
    let value23, value24;
    value22 >= value21
      ? ((value24 = value20), (value23 = value20 * value22))
      : ((value23 = value19), (value24 = value19 / value22));
    const value25 = 1.35,
      w = Math.max(value19, value23) * value25,
      h = Math.max(value20, value24) * value25;
    return { x: x4 - w / 2, y: y2 - h / 2, w: w, h: h };
  },
  _getNodeWorldRect() {
    const x5 = this.nodeData || {},
      w2 = x5.width || 1,
      h2 = x5.height || 1;
    return { x: x5.x || 0, y: x5.y || 0, w: w2, h: h2 };
  },
  _clampFrameRect(box5) {
    const box6 = this._getNodeWorldRect(),
      handler3 = (value26, value27, value28) =>
        Math.min(value28, Math.max(value27, value26)),
      box7 = {
        x: Number(box5?.x) || 0,
        y: Number(box5?.y) || 0,
        w: Number(box5?.w) || 1,
        h: Number(box5?.h) || 1,
      },
      value29 = Math.max(box6.w, 24),
      value30 = Math.max(box6.h, 24);
    ((box7.w = Math.max(box7.w, value29)),
      (box7.h = Math.max(box7.h, value30)));
    if (this.ratioStr !== 'original') {
      const value31 = this._parseRatio(),
        value32 = box7.x + box7.w / 2,
        value33 = box7.y + box7.h / 2;
      let value34 = box7.w,
        value35 = box7.h;
      (value34 / value35 > value31
        ? (value35 = value34 / value31)
        : (value34 = value35 * value31),
        value34 < value29 && ((value34 = value29), (value35 = value34 / value31)),
        value35 < value30 && ((value35 = value30), (value34 = value35 * value31)),
        (box7.w = value34),
        (box7.h = value35),
        (box7.x = value32 - box7.w / 2),
        (box7.y = value33 - box7.h / 2));
    }
    const value36 = box6.x + box6.w - box7.w,
      value37 = box6.x,
      value38 = box6.y + box6.h - box7.h,
      value39 = box6.y;
    return (
      (box7.x = handler3(box7.x, value36, value37)),
      (box7.y = handler3(box7.y, value38, value39)),
      box7
    );
  },
  _closeToolbarUpMenus(value40 = null) {
    this.toolbarEl?.querySelectorAll('[data-toolbar-up-menu-menu]').forEach((el) => {
      if (el === value40) return;
      const value41 =
        String(el?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
      (el.classList.remove(value41),
        el.classList.remove('open'),
        el.classList.remove('show'));
    });
  },
  _createUI() {
    const el2 = document.createElement('div');
    el2.className = 'v2-expand-overlay';
    const el3 = document.createElement('div');
    ((el3.className = 'v2-expand-frame'),
      ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'lm', 'rm'].forEach((value42) => {
        const el4 = document.createElement('div');
        ((el4.className = 'v2-expand-handle ' + value42),
          (el4.dataset.handle = value42),
          el3.appendChild(el4));
      }));
    const value43 = document.createElement('img');
    ((value43.className = 'v2-expand-img'),
      (value43.draggable = false),
      (value43.src = this._getImageUrl()),
      el2.appendChild(el3),
      el2.appendChild(value43),
      document.body.appendChild(el2),
      (this.overlayEl = el2),
      (this.frameEl = el3),
      (this.imgEl = value43),
      (this.frameRect = this._calcFrameWorldRect()));
    const el5 = document.createElement('div');
    el5.className = 'v2-expand-toolbar';
    const value44 = this._getExpandModelCatalog();
    ((this._functionSelection = getImageFunctionSelection(
      this.model,
      appStore.getStateRaw().nodes?.[this.nodeId],
      this.imageSize,
    )),
      (el5.innerHTML =
        '\n      <button class="v2-expand-toolbar-btn exit" title="' +
        imageExpandText('actions.exit') +
        '">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>\n      </button>\n      ' +
        renderImageFunctionControls(this._functionSelection, value44) +
        '\n      ' +
        renderToolbarUpMenu({
          fieldId: 'ratio',
          value: this.ratioStr,
          options: getExpandRatioOptions(),
          triggerClass: 'ratio-toggle',
          labelClass: 'ratio-text',
          menuClass: 'v2-expand-menu ratio-menu',
          itemClass: 'v2-expand-menu-item',
        }) +
        '\n      <button class="v2-expand-toolbar-btn debug-wrench-btn" type="button" title="' +
        imageExpandText('actions.debugApiParams') +
        '" aria-label="' +
        imageExpandText('actions.debugApiParams') +
        '">\n        ' +
        DEBUG_WRENCH_ICON_HTML +
        '\n      </button>\n      <button class="v2-expand-toolbar-btn go img-gen-btn" title="' +
        imageExpandText('actions.generate') +
        '">\n        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n      </button>\n    '));
    const value45 = el5.querySelector('[data-toolbar-up-menu="ratio"]');
    (el5.querySelector('.ui-schema-resolution-slot').before(value45),
      document.body.appendChild(el5),
      (this.toolbarEl = el5),
      (this.ratioMenuEl = el5.querySelector('.ratio-menu')),
      (this.sizeMenuEl = el5.querySelector('.size-menu')),
      (this.modelMenuEl = el5.querySelector('.model-menu')),
      this._updateView(this._view),
      this._syncLocaleTexts());
  },
  _syncLocaleTexts() {
    if (!this.toolbarEl) return;
    const value46 = this.toolbarEl.querySelector('.exit');
    if (value46) value46.title = imageExpandText('actions.exit');
    const el6 = this.toolbarEl.querySelector('.debug-wrench-btn');
    if (el6) {
      const imageExpandText2 = imageExpandText('actions.debugApiParams');
      ((el6.title = imageExpandText2), el6.setAttribute('aria-label', imageExpandText2));
    }
    const value47 = this.toolbarEl.querySelector('.go');
    if (value47) value47.title = imageExpandText('actions.generate');
    const run = (value48, list3, value49) => {
      const map = new Map(
          list3.map((el7) => [String(el7.value || ''), el7]),
        ),
        el8 = this.toolbarEl.querySelector('[data-toolbar-up-menu="' + value48 + '"]'),
        value50 = map.get(String(value49 || '')) || list3[0],
        el9 = el8?.querySelector('[data-toolbar-up-menu-label]');
      (el9 &&
        value50 &&
        (el9.textContent = value50.selectedLabel || value50.label || value49),
        el8?.querySelectorAll('[data-toolbar-up-menu-item]')?.forEach((el10) => {
          const enabled4 = map.get(String(el10.dataset.toolbarUpMenuValue || ''));
          if (!enabled4) return;
          el10.dataset.toolbarUpMenuLabel = enabled4.selectedLabel || enabled4.label;
          const el11 = el10.querySelector('.floating-menu-label');
          if (el11) el11.textContent = enabled4.label;
        }));
    };
    run('ratio', getExpandRatioOptions(), this.ratioStr);
  },
  _updateView(value51 = this._view) {
    if (!this.active) return;
    const box8 = value51?.node,
      box9 = value51?.viewport;
    if (!box8) return;
    this.nodeData = box8;
    if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
    this.frameRect = this._clampFrameRect(this.frameRect);
    const box10 = this.frameRect,
      box11 = worldToScreen(box10.x, box10.y, box9),
      value52 = Math.round(box10.w * box9.zoom),
      value53 = Math.round(box10.h * box9.zoom);
    ((this.frameEl.style.left = Math.round(box11.x) + 'px'),
      (this.frameEl.style.top = Math.round(box11.y) + 'px'),
      (this.frameEl.style.width = value52 + 'px'),
      (this.frameEl.style.height = value53 + 'px'));
    const center = worldToScreen(box8.x, box8.y, box9),
      value54 = Math.round(box8.width * box9.zoom),
      value55 = Math.round(box8.height * box9.zoom);
    ((this.imgEl.style.left = Math.round(center.x) + 'px'),
      (this.imgEl.style.top = Math.round(center.y) + 'px'),
      (this.imgEl.style.width = value54 + 'px'),
      (this.imgEl.style.height = value55 + 'px'),
      this.toolbarEl &&
        positionCanvasEditorToolbar(this.toolbarEl, {
          center: center.x + value54 / 2,
          top: center.y + value55 + 14,
        }));
  },
  _bindEvents() {
    const value56 = (event) => {
      if (event.key === 'Escape') this.exit();
    };
    window.addEventListener('keydown', value56);
    const value57 = (event2) => event2.stopPropagation();
    (this.overlayEl.addEventListener('wheel', value57, { passive: true }),
      this.toolbarEl.addEventListener('pointerdown', (event3) => event3.stopPropagation()),
      (this.toolbarEl.querySelector('.exit').onclick = () => this.exit()));
    const run2 = () => {
      (this._closeToolbarUpMenus(), this._functionControls?.closeMenus());
    };
    ((this._functionControls = bindImageFunctionControls(this.toolbarEl, {
      selection: this._functionSelection,
      onBeforeOpen: () => this._closeToolbarUpMenus(),
      onChange: (model3) => {
        ((this._functionSelection = model3),
          (this.model = model3.modelId),
          (this.provider = model3.provider),
          (this.imageSize = model3.generationParams.imageSize || this.imageSize),
          appStore.updateNodeData(this.nodeId, {
            model: model3.modelId,
            provider: model3.provider,
            generationParams: model3.generationParams,
            generationParamsByModel: model3.generationParamsByModel,
            providerProfileId: model3.providerProfileId,
            providerProfileIdByModel: model3.providerProfileIdByModel,
          }));
      },
      onResize: () => this.active && this._updateView(this._view),
    })),
      (this._unbindToolbarUpMenus = bindToolbarUpMenus(this.toolbarEl, {
        onBeforeOpen: () => this._functionControls?.closeMenus(),
        onSelect: ({ fieldId: fieldId, value: value58 }) => {
          if (fieldId !== 'ratio') return;
          ((this.ratioStr = String(value58 || 'original')),
            (this.frameRect = this._calcFrameWorldRect()),
            this._updateView(this._view));
        },
      })));
    const value59 = this.toolbarEl.querySelector('.debug-wrench-btn');
    ((value59.onclick = (event4) => {
      (event4.stopPropagation(),
        event4.preventDefault(),
        run2(),
        void this._handleDebug());
    }),
      (this.toolbarEl.querySelector('.go').onclick = async () => {
        const imageFunctionRequestSettings2 = getImageFunctionRequestSettings(this._functionSelection),
          value60 = this.ratioStr;
        let id = null,
          width2 = null,
          box12 = resolveInputRatioBasis();
        const model4 = String(this.model || '').trim(),
          provider3 = resolveImageTaskProvider(model4, this.provider, ''),
          isRunningHubTaskModel2 = isRunningHubTaskModel(model4, provider3),
          isDreaminaTaskModel2 = isDreaminaTaskModel(model4, provider3),
          value61 = !isRunningHubTaskModel2 && !isDreaminaTaskModel2,
          provider4 = String(provider3 || '')
            .trim()
            .toLowerCase(),
          useOpenapiQuery2 = shouldUseRunningHubOpenapiQuery(model4, provider3),
          startedAt2 = Date.now();
        try {
          window.showToast?.(imageExpandText('toasts.generating'), 'loading');
          const state4 = appStore.getStateRaw(),
            width3 = state4.nodes?.[this.nodeId];
          if (!width3) return;
          const width4 = { ...this.frameRect },
            value62 = { ...width3 };
          box12 = resolveInputRatioBasis(
            { width: width4?.w, height: width4?.h },
            { width: width3.width, height: width3.height },
          );
          const { width: width5, height: height2 } = calcDisplaySizeByMedia(
              box12.width,
              box12.height,
            ),
            { x: x6, y: y3 } = calcSafeSpawnPosNearNode(
              state4.nodes,
              width3,
              width5,
              height2,
            );
          id = generateId('source-image-expand');
          const run3 = () => {
            return isTaskCancelled(appStore.getState().nodes?.[id]);
          };
          appStore.addNode(
            buildSourceMediaNodePayload({
              id: id,
              type: 'source-image',
              x: x6,
              y: y3,
              width: width5,
              height: height2,
              needsAutoResize: false,
              name: imageExpandText('output.generatingName'),
              src: '',
              ...buildGenerationStartPatch({ startedAt: startedAt2 }),
              ...(isRunningHubTaskModel2 || isDreaminaTaskModel2 || value61 ? { provider: provider3, model: model4 } : {}),
              ...(isRunningHubTaskModel2 ? { rhSourceNodeId: width3.id, rhToolbarTaskType: 'image-expand' } : {}),
              ...(isRunningHubTaskModel2
                ? buildRunningHubTaskPatch({
                    taskId: '',
                    status: 'pending',
                    startedAt: startedAt2,
                    recovering: false,
                    useOpenapiQuery: useOpenapiQuery2,
                  })
                : {}),
              ...(isDreaminaTaskModel2
                ? buildDreaminaTaskPatch({
                    submitId: '',
                    status: 'pending',
                    phase: 'generating',
                    label: imageExpandText('task.submitting'),
                    startedAt: startedAt2,
                    recovering: false,
                  })
                : {}),
              ...(value61
                ? buildAsyncTaskPatch({
                    provider: provider4,
                    kind: 'image',
                    taskId: '',
                    status: 'pending',
                    startedAt: startedAt2,
                    recovering: false,
                  })
                : {}),
              outputText: buildImageExpandOutputText(getDisplayModelName(this.model)),
            }),
          );
          (isRunningHubTaskModel2 || isDreaminaTaskModel2 || value61) && persistRunningHubResumeCache();
          (appStore.setSelectedNodes([id]),
            this.exit(),
            (width2 = await this._createExpandedImage(width4, value62)),
            (box12 = resolveInputRatioBasis(
              { width: width2?.width, height: width2?.height },
              box12,
            )));
          const value63 = this._buildGenerationPayload(
              model4,
              provider3,
              width2.url,
              imageFunctionRequestSettings2,
              value60,
            ),
            error3 = await generateImage(value63, {
              onTaskMeta: ({
                taskId: taskId2,
                useOpenapiQuery: useOpenapiQuery3,
                provider: provider5,
                providerProfileId: providerProfileId,
                rhProviderProfileId: rhProviderProfileId,
              }) => {
                const taskId3 = String(taskId2 || '').trim();
                if (!taskId3) return;
                const enabled5 = appStore.getState().nodes?.[id];
                if (!enabled5) return;
                if (run3()) return;
                if (isRunningHubTaskModel2) {
                  const taskProviderProfileId = String(providerProfileId || rhProviderProfileId || '').trim();
                  (appStore.updateNodeData(id, {
                    ...(taskProviderProfileId
                      ? {
                          taskProviderProfileId: taskProviderProfileId,
                          providerProfileId: taskProviderProfileId,
                          rhProviderProfileId: taskProviderProfileId,
                        }
                      : {}),
                    ...buildRunningHubTaskPatch({
                      taskId: taskId3,
                      status: 'running',
                      startedAt: startedAt2,
                      recovering: false,
                      useOpenapiQuery: useOpenapiQuery3 === true,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                if (isDreaminaTaskModel2) {
                  (appStore.updateNodeData(id, {
                    ...buildDreaminaTaskPatch({
                      submitId: taskId3,
                      status: 'pending',
                      phase: 'generating',
                      label: imageExpandText('task.generating'),
                      startedAt: startedAt2,
                      recovering: false,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                value61 &&
                  (appStore.updateNodeData(id, {
                    ...buildAsyncTaskPatch({
                      provider: String(provider5 || enabled5?.asyncTaskProvider || provider4).trim(),
                      kind: 'image',
                      taskId: taskId3,
                      status: 'running',
                      startedAt: startedAt2,
                      recovering: false,
                    }),
                  }),
                  persistRunningHubResumeCache());
              },
              onTaskId: (value64) => {
                const taskId4 = String(value64 || '').trim();
                if (!taskId4) return;
                const useOpenapiQuery4 = appStore.getState().nodes?.[id];
                if (!useOpenapiQuery4) return;
                if (run3()) return;
                if (isRunningHubTaskModel2) {
                  (appStore.updateNodeData(id, {
                    ...buildRunningHubTaskPatch({
                      taskId: taskId4,
                      status: 'running',
                      startedAt: startedAt2,
                      recovering: false,
                      useOpenapiQuery: useOpenapiQuery4?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                if (isDreaminaTaskModel2) {
                  (appStore.updateNodeData(id, {
                    ...buildDreaminaTaskPatch({
                      submitId: taskId4,
                      status: 'pending',
                      phase: 'generating',
                      label: imageExpandText('task.generating'),
                      startedAt: startedAt2,
                      recovering: false,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                value61 &&
                  (appStore.updateNodeData(id, {
                    ...buildAsyncTaskPatch({
                      provider: String(useOpenapiQuery4?.asyncTaskProvider || provider4).trim(),
                      kind: 'image',
                      taskId: taskId4,
                      status: 'running',
                      startedAt: startedAt2,
                      recovering: false,
                    }),
                  }),
                  persistRunningHubResumeCache());
              },
            });
          if (run3()) return;
          if (error3.error) {
            const taskId5 = appStore.getState().nodes?.[id],
              duration = taskId5?.generationStartTime
                ? Date.now() - taskId5.generationStartTime
                : 0;
            appStore.updateNodeData(id, {
              ...buildImageGenerationFailurePatch({
                error: error3.error,
                startedAt: startedAt2,
                duration: duration,
              }),
              name: imageExpandText('output.failedName'),
              ...(isRunningHubTaskModel2
                ? buildRunningHubTaskPatch({
                    taskId: taskId5?.rhTaskId || '',
                    status: 'failed',
                    startedAt: startedAt2,
                    recovering: false,
                    useOpenapiQuery: taskId5?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
                  })
                : {}),
              ...(isDreaminaTaskModel2
                ? buildDreaminaTaskPatch({
                    submitId: taskId5?.dreaminaSubmitId || '',
                    status: 'failed',
                    phase: 'failed',
                    label: error3.error || imageExpandText('task.failed'),
                    startedAt: startedAt2,
                    recovering: false,
                  })
                : {}),
              ...(value61
                ? buildAsyncTaskPatch({
                    provider: taskId5?.asyncTaskProvider || provider4,
                    kind: 'image',
                    taskId: taskId5?.asyncTaskId || '',
                    status: 'failed',
                    startedAt: startedAt2,
                    recovering: false,
                  })
                : {}),
              outputText: buildImageExpandOutputText(getDisplayModelName(this.model), {
                error: error3.error,
              }),
            });
            (isRunningHubTaskModel2 || isDreaminaTaskModel2 || value61) && persistRunningHubResumeCache();
            return;
          }
          const taskId6 = appStore.getState().nodes?.[id],
            duration2 = taskId6?.generationStartTime
              ? Date.now() - taskId6.generationStartTime
              : 0,
            box13 = await resolveOutputMediaSize({
              localPath: error3.localPath,
              imageUrl: error3.imageUrl,
              sourceUrl: error3.sourceUrl,
              thumbUrl: error3.thumbUrl,
              src: error3.imageUrl || error3.sourceUrl || error3.thumbUrl || '',
            }),
            width6 =
              box13 &&
              shouldSwitchToOutputRatio(
                box12.width,
                box12.height,
                box13.width,
                box13.height,
                OUTPUT_RATIO_SWITCH_THRESHOLD,
              )
                ? calcDisplaySizeByMedia(box13.width, box13.height)
                : calcDisplaySizeByMedia(box12.width, box12.height);
          (appStore.updateNodeData(id, {
            ...buildImageGenerationResultPatch(error3, { startedAt: startedAt2, duration: duration2 }),
            name: imageExpandText('output.resultName'),
            width: width6.width,
            height: width6.height,
            ...(isRunningHubTaskModel2
              ? buildRunningHubTaskPatch({
                  taskId: taskId6?.rhTaskId || '',
                  status: 'success',
                  startedAt: startedAt2,
                  recovering: false,
                  useOpenapiQuery: taskId6?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
                })
              : {}),
            ...(isDreaminaTaskModel2
              ? buildDreaminaTaskPatch({
                  submitId: taskId6?.dreaminaSubmitId || '',
                  status: 'success',
                  phase: 'done',
                  label: imageExpandText('task.completed'),
                  startedAt: startedAt2,
                  recovering: false,
                })
              : {}),
            ...(value61
              ? buildAsyncTaskPatch({
                  provider: taskId6?.asyncTaskProvider || provider4,
                  kind: 'image',
                  taskId: taskId6?.asyncTaskId || '',
                  status: 'success',
                  startedAt: startedAt2,
                  recovering: false,
                })
              : {}),
            outputText: buildImageExpandOutputText(getDisplayModelName(this.model)),
          }),
            (isRunningHubTaskModel2 || isDreaminaTaskModel2 || value61) && persistRunningHubResumeCache(),
            window.showToast?.(imageExpandText('toasts.success'), 'success'));
        } catch (error4) {
          console.error('扩图生成失败:', error4);
          if (id) {
            const taskId7 = appStore.getState().nodes?.[id];
            if (isTaskCancelled(taskId7)) return;
            const duration3 = taskId7?.generationStartTime
                ? Date.now() - taskId7.generationStartTime
                : 0,
              error5 = error4.message || imageExpandText('errors.unknown');
            (appStore.updateNodeData(id, {
              ...buildImageGenerationFailurePatch({
                error: error5,
                startedAt: startedAt2,
                duration: duration3,
              }),
              name: imageExpandText('output.failedName'),
              ...(isRunningHubTaskModel2
                ? buildRunningHubTaskPatch({
                    taskId: taskId7?.rhTaskId || '',
                    status: 'failed',
                    startedAt: startedAt2,
                    recovering: false,
                    useOpenapiQuery: taskId7?.rhTaskUseOpenapiQuery === true || useOpenapiQuery2,
                  })
                : {}),
              ...(isDreaminaTaskModel2
                ? buildDreaminaTaskPatch({
                    submitId: taskId7?.dreaminaSubmitId || '',
                    status: 'failed',
                    phase: 'failed',
                    label: error5 || imageExpandText('task.failed'),
                    startedAt: startedAt2,
                    recovering: false,
                  })
                : {}),
              ...(value61
                ? buildAsyncTaskPatch({
                    provider: taskId7?.asyncTaskProvider || provider4,
                    kind: 'image',
                    taskId: taskId7?.asyncTaskId || '',
                    status: 'failed',
                    startedAt: startedAt2,
                    recovering: false,
                  })
                : {}),
              outputText: buildImageExpandOutputText(getDisplayModelName(this.model), {
                error: error5,
              }),
            }),
              (isRunningHubTaskModel2 || isDreaminaTaskModel2 || value61) && persistRunningHubResumeCache());
          } else
            window.showToast?.(
              imageExpandText('toasts.failed', {
                error: error4.message || imageExpandText('errors.unknown'),
              }),
              'error',
            );
        } finally {
          width2?.url && URL.revokeObjectURL(width2.url);
        }
      }));
    const value65 = (event5) => {
      if (
        !this.toolbarEl.contains(event5.target) &&
        !this._functionControls?.containsMenuTarget(event5.target)
      )
        run2();
    };
    document.addEventListener('pointerdown', value65, true);
    const run4 = () => {
        if (!this._pointerState) return;
        (window.removeEventListener('pointermove', value66, true),
          window.removeEventListener('pointerup', value67, true),
          window.removeEventListener('pointercancel', value67, true),
          (this._pointerState = null));
      },
      handler4 = () => this.ratioStr !== 'original',
      value66 = (event6) => {
        const event7 = this._pointerState;
        if (!event7 || event6.pointerId !== event7.pointerId) return;
        event6.preventDefault();
        const value68 = event7.zoom || this._view?.viewport?.zoom || 1,
          value69 = (event6.clientX - event7.startX) / value68,
          value70 = (event6.clientY - event7.startY) / value68,
          box14 = this._getNodeWorldRect(),
          handler5 = (value71, value72, value73) =>
            Math.min(value73, Math.max(value72, value71));
        if (event7.mode === 'drag') {
          const w3 = event7.startRect.w,
            h3 = event7.startRect.h;
          let x7 = event7.startRect.x + value69,
            y4 = event7.startRect.y + value70;
          ((x7 = handler5(x7, box14.x + box14.w - w3, box14.x)),
            (y4 = handler5(y4, box14.y + box14.h - h3, box14.y)),
            (this.frameRect = { x: x7, y: y4, w: w3, h: h3 }),
            this._updateView(this._view));
          return;
        }
        const value74 = event7.handle,
          value75 = Math.max(box14.w, 24),
          value76 = Math.max(box14.h, 24),
          handler6 = (args4) => {
            const box15 = { ...args4 },
              value77 = box14.x + box14.w - box15.w,
              value78 = box14.x,
              value79 = box14.y + box14.h - box15.h,
              value80 = box14.y;
            return (
              (box15.x = handler5(box15.x, value77, value78)),
              (box15.y = handler5(box15.y, value79, value80)),
              box15
            );
          },
          handler7 = (args5, value81) => {
            const box16 = { ...args5 };
            if (box16.w < value75) box16.w = value75;
            if (box16.h < value76) box16.h = value76;
            if (value81 === 'tl')
              ((box16.x = event7.startRect.x + event7.startRect.w - box16.w),
                (box16.y =
                  event7.startRect.y + event7.startRect.h - box16.h));
            else {
              if (value81 === 'tr')
                ((box16.x = event7.startRect.x),
                  (box16.y =
                    event7.startRect.y + event7.startRect.h - box16.h));
              else {
                if (value81 === 'bl')
                  ((box16.x =
                    event7.startRect.x + event7.startRect.w - box16.w),
                    (box16.y = event7.startRect.y));
                else {
                  if (value81 === 'br')
                    ((box16.x = event7.startRect.x),
                      (box16.y = event7.startRect.y));
                  else {
                    if (value81 === 'lm')
                      ((box16.x =
                        event7.startRect.x + event7.startRect.w - box16.w),
                        (box16.y = event7.startRect.y));
                    else {
                      if (value81 === 'rm')
                        ((box16.x = event7.startRect.x),
                          (box16.y = event7.startRect.y));
                      else {
                        if (value81 === 'tm')
                          ((box16.x = event7.startRect.x),
                            (box16.y =
                              event7.startRect.y + event7.startRect.h - box16.h));
                        else
                          value81 === 'bm' &&
                            ((box16.x = event7.startRect.x),
                            (box16.y = event7.startRect.y));
                      }
                    }
                  }
                }
              }
            }
            return box16;
          };
        if (!handler4()) {
          let box17 = { ...event7.startRect };
          if (value74 === 'tl')
            ((box17.x = event7.startRect.x + value69),
              (box17.y = event7.startRect.y + value70),
              (box17.w = event7.startRect.w - value69),
              (box17.h = event7.startRect.h - value70),
              (box17 = handler7(box17, 'tl')));
          else {
            if (value74 === 'tr')
              ((box17.y = event7.startRect.y + value70),
                (box17.w = event7.startRect.w + value69),
                (box17.h = event7.startRect.h - value70),
                (box17 = handler7(box17, 'tr')));
            else {
              if (value74 === 'bl')
                ((box17.x = event7.startRect.x + value69),
                  (box17.w = event7.startRect.w - value69),
                  (box17.h = event7.startRect.h + value70),
                  (box17 = handler7(box17, 'bl')));
              else {
                if (value74 === 'br')
                  ((box17.w = event7.startRect.w + value69),
                    (box17.h = event7.startRect.h + value70),
                    (box17 = handler7(box17, 'br')));
                else {
                  if (value74 === 'tm')
                    ((box17.y = event7.startRect.y + value70),
                      (box17.h = event7.startRect.h - value70),
                      (box17 = handler7(box17, 'tm')));
                  else {
                    if (value74 === 'bm')
                      ((box17.h = event7.startRect.h + value70),
                        (box17 = handler7(box17, 'bm')));
                    else {
                      if (value74 === 'lm')
                        ((box17.x = event7.startRect.x + value69),
                          (box17.w = event7.startRect.w - value69),
                          (box17 = handler7(box17, 'lm')));
                      else
                        value74 === 'rm' &&
                          ((box17.w = event7.startRect.w + value69),
                          (box17 = handler7(box17, 'rm')));
                    }
                  }
                }
              }
            }
          }
          ((this.frameRect = handler6(box17)), this._updateView(this._view));
          return;
        }
        const value82 = this._parseRatio(),
          value83 = event7.startRect.x + event7.startRect.w / 2,
          value84 = event7.startRect.y + event7.startRect.h / 2;
        let box18 = { ...event7.startRect };
        if (value74 === 'lm' || value74 === 'rm') {
          let value85 = event7.startRect.w + (value74 === 'rm' ? value69 : -value69);
          value85 = Math.max(value85, value75);
          let value86 = value85 / value82;
          (value86 < value76 && ((value86 = value76), (value85 = value86 * value82)),
            (box18.w = value85),
            (box18.h = value86),
            (box18.x =
              value74 === 'rm'
                ? event7.startRect.x
                : event7.startRect.x + event7.startRect.w - box18.w),
            (box18.y = value84 - box18.h / 2));
        } else {
          if (value74 === 'tm' || value74 === 'bm') {
            let value87 = event7.startRect.h + (value74 === 'bm' ? value70 : -value70);
            value87 = Math.max(value87, value76);
            let value88 = value87 * value82;
            (value88 < value75 && ((value88 = value75), (value87 = value88 / value82)),
              (box18.w = value88),
              (box18.h = value87),
              (box18.y =
                value74 === 'bm'
                  ? event7.startRect.y
                  : event7.startRect.y + event7.startRect.h - box18.h),
              (box18.x = value83 - box18.w / 2));
          } else {
            const value89 = value74 === 'tr' || value74 === 'br' ? 1 : -1,
              value90 = value74 === 'bl' || value74 === 'br' ? 1 : -1;
            let value91 = event7.startRect.w + value69 * value89,
              value92 = event7.startRect.h + value70 * value90;
            ((value91 = Math.max(value91, 1)), (value92 = Math.max(value92, 1)));
            value91 / value92 > value82
              ? (value92 = value91 / value82)
              : (value91 = value92 * value82);
            value91 < value75 && ((value91 = value75), (value92 = value91 / value82));
            value92 < value76 && ((value92 = value76), (value91 = value92 * value82));
            ((box18.w = value91), (box18.h = value92));
            if (value74 === 'br')
              ((box18.x = event7.startRect.x),
                (box18.y = event7.startRect.y));
            else {
              if (value74 === 'bl')
                ((box18.x =
                  event7.startRect.x + event7.startRect.w - box18.w),
                  (box18.y = event7.startRect.y));
              else
                value74 === 'tr'
                  ? ((box18.x = event7.startRect.x),
                    (box18.y =
                      event7.startRect.y + event7.startRect.h - box18.h))
                  : ((box18.x =
                      event7.startRect.x + event7.startRect.w - box18.w),
                    (box18.y =
                      event7.startRect.y + event7.startRect.h - box18.h));
            }
          }
        }
        ((this.frameRect = handler6(box18)), this._updateView(this._view));
      },
      value67 = (event8) => {
        const event9 = this._pointerState;
        if (!event9 || event8.pointerId !== event9.pointerId) return;
        (event8.preventDefault(), run4());
      },
      value93 = (pointerId) => {
        if (pointerId.button !== 0) return;
        (pointerId.stopPropagation(), pointerId.preventDefault());
        if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
        this.frameRect = this._clampFrameRect(this.frameRect);
        const el12 = pointerId.target.closest('.v2-expand-handle'),
          handle2 = el12?.dataset?.handle || null,
          mode = handle2 ? 'resize' : 'drag';
        ((this._pointerState = {
          pointerId: pointerId.pointerId,
          mode: mode,
          handle: handle2,
          startX: pointerId.clientX,
          startY: pointerId.clientY,
          startRect: { ...this.frameRect },
          zoom: this._view?.viewport?.zoom || 1,
        }),
          this.frameEl.setPointerCapture?.(pointerId.pointerId),
          window.addEventListener('pointermove', value66, true),
          window.addEventListener('pointerup', value67, true),
          window.addEventListener('pointercancel', value67, true));
      };
    (this.frameEl.addEventListener('pointerdown', value93),
      (this.cleanup = () => {
        (run4(),
          window.removeEventListener('keydown', value56),
          document.removeEventListener('pointerdown', value65, true),
          this.overlayEl?.removeEventListener('wheel', value57),
          this.frameEl?.removeEventListener('pointerdown', value93),
          this._unbindToolbarUpMenus?.(),
          (this._unbindToolbarUpMenus = null),
          this._unbindImageFunctionMenus?.(),
          (this._unbindImageFunctionMenus = null));
      }));
  },
  exit() {
    if (!this.active) return;
    (this._functionControls?.destroy(),
      (this._functionControls = null),
      this._cancelImageReadyWait?.(),
      (this._cancelImageReadyWait = null),
      (this.active = false));
    this._unsubscribe && (this._unsubscribe(), (this._unsubscribe = null));
    (this._unsubscribeViewportPreview?.(), (this._unsubscribeViewportPreview = null));
    this._unsubscribeLocale && (this._unsubscribeLocale(), (this._unsubscribeLocale = null));
    (this.cleanup?.(), (this.cleanup = null));
    const el13 = this.overlayEl,
      el14 = this.toolbarEl;
    (el13?.classList.remove('visible'),
      (this.overlayEl = null),
      (this.toolbarEl = null),
      (this.nodeId = null),
      (this.nodeData = null),
      (this.frameRect = null),
      (this._view = null),
      (this._expandModelCatalog = null),
      (this.ratioMenuEl = null),
      (this.sizeMenuEl = null),
      setTimeout(() => {
        (el13?.remove(), el14?.remove());
      }, 200));
  },
};
export default ImageExpandController;

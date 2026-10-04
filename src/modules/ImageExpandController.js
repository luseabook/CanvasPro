import appStore from '../core/stores/appStore.js';
import { worldToScreen, generateId } from '../core/math.js';
import { getDisplayModelName } from './providers.js';
import { IMAGE_MODELS } from '../config/modelConfig.js';
import { buildGenerateImageRequest, generateImage } from '../../api/aiImageApi.js';
import { calcSafeSpawnPosNearNode } from './nodeSpawn.js';
import { buildSourceMediaNodePayload } from '../services/fileService.js';
import {
  OUTPUT_RATIO_SWITCH_THRESHOLD,
  calcDisplaySizeByMedia,
  resolveInputRatioBasis,
  resolveOutputMediaSize,
  shouldSwitchToOutputRatio,
} from '../services/mediaRatioService.js';
import {
  bindImageFunctionModeMenu,
  bindImageFunctionModelMenu,
  buildImageFunctionModeControlHTML,
  buildImageFunctionModelCatalog,
  buildImageFunctionModelMenuHTML,
  closeImageFunctionModelSubmenus,
  findImageFunctionProviderByModel,
  getDefaultImageFunctionModelState,
  getImageFunctionNanoSelection,
  getImageFunctionModelDisplayName,
  getImageFunctionModelTriggerIconHTML,
  resolveImageFunctionModelByMode,
  syncImageFunctionModeControl,
  syncImageFunctionModelMenuActive,
} from './imageFunctionModelMenu.js';
import { shouldDisableImageSizeControl } from './imageModelCapabilities.js';
import { DEBUG_WRENCH_ICON_HTML, formatFinalApiDebugRequest } from '../utils/debugRequestPreview.js';
import { localPathToUrl } from '../utils/localMediaPath.js';
import { bindToolbarUpMenus, renderToolbarUpMenu } from './imageToolbarUpMenu.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from '../components/aigenImage/imageGenerationResultRenderer.js';
import { buildGenerationStartPatch } from '../core/generationTaskLifecycle.js';
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
  ],
  EXPAND_IMAGE_SIZE_OPTIONS = [
    { value: '1K', label: '1K' },
    { value: '2K', label: '2K' },
    { value: '4K', label: '4K' },
  ];
function getExpandRatioOptions() {
  return EXPAND_RATIO_OPTIONS.map((label2) => ({
    ...label2,
    label: label2.labelKey ? imageExpandText(label2.labelKey) : label2.label,
    selectedLabel: label2.value === 'original' ? imageExpandText('ratio.selectedOriginal') : label2.label,
  }));
}
function getExpandImageSizeOptions({ disabled: disabled = false } = {}) {
  return EXPAND_IMAGE_SIZE_OPTIONS.map((args) => ({ ...args, disabled: disabled }));
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
  return {
    rhTaskId: String(taskId || '').trim(),
    rhTaskStatus: String(status || 'pending').trim() || 'pending',
    rhTaskStartedAt: Number(startedAt || 0),
    rhTaskRecovering: recovering === true,
    rhTaskUseOpenapiQuery: useOpenapiQuery === true,
  };
}
function buildDreaminaTaskPatch({
  submitId: submitId = '',
  status: status = 'pending',
  phase: phase = 'generating',
  label: label = imageExpandText('task.generating'),
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) {
  return {
    dreaminaSubmitId: String(submitId || '').trim(),
    dreaminaTaskStatus: String(status || 'pending').trim() || 'pending',
    dreaminaTaskPhase: String(phase || 'generating').trim() || 'generating',
    dreaminaTaskLabel:
      String(label || imageExpandText('task.generating')).trim() || imageExpandText('task.generating'),
    dreaminaTaskStartedAt: Number(startedAt || 0),
    dreaminaTaskLastCheckedAt: Date.now(),
    dreaminaTaskRecovering: recovering === true,
    dreaminaTaskLastRaw: {},
  };
}
function buildAsyncTaskPatch({
  provider: provider = '',
  kind: kind = 'image',
  taskId: taskId = '',
  status: status = 'pending',
  startedAt: startedAt = 0,
  recovering: recovering = false,
} = {}) {
  return {
    asyncTaskProvider: String(provider || '').trim(),
    asyncTaskKind: String(kind || 'image').trim() || 'image',
    asyncTaskId: String(taskId || '').trim(),
    asyncTaskStatus: String(status || 'pending').trim() || 'pending',
    asyncTaskStartedAt: Number(startedAt || 0),
    asyncTaskRecovering: recovering === true,
  };
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
    if (list.some((item2) => item2?.id === enabled)) return next;
  }
  return findImageFunctionProviderByModel(target, enabled);
}
function buildSeedreamMigrationPatch(entry) {
  return (void entry, null);
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
  _view: null,
  _expandModelCatalog: null,
  _unbindToolbarUpMenus: null,
  _unsubscribeLocale: null,
  cleanup: null,
  init(record) {
    if (this.active) return;
    const viewport = appStore.getStateRaw(),
      enabled2 = viewport.nodes?.[record];
    if (!enabled2) return;
    ((this.active = true), (this.nodeId = record), (this._expandModelCatalog = buildExpandModelCatalog()));
    const node = this._normalizeLegacySeedreamNode(enabled2);
    ((this.nodeData = node),
      (this._view = { viewport: viewport.viewport, node: node }),
      (this.ratioStr = 'original'),
      (this.imageSize = '1K'));
    const payload = this._getExpandModelCatalog(),
      defaultImageFunctionModelState = getDefaultImageFunctionModelState(payload),
      handle = String(node?.model || '').trim(),
      state = String(node?.provider || '').trim(),
      providerKeyByModel = findProviderKeyByModel(payload, handle);
    if (providerKeyByModel) ((this.model = handle), (this.provider = providerKeyByModel));
    else
      defaultImageFunctionModelState.model
        ? ((this.model = defaultImageFunctionModelState.model),
          (this.provider = defaultImageFunctionModelState.provider))
        : ((this.model = handle || ''),
          (this.provider = resolveImageTaskProvider(
            handle,
            state,
            defaultImageFunctionModelState.provider || '',
          )));
    (this._createUI(),
      this._bindEvents(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      (this._unsubscribe = appStore.subscribeSelector(
        (config) => {
          const nx = config.nodes?.[record],
            vx = config.viewport || { x: 0, y: 0, zoom: 1 };
          return {
            hasNode: !!nx,
            vx: vx.x,
            vy: vx.y,
            vz: vx.zoom || 1,
            nx: nx ? nx.x : 0,
            ny: nx ? nx.y : 0,
            nw: nx ? nx.width : 0,
            nh: nx ? nx.height : 0,
          };
        },
        (x2) => {
          if (!x2?.hasNode) return;
          const enabled3 = appStore.getStateRaw().nodes?.[record];
          if (!enabled3) return;
          const node2 = this._normalizeLegacySeedreamNode(enabled3);
          ((this.nodeData = node2),
            (this._view = {
              viewport: { x: x2.vx, y: x2.vy, zoom: x2.vz },
              node: node2,
            }),
            this._updateView(this._view));
        },
      )),
      this._waitForImageAndShow());
  },
  _waitForImageAndShow() {
    const run = () => {
      this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0
        ? (this._updateView(this._view),
          requestAnimationFrame(() => {
            if (this.overlayEl) this.overlayEl.classList.add('visible');
          }))
        : requestAnimationFrame(run);
    };
    run();
  },
  _getExpandModelCatalog() {
    return (
      !this._expandModelCatalog && (this._expandModelCatalog = buildExpandModelCatalog()),
      this._expandModelCatalog
    );
  },
  _normalizeLegacySeedreamNode(scope) {
    const args2 = buildSeedreamMigrationPatch(scope);
    if (!args2) return scope;
    const input = { ...(scope || {}), ...args2 },
      output = appStore.getStateRaw().nodes?.[this.nodeId];
    return (output && appStore.updateNodeData(this.nodeId, args2), input);
  },
  _getImageUrl() {
    const value2 = this.nodeData || {};
    return localPathToUrl(value2.localPath) || value2.src || value2.imageUrl || value2.sourceUrl;
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
      const url2 = localPathToUrl(x3.localPath) || x3.src || x3.imageUrl || x3.sourceUrl;
      image.src = url2;
    });
  },
  _buildGenerationPayload(model2, provider2, value12) {
    const value13 = this.ratioStr === 'original';
    return {
      prompt: IMAGE_EXPAND_PROMPT,
      model: model2,
      provider: provider2,
      ...(value13 ? { suppressAspectRatio: true } : { aspectRatio: this.ratioStr }),
      imageSize: this.imageSize,
      inputUrls: [value12],
      batchSize: 1,
    };
  },
  _formatDebugRequest(value14) {
    return formatFinalApiDebugRequest(value14);
  },
  _upsertDebugNode(outputText, value15) {
    const value16 = appStore.getStateRaw(),
      value17 = value15 || value16.nodes?.[this.nodeId] || this.nodeData || {},
      { x: x4, y: y2 } = calcSafeSpawnPosNearNode(value16.nodes, value17, 0x17c, 0x12c),
      enabled4 = Object.values(value16.nodes).find((item3) => item3.type === 'debug');
    !enabled4
      ? appStore.addNode({
          id: 'debug-' + Date.now(),
          type: 'debug',
          x: x4,
          y: y2,
          width: 0x17c,
          height: 0x12c,
          name: imageExpandText('debug.nodeName'),
          outputText: outputText,
        })
      : appStore.updateNodeData(enabled4.id, { outputText: outputText, x: x4, y: y2 });
  },
  async _handleDebug() {
    let response = null;
    try {
      const value18 = appStore.getStateRaw(),
        args3 = value18.nodes?.[this.nodeId];
      if (!args3) {
        window.showToast?.(imageExpandText('toasts.sourceNodeMissing'), 'warn');
        return;
      }
      if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
      const value19 = String(this.model || '').trim(),
        imageTaskProvider = resolveImageTaskProvider(value19, this.provider, '');
      response = await this._createExpandedImage({ ...this.frameRect }, { ...args3 });
      const value20 = this._buildGenerationPayload(value19, imageTaskProvider, response.url),
        generateImageRequest = await buildGenerateImageRequest(value20);
      (this._upsertDebugNode(this._formatDebugRequest(generateImageRequest), args3),
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
    if (this.ratioStr === 'original') return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    const list2 = this.ratioStr.split(':').map((item4) => Number(item4));
    if (list2.length !== 2 || !list2[0] || !list2[1])
      return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    return list2[0] / list2[1];
  },
  _calcFrameWorldRect() {
    const box4 = this.nodeData,
      value21 = box4.width || 1,
      value22 = box4.height || 1,
      x5 = box4.x + value21 / 2,
      y3 = box4.y + value22 / 2,
      value23 = value21 / value22,
      value24 = this._parseRatio();
    let value25, value26;
    value24 >= value23
      ? ((value26 = value22), (value25 = value22 * value24))
      : ((value25 = value21), (value26 = value21 / value24));
    const value27 = 1.35,
      w = Math.max(value21, value25) * value27,
      h = Math.max(value22, value26) * value27;
    return { x: x5 - w / 2, y: y3 - h / 2, w: w, h: h };
  },
  _getNodeWorldRect() {
    const x6 = this.nodeData || {},
      w2 = x6.width || 1,
      h2 = x6.height || 1;
    return { x: x6.x || 0, y: x6.y || 0, w: w2, h: h2 };
  },
  _clampFrameRect(box5) {
    const box6 = this._getNodeWorldRect(),
      handler3 = (value28, value29, value30) => Math.min(value30, Math.max(value29, value28)),
      box7 = {
        x: Number(box5?.x) || 0,
        y: Number(box5?.y) || 0,
        w: Number(box5?.w) || 1,
        h: Number(box5?.h) || 1,
      },
      value31 = Math.max(box6.w, 24),
      value32 = Math.max(box6.h, 24);
    ((box7.w = Math.max(box7.w, value31)), (box7.h = Math.max(box7.h, value32)));
    if (this.ratioStr !== 'original') {
      const value33 = this._parseRatio(),
        value34 = box7.x + box7.w / 2,
        value35 = box7.y + box7.h / 2;
      let value36 = box7.w,
        value37 = box7.h;
      (value36 / value37 > value33 ? (value37 = value36 / value33) : (value36 = value37 * value33),
        value36 < value31 && ((value36 = value31), (value37 = value36 / value33)),
        value37 < value32 && ((value37 = value32), (value36 = value37 * value33)),
        (box7.w = value36),
        (box7.h = value37),
        (box7.x = value34 - box7.w / 2),
        (box7.y = value35 - box7.h / 2));
    }
    const value38 = box6.x + box6.w - box7.w,
      value39 = box6.x,
      value40 = box6.y + box6.h - box7.h,
      value41 = box6.y;
    return (
      (box7.x = handler3(box7.x, value38, value39)),
      (box7.y = handler3(box7.y, value40, value41)),
      box7
    );
  },
  _closeToolbarUpMenus(value42 = null) {
    this.toolbarEl?.querySelectorAll('[data-toolbar-up-menu-menu]').forEach((el) => {
      if (el === value42) return;
      const value43 = String(el?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
      (el.classList.remove(value43), el.classList.remove('open'), el.classList.remove('show'));
    });
  },
  _createUI() {
    const el2 = document.createElement('div');
    el2.className = 'v2-expand-overlay';
    const el3 = document.createElement('div');
    ((el3.className = 'v2-expand-frame'),
      ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'lm', 'rm'].forEach((item5) => {
        const el4 = document.createElement('div');
        ((el4.className = 'v2-expand-handle ' + item5), (el4.dataset.handle = item5), el3.appendChild(el4));
      }));
    const value44 = document.createElement('img');
    ((value44.className = 'v2-expand-img'),
      (value44.draggable = false),
      (value44.src = this._getImageUrl()),
      el2.appendChild(el3),
      el2.appendChild(value44),
      document.body.appendChild(el2),
      (this.overlayEl = el2),
      (this.frameEl = el3),
      (this.imgEl = value44),
      (this.frameRect = this._calcFrameWorldRect()));
    const el5 = document.createElement('div');
    el5.className = 'v2-expand-toolbar';
    const modelCatalog = this._getExpandModelCatalog(),
      imageFunctionModelDisplayName = getImageFunctionModelDisplayName(this.model, modelCatalog),
      imageFunctionModelTriggerIconHTML = getImageFunctionModelTriggerIconHTML(this.model, this.provider),
      disabled2 = shouldDisableImageSizeControl(this.model, this.provider),
      imageFunctionModelMenuHTML = buildImageFunctionModelMenuHTML({
        activeModel: this.model,
        activeProvider: this.provider,
        modelCatalog: modelCatalog,
      });
    ((el5.innerHTML =
      '\n      <button class="v2-expand-toolbar-btn exit" title="' +
      imageExpandText('actions.exit') +
      '">\n        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>\n      </button>\n      <div class="v2-expand-divider"></div>\n      ' +
      renderToolbarUpMenu({
        fieldId: 'ratio',
        value: this.ratioStr,
        options: getExpandRatioOptions(),
        triggerClass: 'ratio-toggle',
        labelClass: 'ratio-text',
        menuClass: 'v2-expand-menu ratio-menu',
        itemClass: 'v2-expand-menu-item',
      }) +
      '\n      ' +
      renderToolbarUpMenu({
        fieldId: 'size',
        value: this.imageSize,
        options: getExpandImageSizeOptions({ disabled: disabled2 }),
        triggerClass: 'size-toggle',
        labelClass: 'size-text',
        menuClass: 'v2-expand-menu size-menu',
        itemClass: 'v2-expand-menu-item',
        disabled: disabled2,
      }) +
      '\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn model-toggle">\n          <span class="image-function-model-trigger-icon-slot">' +
      imageFunctionModelTriggerIconHTML +
      '</span>\n          <span class="model-text">' +
      imageFunctionModelDisplayName +
      '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu model-menu">\n          ' +
      imageFunctionModelMenuHTML +
      '\n        </div>\n      </div>\n      ' +
      buildImageFunctionModeControlHTML({
        model: this.model,
        provider: this.provider,
        imageSize: this.imageSize,
        wrapClass: 'v2-expand-wrap',
        buttonClass: 'v2-expand-toolbar-btn',
      }) +
      '\n      <button class="v2-expand-toolbar-btn debug-wrench-btn" type="button" title="' +
      imageExpandText('actions.debugApiParams') +
      '" aria-label="' +
      imageExpandText('actions.debugApiParams') +
      '">\n        ' +
      DEBUG_WRENCH_ICON_HTML +
      '\n      </button>\n      <button class="v2-expand-toolbar-btn go img-gen-btn" title="' +
      imageExpandText('actions.generate') +
      '">\n        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>\n      </button>\n    '),
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
    const value45 = this.toolbarEl.querySelector('.exit');
    if (value45) value45.title = imageExpandText('actions.exit');
    const el6 = this.toolbarEl.querySelector('.debug-wrench-btn');
    if (el6) {
      const imageExpandText2 = imageExpandText('actions.debugApiParams');
      ((el6.title = imageExpandText2), el6.setAttribute('aria-label', imageExpandText2));
    }
    const value46 = this.toolbarEl.querySelector('.go');
    if (value46) value46.title = imageExpandText('actions.generate');
    const run2 = (value47, list3, value48) => {
      const map = new Map(list3.map((el7) => [String(el7.value || ''), el7])),
        el8 = this.toolbarEl.querySelector('[data-toolbar-up-menu="' + value47 + '"]'),
        value49 = map.get(String(value48 || '')) || list3[0],
        el9 = el8?.querySelector('[data-toolbar-up-menu-label]');
      (el9 && value49 && (el9.textContent = value49.selectedLabel || value49.label || value48),
        el8?.querySelectorAll('[data-toolbar-up-menu-item]')?.forEach((el10) => {
          const enabled5 = map.get(String(el10.dataset.toolbarUpMenuValue || ''));
          if (!enabled5) return;
          el10.dataset.toolbarUpMenuLabel = enabled5.selectedLabel || enabled5.label;
          const el11 = el10.querySelector('.floating-menu-label');
          if (el11) el11.textContent = enabled5.label;
        }));
    };
    (run2('ratio', getExpandRatioOptions(), this.ratioStr),
      run2(
        'size',
        getExpandImageSizeOptions({ disabled: shouldDisableImageSizeControl(this.model, this.provider) }),
        this.imageSize,
      ));
  },
  _updateView(value50 = this._view) {
    if (!this.active) return;
    const box8 = value50?.node,
      box9 = value50?.viewport;
    if (!box8) return;
    this.nodeData = box8;
    if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
    this.frameRect = this._clampFrameRect(this.frameRect);
    const box10 = this.frameRect,
      box11 = worldToScreen(box10.x, box10.y, box9),
      value51 = Math.round(box10.w * box9.zoom),
      value52 = Math.round(box10.h * box9.zoom);
    ((this.frameEl.style.left = Math.round(box11.x) + 'px'),
      (this.frameEl.style.top = Math.round(box11.y) + 'px'),
      (this.frameEl.style.width = value51 + 'px'),
      (this.frameEl.style.height = value52 + 'px'));
    const box12 = worldToScreen(box8.x, box8.y, box9),
      value53 = Math.round(box8.width * box9.zoom),
      value54 = Math.round(box8.height * box9.zoom);
    ((this.imgEl.style.left = Math.round(box12.x) + 'px'),
      (this.imgEl.style.top = Math.round(box12.y) + 'px'),
      (this.imgEl.style.width = value53 + 'px'),
      (this.imgEl.style.height = value54 + 'px'));
    if (this.toolbarEl) {
      const value55 = box12.y + value54 + 14;
      ((this.toolbarEl.style.top = value55 + 'px'),
        (this.toolbarEl.style.left = box12.x + value53 / 2 + 'px'),
        (this.toolbarEl.style.transform = 'translateX(-50%)'),
        (this.toolbarEl.style.bottom = 'auto'));
    }
  },
  _bindEvents() {
    const value56 = () => this._updateView(this._view);
    window.addEventListener('resize', value56);
    const value57 = (event) => {
      if (event.key === 'Escape') this.exit();
    };
    window.addEventListener('keydown', value57);
    const value58 = (event2) => event2.stopPropagation();
    this.overlayEl.addEventListener('wheel', value58, { passive: false });
    const modelMenu = this.modelMenuEl,
      el12 = this.toolbarEl.querySelector('.model-text'),
      el13 = this.toolbarEl.querySelector('.image-function-model-trigger-icon-slot'),
      el14 = this.toolbarEl.querySelector('.model-toggle'),
      el15 = this.toolbarEl.querySelector('.image-function-mode-toggle'),
      modeMenu = this.toolbarEl.querySelector('.image-function-mode-menu'),
      value59 = this._getExpandModelCatalog(),
      handler4 = () => {
        const shouldDisableImageSizeControl2 = shouldDisableImageSizeControl(this.model, this.provider),
          el16 = this.toolbarEl.querySelector('.size-toggle');
        (el16 &&
          ((el16.disabled = shouldDisableImageSizeControl2),
          el16.classList.toggle('is-disabled', shouldDisableImageSizeControl2),
          el16.setAttribute('aria-disabled', shouldDisableImageSizeControl2 ? 'true' : 'false')),
          this.sizeMenuEl?.querySelectorAll('[data-toolbar-up-menu-field="size"]').forEach((el17) => {
            (el17.classList.toggle('disabled', shouldDisableImageSizeControl2),
              (el17.dataset.disabled = shouldDisableImageSizeControl2 ? 'true' : 'false'));
          }),
          shouldDisableImageSizeControl2 && this.sizeMenuEl?.classList.remove('open'));
      },
      handler5 = () =>
        syncImageFunctionModeControl({
          root: this.toolbarEl,
          model: this.model,
          provider: this.provider,
          imageSize: this.imageSize,
        }),
      handler6 = (value60, value61, { syncStore: syncStore = true } = {}) => {
        const model3 = String(value60 || '').trim(),
          provider3 = String(resolveImageTaskProvider(model3, value61, '')).trim();
        if (!model3 || !provider3) return;
        const value62 = this.model !== model3 || this.provider !== provider3;
        ((this.model = model3),
          (this.provider = provider3),
          el12 && (el12.textContent = getImageFunctionModelDisplayName(model3, value59)),
          el13 && (el13.innerHTML = getImageFunctionModelTriggerIconHTML(model3, provider3)),
          syncImageFunctionModelMenuActive({ modelMenu: modelMenu, model: model3, provider: provider3 }),
          handler5(),
          handler4(),
          syncStore &&
            value62 &&
            appStore.updateNodeData(this.nodeId, { model: model3, provider: provider3 }));
      },
      handler7 = () => {
        (this._closeToolbarUpMenus(),
          this.modelMenuEl?.classList.remove('show'),
          modeMenu?.classList.remove('show'),
          closeImageFunctionModelSubmenus(this.modelMenuEl));
      };
    ((this.toolbarEl.querySelector('.exit').onclick = () => this.exit()),
      (this._unbindToolbarUpMenus = bindToolbarUpMenus(this.toolbarEl, {
        onBeforeOpen: () => {
          (this.modelMenuEl?.classList.remove('show'),
            modeMenu?.classList.remove('show'),
            closeImageFunctionModelSubmenus(this.modelMenuEl));
        },
        onSelect: ({ fieldId: fieldId, value: value63 }) => {
          if (fieldId === 'ratio') {
            ((this.ratioStr = String(value63 || 'original').trim() || 'original'),
              (this.frameRect = this._calcFrameWorldRect()),
              this._updateView(this._view));
            return;
          }
          if (fieldId === 'size') {
            if (shouldDisableImageSizeControl(this.model, this.provider)) return;
            this.imageSize = String(value63 || '1K').trim() || '1K';
            const mode = getImageFunctionNanoSelection(this.model, this.provider, this.imageSize);
            if (mode) {
              const imageFunctionModelByMode = resolveImageFunctionModelByMode({
                model: this.model,
                provider: this.provider,
                imageSize: this.imageSize,
                mode: mode.mode,
              });
              imageFunctionModelByMode?.model &&
                handler6(imageFunctionModelByMode.model, imageFunctionModelByMode.provider);
            }
            (handler5(), handler4());
          }
        },
      })));
    if (el14 && modelMenu && el12) {
      el14.addEventListener('click', (event3) => {
        (event3.stopPropagation(),
          modelMenu.classList.toggle('show'),
          this._closeToolbarUpMenus(),
          modeMenu?.classList.remove('show'));
      });
      const bindImageFunctionModelMenu2 = bindImageFunctionModelMenu({
          modelMenu: modelMenu,
          onSelect: ({ model: model4, provider: provider4 }) => {
            handler6(model4, provider4);
          },
          closeMenu: () => {
            modelMenu.classList.remove('show');
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
            (handler6(imageFunctionModelByMode2.model, imageFunctionModelByMode2.provider),
              modeMenu?.classList.remove('show'));
          },
        });
      (el15 &&
        modeMenu &&
        el15.addEventListener('click', (event4) => {
          event4.stopPropagation();
          if (el15.closest('.image-function-mode-wrap')?.classList.contains('is-hidden')) return;
          (modeMenu.classList.toggle('show'),
            this._closeToolbarUpMenus(modeMenu),
            modelMenu.classList.remove('show'),
            closeImageFunctionModelSubmenus(modelMenu));
        }),
        (this._unbindImageFunctionMenus = () => {
          (bindImageFunctionModelMenu2?.(), bindImageFunctionModeMenu2?.());
        }));
    }
    (handler5(), handler4());
    const value64 = this.toolbarEl.querySelector('.debug-wrench-btn');
    ((value64.onclick = (event5) => {
      (event5.stopPropagation(), event5.preventDefault(), handler7(), void this._handleDebug());
    }),
      (this.toolbarEl.querySelector('.go').onclick = async () => {
        let id = null,
          width2 = null,
          box13 = resolveInputRatioBasis();
        const model5 = String(this.model || '').trim(),
          provider5 = resolveImageTaskProvider(model5, this.provider, ''),
          isRunningHubTaskModel2 = isRunningHubTaskModel(model5, provider5),
          isDreaminaTaskModel2 = isDreaminaTaskModel(model5, provider5),
          value65 = !isRunningHubTaskModel2 && !isDreaminaTaskModel2,
          provider6 = String(provider5 || '')
            .trim()
            .toLowerCase(),
          useOpenapiQuery2 = shouldUseRunningHubOpenapiQuery(model5, provider5),
          startedAt2 = Date.now();
        try {
          window.showToast?.(imageExpandText('toasts.generating'), 'loading');
          const value66 = appStore.getStateRaw(),
            width3 = value66.nodes?.[this.nodeId];
          if (!width3) return;
          const value67 = { ...this.frameRect },
            value68 = { ...width3 };
          ((width2 = await this._createExpandedImage(value67, value68)),
            (box13 = resolveInputRatioBasis(
              { width: width2?.width, height: width2?.height },
              { width: width3.width, height: width3.height },
            )));
          const { width: width4, height: height2 } = calcDisplaySizeByMedia(box13.width, box13.height),
            { x: x7, y: y4 } = calcSafeSpawnPosNearNode(value66.nodes, width3, width4, height2);
          id = generateId('source-image-expand');
          const run3 = () => {
            return isTaskCancelled(appStore.getState().nodes?.[id]);
          };
          appStore.addNode(
            buildSourceMediaNodePayload({
              id: id,
              type: 'source-image',
              x: x7,
              y: y4,
              width: width4,
              height: height2,
              needsAutoResize: false,
              name: imageExpandText('output.generatingName'),
              src: '',
              ...buildGenerationStartPatch({ startedAt: startedAt2 }),
              ...(isRunningHubTaskModel2 || isDreaminaTaskModel2 || value65
                ? { provider: provider5, model: model5 }
                : {}),
              ...(isRunningHubTaskModel2
                ? { rhSourceNodeId: width3.id, rhToolbarTaskType: 'image-expand' }
                : {}),
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
              ...(value65
                ? buildAsyncTaskPatch({
                    provider: provider6,
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
          (isRunningHubTaskModel2 || isDreaminaTaskModel2 || value65) && persistRunningHubResumeCache();
          appStore.setSelectedNodes([id]);
          typeof window.v2FocusOnNodes === 'function'
            ? window.v2FocusOnNodes([width3.id, id])
            : window.v2FocusOnNode?.(id);
          this.exit();
          const value69 = this._buildGenerationPayload(model5, provider5, width2.url),
            error3 = await generateImage(value69, {
              onTaskMeta: ({ taskId: taskId2, useOpenapiQuery: useOpenapiQuery3, provider: provider7 }) => {
                const taskId3 = String(taskId2 || '').trim();
                if (!taskId3) return;
                const enabled6 = appStore.getState().nodes?.[id];
                if (!enabled6) return;
                if (run3()) return;
                if (isRunningHubTaskModel2) {
                  (appStore.updateNodeData(id, {
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
                value65 &&
                  (appStore.updateNodeData(id, {
                    ...buildAsyncTaskPatch({
                      provider: String(provider7 || enabled6?.asyncTaskProvider || provider6).trim(),
                      kind: 'image',
                      taskId: taskId3,
                      status: 'running',
                      startedAt: startedAt2,
                      recovering: false,
                    }),
                  }),
                  persistRunningHubResumeCache());
              },
              onTaskId: (value70) => {
                const taskId4 = String(value70 || '').trim();
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
                value65 &&
                  (appStore.updateNodeData(id, {
                    ...buildAsyncTaskPatch({
                      provider: String(useOpenapiQuery4?.asyncTaskProvider || provider6).trim(),
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
              duration = taskId5?.generationStartTime ? Date.now() - taskId5.generationStartTime : 0;
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
              ...(value65
                ? buildAsyncTaskPatch({
                    provider: taskId5?.asyncTaskProvider || provider6,
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
            (isRunningHubTaskModel2 || isDreaminaTaskModel2 || value65) && persistRunningHubResumeCache();
            return;
          }
          const taskId6 = appStore.getState().nodes?.[id],
            duration2 = taskId6?.generationStartTime ? Date.now() - taskId6.generationStartTime : 0,
            box14 = await resolveOutputMediaSize({
              localPath: error3.localPath,
              imageUrl: error3.imageUrl,
              sourceUrl: error3.sourceUrl,
              thumbUrl: error3.thumbUrl,
              src: error3.imageUrl || error3.sourceUrl || error3.thumbUrl || '',
            }),
            width5 =
              box14 &&
              shouldSwitchToOutputRatio(
                box13.width,
                box13.height,
                box14.width,
                box14.height,
                OUTPUT_RATIO_SWITCH_THRESHOLD,
              )
                ? calcDisplaySizeByMedia(box14.width, box14.height)
                : calcDisplaySizeByMedia(box13.width, box13.height);
          (appStore.updateNodeData(id, {
            ...buildImageGenerationResultPatch(error3, { startedAt: startedAt2, duration: duration2 }),
            name: imageExpandText('output.resultName'),
            width: width5.width,
            height: width5.height,
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
            ...(value65
              ? buildAsyncTaskPatch({
                  provider: taskId6?.asyncTaskProvider || provider6,
                  kind: 'image',
                  taskId: taskId6?.asyncTaskId || '',
                  status: 'success',
                  startedAt: startedAt2,
                  recovering: false,
                })
              : {}),
            outputText: buildImageExpandOutputText(getDisplayModelName(this.model)),
          }),
            (isRunningHubTaskModel2 || isDreaminaTaskModel2 || value65) && persistRunningHubResumeCache(),
            window.showToast?.(imageExpandText('toasts.success'), 'success'));
        } catch (error4) {
          console.error('扩图生成失败:', error4);
          if (id) {
            const taskId7 = appStore.getState().nodes?.[id];
            if (isTaskCancelled(taskId7)) return;
            const duration3 = taskId7?.generationStartTime ? Date.now() - taskId7.generationStartTime : 0,
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
              ...(value65
                ? buildAsyncTaskPatch({
                    provider: taskId7?.asyncTaskProvider || provider6,
                    kind: 'image',
                    taskId: taskId7?.asyncTaskId || '',
                    status: 'failed',
                    startedAt: startedAt2,
                    recovering: false,
                  })
                : {}),
              outputText: buildImageExpandOutputText(getDisplayModelName(this.model), { error: error5 }),
            }),
              (isRunningHubTaskModel2 || isDreaminaTaskModel2 || value65) && persistRunningHubResumeCache());
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
    const value71 = (event6) => {
      if (!this.toolbarEl.contains(event6.target)) handler7();
    };
    document.addEventListener('pointerdown', value71, true);
    const run4 = () => {
        if (!this._pointerState) return;
        (window.removeEventListener('pointermove', value72, true),
          window.removeEventListener('pointerup', value73, true),
          window.removeEventListener('pointercancel', value73, true),
          (this._pointerState = null));
      },
      handler8 = () => this.ratioStr !== 'original',
      value72 = (event7) => {
        const event8 = this._pointerState;
        if (!event8 || event7.pointerId !== event8.pointerId) return;
        event7.preventDefault();
        const value74 = event8.zoom || this._view?.viewport?.zoom || 1,
          value75 = (event7.clientX - event8.startX) / value74,
          value76 = (event7.clientY - event8.startY) / value74,
          box15 = this._getNodeWorldRect(),
          handler9 = (value77, value78, value79) => Math.min(value79, Math.max(value78, value77));
        if (event8.mode === 'drag') {
          const w3 = event8.startRect.w,
            h3 = event8.startRect.h;
          let x8 = event8.startRect.x + value75,
            y5 = event8.startRect.y + value76;
          ((x8 = handler9(x8, box15.x + box15.w - w3, box15.x)),
            (y5 = handler9(y5, box15.y + box15.h - h3, box15.y)),
            (this.frameRect = { x: x8, y: y5, w: w3, h: h3 }),
            this._updateView(this._view));
          return;
        }
        const value80 = event8.handle,
          value81 = Math.max(box15.w, 24),
          value82 = Math.max(box15.h, 24),
          handler10 = (args4) => {
            const box16 = { ...args4 },
              value83 = box15.x + box15.w - box16.w,
              value84 = box15.x,
              value85 = box15.y + box15.h - box16.h,
              value86 = box15.y;
            return (
              (box16.x = handler9(box16.x, value83, value84)),
              (box16.y = handler9(box16.y, value85, value86)),
              box16
            );
          },
          handler11 = (args5, value87) => {
            const box17 = { ...args5 };
            if (box17.w < value81) box17.w = value81;
            if (box17.h < value82) box17.h = value82;
            if (value87 === 'tl')
              ((box17.x = event8.startRect.x + event8.startRect.w - box17.w),
                (box17.y = event8.startRect.y + event8.startRect.h - box17.h));
            else {
              if (value87 === 'tr')
                ((box17.x = event8.startRect.x),
                  (box17.y = event8.startRect.y + event8.startRect.h - box17.h));
              else {
                if (value87 === 'bl')
                  ((box17.x = event8.startRect.x + event8.startRect.w - box17.w),
                    (box17.y = event8.startRect.y));
                else {
                  if (value87 === 'br') ((box17.x = event8.startRect.x), (box17.y = event8.startRect.y));
                  else {
                    if (value87 === 'lm')
                      ((box17.x = event8.startRect.x + event8.startRect.w - box17.w),
                        (box17.y = event8.startRect.y));
                    else {
                      if (value87 === 'rm') ((box17.x = event8.startRect.x), (box17.y = event8.startRect.y));
                      else {
                        if (value87 === 'tm')
                          ((box17.x = event8.startRect.x),
                            (box17.y = event8.startRect.y + event8.startRect.h - box17.h));
                        else
                          value87 === 'bm' &&
                            ((box17.x = event8.startRect.x), (box17.y = event8.startRect.y));
                      }
                    }
                  }
                }
              }
            }
            return box17;
          };
        if (!handler8()) {
          let box18 = { ...event8.startRect };
          if (value80 === 'tl')
            ((box18.x = event8.startRect.x + value75),
              (box18.y = event8.startRect.y + value76),
              (box18.w = event8.startRect.w - value75),
              (box18.h = event8.startRect.h - value76),
              (box18 = handler11(box18, 'tl')));
          else {
            if (value80 === 'tr')
              ((box18.y = event8.startRect.y + value76),
                (box18.w = event8.startRect.w + value75),
                (box18.h = event8.startRect.h - value76),
                (box18 = handler11(box18, 'tr')));
            else {
              if (value80 === 'bl')
                ((box18.x = event8.startRect.x + value75),
                  (box18.w = event8.startRect.w - value75),
                  (box18.h = event8.startRect.h + value76),
                  (box18 = handler11(box18, 'bl')));
              else {
                if (value80 === 'br')
                  ((box18.w = event8.startRect.w + value75),
                    (box18.h = event8.startRect.h + value76),
                    (box18 = handler11(box18, 'br')));
                else {
                  if (value80 === 'tm')
                    ((box18.y = event8.startRect.y + value76),
                      (box18.h = event8.startRect.h - value76),
                      (box18 = handler11(box18, 'tm')));
                  else {
                    if (value80 === 'bm')
                      ((box18.h = event8.startRect.h + value76), (box18 = handler11(box18, 'bm')));
                    else {
                      if (value80 === 'lm')
                        ((box18.x = event8.startRect.x + value75),
                          (box18.w = event8.startRect.w - value75),
                          (box18 = handler11(box18, 'lm')));
                      else
                        value80 === 'rm' &&
                          ((box18.w = event8.startRect.w + value75), (box18 = handler11(box18, 'rm')));
                    }
                  }
                }
              }
            }
          }
          ((this.frameRect = handler10(box18)), this._updateView(this._view));
          return;
        }
        const value88 = this._parseRatio(),
          value89 = event8.startRect.x + event8.startRect.w / 2,
          value90 = event8.startRect.y + event8.startRect.h / 2;
        let box19 = { ...event8.startRect };
        if (value80 === 'lm' || value80 === 'rm') {
          let value91 = event8.startRect.w + (value80 === 'rm' ? value75 : -value75);
          value91 = Math.max(value91, value81);
          let value92 = value91 / value88;
          (value92 < value82 && ((value92 = value82), (value91 = value92 * value88)),
            (box19.w = value91),
            (box19.h = value92),
            (box19.x =
              value80 === 'rm' ? event8.startRect.x : event8.startRect.x + event8.startRect.w - box19.w),
            (box19.y = value90 - box19.h / 2));
        } else {
          if (value80 === 'tm' || value80 === 'bm') {
            let value93 = event8.startRect.h + (value80 === 'bm' ? value76 : -value76);
            value93 = Math.max(value93, value82);
            let value94 = value93 * value88;
            (value94 < value81 && ((value94 = value81), (value93 = value94 / value88)),
              (box19.w = value94),
              (box19.h = value93),
              (box19.y =
                value80 === 'bm' ? event8.startRect.y : event8.startRect.y + event8.startRect.h - box19.h),
              (box19.x = value89 - box19.w / 2));
          } else {
            const value95 = value80 === 'tr' || value80 === 'br' ? 1 : -1,
              value96 = value80 === 'bl' || value80 === 'br' ? 1 : -1;
            let value97 = event8.startRect.w + value75 * value95,
              value98 = event8.startRect.h + value76 * value96;
            ((value97 = Math.max(value97, 1)), (value98 = Math.max(value98, 1)));
            value97 / value98 > value88 ? (value98 = value97 / value88) : (value97 = value98 * value88);
            value97 < value81 && ((value97 = value81), (value98 = value97 / value88));
            value98 < value82 && ((value98 = value82), (value97 = value98 * value88));
            ((box19.w = value97), (box19.h = value98));
            if (value80 === 'br') ((box19.x = event8.startRect.x), (box19.y = event8.startRect.y));
            else {
              if (value80 === 'bl')
                ((box19.x = event8.startRect.x + event8.startRect.w - box19.w),
                  (box19.y = event8.startRect.y));
              else
                value80 === 'tr'
                  ? ((box19.x = event8.startRect.x),
                    (box19.y = event8.startRect.y + event8.startRect.h - box19.h))
                  : ((box19.x = event8.startRect.x + event8.startRect.w - box19.w),
                    (box19.y = event8.startRect.y + event8.startRect.h - box19.h));
            }
          }
        }
        ((this.frameRect = handler10(box19)), this._updateView(this._view));
      },
      value73 = (event9) => {
        const event10 = this._pointerState;
        if (!event10 || event9.pointerId !== event10.pointerId) return;
        (event9.preventDefault(), run4());
      },
      value99 = (pointerId) => {
        if (pointerId.button !== 0) return;
        (pointerId.stopPropagation(), pointerId.preventDefault());
        if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
        this.frameRect = this._clampFrameRect(this.frameRect);
        const el18 = pointerId.target.closest('.v2-expand-handle'),
          handle2 = el18?.dataset?.handle || null,
          mode3 = handle2 ? 'resize' : 'drag';
        ((this._pointerState = {
          pointerId: pointerId.pointerId,
          mode: mode3,
          handle: handle2,
          startX: pointerId.clientX,
          startY: pointerId.clientY,
          startRect: { ...this.frameRect },
          zoom: this._view?.viewport?.zoom || 1,
        }),
          this.frameEl.setPointerCapture?.(pointerId.pointerId),
          window.addEventListener('pointermove', value72, true),
          window.addEventListener('pointerup', value73, true),
          window.addEventListener('pointercancel', value73, true));
      };
    (this.frameEl.addEventListener('pointerdown', value99),
      (this.cleanup = () => {
        (run4(),
          window.removeEventListener('resize', value56),
          window.removeEventListener('keydown', value57),
          document.removeEventListener('pointerdown', value71, true),
          this.overlayEl?.removeEventListener('wheel', value58),
          this.frameEl?.removeEventListener('pointerdown', value99),
          this._unbindToolbarUpMenus?.(),
          (this._unbindToolbarUpMenus = null),
          this._unbindImageFunctionMenus?.(),
          (this._unbindImageFunctionMenus = null));
      }));
  },
  exit() {
    if (!this.active) return;
    this.active = false;
    this._unsubscribe && (this._unsubscribe(), (this._unsubscribe = null));
    this._unsubscribeLocale && (this._unsubscribeLocale(), (this._unsubscribeLocale = null));
    if (this.overlayEl) this.overlayEl.classList.remove('visible');
    setTimeout(() => {
      (this.overlayEl?.remove(),
        this.toolbarEl?.remove(),
        this.cleanup?.(),
        (this.nodeId = null),
        (this.nodeData = null),
        (this.frameRect = null),
        (this._view = null),
        (this._expandModelCatalog = null),
        (this.ratioMenuEl = null),
        (this.sizeMenuEl = null));
    }, 200);
  },
};
export default ImageExpandController;

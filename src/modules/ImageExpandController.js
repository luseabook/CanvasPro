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
function imageExpandText(_0x1709a2, _0x420f7f = {}) {
  return t('imageExpand.' + _0x1709a2, _0x420f7f);
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
  return EXPAND_RATIO_OPTIONS.map((_0x55d48a) => ({
    ..._0x55d48a,
    label: _0x55d48a.labelKey ? imageExpandText(_0x55d48a.labelKey) : _0x55d48a.label,
    selectedLabel:
      _0x55d48a.value === 'original' ? imageExpandText('ratio.selectedOriginal') : _0x55d48a.label,
  }));
}
function getExpandImageSizeOptions({ disabled: disabled = false } = {}) {
  return EXPAND_IMAGE_SIZE_OPTIONS.map((_0x3e4a4a) => ({ ..._0x3e4a4a, disabled: disabled }));
}
function isRunningHubTaskModel(_0x1e40a6, _0x571ce9) {
  return isRunningHubImageTaskModel(_0x1e40a6, _0x571ce9);
}
function isDreaminaTaskModel(_0x388322, _0x3d5dc7) {
  return isDreaminaImageTaskModel(_0x388322, _0x3d5dc7);
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
function buildImageExpandOutputText(_0x3907e7, { error: error = '' } = {}) {
  const _0x4b52bd = { model: _0x3907e7, prompt: imageExpandText('output.promptDisplay'), error: error };
  return error ? imageExpandText('output.failed', _0x4b52bd) : imageExpandText('output.started', _0x4b52bd);
}
function buildExpandModelCatalog() {
  return buildImageFunctionModelCatalog(IMAGE_MODELS);
}
function findProviderKeyByModel(_0x4f2c76, _0x5bc828) {
  const _0x40701 = String(_0x5bc828 || '').trim();
  if (!_0x40701) return null;
  for (const [_0x517999, _0x5e33fa] of Object.entries(_0x4f2c76 || {})) {
    const _0x287f83 = Array.isArray(_0x5e33fa?.models) ? _0x5e33fa.models : [];
    if (_0x287f83.some((_0x29a9c8) => _0x29a9c8?.id === _0x40701)) return _0x517999;
  }
  return findImageFunctionProviderByModel(_0x4f2c76, _0x40701);
}
function buildSeedreamMigrationPatch(_0x48a38c) {
  return (void _0x48a38c, null);
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
  init(_0x25b4fb) {
    if (this.active) return;
    const _0x742142 = appStore.getStateRaw(),
      _0x58f444 = _0x742142.nodes?.[_0x25b4fb];
    if (!_0x58f444) return;
    ((this.active = true), (this.nodeId = _0x25b4fb), (this._expandModelCatalog = buildExpandModelCatalog()));
    const _0x41549f = this._normalizeLegacySeedreamNode(_0x58f444);
    ((this.nodeData = _0x41549f),
      (this._view = { viewport: _0x742142.viewport, node: _0x41549f }),
      (this.ratioStr = 'original'),
      (this.imageSize = '1K'));
    const _0x14efac = this._getExpandModelCatalog(),
      _0x13fb5f = getDefaultImageFunctionModelState(_0x14efac),
      _0x5be22a = String(_0x41549f?.model || '').trim(),
      _0x42f7e6 = String(_0x41549f?.provider || '').trim(),
      _0x451bce = findProviderKeyByModel(_0x14efac, _0x5be22a);
    if (_0x451bce) ((this.model = _0x5be22a), (this.provider = _0x451bce));
    else
      _0x13fb5f.model
        ? ((this.model = _0x13fb5f.model), (this.provider = _0x13fb5f.provider))
        : ((this.model = _0x5be22a || ''),
          (this.provider = resolveImageTaskProvider(_0x5be22a, _0x42f7e6, _0x13fb5f.provider || '')));
    (this._createUI(),
      this._bindEvents(),
      (this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts())),
      (this._unsubscribe = appStore.subscribeSelector(
        (_0x2053a7) => {
          const _0x439d02 = _0x2053a7.nodes?.[_0x25b4fb],
            _0x2203d5 = _0x2053a7.viewport || { x: 0, y: 0, zoom: 1 };
          return {
            hasNode: !!_0x439d02,
            vx: _0x2203d5.x,
            vy: _0x2203d5.y,
            vz: _0x2203d5.zoom || 1,
            nx: _0x439d02 ? _0x439d02.x : 0,
            ny: _0x439d02 ? _0x439d02.y : 0,
            nw: _0x439d02 ? _0x439d02.width : 0,
            nh: _0x439d02 ? _0x439d02.height : 0,
          };
        },
        (_0x1697cc) => {
          if (!_0x1697cc?.hasNode) return;
          const _0x46ac47 = appStore.getStateRaw().nodes?.[_0x25b4fb];
          if (!_0x46ac47) return;
          const _0x1f233b = this._normalizeLegacySeedreamNode(_0x46ac47);
          ((this.nodeData = _0x1f233b),
            (this._view = {
              viewport: { x: _0x1697cc.vx, y: _0x1697cc.vy, zoom: _0x1697cc.vz },
              node: _0x1f233b,
            }),
            this._updateView(this._view));
        },
      )),
      this._waitForImageAndShow());
  },
  _waitForImageAndShow() {
    const _0x10615b = () => {
      this.imgEl && this.imgEl.complete && this.imgEl.naturalWidth > 0
        ? (this._updateView(this._view),
          requestAnimationFrame(() => {
            if (this.overlayEl) this.overlayEl.classList.add('visible');
          }))
        : requestAnimationFrame(_0x10615b);
    };
    _0x10615b();
  },
  _getExpandModelCatalog() {
    return (
      !this._expandModelCatalog && (this._expandModelCatalog = buildExpandModelCatalog()),
      this._expandModelCatalog
    );
  },
  _normalizeLegacySeedreamNode(_0x595f85) {
    const _0x3b4ca5 = buildSeedreamMigrationPatch(_0x595f85);
    if (!_0x3b4ca5) return _0x595f85;
    const _0x301841 = { ...(_0x595f85 || {}), ..._0x3b4ca5 },
      _0x3bbd6d = appStore.getStateRaw().nodes?.[this.nodeId];
    return (_0x3bbd6d && appStore.updateNodeData(this.nodeId, _0x3b4ca5), _0x301841);
  },
  _getImageUrl() {
    const _0x36614c = this.nodeData || {};
    return localPathToUrl(_0x36614c.localPath) || _0x36614c.src || _0x36614c.imageUrl || _0x36614c.sourceUrl;
  },
  _createExpandedImage(_0xce7d6b, _0x51a472) {
    return new Promise((_0xeaf5ae, _0x39f681) => {
      const _0x3653b9 = new Image();
      ((_0x3653b9.crossOrigin = 'anonymous'),
        (_0x3653b9.onload = async () => {
          try {
            const _0x4edc9a = document.createElement('canvas'),
              _0x1a1f98 = _0x4edc9a.getContext('2d'),
              _0x16e465 = _0x3653b9.naturalWidth,
              _0x528219 = _0x3653b9.naturalHeight,
              _0x5a7a32 = _0xce7d6b,
              _0x1d4078 = {
                x: _0x51a472.x || 0,
                y: _0x51a472.y || 0,
                w: _0x51a472.width || 1,
                h: _0x51a472.height || 1,
              },
              _0x1062a5 = _0x16e465 / _0x1d4078.w,
              _0x3f4090 = _0x528219 / _0x1d4078.h,
              _0xb6799a = Math.round(_0x5a7a32.w * _0x1062a5),
              _0x23f9fe = Math.round(_0x5a7a32.h * _0x3f4090);
            ((_0x4edc9a.width = _0xb6799a),
              (_0x4edc9a.height = _0x23f9fe),
              (_0x1a1f98.fillStyle = '#00FF00'),
              _0x1a1f98.fillRect(0, 0, _0xb6799a, _0x23f9fe));
            const _0x35a120 = Math.round((_0x1d4078.x - _0x5a7a32.x) * _0x1062a5),
              _0x327b62 = Math.round((_0x1d4078.y - _0x5a7a32.y) * _0x3f4090);
            (_0x1a1f98.drawImage(_0x3653b9, _0x35a120, _0x327b62, _0x16e465, _0x528219),
              _0x4edc9a.toBlob((_0x35d786) => {
                if (_0x35d786) {
                  const _0x57c6c4 = URL.createObjectURL(_0x35d786);
                  _0xeaf5ae({ url: _0x57c6c4, width: _0xb6799a, height: _0x23f9fe });
                } else _0x39f681(new Error(imageExpandText('errors.createExpandedImageFailed')));
              }, 'image/png'));
          } catch (_0x527c2c) {
            _0x39f681(_0x527c2c);
          }
        }),
        (_0x3653b9.onerror = () => {
          _0x39f681(new Error(imageExpandText('errors.sourceImageLoadFailed')));
        }));
      const _0x301ec1 =
        localPathToUrl(_0x51a472.localPath) || _0x51a472.src || _0x51a472.imageUrl || _0x51a472.sourceUrl;
      _0x3653b9.src = _0x301ec1;
    });
  },
  _buildGenerationPayload(_0x543cd0, _0xca83e8, _0x31bbde) {
    const _0x6dbb48 = this.ratioStr === 'original';
    return {
      prompt: IMAGE_EXPAND_PROMPT,
      model: _0x543cd0,
      provider: _0xca83e8,
      ...(_0x6dbb48 ? { suppressAspectRatio: true } : { aspectRatio: this.ratioStr }),
      imageSize: this.imageSize,
      inputUrls: [_0x31bbde],
      batchSize: 1,
    };
  },
  _formatDebugRequest(_0x4c21f5) {
    return formatFinalApiDebugRequest(_0x4c21f5);
  },
  _upsertDebugNode(_0x4a4d4f, _0x5a60e1) {
    const _0xfc034f = appStore.getStateRaw(),
      _0x34b6a0 = _0x5a60e1 || _0xfc034f.nodes?.[this.nodeId] || this.nodeData || {},
      { x: _0x21a882, y: _0x151fab } = calcSafeSpawnPosNearNode(_0xfc034f.nodes, _0x34b6a0, 0x17c, 0x12c),
      _0x4241f1 = Object.values(_0xfc034f.nodes).find((_0x54b599) => _0x54b599.type === 'debug');
    !_0x4241f1
      ? appStore.addNode({
          id: 'debug-' + Date.now(),
          type: 'debug',
          x: _0x21a882,
          y: _0x151fab,
          width: 0x17c,
          height: 0x12c,
          name: imageExpandText('debug.nodeName'),
          outputText: _0x4a4d4f,
        })
      : appStore.updateNodeData(_0x4241f1.id, { outputText: _0x4a4d4f, x: _0x21a882, y: _0x151fab });
  },
  async _handleDebug() {
    let _0x5df054 = null;
    try {
      const _0x15f0e5 = appStore.getStateRaw(),
        _0x22110b = _0x15f0e5.nodes?.[this.nodeId];
      if (!_0x22110b) {
        window.showToast?.(imageExpandText('toasts.sourceNodeMissing'), 'warn');
        return;
      }
      if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
      const _0x5e8b89 = String(this.model || '').trim(),
        _0x293ee3 = resolveImageTaskProvider(_0x5e8b89, this.provider, '');
      _0x5df054 = await this._createExpandedImage({ ...this.frameRect }, { ..._0x22110b });
      const _0x176c90 = this._buildGenerationPayload(_0x5e8b89, _0x293ee3, _0x5df054.url),
        _0x47b75f = await buildGenerateImageRequest(_0x176c90);
      (this._upsertDebugNode(this._formatDebugRequest(_0x47b75f), _0x22110b),
        window.showToast?.(imageExpandText('toasts.debugShown'), 'warn'));
    } catch (_0x50c7d4) {
      (console.error('[ImageExpandController] 调试请求构建失败:', _0x50c7d4),
        window.showToast?.(
          imageExpandText('toasts.debugBuildFailed', {
            error: _0x50c7d4?.message || imageExpandText('errors.unknown'),
          }),
          'error',
        ));
    } finally {
      _0x5df054?.url && URL.revokeObjectURL(_0x5df054.url);
    }
  },
  _parseRatio() {
    if (this.ratioStr === 'original') return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    const _0x363033 = this.ratioStr.split(':').map((_0x327ab8) => Number(_0x327ab8));
    if (_0x363033.length !== 2 || !_0x363033[0] || !_0x363033[1])
      return (this.nodeData.width || 1) / (this.nodeData.height || 1);
    return _0x363033[0] / _0x363033[1];
  },
  _calcFrameWorldRect() {
    const _0x150305 = this.nodeData,
      _0x1df56f = _0x150305.width || 1,
      _0x22811a = _0x150305.height || 1,
      _0x5ac1a7 = _0x150305.x + _0x1df56f / 2,
      _0x400f5d = _0x150305.y + _0x22811a / 2,
      _0xbd4da7 = _0x1df56f / _0x22811a,
      _0x4a6b77 = this._parseRatio();
    let _0x352b7a, _0x2f592e;
    _0x4a6b77 >= _0xbd4da7
      ? ((_0x2f592e = _0x22811a), (_0x352b7a = _0x22811a * _0x4a6b77))
      : ((_0x352b7a = _0x1df56f), (_0x2f592e = _0x1df56f / _0x4a6b77));
    const _0x5f2bbd = 1.35,
      _0x430dc9 = Math.max(_0x1df56f, _0x352b7a) * _0x5f2bbd,
      _0x290368 = Math.max(_0x22811a, _0x2f592e) * _0x5f2bbd;
    return { x: _0x5ac1a7 - _0x430dc9 / 2, y: _0x400f5d - _0x290368 / 2, w: _0x430dc9, h: _0x290368 };
  },
  _getNodeWorldRect() {
    const _0x1979d0 = this.nodeData || {},
      _0x357587 = _0x1979d0.width || 1,
      _0x543f00 = _0x1979d0.height || 1;
    return { x: _0x1979d0.x || 0, y: _0x1979d0.y || 0, w: _0x357587, h: _0x543f00 };
  },
  _clampFrameRect(_0x290e2a) {
    const _0x2e3bf4 = this._getNodeWorldRect(),
      _0x32d5a8 = (_0x5ed5e8, _0x2eb6c4, _0x4d82e6) => Math.min(_0x4d82e6, Math.max(_0x2eb6c4, _0x5ed5e8)),
      _0x40f0bb = {
        x: Number(_0x290e2a?.x) || 0,
        y: Number(_0x290e2a?.y) || 0,
        w: Number(_0x290e2a?.w) || 1,
        h: Number(_0x290e2a?.h) || 1,
      },
      _0x2a4223 = Math.max(_0x2e3bf4.w, 24),
      _0x1d009f = Math.max(_0x2e3bf4.h, 24);
    ((_0x40f0bb.w = Math.max(_0x40f0bb.w, _0x2a4223)), (_0x40f0bb.h = Math.max(_0x40f0bb.h, _0x1d009f)));
    if (this.ratioStr !== 'original') {
      const _0x374542 = this._parseRatio(),
        _0x4ae592 = _0x40f0bb.x + _0x40f0bb.w / 2,
        _0x19b1c9 = _0x40f0bb.y + _0x40f0bb.h / 2;
      let _0x45812b = _0x40f0bb.w,
        _0x1940f2 = _0x40f0bb.h;
      (_0x45812b / _0x1940f2 > _0x374542
        ? (_0x1940f2 = _0x45812b / _0x374542)
        : (_0x45812b = _0x1940f2 * _0x374542),
        _0x45812b < _0x2a4223 && ((_0x45812b = _0x2a4223), (_0x1940f2 = _0x45812b / _0x374542)),
        _0x1940f2 < _0x1d009f && ((_0x1940f2 = _0x1d009f), (_0x45812b = _0x1940f2 * _0x374542)),
        (_0x40f0bb.w = _0x45812b),
        (_0x40f0bb.h = _0x1940f2),
        (_0x40f0bb.x = _0x4ae592 - _0x40f0bb.w / 2),
        (_0x40f0bb.y = _0x19b1c9 - _0x40f0bb.h / 2));
    }
    const _0x4a57d9 = _0x2e3bf4.x + _0x2e3bf4.w - _0x40f0bb.w,
      _0x9fb0cc = _0x2e3bf4.x,
      _0x748288 = _0x2e3bf4.y + _0x2e3bf4.h - _0x40f0bb.h,
      _0xc29de2 = _0x2e3bf4.y;
    return (
      (_0x40f0bb.x = _0x32d5a8(_0x40f0bb.x, _0x4a57d9, _0x9fb0cc)),
      (_0x40f0bb.y = _0x32d5a8(_0x40f0bb.y, _0x748288, _0xc29de2)),
      _0x40f0bb
    );
  },
  _closeToolbarUpMenus(_0x1dbff1 = null) {
    this.toolbarEl?.querySelectorAll('[data-toolbar-up-menu-menu]').forEach((_0xc65319) => {
      if (_0xc65319 === _0x1dbff1) return;
      const _0x363760 = String(_0xc65319?.dataset?.toolbarUpMenuOpenClass || 'open').trim() || 'open';
      (_0xc65319.classList.remove(_0x363760),
        _0xc65319.classList.remove('open'),
        _0xc65319.classList.remove('show'));
    });
  },
  _createUI() {
    const _0x3412d0 = document.createElement('div');
    _0x3412d0.className = 'v2-expand-overlay';
    const _0x5e0068 = document.createElement('div');
    ((_0x5e0068.className = 'v2-expand-frame'),
      ['tl', 'tr', 'bl', 'br', 'tm', 'bm', 'lm', 'rm'].forEach((_0x463788) => {
        const _0x5b779a = document.createElement('div');
        ((_0x5b779a.className = 'v2-expand-handle ' + _0x463788),
          (_0x5b779a.dataset.handle = _0x463788),
          _0x5e0068.appendChild(_0x5b779a));
      }));
    const _0x1a7128 = document.createElement('img');
    ((_0x1a7128.className = 'v2-expand-img'),
      (_0x1a7128.draggable = false),
      (_0x1a7128.src = this._getImageUrl()),
      _0x3412d0.appendChild(_0x5e0068),
      _0x3412d0.appendChild(_0x1a7128),
      document.body.appendChild(_0x3412d0),
      (this.overlayEl = _0x3412d0),
      (this.frameEl = _0x5e0068),
      (this.imgEl = _0x1a7128),
      (this.frameRect = this._calcFrameWorldRect()));
    const _0x5089bc = document.createElement('div');
    _0x5089bc.className = 'v2-expand-toolbar';
    const _0x4b05e1 = this._getExpandModelCatalog(),
      _0x146ce3 = getImageFunctionModelDisplayName(this.model, _0x4b05e1),
      _0x1a1bed = getImageFunctionModelTriggerIconHTML(this.model, this.provider),
      _0x13587c = shouldDisableImageSizeControl(this.model, this.provider),
      _0x207249 = buildImageFunctionModelMenuHTML({
        activeModel: this.model,
        activeProvider: this.provider,
        modelCatalog: _0x4b05e1,
      });
    ((_0x5089bc.innerHTML =
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
        options: getExpandImageSizeOptions({ disabled: _0x13587c }),
        triggerClass: 'size-toggle',
        labelClass: 'size-text',
        menuClass: 'v2-expand-menu size-menu',
        itemClass: 'v2-expand-menu-item',
        disabled: _0x13587c,
      }) +
      '\n      <div class="v2-expand-wrap">\n        <button class="v2-expand-toolbar-btn model-toggle">\n          <span class="image-function-model-trigger-icon-slot">' +
      _0x1a1bed +
      '</span>\n          <span class="model-text">' +
      _0x146ce3 +
      '</span>\n          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5;margin-left:2px;"><polyline points="6 9 12 15 18 9"></polyline></svg>\n        </button>\n        <div class="floating-menu img-model-menu model-menu">\n          ' +
      _0x207249 +
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
      document.body.appendChild(_0x5089bc),
      (this.toolbarEl = _0x5089bc),
      (this.ratioMenuEl = _0x5089bc.querySelector('.ratio-menu')),
      (this.sizeMenuEl = _0x5089bc.querySelector('.size-menu')),
      (this.modelMenuEl = _0x5089bc.querySelector('.model-menu')),
      this._updateView(this._view),
      this._syncLocaleTexts());
  },
  _syncLocaleTexts() {
    if (!this.toolbarEl) return;
    const _0x5c3389 = this.toolbarEl.querySelector('.exit');
    if (_0x5c3389) _0x5c3389.title = imageExpandText('actions.exit');
    const _0x57e515 = this.toolbarEl.querySelector('.debug-wrench-btn');
    if (_0x57e515) {
      const _0xbb12cb = imageExpandText('actions.debugApiParams');
      ((_0x57e515.title = _0xbb12cb), _0x57e515.setAttribute('aria-label', _0xbb12cb));
    }
    const _0x33a819 = this.toolbarEl.querySelector('.go');
    if (_0x33a819) _0x33a819.title = imageExpandText('actions.generate');
    const _0x19d573 = (_0x5f0648, _0x5cebff, _0x54de18) => {
      const _0x13b85e = new Map(_0x5cebff.map((_0x577b4b) => [String(_0x577b4b.value || ''), _0x577b4b])),
        _0x38eb3f = this.toolbarEl.querySelector('[data-toolbar-up-menu="' + _0x5f0648 + '"]'),
        _0x17eb56 = _0x13b85e.get(String(_0x54de18 || '')) || _0x5cebff[0],
        _0x251184 = _0x38eb3f?.querySelector('[data-toolbar-up-menu-label]');
      (_0x251184 &&
        _0x17eb56 &&
        (_0x251184.textContent = _0x17eb56.selectedLabel || _0x17eb56.label || _0x54de18),
        _0x38eb3f?.querySelectorAll('[data-toolbar-up-menu-item]')?.forEach((_0x47cd20) => {
          const _0x2052b2 = _0x13b85e.get(String(_0x47cd20.dataset.toolbarUpMenuValue || ''));
          if (!_0x2052b2) return;
          _0x47cd20.dataset.toolbarUpMenuLabel = _0x2052b2.selectedLabel || _0x2052b2.label;
          const _0x29bade = _0x47cd20.querySelector('.floating-menu-label');
          if (_0x29bade) _0x29bade.textContent = _0x2052b2.label;
        }));
    };
    (_0x19d573('ratio', getExpandRatioOptions(), this.ratioStr),
      _0x19d573(
        'size',
        getExpandImageSizeOptions({ disabled: shouldDisableImageSizeControl(this.model, this.provider) }),
        this.imageSize,
      ));
  },
  _updateView(_0x24d713 = this._view) {
    if (!this.active) return;
    const _0x43bd4c = _0x24d713?.node,
      _0x38f18c = _0x24d713?.viewport;
    if (!_0x43bd4c) return;
    this.nodeData = _0x43bd4c;
    if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
    this.frameRect = this._clampFrameRect(this.frameRect);
    const _0x6d7a83 = this.frameRect,
      _0x321c3f = worldToScreen(_0x6d7a83.x, _0x6d7a83.y, _0x38f18c),
      _0x136e2b = Math.round(_0x6d7a83.w * _0x38f18c.zoom),
      _0x2305f7 = Math.round(_0x6d7a83.h * _0x38f18c.zoom);
    ((this.frameEl.style.left = Math.round(_0x321c3f.x) + 'px'),
      (this.frameEl.style.top = Math.round(_0x321c3f.y) + 'px'),
      (this.frameEl.style.width = _0x136e2b + 'px'),
      (this.frameEl.style.height = _0x2305f7 + 'px'));
    const _0x51f962 = worldToScreen(_0x43bd4c.x, _0x43bd4c.y, _0x38f18c),
      _0x13f71c = Math.round(_0x43bd4c.width * _0x38f18c.zoom),
      _0x2e8172 = Math.round(_0x43bd4c.height * _0x38f18c.zoom);
    ((this.imgEl.style.left = Math.round(_0x51f962.x) + 'px'),
      (this.imgEl.style.top = Math.round(_0x51f962.y) + 'px'),
      (this.imgEl.style.width = _0x13f71c + 'px'),
      (this.imgEl.style.height = _0x2e8172 + 'px'));
    if (this.toolbarEl) {
      const _0x10fdea = _0x51f962.y + _0x2e8172 + 14;
      ((this.toolbarEl.style.top = _0x10fdea + 'px'),
        (this.toolbarEl.style.left = _0x51f962.x + _0x13f71c / 2 + 'px'),
        (this.toolbarEl.style.transform = 'translateX(-50%)'),
        (this.toolbarEl.style.bottom = 'auto'));
    }
  },
  _bindEvents() {
    const _0x5a5664 = () => this._updateView(this._view);
    window.addEventListener('resize', _0x5a5664);
    const _0x419135 = (_0x14bbb2) => {
      if (_0x14bbb2.key === 'Escape') this.exit();
    };
    window.addEventListener('keydown', _0x419135);
    const _0x402d98 = (_0x164786) => _0x164786.stopPropagation();
    this.overlayEl.addEventListener('wheel', _0x402d98, { passive: false });
    const _0x429196 = this.modelMenuEl,
      _0x1ef15c = this.toolbarEl.querySelector('.model-text'),
      _0x49e0b7 = this.toolbarEl.querySelector('.image-function-model-trigger-icon-slot'),
      _0x4586a6 = this.toolbarEl.querySelector('.model-toggle'),
      _0x517de2 = this.toolbarEl.querySelector('.image-function-mode-toggle'),
      _0x3451d5 = this.toolbarEl.querySelector('.image-function-mode-menu'),
      _0x4526d2 = this._getExpandModelCatalog(),
      _0x3c02e3 = () => {
        const _0x1f88b3 = shouldDisableImageSizeControl(this.model, this.provider),
          _0xb51798 = this.toolbarEl.querySelector('.size-toggle');
        (_0xb51798 &&
          ((_0xb51798.disabled = _0x1f88b3),
          _0xb51798.classList.toggle('is-disabled', _0x1f88b3),
          _0xb51798.setAttribute('aria-disabled', _0x1f88b3 ? 'true' : 'false')),
          this.sizeMenuEl?.querySelectorAll('[data-toolbar-up-menu-field="size"]').forEach((_0x358436) => {
            (_0x358436.classList.toggle('disabled', _0x1f88b3),
              (_0x358436.dataset.disabled = _0x1f88b3 ? 'true' : 'false'));
          }),
          _0x1f88b3 && this.sizeMenuEl?.classList.remove('open'));
      },
      _0x298bfb = () =>
        syncImageFunctionModeControl({
          root: this.toolbarEl,
          model: this.model,
          provider: this.provider,
          imageSize: this.imageSize,
        }),
      _0x219608 = (_0x146476, _0x4cb61f, { syncStore: syncStore = true } = {}) => {
        const _0x4edddc = String(_0x146476 || '').trim(),
          _0x5d0a64 = String(resolveImageTaskProvider(_0x4edddc, _0x4cb61f, '')).trim();
        if (!_0x4edddc || !_0x5d0a64) return;
        const _0x1574ff = this.model !== _0x4edddc || this.provider !== _0x5d0a64;
        ((this.model = _0x4edddc),
          (this.provider = _0x5d0a64),
          _0x1ef15c && (_0x1ef15c.textContent = getImageFunctionModelDisplayName(_0x4edddc, _0x4526d2)),
          _0x49e0b7 && (_0x49e0b7.innerHTML = getImageFunctionModelTriggerIconHTML(_0x4edddc, _0x5d0a64)),
          syncImageFunctionModelMenuActive({ modelMenu: _0x429196, model: _0x4edddc, provider: _0x5d0a64 }),
          _0x298bfb(),
          _0x3c02e3(),
          syncStore &&
            _0x1574ff &&
            appStore.updateNodeData(this.nodeId, { model: _0x4edddc, provider: _0x5d0a64 }));
      },
      _0x1d756d = () => {
        (this._closeToolbarUpMenus(),
          this.modelMenuEl?.classList.remove('show'),
          _0x3451d5?.classList.remove('show'),
          closeImageFunctionModelSubmenus(this.modelMenuEl));
      };
    ((this.toolbarEl.querySelector('.exit').onclick = () => this.exit()),
      (this._unbindToolbarUpMenus = bindToolbarUpMenus(this.toolbarEl, {
        onBeforeOpen: () => {
          (this.modelMenuEl?.classList.remove('show'),
            _0x3451d5?.classList.remove('show'),
            closeImageFunctionModelSubmenus(this.modelMenuEl));
        },
        onSelect: ({ fieldId: _0x3b46ab, value: _0x5bf7ee }) => {
          if (_0x3b46ab === 'ratio') {
            ((this.ratioStr = String(_0x5bf7ee || 'original').trim() || 'original'),
              (this.frameRect = this._calcFrameWorldRect()),
              this._updateView(this._view));
            return;
          }
          if (_0x3b46ab === 'size') {
            if (shouldDisableImageSizeControl(this.model, this.provider)) return;
            this.imageSize = String(_0x5bf7ee || '1K').trim() || '1K';
            const _0x3e30b9 = getImageFunctionNanoSelection(this.model, this.provider, this.imageSize);
            if (_0x3e30b9) {
              const _0x20d8a6 = resolveImageFunctionModelByMode({
                model: this.model,
                provider: this.provider,
                imageSize: this.imageSize,
                mode: _0x3e30b9.mode,
              });
              _0x20d8a6?.model && _0x219608(_0x20d8a6.model, _0x20d8a6.provider);
            }
            (_0x298bfb(), _0x3c02e3());
          }
        },
      })));
    if (_0x4586a6 && _0x429196 && _0x1ef15c) {
      _0x4586a6.addEventListener('click', (_0x45c852) => {
        (_0x45c852.stopPropagation(),
          _0x429196.classList.toggle('show'),
          this._closeToolbarUpMenus(),
          _0x3451d5?.classList.remove('show'));
      });
      const _0x4ad73d = bindImageFunctionModelMenu({
          modelMenu: _0x429196,
          onSelect: ({ model: _0xefe065, provider: _0x41df23 }) => {
            _0x219608(_0xefe065, _0x41df23);
          },
          closeMenu: () => {
            _0x429196.classList.remove('show');
          },
        }),
        _0x512ae0 = bindImageFunctionModeMenu({
          modeMenu: _0x3451d5,
          onSelect: ({ mode: _0x69c950 }) => {
            const _0x22f3eb = resolveImageFunctionModelByMode({
              model: this.model,
              provider: this.provider,
              imageSize: this.imageSize,
              mode: _0x69c950,
            });
            if (!_0x22f3eb?.model) return;
            (_0x219608(_0x22f3eb.model, _0x22f3eb.provider), _0x3451d5?.classList.remove('show'));
          },
        });
      (_0x517de2 &&
        _0x3451d5 &&
        _0x517de2.addEventListener('click', (_0x710ebb) => {
          _0x710ebb.stopPropagation();
          if (_0x517de2.closest('.image-function-mode-wrap')?.classList.contains('is-hidden')) return;
          (_0x3451d5.classList.toggle('show'),
            this._closeToolbarUpMenus(_0x3451d5),
            _0x429196.classList.remove('show'),
            closeImageFunctionModelSubmenus(_0x429196));
        }),
        (this._unbindImageFunctionMenus = () => {
          (_0x4ad73d?.(), _0x512ae0?.());
        }));
    }
    (_0x298bfb(), _0x3c02e3());
    const _0x12520c = this.toolbarEl.querySelector('.debug-wrench-btn');
    ((_0x12520c.onclick = (_0x50c4c6) => {
      (_0x50c4c6.stopPropagation(), _0x50c4c6.preventDefault(), _0x1d756d(), void this._handleDebug());
    }),
      (this.toolbarEl.querySelector('.go').onclick = async () => {
        let _0x51925a = null,
          _0x1087f9 = null,
          _0x220482 = resolveInputRatioBasis();
        const _0x4da4cf = String(this.model || '').trim(),
          _0xb6fb53 = resolveImageTaskProvider(_0x4da4cf, this.provider, ''),
          _0x1b6c14 = isRunningHubTaskModel(_0x4da4cf, _0xb6fb53),
          _0x3dfe81 = isDreaminaTaskModel(_0x4da4cf, _0xb6fb53),
          _0x5a5c20 = !_0x1b6c14 && !_0x3dfe81,
          _0xe85d0c = String(_0xb6fb53 || '')
            .trim()
            .toLowerCase(),
          _0x3bc73f = shouldUseRunningHubOpenapiQuery(_0x4da4cf, _0xb6fb53),
          _0x5a576a = Date.now();
        try {
          window.showToast?.(imageExpandText('toasts.generating'), 'loading');
          const _0x2733a4 = appStore.getStateRaw(),
            _0x35d55d = _0x2733a4.nodes?.[this.nodeId];
          if (!_0x35d55d) return;
          const _0x2441b8 = { ...this.frameRect },
            _0x13a1b7 = { ..._0x35d55d };
          ((_0x1087f9 = await this._createExpandedImage(_0x2441b8, _0x13a1b7)),
            (_0x220482 = resolveInputRatioBasis(
              { width: _0x1087f9?.width, height: _0x1087f9?.height },
              { width: _0x35d55d.width, height: _0x35d55d.height },
            )));
          const { width: _0x18918e, height: _0x103dbe } = calcDisplaySizeByMedia(
              _0x220482.width,
              _0x220482.height,
            ),
            { x: _0x19f31f, y: _0x1a3bfe } = calcSafeSpawnPosNearNode(
              _0x2733a4.nodes,
              _0x35d55d,
              _0x18918e,
              _0x103dbe,
            );
          _0x51925a = generateId('source-image-expand');
          const _0x310815 = () => {
            return isTaskCancelled(appStore.getState().nodes?.[_0x51925a]);
          };
          appStore.addNode(
            buildSourceMediaNodePayload({
              id: _0x51925a,
              type: 'source-image',
              x: _0x19f31f,
              y: _0x1a3bfe,
              width: _0x18918e,
              height: _0x103dbe,
              needsAutoResize: false,
              name: imageExpandText('output.generatingName'),
              src: '',
              ...buildGenerationStartPatch({ startedAt: _0x5a576a }),
              ...(_0x1b6c14 || _0x3dfe81 || _0x5a5c20 ? { provider: _0xb6fb53, model: _0x4da4cf } : {}),
              ...(_0x1b6c14 ? { rhSourceNodeId: _0x35d55d.id, rhToolbarTaskType: 'image-expand' } : {}),
              ...(_0x1b6c14
                ? buildRunningHubTaskPatch({
                    taskId: '',
                    status: 'pending',
                    startedAt: _0x5a576a,
                    recovering: false,
                    useOpenapiQuery: _0x3bc73f,
                  })
                : {}),
              ...(_0x3dfe81
                ? buildDreaminaTaskPatch({
                    submitId: '',
                    status: 'pending',
                    phase: 'generating',
                    label: imageExpandText('task.submitting'),
                    startedAt: _0x5a576a,
                    recovering: false,
                  })
                : {}),
              ...(_0x5a5c20
                ? buildAsyncTaskPatch({
                    provider: _0xe85d0c,
                    kind: 'image',
                    taskId: '',
                    status: 'pending',
                    startedAt: _0x5a576a,
                    recovering: false,
                  })
                : {}),
              outputText: buildImageExpandOutputText(getDisplayModelName(this.model)),
            }),
          );
          (_0x1b6c14 || _0x3dfe81 || _0x5a5c20) && persistRunningHubResumeCache();
          appStore.setSelectedNodes([_0x51925a]);
          typeof window.v2FocusOnNodes === 'function'
            ? window.v2FocusOnNodes([_0x35d55d.id, _0x51925a])
            : window.v2FocusOnNode?.(_0x51925a);
          this.exit();
          const _0x308755 = this._buildGenerationPayload(_0x4da4cf, _0xb6fb53, _0x1087f9.url),
            _0x282224 = await generateImage(_0x308755, {
              onTaskMeta: ({ taskId: _0x302296, useOpenapiQuery: _0x3ba33f, provider: _0x344f0c }) => {
                const _0x306b43 = String(_0x302296 || '').trim();
                if (!_0x306b43) return;
                const _0x29a5e1 = appStore.getState().nodes?.[_0x51925a];
                if (!_0x29a5e1) return;
                if (_0x310815()) return;
                if (_0x1b6c14) {
                  (appStore.updateNodeData(_0x51925a, {
                    ...buildRunningHubTaskPatch({
                      taskId: _0x306b43,
                      status: 'running',
                      startedAt: _0x5a576a,
                      recovering: false,
                      useOpenapiQuery: _0x3ba33f === true,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                if (_0x3dfe81) {
                  (appStore.updateNodeData(_0x51925a, {
                    ...buildDreaminaTaskPatch({
                      submitId: _0x306b43,
                      status: 'pending',
                      phase: 'generating',
                      label: imageExpandText('task.generating'),
                      startedAt: _0x5a576a,
                      recovering: false,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                _0x5a5c20 &&
                  (appStore.updateNodeData(_0x51925a, {
                    ...buildAsyncTaskPatch({
                      provider: String(_0x344f0c || _0x29a5e1?.asyncTaskProvider || _0xe85d0c).trim(),
                      kind: 'image',
                      taskId: _0x306b43,
                      status: 'running',
                      startedAt: _0x5a576a,
                      recovering: false,
                    }),
                  }),
                  persistRunningHubResumeCache());
              },
              onTaskId: (_0x16182e) => {
                const _0x290ac7 = String(_0x16182e || '').trim();
                if (!_0x290ac7) return;
                const _0x150404 = appStore.getState().nodes?.[_0x51925a];
                if (!_0x150404) return;
                if (_0x310815()) return;
                if (_0x1b6c14) {
                  (appStore.updateNodeData(_0x51925a, {
                    ...buildRunningHubTaskPatch({
                      taskId: _0x290ac7,
                      status: 'running',
                      startedAt: _0x5a576a,
                      recovering: false,
                      useOpenapiQuery: _0x150404?.rhTaskUseOpenapiQuery === true || _0x3bc73f,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                if (_0x3dfe81) {
                  (appStore.updateNodeData(_0x51925a, {
                    ...buildDreaminaTaskPatch({
                      submitId: _0x290ac7,
                      status: 'pending',
                      phase: 'generating',
                      label: imageExpandText('task.generating'),
                      startedAt: _0x5a576a,
                      recovering: false,
                    }),
                  }),
                    persistRunningHubResumeCache());
                  return;
                }
                _0x5a5c20 &&
                  (appStore.updateNodeData(_0x51925a, {
                    ...buildAsyncTaskPatch({
                      provider: String(_0x150404?.asyncTaskProvider || _0xe85d0c).trim(),
                      kind: 'image',
                      taskId: _0x290ac7,
                      status: 'running',
                      startedAt: _0x5a576a,
                      recovering: false,
                    }),
                  }),
                  persistRunningHubResumeCache());
              },
            });
          if (_0x310815()) return;
          if (_0x282224.error) {
            const _0x104d8d = appStore.getState().nodes?.[_0x51925a],
              _0x575d59 = _0x104d8d?.generationStartTime ? Date.now() - _0x104d8d.generationStartTime : 0;
            appStore.updateNodeData(_0x51925a, {
              ...buildImageGenerationFailurePatch({
                error: _0x282224.error,
                startedAt: _0x5a576a,
                duration: _0x575d59,
              }),
              name: imageExpandText('output.failedName'),
              ...(_0x1b6c14
                ? buildRunningHubTaskPatch({
                    taskId: _0x104d8d?.rhTaskId || '',
                    status: 'failed',
                    startedAt: _0x5a576a,
                    recovering: false,
                    useOpenapiQuery: _0x104d8d?.rhTaskUseOpenapiQuery === true || _0x3bc73f,
                  })
                : {}),
              ...(_0x3dfe81
                ? buildDreaminaTaskPatch({
                    submitId: _0x104d8d?.dreaminaSubmitId || '',
                    status: 'failed',
                    phase: 'failed',
                    label: _0x282224.error || imageExpandText('task.failed'),
                    startedAt: _0x5a576a,
                    recovering: false,
                  })
                : {}),
              ...(_0x5a5c20
                ? buildAsyncTaskPatch({
                    provider: _0x104d8d?.asyncTaskProvider || _0xe85d0c,
                    kind: 'image',
                    taskId: _0x104d8d?.asyncTaskId || '',
                    status: 'failed',
                    startedAt: _0x5a576a,
                    recovering: false,
                  })
                : {}),
              outputText: buildImageExpandOutputText(getDisplayModelName(this.model), {
                error: _0x282224.error,
              }),
            });
            (_0x1b6c14 || _0x3dfe81 || _0x5a5c20) && persistRunningHubResumeCache();
            return;
          }
          const _0x4f7498 = appStore.getState().nodes?.[_0x51925a],
            _0x49f19b = _0x4f7498?.generationStartTime ? Date.now() - _0x4f7498.generationStartTime : 0,
            _0x1e0502 = await resolveOutputMediaSize({
              localPath: _0x282224.localPath,
              imageUrl: _0x282224.imageUrl,
              sourceUrl: _0x282224.sourceUrl,
              thumbUrl: _0x282224.thumbUrl,
              src: _0x282224.imageUrl || _0x282224.sourceUrl || _0x282224.thumbUrl || '',
            }),
            _0x5ed64d =
              _0x1e0502 &&
              shouldSwitchToOutputRatio(
                _0x220482.width,
                _0x220482.height,
                _0x1e0502.width,
                _0x1e0502.height,
                OUTPUT_RATIO_SWITCH_THRESHOLD,
              )
                ? calcDisplaySizeByMedia(_0x1e0502.width, _0x1e0502.height)
                : calcDisplaySizeByMedia(_0x220482.width, _0x220482.height);
          (appStore.updateNodeData(_0x51925a, {
            ...buildImageGenerationResultPatch(_0x282224, { startedAt: _0x5a576a, duration: _0x49f19b }),
            name: imageExpandText('output.resultName'),
            width: _0x5ed64d.width,
            height: _0x5ed64d.height,
            ...(_0x1b6c14
              ? buildRunningHubTaskPatch({
                  taskId: _0x4f7498?.rhTaskId || '',
                  status: 'success',
                  startedAt: _0x5a576a,
                  recovering: false,
                  useOpenapiQuery: _0x4f7498?.rhTaskUseOpenapiQuery === true || _0x3bc73f,
                })
              : {}),
            ...(_0x3dfe81
              ? buildDreaminaTaskPatch({
                  submitId: _0x4f7498?.dreaminaSubmitId || '',
                  status: 'success',
                  phase: 'done',
                  label: imageExpandText('task.completed'),
                  startedAt: _0x5a576a,
                  recovering: false,
                })
              : {}),
            ...(_0x5a5c20
              ? buildAsyncTaskPatch({
                  provider: _0x4f7498?.asyncTaskProvider || _0xe85d0c,
                  kind: 'image',
                  taskId: _0x4f7498?.asyncTaskId || '',
                  status: 'success',
                  startedAt: _0x5a576a,
                  recovering: false,
                })
              : {}),
            outputText: buildImageExpandOutputText(getDisplayModelName(this.model)),
          }),
            (_0x1b6c14 || _0x3dfe81 || _0x5a5c20) && persistRunningHubResumeCache(),
            window.showToast?.(imageExpandText('toasts.success'), 'success'));
        } catch (_0x23228f) {
          console.error('扩图生成失败:', _0x23228f);
          if (_0x51925a) {
            const _0x301e93 = appStore.getState().nodes?.[_0x51925a];
            if (isTaskCancelled(_0x301e93)) return;
            const _0x212102 = _0x301e93?.generationStartTime ? Date.now() - _0x301e93.generationStartTime : 0,
              _0x39fd79 = _0x23228f.message || imageExpandText('errors.unknown');
            (appStore.updateNodeData(_0x51925a, {
              ...buildImageGenerationFailurePatch({
                error: _0x39fd79,
                startedAt: _0x5a576a,
                duration: _0x212102,
              }),
              name: imageExpandText('output.failedName'),
              ...(_0x1b6c14
                ? buildRunningHubTaskPatch({
                    taskId: _0x301e93?.rhTaskId || '',
                    status: 'failed',
                    startedAt: _0x5a576a,
                    recovering: false,
                    useOpenapiQuery: _0x301e93?.rhTaskUseOpenapiQuery === true || _0x3bc73f,
                  })
                : {}),
              ...(_0x3dfe81
                ? buildDreaminaTaskPatch({
                    submitId: _0x301e93?.dreaminaSubmitId || '',
                    status: 'failed',
                    phase: 'failed',
                    label: _0x39fd79 || imageExpandText('task.failed'),
                    startedAt: _0x5a576a,
                    recovering: false,
                  })
                : {}),
              ...(_0x5a5c20
                ? buildAsyncTaskPatch({
                    provider: _0x301e93?.asyncTaskProvider || _0xe85d0c,
                    kind: 'image',
                    taskId: _0x301e93?.asyncTaskId || '',
                    status: 'failed',
                    startedAt: _0x5a576a,
                    recovering: false,
                  })
                : {}),
              outputText: buildImageExpandOutputText(getDisplayModelName(this.model), { error: _0x39fd79 }),
            }),
              (_0x1b6c14 || _0x3dfe81 || _0x5a5c20) && persistRunningHubResumeCache());
          } else
            window.showToast?.(
              imageExpandText('toasts.failed', {
                error: _0x23228f.message || imageExpandText('errors.unknown'),
              }),
              'error',
            );
        } finally {
          _0x1087f9?.url && URL.revokeObjectURL(_0x1087f9.url);
        }
      }));
    const _0x1cbad8 = (_0x2ad22e) => {
      if (!this.toolbarEl.contains(_0x2ad22e.target)) _0x1d756d();
    };
    document.addEventListener('pointerdown', _0x1cbad8, true);
    const _0x4fb161 = () => {
        if (!this._pointerState) return;
        (window.removeEventListener('pointermove', _0x335263, true),
          window.removeEventListener('pointerup', _0x178062, true),
          window.removeEventListener('pointercancel', _0x178062, true),
          (this._pointerState = null));
      },
      _0x39e69c = () => this.ratioStr !== 'original',
      _0x335263 = (_0x1a4cc8) => {
        const _0x54e600 = this._pointerState;
        if (!_0x54e600 || _0x1a4cc8.pointerId !== _0x54e600.pointerId) return;
        _0x1a4cc8.preventDefault();
        const _0x55d6b2 = _0x54e600.zoom || this._view?.viewport?.zoom || 1,
          _0xd6fe6f = (_0x1a4cc8.clientX - _0x54e600.startX) / _0x55d6b2,
          _0x461972 = (_0x1a4cc8.clientY - _0x54e600.startY) / _0x55d6b2,
          _0x55f56b = this._getNodeWorldRect(),
          _0x1bd510 = (_0x34dfc0, _0x4dff88, _0x3a552d) =>
            Math.min(_0x3a552d, Math.max(_0x4dff88, _0x34dfc0));
        if (_0x54e600.mode === 'drag') {
          const _0x45c816 = _0x54e600.startRect.w,
            _0x221d82 = _0x54e600.startRect.h;
          let _0x4d925a = _0x54e600.startRect.x + _0xd6fe6f,
            _0x1cf6a6 = _0x54e600.startRect.y + _0x461972;
          ((_0x4d925a = _0x1bd510(_0x4d925a, _0x55f56b.x + _0x55f56b.w - _0x45c816, _0x55f56b.x)),
            (_0x1cf6a6 = _0x1bd510(_0x1cf6a6, _0x55f56b.y + _0x55f56b.h - _0x221d82, _0x55f56b.y)),
            (this.frameRect = { x: _0x4d925a, y: _0x1cf6a6, w: _0x45c816, h: _0x221d82 }),
            this._updateView(this._view));
          return;
        }
        const _0x36fab0 = _0x54e600.handle,
          _0x294841 = Math.max(_0x55f56b.w, 24),
          _0x42a40f = Math.max(_0x55f56b.h, 24),
          _0x1be15b = (_0x36f9eb) => {
            const _0x5ddf96 = { ..._0x36f9eb },
              _0x5416e0 = _0x55f56b.x + _0x55f56b.w - _0x5ddf96.w,
              _0x41f356 = _0x55f56b.x,
              _0x2b1715 = _0x55f56b.y + _0x55f56b.h - _0x5ddf96.h,
              _0x1a5dd3 = _0x55f56b.y;
            return (
              (_0x5ddf96.x = _0x1bd510(_0x5ddf96.x, _0x5416e0, _0x41f356)),
              (_0x5ddf96.y = _0x1bd510(_0x5ddf96.y, _0x2b1715, _0x1a5dd3)),
              _0x5ddf96
            );
          },
          _0x5727b8 = (_0x60d305, _0x2363ee) => {
            const _0x410b6b = { ..._0x60d305 };
            if (_0x410b6b.w < _0x294841) _0x410b6b.w = _0x294841;
            if (_0x410b6b.h < _0x42a40f) _0x410b6b.h = _0x42a40f;
            if (_0x2363ee === 'tl')
              ((_0x410b6b.x = _0x54e600.startRect.x + _0x54e600.startRect.w - _0x410b6b.w),
                (_0x410b6b.y = _0x54e600.startRect.y + _0x54e600.startRect.h - _0x410b6b.h));
            else {
              if (_0x2363ee === 'tr')
                ((_0x410b6b.x = _0x54e600.startRect.x),
                  (_0x410b6b.y = _0x54e600.startRect.y + _0x54e600.startRect.h - _0x410b6b.h));
              else {
                if (_0x2363ee === 'bl')
                  ((_0x410b6b.x = _0x54e600.startRect.x + _0x54e600.startRect.w - _0x410b6b.w),
                    (_0x410b6b.y = _0x54e600.startRect.y));
                else {
                  if (_0x2363ee === 'br')
                    ((_0x410b6b.x = _0x54e600.startRect.x), (_0x410b6b.y = _0x54e600.startRect.y));
                  else {
                    if (_0x2363ee === 'lm')
                      ((_0x410b6b.x = _0x54e600.startRect.x + _0x54e600.startRect.w - _0x410b6b.w),
                        (_0x410b6b.y = _0x54e600.startRect.y));
                    else {
                      if (_0x2363ee === 'rm')
                        ((_0x410b6b.x = _0x54e600.startRect.x), (_0x410b6b.y = _0x54e600.startRect.y));
                      else {
                        if (_0x2363ee === 'tm')
                          ((_0x410b6b.x = _0x54e600.startRect.x),
                            (_0x410b6b.y = _0x54e600.startRect.y + _0x54e600.startRect.h - _0x410b6b.h));
                        else
                          _0x2363ee === 'bm' &&
                            ((_0x410b6b.x = _0x54e600.startRect.x), (_0x410b6b.y = _0x54e600.startRect.y));
                      }
                    }
                  }
                }
              }
            }
            return _0x410b6b;
          };
        if (!_0x39e69c()) {
          let _0x2822c1 = { ..._0x54e600.startRect };
          if (_0x36fab0 === 'tl')
            ((_0x2822c1.x = _0x54e600.startRect.x + _0xd6fe6f),
              (_0x2822c1.y = _0x54e600.startRect.y + _0x461972),
              (_0x2822c1.w = _0x54e600.startRect.w - _0xd6fe6f),
              (_0x2822c1.h = _0x54e600.startRect.h - _0x461972),
              (_0x2822c1 = _0x5727b8(_0x2822c1, 'tl')));
          else {
            if (_0x36fab0 === 'tr')
              ((_0x2822c1.y = _0x54e600.startRect.y + _0x461972),
                (_0x2822c1.w = _0x54e600.startRect.w + _0xd6fe6f),
                (_0x2822c1.h = _0x54e600.startRect.h - _0x461972),
                (_0x2822c1 = _0x5727b8(_0x2822c1, 'tr')));
            else {
              if (_0x36fab0 === 'bl')
                ((_0x2822c1.x = _0x54e600.startRect.x + _0xd6fe6f),
                  (_0x2822c1.w = _0x54e600.startRect.w - _0xd6fe6f),
                  (_0x2822c1.h = _0x54e600.startRect.h + _0x461972),
                  (_0x2822c1 = _0x5727b8(_0x2822c1, 'bl')));
              else {
                if (_0x36fab0 === 'br')
                  ((_0x2822c1.w = _0x54e600.startRect.w + _0xd6fe6f),
                    (_0x2822c1.h = _0x54e600.startRect.h + _0x461972),
                    (_0x2822c1 = _0x5727b8(_0x2822c1, 'br')));
                else {
                  if (_0x36fab0 === 'tm')
                    ((_0x2822c1.y = _0x54e600.startRect.y + _0x461972),
                      (_0x2822c1.h = _0x54e600.startRect.h - _0x461972),
                      (_0x2822c1 = _0x5727b8(_0x2822c1, 'tm')));
                  else {
                    if (_0x36fab0 === 'bm')
                      ((_0x2822c1.h = _0x54e600.startRect.h + _0x461972),
                        (_0x2822c1 = _0x5727b8(_0x2822c1, 'bm')));
                    else {
                      if (_0x36fab0 === 'lm')
                        ((_0x2822c1.x = _0x54e600.startRect.x + _0xd6fe6f),
                          (_0x2822c1.w = _0x54e600.startRect.w - _0xd6fe6f),
                          (_0x2822c1 = _0x5727b8(_0x2822c1, 'lm')));
                      else
                        _0x36fab0 === 'rm' &&
                          ((_0x2822c1.w = _0x54e600.startRect.w + _0xd6fe6f),
                          (_0x2822c1 = _0x5727b8(_0x2822c1, 'rm')));
                    }
                  }
                }
              }
            }
          }
          ((this.frameRect = _0x1be15b(_0x2822c1)), this._updateView(this._view));
          return;
        }
        const _0x5d92b3 = this._parseRatio(),
          _0x3d4583 = _0x54e600.startRect.x + _0x54e600.startRect.w / 2,
          _0x1451b5 = _0x54e600.startRect.y + _0x54e600.startRect.h / 2;
        let _0x2cbdd1 = { ..._0x54e600.startRect };
        if (_0x36fab0 === 'lm' || _0x36fab0 === 'rm') {
          let _0x598cbe = _0x54e600.startRect.w + (_0x36fab0 === 'rm' ? _0xd6fe6f : -_0xd6fe6f);
          _0x598cbe = Math.max(_0x598cbe, _0x294841);
          let _0x5b6fe5 = _0x598cbe / _0x5d92b3;
          (_0x5b6fe5 < _0x42a40f && ((_0x5b6fe5 = _0x42a40f), (_0x598cbe = _0x5b6fe5 * _0x5d92b3)),
            (_0x2cbdd1.w = _0x598cbe),
            (_0x2cbdd1.h = _0x5b6fe5),
            (_0x2cbdd1.x =
              _0x36fab0 === 'rm'
                ? _0x54e600.startRect.x
                : _0x54e600.startRect.x + _0x54e600.startRect.w - _0x2cbdd1.w),
            (_0x2cbdd1.y = _0x1451b5 - _0x2cbdd1.h / 2));
        } else {
          if (_0x36fab0 === 'tm' || _0x36fab0 === 'bm') {
            let _0x146d1c = _0x54e600.startRect.h + (_0x36fab0 === 'bm' ? _0x461972 : -_0x461972);
            _0x146d1c = Math.max(_0x146d1c, _0x42a40f);
            let _0x36d54b = _0x146d1c * _0x5d92b3;
            (_0x36d54b < _0x294841 && ((_0x36d54b = _0x294841), (_0x146d1c = _0x36d54b / _0x5d92b3)),
              (_0x2cbdd1.w = _0x36d54b),
              (_0x2cbdd1.h = _0x146d1c),
              (_0x2cbdd1.y =
                _0x36fab0 === 'bm'
                  ? _0x54e600.startRect.y
                  : _0x54e600.startRect.y + _0x54e600.startRect.h - _0x2cbdd1.h),
              (_0x2cbdd1.x = _0x3d4583 - _0x2cbdd1.w / 2));
          } else {
            const _0x2ef8bb = _0x36fab0 === 'tr' || _0x36fab0 === 'br' ? 1 : -1,
              _0xc43a6a = _0x36fab0 === 'bl' || _0x36fab0 === 'br' ? 1 : -1;
            let _0x2090a4 = _0x54e600.startRect.w + _0xd6fe6f * _0x2ef8bb,
              _0x476a6d = _0x54e600.startRect.h + _0x461972 * _0xc43a6a;
            ((_0x2090a4 = Math.max(_0x2090a4, 1)), (_0x476a6d = Math.max(_0x476a6d, 1)));
            _0x2090a4 / _0x476a6d > _0x5d92b3
              ? (_0x476a6d = _0x2090a4 / _0x5d92b3)
              : (_0x2090a4 = _0x476a6d * _0x5d92b3);
            _0x2090a4 < _0x294841 && ((_0x2090a4 = _0x294841), (_0x476a6d = _0x2090a4 / _0x5d92b3));
            _0x476a6d < _0x42a40f && ((_0x476a6d = _0x42a40f), (_0x2090a4 = _0x476a6d * _0x5d92b3));
            ((_0x2cbdd1.w = _0x2090a4), (_0x2cbdd1.h = _0x476a6d));
            if (_0x36fab0 === 'br')
              ((_0x2cbdd1.x = _0x54e600.startRect.x), (_0x2cbdd1.y = _0x54e600.startRect.y));
            else {
              if (_0x36fab0 === 'bl')
                ((_0x2cbdd1.x = _0x54e600.startRect.x + _0x54e600.startRect.w - _0x2cbdd1.w),
                  (_0x2cbdd1.y = _0x54e600.startRect.y));
              else
                _0x36fab0 === 'tr'
                  ? ((_0x2cbdd1.x = _0x54e600.startRect.x),
                    (_0x2cbdd1.y = _0x54e600.startRect.y + _0x54e600.startRect.h - _0x2cbdd1.h))
                  : ((_0x2cbdd1.x = _0x54e600.startRect.x + _0x54e600.startRect.w - _0x2cbdd1.w),
                    (_0x2cbdd1.y = _0x54e600.startRect.y + _0x54e600.startRect.h - _0x2cbdd1.h));
            }
          }
        }
        ((this.frameRect = _0x1be15b(_0x2cbdd1)), this._updateView(this._view));
      },
      _0x178062 = (_0x1cbf18) => {
        const _0x37233b = this._pointerState;
        if (!_0x37233b || _0x1cbf18.pointerId !== _0x37233b.pointerId) return;
        (_0x1cbf18.preventDefault(), _0x4fb161());
      },
      _0x371fb6 = (_0x49277d) => {
        if (_0x49277d.button !== 0) return;
        (_0x49277d.stopPropagation(), _0x49277d.preventDefault());
        if (!this.frameRect) this.frameRect = this._calcFrameWorldRect();
        this.frameRect = this._clampFrameRect(this.frameRect);
        const _0x1c758f = _0x49277d.target.closest('.v2-expand-handle'),
          _0x107469 = _0x1c758f?.dataset?.handle || null,
          _0x53d3fc = _0x107469 ? 'resize' : 'drag';
        ((this._pointerState = {
          pointerId: _0x49277d.pointerId,
          mode: _0x53d3fc,
          handle: _0x107469,
          startX: _0x49277d.clientX,
          startY: _0x49277d.clientY,
          startRect: { ...this.frameRect },
          zoom: this._view?.viewport?.zoom || 1,
        }),
          this.frameEl.setPointerCapture?.(_0x49277d.pointerId),
          window.addEventListener('pointermove', _0x335263, true),
          window.addEventListener('pointerup', _0x178062, true),
          window.addEventListener('pointercancel', _0x178062, true));
      };
    (this.frameEl.addEventListener('pointerdown', _0x371fb6),
      (this.cleanup = () => {
        (_0x4fb161(),
          window.removeEventListener('resize', _0x5a5664),
          window.removeEventListener('keydown', _0x419135),
          document.removeEventListener('pointerdown', _0x1cbad8, true),
          this.overlayEl?.removeEventListener('wheel', _0x402d98),
          this.frameEl?.removeEventListener('pointerdown', _0x371fb6),
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

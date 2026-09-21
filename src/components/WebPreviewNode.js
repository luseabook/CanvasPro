import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { registerWebPreviewSlot } from '../services/webPreviewViewSyncService.js';
import { clampWebPreviewNodeSize } from '../modules/webPreviewSizing.js';
import {
  activateWebPreviewTabData,
  addWebPreviewTabData,
  closeWebPreviewTabData,
  getWebPreviewActiveTabUrl,
  normalizeWebPreviewTabs,
  updateWebPreviewTabFaviconData,
  updateWebPreviewTabUrlData,
} from '../modules/webPreviewTabs.js';
import { normalizeWebPreviewAddressInput, normalizeWebPreviewUrl } from '../modules/webPreviewUrl.js';
import {
  createWebReferenceCardNode,
  createWebPreviewImagePromptNodeFromSelection,
  createWebPreviewImageNodeFromContext,
  createWebPreviewReverseImagePromptNodes,
  createWebPreviewSourceTextNodeFromSelection,
  createWebPreviewTextNodeFromSelection,
  createWebPreviewVideoPromptNodeFromSelection,
  openWebPreviewMediaPicker,
} from '../modules/webPreviewCaptureFlow.js';
import { recordWebPreviewVisit } from '../services/webPreviewStartPageService.js';
import { WebPreviewStartPageView } from './webPreview/WebPreviewStartPageView.js';
import { WebPreviewTabBarView } from './webPreview/WebPreviewTabBarView.js';
import { createWebPreviewToolbar } from './webPreview/WebPreviewToolbarView.js';
import { getWebPreviewDefaultStatusText } from './webPreview/webPreviewConstants.js';
import { onLocaleChange, t } from '../i18n/index.js';
function webPreviewText(_0x563545, _0x86c133 = {}) {
  return t('webPreview.' + _0x563545, _0x86c133);
}
const WEB_PREVIEW_REVERSE_PROMPT_GENERATE_EVENT = 'reverse-image-prompt-generate',
  WEB_PREVIEW_TEXT_SOURCE_EVENT = 'send-selected-text-source',
  WEB_PREVIEW_TEXT_IMAGE_PROMPT_EVENT = 'send-selected-text-to-image',
  WEB_PREVIEW_TEXT_IMAGE_PROMPT_GENERATE_EVENT = 'send-selected-text-to-image-generate',
  WEB_PREVIEW_TEXT_VIDEO_PROMPT_EVENT = 'send-selected-text-to-video',
  WEB_PREVIEW_TEXT_VIDEO_PROMPT_GENERATE_EVENT = 'send-selected-text-to-video-generate',
  WEB_PREVIEW_REVERSE_PROMPT_MOUNT_ATTEMPTS = 30,
  WEB_PREVIEW_REVERSE_PROMPT_MOUNT_DELAY_MS = 16;
function dispatchWebPreviewForceSync(_0x420417) {
  globalThis.window?.dispatchEvent?.(
    new CustomEvent('web-preview:force-sync', { detail: { nodeId: _0x420417 } }),
  );
}
function waitForNextFrame() {
  return new Promise((_0x3acd2b) => {
    const _0x5be155 = globalThis.window;
    if (typeof _0x5be155?.requestAnimationFrame === 'function') {
      _0x5be155.requestAnimationFrame(() => _0x3acd2b());
      return;
    }
    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(() => _0x3acd2b());
      return;
    }
    if (typeof globalThis.setTimeout === 'function') {
      globalThis.setTimeout(_0x3acd2b, WEB_PREVIEW_REVERSE_PROMPT_MOUNT_DELAY_MS);
      return;
    }
    _0x3acd2b();
  });
}
function getMountedCanvasNodeInstance(_0x1589d5) {
  const _0x2a8e00 = String(_0x1589d5 || '').trim();
  return _0x2a8e00 ? globalThis.window?.v2Renderer?.nodeInstances?.get?.(_0x2a8e00) || null : null;
}
async function waitForMountedCanvasNodeInstance(_0x49675e) {
  for (let _0x2935e3 = 0; _0x2935e3 < WEB_PREVIEW_REVERSE_PROMPT_MOUNT_ATTEMPTS; _0x2935e3 += 1) {
    const _0x403f72 = getMountedCanvasNodeInstance(_0x49675e);
    if (_0x403f72) return _0x403f72;
    await waitForNextFrame();
  }
  return null;
}
function getCanvasCommandFailureText(_0x13f583) {
  return String(
    _0x13f583?.message ||
      _0x13f583?.errorCode ||
      _0x13f583?.error ||
      webPreviewText('toasts.reversePromptGenerateUnavailable'),
  );
}
function getPendingVisitKey(_0x11abaa, _0x491939) {
  return (_0x11abaa || '') + '\n' + (_0x491939 || '');
}
export function commitWebPreviewNodeUrl({
  nodeId: _0x392bbc,
  rawUrl: _0x5d794d,
  title: title = '',
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis.window?.showToast,
  recordVisitFn: recordVisitFn = recordWebPreviewVisit,
  tabId: tabId = '',
  nodeData: nodeData = null,
} = {}) {
  const _0x3f0f39 = normalizeWebPreviewAddressInput(_0x5d794d);
  if (!_0x3f0f39)
    return (
      showToast?.(webPreviewText('toasts.addressRequired'), 'warning'),
      { ok: false, error: 'invalid-url' }
    );
  if (!_0x392bbc || typeof storeInstance?.updateNodeData !== 'function')
    return { ok: false, error: 'missing-node' };
  const _0x4f6454 = nodeData ||
      storeInstance.getStateRaw?.()?.nodes?.[_0x392bbc] ||
      storeInstance.getState?.()?.nodes?.[_0x392bbc] || { id: _0x392bbc, type: 'web-preview', webUrl: '' },
    _0x23c200 = updateWebPreviewTabUrlData(_0x4f6454, { tabId: tabId, url: _0x3f0f39, title: title });
  if (_0x23c200.ok === false) return { ok: false, error: _0x23c200.error || 'missing-tab' };
  const _0xef05c6 = { ..._0x23c200.patch, name: webPreviewText('nodeName') };
  return (
    storeInstance.updateNodeData(_0x392bbc, { ..._0xef05c6 }),
    recordVisitFn?.({ url: _0x3f0f39, title: title }),
    commitFn?.(),
    dispatchWebPreviewForceSync(_0x392bbc),
    { ok: true, url: _0x3f0f39, tabId: _0x23c200.tabId, patch: _0xef05c6 }
  );
}
export class WebPreviewNode {
  constructor(_0x2981c8) {
    ((this._data = _0x2981c8),
      (this.id = _0x2981c8.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component web-preview-component'),
      (this._statusText = getWebPreviewDefaultStatusText()),
      (this._unsubscribeNativeEvent = null),
      (this._unsubscribeLocale = null),
      (this._navigationState = { canGoBack: false, canGoForward: false }),
      (this._navigationStateByTabId = new Map()),
      (this._backButtons = []),
      (this._forwardButtons = []),
      (this._fullscreenOverlay = null),
      (this._fullscreenInput = null),
      (this._fullscreenTabBar = null),
      (this._fullscreenSlot = null),
      (this._freezeLayer = null),
      (this._freezeImage = null),
      (this._freezeSnapshotSerial = 0),
      (this._fullscreenKeyHandler = null),
      (this._unregisterSlot = null),
      (this._unregisterFullscreenSlot = null),
      (this._toolbar = null),
      (this._fullscreenToolbar = null),
      (this._tabBar = null),
      (this._startPageView = null),
      (this._pendingVisitTitles = new Map()));
  }
  ['mount']() {
    const _0x1c4f1d = document.createElement('div');
    ((_0x1c4f1d.className = 'node-card web-preview-card'),
      _0x1c4f1d.addEventListener('dblclick', (_0x1e113a) => _0x1e113a.stopPropagation()));
    const _0x41a567 = createWebPreviewToolbar({
        className: 'web-preview-header',
        url: this._getActiveUrl(),
        onSubmit: (_0x1b5ee6) => this._commitUrl(_0x1b5ee6),
        onBack: () => this._navigate('back'),
        onForward: () => this._navigate('forward'),
        onRefresh: () => this._refresh(),
        onExtractMedia: () => this._extractMedia(),
        onSaveReference: () => this._saveReferenceCard(),
        onExternal: () => this._openExternal(),
        onFullscreen: () => this._openFullscreen(),
      }),
      _0x1410b9 = this._createTabBarView(),
      _0x390aa6 = document.createElement('div');
    ((_0x390aa6.className = 'web-preview-body'),
      (_0x390aa6.dataset.webPreviewSlot = 'true'),
      (_0x390aa6.dataset.nodeId = this.id),
      (_0x390aa6.dataset.tabId = this._getActiveTabId()),
      (_0x390aa6.dataset.webUrl = this._getActiveUrl()),
      _0x390aa6.addEventListener('pointerdown', (_0x19fc01) => {
        const _0x42ab5b = this._getTabState().activeTab;
        if (this._getActiveUrl() || _0x42ab5b?.pendingPopup === true) _0x19fc01.stopPropagation();
      }));
    const _0x46fb1b = new WebPreviewStartPageView({
        statusText: getWebPreviewDefaultStatusText(),
        onOpenUrl: (_0x3d4ca6, _0x3a7fb4) => this._commitUrl(_0x3d4ca6, _0x3a7fb4),
      }),
      _0x30e061 = _0x46fb1b.mount();
    _0x390aa6.appendChild(_0x30e061);
    const _0x443a09 = document.createElement('div');
    _0x443a09.className = 'web-preview-freeze-layer';
    const _0x10ab04 = document.createElement('img');
    ((_0x10ab04.className = 'web-preview-freeze-image'),
      (_0x10ab04.alt = ''),
      _0x443a09.appendChild(_0x10ab04),
      _0x390aa6.appendChild(_0x443a09));
    const _0x184a14 = document.createElement('div');
    ((_0x184a14.className = 'web-preview-status'),
      (_0x184a14.textContent = getWebPreviewDefaultStatusText()));
    const _0x21050b = document.createElement('div');
    _0x21050b.className = 'node-port out-port';
    const _0x8eda99 = document.createElement('div');
    return (
      (_0x8eda99.className = 'group-resizer'),
      _0x8eda99.addEventListener('pointerdown', (_0x19b1e2) => {
        (_0x19b1e2.stopPropagation(),
          startNodeResizePreview({
            event: _0x19b1e2,
            nodeId: this.id,
            getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
            getViewport: () => appStore.getStateRaw().viewport,
            resolveSize: ({ startWidth: _0x231e20, startHeight: _0x5a5799, dx: _0x2b7f4b, dy: _0x2b3df2 }) =>
              clampWebPreviewNodeSize({ width: _0x231e20 + _0x2b7f4b, height: _0x5a5799 + _0x2b3df2 }),
            applyPatch: (_0x3f2b55) => appStore.updateNodeData(this.id, _0x3f2b55),
            commit: commit,
          }));
      }),
      _0x1c4f1d.appendChild(_0x41a567.element),
      _0x1c4f1d.appendChild(_0x1410b9.element),
      _0x1c4f1d.appendChild(_0x390aa6),
      _0x1c4f1d.appendChild(_0x184a14),
      _0x1c4f1d.appendChild(_0x21050b),
      _0x1c4f1d.appendChild(_0x8eda99),
      this.el.replaceChildren(_0x1c4f1d),
      (this._toolbar = _0x41a567),
      (this._tabBar = _0x1410b9),
      (this._startPageView = _0x46fb1b),
      (this._input = _0x41a567.input),
      (this._emptyInput = _0x46fb1b.input),
      (this._slot = _0x390aa6),
      this._unregisterSlot?.(),
      (this._unregisterSlot = registerWebPreviewSlot(this.id, _0x390aa6)),
      (this._placeholder = _0x30e061),
      (this._status = _0x184a14),
      (this._freezeLayer = _0x443a09),
      (this._freezeImage = _0x10ab04),
      (this._backButtons = [_0x41a567.backButton]),
      (this._forwardButtons = [_0x41a567.forwardButton]),
      this._syncDom(),
      this._renderStartPageTiles(),
      this._syncNavigationButtons(),
      this._bindNativeEvents(),
      this._bindLocaleChange(),
      this.el
    );
  }
  ['_createTabBarView']() {
    return new WebPreviewTabBarView({
      onActivate: (_0x1a3ac9) => this._activateTab(_0x1a3ac9),
      onClose: (_0x338b7a) => this._closeTab(_0x338b7a),
      onAdd: () => this._addTab(),
    });
  }
  ['_bindLocaleChange']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncLocaleTexts());
  }
  ['_syncLocaleTexts']() {
    (this._toolbar?.syncLocale?.(),
      this._fullscreenToolbar?.syncLocale?.(),
      this._startPageView?.syncLocale?.(),
      this._tabBar?.setTabs(this._data),
      this._fullscreenTabBar?.setTabs(this._data),
      !this._getActiveUrl() && this._setStatus(getWebPreviewDefaultStatusText()));
  }
  ['_getTabState']() {
    return normalizeWebPreviewTabs(this._data);
  }
  ['_getActiveTabId']() {
    return this._getTabState().activeTabId;
  }
  ['_getActiveUrl']() {
    return getWebPreviewActiveTabUrl(this._data);
  }
  ['_applyTabPatch'](_0x45802d, { commitHistory: commitHistory = false } = {}) {
    if (!_0x45802d) return;
    ((this._data = { ...this._data, ..._0x45802d }), appStore.updateNodeData(this.id, _0x45802d));
    if (commitHistory) commit();
    (this._clearSnapshot(), this._syncDom(), dispatchWebPreviewForceSync(this.id));
  }
  ['_addTab']({ id: id = '', url: url = '', title: title = '', pendingPopup: pendingPopup = false } = {}) {
    const _0x3e9943 = addWebPreviewTabData(this._data, {
      id: id,
      url: url,
      title: title,
      pendingPopup: pendingPopup,
    });
    if (_0x3e9943.ok === false)
      return (globalThis.window?.showToast?.(webPreviewText('toasts.maxTabs'), 'warning'), _0x3e9943);
    return (
      this._applyTabPatch(_0x3e9943.patch, { commitHistory: true }),
      this._setStatus(getWebPreviewDefaultStatusText()),
      _0x3e9943
    );
  }
  ['_activateTab'](_0x1e5bb5) {
    const _0xb2d8d5 = activateWebPreviewTabData(this._data, _0x1e5bb5);
    if (_0xb2d8d5.ok === false) return;
    (this._applyTabPatch(_0xb2d8d5.patch), this._syncNavigationButtons());
  }
  ['_disposeNativeTab'](_0x56c44e) {
    if (!_0x56c44e) return;
    const _0x46ef70 = globalThis.window?.electronAPI?.webPreview?.disposeViews?.({
      nodeIds: [this.id],
      tabIds: [_0x56c44e],
    });
    _0x46ef70 && typeof _0x46ef70.catch === 'function' && void _0x46ef70.catch(() => {});
  }
  ['_closeTab'](_0x37ea3d) {
    const _0xa188ec = closeWebPreviewTabData(this._data, _0x37ea3d);
    if (_0xa188ec.ok === false) return;
    (this._disposeNativeTab(_0xa188ec.closedTabId),
      this._navigationStateByTabId.delete(_0xa188ec.closedTabId),
      this._applyTabPatch(_0xa188ec.patch, { commitHistory: true }),
      this._syncNavigationButtons());
    if (!_0xa188ec.state.webUrl) this._setStatus(getWebPreviewDefaultStatusText());
  }
  ['_openPopupTab'](_0x2cfeea, { tabId: tabId = '', pendingPopup: pendingPopup = false } = {}) {
    const _0x16a087 = normalizeWebPreviewUrl(_0x2cfeea);
    if (!_0x16a087 && pendingPopup !== true) return;
    const _0x315dec = this._addTab({
      id: tabId,
      url: _0x16a087,
      title: pendingPopup === true ? webPreviewText('tabs.loginWindow') : '',
      pendingPopup: pendingPopup === true && !_0x16a087,
    });
    if (_0x315dec?.ok === false) {
      if (tabId) this._disposeNativeTab(tabId);
      return;
    }
    if (_0x315dec?.ok) this._setStatus(webPreviewText('status.loading'));
  }
  ['_renderStartPageTiles']() {
    this._startPageView?.renderTiles();
  }
  ['_bindNativeEvents']() {
    const _0x1f4f90 = globalThis.window;
    if (!_0x1f4f90 || typeof _0x1f4f90.addEventListener !== 'function') return;
    const _0x217d5e = (_0x240a00) => {
      const _0x2fbd9b = _0x240a00?.detail || {};
      if (_0x2fbd9b.nodeId !== this.id) return;
      const _0x4accdb = _0x2fbd9b.tabId || this._getActiveTabId(),
        _0x371f0b = _0x4accdb === this._getActiveTabId();
      if (_0x2fbd9b.type === 'loading')
        _0x371f0b &&
          (_0x2fbd9b.holdSnapshot === true
            ? this.el.classList.add('is-web-preview-loading')
            : this._clearSnapshot(),
          this._setStatus(webPreviewText('status.loading')));
      else {
        if (_0x2fbd9b.type === 'loaded')
          _0x371f0b &&
            (this.el.classList.remove('is-web-preview-loading'),
            this._setStatus(webPreviewText('status.loaded')));
        else {
          if (_0x2fbd9b.type === 'failed')
            _0x371f0b &&
              (this.el.classList.remove('is-web-preview-loading'),
              this._setStatus(_0x2fbd9b.message || webPreviewText('status.loadFailed')));
          else {
            if (_0x2fbd9b.type === 'blocked')
              _0x371f0b &&
                (this.el.classList.remove('is-web-preview-loading'),
                this._setStatus(_0x2fbd9b.message || webPreviewText('status.blocked')));
            else {
              if (_0x2fbd9b.type === 'open-popup')
                this._openPopupTab(_0x2fbd9b.url, {
                  tabId: _0x2fbd9b.popupTabId,
                  pendingPopup: _0x2fbd9b.pendingPopup === true,
                });
              else {
                if (_0x2fbd9b.type === 'closed') {
                  if (_0x4accdb) this._closeTab(_0x4accdb);
                } else {
                  if (_0x2fbd9b.type === 'send-selected-text') {
                    const _0x56217b = createWebPreviewTextNodeFromSelection({
                      nodeId: this.id,
                      payload: _0x2fbd9b,
                    });
                    if (_0x56217b)
                      globalThis.window?.showToast?.(webPreviewText('toasts.textSent'), 'success');
                  } else {
                    if (_0x2fbd9b.type === WEB_PREVIEW_TEXT_SOURCE_EVENT) {
                      const _0x51ebd2 = createWebPreviewSourceTextNodeFromSelection({
                        nodeId: this.id,
                        payload: _0x2fbd9b,
                      });
                      if (_0x51ebd2)
                        globalThis.window?.showToast?.(webPreviewText('toasts.sourceTextSent'), 'success');
                    } else {
                      if (
                        _0x2fbd9b.type === WEB_PREVIEW_TEXT_IMAGE_PROMPT_EVENT ||
                        _0x2fbd9b.type === WEB_PREVIEW_TEXT_IMAGE_PROMPT_GENERATE_EVENT
                      ) {
                        const _0x12696a = createWebPreviewImagePromptNodeFromSelection({
                          nodeId: this.id,
                          payload: _0x2fbd9b,
                        });
                        if (_0x12696a && _0x2fbd9b.type === WEB_PREVIEW_TEXT_IMAGE_PROMPT_GENERATE_EVENT)
                          void this._runImagePromptGeneration(_0x12696a);
                        else
                          _0x12696a &&
                            globalThis.window?.showToast?.(
                              webPreviewText('toasts.imagePromptCreated'),
                              'success',
                            );
                      } else {
                        if (
                          _0x2fbd9b.type === WEB_PREVIEW_TEXT_VIDEO_PROMPT_EVENT ||
                          _0x2fbd9b.type === WEB_PREVIEW_TEXT_VIDEO_PROMPT_GENERATE_EVENT
                        ) {
                          const _0x3b8e66 = createWebPreviewVideoPromptNodeFromSelection({
                            nodeId: this.id,
                            payload: _0x2fbd9b,
                          });
                          if (_0x3b8e66 && _0x2fbd9b.type === WEB_PREVIEW_TEXT_VIDEO_PROMPT_GENERATE_EVENT)
                            void this._runVideoPromptGeneration(_0x3b8e66);
                          else
                            _0x3b8e66 &&
                              globalThis.window?.showToast?.(
                                webPreviewText('toasts.videoPromptCreated'),
                                'success',
                              );
                        } else {
                          if (_0x2fbd9b.type === 'send-image-to-canvas') {
                            const _0x375375 = createWebPreviewImageNodeFromContext({
                              nodeId: this.id,
                              payload: _0x2fbd9b,
                            });
                            if (_0x375375)
                              globalThis.window?.showToast?.(webPreviewText('toasts.imageAdded'), 'success');
                          } else {
                            if (
                              _0x2fbd9b.type === 'reverse-image-prompt' ||
                              _0x2fbd9b.type === WEB_PREVIEW_REVERSE_PROMPT_GENERATE_EVENT
                            ) {
                              const _0x484b9a = createWebPreviewReverseImagePromptNodes({
                                nodeId: this.id,
                                payload: _0x2fbd9b,
                              });
                              if (_0x484b9a && _0x2fbd9b.type === WEB_PREVIEW_REVERSE_PROMPT_GENERATE_EVENT)
                                void this._runReverseImagePromptGeneration(_0x484b9a);
                              else
                                _0x484b9a &&
                                  globalThis.window?.showToast?.(
                                    webPreviewText('toasts.reversePromptCreated'),
                                    'success',
                                  );
                            } else {
                              if (_0x2fbd9b.type === 'favicon')
                                this._applyFavicon(_0x2fbd9b.faviconUrl, _0x4accdb);
                              else {
                                if (_0x2fbd9b.type === 'navigated')
                                  this._applyNavigatedUrl(_0x2fbd9b.url, _0x4accdb);
                                else {
                                  if (_0x2fbd9b.type === 'navigation-state')
                                    this._setNavigationState(_0x2fbd9b);
                                  else {
                                    if (_0x2fbd9b.type === 'snapshot' && _0x371f0b)
                                      this._applySnapshot(_0x2fbd9b);
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    (_0x1f4f90.addEventListener('web-preview:native-event', _0x217d5e),
      (this._unsubscribeNativeEvent = () => {
        _0x1f4f90.removeEventListener?.('web-preview:native-event', _0x217d5e);
      }));
  }
  async ['_runCreatedNodeGeneration'](
    _0x19a119,
    { startedKey: _0x119bde, failedKey: _0x4172d4, nodeNotReadyKey: _0x35b4da } = {},
  ) {
    const _0x343a51 = String(_0x19a119 || '').trim(),
      _0x90a729 = globalThis.window?.showToast,
      _0x416bee = (_0x3d3f94) => {
        _0x90a729?.(
          webPreviewText(_0x4172d4 || 'toasts.reversePromptGenerateFailed', {
            error: String(_0x3d3f94 || webPreviewText('toasts.reversePromptGenerateUnavailable')),
          }),
          'warning',
        );
      };
    if (!_0x343a51) {
      _0x416bee(webPreviewText('toasts.reversePromptGenerateUnavailable'));
      return;
    }
    const _0x36bda2 = await waitForMountedCanvasNodeInstance(_0x343a51);
    if (!_0x36bda2) {
      _0x416bee(webPreviewText(_0x35b4da || 'toasts.reversePromptGenerateNodeNotReady'));
      return;
    }
    const _0x514b13 = globalThis.window?.canvasCommands;
    if (typeof _0x514b13?.executeCanvasCommand !== 'function') {
      _0x416bee(webPreviewText('toasts.reversePromptGenerateUnavailable'));
      return;
    }
    _0x90a729?.(webPreviewText(_0x119bde || 'toasts.reversePromptGenerateStarted'), 'success');
    try {
      const _0x539fe4 = await _0x514b13.executeCanvasCommand('generation.run', { nodeId: _0x343a51 });
      _0x539fe4?.ok === false && _0x416bee(getCanvasCommandFailureText(_0x539fe4));
    } catch (_0xf0e4a0) {
      _0x416bee(_0xf0e4a0?.message || _0xf0e4a0);
    }
  }
  async ['_runReverseImagePromptGeneration'](_0x4c3aa3) {
    await this._runCreatedNodeGeneration(_0x4c3aa3?.textNode?.id, {
      startedKey: 'toasts.reversePromptGenerateStarted',
      failedKey: 'toasts.reversePromptGenerateFailed',
      nodeNotReadyKey: 'toasts.reversePromptGenerateNodeNotReady',
    });
  }
  async ['_runImagePromptGeneration'](_0x31802f) {
    await this._runCreatedNodeGeneration(_0x31802f?.id, {
      startedKey: 'toasts.imagePromptGenerateStarted',
      failedKey: 'toasts.imagePromptGenerateFailed',
      nodeNotReadyKey: 'toasts.imagePromptGenerateNodeNotReady',
    });
  }
  async ['_runVideoPromptGeneration'](_0xa90217) {
    await this._runCreatedNodeGeneration(_0xa90217?.id, {
      startedKey: 'toasts.videoPromptGenerateStarted',
      failedKey: 'toasts.videoPromptGenerateFailed',
      nodeNotReadyKey: 'toasts.videoPromptGenerateNodeNotReady',
    });
  }
  ['_readUrlInputValue']() {
    const _0x270356 = globalThis.document?.activeElement || null;
    if (_0x270356 === this._fullscreenInput) return this._fullscreenInput?.value || '';
    if (_0x270356 === this._input) return this._input?.value || '';
    if (_0x270356 === this._emptyInput) return this._emptyInput?.value || '';
    return (
      this._fullscreenInput?.value ||
      this._input?.value ||
      this._emptyInput?.value ||
      this._getActiveUrl() ||
      ''
    );
  }
  ['_commitUrl'](_0x3fc2d8 = this._readUrlInputValue(), { title: title = '' } = {}) {
    const _0x19d0fd = normalizeWebPreviewAddressInput(_0x3fc2d8),
      _0x18336c = this._getActiveTabId(),
      _0x4bcb94 = !!globalThis.window?.electronAPI?.webPreview;
    _0x19d0fd && title && this._pendingVisitTitles.set(getPendingVisitKey(_0x18336c, _0x19d0fd), title);
    const _0x3d29d8 = commitWebPreviewNodeUrl({
      nodeId: this.id,
      rawUrl: _0x3fc2d8,
      title: title,
      tabId: _0x18336c,
      nodeData: this._data,
      recordVisitFn: _0x4bcb94 ? null : recordWebPreviewVisit,
    });
    _0x3d29d8.ok &&
      ((this._data = { ...this._data, ..._0x3d29d8.patch }),
      this._syncDom(),
      this._renderStartPageTiles(),
      this._setStatus(webPreviewText('status.loading')));
  }
  ['_refresh']() {
    const _0x122f7a = globalThis.window?.electronAPI?.webPreview,
      _0x59caac = this._getActiveTabId();
    if (!this._getActiveUrl()) return;
    if (_0x122f7a?.controlView)
      void _0x122f7a.controlView({ nodeId: this.id, tabId: _0x59caac, action: 'reload' }).catch(() => {});
    else
      _0x122f7a?.disposeViews &&
        void _0x122f7a.disposeViews({ nodeIds: [this.id] }).finally(() => {
          dispatchWebPreviewForceSync(this.id);
        });
    this._setStatus(webPreviewText('status.refreshing'));
  }
  ['_navigate'](_0x34966d) {
    const _0x612475 = globalThis.window?.electronAPI?.webPreview,
      _0x4da184 = this._getActiveTabId();
    if (!this._getActiveUrl() || !_0x612475?.controlView) return;
    void _0x612475
      .controlView({ nodeId: this.id, tabId: _0x4da184, action: _0x34966d })
      .then((_0x40f58a) => {
        _0x40f58a?.ok === false &&
          _0x40f58a.error === 'no-history' &&
          this._setNavigationState({ ..._0x40f58a, tabId: _0x4da184 });
      })
      .catch(() => {});
  }
  ['_extractMedia']() {
    const _0x311631 = globalThis.window?.electronAPI?.webPreview,
      _0xb84797 = this._getActiveTabId();
    if (!this._getActiveUrl() || !_0x311631?.controlView) {
      globalThis.window?.showToast?.(webPreviewText('toasts.openPageFirst'), 'warning');
      return;
    }
    void _0x311631
      .controlView({ nodeId: this.id, tabId: _0xb84797, action: 'extract-media' })
      .then((_0x12ead2) => {
        if (_0x12ead2?.ok === false) {
          globalThis.window?.showToast?.(webPreviewText('toasts.extractMediaFailed'), 'error');
          return;
        }
        const _0x287482 = Array.isArray(_0x12ead2?.images) ? _0x12ead2.images : [],
          _0x8548c1 = Array.isArray(_0x12ead2?.videos) ? _0x12ead2.videos : [];
        openWebPreviewMediaPicker({
          nodeId: this.id,
          imageCandidates: _0x287482,
          videoCandidates: _0x8548c1,
        });
      })
      .catch(() => {
        globalThis.window?.showToast?.(webPreviewText('toasts.extractMediaFailed'), 'error');
      });
  }
  ['_saveReferenceCard']() {
    const _0x1080e1 = globalThis.window?.electronAPI?.webPreview,
      _0x59b1ea = this._getActiveTabId();
    if (!this._getActiveUrl() || !_0x1080e1?.controlView) {
      globalThis.window?.showToast?.(webPreviewText('toasts.openPageFirst'), 'warning');
      return;
    }
    void _0x1080e1
      .controlView({ nodeId: this.id, tabId: _0x59b1ea, action: 'capture-reference' })
      .then((_0x2edbc4) => {
        if (_0x2edbc4?.ok === false) {
          globalThis.window?.showToast?.(webPreviewText('toasts.saveReferenceFailed'), 'error');
          return;
        }
        const _0x3e7bce = createWebReferenceCardNode({ nodeId: this.id, payload: _0x2edbc4 });
        _0x3e7bce && globalThis.window?.showToast?.(webPreviewText('toasts.referenceAdded'), 'success');
      })
      .catch(() => {
        globalThis.window?.showToast?.(webPreviewText('toasts.saveReferenceFailed'), 'error');
      });
  }
  ['_openExternal']() {
    const _0x213ead = normalizeWebPreviewAddressInput(this._readUrlInputValue());
    if (!_0x213ead) {
      globalThis.window?.showToast?.(webPreviewText('toasts.addressRequired'), 'warning');
      return;
    }
    void openExternalLink(_0x213ead, { label: webPreviewText('nodeName') }).catch((_0x2c79bf) => {
      globalThis.window?.showToast?.(
        _0x2c79bf?.message || webPreviewText('toasts.openExternalFailed'),
        'error',
      );
    });
  }
  ['_openFullscreen']() {
    const _0x2c8692 = normalizeWebPreviewAddressInput(this._readUrlInputValue());
    if (!_0x2c8692) {
      globalThis.window?.showToast?.(webPreviewText('toasts.addressRequired'), 'warning');
      return;
    }
    _0x2c8692 !== normalizeWebPreviewUrl(this._getActiveUrl()) && this._commitUrl(_0x2c8692);
    if (this._fullscreenOverlay?.isConnected) {
      dispatchWebPreviewForceSync(this.id);
      return;
    }
    const _0x40b1d5 = document.createElement('div');
    ((_0x40b1d5.className = 'web-preview-fullscreen-overlay'),
      _0x40b1d5.addEventListener('pointerdown', (_0x333889) => _0x333889.stopPropagation()));
    const _0x4e9f63 = createWebPreviewToolbar({
        className: 'web-preview-fullscreen-header',
        url: _0x2c8692,
        onSubmit: (_0x599b45) => this._commitUrl(_0x599b45),
        onBack: () => this._navigate('back'),
        onForward: () => this._navigate('forward'),
        onRefresh: () => this._refresh(),
        onExtractMedia: () => this._extractMedia(),
        onSaveReference: () => this._saveReferenceCard(),
        onExternal: () => this._openExternal(),
        onExit: () => this._closeFullscreen(),
      }),
      _0x203fa2 = this._createTabBarView(),
      _0x584281 = document.createElement('div');
    ((_0x584281.className = 'web-preview-fullscreen-body'),
      (_0x584281.dataset.webPreviewSlot = 'true'),
      (_0x584281.dataset.webPreviewFullscreen = 'true'),
      (_0x584281.dataset.nodeId = this.id),
      (_0x584281.dataset.tabId = this._getActiveTabId()),
      (_0x584281.dataset.webUrl = this._getActiveUrl() || _0x2c8692),
      _0x40b1d5.appendChild(_0x4e9f63.element),
      _0x40b1d5.appendChild(_0x203fa2.element),
      _0x40b1d5.appendChild(_0x584281),
      document.body.appendChild(_0x40b1d5),
      (this._fullscreenOverlay = _0x40b1d5),
      (this._fullscreenToolbar = _0x4e9f63),
      (this._fullscreenInput = _0x4e9f63.input),
      (this._fullscreenTabBar = _0x203fa2),
      (this._fullscreenSlot = _0x584281),
      this._unregisterFullscreenSlot?.(),
      (this._unregisterFullscreenSlot = registerWebPreviewSlot(this.id, _0x584281)),
      (this._backButtons = [this._backButtons[0], _0x4e9f63.backButton].filter(Boolean)),
      (this._forwardButtons = [this._forwardButtons[0], _0x4e9f63.forwardButton].filter(Boolean)),
      (this._fullscreenKeyHandler = (_0x1331f6) => {
        if (_0x1331f6.key === 'Escape') this._closeFullscreen();
      }),
      globalThis.window?.addEventListener?.('keydown', this._fullscreenKeyHandler),
      this._syncDom(),
      this._syncNavigationButtons(),
      dispatchWebPreviewForceSync(this.id));
  }
  ['_closeFullscreen']() {
    if (!this._fullscreenOverlay) return;
    (this._fullscreenOverlay.remove(),
      (this._fullscreenOverlay = null),
      (this._fullscreenToolbar = null),
      (this._fullscreenInput = null),
      (this._fullscreenSlot = null),
      this._unregisterFullscreenSlot?.(),
      (this._unregisterFullscreenSlot = null),
      this._fullscreenKeyHandler &&
        (globalThis.window?.removeEventListener?.('keydown', this._fullscreenKeyHandler),
        (this._fullscreenKeyHandler = null)),
      (this._backButtons = [this._backButtons[0]].filter(Boolean)),
      (this._forwardButtons = [this._forwardButtons[0]].filter(Boolean)),
      dispatchWebPreviewForceSync(this.id));
  }
  ['_applyNavigatedUrl'](_0x76d469, _0x3d1cb0 = this._getActiveTabId()) {
    const _0x3bc5f6 = normalizeWebPreviewUrl(_0x76d469);
    if (!_0x3bc5f6) return;
    const _0x31c53b = getPendingVisitKey(_0x3d1cb0, _0x3bc5f6),
      _0x565e02 = this._pendingVisitTitles.get(_0x31c53b) || '';
    (this._pendingVisitTitles.delete(_0x31c53b),
      recordWebPreviewVisit({ url: _0x3bc5f6, title: _0x565e02 }),
      this._renderStartPageTiles());
    const _0x1adda6 = updateWebPreviewTabUrlData(this._data, {
      tabId: _0x3d1cb0,
      url: _0x3bc5f6,
      title: _0x565e02,
      activate: _0x3d1cb0 === this._getActiveTabId(),
    });
    if (_0x1adda6.ok === false) return;
    ((this._data = { ...this._data, ..._0x1adda6.patch }),
      appStore.updateNodeData(this.id, _0x1adda6.patch),
      this._syncDom());
  }
  ['_applyFavicon'](_0x3e71ff, _0x53bf65 = this._getActiveTabId()) {
    const _0x29007b = updateWebPreviewTabFaviconData(this._data, { tabId: _0x53bf65, faviconUrl: _0x3e71ff });
    if (_0x29007b.ok === false) return;
    ((this._data = { ...this._data, ..._0x29007b.patch }),
      appStore.updateNodeData(this.id, _0x29007b.patch),
      this._syncDom());
  }
  ['_setNavigationState'](_0xf807ca = {}) {
    const _0x16a1ff = _0xf807ca.tabId || this._getActiveTabId(),
      _0x9c6f34 = { canGoBack: Boolean(_0xf807ca.canGoBack), canGoForward: Boolean(_0xf807ca.canGoForward) };
    this._navigationStateByTabId.set(_0x16a1ff, _0x9c6f34);
    if (_0x16a1ff === this._getActiveTabId()) this._navigationState = _0x9c6f34;
    this._syncNavigationButtons();
  }
  ['_syncNavigationButtons']() {
    this._navigationState = this._navigationStateByTabId.get(this._getActiveTabId()) || {
      canGoBack: false,
      canGoForward: false,
    };
    for (const _0x4d6326 of this._backButtons) {
      if (_0x4d6326) _0x4d6326.disabled = !this._navigationState.canGoBack;
    }
    for (const _0xaa15f8 of this._forwardButtons) {
      if (_0xaa15f8) _0xaa15f8.disabled = !this._navigationState.canGoForward;
    }
  }
  ['_setStatus'](_0x1abd5b) {
    this._statusText = String(_0x1abd5b || getWebPreviewDefaultStatusText());
    if (this._status) this._status.textContent = this._statusText;
    this._startPageView?.setStatus(this._statusText);
  }
  ['_applySnapshot'](_0x2a1ff3 = {}) {
    const _0x14b95a = String(_0x2a1ff3.dataUrl || '');
    if (!_0x14b95a.startsWith('data:image/') || !this._freezeImage) return;
    const _0x4f25e1 = String(_0x2a1ff3.freezeToken || 'ready'),
      _0x57e955 = this._freezeSnapshotSerial + 1;
    this._freezeSnapshotSerial = _0x57e955;
    let _0x446913 = false;
    const _0x3c36e5 = () => {
        if (_0x446913) return;
        if (this._freezeSnapshotSerial !== _0x57e955 || !this._freezeImage) return;
        ((_0x446913 = true),
          (this._freezeImage.src = _0x14b95a),
          (this.el.dataset.webPreviewSnapshotToken = _0x4f25e1),
          this.el.classList.add('has-freeze-snapshot'),
          dispatchWebPreviewForceSync(this.id));
      },
      _0x3c90ea =
        typeof globalThis.Image === 'function'
          ? new globalThis['Image']()
          : globalThis.document?.createElement?.('img');
    if (!_0x3c90ea) {
      _0x3c36e5();
      return;
    }
    ((_0x3c90ea.onload = _0x3c36e5),
      (_0x3c90ea.onerror = () => {
        this._freezeSnapshotSerial === _0x57e955 &&
          (this.el.classList.remove('has-freeze-snapshot'), delete this.el.dataset.webPreviewSnapshotToken);
      }),
      (_0x3c90ea.src = _0x14b95a));
    if (typeof _0x3c90ea.decode === 'function')
      void _0x3c90ea
        .decode()
        .then(_0x3c36e5)
        .catch(() => {
          if (_0x3c90ea.complete) _0x3c36e5();
        });
    else _0x3c90ea.complete && _0x3c36e5();
  }
  ['_clearSnapshot']() {
    this._freezeSnapshotSerial += 1;
    if (this._freezeImage) this._freezeImage.removeAttribute('src');
    (delete this.el.dataset.webPreviewSnapshotToken,
      this.el.classList.remove('has-freeze-snapshot', 'is-web-preview-loading'));
  }
  ['_syncDom']() {
    const _0x4adac9 = this._getTabState(),
      _0x421b2c = _0x4adac9.webUrl || '';
    ((this._data = { ...this._data, activeTabId: _0x4adac9.activeTabId, webUrl: _0x421b2c }),
      this._tabBar?.setTabs(this._data),
      this._fullscreenTabBar?.setTabs(this._data));
    this._input && document.activeElement !== this._input && (this._input.value = _0x421b2c);
    this._startPageView?.setUrl(_0x421b2c);
    this._fullscreenInput &&
      document.activeElement !== this._fullscreenInput &&
      (this._fullscreenInput.value = _0x421b2c);
    this._slot?.dataset &&
      ((this._slot.dataset.webUrl = _0x421b2c),
      (this._slot.dataset.nodeId = this.id),
      (this._slot.dataset.tabId = _0x4adac9.activeTabId));
    this._fullscreenSlot?.dataset &&
      ((this._fullscreenSlot.dataset.webUrl = _0x421b2c),
      (this._fullscreenSlot.dataset.nodeId = this.id),
      (this._fullscreenSlot.dataset.tabId = _0x4adac9.activeTabId));
    const _0x19311d = Boolean(_0x421b2c || _0x4adac9.activeTab?.pendingPopup === true);
    this.el.classList.toggle('has-web-url', _0x19311d);
    if (!_0x19311d) (this._renderStartPageTiles(), this._setStatus(getWebPreviewDefaultStatusText()));
    else
      _0x421b2c &&
        !globalThis.window?.electronAPI?.webPreview &&
        this._setStatus(webPreviewText('status.nativeUnsupported'));
  }
  ['update'](_0x3e28e3) {
    ((this._data = _0x3e28e3), this._syncDom());
  }
  ['unmount']() {
    (this._closeFullscreen(),
      this._unregisterSlot?.(),
      (this._unregisterSlot = null),
      this._unregisterFullscreenSlot?.(),
      (this._unregisterFullscreenSlot = null),
      this._unsubscribeNativeEvent?.(),
      (this._unsubscribeNativeEvent = null),
      this._unsubscribeLocale?.(),
      (this._unsubscribeLocale = null));
    const _0x4b23ef = globalThis.window?.electronAPI?.webPreview;
    _0x4b23ef?.disposeViews && void _0x4b23ef.disposeViews({ nodeIds: [this.id] });
  }
}

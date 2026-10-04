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
function webPreviewText(value, item = {}) {
  return t('webPreview.' + value, item);
}
const WEB_PREVIEW_REVERSE_PROMPT_GENERATE_EVENT = 'reverse-image-prompt-generate',
  WEB_PREVIEW_TEXT_SOURCE_EVENT = 'send-selected-text-source',
  WEB_PREVIEW_TEXT_IMAGE_PROMPT_EVENT = 'send-selected-text-to-image',
  WEB_PREVIEW_TEXT_IMAGE_PROMPT_GENERATE_EVENT = 'send-selected-text-to-image-generate',
  WEB_PREVIEW_TEXT_VIDEO_PROMPT_EVENT = 'send-selected-text-to-video',
  WEB_PREVIEW_TEXT_VIDEO_PROMPT_GENERATE_EVENT = 'send-selected-text-to-video-generate',
  WEB_PREVIEW_REVERSE_PROMPT_MOUNT_ATTEMPTS = 30,
  WEB_PREVIEW_REVERSE_PROMPT_MOUNT_DELAY_MS = 16;
function dispatchWebPreviewForceSync(nodeId) {
  globalThis.window?.dispatchEvent?.(
    new CustomEvent('web-preview:force-sync', { detail: { nodeId: nodeId } }),
  );
}
function waitForNextFrame() {
  return new Promise((handler) => {
    const key = globalThis.window;
    if (typeof key?.requestAnimationFrame === 'function') {
      key.requestAnimationFrame(() => handler());
      return;
    }
    if (typeof globalThis.requestAnimationFrame === 'function') {
      globalThis.requestAnimationFrame(() => handler());
      return;
    }
    if (typeof globalThis.setTimeout === 'function') {
      globalThis.setTimeout(handler, WEB_PREVIEW_REVERSE_PROMPT_MOUNT_DELAY_MS);
      return;
    }
    handler();
  });
}
function getMountedCanvasNodeInstance(index) {
  const result = String(index || '').trim();
  return result ? globalThis.window?.v2Renderer?.nodeInstances?.get?.(result) || null : null;
}
async function waitForMountedCanvasNodeInstance(data) {
  for (let options = 0; options < WEB_PREVIEW_REVERSE_PROMPT_MOUNT_ATTEMPTS; options += 1) {
    const mountedCanvasNodeInstance = getMountedCanvasNodeInstance(data);
    if (mountedCanvasNodeInstance) return mountedCanvasNodeInstance;
    await waitForNextFrame();
  }
  return null;
}
function getCanvasCommandFailureText(error) {
  return String(
    error?.message ||
      error?.errorCode ||
      error?.error ||
      webPreviewText('toasts.reversePromptGenerateUnavailable'),
  );
}
function getPendingVisitKey(target, source) {
  return (target || '') + '\n' + (source || '');
}
export function commitWebPreviewNodeUrl({
  nodeId: nodeId2,
  rawUrl: rawUrl,
  title: title = '',
  storeInstance: storeInstance = appStore,
  commitFn: commitFn = commit,
  showToast: showToast = globalThis.window?.showToast,
  recordVisitFn: recordVisitFn = recordWebPreviewVisit,
  tabId: tabId = '',
  nodeData: nodeData = null,
} = {}) {
  const url2 = normalizeWebPreviewAddressInput(rawUrl);
  if (!url2)
    return (
      showToast?.(webPreviewText('toasts.addressRequired'), 'warning'),
      { ok: false, error: 'invalid-url' }
    );
  if (!nodeId2 || typeof storeInstance?.updateNodeData !== 'function')
    return { ok: false, error: 'missing-node' };
  const next = nodeData ||
      storeInstance.getStateRaw?.()?.nodes?.[nodeId2] ||
      storeInstance.getState?.()?.nodes?.[nodeId2] || { id: nodeId2, type: 'web-preview', webUrl: '' },
    error2 = updateWebPreviewTabUrlData(next, { tabId: tabId, url: url2, title: title });
  if (error2.ok === false) return { ok: false, error: error2.error || 'missing-tab' };
  const patch = { ...error2.patch, name: webPreviewText('nodeName') };
  return (
    storeInstance.updateNodeData(nodeId2, { ...patch }),
    recordVisitFn?.({ url: url2, title: title }),
    commitFn?.(),
    dispatchWebPreviewForceSync(nodeId2),
    { ok: true, url: url2, tabId: error2.tabId, patch: patch }
  );
}
export class WebPreviewNode {
  constructor(current) {
    ((this._data = current),
      (this.id = current.id),
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
    const el = document.createElement('div');
    ((el.className = 'node-card web-preview-card'),
      el.addEventListener('dblclick', (event) => event.stopPropagation()));
    const webPreviewToolbar = createWebPreviewToolbar({
        className: 'web-preview-header',
        url: this._getActiveUrl(),
        onSubmit: (entry) => this._commitUrl(entry),
        onBack: () => this._navigate('back'),
        onForward: () => this._navigate('forward'),
        onRefresh: () => this._refresh(),
        onExtractMedia: () => this._extractMedia(),
        onSaveReference: () => this._saveReferenceCard(),
        onExternal: () => this._openExternal(),
        onFullscreen: () => this._openFullscreen(),
      }),
      record = this._createTabBarView(),
      el2 = document.createElement('div');
    ((el2.className = 'web-preview-body'),
      (el2.dataset.webPreviewSlot = 'true'),
      (el2.dataset.nodeId = this.id),
      (el2.dataset.tabId = this._getActiveTabId()),
      (el2.dataset.webUrl = this._getActiveUrl()),
      el2.addEventListener('pointerdown', (event2) => {
        const payload = this._getTabState().activeTab;
        if (this._getActiveUrl() || payload?.pendingPopup === true) event2.stopPropagation();
      }));
    const webPreviewStartPageView = new WebPreviewStartPageView({
        statusText: getWebPreviewDefaultStatusText(),
        onOpenUrl: (handle, state) => this._commitUrl(handle, state),
      }),
      config = webPreviewStartPageView.mount();
    el2.appendChild(config);
    const el3 = document.createElement('div');
    el3.className = 'web-preview-freeze-layer';
    const scope = document.createElement('img');
    ((scope.className = 'web-preview-freeze-image'),
      (scope.alt = ''),
      el3.appendChild(scope),
      el2.appendChild(el3));
    const el4 = document.createElement('div');
    ((el4.className = 'web-preview-status'), (el4.textContent = getWebPreviewDefaultStatusText()));
    const input = document.createElement('div');
    input.className = 'node-port out-port';
    const el5 = document.createElement('div');
    return (
      (el5.className = 'group-resizer'),
      el5.addEventListener('pointerdown', (event3) => {
        (event3.stopPropagation(),
          startNodeResizePreview({
            event: event3,
            nodeId: this.id,
            getNode: () => appStore.getStateRaw().nodes?.[this.id] || this._data,
            getViewport: () => appStore.getStateRaw().viewport,
            resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) =>
              clampWebPreviewNodeSize({ width: startWidth + dx, height: startHeight + dy }),
            applyPatch: (output) => appStore.updateNodeData(this.id, output),
            commit: commit,
          }));
      }),
      el.appendChild(webPreviewToolbar.element),
      el.appendChild(record.element),
      el.appendChild(el2),
      el.appendChild(el4),
      el.appendChild(input),
      el.appendChild(el5),
      this.el.replaceChildren(el),
      (this._toolbar = webPreviewToolbar),
      (this._tabBar = record),
      (this._startPageView = webPreviewStartPageView),
      (this._input = webPreviewToolbar.input),
      (this._emptyInput = webPreviewStartPageView.input),
      (this._slot = el2),
      this._unregisterSlot?.(),
      (this._unregisterSlot = registerWebPreviewSlot(this.id, el2)),
      (this._placeholder = config),
      (this._status = el4),
      (this._freezeLayer = el3),
      (this._freezeImage = scope),
      (this._backButtons = [webPreviewToolbar.backButton]),
      (this._forwardButtons = [webPreviewToolbar.forwardButton]),
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
      onActivate: (value2) => this._activateTab(value2),
      onClose: (value3) => this._closeTab(value3),
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
  ['_applyTabPatch'](args, { commitHistory: commitHistory = false } = {}) {
    if (!args) return;
    ((this._data = { ...this._data, ...args }), appStore.updateNodeData(this.id, args));
    if (commitHistory) commit();
    (this._clearSnapshot(), this._syncDom(), dispatchWebPreviewForceSync(this.id));
  }
  ['_addTab']({ id: id = '', url: url = '', title: title = '', pendingPopup: pendingPopup = false } = {}) {
    const response = addWebPreviewTabData(this._data, {
      id: id,
      url: url,
      title: title,
      pendingPopup: pendingPopup,
    });
    if (response.ok === false)
      return (globalThis.window?.showToast?.(webPreviewText('toasts.maxTabs'), 'warning'), response);
    return (
      this._applyTabPatch(response.patch, { commitHistory: true }),
      this._setStatus(getWebPreviewDefaultStatusText()),
      response
    );
  }
  ['_activateTab'](value4) {
    const response2 = activateWebPreviewTabData(this._data, value4);
    if (response2.ok === false) return;
    (this._applyTabPatch(response2.patch), this._syncNavigationButtons());
  }
  ['_disposeNativeTab'](enabled) {
    if (!enabled) return;
    const promise = globalThis.window?.electronAPI?.webPreview?.disposeViews?.({
      nodeIds: [this.id],
      tabIds: [enabled],
    });
    promise && typeof promise.catch === 'function' && void promise.catch(() => {});
  }
  ['_closeTab'](value5) {
    const response3 = closeWebPreviewTabData(this._data, value5);
    if (response3.ok === false) return;
    (this._disposeNativeTab(response3.closedTabId),
      this._navigationStateByTabId.delete(response3.closedTabId),
      this._applyTabPatch(response3.patch, { commitHistory: true }),
      this._syncNavigationButtons());
    if (!response3.state.webUrl) this._setStatus(getWebPreviewDefaultStatusText());
  }
  ['_openPopupTab'](value6, { tabId: tabId = '', pendingPopup: pendingPopup = false } = {}) {
    const url3 = normalizeWebPreviewUrl(value6);
    if (!url3 && pendingPopup !== true) return;
    const response4 = this._addTab({
      id: tabId,
      url: url3,
      title: pendingPopup === true ? webPreviewText('tabs.loginWindow') : '',
      pendingPopup: pendingPopup === true && !url3,
    });
    if (response4?.ok === false) {
      if (tabId) this._disposeNativeTab(tabId);
      return;
    }
    if (response4?.ok) this._setStatus(webPreviewText('status.loading'));
  }
  ['_renderStartPageTiles']() {
    this._startPageView?.renderTiles();
  }
  ['_bindNativeEvents']() {
    const el6 = globalThis.window;
    if (!el6 || typeof el6.addEventListener !== 'function') return;
    const value7 = (value8) => {
      const tabId2 = value8?.detail || {};
      if (tabId2.nodeId !== this.id) return;
      const value9 = tabId2.tabId || this._getActiveTabId(),
        value10 = value9 === this._getActiveTabId();
      if (tabId2.type === 'loading')
        value10 &&
          (tabId2.holdSnapshot === true
            ? this.el.classList.add('is-web-preview-loading')
            : this._clearSnapshot(),
          this._setStatus(webPreviewText('status.loading')));
      else {
        if (tabId2.type === 'loaded')
          value10 &&
            (this.el.classList.remove('is-web-preview-loading'),
            this._setStatus(webPreviewText('status.loaded')));
        else {
          if (tabId2.type === 'failed')
            value10 &&
              (this.el.classList.remove('is-web-preview-loading'),
              this._setStatus(tabId2.message || webPreviewText('status.loadFailed')));
          else {
            if (tabId2.type === 'blocked')
              value10 &&
                (this.el.classList.remove('is-web-preview-loading'),
                this._setStatus(tabId2.message || webPreviewText('status.blocked')));
            else {
              if (tabId2.type === 'open-popup')
                this._openPopupTab(tabId2.url, {
                  tabId: tabId2.popupTabId,
                  pendingPopup: tabId2.pendingPopup === true,
                });
              else {
                if (tabId2.type === 'closed') {
                  if (value9) this._closeTab(value9);
                } else {
                  if (tabId2.type === 'send-selected-text') {
                    const webPreviewTextNodeFromSelection = createWebPreviewTextNodeFromSelection({
                      nodeId: this.id,
                      payload: tabId2,
                    });
                    if (webPreviewTextNodeFromSelection)
                      globalThis.window?.showToast?.(webPreviewText('toasts.textSent'), 'success');
                  } else {
                    if (tabId2.type === WEB_PREVIEW_TEXT_SOURCE_EVENT) {
                      const webPreviewSourceTextNodeFromSelection =
                        createWebPreviewSourceTextNodeFromSelection({
                          nodeId: this.id,
                          payload: tabId2,
                        });
                      if (webPreviewSourceTextNodeFromSelection)
                        globalThis.window?.showToast?.(webPreviewText('toasts.sourceTextSent'), 'success');
                    } else {
                      if (
                        tabId2.type === WEB_PREVIEW_TEXT_IMAGE_PROMPT_EVENT ||
                        tabId2.type === WEB_PREVIEW_TEXT_IMAGE_PROMPT_GENERATE_EVENT
                      ) {
                        const webPreviewImagePromptNodeFromSelection =
                          createWebPreviewImagePromptNodeFromSelection({
                            nodeId: this.id,
                            payload: tabId2,
                          });
                        if (
                          webPreviewImagePromptNodeFromSelection &&
                          tabId2.type === WEB_PREVIEW_TEXT_IMAGE_PROMPT_GENERATE_EVENT
                        )
                          void this._runImagePromptGeneration(webPreviewImagePromptNodeFromSelection);
                        else
                          webPreviewImagePromptNodeFromSelection &&
                            globalThis.window?.showToast?.(
                              webPreviewText('toasts.imagePromptCreated'),
                              'success',
                            );
                      } else {
                        if (
                          tabId2.type === WEB_PREVIEW_TEXT_VIDEO_PROMPT_EVENT ||
                          tabId2.type === WEB_PREVIEW_TEXT_VIDEO_PROMPT_GENERATE_EVENT
                        ) {
                          const webPreviewVideoPromptNodeFromSelection =
                            createWebPreviewVideoPromptNodeFromSelection({
                              nodeId: this.id,
                              payload: tabId2,
                            });
                          if (
                            webPreviewVideoPromptNodeFromSelection &&
                            tabId2.type === WEB_PREVIEW_TEXT_VIDEO_PROMPT_GENERATE_EVENT
                          )
                            void this._runVideoPromptGeneration(webPreviewVideoPromptNodeFromSelection);
                          else
                            webPreviewVideoPromptNodeFromSelection &&
                              globalThis.window?.showToast?.(
                                webPreviewText('toasts.videoPromptCreated'),
                                'success',
                              );
                        } else {
                          if (tabId2.type === 'send-image-to-canvas') {
                            const webPreviewImageNodeFromContext = createWebPreviewImageNodeFromContext({
                              nodeId: this.id,
                              payload: tabId2,
                            });
                            if (webPreviewImageNodeFromContext)
                              globalThis.window?.showToast?.(webPreviewText('toasts.imageAdded'), 'success');
                          } else {
                            if (
                              tabId2.type === 'reverse-image-prompt' ||
                              tabId2.type === WEB_PREVIEW_REVERSE_PROMPT_GENERATE_EVENT
                            ) {
                              const webPreviewReverseImagePromptNodes =
                                createWebPreviewReverseImagePromptNodes({
                                  nodeId: this.id,
                                  payload: tabId2,
                                });
                              if (
                                webPreviewReverseImagePromptNodes &&
                                tabId2.type === WEB_PREVIEW_REVERSE_PROMPT_GENERATE_EVENT
                              )
                                void this._runReverseImagePromptGeneration(webPreviewReverseImagePromptNodes);
                              else
                                webPreviewReverseImagePromptNodes &&
                                  globalThis.window?.showToast?.(
                                    webPreviewText('toasts.reversePromptCreated'),
                                    'success',
                                  );
                            } else {
                              if (tabId2.type === 'favicon') this._applyFavicon(tabId2.faviconUrl, value9);
                              else {
                                if (tabId2.type === 'navigated') this._applyNavigatedUrl(tabId2.url, value9);
                                else {
                                  if (tabId2.type === 'navigation-state') this._setNavigationState(tabId2);
                                  else {
                                    if (tabId2.type === 'snapshot' && value10) this._applySnapshot(tabId2);
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
    (el6.addEventListener('web-preview:native-event', value7),
      (this._unsubscribeNativeEvent = () => {
        el6.removeEventListener?.('web-preview:native-event', value7);
      }));
  }
  async ['_runCreatedNodeGeneration'](
    value11,
    { startedKey: startedKey, failedKey: failedKey, nodeNotReadyKey: nodeNotReadyKey } = {},
  ) {
    const nodeId3 = String(value11 || '').trim(),
      value12 = globalThis.window?.showToast,
      handler2 = (value13) => {
        value12?.(
          webPreviewText(failedKey || 'toasts.reversePromptGenerateFailed', {
            error: String(value13 || webPreviewText('toasts.reversePromptGenerateUnavailable')),
          }),
          'warning',
        );
      };
    if (!nodeId3) {
      handler2(webPreviewText('toasts.reversePromptGenerateUnavailable'));
      return;
    }
    const waitForMountedCanvasNodeInstance2 = await waitForMountedCanvasNodeInstance(nodeId3);
    if (!waitForMountedCanvasNodeInstance2) {
      handler2(webPreviewText(nodeNotReadyKey || 'toasts.reversePromptGenerateNodeNotReady'));
      return;
    }
    const value14 = globalThis.window?.canvasCommands;
    if (typeof value14?.executeCanvasCommand !== 'function') {
      handler2(webPreviewText('toasts.reversePromptGenerateUnavailable'));
      return;
    }
    value12?.(webPreviewText(startedKey || 'toasts.reversePromptGenerateStarted'), 'success');
    try {
      const response5 = await value14.executeCanvasCommand('generation.run', { nodeId: nodeId3 });
      response5?.ok === false && handler2(getCanvasCommandFailureText(response5));
    } catch (error3) {
      handler2(error3?.message || error3);
    }
  }
  async ['_runReverseImagePromptGeneration'](value15) {
    await this._runCreatedNodeGeneration(value15?.textNode?.id, {
      startedKey: 'toasts.reversePromptGenerateStarted',
      failedKey: 'toasts.reversePromptGenerateFailed',
      nodeNotReadyKey: 'toasts.reversePromptGenerateNodeNotReady',
    });
  }
  async ['_runImagePromptGeneration'](value16) {
    await this._runCreatedNodeGeneration(value16?.id, {
      startedKey: 'toasts.imagePromptGenerateStarted',
      failedKey: 'toasts.imagePromptGenerateFailed',
      nodeNotReadyKey: 'toasts.imagePromptGenerateNodeNotReady',
    });
  }
  async ['_runVideoPromptGeneration'](value17) {
    await this._runCreatedNodeGeneration(value17?.id, {
      startedKey: 'toasts.videoPromptGenerateStarted',
      failedKey: 'toasts.videoPromptGenerateFailed',
      nodeNotReadyKey: 'toasts.videoPromptGenerateNodeNotReady',
    });
  }
  ['_readUrlInputValue']() {
    const value18 = globalThis.document?.activeElement || null;
    if (value18 === this._fullscreenInput) return this._fullscreenInput?.value || '';
    if (value18 === this._input) return this._input?.value || '';
    if (value18 === this._emptyInput) return this._emptyInput?.value || '';
    return (
      this._fullscreenInput?.value ||
      this._input?.value ||
      this._emptyInput?.value ||
      this._getActiveUrl() ||
      ''
    );
  }
  ['_commitUrl'](rawUrl2 = this._readUrlInputValue(), { title: title = '' } = {}) {
    const webPreviewAddressInput = normalizeWebPreviewAddressInput(rawUrl2),
      tabId3 = this._getActiveTabId(),
      recordVisitFn2 = !!globalThis.window?.electronAPI?.webPreview;
    webPreviewAddressInput &&
      title &&
      this._pendingVisitTitles.set(getPendingVisitKey(tabId3, webPreviewAddressInput), title);
    const response6 = commitWebPreviewNodeUrl({
      nodeId: this.id,
      rawUrl: rawUrl2,
      title: title,
      tabId: tabId3,
      nodeData: this._data,
      recordVisitFn: recordVisitFn2 ? null : recordWebPreviewVisit,
    });
    response6.ok &&
      ((this._data = { ...this._data, ...response6.patch }),
      this._syncDom(),
      this._renderStartPageTiles(),
      this._setStatus(webPreviewText('status.loading')));
  }
  ['_refresh']() {
    const value19 = globalThis.window?.electronAPI?.webPreview,
      tabId4 = this._getActiveTabId();
    if (!this._getActiveUrl()) return;
    if (value19?.controlView)
      void value19.controlView({ nodeId: this.id, tabId: tabId4, action: 'reload' }).catch(() => {});
    else
      value19?.disposeViews &&
        void value19.disposeViews({ nodeIds: [this.id] }).finally(() => {
          dispatchWebPreviewForceSync(this.id);
        });
    this._setStatus(webPreviewText('status.refreshing'));
  }
  ['_navigate'](action) {
    const enabled2 = globalThis.window?.electronAPI?.webPreview,
      tabId5 = this._getActiveTabId();
    if (!this._getActiveUrl() || !enabled2?.controlView) return;
    void enabled2
      .controlView({ nodeId: this.id, tabId: tabId5, action: action })
      .then((response7) => {
        response7?.ok === false &&
          response7.error === 'no-history' &&
          this._setNavigationState({ ...response7, tabId: tabId5 });
      })
      .catch(() => {});
  }
  ['_extractMedia']() {
    const enabled3 = globalThis.window?.electronAPI?.webPreview,
      tabId6 = this._getActiveTabId();
    if (!this._getActiveUrl() || !enabled3?.controlView) {
      globalThis.window?.showToast?.(webPreviewText('toasts.openPageFirst'), 'warning');
      return;
    }
    void enabled3
      .controlView({ nodeId: this.id, tabId: tabId6, action: 'extract-media' })
      .then((response8) => {
        if (response8?.ok === false) {
          globalThis.window?.showToast?.(webPreviewText('toasts.extractMediaFailed'), 'error');
          return;
        }
        const imageCandidates = Array.isArray(response8?.images) ? response8.images : [],
          videoCandidates = Array.isArray(response8?.videos) ? response8.videos : [];
        openWebPreviewMediaPicker({
          nodeId: this.id,
          imageCandidates: imageCandidates,
          videoCandidates: videoCandidates,
        });
      })
      .catch(() => {
        globalThis.window?.showToast?.(webPreviewText('toasts.extractMediaFailed'), 'error');
      });
  }
  ['_saveReferenceCard']() {
    const enabled4 = globalThis.window?.electronAPI?.webPreview,
      tabId7 = this._getActiveTabId();
    if (!this._getActiveUrl() || !enabled4?.controlView) {
      globalThis.window?.showToast?.(webPreviewText('toasts.openPageFirst'), 'warning');
      return;
    }
    void enabled4
      .controlView({ nodeId: this.id, tabId: tabId7, action: 'capture-reference' })
      .then((payload2) => {
        if (payload2?.ok === false) {
          globalThis.window?.showToast?.(webPreviewText('toasts.saveReferenceFailed'), 'error');
          return;
        }
        const webReferenceCardNode = createWebReferenceCardNode({ nodeId: this.id, payload: payload2 });
        webReferenceCardNode &&
          globalThis.window?.showToast?.(webPreviewText('toasts.referenceAdded'), 'success');
      })
      .catch(() => {
        globalThis.window?.showToast?.(webPreviewText('toasts.saveReferenceFailed'), 'error');
      });
  }
  ['_openExternal']() {
    const webPreviewAddressInput2 = normalizeWebPreviewAddressInput(this._readUrlInputValue());
    if (!webPreviewAddressInput2) {
      globalThis.window?.showToast?.(webPreviewText('toasts.addressRequired'), 'warning');
      return;
    }
    void openExternalLink(webPreviewAddressInput2, { label: webPreviewText('nodeName') }).catch((error4) => {
      globalThis.window?.showToast?.(error4?.message || webPreviewText('toasts.openExternalFailed'), 'error');
    });
  }
  ['_openFullscreen']() {
    const url4 = normalizeWebPreviewAddressInput(this._readUrlInputValue());
    if (!url4) {
      globalThis.window?.showToast?.(webPreviewText('toasts.addressRequired'), 'warning');
      return;
    }
    url4 !== normalizeWebPreviewUrl(this._getActiveUrl()) && this._commitUrl(url4);
    if (this._fullscreenOverlay?.isConnected) {
      dispatchWebPreviewForceSync(this.id);
      return;
    }
    const el7 = document.createElement('div');
    ((el7.className = 'web-preview-fullscreen-overlay'),
      el7.addEventListener('pointerdown', (event4) => event4.stopPropagation()));
    const webPreviewToolbar2 = createWebPreviewToolbar({
        className: 'web-preview-fullscreen-header',
        url: url4,
        onSubmit: (value20) => this._commitUrl(value20),
        onBack: () => this._navigate('back'),
        onForward: () => this._navigate('forward'),
        onRefresh: () => this._refresh(),
        onExtractMedia: () => this._extractMedia(),
        onSaveReference: () => this._saveReferenceCard(),
        onExternal: () => this._openExternal(),
        onExit: () => this._closeFullscreen(),
      }),
      value21 = this._createTabBarView(),
      el8 = document.createElement('div');
    ((el8.className = 'web-preview-fullscreen-body'),
      (el8.dataset.webPreviewSlot = 'true'),
      (el8.dataset.webPreviewFullscreen = 'true'),
      (el8.dataset.nodeId = this.id),
      (el8.dataset.tabId = this._getActiveTabId()),
      (el8.dataset.webUrl = this._getActiveUrl() || url4),
      el7.appendChild(webPreviewToolbar2.element),
      el7.appendChild(value21.element),
      el7.appendChild(el8),
      document.body.appendChild(el7),
      (this._fullscreenOverlay = el7),
      (this._fullscreenToolbar = webPreviewToolbar2),
      (this._fullscreenInput = webPreviewToolbar2.input),
      (this._fullscreenTabBar = value21),
      (this._fullscreenSlot = el8),
      this._unregisterFullscreenSlot?.(),
      (this._unregisterFullscreenSlot = registerWebPreviewSlot(this.id, el8)),
      (this._backButtons = [this._backButtons[0], webPreviewToolbar2.backButton].filter(Boolean)),
      (this._forwardButtons = [this._forwardButtons[0], webPreviewToolbar2.forwardButton].filter(Boolean)),
      (this._fullscreenKeyHandler = (event5) => {
        if (event5.key === 'Escape') this._closeFullscreen();
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
  ['_applyNavigatedUrl'](value22, tabId8 = this._getActiveTabId()) {
    const url5 = normalizeWebPreviewUrl(value22);
    if (!url5) return;
    const pendingVisitKey = getPendingVisitKey(tabId8, url5),
      title2 = this._pendingVisitTitles.get(pendingVisitKey) || '';
    (this._pendingVisitTitles.delete(pendingVisitKey),
      recordWebPreviewVisit({ url: url5, title: title2 }),
      this._renderStartPageTiles());
    const response9 = updateWebPreviewTabUrlData(this._data, {
      tabId: tabId8,
      url: url5,
      title: title2,
      activate: tabId8 === this._getActiveTabId(),
    });
    if (response9.ok === false) return;
    ((this._data = { ...this._data, ...response9.patch }),
      appStore.updateNodeData(this.id, response9.patch),
      this._syncDom());
  }
  ['_applyFavicon'](faviconUrl, tabId9 = this._getActiveTabId()) {
    const response10 = updateWebPreviewTabFaviconData(this._data, { tabId: tabId9, faviconUrl: faviconUrl });
    if (response10.ok === false) return;
    ((this._data = { ...this._data, ...response10.patch }),
      appStore.updateNodeData(this.id, response10.patch),
      this._syncDom());
  }
  ['_setNavigationState'](options2 = {}) {
    const value23 = options2.tabId || this._getActiveTabId(),
      value24 = { canGoBack: Boolean(options2.canGoBack), canGoForward: Boolean(options2.canGoForward) };
    this._navigationStateByTabId.set(value23, value24);
    if (value23 === this._getActiveTabId()) this._navigationState = value24;
    this._syncNavigationButtons();
  }
  ['_syncNavigationButtons']() {
    this._navigationState = this._navigationStateByTabId.get(this._getActiveTabId()) || {
      canGoBack: false,
      canGoForward: false,
    };
    for (const el9 of this._backButtons) {
      if (el9) el9.disabled = !this._navigationState.canGoBack;
    }
    for (const el10 of this._forwardButtons) {
      if (el10) el10.disabled = !this._navigationState.canGoForward;
    }
  }
  ['_setStatus'](value25) {
    this._statusText = String(value25 || getWebPreviewDefaultStatusText());
    if (this._status) this._status.textContent = this._statusText;
    this._startPageView?.setStatus(this._statusText);
  }
  ['_applySnapshot'](options3 = {}) {
    const enabled5 = String(options3.dataUrl || '');
    if (!enabled5.startsWith('data:image/') || !this._freezeImage) return;
    const value26 = String(options3.freezeToken || 'ready'),
      value27 = this._freezeSnapshotSerial + 1;
    this._freezeSnapshotSerial = value27;
    let value28 = false;
    const run = () => {
        if (value28) return;
        if (this._freezeSnapshotSerial !== value27 || !this._freezeImage) return;
        ((value28 = true),
          (this._freezeImage.src = enabled5),
          (this.el.dataset.webPreviewSnapshotToken = value26),
          this.el.classList.add('has-freeze-snapshot'),
          dispatchWebPreviewForceSync(this.id));
      },
      enabled6 =
        typeof globalThis.Image === 'function'
          ? new globalThis['Image']()
          : globalThis.document?.createElement?.('img');
    if (!enabled6) {
      run();
      return;
    }
    ((enabled6.onload = run),
      (enabled6.onerror = () => {
        this._freezeSnapshotSerial === value27 &&
          (this.el.classList.remove('has-freeze-snapshot'), delete this.el.dataset.webPreviewSnapshotToken);
      }),
      (enabled6.src = enabled5));
    if (typeof enabled6.decode === 'function')
      void enabled6
        .decode()
        .then(run)
        .catch(() => {
          if (enabled6.complete) run();
        });
    else enabled6.complete && run();
  }
  ['_clearSnapshot']() {
    this._freezeSnapshotSerial += 1;
    if (this._freezeImage) this._freezeImage.removeAttribute('src');
    (delete this.el.dataset.webPreviewSnapshotToken,
      this.el.classList.remove('has-freeze-snapshot', 'is-web-preview-loading'));
  }
  ['_syncDom']() {
    const activeTabId = this._getTabState(),
      webUrl2 = activeTabId.webUrl || '';
    ((this._data = { ...this._data, activeTabId: activeTabId.activeTabId, webUrl: webUrl2 }),
      this._tabBar?.setTabs(this._data),
      this._fullscreenTabBar?.setTabs(this._data));
    this._input && document.activeElement !== this._input && (this._input.value = webUrl2);
    this._startPageView?.setUrl(webUrl2);
    this._fullscreenInput &&
      document.activeElement !== this._fullscreenInput &&
      (this._fullscreenInput.value = webUrl2);
    this._slot?.dataset &&
      ((this._slot.dataset.webUrl = webUrl2),
      (this._slot.dataset.nodeId = this.id),
      (this._slot.dataset.tabId = activeTabId.activeTabId));
    this._fullscreenSlot?.dataset &&
      ((this._fullscreenSlot.dataset.webUrl = webUrl2),
      (this._fullscreenSlot.dataset.nodeId = this.id),
      (this._fullscreenSlot.dataset.tabId = activeTabId.activeTabId));
    const enabled7 = Boolean(webUrl2 || activeTabId.activeTab?.pendingPopup === true);
    this.el.classList.toggle('has-web-url', enabled7);
    if (!enabled7) (this._renderStartPageTiles(), this._setStatus(getWebPreviewDefaultStatusText()));
    else
      webUrl2 &&
        !globalThis.window?.electronAPI?.webPreview &&
        this._setStatus(webPreviewText('status.nativeUnsupported'));
  }
  ['update'](value29) {
    ((this._data = value29), this._syncDom());
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
    const value30 = globalThis.window?.electronAPI?.webPreview;
    value30?.disposeViews && void value30.disposeViews({ nodeIds: [this.id] });
  }
}

import appStore from '../core/stores/appStore.js';
import { commit } from '../modules/history.js';
import { startNodeResizePreview } from '../modules/interaction/nodeResizePreview.js';
import { openExternalLink } from '../services/externalLinkService.js';
import { registerWebPreviewSlot } from '../services/webPreviewViewSyncService.js';
import { desktopBridge } from '../services/desktopBridge.js';
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
import { createWebPreviewRemoteInputQueue } from '../services/webPreviewRemoteInputQueue.js';
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
  globalThis['window']?.['dispatchEvent']?.(
    new CustomEvent('web-preview:force-sync', { detail: { nodeId: nodeId } }),
  );
}
function waitForNextFrame() {
  return new Promise((handler) => {
    const key = globalThis['window'];
    if (typeof key?.['requestAnimationFrame'] === 'function') {
      key['requestAnimationFrame'](() => handler());
      return;
    }
    if (typeof globalThis['requestAnimationFrame'] === 'function') {
      globalThis['requestAnimationFrame'](() => handler());
      return;
    }
    if (typeof globalThis['setTimeout'] === 'function') {
      globalThis['setTimeout'](handler, WEB_PREVIEW_REVERSE_PROMPT_MOUNT_DELAY_MS);
      return;
    }
    handler();
  });
}
function isCanvasNodeMounted(index) {
  const result = String(index || '')['trim']();
  return result ? globalThis['window']?.['v2Renderer']?.['isNodeMounted']?.(result) === true : false;
}
async function waitForMountedCanvasNode(data) {
  for (let options = 0; options < WEB_PREVIEW_REVERSE_PROMPT_MOUNT_ATTEMPTS; options += 1) {
    if (isCanvasNodeMounted(data)) return true;
    await waitForNextFrame();
  }
  return false;
}
function getCanvasCommandFailureText(error) {
  return String(
    error?.['message'] ||
      error?.['errorCode'] ||
      error?.['error'] ||
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
  showToast: showToast = globalThis['window']?.['showToast'],
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
  if (!nodeId2 || typeof storeInstance?.['updateNodeData'] !== 'function')
    return { ok: false, error: 'missing-node' };
  const next = nodeData ||
      storeInstance['getStateRaw']?.()?.['nodes']?.[nodeId2] ||
      storeInstance['getState']?.()?.['nodes']?.[nodeId2] || {
        id: nodeId2,
        type: 'web-preview',
        webUrl: '',
      },
    error2 = updateWebPreviewTabUrlData(next, { tabId: tabId, url: url2, title: title });
  if (error2['ok'] === false) return { ok: false, error: error2['error'] || 'missing-tab' };
  const patch = { ...error2['patch'], name: webPreviewText('nodeName') };
  return (
    storeInstance['updateNodeData'](nodeId2, { ...patch }),
    recordVisitFn?.({ url: url2, title: title }),
    commitFn?.(),
    dispatchWebPreviewForceSync(nodeId2),
    { ok: true, url: url2, tabId: error2['tabId'], patch: patch }
  );
}
export class WebPreviewNode {
  constructor(current) {
    ((this['_data'] = current),
      (this['id'] = current['id']),
      (this['el'] = document['createElement']('div')),
      (this['el']['className'] = 'v2-node-component web-preview-component'),
      (this['_statusText'] = getWebPreviewDefaultStatusText()),
      (this['_unsubscribeNativeEvent'] = null),
      (this['_unsubscribeLocale'] = null),
      (this['_navigationState'] = { canGoBack: false, canGoForward: false }),
      (this['_navigationStateByTabId'] = new Map()),
      (this['_backButtons'] = []),
      (this['_forwardButtons'] = []),
      (this['_fullscreenOverlay'] = null),
      (this['_fullscreenInput'] = null),
      (this['_fullscreenTabBar'] = null),
      (this['_fullscreenSlot'] = null),
      (this['_freezeLayer'] = null),
      (this['_freezeImage'] = null),
      (this['_freezeSnapshotSerial'] = 0),
      (this['_fullscreenKeyHandler'] = null),
      (this['_unregisterSlot'] = null),
      (this['_unregisterFullscreenSlot'] = null),
      (this['_toolbar'] = null),
      (this['_fullscreenToolbar'] = null),
      (this['_tabBar'] = null),
      (this['_startPageView'] = null),
      (this['_pendingVisitTitles'] = new Map()),
      (this['_remoteWheelTimer'] = null),
      (this['_remoteWheelInput'] = null),
      (this['_remoteInputQueue'] = createWebPreviewRemoteInputQueue({
        send: (input) => {
          if (!this['_isRemoteBrowserSurface']()) return Promise['resolve']();
          if (!desktopBridge['webPreview']['isAvailable']()) return Promise['resolve']();
          return Promise['resolve'](
            desktopBridge['webPreview']['controlView']({
              nodeId: this['id'],
              tabId: this['_getActiveTabId'](),
              action: 'dispatch-input',
              input: input,
            }),
          );
        },
      })));
  }
  ['mount']() {
    const el = document['createElement']('div');
    ((el['className'] = 'node-card web-preview-card'),
      el['addEventListener']('dblclick', (event) => event['stopPropagation']()));
    const webPreviewToolbar = createWebPreviewToolbar({
        className: 'web-preview-header',
        url: this['_getActiveUrl'](),
        onSubmit: (entry) => this['_commitUrl'](entry),
        onBack: () => this['_navigate']('back'),
        onForward: () => this['_navigate']('forward'),
        onRefresh: () => this['_refresh'](),
        onExtractMedia: () => this['_extractMedia'](),
        onSaveReference: () => this['_saveReferenceCard'](),
        onExternal: () => this['_openExternal'](),
        onFullscreen: () => this['_openFullscreen'](),
      }),
      record = this['_createTabBarView'](),
      el2 = document['createElement']('div');
    ((el2['className'] = 'web-preview-body'),
      (el2['dataset']['webPreviewSlot'] = 'true'),
      (el2['dataset']['nodeId'] = this['id']),
      (el2['dataset']['tabId'] = this['_getActiveTabId']()),
      (el2['dataset']['webUrl'] = this['_getActiveUrl']()),
      el2['addEventListener']('pointerdown', (event2) => {
        const payload = this['_getTabState']()['activeTab'];
        (this['_getActiveUrl']() || payload?.['pendingPopup'] === true) &&
          (this['_requestLiveWebView'](), event2['stopPropagation']());
      }));
    const webPreviewStartPageView = new WebPreviewStartPageView({
        statusText: getWebPreviewDefaultStatusText(),
        onOpenUrl: (handle, state) => this['_commitUrl'](handle, state),
      }),
      config = webPreviewStartPageView['mount']();
    el2['appendChild'](config);
    const el3 = document['createElement']('div');
    el3['className'] = 'web-preview-freeze-layer';
    const scope = document['createElement']('img');
    ((scope['className'] = 'web-preview-freeze-image'),
      (scope['alt'] = ''),
      el3['appendChild'](scope),
      (el3['tabIndex'] = 0),
      el3['addEventListener']('pointerdown', (output) => {
        this['_handleRemotePointerInput']('mousePressed', output);
      }),
      el3['addEventListener']('pointerup', (value2) => {
        this['_handleRemotePointerInput']('mouseReleased', value2);
      }),
      el3['addEventListener']('pointermove', (value3) => {
        this['_handleRemotePointerMoveInput'](value3);
      }),
      el3['addEventListener']('pointercancel', (value4) => {
        this['_handleRemotePointerInput']('mouseReleased', value4);
      }),
      el3['addEventListener'](
        'wheel',
        (value5) => {
          this['_handleRemoteWheelInput'](value5);
        },
        { passive: false },
      ),
      el3['addEventListener']('keydown', (value6) => {
        this['_handleRemoteKeyInput']('keyDown', value6);
      }),
      el3['addEventListener']('keyup', (value7) => {
        this['_handleRemoteKeyInput']('keyUp', value7);
      }),
      el3['addEventListener']('contextmenu', (event3) => {
        if (!this['_isRemoteBrowserSurface']()) return;
        (event3['preventDefault'](), event3['stopPropagation']());
      }),
      el2['appendChild'](el3));
    const el4 = document['createElement']('div');
    ((el4['className'] = 'web-preview-status'),
      (el4['textContent'] = getWebPreviewDefaultStatusText()));
    const value8 = document['createElement']('div');
    value8['className'] = 'node-port out-port';
    const el5 = document['createElement']('div');
    return (
      (el5['className'] = 'group-resizer'),
      el5['addEventListener']('pointerdown', (event4) => {
        (event4['stopPropagation'](),
          startNodeResizePreview({
            event: event4,
            nodeId: this['id'],
            getNode: () => appStore['getStateRaw']()['nodes']?.[this['id']] || this['_data'],
            getViewport: () => appStore['getStateRaw']()['viewport'],
            resolveSize: ({ startWidth: startWidth, startHeight: startHeight, dx: dx, dy: dy }) =>
              clampWebPreviewNodeSize({ width: startWidth + dx, height: startHeight + dy }),
            applyPatch: (value9) => appStore['updateNodeData'](this['id'], value9),
            commit: commit,
          }));
      }),
      el['appendChild'](webPreviewToolbar['element']),
      el['appendChild'](record['element']),
      el['appendChild'](el2),
      el['appendChild'](el4),
      el['appendChild'](value8),
      el['appendChild'](el5),
      this['el']['replaceChildren'](el),
      (this['_toolbar'] = webPreviewToolbar),
      (this['_tabBar'] = record),
      (this['_startPageView'] = webPreviewStartPageView),
      (this['_input'] = webPreviewToolbar['input']),
      (this['_emptyInput'] = webPreviewStartPageView['input']),
      (this['_slot'] = el2),
      this['_unregisterSlot']?.(),
      (this['_unregisterSlot'] = registerWebPreviewSlot(this['id'], el2)),
      (this['_placeholder'] = config),
      (this['_status'] = el4),
      (this['_freezeLayer'] = el3),
      (this['_freezeImage'] = scope),
      (this['_backButtons'] = [webPreviewToolbar['backButton']]),
      (this['_forwardButtons'] = [webPreviewToolbar['forwardButton']]),
      this['_syncDom'](),
      this['_renderStartPageTiles'](),
      this['_syncNavigationButtons'](),
      this['_bindNativeEvents'](),
      this['_bindLocaleChange'](),
      this['el']
    );
  }
  ['_createTabBarView']() {
    return new WebPreviewTabBarView({
      onActivate: (value10) => this['_activateTab'](value10),
      onClose: (value11) => this['_closeTab'](value11),
      onAdd: () => this['_addTab'](),
    });
  }
  ['_bindLocaleChange']() {
    if (this['_unsubscribeLocale']) return;
    this['_unsubscribeLocale'] = onLocaleChange(() => this['_syncLocaleTexts']());
  }
  ['_syncLocaleTexts']() {
    (this['_toolbar']?.['syncLocale']?.(),
      this['_fullscreenToolbar']?.['syncLocale']?.(),
      this['_startPageView']?.['syncLocale']?.(),
      this['_tabBar']?.['setTabs'](this['_data']),
      this['_fullscreenTabBar']?.['setTabs'](this['_data']),
      !this['_getActiveUrl']() && this['_setStatus'](getWebPreviewDefaultStatusText()));
  }
  ['_requestLiveWebView']() {
    try {
      const list =
        appStore['getStateRaw']?.()['selectedNodeIds'] || appStore['getState']?.()['selectedNodeIds'] || [];
      !list['includes'](this['id']) && appStore['setSelectedNodes']([this['id']]);
    } catch {}
    dispatchWebPreviewForceSync(this['id']);
  }
  ['_isRemoteBrowserSurface']() {
    return (
      this['el']['classList']['contains']('is-remote-browser-surface') &&
      desktopBridge['webPreview']['surfaceMode'] === 'remote-snapshot'
    );
  }
  ['_dispatchRemoteInput'](options2 = {}) {
    if (!this['_isRemoteBrowserSurface']()) return;
    this['_remoteInputQueue']?.['enqueue']?.(options2);
  }
  ['_getRemotePointerPosition'](event5) {
    const box = this['_freezeLayer']?.['getBoundingClientRect']?.();
    if (!box?.['width'] || !box?.['height']) return null;
    return {
      xRatio: Math['max'](
        0,
        Math['min'](1, (Number(event5?.['clientX']) - box['left']) / box['width']),
      ),
      yRatio: Math['max'](
        0,
        Math['min'](1, (Number(event5?.['clientY']) - box['top']) / box['height']),
      ),
    };
  }
  ['_handleRemotePointerInput'](type2, altKey) {
    if (!this['_isRemoteBrowserSurface']()) return;
    const args = this['_getRemotePointerPosition'](altKey);
    if (!args) return;
    (altKey['preventDefault'](), altKey['stopPropagation'](), this['_requestLiveWebView']());
    if (type2 === 'mousePressed')
      try {
        (this['_freezeLayer']?.['focus']?.({ preventScroll: true }),
          this['_freezeLayer']?.['setPointerCapture']?.(altKey['pointerId']));
      } catch {}
    else
      try {
        this['_freezeLayer']?.['releasePointerCapture']?.(altKey['pointerId']);
      } catch {}
    this['_dispatchRemoteInput']({
      kind: 'mouse',
      type: type2,
      ...args,
      button: Number(altKey['button']),
      buttons: Number(altKey['buttons']),
      clickCount: Math['max'](1, Number(altKey['detail']) || 1),
      altKey: altKey['altKey'] === true,
      ctrlKey: altKey['ctrlKey'] === true,
      metaKey: altKey['metaKey'] === true,
      shiftKey: altKey['shiftKey'] === true,
    });
  }
  ['_handleRemotePointerMoveInput'](altKey2) {
    if (!this['_isRemoteBrowserSurface']()) return;
    const args2 = this['_getRemotePointerPosition'](altKey2);
    if (!args2) return;
    (altKey2['preventDefault'](), altKey2['stopPropagation']());
    const buttons = Math['max'](0, Number(altKey2['buttons']) || 0),
      button =
        (buttons & 1) !== 0
          ? 'left'
          : (buttons & 4) !== 0
            ? 'middle'
            : (buttons & 2) !== 0
              ? 'right'
              : 'none';
    this['_dispatchRemoteInput']({
      kind: 'mouse',
      type: 'mouseMoved',
      ...args2,
      button: button,
      buttons: buttons,
      clickCount: 0,
      altKey: altKey2['altKey'] === true,
      ctrlKey: altKey2['ctrlKey'] === true,
      metaKey: altKey2['metaKey'] === true,
      shiftKey: altKey2['shiftKey'] === true,
    });
  }
  ['_handleRemoteWheelInput'](altKey3) {
    if (!this['_isRemoteBrowserSurface']()) return;
    const args3 = this['_getRemotePointerPosition'](altKey3);
    if (!args3) return;
    (altKey3['preventDefault'](), altKey3['stopPropagation']());
    const event6 = this['_remoteWheelInput'];
    this['_remoteWheelInput'] = {
      kind: 'mouse',
      type: 'mouseWheel',
      ...args3,
      button: 'none',
      buttons: 0,
      clickCount: 0,
      deltaX: (Number(event6?.['deltaX']) || 0) + (Number(altKey3['deltaX']) || 0),
      deltaY: (Number(event6?.['deltaY']) || 0) + (Number(altKey3['deltaY']) || 0),
      altKey: altKey3['altKey'] === true,
      ctrlKey: altKey3['ctrlKey'] === true,
      metaKey: altKey3['metaKey'] === true,
      shiftKey: altKey3['shiftKey'] === true,
    };
    if (this['_remoteWheelTimer'] !== null) return;
    this['_remoteWheelTimer'] = globalThis['setTimeout'](() => {
      this['_remoteWheelTimer'] = null;
      const value12 = this['_remoteWheelInput'];
      this['_remoteWheelInput'] = null;
      if (value12) this['_dispatchRemoteInput'](value12);
    }, 16);
  }
  ['_handleRemoteKeyInput'](type3, repeat) {
    if (!this['_isRemoteBrowserSurface']()) return;
    (repeat['preventDefault'](), repeat['stopPropagation']());
    const text =
      type3 === 'keyDown' &&
      String(repeat['key'] || '')['length'] === 1 &&
      !repeat['altKey'] &&
      !repeat['ctrlKey'] &&
      !repeat['metaKey'];
    this['_dispatchRemoteInput']({
      kind: 'key',
      type: type3,
      key: String(repeat['key'] || ''),
      code: String(repeat['code'] || ''),
      text: text ? String(repeat['key'] || '') : '',
      keyCode: Number(repeat['keyCode']) || 0,
      repeat: repeat['repeat'] === true,
      altKey: repeat['altKey'] === true,
      ctrlKey: repeat['ctrlKey'] === true,
      metaKey: repeat['metaKey'] === true,
      shiftKey: repeat['shiftKey'] === true,
    });
  }
  ['_getTabState']() {
    return normalizeWebPreviewTabs(this['_data']);
  }
  ['_getActiveTabId']() {
    return this['_getTabState']()['activeTabId'];
  }
  ['_getActiveUrl']() {
    return getWebPreviewActiveTabUrl(this['_data']);
  }
  ['_applyTabPatch'](args4, { commitHistory: commitHistory = false } = {}) {
    if (!args4) return;
    ((this['_data'] = { ...this['_data'], ...args4 }), appStore['updateNodeData'](this['id'], args4));
    if (commitHistory) commit();
    (this['_clearSnapshot'](), this['_syncDom'](), dispatchWebPreviewForceSync(this['id']));
  }
  ['_addTab']({ id: id = '', url: url = '', title: title = '', pendingPopup: pendingPopup = false } = {}) {
    const response = addWebPreviewTabData(this['_data'], {
      id: id,
      url: url,
      title: title,
      pendingPopup: pendingPopup,
    });
    if (response['ok'] === false)
      return (globalThis['window']?.['showToast']?.(webPreviewText('toasts.maxTabs'), 'warning'), response);
    return (
      this['_applyTabPatch'](response['patch'], { commitHistory: true }),
      this['_setStatus'](getWebPreviewDefaultStatusText()),
      response
    );
  }
  ['_activateTab'](value13) {
    const response2 = activateWebPreviewTabData(this['_data'], value13);
    if (response2['ok'] === false) return;
    (this['_applyTabPatch'](response2['patch']), this['_syncNavigationButtons']());
  }
  ['_disposeNativeTab'](enabled) {
    if (!enabled || !desktopBridge['webPreview']['isAvailable']()) return;
    const promise = desktopBridge['webPreview']['disposeViews']({
      nodeIds: [this['id']],
      tabIds: [enabled],
    });
    promise && typeof promise['catch'] === 'function' && void promise['catch'](() => {});
  }
  ['_closeTab'](value14) {
    const response3 = closeWebPreviewTabData(this['_data'], value14);
    if (response3['ok'] === false) return;
    (this['_disposeNativeTab'](response3['closedTabId']),
      this['_navigationStateByTabId']['delete'](response3['closedTabId']),
      this['_applyTabPatch'](response3['patch'], { commitHistory: true }),
      this['_syncNavigationButtons']());
    if (!response3['state']['webUrl']) this['_setStatus'](getWebPreviewDefaultStatusText());
  }
  ['_openPopupTab'](value15, { tabId: tabId = '', pendingPopup: pendingPopup = false } = {}) {
    const url3 = normalizeWebPreviewUrl(value15);
    if (!url3 && pendingPopup !== true) return;
    const response4 = this['_addTab']({
      id: tabId,
      url: url3,
      title: pendingPopup === true ? webPreviewText('tabs.loginWindow') : '',
      pendingPopup: pendingPopup === true && !url3,
    });
    if (response4?.['ok'] === false) {
      if (tabId) this['_disposeNativeTab'](tabId);
      return;
    }
    if (response4?.['ok']) this['_setStatus'](webPreviewText('status.loading'));
  }
  ['_renderStartPageTiles']() {
    this['_startPageView']?.['renderTiles']();
  }
  ['_bindNativeEvents']() {
    const el6 = globalThis['window'];
    if (!el6 || typeof el6['addEventListener'] !== 'function') return;
    const value16 = (value17) => {
      const tabId2 = value17?.['detail'] || {};
      if (tabId2['nodeId'] !== this['id']) return;
      const value18 = tabId2['tabId'] || this['_getActiveTabId'](),
        value19 = value18 === this['_getActiveTabId']();
      if (tabId2['type'] === 'loading')
        value19 &&
          (tabId2['holdSnapshot'] === true
            ? this['el']['classList']['add']('is-web-preview-loading')
            : this['_clearSnapshot'](),
          this['_setStatus'](webPreviewText('status.loading')));
      else {
        if (tabId2['type'] === 'loaded')
          value19 &&
            (this['el']['classList']['remove']('is-web-preview-loading'),
            this['_setStatus'](webPreviewText('status.loaded')));
        else {
          if (tabId2['type'] === 'failed')
            value19 &&
              (this['el']['classList']['remove']('is-web-preview-loading'),
              this['_setStatus'](tabId2['message'] || webPreviewText('status.loadFailed')));
          else {
            if (tabId2['type'] === 'blocked')
              value19 &&
                (this['el']['classList']['remove']('is-web-preview-loading'),
                this['_setStatus'](tabId2['message'] || webPreviewText('status.blocked')));
            else {
              if (tabId2['type'] === 'open-popup')
                this['_openPopupTab'](tabId2['url'], {
                  tabId: tabId2['popupTabId'],
                  pendingPopup: tabId2['pendingPopup'] === true,
                });
              else {
                if (tabId2['type'] === 'closed') {
                  if (value18) this['_closeTab'](value18);
                } else {
                  if (tabId2['type'] === 'send-selected-text') {
                    const webPreviewTextNodeFromSelection = createWebPreviewTextNodeFromSelection({
                      nodeId: this['id'],
                      payload: tabId2,
                    });
                    if (webPreviewTextNodeFromSelection)
                      globalThis['window']?.['showToast']?.(webPreviewText('toasts.textSent'), 'success');
                  } else {
                    if (tabId2['type'] === WEB_PREVIEW_TEXT_SOURCE_EVENT) {
                      const webPreviewSourceTextNodeFromSelection = createWebPreviewSourceTextNodeFromSelection({
                        nodeId: this['id'],
                        payload: tabId2,
                      });
                      if (webPreviewSourceTextNodeFromSelection)
                        globalThis['window']?.['showToast']?.(
                          webPreviewText('toasts.sourceTextSent'),
                          'success',
                        );
                    } else {
                      if (
                        tabId2['type'] === WEB_PREVIEW_TEXT_IMAGE_PROMPT_EVENT ||
                        tabId2['type'] === WEB_PREVIEW_TEXT_IMAGE_PROMPT_GENERATE_EVENT
                      ) {
                        const webPreviewImagePromptNodeFromSelection = createWebPreviewImagePromptNodeFromSelection({
                          nodeId: this['id'],
                          payload: tabId2,
                        });
                        if (webPreviewImagePromptNodeFromSelection && tabId2['type'] === WEB_PREVIEW_TEXT_IMAGE_PROMPT_GENERATE_EVENT)
                          void this['_runImagePromptGeneration'](webPreviewImagePromptNodeFromSelection);
                        else
                          webPreviewImagePromptNodeFromSelection &&
                            globalThis['window']?.['showToast']?.(
                              webPreviewText('toasts.imagePromptCreated'),
                              'success',
                            );
                      } else {
                        if (
                          tabId2['type'] === WEB_PREVIEW_TEXT_VIDEO_PROMPT_EVENT ||
                          tabId2['type'] === WEB_PREVIEW_TEXT_VIDEO_PROMPT_GENERATE_EVENT
                        ) {
                          const webPreviewVideoPromptNodeFromSelection = createWebPreviewVideoPromptNodeFromSelection({
                            nodeId: this['id'],
                            payload: tabId2,
                          });
                          if (webPreviewVideoPromptNodeFromSelection && tabId2['type'] === WEB_PREVIEW_TEXT_VIDEO_PROMPT_GENERATE_EVENT)
                            void this['_runVideoPromptGeneration'](webPreviewVideoPromptNodeFromSelection);
                          else
                            webPreviewVideoPromptNodeFromSelection &&
                              globalThis['window']?.['showToast']?.(
                                webPreviewText('toasts.videoPromptCreated'),
                                'success',
                              );
                        } else {
                          if (tabId2['type'] === 'send-image-to-canvas') {
                            const webPreviewImageNodeFromContext = createWebPreviewImageNodeFromContext({
                              nodeId: this['id'],
                              payload: tabId2,
                            });
                            if (webPreviewImageNodeFromContext)
                              globalThis['window']?.['showToast']?.(
                                webPreviewText('toasts.imageAdded'),
                                'success',
                              );
                          } else {
                            if (
                              tabId2['type'] === 'reverse-image-prompt' ||
                              tabId2['type'] === WEB_PREVIEW_REVERSE_PROMPT_GENERATE_EVENT
                            ) {
                              const webPreviewReverseImagePromptNodes = createWebPreviewReverseImagePromptNodes({
                                nodeId: this['id'],
                                payload: tabId2,
                              });
                              if (
                                webPreviewReverseImagePromptNodes &&
                                tabId2['type'] === WEB_PREVIEW_REVERSE_PROMPT_GENERATE_EVENT
                              )
                                void this['_runReverseImagePromptGeneration'](webPreviewReverseImagePromptNodes);
                              else
                                webPreviewReverseImagePromptNodes &&
                                  globalThis['window']?.['showToast']?.(
                                    webPreviewText('toasts.reversePromptCreated'),
                                    'success',
                                  );
                            } else {
                              if (tabId2['type'] === 'favicon')
                                this['_applyFavicon'](tabId2['faviconUrl'], value18);
                              else {
                                if (tabId2['type'] === 'navigated')
                                  this['_applyNavigatedUrl'](tabId2['url'], value18);
                                else {
                                  if (tabId2['type'] === 'navigation-state')
                                    this['_setNavigationState'](tabId2);
                                  else {
                                    if (tabId2['type'] === 'snapshot' && value19)
                                      this['_applySnapshot'](tabId2);
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
    (el6['addEventListener']('web-preview:native-event', value16),
      (this['_unsubscribeNativeEvent'] = () => {
        el6['removeEventListener']?.('web-preview:native-event', value16);
      }));
  }
  async ['_runCreatedNodeGeneration'](
    value20,
    { startedKey: startedKey, failedKey: failedKey, nodeNotReadyKey: nodeNotReadyKey } = {},
  ) {
    const nodeId3 = String(value20 || '')['trim'](),
      value21 = globalThis['window']?.['showToast'],
      handler2 = (value22) => {
        value21?.(
          webPreviewText(failedKey || 'toasts.reversePromptGenerateFailed', {
            error: String(value22 || webPreviewText('toasts.reversePromptGenerateUnavailable')),
          }),
          'warning',
        );
      };
    if (!nodeId3) {
      handler2(webPreviewText('toasts.reversePromptGenerateUnavailable'));
      return;
    }
    const waitForMountedCanvasNode2 = await waitForMountedCanvasNode(nodeId3);
    if (!waitForMountedCanvasNode2) {
      handler2(webPreviewText(nodeNotReadyKey || 'toasts.reversePromptGenerateNodeNotReady'));
      return;
    }
    const value23 = globalThis['window']?.['canvasCommands'];
    if (typeof value23?.['executeCanvasCommand'] !== 'function') {
      handler2(webPreviewText('toasts.reversePromptGenerateUnavailable'));
      return;
    }
    value21?.(webPreviewText(startedKey || 'toasts.reversePromptGenerateStarted'), 'success');
    try {
      const response5 = await value23['executeCanvasCommand']('generation.run', { nodeId: nodeId3 });
      response5?.['ok'] === false && handler2(getCanvasCommandFailureText(response5));
    } catch (error3) {
      handler2(error3?.['message'] || error3);
    }
  }
  async ['_runReverseImagePromptGeneration'](value24) {
    await this['_runCreatedNodeGeneration'](value24?.['textNode']?.['id'], {
      startedKey: 'toasts.reversePromptGenerateStarted',
      failedKey: 'toasts.reversePromptGenerateFailed',
      nodeNotReadyKey: 'toasts.reversePromptGenerateNodeNotReady',
    });
  }
  async ['_runImagePromptGeneration'](value25) {
    await this['_runCreatedNodeGeneration'](value25?.['id'], {
      startedKey: 'toasts.imagePromptGenerateStarted',
      failedKey: 'toasts.imagePromptGenerateFailed',
      nodeNotReadyKey: 'toasts.imagePromptGenerateNodeNotReady',
    });
  }
  async ['_runVideoPromptGeneration'](value26) {
    await this['_runCreatedNodeGeneration'](value26?.['id'], {
      startedKey: 'toasts.videoPromptGenerateStarted',
      failedKey: 'toasts.videoPromptGenerateFailed',
      nodeNotReadyKey: 'toasts.videoPromptGenerateNodeNotReady',
    });
  }
  ['_readUrlInputValue']() {
    const value27 = globalThis['document']?.['activeElement'] || null;
    if (value27 === this['_fullscreenInput']) return this['_fullscreenInput']?.['value'] || '';
    if (value27 === this['_input']) return this['_input']?.['value'] || '';
    if (value27 === this['_emptyInput']) return this['_emptyInput']?.['value'] || '';
    return (
      this['_fullscreenInput']?.['value'] ||
      this['_input']?.['value'] ||
      this['_emptyInput']?.['value'] ||
      this['_getActiveUrl']() ||
      ''
    );
  }
  ['_commitUrl'](rawUrl2 = this['_readUrlInputValue'](), { title: title = '' } = {}) {
    const webPreviewAddressInput = normalizeWebPreviewAddressInput(rawUrl2),
      tabId3 = this['_getActiveTabId'](),
      recordVisitFn2 = desktopBridge['webPreview']['isAvailable']();
    webPreviewAddressInput && title && this['_pendingVisitTitles']['set'](getPendingVisitKey(tabId3, webPreviewAddressInput), title);
    const response6 = commitWebPreviewNodeUrl({
      nodeId: this['id'],
      rawUrl: rawUrl2,
      title: title,
      tabId: tabId3,
      nodeData: this['_data'],
      recordVisitFn: recordVisitFn2 ? null : recordWebPreviewVisit,
    });
    response6['ok'] &&
      ((this['_data'] = { ...this['_data'], ...response6['patch'] }),
      this['_syncDom'](),
      this['_renderStartPageTiles'](),
      this['_setStatus'](webPreviewText('status.loading')));
  }
  ['_refresh']() {
    const enabled2 = desktopBridge['webPreview'],
      tabId4 = this['_getActiveTabId']();
    if (!this['_getActiveUrl']() || !enabled2['isAvailable']()) return;
    const promise2 = enabled2['controlView']({ nodeId: this['id'], tabId: tabId4, action: 'reload' });
    if (promise2 && typeof promise2['catch'] === 'function') void promise2['catch'](() => {});
    this['_setStatus'](webPreviewText('status.refreshing'));
  }
  ['_navigate'](action) {
    const enabled3 = desktopBridge['webPreview'],
      tabId5 = this['_getActiveTabId']();
    if (!this['_getActiveUrl']() || !enabled3['isAvailable']()) return;
    void enabled3['controlView']({ nodeId: this['id'], tabId: tabId5, action: action })
      ['then']((response7) => {
        response7?.['ok'] === false &&
          response7['error'] === 'no-history' &&
          this['_setNavigationState']({ ...response7, tabId: tabId5 });
      })
      ['catch'](() => {});
  }
  ['_extractMedia']() {
    const enabled4 = desktopBridge['webPreview'],
      tabId6 = this['_getActiveTabId']();
    if (!this['_getActiveUrl']() || !enabled4['isAvailable']()) {
      globalThis['window']?.['showToast']?.(webPreviewText('toasts.openPageFirst'), 'warning');
      return;
    }
    void enabled4['controlView']({ nodeId: this['id'], tabId: tabId6, action: 'extract-media' })
      ['then']((response8) => {
        if (response8?.['ok'] === false) {
          globalThis['window']?.['showToast']?.(webPreviewText('toasts.extractMediaFailed'), 'error');
          return;
        }
        const imageCandidates = Array['isArray'](response8?.['images']) ? response8['images'] : [],
          videoCandidates = Array['isArray'](response8?.['videos']) ? response8['videos'] : [];
        openWebPreviewMediaPicker({
          nodeId: this['id'],
          imageCandidates: imageCandidates,
          videoCandidates: videoCandidates,
        });
      })
      ['catch'](() => {
        globalThis['window']?.['showToast']?.(webPreviewText('toasts.extractMediaFailed'), 'error');
      });
  }
  ['_saveReferenceCard']() {
    const enabled5 = desktopBridge['webPreview'],
      tabId7 = this['_getActiveTabId']();
    if (!this['_getActiveUrl']() || !enabled5['isAvailable']()) {
      globalThis['window']?.['showToast']?.(webPreviewText('toasts.openPageFirst'), 'warning');
      return;
    }
    void enabled5['controlView']({ nodeId: this['id'], tabId: tabId7, action: 'capture-reference' })
      ['then']((payload2) => {
        if (payload2?.['ok'] === false) {
          globalThis['window']?.['showToast']?.(webPreviewText('toasts.saveReferenceFailed'), 'error');
          return;
        }
        const webReferenceCardNode = createWebReferenceCardNode({ nodeId: this['id'], payload: payload2 });
        webReferenceCardNode &&
          globalThis['window']?.['showToast']?.(webPreviewText('toasts.referenceAdded'), 'success');
      })
      ['catch'](() => {
        globalThis['window']?.['showToast']?.(webPreviewText('toasts.saveReferenceFailed'), 'error');
      });
  }
  ['_openExternal']() {
    const webPreviewAddressInput2 = normalizeWebPreviewAddressInput(this['_readUrlInputValue']());
    if (!webPreviewAddressInput2) {
      globalThis['window']?.['showToast']?.(webPreviewText('toasts.addressRequired'), 'warning');
      return;
    }
    void openExternalLink(webPreviewAddressInput2, { label: webPreviewText('nodeName') })['catch']((error4) => {
      globalThis['window']?.['showToast']?.(
        error4?.['message'] || webPreviewText('toasts.openExternalFailed'),
        'error',
      );
    });
  }
  ['_openFullscreen']() {
    const url4 = normalizeWebPreviewAddressInput(this['_readUrlInputValue']());
    if (!url4) {
      globalThis['window']?.['showToast']?.(webPreviewText('toasts.addressRequired'), 'warning');
      return;
    }
    url4 !== normalizeWebPreviewUrl(this['_getActiveUrl']()) && this['_commitUrl'](url4);
    if (this['_fullscreenOverlay']?.['isConnected']) {
      dispatchWebPreviewForceSync(this['id']);
      return;
    }
    const el7 = document['createElement']('div');
    ((el7['className'] = 'web-preview-fullscreen-overlay'),
      el7['addEventListener']('pointerdown', (event7) => event7['stopPropagation']()));
    const webPreviewToolbar2 = createWebPreviewToolbar({
        className: 'web-preview-fullscreen-header',
        url: url4,
        onSubmit: (value28) => this['_commitUrl'](value28),
        onBack: () => this['_navigate']('back'),
        onForward: () => this['_navigate']('forward'),
        onRefresh: () => this['_refresh'](),
        onExtractMedia: () => this['_extractMedia'](),
        onSaveReference: () => this['_saveReferenceCard'](),
        onExternal: () => this['_openExternal'](),
        onExit: () => this['_closeFullscreen'](),
      }),
      value29 = this['_createTabBarView'](),
      el8 = document['createElement']('div');
    ((el8['className'] = 'web-preview-fullscreen-body'),
      (el8['dataset']['webPreviewSlot'] = 'true'),
      (el8['dataset']['webPreviewFullscreen'] = 'true'),
      (el8['dataset']['nodeId'] = this['id']),
      (el8['dataset']['tabId'] = this['_getActiveTabId']()),
      (el8['dataset']['webUrl'] = this['_getActiveUrl']() || url4),
      el7['appendChild'](webPreviewToolbar2['element']),
      el7['appendChild'](value29['element']),
      el7['appendChild'](el8),
      document['body']['appendChild'](el7),
      (this['_fullscreenOverlay'] = el7),
      (this['_fullscreenToolbar'] = webPreviewToolbar2),
      (this['_fullscreenInput'] = webPreviewToolbar2['input']),
      (this['_fullscreenTabBar'] = value29),
      (this['_fullscreenSlot'] = el8),
      this['_unregisterFullscreenSlot']?.(),
      (this['_unregisterFullscreenSlot'] = registerWebPreviewSlot(this['id'], el8)),
      (this['_backButtons'] = [this['_backButtons'][0], webPreviewToolbar2['backButton']]['filter'](Boolean)),
      (this['_forwardButtons'] = [this['_forwardButtons'][0], webPreviewToolbar2['forwardButton']]['filter'](
        Boolean,
      )),
      (this['_fullscreenKeyHandler'] = (event8) => {
        if (event8['key'] === 'Escape') this['_closeFullscreen']();
      }),
      globalThis['window']?.['addEventListener']?.('keydown', this['_fullscreenKeyHandler']),
      this['_syncDom'](),
      this['_syncNavigationButtons'](),
      dispatchWebPreviewForceSync(this['id']));
  }
  ['_closeFullscreen']() {
    if (!this['_fullscreenOverlay']) return;
    (this['_fullscreenOverlay']['remove'](),
      (this['_fullscreenOverlay'] = null),
      (this['_fullscreenToolbar'] = null),
      (this['_fullscreenInput'] = null),
      (this['_fullscreenSlot'] = null),
      this['_unregisterFullscreenSlot']?.(),
      (this['_unregisterFullscreenSlot'] = null),
      this['_fullscreenKeyHandler'] &&
        (globalThis['window']?.['removeEventListener']?.('keydown', this['_fullscreenKeyHandler']),
        (this['_fullscreenKeyHandler'] = null)),
      (this['_backButtons'] = [this['_backButtons'][0]]['filter'](Boolean)),
      (this['_forwardButtons'] = [this['_forwardButtons'][0]]['filter'](Boolean)),
      dispatchWebPreviewForceSync(this['id']));
  }
  ['_applyNavigatedUrl'](value30, tabId8 = this['_getActiveTabId']()) {
    const url5 = normalizeWebPreviewUrl(value30);
    if (!url5) return;
    const pendingVisitKey = getPendingVisitKey(tabId8, url5),
      title2 = this['_pendingVisitTitles']['get'](pendingVisitKey) || '';
    (this['_pendingVisitTitles']['delete'](pendingVisitKey),
      recordWebPreviewVisit({ url: url5, title: title2 }),
      this['_renderStartPageTiles']());
    const response9 = updateWebPreviewTabUrlData(this['_data'], {
      tabId: tabId8,
      url: url5,
      title: title2,
      activate: tabId8 === this['_getActiveTabId'](),
    });
    if (response9['ok'] === false) return;
    ((this['_data'] = { ...this['_data'], ...response9['patch'] }),
      appStore['updateNodeData'](this['id'], response9['patch']),
      this['_syncDom']());
  }
  ['_applyFavicon'](faviconUrl, tabId9 = this['_getActiveTabId']()) {
    const response10 = updateWebPreviewTabFaviconData(this['_data'], {
      tabId: tabId9,
      faviconUrl: faviconUrl,
    });
    if (response10['ok'] === false) return;
    ((this['_data'] = { ...this['_data'], ...response10['patch'] }),
      appStore['updateNodeData'](this['id'], response10['patch']),
      this['_syncDom']());
  }
  ['_setNavigationState'](options3 = {}) {
    const value31 = options3['tabId'] || this['_getActiveTabId'](),
      value32 = {
        canGoBack: Boolean(options3['canGoBack']),
        canGoForward: Boolean(options3['canGoForward']),
      };
    this['_navigationStateByTabId']['set'](value31, value32);
    if (value31 === this['_getActiveTabId']()) this['_navigationState'] = value32;
    this['_syncNavigationButtons']();
  }
  ['_syncNavigationButtons']() {
    this['_navigationState'] = this['_navigationStateByTabId']['get'](this['_getActiveTabId']()) || {
      canGoBack: false,
      canGoForward: false,
    };
    for (const el9 of this['_backButtons']) {
      if (el9) el9['disabled'] = !this['_navigationState']['canGoBack'];
    }
    for (const el10 of this['_forwardButtons']) {
      if (el10) el10['disabled'] = !this['_navigationState']['canGoForward'];
    }
  }
  ['_setStatus'](value33) {
    this['_statusText'] = String(value33 || getWebPreviewDefaultStatusText());
    if (this['_status']) this['_status']['textContent'] = this['_statusText'];
    this['_startPageView']?.['setStatus'](this['_statusText']);
  }
  ['_applySnapshot'](box2 = {}) {
    const enabled6 = String(box2['dataUrl'] || '');
    if (!enabled6['startsWith']('data:image/') || !this['_freezeImage']) return;
    const value34 = String(box2['freezeToken'] || 'ready'),
      count = Number(box2['width']),
      count2 = Number(box2['height']),
      count3 = Number(box2['zoomFactor']),
      value35 = this['_freezeSnapshotSerial'] + 1;
    this['_freezeSnapshotSerial'] = value35;
    if (box2['streaming'] === true) {
      ((this['_freezeImage']['src'] = enabled6),
        (this['el']['dataset']['webPreviewSnapshotToken'] = value34));
      Number['isFinite'](count) &&
        count > 0 &&
        (this['el']['dataset']['webPreviewSnapshotWidth'] = String(count));
      Number['isFinite'](count2) &&
        count2 > 0 &&
        (this['el']['dataset']['webPreviewSnapshotHeight'] = String(count2));
      Number['isFinite'](count3) &&
        count3 > 0 &&
        (this['el']['dataset']['webPreviewSnapshotZoomFactor'] = String(count3));
      this['el']['classList']['add']('is-remote-browser-surface', 'has-freeze-snapshot');
      return;
    }
    let value36 = false;
    const run = () => {
        if (value36) return;
        if (this['_freezeSnapshotSerial'] !== value35 || !this['_freezeImage']) return;
        ((value36 = true),
          (this['_freezeImage']['src'] = enabled6),
          (this['el']['dataset']['webPreviewSnapshotToken'] = value34),
          Number['isFinite'](count) && count > 0
            ? (this['el']['dataset']['webPreviewSnapshotWidth'] = String(count))
            : delete this['el']['dataset']['webPreviewSnapshotWidth'],
          Number['isFinite'](count2) && count2 > 0
            ? (this['el']['dataset']['webPreviewSnapshotHeight'] = String(count2))
            : delete this['el']['dataset']['webPreviewSnapshotHeight'],
          Number['isFinite'](count3) && count3 > 0
            ? (this['el']['dataset']['webPreviewSnapshotZoomFactor'] = String(count3))
            : delete this['el']['dataset']['webPreviewSnapshotZoomFactor'],
          box2['surfaceMode'] === 'remote-snapshot' &&
            this['el']['classList']['add']('is-remote-browser-surface'),
          this['el']['classList']['add']('has-freeze-snapshot'),
          dispatchWebPreviewForceSync(this['id']));
      },
      enabled7 =
        typeof globalThis['Image'] === 'function'
          ? new globalThis['Image']()
          : globalThis['document']?.['createElement']?.('img');
    if (!enabled7) {
      run();
      return;
    }
    ((enabled7['onload'] = run),
      (enabled7['onerror'] = () => {
        this['_freezeSnapshotSerial'] === value35 &&
          (this['el']['classList']['remove']('has-freeze-snapshot'),
          delete this['el']['dataset']['webPreviewSnapshotToken'],
          delete this['el']['dataset']['webPreviewSnapshotWidth'],
          delete this['el']['dataset']['webPreviewSnapshotHeight'],
          delete this['el']['dataset']['webPreviewSnapshotZoomFactor']);
      }),
      (enabled7['src'] = enabled6));
    if (typeof enabled7['decode'] === 'function')
      void enabled7['decode']()
        ['then'](run)
        ['catch'](() => {
          if (enabled7['complete']) run();
        });
    else enabled7['complete'] && run();
  }
  ['_clearSnapshot']() {
    this['_freezeSnapshotSerial'] += 1;
    if (this['_freezeImage']) this['_freezeImage']['removeAttribute']('src');
    (delete this['el']['dataset']['webPreviewSnapshotToken'],
      delete this['el']['dataset']['webPreviewSnapshotWidth'],
      delete this['el']['dataset']['webPreviewSnapshotHeight'],
      delete this['el']['dataset']['webPreviewSnapshotZoomFactor'],
      this['el']['classList']['remove'](
        'has-freeze-snapshot',
        'is-web-preview-loading',
        'is-remote-browser-surface',
      ));
  }
  ['_syncDom']() {
    const activeTabId = this['_getTabState'](),
      webUrl2 = activeTabId['webUrl'] || '';
    ((this['_data'] = { ...this['_data'], activeTabId: activeTabId['activeTabId'], webUrl: webUrl2 }),
      this['_tabBar']?.['setTabs'](this['_data']),
      this['_fullscreenTabBar']?.['setTabs'](this['_data']));
    this['_input'] && document['activeElement'] !== this['_input'] && (this['_input']['value'] = webUrl2);
    this['_startPageView']?.['setUrl'](webUrl2);
    this['_fullscreenInput'] &&
      document['activeElement'] !== this['_fullscreenInput'] &&
      (this['_fullscreenInput']['value'] = webUrl2);
    this['_slot']?.['dataset'] &&
      ((this['_slot']['dataset']['webUrl'] = webUrl2),
      (this['_slot']['dataset']['nodeId'] = this['id']),
      (this['_slot']['dataset']['tabId'] = activeTabId['activeTabId']));
    this['_fullscreenSlot']?.['dataset'] &&
      ((this['_fullscreenSlot']['dataset']['webUrl'] = webUrl2),
      (this['_fullscreenSlot']['dataset']['nodeId'] = this['id']),
      (this['_fullscreenSlot']['dataset']['tabId'] = activeTabId['activeTabId']));
    const enabled8 = Boolean(webUrl2 || activeTabId['activeTab']?.['pendingPopup'] === true);
    this['el']['classList']['toggle']('has-web-url', enabled8);
    if (!enabled8) (this['_renderStartPageTiles'](), this['_setStatus'](getWebPreviewDefaultStatusText()));
    else
      webUrl2 &&
        !desktopBridge['webPreview']['isAvailable']() &&
        this['_setStatus'](webPreviewText('status.nativeUnsupported'));
  }
  ['update'](value37) {
    ((this['_data'] = value37), this['_syncDom']());
  }
  ['unmount']() {
    this['_remoteInputQueue']?.['dispose']?.();
    this['_remoteWheelTimer'] !== null &&
      (globalThis['clearTimeout'](this['_remoteWheelTimer']), (this['_remoteWheelTimer'] = null));
    ((this['_remoteWheelInput'] = null),
      this['_closeFullscreen'](),
      this['_unregisterSlot']?.(),
      (this['_unregisterSlot'] = null),
      this['_unregisterFullscreenSlot']?.(),
      (this['_unregisterFullscreenSlot'] = null),
      this['_unsubscribeNativeEvent']?.(),
      (this['_unsubscribeNativeEvent'] = null),
      this['_unsubscribeLocale']?.(),
      (this['_unsubscribeLocale'] = null));
    const value38 = desktopBridge['webPreview'];
    value38['isAvailable']() && void value38['disposeViews']({ nodeIds: [this['id']] });
  }
}

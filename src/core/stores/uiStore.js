import { selectUiState } from './domainSlices.js';
const UI_ACTION_NAMES = Object.freeze([
  'batch',
  'requestRender',
  'invalidateUi',
  'showPicker',
  'hidePicker',
  'showContextMenu',
  'hideContextMenu',
  'setPickConnectMode',
  'setPickConnectHover',
  'setServerConnection',
  'setAnnotateState',
  'setMattingState',
  'setVideoKeyingState',
  'setVideoClipState',
  'setTheme',
  'toggleTheme',
  'initTheme',
  'setFeatureSelection',
  'getFeatureSelection',
  'initFeatureSelections',
  'setShowVideoMeta',
  'setTitleFollowsCanvasZoom',
  'setPromptBoxResizeEnabled',
  'setPromptEnterBehavior',
  'setPromptAttachmentButtonHidden',
  'setImageVideoNodeResizeEnabled',
  'setImageToolbarLayout',
  'setVideoToolbarLayout',
  'setAlignFeatureEnabled',
  'setAlignFeatureTriggerMode',
  'setAlignDistributeGap',
  'setAlignPanelVisible',
  'setAlignPanelAnchorWorld',
  'setSnapGuidesEnabled',
  'setSelectionRelatedHighlightEnabled',
  'setSelectionRelatedHighlightColor',
  'setConnectionLinesVisible',
  'initUiPrefs',
]);
function bindCoreAction(value, item) {
  const run = value?.[item];
  if (typeof run !== 'function') return undefined;
  return (...args) => run(...args);
}
function createUiStore(store) {
  if (!store || typeof store !== 'object')
    throw new TypeError('[uiStore] createUiStore() 需要传入有效的 coreStore');
  const key = {
    subscribe(handler) {
      if (typeof handler !== 'function') throw new TypeError('[uiStore] subscribe() 的参数必须是函数');
      return store.subscribe((index) => handler(selectUiState(index)));
    },
    subscribeRaw(handler2) {
      if (typeof handler2 !== 'function') throw new TypeError('[uiStore] subscribeRaw() 的参数必须是函数');
      return store.subscribeRaw((result) => handler2(selectUiState(result)));
    },
    subscribeSelector(handler3, data, options = {}) {
      if (typeof handler3 !== 'function')
        throw new TypeError('[uiStore] subscribeSelector() 的 selector 必须是函数');
      if (typeof data !== 'function')
        throw new TypeError('[uiStore] subscribeSelector() 的 callback 必须是函数');
      return store.subscribeSelector((target) => handler3(selectUiState(target)), data, options);
    },
    getState() {
      return selectUiState(store.getState());
    },
    getStateRaw() {
      return selectUiState(store.getStateRaw());
    },
  };
  for (const source of UI_ACTION_NAMES) {
    const bindCoreAction2 = bindCoreAction(store, source);
    if (bindCoreAction2) key[source] = bindCoreAction2;
  }
  return key;
}
export { UI_ACTION_NAMES, createUiStore };

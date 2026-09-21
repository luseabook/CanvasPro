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
function bindCoreAction(_0x42d637, _0x15dc5a) {
  const _0x1af70e = _0x42d637?.[_0x15dc5a];
  if (typeof _0x1af70e !== 'function') return undefined;
  return (..._0xc2e98c) => _0x1af70e(..._0xc2e98c);
}
function createUiStore(_0x4b19a4) {
  if (!_0x4b19a4 || typeof _0x4b19a4 !== 'object')
    throw new TypeError('[uiStore] createUiStore() 需要传入有效的 coreStore');
  const _0x5bd6a5 = {
    subscribe(_0x33f3bd) {
      if (typeof _0x33f3bd !== 'function') throw new TypeError('[uiStore] subscribe() 的参数必须是函数');
      return _0x4b19a4.subscribe((_0x2343b2) => _0x33f3bd(selectUiState(_0x2343b2)));
    },
    subscribeRaw(_0x507257) {
      if (typeof _0x507257 !== 'function') throw new TypeError('[uiStore] subscribeRaw() 的参数必须是函数');
      return _0x4b19a4.subscribeRaw((_0x55e8bf) => _0x507257(selectUiState(_0x55e8bf)));
    },
    subscribeSelector(_0x1c5fbe, _0x25ae0d, _0x21f6a5 = {}) {
      if (typeof _0x1c5fbe !== 'function')
        throw new TypeError('[uiStore] subscribeSelector() 的 selector 必须是函数');
      if (typeof _0x25ae0d !== 'function')
        throw new TypeError('[uiStore] subscribeSelector() 的 callback 必须是函数');
      return _0x4b19a4.subscribeSelector(
        (_0xf2d28f) => _0x1c5fbe(selectUiState(_0xf2d28f)),
        _0x25ae0d,
        _0x21f6a5,
      );
    },
    getState() {
      return selectUiState(_0x4b19a4.getState());
    },
    getStateRaw() {
      return selectUiState(_0x4b19a4.getStateRaw());
    },
  };
  for (const _0x16caa4 of UI_ACTION_NAMES) {
    const _0xb69246 = bindCoreAction(_0x4b19a4, _0x16caa4);
    if (_0xb69246) _0x5bd6a5[_0x16caa4] = _0xb69246;
  }
  return _0x5bd6a5;
}
export { UI_ACTION_NAMES, createUiStore };

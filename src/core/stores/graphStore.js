import { selectGraphState } from './domainSlices.js';
const GRAPH_ACTION_NAMES = Object.freeze([
  'batch',
  'subscribeNodeField',
  'requestRender',
  'invalidateUi',
  'addNode',
  'updateNodePosition',
  'moveNodes',
  'moveNodesByOffsets',
  'deleteNodes',
  'updateNodeData',
  'updateNodesData',
  'swapStoryboardCells',
  'addEdge',
  'removeEdge',
  'updateEdgesBatch',
  'updateViewport',
  'setViewportPersistPolicy',
  'markViewportPersist',
  'loadState',
  'loadHistorySnapshot',
  'getHistorySnapshot',
  'getSourcesForNode',
  'setSelectionBox',
  'setSelectionMeta',
  'setSelectedNodes',
  'groupNodes',
  'getIncomingEdges',
  'renameNode',
  'clearSelection',
  'setConnOverlay',
  'clearConnOverlay',
  'serialize',
  'hydrate',
  'hydrateTrustedSnapshot',
]);
function bindCoreAction(_0x113f0f, _0x4bec55) {
  const _0x4c3f23 = _0x113f0f?.[_0x4bec55];
  if (typeof _0x4c3f23 !== 'function') return undefined;
  return (..._0x356f0e) => _0x4c3f23(..._0x356f0e);
}
function createGraphStore(_0x329719) {
  if (!_0x329719 || typeof _0x329719 !== 'object')
    throw new TypeError('[graphStore] createGraphStore() 需要传入有效的 coreStore');
  const _0x273a8 = {
    subscribe(_0x5e10f0) {
      if (typeof _0x5e10f0 !== 'function') throw new TypeError('[graphStore] subscribe() 的参数必须是函数');
      return _0x329719.subscribe((_0x40db3c) => _0x5e10f0(selectGraphState(_0x40db3c)));
    },
    subscribeRaw(_0x32c2c4) {
      if (typeof _0x32c2c4 !== 'function')
        throw new TypeError('[graphStore] subscribeRaw() 的参数必须是函数');
      return _0x329719.subscribeRaw((_0x2ef28e) => _0x32c2c4(selectGraphState(_0x2ef28e)));
    },
    subscribeSelector(_0x27be60, _0x2fed6d, _0x5405d9 = {}) {
      if (typeof _0x27be60 !== 'function')
        throw new TypeError('[graphStore] subscribeSelector() 的 selector 必须是函数');
      if (typeof _0x2fed6d !== 'function')
        throw new TypeError('[graphStore] subscribeSelector() 的 callback 必须是函数');
      return _0x329719.subscribeSelector(
        (_0x2061f5) => _0x27be60(selectGraphState(_0x2061f5)),
        _0x2fed6d,
        _0x5405d9,
      );
    },
    getState() {
      return selectGraphState(_0x329719.getState());
    },
    getStateRaw() {
      return selectGraphState(_0x329719.getStateRaw());
    },
  };
  for (const _0x20ee78 of GRAPH_ACTION_NAMES) {
    const _0x26b9ef = bindCoreAction(_0x329719, _0x20ee78);
    if (_0x26b9ef) _0x273a8[_0x20ee78] = _0x26b9ef;
  }
  return _0x273a8;
}
export { GRAPH_ACTION_NAMES, createGraphStore };

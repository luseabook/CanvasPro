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
function bindCoreAction(value, item) {
  const run = value?.[item];
  if (typeof run !== 'function') return undefined;
  return (...args) => run(...args);
}
function createGraphStore(store) {
  if (!store || typeof store !== 'object')
    throw new TypeError('[graphStore] createGraphStore() 需要传入有效的 coreStore');
  const key = {
    subscribe(handler) {
      if (typeof handler !== 'function') throw new TypeError('[graphStore] subscribe() 的参数必须是函数');
      return store.subscribe((index) => handler(selectGraphState(index)));
    },
    subscribeRaw(handler2) {
      if (typeof handler2 !== 'function') throw new TypeError('[graphStore] subscribeRaw() 的参数必须是函数');
      return store.subscribeRaw((result) => handler2(selectGraphState(result)));
    },
    subscribeSelector(handler3, data, options = {}) {
      if (typeof handler3 !== 'function')
        throw new TypeError('[graphStore] subscribeSelector() 的 selector 必须是函数');
      if (typeof data !== 'function')
        throw new TypeError('[graphStore] subscribeSelector() 的 callback 必须是函数');
      return store.subscribeSelector((target) => handler3(selectGraphState(target)), data, options);
    },
    getState() {
      return selectGraphState(store.getState());
    },
    getStateRaw() {
      return selectGraphState(store.getStateRaw());
    },
  };
  for (const source of GRAPH_ACTION_NAMES) {
    const bindCoreAction2 = bindCoreAction(store, source);
    if (bindCoreAction2) key[source] = bindCoreAction2;
  }
  return key;
}
export { GRAPH_ACTION_NAMES, createGraphStore };

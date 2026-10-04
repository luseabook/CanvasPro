import { selectWorkspaceState } from './domainSlices.js';
const WORKSPACE_ACTION_NAMES = Object.freeze([
  'batch',
  'requestRender',
  'invalidateUi',
  'setSubscriptionState',
  'setModelCatalogState',
  'addAsset',
  'deleteAsset',
  'updateAsset',
  'upsertStoryboard3DProject',
  'deleteStoryboard3DProject',
  'setWorkflowsLoading',
  'setWorkflows',
  'upsertWorkflow',
  'updateWorkflowLocal',
  'markWorkflowUsed',
  'setWorkflowUi',
  'setWorkflowDraft',
  'resetWorkflowDraft',
  'openWorkflowModal',
  'closeWorkflowModal',
  'setWorkflowSaving',
  'setWorkflowApplying',
]);
function bindCoreAction(value, item) {
  const run = value?.[item];
  if (typeof run !== 'function') return undefined;
  return (...args) => run(...args);
}
function createWorkspaceStore(store) {
  if (!store || typeof store !== 'object')
    throw new TypeError('[workspaceStore] createWorkspaceStore() 需要传入有效的 coreStore');
  const key = {
    subscribe(handler) {
      if (typeof handler !== 'function') throw new TypeError('[workspaceStore] subscribe() 的参数必须是函数');
      return store.subscribe((index) => handler(selectWorkspaceState(index)));
    },
    subscribeRaw(handler2) {
      if (typeof handler2 !== 'function')
        throw new TypeError('[workspaceStore] subscribeRaw() 的参数必须是函数');
      return store.subscribeRaw((result) => handler2(selectWorkspaceState(result)));
    },
    subscribeSelector(handler3, data, options = {}) {
      if (typeof handler3 !== 'function')
        throw new TypeError('[workspaceStore] subscribeSelector() 的 selector 必须是函数');
      if (typeof data !== 'function')
        throw new TypeError('[workspaceStore] subscribeSelector() 的 callback 必须是函数');
      return store.subscribeSelector((target) => handler3(selectWorkspaceState(target)), data, options);
    },
    getState() {
      return selectWorkspaceState(store.getState());
    },
    getStateRaw() {
      return selectWorkspaceState(store.getStateRaw());
    },
  };
  for (const source of WORKSPACE_ACTION_NAMES) {
    const bindCoreAction2 = bindCoreAction(store, source);
    if (bindCoreAction2) key[source] = bindCoreAction2;
  }
  return key;
}
export { WORKSPACE_ACTION_NAMES, createWorkspaceStore };

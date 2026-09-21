import { selectWorkspaceState } from './domainSlices.js';
const WORKSPACE_ACTION_NAMES = Object.freeze([
  'batch',
  'requestRender',
  'invalidateUi',
  'setSubscriptionState',
  'addAsset',
  'deleteAsset',
  'updateAsset',
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
function bindCoreAction(_0x38fedf, _0x57a5d1) {
  const _0xfda1 = _0x38fedf?.[_0x57a5d1];
  if (typeof _0xfda1 !== 'function') return undefined;
  return (..._0x56fe6a) => _0xfda1(..._0x56fe6a);
}
function createWorkspaceStore(_0x11933d) {
  if (!_0x11933d || typeof _0x11933d !== 'object')
    throw new TypeError('[workspaceStore] createWorkspaceStore() 需要传入有效的 coreStore');
  const _0x3a72e8 = {
    subscribe(_0x388e68) {
      if (typeof _0x388e68 !== 'function')
        throw new TypeError('[workspaceStore] subscribe() 的参数必须是函数');
      return _0x11933d.subscribe((_0x1f8d58) => _0x388e68(selectWorkspaceState(_0x1f8d58)));
    },
    subscribeRaw(_0x1f0432) {
      if (typeof _0x1f0432 !== 'function')
        throw new TypeError('[workspaceStore] subscribeRaw() 的参数必须是函数');
      return _0x11933d.subscribeRaw((_0x41812a) => _0x1f0432(selectWorkspaceState(_0x41812a)));
    },
    subscribeSelector(_0x3415e3, _0x38f53a, _0xeaa9c6 = {}) {
      if (typeof _0x3415e3 !== 'function')
        throw new TypeError('[workspaceStore] subscribeSelector() 的 selector 必须是函数');
      if (typeof _0x38f53a !== 'function')
        throw new TypeError('[workspaceStore] subscribeSelector() 的 callback 必须是函数');
      return _0x11933d.subscribeSelector(
        (_0x3c6e32) => _0x3415e3(selectWorkspaceState(_0x3c6e32)),
        _0x38f53a,
        _0xeaa9c6,
      );
    },
    getState() {
      return selectWorkspaceState(_0x11933d.getState());
    },
    getStateRaw() {
      return selectWorkspaceState(_0x11933d.getStateRaw());
    },
  };
  for (const _0x101258 of WORKSPACE_ACTION_NAMES) {
    const _0x4f4c97 = bindCoreAction(_0x11933d, _0x101258);
    if (_0x4f4c97) _0x3a72e8[_0x101258] = _0x4f4c97;
  }
  return _0x3a72e8;
}
export { WORKSPACE_ACTION_NAMES, createWorkspaceStore };

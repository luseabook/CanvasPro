import { createLegacyKernelStore } from './legacyKernelStore.js';
import { createGraphStore } from './graphStore.js';
import { createUiStore } from './uiStore.js';
import { createWorkspaceStore } from './workspaceStore.js';
function createFacadeStoreFromCore(_0x23fc88) {
  if (!_0x23fc88 || typeof _0x23fc88 !== 'object')
    throw new TypeError('[facadeStore] createFacadeStoreFromCore() 需要传入有效的 coreStore');
  const _0x4795dc = createGraphStore(_0x23fc88),
    _0x2a4879 = createUiStore(_0x23fc88),
    _0x16ac06 = createWorkspaceStore(_0x23fc88);
  return {
    ..._0x23fc88,
    graphStore: _0x4795dc,
    uiStore: _0x2a4879,
    workspaceStore: _0x16ac06,
    getDomainStores() {
      return { graphStore: _0x4795dc, uiStore: _0x2a4879, workspaceStore: _0x16ac06 };
    },
  };
}
function createFacadeStore() {
  const _0x407623 = createLegacyKernelStore();
  return createFacadeStoreFromCore(_0x407623);
}
export { createFacadeStore, createFacadeStoreFromCore };

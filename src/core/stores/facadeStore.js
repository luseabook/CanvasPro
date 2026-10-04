import { createLegacyKernelStore } from './legacyKernelStore.js';
import { createGraphStore } from './graphStore.js';
import { createUiStore } from './uiStore.js';
import { createWorkspaceStore } from './workspaceStore.js';
function createFacadeStoreFromCore(args) {
  if (!args || typeof args !== 'object')
    throw new TypeError('[facadeStore] createFacadeStoreFromCore() 需要传入有效的 coreStore');
  const graphStore = createGraphStore(args),
    uiStore = createUiStore(args),
    workspaceStore = createWorkspaceStore(args);
  return {
    ...args,
    graphStore: graphStore,
    uiStore: uiStore,
    workspaceStore: workspaceStore,
    getDomainStores() {
      return { graphStore: graphStore, uiStore: uiStore, workspaceStore: workspaceStore };
    },
  };
}
function createFacadeStore() {
  const legacyKernelStore = createLegacyKernelStore();
  return createFacadeStoreFromCore(legacyKernelStore);
}
export { createFacadeStore, createFacadeStoreFromCore };

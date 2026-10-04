import legacyKernelStore_2, { createLegacyKernelStore } from './legacyKernelStore.js';
import { createFacadeStore, createFacadeStoreFromCore } from './facadeStore.js';
const facadeStore = createFacadeStoreFromCore(legacyKernelStore_2),
  { graphStore, uiStore, workspaceStore } = facadeStore.getDomainStores();
function createStore() {
  return createFacadeStore();
}
function createDomainStores() {
  const legacyKernelStore2 = createLegacyKernelStore(),
    facadeStoreFromCore = createFacadeStoreFromCore(legacyKernelStore2);
  return facadeStoreFromCore.getDomainStores();
}
export {
  facadeStore,
  graphStore,
  uiStore,
  workspaceStore,
  legacyKernelStore_2 as legacyKernelStore,
  createStore,
  createDomainStores,
  createLegacyKernelStore,
};
export default facadeStore;

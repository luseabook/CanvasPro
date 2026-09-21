import legacyKernelStore_2, { createLegacyKernelStore } from './legacyKernelStore.js';
import { createFacadeStore, createFacadeStoreFromCore } from './facadeStore.js';
const facadeStore = createFacadeStoreFromCore(legacyKernelStore_2),
  { graphStore, uiStore, workspaceStore } = facadeStore.getDomainStores();
function createStore() {
  return createFacadeStore();
}
function createDomainStores() {
  const _0x358d01 = createLegacyKernelStore(),
    _0x2d9569 = createFacadeStoreFromCore(_0x358d01);
  return _0x2d9569.getDomainStores();
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

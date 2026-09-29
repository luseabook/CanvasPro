import { desktopBridge } from './desktopBridge.js';

const assetUpdateListeners = new Set();
let stopDesktopAssetUpdates = null;

function ensureDesktopAssetUpdateSubscription() {
  if (stopDesktopAssetUpdates || !desktopBridge.assetImport.canSubscribeUpdates()) return;

  stopDesktopAssetUpdates = desktopBridge.assetImport.onAssetUpdated((event) => {
    [...assetUpdateListeners].forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.warn('[asset-update] subscriber failed', error);
      }
    });
  });
}

export function subscribeAssetUpdates(listener) {
  if (typeof listener !== 'function') return () => {};

  assetUpdateListeners.add(listener);
  ensureDesktopAssetUpdateSubscription();

  return () => {
    assetUpdateListeners.delete(listener);
    if (assetUpdateListeners.size || !stopDesktopAssetUpdates) return;

    stopDesktopAssetUpdates();
    stopDesktopAssetUpdates = null;
  };
}

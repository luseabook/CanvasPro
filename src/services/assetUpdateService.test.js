import test from 'node:test';
import assert from 'node:assert/strict';

import { desktopBridge } from './desktopBridge.js';

function restoreAssetImport(originalCanSubscribeUpdates, originalOnAssetUpdated) {
  desktopBridge.assetImport.canSubscribeUpdates = originalCanSubscribeUpdates;
  desktopBridge.assetImport.onAssetUpdated = originalOnAssetUpdated;
}

test('assetUpdateService: ignores non-function subscribers without opening a desktop subscription', async () => {
  const originalCanSubscribeUpdates = desktopBridge.assetImport.canSubscribeUpdates;
  const originalOnAssetUpdated = desktopBridge.assetImport.onAssetUpdated;
  let desktopSubscribeCalls = 0;

  desktopBridge.assetImport.canSubscribeUpdates = () => true;
  desktopBridge.assetImport.onAssetUpdated = () => {
    desktopSubscribeCalls += 1;
    return () => {};
  };

  try {
    const { subscribeAssetUpdates } = await import(`./assetUpdateService.js?case=invalid-${Date.now()}`);
    const unsubscribe = subscribeAssetUpdates(null);

    assert.equal(typeof unsubscribe, 'function');
    unsubscribe();
    assert.equal(desktopSubscribeCalls, 0);
  } finally {
    restoreAssetImport(originalCanSubscribeUpdates, originalOnAssetUpdated);
  }
});

test('assetUpdateService: shares one desktop subscription and isolates listener failures', async () => {
  const originalCanSubscribeUpdates = desktopBridge.assetImport.canSubscribeUpdates;
  const originalOnAssetUpdated = desktopBridge.assetImport.onAssetUpdated;
  const originalConsoleWarn = console.warn;
  const events = [];
  const warnings = [];
  let desktopSubscribeCalls = 0;
  let desktopReleaseCalls = 0;
  let desktopListener = null;

  desktopBridge.assetImport.canSubscribeUpdates = () => true;
  desktopBridge.assetImport.onAssetUpdated = (listener) => {
    desktopSubscribeCalls += 1;
    desktopListener = listener;
    return () => {
      desktopReleaseCalls += 1;
    };
  };
  console.warn = (...args) => {
    warnings.push(args);
  };

  try {
    const { subscribeAssetUpdates } = await import(`./assetUpdateService.js?case=shared-${Date.now()}`);
    const firstFailure = new Error('first listener failed');
    const firstListener = (event) => events.push(['first', event.assetId]);
    const secondListener = (event) => {
      events.push(['second', event.assetId]);
      throw firstFailure;
    };
    const thirdListener = (event) => events.push(['third', event.assetId]);
    const firstUnsubscribe = subscribeAssetUpdates(firstListener);
    const secondUnsubscribe = subscribeAssetUpdates(secondListener);
    const thirdUnsubscribe = subscribeAssetUpdates(thirdListener);

    assert.equal(desktopSubscribeCalls, 1);

    desktopListener({ assetId: 'asset-1' });

    assert.deepEqual(events, [
      ['first', 'asset-1'],
      ['second', 'asset-1'],
      ['third', 'asset-1'],
    ]);
    assert.deepEqual(warnings, [['[asset-update] subscriber failed', firstFailure]]);

    firstUnsubscribe();
    thirdUnsubscribe();
    assert.equal(desktopReleaseCalls, 0);

    secondUnsubscribe();
    assert.equal(desktopReleaseCalls, 1);
  } finally {
    console.warn = originalConsoleWarn;
    restoreAssetImport(originalCanSubscribeUpdates, originalOnAssetUpdated);
  }
});

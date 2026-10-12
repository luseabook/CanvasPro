// Offline import/shape test for AssetManager. The module is a large DOM-bound class,
// so this installs a minimal jsdom document before importing it and then pins the
// public method surface. It is the safety net required before the file is split.
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const key of [
  'window',
  'document',
  'navigator',
  'localStorage',
  'HTMLElement',
  'Node',
  'CustomEvent',
  'Event',
  'getComputedStyle',
  'requestAnimationFrame',
  'MutationObserver',
]) {
  // defineProperty: some Node globals (e.g. navigator) are getter-only in ESM.
  Object.defineProperty(globalThis, key, {
    value: dom.window[key] ?? dom.window,
    configurable: true,
    writable: true,
  });
}

const { assetManager } = await import('./AssetManager.js');

test('AssetManager exports a singleton instance', () => {
  assert.equal(typeof assetManager, 'object');
  assert.ok(assetManager);
});

test('AssetManager keeps its public method surface', () => {
  const expected = [
    'loadAssetsFromServer',
    'refreshAssetsFromServer',
    'renderSidebarContent',
    'initSidebarPanel',
    'showSidebarPanel',
    'hideSidebarPanel',
    'showCreatePanel',
    'closeCreatePanel',
    'restoreAssetToCanvas',
    'upsertMediaAssetPackage',
  ];
  for (const name of expected) {
    assert.equal(typeof assetManager[name], 'function', `assetManager.${name}`);
  }
});

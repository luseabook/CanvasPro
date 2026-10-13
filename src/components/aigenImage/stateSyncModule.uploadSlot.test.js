// Equivalence test for the single-upload ref bar path (the `_lastRefHTML` cache).
// It locks the intended behaviour before/after replacing the HTML-string cache with a
// structural signature:
//   - same input  -> the ref bar (and its attach button node) is NOT rebuilt
//   - new upload  -> the bar IS rebuilt and shows the delete button
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const key of [
  'window',
  'document',
  'navigator',
  'HTMLElement',
  'Node',
  'CustomEvent',
  'Event',
  'getComputedStyle',
  'requestAnimationFrame',
  'MutationObserver',
]) {
  Object.defineProperty(globalThis, key, {
    value: dom.window[key] ?? dom.window,
    configurable: true,
    writable: true,
  });
}

const { createAIGenerateNodeStateSyncModule } = await import('./stateSyncModule.js');

function createHarness(model) {
  const nodeData = { id: 'n1', type: 'ai-image', model, provider: 'runninghubwf' };
  const state = { pickConnectMode: {}, nodes: { n1: nodeData }, edges: {} };
  const module = createAIGenerateNodeStateSyncModule({
    store: {
      getState: () => state,
      getIncomingEdges: () => [],
      updateEdgesBatch() {},
    },
    getImage: async () => null,
    ensureThumbDecoded() {},
    revealRefThumbMedia() {},
    _syncPillLabels() {},
  });
  const refBarEl = document.createElement('div');
  refBarEl.className = 'node-ref-bar';
  const host = Object.assign(Object.create(module), {
    nodeId: 'n1',
    _data: nodeData,
    refBarEl: refBarEl,
    _refThumbObjectUrls: new Map(),
    promptEl: { innerText: '', querySelectorAll: () => [] },
  });
  return { nodeData, module, refBarEl, host };
}

test('single upload ref bar: same input keeps the bar, new upload rebuilds it', async () => {
  const { nodeData, module, refBarEl, host } = createHarness('runninghub/1994718111704158209');

  await module._renderRefBarImpl.call(host);
  const firstButton = refBarEl.querySelector('.prompt-attachment-btn');
  const firstSlot = refBarEl.querySelector('.ref-thumb-wrap.ref-upload-slot');
  assert.ok(firstButton, 'attach button rendered');
  assert.ok(firstSlot, 'upload slot rendered');
  assert.ok(firstSlot.querySelector('.ref-upload-label'), 'empty upload slot shows a label');
  assert.equal(refBarEl.querySelector('.ref-upload-delete'), null);

  // Same input: the cache signature is unchanged, so nothing is rebuilt.
  await module._renderRefBarImpl.call(host);
  assert.strictEqual(refBarEl.querySelector('.prompt-attachment-btn'), firstButton);

  // New upload url: signature changes -> bar rebuilt with the thumbnail + delete button.
  nodeData.rhAnimeRealRefUrl = 'output/uploaded.png';
  await module._renderRefBarImpl.call(host);
  const secondButton = refBarEl.querySelector('.prompt-attachment-btn');
  assert.notStrictEqual(secondButton, firstButton);
  assert.ok(refBarEl.querySelector('.ref-upload-delete'), 'delete button appears with a thumbnail');
});

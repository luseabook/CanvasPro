// Equivalence test for the manifest-driven fixed image ref bar (the
// `renderManifestFixedImageRefBar` path). It characterises the DOM the bar must present
// before/after that builder is converted from an HTML string to DOM construction.
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
const { renderManifestFixedImageRefBar } = await import('./fixedImageRefBar.js');

async function renderBar({ id, model, sources, edges }) {
  const nodes = { [id]: { id, type: 'ai-image', model, provider: 'runninghub' } };
  for (const [key, value] of Object.entries(sources)) {
    nodes[key] = { id: key, type: 'source-image', ...value };
  }
  const state = { selectedNodeIds: [id], pickConnectMode: {}, nodes, edges };
  const module = createAIGenerateNodeStateSyncModule({
    store: {
      getState: () => state,
      getStateRaw: () => state,
      getIncomingEdges: (target) => Object.values(edges).filter((edge) => edge.targetId === target),
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
    nodeId: id,
    _data: nodes[id],
    refBarEl: refBarEl,
    _refThumbObjectUrls: new Map(),
    promptEl: { innerText: '', querySelectorAll: () => [] },
  });
  await module._renderRefBarImpl.call(host);
  return refBarEl;
}

test('manifest fixed slots: main + style render as two slots and no extra slot', async () => {
  const refBarEl = await renderBar({
    id: 'node-mj-v7',
    model: 'runninghub-model/youchuan-v7',
    sources: {
      mainImage: {
        thumbLocalPath: 'output/main-thumb.png',
        displayLocalPath: 'output/main-display.png',
        originalLocalPath: 'output/main.png',
      },
      styleImage: {
        thumbLocalPath: 'output/style-thumb.png',
        displayLocalPath: 'output/style-display.png',
        originalLocalPath: 'output/style.png',
      },
    },
    edges: {
      edgeMain: { id: 'edgeMain', sourceId: 'mainImage', targetId: 'node-mj-v7', refSlot: 'imageUrl' },
      edgeStyle: { id: 'edgeStyle', sourceId: 'styleImage', targetId: 'node-mj-v7', refSlot: 'sref' },
    },
  });

  assert.ok(refBarEl.querySelector('.prompt-attachment-btn'), 'attach button rendered');
  const main = refBarEl.querySelector('[data-ref-slot="imageUrl"]');
  const style = refBarEl.querySelector('[data-ref-slot="sref"]');
  assert.equal(main.dataset.edgeId, 'edgeMain');
  assert.equal(main.dataset.kind, 'image');
  assert.equal(style.dataset.edgeId, 'edgeStyle');
  assert.equal(refBarEl.querySelector('[data-ref-slot="cref"]'), null);
  const slots = refBarEl.querySelectorAll('.ref-thumb-wrap');
  assert.ok(slots.length >= 2, 'at least the two bound slots exist');
  assert.ok(main.querySelector('.ref-thumb-delete'), 'bound main slot has a delete button');
  assert.ok(style.querySelector('.ref-thumb-delete'), 'bound style slot has a delete button');
});

test('manifest fixed slots: a single-slot manifest renders only that slot', async () => {
  const refBarEl = await renderBar({
    id: 'node-rh-x',
    model: 'runninghub-model/rhart-image-g',
    sources: {
      refImage: {
        thumbLocalPath: 'output/ref-thumb.png',
        displayLocalPath: 'output/ref-display.png',
        originalLocalPath: 'output/ref.png',
      },
    },
    edges: {
      edgeRef: { id: 'edgeRef', sourceId: 'refImage', targetId: 'node-rh-x', refSlot: 'imageUrl' },
    },
  });

  const main = refBarEl.querySelector('[data-ref-slot="imageUrl"]');
  assert.equal(main.dataset.edgeId, 'edgeRef');
  assert.equal(main.dataset.kind, 'image');
  assert.equal(refBarEl.querySelector('[data-ref-slot="sref"]'), null);
  assert.ok(main.querySelector('.ref-thumb-delete'), 'bound slot has a delete button');
});

test('manifest fixed slots: builder reports whether it handled the bar', () => {
  const makeArgs = (fixedInputConfig) => ({
    owner: { _lastRefHTML: '', _syncBtnIconState() {} },
    refBarEl: document.createElement('div'),
    promptEl: { innerText: '', querySelectorAll: () => [] },
    attachBtnHTML: '',
    fixedInputConfig,
    items: new Map(),
    targetNodeData: {},
    sourceIdToLabel: {},
    store: {},
    nodeId: 'n1',
    ensureThumbDecoded() {},
    revealRefThumbMedia() {},
    syncPillLabels() {},
  });

  // No image slot in the manifest -> not handled (must return false so the caller falls through).
  const emptyArgs = makeArgs({ visibleSlots: [], slotKindById: {} });
  assert.equal(renderManifestFixedImageRefBar(emptyArgs), false);
  assert.equal(emptyArgs.refBarEl.classList.contains('rh-v5-refbar'), false);

  // An image slot -> handled (true) and the bar is marked as the Rh fixed-image bar.
  const handledArgs = makeArgs({
    visibleSlots: ['imageUrl'],
    slotKindById: { imageUrl: 'image' },
    slotLabels: {},
    slotTitleById: {},
  });
  assert.equal(renderManifestFixedImageRefBar(handledArgs), true);
  assert.ok(handledArgs.refBarEl.classList.contains('rh-v5-refbar'));
});

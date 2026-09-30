import test from 'node:test';
import assert from 'node:assert/strict';
import { createRendererDeferredMediaController } from './rendererDeferredMedia.js';
import { createNodeDetailHydrationController } from './rendererNodeDetailHydration.js';
import { createRendererMediaPresentationCoordinator } from './rendererMediaPresentationCoordinator.js';

function clock() {
  const saved = { window: globalThis.window, request: globalThis.requestIdleCallback, cancel: globalThis.cancelIdleCallback };
  const callbacks = new Map(); let sequence = 0;
  const request = callback => { callbacks.set(++sequence, callback); return sequence; };
  const cancel = id => callbacks.delete(id);
  globalThis.window = { requestIdleCallback: request, cancelIdleCallback: cancel };
  globalThis.requestIdleCallback = request; globalThis.cancelIdleCallback = cancel;
  return {
    callbacks,
    tick() { const batch = [...callbacks.values()]; callbacks.clear(); batch.forEach(callback => callback({ didTimeout: true })); },
    restore() {
      for (const [name, value] of [['window', saved.window], ['requestIdleCallback', saved.request], ['cancelIdleCallback', saved.cancel]]) {
        if (value === undefined) delete globalThis[name]; else globalThis[name] = value;
      }
    },
  };
}

test('media pause cancels pending work and retains its queue until resume', () => {
  const timer = clock(), hydrated = [];
  const controller = createRendererDeferredMediaController({ getComponent: id => ({ hydrateDeferredMedia: () => hydrated.push(id) }) });
  try {
    controller.enqueue('one'); assert.equal(timer.callbacks.size, 1);
    controller.pause(); assert.equal(timer.callbacks.size, 0);
    controller.enqueue('two'); controller.flush();
    assert.deepEqual(hydrated, []); assert.equal(controller.getQueuedCount(), 2);
    controller.resume(); timer.tick();
    assert.deepEqual(hydrated, ['one','two']); assert.equal(controller.getQueuedCount(), 0);
  } finally { controller.clear(); timer.restore(); }
});
test('node detail pause preserves deferred state and resumes on canvas return', () => {
  const timer = clock(), classes = new Set(), hydrated = [];
  const wrapper = { isConnected: true, dataset: {}, classList: { contains: key => classes.has(key), add: key => classes.add(key), remove: key => classes.delete(key) } };
  const controller = createNodeDetailHydrationController({ getWrapper: () => wrapper, isMounted: () => true, onHydrateNodeDetails: id => hydrated.push(id) });
  try {
    controller.syncNodeDetailMountStage({ wrapperEl: wrapper, node: { id: 'one', type: 'source-image' }, nodeId: 'one', viewport: { zoom: 0.1 } });
    controller.pause(); assert.equal(timer.callbacks.size, 0); timer.tick(); assert.deepEqual(hydrated, []);
    assert.equal(wrapper.dataset.detailStage, 'deferred');
    controller.resumeNodeDetailHydration(); timer.tick();
    assert.deepEqual(hydrated, ['one']); assert.equal(wrapper.dataset.detailStage, 'hydrated');
  } finally { controller.clearNodeDetailHydrationState(); timer.restore(); }
});
test('the real media coordinator supports mode suspension and restoration', () => {
  const controller = createRendererMediaPresentationCoordinator({ preview: {}, previewRelease: { schedule() {}, forget() {}, clear() {} }, videoSlots: {} });
  assert.doesNotThrow(() => { controller.pause(); controller.resume(); controller.clear(); });
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  VIEWPORT_INTERACTION_CLASSES,
  isRendererInteractionBusy,
  readViewportInteractionState,
} from './viewportInteractionState.js';

const makeDocument = (classes = []) => ({
  body: {
    classList: {
      contains: (className) => classes.includes(className),
    },
  },
});

const makeBareDocument = (classList) => ({ body: { classList: classList } });

test('exposes the frozen body-class catalog', () => {
  assert.equal(Object.isFrozen(VIEWPORT_INTERACTION_CLASSES), true);
  assert.deepEqual(VIEWPORT_INTERACTION_CLASSES, {
    panning: 'is-panning',
    zooming: 'is-zooming',
    viewportAnimating: 'is-viewport-animating',
  });
});

test('an idle document reports nothing busy', () => {
  const state = readViewportInteractionState({ documentRef: makeDocument() });
  assert.deepEqual(state, {
    isPanning: false,
    isZooming: false,
    isViewportAnimating: false,
    isViewportBusy: false,
  });
  assert.deepEqual(Object.keys(state), ['isPanning', 'isZooming', 'isViewportAnimating', 'isViewportBusy']);
});

test('body classes are reflected one flag at a time', () => {
  const panning = readViewportInteractionState({ documentRef: makeDocument(['is-panning']) });
  assert.equal(panning.isPanning, true);
  assert.equal(panning.isViewportBusy, true);
  const zooming = readViewportInteractionState({ documentRef: makeDocument(['is-zooming']) });
  assert.equal(zooming.isZooming, true);
  assert.equal(zooming.isPanning, false);
  assert.equal(zooming.isViewportBusy, true);
  const animating = readViewportInteractionState({ documentRef: makeDocument(['is-viewport-animating']) });
  assert.equal(animating.isViewportAnimating, true);
  assert.equal(animating.isZooming, false);
  assert.equal(animating.isViewportBusy, true);
});

test('all body classes at once keep the busy flag true', () => {
  const state = readViewportInteractionState({
    documentRef: makeDocument(['is-panning', 'is-zooming', 'is-viewport-animating']),
  });
  assert.equal(state.isPanning, true);
  assert.equal(state.isZooming, true);
  assert.equal(state.isViewportAnimating, true);
  assert.equal(state.isViewportBusy, true);
});

test('unrelated body classes are ignored', () => {
  const state = readViewportInteractionState({ documentRef: makeDocument(['is-panning-extra', 'dark']) });
  assert.deepEqual(state, {
    isPanning: false,
    isZooming: false,
    isViewportAnimating: false,
    isViewportBusy: false,
  });
});

test('interaction flags contribute to panning only', () => {
  const viaFlag = readViewportInteractionState({
    documentRef: makeDocument(),
    interactionState: { isPanning: true },
  });
  assert.equal(viaFlag.isPanning, true);
  assert.equal(viaFlag.isZooming, false);
  assert.equal(viaFlag.isViewportAnimating, false);

  const viaAssist = readViewportInteractionState({
    documentRef: makeDocument(),
    interactionState: { assistPanActive: true },
  });
  assert.equal(viaAssist.isPanning, true);
  assert.equal(viaAssist.isViewportBusy, true);
});

test('interaction zoom and animating flags are ignored', () => {
  const state = readViewportInteractionState({
    documentRef: makeDocument(),
    interactionState: { isZooming: true, isViewportAnimating: true, isDragging: true },
  });
  assert.equal(state.isZooming, false);
  assert.equal(state.isViewportAnimating, false);
  assert.equal(state.isViewportBusy, false);
});

test('pan preview and pending pan freeze both count as panning', () => {
  const preview = readViewportInteractionState({ documentRef: makeDocument(), panPreviewActive: true });
  assert.equal(preview.isPanning, true);
  assert.equal(preview.isViewportBusy, true);
  const pending = readViewportInteractionState({
    documentRef: makeDocument(),
    pendingPanFreezeActive: true,
  });
  assert.equal(pending.isPanning, true);
  assert.equal(pending.isViewportBusy, true);
});

test('falsy pan sources leave the state idle', () => {
  const state = readViewportInteractionState({
    documentRef: makeDocument(),
    interactionState: { isPanning: false, assistPanActive: false },
    panPreviewActive: false,
    pendingPanFreezeActive: false,
  });
  assert.equal(state.isViewportBusy, false);
});

test('a missing document reference is tolerated', () => {
  for (const documentRef of [undefined, null, {}, { body: null }, { body: {} }]) {
    const state = readViewportInteractionState({ documentRef: documentRef });
    assert.deepEqual(state, {
      isPanning: false,
      isZooming: false,
      isViewportAnimating: false,
      isViewportBusy: false,
    });
  }
});

test('a classList without contains is tolerated', () => {
  const state = readViewportInteractionState({ documentRef: makeBareDocument({}) });
  assert.equal(state.isViewportBusy, false);
});

test('a missing interaction state is tolerated', () => {
  const state = readViewportInteractionState({
    documentRef: makeDocument(['is-panning']),
    interactionState: null,
  });
  assert.equal(state.isPanning, true);
});

test('isRendererInteractionBusy short-circuits on each busy flag', () => {
  for (const flag of ['isDragging', 'isConnecting', 'isBoxSelecting', 'isDraggingCell']) {
    assert.equal(
      isRendererInteractionBusy({ documentRef: makeDocument(), interactionState: { [flag]: true } }),
      true,
      `flag ${flag} must mark the renderer busy`,
    );
  }
});

test('isRendererInteractionBusy requires a strict boolean true', () => {
  for (const value of [1, 'true', {}, [], 'x']) {
    assert.equal(
      isRendererInteractionBusy({ documentRef: makeDocument(), interactionState: { isDragging: value } }),
      false,
      `value ${JSON.stringify(value)} must not mark the renderer busy`,
    );
  }
});

test('isRendererInteractionBusy ignores unrelated interaction flags', () => {
  assert.equal(
    isRendererInteractionBusy({
      documentRef: makeDocument(),
      interactionState: { dragInProgress: true, someOtherFlag: true },
    }),
    false,
  );
});

test('isRendererInteractionBusy still honours pan sources outside the flag list', () => {
  assert.equal(
    isRendererInteractionBusy({
      documentRef: makeDocument(),
      interactionState: { isPanning: true },
    }),
    true,
  );
});

test('isRendererInteractionBusy falls back to the viewport state', () => {
  assert.equal(isRendererInteractionBusy({ documentRef: makeDocument(['is-panning']) }), true);
  assert.equal(isRendererInteractionBusy({ documentRef: makeDocument(['is-zooming']) }), true);
  assert.equal(isRendererInteractionBusy({ documentRef: makeDocument(['is-viewport-animating']) }), true);
  assert.equal(isRendererInteractionBusy({ documentRef: makeDocument() }), false);
});

test('a busy interaction flag wins over an idle body', () => {
  assert.equal(
    isRendererInteractionBusy({
      documentRef: makeDocument(),
      interactionState: { isDraggingCell: true },
    }),
    true,
  );
});

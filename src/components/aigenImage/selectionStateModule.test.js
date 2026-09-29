import test from 'node:test';
import assert from 'node:assert/strict';

import { createAIGenerateNodeSelectionStateModule } from './selectionStateModule.js';

function createSelectionState(store = {}) {
  const prototype = createAIGenerateNodeSelectionStateModule({ store });
  const subject = Object.create(prototype);
  subject.nodeId = 'node-1';
  subject._rendererMediaDeferred = false;
  subject._data = {};
  let renders = 0;
  subject._renderRefBar = () => {
    renders += 1;
  };
  return {
    subject,
    get renders() {
      return renders;
    },
  };
}

test('selectionStateModule: keeps the ref bar pending while hidden or deferred', () => {
  const state = createSelectionState({
    getStateRaw: () => ({ pickConnectMode: { active: false } }),
  });

  assert.equal(state.subject.syncSelectionState({ selected: false, visible: false }), false);
  assert.equal(state.subject._renderRefBarPendingWhenVisible, true);
  assert.equal(state.renders, 0);

  state.subject._rendererMediaDeferred = true;
  assert.equal(state.subject.syncSelectionState({ selected: true, visible: true }), false);
  assert.equal(state.subject._renderRefBarPendingWhenVisible, true);
  assert.equal(state.renders, 0);
});

test('selectionStateModule: renders once when selected and then skips duplicate syncs', () => {
  const state = createSelectionState({
    getStateRaw: () => ({ pickConnectMode: { active: false } }),
  });
  state.subject._renderRefBarPendingWhenVisible = true;

  assert.equal(state.subject.syncSelectionState({ selected: true, visible: true }), true);
  assert.equal(state.subject._renderRefBarPendingWhenVisible, false);
  assert.equal(state.renders, 1);

  assert.equal(state.subject.syncSelectionState({ selected: true, visible: true }), false);
  assert.equal(state.renders, 1);
});

test('selectionStateModule: a matching connect-mode source can trigger the ref bar', () => {
  const state = createSelectionState({
    getState: () => ({
      pickConnectMode: { active: true, sourceNodeId: 'node-1' },
    }),
  });
  state.subject._renderRefBarPendingWhenVisible = true;

  assert.equal(state.subject.syncSelectionState({ selected: false, visible: true }), true);
  assert.equal(state.renders, 1);
});

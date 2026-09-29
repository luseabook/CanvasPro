import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState } from './legacyInitialState.js';
import { WORKSPACE_STATE_KEYS } from './domainSlices.js';
import { WORKSPACE_ACTION_NAMES, createWorkspaceStore } from './workspaceStore.js';

test('workspaceStore: exposes model catalog and storyboard 3D actions', () => {
  const calls = [];
  const coreStore = {
    subscribe: () => () => {},
    subscribeRaw: () => () => {},
    subscribeSelector: () => () => {},
    getState: () => ({}),
    getStateRaw: () => ({}),
    setModelCatalogState: (state) => calls.push(['modelCatalog', state]),
    upsertStoryboard3DProject: (project) => calls.push(['upsert', project]),
    deleteStoryboard3DProject: (id) => calls.push(['delete', id]),
  };
  const store = createWorkspaceStore(coreStore);

  assert.equal(typeof store.setModelCatalogState, 'function');
  assert.equal(typeof store.upsertStoryboard3DProject, 'function');
  assert.equal(typeof store.deleteStoryboard3DProject, 'function');

  store.setModelCatalogState({ status: 'ready' });
  store.upsertStoryboard3DProject({ id: 'project-1' });
  store.deleteStoryboard3DProject('project-1');

  assert.deepEqual(calls, [
    ['modelCatalog', { status: 'ready' }],
    ['upsert', { id: 'project-1' }],
    ['delete', 'project-1'],
  ]);
});

test('workspaceStore: selects model catalog and storyboard 3D project state', () => {
  const state = {
    ...createInitialState(),
    nodes: { excluded: true },
    modelCatalog: { status: 'ready', modelCount: 3 },
    storyboard3dProjects: [{ id: 'project-1' }],
  };
  const store = createWorkspaceStore({
    subscribe: () => () => {},
    subscribeRaw: () => () => {},
    subscribeSelector: () => () => {},
    getState: () => state,
    getStateRaw: () => state,
  });

  assert.deepEqual(store.getState(), {
    subscription: state.subscription,
    modelCatalog: state.modelCatalog,
    assets: state.assets,
    storyboard3dProjects: state.storyboard3dProjects,
    workflows: state.workflows,
    workflowUi: state.workflowUi,
  });
  assert.deepEqual(WORKSPACE_STATE_KEYS, [
    'subscription',
    'modelCatalog',
    'assets',
    'storyboard3dProjects',
    'workflows',
    'workflowUi',
  ]);
  assert.equal(WORKSPACE_ACTION_NAMES.includes('setModelCatalogState'), true);
  assert.equal(WORKSPACE_ACTION_NAMES.includes('upsertStoryboard3DProject'), true);
  assert.equal(WORKSPACE_ACTION_NAMES.includes('deleteStoryboard3DProject'), true);
});

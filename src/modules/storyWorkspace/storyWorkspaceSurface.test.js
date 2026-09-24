import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REPLICATION_WORKSPACE_MODE,
  getStoryProjectWorkspaceMode,
  getStorySurfaceProjects,
  selectStoryWorkspaceSurface,
} from './storyWorkspaceSurface.js';

test('projects are split between story and replication surfaces', () => {
  assert.equal(REPLICATION_WORKSPACE_MODE, 'replication');
  assert.equal(getStoryProjectWorkspaceMode({ sourceMode: 'video-replication' }), 'replication');
  assert.equal(getStoryProjectWorkspaceMode(), 'story');
  const projects = [
    { id: 'a', data: { project: {} } },
    { id: 'b', data: { project: { sourceMode: 'video-replication' } } },
    { id: 'c' },
  ];
  assert.deepEqual(
    getStorySurfaceProjects({ projects }).map((item) => item.id),
    ['a', 'c'],
  );
  assert.deepEqual(
    getStorySurfaceProjects({ projects, workspaceSurface: 'replication' }).map((item) => item.id),
    ['b'],
  );
  assert.deepEqual(getStorySurfaceProjects({}), []);
});

test('switching surfaces remembers and restores the story view', () => {
  const state = {
    workspaceSurface: 'story',
    data: { project: { id: 'p1' } },
    view: 'project',
    step: 2,
    homeTab: 'generate',
    projectSearchQuery: 'q',
    pendingDeleteProjectId: 'd',
    openProjectMenuId: 'm',
  };
  assert.equal(selectStoryWorkspaceSurface(state, 'replication'), true);
  assert.deepEqual(state.workspaceSurfaceViews, { story: { projectId: 'p1', view: 'project', step: 2 } });
  assert.equal(state.workspaceSurface, 'replication');
  assert.equal(state.homeTab, 'replication');
  assert.equal(state.view, 'home');
  assert.deepEqual(
    [state.projectSearchQuery, state.pendingDeleteProjectId, state.openProjectMenuId],
    ['', '', ''],
  );
  state.step = 0;
  assert.equal(selectStoryWorkspaceSurface(state, 'story'), true);
  assert.equal(state.homeTab, 'generate');
  assert.equal(state.view, 'project');
  assert.equal(state.step, 2);
});

test('reselecting the same surface changes nothing and unknown surfaces mean story', () => {
  const state = {
    workspaceSurface: 'story',
    data: { project: { id: 'p1' } },
    view: 'episode',
    step: 3,
    homeTab: 'upload',
    projectSearchQuery: 'q',
  };
  assert.equal(selectStoryWorkspaceSurface(state, 'anything'), false);
  assert.equal(state.workspaceSurface, 'story');
  assert.equal(state.view, 'episode');
  assert.equal(state.homeTab, 'upload');
  assert.equal(state.projectSearchQuery, 'q');
  const replication = {
    workspaceSurface: 'story',
    data: { project: { id: 'r1', sourceMode: 'video-replication' } },
    view: 'home',
  };
  selectStoryWorkspaceSurface(replication, 'replication');
  assert.deepEqual(replication.workspaceSurfaceViews, {});
  assert.equal(replication.view, 'home');
});

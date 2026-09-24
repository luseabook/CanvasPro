import test from 'node:test';
import assert from 'node:assert/strict';
import { openStoryProjectPage } from './storyProjectNavigation.js';

function open(state, canEnterStep = () => true, options) {
  const renders = [];
  openStoryProjectPage({ state, canEnterStep, render: (payload) => renders.push(payload) }, options);
  return renders;
}

test('opening a project shows the project view and renders forward', () => {
  const state = { view: 'home', step: 2, data: { project: {} } };
  assert.deepEqual(open(state), [{ direction: 'forward' }]);
  assert.equal(state.view, 'project');
  assert.equal(state.step, 2);
});

test('restoreView keeps project and episode views that are still reachable', () => {
  const episode = { view: 'episode', step: 3, data: { project: {} } };
  open(episode, () => true, { restoreView: true });
  assert.equal(episode.view, 'episode');
  const home = { view: 'home', step: 1, data: { project: {} } };
  open(home, () => true, { restoreView: true });
  assert.equal(home.view, 'project');
  const locked = { view: 'episode', step: 2, data: { project: {} } };
  open(locked, (data, step) => step < 3, { restoreView: true });
  assert.equal(locked.view, 'project');
  assert.equal(locked.step, 2);
});

test('the step resets on request, stale outlines or unreachable steps', () => {
  const writing = { view: 'project', step: 3, data: { project: { collaboration: { stage: 'writing' } } } };
  open(writing, () => true, { resetStep: true });
  assert.equal(writing.step, 0);
  const stale = { view: 'project', step: 2, data: { project: { outlineStatus: 'stale' } } };
  open(stale);
  assert.equal(stale.step, 1);
  const staleAtZero = { view: 'project', step: 0, data: { project: { outlineStatus: 'stale' } } };
  open(staleAtZero);
  assert.equal(staleAtZero.step, 0);
  const unreachable = { view: 'project', step: 4, data: { project: {} } };
  open(unreachable, (data, step) => step !== 4);
  assert.equal(unreachable.step, 1);
});

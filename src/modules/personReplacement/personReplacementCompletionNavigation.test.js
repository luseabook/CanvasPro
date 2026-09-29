import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersonReplacementCompletionNavigation } from './personReplacementCompletionNavigation.js';

function harness(overrides = {}) {
  const calls = { toasts: [], openProject: [], setProject: [], showProject: 0 };
  const project = overrides.project || { id: 'p-1', workspace: { step: 1, keep: 'x' }, title: 'T' };
  const navigate = createPersonReplacementCompletionNavigation({
    getProject: () => (overrides.getProject ? overrides.getProject(project) : project),
    getProjects: () => overrides.projects || [{ id: 'p-1' }, { id: 'p-2' }],
    openProject: (id) => {
      calls.openProject.push(id);
      return overrides.openProjectResult === undefined ? true : overrides.openProjectResult;
    },
    setProject: (next) => calls.setProject.push(next),
    showProject: () => {
      calls.showProject += 1;
    },
    showToast: (message, tone) => calls.toasts.push([message, tone]),
  });
  return { navigate, calls, project };
}

test('createPersonReplacementCompletionNavigation rejects an empty project id', () => {
  const { navigate, calls } = harness();
  assert.equal(navigate({ projectId: '   ' }), false);
  assert.deepEqual(calls.toasts, []);
  assert.deepEqual(calls.openProject, []);
  assert.deepEqual(calls.setProject, []);
});

test('createPersonReplacementCompletionNavigation stays on the current project without opening it', () => {
  const { navigate, calls, project } = harness();
  assert.equal(navigate({ projectId: 'p-1', step: 3 }), true);
  assert.deepEqual(calls.openProject, []);
  assert.equal(calls.showProject, 1);
  assert.equal(calls.setProject.length, 1);
  assert.equal(calls.setProject[0].workspace.step, 3);
  assert.equal(calls.setProject[0].workspace.keep, 'x');
  assert.equal(calls.setProject[0].title, 'T');
  assert.equal(project.workspace.step, 1);
});

test('createPersonReplacementCompletionNavigation clamps the step between one and five', () => {
  for (const [input, expected] of [
    [0, 1],
    [-4, 1],
    [9, 5],
    [3.9, 3],
    ['2', 2],
    [undefined, 1],
    [NaN, 1],
  ]) {
    const { navigate, calls } = harness();
    navigate({ projectId: 'p-1', step: input });
    assert.equal(calls.setProject[0].workspace.step, expected, `step ${String(input)}`);
  }
});

test('createPersonReplacementCompletionNavigation warns when the target project is gone', () => {
  const { navigate, calls } = harness({
    project: { id: 'p-1' },
    projects: [{ id: 'p-1' }],
  });
  assert.equal(navigate({ projectId: 'p-9' }), false);
  assert.deepEqual(calls.toasts, [['对应的替换工作室项目已不存在。', 'warn']]);
  assert.deepEqual(calls.openProject, []);
  assert.deepEqual(calls.setProject, []);
  assert.equal(calls.showProject, 0);
});

test('createPersonReplacementCompletionNavigation stops when opening the project fails', () => {
  const { navigate, calls } = harness({ project: { id: 'p-1' }, openProjectResult: false });
  assert.equal(navigate({ projectId: 'p-2' }), false);
  assert.deepEqual(calls.openProject, ['p-2']);
  assert.deepEqual(calls.setProject, []);
  assert.equal(calls.showProject, 0);
});

test('createPersonReplacementCompletionNavigation opens the project then applies the step', () => {
  let current = { id: 'p-1', workspace: { step: 1 } };
  const calls = { openProject: [], setProject: [], showProject: 0, toasts: [] };
  const navigate = createPersonReplacementCompletionNavigation({
    getProject: () => {
      if (calls.openProject.length && current.id !== 'p-2') current = { id: 'p-2', workspace: { step: 1 } };
      return { ...current };
    },
    getProjects: () => [{ id: 'p-1' }, { id: 'p-2' }],
    openProject: (id) => {
      calls.openProject.push(id);
      return true;
    },
    setProject: (next) => calls.setProject.push(next),
    showProject: () => {
      calls.showProject += 1;
    },
    showToast: (message, tone) => calls.toasts.push([message, tone]),
  });
  assert.equal(navigate({ projectId: 'p-2', step: 4 }), true);
  assert.deepEqual(calls.openProject, ['p-2']);
  assert.equal(calls.setProject.length, 1);
  assert.equal(calls.setProject[0].id, 'p-2');
  assert.equal(calls.setProject[0].workspace.step, 4);
  assert.equal(calls.showProject, 1);
  assert.deepEqual(calls.toasts, []);
});

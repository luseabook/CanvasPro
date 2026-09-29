import test from 'node:test';
import assert from 'node:assert/strict';

import {
  reversePersonReplacementVideoIteration,
  setPersonReplacementVideoResultAsReference,
} from './personReplacementVideoIteration.js';

function createProject() {
  return {
    id: 'project-a',
    workspace: { selectedShotId: 'shot-b' },
    shots: [
      {
        id: 'shot-a',
        replacementVideo: {
          activeIndex: 0,
          results: [{ videoUrl: 'output/a.mp4' }, { videoUrl: 'output/b.mp4' }],
        },
        resultVideoRef: 'output/a.mp4',
      },
    ],
  };
}

test('personReplacementVideoIteration: selecting a result updates the reference and can clear it', () => {
  const project = createProject();
  const selected = setPersonReplacementVideoResultAsReference(project, {
    shotId: 'shot-a',
    resultIndex: 1,
  });

  assert.equal(selected.changed, true);
  assert.equal(selected.clearedReference, false);
  assert.equal(selected.project.shots[0].resultVideoRef, 'output/b.mp4');
  assert.equal(selected.project.shots[0].videoIterationReferenceRef, 'output/b.mp4');
  assert.equal(selected.project.shots[0].replacementVideo.activeIndex, 1);
  assert.equal(selected.project.workspace.selectedShotId, 'shot-a');

  const cleared = setPersonReplacementVideoResultAsReference(selected.project, {
    shotId: 'shot-a',
    resultIndex: 1,
  });
  assert.equal(cleared.changed, true);
  assert.equal(cleared.clearedReference, true);
  assert.equal(Object.hasOwn(cleared.project.shots[0], 'videoIterationReferenceRef'), false);
});

test('personReplacementVideoIteration: invalid indexes and shots are returned unchanged', () => {
  const project = createProject();
  const result = setPersonReplacementVideoResultAsReference(project, {
    shotId: 'shot-a',
    resultIndex: 9,
  });

  assert.equal(result.changed, false);
  assert.equal(result.project, project);
  assert.equal(
    setPersonReplacementVideoResultAsReference(project, { shotId: 'missing', resultIndex: 0 }).project,
    project,
  );
});

test('personReplacementVideoIteration: reversal guards stale inputs and commits the generated clip', async () => {
  const shot = {
    id: 'shot-a',
    videoIterationReferenceRef: 'output/ref.mp4',
    resultVideoRef: 'output/ref.mp4',
  };
  const project = { id: 'project-a', shots: [shot], workspace: {} };

  assert.throws(
    () =>
      reversePersonReplacementVideoIteration({
        project,
        shot,
        isReversed: true,
        sourceRef: 'output/other.mp4',
        getProject: () => project,
        setProject: () => project,
        enqueueMediaTask: () => Promise.resolve({}),
        resolveMediaRef: () => '',
        isDestroyed: () => false,
      }),
    /参考视频已变化/,
  );

  let setProjectCalled = false;
  const completion = reversePersonReplacementVideoIteration({
    project,
    shot,
    isReversed: true,
    sourceRef: 'output/ref.mp4',
    getProject: () => project,
    setProject: (nextProject) => {
      setProjectCalled = true;
      return nextProject;
    },
    enqueueMediaTask: async (payload, options) => {
      assert.deepEqual(payload, { kind: 'videoReverse', src: 'output/ref.mp4' });
      assert.deepEqual(options, { wait: true, timeout: 600000 });
      return { success: true, localPath: 'output/reversed.mp4' };
    },
    resolveMediaRef: (result) => result.localPath,
    isDestroyed: () => false,
  }).completion;

  const result = await completion;
  assert.equal(result.ok, true);
  assert.equal(setProjectCalled, true);
  assert.equal(result.project.shots[0].videoIterationInputRef, 'output/reversed.mp4');
  assert.equal(result.project.shots[0].videoIterationInputIsReversed, true);

  const stale = await reversePersonReplacementVideoIteration({
    project,
    shot,
    isReversed: true,
    sourceRef: 'output/ref.mp4',
    getProject: () => ({ ...project, id: 'another-project' }),
    setProject: () => {
      throw new Error('stale results must not commit');
    },
    enqueueMediaTask: async () => ({ success: true, localPath: 'output/reversed.mp4' }),
    resolveMediaRef: (item) => item.localPath,
    isDestroyed: () => false,
  }).completion;
  assert.deepEqual(stale, { ok: false, stale: true });

  await assert.rejects(
    reversePersonReplacementVideoIteration({
      project,
      shot,
      isReversed: true,
      sourceRef: 'output/ref.mp4',
      getProject: () => project,
      setProject: () => project,
      enqueueMediaTask: async () => ({ success: false, error: 'reverse failed' }),
      resolveMediaRef: () => '',
      isDestroyed: () => false,
    }).completion,
    /reverse failed/,
  );
});

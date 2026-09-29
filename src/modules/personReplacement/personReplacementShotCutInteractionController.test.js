import test from 'node:test';
import assert from 'node:assert/strict';

import { createPersonReplacementShotCutInteractionController } from './personReplacementShotCutInteractionController.js';

function createDraft() {
  return [
    {
      shotId: 's1',
      sourceId: 'src1',
      startSec: 0,
      endSec: 4,
      durationSec: 4,
      outputFps: 24,
    },
    {
      shotId: 's2',
      sourceId: 'src1',
      startSec: 4,
      endSec: 8,
      durationSec: 4,
      outputFps: 24,
    },
  ];
}

function createHarness(overrides = {}) {
  const draft = overrides.draft || createDraft();
  const state = {
    isOpen: true,
    draft,
    initialDraft: draft.map((shot) => ({ ...shot })),
    undoStack: [],
    playheadSec: 2,
    previewShotId: 's1',
    isSubmitting: '',
    isSmartDetectOpen: false,
    isSmartDetecting: false,
    smartDetectionToken: 0,
    boundaryDrag: null,
    hoverPreviewActive: false,
    hoverPreviewRequest: 0,
    hoverPreviewRaf: 0,
    hoverPreviewTimeSec: null,
    isKeyframeCapturing: false,
    ...overrides.state,
  };
  const calls = {
    actions: null,
    preview: [],
    render: 0,
    toast: [],
    busy: [],
    smartOpen: [],
  };
  const session = {
    workspaceState: state,
    configureActionHandlers(handlers) {
      calls.actions = handlers;
    },
    stopBoundaryDrag() {
      state.boundaryDrag = null;
    },
    setSmartDetectOpen(value) {
      calls.smartOpen.push(value);
    },
    moveBoundary(index, time) {
      const next = state.draft.map((shot) => ({ ...shot }));
      const left = next[index - 1];
      const right = next[index];
      left.endSec = time;
      left.durationSec = time - left.startSec;
      right.startSec = time;
      right.durationSec = right.endSec - time;
      state.draft = next;
      return next;
    },
    resetDraft() {
      state.draft = state.initialDraft.map((shot) => ({ ...shot }));
      return true;
    },
    undo() {
      state.draft = state.initialDraft.map((shot) => ({ ...shot }));
      return true;
    },
  };
  const preview = {
    preview(...args) {
      calls.preview.push(args);
    },
    cancelHoverPreview() {},
    isPlaybackActive() {
      return false;
    },
    seekTimeline() {},
    togglePlayback() {},
    stepTimeline() {},
  };
  const viewport = {
    isDraftMutationBusy() {
      return false;
    },
    syncPlayhead() {},
    commitDraft(nextDraft) {
      state.draft = nextDraft;
      return true;
    },
    toggleSound() {},
    applyTimelineZoom() {},
  };
  const editor = {
    open() {},
    close() {},
    toggleReverse() {},
    captureKeyframeAtPlayhead() {
      return Promise.resolve();
    },
    splitAtPlayhead() {},
    mergeSelected() {},
    syncReverseDraftToProject() {},
  };
  const project = overrides.project || {
    id: 'project-1',
    workspace: { selectedShotId: 's1' },
    settings: { smartClipMode: 'balanced', smartClipFps: 24 },
    shots: [
      { id: 's1', sourceId: 'src1', startTimeSec: 0, endTimeSec: 4 },
      { id: 's2', sourceId: 'src1', startTimeSec: 4, endTimeSec: 8 },
    ],
  };
  const controller = createPersonReplacementShotCutInteractionController({
    session,
    previewController: preview,
    viewportController: viewport,
    editorController: editor,
    getRoot: overrides.getRoot || (() => null),
    getProject: () => project,
    documentObject: overrides.documentObject || {},
    windowObject: {
      showToast(message, kind) {
        calls.toast.push([message, kind]);
      },
      ...overrides.windowObject,
    },
    isDestroyed: overrides.isDestroyed || (() => false),
    requestRender() {
      calls.render += 1;
    },
    onShotCutDetectionRequested: overrides.onShotCutDetectionRequested,
    onShotCutRangesRequested: overrides.onShotCutRangesRequested,
    runRequest: overrides.runRequest,
    updateSmartClipSettings() {
      calls.busy.push('update-smart-clip');
    },
  });
  return { controller, calls, project, state };
}

async function flushMicrotasks() {
  await new Promise((resolve) => setImmediate(resolve));
}

test('personReplacementShotCutInteractionController: validates owners and registers all actions', () => {
  assert.throws(() => createPersonReplacementShotCutInteractionController(), /require a session/);
  assert.throws(
    () =>
      createPersonReplacementShotCutInteractionController({
        session: { workspaceState: {} },
        previewController: {},
        viewportController: {},
      }),
    /preview, viewport, and editor/,
  );

  const { calls } = createHarness();
  assert.deepEqual(Object.keys(calls.actions).sort(), [
    'cancel',
    'captureKeyframe',
    'confirm',
    'confirmSmartDetect',
    'merge',
    'open',
    'preview',
    'reset',
    'setSmartDetectMode',
    'split',
    'step',
    'togglePlayback',
    'toggleReverse',
    'toggleSmartDetect',
    'toggleSound',
    'undo',
    'zoom',
  ]);
});

test('personReplacementShotCutInteractionController: converts pointer positions and applies boundaries', () => {
  const { controller, calls, state } = createHarness();
  const timeline = {
    getBoundingClientRect() {
      return { left: 20, width: 200 };
    },
  };

  assert.equal(controller.getTimelineSecFromPointer({ clientX: 120 }, timeline), 4);
  assert.equal(controller.getTimelineSecFromPointer({ clientX: 999 }, timeline), 8);
  assert.equal(controller.getTimelineSecFromPointer({ clientX: 0 }, null), state.playheadSec);

  assert.equal(controller.applyBoundaryTime(1, 5, { preview: false }), true);
  assert.equal(state.draft[0].endSec, 5);
  assert.equal(state.draft[1].startSec, 5);
  assert.equal(calls.preview.length, 0);
});

test('personReplacementShotCutInteractionController: smart detection commits returned ranges', async () => {
  const ranges = [
    { shotId: 's1', sourceId: 'src1', startSec: 0, endSec: 3, durationSec: 3 },
    { shotId: 's2', sourceId: 'src1', startSec: 3, endSec: 8, durationSec: 5 },
  ];
  let request = null;
  const { controller, calls, state } = createHarness({
    onShotCutDetectionRequested(settings, context) {
      request = { settings, context };
      return Promise.resolve({ ranges });
    },
  });

  assert.equal(controller.runSmartDetection(), true);
  await flushMicrotasks();

  assert.deepEqual(request.settings, { mode: 'balanced', fps: 24 });
  assert.equal(request.context.project.id, 'project-1');
  assert.deepEqual(state.draft, ranges);
  assert.equal(state.isSmartDetecting, false);
  assert.equal(state.previewShotId, 's1');
  assert.deepEqual(calls.preview.at(-1), ['s1', 0, { timelineSec: 0 }]);
  assert.deepEqual(calls.toast.at(-1), ['智能检测完成，已覆盖为 2 个片段。', 'success']);
});

test('personReplacementShotCutInteractionController: failed submission restores the supplied rollback', async () => {
  const rollback = {
    draft: createDraft(),
    undoStack: [{ label: 'before edit' }],
  };
  const { controller, state, calls } = createHarness({
    onShotCutRangesRequested() {
      return Promise.reject(new Error('network unavailable'));
    },
  });
  state.draft = [
    { ...state.draft[0], endSec: 4.5, durationSec: 4.5 },
    { ...state.draft[1], startSec: 4.5, durationSec: 3.5 },
  ];

  assert.equal(controller.submitDraft({ rollback }), true);
  await flushMicrotasks();

  assert.deepEqual(state.draft, rollback.draft);
  assert.deepEqual(state.undoStack, rollback.undoStack);
  assert.equal(state.isSubmitting, false);
  assert.deepEqual(calls.toast.at(-1), ['network unavailable', 'error']);
});

test('personReplacementShotCutInteractionController: reset and undo surface synchronization failures', () => {
  const { controller, calls, state } = createHarness();
  state.isOpen = true;
  const original = state.draft;
  state.initialDraft = original.map((shot) => ({ ...shot }));
  state.draft = original.map((shot) => ({ ...shot }));

  assert.equal(controller.resetDraft(), true);
  assert.equal(controller.undoDraft(), true);
  assert.equal(calls.render >= 2, true);
});

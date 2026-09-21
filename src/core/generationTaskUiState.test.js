import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getTaskMessage,
  isDreaminaTaskTerminal,
  isTaskCancelled,
  isTaskFailed,
  isTaskRunning,
  isTaskTerminal,
  resolveGenerationButtonMode,
  resolveGenerationUiState,
  shouldAllowCancel,
  shouldShowGenerationBusyUi,
  shouldShowGenerationResultLoadingUi,
} from './generationTaskUiState.js';
(test('generationTaskUiState: normalizes legacy running states', () => {
  (assert.equal(resolveGenerationUiState({ isGenerating: true }), 'running'),
    assert.equal(resolveGenerationUiState({ jobStatus: 'running' }), 'running'),
    assert.equal(resolveGenerationUiState({ rhTaskStatus: 'pending' }), 'queued'),
    assert.equal(resolveGenerationUiState({ dreaminaTaskPhase: 'generating' }), 'running'),
    assert.equal(resolveGenerationUiState({ asyncTaskStatus: 'processing' }), 'running'),
    assert.equal(resolveGenerationUiState({}), 'idle'));
}),
  test('generationTaskUiState: recovering is a unified active state', () => {
    (assert.equal(
      resolveGenerationUiState({ rhTaskRecovering: true, rhTaskStatus: 'pending' }),
      'recovering',
    ),
      assert.equal(resolveGenerationUiState({ asyncTaskRecovering: true }), 'recovering'),
      assert.equal(isTaskRunning({ dreaminaTaskRecovering: true }), true),
      assert.equal(isTaskTerminal({ dreaminaTaskRecovering: true }), false));
  }),
  test('generationTaskUiState: terminal priority covers success, error, and cancel', () => {
    (assert.equal(resolveGenerationUiState({ rhTaskStatus: 'success' }), 'success'),
      assert.equal(resolveGenerationUiState({ asyncTaskStatus: 'failed' }), 'error'),
      assert.equal(resolveGenerationUiState({ mediaTaskStatus: 'complete' }), 'success'),
      assert.equal(resolveGenerationUiState({ dreaminaTaskStatus: 'cancelled' }), 'cancelled'),
      assert.equal(isTaskTerminal({ jobStatus: 'success' }), true),
      assert.equal(isTaskFailed({ rhTaskStatus: 'failed' }), true),
      assert.equal(isTaskCancelled({ asyncTaskStatus: 'canceled' }), true));
  }),
  test('generationTaskUiState: failure beats stale running flags', () => {
    const _0x50eebb = { isGenerating: true, jobStatus: 'running', rhTaskStatus: 'failed' };
    (assert.equal(resolveGenerationUiState(_0x50eebb), 'error'),
      assert.equal(isTaskTerminal(_0x50eebb), true),
      assert.equal(isTaskRunning(_0x50eebb), false));
  }),
  test('generationTaskUiState: active task family ignores stale inactive provider fields', () => {
    const _0x376945 = {
      isGenerating: true,
      jobStatus: 'running',
      rhTaskStatus: 'pending',
      dreaminaTaskStatus: 'idle',
      dreaminaTaskPhase: 'done',
      asyncTaskStatus: 'idle',
    };
    (assert.equal(resolveGenerationUiState(_0x376945), 'running'),
      assert.equal(isTaskRunning(_0x376945), true),
      assert.equal(isTaskTerminal(_0x376945), false));
  }),
  test('generationTaskUiState: active provider task ignores stale media terminal state', () => {
    const _0x3d666f = {
      isGenerating: true,
      jobStatus: 'running',
      rhTaskStatus: 'pending',
      mediaTaskStatus: 'complete',
      generationStartTime: 0x3e8,
      generationDuration: null,
    };
    (assert.equal(resolveGenerationUiState(_0x3d666f), 'running'),
      assert.equal(shouldShowGenerationBusyUi(_0x3d666f), true),
      assert.deepEqual(resolveGenerationButtonMode(_0x3d666f, { cancellable: true }), {
        state: 'running',
        busy: true,
        canCancel: true,
        disabled: false,
        cursor: '',
      }));
  }),
  test('generationTaskUiState: Dreamina terminal only reads Dreamina fields', () => {
    (assert.equal(
      isDreaminaTaskTerminal({
        jobStatus: 'success',
        dreaminaTaskStatus: 'pending',
        dreaminaTaskPhase: 'generating',
      }),
      false,
    ),
      assert.equal(isDreaminaTaskTerminal({ dreaminaTaskPhase: 'done' }), true),
      assert.equal(isDreaminaTaskTerminal({ dreaminaTaskStatus: 'failed' }), true));
  }),
  test('generationTaskUiState: task message prefers explicit provider messages', () => {
    (assert.equal(
      getTaskMessage({ rhStatusMessage: 'provider error', dreaminaTaskLabel: 'queued' }),
      'provider error',
    ),
      assert.equal(getTaskMessage({ dreaminaTaskLabel: 'queued' }), 'queued'),
      assert.equal(getTaskMessage({ asyncTaskError: 'async failed' }), 'async failed'),
      assert.equal(getTaskMessage({}), ''));
  }),
  test('generationTaskUiState: button helpers derive busy and cancel state', () => {
    const _0x3618ba = { rhTaskStatus: 'running', rhTaskId: 'rh-1' };
    (assert.equal(shouldShowGenerationBusyUi(_0x3618ba), true),
      assert.equal(shouldAllowCancel(_0x3618ba, { cancellable: true }), true),
      assert.deepEqual(resolveGenerationButtonMode(_0x3618ba, { cancellable: true }), {
        state: 'running',
        busy: true,
        canCancel: true,
        disabled: false,
        cursor: '',
      }),
      assert.deepEqual(resolveGenerationButtonMode(_0x3618ba, { cancellable: true, cancelInFlight: true }), {
        state: 'running',
        busy: true,
        canCancel: false,
        disabled: true,
        cursor: 'var(--unavailable-cursor)',
      }),
      assert.deepEqual(resolveGenerationButtonMode({ jobStatus: 'success' }), {
        state: 'success',
        busy: false,
        canCancel: false,
        disabled: false,
        cursor: '',
      }));
  }),
  test('generationTaskUiState: result loading helper requires active task without result', () => {
    (assert.equal(
      shouldShowGenerationResultLoadingUi({ rhTaskRecovering: true, rhTaskStatus: 'pending' }),
      true,
    ),
      assert.equal(
        shouldShowGenerationResultLoadingUi(
          { rhTaskStatus: 'running', rhTaskId: 'task-1' },
          { hasResult: true },
        ),
        false,
      ),
      assert.equal(
        shouldShowGenerationResultLoadingUi({ isGenerating: true, rhTaskStatus: 'failed' }),
        false,
      ));
  }));

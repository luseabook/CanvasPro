import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_OUTPUT_TRANSITIONS,
  transitionPersonReplacementOutput,
} from './personReplacementOutputLineage.js';

const T = PERSON_REPLACEMENT_OUTPUT_TRANSITIONS;

test('outputLineage: 五个转移类型字面量', () => {
  assert.deepEqual(T, {
    INVALIDATE: 'invalidate',
    FINAL_MUX_INVALIDATE: 'final-mux-invalidate',
    SOURCE_GRAPH_CHANGED: 'source-graph-changed',
    COMPOSITION_SUCCEEDED: 'composition-succeeded',
    FINAL_MUX_SUCCEEDED: 'final-mux-succeeded',
  });
  assert.equal(Object.isFrozen(T), true);
});

test('outputLineage: INVALIDATE 有双母版时仅置 pending 并回到 full 预览，保留母版引用', () => {
  const state = {
    output: {
      originalMasterRef: ' om ',
      visualMasterRef: ' vm ',
      finalVideoRef: 'fv',
      finalAudioTrack: 'original',
      composeStatus: 'succeeded',
      composedShotIds: ['s1'],
    },
    workspace: { compositePreviewMode: 'shot' },
  };
  const next = transitionPersonReplacementOutput(state, { type: 'invalidate' });
  assert.equal(next.output.composeStatus, 'pending');
  assert.equal(next.output.originalMasterRef, ' om ');
  assert.equal(next.output.visualMasterRef, ' vm ');
  assert.equal(next.output.finalVideoRef, 'fv');
  assert.deepEqual(next.output.composedShotIds, ['s1']);
  assert.equal(next.workspace.compositePreviewMode, 'full');
});

test('outputLineage: INVALIDATE 缺失任一母版时清空音频与全部输出引用并回到 shot 预览', () => {
  const onlyOriginal = transitionPersonReplacementOutput(
    { audio: { originalAudioRef: 'a' }, output: { originalMasterRef: 'om' } },
    { type: 'invalidate' },
  );
  assert.deepEqual(onlyOriginal.audio, { originalAudioRef: '' });
  assert.deepEqual(onlyOriginal.output, {
    originalMasterRef: '',
    visualMasterRef: '',
    finalVideoRef: '',
    finalAudioTrack: '',
    composeStatus: 'pending',
    composedShotIds: [],
  });
  assert.equal(onlyOriginal.workspace.compositePreviewMode, 'shot');
});

test('outputLineage: FINAL_MUX_INVALIDATE 只清最终视频与音轨', () => {
  const next = transitionPersonReplacementOutput(
    {
      output: {
        originalMasterRef: 'om',
        visualMasterRef: 'vm',
        finalVideoRef: 'fv',
        finalAudioTrack: 'original',
      },
    },
    { type: 'final-mux-invalidate' },
  );
  assert.deepEqual(next.output, {
    originalMasterRef: 'om',
    visualMasterRef: 'vm',
    finalVideoRef: '',
    finalAudioTrack: '',
  });
  assert.equal(next.workspace, undefined);
});

test('outputLineage: SOURCE_GRAPH_CHANGED 写回新音源、置 pending 或给定状态、清输出', () => {
  const next = transitionPersonReplacementOutput(
    { audio: { originalAudioRef: 'old', other: 1 }, output: { finalVideoRef: 'fv' } },
    { type: 'source-graph-changed', nextOriginalAudioRef: ' new ', composeStatus: 'running' },
  );
  assert.deepEqual(next.audio, { originalAudioRef: 'new', other: 1 });
  assert.equal(next.output.composeStatus, 'running');
  assert.equal(next.output.originalMasterRef, '');
  assert.deepEqual(next.output.composedShotIds, []);
  assert.equal(next.workspace.compositePreviewMode, 'shot');

  const pending = transitionPersonReplacementOutput({}, { type: 'source-graph-changed' });
  assert.equal(pending.output.composeStatus, 'pending');
});

test('outputLineage: COMPOSITION_SUCCEEDED 需双母版，否则抛 TypeError；成功时归一化镜头 id 并完成', () => {
  assert.throws(
    () => transitionPersonReplacementOutput({}, { type: 'composition-succeeded', originalMasterRef: 'om' }),
    { name: 'TypeError', message: 'Replacement Studio composition requires original and visual masters' },
  );
  const next = transitionPersonReplacementOutput(
    { status: 'running', workspace: { compositePreviewMode: 'shot' } },
    {
      type: 'composition-succeeded',
      originalMasterRef: ' om ',
      visualMasterRef: ' vm ',
      composedShotIds: [' s1 ', '', 's2', null],
    },
  );
  assert.equal(next.status, 'completed');
  assert.deepEqual(next.audio.originalAudioRef, 'om');
  assert.equal(next.output.originalMasterRef, 'om');
  assert.equal(next.output.visualMasterRef, 'vm');
  assert.equal(next.output.composeStatus, 'succeeded');
  assert.equal(next.output.finalVideoRef, '');
  assert.deepEqual(next.output.composedShotIds, ['s1', 's2']);
  assert.equal(next.workspace.compositePreviewMode, 'full');

  const noShots = transitionPersonReplacementOutput(
    {},
    { type: 'composition-succeeded', originalMasterRef: 'om', visualMasterRef: 'vm', composedShotIds: 's1' },
  );
  assert.deepEqual(noShots.output.composedShotIds, []);
});

test('outputLineage: FINAL_MUX_SUCCEEDED 音轨仅接受 original/replacement', () => {
  assert.throws(
    () =>
      transitionPersonReplacementOutput(
        {},
        {
          type: 'final-mux-succeeded',
          finalVideoRef: 'fv',
          finalAudioTrack: 'both',
        },
      ),
    { name: 'TypeError', message: 'Replacement Studio final mux requires a video and audio track' },
  );
  assert.throws(
    () =>
      transitionPersonReplacementOutput(
        {},
        {
          type: 'final-mux-succeeded',
          finalVideoRef: '',
          finalAudioTrack: 'original',
        },
      ),
    { name: 'TypeError' },
  );
  const next = transitionPersonReplacementOutput(
    { output: { composeStatus: 'succeeded' } },
    { type: 'final-mux-succeeded', finalVideoRef: ' fv ', finalAudioTrack: 'replacement' },
  );
  assert.deepEqual(next.output, {
    composeStatus: 'succeeded',
    finalVideoRef: 'fv',
    finalAudioTrack: 'replacement',
  });
});

test('outputLineage: 未知转移抛 TypeError，且不修改入参状态', () => {
  assert.throws(() => transitionPersonReplacementOutput({}, { type: 'bogus' }), {
    name: 'TypeError',
    message: 'Unknown Replacement Studio output transition: bogus',
  });
  assert.throws(() => transitionPersonReplacementOutput(undefined, undefined), { name: 'TypeError' });

  const state = {
    audio: { originalAudioRef: 'a' },
    output: { originalMasterRef: 'om', visualMasterRef: 'vm' },
  };
  const before = JSON.parse(JSON.stringify(state));
  transitionPersonReplacementOutput(state, { type: 'invalidate' });
  assert.deepEqual(state, before);
});

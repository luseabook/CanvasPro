import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_VOICE_SOURCE_CLIP_MIN_MS,
  applyAudioVoiceTranslationResults,
  buildAudioVoiceApplySourceClipPatch,
  buildAudioVoicePendingSegmentMerge,
  buildAudioVoiceSplitSourceSegmentDraft,
  buildAudioVoiceTextEditPatch,
  commitAudioVoiceSourceClipEdit,
  isAudioVoicePendingSegmentMergeCurrent,
  mergeAudioVoiceSourceSegments,
  projectAudioVoicePendingSegmentMerges,
  resolveAudioVoiceSourceClipEditBase,
  shouldCloseAudioVoiceEmptyConvertedTextEdit,
} from './audioVoicePanelSegmentEditing.js';

const segment = (over = {}) => ({
  id: 'a',
  startMs: 100,
  endMs: 500,
  sourceText: 'hello',
  targetText: '你好',
  sourceAudioLocalPath: 'data/uploads/a.wav',
  convertedAudioLocalPath: 'output/a.mp3',
  convertedAudioUrl: '/output/a.mp3',
  convertedAudioDuration: 0.4,
  convertedAudioReady: true,
  activeAudio: 'converted',
  status: 'converted',
  ...over,
});

test('audioVoicePanelSegmentEditing: pending merge requires ids and resets converted audio', () => {
  assert.equal(buildAudioVoicePendingSegmentMerge({ id: '' }, { id: 'b' }), null);
  const pending = buildAudioVoicePendingSegmentMerge(
    segment({ sourceText: 'first', targetText: '第一' }),
    segment({ id: 'b', startMs: 200, endMs: 800, sourceText: 'second', targetText: '第二' }),
  );
  assert.equal(pending.currentSegmentId, 'a');
  assert.equal(pending.nextSegmentId, 'b');
  assert.equal(pending.draftSegment.startMs, 100);
  assert.equal(pending.draftSegment.endMs, 800);
  assert.equal(pending.draftSegment.sourceText, 'first second');
  assert.equal(pending.draftSegment.targetText, '第一 第二');
  assert.equal(pending.draftSegment.convertedAudioLocalPath, '');
  assert.equal(pending.draftSegment.convertedAudioUrl, '');
  assert.equal(pending.draftSegment.convertedAudioReady, false);
  assert.equal(pending.draftSegment.activeAudio, 'source');
  assert.equal(pending.draftSegment.status, 'edited');
  const currentFingerprint = JSON.parse(pending.currentFingerprint);
  assert.equal(currentFingerprint.id, 'a');
  assert.equal(currentFingerprint.sourceText, 'first');
  assert.equal(currentFingerprint.targetText, '第一');
  assert.equal(currentFingerprint.convertedAudioReady, true);
});

test('audioVoicePanelSegmentEditing: pending merge projection replaces the first and drops the second', () => {
  const first = segment({ sourceText: 'A' });
  const second = segment({ id: 'b', startMs: 500, endMs: 900, sourceText: 'B' });
  const pending = buildAudioVoicePendingSegmentMerge(first, second);
  assert.equal(isAudioVoicePendingSegmentMergeCurrent(pending, [first, second]), true);
  assert.equal(
    isAudioVoicePendingSegmentMergeCurrent(pending, [{ ...first, sourceText: 'changed' }, second]),
    false,
  );
  assert.deepEqual(projectAudioVoicePendingSegmentMerges([first, second, { id: 'c' }], [pending]), [
    pending.draftSegment,
    { id: 'c' },
  ]);
});

test('audioVoicePanelSegmentEditing: async merge composes normalized source paths and duration', async () => {
  const calls = [];
  const result = await mergeAudioVoiceSourceSegments(
    segment({ startMs: 100, endMs: 500 }),
    segment({ id: 'b', startMs: 200, endMs: 700 }),
    {
      async composeAudio(paths, options) {
        calls.push({ paths, options });
        return { localPath: 'output/merged.wav' };
      },
    },
  );
  assert.deepEqual(calls, [
    {
      paths: ['data/uploads/a.wav', 'data/uploads/a.wav'],
      options: { durationMs: 900 },
    },
  ]);
  assert.equal(result.id, 'a');
  assert.equal(result.startMs, 100);
  assert.equal(result.endMs, 700);
  assert.equal(result.sourceAudioLocalPath, 'output/merged.wav');
  assert.equal(result.sourceAudioUrl, '/output/merged.wav');
  assert.equal(result.sourceClipBaseStartMs, 100);
  assert.equal(result.sourceClipBaseEndMs, 1000);
  assert.equal(result.status, 'edited');
});

test('audioVoicePanelSegmentEditing: merge and commit expose payload errors', async () => {
  await assert.rejects(
    mergeAudioVoiceSourceSegments({}, {}, { composeAudio: async () => ({}) }),
    (error) => error instanceof Error && error.code === 'audioMissing',
  );
  await assert.rejects(commitAudioVoiceSourceClipEdit(segment(), {}), /cutRange is required/);
  await assert.rejects(
    commitAudioVoiceSourceClipEdit(segment(), {
      cutRange: async () => ({}),
      selectionStartMs: 0,
      selectionEndMs: AUDIO_VOICE_SOURCE_CLIP_MIN_MS - 1,
    }),
    (error) => error instanceof Error && error.code === 'sourceClipInvalidSelection',
  );
});

test('audioVoicePanelSegmentEditing: text and translation patches clear converted media', () => {
  assert.deepEqual(buildAudioVoiceTextEditPatch({ sourceText: 'hello', sourceAudioReady: true }, 'hello'), {
    targetText: '',
    convertedAudioLocalPath: '',
    convertedAudioUrl: '',
    convertedAudioDuration: 0,
    convertedAudioReady: false,
    activeAudio: 'source',
    status: 'detected',
    error: '',
    rhTaskId: '',
  });
  assert.equal(buildAudioVoiceTextEditPatch({ sourceText: 'hello' }, 'world').targetText, 'world');
  assert.equal(
    applyAudioVoiceTranslationResults(
      [segment(), segment({ id: 'b' })],
      [{ id: 'a', targetText: '新译文' }],
    )[0].targetText,
    '新译文',
  );
  assert.equal(
    shouldCloseAudioVoiceEmptyConvertedTextEdit(
      { key: 'Backspace' },
      {
        dataset: { audioVoiceTextKind: 'converted' },
        value: '',
      },
    ),
    true,
  );
});

test('audioVoicePanelSegmentEditing: source clip base and split draft preserve the edit timeline', () => {
  const patch = buildAudioVoiceApplySourceClipPatch(
    {},
    {
      startMs: 20,
      endMs: 400,
      localPath: 'data/uploads/clip.wav',
      sourceClipBaseStartMs: 10,
      sourceClipBaseEndMs: 500,
    },
  );
  assert.deepEqual(
    {
      startMs: patch.startMs,
      endMs: patch.endMs,
      sourceUrl: patch.sourceAudioUrl,
      baseStartMs: patch.sourceClipBaseStartMs,
      baseEndMs: patch.sourceClipBaseEndMs,
      ready: patch.sourceAudioReady,
      needsRecut: patch.needsSourceAudioRecut,
    },
    {
      startMs: 20,
      endMs: 400,
      sourceUrl: '/data/uploads/clip.wav',
      baseStartMs: 10,
      baseEndMs: 500,
      ready: true,
      needsRecut: false,
    },
  );
  assert.deepEqual(
    resolveAudioVoiceSourceClipEditBase(
      {
        startMs: 100,
        endMs: 500,
        sourceClipBaseAudioLocalPath: 'data/uploads/base.wav',
        sourceClipBaseStartMs: 20,
        sourceClipBaseEndMs: 620,
      },
      {},
    ),
    {
      localPath: 'data/uploads/base.wav',
      audioUrl: '/data/uploads/base.wav',
      startMs: 20,
      endMs: 620,
      durationMs: 600,
    },
  );
  const split = buildAudioVoiceSplitSourceSegmentDraft(
    segment({ startMs: 0, endMs: 1000, sourceText: 'abcdef', targetText: '123456' }),
    { selectionStartMs: 0, selectionEndMs: 1000, splitAtMs: 400, newSegmentId: 'right' },
  );
  assert.deepEqual(
    split.map(({ id, startMs, endMs, sourceText, targetText, needsSourceAudioRecut }) => ({
      id,
      startMs,
      endMs,
      sourceText,
      targetText,
      needsSourceAudioRecut,
    })),
    [
      { id: 'a', startMs: 0, endMs: 400, sourceText: 'ab', targetText: '12', needsSourceAudioRecut: true },
      {
        id: 'right',
        startMs: 400,
        endMs: 1000,
        sourceText: 'cdef',
        targetText: '3456',
        needsSourceAudioRecut: true,
      },
    ],
  );
  assert.equal(
    buildAudioVoiceSplitSourceSegmentDraft(segment(), {
      selectionStartMs: 0,
      selectionEndMs: 1000,
      splitAtMs: 50,
    }),
    null,
  );
});

test('audioVoicePanelSegmentEditing: commit cuts explicit ranges and stamps each clip base', async () => {
  const calls = [];
  const output = await commitAudioVoiceSourceClipEdit(segment({ startMs: 0, endMs: 1000 }), {
    selectionStartMs: 100,
    selectionEndMs: 900,
    rangesMs: [
      { id: 'left', startMs: 100, endMs: 450 },
      { id: 'right', startMs: 450, endMs: 900 },
    ],
    newSegmentId: 'right',
    async cutRange(range) {
      calls.push(range);
      return { localPath: `output/${range.startMs}.wav` };
    },
  });
  assert.deepEqual(calls, [
    { startMs: 100, endMs: 450 },
    { startMs: 450, endMs: 900 },
  ]);
  assert.deepEqual(
    output.map(
      ({ id, startMs, endMs, sourceAudioLocalPath, sourceClipBaseStartMs, sourceClipBaseEndMs }) => ({
        id,
        startMs,
        endMs,
        sourceAudioLocalPath,
        sourceClipBaseStartMs,
        sourceClipBaseEndMs,
      }),
    ),
    [
      {
        id: 'a',
        startMs: 100,
        endMs: 450,
        sourceAudioLocalPath: 'output/100.wav',
        sourceClipBaseStartMs: 100,
        sourceClipBaseEndMs: 450,
      },
      {
        id: 'right',
        startMs: 450,
        endMs: 900,
        sourceAudioLocalPath: 'output/450.wav',
        sourceClipBaseStartMs: 450,
        sourceClipBaseEndMs: 900,
      },
    ],
  );
});

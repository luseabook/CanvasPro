import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPersonReplacementVoiceSeparationRevision,
  isPersonReplacementVoiceSeparationActive,
  normalizePersonReplacementVoiceSeparationState,
  normalizePersonReplacementVoiceSeparationsBySourceId,
  resolvePersonReplacementVoiceInput,
  resolvePersonReplacementVoiceSeparationState,
  updatePersonReplacementVoiceSeparationState,
} from './personReplacementVoiceSeparationState.js';

const EMPTY_STATE = {
  sourceId: '',
  status: 'idle',
  requestId: '',
  inputRevision: '',
  taskId: '',
  providerProfileId: '',
  startedAt: '',
  completedAt: '',
  vocalsAudioRef: '',
  vocalsAudioUrl: '',
  backgroundAudioRef: '',
  backgroundAudioUrl: '',
  error: '',
};

test('voiceSeparationState: normalize 固定 13 个字符串字段', () => {
  assert.deepEqual(Object.keys(normalizePersonReplacementVoiceSeparationState()), [
    'sourceId',
    'status',
    'requestId',
    'inputRevision',
    'taskId',
    'providerProfileId',
    'startedAt',
    'completedAt',
    'vocalsAudioRef',
    'vocalsAudioUrl',
    'backgroundAudioRef',
    'backgroundAudioUrl',
    'error',
  ]);
  assert.deepEqual(normalizePersonReplacementVoiceSeparationState(), EMPTY_STATE);
  assert.deepEqual(normalizePersonReplacementVoiceSeparationState(null), EMPTY_STATE);
  assert.deepEqual(normalizePersonReplacementVoiceSeparationState('running'), EMPTY_STATE);
  assert.deepEqual(normalizePersonReplacementVoiceSeparationState(7), EMPTY_STATE);
  assert.deepEqual(
    normalizePersonReplacementVoiceSeparationState([1, 2]),
    EMPTY_STATE,
    '数组按对象处理但无有效字段',
  );
  assert.deepEqual(
    normalizePersonReplacementVoiceSeparationState({
      sourceId: ' s1 ',
      status: ' RUNNING ',
      requestId: ' r ',
      inputRevision: ' i ',
      taskId: ' t ',
      providerProfileId: ' p ',
      startedAt: 1700000000000,
      completedAt: ' c ',
      vocalsAudioRef: ' output/v.mp3 ',
      vocalsAudioUrl: ' /v.mp3 ',
      backgroundAudioRef: ' output/b.mp3 ',
      backgroundAudioUrl: ' /b.mp3 ',
      error: ' e ',
    }),
    {
      sourceId: 's1',
      status: 'running',
      requestId: 'r',
      inputRevision: 'i',
      taskId: 't',
      providerProfileId: 'p',
      startedAt: '1700000000000',
      completedAt: 'c',
      vocalsAudioRef: 'output/v.mp3',
      vocalsAudioUrl: '/v.mp3',
      backgroundAudioRef: 'output/b.mp3',
      backgroundAudioUrl: '/b.mp3',
      error: 'e',
    },
    '时间戳保留字符串形态',
  );
  const state = { status: 'running', taskId: 't' };
  normalizePersonReplacementVoiceSeparationState(state);
  assert.deepEqual(state, { status: 'running', taskId: 't' }, '入参未被改动');
});

test('voiceSeparationState: status 白名单含 cancelled', () => {
  for (const status of ['idle', 'submitting', 'running', 'succeeded', 'failed', 'cancelled']) {
    assert.equal(normalizePersonReplacementVoiceSeparationState({ status }).status, status, status);
  }
  for (const status of ['canceled', 'queued', 'done', '', 0, null, undefined, 'running-ish']) {
    assert.equal(normalizePersonReplacementVoiceSeparationState({ status }).status, 'idle', String(status));
  }
  assert.equal(normalizePersonReplacementVoiceSeparationState({ status: ' CANCELLED ' }).status, 'cancelled');
});

test('voiceSeparationState: normalizeBySourceId 用键兜底 sourceId 并丢弃空键', () => {
  const result = normalizePersonReplacementVoiceSeparationsBySourceId({
    ' s1 ': { status: 'running', taskId: ' t1 ' },
    s2: { status: 'failed' },
    s3: { status: 'queued', sourceId: 'inner' },
    '   ': { status: 'idle' },
    s4: null,
    '': { status: 'failed' },
  });
  assert.deepEqual(Object.keys(result), ['s1', 's2', 's3', 's4']);
  assert.equal(result.s1.sourceId, 's1', '存储键被归一化');
  assert.equal(result.s1.taskId, 't1');
  assert.equal(result.s2.status, 'failed');
  assert.equal(result.s3.status, 'idle', 'queued 不是分离状态');
  assert.equal(result.s3.sourceId, 's3', '键优先于记录内 sourceId');
  assert.deepEqual(result.s4, { ...EMPTY_STATE, sourceId: 's4' }, 'null 值仅保留键');
  assert.deepEqual(normalizePersonReplacementVoiceSeparationsBySourceId(), {});
  assert.deepEqual(normalizePersonReplacementVoiceSeparationsBySourceId(null), {});
  assert.deepEqual(normalizePersonReplacementVoiceSeparationsBySourceId('nope'), {});
  assert.deepEqual(normalizePersonReplacementVoiceSeparationsBySourceId([1, 2]), {});
  assert.deepEqual(
    Object.keys(normalizePersonReplacementVoiceSeparationsBySourceId({ 1: { status: 'running' } })),
    ['1'],
  );
});

test('voiceSeparationState: resolve 从 audio 目录直接取键，不做键归一化', () => {
  const project = {
    audio: {
      voiceSeparationsBySourceId: {
        s1: { status: 'RUNNING', taskId: ' t1 ', sourceId: 'other' },
        ' s2 ': { status: 'failed' },
      },
    },
  };
  const s1 = resolvePersonReplacementVoiceSeparationState(project, ' s1 ');
  assert.equal(s1.status, 'running');
  assert.equal(s1.taskId, 't1');
  assert.equal(s1.sourceId, 's1', '查询键覆盖记录内 sourceId');
  assert.equal(
    resolvePersonReplacementVoiceSeparationState(project, 's2').status,
    'idle',
    '存储键未归一化，查不到',
  );
  assert.deepEqual(resolvePersonReplacementVoiceSeparationState(project, ' s2 '), {
    ...EMPTY_STATE,
    sourceId: 's2',
  });
  assert.deepEqual(resolvePersonReplacementVoiceSeparationState(project, 's3'), {
    ...EMPTY_STATE,
    sourceId: 's3',
  });
  assert.deepEqual(resolvePersonReplacementVoiceSeparationState(), EMPTY_STATE);
  assert.deepEqual(resolvePersonReplacementVoiceSeparationState(undefined, ' s9 '), {
    ...EMPTY_STATE,
    sourceId: 's9',
  });
  assert.deepEqual(resolvePersonReplacementVoiceSeparationState({ audio: null }, 's1'), {
    ...EMPTY_STATE,
    sourceId: 's1',
  });
  assert.deepEqual(
    resolvePersonReplacementVoiceSeparationState({ audio: { voiceSeparationsBySourceId: 'nope' } }, 's1'),
    { ...EMPTY_STATE, sourceId: 's1' },
  );
});

test('voiceSeparationState: update 无 sourceId 原样返回，有则写顶层 store', () => {
  const project = {
    id: 'p1',
    audio: { voiceSeparationsBySourceId: { s1: { status: 'running', taskId: 't1' } } },
  };
  const snapshot = JSON.stringify(project);
  assert.equal(updatePersonReplacementVoiceSeparationState(project, {}), project, '无 sourceId 原引用返回');
  assert.equal(updatePersonReplacementVoiceSeparationState(project, { status: 'running' }), project);
  const next = updatePersonReplacementVoiceSeparationState(project, {
    sourceId: ' s2 ',
    status: 'submitting',
    inputRevision: 'r2',
  });
  assert.equal(next.voiceSeparationsBySourceId.s2.sourceId, 's2');
  assert.equal(next.voiceSeparationsBySourceId.s2.status, 'submitting');
  assert.equal(next.voiceSeparationsBySourceId.s2.inputRevision, 'r2');
  assert.deepEqual(Object.keys(next.voiceSeparationsBySourceId), ['s2'], '读取的是 project 顶层 store');
  assert.equal(next.audio.voiceSeparationsBySourceId.s1.status, 'running', 'audio 目录未被写入');
  assert.equal('s2' in next.audio.voiceSeparationsBySourceId, false);
  assert.equal(next.id, 'p1');
  assert.equal(JSON.stringify(project), snapshot, '入参未被改动');

  const chained = updatePersonReplacementVoiceSeparationState(next, { sourceId: 's3', status: 'failed' });
  assert.deepEqual(Object.keys(chained.voiceSeparationsBySourceId).sort(), ['s2', 's3'], '连续更新累积');
  assert.equal(chained.voiceSeparationsBySourceId.s2.status, 'submitting');

  const numeric = updatePersonReplacementVoiceSeparationState(project, { sourceId: 0, status: 'idle' });
  assert.equal('0' in numeric.voiceSeparationsBySourceId, true, '数字 0 归一成 "0"');
  assert.deepEqual(
    updatePersonReplacementVoiceSeparationState(undefined, { sourceId: 's1', status: 'queued' }),
    {
      voiceSeparationsBySourceId: { s1: { ...EMPTY_STATE, sourceId: 's1' } },
    },
  );
});

test('voiceSeparationState: isActive 只认 submitting/running 且拒绝字符串入参', () => {
  for (const status of ['submitting', 'running', ' SUBMITTING ', 'Running']) {
    assert.equal(isPersonReplacementVoiceSeparationActive({ status }), true, String(status));
  }
  for (const status of ['idle', 'succeeded', 'failed', 'cancelled', 'queued', '', null, undefined, 1]) {
    assert.equal(isPersonReplacementVoiceSeparationActive({ status }), false, String(status));
  }
  assert.equal(isPersonReplacementVoiceSeparationActive(), false);
  assert.equal(isPersonReplacementVoiceSeparationActive({}), false);
  assert.equal(isPersonReplacementVoiceSeparationActive(null), false);
  assert.equal(isPersonReplacementVoiceSeparationActive('running'), false, '字符串直接入参不认');
});

test('voiceSeparationState: resolveInput 在干净人声与原片之间选择媒体', () => {
  const base = {
    sources: [
      { id: ' s1 ', videoRef: ' output/a.mp4 ' },
      { id: 's2', videoRef: 'output/b.mp4' },
    ],
    audio: {
      voiceSeparationsBySourceId: {
        s1: { status: 'succeeded', vocalsAudioRef: ' data/uploads/v.mp3 ' },
        s2: { status: 'succeeded', vocalsAudioUrl: '/custom/v.mp3' },
        s3: { status: 'idle' },
      },
    },
  };
  const s1 = resolvePersonReplacementVoiceInput(base, 's1');
  assert.equal(s1.kind, 'clean-vocals');
  assert.equal(s1.mediaRef, 'data/uploads/v.mp3');
  assert.equal(s1.audioUrl, '/data/uploads/v.mp3', 'ref 转成本地 URL');
  assert.equal(s1.separation.status, 'succeeded');
  assert.equal(s1.separation.sourceId, 's1');
  assert.equal(s1.source.id, ' s1 ', 'source 原样返回');

  const s2 = resolvePersonReplacementVoiceInput(base, ' s2 ');
  assert.equal(s2.kind, 'clean-vocals');
  assert.equal(s2.mediaRef, '/custom/v.mp3', '无 ref 时用 url 兜底 mediaRef');
  assert.equal(s2.audioUrl, '/custom/v.mp3', 'audioUrl 优先 url 字段');
  assert.equal(s2.source.videoRef, 'output/b.mp4');

  const s3 = resolvePersonReplacementVoiceInput(base, 's3');
  assert.equal(s3.kind, 'original-video');
  assert.equal(s3.mediaRef, '');
  assert.equal(s3.audioUrl, '');
  assert.deepEqual(s3.separation, { ...EMPTY_STATE, sourceId: 's3' });

  const s4 = resolvePersonReplacementVoiceInput(base, 's4');
  assert.equal(s4.kind, 'original-video');
  assert.equal(s4.mediaRef, '');
  assert.equal(s4.source, undefined, '找不到源镜头');

  const both = resolvePersonReplacementVoiceInput(
    {
      audio: {
        voiceSeparationsBySourceId: {
          s1: { vocalsAudioRef: 'data/uploads/v.mp3', vocalsAudioUrl: '/x/v.mp3' },
        },
      },
    },
    's1',
  );
  assert.equal(both.mediaRef, 'data/uploads/v.mp3', 'ref 优先做 mediaRef');
  assert.equal(both.audioUrl, '/x/v.mp3', 'url 优先做 audioUrl');
  assert.equal(both.source, undefined);

  const blob = resolvePersonReplacementVoiceInput(
    { audio: { voiceSeparationsBySourceId: { s1: { vocalsAudioRef: 'blob:x' } } } },
    's1',
  );
  assert.equal(blob.kind, 'clean-vocals', '不可落地的 ref 仍算干净人声');
  assert.equal(blob.mediaRef, 'blob:x');
  assert.equal(blob.audioUrl, 'blob:x');

  assert.deepEqual(resolvePersonReplacementVoiceInput(), {
    kind: 'original-video',
    mediaRef: '',
    audioUrl: '',
    separation: EMPTY_STATE,
    source: undefined,
  });
  assert.deepEqual(resolvePersonReplacementVoiceInput({ sources: 'nope', audio: null }, 's1'), {
    kind: 'original-video',
    mediaRef: '',
    audioUrl: '',
    separation: { ...EMPTY_STATE, sourceId: 's1' },
    source: undefined,
  });
});

test('voiceSeparationState: revision 只含 projectId/sourceId/videoRef', () => {
  assert.equal(
    createPersonReplacementVoiceSeparationRevision(),
    '{"projectId":"","sourceId":"","videoRef":""}',
  );
  assert.equal(
    createPersonReplacementVoiceSeparationRevision({
      project: { id: ' p1 ' },
      source: { id: ' s1 ', videoRef: ' output/a.mp4 ', extra: 'x' },
    }),
    '{"projectId":"p1","sourceId":"s1","videoRef":"output/a.mp4"}',
  );
  const revision = createPersonReplacementVoiceSeparationRevision({
    project: { id: 'p1' },
    source: { id: 's1' },
  });
  assert.equal(
    revision,
    createPersonReplacementVoiceSeparationRevision({ project: { id: ' p1 ' }, source: { id: 's1 ' } }),
    '归一化后同一 revision',
  );
  assert.notEqual(
    revision,
    createPersonReplacementVoiceSeparationRevision({ project: { id: 'p2' }, source: { id: 's1' } }),
  );
  assert.notEqual(
    revision,
    createPersonReplacementVoiceSeparationRevision({
      project: { id: 'p1' },
      source: { id: 's1', videoRef: 'output/a.mp4' },
    }),
  );
  assert.equal(revision.includes('output/a.mp4'), false);
});

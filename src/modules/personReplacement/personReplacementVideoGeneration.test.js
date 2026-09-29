import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getRecoverablePersonReplacementVideoTask,
  isPersonReplacementVideoGenerationActive,
  normalizePersonReplacementVideoGenerationState,
  normalizePersonReplacementVideoGenerationsByShotId,
  resolvePersonReplacementVideoGenerationState,
  resolvePersonReplacementVideoGenerationUiRefreshScope,
  updatePersonReplacementVideoGenerationState,
} from './personReplacementVideoGeneration.js';

test('videoGeneration: normalize 固定字段与默认回落', () => {
  const empty = { status: 'idle', shotId: '', error: '' };
  assert.deepEqual(normalizePersonReplacementVideoGenerationState(), empty);
  assert.deepEqual(normalizePersonReplacementVideoGenerationState(undefined, 'ignored'), {
    status: 'idle',
    shotId: 'ignored',
    error: '',
  });
  assert.deepEqual(normalizePersonReplacementVideoGenerationState(null), empty);
  assert.deepEqual(normalizePersonReplacementVideoGenerationState([]), empty);
  assert.deepEqual(normalizePersonReplacementVideoGenerationState('running'), empty, '字符串入参不认');
  assert.deepEqual(normalizePersonReplacementVideoGenerationState({}, ' s1 '), {
    status: 'idle',
    shotId: 's1',
    error: '',
  });
  assert.deepEqual(normalizePersonReplacementVideoGenerationState({ shotId: ' s2 ' }, 's1').shotId, 's2');
  assert.equal(normalizePersonReplacementVideoGenerationState({ shotId: '   ' }, ' s1 ').shotId, 's1');
  assert.equal('requestId' in normalizePersonReplacementVideoGenerationState({ requestId: '   ' }), false);
  assert.equal(normalizePersonReplacementVideoGenerationState({ requestId: ' r1 ' }).requestId, 'r1');
  assert.equal(normalizePersonReplacementVideoGenerationState({ error: ' e ' }).error, 'e');
});

test('videoGeneration: status 白名单与身份字段透传', () => {
  for (const status of [
    'idle',
    'queued',
    'submitting',
    'running',
    'succeeded',
    'failed',
    ' RUNNING ',
    'Running',
  ]) {
    const expected = status.trim().toLowerCase();
    assert.equal(normalizePersonReplacementVideoGenerationState({ status }).status, expected, String(status));
  }
  for (const status of ['canceled', 'cancelled', 'done', '', 0, null, undefined, 'idle-ish', true]) {
    assert.equal(normalizePersonReplacementVideoGenerationState({ status }).status, 'idle', String(status));
  }
  assert.deepEqual(
    normalizePersonReplacementVideoGenerationState({
      status: 'running',
      shotId: ' s1 ',
      error: ' e ',
      requestId: ' req ',
      taskId: ' t ',
      modelId: ' m ',
      provider: ' p ',
      providerProfileId: ' pp ',
      executionId: ' ex ',
      startedAt: 7,
      useOpenapiQuery: true,
      queueIndex: '2',
      queueLength: 5,
    }),
    {
      status: 'running',
      shotId: 's1',
      error: 'e',
      requestId: 'req',
      taskId: 't',
      modelId: 'm',
      provider: 'p',
      providerProfileId: 'pp',
      executionId: 'ex',
      startedAt: 7,
      useOpenapiQuery: true,
      queueIndex: 2,
      queueLength: 5,
    },
  );
  assert.deepEqual(
    normalizePersonReplacementVideoGenerationState({
      status: 'queued',
      taskId: 't',
      modelId: 'm',
      startedAt: 0,
      useOpenapiQuery: 1,
    }),
    { status: 'queued', shotId: '', error: '', taskId: 't', modelId: 'm' },
    'startedAt 必须为正、useOpenapiQuery 必须严格 true',
  );
});

test('videoGeneration: queueIndex/queueLength 仅收有限数，queueLength 需非负', () => {
  assert.equal('queueIndex' in normalizePersonReplacementVideoGenerationState({ queueIndex: NaN }), false);
  assert.equal(
    'queueIndex' in normalizePersonReplacementVideoGenerationState({ queueIndex: Infinity }),
    false,
  );
  assert.equal('queueIndex' in normalizePersonReplacementVideoGenerationState({ queueIndex: 'x' }), false);
  assert.equal(
    'queueIndex' in normalizePersonReplacementVideoGenerationState({ queueIndex: undefined }),
    false,
  );
  assert.equal(
    normalizePersonReplacementVideoGenerationState({ queueIndex: null }).queueIndex,
    0,
    'null 转 0',
  );
  assert.equal(normalizePersonReplacementVideoGenerationState({ queueIndex: '' }).queueIndex, 0, '空串转 0');
  assert.equal(normalizePersonReplacementVideoGenerationState({ queueIndex: 1.5 }).queueIndex, 1.5);
  assert.equal(
    normalizePersonReplacementVideoGenerationState({ queueIndex: '-2' }).queueIndex,
    -2,
    'queueIndex 允许负数',
  );
  assert.equal('queueLength' in normalizePersonReplacementVideoGenerationState({ queueLength: -1 }), false);
  assert.equal('queueLength' in normalizePersonReplacementVideoGenerationState({ queueLength: 'x' }), false);
  assert.equal(normalizePersonReplacementVideoGenerationState({ queueLength: 0 }).queueLength, 0);
  assert.equal(normalizePersonReplacementVideoGenerationState({ queueLength: 2.5 }).queueLength, 2.5);
  assert.equal(
    Object.is(normalizePersonReplacementVideoGenerationState({ queueLength: -0 }).queueLength, -0),
    true,
    '负零被保留',
  );
});

test('videoGeneration: isActive 认 queued/submitting/running（字符串或对象）', () => {
  for (const status of ['queued', 'submitting', 'running', ' Running ', 'QUEUED']) {
    assert.equal(isPersonReplacementVideoGenerationActive(status), true, String(status));
    assert.equal(isPersonReplacementVideoGenerationActive({ status }), true, 'obj ' + String(status));
  }
  for (const status of ['idle', 'succeeded', 'failed', 'cancelled', '', 'run', null, undefined, 1]) {
    assert.equal(isPersonReplacementVideoGenerationActive(status), false, String(status));
  }
  assert.equal(isPersonReplacementVideoGenerationActive({}), false);
  assert.equal(isPersonReplacementVideoGenerationActive(null), false);
});

test('videoGeneration: normalizeByShotId 只保留仍存在的镜头键', () => {
  const result = normalizePersonReplacementVideoGenerationsByShotId(
    {
      s1: { status: 'running', taskId: 't1' },
      s9: { status: 'running' },
      '  ': { status: 'failed' },
      s2: null,
    },
    [{ id: 's1' }, { id: 's2' }, {}, null, { id: '   ' }],
  );
  assert.deepEqual(Object.keys(result), ['s1', 's2']);
  assert.deepEqual(result.s1, { status: 'running', shotId: 's1', error: '', taskId: 't1' });
  assert.deepEqual(result.s2, { status: 'idle', shotId: 's2', error: '' });
  assert.equal('s9' in result, false);
  assert.equal('' in result, false);

  const dedupe = normalizePersonReplacementVideoGenerationsByShotId(
    { s1: { status: 'running' }, ' s1 ': { status: 'failed' } },
    [{ id: 's1' }],
  );
  assert.equal(dedupe.s1.status, 'failed', '归一化同键后者覆盖');

  const withFallback = normalizePersonReplacementVideoGenerationsByShotId(
    { s9: { status: 'running' } },
    [{ id: 's1' }],
    {
      status: 'submitting',
      shotId: 's1',
    },
  );
  assert.deepEqual(withFallback, { s1: { status: 'submitting', shotId: 's1', error: '' } });
  assert.deepEqual(
    normalizePersonReplacementVideoGenerationsByShotId({}, [{ id: 's1' }], {
      status: 'submitting',
      shotId: 's9',
    }),
    {},
    '回落镜头不在清单则丢弃',
  );
  assert.deepEqual(
    normalizePersonReplacementVideoGenerationsByShotId({}, [{ id: 's1' }], { status: 'submitting' }),
    {},
    '回落缺 shotId 则丢弃',
  );
  assert.deepEqual(normalizePersonReplacementVideoGenerationsByShotId(null, null, null), {});
  assert.deepEqual(normalizePersonReplacementVideoGenerationsByShotId([1, 2], [{ id: 's1' }]), {});
  assert.deepEqual(
    normalizePersonReplacementVideoGenerationsByShotId({ s1: { status: 'running' } }, 'nope'),
    {},
  );
  assert.deepEqual(normalizePersonReplacementVideoGenerationsByShotId(undefined), {});
});

test('videoGeneration: resolve 按镜头表 > 全局 > 占位回落', () => {
  const workspace = {
    videoGenerationsByShotId: { s1: { status: 'running', taskId: 't1' }, s2: 'not-object' },
    videoGeneration: { status: 'failed', shotId: 's2', error: ' e ' },
  };
  assert.deepEqual(resolvePersonReplacementVideoGenerationState(workspace, ' s1 '), {
    status: 'running',
    shotId: 's1',
    error: '',
    taskId: 't1',
  });
  assert.deepEqual(resolvePersonReplacementVideoGenerationState(workspace, 's2'), {
    status: 'failed',
    shotId: 's2',
    error: 'e',
  });
  assert.deepEqual(resolvePersonReplacementVideoGenerationState(workspace, 's3'), {
    status: 'idle',
    shotId: 's3',
    error: '',
  });
  assert.deepEqual(resolvePersonReplacementVideoGenerationState(undefined, 's4'), {
    status: 'idle',
    shotId: 's4',
    error: '',
  });
  assert.deepEqual(
    resolvePersonReplacementVideoGenerationState(
      { videoGeneration: { status: 'running', shotId: 's1' } },
      '',
    ),
    { status: 'idle', shotId: '', error: '' },
    '全局镜头 id 与查询键不同则不借出',
  );
  assert.deepEqual(
    resolvePersonReplacementVideoGenerationState({ videoGeneration: { status: 'running', shotId: '' } }, ''),
    { status: 'running', shotId: '', error: '' },
    '空键与无 id 的全局状态互相匹配',
  );
  assert.deepEqual(resolvePersonReplacementVideoGenerationState({}, ' s1 ').shotId, 's1', '查询键被归一化');
});

test('videoGeneration: getRecoverable 需活跃且 taskId/modelId 齐备', () => {
  assert.equal(getRecoverablePersonReplacementVideoTask(), null);
  assert.equal(getRecoverablePersonReplacementVideoTask(null), null);
  assert.equal(getRecoverablePersonReplacementVideoTask({ status: 'running', taskId: 't1' }), null);
  assert.equal(getRecoverablePersonReplacementVideoTask({ status: 'running', modelId: 'm1' }), null);
  assert.equal(
    getRecoverablePersonReplacementVideoTask({ status: 'succeeded', taskId: 't1', modelId: 'm1' }),
    null,
  );
  assert.equal(
    getRecoverablePersonReplacementVideoTask({ status: 'failed', taskId: 't1', modelId: 'm1' }),
    null,
  );
  assert.deepEqual(
    getRecoverablePersonReplacementVideoTask({
      status: ' RUNNING ',
      taskId: ' t1 ',
      modelId: 'm1',
      requestId: ' r1 ',
      providerProfileId: 'pp',
      startedAt: 9,
      queueIndex: 1,
      queueLength: 3,
      shotId: 's1',
      error: 'e',
    }),
    {
      status: 'running',
      taskId: 't1',
      modelId: 'm1',
      providerProfileId: 'pp',
      startedAt: 9,
      requestId: 'r1',
    },
    '丢弃 shotId/queueIndex/queueLength',
  );
  assert.deepEqual(
    getRecoverablePersonReplacementVideoTask({ status: 'queued', taskId: 't1', modelId: 'm1' }),
    {
      status: 'queued',
      taskId: 't1',
      modelId: 'm1',
      requestId: '',
    },
  );
});

test('videoGeneration: update 写入镜头表并决定全局 videoGeneration', () => {
  const workspace = {
    projectId: 'p1',
    videoGeneration: { status: 'running', shotId: 's1', taskId: 't1', modelId: 'm1' },
    videoGenerationsByShotId: { s1: { status: 'running', shotId: 's1', taskId: 't1', modelId: 'm1' } },
  };
  const snapshot = JSON.stringify(workspace);
  const noShot = updatePersonReplacementVideoGenerationState(workspace, {});
  assert.notEqual(noShot, workspace, '无 shotId 时返回浅拷贝');
  assert.deepEqual(noShot, workspace);
  assert.deepEqual(updatePersonReplacementVideoGenerationState(workspace, { status: 'running' }), workspace);
  assert.deepEqual(updatePersonReplacementVideoGenerationState(), {});

  const next = updatePersonReplacementVideoGenerationState(workspace, { shotId: 's2', status: 'succeeded' });
  assert.deepEqual(Object.keys(next).sort(), ['projectId', 'videoGeneration', 'videoGenerationsByShotId']);
  assert.equal(next.videoGenerationsByShotId.s2.status, 'succeeded');
  assert.equal(next.videoGenerationsByShotId.s2.shotId, 's2');
  assert.equal(next.videoGenerationsByShotId.s1.status, 'running', '旧镜头被保留');
  assert.equal(next.videoGeneration.shotId, 's1', '仍有活跃镜头则沿用');
  assert.equal(next.videoGeneration.status, 'running');
  assert.equal(next.projectId, 'p1');
  assert.equal(JSON.stringify(workspace), snapshot, '入参未被改动');

  const active = updatePersonReplacementVideoGenerationState(workspace, {
    shotId: 's2',
    status: 'running',
    taskId: 't2',
    modelId: 'm2',
  });
  assert.equal(active.videoGeneration.shotId, 's2', '新活跃任务抢到全局位');
  assert.equal(active.videoGeneration.taskId, 't2');
  assert.equal(active.videoGenerationsByShotId.s2.taskId, 't2');

  const failed = updatePersonReplacementVideoGenerationState(
    {},
    { shotId: 's2', status: 'failed', error: ' boom ' },
  );
  assert.deepEqual(
    failed.videoGeneration,
    { status: 'failed', shotId: 's2', error: 'boom' },
    '非活跃非 idle 直接落全局',
  );

  const idle = updatePersonReplacementVideoGenerationState({}, { shotId: 's2', status: 'idle' });
  assert.deepEqual(idle.videoGeneration, { status: 'idle', shotId: '', error: '' }, 'idle 时全局回落空状态');
  assert.equal(idle.videoGenerationsByShotId.s2.shotId, 's2');

  const idleWithActive = updatePersonReplacementVideoGenerationState(workspace, {
    shotId: 's2',
    status: 'idle',
  });
  assert.equal(idleWithActive.videoGeneration.shotId, 's1');
  assert.equal(idleWithActive.videoGeneration.status, 'running');

  const rawActive = { status: 'running', shotId: 's9', extra: 'raw' };
  const firstActive = updatePersonReplacementVideoGenerationState(
    { videoGeneration: { status: 'succeeded', shotId: 's9' }, videoGenerationsByShotId: { s9: rawActive } },
    { shotId: 's2', status: 'failed' },
  );
  assert.equal(firstActive.videoGeneration, rawActive, '首个活跃项按原引用回填（未归一化）');
  assert.equal(firstActive.videoGeneration.extra, 'raw');

  const arrayMap = updatePersonReplacementVideoGenerationState(
    { videoGenerationsByShotId: [1, 2] },
    { shotId: 's1', status: 'queued' },
  );
  assert.deepEqual(Object.keys(arrayMap.videoGenerationsByShotId), ['s1']);
  assert.equal(arrayMap.videoGenerationsByShotId.s1.status, 'queued');
  assert.deepEqual(
    updatePersonReplacementVideoGenerationState({ videoGenerationsByShotId: null }, {}),
    { videoGenerationsByShotId: null },
    '无 shotId 时原样浅拷贝，不补全局字段',
  );
});

test('videoGeneration: UI 刷新范围按选中镜头与时间线Revision分流', () => {
  const base = {
    shots: [
      { id: 's1', videoRef: 'output/a.mp4', generationStatus: 'succeeded' },
      { id: 's2', videoRef: 'output/b.mp4' },
    ],
    workspace: { selectedShotId: 's1', videoGeneration: { status: 'idle' } },
  };
  const clone = () => JSON.parse(JSON.stringify(base));
  assert.equal(resolvePersonReplacementVideoGenerationUiRefreshScope(base, clone()), '');
  assert.equal(resolvePersonReplacementVideoGenerationUiRefreshScope(), '');
  assert.equal(resolvePersonReplacementVideoGenerationUiRefreshScope({}, {}), '');
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope({ shots: 'nope' }, { shots: 'nope' }),
    '',
  );
  assert.equal(resolvePersonReplacementVideoGenerationUiRefreshScope({ shots: [] }, undefined), '');

  const selectedShotChanged = clone();
  selectedShotChanged.shots[0].videoRef = 'output/a2.mp4';
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, selectedShotChanged),
    'selected-shot',
  );

  const selectedFlagChanged = clone();
  selectedFlagChanged.shots[0].generationStatus = 'failed';
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, selectedFlagChanged),
    'selected-shot',
  );

  const otherShotChanged = clone();
  otherShotChanged.shots[1].videoRef = 'output/b2.mp4';
  assert.equal(resolvePersonReplacementVideoGenerationUiRefreshScope(base, otherShotChanged), 'timeline');

  const reordered = clone();
  reordered.shots = [reordered.shots[1], reordered.shots[0]];
  assert.equal(resolvePersonReplacementVideoGenerationUiRefreshScope(base, reordered), 'timeline');

  const untouchedExtra = clone();
  untouchedExtra.shots[0].unknownField = 'x';
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, untouchedExtra),
    '',
    '未跟踪字段不触发刷新',
  );

  const selectedGenerationChanged = clone();
  selectedGenerationChanged.workspace.videoGenerationsByShotId = { s1: { status: 'running', taskId: 't1' } };
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, selectedGenerationChanged),
    'selected-shot',
  );

  const otherGenerationChanged = clone();
  otherGenerationChanged.workspace.videoGenerationsByShotId = { s2: { status: 'running' } };
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, otherGenerationChanged),
    'timeline',
  );

  const swappedSelection = clone();
  swappedSelection.workspace.selectedShotId = 's2';
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, swappedSelection),
    '',
    '仅切换选中镜头不算刷新',
  );

  const globalGenerationChanged = clone();
  globalGenerationChanged.workspace.videoGeneration = { status: 'running', shotId: 's1' };
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, globalGenerationChanged),
    'selected-shot',
  );

  const globalGenerationForOther = clone();
  globalGenerationForOther.workspace.videoGeneration = { status: 'running', shotId: 's2' };
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, globalGenerationForOther),
    'timeline',
  );

  const reversedTruthy = clone();
  reversedTruthy.shots[0].isReversed = 1;
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, reversedTruthy),
    '',
    '非严格 true 视为 false',
  );
  const reversedStrict = clone();
  reversedStrict.shots[0].isReversed = true;
  assert.equal(resolvePersonReplacementVideoGenerationUiRefreshScope(base, reversedStrict), 'selected-shot');
  const materializedStrict = clone();
  materializedStrict.shots[0].materializedIsReversed = true;
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(base, materializedStrict),
    'selected-shot',
  );

  const numericRef = clone();
  numericRef.shots[0].videoRef = 0;
  const stringRef = clone();
  stringRef.shots[0].videoRef = '0';
  assert.equal(
    resolvePersonReplacementVideoGenerationUiRefreshScope(numericRef, stringRef),
    '',
    '引用统一按字符串归一',
  );
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  recordPersonReplacementDetectionFailure,
  getPersonReplacementDetectionFeedback,
} from './personReplacementDetectionFeedback.js';

const DEFAULT_REASON = '错误详情未保留，请用原视频新建项目重试。';

test('detectionFeedback: 记录失败时透传诊断字段且返回 undefined', () => {
  const calls = [];
  const error = new Error('boom');
  const shot = { id: 'shot-1', sourceId: 'src-1', keyframeRef: 'kf-1', extra: 'ignored' };
  const snapshot = structuredClone(shot);
  const ret = recordPersonReplacementDetectionFailure(shot, error, (payload) => {
    calls.push(payload);
    return 'ignored-return';
  });
  assert.equal(ret, undefined);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    type: 'person_replacement.detection_failed',
    level: 'error',
    message: 'boom',
    error,
    context: { shotId: 'shot-1', sourceId: 'src-1', hasKeyframe: true },
  });
  assert.equal(calls[0].error, error);
  assert.deepEqual(Object.keys(calls[0]), ['type', 'level', 'message', 'error', 'context']);
  assert.deepEqual(Object.keys(calls[0].context), ['shotId', 'sourceId', 'hasKeyframe']);
  assert.deepEqual(shot, snapshot);
});

test('detectionFeedback: 消息回退到默认文案，空格消息不 trim', () => {
  const capture = (error) => {
    const calls = [];
    recordPersonReplacementDetectionFailure({ id: 's' }, error, (payload) => calls.push(payload));
    return calls[0];
  };
  for (const error of [undefined, null, '', 0, false, 'boom-string', {}]) {
    const payload = capture(error);
    assert.equal(payload.message, '人物检测失败', String(error));
    assert.equal(payload.error, error, String(error));
  }
  assert.equal(capture({ message: '   ' }).message, '   ');
  assert.equal(capture({ message: 0 }).message, '人物检测失败');
  assert.equal(capture({ message: '超时' }).message, '超时');
  assert.equal(capture({ message: ' 超时 ' }).message, ' 超时 ');
});

test('detectionFeedback: hasKeyframe 取真值、shot 字段原样透传', () => {
  const capture = (shot) => {
    const calls = [];
    recordPersonReplacementDetectionFailure(shot, new Error('e'), (payload) => calls.push(payload));
    return calls[0].context;
  };
  for (const keyframeRef of [undefined, null, '', 0, false, NaN]) {
    assert.equal(capture({ keyframeRef }).hasKeyframe, false, String(keyframeRef));
  }
  for (const keyframeRef of ['kf', 1, {}, []]) {
    assert.equal(capture({ keyframeRef }).hasKeyframe, true, String(keyframeRef));
  }
  assert.deepEqual(capture({}), { shotId: undefined, sourceId: undefined, hasKeyframe: false });
  assert.deepEqual(capture({ id: ' s1 ', sourceId: ' x ' }), {
    shotId: ' s1 ',
    sourceId: ' x ',
    hasKeyframe: false,
  });
});

test('detectionFeedback: 失败镜头优先，消息含总数与失败数', () => {
  const shots = [
    { analysisStatus: 'failed', error: '模型超时' },
    { analysisStatus: 'done', people: [{}] },
    { analysisStatus: 'failed' },
  ];
  const feedback = getPersonReplacementDetectionFeedback(shots, 3);
  assert.deepEqual(feedback, {
    level: 'error',
    message: '3 个镜头已处理，但 2 个镜头人物检测失败。模型超时 请在设置中生成诊断包。',
  });
  assert.deepEqual(getPersonReplacementDetectionFeedback([{ analysisStatus: 'failed', error: '' }], 0), {
    level: 'error',
    message: '1 个镜头已处理，但 1 个镜头人物检测失败。' + DEFAULT_REASON + ' 请在设置中生成诊断包。',
  });
  assert.deepEqual(getPersonReplacementDetectionFeedback([{ analysisStatus: 'failed', error: 0 }], 0), {
    level: 'error',
    message: '1 个镜头已处理，但 1 个镜头人物检测失败。' + DEFAULT_REASON + ' 请在设置中生成诊断包。',
  });
  // 失败分支压过 warn/success，即使有人物
  assert.equal(
    getPersonReplacementDetectionFeedback([{ analysisStatus: 'failed', error: 'e' }, { people: [{}] }], 9)
      .level,
    'error',
  );
});

test('detectionFeedback: analysisStatus 严格等于 failed 才计入', () => {
  for (const analysisStatus of [
    'Failed',
    'FAILED',
    ' failed',
    'failed ',
    'error',
    undefined,
    null,
    0,
    false,
  ]) {
    const feedback = getPersonReplacementDetectionFeedback([{ analysisStatus, people: [{}] }], 1);
    assert.equal(feedback.level, 'success', String(analysisStatus));
  }
  assert.equal(getPersonReplacementDetectionFeedback([{ analysisStatus: 'failed' }], 1).level, 'error');
});

test('detectionFeedback: 无失败时按是否检测到人物分 warn / success', () => {
  const warnMessage = (n) => '视频处理完成，共 ' + n + ' 个镜头，未检测到人物，可手动框选主体。';
  const successMessage = (n, count) => '视频处理完成，共 ' + n + ' 个镜头、' + count + ' 个主要人物。';
  assert.deepEqual(getPersonReplacementDetectionFeedback([{ analysisStatus: 'done' }], 0), {
    level: 'warn',
    message: warnMessage(1),
  });
  assert.deepEqual(getPersonReplacementDetectionFeedback([], 0), { level: 'warn', message: warnMessage(0) });
  assert.deepEqual(getPersonReplacementDetectionFeedback([{ people: [] }, { people: null }, {}], 0), {
    level: 'warn',
    message: warnMessage(3),
  });
  assert.deepEqual(getPersonReplacementDetectionFeedback([{ people: [{}] }, {}], 2), {
    level: 'success',
    message: successMessage(2, 2),
  });
  // people 只要带 length 就算“检测到”
  assert.equal(getPersonReplacementDetectionFeedback([{ people: 'x' }], 1).level, 'success');
  assert.equal(getPersonReplacementDetectionFeedback([{ people: { length: 1 } }], 1).level, 'success');
});

test('detectionFeedback: 人物数原样拼接（默认值不回落）', () => {
  const message = (count) => getPersonReplacementDetectionFeedback([{ people: [{}] }], count).message;
  assert.equal(message(2), '视频处理完成，共 1 个镜头、2 个主要人物。');
  assert.equal(message(0), '视频处理完成，共 1 个镜头、0 个主要人物。');
  assert.equal(message(undefined), '视频处理完成，共 1 个镜头、undefined 个主要人物。');
  assert.equal(message(null), '视频处理完成，共 1 个镜头、null 个主要人物。');
  assert.equal(message('三'), '视频处理完成，共 1 个镜头、三 个主要人物。');
  assert.equal(message(NaN), '视频处理完成，共 1 个镜头、NaN 个主要人物。');
});

test('detectionFeedback: 反馈对象仅含 level/message 且不改动入参', () => {
  const shots = [{ analysisStatus: 'failed', error: 'e' }, { people: [{}] }];
  const snapshot = structuredClone(shots);
  for (const count of [0, 5]) {
    const feedback = getPersonReplacementDetectionFeedback(shots, count);
    assert.deepEqual(Object.keys(feedback), ['level', 'message'], String(count));
    assert.equal(typeof feedback.message, 'string', String(count));
  }
  assert.deepEqual(shots, snapshot);
});

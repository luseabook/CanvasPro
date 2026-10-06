import test from 'node:test';
import assert from 'node:assert/strict';
import {
  flowObservationPrompt,
  flowReviewPrompt,
  flowSpeechRecoveryPrompt,
  flowRepairPrompt,
  flowVerifyPrompt,
} from './storyReplicationFlowPrompts.js';

const LEDGER = {
  characters: [{ id: 'c1', name: '甲' }],
  shots: [
    { id: 's1', startSec: 0, endSec: 3 },
    { id: 's2', startSec: 3, endSec: 6 },
  ],
  speech: [
    { id: 'v1', startSec: 1, endSec: 2 },
    { id: 'v2', startSec: 4, endSec: 5 },
  ],
};

test('every prompt builder returns a systemPrompt/prompt pair of strings', () => {
  const results = [
    flowObservationPrompt({ durationSec: 10 }),
    flowReviewPrompt([], [], {}),
    flowSpeechRecoveryPrompt(LEDGER, 10),
    flowRepairPrompt(LEDGER, [], []),
    flowVerifyPrompt(LEDGER, [], []),
  ];
  for (const result of results) {
    assert.deepEqual(Object.keys(result), ['systemPrompt', 'prompt']);
    assert.equal(typeof result.systemPrompt, 'string');
    assert.equal(typeof result.prompt, 'string');
    assert.ok(result.systemPrompt.length > 0 && result.prompt.length > 0);
  }
});

test('observation prompt embeds the duration and the JSON format', () => {
  const { systemPrompt, prompt } = flowObservationPrompt({ durationSec: 30 });
  assert.ok(systemPrompt.startsWith('忠实读取原视频'));
  const lines = prompt.split('\n');
  assert.ok(lines[0].startsWith('反推所附 30 秒视频。'));
  assert.ok(lines[0].includes('shots 从0连续到30，'));
  assert.ok(lines.at(-1).startsWith('格式：{"videoObserved":true'));
  assert.equal(prompt.includes('切镜候选'), false);
  assert.equal(prompt.includes('上次结构校验未通过'), false);
});

test('observation prompt adds cut hints and a one-shot correction when provided', () => {
  const { prompt } = flowObservationPrompt({
    durationSec: 12,
    cutHints: [3.2, 7],
    invalid: { shots: [] },
    error: 'shots 不连续',
  });
  assert.ok(prompt.includes('自动检测的切镜候选仅供参考，可纠正误检：[3.2,7]'));
  assert.ok(prompt.includes('上次结构校验未通过：shots 不连续。'));
  assert.ok(prompt.endsWith('上次结果：{"shots":[]}'));
});

test('observation prompt requires an options object', () => {
  assert.throws(() => flowObservationPrompt(), TypeError);
});

test('review prompt embeds the window map, assigned records and ledger', () => {
  const ledger = [{ id: 's1' }];
  const windows = [{ sourceStartSec: 0, sourceEndSec: 10 }];
  const assigned = { s9: 'window-2' };
  const { prompt } = flowReviewPrompt(ledger, windows, assigned);
  // 0.8.0 起窗口映射与分配改为附件传递，prompt 不再内联 windows / assigned 的 JSON
  assert.ok(prompt.startsWith('附件为原片的局部窗口'));
  assert.ok(prompt.includes('本窗口待检查台账：'));
  assert.ok(prompt.includes(JSON.stringify(ledger[0])));
});

test('speech recovery prompt embeds duration and known characters', () => {
  const { prompt } = flowSpeechRecoveryPrompt(LEDGER, 42);
  assert.ok(prompt.startsWith('原片42秒。'));
  assert.ok(prompt.includes(JSON.stringify(LEDGER.characters)));
  assert.ok(prompt.includes('不能超过42。'));
});

test('repair prompt only exposes records referenced by the issues', () => {
  const issues = [{ id: 'i1', sourceIds: ['s2', 'v1'], startSec: 1, endSec: 6 }];
  const windows = [{ sourceStartSec: 0, sourceEndSec: 6 }];
  const { prompt } = flowRepairPrompt(LEDGER, issues, windows);
  assert.ok(prompt.startsWith('以下记录和疑点的startSec/endSec均为附件视频秒数'));
  // 0.8.0 起记录与疑点会按窗口做时间投影（本夹具未提供窗口归属，投影后时间为 null），
  // 因此按 id 校验原意图：只列出疑点引用的记录，未引用的不出现。
  const records = prompt.slice(prompt.indexOf('可修改记录：'), prompt.indexOf('\n疑点：'));
  assert.ok(records.includes('"id":"s2"'));
  assert.ok(records.includes('"id":"v1"'));
  assert.ok(!records.includes('"id":"s1"'));
  assert.ok(!records.includes('"id":"v2"'));
  const doubt = prompt.slice(prompt.indexOf('\n疑点：'));
  assert.ok(doubt.includes('"id":"i1"'));
});

test('verify prompt keeps only records overlapping the mapped windows', () => {
  const candidate = {
    characters: [{ id: 'c1' }],
    shots: [
      { id: 'a', startSec: 0, endSec: 10 },
      { id: 'b', startSec: 5, endSec: 11 },
      { id: 'c', startSec: 19.5, endSec: 25 },
      { id: 'd', startSec: 20, endSec: 30 },
    ],
    speech: [{ id: 'v', startSec: 12, endSec: 13 }],
  };
  const issues = [{ id: 'i1' }];
  const windows = [{ sourceStartSec: 10, sourceEndSec: 20 }];
  const { prompt } = flowVerifyPrompt(candidate, issues, windows);
  assert.ok(prompt.startsWith('以下记录及疑点均使用附件视频秒数'));
  // 疑点经窗口投影后会改写时间字段，故只按 id 校验；人物列表原样保留
  assert.ok(prompt.includes('\n人物：' + JSON.stringify(candidate.characters)));
  assert.ok(prompt.includes('疑点：'));
  assert.ok(
    prompt.includes('\n候选及邻近上下文（'),
  );
  // 时间经窗口投影后为 null，按 id 校验「只保留与窗口重叠的记录」这一意图
  const context = prompt.slice(prompt.indexOf('\n候选及邻近上下文（'));
  assert.ok(context.includes('"id":"b"'));
  assert.ok(context.includes('"id":"c"'));
  assert.ok(!context.includes('"id":"a"'));
  assert.ok(!context.includes('"id":"d"'));
  assert.ok(context.includes('"id":"v"'));
});

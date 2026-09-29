import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAudioVoiceGenerationCompletionMessage,
  notifyAudioVoiceGenerationComplete,
  summarizeAudioVoiceGenerationResults,
} from './audioVoicePanelGenerationFeedback.js';

test('audioVoicePanelGenerationFeedback: 汇总只把 fulfilled 且成功的结果算成功', () => {
  assert.deepEqual(summarizeAudioVoiceGenerationResults(), { total: 0, succeeded: 0, incomplete: 0 });
  assert.deepEqual(
    summarizeAudioVoiceGenerationResults(
      [
        { status: 'fulfilled', value: { status: 'success' } },
        { status: 'fulfilled', value: {} },
        { status: 'fulfilled', value: { status: '  SUCESS  ' } },
        { status: 'fulfilled', value: { status: 'failed' } },
        { status: 'rejected', value: { status: 'success' } },
        null,
      ],
      6,
    ),
    { total: 6, succeeded: 2, incomplete: 4 },
  );
});

test('audioVoicePanelGenerationFeedback: 总数取实际条数与入参的较大值，且不接受负数', () => {
  const one = [{ status: 'fulfilled' }];
  assert.deepEqual(summarizeAudioVoiceGenerationResults(one, 0), { total: 1, succeeded: 1, incomplete: 0 });
  assert.deepEqual(summarizeAudioVoiceGenerationResults(one, -5), { total: 1, succeeded: 1, incomplete: 0 });
  assert.deepEqual(summarizeAudioVoiceGenerationResults(one, 2.9), { total: 2, succeeded: 1, incomplete: 1 });
  assert.deepEqual(summarizeAudioVoiceGenerationResults('nope', 3), { total: 3, succeeded: 0, incomplete: 3 });
});

test('audioVoicePanelGenerationFeedback: 完成文案在单条、批量、有未完成三种情形下互不相同', () => {
  const single = buildAudioVoiceGenerationCompletionMessage({ total: 1, succeeded: 1, incomplete: 0 });
  const batch = buildAudioVoiceGenerationCompletionMessage({ total: 3, succeeded: 3, incomplete: 0 });
  const partial = buildAudioVoiceGenerationCompletionMessage({ total: 3, succeeded: 2, incomplete: 1 });
  for (const text of [single, batch, partial]) {
    assert.equal(typeof text, 'string');
    assert.ok(text.length > 0);
  }
  assert.notEqual(single, batch);
  assert.notEqual(batch, partial);
  assert.notEqual(single, partial);
});

test('audioVoicePanelGenerationFeedback: total 的下限是 1，非法值等同单条', () => {
  const single = buildAudioVoiceGenerationCompletionMessage({ total: 1, succeeded: 1, incomplete: 0 });
  for (const total of [0, -3, undefined, 'abc']) {
    assert.equal(buildAudioVoiceGenerationCompletionMessage({ total, succeeded: 0, incomplete: 0 }), single);
  }
});

test('audioVoicePanelGenerationFeedback: incomplete 缺失时按 total - succeeded 补算，显式 0 则照 0 处理', () => {
  const missing = buildAudioVoiceGenerationCompletionMessage({ total: 4, succeeded: 1 });
  const explicit = buildAudioVoiceGenerationCompletionMessage({ total: 4, succeeded: 1, incomplete: 3 });
  assert.equal(missing, explicit);
  const zero = buildAudioVoiceGenerationCompletionMessage({ total: 4, succeeded: 1, incomplete: 0 });
  assert.notEqual(zero, explicit, '显式 0 不参与补算');
  assert.equal(zero, buildAudioVoiceGenerationCompletionMessage({ total: 4, succeeded: 4 }));
  const negative = buildAudioVoiceGenerationCompletionMessage({ total: 4, succeeded: 9, incomplete: -2 });
  assert.equal(negative, buildAudioVoiceGenerationCompletionMessage({ total: 4, succeeded: 4, incomplete: 0 }));
});

test('audioVoicePanelGenerationFeedback: 通知成功时才放声音，通知始终发出', async () => {
  const sounds = [];
  const notices = [];
  const both = await notifyAudioVoiceGenerationComplete(
    { total: 1, succeeded: 1, incomplete: 0 },
    {
      playSound: (kind) => sounds.push(kind),
      showNotification: (payload) => notices.push(payload),
    },
  );
  assert.deepEqual(sounds, ['generation-success']);
  assert.equal(notices.length, 1);
  assert.equal(typeof notices[0].body, 'string');
  assert.equal(both.length, 2);
  assert.ok(both.every((entry) => entry.status === 'fulfilled'));

  sounds.length = 0;
  notices.length = 0;
  await notifyAudioVoiceGenerationComplete(
    { total: 1, succeeded: 0, incomplete: 1 },
    {
      playSound: (kind) => sounds.push(kind),
      showNotification: (payload) => notices.push(payload),
    },
  );
  assert.deepEqual(sounds, [], '没有成功结果不放声音');
  assert.equal(notices.length, 1);
});

test('audioVoicePanelGenerationFeedback: 播放或通知抛错都被 allSettled 吞掉，不拒绝', async () => {
  const settled = await notifyAudioVoiceGenerationComplete(
    { total: 1, succeeded: 1, incomplete: 0 },
    {
      playSound: () => {
        throw new Error('audio blocked');
      },
      showNotification: () => {
        throw new Error('toast blocked');
      },
    },
  );
  assert.equal(settled.length, 2);
  assert.ok(settled.every((entry) => entry.status === 'rejected'));
});

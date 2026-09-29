import test from 'node:test';
import assert from 'node:assert/strict';

import { transcribeReplicationSource } from './storyReplicationSpeechApi.js';

test('storyReplicationSpeechApi: rejects inactive projects before enqueueing', async () => {
  await assert.rejects(
    () =>
      transcribeReplicationSource({
        videoRef: 'data/uploads/a.mp4',
        isActive: () => false,
      }),
    /视频分析所属项目已失效/,
  );
});

test('storyReplicationSpeechApi: waits for the host media task and cleans up listeners', async () => {
  const originalWindow = globalThis.window;
  let taskId = '';
  let unsubscribeCount = 0;
  let enqueuePayload = null;
  globalThis.window = {
    electronAPI: {
      mediaTask: {
        enqueue: async (payload) => {
          enqueuePayload = payload;
          taskId = payload.taskId;
          return { taskId };
        },
        cancel: async () => ({ ok: true }),
        onUpdate: (listener) => {
          setTimeout(
            () =>
              listener({
                taskId,
                status: 'complete',
                result: { text: 'transcribed' },
              }),
            0,
          );
          return () => {
            unsubscribeCount += 1;
          };
        },
      },
    },
  };

  try {
    const result = await transcribeReplicationSource({
      videoRef: 'data/uploads/source.mp4',
      isActive: () => true,
    });
    assert.deepEqual(result, { text: 'transcribed' });
    assert.equal(enqueuePayload.kind, 'recordingTranscribe');
    assert.equal(enqueuePayload.provider, 'volcengine-speech');
    assert.equal(enqueuePayload.src, 'data/uploads/source.mp4');
    assert.equal(unsubscribeCount, 1);
  } finally {
    globalThis.window = originalWindow;
  }
});

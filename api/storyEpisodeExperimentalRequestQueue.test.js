import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_EPISODE_EXPERIMENTAL_REQUEST_CONCURRENCY_LIMIT,
  enqueueStoryEpisodeExperimentalRequest,
} from './storyEpisodeExperimentalRequestQueue.js';

test('storyEpisodeExperimentalRequestQueue: rejects invalid operations', async () => {
  await assert.rejects(
    () => enqueueStoryEpisodeExperimentalRequest(null),
    /实验分集请求队列需要可执行的请求函数/,
  );
});

test('storyEpisodeExperimentalRequestQueue: respects the concurrency limit and drains waiters', async () => {
  let active = 0;
  let maxActive = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const tasks = Array.from({ length: 9 }, (_, index) =>
    enqueueStoryEpisodeExperimentalRequest(async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gate;
      active -= 1;
      return index;
    }),
  );

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(active, STORY_EPISODE_EXPERIMENTAL_REQUEST_CONCURRENCY_LIMIT);
  assert.equal(maxActive, STORY_EPISODE_EXPERIMENTAL_REQUEST_CONCURRENCY_LIMIT);

  release();
  assert.deepEqual(await Promise.all(tasks), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(maxActive, STORY_EPISODE_EXPERIMENTAL_REQUEST_CONCURRENCY_LIMIT);
});

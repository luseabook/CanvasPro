import test from 'node:test';
import assert from 'node:assert/strict';

import {
  enqueueStoryEpisodeRequest,
  STORY_EPISODE_REQUEST_CONCURRENCY_LIMIT,
} from './storyEpisodeRequestQueue.js';

test('storyEpisodeRequestQueue: rejects non-functions', async () => {
  await assert.rejects(enqueueStoryEpisodeRequest(null), TypeError);
});

test('storyEpisodeRequestQueue: never exceeds the concurrency limit', async () => {
  const releases = [];
  const starts = [];
  const tasks = Array.from({ length: STORY_EPISODE_REQUEST_CONCURRENCY_LIMIT + 1 }, (_, index) =>
    enqueueStoryEpisodeRequest(
      () =>
        new Promise((resolve) => {
          starts.push(index);
          releases[index] = resolve;
        }),
    ),
  );

  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(starts, [0, 1, 2, 3]);

  releases[0]('done-0');
  assert.equal(await tasks[0], 'done-0');
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(starts, [0, 1, 2, 3, 4]);

  for (let index = 1; index <= STORY_EPISODE_REQUEST_CONCURRENCY_LIMIT; index += 1) {
    releases[index](`done-${index}`);
  }
  assert.deepEqual(await Promise.all(tasks.slice(1)), ['done-1', 'done-2', 'done-3', 'done-4']);
});

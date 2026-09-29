import test from 'node:test';
import assert from 'node:assert/strict';

import {
  __resetRunningHubWorkflowQueueForTest,
  isRunningHubWorkflowQueueTarget,
  normalizeRunningHubWorkflowConcurrencyLimit,
  resolveRunningHubWorkflowQueueConfig,
  runWithRunningHubWorkflowQueue,
} from './runningHubWorkflowQueue.js';

test.beforeEach(() => {
  __resetRunningHubWorkflowQueueForTest();
});

test('runningHubWorkflowQueue: normalizes limits, config, and workflow targets', () => {
  assert.equal(normalizeRunningHubWorkflowConcurrencyLimit('3.9', 1), 3);
  assert.equal(normalizeRunningHubWorkflowConcurrencyLimit('invalid', 4), 4);

  const config = resolveRunningHubWorkflowQueueConfig({
    payload: {
      apiKey: ' key ',
      workflowConcurrentLimit: '2',
    },
    providerConfig: {
      providerProfileId: 'international',
      apiKey: 'fallback',
    },
  });
  assert.equal(config.apiKey, 'key');
  assert.equal(config.concurrentLimit, 2);
  assert.equal(config.providerConfig.providerProfileId, 'international');

  assert.equal(isRunningHubWorkflowQueueTarget({ providerId: 'runninghub', adapterType: 'workflow' }), true);
  assert.equal(
    isRunningHubWorkflowQueueTarget({
      providerId: 'runninghub',
      adapterType: 'workflow',
      payload: { model: 'other/model' },
    }),
    true,
  );
  assert.equal(isRunningHubWorkflowQueueTarget({ providerId: 'runninghub' }), false);
});

test('runningHubWorkflowQueue: serializes runners that share the same queue', async () => {
  const events = [];
  let active = 0;
  let maxActive = 0;

  const createRunner = (name) => async () => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    events.push(`${name}:start`);
    await new Promise((resolve) => setTimeout(resolve, 5));
    events.push(`${name}:end`);
    active -= 1;
    return name;
  };

  const results = await Promise.all([
    runWithRunningHubWorkflowQueue(
      { providerProfileId: 'domestic', concurrentLimit: 1, autoProbeConcurrency: false },
      createRunner('first'),
    ),
    runWithRunningHubWorkflowQueue(
      { providerProfileId: 'domestic', concurrentLimit: 1, autoProbeConcurrency: false },
      createRunner('second'),
    ),
  ]);

  assert.deepEqual(results, ['first', 'second']);
  assert.equal(maxActive, 1);
  assert.deepEqual(events, ['first:start', 'first:end', 'second:start', 'second:end']);
});

test('runningHubWorkflowQueue: applies a session concurrency probe and exposes the lease', async () => {
  let probes = 0;
  let lease = null;
  const result = await runWithRunningHubWorkflowQueue(
    {
      apiKey: 'key',
      providerProfileId: 'domestic',
      concurrentLimit: 1,
      concurrencyProbe: async () => {
        probes += 1;
        return {
          concurrentLimit: 2,
          runningCount: 1,
          queuedCount: 0,
          totalCurrentTasks: 1,
        };
      },
    },
    async (nextLease) => {
      lease = nextLease;
      return 'done';
    },
  );

  assert.equal(probes, 1);
  assert.equal(result, 'done');
  assert.equal(lease.provider, 'runninghubwf');
  assert.match(lease.queueKey, /:runninghub:key$/);
});

test('runningHubWorkflowQueue: rejects invalid runners and aborted signals', async () => {
  await assert.rejects(
    () => runWithRunningHubWorkflowQueue({ autoProbeConcurrency: false }, null),
    /runner is required/,
  );

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () =>
      runWithRunningHubWorkflowQueue(
        { autoProbeConcurrency: false, signal: controller.signal },
        async () => 'unreachable',
      ),
    (error) => error.name === 'AbortError' && error.message === 'CANCELLED',
  );
});

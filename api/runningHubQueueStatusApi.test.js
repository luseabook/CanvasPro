import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRunningHubQueueStatusProbeUrl,
  normalizeRunningHubQueueStatusPayload,
} from './runningHubQueueStatusApi.js';

test('runningHubQueueStatusApi: builds a queue status URL from workflow endpoints', () => {
  assert.equal(
    buildRunningHubQueueStatusProbeUrl('https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3'),
    'https://www.runninghub.cn/openapi/v2/queue/status',
  );
  assert.equal(
    buildRunningHubQueueStatusProbeUrl('https://www.runninghub.cn/uc/openapi/accountStatus'),
    'https://www.runninghub.cn/openapi/v2/queue/status',
  );
});

test('runningHubQueueStatusApi: normalizes wrapped snake_case queue data', () => {
  assert.deepEqual(
    normalizeRunningHubQueueStatusPayload({
      success: true,
      code: 0,
      data: {
        api_key_type: 'workflow',
        concurrent_limit: '4',
        running_count: 1,
        queued_count: 2,
        total_current_tasks: 3,
      },
    }),
    {
      apiKeyType: 'workflow',
      concurrentLimit: 4,
      runningCount: 1,
      queuedCount: 2,
      totalCurrentTasks: 3,
    },
  );
});

test('runningHubQueueStatusApi: rejects unsuccessful or incomplete payloads', () => {
  assert.equal(normalizeRunningHubQueueStatusPayload({ success: false, concurrentLimit: 4 }), null);
  assert.equal(normalizeRunningHubQueueStatusPayload({ success: true, code: 12, concurrentLimit: 4 }), null);
  assert.equal(normalizeRunningHubQueueStatusPayload({ success: true, data: {} }), null);
  assert.equal(normalizeRunningHubQueueStatusPayload(null), null);
});

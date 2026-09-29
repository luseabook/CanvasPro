import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRunningHubTaskLifecycleStatus } from './runninghubTaskLifecycle.js';

test('runninghubTaskLifecycle: resolves nested statuses with terminal precedence', () => {
  assert.equal(
    resolveRunningHubTaskLifecycleStatus({
      data: {
        status: 'SUCCEEDED',
        results: [{ taskStatus: 'cancelled' }],
      },
    }),
    'cancelled',
  );
  assert.equal(
    resolveRunningHubTaskLifecycleStatus({
      response: { task_status: 'failed' },
    }),
    'error',
  );
  assert.equal(resolveRunningHubTaskLifecycleStatus({ output: { status: 'completed' } }), 'success');
  assert.equal(resolveRunningHubTaskLifecycleStatus({ status: 'queued' }), 'running');
  assert.equal(resolveRunningHubTaskLifecycleStatus({ status: 'mystery' }), '');
});

test('runninghubTaskLifecycle: tolerates arrays and cyclic payloads', () => {
  const payload = { status: 'processing' };
  payload.self = payload;
  assert.equal(resolveRunningHubTaskLifecycleStatus([{ status: 'ignored' }, payload]), 'running');
  assert.equal(resolveRunningHubTaskLifecycleStatus(null), '');
});

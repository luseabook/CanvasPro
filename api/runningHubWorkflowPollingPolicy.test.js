import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS,
  RUNNINGHUB_WORKFLOW_POLL_MAX_COUNT,
  RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS,
  hasRunningHubWorkflowPollingTimedOut,
  resolveRunningHubWorkflowPollingPolicy,
} from './runningHubWorkflowPollingPolicy.js';

test('default polling constants are 2s interval, 1h timeout, 1800 polls', () => {
  assert.equal(RUNNINGHUB_WORKFLOW_POLL_INTERVAL_MS, 2000);
  assert.equal(RUNNINGHUB_WORKFLOW_POLL_TIMEOUT_MS, 3600000);
  assert.equal(RUNNINGHUB_WORKFLOW_POLL_MAX_COUNT, 1800);
});

test('resolveRunningHubWorkflowPollingPolicy falls back to defaults', () => {
  const defaults = { pollIntervalMs: 2000, pollTimeoutMs: 3600000, maxPolls: 1800 };
  assert.deepEqual(resolveRunningHubWorkflowPollingPolicy(), defaults);
  assert.deepEqual(resolveRunningHubWorkflowPollingPolicy({}), defaults);
  assert.deepEqual(resolveRunningHubWorkflowPollingPolicy(null), defaults);
});

test('custom interval derives maxPolls from the effective (>= default) interval', () => {
  assert.deepEqual(resolveRunningHubWorkflowPollingPolicy({ pollIntervalMs: 5000 }), {
    pollIntervalMs: 5000,
    pollTimeoutMs: 3600000,
    maxPolls: 720,
  });
  assert.deepEqual(resolveRunningHubWorkflowPollingPolicy({ pollIntervalMs: 500 }), {
    pollIntervalMs: 500,
    pollTimeoutMs: 3600000,
    maxPolls: 1800,
  });
});

test('interval is truncated and clamped at zero; invalid values become zero', () => {
  assert.equal(resolveRunningHubWorkflowPollingPolicy({ pollIntervalMs: 1500.9 }).pollIntervalMs, 1500);
  assert.equal(resolveRunningHubWorkflowPollingPolicy({ pollIntervalMs: -10 }).pollIntervalMs, 0);
  assert.equal(resolveRunningHubWorkflowPollingPolicy({ pollIntervalMs: 'abc' }).pollIntervalMs, 0);
});

test('custom timeout and maxPolls are honoured when positive', () => {
  assert.deepEqual(resolveRunningHubWorkflowPollingPolicy({ pollTimeoutMs: 10000 }), {
    pollIntervalMs: 2000,
    pollTimeoutMs: 10000,
    maxPolls: 5,
  });
  assert.equal(resolveRunningHubWorkflowPollingPolicy({ pollTimeoutMs: 0 }).pollTimeoutMs, 3600000);
  assert.equal(resolveRunningHubWorkflowPollingPolicy({ maxPolls: 3 }).maxPolls, 3);
  assert.equal(resolveRunningHubWorkflowPollingPolicy({ maxPolls: 'x' }).maxPolls, 1800);
});

test('hasRunningHubWorkflowPollingTimedOut compares elapsed time with the timeout', () => {
  assert.equal(hasRunningHubWorkflowPollingTimedOut(1000, 500, 1500), true);
  assert.equal(hasRunningHubWorkflowPollingTimedOut(1000, 500, 1499), false);
});

test('hasRunningHubWorkflowPollingTimedOut uses the default timeout for invalid values', () => {
  assert.equal(hasRunningHubWorkflowPollingTimedOut(0, 0, 3600000), true);
  assert.equal(hasRunningHubWorkflowPollingTimedOut(0, 0, 3599999), false);
});

test('hasRunningHubWorkflowPollingTimedOut is false for non-finite timestamps', () => {
  assert.equal(hasRunningHubWorkflowPollingTimedOut('abc', 500, 1500), false);
  assert.equal(hasRunningHubWorkflowPollingTimedOut(1000, 500, NaN), false);
});

test('hasRunningHubWorkflowPollingTimedOut defaults now to Date.now()', () => {
  assert.equal(hasRunningHubWorkflowPollingTimedOut(Date.now(), 60000), false);
  assert.equal(hasRunningHubWorkflowPollingTimedOut(Date.now() - 120000, 60000), true);
});

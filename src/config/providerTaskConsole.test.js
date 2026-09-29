import test from 'node:test';
import assert from 'node:assert/strict';
import { getProviderTaskConsoleUrl } from './providerTaskConsole.js';

test('getProviderTaskConsoleUrl resolves the RunningHub workflow billing console', () => {
  const expected = 'https://www.runninghub.cn/call-api/bill-task';

  assert.equal(
    getProviderTaskConsoleUrl({ provider: 'runninghub', adapterType: 'workflow' }),
    expected,
  );
  assert.equal(
    getProviderTaskConsoleUrl({ provider: 'runninghubwf', adapterType: 'workflow' }),
    expected,
  );
});

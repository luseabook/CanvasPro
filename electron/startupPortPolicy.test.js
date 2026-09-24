import test from 'node:test';
import assert from 'node:assert/strict';
import { assertStartupPortCanBeReclaimed } from './startupPortPolicy.js';

test('assertStartupPortCanBeReclaimed returns quietly when no listener pids are reported', () => {
  assert.equal(assertStartupPortCanBeReclaimed({ port: 8777, pids: [], env: {} }), undefined);
  assert.equal(assertStartupPortCanBeReclaimed({ port: 8777, env: {} }), undefined);
  assert.equal(
    assertStartupPortCanBeReclaimed({ port: 8777, pids: [0, -1, 'abc', null], env: {} }),
    undefined,
  );
});

test('assertStartupPortCanBeReclaimed accepts listeners that were all verified', () => {
  assert.equal(
    assertStartupPortCanBeReclaimed({
      port: 8777,
      pids: [4123, 4123, '4123'],
      verifiedPids: [4123],
      env: {},
    }),
    undefined,
  );
});

test('assertStartupPortCanBeReclaimed refuses when an unverified listener remains', () => {
  let error = null;
  try {
    assertStartupPortCanBeReclaimed({ port: 8777, pids: [4123, 5150], verifiedPids: [4123], env: {} });
  } catch (caught) {
    error = caught;
  }
  assert.ok(error, 'expected the guard to throw');
  assert.equal(error.code, 'AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED');
  assert.match(
    error.message,
    /^Port 8777 is owned by an unverified process; refusing to terminate listener PIDs /,
  );
  assert.match(error.message, /5150/);
  assert.deepEqual(error.details, { port: 8777, pids: [4123, 5150], unverifiedPids: [5150] });
});

test('assertStartupPortCanBeReclaimed normalizes duplicates and non-integer pids before comparing', () => {
  let error = null;
  try {
    assertStartupPortCanBeReclaimed({
      port: 8777,
      pids: [4123, 4123, 5150.7, -5150, '5150', 'NaN'],
      verifiedPids: ['4123', 4123],
      env: {},
    });
  } catch (caught) {
    error = caught;
  }
  assert.equal(error?.code, 'AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED');
  assert.deepEqual(error.details.pids, [4123, 5150]);
  assert.deepEqual(error.details.unverifiedPids, [5150]);
});

test('assertStartupPortCanBeReclaimed honours AICANVAS_TEST_FAIL_IF_PORT_BUSY truthy spellings', () => {
  for (const value of ['1', 'true', 'TRUE', 'yes', 'on', ' on ']) {
    let error = null;
    try {
      assertStartupPortCanBeReclaimed({
        port: 8777,
        pids: [4123],
        verifiedPids: [4123],
        env: { AICANVAS_TEST_FAIL_IF_PORT_BUSY: value },
      });
    } catch (caught) {
      error = caught;
    }
    assert.ok(error, `expected ${value} to activate the test guard`);
    assert.match(error.message, /^Test port 8777 is busy; refusing to terminate listener PIDs 4123$/);
    assert.equal(error.code, undefined);
  }
});

test('assertStartupPortCanBeReclaimed ignores falsy AICANVAS_TEST_FAIL_IF_PORT_BUSY values', () => {
  for (const value of ['0', 'false', 'no', 'off', '', '   ', undefined, null]) {
    assert.equal(
      assertStartupPortCanBeReclaimed({
        port: 8777,
        pids: [4123],
        verifiedPids: [4123],
        env: { AICANVAS_TEST_FAIL_IF_PORT_BUSY: value },
      }),
      undefined,
    );
  }
});

test('assertStartupPortCanBeReclaimed tolerates a missing env object', () => {
  assert.equal(assertStartupPortCanBeReclaimed({ port: 8777, pids: [], env: null }), undefined);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { reclaimStartupPort } from './startupPortRecovery.js';

function makeCollector(sequence) {
  let index = 0;
  const calls = [];
  const collector = async (port) => {
    calls.push(port);
    const value = sequence[Math.min(index, sequence.length - 1)];
    index += 1;
    if (value instanceof Error) throw value;
    return value;
  };
  collector.calls = calls;
  return collector;
}

function makeDelayRecorder() {
  const delays = [];
  return {
    delays: delays,
    delayFn: async (ms) => {
      delays.push(ms);
    },
  };
}

test('reclaimStartupPort requires a listener collector and a terminator', async () => {
  await assert.rejects(reclaimStartupPort({}), (error) => {
    assert.equal(error.name, 'TypeError');
    assert.equal(error.message, 'Startup port listener collector is required');
    return true;
  });
  await assert.rejects(reclaimStartupPort({ collectListeningPortPids: async () => [] }), (error) => {
    assert.equal(error.name, 'TypeError');
    assert.equal(error.message, 'Startup port process terminator is required');
    return true;
  });
});

test('reclaimStartupPort reports nothing to reclaim when no listener is found', async () => {
  const collector = makeCollector([[]]);
  const result = await reclaimStartupPort({
    port: 8777,
    collectListeningPortPids: collector,
    terminateProcess: async () => {},
  });
  assert.deepEqual(result, { reclaimed: false, pids: [] });
  assert.deepEqual(collector.calls, [8777]);
});

test('reclaimStartupPort normalizes collector output before deciding', async () => {
  const collector = makeCollector([['4123', 4123, -4123, 'nope', null], [4123], []]);
  const terminated = [];
  const recorder = makeDelayRecorder();
  const result = await reclaimStartupPort({
    port: 8777,
    collectListeningPortPids: collector,
    confirmRuntimeIdentity: async ({ pids }) => {
      assert.deepEqual(pids, [4123]);
      return [4123];
    },
    terminateProcess: async (pid) => {
      terminated.push(pid);
    },
    delayFn: recorder.delayFn,
  });
  assert.deepEqual(result, { reclaimed: true, pids: [4123] });
  assert.deepEqual(terminated, [4123]);
  assert.deepEqual(recorder.delays, [800]);
});

test('reclaimStartupPort throws when listeners cannot be verified as the local backend', async () => {
  const collector = makeCollector([[4123, 5150]]);
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: collector,
      confirmRuntimeIdentity: async () => [4123],
      terminateProcess: async () => {},
    }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED');
      assert.deepEqual(error.details.unverifiedPids, [5150]);
      return true;
    },
  );
  assert.deepEqual(collector.calls, [8777]);
});

test('reclaimStartupPort skips when an unverified listener exits during the grace window', async () => {
  const collector = makeCollector([[4123], []]);
  const recorder = makeDelayRecorder();
  const result = await reclaimStartupPort({
    port: 8777,
    collectListeningPortPids: collector,
    confirmRuntimeIdentity: async () => [],
    terminateProcess: async () => {
      throw new Error('must not terminate an unverified listener');
    },
    delayFn: recorder.delayFn,
  });
  assert.deepEqual(result, { reclaimed: false, pids: [], skippedReason: 'listener-exited' });
  assert.deepEqual(recorder.delays, [200]);
});

test('reclaimStartupPort rethrows the ownership error when the listener set changes during the grace window', async () => {
  const collector = makeCollector([[4123], [5150]]);
  const recorder = makeDelayRecorder();
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: collector,
      confirmRuntimeIdentity: async () => [],
      terminateProcess: async () => {},
      delayFn: recorder.delayFn,
    }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED');
      return true;
    },
  );
  assert.deepEqual(recorder.delays, [200]);
});

test('reclaimStartupPort rethrows the ownership error immediately without a delay hook', async () => {
  const collector = makeCollector([[4123], [4123]]);
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: collector,
      confirmRuntimeIdentity: async () => [],
      terminateProcess: async () => {},
    }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED');
      return true;
    },
  );
  assert.deepEqual(collector.calls, [8777]);
});

test('reclaimStartupPort reclaims a verified stale listener and confirms the port is free', async () => {
  const collector = makeCollector([[4123], [4123], []]);
  const recorder = makeDelayRecorder();
  const identityChecks = [];
  const reclaims = [];
  const terminated = [];
  const result = await reclaimStartupPort({
    port: 8777,
    collectListeningPortPids: collector,
    confirmRuntimeIdentity: async ({ port, pids }) => {
      identityChecks.push({ port: port, pids: pids });
      return pids;
    },
    terminateProcess: async (pid) => {
      terminated.push(pid);
    },
    delayFn: recorder.delayFn,
    onReclaim: (info) => reclaims.push(info),
  });
  assert.deepEqual(result, { reclaimed: true, pids: [4123] });
  assert.deepEqual(identityChecks, [
    { port: 8777, pids: [4123] },
    { port: 8777, pids: [4123] },
  ]);
  assert.deepEqual(reclaims, [{ port: 8777, pids: [4123] }]);
  assert.deepEqual(terminated, [4123]);
  assert.deepEqual(recorder.delays, [800]);
  assert.deepEqual(collector.calls, [8777, 8777, 8777]);
});

test('reclaimStartupPort reports an already exited listener as reclaimed without terminating', async () => {
  const collector = makeCollector([[4123], []]);
  const result = await reclaimStartupPort({
    port: 8777,
    collectListeningPortPids: collector,
    confirmRuntimeIdentity: async () => [4123],
    terminateProcess: async () => {
      throw new Error('must not terminate an exited listener');
    },
  });
  assert.deepEqual(result, { reclaimed: true, pids: [] });
});

test('reclaimStartupPort refuses when the listener ownership changes before termination', async () => {
  const collector = makeCollector([[4123], [5150]]);
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: collector,
      confirmRuntimeIdentity: async () => [4123, 5150],
      terminateProcess: async () => {},
    }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_OWNERSHIP_CHANGED');
      assert.deepEqual(error.details, { port: 8777, expectedPids: [4123], currentPids: [5150] });
      return true;
    },
  );
});

test('reclaimStartupPort surfaces individual termination failures', async () => {
  const collector = makeCollector([
    [4123, 5150],
    [4123, 5150],
  ]);
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: collector,
      confirmRuntimeIdentity: async ({ pids }) => pids,
      terminateProcess: async (pid) => {
        if (pid === 5150) throw new Error('access denied');
      },
      delayFn: async () => {},
    }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_RECLAIM_FAILED');
      assert.deepEqual(error.details.pids, [5150]);
      assert.deepEqual(error.details.failures, [{ pid: 5150, error: 'access denied' }]);
      return true;
    },
  );
});

test('reclaimStartupPort refuses when the port is still busy after the settle delay', async () => {
  const collector = makeCollector([[4123], [4123], [4123]]);
  const recorder = makeDelayRecorder();
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: collector,
      confirmRuntimeIdentity: async ({ pids }) => pids,
      terminateProcess: async () => {},
      delayFn: recorder.delayFn,
    }),
    (error) => {
      assert.equal(error.code, 'AIC_STARTUP_PORT_STILL_BUSY');
      assert.deepEqual(error.details, { port: 8777, pids: [4123] });
      return true;
    },
  );
  assert.deepEqual(recorder.delays, [800]);
});

test('reclaimStartupPort passes a zero settle delay through to the delay hook', async () => {
  const collector = makeCollector([[4123], [4123], []]);
  const recorder = makeDelayRecorder();
  const result = await reclaimStartupPort({
    port: 8777,
    collectListeningPortPids: collector,
    confirmRuntimeIdentity: async ({ pids }) => pids,
    terminateProcess: async () => {},
    delayFn: recorder.delayFn,
    settleDelayMs: 0,
  });
  assert.deepEqual(result, { reclaimed: true, pids: [4123] });
  assert.deepEqual(recorder.delays, [0]);
});

function createEnumerationFailure() {
  const error = new Error('Failed to inspect listeners on port 8777');
  error.code = 'AIC_STARTUP_PORT_ENUMERATION_FAILED';
  error.details = { port: 8777, command: 'lsof', failure: { code: 'ENOENT' } };
  return error;
}

test('reclaimStartupPort continues when enumeration fails but the port probes free', async () => {
  const failure = createEnumerationFailure();
  const collector = makeCollector([failure]);
  const notifications = [];
  const result = await reclaimStartupPort({
    port: 8777,
    collectListeningPortPids: collector,
    probePortAvailable: async ({ port }) => {
      assert.equal(port, 8777);
      return true;
    },
    terminateProcess: async () => {
      throw new Error('must not terminate on an unavailable enumeration');
    },
    onEnumerationUnavailable: (info) => notifications.push(info),
  });
  assert.deepEqual(result, {
    reclaimed: false,
    pids: [],
    skippedReason: 'enumeration-unavailable-port-free',
  });
  assert.equal(failure.details.portAvailability, 'free');
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].port, 8777);
  assert.equal(notifications[0].error, failure);
});

test('reclaimStartupPort rethrows when enumeration fails and the port is not free', async () => {
  const failure = createEnumerationFailure();
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: makeCollector([failure]),
      probePortAvailable: async () => false,
      terminateProcess: async () => {},
    }),
    (error) => {
      assert.equal(error, failure);
      assert.equal(error.details.portAvailability, 'busy-or-unavailable');
      return true;
    },
  );
});

test('reclaimStartupPort records a failed port probe on the enumeration error', async () => {
  const failure = createEnumerationFailure();
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: makeCollector([failure]),
      probePortAvailable: async () => {
        throw Object.assign(new Error('socket unavailable'), { code: 'EAFNOSUPPORT' });
      },
      terminateProcess: async () => {},
    }),
    (error) => {
      assert.equal(error, failure);
      assert.equal(error.details.portAvailability, 'probe-failed');
      assert.deepEqual(error.details.portProbeFailure, {
        code: 'EAFNOSUPPORT',
        message: 'socket unavailable',
      });
      assert.deepEqual(error.details.command, 'lsof');
      return true;
    },
  );
});

test('reclaimStartupPort rethrows an enumeration failure without a port probe', async () => {
  const failure = createEnumerationFailure();
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: makeCollector([failure]),
      terminateProcess: async () => {},
    }),
    (error) => error === failure,
  );
});

test('reclaimStartupPort propagates unrelated collector failures untouched', async () => {
  const failure = new Error('collector exploded');
  await assert.rejects(
    reclaimStartupPort({
      port: 8777,
      collectListeningPortPids: makeCollector([failure]),
      probePortAvailable: async () => true,
      terminateProcess: async () => {},
    }),
    (error) => error === failure,
  );
});

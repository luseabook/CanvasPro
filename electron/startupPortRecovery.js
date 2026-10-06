import { assertStartupPortCanBeReclaimed } from './startupPortPolicy.js';
function normalizeListenerPids(pids = []) {
  return [
    ...new Set(
      (Array.isArray(pids) ? pids : [])
        .map((pid) => Number(pid))
        .filter((normalizedPid) => Number.isInteger(normalizedPid) && normalizedPid > 0),
    ),
  ];
}
function samePidSet(left, right) {
  return left.length === right.length && left.every((pid) => right.includes(pid));
}
function createPortRecoveryError(message, code, details) {
  const error = new Error(message);
  return ((error.code = code), (error.details = details), error);
}
export async function reclaimStartupPort({
  port: port,
  env: env = process.env,
  collectListeningPortPids: collectListeningPortPids,
  probePortAvailable: probePortAvailable,
  confirmRuntimeIdentity: confirmRuntimeIdentity,
  terminateProcess: terminateProcess,
  delayFn: delayFn,
  settleDelayMs: settleDelayMs = 800,
  onReclaim: onReclaim = null,
  onEnumerationUnavailable: onEnumerationUnavailable = null,
} = {}) {
  if (typeof collectListeningPortPids !== 'function')
    throw new TypeError('Startup port listener collector is required');
  if (typeof terminateProcess !== 'function')
    throw new TypeError('Startup port process terminator is required');
  let initialPids;
  try {
    initialPids = normalizeListenerPids(await collectListeningPortPids(port));
  } catch (enumerationError) {
    if (enumerationError?.code !== 'AIC_STARTUP_PORT_ENUMERATION_FAILED') throw enumerationError;
    if (typeof probePortAvailable !== 'function') throw enumerationError;
    let available;
    try {
      available = await probePortAvailable({ port: port });
    } catch (probeError) {
      enumerationError.details = {
        ...(enumerationError?.details && typeof enumerationError.details === 'object'
          ? enumerationError.details
          : {}),
        portAvailability: 'probe-failed',
        portProbeFailure: {
          code: String(probeError?.code || ''),
          message: String(probeError?.message || probeError || ''),
        },
      };
      throw enumerationError;
    }
    enumerationError.details = {
      ...(enumerationError?.details && typeof enumerationError.details === 'object'
        ? enumerationError.details
        : {}),
      portAvailability: available === true ? 'free' : 'busy-or-unavailable',
    };
    if (available !== true) throw enumerationError;
    return (
      onEnumerationUnavailable?.({ port: port, error: enumerationError }),
      { reclaimed: false, pids: [], skippedReason: 'enumeration-unavailable-port-free' }
    );
  }
  if (initialPids.length === 0) return { reclaimed: false, pids: [] };
  const resolveVerifiedPids = async (pids) =>
      normalizeListenerPids(
        typeof confirmRuntimeIdentity === 'function'
          ? await confirmRuntimeIdentity({ port: port, pids: pids })
          : [],
      ),
    verifiedPids = await resolveVerifiedPids(initialPids);
  try {
    assertStartupPortCanBeReclaimed({
      port: port,
      pids: initialPids,
      verifiedPids: verifiedPids,
      env: env,
    });
  } catch (policyError) {
    if (policyError?.code !== 'AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED' || typeof delayFn !== 'function')
      throw policyError;
    const deadline = Date.now() + 2000;
    for (let attempt = 0; attempt < 10 && Date.now() < deadline; attempt += 1) {
      await delayFn(200);
      const currentPids = normalizeListenerPids(await collectListeningPortPids(port));
      if (currentPids.length === 0)
        return { reclaimed: false, pids: [], skippedReason: 'listener-exited' };
      if (!samePidSet(initialPids, currentPids)) break;
    }
    throw policyError;
  }
  const currentPids = normalizeListenerPids(await collectListeningPortPids(port));
  if (currentPids.length === 0) return { reclaimed: true, pids: [] };
  if (!samePidSet(initialPids, currentPids))
    throw createPortRecoveryError(
      'Port ' + port + ' listener ownership changed before termination',
      'AIC_STARTUP_PORT_OWNERSHIP_CHANGED',
      { port: port, expectedPids: initialPids, currentPids: currentPids },
    );
  (assertStartupPortCanBeReclaimed({
    port: port,
    pids: currentPids,
    verifiedPids: await resolveVerifiedPids(currentPids),
    env: env,
  }),
    onReclaim?.({ port: port, pids: initialPids }));
  const failures = [];
  for (const pid of initialPids) {
    try {
      await terminateProcess(pid);
    } catch (error) {
      failures.push({ pid: pid, error: String(error?.message || error) });
    }
  }
  if (failures.length > 0)
    throw createPortRecoveryError(
      'Failed to stop the verified stale runtime on port ' + port,
      'AIC_STARTUP_PORT_RECLAIM_FAILED',
      { port: port, pids: failures.map((failure) => failure.pid), failures: failures },
    );
  await delayFn?.(Math.max(0, Number(settleDelayMs) || 0));
  const remainingPids = normalizeListenerPids(await collectListeningPortPids(port));
  if (remainingPids.length > 0)
    throw createPortRecoveryError(
      'Port ' + port + ' is still busy after stopping the verified stale runtime',
      'AIC_STARTUP_PORT_STILL_BUSY',
      { port: port, pids: remainingPids },
    );
  return { reclaimed: true, pids: initialPids };
}

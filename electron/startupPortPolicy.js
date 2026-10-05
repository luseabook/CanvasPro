const TRUE_RE = /^(1|true|yes|on)$/i;
export function assertStartupPortCanBeReclaimed({
  port: port,
  pids: pids = [],
  verifiedPids: verifiedPids = [],
  env: env = process['env'],
} = {}) {
  const listenerPids = [
    ...new Set(
      pids['map']((pid) => Number(pid))['filter'](
        (normalizedPid) => Number['isInteger'](normalizedPid) && normalizedPid > 0,
      ),
    ),
  ];
  if (listenerPids['length'] === 0) return;
  if (TRUE_RE['test'](String(env?.['AICANVAS_TEST_FAIL_IF_PORT_BUSY'] || '')['trim']()))
    throw new Error(
      'Test port ' +
        port +
        ' is busy; refusing to terminate listener PIDs ' +
        listenerPids['join'](', '),
    );
  const verifiedPidSet = new Set(
      verifiedPids['map']((pid) => Number(pid))['filter'](
        (normalizedPid) => Number['isInteger'](normalizedPid) && normalizedPid > 0,
      ),
    ),
    unverifiedPids = listenerPids['filter']((pid) => !verifiedPidSet['has'](pid));
  if (unverifiedPids['length'] > 0) {
    const error = new Error(
      'Port ' +
        port +
        ' is owned by an unverified process; refusing to terminate listener PIDs ' +
        unverifiedPids['join'](', '),
    );
    ((error['code'] = 'AIC_STARTUP_PORT_OWNERSHIP_UNVERIFIED'),
      (error['details'] = { port: port, pids: listenerPids, unverifiedPids: unverifiedPids }));
    throw error;
  }
}

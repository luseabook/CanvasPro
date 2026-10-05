import { execFileSync } from 'node:child_process';
import { createServer } from 'node:net';
import { describeSystemCommandFailure, resolveWindowsSystemToolPath } from './windowsSystemTools.js';
function createEnumerationError({ port: port, command: command, cause: cause }) {
  const error = new Error('Failed to inspect listeners on port ' + port);
  return (
    (error['code'] = 'AIC_STARTUP_PORT_ENUMERATION_FAILED'),
    (error['details'] = {
      port: port,
      command: command,
      failure: describeSystemCommandFailure(cause),
    }),
    (error['cause'] = cause),
    error
  );
}
function parseWindowsNetstatPids(output, port, processId) {
  return [
    ...new Set(
      String(output || '')
        ['split'](/\r?\n/)
        ['map']((line) => line['trim']())
        ['filter']((line) => /\bLISTENING\b/i['test'](line))
        ['map']((line) => line['split'](/\s+/))
        ['filter']((columns) => columns['length'] >= 5 && columns[1]?.['endsWith'](':' + port))
        ['map']((columns) => Number['parseInt'](columns[4], 10))
        ['filter']((pid) => Number['isInteger'](pid) && pid > 0 && pid !== processId),
    ),
  ];
}
export function collectListeningPortPids(
  port,
  {
    platform: platform = process['platform'],
    env: env = process['env'],
    processId: processId = process['pid'],
    execFileSyncFn: execFileSyncFn = execFileSync,
  } = {},
) {
  let command = 'lsof';
  try {
    if (platform === 'win32') {
      command = resolveWindowsSystemToolPath('netstat', { env: env });
      const netstatOutput = execFileSyncFn(command, ['-ano', '-p', 'tcp'], {
        encoding: 'utf8',
        windowsHide: !![],
      });
      return parseWindowsNetstatPids(netstatOutput, port, processId);
    }
    const lsofOutput = execFileSyncFn(command, ['-nP', '-iTCP:' + port, '-sTCP:LISTEN', '-t'], {
      encoding: 'utf8',
      windowsHide: !![],
    });
    return String(lsofOutput || '')
      ['split'](/\r?\n/)
      ['map']((line) => Number['parseInt'](line['trim'](), 10))
      ['filter']((pid) => Number['isInteger'](pid) && pid > 0 && pid !== processId);
  } catch (cause) {
    if (platform !== 'win32' && Number(cause?.['status']) === 1) return [];
    throw createEnumerationError({ port: port, command: command, cause: cause });
  }
}
export function probeTcpPortAvailable({
  host: host = '127.0.0.1',
  port: port,
  createServerFn: createServerFn = createServer,
} = {}) {
  return new Promise((resolve, reject) => {
    const server = createServerFn();
    let settled = ![];
    const settle = (callback, value) => {
      if (settled) return;
      ((settled = !![]), callback(value));
    };
    server['once']('error', (error) => {
      if (error?.['code'] === 'EADDRINUSE') {
        settle(resolve, ![]);
        return;
      }
      settle(reject, error);
    });
    try {
      (server['listen']({ host: host, port: port, exclusive: !![] }, () => {
        server['close']((closeError) => {
          if (closeError) {
            settle(reject, closeError);
            return;
          }
          settle(resolve, !![]);
        });
      }),
        server['unref']?.());
    } catch (listenError) {
      settle(reject, listenError);
    }
  });
}
export const __startupPortInspectorForTest = { parseWindowsNetstatPids: parseWindowsNetstatPids };

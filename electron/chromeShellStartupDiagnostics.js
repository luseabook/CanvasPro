import { sanitizeDiagnosticValue } from './diagnostics.js';
const MAX_STDERR_BYTES = 0x708;
export function attachChromeShellStartupDiagnostics(childProcess) {
  let active = true,
    stderrBuffer = Buffer['alloc'](0x0),
    stderrBytes = 0x0,
    stderrReadError = '';
  return (
    childProcess?.['stderr']?.['on']?.('data', (chunk) => {
      if (!active) return;
      const chunkBuffer = Buffer['isBuffer'](chunk) ? chunk : Buffer['from'](String(chunk), 'utf8');
      ((stderrBytes += chunkBuffer['length']),
        (stderrBuffer = Buffer['concat']([stderrBuffer, chunkBuffer['subarray'](-MAX_STDERR_BYTES)])[
          'subarray'
        ](-MAX_STDERR_BYTES)));
    }),
    childProcess?.['stderr']?.['on']?.('error', (error) => {
      if (active) stderrReadError = String(error?.['code'] || 'STDERR_READ_FAILED');
    }),
    {
      snapshot() {
        return sanitizeDiagnosticValue({
          stderrAvailable: Boolean(childProcess?.['stderr']),
          stderrBytes: stderrBytes,
          stderrTruncated: stderrBytes > MAX_STDERR_BYTES,
          stderrReadError: stderrReadError,
          stderrTail: stderrBuffer['toString']('utf8'),
        });
      },
      stop() {
        ((active = false), (stderrBuffer = Buffer['alloc'](0x0)));
      },
    }
  );
}

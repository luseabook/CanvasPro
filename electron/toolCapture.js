import { spawn } from 'node:child_process';
function createTimeoutError(command, timeoutMs) {
  const error = new Error(command + ' timed out after ' + timeoutMs + 'ms');
  return (
    (error.name = 'ToolCaptureTimeoutError'),
    (error.code = 'TOOL_CAPTURE_TIMEOUT'),
    (error.timeoutMs = timeoutMs),
    error
  );
}
export function runToolCapture(
  command,
  args,
  { cwd: cwd = process.cwd(), input: input = null, timeoutMs: timeoutMs = 0, windowsHide: windowsHide = true } = {},
) {
  return new Promise((resolve, reject) => {
    const hasInput = input !== null && input !== undefined,
      child = spawn(command, args, {
        cwd: cwd,
        stdio: hasInput ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
        windowsHide: windowsHide,
      }),
      stdoutChunks = [],
      stderrChunks = [];
    let settled = false,
      timer = null;
    const finish = (settle, value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      settle(value);
    };
    (child.stdout?.on('data', (chunk) => stdoutChunks.push(Buffer.from(chunk))),
      child.stderr?.on('data', (chunk) => stderrChunks.push(Buffer.from(chunk))),
      child.once('error', (error) => finish(reject, error)),
      child.once('close', (code, signal) => {
        if (code === 0) {
          finish(resolve, Buffer.concat(stdoutChunks));
          return;
        }
        const stderrText = Buffer.concat(stderrChunks).toString('utf8').trim();
        finish(
          reject,
          new Error(
            stderrText ||
              command +
                ' exited with ' +
                (code ?? 'unknown') +
                (signal ? ' (' + signal + ')' : ''),
          ),
        );
      }));
    const delay = Math.max(0, Math.trunc(Number(timeoutMs) || 0));
    (delay > 0 &&
      ((timer = setTimeout(() => {
        const error = createTimeoutError(command, delay);
        try {
          child.kill();
        } catch {}
        finish(reject, error);
      }, delay)),
      timer.unref?.()),
      hasInput &&
        child.stdin &&
        (child.stdin.on('error', (error) => {
          if (error?.code !== 'EPIPE') finish(reject, error);
        }),
        child.stdin.end(input)));
  });
}

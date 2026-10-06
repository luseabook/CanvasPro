import { Buffer } from 'node:buffer';
import path from 'node:path';
const MAX_FAILURE_TEXT_LENGTH = 2000,
  WINDOWS_SYSTEM_TOOLS = Object.freeze({
    netstat: { fallback: 'netstat.exe', relativePath: ['System32', 'netstat.exe'] },
    powershell: {
      fallback: 'powershell.exe',
      relativePath: ['System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'],
    },
    taskkill: { fallback: 'taskkill.exe', relativePath: ['System32', 'taskkill.exe'] },
  });
function resolveWindowsRoot(env = process.env) {
  const candidates = [env?.SystemRoot, env?.SYSTEMROOT, env?.WINDIR, env?.windir];
  for (const candidate of candidates) {
    const windowsRoot = String(candidate || '')
      .trim()
      .replace(/^"|"$/g, '');
    if (path.win32.isAbsolute(windowsRoot)) return windowsRoot;
  }
  return '';
}
export function resolveWindowsSystemToolPath(toolName, { env: env = process.env } = {}) {
  const tool =
    WINDOWS_SYSTEM_TOOLS[
      String(toolName || '')
        .trim()
        .toLowerCase()
    ];
  if (!tool) throw new TypeError('Unsupported Windows system tool: ' + toolName);
  const windowsRoot = resolveWindowsRoot(env);
  return windowsRoot ? path.win32.join(windowsRoot, ...tool.relativePath) : tool.fallback;
}
function normalizeFailureText(value) {
  const text = Buffer.isBuffer(value) ? value.toString('utf8') : String(value ?? '');
  return text.slice(0, MAX_FAILURE_TEXT_LENGTH);
}
export function describeSystemCommandFailure(cause) {
  const details = {};
  for (const key of ['code', 'errno', 'status', 'signal', 'syscall', 'path']) {
    if (cause?.[key] !== undefined) details[key] = cause[key];
  }
  const message = normalizeFailureText(cause?.message),
    stderrText = normalizeFailureText(cause?.stderr);
  if (message) details.message = message;
  if (stderrText) details.stderr = stderrText;
  return details;
}
export const __windowsSystemToolsForTest = { resolveWindowsRoot: resolveWindowsRoot };

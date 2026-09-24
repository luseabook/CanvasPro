import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  resolveWindowsSystemToolPath,
  describeSystemCommandFailure,
  __windowsSystemToolsForTest,
} from './windowsSystemTools.js';

const { resolveWindowsRoot } = __windowsSystemToolsForTest;
const MAX_FAILURE_TEXT_LENGTH = 0x7d0;

test('resolveWindowsRoot prefers SystemRoot and returns the first win32 absolute value', () => {
  assert.equal(resolveWindowsRoot({ SystemRoot: 'C:\\Windows' }), 'C:\\Windows');
});

test('resolveWindowsRoot walks SystemRoot, SYSTEMROOT, WINDIR, windir in order', () => {
  assert.equal(
    resolveWindowsRoot({ SystemRoot: 'C:\\First', SYSTEMROOT: 'C:\\Second', WINDIR: 'C:\\Third' }),
    'C:\\First',
  );
  assert.equal(resolveWindowsRoot({ SYSTEMROOT: 'C:\\Second', WINDIR: 'C:\\Third' }), 'C:\\Second');
  assert.equal(resolveWindowsRoot({ WINDIR: 'C:\\Third', windir: 'C:\\Fourth' }), 'C:\\Third');
  assert.equal(resolveWindowsRoot({ windir: 'C:\\Fourth' }), 'C:\\Fourth');
});

test('resolveWindowsRoot skips relative candidates until a win32 absolute one appears', () => {
  assert.equal(
    resolveWindowsRoot({ SystemRoot: 'Windows', SYSTEMROOT: 'also-not-absolute', WINDIR: 'C:\\Real' }),
    'C:\\Real',
  );
});

test('resolveWindowsRoot trims whitespace and strips surrounding quotes', () => {
  assert.equal(resolveWindowsRoot({ SystemRoot: '  "C:\\Quoted Windows"  ' }), 'C:\\Quoted Windows');
  assert.equal(resolveWindowsRoot({ SystemRoot: '"C:\\OneQuote"' }), 'C:\\OneQuote');
});

test('resolveWindowsRoot returns an empty string when no candidate is absolute', () => {
  assert.equal(resolveWindowsRoot({ SystemRoot: 'Windows', WINDIR: 'foo/bar' }), '');
  assert.equal(resolveWindowsRoot({}), '');
  assert.equal(typeof resolveWindowsRoot(), 'string');
});

test('resolveWindowsSystemToolPath joins the tool under the Windows root', () => {
  const env = { SystemRoot: 'C:\\Windows' };
  assert.equal(resolveWindowsSystemToolPath('netstat', { env: env }), 'C:\\Windows\\System32\\netstat.exe');
  assert.equal(
    resolveWindowsSystemToolPath('powershell', { env: env }),
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
  );
  assert.equal(resolveWindowsSystemToolPath('taskkill', { env: env }), 'C:\\Windows\\System32\\taskkill.exe');
});

test('resolveWindowsSystemToolPath falls back to the bare tool name without a Windows root', () => {
  const env = {};
  assert.equal(resolveWindowsSystemToolPath('netstat', { env: env }), 'netstat.exe');
  assert.equal(resolveWindowsSystemToolPath('powershell', { env: env }), 'powershell.exe');
  assert.equal(resolveWindowsSystemToolPath('taskkill', { env: env }), 'taskkill.exe');
});

test('resolveWindowsSystemToolPath matches tool names case-insensitively and trims padding', () => {
  const env = { SystemRoot: 'C:\\Windows' };
  assert.equal(
    resolveWindowsSystemToolPath('  PowerShell  ', { env: env }),
    path.win32.join('C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
  );
  assert.equal(resolveWindowsSystemToolPath('TASKKILL', { env: env }), 'C:\\Windows\\System32\\taskkill.exe');
});

test('resolveWindowsSystemToolPath rejects unsupported tool names', () => {
  assert.throws(() => resolveWindowsSystemToolPath('cmd'), {
    name: 'TypeError',
    message: 'Unsupported Windows system tool: cmd',
  });
  assert.throws(() => resolveWindowsSystemToolPath(''), {
    name: 'TypeError',
    message: 'Unsupported Windows system tool: ',
  });
});

test('describeSystemCommandFailure copies only the whitelisted failure keys', () => {
  const details = describeSystemCommandFailure({
    code: 'ENOENT',
    errno: -4058,
    status: 1,
    signal: 'SIGTERM',
    syscall: 'spawn powershell',
    path: 'C:\\Windows\\System32',
    stdout: 'ignored',
    foo: 'ignored',
  });
  assert.deepEqual(details, {
    code: 'ENOENT',
    errno: -4058,
    status: 1,
    signal: 'SIGTERM',
    syscall: 'spawn powershell',
    path: 'C:\\Windows\\System32',
  });
});

test('describeSystemCommandFailure skips keys that are undefined', () => {
  const details = describeSystemCommandFailure({ code: 'EPERM', errno: undefined, path: undefined });
  assert.deepEqual(details, { code: 'EPERM' });
});

test('describeSystemCommandFailure keeps a null value that is explicitly present', () => {
  const details = describeSystemCommandFailure({ code: 'EPERM', signal: null });
  assert.deepEqual(details, { code: 'EPERM', signal: null });
});

test('describeSystemCommandFailure normalizes Buffer messages to utf8 text', () => {
  const details = describeSystemCommandFailure({ message: Buffer.from('spawn failed', 'utf8') });
  assert.equal(details.message, 'spawn failed');
});

test('describeSystemCommandFailure truncates long messages to the failure-text limit', () => {
  const longText = 'x'.repeat(MAX_FAILURE_TEXT_LENGTH + 100);
  const details = describeSystemCommandFailure({ message: longText });
  assert.equal(details.message.length, MAX_FAILURE_TEXT_LENGTH);
  assert.equal(details.message, 'x'.repeat(MAX_FAILURE_TEXT_LENGTH));
});

test('describeSystemCommandFailure includes stderr alongside the message', () => {
  const details = describeSystemCommandFailure({
    message: 'command failed',
    stderr: Buffer.from('Get-Item : Cannot find path', 'utf8'),
  });
  assert.deepEqual(details, { message: 'command failed', stderr: 'Get-Item : Cannot find path' });
});

test('describeSystemCommandFailure omits empty message and stderr text', () => {
  const details = describeSystemCommandFailure({ code: 'EPERM', message: '', stderr: '' });
  assert.deepEqual(details, { code: 'EPERM' });
});

test('describeSystemCommandFailure tolerates null, undefined and non-object causes', () => {
  assert.deepEqual(describeSystemCommandFailure(null), {});
  assert.deepEqual(describeSystemCommandFailure(undefined), {});
  assert.deepEqual(describeSystemCommandFailure('boom'), {});
});

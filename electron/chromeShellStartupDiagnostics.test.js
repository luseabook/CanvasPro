import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import { attachChromeShellStartupDiagnostics } from './chromeShellStartupDiagnostics.js';

const MAX_STDERR_BYTES = 1800;

function createStderrDouble() {
  const stderr = new EventEmitter();
  return stderr;
}

function emptySnapshot(overrides = {}) {
  return {
    stderrAvailable: true,
    stderrBytes: 0,
    stderrTruncated: false,
    stderrReadError: '',
    stderrTail: '',
    ...overrides,
  };
}

test('attachChromeShellStartupDiagnostics reports an empty snapshot before any stderr traffic', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  assert.deepEqual(diagnostics.snapshot(), emptySnapshot());
  assert.equal(stderr.listenerCount('data'), 1);
  assert.equal(stderr.listenerCount('error'), 1);
});

test('attachChromeShellStartupDiagnostics tolerates a child process without stderr', () => {
  const diagnostics = attachChromeShellStartupDiagnostics({});
  assert.deepEqual(diagnostics.snapshot(), emptySnapshot({ stderrAvailable: false }));
  assert.deepEqual(
    attachChromeShellStartupDiagnostics(null).snapshot(),
    emptySnapshot({ stderrAvailable: false }),
  );
});

test('attachChromeShellStartupDiagnostics accumulates Buffer chunks into the snapshot', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  stderr.emit('data', Buffer.from('first line\n', 'utf8'));
  stderr.emit('data', Buffer.from('second line\n', 'utf8'));
  assert.deepEqual(
    diagnostics.snapshot(),
    emptySnapshot({ stderrBytes: 23, stderrTail: 'first line\nsecond line\n' }),
  );
});

test('attachChromeShellStartupDiagnostics encodes string chunks as utf8', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  stderr.emit('data', '中文');
  assert.deepEqual(diagnostics.snapshot(), emptySnapshot({ stderrBytes: 6, stderrTail: '中文' }));
});

test('attachChromeShellStartupDiagnostics keeps only the trailing stderr window but counts every byte', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  stderr.emit('data', Buffer.from('a'.repeat(1000), 'utf8'));
  stderr.emit('data', Buffer.from('b'.repeat(1000), 'utf8'));
  const snapshot = diagnostics.snapshot();
  assert.equal(snapshot.stderrBytes, 2000);
  assert.equal(snapshot.stderrTruncated, true);
  assert.equal(snapshot.stderrTail.length, MAX_STDERR_BYTES);
  assert.equal(snapshot.stderrTail, 'a'.repeat(800) + 'b'.repeat(1000));
});

test('attachChromeShellStartupDiagnostics flags truncation once a single chunk exceeds the window', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  stderr.emit('data', Buffer.from('x'.repeat(MAX_STDERR_BYTES + 1), 'utf8'));
  const snapshot = diagnostics.snapshot();
  assert.equal(snapshot.stderrBytes, MAX_STDERR_BYTES + 1);
  assert.equal(snapshot.stderrTruncated, true);
  assert.equal(snapshot.stderrTail, 'x'.repeat(MAX_STDERR_BYTES));
});

test('attachChromeShellStartupDiagnostics records the stderr read error code', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  stderr.emit('error', { code: 'EIO' });
  assert.equal(diagnostics.snapshot().stderrReadError, 'EIO');
});

test('attachChromeShellStartupDiagnostics falls back to a default read error code', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  stderr.emit('error', new Error('boom'));
  assert.equal(diagnostics.snapshot().stderrReadError, 'STDERR_READ_FAILED');
});

test('attachChromeShellStartupDiagnostics ignores stderr traffic after stop and freezes the tail', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  stderr.emit('data', Buffer.from('kept', 'utf8'));
  assert.equal(diagnostics.snapshot().stderrTail, 'kept');
  diagnostics.stop();
  assert.deepEqual(diagnostics.snapshot(), emptySnapshot({ stderrBytes: 4 }));
  stderr.emit('data', Buffer.from('dropped', 'utf8'));
  stderr.emit('error', { code: 'EIO' });
  assert.deepEqual(diagnostics.snapshot(), emptySnapshot({ stderrBytes: 4 }));
});

test('attachChromeShellStartupDiagnostics returns independent snapshots across calls', () => {
  const stderr = createStderrDouble();
  const diagnostics = attachChromeShellStartupDiagnostics({ stderr: stderr });
  const first = diagnostics.snapshot();
  first.stderrTail = 'mutated';
  assert.equal(diagnostics.snapshot().stderrTail, '');
});

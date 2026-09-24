import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { openShellFolder, revealShellItemInFolder } from './shellItemRevealer.js';

function fakeChild({ onSpawn, onError } = {}) {
  const child = new EventEmitter();
  child.unref = () => {};
  queueMicrotask(() => {
    if (onSpawn) child.emit('spawn');
    if (onError) child.emit('error', onError);
  });
  return child;
}

test('non-Windows platforms delegate straight to the Electron shell API', () => {
  const calls = [];
  const result = revealShellItemInFolder('C:/tmp/a.png', {
    shellApi: { showItemInFolder: (p) => calls.push(p) },
    platform: 'darwin',
  });
  assert.deepEqual(result, { foregroundRequested: false });
  assert.deepEqual(calls, ['C:/tmp/a.png']);
});

test('Windows reveal opens a dedicated explorer window and keeps shell API as fallback', () => {
  const spawned = [];
  const calls = [];
  const child = fakeChild({ onError: new Error('gone') });
  const result = revealShellItemInFolder('C:/tmp/a.png', {
    shellApi: { showItemInFolder: (p) => calls.push(p) },
    platform: 'win32',
    spawnProcess: (command, args, options) => {
      spawned.push({ command, args, options });
      return child;
    },
    logEvent: () => {},
  });
  assert.deepEqual(result, { foregroundRequested: true, strategy: 'new-explorer-window' });
  assert.deepEqual(spawned[0].args, ['/n,/select,C:/tmp/a.png']);
  assert.equal(spawned[0].options.detached, true);
  assert.equal(spawned[0].options.stdio, 'ignore');
  assert.deepEqual(calls, []);
});

test('a failing explorer spawn falls back to the Electron shell API', async () => {
  const calls = [];
  const result = revealShellItemInFolder('C:/tmp/a.png', {
    shellApi: { showItemInFolder: (p) => calls.push(p) },
    platform: 'win32',
    spawnProcess: () => {
      throw new Error('blocked by policy');
    },
    logEvent: () => {},
  });
  assert.deepEqual(result, { foregroundRequested: false, strategy: 'electron-shell-fallback' });
  assert.deepEqual(calls, ['C:/tmp/a.png']);
});

test('an explorer process that errors after spawn releases the fallback', async () => {
  const calls = [];
  revealShellItemInFolder('C:/tmp/a.png', {
    shellApi: { showItemInFolder: (p) => calls.push(p) },
    platform: 'win32',
    spawnProcess: () => fakeChild({ onError: new Error('EACCES') }),
    logEvent: () => {},
  });
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(calls, ['C:/tmp/a.png']);
});

test('openShellFolder validates the shell API and opens the folder argument', () => {
  assert.throws(() => openShellFolder('C:/tmp', { shellApi: {} }), /openPath must be a function/);
  const opened = [];
  const result = openShellFolder('C:/tmp', {
    shellApi: { openPath: (p) => opened.push(p) },
    platform: 'linux',
  });
  assert.deepEqual(result, { foregroundRequested: false });
  assert.deepEqual(opened, ['C:/tmp']);
});

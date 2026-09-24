import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProcessStartError, MediaTaskCancelledError } from './mediaTaskQueue.js';

test('a spawn failure is wrapped with the command, args and cwd context', () => {
  const cause = Object.assign(new Error('spawn ENOENT'), {
      code: 'ENOENT',
      errno: -4058,
      syscall: 'spawn F:/runtime/ffmpeg',
      path: 'F:/runtime/ffmpeg',
    }),
    error = createProcessStartError(
      'F:/runtime/ffmpeg',
      ['-y', 7],
      { cwd: 'F:/CanvasPro' },
      cause,
      2,
    );
  assert.ok(error instanceof Error);
  assert.equal(error.name, 'MediaTaskProcessStartError');
  assert.equal(error.message, 'Failed to start ffmpeg: spawn ENOENT');
  assert.equal(error.command, 'F:/runtime/ffmpeg');
  assert.equal(error.commandLabel, 'ffmpeg');
  assert.deepEqual(error.args, ['-y', '7']);
  assert.equal(error.cwd, 'F:/CanvasPro');
  assert.equal(error.attempt, 2);
  assert.equal(error.code, 'ENOENT');
  assert.equal(error.errno, -4058);
  assert.equal(error.syscall, 'spawn F:/runtime/ffmpeg');
  assert.equal(error.path, 'F:/runtime/ffmpeg');
  assert.equal(error.cause, cause);
});

test('a fuzzy cause still produces a labelled error', () => {
  const error = createProcessStartError('python', [], {}, 'boom', 1);
  assert.equal(error.message, 'Failed to start python: boom');
  assert.equal(error.commandLabel, 'python');
  assert.equal(error.cause, undefined);
  assert.deepEqual(error.args, []);
  assert.equal(error.cwd, '');
  assert.equal('code' in error, false);
});

test('an empty command falls back to a generic tool label', () => {
  assert.equal(createProcessStartError('', null, null, 'nope', 1).commandLabel, 'media tool');
  assert.equal(createProcessStartError('   ', null, null, 'nope', 1).commandLabel, 'media tool');
});

test('the cancellation error keeps its name and default message', () => {
  const error = new MediaTaskCancelledError();
  assert.ok(error instanceof Error);
  assert.equal(error.name, 'MediaTaskCancelledError');
  assert.equal(error.message, 'Media task cancelled');
  assert.equal(new MediaTaskCancelledError('stopped').message, 'stopped');
});

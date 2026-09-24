import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  createSystemNotificationSoundFileService,
  listNotificationSoundMp3Files,
  playNotificationSoundFile,
} from './notificationSoundFiles.js';

function createSoundDir() {
  const root = mkdtempSync(path.join(tmpdir(), 'notification-sound-'));
  const soundDir = path.join(root, 'assets', 'sounds');
  mkdirSync(soundDir, { recursive: true });
  writeFileSync(path.join(soundDir, 'b.mp3'), 'b', 'utf8');
  writeFileSync(path.join(soundDir, 'a.mp3'), 'a', 'utf8');
  writeFileSync(path.join(soundDir, 'notes.txt'), 'x', 'utf8');
  writeFileSync(path.join(root, 'outside.mp3'), 'x', 'utf8');
  return { root, soundDir };
}

test('listNotificationSoundMp3Files returns sorted mp3 entries only', async () => {
  const { root, soundDir } = createSoundDir();
  try {
    const result = await listNotificationSoundMp3Files({ directory: soundDir });
    assert.equal(result.success, true);
    assert.deepEqual(
      result.files.map((file) => file.name),
      ['a.mp3', 'b.mp3'],
    );
    assert.equal(result.files[0].path, path.join(soundDir, 'a.mp3'));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('listNotificationSoundMp3Files rejects relative or missing directories', async () => {
  await assert.rejects(() => listNotificationSoundMp3Files({ directory: 'assets/sounds' }), /绝对路径/);
  assert.deepEqual(await listNotificationSoundMp3Files({}), { success: true, files: [] });
});

test('playNotificationSoundFile resolves absolute and app-relative paths on win32', async () => {
  const { root, soundDir } = createSoundDir();
  const spawned = [];
  try {
    const absolute = await playNotificationSoundFile(
      { filePath: path.join(soundDir, 'a.mp3'), volume: 0.5 },
      {
        appRoot: root,
        platform: 'win32',
        spawnProcess: (command, args, options) => {
          spawned.push({ command, args, options });
          return { once: (event, handler) => event === 'exit' && setImmediate(() => handler(0, null)) };
        },
      },
    );
    assert.equal(absolute.success, true);
    assert.equal(absolute.played, true);
    assert.equal(absolute.volume, 0.5);
    assert.equal(spawned[0].command, 'powershell.exe');
    assert.equal(spawned[0].args[3], '-Command');
    assert.match(spawned[0].args[4], /assets[\\/]sounds[\\/]a\.mp3/);
    assert.equal(spawned[0].options.windowsHide, true);

    const relative = await playNotificationSoundFile(
      { path: 'assets/sounds/b.mp3' },
      {
        appRoot: root,
        platform: 'win32',
        spawnProcess: () => ({
          once: (event, handler) => event === 'exit' && setImmediate(() => handler(0, null)),
        }),
      },
    );
    assert.equal(relative.success, true);
    assert.equal(relative.volume, 0.7);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('playNotificationSoundFile refuses relative paths outside the app root', async () => {
  const { root } = createSoundDir();
  try {
    await assert.rejects(
      () => playNotificationSoundFile({ path: '../outside.mp3' }, { appRoot: path.join(root, 'assets') }),
      /超出应用目录/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('playNotificationSoundFile reports unsupported platforms without spawning', async () => {
  const { root, soundDir } = createSoundDir();
  let spawnCount = 0;
  try {
    const result = await playNotificationSoundFile(
      { filePath: path.join(soundDir, 'a.mp3') },
      {
        appRoot: root,
        platform: 'linux',
        spawnProcess: () => {
          spawnCount += 1;
        },
      },
    );
    assert.deepEqual(
      { success: result.success, played: result.played, reason: result.reason },
      { success: false, played: false, reason: 'unsupported-platform' },
    );
    assert.equal(spawnCount, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('playNotificationSoundFile reports spawn and non-zero exit failures', async () => {
  const { root, soundDir } = createSoundDir();
  const events = [];
  try {
    const spawnFailure = await playNotificationSoundFile(
      { filePath: path.join(soundDir, 'a.mp3') },
      {
        appRoot: root,
        platform: 'win32',
        logEvent: (event) => events.push(event),
        spawnProcess: () => {
          throw new Error('blocked');
        },
      },
    );
    assert.equal(spawnFailure.reason, 'spawn-error');
    assert.equal(spawnFailure.success, false);
    assert.match(spawnFailure.error, /blocked/);

    const exitFailure = await playNotificationSoundFile(
      { filePath: path.join(soundDir, 'a.mp3') },
      {
        appRoot: root,
        platform: 'win32',
        logEvent: (event) => events.push(event),
        spawnProcess: () => ({
          once: (event, handler) => event === 'exit' && setImmediate(() => handler(1, null)),
        }),
      },
    );
    assert.equal(exitFailure.reason, 'player-exit');
    assert.equal(exitFailure.exitCode, 1);
    assert.equal(events.length, 2);
    assert.equal(events[0].type, 'notification_sound.play_failed');
    assert.equal(events[0].source, 'main');
    assert.equal(events[0].context.reason, 'spawn-error');
    assert.equal(events[1].context.reason, 'player-exit');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createSystemNotificationSoundFileService exposes list/open/play with playback urls', async () => {
  const { root } = createSoundDir();
  const opened = [];
  const beeps = [];
  try {
    const service = createSystemNotificationSoundFileService({
      appRoot: root,
      openPath: async (target) => opened.push(target),
      beep: () => beeps.push('beep'),
      platform: 'win32',
      spawnProcess: () => ({
        once: (event, handler) => event === 'exit' && setImmediate(() => handler(0, null)),
      }),
    });
    const listed = await service.listSystemNotificationSoundFiles();
    assert.deepEqual(
      listed.files.map((file) => file.name),
      ['a.mp3', 'b.mp3'],
    );
    assert.equal(listed.files[0].playbackUrl, '/assets/sounds/a.mp3');

    const openedResult = await service.openSystemNotificationSoundFolder();
    assert.equal(openedResult.success, true);
    assert.equal(opened[0], path.join(root, 'assets', 'sounds'));

    const systemPlay = service.playNotificationSound({ system: true });
    assert.deepEqual(systemPlay, { success: true, played: true, system: true });
    assert.equal(beeps.length, 1);

    const filePlay = await service.playNotificationSound({ filePath: path.join(root, 'assets', 'sounds', 'a.mp3') });
    assert.equal(filePlay.success, true);
    assert.equal(filePlay.played, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('createSystemNotificationSoundFileService degrades when beep is unavailable', () => {
  const service = createSystemNotificationSoundFileService({ appRoot: '.' });
  assert.deepEqual(service.playNotificationSound({ system: true }), {
    success: false,
    played: false,
    reason: 'unavailable',
  });
});

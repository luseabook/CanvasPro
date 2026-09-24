import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { recordDiagnosticsLaunchVersion } from './diagnosticsLaunchVersion.js';

function createLogDir() {
  return mkdtempSync(path.join(tmpdir(), 'aic-launch-version-'));
}

function appWithVersion(version) {
  return { getVersion: () => version };
}

test('recordDiagnosticsLaunchVersion writes the marker on a first launch', () => {
  const logDir = createLogDir();
  try {
    const record = recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion('0.4.12') });
    assert.deepEqual(record, {
      currentVersion: '0.4.12',
      previousVersion: '',
      versionChanged: null,
      markerSaved: true,
    });
    const markerPath = path.join(logDir, 'launch-version.json');
    assert.equal(existsSync(markerPath), true);
    assert.deepEqual(JSON.parse(readFileSync(markerPath, 'utf8')), { version: '0.4.12' });
    assert.deepEqual(readdirSync(logDir), ['launch-version.json']);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('recordDiagnosticsLaunchVersion reports an unchanged relaunch', () => {
  const logDir = createLogDir();
  try {
    recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion('0.4.12') });
    const record = recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion('0.4.12') });
    assert.deepEqual(record, {
      currentVersion: '0.4.12',
      previousVersion: '0.4.12',
      versionChanged: false,
      markerSaved: true,
    });
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('recordDiagnosticsLaunchVersion reports a changed version', () => {
  const logDir = createLogDir();
  try {
    recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion('0.4.12') });
    const record = recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion('0.5.0') });
    assert.deepEqual(record, {
      currentVersion: '0.5.0',
      previousVersion: '0.4.12',
      versionChanged: true,
      markerSaved: true,
    });
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('recordDiagnosticsLaunchVersion accepts a single prerelease or build suffix', () => {
  const logDir = createLogDir();
  try {
    for (const candidate of ['1.2.3-beta.1', '1.2.3+build.7']) {
      const record = recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion(candidate) });
      assert.equal(record.currentVersion, candidate);
      assert.equal(record.markerSaved, true);
    }
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('recordDiagnosticsLaunchVersion rejects a combined prerelease plus build suffix', () => {
  const logDir = createLogDir();
  try {
    const record = recordDiagnosticsLaunchVersion({
      logDir: logDir,
      app: appWithVersion('1.2.3-rc.1+build.7'),
    });
    assert.deepEqual(record, {
      currentVersion: '',
      previousVersion: '',
      versionChanged: null,
      markerSaved: false,
    });
    assert.deepEqual(readdirSync(logDir), []);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('recordDiagnosticsLaunchVersion rejects unusable versions without writing a marker', () => {
  const logDir = createLogDir();
  try {
    const empty = { currentVersion: '', previousVersion: '', versionChanged: null, markerSaved: false };
    for (const candidate of [
      'v1.2.3',
      '1.2',
      '1.2.3.4',
      '',
      undefined,
      null,
      42,
      { version: '1.2.3' },
      '1.2.3-' + 'x'.repeat(120),
    ]) {
      assert.deepEqual(
        recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion(candidate) }),
        empty,
      );
    }
    assert.equal(existsSync(path.join(logDir, 'launch-version.json')), false);
    assert.deepEqual(readdirSync(logDir), []);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('recordDiagnosticsLaunchVersion without an app reports an empty record', () => {
  const logDir = createLogDir();
  try {
    assert.deepEqual(recordDiagnosticsLaunchVersion({ logDir: logDir }), {
      currentVersion: '',
      previousVersion: '',
      versionChanged: null,
      markerSaved: false,
    });
    assert.deepEqual(readdirSync(logDir), []);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('recordDiagnosticsLaunchVersion requires a log dir before its guarded body', () => {
  assert.throws(() => recordDiagnosticsLaunchVersion(), TypeError);
  assert.throws(() => recordDiagnosticsLaunchVersion({ app: appWithVersion('0.4.12') }), TypeError);
});

test('recordDiagnosticsLaunchVersion ignores a corrupt marker without leaving temp files', () => {
  const logDir = createLogDir();
  try {
    writeFileSync(path.join(logDir, 'launch-version.json'), 'not json at all', 'utf8');
    const record = recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion('0.4.12') });
    assert.deepEqual(record, {
      currentVersion: '0.4.12',
      previousVersion: '',
      versionChanged: null,
      markerSaved: true,
    });
    assert.deepEqual(readdirSync(logDir), ['launch-version.json']);
    assert.deepEqual(JSON.parse(readFileSync(path.join(logDir, 'launch-version.json'), 'utf8')), {
      version: '0.4.12',
    });
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

test('recordDiagnosticsLaunchVersion ignores a marker without a usable version string', () => {
  const logDir = createLogDir();
  try {
    writeFileSync(path.join(logDir, 'launch-version.json'), JSON.stringify({ version: 'nope' }), 'utf8');
    const record = recordDiagnosticsLaunchVersion({ logDir: logDir, app: appWithVersion('0.4.12') });
    assert.equal(record.previousVersion, '');
    assert.equal(record.versionChanged, null);
  } finally {
    rmSync(logDir, { recursive: true, force: true });
  }
});

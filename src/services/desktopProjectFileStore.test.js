// Temporary files only. Never touch user projects or their recent-project list.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { clearRecoverySnapshotIfMatches, getRecoverySnapshotInfo, readProjectJson, readRecoverySnapshot, writeRecoverySnapshot } from './desktopProjectFileStore.js';

test('native project reader preserves supported old/new data and refuses blank-looking unknown formats', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'canvas-project-read-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  for (const [name, data] of [
    ['multi.aicanvas', { canvases: [{ id: 'c1', nodes: [], edges: [] }], activeCanvasId: 'c1' }],
    ['single.aicproj', { v2_nodes: { old: { id: 'old' } }, v2_edges: {} }],
    ['legacy.json', { nodes: [], edges: [] }],
  ]) {
    const filename = path.join(directory, name);
    writeFileSync(filename, JSON.stringify(data), 'utf8');
    assert.deepEqual(readProjectJson(filename), data);
  }
  for (const [name, data] of [
    ['unknown.aicanvas', { version: 2, content: { nodes: [] } }],
    ['error.aicproj', { error: 'missing' }],
    ['bad.json', { canvases: [{ nodes: [] }] }],
  ]) {
    const filename = path.join(directory, name);
    const original = JSON.stringify(data);
    writeFileSync(filename, original, 'utf8');
    assert.throws(() => readProjectJson(filename), /未以空画布替代/);
    assert.equal(readFileSync(filename, 'utf8'), original);
  }
});

test('invalid recovery snapshots are reported as present but invalid and never deleted', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'canvas-recovery-read-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'recovery.json');
  assert.equal(getRecoverySnapshotInfo(filename).exists, false);
  for (const content of [
    '{not valid json',
    JSON.stringify({ version: 1, savedAt: 1000, data: {} }),
    JSON.stringify({ version: 1, savedAt: 1000, data: { canvases: [] } }),
    JSON.stringify({ version: 2, savedAt: 1000, data: { nodes: [] } }),
  ]) {
    writeFileSync(filename, content, 'utf8');
    const info = getRecoverySnapshotInfo(filename);
    assert.equal(info.exists, true);
    assert.equal(info.invalid, true);
    assert.equal(readRecoverySnapshot(filename), null);
    assert.equal(readFileSync(filename, 'utf8'), content);
  }
  writeFileSync(filename, JSON.stringify({ version: 1, savedAt: 1000, projectId: 'p',
    data: { canvases: [{ id: 'c', nodes: [], edges: [] }] } }), 'utf8');
  assert.equal(readRecoverySnapshot(filename)?.projectId, 'p');
  assert.equal(getRecoverySnapshotInfo(filename, { currentLastModified: 10 }).isNewerThanProject, true);
});

test('invalid recovery writes do not replace a valid snapshot', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'canvas-recovery-write-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'recovery.json');
  writeRecoverySnapshot(filename, { projectId: 'keep', multiData: {
    canvases: [{ id: 'c', nodes: [{ id: 'n' }], edges: [] }], activeCanvasId: 'c',
  } });
  const before = readFileSync(filename, 'utf8');
  assert.equal(readRecoverySnapshot(filename).data.canvases[0].nodes[0].id, 'n');
  for (const multiData of [{}, { canvases: [] }, { canvases: [{ id: 'c', nodes: 'broken', edges: [] }] }]) {
    assert.throws(() => writeRecoverySnapshot(filename, { projectId: 'keep', multiData }), Error);
    assert.equal(readFileSync(filename, 'utf8'), before);
  }
});

test('snapshot identity and revision guard prevent cross-project overwrite and stale deletion', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'canvas-recovery-guard-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'recovery.json');
  const first = { projectId: 'p', filename: 'p.aicanvas', recentId: 'recent-p',
    displayPath: 'C:/projects/p.aicanvas', multiData: { canvases: [{ id: 'c', nodes: [{ id: 'old' }], edges: [] }] } };
  writeRecoverySnapshot(filename, first);
  const before = readFileSync(filename, 'utf8');
  const token = { projectId: 'p', revision: getRecoverySnapshotInfo(filename).revision };
  assert.match(token.revision, /^[a-f0-9]{64}$/);
  for (const change of [{ projectId: 'q' }, { recentId: 'other' }, { filename: 'other.aicanvas' },
    { displayPath: 'D:/projects/p.aicanvas' }]) {
    assert.throws(() => writeRecoverySnapshot(filename, { ...first, ...change }), error =>
      error.code === 'RECOVERY_SNAPSHOT_PROTECTED');
    assert.equal(readFileSync(filename, 'utf8'), before);
  }
  assert.equal(clearRecoverySnapshotIfMatches(filename, {}).cleared, false);
  assert.equal(clearRecoverySnapshotIfMatches(filename, { ...token, revision: '0'.repeat(64) }).cleared, false);
  writeRecoverySnapshot(filename, { ...first, multiData: {
    canvases: [{ id: 'c', nodes: [{ id: 'new' }], edges: [] }],
  } });
  assert.equal(clearRecoverySnapshotIfMatches(filename, token).reason, 'changed');
  assert.equal(readRecoverySnapshot(filename).data.canvases[0].nodes[0].id, 'new');
  const current = { projectId: 'p', revision: getRecoverySnapshotInfo(filename).revision };
  assert.equal(clearRecoverySnapshotIfMatches(filename, current).cleared, true);
  assert.equal(getRecoverySnapshotInfo(filename).exists, false);
});

test('unrecognized recovery file remains untouched after later save or clear request', t => {
  const directory = mkdtempSync(path.join(tmpdir(), 'canvas-recovery-invalid-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'recovery.json'), raw = '{"version":1,"savedAt":1000,"data":{"nodes":[]}}';
  writeFileSync(filename, raw, 'utf8');
  assert.equal(getRecoverySnapshotInfo(filename).invalid, true);
  assert.throws(() => writeRecoverySnapshot(filename, { projectId: 'p',
    multiData: { canvases: [{ id: 'c', nodes: [], edges: [] }] } }), error =>
    error.code === 'RECOVERY_SNAPSHOT_PROTECTED');
  assert.equal(clearRecoverySnapshotIfMatches(filename, { projectId: 'p', revision: '0'.repeat(64) }).cleared, false);
  assert.equal(readFileSync(filename, 'utf8'), raw);
});

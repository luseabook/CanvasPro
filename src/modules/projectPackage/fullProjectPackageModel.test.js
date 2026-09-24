import test from 'node:test';
import assert from 'node:assert/strict';
import { FULL_PACKAGE_LIMITS as L, assertPortablePath, validateFullProject, validateFullPackageManifest, createArchiveEntryGuard } from './fullProjectPackageModel.js';
function project() { return { canvases: [{ id: 'a', nodes: [{ id: 'n', type: 'source-video' }], edges: [] }, { id: 'b', nodes: [], edges: [] }], activeCanvasId: 'b' }; }
function manifest() { return { schemaVersion: 1, packageKind: 'aiCanvas.projectPackage', projectFile: 'project/project.aicanvas', assets: [{ localPath: 'output/a.mp4', archivePath: 'assets/output/a.mp4', size: 1, sha256: 'a'.repeat(64) }] }; }
function entry(fileName = 'assets/output/a.mp4', size = 1) { return { fileName, uncompressedSize: size, generalPurposeBitFlag: 0, externalFileAttributes: 0o100600 << 16 }; }
test('full project preserves empty active canvas and reports all canvases', () => { const p = project(); assert.deepEqual(validateFullProject(p), { canvasCount: 2, nodeCount: 1 }); assert.equal(p.activeCanvasId, 'b'); });
for (const bad of ['/a', '../a', 'assets/../a', 'assets\\a', 'assets/a:stream', 'assets/%61', 'assets/a?', 'assets/a#', 'assets/NUL.mp4', 'assets/a.', 'assets/ a', 'assets//a']) test('reject nonportable path ' + bad, () => assert.throws(() => assertPortablePath(bad)));
for (const [name, mutate] of Object.entries({
  duplicateCanvas: p => p.canvases.push(p.canvases[0]), absentActive: p => { p.activeCanvasId = 'missing'; },
  duplicateNode: p => p.canvases[0].nodes.push({ id: 'n' }), missingEndpoint: p => p.canvases[0].edges.push({ id: 'e', sourceId: 'n', targetId: 'missing' }),
  liveGeneration: p => { p.canvases[0].nodes[0].isGenerating = true; }, queued: p => { p.canvases[0].nodes[0].jobStatus = 'queued'; },
  rhQueue: p => { p.canvases[0].nodes[0].rhTaskStatus = 'QUEUED'; },
  runningNested: p => { p.canvases[0].nodes[0].images = [{ status: 'running' }]; }, badShape: p => { p.canvases[0].nodes = {}; },
})) test('reject inconsistent or in-flight project ' + name, () => { const p = project(); mutate(p); assert.throws(() => validateFullProject(p)); });
test('completed task provenance and held records are data, not resume authorization', () => {
  const p = project(); p.canvases[0].nodes[0].mediaTaskRecovery = { taskId: 'old', status: 'complete' }; p.canvases[0].nodes[0].storyMediaBatch = { status: 'held' };
  assert.equal(validateFullProject(p).nodeCount, 1);
});
test('prototype keys are rejected before original recursive path rewriting', () => {
  const p = project(); p.canvases[0].nodes[0].bad = JSON.parse('{"__proto__":{"polluted":true}}'); assert.throws(() => validateFullProject(p)); assert.equal({}.polluted, undefined);
});
test('legacy v1 manifest and hashes remain the format', () => assert.equal(validateFullPackageManifest(manifest()).assetsCount, 1));
for (const [name, mutate] of Object.entries({
  wrongVersion: m => { m.schemaVersion = 2; }, missingHash: m => { delete m.assets[0].sha256; },
  missingSize: m => { delete m.assets[0].size; }, mismatchPath: m => { m.assets[0].archivePath = 'assets/output/b.mp4'; },
  duplicate: m => m.assets.push({ ...m.assets[0] }), caseCollision: m => m.assets.push({ ...m.assets[0], localPath: 'output/A.mp4', archivePath: 'assets/output/A.mp4' }),
  fallbackWarning: m => { m.warnings = [{ type: 'missing-original-video-fallback' }]; }, oversize: m => { m.assets[0].size = L.assetBytes + 1; },
})) test('reject invalid manifest ' + name, () => { const m = manifest(); mutate(m); assert.throws(() => validateFullPackageManifest(m)); });
test('archive guard rejects symlinks, encryption and unknown entries', () => {
  for (const e of [{ ...entry(), externalFileAttributes: 0o120777 << 16 }, { ...entry(), generalPurposeBitFlag: 1 }, entry('unlisted.exe')]) assert.throws(() => createArchiveEntryGuard().accept(e));
});
test('archive guard rejects duplicates before writing', () => { const g = createArchiveEntryGuard(); g.accept(entry()); assert.throws(() => g.accept(entry())); });
test('archive JSON and cumulative uncompressed caps are checked', () => {
  assert.throws(() => createArchiveEntryGuard().accept(entry('manifest.json', L.manifestBytes + 1)));
  const g = createArchiveEntryGuard(); g.accept(entry('assets/output/1', L.assetBytes)); g.accept(entry('assets/output/2', L.assetBytes)); assert.throws(() => g.accept(entry('assets/output/3', 1)));
});
test('normal ZIP directory entries are accepted without file bytes', () => {
  const g = createArchiveEntryGuard(); assert.equal(g.accept({ ...entry('assets/', 0), externalFileAttributes: 0o040700 << 16 }).directory, true); assert.equal(g.files.size, 0);
});

test('graph IDs cannot address JavaScript prototype properties', () => {
  for (const id of ['__proto__', 'constructor', 'prototype']) { const p = project(); p.canvases[0].nodes[0].id = id; assert.throws(() => validateFullProject(p)); }
});
test('nonfinite JSON numbers and prototype node types are rejected', () => {
  const p = project(); p.canvases[0].nodes[0].x = Infinity; assert.throws(() => validateFullProject(p));
  const q = project(); q.canvases[0].nodes[0].type = 'constructor'; assert.throws(() => validateFullProject(q));
});
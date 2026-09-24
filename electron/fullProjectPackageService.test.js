// Offline file/ZIP tests to run only after authorization: creates temporary byte fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import yazl from 'yazl';
import { exportProjectPackageToPath } from './projectPackageService.js';
import { exportFullProjectPackage, restoreFullProjectPackage, inspectFullProjectPackage } from './fullProjectPackageService.js';
function fixture(t) {
  const base = mkdtempSync(path.join(os.tmpdir(), 'full-package-test-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const roots = {};
  for (const key of ['outputRoot', 'uploadsRoot', 'assetsRoot', 'workflowThumbsRoot']) { roots[key] = path.join(base, key); mkdirSync(roots[key]); }
  const projectRoot = path.join(base, 'projects'), tempRoot = path.join(base, 'temporary'); mkdirSync(projectRoot); mkdirSync(tempRoot);
  const bytes = Buffer.from('byte fixture, not a playable video'); writeFileSync(path.join(roots.outputRoot, 'a.mp4'), bytes);
  const data = { canvases: [{ id: 'one', nodes: [{ id: 'source', type: 'source-video', src: '/output/a.mp4', localPath: 'output/a.mp4', mediaTaskRecovery: { taskId: 'old', localPath: 'output/a.mp4' } }], edges: [] }, { id: 'two', nodes: [], edges: [] }], activeCanvasId: 'two' };
  const manifest = { schemaVersion: 1, packageKind: 'aiCanvas.projectPackage', projectFile: 'project/project.aicanvas', project: { projectName: 'Test' }, assets: [{ localPath: 'output/a.mp4', archivePath: 'assets/output/a.mp4', size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }] };
  return { base, roots, projectRoot, tempRoot, bytes, data, manifest, outputPath: path.join(base, 'all.aicpkg') };
}
async function makePackage(f, manifest = f.manifest, data = f.data, extras = []) {
  const zip = new yazl.ZipFile(); zip.addBuffer(Buffer.from(JSON.stringify(manifest)), 'manifest.json'); zip.addBuffer(Buffer.from(JSON.stringify(data)), 'project/project.aicanvas'); zip.addBuffer(f.bytes, 'assets/output/a.mp4');
  for (const [name, bytes] of extras) zip.addBuffer(bytes, name);
  await new Promise((resolve, reject) => { const stream = createWriteStream(f.outputPath); zip.once('error', reject); stream.once('error', reject); stream.once('close', resolve); zip.outputStream.pipe(stream); zip.end(); });
}
function restore(f, extra = {}) { return restoreFullProjectPackage({ packagePath: f.outputPath, roots: f.roots, projectRoot: f.projectRoot, tempRoot: f.tempRoot, confirm: async () => true, ...extra }); }
test('original v1 writer to strict full restore preserves every canvas, IDs and local bytes', async t => {
  const f = fixture(t);
  const exported = await exportFullProjectPackage({ outputPath: f.outputPath, multiData: f.data, roots: f.roots, projectName: 'Full' });
  assert.equal(exported.canvasCount, 2);
  const restored = await restore(f); assert.equal(restored.data.canvases.length, 2); assert.equal(restored.data.activeCanvasId, 'two');
  const node = restored.data.canvases[0].nodes[0]; assert.equal(node.id, 'source'); assert.match(node.localPath, /^output\/ProjectImports\/full-/);
  assert.equal(node.mediaTaskRecovery.localPath, node.localPath);
  assert.equal(readFileSync(path.join(f.roots.outputRoot, node.localPath.slice('output/'.length))).toString(), f.bytes.toString());
  assert.equal(JSON.parse(readFileSync(restored.projectPath)).activeCanvasId, 'two');
  assert.equal(readFileSync(path.join(f.roots.outputRoot, 'a.mp4')).toString(), f.bytes.toString());
});
test('same-size corrupted asset fails before persistent writes and before confirm', async t => {
  const f = fixture(t); f.manifest.assets[0].sha256 = '0'.repeat(64); await makePackage(f);
  await assert.rejects(restore(f, { confirm: () => assert.fail('must verify first') }), /SHA-256/);
  assert.equal(existsSync(path.join(f.roots.outputRoot, 'ProjectImports')), false); assert.deepEqual(readdirSync(f.projectRoot), []);
});
test('missing manifest coverage cannot bind to an existing unrelated local file', async t => {
  const f = fixture(t); f.data.canvases[0].nodes.push({ id: 'missing', localPath: 'output/unlisted.mp4' }); await makePackage(f);
  await assert.rejects(restore(f), /未包含/); assert.equal(existsSync(path.join(f.roots.outputRoot, 'ProjectImports')), false);
});
test('extra archive files rejected even if listed graph is otherwise valid', async t => {
  const f = fixture(t); await makePackage(f, f.manifest, f.data, [['assets/output/extra.mp4', Buffer.from('extra')]]);
  await assert.rejects(restore(f), /清单不一致/);
});
test('native confirmation cancellation creates no persistent files', async t => {
  const f = fixture(t); await makePackage(f); const result = await restore(f, { confirm: () => false });
  assert.equal(result.canceled, true); assert.equal(existsSync(path.join(f.roots.outputRoot, 'ProjectImports')), false); assert.deepEqual(readdirSync(f.tempRoot), []);
});
test('sender invalidated after a copy removes only owned new directories', async t => {
  const f = fixture(t); await makePackage(f); let count = 0;
  await assert.rejects(restore(f, { assertActive: () => { if (++count === 3) throw Error('window closed'); } }), /window closed/);
  assert.equal(readFileSync(path.join(f.roots.outputRoot, 'a.mp4')).toString(), f.bytes.toString());
  assert.deepEqual(readdirSync(path.join(f.roots.outputRoot, 'ProjectImports')), []); assert.deepEqual(readdirSync(f.projectRoot), []);
});
test('export refuses existing destination without truncating it', async t => {
  const f = fixture(t); writeFileSync(f.outputPath, 'keep');
  await assert.rejects(exportFullProjectPackage({ outputPath: f.outputPath, multiData: f.data, roots: f.roots })); assert.equal(readFileSync(f.outputPath, 'utf8'), 'keep');
});
test('repeated explicit restores allocate independent project and asset paths', async t => {
  const f = fixture(t); await makePackage(f); const a = await restore(f), b = await restore(f);
  assert.notEqual(a.projectPath, b.projectPath); assert.notEqual(a.data.canvases[0].nodes[0].localPath, b.data.canvases[0].nodes[0].localPath);
});
test('ambiguous HTTP virtual path is refused instead of guessing the remote host', async t => {
  const f = fixture(t); f.data.canvases[0].nodes[0].src = 'https://other.example/output/a.mp4'; await makePackage(f);
  const dir = path.join(f.base, 'inspect'); mkdirSync(dir); await assert.rejects(inspectFullProjectPackage(f.outputPath, dir), /主机歧义/);
});

test('original ZIP file errors reject the export promise instead of an unhandled emitter error', async t => {
  const f = fixture(t); const source = path.join(f.roots.outputRoot, 'a.mp4');
  await assert.rejects(exportProjectPackageToPath({ outputPath: f.outputPath, multiData: f.data, roots: f.roots,
    onProgress: event => { if (event.phase === 'zipping' && existsSync(source)) unlinkSync(source); } }));
});

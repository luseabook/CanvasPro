import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { createNodeMediaExporter, assertNodeExportSender } from './nodeMediaExportService.js';

async function fixture(t, overrides = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canvas-export-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source'), destination = path.join(root, 'dest');
  await fs.mkdir(source); await fs.mkdir(destination);
  await fs.writeFile(path.join(source, 'one.png'), 'fixture media bytes');
  const deps = { getRoots: () => ({ 'output/': source }),
    resolveLocalVirtualPath: value => path.join(source, value.slice('output/'.length)),
    chooseDirectory: async () => destination, confirmExport: async () => true, ...overrides };
  return { root, source, destination, deps, run: createNodeMediaExporter(deps) };
}
const item = (extra = {}) => ({ nodeId: 'n1', name: '镜头', kind: 'image', localPath: 'output/one.png', ...extra });
test('writes actual bytes and node-linked manifest with hash, without secrets or source paths', async t => {
  const f = await fixture(t), result = await f.run({ items: [item({ apiKey: 'secret' })] });
  assert.equal(result.status, 'complete'); assert.equal(result.manifestSaved, true);
  const bytes = await fs.readFile(path.join(result.directory, result.results[0].fileName));
  assert.equal(bytes.toString(), 'fixture media bytes');
  assert.equal(result.results[0].sha256, createHash('sha256').update(bytes).digest('hex'));
  const manifest = await fs.readFile(path.join(result.directory, 'export-manifest.json'), 'utf8');
  assert.equal(JSON.parse(manifest).results[0].nodeId, 'n1');
  assert.ok(!manifest.includes('secret')); assert.ok(!manifest.includes('output/one.png'));
});
test('cancelled directory selection creates nothing and does not confirm', async t => {
  const f = await fixture(t, { chooseDirectory: async () => '', confirmExport: () => assert.fail('must not confirm') });
  assert.equal((await f.run({ items: [item()] })).status, 'cancelled');
  assert.deepEqual(await fs.readdir(f.destination), []);
});
test('declined final native confirmation creates nothing', async t => {
  const f = await fixture(t, { confirmExport: async () => false });
  assert.equal((await f.run({ items: [item()] })).status, 'cancelled');
  assert.deepEqual(await fs.readdir(f.destination), []);
});
test('missing source returns failure and never asks for a directory', async t => {
  const f = await fixture(t, { chooseDirectory: () => assert.fail('must not choose') });
  const result = await f.run({ items: [item({ localPath: 'output/missing.png' })] });
  assert.equal(result.status, 'failed'); assert.equal(result.results[0].status, 'failed');
});
test('partial failure preserves successful bytes and reports all node IDs', async t => {
  const f = await fixture(t), result = await f.run({ items: [item(), item({ nodeId: 'n2', localPath: 'output/missing.png' })] });
  assert.equal(result.status, 'partial'); assert.equal(result.results[0].status, 'saved');
  assert.equal(result.results[1].nodeId, 'n2'); assert.equal(result.results[1].status, 'failed');
});
test('changed source during confirmation is not copied', async t => {
  const f = await fixture(t);
  f.deps.confirmExport = async () => { await fs.writeFile(path.join(f.source, 'one.png'), 'changed source'); return true; };
  const result = await createNodeMediaExporter(f.deps)({ items: [item()] });
  assert.equal(result.results[0].status, 'failed');
  assert.deepEqual(await fs.readdir(result.directory), ['export-manifest.json']);
});
test('separate exports never overwrite prior batches', async t => {
  const f = await fixture(t), first = await f.run({ items: [item()] }), second = await f.run({ items: [item()] });
  assert.notEqual(first.directory, second.directory);
  assert.deepEqual(await fs.readFile(path.join(first.directory, first.results[0].fileName)),
    await fs.readFile(path.join(second.directory, second.results[0].fileName)));
});
test('concurrent export is rejected and busy flag clears after cancellation', async t => {
  let release, entered, calls = 0;
  const ready = new Promise(resolve => { entered = resolve; });
  const f = await fixture(t, { chooseDirectory: () => {
    if (++calls > 1) return Promise.resolve('');
    entered(); return new Promise(resolve => { release = resolve; });
  } });
  const first = f.run({ items: [item()] }); await ready;
  await assert.rejects(f.run({ items: [item()] }), /正在进行/);
  release(''); await first;
  assert.equal((await f.run({ items: [item()] })).status, 'cancelled');
});
test('a resolver pointing outside the trusted roots is rejected', async t => {
  const f = await fixture(t, { resolveLocalVirtualPath: () => '/outside/one.png' });
  assert.equal((await f.run({ items: [item()] })).status, 'failed');
});
test('zero-byte and oversized sources are rejected without copying', async t => {
  const f = await fixture(t);
  await fs.writeFile(path.join(f.source, 'empty.png'), '');
  const large = await fs.open(path.join(f.source, 'large.png'), 'w');
  await large.truncate(512 * 1024 * 1024 + 1); await large.close();
  const result = await f.run({ items: [item({ localPath: 'output/empty.png' }), item({ nodeId: 'n2', localPath: 'output/large.png' })] });
  assert.equal(result.status, 'failed'); assert.equal(result.results.length, 2);
});
test('symlink source is rejected (skip only if OS disallows fixture symlinks)', async t => {
  const f = await fixture(t);
  try { await fs.symlink(path.join(f.source, 'one.png'), path.join(f.source, 'linked.png')); }
  catch (error) { if (['EPERM', 'EACCES'].includes(error.code)) { t.skip('symlink fixture unavailable'); return; } throw error; }
  assert.equal((await f.run({ items: [item({ localPath: 'output/linked.png' })] })).status, 'failed');
});
test('untrusted sender, subframe and external navigation cannot export', () => {
  const frame = { url: 'http://127.0.0.1:8778/' }, contents = { mainFrame: frame };
  const main = { isDestroyed: () => false, webContents: contents };
  const local = url => url === frame.url;
  assert.doesNotThrow(() => assertNodeExportSender({ sender: contents, senderFrame: frame }, main, local));
  assert.throws(() => assertNodeExportSender({ sender: {}, senderFrame: frame }, main, local));
  assert.throws(() => assertNodeExportSender({ sender: contents, senderFrame: { ...frame } }, main, local));
  assert.throws(() => assertNodeExportSender({ sender: contents, senderFrame: frame }, main, () => false));
});
test('renderer invalidated after confirmation does not start writing', async t => {
  let active = true;
  const f = await fixture(t, { confirmExport: async () => { active = false; return true; } });
  await assert.rejects(f.run({ items: [item()] }, { assertActive() { if (!active) throw new Error('closed'); } }));
  assert.deepEqual(await fs.readdir(f.destination), []);
});

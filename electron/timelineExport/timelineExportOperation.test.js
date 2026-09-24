import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import * as fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildTimelineExportConfirmation, createTimelineExportOperation } from './timelineExportOperation.js';

const metadata = { streams: [{ codec_type: 'video', width: 1920, height: 1080, nb_frames: '300', duration: '10',
  avg_frame_rate: '30/1', r_frame_rate: '30/1', start_time: '0' },
  { codec_type: 'audio', channels: 2, sample_rate: '48000', start_time: '0', duration: '10' }] };
const payload = () => ({ title: '工程 < & "', includeAudio: true,
  clips: [{ nodeId: 'n1', name: 'video', kind: 'video', localPath: 'output/a.mp4', startSec: 1, endSec: 3 }] });

async function fixture(t, overrides = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canvas-timeline-op-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source'), dest = path.join(root, 'destination');
  await fs.mkdir(source); await fs.mkdir(dest); await fs.writeFile(path.join(source, 'a.mp4'), 'fixture only, no decoder');
  const calls = { open: [], box: [], remembered: [], probes: 0 };
  const deps = {
    getRoots: () => ({ 'output/': source }),
    resolveLocalVirtualPath: p => path.join(source, p.slice(7)),
    probe: async () => { calls.probes += 1; return structuredClone(metadata); },
    showOpenDialog: async options => { calls.open.push(options); return { canceled: false, filePaths: [dest] }; },
    showMessageBox: async options => { calls.box.push(options); return { response: 1 }; },
    getDefaultDirectory: () => dest,
    rememberDirectory: async directory => { calls.remembered.push(directory); },
    ...overrides,
  };
  return { root, source, dest, deps, calls, run: createTimelineExportOperation(deps) };
}

test('confirmation copy is built from the resolved plan, not raw payload', () => {
  const plan = { rate: { numerator: 30, denominator: 1, width: 1920, height: 1080 }, frames: 60, includeAudio: true,
    clips: [{ name: 'video', inFrame: 30, outFrame: 90, start: 0, end: 60 }] };
  const options = buildTimelineExportConfirmation({ directory: '/tmp/out', plan, totalBytes: 1024 * 1024 * 2 });
  assert.equal(options.type, 'question');
  assert.equal(options.buttons[0], '取消');
  assert.equal(options.buttons[1], '确认导出工程');
  assert.equal(options.cancelId, 0); assert.equal(options.defaultId, 0); assert.equal(options.noLink, true);
  assert.match(options.message, /导出 1 段/);
  assert.match(options.detail, /1920×1080，30\.000 fps，2\.000 秒/);
  assert.match(options.detail, /媒体副本 2\.0 MiB/);
  assert.match(options.detail, /1\. video：源帧 30–90，时间线 0–60/);
  assert.match(options.detail, /保留合格的原始音轨/);
  assert.ok(!options.detail.includes('output/a.mp4'));
  const silent = buildTimelineExportConfirmation({ directory: '/tmp/out',
    plan: { ...plan, includeAudio: false }, totalBytes: 0 });
  assert.match(silent.detail, /明确静音/);
  assert.ok(!silent.detail.includes('保留合格的原始音轨'));
});

test('completes a real export through injected dialogs and remembers the chosen parent', async t => {
  const f = await fixture(t), result = await f.run(payload());
  assert.equal(result.status, 'complete');
  assert.equal(f.calls.probes, 1);
  assert.equal(f.calls.open.length, 1);
  assert.deepEqual(f.calls.open[0].properties, ['openDirectory', 'createDirectory']);
  assert.equal(f.calls.open[0].defaultPath, f.dest);
  assert.equal(f.calls.box.length, 1);
  assert.deepEqual(f.calls.remembered, [f.dest]);
  assert.notEqual(result.directory, f.dest);
  assert.ok(path.dirname(result.directory).startsWith(path.resolve(f.dest)));
  const xml = await fs.readFile(path.join(result.directory, 'timeline.xml'), 'utf8');
  assert.equal(createHash('sha256').update(xml).digest('hex'), result.xmlSha256);
  assert.equal(await fs.readFile(path.join(result.directory, result.results[0].fileName), 'utf8'),
    'fixture only, no decoder');
  assert.equal(await fs.readFile(path.join(f.source, 'a.mp4'), 'utf8'), 'fixture only, no decoder');
});

test('omits defaultPath when no remembered directory exists', async t => {
  const f = await fixture(t, { getDefaultDirectory: () => '' });
  await f.run(payload());
  assert.equal(f.calls.open[0].defaultPath, undefined);
  assert.ok(!Object.hasOwn(f.calls.open[0], 'defaultPath'));
});

test('cancelled directory selection writes nothing and never confirms', async t => {
  const f = await fixture(t, { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) });
  const result = await f.run(payload());
  assert.equal(result.status, 'cancelled');
  assert.equal(f.calls.box.length, 0);
  assert.deepEqual(f.calls.remembered, []);
  assert.deepEqual(await fs.readdir(f.dest), []);
});

test('rejecting the final confirmation leaves the destination untouched', async t => {
  const f = await fixture(t, { showMessageBox: async () => ({ response: 0 }) });
  const result = await f.run(payload());
  assert.equal(result.status, 'cancelled');
  assert.deepEqual(f.calls.remembered, []);
  assert.deepEqual(await fs.readdir(f.dest), []);
});

test('unsupported metadata fails before any dialog is shown', async t => {
  const f = await fixture(t, { probe: async () => ({ streams: [] }) });
  const result = await f.run(payload());
  assert.equal(result.status, 'failed');
  assert.equal(result.directory, '');
  assert.equal(f.calls.open.length, 0);
  assert.equal(f.calls.box.length, 0);
});

test('a failing directory memory never hides a finished export', async t => {
  const f = await fixture(t, { rememberDirectory: async () => { throw new Error('state file read-only'); } });
  const result = await f.run(payload());
  assert.equal(result.status, 'complete');
  assert.equal(await fs.readFile(path.join(result.directory, 'timeline.xml'), 'utf8').then(Boolean), true);
});

test('a cancelled run after a completed one reports cancelled and adds no second parent', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canvas-timeline-op-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source'), dest = path.join(root, 'destination');
  await fs.mkdir(source); await fs.mkdir(dest);
  await fs.writeFile(path.join(source, 'a.mp4'), 'fixture only, no decoder');
  const remembered = [];
  let call = 0;
  const run = createTimelineExportOperation({
    getRoots: () => ({ 'output/': source }),
    resolveLocalVirtualPath: p => path.join(source, p.slice(7)),
    probe: async () => structuredClone(metadata),
    showOpenDialog: async () => (++call === 1
      ? { canceled: false, filePaths: [dest] }
      : { canceled: true, filePaths: [] }),
    showMessageBox: async () => ({ response: 1 }),
    rememberDirectory: async directory => { remembered.push(directory); },
  });
  assert.equal((await run(payload())).status, 'complete');
  assert.equal((await run(payload())).status, 'cancelled');
  assert.deepEqual(remembered, [dest]);
  assert.equal((await fs.readdir(dest)).length, 1);
});

test('falls back to the electron dialog and passes the live parent window', async t => {
  const opened = [], boxed = [], parent = { id: 'main' };
  const f = await fixture(t);
  const dialog = {
    showOpenDialog: (window, options) => (opened.push({ window, options }), { canceled: false, filePaths: [f.dest] }),
    showMessageBox: (window, options) => (boxed.push({ window, options }), { response: 1 }),
  };
  const run = createTimelineExportOperation({ showOpenDialog: undefined, showMessageBox: undefined,
    getRoots: f.deps.getRoots, resolveLocalVirtualPath: f.deps.resolveLocalVirtualPath, probe: f.deps.probe,
    getDefaultDirectory: f.deps.getDefaultDirectory, rememberDirectory: f.deps.rememberDirectory,
    dialog, getWindow: () => parent });
  const result = await run(payload());
  assert.equal(result.status, 'complete');
  assert.equal(opened.length, 1);
  assert.equal(opened[0].window, parent);
  assert.equal(opened[0].options.title, '选择时间线工程父目录');
  assert.equal(boxed.length, 1);
  assert.equal(boxed[0].window, parent);
  assert.equal(boxed[0].options.buttons[1], '确认导出工程');
});

test('a null or throwing window lookup degrades to a parentless dialog call', async t => {
  const calls = [];
  const f = await fixture(t);
  const dialog = {
    showOpenDialog: function () {
      const options = arguments[arguments.length - 1];
      calls.push({ window: arguments.length === 2 ? arguments[0] : null, count: arguments.length, options });
      return { canceled: true, filePaths: [] };
    },
  };
  const base = { showOpenDialog: undefined, dialog,
    getRoots: f.deps.getRoots, resolveLocalVirtualPath: f.deps.resolveLocalVirtualPath, probe: f.deps.probe };
  const parentless = createTimelineExportOperation({ ...base, getWindow: () => null });
  assert.equal((await parentless(payload())).status, 'cancelled');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].count, 1);
  assert.equal(calls[0].window, null);
  assert.equal(calls[0].options.title, '选择时间线工程父目录');
  const throwing = createTimelineExportOperation({ ...base,
    getWindow: () => { throw new Error('window destroyed'); } });
  assert.equal((await throwing(payload())).status, 'cancelled');
  assert.equal(calls.length, 2);
  assert.equal(calls[1].count, 1);
});

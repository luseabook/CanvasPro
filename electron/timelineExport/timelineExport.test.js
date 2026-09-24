import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import * as fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { buildPremiereXml, xmlText } from './premiereXml.js';
import { createTimelineProbe } from './probeTimelineMedia.js';
import { createTimelineExporter } from './timelineExportService.js';
import { normalizeTimelineRequest, parseTimelineProbe, buildTimelinePlan } from '../../src/modules/timelineExport/timelineExportModel.js';

const metadata = { streams: [{ codec_type: 'video', width: 1920, height: 1080, nb_frames: '300', duration: '10',
  avg_frame_rate: '30/1', r_frame_rate: '30/1', start_time: '0' },
  { codec_type: 'audio', channels: 2, sample_rate: '48000', start_time: '0', duration: '10' }] };
const payload = () => ({ title: '工程 < & "', includeAudio: true,
  clips: [{ nodeId: 'n1', name: 'video', kind: 'video', localPath: 'output/a.mp4', startSec: 1, endSec: 3 }] });
async function fixture(t, overrides = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'canvas-timeline-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const source = path.join(root, 'source'), dest = path.join(root, 'destination');
  await fs.mkdir(source); await fs.mkdir(dest); await fs.writeFile(path.join(source, 'a.mp4'), 'fixture only, no decoder');
  const deps = { getRoots: () => ({ 'output/': source }), resolveLocalVirtualPath: p => path.join(source, p.slice(7)),
    probe: async () => structuredClone(metadata), chooseDirectory: async () => dest, confirmExport: async () => true, ...overrides };
  return { source, dest, deps, run: createTimelineExporter(deps) };
}
test('XML has an actual frame-based sequence, video and linked stereo audio', () => {
  const req = normalizeTimelineRequest(payload()), meta = parseTimelineProbe(metadata, true);
  const xml = buildPremiereXml(buildTimelinePlan(req, [meta]), path.resolve('Export & 空格'));
  assert.match(xml, /<xmeml version="5">/); assert.match(xml, /<start>0<\/start><end>60<\/end><in>30<\/in><out>90<\/out>/);
  assert.match(xml, /clipitem id="a-0-1"/); assert.match(xml, /clipitem id="a-0-2"/);
  assert.match(xml, /<file id="file-0"\/>/); assert.match(xml, /<pathurl>file:\/\//);
  assert.ok(!xml.includes('output/a.mp4')); assert.match(xml, /%20/);
  assert.equal(xmlText('< & "\u0000'), '&lt; &amp; &quot;');
});
test('silent sequence has no audio clips; no source URL or DTD external dependency', () => {
  const req = normalizeTimelineRequest({ ...payload(), includeAudio: false });
  const xml = buildPremiereXml(buildTimelinePlan(req, [parseTimelineProbe(metadata, false)]), path.resolve('export'));
  assert.ok(!xml.includes('<audio>')); assert.ok(!xml.includes('SYSTEM')); assert.ok(!xml.includes('https:'));
});
test('publishes media, hashed manifest and real XML last without altering source', async t => {
  const f = await fixture(t), result = await f.run(payload());
  assert.equal(result.status, 'complete');
  const xml = await fs.readFile(path.join(result.directory, 'timeline.xml'), 'utf8');
  assert.match(xml, /<xmeml/); assert.equal(createHash('sha256').update(xml).digest('hex'), result.xmlSha256);
  const report = JSON.parse(await fs.readFile(path.join(result.directory, 'export-manifest.json'), 'utf8'));
  assert.equal(report.results[0].nodeId, 'n1'); assert.equal(report.results[0].inFrame, 30);
  assert.equal(await fs.readFile(path.join(result.directory, result.results[0].fileName), 'utf8'), 'fixture only, no decoder');
  assert.equal(await fs.readFile(path.join(f.source, 'a.mp4'), 'utf8'), 'fixture only, no decoder');
});
test('cancel before final confirmation creates no export directory', async t => {
  const f = await fixture(t, { confirmExport: async () => false });
  assert.equal((await f.run(payload())).status, 'cancelled'); assert.deepEqual(await fs.readdir(f.dest), []);
});
test('cancel directory does not call final confirmation', async t => {
  const f = await fixture(t, { chooseDirectory: async () => '', confirmExport: () => assert.fail('no confirmation') });
  assert.equal((await f.run(payload())).status, 'cancelled');
});
test('unsupported metadata stops before any directory selection', async t => {
  const f = await fixture(t, { probe: async () => ({ streams: [] }), chooseDirectory: () => assert.fail('no writes') });
  const result = await f.run(payload()); assert.equal(result.status, 'failed'); assert.equal(result.directory, '');
});
test('source changed during confirmation blocks XML rather than hiding a failed shot', async t => {
  const f = await fixture(t); f.deps.confirmExport = async () => { await fs.writeFile(path.join(f.source, 'a.mp4'), 'changed'); return true; };
  const result = await createTimelineExporter(f.deps)(payload());
  assert.equal(result.status, 'failed'); assert.equal(result.results[0].status, 'failed');
  await assert.rejects(fs.stat(path.join(result.directory, 'timeline.xml')), { code: 'ENOENT' });
});
test('new export never overwrites previous timeline', async t => {
  const f = await fixture(t), a = await f.run(payload()), b = await f.run(payload());
  assert.notEqual(a.directory, b.directory); assert.equal(a.status, 'complete'); assert.equal(b.status, 'complete');
});
test('concurrent invocations do not start a second probe, and lock is released', async t => {
  let release, entered, count = 0;
  const ready = new Promise(resolve => { entered = resolve; });
  const f = await fixture(t, { chooseDirectory: async () => {
    if (++count > 1) return ''; entered(); return new Promise(resolve => { release = resolve; });
  } });
  const first = f.run(payload()); await ready;
  assert.equal((await f.run(payload())).status, 'failed'); release(''); await first;
  assert.equal((await f.run(payload())).status, 'cancelled');
});
test('invalidated window after confirmation creates nothing', async t => {
  let active = true;
  const f = await fixture(t, { confirmExport: async () => { active = false; return true; } });
  const result = await f.run(payload(), { assertActive() { if (!active) throw new Error('closed'); } });
  assert.equal(result.status, 'failed'); assert.deepEqual(await fs.readdir(f.dest), []);
});
test('probe adapter invokes only trusted executable with bounded no-shell arguments', async () => {
  const probe = createTimelineProbe(name => `trusted/${name}`, (tool, args, options, callback) => {
    assert.equal(tool, 'trusted/ffprobe'); assert.equal(args.at(-1), '/safe/a.mp4');
    assert.ok(args.includes('-protocol_whitelist')); assert.ok(args.includes('-format_whitelist'));
    assert.equal(options.shell, false); assert.equal(options.timeout, 15000); assert.equal(options.maxBuffer, 1048576);
    callback(null, JSON.stringify(metadata));
  });
  assert.deepEqual(await probe('/safe/a.mp4'), metadata);
});
test('missing runtime and bad probe output fail explicitly without leaking stderr', async () => {
  const missing = createTimelineProbe(() => 'ffprobe', (_tool, _args, _options, callback) => callback({ code: 'ENOENT' }, '', 'private path'));
  await assert.rejects(missing('/a.mp4'), /未找到 ffprobe/);
  const malformed = createTimelineProbe(() => 'ffprobe', (_tool, _args, _options, callback) => callback(null, 'not JSON'));
  await assert.rejects(malformed('/a.mp4'), /无效/);
});

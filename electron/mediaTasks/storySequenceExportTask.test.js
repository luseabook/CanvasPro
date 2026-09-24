import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorySequenceExportTaskHandler, validateStorySequenceExport } from './storySequenceExportTask.js';
import { buildMediaClipExportFfmpegArgs } from './mediaClipExportTask.js';
import { registerSharedMediaTaskHandlers } from './registerSharedMediaTaskHandlers.js';

function payload() { return { kind: 'storySequenceExport', src: 'output/a.mp4', nodeId: 'clip', args: {
  clips: [{ kind: 'video', src: 'output/a.mp4', start: 0, end: 2 }, { kind: 'video', src: 'data/assets/b.mov', start: 1, end: 4 }], duration: 5 } }; }
function fixture(meta = () => ({ width: 640, height: 480, duration: 5 })) {
  const events = [], task = { payload: payload() };
  const handler = createStorySequenceExportTaskHandler({ resolveMediaTaskSource: path => { events.push(`resolve:${path}`); return path; },
    ffprobeVideoMeta: async (queue, task, path) => { events.push(`probe:${path}`); return meta(path); } },
  () => async () => { events.push('native-render'); return { success: true, localPath: 'output/ClipVideo/render.mp4' }; });
  return { events, task, handler, queue: { throwIfCancelled() {} } };
}
test('dedicated task is registered alongside unchanged original mediaClipExport', () => {
  const handlers = {}; registerSharedMediaTaskHandlers({ setHandler: (kind, handler) => { handlers[kind] = handler; } }, {});
  assert.equal(typeof handlers.storySequenceExport, 'function'); assert.equal(typeof handlers.mediaClipExport, 'function');
});
test('every input is probed before entering the original renderer once', async () => {
  const f = fixture(); const result = await f.handler(f.task, f.queue);
  assert.equal(result.success, true);
  assert.deepEqual(f.events, ['resolve:output/a.mp4', 'probe:output/a.mp4', 'resolve:data/assets/b.mov', 'probe:data/assets/b.mov', 'native-render']);
});
test('late source out-of-bounds aborts before rendering any output', async () => {
  const f = fixture(path => ({ width: 640, height: 480, duration: path.endsWith('b.mov') ? 2 : 5 }));
  await assert.rejects(f.handler(f.task, f.queue), /第2段/); assert.equal(f.events.includes('native-render'), false);
});
test('missing input/probe failure cannot become a partial successful sequence', async () => {
  const f = fixture(() => { throw new Error('missing file'); });
  await assert.rejects(f.handler(f.task, f.queue), /missing file/); assert.equal(f.events.includes('native-render'), false);
});
test('unknown duration and absent video stream are rejected', async () => {
  for (const meta of [{ width: 640, height: 480, duration: 0 }, { width: 0, height: 0, duration: 5 }]) {
    const f = fixture(() => meta); await assert.rejects(f.handler(f.task, f.queue)); assert.equal(f.events.includes('native-render'), false);
  }
});
test('cancellation is checked before probing and before rendering', async () => {
  const f = fixture(); let calls = 0;
  f.queue.throwIfCancelled = () => { if (++calls === 3) throw new Error('cancelled'); };
  await assert.rejects(f.handler(f.task, f.queue), /cancelled/); assert.equal(f.events.includes('native-render'), false);
});
test('strict payload rejects remote/absolute/traversal/encoded sources', () => {
  for (const src of ['https://example.org/a.mp4', 'C:/a.mp4', 'output/../a.mp4', 'output/%2e%2e/a.mp4', 'output/a.mp4?x=1']) {
    const p = payload(); p.args.clips[1].src = src; assert.throws(() => validateStorySequenceExport(p));
  }
});
test('malformed later clip is rejected rather than filtered by the legacy normalizer', () => {
  for (const clip of [null, { kind: 'video', src: 'output/a.mp4', start: 3, end: 2 }, { kind: 'image', src: 'output/a.png', start: 0, end: 2 }]) {
    const p = payload(); p.args.clips[1] = clip; assert.throws(() => validateStorySequenceExport(p));
  }
});
test('arbitrary args, audio tracks, wrong duration and excess clips are rejected', () => {
  const p = payload(); p.args.audioSrc = 'output/audio.mp3'; assert.throws(() => validateStorySequenceExport(p));
  delete p.args.audioSrc; p.args.duration = 100; assert.throws(() => validateStorySequenceExport(p));
  p.args.clips = Array(61).fill(p.args.clips[0]); assert.throws(() => validateStorySequenceExport(p));
});
test('existing renderer argument builder handles mixed audible/silent segments and scaling without running ffmpeg', () => {
  const args = buildMediaClipExportFfmpegArgs({ clips: [
    { src: 'a.mp4', abs: '/a.mp4', kind: 'video', start: 0, end: 2, hasAudio: true },
    { src: 'b.mp4', abs: '/b.mp4', kind: 'video', start: 1, end: 4, hasAudio: false },
  ], outputWidth: 640, outputHeight: 480, fps: 30, outAbs: '/result.mp4' });
  const filter = args[args.indexOf('-filter_complex') + 1];
  assert.match(filter, /concat=n=2:v=1:a=0/); assert.match(filter, /anullsrc/); assert.match(filter, /scale=640:480/);
  assert.equal(args.at(-1), '/result.mp4');
});

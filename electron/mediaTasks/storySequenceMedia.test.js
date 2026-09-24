import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorySequenceExportTaskHandler, validateStorySequenceExport } from './storySequenceExportTask.js';
import { buildMediaClipExportFfmpegArgs } from './mediaClipExportTask.js';

function payload() {
  return { kind: 'storySequenceExport', nodeId: 'clip', src: 'output/still.png', args: { mediaVersion: 2,
    clips: [{ kind: 'image', src: 'output/still.png', start: 0, end: 8 }, { kind: 'video', src: 'output/video.mp4', start: 0, end: 6 }], duration: 14,
    audioClips: [{ kind: 'audio', src: 'output/speech.wav', start: 1, end: 5, timelineStart: 2, timelineEnd: 6, volume: 0.25, muted: false }] } };
}
function fixture() {
  const events = [], task = { payload: payload() };
  const image = { streams: [{ codec_type: 'video', codec_name: 'png', width: 640, height: 480, nb_read_frames: '1' }] };
  const audio = { streams: [{ codec_type: 'audio', duration: '20' }], format: { duration: '20' } };
  const queue = { throwIfCancelled() {}, runProcess: async (task, tool, args) => {
    assert.equal(tool, 'ffprobe'); events.push({ probe: args.at(-1), args });
    return { stdout: Buffer.from(JSON.stringify(args.at(-1).endsWith('.png') ? image : audio)) };
  } };
  const dependencies = { resolveMediaTaskSource: src => { events.push({ resolve: src }); return src; },
    getRuntimeToolOrFallback: tool => tool,
    ffprobeVideoMeta: async (queue, task, path) => { events.push({ probe: path }); return { width: 640, height: 480, duration: 6 }; } };
  const handler = createStorySequenceExportTaskHandler(dependencies, () => async (task) => { events.push({ render: task.payload }); return { success: true }; });
  return { events, task, image, audio, queue, handler };
}

test('v2 validates explicit image/video and one audio without changing the dedicated task kind', () => {
  assert.deepEqual(validateStorySequenceExport(payload()).map(c => c.kind), ['image', 'video']);
  const old = payload(); delete old.args.mediaVersion; assert.throws(() => validateStorySequenceExport(old));
});
test('all visual and audio inputs are sequentially probed before the original renderer is entered once', async () => {
  const f = fixture(); assert.equal((await f.handler(f.task, f.queue)).success, true);
  assert.deepEqual(f.events.filter(e => e.probe).map(e => e.probe), ['output/still.png', 'output/video.mp4', 'output/speech.wav']);
  assert.equal(f.events.filter(e => e.render).length, 1); assert.ok(f.events.at(-1).render);
  const args = f.events.find(e => e.probe === 'output/still.png').args;
  assert.ok(args.includes('-count_frames')); assert.ok(args.includes('%+#2'));
});
test('late audio out-of-range stops before rendering; container length does not override a shorter known stream', async () => {
  const f = fixture(); f.audio.streams[0].duration = '4';
  await assert.rejects(f.handler(f.task, f.queue), /音轨出点/); assert.equal(f.events.some(e => e.render), false);
});
test('audio may use finite container duration when stream duration is unavailable', async () => {
  const f = fixture(); f.audio.streams[0].duration = 'N/A';
  assert.equal((await f.handler(f.task, f.queue)).success, true);
});
test('muted audio is still probed, never silently accepted with an invalid binding', async () => {
  const f = fixture(); f.task.payload.args.audioClips[0].muted = true; f.audio.streams = [];
  await assert.rejects(f.handler(f.task, f.queue), /音频/); assert.equal(f.events.some(e => e.render), false);
});
test('probe errors are not converted into silent image or guessed audio success', async () => {
  const f = fixture(); f.queue.runProcess = async () => { throw new Error('missing local file'); };
  await assert.rejects(f.handler(f.task, f.queue), /missing local file/); assert.equal(f.events.some(e => e.render), false);
});
test('cancellation between probes prevents the renderer from starting', async () => {
  const f = fixture(); let count = 0;
  f.queue.throwIfCancelled = () => { if (++count === 2) throw new Error('cancelled'); };
  await assert.rejects(f.handler(f.task, f.queue), /cancelled/); assert.equal(f.events.some(e => e.render), false);
});
test('mutation during preflight neither probes an unvalidated new audio path nor renders a changed request', async () => {
  const f = fixture(), run = f.queue.runProcess;
  f.queue.runProcess = async (...args) => {
    f.task.payload.args.audioClips[0].src = 'https://untrusted.example/changed.wav'; return run(...args);
  };
  await assert.rejects(f.handler(f.task, f.queue), /请求已变化/);
  assert.equal(f.events.some(e => e.resolve?.includes('https:') || e.render), false);
});
test('native renderer builder loops a still, preserves source audio, applies gain and delays only the selected track', () => {
  const p = payload();
  const args = buildMediaClipExportFfmpegArgs({ clips: p.args.clips.map(c => ({ ...c, hasAudio: c.kind === 'video' })), audioClips: p.args.audioClips,
    outputWidth: 640, outputHeight: 480, fps: 30, outAbs: '/not-written.mp4' });
  const filter = args[args.indexOf('-filter_complex') + 1];
  assert.ok(args.includes('-loop')); assert.match(filter, /volume=0\.25,adelay=2000\|2000/);
  assert.match(filter, /anullsrc/); assert.match(filter, /concat=n=2:v=1:a=0/); assert.match(filter, /\[va\]\[ta\]amix=inputs=2/);
});
test('muted track produces no external audio input; an all-image result may have no audio stream', () => {
  const p = payload(), args = buildMediaClipExportFfmpegArgs({ clips: [p.args.clips[0]], audioClips: [{ ...p.args.audioClips[0], muted: true }],
    outputWidth: 640, outputHeight: 480, fps: 30, outAbs: '/not-written.mp4' });
  assert.equal(args.includes('output/speech.wav'), false); assert.equal(args.includes('[a]'), false);
});
test('zero gain is explicit silence rather than a default-volume fallback', () => {
  const p = payload(), args = buildMediaClipExportFfmpegArgs({ clips: p.args.clips, audioClips: [{ ...p.args.audioClips[0], volume: 0 }],
    outputWidth: 640, outputHeight: 480, outAbs: '/not-written.mp4' });
  assert.match(args[args.indexOf('-filter_complex') + 1], /volume=0,/);
});
test('default unity gain preserves the previous renderer argument array', () => {
  const p = payload(), { volume, ...audio } = p.args.audioClips[0];
  const args = { clips: p.args.clips, outputWidth: 640, outputHeight: 480, outAbs: '/not-written.mp4' };
  assert.deepEqual(buildMediaClipExportFfmpegArgs({ ...args, audioClips: [audio] }), buildMediaClipExportFfmpegArgs({ ...args, audioClips: [{ ...audio, volume: 1 }] }));
});

const invalidImages = [
  { codec_type: 'video', codec_name: 'png', width: 640, height: 480, nb_read_frames: '2' },
  { codec_type: 'video', codec_name: 'apng', width: 640, height: 480, nb_read_frames: '1' },
  { codec_type: 'video', codec_name: 'png', width: 0, height: 480, nb_read_frames: '1' },
  { codec_type: 'video', codec_name: 'png', width: 640, height: 480, nb_read_frames: 'N/A' },
];
for (const [index, stream] of invalidImages.entries()) test(`image probe rejects animation/unreadable/unknown frame case ${index + 1}`, async () => {
  const f = fixture(); f.image.streams = [stream]; await assert.rejects(f.handler(f.task, f.queue), /图片/);
  assert.equal(f.events.some(e => e.render), false);
});
const invalid = {
  'unknown media version': p => { p.args.mediaVersion = 3; },
  'two audio tracks': p => { p.args.audioClips.push({ ...p.args.audioClips[0] }); },
  'image offset': p => { p.args.clips[0].start = 1; p.args.duration -= 1; },
  'remote audio': p => { p.args.audioClips[0].src = 'https://example.com/a.wav'; },
  'encoded image': p => { p.args.clips[0].src = p.src = 'output/%2e%2e/a.png'; },
  'absolute image': p => { p.args.clips[0].src = p.src = 'C:/a.png'; },
  'GIF': p => { p.args.clips[0].src = p.src = 'output/a.gif'; },
  'second video disguised as audio': p => { p.args.audioClips[0].src = 'output/a.mp4'; },
  'unknown audio parameter': p => { p.args.audioClips[0].apiKey = 'never-send'; },
  'overlapping audio beyond movie': p => { p.args.audioClips[0].timelineStart = 13; p.args.audioClips[0].timelineEnd = 17; },
  'audio stretch': p => { p.args.audioClips[0].timelineEnd = 8; },
  'non-numeric gain': p => { p.args.audioClips[0].volume = '0.5'; },
  'out-of-range gain': p => { p.args.audioClips[0].volume = 2; },
  'non-boolean mute': p => { p.args.audioClips[0].muted = 1; },
  'NaN range': p => { p.args.audioClips[0].end = NaN; },
};
for (const [name, mutate] of Object.entries(invalid)) test(`strict v2 whitelist rejects ${name}`, () => {
  const p = payload(); mutate(p); assert.throws(() => validateStorySequenceExport(p));
});

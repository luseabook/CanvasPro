import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildMediaClipExportFfmpegArgs,
  createMediaClipExportTaskHandler,
} from './mediaClipExportTask.js';
import { registerSharedMediaTaskHandlers } from './registerSharedMediaTaskHandlers.js';

function makeOutputDir(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'clip-out-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function createHandler({
  outputDir,
  videoMeta = { width: 1280, height: 720, duration: 0, fps: 24 },
  hasAudio = false,
  runFfmpegTask = undefined,
} = {}) {
  const runs = [];
  const probes = [];
  const handler = createMediaClipExportTaskHandler({
    createOutputFilename: (prefix, ext) => prefix + '-fixed.' + ext,
    ffprobeHasAudio: async (queue, task, src) => {
      probes.push(src);
      return hasAudio;
    },
    ffprobeVideoMeta: async (queue, task, src) => {
      probes.push(src);
      return videoMeta;
    },
    getOutputDir: () => outputDir,
    getRuntimeToolOrFallback: (name) => '/runtime/' + name,
    resolveMediaTaskSource: (src) => path.resolve(String(src)),
    toOutputLocalPath: (folder, name) => 'output/' + folder + '/' + name,
    ...(runFfmpegTask ? { runFfmpegTask } : {}),
  });
  return {
    handler,
    runs,
    probes,
    runWith: (payload, queue) =>
      handler({ taskId: 'clip-1', payload: { src: 'F:/media/clip.mp4', ...payload } }, queue),
  };
}

function makeQueue(runs) {
  return {
    throwIfCancelled: () => {},
    emitProgress: () => {},
    runProcess: (task, cmd, args, options) => {
      runs.push({ cmd, args, options });
      return Promise.resolve({ code: 0 });
    },
  };
}

test('a single clip without an audio track maps the source streams straight through', () => {
  const args = buildMediaClipExportFfmpegArgs({
    videoAbs: 'F:/media/clip.mp4',
    videoStart: 1,
    videoEnd: 3,
    outAbs: 'F:/out/ClipVideo/clip.mp4',
  });
  assert.deepEqual(args, [
    '-y',
    '-ss',
    '1',
    '-t',
    '2',
    '-i',
    'F:/media/clip.mp4',
    '-map',
    '0:v:0',
    '-map',
    '0:a?',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-preset',
    'fast',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    'F:/out/ClipVideo/clip.mp4',
  ]);
});

test('an added audio source is padded and trimmed to the clip duration', () => {
  const args = buildMediaClipExportFfmpegArgs({
    videoAbs: 'F:/media/clip.mp4',
    videoStart: 1,
    videoEnd: 3,
    audioAbs: 'F:/media/tune.mp3',
    audioStart: 0,
    audioEnd: 10,
    outAbs: 'F:/out/ClipVideo/clip.mp4',
  });
  assert.deepEqual(args, [
    '-y',
    '-ss',
    '1',
    '-t',
    '2',
    '-i',
    'F:/media/clip.mp4',
    '-ss',
    '0',
    '-t',
    '10',
    '-i',
    'F:/media/tune.mp3',
    '-filter_complex',
    '[1:a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS,apad[a]',
    '-map',
    '0:v:0',
    '-map',
    '[a]',
    '-t',
    '2',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-preset',
    'fast',
    '-c:a',
    'aac',
    '-movflags',
    '+faststart',
    'F:/out/ClipVideo/clip.mp4',
  ]);
});

test('a supported fps lands as an output rate and anything else is dropped', () => {
  const base = { videoAbs: 'F:/media/clip.mp4', videoStart: 0, videoEnd: 2, outAbs: 'F:/out/clip.mp4' };
  const withFps = buildMediaClipExportFfmpegArgs({ ...base, fps: 24 });
  const rateAt = withFps.indexOf('-r');
  assert.deepEqual(withFps.slice(rateAt, rateAt + 2), ['-r', '24']);
  assert.ok(rateAt < withFps.indexOf('-movflags'));
  const unsupported = buildMediaClipExportFfmpegArgs({ ...base, fps: 25 });
  assert.ok(!unsupported.includes('-r'));
});

test('explicit audio clips are mixed with adelay, volume and a trims to the clip length', () => {
  const args = buildMediaClipExportFfmpegArgs({
    videoAbs: 'F:/media/clip.mp4',
    videoStart: 0,
    videoEnd: 4,
    audioClips: [{ src: 'F:/media/bed.mp3', start: 0, end: 5, timelineStart: 2, volume: 0.5 }],
    outAbs: 'F:/out/ClipVideo/clip.mp4',
  });
  const joined = args.join(' ');
  assert.ok(joined.includes('adelay=2000|2000'));
  assert.ok(joined.includes('volume=0.5'));
  assert.ok(joined.includes('atrim=0:4[a]'));
  assert.deepEqual(args.slice(args.indexOf('-map'), args.indexOf('-map') + 4), ['-map', '0:v:0', '-map', '[a]']);
  assert.deepEqual(args.slice(-2), ['+faststart', 'F:/out/ClipVideo/clip.mp4']);
});

test('a multi-clip export concatenates every clip before the audio mix', () => {
  const args = buildMediaClipExportFfmpegArgs({
    clips: [
      { src: 'F:/media/a.mp4', start: 0, end: 2 },
      { src: 'F:/media/b.mp4', start: 1, end: 4 },
    ],
    outputWidth: 1280,
    outputHeight: 720,
    outAbs: 'F:/out/ClipVideo/clip.mp4',
  });
  const joined = args.join(' ');
  assert.ok(joined.includes('concat=n=2:v=1:a=0[v]'));
  assert.deepEqual(args.slice(args.indexOf('-map'), args.indexOf('-map') + 2), ['-map', '[v]']);
  assert.ok(!joined.includes('-map [a]'));
});

test('silent clips in a concatenation are padded with generated audio', () => {
  const args = buildMediaClipExportFfmpegArgs({
    clips: [
      { src: 'F:/media/a.mp4', start: 0, end: 2, hasAudio: true },
      { src: 'F:/media/b.mp4', start: 0, end: 3 },
    ],
    outputWidth: 1280,
    outputHeight: 720,
    outAbs: 'F:/out/ClipVideo/clip.mp4',
  });
  const joined = args.join(' ');
  assert.ok(joined.includes('[0:a]atrim=start=0:end=2'));
  assert.ok(joined.includes('anullsrc=channel_layout=stereo:sample_rate=44100,atrim=0:3'));
  assert.ok(joined.includes('concat=n=2:v=0:a=1[va]'));
});

test('a missing range, output path or output size is rejected', () => {
  assert.throws(
    () => buildMediaClipExportFfmpegArgs({ videoAbs: 'F:/in.mp4', outAbs: 'F:/out.mp4' }),
    /Invalid video clip range/,
  );
  assert.throws(
    () => buildMediaClipExportFfmpegArgs({ videoAbs: 'F:/in.mp4', videoStart: 0, videoEnd: 2 }),
    /Invalid video clip range/,
  );
  assert.throws(
    () =>
      buildMediaClipExportFfmpegArgs({
        clips: [{ src: 'F:/a.mp4', start: 0, end: 2 }],
        outAbs: 'F:/out.mp4',
      }),
    /Invalid video output size/,
  );
});

test('an audio range that ends before it starts is rejected', () => {
  assert.throws(
    () =>
      buildMediaClipExportFfmpegArgs({
        videoAbs: 'F:/in.mp4',
        videoStart: 0,
        videoEnd: 2,
        audioAbs: 'F:/bed.mp3',
        audioStart: 5,
        audioEnd: 5,
        outAbs: 'F:/out.mp4',
      }),
    /Invalid audio clip range/,
  );
});

test('a source without a video stream is rejected before any encode', async (t) => {
  const rig = createHandler({ outputDir: makeOutputDir(t), videoMeta: { width: 0, height: 0 } });
  await assert.rejects(() => rig.runWith({ args: { start: 0, end: 2 } }, makeQueue(rig.runs)), /Source video has no video stream/);
  assert.equal(rig.runs.length, 0);
});

test('a clip without a usable range is rejected before any encode', async (t) => {
  const rig = createHandler({ outputDir: makeOutputDir(t) });
  await assert.rejects(() => rig.runWith({ args: { start: 3, end: 3 } }, makeQueue(rig.runs)), /Invalid video clip range/);
  assert.equal(rig.runs.length, 0);
});

test('the exported clip lands in ClipVideo and reports the probed metadata', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({ outputDir, videoMeta: { width: 1280, height: 720, duration: 0, fps: 24 } });
  const result = await rig.runWith({ args: { start: 1, end: 3 } }, makeQueue(rig.runs));
  assert.equal(result.success, true);
  assert.equal(result.filename, 'clip-fixed.mp4');
  assert.equal(result.path, 'output/ClipVideo/clip-fixed.mp4');
  assert.equal(result.localPath, 'output/ClipVideo/clip-fixed.mp4');
  assert.equal(result.url, '/output/ClipVideo/clip-fixed.mp4');
  assert.equal(result.videoDuration, 2);
  assert.equal(result.fps, 24);
  assert.equal(result.videoWidth, 1280);
  assert.equal(result.videoHeight, 720);
  assert.ok(existsSync(path.join(outputDir, 'ClipVideo')));
});

test('a multi-clip export sums the clip durations into the result', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({ outputDir, videoMeta: { width: 1920, height: 1080, duration: 0, fps: 25 } });
  const result = await rig.runWith(
    {
      args: {
        clips: [
          { src: 'F:/media/a.mp4', start: 0, end: 2 },
          { src: 'F:/media/b.mp4', start: 1, end: 4 },
        ],
      },
    },
    makeQueue(rig.runs),
  );
  assert.equal(result.videoDuration, 5);
  assert.equal(result.fps, 25);
  assert.equal(rig.runs.length, 1);
  assert.ok(rig.runs[0].args.join(' ').includes('concat=n=2:v=1:a=0[v]'));
});

test('the fallback runner goes through queue.runProcess with the ffmpeg runtime tool', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({ outputDir });
  await rig.runWith({ args: { start: 1, end: 3 } }, makeQueue(rig.runs));
  assert.equal(rig.runs.length, 1);
  assert.equal(rig.runs[0].cmd, '/runtime/ffmpeg');
  assert.deepEqual(rig.runs[0].options, { durationSec: 2, progressMessage: 'Exporting clip' });
  assert.ok(rig.runs[0].args.includes(path.resolve('F:/media/clip.mp4')));
});

test('an injected runFfmpegTask replaces the queue process runner', async (t) => {
  const outputDir = makeOutputDir(t);
  const calls = [];
  const rig = createHandler({
    outputDir,
    runFfmpegTask: (task, queue, args, options) => {
      calls.push({ task, args, options });
      return Promise.resolve({ code: 0 });
    },
  });
  const result = await rig.runWith(
    { args: { start: 1, end: 3 } },
    {
      throwIfCancelled: () => {},
      emitProgress: () => {},
      runProcess: () => {
        throw new Error('the queue process runner should not be used');
      },
    },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].task.taskId, 'clip-1');
  assert.deepEqual(calls[0].options, { durationSec: 2, progressMessage: 'Exporting clip' });
  assert.equal(result.filename, 'clip-fixed.mp4');
});

test('the shared registration forwards runFfmpegTask to the mediaClipExport handler', async (t) => {
  const outputDir = makeOutputDir(t);
  const registered = new Map();
  const calls = [];
  registerSharedMediaTaskHandlers({ setHandler: (kind, handler) => registered.set(kind, handler) }, {
    createOutputFilename: (prefix, ext) => prefix + '.' + ext,
    ffprobeHasAudio: async () => false,
    ffprobeVideoMeta: async () => ({ width: 1920, height: 1080, duration: 0, fps: 30 }),
    getOutputDir: () => outputDir,
    getRuntimeToolOrFallback: () => {
      throw new Error('the fallback runtime lookup should not be used');
    },
    resolveMediaTaskSource: (src) => path.resolve(String(src)),
    runFfmpegTask: (task, queue, args, options) => {
      calls.push({ args, options });
      return Promise.resolve({ code: 0 });
    },
    toOutputLocalPath: (folder, name) => 'output/' + folder + '/' + name,
  });
  const handler = registered.get('mediaClipExport');
  assert.equal(typeof handler, 'function');
  const result = await handler(
    { taskId: 'clip-2', payload: { src: 'F:/media/clip.mp4', args: { start: 0, end: 4 } } },
    { throwIfCancelled: () => {}, emitProgress: () => {} },
  );
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].options, { durationSec: 4, progressMessage: 'Exporting clip' });
  assert.equal(result.localPath, 'output/ClipVideo/clip.mp4');
});

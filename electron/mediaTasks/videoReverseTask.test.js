import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildVideoReverseFfmpegArgs, createVideoReverseMediaTaskHandler } from './videoReverseTask.js';
import { registerSharedMediaTaskHandlers } from './registerSharedMediaTaskHandlers.js';

function makeOutputDir(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'reverse-out-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function createHandler({
  outputDir,
  videoMeta = { width: 1920, height: 1080, duration: 5, fps: 30 },
  hasAudio = false,
  runFfmpegTask = undefined,
} = {}) {
  const runs = [];
  const handler = createVideoReverseMediaTaskHandler({
    createOutputFilename: (prefix, ext) => prefix + '-fixed.' + ext,
    ffprobeHasAudio: async () => hasAudio,
    ffprobeVideoMeta: async () => videoMeta,
    getOutputDir: () => outputDir,
    getRuntimeToolOrFallback: (name) => '/runtime/' + name,
    resolveMediaTaskSource: (src) => path.resolve(String(src)),
    toOutputLocalPath: (folder, name) => 'output/' + folder + '/' + name,
    ...(runFfmpegTask ? { runFfmpegTask } : {}),
  });
  return {
    handler,
    runs,
    runWith: (queue) => handler({ taskId: 'rev-1', payload: { src: 'F:/media/clip.mp4' } }, queue),
  };
}

function makeQueue(runs, onRun = null) {
  return {
    throwIfCancelled: () => {},
    emitProgress: () => {},
    runProcess: (task, cmd, args, options) => {
      runs.push({ cmd, args, options });
      return onRun ? onRun(task, cmd, args, options) : Promise.resolve({ code: 0 });
    },
  };
}

test('the reverse argument list reverses video and audio when the source has sound', () => {
  const args = buildVideoReverseFfmpegArgs({
    sourceAbs: 'F:/media/clip.mp4',
    outAbs: 'F:/out/ReverseVideo/clip.mp4',
    hasAudio: true,
  });
  assert.deepEqual(args, [
    '-y',
    '-i',
    'F:/media/clip.mp4',
    '-filter_complex',
    '[0:v]reverse,setpts=PTS-STARTPTS,format=yuv420p[v];[0:a]areverse,asetpts=PTS-STARTPTS[a]',
    '-map',
    '[v]',
    '-map',
    '[a]',
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
    'F:/out/ReverseVideo/clip.mp4',
  ]);
});

test('a silent source drops the audio mapping and encodes video only', () => {
  const args = buildVideoReverseFfmpegArgs({
    sourceAbs: 'F:/media/silent.mp4',
    outAbs: 'F:/out/ReverseVideo/silent.mp4',
  });
  assert.deepEqual(args, [
    '-y',
    '-i',
    'F:/media/silent.mp4',
    '-filter_complex',
    '[0:v]reverse,setpts=PTS-STARTPTS,format=yuv420p[v]',
    '-map',
    '[v]',
    '-an',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-profile:v',
    'high',
    '-preset',
    'fast',
    '-movflags',
    '+faststart',
    'F:/out/ReverseVideo/silent.mp4',
  ]);
});

test('an incomplete reverse request is rejected', () => {
  assert.throws(() => buildVideoReverseFfmpegArgs({ outAbs: 'F:/out.mp4' }), /Invalid video reverse source/);
  assert.throws(() => buildVideoReverseFfmpegArgs({ sourceAbs: 'F:/in.mp4' }), /Invalid video reverse source/);
  assert.throws(() => buildVideoReverseFfmpegArgs(), /Invalid video reverse source/);
});

test('a source without a video stream is rejected before any encode', async (t) => {
  const rig = createHandler({ outputDir: makeOutputDir(t), videoMeta: { width: 0, height: 0 } });
  await assert.rejects(() => rig.runWith(makeQueue(rig.runs)), /Source video has no video stream/);
  assert.equal(rig.runs.length, 0);
});

test('the reversed file lands in ReverseVideo and reports the probed metadata', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({
    outputDir,
    videoMeta: { width: 1920, height: 1080, duration: 5, fps: 30 },
    hasAudio: true,
  });
  const result = await rig.runWith(makeQueue(rig.runs));
  assert.equal(result.success, true);
  assert.equal(result.filename, 'reverse-fixed.mp4');
  assert.equal(result.path, 'output/ReverseVideo/reverse-fixed.mp4');
  assert.equal(result.localPath, 'output/ReverseVideo/reverse-fixed.mp4');
  assert.equal(result.url, '/output/ReverseVideo/reverse-fixed.mp4');
  assert.equal(result.videoDuration, 5);
  assert.equal(result.fps, 30);
  assert.equal(result.videoWidth, 1920);
  assert.equal(result.videoHeight, 1080);
  assert.ok(existsSync(path.join(outputDir, 'ReverseVideo')));
});

test('the fallback runner goes through queue.runProcess with the ffmpeg runtime tool', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({ outputDir, videoMeta: { width: 640, height: 360, duration: 2, fps: 25 } });
  await rig.runWith(makeQueue(rig.runs));
  assert.equal(rig.runs.length, 1);
  assert.equal(rig.runs[0].cmd, '/runtime/ffmpeg');
  assert.deepEqual(
    rig.runs[0].args,
    buildVideoReverseFfmpegArgs({
      sourceAbs: path.resolve('F:/media/clip.mp4'),
      outAbs: path.join(outputDir, 'ReverseVideo', 'reverse-fixed.mp4'),
    }),
  );
  assert.deepEqual(rig.runs[0].options, { durationSec: 2, progressMessage: 'Reversing video' });
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
  const queue = {
    throwIfCancelled: () => {},
    emitProgress: () => {},
    runProcess: () => {
      throw new Error('the queue process runner should not be used');
    },
  };
  const result = await rig.runWith(queue);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].task.taskId, 'rev-1');
  assert.deepEqual(calls[0].options, { durationSec: 5, progressMessage: 'Reversing video' });
  assert.equal(result.filename, 'reverse-fixed.mp4');
});

test('the shared registration forwards runFfmpegTask to the videoReverse handler', async (t) => {
  const outputDir = makeOutputDir(t);
  const registered = new Map();
  const calls = [];
  registerSharedMediaTaskHandlers({ setHandler: (kind, handler) => registered.set(kind, handler) }, {
    createOutputFilename: (prefix, ext) => prefix + '.' + ext,
    ffprobeHasAudio: async () => false,
    ffprobeVideoMeta: async () => ({ width: 1280, height: 720, duration: 3, fps: 24 }),
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
  const handler = registered.get('videoReverse');
  assert.equal(typeof handler, 'function');
  const result = await handler(
    { taskId: 'rev-2', payload: { src: 'F:/media/clip.mp4' } },
    { throwIfCancelled: () => {}, emitProgress: () => {} },
  );
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].options, { durationSec: 3, progressMessage: 'Reversing video' });
  assert.equal(result.localPath, 'output/ReverseVideo/reverse.mp4');
});

test('a queue without setHandler is tolerated', () => {
  assert.doesNotThrow(() => registerSharedMediaTaskHandlers(null, {}));
  assert.doesNotThrow(() => registerSharedMediaTaskHandlers({}, {}));
});

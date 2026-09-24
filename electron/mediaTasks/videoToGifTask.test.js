import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildVideoToGifFfmpegArgs,
  createVideoToGifMediaTaskHandler,
  normalizeVideoToGifOptions,
  resolveNextVideoGifAdaptiveProfile,
} from './videoToGifTask.js';
import { registerSharedMediaTaskHandlers } from './registerSharedMediaTaskHandlers.js';
import { MediaTaskQueue } from '../mediaTaskQueue.js';

function makeOutputDir(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'gif-out-'));
  if (t && typeof t.after === 'function') t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function createHandler({
  outputDir,
  videoMeta = { width: 1920, height: 1080, duration: 4 },
  fileSizes = [1024],
  onRun = null,
  probe = null,
} = {}) {
  const runs = [];
  let sizeIndex = 0;
  const handler = createVideoToGifMediaTaskHandler({
    createOutputFilename: (prefix, ext) => prefix + '-fixed.' + ext,
    ffprobeVideoMeta: async (queue, task, src) => (probe ? probe(queue, task, src) : videoMeta),
    getOutputDir: () => outputDir,
    getRuntimeToolOrFallback: (name) => '/runtime/' + name,
    resolveMediaTaskSource: (src) => path.resolve(String(src)),
    statFile: () => ({ size: fileSizes[Math.min(sizeIndex++, fileSizes.length - 1)] }),
    toOutputLocalPath: (folder, name) => 'output/' + folder + '/' + name,
  });
  return {
    handler,
    runs,
    run: (payload = {}) => {
      const queue = {
        throwIfCancelled: () => {},
        emitProgress: () => {},
        runProcess: (task, cmd, args, options) => {
          runs.push({ cmd, args, options });
          if (onRun) return onRun(task, cmd, args, options);
          return Promise.resolve({ code: 0 });
        },
      };
      return handler({ taskId: 'gif-1', payload: { src: 'F:/media/clip.mp4', ...payload } }, queue);
    },
    raw: (payload, queue) =>
      handler({ taskId: 'gif-1', payload: { src: 'F:/media/clip.mp4', ...payload } }, queue),
  };
}

test('wechat preset is the default and keeps a 1 MiB target with 15 fps', () => {
  const options = normalizeVideoToGifOptions({}, { duration: 4, width: 1920, height: 1080 });
  assert.equal(options.preset, 'wechat');
  assert.equal(options.quality, 'high');
  assert.equal(options.fps, 15);
  assert.equal(options.targetBytes, 1024 * 1024);
  assert.equal(options.maxColors, 256);
  assert.equal(options.bayerScale, 2);
});

test('hd preset lowers quality defaults and drops the target size', () => {
  const options = normalizeVideoToGifOptions({ preset: 'HD' }, { duration: 4 });
  assert.equal(options.preset, 'hd');
  assert.equal(options.quality, 'balanced');
  assert.equal(options.fps, 20);
  assert.equal(options.targetBytes, 0);
  assert.equal(options.maxColors, 128);
  assert.equal(options.bayerScale, 3);
});

test('start and end are clamped into the source duration', () => {
  const beyondStart = normalizeVideoToGifOptions({ start: 99, end: 120 }, { duration: 4 });
  assert.equal(beyondStart.start, 3.9);
  assert.equal(beyondStart.end, 4);
  assert.ok(Math.abs(beyondStart.duration - 0.1) < 1e-9);

  const negativeStart = normalizeVideoToGifOptions({ start: -5, end: 2 }, { duration: 10 });
  assert.equal(negativeStart.start, 0);
  assert.equal(negativeStart.end, 2);
  assert.equal(negativeStart.duration, 2);
});

test('end falls back to the source duration and never precedes start + minimum gap', () => {
  const noEnd = normalizeVideoToGifOptions({ start: 1 }, { duration: 8 });
  assert.equal(noEnd.end, 8);

  const tooEarlyEnd = normalizeVideoToGifOptions({ start: 2, end: 2.01 }, { duration: 8 });
  assert.equal(tooEarlyEnd.end, 2.1);

  const unknownDuration = normalizeVideoToGifOptions({ start: 4 }, {});
  assert.equal(unknownDuration.end, 7);
});

test('an unknown duration keeps the clamped end and honours the derived fallback', () => {
  const options = normalizeVideoToGifOptions({ end: 12 }, {});
  assert.equal(options.start, 0);
  assert.equal(options.end, 12);
  assert.equal(options.duration, 12);
});

test('the short side of a landscape source becomes the frame size', () => {
  const options = normalizeVideoToGifOptions({ size: 720 }, { duration: 4, width: 1920, height: 1080 });
  assert.equal(options.width, 720);
  assert.equal(options.height, 405);
});

test('the short side of a portrait source becomes the frame size', () => {
  const options = normalizeVideoToGifOptions({ size: 720 }, { duration: 4, width: 1080, height: 1920 });
  assert.equal(options.width, 405);
  assert.equal(options.height, 720);
});

test('explicit source dimensions win over the probed metadata', () => {
  const options = normalizeVideoToGifOptions(
    { size: 640, sourceWidth: 1000, sourceHeight: 1000 },
    { width: 1920, height: 1080 },
  );
  assert.equal(options.width, 640);
  assert.equal(options.height, 640);
});

test('sizes and rates are clamped to their supported ranges', () => {
  const tiny = normalizeVideoToGifOptions({ size: 10, fps: 1, maxColors: 1, bayerScale: 99 }, { duration: 4 });
  assert.equal(tiny.width, 64);
  assert.equal(tiny.height, 64);
  assert.equal(tiny.fps, 4);
  assert.equal(tiny.maxColors, 16);
  assert.equal(tiny.bayerScale, 5);

  const huge = normalizeVideoToGifOptions({ size: 5000, fps: 100, maxColors: 1000 }, { duration: 4 });
  assert.equal(huge.width, 1920);
  assert.equal(huge.height, 1920);
  assert.equal(huge.fps, 30);
  assert.equal(huge.maxColors, 256);
});

test('an out-of-range quality falls back to the preset default', () => {
  assert.equal(normalizeVideoToGifOptions({ quality: 'ultra' }, {}).quality, 'high');
  assert.equal(normalizeVideoToGifOptions({ preset: 'hd', quality: 'ultra' }, {}).quality, 'balanced');
  assert.equal(normalizeVideoToGifOptions({ quality: 'compact' }, {}).maxColors, 64);
  assert.equal(normalizeVideoToGifOptions({ quality: 'compact' }, {}).bayerScale, 5);
});

test('the ffmpeg argument list encodes the palette filter graph in order', () => {
  const args = buildVideoToGifFfmpegArgs({
    sourceAbs: 'F:/media/clip.mp4',
    outAbs: 'F:/out/Gif/clip.gif',
    options: { preset: 'hd', fps: 12, width: 480, height: 480, maxColors: 64, bayerScale: 4, start: 1, end: 3 },
  });
  assert.deepEqual(args, [
    '-y',
    '-ss',
    '1',
    '-t',
    '2',
    '-i',
    'F:/media/clip.mp4',
    '-filter_complex',
    '[0:v]fps=12,scale=480:480:flags=lanczos,setsar=1,format=rgba,split[palette_source][gif_source];' +
      '[palette_source]palettegen=max_colors=64:reserve_transparent=1:stats_mode=diff[palette];' +
      '[gif_source][palette]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle[out]',
    '-map',
    '[out]',
    '-an',
    '-loop',
    '0',
    '-gifflags',
    '+transdiff',
    'F:/out/Gif/clip.gif',
  ]);
});

test('the ffmpeg argument builder rejects a missing path', () => {
  assert.throws(() => buildVideoToGifFfmpegArgs({ outAbs: 'F:/out.gif' }), /Invalid video to GIF source/);
  assert.throws(() => buildVideoToGifFfmpegArgs({ sourceAbs: 'F:/in.mp4' }), /Invalid video to GIF source/);
});

test('an adaptive profile only appears when the target was missed', () => {
  const profile = { fps: 20, maxColors: 128, width: 720, height: 405 };
  assert.equal(
    resolveNextVideoGifAdaptiveProfile({ profile, fileSize: 100, targetBytes: 200, attempt: 1 }),
    null,
  );
  assert.equal(
    resolveNextVideoGifAdaptiveProfile({ profile, fileSize: 300, targetBytes: 0, attempt: 1 }),
    null,
  );
});

test('the first optimize pass shrinks colours and the second also drops fps', () => {
  const profile = { fps: 20, maxColors: 128, width: 720, height: 405 };
  const first = resolveNextVideoGifAdaptiveProfile({
    profile,
    fileSize: 4 * 1024 * 1024,
    targetBytes: 1024 * 1024,
    attempt: 1,
  });
  assert.deepEqual(first, { fps: 20, maxColors: 96, width: 720, height: 405 });

  const second = resolveNextVideoGifAdaptiveProfile({
    profile,
    fileSize: 4 * 1024 * 1024,
    targetBytes: 1024 * 1024,
    attempt: 2,
  });
  assert.deepEqual(second, { fps: 17, maxColors: 96, width: 720, height: 405 });
});

test('an adaptive profile that would not change anything returns null', () => {
  const profile = { fps: 6, maxColors: 32, width: 100, height: 50 };
  assert.equal(
    resolveNextVideoGifAdaptiveProfile({
      profile,
      fileSize: 2000,
      targetBytes: 1000,
      attempt: 1,
    }),
    null,
  );
});

test('a source without a video stream is rejected before any encode', async () => {
  const rig = createHandler({ outputDir: makeOutputDir(null), probe: async () => ({ width: 0, height: 0 }) });
  await assert.rejects(() => rig.run({}), /Source video has no video stream/);
  assert.equal(rig.runs.length, 0);
});

test('the GIF lands in the Gif output folder and reports the local paths', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({ outputDir, videoMeta: { width: 1920, height: 1080, duration: 4 } });
  const result = await rig.run({ args: { preset: 'hd' } });
  assert.equal(result.filename, 'hd-gif-fixed.gif');
  assert.equal(result.localPath, 'output/Gif/hd-gif-fixed.gif');
  assert.equal(result.url, '/output/Gif/hd-gif-fixed.gif');
  assert.equal(result.mimeType, 'image/gif');
  assert.equal(result.success, true);
  assert.equal(result.imageWidth, 720);
  assert.equal(result.imageHeight, 405);
  assert.equal(result.fps, 20);
  assert.equal(result.duration, 4);
  assert.equal(result.targetExceeded, false);
  assert.ok(existsSync(path.join(outputDir, 'Gif')));
});

test('the wechat preset names the file differently and encodes once without a target', async (t) => {
  const outputDir = makeOutputDir(t);
  const single = createHandler({ outputDir, videoMeta: { width: 1920, height: 1080, duration: 4 } });
  const hdResult = await single.run({ args: { preset: 'hd', targetBytes: 0 } });
  assert.equal(hdResult.filename, 'hd-gif-fixed.gif');
  assert.equal(single.runs.length, 1);
  assert.equal(single.runs[0].cmd, '/runtime/ffmpeg');
  assert.deepEqual(single.runs[0].options, { durationSec: 0, progressMessage: 'Encoding GIF' });

  const wechatOutputDir = makeOutputDir(t);
  const wechat = createHandler({ outputDir: wechatOutputDir, videoMeta: { width: 1920, height: 1080, duration: 4 } });
  const wechatResult = await wechat.run({ args: { preset: 'wechat', targetBytes: 0 } });
  assert.equal(wechatResult.filename, 'wechat-gif-fixed.gif');
});

test('a missed target triggers a second smaller encode', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({
    outputDir,
    videoMeta: { width: 1920, height: 1080, duration: 4 },
    fileSizes: [2 * 1024 * 1024, 900 * 1024],
  });
  const progresses = [];
  const queue = {
    throwIfCancelled: () => {},
    emitProgress: (task, progress, message, extra) => progresses.push({ progress, message, extra }),
    runProcess: (task, cmd, args) => {
      rig.runs.push({ cmd, args });
      return Promise.resolve({ code: 0 });
    },
  };
  const result = await rig.raw({ args: { preset: 'wechat' } }, queue);
  assert.equal(rig.runs.length, 2);
  assert.equal(result.fileSize, 900 * 1024);
  assert.equal(result.targetExceeded, false);
  assert.equal(result.maxColors, 192);
  assert.deepEqual(
    progresses.map((entry) => entry.message),
    ['Encoding GIF', 'Optimizing GIF (2/6)'],
  );
  assert.equal(progresses[0].extra.stage, 'encode');
  assert.equal(progresses[1].extra.stage, 'optimize');
  const secondArgs = rig.runs[1].args;
  assert.ok(secondArgs.join(' ').includes('max_colors=192'));
});

test('the adaptive retry stops after six attempts and flags the miss', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({
    outputDir,
    videoMeta: { width: 1920, height: 1080, duration: 4 },
    fileSizes: [8 * 1024 * 1024],
  });
  const result = await rig.run({ args: { preset: 'wechat' } });
  assert.equal(rig.runs.length, 6);
  assert.equal(result.fileSize, 8 * 1024 * 1024);
  assert.equal(result.targetExceeded, true);
});

test('cancellation surfaces before the next encode starts', async (t) => {
  const outputDir = makeOutputDir(t);
  const rig = createHandler({ outputDir });
  await assert.rejects(
    () =>
      rig.raw(
        { args: { preset: 'wechat' } },
        {
          throwIfCancelled: () => {
            throw new Error('cancelled');
          },
          emitProgress: () => {},
          runProcess: () => Promise.resolve({ code: 0 }),
        },
      ),
    /cancelled/,
  );
  assert.equal(rig.runs.length, 0);
});

test('an injected runFfmpegTask replaces the queue process runner', async (t) => {
  const outputDir = makeOutputDir(t);
  const calls = [];
  const handler = createVideoToGifMediaTaskHandler({
    createOutputFilename: () => 'clip.gif',
    ffprobeVideoMeta: async () => ({ width: 640, height: 640, duration: 2 }),
    getOutputDir: () => outputDir,
    getRuntimeToolOrFallback: () => {
      throw new Error('the fallback runtime lookup should not be used');
    },
    resolveMediaTaskSource: (src) => src,
    runFfmpegTask: (task, queue, args, options) => {
      calls.push({ args, options });
      return Promise.resolve({ code: 0 });
    },
    statFile: () => ({ size: 42 }),
    toOutputLocalPath: (folder, name) => folder + '/' + name,
  });
  const result = await handler(
    { taskId: 'gif-2', payload: { src: 'F:/media/clip.mp4', args: { preset: 'hd' } } },
    { throwIfCancelled: () => {}, emitProgress: () => {} },
  );
  assert.equal(calls.length, 1);
  assert.equal(result.fileSize, 42);
  assert.equal(result.filename, 'clip.gif');
});

test('the media task queue runs a registered videoToGif task end to end', async (t) => {
  const outputDir = makeOutputDir(t);
  const updates = [];
  const queue = new MediaTaskQueue({ onUpdate: (snapshot) => updates.push(snapshot) });
  let runCount = 0;
  queue.setHandler(
    'videoToGif',
    createVideoToGifMediaTaskHandler({
      createOutputFilename: (prefix, ext) => prefix + '.' + ext,
      ffprobeVideoMeta: async () => ({ width: 1280, height: 720, duration: 3 }),
      getOutputDir: () => outputDir,
      getRuntimeToolOrFallback: (name) => '/runtime/' + name,
      resolveMediaTaskSource: (src) => path.resolve(String(src)),
      runFfmpegTask: () => {
        runCount += 1;
        return Promise.resolve({ code: 0 });
      },
      statFile: () => ({ size: 4096 }),
      toOutputLocalPath: (folder, name) => 'output/' + folder + '/' + name,
    }),
  );
  const snapshot = queue.enqueue({
    kind: 'videoToGif',
    taskId: 'gif-queue-1',
    nodeId: 'node-7',
    src: 'F:/media/clip.mp4',
    args: { preset: 'hd' },
  });
  assert.equal(snapshot.taskId, 'gif-queue-1');
  assert.equal(snapshot.kind, 'videoToGif');
  const finished = await new Promise((resolve) => {
    const tick = () => {
      const current = queue.get('gif-queue-1');
      if (current && (current.status === 'complete' || current.status === 'failed' || current.status === 'cancelled'))
        resolve(current);
      else setTimeout(tick, 5);
    };
    tick();
  });
  assert.equal(finished.status, 'complete');
  assert.equal(finished.result.filename, 'hd-gif.gif');
  assert.equal(finished.result.localPath, 'output/Gif/hd-gif.gif');
  assert.equal(finished.result.imageWidth, 720);
  assert.equal(finished.result.imageHeight, 405);
  assert.equal(runCount, 1);
  assert.ok(updates.some((entry) => entry.status === 'complete' && entry.kind === 'videoToGif'));
});

test('the shared registration exposes a videoToGif handler', () => {
  const registered = new Map();
  registerSharedMediaTaskHandlers(
    { setHandler: (kind, handler) => registered.set(kind, handler) },
    {},
  );
  assert.equal(typeof registered.get('videoToGif'), 'function');
});

test('a queue without setHandler is tolerated', () => {
  assert.doesNotThrow(() => registerSharedMediaTaskHandlers(null, {}));
  assert.doesNotThrow(() => registerSharedMediaTaskHandlers({}, {}));
});

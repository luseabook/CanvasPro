import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildAudioVoiceComposeFfmpegArgs,
  createAudioVoiceComposeMediaTaskHandler,
  normalizeAudioVoiceClips,
} from './audioVoiceComposeTask.js';
import { registerSharedMediaTaskHandlers } from './registerSharedMediaTaskHandlers.js';
import { MediaTaskQueue } from '../mediaTaskQueue.js';

function makeOutputDir(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'voice-compose-out-'));
  if (t && typeof t.after === 'function') t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function createRig({
  outputDir,
  videoMeta = { width: 1920, height: 1080, duration: 6, fps: 30 },
  durations = {},
  runFfmpegTask = null,
} = {}) {
  const processes = [],
    toolCalls = [],
    videoMetaCalls = [],
    injectedRuns = [];
  const queue = {
    runProcess: (task, command, args, options = {}) => {
      processes.push({ command, args: [...args], options: { ...options } });
      const source = args[args.length - 1],
        duration = durations[source];
      if (duration !== undefined)
        return Promise.resolve({
          stdout: Buffer.from(JSON.stringify({ format: { duration } })),
          stderr: Buffer.alloc(0),
          code: 0,
        });
      return Promise.resolve({ stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), code: 0 });
    },
  };
  const handler = createAudioVoiceComposeMediaTaskHandler({
    createOutputFilename: (prefix, ext) => prefix + '-fixed.' + ext,
    ffprobeVideoMeta: async (q, task, source) => {
      videoMetaCalls.push(source);
      return videoMeta;
    },
    getOutputDir: () => outputDir,
    getRuntimeToolOrFallback: (name) => {
      toolCalls.push(name);
      return '/runtime/' + name;
    },
    resolveMediaTaskSource: (src) => path.resolve(String(src)),
    toOutputLocalPath: (folder, name) => 'output/' + folder + '/' + name,
    ...(typeof runFfmpegTask === 'function'
      ? {
          runFfmpegTask: (task, queue, args, options) => {
            injectedRuns.push({ args, options });
            return runFfmpegTask(task, queue, args, options);
          },
        }
      : {}),
  });
  return {
    handler,
    processes,
    toolCalls,
    videoMetaCalls,
    injectedRuns,
    ffmpegProcesses: () => processes.filter((entry) => entry.command === '/runtime/ffmpeg'),
    run: (payload = {}) => handler({ taskId: 'voice-1', payload }, queue),
  };
}

test('clip normalization drops unusable entries and keeps explicit durations', () => {
  assert.deepEqual(normalizeAudioVoiceClips('nope'), []);
  assert.deepEqual(normalizeAudioVoiceClips([null, 7, {}, { src: '   ' }]), []);
  assert.deepEqual(normalizeAudioVoiceClips([{ src: 'a.mp3', durationMs: 0, startMs: 0 }]), []);
});

test('clip normalization maps source aliases into seconds', () => {
  assert.deepEqual(
    normalizeAudioVoiceClips([
      { src: 'a.mp3', startMs: 500, endMs: 2500 },
      { localPath: 'b.mp3', timelineStartMs: 1000, timelineEndMs: 4000 },
    ]),
    [
      { src: 'a.mp3', startSec: 0.5, durationSec: 2, hasExplicitDuration: false },
      { src: 'b.mp3', startSec: 1, durationSec: 3, hasExplicitDuration: false },
    ],
  );
});

test('an explicit duration wins over the timeline span and is flagged', () => {
  assert.deepEqual(
    normalizeAudioVoiceClips([
      { path: 'a.mp3', startMs: 0, endMs: 9000, durationMs: 1500 },
      { audioUrl: 'b.mp3', durationSec: 2.5 },
    ]),
    [
      { src: 'a.mp3', startSec: 0, durationSec: 1.5, hasExplicitDuration: true },
      { src: 'b.mp3', startSec: 0, durationSec: 2.5, hasExplicitDuration: true },
    ],
  );
});

test('a reversed timeline clamps instead of producing a negative span', () => {
  assert.deepEqual(normalizeAudioVoiceClips([{ src: 'a.mp3', startMs: 4000, endMs: 1000 }]), []);
});

test('video to video keeps the source input and mixes every clip', () => {
  assert.deepEqual(
    buildAudioVoiceComposeFfmpegArgs({
      sourceKind: 'video',
      outputKind: 'video',
      sourceAbs: 'F:/media/base.mp4',
      clipAbs: ['F:/media/a.mp3', 'F:/media/b.mp3'],
      clips: [
        { startSec: 0.5, durationSec: 2 },
        { startSec: 3, durationSec: 1.5 },
      ],
      durationSec: 5,
      outAbs: 'F:/out/AudioVoiceVideo/voice_compose_1.mp4',
    }),
    [
      '-y',
      '-i',
      'F:/media/base.mp4',
      '-i',
      'F:/media/a.mp3',
      '-i',
      'F:/media/b.mp3',
      '-filter_complex',
      [
        '[1:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:2,asetpts=PTS-STARTPTS,adelay=500|500[av0]',
        '[2:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:1.5,asetpts=PTS-STARTPTS,adelay=3000|3000[av1]',
        '[av0][av1]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:5[a]',
      ].join(';'),
      '-map',
      '0:v:0',
      '-map',
      '[a]',
      '-t',
      '5',
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
      'F:/out/AudioVoiceVideo/voice_compose_1.mp4',
    ],
  );
});

test('a video source rendered to audio drops the video input but keeps aac', () => {
  assert.deepEqual(
    buildAudioVoiceComposeFfmpegArgs({
      sourceKind: 'video',
      outputKind: 'audio',
      sourceAbs: 'F:/media/base.mp4',
      clipAbs: ['F:/media/a.mp3'],
      clips: [{ startSec: 0, durationSec: 4 }],
      durationSec: 4,
      outAbs: 'F:/out/AudioVoiceAudio/voice_compose_1.m4a',
    }),
    [
      '-y',
      '-i',
      'F:/media/a.mp3',
      '-filter_complex',
      '[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:4,asetpts=PTS-STARTPTS,adelay=0|0[av0];[av0]apad,atrim=0:4[a]',
      '-map',
      '[a]',
      '-t',
      '4',
      '-vn',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      'F:/out/AudioVoiceAudio/voice_compose_1.m4a',
    ],
  );
});

test('a single clip uses apad and an audio source keeps libmp3lame', () => {
  const args = buildAudioVoiceComposeFfmpegArgs({
    sourceKind: 'audio',
    sourceAbs: 'F:/media/base.mp3',
    clipAbs: ['F:/media/a.mp3'],
    clips: [{ startSec: 1.25, durationSec: 2 }],
    durationSec: 2,
    outAbs: 'F:/out/AudioVoiceAudio/voice_compose_1.mp3',
  });
  assert.equal(
    args[args.indexOf('-filter_complex') + 1],
    '[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:2,asetpts=PTS-STARTPTS,adelay=1250|1250[av0];[av0]apad,atrim=0:2[a]',
  );
  assert.deepEqual(args.slice(-10), [
    '-map',
    '[a]',
    '-t',
    '2',
    '-vn',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    'F:/out/AudioVoiceAudio/voice_compose_1.mp3',
  ]);
  assert.ok(!args.includes('F:/media/base.mp3'));
});

test('an incomplete compose payload is rejected', () => {
  assert.throws(
    () => buildAudioVoiceComposeFfmpegArgs({ durationSec: 5, clips: [{ startSec: 0, durationSec: 5 }] }),
    /Invalid audio voice compose payload/,
  );
  assert.throws(
    () =>
      buildAudioVoiceComposeFfmpegArgs({
        durationSec: 5,
        clips: [{ startSec: 0, durationSec: 5 }],
        outAbs: '',
      }),
    /Invalid audio voice compose payload/,
  );
  assert.throws(
    () => buildAudioVoiceComposeFfmpegArgs({ durationSec: 0, clips: [], outAbs: 'F:/out/x.mp4' }),
    /Invalid audio voice compose payload/,
  );
});

test('an empty clip list is rejected before any encoding', async (t) => {
  const outputDir = makeOutputDir(t),
    rig = createRig({ outputDir });
  await assert.rejects(() => rig.run({ src: 'F:/media/base.mp4', args: { clips: [] } }), /Invalid audio voice compose clips/);
  assert.equal(rig.processes.length, 0);
  assert.ok(!existsSync(path.join(outputDir, 'AudioVoiceVideo')));
});

test('a video source without a video stream is rejected before encoding', async (t) => {
  const outputDir = makeOutputDir(t),
    rig = createRig({ outputDir, videoMeta: { width: 0, height: 0, duration: 6, fps: 0 } });
  await assert.rejects(
    () => rig.run({ src: 'F:/media/base.mp4', args: { clips: [{ src: 'a.mp3', durationMs: 1000 }] } }),
    /Source video has no video stream/,
  );
  assert.equal(rig.processes.length, 0);
});

test('a zero-length clip is rejected by the clip guard, not the duration guard', async (t) => {
  const outputDir = makeOutputDir(t),
    rig = createRig({ outputDir, videoMeta: { width: 640, height: 480, duration: 0, fps: 25 } });
  await assert.rejects(
    () => rig.run({ src: 'F:/media/base.mp4', args: { clips: [{ src: 'a.mp3' }] } }),
    /Invalid audio voice compose clips/,
  );
  assert.equal(rig.processes.length, 0);
});

test('a video voice compose renders an mp4 plus a poster', async (t) => {
  const outputDir = makeOutputDir(t),
    rig = createRig({ outputDir }),
    result = await rig.run({
      src: 'F:/media/base.mp4',
      args: { sourceKind: 'video', outputKind: 'video', clips: [{ src: 'a.mp3', durationMs: 2000 }] },
    });
  assert.equal(result.success, true);
  assert.equal(result.filename, 'voice_compose-fixed.mp4');
  assert.equal(result.path, 'output/AudioVoiceVideo/voice_compose-fixed.mp4');
  assert.equal(result.localPath, 'output/AudioVoiceVideo/voice_compose-fixed.mp4');
  assert.equal(result.url, '/output/AudioVoiceVideo/voice_compose-fixed.mp4');
  assert.equal(result.audioDuration, 6);
  assert.equal(result.videoDuration, 6);
  assert.equal(result.videoWidth, 1920);
  assert.equal(result.videoHeight, 1080);
  assert.equal(result.fps, 30);
  assert.equal(result.posterLocalPath, 'output/VideoThumbs/voice_compose_poster-fixed.jpg');
  assert.equal(result.posterUrl, '/output/VideoThumbs/voice_compose_poster-fixed.jpg');
  assert.equal(result.thumbUrl, '/output/VideoThumbs/voice_compose_poster-fixed.jpg');
  assert.ok(existsSync(path.join(outputDir, 'AudioVoiceVideo')));
  assert.ok(existsSync(path.join(outputDir, 'VideoThumbs')));
  const encodes = rig.ffmpegProcesses();
  assert.equal(encodes.length, 2);
  assert.deepEqual(encodes[0].options, { durationSec: 6, progressMessage: 'Composing voice video' });
  assert.deepEqual(encodes[1].options, { progressMessage: 'Creating voice video poster' });
  assert.equal(encodes[1].args[1], '-ss');
});

test('an explicit duration beats the probed source duration', async (t) => {
  const outputDir = makeOutputDir(t),
    rig = createRig({ outputDir }),
    result = await rig.run({
      src: 'F:/media/base.mp4',
      args: {
        sourceKind: 'video',
        outputKind: 'audio',
        durationMs: 2500,
        clips: [{ src: 'a.mp3', durationMs: 1000 }],
      },
    });
  assert.equal(result.audioDuration, 2.5);
  assert.equal(result.filename, 'voice_compose-fixed.m4a');
  assert.equal(result.path, 'output/AudioVoiceAudio/voice_compose-fixed.m4a');
  assert.equal('videoDuration' in result, false);
  assert.equal('posterLocalPath' in result, false);
  assert.equal(rig.videoMetaCalls.length, 1);
  const encodes = rig.ffmpegProcesses();
  assert.equal(encodes.length, 1);
  assert.deepEqual(encodes[0].options, { durationSec: 2.5, progressMessage: 'Composing voice audio' });
  assert.equal(encodes[0].args[encodes[0].args.indexOf('-t') + 1], '2.5');
});

test('clip durations are probed when the payload omits them', async (t) => {
  const outputDir = makeOutputDir(t),
    clipAbs = path.resolve('clip-a.mp3'),
    rig = createRig({ outputDir, durations: { [clipAbs]: 3.5 } }),
    result = await rig.run({
      src: 'F:/media/base.mp3',
      args: {
        sourceKind: 'audio',
        outputKind: 'audio',
        clips: [{ src: 'clip-a.mp3', startMs: 1000, endMs: 5000 }],
      },
    });
  assert.equal(result.audioDuration, 4.5);
  assert.equal(result.filename, 'voice_compose-fixed.mp3');
  const filter =
    rig.ffmpegProcesses()[0].args[rig.ffmpegProcesses()[0].args.indexOf('-filter_complex') + 1];
  assert.equal(
    filter,
    '[0:a]aformat=sample_rates=44100:channel_layouts=stereo,atrim=0:3.5,asetpts=PTS-STARTPTS,adelay=1000|1000[av0];[av0]apad,atrim=0:4.5[a]',
  );
  assert.deepEqual(rig.toolCalls, ['ffprobe', 'ffprobe', 'ffmpeg']);
});

test('an injected runFfmpegTask replaces the queue process runner', async (t) => {
  const outputDir = makeOutputDir(t),
    rig = createRig({ outputDir, runFfmpegTask: () => Promise.resolve({ code: 0 }) }),
    result = await rig.run({
      src: 'F:/media/base.mp4',
      args: {
        sourceKind: 'video',
        outputKind: 'audio',
        durationSec: 4,
        clips: [{ src: 'a.mp3', durationMs: 1000 }],
      },
    });
  assert.equal(result.filename, 'voice_compose-fixed.m4a');
  assert.equal(rig.injectedRuns.length, 1);
  assert.deepEqual(rig.injectedRuns[0].options, { durationSec: 4, progressMessage: 'Composing voice audio' });
  assert.equal(rig.processes.length, 0);
  assert.deepEqual(rig.toolCalls, []);
});

test('the media task queue runs a registered audioVoiceCompose task end to end', async (t) => {
  const outputDir = makeOutputDir(t);
  const updates = [];
  const queue = new MediaTaskQueue({ onUpdate: (snapshot) => updates.push(snapshot) });
  let runCount = 0;
  queue.setHandler(
    'audioVoiceCompose',
    createAudioVoiceComposeMediaTaskHandler({
      createOutputFilename: (prefix, ext) => prefix + '.' + ext,
      ffprobeVideoMeta: async () => ({ width: 1280, height: 720, duration: 5, fps: 30 }),
      getOutputDir: () => outputDir,
      getRuntimeToolOrFallback: (name) => '/runtime/' + name,
      resolveMediaTaskSource: (src) => path.resolve(String(src)),
      runFfmpegTask: () => {
        runCount += 1;
        return Promise.resolve({ code: 0 });
      },
      toOutputLocalPath: (folder, name) => 'output/' + folder + '/' + name,
    }),
  );
  const snapshot = queue.enqueue({
    kind: 'audioVoiceCompose',
    taskId: 'voice-queue-1',
    nodeId: 'node-9',
    src: 'F:/media/base.mp4',
    args: { sourceKind: 'video', outputKind: 'audio', clips: [{ src: 'a.mp3', durationMs: 1000 }] },
  });
  assert.equal(snapshot.taskId, 'voice-queue-1');
  assert.equal(snapshot.kind, 'audioVoiceCompose');
  const finished = await new Promise((resolve) => {
    const tick = () => {
      const current = queue.get('voice-queue-1');
      if (current && (current.status === 'complete' || current.status === 'failed' || current.status === 'cancelled'))
        resolve(current);
      else setTimeout(tick, 5);
    };
    tick();
  });
  assert.equal(finished.status, 'complete');
  assert.equal(finished.result.filename, 'voice_compose.m4a');
  assert.equal(finished.result.localPath, 'output/AudioVoiceAudio/voice_compose.m4a');
  assert.equal(finished.result.audioDuration, 5);
  assert.equal(runCount, 1);
  assert.ok(updates.some((entry) => entry.status === 'complete' && entry.kind === 'audioVoiceCompose'));
});

test('the shared registration exposes an audioVoiceCompose handler', () => {
  const registered = new Map();
  registerSharedMediaTaskHandlers(
    { setHandler: (kind, handler) => registered.set(kind, handler) },
    {},
  );
  assert.equal(typeof registered.get('audioVoiceCompose'), 'function');
});

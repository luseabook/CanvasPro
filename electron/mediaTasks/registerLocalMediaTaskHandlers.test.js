import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { registerLocalMediaTaskHandlers } from './registerLocalMediaTaskHandlers.js';

function createRig(t, overrides = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'local-media-'));
  if (t && typeof t.after === 'function')
    t.after(() => rmSync(root, { recursive: true, force: true }));
  const assetsDir = path.join(root, 'assets'),
    outputDir = path.join(root, 'output'),
    srcDir = path.join(root, 'src'),
    calls = { runProcess: [], emitProgress: [], assetUpdated: [], updateAssetRecord: [] },
    handlers = new Map();
  const deps = {
    buildWaveformJsonFromFloat32: (buffer) => ({
      version: 1,
      samples: 3,
      peaks: [0, 0.5, 1],
      bytes: buffer?.byteLength ?? 0,
    }),
    createOutputFilename: (prefix, extension) => `${prefix}_fixed.${extension}`,
    ensureAssetVideoPlaybackProxy: async () => ({ videoProxyStatus: 'not_required' }),
    ffprobeHasAudio: async () => true,
    ffprobeVideoMeta: async () => ({ width: 1920, height: 1080, duration: 12, fps: 30 }),
    getAssetsDir: () => assetsDir,
    getOutputDir: () => outputDir,
    getRuntimeToolOrFallback: (name) => `${name}-bin`,
    resolveMediaTaskSource: (src) => path.join(srcDir, String(src || '').replace(/^\/+/, '')),
    sendAssetUpdated: (record) => calls.assetUpdated.push(record),
    toAssetLocalPath: (...parts) => ['data', 'assets', ...parts].filter(Boolean).join('/'),
    toOutputLocalPath: (...parts) => ['output', ...parts].filter(Boolean).join('/'),
    updateAssetRecord: (assetId, patch) => {
      calls.updateAssetRecord.push({ assetId, patch });
      return { assetId, ...patch };
    },
    ...overrides,
  };
  const queue = {
    runProcess: async (task, command, args, options = {}) => {
      calls.runProcess.push({ task, command, args, options });
      return { stdout: Buffer.from([1, 2, 3, 4]) };
    },
    emitProgress: (task, progress, message) => calls.emitProgress.push({ progress, message }),
    setHandler: (kind, handler) => handlers.set(kind, handler),
  };
  registerLocalMediaTaskHandlers(queue, deps);
  return {
    root,
    assetsDir,
    outputDir,
    srcDir,
    deps,
    queue,
    calls,
    handlers,
    sourcePath: (name) => path.join(srcDir, name),
    touchSource: (name) => {
      mkdirSync(srcDir, { recursive: true });
      const file = path.join(srcDir, name);
      writeFileSync(file, 'x');
      return file;
    },
    run: (kind, payload, task = {}) =>
      handlers.get(kind)({ id: 'task-1', kind, payload, ...task }, queue),
  };
}

test('registerLocalMediaTaskHandlers registers the eight local kinds', (t) => {
  const rig = createRig(t);
  assert.deepEqual(
    [...rig.handlers.keys()].sort(),
    [
      'audioCut',
      'audioWaveform',
      'videoAudioMux',
      'videoAudioSeparate',
      'videoCompose',
      'videoCut',
      'videoFirstFrame',
      'videoPoster',
    ].sort(),
  );
});

test('registerLocalMediaTaskHandlers tolerates a missing queue', () => {
  assert.equal(registerLocalMediaTaskHandlers(null, {}), undefined);
  assert.equal(registerLocalMediaTaskHandlers({}, {}), undefined);
});

test('videoPoster derives the asset key, renders a 640px poster and normalises the proxy result', async (t) => {
  const rig = createRig(t);
  const result = await rig.run('videoPoster', {
    src: 'clip.mp4',
    assetId: 'asset-1',
    videoProxyTargetVersion: 'v2-1280',
  });
  assert.equal(rig.calls.runProcess.length, 1);
  const run = rig.calls.runProcess[0];
  assert.equal(run.command, 'ffmpeg-bin');
  assert.deepEqual(run.args, [
    '-y',
    '-ss',
    '0.1',
    '-i',
    rig.sourcePath('clip.mp4'),
    '-frames:v',
    '1',
    '-vf',
    'scale=640:-2',
    path.join(rig.assetsDir, 'derived', 'video', 'asset-1.poster.jpg'),
  ]);
  assert.equal(run.options.timeoutMs, 60000);
  assert.equal(existsSync(path.join(rig.assetsDir, 'derived', 'video')), true);
  assert.deepEqual(result, {
    videoProxyStatus: 'not_required',
    displayLocalPath: 'clip.mp4',
    displayUrl: '/clip.mp4',
    videoProxyVersion: 'v2-1280',
    posterLocalPath: 'data/assets/derived/video/asset-1.poster.jpg',
    thumbLocalPath: 'data/assets/derived/video/asset-1.poster.jpg',
    posterUrl: '/data/assets/derived/video/asset-1.poster.jpg',
    thumbUrl: '/data/assets/derived/video/asset-1.poster.jpg',
  });
  assert.equal(rig.calls.updateAssetRecord.length, 1);
  assert.equal(rig.calls.updateAssetRecord[0].patch.mediaTaskStatus, 'complete');
  assert.equal(rig.calls.updateAssetRecord[0].patch.mediaTaskProgress, 1);
  assert.equal(rig.calls.updateAssetRecord[0].patch.status, 'ready');
  assert.equal(rig.calls.assetUpdated.length, 1);
});

test('videoPoster skips ffmpeg for an existing poster and ignores assets without an id', async (t) => {
  const rig = createRig(t);
  const posterDir = path.join(rig.srcDir, '..', 'assets', 'derived', 'video');
  mkdirSync(posterDir, { recursive: true });
  writeFileSync(path.join(posterDir, 'asset-2.poster.jpg'), 'jpg');
  const result = await rig.run('videoPoster', { src: 'clip.mp4', assetId: 'asset-2' });
  assert.equal(rig.calls.runProcess.length, 0);
  assert.equal(rig.calls.updateAssetRecord.length, 1);
  assert.equal(result.posterLocalPath, 'data/assets/derived/video/asset-2.poster.jpg');
  const derived = await rig.run('videoPoster', { src: 'other.mp4' });
  assert.equal(rig.calls.updateAssetRecord.length, 1);
  const derivedKey = createHash('sha1').update('other.mp4').digest('hex');
  assert.equal(
    derived.posterLocalPath,
    'data/assets/derived/video/' + derivedKey + '.poster.jpg',
  );
  assert.equal(derived.posterUrl, '/data/assets/derived/video/' + derivedKey + '.poster.jpg');
});

test('audioWaveform captures f32le audio and writes the waveform json', async (t) => {
  const rig = createRig(t);
  const result = await rig.run('audioWaveform', { src: 'voice.mp3', assetId: 'asset-3' });
  assert.equal(rig.calls.runProcess.length, 1);
  const run = rig.calls.runProcess[0];
  assert.deepEqual(run.args, [
    '-v',
    'error',
    '-i',
    rig.sourcePath('voice.mp3'),
    '-ac',
    '1',
    '-ar',
    '8000',
    '-f',
    'f32le',
    'pipe:1',
  ]);
  assert.equal(run.options.timeoutMs, 30 * 60 * 1000);
  const waveformFile = path.join(rig.assetsDir, 'derived', 'audio', 'asset-3.waveform.json');
  assert.equal(existsSync(waveformFile), true);
  assert.equal(readFileSync(waveformFile, 'utf8'), JSON.stringify({ version: 1, samples: 3, peaks: [0, 0.5, 1], bytes: 4 }) + '\n');
  assert.deepEqual(result, {
    waveformLocalPath: 'data/assets/derived/audio/asset-3.waveform.json',
    waveformUrl: '/data/assets/derived/audio/asset-3.waveform.json',
  });
  assert.equal(rig.calls.assetUpdated.length, 1);
});

test('audioWaveform reuses an existing waveform file and hashes the source without an asset id', async (t) => {
  const rig = createRig(t);
  const audioDir = path.join(rig.assetsDir, 'derived', 'audio');
  mkdirSync(audioDir, { recursive: true });
  const key = createHash('sha1').update('voice.mp3').digest('hex');
  writeFileSync(path.join(audioDir, key + '.waveform.json'), 'cached');
  const result = await rig.run('audioWaveform', { src: 'voice.mp3' });
  assert.equal(rig.calls.runProcess.length, 0);
  assert.equal(result.waveformLocalPath, 'data/assets/derived/audio/' + key + '.waveform.json');
  assert.equal(rig.calls.updateAssetRecord.length, 0);
});

test('videoFirstFrame derives a content hash thumb name and probes the real mtime/size', async (t) => {
  const rig = createRig(t);
  const source = rig.touchSource('clip.mp4');
  const stat = statSync(source);
  const digest = createHash('sha1')
    .update('clip.mp4|' + stat.mtimeMs + '|' + stat.size)
    .digest('hex')
    .slice(0, 12);
  const result = await rig.run('videoFirstFrame', { src: 'clip.mp4' });
  assert.equal(rig.calls.runProcess.length, 1);
  assert.deepEqual(rig.calls.runProcess[0].args, [
    '-y',
    '-ss',
    '0',
    '-i',
    source,
    '-frames:v',
    '1',
    '-vf',
    'scale=240:-2',
    '-q:v',
    '8',
    '-an',
    path.join(rig.outputDir, 'VideoThumbs', 'vthumb_' + digest + '.jpg'),
  ]);
  assert.deepEqual(result, {
    success: true,
    localPath: 'output/VideoThumbs/vthumb_' + digest + '.jpg',
    path: 'output/VideoThumbs/vthumb_' + digest + '.jpg',
    url: '/output/VideoThumbs/vthumb_' + digest + '.jpg',
  });
});

test('videoFirstFrame skips ffmpeg when the thumb already exists', async (t) => {
  const rig = createRig(t);
  const source = rig.touchSource('clip.mp4');
  const stat = statSync(source);
  const digest = createHash('sha1')
    .update('clip.mp4|' + stat.mtimeMs + '|' + stat.size)
    .digest('hex')
    .slice(0, 12);
  const thumbDir = path.join(rig.outputDir, 'VideoThumbs');
  mkdirSync(thumbDir, { recursive: true });
  writeFileSync(path.join(thumbDir, 'vthumb_' + digest + '.jpg'), 'jpg');
  const result = await rig.run('videoFirstFrame', { src: 'clip.mp4' });
  assert.equal(rig.calls.runProcess.length, 0);
  assert.equal(result.success, true);
});

test('videoCut rejects inverted ranges before touching ffmpeg', async (t) => {
  const rig = createRig(t);
  await assert.rejects(
    () => rig.run('videoCut', { src: 'clip.mp4', args: { start: 4, end: 4 } }),
    /Invalid video cut range/,
  );
  assert.equal(rig.calls.runProcess.length, 0);
  assert.equal(existsSync(path.join(rig.outputDir, 'CutVideo')), false);
});

test('videoCut keeps only the 16/24/30 frame rates and forwards cut progress', async (t) => {
  const rig = createRig(t);
  for (const [fps, expected] of [
    [24, ['-r', '24']],
    [25, []],
  ]) {
    await rig.run('videoCut', { src: 'clip.mp4', args: { start: 1, end: 3.5, fps } });
    const run = rig.calls.runProcess.at(-1);
    assert.equal(run.args.includes('-r'), expected.length > 0);
    assert.ok(run.args.includes('-t'));
    assert.equal(run.args[run.args.indexOf('-t') + 1], '2.5');
    assert.deepEqual(run.options, { durationSec: 2.5, progressMessage: 'Cutting video' });
    assert.equal(
      run.args[run.args.length - 1],
      path.join(rig.outputDir, 'CutVideo', 'cut_fixed.mp4'),
    );
  }
  assert.equal(rig.calls.runProcess.length, 2);
});

test('audioCut rejects inverted ranges and emits the mp3 table', async (t) => {
  const rig = createRig(t);
  await assert.rejects(
    () => rig.run('audioCut', { src: 'voice.mp3', args: { start: 5, end: 2 } }),
    /Invalid audio cut range/,
  );
  await rig.run('audioCut', { src: 'voice.mp3', start: 0, end: 2 });
  const run = rig.calls.runProcess.at(-1);
  assert.deepEqual(run.args, [
    '-y',
    '-i',
    rig.sourcePath('voice.mp3'),
    '-ss',
    '0',
    '-t',
    '2',
    '-vn',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    path.join(rig.outputDir, 'CutAudio', 'cut_fixed.mp3'),
  ]);
  assert.deepEqual(run.options, { durationSec: 2, progressMessage: 'Cutting audio' });
});

test('videoAudioSeparate guards the video and audio streams', async (t) => {
  const noVideo = createRig(t, { ffprobeVideoMeta: async () => ({ width: 0, height: 0 }) });
  await assert.rejects(
    () => noVideo.run('videoAudioSeparate', { src: 'clip.mp4' }),
    /Source video has no video stream/,
  );
  const noAudio = createRig(t, { ffprobeHasAudio: async () => false });
  await assert.rejects(
    () => noAudio.run('videoAudioSeparate', { src: 'clip.mp4' }),
    /Source video has no audio stream/,
  );
});

test('videoAudioSeparate writes both derived files and reports the audio stage', async (t) => {
  const rig = createRig(t);
  const result = await rig.run('videoAudioSeparate', { src: 'clip.mp4' });
  assert.equal(rig.calls.runProcess.length, 2);
  const [videoRun, audioRun] = rig.calls.runProcess;
  assert.deepEqual(videoRun.args, [
    '-y',
    '-i',
    rig.sourcePath('clip.mp4'),
    '-map',
    '0:v:0',
    '-an',
    '-c:v',
    'copy',
    path.join(rig.outputDir, 'SeparateVideo', 'video_fixed.mp4'),
  ]);
  assert.deepEqual(videoRun.options, {
    durationSec: 12,
    initialProgress: 0.05,
    progressMessage: 'Extracting video',
  });
  assert.deepEqual(audioRun.args, [
    '-y',
    '-i',
    rig.sourcePath('clip.mp4'),
    '-map',
    '0:a:0',
    '-vn',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    path.join(rig.outputDir, 'SeparateAudio', 'audio_fixed.mp3'),
  ]);
  assert.deepEqual(audioRun.options, {
    durationSec: 12,
    initialProgress: 0.55,
    progressMessage: 'Extracting audio',
  });
  assert.deepEqual(rig.calls.emitProgress, [{ progress: 0.55, message: 'Extracting audio' }]);
  assert.deepEqual(result, {
    success: true,
    video: {
      filename: 'video_fixed.mp4',
      path: 'output/SeparateVideo/video_fixed.mp4',
      localPath: 'output/SeparateVideo/video_fixed.mp4',
      url: '/output/SeparateVideo/video_fixed.mp4',
    },
    audio: {
      filename: 'audio_fixed.mp3',
      path: 'output/SeparateAudio/audio_fixed.mp3',
      localPath: 'output/SeparateAudio/audio_fixed.mp3',
      url: '/output/SeparateAudio/audio_fixed.mp3',
    },
  });
});

const videoFilter = (index) =>
  `[${index}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p,setpts=PTS-STARTPTS[v${index}]`;
const audioFilter = (index) =>
  `[${index}:a]aformat=sample_rates=44100:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${index}]`;

test('videoCompose rejects an empty list and a single source that still wants audio', async (t) => {
  const rig = createRig(t);
  await assert.rejects(
    () => rig.run('videoCompose', { args: { srcs: [] } }),
    /Invalid video compose sources/,
  );
  await assert.rejects(
    () => rig.run('videoCompose', { args: { srcs: ['a.mp4'] } }),
    /Invalid video compose sources/,
  );
  assert.equal(rig.calls.runProcess.length, 0);
});

test('videoCompose concatenates video and audio when every source has a track', async (t) => {
  const rig = createRig(t);
  const result = await rig.run('videoCompose', { args: { srcs: ['a.mp4', 'b.mp4'] } });
  const run = rig.calls.runProcess.at(-1);
  assert.equal(
    run.args[run.args.indexOf('-filter_complex') + 1],
    [
      videoFilter(0),
      audioFilter(0),
      videoFilter(1),
      audioFilter(1),
      '[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]',
    ].join(';'),
  );
  assert.deepEqual(run.args.slice(0, 6), [
    '-y',
    '-i',
    rig.sourcePath('a.mp4'),
    '-i',
    rig.sourcePath('b.mp4'),
    '-filter_complex',
  ]);
  assert.ok(run.args.includes('[a]'));
  assert.equal(run.args[run.args.indexOf('-c:a') + 1], 'aac');
  assert.deepEqual(run.options, { durationSec: 12, progressMessage: 'Composing video' });
  assert.deepEqual(result, {
    success: true,
    filename: 'compose_fixed.mp4',
    path: 'output/ComposeVideo/compose_fixed.mp4',
    localPath: 'output/ComposeVideo/compose_fixed.mp4',
    url: '/output/ComposeVideo/compose_fixed.mp4',
  });
});

test('videoCompose drops the audio side when one source is silent', async (t) => {
  let index = 0;
  const rig = createRig(t, {
    ffprobeHasAudio: async () => {
      index += 1;
      return index === 1;
    },
  });
  await rig.run('videoCompose', { args: { srcs: ['a.mp4', 'b.mp4'] } });
  const run = rig.calls.runProcess.at(-1);
  const graph = run.args[run.args.indexOf('-filter_complex') + 1];
  assert.equal(graph, [videoFilter(0), videoFilter(1), '[v0][v1]concat=n=2:v=1:a=0[v]'].join(';'));
  assert.equal(graph.includes('aformat'), false);
  assert.equal(run.args.includes('-c:a'), false);
  assert.equal(run.args.includes('[a]'), false);
});

test('videoCompose accepts a single source when audio is explicitly excluded', async (t) => {
  const rig = createRig(t);
  await rig.run('videoCompose', { srcs: ['a.mp4'], args: { includeAudio: false } });
  const run = rig.calls.runProcess.at(-1);
  assert.equal(
    run.args[run.args.indexOf('-filter_complex') + 1],
    [videoFilter(0), '[v0]concat=n=1:v=1:a=0[v]'].join(';'),
  );
  assert.deepEqual(run.args.slice(0, 4), ['-y', '-i', rig.sourcePath('a.mp4'), '-filter_complex']);
  assert.equal(run.args.includes('-c:a'), false);
});

test('videoAudioMux copies the video track and pads the external audio to the video length', async (t) => {
  const rig = createRig(t);
  const result = await rig.run('videoAudioMux', {
    src: 'clip.mp4',
    args: { audioSrc: 'voice.mp3' },
  });
  const run = rig.calls.runProcess.at(-1);
  assert.deepEqual(run.args, [
    '-y',
    '-i',
    rig.sourcePath('clip.mp4'),
    '-i',
    rig.sourcePath('voice.mp3'),
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-af',
    'apad',
    '-t',
    '12',
    '-movflags',
    '+faststart',
    path.join(rig.outputDir, 'MuxVideo', 'mux_fixed.mp4'),
  ]);
  assert.deepEqual(run.options, { durationSec: 12, progressMessage: 'Muxing video audio' });
  assert.deepEqual(result, {
    success: true,
    filename: 'mux_fixed.mp4',
    path: 'output/MuxVideo/mux_fixed.mp4',
    localPath: 'output/MuxVideo/mux_fixed.mp4',
    url: '/output/MuxVideo/mux_fixed.mp4',
  });
});

test('videoAudioMux falls back to -shortest when the video length is unknown', async (t) => {
  const rig = createRig(t, { ffprobeVideoMeta: async () => ({ width: 1920, height: 1080 }) });
  await rig.run('videoAudioMux', { args: { src: 'clip.mp4', audioSrc: 'voice.mp3' } });
  const run = rig.calls.runProcess.at(-1);
  assert.equal(run.args.includes('-t'), false);
  assert.equal(run.args[run.args.indexOf('-af') + 1], 'apad');
  assert.equal(run.args[run.args.indexOf('-af') + 2], '-shortest');
  assert.equal(run.options.durationSec, 0);
});

test('videoAudioMux guards both inputs', async (t) => {
  const noVideo = createRig(t, { ffprobeVideoMeta: async () => ({ width: 0, height: 1080 }) });
  await assert.rejects(
    () => noVideo.run('videoAudioMux', { args: { src: 'clip.mp4', audioSrc: 'voice.mp3' } }),
    /Source video has no video stream/,
  );
  const noAudio = createRig(t, { ffprobeHasAudio: async () => false });
  await assert.rejects(
    () => noAudio.run('videoAudioMux', { args: { src: 'clip.mp4', audioSrc: 'voice.mp3' } }),
    /Source audio has no audio stream/,
  );
});

test('videoCut uses the injected runFfmpegTask instead of the queue process path', async (t) => {
  const injected = [];
  const rig = createRig(t, {
    runFfmpegTask: async (task, queue, args, options) => {
      injected.push({ taskId: task.id, queueProcessed: typeof queue.runProcess, args, options });
      return {};
    },
  });
  await rig.run('videoCut', { src: 'clip.mp4', args: { start: 0, end: 1 } });
  assert.equal(rig.calls.runProcess.length, 0);
  assert.equal(injected.length, 1);
  assert.equal(injected[0].taskId, 'task-1');
  assert.equal(injected[0].options.progressMessage, 'Cutting video');
  assert.deepEqual(injected[0].args.slice(0, 2), ['-y', '-ss']);
  assert.equal(rig.calls.runProcess.length, 0);
});

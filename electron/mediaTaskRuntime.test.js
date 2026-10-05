import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildMediaTaskStatePatch, createMediaTaskRuntime } from './mediaTaskRuntime.js';

function createHarness(overrides = {}) {
  const state = {
    activity: [],
    taskbar: [],
    powerSave: [],
    assetUpdates: [],
    published: [],
    notifications: [],
    ffmpegCalls: [],
    ffprobeCaptureCalls: [],
    localDeps: null,
    sharedDeps: null,
    queueOptions: null,
  };
  const assetsDir = mkdtempSync(path.join(os.tmpdir(), 'aic-mtr-assets-'));
  const queueDouble = {
    runProcess: async () => ({ stdout: Buffer.from('') }),
    cancel: () => ({}),
  };
  const deps = {
    appRoot: path.resolve('/app-root'),
    platform: 'linux',
    env: { AIC_ASR_RUNTIME_MANIFEST_URL: '' },
    getRuntimeToolOrFallback: (tool) => '/tools/' + tool,
    getAssetsDir: () => assetsDir,
    getOutputDir: () => path.resolve('/output-dir'),
    resolveLocalVirtualPath: (value) => (value ? path.resolve('/virtual', value) : ''),
    updateAssetRecord: (assetId, patch, options) => {
      state.assetUpdates.push({ assetId: assetId, patch: patch, options: options });
      return { assetId: assetId, ...patch };
    },
    sendAssetUpdated: (asset) => state.published.push(asset),
    setTaskbarProgressSource: (...args) => state.taskbar.push(args),
    setPowerSaveBlocker: (...args) => state.powerSave.push(args),
    NotificationCtor: null,
    focusMainWindow: () => state.activity.push('focus'),
    publishTaskUpdate: (update) => state.published.push(update),
    getDoubaoAsrConfig: () => ({ provider: 'doubao' }),
    getBailianAsrConfig: () => ({ provider: 'bailian' }),
    getPythonCertificateEnv: () => ({ CURL_CA_BUNDLE: '/ca.pem' }),
    getFunasrModelRootDir: () => '/models/funasr',
    getUserDataRoot: () => path.resolve('/user-data'),
    resolveFallbackPythonCommand: () => 'py-fallback',
    resolvePythonCommand: () => 'py-asr',
    MediaTaskQueueCtor: function MediaTaskQueueCtorStub(options) {
      state.queueOptions = options;
      return queueDouble;
    },
    registerLocalHandlers: (queue, localDeps) => {
      state.localDeps = localDeps;
    },
    registerSharedHandlers: (queue, sharedDeps) => {
      state.sharedDeps = sharedDeps;
    },
    configureFfmpegRuntime: () => {},
    runCapture: async (command, args, options) => {
      state.ffprobeCaptureCalls.push({ command: command, args: args, options: options });
      return Buffer.from(JSON.stringify({ streams: [{}], format: {} }));
    },
    runFfmpegTask: async (queue, task, args, options) => {
      state.ffmpegCalls.push({ args: args, options: options });
      writeFileSync(args[args.length - 1], 'proxy');
      return {};
    },
    ...overrides,
  };
  function createNotificationCtor({ supported = true } = {}) {
    return class FakeNotification {
      static isSupported() {
        return supported;
      }
      constructor(options) {
        this.options = options;
        this.events = [];
        state.notifications.push(this);
      }
      on(event, handler) {
        this.events.push({ event: event, handler: handler });
        return this;
      }
      show() {
        this.shown = true;
      }
    };
  }
  deps.NotificationCtor = createNotificationCtor();
  const runtime = createMediaTaskRuntime(deps);
  return {
    state: state,
    assetsDir: assetsDir,
    queueDouble: queueDouble,
    runtime: runtime,
    deps: deps,
    createNotificationCtor: createNotificationCtor,
  };
}

test('buildMediaTaskStatePatch maps waiting and processing to a running job', () => {
  for (const status of ['waiting', 'processing']) {
    const patch = buildMediaTaskStatePatch({ taskId: 't1', kind: 'videoCut', status: status, progress: 0.5 });
    assert.deepEqual(patch, {
      mediaTaskId: 't1',
      mediaTaskKind: 'videoCut',
      mediaTaskStatus: status,
      mediaTaskProgress: 0.5,
      mediaTaskError: '',
      isGenerating: true,
      jobStatus: 'running',
    });
  }
});

test('buildMediaTaskStatePatch marks a failed task with an error fallback', () => {
  const patch = buildMediaTaskStatePatch({ taskId: 't2', kind: 'videoCut', status: 'failed' });
  assert.equal(patch.isGenerating, false);
  assert.equal(patch.jobStatus, 'error');
  assert.equal(patch.jobError, 'Media task failed');
  assert.deepEqual(buildMediaTaskStatePatch({ status: 'failed', error: 'boom' }).jobError, 'boom');
});

test('buildMediaTaskStatePatch clears state for complete and cancelled tasks', () => {
  const complete = buildMediaTaskStatePatch({ status: 'complete' });
  assert.equal(complete.isGenerating, false);
  assert.equal(complete.jobStatus, 'success');
  const cancelled = buildMediaTaskStatePatch({ status: 'cancelled' });
  assert.equal(cancelled.isGenerating, false);
  assert.equal(cancelled.jobStatus, null);
  assert.deepEqual(buildMediaTaskStatePatch({}), {
    mediaTaskId: '',
    mediaTaskKind: '',
    mediaTaskStatus: '',
    mediaTaskProgress: 0,
    mediaTaskError: '',
  });
});

test('createMediaTaskRuntime validates every required collaborator', () => {
  assert.throws(() => createMediaTaskRuntime({}), {
    name: 'TypeError',
    message: 'getRuntimeToolOrFallback must be a function',
  });
  const base = {
    getRuntimeToolOrFallback: () => {},
    getAssetsDir: () => {},
    getOutputDir: () => {},
    resolveLocalVirtualPath: () => {},
  };
  assert.throws(() => createMediaTaskRuntime({ ...base, updateAssetRecord: undefined }), {
    message: 'updateAssetRecord must be a function',
  });
  assert.throws(() => createMediaTaskRuntime({ ...base, updateAssetRecord: () => {}, sendAssetUpdated: 0 }), {
    message: 'sendAssetUpdated must be a function',
  });
});

test('createMediaTaskRuntime exposes the documented runtime surface', () => {
  const harness = createHarness();
  assert.deepEqual(Object.keys(harness.runtime).sort(), [
    'buildStatePatch',
    'getActivity',
    'getQueue',
    'probeVideoPlaybackInfoForImport',
  ]);
  assert.equal(harness.runtime.buildStatePatch, buildMediaTaskStatePatch);
  assert.deepEqual(harness.runtime.getActivity(), {
    activeCount: 0,
    waitingCount: 0,
    totalCount: 0,
    progress: 0,
    activeTasks: [],
  });
});

test('getQueue constructs a single queue with concurrency 2 and both handler sets', () => {
  const harness = createHarness();
  const first = harness.runtime.getQueue();
  const second = harness.runtime.getQueue();
  assert.equal(first, second);
  assert.equal(harness.queueDouble, first);
  assert.equal(harness.state.queueOptions.concurrency, 2);
  assert.equal(typeof harness.state.queueOptions.onUpdate, 'function');
  assert.equal(typeof harness.state.queueOptions.onActivity, 'function');
  assert.equal(harness.state.localDeps.getRuntimeToolOrFallback('ffmpeg'), '/tools/ffmpeg');
  assert.equal(harness.state.sharedDeps.appRoot, path.resolve('/app-root'));
  assert.equal(harness.state.sharedDeps.getUserDataRoot(), path.resolve('/user-data'));
});

test('getQueue passes only concurrency, onUpdate and onActivity to the queue ctor', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  assert.deepEqual(Object.keys(harness.state.queueOptions).sort(), ['concurrency', 'onActivity', 'onUpdate']);
});

test('local handlers receive the full dependency bag', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  const localDeps = harness.state.localDeps;
  assert.deepEqual(Object.keys(localDeps).sort(), [
    'buildWaveformJsonFromFloat32',
    'createOutputFilename',
    'ensureAssetVideoPlaybackProxy',
    'ffprobeHasAudio',
    'ffprobeVideoMeta',
    'getAssetsDir',
    'getOutputDir',
    'getRuntimeToolOrFallback',
    'resolveMediaTaskSource',
    'runFfmpegTask',
    'sendAssetUpdated',
    'toAssetLocalPath',
    'toOutputLocalPath',
    'updateAssetRecord',
  ]);
  assert.equal(localDeps.getAssetsDir(), harness.assetsDir);
  assert.equal(localDeps.getOutputDir(), path.resolve('/output-dir'));
});

test('shared handlers expose the modelscope manifest fallback and env override', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  const sharedDeps = harness.state.sharedDeps;
  assert.equal(
    sharedDeps.getAsrRuntimeManifestUrl(),
    'https://modelscope.cn/models/q502892879/asr-runtime/resolve/master/asr-runtime-manifest.json',
  );
  assert.equal(sharedDeps.getDoubaoAsrConfig().provider, 'doubao');
  assert.equal(sharedDeps.getBailianAsrConfig().provider, 'bailian');
  assert.equal(sharedDeps.resolvePythonCommand(), 'py-asr');
  assert.equal(sharedDeps.resolveFallbackPythonCommand(), 'py-fallback');
  assert.deepEqual(sharedDeps.getPythonCertificateEnv(), { CURL_CA_BUNDLE: '/ca.pem' });
  assert.equal(sharedDeps.getFunasrModelRootDir(), '/models/funasr');
});

test('shared handlers honour the ASR manifest env override', () => {
  const harness = createHarness({
    env: { AIC_ASR_RUNTIME_MANIFEST_URL: '  https://mirror/manifest.json  ' },
  });
  harness.runtime.getQueue();
  assert.equal(harness.state.sharedDeps.getAsrRuntimeManifestUrl(), 'https://mirror/manifest.json');
});

test('output and asset local paths use forward slashes and drop falsy segments', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  assert.equal(harness.state.localDeps.toOutputLocalPath('a', '', 'b.txt'), 'output/a/b.txt');
  assert.equal(
    harness.state.localDeps.toAssetLocalPath('derived', null, 'x.json'),
    'data/assets/derived/x.json',
  );
  assert.equal(harness.state.localDeps.toOutputLocalPath(), 'output');
});

test('createOutputFilename sanitizes both purpose and extension', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  const filename = harness.state.localDeps.createOutputFilename('my purpose!', '..MP4');
  assert.match(filename, /^my_purpose__\d+_[0-9a-f]{6}\.MP4$/);
  assert.match(harness.state.localDeps.createOutputFilename('', ''), /^media_\d+_[0-9a-f]{6}\.bin$/);
});

test('resolveMediaTaskSource rejects unresolvable local paths', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  assert.equal(
    harness.state.localDeps.resolveMediaTaskSource('uploads/a.mp4'),
    path.resolve('/virtual', 'uploads/a.mp4'),
  );
  assert.throws(() => harness.state.localDeps.resolveMediaTaskSource(''), {
    message: 'Invalid media source path',
  });
});

test('ffprobeVideoMeta reads duration, fps and dimensions through the queue', async () => {
  const harness = createHarness();
  harness.queueDouble.runProcess = async (task, command, args, options) => {
    assert.equal(command, '/tools/ffprobe');
    assert.equal(options.timeoutMs, 30000);
    assert.ok(args.some((value) => String(value).includes('nb_frames')));
    return {
      stdout: Buffer.from(
        JSON.stringify({
          format: { duration: '12.5' },
          streams: [{ avg_frame_rate: '30000/1001', width: '1920', height: '1080' }],
        }),
      ),
    };
  };
  harness.runtime.getQueue();
  const meta = await harness.state.localDeps.ffprobeVideoMeta(harness.queueDouble, 'task', '/video.mp4');
  assert.equal(meta.duration, 12.5);
  assert.ok(Math.abs(meta.fps - 29.97002997) < 1e-6);
  assert.equal(meta.width, 1920);
  assert.equal(meta.height, 1080);
});

test('ffprobeHasAudio reports true on an audio stream and false on failure', async () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  harness.queueDouble.runProcess = async () => ({ stdout: Buffer.from('audio\n') });
  assert.equal(await harness.state.localDeps.ffprobeHasAudio(harness.queueDouble, 'task', '/v.mp4'), true);
  harness.queueDouble.runProcess = async () => {
    throw new Error('ffprobe exploded');
  };
  assert.equal(await harness.state.localDeps.ffprobeHasAudio(harness.queueDouble, 'task', '/v.mp4'), false);
});

test('buildWaveformJsonFromFloat32 produces bounded peaks', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  const samples = new Float32Array([0, 0.5, -1, 0.25]);
  const waveform = harness.state.localDeps.buildWaveformJsonFromFloat32(samples);
  assert.equal(waveform.version, 1);
  assert.equal(waveform.samples, 190);
  assert.equal(waveform.peaks.length, 190);
  assert.equal(waveform.peaks[2], 1);
  assert.equal(waveform.peaks[1], 0.5);
  assert.equal(waveform.peaks[189], 0);
});

test('handleTaskUpdate marks an asset partial and forwards the update', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  harness.state.queueOptions.onUpdate({
    assetId: 'asset-1',
    status: 'failed',
    error: 'boom',
    taskId: 'task-1',
    kind: 'videoCut',
    progress: 0.5,
  });
  assert.equal(harness.state.assetUpdates.length, 1);
  assert.deepEqual(harness.state.assetUpdates[0], {
    assetId: 'asset-1',
    patch: {
      status: 'partial',
      error: 'boom',
      mediaTaskId: 'task-1',
      mediaTaskKind: 'videoCut',
      mediaTaskStatus: 'failed',
      mediaTaskProgress: 0.5,
      mediaTaskError: 'boom',
    },
    options: { expectedMediaTaskId: 'task-1' },
  });
  assert.deepEqual(harness.state.published[0], {
    assetId: 'asset-1',
    status: 'partial',
    error: 'boom',
    mediaTaskId: 'task-1',
    mediaTaskKind: 'videoCut',
    mediaTaskStatus: 'failed',
    mediaTaskProgress: 0.5,
    mediaTaskError: 'boom',
  });
  assert.deepEqual(harness.state.published[1], {
    assetId: 'asset-1',
    status: 'failed',
    error: 'boom',
    taskId: 'task-1',
    kind: 'videoCut',
    progress: 0.5,
  });
});

test('handleTaskUpdate leaves the asset untouched for successful tasks', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  harness.state.queueOptions.onUpdate({ assetId: 'asset-1', status: 'complete', taskId: 'task-1' });
  assert.deepEqual(harness.state.assetUpdates, []);
  assert.equal(harness.state.published.length, 1);
});

test('handleTaskActivity mirrors progress and the power-save blocker', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  harness.state.queueOptions.onActivity({
    activeCount: 2,
    waitingCount: 1,
    totalCount: 3,
    progress: 0.25,
    activeTasks: [{ taskId: 'a' }],
  });
  assert.deepEqual(harness.state.taskbar, [['media', 0.25]]);
  assert.deepEqual(harness.state.powerSave, [['media', true]]);
  assert.deepEqual(harness.runtime.getActivity(), {
    activeCount: 2,
    waitingCount: 1,
    totalCount: 3,
    progress: 0.25,
    activeTasks: [{ taskId: 'a' }],
  });
  const snapshot = harness.runtime.getActivity();
  snapshot.activeTasks.push({ taskId: 'b' });
  assert.equal(harness.runtime.getActivity().activeTasks.length, 1);
  harness.state.queueOptions.onActivity({});
  assert.deepEqual(harness.state.taskbar[1], ['media', -1]);
  assert.deepEqual(harness.state.powerSave[1], ['media', false]);
});

test('long media task notifications are skipped below the duration floor', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  harness.state.queueOptions.onUpdate({
    status: 'complete',
    taskId: 'short',
    kind: 'videoCut',
    startedAt: 1000,
    finishedAt: 1000 + 20000 - 1,
  });
  assert.equal(harness.state.notifications.length, 0);
});

test('long media task notifications fire once and honour the silent flag', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  const update = {
    status: 'complete',
    taskId: 'long-1',
    kind: 'audioVoiceCompose',
    startedAt: 1000,
    finishedAt: 1000 + 20000,
  };
  harness.state.queueOptions.onUpdate(update);
  harness.state.queueOptions.onUpdate(update);
  assert.equal(harness.state.notifications.length, 1);
  assert.deepEqual(harness.state.notifications[0].options, {
    title: '语音工作室合成完成',
    body: '长时间媒体任务已处理完成。',
    silent: true,
  });
  assert.equal(harness.state.notifications[0].shown, true);
  assert.equal(harness.state.notifications[0].events[0].event, 'click');
  harness.state.notifications[0].events[0].handler();
  assert.ok(harness.state.activity.includes('focus'));
});

test('long media task notifications describe failures with the mapped display name', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  harness.state.queueOptions.onUpdate({
    status: 'failed',
    taskId: 'long-fail',
    kind: 'videoAudioMux',
    error: 'encoder died',
    startedAt: 1000,
    finishedAt: 1000 + 20000 + 1,
  });
  assert.deepEqual(harness.state.notifications[0].options, {
    title: '完整视频封装失败',
    body: 'encoder died',
    silent: false,
  });
});

test('long media task notifications fall back to a generic kind label', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  harness.state.queueOptions.onUpdate({
    status: 'complete',
    taskId: 'long-unknown',
    kind: 'mystery',
    startedAt: 1000,
    finishedAt: 1000 + 20000,
  });
  assert.equal(harness.state.notifications[0].options.title, '媒体任务完成');
});

test('long media task notifications skip person-replacement compose tasks', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  harness.state.queueOptions.onUpdate({
    status: 'complete',
    taskId: 'replacement-1',
    kind: 'videoCompose',
    purpose: ' person-replacement-compose ',
    startedAt: 1000,
    finishedAt: 1000 + 20000,
  });
  assert.equal(harness.state.notifications.length, 0);
});

test('long media task notifications respect Notification.isSupported', () => {
  const harness = createHarness({ NotificationCtor: null });
  harness.deps.NotificationCtor = harness.createNotificationCtor({ supported: false });
  const runtime = createMediaTaskRuntime(harness.deps);
  runtime.getQueue();
  harness.state.queueOptions.onUpdate({
    status: 'complete',
    taskId: 'unsupported-1',
    kind: 'videoCut',
    startedAt: 1000,
    finishedAt: 1000 + 20000,
  });
  assert.equal(harness.state.notifications.length, 0);
});

test('long media task notifications cap the dedupe set at 500 entries', () => {
  const harness = createHarness();
  harness.runtime.getQueue();
  const fire = (id) =>
    harness.state.queueOptions.onUpdate({
      status: 'complete',
      taskId: id,
      kind: 'videoCut',
      startedAt: 1000,
      finishedAt: 1000 + 20000,
    });
  for (let index = 0; index <= 500; index += 1) fire('capped-' + index);
  assert.equal(harness.state.notifications.length, 501);
  fire('capped-0');
  assert.equal(harness.state.notifications.length, 502);
});

test('notification failures are logged without escaping', () => {
  const harness = createHarness();
  harness.deps.NotificationCtor = class ThrowingNotification {
    static isSupported() {
      return true;
    }
    constructor() {
      throw new Error('no notification service');
    }
  };
  const runtime = createMediaTaskRuntime(harness.deps);
  runtime.getQueue();
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  try {
    harness.state.queueOptions.onUpdate({
      status: 'complete',
      taskId: 'boom-1',
      kind: 'videoCut',
      startedAt: 1000,
      finishedAt: 1000 + 20000,
    });
  } finally {
    console.warn = originalWarn;
  }
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0][0], '[electron] failed to show media task notification:');
});

test('probeVideoPlaybackInfoForImport reads the import probe through runCapture', async () => {
  const harness = createHarness();
  harness.deps.runCapture = async (command, args, options) => {
    harness.state.ffprobeCaptureCalls.push({ command: command, args: args, options: options });
    return Buffer.from(
      JSON.stringify({
        streams: [{ codec_name: 'HEVC', codec_tag_string: 'hvc1', pix_fmt: 'YUV420P', profile: 'Main' }],
        format: { format_name: 'MOV,MP4', duration: '9.5' },
      }),
    );
  };
  const runtime = createMediaTaskRuntime(harness.deps);
  const info = await runtime.probeVideoPlaybackInfoForImport('/video.mp4');
  assert.deepEqual(harness.state.ffprobeCaptureCalls[0], {
    command: '/tools/ffprobe',
    args: [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'format=duration,format_name:stream=avg_frame_rate,r_frame_rate,codec_name,codec_tag_string,pix_fmt,profile,width,height',
      '-of',
      'json',
      '/video.mp4',
    ],
    options: { cwd: path.resolve('/app-root'), timeoutMs: 30000 },
  });
  assert.deepEqual(info, {
    codecName: 'hevc',
    codecTag: 'hvc1',
    pixelFormat: 'yuv420p',
    profile: 'Main',
    formatName: 'mov,mp4',
    duration: 9.5,
    fps: 0,
    width: 0,
    height: 0,
  });
});

test('probeVideoPlaybackInfoForImport rejects empty and invalid probe output', async () => {
  const harness = createHarness({ runCapture: async () => Buffer.from('   ') });
  await assert.rejects(() => harness.runtime.probeVideoPlaybackInfoForImport('/video.mp4'), {
    message: 'FFprobe failed',
  });
  const invalid = createHarness({ runCapture: async () => Buffer.from('not json') });
  await assert.rejects(() => invalid.runtime.probeVideoPlaybackInfoForImport('/video.mp4'), {
    message: 'FFprobe failed',
  });
});

test('ensureAssetVideoPlaybackProxy skips transcoding when the codec is browser friendly', async () => {
  const harness = createHarness();
  harness.queueDouble.runProcess = async () => ({
    stdout: Buffer.from(
      JSON.stringify({
        streams: [{ codec_name: 'av1', codec_tag_string: 'av01', pix_fmt: 'yuv420p10le', profile: 'Main' }],
        format: { format_name: 'matroska,webm', duration: '4' },
      }),
    ),
  });
  harness.runtime.getQueue();
  const result = await harness.state.localDeps.ensureAssetVideoPlaybackProxy(
    harness.queueDouble,
    'task',
    '/source.mp4',
    'asset-av1',
  );
  assert.deepEqual(result, {
    displayLocalPath: '',
    displayUrl: '',
    videoProxyStatus: 'not_required',
    videoProxyVersion: '',
    videoCodec: 'av1',
  });
  assert.deepEqual(harness.state.ffmpegCalls, []);
});

test('ensureAssetVideoPlaybackProxy transcodes, renames and reuses the cached proxy', async () => {
  const harness = createHarness();
  harness.queueDouble.runProcess = async () => ({
    stdout: Buffer.from(
      JSON.stringify({
        streams: [{ codec_name: 'hevc', codec_tag_string: 'hvc1', pix_fmt: 'yuv420p', profile: 'Main' }],
        format: { format_name: 'mov,mp4', duration: '600' },
      }),
    ),
  });
  harness.runtime.getQueue();
  const result = await harness.state.localDeps.ensureAssetVideoPlaybackProxy(
    harness.queueDouble,
    'task',
    '/source.mp4',
    'asset-hevc',
  );
  assert.deepEqual(result, {
    displayLocalPath: 'data/assets/derived/video/asset-hevc.proxy-v2-1280.mp4',
    displayUrl: '/data/assets/derived/video/asset-hevc.proxy-v2-1280.mp4',
    videoProxyStatus: 'generated',
    videoProxyVersion: 'v2-1280',
    videoCodec: 'hevc',
  });
  assert.equal(harness.state.ffmpegCalls.length, 1);
  assert.equal(harness.state.ffmpegCalls[0].options.progressMessage, 'Transcoding video');
  assert.equal(harness.state.ffmpegCalls[0].options.timeoutMs, 600 * 1000 * 12);
  assert.ok(harness.state.ffmpegCalls[0].args.includes('veryfast'));
  assert.ok(harness.state.ffmpegCalls[0].args.includes('23'));
  const proxyPath = path.join(harness.assetsDir, 'derived', 'video', 'asset-hevc.proxy-v2-1280.mp4');
  assert.equal(existsSync(proxyPath), true);
  await harness.state.localDeps.ensureAssetVideoPlaybackProxy(
    harness.queueDouble,
    'task',
    '/source.mp4',
    'asset-hevc',
  );
  assert.equal(harness.state.ffmpegCalls.length, 1);
});

test('ensureAssetVideoPlaybackProxy dedupes concurrent work per asset and source path', async () => {
  const harness = createHarness();
  harness.queueDouble.runProcess = async () => ({
    stdout: Buffer.from(
      JSON.stringify({
        streams: [{ codec_name: 'hevc', codec_tag_string: 'hvc1', pix_fmt: 'yuv420p', profile: 'Main' }],
        format: { format_name: 'mov,mp4', duration: '30' },
      }),
    ),
  });
  harness.runtime.getQueue();
  const calls = [
    harness.state.localDeps.ensureAssetVideoPlaybackProxy(
      harness.queueDouble,
      'task',
      '/source.mp4',
      'asset-dup',
    ),
    harness.state.localDeps.ensureAssetVideoPlaybackProxy(
      harness.queueDouble,
      'task',
      '/source.mp4',
      'asset-dup',
    ),
  ];
  const results = await Promise.all(calls);
  assert.equal(harness.state.ffmpegCalls.length, 1);
  assert.deepEqual(results[0], results[1]);
});

test('ensureAssetVideoPlaybackProxy cleans up the temp file when ffmpeg fails', async () => {
  const harness = createHarness({
    runFfmpegTask: async (queue, task, args) => {
      writeFileSync(args[args.length - 1], 'partial');
      throw new Error('ffmpeg exploded');
    },
  });
  harness.queueDouble.runProcess = async () => ({
    stdout: Buffer.from(
      JSON.stringify({
        streams: [{ codec_name: 'hevc', codec_tag_string: 'hvc1', pix_fmt: 'yuv420p', profile: 'Main' }],
        format: { format_name: 'mov,mp4', duration: '30' },
      }),
    ),
  });
  const runtime = createMediaTaskRuntime(harness.deps);
  runtime.getQueue();
  await assert.rejects(
    () =>
      harness.state.localDeps.ensureAssetVideoPlaybackProxy(
        harness.queueDouble,
        'task',
        '/source.mp4',
        'asset-fail',
      ),
    { message: 'ffmpeg exploded' },
  );
  const derivedDir = path.join(harness.assetsDir, 'derived', 'video');
  const leftovers = existsSync(derivedDir)
    ? readdirSync(derivedDir).filter((name) => name.endsWith('.tmp.mp4'))
    : [];
  assert.deepEqual(leftovers, []);
});

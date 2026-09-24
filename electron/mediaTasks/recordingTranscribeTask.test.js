import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createRecordingTranscribeTaskHandler } from './recordingTranscribeTask.js';
import { registerSharedMediaTaskHandlers } from './registerSharedMediaTaskHandlers.js';
import { MediaTaskCancelledError, MediaTaskQueue } from '../mediaTaskQueue.js';

const OUTPUT_NAME = 'recording_asr_fixed.mp3';

function makeRoot(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'recording-transcribe-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function createQueue({ bytes = Buffer.from('mp3-bytes'), cancelOnCheck = 0 } = {}) {
  const state = { processes: [], checks: 0, written: [] };
  return {
    state,
    queue: {
      throwIfCancelled() {
        state.checks += 1;
        if (cancelOnCheck && state.checks >= cancelOnCheck) throw new MediaTaskCancelledError();
      },
      async runProcess(task, command, args, options) {
        state.processes.push({ command, args, options });
        const target = args[args.length - 1];
        await writeFileSync(target, bytes);
        state.written.push(target);
        return { stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), code: 0, signal: null };
      },
    },
  };
}

function createDeps(root, overrides = {}) {
  const outputDir = path.join(root, 'output');
  return {
    resolveMediaTaskSource: (src) => path.join(root, src),
    ffprobeHasAudio: async () => true,
    getOutputDir: () => outputDir,
    createOutputFilename: () => OUTPUT_NAME,
    getRuntimeToolOrFallback: (tool) => 'ffmpeg-bin-' + tool,
    getDoubaoAsrConfig: () => ({ apiKey: 'doubao-key', appKey: '', accessKey: '', baseUrl: '' }),
    getBailianAsrConfig: () => ({ apiKey: 'bailian-key', baseUrl: '' }),
    ...overrides,
  };
}

function doubaoFetch({ statusCode = '20000000', body = { result: { utterances: [{ text: 'hi' }] } } } = {}) {
  const state = { calls: [] };
  return {
    state,
    fetchImpl: async (url, init) => {
      state.calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        headers: { get: () => statusCode },
        json: async () => body,
        body: { cancel: async () => {} },
      };
    },
  };
}

const TASK = { id: 'task-1', payload: { src: 'input.mp4', provider: 'volcengine-speech' } };

test('a source without an audio track short-circuits before any process', async (t) => {
  const root = makeRoot(t);
  const { state, queue } = createQueue();
  const handler = createRecordingTranscribeTaskHandler(
    createDeps(root, { ffprobeHasAudio: async () => false }),
  );
  const result = await handler(TASK, queue);
  assert.deepEqual(result, {
    provider: 'volcengine-speech',
    model: 'volc.bigasr.auc_turbo',
    status: 'no-audio-track',
    utterances: [],
    raw: {},
  });
  assert.equal(state.processes.length, 0);
  assert.equal(existsSync(path.join(root, 'output')), false);
});

test('missing credentials fail before the audio is extracted', async (t) => {
  const root = makeRoot(t);
  const { state, queue } = createQueue();
  const handler = createRecordingTranscribeTaskHandler(
    createDeps(root, { getDoubaoAsrConfig: () => ({ apiKey: '', appKey: '', accessKey: '' }) }),
  );
  await assert.rejects(handler(TASK, queue), /请在火山语音设置中配置录音识别凭据。/);
  assert.equal(state.processes.length, 0);
});

test('an unknown provider is rejected before the audio track probe', async (t) => {
  const root = makeRoot(t);
  const { queue } = createQueue();
  const handler = createRecordingTranscribeTaskHandler(createDeps(root));
  await assert.rejects(
    handler({ id: 'task-1', payload: { src: 'input.mp4', provider: 'whisper' } }, queue),
    /不支持的语音识别模型，请重新选择。/,
  );
});

test('doubao extracts mono 16 kHz mp3 audio and returns the recognition result', async (t) => {
  const root = makeRoot(t);
  const { state, queue } = createQueue({ bytes: Buffer.from('recorded-audio') });
  const { state: fetchState, fetchImpl } = doubaoFetch();
  const handler = createRecordingTranscribeTaskHandler(createDeps(root, { fetchImpl: fetchImpl }));
  const result = await handler(TASK, queue);

  assert.equal(state.processes.length, 1);
  const process = state.processes[0];
  assert.equal(process.command, 'ffmpeg-bin-ffmpeg');
  assert.deepEqual(process.args, [
    '-y',
    '-i',
    path.join(root, 'input.mp4'),
    '-map',
    '0:a:0',
    '-vn',
    '-ac',
    '1',
    '-af',
    'aresample=16000:first_pts=0',
    '-ar',
    '16000',
    '-b:a',
    '96k',
    path.join(root, 'output', OUTPUT_NAME),
  ]);
  assert.deepEqual(Object.keys(process.options), ['timeoutMs']);

  assert.equal(result.provider, 'volcengine-speech');
  assert.equal(result.status, 'recognized');
  const payload = JSON.parse(fetchState.calls[0].init.body);
  assert.equal(payload.audio.data, Buffer.from('recorded-audio').toString('base64'));
  assert.equal(payload.audio.rate, 16000);
  assert.equal(payload.audio.channel, 1);
});

test('the extracted audio file is always removed, even when recognition fails', async (t) => {
  const root = makeRoot(t);
  const { queue } = createQueue();
  const handler = createRecordingTranscribeTaskHandler(
    createDeps(root, {
      fetchImpl: async () => {
        throw new Error('network down');
      },
    }),
  );
  await assert.rejects(handler(TASK, queue), /network down/);
  assert.equal(existsSync(path.join(root, 'output', OUTPUT_NAME)), false);
});

test('the extracted audio file is removed after a successful run', async (t) => {
  const root = makeRoot(t);
  const { queue } = createQueue();
  const { fetchImpl } = doubaoFetch();
  const handler = createRecordingTranscribeTaskHandler(createDeps(root, { fetchImpl: fetchImpl }));
  await handler(TASK, queue);
  assert.equal(existsSync(path.join(root, 'output', OUTPUT_NAME)), false);
});

test('cancellation after extraction propagates and still cleans up', async (t) => {
  const root = makeRoot(t);
  const { queue } = createQueue({ cancelOnCheck: 2 });
  const handler = createRecordingTranscribeTaskHandler(createDeps(root));
  await assert.rejects(handler(TASK, queue), MediaTaskCancelledError);
  assert.equal(existsSync(path.join(root, 'output', OUTPUT_NAME)), false);
});

test('a terminated extraction never reaches recognition', async (t) => {
  const root = makeRoot(t);
  const state = { processes: 0 };
  const queue = {
    throwIfCancelled() {},
    async runProcess() {
      state.processes += 1;
      throw new Error('ffmpeg exited with 1');
    },
  };
  const handler = createRecordingTranscribeTaskHandler(
    createDeps(root, {
      fetchImpl: async () => {
        throw new Error('recognition must not run');
      },
    }),
  );
  await assert.rejects(handler(TASK, queue), /ffmpeg exited with 1/);
  assert.equal(state.processes, 1);
});

test('a bailian task maps sentences into utterances', async (t) => {
  const root = makeRoot(t);
  const { queue } = createQueue();
  const policy = {
    upload_dir: 'dashscope-tmp/abc',
    upload_host: 'https://oss.invalid/upload',
    oss_access_key_id: 'AK',
    signature: 'sig',
    policy: 'pol',
    x_oss_object_acl: 'private',
    x_oss_forbid_overwrite: 'true',
    max_file_size_mb: 10,
  };
  const json = (payload) => ({ ok: true, status: 200, json: async () => payload, headers: { get: () => null } });
  const fetchImpl = async (url) => {
    if (url.includes('/api/v1/uploads?action=getPolicy')) return json({ data: policy });
    if (url === policy.upload_host) return json({});
    if (url.includes('/api/v1/services/audio/asr/transcription'))
      return json({ output: { task_id: 'task-1', task_status: 'PENDING' } });
    if (url.includes('/api/v1/tasks/'))
      return json({
        output: {
          task_status: 'SUCCEEDED',
          results: [{ subtask_status: 'SUCCEEDED', transcription_url: 'https://transcription.invalid/1' }],
        },
      });
    return json({ transcripts: [{ sentences: [{ begin_time: 0, end_time: 900, text: '语音' }] }] });
  };
  const handler = createRecordingTranscribeTaskHandler(
    createDeps(root, { fetchImpl: fetchImpl }),
  );
  const result = await handler(
    { id: 'task-1', payload: { src: 'input.mp4', provider: 'bailian' } },
    queue,
  );
  assert.equal(result.provider, 'bailian');
  assert.equal(result.status, 'recognized');
  assert.deepEqual(result.utterances, [
    {
      text: '语音',
      start_time: 0,
      end_time: 900,
      additions: { speaker: '' },
      words: [],
    },
  ]);
});

test('the shared registry registers recordingTranscribe', () => {
  const registered = new Map();
  registerSharedMediaTaskHandlers({ setHandler: (kind, handler) => registered.set(kind, handler) });
  assert.ok(registered.has('recordingTranscribe'));
  assert.equal(typeof registered.get('recordingTranscribe'), 'function');
  assert.ok(registered.has('asrRuntimeInstall'));
  assert.ok(registered.has('audioCompose'));
});

test('the media task queue accepts a recordingTranscribe task once registered', async (t) => {
  const root = makeRoot(t);
  const mediaQueue = new MediaTaskQueue({ handlers: {} });
  registerSharedMediaTaskHandlers(mediaQueue, {
    resolveMediaTaskSource: (src) => path.join(root, src),
    ffprobeHasAudio: async () => false,
    getOutputDir: () => path.join(root, 'output'),
    createOutputFilename: () => OUTPUT_NAME,
    getRuntimeToolOrFallback: (tool) => 'ffmpeg-bin-' + tool,
    getDoubaoAsrConfig: () => ({ apiKey: 'k' }),
    getBailianAsrConfig: () => ({ apiKey: 'k' }),
  });
  const snapshot = await mediaQueue.enqueue({
    kind: 'recordingTranscribe',
    nodeId: 'n1',
    src: 'a.mp4',
    provider: 'volcengine-speech',
    taskId: 'recording-1',
  });
  assert.equal(snapshot.taskId, 'recording-1');
  assert.equal(snapshot.kind, 'recordingTranscribe');
  const deadline = Date.now() + 2000;
  while (mediaQueue.get('recording-1').status !== 'complete' && Date.now() < deadline)
    await new Promise((resolve) => setTimeout(resolve, 10));
  const task = mediaQueue.get('recording-1');
  assert.equal(task.status, 'complete');
  assert.equal(task.result.status, 'no-audio-track');
});

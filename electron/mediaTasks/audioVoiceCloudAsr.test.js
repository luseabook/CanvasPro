import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createAudioVoiceCloudAsrAdapters } from './audioVoiceCloudAsr.js';
import { normalizeDoubaoAsrSegments, runDoubaoAsrTranscription } from './doubaoAsrClient.js';

const UPLOAD_HOST = 'https://oss.example.test/upload';
const TRANSCRIPT_URL = 'https://oss.example.test/transcription.json';

function jsonResponse(body) {
  return { ok: true, status: 200, json: async () => body };
}

function createBailianFetch() {
  const state = { calls: [] };
  return {
    state,
    fetchImpl: async (url, init = {}) => {
      state.calls.push({ url, init });
      if (url.includes('/api/v1/uploads')) {
        return jsonResponse({
          data: {
            upload_dir: 'dashscope/upload',
            upload_host: UPLOAD_HOST,
            oss_access_key_id: 'ak',
            signature: 'sig',
            policy: 'pol',
            x_oss_object_acl: 'private',
            x_oss_forbid_overwrite: 'true',
            max_file_size_mb: 100,
          },
        });
      }
      if (url === UPLOAD_HOST) return jsonResponse({});
      if (url.includes('/api/v1/services/audio/asr/transcription')) {
        return jsonResponse({ output: { task_id: 'task-1', task_status: 'RUNNING' } });
      }
      if (url.includes('/api/v1/tasks/')) {
        return jsonResponse({
          output: {
            task_status: 'SUCCEEDED',
            results: [{ subtask_status: 'SUCCEEDED', transcription_url: TRANSCRIPT_URL }],
          },
        });
      }
      if (url === TRANSCRIPT_URL) {
        return jsonResponse({
          transcripts: [
            { sentences: [{ begin_time: 0, end_time: 1200, text: '你好', speaker_id: 1 }] },
          ],
        });
      }
      throw new Error('unexpected url ' + url);
    },
  };
}

function makeAudioFile(t, bytes = 'QUJD') {
  const dir = mkdtempSync(path.join(tmpdir(), 'audio-voice-'));
  const file = path.join(dir, 'speech.mp3');
  writeFileSync(file, Buffer.from(bytes));
  if (t && typeof t.after === 'function') t.after(() => rmSync(dir, { recursive: true, force: true }));
  return file;
}

function createQueue() {
  const state = { progress: [], cancelledChecks: 0 };
  return {
    state,
    queue: {
      emitProgress: (task, progress, message, meta) =>
        state.progress.push({ taskId: task?.id, progress, message, meta }),
      throwIfCancelled: () => {
        state.cancelledChecks += 1;
      },
    },
  };
}

test('the adapter exposes a doubao and a bailian slot with config, run and normalize', () => {
  const adapters = createAudioVoiceCloudAsrAdapters();
  assert.deepEqual(Object.keys(adapters), ['doubao', 'bailian']);
  assert.deepEqual(Object.keys(adapters.doubao), ['getConfig', 'run', 'normalize']);
  assert.deepEqual(Object.keys(adapters.bailian), ['getConfig', 'run', 'normalize']);
});

test('the config accessors are handed straight through', () => {
  const getDoubaoAsrConfig = () => ({ apiKey: 'doubao' });
  const getBailianAsrConfig = () => ({ apiKey: 'bailian' });
  const adapters = createAudioVoiceCloudAsrAdapters({ getDoubaoAsrConfig, getBailianAsrConfig });
  assert.equal(adapters.doubao.getConfig, getDoubaoAsrConfig);
  assert.equal(adapters.bailian.getConfig, getBailianAsrConfig);
  assert.deepEqual(adapters.doubao.getConfig(), { apiKey: 'doubao' });
  assert.deepEqual(adapters.bailian.getConfig(), { apiKey: 'bailian' });
});

test('the doubao slot defaults to the submit and query client and its segment normalizer', () => {
  const adapters = createAudioVoiceCloudAsrAdapters();
  assert.equal(adapters.doubao.run, runDoubaoAsrTranscription);
  assert.equal(adapters.doubao.normalize, normalizeDoubaoAsrSegments);
});

test('the doubao runner can be replaced for tests', () => {
  const fake = async () => ({ segments: [] });
  const adapters = createAudioVoiceCloudAsrAdapters({ runDoubaoAsrTranscription: fake });
  assert.equal(adapters.doubao.run, fake);
  assert.notEqual(adapters.bailian.run, fake);
});

test('the bailian normalize unwraps the segments field', () => {
  const adapters = createAudioVoiceCloudAsrAdapters();
  assert.deepEqual(adapters.bailian.normalize({ segments: [{ startMs: 1, endMs: 2 }] }), [
    { startMs: 1, endMs: 2 },
  ]);
});

test('the bailian runner can be replaced for tests', () => {
  const fake = async () => ({ segments: [] });
  const adapters = createAudioVoiceCloudAsrAdapters({ runBailianAsrTranscription: fake });
  assert.equal(adapters.bailian.run, fake);
});

test('the default bailian runner streams the audio file and forwards progress', async (t) => {
  const audioFile = makeAudioFile(t);
  const { state: fetchState, fetchImpl } = createBailianFetch();
  const { state: queueState, queue } = createQueue();
  const adapters = createAudioVoiceCloudAsrAdapters();
  const result = await adapters.bailian.run({
    audioAbs: audioFile,
    credentials: { apiKey: 'key-1' },
    durationSec: 2,
    fetchImpl,
    pollIntervalMs: 1,
    queue,
    sleep: async () => {},
    task: { id: 'cloud-task' },
  });
  assert.deepEqual(result.segments, [
    { startMs: 0, endMs: 1200, sourceText: '你好', speaker: '1' },
  ]);
  const messages = queueState.progress.map((entry) => entry.message);
  assert.equal(messages[0], 'Uploading audio to Bailian');
  assert.equal(messages.includes('Submitting Bailian subtitle recognition'), true);
  assert.equal(messages.includes('Recognizing subtitles with Bailian'), true);
  assert.deepEqual(queueState.progress[0].meta, { stage: 'transcribe' });
  assert.equal(queueState.progress[0].taskId, 'cloud-task');
  assert.equal(queueState.cancelledChecks > 0, true);
  const uploadCall = fetchState.calls.find((call) => call.url === UPLOAD_HOST);
  assert.equal(uploadCall.init.body instanceof FormData, true);
  assert.equal(uploadCall.init.body.get('key'), 'dashscope/upload/speech.mp3');
  assert.equal(uploadCall.init.body.get('OSSAccessKeyId'), 'ak');
  assert.equal(uploadCall.init.body.get('file').name, 'speech.mp3');
});

test('the default bailian runner surfaces cancellation from the queue', async (t) => {
  const audioFile = makeAudioFile(t);
  const { fetchImpl } = createBailianFetch();
  const adapters = createAudioVoiceCloudAsrAdapters();
  const queue = {
    emitProgress: () => {},
    throwIfCancelled: () => {
      throw new Error('media task cancelled');
    },
  };
  await assert.rejects(
    adapters.bailian.run({
      audioAbs: audioFile,
      credentials: { apiKey: 'key-1' },
      durationSec: 2,
      fetchImpl,
      pollIntervalMs: 1,
      queue,
      sleep: async () => {},
      task: { id: 'cloud-cancel' },
    }),
    /media task cancelled/,
  );
});

test('the default bailian runner requires an api key before any request', async (t) => {
  const audioFile = makeAudioFile(t);
  let called = 0;
  const adapters = createAudioVoiceCloudAsrAdapters();
  await assert.rejects(
    adapters.bailian.run({
      audioAbs: audioFile,
      credentials: {},
      fetchImpl: async () => {
        called += 1;
        throw new Error('must not be called');
      },
    }),
    /请在设置 > API Key > 阿里云百炼填写 API Key/,
  );
  assert.equal(called, 0);
});

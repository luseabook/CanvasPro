import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  DOUBAO_ASR_DEFAULT_BASE_URL,
  DOUBAO_ASR_RESOURCE_ID,
  buildDoubaoAsrHeaders,
  buildDoubaoAsrSubmitBody,
  normalizeDoubaoAsrSegments,
  runDoubaoAsrTranscription,
} from './doubaoAsrClient.js';

function createScriptedFetch(plan) {
  const state = { calls: [] };
  return {
    state,
    fetchImpl: async (url, init) => {
      state.calls.push({ url, init });
      const entry = plan(url, state.calls.length);
      if (entry instanceof Error) throw entry;
      if (entry.delayMs) await new Promise((resolve) => setTimeout(resolve, entry.delayMs));
      return {
        ok: entry.ok !== false,
        status: entry.status || 200,
        headers: { get: (name) => entry.headers?.[name] ?? null },
        text: async () => entry.text ?? JSON.stringify(entry.body ?? {}),
      };
    },
  };
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

function makeAudioFile(t, bytes = 'QUJD') {
  const dir = mkdtempSync(path.join(tmpdir(), 'doubao-asr-'));
  const file = path.join(dir, 'speech.mp3');
  writeFileSync(file, Buffer.from(bytes));
  if (t && typeof t.after === 'function') t.after(() => rmSync(dir, { recursive: true, force: true }));
  return file;
}

test('submit body uses the documented defaults', () => {
  assert.deepEqual(buildDoubaoAsrSubmitBody(), {
    user: { uid: 'ai-canvas' },
    audio: { data: '', format: 'mp3', codec: 'mp3', rate: 16000 },
    request: {
      model_name: 'bigmodel',
      show_utterances: true,
      enable_speaker_info: true,
      enable_itn: true,
      enable_punc: true,
      enable_ddc: false,
    },
  });
});

test('submit body keeps the caller uid and tolerates a missing audio payload', () => {
  const body = buildDoubaoAsrSubmitBody({ audioBase64: null, uid: 'user-7' });
  assert.equal(body.user.uid, 'user-7');
  assert.equal(body.audio.data, '');
  assert.equal(buildDoubaoAsrSubmitBody({ uid: '' }).user.uid, 'ai-canvas');
});

test('headers prefer the api key and default the resource id and sequence', () => {
  const headers = buildDoubaoAsrHeaders({
    credentials: { apiKey: 'key-1' },
    requestId: 'req-1',
  });
  assert.deepEqual(headers, {
    'Content-Type': 'application/json',
    'X-Api-Resource-Id': DOUBAO_ASR_RESOURCE_ID,
    'X-Api-Request-Id': 'req-1',
    'X-Api-Sequence': '-1',
    'X-Api-Key': 'key-1',
  });
  assert.equal(DOUBAO_ASR_RESOURCE_ID, 'volc.seedasr.auc');
});

test('headers accept an app key plus access key pair and a custom resource id', () => {
  const headers = buildDoubaoAsrHeaders({
    credentials: { appKey: 'app-1', accessKey: 'acc-1' },
    resourceId: 'volc.custom',
  });
  assert.equal(headers['X-Api-App-Key'], 'app-1');
  assert.equal(headers['X-Api-Access-Key'], 'acc-1');
  assert.equal(headers['X-Api-Key'], undefined);
  assert.equal(headers['X-Api-Resource-Id'], 'volc.custom');
});

test('headers reject a credential set with no usable key', () => {
  assert.throws(() => buildDoubaoAsrHeaders({ credentials: {} }), /火山语音 ASR Key 未配置或无权限/);
  assert.throws(
    () => buildDoubaoAsrHeaders({ credentials: { appKey: 'app-1' } }),
    /火山语音 ASR Key 未配置或无权限/,
  );
});

test('headers generate a request id when the caller omits one', () => {
  const headers = buildDoubaoAsrHeaders({ credentials: { apiKey: 'key-1' } });
  assert.match(headers['X-Api-Request-Id'], /^[0-9a-f-]{36}$/);
});

test('segments keep millisecond values, sort them and carry the speaker label', () => {
  const segments = normalizeDoubaoAsrSegments({
    utterances: [
      { startMs: 2000, endMs: 3000, text: 'b', speaker: 'S2' },
      { startMs: 1000, endMs: 1500, text: 'a' },
    ],
  });
  assert.deepEqual(segments, [
    { startMs: 1000, endMs: 1500, sourceText: 'a' },
    { startMs: 2000, endMs: 3000, sourceText: 'b', speaker: 'S2' },
  ]);
});

test('segments convert second-based start and end when a duration is known', () => {
  const segments = normalizeDoubaoAsrSegments(
    { utterances: [{ start_time: 1.5, end_time: 2.5, text: 'hi' }] },
    10,
  );
  assert.deepEqual(segments, [{ startMs: 1500, endMs: 2500, sourceText: 'hi' }]);
});

test('segments never rescale values that already look like milliseconds', () => {
  const segments = normalizeDoubaoAsrSegments(
    { segments: [{ startMs: 1500, endMs: 9000, text: 'long' }] },
    10,
  );
  assert.deepEqual(segments, [{ startMs: 1500, endMs: 9000, sourceText: 'long' }]);
});

test('segments rebuild the text from word entries and read nested speaker info', () => {
  const segments = normalizeDoubaoAsrSegments({
    utterances: [
      {
        start_time: 0,
        end_time: 1000,
        words: [{ text: '你' }, { word: '好' }, { text: '' }],
        speaker_info: { speaker_id: 3 },
      },
    ],
  });
  assert.deepEqual(segments, [{ startMs: 0, endMs: 1000, sourceText: '你好', speaker: '3' }]);
});

test('segments drop reversed and non-object entries and clamp negative starts', () => {
  const segments = normalizeDoubaoAsrSegments({
    utterances: [
      null,
      'nope',
      { startMs: 1000, endMs: 500, text: 'reversed' },
      { startMs: 3000, endMs: 3000, text: 'flat' },
      { startMs: -5, endMs: 1000, text: 'negative becomes zero' },
      { startMs: 5000, endMs: 6000, text: 'kept' },
    ],
  });
  assert.deepEqual(segments, [
    { startMs: 0, endMs: 1000, sourceText: 'negative becomes zero' },
    { startMs: 5000, endMs: 6000, sourceText: 'kept' },
  ]);
});

test('segments unwrap data and result envelopes', () => {
  assert.deepEqual(normalizeDoubaoAsrSegments({ data: { utterances: [{ startMs: 1, endMs: 2, text: 'in-data' }] } }), [
    { startMs: 1, endMs: 2, sourceText: 'in-data' },
  ]);
  assert.deepEqual(normalizeDoubaoAsrSegments({ result: { utterances: [{ startMs: 3, endMs: 4, text: 'in-result' }] } }), [
    { startMs: 3, endMs: 4, sourceText: 'in-result' },
  ]);
});

test('segments fall back to a single span when only plain text came back', () => {
  assert.deepEqual(normalizeDoubaoAsrSegments({ text: 'whole file' }, 4), [
    { startMs: 0, endMs: 4000, sourceText: 'whole file' },
  ]);
  assert.deepEqual(normalizeDoubaoAsrSegments({ text: 'whole file' }), []);
});

test('an inline successful submit skips polling entirely', async () => {
  const { state, fetchImpl } = createScriptedFetch(() => ({
    ok: true,
    headers: { 'x-api-status': 'success' },
    body: { utterances: [{ startMs: 0, endMs: 1200, text: 'inline' }] },
  }));
  const { state: queueState, queue } = createQueue();
  const result = await runDoubaoAsrTranscription({
    audioAbs: 'ignored.mp3',
    credentials: { apiKey: 'key-1' },
    durationSec: 3,
    fetchImpl,
    queue,
    readFile: () => Buffer.from('QUJD'),
    task: { id: 'task-inline' },
  });
  assert.equal(state.calls.length, 1);
  assert.equal(state.calls[0].url, DOUBAO_ASR_DEFAULT_BASE_URL + '/submit');
  assert.deepEqual(result.segments, [{ startMs: 0, endMs: 1200, sourceText: 'inline' }]);
  assert.deepEqual(queueState.progress, [
    {
      taskId: 'task-inline',
      progress: 0.16,
      message: 'Submitting Doubao subtitle recognition',
      meta: { stage: 'transcribe' },
    },
  ]);
});

test('a pending submit polls the query endpoint until it succeeds', async () => {
  const pending = { ok: true, status: 200, headers: { 'x-api-status': 'running' }, body: {} };
  const done = {
    ok: true,
    status: 200,
    headers: { 'x-api-status': 'success' },
    body: { utterances: [{ startMs: 0, endMs: 900, text: 'polled' }] },
  };
  const { state, fetchImpl } = createScriptedFetch((url, count) =>
    url.endsWith('/query') && count >= 3 ? done : pending,
  );
  const { state: queueState, queue } = createQueue();
  const result = await runDoubaoAsrTranscription({
    audioAbs: 'ignored.mp3',
    credentials: { apiKey: 'key-1' },
    durationSec: 2,
    fetchImpl,
    pollIntervalMs: 1,
    queue,
    readFile: () => Buffer.from('QUJD'),
    sleep: async () => {},
    task: { id: 'task-poll' },
  });
  assert.deepEqual(result.segments, [{ startMs: 0, endMs: 900, sourceText: 'polled' }]);
  assert.equal(state.calls[0].url, DOUBAO_ASR_DEFAULT_BASE_URL + '/submit');
  const queryCalls = state.calls.filter((call) => call.url.endsWith('/query'));
  assert.equal(queryCalls.length, 2);
  assert.equal(queryCalls[0].init.body, '{}');
  const progress = queueState.progress.map((entry) => Number(entry.progress.toFixed(6)));
  assert.deepEqual(progress.slice(0, 3), [0.16, 0.255, 0.29]);
  assert.equal(queueState.progress.at(-1).message, 'Recognizing subtitles with Doubao');
  assert.deepEqual(queueState.progress.at(-1).meta, { stage: 'transcribe' });
  assert.equal(queueState.cancelledChecks > 0, true);
});

test('the poll progress is capped at 0.52', async () => {
  const pending = { ok: true, status: 200, headers: { 'x-api-status': 'running' }, body: {} };
  const done = { ok: true, status: 200, headers: { 'x-api-status': 'success' }, body: { text: '' } };
  const { fetchImpl } = createScriptedFetch((url, count) =>
    url.endsWith('/query') && count >= 14 ? done : pending,
  );
  const { state: queueState, queue } = createQueue();
  await runDoubaoAsrTranscription({
    audioAbs: 'ignored.mp3',
    credentials: { apiKey: 'key-1' },
    fetchImpl,
    pollIntervalMs: 1,
    queue,
    readFile: () => Buffer.from('QUJD'),
    sleep: async () => {},
    task: { id: 'task-cap' },
  });
  const progress = queueState.progress.map((entry) => entry.progress);
  assert.equal(Math.min(...progress), 0.16);
  assert.equal(Math.max(...progress), 0.52);
  assert.equal(progress.filter((value) => value === 0.52).length > 0, true);
});

test('a custom base url is normalized before submit and query', async () => {
  const { state, fetchImpl } = createScriptedFetch(() => ({
    ok: true,
    headers: { 'x-api-status': 'success' },
    body: { utterances: [{ startMs: 0, endMs: 5, text: 'x' }] },
  }));
  await runDoubaoAsrTranscription({
    audioAbs: 'ignored.mp3',
    credentials: { apiKey: 'key-1', baseUrl: 'https://example.test/api/v3/auc/bigmodel/query/' },
    fetchImpl,
    readFile: () => Buffer.from('QUJD'),
  });
  assert.equal(state.calls[0].url, 'https://example.test/api/v3/auc/bigmodel/submit');
});

test('a failure api status is translated into actionable Chinese text', async () => {
  const { fetchImpl } = createScriptedFetch(() => ({
    ok: true,
    status: 200,
    headers: { 'x-api-status': 'error', 'x-api-message': 'invalid x-api-key' },
    body: {},
  }));
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl,
      readFile: () => Buffer.from('QUJD'),
    }),
    /火山语音 ASR Key 无效或无权限/,
  );
});

test('a permission error maps to the permission message', async () => {
  const { fetchImpl } = createScriptedFetch(() => ({
    ok: true,
    status: 200,
    headers: { 'x-api-status': 'denied', 'x-api-message': 'no access to this resource' },
    body: {},
  }));
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl,
      readFile: () => Buffer.from('QUJD'),
    }),
    /火山语音 ASR Key 没有录音文件识别权限/,
  );
});

test('an HTTP error keeps the status and redacts the bearer token', async () => {
  const { fetchImpl } = createScriptedFetch(() => ({
    ok: false,
    status: 500,
    headers: { 'x-api-message': 'Bearer sk-very-secret failed' },
    body: {},
  }));
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl,
      readFile: () => Buffer.from('QUJD'),
    }),
    (error) => {
      assert.match(error.message, /Bearer \*\*\* failed/);
      assert.equal(error.message.includes('sk-very-secret'), false);
      return true;
    },
  );
});

test('an HTTP error without a message exposes the status code', async () => {
  const { fetchImpl } = createScriptedFetch(() => ({ ok: false, status: 503, body: {} }));
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl,
      readFile: () => Buffer.from('QUJD'),
    }),
    /Doubao ASR HTTP 503/,
  );
});

test('a non-zero payload code rejects the response', async () => {
  const { fetchImpl } = createScriptedFetch(() => ({
    ok: true,
    status: 200,
    body: { code: 45000001, message: 'busy' },
  }));
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl,
      readFile: () => Buffer.from('QUJD'),
    }),
    /busy/,
  );
});

test('an aborted request reports a timeout', async () => {
  const { fetchImpl } = createScriptedFetch(() => {
    const error = new Error('aborted');
    error.name = 'AbortError';
    return error;
  });
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl,
      readFile: () => Buffer.from('QUJD'),
    }),
    /Doubao ASR request timed out/,
  );
});

test('a recognition that never finishes times out', async () => {
  const { fetchImpl } = createScriptedFetch(() => ({
    ok: true,
    status: 200,
    headers: { 'x-api-status': 'running' },
    body: {},
    delayMs: 5,
  }));
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl,
      readFile: () => Buffer.from('QUJD'),
      sleep: async () => {},
      timeoutMs: 1,
    }),
    /Doubao ASR recognition timed out/,
  );
});

test('a cancelled task stops polling before the query request', async () => {
  const pending = { ok: true, status: 200, headers: { 'x-api-status': 'running' }, body: {} };
  const { state, fetchImpl } = createScriptedFetch(() => pending);
  const queue = {
    emitProgress: () => {},
    throwIfCancelled: () => {
      throw new Error('media task cancelled');
    },
  };
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl,
      pollIntervalMs: 1,
      queue,
      readFile: () => Buffer.from('QUJD'),
      sleep: async () => {},
      task: { id: 'task-cancel' },
    }),
    /media task cancelled/,
  );
  assert.equal(state.calls.length, 1);
});

test('the default reader encodes the audio file as base64', async (t) => {
  const audioFile = makeAudioFile(t, 'QUJD');
  const { state, fetchImpl } = createScriptedFetch(() => ({
    ok: true,
    headers: { 'x-api-status': 'success' },
    body: { utterances: [{ startMs: 0, endMs: 1000, text: 'file' }] },
  }));
  const result = await runDoubaoAsrTranscription({
    audioAbs: audioFile,
    credentials: { apiKey: 'key-1' },
    fetchImpl,
  });
  assert.equal(JSON.parse(state.calls[0].init.body).audio.data, Buffer.from('QUJD').toString('base64'));
  assert.equal(state.calls[0].init.headers['X-Api-Key'], 'key-1');
  assert.deepEqual(result.segments, [{ startMs: 0, endMs: 1000, sourceText: 'file' }]);
});

test('a missing fetch implementation is rejected before any request', async () => {
  await assert.rejects(
    runDoubaoAsrTranscription({
      audioAbs: 'ignored.mp3',
      credentials: { apiKey: 'key-1' },
      fetchImpl: null,
      readFile: () => Buffer.from('QUJD'),
    }),
    /fetch is unavailable/,
  );
});

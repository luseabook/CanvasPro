import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DOUBAO_RECORDED_ASR_RESOURCE,
  transcribeDoubaoRecording,
} from '../api/doubaoRecordedAsrApi.js';
import {
  BAILIAN_ASR_BASE_URL,
  BAILIAN_ASR_MODEL,
  normalizeBailianAsrSegments,
  transcribeBailianAudio,
} from '../api/bailianAsrApi.js';
import { RECORDING_ASR_MODELS, getRecordingAsrModel } from '../api/recordingAsrModels.js';

const DOUBAO_URL = 'https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash';

function createDoubaoFetch({ body = {}, ok = true, status = 200, statusCode = '20000000' } = {}) {
  const state = { calls: [], cancelled: 0 };
  return {
    state,
    fetchImpl: async (url, init) => {
      state.calls.push({ url, init });
      return {
        ok: ok,
        status: status,
        headers: { get: (name) => (name === 'X-Api-Status-Code' ? statusCode : null) },
        json: async () => body,
        body: {
          cancel: async () => {
            state.cancelled += 1;
          },
        },
      };
    },
  };
}

test('doubao requires speech credentials before any request', async () => {
  const { state, fetchImpl } = createDoubaoFetch();
  await assert.rejects(
    transcribeDoubaoRecording({ audioBase64: 'AAA', credentials: {}, fetchImpl }),
    /请在火山语音设置中配置录音识别凭据。/,
  );
  assert.equal(state.calls.length, 0);
});

test('doubao accepts an app key plus access key pair instead of an api key', async () => {
  const { state, fetchImpl } = createDoubaoFetch({ body: { result: { utterances: [] } } });
  const result = await transcribeDoubaoRecording({
    audioBase64: 'AAA',
    credentials: { appKey: 'app-1', accessKey: 'access-1' },
    fetchImpl,
    requestId: 'req-pair',
  });
  const headers = state.calls[0].init.headers;
  assert.equal(headers['X-Api-App-Key'], 'app-1');
  assert.equal(headers['X-Api-Access-Key'], 'access-1');
  assert.equal(headers['X-Api-Key'], undefined);
  assert.deepEqual(result, {
    provider: 'volcengine-speech',
    resourceId: DOUBAO_RECORDED_ASR_RESOURCE,
    requestId: 'req-pair',
    status: 'recognized',
    raw: { result: { utterances: [] } },
  });
});

test('doubao posts the documented flash-recognition payload', async () => {
  const { state, fetchImpl } = createDoubaoFetch({ body: { result: { utterances: [{ text: 'hi' }] } } });
  const controller = new AbortController();
  await transcribeDoubaoRecording({
    audioBase64: 'QUJD',
    credentials: { apiKey: 'key-1' },
    fetchImpl,
    signal: controller.signal,
    requestId: 'req-1',
  });
  const call = state.calls[0];
  assert.equal(call.url, DOUBAO_URL);
  assert.equal(call.init.method, 'POST');
  assert.equal(call.init.signal, controller.signal);
  assert.equal(call.init.headers['Content-Type'], 'application/json');
  assert.equal(call.init.headers['X-Api-Resource-Id'], 'volc.bigasr.auc_turbo');
  assert.equal(call.init.headers['X-Api-Request-Id'], 'req-1');
  assert.equal(call.init.headers['X-Api-Sequence'], '-1');
  assert.equal(call.init.headers['X-Api-Key'], 'key-1');
  assert.deepEqual(JSON.parse(call.init.body), {
    user: { uid: 'ai-canvas-recording' },
    audio: { data: 'QUJD', format: 'mp3', rate: 16000, channel: 1 },
    request: {
      model_name: 'bigmodel',
      show_utterances: true,
      enable_speaker_info: true,
      enable_itn: false,
      enable_punc: true,
      enable_ddc: false,
    },
  });
});

test('doubao defaults to an abort-timeout signal and a generated request id', async () => {
  const { state, fetchImpl } = createDoubaoFetch({ body: { result: { utterances: [] } } });
  const result = await transcribeDoubaoRecording({
    audioBase64: 'AAA',
    credentials: { apiKey: 'key-1' },
    fetchImpl,
  });
  assert.ok(state.calls[0].init.signal instanceof AbortSignal);
  assert.equal(state.calls[0].init.headers['X-Api-Request-Id'], result.requestId);
  assert.match(result.requestId, /^[0-9a-f-]{36}$/);
});

test('doubao treats status 20000003 as silence and does not cancel the body', async () => {
  const { state, fetchImpl } = createDoubaoFetch({ body: {}, statusCode: '20000003' });
  const result = await transcribeDoubaoRecording({
    audioBase64: 'AAA',
    credentials: { apiKey: 'key-1' },
    fetchImpl,
  });
  assert.equal(result.status, 'silence');
  assert.equal(state.cancelled, 0);
});

test('doubao rejects an unidentified status and cancels the response body', async () => {
  const { state, fetchImpl } = createDoubaoFetch({ statusCode: '20000001' });
  await assert.rejects(
    transcribeDoubaoRecording({ audioBase64: 'AAA', credentials: { apiKey: 'key-1' }, fetchImpl }),
    /火山录音识别失败（HTTP 200，状态 20000001）。/,
  );
  assert.equal(state.cancelled, 1);
});

test('doubao reports a missing status header without inventing one', async () => {
  const { state, fetchImpl } = createDoubaoFetch({ statusCode: null });
  await assert.rejects(
    transcribeDoubaoRecording({ audioBase64: 'AAA', credentials: { apiKey: 'key-1' }, fetchImpl }),
    /火山录音识别失败（HTTP 200，状态 缺失）。/,
  );
  assert.equal(state.cancelled, 1);
});

test('doubao surfaces the HTTP failure status', async () => {
  const { state, fetchImpl } = createDoubaoFetch({ ok: false, status: 503, statusCode: '20000000' });
  await assert.rejects(
    transcribeDoubaoRecording({ audioBase64: 'AAA', credentials: { apiKey: 'key-1' }, fetchImpl }),
    /火山录音识别失败（HTTP 503，状态 20000000）。/,
  );
  assert.equal(state.cancelled, 1);
});

test('doubao refuses a recognized response without utterance details', async () => {
  const { fetchImpl } = createDoubaoFetch({ body: { result: {} } });
  await assert.rejects(
    transcribeDoubaoRecording({ audioBase64: 'AAA', credentials: { apiKey: 'key-1' }, fetchImpl }),
    /火山录音识别未返回逐句结果，不能视为无人声。/,
  );
});

test('the recording model catalog is frozen and rejects unknown ids', () => {
  assert.deepEqual(
    RECORDING_ASR_MODELS.map((entry) => entry.id),
    ['volcengine-speech', 'bailian'],
  );
  assert.ok(Object.isFrozen(RECORDING_ASR_MODELS));
  assert.deepEqual(getRecordingAsrModel('bailian'), {
    id: 'bailian',
    label: '阿里 · Qwen Audio ASR',
    model: BAILIAN_ASR_MODEL,
  });
  assert.deepEqual(getRecordingAsrModel(), RECORDING_ASR_MODELS[0]);
  assert.throws(() => getRecordingAsrModel('whisper'), /不支持的语音识别模型，请重新选择。/);
});

function createBailianFetch({
  policy = {
    upload_dir: 'dashscope-tmp/abc',
    upload_host: 'https://oss.invalid/upload',
    oss_access_key_id: 'AK',
    signature: 'sig',
    policy: 'pol',
    x_oss_object_acl: 'private',
    x_oss_forbid_overwrite: 'true',
    max_file_size_mb: 10,
  },
  taskSequence = [],
  transcription = { transcripts: [] },
  failWith = null,
} = {}) {
  const state = { calls: [] };
  const jsonResponse = (payload, status = 200) => ({
    ok: status >= 200 && status < 300,
    status: status,
    json: async () => payload,
    headers: { get: () => null },
  });
  return {
    state,
    fetchImpl: async (url, init = {}) => {
      state.calls.push({ url, init });
      if (failWith && failWith.match(url)) return jsonResponse(failWith.body, failWith.status);
      if (url.includes('/api/v1/uploads?action=getPolicy')) return jsonResponse({ data: policy });
      if (url === policy.upload_host) return jsonResponse({});
      if (url.includes('/api/v1/services/audio/asr/transcription'))
        return jsonResponse({ output: { task_id: 'task-1', task_status: 'PENDING' } });
      if (url.includes('/api/v1/tasks/'))
        return jsonResponse({ output: taskSequence.shift() || { task_status: 'RUNNING' } });
      if (url.includes('transcription.invalid')) return jsonResponse(transcription);
      throw new Error('unexpected request ' + url);
    },
  };
}

function bailianArgs(overrides = {}) {
  return {
    audio: new Blob([Buffer.from('audio-bytes')], { type: 'audio/mpeg' }),
    credentials: { apiKey: 'sk-live-1' },
    sleep: async () => {},
    ...overrides,
  };
}

test('bailian requires an api key before anything else', async () => {
  const { state, fetchImpl } = createBailianFetch();
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ credentials: {}, fetchImpl })),
    /请在设置 > API Key > 阿里云百炼填写 API Key/,
  );
  assert.equal(state.calls.length, 0);
});

test('bailian rejects an empty or oversized recording', async () => {
  const { fetchImpl } = createBailianFetch();
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ audio: new Blob([]), fetchImpl })),
    /待识别音频为空/,
  );
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ audio: { size: 2 * 1024 ** 3 + 1 }, fetchImpl })),
    /百炼录音识别最多支持 12 小时、2 GB 文件/,
  );
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ durationSec: 12 * 60 * 60 + 1, fetchImpl })),
    /百炼录音识别最多支持 12 小时、2 GB 文件/,
  );
});

test('bailian refuses a non-https or credential-carrying base url', async () => {
  const { fetchImpl } = createBailianFetch();
  await assert.rejects(
    transcribeBailianAudio(
      bailianArgs({ credentials: { apiKey: 'sk-live-1', baseUrl: 'http://x.invalid' }, fetchImpl }),
    ),
    /百炼接口需要有效的 HTTPS 地址/,
  );
  await assert.rejects(
    transcribeBailianAudio(
      bailianArgs({
        credentials: { apiKey: 'sk-live-1', baseUrl: 'https://user:pass@x.invalid' },
        fetchImpl,
      }),
    ),
    /百炼接口需要有效的 HTTPS 地址/,
  );
});

test('bailian runs the upload, async submission and poll flow', async () => {
  const { state, fetchImpl } = createBailianFetch({
    taskSequence: [
      {
        task_status: 'SUCCEEDED',
        results: [{ subtask_status: 'SUCCEEDED', transcription_url: 'https://transcription.invalid/1' }],
      },
    ],
    transcription: {
      transcripts: [
        {
          sentences: [
            { begin_time: 0, end_time: 1200, text: '你好', speaker_id: 1 },
            { begin_time: 1200, end_time: 2400, text: '世界' },
          ],
        },
      ],
    },
  });
  const progress = [];
  const result = await transcribeBailianAudio(
    bailianArgs({ fetchImpl, onProgress: (value, message) => progress.push([value, message]) }),
  );
  assert.deepEqual(result.segments, [
    { startMs: 0, endMs: 1200, sourceText: '你好', speaker: '1' },
    { startMs: 1200, endMs: 2400, sourceText: '世界' },
  ]);
  assert.equal(result.raw, undefined);
  assert.deepEqual(progress, [
    [0.1, 'Uploading audio to Bailian'],
    [0.16, 'Submitting Bailian subtitle recognition'],
    [0.245, 'Recognizing subtitles with Bailian'],
  ]);

  const urls = state.calls.map((call) => call.url);
  assert.deepEqual(urls, [
    BAILIAN_ASR_BASE_URL + '/api/v1/uploads?action=getPolicy&model=' + BAILIAN_ASR_MODEL,
    'https://oss.invalid/upload',
    BAILIAN_ASR_BASE_URL + '/api/v1/services/audio/asr/transcription',
    BAILIAN_ASR_BASE_URL + '/api/v1/tasks/task-1',
    'https://transcription.invalid/1',
  ]);
  for (const call of state.calls) assert.equal(call.init.redirect, 'error');
  assert.equal(state.calls[0].init.headers.Authorization, 'Bearer sk-live-1');
  assert.equal(state.calls[1].init.headers, undefined);
  assert.equal(state.calls[3].init.headers.Authorization, 'Bearer sk-live-1');

  const uploadForm = state.calls[1].init.body;
  const uploadEntries = Object.fromEntries([...uploadForm.entries()].map(([k, v]) => [k, v]));
  assert.equal(uploadEntries.OSSAccessKeyId, 'AK');
  assert.equal(uploadEntries.Signature, 'sig');
  assert.equal(uploadEntries.policy, 'pol');
  assert.equal(uploadEntries['x-oss-object-acl'], 'private');
  assert.equal(uploadEntries['x-oss-forbid-overwrite'], 'true');
  assert.equal(uploadEntries.key, 'dashscope-tmp/abc/speech.mp3');
  assert.equal(uploadEntries.success_action_status, '200');
  assert.ok(uploadEntries.file instanceof Blob);

  const submission = state.calls[2].init;
  assert.equal(submission.headers['X-DashScope-Async'], 'enable');
  assert.equal(submission.headers['X-DashScope-OssResourceResolve'], 'enable');
  assert.equal(submission.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(submission.body), {
    model: BAILIAN_ASR_MODEL,
    input: { file_urls: ['oss://dashscope-tmp/abc/speech.mp3'] },
    parameters: { channel_id: [0], diarization_enabled: true },
  });
});

test('bailian returns the raw payload only when requested', async () => {
  const { fetchImpl } = createBailianFetch({
    taskSequence: [
      {
        task_status: 'SUCCEEDED',
        results: [{ subtask_status: 'SUCCEEDED', transcription_url: 'https://transcription.invalid/1' }],
      },
    ],
    transcription: { transcripts: [{ sentences: [{ begin_time: 0, end_time: 10, text: 'x' }] }] },
  });
  const result = await transcribeBailianAudio(bailianArgs({ fetchImpl, includeRaw: true }));
  assert.deepEqual(result.raw.transcripts[0].sentences[0].text, 'x');
});

test('bailian names an invalid api key distinctly', async () => {
  const { fetchImpl } = createBailianFetch({
    failWith: { match: (url) => url.includes('/api/v1/uploads'), status: 401, body: {} },
  });
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ fetchImpl })),
    /阿里云百炼 API Key 无效或没有模型访问权限/,
  );
});

test('bailian never leaks the api key inside a thrown message', async () => {
  const { fetchImpl } = createBailianFetch({
    failWith: {
      match: (url) => url.includes('/api/v1/uploads'),
      status: 400,
      body: { message: 'rejected credential sk-live-1' },
    },
  });
  await assert.rejects(transcribeBailianAudio(bailianArgs({ fetchImpl })), (error) => {
    assert.ok(!error.message.includes('sk-live-1'));
    assert.ok(error.message.includes('***'));
    return true;
  });
});

test('bailian validates the temporary upload policy', async () => {
  const { fetchImpl } = createBailianFetch({
    policy: { upload_host: 'https://oss.invalid/upload', max_file_size_mb: 10 },
  });
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ fetchImpl })),
    /百炼未返回有效的上传凭证/,
  );

  const small = createBailianFetch({
    policy: {
      upload_dir: 'dashscope-tmp/abc',
      upload_host: 'https://oss.invalid/upload',
      oss_access_key_id: 'AK',
      signature: 'sig',
      policy: 'pol',
      x_oss_object_acl: 'private',
      x_oss_forbid_overwrite: 'true',
      max_file_size_mb: 0,
    },
  });
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ fetchImpl: small.fetchImpl })),
    /音频超过百炼临时上传大小限制（0 MB）/,
  );
});

test('bailian reports a missing task id and a failed task status', async () => {
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
  const noTaskId = async (url) => {
    const payload = url.includes('/api/v1/uploads?action=getPolicy')
      ? { data: policy }
      : { output: { task_status: 'PENDING' } };
    return { ok: true, status: 200, json: async () => payload, headers: { get: () => null } };
  };
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ fetchImpl: noTaskId })),
    /百炼未返回语音识别任务 ID/,
  );

  const { fetchImpl } = createBailianFetch({ taskSequence: [{ task_status: 'FAILED' }] });
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ fetchImpl })),
    /百炼语音任务失败：FAILED/,
  );
});

test('bailian reports a failed transcription subtask', async () => {
  const { fetchImpl } = createBailianFetch({
    taskSequence: [
      { task_status: 'SUCCEEDED', results: [{ subtask_status: 'FAILED', code: 'SubtaskFailed' }] },
    ],
  });
  await assert.rejects(transcribeBailianAudio(bailianArgs({ fetchImpl })), /SubtaskFailed/);
});

test('bailian times out instead of polling forever', async () => {
  let clock = 0;
  const { fetchImpl } = createBailianFetch();
  await assert.rejects(
    transcribeBailianAudio(
      bailianArgs({ fetchImpl, timeoutMs: 10, now: () => (clock += 1000) }),
    ),
    /百炼语音识别超时，请重试/,
  );
});

test('bailian propagates cancellation through throwIfCancelled', async () => {
  let calls = 0;
  const { fetchImpl } = createBailianFetch();
  await assert.rejects(
    transcribeBailianAudio(
      bailianArgs({
        fetchImpl,
        throwIfCancelled: () => {
          calls += 1;
          if (calls > 2) throw new Error('cancelled mid-flight');
        },
      }),
    ),
    /cancelled mid-flight/,
  );
});

test('bailian rejects an upload the object store refuses', async () => {
  const { fetchImpl } = createBailianFetch({
    failWith: { match: (url) => url === 'https://oss.invalid/upload', status: 500, body: {} },
  });
  await assert.rejects(transcribeBailianAudio(bailianArgs({ fetchImpl })), /百炼语音请求失败（HTTP 500）/);
});

test('bailian treats a refused object store permission as an api key problem', async () => {
  const { fetchImpl } = createBailianFetch({
    failWith: { match: (url) => url === 'https://oss.invalid/upload', status: 403, body: {} },
  });
  await assert.rejects(
    transcribeBailianAudio(bailianArgs({ fetchImpl })),
    /阿里云百炼 API Key 无效或没有模型访问权限/,
  );
});

test('segment normalization drops unusable sentences and clamps to the media duration', () => {
  assert.throws(() => normalizeBailianAsrSegments({}), /百炼未返回有效的语音识别结果/);
  const segments = normalizeBailianAsrSegments(
    {
      transcripts: [
        {
          sentences: [
            { begin_time: 3000, end_time: 1000, text: 'reversed' },
            { begin_time: -5, end_time: 100, text: 'negative' },
            { begin_time: 'x', end_time: 100, text: 'not-a-number' },
            { begin_time: 0, end_time: 5000, text: '  clamped  ' },
            { begin_time: 100, end_time: 200, text: 'kept', speaker_id: 0 },
          ],
        },
      ],
    },
    2,
  );
  assert.deepEqual(segments, [
    { startMs: 0, endMs: 2000, sourceText: 'clamped' },
    { startMs: 100, endMs: 200, sourceText: 'kept', speaker: '0' },
  ]);
});

test('segment normalization sorts across transcripts and tolerates empty input', () => {
  const segments = normalizeBailianAsrSegments({
    transcripts: [
      { sentences: [{ begin_time: 2000, end_time: 2500, text: 'second' }] },
      { sentences: [{ begin_time: 100, end_time: 200, text: 'first' }] },
      { sentences: [] },
    ],
  });
  assert.deepEqual(
    segments.map((segment) => segment.sourceText),
    ['first', 'second'],
  );
  assert.deepEqual(normalizeBailianAsrSegments({ transcripts: [] }), []);
});

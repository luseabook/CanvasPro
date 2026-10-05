import test from 'node:test';
import assert from 'node:assert/strict';

import { createRecordingAsrProvider } from './recordingAsrProviders.js';

const DOUBAO_URL = 'https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash';

function doubaoDeps(overrides = {}) {
  const state = { configs: [] };
  return {
    state,
    deps: {
      getDoubaoAsrConfig: (options) => {
        state.configs.push(options);
        return { apiKey: 'doubao-key', appKey: '', accessKey: '' };
      },
      getBailianAsrConfig: () => ({ apiKey: 'bailian-key' }),
      ...overrides,
    },
  };
}

function doubaoResponse({ statusCode = '20000000', body = { result: { utterances: [{ text: 'hi' }] } } } = {}) {
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

test('an unknown provider id is rejected before any credential lookup', () => {
  const { state, deps } = doubaoDeps();
  assert.throws(() => createRecordingAsrProvider('whisper', deps), /不支持的语音识别模型，请重新选择。/);
  assert.equal(state.configs.length, 0);
});

test('the provider object merges the catalog entry with its implementation', () => {
  const { deps } = doubaoDeps();
  const provider = createRecordingAsrProvider('volcengine-speech', deps);
  assert.equal(provider.id, 'volcengine-speech');
  assert.equal(provider.label, '火山 · 录音识别极速版');
  assert.equal(provider.model, 'volc.bigasr.auc_turbo');
  assert.equal(typeof provider.credentials, 'function');
  assert.equal(typeof provider.validate, 'function');
  assert.equal(typeof provider.run, 'function');
});

test('the speech provider asks only for speech-scoped doubao credentials', () => {
  const { state, deps } = doubaoDeps();
  createRecordingAsrProvider('volcengine-speech', deps).credentials();
  assert.deepEqual(state.configs, [{ speechOnly: true }]);
});

test('doubao accepts an api key or an app key pair and rejects anything else', () => {
  const { deps } = doubaoDeps();
  const provider = createRecordingAsrProvider('volcengine-speech', deps);
  assert.doesNotThrow(() => provider.validate({ apiKey: 'k' }));
  assert.doesNotThrow(() => provider.validate({ appKey: 'a', accessKey: 's' }));
  assert.throws(() => provider.validate({}), /请在火山语音设置中配置录音识别凭据。/);
  assert.throws(() => provider.validate({ appKey: 'a' }), /请在火山语音设置中配置录音识别凭据。/);
  assert.throws(() => provider.validate({ accessKey: 's' }), /请在火山语音设置中配置录音识别凭据。/);
});

test('doubao refuses a recording above the 100 MB fast-recognition limit', () => {
  const { deps } = doubaoDeps();
  const provider = createRecordingAsrProvider('volcengine-speech', deps);
  assert.throws(
    () => provider.run({ bytes: { length: 100 * 1024 * 1024 + 1 }, credentials: { apiKey: 'k' } }),
    /录音文件超过极速识别的 100MB 上限。/,
  );
});

test('doubao sends the recording as base64 mp3 with the resolved credentials', async () => {
  const { deps } = doubaoDeps();
  const { state, fetchImpl } = doubaoResponse();
  const provider = createRecordingAsrProvider('volcengine-speech', deps);
  const bytes = Buffer.from('recorded-audio');
  const result = await provider.run({
    bytes: bytes,
    credentials: { apiKey: 'doubao-key' },
    fetchImpl: fetchImpl,
    signal: undefined,
  });
  assert.equal(state.calls[0].url, DOUBAO_URL);
  const payload = JSON.parse(state.calls[0].init.body);
  assert.equal(payload.audio.data, bytes.toString('base64'));
  assert.equal(payload.audio.format, 'mp3');
  assert.equal(result.provider, 'volcengine-speech');
  assert.equal(result.status, 'recognized');
});

test('the bailian provider reads the bailian credentials', () => {
  const deps = {
    getBailianAsrConfig: () => ({ apiKey: 'bailian-key', baseUrl: '' }),
    getDoubaoAsrConfig: () => {
      throw new Error('must not be called');
    },
  };
  const provider = createRecordingAsrProvider('bailian', deps);
  assert.deepEqual(provider.credentials(), { apiKey: 'bailian-key', baseUrl: '' });
  assert.equal(provider.model, 'qwen-audio-3.0-asr-flash-filetrans');
  assert.throws(() => provider.validate({}), /请在设置 > API Key > 阿里云百炼填写 API Key。/);
  assert.doesNotThrow(() => provider.validate({ apiKey: 'k' }));
});

function bailianFetch(transcription) {
  const state = { calls: [] };
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
  return {
    state,
    fetchImpl: async (url, init = {}) => {
      state.calls.push({ url, init });
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
      if (url.includes('transcription.invalid')) return json(transcription);
      throw new Error('unexpected request ' + url);
    },
  };
}

const BAILIAN_TRANSCRIPTION = {
  transcripts: [
    {
      sentences: [
        {
          begin_time: 0,
          end_time: 1000,
          text: '第一句',
          speaker_id: 2,
          words: [{ text: '第一句', begin_time: 0, end_time: 1000 }],
        },
        { begin_time: 1000, end_time: 2000, text: '', speaker_id: null },
      ],
    },
  ],
};

test('bailian wraps the recording as an mp3 blob and maps sentences to utterances', async () => {
  const deps = { getBailianAsrConfig: () => ({ apiKey: 'bailian-key', baseUrl: '' }) };
  const { state, fetchImpl } = bailianFetch(BAILIAN_TRANSCRIPTION);
  const provider = createRecordingAsrProvider('bailian', deps);
  const result = await provider.run({
    bytes: Buffer.from('recorded-audio'),
    credentials: { apiKey: 'bailian-key' },
    fetchImpl: fetchImpl,
    durationSec: 0,
    sleep: async () => {},
  });
  assert.deepEqual(result, {
    provider: 'bailian',
    model: 'qwen-audio-3.0-asr-flash-filetrans',
    status: 'recognized',
    raw: BAILIAN_TRANSCRIPTION,
    utterances: [
      {
        text: '第一句',
        start_time: 0,
        end_time: 1000,
        additions: { speaker: 2 },
        words: [{ text: '第一句', start_time: 0, end_time: 1000 }],
      },
      {
        text: '',
        start_time: 1000,
        end_time: 2000,
        additions: { speaker: '' },
        words: [],
      },
    ],
  });
  const uploadForm = state.calls[1].init.body;
  const file = Object.fromEntries([...uploadForm.entries()]).file;
  assert.equal(file.type, 'audio/mpeg');
});

test('bailian reports silence when every mapped utterance is empty', async () => {
  const deps = { getBailianAsrConfig: () => ({ apiKey: 'bailian-key', baseUrl: '' }) };
  const { fetchImpl } = bailianFetch({
    transcripts: [{ sentences: [{ begin_time: 0, end_time: 1000, text: '' }] }],
  });
  const provider = createRecordingAsrProvider('bailian', deps);
  const result = await provider.run({
    bytes: Buffer.from('recorded-audio'),
    credentials: { apiKey: 'bailian-key' },
    fetchImpl: fetchImpl,
    sleep: async () => {},
  });
  assert.equal(result.status, 'silence');
});

test('the bailian recording path keeps its 180 second overall budget', async () => {
  const deps = { getBailianAsrConfig: () => ({ apiKey: 'bailian-key', baseUrl: '' }) };
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
    return json({ output: { task_status: 'RUNNING' } });
  };
  const provider = createRecordingAsrProvider('bailian', deps);
  let clock = 0,
    calls = 0;
  await assert.rejects(
    provider.run({
      bytes: Buffer.from('recorded-audio'),
      credentials: { apiKey: 'bailian-key' },
      fetchImpl: fetchImpl,
      sleep: async () => {},
      now: () => {
        calls += 1;
        return (clock += 1000);
      },
    }),
    /百炼语音识别超时，请重试/,
  );
  const elapsedMs = (calls - 1) * 1000;
  assert.ok(
    elapsedMs >= 180000 && elapsedMs < 185000,
    'expected roughly a 180s budget, observed ' + elapsedMs + 'ms',
  );
});

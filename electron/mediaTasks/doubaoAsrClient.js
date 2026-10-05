import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
export const DOUBAO_ASR_RESOURCE_ID = 'volc.seedasr.auc';
export const DOUBAO_ASR_DEFAULT_BASE_URL = 'https://openspeech.bytedance.com/api/v3/auc/bigmodel';
const DOUBAO_ASR_DEFAULT_POLL_INTERVAL_MS = 2000,
  DOUBAO_ASR_DEFAULT_TIMEOUT_MS = 10 * 60 * 1000,
  DOUBAO_ASR_INVALID_KEY_MESSAGE =
    '火山语音 ASR Key 无效或无权限。请在设置 > API Key > 火山语音填写语音服务的 X-Api-Key，不要使用火山方舟 Key，并确认已开通录音文件识别。',
  DOUBAO_ASR_PERMISSION_MESSAGE =
    '火山语音 ASR Key 没有录音文件识别权限。请确认火山语音服务已开通，并给该 X-Api-Key 开启 ASR 访问权限。';
function firstText(...values) {
  for (const value of values) {
    if (value == null) continue;
    const text = String(value)['trim']();
    if (text) return text;
  }
  return '';
}
function normalizeBaseUrl(value = '') {
  const text = String(value || DOUBAO_ASR_DEFAULT_BASE_URL)['trim'](),
    baseUrl = text || DOUBAO_ASR_DEFAULT_BASE_URL;
  return baseUrl['replace'](/\/+$/, '')
    ['replace'](/\/submit$/i, '')
    ['replace'](/\/query$/i, '');
}
function normalizePositiveMs(value, fallback) {
  const numeric = Number(value);
  if (!Number['isFinite'](numeric) || numeric <= 0) return fallback;
  return Math['max'](1, Math['round'](numeric));
}
function normalizeAsrTimeMs(value, durationMs = 0) {
  const numeric = Number(value);
  if (!Number['isFinite'](numeric) || numeric < 0) return 0;
  if (durationMs > 0 && numeric <= durationMs / 1000 + 5)
    return Math['max'](0, Math['round'](numeric * 1000));
  return Math['max'](0, Math['round'](numeric));
}
function normalizeSpeakerLabel(value) {
  if (value == null) return '';
  return String(value)['trim']();
}
function parseJsonText(text = '') {
  const trimmed = String(text || '')['trim']();
  if (!trimmed) return {};
  try {
    return JSON['parse'](trimmed);
  } catch {
    return {};
  }
}
function extractResultPayload(payload = {}) {
  if (!payload || typeof payload !== 'object') return {};
  const data = payload['data'] && typeof payload['data'] === 'object' ? payload['data'] : {};
  if (payload['result'] && typeof payload['result'] === 'object') return payload['result'];
  if (data['result'] && typeof data['result'] === 'object') return data['result'];
  if (data['utterances'] || data['text'] || data['segments']) return data;
  return payload;
}
function readHeader(headers, name) {
  if (!headers) return '';
  if (typeof headers['get'] === 'function') return String(headers['get'](name) || '')['trim']();
  const lowerName = String(name || '')['toLowerCase'](),
    matchedKey = Object['keys'](headers || {})['find'](
      (key) => key['toLowerCase']() === lowerName,
    );
  return matchedKey ? String(headers[matchedKey] || '')['trim']() : '';
}
function isSuccessPayload(payload = {}) {
  const status = String(payload?.['status'] || payload?.['message'] || payload?.['code'] || '')[
    'toLowerCase'
  ]();
  if (status === 'success' || status === 'succeeded' || status === 'done') return true;
  const result = extractResultPayload(payload);
  return !!(result?.['utterances'] || result?.['segments'] || result?.['text']);
}
function isFailureStatus(status = '') {
  return /fail|error|invalid|denied|forbid|unauthor|expired/i['test'](String(status || ''));
}
function sanitizeErrorMessage(message = '') {
  const trimmed = String(message || '')['trim']();
  if (!trimmed) return 'Doubao ASR request failed';
  if (trimmed === DOUBAO_ASR_INVALID_KEY_MESSAGE || trimmed === DOUBAO_ASR_PERMISSION_MESSAGE)
    return trimmed;
  const sanitized = trimmed['replace'](/Bearer\s+[A-Za-z0-9._~-]+/g, 'Bearer ***')
    ['replace'](/(X-Api-Key["':\s]+)[A-Za-z0-9._~-]+/gi, '$1***')
    ['replace'](/(X-Api-Access-Key["':\s]+)[A-Za-z0-9._~-]+/gi, '$1***');
  if (/invalid\s+x-api-key|x-api-key\s+invalid|api\s*key\s+invalid/i['test'](sanitized))
    return DOUBAO_ASR_INVALID_KEY_MESSAGE;
  if (
    /(?:permission|denied|forbid|unauthor|not\s+authorized|no\s+access|无权限|未授权|鉴权)/i['test'](
      sanitized,
    )
  )
    return DOUBAO_ASR_PERMISSION_MESSAGE;
  return sanitized;
}
function buildAuthHeaders(credentials = {}) {
  const apiKey = firstText(credentials['apiKey'], credentials['volcengineApiKey']);
  if (apiKey) return { 'X-Api-Key': apiKey };
  const appKey = firstText(credentials['appKey'], credentials['apiAppKey']),
    accessKey = firstText(credentials['accessKey'], credentials['apiAccessKey']);
  if (appKey && accessKey) return { 'X-Api-App-Key': appKey, 'X-Api-Access-Key': accessKey };
  throw new Error('火山语音 ASR Key 未配置或无权限');
}
export function buildDoubaoAsrSubmitBody({ audioBase64: audioBase64 = '', uid: uid = 'ai-canvas' } = {}) {
  return {
    user: { uid: String(uid || 'ai-canvas') },
    audio: { data: String(audioBase64 || ''), format: 'mp3', codec: 'mp3', rate: 16000 },
    request: {
      model_name: 'bigmodel',
      show_utterances: true,
      enable_speaker_info: true,
      enable_itn: true,
      enable_punc: true,
      enable_ddc: false,
    },
  };
}
export function buildDoubaoAsrHeaders({
  credentials: credentials = {},
  requestId: requestId = '',
  resourceId: resourceId = DOUBAO_ASR_RESOURCE_ID,
} = {}) {
  const effectiveRequestId = String(requestId || randomUUID())['trim']();
  return {
    'Content-Type': 'application/json',
    'X-Api-Resource-Id': String(resourceId || DOUBAO_ASR_RESOURCE_ID),
    'X-Api-Request-Id': effectiveRequestId,
    'X-Api-Sequence': '-1',
    ...buildAuthHeaders(credentials),
  };
}
async function postDoubaoJson({
  body: body = {},
  fetchImpl: fetchImpl,
  headers: headers = {},
  timeoutMs: timeoutMs = 30000,
  url: url = '',
} = {}) {
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
  const controller = typeof AbortController === 'function' ? new AbortController() : null,
    timeoutTimer = controller
      ? setTimeout(() => controller['abort'](), normalizePositiveMs(timeoutMs, 30000))
      : null;
  try {
    const response = await fetchImpl(url, {
        method: 'POST',
        headers: headers,
        body: JSON['stringify'](body || {}),
        signal: controller?.['signal'],
      }),
      responseText = typeof response?.['text'] === 'function' ? await response['text']() : '',
      payload = parseJsonText(responseText),
      apiStatus = firstText(
        readHeader(response?.['headers'], 'x-api-status'),
        readHeader(response?.['headers'], 'X-Api-Status'),
        payload['status'],
        payload['message'],
      ),
      apiMessage = firstText(
        readHeader(response?.['headers'], 'x-api-message'),
        readHeader(response?.['headers'], 'X-Api-Message'),
        payload['message'],
        payload['error']?.['message'],
        payload['error'],
      );
    if (!response?.['ok'])
      throw new Error(
        sanitizeErrorMessage(apiMessage || 'Doubao ASR HTTP ' + (response?.['status'] || 'error')),
      );
    if (isFailureStatus(apiStatus)) throw new Error(sanitizeErrorMessage(apiMessage || apiStatus));
    if (payload && typeof payload === 'object' && payload['code'] && Number(payload['code']) !== 0)
      throw new Error(sanitizeErrorMessage(apiMessage || payload['message'] || payload['code']));
    return { apiMessage: apiMessage, apiStatus: apiStatus, data: payload };
  } catch (error) {
    const message =
      String(error?.['name'] || '') === 'AbortError'
        ? 'Doubao ASR request timed out'
        : error?.['message'] || error;
    throw new Error(sanitizeErrorMessage(message));
  } finally {
    if (timeoutTimer) clearTimeout(timeoutTimer);
  }
}
function getWordsText(words = []) {
  if (!Array['isArray'](words)) return '';
  return words['map']((word) => firstText(word?.['text'], word?.['word']))
    ['filter'](Boolean)
    ['join']('');
}
export function normalizeDoubaoAsrSegments(payload = {}, durationSec = 0) {
  const durationMs = Math['max'](0, Math['round'](Number(durationSec || 0) * 1000)),
    resultPayload = extractResultPayload(payload),
    rawSegments = Array['isArray'](resultPayload?.['utterances'])
      ? resultPayload['utterances']
      : Array['isArray'](resultPayload?.['segments'])
        ? resultPayload['segments']
        : Array['isArray'](payload?.['segments'])
          ? payload['segments']
          : [],
    segments = [];
  for (const rawSegment of rawSegments) {
    if (!rawSegment || typeof rawSegment !== 'object') continue;
    const startMs = normalizeAsrTimeMs(
        rawSegment['startMs'] ?? rawSegment['start_time'] ?? rawSegment['startTime'] ?? rawSegment['start'],
        durationMs,
      ),
      endMs = normalizeAsrTimeMs(
        rawSegment['endMs'] ?? rawSegment['end_time'] ?? rawSegment['endTime'] ?? rawSegment['end'],
        durationMs,
      );
    if (endMs <= startMs) continue;
    const sourceText = firstText(
        rawSegment['sourceText'],
        rawSegment['text'],
        rawSegment['utterance'],
        getWordsText(rawSegment['words']),
      ),
      speaker = normalizeSpeakerLabel(
        rawSegment['speaker'] ??
          rawSegment['speaker_id'] ??
          rawSegment['speakerId'] ??
          rawSegment['speaker_info']?.['speaker_id'] ??
          rawSegment['speaker_info']?.['speakerId'] ??
          rawSegment['speaker_info']?.['speaker'],
      ),
      segment = { startMs: startMs, endMs: endMs, sourceText: sourceText };
    if (speaker) segment['speaker'] = speaker;
    segments['push'](segment);
  }
  if (!segments['length']) {
    const fallbackText = firstText(resultPayload?.['text'], payload?.['text']);
    fallbackText &&
      durationMs > 0 &&
      segments['push']({ startMs: 0, endMs: durationMs, sourceText: fallbackText });
  }
  return segments['sort']((left, right) => left['startMs'] - right['startMs']);
}
export async function runDoubaoAsrTranscription({
  audioAbs: audioAbs = '',
  credentials: credentials = {},
  durationSec: durationSec = 0,
  fetchImpl: fetchImpl = globalThis['fetch'],
  pollIntervalMs: pollIntervalMs = DOUBAO_ASR_DEFAULT_POLL_INTERVAL_MS,
  queue: queue,
  readFile: readFile = readFileSync,
  requestId: requestId = '',
  resourceId: resourceId = DOUBAO_ASR_RESOURCE_ID,
  sleep: sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  task: task,
  timeoutMs: timeoutMs = DOUBAO_ASR_DEFAULT_TIMEOUT_MS,
} = {}) {
  const baseUrl = normalizeBaseUrl(credentials['baseUrl'] || credentials['apiUrl']),
    effectiveRequestId = String(requestId || randomUUID())['trim'](),
    headers = buildDoubaoAsrHeaders({
      credentials: credentials,
      requestId: effectiveRequestId,
      resourceId: resourceId,
    }),
    audioBase64 = readFile(audioAbs)['toString']('base64'),
    startedAt = Date['now'](),
    timeout = normalizePositiveMs(timeoutMs, DOUBAO_ASR_DEFAULT_TIMEOUT_MS),
    pollInterval = normalizePositiveMs(pollIntervalMs, DOUBAO_ASR_DEFAULT_POLL_INTERVAL_MS);
  queue?.['emitProgress']?.(task, 0.16, 'Submitting Doubao subtitle recognition', {
    stage: 'transcribe',
  });
  const submitResult = await postDoubaoJson({
    body: buildDoubaoAsrSubmitBody({ audioBase64: audioBase64 }),
    fetchImpl: fetchImpl,
    headers: headers,
    timeoutMs: 60000,
    url: baseUrl + '/submit',
  });
  if (isSuccessPayload(submitResult['data']) || String(submitResult['apiStatus'])['toLowerCase']() === 'success') {
    const segments = normalizeDoubaoAsrSegments(submitResult['data'], durationSec);
    return { raw: submitResult['data'], segments: segments };
  }
  let progress = 0.22;
  while (Date['now']() - startedAt <= timeout) {
    (queue?.['throwIfCancelled']?.(task),
      await sleep(pollInterval),
      (progress = Math['min'](0.52, progress + 0.035)),
      queue?.['emitProgress']?.(task, progress, 'Recognizing subtitles with Doubao', {
        stage: 'transcribe',
      }));
    const queryResult = await postDoubaoJson({
      body: {},
      fetchImpl: fetchImpl,
      headers: headers,
      timeoutMs: 30000,
      url: baseUrl + '/query',
    });
    if (
      isSuccessPayload(queryResult['data']) ||
      String(queryResult['apiStatus'])['toLowerCase']() === 'success'
    ) {
      const querySegments = normalizeDoubaoAsrSegments(queryResult['data'], durationSec);
      return { raw: queryResult['data'], segments: querySegments };
    }
    if (isFailureStatus(queryResult['apiStatus']))
      throw new Error(sanitizeErrorMessage(queryResult['apiMessage'] || queryResult['apiStatus']));
  }
  throw new Error('Doubao ASR recognition timed out');
}

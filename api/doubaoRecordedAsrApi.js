export const DOUBAO_RECORDED_ASR_RESOURCE = 'volc.bigasr.auc_turbo';
export async function transcribeDoubaoRecording({
  audioBase64,
  credentials = {},
  fetchImpl = globalThis.fetch,
  signal,
  requestId = globalThis.crypto.randomUUID(),
} = {}) {
  if (!credentials.apiKey && !(credentials.appKey && credentials.accessKey))
    throw new Error('请在火山语音设置中配置录音识别凭据。');
  const response = await fetchImpl(
    'https://openspeech.bytedance.com/api/v3/auc/bigmodel/recognize/flash',
    {
      method: 'POST',
      signal: signal || AbortSignal.timeout(0x2bf20),
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Resource-Id': DOUBAO_RECORDED_ASR_RESOURCE,
        'X-Api-Request-Id': requestId,
        'X-Api-Sequence': '-1',
        ...(credentials.apiKey
          ? { 'X-Api-Key': credentials.apiKey }
          : { 'X-Api-App-Key': credentials.appKey, 'X-Api-Access-Key': credentials.accessKey }),
      },
      body: JSON.stringify({
        user: { uid: 'ai-canvas-recording' },
        audio: { data: audioBase64, format: 'mp3', rate: 0x3e80, channel: 0x1 },
        request: {
          model_name: 'bigmodel',
          show_utterances: true,
          enable_speaker_info: true,
          enable_itn: false,
          enable_punc: true,
          enable_ddc: false,
        },
      }),
    },
  );
  const statusCode = response.headers.get('X-Api-Status-Code');
  if (!response.ok || !['20000000', '20000003'].includes(statusCode)) {
    await response.body?.cancel();
    throw new Error(
      '火山录音识别失败（HTTP ' + response.status + '，状态 ' + (statusCode || '缺失') + '）。',
    );
  }
  const json = await response.json();
  if (statusCode !== '20000003' && !Array.isArray(json.result?.utterances))
    throw new Error('火山录音识别未返回逐句结果，不能视为无人声。');
  return {
    provider: 'volcengine-speech',
    resourceId: DOUBAO_RECORDED_ASR_RESOURCE,
    requestId: requestId,
    status: statusCode === '20000003' ? 'silence' : 'recognized',
    raw: json,
  };
}

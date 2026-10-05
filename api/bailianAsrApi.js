export const BAILIAN_ASR_MODEL = 'qwen-audio-3.0-asr-flash-filetrans';
export const BAILIAN_ASR_BASE_URL = 'https://dashscope.aliyuncs.com';
export function normalizeBailianAsrSegments(raw = {}, durationMs = 0) {
  if (!Array.isArray(raw.transcripts)) throw new Error('百炼未返回有效的语音识别结果');
  const maxMs = durationMs > 0 ? Math.round(durationMs * 1000) : Infinity;
  return raw.transcripts
    .flatMap((transcript) =>
      (transcript.sentences || []).flatMap((sentence) => {
        const beginTime = Number(sentence.begin_time),
          endTime = Number(sentence.end_time);
        if (!Number.isFinite(beginTime) || !Number.isFinite(endTime) || beginTime < 0 || endTime <= beginTime)
          return [];
        const startMs = Math.min(maxMs, Math.round(beginTime)),
          endMs = Math.min(maxMs, Math.round(endTime));
        if (endMs <= startMs) return [];
        return [
          {
            startMs: startMs,
            endMs: endMs,
            sourceText: String(sentence.text || '').trim(),
            ...(sentence.speaker_id != null ? { speaker: String(sentence.speaker_id) } : {}),
          },
        ];
      }),
    )
    .sort((left, right) => left.startMs - right.startMs);
}
function requireHttps(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password)
    throw new Error('百炼接口需要有效的 HTTPS 地址');
  return url;
}
export async function transcribeBailianAudio({
  audio,
  filename = 'speech.mp3',
  credentials = {},
  durationSec = 0,
  fetchImpl = globalThis.fetch,
  throwIfCancelled = () => {},
  onProgress = () => {},
  timeoutMs = 40 * 60 * 1000,
  pollIntervalMs = 2000,
  sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
  now = Date.now,
  includeRaw = false,
} = {}) {
  const apiKey = String(credentials.apiKey || '').trim();
  if (!apiKey) throw new Error('请在设置 > API Key > 阿里云百炼填写 API Key');
  if (!(audio?.size > 0)) throw new Error('待识别音频为空');
  if (durationSec > 12 * 60 * 60 || audio.size > 2 * 1024 ** 3)
    throw new Error('百炼录音识别最多支持 12 小时、2 GB 文件');
  const baseOrigin = requireHttps(credentials.baseUrl || credentials.apiUrl || BAILIAN_ASR_BASE_URL)
      .origin,
    authHeaders = { Authorization: 'Bearer ' + apiKey },
    deadline = now() + timeoutMs,
    ensureAlive = () => {
      throwIfCancelled();
      if (now() >= deadline) throw new Error('百炼语音识别超时，请重试');
    },
    request = async (url, init = {}, readJson = true) => {
      ensureAlive();
      requireHttps(url);
      const controller = new AbortController(),
        timeoutTimer = setTimeout(() => controller.abort(), Math.min(120000, deadline - now())),
        cancelWatcher = setInterval(() => {
          try {
            ensureAlive();
          } catch {
            controller.abort();
          }
        }, 200);
      try {
        const response = await fetchImpl(url, {
          ...init,
          signal: controller.signal,
          redirect: 'error',
        });
        ensureAlive();
        if (!response.ok) {
          if ([401, 403].includes(response.status))
            throw new Error('阿里云百炼 API Key 无效或没有模型访问权限');
          const errorBody =
            typeof response.json === 'function' ? await response.json().catch(() => ({})) : {};
          throw new Error(
            String(
              errorBody?.message || errorBody?.code || '百炼语音请求失败（HTTP ' + response.status + '）',
            ),
          );
        }
        const json = readJson ? await response.json() : null;
        ensureAlive();
        if (json?.code) throw new Error(String(json.message || json.code));
        return json;
      } catch (error) {
        ensureAlive();
        const message =
          error?.name === 'AbortError' ? '百炼语音请求超时，请重试' : String(error?.message || error);
        throw new Error(message.split(apiKey).join('***'));
      } finally {
        clearTimeout(timeoutTimer);
        clearInterval(cancelWatcher);
      }
    };
  onProgress(0.1, 'Uploading audio to Bailian');
  const { data: uploadPolicy } = await request(
      baseOrigin + '/api/v1/uploads?action=getPolicy&model=' + BAILIAN_ASR_MODEL,
      { headers: authHeaders },
    ),
    ossFields = {
      OSSAccessKeyId: 'oss_access_key_id',
      Signature: 'signature',
      policy: 'policy',
      'x-oss-object-acl': 'x_oss_object_acl',
      'x-oss-forbid-overwrite': 'x_oss_forbid_overwrite',
    };
  if (
    !uploadPolicy?.upload_dir ||
    !uploadPolicy.upload_host ||
    Object.values(ossFields).some((field) => uploadPolicy[field] == null)
  )
    throw new Error('百炼未返回有效的上传凭证');
  if (
    !(Number(uploadPolicy.max_file_size_mb) > 0) ||
    audio.size > Number(uploadPolicy.max_file_size_mb) * 1024 ** 2
  )
    throw new Error(
      '音频超过百炼临时上传大小限制（' + (Number(uploadPolicy.max_file_size_mb) || 0) + ' MB）',
    );
  const objectKey = uploadPolicy.upload_dir + '/' + filename,
    uploadForm = new FormData();
  for (const [field, policyKey] of Object.entries(ossFields))
    uploadForm.append(field, String(uploadPolicy[policyKey]));
  (uploadForm.append('key', objectKey),
    uploadForm.append('success_action_status', '200'),
    uploadForm.append('file', audio, filename),
    await request(uploadPolicy.upload_host, { method: 'POST', body: uploadForm }, false),
    onProgress(0.16, 'Submitting Bailian subtitle recognition'));
  let taskPayload = await request(baseOrigin + '/api/v1/services/audio/asr/transcription', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
      'X-DashScope-OssResourceResolve': 'enable',
    },
    body: JSON.stringify({
      model: BAILIAN_ASR_MODEL,
      input: { file_urls: ['oss://' + objectKey] },
      parameters: { channel_id: [0], diarization_enabled: true },
    }),
  });
  const taskId = taskPayload?.output?.task_id;
  if (!taskId) throw new Error('百炼未返回语音识别任务 ID');
  let progress = 0.22;
  while (true) {
    ensureAlive();
    const output = taskPayload?.output || {};
    if (output.task_status === 'SUCCEEDED') {
      const firstResult = output.results?.[0];
      if (firstResult?.subtask_status !== 'SUCCEEDED' || !firstResult.transcription_url)
        throw new Error(
          String(firstResult?.message || firstResult?.code || '百炼音频转写子任务失败')
            .split(apiKey)
            .join('***'),
        );
      const transcription = await request(firstResult.transcription_url);
      return {
        segments: normalizeBailianAsrSegments(transcription, durationSec),
        ...(includeRaw ? { raw: transcription } : {}),
      };
    }
    if (!['PENDING', 'RUNNING'].includes(output.task_status))
      throw new Error(
        String(output.message || output.code || '百炼语音任务失败：' + (output.task_status || 'UNKNOWN'))
          .split(apiKey)
          .join('***'),
      );
    for (let remaining = pollIntervalMs; remaining > 0; remaining -= 200) {
      (await sleep(Math.min(remaining, 200)), ensureAlive());
    }
    ((progress = Math.min(0.52, progress + 0.025)),
      onProgress(progress, 'Recognizing subtitles with Bailian'),
      (taskPayload = await request(
        baseOrigin + '/api/v1/tasks/' + encodeURIComponent(taskId),
        { headers: authHeaders },
      )));
  }
}

import { buildApiUrl } from './apiBase.js';
import { get, post } from './requester.js';
const VOLCENGINE_DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3',
  VOLCENGINE_FILE_POLL_INTERVAL_MS = 0x7d0,
  VOLCENGINE_FILE_POLL_TIMEOUT_MS = 2 * 60 * 0x3e8;
function normalizeBaseUrl(value) {
  return String(value || VOLCENGINE_DEFAULT_BASE_URL)
    .trim()
    .replace(/\/+$/, '');
}
function isVolcengineFileId(item) {
  return /^file-[A-Za-z0-9_-]+/.test(String(item || '').trim());
}
function extensionFromContentType(key, index = 'bin') {
  const result = String(key || '')
      .trim()
      .toLowerCase(),
    data = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/webm': 'webm',
      'video/x-matroska': 'mkv',
    };
  return data[result] || String(index || 'bin').replace(/^\./, '');
}
function guessFileName(options, target, source) {
  try {
    const uRL = new URL(String(options || ''), 'http://local.invalid'),
      list = uRL.pathname.split('/').filter(Boolean).pop() || '';
    if (list && list.includes('.')) return list;
  } catch {}
  const extensionFromContentType2 = extensionFromContentType(source, target === 'video' ? 'mp4' : 'png');
  return 'volcengine-input.' + extensionFromContentType2;
}
function resolveInputFetchUrl(next) {
  const enabled = String(next || '').trim();
  if (!enabled) return '';
  if (/^(?:https?:|data:|blob:)/i.test(enabled)) return enabled;
  if (enabled.startsWith('/')) return buildApiUrl(enabled);
  return buildApiUrl('/' + enabled);
}
function normalizeFileObject(current) {
  const entry = current?.data && typeof current.data === 'object' ? current.data : current;
  return entry && typeof entry === 'object' ? entry : {};
}
async function fetchInputBlob(record) {
  const inputFetchUrl = resolveInputFetchUrl(record);
  if (!inputFetchUrl) throw new Error('火山方舟上传文件地址为空');
  return await get(inputFetchUrl, {
    provider: 'remote',
    buildUrl: false,
    responseType: 'blob',
    timeout: 5 * 60 * 0x3e8,
  });
}
export async function retrieveVolcengineFile(payload, enabled2, timeout = {}) {
  const enabled3 = String(payload || '').trim();
  if (!enabled3) throw new Error('火山方舟文件 ID 为空');
  if (!enabled2) throw new Error('火山方舟 API Key 未配置，无法检索文件');
  const baseUrl = normalizeBaseUrl(timeout.baseUrl) + '/files/' + encodeURIComponent(enabled3),
    get2 = await get('/api/v2/proxy/task?apiUrl=' + encodeURIComponent(baseUrl), {
      headers: { Authorization: 'Bearer ' + enabled2 },
      provider: 'volcengine',
      timeout: timeout.timeout || 0x7530,
    });
  return normalizeFileObject(get2);
}
async function waitForVolcengineFileActive(handle, state, config = {}) {
  let error = normalizeFileObject(handle);
  const enabled4 = String(error.id || '').trim();
  if (!enabled4) throw new Error('火山方舟文件上传未返回 file id');
  const scope = Date.now();
  while (true) {
    const enabled5 = String(error.status || '')
      .trim()
      .toLowerCase();
    if (!enabled5 || enabled5 === 'active') return error;
    if (enabled5 === 'failed') {
      const input = error.error?.message || error.message || '火山方舟文件处理失败';
      throw new Error(input);
    }
    if (Date.now() - scope > (config.timeout || VOLCENGINE_FILE_POLL_TIMEOUT_MS))
      throw new Error('火山方舟文件处理超时，请稍后重试');
    (await new Promise((output) => setTimeout(output, config.interval || VOLCENGINE_FILE_POLL_INTERVAL_MS)),
      (error = await retrieveVolcengineFile(enabled4, state, config)));
  }
}
export async function uploadBlobToVolcengineFile(enabled6, enabled7, timeout2 = {}) {
  if (!enabled6) throw new Error('火山方舟上传文件不能为空');
  if (!enabled7) throw new Error('火山方舟 API Key 未配置，无法上传文件');
  const value2 = String(timeout2.kind || '')
      .trim()
      .toLowerCase(),
    value3 = String(enabled6.type || timeout2.contentType || '').trim(),
    value4 = timeout2.filename || guessFileName(timeout2.sourceUrl, value2, value3 || timeout2.contentType),
    baseUrl2 = normalizeBaseUrl(timeout2.baseUrl) + '/files',
    formData = new FormData();
  (formData.append('purpose', 'user_data'), formData.append('file', enabled6, value4));
  value2 === 'video' &&
    (formData.append('preprocess_configs[video][fps]', String(timeout2.videoFps ?? 0.3)),
    timeout2.model && formData.append('preprocess_configs[video][model]', String(timeout2.model)));
  const post2 = await post('/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(baseUrl2), formData, {
    headers: { Authorization: 'Bearer ' + enabled7 },
    provider: 'volcengine',
    timeout: timeout2.uploadTimeout || 5 * 60 * 0x3e8,
  });
  return await waitForVolcengineFileActive(post2, enabled7, timeout2);
}
export async function uploadInputToVolcengineFile(value5, value6, args = {}) {
  const sourceUrl = String(value5 || '').trim();
  if (!sourceUrl) return '';
  if (isVolcengineFileId(sourceUrl)) return sourceUrl;
  const fetchInputBlob2 = await fetchInputBlob(sourceUrl),
    volcengineFile = await uploadBlobToVolcengineFile(fetchInputBlob2, value6, {
      ...args,
      sourceUrl: sourceUrl,
    }),
    enabled8 = String(volcengineFile.id || '').trim();
  if (!enabled8) throw new Error('火山方舟文件上传未返回 file id');
  return enabled8;
}
export async function uploadInputsToVolcengineFiles(list2, value7, value8 = {}) {
  const list3 = Array.isArray(list2) ? list2.map((item2) => String(item2 || '').trim()).filter(Boolean) : [],
    value9 = new Array(list3.length).fill('');
  for (let value10 = 0; value10 < list3.length; value10 += 1) {
    value9[value10] = await uploadInputToVolcengineFile(list3[value10], value7, value8);
  }
  return value9;
}

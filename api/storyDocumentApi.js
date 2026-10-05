import { post } from './requester.js';

export const STORY_DOCUMENT_FILE_LIMIT = 8 * 1024 * 1024;
export function isStoryDocumentFile(file) {
  return /\.(docx|pdf)$/i.test(file?.name || '');
}
export async function extractStoryDocument(file, { signal } = {}) {
  if (!isStoryDocumentFile(file)) throw new Error('仅支持 DOCX 和 PDF；旧版 DOC 请先另存为 DOCX。');
  if (!file.size || file.size > STORY_DOCUMENT_FILE_LIMIT) throw new Error('DOCX/PDF 必须非空且不超过 8MB。');
  if (signal?.aborted) throw new Error('文档导入已取消。');
  const mime = /\.pdf$/i.test(file.name)
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const result = await post('/api/v2/story-workspace/document/extract', file, {
    provider: 'local',
    headers: { 'Content-Type': mime },
    responseType: 'json',
    retries: 0,
    timeout: 60000,
    signal,
  });
  if (!result || typeof result.text !== 'string' || !result.text.trim())
    throw new Error('后端没有返回可用文字；扫描文档需先进行 OCR。');
  return result;
}

export const STORY_DOCUMENT_EXTRACT_PATH = '/api/v2/story-workspace/document/extract';

export const STORY_DOCUMENT_MAX_FILE_BYTES = 20 * 1024 * 1024;

export const STORY_DOCUMENT_SUPPORTED_EXTENSIONS = Object['freeze'](['txt', 'docx', 'pdf']);

function getFileExtension(value) {
  const item = String(value || '')['trim'](),
    count = item['lastIndexOf']('.');
  return count >= 0 ? item['slice'](count + 1)['toLowerCase']() : '';
}

export function validateStoryDocumentFile(enabled) {
  if (!enabled) return { ok: false, error: '请选择剧本文件。' };
  const fileExtension = getFileExtension(enabled['name']);
  if (fileExtension === 'doc')
    return { ok: false, error: '暂不支持旧版 DOC 文件，请先另存为 DOCX、PDF 或 TXT。' };
  if (!STORY_DOCUMENT_SUPPORTED_EXTENSIONS['includes'](fileExtension))
    return { ok: false, error: '仅支持 TXT、DOCX 和文本型 PDF 文件。' };
  const count2 = Number(enabled['size'] || 0);
  if (count2 <= 0) return { ok: false, error: '剧本文件为空。' };
  if (count2 > STORY_DOCUMENT_MAX_FILE_BYTES) return { ok: false, error: '剧本文件不能超过 20 MB。' };
  return { ok: true, extension: fileExtension };
}

// The backend route takes a bounded raw body and verifies the file magic bytes, so DOCX and
// PDF must be posted as raw bytes with their own content type. Sending multipart form data
// (as this used to) was rejected with 415 for every upload. TXT has no server-side parser, so
// it is decoded locally.
export const STORY_DOCUMENT_MIME_TYPES = Object.freeze({
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
});

function normalizeStoryDocumentResult(response, key, index) {
  const text = typeof response?.['text'] === 'string' ? response['text'] : '';
  if (!text['trim']()) throw new Error('文档解析结果没有可用文本。');
  return {
    ...response,
    text: text,
    characterCount: Number['isFinite'](response?.['characterCount'])
      ? response['characterCount']
      : text['length'],
    extension: String(response?.['extension'] || key),
    warnings: Array['isArray'](response?.['warnings']) ? response['warnings'] : index,
  };
}

export async function extractStoryDocumentText(response2, data = {}) {
  const response3 = validateStoryDocumentFile(response2);
  if (!response3['ok']) throw new Error(response3['error']);
  if (response3['extension'] === 'txt') {
    const text2 = await response2['text']();
    if (!text2['trim']()) throw new Error('文档解析结果没有可用文本。');
    return { text: text2, characterCount: text2['length'], extension: 'txt', warnings: [] };
  }
  const enabled2 = STORY_DOCUMENT_MIME_TYPES[response3['extension']];
  if (!enabled2) throw new Error('仅支持 TXT、DOCX 和文本型 PDF 文件。');
  const post2 = await post(STORY_DOCUMENT_EXTRACT_PATH, response2, {
    provider: 'local',
    headers: { 'Content-Type': enabled2 },
    responseType: 'json',
    retries: 0,
    signal: data['signal'],
    timeout: Number(data['timeout']) || 90000,
  });
  return normalizeStoryDocumentResult(post2, response3['extension'], []);
}

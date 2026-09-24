import { post } from './requester.js';

export const STORY_DOCUMENT_FILE_LIMIT = 8 * 1024 * 1024;
export function isStoryDocumentFile(file) { return /\.(docx|pdf)$/i.test(file?.name || ''); }
export async function extractStoryDocument(file, { signal } = {}) {
  if (!isStoryDocumentFile(file)) throw new Error('仅支持 DOCX 和 PDF；旧版 DOC 请先另存为 DOCX。');
  if (!file.size || file.size > STORY_DOCUMENT_FILE_LIMIT) throw new Error('DOCX/PDF 必须非空且不超过 8MB。');
  if (signal?.aborted) throw new Error('文档导入已取消。');
  const mime = /\.pdf$/i.test(file.name) ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const result = await post('/api/v2/story-workspace/document/extract', file, {
    provider: 'local', headers: { 'Content-Type': mime }, responseType: 'json', retries: 0, timeout: 60000, signal,
  });
  if (!result || typeof result.text !== 'string' || !result.text.trim()) throw new Error('后端没有返回可用文字；扫描文档需先进行 OCR。');
  return result;
}

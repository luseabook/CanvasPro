export const AGENT_EXTERNAL_DOCUMENT_TOOL_ID = 'document.read_file';
export const AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT = 3;
const DOCUMENT_CONTENT_TYPES = Object['freeze']({
  txt: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
});
function normalizeDocumentMessage(value = '') {
  return String(value || '')
    ['replaceAll']('剧本文件', '文档')
    ['replaceAll']('作为剧本读取', '作为文档读取');
}
export function validateAgentDocumentFile(item, handler = null) {
  if (typeof handler !== 'function') return item ? { ok: !![] } : { ok: ![], error: '请选择文档。' };
  const response = handler(item);
  if (response?.['ok'] === !![]) return response;
  return { ...response, ok: ![], error: normalizeDocumentMessage(response?.['error'] || '文档不可读取。') };
}
export function createAgentDocumentSource(truncated = {}, error = null) {
  const displayName = String(truncated['fileName'] || error?.['name'] || 'document')
      ['trim']()
      ['slice'](0, 0xff),
    extension = String(truncated['extension'] || displayName['split']('.')['pop']() || '')
      ['trim']()
      ['toLowerCase']()
      ['slice'](0, 12);
  return {
    sourceKind: 'document',
    displayName: displayName,
    title: displayName,
    contentType: DOCUMENT_CONTENT_TYPES[extension] || 'text/plain',
    extension: extension,
    content: String(truncated['text'] || ''),
    characterCount: Number['isFinite'](Number(truncated['characterCount']))
      ? Number(truncated['characterCount'])
      : String(truncated['text'] || '')['length'],
    ...(Number['isFinite'](Number(truncated['pageCount']))
      ? { pageCount: Number(truncated['pageCount']) }
      : {}),
    warnings: Array['isArray'](truncated['warnings'])
      ? truncated['warnings']
          ['map']((key) => String(key || '')['trim']())
          ['filter'](Boolean)
          ['slice'](0, 8)
      : [],
    truncated: truncated['truncated'] === !![],
  };
}

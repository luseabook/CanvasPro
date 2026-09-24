export const AGENT_EXTERNAL_DOCUMENT_TOOL_ID = 'document.read_file';
export const AGENT_EXTERNAL_DOCUMENT_FILE_LIMIT = 0x3;
const DOCUMENT_CONTENT_TYPES = Object['freeze']({
  txt: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf: 'application/pdf',
});
function normalizeDocumentMessage(_0xfb0a61 = '') {
  return String(_0xfb0a61 || '')
    ['replaceAll']('剧本文件', '文档')
    ['replaceAll']('作为剧本读取', '作为文档读取');
}
export function validateAgentDocumentFile(_0x75cce6, _0x186266 = null) {
  if (typeof _0x186266 !== 'function') return _0x75cce6 ? { ok: !![] } : { ok: ![], error: '请选择文档。' };
  const _0x5b6930 = _0x186266(_0x75cce6);
  if (_0x5b6930?.['ok'] === !![]) return _0x5b6930;
  return { ..._0x5b6930, ok: ![], error: normalizeDocumentMessage(_0x5b6930?.['error'] || '文档不可读取。') };
}
export function createAgentDocumentSource(_0x436696 = {}, _0x9c639e = null) {
  const _0x31ac02 = String(_0x436696['fileName'] || _0x9c639e?.['name'] || 'document')
      ['trim']()
      ['slice'](0x0, 0xff),
    _0x4dcdf3 = String(_0x436696['extension'] || _0x31ac02['split']('.')['pop']() || '')
      ['trim']()
      ['toLowerCase']()
      ['slice'](0x0, 0xc);
  return {
    sourceKind: 'document',
    displayName: _0x31ac02,
    title: _0x31ac02,
    contentType: DOCUMENT_CONTENT_TYPES[_0x4dcdf3] || 'text/plain',
    extension: _0x4dcdf3,
    content: String(_0x436696['text'] || ''),
    characterCount: Number['isFinite'](Number(_0x436696['characterCount']))
      ? Number(_0x436696['characterCount'])
      : String(_0x436696['text'] || '')['length'],
    ...(Number['isFinite'](Number(_0x436696['pageCount']))
      ? { pageCount: Number(_0x436696['pageCount']) }
      : {}),
    warnings: Array['isArray'](_0x436696['warnings'])
      ? _0x436696['warnings']
          ['map']((_0x551da8) => String(_0x551da8 || '')['trim']())
          ['filter'](Boolean)
          ['slice'](0x0, 0x8)
      : [],
    truncated: _0x436696['truncated'] === !![],
  };
}

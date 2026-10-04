function normalizeGeminiPart(text) {
  if (!text || typeof text !== 'object') return null;
  if (typeof text.text === 'string') return { text: text.text };
  const mime_type = text.inline_data || text.inlineData;
  if (
    mime_type &&
    typeof mime_type === 'object' &&
    mime_type.data &&
    (mime_type.mime_type || mime_type.mimeType)
  )
    return { inline_data: { mime_type: mime_type.mime_type || mime_type.mimeType, data: mime_type.data } };
  const file_uri = text.file_data || text.fileData;
  if (file_uri && typeof file_uri === 'object' && file_uri.file_uri && file_uri.mime_type)
    return { file_data: { file_uri: file_uri.file_uri, mime_type: file_uri.mime_type } };
  return null;
}
export function buildGenerateContentBody(list, value) {
  const parts = Array.isArray(list)
      ? list.map(normalizeGeminiPart).filter(Boolean)
      : [{ text: String(list || '') }],
    item = { contents: [{ role: 'user', parts: parts.length > 0 ? parts : [{ text: '' }] }] },
    text2 = value || 'You are a helpful assistant.';
  return (text2 && (item.system_instruction = { parts: [{ text: text2 }] }), item);
}

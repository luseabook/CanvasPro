function normalizeGeminiPart(_0xe4436e) {
  if (!_0xe4436e || typeof _0xe4436e !== 'object') return null;
  if (typeof _0xe4436e.text === 'string') return { text: _0xe4436e.text };
  const _0x33d6d0 = _0xe4436e.inline_data || _0xe4436e.inlineData;
  if (
    _0x33d6d0 &&
    typeof _0x33d6d0 === 'object' &&
    _0x33d6d0.data &&
    (_0x33d6d0.mime_type || _0x33d6d0.mimeType)
  )
    return { inline_data: { mime_type: _0x33d6d0.mime_type || _0x33d6d0.mimeType, data: _0x33d6d0.data } };
  const _0x432b39 = _0xe4436e.file_data || _0xe4436e.fileData;
  if (_0x432b39 && typeof _0x432b39 === 'object' && _0x432b39.file_uri && _0x432b39.mime_type)
    return { file_data: { file_uri: _0x432b39.file_uri, mime_type: _0x432b39.mime_type } };
  return null;
}
export function buildGenerateContentBody(_0x2a1b28, _0x2da483) {
  const _0x24ee0e = Array.isArray(_0x2a1b28)
      ? _0x2a1b28.map(normalizeGeminiPart).filter(Boolean)
      : [{ text: String(_0x2a1b28 || '') }],
    _0x3227ec = { contents: [{ role: 'user', parts: _0x24ee0e.length > 0 ? _0x24ee0e : [{ text: '' }] }] },
    _0x3eb6a9 = _0x2da483 || 'You are a helpful assistant.';
  return (_0x3eb6a9 && (_0x3227ec.system_instruction = { parts: [{ text: _0x3eb6a9 }] }), _0x3227ec);
}

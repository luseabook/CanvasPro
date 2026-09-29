export function getPromptReferenceSignature(_0xf51078 = '') {
  const _0x4ce458 = String(_0xf51078 || '')['match'](/<span\b[^>]*>/gi) || [];
  return _0x4ce458['filter']((_0x2bfba7) => /\bclass=["'][^"']*\bref-pill\b/i['test'](_0x2bfba7))['join'](
    '\x0a',
  );
}

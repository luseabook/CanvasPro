export function getPromptReferenceSignature(value = '') {
  const list = String(value || '')['match'](/<span\b[^>]*>/gi) || [];
  return list['filter']((item) => /\bclass=["'][^"']*\bref-pill\b/i['test'](item))['join']('\x0a');
}

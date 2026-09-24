function normalizeText(_0x135f3a) {
  return String(_0x135f3a ?? '')['trim']();
}
export function readPersonReplacementVideoPromptEditor(_0x331f32) {
  if (!_0x331f32) return '';
  if (_0x331f32['matches']?.('[contenteditable="true"]')) {
    if (typeof _0x331f32['innerText'] === 'string') return _0x331f32['innerText'];
    return String(_0x331f32['innerHTML'] || _0x331f32['textContent'] || '')
      ['replace'](/<br\b[^>]*\/?>/giu, '\x0a')
      ['replace'](/<\/(?:div|p|section|article|blockquote|li)>/giu, '\x0a')
      ['replace'](/<[^>]+>/gu, '')
      ['replace'](/&nbsp;/giu, '\x20')
      ['replace'](/&lt;/giu, '<')
      ['replace'](/&gt;/giu, '>')
      ['replace'](/&quot;/giu, '\x22')
      ['replace'](/&#39;|&apos;/giu, '\x27')
      ['replace'](/&amp;/giu, '&');
  }
  return String(_0x331f32['value'] || '');
}
export function isPersonReplacementVideoFile(_0x242572) {
  const _0x3b200f = normalizeText(_0x242572?.['type'])['toLowerCase']();
  return _0x3b200f['startsWith']('video/') || /\.(?:mkv|mov|mp4|webm)$/iu['test'](_0x242572?.['name'] || '');
}
export function isPersonReplacementImageFile(_0x24f221) {
  const _0x5536b7 = normalizeText(_0x24f221?.['type'])['toLowerCase']();
  return (
    _0x5536b7['startsWith']('image/') || /\.(?:avif|gif|jpe?g|png|webp)$/iu['test'](_0x24f221?.['name'] || '')
  );
}
export function isPersonReplacementAudioFile(_0x582080) {
  const _0x354292 = normalizeText(_0x582080?.['type'])['toLowerCase']();
  return (
    _0x354292['startsWith']('audio/') ||
    /\.(?:aac|flac|m4a|mp3|ogg|opus|wav)$/iu['test'](_0x582080?.['name'] || '')
  );
}

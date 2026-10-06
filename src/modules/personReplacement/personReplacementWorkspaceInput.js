function normalizeText(value) {
  return String(value ?? '').trim();
}
export function readPersonReplacementVideoPromptEditor(el) {
  if (!el) return '';
  if (el.matches?.('[contenteditable="true"]')) {
    if (typeof el.innerText === 'string') return el.innerText;
    return String(el.innerHTML || el.textContent || '')
      .replace(/<br\b[^>]*\/?>/giu, '\n')
      .replace(/<\/(?:div|p|section|article|blockquote|li)>/giu, '\n')
      .replace(/<[^>]+>/gu, '')
      .replace(/&nbsp;/giu, ' ')
      .replace(/&lt;/giu, '<')
      .replace(/&gt;/giu, '>')
      .replace(/&quot;/giu, '"')
      .replace(/&#39;|&apos;/giu, '\'')
      .replace(/&amp;/giu, '&');
  }
  return String(el.value || '');
}
export function isPersonReplacementVideoFile(error) {
  const text = normalizeText(error?.type).toLowerCase();
  return text.startsWith('video/') || /\.(?:mkv|mov|mp4|webm)$/iu.test(error?.name || '');
}
export function isPersonReplacementImageFile(error2) {
  const text2 = normalizeText(error2?.type).toLowerCase();
  return text2.startsWith('image/') || /\.(?:avif|gif|jpe?g|png|webp)$/iu.test(error2?.name || '');
}
export function isPersonReplacementAudioFile(error3) {
  const text3 = normalizeText(error3?.type).toLowerCase();
  return (
    text3.startsWith('audio/') || /\.(?:aac|flac|m4a|mp3|ogg|opus|wav)$/iu.test(error3?.name || '')
  );
}

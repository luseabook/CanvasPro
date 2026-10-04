const REFERENCE_FALLBACK_TYPES = new Set(['text', 'audio']);
function normalizeReferenceFallbackType(value) {
  const list = String(value || '')
    .trim()
    .toLowerCase();
  if (list.includes('text')) return 'text';
  if (list.includes('audio')) return 'audio';
  return REFERENCE_FALLBACK_TYPES.has(list) ? list : '';
}
function normalizeClassName(item) {
  return String(item || '')
    .split(/\s+/)
    .map((item2) => item2.replace(/[^A-Za-z0-9_-]/g, ''))
    .filter(Boolean)
    .join(' ');
}
export function getReferenceFallbackThumbLabel(key) {
  const referenceFallbackType = normalizeReferenceFallbackType(key);
  return referenceFallbackType ? referenceFallbackType.toUpperCase() : '';
}
export function createReferenceFallbackThumbElement(index, result = '') {
  const referenceFallbackType2 = normalizeReferenceFallbackType(index);
  if (!referenceFallbackType2) return null;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const el = document.createElement('span'),
    className = normalizeClassName(result);
  return (
    (el.className = [
      className,
      'ref-thumb-fallback',
      'mention-ref-thumb-fallback',
      'mention-ref-thumb-' + referenceFallbackType2,
      'ref-thumb-fallback-' + referenceFallbackType2,
    ]
      .filter(Boolean)
      .join(' ')),
    (el.textContent = getReferenceFallbackThumbLabel(referenceFallbackType2)),
    el.setAttribute('aria-hidden', 'true'),
    (el.draggable = false),
    (el.contentEditable = 'false'),
    el
  );
}
export function createReferenceFallbackThumbHtml(data, options = 'ref-thumb-media') {
  const referenceFallbackType3 = normalizeReferenceFallbackType(data);
  if (!referenceFallbackType3) return '';
  const className2 = normalizeClassName(options) || 'ref-thumb-media',
    target = [
      className2,
      'ref-thumb-fallback',
      'mention-ref-thumb-fallback',
      'mention-ref-thumb-' + referenceFallbackType3,
      'ref-thumb-fallback-' + referenceFallbackType3,
    ].join(' ');
  return (
    '<div class="' +
    target +
    '" aria-hidden="true">' +
    getReferenceFallbackThumbLabel(referenceFallbackType3) +
    '</div>'
  );
}

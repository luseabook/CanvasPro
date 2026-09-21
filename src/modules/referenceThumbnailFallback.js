const REFERENCE_FALLBACK_TYPES = new Set(['text', 'audio']);
function normalizeReferenceFallbackType(_0x15fd9f) {
  const _0x19a13c = String(_0x15fd9f || '')
    .trim()
    .toLowerCase();
  if (_0x19a13c.includes('text')) return 'text';
  if (_0x19a13c.includes('audio')) return 'audio';
  return REFERENCE_FALLBACK_TYPES.has(_0x19a13c) ? _0x19a13c : '';
}
function normalizeClassName(_0x43fefb) {
  return String(_0x43fefb || '')
    .split(/\s+/)
    .map((_0x681ee1) => _0x681ee1.replace(/[^A-Za-z0-9_-]/g, ''))
    .filter(Boolean)
    .join(' ');
}
export function getReferenceFallbackThumbLabel(_0x11b911) {
  const _0x547951 = normalizeReferenceFallbackType(_0x11b911);
  return _0x547951 ? _0x547951.toUpperCase() : '';
}
export function createReferenceFallbackThumbElement(_0x480a42, _0x77494e = '') {
  const _0x4805b3 = normalizeReferenceFallbackType(_0x480a42);
  if (!_0x4805b3) return null;
  if (typeof document === 'undefined' || typeof document.createElement !== 'function') return null;
  const _0xa95e09 = document.createElement('span'),
    _0x506b4c = normalizeClassName(_0x77494e);
  return (
    (_0xa95e09.className = [
      _0x506b4c,
      'ref-thumb-fallback',
      'mention-ref-thumb-fallback',
      'mention-ref-thumb-' + _0x4805b3,
      'ref-thumb-fallback-' + _0x4805b3,
    ]
      .filter(Boolean)
      .join(' ')),
    (_0xa95e09.textContent = getReferenceFallbackThumbLabel(_0x4805b3)),
    _0xa95e09.setAttribute('aria-hidden', 'true'),
    (_0xa95e09.draggable = false),
    (_0xa95e09.contentEditable = 'false'),
    _0xa95e09
  );
}
export function createReferenceFallbackThumbHtml(_0x3b256a, _0x495dff = 'ref-thumb-media') {
  const _0x431f05 = normalizeReferenceFallbackType(_0x3b256a);
  if (!_0x431f05) return '';
  const _0x31d929 = normalizeClassName(_0x495dff) || 'ref-thumb-media',
    _0x23d3c3 = [
      _0x31d929,
      'ref-thumb-fallback',
      'mention-ref-thumb-fallback',
      'mention-ref-thumb-' + _0x431f05,
      'ref-thumb-fallback-' + _0x431f05,
    ].join(' ');
  return (
    '<div class="' +
    _0x23d3c3 +
    '" aria-hidden="true">' +
    getReferenceFallbackThumbLabel(_0x431f05) +
    '</div>'
  );
}

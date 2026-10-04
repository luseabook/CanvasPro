const GENERATION_ERROR_ICON_MARKUP =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function escapeHtml(item) {
  return String(item ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
export function createGenerationErrorCard({
  errorMessage: errorMessage = '',
  title: title = '生成失败',
  className: className = '',
  documentObject: documentObject = globalThis['document'],
} = {}) {
  const text = normalizeText(title) || '生成失败',
    el = documentObject['createElement']('div');
  el['className'] = ['gen-error-card', normalizeText(className)]['filter'](Boolean)['join']('\x20');
  const el2 = documentObject['createElement']('div');
  ((el2['className'] = 'gen-error-card-icon'), (el2['innerHTML'] = GENERATION_ERROR_ICON_MARKUP));
  const el3 = documentObject['createElement']('span');
  ((el3['className'] = 'gen-error-card-title'), (el3['textContent'] = text));
  const el4 = documentObject['createElement']('span');
  return (
    (el4['className'] = 'gen-error-card-detail'),
    (el4['textContent'] = String(errorMessage || text)),
    el['appendChild'](el2),
    el['appendChild'](el3),
    el['appendChild'](el4),
    el
  );
}
export function renderGenerationErrorCardMarkup({
  errorMessage: errorMessage = '',
  title: title = '生成失败',
  className: className = '',
  role: role = '',
} = {}) {
  const text2 = normalizeText(title) || '生成失败',
    key = String(errorMessage || text2),
    index = ['gen-error-card', normalizeText(className)]['filter'](Boolean)['join']('\x20'),
    text3 = normalizeText(role) ? ' role="' + escapeHtml(role) + '\x22' : '';
  return (
    '<section class="' +
    escapeHtml(index) +
    '\x22' +
    text3 +
    '>\n    <span class="gen-error-card-icon" aria-hidden="true">' +
    GENERATION_ERROR_ICON_MARKUP +
    '</span>\x0a\x20\x20\x20\x20<span\x20class=\x22gen-error-card-title\x22>' +
    escapeHtml(text2) +
    '</span>\x0a\x20\x20\x20\x20<span\x20class=\x22gen-error-card-detail\x22>' +
    escapeHtml(key) +
    '</span>\n  </section>'
  );
}

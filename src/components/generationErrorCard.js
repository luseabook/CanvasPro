const GENERATION_ERROR_ICON_MARKUP =
  '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
function normalizeText(_0x264a51) {
  return String(_0x264a51 ?? '')['trim']();
}
function escapeHtml(_0x405589) {
  return String(_0x405589 ?? '')
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
  const _0x212872 = normalizeText(title) || '生成失败',
    _0x4d7fd8 = documentObject['createElement']('div');
  _0x4d7fd8['className'] = ['gen-error-card', normalizeText(className)]['filter'](Boolean)['join']('\x20');
  const _0x5b9fb1 = documentObject['createElement']('div');
  ((_0x5b9fb1['className'] = 'gen-error-card-icon'), (_0x5b9fb1['innerHTML'] = GENERATION_ERROR_ICON_MARKUP));
  const _0x3d605c = documentObject['createElement']('span');
  ((_0x3d605c['className'] = 'gen-error-card-title'), (_0x3d605c['textContent'] = _0x212872));
  const _0xa10b00 = documentObject['createElement']('span');
  return (
    (_0xa10b00['className'] = 'gen-error-card-detail'),
    (_0xa10b00['textContent'] = String(errorMessage || _0x212872)),
    _0x4d7fd8['appendChild'](_0x5b9fb1),
    _0x4d7fd8['appendChild'](_0x3d605c),
    _0x4d7fd8['appendChild'](_0xa10b00),
    _0x4d7fd8
  );
}
export function renderGenerationErrorCardMarkup({
  errorMessage: errorMessage = '',
  title: title = '生成失败',
  className: className = '',
  role: role = '',
} = {}) {
  const _0x9a89bf = normalizeText(title) || '生成失败',
    _0x58d1f2 = String(errorMessage || _0x9a89bf),
    _0x31f48f = ['gen-error-card', normalizeText(className)]['filter'](Boolean)['join']('\x20'),
    _0x240464 = normalizeText(role) ? ' role="' + escapeHtml(role) + '\x22' : '';
  return (
    '<section class="' +
    escapeHtml(_0x31f48f) +
    '\x22' +
    _0x240464 +
    '>\n    <span class="gen-error-card-icon" aria-hidden="true">' +
    GENERATION_ERROR_ICON_MARKUP +
    '</span>\x0a\x20\x20\x20\x20<span\x20class=\x22gen-error-card-title\x22>' +
    escapeHtml(_0x9a89bf) +
    '</span>\x0a\x20\x20\x20\x20<span\x20class=\x22gen-error-card-detail\x22>' +
    escapeHtml(_0x58d1f2) +
    '</span>\n  </section>'
  );
}

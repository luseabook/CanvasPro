function escapeHtml(_0x74b8d) {
  return String(_0x74b8d ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(_0x3c3fa0) {
  return String(_0x3c3fa0 ?? '')['trim']();
}
function renderDataAttributes(_0x53bde1 = {}) {
  return Object['entries'](_0x53bde1 || {})
    ['map'](([_0x49ad89, _0x387cb6]) => {
      const _0x183183 = normalizeText(_0x49ad89)['toLowerCase']();
      if (!/^data-[a-z][a-z0-9-]*$/u['test'](_0x183183)) return '';
      if (_0x387cb6 === ![] || _0x387cb6 == null) return '';
      if (_0x387cb6 === !![]) return '\x20' + _0x183183;
      return '\x20' + _0x183183 + '=\x22' + escapeHtml(_0x387cb6) + '\x22';
    })
    ['join']('');
}
export function renderWorkspaceEpisodeRail({
  items: items = [],
  selectedId: selectedId = '',
  label: label = '分集',
  ariaLabel: ariaLabel = '分集列表',
  asideData: asideData = {},
  listData: listData = {},
  getButtonData: getButtonData = () => ({}),
} = {}) {
  const _0x1f62c0 = normalizeText(selectedId),
    _0x1212b8 = (Array['isArray'](items) ? items : [])
      ['map']((_0x4cbe25, _0x4db411) => {
        const _0x2a6232 = normalizeText(_0x4cbe25?.['number']) || String(_0x4db411 + 0x1);
        return {
          ..._0x4cbe25,
          id: normalizeText(_0x4cbe25?.['id']),
          number: _0x2a6232,
          title: normalizeText(_0x4cbe25?.['title']) || '第\x20' + _0x2a6232 + '\x20集',
          meta: normalizeText(_0x4cbe25?.['meta']) || '0',
          busy: _0x4cbe25?.['busy'] === !![],
          disabled: _0x4cbe25?.['disabled'] === !![],
        };
      })
      ['filter']((_0x134684) => _0x134684['id']);
  return (
    '<aside\x20class=\x22workspace-episode-rail\x22\x20data-workspace-episode-rail' +
    renderDataAttributes(asideData) +
    '\x20aria-label=\x22' +
    escapeHtml(ariaLabel) +
    '">\n    <header><span>' +
    escapeHtml(label) +
    '</span><strong>' +
    _0x1212b8['length'] +
    '</strong></header>\n    <div class="workspace-episode-rail-list" data-workspace-episode-rail-list' +
    renderDataAttributes(listData) +
    '>\x0a\x20\x20\x20\x20\x20\x20' +
    _0x1212b8['map']((_0x571bf2) => {
      const _0xa4eeec = _0x571bf2['id'] === _0x1f62c0;
      return (
        '<button type="button" class="' +
        (_0xa4eeec ? 'is-active' : '') +
        '" data-workspace-episode-rail-item="' +
        escapeHtml(_0x571bf2['id']) +
        '\x22' +
        renderDataAttributes(getButtonData(_0x571bf2)) +
        ' aria-pressed="' +
        _0xa4eeec +
        '\x22' +
        (_0xa4eeec ? ' aria-current="page"' : '') +
        (_0x571bf2['disabled'] ? ' disabled aria-disabled="true"' : '') +
        ' aria-label="第 ' +
        escapeHtml(_0x571bf2['number']) +
        ' 集：' +
        escapeHtml(_0x571bf2['title']) +
        '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
        escapeHtml(_0x571bf2['number']) +
        '</span>\n          ' +
        (_0x571bf2['busy'] ? '<i class="storyboard-script-loading-spinner" aria-hidden="true"></i>' : '') +
        '\n          <small>' +
        escapeHtml(_0x571bf2['meta']) +
        '</small>\n        </button>'
      );
    })['join']('') +
    '\n    </div>\n  </aside>'
  );
}

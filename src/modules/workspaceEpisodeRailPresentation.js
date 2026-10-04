function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&#39;');
}
function normalizeText(item) {
  return String(item ?? '')['trim']();
}
function renderDataAttributes(options = {}) {
  return Object['entries'](options || {})
    ['map'](([key, index]) => {
      const text = normalizeText(key)['toLowerCase']();
      if (!/^data-[a-z][a-z0-9-]*$/u['test'](text)) return '';
      if (index === ![] || index == null) return '';
      if (index === !![]) return '\x20' + text;
      return '\x20' + text + '=\x22' + escapeHtml(index) + '\x22';
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
  const text2 = normalizeText(selectedId),
    list = (Array['isArray'](items) ? items : [])
      ['map']((busy, result) => {
        const number = normalizeText(busy?.['number']) || String(result + 0x1);
        return {
          ...busy,
          id: normalizeText(busy?.['id']),
          number: number,
          title: normalizeText(busy?.['title']) || '第\x20' + number + '\x20集',
          meta: normalizeText(busy?.['meta']) || '0',
          busy: busy?.['busy'] === !![],
          disabled: busy?.['disabled'] === !![],
        };
      })
      ['filter']((data) => data['id']);
  return (
    '<aside\x20class=\x22workspace-episode-rail\x22\x20data-workspace-episode-rail' +
    renderDataAttributes(asideData) +
    '\x20aria-label=\x22' +
    escapeHtml(ariaLabel) +
    '">\n    <header><span>' +
    escapeHtml(label) +
    '</span><strong>' +
    list['length'] +
    '</strong></header>\n    <div class="workspace-episode-rail-list" data-workspace-episode-rail-list' +
    renderDataAttributes(listData) +
    '>\x0a\x20\x20\x20\x20\x20\x20' +
    list['map']((el) => {
      const target = el['id'] === text2;
      return (
        '<button type="button" class="' +
        (target ? 'is-active' : '') +
        '" data-workspace-episode-rail-item="' +
        escapeHtml(el['id']) +
        '\x22' +
        renderDataAttributes(getButtonData(el)) +
        ' aria-pressed="' +
        target +
        '\x22' +
        (target ? ' aria-current="page"' : '') +
        (el['disabled'] ? ' disabled aria-disabled="true"' : '') +
        ' aria-label="第 ' +
        escapeHtml(el['number']) +
        ' 集：' +
        escapeHtml(el['title']) +
        '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span>' +
        escapeHtml(el['number']) +
        '</span>\n          ' +
        (el['busy'] ? '<i class="storyboard-script-loading-spinner" aria-hidden="true"></i>' : '') +
        '\n          <small>' +
        escapeHtml(el['meta']) +
        '</small>\n        </button>'
      );
    })['join']('') +
    '\n    </div>\n  </aside>'
  );
}

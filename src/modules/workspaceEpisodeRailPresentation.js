function escapeHtml(value) {
  return String(value ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('"', '&quot;')
    ['replaceAll']('\'', '&#39;');
}
function normalizeText(item) {
  return String(item ?? '')['trim']();
}
function renderDataAttributes(options = {}) {
  return Object['entries'](options || {})
    ['map'](([key, index]) => {
      const text = normalizeText(key)['toLowerCase']();
      if (!/^data-[a-z][a-z0-9-]*$/u['test'](text)) return '';
      if (index === false || index == null) return '';
      if (index === true) return ' ' + text;
      return ' ' + text + '="' + escapeHtml(index) + '"';
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
        const number = normalizeText(busy?.['number']) || String(result + 1);
        return {
          ...busy,
          id: normalizeText(busy?.['id']),
          number: number,
          title: normalizeText(busy?.['title']) || '第 ' + number + ' 集',
          meta: normalizeText(busy?.['meta']) || '0',
          busy: busy?.['busy'] === true,
          disabled: busy?.['disabled'] === true,
        };
      })
      ['filter']((data) => data['id']);
  return (
    '<aside class="workspace-episode-rail" data-workspace-episode-rail' +
    renderDataAttributes(asideData) +
    ' aria-label="' +
    escapeHtml(ariaLabel) +
    '">\n    <header><span>' +
    escapeHtml(label) +
    '</span><strong>' +
    list['length'] +
    '</strong></header>\n    <div class="workspace-episode-rail-list" data-workspace-episode-rail-list' +
    renderDataAttributes(listData) +
    '>\n      ' +
    list['map']((el) => {
      const target = el['id'] === text2;
      return (
        '<button type="button" class="' +
        (target ? 'is-active' : '') +
        '" data-workspace-episode-rail-item="' +
        escapeHtml(el['id']) +
        '"' +
        renderDataAttributes(getButtonData(el)) +
        ' aria-pressed="' +
        target +
        '"' +
        (target ? ' aria-current="page"' : '') +
        (el['disabled'] ? ' disabled aria-disabled="true"' : '') +
        ' aria-label="第 ' +
        escapeHtml(el['number']) +
        ' 集：' +
        escapeHtml(el['title']) +
        '">\n          <span>' +
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

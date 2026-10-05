function escapeHtml(value) {
  return String(value ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function clampActiveIndex(item, enabled) {
  if (!enabled) return 0;
  return Math['max'](0, Math['min'](enabled - 1, Math['trunc'](Number(item) || 0)));
}
export function renderWorkspaceMediaHistoryMenu({
  title: title = '媒体结果',
  results: results = [],
  activeIndex: activeIndex = 0,
  countLabel: countLabel = '',
  menuLabel: menuLabel = '',
  minimumItemCount: minimumItemCount = 2,
  getItemLabel: getItemLabel = (key, index) => '版本 ' + (index + 1),
  getItemStatus: getItemStatus = (result, data, options) => (data === options ? '当前使用' : '点击切换'),
  renderMedia: renderMedia = () => '',
  getItemAttributes: getItemAttributes = () => '',
  renderItemAction: renderItemAction = () => '',
} = {}) {
  const list = Array['isArray'](results)
      ? results['filter']((target) => target && typeof target === 'object')
      : [],
    source = Math['max'](1, Math['trunc'](Number(minimumItemCount) || 2));
  if (list['length'] < source) return '';
  const clampActiveIndex2 = clampActiveIndex(activeIndex, list['length']),
    next = String(title || '媒体结果')['trim'](),
    current = String(countLabel || list['length'] + ' 个版本')['trim'](),
    entry = String(menuLabel || next + '历史结果')['trim'](),
    record = list['map']((payload, handle) => {
      const state = String(getItemLabel(payload, handle) || '版本 ' + (handle + 1))['trim'](),
        config = String(getItemStatus(payload, handle, clampActiveIndex2) || '点击切换')['trim'](),
        renderMedia2 = renderMedia(payload, handle) || '',
        scope = String(getItemAttributes(payload, handle) || '')['trim'](),
        input =
          '<button type="button" class="story-media-history-item story-clip-video-history-item' +
          (handle === clampActiveIndex2 ? ' is-current' : '') +
          '" ' +
          scope +
          ' role="menuitem" aria-current="' +
          (handle === clampActiveIndex2 ? 'true' : 'false') +
          '">\n      <span class="story-media-history-media story-clip-video-history-media">' +
          renderMedia2 +
          '</span>\n      <span><strong>' +
          escapeHtml(state) +
          '</strong><small>' +
          escapeHtml(config) +
          '</small></span>\n    </button>',
        output = String(renderItemAction(payload, handle, clampActiveIndex2) || '')['trim']();
      return output
        ? '<div class="story-media-history-entry' +
            (handle === clampActiveIndex2 ? ' is-current' : '') +
            '">' +
            input +
            output +
            '</div>'
        : input;
    })
      ['reverse']()
      ['join']('');
  return (
    '<div class="story-media-history-heading story-clip-video-history-heading"><strong>' +
    escapeHtml(next) +
    '</strong><span>' +
    escapeHtml(current) +
    '</span></div>\n    <div class="story-media-history-list story-clip-video-history-list" role="menu" aria-label="' +
    escapeHtml(entry) +
    '">' +
    record +
    '</div>'
  );
}
export function createWorkspaceMediaHistoryMenuController({
  menuElement: menuElement,
  windowObject: windowObject = globalThis['window'] || globalThis,
  getMarkup: getMarkup = () => '',
  hideDelayMs: hideDelayMs = 120,
} = {}) {
  let value2 = null,
    enabled2 = 0;
  const clearHideTimer = () => {
      if (!enabled2) return;
      (windowObject?.['clearTimeout']?.(enabled2), (enabled2 = 0));
    },
    position = (el = value2) => {
      if (!el || !menuElement?.['classList']?.['contains']?.('is-visible')) return false;
      const box = el['getBoundingClientRect']?.(),
        box2 = menuElement['getBoundingClientRect']?.();
      if (!box || !box2) return false;
      const value3 = windowObject?.['innerWidth'] || 1024,
        value4 = windowObject?.['innerHeight'] || 768,
        value5 = 10,
        value6 = 10,
        value7 = Math['max'](value5, value3 - box2['width'] - value5),
        value8 = Math['min'](Math['max'](value5, box['left'] + (box['width'] - box2['width']) / 2), value7),
        value9 = box['top'] - box2['height'] - value6,
        value10 = box['bottom'] + value6,
        value11 =
          value9 >= value5
            ? value9
            : Math['min'](value10, Math['max'](value5, value4 - box2['height'] - value5));
      return (
        (menuElement['style']['left'] = Math['round'](value8) + 'px'),
        (menuElement['style']['top'] = Math['round'](value11) + 'px'),
        menuElement['classList']['toggle']('opens-downward', value9 < value5),
        true
      );
    },
    hide = ({ delayed: delayed = false } = {}) => {
      clearHideTimer();
      if (delayed) {
        enabled2 =
          windowObject?.['setTimeout']?.(
            () => {
              ((enabled2 = 0), hide());
            },
            Math['max'](0, Number(hideDelayMs) || 0),
          ) || 0;
        return;
      }
      ((value2 = null),
        menuElement?.['classList']?.['remove']?.('is-visible', 'opens-downward'),
        menuElement?.['setAttribute']?.('aria-hidden', 'true'));
    },
    show = (enabled3, value12 = {}) => {
      if (!menuElement || !enabled3 || value12?.['event']?.['pointerType'] === 'touch') return false;
      const markup = getMarkup(enabled3, value12);
      if (!markup) return (hide(), false);
      return (
        clearHideTimer(),
        (value2 = enabled3),
        (menuElement['innerHTML'] = markup),
        menuElement['classList']['add']('is-visible'),
        menuElement['setAttribute']('aria-hidden', 'false'),
        position(enabled3),
        true
      );
    },
    refresh = ({
      anchor: anchor = value2,
      context: context = {},
      focusSelector: focusSelector = '',
      fallbackFocus: fallbackFocus = null,
    } = {}) => {
      const value13 = menuElement?.['querySelector']?.('.story-media-history-list'),
        value14 = Number(value13?.['scrollLeft']) || 0,
        value15 = Number(value13?.['scrollTop']) || 0,
        value16 = menuElement?.['ownerDocument']?.['activeElement'],
        value17 = Boolean(value16 && menuElement?.['contains']?.(value16));
      if (!show(anchor, context)) {
        if (value17) fallbackFocus?.['focus']?.();
        return false;
      }
      const run = () => {
        if (value2 !== anchor || !menuElement?.['classList']?.['contains']?.('is-visible')) return;
        const value18 = menuElement?.['querySelector']?.('.story-media-history-list');
        (value18 &&
          ((value18['scrollLeft'] = Math['max'](0, value14)),
          (value18['scrollTop'] = Math['max'](0, value15))),
          value17 && focusSelector && menuElement?.['querySelector']?.(focusSelector)?.['focus']?.());
      };
      return (run(), windowObject?.['requestAnimationFrame']?.(run), true);
    },
    value19 = () => clearHideTimer(),
    value20 = () => hide({ delayed: true }),
    value21 = (event) => {
      const el2 = event['target']?.['closest']?.('.story-media-history-list, .story-clip-video-history-list');
      if (!el2 || !menuElement?.['contains']?.(el2)) return false;
      const count = Math['max'](0, Number(el2['scrollWidth']) - Number(el2['clientWidth']));
      if (!(count > 0)) return false;
      const value22 = Number(event['deltaX']) || 0,
        value23 = Number(event['deltaY']) || 0,
        enabled4 = Math['abs'](value22) > Math['abs'](value23) ? value22 : value23;
      if (!enabled4) return false;
      const value24 = Math['max'](0, Number(el2['scrollLeft']) || 0),
        value25 = Math['max'](0, Math['min'](count, value24 + enabled4));
      if (value25 === value24) return false;
      return (event['preventDefault']?.(), event['stopPropagation']?.(), (el2['scrollLeft'] = value25), true);
    };
  return (
    menuElement?.['addEventListener']?.('pointerenter', value19),
    menuElement?.['addEventListener']?.('pointerleave', value20),
    menuElement?.['addEventListener']?.('wheel', value21, { passive: false }),
    Object['freeze']({
      show: show,
      refresh: refresh,
      hide: hide,
      position: position,
      clearHideTimer: clearHideTimer,
      getAnchor: () => value2,
      destroy() {
        (clearHideTimer(),
          hide(),
          menuElement?.['removeEventListener']?.('pointerenter', value19),
          menuElement?.['removeEventListener']?.('pointerleave', value20),
          menuElement?.['removeEventListener']?.('wheel', value21));
      },
    })
  );
}

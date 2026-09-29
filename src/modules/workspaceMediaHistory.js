function escapeHtml(_0x225836) {
  return String(_0x225836 ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function clampActiveIndex(_0x1bdf3d, _0x3f4167) {
  if (!_0x3f4167) return 0x0;
  return Math['max'](0x0, Math['min'](_0x3f4167 - 0x1, Math['trunc'](Number(_0x1bdf3d) || 0x0)));
}
export function renderWorkspaceMediaHistoryMenu({
  title: title = '媒体结果',
  results: results = [],
  activeIndex: activeIndex = 0x0,
  countLabel: countLabel = '',
  menuLabel: menuLabel = '',
  minimumItemCount: minimumItemCount = 0x2,
  getItemLabel: getItemLabel = (_0x5dd073, _0x302146) => '版本\x20' + (_0x302146 + 0x1),
  getItemStatus: getItemStatus = (_0x378c13, _0x109b62, _0x2f565d) =>
    _0x109b62 === _0x2f565d ? '当前使用' : '点击切换',
  renderMedia: renderMedia = () => '',
  getItemAttributes: getItemAttributes = () => '',
  renderItemAction: renderItemAction = () => '',
} = {}) {
  const _0x31c329 = Array['isArray'](results)
      ? results['filter']((_0x4469a0) => _0x4469a0 && typeof _0x4469a0 === 'object')
      : [],
    _0x4a3481 = Math['max'](0x1, Math['trunc'](Number(minimumItemCount) || 0x2));
  if (_0x31c329['length'] < _0x4a3481) return '';
  const _0x541b0a = clampActiveIndex(activeIndex, _0x31c329['length']),
    _0x511021 = String(title || '媒体结果')['trim'](),
    _0x52f46a = String(countLabel || _0x31c329['length'] + ' 个版本')['trim'](),
    _0x2529ca = String(menuLabel || _0x511021 + '历史结果')['trim'](),
    _0x2beee2 = _0x31c329['map']((_0x5b8db7, _0x3aaf8d) => {
      const _0x14cf6f = String(getItemLabel(_0x5b8db7, _0x3aaf8d) || '版本 ' + (_0x3aaf8d + 0x1))['trim'](),
        _0x235f4f = String(getItemStatus(_0x5b8db7, _0x3aaf8d, _0x541b0a) || '点击切换')['trim'](),
        _0x177885 = renderMedia(_0x5b8db7, _0x3aaf8d) || '',
        _0x57ad50 = String(getItemAttributes(_0x5b8db7, _0x3aaf8d) || '')['trim'](),
        _0x54286a =
          '<button type="button" class="story-media-history-item story-clip-video-history-item' +
          (_0x3aaf8d === _0x541b0a ? ' is-current' : '') +
          '\x22\x20' +
          _0x57ad50 +
          ' role="menuitem" aria-current="' +
          (_0x3aaf8d === _0x541b0a ? 'true' : 'false') +
          '">\n      <span class="story-media-history-media story-clip-video-history-media">' +
          _0x177885 +
          '</span>\x0a\x20\x20\x20\x20\x20\x20<span><strong>' +
          escapeHtml(_0x14cf6f) +
          '</strong><small>' +
          escapeHtml(_0x235f4f) +
          '</small></span>\n    </button>',
        _0x3a7779 = String(renderItemAction(_0x5b8db7, _0x3aaf8d, _0x541b0a) || '')['trim']();
      return _0x3a7779
        ? '<div class="story-media-history-entry' +
            (_0x3aaf8d === _0x541b0a ? '\x20is-current' : '') +
            '\x22>' +
            _0x54286a +
            _0x3a7779 +
            '</div>'
        : _0x54286a;
    })
      ['reverse']()
      ['join']('');
  return (
    '<div class="story-media-history-heading story-clip-video-history-heading"><strong>' +
    escapeHtml(_0x511021) +
    '</strong><span>' +
    escapeHtml(_0x52f46a) +
    '</span></div>\n    <div class="story-media-history-list story-clip-video-history-list" role="menu" aria-label="' +
    escapeHtml(_0x2529ca) +
    '\x22>' +
    _0x2beee2 +
    '</div>'
  );
}
export function createWorkspaceMediaHistoryMenuController({
  menuElement: _0x4674ac,
  windowObject: windowObject = globalThis['window'] || globalThis,
  getMarkup: getMarkup = () => '',
  hideDelayMs: hideDelayMs = 0x78,
} = {}) {
  let _0x5c948f = null,
    _0x2b1b92 = 0x0;
  const _0x231840 = () => {
      if (!_0x2b1b92) return;
      (windowObject?.['clearTimeout']?.(_0x2b1b92), (_0x2b1b92 = 0x0));
    },
    _0xbe4406 = (_0x165b9a = _0x5c948f) => {
      if (!_0x165b9a || !_0x4674ac?.['classList']?.['contains']?.('is-visible')) return ![];
      const _0x57affe = _0x165b9a['getBoundingClientRect']?.(),
        _0x36810c = _0x4674ac['getBoundingClientRect']?.();
      if (!_0x57affe || !_0x36810c) return ![];
      const _0x517e9c = windowObject?.['innerWidth'] || 0x400,
        _0x110025 = windowObject?.['innerHeight'] || 0x300,
        _0x457ead = 0xa,
        _0x1492bd = 0xa,
        _0x4650b9 = Math['max'](_0x457ead, _0x517e9c - _0x36810c['width'] - _0x457ead),
        _0x3cc0f6 = Math['min'](
          Math['max'](_0x457ead, _0x57affe['left'] + (_0x57affe['width'] - _0x36810c['width']) / 0x2),
          _0x4650b9,
        ),
        _0x18f683 = _0x57affe['top'] - _0x36810c['height'] - _0x1492bd,
        _0x5e8907 = _0x57affe['bottom'] + _0x1492bd,
        _0x294038 =
          _0x18f683 >= _0x457ead
            ? _0x18f683
            : Math['min'](_0x5e8907, Math['max'](_0x457ead, _0x110025 - _0x36810c['height'] - _0x457ead));
      return (
        (_0x4674ac['style']['left'] = Math['round'](_0x3cc0f6) + 'px'),
        (_0x4674ac['style']['top'] = Math['round'](_0x294038) + 'px'),
        _0x4674ac['classList']['toggle']('opens-downward', _0x18f683 < _0x457ead),
        !![]
      );
    },
    _0x141114 = ({ delayed: delayed = ![] } = {}) => {
      _0x231840();
      if (delayed) {
        _0x2b1b92 =
          windowObject?.['setTimeout']?.(
            () => {
              ((_0x2b1b92 = 0x0), _0x141114());
            },
            Math['max'](0x0, Number(hideDelayMs) || 0x0),
          ) || 0x0;
        return;
      }
      ((_0x5c948f = null),
        _0x4674ac?.['classList']?.['remove']?.('is-visible', 'opens-downward'),
        _0x4674ac?.['setAttribute']?.('aria-hidden', 'true'));
    },
    _0x4caa21 = (_0x388d26, _0x307b9b = {}) => {
      if (!_0x4674ac || !_0x388d26 || _0x307b9b?.['event']?.['pointerType'] === 'touch') return ![];
      const _0x721ebc = getMarkup(_0x388d26, _0x307b9b);
      if (!_0x721ebc) return (_0x141114(), ![]);
      return (
        _0x231840(),
        (_0x5c948f = _0x388d26),
        (_0x4674ac['innerHTML'] = _0x721ebc),
        _0x4674ac['classList']['add']('is-visible'),
        _0x4674ac['setAttribute']('aria-hidden', 'false'),
        _0xbe4406(_0x388d26),
        !![]
      );
    },
    _0x4ded83 = ({
      anchor: anchor = _0x5c948f,
      context: context = {},
      focusSelector: focusSelector = '',
      fallbackFocus: fallbackFocus = null,
    } = {}) => {
      const _0x3e6fc0 = _0x4674ac?.['querySelector']?.('.story-media-history-list'),
        _0x4223af = Number(_0x3e6fc0?.['scrollLeft']) || 0x0,
        _0x535931 = Number(_0x3e6fc0?.['scrollTop']) || 0x0,
        _0x3421ef = _0x4674ac?.['ownerDocument']?.['activeElement'],
        _0x46a83a = Boolean(_0x3421ef && _0x4674ac?.['contains']?.(_0x3421ef));
      if (!_0x4caa21(anchor, context)) {
        if (_0x46a83a) fallbackFocus?.['focus']?.();
        return ![];
      }
      const _0x27a9a2 = () => {
        if (_0x5c948f !== anchor || !_0x4674ac?.['classList']?.['contains']?.('is-visible')) return;
        const _0x328d99 = _0x4674ac?.['querySelector']?.('.story-media-history-list');
        (_0x328d99 &&
          ((_0x328d99['scrollLeft'] = Math['max'](0x0, _0x4223af)),
          (_0x328d99['scrollTop'] = Math['max'](0x0, _0x535931))),
          _0x46a83a && focusSelector && _0x4674ac?.['querySelector']?.(focusSelector)?.['focus']?.());
      };
      return (_0x27a9a2(), windowObject?.['requestAnimationFrame']?.(_0x27a9a2), !![]);
    },
    _0x18babf = () => _0x231840(),
    _0x25ec7f = () => _0x141114({ delayed: !![] }),
    _0x327fa4 = (_0x30d949) => {
      const _0x170f47 = _0x30d949['target']?.['closest']?.(
        '.story-media-history-list, .story-clip-video-history-list',
      );
      if (!_0x170f47 || !_0x4674ac?.['contains']?.(_0x170f47)) return ![];
      const _0x217615 = Math['max'](0x0, Number(_0x170f47['scrollWidth']) - Number(_0x170f47['clientWidth']));
      if (!(_0x217615 > 0x0)) return ![];
      const _0x314aa0 = Number(_0x30d949['deltaX']) || 0x0,
        _0x36df39 = Number(_0x30d949['deltaY']) || 0x0,
        _0x22cdaf = Math['abs'](_0x314aa0) > Math['abs'](_0x36df39) ? _0x314aa0 : _0x36df39;
      if (!_0x22cdaf) return ![];
      const _0x3804c1 = Math['max'](0x0, Number(_0x170f47['scrollLeft']) || 0x0),
        _0x296da8 = Math['max'](0x0, Math['min'](_0x217615, _0x3804c1 + _0x22cdaf));
      if (_0x296da8 === _0x3804c1) return ![];
      return (
        _0x30d949['preventDefault']?.(),
        _0x30d949['stopPropagation']?.(),
        (_0x170f47['scrollLeft'] = _0x296da8),
        !![]
      );
    };
  return (
    _0x4674ac?.['addEventListener']?.('pointerenter', _0x18babf),
    _0x4674ac?.['addEventListener']?.('pointerleave', _0x25ec7f),
    _0x4674ac?.['addEventListener']?.('wheel', _0x327fa4, { passive: ![] }),
    Object['freeze']({
      show: _0x4caa21,
      refresh: _0x4ded83,
      hide: _0x141114,
      position: _0xbe4406,
      clearHideTimer: _0x231840,
      getAnchor: () => _0x5c948f,
      destroy() {
        (_0x231840(),
          _0x141114(),
          _0x4674ac?.['removeEventListener']?.('pointerenter', _0x18babf),
          _0x4674ac?.['removeEventListener']?.('pointerleave', _0x25ec7f),
          _0x4674ac?.['removeEventListener']?.('wheel', _0x327fa4));
      },
    })
  );
}

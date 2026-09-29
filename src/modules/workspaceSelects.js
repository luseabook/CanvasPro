import { createWorkspaceMenuController } from './workspaceMenuController.js';
import { MATERIAL_TREE_CHEVRON_ICON_SVG } from '../components/sharedIconMarkup.js';
export function bindWorkspaceSelects(_0x41fd6c) {
  const _0x301c70 = _0x41fd6c['ownerDocument'],
    _0x3a53b7 = _0x301c70['defaultView'],
    _0x3174c3 = [..._0x41fd6c['querySelectorAll']('select')]['map']((_0x220819) => {
      const _0x4ae6a6 =
          _0x220819['getAttribute']('aria-label') ||
          [...(_0x220819['labels']?.[0x0]?.['childNodes'] || [])]
            ['filter']((_0x37010f) => _0x37010f['nodeType'] === 0x3)
            ['map']((_0x7c5dac) => _0x7c5dac['textContent'])
            ['join']('')
            ['trim'](),
        _0x1bd4c5 = _0x301c70['createElement']('span');
      _0x1bd4c5['className'] = 'story-replication-select';
      const _0x42fd29 = _0x301c70['createElement']('button');
      ((_0x42fd29['type'] = 'button'),
        (_0x42fd29['className'] = 'story-replication-select-trigger'),
        _0x42fd29['setAttribute']('aria-label', _0x4ae6a6),
        _0x42fd29['setAttribute']('aria-haspopup', 'listbox'),
        _0x42fd29['setAttribute']('aria-expanded', 'false'));
      const _0x8200aa = _0x301c70['createElement']('span'),
        _0x854f7 = _0x301c70['createElement']('span');
      ((_0x854f7['innerHTML'] = MATERIAL_TREE_CHEVRON_ICON_SVG),
        _0x854f7['setAttribute']('aria-hidden', 'true'),
        _0x42fd29['append'](_0x8200aa, _0x854f7));
      const _0x3667fc = _0x301c70['createElement']('span');
      ((_0x3667fc['className'] = 'story-replication-select-menu'),
        _0x3667fc['setAttribute']('popover', 'manual'),
        _0x3667fc['setAttribute']('role', 'listbox'),
        _0x3667fc['setAttribute']('aria-label', _0x4ae6a6),
        _0x3667fc['setAttribute']('aria-hidden', 'true'),
        (_0x3667fc['id'] = 'replication-select-' + _0x3a53b7['crypto']['randomUUID']()),
        _0x42fd29['setAttribute']('aria-controls', _0x3667fc['id']));
      for (const _0x1072c8 of _0x220819['options']) {
        const _0x133057 = _0x301c70['createElement']('button');
        ((_0x133057['type'] = 'button'),
          (_0x133057['className'] = 'story-replication-select-option'),
          _0x133057['setAttribute']('role', 'option'),
          (_0x133057['dataset']['value'] = _0x1072c8['value']),
          (_0x133057['textContent'] = _0x1072c8['textContent']));
        if (_0x1072c8['dataset']['thumbnailUrl']) {
          const _0x1a664d = _0x301c70['createElement']('img');
          ((_0x1a664d['className'] = 'workspace-select-character-thumbnail'),
            (_0x1a664d['src'] = _0x1072c8['dataset']['thumbnailUrl']),
            (_0x1a664d['alt'] = ''),
            (_0x1a664d['loading'] = 'lazy'),
            _0x1a664d['addEventListener']('error', () => _0x1a664d['remove'](), { once: !![] }),
            _0x133057['classList']['add']('has-character-thumbnail'),
            _0x133057['append'](_0x1a664d));
        }
        ((_0x133057['disabled'] = _0x1072c8['disabled']),
          (_0x133057['tabIndex'] = -0x1),
          _0x3667fc['append'](_0x133057));
      }
      const _0x74a608 = _0x220819['hidden'];
      return (
        _0x220819['before'](_0x1bd4c5),
        (_0x220819['hidden'] = !![]),
        _0x1bd4c5['append'](_0x220819, _0x42fd29, _0x3667fc),
        {
          select: _0x220819,
          root: _0x1bd4c5,
          trigger: _0x42fd29,
          text: _0x8200aa,
          menu: _0x3667fc,
          hidden: _0x74a608,
        }
      );
    }),
    _0x3f994c = createWorkspaceMenuController({
      root: _0x41fd6c,
      wrapperSelector: '.story-replication-select',
      triggerSelector: '.story-replication-select-trigger',
      menuSelector: '.story-replication-select-menu',
      optionSelector: '.story-replication-select-option',
    });
  let _0x2ce25f = null,
    _0x56309b = 0x0;
  function _0x274354(_0x40bff1 = ![]) {
    const _0x23e66a = _0x2ce25f;
    ((_0x2ce25f = null),
      _0x3a53b7['cancelAnimationFrame'](_0x56309b),
      _0x3f994c['close'](),
      _0x23e66a?.['menu']['hidePopover'](),
      _0x301c70['removeEventListener']('pointerdown', _0x14d1fc, !![]));
    if (_0x40bff1 && _0x23e66a?.['trigger']['isConnected'])
      _0x23e66a['trigger']['focus']({ preventScroll: !![] });
  }
  function _0x14d1fc(_0x46338c) {
    if (!_0x2ce25f?.['root']['contains'](_0x46338c['target'])) _0x274354();
  }
  function _0x4e532c() {
    for (const _0x356ec8 of _0x3174c3) {
      const { select: _0x15eb2b, trigger: _0x20a200, text: _0xe8685f, menu: _0x45560d } = _0x356ec8;
      ((_0x20a200['disabled'] = _0x15eb2b['matches'](':disabled')),
        (_0xe8685f['textContent'] = _0x15eb2b['selectedOptions'][0x0]?.['textContent'] || '请选择'),
        (_0x20a200['title'] = _0xe8685f['textContent']));
      for (const _0x1d2ff7 of _0x45560d['children'])
        _0x1d2ff7['setAttribute'](
          'aria-selected',
          String(_0x1d2ff7['dataset']['value'] === _0x15eb2b['value']),
        );
      if (_0x2ce25f === _0x356ec8 && _0x20a200['disabled']) _0x274354();
    }
  }
  function _0x3599d6() {
    if (!_0x2ce25f) return;
    const { trigger: _0x5ccff9, menu: _0x32ce82 } = _0x2ce25f;
    if (!_0x5ccff9['isConnected'] || !_0x5ccff9['checkVisibility']() || _0x5ccff9['matches'](':disabled')) {
      _0x274354();
      return;
    }
    const _0x518a1b = _0x5ccff9['getBoundingClientRect'](),
      _0x2e086c = Math['min'](Math['max'](_0x518a1b['width'], 0xa0), _0x3a53b7['innerWidth'] - 0x18),
      _0x47553f = _0x3a53b7['innerHeight'] - _0x518a1b['bottom'] - 0x10,
      _0x2cb997 = _0x518a1b['top'] - 0x10,
      _0x94461d = _0x47553f < 0xa0 && _0x2cb997 > _0x47553f;
    ((_0x32ce82['style']['width'] = _0x2e086c + 'px'),
      (_0x32ce82['style']['left'] =
        Math['max'](0xc, Math['min'](_0x518a1b['left'], _0x3a53b7['innerWidth'] - _0x2e086c - 0xc)) + 'px'),
      (_0x32ce82['style']['maxHeight'] =
        Math['max'](0x28, Math['min'](0x118, _0x94461d ? _0x2cb997 : _0x47553f)) + 'px'),
      (_0x32ce82['style']['top'] = _0x94461d ? 'auto' : _0x518a1b['bottom'] + 0x4 + 'px'),
      (_0x32ce82['style']['bottom'] = _0x94461d
        ? _0x3a53b7['innerHeight'] - _0x518a1b['top'] + 0x4 + 'px'
        : 'auto'),
      (_0x56309b = _0x3a53b7['requestAnimationFrame'](_0x3599d6)));
  }
  function _0xc94914(_0x3e56d1) {
    (_0x274354(), _0x4e532c());
    if (!_0x3f994c['open'](_0x3e56d1['root'], _0x3e56d1['trigger'])) return ![];
    return (
      (_0x2ce25f = _0x3e56d1),
      _0x3e56d1['menu']['showPopover'](),
      _0x3599d6(),
      _0x301c70['addEventListener']('pointerdown', _0x14d1fc, !![]),
      !![]
    );
  }
  function _0x35944d(_0x4829a5) {
    const _0x475348 = _0x3174c3['find']((_0x1c3505) => _0x1c3505['root']['contains'](_0x4829a5['target']));
    if (!_0x475348 || _0x475348['select']['matches'](':disabled')) return;
    if (_0x4829a5['target']['closest']('.story-replication-select-trigger')) {
      if (_0x2ce25f === _0x475348) _0x274354(!![]);
      else {
        if (_0xc94914(_0x475348)) {
          const _0x3e0c42 =
            _0x475348['menu']['querySelector']('[aria-selected=\x22true\x22]:not(:disabled)') ||
            _0x475348['menu']['querySelector']('button:not(:disabled)');
          (_0x3e0c42?.['focus']({ preventScroll: !![] }),
            _0x3e0c42?.['scrollIntoView']({ block: 'nearest' }));
        }
      }
    }
    const _0x4e69c1 = _0x4829a5['target']['closest']('.story-replication-select-option');
    if (!_0x4e69c1 || _0x4e69c1['disabled']) return;
    ((_0x475348['select']['value'] = _0x4e69c1['dataset']['value']),
      _0x4e532c(),
      _0x274354(!![]),
      _0x475348['select']['dispatchEvent'](new _0x3a53b7['Event']('change', { bubbles: !![] })));
  }
  function _0x36b354(_0x21f107) {
    const _0x33c8c9 = _0x3174c3['find']((_0x48b0ce) => _0x48b0ce['root']['contains'](_0x21f107['target']));
    if (!_0x33c8c9 || _0x33c8c9['select']['matches'](':disabled')) return;
    if (
      _0x21f107['target'] === _0x33c8c9['trigger'] &&
      ['ArrowDown', 'ArrowUp']['includes'](_0x21f107['key']) &&
      _0x2ce25f !== _0x33c8c9
    ) {
      if (!_0xc94914(_0x33c8c9)) return;
    }
    if (_0x21f107['key'] === 'Tab' && _0x2ce25f) {
      _0x274354(!![]);
      return;
    }
    if (_0x3f994c['handleKeyDown'](_0x21f107)) {
      if (!_0x33c8c9['root']['classList']['contains']('is-open')) _0x274354();
      else {
        if (_0x33c8c9['menu']['contains'](_0x301c70['activeElement']))
          _0x301c70['activeElement']['scrollIntoView']({ block: 'nearest' });
      }
    }
  }
  return (
    _0x41fd6c['addEventListener']('click', _0x35944d),
    _0x41fd6c['addEventListener']('keydown', _0x36b354),
    _0x41fd6c['addEventListener']('change', _0x4e532c),
    _0x4e532c(),
    {
      sync: _0x4e532c,
      close: _0x274354,
      destroy() {
        (_0x274354(),
          _0x41fd6c['removeEventListener']('click', _0x35944d),
          _0x41fd6c['removeEventListener']('keydown', _0x36b354),
          _0x41fd6c['removeEventListener']('change', _0x4e532c));
        for (const { select: _0x11fceb, root: _0x5effd8, hidden: _0x3f60f5 } of _0x3174c3) {
          (_0x5effd8['before'](_0x11fceb), (_0x11fceb['hidden'] = _0x3f60f5), _0x5effd8['remove']());
        }
      },
    }
  );
}

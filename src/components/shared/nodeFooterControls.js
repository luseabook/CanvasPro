import { RH_AI_APP_PERSISTENT_ADVANCED_CLASS } from './rhAiAppNodeBehavior.js';
function isPersistentAdvancedPanel(_0x497066) {
  return _0x497066?.['classList']?.['contains']?.(RH_AI_APP_PERSISTENT_ADVANCED_CLASS);
}
function hidePopup(_0x44da7c) {
  if (!_0x44da7c) return;
  if (_0x44da7c['classList']?.['contains']('floating-menu')) {
    _0x44da7c['classList']['remove']('show');
    return;
  }
  if (
    _0x44da7c['classList']?.['contains']('rh-adv-panel') ||
    _0x44da7c['classList']?.['contains']('rh-vram-adv-panel')
  ) {
    if (isPersistentAdvancedPanel(_0x44da7c)) {
      (_0x44da7c['classList']['add']('show'), (_0x44da7c['style']['display'] = ''));
      return;
    }
    (_0x44da7c['classList']['remove']('show'), (_0x44da7c['style']['display'] = ''));
    return;
  }
  _0x44da7c['style']['display'] = 'none';
}
function showPopup(_0x3f9bce, _0x10e385 = 'block') {
  if (!_0x3f9bce) return;
  if (_0x3f9bce['classList']?.['contains']('floating-menu')) {
    _0x3f9bce['classList']['add']('show');
    return;
  }
  _0x3f9bce['style']['display'] = _0x10e385;
}
function syncAdvancedButtonState(_0x106911, _0x18c4e1, _0x166b39) {
  _0x106911['querySelectorAll'](_0x18c4e1)['forEach']((_0x1059e6) => {
    const _0x422c9c =
        _0x1059e6['closest']?.(
          '.prompt-panel-footer, .aigen-image-model-selector, .aigen-video-model-selector',
        ) || _0x106911,
      _0x3c8deb = _0x422c9c['querySelector']?.(_0x166b39) || _0x106911['querySelector']?.(_0x166b39);
    _0x1059e6['setAttribute']?.(
      'aria-expanded',
      String(_0x3c8deb?.['classList']?.['contains']?.('show') === !![]),
    );
  });
}
export function syncNodeFooterAdvancedButtonState(_0xce38d8) {
  if (!_0xce38d8) return;
  (syncAdvancedButtonState(_0xce38d8, '.rh-adv-btn', '.rh-adv-panel'),
    syncAdvancedButtonState(_0xce38d8, '.rh-adv2-btn', '.rh-vram-adv-panel'));
}
export function positionNodeAdvancedPanel(_0x539a56) {
  if (!_0x539a56?.['classList']?.['contains']('show') || isPersistentAdvancedPanel(_0x539a56)) return;
  const _0x59701b = _0x539a56['offsetParent'];
  if (!_0x59701b?.['getBoundingClientRect']) return;
  ((_0x539a56['style']['top'] = ''),
    (_0x539a56['style']['bottom'] = ''),
    (_0x539a56['style']['maxHeight'] = ''));
  const _0x3f01f7 = _0x59701b['getBoundingClientRect'](),
    _0x48b2cb = _0x539a56['getBoundingClientRect'](),
    _0x34933d = _0x3f01f7['height'] / _0x59701b['offsetHeight'] || 0x1,
    _0x44f08d = Math['max'](0x0, window['innerHeight'] - _0x3f01f7['bottom'] - 0x10),
    _0x524047 = Math['max'](0x0, _0x3f01f7['top'] - 0x10),
    _0x3a8b7f = _0x48b2cb['bottom'] > window['innerHeight'] - 0xc && _0x524047 > _0x44f08d;
  _0x3a8b7f &&
    ((_0x539a56['style']['top'] = 'auto'), (_0x539a56['style']['bottom'] = 'calc(100%\x20+\x208px)'));
  const _0x877758 = parseFloat(getComputedStyle(_0x539a56)['maxHeight']) || Infinity;
  _0x539a56['style']['maxHeight'] =
    Math['max'](0x0, Math['min'](_0x877758, (_0x3a8b7f ? _0x524047 : _0x44f08d) / _0x34933d)) + 'px';
}
export function closeNodeFooterMenus(_0x4b8cb, _0x5a0915 = null, _0x459409 = {}) {
  if (!_0x4b8cb) return;
  const _0x359de1 = _0x459409?.['preserveAdvPanel'] || null;
  (_0x4b8cb['querySelectorAll'](
    '.node-model-menu, .img-model-menu, .floating-menu.show, .ui-schema-floating-menu.show',
  )['forEach']((_0x3335bb) => {
    if (_0x3335bb !== _0x5a0915) _0x3335bb['classList']['remove']('show');
  }),
    _0x4b8cb['querySelectorAll'](
      '.node-menu-submenu, .node-model-submenu, .ui-schema-popup, .img-ratio-popup, .rh-res-popup, .vid-duration-pop',
    )['forEach']((_0x9ebf76) => {
      if (_0x9ebf76 !== _0x5a0915) hidePopup(_0x9ebf76);
    }),
    _0x4b8cb['querySelectorAll']('.rh-adv-panel, .rh-vram-adv-panel')['forEach']((_0x5ae7d1) => {
      if (_0x5ae7d1 === _0x5a0915) return;
      if (_0x359de1 && _0x5ae7d1['contains'](_0x359de1)) return;
      hidePopup(_0x5ae7d1);
    }),
    syncNodeFooterAdvancedButtonState(_0x4b8cb));
}
export function positionNodeSubmenu(_0x49fce0, _0x105eec) {
  if (!_0x49fce0 || !_0x105eec) return;
  (showPopup(_0x105eec, 'flex'),
    (_0x105eec['style']['top'] = '0px'),
    (_0x105eec['style']['maxHeight'] = ''),
    (_0x105eec['style']['overflowY'] = ''));
  const _0x1b0862 = _0x49fce0['closest']('.node-model-menu, .img-model-menu');
  if (!_0x1b0862) return;
  const _0x7cb1a6 = _0x49fce0['offsetTop'] || 0x0,
    _0x2c0291 =
      Number(globalThis['window']?.['innerHeight']) ||
      Number(globalThis['document']?.['documentElement']?.['clientHeight']) ||
      0x0,
    _0x115158 = 0xc,
    _0x3e1a73 =
      _0x105eec['offsetHeight'] ||
      _0x105eec['getBoundingClientRect']?.()['height'] ||
      _0x105eec['scrollHeight'] ||
      0x0,
    _0x2265b0 = _0x1b0862['getBoundingClientRect']?.() || { top: 0x0 },
    _0x3a15b0 = _0x49fce0['getBoundingClientRect']?.() || null,
    _0x217cbc =
      _0x1b0862['clientHeight'] || _0x2265b0['height'] || _0x105eec['parentElement']?.['clientHeight'] || 0x0,
    _0x58f82c =
      _0x2c0291 > _0x115158 * 0x2 && _0x3e1a73 > 0x0
        ? Math['min'](_0x3e1a73, _0x2c0291 - _0x115158 * 0x2)
        : _0x3e1a73,
    _0x51dbea = _0x105eec['dataset']?.['nodeSubmenuPlacement'];
  if (_0x51dbea === 'viewport-left' || _0x51dbea === 'viewport-auto' || _0x51dbea === 'viewport-auto-up') {
    const _0x3b1ada =
        _0x105eec['offsetWidth'] ||
        _0x105eec['getBoundingClientRect']?.()['width'] ||
        _0x2265b0['width'] ||
        0xf0,
      _0x38e483 =
        Number(globalThis['window']?.['innerWidth']) ||
        Number(globalThis['document']?.['documentElement']?.['clientWidth']) ||
        0x0,
      _0x30fcc3 = Math['max'](_0x115158, _0x2c0291 - _0x115158 - _0x58f82c),
      _0x3a9cf3 = Number(_0x2265b0['top']) || 0x0,
      _0x3fe33e = Number(_0x2265b0['bottom']) || _0x3a9cf3 + _0x217cbc,
      _0x5c4e44 =
        _0x51dbea === 'viewport-auto-up'
          ? _0x3fe33e - _0x58f82c
          : Number(_0x3a15b0?.['top']) || _0x3a9cf3 + _0x7cb1a6,
      _0x2219c2 = Math['min'](Math['max'](_0x5c4e44, _0x115158), _0x30fcc3),
      _0x38af1b = Math['max'](_0x115158, _0x38e483 - _0x115158 - _0x3b1ada),
      _0x50ff9a = Number(_0x2265b0['left']) || 0x0,
      _0x3a7154 = Number(_0x2265b0['width']) || 0x0,
      _0xe69266 = Number(_0x2265b0['right']) || _0x50ff9a + _0x3a7154,
      _0x162303 =
        Number['parseFloat'](globalThis['window']?.['getComputedStyle']?.(_0x1b0862)?.['borderRightWidth']) ||
        0x0,
      _0x2c2de9 = _0x50ff9a - _0x3b1ada - 0x6,
      _0x572be4 = _0xe69266 - _0x162303 + 0x6;
    let _0x530ffc = _0x2c2de9;
    if (_0x51dbea === 'viewport-auto' || _0x51dbea === 'viewport-auto-up') {
      const _0x53e527 = _0x572be4 + _0x3b1ada <= _0x38e483 - _0x115158,
        _0x5da74b = _0x2c2de9 >= _0x115158;
      if (_0x53e527 || !_0x5da74b) _0x530ffc = _0x572be4;
    }
    ((_0x530ffc = Math['max'](_0x115158, Math['min'](_0x530ffc, _0x38af1b))),
      (_0x105eec['style']['position'] = 'fixed'),
      (_0x105eec['style']['right'] = 'auto'),
      (_0x105eec['style']['left'] = _0x530ffc + 'px'),
      (_0x105eec['style']['top'] = _0x2219c2 + 'px'));
    _0x3e1a73 > _0x58f82c &&
      ((_0x105eec['style']['maxHeight'] = Math['floor'](_0x58f82c) + 'px'),
      (_0x105eec['style']['overflowY'] = 'auto'));
    return;
  }
  const _0x2e55a2 = Math['max'](0x0, _0x217cbc - _0x58f82c);
  let _0x59251f = Math['min'](_0x7cb1a6, _0x2e55a2);
  if (_0x2c0291 > _0x115158 * 0x2 && _0x58f82c > 0x0) {
    const _0x1b4d60 = _0x2c0291 - _0x115158 - _0x58f82c,
      _0x1d3e86 = Math['min'](Math['max'](_0x2265b0['top'] + _0x59251f, _0x115158), _0x1b4d60);
    ((_0x59251f = _0x1d3e86 - _0x2265b0['top']),
      _0x3e1a73 > _0x58f82c &&
        ((_0x105eec['style']['maxHeight'] = Math['floor'](_0x58f82c) + 'px'),
        (_0x105eec['style']['overflowY'] = 'auto')));
  }
  _0x105eec['style']['top'] = Math['round'](_0x59251f) + 'px';
}
export function createFloatingModelMenuPortal({
  menu: _0x198cdd,
  trigger: _0x54f89a,
  host: _0x3d2e40,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  portalClass: portalClass = 'floating-model-menu-portal',
  submenuPlacement: submenuPlacement = 'viewport-auto',
} = {}) {
  if (!_0x198cdd || !_0x54f89a || !_0x3d2e40?.['appendChild'])
    return {
      isOpen: () => _0x198cdd?.['classList']?.['contains']?.('show') === !![],
      open() {
        (_0x198cdd?.['classList']?.['add']?.('show'), _0x54f89a?.['setAttribute']?.('aria-expanded', 'true'));
      },
      close() {
        (_0x198cdd?.['classList']?.['remove']?.('show'),
          _0x54f89a?.['setAttribute']?.('aria-expanded', 'false'));
      },
      contains: (_0x3a7f3a) => _0x198cdd?.['contains']?.(_0x3a7f3a) === !![],
      destroy() {},
    };
  const _0x5f24f9 = [
      'position',
      'left',
      'top',
      'right',
      'bottom',
      'animation',
      'transform',
      'max-height',
      'overflow-x',
      'overflow-y',
      'overscroll-behavior',
    ],
    _0x24f3fa = ['max-height', 'overflow-x', 'overflow-y', 'overscroll-behavior'],
    _0x4dd90c = new Map(
      _0x5f24f9['map']((_0x4a3161) => [
        _0x4a3161,
        _0x198cdd['style']?.['getPropertyValue']?.(_0x4a3161) || '',
      ]),
    ),
    _0x33ac42 = new Map();
  let _0x180731 = null,
    _0x25d421 = null,
    _0x565a30 = ![];
  const _0x25d9cb = (_0x38da60) => {
      const _0x18f54c = _0x4dd90c['get'](_0x38da60);
      if (_0x18f54c) _0x198cdd['style']?.['setProperty']?.(_0x38da60, _0x18f54c);
      else _0x198cdd['style']?.['removeProperty']?.(_0x38da60);
    },
    _0x4b87e9 = () => {
      _0x24f3fa['forEach'](_0x25d9cb);
    },
    _0xad8df4 = () => {
      _0x198cdd['querySelectorAll']?.('.node-model-submenu')['forEach']((_0x53f3f4) => {
        (!_0x33ac42['has'](_0x53f3f4) &&
          _0x33ac42['set'](_0x53f3f4, _0x53f3f4['dataset']?.['nodeSubmenuPlacement']),
          _0x53f3f4['dataset'] && (_0x53f3f4['dataset']['nodeSubmenuPlacement'] = submenuPlacement));
      });
    },
    _0xe96157 = () => {
      (_0x33ac42['forEach']((_0x13af37, _0x56ea44) => {
        if (!_0x56ea44?.['dataset']) return;
        if (_0x13af37 === undefined) delete _0x56ea44['dataset']['nodeSubmenuPlacement'];
        else _0x56ea44['dataset']['nodeSubmenuPlacement'] = _0x13af37;
        ['position', 'left', 'top', 'right', 'max-height', 'overflow-y']['forEach']((_0x3e71bb) =>
          _0x56ea44['style']?.['removeProperty']?.(_0x3e71bb),
        );
      }),
        _0x33ac42['clear']());
    },
    _0x46409f = () => {
      if (!_0x565a30 || !_0x198cdd['classList']['contains']('show')) return;
      _0x4b87e9();
      const _0x360812 = _0x54f89a['getBoundingClientRect']?.(),
        _0x5dc9b9 = _0x198cdd['getBoundingClientRect']?.();
      if (!_0x360812 || !_0x5dc9b9) return;
      const _0x1678a4 =
          Number(windowObject?.['innerWidth']) ||
          Number(documentObject?.['documentElement']?.['clientWidth']) ||
          0x0,
        _0xb7faf2 =
          Number(windowObject?.['innerHeight']) ||
          Number(documentObject?.['documentElement']?.['clientHeight']) ||
          0x0,
        _0x315b6a = _0x3d2e40['getBoundingClientRect']?.() || {
          top: 0x0,
          left: 0x0,
          right: _0x1678a4,
          bottom: _0xb7faf2,
        },
        _0x32c79c = 0xc,
        _0x17815d = 0xc,
        _0x37f930 = Math['max'](_0x32c79c, (Number(_0x315b6a['left']) || 0x0) + _0x32c79c),
        _0x312c4c = Math['max'](_0x32c79c, (Number(_0x315b6a['top']) || 0x0) + _0x32c79c),
        _0x42654a = Math['min'](_0x1678a4 - _0x32c79c, Number(_0x315b6a['right']) || _0x1678a4 - _0x32c79c),
        _0x2f2ef3 = Math['min'](_0xb7faf2 - _0x32c79c, Number(_0x315b6a['bottom']) || _0xb7faf2 - _0x32c79c),
        _0x45b1ca = Math['max'](0x0, _0x2f2ef3 - _0x312c4c),
        _0x14f33d = Math['min'](_0x5dc9b9['height'], _0x45b1ca);
      _0x5dc9b9['height'] > _0x45b1ca &&
        (_0x198cdd['style']?.['setProperty']?.('max-height', Math['floor'](_0x45b1ca) + 'px'),
        _0x198cdd['style']?.['setProperty']?.('overflow-x', 'hidden'),
        _0x198cdd['style']?.['setProperty']?.('overflow-y', 'auto'),
        _0x198cdd['style']?.['setProperty']?.('overscroll-behavior', 'contain'));
      const _0x3ec8ab = Math['max'](_0x37f930, _0x42654a - _0x5dc9b9['width']),
        _0x2ff305 = Math['max'](_0x312c4c, _0x2f2ef3 - _0x14f33d),
        _0xde1ef6 = Math['min'](Math['max'](_0x360812['left'], _0x37f930), _0x3ec8ab),
        _0x5bdff7 = _0x360812['top'] - _0x17815d - _0x14f33d,
        _0x562273 = _0x360812['bottom'] + _0x17815d,
        _0x2c54a5 =
          _0x5bdff7 >= _0x312c4c
            ? Math['min'](_0x5bdff7, _0x2ff305)
            : Math['min'](Math['max'](_0x562273, _0x312c4c), _0x2ff305);
      (_0x198cdd['style']?.['setProperty']?.('position', 'fixed'),
        _0x198cdd['style']?.['setProperty']?.('left', _0xde1ef6 + 'px'),
        _0x198cdd['style']?.['setProperty']?.('top', _0x2c54a5 + 'px'),
        _0x198cdd['style']?.['setProperty']?.('right', 'auto'),
        _0x198cdd['style']?.['setProperty']?.('bottom', 'auto'));
    },
    _0x2cd8d8 = () => {
      if (!_0x565a30) return;
      _0xe96157();
      if (portalClass) _0x198cdd['classList']['remove'](portalClass);
      _0x5f24f9['forEach'](_0x25d9cb);
      if (_0x180731?.['isConnected']) {
        const _0x421869 = _0x25d421?.['parentNode'] === _0x180731 ? _0x25d421 : null;
        _0x180731['insertBefore'](_0x198cdd, _0x421869);
      }
      ((_0x180731 = null), (_0x25d421 = null), (_0x565a30 = ![]));
    },
    _0x36e9b0 = () => {
      (closeNodeFooterMenus(_0x198cdd),
        _0x198cdd['classList']['remove']('show'),
        _0x54f89a['setAttribute']?.('aria-expanded', 'false'),
        _0x2cd8d8());
    },
    _0x5785b7 = () => {
      if (!_0x565a30) {
        ((_0x180731 = _0x198cdd['parentNode']),
          (_0x25d421 = _0x198cdd['nextSibling']),
          _0x3d2e40['appendChild'](_0x198cdd));
        if (portalClass) _0x198cdd['classList']['add'](portalClass);
        _0x565a30 = !![];
      }
      (_0x198cdd['style']?.['setProperty']?.('animation', 'none'),
        _0x198cdd['style']?.['setProperty']?.('transform', 'none'),
        _0xad8df4(),
        _0x198cdd['classList']['add']('show'),
        _0x54f89a['setAttribute']?.('aria-expanded', 'true'),
        _0x46409f());
    };
  return (
    documentObject?.['addEventListener']?.('scroll', _0x46409f, !![]),
    windowObject?.['addEventListener']?.('resize', _0x46409f),
    {
      isOpen: () => _0x198cdd['classList']['contains']('show'),
      open: _0x5785b7,
      close: _0x36e9b0,
      contains: (_0x1f4b15) => _0x198cdd['contains']?.(_0x1f4b15) === !![],
      destroy() {
        (_0x36e9b0(),
          documentObject?.['removeEventListener']?.('scroll', _0x46409f, !![]),
          windowObject?.['removeEventListener']?.('resize', _0x46409f));
      },
    }
  );
}
export function createFloatingUiSchemaPopupPortal({
  selector: _0x52b6c1,
  host: _0x2f3124,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis['window'],
  placement: placement = 'inline',
  portalClass: portalClass = 'aigen-ui-schema-popup-portal',
  horizontalAlign: horizontalAlign = 'center',
  contextClass: contextClass = '',
} = {}) {
  if (!_0x52b6c1 || placement !== 'portal-auto-up' || !_0x2f3124?.['appendChild'])
    return { close() {}, contains: () => ![], destroy() {} };
  const _0x213ab2 = [
      'animation',
      'transition',
      'position',
      'left',
      'top',
      'right',
      'bottom',
      'transform',
      'min-width',
      'max-height',
      'overflow-x',
      'overflow-y',
    ],
    _0x4ea3b1 = ['click', 'mousedown', 'input', 'change'],
    _0x4792c3 = 0xc,
    _0x34ea49 = 0x8;
  let _0x18ee38 = null,
    _0x1e7c27 = 0x0;
  const _0x2872e5 = () => {
      if (!_0x1e7c27) return;
      (windowObject?.['cancelAnimationFrame']?.(_0x1e7c27), (_0x1e7c27 = 0x0));
    },
    _0x4a7cde = () => {
      const _0x235c84 =
          Number(windowObject?.['innerWidth']) ||
          Number(documentObject?.['documentElement']?.['clientWidth']) ||
          0x0,
        _0x340937 =
          Number(windowObject?.['innerHeight']) ||
          Number(documentObject?.['documentElement']?.['clientHeight']) ||
          0x0,
        _0xb44c9d = _0x2f3124['getBoundingClientRect']?.() || {
          top: 0x0,
          left: 0x0,
          right: _0x235c84,
          bottom: _0x340937,
        };
      return {
        left: Math['max'](_0x4792c3, (Number(_0xb44c9d['left']) || 0x0) + _0x4792c3),
        top: Math['max'](_0x4792c3, (Number(_0xb44c9d['top']) || 0x0) + _0x4792c3),
        right: Math['min'](_0x235c84 - _0x4792c3, Number(_0xb44c9d['right']) || _0x235c84 - _0x4792c3),
        bottom: Math['min'](_0x340937 - _0x4792c3, Number(_0xb44c9d['bottom']) || _0x340937 - _0x4792c3),
      };
    },
    _0x42adc1 = () => {
      _0x1e7c27 = 0x0;
      const _0x526d15 = _0x18ee38?.['popup'],
        _0x52fff2 = _0x18ee38?.['trigger'] || _0x18ee38?.['fieldEl'];
      if (!_0x526d15?.['isConnected'] || !_0x52fff2?.['isConnected']) return;
      const _0x3b038d = _0x52fff2['getBoundingClientRect']?.();
      if (!_0x3b038d) return;
      const _0x2f3b6e = _0x4a7cde(),
        _0x113326 =
          Number(_0x3b038d['width']) ||
          Math['max'](0x0, (Number(_0x3b038d['right']) || 0x0) - (Number(_0x3b038d['left']) || 0x0));
      if (_0x18ee38?.['preservesAnchorWidth'] && _0x113326 > 0x0) {
        const _0x538ce2 = Math['max'](0x0, _0x2f3b6e['right'] - _0x2f3b6e['left']),
          _0xb92fb7 = Math['min'](Math['ceil'](_0x113326), Math['floor'](_0x538ce2));
        _0xb92fb7 > 0x0 && _0x526d15['style']?.['setProperty']?.('min-width', _0xb92fb7 + 'px');
      }
      const _0x284c45 = _0x526d15['getBoundingClientRect']?.();
      if (!_0x284c45 || _0x284c45['width'] <= 0x0) return;
      const _0xc5bfed = Math['max'](0x50, _0x2f3b6e['bottom'] - _0x2f3b6e['top']),
        _0x3a1af6 = Math['min'](_0x284c45['height'] || _0x526d15['scrollHeight'] || _0xc5bfed, _0xc5bfed),
        _0x3aab2c = _0x18ee38?.['ownerProxy']?.['classList']?.['contains']?.('ui-schema-pill-menu')
          ? 0xc
          : _0x34ea49,
        _0x4441a3 = Math['max'](_0x2f3b6e['left'], _0x2f3b6e['right'] - _0x284c45['width']),
        _0x22b234 =
          horizontalAlign === 'start'
            ? _0x3b038d['left']
            : horizontalAlign === 'end'
              ? _0x3b038d['right'] - _0x284c45['width']
              : _0x3b038d['left'] + (_0x113326 - _0x284c45['width']) / 0x2,
        _0x4e88df = Math['min'](Math['max'](_0x22b234, _0x2f3b6e['left']), _0x4441a3),
        _0x4fc782 = Math['max'](_0x2f3b6e['top'], _0x2f3b6e['bottom'] - _0x3a1af6),
        _0x5d7895 = _0x3b038d['top'] - _0x3aab2c - _0x3a1af6,
        _0x56437d = _0x3b038d['bottom'] + _0x3aab2c,
        _0x2ca102 =
          _0x5d7895 >= _0x2f3b6e['top']
            ? Math['min'](_0x5d7895, _0x4fc782)
            : Math['min'](Math['max'](_0x56437d, _0x2f3b6e['top']), _0x4fc782);
      (_0x526d15['style']?.['setProperty']?.('position', 'fixed'),
        _0x526d15['style']?.['setProperty']?.('left', _0x4e88df + 'px'),
        _0x526d15['style']?.['setProperty']?.('top', _0x2ca102 + 'px'),
        _0x526d15['style']?.['setProperty']?.('right', 'auto'),
        _0x526d15['style']?.['setProperty']?.('bottom', 'auto'),
        _0x526d15['style']?.['setProperty']?.('transform', 'none'),
        _0x526d15['style']?.['setProperty']?.('max-height', Math['floor'](_0xc5bfed) + 'px'),
        _0x526d15['style']?.['setProperty']?.('overflow-x', 'hidden'),
        _0x526d15['style']?.['setProperty']?.('overflow-y', 'auto'));
    },
    _0x2bf531 = () => {
      if (!_0x18ee38) return;
      _0x2872e5();
      const _0x4fd023 =
        windowObject?.['requestAnimationFrame']?.['bind']?.(windowObject) ||
        ((_0x3d7090) => windowObject?.['setTimeout']?.(_0x3d7090, 0x0));
      _0x1e7c27 = _0x4fd023(_0x42adc1);
    },
    _0x12b40a = (_0x276931) => {
      const _0x2f020e = windowObject?.['CustomEvent'] || globalThis['CustomEvent'];
      if (typeof _0x2f020e !== 'function' || !_0x18ee38) return;
      _0x52b6c1['dispatchEvent']?.(
        new _0x2f020e('ui-schema-portaled-interaction', {
          detail: { fieldEl: _0x18ee38['fieldEl'], nativeEvent: _0x276931, popup: _0x18ee38['popup'] },
        }),
      );
    },
    _0x23586d = (_0x64332b) => _0x64332b['stopPropagation'](),
    _0x279000 = () => {
      _0x2872e5();
      if (!_0x18ee38) return;
      const {
        popup: _0x12dc63,
        fieldEl: _0x101939,
        originalParent: _0x18ed1c,
        originalNextSibling: _0x815a0d,
        originalStyles: _0xe27863,
        ownerProxy: _0x5bccc3,
      } = _0x18ee38;
      (_0x4ea3b1['forEach']((_0x442563) => {
        _0x12dc63['removeEventListener']?.(_0x442563, _0x12b40a, !![]);
      }),
        _0x12dc63['removeEventListener']?.('wheel', _0x23586d),
        _0x12dc63['classList']?.['remove']?.(portalClass));
      _0x12dc63['__uiSchemaPortalRoot'] === _0x52b6c1 && delete _0x12dc63['__uiSchemaPortalRoot'];
      _0x101939?.['__uiSchemaPortaledPopup'] === _0x12dc63 && delete _0x101939['__uiSchemaPortaledPopup'];
      _0xe27863['forEach']((_0x32ee05, _0x376053) => {
        if (_0x32ee05) _0x12dc63['style']?.['setProperty']?.(_0x376053, _0x32ee05);
        else _0x12dc63['style']?.['removeProperty']?.(_0x376053);
      });
      if (_0x18ed1c?.['isConnected']) {
        const _0x3d73ca = _0x815a0d?.['parentNode'] === _0x18ed1c ? _0x815a0d : null;
        _0x18ed1c['insertBefore'](_0x12dc63, _0x3d73ca);
      }
      (_0x5bccc3?.['remove']?.(), (_0x18ee38 = null));
    },
    _0x3425be = () => {
      const _0x3755f2 = _0x18ee38?.['popup'],
        _0x1e2359 = _0x18ee38?.['trigger'];
      (_0x3755f2 &&
        (_0x3755f2['classList']?.['remove']?.('show', 'is-closing'),
        _0x3755f2['setAttribute']?.('aria-hidden', 'true'),
        _0x3755f2['classList']?.['contains']?.('floating-menu')
          ? _0x3755f2['style']?.['setProperty']?.('display', '')
          : _0x3755f2['style']?.['setProperty']?.('display', 'none')),
        _0x1e2359?.['setAttribute']?.('aria-expanded', 'false'),
        _0x279000());
    },
    _0x1f2967 = ({ popup: _0x54a7a9, fieldEl: _0x10f60c }) => {
      const _0x4fd10f = _0x10f60c?.['querySelector']?.('[data-ui-schema-menu-trigger]') || _0x10f60c,
        _0x3e8cb8 = _0x54a7a9['parentElement'] || _0x10f60c,
        _0x5c0250 = String(_0x3e8cb8?.['className'] || '')['split'](/\s+/u),
        _0x291570 =
          _0x3e8cb8?.['classList']?.['contains']?.('ui-schema-advanced-dropdown') ||
          _0x5c0250['includes']('ui-schema-advanced-dropdown'),
        _0x5b1bbb = new Map(
          _0x213ab2['map']((_0x3f97d7) => [
            _0x3f97d7,
            _0x54a7a9['style']?.['getPropertyValue']?.(_0x3f97d7) || '',
          ]),
        ),
        _0x3aa77d = documentObject?.['createElement']?.('div') || null;
      (_0x3aa77d &&
        (_0x3aa77d['className'] = [
          String(_0x3e8cb8?.['className'] || '')['trim'](),
          String(_0x10f60c?.['className'] || '')['trim'](),
          'aigen-ui-schema-owner-proxy',
          contextClass,
        ]
          ['filter'](Boolean)
          ['join']('\x20')),
        (_0x18ee38 = {
          popup: _0x54a7a9,
          fieldEl: _0x10f60c,
          trigger: _0x4fd10f,
          originalParent: _0x54a7a9['parentNode'],
          originalNextSibling: _0x54a7a9['nextSibling'],
          originalStyles: _0x5b1bbb,
          ownerProxy: _0x3aa77d,
          preservesAnchorWidth: _0x291570,
        }),
        (_0x10f60c['__uiSchemaPortaledPopup'] = _0x54a7a9),
        (_0x54a7a9['__uiSchemaPortalRoot'] = _0x52b6c1),
        _0x4fd10f?.['setAttribute']?.('aria-expanded', 'true'),
        _0x2f3124['appendChild'](_0x3aa77d || _0x54a7a9),
        _0x3aa77d?.['appendChild']?.(_0x54a7a9),
        _0x54a7a9['classList']?.['add']?.(portalClass),
        _0x54a7a9['style']?.['setProperty']?.('animation', 'none'),
        _0x54a7a9['style']?.['setProperty']?.('transition', 'none'),
        _0x54a7a9['style']?.['setProperty']?.('transform', 'none'),
        _0x4ea3b1['forEach']((_0x3a78d0) => {
          _0x54a7a9['addEventListener']?.(_0x3a78d0, _0x12b40a, !![]);
        }),
        _0x54a7a9['addEventListener']?.('wheel', _0x23586d, { passive: !![] }),
        _0x2bf531());
    },
    _0x3a12b1 = (_0x3841e9) => {
      const _0x57c425 = _0x3841e9?.['detail']?.['popup'] || null,
        _0x5b50ee = _0x3841e9?.['detail']?.['fieldEl'] || null;
      if (!_0x57c425 || !_0x5b50ee) return;
      const _0x1e2a35 = _0x52b6c1['contains']?.(_0x5b50ee) || _0x57c425['__uiSchemaPortalRoot'] === _0x52b6c1;
      if (!_0x1e2a35) return;
      if (!_0x3841e9['detail']?.['shouldOpen']) {
        if (_0x57c425 === _0x18ee38?.['popup']) _0x3425be();
        return;
      }
      if (_0x18ee38?.['popup'] !== _0x57c425) _0x3425be();
      if (!_0x18ee38) _0x1f2967({ popup: _0x57c425, fieldEl: _0x5b50ee });
      _0x2bf531();
    },
    _0xcd2bf4 = (_0x499c55) => {
      if (!_0x18ee38 || _0x499c55?.['detail']?.['popup'] !== _0x18ee38['popup']) return;
      (_0x2872e5(), _0x42adc1());
    },
    _0x4f6306 = (_0x2709dc) => {
      (!_0x2709dc?.['detail']?.['popup'] || _0x2709dc['detail']['popup'] === _0x18ee38?.['popup']) &&
        _0x3425be();
    };
  return (
    _0x52b6c1['addEventListener']?.('ui-schema-menu-before-open', _0x3a12b1),
    _0x52b6c1['addEventListener']?.('ui-schema-menu-after-open', _0xcd2bf4),
    _0x52b6c1['addEventListener']?.('ui-schema-portaled-close-request', _0x4f6306),
    documentObject?.['addEventListener']?.('scroll', _0x2bf531, !![]),
    windowObject?.['addEventListener']?.('resize', _0x2bf531),
    {
      close: _0x3425be,
      contains: (_0x23fd48) => _0x18ee38?.['popup']?.['contains']?.(_0x23fd48) === !![],
      destroy() {
        (_0x3425be(),
          _0x52b6c1['removeEventListener']?.('ui-schema-menu-before-open', _0x3a12b1),
          _0x52b6c1['removeEventListener']?.('ui-schema-menu-after-open', _0xcd2bf4),
          _0x52b6c1['removeEventListener']?.('ui-schema-portaled-close-request', _0x4f6306),
          documentObject?.['removeEventListener']?.('scroll', _0x2bf531, !![]),
          windowObject?.['removeEventListener']?.('resize', _0x2bf531));
      },
    }
  );
}
export function bindNodeModelMenuTrigger({
  root: _0x421322,
  trigger: _0x3f693f,
  menu: _0x4208a5,
  closeOthers: _0x41ce81,
  activateMenuKeyboard: _0x1ca53f,
} = {}) {
  if (!_0x421322 || !_0x3f693f || !_0x4208a5) return () => {};
  const _0x431d65 = (_0x1d173d) => {
    _0x1d173d['stopPropagation']();
    const _0x519ae2 = !_0x4208a5['classList']['contains']('show');
    if (typeof _0x41ce81 === 'function') _0x41ce81(_0x4208a5);
    else closeNodeFooterMenus(_0x421322, _0x4208a5);
    (_0x4208a5['classList']['toggle']('show', _0x519ae2),
      _0x519ae2 && typeof _0x1ca53f === 'function' && _0x1ca53f(_0x4208a5));
  };
  return (
    _0x3f693f['addEventListener']('click', _0x431d65),
    () => _0x3f693f['removeEventListener']('click', _0x431d65)
  );
}
export function bindNodeModelMenuPrewarm({
  trigger: _0x233dcc,
  prepare: _0x2dbab8,
  windowObject: windowObject = globalThis['window'],
} = {}) {
  const _0x11bae3 = () => null;
  if (!_0x233dcc?.['addEventListener'] || typeof _0x2dbab8 !== 'function')
    return { prepareNow: _0x11bae3, schedule: _0x11bae3, destroy: _0x11bae3 };
  let _0x19fde0 = ![],
    _0x515173 = null,
    _0x1d55bb = null;
  const _0x50ef5f = windowObject?.['requestIdleCallback']?.['bind'](windowObject),
    _0x6c8230 = windowObject?.['cancelIdleCallback']?.['bind'](windowObject),
    _0x18b56d = windowObject?.['setTimeout']?.['bind'](windowObject) || globalThis['setTimeout'],
    _0x5f0fe4 = windowObject?.['clearTimeout']?.['bind'](windowObject) || globalThis['clearTimeout'],
    _0x220a55 = () => {
      (_0x515173 !== null && (_0x6c8230?.(_0x515173), (_0x515173 = null)),
        _0x1d55bb !== null && (_0x5f0fe4?.(_0x1d55bb), (_0x1d55bb = null)));
    },
    _0x559d3d = () => {
      ((_0x515173 = null), (_0x1d55bb = null));
      if (_0x19fde0 || _0x233dcc['isConnected'] === ![]) return null;
      return _0x2dbab8();
    },
    _0x43a624 = () => {
      if (_0x19fde0 || _0x515173 !== null || _0x1d55bb !== null) return null;
      return (
        _0x50ef5f
          ? (_0x515173 = _0x50ef5f(_0x559d3d, { timeout: 0x64 }))
          : (_0x1d55bb = _0x18b56d?.(_0x559d3d, 0x0) ?? null),
        null
      );
    },
    _0x1217b4 = () => {
      if (_0x19fde0) return null;
      return (_0x220a55(), _0x2dbab8());
    };
  return (
    _0x233dcc['addEventListener']('pointerenter', _0x43a624),
    _0x233dcc['addEventListener']('focus', _0x43a624),
    _0x233dcc['addEventListener']('pointerdown', _0x1217b4),
    {
      prepareNow: _0x1217b4,
      schedule: _0x43a624,
      destroy() {
        if (_0x19fde0) return;
        ((_0x19fde0 = !![]),
          _0x220a55(),
          _0x233dcc['removeEventListener']?.('pointerenter', _0x43a624),
          _0x233dcc['removeEventListener']?.('focus', _0x43a624),
          _0x233dcc['removeEventListener']?.('pointerdown', _0x1217b4));
      },
    }
  );
}
export function bindNodeSubmenus(_0x1abaa4, { delay: delay = 0x78 } = {}) {
  if (!_0x1abaa4) return () => {};
  const _0x34887c = [],
    _0xfb68f8 = new Map(),
    _0x168b00 = _0x1abaa4['querySelectorAll']('[data-node-menu-submenu]');
  return (
    _0x168b00['forEach']((_0x3bf3e0) => {
      const _0xb11f38 = _0x3bf3e0['dataset']['nodeMenuSubmenu'] || '',
        _0x42b8a5 = _0xb11f38 ? _0x1abaa4['querySelector'](_0xb11f38) : null;
      if (!_0x42b8a5) return;
      const _0x170581 = () => {
          (clearTimeout(_0xfb68f8['get'](_0x42b8a5)), positionNodeSubmenu(_0x3bf3e0, _0x42b8a5));
        },
        _0x38ea87 = () => {
          (clearTimeout(_0xfb68f8['get'](_0x42b8a5)),
            _0xfb68f8['set'](
              _0x42b8a5,
              setTimeout(() => {
                (hidePopup(_0x42b8a5), _0xfb68f8['delete'](_0x42b8a5));
              }, delay),
            ));
        };
      (_0x3bf3e0['addEventListener']('mouseenter', _0x170581),
        _0x3bf3e0['addEventListener']('mouseleave', _0x38ea87),
        _0x3bf3e0['addEventListener']('click', _0x170581),
        _0x42b8a5['addEventListener']('mouseenter', _0x170581),
        _0x42b8a5['addEventListener']('mouseleave', _0x38ea87),
        _0x34887c['push'](() => {
          (clearTimeout(_0xfb68f8['get'](_0x42b8a5)),
            _0x3bf3e0['removeEventListener']('mouseenter', _0x170581),
            _0x3bf3e0['removeEventListener']('mouseleave', _0x38ea87),
            _0x3bf3e0['removeEventListener']('click', _0x170581),
            _0x42b8a5['removeEventListener']('mouseenter', _0x170581),
            _0x42b8a5['removeEventListener']('mouseleave', _0x38ea87));
        }));
    }),
    () => _0x34887c['forEach']((_0x7f9f16) => _0x7f9f16())
  );
}
export function bindNodeFooterController(_0x1872bb, _0x1e85a0 = {}) {
  if (!_0x1872bb) return () => {};
  const _0x1ee0fe = [];
  _0x1ee0fe['push'](bindNodeSubmenus(_0x1872bb));
  const _0x12df4c = (_0x3e85bc) => {
    const _0x50d7f3 = _0x3e85bc?.['detail']?.['fieldEl'] || null;
    closeNodeFooterMenus(_0x1872bb, null, { preserveAdvPanel: _0x50d7f3 });
  };
  (_0x1872bb['addEventListener']('ui-schema-menu-before-open', _0x12df4c),
    _0x1ee0fe['push'](() => _0x1872bb['removeEventListener']('ui-schema-menu-before-open', _0x12df4c)));
  const _0x432157 = (_0x543db9) => {
    const _0x321598 = _0x543db9['target']?.['closest']?.('.ui-schema-floating-menu, .floating-menu');
    _0x321598 && _0x1872bb['contains'](_0x321598) && _0x543db9['stopPropagation']();
  };
  (_0x1872bb['addEventListener']('wheel', _0x432157, { passive: !![] }),
    _0x1ee0fe['push'](() => _0x1872bb['removeEventListener']('wheel', _0x432157)));
  const _0x27cbe0 = (_0x5856c5) => {
    const _0x2332f2 = _0x1872bb['contains'](_0x5856c5['target']);
    if (!_0x2332f2) closeNodeFooterMenus(_0x1872bb);
    (typeof _0x1e85a0['onDocumentClick'] === 'function' &&
      _0x1e85a0['onDocumentClick'](_0x5856c5, { isInsideRoot: _0x2332f2 }),
      !_0x2332f2 && typeof _0x1e85a0['onOutsideClose'] === 'function' && _0x1e85a0['onOutsideClose']());
  };
  return (
    document?.['addEventListener']?.('click', _0x27cbe0),
    _0x1ee0fe['push'](() => document?.['removeEventListener']?.('click', _0x27cbe0)),
    () => _0x1ee0fe['forEach']((_0x483684) => _0x483684())
  );
}

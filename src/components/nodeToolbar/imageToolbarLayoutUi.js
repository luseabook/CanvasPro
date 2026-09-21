import { t } from '../../i18n/index.js';
function imageToolbarText(_0x169383) {
  return t('nodeToolbar.image.' + _0x169383);
}
const IMAGE_TOOLBAR_ZONE_MAP = Object.freeze({
  'outside-primary': 'outsidePrimary',
  'outside-secondary': 'outsideSecondary',
  more: 'more',
});
function getToolbarZones(_0x883b78) {
  return {
    outsidePrimary: _0x883b78.querySelector('[data-zone="outside-primary"]'),
    outsideSecondary: _0x883b78.querySelector('[data-zone="outside-secondary"]'),
    more: _0x883b78.querySelector('[data-zone="more"]'),
  };
}
function collectToolbarActionButtons(_0x42b242, _0x18eb7e) {
  const _0x372a4b = new Map();
  return (
    _0x42b242.querySelectorAll('.ftb-btn').forEach((_0x2382a3) => {
      if (_0x2382a3.dataset.fixedToolbarButton === '1') return;
      const _0x1eedcc = _0x18eb7e(_0x2382a3);
      if (!_0x1eedcc || _0x372a4b.has(_0x1eedcc)) return;
      _0x372a4b.set(_0x1eedcc, _0x2382a3);
    }),
    _0x372a4b
  );
}
function applyToolbarLayoutToDom({
  toolbarEl: _0x3d8f34,
  layoutInput: _0x228b26,
  imageToolbarActions: _0xe2b9ad,
  normalizeImageToolbarLayout: _0x301155,
  getToolbarActionFromButton: _0x25ad2c,
}) {
  const _0x19848f = getToolbarZones(_0x3d8f34);
  if (!_0x19848f.outsidePrimary || !_0x19848f.outsideSecondary || !_0x19848f.more) return;
  const _0x541900 = _0x301155(_0x228b26),
    _0x1ae906 = collectToolbarActionButtons(_0x3d8f34, _0x25ad2c),
    _0xd1c9a = new Set();
  for (const [_0x3b7112, _0x3fd6e3] of Object.entries(_0x541900)) {
    const _0x2ffbab = _0x19848f[_0x3b7112];
    if (!_0x2ffbab) continue;
    _0x3fd6e3.forEach((_0x272561) => {
      const _0x2649dd = _0x1ae906.get(_0x272561);
      if (!_0x2649dd) return;
      (_0x2ffbab.appendChild(_0x2649dd), _0xd1c9a.add(_0x272561));
    });
  }
  for (const _0x14feaa of _0xe2b9ad) {
    if (_0xd1c9a.has(_0x14feaa)) continue;
    const _0x2c0c47 = _0x1ae906.get(_0x14feaa);
    if (!_0x2c0c47) continue;
    _0x19848f.more.appendChild(_0x2c0c47);
  }
  const _0x6df24a = _0x3d8f34.querySelector('.v2-img-toolbar-main-divider');
  if (_0x6df24a) {
    const _0x3a05ae = _0x19848f.outsideSecondary.querySelectorAll('.ftb-btn').length > 0;
    _0x6df24a.hidden = !_0x3a05ae;
  }
}
function readToolbarLayoutFromDom(_0x30db61, _0x4f4e72, _0x62c80e, _0x577776 = null) {
  const _0x49b414 = { outsidePrimary: [], outsideSecondary: [], more: [] },
    _0x3c79a9 = _0x577776 && typeof _0x577776 === 'object' ? Object.entries(_0x577776) : [];
  if (_0x3c79a9.length > 0)
    return (
      _0x3c79a9.forEach(([_0x347e23, _0x582566]) => {
        if (!_0x49b414[_0x347e23] || !_0x582566) return;
        _0x582566.querySelectorAll('.ftb-btn').forEach((_0x35e3ea) => {
          const _0x45f6b1 = _0x4f4e72(_0x35e3ea);
          if (!_0x45f6b1) return;
          _0x49b414[_0x347e23].push(_0x45f6b1);
        });
      }),
      _0x62c80e(_0x49b414)
    );
  return (
    _0x30db61.querySelectorAll('[data-zone]').forEach((_0xa13d4d) => {
      const _0x5dc09f = String(_0xa13d4d.getAttribute('data-zone') || '').trim(),
        _0x403435 = IMAGE_TOOLBAR_ZONE_MAP[_0x5dc09f];
      if (!_0x403435) return;
      _0xa13d4d.querySelectorAll('.ftb-btn').forEach((_0x201be6) => {
        const _0x5bae3c = _0x4f4e72(_0x201be6);
        if (!_0x5bae3c) return;
        _0x49b414[_0x403435].push(_0x5bae3c);
      });
    }),
    _0x62c80e(_0x49b414)
  );
}
export function bindImageToolbarLayoutUi(_0x3a9b27, _0x357a52 = {}) {
  const { store: _0x1ee4ed, getStateSnapshot: _0x4d9b64, getToolbarActionFromButton: _0x55b8a4 } = _0x357a52,
    _0x330581 = _0x357a52.toolbarActions || _0x357a52.imageToolbarActions || [],
    _0x346bbb = _0x357a52.normalizeToolbarLayout || _0x357a52.normalizeImageToolbarLayout,
    _0x237c9f = _0x357a52.serializeToolbarLayout || _0x357a52.serializeImageToolbarLayout,
    _0x4e62f6 =
      typeof _0x357a52.getToolbarLayout === 'function'
        ? _0x357a52.getToolbarLayout
        : (_0x4c637d) => _0x4c637d?.ui?.imageToolbarLayout,
    _0x388153 =
      typeof _0x357a52.setToolbarLayout === 'function'
        ? _0x357a52.setToolbarLayout
        : (_0xdc8f0f) => _0x1ee4ed?.setImageToolbarLayout?.(_0xdc8f0f),
    _0x327e89 = new Set(
      Array.isArray(_0x357a52.moreMenuStickyActions)
        ? _0x357a52.moreMenuStickyActions
        : ['hd', 'auto-subject', 'multigrid'],
    ),
    _0x3c632d = getToolbarZones(_0x3a9b27),
    _0x4b0d93 = _0x3a9b27.querySelector('.act-more-tools'),
    _0xe3f666 = _0x3a9b27.querySelector('[data-role="more-menu"]'),
    _0x241e62 = _0x3a9b27.querySelector('.act-customize-tools');
  if (
    !_0x3c632d.outsidePrimary ||
    !_0x3c632d.outsideSecondary ||
    !_0x3c632d.more ||
    !_0x4b0d93 ||
    !_0xe3f666 ||
    !_0x241e62
  )
    return { closeMoreMenu() {} };
  applyToolbarLayoutToDom({
    toolbarEl: _0x3a9b27,
    layoutInput: _0x4e62f6(_0x4d9b64()),
    imageToolbarActions: _0x330581,
    normalizeImageToolbarLayout: _0x346bbb,
    getToolbarActionFromButton: _0x55b8a4,
  });
  let _0x43eac1 = false,
    _0x4a6308 = false,
    _0x3c3b04 = false,
    _0x3b8ef9 = null,
    _0x7dbbeb = null,
    _0x488139 = null,
    _0x332e8b = 0;
  const _0x2ad755 = _0xe3f666.parentNode,
    _0x236872 = _0xe3f666.nextSibling,
    _0xa934be = () => {
      if (_0x332e8b) cancelAnimationFrame(_0x332e8b);
      ((_0x332e8b = 0), _0xe3f666.classList.remove('is-portaled'), _0xe3f666.removeAttribute('style'));
      if (_0x2ad755 && _0xe3f666.parentNode !== _0x2ad755) {
        const _0x269788 = _0x236872 && _0x236872.parentNode === _0x2ad755 ? _0x236872 : null;
        _0x2ad755.insertBefore(_0xe3f666, _0x269788);
      }
    },
    _0xc6d38e = () => {
      if (!_0x43eac1 || _0xe3f666.hidden || !_0x3a9b27.isConnected) {
        _0xa934be();
        return;
      }
      const _0x87b074 = _0x3a9b27.getBoundingClientRect();
      (_0x87b074.width > 0 &&
        _0x87b074.height > 0 &&
        Object.assign(_0xe3f666.style, {
          left: _0x87b074.left + _0x87b074.width / 2 + 'px',
          top: _0x87b074.top - 10 + 'px',
        }),
        (_0x332e8b = requestAnimationFrame(_0xc6d38e)));
    },
    _0x2475bf = () => {
      _0xe3f666.parentNode !== document.body && document.body.appendChild(_0xe3f666);
      _0xe3f666.classList.add('is-portaled');
      if (_0x332e8b) cancelAnimationFrame(_0x332e8b);
      _0x332e8b = 0;
    },
    _0x5b2e28 = () => {
      const _0x5b6c5d = collectToolbarActionButtons(_0x3a9b27, _0x55b8a4);
      return (
        collectToolbarActionButtons(_0xe3f666, _0x55b8a4).forEach((_0x175e63, _0x1cb466) =>
          _0x5b6c5d.set(_0x1cb466, _0x175e63),
        ),
        _0x5b6c5d
      );
    },
    _0x3e379d = (_0x10b22d, _0x4d2cfa) => {
      _0x10b22d.classList.toggle('is-drop-target', !!_0x4d2cfa);
    },
    _0x5acd90 = (_0x9ac4fb) => {
      if (_0x7dbbeb === _0x9ac4fb) return;
      if (_0x7dbbeb) _0x3e379d(_0x7dbbeb, false);
      _0x7dbbeb = _0x9ac4fb || null;
      if (_0x7dbbeb) _0x3e379d(_0x7dbbeb, true);
    },
    _0x3203f2 = () => {
      (_0x5acd90(null), Object.values(_0x3c632d).forEach((_0x42113e) => _0x3e379d(_0x42113e, false)));
    },
    _0x52a812 = (_0x175f9b) => {
      (_0x3a9b27.classList.toggle('is-toolbar-drag-active', !!_0x175f9b),
        _0xe3f666.classList.toggle('is-toolbar-drag-active', !!_0x175f9b));
    },
    _0x57051c = () =>
      Object.values(_0x3c632d).flatMap((_0x451a39) =>
        Array.from(_0x451a39?.querySelectorAll?.('.ftb-btn') || []).filter((_0x32d292) =>
          _0x55b8a4(_0x32d292),
        ),
      ),
    _0x21fff4 = (_0x55afdb) => {
      const _0xcfdd1d = _0x57051c(),
        _0x32ad2a = new Map(
          _0xcfdd1d.map((_0x27701a) => [_0x27701a, _0x27701a.getBoundingClientRect?.() || {}]),
        ),
        _0x51ff6e = _0x55afdb();
      if (!_0x51ff6e) return false;
      return (
        _0x57051c().forEach((_0x5ea209) => {
          const _0x569c75 = _0x32ad2a.get(_0x5ea209);
          if (!_0x569c75) return;
          const _0x3f01bd = _0x5ea209.getBoundingClientRect?.() || {},
            _0x1bfffa = Number(_0x569c75.left || 0) - Number(_0x3f01bd.left || 0),
            _0x4532e4 = Number(_0x569c75.top || 0) - Number(_0x3f01bd.top || 0);
          if (_0x1bfffa === 0 && _0x4532e4 === 0) return;
          ((_0x5ea209.style.transform = 'translate(' + _0x1bfffa + 'px, ' + _0x4532e4 + 'px)'),
            (_0x5ea209.style.transition = 'none'));
          const _0x26d665 =
            typeof requestAnimationFrame === 'function'
              ? requestAnimationFrame
              : (_0x1d4d13) => setTimeout(_0x1d4d13, 0);
          _0x26d665(() => {
            ((_0x5ea209.style.transform = ''),
              (_0x5ea209.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'));
          });
        }),
        true
      );
    },
    _0x531b1c = () => {
      const _0x1a1d8a = readToolbarLayoutFromDom(_0x3a9b27, _0x55b8a4, _0x346bbb, _0x3c632d),
        _0x176d71 = _0x237c9f(_0x4e62f6(_0x4d9b64())),
        _0x20de55 = _0x237c9f(_0x1a1d8a);
      if (_0x176d71 === _0x20de55) return;
      _0x388153(_0x1a1d8a);
    },
    _0x1d4018 = (_0x4c4710, _0x23524e) => {
      const _0x1734ff = Array.from(_0x4c4710.querySelectorAll('.ftb-btn')).filter(
        (_0x4653dc) => _0x4653dc !== _0x3b8ef9,
      );
      for (const _0x462fdd of _0x1734ff) {
        const _0x40e4a4 = _0x462fdd.getBoundingClientRect(),
          _0x57e0fd = _0x40e4a4.left + _0x40e4a4.width / 2;
        if (_0x23524e < _0x57e0fd) return _0x462fdd;
      }
      return null;
    },
    _0x4c49ab = (_0x44b44c, _0x1e5651) => {
      const _0x157f35 = _0x1e5651.target?.closest?.('.ftb-btn');
      if (_0x157f35 === _0x3b8ef9) return _0x3b8ef9;
      if (_0x157f35 && _0x44b44c.contains(_0x157f35) && _0x55b8a4(_0x157f35)) {
        const _0x595651 = _0x157f35.getBoundingClientRect(),
          _0x54342b = _0x595651.left + _0x595651.width / 2;
        return Number(_0x1e5651.clientX || 0) < _0x54342b ? _0x157f35 : _0x157f35.nextElementSibling;
      }
      return _0x1d4018(_0x44b44c, _0x1e5651.clientX);
    },
    _0x3e5308 = (_0x37c740, _0x573585) => {
      if (!_0x3b8ef9 || !_0x37c740) return false;
      if (_0x573585 === _0x3b8ef9) return false;
      const _0x2fb966 = _0x573585 || null;
      if (_0x3b8ef9.parentNode === _0x37c740) {
        const _0x2b8c74 = _0x3b8ef9.nextElementSibling;
        if (_0x2fb966 && _0x2b8c74 === _0x2fb966) return false;
        if (!_0x2fb966 && _0x3b8ef9 === _0x37c740.lastElementChild) return false;
      }
      return _0x21fff4(() => {
        return (
          _0x2fb966 ? _0x37c740.insertBefore(_0x3b8ef9, _0x2fb966) : _0x37c740.appendChild(_0x3b8ef9),
          true
        );
      });
    },
    _0x1e0bd4 = (_0x1abae8) => {
      ((_0x3c3b04 = !!_0x1abae8), _0x241e62.classList.toggle('is-tooltip-pinned', _0x3c3b04));
    },
    _0x1474e2 = (_0x438258) => {
      ((_0x4a6308 = !!_0x438258),
        _0x3a9b27.classList.toggle('is-toolbar-customizing', _0x4a6308),
        _0xe3f666.classList.toggle('is-toolbar-customizing', _0x4a6308),
        _0x1e0bd4(_0x4a6308),
        (_0x241e62.hidden = false),
        _0x241e62.classList.toggle('is-active', _0x4a6308),
        (_0x241e62.textContent = _0x4a6308 ? imageToolbarText('done') : imageToolbarText('customize')),
        _0x241e62.setAttribute(
          'aria-label',
          _0x4a6308 ? imageToolbarText('doneCustomize') : imageToolbarText('customize'),
        ),
        _0x5b2e28().forEach((_0x425492) => {
          ((_0x425492.draggable = _0x4a6308), _0x425492.classList.toggle('is-toolbar-draggable', _0x4a6308));
        }),
        !_0x4a6308 &&
          ((_0x3b8ef9 = null),
          _0x52a812(false),
          _0x3203f2(),
          _0x5b2e28().forEach((_0x55e403) => {
            (_0x55e403.classList.remove('is-toolbar-dragging'),
              _0x55e403.classList.remove('is-toolbar-dragging-capture'));
          })));
    },
    _0x49e9a1 = () => {
      if (!_0x43eac1) return;
      ((_0x43eac1 = false),
        _0x4a6308 && (_0xa934be(), _0x531b1c()),
        _0x1474e2(false),
        _0x4b0d93.classList.remove('is-active'),
        (_0xe3f666.hidden = true),
        _0xa934be(),
        _0x488139 && (document.removeEventListener('pointerdown', _0x488139, true), (_0x488139 = null)));
    },
    _0x2a5c81 = () => {
      if (_0x43eac1) return;
      ((_0x43eac1 = true),
        _0x4b0d93.classList.add('is-active'),
        _0x2475bf(),
        (_0xe3f666.hidden = false),
        _0xc6d38e(),
        !_0x488139 &&
          ((_0x488139 = (_0x1624c9) => {
            !_0x3a9b27.contains(_0x1624c9.target) && !_0xe3f666.contains(_0x1624c9.target) && _0x49e9a1();
          }),
          document.addEventListener('pointerdown', _0x488139, true)));
    };
  (_0x4b0d93.addEventListener('click', (_0x3e9a9b) => {
    (_0x3e9a9b.preventDefault(), _0x3e9a9b.stopPropagation(), _0x43eac1 ? _0x49e9a1() : _0x2a5c81());
  }),
    _0x241e62.addEventListener('click', (_0x1d66dc) => {
      (_0x1d66dc.preventDefault(), _0x1d66dc.stopPropagation(), _0x2a5c81());
      if (_0x4a6308) {
        (_0x1474e2(false), _0x531b1c());
        return;
      }
      _0x1474e2(true);
    }));
  const _0x527c7d = (_0x3a0fc3) => {
    const _0x1a4ece = _0x3a0fc3.target?.closest?.('.ftb-btn');
    if (!_0x1a4ece) return;
    const _0x41d4e8 = _0x55b8a4(_0x1a4ece);
    if (!_0x41d4e8) return;
    if (_0x4a6308) {
      (_0x3a0fc3.preventDefault(), _0x3a0fc3.stopPropagation());
      return;
    }
    if (_0x3c632d.more.contains(_0x1a4ece)) {
      if (_0x327e89.has(_0x41d4e8)) return;
      queueMicrotask(() => {
        if (!_0x3a9b27.isConnected) return;
        if (_0x4a6308) return;
        _0x49e9a1();
      });
    }
  };
  return (
    _0x3a9b27.addEventListener('click', _0x527c7d, true),
    _0xe3f666.addEventListener('click', _0x527c7d, true),
    collectToolbarActionButtons(_0x3a9b27, _0x55b8a4).forEach((_0xfc3c46) => {
      if (_0xfc3c46.dataset.toolbarDnDBound === '1') return;
      ((_0xfc3c46.dataset.toolbarDnDBound = '1'),
        _0xfc3c46.addEventListener('dragstart', (_0x5e105d) => {
          if (!_0x4a6308) {
            _0x5e105d.preventDefault();
            return;
          }
          ((_0x3b8ef9 = _0xfc3c46),
            _0x52a812(true),
            _0xfc3c46.classList.add('is-toolbar-dragging-capture'),
            setTimeout(() => {
              if (_0x3b8ef9 === _0xfc3c46) _0xfc3c46.classList.add('is-toolbar-dragging');
            }, 0),
            _0x5e105d.dataTransfer &&
              ((_0x5e105d.dataTransfer.effectAllowed = 'move'),
              _0x5e105d.dataTransfer.setData('text/plain', 'image-toolbar-button')));
        }),
        _0xfc3c46.addEventListener('dragend', () => {
          (_0xfc3c46.classList.remove('is-toolbar-dragging-capture'),
            _0xfc3c46.classList.remove('is-toolbar-dragging'),
            (_0x3b8ef9 = null),
            _0x52a812(false),
            _0x3203f2());
        }));
    }),
    Object.values(_0x3c632d).forEach((_0x9c8233) => {
      if (_0x9c8233.dataset.toolbarDropBound === '1') return;
      ((_0x9c8233.dataset.toolbarDropBound = '1'),
        _0x9c8233.addEventListener('dragover', (_0x5c5916) => {
          if (!_0x4a6308 || !_0x3b8ef9) return;
          (_0x5c5916.preventDefault(), _0x5acd90(_0x9c8233));
          const _0x1c8609 = _0x4c49ab(_0x9c8233, _0x5c5916);
          _0x3e5308(_0x9c8233, _0x1c8609);
        }),
        _0x9c8233.addEventListener('dragleave', (_0x20eb58) => {
          if (_0x3b8ef9) {
            const _0x2ed723 = _0x20eb58.relatedTarget || null;
            if (!_0x2ed723 || _0x9c8233.contains(_0x2ed723)) return;
          }
          if (_0x7dbbeb === _0x9c8233) _0x5acd90(null);
        }),
        _0x9c8233.addEventListener('drop', (_0xc4ca82) => {
          if (!_0x4a6308 || !_0x3b8ef9) return;
          (_0xc4ca82.preventDefault(), _0x5acd90(null), _0x531b1c());
        }));
    }),
    { closeMoreMenu: _0x49e9a1 }
  );
}

const TOOLTIP_ATTRS = ['data-tooltip', 'data-tooltip-right'],
  NATIVE_TITLE_BACKUP_ATTR = 'data-native-title',
  GENERATED_TOOLTIP_ATTR = 'data-tooltip-source',
  GENERATED_TOOLTIP_VALUE = 'native-title',
  TOOLTIP_PORTAL_CLASS = 'global-tooltip',
  TOOLTIP_PORTAL_READY_CLASS = 'has-global-tooltip-portal',
  TOOLTIP_ARROW_CLASS = 'global-tooltip-arrow',
  DEFAULT_TOOLTIP_PLACEMENT = 'top',
  RIGHT_TOOLTIP_PLACEMENT = 'right',
  TOOLTIP_GAP_PX = 12,
  TOOLTIP_VIEWPORT_PADDING_PX = 8,
  TOOLTIP_ARROW_PADDING_PX = 12,
  GLOBAL_TOOLTIP_EXCLUDE_SELECTOR = '.generation-node-help-tip';
let installed = null;
function isElementNode(_0x14573d) {
  return _0x14573d && _0x14573d.nodeType === 1;
}
function clamp(_0x5578e4, _0x1ff251, _0x40cf03) {
  const _0x292dff = Number.isFinite(_0x1ff251) ? _0x1ff251 : 0,
    _0x57c313 = Number.isFinite(_0x40cf03) ? Math.max(_0x292dff, _0x40cf03) : _0x292dff;
  return Math.min(Math.max(_0x5578e4, _0x292dff), _0x57c313);
}
function normalizeRect(_0x815e0c = {}) {
  const _0x2c8851 = Number(_0x815e0c.left) || 0,
    _0x273c67 = Number(_0x815e0c.top) || 0,
    _0xbcda29 = Number(_0x815e0c.width) || Math.max(0, (Number(_0x815e0c.right) || _0x2c8851) - _0x2c8851),
    _0x37b2a0 = Number(_0x815e0c.height) || Math.max(0, (Number(_0x815e0c.bottom) || _0x273c67) - _0x273c67);
  return {
    left: _0x2c8851,
    top: _0x273c67,
    right: Number(_0x815e0c.right) || _0x2c8851 + _0xbcda29,
    bottom: Number(_0x815e0c.bottom) || _0x273c67 + _0x37b2a0,
    width: _0xbcda29,
    height: _0x37b2a0,
  };
}
function normalizeViewport(_0x35da55 = {}) {
  return {
    width: Number(_0x35da55.width) || Number(_0x35da55.innerWidth) || Number(globalThis.innerWidth) || 0,
    height: Number(_0x35da55.height) || Number(_0x35da55.innerHeight) || Number(globalThis.innerHeight) || 0,
    padding: Number(_0x35da55.padding) >= 0 ? Number(_0x35da55.padding) : TOOLTIP_VIEWPORT_PADDING_PX,
    gap: Number(_0x35da55.gap) >= 0 ? Number(_0x35da55.gap) : TOOLTIP_GAP_PX,
    arrowPadding:
      Number(_0x35da55.arrowPadding) >= 0 ? Number(_0x35da55.arrowPadding) : TOOLTIP_ARROW_PADDING_PX,
  };
}
export function computeTooltipPosition(
  _0x28431a,
  _0x131f32,
  _0xb8d793,
  _0x5052fa = DEFAULT_TOOLTIP_PLACEMENT,
) {
  const _0x55b0d1 = normalizeRect(_0x28431a),
    _0x2f73d9 = normalizeRect(_0x131f32),
    _0x438440 = normalizeViewport(_0xb8d793),
    _0x3617f5 = _0x438440.width - _0x438440.padding - _0x2f73d9.width,
    _0x75afdd = _0x438440.height - _0x438440.padding - _0x2f73d9.height,
    _0x2978f7 = _0x55b0d1.left + _0x55b0d1.width / 2,
    _0x30092e = _0x55b0d1.top + _0x55b0d1.height / 2;
  let _0x574750 = _0x5052fa === RIGHT_TOOLTIP_PLACEMENT ? RIGHT_TOOLTIP_PLACEMENT : 'top',
    _0x406789 = _0x2978f7 - _0x2f73d9.width / 2,
    _0x4b01c5 = _0x55b0d1.top - _0x2f73d9.height - _0x438440.gap;
  if (_0x574750 === 'top') {
    const _0xa71eb4 = _0x55b0d1.bottom + _0x438440.gap;
    return (
      _0x4b01c5 < _0x438440.padding &&
        _0xa71eb4 + _0x2f73d9.height <= _0x438440.height - _0x438440.padding &&
        ((_0x574750 = 'bottom'), (_0x4b01c5 = _0xa71eb4)),
      (_0x406789 = clamp(_0x406789, _0x438440.padding, _0x3617f5)),
      (_0x4b01c5 = clamp(_0x4b01c5, _0x438440.padding, _0x75afdd)),
      {
        left: _0x406789,
        top: _0x4b01c5,
        placement: _0x574750,
        arrowLeft: clamp(
          _0x2978f7 - _0x406789,
          _0x438440.arrowPadding,
          _0x2f73d9.width - _0x438440.arrowPadding,
        ),
        arrowTop: null,
      }
    );
  }
  return (
    (_0x406789 = _0x55b0d1.right + _0x438440.gap),
    (_0x4b01c5 = _0x30092e - _0x2f73d9.height / 2),
    _0x406789 + _0x2f73d9.width > _0x438440.width - _0x438440.padding &&
      _0x55b0d1.left - _0x438440.gap - _0x2f73d9.width >= _0x438440.padding &&
      ((_0x574750 = 'left'), (_0x406789 = _0x55b0d1.left - _0x438440.gap - _0x2f73d9.width)),
    (_0x406789 = clamp(_0x406789, _0x438440.padding, _0x3617f5)),
    (_0x4b01c5 = clamp(_0x4b01c5, _0x438440.padding, _0x75afdd)),
    {
      left: _0x406789,
      top: _0x4b01c5,
      placement: _0x574750,
      arrowLeft: null,
      arrowTop: clamp(
        _0x30092e - _0x4b01c5,
        _0x438440.arrowPadding,
        _0x2f73d9.height - _0x438440.arrowPadding,
      ),
    }
  );
}
function hasUnifiedTooltip(_0xbbac3e) {
  return TOOLTIP_ATTRS.some((_0x1da90a) => {
    const _0x458fb2 = _0xbbac3e.getAttribute(_0x1da90a);
    return typeof _0x458fb2 === 'string' && _0x458fb2.trim();
  });
}
function shouldMirrorToAriaLabel(_0x5dc23e) {
  if (_0x5dc23e.hasAttribute('aria-label')) return false;
  const _0x4825d8 = String(_0x5dc23e.tagName || '').toLowerCase();
  if (_0x4825d8 === 'button' || _0x4825d8 === 'input' || _0x4825d8 === 'select') return true;
  return _0x5dc23e.hasAttribute('role') || _0x5dc23e.hasAttribute('tabindex');
}
export function unifyNativeTooltipElement(_0x174ce1) {
  if (!isElementNode(_0x174ce1) || !_0x174ce1.hasAttribute('title')) return false;
  const _0x516d36 = String(_0x174ce1.getAttribute('title') || '').trim(),
    _0x45799e = _0x174ce1.getAttribute(GENERATED_TOOLTIP_ATTR) === GENERATED_TOOLTIP_VALUE;
  if (_0x516d36)
    ((_0x45799e || !hasUnifiedTooltip(_0x174ce1)) &&
      (_0x174ce1.setAttribute('data-tooltip', _0x516d36),
      _0x174ce1.setAttribute(GENERATED_TOOLTIP_ATTR, GENERATED_TOOLTIP_VALUE)),
      _0x174ce1.setAttribute(NATIVE_TITLE_BACKUP_ATTR, _0x516d36),
      shouldMirrorToAriaLabel(_0x174ce1) && _0x174ce1.setAttribute('aria-label', _0x516d36));
  else
    _0x45799e &&
      (_0x174ce1.removeAttribute('data-tooltip'),
      _0x174ce1.removeAttribute(GENERATED_TOOLTIP_ATTR),
      _0x174ce1.removeAttribute(NATIVE_TITLE_BACKUP_ATTR));
  return (_0x174ce1.removeAttribute('title'), true);
}
export function unifyNativeTooltips(_0x273e85 = globalThis.document) {
  if (!_0x273e85) return 0;
  let _0xf6d7d4 = 0;
  if (isElementNode(_0x273e85) && unifyNativeTooltipElement(_0x273e85)) _0xf6d7d4 += 1;
  const _0x1dcac9 = _0x273e85.querySelectorAll?.('[title]');
  if (!_0x1dcac9) return _0xf6d7d4;
  return (
    _0x1dcac9.forEach((_0x3f83c0) => {
      if (unifyNativeTooltipElement(_0x3f83c0)) _0xf6d7d4 += 1;
    }),
    _0xf6d7d4
  );
}
function normalizeMutationRecord(_0x516559) {
  if (_0x516559.type === 'attributes') {
    unifyNativeTooltipElement(_0x516559.target);
    return;
  }
  _0x516559.addedNodes.forEach((_0x1dfb72) => {
    unifyNativeTooltips(_0x1dfb72);
  });
}
function getTooltipDescriptor(_0x49be0a) {
  if (!isElementNode(_0x49be0a)) return null;
  if (_0x49be0a.closest?.(GLOBAL_TOOLTIP_EXCLUDE_SELECTOR)) return null;
  const _0x145002 = String(_0x49be0a.getAttribute('data-tooltip-right') || '').trim();
  if (_0x145002) {
    if (_0x49be0a.getAttribute('aria-expanded') === 'true') return null;
    return { text: _0x145002, placement: RIGHT_TOOLTIP_PLACEMENT };
  }
  const _0x3c0ec8 = String(_0x49be0a.getAttribute('data-tooltip') || '').trim();
  if (_0x3c0ec8) return { text: _0x3c0ec8, placement: DEFAULT_TOOLTIP_PLACEMENT };
  return null;
}
function findTooltipTarget(_0x59db54) {
  let _0x4303e0 = isElementNode(_0x59db54) ? _0x59db54 : _0x59db54?.parentElement;
  while (isElementNode(_0x4303e0)) {
    if (getTooltipDescriptor(_0x4303e0)) return _0x4303e0;
    _0x4303e0 = _0x4303e0.parentElement;
  }
  return null;
}
function createTooltipPortal(_0x3c2512) {
  const _0x50d4ea = _0x3c2512.createElement('div');
  ((_0x50d4ea.className = TOOLTIP_PORTAL_CLASS),
    _0x50d4ea.setAttribute('role', 'tooltip'),
    (_0x50d4ea.hidden = true));
  const _0x4ed6ef = _0x3c2512.createElement('div');
  return (
    (_0x4ed6ef.className = TOOLTIP_ARROW_CLASS),
    _0x50d4ea.appendChild(_0x4ed6ef),
    _0x3c2512.body?.appendChild(_0x50d4ea),
    { portal: _0x50d4ea, arrow: _0x4ed6ef }
  );
}
export function installTooltipUnifier(_0x13fba = globalThis.document) {
  if (!_0x13fba?.documentElement) return () => {};
  if (installed) return installed.cleanup;
  (unifyNativeTooltips(_0x13fba), _0x13fba.documentElement.classList?.add(TOOLTIP_PORTAL_READY_CLASS));
  let _0x4c3538 = null,
    _0x5c9581 = null,
    _0x3aacf7 = null;
  const _0x44607a = () => {
      if (_0x5c9581 && _0x5c9581.isConnected !== false) return _0x5c9581;
      if (!_0x13fba.body || typeof _0x13fba.createElement !== 'function') return null;
      const _0x9ddf77 = createTooltipPortal(_0x13fba);
      return ((_0x5c9581 = _0x9ddf77.portal), (_0x3aacf7 = _0x9ddf77.arrow), _0x5c9581);
    },
    _0x3ac2fd = (_0x27654a = null) => {
      if (_0x27654a && _0x4c3538 !== _0x27654a) return;
      _0x4c3538 = null;
      if (!_0x5c9581) return;
      (_0x5c9581.classList?.remove('is-visible'), (_0x5c9581.hidden = true));
    },
    _0x3620e9 = () => {
      if (!_0x4c3538 || !_0x5c9581 || _0x5c9581.hidden) return;
      if (!_0x13fba.documentElement.contains?.(_0x4c3538)) {
        _0x3ac2fd();
        return;
      }
      const _0x2da786 = getTooltipDescriptor(_0x4c3538);
      if (!_0x2da786) {
        _0x3ac2fd();
        return;
      }
      const _0x44838e = _0x4c3538.getBoundingClientRect?.(),
        _0x21d1c = _0x5c9581.getBoundingClientRect?.();
      if (!_0x44838e || !_0x21d1c) return;
      const _0xa6ac87 = _0x13fba.defaultView || globalThis,
        _0x342d63 = computeTooltipPosition(
          _0x44838e,
          _0x21d1c,
          { width: _0xa6ac87.innerWidth, height: _0xa6ac87.innerHeight },
          _0x2da786.placement,
        );
      ((_0x5c9581.style.left = _0x342d63.left + 'px'),
        (_0x5c9581.style.top = _0x342d63.top + 'px'),
        (_0x5c9581.dataset.placement = _0x342d63.placement),
        _0x5c9581.classList?.toggle('is-placement-right', _0x342d63.placement === 'right'),
        _0x5c9581.classList?.toggle('is-placement-left', _0x342d63.placement === 'left'),
        _0x5c9581.classList?.toggle('is-placement-bottom', _0x342d63.placement === 'bottom'),
        _0x5c9581.classList?.toggle('is-placement-top', _0x342d63.placement === 'top'),
        _0x3aacf7 &&
          (_0x342d63.arrowLeft != null &&
            ((_0x3aacf7.style.left = _0x342d63.arrowLeft + 'px'), (_0x3aacf7.style.top = '')),
          _0x342d63.arrowTop != null &&
            ((_0x3aacf7.style.top = _0x342d63.arrowTop + 'px'), (_0x3aacf7.style.left = ''))));
    },
    _0x2587fb = (_0x1d8f91) => {
      const _0x6f28c3 = getTooltipDescriptor(_0x1d8f91);
      if (!_0x6f28c3) {
        _0x3ac2fd(_0x1d8f91);
        return;
      }
      const _0x9dc56c = _0x44607a();
      if (!_0x9dc56c) return;
      ((_0x4c3538 = _0x1d8f91), (_0x9dc56c.textContent = _0x6f28c3.text));
      if (_0x3aacf7) _0x9dc56c.appendChild(_0x3aacf7);
      ((_0x9dc56c.hidden = false),
        _0x9dc56c.classList?.remove('is-visible'),
        (_0x9dc56c.style.left = '0px'),
        (_0x9dc56c.style.top = '0px'),
        _0x3620e9(),
        _0x9dc56c.classList?.add('is-visible'));
    },
    _0x35ffce = (_0x3ef643) => {
      if (!isElementNode(_0x3ef643)) return;
      const _0x36f0ef = _0x3ef643.classList?.contains('is-tooltip-pinned');
      if (_0x36f0ef && getTooltipDescriptor(_0x3ef643)) {
        _0x2587fb(_0x3ef643);
        return;
      }
      if (_0x4c3538 === _0x3ef643) {
        const _0x2a304f = getTooltipDescriptor(_0x3ef643);
        if (_0x2a304f) _0x2587fb(_0x3ef643);
        else _0x3ac2fd(_0x3ef643);
      }
    },
    _0x26974a = _0x13fba.defaultView?.MutationObserver || globalThis.MutationObserver,
    _0x5fb8ee = _0x26974a
      ? new _0x26974a((_0x5b1d25) => {
          (_0x5b1d25.forEach((_0x45dde8) => {
            (normalizeMutationRecord(_0x45dde8),
              _0x45dde8.type === 'attributes' &&
                ['class', 'data-tooltip', 'data-tooltip-right', 'aria-expanded'].includes(
                  _0x45dde8.attributeName,
                ) &&
                _0x35ffce(_0x45dde8.target));
          }),
            _0x4c3538 && !_0x13fba.documentElement.contains?.(_0x4c3538) && _0x3ac2fd());
        })
      : null;
  _0x5fb8ee?.observe(_0x13fba.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['title', 'class', 'data-tooltip', 'data-tooltip-right', 'aria-expanded'],
  });
  const _0x40e86c = (_0x46d808) => {
      const _0xe12929 = _0x46d808.target?.closest?.('[title]') || _0x46d808.target;
      unifyNativeTooltipElement(_0xe12929);
      const _0x3b7ab0 = findTooltipTarget(_0x46d808.target);
      if (_0x3b7ab0) _0x2587fb(_0x3b7ab0);
    },
    _0x5177af = (_0x43b1ba) => {
      if (!_0x4c3538) return;
      if (_0x4c3538.contains?.(_0x43b1ba.relatedTarget)) return;
      _0x3ac2fd(_0x4c3538);
    },
    _0x503ae0 = (_0x1ec95d) => {
      const _0x5bd198 = _0x1ec95d.target?.closest?.('[title]') || _0x1ec95d.target;
      unifyNativeTooltipElement(_0x5bd198);
      const _0x43f2f1 = findTooltipTarget(_0x1ec95d.target);
      if (_0x43f2f1) _0x2587fb(_0x43f2f1);
    },
    _0x25335a = (_0x612365) => {
      if (!_0x4c3538) return;
      if (_0x4c3538.contains?.(_0x612365.relatedTarget)) return;
      _0x3ac2fd(_0x4c3538);
    },
    _0x432d96 = () => {
      _0x3ac2fd();
    },
    _0x4f3dbd = () => _0x3ac2fd();
  (_0x13fba.addEventListener?.('pointerover', _0x40e86c, true),
    _0x13fba.addEventListener?.('pointerout', _0x5177af, true),
    _0x13fba.addEventListener?.('focusin', _0x503ae0, true),
    _0x13fba.addEventListener?.('focusout', _0x25335a, true),
    _0x13fba.addEventListener?.('pointerdown', _0x4f3dbd, true),
    _0x13fba.addEventListener?.('scroll', _0x432d96, true),
    _0x13fba.defaultView?.addEventListener?.('scroll', _0x432d96, true),
    _0x13fba.defaultView?.addEventListener?.('resize', _0x432d96));
  const _0x54ef4e = () => {
    (_0x5fb8ee?.disconnect(),
      _0x13fba.removeEventListener?.('pointerover', _0x40e86c, true),
      _0x13fba.removeEventListener?.('pointerout', _0x5177af, true),
      _0x13fba.removeEventListener?.('focusin', _0x503ae0, true),
      _0x13fba.removeEventListener?.('focusout', _0x25335a, true),
      _0x13fba.removeEventListener?.('pointerdown', _0x4f3dbd, true),
      _0x13fba.removeEventListener?.('scroll', _0x432d96, true),
      _0x13fba.defaultView?.removeEventListener?.('scroll', _0x432d96, true),
      _0x13fba.defaultView?.removeEventListener?.('resize', _0x432d96),
      _0x13fba.documentElement.classList?.remove(TOOLTIP_PORTAL_READY_CLASS),
      _0x5c9581?.remove?.(),
      (_0x4c3538 = null),
      (_0x5c9581 = null),
      (_0x3aacf7 = null),
      (installed = null));
  };
  return ((installed = { cleanup: _0x54ef4e }), _0x54ef4e);
}

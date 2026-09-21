function getCaretRangeFromPoint(_0x556895, _0x19c737, _0x5ddd06) {
  if (typeof _0x556895?.caretRangeFromPoint === 'function')
    return _0x556895.caretRangeFromPoint(_0x19c737, _0x5ddd06);
  const _0x3d5f88 = _0x556895?.caretPositionFromPoint?.(_0x19c737, _0x5ddd06);
  if (!_0x3d5f88 || typeof _0x556895?.createRange !== 'function') return null;
  const _0x2cbd01 = _0x556895.createRange();
  return (_0x2cbd01.setStart(_0x3d5f88.offsetNode, _0x3d5f88.offset), _0x2cbd01);
}
function setSelection(_0x4c2642, _0x1f2972, _0x11d56d) {
  const _0x468def = _0x4c2642?.getSelection?.();
  if (!_0x468def || !_0x1f2972 || !_0x11d56d) return;
  _0x468def.removeAllRanges();
  if (typeof _0x468def.setBaseAndExtent === 'function') {
    _0x468def.setBaseAndExtent(
      _0x1f2972.startContainer,
      _0x1f2972.startOffset,
      _0x11d56d.startContainer,
      _0x11d56d.startOffset,
    );
    return;
  }
  const _0x3f372a = _0x1f2972.startContainer.ownerDocument.createRange();
  (_0x3f372a.setStart(_0x1f2972.startContainer, _0x1f2972.startOffset),
    _0x3f372a.setEnd(_0x11d56d.startContainer, _0x11d56d.startOffset),
    _0x468def.addRange(_0x3f372a));
}
function findActiveReadonlyTextRoot(_0x677934) {
  if (!_0x677934) return null;
  const _0x4e50f8 = _0x677934.nodeType === 1 ? _0x677934 : _0x677934.parentElement;
  if (!_0x4e50f8) return null;
  if (typeof _0x4e50f8.closest === 'function')
    return _0x4e50f8.closest('.aigen-text-output.is-text-selection-active');
  let _0x1730fb = _0x4e50f8;
  while (_0x1730fb) {
    if (
      _0x1730fb.classList?.contains?.('aigen-text-output') &&
      _0x1730fb.classList?.contains?.('is-text-selection-active')
    )
      return _0x1730fb;
    _0x1730fb = _0x1730fb.parentElement;
  }
  return null;
}
function rangeTouchesActiveReadonlyText(_0x358c0b, _0x1d807c) {
  if (!_0x358c0b) return false;
  if (
    findActiveReadonlyTextRoot(_0x358c0b.commonAncestorContainer) ||
    findActiveReadonlyTextRoot(_0x358c0b.startContainer) ||
    findActiveReadonlyTextRoot(_0x358c0b.endContainer)
  )
    return true;
  const _0x521cda = Array.from(
    _0x1d807c?.querySelectorAll?.('.aigen-text-output.is-text-selection-active') || [],
  );
  return _0x521cda.some((_0x466543) => {
    try {
      if (typeof _0x358c0b.intersectsNode === 'function') return _0x358c0b.intersectsNode(_0x466543);
    } catch (_0x1fd553) {
      return false;
    }
    return _0x466543.contains?.(_0x358c0b.startContainer) || _0x466543.contains?.(_0x358c0b.endContainer);
  });
}
export function hasActiveReadonlyTextSelection(_0x1067fd = document) {
  const _0x4a9b98 = _0x1067fd?.getSelection?.();
  if (!_0x4a9b98 || _0x4a9b98.isCollapsed || !String(_0x4a9b98.toString?.() || '').trim()) return false;
  const _0xd927fb = Number(_0x4a9b98.rangeCount) || 0;
  for (let _0x25aa01 = 0; _0x25aa01 < _0xd927fb; _0x25aa01 += 1) {
    if (rangeTouchesActiveReadonlyText(_0x4a9b98.getRangeAt(_0x25aa01), _0x1067fd)) return true;
  }
  return false;
}
export function bindReadonlyTextSelection(_0x141c81, _0x526550 = {}) {
  if (!_0x141c81?.addEventListener) return () => {};
  const _0x302df9 = _0x141c81.ownerDocument || document,
    _0x2858f9 = _0x302df9.defaultView || window;
  let _0x37b307 = false;
  const _0x4c1d06 = () => {
      if (_0x37b307) return;
      ((_0x37b307 = true), _0x141c81.classList?.add('is-text-selection-active'), _0x526550.onActivate?.());
    },
    _0x1ee057 = () => {
      if (!_0x37b307) return;
      ((_0x37b307 = false),
        _0x526550.onDeactivate?.(),
        _0x141c81.classList?.remove('is-text-selection-active'),
        _0x302df9.body?.classList.remove('is-aigen-text-selecting'));
    },
    _0x2d98b3 = (_0x41879b) => {
      if (_0x41879b.button !== 0) return;
      if (!_0x37b307) return;
      (_0x41879b.preventDefault(),
        _0x41879b.stopPropagation(),
        _0x302df9.body?.classList.add('is-aigen-text-selecting'));
      const _0x4c638a = getCaretRangeFromPoint(_0x302df9, _0x41879b.clientX, _0x41879b.clientY),
        _0x18533c = (_0x10836c) => {
          const _0x1fc0e6 = getCaretRangeFromPoint(_0x302df9, _0x10836c.clientX, _0x10836c.clientY);
          (_0x4c638a &&
            _0x1fc0e6 &&
            _0x141c81.contains(_0x4c638a.startContainer) &&
            _0x141c81.contains(_0x1fc0e6.startContainer) &&
            setSelection(_0x2858f9, _0x4c638a, _0x1fc0e6),
            _0x10836c.preventDefault(),
            _0x10836c.stopPropagation());
        },
        _0x5ec33b = (_0x35b651) => {
          (_0x18533c(_0x35b651),
            _0x302df9.body?.classList.remove('is-aigen-text-selecting'),
            _0x302df9.removeEventListener('pointermove', _0x18533c, true),
            _0x302df9.removeEventListener('pointerup', _0x5ec33b, true),
            _0x302df9.removeEventListener('pointercancel', _0x5ec33b, true));
        };
      (_0x302df9.addEventListener('pointermove', _0x18533c, true),
        _0x302df9.addEventListener('pointerup', _0x5ec33b, true),
        _0x302df9.addEventListener('pointercancel', _0x5ec33b, true));
    },
    _0x29f34e = (_0x8357b) => {
      (_0x8357b.preventDefault(), _0x8357b.stopPropagation(), _0x4c1d06());
    },
    _0xfb210 = (_0x22ccb8) => {
      if (!_0x37b307 || _0x141c81.contains(_0x22ccb8.target)) return;
      _0x1ee057();
    },
    _0x3b29b6 = (_0x566b66) => {
      if (_0x566b66.key === 'Escape') _0x1ee057();
    };
  return (
    _0x141c81.addEventListener('pointerdown', _0x2d98b3, true),
    _0x141c81.addEventListener('dblclick', _0x29f34e),
    _0x302df9.addEventListener('pointerdown', _0xfb210, true),
    _0x302df9.addEventListener('keydown', _0x3b29b6, true),
    () => {
      (_0x1ee057(),
        _0x141c81.removeEventListener('pointerdown', _0x2d98b3, true),
        _0x141c81.removeEventListener('dblclick', _0x29f34e),
        _0x302df9.removeEventListener('pointerdown', _0xfb210, true),
        _0x302df9.removeEventListener('keydown', _0x3b29b6, true));
    }
  );
}

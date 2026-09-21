import {
  applyPromptBoxHeight,
  getPromptBoxHeightBounds,
  normalizePromptBoxHeight,
} from './promptBoxResize.js';
const EDGE_HIT_TOP_OFFSET = 20,
  EDGE_HIT_BOTTOM_OFFSET = 10;
export function syncPromptBoxSizeFromData(_0x3cd449, _0x5550eb = _0x3cd449?._data) {
  if (!_0x3cd449?.promptEl || _0x3cd449._isPromptBoxResizing) return;
  const _0x18b156 = getPromptBoxHeightBounds(_0x3cd449._promptPanel),
    _0x3e8b86 = normalizePromptBoxHeight(_0x5550eb?.promptBoxHeight, _0x18b156);
  applyPromptBoxHeight(_0x3cd449.promptEl, _0x3e8b86);
}
export function setupPromptBoxResize(_0x3e3ce9, { store: _0x31ca61, getStateSnapshot: _0x470b19 }) {
  if (!_0x3e3ce9?._promptPanel || _0x3e3ce9._promptResizeHandle) return;
  _0x3e3ce9._promptResizeHandle = true;
  const _0x21fff0 = () => _0x470b19().ui?.promptBoxResizeEnabled !== false,
    _0x573057 = (_0x2e0e5d) => !!_0x2e0e5d?.closest('.floating-menu, .img-model-menu'),
    _0x2e33f0 = (_0x3cfa01) => {
      const _0x239bde = _0x3e3ce9._promptPanel.getBoundingClientRect();
      return (
        _0x3cfa01 >= _0x239bde.bottom - EDGE_HIT_TOP_OFFSET &&
        _0x3cfa01 <= _0x239bde.bottom + EDGE_HIT_BOTTOM_OFFSET
      );
    },
    _0x24ea4c = (_0x4251f3) => {
      if (!_0x3e3ce9._promptPanel) return;
      if (!_0x21fff0()) {
        _0x3e3ce9._promptPanel.classList.remove('is-resize-hover');
        return;
      }
      if (_0x3e3ce9._isPromptBoxResizing) {
        _0x3e3ce9._promptPanel.classList.add('is-resize-hover');
        return;
      }
      const _0x5d4fa0 = !_0x573057(_0x4251f3?.target) && _0x2e33f0(_0x4251f3.clientY);
      _0x3e3ce9._promptPanel.classList.toggle('is-resize-hover', _0x5d4fa0);
    },
    _0x4c34f4 = () => {
      !_0x3e3ce9._isPromptBoxResizing && _0x3e3ce9._promptPanel?.classList.remove('is-resize-hover');
    },
    _0x5f192f = () => {
      (_0x3e3ce9._promptPanel?.removeEventListener('pointerdown', _0x105b6e),
        _0x3e3ce9._promptPanel?.removeEventListener('pointermove', _0x24ea4c),
        _0x3e3ce9._promptPanel?.removeEventListener('pointerleave', _0x4c34f4),
        _0x3e3ce9._promptPanel?.classList.remove('is-resize-hover'));
    },
    _0x105b6e = (_0x5b03e8) => {
      if (!_0x3e3ce9._promptInputWrap || !_0x3e3ce9.promptEl) return;
      if (!_0x21fff0()) return;
      if (_0x5b03e8.button !== 0) return;
      if (!_0x2e33f0(_0x5b03e8.clientY)) return;
      if (_0x5b03e8.target?.closest('.prompt-submit') || _0x573057(_0x5b03e8.target)) return;
      (_0x5b03e8.stopPropagation(), _0x5b03e8.preventDefault());
      const _0x2b0c80 = getPromptBoxHeightBounds(_0x3e3ce9._promptPanel),
        _0x268b32 = _0x5b03e8.clientY,
        _0x3fabb5 = _0x3e3ce9.promptEl.getBoundingClientRect().height;
      ((_0x3e3ce9._isPromptBoxResizing = true),
        _0x3e3ce9._promptInputWrap.classList.add('is-resizing'),
        _0x3e3ce9._promptPanel.classList.add('is-resize-hover'));
      const _0xd3878d = (_0x233533) => {
          _0x233533.preventDefault();
          const _0x37684a = normalizePromptBoxHeight(_0x3fabb5 + (_0x233533.clientY - _0x268b32), _0x2b0c80);
          applyPromptBoxHeight(_0x3e3ce9.promptEl, _0x37684a);
        },
        _0x315947 = (_0x5de6bf) => {
          (_0x5de6bf.preventDefault(),
            window.removeEventListener('pointermove', _0xd3878d),
            window.removeEventListener('pointerup', _0x315947),
            window.removeEventListener('pointercancel', _0x315947));
          const _0x2ca0b9 = normalizePromptBoxHeight(
            _0x3e3ce9.promptEl?.getBoundingClientRect().height,
            _0x2b0c80,
          );
          (applyPromptBoxHeight(_0x3e3ce9.promptEl, _0x2ca0b9),
            _0x3e3ce9._promptInputWrap.classList.remove('is-resizing'),
            (_0x3e3ce9._isPromptBoxResizing = false),
            _0x3e3ce9._promptPanel.classList.remove('is-resize-hover'),
            _0x24ea4c(_0x5de6bf),
            _0x31ca61.updateNodeData(_0x3e3ce9.nodeId, { promptBoxHeight: _0x2ca0b9 }));
        };
      (window.addEventListener('pointermove', _0xd3878d),
        window.addEventListener('pointerup', _0x315947),
        window.addEventListener('pointercancel', _0x315947),
        (_0x3e3ce9._promptResizeCleanup = () => {
          (_0x5f192f(),
            window.removeEventListener('pointermove', _0xd3878d),
            window.removeEventListener('pointerup', _0x315947),
            window.removeEventListener('pointercancel', _0x315947));
        }));
    };
  (_0x3e3ce9._promptPanel.addEventListener('pointermove', _0x24ea4c),
    _0x3e3ce9._promptPanel.addEventListener('pointerleave', _0x4c34f4),
    _0x3e3ce9._promptPanel.addEventListener('pointerdown', _0x105b6e),
    (_0x3e3ce9._promptResizeCleanup = _0x5f192f));
}

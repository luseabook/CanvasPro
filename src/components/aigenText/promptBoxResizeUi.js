import {
  applyPromptBoxHeight,
  getPromptBoxHeightBounds,
  normalizePromptBoxHeight,
} from '../promptBoxResize.js';
const EDGE_HIT_TOP_OFFSET = 20,
  EDGE_HIT_BOTTOM_OFFSET = 10;
export function syncPromptBoxSizeFromData(_0x2693b5, _0x44829a = _0x2693b5?._data) {
  if (!_0x2693b5?.promptEl || _0x2693b5._isPromptBoxResizing) return;
  const _0x5e51b7 = getPromptBoxHeightBounds(_0x2693b5._promptPanel),
    _0x30c1ce = normalizePromptBoxHeight(_0x44829a?.promptBoxHeight, _0x5e51b7);
  applyPromptBoxHeight(_0x2693b5.promptEl, _0x30c1ce);
}
export function setupPromptBoxResize(_0x477031, { store: _0x45c014, getStateSnapshot: _0x26cf93 }) {
  if (!_0x477031?._promptPanel || _0x477031._promptResizeHandle) return;
  _0x477031._promptResizeHandle = true;
  const _0x1ff67 = () => _0x26cf93().ui?.promptBoxResizeEnabled !== false,
    _0x352ec9 = (_0x8123a4) => !!_0x8123a4?.closest('.floating-menu, .img-model-menu'),
    _0x32f711 = (_0x70d03a) => {
      const _0x2c0988 = _0x477031._promptPanel.getBoundingClientRect();
      return (
        _0x70d03a >= _0x2c0988.bottom - EDGE_HIT_TOP_OFFSET &&
        _0x70d03a <= _0x2c0988.bottom + EDGE_HIT_BOTTOM_OFFSET
      );
    },
    _0x434366 = (_0x5391af) => {
      if (!_0x477031._promptPanel) return;
      if (!_0x1ff67()) {
        _0x477031._promptPanel.classList.remove('is-resize-hover');
        return;
      }
      if (_0x477031._isPromptBoxResizing) {
        _0x477031._promptPanel.classList.add('is-resize-hover');
        return;
      }
      const _0x52cdd2 = !_0x352ec9(_0x5391af?.target) && _0x32f711(_0x5391af.clientY);
      _0x477031._promptPanel.classList.toggle('is-resize-hover', _0x52cdd2);
    };
  (_0x477031._promptPanel.addEventListener('pointermove', _0x434366),
    _0x477031._promptPanel.addEventListener('pointerleave', () => {
      !_0x477031._isPromptBoxResizing && _0x477031._promptPanel?.classList.remove('is-resize-hover');
    }));
  const _0x10354d = (_0xcce479) => {
    if (!_0x477031._promptInputWrap || !_0x477031.promptEl) return;
    if (!_0x1ff67()) return;
    if (_0xcce479.button !== 0) return;
    if (!_0x32f711(_0xcce479.clientY)) return;
    if (_0xcce479.target?.closest('.prompt-submit') || _0x352ec9(_0xcce479.target)) return;
    (_0xcce479.stopPropagation(), _0xcce479.preventDefault());
    const _0x4be3af = getPromptBoxHeightBounds(_0x477031._promptPanel),
      _0x550290 = _0xcce479.clientY,
      _0x57232a = _0x477031.promptEl.getBoundingClientRect().height;
    ((_0x477031._isPromptBoxResizing = true),
      _0x477031._promptInputWrap.classList.add('is-resizing'),
      _0x477031._promptPanel.classList.add('is-resize-hover'));
    const _0x3ee14d = (_0x433220) => {
        _0x433220.preventDefault();
        const _0x54c49b = normalizePromptBoxHeight(_0x57232a + (_0x433220.clientY - _0x550290), _0x4be3af);
        applyPromptBoxHeight(_0x477031.promptEl, _0x54c49b);
      },
      _0x25f34e = (_0x3af202) => {
        (_0x3af202.preventDefault(),
          window.removeEventListener('pointermove', _0x3ee14d),
          window.removeEventListener('pointerup', _0x25f34e),
          window.removeEventListener('pointercancel', _0x25f34e));
        const _0x38ceca = normalizePromptBoxHeight(
          _0x477031.promptEl?.getBoundingClientRect().height,
          _0x4be3af,
        );
        (applyPromptBoxHeight(_0x477031.promptEl, _0x38ceca),
          _0x477031._promptInputWrap.classList.remove('is-resizing'),
          (_0x477031._isPromptBoxResizing = false),
          _0x477031._promptPanel.classList.remove('is-resize-hover'),
          _0x434366(_0x3af202),
          _0x45c014.updateNodeData(_0x477031.nodeId, { promptBoxHeight: _0x38ceca }));
      };
    (window.addEventListener('pointermove', _0x3ee14d),
      window.addEventListener('pointerup', _0x25f34e),
      window.addEventListener('pointercancel', _0x25f34e));
  };
  _0x477031._promptPanel.addEventListener('pointerdown', _0x10354d);
}

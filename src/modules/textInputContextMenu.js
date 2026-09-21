import { t } from '../i18n/index.js';
const MENU_SELECTOR = '.v2-text-input-context-menu',
  TEXT_INPUT_TYPES = new Set(['', 'text', 'search', 'url', 'tel', 'email', 'password', 'number']);
function getWindow() {
  return globalThis.window || null;
}
function getDocument() {
  return globalThis.document || null;
}
function textInputContextMenuText(_0x568d78, _0x5338fb = {}) {
  return t('textInputContextMenu.' + _0x568d78, _0x5338fb);
}
function isInputElement(_0x57d12c) {
  return String(_0x57d12c?.tagName || '').toUpperCase() === 'INPUT';
}
function isTextAreaElement(_0x4e7e17) {
  return String(_0x4e7e17?.tagName || '').toUpperCase() === 'TEXTAREA';
}
function isContentEditableElement(_0x14c1b2) {
  return (
    _0x14c1b2?.isContentEditable === true ||
    String(_0x14c1b2?.getAttribute?.('contenteditable') || '').toLowerCase() === 'true' ||
    String(_0x14c1b2?.contentEditable || '').toLowerCase() === 'true'
  );
}
function isWritableTextInput(_0x27b4a2) {
  if (!isInputElement(_0x27b4a2)) return false;
  const _0x16e3f0 = String(_0x27b4a2.type || '').toLowerCase();
  return TEXT_INPUT_TYPES.has(_0x16e3f0) && !_0x27b4a2.disabled && !_0x27b4a2.readOnly;
}
function isWritableTextArea(_0x45956d) {
  return isTextAreaElement(_0x45956d) && !_0x45956d.disabled && !_0x45956d.readOnly;
}
export function getEditableTextTarget(_0x124695) {
  if (!_0x124695) return null;
  const _0x398dc3 = _0x124695.closest?.("input, textarea, [contenteditable='true']") || _0x124695;
  if (isWritableTextInput(_0x398dc3) || isWritableTextArea(_0x398dc3) || isContentEditableElement(_0x398dc3))
    return _0x398dc3;
  return null;
}
export function isEditableTextTargetInGroupedNode(_0x1776fe, _0x5e6f58 = {}) {
  const _0x57594 = getEditableTextTarget(_0x1776fe);
  if (!_0x57594) return false;
  const _0x1bbc8a = _0x57594.closest?.('.v2-node'),
    _0x1fdd07 = String(_0x1bbc8a?.dataset?.nodeId || _0x1bbc8a?.id || '').trim();
  if (!_0x1fdd07) return false;
  const _0x3f1f21 = _0x5e6f58?.[_0x1fdd07],
    _0x2217b5 = String(_0x3f1f21?.parentId || '').trim();
  if (!_0x2217b5) return false;
  return _0x5e6f58?.[_0x2217b5]?.type === 'group';
}
function closeTextInputContextMenu() {
  getDocument()
    ?.querySelectorAll?.(MENU_SELECTOR)
    ?.forEach((_0xb61821) => _0xb61821.remove());
}
function dispatchInputEvent(_0xfbae4d) {
  const _0x4292e2 = _0xfbae4d?.ownerDocument?.defaultView || getWindow(),
    _0x43bf79 = _0x4292e2?.InputEvent || _0x4292e2?.Event || globalThis.Event;
  if (typeof _0x43bf79 !== 'function' || typeof _0xfbae4d?.dispatchEvent !== 'function') return;
  _0xfbae4d.dispatchEvent(new _0x43bf79('input', { bubbles: true }));
}
function clampSelection(_0x241dc0, _0x38b86c) {
  const _0x45a974 = Number(_0x241dc0);
  if (!Number.isFinite(_0x45a974)) return _0x38b86c;
  return Math.max(0, Math.min(_0x38b86c, _0x45a974));
}
function setFieldSelection(_0x46fac0, _0x5d7c96, _0x39f294) {
  if (typeof _0x46fac0?.setSelectionRange !== 'function') return;
  try {
    _0x46fac0.setSelectionRange(_0x5d7c96, _0x39f294);
  } catch {}
}
export function captureEditableSelection(_0x11b2a1) {
  if (isWritableTextInput(_0x11b2a1) || isWritableTextArea(_0x11b2a1)) {
    const _0x79806c = String(_0x11b2a1.value || '').length;
    return {
      kind: 'field',
      start: clampSelection(_0x11b2a1.selectionStart, _0x79806c),
      end: clampSelection(_0x11b2a1.selectionEnd, _0x79806c),
    };
  }
  const _0x191a3d = _0x11b2a1?.ownerDocument?.defaultView || getWindow(),
    _0x3851c4 = _0x191a3d?.getSelection?.();
  if (!_0x3851c4 || _0x3851c4.rangeCount === 0) return null;
  const _0x23c09c = _0x3851c4.getRangeAt(0),
    _0x258579 = _0x23c09c.commonAncestorContainer;
  if (!_0x11b2a1.contains?.(_0x258579)) return null;
  return { kind: 'contenteditable', range: _0x23c09c.cloneRange() };
}
function restoreEditableSelection(_0x2599cc, _0x25edce) {
  if (!_0x25edce) return;
  if (_0x25edce.kind === 'field') {
    (_0x2599cc.focus?.({ preventScroll: true }),
      setFieldSelection(_0x2599cc, _0x25edce.start, _0x25edce.end));
    return;
  }
  if (_0x25edce.kind !== 'contenteditable' || !_0x25edce.range) return;
  _0x2599cc.focus?.({ preventScroll: true });
  const _0x2ff151 = _0x2599cc?.ownerDocument?.defaultView || getWindow(),
    _0x396263 = _0x2ff151?.getSelection?.();
  if (!_0x396263) return;
  (_0x396263.removeAllRanges(), _0x396263.addRange(_0x25edce.range));
}
function insertTextIntoField(_0x1957a7, _0x436e71, _0x126193) {
  const _0xc20c1c = String(_0x1957a7.value || ''),
    _0x26ed81 = clampSelection(_0x126193?.start ?? _0x1957a7.selectionStart, _0xc20c1c.length),
    _0x246c1d = clampSelection(_0x126193?.end ?? _0x1957a7.selectionEnd, _0xc20c1c.length);
  _0x1957a7.focus?.({ preventScroll: true });
  if (typeof _0x1957a7.setRangeText === 'function')
    try {
      _0x1957a7.setRangeText(_0x436e71, _0x26ed81, _0x246c1d, 'end');
    } catch (_0x347249) {
      _0x1957a7.value = _0xc20c1c.slice(0, _0x26ed81) + _0x436e71 + _0xc20c1c.slice(_0x246c1d);
      const _0x460f53 = _0x26ed81 + _0x436e71.length;
      setFieldSelection(_0x1957a7, _0x460f53, _0x460f53);
    }
  else {
    _0x1957a7.value = _0xc20c1c.slice(0, _0x26ed81) + _0x436e71 + _0xc20c1c.slice(_0x246c1d);
    const _0x5153a2 = _0x26ed81 + _0x436e71.length;
    setFieldSelection(_0x1957a7, _0x5153a2, _0x5153a2);
  }
  return (dispatchInputEvent(_0x1957a7), true);
}
function insertTextIntoContentEditable(_0x311d96, _0x541c6a, _0x43d909) {
  const _0x1360db = _0x311d96?.ownerDocument || getDocument();
  (_0x311d96.focus?.({ preventScroll: true }), restoreEditableSelection(_0x311d96, _0x43d909));
  if (typeof _0x1360db?.execCommand === 'function')
    try {
      if (_0x1360db.execCommand('insertText', false, _0x541c6a)) return true;
    } catch {}
  const _0x330bb2 = _0x1360db?.defaultView || getWindow(),
    _0x2b7560 = _0x330bb2?.getSelection?.();
  if (_0x2b7560 && _0x2b7560.rangeCount > 0) {
    const _0x28ba63 = _0x2b7560.getRangeAt(0);
    _0x28ba63.deleteContents();
    const _0x1e05c4 = _0x1360db.createTextNode(String(_0x541c6a || ''));
    (_0x28ba63.insertNode(_0x1e05c4),
      _0x28ba63.setStartAfter(_0x1e05c4),
      _0x28ba63.collapse(true),
      _0x2b7560.removeAllRanges(),
      _0x2b7560.addRange(_0x28ba63));
  } else
    typeof _0x311d96.appendChild === 'function' && _0x1360db?.createTextNode
      ? _0x311d96.appendChild(_0x1360db.createTextNode(String(_0x541c6a || '')))
      : (_0x311d96.textContent = '' + (_0x311d96.textContent || '') + _0x541c6a);
  return (dispatchInputEvent(_0x311d96), true);
}
export function insertPlainTextIntoEditable(_0x118651, _0x34178a, _0x332e62 = null) {
  const _0x221507 = getEditableTextTarget(_0x118651);
  if (!_0x221507 || typeof _0x34178a !== 'string') return false;
  if (isWritableTextInput(_0x221507) || isWritableTextArea(_0x221507))
    return insertTextIntoField(_0x221507, _0x34178a, _0x332e62);
  if (isContentEditableElement(_0x221507))
    return insertTextIntoContentEditable(_0x221507, _0x34178a, _0x332e62);
  return false;
}
async function readClipboardText() {
  const _0x5076b9 = globalThis.navigator?.clipboard?.readText;
  if (typeof _0x5076b9 !== 'function') return null;
  return _0x5076b9.call(globalThis.navigator.clipboard);
}
export async function pasteTextIntoEditableFromClipboard(_0x2f4755, _0x2a7e0a) {
  let _0x390881 = null;
  try {
    _0x390881 = await readClipboardText();
  } catch (_0x101d5a) {
    return (getWindow()?.showToast?.(textInputContextMenuText('clipboardReadFailed'), 'error'), false);
  }
  if (typeof _0x390881 !== 'string')
    return (getWindow()?.showToast?.(textInputContextMenuText('clipboardUnsupported'), 'error'), false);
  if (!_0x390881)
    return (getWindow()?.showToast?.(textInputContextMenuText('clipboardEmpty'), 'warn'), false);
  return insertPlainTextIntoEditable(_0x2f4755, _0x390881, _0x2a7e0a);
}
function placeMenu(_0x267d67, _0x400404, _0x1e7c78) {
  const _0x4db862 = getDocument(),
    _0x3b4b35 = getWindow();
  _0x4db862?.body?.appendChild(_0x267d67);
  const _0x1d30d9 = _0x267d67.offsetWidth || 180,
    _0x13e2fb = _0x267d67.offsetHeight || 44,
    _0x4ef9c9 = _0x3b4b35 && _0x400404 + _0x1d30d9 > _0x3b4b35.innerWidth ? _0x400404 - _0x1d30d9 : _0x400404,
    _0x1bcb27 =
      _0x3b4b35 && _0x1e7c78 + _0x13e2fb > _0x3b4b35.innerHeight ? _0x1e7c78 - _0x13e2fb : _0x1e7c78;
  ((_0x267d67.style.left = Math.max(0, _0x4ef9c9) + 'px'),
    (_0x267d67.style.top = Math.max(0, _0x1bcb27) + 'px'));
}
export function showTextInputContextMenu({
  target: _0x5887e6,
  screenX: _0x99b5b4,
  screenY: _0x11aa67,
  snapshot: _0x38a984,
}) {
  const _0x319eba = getDocument();
  if (!_0x319eba?.createElement) return;
  const _0xfae8e = _0x38a984 === undefined ? captureEditableSelection(_0x5887e6) : _0x38a984;
  (closeTextInputContextMenu(),
    _0x319eba.querySelectorAll?.('.v2-canvas-ctx-menu')?.forEach((_0x557b10) => _0x557b10.remove()));
  const _0x260975 = _0x319eba.createElement('div');
  _0x260975.className = 'v2-canvas-ctx-menu v2-text-input-context-menu';
  const _0x4715be = _0x319eba.createElement('div');
  _0x4715be.className = 'v2-menu-row v2-menu-row-split';
  const _0x1c2a79 = _0x319eba.createElement('span');
  ((_0x1c2a79.textContent = textInputContextMenuText('pasteText')), _0x4715be.appendChild(_0x1c2a79));
  const _0xa7562e = _0x319eba.createElement('span');
  ((_0xa7562e.className = 'v2-menu-kbd'),
    (_0xa7562e.textContent = 'Ctrl V'),
    _0x4715be.appendChild(_0xa7562e),
    _0x4715be.addEventListener('pointerdown', async (_0x35e3d5) => {
      (_0x35e3d5.preventDefault(),
        _0x35e3d5.stopPropagation(),
        _0x260975.remove(),
        restoreEditableSelection(_0x5887e6, _0xfae8e),
        await pasteTextIntoEditableFromClipboard(_0x5887e6, _0xfae8e));
    }),
    _0x260975.appendChild(_0x4715be),
    placeMenu(_0x260975, _0x99b5b4, _0x11aa67));
  const _0x211960 = (_0x37efc2) => {
      if (_0x260975.contains(_0x37efc2.target)) return;
      (_0x260975.remove(),
        _0x319eba.removeEventListener('pointerdown', _0x211960, true),
        _0x319eba.removeEventListener('keydown', _0x5871c3, true));
    },
    _0x5871c3 = (_0xa0ea9c) => {
      if (_0xa0ea9c.key !== 'Escape') return;
      (_0x260975.remove(),
        _0x319eba.removeEventListener('pointerdown', _0x211960, true),
        _0x319eba.removeEventListener('keydown', _0x5871c3, true));
    };
  getWindow()?.requestAnimationFrame?.(() => {
    (_0x319eba.addEventListener('pointerdown', _0x211960, true),
      _0x319eba.addEventListener('keydown', _0x5871c3, true));
  });
}
export function initTextInputContextMenu(_0x4ee9a6 = getDocument()) {
  if (!_0x4ee9a6?.addEventListener) return () => {};
  const _0x298321 = (_0x12d235) => {
    if (_0x12d235.defaultPrevented) return;
    const _0x22d7c7 = getEditableTextTarget(_0x12d235.target);
    if (!_0x22d7c7) return;
    (_0x12d235.preventDefault(), _0x12d235.stopPropagation());
    const _0x3cf874 = captureEditableSelection(_0x22d7c7);
    (_0x22d7c7.focus?.({ preventScroll: true }),
      showTextInputContextMenu({
        target: _0x22d7c7,
        screenX: _0x12d235.clientX || 0,
        screenY: _0x12d235.clientY || 0,
        snapshot: _0x3cf874,
      }));
  };
  return (
    _0x4ee9a6.addEventListener('contextmenu', _0x298321),
    () => {
      (_0x4ee9a6.removeEventListener('contextmenu', _0x298321), closeTextInputContextMenu());
    }
  );
}

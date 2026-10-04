import { t } from '../i18n/index.js';
const MENU_SELECTOR = '.v2-text-input-context-menu';
export const TEXT_CONTEXT_MENU_TARGET_SELECTOR =
  "input, textarea, [contenteditable]:not([contenteditable='false'])";
const TEXT_INPUT_TYPES = new Set(['', 'text', 'search', 'url', 'tel', 'email', 'password', 'number']);
function getWindow() {
  return globalThis.window || null;
}
function getDocument() {
  return globalThis.document || null;
}
function textInputContextMenuText(value, item = {}) {
  return t('textInputContextMenu.' + value, item);
}
function isInputElement(key) {
  return String(key?.tagName || '').toUpperCase() === 'INPUT';
}
function isTextAreaElement(index) {
  return String(index?.tagName || '').toUpperCase() === 'TEXTAREA';
}
function isContentEditableElement(result) {
  return (
    result?.isContentEditable === true ||
    String(result?.getAttribute?.('contenteditable') || '').toLowerCase() === 'true' ||
    String(result?.contentEditable || '').toLowerCase() === 'true'
  );
}
function isWritableTextInput(el) {
  if (!isInputElement(el)) return false;
  const data = String(el.type || '').toLowerCase();
  return TEXT_INPUT_TYPES.has(data) && !el.disabled && !el.readOnly;
}
function isWritableTextArea(el2) {
  return isTextAreaElement(el2) && !el2.disabled && !el2.readOnly;
}
export function getEditableTextTarget(el3) {
  if (!el3) return null;
  const options = el3.closest?.("input, textarea, [contenteditable='true']") || el3;
  if (isWritableTextInput(options) || isWritableTextArea(options) || isContentEditableElement(options))
    return options;
  return null;
}
export function isEditableTextTargetInGroupedNode(target, source = {}) {
  const el4 = getEditableTextTarget(target);
  if (!el4) return false;
  const el5 = el4.closest?.('.v2-node'),
    enabled = String(el5?.dataset?.nodeId || el5?.id || '').trim();
  if (!enabled) return false;
  const next = source?.[enabled],
    enabled2 = String(next?.parentId || '').trim();
  if (!enabled2) return false;
  return source?.[enabled2]?.type === 'group';
}
function closeTextInputContextMenu() {
  getDocument()
    ?.querySelectorAll?.(MENU_SELECTOR)
    ?.forEach((el6) => el6.remove());
}
function dispatchInputEvent(current) {
  const entry = current?.ownerDocument?.defaultView || getWindow(),
    handler = entry?.InputEvent || entry?.Event || globalThis.Event;
  if (typeof handler !== 'function' || typeof current?.dispatchEvent !== 'function') return;
  current.dispatchEvent(new handler('input', { bubbles: true }));
}
function clampSelection(record, payload) {
  const handle = Number(record);
  if (!Number.isFinite(handle)) return payload;
  return Math.max(0, Math.min(payload, handle));
}
function setFieldSelection(state, config, scope) {
  if (typeof state?.setSelectionRange !== 'function') return;
  try {
    state.setSelectionRange(config, scope);
  } catch {}
}
export function captureEditableSelection(el7) {
  if (isWritableTextInput(el7) || isWritableTextArea(el7)) {
    const input = String(el7.value || '').length;
    return {
      kind: 'field',
      start: clampSelection(el7.selectionStart, input),
      end: clampSelection(el7.selectionEnd, input),
    };
  }
  const dom = el7?.ownerDocument?.defaultView || getWindow(),
    enabled3 = dom?.getSelection?.();
  if (!enabled3 || enabled3.rangeCount === 0) return null;
  const range = enabled3.getRangeAt(0),
    output = range.commonAncestorContainer;
  if (!el7.contains?.(output)) return null;
  return { kind: 'contenteditable', range: range.cloneRange() };
}
function restoreEditableSelection(el8, enabled4) {
  if (!enabled4) return;
  if (enabled4.kind === 'field') {
    (el8.focus?.({ preventScroll: true }), setFieldSelection(el8, enabled4.start, enabled4.end));
    return;
  }
  if (enabled4.kind !== 'contenteditable' || !enabled4.range) return;
  el8.focus?.({ preventScroll: true });
  const dom2 = el8?.ownerDocument?.defaultView || getWindow(),
    enabled5 = dom2?.getSelection?.();
  if (!enabled5) return;
  (enabled5.removeAllRanges(), enabled5.addRange(enabled4.range));
}
function insertTextIntoField(el9, list, value2) {
  const list2 = String(el9.value || ''),
    clampSelection2 = clampSelection(value2?.start ?? el9.selectionStart, list2.length),
    clampSelection3 = clampSelection(value2?.end ?? el9.selectionEnd, list2.length);
  el9.focus?.({ preventScroll: true });
  if (typeof el9.setRangeText === 'function')
    try {
      el9.setRangeText(list, clampSelection2, clampSelection3, 'end');
    } catch (value3) {
      el9.value = list2.slice(0, clampSelection2) + list + list2.slice(clampSelection3);
      const value4 = clampSelection2 + list.length;
      setFieldSelection(el9, value4, value4);
    }
  else {
    el9.value = list2.slice(0, clampSelection2) + list + list2.slice(clampSelection3);
    const value5 = clampSelection2 + list.length;
    setFieldSelection(el9, value5, value5);
  }
  return (dispatchInputEvent(el9), true);
}
function insertTextIntoContentEditable(el10, value6, value7) {
  const dom3 = el10?.ownerDocument || getDocument();
  (el10.focus?.({ preventScroll: true }), restoreEditableSelection(el10, value7));
  if (typeof dom3?.execCommand === 'function')
    try {
      if (dom3.execCommand('insertText', false, value6)) return true;
    } catch {}
  const dom4 = dom3?.defaultView || getWindow(),
    value8 = dom4?.getSelection?.();
  if (value8 && value8.rangeCount > 0) {
    const value9 = value8.getRangeAt(0);
    value9.deleteContents();
    const value10 = dom3.createTextNode(String(value6 || ''));
    (value9.insertNode(value10),
      value9.setStartAfter(value10),
      value9.collapse(true),
      value8.removeAllRanges(),
      value8.addRange(value9));
  } else
    typeof el10.appendChild === 'function' && dom3?.createTextNode
      ? el10.appendChild(dom3.createTextNode(String(value6 || '')))
      : (el10.textContent = '' + (el10.textContent || '') + value6);
  return (dispatchInputEvent(el10), true);
}
export function insertPlainTextIntoEditable(value11, value12, value13 = null) {
  const editableTextTarget = getEditableTextTarget(value11);
  if (!editableTextTarget || typeof value12 !== 'string') return false;
  if (isWritableTextInput(editableTextTarget) || isWritableTextArea(editableTextTarget))
    return insertTextIntoField(editableTextTarget, value12, value13);
  if (isContentEditableElement(editableTextTarget))
    return insertTextIntoContentEditable(editableTextTarget, value12, value13);
  return false;
}
async function readClipboardText() {
  const value14 = globalThis.navigator?.clipboard?.readText;
  if (typeof value14 !== 'function') return null;
  return value14.call(globalThis.navigator.clipboard);
}
export async function pasteTextIntoEditableFromClipboard(value15, value16) {
  let clipboardText = null;
  try {
    clipboardText = await readClipboardText();
  } catch (value17) {
    return (getWindow()?.showToast?.(textInputContextMenuText('clipboardReadFailed'), 'error'), false);
  }
  if (typeof clipboardText !== 'string')
    return (getWindow()?.showToast?.(textInputContextMenuText('clipboardUnsupported'), 'error'), false);
  if (!clipboardText)
    return (getWindow()?.showToast?.(textInputContextMenuText('clipboardEmpty'), 'warn'), false);
  return insertPlainTextIntoEditable(value15, clipboardText, value16);
}
function placeMenu(el11, value18, value19) {
  const dom5 = getDocument(),
    window = getWindow();
  dom5?.body?.appendChild(el11);
  const value20 = el11.offsetWidth || 180,
    value21 = el11.offsetHeight || 44,
    value22 = window && value18 + value20 > window.innerWidth ? value18 - value20 : value18,
    value23 = window && value19 + value21 > window.innerHeight ? value19 - value21 : value19;
  ((el11.style.left = Math.max(0, value22) + 'px'), (el11.style.top = Math.max(0, value23) + 'px'));
}
export function showTextInputContextMenu({
  target: target2,
  screenX: screenX,
  screenY: screenY,
  snapshot: snapshot,
}) {
  const el12 = getDocument();
  if (!el12?.createElement) return;
  const value24 = snapshot === undefined ? captureEditableSelection(target2) : snapshot;
  (closeTextInputContextMenu(),
    el12.querySelectorAll?.('.v2-canvas-ctx-menu')?.forEach((el13) => el13.remove()));
  const el14 = el12.createElement('div');
  el14.className = 'v2-canvas-ctx-menu v2-text-input-context-menu';
  const el15 = el12.createElement('div');
  el15.className = 'v2-menu-row v2-menu-row-split';
  const el16 = el12.createElement('span');
  ((el16.textContent = textInputContextMenuText('pasteText')), el15.appendChild(el16));
  const el17 = el12.createElement('span');
  ((el17.className = 'v2-menu-kbd'),
    (el17.textContent = 'Ctrl V'),
    el15.appendChild(el17),
    el15.addEventListener('pointerdown', async (event) => {
      (event.preventDefault(),
        event.stopPropagation(),
        el14.remove(),
        restoreEditableSelection(target2, value24),
        await pasteTextIntoEditableFromClipboard(target2, value24));
    }),
    el14.appendChild(el15),
    placeMenu(el14, screenX, screenY));
  const value25 = (event2) => {
      if (el14.contains(event2.target)) return;
      (el14.remove(),
        el12.removeEventListener('pointerdown', value25, true),
        el12.removeEventListener('keydown', value26, true));
    },
    value26 = (event3) => {
      if (event3.key !== 'Escape') return;
      (el14.remove(),
        el12.removeEventListener('pointerdown', value25, true),
        el12.removeEventListener('keydown', value26, true));
    };
  getWindow()?.requestAnimationFrame?.(() => {
    (el12.addEventListener('pointerdown', value25, true), el12.addEventListener('keydown', value26, true));
  });
}
export function initTextInputContextMenu(el18 = getDocument()) {
  if (!el18?.addEventListener) return () => {};
  const value27 = (screenX2) => {
    if (screenX2.defaultPrevented) return;
    const target3 = getEditableTextTarget(screenX2.target);
    if (!target3) return;
    (screenX2.preventDefault(), screenX2.stopPropagation());
    const snapshot2 = captureEditableSelection(target3);
    (target3.focus?.({ preventScroll: true }),
      showTextInputContextMenu({
        target: target3,
        screenX: screenX2.clientX || 0,
        screenY: screenX2.clientY || 0,
        snapshot: snapshot2,
      }));
  };
  return (
    el18.addEventListener('contextmenu', value27),
    () => {
      (el18.removeEventListener('contextmenu', value27), closeTextInputContextMenu());
    }
  );
}

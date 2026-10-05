import { t } from '../i18n/index.js';
import { insertPlainTextAtSelection } from '../utils/editableText.js';
import { showContextMenu } from './interaction/contextMenuPresenter.js';
const MENU_SELECTOR = '.v2-text-input-context-menu';
export const TEXT_CONTEXT_MENU_TARGET_SELECTOR =
  "input, textarea, [contenteditable]:not([contenteditable='false'])";
let activeTextInputContextMenuSession = null;
const TEXT_INPUT_TYPES = new Set(['', 'text', 'search', 'url', 'tel', 'email', 'password']);
function getWindow() {
  return globalThis['window'] || null;
}
function getDocument() {
  return globalThis['document'] || null;
}
function textInputContextMenuText(value, item = {}) {
  return t('textInputContextMenu.' + value, item);
}
function isInputElement(key) {
  return String(key?.['tagName'] || '')['toUpperCase']() === 'INPUT';
}
function isTextAreaElement(index) {
  return String(index?.['tagName'] || '')['toUpperCase']() === 'TEXTAREA';
}
function isContentEditableElement(result) {
  if (result?.['isContentEditable'] === !![]) return !![];
  const data = result?.['getAttribute']?.('contenteditable');
  if (data !== null && data !== undefined) return String(data)['toLowerCase']() !== 'false';
  const options = String(result?.['contentEditable'] || '')['toLowerCase']();
  return options === 'true' || options === 'plaintext-only';
}
function isWritableTextInput(el) {
  if (!isInputElement(el)) return ![];
  const target = String(el['type'] || '')['toLowerCase']();
  return TEXT_INPUT_TYPES['has'](target) && !el['disabled'] && !el['readOnly'];
}
function isWritableTextArea(el2) {
  return isTextAreaElement(el2) && !el2['disabled'] && !el2['readOnly'];
}
function isSupportedTextInput(el3) {
  if (!isInputElement(el3) || el3['disabled']) return ![];
  return TEXT_INPUT_TYPES['has'](String(el3['type'] || '')['toLowerCase']());
}
function isSupportedTextArea(el4) {
  return isTextAreaElement(el4) && !el4['disabled'];
}
function getTextContextMenuTarget(el5) {
  if (!el5) return null;
  const source = el5['closest']?.(TEXT_CONTEXT_MENU_TARGET_SELECTOR) || el5;
  if (
    isSupportedTextInput(source) ||
    isSupportedTextArea(source) ||
    isContentEditableElement(source)
  )
    return source;
  return null;
}
function isSensitiveTextTarget(el6) {
  if (String(el6?.['type'] || '')['toLowerCase']() === 'password') return !![];
  const next = [
    el6?.['id'],
    el6?.['name'],
    el6?.['autocomplete'],
    el6?.['getAttribute']?.('aria-label'),
    el6?.['getAttribute']?.('title'),
    el6?.['getAttribute']?.('placeholder'),
    el6?.['dataset']?.['sensitive'],
  ]
    ['filter'](Boolean)
    ['join'](' ');
  return /(?:api[\s_-]*key|secret|access[\s_-]*token|password|密码|密钥|令牌)/iu['test'](next);
}
export function getEditableTextTarget(el7) {
  if (!el7) return null;
  const current = el7['closest']?.(TEXT_CONTEXT_MENU_TARGET_SELECTOR) || el7;
  if (isWritableTextInput(current) || isWritableTextArea(current) || isContentEditableElement(current))
    return current;
  return null;
}
export function isEditableTextTargetInGroupedNode(entry, record = {}) {
  const el8 = getEditableTextTarget(entry);
  if (!el8) return ![];
  const el9 = el8['closest']?.('.v2-node'),
    enabled = String(el9?.['dataset']?.['nodeId'] || el9?.['id'] || '')['trim']();
  if (!enabled) return ![];
  const payload = record?.[enabled],
    enabled2 = String(payload?.['parentId'] || '')['trim']();
  if (!enabled2) return ![];
  return record?.[enabled2]?.['type'] === 'group';
}
function closeTextInputContextMenu() {
  (activeTextInputContextMenuSession?.['close']?.(),
    (activeTextInputContextMenuSession = null),
    getDocument()
      ?.['querySelectorAll']?.(MENU_SELECTOR)
      ?.['forEach']((el10) => el10['remove']()));
}
function dispatchInputEvent(handle) {
  const state = handle?.['ownerDocument']?.['defaultView'] || getWindow(),
    handler = state?.['InputEvent'] || state?.['Event'] || globalThis['Event'];
  if (typeof handler !== 'function' || typeof handle?.['dispatchEvent'] !== 'function') return;
  handle['dispatchEvent'](new handler('input', { bubbles: !![] }));
}
function clampSelection(config, scope) {
  const input = Number(config);
  if (!Number['isFinite'](input)) return scope;
  return Math['max'](0, Math['min'](scope, input));
}
function setFieldSelection(output, value2, value3) {
  if (typeof output?.['setSelectionRange'] !== 'function') return;
  try {
    output['setSelectionRange'](value2, value3);
  } catch {}
}
export function captureEditableSelection(el11) {
  if (isSupportedTextInput(el11) || isSupportedTextArea(el11)) {
    const value4 = String(el11['value'] || '')['length'];
    return {
      kind: 'field',
      start: clampSelection(el11['selectionStart'], value4),
      end: clampSelection(el11['selectionEnd'], value4),
    };
  }
  const dom = el11?.['ownerDocument']?.['defaultView'] || getWindow(),
    enabled3 = dom?.['getSelection']?.();
  if (!enabled3 || enabled3['rangeCount'] === 0) return null;
  const range = enabled3['getRangeAt'](0),
    value5 = range['commonAncestorContainer'];
  if (!el11['contains']?.(value5)) return null;
  return { kind: 'contenteditable', range: range['cloneRange']() };
}
function getSelectedText(el12, value6) {
  if (value6?.['kind'] === 'field')
    return String(el12?.['value'] || '')['slice'](value6['start'], value6['end']);
  if (value6?.['kind'] === 'contenteditable') return String(value6['range']?.['toString']?.() || '');
  return '';
}
function getTargetText(el13) {
  if (isSupportedTextInput(el13) || isSupportedTextArea(el13))
    return String(el13?.['value'] || '');
  return String(el13?.['textContent'] || '');
}
function deleteEditableSelection(value7, enabled4) {
  const el14 = getEditableTextTarget(value7);
  if (!el14 || !enabled4) return ![];
  if (enabled4['kind'] === 'field') {
    const list = String(el14['value'] || ''),
      start = clampSelection(enabled4['start'], list['length']),
      end = clampSelection(enabled4['end'], list['length']);
    if (start === end) return ![];
    return insertTextIntoField(el14, '', { kind: 'field', start: start, end: end });
  }
  if (enabled4['kind'] !== 'contenteditable' || !enabled4['range']) return ![];
  return (
    restoreEditableSelection(el14, enabled4),
    enabled4['range']['deleteContents']?.(),
    dispatchInputEvent(el14),
    !![]
  );
}
function selectAllEditableText(el15) {
  if (isSupportedTextInput(el15) || isSupportedTextArea(el15))
    return (
      el15['focus']?.({ preventScroll: !![] }),
      setFieldSelection(el15, 0, String(el15['value'] || '')['length']),
      !![]
    );
  if (!isContentEditableElement(el15)) return ![];
  const dom2 = el15['ownerDocument'] || getDocument(),
    enabled5 = dom2?.['defaultView']?.['getSelection']?.() || getWindow()?.['getSelection']?.(),
    enabled6 = dom2?.['createRange']?.();
  if (!enabled5 || !enabled6) return ![];
  return (
    el15['focus']?.({ preventScroll: !![] }),
    enabled6['selectNodeContents'](el15),
    enabled5['removeAllRanges'](),
    enabled5['addRange'](enabled6),
    !![]
  );
}
async function writeClipboardText(value8) {
  const value9 = globalThis['navigator']?.['clipboard']?.['writeText'];
  if (typeof value9 !== 'function') return ![];
  try {
    return (await value9['call'](globalThis['navigator']['clipboard'], value8), !![]);
  } catch (value10) {
    return (getWindow()?.['showToast']?.(textInputContextMenuText('clipboardWriteFailed'), 'error'), ![]);
  }
}
async function copyEditableSelection(value11, value12) {
  const selectedText = getSelectedText(value11, value12);
  if (!selectedText) return ![];
  return (restoreEditableSelection(value11, value12), writeClipboardText(selectedText));
}
async function cutEditableSelection(value13, value14) {
  if (!(await copyEditableSelection(value13, value14))) return ![];
  return deleteEditableSelection(value13, value14);
}
function undoEditableChange(value15, value16) {
  const dom3 = value15?.['ownerDocument'] || getDocument();
  if (dom3?.['queryCommandSupported']?.('undo') !== !![]) return ![];
  restoreEditableSelection(value15, value16);
  try {
    return dom3['execCommand']?.('undo') === !![];
  } catch (value17) {
    return ![];
  }
}
function restoreEditableSelection(el16, enabled7) {
  if (!enabled7) return;
  if (enabled7['kind'] === 'field') {
    (el16['focus']?.({ preventScroll: !![] }),
      setFieldSelection(el16, enabled7['start'], enabled7['end']));
    return;
  }
  if (enabled7['kind'] !== 'contenteditable' || !enabled7['range']) return;
  el16['focus']?.({ preventScroll: !![] });
  const dom4 = el16?.['ownerDocument']?.['defaultView'] || getWindow(),
    enabled8 = dom4?.['getSelection']?.();
  if (!enabled8) return;
  (enabled8['removeAllRanges'](), enabled8['addRange'](enabled7['range']));
}
function insertTextIntoField(el17, list2, value18) {
  const list3 = String(el17['value'] || ''),
    clampSelection2 = clampSelection(value18?.['start'] ?? el17['selectionStart'], list3['length']),
    clampSelection3 = clampSelection(value18?.['end'] ?? el17['selectionEnd'], list3['length']);
  el17['focus']?.({ preventScroll: !![] });
  if (typeof el17['setRangeText'] === 'function')
    try {
      el17['setRangeText'](list2, clampSelection2, clampSelection3, 'end');
    } catch (value19) {
      el17['value'] = list3['slice'](0, clampSelection2) + list2 + list3['slice'](clampSelection3);
      const value20 = clampSelection2 + list2['length'];
      setFieldSelection(el17, value20, value20);
    }
  else {
    el17['value'] = list3['slice'](0, clampSelection2) + list2 + list3['slice'](clampSelection3);
    const value21 = clampSelection2 + list2['length'];
    setFieldSelection(el17, value21, value21);
  }
  return (dispatchInputEvent(el17), !![]);
}
function insertTextIntoContentEditable(el18, value22, value23) {
  const documentObject = el18?.['ownerDocument'] || getDocument();
  (el18['focus']?.({ preventScroll: !![] }), restoreEditableSelection(el18, value23));
  const value24 = documentObject?.['defaultView'];
  if (value24?.['ClipboardEvent'] && value24?.['DataTransfer']) {
    const clipboardData = new value24['DataTransfer']();
    clipboardData['setData']('text/plain', value22);
    const value25 = new value24['ClipboardEvent']('paste', {
      bubbles: !![],
      cancelable: !![],
      clipboardData: clipboardData,
    });
    el18['dispatchEvent'](value25);
    if (value25['defaultPrevented']) return !![];
  }
  if (insertPlainTextAtSelection(value22, { documentObject: documentObject })) return !![];
  const dom5 = documentObject?.['defaultView'] || getWindow(),
    value26 = dom5?.['getSelection']?.();
  if (value26 && value26['rangeCount'] > 0) {
    const value27 = value26['getRangeAt'](0);
    value27['deleteContents']();
    const value28 = documentObject['createTextNode'](String(value22 || ''));
    (value27['insertNode'](value28),
      value27['setStartAfter'](value28),
      value27['collapse'](!![]),
      value26['removeAllRanges'](),
      value26['addRange'](value27));
  } else
    typeof el18['appendChild'] === 'function' && documentObject?.['createTextNode']
      ? el18['appendChild'](documentObject['createTextNode'](String(value22 || '')))
      : (el18['textContent'] = '' + (el18['textContent'] || '') + value22);
  return (dispatchInputEvent(el18), !![]);
}
export function insertPlainTextIntoEditable(value29, value30, value31 = null) {
  const editableTextTarget = getEditableTextTarget(value29);
  if (!editableTextTarget || typeof value30 !== 'string') return ![];
  if (isWritableTextInput(editableTextTarget) || isWritableTextArea(editableTextTarget))
    return insertTextIntoField(editableTextTarget, value30, value31);
  if (isContentEditableElement(editableTextTarget))
    return insertTextIntoContentEditable(editableTextTarget, value30, value31);
  return ![];
}
async function readClipboardText() {
  const value32 = globalThis['navigator']?.['clipboard']?.['readText'];
  if (typeof value32 !== 'function') return null;
  return value32['call'](globalThis['navigator']['clipboard']);
}
export async function pasteTextIntoEditableFromClipboard(value33, value34) {
  let clipboardText = null;
  try {
    clipboardText = await readClipboardText();
  } catch (value35) {
    return (getWindow()?.['showToast']?.(textInputContextMenuText('clipboardReadFailed'), 'error'), ![]);
  }
  if (typeof clipboardText !== 'string')
    return (getWindow()?.['showToast']?.(textInputContextMenuText('clipboardUnsupported'), 'error'), ![]);
  if (!clipboardText)
    return (getWindow()?.['showToast']?.(textInputContextMenuText('clipboardEmpty'), 'warn'), ![]);
  return insertPlainTextIntoEditable(value33, clipboardText, value34);
}
export function showTextInputContextMenu({
  target: target2,
  screenX: screenX,
  screenY: screenY,
  snapshot: snapshot,
}) {
  const el19 = getDocument();
  if (!el19?.['createElement']) return null;
  const ownerElement = getTextContextMenuTarget(target2);
  if (!ownerElement) return null;
  const value36 = snapshot === undefined ? captureEditableSelection(target2) : snapshot;
  closeTextInputContextMenu();
  const value37 = !!getEditableTextTarget(ownerElement),
    isSensitiveTextTarget2 = isSensitiveTextTarget(ownerElement),
    value38 = typeof globalThis['navigator']?.['clipboard']?.['writeText'] === 'function',
    selectedText2 = getSelectedText(ownerElement, value36),
    list4 = [];
  value37 &&
    el19['queryCommandSupported']?.('undo') === !![] &&
    list4['push']({
      label: textInputContextMenuText('undo'),
      icon: 'undo',
      kbd: 'Ctrl Z',
      shortcutActionId: 'undo',
      action: () => undoEditableChange(ownerElement, value36),
    });
  selectedText2 &&
    !isSensitiveTextTarget2 &&
    value38 &&
    (value37 &&
      list4['push']({
        label: textInputContextMenuText('cut'),
        icon: 'cut',
        kbd: 'Ctrl X',
        shortcutActionId: 'cut',
        action: () => void cutEditableSelection(ownerElement, value36),
      }),
    list4['push']({
      label: textInputContextMenuText('copy'),
      icon: 'copy',
      kbd: 'Ctrl C',
      shortcutActionId: 'copy',
      action: () => void copyEditableSelection(ownerElement, value36),
    }));
  value37 &&
    (list4['push']({
      label: textInputContextMenuText('pasteText'),
      icon: 'paste',
      kbd: 'Ctrl V',
      shortcutActionId: 'paste',
      action: () => {
        (restoreEditableSelection(ownerElement, value36),
          void pasteTextIntoEditableFromClipboard(ownerElement, value36));
      },
    }),
    selectedText2 &&
      list4['push']({
        label: textInputContextMenuText('delete'),
        icon: 'delete',
        shortcutActionId: 'delete',
        action: () => deleteEditableSelection(ownerElement, value36),
      }));
  if (getTargetText(ownerElement)) {
    if (list4['length'] > 0) list4['push']('sep');
    list4['push']({
      label: textInputContextMenuText('selectAll'),
      icon: 'select-all',
      kbd: 'Ctrl A',
      shortcutActionId: 'select-all',
      action: () => selectAllEditableText(ownerElement),
    });
  }
  if (list4['length'] === 0) return null;
  return (
    (activeTextInputContextMenuSession = showContextMenu(screenX, screenY, list4, {
      className: 'v2-canvas-ctx-menu v2-text-input-context-menu',
      ensureItemIcons: !![],
      ownerElement: ownerElement,
      ownerRoot: ownerElement['parentElement'] || ownerElement,
      autoFocus: ![],
    })),
    activeTextInputContextMenuSession
  );
}
export function initTextInputContextMenu(el20 = getDocument()) {
  if (!el20?.['addEventListener']) return () => {};
  const value39 = (screenX2) => {
    if (screenX2['defaultPrevented']) return;
    const target3 = getTextContextMenuTarget(screenX2['target']);
    if (!target3) return;
    (screenX2['preventDefault'](), screenX2['stopPropagation']());
    const snapshot2 = captureEditableSelection(target3);
    (target3['focus']?.({ preventScroll: !![] }),
      showTextInputContextMenu({
        target: target3,
        screenX: screenX2['clientX'] || 0,
        screenY: screenX2['clientY'] || 0,
        snapshot: snapshot2,
      }));
  };
  return (
    el20['addEventListener']('contextmenu', value39),
    () => {
      (el20['removeEventListener']('contextmenu', value39), closeTextInputContextMenu());
    }
  );
}

const WORKSPACE_STEP_SHORTCUT_EDITABLE_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable=\x22true\x22]',
  '[contenteditable=\x22plaintext-only\x22]',
  '[role="textbox"]',
  '[role=\x22dialog\x22]',
  '[aria-modal=\x22true\x22]',
]['join'](',');
function isEditableShortcutTarget(_0x4c73b8) {
  return Boolean(
    _0x4c73b8?.['isContentEditable'] || _0x4c73b8?.['closest']?.(WORKSPACE_STEP_SHORTCUT_EDITABLE_SELECTOR),
  );
}
export function resolveWorkspaceStepShortcut(_0x23d9e8, _0x13b691) {
  if (
    !_0x23d9e8 ||
    _0x23d9e8['defaultPrevented'] ||
    _0x23d9e8['isComposing'] ||
    _0x23d9e8['repeat'] ||
    _0x23d9e8['ctrlKey'] ||
    _0x23d9e8['metaKey'] ||
    _0x23d9e8['altKey'] ||
    _0x23d9e8['shiftKey'] ||
    isEditableShortcutTarget(_0x23d9e8['target'])
  )
    return 0x0;
  const _0x57bd43 = String(_0x23d9e8['key'] || ''),
    _0x753a0 = /^[1-9]$/['test'](_0x57bd43) ? Number(_0x57bd43) : 0x0,
    _0x3ca4f9 = Math['max'](0x0, Math['trunc'](Number(_0x13b691) || 0x0));
  return _0x753a0 <= _0x3ca4f9 ? _0x753a0 : 0x0;
}
export function handleWorkspaceStepShortcut(
  _0x4f259b,
  { enabled: enabled = !![], stepCount: stepCount = 0x0, navigate: _0x1909a0 } = {},
) {
  if (!enabled) return ![];
  const _0x5ab3ea = resolveWorkspaceStepShortcut(_0x4f259b, stepCount);
  if (!_0x5ab3ea) return ![];
  return (_0x4f259b['preventDefault']?.(), _0x4f259b['stopPropagation']?.(), _0x1909a0?.(_0x5ab3ea), !![]);
}

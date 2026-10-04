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
function isEditableShortcutTarget(el) {
  return Boolean(el?.['isContentEditable'] || el?.['closest']?.(WORKSPACE_STEP_SHORTCUT_EDITABLE_SELECTOR));
}
export function resolveWorkspaceStepShortcut(event, value) {
  if (
    !event ||
    event['defaultPrevented'] ||
    event['isComposing'] ||
    event['repeat'] ||
    event['ctrlKey'] ||
    event['metaKey'] ||
    event['altKey'] ||
    event['shiftKey'] ||
    isEditableShortcutTarget(event['target'])
  )
    return 0x0;
  const item = String(event['key'] || ''),
    key = /^[1-9]$/['test'](item) ? Number(item) : 0x0,
    index = Math['max'](0x0, Math['trunc'](Number(value) || 0x0));
  return key <= index ? key : 0x0;
}
export function handleWorkspaceStepShortcut(
  event2,
  { enabled: enabled = !![], stepCount: stepCount = 0x0, navigate: navigate } = {},
) {
  if (!enabled) return ![];
  const workspaceStepShortcut = resolveWorkspaceStepShortcut(event2, stepCount);
  if (!workspaceStepShortcut) return ![];
  return (
    event2['preventDefault']?.(),
    event2['stopPropagation']?.(),
    navigate?.(workspaceStepShortcut),
    !![]
  );
}

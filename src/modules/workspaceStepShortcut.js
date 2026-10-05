const WORKSPACE_STEP_SHORTCUT_EDITABLE_SELECTOR = [
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[contenteditable="plaintext-only"]',
  '[role="textbox"]',
  '[role="dialog"]',
  '[aria-modal="true"]',
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
    return 0;
  const item = String(event['key'] || ''),
    key = /^[1-9]$/['test'](item) ? Number(item) : 0,
    index = Math['max'](0, Math['trunc'](Number(value) || 0));
  return key <= index ? key : 0;
}
export function handleWorkspaceStepShortcut(
  event2,
  { enabled: enabled = true, stepCount: stepCount = 0, navigate: navigate } = {},
) {
  if (!enabled) return false;
  const workspaceStepShortcut = resolveWorkspaceStepShortcut(event2, stepCount);
  if (!workspaceStepShortcut) return false;
  return (
    event2['preventDefault']?.(),
    event2['stopPropagation']?.(),
    navigate?.(workspaceStepShortcut),
    true
  );
}

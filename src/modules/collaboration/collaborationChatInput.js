import { hasActiveModalInteraction } from '../../services/modalInteractionScope.js';
export function bindCollaborationChatInput({
  chat: chat,
  store: store,
  resolveShortcutActionForEvent: resolveShortcutActionForEvent,
  isRecording: isRecording,
  windowObject: windowObject = window,
}) {
  const run = (el) => el?.closest?.("input, textarea, [contenteditable='true'], [role='textbox']");
  function run2(value) {
    if (
      value.detail === 'collaboration-chat-add-selection' &&
      !isRecording() &&
      !hasActiveModalInteraction()
    )
      chat.addNodes([...(store.getStateRaw().selectedNodeIds || [])]);
  }
  let value2 = null;
  function run3(event) {
    value2 = null;
    if (
      !chat.isOpen() ||
      event.button !== 0 ||
      isRecording() ||
      hasActiveModalInteraction() ||
      run(event.target)
    )
      return;
    if (!resolveShortcutActionForEvent(event, ['collaboration-chat-pick-node'])) return;
    const enabled = event.target?.closest?.('.v2-node');
    if (!enabled || !store.getStateRaw().nodes[enabled.id]) return;
    chat.addNodes([enabled.id]) &&
      ((value2 = enabled), event.preventDefault(), event.stopImmediatePropagation());
  }
  function run4(event2) {
    value2?.contains(event2.target) &&
      ((value2 = null), event2.preventDefault(), event2.stopImmediatePropagation());
  }
  function run5() {
    value2 = null;
  }
  return (
    windowObject.addEventListener('shortcut-action', run2),
    windowObject.addEventListener('pointerdown', run3, true),
    windowObject.addEventListener('click', run4, true),
    windowObject.addEventListener('blur', run5),
    () => {
      (windowObject.removeEventListener('shortcut-action', run2),
        windowObject.removeEventListener('pointerdown', run3, true),
        windowObject.removeEventListener('click', run4, true),
        windowObject.removeEventListener('blur', run5));
    }
  );
}

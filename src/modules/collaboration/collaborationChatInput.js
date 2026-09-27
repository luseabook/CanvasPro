import { hasActiveModalInteraction } from '../../services/modalInteractionScope.js';
export function bindCollaborationChatInput({
  chat: _0x206e7a,
  store: _0x55d260,
  resolveShortcutActionForEvent: _0x22bed0,
  isRecording: _0x397522,
  windowObject: windowObject = window,
}) {
  const _0x2ab5cd = (_0x1c6728) =>
    _0x1c6728?.['closest']?.("input, textarea, [contenteditable='true'], [role='textbox']");
  function _0x3f228e(_0x27316b) {
    if (
      _0x27316b['detail'] === 'collaboration-chat-add-selection' &&
      !_0x397522() &&
      !hasActiveModalInteraction()
    )
      _0x206e7a['addNodes']([...(_0x55d260['getStateRaw']()['selectedNodeIds'] || [])]);
  }
  let _0x32f746 = null;
  function _0x3df361(_0x523315) {
    _0x32f746 = null;
    if (
      !_0x206e7a['isOpen']() ||
      _0x523315['button'] !== 0x0 ||
      _0x397522() ||
      hasActiveModalInteraction() ||
      _0x2ab5cd(_0x523315['target'])
    )
      return;
    if (!_0x22bed0(_0x523315, ['collaboration-chat-pick-node'])) return;
    const _0x5e1865 = _0x523315['target']?.['closest']?.('.v2-node');
    if (!_0x5e1865 || !_0x55d260['getStateRaw']()['nodes'][_0x5e1865['id']]) return;
    _0x206e7a['addNodes']([_0x5e1865['id']]) &&
      ((_0x32f746 = _0x5e1865), _0x523315['preventDefault'](), _0x523315['stopImmediatePropagation']());
  }
  function _0x190c1a(_0x1574e9) {
    _0x32f746?.['contains'](_0x1574e9['target']) &&
      ((_0x32f746 = null), _0x1574e9['preventDefault'](), _0x1574e9['stopImmediatePropagation']());
  }
  function _0x34b469() {
    _0x32f746 = null;
  }
  return (
    windowObject['addEventListener']('shortcut-action', _0x3f228e),
    windowObject['addEventListener']('pointerdown', _0x3df361, !![]),
    windowObject['addEventListener']('click', _0x190c1a, !![]),
    windowObject['addEventListener']('blur', _0x34b469),
    () => {
      (windowObject['removeEventListener']('shortcut-action', _0x3f228e),
        windowObject['removeEventListener']('pointerdown', _0x3df361, !![]),
        windowObject['removeEventListener']('click', _0x190c1a, !![]),
        windowObject['removeEventListener']('blur', _0x34b469));
    }
  );
}

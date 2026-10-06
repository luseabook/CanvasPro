const _compositionTriggerStateByElement = new WeakMap();
export function shouldSkipPromptTriggerForBulkInput(value) {
  const item = String(value?.inputType || '');
  if (
    item === 'insertFromPaste' ||
    item === 'insertFromDrop' ||
    item === 'insertReplacementText' ||
    item === 'insertHTML'
  )
    return true;
  return typeof value?.data === 'string' && value.data.length > 1;
}
function _getCompositionTriggerState(el) {
  let key = _compositionTriggerStateByElement.get(el);
  if (key) return key;
  return (
    (key = { pending: new Map(), timer: 0 }),
    el.addEventListener('compositionend', () => {
      if (key.timer) clearTimeout(key.timer);
      key.timer = setTimeout(() => {
        key.timer = 0;
        const list = Array.from(key.pending.values());
        (key.pending.clear(), list.forEach((handler) => handler()));
      }, 0);
    }),
    _compositionTriggerStateByElement.set(el, key),
    key
  );
}
export function deferPromptTriggerUntilCompositionEnd({
  event: event,
  promptEl: promptEl,
  triggerKey: triggerKey,
  onCompositionEnd: onCompositionEnd,
}) {
  const enabled = event?.isComposing === true || event?.inputType === 'insertCompositionText',
    index = promptEl ? _compositionTriggerStateByElement.get(promptEl) : null;
  if (!enabled) return (index?.pending.delete(triggerKey), false);
  if (!promptEl?.addEventListener || typeof onCompositionEnd !== 'function') return true;
  const result = index || _getCompositionTriggerState(promptEl);
  return (
    result.timer && (clearTimeout(result.timer), (result.timer = 0)),
    result.pending.set(triggerKey, onCompositionEnd),
    true
  );
}

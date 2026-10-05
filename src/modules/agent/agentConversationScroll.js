export function scrollAgentMessageListToEnd(value) {
  scrollAgentMessageListTo(value, value?.['scrollHeight'] || 0);
}
export function scrollAgentMessageListTo(el, item) {
  if (!el) return;
  const key = el['style']?.['scrollBehavior'] || '';
  if (el['style']) el['style']['scrollBehavior'] = 'auto';
  el['scrollTop'] = item;
  if (!el['style']) return;
  if (key) el['style']['scrollBehavior'] = key;
  else
    typeof el['style']['removeProperty'] === 'function'
      ? el['style']['removeProperty']('scroll-behavior')
      : (el['style']['scrollBehavior'] = '');
}

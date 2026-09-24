export function scrollAgentMessageListToEnd(_0x1c81a1) {
  scrollAgentMessageListTo(_0x1c81a1, _0x1c81a1?.['scrollHeight'] || 0x0);
}
export function scrollAgentMessageListTo(_0x546be1, _0x3f8d11) {
  if (!_0x546be1) return;
  const _0x935dc7 = _0x546be1['style']?.['scrollBehavior'] || '';
  if (_0x546be1['style']) _0x546be1['style']['scrollBehavior'] = 'auto';
  _0x546be1['scrollTop'] = _0x3f8d11;
  if (!_0x546be1['style']) return;
  if (_0x935dc7) _0x546be1['style']['scrollBehavior'] = _0x935dc7;
  else
    typeof _0x546be1['style']['removeProperty'] === 'function'
      ? _0x546be1['style']['removeProperty']('scroll-behavior')
      : (_0x546be1['style']['scrollBehavior'] = '');
}

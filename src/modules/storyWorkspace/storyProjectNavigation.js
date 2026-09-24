export function openStoryProjectPage(
  { state: _0x13aac4, canEnterStep: _0x16f2c2, render: _0x15ef9d },
  { resetStep: resetStep = ![], restoreView: restoreView = ![] } = {},
) {
  if (!restoreView || !['project', 'episode']['includes'](_0x13aac4['view'])) _0x13aac4['view'] = 'project';
  if (
    resetStep ||
    (_0x13aac4['step'] > 0x0 && _0x13aac4['data']?.['project']?.['outlineStatus'] === 'stale') ||
    !_0x16f2c2(_0x13aac4['data'], _0x13aac4['step'])
  )
    _0x13aac4['step'] =
      _0x13aac4['data']?.['project']?.['collaboration']?.['stage'] === 'writing' ? 0x0 : 0x1;
  if (_0x13aac4['view'] === 'episode' && !_0x16f2c2(_0x13aac4['data'], 0x3)) _0x13aac4['view'] = 'project';
  _0x15ef9d({ direction: 'forward' });
}

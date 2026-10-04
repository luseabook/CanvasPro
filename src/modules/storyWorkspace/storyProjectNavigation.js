export function openStoryProjectPage(
  { state: state, canEnterStep: canEnterStep, render: render },
  { resetStep: resetStep = ![], restoreView: restoreView = ![] } = {},
) {
  if (!restoreView || !['project', 'episode']['includes'](state['view'])) state['view'] = 'project';
  if (
    resetStep ||
    (state['step'] > 0x0 && state['data']?.['project']?.['outlineStatus'] === 'stale') ||
    !canEnterStep(state['data'], state['step'])
  )
    state['step'] = state['data']?.['project']?.['collaboration']?.['stage'] === 'writing' ? 0x0 : 0x1;
  if (state['view'] === 'episode' && !canEnterStep(state['data'], 0x3)) state['view'] = 'project';
  render({ direction: 'forward' });
}

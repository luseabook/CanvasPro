export function openStoryProjectPage(
  { state: state, canEnterStep: canEnterStep, render: render },
  { resetStep: resetStep = false, restoreView: restoreView = false } = {},
) {
  if (!restoreView || !['project', 'episode'].includes(state.view)) state.view = 'project';
  if (
    resetStep ||
    (state.step > 0 && state.data?.project?.outlineStatus === 'stale') ||
    !canEnterStep(state.data, state.step)
  )
    state.step = state.data?.project?.collaboration?.stage === 'writing' ? 0 : 1;
  if (state.view === 'episode' && !canEnterStep(state.data, 3)) state.view = 'project';
  render({ direction: 'forward' });
}

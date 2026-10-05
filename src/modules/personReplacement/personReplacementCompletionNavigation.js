export function createPersonReplacementCompletionNavigation({
  getProject: getProject,
  getProjects: getProjects,
  openProject: openProject,
  setProject: setProject,
  showProject: showProject,
  showToast: showToast,
}) {
  return (options = {}) => {
    const enabled = String(options['projectId'] || '')['trim']();
    if (!enabled) return false;
    if (getProject()['id'] !== enabled) {
      if (!getProjects()['some']((value) => value['id'] === enabled))
        return (showToast('对应的替换工作室项目已不存在。', 'warn'), false);
      if (!openProject(enabled)) return false;
    }
    const args = getProject(),
      step = Math['max'](1, Math['min'](5, Math['trunc'](Number(options['step']) || 1)));
    return (setProject({ ...args, workspace: { ...args['workspace'], step: step } }), showProject(), true);
  };
}

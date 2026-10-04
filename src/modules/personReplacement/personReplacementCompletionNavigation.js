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
    if (!enabled) return ![];
    if (getProject()['id'] !== enabled) {
      if (!getProjects()['some']((value) => value['id'] === enabled))
        return (showToast('对应的替换工作室项目已不存在。', 'warn'), ![]);
      if (!openProject(enabled)) return ![];
    }
    const args = getProject(),
      step = Math['max'](0x1, Math['min'](0x5, Math['trunc'](Number(options['step']) || 0x1)));
    return (setProject({ ...args, workspace: { ...args['workspace'], step: step } }), showProject(), !![]);
  };
}

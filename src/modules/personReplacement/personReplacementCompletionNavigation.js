export function createPersonReplacementCompletionNavigation({
  getProject: _0xfcd3e7,
  getProjects: _0x2f2815,
  openProject: _0x2d8369,
  setProject: _0x5b2cb1,
  showProject: _0x2de589,
  showToast: _0x142d66,
}) {
  return (_0x24a1b7 = {}) => {
    const _0x557217 = String(_0x24a1b7['projectId'] || '')['trim']();
    if (!_0x557217) return ![];
    if (_0xfcd3e7()['id'] !== _0x557217) {
      if (!_0x2f2815()['some']((_0x522eb9) => _0x522eb9['id'] === _0x557217))
        return (_0x142d66('对应的替换工作室项目已不存在。', 'warn'), ![]);
      if (!_0x2d8369(_0x557217)) return ![];
    }
    const _0x2a5663 = _0xfcd3e7(),
      _0x1eb6dc = Math['max'](0x1, Math['min'](0x5, Math['trunc'](Number(_0x24a1b7['step']) || 0x1)));
    return (
      _0x5b2cb1({ ..._0x2a5663, workspace: { ..._0x2a5663['workspace'], step: _0x1eb6dc } }),
      _0x2de589(),
      !![]
    );
  };
}

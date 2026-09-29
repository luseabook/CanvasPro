export function cloneStoryboard3DProjects(_0xcbf9e9, _0xa4f048) {
  return Array['isArray'](_0xcbf9e9) ? _0xa4f048(_0xcbf9e9) : [];
}
export function createStoryboard3DProjectActions({
  readProjects: _0x3faf1a,
  writeProjects: _0x50c087,
  clone: _0x80e43,
} = {}) {
  function _0x48272f(_0x150a5b) {
    const _0x1e7085 = String(_0x150a5b?.['id'] || '')['trim']();
    if (!_0x1e7085) throw new Error('[store]\x20upsertStoryboard3DProject()\x20需要项目\x20id');
    const _0x515580 = _0x80e43(_0x150a5b),
      _0xfe519f = Array['isArray'](_0x3faf1a()) ? [..._0x3faf1a()] : [],
      _0x45cfcf = _0xfe519f['findIndex']((_0x597451) => String(_0x597451?.['id'] || '') === _0x1e7085);
    if (_0x45cfcf >= 0x0) _0xfe519f[_0x45cfcf] = _0x515580;
    else _0xfe519f['unshift'](_0x515580);
    return (_0x50c087(_0xfe519f), _0x80e43(_0x515580));
  }
  function _0x55dfa2(_0x57a651) {
    const _0x113aea = String(_0x57a651 || '')['trim'](),
      _0x5a5d40 = _0x3faf1a();
    if (!_0x113aea || !Array['isArray'](_0x5a5d40)) return ![];
    const _0x1dcb1d = _0x5a5d40['filter']((_0x2e88f8) => String(_0x2e88f8?.['id'] || '') !== _0x113aea);
    if (_0x1dcb1d['length'] === _0x5a5d40['length']) return ![];
    return (_0x50c087(_0x1dcb1d), !![]);
  }
  return { upsertStoryboard3DProject: _0x48272f, deleteStoryboard3DProject: _0x55dfa2 };
}

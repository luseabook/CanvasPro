function cloneViewport(_0xe36229) {
  return _0xe36229 && typeof _0xe36229 === 'object' ? { ..._0xe36229 } : null;
}
export function createViewportPreviewCoordinator({
  beginPreview: _0x97f435,
  updatePreview: _0x3e3ee3,
  flushPreview: _0x511d9b,
  getPreview: _0x44ec99,
  isPreviewActive: _0x27d554,
} = {}) {
  let _0x411362 = null,
    _0x868752 = null;
  function _0x4ad421(_0x290883, _0x42dd55) {
    if (!_0x290883) return null;
    if (_0x411362 === _0x290883) return cloneViewport(_0x868752 || _0x44ec99?.() || _0x42dd55);
    if (_0x411362 === null && _0x27d554?.()) return null;
    const _0x1ce641 = cloneViewport(_0x868752 || _0x44ec99?.() || _0x42dd55);
    if (!_0x1ce641) return null;
    return (
      (_0x411362 = _0x290883),
      (_0x868752 = _0x1ce641),
      _0x97f435?.(_0x1ce641),
      cloneViewport(_0x1ce641)
    );
  }
  function _0x9126c5(_0x408159, _0x326c91) {
    if (_0x408159 !== _0x411362 || !_0x326c91) return ![];
    return ((_0x868752 = cloneViewport(_0x326c91)), _0x3e3ee3?.(_0x868752), !![]);
  }
  function _0x4e4891(_0x424f14) {
    if (_0x424f14 !== _0x411362) return null;
    const _0x3d0e90 = cloneViewport(_0x868752),
      _0x255a44 = cloneViewport(_0x511d9b?.());
    return ((_0x411362 = null), (_0x868752 = null), _0x255a44 || _0x3d0e90);
  }
  return {
    acquire: _0x4ad421,
    update: _0x9126c5,
    commit: _0x4e4891,
    getActiveOwner() {
      return _0x411362;
    },
  };
}

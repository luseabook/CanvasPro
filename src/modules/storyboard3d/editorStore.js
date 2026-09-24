function cloneEditorState(_0x359a8c) {
  return { ..._0x359a8c, selectedObjectIds: [..._0x359a8c['selectedObjectIds']] };
}
export function createStoryboard3DEditorStore(_0xa3641a = {}) {
  const _0x436f13 = new Set();
  let _0x50ecd3 = {
    selectedObjectIds: [],
    activeTool: 'select',
    assetLibraryOpen: ![],
    inspectorOpen: ![],
    inspectorTab: 'properties',
    objectOutlineOpen: ![],
    flyMode: ![],
    ..._0xa3641a,
  };
  _0x50ecd3['selectedObjectIds'] = Array['isArray'](_0x50ecd3['selectedObjectIds'])
    ? [
        ...new Set(
          _0x50ecd3['selectedObjectIds']
            ['map']((_0x5c69c0) => String(_0x5c69c0 || '')['trim']())
            ['filter'](Boolean),
        ),
      ]
    : [];
  function _0x400664(_0x816c84) {
    const _0x4504b3 = cloneEditorState(_0x50ecd3);
    return (_0x436f13['forEach']((_0x391385) => _0x391385(_0x4504b3, { reason: _0x816c84 })), _0x4504b3);
  }
  return {
    getSnapshot() {
      return cloneEditorState(_0x50ecd3);
    },
    subscribe(_0x2f1f54) {
      if (typeof _0x2f1f54 !== 'function') return () => {};
      return (_0x436f13['add'](_0x2f1f54), () => _0x436f13['delete'](_0x2f1f54));
    },
    setSelectedObjects(_0x454843) {
      return (
        (_0x50ecd3 = {
          ..._0x50ecd3,
          selectedObjectIds: Array['isArray'](_0x454843)
            ? [
                ...new Set(
                  _0x454843['map']((_0x523ef7) => String(_0x523ef7 || '')['trim']())['filter'](Boolean),
                ),
              ]
            : [],
        }),
        _0x400664('select-objects')
      );
    },
    setActiveTool(_0x42d018) {
      return (
        (_0x50ecd3 = {
          ..._0x50ecd3,
          activeTool: ['select', 'move', 'rotate', 'scale']['includes'](_0x42d018) ? _0x42d018 : 'select',
        }),
        _0x400664('set-tool')
      );
    },
    setAssetLibraryOpen(_0x183102) {
      return (
        (_0x50ecd3 = { ..._0x50ecd3, assetLibraryOpen: _0x183102 === !![] }),
        _0x400664(_0x183102 === !![] ? 'open-asset-library' : 'close-asset-library')
      );
    },
    setInspectorOpen(_0x531b2a) {
      return (
        (_0x50ecd3 = { ..._0x50ecd3, inspectorOpen: _0x531b2a === !![] }),
        _0x400664('toggle-inspector')
      );
    },
    setInspectorTab(_0x1de395) {
      return (
        (_0x50ecd3 = {
          ..._0x50ecd3,
          inspectorTab: ['properties', 'shot', 'scene']['includes'](_0x1de395) ? _0x1de395 : 'properties',
        }),
        _0x400664('set-inspector-tab')
      );
    },
    setObjectOutlineOpen(_0x59fb31) {
      return (
        (_0x50ecd3 = { ..._0x50ecd3, objectOutlineOpen: _0x59fb31 === !![] }),
        _0x400664('toggle-object-outline')
      );
    },
    setFlyMode(_0x595f48) {
      return ((_0x50ecd3 = { ..._0x50ecd3, flyMode: _0x595f48 === !![] }), _0x400664('toggle-fly-mode'));
    },
    destroy() {
      _0x436f13['clear']();
    },
  };
}

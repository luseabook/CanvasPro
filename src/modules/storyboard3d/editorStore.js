function cloneEditorState(args) {
  return { ...args, selectedObjectIds: [...args['selectedObjectIds']] };
}
export function createStoryboard3DEditorStore(args2 = {}) {
  const map = new Set();
  let args3 = {
    selectedObjectIds: [],
    activeTool: 'select',
    assetLibraryOpen: ![],
    inspectorOpen: ![],
    inspectorTab: 'properties',
    objectOutlineOpen: ![],
    flyMode: ![],
    ...args2,
  };
  args3['selectedObjectIds'] = Array['isArray'](args3['selectedObjectIds'])
    ? [
        ...new Set(
          args3['selectedObjectIds']['map']((value) => String(value || '')['trim']())['filter'](Boolean),
        ),
      ]
    : [];
  function run(reason) {
    const cloneEditorState2 = cloneEditorState(args3);
    return (map['forEach']((handler) => handler(cloneEditorState2, { reason: reason })), cloneEditorState2);
  }
  return {
    getSnapshot() {
      return cloneEditorState(args3);
    },
    subscribe(item) {
      if (typeof item !== 'function') return () => {};
      return (map['add'](item), () => map['delete'](item));
    },
    setSelectedObjects(list) {
      return (
        (args3 = {
          ...args3,
          selectedObjectIds: Array['isArray'](list)
            ? [...new Set(list['map']((key) => String(key || '')['trim']())['filter'](Boolean))]
            : [],
        }),
        run('select-objects')
      );
    },
    setActiveTool(index) {
      return (
        (args3 = {
          ...args3,
          activeTool: ['select', 'move', 'rotate', 'scale']['includes'](index) ? index : 'select',
        }),
        run('set-tool')
      );
    },
    setAssetLibraryOpen(assetLibraryOpen) {
      return (
        (args3 = { ...args3, assetLibraryOpen: assetLibraryOpen === !![] }),
        run(assetLibraryOpen === !![] ? 'open-asset-library' : 'close-asset-library')
      );
    },
    setInspectorOpen(inspectorOpen) {
      return ((args3 = { ...args3, inspectorOpen: inspectorOpen === !![] }), run('toggle-inspector'));
    },
    setInspectorTab(result) {
      return (
        (args3 = {
          ...args3,
          inspectorTab: ['properties', 'shot', 'scene']['includes'](result) ? result : 'properties',
        }),
        run('set-inspector-tab')
      );
    },
    setObjectOutlineOpen(objectOutlineOpen) {
      return (
        (args3 = { ...args3, objectOutlineOpen: objectOutlineOpen === !![] }),
        run('toggle-object-outline')
      );
    },
    setFlyMode(flyMode) {
      return ((args3 = { ...args3, flyMode: flyMode === !![] }), run('toggle-fly-mode'));
    },
    destroy() {
      map['clear']();
    },
  };
}

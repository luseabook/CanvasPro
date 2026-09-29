function normalizeText(_0x49764c) {
  return String(_0x49764c ?? '')['trim']();
}
export function focusWorkspaceAssetCard(_0x12b21b, _0xb4553) {
  const _0x6cfc94 = [...(_0x12b21b?.['querySelectorAll']?.('[data-story-asset-id]') || [])]['find'](
    (_0x1306ca) => _0x1306ca['dataset']['storyAssetId'] === _0xb4553,
  );
  _0x6cfc94?.['focus']?.({ preventScroll: !![] });
}
export function toggleWorkspaceAssetSelectAll(_0x30a14f = [], _0x34d3d4 = []) {
  const _0xd938a4 = (Array['isArray'](_0x30a14f) ? _0x30a14f : [])
      ['map']((_0x50b640) => normalizeText(_0x50b640?.['id']))
      ['filter'](Boolean),
    _0x4044f2 = new Set(
      (Array['isArray'](_0x34d3d4) ? _0x34d3d4 : [])['map'](normalizeText)['filter'](Boolean),
    ),
    _0x2da9a8 = _0xd938a4['length'] > 0x0 && _0xd938a4['every']((_0xd1d149) => _0x4044f2['has'](_0xd1d149));
  return _0x2da9a8 ? [] : _0xd938a4;
}
export function toggleWorkspaceAssetSelection(_0x2a6bbd = [], _0x6707f7 = '', _0x35ba1f = ![]) {
  const _0x22abd4 = normalizeText(_0x6707f7),
    _0x307a9e = (Array['isArray'](_0x2a6bbd) ? _0x2a6bbd : [])['map'](normalizeText)['filter'](Boolean);
  if (!_0x35ba1f || !_0x22abd4) return _0x307a9e;
  return _0x307a9e['includes'](_0x22abd4)
    ? _0x307a9e['filter']((_0x292f71) => _0x292f71 !== _0x22abd4)
    : [..._0x307a9e, _0x22abd4];
}
export function resolveWorkspaceCardMultiSelection({
  selectedIds: selectedIds = [],
  itemId: itemId = '',
  activeItemId: activeItemId = '',
  selectionMode: selectionMode = ![],
  shiftKey: shiftKey = ![],
  toggleKey: toggleKey = ![],
  orderedIds: orderedIds = null,
  enabled: enabled = !![],
} = {}) {
  const _0x34be58 = (Array['isArray'](selectedIds) ? selectedIds : [])
      ['map'](normalizeText)
      ['filter'](Boolean),
    _0x5b0c7d = normalizeText(itemId);
  if (Array['isArray'](orderedIds) && _0x5b0c7d) {
    if (!enabled) return { handled: !![], selectionMode: ![], selectedIds: [] };
    const _0x30f17a = [...new Set(orderedIds['map'](normalizeText)['filter'](Boolean))],
      _0xd79b0a = _0x30f17a['indexOf'](normalizeText(activeItemId)),
      _0x51d94d = _0x30f17a['indexOf'](_0x5b0c7d),
      _0xefd0dd =
        shiftKey && _0xd79b0a >= 0x0 && _0x51d94d >= 0x0
          ? _0x30f17a['slice'](Math['min'](_0xd79b0a, _0x51d94d), Math['max'](_0xd79b0a, _0x51d94d) + 0x1)
          : toggleKey
            ? toggleWorkspaceAssetSelection(_0x34be58, _0x5b0c7d, !![])
            : [_0x5b0c7d];
    return { handled: !![], selectionMode: _0xefd0dd['length'] > 0x0, selectedIds: _0xefd0dd };
  }
  const _0x30c3a0 = enabled === !![] && Boolean(_0x5b0c7d) && (selectionMode === !![] || shiftKey === !![]);
  if (!_0x30c3a0) return { handled: ![], selectionMode: selectionMode === !![], selectedIds: _0x34be58 };
  if (shiftKey === !![] && selectionMode !== !![])
    return {
      handled: !![],
      selectionMode: !![],
      selectedIds: [...new Set([normalizeText(activeItemId), _0x5b0c7d]['filter'](Boolean))],
    };
  return {
    handled: !![],
    selectionMode: !![],
    selectedIds: toggleWorkspaceAssetSelection(_0x34be58, _0x5b0c7d, !![]),
  };
}
export function renderWorkspaceAssetSelectionActions({
  selectionMode: selectionMode = ![],
  selectedCount: selectedCount = 0x0,
  allSelected: allSelected = ![],
  primaryActionHtml: primaryActionHtml = '',
  enterSelectionLabel: enterSelectionLabel = '多选',
  selectAllLabel: selectAllLabel = '全选',
  clearSelectionLabel: clearSelectionLabel = '取消全选',
  compactTrigger: compactTrigger = !![],
} = {}) {
  const _0x1e1f53 = Math['max'](0x0, Math['trunc'](Number(selectedCount) || 0x0));
  return (
    '<button type="button" class="story-secondary-button" data-workspace-action="toggle-all-assets" data-story-action="toggle-all-assets" aria-pressed="' +
    allSelected +
    '\x22>' +
    (allSelected ? clearSelectionLabel : selectAllLabel) +
    '</button>' +
    (_0x1e1f53 || primaryActionHtml ? primaryActionHtml : '')
  );
}

function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function focusWorkspaceAssetCard(el, item) {
  const el2 = [...(el?.['querySelectorAll']?.('[data-story-asset-id]') || [])]['find'](
    (el3) => el3['dataset']['storyAssetId'] === item,
  );
  el2?.['focus']?.({ preventScroll: !![] });
}
export function toggleWorkspaceAssetSelectAll(list = [], key = []) {
  const list2 = (Array['isArray'](list) ? list : [])
      ['map']((index) => normalizeText(index?.['id']))
      ['filter'](Boolean),
    map = new Set((Array['isArray'](key) ? key : [])['map'](normalizeText)['filter'](Boolean)),
    result = list2['length'] > 0 && list2['every']((data) => map['has'](data));
  return result ? [] : list2;
}
export function toggleWorkspaceAssetSelection(list3 = [], options = '', enabled2 = ![]) {
  const text = normalizeText(options),
    list4 = (Array['isArray'](list3) ? list3 : [])['map'](normalizeText)['filter'](Boolean);
  if (!enabled2 || !text) return list4;
  return list4['includes'](text) ? list4['filter']((target) => target !== text) : [...list4, text];
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
  const selectedIds2 = (Array['isArray'](selectedIds) ? selectedIds : [])
      ['map'](normalizeText)
      ['filter'](Boolean),
    text2 = normalizeText(itemId);
  if (Array['isArray'](orderedIds) && text2) {
    if (!enabled) return { handled: !![], selectionMode: ![], selectedIds: [] };
    const list5 = [...new Set(orderedIds['map'](normalizeText)['filter'](Boolean))],
      count = list5['indexOf'](normalizeText(activeItemId)),
      count2 = list5['indexOf'](text2),
      selectionMode2 =
        shiftKey && count >= 0 && count2 >= 0
          ? list5['slice'](Math['min'](count, count2), Math['max'](count, count2) + 1)
          : toggleKey
            ? toggleWorkspaceAssetSelection(selectedIds2, text2, !![])
            : [text2];
    return { handled: !![], selectionMode: selectionMode2['length'] > 0, selectedIds: selectionMode2 };
  }
  const enabled3 = enabled === !![] && Boolean(text2) && (selectionMode === !![] || shiftKey === !![]);
  if (!enabled3) return { handled: ![], selectionMode: selectionMode === !![], selectedIds: selectedIds2 };
  if (shiftKey === !![] && selectionMode !== !![])
    return {
      handled: !![],
      selectionMode: !![],
      selectedIds: [...new Set([normalizeText(activeItemId), text2]['filter'](Boolean))],
    };
  return {
    handled: !![],
    selectionMode: !![],
    selectedIds: toggleWorkspaceAssetSelection(selectedIds2, text2, !![]),
  };
}
export function renderWorkspaceAssetSelectionActions({
  selectionMode: selectionMode = ![],
  selectedCount: selectedCount = 0,
  allSelected: allSelected = ![],
  primaryActionHtml: primaryActionHtml = '',
  enterSelectionLabel: enterSelectionLabel = '多选',
  selectAllLabel: selectAllLabel = '全选',
  clearSelectionLabel: clearSelectionLabel = '取消全选',
  compactTrigger: compactTrigger = !![],
} = {}) {
  const source = Math['max'](0, Math['trunc'](Number(selectedCount) || 0));
  return (
    '<button type="button" class="story-secondary-button" data-workspace-action="toggle-all-assets" data-story-action="toggle-all-assets" aria-pressed="' +
    allSelected +
    '">' +
    (allSelected ? clearSelectionLabel : selectAllLabel) +
    '</button>' +
    (source || primaryActionHtml ? primaryActionHtml : '')
  );
}

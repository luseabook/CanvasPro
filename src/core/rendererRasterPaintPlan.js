const ITEM_FIELDS = ['id', 'kind', 'label', 'invalid', 'x', 'y', 'width', 'height'];
function sameRecord(enabled, enabled2) {
  if (!enabled || !enabled2) return enabled === enabled2;
  const list = Object.keys(enabled);
  return (
    list.length === Object.keys(enabled2).length &&
    list.every((value) => enabled[value] === enabled2[value])
  );
}
export function canReuseRasterPaint(enabled3, enabled4) {
  if (!enabled3 || !enabled4 || enabled3.paintScaleKey !== enabled4.paintScaleKey) return false;
  if (
    !sameRecord(enabled3.worldBounds, enabled4.worldBounds) ||
    !sameRecord(enabled3.palette, enabled4.palette)
  )
    return false;
  if (enabled3.admittedSources.size !== enabled4.admittedSources.size) return false;
  for (const item of enabled3.admittedSources) {
    if (!enabled4.admittedSources.has(item)) return false;
  }
  if (enabled3.items.length !== enabled4.items.length) return false;
  return enabled3.items.every((key, index) => {
    const result = enabled4.items[index];
    return (
      ITEM_FIELDS.every((data) => key[data] === result[data]) &&
      key.sources.length === result.sources.length &&
      key.sources.every((options, target) => options === result.sources[target])
    );
  });
}

function restorePendingSource(value, item, key) {
  if (item) value.__storyboardPendingSrc = key;
  else delete value.__storyboardPendingSrc;
}
export function applyImmediateStoryboardCellSwap(list, index, result) {
  const count = Number(index),
    count2 = Number(result),
    revert = () => {};
  if (
    !Number.isInteger(count) ||
    !Number.isInteger(count2) ||
    count === count2 ||
    count < 0 ||
    count2 < 0 ||
    !list ||
    count >= list.length ||
    count2 >= list.length
  )
    return { ok: false, revert: revert };
  const enabled = list[count]?.querySelector?.('.cell-content-wrap') || null,
    enabled2 = list[count2]?.querySelector?.('.cell-content-wrap') || null;
  if (!enabled || !enabled2) return { ok: false, revert: revert };
  const args = Array.from(enabled.childNodes || []),
    args2 = Array.from(enabled2.childNodes || []),
    data = enabled.__storyboardPendingSrc,
    options = enabled2.__storyboardPendingSrc,
    target = Object.prototype.hasOwnProperty.call(enabled, '__storyboardPendingSrc'),
    source = Object.prototype.hasOwnProperty.call(enabled2, '__storyboardPendingSrc');
  (enabled.replaceChildren(...args2),
    enabled2.replaceChildren(...args),
    delete enabled.__storyboardPendingSrc,
    delete enabled2.__storyboardPendingSrc);
  let next = false;
  const revert2 = () => {
    if (next) return;
    ((next = true),
      enabled.replaceChildren(...args),
      enabled2.replaceChildren(...args2),
      restorePendingSource(enabled, target, data),
      restorePendingSource(enabled2, source, options));
  };
  return { ok: true, revert: revert2 };
}

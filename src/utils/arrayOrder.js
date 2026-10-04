export function isSameStringOrder(list, list2) {
  if (!Array.isArray(list) || !Array.isArray(list2)) return false;
  if (list.length !== list2.length) return false;
  for (let value = 0; value < list.length; value += 1) {
    if (String(list[value] ?? '') !== String(list2[value] ?? '')) return false;
  }
  return true;
}

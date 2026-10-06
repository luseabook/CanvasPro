export function normalizeText(value) {
  return String(value || '').trim();
}
export function normalizeStringArray(list) {
  return Array.isArray(list) ? [...new Set(list.map(normalizeText).filter(Boolean))] : [];
}
export function normalizePositiveNumber(item) {
  const count = Number(item);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

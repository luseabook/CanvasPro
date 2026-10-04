export function isValidString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}
export function isValidNumber(item, key = {}) {
  const { min: min, max: max, integer: integer = false } = key;
  if (item === null || item === undefined || item === '') return false;
  const index = Number(item);
  if (isNaN(index) || !isFinite(index)) return false;
  if (integer && !Number.isInteger(index)) return false;
  if (min !== undefined && index < min) return false;
  if (max !== undefined && index > max) return false;
  return true;
}
export function isValidEmail(enabled) {
  if (!enabled) return false;
  const result = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return result.test(enabled);
}
export function isValidUrl(enabled2) {
  if (!enabled2) return false;
  try {
    return (new URL(enabled2), true);
  } catch {
    return false;
  }
}
export function isValidImageUrl(data) {
  if (!isValidUrl(data)) return false;
  const list = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'],
    list2 = data.toLowerCase();
  return list.some((item2) => list2.includes(item2)) || list2.startsWith('data:image/');
}
export function isValidColor(enabled3) {
  if (!enabled3) return false;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(enabled3)) return true;
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(\s*,\s*[\d.]+)?\s*\)$/.test(enabled3)) return true;
  if (/^hsla?\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?(\s*,\s*[\d.]+)?\s*\)$/.test(enabled3)) return true;
  const list3 = ['transparent', 'inherit', 'initial', 'unset'];
  if (list3.includes(enabled3.toLowerCase())) return true;
  return false;
}
export function isEmptyObject(enabled4) {
  if (!enabled4 || typeof enabled4 !== 'object') return true;
  return Object.keys(enabled4).length === 0;
}
export function isEmptyArray(list4) {
  return !Array.isArray(list4) || list4.length === 0;
}
export function isBase64(list5) {
  if (!list5) return false;
  const options = /^[A-Za-z0-9+/]*={0,2}$/;
  return options.test(list5) && list5.length % 4 === 0;
}
export function isDataUrl(enabled5) {
  if (!enabled5) return false;
  return /^data:([\w/+-]+);base64,/.test(enabled5);
}
export function isValidFileType(enabled6, list6) {
  if (!enabled6 || !list6 || !Array.isArray(list6)) return false;
  const target = enabled6.split('.').pop()?.toLowerCase();
  return list6.map((item3) => item3.toLowerCase()).includes(target);
}
export function isValidFileSize(count, source) {
  return typeof count === 'number' && count > 0 && count <= source;
}
export function validateNode(box) {
  const errors = [];
  if (!box) return (errors.push('节点数据为空'), { valid: false, errors: errors });
  return (
    (!box.id || typeof box.id !== 'string') && errors.push('节点缺少有效 ID'),
    (!box.type || typeof box.type !== 'string') && errors.push('节点缺少有效类型'),
    (typeof box.x !== 'number' || isNaN(box.x)) && errors.push('节点 X 坐标无效'),
    (typeof box.y !== 'number' || isNaN(box.y)) && errors.push('节点 Y 坐标无效'),
    { valid: errors.length === 0, errors: errors }
  );
}
export function validateCanvasData(enabled7) {
  const errors2 = [];
  if (!enabled7) return (errors2.push('数据为空'), { valid: false, errors: errors2 });
  (!enabled7.nodes || typeof enabled7.nodes !== 'object') && errors2.push('缺少节点数据');
  (!enabled7.edges || !Array.isArray(enabled7.edges)) && errors2.push('缺少连线数据');
  if (enabled7.viewport) {
    const box2 = enabled7.viewport;
    if (typeof box2.x !== 'number') errors2.push('视口 X 坐标无效');
    if (typeof box2.y !== 'number') errors2.push('视口 Y 坐标无效');
    if (typeof box2.zoom !== 'number' || box2.zoom <= 0) errors2.push('视口缩放值无效');
  }
  return { valid: errors2.length === 0, errors: errors2 };
}
export function firstNonEmpty(...args) {
  for (const next of args) {
    if (typeof next === 'string' && next.trim()) return next;
  }
  return '';
}

export function createStableSignature(list) {
  if (list === null || list === undefined) return String(list);
  if (typeof list !== 'object') return JSON.stringify(list);
  if (Array.isArray(list)) return '[' + list.map((item) => createStableSignature(item)).join(',') + ']';
  const list2 = Object.keys(list).sort();
  return (
    '{' +
    list2.map((item2) => JSON.stringify(item2) + ':' + createStableSignature(list[item2])).join(',') +
    '}'
  );
}

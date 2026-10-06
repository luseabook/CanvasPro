const equal = (value, item) => JSON.stringify(value) === JSON.stringify(item),
  record = (key) => key && typeof key === 'object' && !Array.isArray(key);
export function mergeCollaborationFields(index, result, data) {
  if (equal(index, result) || equal(data, result)) return structuredClone(data);
  if (equal(data, index)) return structuredClone(result);
  if (record(index) && record(result) && record(data)) {
    const structuredClone2 = structuredClone(data);
    for (const options of new Set([...Object.keys(index), ...Object.keys(result)])) {
      const collaborationFields = mergeCollaborationFields(index[options], result[options], data[options]);
      if (collaborationFields === undefined) delete structuredClone2[options];
      else structuredClone2[options] = collaborationFields;
    }
    return structuredClone2;
  }
  throw Object.assign(new Error('同一字段存在不同修改'), { code: 'EDIT_CONFLICT' });
}

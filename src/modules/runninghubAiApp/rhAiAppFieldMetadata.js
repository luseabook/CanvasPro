export function getRunningHubFieldOptions(value) {
  if (String(value?.['fieldType'])['toUpperCase']() !== 'LIST') return [];
  let list = value['fieldData'];
  try {
    if (typeof list === 'string') list = JSON['parse'](list);
  } catch {
    return [];
  }
  if (!Array['isArray'](list)) return [];
  return list['filter'](
    (item) =>
      item &&
      Object['hasOwn'](item, 'index') &&
      ['string', 'number', 'boolean']['includes'](typeof item['index']),
  )['map']((error) => ({
    value: String(error['index']),
    label: String(error['name'] ?? error['index']),
  }));
}
export function inferRunningHubFieldMetadata(options = {}) {
  const key = String(options['fieldType'] || '')['toUpperCase'](),
    componentKind = { IMAGE: 'image', VIDEO: 'video', AUDIO: 'audio' }[key];
  if (componentKind)
    return {
      componentKind: componentKind,
      componentKindLocked: true,
      componentKindOptions: [componentKind],
      controlType: 'text',
      controlTypeLocked: true,
      controlTypeOptions: [],
    };
  const list2 = getRunningHubFieldOptions(options);
  if (list2['length'])
    return {
      componentKind: 'param',
      componentKindLocked: true,
      componentKindOptions: ['param'],
      controlType: 'select',
      controlTypeLocked: true,
      controlTypeOptions: ['select'],
    };
  return null;
}

export const CUSTOM_APP_FOOTER_LIMIT = 4;
export function getParameterEntries(list = [], value = CUSTOM_APP_FOOTER_LIMIT) {
  const list2 = [],
    map = new Map();
  return (
    list.filter((item) => item.componentKind === 'param' && item.previewPlacement === 'home')
      .sort(
        (key, index) => (Number(key.homeParamOrder) || 0) - (Number(index.homeParamOrder) || 0),
      )
      .forEach((result) => {
        const id = String(result.footerGroupId || '').trim();
        let enabled = id ? map.get(id) : null;
        if (!enabled) {
          ((enabled = {
            id: id,
            label: String(result.footerGroupLabel || '参数组').trim(),
            description: String(result.footerGroupDescription || '').trim(),
            members: [],
          }),
            list2.push(enabled));
          if (id) map.set(id, enabled);
        }
        enabled.members.push(result);
      }),
    list2.slice(0, value)
  );
}
export function clearParameterGroup(data) {
  (delete data.footerGroupId, delete data.footerGroupLabel, delete data.footerGroupDescription);
}
export function normalizeParameterGroups(list3) {
  (list3.filter(
    (options) => options.componentKind !== 'param' || options.previewPlacement !== 'home',
  ).forEach(clearParameterGroup),
    getParameterEntries(list3, Infinity).forEach((target) => {
      if (target.members.length < 2) target.members.forEach(clearParameterGroup);
    }));
}
export function orderParameterEntries(list4) {
  list4.flatMap((source) => source.members).forEach((next, current) => {
    next.homeParamOrder = current;
  });
}
export function groupParameters(list5, entry, record, { wholeGroup: wholeGroup = false } = {}) {
  const enabled2 = list5.find((payload) => payload.index === entry),
    enabled3 = list5.find((handle) => handle.index === record);
  if (
    !enabled2 ||
    !enabled3 ||
    enabled2 === enabled3 ||
    enabled2.componentKind !== 'param' ||
    enabled3.componentKind !== 'param'
  )
    return false;
  if (enabled3.previewPlacement !== 'home') return false;
  if (enabled2.footerGroupId && enabled2.footerGroupId === enabled3.footerGroupId) return false;
  const list6 =
    wholeGroup && enabled2.footerGroupId
      ? list5.filter((state) => state.footerGroupId === enabled2.footerGroupId)
      : [enabled2];
  let config = enabled3.footerGroupId || 'group-' + enabled3.index;
  if (!enabled3.footerGroupId) {
    const map2 = new Set(list5.map((scope) => scope.footerGroupId));
    while (map2.has(config)) config += '-new';
  }
  const input = enabled3.footerGroupLabel || '参数组',
    output = enabled3.footerGroupDescription || '',
    list7 = getParameterEntries(list5, Infinity),
    value2 = list7.find((value3) => value3.members.includes(enabled3));
  return (
    list7.forEach((value4) => {
      value4.members = value4.members.filter((value5) => !list6.includes(value5));
    }),
    value2.members.push(...list6),
    value2.members.forEach((value6) => {
      ((value6.previewPlacement = 'home'),
        (value6.footerGroupId = config),
        (value6.footerGroupLabel = input),
        (value6.footerGroupDescription = output),
        delete value6.advancedParamOrder);
    }),
    normalizeParameterGroups(list5),
    orderParameterEntries(list7),
    true
  );
}
export function getParameterFooterFields(value7) {
  const map3 = new Map();
  return (
    getParameterEntries(value7).forEach((id2) =>
      id2.members.forEach((value8) => {
        map3.set(value8.index, {
          variant: 'rhAiAppFooterParam',
          displayOrder: Number.isFinite(Number(value8.homeParamOrder))
            ? Number(value8.homeParamOrder)
            : value8.index,
          ...(id2.id && id2.members.length > 1
            ? {
                footerGroup: {
                  id: id2.id,
                  label: id2.label,
                  description: id2.description,
                },
              }
            : {}),
        });
      }),
    ),
    map3
  );
}

function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array['isArray'](enabled);
}
export function applyUiSchemaFieldOverrides(value, item) {
  const isPlainObject2 = isPlainObject(item) ? item : {};
  return (Array['isArray'](value) ? value : [])['map']((args) => {
    const id = String(args?.['id'] || '')['trim'](),
      args2 = isPlainObject2[id];
    if (!id || !isPlainObject(args2)) return args;
    return { ...args, ...args2, id: id };
  });
}

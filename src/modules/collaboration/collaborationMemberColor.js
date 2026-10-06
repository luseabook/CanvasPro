const COLORS = [
  '--blue',
  '--green',
  '--purple',
  '--cyan',
  '--red',
  '--indigo',
  '--group-pink',
  '--warning-text',
];
export function collaborationMemberColor(value) {
  let item = 0x811c9dc5;
  for (const key of String(value?.id || ''))
    item = Math.imul(item ^ key.charCodeAt(0), 0x1000193) >>> 0;
  const index = Number.isInteger(value?.colorIndex) ? value.colorIndex : item % 24,
    result = 'var(' + COLORS[index % COLORS.length] + ')';
  return index < COLORS.length
    ? result
    : 'color-mix(in srgb, ' +
        result +
        ' ' +
        (index % 24 < 16 ? 70 : 45) +
        '%, var(--text-primary))';
}

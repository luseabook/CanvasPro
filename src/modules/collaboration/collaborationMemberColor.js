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
  for (const key of String(value?.['id'] || ''))
    item = Math['imul'](item ^ key['charCodeAt'](0x0), 0x1000193) >>> 0x0;
  const index = Number['isInteger'](value?.['colorIndex']) ? value['colorIndex'] : item % 0x18,
    result = 'var(' + COLORS[index % COLORS['length']] + ')';
  return index < COLORS['length']
    ? result
    : 'color-mix(in srgb, ' +
        result +
        '\x20' +
        (index % 0x18 < 0x10 ? 0x46 : 0x2d) +
        '%, var(--text-primary))';
}

function clamp(value, item, key, index = item) {
  const result = Number(value);
  return Number['isFinite'](result) ? Math['min'](key, Math['max'](item, result)) : index;
}
export function normalizePersonReplacementManualSelection(
  box = {},
  box2 = {},
  { minWidth: minWidth = 0.025, minHeight: minHeight = 0.05 } = {},
) {
  const clamp2 = clamp(box['x'], 0x0, 0x1, 0x0),
    clamp3 = clamp(box['y'], 0x0, 0x1, 0x0),
    clamp4 = clamp(box2['x'], 0x0, 0x1, clamp2),
    clamp5 = clamp(box2['y'], 0x0, 0x1, clamp3),
    box3 = {
      x: Math['round'](Math['min'](clamp2, clamp4) * 0xf4240) / 0xf4240,
      y: Math['round'](Math['min'](clamp3, clamp5) * 0xf4240) / 0xf4240,
      width: Math['round'](Math['abs'](clamp4 - clamp2) * 0xf4240) / 0xf4240,
      height: Math['round'](Math['abs'](clamp5 - clamp3) * 0xf4240) / 0xf4240,
    };
  return box3['width'] >= minWidth && box3['height'] >= minHeight ? box3 : null;
}
export function resolvePersonReplacementSourceImageSize(data, options = {}) {
  const width = Number(data?.['naturalWidth']),
    height = Number(data?.['naturalHeight']);
  if (Number['isFinite'](width) && width > 0x0 && Number['isFinite'](height) && height > 0x0)
    return { width: width, height: height };
  const width2 = Number(options?.['frame']?.['width']),
    height2 = Number(options?.['frame']?.['height']);
  return Number['isFinite'](width2) && width2 > 0x0 && Number['isFinite'](height2) && height2 > 0x0
    ? { width: width2, height: height2 }
    : { width: 0x0, height: 0x0 };
}
export function normalizePersonReplacementManualBoxEdit(
  box4 = {},
  box5 = {},
  list = 'move',
  { minWidth: minWidth = 0.025, minHeight: minHeight = 0.05 } = {},
) {
  const clamp6 = clamp(box4['x'], 0x0, 0x1, 0x0),
    clamp7 = clamp(box4['y'], 0x0, 0x1, 0x0),
    clamp8 = clamp(box4['width'], minWidth, 0x1 - clamp6, minWidth),
    clamp9 = clamp(box4['height'], minHeight, 0x1 - clamp7, minHeight),
    target = Number(box5['x']) || 0x0,
    source = Number(box5['y']) || 0x0;
  if (list === 'move')
    return {
      x: Math['round'](clamp(clamp6 + target, 0x0, 0x1 - clamp8, clamp6) * 0xf4240) / 0xf4240,
      y: Math['round'](clamp(clamp7 + source, 0x0, 0x1 - clamp9, clamp7) * 0xf4240) / 0xf4240,
      width: Math['round'](clamp8 * 0xf4240) / 0xf4240,
      height: Math['round'](clamp9 * 0xf4240) / 0xf4240,
    };
  let clamp10 = clamp6,
    clamp11 = clamp7,
    clamp12 = clamp6 + clamp8,
    clamp13 = clamp7 + clamp9;
  if (list['includes']('w')) clamp10 = clamp(clamp10 + target, 0x0, clamp12 - minWidth, clamp10);
  if (list['includes']('e')) clamp12 = clamp(clamp12 + target, clamp10 + minWidth, 0x1, clamp12);
  if (list['includes']('n')) clamp11 = clamp(clamp11 + source, 0x0, clamp13 - minHeight, clamp11);
  if (list['includes']('s')) clamp13 = clamp(clamp13 + source, clamp11 + minHeight, 0x1, clamp13);
  return {
    x: Math['round'](clamp10 * 0xf4240) / 0xf4240,
    y: Math['round'](clamp11 * 0xf4240) / 0xf4240,
    width: Math['round']((clamp12 - clamp10) * 0xf4240) / 0xf4240,
    height: Math['round']((clamp13 - clamp11) * 0xf4240) / 0xf4240,
  };
}

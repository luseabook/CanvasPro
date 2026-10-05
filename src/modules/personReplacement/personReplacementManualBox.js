function clamp(value, item, key, index = item) {
  const result = Number(value);
  return Number['isFinite'](result) ? Math['min'](key, Math['max'](item, result)) : index;
}
export function normalizePersonReplacementManualSelection(
  box = {},
  box2 = {},
  { minWidth: minWidth = 0.025, minHeight: minHeight = 0.05 } = {},
) {
  const clamp2 = clamp(box['x'], 0, 1, 0),
    clamp3 = clamp(box['y'], 0, 1, 0),
    clamp4 = clamp(box2['x'], 0, 1, clamp2),
    clamp5 = clamp(box2['y'], 0, 1, clamp3),
    box3 = {
      x: Math['round'](Math['min'](clamp2, clamp4) * 1000000) / 1000000,
      y: Math['round'](Math['min'](clamp3, clamp5) * 1000000) / 1000000,
      width: Math['round'](Math['abs'](clamp4 - clamp2) * 1000000) / 1000000,
      height: Math['round'](Math['abs'](clamp5 - clamp3) * 1000000) / 1000000,
    };
  return box3['width'] >= minWidth && box3['height'] >= minHeight ? box3 : null;
}
export function resolvePersonReplacementSourceImageSize(data, options = {}) {
  const width = Number(data?.['naturalWidth']),
    height = Number(data?.['naturalHeight']);
  if (Number['isFinite'](width) && width > 0 && Number['isFinite'](height) && height > 0)
    return { width: width, height: height };
  const width2 = Number(options?.['frame']?.['width']),
    height2 = Number(options?.['frame']?.['height']);
  return Number['isFinite'](width2) && width2 > 0 && Number['isFinite'](height2) && height2 > 0
    ? { width: width2, height: height2 }
    : { width: 0, height: 0 };
}
export function normalizePersonReplacementManualBoxEdit(
  box4 = {},
  box5 = {},
  list = 'move',
  { minWidth: minWidth = 0.025, minHeight: minHeight = 0.05 } = {},
) {
  const clamp6 = clamp(box4['x'], 0, 1, 0),
    clamp7 = clamp(box4['y'], 0, 1, 0),
    clamp8 = clamp(box4['width'], minWidth, 1 - clamp6, minWidth),
    clamp9 = clamp(box4['height'], minHeight, 1 - clamp7, minHeight),
    target = Number(box5['x']) || 0,
    source = Number(box5['y']) || 0;
  if (list === 'move')
    return {
      x: Math['round'](clamp(clamp6 + target, 0, 1 - clamp8, clamp6) * 1000000) / 1000000,
      y: Math['round'](clamp(clamp7 + source, 0, 1 - clamp9, clamp7) * 1000000) / 1000000,
      width: Math['round'](clamp8 * 1000000) / 1000000,
      height: Math['round'](clamp9 * 1000000) / 1000000,
    };
  let clamp10 = clamp6,
    clamp11 = clamp7,
    clamp12 = clamp6 + clamp8,
    clamp13 = clamp7 + clamp9;
  if (list['includes']('w')) clamp10 = clamp(clamp10 + target, 0, clamp12 - minWidth, clamp10);
  if (list['includes']('e')) clamp12 = clamp(clamp12 + target, clamp10 + minWidth, 1, clamp12);
  if (list['includes']('n')) clamp11 = clamp(clamp11 + source, 0, clamp13 - minHeight, clamp11);
  if (list['includes']('s')) clamp13 = clamp(clamp13 + source, clamp11 + minHeight, 1, clamp13);
  return {
    x: Math['round'](clamp10 * 1000000) / 1000000,
    y: Math['round'](clamp11 * 1000000) / 1000000,
    width: Math['round']((clamp12 - clamp10) * 1000000) / 1000000,
    height: Math['round']((clamp13 - clamp11) * 1000000) / 1000000,
  };
}

const GRID_DOT_WORLD_SPACING = 0x16,
  MIN_GRID_DOT_SCREEN_SPACING = 0x12,
  GRID_DOTS_HIDE_AT_ZOOM = 0.25,
  GRID_DOTS_EMPHASIZE_AT_ZOOM = 1.5;
function toFiniteNumber(value, item) {
  const key = Number(value);
  return Number['isFinite'](key) ? key : item;
}
function resolveScreenSpacing(index) {
  let result = GRID_DOT_WORLD_SPACING * index;
  while (result < MIN_GRID_DOT_SCREEN_SPACING) {
    result *= 0x2;
  }
  return result;
}
export function syncViewportGridDots(data, box = {}) {
  const el = data?.['parentElement'];
  if (!el?.['style']?.['setProperty']) return ![];
  const toFiniteNumber2 = toFiniteNumber(box['x'], 0x0),
    toFiniteNumber3 = toFiniteNumber(box['y'], 0x0),
    toFiniteNumber4 = toFiniteNumber(box['zoom'], 0x1),
    options = toFiniteNumber4 > 0x0 ? toFiniteNumber4 : 0x1,
    target = toFiniteNumber2 + '|' + toFiniteNumber3 + '|' + options;
  if (el['_lastGridDotsViewport'] === target) return ![];
  const screenSpacing = resolveScreenSpacing(options),
    source = toFiniteNumber2 + 'px ' + toFiniteNumber3 + 'px',
    next = screenSpacing + 'px\x20' + screenSpacing + 'px',
    current = options <= GRID_DOTS_HIDE_AT_ZOOM,
    entry = options >= GRID_DOTS_EMPHASIZE_AT_ZOOM;
  return (
    el['_lastGridDotsPosition'] !== source &&
      (el['style']['setProperty']('background-position', source), (el['_lastGridDotsPosition'] = source)),
    el['_lastGridDotsSize'] !== next &&
      (el['style']['setProperty']('background-size', next), (el['_lastGridDotsSize'] = next)),
    el['_lastGridDotsHidden'] !== current &&
      (el['classList']?.['toggle']?.('is-grid-dots-hidden-by-zoom', current),
      (el['_lastGridDotsHidden'] = current)),
    el['_lastGridDotsEmphasized'] !== entry &&
      (el['classList']?.['toggle']?.('is-grid-dots-emphasized', entry),
      (el['_lastGridDotsEmphasized'] = entry)),
    (el['_lastGridDotsViewport'] = target),
    !![]
  );
}

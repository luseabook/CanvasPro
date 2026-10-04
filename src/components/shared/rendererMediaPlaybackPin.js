export function bindRendererMediaPlaybackPin(
  el,
  enabled,
  { getRenderer: getRenderer = () => globalThis['window']?.['v2Renderer'] } = {},
) {
  if (!el?.['addEventListener'] || !enabled) return () => {};
  let value = ![];
  const item = 'media-playback',
    handler = () => {
      const key = el['paused'] === ![] && el['ended'] !== !![];
      if (value === key) return;
      value = key;
      if (value) getRenderer()?.['pinNode']?.(enabled, item);
      else getRenderer()?.['unpinNode']?.(enabled, item);
    },
    index = ['play', 'pause', 'ended', 'emptied'];
  for (const result of index) el['addEventListener'](result, handler);
  return (
    handler(),
    () => {
      for (const data of index) el['removeEventListener'](data, handler);
      if (value) getRenderer()?.['unpinNode']?.(enabled, item);
      value = ![];
    }
  );
}

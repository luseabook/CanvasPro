import { fetchWithTimeout } from './apiBase.js';
export function readCursorHotspot(value) {
  const x = new DataView(value);
  if (x['byteLength'] < 22 || x['getUint16'](2, !![]) !== 2 || x['getUint16'](4, !![]) !== 1)
    throw new Error('Unsupported cursor directory');
  return { x: x['getUint16'](10, !![]), y: x['getUint16'](12, !![]) };
}
export async function loadCursorHotspot(item) {
  const response = await fetchWithTimeout(item, {}, 5000);
  if (!response['ok']) throw new Error('Cursor asset unavailable');
  return readCursorHotspot(await response['arrayBuffer']());
}
export async function loadCursorMetrics(key) {
  const response2 = await fetchWithTimeout(key, {}, 5000);
  if (!response2['ok']) throw new Error('Cursor asset unavailable');
  const index = await response2['arrayBuffer'](),
    width = new DataView(index),
    hotspot = readCursorHotspot(index);
  return {
    hotspot: hotspot,
    width: width['getUint8'](6) || 256,
    height: width['getUint8'](7) || 256,
  };
}

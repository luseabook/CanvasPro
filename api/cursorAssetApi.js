import { fetchWithTimeout } from './apiBase.js';
export function readCursorHotspot(value) {
  const x = new DataView(value);
  if (x['byteLength'] < 0x16 || x['getUint16'](0x2, !![]) !== 0x2 || x['getUint16'](0x4, !![]) !== 0x1)
    throw new Error('Unsupported cursor directory');
  return { x: x['getUint16'](0xa, !![]), y: x['getUint16'](0xc, !![]) };
}
export async function loadCursorHotspot(item) {
  const response = await fetchWithTimeout(item, {}, 0x1388);
  if (!response['ok']) throw new Error('Cursor asset unavailable');
  return readCursorHotspot(await response['arrayBuffer']());
}
export async function loadCursorMetrics(key) {
  const response2 = await fetchWithTimeout(key, {}, 0x1388);
  if (!response2['ok']) throw new Error('Cursor asset unavailable');
  const index = await response2['arrayBuffer'](),
    width = new DataView(index),
    hotspot = readCursorHotspot(index);
  return {
    hotspot: hotspot,
    width: width['getUint8'](0x6) || 0x100,
    height: width['getUint8'](0x7) || 0x100,
  };
}

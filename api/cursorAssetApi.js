import { fetchWithTimeout } from './apiBase.js';
export function readCursorHotspot(_0x4d7f80) {
  const _0x3d38a4 = new DataView(_0x4d7f80);
  if (
    _0x3d38a4['byteLength'] < 0x16 ||
    _0x3d38a4['getUint16'](0x2, !![]) !== 0x2 ||
    _0x3d38a4['getUint16'](0x4, !![]) !== 0x1
  )
    throw new Error('Unsupported cursor directory');
  return { x: _0x3d38a4['getUint16'](0xa, !![]), y: _0x3d38a4['getUint16'](0xc, !![]) };
}
export async function loadCursorHotspot(_0x3a658c) {
  const _0x1e0323 = await fetchWithTimeout(_0x3a658c, {}, 0x1388);
  if (!_0x1e0323['ok']) throw new Error('Cursor asset unavailable');
  return readCursorHotspot(await _0x1e0323['arrayBuffer']());
}
export async function loadCursorMetrics(_0x2801df) {
  const _0x17ff38 = await fetchWithTimeout(_0x2801df, {}, 0x1388);
  if (!_0x17ff38['ok']) throw new Error('Cursor asset unavailable');
  const _0x3947cd = await _0x17ff38['arrayBuffer'](),
    _0x3f65c5 = new DataView(_0x3947cd),
    _0x24d1a0 = readCursorHotspot(_0x3947cd);
  return {
    hotspot: _0x24d1a0,
    width: _0x3f65c5['getUint8'](0x6) || 0x100,
    height: _0x3f65c5['getUint8'](0x7) || 0x100,
  };
}

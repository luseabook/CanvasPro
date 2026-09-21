import * as threeRuntime from './threeRuntime.js';
import { normalizePathToLocalUrl } from '../../services/mediaRatioService.js';
function resolveColorValue(_0x28be43, _0x1b3ea5 = new Set()) {
  const _0x174d84 = String(_0x28be43 || '').trim();
  if (!_0x174d84) return '';
  const _0x36f88d = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+?)\s*)?\)$/.exec(_0x174d84);
  if (!_0x36f88d) return _0x174d84;
  const _0x555c41 = _0x36f88d[1],
    _0x30c9b8 = (_0x36f88d[2] || '').trim();
  if (_0x1b3ea5.has(_0x555c41)) return _0x30c9b8;
  _0x1b3ea5.add(_0x555c41);
  const _0x286b53 = resolveCssVarValue(_0x555c41, _0x1b3ea5);
  return _0x286b53 || _0x30c9b8;
}
function resolveCssVarValue(_0x152da8, _0x2d17f5 = new Set()) {
  if (typeof window === 'undefined' || !window.getComputedStyle) return '';
  const _0x4f092f = window.getComputedStyle(document.documentElement).getPropertyValue(_0x152da8).trim();
  if (!_0x4f092f) return '';
  return resolveColorValue(_0x4f092f, _0x2d17f5);
}
function cssColorValue(_0x3aed4b, _0x2635af) {
  const _0x543679 = resolveCssVarValue(_0x3aed4b);
  if (_0x543679) return _0x543679;
  if (typeof _0x2635af === 'string' && _0x2635af.trim().startsWith('--'))
    return resolveCssVarValue(_0x2635af.trim()) || '';
  return resolveColorValue(_0x2635af);
}
function resolveSelectionAccentColor() {
  return resolveThemeColor('--blue', '--blue');
}
export function resolveThemeColor(_0x480023, _0x447476) {
  try {
    const _0x1231d0 = cssColorValue(_0x480023, _0x447476);
    return _0x1231d0 ? new threeRuntime['Color'](_0x1231d0) : new threeRuntime['Color']();
  } catch {
    return new threeRuntime['Color']();
  }
}
export function resolveThemeColorValue(_0x4a91c4, _0x586e9e) {
  return cssColorValue(_0x4a91c4, _0x586e9e);
}
export function clamp01(_0x3c0403) {
  return Math.max(0, Math.min(1, Number(_0x3c0403) || 0));
}
export function normalizePanoramaTextureUrl(_0x4762cc, _0x185200) {
  const _0x3b0914 = String(_0x4762cc || '').trim(),
    _0x2b011 = String(_0x185200 || '').trim(),
    _0x25fb17 = _0x3b0914 || _0x2b011;
  if (!_0x25fb17) return '';
  const _0x2b6727 = _0x25fb17.replace(/\\/g, '/'),
    _0x6075bf = normalizePathToLocalUrl(_0x2b6727);
  if (/^(data:|blob:)/i.test(_0x6075bf)) return _0x6075bf;
  try {
    return encodeURI(decodeURI(_0x6075bf));
  } catch {
    try {
      return encodeURI(_0x6075bf);
    } catch {
      return _0x6075bf;
    }
  }
}
export function applySelectionEmphasis(_0x3b4506, _0x170b57, _0x592e8e = 0.2) {
  if (!_0x3b4506 || !('emissive' in _0x3b4506) || !_0x3b4506.emissive?.isColor) return;
  (_0x3b4506.emissive.copy(resolveSelectionAccentColor()),
    (_0x3b4506.emissiveIntensity = _0x170b57 ? _0x592e8e : 0));
}
export function createSelectionRing(_0x42a6cc) {
  const _0x4f8a66 = _0x42a6cc?.isColor
      ? _0x42a6cc.clone()
      : new threeRuntime['Color'](_0x42a6cc || resolveSelectionAccentColor()),
    _0x3d9d14 = new threeRuntime['Group'](),
    _0x554a81 = (_0x500c29) =>
      new threeRuntime['MeshBasicMaterial']({
        color: _0x4f8a66.clone(),
        transparent: true,
        opacity: _0x500c29,
        side: threeRuntime.DoubleSide,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    _0x4fdaec = new threeRuntime['Mesh'](new threeRuntime['CircleGeometry'](0.62, 40), _0x554a81(0.12));
  ((_0x4fdaec.rotation.x = -Math.PI / 2), (_0x4fdaec.position.y = 0.016), _0x3d9d14.add(_0x4fdaec));
  const _0x383d5f = new threeRuntime.Mesh(new threeRuntime['RingGeometry'](0.5, 0.62, 40), _0x554a81(0.38));
  ((_0x383d5f.rotation.x = -Math.PI / 2), (_0x383d5f.position.y = 0.02), _0x3d9d14.add(_0x383d5f));
  const _0x317304 = new threeRuntime.Mesh(new threeRuntime.RingGeometry(0.28, 0.38, 40), _0x554a81(0.98));
  return (
    (_0x317304.rotation.x = -Math.PI / 2),
    (_0x317304.position.y = 0.024),
    _0x3d9d14.add(_0x317304),
    (_0x3d9d14.visible = false),
    _0x3d9d14
  );
}

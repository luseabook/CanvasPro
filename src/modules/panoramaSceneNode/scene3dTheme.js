import * as threeRuntime from './threeRuntime.js';
import { normalizePathToLocalUrl } from '../../services/mediaRatioService.js';
function resolveColorValue(value, map = new Set()) {
  const enabled = String(value || '').trim();
  if (!enabled) return '';
  const enabled2 = /^var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]+?)\s*)?\)$/.exec(enabled);
  if (!enabled2) return enabled;
  const item = enabled2[1],
    key = (enabled2[2] || '').trim();
  if (map.has(item)) return key;
  map.add(item);
  const cssVarValue = resolveCssVarValue(item, map);
  return cssVarValue || key;
}
function resolveCssVarValue(index, result = new Set()) {
  if (typeof window === 'undefined' || !window.getComputedStyle) return '';
  const enabled3 = window.getComputedStyle(document.documentElement).getPropertyValue(index).trim();
  if (!enabled3) return '';
  return resolveColorValue(enabled3, result);
}
function cssColorValue(data, options) {
  const cssVarValue2 = resolveCssVarValue(data);
  if (cssVarValue2) return cssVarValue2;
  if (typeof options === 'string' && options.trim().startsWith('--'))
    return resolveCssVarValue(options.trim()) || '';
  return resolveColorValue(options);
}
function resolveSelectionAccentColor() {
  return resolveThemeColor('--blue', '--blue');
}
export function resolveThemeColor(target, source) {
  try {
    const cssColorValue2 = cssColorValue(target, source);
    return cssColorValue2 ? new threeRuntime.Color(cssColorValue2) : new threeRuntime.Color();
  } catch {
    return new threeRuntime.Color();
  }
}
export function resolveThemeColorValue(next, current) {
  return cssColorValue(next, current);
}
export function clamp01(entry) {
  return Math.max(0, Math.min(1, Number(entry) || 0));
}
export function normalizePanoramaTextureUrl(record, payload) {
  const handle = String(record || '').trim(),
    state = String(payload || '').trim(),
    enabled4 = handle || state;
  if (!enabled4) return '';
  const config = enabled4.replace(/\\/g, '/'),
    localUrl = normalizePathToLocalUrl(config);
  if (/^(data:|blob:)/i.test(localUrl)) return localUrl;
  try {
    return encodeURI(decodeURI(localUrl));
  } catch {
    try {
      return encodeURI(localUrl);
    } catch {
      return localUrl;
    }
  }
}
export function applySelectionEmphasis(enabled5, scope, input = 0.2) {
  if (!enabled5 || !('emissive' in enabled5) || !enabled5.emissive?.isColor) return;
  (enabled5.emissive.copy(resolveSelectionAccentColor()), (enabled5.emissiveIntensity = scope ? input : 0));
}
export function createSelectionRing(output) {
  const color = output?.isColor
      ? output.clone()
      : new threeRuntime.Color(output || resolveSelectionAccentColor()),
    value2 = new threeRuntime.Group(),
    handler = (opacity) =>
      new threeRuntime.MeshBasicMaterial({
        color: color.clone(),
        transparent: true,
        opacity: opacity,
        side: threeRuntime.DoubleSide,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    value3 = new threeRuntime.Mesh(new threeRuntime.CircleGeometry(0.62, 40), handler(0.12));
  ((value3.rotation.x = -Math.PI / 2), (value3.position.y = 0.016), value2.add(value3));
  const value4 = new threeRuntime.Mesh(new threeRuntime.RingGeometry(0.5, 0.62, 40), handler(0.38));
  ((value4.rotation.x = -Math.PI / 2), (value4.position.y = 0.02), value2.add(value4));
  const value5 = new threeRuntime.Mesh(new threeRuntime.RingGeometry(0.28, 0.38, 40), handler(0.98));
  return (
    (value5.rotation.x = -Math.PI / 2),
    (value5.position.y = 0.024),
    value2.add(value5),
    (value2.visible = false),
    value2
  );
}

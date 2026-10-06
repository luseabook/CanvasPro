import { Buffer } from 'node:buffer';
import { resolveContextMenuIconDefinition } from '../src/utils/contextMenuIconCatalog.js';
function escapeSvgAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
function renderNativeContextMenuSvg(definition, stroke) {
  const shapes = definition.shapes
    .map(([tagName, attributes]) => {
      const serializedAttributes = Object.entries(attributes)
        .map(([name, value]) => name + '="' + escapeSvgAttribute(value) + '"')
        .join(' ');
      return '<' + tagName + ' ' + serializedAttributes + '/>';
    })
    .join('');
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' +
    escapeSvgAttribute(stroke) +
    '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    shapes +
    '</svg>'
  );
}
export function createNativeContextMenuIconFactory(
  nativeImageApi,
  { size: size = 16, stroke: stroke = 'CanvasText' } = {},
) {
  const iconCache = new Map();
  return (iconId) => {
    const definition = resolveContextMenuIconDefinition(iconId);
    if (!definition || typeof nativeImageApi?.createFromDataURL !== 'function') return null;
    if (iconCache.has(definition.id)) return iconCache.get(definition.id);
    const svgMarkup = renderNativeContextMenuSvg(definition, stroke),
      dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svgMarkup, 'utf8').toString('base64'),
      nativeIcon = nativeImageApi.createFromDataURL(dataUrl);
    if (!nativeIcon || nativeIcon.isEmpty?.() === true) return null;
    const sizedIcon =
      typeof nativeIcon.resize === 'function'
        ? nativeIcon.resize({ width: size, height: size, quality: 'best' })
        : nativeIcon;
    return (iconCache.set(definition.id, sizedIcon), sizedIcon);
  };
}

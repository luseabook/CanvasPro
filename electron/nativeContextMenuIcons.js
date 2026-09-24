import { Buffer } from 'node:buffer';
import { resolveContextMenuIconDefinition } from '../src/utils/contextMenuIconCatalog.js';
function escapeSvgAttribute(value) {
  return String(value)
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;');
}
function renderNativeContextMenuSvg(definition, stroke) {
  const shapes = definition['shapes']
    ['map'](([tagName, attributes]) => {
      const serializedAttributes = Object['entries'](attributes)
        ['map'](([name, value]) => name + '=\x22' + escapeSvgAttribute(value) + '\x22')
        ['join']('\x20');
      return '<' + tagName + '\x20' + serializedAttributes + '/>';
    })
    ['join']('');
  return (
    '<svg\x20xmlns=\x22http://www.w3.org/2000/svg\x22\x20width=\x2218\x22\x20height=\x2218\x22\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22' +
    escapeSvgAttribute(stroke) +
    '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
    shapes +
    '</svg>'
  );
}
export function createNativeContextMenuIconFactory(
  nativeImageApi,
  { size: size = 0x10, stroke: stroke = 'CanvasText' } = {},
) {
  const iconCache = new Map();
  return (iconId) => {
    const definition = resolveContextMenuIconDefinition(iconId);
    if (!definition || typeof nativeImageApi?.['createFromDataURL'] !== 'function') return null;
    if (iconCache['has'](definition['id'])) return iconCache['get'](definition['id']);
    const svgMarkup = renderNativeContextMenuSvg(definition, stroke),
      dataUrl = 'data:image/svg+xml;base64,' + Buffer['from'](svgMarkup, 'utf8')['toString']('base64'),
      nativeIcon = nativeImageApi['createFromDataURL'](dataUrl);
    if (!nativeIcon || nativeIcon['isEmpty']?.() === !![]) return null;
    const sizedIcon =
      typeof nativeIcon['resize'] === 'function'
        ? nativeIcon['resize']({ width: size, height: size, quality: 'best' })
        : nativeIcon;
    return (iconCache['set'](definition['id'], sizedIcon), sizedIcon);
  };
}

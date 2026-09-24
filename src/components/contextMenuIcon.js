import { resolveContextMenuIconDefinition } from '../utils/contextMenuIconCatalog.js';
const SVG_NS = 'http://www.w3.org/2000/svg';
export function createContextMenuIcon(
  iconId,
  {
    documentObject: documentObject = globalThis['document'],
    size: size = 0x12,
    stroke: stroke = 'currentColor',
  } = {},
) {
  if (typeof documentObject?.['createElementNS'] !== 'function') return null;
  const definition = resolveContextMenuIconDefinition(iconId);
  if (!definition) return null;
  const svgElement = documentObject['createElementNS'](SVG_NS, 'svg');
  for (const [attributeName, attributeValue] of Object['entries']({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: stroke,
    'stroke-width': '1.8',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
    'data-context-menu-icon': definition['id'],
  })) {
    svgElement['setAttribute'](attributeName, String(attributeValue));
  }
  if (svgElement['dataset']) svgElement['dataset']['contextMenuIcon'] = definition['id'];
  for (const [shapeName, shapeAttributes] of definition['shapes']) {
    const shapeElement = documentObject['createElementNS'](SVG_NS, shapeName);
    for (const [shapeAttributeName, shapeAttributeValue] of Object['entries'](shapeAttributes))
      shapeElement['setAttribute'](shapeAttributeName, String(shapeAttributeValue));
    svgElement['appendChild'](shapeElement);
  }
  return svgElement;
}

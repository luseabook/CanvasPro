import { isNodeType } from '../modules/registry.js';
export function buildRendererNodeSignature({
  node: node,
  inEdgeSig: inEdgeSig = '',
  pickMode: pickMode = null,
  isSelected: isSelected = false,
  isSelectionRelated: isSelectionRelated = false,
  showVideoMeta: showVideoMeta = false,
  viewport: viewport = null,
  mediaLodMode: mediaLodMode = null,
} = {}) {
  (void isSelectionRelated, void viewport, void mediaLodMode);
  const value = node || {},
    item = pickMode && pickMode.active && pickMode.sourceNodeId === value.id ? '1' : '0',
    key = isSelected ? '1' : '0',
    index = typeof value._bizRev === 'number' ? value._bizRev : 0,
    isNodeType2 = isNodeType(value, ['source-video', 'ai-video']) && showVideoMeta === true ? '1' : '0';
  return index + '|' + inEdgeSig + '|' + item + '|' + key + '|' + isNodeType2;
}

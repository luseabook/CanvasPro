import { isNodeType } from '../modules/registry.js';
export function buildRendererNodeSignature({
  node: _0x57d317,
  inEdgeSig: inEdgeSig = '',
  pickMode: pickMode = null,
  isSelected: isSelected = false,
  isSelectionRelated: isSelectionRelated = false,
  showVideoMeta: showVideoMeta = false,
  viewport: viewport = null,
  mediaLodMode: mediaLodMode = null,
} = {}) {
  (void isSelectionRelated, void viewport, void mediaLodMode);
  const _0x284094 = _0x57d317 || {},
    _0x5c7a86 = pickMode && pickMode.active && pickMode.sourceNodeId === _0x284094.id ? '1' : '0',
    _0x4bd3a0 = isSelected ? '1' : '0',
    _0x31b125 = typeof _0x284094._bizRev === 'number' ? _0x284094._bizRev : 0,
    _0x3c0b2d = isNodeType(_0x284094, ['source-video', 'ai-video']) && showVideoMeta === true ? '1' : '0';
  return _0x31b125 + '|' + inEdgeSig + '|' + _0x5c7a86 + '|' + _0x4bd3a0 + '|' + _0x3c0b2d;
}

const EMPTY_TOOLS = Object['freeze']([]),
  FULL_TOOLS = Object['freeze'](['move', 'rotate', 'scale']),
  MOVE_ROTATE_TOOLS = Object['freeze'](['move', 'rotate']);
function normalizeTool(_0x1383a0) {
  return _0x1383a0 === 'select' ? 'move' : String(_0x1383a0 || '');
}
export function getStoryboard3DObjectTransformCapabilities(_0x569487) {
  const _0x217d38 = String(_0x569487?.['type'] || '');
  if (_0x217d38 === 'prop' || _0x217d38 === 'character')
    return {
      tools: FULL_TOOLS,
      fields: Object['freeze'](['position', 'rotation', 'scale']),
      groundSnap: !![],
    };
  if (_0x217d38 === 'camera')
    return { tools: MOVE_ROTATE_TOOLS, fields: Object['freeze'](['position', 'rotation']), groundSnap: ![] };
  if (_0x217d38 === 'light' && _0x569487?.['lightType'] !== 'ambient')
    return { tools: MOVE_ROTATE_TOOLS, fields: Object['freeze'](['position', 'rotation']), groundSnap: ![] };
  return { tools: EMPTY_TOOLS, fields: EMPTY_TOOLS, groundSnap: ![] };
}
export function canStoryboard3DObjectUseTransformTool(_0x23455d, _0x140e51) {
  return getStoryboard3DObjectTransformCapabilities(_0x23455d)['tools']['includes'](normalizeTool(_0x140e51));
}
export function canStoryboard3DObjectEditTransformField(_0x81cd58, _0x4d6a05) {
  return getStoryboard3DObjectTransformCapabilities(_0x81cd58)['fields']['includes'](_0x4d6a05);
}

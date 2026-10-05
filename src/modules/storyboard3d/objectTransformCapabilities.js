const EMPTY_TOOLS = Object['freeze']([]),
  FULL_TOOLS = Object['freeze'](['move', 'rotate', 'scale']),
  MOVE_ROTATE_TOOLS = Object['freeze'](['move', 'rotate']);
function normalizeTool(value) {
  return value === 'select' ? 'move' : String(value || '');
}
export function getStoryboard3DObjectTransformCapabilities(item) {
  const key = String(item?.['type'] || '');
  if (key === 'prop' || key === 'character')
    return {
      tools: FULL_TOOLS,
      fields: Object['freeze'](['position', 'rotation', 'scale']),
      groundSnap: true,
    };
  if (key === 'camera')
    return { tools: MOVE_ROTATE_TOOLS, fields: Object['freeze'](['position', 'rotation']), groundSnap: false };
  if (key === 'light' && item?.['lightType'] !== 'ambient')
    return { tools: MOVE_ROTATE_TOOLS, fields: Object['freeze'](['position', 'rotation']), groundSnap: false };
  return { tools: EMPTY_TOOLS, fields: EMPTY_TOOLS, groundSnap: false };
}
export function canStoryboard3DObjectUseTransformTool(index, result) {
  return getStoryboard3DObjectTransformCapabilities(index)['tools']['includes'](normalizeTool(result));
}
export function canStoryboard3DObjectEditTransformField(data, options) {
  return getStoryboard3DObjectTransformCapabilities(data)['fields']['includes'](options);
}

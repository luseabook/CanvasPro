import { IMAGE_MODELS } from '../../config/modelConfig.js';
import {
  buildImageFunctionModelCatalog,
  findImageFunctionProviderByModel,
  getDefaultImageFunctionModelState,
} from '../imageFunctionModelMenu.js';
export const ERASE_SELECTION_STATE_KEY = 'eraseSelectionState';
const ERASE_SELECTION_TOOLS = new Set(['brush', 'eraser']),
  clampPersistedEraseBrushSize = (value) => Math.max(1, Math.min(120, Number(value) || 40)),
  normalizePersistedEraseTool = (item) => {
    const key = String(item || '').trim();
    return ERASE_SELECTION_TOOLS.has(key) ? key : 'brush';
  };
export const buildGenerationModelCatalog = (index = IMAGE_MODELS) => {
  return buildImageFunctionModelCatalog(index);
};
export const findProviderKeyByModel = (result, data) => {
  const enabled = String(data || '').trim();
  if (!enabled) return null;
  for (const [options, target] of Object.entries(result || {})) {
    const list = Array.isArray(target?.models) ? target.models : [];
    if (list.some((item2) => item2?.id === enabled)) return options;
  }
  return findImageFunctionProviderByModel(result, enabled);
};
export const buildSeedreamMigrationPatch = (source) => {
  return (void source, null);
};
export const normalizePersistedEraseCommand = (box) => {
  if (!box || typeof box !== 'object') return null;
  const type = String(box.type || '').trim();
  if (type === 'brush' || type === 'eraser') {
    const list2 = Array.isArray(box.points) ? box.points : [],
      points = list2
        .map((box2) => ({ x: Number(box2?.x), y: Number(box2?.y) }))
        .filter((box3) => Number.isFinite(box3.x) && Number.isFinite(box3.y)),
      sizeWorld = Number(box.sizeWorld);
    if (!points.length || !Number.isFinite(sizeWorld)) return null;
    return { type: type, sizeWorld: sizeWorld, points: points };
  }
  if (type === 'rect') {
    const x1 = Number(box.x1),
      y1 = Number(box.y1),
      x2 = Number(box.x2),
      y2 = Number(box.y2),
      sizeWorld2 = Number(box.sizeWorld);
    if (
      !Number.isFinite(x1) ||
      !Number.isFinite(y1) ||
      !Number.isFinite(x2) ||
      !Number.isFinite(y2) ||
      !Number.isFinite(sizeWorld2)
    )
      return null;
    return {
      type: type,
      color: String(box.color || ''),
      sizeWorld: sizeWorld2,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
    };
  }
  if (type === 'fill') {
    const x = Number(box.x),
      y = Number(box.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return { type: type, x: x, y: y, color: String(box.color || '') };
  }
  return null;
};
export const readPersistedEraseSelectionState = (next) => {
  const enabled2 = next?.[ERASE_SELECTION_STATE_KEY];
  if (!enabled2 || typeof enabled2 !== 'object') return null;
  const commands = Array.isArray(enabled2.commands)
      ? enabled2.commands.map((item3) => normalizePersistedEraseCommand(item3)).filter(Boolean)
      : [],
    current = String(enabled2.tool || '').trim();
  return {
    commands: commands,
    tool: normalizePersistedEraseTool(current),
    brushSizePx: clampPersistedEraseBrushSize(enabled2.brushSizePx),
  };
};
export const buildPersistedEraseSelectionState = ({
  commands: commands2,
  tool: tool,
  brushSizePx: brushSizePx,
} = {}) => ({
  commands: Array.isArray(commands2)
    ? commands2.map((item4) => normalizePersistedEraseCommand(item4)).filter(Boolean)
    : [],
  tool: normalizePersistedEraseTool(tool),
  brushSizePx: clampPersistedEraseBrushSize(brushSizePx),
});
export const getDefaultGenerationModelState = (generationModelCatalog = buildGenerationModelCatalog()) => {
  return getDefaultImageFunctionModelState(generationModelCatalog);
};

export const LOCAL_EDIT_STATE_KEY = 'localEditState';

const LOCAL_EDIT_TOOLS = new Set(['brush', 'eraser']),
  clampPersistedLocalEditBrushSize = (entry) => Math['max'](0x1, Math['min'](0x78, Number(entry) || 0x28)),
  normalizePersistedLocalEditTool = (record) => {
    const payload = String(record || '')['trim']();
    return LOCAL_EDIT_TOOLS['has'](payload) ? payload : 'brush';
  };

export const normalizePersistedLocalEditCommand = (box4) => {
  if (!box4 || typeof box4 !== 'object') return null;
  const handle = String(box4['type'] || '')['trim']();
  if (handle === 'brush' || handle === 'eraser') {
    const state = Array['isArray'](box4['points']) ? box4['points'] : [],
      enabled3 = state['map']((box5) => ({ x: Number(box5?.['x']), y: Number(box5?.['y']) }))['filter'](
        (box6) => Number['isFinite'](box6['x']) && Number['isFinite'](box6['y']),
      ),
      config = Number(box4['sizeWorld']);
    if (!enabled3['length'] || !Number['isFinite'](config)) return null;
    return { type: handle, sizeWorld: config, points: enabled3 };
  }
  if (handle === 'rect') {
    const scope = Number(box4['x1']),
      input = Number(box4['y1']),
      output = Number(box4['x2']),
      value2 = Number(box4['y2']),
      value3 = Number(box4['sizeWorld']);
    if (
      !Number['isFinite'](scope) ||
      !Number['isFinite'](input) ||
      !Number['isFinite'](output) ||
      !Number['isFinite'](value2) ||
      !Number['isFinite'](value3)
    )
      return null;
    return {
      type: handle,
      color: String(box4['color'] || ''),
      sizeWorld: value3,
      x1: scope,
      y1: input,
      x2: output,
      y2: value2,
    };
  }
  if (handle === 'fill') {
    const value4 = Number(box4['x']),
      value5 = Number(box4['y']);
    if (!Number['isFinite'](value4) || !Number['isFinite'](value5)) return null;
    return { type: handle, x: value4, y: value5, color: String(box4['color'] || '') };
  }
  return null;
};

export const readLocalEditState = (value6) => {
  const enabled4 = value6?.[LOCAL_EDIT_STATE_KEY];
  if (!enabled4 || typeof enabled4 !== 'object') return null;
  return buildLocalEditState(enabled4);
};

export const buildLocalEditState = ({
  scene: scene,
  promptText: promptText,
  commands: commands3,
  tool: tool2,
  brushSizePx: brushSizePx2,
} = {}) => ({
  scene: scene === 'erase' ? 'erase' : 'repaint',
  promptText: String(promptText || ''),
  commands: Array['isArray'](commands3)
    ? commands3['map']((value7) => normalizePersistedLocalEditCommand(value7))['filter'](Boolean)
    : [],
  tool: normalizePersistedLocalEditTool(tool2),
  brushSizePx: clampPersistedLocalEditBrushSize(brushSizePx2),
});

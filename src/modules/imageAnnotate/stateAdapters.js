import { IMAGE_MODELS } from '../../config/modelConfig.js';
import {
  buildImageFunctionModelCatalog,
  findImageFunctionProviderByModel,
  getDefaultImageFunctionModelState,
} from '../imageFunctionModelMenu.js';
export const ERASE_SELECTION_STATE_KEY = 'eraseSelectionState';
const ERASE_SELECTION_TOOLS = new Set(['brush', 'eraser']),
  clampPersistedEraseBrushSize = (_0x494207) => Math.max(1, Math.min(120, Number(_0x494207) || 40)),
  normalizePersistedEraseTool = (_0x14380c) => {
    const _0x4d84a3 = String(_0x14380c || '').trim();
    return ERASE_SELECTION_TOOLS.has(_0x4d84a3) ? _0x4d84a3 : 'brush';
  };
export const buildGenerationModelCatalog = (_0x4f23ae = IMAGE_MODELS) => {
  return buildImageFunctionModelCatalog(_0x4f23ae);
};
export const findProviderKeyByModel = (_0x3875ed, _0x5464db) => {
  const _0x402f06 = String(_0x5464db || '').trim();
  if (!_0x402f06) return null;
  for (const [_0x131f38, _0x27f421] of Object.entries(_0x3875ed || {})) {
    const _0x21a9f4 = Array.isArray(_0x27f421?.models) ? _0x27f421.models : [];
    if (_0x21a9f4.some((_0x534479) => _0x534479?.id === _0x402f06)) return _0x131f38;
  }
  return findImageFunctionProviderByModel(_0x3875ed, _0x402f06);
};
export const buildSeedreamMigrationPatch = (_0x181dd3) => {
  return (void _0x181dd3, null);
};
export const normalizePersistedEraseCommand = (_0x50e53b) => {
  if (!_0x50e53b || typeof _0x50e53b !== 'object') return null;
  const _0x531a79 = String(_0x50e53b.type || '').trim();
  if (_0x531a79 === 'brush' || _0x531a79 === 'eraser') {
    const _0x328801 = Array.isArray(_0x50e53b.points) ? _0x50e53b.points : [],
      _0x14e54b = _0x328801
        .map((_0x6df511) => ({ x: Number(_0x6df511?.x), y: Number(_0x6df511?.y) }))
        .filter((_0x14a999) => Number.isFinite(_0x14a999.x) && Number.isFinite(_0x14a999.y)),
      _0xc777e8 = Number(_0x50e53b.sizeWorld);
    if (!_0x14e54b.length || !Number.isFinite(_0xc777e8)) return null;
    return { type: _0x531a79, sizeWorld: _0xc777e8, points: _0x14e54b };
  }
  if (_0x531a79 === 'rect') {
    const _0x428a21 = Number(_0x50e53b.x1),
      _0x3e5fa6 = Number(_0x50e53b.y1),
      _0x3b24ed = Number(_0x50e53b.x2),
      _0x308505 = Number(_0x50e53b.y2),
      _0x26adaa = Number(_0x50e53b.sizeWorld);
    if (
      !Number.isFinite(_0x428a21) ||
      !Number.isFinite(_0x3e5fa6) ||
      !Number.isFinite(_0x3b24ed) ||
      !Number.isFinite(_0x308505) ||
      !Number.isFinite(_0x26adaa)
    )
      return null;
    return {
      type: _0x531a79,
      color: String(_0x50e53b.color || ''),
      sizeWorld: _0x26adaa,
      x1: _0x428a21,
      y1: _0x3e5fa6,
      x2: _0x3b24ed,
      y2: _0x308505,
    };
  }
  if (_0x531a79 === 'fill') {
    const _0x43de79 = Number(_0x50e53b.x),
      _0x1432a5 = Number(_0x50e53b.y);
    if (!Number.isFinite(_0x43de79) || !Number.isFinite(_0x1432a5)) return null;
    return { type: _0x531a79, x: _0x43de79, y: _0x1432a5, color: String(_0x50e53b.color || '') };
  }
  return null;
};
export const readPersistedEraseSelectionState = (_0x1a779f) => {
  const _0x5d4468 = _0x1a779f?.[ERASE_SELECTION_STATE_KEY];
  if (!_0x5d4468 || typeof _0x5d4468 !== 'object') return null;
  const _0x248bba = Array.isArray(_0x5d4468.commands)
      ? _0x5d4468.commands.map((_0x2e004c) => normalizePersistedEraseCommand(_0x2e004c)).filter(Boolean)
      : [],
    _0x168660 = String(_0x5d4468.tool || '').trim();
  return {
    commands: _0x248bba,
    tool: normalizePersistedEraseTool(_0x168660),
    brushSizePx: clampPersistedEraseBrushSize(_0x5d4468.brushSizePx),
  };
};
export const buildPersistedEraseSelectionState = ({
  commands: _0x19e417,
  tool: _0x583626,
  brushSizePx: _0x1a1e2d,
} = {}) => ({
  commands: Array.isArray(_0x19e417)
    ? _0x19e417.map((_0x3ffbbb) => normalizePersistedEraseCommand(_0x3ffbbb)).filter(Boolean)
    : [],
  tool: normalizePersistedEraseTool(_0x583626),
  brushSizePx: clampPersistedEraseBrushSize(_0x1a1e2d),
});
export const getDefaultGenerationModelState = (_0x3f6cf9 = buildGenerationModelCatalog()) => {
  return getDefaultImageFunctionModelState(_0x3f6cf9);
};

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

export const LOCAL_EDIT_STATE_KEY='localEditState';

const LOCAL_EDIT_TOOLS=new Set(['brush',"eraser"]),clampPersistedLocalEditBrushSize=_0x34044c=>Math["max"](0x1,Math["min"](0x78,Number(_0x34044c)||0x28)),normalizePersistedLocalEditTool=_0x598115=>{const _0x3ac8b6=String(_0x598115||'')['trim']();return LOCAL_EDIT_TOOLS['has'](_0x3ac8b6)?_0x3ac8b6:"brush";};

export const normalizePersistedLocalEditCommand=_0x5a9961=>{if(!_0x5a9961||typeof _0x5a9961!=="object")return null;const _0x58de70=String(_0x5a9961['type']||'')["trim"]();if(_0x58de70==='brush'||_0x58de70==="eraser"){const _0x2b68d0=Array["isArray"](_0x5a9961["points"])?_0x5a9961["points"]:[],_0x12bb5c=_0x2b68d0["map"](_0x201ea4=>({'x':Number(_0x201ea4?.['x']),'y':Number(_0x201ea4?.['y'])}))['filter'](_0x3e4b76=>Number["isFinite"](_0x3e4b76['x'])&&Number["isFinite"](_0x3e4b76['y'])),_0xa95b10=Number(_0x5a9961["sizeWorld"]);if(!_0x12bb5c["length"]||!Number["isFinite"](_0xa95b10))return null;return{'type':_0x58de70,'sizeWorld':_0xa95b10,'points':_0x12bb5c};}if(_0x58de70==="rect"){const _0xeca749=Number(_0x5a9961['x1']),_0x315caa=Number(_0x5a9961['y1']),_0x5f58d9=Number(_0x5a9961['x2']),_0x596fe4=Number(_0x5a9961['y2']),_0x9c0a5b=Number(_0x5a9961["sizeWorld"]);if(!Number['isFinite'](_0xeca749)||!Number["isFinite"](_0x315caa)||!Number['isFinite'](_0x5f58d9)||!Number['isFinite'](_0x596fe4)||!Number["isFinite"](_0x9c0a5b))return null;return{'type':_0x58de70,'color':String(_0x5a9961["color"]||''),'sizeWorld':_0x9c0a5b,'x1':_0xeca749,'y1':_0x315caa,'x2':_0x5f58d9,'y2':_0x596fe4};}if(_0x58de70==="fill"){const _0x232841=Number(_0x5a9961['x']),_0x18687c=Number(_0x5a9961['y']);if(!Number["isFinite"](_0x232841)||!Number["isFinite"](_0x18687c))return null;return{'type':_0x58de70,'x':_0x232841,'y':_0x18687c,'color':String(_0x5a9961["color"]||'')};}return null;};

export const readLocalEditState=_0x5c8fa2=>{const _0x1fe718=_0x5c8fa2?.[LOCAL_EDIT_STATE_KEY];if(!_0x1fe718||typeof _0x1fe718!=='object')return null;return buildLocalEditState(_0x1fe718);};

export const buildLocalEditState=({scene:_0x219ea3,promptText:_0x140b45,commands:_0x321ba9,tool:_0x3a279e,brushSizePx:_0x2ca523}={})=>({'scene':_0x219ea3==="erase"?"erase":"repaint",'promptText':String(_0x140b45||''),'commands':Array["isArray"](_0x321ba9)?_0x321ba9["map"](_0x43cff2=>normalizePersistedLocalEditCommand(_0x43cff2))["filter"](Boolean):[],'tool':normalizePersistedLocalEditTool(_0x3a279e),'brushSizePx':clampPersistedLocalEditBrushSize(_0x2ca523)});

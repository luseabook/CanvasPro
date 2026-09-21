import { generateId } from '../../core/math.js';
import { t } from '../../i18n/index.js';
export const WORKFLOW_LIMITS = { nameMax: 50, tagMax: 5, tagLengthMax: 12, noteMax: 0x12c };
function deepClone(_0x151254) {
  if (typeof structuredClone === 'function')
    try {
      return structuredClone(_0x151254);
    } catch {}
  return JSON.parse(JSON.stringify(_0x151254));
}
function cleanText(_0x1f355c, _0x4ac764 = Infinity) {
  const _0x6f26da = String(_0x1f355c ?? '').trim();
  if (!Number.isFinite(_0x4ac764)) return _0x6f26da;
  return _0x6f26da.slice(0, _0x4ac764);
}
function workflowCanvasText(_0x442909, _0x444047 = {}) {
  return t('workflows.canvas.' + _0x442909, _0x444047);
}
export function normalizeWorkflowTags(_0x304fdb) {
  const _0x49fdd2 = Array.isArray(_0x304fdb) ? _0x304fdb : [],
    _0x3169ed = new Set(),
    _0xe5b02a = [];
  for (const _0xe11adb of _0x49fdd2) {
    const _0x33240c = cleanText(_0xe11adb, WORKFLOW_LIMITS.tagLengthMax);
    if (!_0x33240c) continue;
    const _0x364cb0 = _0x33240c.toLowerCase();
    if (_0x3169ed.has(_0x364cb0)) continue;
    (_0x3169ed.add(_0x364cb0), _0xe5b02a.push(_0x33240c));
    if (_0xe5b02a.length >= WORKFLOW_LIMITS.tagMax) break;
  }
  return _0xe5b02a;
}
export function normalizeWorkflowMeta(_0x32900d = {}, _0x3ef744 = {}) {
  const _0x51b487 = cleanText(_0x32900d.name ?? _0x3ef744.name, WORKFLOW_LIMITS.nameMax),
    _0x17b489 = cleanText(_0x32900d.note ?? _0x3ef744.note, WORKFLOW_LIMITS.noteMax);
  return {
    name: _0x51b487,
    cover: cleanText(_0x32900d.cover ?? _0x3ef744.cover),
    tags: normalizeWorkflowTags(_0x32900d.tags ?? _0x3ef744.tags),
    note: _0x17b489,
  };
}
function requireWorkflowName(_0x33a319) {
  if (!cleanText(_0x33a319)) throw new Error(workflowCanvasText('workflowNameRequired'));
}
function normalizeCanvasState(_0x19ba6a) {
  const _0xc095e9 = _0x19ba6a && typeof _0x19ba6a === 'object' ? _0x19ba6a : {};
  return {
    nodes: Array.isArray(_0xc095e9.nodes) ? deepClone(_0xc095e9.nodes) : [],
    edges: Array.isArray(_0xc095e9.edges) ? deepClone(_0xc095e9.edges) : [],
    viewport:
      _0xc095e9.viewport && typeof _0xc095e9.viewport === 'object' ? { ..._0xc095e9.viewport } : undefined,
  };
}
function isGroupNode(_0x14137e) {
  return cleanText(_0x14137e?.type).toLowerCase() === 'group';
}
function isRootNode(_0xaf906d) {
  return !cleanText(_0xaf906d?.parentId);
}
function syncSingleRootGroupName(_0x511139, _0x373fd4) {
  const _0xa41551 = cleanText(_0x373fd4, WORKFLOW_LIMITS.nameMax);
  if (!_0xa41551 || !Array.isArray(_0x511139?.nodes)) return _0x511139;
  const _0x44d410 = _0x511139.nodes.filter((_0x456a02) => isGroupNode(_0x456a02) && isRootNode(_0x456a02));
  if (_0x44d410.length !== 1) return _0x511139;
  return {
    ..._0x511139,
    nodes: _0x511139.nodes.map((_0x1cd094) =>
      _0x1cd094 === _0x44d410[0] ? { ..._0x1cd094, name: _0xa41551 } : _0x1cd094,
    ),
  };
}
function edgeSourceId(_0x2f4944) {
  return String(_0x2f4944?.sourceId ?? _0x2f4944?.source ?? '').trim();
}
function edgeTargetId(_0xc2f04d) {
  return String(_0xc2f04d?.targetId ?? _0xc2f04d?.target ?? '').trim();
}
function normalizeNodeRecord(_0x322fb9) {
  if (!_0x322fb9 || typeof _0x322fb9 !== 'object') return {};
  if (Array.isArray(_0x322fb9))
    return _0x322fb9.reduce((_0x54db09, _0x4be475) => {
      const _0x2897fe = cleanText(_0x4be475?.id);
      if (_0x2897fe) _0x54db09[_0x2897fe] = _0x4be475;
      return _0x54db09;
    }, {});
  return _0x322fb9;
}
export function collectWorkflowGroupNodeIds(_0x40eedf, _0x5d1bf3) {
  const _0x490ff3 = cleanText(_0x5d1bf3);
  if (!_0x490ff3) return new Set();
  const _0x3314bd = normalizeNodeRecord(_0x40eedf);
  if (!_0x3314bd[_0x490ff3]) return new Set();
  const _0x21b088 = new Set([_0x490ff3]),
    _0x21b3d0 = [_0x490ff3];
  while (_0x21b3d0.length > 0) {
    const _0x372458 = _0x21b3d0.pop();
    for (const _0x480042 of Object.values(_0x3314bd)) {
      const _0x5ca7b9 = cleanText(_0x480042?.id);
      if (!_0x5ca7b9 || _0x21b088.has(_0x5ca7b9)) continue;
      if (cleanText(_0x480042?.parentId) !== _0x372458) continue;
      (_0x21b088.add(_0x5ca7b9), _0x21b3d0.push(_0x5ca7b9));
    }
  }
  return _0x21b088;
}
export function sliceCanvasStateForWorkflow(_0x29fa6e, _0x515ad4, _0x471421) {
  const _0x530a6a = normalizeCanvasState(_0x29fa6e),
    _0x4d56c7 = cleanText(_0x471421);
  if (!_0x4d56c7) return _0x530a6a;
  const _0x21ed13 = collectWorkflowGroupNodeIds(_0x515ad4, _0x4d56c7);
  if (_0x21ed13.size === 0) return { ..._0x530a6a, nodes: [], edges: [] };
  const _0x310380 = _0x530a6a.nodes.filter((_0x13cdfc) => _0x21ed13.has(cleanText(_0x13cdfc?.id))),
    _0x514394 = new Set(_0x310380.map((_0x4d890f) => cleanText(_0x4d890f?.id)).filter(Boolean)),
    _0xa2cba3 = _0x530a6a.edges.filter((_0x2fb605) => {
      const _0x591760 = edgeSourceId(_0x2fb605),
        _0x53292f = edgeTargetId(_0x2fb605);
      return _0x514394.has(_0x591760) && _0x514394.has(_0x53292f);
    });
  return { ..._0x530a6a, nodes: _0x310380, edges: _0xa2cba3 };
}
export function createWorkflowFromCanvas(_0x46c553, _0x11cfea = {}) {
  const _0x3fb9a7 = Date.now(),
    _0x363281 = normalizeWorkflowMeta(_0x11cfea);
  requireWorkflowName(_0x363281.name);
  const _0x1bf9d8 = syncSingleRootGroupName(normalizeCanvasState(_0x46c553), _0x363281.name);
  return {
    id: cleanText(_0x11cfea.id) || generateId('workflow'),
    name: _0x363281.name,
    cover: _0x363281.cover,
    tags: _0x363281.tags,
    note: _0x363281.note,
    createdAt: Number.isFinite(Number(_0x11cfea.createdAt)) ? Number(_0x11cfea.createdAt) : _0x3fb9a7,
    updatedAt: _0x3fb9a7,
    lastUsedAt:
      _0x11cfea.lastUsedAt == null || !Number.isFinite(Number(_0x11cfea.lastUsedAt))
        ? undefined
        : Number(_0x11cfea.lastUsedAt),
    nodeCount: _0x1bf9d8.nodes.length,
    edgeCount: _0x1bf9d8.edges.length,
    version: 1,
    workflowData: _0x1bf9d8,
  };
}
export function updateWorkflowFromCanvas(_0x47893b, _0x4442ce, _0x37b709 = {}) {
  const _0x24a648 = _0x37b709.existingWorkflow || {},
    _0x59d1cf = cleanText(_0x47893b || _0x24a648.id || _0x37b709.id);
  if (!_0x59d1cf) throw new Error(workflowCanvasText('missingUpdateWorkflowId'));
  const _0x2da7f2 = normalizeWorkflowMeta(_0x37b709, _0x24a648);
  requireWorkflowName(_0x2da7f2.name);
  const _0x543f0a = syncSingleRootGroupName(normalizeCanvasState(_0x4442ce), _0x2da7f2.name);
  return {
    ..._0x24a648,
    id: _0x59d1cf,
    name: _0x2da7f2.name,
    cover: _0x2da7f2.cover,
    tags: _0x2da7f2.tags,
    note: _0x2da7f2.note,
    createdAt: Number.isFinite(Number(_0x24a648.createdAt)) ? Number(_0x24a648.createdAt) : Date.now(),
    updatedAt: Date.now(),
    lastUsedAt: _0x24a648.lastUsedAt,
    nodeCount: _0x543f0a.nodes.length,
    edgeCount: _0x543f0a.edges.length,
    version: Number.isFinite(Number(_0x24a648.version)) ? Number(_0x24a648.version) : 1,
    workflowData: _0x543f0a,
  };
}
export function calcWorkflowBounds(_0x228874) {
  const _0x2a638c = Array.isArray(_0x228874) ? _0x228874 : [];
  let _0x38a9d7 = Infinity,
    _0x1aea7c = Infinity,
    _0x5776db = -Infinity,
    _0x428d41 = -Infinity;
  for (const _0x5c963e of _0x2a638c) {
    if (!_0x5c963e) continue;
    const _0x59f3a7 = Number(_0x5c963e.x) || 0,
      _0x3237b5 = Number(_0x5c963e.y) || 0,
      _0x103b5b = Number(_0x5c963e.width ?? _0x5c963e.w) || 100,
      _0x1099b6 = Number(_0x5c963e.height ?? _0x5c963e.h) || 100;
    ((_0x38a9d7 = Math.min(_0x38a9d7, _0x59f3a7)),
      (_0x1aea7c = Math.min(_0x1aea7c, _0x3237b5)),
      (_0x5776db = Math.max(_0x5776db, _0x59f3a7 + _0x103b5b)),
      (_0x428d41 = Math.max(_0x428d41, _0x3237b5 + _0x1099b6)));
  }
  if (!Number.isFinite(_0x38a9d7) || !Number.isFinite(_0x1aea7c))
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0, cx: 0, cy: 0 };
  const _0x48b2c9 = Math.max(0, _0x5776db - _0x38a9d7),
    _0x44a9db = Math.max(0, _0x428d41 - _0x1aea7c);
  return {
    minX: _0x38a9d7,
    minY: _0x1aea7c,
    maxX: _0x5776db,
    maxY: _0x428d41,
    width: _0x48b2c9,
    height: _0x44a9db,
    cx: _0x38a9d7 + _0x48b2c9 / 2,
    cy: _0x1aea7c + _0x44a9db / 2,
  };
}
export function calcWorkflowCenterOffset(_0x2f8d61, _0x3f62a8) {
  const _0x40ec78 = { x: Number(_0x3f62a8?.x) || 0, y: Number(_0x3f62a8?.y) || 0 },
    _0x5c4905 = calcWorkflowBounds(_0x2f8d61);
  return { dx: _0x40ec78.x - _0x5c4905.cx, dy: _0x40ec78.y - _0x5c4905.cy };
}
export function remapWorkflowNodeIds(_0x584454, _0x332458) {
  const _0x4192ce = Array.isArray(_0x584454) ? _0x584454 : [],
    _0x327250 = Array.isArray(_0x332458) ? _0x332458 : [],
    _0x416fd1 = {},
    _0x4e8c45 = _0x4192ce
      .filter((_0x48fc2a) => _0x48fc2a && typeof _0x48fc2a === 'object' && cleanText(_0x48fc2a.id))
      .map((_0x37daee) => {
        const _0x5ca07b = deepClone(_0x37daee),
          _0x3f442c = cleanText(_0x5ca07b.id),
          _0x201ea3 = generateId(cleanText(_0x5ca07b.type) || 'node');
        return ((_0x416fd1[_0x3f442c] = _0x201ea3), (_0x5ca07b.id = _0x201ea3), _0x5ca07b);
      });
  for (const _0x1c02b3 of _0x4e8c45) {
    const _0x2c6df0 = cleanText(_0x1c02b3.parentId);
    if (!_0x2c6df0) {
      _0x1c02b3.parentId = _0x1c02b3.parentId == null ? null : _0x1c02b3.parentId;
      continue;
    }
    _0x1c02b3.parentId = _0x416fd1[_0x2c6df0] || null;
  }
  const _0x2dd0eb = [];
  for (const _0x548436 of _0x327250) {
    if (!_0x548436 || typeof _0x548436 !== 'object') continue;
    const _0x33d9f6 = edgeSourceId(_0x548436),
      _0x4dc479 = edgeTargetId(_0x548436),
      _0xbb67d1 = _0x416fd1[_0x33d9f6],
      _0x556af1 = _0x416fd1[_0x4dc479];
    if (!_0xbb67d1 || !_0x556af1) continue;
    const _0x4e3951 = deepClone(_0x548436);
    ((_0x4e3951.id = generateId('edge')),
      (_0x4e3951.sourceId = _0xbb67d1),
      (_0x4e3951.targetId = _0x556af1),
      Object.prototype.hasOwnProperty.call(_0x4e3951, 'source') && (_0x4e3951.source = _0xbb67d1),
      Object.prototype.hasOwnProperty.call(_0x4e3951, 'target') && (_0x4e3951.target = _0x556af1),
      _0x2dd0eb.push(_0x4e3951));
  }
  return { nodes: _0x4e8c45, edges: _0x2dd0eb, idMap: _0x416fd1 };
}
export function applyWorkflowToCanvas(_0x54d2b4, _0x3c9e86) {
  const _0x3d0190 =
      _0x54d2b4?.workflowData && typeof _0x54d2b4.workflowData === 'object' ? _0x54d2b4.workflowData : {},
    _0x1be7c1 = syncSingleRootGroupName(_0x3d0190, _0x54d2b4?.name),
    {
      nodes: _0x17b6b0,
      edges: _0x9a863f,
      idMap: _0x29f56e,
    } = remapWorkflowNodeIds(_0x1be7c1.nodes, _0x1be7c1.edges),
    _0x49b107 = _0x3c9e86?.center || _0x3c9e86 || { x: 0, y: 0 },
    { dx: _0x39d506, dy: _0x5f48f8 } = calcWorkflowCenterOffset(_0x17b6b0, _0x49b107),
    _0x1b37fc = _0x17b6b0.map((_0x113fa2) => ({
      ..._0x113fa2,
      x: (Number(_0x113fa2.x) || 0) + _0x39d506,
      y: (Number(_0x113fa2.y) || 0) + _0x5f48f8,
    }));
  return { nodes: _0x1b37fc, edges: _0x9a863f, idMap: _0x29f56e, dx: _0x39d506, dy: _0x5f48f8 };
}

import { findAvailablePosition } from '../core/math.js';
import { getNodeSpawnPrefs } from './nodeSpawn.js';
function asObject(_0x2d22df) {
  return _0x2d22df && typeof _0x2d22df === 'object' && !Array['isArray'](_0x2d22df) ? _0x2d22df : {};
}
function normalizeText(_0x403b8f) {
  return String(_0x403b8f || '')['trim']();
}
function withoutNodeType(_0x55c3e4) {
  const _0x2ef9e4 = { ...asObject(_0x55c3e4) };
  return (delete _0x2ef9e4['type'], _0x2ef9e4);
}
function normalizeProjectBindingPolicies(_0x3094fa) {
  const _0x3a30b4 = Array['isArray'](_0x3094fa) ? _0x3094fa : [];
  if (
    !_0x3a30b4['length'] ||
    _0x3a30b4['some'](
      (_0x231449) =>
        typeof _0x231449?.['getProjectId'] !== 'function' ||
        typeof _0x231449?.['findProjectAnchor'] !== 'function',
    )
  )
    throw new Error('workspace\x20canvas\x20materialization\x20binding\x20policies\x20are\x20incomplete');
  return _0x3a30b4;
}
export function createWorkspaceCanvasMaterializationAdapter({
  canvasTabManager: _0x5bee39,
  createNodeAtCursor: _0x3950c1,
  getGraphState: _0x485596,
  getGraphSnapshot: getGraphSnapshot = null,
  restoreGraphSnapshot: restoreGraphSnapshot = null,
  updateNodeData: _0x8cf916,
  moveNode: _0x35bfe7,
  deleteNodes: _0x420c46 = null,
  connectNodes: _0x4289b9 = null,
  groupNodes: groupNodes = null,
  focusNodes: _0x384f19 = null,
  getNodeSize: getNodeSize = () => ({}),
  projectBindingPolicies: projectBindingPolicies = [],
  commit: commit = () => {},
} = {}) {
  if (
    typeof _0x5bee39?.['addCanvas'] !== 'function' ||
    typeof _0x5bee39?.['getActiveCanvasId'] !== 'function' ||
    typeof _0x3950c1 !== 'function' ||
    typeof _0x485596 !== 'function' ||
    typeof _0x8cf916 !== 'function' ||
    typeof _0x35bfe7 !== 'function'
  )
    throw new Error('workspace canvas materialization adapter dependencies are incomplete');
  const _0x1524f9 = normalizeProjectBindingPolicies(projectBindingPolicies),
    _0x526c87 = (_0x24d5ec) => asObject(_0x485596()?.['nodes'])[normalizeText(_0x24d5ec)] || null,
    _0x517169 = (..._0xfe656d) => {
      for (const _0x18d6f4 of _0xfe656d) {
        for (const _0x20093f of _0x1524f9) {
          const _0x33f80d = normalizeText(_0x20093f['getProjectId'](_0x18d6f4));
          if (_0x33f80d) return { policy: _0x20093f, projectId: _0x33f80d };
        }
      }
      return null;
    },
    _0x308ac6 = (_0x8aa8ee) => {
      const _0x1cd16b = normalizeText(_0x8aa8ee?.['projectId']),
        _0x53ca3e = _0x8aa8ee?.['policy'];
      if (!_0x1cd16b || typeof _0x53ca3e?.['findProjectAnchor'] !== 'function') return null;
      const _0x39b4a7 = Object['values'](asObject(_0x485596()?.['nodes']));
      return _0x53ca3e['findProjectAnchor']({ nodes: _0x39b4a7, projectId: _0x1cd16b }) || null;
    };
  return {
    canvasExists(_0x5d4f71) {
      const _0x1250df = normalizeText(_0x5d4f71);
      if (!_0x1250df) return ![];
      const _0x48acab = _0x5bee39['getMultiDataSnapshot']?.() || {};
      return Array['isArray'](_0x48acab['canvases'])
        ? _0x48acab['canvases']['some']((_0x390e04) => normalizeText(_0x390e04?.['id']) === _0x1250df)
        : normalizeText(_0x5bee39['getActiveCanvasId']()) === _0x1250df;
    },
    async switchCanvas(_0x9a18de) {
      const _0xc5a3ae = normalizeText(_0x9a18de);
      if (!_0xc5a3ae) return ![];
      if (normalizeText(_0x5bee39['getActiveCanvasId']()) === _0xc5a3ae) return !![];
      if (typeof _0x5bee39['switchTo'] !== 'function') return ![];
      return (await _0x5bee39['switchTo'](_0xc5a3ae)) !== ![];
    },
    async createCanvas(_0x36ebe3) {
      await _0x5bee39['addCanvas']();
      const _0x1e2165 = normalizeText(_0x5bee39['getActiveCanvasId']());
      if (!_0x1e2165) throw new Error('新建项目画布后未获得活动画布 ID');
      return (_0x5bee39['renameCanvas']?.(_0x1e2165, _0x36ebe3), _0x1e2165);
    },
    renameCanvas(_0x490378, _0x3a3c66) {
      _0x5bee39['renameCanvas']?.(_0x490378, _0x3a3c66);
    },
    nodeExists(_0x298ead) {
      return Boolean(_0x526c87(_0x298ead));
    },
    getNode(_0x4b55bf) {
      return _0x526c87(_0x4b55bf);
    },
    async createNode(_0x24cb66, _0x1c1155 = {}) {
      const _0x5d7e3e = normalizeText(_0x1c1155['type'] || _0x24cb66?.['type']),
        _0x1a0543 = asObject(getNodeSize(_0x5d7e3e)),
        _0x203b3 = Number(_0x1c1155['width']) || Number(_0x1a0543['width']) || undefined,
        _0x3f01b4 = Number(_0x1c1155['height']) || Number(_0x1a0543['height']) || undefined,
        _0x3f3fe3 = _0x3950c1(_0x5d7e3e, _0x203b3, _0x3f01b4, _0x24cb66?.['name'], {
          placement: 'viewport-center-sequence',
          sequenceKey: _0x1c1155['sequenceKey'],
          skipCommit: !![],
        });
      if (!_0x3f3fe3?.['id']) throw new Error('创建项目画布节点失败：' + (_0x24cb66?.['name'] || _0x5d7e3e));
      const _0x2d5b90 = withoutNodeType(_0x24cb66);
      _0x8cf916(_0x3f3fe3['id'], _0x2d5b90);
      const _0x23e0d3 = _0x526c87(_0x3f3fe3['id']) || { ..._0x3f3fe3, ..._0x2d5b90 },
        _0x18474b = _0x517169(_0x24cb66),
        _0x3f5105 = _0x308ac6(_0x18474b) || _0x23e0d3,
        _0x141f18 = asObject(_0x1c1155['position']),
        _0x61a873 = Number(_0x3f5105['x'] || 0x0) + (Number(_0x141f18['x']) || 0x0),
        _0x5a9b40 = Number(_0x3f5105['y'] || 0x0) + (Number(_0x141f18['y']) || 0x0),
        _0x46d319 = getNodeSpawnPrefs(),
        _0x48d020 = new Set(
          [normalizeText(_0x3f3fe3['id']), normalizeText(_0x1c1155['parentNodeId'])]['filter'](Boolean),
        ),
        _0x127f86 = Object['fromEntries'](
          Object['entries'](asObject(_0x485596()?.['nodes']))['filter'](
            ([_0xf33644]) => !_0x48d020['has'](normalizeText(_0xf33644)),
          ),
        ),
        _0x3a71eb =
          _0x46d319['direction'] === 'down' || _0x46d319['direction'] === 'left'
            ? _0x46d319['direction']
            : 'right',
        _0x455836 =
          _0x46d319['avoidOverlap'] === ![]
            ? { x: _0x61a873, y: _0x5a9b40 }
            : findAvailablePosition(
                _0x127f86,
                _0x61a873,
                _0x5a9b40,
                Number(_0x23e0d3['width']) || _0x203b3,
                Number(_0x23e0d3['height']) || _0x3f01b4,
                Math['max'](0x0, Number(_0x46d319['spacing']) || 0x0),
                _0x3a71eb,
              ),
        _0x18460c = _0x455836['x'] - Number(_0x23e0d3['x'] || 0x0),
        _0x2ba776 = _0x455836['y'] - Number(_0x23e0d3['y'] || 0x0);
      if (_0x18460c || _0x2ba776) _0x35bfe7(_0x3f3fe3['id'], _0x18460c, _0x2ba776);
      return _0x526c87(_0x3f3fe3['id']) || { ..._0x23e0d3, x: _0x455836['x'], y: _0x455836['y'] };
    },
    async updateNode(_0x33b7b8, _0x2677a4, _0xe43bb = {}) {
      const _0x3aeca7 = normalizeText(_0x33b7b8);
      if (!_0x3aeca7) return null;
      const _0x99fa0f = _0x526c87(_0x3aeca7),
        _0x575736 = Number(_0xe43bb['width']),
        _0x347a74 = Number(_0xe43bb['height']),
        _0x18f709 = {
          ...withoutNodeType(_0x2677a4),
          ...(_0x575736 > 0x0 ? { width: _0x575736 } : {}),
          ...(_0x347a74 > 0x0 ? { height: _0x347a74 } : {}),
        };
      _0x8cf916(_0x3aeca7, _0x18f709);
      if (_0xe43bb['position'] && _0x99fa0f) {
        const _0x41713e = _0x517169(_0x2677a4, _0x99fa0f),
          _0x73ed18 = _0x308ac6(_0x41713e) || _0x526c87(_0x3aeca7),
          _0x4d2aff = asObject(_0xe43bb['position']),
          _0x3869ef = Number(_0x73ed18?.['x'] || 0x0) + (Number(_0x4d2aff['x']) || 0x0),
          _0x107abc = Number(_0x73ed18?.['y'] || 0x0) + (Number(_0x4d2aff['y']) || 0x0),
          _0x1130b5 = _0x526c87(_0x3aeca7) || _0x99fa0f,
          _0x56e1ec = _0x3869ef - Number(_0x1130b5?.['x'] || 0x0),
          _0x985c70 = _0x107abc - Number(_0x1130b5?.['y'] || 0x0);
        if (_0x56e1ec || _0x985c70) _0x35bfe7(_0x3aeca7, _0x56e1ec, _0x985c70);
      }
      return _0x526c87(_0x3aeca7) || { id: _0x3aeca7, ..._0x18f709 };
    },
    deleteNodes(_0x92bf0f = []) {
      if (typeof _0x420c46 !== 'function') return ![];
      const _0x1d18ed = (Array['isArray'](_0x92bf0f) ? _0x92bf0f : [])
        ['map'](normalizeText)
        ['filter']((_0x27c351) => _0x27c351 && _0x526c87(_0x27c351));
      if (!_0x1d18ed['length']) return !![];
      return (_0x420c46([...new Set(_0x1d18ed)]), !![]);
    },
    createMutationSnapshot() {
      if (typeof getGraphSnapshot !== 'function') return null;
      return getGraphSnapshot();
    },
    restoreMutationSnapshot(_0x4633c5) {
      if (!_0x4633c5 || typeof restoreGraphSnapshot !== 'function') return ![];
      return restoreGraphSnapshot(_0x4633c5) !== ![];
    },
    async deleteCanvas(_0x48286) {
      const _0x5e01e8 = normalizeText(_0x48286);
      if (!_0x5e01e8 || typeof _0x5bee39?.['deleteCanvas'] !== 'function') return ![];
      return (await _0x5bee39['deleteCanvas'](_0x5e01e8, { skipDirtyConfirm: !![] })) !== ![];
    },
    setNodeParent(_0xd54fb9, _0xff7b46) {
      const _0x48b6a8 = normalizeText(_0xd54fb9),
        _0x27e6f0 = normalizeText(_0xff7b46);
      if (!_0x48b6a8 || !_0x27e6f0) return ![];
      if (normalizeText(_0x526c87(_0x48b6a8)?.['parentId']) === _0x27e6f0) return !![];
      if (typeof groupNodes !== 'function') return ![];
      const _0x2f21cd = groupNodes([_0x48b6a8], _0x27e6f0);
      return _0x2f21cd !== ![];
    },
    connectNodes(_0x1774b4, _0x90f014, _0x2da3ce = {}) {
      const _0x25a098 = normalizeText(_0x1774b4),
        _0x18b832 = normalizeText(_0x90f014);
      if (!_0x25a098 || !_0x18b832) return ![];
      const _0x3dcb67 = _0x485596()?.['edges'],
        _0x176cb2 = Array['isArray'](_0x3dcb67) ? _0x3dcb67 : Object['values'](asObject(_0x3dcb67)),
        _0x2e1e20 = _0x176cb2['some'](
          (_0x5a6bd9) =>
            normalizeText(_0x5a6bd9?.['sourceId']) === _0x25a098 &&
            normalizeText(_0x5a6bd9?.['targetId']) === _0x18b832,
        );
      if (_0x2e1e20) return !![];
      if (typeof _0x4289b9 !== 'function') return ![];
      const _0x65b3c0 = _0x4289b9({
        sourceId: _0x25a098,
        targetId: _0x18b832,
        preferredRefSlot: normalizeText(_0x2da3ce['preferredRefSlot']),
      });
      return _0x65b3c0 !== ![];
    },
    focusNodes(_0x3c1b10, _0x515b4f = {}) {
      if (typeof _0x384f19 !== 'function') return ![];
      const _0x4bac0b = Array['isArray'](_0x3c1b10) ? _0x3c1b10['map'](normalizeText)['filter'](Boolean) : [];
      if (!_0x4bac0b['length']) return ![];
      return _0x384f19(_0x4bac0b, _0x515b4f['padding'], _0x515b4f['durationMs'], _0x515b4f);
    },
    commit: commit,
  };
}

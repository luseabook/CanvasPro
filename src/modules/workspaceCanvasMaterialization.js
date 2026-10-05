import { findAvailablePosition } from '../core/math.js';
import { getNodeSpawnPrefs } from './nodeSpawn.js';
function asObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value) ? value : {};
}
function normalizeText(item) {
  return String(item || '')['trim']();
}
function withoutNodeType(key) {
  const index = { ...asObject(key) };
  return (delete index['type'], index);
}
function normalizeProjectBindingPolicies(result) {
  const list = Array['isArray'](result) ? result : [];
  if (
    !list['length'] ||
    list['some'](
      (data) =>
        typeof data?.['getProjectId'] !== 'function' || typeof data?.['findProjectAnchor'] !== 'function',
    )
  )
    throw new Error('workspace canvas materialization binding policies are incomplete');
  return list;
}
export function createWorkspaceCanvasMaterializationAdapter({
  canvasTabManager: canvasTabManager,
  createNodeAtCursor: createNodeAtCursor,
  getGraphState: getGraphState,
  getGraphSnapshot: getGraphSnapshot = null,
  restoreGraphSnapshot: restoreGraphSnapshot = null,
  updateNodeData: updateNodeData,
  moveNode: moveNode,
  deleteNodes: deleteNodes2 = null,
  connectNodes: connectNodes2 = null,
  groupNodes: groupNodes = null,
  focusNodes: focusNodes2 = null,
  getNodeSize: getNodeSize = () => ({}),
  projectBindingPolicies: projectBindingPolicies = [],
  commit: commit = () => {},
} = {}) {
  if (
    typeof canvasTabManager?.['addCanvas'] !== 'function' ||
    typeof canvasTabManager?.['getActiveCanvasId'] !== 'function' ||
    typeof createNodeAtCursor !== 'function' ||
    typeof getGraphState !== 'function' ||
    typeof updateNodeData !== 'function' ||
    typeof moveNode !== 'function'
  )
    throw new Error('workspace canvas materialization adapter dependencies are incomplete');
  const projectBindingPolicies2 = normalizeProjectBindingPolicies(projectBindingPolicies),
    handler = (options) => asObject(getGraphState()?.['nodes'])[normalizeText(options)] || null,
    handler2 = (...args) => {
      for (const target of args) {
        for (const policy of projectBindingPolicies2) {
          const projectId = normalizeText(policy['getProjectId'](target));
          if (projectId) return { policy: policy, projectId: projectId };
        }
      }
      return null;
    },
    handler3 = (source) => {
      const projectId2 = normalizeText(source?.['projectId']),
        next = source?.['policy'];
      if (!projectId2 || typeof next?.['findProjectAnchor'] !== 'function') return null;
      const nodes = Object['values'](asObject(getGraphState()?.['nodes']));
      return next['findProjectAnchor']({ nodes: nodes, projectId: projectId2 }) || null;
    };
  return {
    canvasExists(current) {
      const text = normalizeText(current);
      if (!text) return ![];
      const entry = canvasTabManager['getMultiDataSnapshot']?.() || {};
      return Array['isArray'](entry['canvases'])
        ? entry['canvases']['some']((record) => normalizeText(record?.['id']) === text)
        : normalizeText(canvasTabManager['getActiveCanvasId']()) === text;
    },
    async switchCanvas(payload) {
      const text2 = normalizeText(payload);
      if (!text2) return ![];
      if (normalizeText(canvasTabManager['getActiveCanvasId']()) === text2) return !![];
      if (typeof canvasTabManager['switchTo'] !== 'function') return ![];
      return (await canvasTabManager['switchTo'](text2)) !== ![];
    },
    async createCanvas(handle) {
      await canvasTabManager['addCanvas']();
      const text3 = normalizeText(canvasTabManager['getActiveCanvasId']());
      if (!text3) throw new Error('新建项目画布后未获得活动画布 ID');
      return (canvasTabManager['renameCanvas']?.(text3, handle), text3);
    },
    renameCanvas(state, config) {
      canvasTabManager['renameCanvas']?.(state, config);
    },
    nodeExists(scope) {
      return Boolean(handler(scope));
    },
    getNode(input) {
      return handler(input);
    },
    async createNode(error, sequenceKey = {}) {
      const text4 = normalizeText(sequenceKey['type'] || error?.['type']),
        box = asObject(getNodeSize(text4)),
        output = Number(sequenceKey['width']) || Number(box['width']) || undefined,
        value2 = Number(sequenceKey['height']) || Number(box['height']) || undefined,
        args2 = createNodeAtCursor(text4, output, value2, error?.['name'], {
          placement: 'viewport-center-sequence',
          sequenceKey: sequenceKey['sequenceKey'],
          skipCommit: !![],
        });
      if (!args2?.['id']) throw new Error('创建项目画布节点失败：' + (error?.['name'] || text4));
      const args3 = withoutNodeType(error);
      updateNodeData(args2['id'], args3);
      const box2 = handler(args2['id']) || { ...args2, ...args3 },
        value3 = handler2(error),
        box3 = handler3(value3) || box2,
        box4 = asObject(sequenceKey['position']),
        x2 = Number(box3['x'] || 0) + (Number(box4['x']) || 0),
        y2 = Number(box3['y'] || 0) + (Number(box4['y']) || 0),
        nodeSpawnPrefs = getNodeSpawnPrefs(),
        map = new Set(
          [normalizeText(args2['id']), normalizeText(sequenceKey['parentNodeId'])]['filter'](Boolean),
        ),
        value4 = Object['fromEntries'](
          Object['entries'](asObject(getGraphState()?.['nodes']))['filter'](
            ([value5]) => !map['has'](normalizeText(value5)),
          ),
        ),
        value6 =
          nodeSpawnPrefs['direction'] === 'down' || nodeSpawnPrefs['direction'] === 'left'
            ? nodeSpawnPrefs['direction']
            : 'right',
        x3 =
          nodeSpawnPrefs['avoidOverlap'] === ![]
            ? { x: x2, y: y2 }
            : findAvailablePosition(
                value4,
                x2,
                y2,
                Number(box2['width']) || output,
                Number(box2['height']) || value2,
                Math['max'](0, Number(nodeSpawnPrefs['spacing']) || 0),
                value6,
              ),
        value7 = x3['x'] - Number(box2['x'] || 0),
        value8 = x3['y'] - Number(box2['y'] || 0);
      if (value7 || value8) moveNode(args2['id'], value7, value8);
      return handler(args2['id']) || { ...box2, x: x3['x'], y: x3['y'] };
    },
    async updateNode(value9, value10, box5 = {}) {
      const id2 = normalizeText(value9);
      if (!id2) return null;
      const value11 = handler(id2),
        width = Number(box5['width']),
        height = Number(box5['height']),
        args4 = {
          ...withoutNodeType(value10),
          ...(width > 0 ? { width: width } : {}),
          ...(height > 0 ? { height: height } : {}),
        };
      updateNodeData(id2, args4);
      if (box5['position'] && value11) {
        const value12 = handler2(value10, value11),
          box6 = handler3(value12) || handler(id2),
          box7 = asObject(box5['position']),
          value13 = Number(box6?.['x'] || 0) + (Number(box7['x']) || 0),
          value14 = Number(box6?.['y'] || 0) + (Number(box7['y']) || 0),
          box8 = handler(id2) || value11,
          value15 = value13 - Number(box8?.['x'] || 0),
          value16 = value14 - Number(box8?.['y'] || 0);
        if (value15 || value16) moveNode(id2, value15, value16);
      }
      return handler(id2) || { id: id2, ...args4 };
    },
    deleteNodes(list2 = []) {
      if (typeof deleteNodes2 !== 'function') return ![];
      const list3 = (Array['isArray'](list2) ? list2 : [])
        ['map'](normalizeText)
        ['filter']((value17) => value17 && handler(value17));
      if (!list3['length']) return !![];
      return (deleteNodes2([...new Set(list3)]), !![]);
    },
    createMutationSnapshot() {
      if (typeof getGraphSnapshot !== 'function') return null;
      return getGraphSnapshot();
    },
    restoreMutationSnapshot(enabled) {
      if (!enabled || typeof restoreGraphSnapshot !== 'function') return ![];
      return restoreGraphSnapshot(enabled) !== ![];
    },
    async deleteCanvas(value18) {
      const text5 = normalizeText(value18);
      if (!text5 || typeof canvasTabManager?.['deleteCanvas'] !== 'function') return ![];
      return (await canvasTabManager['deleteCanvas'](text5, { skipDirtyConfirm: !![] })) !== ![];
    },
    setNodeParent(value19, value20) {
      const text6 = normalizeText(value19),
        text7 = normalizeText(value20);
      if (!text6 || !text7) return ![];
      if (normalizeText(handler(text6)?.['parentId']) === text7) return !![];
      if (typeof groupNodes !== 'function') return ![];
      const groupNodes2 = groupNodes([text6], text7);
      return groupNodes2 !== ![];
    },
    connectNodes(value21, value22, value23 = {}) {
      const sourceId = normalizeText(value21),
        targetId = normalizeText(value22);
      if (!sourceId || !targetId) return ![];
      const value24 = getGraphState()?.['edges'],
        list4 = Array['isArray'](value24) ? value24 : Object['values'](asObject(value24)),
        value25 = list4['some'](
          (value26) =>
            normalizeText(value26?.['sourceId']) === sourceId &&
            normalizeText(value26?.['targetId']) === targetId,
        );
      if (value25) return !![];
      if (typeof connectNodes2 !== 'function') return ![];
      const value27 = connectNodes2({
        sourceId: sourceId,
        targetId: targetId,
        preferredRefSlot: normalizeText(value23['preferredRefSlot']),
      });
      return value27 !== ![];
    },
    focusNodes(list5, value28 = {}) {
      if (typeof focusNodes2 !== 'function') return ![];
      const list6 = Array['isArray'](list5) ? list5['map'](normalizeText)['filter'](Boolean) : [];
      if (!list6['length']) return ![];
      return focusNodes2(list6, value28['padding'], value28['durationMs'], value28);
    },
    commit: commit,
  };
}

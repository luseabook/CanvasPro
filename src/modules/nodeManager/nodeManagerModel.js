import { getRefKindByNodeType, normalizeNodeType } from '../nodeMeta.js';
export const NODE_MANAGER_FILTERS = Object['freeze'](['all', 'text', 'image', 'video', 'audio']);
const FILTER_SET = new Set(NODE_MANAGER_FILTERS),
  CONTENT_CATEGORY_SET = new Set(NODE_MANAGER_FILTERS['slice'](0x1));
function normalizeId(value) {
  return typeof value === 'string' || typeof value === 'number' ? String(value)['trim']() : '';
}
function normalizeSearchText(item) {
  return String(item ?? '')
    ['trim']()
    ['toLocaleLowerCase']();
}
function readNodesInStableOrder(list) {
  const list2 = Array['isArray'](list)
      ? list['map']((key, index) => [String(index), key])
      : list && typeof list === 'object'
        ? Object['entries'](list)
        : [],
    map = new Set(),
    list3 = [];
  return (
    list2['forEach'](([result, node], sourceIndex) => {
      if (!node || typeof node !== 'object') return;
      const id = normalizeId(node['id']) || normalizeId(result);
      if (!id || map['has'](id)) return;
      (map['add'](id), list3['push']({ id: id, node: node, sourceIndex: sourceIndex }));
    }),
    list3
  );
}
function firstDisplayText(...args) {
  for (const data of args) {
    const options = String(data ?? '')['trim']();
    if (options) return options;
  }
  return '';
}
function toCollapsedIdSet(target) {
  if (target == null) return new Set();
  const source =
      typeof target === 'string' ? [target] : typeof target[Symbol['iterator']] === 'function' ? target : [],
    next = new Set();
  for (const current of source) {
    const id2 = normalizeId(current);
    if (id2) next['add'](id2);
  }
  return next;
}
function breakGroupParentCycles(list4, map2) {
  const map3 = new Map(list4['map']((entry) => [entry['id'], entry])),
    map4 = new Set();
  for (const enabled of list4) {
    if (!enabled['isGroup'] || map4['has'](enabled['id'])) continue;
    const list5 = [],
      map5 = new Map();
    let record = enabled['id'];
    while (record && !map4['has'](record)) {
      if (map5['has'](record)) {
        const list6 = list5['slice'](map5['get'](record)),
          payload = list6['reduce']((handle, state) => {
            return map3['get'](state)['sourceIndex'] < map3['get'](handle)['sourceIndex'] ? state : handle;
          }, list6[0x0]);
        map2['set'](payload, '');
        break;
      }
      (map5['set'](record, list5['length']), list5['push'](record), (record = map2['get'](record) || ''));
    }
    list5['forEach']((config) => map4['add'](config));
  }
}
function countContentNodes(scope) {
  let input = 0x0;
  for (const el of scope) {
    if (el['isGroup']) input += countContentNodes(el['children']);
    else input += 0x1;
  }
  return input;
}
function addDescendantCounts(el2) {
  if (!el2['isGroup']) return ((el2['descendantContentCount'] = 0x0), 0x1);
  let output = 0x0;
  for (const value2 of el2['children']) {
    output += addDescendantCounts(value2);
  }
  return ((el2['descendantContentCount'] = output), (el2['childCount'] = output), output);
}
function filterTreeItem(el3, { filter: filter2, query: query2, inheritedQueryMatch: inheritedQueryMatch }) {
  const enabled2 = filter2 === 'all' || el3['category'] === filter2,
    enabled3 = !query2 || normalizeSearchText(el3['name'])['includes'](query2);
  if (!el3['isGroup']) {
    if (!enabled2 || (!inheritedQueryMatch && !enabled3)) return null;
    return { ...el3, children: [] };
  }
  const value3 = Boolean(query2) && enabled3,
    inheritedQueryMatch2 = inheritedQueryMatch || value3,
    children = el3['children']
      ['map']((value4) =>
        filterTreeItem(value4, { filter: filter2, query: query2, inheritedQueryMatch: inheritedQueryMatch2 }),
      )
      ['filter'](Boolean),
    enabled4 = filter2 === 'all' && !query2;
  if (!enabled4 && !inheritedQueryMatch2 && children['length'] === 0x0) return null;
  return { ...el3, children: children, matchingDescendantContentCount: countContentNodes(children) };
}
function flattenTree(value5, map6, depth = 0x0, list7 = []) {
  for (const el4 of value5) {
    const collapsed = el4['isGroup'] && map6['has'](el4['id']);
    (list7['push']({ ...el4, depth: depth, collapsed: collapsed }),
      el4['isGroup'] && !collapsed && flattenTree(el4['children'], map6, depth + 0x1, list7));
  }
  return list7;
}
export function normalizeNodeManagerFilter(value6) {
  const value7 = String(value6 ?? '')
    ['trim']()
    ['toLocaleLowerCase']();
  return FILTER_SET['has'](value7) ? value7 : 'all';
}
export function getNodeManagerCategory(value8) {
  const nodeType = normalizeNodeType(value8?.['type']);
  if (nodeType === 'group') return 'group';
  const refKindByNodeType = getRefKindByNodeType(nodeType);
  return CONTENT_CATEGORY_SET['has'](refKindByNodeType) ? refKindByNodeType : 'other';
}
export const resolveNodeManagerCategory = getNodeManagerCategory;
export function resolveNodeManagerName(error, value9 = '') {
  return firstDisplayText(error?.['name'], error?.['title'], error?.['label'], value9);
}
export function buildNodeManagerModel({
  nodes: nodes,
  filter: filter = 'all',
  query: query = '',
  collapsedGroupIds: collapsedGroupIds = [],
} = {}) {
  const filter3 = normalizeNodeManagerFilter(filter),
    query3 = normalizeSearchText(query),
    list8 = readNodesInStableOrder(nodes)['map'](({ id: id3, node: node2, sourceIndex: sourceIndex2 }) => {
      const type = normalizeNodeType(node2['type']),
        kind = type === 'group';
      return {
        kind: kind ? 'group' : 'node',
        id: id3,
        node: node2,
        sourceIndex: sourceIndex2,
        type: type,
        isGroup: kind,
        category: getNodeManagerCategory(node2),
        name: resolveNodeManagerName(node2, id3),
        parentId: '',
        children: [],
        descendantContentCount: 0x0,
        matchingDescendantContentCount: 0x0,
      };
    }),
    map7 = new Map(list8['map']((value10) => [value10['id'], value10])),
    map8 = new Map();
  for (const value11 of list8) {
    const id4 = normalizeId(value11['node']['parentId']),
      value12 = map7['get'](id4);
    map8['set'](value11['id'], id4 && value12?.['isGroup'] && id4 !== value11['id'] ? id4 : '');
  }
  breakGroupParentCycles(list8, map8);
  const list9 = [];
  for (const value13 of list8) {
    value13['parentId'] = map8['get'](value13['id']) || '';
    if (value13['parentId']) map7['get'](value13['parentId'])['children']['push'](value13);
    else list9['push'](value13);
  }
  list9['forEach'](addDescendantCounts);
  const roots = list9['map']((value14) =>
      filterTreeItem(value14, { filter: filter3, query: query3, inheritedQueryMatch: ![] }),
    )['filter'](Boolean),
    toCollapsedIdSet2 = toCollapsedIdSet(collapsedGroupIds),
    items = flattenTree(roots, toCollapsedIdSet2),
    totalNodeCount = list8['filter']((enabled5) => !enabled5['isGroup'])['length'],
    visibleNodeCount = items['filter']((enabled6) => !enabled6['isGroup'])['length'],
    groupIds = list8['filter']((value15) => value15['isGroup'])['map']((value16) => value16['id']);
  return {
    filter: filter3,
    query: String(query ?? '')['trim'](),
    roots: roots,
    items: items,
    rows: items,
    groupIds: groupIds,
    totalNodeCount: totalNodeCount,
    visibleNodeCount: visibleNodeCount,
    totalContentCount: totalNodeCount,
    matchingContentCount: countContentNodes(roots),
    visibleContentCount: visibleNodeCount,
    totalGroupCount: groupIds['length'],
    visibleGroupCount: items['filter']((value17) => value17['isGroup'])['length'],
  };
}
export const buildNodeManagerListModel = buildNodeManagerModel;

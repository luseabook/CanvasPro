import { getRefKindByNodeType, normalizeNodeType } from '../nodeMeta.js';
export const NODE_MANAGER_FILTERS = Object['freeze'](['all', 'text', 'image', 'video', 'audio']);
const FILTER_SET = new Set(NODE_MANAGER_FILTERS),
  CONTENT_CATEGORY_SET = new Set(NODE_MANAGER_FILTERS['slice'](0x1));
function normalizeId(_0x46885b) {
  return typeof _0x46885b === 'string' || typeof _0x46885b === 'number' ? String(_0x46885b)['trim']() : '';
}
function normalizeSearchText(_0x574f4f) {
  return String(_0x574f4f ?? '')
    ['trim']()
    ['toLocaleLowerCase']();
}
function readNodesInStableOrder(_0x390483) {
  const _0x28b600 = Array['isArray'](_0x390483)
      ? _0x390483['map']((_0x469829, _0x339ab6) => [String(_0x339ab6), _0x469829])
      : _0x390483 && typeof _0x390483 === 'object'
        ? Object['entries'](_0x390483)
        : [],
    _0x4087ad = new Set(),
    _0x2b7630 = [];
  return (
    _0x28b600['forEach'](([_0x36d7ae, _0x3f84f6], _0x16fe01) => {
      if (!_0x3f84f6 || typeof _0x3f84f6 !== 'object') return;
      const _0x5e09e3 = normalizeId(_0x3f84f6['id']) || normalizeId(_0x36d7ae);
      if (!_0x5e09e3 || _0x4087ad['has'](_0x5e09e3)) return;
      (_0x4087ad['add'](_0x5e09e3),
        _0x2b7630['push']({ id: _0x5e09e3, node: _0x3f84f6, sourceIndex: _0x16fe01 }));
    }),
    _0x2b7630
  );
}
function firstDisplayText(..._0x1349e7) {
  for (const _0x381949 of _0x1349e7) {
    const _0x1080c0 = String(_0x381949 ?? '')['trim']();
    if (_0x1080c0) return _0x1080c0;
  }
  return '';
}
function toCollapsedIdSet(_0x3b4f34) {
  if (_0x3b4f34 == null) return new Set();
  const _0x3eebac =
      typeof _0x3b4f34 === 'string'
        ? [_0x3b4f34]
        : typeof _0x3b4f34[Symbol['iterator']] === 'function'
          ? _0x3b4f34
          : [],
    _0x960fe1 = new Set();
  for (const _0x4100cf of _0x3eebac) {
    const _0x402eca = normalizeId(_0x4100cf);
    if (_0x402eca) _0x960fe1['add'](_0x402eca);
  }
  return _0x960fe1;
}
function breakGroupParentCycles(_0x58185e, _0x3981b3) {
  const _0x12359a = new Map(_0x58185e['map']((_0x460ec7) => [_0x460ec7['id'], _0x460ec7])),
    _0x3a0288 = new Set();
  for (const _0x1d59ef of _0x58185e) {
    if (!_0x1d59ef['isGroup'] || _0x3a0288['has'](_0x1d59ef['id'])) continue;
    const _0x101be1 = [],
      _0x29dba1 = new Map();
    let _0xc0910e = _0x1d59ef['id'];
    while (_0xc0910e && !_0x3a0288['has'](_0xc0910e)) {
      if (_0x29dba1['has'](_0xc0910e)) {
        const _0x3d4c6f = _0x101be1['slice'](_0x29dba1['get'](_0xc0910e)),
          _0x1cc504 = _0x3d4c6f['reduce']((_0x49813a, _0x33dc2b) => {
            return _0x12359a['get'](_0x33dc2b)['sourceIndex'] < _0x12359a['get'](_0x49813a)['sourceIndex']
              ? _0x33dc2b
              : _0x49813a;
          }, _0x3d4c6f[0x0]);
        _0x3981b3['set'](_0x1cc504, '');
        break;
      }
      (_0x29dba1['set'](_0xc0910e, _0x101be1['length']),
        _0x101be1['push'](_0xc0910e),
        (_0xc0910e = _0x3981b3['get'](_0xc0910e) || ''));
    }
    _0x101be1['forEach']((_0x4fe71b) => _0x3a0288['add'](_0x4fe71b));
  }
}
function countContentNodes(_0x22b804) {
  let _0x4510de = 0x0;
  for (const _0x2d1de3 of _0x22b804) {
    if (_0x2d1de3['isGroup']) _0x4510de += countContentNodes(_0x2d1de3['children']);
    else _0x4510de += 0x1;
  }
  return _0x4510de;
}
function addDescendantCounts(_0x5c7ced) {
  if (!_0x5c7ced['isGroup']) return ((_0x5c7ced['descendantContentCount'] = 0x0), 0x1);
  let _0x14ab20 = 0x0;
  for (const _0x417ce4 of _0x5c7ced['children']) {
    _0x14ab20 += addDescendantCounts(_0x417ce4);
  }
  return (
    (_0x5c7ced['descendantContentCount'] = _0x14ab20),
    (_0x5c7ced['childCount'] = _0x14ab20),
    _0x14ab20
  );
}
function filterTreeItem(_0x3b4355, { filter: _0x440c99, query: _0x370632, inheritedQueryMatch: _0x2b630f }) {
  const _0x556edd = _0x440c99 === 'all' || _0x3b4355['category'] === _0x440c99,
    _0x2cd523 = !_0x370632 || normalizeSearchText(_0x3b4355['name'])['includes'](_0x370632);
  if (!_0x3b4355['isGroup']) {
    if (!_0x556edd || (!_0x2b630f && !_0x2cd523)) return null;
    return { ..._0x3b4355, children: [] };
  }
  const _0x57a71d = Boolean(_0x370632) && _0x2cd523,
    _0x440384 = _0x2b630f || _0x57a71d,
    _0x1e9af6 = _0x3b4355['children']
      ['map']((_0x5cfc02) =>
        filterTreeItem(_0x5cfc02, { filter: _0x440c99, query: _0x370632, inheritedQueryMatch: _0x440384 }),
      )
      ['filter'](Boolean),
    _0x41093b = _0x440c99 === 'all' && !_0x370632;
  if (!_0x41093b && !_0x440384 && _0x1e9af6['length'] === 0x0) return null;
  return { ..._0x3b4355, children: _0x1e9af6, matchingDescendantContentCount: countContentNodes(_0x1e9af6) };
}
function flattenTree(_0x4ab0e8, _0x53468b, _0x5a6ba2 = 0x0, _0x342390 = []) {
  for (const _0x21464a of _0x4ab0e8) {
    const _0x5d77c1 = _0x21464a['isGroup'] && _0x53468b['has'](_0x21464a['id']);
    (_0x342390['push']({ ..._0x21464a, depth: _0x5a6ba2, collapsed: _0x5d77c1 }),
      _0x21464a['isGroup'] &&
        !_0x5d77c1 &&
        flattenTree(_0x21464a['children'], _0x53468b, _0x5a6ba2 + 0x1, _0x342390));
  }
  return _0x342390;
}
export function normalizeNodeManagerFilter(_0x4960e5) {
  const _0x92fa93 = String(_0x4960e5 ?? '')
    ['trim']()
    ['toLocaleLowerCase']();
  return FILTER_SET['has'](_0x92fa93) ? _0x92fa93 : 'all';
}
export function getNodeManagerCategory(_0x114f01) {
  const _0x57d205 = normalizeNodeType(_0x114f01?.['type']);
  if (_0x57d205 === 'group') return 'group';
  const _0x3575d4 = getRefKindByNodeType(_0x57d205);
  return CONTENT_CATEGORY_SET['has'](_0x3575d4) ? _0x3575d4 : 'other';
}
export const resolveNodeManagerCategory = getNodeManagerCategory;
export function resolveNodeManagerName(_0x4d8a0c, _0x298b1b = '') {
  return firstDisplayText(_0x4d8a0c?.['name'], _0x4d8a0c?.['title'], _0x4d8a0c?.['label'], _0x298b1b);
}
export function buildNodeManagerModel({
  nodes: _0x2e4a58,
  filter: filter = 'all',
  query: query = '',
  collapsedGroupIds: collapsedGroupIds = [],
} = {}) {
  const _0x11b6bc = normalizeNodeManagerFilter(filter),
    _0xcd3979 = normalizeSearchText(query),
    _0x58a895 = readNodesInStableOrder(_0x2e4a58)['map'](
      ({ id: _0x45931b, node: _0x1976fe, sourceIndex: _0x5c5993 }) => {
        const _0x34914d = normalizeNodeType(_0x1976fe['type']),
          _0x2b30e7 = _0x34914d === 'group';
        return {
          kind: _0x2b30e7 ? 'group' : 'node',
          id: _0x45931b,
          node: _0x1976fe,
          sourceIndex: _0x5c5993,
          type: _0x34914d,
          isGroup: _0x2b30e7,
          category: getNodeManagerCategory(_0x1976fe),
          name: resolveNodeManagerName(_0x1976fe, _0x45931b),
          parentId: '',
          children: [],
          descendantContentCount: 0x0,
          matchingDescendantContentCount: 0x0,
        };
      },
    ),
    _0x47c919 = new Map(_0x58a895['map']((_0x10b3c9) => [_0x10b3c9['id'], _0x10b3c9])),
    _0x383814 = new Map();
  for (const _0x21d4f1 of _0x58a895) {
    const _0x5ec74b = normalizeId(_0x21d4f1['node']['parentId']),
      _0x442999 = _0x47c919['get'](_0x5ec74b);
    _0x383814['set'](
      _0x21d4f1['id'],
      _0x5ec74b && _0x442999?.['isGroup'] && _0x5ec74b !== _0x21d4f1['id'] ? _0x5ec74b : '',
    );
  }
  breakGroupParentCycles(_0x58a895, _0x383814);
  const _0x5822c8 = [];
  for (const _0x574810 of _0x58a895) {
    _0x574810['parentId'] = _0x383814['get'](_0x574810['id']) || '';
    if (_0x574810['parentId']) _0x47c919['get'](_0x574810['parentId'])['children']['push'](_0x574810);
    else _0x5822c8['push'](_0x574810);
  }
  _0x5822c8['forEach'](addDescendantCounts);
  const _0x4a78ad = _0x5822c8['map']((_0x3d689d) =>
      filterTreeItem(_0x3d689d, { filter: _0x11b6bc, query: _0xcd3979, inheritedQueryMatch: ![] }),
    )['filter'](Boolean),
    _0x2cfc36 = toCollapsedIdSet(collapsedGroupIds),
    _0xdfb8c3 = flattenTree(_0x4a78ad, _0x2cfc36),
    _0x3bdfae = _0x58a895['filter']((_0x4eb428) => !_0x4eb428['isGroup'])['length'],
    _0x25c4e8 = _0xdfb8c3['filter']((_0x4a624d) => !_0x4a624d['isGroup'])['length'],
    _0x2d9ed3 = _0x58a895['filter']((_0x1c6293) => _0x1c6293['isGroup'])['map'](
      (_0x42fb26) => _0x42fb26['id'],
    );
  return {
    filter: _0x11b6bc,
    query: String(query ?? '')['trim'](),
    roots: _0x4a78ad,
    items: _0xdfb8c3,
    rows: _0xdfb8c3,
    groupIds: _0x2d9ed3,
    totalNodeCount: _0x3bdfae,
    visibleNodeCount: _0x25c4e8,
    totalContentCount: _0x3bdfae,
    matchingContentCount: countContentNodes(_0x4a78ad),
    visibleContentCount: _0x25c4e8,
    totalGroupCount: _0x2d9ed3['length'],
    visibleGroupCount: _0xdfb8c3['filter']((_0x379fe9) => _0x379fe9['isGroup'])['length'],
  };
}
export const buildNodeManagerListModel = buildNodeManagerModel;

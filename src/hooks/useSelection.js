import appStore from '../core/stores/appStore.js';
import { screenToWorld, isPointInRect, isRectIntersect } from '../core/math.js';
export function getSelectedNodeIds() {
  return appStore.getState().selectedNodeIds;
}
export function getSelectedNodes() {
  const { nodes: _0x3e9dad, selectedNodeIds: _0x28abb8 } = appStore.getState();
  return _0x28abb8.map((_0x326b7a) => _0x3e9dad[_0x326b7a]).filter(Boolean);
}
export function getSelectionCount() {
  return appStore.getState().selectedNodeIds.length;
}
export function isNodeSelected(_0x32f016) {
  return appStore.getState().selectedNodeIds.includes(_0x32f016);
}
export function selectNode(_0x54df06) {
  appStore.setSelectedNodes([_0x54df06]);
}
export function selectNodes(_0x2be378) {
  appStore.setSelectedNodes(_0x2be378);
}
export function addToSelection(_0x2c869f) {
  const _0x38f5ca = getSelectedNodeIds();
  !_0x38f5ca.includes(_0x2c869f) && appStore.setSelectedNodes([..._0x38f5ca, _0x2c869f]);
}
export function removeFromSelection(_0x38faf0) {
  const _0x36c831 = getSelectedNodeIds();
  appStore.setSelectedNodes(_0x36c831.filter((_0x1456a2) => _0x1456a2 !== _0x38faf0));
}
export function toggleNodeSelection(_0x40fd0b) {
  isNodeSelected(_0x40fd0b) ? removeFromSelection(_0x40fd0b) : addToSelection(_0x40fd0b);
}
export function clearSelection() {
  appStore.clearSelection();
}
export function selectAll() {
  const { nodes: _0x661352 } = appStore.getState();
  appStore.setSelectedNodes(Object.keys(_0x661352));
}
export function invertSelection() {
  const { nodes: _0x49c0cf, selectedNodeIds: _0x1e782e } = appStore.getState(),
    _0x17f410 = Object.keys(_0x49c0cf),
    _0x4b5582 = _0x17f410.filter((_0x4f65d4) => !_0x1e782e.includes(_0x4f65d4));
  appStore.setSelectedNodes(_0x4b5582);
}
export function selectByType(_0x5ecf38) {
  const { nodes: _0x1790a4 } = appStore.getState(),
    _0x3edf73 = Object.values(_0x1790a4)
      .filter((_0x56404e) => _0x56404e.type === _0x5ecf38)
      .map((_0x54678e) => _0x54678e.id);
  appStore.setSelectedNodes(_0x3edf73);
}
export function startSelectionBox(_0x1bcb02, _0x2480c8) {
  const { viewport: _0x4ddc2d } = appStore.getState(),
    _0x531d65 = screenToWorld(_0x1bcb02, _0x2480c8, _0x4ddc2d);
  appStore.setSelectionBox({
    active: true,
    x1: _0x531d65.x,
    y1: _0x531d65.y,
    x2: _0x531d65.x,
    y2: _0x531d65.y,
  });
}
export function updateSelectionBox(_0x49bf77, _0x5a8330) {
  const { viewport: _0x3f7470 } = appStore.getState(),
    _0x213099 = screenToWorld(_0x49bf77, _0x5a8330, _0x3f7470);
  appStore.setSelectionBox({ x2: _0x213099.x, y2: _0x213099.y });
}
export function endSelectionBox(_0x1d3e77 = false) {
  const { nodes: _0x3925c2, selectionBox: _0x4ca02b, selectedNodeIds: _0x362035 } = appStore.getState();
  if (!_0x4ca02b.active) return;
  const _0x9d44a9 = Math.min(_0x4ca02b.x1, _0x4ca02b.x2),
    _0x9ea743 = Math.max(_0x4ca02b.x1, _0x4ca02b.x2),
    _0x3654d6 = Math.min(_0x4ca02b.y1, _0x4ca02b.y2),
    _0x5003de = Math.max(_0x4ca02b.y1, _0x4ca02b.y2),
    _0x530c1e = _0x9ea743 - _0x9d44a9,
    _0x1713b2 = _0x5003de - _0x3654d6,
    _0x305acd = [];
  for (const _0x17a507 of Object.values(_0x3925c2)) {
    const _0x536973 = _0x17a507.width || 100,
      _0x45d2e5 = _0x17a507.height || 100;
    isRectIntersect(
      _0x9d44a9,
      _0x3654d6,
      _0x530c1e,
      _0x1713b2,
      _0x17a507.x,
      _0x17a507.y,
      _0x536973,
      _0x45d2e5,
    ) && _0x305acd.push(_0x17a507.id);
  }
  if (_0x1d3e77) {
    const _0x104af1 = [...new Set([..._0x362035, ..._0x305acd])];
    appStore.setSelectedNodes(_0x104af1);
  } else appStore.setSelectedNodes(_0x305acd);
  appStore.setSelectionBox({ active: false });
}
export function getSelectionBox() {
  const { selectionBox: _0x215bec } = appStore.getState();
  return _0x215bec.active ? _0x215bec : null;
}
export function isSelecting() {
  return appStore.getState().selectionBox.active;
}
export function deleteSelectedNodes() {
  const { selectedNodeIds: _0x15c34a } = appStore.getState();
  _0x15c34a.forEach((_0x4ef572) => appStore.deleteNode(_0x4ef572));
}
export function copySelectedNodes() {
  const _0x3df1e1 = getSelectedNodes();
  return _0x3df1e1.map((_0xd7d440) => ({ ..._0xd7d440, id: undefined, parentId: null }));
}
export function moveSelectedNodes(_0x494198, _0x4d6b58) {
  const { selectedNodeIds: _0x4ff018 } = appStore.getState();
  appStore.moveNodes(_0x4ff018, _0x494198, _0x4d6b58);
}
export function subscribeToSelection(_0x1e9984) {
  return appStore.subscribeSelector(
    (_0xed3d16) => _0xed3d16.selectedNodeIds,
    (_0x308895) => _0x1e9984(_0x308895),
  );
}
export function getSelectionCenter() {
  const _0x5b5dd3 = getSelectedNodes();
  if (_0x5b5dd3.length === 0) return null;
  let _0x63b4ba = 0,
    _0x201289 = 0;
  for (const _0x251d33 of _0x5b5dd3) {
    ((_0x63b4ba += _0x251d33.x + (_0x251d33.width || 0) / 2),
      (_0x201289 += _0x251d33.y + (_0x251d33.height || 0) / 2));
  }
  return { x: _0x63b4ba / _0x5b5dd3.length, y: _0x201289 / _0x5b5dd3.length };
}
export function getSelectionBounds() {
  const _0x2faa7b = getSelectedNodes();
  if (_0x2faa7b.length === 0) return null;
  let _0x304653 = Infinity,
    _0x277844 = Infinity,
    _0x2c8527 = -Infinity,
    _0x1dab2f = -Infinity;
  for (const _0x26a960 of _0x2faa7b) {
    ((_0x304653 = Math.min(_0x304653, _0x26a960.x)),
      (_0x277844 = Math.min(_0x277844, _0x26a960.y)),
      (_0x2c8527 = Math.max(_0x2c8527, _0x26a960.x + (_0x26a960.width || 0))),
      (_0x1dab2f = Math.max(_0x1dab2f, _0x26a960.y + (_0x26a960.height || 0))));
  }
  return {
    left: _0x304653,
    top: _0x277844,
    right: _0x2c8527,
    bottom: _0x1dab2f,
    width: _0x2c8527 - _0x304653,
    height: _0x1dab2f - _0x277844,
  };
}

import appStore from '../core/stores/appStore.js';
import { screenToWorld, isPointInRect, isRectIntersect } from '../core/math.js';
export function getSelectedNodeIds() {
  return appStore.getState().selectedNodeIds;
}
export function getSelectedNodes() {
  const { nodes: nodes, selectedNodeIds: selectedNodeIds } = appStore.getState();
  return selectedNodeIds.map((item) => nodes[item]).filter(Boolean);
}
export function getSelectionCount() {
  return appStore.getState().selectedNodeIds.length;
}
export function isNodeSelected(value) {
  return appStore.getState().selectedNodeIds.includes(value);
}
export function selectNode(key) {
  appStore.setSelectedNodes([key]);
}
export function selectNodes(index) {
  appStore.setSelectedNodes(index);
}
export function addToSelection(result) {
  const list = getSelectedNodeIds();
  !list.includes(result) && appStore.setSelectedNodes([...list, result]);
}
export function removeFromSelection(data) {
  const list2 = getSelectedNodeIds();
  appStore.setSelectedNodes(list2.filter((item2) => item2 !== data));
}
export function toggleNodeSelection(options) {
  isNodeSelected(options) ? removeFromSelection(options) : addToSelection(options);
}
export function clearSelection() {
  appStore.clearSelection();
}
export function selectAll() {
  const { nodes: nodes2 } = appStore.getState();
  appStore.setSelectedNodes(Object.keys(nodes2));
}
export function invertSelection() {
  const { nodes: nodes3, selectedNodeIds: selectedNodeIds2 } = appStore.getState(),
    list3 = Object.keys(nodes3),
    target = list3.filter((item3) => !selectedNodeIds2.includes(item3));
  appStore.setSelectedNodes(target);
}
export function selectByType(source) {
  const { nodes: nodes4 } = appStore.getState(),
    next = Object.values(nodes4)
      .filter((item4) => item4.type === source)
      .map((item5) => item5.id);
  appStore.setSelectedNodes(next);
}
export function startSelectionBox(current, entry) {
  const { viewport: viewport } = appStore.getState(),
    x1 = screenToWorld(current, entry, viewport);
  appStore.setSelectionBox({
    active: true,
    x1: x1.x,
    y1: x1.y,
    x2: x1.x,
    y2: x1.y,
  });
}
export function updateSelectionBox(record, payload) {
  const { viewport: viewport2 } = appStore.getState(),
    x2 = screenToWorld(record, payload, viewport2);
  appStore.setSelectionBox({ x2: x2.x, y2: x2.y });
}
export function endSelectionBox(handle = false) {
  const {
    nodes: nodes5,
    selectionBox: selectionBox,
    selectedNodeIds: selectedNodeIds3,
  } = appStore.getState();
  if (!selectionBox.active) return;
  const state = Math.min(selectionBox.x1, selectionBox.x2),
    config = Math.max(selectionBox.x1, selectionBox.x2),
    scope = Math.min(selectionBox.y1, selectionBox.y2),
    input = Math.max(selectionBox.y1, selectionBox.y2),
    output = config - state,
    value2 = input - scope,
    list4 = [];
  for (const box of Object.values(nodes5)) {
    const value3 = box.width || 100,
      value4 = box.height || 100;
    isRectIntersect(state, scope, output, value2, box.x, box.y, value3, value4) && list4.push(box.id);
  }
  if (handle) {
    const value5 = [...new Set([...selectedNodeIds3, ...list4])];
    appStore.setSelectedNodes(value5);
  } else appStore.setSelectedNodes(list4);
  appStore.setSelectionBox({ active: false });
}
export function getSelectionBox() {
  const { selectionBox: selectionBox2 } = appStore.getState();
  return selectionBox2.active ? selectionBox2 : null;
}
export function isSelecting() {
  return appStore.getState().selectionBox.active;
}
export function deleteSelectedNodes() {
  const { selectedNodeIds: selectedNodeIds4 } = appStore.getState();
  selectedNodeIds4.forEach((item6) => appStore.deleteNode(item6));
}
export function copySelectedNodes() {
  const list5 = getSelectedNodes();
  return list5.map((args) => ({ ...args, id: undefined, parentId: null }));
}
export function moveSelectedNodes(value6, value7) {
  const { selectedNodeIds: selectedNodeIds5 } = appStore.getState();
  appStore.moveNodes(selectedNodeIds5, value6, value7);
}
export function subscribeToSelection(handler) {
  return appStore.subscribeSelector(
    (value8) => value8.selectedNodeIds,
    (value9) => handler(value9),
  );
}
export function getSelectionCenter() {
  const list6 = getSelectedNodes();
  if (list6.length === 0) return null;
  let x = 0,
    y = 0;
  for (const box2 of list6) {
    ((x += box2.x + (box2.width || 0) / 2), (y += box2.y + (box2.height || 0) / 2));
  }
  return { x: x / list6.length, y: y / list6.length };
}
export function getSelectionBounds() {
  const list7 = getSelectedNodes();
  if (list7.length === 0) return null;
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  for (const box3 of list7) {
    ((left = Math.min(left, box3.x)),
      (top = Math.min(top, box3.y)),
      (right = Math.max(right, box3.x + (box3.width || 0))),
      (bottom = Math.max(bottom, box3.y + (box3.height || 0))));
  }
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: right - left,
    height: bottom - top,
  };
}

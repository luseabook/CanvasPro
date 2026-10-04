import { isSameStringOrder } from '../utils/arrayOrder.js';
import { resolveGroupOutputSourceOrder } from './groupDynamicOutput.js';
const THUMB_CONTAINER_SELECTOR = '.ref-thumb-container',
  THUMB_ITEM_SELECTOR = '.ref-thumb-wrap',
  orderDragStateByContainer = new WeakMap();
function matchesSelector(value, item) {
  return typeof value?.matches === 'function' && value.matches(item);
}
function resolveThumbContainer(el) {
  if (!el) return null;
  if (matchesSelector(el, THUMB_CONTAINER_SELECTOR)) return el;
  return el.querySelector?.(THUMB_CONTAINER_SELECTOR) || null;
}
function queryThumbItems(el2) {
  return Array.from(el2?.querySelectorAll?.(THUMB_ITEM_SELECTOR) || []);
}
function getDataset(el3) {
  return el3?.dataset || {};
}
function isAssetRef(key) {
  const dataset = getDataset(key);
  return (
    dataset.refOrigin === 'asset' || !!dataset.assetId || String(dataset.refKey || '').startsWith('asset:')
  );
}
function getEdgeId(index) {
  return String(getDataset(index).edgeId || '').trim();
}
function isNodeEdgeThumb(result) {
  return !!getEdgeId(result) && !isAssetRef(result);
}
function isGroupOutputEdge(data) {
  return !!(data?.isGroupOutput && data?.groupOutputEdgeId);
}
function isReadOnlyDerivedGroupEdge(enabled) {
  if (!enabled) return false;
  if (isGroupOutputEdge(enabled)) return false;
  if (enabled.isGroupShared) return false;
  return !!enabled.effectiveTargetId && !isGroupOutputEdge(enabled);
}
function findIncomingEdge(store, options, target) {
  const enabled2 = String(target || '').trim();
  if (!enabled2 || typeof store?.getIncomingEdges !== 'function') return null;
  return (
    (store.getIncomingEdges(options) || []).find((item2) => String(item2?.id || '').trim() === enabled2) ||
    null
  );
}
function isMutableNodeEdgeThumb(source, next, current) {
  if (!isNodeEdgeThumb(source)) return false;
  const incomingEdge = findIncomingEdge(next, current, getEdgeId(source));
  return !isReadOnlyDerivedGroupEdge(incomingEdge);
}
function getFixedSlotEdgeContext(store2, incomingEdge2, entry) {
  if (!incomingEdge2) return null;
  const record = store2?.getState?.() || {},
    payload = String(entry || '');
  if (isGroupOutputEdge(incomingEdge2)) {
    if (String(incomingEdge2.effectiveTargetId || '') !== payload) return null;
    const handle = String(incomingEdge2.groupOutputEdgeId || '').trim(),
      rawEdge = record.edges?.[handle] || null;
    if (!rawEdge?.id) return null;
    return {
      kind: 'groupOutput',
      incomingEdge: incomingEdge2,
      rawEdge: rawEdge,
      dragEdgeId: String(incomingEdge2.id || '').trim(),
    };
  }
  const rawEdge2 = record.edges?.[String(incomingEdge2.id || '').trim()] || null;
  if (!rawEdge2?.id) return null;
  if (String(rawEdge2.targetId || '') === payload)
    return { kind: 'edge', incomingEdge: incomingEdge2, rawEdge: rawEdge2, dragEdgeId: rawEdge2.id };
  if (incomingEdge2.isGroupShared && String(incomingEdge2.effectiveTargetId || '') === payload)
    return { kind: 'edge', incomingEdge: incomingEdge2, rawEdge: rawEdge2, dragEdgeId: rawEdge2.id };
  return null;
}
function resolveMutableFixedSlotThumb(state, config, scope) {
  if (!isMutableNodeEdgeThumb(state, config, scope)) return null;
  const incomingEdge3 = findIncomingEdge(config, scope, getEdgeId(state));
  return getFixedSlotEdgeContext(config, incomingEdge3, scope);
}
function resolveMutableFixedSlotEdgeById(input, output, value2) {
  const incomingEdge4 = findIncomingEdge(input, output, value2);
  return getFixedSlotEdgeContext(input, incomingEdge4, output);
}
function isFixedSlotThumb(value3, value4 = null) {
  const dataset2 = getDataset(value3);
  return !!(
    String(dataset2.slot || '').trim() ||
    String(dataset2.refSlot || '').trim() ||
    String(value4?.refSlot || '').trim()
  );
}
function isOrderableNodeEdgeThumb(value5, value6, value7) {
  if (!isNodeEdgeThumb(value5)) return false;
  const incomingEdge5 = findIncomingEdge(value6, value7, getEdgeId(value5));
  if (isReadOnlyDerivedGroupEdge(incomingEdge5)) return false;
  return !isFixedSlotThumb(value5, incomingEdge5);
}
function setDragData(enabled3, value8) {
  if (!enabled3?.dataTransfer) return;
  ((enabled3.dataTransfer.effectAllowed = 'move'), enabled3.dataTransfer.setData?.('text/plain', value8));
}
function setDropMove(enabled4) {
  if (!enabled4?.dataTransfer) return;
  enabled4.dataTransfer.dropEffect = 'move';
}
function setOwnerDragging(enabled5, value9) {
  if (!enabled5) return;
  enabled5._isDraggingSorting = value9;
}
function getOrderDragState(enabled6) {
  if (!enabled6 || typeof enabled6 !== 'object') return { dragEl: null };
  let enabled7 = orderDragStateByContainer.get(enabled6);
  return (
    !enabled7 && ((enabled7 = { dragEl: null }), orderDragStateByContainer.set(enabled6, enabled7)),
    enabled7
  );
}
function animateReorder(value10, handler) {
  const list = queryThumbItems(value10),
    value11 = list.map((el4) => el4.getBoundingClientRect?.() || {});
  handler();
  const value12 = list.map((el5) => el5.getBoundingClientRect?.() || {});
  list.forEach((el6, value13) => {
    const count = Number(value11[value13]?.left || 0) - Number(value12[value13]?.left || 0),
      count2 = Number(value11[value13]?.top || 0) - Number(value12[value13]?.top || 0);
    if (count === 0 && count2 === 0) return;
    ((el6.style.transform = 'translate(' + count + 'px, ' + count2 + 'px)'), (el6.style.transition = 'none'));
    const run =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (value14) => setTimeout(value14, 0);
    run(() => {
      ((el6.style.transform = ''), (el6.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'));
    });
  });
}
function getTargetIncomingEdges(store3, value15) {
  return (store3?.getIncomingEdges?.(value15) || []).filter((enabled8) => {
    if (!enabled8 || !String(enabled8.id || '').trim()) return false;
    const value16 = String(value15 || '');
    if (String(enabled8.targetId || '') === value16) return true;
    return (
      (enabled8.isGroupShared && String(enabled8.effectiveTargetId || '') === value16) ||
      (isGroupOutputEdge(enabled8) && String(enabled8.effectiveTargetId || '') === value16)
    );
  });
}
function resolveEdge(store4, value17, list2) {
  const value18 = store4?.getState?.() || {};
  return value18.edges?.[value17] || list2.find((item3) => item3.id === value17) || null;
}
function uniqueSourceIds(list3) {
  const map = new Set(),
    list4 = [];
  return (
    list3.forEach((item4) => {
      const enabled9 = String(item4?.sourceId || '').trim();
      if (!enabled9 || map.has(enabled9)) return;
      (map.add(enabled9), list4.push(enabled9));
    }),
    list4
  );
}
function mergeVisibleSourceOrder(value19, args) {
  const list5 = [...args],
    map2 = new Set(list5);
  return (
    (Array.isArray(value19) ? value19 : []).forEach((item5) => {
      const enabled10 = String(item5 || '').trim();
      if (!enabled10 || map2.has(enabled10)) return;
      (map2.add(enabled10), list5.push(enabled10));
    }),
    list5
  );
}
function getGroupOutputOrderTargetId(value20) {
  const value21 = new Set();
  for (const enabled11 of value20 || []) {
    if (!enabled11?.isGroupShared) return '';
    const enabled12 = String(enabled11.effectiveTargetId || '').trim();
    if (!enabled12) return '';
    value21.add(enabled12);
  }
  return value21.size === 1 ? Array.from(value21)[0] : '';
}
function applyGroupOutputSourceOrder(args2, enabled13, groupOutputSourceOrder) {
  if (!enabled13) return { ...args2, groupOutputSourceOrder: groupOutputSourceOrder };
  const args3 = args2.groupOutputSourceOrderByTarget,
    groupOutputSourceOrderByTarget =
      args3 && typeof args3 === 'object' && !Array.isArray(args3) ? { ...args3 } : {};
  return (
    (groupOutputSourceOrderByTarget[enabled13] = groupOutputSourceOrder),
    { ...args2, groupOutputSourceOrderByTarget: groupOutputSourceOrderByTarget }
  );
}
function collectGroupOutputEdgeUpdates(store5, list6) {
  const value22 = store5?.getState?.() || {},
    map3 = new Map();
  list6.forEach((item6) => {
    if (!isGroupOutputEdge(item6)) return;
    const enabled14 = String(item6.groupOutputEdgeId || '').trim();
    if (!enabled14) return;
    if (!map3.has(enabled14)) map3.set(enabled14, []);
    map3.get(enabled14).push(item6);
  });
  const list7 = [];
  return (
    map3.forEach((item7, removeId) => {
      const enabled15 = value22.edges?.[removeId];
      if (!enabled15?.id) return;
      const list8 = uniqueSourceIds(item7);
      if (list8.length <= 1) return;
      const groupOutputOrderTargetId = getGroupOutputOrderTargetId(item7),
        groupOutputSourceOrder2 = resolveGroupOutputSourceOrder(enabled15, groupOutputOrderTargetId),
        visibleSourceOrder = mergeVisibleSourceOrder(groupOutputSourceOrder2, list8);
      if (isSameStringOrder(visibleSourceOrder, groupOutputSourceOrder2 || [])) return;
      list7.push({
        removeId: removeId,
        edge: applyGroupOutputSourceOrder(enabled15, groupOutputOrderTargetId, visibleSourceOrder),
      });
    }),
    list7
  );
}
function collectOrderedEdgeIds(value23, value24, value25) {
  return queryThumbItems(value23)
    .filter((item8) => isOrderableNodeEdgeThumb(item8, value24, value25))
    .map((item9) => getEdgeId(item9))
    .filter(Boolean);
}
function commitOrder(value26, value27, value28) {
  const list9 = collectOrderedEdgeIds(value26, value27, value28);
  if (list9.length === 0) return;
  const map4 = new Set(list9),
    list10 = getTargetIncomingEdges(value27, value28).filter((item10) => map4.has(item10.id)),
    list11 = list10.map((item11) => item11.id);
  if (list11.length !== list9.length) return;
  if (isSameStringOrder(list9, list11)) return;
  const list12 = list9.map((item12) => resolveEdge(value27, item12, list10)).filter(Boolean);
  if (list12.length !== list11.length) return;
  const list13 = collectGroupOutputEdgeUpdates(value27, list12),
    list14 = list12.filter((item13) => !isGroupOutputEdge(item13)),
    list15 = list10.filter((item14) => !isGroupOutputEdge(item14)).map((item15) => item15.id),
    value29 = list14.map((item16) => item16.id),
    list16 = [],
    list17 = [];
  list15.length > 1 &&
    !isSameStringOrder(value29, list15) &&
    (list16.push(...list15), list17.push(...list14));
  list13.forEach((item17) => {
    (list16.push(item17.removeId), list17.push(item17.edge));
  });
  if (list16.length === 0) return;
  value27.updateEdgesBatch?.(list16, list17);
}
export function bindRefThumbOrderDrag({
  owner: owner,
  container: container,
  store: store6,
  nodeId: nodeId,
} = {}) {
  const el7 = resolveThumbContainer(container);
  if (!el7 || !store6 || !nodeId) return;
  const orderDragState = getOrderDragState(el7);
  (queryThumbItems(el7).forEach((el8) => {
    if (!isOrderableNodeEdgeThumb(el8, store6, nodeId)) {
      const incomingEdge6 = findIncomingEdge(store6, nodeId, getEdgeId(el8));
      isNodeEdgeThumb(el8) &&
        isReadOnlyDerivedGroupEdge(incomingEdge6) &&
        el8.setAttribute?.('draggable', 'false');
      return;
    }
    if (el8.dataset.dragBound === '1') return;
    ((el8.dataset.dragBound = '1'),
      el8.setAttribute?.('draggable', 'true'),
      el8.addEventListener('dragstart', (value30) => {
        if (!isOrderableNodeEdgeThumb(el8, store6, nodeId)) return;
        ((orderDragState.dragEl = el8),
          setOwnerDragging(owner, true),
          setDragData(value30, getEdgeId(el8) || 'dragging'),
          el8.classList?.add('dragging-capture'),
          setTimeout(() => {
            (el8.classList?.add('dragging'), (el8.style.opacity = '0.1'));
          }, 0));
      }),
      el8.addEventListener('dragend', () => {
        if (orderDragState.dragEl) orderDragState.dragEl.style.opacity = '1';
        (el8.classList?.remove('dragging'), el8.classList?.remove('dragging-capture'));
        try {
          commitOrder(el7, store6, nodeId);
        } finally {
          ((orderDragState.dragEl = null), setOwnerDragging(owner, false));
        }
      }),
      el8.addEventListener('dragover', (event) => {
        const enabled16 = orderDragState.dragEl;
        if (!enabled16 || enabled16 === el8) return;
        if (
          !isOrderableNodeEdgeThumb(enabled16, store6, nodeId) ||
          !isOrderableNodeEdgeThumb(el8, store6, nodeId)
        )
          return;
        (event.preventDefault?.(), setDropMove(event));
        const box = el8.getBoundingClientRect?.() || {},
          value31 = Number(box.left || 0) + Number(box.width || 0) / 2;
        animateReorder(el7, () => {
          Number(event.clientX || 0) < value31
            ? el8.parentNode?.insertBefore(enabled16, el8)
            : el8.parentNode?.insertBefore(enabled16, el8.nextSibling);
        });
      }));
  }),
    el7.dataset.dragContainerBound !== '1' &&
      ((el7.dataset.dragContainerBound = '1'),
      el7.addEventListener('dragover', (event2) => event2.preventDefault?.()),
      el7.addEventListener('drop', (event3) => event3.preventDefault?.())));
}
function defaultGetKindByNode(value32) {
  const list18 = String(value32?.type || '');
  if (list18.includes('text')) return 'text';
  if (list18.includes('video')) return 'video';
  if (list18.includes('audio')) return 'audio';
  return list18 ? 'image' : '';
}
function clearDropState(value33) {
  queryThumbItems(value33)
    .filter((el9) => el9.classList?.contains?.('is-drop-allow'))
    .forEach((el10) => el10.classList?.remove('is-drop-allow'));
}
function getSlot(value34) {
  return String(getDataset(value34).slot || '').trim();
}
function getSlotKind(value35, value36, handler2, store7) {
  const slot = getSlot(value35),
    value37 = String(getDataset(value35).kind || '').trim();
  if (value37) return value37;
  const value38 = String(getDataset(value35).sourceId || '').trim(),
    value39 = value38 ? store7?.getState?.()?.nodes?.[value38] : null;
  return handler2(value39) || String(value36?.[slot] || '').trim();
}
function findSlotTarget(event4) {
  return event4?.target?.closest?.('[data-slot]') || null;
}
function resolveFixedSlotTargetEdgeContext(value40, value41, value42, value43) {
  const edgeId = getEdgeId(value40);
  if (edgeId) return resolveMutableFixedSlotEdgeById(value41, value42, edgeId);
  return (
    getTargetIncomingEdges(value41, value42)
      .map((item18) => getFixedSlotEdgeContext(value41, item18, value42))
      .filter(Boolean)
      .find(
        ({ incomingEdge: incomingEdge7, rawEdge: rawEdge3 }) =>
          rawEdge3 && String(incomingEdge7?.refSlot || '').trim() === String(value43 || ''),
      ) || null
  );
}
function getFixedSlotAcceptMap(value44, value45) {
  return value44?._refThumbFixedSlotAcceptMap || value45 || {};
}
function getContextSourceKind(value46, value47, handler3) {
  const enabled17 = String(value46?.incomingEdge?.sourceId || '').trim();
  if (!enabled17) return '';
  return handler3(value47?.nodes?.[enabled17] || null);
}
function collectFixedSlotGroupOutputUpdates({
  store: store8,
  nodeId: nodeId2,
  slotOrder: slotOrder,
  contextA: contextA,
  contextB: contextB,
  fromSlot: fromSlot,
  toSlot: toSlot,
}) {
  if (contextA?.kind !== 'groupOutput' && contextB?.kind !== 'groupOutput') return [];
  const map5 = new Map();
  getTargetIncomingEdges(store8, nodeId2)
    .filter(isGroupOutputEdge)
    .forEach((item19) => {
      const value48 = String(item19?.refSlot || '').trim();
      if (value48) map5.set(value48, item19);
    });
  contextA?.kind === 'groupOutput' && map5.delete(fromSlot);
  contextB?.kind === 'groupOutput' && map5.delete(toSlot);
  contextA?.kind === 'groupOutput' && map5.set(toSlot, contextA.incomingEdge);
  contextB?.kind === 'groupOutput' && map5.set(fromSlot, contextB.incomingEdge);
  const value49 = slotOrder.map((item20) => map5.get(item20)).filter(Boolean);
  return collectGroupOutputEdgeUpdates(store8, value49);
}
export function bindRefThumbFixedSlotDrag({
  owner: owner2,
  container: container2,
  store: store9,
  nodeId: nodeId3,
  acceptMap: acceptMap,
  getKindByNode: getKindByNode = defaultGetKindByNode,
} = {}) {
  if (!container2 || !store9 || !nodeId3 || !acceptMap) return;
  if (owner2) owner2._refThumbFixedSlotAcceptMap = acceptMap || null;
  if (container2.dataset.fixedSlotDragBound === '1') return;
  ((container2.dataset.fixedSlotDragBound = '1'),
    container2.addEventListener('dragstart', (event5) => {
      const el11 = event5.target?.closest?.(THUMB_ITEM_SELECTOR),
        enabled18 = el11 ? resolveMutableFixedSlotThumb(el11, store9, nodeId3) : null;
      if (!el11 || !enabled18) return;
      const edgeId2 = String(enabled18.dragEdgeId || enabled18.rawEdge.id || '').trim(),
        fromSlot2 = getSlot(el11);
      if (!edgeId2 || !fromSlot2) return;
      const fixedSlotAcceptMap = getFixedSlotAcceptMap(owner2, acceptMap),
        kind = getSlotKind(el11, fixedSlotAcceptMap, getKindByNode, store9);
      if (!kind || fixedSlotAcceptMap[fromSlot2] !== kind) return;
      if (!owner2) return;
      ((owner2._fixedSlotDrag = { edgeId: edgeId2, fromSlot: fromSlot2, kind: kind }),
        clearDropState(container2),
        el11.classList?.add('is-dragging'),
        setDragData(event5, edgeId2),
        event5.stopPropagation?.());
    }),
    container2.addEventListener('dragend', (event6) => {
      const el12 = event6.target?.closest?.(THUMB_ITEM_SELECTOR);
      (el12?.classList?.remove('is-dragging'), clearDropState(container2));
      if (owner2) owner2._fixedSlotDrag = null;
      event6.stopPropagation?.();
    }),
    container2.addEventListener('dragover', (event7) => {
      const enabled19 = owner2?._fixedSlotDrag;
      if (!enabled19) return;
      const el13 = findSlotTarget(event7),
        slot2 = getSlot(el13),
        fixedSlotAcceptMap2 = getFixedSlotAcceptMap(owner2, acceptMap);
      if (!slot2 || fixedSlotAcceptMap2[slot2] !== enabled19.kind) return;
      (event7.preventDefault?.(),
        setDropMove(event7),
        clearDropState(container2),
        el13.classList?.add('is-drop-allow'),
        event7.stopPropagation?.());
    }),
    container2.addEventListener('drop', (event8) => {
      const fromSlot3 = owner2?._fixedSlotDrag;
      if (!fromSlot3) return;
      const slotTarget = findSlotTarget(event8),
        toSlot2 = getSlot(slotTarget),
        fixedSlotAcceptMap3 = getFixedSlotAcceptMap(owner2, acceptMap);
      if (!toSlot2 || fixedSlotAcceptMap3[toSlot2] !== fromSlot3.kind) return;
      (event8.preventDefault?.(), clearDropState(container2));
      if (toSlot2 === fromSlot3.fromSlot) return;
      const value50 = store9.getState?.() || {},
        contextA2 = resolveMutableFixedSlotEdgeById(store9, nodeId3, fromSlot3.edgeId),
        args4 = contextA2?.rawEdge || null;
      if (!args4) return;
      const contextB2 = resolveFixedSlotTargetEdgeContext(slotTarget, store9, nodeId3, toSlot2),
        args5 = contextB2?.rawEdge || null,
        slotOrder2 = Object.keys(fixedSlotAcceptMap3 || {}).filter(
          (item21) => fixedSlotAcceptMap3[item21] === fromSlot3.kind,
        ),
        list19 = collectFixedSlotGroupOutputUpdates({
          store: store9,
          nodeId: nodeId3,
          slotOrder: slotOrder2,
          contextA: contextA2,
          contextB: contextB2,
          fromSlot: fromSlot3.fromSlot,
          toSlot: toSlot2,
        }),
        list20 = [],
        list21 = [];
      if (args5?.id && args5.id !== args4.id) {
        const contextSourceKind = getContextSourceKind(contextB2, value50, getKindByNode);
        if (!contextSourceKind || fixedSlotAcceptMap3[fromSlot3.fromSlot] !== contextSourceKind) return;
        (contextA2.kind === 'edge' && (list20.push(args4.id), list21.push({ ...args4, refSlot: toSlot2 })),
          contextB2.kind === 'edge' &&
            (list20.push(args5.id), list21.push({ ...args5, refSlot: fromSlot3.fromSlot })));
      } else
        contextA2.kind === 'edge' && (list20.push(args4.id), list21.push({ ...args4, refSlot: toSlot2 }));
      list19.forEach((item22) => {
        (list20.push(item22.removeId), list21.push(item22.edge));
      });
      if (list20.length === 0) return;
      store9.updateEdgesBatch?.(list20, list21);
      if (owner2) owner2._fixedSlotDrag = null;
      event8.stopPropagation?.();
    }));
}

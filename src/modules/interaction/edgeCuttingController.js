import {
  createEdgeCutCandidateIndex,
  queryEdgeCutCandidateIds,
  resolveEdgeCutSegment,
} from '../../core/edgeCuttingCandidates.js';
const CUTTING_MODE_CLASS = 'is-cutting-mode';
export function createEdgeCuttingController({
  graphStore: graphStore,
  getStateRaw: getStateRaw,
  commit: commit,
  checkBBoxIntersection: checkBBoxIntersection,
  checkLineIntersection: checkLineIntersection,
  getCutEdgeKeys: getCutEdgeKeys,
  getDocumentElement: getDocumentElement = () =>
    typeof document !== 'undefined' ? document['documentElement'] : null,
} = {}) {
  let enabled = false,
    box = null;
  const map = new Set();
  let value = null;
  function run(item, key) {
    if (Number['isFinite'](item?.[key])) return item[key];
    return Number['isFinite'](item?.['_persistRev']) ? item['_persistRev'] : null;
  }
  function run2(index) {
    const nodes = index?.['nodes'] || {},
      edges = index?.['edges'] || {},
      edgesRev = run(index, '_edgesRev'),
      geometryRev = run(index, '_nodeGeometryRev'),
      result = edgesRev !== null && geometryRev !== null;
    if (
      result &&
      value?.['edges'] === edges &&
      value?.['nodes'] === nodes &&
      value?.['edgesRev'] === edgesRev &&
      value?.['geometryRev'] === geometryRev
    )
      return value['candidateIndex'];
    const candidateIndex = createEdgeCutCandidateIndex(edges, nodes);
    return (
      (value = result
        ? {
            edges: edges,
            nodes: nodes,
            edgesRev: edgesRev,
            geometryRev: geometryRev,
            candidateIndex: candidateIndex,
          }
        : null),
      candidateIndex
    );
  }
  function run3(data) {
    const el = getDocumentElement?.();
    if (!el?.['classList']) return;
    if (data) el['classList']['add'](CUTTING_MODE_CLASS);
    else el['classList']['remove'](CUTTING_MODE_CLASS);
  }
  function run4(enabled2) {
    ((enabled = !!enabled2), run3(enabled));
  }
  function hasActiveSession() {
    return !!box || map['size'] > 0;
  }
  function run5() {
    ((box = null), map['clear']());
  }
  function run6(list) {
    const list2 = list['filter']((options) => options && !map['has'](options));
    if (list2['length'] === 0) return false;
    return (
      graphStore['updateEdgesBatch'](list2, []),
      list2['forEach']((target) => map['add'](target)),
      true
    );
  }
  function finishSession() {
    const source = map['size'] > 0;
    run5();
    if (source) commit();
    return source;
  }
  function run7(next, current, entry) {
    const list3 = [],
      record = next?.['nodes'] || {},
      payload = next?.['edges'] || {},
      queryEdgeCutCandidateIds2 = queryEdgeCutCandidateIds(run2(next), box['x'], box['y'], current, entry);
    for (const handle of queryEdgeCutCandidateIds2) {
      const enabled3 = payload[handle];
      if (!enabled3) continue;
      const edgeCutSegment = resolveEdgeCutSegment(enabled3, record);
      if (!edgeCutSegment) continue;
      const { startX: startX, startY: startY, endX: endX, endY: endY } = edgeCutSegment,
        enabled4 = checkBBoxIntersection(box['x'], box['y'], current, entry, startX, startY, endX, endY);
      if (!enabled4) continue;
      const state = checkLineIntersection(box['x'], box['y'], current, entry, startX, startY, endX, endY);
      if (state) list3['push'](handle);
    }
    return list3;
  }
  function handlePointerMove({ e: e, worldX: worldX, worldY: worldY } = {}) {
    if (enabled && e && e['buttons'] === 1) {
      if (box) {
        const list4 = run7(getStateRaw(), worldX, worldY);
        if (list4['length'] > 0) run6(list4);
      }
      return ((box = { x: worldX, y: worldY }), true);
    }
    return (finishSession(), false);
  }
  function run8(config) {
    const list5 = String(config || '')['trim']();
    if (!list5) return '';
    const scope = list5['toLowerCase']();
    if (scope === 'ctrl' || scope === 'control' || scope === 'meta') return 'Ctrl';
    if (scope === 'shift') return 'Shift';
    if (scope === 'alt' || scope === 'option') return 'Alt';
    if (scope === 'space' || list5 === ' ') return 'Space';
    if (scope === 'backquote' || list5 === '`' || list5 === '~') return '`';
    if (list5['length'] === 1) return list5['toUpperCase']();
    return list5;
  }
  function run9(list6) {
    const list7 = Array['isArray'](list6) && list6['length'] > 0 ? list6 : ['Ctrl'],
      list8 = list7['map']((input) => run8(input))['filter'](Boolean),
      list9 = [];
    if (list8['includes']('Ctrl')) list9['push']('Ctrl');
    if (list8['includes']('Shift')) list9['push']('Shift');
    if (list8['includes']('Alt')) list9['push']('Alt');
    const args = list8['filter']((output) => output !== 'Ctrl' && output !== 'Shift' && output !== 'Alt');
    return [...list9, ...args];
  }
  function run10(event) {
    const value2 = String(event?.['code'] || '')['trim']();
    if (value2 === 'Backquote') return '`';
    if (value2 === 'Space') return 'Space';
    if (value2 === 'Delete') return 'Delete';
    if (value2 === 'Backspace') return 'Backspace';
    return run8(event?.['key'] === ' ' ? 'Space' : event?.['key']);
  }
  function run11(value3) {
    const list10 = run9(getCutEdgeKeys?.()),
      value4 = list10['includes']('Ctrl'),
      value5 = list10['includes']('Shift'),
      value6 = list10['includes']('Alt');
    if (!!(value3?.['ctrlKey'] || value3?.['metaKey']) !== value4) return false;
    if ((value3?.['shiftKey'] === true) !== value5) return false;
    if ((value3?.['altKey'] === true) !== value6) return false;
    const list11 = list10['filter']((value7) => value7 !== 'Ctrl' && value7 !== 'Shift' && value7 !== 'Alt'),
      value8 = run10(value3);
    if (list11['length'] === 0) {
      if (list10['length'] !== 1) return false;
      return value8 === list10[0];
    }
    return list11['length'] === 1 && value8 === list11[0];
  }
  function run12(value9) {
    const list12 = run9(getCutEdgeKeys?.()),
      enabled5 = run10(value9);
    if (!enabled5) return false;
    if (list12['length'] === 1) return enabled5 === list12[0];
    const list13 = list12['filter'](
      (value10) => value10 !== 'Ctrl' && value10 !== 'Shift' && value10 !== 'Alt',
    );
    return list13['length'] === 1 && enabled5 === list13[0];
  }
  function run13(value11) {
    if (run11(value11)) run4(true);
  }
  function run14() {
    (run4(false), finishSession());
  }
  function run15(value12) {
    if (!enabled || !run12(value12)) return;
    run14();
  }
  function install(el2 = typeof window !== 'undefined' ? window : null) {
    if (!el2?.['addEventListener']) return () => {};
    return (
      el2['addEventListener']('keydown', run13),
      el2['addEventListener']('keyup', run15),
      el2['addEventListener']('blur', run14),
      () => {
        (el2['removeEventListener']?.('keydown', run13),
          el2['removeEventListener']?.('keyup', run15),
          el2['removeEventListener']?.('blur', run14),
          run4(false),
          run5());
      }
    );
  }
  return {
    finishSession: finishSession,
    handlePointerMove: handlePointerMove,
    hasActiveSession: hasActiveSession,
    install: install,
  };
}

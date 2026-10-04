import { calcWorldBounds } from '../core/math.js';
import { recordMinimapUpdateSample } from './perf/perfProbe.js';
import { isNodeType } from './registry.js';
const PAN_PREVIEW_MIN_INTERVAL_MS = 96,
  PAN_NODE_UPDATE_DELAY_MS = 180;
export function initMinimap(mapW, store) {
  const el = document.getElementById('minimapViewport'),
    el2 = document.getElementById('minimapWrapper');
  if (!mapW || !el || !el2) return;
  const dotCount = new Map();
  let bounds = null,
    scale = 1,
    offsetX = 0,
    offsetY = 0,
    mapW2 = 0,
    mapH = 0,
    value = -1,
    enabled = false,
    item = 0,
    key = 0,
    index = 1,
    result = '',
    enabled2 = null,
    enabled3 = null,
    setTimeout2 = null,
    value2 = null,
    setTimeout3 = null,
    enabled4 = null,
    data = 0,
    options = 0,
    delayed = false;
  function run() {
    return typeof performance !== 'undefined' && performance && typeof performance.now === 'function'
      ? performance.now()
      : Date.now();
  }
  function nodeCount(target) {
    const source = Number(target?._nodeCount);
    if (Number.isFinite(source)) return source;
    return Object.keys(target?.nodes || {}).length;
  }
  function run2() {
    return !!document?.body?.classList?.contains?.('is-panning');
  }
  function run3(next) {
    if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(next);
    return setTimeout(next, 16);
  }
  function run4(enabled5) {
    if (!enabled5) return;
    if (typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(enabled5);
      return;
    }
    clearTimeout(enabled5);
  }
  function run5() {
    return { mapW: mapW.clientWidth || 200, mapH: mapW.clientHeight || 140 };
  }
  function run6(box) {
    if (box && box.width !== 0) return box;
    return { minX: -0x3e8, minY: -0x3e8, maxX: 0x3e8, maxY: 0x3e8, width: 0x7d0, height: 0x7d0 };
  }
  function run7(enabled6) {
    const count = Number(enabled6?._nodeCount);
    if (Number.isFinite(count)) return count <= 0;
    return !enabled6?.nodes || Object.keys(enabled6.nodes).length === 0;
  }
  function run8(box2) {
    return {
      x: Number.isFinite(Number(box2?.x)) ? Number(box2.x) : 0,
      y: Number.isFinite(Number(box2?.y)) ? Number(box2.y) : 0,
      zoom: Number.isFinite(Number(box2?.zoom)) ? Number(box2.zoom) : 1,
    };
  }
  function run9(current) {
    const entry = Number(current);
    return Number.isFinite(entry) ? Math.round(entry * 100) / 100 : 0;
  }
  function run10(options2 = {}) {
    let record = '';
    for (const box3 of Object.values(options2 || {})) {
      if (!box3 || isNodeType(box3, 'group')) continue;
      ((record += [
        box3.id || '',
        box3.type || '',
        run9(box3.x),
        run9(box3.y),
        run9(box3.width || 200),
        run9(box3.height || 100),
      ].join(':')),
        (record += '|'));
    }
    return record;
  }
  function run11(payload, handle, state = {}) {
    const bounds2 = run6(payload),
      { mapW: mapW3, mapH: mapH2 } = run5(),
      config = Math.max(bounds2.width, 0x3e8),
      scope = Math.max(bounds2.height, 0x3e8),
      scale2 = Math.min(mapW3 / config, mapH2 / scope),
      offsetX2 = (mapW3 - config * scale2) / 2,
      offsetY2 = (mapH2 - scope * scale2) / 2;
    ((bounds = bounds2),
      (scale = scale2),
      (offsetX = offsetX2),
      (offsetY = offsetY2),
      (mapW2 = mapW3),
      (mapH = mapH2),
      (value = Number.isFinite(handle) ? handle : -1),
      (enabled = state.trackViewport === true));
    const box4 = run8(state.viewport);
    return (
      (item = box4.x),
      (key = box4.y),
      (index = box4.zoom),
      (window._v2MinimapScale = scale2),
      {
        bounds: bounds2,
        scale: scale2,
        offsetX: offsetX2,
        offsetY: offsetY2,
        mapW: mapW3,
        mapH: mapH2,
      }
    );
  }
  function run12(input) {
    const trackViewport = run7(input),
      calcWorldBounds2 = calcWorldBounds(input?.nodes || {}, input?.viewport);
    return run11(calcWorldBounds2, input?._persistRev, {
      trackViewport: trackViewport,
      viewport: trackViewport ? input?.viewport : null,
    });
  }
  function run13(output, { allowCached: allowCached = true } = {}) {
    const value3 = Number.isFinite(output?._persistRev) ? output._persistRev : -1,
      trackViewport2 = run7(output),
      box5 = run8(output?.viewport),
      { mapW: mapW4, mapH: mapH3 } = run5(),
      value4 = !!bounds,
      value5 = value4 && value === value3,
      value6 = value4 && mapW2 === mapW4 && mapH === mapH3,
      value7 =
        value4 &&
        enabled === true &&
        trackViewport2 === true &&
        item === box5.x &&
        key === box5.y &&
        index === box5.zoom;
    if (allowCached && value5 && ((!trackViewport2 && !enabled) || value7)) {
      if (value6)
        return (
          (window._v2MinimapScale = scale),
          {
            bounds: bounds,
            scale: scale,
            offsetX: offsetX,
            offsetY: offsetY,
            mapW: mapW4,
            mapH: mapH3,
          }
        );
      return run11(bounds, value3, {
        trackViewport: trackViewport2,
        viewport: trackViewport2 ? box5 : null,
      });
    }
    return run12(output);
  }
  function run14(value8) {
    const value9 = Number.isFinite(value8?._persistRev) ? value8._persistRev : -1,
      enabled7 = run7(value8);
    if (bounds && value === value9 && !enabled7 && !enabled)
      return (
        (window._v2MinimapScale = scale),
        {
          bounds: bounds,
          scale: scale,
          offsetX: offsetX,
          offsetY: offsetY,
          mapW: mapW2,
          mapH: mapH,
        }
      );
    return run13(value8, { allowCached: true });
  }
  function run15() {
    setTimeout2 = null;
    if (run2()) {
      setTimeout2 = setTimeout(run15, PAN_NODE_UPDATE_DELAY_MS);
      return;
    }
    !enabled2 && (enabled2 = run3(run16));
  }
  function run17(value10) {
    if (!enabled3) enabled3 = value10;
    else {
      if (enabled3 === 'both' || value10 === 'both') enabled3 = 'both';
      else enabled3 !== value10 ? (enabled3 = 'both') : (enabled3 = value10);
    }
    if (run2() && (enabled3 === 'nodes' || enabled3 === 'both')) {
      !setTimeout2 && (setTimeout2 = setTimeout(run15, PAN_NODE_UPDATE_DELAY_MS));
      return;
    }
    !enabled2 && (enabled2 = run3(run16));
  }
  function run16() {
    enabled2 = null;
    const enabled8 = enabled3;
    enabled3 = null;
    if (!enabled8) return;
    const value11 = store.getStateRaw();
    enabled8 === 'nodes' || enabled8 === 'both' ? run18(value11) : run19(value11);
  }
  function run18(value12) {
    const value13 = run(),
      value14 = value12?.nodes || {},
      value15 = value12?.viewport || { x: 0, y: 0, zoom: 1 },
      value16 = run10(value14),
      value17 = Number.isFinite(value12?._persistRev) ? value12._persistRev : -1;
    if (bounds && result === value16 && !run7(value12)) {
      ((value = value17),
        run20(value15, bounds, scale, offsetX, offsetY),
        recordMinimapUpdateSample('viewport', run() - value13, {
          nodeCount: nodeCount(value12),
          dotCount: dotCount.size,
          viewportOnly: true,
        }));
      return;
    }
    const { bounds: bounds3, scale: scale3, offsetX: offsetX3, offsetY: offsetY3 } = run12(value12),
      map = new Set();
    let createdCount = 0,
      updatedCount = 0,
      removedCount = 0;
    ((window._v2MinimapDotMap = dotCount),
      Object.values(value14).forEach((box6) => {
        if (isNodeType(box6, 'group')) return;
        map.add(box6.id);
        let el3 = dotCount.get(box6.id);
        const value18 = offsetX3 + (box6.x - bounds3.minX) * scale3,
          value19 = offsetY3 + (box6.y - bounds3.minY) * scale3,
          value20 = Math.max((box6.width || 200) * scale3, 2),
          value21 = Math.max((box6.height || 100) * scale3, 2);
        !el3
          ? ((el3 = document.createElement('div')),
            (el3.id = 'minimap-node-' + box6.id),
            dotCount.set(box6.id, el3),
            mapW.appendChild(el3),
            (createdCount += 1))
          : (updatedCount += 1);
        let value22 = 'default';
        const list = box6.type || '';
        if (list.includes('text')) value22 = 'text';
        else {
          if (list.includes('image')) value22 = 'image';
          else {
            if (list.includes('video')) value22 = 'video';
            else {
              if (list.includes('audio')) value22 = 'audio';
            }
          }
        }
        el3.className !== 'minimap-node ' + value22 && (el3.className = 'minimap-node ' + value22);
        if (el3.style.left !== value18 + 'px') el3.style.left = value18 + 'px';
        if (el3.style.top !== value19 + 'px') el3.style.top = value19 + 'px';
        if (el3.style.width !== value20 + 'px') el3.style.width = value20 + 'px';
        if (el3.style.height !== value21 + 'px') el3.style.height = value21 + 'px';
      }),
      dotCount.forEach((el4, value23) => {
        !map.has(value23) && (el4.remove(), dotCount.delete(value23), (removedCount += 1));
      }),
      run20(value15, bounds3, scale3, offsetX3, offsetY3),
      recordMinimapUpdateSample('nodes', run() - value13, {
        nodeCount: nodeCount(value12),
        dotCount: dotCount.size,
        createdCount: createdCount,
        updatedCount: updatedCount,
        removedCount: removedCount,
        viewportOnly: false,
      }),
      (result = value16));
  }
  function run19(value24) {
    const value25 = run(),
      value26 = value24?.viewport || { x: 0, y: 0, zoom: 1 };
    if (!bounds) {
      run18(store.getStateRaw());
      return;
    }
    const value27 = Number.isFinite(value24?._persistRev) ? value24._persistRev : -1;
    if (value !== value27) {
      run18(store.getStateRaw());
      return;
    }
    const { bounds: bounds4, scale: scale4, offsetX: offsetX4, offsetY: offsetY4 } = run14(value24);
    (run20(value26, bounds4, scale4, offsetX4, offsetY4),
      recordMinimapUpdateSample('viewport', run() - value25, {
        nodeCount: nodeCount(value24),
        dotCount: dotCount.size,
        viewportOnly: true,
      }));
  }
  function run20(box7, value28, value29, value30, value31) {
    const value32 = window.innerWidth / box7.zoom,
      value33 = window.innerHeight / box7.zoom,
      value34 = -box7.x / box7.zoom,
      value35 = -box7.y / box7.zoom,
      value36 = value30 + (value34 - value28.minX) * value29,
      value37 = value31 + (value35 - value28.minY) * value29,
      value38 = value32 * value29,
      value39 = value33 * value29;
    (el.style.left !== value36 + 'px' && (el.style.left = value36 + 'px'),
      el.style.top !== value37 + 'px' && (el.style.top = value37 + 'px'),
      el.style.width !== value38 + 'px' && (el.style.width = value38 + 'px'),
      el.style.height !== value39 + 'px' && (el.style.height = value39 + 'px'));
  }
  function run21() {
    if (value2) return;
    value2 = run3(run22);
  }
  function run22() {
    value2 = null;
    if (!enabled4) return;
    const viewport = enabled4;
    enabled4 = null;
    const args = store.getStateRaw(),
      value40 = { ...args, viewport: viewport },
      value41 = run(),
      {
        bounds: bounds5,
        scale: scale5,
        offsetX: offsetX5,
        offsetY: offsetY5,
      } = run13(value40, { allowCached: true });
    (run20(viewport, bounds5, scale5, offsetX5, offsetY5),
      (data = run()),
      (options += 1),
      recordMinimapUpdateSample('pan-preview', data - value41, {
        nodeCount: nodeCount(args),
        dotCount: dotCount.size,
        viewportOnly: true,
        delayed: delayed,
      }),
      (delayed = false));
  }
  function run23(value42, value43 = {}) {
    enabled4 = run8(value42);
    const value44 = value43.force === true,
      value45 = run() - data,
      count2 = value44 ? 0 : Math.max(0, PAN_PREVIEW_MIN_INTERVAL_MS - value45);
    if (count2 <= 0) {
      setTimeout3 && (clearTimeout(setTimeout3), (setTimeout3 = null));
      ((delayed = false), run21());
      return;
    }
    !setTimeout3 &&
      ((delayed = true),
      (setTimeout3 = setTimeout(() => {
        ((setTimeout3 = null), run21());
      }, count2)));
  }
  function run24(value46 = null) {
    if (value46) enabled4 = run8(value46);
    return (
      setTimeout3 && (clearTimeout(setTimeout3), (setTimeout3 = null)),
      value2 && (run4(value2), (value2 = null)),
      run22(),
      options
    );
  }
  const value47 = (value48, value49 = {}) => run23(value48, value49),
    value50 = (value51 = null) => run24(value51),
    value52 = () => options;
  ((window._v2ScheduleMinimapViewportPreview = value47),
    (window._v2FlushMinimapViewportPreview = value50),
    (window._v2GetMinimapPreviewFlushCount = value52));
  const run25 = store.subscribeSelector(
      (value53) => value53._persistRev || 0,
      () => run17('nodes'),
    ),
    handler = store.subscribeSelector(
      (value54) => value54.viewport,
      () => run17('viewport'),
    );
  run17('both');
  const el5 = document.getElementById('v2-wrap');
  el5 &&
    (el5.style.removeProperty('--bg-x'),
    el5.style.removeProperty('--bg-y'),
    el5.style.removeProperty('--bg-zoom'));
  let enabled9 = false;
  const run26 = (event) => {
    const value55 = store.getStateRaw(),
      { viewport: viewport2 } = value55,
      {
        bounds: bounds6,
        scale: scale6,
        offsetX: offsetX6,
        offsetY: offsetY6,
      } = run13(value55, { allowCached: true }),
      box8 = mapW.getBoundingClientRect(),
      value56 = event.clientX - box8.left - offsetX6,
      value57 = event.clientY - box8.top - offsetY6,
      value58 = bounds6.minX + value56 / scale6,
      value59 = bounds6.minY + value57 / scale6,
      value60 = window.innerWidth / 2 - value58 * viewport2.zoom,
      value61 = window.innerHeight / 2 - value59 * viewport2.zoom;
    store.updateViewport(value60, value61, viewport2.zoom);
  };
  return (
    el2.addEventListener('pointerdown', (event2) => {
      (event2.stopPropagation(), (enabled9 = true), el2.setPointerCapture(event2.pointerId), run26(event2));
    }),
    el2.addEventListener('pointermove', (value62) => {
      if (!enabled9) return;
      run26(value62);
    }),
    el2.addEventListener('pointerup', (event3) => {
      ((enabled9 = false), el2.releasePointerCapture(event3.pointerId));
    }),
    function run27() {
      (run25(),
        handler(),
        enabled2 && (run4(enabled2), (enabled2 = null)),
        setTimeout2 && (clearTimeout(setTimeout2), (setTimeout2 = null)),
        value2 && (run4(value2), (value2 = null)),
        setTimeout3 && (clearTimeout(setTimeout3), (setTimeout3 = null)),
        window._v2ScheduleMinimapViewportPreview === value47 &&
          delete window._v2ScheduleMinimapViewportPreview,
        window._v2FlushMinimapViewportPreview === value50 && delete window._v2FlushMinimapViewportPreview,
        window._v2GetMinimapPreviewFlushCount === value52 && delete window._v2GetMinimapPreviewFlushCount,
        dotCount.forEach((el6) => el6.remove()),
        dotCount.clear());
    }
  );
}

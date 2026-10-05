import {
  screenToWorld,
  worldToScreen,
  projectPointToViewportEdge,
  spreadViewportBoundaryPoint,
} from '../../core/math.js';
import { loadCursorMetrics } from '../../../api/cursorAssetApi.js';
import { readOffscreenMembers, subscribeCollaborationPreferences } from './collaborationPreferences.js';
import { collaborationMemberColor } from './collaborationMemberColor.js';
import { drawCollaborationMediaStatus } from './collaborationMediaStatus.js';
import { getViewportPanPreview, VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from '../../core/viewportPanPreview.js';
import { readNodeGeometryPreview, subscribeNodeGeometryPreview } from '../../core/nodeGeometryPreview.js';
import { createCollaborationGeometry } from './collaborationGeometry.js';
export function createCollaborationPresence({
  store: store,
  getSession: getSession,
  drawComments: drawComments = () => {},
  documentObject: documentObject = document,
  windowObject: windowObject = window,
}) {
  const el = documentObject['createElement']('div');
  ((el['className'] = 'collaboration-presence'),
    el['setAttribute']('aria-label', '协作成员位置'),
    documentObject['body']['append'](el));
  const map = new Map(),
    map2 = createCollaborationGeometry({
      store: store,
      getSession: getSession,
      windowObject: windowObject,
    }),
    map3 = new Map();
  let setTimeout2 = null,
    box = null,
    enabled = null,
    enabled2 = ![],
    value = '',
    offscreenMembers = readOffscreenMembers();
  const run = () => ({ ...store['getStateRaw']()['viewport'], ...getViewportPanPreview() }),
    handler = () => {
      const el2 = documentObject['querySelector']('.v2-canvas-stage');
      return (
        el2?.['getBoundingClientRect']() || {
          left: 0,
          top: 0,
          width: windowObject['innerWidth'],
          height: windowObject['innerHeight'],
        }
      );
    };
  function run2() {
    const item = windowObject['getComputedStyle'](documentObject['documentElement'])['getPropertyValue'](
        '--pointer-cursor-image',
      ),
      enabled3 = item['match'](/url\(["']?([^"')]+)["']?\)/)?.[1];
    if (!enabled3 || value === enabled3) return;
    ((value = enabled3),
      void loadCursorMetrics(enabled3)
        ['then']((box2) => {
          if (enabled2 || value !== enabled3) return;
          (el['style']['setProperty']('--member-cursor-width', box2['width'] + 'px'),
            el['style']['setProperty']('--member-cursor-height', box2['height'] + 'px'),
            el['style']['setProperty']('--member-hotspot-x', box2['hotspot']['x'] + 'px'),
            el['style']['setProperty']('--member-hotspot-y', box2['hotspot']['y'] + 'px'));
        })
        ['catch'](() => {}));
  }
  const key = () => {
      ((enabled = null), clearTimeout(setTimeout2), (setTimeout2 = null), map2['update']());
      const index = getSession(),
        state = index?.['state'],
        bounds = handler();
      el['hidden'] = !state || bounds['width'] <= 0 || bounds['height'] <= 0;
      let viewport = run();
      if (state?.['locateView']) {
        const zoom = state['locateView'];
        ((state['locateView'] = null), (state['followActorId'] = ''));
        const box3 = worldToScreen(zoom['x'], zoom['y'], {
          ...viewport,
          zoom: zoom['zoom'],
        });
        (store['updateViewport'](
          viewport['x'] + bounds['left'] + bounds['width'] / 2 - box3['x'],
          viewport['y'] + bounds['top'] + bounds['height'] / 2 - box3['y'],
          zoom['zoom'],
        ),
          (viewport = store['getStateRaw']()['viewport']));
      }
      const box4 = state?.['presence']?.['find']((result) => result['actorId'] === state['locateActorId']);
      if (box4 && Number['isFinite'](box4['x']) && Number['isFinite'](box4['y'])) {
        const box5 = worldToScreen(box4['x'], box4['y'], viewport);
        ((state['locateActorId'] = ''),
          store['updateViewport'](
            viewport['x'] + bounds['left'] + bounds['width'] / 2 - box5['x'],
            viewport['y'] + bounds['top'] + bounds['height'] / 2 - box5['y'],
            viewport['zoom'],
          ),
          (viewport = store['getStateRaw']()['viewport']));
      }
      const zoom2 = state?.['presence']?.['find'](
        (enabled4) =>
          enabled4['actorId'] === state['followActorId'] &&
          enabled4['clientId'] !== state['clientId'] &&
          (!enabled4['expiresAt'] || enabled4['expiresAt'] * 1000 > Date['now']()),
      );
      if (state?.['followActorId'] && !zoom2) index['follow']('');
      if (zoom2?.['view']) {
        const box6 = worldToScreen(zoom2['view']['x'], zoom2['view']['y'], {
            ...viewport,
            zoom: zoom2['view']['zoom'],
          }),
          data = viewport['x'] + bounds['left'] + bounds['width'] / 2 - box6['x'],
          options = viewport['y'] + bounds['top'] + bounds['height'] / 2 - box6['y'];
        if (
          Math['abs'](data - viewport['x']) > 0.1 ||
          Math['abs'](options - viewport['y']) > 0.1 ||
          viewport['zoom'] !== zoom2['view']['zoom']
        )
          store['updateViewport'](data, options, zoom2['view']['zoom']);
        viewport = store['getStateRaw']()['viewport'];
      }
      const map4 = new Set(),
        target = [],
        entryFor = (source, next) => {
          map4['add'](source);
          if (!map['has'](source)) {
            const el3 = documentObject['createElement']('div');
            el3['className'] = next;
            if (next === 'collaboration-cursor') {
              const current = documentObject['createElement']('span');
              current['className'] = 'collaboration-cursor-shape';
              const entry = documentObject['createElement']('span');
              entry['className'] = 'collaboration-direction-arrow';
              const record = documentObject['createElement']('span');
              ((record['className'] = 'collaboration-cursor-name'),
                el3['append'](current, entry, record),
                el3['addEventListener']('click', () => getSession()?.['locate'](el3['dataset']['actorId'])),
                el3['addEventListener']('keydown', (event) => {
                  (event['key'] === 'Enter' || event['key'] === ' ') &&
                    (event['preventDefault'](), getSession()?.['locate'](el3['dataset']['actorId']));
                }));
            }
            (el['append'](el3), map['set'](source, el3));
          }
          return map['get'](source);
        };
      for (const id2 of state?.['presence'] || []) {
        if (id2['clientId'] === state['clientId']) continue;
        if (id2['expiresAt'] && id2['expiresAt'] * 1000 < Date['now']()) continue;
        const collaborationMemberColor2 = collaborationMemberColor(
            state['members']?.['find']((payload) => payload['id'] === id2['actorId']) || {
              id: id2['actorId'],
            },
          ),
          list = Object['keys'](state['locks'] || {})['filter'](
            (handle) =>
              state['locks'][handle]['clientId'] === id2['clientId'] &&
              state['locks'][handle]['expiresAt'] * 1000 > Date['now'](),
          );
        for (const config of new Set([...(id2['selected'] || []), ...list])) {
          const box7 = readNodeGeometryPreview(config, store['getStateRaw']()['nodes'][config]);
          if (!box7 || !box7['width'] || !box7['height']) continue;
          const el4 = entryFor(id2['clientId'] + ':' + config, 'collaboration-selection'),
            box8 = worldToScreen(box7['x'], box7['y'], viewport);
          ((el4['style']['transform'] = 'translate(' + box8['x'] + 'px, ' + box8['y'] + 'px)'),
            (el4['style']['width'] = box7['width'] * viewport['zoom'] + 'px'),
            (el4['style']['height'] = box7['height'] * viewport['zoom'] + 'px'),
            (el4['dataset']['member'] = list['includes'](config) ? id2['name'] + ' · 正在编辑' : id2['name']),
            (el4['dataset']['nodeId'] = config),
            el4['style']['setProperty']('--member-color', collaborationMemberColor2));
        }
        if (id2['x'] == null || id2['y'] == null) continue;
        const el5 = entryFor(id2['clientId'], 'collaboration-cursor'),
          screen = worldToScreen(id2['x'], id2['y'], viewport),
          viewportEdge = projectPointToViewportEdge(screen, bounds),
          box9 = viewportEdge['outside'] ? spreadViewportBoundaryPoint(viewportEdge, bounds, target) : screen;
        ((el5['style']['transform'] = 'translate(' + box9['x'] + 'px, ' + box9['y'] + 'px)'),
          el5['style']['setProperty']('--member-color', collaborationMemberColor2),
          el5['style']['setProperty']('--member-direction', viewportEdge['angle'] + 'deg'),
          el5['classList']['toggle']('is-offscreen', viewportEdge['outside']),
          el5['classList']['toggle']('is-right', box9['x'] > bounds['left'] + bounds['width'] / 2),
          el5['classList']['toggle']('is-bottom', box9['y'] > bounds['top'] + bounds['height'] - 60));
        const el6 = el5['querySelector']('.collaboration-cursor-name');
        if (el6['textContent'] !== id2['name']) el6['textContent'] = id2['name'];
        ((el5['dataset']['member'] = id2['name']),
          (el5['dataset']['actorId'] = id2['actorId']),
          el5['setAttribute']('role', 'button'),
          (el5['tabIndex'] = viewportEdge['outside'] && offscreenMembers ? 0 : -1),
          el5['setAttribute']('aria-label', '定位 ' + id2['name']),
          (el5['hidden'] = viewportEdge['outside'] && !offscreenMembers));
      }
      const map5 = new Set(state?.['editingPending'] || []);
      for (const scope of map3['keys']()) if (!map5['has'](scope)) map3['delete'](scope);
      for (const input of map5) {
        if (!map3['has'](input)) map3['set'](input, Date['now']());
        if (Date['now']() - map3['get'](input) < 200) continue;
        const box10 = readNodeGeometryPreview(input, store['getStateRaw']()['nodes'][input]);
        if (box10 !== store['getStateRaw']()['nodes'][input]) continue;
        if (!box10) continue;
        const el7 = entryFor(
            'editing:' + input,
            'collaboration-media-status collaboration-feedback is-pending',
          ),
          box11 = worldToScreen(box10['x'], box10['y'], viewport);
        ((el7['style']['transform'] = 'translate(' + box11['x'] + 'px, ' + box11['y'] + 'px)'),
          (el7['textContent'] = '正在获取编辑权限…'),
          el7['setAttribute']('role', 'status'));
      }
      (drawCollaborationMediaStatus({
        state: state,
        nodes: store['getStateRaw']()['nodes'],
        viewport: viewport,
        bounds: bounds,
        entryFor: entryFor,
        getSession: getSession,
        documentObject: documentObject,
      }),
        drawComments({
          state: state,
          nodes: store['getStateRaw']()['nodes'],
          selected: store['getStateRaw']()['selectedNodeIds'],
          viewport: viewport,
          bounds: bounds,
          entryFor: entryFor,
        }));
      for (const [output, el8] of map) !map4['has'](output) && (el8['remove'](), map['delete'](output));
      if (map5['size'] || map2['active']())
        setTimeout2 = setTimeout(() => {
          if (!enabled2 && !enabled) enabled = windowObject['requestAnimationFrame'](key);
        }, 200);
    },
    redraw = () => {
      if (enabled2) return;
      const zoom3 = run(),
        box12 = handler();
      getSession()?.['setPresence']({
        ...(box ? screenToWorld(box['x'], box['y'], zoom3) : {}),
        view: {
          ...screenToWorld(box12['left'] + box12['width'] / 2, box12['top'] + box12['height'] / 2, zoom3),
          zoom: zoom3['zoom'],
        },
        selected: [...(store['getStateRaw']()['selectedNodeIds'] || [])],
      });
      if (!enabled) enabled = windowObject['requestAnimationFrame'](key);
    },
    handler2 = subscribeCollaborationPreferences((value2) => {
      ((offscreenMembers = value2), redraw());
    }),
    handler3 = subscribeNodeGeometryPreview(() => {
      if (!enabled2 && !enabled) enabled = windowObject['requestAnimationFrame'](key);
    }),
    value3 = new windowObject['MutationObserver'](run2);
  (value3['observe'](documentObject['documentElement'], {
    attributes: !![],
    attributeFilter: ['style', 'class'],
  }),
    run2(),
    windowObject['addEventListener']('resize', redraw),
    windowObject['addEventListener'](VIEWPORT_PAN_PREVIEW_FRAME_EVENT, redraw));
  const value4 = (x) => {
    if (!x['target']['closest']?.('.v2-canvas-stage')) return;
    ((box = { x: x['clientX'], y: x['clientY'] }),
      getSession()?.['setPresence'](screenToWorld(box['x'], box['y'], run())));
  };
  documentObject['addEventListener']('pointermove', value4, { passive: !![] });
  const value5 = (event2) => {
      if (event2['type'] === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta']['includes'](event2['key']))
        return;
      const value6 =
        event2['target']['closest']?.('.v2-canvas-stage, [data-node-id]') ||
        (event2['type'] === 'keydown' && event2['target'] === documentObject['body']);
      if (value6 && getSession()?.['state']['followActorId']) getSession()['follow']('');
    },
    value7 = ['pointerdown', 'wheel', 'keydown'];
  for (const value8 of value7)
    documentObject['addEventListener'](value8, value5, { capture: !![], passive: !![] });
  const run3 = store['subscribeSelector'](
    (state2) =>
      [
        state2['_nodesRev'],
        state2['viewport']['x'],
        state2['viewport']['y'],
        state2['viewport']['zoom'],
        state2['viewport']['_screenOriginX'],
        state2['viewport']['_screenOriginY'],
        ...(state2['selectedNodeIds'] || []),
      ]['join'](':'),
    redraw,
  );
  return {
    redraw: redraw,
    destroy() {
      ((enabled2 = !![]),
        clearTimeout(setTimeout2),
        map2['clear'](),
        run3(),
        handler2(),
        handler3(),
        value3['disconnect'](),
        windowObject['removeEventListener']('resize', redraw),
        windowObject['removeEventListener'](VIEWPORT_PAN_PREVIEW_FRAME_EVENT, redraw),
        documentObject['removeEventListener']('pointermove', value4));
      for (const value9 of value7) documentObject['removeEventListener'](value9, value5, !![]);
      if (enabled) windowObject['cancelAnimationFrame'](enabled);
      for (const el9 of map['values']()) el9['remove']();
      (map['clear'](), el['remove']());
    },
  };
}

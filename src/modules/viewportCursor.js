import { loadCursorHotspot } from '../../api/cursorAssetApi.js';
const controllers = new WeakMap(),
  EDGE_CURSOR_PROPERTY = '--viewport-edge-cursor',
  EMPTY_CURSOR =
    'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%221%22 height=%221%22/%3E") 0 0';
export function parseCursorImage(value) {
  const url = String(value)
    ['trim']()
    ['match'](/^url\(["']([^"']+)["']\)(?:\s+(\d+)\s+(\d+))?/);
  if (!url) return null;
  return {
    url: url[1],
    hotspot: url[2] == null ? null : { x: Number(url[2]), y: Number(url[3]) },
  };
}
export function cursorCrossesViewport(box, box2, box3) {
  const count = box['x'] - box2['hotspot']['x'],
    count2 = box['y'] - box2['hotspot']['y'];
  return box2['width'] > 32 || box2['height'] > 32
    ? count < 0 ||
        count2 < 0 ||
        count + box2['width'] > box3['width'] ||
        count2 + box2['height'] > box3['height']
    : ![];
}
export function initViewportCursor(dom = globalThis['document']) {
  const width = dom?.['defaultView'];
  if (!width?.['requestAnimationFrame'] || !dom?.['createElement']) return null;
  if (controllers['has'](dom)) return controllers['get'](dom);
  const el = dom['documentElement'],
    map = new Map(),
    el2 = dom['createElement']('div');
  if (typeof el2['showPopover'] !== 'function') return null;
  ((el2['className'] = 'viewport-cursor-layer'),
    el2['setAttribute']('popover', 'manual'),
    el2['setAttribute']('aria-hidden', 'true'));
  const el3 = dom['createElement']('img');
  ((el3['className'] = 'viewport-cursor-image'),
    (el3['alt'] = ''),
    (el3['draggable'] = ![]),
    el2['appendChild'](el3),
    dom['body']['appendChild'](el2));
  let box4 = null,
    enabled = 0,
    enabled2 = ![],
    enabled3 = ![],
    item = null;
  const list = [];
  function run(key = !![]) {
    if (key && el['style']['getPropertyValue'](EDGE_CURSOR_PROPERTY))
      el['style']['removeProperty'](EDGE_CURSOR_PROPERTY);
    if (enabled3) el2['hidePopover']();
    enabled3 = ![];
  }
  function run2() {
    if (!enabled2 && box4 && !enabled) enabled = width['requestAnimationFrame'](run3);
  }
  function run4(index) {
    const response = parseCursorImage(index);
    if (!response) return null;
    const result = JSON['stringify'](response);
    if (map['has'](result)) return map['get'](result);
    const uRL = new URL(response['url'], dom['baseURI']);
    if (
      !(uRL['protocol'] === 'data:' && response['url']['startsWith']('data:image/svg+xml')) &&
      !(uRL['origin'] === width['location']['origin'] && uRL['pathname']['endsWith']('.cur'))
    )
      return null;
    const data = { ready: ![] };
    map['set'](result, data);
    if (map['size'] > 128) map['delete'](map['keys']()['next']()['value']);
    const source = new width['Image']();
    return (
      (source['src'] = uRL['href']),
      Promise['all']([source['decode'](), response['hotspot'] || loadCursorHotspot(uRL['href'])])
        ['then'](([, hotspot]) => {
          if (enabled2) return;
          (Object['assign'](data, {
            ready: !![],
            source: source,
            hotspot: hotspot,
            width: source['naturalWidth'],
            height: source['naturalHeight'],
          }),
            run2());
        })
        ['catch'](() => {}),
      data
    );
  }
  function run3() {
    enabled = 0;
    if (!box4 || enabled2) return run();
    const el4 = dom['elementFromPoint'](box4['x'], box4['y']);
    if (!el4) return run();
    el4 !== item &&
      (options['disconnect'](),
      options['observe'](el, { attributes: !![], attributeFilter: ['style', 'class'] }),
      options['observe'](el4, { attributes: !![], attributeFilter: ['style', 'class', 'disabled'] }),
      (item = el4));
    const target = width['getComputedStyle'](el4);
    let next = target['cursor'];
    if (el4['offsetWidth'] > el4['clientWidth'] || el4['offsetHeight'] > el4['clientHeight']) {
      const box5 = el4['getBoundingClientRect'](),
        current = box4['x'] - box5['left'],
        entry = box4['y'] - box5['top'],
        record =
          el4['scrollHeight'] > el4['clientHeight'] &&
          (current < el4['clientLeft'] || current >= el4['clientLeft'] + el4['clientWidth']),
        payload = el4['scrollWidth'] > el4['clientWidth'] && entry >= el4['clientTop'] + el4['clientHeight'];
      if (record || payload) next = width['getComputedStyle'](el4, '::-webkit-scrollbar')['cursor'];
    }
    if ((next['match'](/url\(/g) || [])['length'] < 2) return run();
    const box6 = run4(next);
    if (!box6?.['ready']) return run();
    if (el['style']['getPropertyValue'](EDGE_CURSOR_PROPERTY) !== EMPTY_CURSOR)
      el['style']['setProperty'](EDGE_CURSOR_PROPERTY, EMPTY_CURSOR);
    if (
      !cursorCrossesViewport(box4, box6, {
        width: width['innerWidth'],
        height: width['innerHeight'],
      })
    )
      return run(![]);
    el3['src'] !== box6['source']['src'] &&
      ((el3['src'] = box6['source']['src']),
      (el3['style']['width'] = box6['width'] + 'px'),
      (el3['style']['height'] = box6['height'] + 'px'));
    el3['style']['transform'] =
      'translate(' + (box4['x'] - box6['hotspot']['x']) + 'px, ' + (box4['y'] - box6['hotspot']['y']) + 'px)';
    if (!enabled3) el2['showPopover']();
    enabled3 = !![];
  }
  function run5() {
    box4 = null;
    if (enabled) width['cancelAnimationFrame'](enabled);
    ((enabled = 0), run());
  }
  function run6(el5, handle, state) {
    (el5['addEventListener'](handle, state, { capture: !![], passive: !![] }),
      list['push'](() => el5['removeEventListener'](handle, state, !![])));
  }
  function run7(x) {
    if (x['pointerType'] === 'touch') return;
    box4 = { x: x['clientX'], y: x['clientY'] };
    if (
      x['type'] === 'pointermove' &&
      !enabled3 &&
      !enabled &&
      x['target'] === item &&
      box4['x'] > 128 &&
      box4['y'] > 128 &&
      box4['x'] < width['innerWidth'] - 128 &&
      box4['y'] < width['innerHeight'] - 128
    )
      return;
    if (enabled) width['cancelAnimationFrame'](enabled);
    run3();
  }
  (run6(dom, 'pointermove', run7),
    run6(dom, 'pointerout', (enabled4) => {
      if (!enabled4['relatedTarget']) run5();
    }),
    run6(dom, 'pointercancel', run5),
    run6(dom, 'pointerover', run7),
    run6(dom, 'pointerdown', run7),
    run6(dom, 'pointerup', run7),
    run6(width, 'blur', run5),
    run6(dom, 'visibilitychange', () => {
      if (dom['hidden']) run5();
    }),
    run6(width, 'resize', run2),
    run6(dom, 'scroll', run2));
  const options = new width['MutationObserver'](run2);
  options['observe'](el, { attributes: !![], attributeFilter: ['style', 'class'] });
  const config = {
    preload(list2) {
      (list2['forEach'](run4), run2());
    },
    destroy() {
      ((enabled2 = !![]),
        run5(),
        list['forEach']((handler) => handler()),
        options['disconnect'](),
        map['clear'](),
        el2['remove'](),
        controllers['delete'](dom));
    },
  };
  return (
    run6(width, 'pagehide', (scope) => {
      if (scope['persisted']) run5();
      else config['destroy']();
    }),
    controllers['set'](dom, config),
    config
  );
}

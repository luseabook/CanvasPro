import { worldToScreen } from '../../core/math.js';
import { readNodeGeometryPreview } from '../../core/nodeGeometryPreview.js';
import { createContextMenuIcon } from '../../components/contextMenuIcon.js';
const moreMenus = new WeakMap();
function chatButton(value, handler, item) {
  const el = document['createElement']('button');
  return (
    (el['type'] = 'button'),
    (el['className'] = 'ftb-btn icon-only collaboration-chat-node-add'),
    el['setAttribute']('aria-label', item),
    el['append'](createContextMenuIcon('add-to-canvas')),
    el['addEventListener']('pointerdown', (event) => event['stopPropagation']()),
    el['addEventListener']('click', (event2) => {
      (event2['stopPropagation'](), value['addNodes'](handler()));
    }),
    el
  );
}
export function drawCollaborationCommentMarkers({
  state: state,
  nodes: nodes,
  selected: selected,
  viewport: viewport,
  bounds: bounds,
  entryFor: entryFor,
  comments: comments,
  chat: chat,
}) {
  if (!state) return;
  const list = [...(selected || [])]['filter']((key) => nodes[key]),
    box = readNodeGeometryPreview(comments['nodeId'](), nodes[comments['nodeId']()]);
  if (box) comments['position'](worldToScreen(box['x'] + (box['width'] || 0xc8), box['y'], viewport));
  if (list['length'] > 0x1) {
    const enabled = document['querySelector']('#v2-multi-select-box .v2-multi-select-tab');
    if (!enabled || !chat) return;
    const el2 = entryFor('chat:selection', 'collaboration-toolbar-actions');
    el2['dataset']['nodeIds'] = JSON['stringify'](list);
    if (!el2['firstChild'])
      el2['append'](chatButton(chat, () => JSON['parse'](el2['dataset']['nodeIds']), '将所选节点加入聊天'));
    if (el2['parentElement'] !== enabled) enabled['append'](el2);
    return;
  }
  const index = list[0x0],
    error = readNodeGeometryPreview(index, nodes[index]);
  if (!error) return;
  const el3 = document['querySelector']('.v2-node[data-node-id="' + CSS['escape'](index) + '\x22]'),
    el4 =
      document['querySelector'](
        '.group-toolbar--detached[data-group-toolbar-for=\x22' + CSS['escape'](index) + '\x22]',
      ) || el3?.['querySelector']('.node-floating-toolbar,\x20.group-toolbar');
  if (!el4) return;
  const result = el4['querySelector']('.act-more-tools'),
    el5 = result?.['parentElement'] || el4,
    el6 = entryFor('comment:' + index, 'collaboration-comment-marker collaboration-toolbar-actions');
  if (el6['parentElement'] !== el5) el5['insertBefore'](el6, result || null);
  if (!el6['firstChild']) {
    const el7 = document['createElement']('button');
    ((el7['type'] = 'button'),
      (el7['className'] = 'ftb-btn\x20icon-only\x20collaboration-comment-button'),
      el7['append'](createContextMenuIcon('comment'), document['createElement']('span')),
      el7['addEventListener']('pointerdown', (event3) => event3['stopPropagation']()),
      el7['addEventListener']('click', (event4) => {
        (event4['stopPropagation'](), comments['open'](index, el7));
        const el8 = document['querySelector']('.v2-node[data-node-id="' + CSS['escape'](index) + '\x22]');
        if (el8) {
          const x = el8['getBoundingClientRect']();
          comments['position']?.({ x: x['right'], y: x['top'] });
        }
      }),
      el6['append'](el7));
    if (chat) el6['append'](chatButton(chat, () => [index], '将' + (error['name'] || index) + '加入聊天'));
  }
  el6['dataset']['nodeId'] = index;
  const enabled2 = el4['classList']['contains']('group-toolbar');
  for (const el9 of el6['querySelectorAll']('button')) {
    (el9['classList']['toggle']('gt-btn', enabled2),
      el9['classList']['toggle']('ftb-btn', !enabled2),
      el9['classList']['toggle']('icon-only', !enabled2));
  }
  const data = state['review']?.['summaries']?.['find']((options) => options['node'] === index),
    target = data?.['unresolved'] || 0x0;
  ((el6['dataset']['status'] = target ? 'unresolved' : data?.['count'] ? 'resolved' : 'empty'),
    (el6['firstChild']['lastChild']['textContent'] = target ? String(target) : ''),
    el6['firstChild']['setAttribute'](
      'aria-label',
      (error['name'] || index) + '的评论，' + target + '\x20条未解决',
    ));
  if (!chat) return;
  el6['lastChild']['setAttribute']('aria-label', '将' + (error['name'] || index) + '加入聊天');
  const source = el4['querySelector']('[data-role="more-menu"] .v2-img-toolbar-zone-more');
  if (source) moreMenus['set'](el4, source);
  const next = source || moreMenus['get'](el4);
  el6['lastChild']['hidden'] = ![];
  if (next) {
    const enabled3 =
      el4['getBoundingClientRect']()['width'] > Math['min'](bounds['width'], window['innerWidth']) - 0x30;
    el6['lastChild']['hidden'] = enabled3;
    const el10 = entryFor('chat:more:' + index, 'collaboration-toolbar-overflow');
    if (el10['parentElement'] !== next) next['append'](el10);
    if (!el10['firstChild'])
      el10['append'](chatButton(chat, () => [index], '将' + (error['name'] || index) + '加入聊天'));
    el10['hidden'] = !enabled3;
  }
}

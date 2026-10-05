import { fetchCanvasShortcuts, saveCanvasShortcuts } from '../../../api/canvasShortcutsApi.js';
import { getViewportScreenCenter, screenToWorld } from '../../core/math.js';
import { canManageCanvasShortcuts, createShortcutCatalogStore } from './shortcutCatalog.js';
import { captureShortcutGraph, insertShortcutGraph } from './shortcutGraph.js';
import { createShortcutLibraryView } from './shortcutLibraryView.js';
export function initEmptyCanvasShortcuts({
  store: store,
  executeCommand: executeCommand,
  focusNodes: focusNodes,
  commit: commit,
  getNodeDefaultSize: getNodeDefaultSize,
}) {
  const el = document['getElementById']('emptyHint');
  if (!el) return;
  const shortcutLibraryView = createShortcutLibraryView(el, { onActivate: onActivate }),
    catalogStore = createShortcutCatalogStore({
      load: fetchCanvasShortcuts,
      save: saveCanvasShortcuts,
      canManage: canManageCanvasShortcuts,
    }),
    handler = () => shortcutLibraryView['render'](catalogStore['getState']()['catalog']),
    handler2 = (count) => {
      if (!window['_isAppLoaded'] || count > 0) shortcutLibraryView['close']();
      el['classList']['toggle']('hidden', !window['_isAppLoaded'] || count > 0);
    };
  ((window['_checkEmptyHint'] = () => handler2(store['getStateRaw']()['_nodeCount'] || 0)),
    store['subscribeSelector']((value) => value['_nodeCount'] || 0, handler2),
    window['_checkEmptyHint'](),
    catalogStore['subscribe'](handler),
    handler(),
    catalogStore['load']()['catch']((error) => console['warn']('Canvas shortcuts:', error['message'])));
  let enabled = ![];
  (el['addEventListener']('dblclick', (event) => event['stopPropagation']()),
    el['addEventListener']('click', (event2) => {
      event2['stopPropagation']();
      const enabled2 = event2['target']['closest']('[data-shortcut-id]');
      if (!enabled2 || enabled) return;
      const item = shortcutLibraryView['resolveItem'](enabled2);
      if (item) onActivate(item, enabled2);
    }));
  async function onActivate(type, el2) {
    if (enabled) return;
    ((enabled = !![]), (el2['disabled'] = !![]));
    try {
      const key = store['getState']()['viewport'],
        box = getViewportScreenCenter(key, window['innerWidth'], window['innerHeight']),
        x = screenToWorld(box['x'], box['y'], key);
      if (type['action']['kind'] === 'node') {
        const box2 = getNodeDefaultSize(type['action']['nodeType']);
        executeCommand('create_node', {
          type: type['action']['nodeType'],
          x: x['x'] - box2['width'] / 2,
          y: x['y'] - box2['height'] / 2,
        });
      } else {
        const insertShortcutGraph2 = insertShortcutGraph({
          store: store,
          graph: type['action']['graph'],
          center: x,
          commit: commit,
        });
        focusNodes(insertShortcutGraph2, 80, 250);
      }
    } catch (error2) {
      window['showToast']?.(error2['message'] || '模板添加失败', 'error');
    } finally {
      ((enabled = ![]), (el2['disabled'] = ![]));
    }
  }
  let enabled3 = ![];
  (window['addEventListener']('v2:canvas-node-menu-items', (index) => {
    const { nodeIds: nodeIds, items: items } = index['detail'] || {};
    if (!canManageCanvasShortcuts() || !nodeIds?.['length'] || !Array['isArray'](items)) return;
    const nodeIds2 = [...nodeIds];
    items['push']({
      label: '加入快捷模板',
      icon: 'add-to-library',
      action: () =>
        window['dispatchEvent'](
          new CustomEvent('canvas-shortcuts:manage', { detail: { nodeIds: nodeIds2 } }),
        ),
    });
  }),
    window['addEventListener']('canvas-shortcuts:manage', async (result) => {
      if (!canManageCanvasShortcuts() || enabled3 || document['getElementById']('canvasShortcutsManager'))
        return;
      enabled3 = !![];
      const el3 = document['getElementById']('devEntryShortcutsBtn');
      el3?.['setAttribute']('aria-busy', 'true');
      if (el3) el3['disabled'] = !![];
      try {
        const initialGraph = Array['isArray'](result['detail']?.['nodeIds'])
          ? captureShortcutGraph(store, result['detail']['nodeIds'])
          : null;
        await catalogStore['load']();
        const { openShortcutManager: openShortcutManager } = await import('./shortcutManager.js');
        if (canManageCanvasShortcuts())
          openShortcutManager({
            catalogStore: catalogStore,
            canvasStore: store,
            initialGraph: initialGraph,
            returnFocus: document['getElementById']('devEntryShortcutsBtn'),
          });
      } catch (error3) {
        window['showToast']?.(error3['message'] || '快捷方式加载失败', 'error');
      } finally {
        ((enabled3 = ![]), el3?.['removeAttribute']('aria-busy'));
        if (el3) el3['disabled'] = ![];
      }
    }));
}

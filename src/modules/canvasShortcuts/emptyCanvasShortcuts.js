import { fetchCanvasShortcuts, saveCanvasShortcuts } from '../../../api/canvasShortcutsApi.js';
import { getViewportScreenCenter, screenToWorld } from '../../core/math.js';
import { canManageCanvasShortcuts, createShortcutCatalogStore } from './shortcutCatalog.js';
import { captureShortcutGraph, insertShortcutGraph } from './shortcutGraph.js';
import { createShortcutLibraryView } from './shortcutLibraryView.js';
export function initEmptyCanvasShortcuts({
  store: _0x4f2aea,
  executeCommand: _0x57e2bc,
  focusNodes: _0x13fc57,
  commit: _0x6ad210,
  getNodeDefaultSize: _0x32d7df,
}) {
  const _0x5b01e3 = document['getElementById']('emptyHint');
  if (!_0x5b01e3) return;
  const _0x284c6d = createShortcutLibraryView(_0x5b01e3, { onActivate: _0x1dbb85 }),
    _0x352e0e = createShortcutCatalogStore({
      load: fetchCanvasShortcuts,
      save: saveCanvasShortcuts,
      canManage: canManageCanvasShortcuts,
    }),
    _0x19dabc = () => _0x284c6d['render'](_0x352e0e['getState']()['catalog']),
    _0x23cd57 = (_0x3db4aa) => {
      if (!window['_isAppLoaded'] || _0x3db4aa > 0x0) _0x284c6d['close']();
      _0x5b01e3['classList']['toggle']('hidden', !window['_isAppLoaded'] || _0x3db4aa > 0x0);
    };
  ((window['_checkEmptyHint'] = () => _0x23cd57(_0x4f2aea['getStateRaw']()['_nodeCount'] || 0x0)),
    _0x4f2aea['subscribeSelector']((_0x2319cd) => _0x2319cd['_nodeCount'] || 0x0, _0x23cd57),
    window['_checkEmptyHint'](),
    _0x352e0e['subscribe'](_0x19dabc),
    _0x19dabc(),
    _0x352e0e['load']()['catch']((_0x4311e4) => console['warn']('Canvas shortcuts:', _0x4311e4['message'])));
  let _0x263dfc = ![];
  (_0x5b01e3['addEventListener']('dblclick', (_0x369d02) => _0x369d02['stopPropagation']()),
    _0x5b01e3['addEventListener']('click', (_0x4f0683) => {
      _0x4f0683['stopPropagation']();
      const _0x22b76d = _0x4f0683['target']['closest']('[data-shortcut-id]');
      if (!_0x22b76d || _0x263dfc) return;
      const _0x1bccde = _0x284c6d['resolveItem'](_0x22b76d);
      if (_0x1bccde) _0x1dbb85(_0x1bccde, _0x22b76d);
    }));
  async function _0x1dbb85(_0x594727, _0x9ece9) {
    if (_0x263dfc) return;
    ((_0x263dfc = !![]), (_0x9ece9['disabled'] = !![]));
    try {
      const _0xc11216 = _0x4f2aea['getState']()['viewport'],
        _0x4adb02 = getViewportScreenCenter(_0xc11216, window['innerWidth'], window['innerHeight']),
        _0x395179 = screenToWorld(_0x4adb02['x'], _0x4adb02['y'], _0xc11216);
      if (_0x594727['action']['kind'] === 'node') {
        const _0x406982 = _0x32d7df(_0x594727['action']['nodeType']);
        _0x57e2bc('create_node', {
          type: _0x594727['action']['nodeType'],
          x: _0x395179['x'] - _0x406982['width'] / 0x2,
          y: _0x395179['y'] - _0x406982['height'] / 0x2,
        });
      } else {
        const _0x44ada5 = insertShortcutGraph({
          store: _0x4f2aea,
          graph: _0x594727['action']['graph'],
          center: _0x395179,
          commit: _0x6ad210,
        });
        _0x13fc57(_0x44ada5, 0x50, 0xfa);
      }
    } catch (_0x2b23e6) {
      window['showToast']?.(_0x2b23e6['message'] || '模板添加失败', 'error');
    } finally {
      ((_0x263dfc = ![]), (_0x9ece9['disabled'] = ![]));
    }
  }
  let _0x852743 = ![];
  (window['addEventListener']('v2:canvas-node-menu-items', (_0x4603e3) => {
    const { nodeIds: _0x1150cb, items: _0x1e7583 } = _0x4603e3['detail'] || {};
    if (!canManageCanvasShortcuts() || !_0x1150cb?.['length'] || !Array['isArray'](_0x1e7583)) return;
    const _0x1ad1e2 = [..._0x1150cb];
    _0x1e7583['push']({
      label: '加入快捷模板',
      icon: 'add-to-library',
      action: () =>
        window['dispatchEvent'](
          new CustomEvent('canvas-shortcuts:manage', { detail: { nodeIds: _0x1ad1e2 } }),
        ),
    });
  }),
    window['addEventListener']('canvas-shortcuts:manage', async (_0x51d95a) => {
      if (!canManageCanvasShortcuts() || _0x852743 || document['getElementById']('canvasShortcutsManager'))
        return;
      _0x852743 = !![];
      const _0x254677 = document['getElementById']('devEntryShortcutsBtn');
      _0x254677?.['setAttribute']('aria-busy', 'true');
      if (_0x254677) _0x254677['disabled'] = !![];
      try {
        const _0x14aadb = Array['isArray'](_0x51d95a['detail']?.['nodeIds'])
          ? captureShortcutGraph(_0x4f2aea, _0x51d95a['detail']['nodeIds'])
          : null;
        await _0x352e0e['load']();
        const { openShortcutManager: _0x1f6bb9 } = await import('./shortcutManager.js');
        if (canManageCanvasShortcuts())
          _0x1f6bb9({
            catalogStore: _0x352e0e,
            canvasStore: _0x4f2aea,
            initialGraph: _0x14aadb,
            returnFocus: document['getElementById']('devEntryShortcutsBtn'),
          });
      } catch (_0x51ba1a) {
        window['showToast']?.(_0x51ba1a['message'] || '快捷方式加载失败', 'error');
      } finally {
        ((_0x852743 = ![]), _0x254677?.['removeAttribute']('aria-busy'));
        if (_0x254677) _0x254677['disabled'] = ![];
      }
    }));
}

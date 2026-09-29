import { removeContextMenus, showContextMenu } from './interaction/contextMenuPresenter.js';
import { TEXT_CONTEXT_MENU_TARGET_SELECTOR } from './textInputContextMenu.js';
const EDITABLE_SELECTOR = 'select, ' + TEXT_CONTEXT_MENU_TARGET_SELECTOR,
  FOLDER_ACTION_SELECTOR = [
    '[data-ui-action=\x22material-folder-toggle\x22]',
    '[data-ui-action=\x22material-folder-rename\x22]',
    '[data-ui-action=\x22material-folder-delete-request\x22]',
  ]['join'](',\x20'),
  MATERIAL_CONTEXT_MENU_ICONS = Object['freeze']({
    'material-folder-toggle': 'folder-open',
    'material-folder-rename': 'edit',
    'material-folder-delete-request': 'delete',
  }),
  MATERIAL_CONTEXT_MENU_SHORTCUTS = Object['freeze']({
    'material-folder-toggle': 'context-material-folder-toggle',
    'material-folder-rename': 'context-material-folder-rename',
    'material-folder-delete-request': 'context-material-folder-delete',
  });
function getActionLabel(_0x5aa15f) {
  return _0x5aa15f?.['getAttribute']?.('aria-label') || String(_0x5aa15f?.['textContent'] || '')['trim']();
}
export function createMaterialLibraryContextMenuController({
  getPanel: _0x162b5b,
  getText: _0x2b5127,
  closeAssetMenu: _0x6806f3,
  openAssetMenu: _0x282e92,
  restoreAssetSubItem: _0x4e7d80,
  presentMenu: presentMenu = showContextMenu,
  removePresentedMenus: removePresentedMenus = removeContextMenus,
} = {}) {
  let _0x2671b2 = null;
  const _0x30e1f6 = () => {
      (_0x2671b2?.['close']?.(), (_0x2671b2 = null));
    },
    _0x3e34bd = (_0x50652d, _0x1aeb1a) => {
      if (!_0x1aeb1a['length']) return ![];
      return (
        _0x50652d['preventDefault'](),
        _0x50652d['stopPropagation'](),
        _0x6806f3?.(),
        (_0x2671b2 = presentMenu(_0x50652d['clientX'], _0x50652d['clientY'], _0x1aeb1a, {
          ensureItemIcons: !![],
          ownerElement: _0x50652d['target'],
          ownerRoot: _0x162b5b?.(),
        })),
        !![]
      );
    },
    _0x4553e8 = (_0x2aac7c) => {
      if (_0x2aac7c['target']?.['closest']?.(EDITABLE_SELECTOR)) return ![];
      const _0x3795c2 = _0x162b5b?.(),
        _0x6fc048 = _0x2aac7c['target']?.['closest']?.('.v2-material-item-row');
      if (_0x6fc048 && _0x3795c2?.['contains']?.(_0x6fc048)) {
        const _0x2f55c0 = String(_0x6fc048['dataset']['assetId'] || ''),
          _0x3bce29 = Number(_0x6fc048['dataset']['itemIndex']),
          _0x2b4ffa = _0x6fc048['querySelector']?.('[data-ui-action="material-item-rename"]');
        if (!_0x2f55c0 || !Number['isInteger'](_0x3bce29)) return ![];
        const _0x299eaf = [
          {
            label: _0x2b5127?.('loadToCanvas') || '',
            icon: 'add-to-canvas',
            shortcutActionId: 'context-material-load-item',
            action: () => _0x4e7d80?.(_0x2f55c0, _0x3bce29),
          },
        ];
        return (
          _0x2b4ffa &&
            _0x299eaf['push']({
              label: getActionLabel(_0x2b4ffa),
              icon: 'edit',
              shortcutActionId: 'context-material-rename-item',
              action: () => _0x2b4ffa['click']?.(),
            }),
          _0x3e34bd(_0x2aac7c, _0x299eaf)
        );
      }
      const _0x33d362 = _0x2aac7c['target']?.['closest']?.(
        '.v2-material-asset-row,\x20.v2-material-project-row',
      );
      if (_0x33d362 && _0x3795c2?.['contains']?.(_0x33d362)) {
        const _0x2af584 = String(
          _0x33d362['dataset']['assetId'] ||
            _0x33d362['querySelector']?.('[data-asset-id]')?.['dataset']?.['assetId'] ||
            '',
        );
        if (!_0x2af584) return ![];
        return (
          _0x2aac7c['preventDefault'](),
          _0x2aac7c['stopPropagation'](),
          _0x30e1f6(),
          removePresentedMenus?.(),
          _0x282e92?.(_0x2af584, _0x33d362),
          !![]
        );
      }
      const _0x1073dc = _0x2aac7c['target']?.['closest']?.('.v2-material-folder-row');
      if (!_0x1073dc || !_0x3795c2?.['contains']?.(_0x1073dc)) return ![];
      const _0x37c5e0 = Array['from'](_0x1073dc['querySelectorAll']?.(FOLDER_ACTION_SELECTOR) || []);
      return _0x3e34bd(
        _0x2aac7c,
        _0x37c5e0['map']((_0x8b2776) => ({
          label: getActionLabel(_0x8b2776),
          icon: MATERIAL_CONTEXT_MENU_ICONS[_0x8b2776['dataset']['uiAction']] || 'action',
          shortcutActionId: MATERIAL_CONTEXT_MENU_SHORTCUTS[_0x8b2776['dataset']['uiAction']],
          disabled: _0x8b2776['disabled'] === !![] || _0x8b2776['getAttribute']?.('aria-disabled') === 'true',
          danger: _0x8b2776['dataset']['uiAction'] === 'material-folder-delete-request',
          action: () => _0x8b2776['click']?.(),
        })),
      );
    };
  return { close: _0x30e1f6, handleContextMenu: _0x4553e8 };
}

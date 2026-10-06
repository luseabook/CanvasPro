import { removeContextMenus, showContextMenu } from './interaction/contextMenuPresenter.js';
import { TEXT_CONTEXT_MENU_TARGET_SELECTOR } from './textInputContextMenu.js';
const EDITABLE_SELECTOR = 'select, ' + TEXT_CONTEXT_MENU_TARGET_SELECTOR,
  FOLDER_ACTION_SELECTOR = [
    '[data-ui-action="material-folder-toggle"]',
    '[data-ui-action="material-folder-rename"]',
    '[data-ui-action="material-folder-delete-request"]',
  ].join(', '),
  MATERIAL_CONTEXT_MENU_ICONS = Object.freeze({
    'material-folder-toggle': 'folder-open',
    'material-folder-rename': 'edit',
    'material-folder-delete-request': 'delete',
  }),
  MATERIAL_CONTEXT_MENU_SHORTCUTS = Object.freeze({
    'material-folder-toggle': 'context-material-folder-toggle',
    'material-folder-rename': 'context-material-folder-rename',
    'material-folder-delete-request': 'context-material-folder-delete',
  });
function getActionLabel(el) {
  return el?.getAttribute?.('aria-label') || String(el?.textContent || '').trim();
}
export function createMaterialLibraryContextMenuController({
  getPanel: getPanel,
  getText: getText,
  closeAssetMenu: closeAssetMenu,
  openAssetMenu: openAssetMenu,
  restoreAssetSubItem: restoreAssetSubItem,
  presentMenu: presentMenu = showContextMenu,
  removePresentedMenus: removePresentedMenus = removeContextMenus,
} = {}) {
  let presentMenu2 = null;
  const close = () => {
      (presentMenu2?.close?.(), (presentMenu2 = null));
    },
    handler = (ownerElement, list) => {
      if (!list.length) return false;
      return (
        ownerElement.preventDefault(),
        ownerElement.stopPropagation(),
        closeAssetMenu?.(),
        (presentMenu2 = presentMenu(ownerElement.clientX, ownerElement.clientY, list, {
          ensureItemIcons: true,
          ownerElement: ownerElement.target,
          ownerRoot: getPanel?.(),
        })),
        true
      );
    },
    handleContextMenu = (event) => {
      if (event.target?.closest?.(EDITABLE_SELECTOR)) return false;
      const enabled = getPanel?.(),
        el2 = event.target?.closest?.('.v2-material-item-row');
      if (el2 && enabled?.contains?.(el2)) {
        const enabled2 = String(el2.dataset.assetId || ''),
          value = Number(el2.dataset.itemIndex),
          el3 = el2.querySelector?.('[data-ui-action="material-item-rename"]');
        if (!enabled2 || !Number.isInteger(value)) return false;
        const list2 = [
          {
            label: getText?.('loadToCanvas') || '',
            icon: 'add-to-canvas',
            shortcutActionId: 'context-material-load-item',
            action: () => restoreAssetSubItem?.(enabled2, value),
          },
        ];
        return (
          el3 &&
            list2.push({
              label: getActionLabel(el3),
              icon: 'edit',
              shortcutActionId: 'context-material-rename-item',
              action: () => el3.click?.(),
            }),
          handler(event, list2)
        );
      }
      const el4 = event.target?.closest?.('.v2-material-asset-row, .v2-material-project-row');
      if (el4 && enabled?.contains?.(el4)) {
        const enabled3 = String(
          el4.dataset.assetId ||
            el4.querySelector?.('[data-asset-id]')?.dataset?.assetId ||
            '',
        );
        if (!enabled3) return false;
        return (
          event.preventDefault(),
          event.stopPropagation(),
          close(),
          removePresentedMenus?.(),
          openAssetMenu?.(enabled3, el4),
          true
        );
      }
      const el5 = event.target?.closest?.('.v2-material-folder-row');
      if (!el5 || !enabled?.contains?.(el5)) return false;
      const list3 = Array.from(el5.querySelectorAll?.(FOLDER_ACTION_SELECTOR) || []);
      return handler(
        event,
        list3.map((disabled) => ({
          label: getActionLabel(disabled),
          icon: MATERIAL_CONTEXT_MENU_ICONS[disabled.dataset.uiAction] || 'action',
          shortcutActionId: MATERIAL_CONTEXT_MENU_SHORTCUTS[disabled.dataset.uiAction],
          disabled: disabled.disabled === true || disabled.getAttribute?.('aria-disabled') === 'true',
          danger: disabled.dataset.uiAction === 'material-folder-delete-request',
          action: () => disabled.click?.(),
        })),
      );
    };
  return { close: close, handleContextMenu: handleContextMenu };
}

import { showContextMenu } from '../interaction/contextMenuPresenter.js';
import { TEXT_CONTEXT_MENU_TARGET_SELECTOR } from '../textInputContextMenu.js';
const EDITABLE_SELECTOR = 'select, ' + TEXT_CONTEXT_MENU_TARGET_SELECTOR,
  PREVIEW_ACTION_SELECTOR = [
    '[data-action="rename-preview-param"]',
    '[data-action="edit-preview-description"]',
    '[data-action="choose-preview-control-type"]',
    '[data-action="remove-preview-param"]',
    '[data-action="remove-preview-input"]',
  ]['join'](',\x20'),
  DANGER_ACTIONS = new Set(['remove-preview-param', 'remove-preview-input']),
  ACTION_ICONS = Object['freeze']({
    'load-saved-app': 'folder-open',
    'request-delete-app': 'delete',
    'rename-preview-param': 'edit',
    'edit-preview-description': 'edit',
    'choose-preview-control-type': 'model',
    'remove-preview-param': 'delete',
    'remove-preview-input': 'delete',
  }),
  ACTION_SHORTCUTS = Object['freeze']({
    'load-saved-app': 'context-runninghub-load-app',
    'request-delete-app': 'context-runninghub-delete-app',
    'rename-preview-param': 'context-runninghub-rename-param',
    'edit-preview-description': 'context-runninghub-edit-description',
    'choose-preview-control-type': 'context-runninghub-choose-control',
    'remove-preview-param': 'context-runninghub-remove-param',
    'remove-preview-input': 'context-runninghub-remove-input',
  });
function getActionLabel(el) {
  return el?.['getAttribute']?.('aria-label') || String(el?.['textContent'] || '')['trim']();
}
function createActionItem(disabled) {
  return {
    label: getActionLabel(disabled),
    icon: ACTION_ICONS[disabled?.['dataset']?.['action']] || 'action',
    shortcutActionId: ACTION_SHORTCUTS[disabled?.['dataset']?.['action']],
    disabled: disabled?.['disabled'] === !![] || disabled?.['getAttribute']?.('aria-disabled') === 'true',
    danger: DANGER_ACTIONS['has'](disabled?.['dataset']?.['action']),
    action: () => disabled?.['click']?.(),
  };
}
export function createRunningHubAiAppContextMenuController({
  getPanel: getPanel,
  presentMenu: presentMenu = showContextMenu,
  beforeOpen: beforeOpen = null,
} = {}) {
  let presentMenu2 = null;
  const run = (ownerElement, list) => {
      if (!list['length']) return ![];
      return (
        ownerElement['preventDefault'](),
        ownerElement['stopPropagation'](),
        beforeOpen?.(ownerElement),
        presentMenu2?.['close']?.(),
        (presentMenu2 = presentMenu(ownerElement['clientX'], ownerElement['clientY'], list, {
          ensureItemIcons: !![],
          ownerElement: ownerElement['target'],
          ownerRoot: getPanel?.(),
        })),
        !![]
      );
    },
    close = () => {
      (presentMenu2?.['close']?.(), (presentMenu2 = null));
    },
    handleContextMenu = (event) => {
      if (event['target']?.['closest']?.(EDITABLE_SELECTOR)) return ![];
      const enabled = getPanel?.(),
        el2 = event['target']?.['closest']?.('.rh-ai-app-saved-app-row');
      if (el2 && enabled?.['contains']?.(el2)) {
        const value = el2['querySelector']?.('[data-action="load-saved-app"]'),
          item = el2['querySelector']?.('[data-action="request-delete-app"]');
        return run(
          event,
          [value, item]
            ['filter'](Boolean)
            ['map']((danger) => ({ ...createActionItem(danger), danger: danger === item })),
        );
      }
      const el3 = event['target']?.['closest']?.('.rh-ai-app-preview-component');
      if (!el3 || !enabled?.['contains']?.(el3)) return ![];
      const list2 = Array['from'](el3['querySelectorAll']?.(PREVIEW_ACTION_SELECTOR) || []);
      return run(event, list2['map'](createActionItem));
    };
  return { close: close, handleContextMenu: handleContextMenu };
}

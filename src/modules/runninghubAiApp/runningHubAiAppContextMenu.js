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
function getActionLabel(_0x3a4f00) {
  return _0x3a4f00?.['getAttribute']?.('aria-label') || String(_0x3a4f00?.['textContent'] || '')['trim']();
}
function createActionItem(_0x44bf36) {
  return {
    label: getActionLabel(_0x44bf36),
    icon: ACTION_ICONS[_0x44bf36?.['dataset']?.['action']] || 'action',
    shortcutActionId: ACTION_SHORTCUTS[_0x44bf36?.['dataset']?.['action']],
    disabled: _0x44bf36?.['disabled'] === !![] || _0x44bf36?.['getAttribute']?.('aria-disabled') === 'true',
    danger: DANGER_ACTIONS['has'](_0x44bf36?.['dataset']?.['action']),
    action: () => _0x44bf36?.['click']?.(),
  };
}
export function createRunningHubAiAppContextMenuController({
  getPanel: _0x4fef8f,
  presentMenu: presentMenu = showContextMenu,
  beforeOpen: beforeOpen = null,
} = {}) {
  let _0x3d9542 = null;
  const _0x470703 = (_0x2962b9, _0x5771a3) => {
      if (!_0x5771a3['length']) return ![];
      return (
        _0x2962b9['preventDefault'](),
        _0x2962b9['stopPropagation'](),
        beforeOpen?.(_0x2962b9),
        _0x3d9542?.['close']?.(),
        (_0x3d9542 = presentMenu(_0x2962b9['clientX'], _0x2962b9['clientY'], _0x5771a3, {
          ensureItemIcons: !![],
          ownerElement: _0x2962b9['target'],
          ownerRoot: _0x4fef8f?.(),
        })),
        !![]
      );
    },
    _0x1d766b = () => {
      (_0x3d9542?.['close']?.(), (_0x3d9542 = null));
    },
    _0x4154f0 = (_0x98e0f9) => {
      if (_0x98e0f9['target']?.['closest']?.(EDITABLE_SELECTOR)) return ![];
      const _0x3425d5 = _0x4fef8f?.(),
        _0x22d25c = _0x98e0f9['target']?.['closest']?.('.rh-ai-app-saved-app-row');
      if (_0x22d25c && _0x3425d5?.['contains']?.(_0x22d25c)) {
        const _0xbf763f = _0x22d25c['querySelector']?.('[data-action="load-saved-app"]'),
          _0x528d54 = _0x22d25c['querySelector']?.('[data-action="request-delete-app"]');
        return _0x470703(
          _0x98e0f9,
          [_0xbf763f, _0x528d54]
            ['filter'](Boolean)
            ['map']((_0x5d7277) => ({ ...createActionItem(_0x5d7277), danger: _0x5d7277 === _0x528d54 })),
        );
      }
      const _0x21c8d2 = _0x98e0f9['target']?.['closest']?.('.rh-ai-app-preview-component');
      if (!_0x21c8d2 || !_0x3425d5?.['contains']?.(_0x21c8d2)) return ![];
      const _0x4c8059 = Array['from'](_0x21c8d2['querySelectorAll']?.(PREVIEW_ACTION_SELECTOR) || []);
      return _0x470703(_0x98e0f9, _0x4c8059['map'](createActionItem));
    };
  return { close: _0x1d766b, handleContextMenu: _0x4154f0 };
}

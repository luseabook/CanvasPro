import appStore from '../core/stores/appStore.js';
import { t } from '../i18n/index.js';
import {
  _closeMentionMenu,
  _handleMentionMenuKeyboard,
  cancelPromptHtmlCommit,
} from '../modules/nodePromptShared.js';
import { closeSlashMenu, handleSlashKeyboardNavigation } from '../modules/slashMenu.js';
import { closeNodeFooterMenus } from './shared/nodeFooterControls.js';
import { createPromptExpansionController } from './promptExpansionController.js';
export function attachNodePromptExpansion(_0x4ef3ad, { panel: _0x3d4bfc }) {
  _0x4ef3ad['_promptExpansion']?.['remove']();
  let _0x904df3 = null,
    _0x1495f4 = null,
    _0xea53ad = ![],
    _0x7bac13 = ![],
    _0xea8d6d = null;
  const _0x248a7d = _0x4ef3ad['_root'],
    _0x5e78ee = () => appStore['getStateRaw'](),
    _0x3c8f4c = () => {
      (_0x904df3?.(), (_0x904df3 = null), _0xea8d6d?.['disconnect'](), (_0xea8d6d = null));
    },
    _0x73a808 = createPromptExpansionController({
      panel: _0x3d4bfc,
      promptEl: _0x4ef3ad['promptEl'],
      mountRoot: document['getElementById']('v2-wrap') || document['body'],
      externalDialogSelector: '.preset-modal-overlay',
      floatingSurfaceSelector:
        '.at-mention-menu, .preset-slash-menu, .preset-slash-submenu, .preset-slash-cover-preview, .global-tooltip, .generation-node-help-tooltip-portal, .ref-hover-preview, .v2-text-input-context-menu, .v2-submenu',
      getTitle: () => {
        const _0x392189 = _0x5e78ee()['nodes']?.[_0x4ef3ad['nodeId']];
        return _0x392189?.['name'] || _0x392189?.['label'] || t('promptExpansion.title');
      },
      flush: () => {
        if (_0x4ef3ad['_hasPendingPromptHtmlCommit']) _0x4ef3ad['_flushPromptHtmlCommit']?.();
      },
      closeMenus: () => {
        (_closeMentionMenu(), closeSlashMenu(), closeNodeFooterMenus(_0x3d4bfc));
      },
      consumeEscape: (_0x515c03) => {
        if (_handleMentionMenuKeyboard(_0x515c03) || handleSlashKeyboardNavigation(_0x515c03)) return !![];
        if (
          _0x3d4bfc['querySelector'](
            '.floating-menu.show, .img-model-menu.show, .node-model-menu.show, .ui-schema-floating-menu.show, .rh-adv-panel.show:not(.is-rh-ai-app-persistent), .rh-vram-adv-panel.show:not(.is-rh-ai-app-persistent)',
          )
        )
          return (closeNodeFooterMenus(_0x3d4bfc), !![]);
        return ![];
      },
      onOpen: () => {
        _0x1495f4 = _0x5e78ee()['nodes'];
        if (!_0x904df3) _0x904df3 = appStore['subscribeRaw'](_0x40177f);
        if (!_0xea8d6d) {
          _0xea8d6d = new MutationObserver(() => {
            _0x73a808['expanded'] &&
              (!_0x248a7d['getClientRects']()['length'] || !_0x4ef3ad['promptEl']['isContentEditable']) &&
              _0x73a808['close']({ restoreFocus: ![] });
          });
          for (let _0x49e4bc = _0x248a7d; _0x49e4bc; _0x49e4bc = _0x49e4bc['parentElement']) {
            _0xea8d6d['observe'](_0x49e4bc, {
              attributes: !![],
              attributeFilter: ['hidden', 'aria-hidden', 'class', 'style'],
            });
          }
          _0xea8d6d['observe'](_0x4ef3ad['promptEl'], {
            attributes: !![],
            attributeFilter: ['contenteditable'],
          });
        }
      },
      onClose: () => {
        if (!_0xea53ad) _0x3c8f4c();
      },
    });
  function _0x40177f() {
    if (_0x7bac13) return;
    const _0x5dabb7 = _0x5e78ee();
    if (
      _0x5dabb7['nodes'] !== _0x1495f4 ||
      !_0x5dabb7['nodes'][_0x4ef3ad['nodeId']] ||
      !_0x248a7d['isConnected']
    ) {
      (cancelPromptHtmlCommit(_0x4ef3ad),
        (_0xea53ad = ![]),
        _0x73a808['close']({ commit: ![], restoreFocus: ![] }),
        _0x3c8f4c());
      return;
    }
    if (
      _0x5dabb7['pickConnectMode']?.['active'] &&
      _0x5dabb7['pickConnectMode']['sourceNodeId'] === _0x4ef3ad['nodeId']
    ) {
      ((_0xea53ad = !![]), _0x73a808['close']({ restoreFocus: ![] }));
      return;
    }
    if (_0xea53ad && !_0x5dabb7['pickConnectMode']?.['active'])
      ((_0xea53ad = ![]),
        queueMicrotask(() => {
          if (
            !_0x7bac13 &&
            _0x248a7d['isConnected'] &&
            _0x5e78ee()['nodes'] === _0x1495f4 &&
            _0x5e78ee()['selectedNodeIds']?.['includes'](_0x4ef3ad['nodeId'])
          )
            _0x73a808['open']();
          else _0x3c8f4c();
        }));
    else
      !_0x5dabb7['selectedNodeIds']?.['includes'](_0x4ef3ad['nodeId'])
        ? _0x73a808['close']({ restoreFocus: ![] })
        : _0x73a808['sync']();
  }
  _0x4ef3ad['_promptExpansion'] = {
    open: _0x73a808['open'],
    remove() {
      ((_0x7bac13 = !![]), (_0xea53ad = ![]), _0x3c8f4c(), _0x73a808['remove']());
    },
  };
}

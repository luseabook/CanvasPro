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
export function attachNodePromptExpansion(promptEl, { panel: panel }) {
  promptEl._promptExpansion?.remove();
  let enabled = null,
    value = null,
    enabled2 = false,
    enabled3 = false,
    mutationObserver = null;
  const el = promptEl._root,
    handler = () => appStore.getStateRaw(),
    handler2 = () => {
      (enabled?.(), (enabled = null), mutationObserver?.disconnect(), (mutationObserver = null));
    },
    open = createPromptExpansionController({
      panel: panel,
      promptEl: promptEl.promptEl,
      mountRoot: document.getElementById('v2-wrap') || document.body,
      externalDialogSelector: '.preset-modal-overlay',
      floatingSurfaceSelector:
        '.at-mention-menu, .preset-slash-menu, .preset-slash-submenu, .preset-slash-cover-preview, .global-tooltip, .generation-node-help-tooltip-portal, .ref-hover-preview, .v2-text-input-context-menu, .v2-submenu',
      getTitle: () => {
        const error = handler().nodes?.[promptEl.nodeId];
        return error?.name || error?.label || t('promptExpansion.title');
      },
      flush: () => {
        if (promptEl._hasPendingPromptHtmlCommit) promptEl._flushPromptHtmlCommit?.();
      },
      closeMenus: () => {
        (_closeMentionMenu(), closeSlashMenu(), closeNodeFooterMenus(panel));
      },
      consumeEscape: (item) => {
        if (_handleMentionMenuKeyboard(item) || handleSlashKeyboardNavigation(item)) return true;
        if (
          panel.querySelector(
            '.floating-menu.show, .img-model-menu.show, .node-model-menu.show, .ui-schema-floating-menu.show, .rh-adv-panel.show:not(.is-rh-ai-app-persistent), .rh-vram-adv-panel.show:not(.is-rh-ai-app-persistent)',
          )
        )
          return (closeNodeFooterMenus(panel), true);
        return false;
      },
      onOpen: () => {
        value = handler().nodes;
        if (!enabled) enabled = appStore.subscribeRaw(run);
        if (!mutationObserver) {
          mutationObserver = new MutationObserver(() => {
            open.expanded &&
              (!el.getClientRects().length || !promptEl.promptEl.isContentEditable) &&
              open.close({ restoreFocus: false });
          });
          for (let key = el; key; key = key.parentElement) {
            mutationObserver.observe(key, {
              attributes: true,
              attributeFilter: ['hidden', 'aria-hidden', 'class', 'style'],
            });
          }
          mutationObserver.observe(promptEl.promptEl, {
            attributes: true,
            attributeFilter: ['contenteditable'],
          });
        }
      },
      onClose: () => {
        if (!enabled2) handler2();
      },
    });
  function run() {
    if (enabled3) return;
    const enabled4 = handler();
    if (enabled4.nodes !== value || !enabled4.nodes[promptEl.nodeId] || !el.isConnected) {
      (cancelPromptHtmlCommit(promptEl),
        (enabled2 = false),
        open.close({ commit: false, restoreFocus: false }),
        handler2());
      return;
    }
    if (
      enabled4.pickConnectMode?.active &&
      enabled4.pickConnectMode.sourceNodeId === promptEl.nodeId
    ) {
      ((enabled2 = true), open.close({ restoreFocus: false }));
      return;
    }
    if (enabled2 && !enabled4.pickConnectMode?.active)
      ((enabled2 = false),
        queueMicrotask(() => {
          if (
            !enabled3 &&
            el.isConnected &&
            handler().nodes === value &&
            handler().selectedNodeIds?.includes(promptEl.nodeId)
          )
            open.open();
          else handler2();
        }));
    else
      !enabled4.selectedNodeIds?.includes(promptEl.nodeId)
        ? open.close({ restoreFocus: false })
        : open.sync();
  }
  promptEl._promptExpansion = {
    open: open.open,
    remove() {
      ((enabled3 = true), (enabled2 = false), handler2(), open.remove());
    },
  };
}

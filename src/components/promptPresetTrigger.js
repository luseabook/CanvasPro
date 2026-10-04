import { onLocaleChange, t } from '../i18n/index.js';
import { isPromptPresetNodeTypeSupported } from '../modules/promptPresets.js';
import { closeSlashMenu, openPromptPresetMenu } from '../modules/slashMenu.js';
const PROMPT_PRESET_BOOK_ICON_HTML = '<span class="prompt-preset-trigger-icon" aria-hidden="true"></span>';
export function createPromptPresetTriggerController({
  panel: panel,
  getPromptEl: getPromptEl,
  getNodeType: getNodeType,
  getNodeId: getNodeId,
  onGenerate: onGenerate,
  openMenu: openMenu = openPromptPresetMenu,
  closeMenu: closeMenu = closeSlashMenu,
} = {}) {
  if (!panel) return { sync() {}, remove() {} };
  const el = panel['ownerDocument'] || globalThis['document'];
  let anchorEl = panel['querySelector']?.('.prompt-preset-trigger') || null;
  if (!anchorEl) {
    anchorEl = el?.['createElement']?.('button') || null;
    if (!anchorEl) return { sync() {}, remove() {} };
    ((anchorEl['type'] = 'button'),
      (anchorEl['className'] = 'prompt-preset-trigger'),
      (anchorEl['innerHTML'] = PROMPT_PRESET_BOOK_ICON_HTML),
      anchorEl['setAttribute']('aria-haspopup', 'menu'),
      anchorEl['setAttribute']('aria-expanded', 'false'),
      panel['appendChild'](anchorEl));
  }
  panel['classList']?.['add']('has-prompt-preset-trigger');
  const onOpenChange = (value) => {
      const item = value === !![],
        key = panel['classList']?.['contains']?.('is-prompt-expanded') === !![];
      (anchorEl?.['setAttribute']('aria-expanded', String(item)),
        anchorEl?.['classList']?.['toggle']?.('is-open', item),
        panel['classList']?.['toggle']?.('has-prompt-preset-drawer', item && key));
    },
    sync2 = () => {
      const t2 = t('promptPresets.triggerLabel');
      ((anchorEl['title'] = t2), anchorEl['setAttribute']('aria-label', t2));
      const isPromptPresetNodeTypeSupported2 = isPromptPresetNodeTypeSupported(getNodeType?.());
      anchorEl['hidden'] = !isPromptPresetNodeTypeSupported2;
      if (!isPromptPresetNodeTypeSupported2) onOpenChange(![]);
    },
    index = (event) => {
      (event['preventDefault'](), event['stopPropagation']());
    },
    result = (event2) => {
      (event2['preventDefault'](), event2['stopPropagation']());
      if (anchorEl['getAttribute']('aria-expanded') === 'true') {
        closeMenu();
        return;
      }
      const promptEl = getPromptEl?.(),
        nodeType = getNodeType?.();
      if (!promptEl || !isPromptPresetNodeTypeSupported(nodeType)) return;
      const placement = panel['classList']?.['contains']?.('is-prompt-expanded') === !![];
      (openMenu({
        promptEl: promptEl,
        nodeType: nodeType,
        nodeId: getNodeId?.(),
        onGenerate: onGenerate,
        anchorEl: anchorEl,
        placement: placement ? 'expanded-panel' : 'above-end',
        containerEl: placement ? panel : null,
        onOpenChange: onOpenChange,
      }),
        promptEl['focus']?.({ preventScroll: !![] }));
    };
  (anchorEl['addEventListener']('pointerdown', index),
    anchorEl['addEventListener']('mousedown', index),
    anchorEl['addEventListener']('click', result),
    sync2());
  const onLocaleChange2 = onLocaleChange(sync2),
    remove2 = () => {
      onLocaleChange2?.();
      if (anchorEl?.['getAttribute']('aria-expanded') === 'true') closeMenu();
      (anchorEl?.['remove']?.(),
        (anchorEl = null),
        panel['classList']?.['remove']('has-prompt-preset-trigger', 'has-prompt-preset-drawer'));
    };
  return { sync: sync2, remove: remove2 };
}

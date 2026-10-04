import { onLocaleChange, t } from '../i18n/index.js';
import { hostPromptFloatingSurfaces } from './promptExpansionFloatingSurfaces.js';
import { beginModalInteraction } from '../services/modalInteractionScope.js';
import { createPromptExpansionMotion } from './promptExpansionMotion.js';
const EXPAND_ICON =
    '<svg\x20viewBox=\x220\x200\x2024\x2024\x22\x20fill=\x22none\x22\x20stroke=\x22currentColor\x22\x20stroke-width=\x221.7\x22\x20stroke-linecap=\x22round\x22\x20stroke-linejoin=\x22round\x22\x20aria-hidden=\x22true\x22><path\x20d=\x22M8\x203H3v5m13-5h5v5M3\x2016v5h5m13-5v5h-5\x22/></svg>',
  COLLAPSE_ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5"/></svg>';
let activeController = null;
export function createPromptExpansionController({
  panel: panel,
  promptEl: promptEl,
  mountRoot: mountRoot,
  floatingSurfaceSelector: floatingSurfaceSelector,
  externalDialogSelector: externalDialogSelector,
  getTitle: getTitle,
  flush: flush,
  closeMenus: closeMenus,
  consumeEscape: consumeEscape,
  onOpen: onOpen,
  onClose: onClose,
}) {
  const el = panel['ownerDocument'],
    dom = el['defaultView'],
    el2 = el['createElement']('button');
  ((el2['type'] = 'button'),
    (el2['className'] = 'prompt-expand-trigger'),
    el2['setAttribute']('aria-haspopup', 'dialog'),
    panel['classList']['add']('has-prompt-expand'),
    panel['appendChild'](el2));
  let overlay = null,
    hostPromptFloatingSurfaces2 = null,
    beginModalInteraction2 = null,
    el3 = null,
    value = 0x0,
    item = 0x0,
    el4 = null,
    key = ![],
    index = ![],
    enabled = ![],
    result = null;
  const promptExpansionMotion = createPromptExpansionMotion(panel);
  function sync() {
    const t2 = t(overlay ? 'promptExpansion.collapse' : 'promptExpansion.expand');
    ((el2['title'] = t2),
      el2['setAttribute']('aria-label', t2),
      el2['setAttribute']('aria-expanded', String(!!overlay)));
    el2['dataset']['expanded'] !== String(!!overlay) &&
      ((el2['innerHTML'] = overlay ? COLLAPSE_ICON : EXPAND_ICON),
      (el2['dataset']['expanded'] = String(!!overlay)));
    if (el3) el3['textContent'] = getTitle?.() || t('promptExpansion.title');
  }
  function run() {
    const anchor = dom['getSelection']();
    if (
      !anchor?.['rangeCount'] ||
      !promptEl['contains'](anchor['anchorNode']) ||
      !promptEl['contains'](anchor['focusNode'])
    )
      return;
    el4 = {
      anchor: anchor['anchorNode'],
      anchorOffset: anchor['anchorOffset'],
      focus: anchor['focusNode'],
      focusOffset: anchor['focusOffset'],
    };
  }
  function run2(data) {
    promptEl['focus']({ preventScroll: !![] });
    if (el4 && promptEl['contains'](el4['anchor']) && promptEl['contains'](el4['focus'])) {
      const { anchor: anchor2, anchorOffset: anchorOffset, focus: focus, focusOffset: focusOffset } = el4;
      dom['getSelection']()['setBaseAndExtent'](anchor2, anchorOffset, focus, focusOffset);
    }
    promptEl['scrollTop'] = data;
  }
  function run3() {
    (promptExpansionMotion['cancel'](),
      panel['classList']['add']('is-prompt-measuring'),
      panel['hidePopover'](),
      panel['removeAttribute']('popover'),
      panel['classList']['remove']('is-prompt-expanded'),
      (el3['hidden'] = !![]));
    const options = panel['getBoundingClientRect']();
    return (
      (el3['hidden'] = ![]),
      panel['classList']['add']('is-prompt-expanded'),
      panel['setAttribute']('popover', 'manual'),
      panel['showPopover'](),
      panel['classList']['remove']('is-prompt-measuring'),
      run2(item),
      options
    );
  }
  function onClose2({
    commit: commit = !![],
    restoreFocus: restoreFocus = !![],
    animate: animate = !![],
  } = {}) {
    if (!overlay) return;
    if (enabled && animate && commit && restoreFocus) return;
    (run(), (item = promptEl['scrollTop']));
    if (commit) flush?.();
    closeMenus?.();
    if (animate && commit && restoreFocus && panel['isConnected'] && panel['matches'](':popover-open')) {
      const target = panel['getBoundingClientRect'](),
        source = run3();
      ((enabled = !![]),
        promptExpansionMotion['play'](target, source, {
          overlay: overlay,
          closing: !![],
          onFinish: () => onClose2({ commit: commit, restoreFocus: restoreFocus, animate: ![] }),
        }));
      return;
    }
    ((enabled = ![]),
      promptExpansionMotion['cancel'](),
      beginModalInteraction2?.({ restoreFocus: ![] }),
      (beginModalInteraction2 = null),
      closeMenus?.(),
      hostPromptFloatingSurfaces2?.(),
      (hostPromptFloatingSurfaces2 = null));
    const el5 = overlay;
    overlay = null;
    if (activeController === next) activeController = null;
    (el3?.['remove'](), (el3 = null), panel['classList']['add']('is-prompt-measuring'));
    if (panel['matches'](':popover-open')) panel['hidePopover']();
    (panel['removeAttribute']('popover'),
      panel['removeAttribute']('role'),
      panel['removeAttribute']('aria-modal'),
      panel['removeAttribute']('aria-label'),
      panel['classList']['remove']('is-prompt-expanded', 'is-resize-hover'),
      void panel['offsetWidth'],
      panel['classList']['remove']('is-prompt-measuring'),
      el5['remove'](),
      sync());
    if (restoreFocus && panel['isConnected']) run2(value);
    onClose?.();
  }
  function open() {
    if (index || !panel['isConnected'] || !promptEl['isContentEditable']) return;
    if (overlay) {
      enabled &&
        ((enabled = ![]),
        promptExpansionMotion['play'](panel['getBoundingClientRect'](), null, { overlay: overlay }));
      return;
    }
    if (!promptEl['getClientRects']()['length']) return;
    (activeController?.['close']({ animate: ![] }),
      run(),
      (value = promptEl['scrollTop']),
      flush?.(),
      closeMenus?.(),
      (result = panel['getBoundingClientRect']()),
      (overlay = el['createElement']('div')),
      (overlay['className'] = 'prompt-expansion-overlay'),
      overlay['addEventListener']('pointerdown', (event) => {
        event['stopPropagation']();
        if (event['target'] === overlay) event['preventDefault']();
      }),
      overlay['addEventListener']('click', (event2) => event2['stopPropagation']()),
      overlay['addEventListener']('wheel', (event3) => event3['stopPropagation'](), {
        passive: !![],
      }),
      mountRoot['appendChild'](overlay),
      panel['classList']['remove']('is-resize-hover'),
      panel['classList']['add']('is-prompt-expanded'),
      panel['setAttribute']('popover', 'manual'),
      panel['setAttribute']('role', 'dialog'),
      panel['setAttribute']('aria-modal', 'true'),
      panel['setAttribute']('aria-label', t('promptExpansion.title')),
      panel['showPopover'](),
      (hostPromptFloatingSurfaces2 = hostPromptFloatingSurfaces(panel, floatingSurfaceSelector, {
        externalDialogSelector: externalDialogSelector,
        onExternalDialog: () => onClose2({ restoreFocus: ![] }),
      })),
      (el3 = el['createElement']('div')),
      (el3['className'] = 'prompt-expansion-title'),
      panel['prepend'](el3),
      (activeController = next),
      sync(),
      (beginModalInteraction2 = beginModalInteraction({
        root: panel,
        onClose: onClose2,
        onSuspend: () => onClose2({ restoreFocus: ![] }),
        preferredSelector: '.prompt-textarea',
      })),
      run2(item || value),
      promptExpansionMotion['play'](result, null, { overlay: overlay }),
      onOpen?.());
  }
  function run4(event4) {
    (run(), event4['preventDefault'](), event4['stopPropagation']());
  }
  function run5(event5) {
    (event5['preventDefault'](), event5['stopPropagation']());
    if (key) return;
    if (enabled) open();
    else {
      if (overlay) onClose2();
      else open();
    }
  }
  function run6(event6) {
    if (!overlay) return;
    event6['stopPropagation']();
    if (key || event6['isComposing'] || event6['keyCode'] === 0xe5) {
      if (event6['key'] === 'Escape') event6['preventDefault']();
      return;
    }
    if (event6['defaultPrevented']) return;
    if (event6['key'] === 'Escape') {
      event6['preventDefault']();
      if (consumeEscape?.(event6)) return;
      onClose2();
    }
  }
  const current = () => {
      key = !![];
    },
    entry = () => {
      key = ![];
    },
    record = () => {
      if (overlay && !panel['matches'](':popover-open')) onClose2({ restoreFocus: ![] });
    };
  (el2['addEventListener']('pointerdown', run4),
    el2['addEventListener']('mousedown', run4),
    el2['addEventListener']('click', run5),
    panel['addEventListener']('keydown', run6),
    panel['addEventListener']('toggle', record),
    promptEl['addEventListener']('compositionstart', current),
    promptEl['addEventListener']('compositionend', entry));
  const onLocaleChange2 = onLocaleChange(sync),
    next = {
      open: open,
      close: onClose2,
      sync: sync,
      get expanded() {
        return !!overlay;
      },
      remove() {
        ((index = !![]),
          onClose2({ commit: ![], restoreFocus: ![] }),
          onLocaleChange2?.(),
          el2['remove'](),
          panel['classList']['remove']('has-prompt-expand'),
          panel['removeEventListener']('keydown', run6),
          panel['removeEventListener']('toggle', record),
          promptEl['removeEventListener']('compositionstart', current),
          promptEl['removeEventListener']('compositionend', entry));
      },
    };
  return (sync(), next);
}

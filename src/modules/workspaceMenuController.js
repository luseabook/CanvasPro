function getEnabledOptions(el, value) {
  return Array['from'](el?.['querySelectorAll']?.(value) || [])['filter'](
    (el2) => el2?.['disabled'] !== true && el2?.['getAttribute']?.('aria-disabled') !== 'true',
  );
}
function focusMenuOption(el3) {
  try {
    el3?.['focus']?.({ preventScroll: true });
  } catch {
    el3?.['focus']?.();
  }
  if (!el3?.['ownerDocument'] || el3['ownerDocument']['activeElement'] === el3) return;
  const item = el3['ownerDocument']['defaultView'],
    handler = () => {
      try {
        el3?.['focus']?.({ preventScroll: true });
      } catch {
        el3?.['focus']?.();
      }
    };
  item?.['requestAnimationFrame']?.(() => {
    handler();
    if (el3['ownerDocument']['activeElement'] === el3) return;
    item?.['requestAnimationFrame']?.(handler);
  });
}
export function syncWorkspaceInlineMenuExpandedWidth(el4) {
  const count = Math['ceil'](Number(el4?.['scrollWidth']) || 0);
  if (count <= 0) return 0;
  return (el4['style']?.['setProperty']?.('--workspace-inline-menu-expanded-width', count + 'px'), count);
}
export function createWorkspaceMenuController({
  root: root,
  wrapperSelector: wrapperSelector,
  triggerSelector: triggerSelector,
  menuSelector: menuSelector,
  optionSelector: optionSelector,
  openClass: openClass = 'is-open',
} = {}) {
  const run = () => (typeof root === 'function' ? root() : root),
    close = (value2 = null) => {
      run()
        ?.['querySelectorAll']?.(wrapperSelector)
        ?.['forEach']?.((el5) => {
          if (el5 === value2 || !el5['classList']?.['contains']?.(openClass)) return;
          (el5['classList']?.['remove']?.(openClass),
            el5['querySelector']?.(triggerSelector)?.['setAttribute']?.('aria-expanded', 'false'),
            el5['querySelector']?.(menuSelector)?.['setAttribute']?.('aria-hidden', 'true'));
        });
    },
    open = (el6, el7 = el6?.['querySelector']?.(triggerSelector)) => {
      const el8 = el6?.['querySelector']?.(menuSelector);
      if (!el6 || !el7 || !el8 || el7['disabled'] === true) return false;
      return (
        close(el6),
        el6['classList']?.['add']?.(openClass),
        el7['setAttribute']?.('aria-expanded', 'true'),
        el8['setAttribute']?.('aria-hidden', 'false'),
        true
      );
    },
    toggle = (el9) => {
      const el10 = el9?.['closest']?.(wrapperSelector);
      if (!el10 || el9?.['disabled'] === true) return false;
      if (el10['classList']?.['contains']?.(openClass)) return (close(), false);
      return open(el10, el9);
    },
    handleKeyDown = (event) => {
      const el11 = event?.['target']?.['closest']?.(triggerSelector),
        el12 = event?.['target']?.['closest']?.(optionSelector);
      if (el11 && ['ArrowDown', 'ArrowUp']['includes'](event['key'])) {
        const key = el11['closest']?.(wrapperSelector),
          list = getEnabledOptions(key, optionSelector);
        if (!open(key, el11)) return false;
        return (
          event['preventDefault']?.(),
          event['stopPropagation']?.(),
          focusMenuOption(list[event['key'] === 'ArrowUp' ? list['length'] - 1 : 0]),
          true
        );
      }
      const el13 = el12?.['closest']?.(wrapperSelector) || el11?.['closest']?.(wrapperSelector);
      if (el11 && event['key'] === 'Escape' && el13?.['classList']?.['contains']?.(openClass))
        return (event['preventDefault']?.(), event['stopPropagation']?.(), close(), el11['focus']?.(), true);
      if (!el12 || !el13) return false;
      if (event['key'] === 'Escape')
        return (
          event['preventDefault']?.(),
          event['stopPropagation']?.(),
          close(),
          el13['querySelector']?.(triggerSelector)?.['focus']?.(),
          true
        );
      const list2 = getEnabledOptions(el13, optionSelector),
        count2 = list2['indexOf'](el12);
      if (count2 < 0 || !list2['length']) return false;
      let index = count2;
      if (event['key'] === 'ArrowDown') index = (count2 + 1) % list2['length'];
      else {
        if (event['key'] === 'ArrowUp') index = (count2 - 1 + list2['length']) % list2['length'];
        else {
          if (event['key'] === 'Home') index = 0;
          else {
            if (event['key'] === 'End') index = list2['length'] - 1;
            else return false;
          }
        }
      }
      return (event['preventDefault']?.(), event['stopPropagation']?.(), focusMenuOption(list2[index]), true);
    };
  return Object['freeze']({ close: close, open: open, toggle: toggle, handleKeyDown: handleKeyDown });
}

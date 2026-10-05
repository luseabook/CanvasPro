const GROUP_SELECTOR = '[data-person-replacement-export-group]',
  TRIGGER_SELECTOR = '[data-person-replacement-export-submenu-trigger]',
  SUBMENU_SELECTOR = '[data-person-replacement-export-submenu]';
function focusElement(el) {
  try {
    el?.['focus']?.({ preventScroll: !![] });
  } catch {
    el?.['focus']?.();
  }
}
export function createPersonReplacementExportSubmenuController({ root: root } = {}) {
  const run = () => (typeof root === 'function' ? root() : root),
    close = (value = null) => {
      run()
        ?.['querySelectorAll']?.(GROUP_SELECTOR)
        ?.['forEach']?.((el2) => {
          if (el2 === value) return;
          (el2['classList']?.['remove']?.('is-open'),
            el2['querySelector']?.(TRIGGER_SELECTOR)?.['setAttribute']?.('aria-expanded', 'false'),
            el2['querySelector']?.(SUBMENU_SELECTOR)?.['setAttribute']?.('aria-hidden', 'true'));
        });
    },
    handler = (el3, enabled) => {
      if (!el3) return ![];
      if (enabled) close(el3);
      return (
        el3['classList']?.['toggle']?.('is-open', enabled),
        el3['querySelector']?.(TRIGGER_SELECTOR)?.['setAttribute']?.('aria-expanded', String(enabled)),
        el3['querySelector']?.(SUBMENU_SELECTOR)?.['setAttribute']?.('aria-hidden', String(!enabled)),
        !![]
      );
    },
    handler2 = (el4) => {
      const item = el4?.['closest']?.(GROUP_SELECTOR);
      return item && run()?.['contains']?.(item) ? item : null;
    },
    handleClick = (event) => {
      const el5 = event?.['target']?.['closest']?.(TRIGGER_SELECTOR),
        enabled2 = handler2(el5);
      if (!enabled2 || el5?.['disabled'] === !![]) return ![];
      return (event['preventDefault']?.(), handler(enabled2, !![]), !![]);
    },
    handlePointerOver = (event2) => {
      const enabled3 = handler2(event2?.['target']);
      if (!enabled3) return ![];
      return (handler(enabled3, !![]), !![]);
    },
    handlePointerOut = (event3) => {
      const enabled4 = handler2(event3?.['target']);
      if (!enabled4 || enabled4['contains']?.(event3?.['relatedTarget'])) return ![];
      return (handler(enabled4, ![]), !![]);
    },
    handleFocusIn = (event4) => {
      const enabled5 = handler2(event4?.['target']);
      if (!enabled5) return ![];
      return (handler(enabled5, !![]), !![]);
    },
    handleFocusOut = (event5) => {
      const enabled6 = handler2(event5?.['target']);
      if (!enabled6 || enabled6['contains']?.(event5?.['relatedTarget'])) return ![];
      return (handler(enabled6, ![]), !![]);
    },
    handleKeyDown = (event6) => {
      const key = event6?.['target']?.['closest']?.(TRIGGER_SELECTOR),
        el6 = handler2(event6?.['target']);
      if (!el6) return ![];
      if (key && ['ArrowRight', 'Enter', ' ']['includes'](event6['key']))
        return (
          event6['preventDefault']?.(),
          event6['stopPropagation']?.(),
          handler(el6, !![]),
          focusElement(
            el6['querySelector']?.(SUBMENU_SELECTOR + ' .story-canvas-sync-option:not(:disabled)'),
          ),
          !![]
        );
      if (key) return ![];
      const list = Array['from'](
          el6['querySelectorAll']?.(SUBMENU_SELECTOR + ' .story-canvas-sync-option') || [],
        )['filter']((el7) => el7['disabled'] !== !![] && el7['getAttribute']?.('aria-disabled') !== 'true'),
        index = event6['target']?.['closest']?.('.story-canvas-sync-option') || event6['target'],
        count = list['indexOf'](index);
      if (['ArrowLeft', 'Escape']['includes'](event6['key']))
        return (
          event6['preventDefault']?.(),
          event6['stopPropagation']?.(),
          handler(el6, ![]),
          focusElement(el6['querySelector']?.(TRIGGER_SELECTOR)),
          !![]
        );
      if (count < 0 || !list['length']) return ![];
      let result = count;
      if (event6['key'] === 'ArrowDown') result = (count + 1) % list['length'];
      else {
        if (event6['key'] === 'ArrowUp') result = (count - 1 + list['length']) % list['length'];
        else {
          if (event6['key'] === 'Home') result = 0;
          else {
            if (event6['key'] === 'End') result = list['length'] - 1;
            else return ![];
          }
        }
      }
      return (event6['preventDefault']?.(), event6['stopPropagation']?.(), focusElement(list[result]), !![]);
    };
  return Object['freeze']({
    close: close,
    handleClick: handleClick,
    handleFocusIn: handleFocusIn,
    handleFocusOut: handleFocusOut,
    handleKeyDown: handleKeyDown,
    handlePointerOut: handlePointerOut,
    handlePointerOver: handlePointerOver,
  });
}

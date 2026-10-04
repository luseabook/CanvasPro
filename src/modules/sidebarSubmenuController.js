const sidebarSubmenus = new Map();
let activeKey = '',
  globalsInstalled = false;
function containsTarget(enabled, value) {
  return !!enabled && (enabled === value || enabled.contains?.(value));
}
function shouldIgnorePointerDown(item, key) {
  if (typeof item?.ignorePointerDown !== 'function') return false;
  return item.ignorePointerDown(key) === true;
}
function isEntryOpen(enabled2) {
  if (!enabled2) return false;
  if (typeof enabled2.isOpen === 'function') return enabled2.isOpen();
  return enabled2.panel?.classList?.contains(enabled2.openClass) === true;
}
function applyDefaultOpen(event) {
  (event.panel?.classList?.add(event.openClass),
    event.button?.classList?.add(event.activeClass),
    event.button?.setAttribute?.('aria-expanded', 'true'));
}
function applyDefaultClose(event2) {
  (event2.panel?.classList?.remove(event2.openClass),
    event2.button?.classList?.remove(event2.activeClass),
    event2.button?.setAttribute?.('aria-expanded', 'false'));
}
function closeEntry(event3) {
  if (!event3) return;
  if (typeof event3.close === 'function') event3.close();
  else applyDefaultClose(event3);
  (event3.button?.classList?.remove(event3.activeClass),
    event3.button?.setAttribute?.('aria-expanded', 'false'));
  if (activeKey === event3.key) activeKey = '';
}
function installGlobals() {
  if (globalsInstalled) return;
  ((globalsInstalled = true),
    document.addEventListener(
      'pointerdown',
      (event4) => {
        const event5 = sidebarSubmenus.get(activeKey);
        if (!event5) return;
        if (containsTarget(event5.button, event4.target)) return;
        if (containsTarget(event5.panel, event4.target)) return;
        if (shouldIgnorePointerDown(event5, event4)) return;
        closeEntry(event5);
      },
      true,
    ),
    document.addEventListener('keydown', (event6) => {
      if (event6.key !== 'Escape') return;
      const enabled3 = sidebarSubmenus.get(activeKey);
      if (!enabled3) return;
      closeEntry(enabled3);
    }));
}
export function closeSidebarSubmenu(index) {
  closeEntry(sidebarSubmenus.get(index));
}
export function closeAllSidebarSubmenus(result = '') {
  for (const [data, options] of sidebarSubmenus.entries()) {
    if (data !== result) closeEntry(options);
  }
}
export function openSidebarSubmenu(target) {
  const event7 = sidebarSubmenus.get(target);
  if (!event7) return;
  (closeAllSidebarSubmenus(target), (activeKey = target));
  if (typeof event7.open === 'function') event7.open();
  else applyDefaultOpen(event7);
  (event7.button?.classList?.add(event7.activeClass), event7.button?.setAttribute?.('aria-expanded', 'true'));
}
export function toggleSidebarSubmenu(source) {
  const enabled4 = sidebarSubmenus.get(source);
  if (!enabled4) return;
  if (activeKey === source && isEntryOpen(enabled4)) {
    closeEntry(enabled4);
    return;
  }
  openSidebarSubmenu(source);
}
export function registerSidebarSubmenu({
  key: key2,
  button: button,
  panel: panel,
  open: open,
  close: close,
  isOpen: isOpen,
  ignorePointerDown: ignorePointerDown,
  openClass: openClass = 'show',
  activeClass: activeClass = 'active',
} = {}) {
  if (!key2 || !button || !panel) return;
  installGlobals();
  const event8 = sidebarSubmenus.get(key2);
  event8?.button && event8.clickHandler && event8.button.removeEventListener?.('click', event8.clickHandler);
  event8?.button &&
    event8.dblClickHandler &&
    event8.button.removeEventListener?.('dblclick', event8.dblClickHandler);
  const next = {
    key: key2,
    button: button,
    panel: panel,
    open: open,
    close: close,
    isOpen: isOpen,
    ignorePointerDown: ignorePointerDown,
    openClass: openClass,
    activeClass: activeClass,
    clickHandler: null,
    dblClickHandler: null,
  };
  ((next.clickHandler = (event9) => {
    (event9.preventDefault(), event9.stopPropagation());
    if (Number(event9.detail || 0) > 1) return;
    toggleSidebarSubmenu(key2);
  }),
    (next.dblClickHandler = (event10) => {
      (event10.preventDefault(), event10.stopPropagation(), closeEntry(next));
    }),
    sidebarSubmenus.set(key2, next),
    button.setAttribute?.('aria-haspopup', 'menu'),
    button.setAttribute?.('aria-expanded', isEntryOpen(next) ? 'true' : 'false'),
    button.addEventListener('click', next.clickHandler),
    button.addEventListener('dblclick', next.dblClickHandler));
}

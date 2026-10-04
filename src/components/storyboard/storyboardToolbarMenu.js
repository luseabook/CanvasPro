function appendMenuIcon(el, value, item) {
  const el2 = document.createElement('span');
  try {
    const dom = new DOMParser().parseFromString(value, 'image/svg+xml'),
      key = dom.documentElement;
    key &&
      key.tagName &&
      key.tagName.toLowerCase() === 'svg' &&
      el2.appendChild(document.importNode(key, true));
  } catch {}
  const el3 = document.createElement('span');
  ((el3.textContent = item), el.appendChild(el2), el.appendChild(el3));
}
export function createStoryboardFloatingMenu(list, index) {
  const el4 = document.createElement('div');
  return (
    (el4.className = 'v2-canvas-ctx-menu v2-sb-dropdown'),
    list.forEach((item2) => {
      const el5 = document.createElement('div');
      ((el5.className = 'v2-menu-row'),
        item2.icon
          ? (el5.replaceChildren(), appendMenuIcon(el5, item2.icon, item2.label))
          : (el5.textContent = item2.label),
        (el5.onclick = (event) => {
          (event.stopPropagation(), item2.action(), index?.());
        }),
        el4.appendChild(el5));
    }),
    el4
  );
}
function positionFixedMenu(el6, el7) {
  const box = el7?.getBoundingClientRect?.() || { left: 0, top: 0, bottom: 0, width: 0 },
    result = Number(el6.offsetHeight) || 0;
  ((el6.style.left = box.left + 'px'), (el6.style.top = box.top - result - 8 + 'px'));
}
function positionToolbarMenu(el8, el9, el10) {
  const data = Number(el8.offsetWidth) || 0,
    options = Number(el8.offsetHeight) || 0,
    box2 = el10.getBoundingClientRect?.() || { left: 0, top: 0, right: 0, bottom: 0, width: 0 },
    box3 = el9.getBoundingClientRect?.() || box2,
    count =
      (typeof window !== 'undefined' ? Number(window.innerWidth) : 0) ||
      Number(document.documentElement?.clientWidth) ||
      0,
    target = 8;
  let source =
    (Number(el9.offsetLeft) || 0) + (Number(el9.offsetWidth) || Number(box3.width) || 0) / 2 - data / 2;
  if (count > 0 && Number.isFinite(box2.left)) {
    const next = box2.left + source,
      current = next + data;
    if (next < target) source += target - next;
    else current > count - target && (source -= current - (count - target));
  }
  const entry = Number(box2.top) >= options + target;
  ((el8.style.left = Math.max(0, Math.round(source)) + 'px'),
    entry
      ? ((el8.style.top = 'auto'), (el8.style.bottom = 'calc(100% + 8px)'))
      : ((el8.style.bottom = 'auto'), (el8.style.top = 'calc(100% + 8px)')));
}
export function mountStoryboardToolbarMenu(el11, el12) {
  const el13 = el12?.closest?.('.storyboard-toolbar') || null;
  if (!el13) return (document.body.appendChild(el11), positionFixedMenu(el11, el12), el11);
  return (
    el11.classList.add('storyboard-toolbar-menu'),
    el13.appendChild(el11),
    positionToolbarMenu(el11, el12, el13),
    el11
  );
}
export function closeStoryboardToolbarMenu({
  rootEl: rootEl,
  menuEl: menuEl,
  activeMenu: activeMenu,
  isCustomGridEditing: isCustomGridEditing = false,
  dismissHandler: dismissHandler = null,
  force: force = false,
} = {}) {
  if (!force && activeMenu === 'split-lines' && isCustomGridEditing)
    return { menuEl: menuEl, activeMenu: activeMenu, dismissHandler: dismissHandler, blocked: true };
  (menuEl?.__commitPending?.(), menuEl?.remove?.());
  if (activeMenu) {
    const el14 = rootEl?.querySelector?.('.act-' + activeMenu);
    if (el14) {
      !(activeMenu === 'split-lines' && isCustomGridEditing) && el14.classList.remove('active');
      const el15 = el14.querySelector('.ftb-chevron');
      if (el15) el15.style.transform = 'rotate(0deg)';
    }
  }
  return (
    dismissHandler && document.removeEventListener('pointerdown', dismissHandler),
    { menuEl: null, activeMenu: null, dismissHandler: null, blocked: false }
  );
}

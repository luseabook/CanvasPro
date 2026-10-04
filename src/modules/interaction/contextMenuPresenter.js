export function removeContextMenus({ includeNodePicker: includeNodePicker = true } = {}) {
  (document.querySelectorAll('.v2-canvas-ctx-menu').forEach((el) => el.remove()),
    includeNodePicker && document.querySelector('.v2-node-picker')?.remove());
}
function placeMenu(el2, value, item) {
  document.body.appendChild(el2);
  const key = el2.offsetWidth || 240,
    index = el2.offsetHeight || 200,
    result = value + key > window.innerWidth ? value - key : value,
    data = item + index > window.innerHeight ? item - index : item;
  ((el2.style.left = result + 'px'), (el2.style.top = data + 'px'));
}
function placeSubmenu(el3, el4) {
  const box = el4.getBoundingClientRect(),
    options = 214,
    target = box.right + 4 + options > window.innerWidth ? box.left - options - 4 : box.right + 4,
    source = Math.min(box.top, window.innerHeight - el3.offsetHeight - 8);
  ((el3.style.left = target + 'px'), (el3.style.top = source + 'px'));
}
function createSeparator(next) {
  const el5 = document.createElement('div');
  return ((el5.className = 'v2-menu-sep'), el5.addEventListener('mouseenter', next), el5);
}
function createMenuRow(enabled, { onActivate: onActivate, onEnter: onEnter }) {
  const enabled2 = Array.isArray(enabled.subItems) && enabled.subItems.length > 0,
    current = !!enabled.kbd,
    entry = String(enabled.desc || enabled.subtitle || '').trim(),
    el6 = document.createElement('div');
  el6.className = ['v2-menu-row', current || enabled2 ? 'v2-menu-row-split' : '', entry ? 'has-desc' : '']
    .filter(Boolean)
    .join(' ');
  const el7 = document.createElement('span');
  ((el7.className = [enabled2 ? 'v2-menu-rowlabel' : '', entry ? 'v2-menu-lbl' : '']
    .filter(Boolean)
    .join(' ')),
    (el7.textContent = enabled.label || ''));
  if (enabled.badge) {
    const el8 = document.createElement('span');
    ((el8.textContent = enabled.badge), (el8.className = 'v2-badge-beta'), el7.appendChild(el8));
  }
  if (entry) {
    const el9 = document.createElement('span');
    el9.className = 'v2-menu-txt-wrap';
    const el10 = document.createElement('span');
    ((el10.className = 'v2-menu-sub'),
      (el10.textContent = entry),
      el9.appendChild(el7),
      el9.appendChild(el10),
      el6.appendChild(el9));
  } else el6.appendChild(el7);
  if (enabled2) {
    const el11 = document.createElement('span');
    ((el11.textContent = '▶'), (el11.className = 'v2-menu-arrow v2-menu-arrow-ml8'), el6.appendChild(el11));
  } else {
    if (current) {
      const el12 = document.createElement('span');
      ((el12.className = 'v2-menu-kbd'), (el12.textContent = enabled.kbd), el6.appendChild(el12));
    }
  }
  return (
    el6.addEventListener('mouseenter', () => onEnter(el6, enabled)),
    !enabled2 &&
      el6.addEventListener('pointerdown', (event) => {
        (event.stopPropagation(), onActivate(enabled, event));
      }),
    el6
  );
}
function markSidebarSubmenuOwner(el13, record) {
  const payload = String(record || '').trim();
  if (payload) el13.dataset.sidebarSubmenuOwner = payload;
}
export function showContextMenu(handle, state, list, includeNodePicker2 = {}) {
  removeContextMenus({ includeNodePicker: includeNodePicker2.includeNodePicker !== false });
  const menu = document.createElement('div');
  ((menu.className = includeNodePicker2.className || 'v2-canvas-ctx-menu'),
    markSidebarSubmenuOwner(menu, includeNodePicker2.sidebarSubmenuOwner));
  const list2 = [],
    config = 180;
  let setTimeout2 = null;
  const run = () => {
      if (setTimeout2 === null) return;
      (clearTimeout(setTimeout2), (setTimeout2 = null));
    },
    handler = (scope = 0) => {
      run();
      for (let input = list2.length - 1; input >= scope; input--) {
        list2[input]?.remove();
      }
      list2.splice(scope);
    },
    handler2 = (output = 0) => {
      (run(),
        (setTimeout2 = setTimeout(() => {
          ((setTimeout2 = null), handler(output));
        }, config)));
    },
    handler3 = (enabled3) =>
      !!enabled3 && (menu.contains(enabled3) || list2.some((item2) => item2?.contains(enabled3))),
    close = () => {
      (run(), handler(0), menu.remove());
    },
    handler4 = (list3, value2, value3) => {
      handler(value3);
      const el14 = document.createElement('div');
      ((el14.className = 'v2-canvas-ctx-menu v2-submenu'),
        markSidebarSubmenuOwner(el14, includeNodePicker2.sidebarSubmenuOwner),
        el14.addEventListener('mouseenter', run),
        list3.forEach((item3) => {
          if (item3 === 'sep' || item3?.type === 'separator') {
            el14.appendChild(createSeparator(() => handler(value3 + 1)));
            return;
          }
          el14.appendChild(
            createMenuRow(item3, {
              onEnter: (value4, value5) => {
                Array.isArray(value5.subItems) && value5.subItems.length > 0
                  ? handler4(value5.subItems, value4, value3 + 1)
                  : handler(value3 + 1);
              },
              onActivate: (value6, value7) => {
                (close(), value6.action?.(value7));
              },
            }),
          );
        }),
        document.body.appendChild(el14),
        (list2[value3] = el14),
        placeSubmenu(el14, value2));
    };
  (list.forEach((item4) => {
    if (item4 === 'sep' || item4?.type === 'separator') {
      menu.appendChild(createSeparator(() => handler(0)));
      return;
    }
    menu.appendChild(
      createMenuRow(item4, {
        onEnter: (value8, value9) => {
          Array.isArray(value9.subItems) && value9.subItems.length > 0
            ? handler4(value9.subItems, value8, 0)
            : handler(0);
        },
        onActivate: (value10, value11) => {
          (close(), value10.action?.(value11));
        },
      }),
    );
  }),
    menu.addEventListener('mouseenter', run),
    menu.addEventListener('mouseleave', (value12) => {
      !handler3(value12.relatedTarget) && handler2(0);
    }),
    placeMenu(menu, handle, state));
  const value13 = (event2) => {
    const enabled4 = menu.contains(event2.target) || list2.some((item5) => item5?.contains(event2.target));
    !enabled4 && (close(), document.removeEventListener('pointerdown', value13, true));
  };
  return (
    requestAnimationFrame(() => document.addEventListener('pointerdown', value13, true)),
    { menu: menu, close: close }
  );
}

import { positionAnchoredSubmenu } from '../../utils/submenuPosition.js';
function resolveCanvasViewportTop(value, el = globalThis.document) {
  const item = Number(value);
  if (Number.isFinite(item)) return Math.max(0, item);
  const box = el?.querySelector?.('.v2-canvas-stage')?.getBoundingClientRect?.();
  return Number.isFinite(Number(box?.top)) ? Math.max(0, Number(box.top)) : 0;
}
export function appendToolbarActionMenuTitle(el2, key) {
  const el3 = document.createElement('div');
  return (
    (el3.className = 'node-toolbar-action-menu-title'),
    (el3.textContent = key),
    el2.appendChild(el3),
    el3
  );
}
export function createToolbarActionMenuItem(index = '') {
  const result = document.createElement('div');
  return ((result.className = ['node-toolbar-action-menu-item', index].filter(Boolean).join(' ')), result);
}
export function createToolbarActionMenuIcon() {
  const data = document.createElement('div');
  return ((data.className = 'node-toolbar-action-menu-icon'), data);
}
export function createRunningHubActionIcon() {
  const el4 = createToolbarActionMenuIcon(),
    options = document.createElement('img');
  return (
    (options.className = 'node-toolbar-action-provider-logo'),
    (options.src = 'images/RH.png'),
    (options.alt = 'runninghub'),
    el4.appendChild(options),
    el4
  );
}
export function createToolbarActionMenuBody() {
  const target = document.createElement('div');
  return ((target.className = 'node-toolbar-action-menu-body'), target);
}
export function createToolbarActionTitleRow() {
  const source = document.createElement('div');
  return ((source.className = 'node-toolbar-action-title-row'), source);
}
export function createToolbarActionTitle(next) {
  const el5 = document.createElement('span');
  return ((el5.className = 'node-toolbar-action-menu-item-title'), (el5.textContent = next), el5);
}
export function createToolbarActionDescription(current) {
  const el6 = document.createElement('span');
  return ((el6.className = 'node-toolbar-action-menu-item-desc'), (el6.textContent = current), el6);
}
export function createToolbarActionVipBadge(entry = 'VIP') {
  const el7 = document.createElement('span');
  return ((el7.className = 'node-toolbar-action-vip-badge'), (el7.textContent = entry), el7);
}
export function createToolbarActionPopupAnchorPositionGetter(el8, record = {}) {
  const payload = Number.isFinite(Number(record.gap)) ? Number(record.gap) : 12,
    handler = (el9) => {
      const box2 = el9?.getBoundingClientRect?.();
      if (!box2) return null;
      const width2 = Number(box2.width) || 0,
        height2 = Number(box2.height) || 0;
      return {
        left: Number(box2.left) || 0,
        top: Number(box2.top) || 0,
        width: width2,
        height: height2,
        right: Number(box2.right) || (Number(box2.left) || 0) + width2,
        bottom: Number(box2.bottom) || (Number(box2.top) || 0) + height2,
      };
    },
    handler2 = (box3) => Boolean(box3 && box3.width > 0 && box3.height > 0),
    handler3 = () => handler(el8?.closest?.('.v2-img-toolbar-more-menu')),
    handler4 = () => handler(el8),
    handle = () => {
      const left2 = handler4() || { left: 0, top: 0, width: 0, height: 0 },
        box4 = handler3();
      return {
        left: left2.left + left2.width / 2,
        top: (handler2(box4) ? box4.top : left2.top) - payload,
      };
    };
  return ((handle.hasVisibleAnchor = () => handler2(handler4())), handle);
}
export function positionToolbarActionSubmenu(
  el10,
  submenu,
  {
    gap: gap = 12,
    viewportInset: viewportInset = 8,
    viewportTop: viewportTop,
    windowObject: windowObject = globalThis.window,
  } = {},
) {
  const anchorRect = el10?.getBoundingClientRect?.();
  if (!anchorRect || anchorRect.width <= 0 || anchorRect.height <= 0) return null;
  return (
    (submenu.style.transform = 'translate(0, 0)'),
    positionAnchoredSubmenu({
      submenu: submenu,
      anchorRect: anchorRect,
      preferredSide: 'right',
      position: 'fixed',
      gap,
      viewportMargin: viewportInset,
      viewportWidth: windowObject?.innerWidth,
      viewportHeight: windowObject?.innerHeight,
      viewportTop: resolveCanvasViewportTop(viewportTop),
    })
  );
}
export function positionToolbarActionSubmenuAbove(
  box5,
  submenu2,
  {
    viewportInset: viewportInset = 8,
    viewportTop: viewportTop2,
    windowObject: windowObject = globalThis.window,
  } = {},
) {
  const left3 = Number(box5?.left) || 0,
    top2 = Number(box5?.top) || 0;
  return (
    (submenu2.style.transform = 'translate(0, 0)'),
    positionAnchoredSubmenu({
      submenu: submenu2,
      anchorRect: {
        left: left3,
        right: left3,
        top: top2,
        bottom: top2,
        width: 0,
        height: 0,
      },
      horizontalPlacement: 'center',
      verticalPlacement: 'above',
      position: 'fixed',
      viewportMargin: viewportInset,
      viewportWidth: windowObject?.innerWidth,
      viewportHeight: windowObject?.innerHeight,
      viewportTop: resolveCanvasViewportTop(viewportTop2),
    })
  );
}

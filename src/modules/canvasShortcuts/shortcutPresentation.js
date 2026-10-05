import { createNodeCreationMenuIcon } from '../nodeCreationMenuIcons.js';
import { getNodeCreationMenuItem } from '../nodeCreationMenuCatalog.js';
export function element(value, item = '', key = '') {
  const el = document['createElement'](value);
  el['className'] = item;
  if (key) el['textContent'] = key;
  return el;
}
export function createShortcutCard(error, { preview: preview = ![] } = {}) {
  const el2 = element(preview ? 'div' : 'button', 'canvas-shortcut-card v2-menu-row has-desc');
  !preview &&
    ((el2['type'] = 'button'),
    (el2['dataset']['shortcutId'] = error['id']),
    el2['setAttribute']('aria-label', error['name']));
  const element2 = element('span', 'canvas-shortcut-icon v2-menu-ico is-' + error['icon']);
  if (error['cover']) {
    const element3 = element('img');
    ((element3['src'] = error['cover']), (element3['alt'] = ''), element2['append'](element3));
  } else {
    const nodeCreationMenuIcon = createNodeCreationMenuIcon(
      error['icon'] === 'template' ? 'storyboard-script' : 'ai-' + error['icon'],
    );
    if (nodeCreationMenuIcon) element2['append'](nodeCreationMenuIcon);
  }
  const element4 = element('span', 'v2-menu-txt-wrap'),
    element5 = element('span', 'v2-menu-lbl');
  element5['append'](element('span', 'canvas-shortcut-name', error['name'] || '快捷方式名称'));
  if (error['badge']) element5['append'](element('span', 'canvas-shortcut-badge', error['badge']));
  const index =
    error['subtitle']?.['trim']() ||
    (error['action']['kind'] === 'node'
      ? getNodeCreationMenuItem(error['action']['nodeType'])?.['subtitle']
      : '添加预设节点和连线');
  return (
    element4['append'](element5, element('span', 'v2-menu-sub canvas-shortcut-description', index)),
    el2['append'](element2, element4),
    el2
  );
}

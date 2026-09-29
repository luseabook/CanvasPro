import { createNodeCreationMenuIcon } from '../nodeCreationMenuIcons.js';
import { getNodeCreationMenuItem } from '../nodeCreationMenuCatalog.js';
export function element(_0x316e91, _0x31cf86 = '', _0x58b50c = '') {
  const _0x265427 = document['createElement'](_0x316e91);
  _0x265427['className'] = _0x31cf86;
  if (_0x58b50c) _0x265427['textContent'] = _0x58b50c;
  return _0x265427;
}
export function createShortcutCard(_0x5832e6, { preview: preview = ![] } = {}) {
  const _0x88fb56 = element(preview ? 'div' : 'button', 'canvas-shortcut-card\x20v2-menu-row\x20has-desc');
  !preview &&
    ((_0x88fb56['type'] = 'button'),
    (_0x88fb56['dataset']['shortcutId'] = _0x5832e6['id']),
    _0x88fb56['setAttribute']('aria-label', _0x5832e6['name']));
  const _0x576c08 = element('span', 'canvas-shortcut-icon v2-menu-ico is-' + _0x5832e6['icon']);
  if (_0x5832e6['cover']) {
    const _0x162eff = element('img');
    ((_0x162eff['src'] = _0x5832e6['cover']), (_0x162eff['alt'] = ''), _0x576c08['append'](_0x162eff));
  } else {
    const _0x434859 = createNodeCreationMenuIcon(
      _0x5832e6['icon'] === 'template' ? 'storyboard-script' : 'ai-' + _0x5832e6['icon'],
    );
    if (_0x434859) _0x576c08['append'](_0x434859);
  }
  const _0x40bb94 = element('span', 'v2-menu-txt-wrap'),
    _0x471417 = element('span', 'v2-menu-lbl');
  _0x471417['append'](element('span', 'canvas-shortcut-name', _0x5832e6['name'] || '快捷方式名称'));
  if (_0x5832e6['badge']) _0x471417['append'](element('span', 'canvas-shortcut-badge', _0x5832e6['badge']));
  const _0x75998f =
    _0x5832e6['subtitle']?.['trim']() ||
    (_0x5832e6['action']['kind'] === 'node'
      ? getNodeCreationMenuItem(_0x5832e6['action']['nodeType'])?.['subtitle']
      : '添加预设节点和连线');
  return (
    _0x40bb94['append'](_0x471417, element('span', 'v2-menu-sub canvas-shortcut-description', _0x75998f)),
    _0x88fb56['append'](_0x576c08, _0x40bb94),
    _0x88fb56
  );
}

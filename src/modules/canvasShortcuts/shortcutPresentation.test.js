import test from 'node:test';
import assert from 'node:assert/strict';

import { createShortcutCard, element } from './shortcutPresentation.js';
import { getNodeCreationMenuItem } from '../nodeCreationMenuCatalog.js';

function createElement(tag) {
  return {
    tagName: String(tag).toUpperCase(),
    className: '',
    textContent: '',
    children: [],
    dataset: {},
    attributes: {},
    type: '',
    src: '',
    alt: '',
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    append(...items) {
      this.children.push(...items);
    },
    appendChild(item) {
      this.children.push(item);
      return item;
    },
  };
}

test.before(() => {
  globalThis.document = { createElement };
});
test.after(() => {
  delete globalThis.document;
});

const BASE_SHORTCUT = {
  id: 'sc-1',
  icon: 'image',
  name: '图像',
  action: { kind: 'node', nodeType: 'ai-image' },
};

test('shortcutPresentation: element 会带类名，空文本不写字', () => {
  const node = element('div', 'a b', '');
  assert.equal(node.tagName, 'DIV');
  assert.equal(node.className, 'a b');
  assert.equal(node.textContent, '');

  const labeled = element('span', 'c', '文字');
  assert.equal(labeled.textContent, '文字');
});

test('shortcutPresentation: 快捷卡默认是按钮，带 id 与无障碍标签', () => {
  const card = createShortcutCard(BASE_SHORTCUT);
  assert.equal(card.tagName, 'BUTTON');
  assert.equal(card.className, 'canvas-shortcut-card v2-menu-row has-desc');
  assert.equal(card.type, 'button');
  assert.equal(card.dataset.shortcutId, 'sc-1');
  assert.equal(card.attributes['aria-label'], '图像');
  assert.deepEqual(
    card.children.map((node) => node.className),
    ['canvas-shortcut-icon v2-menu-ico is-image', 'v2-menu-txt-wrap'],
  );
});

test('shortcutPresentation: preview 模式换成 div，不写交互属性', () => {
  const card = createShortcutCard(BASE_SHORTCUT, { preview: true });
  assert.equal(card.tagName, 'DIV');
  assert.equal(card.type, '');
  assert.equal(card.dataset.shortcutId, undefined);
  assert.equal(card.attributes['aria-label'], undefined);
});

test('shortcutPresentation: 名称缺失落到占位，徽标可叠加', () => {
  const plain = createShortcutCard({ id: 'x', icon: 'image', action: { kind: 'other' } });
  const label = plain.children[1].children[0];
  assert.equal(label.children[0].textContent, '快捷方式名称');

  const withBadge = createShortcutCard({ ...BASE_SHORTCUT, badge: 'NEW', name: '图像' });
  const badgeLabel = withBadge.children[1].children[0];
  assert.deepEqual(
    badgeLabel.children.map((node) => node.className),
    ['canvas-shortcut-name', 'canvas-shortcut-badge'],
  );
  assert.equal(badgeLabel.children[1].textContent, 'NEW');
});

test('shortcutPresentation: 描述优先级是自带副标题 > 节点目录副标题 > 兜底文案', () => {
  const custom = createShortcutCard({ ...BASE_SHORTCUT, subtitle: '  自己的说明  ' });
  assert.equal(custom.children[1].children[1].textContent, '自己的说明');

  const fromCatalog = createShortcutCard(BASE_SHORTCUT);
  assert.equal(fromCatalog.children[1].children[1].textContent, getNodeCreationMenuItem('ai-image').subtitle);
  assert.equal(fromCatalog.children[1].children[1].textContent, '图片、海报、角色素材');

  const fallback = createShortcutCard({ id: 'y', icon: 'image', name: 'n', action: { kind: 'other' } });
  assert.equal(fallback.children[1].children[1].textContent, '添加预设节点和连线');
});

test('shortcutPresentation: cover 走 img，图标键会把 template 映射到分镜脚本', () => {
  const withCover = createShortcutCard({ ...BASE_SHORTCUT, cover: 'http://x/c.png' });
  const iconSpan = withCover.children[0];
  assert.equal(iconSpan.children.length, 1);
  assert.equal(iconSpan.children[0].src, 'http://x/c.png');
  assert.equal(iconSpan.children[0].alt, '');

  const noIcon = createShortcutCard(BASE_SHORTCUT);
  assert.equal(noIcon.children[0].children.length, 0, '本仓图标目录没有对应键，跳过即可');
});

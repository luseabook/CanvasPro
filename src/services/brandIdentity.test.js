import test from 'node:test';
import assert from 'node:assert/strict';

import { applyBrandIdentity, safeExternalUrl } from './brandIdentity.js';

/** 最小假 DOM：只实现被测函数用到的接口（节点树 + 选择器 + dataset），不引 jsdom。 */
function createFakeDom() {
  const node = (attrs = {}, children = []) => ({
    dataset: { ...attrs.dataset },
    textContent: attrs.textContent ?? '',
    src: attrs.src ?? '',
    attrs,
    children,
    querySelector(selector) {
      if (selector.startsWith('[') && selector.includes('=')) {
        const [name, value] = selector.slice(1, -1).split('=');
        const wanted = value.replace(/^["']|["']$/g, '');
        return children.find((child) => child.attrs[name] === wanted) || null;
      }
      const name = selector.slice(1, -1);
      return children.find((child) => name in child.attrs) || null;
    },
    getElementById() {
      return null;
    },
  });

  const author = node({ 'data-brand-author': 'true' }, []);
  const label = node({ 'data-i18n': 'about.bilibili' }, []);
  const button = node({ 'data-brand-about-link': 'true' }, [label]);
  const footer = node({ 'data-product-name-footer': 'true' }, []);
  const desc = node({ 'data-brand-feedback-desc': 'true' }, []);
  const qr = node({}, []);
  const root = node({}, [author, button, footer, desc, qr]);
  root.getElementById = (id) => (id === 'feedbackGroupQrImage' ? qr : null);
  return { root, author, button, label, footer, desc, qr };
}

test('safeExternalUrl accepts plain http(s) links only', () => {
  assert.equal(safeExternalUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(safeExternalUrl('http://example.com/a'), 'http://example.com/a');
  for (const value of [
    '', '  ', null, undefined, 42,
    'javascript:alert(1)', 'data:text/html,x', 'ftp://example.com',
    'https://user:pw@example.com', 'not a url',
  ]) {
    assert.equal(safeExternalUrl(value), '', `应拒绝: ${String(value)}`);
  }
});

test('applyBrandIdentity rewrites the author credit', () => {
  const dom = createFakeDom();
  applyBrandIdentity(dom.root, { author: 'Canvas 团队' });
  assert.equal(dom.author.textContent, 'Canvas 团队');
});

test('applyBrandIdentity leaves built-in copy untouched when nothing is configured', () => {
  const dom = createFakeDom();
  dom.author.textContent = '阿硕';
  applyBrandIdentity(dom.root, {});
  assert.equal(dom.author.textContent, '阿硕');
  assert.equal(dom.footer.textContent, '');
  assert.equal(dom.button.dataset.externalUrl, undefined);
});

test('applyBrandIdentity swaps the about link and its label', () => {
  const dom = createFakeDom();
  applyBrandIdentity(dom.root, {
    aboutLinks: [{ label: '官网', url: 'https://canvas.example.com' }],
  });
  assert.equal(dom.button.dataset.externalUrl, 'https://canvas.example.com');
  assert.equal(dom.label.textContent, '官网');
});

test('applyBrandIdentity skips unsafe about links', () => {
  const dom = createFakeDom();
  applyBrandIdentity(dom.root, {
    aboutLinks: [
      { label: '坏链', url: 'javascript:alert(1)' },
      { label: '好链', url: 'https://ok.example.com' },
    ],
  });
  assert.equal(dom.button.dataset.externalUrl, 'https://ok.example.com');
  assert.equal(dom.label.textContent, '好链');
});

test('applyBrandIdentity updates the footer and the feedback group', () => {
  const dom = createFakeDom();
  applyBrandIdentity(dom.root, {
    footer: '© 2026 Canvas Studio',
    feedbackQrUrl: 'https://cdn.example.com/qr.png',
    feedbackWechat: 'canvas_support',
  });
  assert.equal(dom.footer.textContent, '© 2026 Canvas Studio');
  assert.equal(dom.qr.src, 'https://cdn.example.com/qr.png');
  assert.equal(dom.desc.textContent, '如果失效请加:canvas_support 备注来意');
});

test('applyBrandIdentity ignores a malformed brand object', () => {
  const dom = createFakeDom();
  dom.author.textContent = '阿硕';
  for (const brand of [null, undefined, 'x', 42, []]) {
    applyBrandIdentity(dom.root, brand);
    assert.equal(dom.author.textContent, '阿硕');
  }
});

test('applyBrandIdentity tolerates a missing root', () => {
  for (const root of [null, undefined, {}]) {
    applyBrandIdentity(root, { author: 'X' });
  }
});

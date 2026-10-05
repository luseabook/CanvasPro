import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTooltipPosition,
  installTooltipUnifier,
  unifyNativeTooltipElement,
  unifyNativeTooltips,
} from './tooltipUnifier.js';
function createFakeClassList() {
  const map = new Set();
  return {
    add(value) {
      map.add(value);
    },
    remove(item) {
      map.delete(item);
    },
    contains(key) {
      return map.has(key);
    },
    toggle(index, enabled) {
      const result = enabled === undefined ? !map.has(index) : !!enabled;
      if (result) map.add(index);
      else map.delete(index);
      return result;
    },
  };
}
function createFakeElement(tagName = 'button', data = {}, children = []) {
  const map2 = new Map(Object.entries(data));
  return {
    nodeType: 1,
    tagName: tagName,
    children: children,
    hasAttribute(options) {
      return map2.has(options);
    },
    getAttribute(target) {
      return map2.has(target) ? map2.get(target) : null;
    },
    contains(source) {
      if (source === this) return true;
      const next = (el) => {
        if (el === source) return true;
        return el?.children?.some?.(next) || false;
      };
      return this.children?.some?.(next) || false;
    },
    closest(current) {
      if (current === '.generation-node-help-tip' && this.classList?.contains?.('generation-node-help-tip'))
        return this;
      return null;
    },
    setAttribute(entry, record) {
      map2.set(entry, String(record));
    },
    removeAttribute(payload) {
      map2.delete(payload);
    },
    querySelectorAll(handle) {
      if (handle !== '[title]') return [];
      const list = [],
        item2 = (el2) => {
          if (el2?.nodeType !== 1) return;
          if (el2.hasAttribute('title')) list.push(el2);
          el2.children?.forEach(item2);
        };
      return (this.children.forEach(item2), list);
    },
  };
}
function createFakeDocument() {
  const map3 = new Map(),
    map4 = new Map(),
    children2 = [],
    documentElement = {
      nodeType: 1,
      tagName: 'html',
      classList: createFakeClassList(),
      contains(state) {
        return state === this || state === body || children2.includes(state);
      },
    },
    body = {
      nodeType: 1,
      tagName: 'body',
      children: children2,
      appendChild(el3) {
        return (children2.push(el3), (el3.parentElement = body), (el3.isConnected = true), el3);
      },
    },
    createElement = (config = 'div') => {
      const el4 = createFakeElement(config);
      return (
        (el4.children = []),
        (el4.classList = createFakeClassList()),
        (el4.style = {}),
        (el4.dataset = {}),
        (el4.hidden = false),
        (el4.isConnected = false),
        (el4.appendChild = (el5) => {
          return (el4.children.push(el5), (el5.parentElement = el4), (el5.isConnected = true), el5);
        }),
        (el4.remove = () => {
          const count = children2.indexOf(el4);
          if (count >= 0) children2.splice(count, 1);
          el4.isConnected = false;
        }),
        (el4.getBoundingClientRect = () => ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 30,
          width: 100,
          height: 30,
        })),
        el4
      );
    },
    handler = (map5, scope, input) => {
      if (!map5.has(scope)) map5.set(scope, new Set());
      map5.get(scope).add(input);
    },
    handler2 = (map6, output, value2) => {
      map6.get(output)?.delete(value2);
    };
  return {
    documentElement: documentElement,
    body: body,
    defaultView: {
      innerWidth: 800,
      innerHeight: 600,
      addEventListener(value3, value4) {
        handler(map4, value3, value4);
      },
      removeEventListener(value5, value6) {
        handler2(map4, value5, value6);
      },
    },
    createElement: createElement,
    querySelectorAll() {
      return [];
    },
    addEventListener(value7, value8) {
      handler(map3, value7, value8);
    },
    removeEventListener(value9, value10) {
      handler2(map3, value9, value10);
    },
    emit(value11, value12) {
      map3.get(value11)?.forEach((handler3) => handler3(value12));
    },
    listenerCount(value13) {
      return map3.get(value13)?.size || 0;
    },
    windowListenerCount(value14) {
      return map4.get(value14)?.size || 0;
    },
  };
}
(test('unifyNativeTooltipElement migrates title to unified tooltip', () => {
  const fakeElement = createFakeElement('button', { title: '生成' });
  (assert.equal(unifyNativeTooltipElement(fakeElement), true),
    assert.equal(fakeElement.hasAttribute('title'), false),
    assert.equal(fakeElement.getAttribute('data-tooltip'), '生成'),
    assert.equal(fakeElement.getAttribute('data-native-title'), '生成'),
    assert.equal(fakeElement.getAttribute('data-tooltip-source'), 'native-title'),
    assert.equal(fakeElement.getAttribute('aria-label'), '生成'));
}),
  test('unifyNativeTooltipElement keeps existing custom tooltip', () => {
    const fakeElement2 = createFakeElement('button', { title: '旧提示', 'data-tooltip': '当前提示' });
    (unifyNativeTooltipElement(fakeElement2),
      assert.equal(fakeElement2.hasAttribute('title'), false),
      assert.equal(fakeElement2.getAttribute('data-tooltip'), '当前提示'),
      assert.equal(fakeElement2.getAttribute('data-native-title'), '旧提示'),
      assert.equal(fakeElement2.getAttribute('data-tooltip-source'), null));
  }),
  test('unifyNativeTooltipElement updates and clears generated tooltips', () => {
    const el6 = createFakeElement('div', { title: '初始' });
    (unifyNativeTooltipElement(el6),
      el6.setAttribute('title', '更新'),
      unifyNativeTooltipElement(el6),
      assert.equal(el6.getAttribute('data-tooltip'), '更新'),
      el6.setAttribute('title', ''),
      unifyNativeTooltipElement(el6),
      assert.equal(el6.getAttribute('data-tooltip'), null),
      assert.equal(el6.getAttribute('data-tooltip-source'), null),
      assert.equal(el6.getAttribute('data-native-title'), null));
  }),
  test('unifyNativeTooltips normalizes root and descendants', () => {
    const fakeElement3 = createFakeElement('div', { title: '子项' }),
      fakeElement4 = createFakeElement('div', { title: '根' }, [fakeElement3]);
    (assert.equal(unifyNativeTooltips(fakeElement4), 2),
      assert.equal(fakeElement4.getAttribute('data-tooltip'), '根'),
      assert.equal(fakeElement3.getAttribute('data-tooltip'), '子项'));
  }),
  test('computeTooltipPosition positions top tooltips and clamps near edges', () => {
    const box = computeTooltipPosition(
      { left: 100, top: 100, right: 140, bottom: 124, width: 40, height: 24 },
      { width: 80, height: 30 },
      { width: 400, height: 300 },
      'top',
    );
    (assert.equal(box.placement, 'top'),
      assert.equal(box.left, 80),
      assert.equal(box.top, 58),
      assert.equal(box.arrowLeft, 40));
    const box2 = computeTooltipPosition(
      { left: 0, top: 90, right: 20, bottom: 110, width: 20, height: 20 },
      { width: 120, height: 30 },
      { width: 300, height: 240 },
      'top',
    );
    (assert.equal(box2.left, 8), assert.equal(box2.arrowLeft, 12));
  }),
  test('computeTooltipPosition flips top tooltips below when there is room', () => {
    const box3 = computeTooltipPosition(
      { left: 100, top: 6, right: 140, bottom: 26, width: 40, height: 20 },
      { width: 80, height: 30 },
      { width: 300, height: 240 },
      'top',
    );
    (assert.equal(box3.placement, 'bottom'), assert.equal(box3.top, 38));
  }),
  test('computeTooltipPosition supports right tooltips and left fallback', () => {
    const box4 = computeTooltipPosition(
      { left: 40, top: 80, right: 64, bottom: 104, width: 24, height: 24 },
      { width: 90, height: 40 },
      { width: 300, height: 220 },
      'right',
    );
    (assert.equal(box4.placement, 'right'),
      assert.equal(box4.left, 76),
      assert.equal(box4.top, 72),
      assert.equal(box4.arrowTop, 20));
    const box5 = computeTooltipPosition(
      { left: 260, top: 80, right: 284, bottom: 104, width: 24, height: 24 },
      { width: 90, height: 40 },
      { width: 300, height: 220 },
      'right',
    );
    (assert.equal(box5.placement, 'left'), assert.equal(box5.left, 158));
  }),
  test('installTooltipUnifier ignores empty tooltip text and cleans up listeners', () => {
    const dom = createFakeDocument(),
      handler4 = installTooltipUnifier(dom);
    (assert.equal(dom.documentElement.classList.contains('has-global-tooltip-portal'), true),
      assert.equal(dom.listenerCount('pointerover') > 0, true),
      assert.equal(dom.windowListenerCount('resize') > 0, true));
    const target2 = createFakeElement('button', { 'data-tooltip': ' ' });
    (dom.emit('focusin', { target: target2 }),
      assert.equal(dom.body.children.length, 0),
      handler4(),
      assert.equal(dom.documentElement.classList.contains('has-global-tooltip-portal'), false),
      assert.equal(dom.listenerCount('pointerover'), 0),
      assert.equal(dom.windowListenerCount('resize'), 0));
  }),
  test('installTooltipUnifier renders non-empty tooltips into a body portal', () => {
    const dom2 = createFakeDocument(),
      handler5 = installTooltipUnifier(dom2),
      target3 = createFakeElement('button', { 'data-tooltip': '裁剪视频' });
    ((target3.getBoundingClientRect = () => ({
      left: 100,
      top: 120,
      right: 138,
      bottom: 158,
      width: 38,
      height: 38,
    })),
      (dom2.documentElement.contains = (value15) =>
        value15 === target3 || value15 === dom2.documentElement || dom2.body.children.includes(value15)),
      dom2.emit('pointerover', { target: target3 }),
      assert.equal(dom2.body.children.length, 1),
      assert.equal(dom2.body.children[0].hidden, false),
      assert.equal(dom2.body.children[0].textContent, '裁剪视频'),
      handler5(),
      assert.equal(dom2.body.children.length, 0));
  }),
  test('installTooltipUnifier does not duplicate generation node help portals', () => {
    const dom3 = createFakeDocument(),
      handler6 = installTooltipUnifier(dom3),
      target4 = createFakeElement('button', { 'data-tooltip': '进阶声音克隆用法' });
    ((target4.classList = createFakeClassList()),
      target4.classList.add('generation-node-help-tip'),
      dom3.emit('pointerover', { target: target4 }),
      assert.equal(dom3.body.children.length, 0),
      handler6());
  }));

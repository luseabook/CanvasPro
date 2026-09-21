import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTooltipPosition,
  installTooltipUnifier,
  unifyNativeTooltipElement,
  unifyNativeTooltips,
} from './tooltipUnifier.js';
function createFakeClassList() {
  const _0x2c5203 = new Set();
  return {
    add(_0x1affda) {
      _0x2c5203.add(_0x1affda);
    },
    remove(_0x51bf86) {
      _0x2c5203.delete(_0x51bf86);
    },
    contains(_0x591d4b) {
      return _0x2c5203.has(_0x591d4b);
    },
    toggle(_0x1ee1d7, _0x3d5d75) {
      const _0x25c24c = _0x3d5d75 === undefined ? !_0x2c5203.has(_0x1ee1d7) : !!_0x3d5d75;
      if (_0x25c24c) _0x2c5203.add(_0x1ee1d7);
      else _0x2c5203.delete(_0x1ee1d7);
      return _0x25c24c;
    },
  };
}
function createFakeElement(_0x36c743 = 'button', _0x2b4fea = {}, _0x12007c = []) {
  const _0x18817e = new Map(Object.entries(_0x2b4fea));
  return {
    nodeType: 1,
    tagName: _0x36c743,
    children: _0x12007c,
    hasAttribute(_0x302847) {
      return _0x18817e.has(_0x302847);
    },
    getAttribute(_0x23124a) {
      return _0x18817e.has(_0x23124a) ? _0x18817e.get(_0x23124a) : null;
    },
    contains(_0x4f2d23) {
      if (_0x4f2d23 === this) return true;
      const _0x541d55 = (_0x276c1d) => {
        if (_0x276c1d === _0x4f2d23) return true;
        return _0x276c1d?.children?.some?.(_0x541d55) || false;
      };
      return this.children?.some?.(_0x541d55) || false;
    },
    closest(_0x152922) {
      if (_0x152922 === '.generation-node-help-tip' && this.classList?.contains?.('generation-node-help-tip'))
        return this;
      return null;
    },
    setAttribute(_0xde4bd6, _0x235a0a) {
      _0x18817e.set(_0xde4bd6, String(_0x235a0a));
    },
    removeAttribute(_0x4a3f65) {
      _0x18817e.delete(_0x4a3f65);
    },
    querySelectorAll(_0x460a10) {
      if (_0x460a10 !== '[title]') return [];
      const _0x2b2e3a = [],
        _0x5f5043 = (_0x568ddb) => {
          if (_0x568ddb?.nodeType !== 1) return;
          if (_0x568ddb.hasAttribute('title')) _0x2b2e3a.push(_0x568ddb);
          _0x568ddb.children?.forEach(_0x5f5043);
        };
      return (this.children.forEach(_0x5f5043), _0x2b2e3a);
    },
  };
}
function createFakeDocument() {
  const _0x10d4e1 = new Map(),
    _0x4d0bc6 = new Map(),
    _0x3fbfe0 = [],
    _0x425c3e = {
      nodeType: 1,
      tagName: 'html',
      classList: createFakeClassList(),
      contains(_0x189806) {
        return _0x189806 === this || _0x189806 === _0x1a5e75 || _0x3fbfe0.includes(_0x189806);
      },
    },
    _0x1a5e75 = {
      nodeType: 1,
      tagName: 'body',
      children: _0x3fbfe0,
      appendChild(_0x458e1a) {
        return (
          _0x3fbfe0.push(_0x458e1a),
          (_0x458e1a.parentElement = _0x1a5e75),
          (_0x458e1a.isConnected = true),
          _0x458e1a
        );
      },
    },
    _0x462f59 = (_0x783aa4 = 'div') => {
      const _0x387590 = createFakeElement(_0x783aa4);
      return (
        (_0x387590.children = []),
        (_0x387590.classList = createFakeClassList()),
        (_0x387590.style = {}),
        (_0x387590.dataset = {}),
        (_0x387590.hidden = false),
        (_0x387590.isConnected = false),
        (_0x387590.appendChild = (_0xc1aeb2) => {
          return (
            _0x387590.children.push(_0xc1aeb2),
            (_0xc1aeb2.parentElement = _0x387590),
            (_0xc1aeb2.isConnected = true),
            _0xc1aeb2
          );
        }),
        (_0x387590.remove = () => {
          const _0x191976 = _0x3fbfe0.indexOf(_0x387590);
          if (_0x191976 >= 0) _0x3fbfe0.splice(_0x191976, 1);
          _0x387590.isConnected = false;
        }),
        (_0x387590.getBoundingClientRect = () => ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 30,
          width: 100,
          height: 30,
        })),
        _0x387590
      );
    },
    _0x3e8522 = (_0xe779e4, _0x5c443a, _0x5241b2) => {
      if (!_0xe779e4.has(_0x5c443a)) _0xe779e4.set(_0x5c443a, new Set());
      _0xe779e4.get(_0x5c443a).add(_0x5241b2);
    },
    _0x49cbb3 = (_0x3297ed, _0xd73445, _0xc567a9) => {
      _0x3297ed.get(_0xd73445)?.delete(_0xc567a9);
    };
  return {
    documentElement: _0x425c3e,
    body: _0x1a5e75,
    defaultView: {
      innerWidth: 0x320,
      innerHeight: 0x258,
      addEventListener(_0x238f6c, _0x51c9e1) {
        _0x3e8522(_0x4d0bc6, _0x238f6c, _0x51c9e1);
      },
      removeEventListener(_0xb06214, _0x254190) {
        _0x49cbb3(_0x4d0bc6, _0xb06214, _0x254190);
      },
    },
    createElement: _0x462f59,
    querySelectorAll() {
      return [];
    },
    addEventListener(_0x388d85, _0x3cd512) {
      _0x3e8522(_0x10d4e1, _0x388d85, _0x3cd512);
    },
    removeEventListener(_0x3d71a5, _0x275071) {
      _0x49cbb3(_0x10d4e1, _0x3d71a5, _0x275071);
    },
    emit(_0x2bf88c, _0x5b742e) {
      _0x10d4e1.get(_0x2bf88c)?.forEach((_0x1e0fde) => _0x1e0fde(_0x5b742e));
    },
    listenerCount(_0x197051) {
      return _0x10d4e1.get(_0x197051)?.size || 0;
    },
    windowListenerCount(_0x596907) {
      return _0x4d0bc6.get(_0x596907)?.size || 0;
    },
  };
}
(test('unifyNativeTooltipElement migrates title to unified tooltip', () => {
  const _0x407422 = createFakeElement('button', { title: '生成' });
  (assert.equal(unifyNativeTooltipElement(_0x407422), true),
    assert.equal(_0x407422.hasAttribute('title'), false),
    assert.equal(_0x407422.getAttribute('data-tooltip'), '生成'),
    assert.equal(_0x407422.getAttribute('data-native-title'), '生成'),
    assert.equal(_0x407422.getAttribute('data-tooltip-source'), 'native-title'),
    assert.equal(_0x407422.getAttribute('aria-label'), '生成'));
}),
  test('unifyNativeTooltipElement keeps existing custom tooltip', () => {
    const _0x579403 = createFakeElement('button', { title: '旧提示', 'data-tooltip': '当前提示' });
    (unifyNativeTooltipElement(_0x579403),
      assert.equal(_0x579403.hasAttribute('title'), false),
      assert.equal(_0x579403.getAttribute('data-tooltip'), '当前提示'),
      assert.equal(_0x579403.getAttribute('data-native-title'), '旧提示'),
      assert.equal(_0x579403.getAttribute('data-tooltip-source'), null));
  }),
  test('unifyNativeTooltipElement updates and clears generated tooltips', () => {
    const _0x282d85 = createFakeElement('div', { title: '初始' });
    (unifyNativeTooltipElement(_0x282d85),
      _0x282d85.setAttribute('title', '更新'),
      unifyNativeTooltipElement(_0x282d85),
      assert.equal(_0x282d85.getAttribute('data-tooltip'), '更新'),
      _0x282d85.setAttribute('title', ''),
      unifyNativeTooltipElement(_0x282d85),
      assert.equal(_0x282d85.getAttribute('data-tooltip'), null),
      assert.equal(_0x282d85.getAttribute('data-tooltip-source'), null),
      assert.equal(_0x282d85.getAttribute('data-native-title'), null));
  }),
  test('unifyNativeTooltips normalizes root and descendants', () => {
    const _0x550ac4 = createFakeElement('div', { title: '子项' }),
      _0x1fe005 = createFakeElement('div', { title: '根' }, [_0x550ac4]);
    (assert.equal(unifyNativeTooltips(_0x1fe005), 2),
      assert.equal(_0x1fe005.getAttribute('data-tooltip'), '根'),
      assert.equal(_0x550ac4.getAttribute('data-tooltip'), '子项'));
  }),
  test('computeTooltipPosition positions top tooltips and clamps near edges', () => {
    const _0xb24326 = computeTooltipPosition(
      { left: 100, top: 100, right: 140, bottom: 124, width: 40, height: 24 },
      { width: 80, height: 30 },
      { width: 0x190, height: 0x12c },
      'top',
    );
    (assert.equal(_0xb24326.placement, 'top'),
      assert.equal(_0xb24326.left, 80),
      assert.equal(_0xb24326.top, 58),
      assert.equal(_0xb24326.arrowLeft, 40));
    const _0x3fa12e = computeTooltipPosition(
      { left: 0, top: 90, right: 20, bottom: 110, width: 20, height: 20 },
      { width: 120, height: 30 },
      { width: 0x12c, height: 240 },
      'top',
    );
    (assert.equal(_0x3fa12e.left, 8), assert.equal(_0x3fa12e.arrowLeft, 12));
  }),
  test('computeTooltipPosition flips top tooltips below when there is room', () => {
    const _0x384c3f = computeTooltipPosition(
      { left: 100, top: 6, right: 140, bottom: 26, width: 40, height: 20 },
      { width: 80, height: 30 },
      { width: 0x12c, height: 240 },
      'top',
    );
    (assert.equal(_0x384c3f.placement, 'bottom'), assert.equal(_0x384c3f.top, 38));
  }),
  test('computeTooltipPosition supports right tooltips and left fallback', () => {
    const _0x39c678 = computeTooltipPosition(
      { left: 40, top: 80, right: 64, bottom: 104, width: 24, height: 24 },
      { width: 90, height: 40 },
      { width: 0x12c, height: 220 },
      'right',
    );
    (assert.equal(_0x39c678.placement, 'right'),
      assert.equal(_0x39c678.left, 76),
      assert.equal(_0x39c678.top, 72),
      assert.equal(_0x39c678.arrowTop, 20));
    const _0x4065a0 = computeTooltipPosition(
      { left: 0x104, top: 80, right: 0x11c, bottom: 104, width: 24, height: 24 },
      { width: 90, height: 40 },
      { width: 0x12c, height: 220 },
      'right',
    );
    (assert.equal(_0x4065a0.placement, 'left'), assert.equal(_0x4065a0.left, 158));
  }),
  test('installTooltipUnifier ignores empty tooltip text and cleans up listeners', () => {
    const _0x5cc285 = createFakeDocument(),
      _0x150e46 = installTooltipUnifier(_0x5cc285);
    (assert.equal(_0x5cc285.documentElement.classList.contains('has-global-tooltip-portal'), true),
      assert.equal(_0x5cc285.listenerCount('pointerover') > 0, true),
      assert.equal(_0x5cc285.windowListenerCount('resize') > 0, true));
    const _0x1b1a47 = createFakeElement('button', { 'data-tooltip': ' ' });
    (_0x5cc285.emit('focusin', { target: _0x1b1a47 }),
      assert.equal(_0x5cc285.body.children.length, 0),
      _0x150e46(),
      assert.equal(_0x5cc285.documentElement.classList.contains('has-global-tooltip-portal'), false),
      assert.equal(_0x5cc285.listenerCount('pointerover'), 0),
      assert.equal(_0x5cc285.windowListenerCount('resize'), 0));
  }),
  test('installTooltipUnifier renders non-empty tooltips into a body portal', () => {
    const _0x351327 = createFakeDocument(),
      _0x345d8b = installTooltipUnifier(_0x351327),
      _0x147643 = createFakeElement('button', { 'data-tooltip': '裁剪视频' });
    ((_0x147643.getBoundingClientRect = () => ({
      left: 100,
      top: 120,
      right: 138,
      bottom: 158,
      width: 38,
      height: 38,
    })),
      (_0x351327.documentElement.contains = (_0x66d134) =>
        _0x66d134 === _0x147643 ||
        _0x66d134 === _0x351327.documentElement ||
        _0x351327.body.children.includes(_0x66d134)),
      _0x351327.emit('pointerover', { target: _0x147643 }),
      assert.equal(_0x351327.body.children.length, 1),
      assert.equal(_0x351327.body.children[0].hidden, false),
      assert.equal(_0x351327.body.children[0].textContent, '裁剪视频'),
      _0x345d8b(),
      assert.equal(_0x351327.body.children.length, 0));
  }),
  test('installTooltipUnifier does not duplicate generation node help portals', () => {
    const _0x414bc9 = createFakeDocument(),
      _0x2b076a = installTooltipUnifier(_0x414bc9),
      _0x24bd7c = createFakeElement('button', { 'data-tooltip': '进阶声音克隆用法' });
    ((_0x24bd7c.classList = createFakeClassList()),
      _0x24bd7c.classList.add('generation-node-help-tip'),
      _0x414bc9.emit('pointerover', { target: _0x24bd7c }),
      assert.equal(_0x414bc9.body.children.length, 0),
      _0x2b076a());
  }));

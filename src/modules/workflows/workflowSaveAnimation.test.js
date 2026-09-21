import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playWorkflowSaveFly } from './workflowSaveAnimation.js';
class FakeElement {
  constructor(_0x2e9aea = '', _0x3c71d2 = '') {
    ((this.id = _0x2e9aea),
      (this.className = _0x3c71d2),
      (this.style = {}),
      (this.children = []),
      (this.parentElement = null),
      (this.rect = null),
      (this.animateCalls = []),
      (this.removed = false));
  }
  ['appendChild'](_0xf3143) {
    return (this.children.push(_0xf3143), (_0xf3143.parentElement = this), _0xf3143);
  }
  ['cloneNode'](_0x4f2923 = false) {
    const _0x4977ec = new FakeElement(this.id, this.className);
    return (
      (_0x4977ec.rect = this.rect ? { ...this.rect } : null),
      _0x4f2923 && this.children.forEach((_0x54d98e) => _0x4977ec.appendChild(_0x54d98e.cloneNode(true))),
      _0x4977ec
    );
  }
  ['removeAttribute'](_0x4e2837) {
    if (_0x4e2837 === 'id') this.id = '';
  }
  ['querySelectorAll']() {
    return [];
  }
  ['getBoundingClientRect']() {
    if (!this.rect) return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    const _0x1637f5 = Number(this.rect.left || 0),
      _0x52e2da = Number(this.rect.top || 0),
      _0x3b1f57 = Number(this.rect.width || 0),
      _0x1a12df = Number(this.rect.height || 0);
    return {
      left: _0x1637f5,
      top: _0x52e2da,
      width: _0x3b1f57,
      height: _0x1a12df,
      right: _0x1637f5 + _0x3b1f57,
      bottom: _0x52e2da + _0x1a12df,
    };
  }
  ['animate'](_0x55e914, _0x4f5e35) {
    const _0x65dfea = {
      keyframes: _0x55e914,
      options: _0x4f5e35,
      onfinish: null,
      oncancel: null,
      finish() {
        this.onfinish?.();
      },
    };
    return (this.animateCalls.push(_0x65dfea), _0x65dfea);
  }
  ['remove']() {
    this.removed = true;
    if (!this.parentElement) return;
    ((this.parentElement.children = this.parentElement.children.filter((_0x942da4) => _0x942da4 !== this)),
      (this.parentElement = null));
  }
}
function createHarness({ reducedMotion: reducedMotion = false, includeTarget: includeTarget = true } = {}) {
  const _0x40f26b = new FakeElement('body'),
    _0x422db6 = new FakeElement('btnWorkflows');
  _0x422db6.rect = { left: 20, top: 0x104, width: 40, height: 40 };
  const _0x316512 = new FakeElement('workflow-cover', 'v2-workflow-form-cover');
  ((_0x316512.rect = { left: 0x12c, top: 120, width: 240, height: 135 }),
    _0x316512.appendChild(new FakeElement('cover-img', '')));
  const _0x47be50 = {
      body: _0x40f26b,
      createElement: () => new FakeElement(),
      getElementById: (_0x2fee5e) => (includeTarget && _0x2fee5e === 'btnWorkflows' ? _0x422db6 : null),
    },
    _0x2d99d4 = {
      matchMedia: () => ({ matches: reducedMotion }),
      setTimeout(_0x4483ff) {
        if (typeof _0x4483ff === 'function') _0x4483ff();
        return 1;
      },
    };
  return {
    body: _0x40f26b,
    documentRef: _0x47be50,
    source: _0x316512,
    target: _0x422db6,
    windowRef: _0x2d99d4,
  };
}
(test('workflowSaveAnimation: 创建封面飞行动画并在结束后 pulse 工作流按钮', () => {
  const {
      body: _0x37dd48,
      documentRef: _0x57a47d,
      source: _0x11d27d,
      target: _0x22905d,
      windowRef: _0xb33a57,
    } = createHarness(),
    _0xd67b35 = playWorkflowSaveFly({ sourceEl: _0x11d27d, documentRef: _0x57a47d, windowRef: _0xb33a57 });
  (assert.ok(_0xd67b35),
    assert.equal(_0x37dd48.children.length, 1),
    assert.equal(_0xd67b35.fly.className, 'v2-workflow-save-fly'),
    assert.equal(_0xd67b35.fly.style.left, '300px'),
    assert.equal(_0xd67b35.fly.style.top, '120px'),
    assert.equal(_0xd67b35.fly.style.width, '240px'),
    assert.equal(_0xd67b35.fly.style.height, '135px'),
    assert.equal(_0xd67b35.fly.children[0].id, ''),
    assert.equal(_0xd67b35.fly.animateCalls.length, 1),
    assert.equal(_0xd67b35.fly.animateCalls[0].options.duration, 0x208),
    assert.equal(_0xd67b35.fly.animateCalls[0].options.easing, 'cubic-bezier(0.2, 0, 0, 1)'),
    _0xd67b35.animation.finish(),
    assert.equal(_0xd67b35.fly.removed, true),
    assert.equal(_0x37dd48.children.length, 0),
    assert.equal(_0x22905d.animateCalls.length, 1),
    assert.equal(_0x22905d.animateCalls[0].options.duration, 0x104));
}),
  test('workflowSaveAnimation: reduced motion 时跳过动画', () => {
    const {
        body: _0x24c768,
        documentRef: _0x1f1e38,
        source: _0x1c0f59,
        target: _0x4f7ee7,
        windowRef: _0x303ebc,
      } = createHarness({ reducedMotion: true }),
      _0x4bc104 = playWorkflowSaveFly({ sourceEl: _0x1c0f59, documentRef: _0x1f1e38, windowRef: _0x303ebc });
    (assert.equal(_0x4bc104, null),
      assert.equal(_0x24c768.children.length, 0),
      assert.equal(_0x4f7ee7.animateCalls.length, 0));
  }),
  test('workflowSaveAnimation: 缺少目标时安全跳过', () => {
    const {
        body: _0xa94241,
        documentRef: _0x586b49,
        source: _0x13adcf,
        windowRef: _0x1a7f3a,
      } = createHarness({ includeTarget: false }),
      _0x4ea8be = playWorkflowSaveFly({ sourceEl: _0x13adcf, documentRef: _0x586b49, windowRef: _0x1a7f3a });
    (assert.equal(_0x4ea8be, null), assert.equal(_0xa94241.children.length, 0));
  }));

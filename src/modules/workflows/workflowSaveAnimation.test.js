import { test } from 'node:test';
import assert from 'node:assert/strict';
import { playWorkflowSaveFly } from './workflowSaveAnimation.js';
class FakeElement {
  constructor(value = '', item = '') {
    ((this.id = value),
      (this.className = item),
      (this.style = {}),
      (this.children = []),
      (this.parentElement = null),
      (this.rect = null),
      (this.animateCalls = []),
      (this.removed = false));
  }
  ['appendChild'](key) {
    return (this.children.push(key), (key.parentElement = this), key);
  }
  ['cloneNode'](index = false) {
    const el = new FakeElement(this.id, this.className);
    return (
      (el.rect = this.rect ? { ...this.rect } : null),
      index && this.children.forEach((item2) => el.appendChild(item2.cloneNode(true))),
      el
    );
  }
  ['removeAttribute'](result) {
    if (result === 'id') this.id = '';
  }
  ['querySelectorAll']() {
    return [];
  }
  ['getBoundingClientRect']() {
    if (!this.rect) return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 };
    const left = Number(this.rect.left || 0),
      top = Number(this.rect.top || 0),
      width = Number(this.rect.width || 0),
      height = Number(this.rect.height || 0);
    return {
      left: left,
      top: top,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height,
    };
  }
  ['animate'](keyframes, options) {
    const data = {
      keyframes: keyframes,
      options: options,
      onfinish: null,
      oncancel: null,
      finish() {
        this.onfinish?.();
      },
    };
    return (this.animateCalls.push(data), data);
  }
  ['remove']() {
    this.removed = true;
    if (!this.parentElement) return;
    ((this.parentElement.children = this.parentElement.children.filter((item3) => item3 !== this)),
      (this.parentElement = null));
  }
}
function createHarness({ reducedMotion: reducedMotion = false, includeTarget: includeTarget = true } = {}) {
  const body = new FakeElement('body'),
    target = new FakeElement('btnWorkflows');
  target.rect = { left: 20, top: 0x104, width: 40, height: 40 };
  const source = new FakeElement('workflow-cover', 'v2-workflow-form-cover');
  ((source.rect = { left: 0x12c, top: 120, width: 240, height: 135 }),
    source.appendChild(new FakeElement('cover-img', '')));
  const documentRef = {
      body: body,
      createElement: () => new FakeElement(),
      getElementById: (next) => (includeTarget && next === 'btnWorkflows' ? target : null),
    },
    windowRef = {
      matchMedia: () => ({ matches: reducedMotion }),
      setTimeout(handler) {
        if (typeof handler === 'function') handler();
        return 1;
      },
    };
  return {
    body: body,
    documentRef: documentRef,
    source: source,
    target: target,
    windowRef: windowRef,
  };
}
(test('workflowSaveAnimation: 创建封面飞行动画并在结束后 pulse 工作流按钮', () => {
  const {
      body: body2,
      documentRef: documentRef2,
      source: source2,
      target: target2,
      windowRef: windowRef2,
    } = createHarness(),
    playWorkflowSaveFly2 = playWorkflowSaveFly({
      sourceEl: source2,
      documentRef: documentRef2,
      windowRef: windowRef2,
    });
  (assert.ok(playWorkflowSaveFly2),
    assert.equal(body2.children.length, 1),
    assert.equal(playWorkflowSaveFly2.fly.className, 'v2-workflow-save-fly'),
    assert.equal(playWorkflowSaveFly2.fly.style.left, '300px'),
    assert.equal(playWorkflowSaveFly2.fly.style.top, '120px'),
    assert.equal(playWorkflowSaveFly2.fly.style.width, '240px'),
    assert.equal(playWorkflowSaveFly2.fly.style.height, '135px'),
    assert.equal(playWorkflowSaveFly2.fly.children[0].id, ''),
    assert.equal(playWorkflowSaveFly2.fly.animateCalls.length, 1),
    assert.equal(playWorkflowSaveFly2.fly.animateCalls[0].options.duration, 0x208),
    assert.equal(playWorkflowSaveFly2.fly.animateCalls[0].options.easing, 'cubic-bezier(0.2, 0, 0, 1)'),
    playWorkflowSaveFly2.animation.finish(),
    assert.equal(playWorkflowSaveFly2.fly.removed, true),
    assert.equal(body2.children.length, 0),
    assert.equal(target2.animateCalls.length, 1),
    assert.equal(target2.animateCalls[0].options.duration, 0x104));
}),
  test('workflowSaveAnimation: reduced motion 时跳过动画', () => {
    const {
        body: body3,
        documentRef: documentRef3,
        source: source3,
        target: target3,
        windowRef: windowRef3,
      } = createHarness({ reducedMotion: true }),
      playWorkflowSaveFly3 = playWorkflowSaveFly({
        sourceEl: source3,
        documentRef: documentRef3,
        windowRef: windowRef3,
      });
    (assert.equal(playWorkflowSaveFly3, null),
      assert.equal(body3.children.length, 0),
      assert.equal(target3.animateCalls.length, 0));
  }),
  test('workflowSaveAnimation: 缺少目标时安全跳过', () => {
    const {
        body: body4,
        documentRef: documentRef4,
        source: source4,
        windowRef: windowRef4,
      } = createHarness({ includeTarget: false }),
      playWorkflowSaveFly4 = playWorkflowSaveFly({
        sourceEl: source4,
        documentRef: documentRef4,
        windowRef: windowRef4,
      });
    (assert.equal(playWorkflowSaveFly4, null), assert.equal(body4.children.length, 0));
  }));

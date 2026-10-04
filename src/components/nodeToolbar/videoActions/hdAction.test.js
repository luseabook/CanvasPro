import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { bindVideoHdAction } from './hdAction.js';
const originalGlobals = {
  document: globalThis.document,
  window: globalThis.window,
  requestAnimationFrame: globalThis.requestAnimationFrame,
  cancelAnimationFrame: globalThis.cancelAnimationFrame,
};
afterEach(() => {
  if (typeof originalGlobals.document === 'undefined') delete globalThis.document;
  else globalThis.document = originalGlobals.document;
  if (typeof originalGlobals.window === 'undefined') delete globalThis.window;
  else globalThis.window = originalGlobals.window;
  (typeof originalGlobals.requestAnimationFrame === 'undefined'
    ? delete globalThis.requestAnimationFrame
    : (globalThis.requestAnimationFrame = originalGlobals.requestAnimationFrame),
    typeof originalGlobals.cancelAnimationFrame === 'undefined'
      ? delete globalThis.cancelAnimationFrame
      : (globalThis.cancelAnimationFrame = originalGlobals.cancelAnimationFrame));
});
class FakeElement {
  constructor(value = 'div') {
    ((this.nodeType = 1),
      (this.tagName = String(value || 'div').toUpperCase()),
      (this.className = ''),
      (this.children = []),
      (this.parentNode = null),
      (this.style = {}),
      (this.textContent = ''),
      (this._listeners = new Map()),
      (this._rect = { left: 0, top: 0, width: 0, height: 0 }),
      (this._offsetLeft = 0),
      (this._offsetWidth = 0),
      (this.classList = {
        add: (...args) => this._setClasses(args, true),
        remove: (...args2) => this._setClasses(args2, false),
        contains: (item) => this._classNames().includes(item),
      }));
  }
  ['_classNames']() {
    return String(this.className || '')
      .split(/\s+/)
      .filter(Boolean);
  }
  ['_setClasses'](list, key) {
    const map = new Set(this._classNames());
    (list.forEach((item2) => {
      const enabled = String(item2 || '').trim();
      if (!enabled) return;
      if (key) map.add(enabled);
      else map.delete(enabled);
    }),
      (this.className = Array.from(map).join(' ')));
  }
  ['appendChild'](el) {
    return ((el.parentNode = this), this.children.push(el), el);
  }
  ['remove']() {
    if (!this.parentNode) return;
    const list2 = this.parentNode.children || [],
      count = list2.indexOf(this);
    if (count >= 0) list2.splice(count, 1);
    this.parentNode = null;
  }
  ['closest'](index) {
    const result = String(index || '').startsWith('.') ? String(index).slice(1) : '';
    let el2 = this;
    while (el2) {
      if (result && el2.classList?.contains(result)) return el2;
      el2 = el2.parentNode;
    }
    return null;
  }
  ['contains'](data) {
    if (data === this) return true;
    return this.children.some((item3) => item3?.contains?.(data));
  }
  ['addEventListener'](options, target) {
    if (typeof target !== 'function') return;
    if (!this._listeners.has(options)) this._listeners.set(options, []);
    this._listeners.get(options).push(target);
  }
  ['removeEventListener'](source, next) {
    const list3 = this._listeners.get(source) || [];
    this._listeners.set(
      source,
      list3.filter((item4) => item4 !== next),
    );
  }
  ['dispatchEvent'](args3) {
    const current = { target: this, stopPropagation() {}, preventDefault() {}, ...args3 };
    (this._listeners.get(current.type) || []).forEach((handler) => handler(current));
  }
  ['querySelector'](entry) {
    return this.querySelectorAll(entry)[0] || null;
  }
  ['querySelectorAll'](record) {
    const payload = String(record || '').startsWith('.') ? String(record).slice(1) : '',
      list4 = [],
      handler2 = (el3) => {
        if (!el3) return;
        if (payload && el3.classList?.contains(payload)) list4.push(el3);
        (el3.children || []).forEach(handler2);
      };
    return (handler2(this), list4);
  }
  ['getBoundingClientRect']() {
    const right = { left: 0, top: 0, width: 0, height: 0, ...this._rect };
    return {
      ...right,
      right: right.right ?? right.left + right.width,
      bottom: right.bottom ?? right.top + right.height,
    };
  }
  ['setRect'](box) {
    ((this._rect = { ...box }),
      (this._offsetLeft = Number(box?.offsetLeft ?? box?.left ?? 0)),
      (this._offsetWidth = Number(box?.offsetWidth ?? box?.width ?? 0)));
  }
  get ['offsetLeft']() {
    return this._offsetLeft;
  }
  get ['offsetWidth']() {
    return this._offsetWidth;
  }
  get ['offsetHeight']() {
    return 1;
  }
}
function installPopupDom() {
  const body = new FakeElement('body'),
    map2 = new Map(),
    document2 = {
      body: body,
      createElement(handle) {
        return new FakeElement(handle);
      },
      querySelector(state) {
        return body.querySelector(state);
      },
      querySelectorAll(config) {
        return body.querySelectorAll(config);
      },
      addEventListener(scope, handler3, options2) {
        if (typeof handler3 !== 'function') return;
        if (!map2.has(scope)) map2.set(scope, []);
        map2.get(scope).push({ handler: handler3, options: options2 });
      },
      removeEventListener(input, output) {
        const list5 = map2.get(input) || [];
        map2.set(
          input,
          list5.filter((item5) => item5.handler !== output),
        );
      },
      dispatchPointerDown(target2) {
        (map2.get('pointerdown') || []).forEach(({ handler: handler4 }) => handler4({ target: target2 }));
      },
      getListeners(value2) {
        return map2.get(value2) || [];
      },
    };
  let value3 = 0;
  const map3 = new Map();
  return (
    (globalThis.document = document2),
    (globalThis.window = {
      setTimeout(value4) {
        return (value4?.(), 1);
      },
      clearTimeout() {},
    }),
    (globalThis.requestAnimationFrame = (value5) => {
      return ((value3 += 1), map3.set(value3, value5), value3);
    }),
    (globalThis.cancelAnimationFrame = (value6) => {
      map3.delete(value6);
    }),
    {
      document: document2,
      getRafCount() {
        return map3.size;
      },
      flushNextRaf() {
        const el4 = map3.entries().next();
        if (el4.done) return false;
        const [value7, value8] = el4.value;
        return (map3.delete(value7), value8?.(), true);
      },
    }
  );
}
function createToolbarWithHdButton({ inMoreMenu: inMoreMenu = false } = {}) {
  const toolbarEl = new FakeElement('div'),
    hdBtn = new FakeElement('button');
  ((hdBtn.className = 'act-hd'),
    hdBtn.setRect({ left: 100, top: 50, width: 20, height: 20, offsetLeft: 96 }));
  if (inMoreMenu) {
    const el5 = new FakeElement('div');
    ((el5.className = 'v2-img-toolbar-more-menu'),
      el5.setRect({ left: 80, top: 120, width: 240, height: 80 }),
      el5.appendChild(hdBtn),
      toolbarEl.appendChild(el5));
  } else toolbarEl.appendChild(hdBtn);
  return (document.body.appendChild(toolbarEl), { toolbarEl: toolbarEl, hdBtn: hdBtn });
}
function createActionContext(toolbarEl2) {
  return {
    toolbarEl: toolbarEl2,
    nodeData: { id: 'video-1' },
    createRunningHubTaskStateMachine() {
      return {
        state: { active: false },
        bindButton() {},
        reset() {},
        isCancelled() {
          return false;
        },
      };
    },
    bindRunningHubToolbarTaskButton() {},
  };
}
function openPopup(target3) {
  target3.dispatchEvent({ type: 'click', target: target3, stopPropagation() {}, preventDefault() {} });
  const value9 = document.querySelector('.v2-hd-popup');
  return (assert.ok(value9), value9);
}
(test('video hd popup is portaled to body and follows the toolbar button', () => {
  const { flushNextRaf: flushNextRaf2, getRafCount: getRafCount2 } = installPopupDom(),
    { toolbarEl: toolbarEl3, hdBtn: hdBtn2 } = createToolbarWithHdButton();
  bindVideoHdAction(createActionContext(toolbarEl3));
  const el6 = openPopup(hdBtn2);
  (assert.equal(el6.parentNode, document.body),
    assert.equal(el6.classList.contains('node-toolbar-action-menu'), true),
    assert.equal(el6.style.position, 'fixed'),
    assert.equal(el6.style.left, '110px'),
    assert.equal(el6.style.top, '38px'),
    assert.equal(document.body.contains(el6), true),
    assert.equal(getRafCount2(), 1),
    hdBtn2.setRect({ left: 180, top: 90, width: 20, height: 20, offsetLeft: 176 }),
    assert.equal(flushNextRaf2(), true),
    assert.equal(el6.style.left, '190px'),
    assert.equal(el6.style.top, '78px'));
}),
  test('video hd popup follows the more-tools menu while it moves', () => {
    const { flushNextRaf: flushNextRaf3 } = installPopupDom(),
      { toolbarEl: toolbarEl4, hdBtn: hdBtn3 } = createToolbarWithHdButton({ inMoreMenu: true }),
      value10 = hdBtn3.closest('.v2-img-toolbar-more-menu');
    bindVideoHdAction(createActionContext(toolbarEl4));
    const el7 = openPopup(hdBtn3);
    (assert.equal(el7.parentNode, document.body),
      assert.equal(el7.style.left, '110px'),
      assert.equal(el7.style.top, '108px'),
      value10.setRect({ left: 140, top: 210, width: 240, height: 80 }),
      hdBtn3.setRect({ left: 220, top: 230, width: 20, height: 20, offsetLeft: 216 }),
      assert.equal(flushNextRaf3(), true),
      assert.equal(el7.style.left, '230px'),
      assert.equal(el7.style.top, '198px'));
  }),
  test('video hd popup closes on outside pointerdown', () => {
    const { document: document3 } = installPopupDom(),
      { toolbarEl: toolbarEl5, hdBtn: hdBtn4 } = createToolbarWithHdButton();
    bindVideoHdAction(createActionContext(toolbarEl5));
    const openPopup2 = openPopup(hdBtn4);
    (assert.equal(
      document3.getListeners('pointerdown').some((item6) => item6.options === true),
      true,
    ),
      document3.dispatchPointerDown(document3.createElement('div')),
      assert.equal(document3.body.contains(openPopup2), false));
  }));

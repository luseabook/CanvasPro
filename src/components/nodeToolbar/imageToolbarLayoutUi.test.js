import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { bindImageToolbarLayoutUi } from './imageToolbarLayoutUi.js';
const originalGlobals = {
  document: globalThis.document,
  requestAnimationFrame: globalThis.requestAnimationFrame,
  cancelAnimationFrame: globalThis.cancelAnimationFrame,
};
afterEach(() => {
  if (typeof originalGlobals.document === 'undefined') delete globalThis.document;
  else globalThis.document = originalGlobals.document;
  (typeof originalGlobals.requestAnimationFrame === 'undefined'
    ? delete globalThis.requestAnimationFrame
    : (globalThis.requestAnimationFrame = originalGlobals.requestAnimationFrame),
    typeof originalGlobals.cancelAnimationFrame === 'undefined'
      ? delete globalThis.cancelAnimationFrame
      : (globalThis.cancelAnimationFrame = originalGlobals.cancelAnimationFrame));
});
class FakeClassList {
  constructor(value) {
    this.owner = value;
  }
  ['_names']() {
    return String(this.owner.className || '')
      .split(/\s+/)
      .filter(Boolean);
  }
  ['_set'](item) {
    this.owner.className = Array.from(new Set(item)).join(' ');
  }
  ['add'](...list) {
    const list2 = this._names();
    (list.forEach((item2) => {
      const key = String(item2 || '').trim();
      if (key && !list2.includes(key)) list2.push(key);
    }),
      this._set(list2));
  }
  ['remove'](...list3) {
    const map = new Set(list3.map((item3) => String(item3 || '').trim()));
    this._set(this._names().filter((item4) => !map.has(item4)));
  }
  ['contains'](index) {
    return this._names().includes(index);
  }
  ['toggle'](result, enabled) {
    const data = enabled === undefined ? !this.contains(result) : !!enabled;
    if (data) this.add(result);
    else this.remove(result);
    return data;
  }
  [Symbol.iterator]() {
    return this._names()[Symbol.iterator]();
  }
}
class FakeElement {
  constructor(options = 'div', target = '') {
    ((this.nodeType = 1),
      (this.tagName = String(options || 'div').toUpperCase()),
      (this.className = target),
      (this.children = []),
      (this.parentNode = null),
      (this.dataset = {}),
      (this.attributes = new Map()),
      (this.style = {}),
      (this.hidden = false),
      (this.draggable = false),
      (this.isConnected = false),
      (this.textContent = ''),
      (this._listeners = new Map()),
      (this._rect = { left: 0, top: 0, width: 0, height: 0 }),
      (this.appendChildCount = 0),
      (this.insertBeforeCount = 0),
      (this.classList = new FakeClassList(this)));
  }
  ['appendChild'](el) {
    return (
      (this.appendChildCount += 1),
      this._detachChild(el),
      (el.parentNode = this),
      el._setConnected(this.isConnected),
      this.children.push(el),
      el
    );
  }
  ['insertBefore'](el2, source) {
    ((this.insertBeforeCount += 1),
      this._detachChild(el2),
      (el2.parentNode = this),
      el2._setConnected(this.isConnected));
    const count = this.children.indexOf(source);
    if (count >= 0) this.children.splice(count, 0, el2);
    else this.children.push(el2);
    return el2;
  }
  ['_detachChild'](el3) {
    const el4 = el3?.parentNode;
    if (!el4) return;
    const count2 = el4.children.indexOf(el3);
    if (count2 >= 0) el4.children.splice(count2, 1);
  }
  ['_setConnected'](enabled2) {
    ((this.isConnected = !!enabled2), this.children.forEach((item5) => item5._setConnected(enabled2)));
  }
  ['setAttribute'](next, current) {
    const list4 = String(next),
      entry = String(current);
    this.attributes.set(list4, entry);
    if (list4.startsWith('data-')) {
      const record = list4.slice(5).replace(/-([a-z])/g, (payload, handle) => handle.toUpperCase());
      this.dataset[record] = entry;
    }
  }
  ['getAttribute'](state) {
    return this.attributes.get(String(state)) ?? null;
  }
  ['addEventListener'](config, scope) {
    if (typeof scope !== 'function') return;
    if (!this._listeners.has(config)) this._listeners.set(config, []);
    this._listeners.get(config).push(scope);
  }
  ['dispatchEvent'](args) {
    const input = {
      target: this,
      currentTarget: this,
      preventDefault() {},
      stopPropagation() {},
      ...args,
    };
    (this._listeners.get(input.type) || []).forEach((handler) => handler(input));
  }
  ['contains'](output) {
    if (output === this) return true;
    return this.children.some((item6) => item6.contains(output));
  }
  ['matches'](value2) {
    return matchesSelector(this, value2);
  }
  ['closest'](value3) {
    let el5 = this;
    while (el5) {
      if (el5.matches(value3)) return el5;
      el5 = el5.parentNode;
    }
    return null;
  }
  ['querySelector'](value4) {
    return this.querySelectorAll(value4)[0] || null;
  }
  ['querySelectorAll'](value5) {
    const list5 = [],
      handler2 = (el6) => {
        el6.children.forEach((item7) => {
          if (matchesSelector(item7, value5)) list5.push(item7);
          handler2(item7);
        });
      };
    return (handler2(this), list5);
  }
  ['setRect'](args2) {
    this._rect = { ...this._rect, ...args2 };
  }
  ['getBoundingClientRect']() {
    const left = this.parentNode ? this.parentNode.children.indexOf(this) : -1,
      right = {
        ...this._rect,
        left: left >= 0 && this.classList.contains('ftb-btn') ? left * 48 : this._rect.left,
      };
    return {
      ...right,
      right: right.left + right.width,
      bottom: right.top + right.height,
    };
  }
  get ['nextSibling']() {
    if (!this.parentNode) return null;
    const count3 = this.parentNode.children.indexOf(this);
    return count3 >= 0 ? this.parentNode.children[count3 + 1] || null : null;
  }
  get ['nextElementSibling']() {
    return this.nextSibling;
  }
  get ['lastElementChild']() {
    return this.children[this.children.length - 1] || null;
  }
}
function matchesSelector(el7, value6) {
  const list6 = String(value6 || '').trim();
  if (list6.startsWith('.')) return el7.classList.contains(list6.slice(1));
  if (list6 === '[data-zone]') return el7.getAttribute('data-zone') !== null;
  const value7 = list6.match(/^\[data-([a-z-]+)="([^"]+)"\]$/);
  if (value7) return el7.getAttribute('data-' + value7[1]) === value7[2];
  return false;
}
function installFakeDocument() {
  const body = new FakeElement('body');
  body._setConnected(true);
  const map2 = new Map();
  ((globalThis.document = {
    body: body,
    addEventListener(value8, value9) {
      if (!map2.has(value8)) map2.set(value8, []);
      map2.get(value8).push(value9);
    },
    removeEventListener(value10, value11) {
      const value12 = (map2.get(value10) || []).filter((item8) => item8 !== value11);
      map2.set(value10, value12);
    },
  }),
    (globalThis.requestAnimationFrame = () => 1),
    (globalThis.cancelAnimationFrame = () => {}));
}
function createButton(value13) {
  return new FakeElement('button', 'ftb-btn act-' + value13);
}
function createToolbarHarness() {
  installFakeDocument();
  const toolbarEl = new FakeElement('div', 'v2-img-toolbar'),
    primaryZone = new FakeElement('div', 'v2-img-toolbar-zone');
  primaryZone.setAttribute('data-zone', 'outside-primary');
  const el8 = new FakeElement('div', 'v2-img-toolbar-zone');
  el8.setAttribute('data-zone', 'outside-secondary');
  const button = createButton('more-tools'),
    fakeElement = new FakeElement('div', 'v2-img-toolbar-main-divider'),
    moreMenu = new FakeElement('div', 'v2-img-toolbar-more-menu');
  moreMenu.setAttribute('data-role', 'more-menu');
  const moreZone = new FakeElement('div', 'v2-img-toolbar-zone');
  moreZone.setAttribute('data-zone', 'more');
  const customizeBtn = createButton('customize-tools');
  customizeBtn.classList.add('act-customize-tools');
  const mattingBtn = createButton('matting'),
    expandBtn = createButton('expand'),
    hdBtn = createButton('hd');
  return (
    mattingBtn.setRect({ left: 0, top: 0, width: 38, height: 38 }),
    expandBtn.setRect({ left: 48, top: 0, width: 38, height: 38 }),
    primaryZone.appendChild(mattingBtn),
    primaryZone.appendChild(expandBtn),
    moreZone.appendChild(hdBtn),
    moreMenu.appendChild(moreZone),
    moreMenu.appendChild(customizeBtn),
    toolbarEl.appendChild(primaryZone),
    toolbarEl.appendChild(button),
    toolbarEl.appendChild(fakeElement),
    toolbarEl.appendChild(el8),
    toolbarEl.appendChild(moreMenu),
    document.body.appendChild(toolbarEl),
    {
      toolbarEl: toolbarEl,
      primaryZone: primaryZone,
      moreZone: moreZone,
      moreMenu: moreMenu,
      customizeBtn: customizeBtn,
      mattingBtn: mattingBtn,
      expandBtn: expandBtn,
      hdBtn: hdBtn,
    }
  );
}
function actionFromButton(el9) {
  const map3 = new Set(['matting', 'expand', 'hd']);
  for (const list7 of el9.classList) {
    if (!list7.startsWith('act-')) continue;
    const value14 = list7.slice(4);
    if (map3.has(value14)) return value14;
  }
  return '';
}
function normalizeLayout(value15) {
  return {
    outsidePrimary: [...(value15?.outsidePrimary || [])],
    outsideSecondary: [...(value15?.outsideSecondary || [])],
    more: [...(value15?.more || [])],
  };
}
(test('image toolbar custom drag skips DOM writes when the slot is unchanged', () => {
  const toolbarHarness = createToolbarHarness(),
    value16 = {
      ui: {
        imageToolbarLayout: { outsidePrimary: ['matting', 'expand'], outsideSecondary: [], more: ['hd'] },
      },
    };
  (bindImageToolbarLayoutUi(toolbarHarness.toolbarEl, {
    store: {},
    getStateSnapshot: () => value16,
    imageToolbarActions: ['matting', 'expand', 'hd'],
    normalizeImageToolbarLayout: normalizeLayout,
    serializeImageToolbarLayout: (value17) => JSON.stringify(normalizeLayout(value17)),
    getToolbarActionFromButton: actionFromButton,
  }),
    toolbarHarness.customizeBtn.dispatchEvent({ type: 'click' }),
    assert.equal(toolbarHarness.mattingBtn.draggable, true),
    toolbarHarness.mattingBtn.dispatchEvent({
      type: 'dragstart',
      dataTransfer: { effectAllowed: '', setData() {} },
    }),
    assert.equal(toolbarHarness.toolbarEl.classList.contains('is-toolbar-drag-active'), true),
    assert.equal(toolbarHarness.moreMenu.classList.contains('is-toolbar-drag-active'), true));
  const value18 = toolbarHarness.primaryZone.insertBeforeCount,
    value19 = toolbarHarness.primaryZone.appendChildCount;
  (toolbarHarness.primaryZone.dispatchEvent({ type: 'dragover', clientX: 0, preventDefault() {} }),
    assert.equal(toolbarHarness.primaryZone.insertBeforeCount, value18),
    assert.equal(toolbarHarness.primaryZone.appendChildCount, value19),
    toolbarHarness.mattingBtn.dispatchEvent({ type: 'dragend' }),
    assert.equal(toolbarHarness.toolbarEl.classList.contains('is-toolbar-drag-active'), false),
    assert.equal(toolbarHarness.moreMenu.classList.contains('is-toolbar-drag-active'), false));
}),
  test('image toolbar custom drag keeps drop zone background stable while moving inside it', () => {
    const target2 = createToolbarHarness(),
      value20 = {
        ui: {
          imageToolbarLayout: { outsidePrimary: ['matting', 'expand'], outsideSecondary: [], more: ['hd'] },
        },
      };
    (bindImageToolbarLayoutUi(target2.toolbarEl, {
      store: {},
      getStateSnapshot: () => value20,
      imageToolbarActions: ['matting', 'expand', 'hd'],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (value21) => JSON.stringify(normalizeLayout(value21)),
      getToolbarActionFromButton: actionFromButton,
    }),
      target2.customizeBtn.dispatchEvent({ type: 'click' }),
      target2.mattingBtn.dispatchEvent({
        type: 'dragstart',
        dataTransfer: { effectAllowed: '', setData() {} },
      }),
      target2.primaryZone.dispatchEvent({
        type: 'dragover',
        target: target2.expandBtn,
        clientX: 0,
        preventDefault() {},
      }),
      assert.equal(target2.primaryZone.classList.contains('is-drop-target'), true),
      target2.primaryZone.dispatchEvent({ type: 'dragleave', relatedTarget: target2.expandBtn }),
      assert.equal(target2.primaryZone.classList.contains('is-drop-target'), true),
      target2.moreZone.dispatchEvent({
        type: 'dragover',
        target: target2.hdBtn,
        clientX: 0,
        preventDefault() {},
      }),
      assert.equal(target2.primaryZone.classList.contains('is-drop-target'), false),
      assert.equal(target2.moreZone.classList.contains('is-drop-target'), true));
  }),
  test('image toolbar custom drag uses flip transforms when buttons are pushed aside', () => {
    const target3 = createToolbarHarness(),
      value22 = {
        ui: {
          imageToolbarLayout: { outsidePrimary: ['matting', 'expand'], outsideSecondary: [], more: ['hd'] },
        },
      };
    (bindImageToolbarLayoutUi(target3.toolbarEl, {
      store: {},
      getStateSnapshot: () => value22,
      imageToolbarActions: ['matting', 'expand', 'hd'],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (value23) => JSON.stringify(normalizeLayout(value23)),
      getToolbarActionFromButton: actionFromButton,
    }),
      target3.customizeBtn.dispatchEvent({ type: 'click' }),
      target3.mattingBtn.dispatchEvent({
        type: 'dragstart',
        dataTransfer: { effectAllowed: '', setData() {} },
      }),
      target3.primaryZone.dispatchEvent({
        type: 'dragover',
        target: target3.expandBtn,
        clientX: 0x3e7,
        preventDefault() {},
      }),
      assert.deepEqual(target3.primaryZone.children, [target3.expandBtn, target3.mattingBtn]),
      assert.match(String(target3.expandBtn.style.transform || ''), /translate\(48px/),
      assert.match(String(target3.mattingBtn.style.transform || ''), /translate\(-48px/));
  }),
  test('image toolbar custom drag persists the portaled more zone order', () => {
    const toolbarHarness2 = createToolbarHarness(),
      value24 = {
        ui: {
          imageToolbarLayout: { outsidePrimary: ['matting'], outsideSecondary: [], more: ['expand', 'hd'] },
        },
      };
    let value25 = null;
    (bindImageToolbarLayoutUi(toolbarHarness2.toolbarEl, {
      store: {
        setImageToolbarLayout(value26) {
          value25 = value26;
        },
      },
      getStateSnapshot: () => value24,
      imageToolbarActions: ['matting', 'expand', 'hd'],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (value27) => JSON.stringify(normalizeLayout(value27)),
      getToolbarActionFromButton: actionFromButton,
    }),
      toolbarHarness2.customizeBtn.dispatchEvent({ type: 'click' }),
      assert.equal(toolbarHarness2.moreMenu.parentNode, document.body),
      toolbarHarness2.hdBtn.dispatchEvent({
        type: 'dragstart',
        dataTransfer: { effectAllowed: '', setData() {} },
      }),
      toolbarHarness2.moreZone.dispatchEvent({ type: 'dragover', clientX: 0, preventDefault() {} }),
      toolbarHarness2.moreZone.dispatchEvent({ type: 'drop', preventDefault() {} }),
      assert.deepEqual(value25, {
        outsidePrimary: ['matting'],
        outsideSecondary: [],
        more: ['hd', 'expand'],
      }));
  }));

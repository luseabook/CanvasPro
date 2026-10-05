import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import appStore from '../core/stores/appStore.js';
import { normalizeEmptyStoryboardCell } from '../core/storyboardCellUtils.js';
import { StoryboardNode } from './StoryboardNode.js';
const NODE_TYPES_CSS = readFileSync(new URL('../../styles/node-types.css', import.meta.url), 'utf8');
class FakeClassList {
  constructor() {
    this._items = new Set();
  }
  ['add'](...list) {
    list.forEach((item) => {
      if (item) this._items.add(String(item));
    });
  }
  ['remove'](...list2) {
    list2.forEach((item2) => this._items.delete(String(item2)));
  }
  ['contains'](value) {
    return this._items.has(String(value));
  }
  ['toggle'](key, index) {
    const result = String(key);
    if (index === true) return (this._items.add(result), true);
    if (index === false) return (this._items.delete(result), false);
    if (this._items.has(result)) return (this._items.delete(result), false);
    return (this._items.add(result), true);
  }
}
class FakeStyle {
  constructor() {
    ((this._props = {}), (this._priorities = {}));
  }
  ['setProperty'](data, options, target = '') {
    const source = String(data),
      next = String(options);
    ((this._props[source] = next), (this._priorities[source] = String(target || '')), (this[source] = next));
  }
  ['getPropertyPriority'](current) {
    return this._priorities[String(current)] ?? '';
  }
  ['removeProperty'](entry) {
    const record = String(entry);
    (delete this._props[record], delete this._priorities[record], delete this[record]);
  }
}
class FakeNode {
  constructor(payload = 1) {
    ((this.nodeType = payload), (this.parentNode = null));
  }
  get ['parentElement']() {
    return this.parentNode instanceof FakeElement ? this.parentNode : null;
  }
}
class FakeTextNode extends FakeNode {
  constructor(handle = '') {
    (super(3), (this.textContent = String(handle)));
  }
  ['cloneNode']() {
    return new FakeTextNode(this.textContent);
  }
}
class FakeDocumentFragment extends FakeNode {
  constructor() {
    (super(11), (this.children = []), (this.childNodes = []));
  }
  ['appendChild'](el) {
    if (!el) return el;
    el.parentNode && el.parentNode !== this && el.parentNode.removeChild?.(el);
    ((el.parentNode = this), this.childNodes.push(el));
    if (el instanceof FakeElement) this.children.push(el);
    return el;
  }
}
function matchesSimpleSelector(el2, list3) {
  if (!(el2 instanceof FakeElement)) return false;
  if (list3.startsWith('.')) return el2.classList.contains(list3.slice(1));
  if (list3.startsWith('#')) return el2.id === list3.slice(1);
  return el2.tagName.toLowerCase() === list3.toLowerCase();
}
function matchesSelectorChain(state, config) {
  const list4 = String(config || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (list4.length === 0) return false;
  if (!matchesSimpleSelector(state, list4[list4.length - 1])) return false;
  let enabled = state.parentElement;
  for (let count = list4.length - 2; count >= 0; count--) {
    while (enabled && !matchesSimpleSelector(enabled, list4[count])) {
      enabled = enabled.parentElement;
    }
    if (!enabled) return false;
    enabled = enabled.parentElement;
  }
  return true;
}
class FakeElement extends FakeNode {
  constructor(scope = 'div', input = null) {
    (super(1),
      (this.tagName = String(scope).toUpperCase()),
      (this.ownerDocument = input),
      (this.children = []),
      (this.childNodes = []),
      (this.dataset = {}),
      (this.style = new FakeStyle()),
      (this.classList = new FakeClassList()),
      (this.attributes = new Map()),
      (this.eventListeners = new Map()),
      (this.textContent = ''),
      (this.id = ''),
      (this._className = ''));
  }
  get ['className']() {
    return this._className;
  }
  set ['className'](output) {
    ((this._className = String(output || '')),
      (this.classList = new FakeClassList()),
      this._className
        .split(/\s+/)
        .filter(Boolean)
        .forEach((item3) => this.classList.add(item3)));
  }
  get ['firstElementChild']() {
    return this.children[0] || null;
  }
  ['_appendSingleChild'](el3) {
    if (!el3) return el3;
    el3.parentNode && el3.parentNode !== this && el3.parentNode.removeChild?.(el3);
    ((el3.parentNode = this), this.childNodes.push(el3));
    if (el3 instanceof FakeElement) this.children.push(el3);
    return el3;
  }
  ['appendChild'](el4) {
    if (!el4) return el4;
    if (el4.nodeType === 11) {
      const list5 = [...el4.childNodes];
      return (
        (el4.childNodes.length = 0),
        (el4.children.length = 0),
        list5.forEach((item4) => this._appendSingleChild(item4)),
        el4
      );
    }
    return this._appendSingleChild(el4);
  }
  ['insertBefore'](el5, el6) {
    if (!el5) return el5;
    if (!el6 || el6.parentNode !== this) return this.appendChild(el5);
    if (el5.nodeType === 11) {
      const list6 = [...el5.childNodes];
      return (
        (el5.childNodes.length = 0),
        (el5.children.length = 0),
        list6.forEach((item5) => this.insertBefore(item5, el6)),
        el5
      );
    }
    el5.parentNode && el5.parentNode.removeChild?.(el5);
    const value2 = this.childNodes.indexOf(el6),
      value3 = this.children.indexOf(el6);
    return (
      (el5.parentNode = this),
      this.childNodes.splice(value2, 0, el5),
      el5 instanceof FakeElement && this.children.splice(value3, 0, el5),
      el5
    );
  }
  ['removeChild'](el7) {
    const count2 = this.childNodes.indexOf(el7);
    if (count2 >= 0) this.childNodes.splice(count2, 1);
    const count3 = this.children.indexOf(el7);
    if (count3 >= 0) this.children.splice(count3, 1);
    return ((el7.parentNode = null), el7);
  }
  ['replaceChildren'](...list7) {
    ([...this.childNodes].forEach((item6) => this.removeChild(item6)),
      list7.forEach((item7) => this.appendChild(item7)));
  }
  ['remove']() {
    this.parentNode?.removeChild?.(this);
  }
  ['setAttribute'](value4, value5) {
    const value6 = String(value4),
      value7 = String(value5);
    this.attributes.set(value6, value7);
    if (value6 === 'id') this.id = value7;
    if (value6 === 'class') this.className = value7;
  }
  ['getAttribute'](value8) {
    return this.attributes.get(String(value8)) ?? null;
  }
  ['addEventListener'](value9, value10) {
    const list8 = this.eventListeners.get(value9) || [];
    (list8.push(value10), this.eventListeners.set(value9, list8));
  }
  ['removeEventListener'](value11, value12) {
    const list9 = this.eventListeners.get(value11) || [];
    this.eventListeners.set(
      value11,
      list9.filter((item8) => item8 !== value12),
    );
  }
  ['closest'](value13) {
    let value14 = this;
    while (value14) {
      if (matchesSimpleSelector(value14, value13)) return value14;
      value14 = value14.parentElement;
    }
    return null;
  }
  ['contains'](value15) {
    let el8 = value15;
    while (el8) {
      if (el8 === this) return true;
      el8 = el8.parentNode;
    }
    return false;
  }
  ['querySelector'](value16) {
    return this.querySelectorAll(value16)[0] || null;
  }
  ['querySelectorAll'](value17) {
    const list10 = [],
      handler = (el9) => {
        for (const value18 of el9.children || []) {
          if (matchesSelectorChain(value18, value17)) list10.push(value18);
          handler(value18);
        }
      };
    return (handler(this), list10);
  }
  ['cloneNode'](value19 = false) {
    const el10 = new FakeElement(this.tagName.toLowerCase(), this.ownerDocument);
    ((el10.id = this.id),
      (el10.className = this.className),
      (el10.textContent = this.textContent),
      (el10.dataset = { ...this.dataset }),
      (el10.style = Object.assign(new FakeStyle(), this.style)));
    for (const [value20, value21] of this.attributes.entries()) {
      el10.attributes.set(value20, value21);
    }
    return (value19 && this.childNodes.forEach((item9) => el10.appendChild(item9.cloneNode(true))), el10);
  }
  ['blur']() {}
  ['setPointerCapture']() {}
  ['getBoundingClientRect']() {
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
}
function createFakeDocument() {
  const map = new Map(),
    dom = {
      body: null,
      createElement(value22) {
        return new FakeElement(value22, dom);
      },
      createElementNS(value23, value24) {
        return new FakeElement(value24, dom);
      },
      createTextNode(value25) {
        return new FakeTextNode(value25);
      },
      createDocumentFragment() {
        return new FakeDocumentFragment();
      },
      addEventListener(value26, value27) {
        const value28 = String(value26),
          list11 = map.get(value28) || [];
        (list11.push(value27), map.set(value28, list11));
      },
      removeEventListener(value29, value30) {
        const value31 = String(value29),
          list12 = map.get(value31) || [];
        map.set(
          value31,
          list12.filter((item10) => item10 !== value30),
        );
      },
      dispatchEvent(value32) {
        const value33 = String(value32?.type || ''),
          list13 = [...(map.get(value33) || [])];
        return (list13.forEach((handler2) => handler2(value32)), true);
      },
      importNode(value34) {
        return value34.cloneNode(true);
      },
      getElementById(value35) {
        return dom.body?.querySelector('#' + value35) || null;
      },
    };
  return ((dom.body = new FakeElement('body', dom)), dom);
}
function createButtonEvent(target2) {
  return { stopPropagation() {}, target: target2 };
}
(test('StoryboardNode: 自定义分割线按钮位于编辑左侧并且确定后才提交', async () => {
  const value36 = globalThis.document,
    value37 = appStore.updateNodeData,
    target3 = createFakeDocument(),
    list14 = [];
  ((globalThis.document = target3),
    (appStore.updateNodeData = (id, patch) => {
      list14.push({ id: id, patch: patch });
    }));
  try {
    const storyboardNode = new StoryboardNode({
        id: 'sb-custom-grid',
        type: 'storyboard',
        cols: 2,
        rows: 2,
        width: 200,
        height: 100,
        gridGap: 20,
        cells: [
          { id: 'cell-1', isEmpty: true, url: '' },
          { id: 'cell-2', isEmpty: true, url: '' },
          { id: 'cell-3', isEmpty: true, url: '' },
          { id: 'cell-4', isEmpty: true, url: '' },
        ],
      }),
      el11 = storyboardNode.mount();
    target3.body.appendChild(el11);
    const value38 = el11.querySelectorAll('.sb-cell'),
      handler3 = (left) => ({
        left: left.style.left,
        top: left.style.top,
        width: left.style.width,
        height: left.style.height,
      }),
      value39 = handler3(value38[0]),
      value40 = handler3(value38[1]),
      el12 = el11.querySelector('.act-split-lines'),
      value41 = el11.querySelector('.act-edit'),
      list15 = el11.querySelectorAll('.storyboard-toolbar .ftb-btn');
    (assert.equal(list15.indexOf(el12), list15.indexOf(value41) - 1),
      assert.equal(el12.classList.contains('icon-only'), true),
      assert.equal(el12.querySelector('.storyboard-split-lines-label'), null),
      assert.equal(el12.querySelector('.storyboard-split-lines-menu-trigger'), null),
      assert.equal(el12.querySelectorAll('circle').length, 2),
      el12.onclick(createButtonEvent(el12)),
      assert.equal(el12.classList.contains('active'), true),
      assert.equal(el12.classList.contains('is-confirm'), false),
      assert.equal(el12.querySelectorAll('circle').length, 2),
      assert.equal(el12.dataset.tooltip, '完成调整'),
      assert.equal(el11.classList.contains('is-custom-grid-mode'), true),
      assert.equal(list14.length, 0),
      assert.notEqual(el11.querySelector('.storyboard-split-lines-menu'), null),
      assert.deepEqual(handler3(value38[0]), value39),
      assert.deepEqual(handler3(value38[1]), value40),
      (storyboardNode._grid.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        right: 200,
        bottom: 100,
        width: 200,
        height: 100,
      })));
    const currentTarget = el11.querySelector('.storyboard-custom-grid-handle-vertical'),
      handler4 = currentTarget.eventListeners.get('pointerdown')[0];
    (handler4({
      type: 'pointerdown',
      clientX: 100,
      clientY: 0,
      pointerId: 1,
      currentTarget: currentTarget,
      preventDefault() {},
      stopPropagation() {},
    }),
      target3.dispatchEvent({ type: 'pointermove', clientX: 150, clientY: 0 }),
      target3.dispatchEvent({ type: 'pointerup' }),
      assert.equal(list14.length, 0),
      assert.equal(storyboardNode._grid.style.gridTemplateColumns, '1fr 1fr'),
      assert.equal(storyboardNode._grid.style.gridTemplateRows, '1fr 1fr'),
      assert.equal(storyboardNode._grid.style.gap, '0px'),
      assert.deepEqual(handler3(value38[0]), value39),
      assert.deepEqual(handler3(value38[1]), value40),
      assert.equal(el11.querySelector('.storyboard-custom-grid-handle-vertical').style.left, '75%'),
      target3.dispatchEvent({ type: 'pointerdown', target: target3.body }),
      assert.notEqual(el11.querySelector('.storyboard-split-lines-menu'), null),
      assert.equal(el12.classList.contains('active'), true));
    const value42 = el11.querySelector('.act-aspect');
    (value42.onclick(createButtonEvent(value42)),
      assert.notEqual(el11.querySelector('.storyboard-split-lines-menu'), null),
      await el12.onclick(createButtonEvent(el12)),
      assert.equal(list14.length, 1),
      assert.equal(list14[0].id, 'sb-custom-grid'),
      assert.deepEqual(list14[0].patch.gridLayout, { columns: [1.5, 0.5], rows: [1, 1] }),
      assert.equal(el12.classList.contains('active'), false),
      assert.equal(el12.classList.contains('is-confirm'), false),
      assert.equal(el12.querySelectorAll('circle').length, 2),
      assert.equal(el12.dataset.tooltip, '调整分割线'),
      assert.equal(el11.classList.contains('is-custom-grid-mode'), false),
      assert.equal(el11.querySelector('.storyboard-split-lines-menu'), null),
      assert.equal(value38[0].style.left, '0px'),
      assert.equal(value38[0].style.width, '140px'),
      assert.equal(value38[1].style.left, '160px'),
      assert.equal(value38[1].style.width, '40px'),
      assert.notEqual(el11.querySelector('.storyboard-custom-grid-line-vertical'), null));
  } finally {
    ((globalThis.document = value36), (appStore.updateNodeData = value37));
  }
}),
  test('StoryboardNode: 拖动分割线预览只移动线不移动内容块', async () => {
    const value43 = globalThis.document,
      value44 = appStore.updateNodeData,
      dom2 = createFakeDocument(),
      list16 = [],
      handler5 = (value45) =>
        Array.from(value45).map((display) => ({
          display: display.style.display,
          left: display.style.left,
          top: display.style.top,
          width: display.style.width,
          height: display.style.height,
        }));
    ((globalThis.document = dom2),
      (appStore.updateNodeData = (id2, patch2) => {
        list16.push({ id: id2, patch: patch2 });
      }));
    try {
      const value46 = [
        {
          axis: 'columns',
          gap: 0,
          selector: '.storyboard-custom-grid-handle-vertical',
          down: { clientX: 150, clientY: 0 },
          move: { type: 'pointermove', clientX: 210, clientY: 0 },
          expectedLine: '70%',
          expectedHitSize: '18px',
        },
        {
          axis: 'columns',
          gap: 20,
          selector: '.storyboard-custom-grid-handle-vertical',
          down: { clientX: 150, clientY: 0 },
          move: { type: 'pointermove', clientX: 210, clientY: 0 },
          expectedLine: '70%',
          expectedHitSize: '20px',
        },
        {
          axis: 'columns',
          gap: 80,
          selector: '.storyboard-custom-grid-handle-vertical',
          down: { clientX: 150, clientY: 0 },
          move: { type: 'pointermove', clientX: 210, clientY: 0 },
          expectedLine: '70%',
          expectedHitSize: '80px',
        },
        {
          axis: 'rows',
          gap: 0,
          selector: '.storyboard-custom-grid-handle-horizontal',
          down: { clientX: 0, clientY: 100 },
          move: { type: 'pointermove', clientX: 0, clientY: 140 },
          expectedLine: '70%',
          expectedHitSize: '18px',
        },
        {
          axis: 'rows',
          gap: 20,
          selector: '.storyboard-custom-grid-handle-horizontal',
          down: { clientX: 0, clientY: 100 },
          move: { type: 'pointermove', clientX: 0, clientY: 140 },
          expectedLine: '70%',
          expectedHitSize: '20px',
        },
        {
          axis: 'rows',
          gap: 80,
          selector: '.storyboard-custom-grid-handle-horizontal',
          down: { clientX: 0, clientY: 100 },
          move: { type: 'pointermove', clientX: 0, clientY: 140 },
          expectedLine: '70%',
          expectedHitSize: '80px',
        },
      ];
      for (const gridGap of value46) {
        list16.length = 0;
        const storyboardNode2 = new StoryboardNode({
            id: 'sb-preview-' + gridGap.axis + '-' + gridGap.gap,
            type: 'storyboard',
            cols: 2,
            rows: 2,
            width: 300,
            height: 200,
            gridGap: gridGap.gap,
            cells: [
              { id: 'cell-1', isEmpty: true, url: '' },
              { id: 'cell-2', isEmpty: true, url: '' },
              { id: 'cell-3', isEmpty: true, url: '' },
              { id: 'cell-4', isEmpty: true, url: '' },
            ],
          }),
          el13 = storyboardNode2.mount();
        dom2.body.appendChild(el13);
        const value47 = el13.querySelectorAll('.sb-cell'),
          value48 = handler5(value47);
        storyboardNode2._grid.getBoundingClientRect = () => ({
          left: 0,
          top: 0,
          right: 300,
          bottom: 200,
          width: 300,
          height: 200,
        });
        const value49 = el13.querySelector('.act-split-lines');
        (value49.onclick(createButtonEvent(value49)), assert.deepEqual(handler5(value47), value48));
        const currentTarget2 = el13.querySelector(gridGap.selector);
        gridGap.axis === 'columns'
          ? assert.equal(currentTarget2.style.width, gridGap.expectedHitSize)
          : assert.equal(currentTarget2.style.height, gridGap.expectedHitSize);
        (currentTarget2.eventListeners.get('pointerdown')[0]({
          type: 'pointerdown',
          ...gridGap.down,
          pointerId: 1,
          currentTarget: currentTarget2,
          preventDefault() {},
          stopPropagation() {},
        }),
          dom2.dispatchEvent(gridGap.move),
          dom2.dispatchEvent({ type: 'pointerup' }),
          assert.equal(list16.length, 0),
          assert.deepEqual(handler5(value47), value48));
        const el14 = el13.querySelector(gridGap.selector);
        (gridGap.axis === 'columns'
          ? (assert.equal(el14.style.left, gridGap.expectedLine),
            assert.equal(el14.style.width, gridGap.expectedHitSize))
          : (assert.equal(el14.style.top, gridGap.expectedLine),
            assert.equal(el14.style.height, gridGap.expectedHitSize)),
          await value49.onclick(createButtonEvent(value49)),
          assert.equal(list16.length, 1),
          assert.notDeepEqual(handler5(value47), value48),
          el13.remove());
      }
    } finally {
      ((globalThis.document = value43), (appStore.updateNodeData = value44));
    }
  }),
  test('StoryboardNode: 外部刷新不会把编辑中的草稿线位套到内容块', () => {
    const value50 = globalThis.document,
      value51 = appStore.updateNodeData,
      dom3 = createFakeDocument();
    ((globalThis.document = dom3), (appStore.updateNodeData = () => {}));
    try {
      const args = new StoryboardNode({
          id: 'sb-draft-refresh',
          type: 'storyboard',
          cols: 2,
          rows: 2,
          width: 300,
          height: 200,
          gridGap: 80,
          cells: [
            { id: 'cell-1', isEmpty: true, url: '' },
            { id: 'cell-2', isEmpty: true, url: '' },
            { id: 'cell-3', isEmpty: true, url: '' },
            { id: 'cell-4', isEmpty: true, url: '' },
          ],
        }),
        el15 = args.mount();
      dom3.body.appendChild(el15);
      const value52 = el15.querySelectorAll('.sb-cell'),
        handler6 = () =>
          Array.from(value52).map((left2) => ({
            left: left2.style.left,
            top: left2.style.top,
            width: left2.style.width,
            height: left2.style.height,
          })),
        value53 = handler6();
      args._grid.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        right: 300,
        bottom: 200,
        width: 300,
        height: 200,
      });
      const value54 = el15.querySelector('.act-split-lines');
      value54.onclick(createButtonEvent(value54));
      const currentTarget3 = el15.querySelector('.storyboard-custom-grid-handle-vertical');
      (currentTarget3.eventListeners.get('pointerdown')[0]({
        type: 'pointerdown',
        clientX: 150,
        clientY: 0,
        pointerId: 1,
        currentTarget: currentTarget3,
        preventDefault() {},
        stopPropagation() {},
      }),
        dom3.dispatchEvent({ type: 'pointermove', clientX: 210, clientY: 0 }),
        args.update({ ...args._data, _bizRev: 2 }),
        assert.deepEqual(handler6(), value53),
        assert.equal(el15.querySelector('.storyboard-custom-grid-handle-vertical').style.left, '70%'));
    } finally {
      ((globalThis.document = value50), (appStore.updateNodeData = value51));
    }
  }),
  test('StoryboardNode: node-level puzzle source refreshes detached pieces', async () => {
    const value55 = globalThis.document,
      value56 = appStore.updateNodeData,
      dom4 = createFakeDocument(),
      list17 = [];
    let value57 = 0;
    ((globalThis.document = dom4),
      (appStore.updateNodeData = (id3, patch3) => {
        list17.push({ id: id3, patch: patch3 });
      }));
    try {
      const storyboardNode3 = new StoryboardNode({
        id: 'sb-node-source-refresh',
        type: 'storyboard',
        cols: 2,
        rows: 1,
        width: 200,
        height: 100,
        storyboardSourceUrl: '/output/full-source.png',
        storyboardSourceWidth: 200,
        storyboardSourceHeight: 100,
        cells: [
          {
            id: 'cell-piece',
            localPath: 'output/tile-0.png',
            sourceLocalPath: null,
            sourceUrl: '',
            storyboardSourceCrop: false,
            storyboardPiece: true,
            isEmpty: false,
          },
          { id: 'cell-empty', url: '', isEmpty: true },
        ],
      });
      ((storyboardNode3._refreshSourceBackedCellsForLayout = () => {
        return ((value57 += 1), Promise.resolve(null));
      }),
        (storyboardNode3._materializeCellsForConfirmedGrid = async (value58, value59, cells) => ({
          ok: true,
          cells: cells || storyboardNode3._data.cells || [],
          failedIndices: [],
        })));
      const el16 = storyboardNode3.mount();
      dom4.body.appendChild(el16);
      const value60 = el16.querySelector('.act-split-lines');
      (value60.onclick(createButtonEvent(value60)),
        (storyboardNode3._customGridDraft = { columns: [1.5, 0.5], rows: [1] }),
        await storyboardNode3._confirmCustomGridEdit(),
        assert.equal(value57, 0),
        assert.deepEqual(list17[0], {
          id: 'sb-node-source-refresh',
          patch: { gridGap: 0, gridLayout: { columns: [1.5, 0.5], rows: [1] } },
        }));
      const el17 = el16.querySelector('.storyboard-cell-img');
      (assert.equal(el17.getAttribute('src'), '/output/full-source.png'),
        assert.equal(el17.classList.contains('storyboard-cell-img--source-crop'), true),
        assert.notEqual(el16.querySelector('.storyboard-cell-source-cache'), null));
    } finally {
      ((globalThis.document = value55), (appStore.updateNodeData = value56));
    }
  }),
  test('StoryboardNode: 完成调整时不因来源缺失阻塞线位提交', async () => {
    const value61 = globalThis.document,
      value62 = appStore.updateNodeData,
      dom5 = createFakeDocument(),
      list18 = [];
    ((globalThis.document = dom5),
      (appStore.updateNodeData = (id4, patch4) => {
        list18.push({ id: id4, patch: patch4 });
      }));
    try {
      const storyboardNode4 = new StoryboardNode({
          id: 'sb-confirm-missing-source',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-piece',
              capturePreviewUrl: 'data:image/jpeg;base64,piece',
              storyboardPiece: true,
              storyboardLockedCell: true,
              sourceLocalPath: null,
              sourceUrl: '',
              isEmpty: false,
            },
            { id: 'cell-empty', url: '', isEmpty: true },
          ],
        }),
        el18 = storyboardNode4.mount();
      dom5.body.appendChild(el18);
      const el19 = el18.querySelector('.act-split-lines');
      (el19.onclick(createButtonEvent(el19)),
        (storyboardNode4._customGridDraft = { columns: [1.4, 0.6], rows: [1] }),
        await storyboardNode4._confirmCustomGridEdit(),
        assert.deepEqual(list18, [
          {
            id: 'sb-confirm-missing-source',
            patch: { gridGap: 0, gridLayout: { columns: [1.4, 0.6], rows: [1] } },
          },
        ]),
        assert.equal(storyboardNode4._isCustomGridEditing, false),
        assert.equal(storyboardNode4._isCustomGridConfirming, false),
        assert.equal(el19.classList.contains('active'), false),
        assert.equal(el18.querySelector('.storyboard-custom-grid-handle-vertical'), null),
        assert.notEqual(el18.querySelector('.storyboard-custom-grid-line-vertical'), null));
    } finally {
      ((globalThis.document = value61), (appStore.updateNodeData = value62));
    }
  }),
  test('StoryboardNode: locked storyboard cell renders baked crop full size', () => {
    const value63 = globalThis.document,
      dom6 = createFakeDocument();
    globalThis.document = dom6;
    try {
      const storyboardNode5 = new StoryboardNode({
          id: 'sb-locked-cutout',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          gridGap: 20,
          cells: [
            {
              id: 'cell-locked',
              capturePreviewUrl: 'data:image/jpeg;base64,locked',
              storyboardLockedCell: true,
              isEmpty: false,
            },
            { id: 'cell-1', url: '', isEmpty: true },
          ],
        }),
        el20 = storyboardNode5.mount();
      dom6.body.appendChild(el20);
      const el21 = el20.querySelectorAll('.sb-cell')[0].querySelector('img');
      (assert.equal(el21.getAttribute('src'), 'data:image/jpeg;base64,locked'),
        assert.equal(el21.style.position, ''),
        assert.equal(el21.style.left, ''),
        assert.equal(el21.style.top, ''),
        assert.equal(el21.style.width, '100%'),
        assert.equal(el21.style.height, '100%'),
        assert.equal(el21.style.objectFit, 'fill'));
    } finally {
      globalThis.document = value63;
    }
  }),
  test('StoryboardNode: 自定义分割线按 Esc 会取消且不提交', () => {
    const value64 = globalThis.document,
      value65 = appStore.updateNodeData,
      dom7 = createFakeDocument(),
      list19 = [];
    ((globalThis.document = dom7),
      (appStore.updateNodeData = (id5, patch5) => {
        list19.push({ id: id5, patch: patch5 });
      }));
    try {
      const storyboardNode6 = new StoryboardNode({
          id: 'sb-custom-grid-cancel',
          type: 'storyboard',
          cols: 2,
          rows: 2,
          width: 200,
          height: 100,
          cells: [
            { id: 'cell-1', isEmpty: true, url: '' },
            { id: 'cell-2', isEmpty: true, url: '' },
            { id: 'cell-3', isEmpty: true, url: '' },
            { id: 'cell-4', isEmpty: true, url: '' },
          ],
        }),
        el22 = storyboardNode6.mount();
      dom7.body.appendChild(el22);
      const el23 = el22.querySelector('.act-split-lines');
      (el23.onclick(createButtonEvent(el23)),
        assert.notEqual(el22.querySelector('.storyboard-custom-grid-overlay'), null),
        assert.notEqual(el22.querySelector('.storyboard-split-lines-menu'), null),
        dom7.dispatchEvent({
          type: 'keydown',
          key: 'Escape',
          preventDefault() {},
          stopPropagation() {},
        }),
        assert.equal(list19.length, 0),
        assert.equal(el23.classList.contains('active'), false),
        assert.notEqual(el22.querySelector('.storyboard-custom-grid-overlay'), null),
        assert.equal(el22.querySelector('.storyboard-custom-grid-handle-vertical'), null),
        assert.notEqual(el22.querySelector('.storyboard-custom-grid-line-vertical'), null),
        assert.equal(el22.querySelector('.storyboard-split-lines-menu'), null),
        assert.equal(storyboardNode6._grid.style.gridTemplateColumns, '1fr 1fr'),
        assert.equal(storyboardNode6._grid.style.gap, '0px'));
    } finally {
      ((globalThis.document = value64), (appStore.updateNodeData = value65));
    }
  }),
  test('StoryboardNode: 完成调整会立即退出而不等待源图刷新', async () => {
    const value66 = globalThis.document,
      value67 = appStore.updateNodeData,
      dom8 = createFakeDocument(),
      list20 = [];
    ((globalThis.document = dom8),
      (appStore.updateNodeData = (id6, patch6) => {
        list20.push({ id: id6, patch: patch6 });
      }));
    try {
      const cells2 = new StoryboardNode({
          id: 'sb-custom-grid-refresh-pending',
          type: 'storyboard',
          cols: 2,
          rows: 2,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-1',
              localPath: 'output/tile-0.png',
              sourceLocalPath: 'output/source.png',
              isEmpty: false,
            },
            { id: 'cell-2', isEmpty: true, url: '' },
            { id: 'cell-3', isEmpty: true, url: '' },
            { id: 'cell-4', isEmpty: true, url: '' },
          ],
        }),
        el24 = cells2.mount();
      (dom8.body.appendChild(el24),
        (cells2._materializeCellsForConfirmedGrid = async () => ({
          ok: false,
          cells: cells2._data.cells || [],
          failedIndices: [0],
        })));
      const el25 = el24.querySelector('.act-split-lines');
      (el25.onclick(createButtonEvent(el25)),
        assert.equal(el25.classList.contains('active'), true),
        assert.notEqual(el24.querySelector('.storyboard-split-lines-menu'), null),
        (cells2._customGridDraft = { columns: [1.2, 0.8], rows: [1, 1] }),
        await el25.onclick(createButtonEvent(el25)),
        assert.equal(el25.classList.contains('active'), false),
        assert.equal(el25.dataset.tooltip, '调整分割线'),
        assert.equal(el24.querySelector('.storyboard-split-lines-menu'), null),
        assert.equal(el24.classList.contains('is-custom-grid-mode'), false),
        assert.equal(el24.querySelector('.storyboard-custom-grid-handle-vertical'), null),
        assert.notEqual(el24.querySelector('.storyboard-custom-grid-line-vertical'), null),
        assert.deepEqual(list20, [
          {
            id: 'sb-custom-grid-refresh-pending',
            patch: { gridGap: 0, gridLayout: { columns: [1.2, 0.8], rows: [1, 1] } },
          },
        ]));
    } finally {
      ((globalThis.document = value66), (appStore.updateNodeData = value67));
    }
  }),
  test('StoryboardNode: 清空源裁剪格会立即显示空态', () => {
    const value68 = globalThis.document,
      dom9 = createFakeDocument();
    globalThis.document = dom9;
    try {
      const args2 = new StoryboardNode({
          id: 'sb-source-crop-empty',
          type: 'storyboard',
          cols: 1,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-1',
              localPath: 'output/tile-0.png',
              sourceLocalPath: 'output/source.png',
              sourceUrl: '/output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
          ],
        }),
        el26 = args2.mount();
      (dom9.body.appendChild(el26), assert.notEqual(el26.querySelector('.storyboard-cell-img'), null));
      const emptyStoryboardCell = normalizeEmptyStoryboardCell(args2._data.cells[0]);
      args2.update({ ...args2._data, cells: [emptyStoryboardCell], _bizRev: 1 });
      const value69 = el26.querySelector('.storyboard-empty-residual'),
        value70 = el26.querySelector('.storyboard-empty-cutout'),
        value71 = el26.querySelector('.storyboard-empty-residual-img');
      (assert.notEqual(value69, null),
        assert.notEqual(value70, null),
        assert.notEqual(value71, null),
        assert.equal(value71.getAttribute('src'), '/output/source.png'),
        assert.equal(el26.querySelector('.storyboard-cell-source-cache'), null));
    } finally {
      globalThis.document = value68;
    }
  }),
  test('StoryboardNode: 源裁剪格刷新后直接按源图裁剪显示', () => {
    const value72 = globalThis.document,
      dom10 = createFakeDocument();
    globalThis.document = dom10;
    try {
      const storyboardNode7 = new StoryboardNode({
          id: 'sb-source-crop-wait',
          type: 'storyboard',
          cols: 1,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-source',
              localPath: 'output/tile.png',
              sourceLocalPath: 'output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
          ],
        }),
        el27 = storyboardNode7.mount();
      dom10.body.appendChild(el27);
      const el28 = el27.querySelector('.sb-cell'),
        el29 = el28.querySelector('.storyboard-cell-img'),
        value73 = el28.querySelector('.storyboard-cell-source-cache'),
        value74 = el27.querySelector('.storyboard-source-backdrop');
      (assert.notEqual(value73, null),
        el29.setAttribute('src', '/output/tile.png'),
        el29.classList.remove('storyboard-cell-img--source-crop'),
        (value73.complete = false),
        (value73.naturalWidth = 0),
        (value73.naturalHeight = 0),
        (value74.complete = false),
        (value74.naturalWidth = 0),
        (value74.naturalHeight = 0),
        storyboardNode7._applyCellCropStyles(el28, storyboardNode7._data.cells[0], 0),
        assert.equal(el29.getAttribute('src'), '/output/source.png'),
        assert.equal(el29.classList.contains('storyboard-cell-img--source-crop'), true),
        assert.equal(el29.style.left, '0%'),
        assert.equal(el29.style.top, '0%'),
        assert.equal(el29.style.width, '100%'),
        assert.equal(el29.style.height, '100%'),
        (value73.complete = true),
        (value73.naturalWidth = 200),
        (value73.naturalHeight = 100),
        storyboardNode7._applyCellCropStyles(el28, storyboardNode7._data.cells[0], 0),
        assert.equal(el29.getAttribute('src'), '/output/source.png'),
        assert.equal(el29.classList.contains('storyboard-cell-img--source-crop'), true));
    } finally {
      globalThis.document = value72;
    }
  }),
  test('StoryboardNode: F5 重建时源裁剪格不使用旧预览图', () => {
    const value75 = globalThis.document,
      dom11 = createFakeDocument();
    globalThis.document = dom11;
    try {
      const storyboardNode8 = new StoryboardNode({
          id: 'sb-source-crop-reload-preview',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-stale-preview',
              capturePreviewUrl: 'data:image/jpeg;base64,stale-preview',
              sourceLocalPath: 'output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              storyboardSourceCrop: true,
              storyboardSourceIndex: 1,
              isEmpty: false,
            },
            { id: 'cell-empty', url: '', isEmpty: true },
          ],
        }),
        el30 = storyboardNode8.mount();
      dom11.body.appendChild(el30);
      const el31 = el30.querySelector('.storyboard-cell-img');
      (assert.equal(el31.getAttribute('src'), '/output/source.png'),
        assert.equal(el31.classList.contains('storyboard-cell-img--source-crop'), true),
        assert.equal(el31.style.left, '-100%'),
        assert.equal(el31.style.width, '200%'));
    } finally {
      globalThis.document = value75;
    }
  }),
  test('StoryboardNode: 冻结实际图优先于残留源裁剪字段', () => {
    const value76 = globalThis.document,
      fakeDocument = createFakeDocument();
    globalThis.document = fakeDocument;
    try {
      const storyboardNode9 = new StoryboardNode({
        id: 'sb-frozen-display-priority',
        type: 'storyboard',
        cols: 2,
        rows: 1,
        width: 200,
        height: 100,
        storyboardSourceLocalPath: 'output/full-source.png',
        cells: [],
      });
      (assert.equal(
        storyboardNode9._getCellDisplayImageUrl({
          id: 'cell-frozen',
          localPath: 'output/extracted.jpg',
          sourceLocalPath: 'output/full-source.png',
          storyboardSourceCrop: true,
          storyboardPiece: true,
          storyboardExtractedCell: true,
          isEmpty: false,
        }),
        '/output/extracted.jpg',
      ),
        assert.equal(
          storyboardNode9._getCellDisplayImageUrl({
            id: 'cell-live',
            localPath: 'output/stale.jpg',
            sourceLocalPath: 'output/full-source.png',
            storyboardSourceCrop: true,
            isEmpty: false,
          }),
          '/output/full-source.png',
        ));
    } finally {
      globalThis.document = value76;
    }
  }),
  test('StoryboardNode: 合成按当前显示样式裁切', async () => {
    const value77 = globalThis.document,
      el32 = createFakeDocument();
    globalThis.document = el32;
    try {
      const cell = new StoryboardNode({
          id: 'sb-compose-source-first',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-source',
              localPath: 'output/tile-0.png',
              sourceLocalPath: 'output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              storyboardSourceCrop: true,
              storyboardSourceIndex: 0,
              isEmpty: false,
            },
          ],
        }),
        list21 = [],
        list22 = [],
        value78 = {
          drawImage(...args3) {
            list22.push(args3);
          },
        },
        loadImage = async (src) => {
          return (list21.push(src), { src: src, naturalWidth: 200, naturalHeight: 100 });
        },
        imageEl = el32.createElement('img');
      (imageEl.classList.add('storyboard-cell-img', 'storyboard-cell-img--source-crop'),
        imageEl.setAttribute('src', '/output/source.png'),
        (imageEl.style.left = '-100%'),
        (imageEl.style.top = '0%'),
        (imageEl.style.width = '200%'),
        (imageEl.style.height = '100%'),
        (imageEl.style.objectFit = 'fill'));
      const value79 = await cell._drawComposeCell(value78, {
        cell: cell._data.cells[0],
        cellIndex: 0,
        displayUrl: '/output/source.png',
        imageEl: imageEl,
        target: { x0: 0, y0: 0, drawW: 50, drawH: 100 },
        loadImage: loadImage,
      });
      (assert.equal(value79, true),
        assert.deepEqual(list21, ['/output/source.png']),
        assert.equal(list22.length, 1),
        assert.equal(list22[0][0].src, '/output/source.png'),
        assert.deepEqual(list22[0].slice(1), [100, 0, 100, 100, 0, 0, 50, 100]));
    } finally {
      globalThis.document = value77;
    }
  }),
  test('StoryboardNode: 合成当前显示图加载失败不画旧图', async () => {
    const value80 = globalThis.document,
      el33 = createFakeDocument();
    globalThis.document = el33;
    try {
      const cell2 = new StoryboardNode({
          id: 'sb-compose-source-no-fallback',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-source',
              localPath: 'output/tile-0.png',
              sourceLocalPath: 'output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              storyboardSourceCrop: true,
              storyboardSourceIndex: 1,
              isEmpty: false,
            },
          ],
        }),
        list23 = [],
        list24 = [],
        value81 = {
          drawImage(...args4) {
            list24.push(args4);
          },
        },
        loadImage2 = async (value82) => {
          return (list23.push(value82), null);
        },
        imageEl2 = el33.createElement('img');
      (imageEl2.classList.add('storyboard-cell-img', 'storyboard-cell-img--source-crop'),
        imageEl2.setAttribute('src', '/output/source.png'),
        (imageEl2.style.left = '-100%'),
        (imageEl2.style.top = '0%'),
        (imageEl2.style.width = '200%'),
        (imageEl2.style.height = '100%'),
        (imageEl2.style.objectFit = 'fill'));
      const value83 = await cell2._drawComposeCell(value81, {
        cell: cell2._data.cells[0],
        cellIndex: 0,
        displayUrl: '/output/source.png',
        imageEl: imageEl2,
        target: { x0: 0, y0: 0, drawW: 50, drawH: 100 },
        loadImage: loadImage2,
      });
      (assert.equal(value83, false),
        assert.deepEqual(list23, ['/output/source.png']),
        assert.equal(list24.length, 0));
    } finally {
      globalThis.document = value80;
    }
  }),
  test('StoryboardNode: 拖出源裁剪格后清空格子内容', () => {
    const value84 = globalThis.document,
      dom12 = createFakeDocument();
    globalThis.document = dom12;
    try {
      const args5 = new StoryboardNode({
          id: 'sb-source-crop-empty-slot',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          gridGap: 20,
          cells: [
            {
              id: 'cell-1',
              localPath: 'output/tile-0.png',
              sourceLocalPath: 'output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
            {
              id: 'cell-2',
              localPath: 'output/tile-1.png',
              sourceLocalPath: 'output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
          ],
        }),
        el34 = args5.mount();
      dom12.body.appendChild(el34);
      const value85 = { ...normalizeEmptyStoryboardCell(args5._data.cells[0]) };
      args5.update({ ...args5._data, cells: [value85, args5._data.cells[1]], _bizRev: 1 });
      const el35 = el34.querySelectorAll('.sb-cell')[0],
        el36 = el35.querySelector('.storyboard-empty-residual-img'),
        el37 = el35.querySelector('.storyboard-empty-cutout');
      (assert.notEqual(el36, null),
        assert.notEqual(el37, null),
        assert.equal(el36.getAttribute('src'), '/output/source.png'),
        assert.equal(el36.classList.contains('storyboard-cell-img'), false),
        assert.equal(el36.style.left, '0%'),
        assert.equal(el36.style.width, '222.22222222222223%'),
        assert.equal(el36.style.height, '100%'),
        assert.equal(el37.style.left, '0'),
        assert.equal(el37.style.width, '100%'),
        assert.equal(el35.style.left, '0px'),
        assert.equal(el35.style.width, '90px'));
    } finally {
      globalThis.document = value84;
    }
  }),
  test('StoryboardNode: 放回已提取分镜只填充真实空洞区域', () => {
    const value86 = globalThis.document,
      dom13 = createFakeDocument();
    globalThis.document = dom13;
    try {
      const storyboardNode10 = new StoryboardNode({
          id: 'sb-extracted-cutout-fill',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          gridGap: 20,
          cells: [
            {
              id: 'cell-1',
              localPath: 'output/extracted.png',
              residualImageLocalPath: 'output/source.png',
              residualImageWidth: 200,
              residualImageHeight: 100,
              residualImageMode: 'source',
              storyboardExtractedCell: true,
              isEmpty: false,
            },
            { id: 'cell-2', localPath: 'output/tile-1.png', isEmpty: false },
          ],
        }),
        el38 = storyboardNode10.mount();
      dom13.body.appendChild(el38);
      const el39 = el38.querySelectorAll('.sb-cell')[0],
        el40 = el39.querySelector('.storyboard-empty-residual-img'),
        el41 = el39.querySelector('.storyboard-cell-img');
      (assert.notEqual(el40, null),
        assert.notEqual(el41, null),
        assert.equal(el41.getAttribute('src'), '/output/extracted.png'),
        assert.equal(el39.style.left, '0px'),
        assert.equal(el39.style.width, '90px'),
        assert.equal(el41.style.position, ''),
        assert.equal(el41.style.left, ''),
        assert.equal(el41.style.top, ''),
        assert.equal(el41.style.width, '100%'),
        assert.equal(el41.style.height, '100%'),
        assert.equal(el40.getAttribute('src'), '/output/source.png'),
        assert.equal(el40.style.left, '0%'),
        assert.equal(el40.style.width, '222.22222222222223%'));
    } finally {
      globalThis.document = value86;
    }
  }),
  test('StoryboardNode: 已提取分镜的实际图层压在残影之上', () => {
    const value87 = NODE_TYPES_CSS.match(
      /\.storyboard-extracted-cell-content\s+\.storyboard-empty-residual-img\s*\{(?<body>[^}]*)\}/s,
    );
    (assert.ok(value87?.groups?.body), assert.match(value87.groups.body, /z-index:\s*0/));
    const value88 = NODE_TYPES_CSS.match(
      /\.storyboard-extracted-cell-content\s+\.storyboard-cell-img--extracted-cutout\s*\{(?<body>[^}]*)\}/s,
    );
    (assert.ok(value88?.groups?.body),
      assert.match(value88.groups.body, /position:\s*relative/),
      assert.match(value88.groups.body, /z-index:\s*1/));
  }),
  test('StoryboardNode: 空洞残留源图按当前线位和间距对齐', () => {
    const value89 = globalThis.document,
      dom14 = createFakeDocument();
    globalThis.document = dom14;
    try {
      const storyboardNode11 = new StoryboardNode({
          id: 'sb-empty-custom-slot',
          type: 'storyboard',
          cols: 2,
          rows: 2,
          width: 300,
          height: 200,
          gridGap: 20,
          gridLayout: { columns: [1.5, 0.5], rows: [0.5, 1.5] },
          cells: [
            { id: 'cell-0', localPath: 'output/a.png', isEmpty: false },
            { id: 'cell-1', localPath: 'output/b.png', isEmpty: false },
            { id: 'cell-2', localPath: 'output/c.png', isEmpty: false },
            {
              id: 'cell-3',
              isEmpty: true,
              residualImageLocalPath: 'output/source.png',
              residualImageWidth: 300,
              residualImageHeight: 200,
              residualImageMode: 'source',
            },
          ],
        }),
        el42 = storyboardNode11.mount();
      dom14.body.appendChild(el42);
      const el43 = el42.querySelectorAll('.sb-cell')[3],
        el44 = el43.querySelector('.storyboard-empty-residual-img'),
        el45 = el43.querySelector('.storyboard-empty-cutout');
      (assert.equal(el43.style.left, '235px'),
        assert.equal(el43.style.top, '60px'),
        assert.equal(el43.style.width, '65px'),
        assert.equal(el43.style.height, '140px'),
        assert.notEqual(el44, null),
        assert.notEqual(el45, null),
        assert.equal(el44.getAttribute('src'), '/output/source.png'),
        assert.equal(el44.style.left, '-361.53846153846155%'),
        assert.equal(el44.style.top, '-42.857142857142854%'),
        assert.equal(el44.style.width, '461.5384615384615%'),
        assert.equal(el44.style.height, '142.85714285714286%'),
        assert.equal(el45.style.left, '0'),
        assert.equal(el45.style.top, '0'),
        assert.equal(el45.style.width, '100%'),
        assert.equal(el45.style.height, '100%'));
    } finally {
      globalThis.document = value89;
    }
  }),
  test('StoryboardNode: actual cropped extracted cell without residual fills cell', () => {
    const value90 = globalThis.document,
      dom15 = createFakeDocument();
    globalThis.document = dom15;
    try {
      const storyboardNode12 = new StoryboardNode({
          id: 'sb-extracted-actual-crop',
          type: 'storyboard',
          cols: 3,
          rows: 3,
          width: 300,
          height: 300,
          gridGap: 80,
          cells: [
            { id: 'cell-0', url: '', isEmpty: true },
            { id: 'cell-1', url: '', isEmpty: true },
            { id: 'cell-2', url: '', isEmpty: true },
            { id: 'cell-3', url: '', isEmpty: true },
            {
              id: 'cell-4',
              localPath: 'output/real-crop.png',
              storyboardExtractedCell: true,
              isEmpty: false,
            },
            { id: 'cell-5', url: '', isEmpty: true },
            { id: 'cell-6', url: '', isEmpty: true },
            { id: 'cell-7', url: '', isEmpty: true },
            { id: 'cell-8', url: '', isEmpty: true },
          ],
        }),
        el46 = storyboardNode12.mount();
      dom15.body.appendChild(el46);
      const el47 = el46.querySelectorAll('.sb-cell')[4].querySelector('img');
      (assert.equal(el47.getAttribute('src'), '/output/real-crop.png'),
        assert.equal(el47.style.position, ''),
        assert.equal(el47.style.left, ''),
        assert.equal(el47.style.top, ''),
        assert.equal(el47.style.width, '100%'),
        assert.equal(el47.style.height, '100%'),
        assert.equal(el47.style.objectFit, 'fill'));
    } finally {
      globalThis.document = value90;
    }
  }),
  test('StoryboardNode: 调整分割线时空格保持空态', async () => {
    const value91 = globalThis.document,
      value92 = appStore.updateNodeData,
      dom16 = createFakeDocument(),
      list25 = [];
    let value93 = 0;
    ((globalThis.document = dom16),
      (appStore.updateNodeData = (id7, patch7) => {
        list25.push({ id: id7, patch: patch7 });
      }));
    try {
      const storyboardNode13 = new StoryboardNode({
        id: 'sb-source-crop-empty-edit',
        type: 'storyboard',
        cols: 2,
        rows: 1,
        width: 200,
        height: 100,
        gridGap: 80,
        cells: [
          { id: 'cell-empty', url: '', isEmpty: true },
          {
            id: 'cell-filled',
            localPath: 'output/tile-1.png',
            sourceLocalPath: 'output/source.png',
            sourceWidth: 200,
            sourceHeight: 100,
            isEmpty: false,
          },
        ],
      });
      ((storyboardNode13._refreshSourceBackedCellsForLayout = () => {
        return ((value93 += 1), Promise.resolve(null));
      }),
        (storyboardNode13._materializeCellsForConfirmedGrid = async (value94, value95, cells3) => ({
          ok: true,
          cells: cells3 || storyboardNode13._data.cells || [],
          failedIndices: [],
        })));
      const el48 = storyboardNode13.mount();
      dom16.body.appendChild(el48);
      const el49 = el48.querySelectorAll('.sb-cell')[1].querySelector('img');
      (assert.equal(el49.getAttribute('src'), '/output/source.png'),
        assert.equal(el49.classList.contains('storyboard-cell-img--source-crop'), true));
      const value96 = el48.querySelector('.act-split-lines');
      (value96.onclick(createButtonEvent(value96)),
        (storyboardNode13._customGridDraft = { columns: [1.5, 0.5], rows: [1] }),
        await storyboardNode13._confirmCustomGridEdit(),
        assert.equal(list25.length, 1),
        assert.deepEqual(list25[0].patch, { gridGap: 80, gridLayout: { columns: [1.5, 0.5], rows: [1] } }),
        assert.equal(value93, 0));
    } finally {
      ((globalThis.document = value91), (appStore.updateNodeData = value92));
    }
  }),
  test('StoryboardNode: 空格残留源图字段时也不进入源图裁剪渲染', () => {
    const value97 = globalThis.document,
      dom17 = createFakeDocument();
    globalThis.document = dom17;
    try {
      const storyboardNode14 = new StoryboardNode({
          id: 'sb-empty-stale-source',
          type: 'storyboard',
          cols: 1,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-empty-stale-source',
              url: '',
              isEmpty: true,
              sourceLocalPath: 'output/source.png',
              sourceUrl: '/output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              storyboardSourceCrop: true,
            },
          ],
        }),
        el50 = storyboardNode14.mount();
      (dom17.body.appendChild(el50),
        assert.equal(el50.querySelector('.storyboard-cell-img'), null),
        assert.ok(el50.querySelector('.empty-placeholder')));
    } finally {
      globalThis.document = value97;
    }
  }),
  test('StoryboardNode: 编辑分镜和调整分割线互斥', () => {
    const value98 = globalThis.document,
      value99 = appStore.updateNodeData,
      dom18 = createFakeDocument(),
      list26 = [];
    ((globalThis.document = dom18),
      (appStore.updateNodeData = (id8, patch8) => {
        list26.push({ id: id8, patch: patch8 });
      }));
    try {
      const storyboardNode15 = new StoryboardNode({
          id: 'sb-custom-grid-exclusive',
          type: 'storyboard',
          cols: 2,
          rows: 2,
          width: 200,
          height: 100,
          isEditing: true,
          cells: [
            { id: 'cell-1', isEmpty: true, url: '' },
            { id: 'cell-2', isEmpty: true, url: '' },
            { id: 'cell-3', isEmpty: true, url: '' },
            { id: 'cell-4', isEmpty: true, url: '' },
          ],
        }),
        el51 = storyboardNode15.mount();
      dom18.body.appendChild(el51);
      const el52 = el51.querySelector('.act-split-lines'),
        el53 = el51.querySelector('.act-edit');
      (assert.equal(el53.classList.contains('active'), true),
        assert.equal(el53.dataset.tooltip, '退出编辑分镜'),
        assert.equal(el52.dataset.tooltip, '调整分割线'),
        el52.onclick(createButtonEvent(el52)),
        assert.equal(el53.classList.contains('active'), false),
        assert.equal(el53.dataset.tooltip, '编辑分镜'),
        assert.equal(el52.classList.contains('active'), true),
        assert.equal(el52.dataset.tooltip, '完成调整'),
        assert.deepEqual(list26[0].patch, { isEditing: false }),
        el53.onclick(createButtonEvent(el53)),
        assert.equal(el52.classList.contains('active'), false),
        assert.equal(el52.dataset.tooltip, '调整分割线'),
        assert.equal(el51.querySelector('.storyboard-custom-grid-handle-vertical'), null),
        assert.notEqual(el51.querySelector('.storyboard-custom-grid-line-vertical'), null),
        assert.equal(el53.classList.contains('active'), true),
        assert.equal(el53.dataset.tooltip, '退出编辑分镜'),
        assert.deepEqual(list26[1].patch, { isEditing: true }));
    } finally {
      ((globalThis.document = value98), (appStore.updateNodeData = value99));
    }
  }),
  test('StoryboardNode: 自定义线显示层按当前线位裁切源图', () => {
    const value100 = globalThis.document,
      dom19 = createFakeDocument();
    globalThis.document = dom19;
    try {
      const storyboardNode16 = new StoryboardNode({
          id: 'sb-source-crop',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          gridLayout: { columns: [1.5, 0.5], rows: [1] },
          cells: [
            {
              id: 'cell-1',
              localPath: 'output/tile-0.png',
              sourceLocalPath: 'output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
            {
              id: 'cell-2',
              localPath: 'output/tile-1.png',
              sourceLocalPath: 'output/source.png',
              sourceWidth: 200,
              sourceHeight: 100,
              isEmpty: false,
            },
          ],
        }),
        el54 = storyboardNode16.mount();
      dom19.body.appendChild(el54);
      const value101 = el54.querySelectorAll('.sb-cell'),
        el55 = value101[1].querySelector('img');
      (assert.equal(storyboardNode16._grid.style.gridTemplateColumns, '1fr 1fr'),
        assert.equal(value101[0].style.left, '0px'),
        assert.equal(value101[0].style.width, '150px'),
        assert.equal(value101[1].style.left, '150px'),
        assert.equal(value101[1].style.width, '50px'),
        assert.equal(el55.getAttribute('src'), '/output/source.png'),
        assert.equal(el55.classList.contains('storyboard-cell-img--source-crop'), true),
        assert.equal(el55.style.width, '400%'),
        assert.equal(el55.style.left, '-300%'));
    } finally {
      globalThis.document = value100;
    }
  }),
  test('StoryboardNode: 宫格间距控件只调整子宫格区域', async () => {
    const value102 = globalThis.document,
      value103 = globalThis.setTimeout,
      value104 = appStore.updateNodeData,
      dom20 = createFakeDocument(),
      list27 = [];
    let storyboardNode17 = null;
    ((globalThis.document = dom20),
      (globalThis.setTimeout = (handler7) => {
        return (handler7(), 1);
      }),
      (appStore.updateNodeData = (id9, patch9) => {
        list27.push({ id: id9, patch: patch9 });
      }));
    try {
      const cells4 = Array.from({ length: 9 }, (value105, value106) => ({
        id: 'cell-' + value106,
        isEmpty: true,
        url: '',
      }));
      ((cells4[4] = {
        id: 'cell-center',
        localPath: 'output/tile-4.png',
        sourceLocalPath: 'output/source.png',
        sourceWidth: 300,
        sourceHeight: 300,
        isEmpty: false,
      }),
        (storyboardNode17 = new StoryboardNode({
          id: 'sb-line-gap',
          type: 'storyboard',
          cols: 3,
          rows: 3,
          width: 300,
          height: 300,
          cells: cells4,
        })));
      const el56 = storyboardNode17.mount();
      dom20.body.appendChild(el56);
      const el57 = el56.querySelector('.storyboard-container'),
        el58 = el57.querySelector('.storyboard-source-backdrop');
      (assert.notEqual(el58, null),
        assert.equal(el58.getAttribute('src'), '/output/source.png'),
        assert.equal(el58.style.objectFit, 'fill'),
        assert.equal(el58.style.opacity, '1'),
        assert.equal(el58.style.zIndex, '0'),
        assert.equal(storyboardNode17._grid.style.zIndex, '1'),
        assert.equal(el57.childNodes[0], el58),
        assert.equal(el57.childNodes[1], storyboardNode17._grid));
      const el59 = el56.querySelector('.act-split-lines');
      (assert.equal(storyboardNode17._container.style.background, 'var(--bg-node)'),
        assert.equal(storyboardNode17._grid.style.background, 'transparent'),
        assert.equal(el59.classList.contains('icon-only'), true),
        assert.equal(el59.querySelector('.storyboard-split-lines-label'), null),
        assert.equal(el59.querySelector('.storyboard-split-lines-menu-trigger'), null),
        assert.equal(storyboardNode17._grid.style.gap, '0px'));
      const el60 = el56.querySelectorAll('.sb-cell')[4],
        el61 = el60.querySelector('img');
      (assert.equal(el60.style.left, '100px'),
        assert.equal(el60.style.top, '100px'),
        assert.equal(el60.style.width, '100px'),
        assert.equal(el60.style.height, '100px'),
        assert.equal(el61.getAttribute('src'), '/output/source.png'),
        assert.equal(el61.style.width, '300%'),
        assert.equal(el61.style.left, '-100%'),
        el59.onclick(createButtonEvent(el59)));
      const el62 = el56.querySelector('.storyboard-split-lines-menu');
      (assert.notEqual(el62, null),
        assert.equal(el62.parentElement, el56.querySelector('.storyboard-toolbar')),
        assert.equal(el62.classList.contains('storyboard-toolbar-menu'), true));
      const target4 = el62.querySelector('input'),
        el63 = el62.querySelector('.storyboard-grid-gap-readout');
      (assert.notEqual(target4, null),
        assert.equal(target4.value, '0'),
        (target4.value = '80'),
        target4.eventListeners.get('input')[0]({ target: target4, stopPropagation() {} }),
        assert.equal(el63.textContent, '80px'),
        assert.equal(list27.length, 0),
        assert.equal(storyboardNode17._grid.style.gap, '0px'),
        assert.equal(el60.style.left, '100px'),
        assert.equal(el60.style.top, '100px'),
        assert.equal(el60.style.width, '100px'),
        assert.equal(el60.style.height, '100px'),
        assert.equal(el61.style.width, '300%'),
        assert.equal(el61.style.left, '-100%'),
        assert.equal(el58.getAttribute('src'), '/output/source.png'),
        assert.equal(el56.querySelector('.storyboard-grid-gap-band-vertical'), null),
        assert.equal(el56.querySelector('.storyboard-grid-gap-band-horizontal'), null));
      const list28 = el56.querySelectorAll('.storyboard-custom-grid-handle-vertical'),
        list29 = el56.querySelectorAll('.storyboard-custom-grid-handle-horizontal');
      (assert.equal(list28.length, 2),
        assert.equal(list29.length, 2),
        assert.equal(list28[0].style.left, '33.33333333333333%'),
        assert.equal(list28[0].style['--storyboard-grid-line-size'], '80px'),
        assert.equal(list28[0].style['--storyboard-grid-line-half-size'], '40px'),
        assert.equal(list28[0].style.width, '80px'),
        assert.equal(list29[0].style.top, '33.33333333333333%'),
        assert.equal(list29[0].style['--storyboard-grid-line-size'], '80px'),
        assert.equal(list29[0].style['--storyboard-grid-line-half-size'], '40px'),
        assert.equal(list29[0].style.height, '80px'),
        assert.equal(storyboardNode17.hitTestCell(30, 150), 3),
        assert.equal(storyboardNode17.hitTestCell(100, 150), 3),
        assert.equal(storyboardNode17.hitTestCell(110, 150), 4),
        assert.equal(storyboardNode17.hitTestCell(150, 150), 4));
      let value107 = 0;
      ((storyboardNode17._refreshSourceBackedCellsForLayoutInBackground = () => {
        value107 += 1;
      }),
        (storyboardNode17._materializeCellsForConfirmedGrid = async (value108, value109, cells5) => ({
          ok: true,
          cells: cells5 || storyboardNode17._data.cells || [],
          failedIndices: [],
        })),
        await storyboardNode17._confirmCustomGridEdit(),
        assert.equal(list27.length, 1),
        assert.equal(list27[0].id, 'sb-line-gap'),
        assert.deepEqual(list27[0].patch, {
          gridGap: 80,
          gridLayout: { columns: [1, 1, 1], rows: [1, 1, 1] },
        }),
        assert.equal(el60.style.left, '140px'),
        assert.equal(el60.style.top, '140px'),
        assert.equal(el60.style.width, '20px'),
        assert.equal(el60.style.height, '20px'),
        assert.equal(el61.style.width, '1500%'),
        assert.equal(el61.style.left, '-700%'),
        assert.equal(value107, 0),
        assert.equal(el56.querySelectorAll('.storyboard-custom-grid-line-vertical').length, 2),
        assert.equal(el56.querySelectorAll('.storyboard-custom-grid-handle-vertical').length, 0));
    } finally {
      (storyboardNode17?._closeMenu(),
        (globalThis.document = value102),
        (globalThis.setTimeout = value103),
        (appStore.updateNodeData = value104));
    }
  }),
  test('StoryboardNode: edit-only update keeps spaced grid pixels untouched', () => {
    const value110 = globalThis.document,
      dom21 = createFakeDocument();
    globalThis.document = dom21;
    try {
      const cells6 = Array.from({ length: 9 }, (value111, value112) => ({
        id: 'cell-' + value112,
        isEmpty: true,
        url: '',
      }));
      cells6[4] = {
        id: 'cell-center',
        localPath: 'output/tile-4.png',
        sourceLocalPath: 'output/source.png',
        sourceWidth: 300,
        sourceHeight: 300,
        isEmpty: false,
      };
      const args6 = new StoryboardNode({
          id: 'sb-edit-spaced-grid',
          type: 'storyboard',
          cols: 3,
          rows: 3,
          width: 300,
          height: 300,
          gridGap: 80,
          isEditing: false,
          cells: cells6,
        }),
        el64 = args6.mount();
      dom21.body.appendChild(el64);
      const el65 = el64.querySelectorAll('.sb-cell')[4],
        el66 = el65.querySelector('img');
      (assert.equal(args6._grid.style.gap, '0px'),
        assert.equal(el65.style.left, '140px'),
        assert.equal(el65.style.top, '140px'),
        assert.equal(el65.style.width, '20px'),
        assert.equal(el65.style.height, '20px'),
        assert.equal(el66.getAttribute('src'), '/output/source.png'),
        assert.equal(el66.style.width, '1500%'),
        assert.equal(el66.style.left, '-700%'));
      let value113 = 0;
      ((args6._syncCustomGridOverlay = () => {
        value113 += 1;
      }),
        args6.update({ ...args6._data, isEditing: true }),
        assert.equal(value113, 0),
        assert.equal(el64.classList.contains('is-editing-mode'), true),
        assert.equal(args6._grid.style.gap, '0px'),
        assert.equal(el65.style.left, '140px'),
        assert.equal(el65.style.top, '140px'),
        assert.equal(el65.style.width, '20px'),
        assert.equal(el65.style.height, '20px'),
        assert.equal(el66.style.width, '1500%'),
        assert.equal(el66.style.left, '-700%'));
    } finally {
      globalThis.document = value110;
    }
  }),
  test('StoryboardNode: entering edit materializes source-backed cells as pieces', () => {
    const value114 = globalThis.document,
      value115 = appStore.updateNodeData,
      dom22 = createFakeDocument(),
      list30 = [];
    ((globalThis.document = dom22),
      (appStore.updateNodeData = (id10, patch10) => {
        list30.push({ id: id10, patch: patch10 });
      }));
    try {
      const storyboardNode18 = new StoryboardNode({
          id: 'sb-edit-materialize',
          type: 'storyboard',
          cols: 1,
          rows: 1,
          width: 100,
          height: 100,
          cells: [
            {
              id: 'cell-source',
              capturePreviewUrl: 'data:image/jpeg;base64,current-piece',
              sourceLocalPath: 'output/source.png',
              sourceUrl: '/output/source.png',
              sourceWidth: 300,
              sourceHeight: 300,
              storyboardSourceCrop: true,
              isEmpty: false,
            },
          ],
        }),
        el67 = storyboardNode18.mount();
      dom22.body.appendChild(el67);
      const value116 = el67.querySelector('.act-edit');
      (value116.onclick(createButtonEvent(value116)),
        assert.equal(list30.length, 1),
        assert.equal(list30[0].id, 'sb-edit-materialize'),
        assert.equal(list30[0].patch.isEditing, true),
        assert.equal(list30[0].patch.storyboardBackdropUrl, '/output/source.png'),
        assert.equal(list30[0].patch.cells.length, 1));
      const value117 = list30[0].patch.cells[0];
      (assert.equal(value117.capturePreviewUrl, 'data:image/jpeg;base64,current-piece'),
        assert.equal(value117.sourceLocalPath, null),
        assert.equal(value117.sourceUrl, ''),
        assert.equal(value117.sourceWidth, null),
        assert.equal(value117.sourceHeight, null),
        assert.equal(value117.storyboardSourceCrop, false),
        assert.equal(value117.storyboardLockedCell, true),
        assert.equal(value117.storyboardSourceIndex, 0),
        assert.equal(value117.pieceId, 'cell-source'),
        assert.equal(el67.querySelector('.storyboard-cell-source-cache'), null));
    } finally {
      ((globalThis.document = value114), (appStore.updateNodeData = value115));
    }
  }),
  test('StoryboardNode: clearing source context removes stale source cache', () => {
    const value118 = globalThis.document,
      dom23 = createFakeDocument();
    globalThis.document = dom23;
    try {
      const args7 = new StoryboardNode({
          id: 'sb-source-cache-clear',
          type: 'storyboard',
          cols: 1,
          rows: 1,
          width: 100,
          height: 100,
          cells: [
            {
              id: 'cell-source',
              capturePreviewUrl: 'data:image/jpeg;base64,current-piece',
              sourceLocalPath: 'output/source.png',
              sourceUrl: '/output/source.png',
              sourceWidth: 300,
              sourceHeight: 300,
              storyboardSourceCrop: true,
              isEmpty: false,
            },
          ],
        }),
        el68 = args7.mount();
      (dom23.body.appendChild(el68),
        assert.notEqual(el68.querySelector('.storyboard-cell-source-cache'), null),
        args7.update({
          ...args7._data,
          cells: [
            {
              ...args7._data.cells[0],
              sourceLocalPath: null,
              sourceUrl: '',
              sourceWidth: null,
              sourceHeight: null,
              storyboardSourceCrop: false,
            },
          ],
          _bizRev: 1,
        }),
        assert.equal(el68.querySelector('.storyboard-cell-source-cache'), null),
        assert.equal(
          el68.querySelector('.storyboard-cell-img').getAttribute('src'),
          'data:image/jpeg;base64,current-piece',
        ));
    } finally {
      globalThis.document = value118;
    }
  }),
  test('StoryboardNode: 子菜单挂在工具栏内跟随触发按钮', () => {
    const value119 = globalThis.document,
      value120 = globalThis.setTimeout,
      dom24 = createFakeDocument();
    ((globalThis.document = dom24),
      (globalThis.setTimeout = (handler8) => {
        return (handler8(), 1);
      }));
    try {
      const storyboardNode19 = new StoryboardNode({
          id: 'sb-menu-anchor',
          type: 'storyboard',
          cols: 2,
          rows: 2,
          width: 200,
          height: 100,
          cells: [
            { id: 'cell-1', isEmpty: true, url: '' },
            { id: 'cell-2', isEmpty: true, url: '' },
            { id: 'cell-3', isEmpty: true, url: '' },
            { id: 'cell-4', isEmpty: true, url: '' },
          ],
        }),
        el69 = storyboardNode19.mount();
      dom24.body.appendChild(el69);
      const value121 = el69.querySelector('.storyboard-toolbar'),
        el70 = el69.querySelector('.act-grid');
      el70.onclick(createButtonEvent(el70));
      const el71 = el69.querySelector('.v2-sb-dropdown');
      (assert.equal(el71.parentElement, value121),
        assert.equal(el71.classList.contains('storyboard-toolbar-menu'), true),
        assert.equal(el70.classList.contains('active'), true),
        storyboardNode19._closeMenu(),
        assert.equal(el69.querySelector('.v2-sb-dropdown'), null),
        assert.equal(el70.classList.contains('active'), false));
      const el72 = el69.querySelector('.act-split-lines');
      el72.onclick(createButtonEvent(el72));
      const el73 = el69.querySelector('.storyboard-split-lines-menu');
      (assert.notEqual(el73, null),
        assert.equal(el73.parentElement, value121),
        assert.equal(el73.classList.contains('storyboard-toolbar-menu'), true),
        assert.equal(el72.classList.contains('active'), true));
    } finally {
      ((globalThis.document = value119), (globalThis.setTimeout = value120));
    }
  }),
  test('StoryboardNode: 清空会把 cell 归一为空态', () => {
    const value122 = globalThis.document,
      value123 = appStore.updateNodeData,
      dom25 = createFakeDocument(),
      list31 = [];
    ((globalThis.document = dom25),
      (appStore.updateNodeData = (id11, patch11) => {
        list31.push({ id: id11, patch: patch11 });
      }));
    try {
      const storyboardNode20 = new StoryboardNode({
          id: 'sb-clear',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            {
              id: 'cell-1',
              row: 0,
              col: 0,
              localPath: 'output/main.png',
              thumbLocalPath: 'output/thumb.webp',
              thumbUrl: 'https://example.com/thumb.png',
              thumbId: 'thumb-1',
              sourceId: 'source-1',
              isEmpty: false,
            },
          ],
        }),
        el74 = storyboardNode20.mount();
      dom25.body.appendChild(el74);
      const value124 = el74.querySelector('.act-clear');
      (value124.onclick(createButtonEvent(value124)),
        assert.equal(list31.length, 1),
        assert.equal(list31[0].id, 'sb-clear'),
        assert.deepEqual(list31[0].patch.cells[0], {
          id: 'cell-1',
          row: 0,
          col: 0,
          localPath: null,
          originalLocalPath: null,
          displayLocalPath: null,
          thumbLocalPath: null,
          thumbUrl: '',
          thumbId: null,
          sourceId: null,
          sourceLocalPath: null,
          sourceUrl: '',
          sourceWidth: null,
          sourceHeight: null,
          storyboardSourceCrop: false,
          storyboardPiece: false,
          storyboardLockedCell: false,
          residualImageLocalPath: 'output/main.png',
          residualImageUrl: 'https://example.com/thumb.png',
          residualImageWidth: null,
          residualImageHeight: null,
          residualImageMode: 'cell',
          isEmpty: true,
          url: '',
        }));
    } finally {
      ((globalThis.document = value122), (appStore.updateNodeData = value123));
    }
  }),
  test('StoryboardNode: 同图填充新格子时不会挪走已有格子的 DOM', () => {
    const value125 = globalThis.document,
      dom26 = createFakeDocument();
    globalThis.document = dom26;
    try {
      const args8 = {
          id: 'sb-same-src',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          aspectRatio: '1:1',
          cells: [
            { id: 'cell-1', isEmpty: true, url: '' },
            { id: 'cell-2', localPath: 'output/shared.png', isEmpty: false },
          ],
        },
        storyboardNode21 = new StoryboardNode(args8),
        el75 = storyboardNode21.mount();
      dom26.body.appendChild(el75);
      const value126 = el75.querySelectorAll('.sb-cell');
      (assert.equal(value126[0].querySelector('img'), null),
        assert.notEqual(value126[1].querySelector('img'), null),
        storyboardNode21.update({
          ...args8,
          cells: [
            { id: 'cell-1', localPath: 'output/shared.png', isEmpty: false },
            { id: 'cell-2', localPath: 'output/shared.png', isEmpty: false },
          ],
        }));
      const value127 = el75.querySelectorAll('.sb-cell'),
        value128 = value127[0].querySelector('img'),
        value129 = value127[1].querySelector('img');
      (assert.notEqual(value128, null),
        assert.notEqual(value129, null),
        assert.notEqual(value128, value129),
        assert.equal(value128.getAttribute('src'), '/output/shared.png'),
        assert.equal(value129.getAttribute('src'), '/output/shared.png'));
    } finally {
      globalThis.document = value125;
    }
  }),
  test('StoryboardNode: applyImmediateCellSwap 会即时交换 DOM 且不改数据', () => {
    const value130 = globalThis.document,
      dom27 = createFakeDocument();
    globalThis.document = dom27;
    try {
      const value131 = {
          id: 'sb-immediate-swap',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          aspectRatio: '1:1',
          cells: [
            { id: 'cell-1', localPath: 'output/a.png', isEmpty: false },
            { id: 'cell-2', localPath: 'output/b.png', isEmpty: false },
          ],
        },
        storyboardNode22 = new StoryboardNode(value131),
        el76 = storyboardNode22.mount();
      dom27.body.appendChild(el76);
      const value132 = el76.querySelectorAll('.sb-cell');
      (assert.equal(value132[0].querySelector('img').getAttribute('src'), '/output/a.png'),
        assert.equal(value132[1].querySelector('img').getAttribute('src'), '/output/b.png'));
      const response = storyboardNode22.applyImmediateCellSwap(0, 1);
      (assert.equal(response.ok, true),
        assert.equal(value132[0].querySelector('img').getAttribute('src'), '/output/b.png'),
        assert.equal(value132[1].querySelector('img').getAttribute('src'), '/output/a.png'),
        assert.equal(storyboardNode22._data.cells[0].localPath, 'output/a.png'),
        assert.equal(storyboardNode22._data.cells[1].localPath, 'output/b.png'),
        response.revert(),
        assert.equal(value132[0].querySelector('img').getAttribute('src'), '/output/a.png'),
        assert.equal(value132[1].querySelector('img').getAttribute('src'), '/output/b.png'),
        assert.equal(storyboardNode22._data.cells[0].localPath, 'output/a.png'),
        assert.equal(storyboardNode22._data.cells[1].localPath, 'output/b.png'));
    } finally {
      globalThis.document = value130;
    }
  }),
  test('StoryboardNode: applyImmediateCellSwap 会拒绝非法目标', () => {
    const value133 = globalThis.document,
      dom28 = createFakeDocument();
    globalThis.document = dom28;
    try {
      const storyboardNode23 = new StoryboardNode({
          id: 'sb-immediate-invalid',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          cells: [
            { id: 'cell-1', localPath: 'output/a.png', isEmpty: false },
            { id: 'cell-2', localPath: 'output/b.png', isEmpty: false },
          ],
        }),
        el77 = storyboardNode23.mount();
      (dom28.body.appendChild(el77),
        assert.equal(storyboardNode23.applyImmediateCellSwap(0, 0).ok, false),
        assert.equal(storyboardNode23.applyImmediateCellSwap(-1, 1).ok, false),
        assert.equal(storyboardNode23.applyImmediateCellSwap(0, 99).ok, false));
      const el78 = el77.querySelectorAll('.sb-cell')[0].querySelector('.cell-content-wrap');
      (el78.remove(), assert.equal(storyboardNode23.applyImmediateCellSwap(0, 1).ok, false));
    } finally {
      globalThis.document = value133;
    }
  }),
  test('StoryboardNode: 互换已显示图片时直接复用现有图片不等待 load', () => {
    const value134 = globalThis.document,
      dom29 = createFakeDocument();
    globalThis.document = dom29;
    try {
      const args9 = {
          id: 'sb-swap-visible',
          type: 'storyboard',
          cols: 2,
          rows: 1,
          width: 200,
          height: 100,
          aspectRatio: '1:1',
          cells: [
            { id: 'cell-1', localPath: 'output/a.png', isEmpty: false },
            { id: 'cell-2', localPath: 'output/b.png', isEmpty: false },
          ],
        },
        storyboardNode24 = new StoryboardNode(args9),
        el79 = storyboardNode24.mount();
      (dom29.body.appendChild(el79),
        storyboardNode24.update({
          ...args9,
          cells: [
            { id: 'cell-1', localPath: 'output/b.png', isEmpty: false },
            { id: 'cell-2', localPath: 'output/a.png', isEmpty: false },
          ],
        }));
      const value135 = el79.querySelectorAll('.sb-cell'),
        el80 = value135[0].querySelector('.cell-content-wrap'),
        el81 = value135[1].querySelector('.cell-content-wrap'),
        el82 = el80.querySelector('img'),
        el83 = el81.querySelector('img');
      (assert.equal(el80.children.length, 1),
        assert.equal(el81.children.length, 1),
        assert.equal(el82.getAttribute('src'), '/output/b.png'),
        assert.equal(el83.getAttribute('src'), '/output/a.png'),
        assert.equal(el82.classList.contains('is-cell-preloading'), false),
        assert.equal(el83.classList.contains('is-cell-preloading'), false));
    } finally {
      globalThis.document = value134;
    }
  }));

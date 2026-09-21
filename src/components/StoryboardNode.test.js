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
  ['add'](..._0x46126c) {
    _0x46126c.forEach((_0x1d1ab7) => {
      if (_0x1d1ab7) this._items.add(String(_0x1d1ab7));
    });
  }
  ['remove'](..._0x5c9aa1) {
    _0x5c9aa1.forEach((_0x6039e7) => this._items.delete(String(_0x6039e7)));
  }
  ['contains'](_0x1bf4dd) {
    return this._items.has(String(_0x1bf4dd));
  }
  ['toggle'](_0x22edad, _0x4bf3ac) {
    const _0x583b7c = String(_0x22edad);
    if (_0x4bf3ac === true) return (this._items.add(_0x583b7c), true);
    if (_0x4bf3ac === false) return (this._items.delete(_0x583b7c), false);
    if (this._items.has(_0x583b7c)) return (this._items.delete(_0x583b7c), false);
    return (this._items.add(_0x583b7c), true);
  }
}
class FakeStyle {
  constructor() {
    ((this._props = {}), (this._priorities = {}));
  }
  ['setProperty'](_0xa1d2b7, _0x4d89c4, _0xd02c51 = '') {
    const _0xae191e = String(_0xa1d2b7),
      _0x1ec5f7 = String(_0x4d89c4);
    ((this._props[_0xae191e] = _0x1ec5f7),
      (this._priorities[_0xae191e] = String(_0xd02c51 || '')),
      (this[_0xae191e] = _0x1ec5f7));
  }
  ['getPropertyPriority'](_0x4cc8d1) {
    return this._priorities[String(_0x4cc8d1)] ?? '';
  }
  ['removeProperty'](_0x9444a3) {
    const _0x3c63e6 = String(_0x9444a3);
    (delete this._props[_0x3c63e6], delete this._priorities[_0x3c63e6], delete this[_0x3c63e6]);
  }
}
class FakeNode {
  constructor(_0x297579 = 1) {
    ((this.nodeType = _0x297579), (this.parentNode = null));
  }
  get ['parentElement']() {
    return this.parentNode instanceof FakeElement ? this.parentNode : null;
  }
}
class FakeTextNode extends FakeNode {
  constructor(_0x209839 = '') {
    (super(3), (this.textContent = String(_0x209839)));
  }
  ['cloneNode']() {
    return new FakeTextNode(this.textContent);
  }
}
class FakeDocumentFragment extends FakeNode {
  constructor() {
    (super(11), (this.children = []), (this.childNodes = []));
  }
  ['appendChild'](_0x3ff9b7) {
    if (!_0x3ff9b7) return _0x3ff9b7;
    _0x3ff9b7.parentNode && _0x3ff9b7.parentNode !== this && _0x3ff9b7.parentNode.removeChild?.(_0x3ff9b7);
    ((_0x3ff9b7.parentNode = this), this.childNodes.push(_0x3ff9b7));
    if (_0x3ff9b7 instanceof FakeElement) this.children.push(_0x3ff9b7);
    return _0x3ff9b7;
  }
}
function matchesSimpleSelector(_0x500a1d, _0x58f074) {
  if (!(_0x500a1d instanceof FakeElement)) return false;
  if (_0x58f074.startsWith('.')) return _0x500a1d.classList.contains(_0x58f074.slice(1));
  if (_0x58f074.startsWith('#')) return _0x500a1d.id === _0x58f074.slice(1);
  return _0x500a1d.tagName.toLowerCase() === _0x58f074.toLowerCase();
}
function matchesSelectorChain(_0x10c69d, _0x15544a) {
  const _0x4c9166 = String(_0x15544a || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (_0x4c9166.length === 0) return false;
  if (!matchesSimpleSelector(_0x10c69d, _0x4c9166[_0x4c9166.length - 1])) return false;
  let _0x40cec5 = _0x10c69d.parentElement;
  for (let _0x466cb1 = _0x4c9166.length - 2; _0x466cb1 >= 0; _0x466cb1--) {
    while (_0x40cec5 && !matchesSimpleSelector(_0x40cec5, _0x4c9166[_0x466cb1])) {
      _0x40cec5 = _0x40cec5.parentElement;
    }
    if (!_0x40cec5) return false;
    _0x40cec5 = _0x40cec5.parentElement;
  }
  return true;
}
class FakeElement extends FakeNode {
  constructor(_0x179741 = 'div', _0x49f2b1 = null) {
    (super(1),
      (this.tagName = String(_0x179741).toUpperCase()),
      (this.ownerDocument = _0x49f2b1),
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
  set ['className'](_0x3424ff) {
    ((this._className = String(_0x3424ff || '')),
      (this.classList = new FakeClassList()),
      this._className
        .split(/\s+/)
        .filter(Boolean)
        .forEach((_0x2d45d0) => this.classList.add(_0x2d45d0)));
  }
  get ['firstElementChild']() {
    return this.children[0] || null;
  }
  ['_appendSingleChild'](_0x1d2bb7) {
    if (!_0x1d2bb7) return _0x1d2bb7;
    _0x1d2bb7.parentNode && _0x1d2bb7.parentNode !== this && _0x1d2bb7.parentNode.removeChild?.(_0x1d2bb7);
    ((_0x1d2bb7.parentNode = this), this.childNodes.push(_0x1d2bb7));
    if (_0x1d2bb7 instanceof FakeElement) this.children.push(_0x1d2bb7);
    return _0x1d2bb7;
  }
  ['appendChild'](_0x46d92c) {
    if (!_0x46d92c) return _0x46d92c;
    if (_0x46d92c.nodeType === 11) {
      const _0x3139bf = [..._0x46d92c.childNodes];
      return (
        (_0x46d92c.childNodes.length = 0),
        (_0x46d92c.children.length = 0),
        _0x3139bf.forEach((_0xfd9a44) => this._appendSingleChild(_0xfd9a44)),
        _0x46d92c
      );
    }
    return this._appendSingleChild(_0x46d92c);
  }
  ['insertBefore'](_0x27aa58, _0x2f7e1b) {
    if (!_0x27aa58) return _0x27aa58;
    if (!_0x2f7e1b || _0x2f7e1b.parentNode !== this) return this.appendChild(_0x27aa58);
    if (_0x27aa58.nodeType === 11) {
      const _0x3c6d67 = [..._0x27aa58.childNodes];
      return (
        (_0x27aa58.childNodes.length = 0),
        (_0x27aa58.children.length = 0),
        _0x3c6d67.forEach((_0x1a4b96) => this.insertBefore(_0x1a4b96, _0x2f7e1b)),
        _0x27aa58
      );
    }
    _0x27aa58.parentNode && _0x27aa58.parentNode.removeChild?.(_0x27aa58);
    const _0xb5ee36 = this.childNodes.indexOf(_0x2f7e1b),
      _0x219493 = this.children.indexOf(_0x2f7e1b);
    return (
      (_0x27aa58.parentNode = this),
      this.childNodes.splice(_0xb5ee36, 0, _0x27aa58),
      _0x27aa58 instanceof FakeElement && this.children.splice(_0x219493, 0, _0x27aa58),
      _0x27aa58
    );
  }
  ['removeChild'](_0x409d76) {
    const _0x97176b = this.childNodes.indexOf(_0x409d76);
    if (_0x97176b >= 0) this.childNodes.splice(_0x97176b, 1);
    const _0x1571c1 = this.children.indexOf(_0x409d76);
    if (_0x1571c1 >= 0) this.children.splice(_0x1571c1, 1);
    return ((_0x409d76.parentNode = null), _0x409d76);
  }
  ['replaceChildren'](..._0x33df4e) {
    ([...this.childNodes].forEach((_0x4998b3) => this.removeChild(_0x4998b3)),
      _0x33df4e.forEach((_0x3165c6) => this.appendChild(_0x3165c6)));
  }
  ['remove']() {
    this.parentNode?.removeChild?.(this);
  }
  ['setAttribute'](_0x1fb59d, _0x5bc669) {
    const _0x40f029 = String(_0x1fb59d),
      _0xe9d85d = String(_0x5bc669);
    this.attributes.set(_0x40f029, _0xe9d85d);
    if (_0x40f029 === 'id') this.id = _0xe9d85d;
    if (_0x40f029 === 'class') this.className = _0xe9d85d;
  }
  ['getAttribute'](_0x45bc2e) {
    return this.attributes.get(String(_0x45bc2e)) ?? null;
  }
  ['addEventListener'](_0x56f1e8, _0x1958d3) {
    const _0x1b8efe = this.eventListeners.get(_0x56f1e8) || [];
    (_0x1b8efe.push(_0x1958d3), this.eventListeners.set(_0x56f1e8, _0x1b8efe));
  }
  ['removeEventListener'](_0x458943, _0x5d725a) {
    const _0x558517 = this.eventListeners.get(_0x458943) || [];
    this.eventListeners.set(
      _0x458943,
      _0x558517.filter((_0x29d090) => _0x29d090 !== _0x5d725a),
    );
  }
  ['closest'](_0x3253cf) {
    let _0x6daaae = this;
    while (_0x6daaae) {
      if (matchesSimpleSelector(_0x6daaae, _0x3253cf)) return _0x6daaae;
      _0x6daaae = _0x6daaae.parentElement;
    }
    return null;
  }
  ['contains'](_0x3d0441) {
    let _0x3f5a7c = _0x3d0441;
    while (_0x3f5a7c) {
      if (_0x3f5a7c === this) return true;
      _0x3f5a7c = _0x3f5a7c.parentNode;
    }
    return false;
  }
  ['querySelector'](_0x46e817) {
    return this.querySelectorAll(_0x46e817)[0] || null;
  }
  ['querySelectorAll'](_0x3f3c4e) {
    const _0x43ed6e = [],
      _0x2f4e71 = (_0x38de68) => {
        for (const _0x9de9db of _0x38de68.children || []) {
          if (matchesSelectorChain(_0x9de9db, _0x3f3c4e)) _0x43ed6e.push(_0x9de9db);
          _0x2f4e71(_0x9de9db);
        }
      };
    return (_0x2f4e71(this), _0x43ed6e);
  }
  ['cloneNode'](_0xdce80 = false) {
    const _0x458a21 = new FakeElement(this.tagName.toLowerCase(), this.ownerDocument);
    ((_0x458a21.id = this.id),
      (_0x458a21.className = this.className),
      (_0x458a21.textContent = this.textContent),
      (_0x458a21.dataset = { ...this.dataset }),
      (_0x458a21.style = Object.assign(new FakeStyle(), this.style)));
    for (const [_0x311a99, _0x586cb2] of this.attributes.entries()) {
      _0x458a21.attributes.set(_0x311a99, _0x586cb2);
    }
    return (
      _0xdce80 && this.childNodes.forEach((_0x43d391) => _0x458a21.appendChild(_0x43d391.cloneNode(true))),
      _0x458a21
    );
  }
  ['blur']() {}
  ['setPointerCapture']() {}
  ['getBoundingClientRect']() {
    return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  }
}
function createFakeDocument() {
  const _0x47f50e = new Map(),
    _0x4cf025 = {
      body: null,
      createElement(_0x16de4d) {
        return new FakeElement(_0x16de4d, _0x4cf025);
      },
      createElementNS(_0x28bb41, _0x3c9f53) {
        return new FakeElement(_0x3c9f53, _0x4cf025);
      },
      createTextNode(_0x55f04a) {
        return new FakeTextNode(_0x55f04a);
      },
      createDocumentFragment() {
        return new FakeDocumentFragment();
      },
      addEventListener(_0x58f6e4, _0x5319bb) {
        const _0x19a8b7 = String(_0x58f6e4),
          _0x4ef026 = _0x47f50e.get(_0x19a8b7) || [];
        (_0x4ef026.push(_0x5319bb), _0x47f50e.set(_0x19a8b7, _0x4ef026));
      },
      removeEventListener(_0x278149, _0x15ca23) {
        const _0x56331b = String(_0x278149),
          _0x27653b = _0x47f50e.get(_0x56331b) || [];
        _0x47f50e.set(
          _0x56331b,
          _0x27653b.filter((_0x41f293) => _0x41f293 !== _0x15ca23),
        );
      },
      dispatchEvent(_0xe983a6) {
        const _0x4ec6f7 = String(_0xe983a6?.type || ''),
          _0x5c4c66 = [...(_0x47f50e.get(_0x4ec6f7) || [])];
        return (_0x5c4c66.forEach((_0x408751) => _0x408751(_0xe983a6)), true);
      },
      importNode(_0x16a4be) {
        return _0x16a4be.cloneNode(true);
      },
      getElementById(_0xa5a002) {
        return _0x4cf025.body?.querySelector('#' + _0xa5a002) || null;
      },
    };
  return ((_0x4cf025.body = new FakeElement('body', _0x4cf025)), _0x4cf025);
}
function createButtonEvent(_0xa7b15) {
  return { stopPropagation() {}, target: _0xa7b15 };
}
(test('StoryboardNode: 自定义分割线按钮位于编辑左侧并且确定后才提交', async () => {
  const _0x35217e = globalThis.document,
    _0xd79ef5 = appStore.updateNodeData,
    _0x1ef11d = createFakeDocument(),
    _0x5804b9 = [];
  ((globalThis.document = _0x1ef11d),
    (appStore.updateNodeData = (_0x413037, _0x41b844) => {
      _0x5804b9.push({ id: _0x413037, patch: _0x41b844 });
    }));
  try {
    const _0x4c8af3 = new StoryboardNode({
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
      _0x5684d4 = _0x4c8af3.mount();
    _0x1ef11d.body.appendChild(_0x5684d4);
    const _0x46006b = _0x5684d4.querySelectorAll('.sb-cell'),
      _0x4e6f8f = (_0x4cc629) => ({
        left: _0x4cc629.style.left,
        top: _0x4cc629.style.top,
        width: _0x4cc629.style.width,
        height: _0x4cc629.style.height,
      }),
      _0x31fdd2 = _0x4e6f8f(_0x46006b[0]),
      _0xa0e39b = _0x4e6f8f(_0x46006b[1]),
      _0x3b2a94 = _0x5684d4.querySelector('.act-split-lines'),
      _0x4e0378 = _0x5684d4.querySelector('.act-edit'),
      _0x4f4706 = _0x5684d4.querySelectorAll('.storyboard-toolbar .ftb-btn');
    (assert.equal(_0x4f4706.indexOf(_0x3b2a94), _0x4f4706.indexOf(_0x4e0378) - 1),
      assert.equal(_0x3b2a94.classList.contains('icon-only'), true),
      assert.equal(_0x3b2a94.querySelector('.storyboard-split-lines-label'), null),
      assert.equal(_0x3b2a94.querySelector('.storyboard-split-lines-menu-trigger'), null),
      assert.equal(_0x3b2a94.querySelectorAll('circle').length, 2),
      _0x3b2a94.onclick(createButtonEvent(_0x3b2a94)),
      assert.equal(_0x3b2a94.classList.contains('active'), true),
      assert.equal(_0x3b2a94.classList.contains('is-confirm'), false),
      assert.equal(_0x3b2a94.querySelectorAll('circle').length, 2),
      assert.equal(_0x3b2a94.dataset.tooltip, '完成调整'),
      assert.equal(_0x5684d4.classList.contains('is-custom-grid-mode'), true),
      assert.equal(_0x5804b9.length, 0),
      assert.notEqual(_0x5684d4.querySelector('.storyboard-split-lines-menu'), null),
      assert.deepEqual(_0x4e6f8f(_0x46006b[0]), _0x31fdd2),
      assert.deepEqual(_0x4e6f8f(_0x46006b[1]), _0xa0e39b),
      (_0x4c8af3._grid.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        right: 200,
        bottom: 100,
        width: 200,
        height: 100,
      })));
    const _0x885b90 = _0x5684d4.querySelector('.storyboard-custom-grid-handle-vertical'),
      _0x268984 = _0x885b90.eventListeners.get('pointerdown')[0];
    (_0x268984({
      type: 'pointerdown',
      clientX: 100,
      clientY: 0,
      pointerId: 1,
      currentTarget: _0x885b90,
      preventDefault() {},
      stopPropagation() {},
    }),
      _0x1ef11d.dispatchEvent({ type: 'pointermove', clientX: 150, clientY: 0 }),
      _0x1ef11d.dispatchEvent({ type: 'pointerup' }),
      assert.equal(_0x5804b9.length, 0),
      assert.equal(_0x4c8af3._grid.style.gridTemplateColumns, '1fr 1fr'),
      assert.equal(_0x4c8af3._grid.style.gridTemplateRows, '1fr 1fr'),
      assert.equal(_0x4c8af3._grid.style.gap, '0px'),
      assert.deepEqual(_0x4e6f8f(_0x46006b[0]), _0x31fdd2),
      assert.deepEqual(_0x4e6f8f(_0x46006b[1]), _0xa0e39b),
      assert.equal(_0x5684d4.querySelector('.storyboard-custom-grid-handle-vertical').style.left, '75%'),
      _0x1ef11d.dispatchEvent({ type: 'pointerdown', target: _0x1ef11d.body }),
      assert.notEqual(_0x5684d4.querySelector('.storyboard-split-lines-menu'), null),
      assert.equal(_0x3b2a94.classList.contains('active'), true));
    const _0x151813 = _0x5684d4.querySelector('.act-aspect');
    (_0x151813.onclick(createButtonEvent(_0x151813)),
      assert.notEqual(_0x5684d4.querySelector('.storyboard-split-lines-menu'), null),
      await _0x3b2a94.onclick(createButtonEvent(_0x3b2a94)),
      assert.equal(_0x5804b9.length, 1),
      assert.equal(_0x5804b9[0].id, 'sb-custom-grid'),
      assert.deepEqual(_0x5804b9[0].patch.gridLayout, { columns: [1.5, 0.5], rows: [1, 1] }),
      assert.equal(_0x3b2a94.classList.contains('active'), false),
      assert.equal(_0x3b2a94.classList.contains('is-confirm'), false),
      assert.equal(_0x3b2a94.querySelectorAll('circle').length, 2),
      assert.equal(_0x3b2a94.dataset.tooltip, '调整分割线'),
      assert.equal(_0x5684d4.classList.contains('is-custom-grid-mode'), false),
      assert.equal(_0x5684d4.querySelector('.storyboard-split-lines-menu'), null),
      assert.equal(_0x46006b[0].style.left, '0px'),
      assert.equal(_0x46006b[0].style.width, '140px'),
      assert.equal(_0x46006b[1].style.left, '160px'),
      assert.equal(_0x46006b[1].style.width, '40px'),
      assert.notEqual(_0x5684d4.querySelector('.storyboard-custom-grid-line-vertical'), null));
  } finally {
    ((globalThis.document = _0x35217e), (appStore.updateNodeData = _0xd79ef5));
  }
}),
  test('StoryboardNode: 拖动分割线预览只移动线不移动内容块', async () => {
    const _0x437822 = globalThis.document,
      _0x205cfc = appStore.updateNodeData,
      _0x5110fa = createFakeDocument(),
      _0x11d670 = [],
      _0x3c0cce = (_0x8de8e7) =>
        Array.from(_0x8de8e7).map((_0x1a13ff) => ({
          display: _0x1a13ff.style.display,
          left: _0x1a13ff.style.left,
          top: _0x1a13ff.style.top,
          width: _0x1a13ff.style.width,
          height: _0x1a13ff.style.height,
        }));
    ((globalThis.document = _0x5110fa),
      (appStore.updateNodeData = (_0x541184, _0x19868b) => {
        _0x11d670.push({ id: _0x541184, patch: _0x19868b });
      }));
    try {
      const _0x26d282 = [
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
      for (const _0x8b5229 of _0x26d282) {
        _0x11d670.length = 0;
        const _0x1166f3 = new StoryboardNode({
            id: 'sb-preview-' + _0x8b5229.axis + '-' + _0x8b5229.gap,
            type: 'storyboard',
            cols: 2,
            rows: 2,
            width: 0x12c,
            height: 200,
            gridGap: _0x8b5229.gap,
            cells: [
              { id: 'cell-1', isEmpty: true, url: '' },
              { id: 'cell-2', isEmpty: true, url: '' },
              { id: 'cell-3', isEmpty: true, url: '' },
              { id: 'cell-4', isEmpty: true, url: '' },
            ],
          }),
          _0x4baed4 = _0x1166f3.mount();
        _0x5110fa.body.appendChild(_0x4baed4);
        const _0x43b2b8 = _0x4baed4.querySelectorAll('.sb-cell'),
          _0x524d87 = _0x3c0cce(_0x43b2b8);
        _0x1166f3._grid.getBoundingClientRect = () => ({
          left: 0,
          top: 0,
          right: 0x12c,
          bottom: 200,
          width: 0x12c,
          height: 200,
        });
        const _0xfd4307 = _0x4baed4.querySelector('.act-split-lines');
        (_0xfd4307.onclick(createButtonEvent(_0xfd4307)), assert.deepEqual(_0x3c0cce(_0x43b2b8), _0x524d87));
        const _0x55d067 = _0x4baed4.querySelector(_0x8b5229.selector);
        _0x8b5229.axis === 'columns'
          ? assert.equal(_0x55d067.style.width, _0x8b5229.expectedHitSize)
          : assert.equal(_0x55d067.style.height, _0x8b5229.expectedHitSize);
        (_0x55d067.eventListeners.get('pointerdown')[0]({
          type: 'pointerdown',
          ..._0x8b5229.down,
          pointerId: 1,
          currentTarget: _0x55d067,
          preventDefault() {},
          stopPropagation() {},
        }),
          _0x5110fa.dispatchEvent(_0x8b5229.move),
          _0x5110fa.dispatchEvent({ type: 'pointerup' }),
          assert.equal(_0x11d670.length, 0),
          assert.deepEqual(_0x3c0cce(_0x43b2b8), _0x524d87));
        const _0x486ccb = _0x4baed4.querySelector(_0x8b5229.selector);
        (_0x8b5229.axis === 'columns'
          ? (assert.equal(_0x486ccb.style.left, _0x8b5229.expectedLine),
            assert.equal(_0x486ccb.style.width, _0x8b5229.expectedHitSize))
          : (assert.equal(_0x486ccb.style.top, _0x8b5229.expectedLine),
            assert.equal(_0x486ccb.style.height, _0x8b5229.expectedHitSize)),
          await _0xfd4307.onclick(createButtonEvent(_0xfd4307)),
          assert.equal(_0x11d670.length, 1),
          assert.notDeepEqual(_0x3c0cce(_0x43b2b8), _0x524d87),
          _0x4baed4.remove());
      }
    } finally {
      ((globalThis.document = _0x437822), (appStore.updateNodeData = _0x205cfc));
    }
  }),
  test('StoryboardNode: 外部刷新不会把编辑中的草稿线位套到内容块', () => {
    const _0x47f9a3 = globalThis.document,
      _0x1b0fbd = appStore.updateNodeData,
      _0x482a03 = createFakeDocument();
    ((globalThis.document = _0x482a03), (appStore.updateNodeData = () => {}));
    try {
      const _0x3f2776 = new StoryboardNode({
          id: 'sb-draft-refresh',
          type: 'storyboard',
          cols: 2,
          rows: 2,
          width: 0x12c,
          height: 200,
          gridGap: 80,
          cells: [
            { id: 'cell-1', isEmpty: true, url: '' },
            { id: 'cell-2', isEmpty: true, url: '' },
            { id: 'cell-3', isEmpty: true, url: '' },
            { id: 'cell-4', isEmpty: true, url: '' },
          ],
        }),
        _0x1f5323 = _0x3f2776.mount();
      _0x482a03.body.appendChild(_0x1f5323);
      const _0x1d8cee = _0x1f5323.querySelectorAll('.sb-cell'),
        _0x437a54 = () =>
          Array.from(_0x1d8cee).map((_0x4bf685) => ({
            left: _0x4bf685.style.left,
            top: _0x4bf685.style.top,
            width: _0x4bf685.style.width,
            height: _0x4bf685.style.height,
          })),
        _0x25c70e = _0x437a54();
      _0x3f2776._grid.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        right: 0x12c,
        bottom: 200,
        width: 0x12c,
        height: 200,
      });
      const _0x5ca070 = _0x1f5323.querySelector('.act-split-lines');
      _0x5ca070.onclick(createButtonEvent(_0x5ca070));
      const _0x4aaabd = _0x1f5323.querySelector('.storyboard-custom-grid-handle-vertical');
      (_0x4aaabd.eventListeners.get('pointerdown')[0]({
        type: 'pointerdown',
        clientX: 150,
        clientY: 0,
        pointerId: 1,
        currentTarget: _0x4aaabd,
        preventDefault() {},
        stopPropagation() {},
      }),
        _0x482a03.dispatchEvent({ type: 'pointermove', clientX: 210, clientY: 0 }),
        _0x3f2776.update({ ..._0x3f2776._data, _bizRev: 2 }),
        assert.deepEqual(_0x437a54(), _0x25c70e),
        assert.equal(_0x1f5323.querySelector('.storyboard-custom-grid-handle-vertical').style.left, '70%'));
    } finally {
      ((globalThis.document = _0x47f9a3), (appStore.updateNodeData = _0x1b0fbd));
    }
  }),
  test('StoryboardNode: node-level puzzle source refreshes detached pieces', async () => {
    const _0x1a1f7f = globalThis.document,
      _0x40ef2d = appStore.updateNodeData,
      _0x327474 = createFakeDocument(),
      _0x1f83dd = [];
    let _0x8399bf = 0;
    ((globalThis.document = _0x327474),
      (appStore.updateNodeData = (_0x1d9c2e, _0x61b825) => {
        _0x1f83dd.push({ id: _0x1d9c2e, patch: _0x61b825 });
      }));
    try {
      const _0x17c693 = new StoryboardNode({
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
      ((_0x17c693._refreshSourceBackedCellsForLayout = () => {
        return ((_0x8399bf += 1), Promise.resolve(null));
      }),
        (_0x17c693._materializeCellsForConfirmedGrid = async (_0x170467, _0x55b2b0, _0x452a1f) => ({
          ok: true,
          cells: _0x452a1f || _0x17c693._data.cells || [],
          failedIndices: [],
        })));
      const _0x2d7f02 = _0x17c693.mount();
      _0x327474.body.appendChild(_0x2d7f02);
      const _0x3a2788 = _0x2d7f02.querySelector('.act-split-lines');
      (_0x3a2788.onclick(createButtonEvent(_0x3a2788)),
        (_0x17c693._customGridDraft = { columns: [1.5, 0.5], rows: [1] }),
        await _0x17c693._confirmCustomGridEdit(),
        assert.equal(_0x8399bf, 0),
        assert.deepEqual(_0x1f83dd[0], {
          id: 'sb-node-source-refresh',
          patch: { gridGap: 0, gridLayout: { columns: [1.5, 0.5], rows: [1] } },
        }));
      const _0x409f25 = _0x2d7f02.querySelector('.storyboard-cell-img');
      (assert.equal(_0x409f25.getAttribute('src'), '/output/full-source.png'),
        assert.equal(_0x409f25.classList.contains('storyboard-cell-img--source-crop'), true),
        assert.notEqual(_0x2d7f02.querySelector('.storyboard-cell-source-cache'), null));
    } finally {
      ((globalThis.document = _0x1a1f7f), (appStore.updateNodeData = _0x40ef2d));
    }
  }),
  test('StoryboardNode: 完成调整时不因来源缺失阻塞线位提交', async () => {
    const _0x1109c8 = globalThis.document,
      _0x4f1501 = appStore.updateNodeData,
      _0xc8c13f = createFakeDocument(),
      _0x3f1658 = [];
    ((globalThis.document = _0xc8c13f),
      (appStore.updateNodeData = (_0x3184e3, _0x230fc6) => {
        _0x3f1658.push({ id: _0x3184e3, patch: _0x230fc6 });
      }));
    try {
      const _0x41421b = new StoryboardNode({
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
        _0x4a6181 = _0x41421b.mount();
      _0xc8c13f.body.appendChild(_0x4a6181);
      const _0x22951d = _0x4a6181.querySelector('.act-split-lines');
      (_0x22951d.onclick(createButtonEvent(_0x22951d)),
        (_0x41421b._customGridDraft = { columns: [1.4, 0.6], rows: [1] }),
        await _0x41421b._confirmCustomGridEdit(),
        assert.deepEqual(_0x3f1658, [
          {
            id: 'sb-confirm-missing-source',
            patch: { gridGap: 0, gridLayout: { columns: [1.4, 0.6], rows: [1] } },
          },
        ]),
        assert.equal(_0x41421b._isCustomGridEditing, false),
        assert.equal(_0x41421b._isCustomGridConfirming, false),
        assert.equal(_0x22951d.classList.contains('active'), false),
        assert.equal(_0x4a6181.querySelector('.storyboard-custom-grid-handle-vertical'), null),
        assert.notEqual(_0x4a6181.querySelector('.storyboard-custom-grid-line-vertical'), null));
    } finally {
      ((globalThis.document = _0x1109c8), (appStore.updateNodeData = _0x4f1501));
    }
  }),
  test('StoryboardNode: locked storyboard cell renders baked crop full size', () => {
    const _0x366903 = globalThis.document,
      _0x52ea3c = createFakeDocument();
    globalThis.document = _0x52ea3c;
    try {
      const _0x526baf = new StoryboardNode({
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
        _0xd275d4 = _0x526baf.mount();
      _0x52ea3c.body.appendChild(_0xd275d4);
      const _0x223169 = _0xd275d4.querySelectorAll('.sb-cell')[0].querySelector('img');
      (assert.equal(_0x223169.getAttribute('src'), 'data:image/jpeg;base64,locked'),
        assert.equal(_0x223169.style.position, ''),
        assert.equal(_0x223169.style.left, ''),
        assert.equal(_0x223169.style.top, ''),
        assert.equal(_0x223169.style.width, '100%'),
        assert.equal(_0x223169.style.height, '100%'),
        assert.equal(_0x223169.style.objectFit, 'fill'));
    } finally {
      globalThis.document = _0x366903;
    }
  }),
  test('StoryboardNode: 自定义分割线按 Esc 会取消且不提交', () => {
    const _0x5433c9 = globalThis.document,
      _0x88f9f1 = appStore.updateNodeData,
      _0x2dd266 = createFakeDocument(),
      _0x4ce853 = [];
    ((globalThis.document = _0x2dd266),
      (appStore.updateNodeData = (_0xa46cb4, _0x3d9acd) => {
        _0x4ce853.push({ id: _0xa46cb4, patch: _0x3d9acd });
      }));
    try {
      const _0x245303 = new StoryboardNode({
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
        _0x57b559 = _0x245303.mount();
      _0x2dd266.body.appendChild(_0x57b559);
      const _0x5b2cdb = _0x57b559.querySelector('.act-split-lines');
      (_0x5b2cdb.onclick(createButtonEvent(_0x5b2cdb)),
        assert.notEqual(_0x57b559.querySelector('.storyboard-custom-grid-overlay'), null),
        assert.notEqual(_0x57b559.querySelector('.storyboard-split-lines-menu'), null),
        _0x2dd266.dispatchEvent({
          type: 'keydown',
          key: 'Escape',
          preventDefault() {},
          stopPropagation() {},
        }),
        assert.equal(_0x4ce853.length, 0),
        assert.equal(_0x5b2cdb.classList.contains('active'), false),
        assert.notEqual(_0x57b559.querySelector('.storyboard-custom-grid-overlay'), null),
        assert.equal(_0x57b559.querySelector('.storyboard-custom-grid-handle-vertical'), null),
        assert.notEqual(_0x57b559.querySelector('.storyboard-custom-grid-line-vertical'), null),
        assert.equal(_0x57b559.querySelector('.storyboard-split-lines-menu'), null),
        assert.equal(_0x245303._grid.style.gridTemplateColumns, '1fr 1fr'),
        assert.equal(_0x245303._grid.style.gap, '0px'));
    } finally {
      ((globalThis.document = _0x5433c9), (appStore.updateNodeData = _0x88f9f1));
    }
  }),
  test('StoryboardNode: 完成调整会立即退出而不等待源图刷新', async () => {
    const _0x2656a5 = globalThis.document,
      _0x2b6b4e = appStore.updateNodeData,
      _0x28748b = createFakeDocument(),
      _0x2893b0 = [];
    ((globalThis.document = _0x28748b),
      (appStore.updateNodeData = (_0x550b85, _0x22c35a) => {
        _0x2893b0.push({ id: _0x550b85, patch: _0x22c35a });
      }));
    try {
      const _0x2210b3 = new StoryboardNode({
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
        _0x1fc573 = _0x2210b3.mount();
      (_0x28748b.body.appendChild(_0x1fc573),
        (_0x2210b3._materializeCellsForConfirmedGrid = async () => ({
          ok: false,
          cells: _0x2210b3._data.cells || [],
          failedIndices: [0],
        })));
      const _0x48f3ca = _0x1fc573.querySelector('.act-split-lines');
      (_0x48f3ca.onclick(createButtonEvent(_0x48f3ca)),
        assert.equal(_0x48f3ca.classList.contains('active'), true),
        assert.notEqual(_0x1fc573.querySelector('.storyboard-split-lines-menu'), null),
        (_0x2210b3._customGridDraft = { columns: [1.2, 0.8], rows: [1, 1] }),
        await _0x48f3ca.onclick(createButtonEvent(_0x48f3ca)),
        assert.equal(_0x48f3ca.classList.contains('active'), false),
        assert.equal(_0x48f3ca.dataset.tooltip, '调整分割线'),
        assert.equal(_0x1fc573.querySelector('.storyboard-split-lines-menu'), null),
        assert.equal(_0x1fc573.classList.contains('is-custom-grid-mode'), false),
        assert.equal(_0x1fc573.querySelector('.storyboard-custom-grid-handle-vertical'), null),
        assert.notEqual(_0x1fc573.querySelector('.storyboard-custom-grid-line-vertical'), null),
        assert.deepEqual(_0x2893b0, [
          {
            id: 'sb-custom-grid-refresh-pending',
            patch: { gridGap: 0, gridLayout: { columns: [1.2, 0.8], rows: [1, 1] } },
          },
        ]));
    } finally {
      ((globalThis.document = _0x2656a5), (appStore.updateNodeData = _0x2b6b4e));
    }
  }),
  test('StoryboardNode: 清空源裁剪格会立即显示空态', () => {
    const _0x42fec2 = globalThis.document,
      _0xf81036 = createFakeDocument();
    globalThis.document = _0xf81036;
    try {
      const _0x153601 = new StoryboardNode({
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
        _0x30da84 = _0x153601.mount();
      (_0xf81036.body.appendChild(_0x30da84),
        assert.notEqual(_0x30da84.querySelector('.storyboard-cell-img'), null));
      const _0x2d6985 = normalizeEmptyStoryboardCell(_0x153601._data.cells[0]);
      _0x153601.update({ ..._0x153601._data, cells: [_0x2d6985], _bizRev: 1 });
      const _0x46e5b7 = _0x30da84.querySelector('.storyboard-empty-residual'),
        _0x4b3ff4 = _0x30da84.querySelector('.storyboard-empty-cutout'),
        _0x127c62 = _0x30da84.querySelector('.storyboard-empty-residual-img');
      (assert.notEqual(_0x46e5b7, null),
        assert.notEqual(_0x4b3ff4, null),
        assert.notEqual(_0x127c62, null),
        assert.equal(_0x127c62.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x30da84.querySelector('.storyboard-cell-source-cache'), null));
    } finally {
      globalThis.document = _0x42fec2;
    }
  }),
  test('StoryboardNode: 源裁剪格刷新后直接按源图裁剪显示', () => {
    const _0x588084 = globalThis.document,
      _0x94bd04 = createFakeDocument();
    globalThis.document = _0x94bd04;
    try {
      const _0x43835b = new StoryboardNode({
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
        _0x3f376d = _0x43835b.mount();
      _0x94bd04.body.appendChild(_0x3f376d);
      const _0x3f66c2 = _0x3f376d.querySelector('.sb-cell'),
        _0x359764 = _0x3f66c2.querySelector('.storyboard-cell-img'),
        _0x4b7e5d = _0x3f66c2.querySelector('.storyboard-cell-source-cache'),
        _0x4543c6 = _0x3f376d.querySelector('.storyboard-source-backdrop');
      (assert.notEqual(_0x4b7e5d, null),
        _0x359764.setAttribute('src', '/output/tile.png'),
        _0x359764.classList.remove('storyboard-cell-img--source-crop'),
        (_0x4b7e5d.complete = false),
        (_0x4b7e5d.naturalWidth = 0),
        (_0x4b7e5d.naturalHeight = 0),
        (_0x4543c6.complete = false),
        (_0x4543c6.naturalWidth = 0),
        (_0x4543c6.naturalHeight = 0),
        _0x43835b._applyCellCropStyles(_0x3f66c2, _0x43835b._data.cells[0], 0),
        assert.equal(_0x359764.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x359764.classList.contains('storyboard-cell-img--source-crop'), true),
        assert.equal(_0x359764.style.left, '0%'),
        assert.equal(_0x359764.style.top, '0%'),
        assert.equal(_0x359764.style.width, '100%'),
        assert.equal(_0x359764.style.height, '100%'),
        (_0x4b7e5d.complete = true),
        (_0x4b7e5d.naturalWidth = 200),
        (_0x4b7e5d.naturalHeight = 100),
        _0x43835b._applyCellCropStyles(_0x3f66c2, _0x43835b._data.cells[0], 0),
        assert.equal(_0x359764.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x359764.classList.contains('storyboard-cell-img--source-crop'), true));
    } finally {
      globalThis.document = _0x588084;
    }
  }),
  test('StoryboardNode: F5 重建时源裁剪格不使用旧预览图', () => {
    const _0x2b8029 = globalThis.document,
      _0x4d926b = createFakeDocument();
    globalThis.document = _0x4d926b;
    try {
      const _0x4b761a = new StoryboardNode({
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
        _0x579481 = _0x4b761a.mount();
      _0x4d926b.body.appendChild(_0x579481);
      const _0x5efd11 = _0x579481.querySelector('.storyboard-cell-img');
      (assert.equal(_0x5efd11.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x5efd11.classList.contains('storyboard-cell-img--source-crop'), true),
        assert.equal(_0x5efd11.style.left, '-100%'),
        assert.equal(_0x5efd11.style.width, '200%'));
    } finally {
      globalThis.document = _0x2b8029;
    }
  }),
  test('StoryboardNode: 冻结实际图优先于残留源裁剪字段', () => {
    const _0x2b453b = globalThis.document,
      _0x59115c = createFakeDocument();
    globalThis.document = _0x59115c;
    try {
      const _0x33e261 = new StoryboardNode({
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
        _0x33e261._getCellDisplayImageUrl({
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
          _0x33e261._getCellDisplayImageUrl({
            id: 'cell-live',
            localPath: 'output/stale.jpg',
            sourceLocalPath: 'output/full-source.png',
            storyboardSourceCrop: true,
            isEmpty: false,
          }),
          '/output/full-source.png',
        ));
    } finally {
      globalThis.document = _0x2b453b;
    }
  }),
  test('StoryboardNode: 合成按当前显示样式裁切', async () => {
    const _0x11eab8 = globalThis.document,
      _0x74d492 = createFakeDocument();
    globalThis.document = _0x74d492;
    try {
      const _0x13d80b = new StoryboardNode({
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
        _0x442e5c = [],
        _0x162ff7 = [],
        _0xa670ba = {
          drawImage(..._0x494f98) {
            _0x162ff7.push(_0x494f98);
          },
        },
        _0x54a68b = async (_0x335266) => {
          return (_0x442e5c.push(_0x335266), { src: _0x335266, naturalWidth: 200, naturalHeight: 100 });
        },
        _0x2486a2 = _0x74d492.createElement('img');
      (_0x2486a2.classList.add('storyboard-cell-img', 'storyboard-cell-img--source-crop'),
        _0x2486a2.setAttribute('src', '/output/source.png'),
        (_0x2486a2.style.left = '-100%'),
        (_0x2486a2.style.top = '0%'),
        (_0x2486a2.style.width = '200%'),
        (_0x2486a2.style.height = '100%'),
        (_0x2486a2.style.objectFit = 'fill'));
      const _0x238628 = await _0x13d80b._drawComposeCell(_0xa670ba, {
        cell: _0x13d80b._data.cells[0],
        cellIndex: 0,
        displayUrl: '/output/source.png',
        imageEl: _0x2486a2,
        target: { x0: 0, y0: 0, drawW: 50, drawH: 100 },
        loadImage: _0x54a68b,
      });
      (assert.equal(_0x238628, true),
        assert.deepEqual(_0x442e5c, ['/output/source.png']),
        assert.equal(_0x162ff7.length, 1),
        assert.equal(_0x162ff7[0][0].src, '/output/source.png'),
        assert.deepEqual(_0x162ff7[0].slice(1), [100, 0, 100, 100, 0, 0, 50, 100]));
    } finally {
      globalThis.document = _0x11eab8;
    }
  }),
  test('StoryboardNode: 合成当前显示图加载失败不画旧图', async () => {
    const _0x490f1f = globalThis.document,
      _0x13e587 = createFakeDocument();
    globalThis.document = _0x13e587;
    try {
      const _0x3df9fd = new StoryboardNode({
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
        _0x54042b = [],
        _0xe03ead = [],
        _0x3e7453 = {
          drawImage(..._0xe52670) {
            _0xe03ead.push(_0xe52670);
          },
        },
        _0x33586b = async (_0x5db916) => {
          return (_0x54042b.push(_0x5db916), null);
        },
        _0x31dd46 = _0x13e587.createElement('img');
      (_0x31dd46.classList.add('storyboard-cell-img', 'storyboard-cell-img--source-crop'),
        _0x31dd46.setAttribute('src', '/output/source.png'),
        (_0x31dd46.style.left = '-100%'),
        (_0x31dd46.style.top = '0%'),
        (_0x31dd46.style.width = '200%'),
        (_0x31dd46.style.height = '100%'),
        (_0x31dd46.style.objectFit = 'fill'));
      const _0x2534d5 = await _0x3df9fd._drawComposeCell(_0x3e7453, {
        cell: _0x3df9fd._data.cells[0],
        cellIndex: 0,
        displayUrl: '/output/source.png',
        imageEl: _0x31dd46,
        target: { x0: 0, y0: 0, drawW: 50, drawH: 100 },
        loadImage: _0x33586b,
      });
      (assert.equal(_0x2534d5, false),
        assert.deepEqual(_0x54042b, ['/output/source.png']),
        assert.equal(_0xe03ead.length, 0));
    } finally {
      globalThis.document = _0x490f1f;
    }
  }),
  test('StoryboardNode: 拖出源裁剪格后清空格子内容', () => {
    const _0x33b78b = globalThis.document,
      _0x99d228 = createFakeDocument();
    globalThis.document = _0x99d228;
    try {
      const _0x12e350 = new StoryboardNode({
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
        _0x438886 = _0x12e350.mount();
      _0x99d228.body.appendChild(_0x438886);
      const _0x30b96a = { ...normalizeEmptyStoryboardCell(_0x12e350._data.cells[0]) };
      _0x12e350.update({ ..._0x12e350._data, cells: [_0x30b96a, _0x12e350._data.cells[1]], _bizRev: 1 });
      const _0x2c2177 = _0x438886.querySelectorAll('.sb-cell')[0],
        _0x166f4f = _0x2c2177.querySelector('.storyboard-empty-residual-img'),
        _0x43a2e3 = _0x2c2177.querySelector('.storyboard-empty-cutout');
      (assert.notEqual(_0x166f4f, null),
        assert.notEqual(_0x43a2e3, null),
        assert.equal(_0x166f4f.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x166f4f.classList.contains('storyboard-cell-img'), false),
        assert.equal(_0x166f4f.style.left, '0%'),
        assert.equal(_0x166f4f.style.width, '222.22222222222223%'),
        assert.equal(_0x166f4f.style.height, '100%'),
        assert.equal(_0x43a2e3.style.left, '0'),
        assert.equal(_0x43a2e3.style.width, '100%'),
        assert.equal(_0x2c2177.style.left, '0px'),
        assert.equal(_0x2c2177.style.width, '90px'));
    } finally {
      globalThis.document = _0x33b78b;
    }
  }),
  test('StoryboardNode: 放回已提取分镜只填充真实空洞区域', () => {
    const _0x411a91 = globalThis.document,
      _0x4a247c = createFakeDocument();
    globalThis.document = _0x4a247c;
    try {
      const _0x5b4382 = new StoryboardNode({
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
        _0x53a25a = _0x5b4382.mount();
      _0x4a247c.body.appendChild(_0x53a25a);
      const _0x210194 = _0x53a25a.querySelectorAll('.sb-cell')[0],
        _0x4e3f01 = _0x210194.querySelector('.storyboard-empty-residual-img'),
        _0xaccaf0 = _0x210194.querySelector('.storyboard-cell-img');
      (assert.notEqual(_0x4e3f01, null),
        assert.notEqual(_0xaccaf0, null),
        assert.equal(_0xaccaf0.getAttribute('src'), '/output/extracted.png'),
        assert.equal(_0x210194.style.left, '0px'),
        assert.equal(_0x210194.style.width, '90px'),
        assert.equal(_0xaccaf0.style.position, ''),
        assert.equal(_0xaccaf0.style.left, ''),
        assert.equal(_0xaccaf0.style.top, ''),
        assert.equal(_0xaccaf0.style.width, '100%'),
        assert.equal(_0xaccaf0.style.height, '100%'),
        assert.equal(_0x4e3f01.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x4e3f01.style.left, '0%'),
        assert.equal(_0x4e3f01.style.width, '222.22222222222223%'));
    } finally {
      globalThis.document = _0x411a91;
    }
  }),
  test('StoryboardNode: 已提取分镜的实际图层压在残影之上', () => {
    const _0x18bd4b = NODE_TYPES_CSS.match(
      /\.storyboard-extracted-cell-content\s+\.storyboard-empty-residual-img\s*\{(?<body>[^}]*)\}/s,
    );
    (assert.ok(_0x18bd4b?.groups?.body), assert.match(_0x18bd4b.groups.body, /z-index:\s*0/));
    const _0x3022a4 = NODE_TYPES_CSS.match(
      /\.storyboard-extracted-cell-content\s+\.storyboard-cell-img--extracted-cutout\s*\{(?<body>[^}]*)\}/s,
    );
    (assert.ok(_0x3022a4?.groups?.body),
      assert.match(_0x3022a4.groups.body, /position:\s*relative/),
      assert.match(_0x3022a4.groups.body, /z-index:\s*1/));
  }),
  test('StoryboardNode: 空洞残留源图按当前线位和间距对齐', () => {
    const _0x3ec1e8 = globalThis.document,
      _0x87334e = createFakeDocument();
    globalThis.document = _0x87334e;
    try {
      const _0x47b491 = new StoryboardNode({
          id: 'sb-empty-custom-slot',
          type: 'storyboard',
          cols: 2,
          rows: 2,
          width: 0x12c,
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
              residualImageWidth: 0x12c,
              residualImageHeight: 200,
              residualImageMode: 'source',
            },
          ],
        }),
        _0x235869 = _0x47b491.mount();
      _0x87334e.body.appendChild(_0x235869);
      const _0x13ea9a = _0x235869.querySelectorAll('.sb-cell')[3],
        _0x18f955 = _0x13ea9a.querySelector('.storyboard-empty-residual-img'),
        _0x503c20 = _0x13ea9a.querySelector('.storyboard-empty-cutout');
      (assert.equal(_0x13ea9a.style.left, '235px'),
        assert.equal(_0x13ea9a.style.top, '60px'),
        assert.equal(_0x13ea9a.style.width, '65px'),
        assert.equal(_0x13ea9a.style.height, '140px'),
        assert.notEqual(_0x18f955, null),
        assert.notEqual(_0x503c20, null),
        assert.equal(_0x18f955.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x18f955.style.left, '-361.53846153846155%'),
        assert.equal(_0x18f955.style.top, '-42.857142857142854%'),
        assert.equal(_0x18f955.style.width, '461.5384615384615%'),
        assert.equal(_0x18f955.style.height, '142.85714285714286%'),
        assert.equal(_0x503c20.style.left, '0'),
        assert.equal(_0x503c20.style.top, '0'),
        assert.equal(_0x503c20.style.width, '100%'),
        assert.equal(_0x503c20.style.height, '100%'));
    } finally {
      globalThis.document = _0x3ec1e8;
    }
  }),
  test('StoryboardNode: actual cropped extracted cell without residual fills cell', () => {
    const _0x56c48f = globalThis.document,
      _0x1ea2fb = createFakeDocument();
    globalThis.document = _0x1ea2fb;
    try {
      const _0x402d7f = new StoryboardNode({
          id: 'sb-extracted-actual-crop',
          type: 'storyboard',
          cols: 3,
          rows: 3,
          width: 0x12c,
          height: 0x12c,
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
        _0x233001 = _0x402d7f.mount();
      _0x1ea2fb.body.appendChild(_0x233001);
      const _0x24f513 = _0x233001.querySelectorAll('.sb-cell')[4].querySelector('img');
      (assert.equal(_0x24f513.getAttribute('src'), '/output/real-crop.png'),
        assert.equal(_0x24f513.style.position, ''),
        assert.equal(_0x24f513.style.left, ''),
        assert.equal(_0x24f513.style.top, ''),
        assert.equal(_0x24f513.style.width, '100%'),
        assert.equal(_0x24f513.style.height, '100%'),
        assert.equal(_0x24f513.style.objectFit, 'fill'));
    } finally {
      globalThis.document = _0x56c48f;
    }
  }),
  test('StoryboardNode: 调整分割线时空格保持空态', async () => {
    const _0x1c4362 = globalThis.document,
      _0x860778 = appStore.updateNodeData,
      _0x29e8fc = createFakeDocument(),
      _0x4a81fa = [];
    let _0x536b76 = 0;
    ((globalThis.document = _0x29e8fc),
      (appStore.updateNodeData = (_0x2a5370, _0x515332) => {
        _0x4a81fa.push({ id: _0x2a5370, patch: _0x515332 });
      }));
    try {
      const _0x18b6e2 = new StoryboardNode({
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
      ((_0x18b6e2._refreshSourceBackedCellsForLayout = () => {
        return ((_0x536b76 += 1), Promise.resolve(null));
      }),
        (_0x18b6e2._materializeCellsForConfirmedGrid = async (_0x570f4c, _0x1fed31, _0x3acf49) => ({
          ok: true,
          cells: _0x3acf49 || _0x18b6e2._data.cells || [],
          failedIndices: [],
        })));
      const _0x334d46 = _0x18b6e2.mount();
      _0x29e8fc.body.appendChild(_0x334d46);
      const _0x5a1714 = _0x334d46.querySelectorAll('.sb-cell')[1].querySelector('img');
      (assert.equal(_0x5a1714.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x5a1714.classList.contains('storyboard-cell-img--source-crop'), true));
      const _0x552163 = _0x334d46.querySelector('.act-split-lines');
      (_0x552163.onclick(createButtonEvent(_0x552163)),
        (_0x18b6e2._customGridDraft = { columns: [1.5, 0.5], rows: [1] }),
        await _0x18b6e2._confirmCustomGridEdit(),
        assert.equal(_0x4a81fa.length, 1),
        assert.deepEqual(_0x4a81fa[0].patch, { gridGap: 80, gridLayout: { columns: [1.5, 0.5], rows: [1] } }),
        assert.equal(_0x536b76, 0));
    } finally {
      ((globalThis.document = _0x1c4362), (appStore.updateNodeData = _0x860778));
    }
  }),
  test('StoryboardNode: 空格残留源图字段时也不进入源图裁剪渲染', () => {
    const _0x31cf87 = globalThis.document,
      _0x277286 = createFakeDocument();
    globalThis.document = _0x277286;
    try {
      const _0x34b47c = new StoryboardNode({
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
        _0x37a90c = _0x34b47c.mount();
      (_0x277286.body.appendChild(_0x37a90c),
        assert.equal(_0x37a90c.querySelector('.storyboard-cell-img'), null),
        assert.ok(_0x37a90c.querySelector('.empty-placeholder')));
    } finally {
      globalThis.document = _0x31cf87;
    }
  }),
  test('StoryboardNode: 编辑分镜和调整分割线互斥', () => {
    const _0x7bde75 = globalThis.document,
      _0xa3220f = appStore.updateNodeData,
      _0x35ee0d = createFakeDocument(),
      _0x56683a = [];
    ((globalThis.document = _0x35ee0d),
      (appStore.updateNodeData = (_0x2bf007, _0x404288) => {
        _0x56683a.push({ id: _0x2bf007, patch: _0x404288 });
      }));
    try {
      const _0x321eff = new StoryboardNode({
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
        _0x415554 = _0x321eff.mount();
      _0x35ee0d.body.appendChild(_0x415554);
      const _0x35ff38 = _0x415554.querySelector('.act-split-lines'),
        _0xb82e41 = _0x415554.querySelector('.act-edit');
      (assert.equal(_0xb82e41.classList.contains('active'), true),
        assert.equal(_0xb82e41.dataset.tooltip, '退出编辑分镜'),
        assert.equal(_0x35ff38.dataset.tooltip, '调整分割线'),
        _0x35ff38.onclick(createButtonEvent(_0x35ff38)),
        assert.equal(_0xb82e41.classList.contains('active'), false),
        assert.equal(_0xb82e41.dataset.tooltip, '编辑分镜'),
        assert.equal(_0x35ff38.classList.contains('active'), true),
        assert.equal(_0x35ff38.dataset.tooltip, '完成调整'),
        assert.deepEqual(_0x56683a[0].patch, { isEditing: false }),
        _0xb82e41.onclick(createButtonEvent(_0xb82e41)),
        assert.equal(_0x35ff38.classList.contains('active'), false),
        assert.equal(_0x35ff38.dataset.tooltip, '调整分割线'),
        assert.equal(_0x415554.querySelector('.storyboard-custom-grid-handle-vertical'), null),
        assert.notEqual(_0x415554.querySelector('.storyboard-custom-grid-line-vertical'), null),
        assert.equal(_0xb82e41.classList.contains('active'), true),
        assert.equal(_0xb82e41.dataset.tooltip, '退出编辑分镜'),
        assert.deepEqual(_0x56683a[1].patch, { isEditing: true }));
    } finally {
      ((globalThis.document = _0x7bde75), (appStore.updateNodeData = _0xa3220f));
    }
  }),
  test('StoryboardNode: 自定义线显示层按当前线位裁切源图', () => {
    const _0x20d123 = globalThis.document,
      _0x5b306d = createFakeDocument();
    globalThis.document = _0x5b306d;
    try {
      const _0x255af0 = new StoryboardNode({
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
        _0x3fcdaf = _0x255af0.mount();
      _0x5b306d.body.appendChild(_0x3fcdaf);
      const _0x51f7d1 = _0x3fcdaf.querySelectorAll('.sb-cell'),
        _0x45884d = _0x51f7d1[1].querySelector('img');
      (assert.equal(_0x255af0._grid.style.gridTemplateColumns, '1fr 1fr'),
        assert.equal(_0x51f7d1[0].style.left, '0px'),
        assert.equal(_0x51f7d1[0].style.width, '150px'),
        assert.equal(_0x51f7d1[1].style.left, '150px'),
        assert.equal(_0x51f7d1[1].style.width, '50px'),
        assert.equal(_0x45884d.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x45884d.classList.contains('storyboard-cell-img--source-crop'), true),
        assert.equal(_0x45884d.style.width, '400%'),
        assert.equal(_0x45884d.style.left, '-300%'));
    } finally {
      globalThis.document = _0x20d123;
    }
  }),
  test('StoryboardNode: 宫格间距控件只调整子宫格区域', async () => {
    const _0x319837 = globalThis.document,
      _0x134e55 = globalThis.setTimeout,
      _0x34df6e = appStore.updateNodeData,
      _0x4199fa = createFakeDocument(),
      _0x4c2906 = [];
    let _0x1e6567 = null;
    ((globalThis.document = _0x4199fa),
      (globalThis.setTimeout = (_0xfca93a) => {
        return (_0xfca93a(), 1);
      }),
      (appStore.updateNodeData = (_0x1f9e8f, _0x3c2193) => {
        _0x4c2906.push({ id: _0x1f9e8f, patch: _0x3c2193 });
      }));
    try {
      const _0x671934 = Array.from({ length: 9 }, (_0x16d8bd, _0x5af0f5) => ({
        id: 'cell-' + _0x5af0f5,
        isEmpty: true,
        url: '',
      }));
      ((_0x671934[4] = {
        id: 'cell-center',
        localPath: 'output/tile-4.png',
        sourceLocalPath: 'output/source.png',
        sourceWidth: 0x12c,
        sourceHeight: 0x12c,
        isEmpty: false,
      }),
        (_0x1e6567 = new StoryboardNode({
          id: 'sb-line-gap',
          type: 'storyboard',
          cols: 3,
          rows: 3,
          width: 0x12c,
          height: 0x12c,
          cells: _0x671934,
        })));
      const _0x157eab = _0x1e6567.mount();
      _0x4199fa.body.appendChild(_0x157eab);
      const _0x33267a = _0x157eab.querySelector('.storyboard-container'),
        _0x335dde = _0x33267a.querySelector('.storyboard-source-backdrop');
      (assert.notEqual(_0x335dde, null),
        assert.equal(_0x335dde.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x335dde.style.objectFit, 'fill'),
        assert.equal(_0x335dde.style.opacity, '1'),
        assert.equal(_0x335dde.style.zIndex, '0'),
        assert.equal(_0x1e6567._grid.style.zIndex, '1'),
        assert.equal(_0x33267a.childNodes[0], _0x335dde),
        assert.equal(_0x33267a.childNodes[1], _0x1e6567._grid));
      const _0x366fb8 = _0x157eab.querySelector('.act-split-lines');
      (assert.equal(_0x1e6567._container.style.background, 'var(--bg-node)'),
        assert.equal(_0x1e6567._grid.style.background, 'transparent'),
        assert.equal(_0x366fb8.classList.contains('icon-only'), true),
        assert.equal(_0x366fb8.querySelector('.storyboard-split-lines-label'), null),
        assert.equal(_0x366fb8.querySelector('.storyboard-split-lines-menu-trigger'), null),
        assert.equal(_0x1e6567._grid.style.gap, '0px'));
      const _0x567530 = _0x157eab.querySelectorAll('.sb-cell')[4],
        _0x3a4e6c = _0x567530.querySelector('img');
      (assert.equal(_0x567530.style.left, '100px'),
        assert.equal(_0x567530.style.top, '100px'),
        assert.equal(_0x567530.style.width, '100px'),
        assert.equal(_0x567530.style.height, '100px'),
        assert.equal(_0x3a4e6c.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x3a4e6c.style.width, '300%'),
        assert.equal(_0x3a4e6c.style.left, '-100%'),
        _0x366fb8.onclick(createButtonEvent(_0x366fb8)));
      const _0x37b1ba = _0x157eab.querySelector('.storyboard-split-lines-menu');
      (assert.notEqual(_0x37b1ba, null),
        assert.equal(_0x37b1ba.parentElement, _0x157eab.querySelector('.storyboard-toolbar')),
        assert.equal(_0x37b1ba.classList.contains('storyboard-toolbar-menu'), true));
      const _0x49f87b = _0x37b1ba.querySelector('input'),
        _0x551d06 = _0x37b1ba.querySelector('.storyboard-grid-gap-readout');
      (assert.notEqual(_0x49f87b, null),
        assert.equal(_0x49f87b.value, '0'),
        (_0x49f87b.value = '80'),
        _0x49f87b.eventListeners.get('input')[0]({ target: _0x49f87b, stopPropagation() {} }),
        assert.equal(_0x551d06.textContent, '80px'),
        assert.equal(_0x4c2906.length, 0),
        assert.equal(_0x1e6567._grid.style.gap, '0px'),
        assert.equal(_0x567530.style.left, '100px'),
        assert.equal(_0x567530.style.top, '100px'),
        assert.equal(_0x567530.style.width, '100px'),
        assert.equal(_0x567530.style.height, '100px'),
        assert.equal(_0x3a4e6c.style.width, '300%'),
        assert.equal(_0x3a4e6c.style.left, '-100%'),
        assert.equal(_0x335dde.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x157eab.querySelector('.storyboard-grid-gap-band-vertical'), null),
        assert.equal(_0x157eab.querySelector('.storyboard-grid-gap-band-horizontal'), null));
      const _0x3e4a5e = _0x157eab.querySelectorAll('.storyboard-custom-grid-handle-vertical'),
        _0x5c4e7d = _0x157eab.querySelectorAll('.storyboard-custom-grid-handle-horizontal');
      (assert.equal(_0x3e4a5e.length, 2),
        assert.equal(_0x5c4e7d.length, 2),
        assert.equal(_0x3e4a5e[0].style.left, '33.33333333333333%'),
        assert.equal(_0x3e4a5e[0].style['--storyboard-grid-line-size'], '80px'),
        assert.equal(_0x3e4a5e[0].style['--storyboard-grid-line-half-size'], '40px'),
        assert.equal(_0x3e4a5e[0].style.width, '80px'),
        assert.equal(_0x5c4e7d[0].style.top, '33.33333333333333%'),
        assert.equal(_0x5c4e7d[0].style['--storyboard-grid-line-size'], '80px'),
        assert.equal(_0x5c4e7d[0].style['--storyboard-grid-line-half-size'], '40px'),
        assert.equal(_0x5c4e7d[0].style.height, '80px'),
        assert.equal(_0x1e6567.hitTestCell(30, 150), 3),
        assert.equal(_0x1e6567.hitTestCell(100, 150), 3),
        assert.equal(_0x1e6567.hitTestCell(110, 150), 4),
        assert.equal(_0x1e6567.hitTestCell(150, 150), 4));
      let _0x44af3f = 0;
      ((_0x1e6567._refreshSourceBackedCellsForLayoutInBackground = () => {
        _0x44af3f += 1;
      }),
        (_0x1e6567._materializeCellsForConfirmedGrid = async (_0x1f01e5, _0x5388c3, _0x4ec32d) => ({
          ok: true,
          cells: _0x4ec32d || _0x1e6567._data.cells || [],
          failedIndices: [],
        })),
        await _0x1e6567._confirmCustomGridEdit(),
        assert.equal(_0x4c2906.length, 1),
        assert.equal(_0x4c2906[0].id, 'sb-line-gap'),
        assert.deepEqual(_0x4c2906[0].patch, {
          gridGap: 80,
          gridLayout: { columns: [1, 1, 1], rows: [1, 1, 1] },
        }),
        assert.equal(_0x567530.style.left, '140px'),
        assert.equal(_0x567530.style.top, '140px'),
        assert.equal(_0x567530.style.width, '20px'),
        assert.equal(_0x567530.style.height, '20px'),
        assert.equal(_0x3a4e6c.style.width, '1500%'),
        assert.equal(_0x3a4e6c.style.left, '-700%'),
        assert.equal(_0x44af3f, 0),
        assert.equal(_0x157eab.querySelectorAll('.storyboard-custom-grid-line-vertical').length, 2),
        assert.equal(_0x157eab.querySelectorAll('.storyboard-custom-grid-handle-vertical').length, 0));
    } finally {
      (_0x1e6567?._closeMenu(),
        (globalThis.document = _0x319837),
        (globalThis.setTimeout = _0x134e55),
        (appStore.updateNodeData = _0x34df6e));
    }
  }),
  test('StoryboardNode: edit-only update keeps spaced grid pixels untouched', () => {
    const _0x4f35c9 = globalThis.document,
      _0x474bfa = createFakeDocument();
    globalThis.document = _0x474bfa;
    try {
      const _0x3dad90 = Array.from({ length: 9 }, (_0xb9d488, _0x4b8b3b) => ({
        id: 'cell-' + _0x4b8b3b,
        isEmpty: true,
        url: '',
      }));
      _0x3dad90[4] = {
        id: 'cell-center',
        localPath: 'output/tile-4.png',
        sourceLocalPath: 'output/source.png',
        sourceWidth: 0x12c,
        sourceHeight: 0x12c,
        isEmpty: false,
      };
      const _0x63a372 = new StoryboardNode({
          id: 'sb-edit-spaced-grid',
          type: 'storyboard',
          cols: 3,
          rows: 3,
          width: 0x12c,
          height: 0x12c,
          gridGap: 80,
          isEditing: false,
          cells: _0x3dad90,
        }),
        _0x45be6d = _0x63a372.mount();
      _0x474bfa.body.appendChild(_0x45be6d);
      const _0x1512f6 = _0x45be6d.querySelectorAll('.sb-cell')[4],
        _0x111b55 = _0x1512f6.querySelector('img');
      (assert.equal(_0x63a372._grid.style.gap, '0px'),
        assert.equal(_0x1512f6.style.left, '140px'),
        assert.equal(_0x1512f6.style.top, '140px'),
        assert.equal(_0x1512f6.style.width, '20px'),
        assert.equal(_0x1512f6.style.height, '20px'),
        assert.equal(_0x111b55.getAttribute('src'), '/output/source.png'),
        assert.equal(_0x111b55.style.width, '1500%'),
        assert.equal(_0x111b55.style.left, '-700%'));
      let _0x29ec94 = 0;
      ((_0x63a372._syncCustomGridOverlay = () => {
        _0x29ec94 += 1;
      }),
        _0x63a372.update({ ..._0x63a372._data, isEditing: true }),
        assert.equal(_0x29ec94, 0),
        assert.equal(_0x45be6d.classList.contains('is-editing-mode'), true),
        assert.equal(_0x63a372._grid.style.gap, '0px'),
        assert.equal(_0x1512f6.style.left, '140px'),
        assert.equal(_0x1512f6.style.top, '140px'),
        assert.equal(_0x1512f6.style.width, '20px'),
        assert.equal(_0x1512f6.style.height, '20px'),
        assert.equal(_0x111b55.style.width, '1500%'),
        assert.equal(_0x111b55.style.left, '-700%'));
    } finally {
      globalThis.document = _0x4f35c9;
    }
  }),
  test('StoryboardNode: entering edit materializes source-backed cells as pieces', () => {
    const _0x39b3b4 = globalThis.document,
      _0x41d9bc = appStore.updateNodeData,
      _0x3b3be2 = createFakeDocument(),
      _0x633706 = [];
    ((globalThis.document = _0x3b3be2),
      (appStore.updateNodeData = (_0x39c8ec, _0x1720fa) => {
        _0x633706.push({ id: _0x39c8ec, patch: _0x1720fa });
      }));
    try {
      const _0x2f5666 = new StoryboardNode({
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
              sourceWidth: 0x12c,
              sourceHeight: 0x12c,
              storyboardSourceCrop: true,
              isEmpty: false,
            },
          ],
        }),
        _0x1c30c7 = _0x2f5666.mount();
      _0x3b3be2.body.appendChild(_0x1c30c7);
      const _0x47927 = _0x1c30c7.querySelector('.act-edit');
      (_0x47927.onclick(createButtonEvent(_0x47927)),
        assert.equal(_0x633706.length, 1),
        assert.equal(_0x633706[0].id, 'sb-edit-materialize'),
        assert.equal(_0x633706[0].patch.isEditing, true),
        assert.equal(_0x633706[0].patch.storyboardBackdropUrl, '/output/source.png'),
        assert.equal(_0x633706[0].patch.cells.length, 1));
      const _0x2600e4 = _0x633706[0].patch.cells[0];
      (assert.equal(_0x2600e4.capturePreviewUrl, 'data:image/jpeg;base64,current-piece'),
        assert.equal(_0x2600e4.sourceLocalPath, null),
        assert.equal(_0x2600e4.sourceUrl, ''),
        assert.equal(_0x2600e4.sourceWidth, null),
        assert.equal(_0x2600e4.sourceHeight, null),
        assert.equal(_0x2600e4.storyboardSourceCrop, false),
        assert.equal(_0x2600e4.storyboardLockedCell, true),
        assert.equal(_0x2600e4.storyboardSourceIndex, 0),
        assert.equal(_0x2600e4.pieceId, 'cell-source'),
        assert.equal(_0x1c30c7.querySelector('.storyboard-cell-source-cache'), null));
    } finally {
      ((globalThis.document = _0x39b3b4), (appStore.updateNodeData = _0x41d9bc));
    }
  }),
  test('StoryboardNode: clearing source context removes stale source cache', () => {
    const _0x23a977 = globalThis.document,
      _0x35eac5 = createFakeDocument();
    globalThis.document = _0x35eac5;
    try {
      const _0x8fb772 = new StoryboardNode({
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
              sourceWidth: 0x12c,
              sourceHeight: 0x12c,
              storyboardSourceCrop: true,
              isEmpty: false,
            },
          ],
        }),
        _0x58cb43 = _0x8fb772.mount();
      (_0x35eac5.body.appendChild(_0x58cb43),
        assert.notEqual(_0x58cb43.querySelector('.storyboard-cell-source-cache'), null),
        _0x8fb772.update({
          ..._0x8fb772._data,
          cells: [
            {
              ..._0x8fb772._data.cells[0],
              sourceLocalPath: null,
              sourceUrl: '',
              sourceWidth: null,
              sourceHeight: null,
              storyboardSourceCrop: false,
            },
          ],
          _bizRev: 1,
        }),
        assert.equal(_0x58cb43.querySelector('.storyboard-cell-source-cache'), null),
        assert.equal(
          _0x58cb43.querySelector('.storyboard-cell-img').getAttribute('src'),
          'data:image/jpeg;base64,current-piece',
        ));
    } finally {
      globalThis.document = _0x23a977;
    }
  }),
  test('StoryboardNode: 子菜单挂在工具栏内跟随触发按钮', () => {
    const _0x25313a = globalThis.document,
      _0x256cb2 = globalThis.setTimeout,
      _0x570508 = createFakeDocument();
    ((globalThis.document = _0x570508),
      (globalThis.setTimeout = (_0x58f8eb) => {
        return (_0x58f8eb(), 1);
      }));
    try {
      const _0x1fd7d7 = new StoryboardNode({
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
        _0x2d5dfa = _0x1fd7d7.mount();
      _0x570508.body.appendChild(_0x2d5dfa);
      const _0x31604b = _0x2d5dfa.querySelector('.storyboard-toolbar'),
        _0x24eb75 = _0x2d5dfa.querySelector('.act-grid');
      _0x24eb75.onclick(createButtonEvent(_0x24eb75));
      const _0x528c95 = _0x2d5dfa.querySelector('.v2-sb-dropdown');
      (assert.equal(_0x528c95.parentElement, _0x31604b),
        assert.equal(_0x528c95.classList.contains('storyboard-toolbar-menu'), true),
        assert.equal(_0x24eb75.classList.contains('active'), true),
        _0x1fd7d7._closeMenu(),
        assert.equal(_0x2d5dfa.querySelector('.v2-sb-dropdown'), null),
        assert.equal(_0x24eb75.classList.contains('active'), false));
      const _0x5ee58d = _0x2d5dfa.querySelector('.act-split-lines');
      _0x5ee58d.onclick(createButtonEvent(_0x5ee58d));
      const _0x3b0599 = _0x2d5dfa.querySelector('.storyboard-split-lines-menu');
      (assert.notEqual(_0x3b0599, null),
        assert.equal(_0x3b0599.parentElement, _0x31604b),
        assert.equal(_0x3b0599.classList.contains('storyboard-toolbar-menu'), true),
        assert.equal(_0x5ee58d.classList.contains('active'), true));
    } finally {
      ((globalThis.document = _0x25313a), (globalThis.setTimeout = _0x256cb2));
    }
  }),
  test('StoryboardNode: 清空会把 cell 归一为空态', () => {
    const _0x536c64 = globalThis.document,
      _0x1414c0 = appStore.updateNodeData,
      _0x5c57d6 = createFakeDocument(),
      _0x1fca00 = [];
    ((globalThis.document = _0x5c57d6),
      (appStore.updateNodeData = (_0x4883b1, _0x508972) => {
        _0x1fca00.push({ id: _0x4883b1, patch: _0x508972 });
      }));
    try {
      const _0xdda2b2 = new StoryboardNode({
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
        _0x1dba82 = _0xdda2b2.mount();
      _0x5c57d6.body.appendChild(_0x1dba82);
      const _0x423bef = _0x1dba82.querySelector('.act-clear');
      (_0x423bef.onclick(createButtonEvent(_0x423bef)),
        assert.equal(_0x1fca00.length, 1),
        assert.equal(_0x1fca00[0].id, 'sb-clear'),
        assert.deepEqual(_0x1fca00[0].patch.cells[0], {
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
      ((globalThis.document = _0x536c64), (appStore.updateNodeData = _0x1414c0));
    }
  }),
  test('StoryboardNode: 同图填充新格子时不会挪走已有格子的 DOM', () => {
    const _0x3fe51d = globalThis.document,
      _0x1e2b5b = createFakeDocument();
    globalThis.document = _0x1e2b5b;
    try {
      const _0x84e7fa = {
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
        _0x230116 = new StoryboardNode(_0x84e7fa),
        _0x2a1ab6 = _0x230116.mount();
      _0x1e2b5b.body.appendChild(_0x2a1ab6);
      const _0x4fe3ae = _0x2a1ab6.querySelectorAll('.sb-cell');
      (assert.equal(_0x4fe3ae[0].querySelector('img'), null),
        assert.notEqual(_0x4fe3ae[1].querySelector('img'), null),
        _0x230116.update({
          ..._0x84e7fa,
          cells: [
            { id: 'cell-1', localPath: 'output/shared.png', isEmpty: false },
            { id: 'cell-2', localPath: 'output/shared.png', isEmpty: false },
          ],
        }));
      const _0x5e20d0 = _0x2a1ab6.querySelectorAll('.sb-cell'),
        _0x3975bf = _0x5e20d0[0].querySelector('img'),
        _0x4aa322 = _0x5e20d0[1].querySelector('img');
      (assert.notEqual(_0x3975bf, null),
        assert.notEqual(_0x4aa322, null),
        assert.notEqual(_0x3975bf, _0x4aa322),
        assert.equal(_0x3975bf.getAttribute('src'), '/output/shared.png'),
        assert.equal(_0x4aa322.getAttribute('src'), '/output/shared.png'));
    } finally {
      globalThis.document = _0x3fe51d;
    }
  }),
  test('StoryboardNode: applyImmediateCellSwap 会即时交换 DOM 且不改数据', () => {
    const _0x5971cc = globalThis.document,
      _0x15f9a5 = createFakeDocument();
    globalThis.document = _0x15f9a5;
    try {
      const _0x1afa9d = {
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
        _0x36f0b2 = new StoryboardNode(_0x1afa9d),
        _0x18c5d7 = _0x36f0b2.mount();
      _0x15f9a5.body.appendChild(_0x18c5d7);
      const _0x306eb1 = _0x18c5d7.querySelectorAll('.sb-cell');
      (assert.equal(_0x306eb1[0].querySelector('img').getAttribute('src'), '/output/a.png'),
        assert.equal(_0x306eb1[1].querySelector('img').getAttribute('src'), '/output/b.png'));
      const _0x2624fe = _0x36f0b2.applyImmediateCellSwap(0, 1);
      (assert.equal(_0x2624fe.ok, true),
        assert.equal(_0x306eb1[0].querySelector('img').getAttribute('src'), '/output/b.png'),
        assert.equal(_0x306eb1[1].querySelector('img').getAttribute('src'), '/output/a.png'),
        assert.equal(_0x36f0b2._data.cells[0].localPath, 'output/a.png'),
        assert.equal(_0x36f0b2._data.cells[1].localPath, 'output/b.png'),
        _0x2624fe.revert(),
        assert.equal(_0x306eb1[0].querySelector('img').getAttribute('src'), '/output/a.png'),
        assert.equal(_0x306eb1[1].querySelector('img').getAttribute('src'), '/output/b.png'),
        assert.equal(_0x36f0b2._data.cells[0].localPath, 'output/a.png'),
        assert.equal(_0x36f0b2._data.cells[1].localPath, 'output/b.png'));
    } finally {
      globalThis.document = _0x5971cc;
    }
  }),
  test('StoryboardNode: applyImmediateCellSwap 会拒绝非法目标', () => {
    const _0xafaeef = globalThis.document,
      _0x5c9628 = createFakeDocument();
    globalThis.document = _0x5c9628;
    try {
      const _0xe5d98a = new StoryboardNode({
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
        _0x205a50 = _0xe5d98a.mount();
      (_0x5c9628.body.appendChild(_0x205a50),
        assert.equal(_0xe5d98a.applyImmediateCellSwap(0, 0).ok, false),
        assert.equal(_0xe5d98a.applyImmediateCellSwap(-1, 1).ok, false),
        assert.equal(_0xe5d98a.applyImmediateCellSwap(0, 99).ok, false));
      const _0x3c586f = _0x205a50.querySelectorAll('.sb-cell')[0].querySelector('.cell-content-wrap');
      (_0x3c586f.remove(), assert.equal(_0xe5d98a.applyImmediateCellSwap(0, 1).ok, false));
    } finally {
      globalThis.document = _0xafaeef;
    }
  }),
  test('StoryboardNode: 互换已显示图片时直接复用现有图片不等待 load', () => {
    const _0xf62260 = globalThis.document,
      _0x3d14b9 = createFakeDocument();
    globalThis.document = _0x3d14b9;
    try {
      const _0x2dce70 = {
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
        _0x4f953b = new StoryboardNode(_0x2dce70),
        _0x3737ca = _0x4f953b.mount();
      (_0x3d14b9.body.appendChild(_0x3737ca),
        _0x4f953b.update({
          ..._0x2dce70,
          cells: [
            { id: 'cell-1', localPath: 'output/b.png', isEmpty: false },
            { id: 'cell-2', localPath: 'output/a.png', isEmpty: false },
          ],
        }));
      const _0x9fafe0 = _0x3737ca.querySelectorAll('.sb-cell'),
        _0x42c9f1 = _0x9fafe0[0].querySelector('.cell-content-wrap'),
        _0x212c77 = _0x9fafe0[1].querySelector('.cell-content-wrap'),
        _0x2ece0a = _0x42c9f1.querySelector('img'),
        _0x1af927 = _0x212c77.querySelector('img');
      (assert.equal(_0x42c9f1.children.length, 1),
        assert.equal(_0x212c77.children.length, 1),
        assert.equal(_0x2ece0a.getAttribute('src'), '/output/b.png'),
        assert.equal(_0x1af927.getAttribute('src'), '/output/a.png'),
        assert.equal(_0x2ece0a.classList.contains('is-cell-preloading'), false),
        assert.equal(_0x1af927.classList.contains('is-cell-preloading'), false));
    } finally {
      globalThis.document = _0xf62260;
    }
  }));

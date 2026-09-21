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
  constructor(_0x277ce8) {
    this.owner = _0x277ce8;
  }
  ['_names']() {
    return String(this.owner.className || '')
      .split(/\s+/)
      .filter(Boolean);
  }
  ['_set'](_0x145d66) {
    this.owner.className = Array.from(new Set(_0x145d66)).join(' ');
  }
  ['add'](..._0x3ba870) {
    const _0x11686e = this._names();
    (_0x3ba870.forEach((_0x39347a) => {
      const _0x310b14 = String(_0x39347a || '').trim();
      if (_0x310b14 && !_0x11686e.includes(_0x310b14)) _0x11686e.push(_0x310b14);
    }),
      this._set(_0x11686e));
  }
  ['remove'](..._0x4b5234) {
    const _0x40dd7e = new Set(_0x4b5234.map((_0xbbda42) => String(_0xbbda42 || '').trim()));
    this._set(this._names().filter((_0x3795a0) => !_0x40dd7e.has(_0x3795a0)));
  }
  ['contains'](_0x5ae5ea) {
    return this._names().includes(_0x5ae5ea);
  }
  ['toggle'](_0x536c62, _0x28d1a8) {
    const _0x1f11cb = _0x28d1a8 === undefined ? !this.contains(_0x536c62) : !!_0x28d1a8;
    if (_0x1f11cb) this.add(_0x536c62);
    else this.remove(_0x536c62);
    return _0x1f11cb;
  }
  [Symbol.iterator]() {
    return this._names()[Symbol.iterator]();
  }
}
class FakeElement {
  constructor(_0x13e053 = 'div', _0x39cd92 = '') {
    ((this.nodeType = 1),
      (this.tagName = String(_0x13e053 || 'div').toUpperCase()),
      (this.className = _0x39cd92),
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
  ['appendChild'](_0x38c5bd) {
    return (
      (this.appendChildCount += 1),
      this._detachChild(_0x38c5bd),
      (_0x38c5bd.parentNode = this),
      _0x38c5bd._setConnected(this.isConnected),
      this.children.push(_0x38c5bd),
      _0x38c5bd
    );
  }
  ['insertBefore'](_0x3ec84f, _0x30cbd3) {
    ((this.insertBeforeCount += 1),
      this._detachChild(_0x3ec84f),
      (_0x3ec84f.parentNode = this),
      _0x3ec84f._setConnected(this.isConnected));
    const _0x352039 = this.children.indexOf(_0x30cbd3);
    if (_0x352039 >= 0) this.children.splice(_0x352039, 0, _0x3ec84f);
    else this.children.push(_0x3ec84f);
    return _0x3ec84f;
  }
  ['_detachChild'](_0x3b1be1) {
    const _0x41f37a = _0x3b1be1?.parentNode;
    if (!_0x41f37a) return;
    const _0x410f8e = _0x41f37a.children.indexOf(_0x3b1be1);
    if (_0x410f8e >= 0) _0x41f37a.children.splice(_0x410f8e, 1);
  }
  ['_setConnected'](_0x389415) {
    ((this.isConnected = !!_0x389415),
      this.children.forEach((_0x3351d6) => _0x3351d6._setConnected(_0x389415)));
  }
  ['setAttribute'](_0x525963, _0x3381a1) {
    const _0x3ba837 = String(_0x525963),
      _0x45b94f = String(_0x3381a1);
    this.attributes.set(_0x3ba837, _0x45b94f);
    if (_0x3ba837.startsWith('data-')) {
      const _0x26c360 = _0x3ba837
        .slice(5)
        .replace(/-([a-z])/g, (_0x4a9b6a, _0x5b9bdf) => _0x5b9bdf.toUpperCase());
      this.dataset[_0x26c360] = _0x45b94f;
    }
  }
  ['getAttribute'](_0x160e16) {
    return this.attributes.get(String(_0x160e16)) ?? null;
  }
  ['addEventListener'](_0x3523eb, _0x34cf37) {
    if (typeof _0x34cf37 !== 'function') return;
    if (!this._listeners.has(_0x3523eb)) this._listeners.set(_0x3523eb, []);
    this._listeners.get(_0x3523eb).push(_0x34cf37);
  }
  ['dispatchEvent'](_0x3bf042) {
    const _0x343056 = {
      target: this,
      currentTarget: this,
      preventDefault() {},
      stopPropagation() {},
      ..._0x3bf042,
    };
    (this._listeners.get(_0x343056.type) || []).forEach((_0xab35ba) => _0xab35ba(_0x343056));
  }
  ['contains'](_0x13ec68) {
    if (_0x13ec68 === this) return true;
    return this.children.some((_0x3c94a9) => _0x3c94a9.contains(_0x13ec68));
  }
  ['matches'](_0x334b5b) {
    return matchesSelector(this, _0x334b5b);
  }
  ['closest'](_0x340069) {
    let _0x182353 = this;
    while (_0x182353) {
      if (_0x182353.matches(_0x340069)) return _0x182353;
      _0x182353 = _0x182353.parentNode;
    }
    return null;
  }
  ['querySelector'](_0x2076a0) {
    return this.querySelectorAll(_0x2076a0)[0] || null;
  }
  ['querySelectorAll'](_0x305ceb) {
    const _0x137f86 = [],
      _0x5c977e = (_0x281ea8) => {
        _0x281ea8.children.forEach((_0x4eaf4b) => {
          if (matchesSelector(_0x4eaf4b, _0x305ceb)) _0x137f86.push(_0x4eaf4b);
          _0x5c977e(_0x4eaf4b);
        });
      };
    return (_0x5c977e(this), _0x137f86);
  }
  ['setRect'](_0x3a646f) {
    this._rect = { ...this._rect, ..._0x3a646f };
  }
  ['getBoundingClientRect']() {
    const _0x52437d = this.parentNode ? this.parentNode.children.indexOf(this) : -1,
      _0x107c62 = {
        ...this._rect,
        left: _0x52437d >= 0 && this.classList.contains('ftb-btn') ? _0x52437d * 48 : this._rect.left,
      };
    return {
      ..._0x107c62,
      right: _0x107c62.left + _0x107c62.width,
      bottom: _0x107c62.top + _0x107c62.height,
    };
  }
  get ['nextSibling']() {
    if (!this.parentNode) return null;
    const _0x82c8c6 = this.parentNode.children.indexOf(this);
    return _0x82c8c6 >= 0 ? this.parentNode.children[_0x82c8c6 + 1] || null : null;
  }
  get ['nextElementSibling']() {
    return this.nextSibling;
  }
  get ['lastElementChild']() {
    return this.children[this.children.length - 1] || null;
  }
}
function matchesSelector(_0x426bdf, _0x31ed16) {
  const _0xbd96fc = String(_0x31ed16 || '').trim();
  if (_0xbd96fc.startsWith('.')) return _0x426bdf.classList.contains(_0xbd96fc.slice(1));
  if (_0xbd96fc === '[data-zone]') return _0x426bdf.getAttribute('data-zone') !== null;
  const _0x23e738 = _0xbd96fc.match(/^\[data-([a-z-]+)="([^"]+)"\]$/);
  if (_0x23e738) return _0x426bdf.getAttribute('data-' + _0x23e738[1]) === _0x23e738[2];
  return false;
}
function installFakeDocument() {
  const _0x396ed3 = new FakeElement('body');
  _0x396ed3._setConnected(true);
  const _0x262c04 = new Map();
  ((globalThis.document = {
    body: _0x396ed3,
    addEventListener(_0x5a764f, _0x185f86) {
      if (!_0x262c04.has(_0x5a764f)) _0x262c04.set(_0x5a764f, []);
      _0x262c04.get(_0x5a764f).push(_0x185f86);
    },
    removeEventListener(_0x4bafa2, _0x1b67c9) {
      const _0x30435a = (_0x262c04.get(_0x4bafa2) || []).filter((_0x4b5667) => _0x4b5667 !== _0x1b67c9);
      _0x262c04.set(_0x4bafa2, _0x30435a);
    },
  }),
    (globalThis.requestAnimationFrame = () => 1),
    (globalThis.cancelAnimationFrame = () => {}));
}
function createButton(_0x592d3f) {
  return new FakeElement('button', 'ftb-btn act-' + _0x592d3f);
}
function createToolbarHarness() {
  installFakeDocument();
  const _0x3d214b = new FakeElement('div', 'v2-img-toolbar'),
    _0x99124a = new FakeElement('div', 'v2-img-toolbar-zone');
  _0x99124a.setAttribute('data-zone', 'outside-primary');
  const _0x49eafd = new FakeElement('div', 'v2-img-toolbar-zone');
  _0x49eafd.setAttribute('data-zone', 'outside-secondary');
  const _0x458cba = createButton('more-tools'),
    _0x4ab255 = new FakeElement('div', 'v2-img-toolbar-main-divider'),
    _0x3c9904 = new FakeElement('div', 'v2-img-toolbar-more-menu');
  _0x3c9904.setAttribute('data-role', 'more-menu');
  const _0x3d8517 = new FakeElement('div', 'v2-img-toolbar-zone');
  _0x3d8517.setAttribute('data-zone', 'more');
  const _0x373e54 = createButton('customize-tools');
  _0x373e54.classList.add('act-customize-tools');
  const _0xff7376 = createButton('matting'),
    _0x4577f7 = createButton('expand'),
    _0x3050c0 = createButton('hd');
  return (
    _0xff7376.setRect({ left: 0, top: 0, width: 38, height: 38 }),
    _0x4577f7.setRect({ left: 48, top: 0, width: 38, height: 38 }),
    _0x99124a.appendChild(_0xff7376),
    _0x99124a.appendChild(_0x4577f7),
    _0x3d8517.appendChild(_0x3050c0),
    _0x3c9904.appendChild(_0x3d8517),
    _0x3c9904.appendChild(_0x373e54),
    _0x3d214b.appendChild(_0x99124a),
    _0x3d214b.appendChild(_0x458cba),
    _0x3d214b.appendChild(_0x4ab255),
    _0x3d214b.appendChild(_0x49eafd),
    _0x3d214b.appendChild(_0x3c9904),
    document.body.appendChild(_0x3d214b),
    {
      toolbarEl: _0x3d214b,
      primaryZone: _0x99124a,
      moreZone: _0x3d8517,
      moreMenu: _0x3c9904,
      customizeBtn: _0x373e54,
      mattingBtn: _0xff7376,
      expandBtn: _0x4577f7,
      hdBtn: _0x3050c0,
    }
  );
}
function actionFromButton(_0x25be27) {
  const _0x18a91d = new Set(['matting', 'expand', 'hd']);
  for (const _0x3f4c13 of _0x25be27.classList) {
    if (!_0x3f4c13.startsWith('act-')) continue;
    const _0x1a2a7e = _0x3f4c13.slice(4);
    if (_0x18a91d.has(_0x1a2a7e)) return _0x1a2a7e;
  }
  return '';
}
function normalizeLayout(_0x41abf7) {
  return {
    outsidePrimary: [...(_0x41abf7?.outsidePrimary || [])],
    outsideSecondary: [...(_0x41abf7?.outsideSecondary || [])],
    more: [...(_0x41abf7?.more || [])],
  };
}
(test('image toolbar custom drag skips DOM writes when the slot is unchanged', () => {
  const _0xa0332a = createToolbarHarness(),
    _0x2cde27 = {
      ui: {
        imageToolbarLayout: { outsidePrimary: ['matting', 'expand'], outsideSecondary: [], more: ['hd'] },
      },
    };
  (bindImageToolbarLayoutUi(_0xa0332a.toolbarEl, {
    store: {},
    getStateSnapshot: () => _0x2cde27,
    imageToolbarActions: ['matting', 'expand', 'hd'],
    normalizeImageToolbarLayout: normalizeLayout,
    serializeImageToolbarLayout: (_0x4478f3) => JSON.stringify(normalizeLayout(_0x4478f3)),
    getToolbarActionFromButton: actionFromButton,
  }),
    _0xa0332a.customizeBtn.dispatchEvent({ type: 'click' }),
    assert.equal(_0xa0332a.mattingBtn.draggable, true),
    _0xa0332a.mattingBtn.dispatchEvent({
      type: 'dragstart',
      dataTransfer: { effectAllowed: '', setData() {} },
    }),
    assert.equal(_0xa0332a.toolbarEl.classList.contains('is-toolbar-drag-active'), true),
    assert.equal(_0xa0332a.moreMenu.classList.contains('is-toolbar-drag-active'), true));
  const _0x4bcecb = _0xa0332a.primaryZone.insertBeforeCount,
    _0x1175ab = _0xa0332a.primaryZone.appendChildCount;
  (_0xa0332a.primaryZone.dispatchEvent({ type: 'dragover', clientX: 0, preventDefault() {} }),
    assert.equal(_0xa0332a.primaryZone.insertBeforeCount, _0x4bcecb),
    assert.equal(_0xa0332a.primaryZone.appendChildCount, _0x1175ab),
    _0xa0332a.mattingBtn.dispatchEvent({ type: 'dragend' }),
    assert.equal(_0xa0332a.toolbarEl.classList.contains('is-toolbar-drag-active'), false),
    assert.equal(_0xa0332a.moreMenu.classList.contains('is-toolbar-drag-active'), false));
}),
  test('image toolbar custom drag keeps drop zone background stable while moving inside it', () => {
    const _0x29f578 = createToolbarHarness(),
      _0x43ea7d = {
        ui: {
          imageToolbarLayout: { outsidePrimary: ['matting', 'expand'], outsideSecondary: [], more: ['hd'] },
        },
      };
    (bindImageToolbarLayoutUi(_0x29f578.toolbarEl, {
      store: {},
      getStateSnapshot: () => _0x43ea7d,
      imageToolbarActions: ['matting', 'expand', 'hd'],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (_0x47ef84) => JSON.stringify(normalizeLayout(_0x47ef84)),
      getToolbarActionFromButton: actionFromButton,
    }),
      _0x29f578.customizeBtn.dispatchEvent({ type: 'click' }),
      _0x29f578.mattingBtn.dispatchEvent({
        type: 'dragstart',
        dataTransfer: { effectAllowed: '', setData() {} },
      }),
      _0x29f578.primaryZone.dispatchEvent({
        type: 'dragover',
        target: _0x29f578.expandBtn,
        clientX: 0,
        preventDefault() {},
      }),
      assert.equal(_0x29f578.primaryZone.classList.contains('is-drop-target'), true),
      _0x29f578.primaryZone.dispatchEvent({ type: 'dragleave', relatedTarget: _0x29f578.expandBtn }),
      assert.equal(_0x29f578.primaryZone.classList.contains('is-drop-target'), true),
      _0x29f578.moreZone.dispatchEvent({
        type: 'dragover',
        target: _0x29f578.hdBtn,
        clientX: 0,
        preventDefault() {},
      }),
      assert.equal(_0x29f578.primaryZone.classList.contains('is-drop-target'), false),
      assert.equal(_0x29f578.moreZone.classList.contains('is-drop-target'), true));
  }),
  test('image toolbar custom drag uses flip transforms when buttons are pushed aside', () => {
    const _0x3ccdb5 = createToolbarHarness(),
      _0x57ea34 = {
        ui: {
          imageToolbarLayout: { outsidePrimary: ['matting', 'expand'], outsideSecondary: [], more: ['hd'] },
        },
      };
    (bindImageToolbarLayoutUi(_0x3ccdb5.toolbarEl, {
      store: {},
      getStateSnapshot: () => _0x57ea34,
      imageToolbarActions: ['matting', 'expand', 'hd'],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (_0x4d48b0) => JSON.stringify(normalizeLayout(_0x4d48b0)),
      getToolbarActionFromButton: actionFromButton,
    }),
      _0x3ccdb5.customizeBtn.dispatchEvent({ type: 'click' }),
      _0x3ccdb5.mattingBtn.dispatchEvent({
        type: 'dragstart',
        dataTransfer: { effectAllowed: '', setData() {} },
      }),
      _0x3ccdb5.primaryZone.dispatchEvent({
        type: 'dragover',
        target: _0x3ccdb5.expandBtn,
        clientX: 0x3e7,
        preventDefault() {},
      }),
      assert.deepEqual(_0x3ccdb5.primaryZone.children, [_0x3ccdb5.expandBtn, _0x3ccdb5.mattingBtn]),
      assert.match(String(_0x3ccdb5.expandBtn.style.transform || ''), /translate\(48px/),
      assert.match(String(_0x3ccdb5.mattingBtn.style.transform || ''), /translate\(-48px/));
  }),
  test('image toolbar custom drag persists the portaled more zone order', () => {
    const _0x4efff5 = createToolbarHarness(),
      _0x3793e4 = {
        ui: {
          imageToolbarLayout: { outsidePrimary: ['matting'], outsideSecondary: [], more: ['expand', 'hd'] },
        },
      };
    let _0x120297 = null;
    (bindImageToolbarLayoutUi(_0x4efff5.toolbarEl, {
      store: {
        setImageToolbarLayout(_0x2e8fa8) {
          _0x120297 = _0x2e8fa8;
        },
      },
      getStateSnapshot: () => _0x3793e4,
      imageToolbarActions: ['matting', 'expand', 'hd'],
      normalizeImageToolbarLayout: normalizeLayout,
      serializeImageToolbarLayout: (_0x47ad94) => JSON.stringify(normalizeLayout(_0x47ad94)),
      getToolbarActionFromButton: actionFromButton,
    }),
      _0x4efff5.customizeBtn.dispatchEvent({ type: 'click' }),
      assert.equal(_0x4efff5.moreMenu.parentNode, document.body),
      _0x4efff5.hdBtn.dispatchEvent({ type: 'dragstart', dataTransfer: { effectAllowed: '', setData() {} } }),
      _0x4efff5.moreZone.dispatchEvent({ type: 'dragover', clientX: 0, preventDefault() {} }),
      _0x4efff5.moreZone.dispatchEvent({ type: 'drop', preventDefault() {} }),
      assert.deepEqual(_0x120297, {
        outsidePrimary: ['matting'],
        outsideSecondary: [],
        more: ['hd', 'expand'],
      }));
  }));

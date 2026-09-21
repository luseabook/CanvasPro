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
  constructor(_0x2e23f5 = 'div') {
    ((this.nodeType = 1),
      (this.tagName = String(_0x2e23f5 || 'div').toUpperCase()),
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
        add: (..._0x4acbe6) => this._setClasses(_0x4acbe6, true),
        remove: (..._0x202553) => this._setClasses(_0x202553, false),
        contains: (_0x1c646e) => this._classNames().includes(_0x1c646e),
      }));
  }
  ['_classNames']() {
    return String(this.className || '')
      .split(/\s+/)
      .filter(Boolean);
  }
  ['_setClasses'](_0x23e8b9, _0x27b19b) {
    const _0x213ea3 = new Set(this._classNames());
    (_0x23e8b9.forEach((_0x1418fe) => {
      const _0x266cdf = String(_0x1418fe || '').trim();
      if (!_0x266cdf) return;
      if (_0x27b19b) _0x213ea3.add(_0x266cdf);
      else _0x213ea3.delete(_0x266cdf);
    }),
      (this.className = Array.from(_0x213ea3).join(' ')));
  }
  ['appendChild'](_0x354e01) {
    return ((_0x354e01.parentNode = this), this.children.push(_0x354e01), _0x354e01);
  }
  ['remove']() {
    if (!this.parentNode) return;
    const _0x5d1b07 = this.parentNode.children || [],
      _0x1fcb94 = _0x5d1b07.indexOf(this);
    if (_0x1fcb94 >= 0) _0x5d1b07.splice(_0x1fcb94, 1);
    this.parentNode = null;
  }
  ['closest'](_0x5e3754) {
    const _0x1c6de6 = String(_0x5e3754 || '').startsWith('.') ? String(_0x5e3754).slice(1) : '';
    let _0x2d5008 = this;
    while (_0x2d5008) {
      if (_0x1c6de6 && _0x2d5008.classList?.contains(_0x1c6de6)) return _0x2d5008;
      _0x2d5008 = _0x2d5008.parentNode;
    }
    return null;
  }
  ['contains'](_0x9dcb4b) {
    if (_0x9dcb4b === this) return true;
    return this.children.some((_0x36157e) => _0x36157e?.contains?.(_0x9dcb4b));
  }
  ['addEventListener'](_0x16d13a, _0xae5e14) {
    if (typeof _0xae5e14 !== 'function') return;
    if (!this._listeners.has(_0x16d13a)) this._listeners.set(_0x16d13a, []);
    this._listeners.get(_0x16d13a).push(_0xae5e14);
  }
  ['removeEventListener'](_0x5a4268, _0x3c0133) {
    const _0x1027a4 = this._listeners.get(_0x5a4268) || [];
    this._listeners.set(
      _0x5a4268,
      _0x1027a4.filter((_0x153704) => _0x153704 !== _0x3c0133),
    );
  }
  ['dispatchEvent'](_0x55d3ba) {
    const _0x315bf6 = { target: this, stopPropagation() {}, preventDefault() {}, ..._0x55d3ba };
    (this._listeners.get(_0x315bf6.type) || []).forEach((_0x1919dc) => _0x1919dc(_0x315bf6));
  }
  ['querySelector'](_0x221f75) {
    return this.querySelectorAll(_0x221f75)[0] || null;
  }
  ['querySelectorAll'](_0x56f4d0) {
    const _0x2dda29 = String(_0x56f4d0 || '').startsWith('.') ? String(_0x56f4d0).slice(1) : '',
      _0x3fcd87 = [],
      _0xdf3eb1 = (_0x3a99a2) => {
        if (!_0x3a99a2) return;
        if (_0x2dda29 && _0x3a99a2.classList?.contains(_0x2dda29)) _0x3fcd87.push(_0x3a99a2);
        (_0x3a99a2.children || []).forEach(_0xdf3eb1);
      };
    return (_0xdf3eb1(this), _0x3fcd87);
  }
  ['getBoundingClientRect']() {
    const _0xd18cd7 = { left: 0, top: 0, width: 0, height: 0, ...this._rect };
    return {
      ..._0xd18cd7,
      right: _0xd18cd7.right ?? _0xd18cd7.left + _0xd18cd7.width,
      bottom: _0xd18cd7.bottom ?? _0xd18cd7.top + _0xd18cd7.height,
    };
  }
  ['setRect'](_0x4a1d3b) {
    ((this._rect = { ..._0x4a1d3b }),
      (this._offsetLeft = Number(_0x4a1d3b?.offsetLeft ?? _0x4a1d3b?.left ?? 0)),
      (this._offsetWidth = Number(_0x4a1d3b?.offsetWidth ?? _0x4a1d3b?.width ?? 0)));
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
  const _0x17a0aa = new FakeElement('body'),
    _0x33a7cd = new Map(),
    _0x227866 = {
      body: _0x17a0aa,
      createElement(_0x31b925) {
        return new FakeElement(_0x31b925);
      },
      querySelector(_0x438be2) {
        return _0x17a0aa.querySelector(_0x438be2);
      },
      querySelectorAll(_0x2cf9ad) {
        return _0x17a0aa.querySelectorAll(_0x2cf9ad);
      },
      addEventListener(_0x3bf71b, _0x3bf4b3, _0x13f580) {
        if (typeof _0x3bf4b3 !== 'function') return;
        if (!_0x33a7cd.has(_0x3bf71b)) _0x33a7cd.set(_0x3bf71b, []);
        _0x33a7cd.get(_0x3bf71b).push({ handler: _0x3bf4b3, options: _0x13f580 });
      },
      removeEventListener(_0x4bb086, _0x21157f) {
        const _0x25aa80 = _0x33a7cd.get(_0x4bb086) || [];
        _0x33a7cd.set(
          _0x4bb086,
          _0x25aa80.filter((_0x445884) => _0x445884.handler !== _0x21157f),
        );
      },
      dispatchPointerDown(_0x6b77a4) {
        (_0x33a7cd.get('pointerdown') || []).forEach(({ handler: _0x3c8820 }) =>
          _0x3c8820({ target: _0x6b77a4 }),
        );
      },
      getListeners(_0x375cf6) {
        return _0x33a7cd.get(_0x375cf6) || [];
      },
    };
  let _0x24cba2 = 0;
  const _0x247e49 = new Map();
  return (
    (globalThis.document = _0x227866),
    (globalThis.window = {
      setTimeout(_0x4ea9bc) {
        return (_0x4ea9bc?.(), 1);
      },
      clearTimeout() {},
    }),
    (globalThis.requestAnimationFrame = (_0x321b0a) => {
      return ((_0x24cba2 += 1), _0x247e49.set(_0x24cba2, _0x321b0a), _0x24cba2);
    }),
    (globalThis.cancelAnimationFrame = (_0x14adf3) => {
      _0x247e49.delete(_0x14adf3);
    }),
    {
      document: _0x227866,
      getRafCount() {
        return _0x247e49.size;
      },
      flushNextRaf() {
        const _0x23965e = _0x247e49.entries().next();
        if (_0x23965e.done) return false;
        const [_0x4e300f, _0x51f147] = _0x23965e.value;
        return (_0x247e49.delete(_0x4e300f), _0x51f147?.(), true);
      },
    }
  );
}
function createToolbarWithHdButton({ inMoreMenu: inMoreMenu = false } = {}) {
  const _0x2fa00f = new FakeElement('div'),
    _0x1807b7 = new FakeElement('button');
  ((_0x1807b7.className = 'act-hd'),
    _0x1807b7.setRect({ left: 100, top: 50, width: 20, height: 20, offsetLeft: 96 }));
  if (inMoreMenu) {
    const _0x1799eb = new FakeElement('div');
    ((_0x1799eb.className = 'v2-img-toolbar-more-menu'),
      _0x1799eb.setRect({ left: 80, top: 120, width: 240, height: 80 }),
      _0x1799eb.appendChild(_0x1807b7),
      _0x2fa00f.appendChild(_0x1799eb));
  } else _0x2fa00f.appendChild(_0x1807b7);
  return (document.body.appendChild(_0x2fa00f), { toolbarEl: _0x2fa00f, hdBtn: _0x1807b7 });
}
function createActionContext(_0x52582d) {
  return {
    toolbarEl: _0x52582d,
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
function openPopup(_0x4ea289) {
  _0x4ea289.dispatchEvent({ type: 'click', target: _0x4ea289, stopPropagation() {}, preventDefault() {} });
  const _0x2432e0 = document.querySelector('.v2-hd-popup');
  return (assert.ok(_0x2432e0), _0x2432e0);
}
(test('video hd popup is portaled to body and follows the toolbar button', () => {
  const { flushNextRaf: _0x57e37d, getRafCount: _0x5a6e20 } = installPopupDom(),
    { toolbarEl: _0x1fe3a8, hdBtn: _0x3f17dd } = createToolbarWithHdButton();
  bindVideoHdAction(createActionContext(_0x1fe3a8));
  const _0xf4e62d = openPopup(_0x3f17dd);
  (assert.equal(_0xf4e62d.parentNode, document.body),
    assert.equal(_0xf4e62d.classList.contains('node-toolbar-action-menu'), true),
    assert.equal(_0xf4e62d.style.position, 'fixed'),
    assert.equal(_0xf4e62d.style.left, '110px'),
    assert.equal(_0xf4e62d.style.top, '38px'),
    assert.equal(document.body.contains(_0xf4e62d), true),
    assert.equal(_0x5a6e20(), 1),
    _0x3f17dd.setRect({ left: 180, top: 90, width: 20, height: 20, offsetLeft: 176 }),
    assert.equal(_0x57e37d(), true),
    assert.equal(_0xf4e62d.style.left, '190px'),
    assert.equal(_0xf4e62d.style.top, '78px'));
}),
  test('video hd popup follows the more-tools menu while it moves', () => {
    const { flushNextRaf: _0x3b228a } = installPopupDom(),
      { toolbarEl: _0x2bdaf0, hdBtn: _0x14f6ab } = createToolbarWithHdButton({ inMoreMenu: true }),
      _0x39817a = _0x14f6ab.closest('.v2-img-toolbar-more-menu');
    bindVideoHdAction(createActionContext(_0x2bdaf0));
    const _0x5c82ea = openPopup(_0x14f6ab);
    (assert.equal(_0x5c82ea.parentNode, document.body),
      assert.equal(_0x5c82ea.style.left, '110px'),
      assert.equal(_0x5c82ea.style.top, '108px'),
      _0x39817a.setRect({ left: 140, top: 210, width: 240, height: 80 }),
      _0x14f6ab.setRect({ left: 220, top: 230, width: 20, height: 20, offsetLeft: 216 }),
      assert.equal(_0x3b228a(), true),
      assert.equal(_0x5c82ea.style.left, '230px'),
      assert.equal(_0x5c82ea.style.top, '198px'));
  }),
  test('video hd popup closes on outside pointerdown', () => {
    const { document: _0x641704 } = installPopupDom(),
      { toolbarEl: _0x192ae5, hdBtn: _0x148c79 } = createToolbarWithHdButton();
    bindVideoHdAction(createActionContext(_0x192ae5));
    const _0x331fac = openPopup(_0x148c79);
    (assert.equal(
      _0x641704.getListeners('pointerdown').some((_0x184d54) => _0x184d54.options === true),
      true,
    ),
      _0x641704.dispatchPointerDown(_0x641704.createElement('div')),
      assert.equal(_0x641704.body.contains(_0x331fac), false));
  }));

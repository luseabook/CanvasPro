import test from 'node:test';
import assert from 'node:assert/strict';
import {
  _resetRefThumbHoverPreviewForTests,
  bindRefThumbHoverPreview,
  resolveRefThumbHoverPreviewUrl,
} from './refThumbHoverPreview.js';
function createWrap({ previewSrc: previewSrc = '', thumbSrc: thumbSrc = '', imgSrc: imgSrc = '' } = {}) {
  return {
    dataset: {
      ...(previewSrc ? { previewSrc: previewSrc } : {}),
      ...(thumbSrc ? { thumbSrc: thumbSrc } : {}),
    },
    querySelector(_0x30c554) {
      if (_0x30c554 !== 'img.ref-thumb-media' || !imgSrc) return null;
      return {
        getAttribute(_0x1998ea) {
          if (_0x1998ea !== 'src') return '';
          return imgSrc;
        },
      };
    },
  };
}
(test.afterEach(() => {
  (_resetRefThumbHoverPreviewForTests(),
    delete globalThis.window,
    delete globalThis.document,
    delete globalThis.requestAnimationFrame,
    delete globalThis.cancelAnimationFrame,
    delete globalThis.Image);
}),
  test('refThumbHoverPreview: 优先读取显式 previewSrc', () => {
    const _0x4359e9 = resolveRefThumbHoverPreviewUrl(
      createWrap({
        previewSrc: '/output/display.jpg',
        thumbSrc: '/output/thumb.jpg',
        imgSrc: '/output/thumb-from-dom.jpg',
      }),
    );
    assert.equal(_0x4359e9, '/output/display.jpg');
  }),
  test('refThumbHoverPreview: 没有 previewSrc 时回退显式 thumbSrc', () => {
    const _0x32d28c = resolveRefThumbHoverPreviewUrl(
      createWrap({ thumbSrc: '/output/thumb.jpg', imgSrc: '/output/thumb-from-dom.jpg' }),
    );
    assert.equal(_0x32d28c, '/output/thumb.jpg');
  }),
  test('refThumbHoverPreview: 仅老 DOM 结构时才回退 img src', () => {
    const _0x893306 = resolveRefThumbHoverPreviewUrl(createWrap({ imgSrc: '/output/thumb-from-dom.jpg' }));
    assert.equal(_0x893306, '/output/thumb-from-dom.jpg');
  }),
  test('refThumbHoverPreview: 切换到下一张时不再继续显示上一张预览', () => {
    const _0x481ae1 = [];
    ((globalThis.Image = class _0x3123b6 {
      set ['src'](_0x4f43fa) {
        this._src = _0x4f43fa;
      }
      get ['src']() {
        return this._src || '';
      }
      ['decode']() {
        return new Promise((_0x430044) => {
          _0x481ae1.push(_0x430044);
        });
      }
    }),
      (globalThis.requestAnimationFrame = (_0x4113ed) => {
        return (_0x4113ed(), 1);
      }),
      (globalThis.cancelAnimationFrame = () => {}),
      (globalThis.window = {
        addEventListener() {},
        setTimeout(_0x3bec67) {
          return setTimeout(_0x3bec67, 0);
        },
        clearTimeout(_0xb461a6) {
          clearTimeout(_0xb461a6);
        },
      }));
    const _0x910a1d = [],
      _0x3748a6 = () => {
        const _0x2113b5 = new Set();
        return {
          add(..._0x326c0c) {
            _0x326c0c.forEach((_0x3ee704) => _0x2113b5.add(String(_0x3ee704 || '')));
          },
          remove(..._0x4e42c9) {
            _0x4e42c9.forEach((_0x248791) => _0x2113b5.delete(String(_0x248791 || '')));
          },
          contains(_0x3e947b) {
            return _0x2113b5.has(String(_0x3e947b || ''));
          },
        };
      },
      _0x22f498 = (_0x47a2dd = 'div') => {
        const _0x56dfa4 = {
          tagName: String(_0x47a2dd || 'div').toUpperCase(),
          className: '',
          classList: _0x3748a6(),
          style: {},
          children: [],
          appendChild(_0x449b71) {
            return (this.children.push(_0x449b71), (_0x449b71.parentNode = this), _0x449b71);
          },
        };
        return (_0x56dfa4.tagName === 'IMG' && ((_0x56dfa4.src = ''), (_0x56dfa4.alt = '')), _0x56dfa4);
      };
    globalThis.document = {
      body: {
        appendChild(_0x13c5d1) {
          return (_0x910a1d.push(_0x13c5d1), (_0x13c5d1.parentNode = this), _0x13c5d1);
        },
      },
      createElement: _0x22f498,
    };
    const _0x34d19b = new Map();
    let _0x1b48ed = null,
      _0x384524 = null;
    const _0x2f9c1b = {
        addEventListener(_0x57aff4, _0x34cd9a) {
          if (!_0x34d19b.has(_0x57aff4)) _0x34d19b.set(_0x57aff4, []);
          _0x34d19b.get(_0x57aff4).push(_0x34cd9a);
        },
        removeEventListener() {},
        contains(_0x3ff8a2) {
          return _0x3ff8a2 === _0x1b48ed || _0x3ff8a2 === _0x384524;
        },
      },
      _0x3d3a1f = (_0x58b542) => ({
        dataset: { previewSrc: _0x58b542, thumbSrc: _0x58b542 + '-thumb' },
        getBoundingClientRect() {
          return { left: 0, top: 0, width: 44, height: 44 };
        },
        querySelector(_0x22da0c) {
          if (_0x22da0c !== 'img.ref-thumb-media') return null;
          return {
            getAttribute(_0x542cbc) {
              if (_0x542cbc !== 'src') return '';
              return _0x58b542 + '-thumb';
            },
          };
        },
        closest(_0x46c4b9) {
          return _0x46c4b9 === '.ref-thumb-wrap' ? this : null;
        },
        contains(_0x152e09) {
          return _0x152e09 === this;
        },
      });
    ((_0x1b48ed = _0x3d3a1f('/output/preview-1.jpg')),
      (_0x384524 = _0x3d3a1f('/output/preview-2.jpg')),
      bindRefThumbHoverPreview(_0x2f9c1b));
    const _0x4d2d18 = (_0x20cff5, _0x3bec59) => {
      for (const _0x7285c3 of _0x34d19b.get(_0x20cff5) || []) {
        _0x7285c3({ type: _0x20cff5, target: _0x3bec59, relatedTarget: null });
      }
    };
    _0x4d2d18('pointerover', _0x1b48ed);
    const _0x3e40b4 = _0x910a1d[0],
      _0x4e7b16 = _0x3e40b4.children[0];
    (assert.equal(_0x4e7b16.src, '/output/preview-1.jpg'),
      assert.equal(_0x4e7b16.classList.contains('is-pending'), false),
      _0x4d2d18('pointerover', _0x384524),
      assert.equal(_0x4e7b16.src, '/output/preview-2.jpg'),
      assert.equal(_0x4e7b16.classList.contains('is-pending'), true),
      _0x481ae1.forEach((_0x23f54f) => _0x23f54f()));
  }));

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
    querySelector(value) {
      if (value !== 'img.ref-thumb-media' || !imgSrc) return null;
      return {
        getAttribute(item) {
          if (item !== 'src') return '';
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
    const refThumbHoverPreviewUrl = resolveRefThumbHoverPreviewUrl(
      createWrap({
        previewSrc: '/output/display.jpg',
        thumbSrc: '/output/thumb.jpg',
        imgSrc: '/output/thumb-from-dom.jpg',
      }),
    );
    assert.equal(refThumbHoverPreviewUrl, '/output/display.jpg');
  }),
  test('refThumbHoverPreview: 没有 previewSrc 时回退显式 thumbSrc', () => {
    const refThumbHoverPreviewUrl2 = resolveRefThumbHoverPreviewUrl(
      createWrap({ thumbSrc: '/output/thumb.jpg', imgSrc: '/output/thumb-from-dom.jpg' }),
    );
    assert.equal(refThumbHoverPreviewUrl2, '/output/thumb.jpg');
  }),
  test('refThumbHoverPreview: 仅老 DOM 结构时才回退 img src', () => {
    const refThumbHoverPreviewUrl3 = resolveRefThumbHoverPreviewUrl(
      createWrap({ imgSrc: '/output/thumb-from-dom.jpg' }),
    );
    assert.equal(refThumbHoverPreviewUrl3, '/output/thumb-from-dom.jpg');
  }),
  test('refThumbHoverPreview: 切换到下一张时不再继续显示上一张预览', () => {
    const list = [];
    ((globalThis.Image = class key {
      set ['src'](index) {
        this._src = index;
      }
      get ['src']() {
        return this._src || '';
      }
      ['decode']() {
        return new Promise((result) => {
          list.push(result);
        });
      }
    }),
      (globalThis.requestAnimationFrame = (handler) => {
        return (handler(), 1);
      }),
      (globalThis.cancelAnimationFrame = () => {}),
      (globalThis.window = {
        addEventListener() {},
        setTimeout(data) {
          return setTimeout(data, 0);
        },
        clearTimeout(options) {
          clearTimeout(options);
        },
      }));
    const list2 = [],
      classList = () => {
        const map = new Set();
        return {
          add(...list3) {
            list3.forEach((item2) => map.add(String(item2 || '')));
          },
          remove(...list4) {
            list4.forEach((item3) => map.delete(String(item3 || '')));
          },
          contains(target) {
            return map.has(String(target || ''));
          },
        };
      },
      createElement = (source = 'div') => {
        const next = {
          tagName: String(source || 'div').toUpperCase(),
          className: '',
          classList: classList(),
          style: {},
          children: [],
          appendChild(el) {
            return (this.children.push(el), (el.parentNode = this), el);
          },
        };
        return (next.tagName === 'IMG' && ((next.src = ''), (next.alt = '')), next);
      };
    globalThis.document = {
      body: {
        appendChild(el2) {
          return (list2.push(el2), (el2.parentNode = this), el2);
        },
      },
      createElement: createElement,
    };
    const map2 = new Map();
    let current = null,
      entry = null;
    const record = {
        addEventListener(payload, handle) {
          if (!map2.has(payload)) map2.set(payload, []);
          map2.get(payload).push(handle);
        },
        removeEventListener() {},
        contains(state) {
          return state === current || state === entry;
        },
      },
      handler2 = (previewSrc2) => ({
        dataset: { previewSrc: previewSrc2, thumbSrc: previewSrc2 + '-thumb' },
        getBoundingClientRect() {
          return { left: 0, top: 0, width: 44, height: 44 };
        },
        querySelector(config) {
          if (config !== 'img.ref-thumb-media') return null;
          return {
            getAttribute(scope) {
              if (scope !== 'src') return '';
              return previewSrc2 + '-thumb';
            },
          };
        },
        closest(input) {
          return input === '.ref-thumb-wrap' ? this : null;
        },
        contains(output) {
          return output === this;
        },
      });
    ((current = handler2('/output/preview-1.jpg')),
      (entry = handler2('/output/preview-2.jpg')),
      bindRefThumbHoverPreview(record));
    const run = (type, target2) => {
      for (const run2 of map2.get(type) || []) {
        run2({ type: type, target: target2, relatedTarget: null });
      }
    };
    run('pointerover', current);
    const el3 = list2[0],
      el4 = el3.children[0];
    (assert.equal(el4.src, '/output/preview-1.jpg'),
      assert.equal(el4.classList.contains('is-pending'), false),
      run('pointerover', entry),
      assert.equal(el4.src, '/output/preview-2.jpg'),
      assert.equal(el4.classList.contains('is-pending'), true),
      list.forEach((handler3) => handler3()));
  }));

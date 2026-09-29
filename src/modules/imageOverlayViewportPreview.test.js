import test from 'node:test';
import assert from 'node:assert/strict';
import { VIEWPORT_PAN_PREVIEW_FRAME_EVENT } from '../core/viewportPanPreview.js';
import {
  bindImageOverlayViewportPreview,
  mergeImageOverlayPreviewViewport,
} from './imageOverlayViewportPreview.js';

test('imageOverlayViewportPreview: 视图不是对象时直接返回 null', () => {
  assert.equal(mergeImageOverlayPreviewViewport(null, { x: 1, y: 2, zoom: 1 }), null);
  assert.equal(mergeImageOverlayPreviewViewport('view', { x: 1, y: 2, zoom: 1 }), null);
  assert.equal(mergeImageOverlayPreviewViewport(undefined, { x: 1, y: 2, zoom: 1 }), null);
});

test('imageOverlayViewportPreview: 预览视口非法时一律不合并', () => {
  const view = { id: 'v1' };
  assert.equal(mergeImageOverlayPreviewViewport(view, null), null);
  assert.equal(mergeImageOverlayPreviewViewport(view, { x: 1, y: 2 }), null, '缺 zoom');
  assert.equal(mergeImageOverlayPreviewViewport(view, { x: 1, y: 2, zoom: 0 }), null);
  assert.equal(mergeImageOverlayPreviewViewport(view, { x: 1, y: 2, zoom: -1 }), null);
  assert.equal(mergeImageOverlayPreviewViewport(view, { x: NaN, y: 2, zoom: 1 }), null);
  assert.equal(mergeImageOverlayPreviewViewport(view, { x: 1, y: 'z', zoom: 1 }), null);
});

test('imageOverlayViewportPreview: 合并时数字会被规整，原有字段与旧 viewport 字段保留', () => {
  const merged = mergeImageOverlayPreviewViewport(
    { id: 'v1', viewport: { keep: 9 } },
    { x: '5', y: '6', zoom: '2' },
  );
  assert.deepEqual(merged, { id: 'v1', viewport: { keep: 9, x: 5, y: 6, zoom: 2 } });
});

test('imageOverlayViewportPreview: 缺少窗口事件能力、或取视图函数缺失时，绑定退化成空函数', () => {
  const noopCases = [
    { windowObject: null, getView: () => ({}), updateView: () => {} },
    { windowObject: {}, getView: () => ({}), updateView: () => {} },
    { windowObject: { addEventListener() {} }, getView: null, updateView: () => {} },
    { windowObject: { addEventListener() {} }, getView: () => ({}), updateView: 'nope' },
  ];
  for (const options of noopCases) {
    const off = bindImageOverlayViewportPreview(options);
    assert.equal(typeof off, 'function');
    assert.equal(off(), undefined, '空函数不需要参数也能安全调用');
  }
  assert.equal(bindImageOverlayViewportPreview({ windowObject: { addEventListener() {} } })(), undefined);
});

test('imageOverlayViewportPreview: 绑定时立刻套用一次当前预览，之后跟随帧事件更新', () => {
  const listeners = {};
  const removed = [];
  const windowObject = {
    addEventListener: (name, handler) => {
      listeners[name] = handler;
    },
    removeEventListener: (name, handler) => {
      removed.push([name, handler]);
    },
  };
  const applied = [];
  const off = bindImageOverlayViewportPreview({
    windowObject,
    getView: () => ({ id: 'v1' }),
    updateView: (view) => applied.push(view),
    getCurrentPreview: () => ({ x: 1, y: 2, zoom: 1 }),
  });

  assert.deepEqual(applied, [{ id: 'v1', viewport: { x: 1, y: 2, zoom: 1 } }]);
  assert.equal(typeof listeners[VIEWPORT_PAN_PREVIEW_FRAME_EVENT], 'function');

  listeners[VIEWPORT_PAN_PREVIEW_FRAME_EVENT]({ detail: { viewport: { x: 10, y: 20, zoom: 2 } } });
  assert.equal(applied.length, 2);
  assert.equal(applied[1].viewport.x, 10);
  assert.equal(applied[1].viewport.zoom, 2);

  listeners[VIEWPORT_PAN_PREVIEW_FRAME_EVENT]({ detail: {} });
  assert.equal(applied.length, 2, '帧里没有合法视口就不更新');

  listeners[VIEWPORT_PAN_PREVIEW_FRAME_EVENT](undefined);
  assert.equal(applied.length, 2, '事件对象缺失也不能抛错');

  off();
  assert.deepEqual(removed, [[VIEWPORT_PAN_PREVIEW_FRAME_EVENT, listeners[VIEWPORT_PAN_PREVIEW_FRAME_EVENT]]]);
});

test('imageOverlayViewportPreview: 没有当前预览时只挂事件，不立刻更新', () => {
  const applied = [];
  const listeners = {};
  bindImageOverlayViewportPreview({
    windowObject: {
      addEventListener: (name, handler) => {
        listeners[name] = handler;
      },
      removeEventListener() {},
    },
    getView: () => ({ id: 'v1' }),
    updateView: (view) => applied.push(view),
    getCurrentPreview: () => null,
  });
  assert.deepEqual(applied, []);
  assert.equal(typeof listeners[VIEWPORT_PAN_PREVIEW_FRAME_EVENT], 'function');
});

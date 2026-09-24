import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getVideoPresentationSource,
  resetVideoFramePresentation,
  hasPresentedVideoFrame,
  watchVideoFramePresentation,
  __videoFramePresentationForTest,
} from './videoFramePresentation.js';

const SRC = 'http://cdn.local/a.mp4';

function makeVideo(over = {}) {
  const el = {
    dataset: 'dataset' in over ? over.dataset : {},
    currentSrc: 'currentSrc' in over ? over.currentSrc : '',
    src: 'src' in over ? over.src : SRC,
    readyState: 'readyState' in over ? over.readyState : 3,
    videoWidth: 'videoWidth' in over ? over.videoWidth : 640,
    videoHeight: 'videoHeight' in over ? over.videoHeight : 360,
    error: 'error' in over ? over.error : null,
    isConnected: 'isConnected' in over ? over.isConnected : true,
    requested: [],
    cancelled: [],
    counts: new Map(),
    _attrs: 'attrs' in over ? over.attrs : {},
    _removeCalls: [],
    getAttribute(name) {
      return this._attrs[name] === undefined ? null : this._attrs[name];
    },
    addEventListener(type, fn) {
      if (!this.counts.has(type)) this.counts.set(type, []);
      this.counts.get(type).push(fn);
    },
    removeEventListener(type, fn) {
      this._removeCalls.push(type);
      const list = this.counts.get(type) || [];
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    },
    emit(type, ...args) {
      for (const fn of (this.counts.get(type) || []).slice()) fn(...args);
    },
    listenerCount(type) {
      return (this.counts.get(type) || []).length;
    },
  };
  if (!('noFrameCallback' in over && over.noFrameCallback)) {
    el.requestVideoFrameCallback = (fn) => {
      el.requested.push(fn);
      return el.requested.length;
    };
    el.cancelVideoFrameCallback = (id) => {
      el.cancelled.push(id);
    };
  }
  return el;
}
function fire(el, now, meta) {
  el.requested[el.requested.length - 1](now, meta);
}

test('getVideoPresentationSource：dataset > currentSrc > getAttribute(src) > src', () => {
  assert.equal(
    getVideoPresentationSource({
      dataset: { desktopMediaSourceUrl: 'http://d/1.mp4' },
      currentSrc: 'http://c/1.mp4',
      attrs: {},
      src: 'http://s/1.mp4',
      getAttribute: () => 'http://a/1.mp4',
    }),
    'http://d/1.mp4',
  );
  assert.equal(
    getVideoPresentationSource({ currentSrc: 'http://c/1.mp4', src: 'http://s/1.mp4' }),
    'http://c/1.mp4',
  );
  assert.equal(
    getVideoPresentationSource({ src: 'http://s/1.mp4', getAttribute: () => 'http://a/1.mp4' }),
    'http://a/1.mp4',
  );
  assert.equal(getVideoPresentationSource({ src: 'http://s/1.mp4' }), 'http://s/1.mp4');
});
test('getVideoPresentationSource：全缺失 / 假值元素 ⇒ 空串（不抛）', () => {
  assert.equal(getVideoPresentationSource({}), '');
  assert.equal(getVideoPresentationSource(null), '');
  assert.equal(getVideoPresentationSource(undefined), '');
});
test('normalizeSource：绝对 URL 会被 URL 归一，非 URL 值 trim 后原样回落', () => {
  assert.equal(getVideoPresentationSource({ src: '   ' + SRC + '   ' }), SRC);
  assert.equal(getVideoPresentationSource({ src: 'clip.mp4' }), 'clip.mp4');
  assert.equal(
    getVideoPresentationSource({ src: 'http://cdn.local/dir/../a.mp4' }),
    'http://cdn.local/a.mp4',
  );
  assert.equal(getVideoPresentationSource({ src: 'http://cdn.local//a.mp4' }), 'http://cdn.local//a.mp4');
});
test('normalizeSource：有 location 基时相对路径按基解析', () => {
  const prevLocation = globalThis.location;
  const prevWindow = globalThis.window;
  try {
    globalThis.location = { href: 'http://host/dir/index.html' };
    assert.equal(getVideoPresentationSource({ src: 'media/clip.mp4' }), 'http://host/dir/media/clip.mp4');
  } finally {
    globalThis.location = prevLocation;
    globalThis.window = prevWindow;
  }
});

test('watchVideoFramePresentation：假值元素 / 无源元素 ⇒ false 且不建状态', () => {
  assert.equal(
    watchVideoFramePresentation(null, () => {}),
    false,
  );
  const el = makeVideo({ src: '', currentSrc: '', attrs: {} });
  assert.equal(
    watchVideoFramePresentation(el, () => {}),
    false,
  );
  assert.equal(__videoFramePresentationForTest.getState(el), null);
});
test('watchVideoFramePresentation：首挂登记 emptied 监听 + 一次帧回调，尚未 presented', () => {
  const el = makeVideo();
  assert.equal(
    watchVideoFramePresentation(el, () => {}),
    true,
  );
  assert.equal(el.listenerCount('emptied'), 1);
  assert.equal(el.requested.length, 1);
  const state = __videoFramePresentationForTest.getState(el);
  assert.equal(state.source, SRC);
  assert.equal(state.presented, false);
  assert.equal(state.frameCallbackObserved, false);
  assert.equal(state.callbackId, 1);
});
test('帧回调命中：置 presented、写 dataset 三键、按阈值 1 认可、通知并清空监听集', () => {
  const el = makeVideo();
  const got = [];
  watchVideoFramePresentation(el, (p) => got.push(p));
  fire(el, 1234.5, { mediaTime: 2, presentedFrames: 7 });
  const state = __videoFramePresentationForTest.getState(el);
  assert.equal(state.presented, true);
  assert.equal(state.presentedAt, 1234.5);
  assert.deepEqual(el.dataset, {
    firstFramePresented: '1',
    firstFramePresentedAt: '1234.5',
    firstFramePresentedSource: SRC,
  });
  assert.deepEqual(got, [
    {
      source: SRC,
      presentedAt: 1234.5,
      metadata: { mediaTime: 2, presentedFrames: 7, width: 640, height: 360 },
    },
  ]);
  assert.equal(state.listeners.size, 0);
});
test('帧回调元数据宽高回落：meta 缺失用元素 videoWidth/Height，皆缺失得 0', () => {
  const el = makeVideo();
  watchVideoFramePresentation(el, () => {});
  fire(el, 10);
  assert.deepEqual(__videoFramePresentationForTest.getState(el).metadata, {
    mediaTime: 0,
    presentedFrames: 0,
    width: 640,
    height: 360,
  });
  const flat = makeVideo();
  watchVideoFramePresentation(flat, () => {});
  fire(flat, 10, { width: 0, height: 0 });
  assert.deepEqual(__videoFramePresentationForTest.getState(flat).metadata.height, 360);
});
test('帧回调：回调挂账期间 callbackId 复用，不重复登记第二次', () => {
  const el = makeVideo();
  assert.equal(
    watchVideoFramePresentation(el, () => {}),
    true,
  );
  assert.equal(
    watchVideoFramePresentation(el, () => {}),
    true,
  );
  assert.equal(el.requested.length, 1);
  assert.equal(__videoFramePresentationForTest.getState(el).listeners.size, 2);
});
test('帧回调：videoWidth 为 0 但 meta 带宽 ⇒ 记账 observed，却因当前帧无效而不 presented', () => {
  const el = makeVideo({ videoWidth: 0 });
  const got = [];
  watchVideoFramePresentation(el, (p) => got.push(p));
  fire(el, 99, { width: 1280, height: 720, mediaTime: 1 });
  const state = __videoFramePresentationForTest.getState(el);
  assert.equal(state.frameCallbackObserved, true);
  assert.equal(state.presented, false);
  assert.deepEqual(el.dataset, {});
  assert.deepEqual(got, []);
  assert.equal(state.callbackId, null);
});
test('帧回调：源已切换（状态被替换）时旧回调直接作废', () => {
  const el = makeVideo();
  watchVideoFramePresentation(el, () => {});
  const oldCb = el.requested[0];
  const oldState = __videoFramePresentationForTest.getState(el);
  el.dataset.desktopMediaSourceUrl = 'http://cdn.local/b.mp4';
  watchVideoFramePresentation(el, () => {});
  oldCb(1, { width: 10, height: 10 });
  assert.equal(oldState.presented, false);
  assert.equal('firstFramePresented' in el.dataset, false);
});
test('已 presented 且当前帧有效（阈值 2）：watch 同步回调新监听者并返回 true，不再登记回调', () => {
  const el = makeVideo();
  watchVideoFramePresentation(el, () => {});
  fire(el, 55, { width: 640, height: 360 });
  const got = [];
  assert.equal(
    watchVideoFramePresentation(el, (p) => got.push(p)),
    true,
  );
  assert.equal(el.requested.length, 1);
  assert.deepEqual(got[0].presentedAt, 55);
  assert.equal(hasPresentedVideoFrame(el), true);
  assert.equal(hasPresentedVideoFrame(el, SRC), true);
});
test('已 presented 但 readyState 掉到 1：hasPresentedVideoFrame 仍 true，watch 却重登一次回调', () => {
  const el = makeVideo();
  watchVideoFramePresentation(el, () => {});
  fire(el, 55, { width: 640, height: 360 });
  el.readyState = 1;
  assert.equal(hasPresentedVideoFrame(el), true);
  const got = [];
  assert.equal(
    watchVideoFramePresentation(el, (p) => got.push(p)),
    true,
  );
  assert.equal(el.requested.length, 2);
  assert.deepEqual(got, []);
});
test('hasPresentedVideoFrame：假值元素 / 无源 / 期望源不符 / error / 尺寸归零都 false', () => {
  const el = makeVideo();
  assert.equal(hasPresentedVideoFrame(null), false);
  assert.equal(hasPresentedVideoFrame(el), false);
  watchVideoFramePresentation(el, () => {});
  fire(el, 55, { width: 640, height: 360 });
  assert.equal(hasPresentedVideoFrame(el, 'http://cdn.local/other.mp4'), false);
  assert.equal(hasPresentedVideoFrame(el, SRC), true);
  el.error = { code: 4 };
  assert.equal(hasPresentedVideoFrame(el, SRC), false);
  el.error = null;
  el.videoHeight = 0;
  assert.equal(hasPresentedVideoFrame(el, SRC), false);
  el.videoHeight = 360;
  el.isConnected = false;
  assert.equal(hasPresentedVideoFrame(el, SRC), false);
});
test('源切换：撤旧回调、清 dataset 与 presented、摘旧 emptied 监听后重挂一条', () => {
  const el = makeVideo();
  watchVideoFramePresentation(el, () => {});
  fire(el, 55, { width: 640, height: 360 });
  assert.deepEqual(Object.keys(el.dataset).sort(), [
    'firstFramePresented',
    'firstFramePresentedAt',
    'firstFramePresentedSource',
  ]);
  el.dataset.desktopMediaSourceUrl = 'http://cdn.local/b.mp4';
  el.attrs = {};
  const got = [];
  assert.equal(
    watchVideoFramePresentation(el, (p) => got.push(p)),
    true,
  );
  assert.deepEqual(el.cancelled, []); // 回调已触发 ⇒ callbackId 早被置 null，无 id 可撤（只可能由 reset 路径撤）
  assert.equal(el.requested.length, 2);
  assert.equal(el.listenerCount('emptied'), 1);
  assert.equal('firstFramePresented' in el.dataset, false);
  assert.equal('firstFramePresentedAt' in el.dataset, false);
  assert.equal('firstFramePresentedSource' in el.dataset, false);
  assert.equal(el.dataset.desktopMediaSourceUrl, 'http://cdn.local/b.mp4');
  const state = __videoFramePresentationForTest.getState(el);
  assert.equal(state.source, 'http://cdn.local/b.mp4');
  assert.equal(state.presented, false);
  assert.deepEqual(got, []);
});
test('resetVideoFramePresentation：删状态、取消待决回调、摘监听、清 dataset；假值入参不抛', () => {
  const el = makeVideo();
  watchVideoFramePresentation(el, () => {});
  fire(el, 55, { width: 640, height: 360 });
  resetVideoFramePresentation(el);
  assert.equal(__videoFramePresentationForTest.getState(el), null);
  assert.deepEqual(el.dataset, {});
  assert.equal(el.listenerCount('emptied'), 0);
  assert.deepEqual(el._removeCalls, ['emptied']);
  assert.equal(resetVideoFramePresentation(undefined), undefined);
  assert.equal(resetVideoFramePresentation(null), undefined);
});
test('reset：待决回调 id 会交给 cancelVideoFrameCallback', () => {
  const el = makeVideo();
  watchVideoFramePresentation(el, () => {});
  resetVideoFramePresentation(el);
  assert.deepEqual(el.cancelled, [1]);
});
test('emptied 事件 ⇒ 内部自动 reset', () => {
  const el = makeVideo();
  watchVideoFramePresentation(el, () => {});
  fire(el, 55, { width: 640, height: 360 });
  el.emit('emptied');
  assert.equal(__videoFramePresentationForTest.getState(el), null);
  assert.deepEqual(el.dataset, {});
});
test('宿主无 requestVideoFrameCallback ⇒ 状态仍建立但 watch 返回 false', () => {
  const el = makeVideo({ noFrameCallback: true });
  assert.equal(
    watchVideoFramePresentation(el, () => {}),
    false,
  );
  const state = __videoFramePresentationForTest.getState(el);
  assert.equal(state.source, SRC);
  assert.equal(state.callbackId, null);
});
test('dataset 缺失的元素：不写 dataset 也不抛，presented 仍记账', () => {
  const el = makeVideo({ dataset: undefined, attrs: { src: SRC } });
  watchVideoFramePresentation(el, () => {});
  fire(el, 77, { width: 640, height: 360 });
  assert.equal(__videoFramePresentationForTest.getState(el).presented, true);
  assert.equal(el.dataset, undefined);
});
test('__videoFramePresentationForTest.getState：未登记对象得 null', () => {
  assert.equal(__videoFramePresentationForTest.getState({}), null);
});
test('帧回调：状态被 reset 后旧回调作废，不再通知监听者', () => {
  const el = makeVideo();
  const got = [];
  watchVideoFramePresentation(el, (p) => got.push(p));
  const oldCb = el.requested[0];
  resetVideoFramePresentation(el);
  oldCb(88, { width: 640, height: 360 });
  assert.deepEqual(got, []);
  assert.equal(__videoFramePresentationForTest.getState(el), null);
});

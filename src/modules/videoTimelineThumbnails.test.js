import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractClientVideoTimelineFrameUrls,
  paintVideoTimelineThumbnailUrls,
  renderVideoTimelineThumbnails,
} from './videoTimelineThumbnails.js';

function createThumb(options = {}) {
  const classes = new Set();
  return {
    dataset: {},
    attributes: {},
    classes,
    style: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
  };
}

test('videoTimelineThumbnails: 缩略图按数量均分到可用地址，并带上状态与背景', () => {
  const thumbs = [createThumb(), createThumb(), createThumb()];
  const painted = paintVideoTimelineThumbnailUrls(thumbs, ['u0', 'u1'], 'server');
  assert.equal(painted, 3);
  assert.equal(thumbs[0].style.backgroundImage, 'url("u0")');
  assert.equal(thumbs[1].style.backgroundImage, 'url("u1"), url("u0")', '命中地址在前，首帧兜底在后');
  assert.equal(thumbs[2].style.backgroundImage, 'url("u1"), url("u0")');
  for (const thumb of thumbs) {
    assert.equal(thumb.dataset.thumbnailState, 'server');
    assert.equal(thumb.classes.has('video-timeline-thumbnail'), true);
    assert.equal(thumb.attributes['aria-busy'], 'false');
  }
});

test('videoTimelineThumbnails: 单个地址时不重复写两次同样的 url', () => {
  const thumbs = [createThumb()];
  paintVideoTimelineThumbnailUrls(thumbs, ['only'], 'client');
  assert.equal(thumbs[0].style.backgroundImage, 'url("only")');
  assert.equal(thumbs[0].dataset.thumbnailState, 'client');
});

test('videoTimelineThumbnails: 缺少地址或缺少槽位时不做任何事', () => {
  const thumbs = [createThumb()];
  assert.equal(paintVideoTimelineThumbnailUrls(thumbs, [], 'ready'), 0);
  assert.equal(paintVideoTimelineThumbnailUrls(thumbs, ['  '], 'ready'), 0);
  assert.equal(paintVideoTimelineThumbnailUrls([], ['u'], 'ready'), 0);
  assert.equal(thumbs[0].style.backgroundImage, undefined);
  assert.equal(thumbs[0].dataset.thumbnailState, undefined);
});

test('videoTimelineThumbnails: 没有槽位时直接判定为空', async () => {
  const result = await renderVideoTimelineThumbnails({ thumbs: [] });
  assert.deepEqual(result, { source: 'empty', errors: [] });
  assert.deepEqual(await renderVideoTimelineThumbnails({}), { source: 'empty', errors: [] });
});

test('videoTimelineThumbnails: 已被取代时不继续出图', async () => {
  const thumbs = [createThumb()];
  const result = await renderVideoTimelineThumbnails({ src: 'x', thumbs, isCurrent: () => false });
  assert.deepEqual(result, { source: 'cancelled', errors: [] });
  assert.equal(thumbs[0].dataset.thumbnailState, undefined);
});

test('videoTimelineThumbnails: 只有海报没有视频源时用海报铺满', async () => {
  const thumbs = [createThumb(), createThumb()];
  const result = await renderVideoTimelineThumbnails({ posterUrl: 'p.png', thumbs });
  assert.deepEqual(result, { source: 'poster', errors: [] });
  assert.equal(thumbs[0].style.backgroundImage, 'url("p.png")');
  assert.equal(thumbs[0].dataset.thumbnailState, 'poster');
  assert.equal(thumbs[1].dataset.thumbnailState, 'poster');
});

test('videoTimelineThumbnails: 既没有源也没有海报时标记失败', async () => {
  const thumbs = [createThumb()];
  const result = await renderVideoTimelineThumbnails({ thumbs });
  assert.deepEqual(result, { source: 'empty', errors: [] });
  assert.equal(thumbs[0].dataset.thumbnailState, 'failed');
});

test('videoTimelineThumbnails: 服务端出帧成功时用服务端结果并回报时长', async () => {
  const thumbs = [createThumb(), createThumb()];
  const durations = [];
  const result = await renderVideoTimelineThumbnails({
    src: 'x',
    thumbs,
    onDuration: (value) => durations.push(value),
    extractServerFrames: async (src, options) => {
      assert.equal(src, 'x');
      assert.deepEqual(options, { maxFrames: 2, exactCount: true });
      return { frames: [{ url: 's0' }, { localPath: 'data/uploads/s1.png' }], duration: 12.5 };
    },
  });
  assert.equal(result.source, 'server');
  assert.deepEqual(durations, [12.5]);
  assert.equal(thumbs[0].dataset.thumbnailState, 'server');
  assert.ok(thumbs[1].style.backgroundImage.includes('data/uploads/s1.png'));
});

test('videoTimelineThumbnails: 服务端失败但浏览器出帧成功时回落到客户端并保留错误', async () => {
  const thumbs = [createThumb()];
  const result = await renderVideoTimelineThumbnails({
    src: 'x',
    thumbs,
    extractServerFrames: async () => {
      throw new Error('服务端抽帧不可用');
    },
    extractClientFrames: async () => ['data:image/jpeg;base64,AAA'],
  });
  assert.equal(result.source, 'client');
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].message, '服务端抽帧不可用');
  assert.equal(thumbs[0].dataset.thumbnailState, 'client');
});

test('videoTimelineThumbnails: 两条链路都失败时按住海报回落并记录两条错误', async () => {
  const withPoster = [createThumb()];
  const posterResult = await renderVideoTimelineThumbnails({
    src: 'x',
    posterUrl: 'p.png',
    thumbs: withPoster,
    extractServerFrames: async () => ({ frames: [] }),
    extractClientFrames: async () => [],
  });
  assert.equal(posterResult.source, 'poster');
  assert.equal(posterResult.errors.length, 2);
  assert.equal(withPoster[0].dataset.thumbnailState, 'poster');

  const withoutPoster = [createThumb()];
  const emptyResult = await renderVideoTimelineThumbnails({
    src: 'x',
    thumbs: withoutPoster,
    extractServerFrames: async () => {
      throw new Error('s');
    },
    extractClientFrames: async () => {
      throw new Error('c');
    },
  });
  assert.equal(emptyResult.source, 'empty');
  assert.equal(emptyResult.errors.length, 2);
  assert.equal(withoutPoster[0].dataset.thumbnailState, 'failed');
});

test('videoTimelineThumbnails: 服务端出帧后画布已被取代就不再画', async () => {
  const thumbs = [createThumb()];
  let calls = 0;
  const result = await renderVideoTimelineThumbnails({
    src: 'x',
    thumbs,
    isCurrent: () => calls++ < 1,
    extractServerFrames: async () => ({ frames: [{ url: 's0' }] }),
  });
  assert.equal(result.source, 'cancelled');
  assert.equal(thumbs[0].dataset.thumbnailState, 'loading');
});

test('videoTimelineThumbnails: 客户端抽帧在缺地址或缺 document 时直接给空数组', async () => {
  assert.deepEqual(await extractClientVideoTimelineFrameUrls({}), []);
  assert.deepEqual(await extractClientVideoTimelineFrameUrls({ src: 'x', documentRef: null }), []);
  assert.deepEqual(
    await extractClientVideoTimelineFrameUrls({ src: '   ', documentRef: { createElement: () => ({}) } }),
    [],
  );
});

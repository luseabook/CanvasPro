import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyGenerationHistoryVideoThumbnail,
  createVideoThumbnailRequestQueue,
  resolveGenerationHistoryVideoPresentation,
} from './generationHistoryVideoThumbnails.js';

const VIDEO_PATH = 'data/uploads/video/clip.mp4';
const POSTER_PATH = 'data/uploads/video/poster.png';

test('generationHistoryVideoThumbnails: 空数据不给地址也不要求补图', () => {
  assert.deepEqual(resolveGenerationHistoryVideoPresentation({}), {
    mediaSrc: '',
    posterSrc: '',
    needsBackfill: false,
  });
  assert.deepEqual(resolveGenerationHistoryVideoPresentation(), {
    mediaSrc: '',
    posterSrc: '',
    needsBackfill: false,
  });
});

test('generationHistoryVideoThumbnails: 有本地视频但没海报时需要补图', () => {
  const result = resolveGenerationHistoryVideoPresentation({ localPath: VIDEO_PATH });
  assert.equal(result.mediaSrc, '/data/uploads/video/clip.mp4');
  assert.equal(result.posterSrc, '');
  assert.equal(result.needsBackfill, true);
});

test('generationHistoryVideoThumbnails: 节点上的海报地址可用，且不会被当成视频源', () => {
  const result = resolveGenerationHistoryVideoPresentation({
    localPath: VIDEO_PATH,
    nodes: [{ posterLocalPath: POSTER_PATH }],
  });
  assert.equal(result.posterSrc, '/data/uploads/video/poster.png');
  assert.equal(result.needsBackfill, false);
});

test('generationHistoryVideoThumbnails: 与视频同址或本身就是视频的候选不算海报', () => {
  const sameAsVideo = resolveGenerationHistoryVideoPresentation({
    localPath: VIDEO_PATH,
    nodes: [{ posterLocalPath: VIDEO_PATH }],
  });
  assert.equal(sameAsVideo.posterSrc, '');
  assert.equal(sameAsVideo.needsBackfill, true);

  const anotherVideo = resolveGenerationHistoryVideoPresentation({
    localPath: VIDEO_PATH,
    nodes: [{ posterUrl: '/data/uploads/video/other.mp4' }],
  });
  assert.equal(anotherVideo.posterSrc, '');
  assert.equal(anotherVideo.needsBackfill, true);

  const withQuery = resolveGenerationHistoryVideoPresentation({
    localPath: VIDEO_PATH,
    nodes: [{ posterUrl: '/data/uploads/video/other.webm?v=2' }],
  });
  assert.equal(withQuery.posterSrc, '', '带查询串也能认出是视频');
});

test('generationHistoryVideoThumbnails: 条目缩略图可作为最后兜底', () => {
  const result = resolveGenerationHistoryVideoPresentation({
    localPath: VIDEO_PATH,
    items: [{ thumbSrc: '/data/uploads/video/from-item.jpg' }],
  });
  assert.equal(result.posterSrc, '/data/uploads/video/from-item.jpg');
  assert.equal(result.needsBackfill, false);
});

test('generationHistoryVideoThumbnails: 没有海报信息时不改动记录', () => {
  const record = { localPath: VIDEO_PATH };
  assert.equal(applyGenerationHistoryVideoThumbnail(record, {}), record);
  assert.equal(applyGenerationHistoryVideoThumbnail(record, { posterLocalPath: '   ' }), record);
  assert.equal(Object.hasOwn(record, 'coverUrl'), false);
});

test('generationHistoryVideoThumbnails: 补图只写第一条节点与条目，并带回原来的视频地址', () => {
  const record = {
    localPath: VIDEO_PATH,
    nodes: [{ id: 'n1' }, { id: 'n2' }],
    items: [{ nodeData: { id: 'n1' } }, { nodeData: { id: 'n2' } }],
  };
  const result = applyGenerationHistoryVideoThumbnail(record, { posterLocalPath: POSTER_PATH });
  assert.equal(result.coverUrl, '/data/uploads/video/poster.png');
  assert.equal(result.thumbLocalPath, POSTER_PATH);
  assert.equal(result.nodes[0].posterUrl, '/data/uploads/video/poster.png');
  assert.equal(result.nodes[0].thumbUrl, '/data/uploads/video/poster.png');
  assert.equal(result.nodes[0].posterLocalPath, POSTER_PATH);
  assert.equal(result.nodes[0].videoThumbSrc, '/data/uploads/video/clip.mp4', '视频地址当兜底缩略图源');
  assert.equal(result.nodes[1].posterUrl, undefined, '其它镜头不动');
  assert.equal(result.items[0].thumbSrc, '/data/uploads/video/poster.png');
  assert.equal(result.items[0].nodeData.posterUrl, '/data/uploads/video/poster.png');
  assert.equal(result.items[1].thumbSrc, undefined);
  assert.equal(record.coverUrl, undefined, '入参记录不被就地改动');
});

test('generationHistoryVideoThumbnails: 没有节点/条目数组时给空数组而不是崩', () => {
  const result = applyGenerationHistoryVideoThumbnail({ localPath: VIDEO_PATH }, { posterUrl: '/data/uploads/video/p.png' });
  assert.deepEqual(result.nodes, []);
  assert.deepEqual(result.items, []);
  assert.equal(result.coverUrl, '/data/uploads/video/p.png');
});

test('generationHistoryVideoThumbnails: 请求队列拒绝空地址，相同地址复用同一个 promise', async () => {
  const queue = createVideoThumbnailRequestQueue();
  await assert.rejects(() => queue.enqueue('', async () => 'x'), { message: 'Missing video thumbnail source' });
  await assert.rejects(() => queue.enqueue('   ', async () => 'x'), { message: 'Missing video thumbnail source' });

  let resolveFirst;
  const gate = new Promise((resolve) => {
    resolveFirst = resolve;
  });
  const first = queue.enqueue('key-1', () => gate.then(() => 'done'));
  const second = queue.enqueue('key-1', async () => 'never');
  assert.equal(first, second, '同一地址返回同一个 promise');
  resolveFirst();
  assert.equal(await first, 'done');
});

test('generationHistoryVideoThumbnails: 并发上限为 1 时任务严格串行', async () => {
  const queue = createVideoThumbnailRequestQueue({ concurrency: 1 });
  const order = [];
  let active = 0;
  let maxActive = 0;
  const task = (name) => async () => {
    active += 1;
    maxActive = Math.max(maxActive, active);
    order.push('start:' + name);
    await new Promise((resolve) => setTimeout(resolve, 1));
    order.push('end:' + name);
    active -= 1;
    return name;
  };
  const results = await Promise.all([
    queue.enqueue('a', task('a')),
    queue.enqueue('b', task('b')),
    queue.enqueue('c', task('c')),
  ]);
  assert.deepEqual(results, ['a', 'b', 'c']);
  assert.deepEqual(order, ['start:a', 'end:a', 'start:b', 'end:b', 'start:c', 'end:c']);
  assert.equal(maxActive, 1);
});

test('generationHistoryVideoThumbnails: 并发上限非法值归一为 1，失败的任务不会卡住队列', async () => {
  const queue = createVideoThumbnailRequestQueue({ concurrency: 0 });
  const failing = queue.enqueue('bad', async () => {
    throw new Error('取帧失败');
  });
  await assert.rejects(() => failing, { message: '取帧失败' });
  assert.equal(await queue.enqueue('next', async () => 'ok'), 'ok', '前一个失败后仍能继续');
});

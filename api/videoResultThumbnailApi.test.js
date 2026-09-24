import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureVideoResultThumbnail,
  hasStableVideoResultThumbnail,
  needsVideoResultThumbnail,
  resolveVideoResultThumbnailSource,
} from './videoResultThumbnailApi.js';

test('videoResultThumbnailApi: source resolution prefers local paths then local urls', () => {
  assert.equal(resolveVideoResultThumbnailSource({ localPath: 'data/assets/a.mp4' }), '/data/assets/a.mp4');
  assert.equal(resolveVideoResultThumbnailSource({ displayLocalPath: 'output/b.mp4' }), '/output/b.mp4');
  assert.equal(resolveVideoResultThumbnailSource({ url: '/data/assets/c.mp4' }), '/data/assets/c.mp4');
  assert.equal(
    resolveVideoResultThumbnailSource({ videoUrl: 'http://127.0.0.1:8777/data/assets/d.mp4' }),
    '/data/assets/d.mp4',
  );
  assert.equal(resolveVideoResultThumbnailSource({ videoUrl: 'https://cdn.example.com/d.mp4' }), '');
  assert.equal(resolveVideoResultThumbnailSource({ localPath: 'C:/tmp/a.mp4' }), '');
  assert.equal(resolveVideoResultThumbnailSource({}), '');
  assert.equal(resolveVideoResultThumbnailSource(null), '');
  assert.equal(resolveVideoResultThumbnailSource([]), '');
});

test('videoResultThumbnailApi: stability flags only track local image thumbnails', () => {
  assert.equal(hasStableVideoResultThumbnail({}), false);
  assert.equal(hasStableVideoResultThumbnail({ posterUrl: '/data/assets/a.png' }), true);
  assert.equal(hasStableVideoResultThumbnail({ thumbnailLocalPath: 'data/assets/a.webp' }), true);
  assert.equal(hasStableVideoResultThumbnail({ thumbUrl: '/data/assets/a.mp4' }), false);
  assert.equal(hasStableVideoResultThumbnail({ thumbUrl: 'https://cdn.example.com/a.png' }), false);
  assert.equal(needsVideoResultThumbnail({ localPath: 'data/assets/a.mp4' }), true);
  assert.equal(
    needsVideoResultThumbnail({ localPath: 'data/assets/a.mp4', posterLocalPath: 'data/assets/a.thumb.jpg' }),
    false,
  );
  assert.equal(needsVideoResultThumbnail({ posterLocalPath: 'data/assets/a.thumb.jpg' }), false);
  assert.equal(needsVideoResultThumbnail({}), false);
});

test('videoResultThumbnailApi: ensure fills poster fields from the first-frame service', async () => {
  const requested = [];
  const result = await ensureVideoResultThumbnail(
    { localPath: 'data/assets/a.mp4', thumbUrl: 'https://cdn.example.com/old.png' },
    {
      fetchThumbnail: async (source) => (
        requested.push(source),
        { posterLocalPath: 'data/assets/a.thumb.jpg' }
      ),
    },
  );
  assert.deepEqual(requested, ['/data/assets/a.mp4']);
  assert.deepEqual(result, {
    localPath: 'data/assets/a.mp4',
    thumbUrl: '/data/assets/a.thumb.jpg',
    sourceThumbUrl: 'https://cdn.example.com/old.png',
    posterUrl: '/data/assets/a.thumb.jpg',
    posterLocalPath: 'data/assets/a.thumb.jpg',
    thumbLocalPath: 'data/assets/a.thumb.jpg',
    videoThumbSrc: '/data/assets/a.mp4',
  });
});

test('videoResultThumbnailApi: ensure is a no-op without a fetchable local video or with a stable thumbnail', async () => {
  let fetchCount = 0;
  const fetcher = async () => (fetchCount += 1);
  const empty = {};
  assert.equal(await ensureVideoResultThumbnail(empty, { fetchThumbnail: fetcher }), empty);
  const stable = { localPath: 'data/assets/a.mp4', posterLocalPath: 'data/assets/a.thumb.jpg' };
  assert.equal(await ensureVideoResultThumbnail(stable, { fetchThumbnail: fetcher }), stable);
  const remoteOnly = { videoUrl: 'https://cdn.example.com/a.mp4' };
  assert.equal(await ensureVideoResultThumbnail(remoteOnly, { fetchThumbnail: fetcher }), remoteOnly);
  assert.equal(fetchCount, 0);
});

test('videoResultThumbnailApi: ensure rejects when the service returns no local thumbnail', async () => {
  await assert.rejects(
    () =>
      ensureVideoResultThumbnail({ localPath: 'data/assets/a.mp4' }, { fetchThumbnail: async () => ({}) }),
    /视频首帧服务未返回本地缩略图/,
  );
});

test('videoResultThumbnailApi: ensure deduplicates concurrent requests per video and fetcher', async () => {
  let fetchCount = 0;
  const fetcher = async () => {
    fetchCount += 1;
    await Promise.resolve();
    return { posterLocalPath: 'data/assets/a.thumb.jpg' };
  };
  const [first, second] = await Promise.all([
    ensureVideoResultThumbnail({ localPath: 'data/assets/a.mp4' }, { fetchThumbnail: fetcher }),
    ensureVideoResultThumbnail({ localPath: 'data/assets/a.mp4' }, { fetchThumbnail: fetcher }),
  ]);
  assert.equal(fetchCount, 1);
  assert.deepEqual(first, second);
  assert.equal(first.videoThumbSrc, '/data/assets/a.mp4');
});

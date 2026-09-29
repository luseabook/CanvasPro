import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createComparisonImageCache,
  getComparisonOriginalKey,
} from './materialComparisonImageCache.js';

function createImage(options = {}) {
  return {
    complete: options.complete !== false,
    naturalWidth: options.naturalWidth === undefined ? 10 : options.naturalWidth,
    naturalHeight: options.naturalHeight === undefined ? 10 : options.naturalHeight,
    removedSrc: 0,
    removed: 0,
    removeAttribute(name) {
      if (name === 'src') this.removedSrc += 1;
    },
    remove() {
      this.removed += 1;
    },
  };
}

function createHarness(options = {}) {
  const revoked = [];
  const scheduled = [];
  const cancelled = [];
  let current = 1000;
  const cache = createComparisonImageCache({
    maxBytes: options.maxBytes === undefined ? 0x100 * 0x400 * 0x400 : options.maxBytes,
    maxEntries: options.maxEntries === undefined ? 4 : options.maxEntries,
    ttlMs: options.ttlMs === undefined ? 100 : options.ttlMs,
    now: () => current,
    schedule: (task, delay) => {
      scheduled.push(delay);
      return { task, unref() {} };
    },
    cancel: (handle) => cancelled.push(handle),
    revoke: (url) => revoked.push(url),
  });
  return {
    cache,
    revoked,
    scheduled,
    cancelled,
    advance: (delta) => {
      current += delta;
    },
  };
}

test('materialComparisonImageCache: 原图键优先用 sourceId，其次用解析出的图片地址', () => {
  assert.equal(getComparisonOriginalKey({}), '');
  assert.equal(getComparisonOriginalKey(null), '');
  assert.equal(getComparisonOriginalKey({ sourceId: 's1' }), JSON.stringify(['s1', '']));
  assert.equal(
    getComparisonOriginalKey({ images: [{ sourceId: 's2' }], mainImageIndex: 0 }),
    JSON.stringify(['s2', '']),
  );
  assert.equal(
    getComparisonOriginalKey({ images: [{ sourceId: 's2' }], mainImageIndex: 5 }),
    '',
    '索引越界拿不到图片又没 sourceId 时给空键',
  );
});

test('materialComparisonImageCache: 不合格的图片一律拒绝入缓存', () => {
  const { cache } = createHarness({ maxBytes: 400 });
  const url = 'blob:a';
  assert.equal(cache.put('k', { image: createImage({ complete: false }), url }), false);
  assert.equal(cache.put('', { image: createImage(), url }), false, '空键拒绝');
  assert.equal(cache.put('k', { image: createImage(), url: '' }), false, '缺地址拒绝');
  assert.equal(cache.put('k', { image: createImage({ naturalWidth: 0 }), url }), false, '算不出字节数拒绝');
  assert.equal(cache.put('k', { image: createImage({ naturalWidth: 100, naturalHeight: 100 }), url }), false, '超过字节上限拒绝');
  assert.equal(cache.take('k'), null);
});

test('materialComparisonImageCache: 代次不匹配的写入会被丢弃', () => {
  const { cache } = createHarness();
  const generation = cache.generation;
  cache.clear();
  assert.equal(cache.put('k', { image: createImage(), url: 'blob:a' }, generation), false);
  assert.equal(cache.take('k'), null);
});

test('materialComparisonImageCache: 取出即移除，重复放同一张图幂等', () => {
  const { cache } = createHarness({ ttlMs: 1000 });
  const image = createImage();
  assert.equal(cache.put('k', { image, url: 'blob:a' }), true);
  assert.equal(image.removed, 1, '入缓存后把图片元素从原处摘掉');
  assert.equal(cache.put('k', { image, url: 'blob:a' }), true, '同一张图重复放直接成功');

  const entry = cache.take('k');
  assert.equal(entry.image, image);
  assert.equal(entry.url, 'blob:a');
  assert.equal(entry.bytes, 400);
  assert.equal(entry.expiresAt, 2000);
  assert.equal(cache.take('k'), null, '取走即失效');
});

test('materialComparisonImageCache: 超过条目上限时淘汰最早的条目并回收地址', () => {
  const { cache, revoked } = createHarness({ maxEntries: 1, ttlMs: 1000 });
  const first = createImage();
  const second = createImage();
  cache.put('k1', { image: first, url: 'blob:1', revokeUrlOnClose: true });
  cache.put('k2', { image: second, url: 'blob:2', revokeUrlOnClose: true });
  assert.equal(first.removedSrc, 1, '被淘汰的图片清掉 src');
  assert.deepEqual(revoked, ['blob:1']);
  assert.equal(cache.take('k1'), null);
  assert.equal(cache.take('k2').image, second);
});

test('materialComparisonImageCache: 超过字节上限时按序淘汰直到装得下', () => {
  const { cache } = createHarness({ maxBytes: 1200, maxEntries: 8, ttlMs: 1000 });
  cache.put('k1', { image: createImage(), url: 'blob:1' });
  cache.put('k2', { image: createImage(), url: 'blob:2' });
  cache.put('k3', { image: createImage({ naturalWidth: 20, naturalHeight: 10 }), url: 'blob:3' });
  assert.equal(cache.take('k1'), null, '最旧的被挤掉');
  assert.equal(cache.take('k2').bytes, 400);
  assert.equal(cache.take('k3').bytes, 800);
});

test('materialComparisonImageCache: 过期条目在取出与清理时都会回收', () => {
  const { cache, advance, revoked } = createHarness({ ttlMs: 100 });
  cache.put('k', { image: createImage(), url: 'blob:a', revokeUrlOnClose: true });
  advance(101);
  assert.equal(cache.take('k'), null, '过期的取不到');
  assert.deepEqual(revoked, ['blob:a']);

  const second = createHarness({ ttlMs: 100 });
  second.cache.put('k', { image: createImage(), url: 'blob:b', revokeUrlOnClose: true });
  second.cache.clear();
  assert.deepEqual(second.revoked, ['blob:b']);
  assert.equal(second.cache.generation, 1, 'clear 会推进代次');
  second.cache.clear();
  assert.equal(second.cache.generation, 2);
});

test('materialComparisonImageCache: 同一地址复用时不为它排新的回收定时器', () => {
  const reuse = createHarness({ ttlMs: 100 });
  reuse.cache.put('k', { image: createImage(), url: 'blob:a', revokeUrlOnClose: true });
  reuse.cache.put('k', { image: createImage(), url: 'blob:a' }, reuse.cache.generation);
  assert.deepEqual(reuse.revoked, [], '地址没换就不该回收');
  assert.ok(reuse.scheduled.length >= 1, '每次变更都会重排到期定时器');
});

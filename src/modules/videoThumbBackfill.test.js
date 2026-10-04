import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __groupBackfillJobsBySrcPathForTest,
  __hasActiveMediaPlaybackForTest,
  __runWithConcurrencyForTest,
} from './videoThumbBackfill.js';
(test('videoThumbBackfill: srcPath 分组去重保持顺序', () => {
  const list = __groupBackfillJobsBySrcPathForTest([
    { nodeId: 'n1', srcPath: '/output/a.mp4', idx: 0 },
    { nodeId: 'n2', srcPath: '/output/b.mp4', idx: 0 },
    { nodeId: 'n3', srcPath: '/output/a.mp4', idx: 1 },
    { nodeId: 'n4', srcPath: '', idx: 0 },
  ]);
  (assert.equal(list.length, 2),
    assert.equal(list[0].srcPath, '/output/a.mp4'),
    assert.equal(list[1].srcPath, '/output/b.mp4'),
    assert.deepEqual(
      list[0].jobs.map((item) => item.nodeId),
      ['n1', 'n3'],
    ),
    assert.deepEqual(
      list[1].jobs.map((item2) => item2.nodeId),
      ['n2'],
    ));
}),
  test('videoThumbBackfill: worker 池并发不超过上限', async () => {
    const value = Array.from({ length: 12 }, (key, index) => index);
    let result = 0,
      count = 0;
    (await __runWithConcurrencyForTest(value, 3, async () => {
      (result++,
        (count = Math.max(count, result)),
        await new Promise((data) => setTimeout(data, 10)),
        result--);
    }),
      assert.equal(count <= 3, true));
  }),
  test('videoThumbBackfill: 可识别正在播放的媒体，后台回填可让路', () => {
    const options = globalThis.document;
    try {
      ((globalThis.document = {
        querySelectorAll(target) {
          return (
            assert.equal(target, 'video, audio'),
            [
              { paused: true, ended: false },
              { paused: false, ended: false },
            ]
          );
        },
      }),
        assert.equal(__hasActiveMediaPlaybackForTest(), true),
        (globalThis.document = {
          querySelectorAll() {
            return [{ paused: true, ended: false }];
          },
        }),
        assert.equal(__hasActiveMediaPlaybackForTest(), false));
    } finally {
      globalThis.document = options;
    }
  }));

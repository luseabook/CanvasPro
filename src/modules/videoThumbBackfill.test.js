import test from 'node:test';
import assert from 'node:assert/strict';
import {
  __groupBackfillJobsBySrcPathForTest,
  __hasActiveMediaPlaybackForTest,
  __runWithConcurrencyForTest,
} from './videoThumbBackfill.js';
(test('videoThumbBackfill: srcPath 分组去重保持顺序', () => {
  const _0x2fdee8 = __groupBackfillJobsBySrcPathForTest([
    { nodeId: 'n1', srcPath: '/output/a.mp4', idx: 0 },
    { nodeId: 'n2', srcPath: '/output/b.mp4', idx: 0 },
    { nodeId: 'n3', srcPath: '/output/a.mp4', idx: 1 },
    { nodeId: 'n4', srcPath: '', idx: 0 },
  ]);
  (assert.equal(_0x2fdee8.length, 2),
    assert.equal(_0x2fdee8[0].srcPath, '/output/a.mp4'),
    assert.equal(_0x2fdee8[1].srcPath, '/output/b.mp4'),
    assert.deepEqual(
      _0x2fdee8[0].jobs.map((_0x14133a) => _0x14133a.nodeId),
      ['n1', 'n3'],
    ),
    assert.deepEqual(
      _0x2fdee8[1].jobs.map((_0x423589) => _0x423589.nodeId),
      ['n2'],
    ));
}),
  test('videoThumbBackfill: worker 池并发不超过上限', async () => {
    const _0x3fa8a9 = Array.from({ length: 12 }, (_0x130875, _0x581396) => _0x581396);
    let _0x327a62 = 0,
      _0x1adb0d = 0;
    (await __runWithConcurrencyForTest(_0x3fa8a9, 3, async () => {
      (_0x327a62++,
        (_0x1adb0d = Math.max(_0x1adb0d, _0x327a62)),
        await new Promise((_0x28be17) => setTimeout(_0x28be17, 10)),
        _0x327a62--);
    }),
      assert.equal(_0x1adb0d <= 3, true));
  }),
  test('videoThumbBackfill: 可识别正在播放的媒体，后台回填可让路', () => {
    const _0x1297c5 = globalThis.document;
    try {
      ((globalThis.document = {
        querySelectorAll(_0x49aca5) {
          return (
            assert.equal(_0x49aca5, 'video, audio'),
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
      globalThis.document = _0x1297c5;
    }
  }));

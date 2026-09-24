import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createTrackedMediaObjectUrl,
  revokeTrackedMediaObjectUrl,
  getMediaObjectUrlRegistrySnapshot,
  __mediaObjectUrlRegistryForTest,
} from './mediaObjectUrlRegistry.js';

const blob = (size = 1024, type = 'image/png') => ({ size, type });

function withStubs(run) {
  const urls = [];
  const revoked = [];
  const marks = [];
  let seq = 0;
  const prevUrl = globalThis.URL;
  const prevWindow = globalThis.window;
  globalThis.URL = {
    createObjectURL: (b) => {
      urls.push(b);
      return ++seq === 3 ? '' : 'blob:reg/' + seq;
    },
    revokeObjectURL: (u) => revoked.push(u),
  };
  globalThis.window = {
    __runtimeCompareMark: (name, payload) => marks.push({ name, payload }),
  };
  __mediaObjectUrlRegistryForTest.clear();
  try {
    return run({ urls, revoked, marks });
  } finally {
    globalThis.URL = prevUrl;
    globalThis.window = prevWindow;
    __mediaObjectUrlRegistryForTest.clear();
  }
}

test('创建即登记：快照含 kind / size / type / ownerId，且 URL 原样返回', () => {
  const result = withStubs(() => {
    const url = createTrackedMediaObjectUrl(blob(2048, 'video/mp4'), {
      kind: 'video',
      ownerId: 'node-7',
      sourceUrl: 'file:///a.mp4',
    });
    return { url, snap: getMediaObjectUrlRegistrySnapshot() };
  });
  assert.equal(result.url, 'blob:reg/1');
  assert.equal(result.snap.activeCount, 1);
  assert.equal(result.snap.activeVideoCount, 1);
  assert.deepEqual(result.snap.activeUrls, ['blob:reg/1']);
  assert.deepEqual(result.snap.activeVideoUrls, ['blob:reg/1']);
  const [entry] = result.snap.entries;
  assert.deepEqual(
    Object.keys(entry).sort(),
    ['createdAt', 'createDurationMs', 'kind', 'ownerId', 'size', 'sourceUrl', 'type', 'url'].sort(),
  );
  assert.equal(entry.size, 2048);
  assert.equal(entry.type, 'video/mp4');
  assert.equal(entry.ownerId, 'node-7');
  assert.equal(entry.sourceUrl, 'file:///a.mp4');
  assert.ok(Number.isFinite(entry.createdAt));
  assert.ok(entry.createDurationMs >= 0);
});

test('缺省参数：kind 落 media，ownerId / sourceUrl 落空串，size 落 0', () => {
  withStubs(() => {
    createTrackedMediaObjectUrl({});
    createTrackedMediaObjectUrl(blob(), { kind: null, ownerId: 0, sourceUrl: undefined });
    const [a, b] = getMediaObjectUrlRegistrySnapshot().entries;
    assert.equal(a.kind, 'media');
    assert.equal(a.ownerId, '');
    assert.equal(a.sourceUrl, '');
    assert.equal(a.size, 0);
    assert.equal(a.type, '');
    assert.equal(b.kind, 'media', 'kind 假值回落 media');
    assert.equal(b.ownerId, '', 'ownerId 数字 0 是假值 ⇒ 先被 || 吞成空串');
  });
});

test('createObjectURL 返回空 ⇒ 返回空串且不登记', () => {
  withStubs(({ urls }) => {
    assert.equal(createTrackedMediaObjectUrl(blob()), 'blob:reg/1');
    assert.equal(createTrackedMediaObjectUrl(blob()), 'blob:reg/2');
    assert.equal(getMediaObjectUrlRegistrySnapshot().activeCount, 2);
    assert.equal(createTrackedMediaObjectUrl(blob()), '', '桩在第 3 次返回空串');
    assert.equal(getMediaObjectUrlRegistrySnapshot().activeCount, 2);
    assert.equal(urls.length, 3);
  });
});

test('URL.createObjectURL 不存在 ⇒ 静默返回空串（可选链兜住）', () => {
  const prevUrl = globalThis.URL;
  const prevWindow = globalThis.window;
  globalThis.URL = {};
  globalThis.window = undefined;
  __mediaObjectUrlRegistryForTest.clear();
  try {
    assert.equal(createTrackedMediaObjectUrl(blob()), '');
    assert.equal(getMediaObjectUrlRegistrySnapshot().activeCount, 0);
  } finally {
    globalThis.URL = prevUrl;
    globalThis.window = prevWindow;
    __mediaObjectUrlRegistryForTest.clear();
  }
});

test('revoke：命中即注销并返回 true，未命中也返回 true 且以 unknown 记一次生命周期', () => {
  withStubs(({ revoked, marks }) => {
    const url = createTrackedMediaObjectUrl(blob(10, 'image/png'), { kind: 'image' });
    assert.equal(revokeTrackedMediaObjectUrl('  ' + url + '  '), true, '入参 trim 后才比对');
    assert.deepEqual(revoked, [url]);
    assert.equal(getMediaObjectUrlRegistrySnapshot().activeCount, 0);
    assert.equal(revokeTrackedMediaObjectUrl('blob:never'), true);
    assert.deepEqual(revoked, [url, 'blob:never']);
    const kinds = marks.map((m) => m.name + ':' + m.payload.kind);
    assert.deepEqual(kinds, [
      'media-object-url:created:image',
      'media-object-url:revoked:image',
      'media-object-url:revoked:unknown',
    ]);
  });
});

test('revoke 空串 / 全空白 / 假值一律 false 且不碰 URL API', () => {
  withStubs(({ revoked }) => {
    for (const v of ['', '   ', null, undefined, 0, false])
      assert.equal(revokeTrackedMediaObjectUrl(v), false, String(v));
    assert.deepEqual(revoked, []);
  });
});

test('快照是逐条拷贝：改写返回项不会污染登记表', () => {
  withStubs(() => {
    createTrackedMediaObjectUrl(blob(), { kind: 'video', ownerId: 'n1' });
    const snap = getMediaObjectUrlRegistrySnapshot();
    snap.entries[0].kind = 'hacked';
    snap.entries[0].ownerId = 'hacked';
    assert.equal(getMediaObjectUrlRegistrySnapshot().entries[0].kind, 'video');
    assert.equal(getMediaObjectUrlRegistrySnapshot().entries[0].ownerId, 'n1');
    assert.equal(snap.activeVideoCount, 1);
  });
});

test('无 window 时不炸；有 window 时挂出只读快照函数并记录 activeCount', () => {
  const prevWindow = globalThis.window;
  globalThis.window = undefined;
  __mediaObjectUrlRegistryForTest.clear();
  try {
    const prevUrl = globalThis.URL;
    globalThis.URL = { createObjectURL: () => 'blob:no-window', revokeObjectURL: () => {} };
    try {
      assert.equal(createTrackedMediaObjectUrl(blob()), 'blob:no-window');
    } finally {
      globalThis.URL = prevUrl;
    }
  } finally {
    globalThis.window = prevWindow;
    __mediaObjectUrlRegistryForTest.clear();
  }
  withStubs(({ marks: m }) => {
    createTrackedMediaObjectUrl(blob(5), { kind: 'video' });
    createTrackedMediaObjectUrl(blob(6), { kind: 'image' });
    const created = m.filter((x) => x.name === 'media-object-url:created').map((x) => x.payload.activeCount);
    assert.deepEqual(created, [1, 2], 'activeCount 在登记之后才取');
    assert.equal(globalThis.window.__getMediaObjectUrlRegistrySnapshot, getMediaObjectUrlRegistrySnapshot);
    assert.equal(globalThis.window.__getMediaObjectUrlRegistrySnapshot().activeCount, 2);
  });
});

test('clear 后门只清登记表，不会调用 revokeObjectURL', () => {
  withStubs(({ revoked }) => {
    createTrackedMediaObjectUrl(blob());
    __mediaObjectUrlRegistryForTest.clear();
    assert.equal(getMediaObjectUrlRegistrySnapshot().activeCount, 0);
    assert.deepEqual(revoked, [], '泄漏由调用方自负');
  });
});

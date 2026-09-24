import assert from 'node:assert/strict';
import test from 'node:test';

import { installStoryboard3DExportCanvasBridge } from './exportCanvasBridge.js';

const windowRecord = () => {
  const added = [];
  const removed = [];
  return {
    added,
    removed,
    addEventListener: (type, fn) => added.push([type, fn]),
    removeEventListener: (type, fn) => removed.push([type, fn]),
  };
};

test('导出画布桥：缺少宿主能力时返回空卸载函数且不注册', () => {
  assert.equal(typeof installStoryboard3DExportCanvasBridge(), 'function');
  assert.equal(
    typeof installStoryboard3DExportCanvasBridge({ createMediaNodeFromBlob: () => {} }),
    'function',
  );
  const bare = windowRecord();
  assert.equal(typeof installStoryboard3DExportCanvasBridge({ windowObject: bare }), 'function');
  assert.deepEqual(bare.added, []);
  const noop = installStoryboard3DExportCanvasBridge({
    windowObject: null,
    createMediaNodeFromBlob: () => {},
  });
  assert.equal(noop(), undefined);
});

test('导出画布桥：注册事件并返回可卸载的同一处理器', () => {
  const win = windowRecord();
  const uninstall = installStoryboard3DExportCanvasBridge({
    windowObject: win,
    createMediaNodeFromBlob: async () => ({}),
  });
  assert.equal(win.added.length, 1);
  assert.equal(win.added[0][0], 'storyboard-3d:export-complete');
  uninstall();
  assert.equal(win.removed.length, 1);
  assert.equal(win.removed[0][0], 'storyboard-3d:export-complete');
  assert.equal(win.removed[0][1], win.added[0][1]);
});

test('导出画布桥：returnToCanvas 为 false 时整批跳过', async () => {
  const win = windowRecord();
  const calls = [];
  installStoryboard3DExportCanvasBridge({
    windowObject: win,
    createMediaNodeFromBlob: async (...args) => calls.push(args),
    showToast: () => {},
  });
  await win.added[0][1]({
    detail: { options: { returnToCanvas: false }, results: [{ blob: { type: 'image/png' } }] },
  });
  assert.deepEqual(calls, []);
});

test('导出画布桥：只接受 image/ 与 video/ 类型的结果', async () => {
  const win = windowRecord();
  const calls = [];
  const toasts = [];
  installStoryboard3DExportCanvasBridge({
    windowObject: win,
    createMediaNodeFromBlob: async (blob, type, options) => {
      calls.push({ type, options });
      return { id: calls.length };
    },
    showToast: (message, kind) => toasts.push([message, kind]),
  });
  await win.added[0][1]({
    detail: {
      projectId: 'p-1',
      projectName: '镜头组',
      results: [
        null,
        { blob: {} },
        { blob: { type: 'audio/mpeg' } },
        { blob: { type: 'image/jpeg' } },
        { blob: { type: 'video/mp4' } },
      ],
    },
  });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].type, 'image/jpeg');
  assert.equal(calls[1].type, 'video/mp4');
  assert.deepEqual(calls[0].options, {
    name: '镜头组 1',
    placement: 'viewport-center-sequence',
    sequenceKey: 'storyboard-3d-export:p-1',
  });
  assert.deepEqual(calls[1].options, {
    name: '镜头组 2',
    placement: 'viewport-center-sequence',
    sequenceKey: 'storyboard-3d-export:p-1',
  });
  assert.deepEqual(toasts, [['已将 2 个 3D 预演结果添加到画布', 'success']]);
});

test('导出画布桥：单结果沿用工程名并对缺省类型回退 image/png', async () => {
  const win = windowRecord();
  const calls = [];
  const toasts = [];
  installStoryboard3DExportCanvasBridge({
    windowObject: win,
    createMediaNodeFromBlob: async (blob, type, options) => {
      calls.push({ type, options });
      return { id: 1 };
    },
    showToast: (message, kind) => toasts.push([message, kind]),
  });
  await win.added[0][1]({ detail: { results: [{ blob: { type: 'image/png' } }] } });
  assert.equal(calls[0].options.name, '3D 分镜');
  assert.equal(calls[0].options.sequenceKey, 'storyboard-3d-export:project');
  assert.deepEqual(toasts, [['已将 1 张 3D 分镜添加到画布', 'success']]);
});

test('导出画布桥：真实 Blob 无 type 时被丢弃', async () => {
  const win = windowRecord();
  const calls = [];
  installStoryboard3DExportCanvasBridge({
    windowObject: win,
    createMediaNodeFromBlob: async (...args) => {
      calls.push(args);
      return {};
    },
    showToast: () => {},
  });
  await win.added[0][1]({ detail: { results: [{ blob: new Blob(['x']) }] } });
  assert.deepEqual(calls, []);
});

test('导出画布桥：创建节点返回空值时不计数也不提示', async () => {
  const win = windowRecord();
  const toasts = [];
  installStoryboard3DExportCanvasBridge({
    windowObject: win,
    createMediaNodeFromBlob: async () => null,
    showToast: (message, kind) => toasts.push([message, kind]),
  });
  await win.added[0][1]({ detail: { results: [{ blob: { type: 'image/png' } }] } });
  assert.deepEqual(toasts, []);
});

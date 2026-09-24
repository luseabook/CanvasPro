import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectSelectedNodeExportItems,
  downloadNodeOutput,
  exportSelectedNodesBatch,
  hasBatchExportableSelection,
  isNodeBatchExportPending,
  subscribeNodeBatchExportPending,
} from './nodeBatchExport.js';

function withLocalStorage(store, run) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: store });
  try {
    return run();
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
}

function createToastRecorder() {
  const calls = [];
  const showToast = (message, type) => {
    calls.push({ message, type });
  };
  return { calls, showToast };
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const TEXT_NODE = { type: 'text', name: '正文', content: '  正文内容  ' };
const AI_TEXT_NODE = { type: 'ai-text', name: 'AI 文本', outputText: 'AI 输出' };
const IMAGE_LOCAL_NODE = {
  type: 'image',
  name: '图片',
  images: [{ localPath: 'data/assets/pic.png', fileName: 'pic.png' }],
};
const IMAGE_REMOTE_NODE = {
  type: 'ai-image',
  name: '远端图',
  images: [{ src: 'https://cdn.example.com/a/b.png' }],
};
const VIDEO_LOCAL_NODE = {
  type: 'video',
  name: '视频',
  videos: [{ src: 'output/vid.mp4', fileName: 'vid.mp4' }],
};
const AUDIO_LOCAL_NODE = {
  type: 'audio',
  name: '音频',
  audioUrl: 'data/uploads/snd.mp3',
  fileName: 'snd.mp3',
};

test('pending flag starts as false', () => {
  assert.equal(isNodeBatchExportPending(), false);
});

test('pending subscription invokes immediately and can be unsubscribed', () => {
  const seen = [];
  const unsubscribe = subscribeNodeBatchExportPending((value) => seen.push(value));
  assert.deepEqual(seen, [false]);
  assert.equal(typeof unsubscribe, 'function');
  assert.equal(unsubscribe(), true);
  assert.equal(unsubscribe(), false);
});

test('collectSelectedNodeExportItems reads text content for source-text/text', () => {
  const { items, skipped } = collectSelectedNodeExportItems({
    nodes: { n1: TEXT_NODE },
    selectedNodeIds: ['n1'],
  });
  assert.equal(skipped.length, 0);
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, 'text');
  assert.equal(items[0].nodeId, 'n1');
  assert.equal(items[0].nodeName, '正文');
  assert.equal(items[0].nodeType, 'text');
  assert.equal(items[0].text, '  正文内容  ');
});

test('collectSelectedNodeExportItems reads outputText for ai-text', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: AI_TEXT_NODE },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].text, 'AI 输出');
});

test('collectSelectedNodeExportItems falls back to resultText for ai-text', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: { type: 'ai-text', resultText: '结果文本' } },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].text, '结果文本');
});

test('collectSelectedNodeExportItems skips blank text nodes as NO_EXPORTABLE_CONTENT', () => {
  const { items, skipped } = collectSelectedNodeExportItems({
    nodes: { n1: { type: 'text', name: '空文本', content: '   ' } },
    selectedNodeIds: ['n1'],
  });
  assert.deepEqual(items, []);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].nodeId, 'n1');
  assert.equal(skipped[0].nodeName, '空文本');
  assert.equal(skipped[0].nodeType, 'text');
  assert.equal(skipped[0].reason, 'NO_EXPORTABLE_CONTENT');
});

test('collectSelectedNodeExportItems resolves image localPath through the storage guard', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: IMAGE_LOCAL_NODE },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, 'image');
  assert.equal(items[0].localPath, 'data/assets/pic.png');
  assert.equal(items[0].url, '');
  assert.equal(items[0].filenameHint, 'pic.png');
});

test('collectSelectedNodeExportItems keeps remote-only images by url', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: IMAGE_REMOTE_NODE },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, 'image');
  assert.equal(items[0].localPath, '');
  assert.equal(items[0].url, 'https://cdn.example.com/a/b.png');
  assert.equal(items[0].nodeType, 'ai-image');
});

test('collectSelectedNodeExportItems rejects image localPath outside the safe prefixes', () => {
  const { items, skipped } = collectSelectedNodeExportItems({
    nodes: { n1: { type: 'image', images: [{ localPath: '../../etc/passwd' }] } },
    selectedNodeIds: ['n1'],
  });
  assert.deepEqual(items, []);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].reason, 'NO_EXPORTABLE_CONTENT');
});

test('collectSelectedNodeExportItems honours mainImageIndex', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: {
      n1: {
        type: 'image',
        images: [{ localPath: 'data/assets/first.png' }, { localPath: 'data/assets/second.png' }],
        mainImageIndex: 1,
      },
    },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items[0].localPath, 'data/assets/second.png');
});

test('collectSelectedNodeExportItems reads video local path from videos[].src', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: VIDEO_LOCAL_NODE },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, 'video');
  assert.equal(items[0].localPath, 'output/vid.mp4');
  assert.equal(items[0].url, '');
  assert.equal(items[0].filenameHint, 'vid.mp4');
});

test('collectSelectedNodeExportItems keeps remote-only video by url', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: { type: 'ai-video', videos: [{ videoUrl: 'https://cdn.example.com/v.mp4' }] } },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items[0].kind, 'video');
  assert.equal(items[0].localPath, '');
  assert.equal(items[0].url, 'https://cdn.example.com/v.mp4');
});

test('collectSelectedNodeExportItems reads audio local path', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: AUDIO_LOCAL_NODE },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, 'audio');
  assert.equal(items[0].localPath, 'data/uploads/snd.mp3');
  assert.equal(items[0].filenameHint, 'snd.mp3');
});

test('collectSelectedNodeExportItems reports non-exportable node types as skipped', () => {
  const { items, skipped } = collectSelectedNodeExportItems({
    nodes: { n1: { type: 'comment-note', name: '批注' } },
    selectedNodeIds: ['n1'],
  });
  assert.deepEqual(items, []);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].nodeType, 'comment-note');
});

test('collectSelectedNodeExportItems ignores ids with no node object', () => {
  const { items, skipped } = collectSelectedNodeExportItems({
    nodes: {},
    selectedNodeIds: ['ghost'],
  });
  assert.deepEqual(items, []);
  assert.deepEqual(skipped, []);
});

test('collectSelectedNodeExportItems drops whitespace-only ids', () => {
  const { items, skipped } = collectSelectedNodeExportItems({
    nodes: { n1: TEXT_NODE },
    selectedNodeIds: ['   ', 'n1'],
  });
  assert.equal(items.length, 1);
  assert.deepEqual(skipped, []);
});

test('collectSelectedNodeExportItems accepts a Set of ids', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: TEXT_NODE, n2: AUDIO_LOCAL_NODE },
    selectedNodeIds: new Set(['n2', 'n1']),
  });
  assert.deepEqual(
    items.map((item) => item.nodeId),
    ['n2', 'n1'],
  );
});

test('collectSelectedNodeExportItems falls back to nodeId when no name fields exist', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { 'node-7': { type: 'text', content: 'x' } },
    selectedNodeIds: ['node-7'],
  });
  assert.equal(items[0].nodeName, 'node-7');
});

test('collectSelectedNodeExportItems prefers name over label/title/fileName', () => {
  const { items } = collectSelectedNodeExportItems({
    nodes: { n1: { type: 'text', name: 'N', label: 'L', title: 'T', fileName: 'F', content: 'x' } },
    selectedNodeIds: ['n1'],
  });
  assert.equal(items[0].nodeName, 'N');
});

test('hasBatchExportableSelection reflects collectable items', () => {
  assert.equal(hasBatchExportableSelection({ n1: TEXT_NODE }, ['n1']), true);
  assert.equal(hasBatchExportableSelection({ n1: { type: 'comment-note' } }, ['n1']), false);
  assert.equal(hasBatchExportableSelection({}, []), false);
});

test('downloadNodeOutput reports NO_EXPORTABLE_ITEMS with warn toast', async () => {
  const toast = createToastRecorder();
  const result = await downloadNodeOutput({
    node: { type: 'comment-note' },
    nodeId: 'n1',
    showToast: toast.showToast,
  });
  assert.equal(result.success, false);
  assert.equal(result.canceled, false);
  assert.equal(result.code, 'NO_EXPORTABLE_ITEMS');
  assert.equal(result.nodeId, 'n1');
  assert.equal(result.kind, '');
  assert.equal(result.filename, '');
  assert.equal(result.saveResult, null);
  assert.equal(result.skipped.length, 1);
  assert.equal(toast.calls.length, 1);
  assert.equal(toast.calls[0].type, 'warn');
});

test('downloadNodeOutput reports NO_EXPORTABLE_ITEMS when the node id is unknown', async () => {
  const toast = createToastRecorder();
  const result = await downloadNodeOutput({ nodeId: 'ghost', showToast: toast.showToast });
  assert.equal(result.code, 'NO_EXPORTABLE_ITEMS');
  assert.equal(result.nodeId, 'ghost');
  assert.deepEqual(result.skipped, []);
});

test('downloadNodeOutput writes text through saveTextDownload with a sanitized .txt name', async () => {
  const toast = createToastRecorder();
  const saveCalls = [];
  const result = await downloadNodeOutput({
    node: { type: 'text', name: 'a/b:c', content: '正文' },
    nodeId: 'n1',
    showToast: toast.showToast,
    saveTextDownload: async (payload, deps) => {
      saveCalls.push({ payload, deps });
      return { success: true, canceled: false, mode: 'browser' };
    },
  });
  assert.equal(result.success, true);
  assert.equal(result.code, 'DOWNLOADED');
  assert.equal(result.kind, 'text');
  assert.equal(result.filename, 'a_b_c.txt');
  assert.equal(saveCalls.length, 1);
  assert.equal(saveCalls[0].payload.filename, 'a_b_c.txt');
  assert.equal(saveCalls[0].payload.content, '正文');
  assert.equal(saveCalls[0].payload.mimeType, 'text/plain;charset=utf-8');
  assert.equal(toast.calls.at(-1).type, 'success');
});

test('downloadNodeOutput strips an existing .txt suffix from the text filename', async () => {
  const result = await downloadNodeOutput({
    node: { type: 'text', name: 'notes.txt', content: 'x' },
    nodeId: 'n1',
    showToast: () => {},
    saveTextDownload: async () => ({ success: true }),
  });
  assert.equal(result.filename, 'notes.txt');
});

test('downloadNodeOutput falls back to saveMediaDownload for media items', async () => {
  const toast = createToastRecorder();
  const mediaCalls = [];
  const mediaFilenameCalls = [];
  const result = await downloadNodeOutput({
    node: IMAGE_LOCAL_NODE,
    nodeId: 'n1',
    showToast: toast.showToast,
    resolveNodeMediaDownloadFilename: (options) => {
      mediaFilenameCalls.push(options);
      return 'stub.png';
    },
    saveMediaDownload: async (payload, deps) => {
      mediaCalls.push({ payload, deps });
      return { success: true, canceled: false, mode: 'browser' };
    },
  });
  assert.equal(result.success, true);
  assert.equal(result.kind, 'image');
  assert.equal(result.filename, 'stub.png');
  assert.equal(mediaFilenameCalls.length, 1);
  assert.deepEqual(mediaFilenameCalls[0], {
    nodeName: '图片',
    fileName: 'pic.png',
    kind: 'image',
    sources: ['data/assets/pic.png', ''],
    fallbackBase: 'image',
  });
  assert.deepEqual(mediaCalls[0].payload, {
    kind: 'image',
    localPath: 'data/assets/pic.png',
    url: '',
    filename: 'stub.png',
  });
});

test('downloadNodeOutput forwards injected download dependencies', async () => {
  const deps = { desktopBridge: { marker: true } };
  let seen = null;
  await downloadNodeOutput({
    node: TEXT_NODE,
    nodeId: 'n1',
    showToast: () => {},
    downloadDependencies: deps,
    saveTextDownload: async (_payload, injected) => {
      seen = injected;
      return { success: true };
    },
  });
  assert.equal(seen, deps);
});

test('downloadNodeOutput reports CANCELED when the save is canceled', async () => {
  const result = await downloadNodeOutput({
    node: TEXT_NODE,
    nodeId: 'n1',
    showToast: () => {},
    saveTextDownload: async () => ({ success: false, canceled: true }),
  });
  assert.equal(result.success, false);
  assert.equal(result.canceled, true);
  assert.equal(result.code, 'CANCELED');
  assert.equal(result.kind, 'text');
});

test('downloadNodeOutput surfaces a save failure with a code and error toast', async () => {
  const toast = createToastRecorder();
  const result = await downloadNodeOutput({
    node: TEXT_NODE,
    nodeId: 'n1',
    showToast: toast.showToast,
    saveTextDownload: async () => ({ success: false, code: 'DISK_FULL', message: '磁盘已满' }),
  });
  assert.equal(result.success, false);
  assert.equal(result.canceled, false);
  assert.equal(result.code, 'DISK_FULL');
  assert.equal(result.error, '磁盘已满');
  assert.equal(toast.calls.length, 1);
  assert.equal(toast.calls[0].type, 'error');
});

test('downloadNodeOutput defaults a save failure code to DOWNLOAD_FAILED', async () => {
  const result = await downloadNodeOutput({
    node: TEXT_NODE,
    nodeId: 'n1',
    showToast: () => {},
    saveTextDownload: async () => ({ success: false, error: { message: '桥接异常' } }),
  });
  assert.equal(result.code, 'DOWNLOAD_FAILED');
  assert.equal(result.error, '桥接异常');
});

test('downloadNodeOutput catches a thrown save into DOWNLOAD_FAILED', async () => {
  const toast = createToastRecorder();
  const result = await downloadNodeOutput({
    node: TEXT_NODE,
    nodeId: 'n1',
    showToast: toast.showToast,
    saveTextDownload: async () => {
      throw new Error('boom');
    },
  });
  assert.equal(result.success, false);
  assert.equal(result.code, 'DOWNLOAD_FAILED');
  assert.equal(result.error, 'boom');
  assert.equal(result.saveResult, null);
  assert.equal(toast.calls[0].type, 'error');
});

test('downloadNodeOutput defaults the node id to the node payload id', async () => {
  const result = await downloadNodeOutput({
    node: { id: 'from-node', type: 'text', content: 'x' },
    showToast: () => {},
    saveTextDownload: async () => ({ success: true }),
  });
  assert.equal(result.nodeId, 'from-node');
  assert.equal(result.success, true);
});

test('exportSelectedNodesBatch returns NO_EXPORTABLE_ITEMS and logs skipped ids', async () => {
  const toast = createToastRecorder();
  const infoCalls = [];
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: { type: 'comment-note' } }, selectedNodeIds: ['n1'] },
    electronAPI: { nodeExport: { exportSelected: async () => ({ success: true }) } },
    showToast: toast.showToast,
    consoleObject: { info: (...args) => infoCalls.push(args) },
  });
  assert.equal(result.success, false);
  assert.equal(result.code, 'NO_EXPORTABLE_ITEMS');
  assert.equal(result.exportedCount, 0);
  assert.deepEqual(result.counts, {});
  assert.equal(result.skipped.length, 1);
  assert.equal(infoCalls.length, 1);
  assert.equal(infoCalls[0][0], '[node-batch-export] skipped');
  assert.equal(toast.calls.at(-1).type, 'warn');
});

test('exportSelectedNodesBatch reports UNSUPPORTED without an export bridge', async () => {
  const toast = createToastRecorder();
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: { nodeExport: {} },
    showToast: toast.showToast,
    consoleObject: { info: () => {} },
  });
  assert.equal(result.success, false);
  assert.equal(result.code, 'UNSUPPORTED');
  assert.equal(result.exportedCount, 0);
  assert.equal(toast.calls[0].type, 'error');
  assert.equal(isNodeBatchExportPending(), false);
});

test('exportSelectedNodesBatch reports UNSUPPORTED when no bridge is available', async () => {
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: null,
    showToast: () => {},
    consoleObject: { info: () => {} },
  });
  assert.equal(result.code, 'UNSUPPORTED');
});

test('exportSelectedNodesBatch guards re-entry while an export is pending', async () => {
  const deferred = createDeferred();
  const first = exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: { nodeExport: { exportSelected: () => deferred.promise } },
    showToast: () => {},
    consoleObject: { info: () => {} },
  });
  assert.equal(isNodeBatchExportPending(), true);
  const second = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: { nodeExport: { exportSelected: () => deferred.promise } },
    showToast: () => {},
    consoleObject: { info: () => {} },
  });
  assert.deepEqual(second, { success: false, code: 'EXPORT_IN_PROGRESS' });
  deferred.resolve({ success: true, exportedCount: 1 });
  const settled = await first;
  assert.equal(settled.success, true);
  assert.equal(isNodeBatchExportPending(), false);
});

test('exportSelectedNodesBatch merges skipped ids from the bridge result', async () => {
  const toast = createToastRecorder();
  const infoCalls = [];
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE, n2: { type: 'comment-note' } }, selectedNodeIds: ['n1', 'n2'] },
    electronAPI: {
      nodeExport: {
        exportSelected: async () => ({
          success: true,
          exportedCount: 1,
          skipped: [{ nodeId: 'bridge-1', reason: 'WRITE_FAILED' }],
        }),
      },
    },
    showToast: toast.showToast,
    consoleObject: { info: (...args) => infoCalls.push(args) },
  });
  assert.equal(result.success, true);
  assert.equal(result.exportedCount, 1);
  assert.deepEqual(
    result.skipped.map((entry) => entry.nodeId),
    ['n2', 'bridge-1'],
  );
  assert.equal(infoCalls.length, 1);
  assert.equal(infoCalls[0][0], '[node-batch-export] skipped');
  assert.equal(toast.calls.at(-1).type, 'success');
});

test('exportSelectedNodesBatch swallows the skipped toast when nothing was skipped', async () => {
  const toast = createToastRecorder();
  const infoCalls = [];
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: { nodeExport: { exportSelected: async () => ({ success: true, exportedCount: 1 }) } },
    showToast: toast.showToast,
    consoleObject: { info: (...args) => infoCalls.push(args) },
  });
  assert.equal(result.success, true);
  assert.deepEqual(result.skipped, []);
  assert.deepEqual(infoCalls, []);
  assert.equal(toast.calls.at(-1).type, 'success');
});

test('exportSelectedNodesBatch returns the raw result when the bridge cancels', async () => {
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: {
      nodeExport: { exportSelected: async () => ({ success: false, canceled: true, exportedCount: 0 }) },
    },
    showToast: () => {},
    consoleObject: { info: () => {} },
  });
  assert.equal(result.canceled, true);
  assert.equal(isNodeBatchExportPending(), false);
});

test('exportSelectedNodesBatch warns when the bridge reports NO_EXPORTABLE_ITEMS', async () => {
  const toast = createToastRecorder();
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: {
      nodeExport: { exportSelected: async () => ({ code: 'NO_EXPORTABLE_ITEMS' }) },
    },
    showToast: toast.showToast,
    consoleObject: { info: () => {} },
  });
  assert.equal(result.code, 'NO_EXPORTABLE_ITEMS');
  assert.equal(toast.calls.at(-1).type, 'warn');
});

test('exportSelectedNodesBatch surfaces a bridge failure message', async () => {
  const toast = createToastRecorder();
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: {
      nodeExport: {
        exportSelected: async () => ({ success: false, code: 'WRITE_FAILED', message: '写入失败' }),
      },
    },
    showToast: toast.showToast,
    consoleObject: { info: () => {} },
  });
  assert.equal(result.success, false);
  assert.equal(result.code, 'WRITE_FAILED');
  assert.equal(result.message, '写入失败');
  assert.equal(toast.calls.at(-1).message, '写入失败');
  assert.equal(toast.calls.at(-1).type, 'error');
});

test('exportSelectedNodesBatch catches a thrown bridge call', async () => {
  const toast = createToastRecorder();
  const result = await exportSelectedNodesBatch({
    state: { nodes: { n1: TEXT_NODE }, selectedNodeIds: ['n1'] },
    electronAPI: {
      nodeExport: {
        exportSelected: async () => {
          throw new Error('bridge down');
        },
      },
    },
    showToast: toast.showToast,
    consoleObject: { info: () => {} },
  });
  assert.equal(result.success, false);
  assert.equal(result.canceled, false);
  assert.equal(result.error, 'bridge down');
  assert.equal(result.exportedCount, 0);
  assert.equal(toast.calls.at(-1).type, 'error');
  assert.equal(isNodeBatchExportPending(), false);
});

test('exportSelectedNodesBatch attaches filenameBase when original filenames are enabled', () => {
  return withLocalStorage({ getItem: () => '1', setItem: () => {} }, async () => {
    const seen = [];
    await exportSelectedNodesBatch({
      state: { nodes: { n1: VIDEO_LOCAL_NODE, n2: TEXT_NODE }, selectedNodeIds: ['n1', 'n2'] },
      electronAPI: {
        nodeExport: {
          exportSelected: async ({ items }) => {
            seen.push(...items);
            return { success: true, exportedCount: items.length };
          },
        },
      },
      showToast: () => {},
      consoleObject: { info: () => {} },
    });
    assert.equal(seen.length, 2);
    const video = seen.find((item) => item.nodeId === 'n1');
    assert.equal(video.filenameBase, 'vid');
    const text = seen.find((item) => item.nodeId === 'n2');
    assert.equal(text.filenameBase, undefined);
  });
});

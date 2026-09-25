import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildStoryClipExportItem,
  buildStoryClipExportPlan,
  exportStoryClipVideos,
} from './storyClipExport.js';

// 片段与视频结果的最小构造；覆盖项写成 'k' in over ? over.k : 默认值
function makeClip(over = {}) {
  return {
    id: 'id' in over ? over.id : 'clip-1',
    number: 'number' in over ? over.number : undefined,
    video: {
      activeIndex: 'activeIndex' in over ? over.activeIndex : 0,
      results: 'results' in over ? over.results : [{ localPath: 'output/clip-1.mp4' }],
    },
  };
}

test('buildStoryClipExportItem：本地视频按「E集-C片段」命名，nodeId 取片段 id', () => {
  const item = buildStoryClipExportItem({
    episode: { number: 2 },
    clip: makeClip({ id: '  c-9  ', number: 4 }),
  });
  assert.deepEqual(item, {
    nodeId: 'c-9',
    nodeName: 'E02-C04',
    nodeType: 'story-clip-video',
    kind: 'video',
    localPath: 'output/clip-1.mp4',
    filenameHint: 'output/clip-1.mp4',
  });
});

test('buildStoryClipExportItem：缺编号时集号回落 1、片段号取 clipIndex+1，缺 id 时 nodeId 用名字', () => {
  const item = buildStoryClipExportItem({ episode: { number: 0 }, clip: makeClip({ id: '' }), clipIndex: 4 });
  assert.equal(item.nodeName, 'E01-C05');
  assert.equal(item.nodeId, 'E01-C05');
  assert.equal(
    buildStoryClipExportItem({ episode: { number: 12.9 }, clip: makeClip({ number: 123 }) }).nodeName,
    'E12-C123',
  );
  assert.equal(
    buildStoryClipExportItem({ episode: { number: 'x' }, clip: makeClip({ number: -3 }) }).nodeName,
    'E01-C01',
  );
});

test('buildStoryClipExportItem：只有远程 http(s) 地址时导出 url，不带 localPath 键', () => {
  const item = buildStoryClipExportItem({
    clip: makeClip({ results: [{ videoUrl: '  https://cdn.example.com/v.mp4  ' }] }),
  });
  assert.equal(item.url, 'https://cdn.example.com/v.mp4');
  assert.equal(item.filenameHint, 'https://cdn.example.com/v.mp4');
  assert.equal('localPath' in item, false);
});

test('buildStoryClipExportItem：displayLocalPath 优先；代理转码中时不用本地路径而回落远程地址', () => {
  const display = buildStoryClipExportItem({
    clip: makeClip({
      results: [{ displayLocalPath: 'output/display.mp4', localPath: 'output/original.mp4' }],
    }),
  });
  assert.equal(display.localPath, 'output/display.mp4');
  const processing = buildStoryClipExportItem({
    clip: makeClip({
      results: [
        { videoProxyStatus: 'processing', src: 'output/p.mp4', url: 'https://cdn.example.com/p.mp4' },
      ],
    }),
  });
  assert.equal(processing.url, 'https://cdn.example.com/p.mp4');
  assert.equal('localPath' in processing, false);
});

test('buildStoryClipExportItem：没有结果、当前结果带 error、或只有非 http 地址时返回 null', () => {
  assert.equal(buildStoryClipExportItem({ clip: makeClip({ results: [] }) }), null);
  assert.equal(buildStoryClipExportItem({ clip: { id: 'x' } }), null);
  assert.equal(
    buildStoryClipExportItem({ clip: makeClip({ results: [{ error: '失败', localPath: 'output/a.mp4' }] }) }),
    null,
  );
  assert.equal(buildStoryClipExportItem({ clip: makeClip({ results: [{ url: 'blob:http://x/1' }] }) }), null);
  assert.equal(buildStoryClipExportItem(), null);
});

test('buildStoryClipExportItem：activeIndex 先滤掉非对象再夹到有效范围，非数字按 0', () => {
  const results = [null, { localPath: 'output/a.mp4' }, 'bad', { localPath: 'output/b.mp4' }];
  assert.equal(
    buildStoryClipExportItem({ clip: makeClip({ results, activeIndex: 1 }) }).localPath,
    'output/b.mp4',
  );
  assert.equal(
    buildStoryClipExportItem({ clip: makeClip({ results, activeIndex: 99 }) }).localPath,
    'output/b.mp4',
  );
  assert.equal(
    buildStoryClipExportItem({ clip: makeClip({ results, activeIndex: -5 }) }).localPath,
    'output/a.mp4',
  );
  assert.equal(
    buildStoryClipExportItem({ clip: makeClip({ results, activeIndex: 'x' }) }).localPath,
    'output/a.mp4',
  );
});

test('buildStoryClipExportPlan：当前片段模式只看传入的 clip，文件名带「当前片段」', () => {
  const plan = buildStoryClipExportPlan({
    project: { name: '星河' },
    episode: { number: 3 },
    clip: makeClip(),
  });
  assert.equal(plan.mode, 'current');
  assert.equal(plan.requestedCount, 1);
  assert.equal(plan.items.length, 1);
  assert.deepEqual(plan.skipped, []);
  assert.equal(plan.filename, '星河-E03-当前片段.zip');
  const empty = buildStoryClipExportPlan({ project: {}, episode: {}, clip: null });
  assert.equal(empty.requestedCount, 0);
  assert.deepEqual(empty.items, []);
  assert.equal(empty.filename, '剧本-E01-当前片段.zip');
});

test('buildStoryClipExportPlan：整集模式逐个片段判断，缺视频的记入 skipped', () => {
  const episode = {
    number: 7,
    clips: [
      makeClip({ id: 'k1', number: 3, results: [{ error: 'bad', localPath: 'output/e.mp4' }] }),
      makeClip({ id: '', results: [{ localPath: 'output/ok.mp4' }] }),
      makeClip({ id: ' k3 ', results: [] }),
    ],
  };
  const plan = buildStoryClipExportPlan({ project: { title: '备用标题' }, episode, mode: 'episode' });
  assert.equal(plan.requestedCount, 3);
  assert.deepEqual(
    plan.items.map((item) => item.nodeName),
    ['E07-C02'],
  );
  assert.deepEqual(plan.skipped, [
    {
      nodeId: 'k1',
      nodeName: 'E07-C03',
      nodeType: 'story-clip-video',
      kind: 'video',
      reason: 'NO_ACTIVE_VIDEO',
      detail: '片段没有可导出的当前视频版本',
    },
    {
      nodeId: 'k3',
      nodeName: 'E07-C03',
      nodeType: 'story-clip-video',
      kind: 'video',
      reason: 'NO_ACTIVE_VIDEO',
      detail: '片段没有可导出的当前视频版本',
    },
  ]);
  assert.equal(plan.filename, '备用标题-E07-全部片段.zip');
  assert.equal(buildStoryClipExportPlan({ episode: { clips: 'x' }, mode: 'episode' }).requestedCount, 0);
});

test('buildStoryClipExportPlan：文件名清洗非法字符、折叠空白、去掉末尾点号，空名回落「剧本」', () => {
  const plan = buildStoryClipExportPlan({ project: { name: ' a/b:c*?"<>|  x.. ' }, clip: makeClip() });
  assert.equal(plan.filename, 'a_b_c______ x-E01-当前片段.zip');
  const long = buildStoryClipExportPlan({ project: { name: '长'.repeat(100) }, clip: makeClip() });
  assert.equal(long.filename, '长'.repeat(80) + '-E01-当前片段.zip');
  assert.equal(
    buildStoryClipExportPlan({ project: { name: '...' }, clip: makeClip() }).filename,
    '剧本-E01-当前片段.zip',
  );
  assert.equal(
    buildStoryClipExportPlan({ project: { storyTitle: '第三候选' }, clip: makeClip() }).filename,
    '第三候选-E01-当前片段.zip',
  );
});

test('exportStoryClipVideos：只把 filename 和 items 交给导出函数，并合并双方的 skipped', async () => {
  const calls = [];
  const episode = {
    number: 1,
    clips: [makeClip({ id: 'a' }), makeClip({ id: 'b', results: [] })],
  };
  const result = await exportStoryClipVideos({
    project: { name: 'P' },
    episode,
    mode: 'episode',
    exportSelected: async (payload) => {
      calls.push(payload);
      return { success: true, exportedCount: 1, skipped: [{ nodeId: 'from-export' }] };
    },
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(Object.keys(calls[0]), ['filename', 'items']);
  assert.equal(calls[0].filename, 'P-E01-全部片段.zip');
  assert.equal(calls[0].items.length, 1);
  assert.equal(result.success, true);
  assert.equal(result.exportedCount, 1);
  assert.equal(result.requestedCount, 2);
  assert.deepEqual(
    result.skipped.map((entry) => entry.nodeId),
    ['b', 'from-export'],
  );
  assert.equal(result.skippedCount, 2);
});

test('exportStoryClipVideos：导出函数返回的 skipped 不是数组或返回空值时忽略', async () => {
  const odd = await exportStoryClipVideos({
    clip: makeClip(),
    exportSelected: async () => ({ skipped: 'x', ok: 1 }),
  });
  assert.deepEqual(odd.skipped, []);
  assert.equal(odd.skippedCount, 0);
  assert.equal(odd.ok, 1);
  const empty = await exportStoryClipVideos({ clip: makeClip(), exportSelected: async () => undefined });
  assert.deepEqual(empty, { requestedCount: 1, skipped: [], skippedCount: 0 });
});

test('exportStoryClipVideos：没有可导出的视频时按模式报错，不调用导出函数', async () => {
  let called = 0;
  const exportSelected = async () => {
    called += 1;
  };
  await assert.rejects(
    exportStoryClipVideos({ clip: makeClip({ results: [] }), exportSelected }),
    /^Error: 当前片段还没有可导出的视频$/,
  );
  await assert.rejects(
    exportStoryClipVideos({ episode: { clips: [] }, mode: 'episode', exportSelected }),
    /^Error: 本集还没有可导出的视频片段$/,
  );
  assert.equal(called, 0);
});

test('exportStoryClipVideos：不传导出函数时走 desktopBridge.nodeExport.exportSelected', async (t) => {
  const hadWindow = 'window' in globalThis;
  const previous = globalThis.window;
  t.after(() => {
    if (hadWindow) globalThis.window = previous;
    else delete globalThis.window;
  });
  delete globalThis.window;
  // 没有桌面桥（Node 下没有 window.electronAPI，也不是 chrome-shell）时，桥层直接报不可用
  await assert.rejects(exportStoryClipVideos({ clip: makeClip() }), /nodeExport\.exportSelected unavailable/);
  const calls = [];
  globalThis.window = {
    electronAPI: {
      nodeExport: {
        exportSelected: async (payload) => {
          calls.push(payload);
          return { success: true };
        },
      },
    },
  };
  const result = await exportStoryClipVideos({ project: { name: 'P' }, clip: makeClip() });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].filename, 'P-E01-当前片段.zip');
  assert.equal(calls[0].items[0].localPath, 'output/clip-1.mp4');
  assert.deepEqual(result, { success: true, requestedCount: 1, skipped: [], skippedCount: 0 });
});

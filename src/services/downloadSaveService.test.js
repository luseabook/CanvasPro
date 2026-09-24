import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  saveTextDownload,
  saveMediaDownload,
  saveMediaFilesDownload,
  __downloadSaveServiceForTest,
} from './downloadSaveService.js';

const { triggerHrefDownload, triggerBlobDownload, resolveDesktopMediaSource, cleanupStagedMedia } =
  __downloadSaveServiceForTest;

function createAnchorDocument() {
  const appended = [],
    removed = [],
    clicks = [],
    element = {
      href: '',
      download: '',
      rel: '',
      hidden: false,
      click: () => clicks.push(element),
      remove: () => removed.push(element),
    };
  return {
    appended,
    removed,
    clicks,
    element,
    documentRef: { createElement: () => element, body: { appendChild: (node) => appended.push(node) } },
  };
}

function createUrlApi() {
  const revoked = [];
  return {
    revoked,
    api: { createObjectURL: () => 'blob:fake', revokeObjectURL: (url) => revoked.push(url) },
  };
}

test('downloadSaveService: 测试导出面冻结且含四个成员', () => {
  (assert.equal(Object.isFrozen(__downloadSaveServiceForTest), true),
    assert.deepEqual(Object.keys(__downloadSaveServiceForTest).sort(), [
      'cleanupStagedMedia',
      'resolveDesktopMediaSource',
      'triggerBlobDownload',
      'triggerHrefDownload',
    ]));
});

test('downloadSaveService: href 下载写入属性并点击后摘除', () => {
  const { documentRef, element, appended, clicks, removed } = createAnchorDocument();
  triggerHrefDownload({ url: 'https://x/y.png', filename: 'y.png', documentRef });
  (assert.equal(element.href, 'https://x/y.png'),
    assert.equal(element.download, 'y.png'),
    assert.equal(element.rel, 'noopener'),
    assert.equal(element.hidden, true),
    assert.deepEqual(appended, [element]),
    assert.deepEqual(clicks, [element]),
    assert.deepEqual(removed, [element]));
});

test('downloadSaveService: href 下载缺少文件名时回退 download', () => {
  const { documentRef, element } = createAnchorDocument();
  triggerHrefDownload({ url: 'https://x/y', documentRef });
  assert.equal(element.download, 'download');
});

test('downloadSaveService: href 下载在无地址或无 document 时抛错', () => {
  const { documentRef } = createAnchorDocument();
  (assert.throws(() => triggerHrefDownload({ url: '', documentRef }), /当前环境无法下载文件/),
    assert.throws(
      () => triggerHrefDownload({ url: 'https://x/y', documentRef: {} }),
      /当前环境无法下载文件/,
    ));
});

test('downloadSaveService: blob 下载按调度释放 objectURL', () => {
  const { documentRef, element } = createAnchorDocument(),
    { api, revoked } = createUrlApi(),
    scheduled = [];
  triggerBlobDownload({
    blob: { type: 'image/png' },
    filename: 'a.png',
    documentRef,
    urlApi: api,
    schedule: (fn) => scheduled.push(fn),
  });
  (assert.equal(element.href, 'blob:fake'),
    assert.equal(element.download, 'a.png'),
    assert.deepEqual(revoked, []),
    assert.equal(scheduled.length, 1));
  scheduled[0]();
  assert.deepEqual(revoked, ['blob:fake']);
});

test('downloadSaveService: 无调度函数时同步释放 objectURL', () => {
  const { documentRef } = createAnchorDocument(),
    { api, revoked } = createUrlApi();
  triggerBlobDownload({
    blob: { type: 'image/png' },
    filename: 'a.png',
    documentRef,
    urlApi: api,
    schedule: null,
  });
  assert.deepEqual(revoked, ['blob:fake']);
});

test('downloadSaveService: blob 下载在无 blob 或无法建 objectURL 时抛错', () => {
  const { documentRef } = createAnchorDocument();
  (assert.throws(
    () =>
      triggerBlobDownload({ blob: null, filename: 'a', documentRef, urlApi: { createObjectURL: () => 'x' } }),
    /当前环境无法下载文件/,
  ),
    assert.throws(
      () => triggerBlobDownload({ blob: { type: 'image/png' }, filename: 'a', documentRef, urlApi: {} }),
      /当前环境无法下载文件/,
    ));
});

test('downloadSaveService: 文本下载走桌面桥能力并填充默认值', async () => {
  const calls = [],
    desktopBridge = {
      nodeExport: {
        canSaveText: () => true,
        saveText: (payload) => {
          calls.push(payload);
          return { success: true, mode: 'desktop' };
        },
      },
    },
    result = await saveTextDownload(
      { filename: '', content: 'hi', mimeType: '', title: '', filterName: '' },
      { desktopBridge },
    );
  (assert.deepEqual(result, { success: true, mode: 'desktop' }),
    assert.deepEqual(calls, [
      { filename: 'export.txt', content: 'hi', mimeType: '', title: '', filterName: '' },
    ]));
});

test('downloadSaveService: 仅有 saveText 方法时同样走桌面桥', async () => {
  const desktopBridge = { nodeExport: { saveText: () => ({ success: true, mode: 'desktop' }) } },
    result = await saveTextDownload({ content: 'x', filename: 'a.txt' }, { desktopBridge });
  assert.equal(result.mode, 'desktop');
});

test('downloadSaveService: 无桌面桥时文本下载落浏览器路径', async () => {
  const { documentRef } = createAnchorDocument(),
    { api, revoked } = createUrlApi(),
    scheduled = [];
  const result = await saveTextDownload(
    { content: 'hi', filename: 'a.txt' },
    { desktopBridge: null, documentRef, urlApi: api, schedule: (fn) => scheduled.push(fn) },
  );
  (assert.deepEqual(result, { success: true, canceled: false, mode: 'browser' }),
    assert.equal(scheduled.length, 1),
    scheduled[0](),
    assert.deepEqual(revoked, ['blob:fake']));
});

test('downloadSaveService: 无 Blob 能力时文本下载抛错', async () => {
  await assert.rejects(
    () => saveTextDownload({ content: 'hi' }, { desktopBridge: null, Blob: null }),
    /当前环境无法创建下载文件/,
  );
});

test('downloadSaveService: 媒体下载走桌面桥并透传本地路径', async () => {
  const calls = [],
    deleted = [],
    desktopBridge = {
      nodeExport: {
        canSaveMedia: () => true,
        saveMedia: (payload) => {
          calls.push(payload);
          return { success: true, mode: 'desktop' };
        },
      },
    };
  const result = await saveMediaDownload(
    { kind: 'image', localPath: 'data/assets/x.png', filename: 'f.png', title: 'T' },
    { desktopBridge, deleteOutputFilesFromServer: (payload) => deleted.push(payload) },
  );
  (assert.deepEqual(result, { success: true, mode: 'desktop' }),
    assert.deepEqual(calls, [
      {
        kind: 'image',
        localPath: 'data/assets/x.png',
        url: '/data/assets/x.png',
        filename: 'f.png',
        title: 'T',
      },
    ]),
    assert.deepEqual(deleted, []));
});

test('downloadSaveService: 临时 blob 先暂存再清理', async () => {
  const calls = [],
    staged = [],
    deleted = [],
    desktopBridge = {
      nodeExport: {
        canSaveMedia: () => true,
        saveMedia: (payload) => {
          calls.push(payload);
          return { success: true };
        },
      },
    };
  const result = await saveMediaDownload(
    { kind: 'video', blob: { type: 'video/mp4' }, filename: 'clip.mp4' },
    {
      desktopBridge,
      saveOutputToServer: (blob, options) => {
        staged.push(options);
        return { localPath: 'data/assets/staged.mp4' };
      },
      deleteOutputFilesFromServer: (payload) => deleted.push(payload),
    },
  );
  (assert.deepEqual(result, { success: true }),
    assert.deepEqual(staged, [{ ext: 'mp4', subDir: 'desktop-save-staging' }]),
    assert.equal(calls[0].localPath, 'data/assets/staged.mp4'),
    assert.equal(calls[0].url, '/data/assets/staged.mp4'),
    assert.deepEqual(deleted, [{ localPaths: ['data/assets/staged.mp4'] }]));
});

test('downloadSaveService: 暂存未返回安全本地路径时抛错', async () => {
  const desktopBridge = { nodeExport: { canSaveMedia: () => true, saveMedia: () => ({ success: true }) } };
  await assert.rejects(
    () =>
      saveMediaDownload(
        { kind: 'image', blob: { type: 'image/png' }, filename: 'a.png' },
        { desktopBridge, saveOutputToServer: () => ({ localPath: 'C:/tmp/a.png' }) },
      ),
    /暂存媒体文件后未返回本地路径/,
  );
});

test('downloadSaveService: 无桌面桥时媒体下载落浏览器路径', async () => {
  const { documentRef, element } = createAnchorDocument(),
    { api } = createUrlApi();
  const blobResult = await saveMediaDownload(
    { blob: { type: 'image/png' }, filename: 'a.png' },
    { desktopBridge: null, documentRef, urlApi: api, schedule: null },
  );
  (assert.deepEqual(blobResult, { success: true, canceled: false, mode: 'browser' }),
    assert.equal(element.download, 'a.png'));
  const hrefResult = await saveMediaDownload(
    { url: 'https://x/y.png', filename: 'y.png' },
    { desktopBridge: null, documentRef },
  );
  (assert.deepEqual(hrefResult, { success: true, canceled: false, mode: 'browser' }),
    assert.equal(element.href, 'https://x/y.png'));
});

test('downloadSaveService: 解析媒体来源支持本地路径与远程直链', async () => {
  (assert.deepEqual(await resolveDesktopMediaSource({ kind: 'image', localPath: 'data/assets/a.png' }, {}), {
    kind: 'image',
    localPath: 'data/assets/a.png',
    url: '/data/assets/a.png',
    staged: false,
  }),
    assert.deepEqual(await resolveDesktopMediaSource({ kind: 'image', url: 'https://x/y.png' }, {}), {
      kind: 'image',
      localPath: '',
      url: 'https://x/y.png',
      staged: false,
    }));
});

test('downloadSaveService: 解析媒体来源经 blob URL 拉取并暂存', async () => {
  const fetched = [];
  const resolved = await resolveDesktopMediaSource(
    { kind: 'audio', url: 'blob:xyz', filename: 'a.mp3' },
    {
      fetchRemoteBlob: (url) => {
        fetched.push(url);
        return { type: 'audio/mpeg' };
      },
      saveOutputToServer: () => ({ localPath: 'output/a.mp3' }),
    },
  );
  (assert.deepEqual(fetched, ['blob:xyz']),
    assert.deepEqual(resolved, {
      kind: 'audio',
      localPath: 'output/a.mp3',
      url: '/output/a.mp3',
      staged: true,
    }));
});

test('downloadSaveService: 解析媒体来源拒绝未知类型与空来源', async () => {
  (await assert.rejects(() => resolveDesktopMediaSource({ kind: 'document' }, {}), /不支持的媒体文件类型/),
    await assert.rejects(() => resolveDesktopMediaSource({ kind: 'image' }, {}), /没有可保存的媒体文件/));
});

test('downloadSaveService: 无 fetchRemoteBlob 时 blob 来源抛错', async () => {
  await assert.rejects(
    () => resolveDesktopMediaSource({ kind: 'image', url: 'blob:xyz' }, { fetchRemoteBlob: null }),
    /当前环境无法读取临时媒体文件/,
  );
});

test('downloadSaveService: 清理仅针对已暂存项且吞掉失败', async () => {
  const deleted = [];
  await cleanupStagedMedia(
    [
      { staged: true, localPath: 'output/a.png' },
      { staged: false, localPath: 'output/b.png' },
      { staged: true, localPath: '' },
    ],
    { deleteOutputFilesFromServer: (payload) => deleted.push(payload) },
  );
  assert.deepEqual(deleted, [{ localPaths: ['output/a.png'] }]);
  await cleanupStagedMedia([], { deleteOutputFilesFromServer: () => assert.fail('不应调用') });
  await cleanupStagedMedia([{ staged: true, localPath: 'output/c.png' }], {
    deleteOutputFilesFromServer: () => {
      throw new Error('cleanup failed');
    },
  });
});

test('downloadSaveService: 批量下载空列表抛错', async () => {
  await assert.rejects(() => saveMediaFilesDownload({ files: [] }, {}), /没有可保存的媒体文件/);
});

test('downloadSaveService: 批量下载走桌面桥并清理暂存', async () => {
  const calls = [],
    deleted = [],
    desktopBridge = {
      nodeExport: {
        canSaveMediaFiles: () => true,
        saveMediaFiles: (payload) => {
          calls.push(payload);
          return { success: true, count: 1 };
        },
      },
    };
  const result = await saveMediaFilesDownload(
    { title: 'B', files: [{ kind: 'image', localPath: 'data/assets/a.png', filename: 'a.png' }] },
    { desktopBridge, deleteOutputFilesFromServer: (payload) => deleted.push(payload) },
  );
  (assert.deepEqual(result, { success: true, count: 1 }),
    assert.deepEqual(calls, [
      {
        title: 'B',
        files: [
          { kind: 'image', localPath: 'data/assets/a.png', url: '/data/assets/a.png', filename: 'a.png' },
        ],
      },
    ]),
    assert.deepEqual(deleted, []));
});

test('downloadSaveService: 批量下载落浏览器路径时逐项触发', async () => {
  const { documentRef, clicks } = createAnchorDocument();
  const result = await saveMediaFilesDownload(
    { files: [{ url: 'https://x/a.png' }, { url: 'https://x/b.png' }] },
    { desktopBridge: null, documentRef },
  );
  (assert.deepEqual(result, { success: true, canceled: false, count: 2, mode: 'browser' }),
    assert.equal(clicks.length, 2));
});

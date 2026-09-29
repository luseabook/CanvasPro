import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWorkspaceVideoDownloadPayload,
  renderWorkspaceVideoDownloadButton,
  runWorkspaceVideoDownloadAction,
  saveWorkspaceVideoDownload,
} from './workspaceVideoDownload.js';
import {
  buildWorkspaceMediaDownloadPayload,
  runWorkspaceMediaDownloadAction,
} from './workspaceMediaDownload.js';

const REF = 'output/替换视频.mp4';

test('workspaceVideoDownload: payload 委派时固定 kind=video，标题/文件名缺省落到视频口径', () => {
  assert.deepEqual(buildWorkspaceVideoDownloadPayload({ videoRef: REF }), {
    kind: 'video',
    localPath: REF,
    url: '/output/替换视频.mp4',
    filename: '生成视频.mp4',
    title: '下载视频',
  });
});

test('workspaceVideoDownload: payload 与底层实现在同参时逐字相同', () => {
  const mine = buildWorkspaceVideoDownloadPayload({ videoRef: REF, filenameBase: '成片', title: 'T' });
  const base = buildWorkspaceMediaDownloadPayload({ kind: 'video', mediaRef: REF, filenameBase: '成片', title: 'T' });
  assert.deepEqual(mine, base);
  assert.equal(mine.filename, '成片.mp4');
  assert.equal(mine.title, 'T');
});

test('workspaceVideoDownload: 非法引用透传为 null，保存错误文案保持视频口径', async () => {
  assert.equal(buildWorkspaceVideoDownloadPayload({}), null);
  // 注意：底层不校验媒体类型，只校验本地路径前缀——图片路径照样按视频口径出载荷。
  const odd = buildWorkspaceVideoDownloadPayload({ videoRef: 'data/uploads/a.png' });
  assert.equal(odd.kind, 'video');
  assert.equal(odd.filename, '生成视频.png', '扩展名沿用引用自身的后缀');
  assert.equal(buildWorkspaceVideoDownloadPayload({ videoRef: 'bad/a.mp4' }), null);

  await assert.rejects(
    () => saveWorkspaceVideoDownload({ videoRef: undefined, saveMedia: async () => ({}) }),
    { message: '当前没有可下载的视频。' },
  );
  await assert.rejects(
    () => saveWorkspaceVideoDownload({ videoRef: 'bad/a.mp4', saveMedia: async () => ({}) }),
    { message: '视频尚未成功保存到本地，请重新生成后再下载。' },
  );
  await assert.rejects(
    () => saveWorkspaceVideoDownload({ videoRef: REF, saveMedia: null }),
    { message: '视频保存服务尚未初始化。' },
  );
});

test('workspaceVideoDownload: save 把载荷原样交给 saveMedia', async () => {
  const seen = [];
  const result = await saveWorkspaceVideoDownload({
    videoRef: REF,
    saveMedia: async (payload) => {
      seen.push(payload);
      return { ok: true };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(seen, [buildWorkspaceVideoDownloadPayload({ videoRef: REF })]);
});

test('workspaceVideoDownload: 按钮默认隐藏，启用后带替换视频类名、动作与标签', () => {
  assert.equal(renderWorkspaceVideoDownloadButton(), '');
  const html = renderWorkspaceVideoDownloadButton({ enabled: true });
  assert.ok(html.includes('class="workspace-image-download-button"'));
  assert.ok(html.includes('data-story-action="download-replacement-video"'));
  assert.ok(html.includes('aria-label="下载替换视频"'));
  assert.ok(html.includes('title="下载替换视频"'));
});

test('workspaceVideoDownload: run 动作具备与底层一致的防重入语义', async () => {
  assert.equal(typeof runWorkspaceVideoDownloadAction, 'function');
  assert.equal(typeof runWorkspaceMediaDownloadAction, 'function');
  assert.equal(await runWorkspaceVideoDownloadAction(null, async () => 'x'), null);

  const node = {
    disabled: false,
    classes: new Set(),
    classList: {
      contains: (name) => node.classes.has(name),
      add: (name) => node.classes.add(name),
      remove: (name) => node.classes.delete(name),
    },
    setAttribute() {},
    removeAttribute() {},
  };
  assert.equal(await runWorkspaceVideoDownloadAction(node, async () => 'done'), 'done');
  assert.equal(node.disabled, false);
});

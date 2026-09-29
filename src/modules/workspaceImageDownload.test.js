import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildWorkspaceImageDownloadPayload,
  renderWorkspaceImageDownloadButton,
  runWorkspaceImageDownloadAction,
  saveWorkspaceImageDownload,
} from './workspaceImageDownload.js';
import {
  buildWorkspaceMediaDownloadPayload,
  runWorkspaceMediaDownloadAction,
} from './workspaceMediaDownload.js';

const REF = 'data/uploads/生成图片.png';

test('workspaceImageDownload: payload 委派时固定 kind=image，标题/文件名缺省落到图片口径', () => {
  assert.deepEqual(buildWorkspaceImageDownloadPayload({ imageRef: REF }), {
    kind: 'image',
    localPath: REF,
    url: '/data/uploads/生成图片.png',
    filename: '生成图片.png',
    title: '下载图片',
  });
});

test('workspaceImageDownload: payload 与底层实现在同参时逐字相同', () => {
  const mine = buildWorkspaceImageDownloadPayload({ imageRef: REF, filenameBase: '海报', title: 'T' });
  const base = buildWorkspaceMediaDownloadPayload({ kind: 'image', mediaRef: REF, filenameBase: '海报', title: 'T' });
  assert.deepEqual(mine, base);
  assert.equal(mine.filename, '海报.png');
  assert.equal(mine.title, 'T');
});

test('workspaceImageDownload: 非法引用透传为 null，保存错误文案保持图片口径', async () => {
  assert.equal(buildWorkspaceImageDownloadPayload({}), null);
  assert.equal(buildWorkspaceImageDownloadPayload({ imageRef: 'bad/a.png' }), null);

  await assert.rejects(
    () => saveWorkspaceImageDownload({ imageRef: undefined, saveMedia: async () => ({}) }),
    { message: '当前没有可下载的图片。' },
  );
  await assert.rejects(
    () => saveWorkspaceImageDownload({ imageRef: 'bad/a.png', saveMedia: async () => ({}) }),
    { message: '图片尚未成功保存到本地，请重新生成后再下载。' },
  );
  await assert.rejects(
    () => saveWorkspaceImageDownload({ imageRef: REF, saveMedia: null }),
    { message: '图片保存服务尚未初始化。' },
  );
});

test('workspaceImageDownload: save 把载荷原样交给 saveMedia', async () => {
  const seen = [];
  const result = await saveWorkspaceImageDownload({
    imageRef: REF,
    saveMedia: async (payload) => {
      seen.push(payload);
      return { ok: true };
    },
  });
  assert.deepEqual(result, { ok: true });
  assert.deepEqual(seen, [buildWorkspaceImageDownloadPayload({ imageRef: REF })]);
});

test('workspaceImageDownload: 按钮默认隐藏，启用后带图片类名与动作', () => {
  assert.equal(renderWorkspaceImageDownloadButton(), '');
  assert.equal(renderWorkspaceImageDownloadButton({ enabled: false, label: '下载图片' }), '');
  const html = renderWorkspaceImageDownloadButton({ enabled: true, label: '下载图片', className: 'c1' });
  assert.ok(html.includes('class="workspace-image-download-button c1"'));
  assert.ok(html.includes('data-story-action="download-asset-image"'));
  assert.ok(html.includes('aria-label="下载图片"'));
});

test('workspaceImageDownload: run 动作原样转发底层实现', async () => {
  assert.equal(typeof runWorkspaceImageDownloadAction, 'function');
  assert.equal(typeof runWorkspaceMediaDownloadAction, 'function');
  assert.equal(await runWorkspaceImageDownloadAction(null, async () => 'x'), null);

  const node = {
    disabled: false,
    attributes: {},
    classes: new Set(),
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
    classList: {
      contains: (name) => node.classes.has(name),
      add: (name) => node.classes.add(name),
      remove: (name) => node.classes.delete(name),
    },
  };
  const result = await runWorkspaceImageDownloadAction(node, async () => 7);
  assert.equal(result, 7);
  assert.equal(node.disabled, false, '结束后恢复 disabled');
  assert.equal(node.attributes['aria-busy'], undefined);
  assert.equal(node.classes.has('is-pending'), false);
});

test('workspaceImageDownload: 处理中再次触发会被 is-pending 拦下', async () => {
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
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const pending = runWorkspaceImageDownloadAction(node, async () => {
    await gate;
    return 'done';
  });
  assert.equal(node.classes.has('is-pending'), true);
  assert.equal(await runWorkspaceImageDownloadAction(node, async () => 'second'), null);
  release();
  assert.equal(await pending, 'done');
});

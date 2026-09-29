import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWorkspaceMediaDownloadPayload,
  renderWorkspaceMediaDownloadButton,
  runWorkspaceMediaDownloadAction,
  saveWorkspaceMediaDownload,
} from './workspaceMediaDownload.js';

test('workspaceMediaDownload: 载荷只接受 image/video 与可用的本地路径', () => {
  assert.equal(buildWorkspaceMediaDownloadPayload({}), null);
  assert.equal(buildWorkspaceMediaDownloadPayload({ kind: 'image', mediaRef: '' }), null);
  assert.equal(
    buildWorkspaceMediaDownloadPayload({ kind: 'audio', mediaRef: 'data/uploads/a.mp3' }),
    null,
    '音频不在支持范围内',
  );
  assert.equal(
    buildWorkspaceMediaDownloadPayload({ kind: 'image', mediaRef: 'http://cdn/a.png' }),
    null,
    '非本地引用拒绝',
  );
  assert.equal(
    buildWorkspaceMediaDownloadPayload({ kind: 'image', mediaRef: '/etc/passwd' }),
    null,
    '越界绝对路径拒绝',
  );
});

test('workspaceMediaDownload: 图片与视频的默认文件名、标题与扩展名', () => {
  const image = buildWorkspaceMediaDownloadPayload({
    kind: 'image',
    mediaRef: 'data/uploads/a.webp',
  });
  assert.deepEqual(image, {
    kind: 'image',
    localPath: 'data/uploads/a.webp',
    url: '/data/uploads/a.webp',
    filename: '生成图片.webp',
    title: '下载图片',
  });

  const video = buildWorkspaceMediaDownloadPayload({
    kind: 'video',
    mediaRef: 'data/uploads/clip',
    filenameBase: '镜头一',
    title: '下载这段',
  });
  assert.equal(video.filename, '镜头一.mp4', '没有扩展名时用视频默认扩展');
  assert.equal(video.title, '下载这段');

  const noExtension = buildWorkspaceMediaDownloadPayload({
    kind: 'image',
    mediaRef: 'data/uploads/noext',
  });
  assert.equal(noExtension.filename, '生成图片.png');

  const withQuery = buildWorkspaceMediaDownloadPayload({
    kind: 'image',
    mediaRef: 'data/uploads/a.jpeg',
  });
  assert.equal(withQuery.filename, '生成图片.jpeg');
});

test('workspaceMediaDownload: 文件名会被清洗并限长', () => {
  const payload = buildWorkspaceMediaDownloadPayload({
    kind: 'image',
    mediaRef: 'data/uploads/a.png',
    filenameBase: 'a/b:c*?"<>|d   ...',
  });
  assert.equal(payload.filename, 'a-b-c-d.png');
  const longName = buildWorkspaceMediaDownloadPayload({
    kind: 'image',
    mediaRef: 'data/uploads/a.png',
    filenameBase: 'x'.repeat(200),
  });
  assert.equal(longName.filename.length, 0x60 + '.png'.length);
  const blankName = buildWorkspaceMediaDownloadPayload({
    kind: 'video',
    mediaRef: 'data/uploads/a.mp4',
    filenameBase: '   ',
  });
  assert.equal(blankName.filename, '生成视频.mp4', '空白名回落默认');
});

test('workspaceMediaDownload: 保存失败按原因给不同提示', async () => {
  await assert.rejects(() => saveWorkspaceMediaDownload({ kind: 'image', mediaRef: '' }), {
    message: '当前没有可下载的图片。',
  });
  await assert.rejects(() => saveWorkspaceMediaDownload({ kind: 'video', mediaRef: '' }), {
    message: '当前没有可下载的视频。',
  });
  await assert.rejects(
    () => saveWorkspaceMediaDownload({ kind: 'image', mediaRef: 'http://cdn/a.png' }),
    { message: '图片尚未成功保存到本地，请重新生成后再下载。' },
  );
  await assert.rejects(
    () => saveWorkspaceMediaDownload({ kind: 'image', mediaRef: 'data/uploads/a.png', saveMedia: null }),
    { message: '图片保存服务尚未初始化。' },
  );
});

test('workspaceMediaDownload: 保存服务收到的就是构建好的载荷', async () => {
  const seen = [];
  const result = await saveWorkspaceMediaDownload({
    kind: 'video',
    mediaRef: 'data/uploads/a.mp4',
    filenameBase: '镜头二',
    title: '下载镜头二',
    saveMedia: async (payload) => {
      seen.push(payload);
      return { saved: true, path: payload.localPath };
    },
  });
  assert.deepEqual(result, { saved: true, path: 'data/uploads/a.mp4' });
  assert.deepEqual(seen, [
    {
      kind: 'video',
      localPath: 'data/uploads/a.mp4',
      url: '/data/uploads/a.mp4',
      filename: '镜头二.mp4',
      title: '下载镜头二',
    },
  ]);
});

test('workspaceMediaDownload: 不可用时不渲染按钮，可用时转义属性', () => {
  assert.equal(renderWorkspaceMediaDownloadButton({ action: 'download-media', enabled: false }), '');
  assert.equal(renderWorkspaceMediaDownloadButton({ action: '', enabled: false }), '');
  const html = renderWorkspaceMediaDownloadButton({
    action: 'download-media',
    enabled: true,
    label: '下载"媒体"',
    className: 'x" onmouseover="evil',
  });
  assert.ok(html.startsWith('<button type="button" class="workspace-image-download-button '));
  assert.ok(html.includes('data-story-action="download-media"'));
  assert.ok(html.includes('aria-label="下载&quot;媒体&quot;"'));
  assert.ok(!html.includes('onmouseover="evil"'), '类名里的引号必须被转义');
  assert.ok(html.includes('&quot; onmouseover=&quot;evil'));
  const plain = renderWorkspaceMediaDownloadButton({ action: 'a', enabled: true });
  assert.ok(plain.includes('下载媒体'), '默认文案');
});

function createButton(options = {}) {
  const classes = new Set(options.classes || []);
  return {
    disabled: options.disabled === true,
    attributes: options.ariaBusy === undefined ? {} : { 'aria-busy': options.ariaBusy },
    classList: {
      contains: (name) => classes.has(name),
      add: (name) => classes.add(name),
      remove: (name) => classes.delete(name),
      has: (name) => classes.has(name),
    },
    getAttribute(name) {
      return Object.hasOwn(this.attributes, name) ? this.attributes[name] : null;
    },
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    removeAttribute(name) {
      delete this.attributes[name];
    },
  };
}

test('workspaceMediaDownload: 下载动作期间锁按钮，结束后恢复原状态', async () => {
  const button = createButton();
  const result = await runWorkspaceMediaDownloadAction(button, async () => 'done');
  assert.equal(result, 'done');
  assert.equal(button.disabled, false);
  assert.equal(button.classList.has('is-pending'), false);
  assert.equal(button.getAttribute('aria-busy'), null, '原本没有 aria-busy 就删掉');

  const busy = createButton({ disabled: true, ariaBusy: 'false' });
  let observed = null;
  await runWorkspaceMediaDownloadAction(busy, async () => {
    observed = { disabled: busy.disabled, pending: busy.classList.has('is-pending'), aria: busy.getAttribute('aria-busy') };
  });
  assert.deepEqual(observed, { disabled: true, pending: true, aria: 'true' });
  assert.equal(busy.disabled, true, '恢复原来的 disabled');
  assert.equal(busy.getAttribute('aria-busy'), 'false', '恢复原来的 aria-busy');
});

test('workspaceMediaDownload: 进行中或参数不合法时不重复触发', async () => {
  let calls = 0;
  const pending = createButton({ classes: ['is-pending'] });
  assert.equal(await runWorkspaceMediaDownloadAction(pending, async () => (calls += 1)), null);
  assert.equal(calls, 0);
  assert.equal(await runWorkspaceMediaDownloadAction(null, async () => {}), null);
  assert.equal(await runWorkspaceMediaDownloadAction(createButton(), null), null);

  const button = createButton();
  await assert.rejects(
    () =>
      runWorkspaceMediaDownloadAction(button, async () => {
        throw new Error('下载失败');
      }),
    { message: '下载失败' },
  );
  assert.equal(button.disabled, false, '抛错也要解锁');
  assert.equal(button.classList.has('is-pending'), false);
});

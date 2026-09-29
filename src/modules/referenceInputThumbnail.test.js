import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createReferenceInputThumbnailHtml,
  resolveReferenceVideoItemByEdge,
  resolveReferenceVideoMediaSignature,
  resolveReferenceVideoSourcePath,
  resolveReferenceVideoThumbnail,
} from './referenceInputThumbnail.js';

test('referenceInputThumbnail: 没有视频列表时返回空选择', () => {
  assert.deepEqual(resolveReferenceVideoItemByEdge({}, null), { item: null, index: -1, matchedByKey: false });
  assert.deepEqual(resolveReferenceVideoItemByEdge({ videos: [] }), { item: null, index: -1, matchedByKey: false });
});

test('referenceInputThumbnail: 有 sourceMediaKey 时按媒体键匹配，并忽略前导斜杠差异', () => {
  const node = {
    videos: [
      { localPath: 'data/uploads/a.mp4' },
      { localPath: '/data/uploads/b.mp4' },
      { displayLocalPath: 'data/uploads/b.mp4' },
    ],
  };
  const matched = resolveReferenceVideoItemByEdge(node, { sourceMediaKey: 'data/uploads/b.mp4' });
  assert.equal(matched.index, 1);
  assert.equal(matched.matchedByKey, true);
  assert.equal(matched.item.localPath, '/data/uploads/b.mp4');

  const arrays = resolveReferenceVideoItemByEdge(node, { sourceMediaKey: 'data/uploads/a.mp4' });
  assert.equal(arrays.index, 0);
  assert.equal(arrays.matchedByKey, true);
});

test('referenceInputThumbnail: 匹配不到或没有键时按 mainVideoIndex 取，越界会夹回边界', () => {
  const node = { videos: [{ localPath: 'x' }, { localPath: 'y' }], mainVideoIndex: 9 };
  const clamped = resolveReferenceVideoItemByEdge(node, null);
  assert.equal(clamped.index, 1);
  assert.equal(clamped.matchedByKey, false);

  assert.equal(resolveReferenceVideoItemByEdge({ videos: [{ localPath: 'x' }] }, {}).index, 0);
  assert.equal(resolveReferenceVideoItemByEdge({ videos: [{ localPath: 'x' }], mainVideoIndex: -4 }).index, 0);
  assert.equal(
    resolveReferenceVideoItemByEdge({ videos: [{ localPath: 'x' }] }, { sourceMediaKey: 'other.mp4' }).matchedByKey,
    false,
  );
});

test('referenceInputThumbnail: 缩略图优先取选中项自己的字段', () => {
  const result = resolveReferenceVideoThumbnail({ videos: [{ thumbUrl: 'http://x/t.png' }] });
  assert.equal(result.thumbUrl, 'http://x/t.png');
  assert.equal(result.selected.index, 0);

  const firstFrame = resolveReferenceVideoThumbnail({ videos: [{ firstFrameUrl: 'http://x/f.png' }] });
  assert.equal(firstFrame.thumbUrl, 'http://x/f.png');

  const nestedImage = resolveReferenceVideoThumbnail({ videos: [{ imageUrl: 'http://x/i.png' }] });
  assert.equal(nestedImage.thumbUrl, 'http://x/i.png');
});

test('referenceInputThumbnail: 选中项没有缩略图时回退到 mainVideoIndex 那一项', () => {
  const node = {
    videos: [{ thumbUrl: 'http://x/0.png' }, { firstFrameThumbUrl: 'http://x/1.png' }],
    mainVideoIndex: 1,
  };
  const result = resolveReferenceVideoThumbnail(node);
  assert.equal(result.thumbUrl, 'http://x/1.png');
  assert.equal(result.selected.index, 1);
});

test('referenceInputThumbnail: 顶层缩略图只在索引一致时才顶替，键命中别处时不冒充', () => {
  const aligned = resolveReferenceVideoThumbnail({ videos: [{}], thumbUrl: 'http://x/top.png' });
  assert.equal(aligned.thumbUrl, 'http://x/top.png');
  assert.equal(aligned.selected.index, 0);

  const mismatched = resolveReferenceVideoThumbnail(
    { videos: [{ thumbUrl: 'http://x/0.png' }, { localPath: 'data/uploads/k.mp4' }], mainVideoIndex: 0 },
    { sourceMediaKey: 'data/uploads/k.mp4' },
  );
  assert.equal(mismatched.selected.index, 1);
  assert.equal(mismatched.selected.matchedByKey, true);
  assert.equal(mismatched.thumbUrl, '', '键命中的是第 1 项，第 0 项和顶层的缩略图都不该拿来用');

  assert.equal(resolveReferenceVideoThumbnail({ videos: [{}] }).thumbUrl, '');
});

test('referenceInputThumbnail: 源路径在 ai-video 下取视频项，其它类型下顶层字段优先', () => {
  const node = { localPath: 'data/uploads/v.mp4', videos: [{ localPath: 'data/uploads/i.mp4' }] };
  assert.equal(resolveReferenceVideoSourcePath(node), '/data/uploads/v.mp4');
  assert.equal(resolveReferenceVideoSourcePath({ ...node, type: 'ai-video' }), '/data/uploads/i.mp4');
  assert.equal(resolveReferenceVideoSourcePath({}), '');
});

test('referenceInputThumbnail: 媒体签名取归一后的键，找不到时返回空串', () => {
  assert.equal(resolveReferenceVideoMediaSignature({ videos: [{ localPath: '/data/uploads/v.mp4' }] }), 'data/uploads/v.mp4');
  assert.equal(resolveReferenceVideoMediaSignature({ videoUrl: '/cdn/x.mp4' }), 'cdn/x.mp4');
  assert.equal(resolveReferenceVideoMediaSignature({}), '');
});

test('referenceInputThumbnail: 缩略图 HTML 对未知种类返回空串', () => {
  assert.equal(createReferenceInputThumbnailHtml({ kind: 'x' }), '');
  assert.equal(createReferenceInputThumbnailHtml(), '');
  assert.equal(createReferenceInputThumbnailHtml({ kind: 'document' }), '');
});

test('referenceInputThumbnail: 文本与音频走文字兜底块', () => {
  const audio = createReferenceInputThumbnailHtml({ kind: 'audio' });
  assert.equal(audio.includes('ref-input-thumbnail--audio'), true);
  assert.equal(audio.includes('ref-thumb-fallback-audio'), true);
  assert.equal(audio.includes('>AUDIO<'), true);

  const text = createReferenceInputThumbnailHtml({ kind: 'text' });
  assert.equal(text.includes('>TEXT<'), true);
});

test('referenceInputThumbnail: 图片与视频没有缩略图时出图标兜底块', () => {
  const image = createReferenceInputThumbnailHtml({ kind: 'image' });
  assert.equal(image.includes('ref-input-thumbnail--fallback'), true);
  assert.equal(image.includes('<path d="M5 17l4-4'), true);

  const video = createReferenceInputThumbnailHtml({ kind: 'video' });
  assert.equal(video.includes('<polygon points="8,6 19,12 8,18">'), true);
});

test('referenceInputThumbnail: 视频没有缩略图但有地址时直接出 video 标签', () => {
  const html = createReferenceInputThumbnailHtml({ kind: 'video', videoUrl: 'data/uploads/v.mp4' });
  assert.equal(html.startsWith('<video src="data/uploads/v.mp4"'), true);
  assert.equal(html.includes('preload="metadata"'), true);
  assert.equal(html.includes('ref-input-thumbnail--video'), true);
});

test('referenceInputThumbnail: 有缩略图时出 img 标签并标记待加载', () => {
  const html = createReferenceInputThumbnailHtml({ kind: 'image', thumbnailUrl: 'http://x/a.png' });
  assert.equal(html.startsWith('<img src="http://x/a.png"'), true);
  assert.equal(html.includes('is-pending'), true);
  assert.equal(html.includes('alt=""'), true);
});

test('referenceInputThumbnail: 附加类名会被过滤，地址会被转义，额外 HTML 原样拼在后面', () => {
  const html = createReferenceInputThumbnailHtml({
    kind: 'image',
    thumbnailUrl: 'http://x/"q".png',
    additionalClassName: 'a b!c',
    extraHtml: '<i></i>',
  });
  assert.equal(html.includes('&quot;q&quot;'), true);
  assert.equal(html.includes('ref-input-thumbnail--image a bc'), true);
  assert.equal(html.endsWith('<i></i>'), true);
});

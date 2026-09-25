import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_CLIP_FRAME_MENTION_PREFIX,
  STORY_CLIP_MEDIA_TYPE_IMAGE,
  STORY_CLIP_MEDIA_TYPE_VIDEO,
  buildStoryClipFrameId,
  buildStoryClipFrameMentionCandidates,
  buildStoryClipFrameMentionId,
  createStoryClipFrameHoverAsset,
  createStoryClipFrameRecord,
  createStoryClipVideoRecord,
  formatStoryClipFrameTime,
  getStoryClipFrameIdFromMentionId,
  getStoryClipFrameMediaType,
  normalizeStoryClipFrame,
  normalizeStoryClipFrames,
  removeStoryClipFrame,
  resolveStoryClipFrameImageUrl,
  resolveStoryClipFrameMediaUrl,
  resolveStoryClipFrameMentionRef,
  upsertStoryClipFrame,
} from './storyClipFrames.js';

// 本地路径转 URL 走本仓 src/utils/localMediaPath.js：安全的相对路径得到「/路径」，绝对路径和远程地址得到空串。
// 帧 id 里的哈希是 32 位 FNV-1a 转 36 进制，这里独立实现一份用来对照
function fnv1a36(text) {
  let hash = 0x811c9dc5;
  for (const char of text) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x1000193);
  }
  return (hash >>> 0).toString(36);
}

// 帧记录的最小构造；覆盖项写成 'k' in over ? over.k : 默认值
function frame(over = {}) {
  return {
    id: 'id' in over ? over.id : 'f1',
    clipId: 'clipId' in over ? over.clipId : 'c1',
    clipTitle: 'clipTitle' in over ? over.clipTitle : '开场',
    episodeId: 'episodeId' in over ? over.episodeId : 'e1',
    episodeTitle: 'episodeTitle' in over ? over.episodeTitle : '第一集',
    mediaType: 'mediaType' in over ? over.mediaType : 'image',
    currentTimeSec: 'currentTimeSec' in over ? over.currentTimeSec : 1,
    endTimeSec: 'endTimeSec' in over ? over.endTimeSec : undefined,
    localPath: 'localPath' in over ? over.localPath : 'output/f1.png',
    thumbLocalPath: 'thumbLocalPath' in over ? over.thumbLocalPath : undefined,
    createdAt: 'createdAt' in over ? over.createdAt : 1,
  };
}

test('常量：提及前缀与两种媒体类型', () => {
  assert.equal(STORY_CLIP_FRAME_MENTION_PREFIX, 'story-clip-frame:');
  assert.equal(STORY_CLIP_MEDIA_TYPE_IMAGE, 'image');
  assert.equal(STORY_CLIP_MEDIA_TYPE_VIDEO, 'video');
});

test('formatStoryClipFrameTime：分:秒.十分之一秒，非法值按 0；四舍五入可能得到 60.0 秒（冻结行为）', () => {
  assert.equal(formatStoryClipFrameTime(0), '00:00.0');
  assert.equal(formatStoryClipFrameTime(65.25), '01:05.3');
  assert.equal(formatStoryClipFrameTime(3600), '60:00.0');
  assert.equal(formatStoryClipFrameTime(-1), '00:00.0');
  assert.equal(formatStoryClipFrameTime('abc'), '00:00.0');
  assert.equal(formatStoryClipFrameTime(59.96), '00:60.0');
});

test('buildStoryClipFrameId：片段 id、结果序号、来源键做哈希，再接毫秒时间', () => {
  const id = buildStoryClipFrameId({
    clipId: 'c1',
    videoResultIndex: 0,
    sourceKey: 'k',
    currentTimeSec: 1.5,
  });
  assert.equal(id, 'story-frame-' + fnv1a36('c1:0:k') + '-1500');
  // 各字段先规范化：trim、序号取整、时间转数字
  assert.equal(
    buildStoryClipFrameId({
      clipId: ' c1 ',
      videoResultIndex: '0.9',
      sourceKey: ' k ',
      currentTimeSec: '1.5',
    }),
    id,
  );
  assert.equal(buildStoryClipFrameId(), 'story-frame-' + fnv1a36('clip:0:') + '-0');
  assert.equal(
    buildStoryClipFrameId({ clipId: 'c1', videoResultIndex: -3, sourceKey: 'k2', currentTimeSec: -1 }),
    'story-frame-' + fnv1a36('c1:0:k2') + '-0',
  );
});

test('buildStoryClipFrameMentionId / getStoryClipFrameIdFromMentionId：前缀加 URI 编码，可还原', () => {
  const mention = buildStoryClipFrameMentionId(' a b/中 ');
  assert.equal(mention, 'story-clip-frame:a%20b%2F%E4%B8%AD');
  assert.equal(getStoryClipFrameIdFromMentionId(mention), 'a b/中');
  assert.equal(getStoryClipFrameIdFromMentionId('  story-clip-frame:x%20y  '), 'x y');
  assert.equal(buildStoryClipFrameMentionId(''), '');
  assert.equal(getStoryClipFrameIdFromMentionId('asset:x'), '');
  assert.equal(getStoryClipFrameIdFromMentionId('story-clip-frame:%E4%'), '');
});

test('getStoryClipFrameMediaType：mediaType 优先、type 兜底，只有 video 算视频', () => {
  assert.equal(getStoryClipFrameMediaType({ mediaType: ' VIDEO ' }), 'video');
  assert.equal(getStoryClipFrameMediaType({ type: 'video' }), 'video');
  assert.equal(getStoryClipFrameMediaType({ mediaType: 'image', type: 'video' }), 'image');
  assert.equal(getStoryClipFrameMediaType({ mediaType: 'audio' }), 'image');
  assert.equal(getStoryClipFrameMediaType(), 'image');
});

test('resolveStoryClipFrameImageUrl：图片先看 imageUrl，再看各本地路径；视频只看缩略图', () => {
  assert.equal(
    resolveStoryClipFrameImageUrl({ imageUrl: ' https://x/a.png ', localPath: 'output/a.png' }),
    'https://x/a.png',
  );
  assert.equal(
    resolveStoryClipFrameImageUrl({ displayLocalPath: 'output/d.png', localPath: 'output/l.png' }),
    '/output/d.png',
  );
  assert.equal(
    resolveStoryClipFrameImageUrl({ localPath: 'C:/abs/a.png', originalLocalPath: 'output/o.png' }),
    '/output/o.png',
  );
  assert.equal(resolveStoryClipFrameImageUrl({ thumbLocalPath: 'data/assets/t.png' }), '/data/assets/t.png');
  assert.equal(resolveStoryClipFrameImageUrl({}), '');
  const video = { mediaType: 'video', imageUrl: 'https://x/ignored.png', localPath: 'output/v.mp4' };
  assert.equal(resolveStoryClipFrameImageUrl(video), '');
  assert.equal(resolveStoryClipFrameImageUrl({ ...video, posterLocalPath: 'output/p.png' }), '/output/p.png');
  assert.equal(
    resolveStoryClipFrameImageUrl({
      ...video,
      thumbnailUrl: 'https://x/t.jpg',
      posterLocalPath: 'output/p.png',
    }),
    'https://x/t.jpg',
  );
});

test('resolveStoryClipFrameMediaUrl：视频依次取 videoUrl、各本地路径、sourceUrl；图片同图片地址', () => {
  assert.equal(
    resolveStoryClipFrameMediaUrl({
      mediaType: 'video',
      videoUrl: '',
      localPath: 'output/v.mp4',
      sourceUrl: 'https://x/s.mp4',
    }),
    '/output/v.mp4',
  );
  assert.equal(
    resolveStoryClipFrameMediaUrl({ mediaType: 'video', sourceUrl: ' https://x/s.mp4 ' }),
    'https://x/s.mp4',
  );
  assert.equal(resolveStoryClipFrameMediaUrl({ localPath: 'output/a.png' }), '/output/a.png');
});

test('normalizeStoryClipFrame：补 id 与名称、规范各字段，保留其余字段', () => {
  const normalized = normalizeStoryClipFrame(
    {
      currentTimeSec: 2,
      localPath: ' output/f.png ',
      width: '640.9',
      originalHeight: 360,
      extra: 1,
      createdAt: -5,
    },
    3,
  );
  assert.equal(normalized.id, buildStoryClipFrameId({ clipId: 'clip-4', currentTimeSec: 2 }));
  assert.equal(normalized.name, '片段 · 00:02.0');
  assert.equal(normalized.mediaType, 'image');
  assert.equal(normalized.clipId, '');
  assert.equal(normalized.clipTitle, '片段');
  assert.equal(normalized.endTimeSec, 2);
  assert.equal(normalized.localPath, 'output/f.png');
  assert.equal(normalized.imageUrl, '/output/f.png');
  assert.equal(normalized.videoUrl, '');
  assert.equal(normalized.width, 640);
  assert.equal(normalized.height, 360);
  assert.equal(normalized.createdAt, 0);
  assert.equal(normalized.extra, 1);
});

test('normalizeStoryClipFrame：视频的结束时间不早于开始，名称带时间段；传入的 imageUrl 会被缩略图地址覆盖', () => {
  const video = normalizeStoryClipFrame({
    id: ' v1 ',
    mediaType: 'VIDEO',
    clipTitle: '开场',
    currentTimeSec: 1,
    endTimeSec: 0.5,
    localPath: 'output/v.mp4',
    imageUrl: 'https://x/i.png',
    posterLocalPath: 'output/p.png',
  });
  assert.equal(video.id, 'v1');
  assert.equal(video.mediaType, 'video');
  assert.equal(video.endTimeSec, 1);
  assert.equal(video.name, '开场 · 00:01.0–00:01.0');
  assert.equal(video.imageUrl, '/output/p.png');
  assert.equal(video.videoUrl, '/output/v.mp4');
  assert.equal(normalizeStoryClipFrame({ name: '  自定义  ', localPath: 'output/a.png' }).name, '自定义');
});

test('normalizeStoryClipFrames：非数组为空；丢掉没有媒体地址的帧；同 id 保留首次位置、用最后一次的内容', () => {
  assert.deepEqual(normalizeStoryClipFrames('x'), []);
  const list = normalizeStoryClipFrames([
    frame({ id: 'a', localPath: 'output/a1.png' }),
    frame({ id: 'b', localPath: '' }),
    frame({ id: 'c', localPath: 'output/c.png' }),
    frame({ id: 'a', localPath: 'output/a2.png' }),
  ]);
  assert.deepEqual(
    list.map((item) => [item.id, item.localPath]),
    [
      ['a', 'output/a2.png'],
      ['c', 'output/c.png'],
    ],
  );
});

test('createStoryClipFrameRecord：由保存结果生成图片帧记录', (t) => {
  t.mock.method(Date, 'now', () => 42);
  const record = createStoryClipFrameRecord({
    saved: {
      src: '/output/shot.png',
      localPath: 'output/shot.png',
      filename: 'shot.png',
      originalWidth: 1920,
      height: 1080,
    },
    episode: { id: 'e1', title: '第一集' },
    clip: { id: 'c1', title: '开场' },
    videoResultIndex: 1,
    currentTimeSec: 3.25,
    sourceUrl: 'https://x/v.mp4',
  });
  assert.equal(
    record.id,
    buildStoryClipFrameId({
      clipId: 'c1',
      videoResultIndex: 1,
      sourceKey: 'https://x/v.mp4',
      currentTimeSec: 3.25,
    }),
  );
  assert.equal(record.mediaType, 'image');
  assert.equal(record.name, '开场 · 00:03.3');
  assert.equal(record.imageUrl, '/output/shot.png');
  assert.equal(record.fileName, 'shot.png');
  assert.equal(record.width, 1920);
  assert.equal(record.height, 1080);
  assert.equal(record.episodeTitle, '第一集');
  assert.equal(record.sourceKey, '');
  assert.equal(record.sourceUrl, 'https://x/v.mp4');
  assert.equal(record.createdAt, 42);
});

test('createStoryClipVideoRecord：id 带「-video-结束毫秒」，时长缺省为结束减开始', () => {
  const record = createStoryClipVideoRecord({
    saved: {
      localPath: 'output/cut.mp4',
      fps: 24,
      videoWidth: 1280,
      videoHeight: 720,
      thumbLocalPath: 'output/cut.png',
    },
    episode: { id: 'e1' },
    clip: { id: 'c1', title: '开场' },
    startTimeSec: 1,
    endTimeSec: 3.5,
    sourceKey: 'src',
    createdAt: 5,
  });
  assert.equal(
    record.id,
    buildStoryClipFrameId({ clipId: 'c1', sourceKey: 'src', currentTimeSec: 1 }) + '-video-3500',
  );
  assert.equal(record.mediaType, 'video');
  assert.equal(record.name, '开场 · 00:01.0–00:03.5');
  assert.equal(record.videoUrl, '/output/cut.mp4');
  assert.equal(record.originalLocalPath, 'output/cut.mp4');
  assert.equal(record.imageUrl, '/output/cut.png');
  assert.equal(record.width, 1280);
  assert.equal(record.videoFps, 24);
  assert.equal(record.videoDuration, 2.5);
  const reversed = createStoryClipVideoRecord({
    saved: { videoUrl: 'https://x/c.mp4', videoDuration: 9 },
    startTimeSec: 4,
    endTimeSec: 2,
    createdAt: 1,
  });
  assert.equal(reversed.endTimeSec, 4);
  assert.equal(reversed.videoDuration, 9);
  assert.match(reversed.id, /-4000-video-4000$/);
});

test('upsertStoryClipFrame：同 id 替换，按 createdAt 从新到旧排；新帧无媒体地址时原样规范化返回', () => {
  const list = [frame({ id: 'a', createdAt: 1 }), frame({ id: 'b', createdAt: 3 })];
  const next = upsertStoryClipFrame(list, frame({ id: 'a', createdAt: 5, localPath: 'output/a-new.png' }));
  assert.deepEqual(
    next.map((item) => [item.id, item.localPath]),
    [
      ['a', 'output/a-new.png'],
      ['b', 'output/f1.png'],
    ],
  );
  const unchanged = upsertStoryClipFrame(list, frame({ id: 'z', localPath: '' }));
  assert.deepEqual(
    unchanged.map((item) => item.id),
    ['a', 'b'],
  );
  assert.equal(list.length, 2);
});

test('removeStoryClipFrame：按 trim 后的 id 删除，空 id 只做规范化', () => {
  const list = [frame({ id: 'a' }), frame({ id: 'b' })];
  assert.deepEqual(
    removeStoryClipFrame(list, ' a ').map((item) => item.id),
    ['b'],
  );
  assert.deepEqual(
    removeStoryClipFrame(list, '').map((item) => item.id),
    ['a', 'b'],
  );
});

test('createStoryClipFrameHoverAsset：有预览图才返回悬停素材，视频帧没有缩略图时为 null', () => {
  assert.deepEqual(createStoryClipFrameHoverAsset(frame({ id: 'a b' })), {
    id: 'story-clip-frame:a%20b',
    kind: 'clip-frame',
    name: '片段帧',
    hoverTitle: '开场 · 00:01.0',
    imageUrl: '/output/f1.png',
    isLibraryAsset: true,
  });
  const videoFrame = frame({ id: 'v', mediaType: 'video', localPath: 'output/v.mp4', endTimeSec: 2 });
  assert.equal(createStoryClipFrameHoverAsset(videoFrame), null);
  const withThumb = createStoryClipFrameHoverAsset(
    { ...videoFrame, thumbLocalPath: 'output/v.png' },
    ' custom-id ',
  );
  assert.equal(withThumb.id, 'custom-id');
  assert.equal(withThumb.name, '视频片段');
  assert.equal(withThumb.imageUrl, '/output/v.png');
});

test('buildStoryClipFrameMentionCandidates：没有帧时给出占位项，查询不相关时返回空', () => {
  const [placeholder] = buildStoryClipFrameMentionCandidates([]);
  assert.equal(placeholder.assetId, 'story-clip-frame:empty');
  assert.equal(placeholder.label, '暂无片段帧');
  assert.equal(placeholder.limitReason, '请先在片段视频预览中截取当前帧。');
  assert.equal(buildStoryClipFrameMentionCandidates([], { query: '@截帧' }).length, 1);
  assert.deepEqual(buildStoryClipFrameMentionCandidates([], { query: 'xyz' }), []);
});

test('buildStoryClipFrameMentionCandidates：按片段分组，每组一个候选，其余帧放进 mentionVariants', () => {
  const frames = [
    frame({ id: 'a1', clipId: 'c2', currentTimeSec: 1 }),
    frame({ id: 'b1', clipId: 'c1', currentTimeSec: 2 }),
    frame({
      id: 'a2',
      clipId: 'c2',
      currentTimeSec: 5,
      mediaType: 'video',
      localPath: 'output/a2.mp4',
      endTimeSec: 7,
    }),
    frame({ id: 'x1', clipId: '', clipTitle: '游离', currentTimeSec: 3 }),
  ];
  const clips = [{ id: 'c1', title: '第一幕' }, { id: 'c2', title: '第二幕' }, { id: '' }];
  const candidates = buildStoryClipFrameMentionCandidates(frames, { clips });
  assert.deepEqual(
    candidates.map((item) => [
      item.label,
      item.storyClipFrameId,
      item.mentionVariants.length,
      item.mentionVariantIndex,
    ]),
    [
      ['片段01', 'b1', 1, 0],
      ['片段02', 'a1', 2, 0],
      ['片段03', 'x1', 1, 0],
    ],
  );
  const second = candidates[1];
  assert.equal(second.assetId, 'story-clip-frame:a1');
  assert.equal(second.subtitle, '第二幕 · 00:01.0');
  assert.equal(second.pillLabel, '片段02 · 00:01.0');
  assert.equal(second.mentionVariants[1].type, 'video');
  assert.equal(second.mentionVariants[1].subtitle, '第二幕 · 00:05.0–00:07.0');
  assert.equal(second.mentionVariants[1].thumbUrl, '');
  assert.equal(candidates[2].subtitle, '游离 · 00:03.0');
});

test('buildStoryClipFrameMentionCandidates：按分集和片段过滤，查询命中组内某一帧时以它为候选', () => {
  const frames = [
    frame({ id: 'keep', clipId: 'c1', currentTimeSec: 1 }),
    frame({ id: 'match', clipId: 'c1', currentTimeSec: 65 }),
    frame({ id: 'other-episode', episodeId: 'e2', clipId: 'c1' }),
    frame({ id: 'other-clip', clipId: 'c9' }),
    frame({ id: 'no-episode', episodeId: '', clipId: 'c1', currentTimeSec: 9 }),
  ];
  const [candidate] = buildStoryClipFrameMentionCandidates(frames, {
    clips: [{ id: 'c1', title: '第一幕' }],
    episodeId: 'e1',
    query: '@01:05',
  });
  assert.equal(candidate.storyClipFrameId, 'match');
  assert.equal(candidate.mentionVariantIndex, 1);
  assert.deepEqual(
    candidate.mentionVariants.map((item) => item.storyClipFrameId),
    ['keep', 'match', 'no-episode'],
  );
  assert.deepEqual(buildStoryClipFrameMentionCandidates(frames, { clips: [{ id: 'c1' }], query: 'zzz' }), []);
  // 被搜索的字段里固定带「片段帧」，所以查「片段」会命中每一组
  assert.equal(buildStoryClipFrameMentionCandidates(frames, { query: '片段' }).length, 2);
});

test('resolveStoryClipFrameMentionRef：从元素的 asset id 找到帧，给出图片或视频节点数据', () => {
  const frames = [
    frame({ id: 'img', localPath: 'output/img.png' }),
    frame({
      id: 'vid',
      mediaType: 'video',
      localPath: 'output/v.mp4',
      thumbLocalPath: 'output/v.png',
      currentTimeSec: 2,
      endTimeSec: 5,
    }),
  ];
  const image = resolveStoryClipFrameMentionRef({ dataset: { assetId: 'story-clip-frame:img' } }, frames);
  assert.equal(image.type, 'image');
  assert.equal(image.url, '/output/img.png');
  assert.equal(image.thumbUrl, '/output/img.png');
  assert.deepEqual(image.nodeData, {
    type: 'source-image',
    name: '开场 · 00:01.0',
    imageUrl: '/output/img.png',
    localPath: 'output/img.png',
    originalLocalPath: '',
    displayLocalPath: '',
    thumbLocalPath: '',
  });
  const video = resolveStoryClipFrameMentionRef(
    { getAttribute: (name) => (name === 'data-asset-id' ? 'story-clip-frame:vid' : null) },
    frames,
  );
  assert.equal(video.type, 'video');
  assert.equal(video.assetId, 'story-clip-frame:vid');
  assert.equal(video.thumbUrl, '/output/v.png');
  assert.equal(video.nodeData.type, 'source-video');
  assert.equal(video.nodeData.src, '/output/v.mp4');
  assert.equal(video.nodeData.videoDuration, 3);
  assert.equal(video.nodeData.videoFps, 0);
  assert.equal(
    resolveStoryClipFrameMentionRef({ dataset: { assetId: 'story-clip-frame:none' } }, frames),
    null,
  );
  assert.equal(resolveStoryClipFrameMentionRef({ dataset: { assetId: 'asset:img' } }, frames), null);
  assert.equal(resolveStoryClipFrameMentionRef(null, frames), null);
});

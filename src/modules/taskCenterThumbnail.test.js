import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTaskCenterThumbnail } from './taskCenterThumbnail.js';

test('taskCenterThumbnail: 非对象输入返回 null', () => {
  assert.equal(resolveTaskCenterThumbnail(null), null);
  assert.equal(resolveTaskCenterThumbnail(undefined), null);
  assert.equal(resolveTaskCenterThumbnail('nope'), null);
  assert.equal(resolveTaskCenterThumbnail(42), null);
});

test('taskCenterThumbnail: 图片结果取缩略图并报 image 与数量', () => {
  const result = resolveTaskCenterThumbnail({
    taskType: 'image-generation',
    images: [{ thumbLocalPath: 'data/uploads/thumb/a.png' }, { thumbLocalPath: 'data/uploads/thumb/b.png' }],
  });
  assert.equal(result.kind, 'image');
  assert.equal(result.count, 2);
  assert.ok(result.src.endsWith('.png'), '取第一张的静态图地址');
});

test('taskCenterThumbnail: 视频与音频结果分别报 video 与 audio', () => {
  const video = resolveTaskCenterThumbnail({ videos: [{ posterLocalPath: 'data/uploads/thumb/v.jpg' }] });
  assert.equal(video.kind, 'video');
  assert.equal(video.count, 1);
  assert.ok(video.src.endsWith('.jpg'));

  const audio = resolveTaskCenterThumbnail({ audios: [{ coverLocalPath: 'data/uploads/thumb/a.webp' }] });
  assert.equal(audio.kind, 'audio');
  assert.ok(audio.src.endsWith('.webp'));
});

test('taskCenterThumbnail: 只有视频类地址时不给缩略图，但种类与数量照报', () => {
  const result = resolveTaskCenterThumbnail({ videos: [{ thumbLocalPath: 'data/uploads/thumb/v.mp4' }] });
  assert.equal(result.src, '', 'mp4 不算静态图');
  assert.equal(result.kind, 'video');
  assert.equal(result.count, 1);
});

test('taskCenterThumbnail: 没有 media 数组时按单条结果处理，种类看任务类型', () => {
  const cases = [
    ['video-generation', 'video'],
    ['audio-voice', 'audio'],
    ['image-appearance', 'image'],
    ['story-script', 'text'],
  ];
  for (const [taskType, kind] of cases) {
    const result = resolveTaskCenterThumbnail({ taskType }, taskType);
    assert.equal(result.kind, kind, taskType + ' → ' + kind);
    assert.equal(result.count, 1);
    assert.equal(result.src, '');
  }
  assert.equal(resolveTaskCenterThumbnail({ taskType: 'unknown' }).kind, 'text');
});

test('taskCenterThumbnail: 单条结果的缩略图候选按顺序取第一个静态图', () => {
  const result = resolveTaskCenterThumbnail({
    taskType: 'image-generation',
    thumbUrl: 'data/uploads/thumb/second.png',
    images: [{ posterLocalPath: 'data/uploads/thumb/first.png', thumbUrl: 'data/uploads/thumb/ignored.png' }],
  });
  assert.equal(result.kind, 'image');
  assert.ok(result.src.endsWith('.png'));
  assert.equal(result.count, 1, '外层没有数组时只算一条');
});

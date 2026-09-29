import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captureStoryReplicationRepresentativeFrame,
  collectStoryReplicationRepresentativeFrames,
} from './storyReplicationRepresentativeFrames.js';

const snapshot = (width = 640, height = 480) => ({ blob: { type: 'image/png' }, width, height });

function createCaptureHarness({ captured = snapshot(), saved = { url: 'http://x/f.png', localPath: 'data/uploads/f.png' } } = {}) {
  const captureCalls = [];
  const saveCalls = [];
  return {
    captureCalls,
    saveCalls,
    capture: async (args) => {
      captureCalls.push(args);
      return captured;
    },
    save: async (file, projectId) => {
      saveCalls.push([file, projectId]);
      return saved;
    },
  };
}

const episodeWith = (characters) => ({
  sourceVideo: { videoRef: 'blob:video' },
  replication: {
    sourceAnalysis: {
      characters,
    },
  },
});

test('storyReplicationRepresentativeFrames: 截图参数带源地址、时间点、固定前缀与裁剪框', async () => {
  const harness = createCaptureHarness();
  await captureStoryReplicationRepresentativeFrame({
    videoRef: 'blob:video',
    timeSec: 3.5,
    projectId: 'p1',
    crop: { x: 1, y: 2, width: 3, height: 4 },
    capture: harness.capture,
    save: harness.save,
  });

  assert.deepEqual(harness.captureCalls, [
    {
      sourceUrl: 'blob:video',
      currentTimeSec: 3.5,
      fileNamePrefix: 'story_source_character',
      crop: { x: 1, y: 2, width: 3, height: 4 },
    },
  ]);
  assert.equal(harness.saveCalls.length, 1);
  assert.equal(harness.saveCalls[0][1], 'p1', '保存时带上项目 id');
});

test('storyReplicationRepresentativeFrames: 有裁剪框时结果带回裁剪框副本与像素尺寸', async () => {
  const harness = createCaptureHarness({ captured: snapshot(640, 480) });
  const result = await captureStoryReplicationRepresentativeFrame({
    videoRef: 'blob:video',
    timeSec: 3.5,
    crop: { x: 1, y: 2, width: 3, height: 4 },
    capture: harness.capture,
    save: harness.save,
  });

  assert.deepEqual(result, {
    url: 'http://x/f.png',
    localPath: 'data/uploads/f.png',
    timeSec: 3.5,
    crop: { x: 1, y: 2, width: 3, height: 4 },
    width: 640,
    height: 480,
  });
  assert.notEqual(result.crop, harness.captureCalls[0].crop, '裁剪框是拷贝，不是同一个引用');
});

test('storyReplicationRepresentativeFrames: 没有裁剪框时结果不带裁剪相关字段', async () => {
  const harness = createCaptureHarness();
  const result = await captureStoryReplicationRepresentativeFrame({
    videoRef: 'blob:video',
    timeSec: 1,
    capture: harness.capture,
    save: harness.save,
  });

  assert.deepEqual(result, { url: 'http://x/f.png', localPath: 'data/uploads/f.png', timeSec: 1 });
  assert.equal(Object.hasOwn(result, 'crop'), false);
  assert.equal(Object.hasOwn(result, 'width'), false);
  assert.equal(Object.hasOwn(result, 'height'), false);
});

test('storyReplicationRepresentativeFrames: 截图后已不活跃就不再保存，直接返回 null', async () => {
  const harness = createCaptureHarness();
  const result = await captureStoryReplicationRepresentativeFrame({
    videoRef: 'blob:video',
    timeSec: 1,
    capture: harness.capture,
    save: harness.save,
    isActive: () => false,
  });

  assert.equal(result, null);
  assert.equal(harness.captureCalls.length, 1, '还是截了图');
  assert.equal(harness.saveCalls.length, 0, '但没保存');
});

test('storyReplicationRepresentativeFrames: 保存后才失去活跃状态也返回 null', async () => {
  const harness = createCaptureHarness();
  let active = true;
  const result = await captureStoryReplicationRepresentativeFrame({
    videoRef: 'blob:video',
    timeSec: 1,
    capture: harness.capture,
    save: async (file, projectId) => {
      active = false;
      return harness.save(file, projectId);
    },
    isActive: () => active,
  });

  assert.equal(result, null);
  assert.equal(harness.saveCalls.length, 1);
});

test('storyReplicationRepresentativeFrames: 收集时会跳过已经有本地帧的角色', async () => {
  const episode = episodeWith([
    { representativeTimeSec: 1, frame: { localPath: 'data/uploads/a.png' } },
    { representativeTimeSec: 2, frame: null },
  ]);
  const progress = [];
  const captured = [];

  await collectStoryReplicationRepresentativeFrames({
    episode,
    projectId: 'p1',
    onProgress: (text) => progress.push(text),
    capture: async (args) => {
      captured.push(args);
      return { url: 'http://x/2.png', localPath: 'data/uploads/2.png', timeSec: args.timeSec };
    },
  });

  assert.equal(captured.length, 1, '只处理没有帧的那一个');
  assert.equal(captured[0].timeSec, 2);
  assert.equal(captured[0].videoRef, 'blob:video');
  assert.equal(captured[0].projectId, 'p1');
  assert.deepEqual(progress, ['正在提取人物代表画面 2/2']);
});

test('storyReplicationRepresentativeFrames: 收集成功写入帧并清空错误信息', async () => {
  const first = { representativeTimeSec: 1, frame: null, frameError: '旧错误' };
  const episode = episodeWith([first]);

  await collectStoryReplicationRepresentativeFrames({
    episode,
    projectId: 'p1',
    capture: async () => ({ url: 'http://x/1.png', localPath: 'data/uploads/1.png', timeSec: 1 }),
  });

  assert.equal(first.frame.localPath, 'data/uploads/1.png');
  assert.equal(first.frameError, '');
});

test('storyReplicationRepresentativeFrames: 收集过程中单条失败只写错误信息，不影响其它角色', async () => {
  const bad = { representativeTimeSec: 1, frame: null };
  const good = { representativeTimeSec: 2, frame: null };
  let call = 0;

  await collectStoryReplicationRepresentativeFrames({
    episode: episodeWith([bad, good]),
    capture: async () => {
      call += 1;
      if (call === 1) throw new Error('截图失败');
      return { url: 'http://x/2.png', localPath: 'data/uploads/2.png', timeSec: 2 };
    },
  });

  assert.equal(bad.frame, null);
  assert.equal(bad.frameError, '截图失败');
  assert.equal(good.frame.localPath, 'data/uploads/2.png');
});

test('storyReplicationRepresentativeFrames: 非 Error 抛出时用兜底文案，且不改动已有帧', async () => {
  const character = { representativeTimeSec: 1, frame: null };
  await collectStoryReplicationRepresentativeFrames({
    episode: episodeWith([character]),
    capture: async () => {
      throw 'plain string';
    },
  });

  assert.equal(character.frame, null);
  assert.equal(character.frameError, '代表画面提取失败，可播放原片后重新截帧。');
});

test('storyReplicationRepresentativeFrames: 中途失去活跃状态就立刻停止处理后面的角色', async () => {
  const first = { representativeTimeSec: 1, frame: null };
  const second = { representativeTimeSec: 2, frame: null };
  let active = true;

  await collectStoryReplicationRepresentativeFrames({
    episode: episodeWith([first, second]),
    isActive: () => active,
    capture: async () => {
      active = false;
      return { url: 'http://x/1.png', localPath: 'data/uploads/1.png', timeSec: 1 };
    },
  });

  assert.equal(first.frame, null, '本次结果因失去活跃而丢弃');
  assert.equal(second.frame, null);
});

test('storyReplicationRepresentativeFrames: 源分析被替换后停止写入，避免污染新的一轮', async () => {
  const episode = episodeWith([{ representativeTimeSec: 1, frame: null }, { representativeTimeSec: 2, frame: null }]);
  const character = episode.replication.sourceAnalysis.characters[0];

  await collectStoryReplicationRepresentativeFrames({
    episode,
    capture: async () => {
      episode.replication.sourceAnalysis = { characters: [] };
      return { url: 'http://x/1.png', localPath: 'data/uploads/1.png', timeSec: 1 };
    },
  });

  assert.equal(character.frame, null, '源分析换掉了，结果不再写回');
});

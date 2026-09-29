import test from 'node:test';
import assert from 'node:assert/strict';

import { collectStoryReplicationAssetFrames } from './storyReplicationAssetFrames.js';

function createState() {
  return {
    episodes: [
      {
        id: 'e1',
        replication: { sourceAnalysis: { revision: 3 } },
        sourceVideo: { videoRef: 'data/uploads/e1.mp4' },
      },
      {
        id: 'e2',
        replication: { sourceAnalysis: { revision: 5 } },
        sourceVideo: { videoRef: 'data/uploads/e2.mp4' },
      },
    ],
  };
}

function createAssets() {
  return [
    { id: 'c1', kind: 'character', replicationSource: { episodeId: 'e1', representativeTimeSec: 3 } },
    { id: 's1', kind: 'scene', replicationSource: { episodeId: 'e1', representativeTimeSec: 1.5 } },
    { id: 'p1', kind: 'prop', replicationSource: { episodeId: 'e2', representativeTimeSec: 2.5 } },
    { id: 's2', kind: 'scene' },
  ];
}

test('storyReplicationAssetFrames: 只处理带复刻来源的场景与道具素材', async () => {
  const state = createState();
  const assets = createAssets();
  const calls = [];
  const ok = await collectStoryReplicationAssetFrames({
    data: state,
    assets,
    projectId: 'proj-1',
    sources: undefined,
    capture: async (args) => {
      calls.push(args);
      return { url: 'u', localPath: 'data/uploads/f.png' };
    },
  });

  assert.equal(ok, true);
  assert.deepEqual(
    calls.map((c) => ({ videoRef: c.videoRef, timeSec: c.timeSec, projectId: c.projectId })),
    [
      { videoRef: 'data/uploads/e1.mp4', timeSec: 1.5, projectId: 'proj-1' },
      { videoRef: 'data/uploads/e2.mp4', timeSec: 2.5, projectId: 'proj-1' },
    ],
  );
  assert.deepEqual(assets[1].replicationSource.frame, { url: 'u', localPath: 'data/uploads/f.png' });
  assert.equal(assets[1].replicationSource.frameError, '');
  assert.equal(assets[0].replicationSource.frame, undefined, '人物素材不处理');
  assert.equal(assets[3].replicationSource, undefined, '没有来源的素材不处理');
});

test('storyReplicationAssetFrames: 进度文案按素材类型与序号生成', async () => {
  const progress = [];
  await collectStoryReplicationAssetFrames({
    data: createState(),
    assets: createAssets(),
    projectId: 'p',
    capture: async () => ({ url: 'u', localPath: 'x' }),
    onProgress: (text) => progress.push(text),
  });
  assert.deepEqual(progress, ['正在提取场景原片截图 1/2', '正在提取道具原片截图 2/2']);
});

test('storyReplicationAssetFrames: 同一集同一时间点只截一次帧', async () => {
  const calls = [];
  const assets = [
    { id: 's1', kind: 'scene', replicationSource: { episodeId: 'e1', representativeTimeSec: 1.5 } },
    { id: 'p1', kind: 'prop', replicationSource: { episodeId: 'e1', representativeTimeSec: 1.5 } },
  ];
  const ok = await collectStoryReplicationAssetFrames({
    data: createState(),
    assets,
    projectId: 'p',
    capture: async () => {
      calls.push(1);
      return { url: 'u', localPath: 'x' };
    },
  });
  assert.equal(ok, true);
  assert.equal(calls.length, 1);
  assert.deepEqual(assets[0].replicationSource.frame, { url: 'u', localPath: 'x' });
  assert.deepEqual(assets[1].replicationSource.frame, { url: 'u', localPath: 'x' });
  assert.notEqual(assets[0].replicationSource.frame, assets[1].replicationSource.frame, '各自拿到拷贝');
});

test('storyReplicationAssetFrames: 失败逐条记录 frameError，不中断整批', async () => {
  let index = 0;
  const assets = [
    { id: 's1', kind: 'scene', replicationSource: { episodeId: 'e1', representativeTimeSec: 1 } },
    { id: 'p1', kind: 'prop', replicationSource: { episodeId: 'e2', representativeTimeSec: 2 } },
  ];
  const ok = await collectStoryReplicationAssetFrames({
    data: createState(),
    assets,
    projectId: 'p',
    capture: async () => {
      index += 1;
      if (index === 1) throw new Error('解码失败');
      return null;
    },
  });
  assert.equal(ok, true);
  assert.equal(assets[0].replicationSource.frameError, '解码失败');
  assert.equal(assets[1].replicationSource.frameError, '原片截图未保存，请重新提取素材。');
});

test('storyReplicationAssetFrames: 原视频不可用按错误文案记录', async () => {
  const data = createState();
  data.episodes[0].sourceVideo.videoRef = '';
  const assets = [{ id: 's1', kind: 'scene', replicationSource: { episodeId: 'e1', representativeTimeSec: 1 } }];
  const ok = await collectStoryReplicationAssetFrames({
    data,
    assets,
    projectId: 'p',
    capture: async () => ({ url: 'u', localPath: 'x' }),
  });
  assert.equal(ok, true);
  assert.equal(assets[0].replicationSource.frameError, '原视频不可用，请重新导入后提取素材。');
});

test('storyReplicationAssetFrames: sources 给了就必须命中同集且修订一致', async () => {
  const state = createState();
  const assets = [{ id: 's1', kind: 'scene', replicationSource: { episodeId: 'e1', representativeTimeSec: 1 } }];
  const capture = async () => ({ url: 'u', localPath: 'x' });

  assert.equal(
    await collectStoryReplicationAssetFrames({
      data: state,
      assets,
      projectId: 'p',
      sources: [{ episodeId: 'e1', revision: 3 }],
      capture,
    }),
    true,
  );
  assert.equal(
    await collectStoryReplicationAssetFrames({
      data: state,
      assets: [{ id: 's1', kind: 'scene', replicationSource: { episodeId: 'e1', representativeTimeSec: 1 } }],
      projectId: 'p',
      sources: [{ episodeId: 'e1', revision: 9 }],
      capture,
    }),
    false,
    '修订不一致整体放弃',
  );
  assert.equal(
    await collectStoryReplicationAssetFrames({
      data: state,
      assets: [{ id: 's1', kind: 'scene', replicationSource: { episodeId: 'e9', representativeTimeSec: 1 } }],
      projectId: 'p',
      sources: [{ episodeId: 'e1', revision: 3 }],
      capture,
    }),
    false,
    '来源缺失整体放弃',
  );
});

test('storyReplicationAssetFrames: isActive 变假时立即整体放弃', async () => {
  const state = createState();
  const assets = [
    { id: 's1', kind: 'scene', replicationSource: { episodeId: 'e1', representativeTimeSec: 1 } },
    { id: 'p1', kind: 'prop', replicationSource: { episodeId: 'e2', representativeTimeSec: 2 } },
  ];
  let alive = true;
  const calls = [];
  const ok = await collectStoryReplicationAssetFrames({
    data: state,
    assets,
    projectId: 'p',
    isActive: () => alive,
    capture: async () => {
      alive = false;
      calls.push(1);
      return { url: 'u', localPath: 'x' };
    },
  });
  assert.equal(ok, false);
  assert.equal(calls.length, 1, '第一帧之后停');
  assert.equal(assets[1].replicationSource.frame, undefined, '第二件不再处理');
});

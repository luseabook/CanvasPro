import test from 'node:test';
import assert from 'node:assert/strict';
import { backfillStoryVideoThumbnails } from './storyVideoThumbnailBackfill.js';

// 是否需要补缩略图、按什么来源分组，都由本仓 api/videoResultThumbnailApi.js 的真实判断决定；
// 测试只替换 ensureThumbnail（默认实现会请求本地视频首帧服务）。
function projectsOf(...episodes) {
  return [{ episodes }];
}
function episodeOf(id, ...resultLists) {
  return { id, clips: resultLists.map((results) => ({ video: { results } })) };
}
function thumbFields(name) {
  return {
    posterUrl: '/output/' + name + '.png',
    thumbUrl: '/output/' + name + '.png',
    posterLocalPath: 'output/' + name + '.png',
    thumbLocalPath: 'output/' + name + '.png',
    videoThumbSrc: 'src-' + name,
  };
}

test('backfillStoryVideoThumbnails：同一来源只生成一次，所有引用处都写回缩略图字段', async () => {
  const ep1 = episodeOf('ep1', [
    { localPath: 'output/v1.mp4' },
    { videoUrl: 'https://cdn.example.com/x.mp4' },
  ]);
  const ep2 = episodeOf(' ep2 ', [{ displayLocalPath: 'output/v1.mp4', keep: 1 }]);
  const calls = [];
  const summary = await backfillStoryVideoThumbnails(projectsOf(ep1, ep2), {
    ensureThumbnail: async (result) => {
      calls.push(result);
      return { ...result, ...thumbFields('t1') };
    },
  });
  assert.deepEqual(summary, {
    updatedCount: 2,
    sourceCount: 1,
    failedCount: 0,
    changedEpisodeIds: ['ep1', 'ep2'],
  });
  assert.deepEqual(calls, [{ localPath: 'output/v1.mp4' }]);
  assert.deepEqual(ep1.clips[0].video.results[0], { localPath: 'output/v1.mp4', ...thumbFields('t1') });
  assert.deepEqual(ep2.clips[0].video.results[0], {
    displayLocalPath: 'output/v1.mp4',
    keep: 1,
    ...thumbFields('t1'),
  });
  // 远程地址没有本地来源，不参与补图
  assert.deepEqual(ep1.clips[0].video.results[1], { videoUrl: 'https://cdn.example.com/x.mp4' });
});

test('backfillStoryVideoThumbnails：已有稳定缩略图、非对象、远程结果都跳过；本地 URL 也算来源', async () => {
  const results = [
    { localPath: 'output/has-thumb.mp4', posterLocalPath: 'output/p.png' },
    null,
    'output/str.mp4',
    { url: 'https://cdn.example.com/remote.mp4' },
    { url: '/output/local-url.mp4' },
  ];
  const calls = [];
  const summary = await backfillStoryVideoThumbnails(projectsOf(episodeOf('e', results)), {
    ensureThumbnail: async (result) => {
      calls.push(result);
      return { ...result, ...thumbFields('lu') };
    },
  });
  assert.equal(summary.sourceCount, 1);
  assert.deepEqual(calls, [{ url: '/output/local-url.mp4' }]);
  assert.equal(results[4].posterLocalPath, 'output/lu.png');
  assert.deepEqual(results[0], { localPath: 'output/has-thumb.mp4', posterLocalPath: 'output/p.png' });
});

test('backfillStoryVideoThumbnails：只合并缩略图相关字段，空值字段不写；写回的是新对象', async () => {
  const original = { localPath: 'output/v.mp4', title: '原标题' };
  const results = [original];
  await backfillStoryVideoThumbnails(projectsOf(episodeOf('e', results)), {
    ensureThumbnail: async () => ({
      ...thumbFields('only'),
      sourcePosterUrl: null,
      sourceThumbUrl: 'https://cdn.example.com/src-thumb.jpg',
      title: '不该覆盖',
      localPath: 'output/other.mp4',
    }),
  });
  assert.notEqual(results[0], original);
  assert.deepEqual(original, { localPath: 'output/v.mp4', title: '原标题' });
  assert.deepEqual(results[0], {
    localPath: 'output/v.mp4',
    title: '原标题',
    ...thumbFields('only'),
    sourceThumbUrl: 'https://cdn.example.com/src-thumb.jpg',
  });
});

test('backfillStoryVideoThumbnails：生成结果没有稳定缩略图时不写回也不算失败，抛错才计入失败', async () => {
  const quiet = [{ localPath: 'output/a.mp4' }];
  const broken = [{ localPath: 'output/b.mp4' }];
  const summary = await backfillStoryVideoThumbnails(
    projectsOf(episodeOf('q', quiet), episodeOf('b', broken)),
    {
      ensureThumbnail: async (result) => {
        if (result.localPath === 'output/b.mp4') throw new Error('首帧服务不可用');
        return { ...result, posterUrl: 'https://cdn.example.com/remote-only.jpg' };
      },
    },
  );
  assert.deepEqual(summary, { updatedCount: 0, sourceCount: 2, failedCount: 1, changedEpisodeIds: [] });
  assert.deepEqual(quiet, [{ localPath: 'output/a.mp4' }]);
  assert.deepEqual(broken, [{ localPath: 'output/b.mp4' }]);
});

test('backfillStoryVideoThumbnails：生成期间原位置已被替换或已有缩略图时不覆盖', async () => {
  const results = [{ localPath: 'output/v.mp4' }];
  const other = [{ localPath: 'output/v.mp4' }];
  const summary = await backfillStoryVideoThumbnails(
    projectsOf(episodeOf('e1', results), episodeOf('e2', other)),
    {
      ensureThumbnail: async (result) => {
        results[0] = { localPath: 'output/replaced.mp4' };
        other[0] = { ...other[0], thumbLocalPath: 'output/already.png' };
        return { ...result, ...thumbFields('late') };
      },
    },
  );
  assert.deepEqual(summary, { updatedCount: 0, sourceCount: 1, failedCount: 0, changedEpisodeIds: [] });
  assert.deepEqual(results[0], { localPath: 'output/replaced.mp4' });
  assert.deepEqual(other[0], { localPath: 'output/v.mp4', thumbLocalPath: 'output/already.png' });
});

test('backfillStoryVideoThumbnails：同一个结果对象被两处引用时只登记第一处（冻结行为）', async () => {
  const shared = { localPath: 'output/shared.mp4' };
  const first = [shared];
  const second = [shared];
  const summary = await backfillStoryVideoThumbnails(
    projectsOf(episodeOf('e1', first), episodeOf('e2', second)),
    {
      ensureThumbnail: async (result) => ({ ...result, ...thumbFields('s') }),
    },
  );
  assert.deepEqual(summary, { updatedCount: 1, sourceCount: 1, failedCount: 0, changedEpisodeIds: ['e1'] });
  assert.equal(first[0].posterLocalPath, 'output/s.png');
  assert.equal(second[0], shared);
});

test('backfillStoryVideoThumbnails：并发数夹在 1 到来源数之间', async () => {
  const run = async (concurrency, sourceCount) => {
    let active = 0;
    let peak = 0;
    const lists = Array.from({ length: sourceCount }, (_, index) => [
      { localPath: 'output/v' + index + '.mp4' },
    ]);
    await backfillStoryVideoThumbnails(projectsOf(episodeOf('e', ...lists)), {
      concurrency,
      ensureThumbnail: async (result) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, 5));
        active -= 1;
        return { ...result, ...thumbFields('c') };
      },
    });
    return peak;
  };
  assert.equal(await run(2, 4), 2);
  assert.equal(await run(10, 3), 3);
  assert.equal(await run(0, 3), 1);
  assert.equal(await run('abc', 3), 1);
  assert.equal(await run(undefined, 3), 1);
});

test('backfillStoryVideoThumbnails：结构不完整的输入按空处理，不调用生成函数', async () => {
  let called = 0;
  const ensureThumbnail = async () => {
    called += 1;
  };
  const empty = { updatedCount: 0, sourceCount: 0, failedCount: 0, changedEpisodeIds: [] };
  assert.deepEqual(await backfillStoryVideoThumbnails(null, { ensureThumbnail }), empty);
  assert.deepEqual(
    await backfillStoryVideoThumbnails([{ episodes: 'x' }, null, { episodes: [{ clips: {} }, null] }], {
      ensureThumbnail,
    }),
    empty,
  );
  assert.deepEqual(
    await backfillStoryVideoThumbnails([{ episodes: [{ clips: [{ video: { results: 'x' } }, {}] }] }]),
    empty,
  );
  assert.equal(called, 0);
});

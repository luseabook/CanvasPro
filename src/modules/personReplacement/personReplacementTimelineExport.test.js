import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_TIMELINE_MODES,
  buildPersonReplacementTimelineRequest,
  exportPersonReplacementTimeline,
  getPersonReplacementTimelineExportNotice,
  isPersonReplacementTimelineMode,
} from './personReplacementTimelineExport.js';

const FULL_PROJECT = {
  title: '我的项目',
  audio: { previewTrack: 'original' },
  sources: [{ id: 'src1', videoRef: 'data/uploads/b.mp4' }],
  shots: [
    {
      id: 's1',
      sourceId: 'src1',
      sourceVideoRef: 'data/uploads/a.mp4',
      videoRef: 'data/uploads/a.mp4',
      startTimeSec: '5',
      durationSec: '2.5',
      resultVideoRef: 'output/r1.mp4',
    },
    { id: 's2', sourceId: 'src1', videoRef: 'data/uploads/c.mp4', startTimeSec: '6', endTimeSec: '9' },
    { id: 's3', sourceId: 'src1', startTimeSec: 2, durationSec: 1 },
    {
      id: 's4',
      sourceId: 'src1',
      startTimeSec: '4',
      durationSec: '1',
      isReversed: true,
      materializedIsReversed: true,
    },
  ],
};

test('timelineExport: 模式常量冻结且 isMode 严格相等', () => {
  assert.equal(Object.isFrozen(PERSON_REPLACEMENT_TIMELINE_MODES), true);
  assert.deepEqual(PERSON_REPLACEMENT_TIMELINE_MODES, {
    PREMIERE: 'premiere-xml',
    JIANYING: 'jianying-draft',
  });
  for (const mode of ['premiere-xml', 'jianying-draft']) {
    assert.equal(isPersonReplacementTimelineMode(mode), true, String(mode));
  }
  for (const mode of [
    'PREMIERE-XML',
    ' premiere-xml ',
    'premiere',
    'jianying',
    '',
    null,
    undefined,
    0,
    new String('premiere-xml'),
  ]) {
    assert.equal(isPersonReplacementTimelineMode(mode), false, String(mode));
  }
});

test('timelineExport: 导出提示按模式与剪映启动结果分流', () => {
  assert.deepEqual(getPersonReplacementTimelineExportNotice('premiere-xml'), {
    message: 'Premiere 工程已导出，请在 PR 中导入 timeline.xml。',
    type: 'success',
  });
  assert.deepEqual(getPersonReplacementTimelineExportNotice(null, null), {
    message: 'Premiere 工程已导出，请在 PR 中导入 timeline.xml。',
    type: 'success',
  });
  assert.deepEqual(getPersonReplacementTimelineExportNotice('jianying-draft'), {
    message: '剪映草稿已导出，请在所选草稿位置刷新列表或重启剪映。',
    type: 'success',
  });
  assert.deepEqual(getPersonReplacementTimelineExportNotice('jianying-draft', { autoDetected: true }), {
    message: '剪映草稿已保存到本机草稿目录，请刷新列表或重启剪映。',
    type: 'success',
  });
  assert.deepEqual(getPersonReplacementTimelineExportNotice('jianying-draft', { autoDetected: 1 }), {
    message: '剪映草稿已保存到本机草稿目录，请刷新列表或重启剪映。',
    type: 'success',
  });
  assert.deepEqual(getPersonReplacementTimelineExportNotice('jianying-draft', { autoDetected: false }), {
    message: '剪映草稿已导出，请在所选草稿位置刷新列表或重启剪映。',
    type: 'success',
  });
  assert.deepEqual(getPersonReplacementTimelineExportNotice('jianying-draft', { jianyingLaunch: 'failed' }), {
    message: '草稿已保存，请手动打开剪映。',
    type: 'info',
  });
  assert.deepEqual(
    getPersonReplacementTimelineExportNotice('jianying-draft', {
      jianyingLaunch: 'failed',
      jianyingLaunchError: '自定义错误',
    }),
    { message: '自定义错误', type: 'info' },
  );
  assert.deepEqual(
    getPersonReplacementTimelineExportNotice('jianying-draft', {
      jianyingLaunch: 'failed',
      jianyingLaunchError: '',
    }),
    { message: '草稿已保存，请手动打开剪映。', type: 'info' },
  );
  assert.deepEqual(getPersonReplacementTimelineExportNotice('jianying-draft', { jianyingLaunch: 'opened' }), {
    message: '草稿已保存，剪映已打开，请在草稿列表中查看。',
    type: 'success',
  });
  assert.deepEqual(
    getPersonReplacementTimelineExportNotice('jianying-draft', { jianyingLaunch: 'skipped' }),
    {
      message: '剪映草稿已导出，请在所选草稿位置刷新列表或重启剪映。',
      type: 'success',
    },
  );
});

test('timelineExport: 请求构建先校验模式、镜头与本地素材', () => {
  assert.throws(() => buildPersonReplacementTimelineRequest(), { message: '不支持的剪辑工程格式' });
  assert.throws(() => buildPersonReplacementTimelineRequest({ shots: [{}] }), {
    message: '不支持的剪辑工程格式',
  });
  assert.throws(() => buildPersonReplacementTimelineRequest({}, 'Premiere-xml'), {
    message: '不支持的剪辑工程格式',
  });
  for (const shots of [undefined, null, {}, 'x', 0, []]) {
    assert.throws(
      () => buildPersonReplacementTimelineRequest({ shots }, 'premiere-xml'),
      { message: '当前项目没有可导出的镜头' },
      String(shots),
    );
  }
  assert.throws(() => buildPersonReplacementTimelineRequest({ shots: [{ id: 's1' }] }, 'premiere-xml'), {
    message: '当前项目没有可导出的本地视频',
  });
  assert.throws(
    () => buildPersonReplacementTimelineRequest({ shots: [{ id: 's1', isReversed: true }] }, 'premiere-xml'),
    {
      message: '当前项目没有可导出的本地视频',
    },
  );
});

test('timelineExport: 无法落地的素材引用报错并带镜头名', () => {
  for (const ref of ['blob:http://localhost/x', 'C:/x.mp4', 'https://example.com/x.mp4', 'file:///x.mp4']) {
    assert.throws(
      () => buildPersonReplacementTimelineRequest({ shots: [{ id: 's1', videoRef: ref }] }, 'premiere-xml'),
      { message: '镜头01-原视频尚未保存到本地，请先完成素材下载' },
      String(ref),
    );
  }
  assert.throws(
    () =>
      buildPersonReplacementTimelineRequest(
        { shots: [{ id: 's1', resultVideoRef: 'blob:x' }] },
        'premiere-xml',
      ),
    { message: '镜头01-替换视频尚未保存到本地，请先完成素材下载' },
  );
  assert.throws(
    () =>
      buildPersonReplacementTimelineRequest(
        { shots: [{ id: 's1', videoRef: 'data/uploads/a.mp4', isReversed: true }] },
        'premiere-xml',
      ),
    { message: '镜头01的原片倒放尚未完成，请先完成片段处理' },
  );
  assert.throws(
    () =>
      buildPersonReplacementTimelineRequest(
        { shots: [{ id: 's1', videoRef: 'blob:x', isReversed: true }] },
        'premiere-xml',
      ),
    { message: '镜头01的原片倒放尚未完成，请先完成片段处理' },
    '倒放校验先于素材落地校验',
  );
  const materialized = buildPersonReplacementTimelineRequest(
    { shots: [{ id: 's1', videoRef: 'data/uploads/a.mp4', isReversed: true, materializedIsReversed: true }] },
    'premiere-xml',
  );
  assert.equal(materialized.media.length, 1, 'materializedIsReversed 严格 true 时放行倒放');
});

test('timelineExport: 生成媒体清单/槽位/四条轨道', () => {
  const snapshot = JSON.stringify(FULL_PROJECT);
  const request = buildPersonReplacementTimelineRequest(FULL_PROJECT, 'jianying-draft');
  assert.equal(JSON.stringify(FULL_PROJECT), snapshot, '入参未被改动');
  assert.deepEqual(Object.keys(request), ['format', 'name', 'media', 'slots', 'tracks']);
  assert.equal(request.format, 'jianying-draft');
  assert.equal(request.name, '我的项目');
  assert.deepEqual(request.media, [
    { id: 'media-1', localPath: 'data/uploads/a.mp4', name: '镜头01-原视频' },
    { id: 'media-2', localPath: 'output/r1.mp4', name: '镜头01-替换视频' },
    { id: 'media-3', localPath: 'data/uploads/c.mp4', name: '镜头02-原视频' },
    { id: 'media-4', localPath: 'data/uploads/b.mp4', name: '镜头03-原视频' },
  ]);
  assert.deepEqual(request.slots, [
    { durationMediaId: 'media-1', sourceStartSec: 5, durationSec: 2.5 },
    { durationMediaId: 'media-3', sourceStartSec: 0, durationSec: 3 },
    { durationMediaId: 'media-4', sourceStartSec: 2, durationSec: 1 },
    { durationMediaId: 'media-4', sourceStartSec: 4, durationSec: 1 },
  ]);
  assert.equal(
    request.slots[2].durationMediaId,
    request.slots[3].durationMediaId,
    '相同素材复用同一 media id',
  );
  assert.equal(request.media.length, 4, 's3/s4 共用同一媒体条目');
  assert.deepEqual(
    request.tracks.map((track) => [track.type, track.name, track.muted]),
    [
      ['video', '原视频片段', false],
      ['video', '替换视频片段', false],
      ['audio', '原视频音频片段', false],
      ['audio', '替换视频音频片段', true],
    ],
  );
  assert.deepEqual(request.tracks[0].clips, [
    { slot: 0, mediaId: 'media-1', name: '镜头01', sourceStartSec: 5, sourceDurationSec: 2.5 },
    { slot: 1, mediaId: 'media-3', name: '镜头02', sourceStartSec: 0, sourceDurationSec: 3 },
    { slot: 2, mediaId: 'media-4', name: '镜头03', sourceStartSec: 2, sourceDurationSec: 1 },
    { slot: 3, mediaId: 'media-4', name: '镜头04', sourceStartSec: 4, sourceDurationSec: 1 },
  ]);
  assert.deepEqual(request.tracks[1].clips, [
    { slot: 0, mediaId: 'media-2', name: '镜头01', sourceStartSec: 0 },
  ]);
  assert.deepEqual(request.tracks[2].clips, request.tracks[0].clips);
  assert.deepEqual(request.tracks[3].clips, request.tracks[1].clips);
  assert.equal(request.tracks[0].clips[0] === request.tracks[2].clips[0], false, '音轨片段是副本');
  assert.equal(request.tracks[1].clips[0] === request.tracks[3].clips[0], false);
});

test('timelineExport: 媒体按归一化路径去重', () => {
  const request = buildPersonReplacementTimelineRequest(
    {
      shots: [
        { id: 'a', videoRef: 'output/./x.mp4' },
        { id: 'b', videoRef: '/output/x.mp4' },
      ],
    },
    'premiere-xml',
  );
  assert.deepEqual(request.media, [{ id: 'media-1', localPath: 'output/x.mp4', name: '镜头01-原视频' }]);
  assert.deepEqual(
    request.tracks[0].clips.map((clip) => clip.mediaId),
    ['media-1', 'media-1'],
  );
  assert.deepEqual(request.slots, [
    { durationMediaId: 'media-1', sourceStartSec: 0 },
    { durationMediaId: 'media-1', sourceStartSec: 0 },
  ]);
  assert.deepEqual(request.tracks[1].clips, []);
  assert.equal(request.name, '替换工作室', '缺 title 回落');
  assert.equal(
    buildPersonReplacementTimelineRequest({ shots: [{ videoRef: 'output/a.mp4' }] }, 'premiere-xml').name,
    '替换工作室',
  );
  assert.equal(
    buildPersonReplacementTimelineRequest(
      { shots: [{ videoRef: 'output/a.mp4' }], title: '' },
      'premiere-xml',
    ).name,
    '替换工作室',
  );
  assert.equal(
    buildPersonReplacementTimelineRequest({ shots: [{ videoRef: 'output/a.mp4' }], title: 0 }, 'premiere-xml')
      .name,
    '替换工作室',
  );
  assert.equal(
    buildPersonReplacementTimelineRequest({ shots: [{ videoRef: 'output/a.mp4' }], title: 7 }, 'premiere-xml')
      .name,
    7,
    '非空 title 原样透传',
  );
});

test('timelineExport: previewTrack 决定音轨静音', () => {
  const shots = [{ id: 's1', videoRef: 'output/a.mp4' }];
  const original = buildPersonReplacementTimelineRequest(
    { shots, audio: { previewTrack: 'original' } },
    'premiere-xml',
  );
  assert.deepEqual(
    original.tracks.map((track) => track.muted),
    [false, false, false, true],
  );
  const fallback = buildPersonReplacementTimelineRequest({ shots, audio: {} }, 'premiere-xml');
  assert.deepEqual(
    fallback.tracks.map((track) => track.muted),
    [false, false, true, false],
  );
  assert.deepEqual(
    buildPersonReplacementTimelineRequest({ shots }, 'premiere-xml').tracks.map((t) => t.muted),
    [false, false, true, false],
  );
  assert.deepEqual(
    buildPersonReplacementTimelineRequest(
      { shots, audio: { previewTrack: 'ORIGINAL' } },
      'premiere-xml',
    ).tracks.map((t) => t.muted),
    [false, false, true, false],
    '大小写敏感',
  );
  assert.deepEqual(
    buildPersonReplacementTimelineRequest({ shots, audio: null }, 'premiere-xml').tracks.map((t) => t.muted),
    [false, false, true, false],
    'audio 为 null 时回落',
  );
});

test('timelineExport: 槽位时长回退顺序为 原片 > 替换片 > 纯时长', () => {
  const resultOnly = buildPersonReplacementTimelineRequest(
    { shots: [{ id: 's1', resultVideoRef: 'output/r.mp4', durationSec: 4 }] },
    'premiere-xml',
  );
  assert.deepEqual(resultOnly.media, [{ id: 'media-1', localPath: 'output/r.mp4', name: '镜头01-替换视频' }]);
  assert.deepEqual(resultOnly.slots, [{ durationMediaId: 'media-1' }]);
  assert.deepEqual(resultOnly.tracks[0].clips, []);
  assert.deepEqual(resultOnly.tracks[1].clips, [
    { slot: 0, mediaId: 'media-1', name: '镜头01', sourceStartSec: 0 },
  ]);
  assert.deepEqual(resultOnly.tracks[3].clips, [
    { slot: 0, mediaId: 'media-1', name: '镜头01', sourceStartSec: 0 },
  ]);
  assert.equal(resultOnly.tracks[2].clips.length, 0);
});

test('timelineExport: 起点/时长夹到 0 并跳过非正数时长', () => {
  const negative = buildPersonReplacementTimelineRequest(
    { shots: [{ id: 's1', videoRef: 'output/a.mp4', startTimeSec: '-5', durationSec: -3 }] },
    'premiere-xml',
  );
  assert.equal(negative.slots[0].sourceStartSec, 0);
  assert.equal(Object.is(negative.slots[0].sourceStartSec, 0), true);
  assert.equal('durationSec' in negative.slots[0], false);
  assert.equal('sourceDurationSec' in negative.tracks[0].clips[0], false);
  assert.equal('sourceDurationSec' in negative.tracks[2].clips[0], false);

  const derived = buildPersonReplacementTimelineRequest(
    { shots: [{ id: 's1', videoRef: 'output/a.mp4', durationSec: 'abc', startTimeSec: 1, endTimeSec: 4 }] },
    'premiere-xml',
  );
  assert.equal(derived.slots[0].durationSec, 3, 'durationSec 非法时用 end-start');
  assert.deepEqual(derived.tracks[2].clips[0], derived.tracks[0].clips[0]);

  const zeroDuration = buildPersonReplacementTimelineRequest(
    { shots: [{ id: 's1', videoRef: 'output/a.mp4', durationSec: '0', startTimeSec: '0', endTimeSec: '0' }] },
    'premiere-xml',
  );
  assert.deepEqual(zeroDuration.slots[0], { durationMediaId: 'media-1', sourceStartSec: 0 });

  const infinite = buildPersonReplacementTimelineRequest(
    { shots: [{ id: 's1', videoRef: 'output/a.mp4', durationSec: Infinity }] },
    'premiere-xml',
  );
  assert.equal(infinite.slots[0].durationSec, Infinity, '未做有限性校验');
  assert.equal(infinite.tracks[0].clips[0].sourceDurationSec, Infinity);
  assert.equal(infinite.tracks[2].clips[0].sourceDurationSec, Infinity);
});

test('timelineExport: exportPersonReplacementTimeline 只把请求交给 saveTimeline', async () => {
  const project = { shots: [{ id: 's1', videoRef: 'output/a.mp4' }] };
  const seen = [];
  const result = exportPersonReplacementTimeline({
    project,
    mode: 'premiere-xml',
    saveTimeline: (request) => {
      seen.push(request);
      return Promise.resolve({ saved: true });
    },
  });
  assert.equal(typeof result.then, 'function', '返回 Promise');
  assert.deepEqual(await result, { saved: true });
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0], buildPersonReplacementTimelineRequest(project, 'premiere-xml'));

  const passthrough = exportPersonReplacementTimeline({
    project,
    mode: 'jianying-draft',
    saveTimeline: (request) => request,
  });
  assert.equal((await passthrough).format, 'jianying-draft');

  await assert.rejects(exportPersonReplacementTimeline({ mode: 'premiere-xml' }), {
    message: '当前项目没有可导出的镜头',
  });
  await assert.rejects(exportPersonReplacementTimeline({ project, mode: 'nope' }), {
    message: '不支持的剪辑工程格式',
  });
});

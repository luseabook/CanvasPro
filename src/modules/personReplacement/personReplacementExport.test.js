import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_EXPORT_MODES as MODES,
  buildPersonReplacementExportPlan,
  exportPersonReplacementMedia,
} from './personReplacementExport.js';

const EXPECTED_MODES = {
  FINAL_VIDEO: 'final-video',
  CURRENT_CLIP: 'current-clip',
  ALL_REPLACEMENT_CLIPS: 'all-replacement-clips',
  ALL_CLIPS_AND_IMAGES: 'all-clips-and-images',
};

test('export: 导出模式常量冻结且取值固定', () => {
  assert.equal(Object.isFrozen(MODES), true);
  assert.deepEqual(MODES, EXPECTED_MODES);
  assert.equal(Object.keys(MODES).length, 4);
  assert.deepEqual(Object.values(MODES), [
    'final-video',
    'current-clip',
    'all-replacement-clips',
    'all-clips-and-images',
  ]);
});

test('export: 模式去空白、大小写敏感、非法值回落 current-clip', () => {
  const project = {
    workspace: { selectedShotId: 's1' },
    shots: [{ id: 's1', resultVideoRef: 'output/a.mp4' }],
  };
  for (const mode of [
    undefined,
    null,
    '',
    '   ',
    0,
    false,
    'FINAL-VIDEO',
    'Current-Clip',
    'positioning',
    {},
  ]) {
    assert.equal(buildPersonReplacementExportPlan({ project, mode }).mode, 'current-clip', String(mode));
  }
  assert.equal(buildPersonReplacementExportPlan({ project }).mode, 'current-clip');
  assert.equal(buildPersonReplacementExportPlan({ project, mode: '  current-clip  ' }).mode, 'current-clip');
  assert.equal(
    buildPersonReplacementExportPlan({
      project: { output: { finalVideoRef: 'output/f.mp4' } },
      mode: ' final-video ',
    }).mode,
    'final-video',
  );
  assert.equal(
    buildPersonReplacementExportPlan({
      project: { shots: [{ id: 's1', resultVideoRef: 'output/a.mp4' }] },
      mode: 'all-replacement-clips',
    }).mode,
    'all-replacement-clips',
  );
  assert.equal(
    buildPersonReplacementExportPlan({
      project: { shots: [{ id: 's1', replacementImageRef: 'output/a.png' }] },
      mode: 'all-clips-and-images',
    }).mode,
    'all-clips-and-images',
  );
});

test('export: 完整视频计划 — 标题/文件名/扩展名与 URL', () => {
  const plan = buildPersonReplacementExportPlan({
    project: { output: { finalVideoRef: '  output/final.webm?t=1#frag ' } },
    mode: 'final-video',
  });
  assert.equal(plan.mode, 'final-video');
  assert.equal(plan.title, '导出完整视频');
  assert.deepEqual(plan.skipped, []);
  assert.equal(plan.files.length, 1);
  assert.deepEqual(plan.files[0], {
    kind: 'video',
    localPath: 'output/final.webm',
    url: '/output/final.webm',
    filename: '完整视频.webm',
  });
  const nameOf = (ref) =>
    buildPersonReplacementExportPlan({ project: { output: { finalVideoRef: ref } }, mode: 'final-video' })
      .files[0].filename;
  assert.equal(nameOf('output/NOEXT'), '完整视频.mp4');
  assert.equal(nameOf('output/final.m'), '完整视频.mp4');
  assert.equal(nameOf('output/FINAL.MP4'), '完整视频.mp4');
  assert.equal(nameOf('output/final.abcdefghij'), '完整视频.abcdefghij');
  assert.equal(nameOf('output/final.abcdefghijk'), '完整视频.mp4');
  assert.equal(nameOf('blob:abc'), '完整视频.mp4');
});

test('export: 完整视频计划 — 非本机引用不校验但仍成文件，缺引用即抛错', () => {
  const remote = buildPersonReplacementExportPlan({
    project: { output: { finalVideoRef: 'https://cdn.example.com/a.mp4' } },
    mode: 'final-video',
  });
  assert.deepEqual(remote.files[0], {
    kind: 'video',
    localPath: '',
    url: 'https://cdn.example.com/a.mp4',
    filename: '完整视频.mp4',
  });
  const blocked = buildPersonReplacementExportPlan({
    project: { output: { finalVideoRef: 'blob:http://localhost/1' } },
    mode: 'final-video',
  });
  assert.equal(blocked.files[0].localPath, '');
  assert.equal(blocked.files[0].url, 'blob:http://localhost/1');
  for (const finalVideoRef of [undefined, null, '', '   ']) {
    assert.throws(
      () =>
        buildPersonReplacementExportPlan({
          project: { output: { finalVideoRef } },
          mode: 'final-video',
        }),
      { message: '完整视频尚未封装，请先完成视频与音轨合成。' },
      String(finalVideoRef),
    );
  }
  assert.throws(() => buildPersonReplacementExportPlan({ mode: 'final-video' }), {
    message: '完整视频尚未封装，请先完成视频与音轨合成。',
  });
});

test('export: 当前片段计划 — 按 id 严格匹配、序号取数组下标', () => {
  const project = {
    workspace: { selectedShotId: 's2' },
    shots: [
      { id: 's1', resultVideoRef: 'output/1.mp4' },
      { id: 's2', resultVideoRef: 'output/2.MP4' },
      { id: 's3' },
    ],
  };
  const plan = buildPersonReplacementExportPlan({ project, mode: 'current-clip' });
  assert.equal(plan.title, '导出当前片段');
  assert.deepEqual(plan.skipped, []);
  assert.deepEqual(plan.files, [
    { kind: 'video', localPath: 'output/2.MP4', url: '/output/2.MP4', filename: '镜头片段02-替换视频.mp4' },
  ]);
  assert.throws(
    () =>
      buildPersonReplacementExportPlan({
        project: { workspace: { selectedShotId: ' s3 ' }, shots: project.shots },
        mode: 'current-clip',
      }),
    { message: '当前片段还没有可导出的替换视频。' },
  );
  assert.throws(
    () =>
      buildPersonReplacementExportPlan({
        project: { workspace: { selectedShotId: 's9' }, shots: project.shots },
        mode: 'current-clip',
      }),
    { message: '请先选择要导出的镜头片段。' },
  );
  assert.throws(() => buildPersonReplacementExportPlan({ project: {}, mode: 'current-clip' }), {
    message: '请先选择要导出的镜头片段。',
  });
  assert.throws(() => buildPersonReplacementExportPlan(), { message: '请先选择要导出的镜头片段。' });
});

test('export: 当前片段计划 — 空 selectedShotId 会命中首个空 id 镜头', () => {
  const plan = buildPersonReplacementExportPlan({
    project: { workspace: {}, shots: [{ resultVideoRef: 'output/a.mp4' }] },
    mode: 'current-clip',
  });
  assert.equal(plan.files[0].filename, '镜头片段01-替换视频.mp4');
});

test('export: 序号补零到两位、三位不截断', () => {
  const shots10 = Array.from({ length: 10 }, (unused, index) => ({
    id: 's' + index,
    resultVideoRef: 'output/' + index + '.mp4',
  }));
  const tenth = buildPersonReplacementExportPlan({
    project: { workspace: { selectedShotId: 's9' }, shots: shots10 },
    mode: 'current-clip',
  });
  assert.equal(tenth.files[0].filename, '镜头片段10-替换视频.mp4');
  const shots100 = Array.from({ length: 100 }, (unused, index) => ({
    id: 's' + index,
    resultVideoRef: 'output/' + index + '.mp4',
  }));
  const last = buildPersonReplacementExportPlan({
    project: { workspace: { selectedShotId: 's99' }, shots: shots100 },
    mode: 'current-clip',
  });
  assert.equal(last.files[0].filename, '镜头片段100-替换视频.mp4');
});

test('export: 当前片段计划 — 非本机 video 引用不抛错、localPath 为空', () => {
  const plan = buildPersonReplacementExportPlan({
    project: { workspace: { selectedShotId: 's1' }, shots: [{ id: 's1', resultVideoRef: 'blob:x' }] },
    mode: 'current-clip',
  });
  assert.deepEqual(plan.files, [
    { kind: 'video', localPath: '', url: 'blob:x', filename: '镜头片段01-替换视频.mp4' },
  ]);
});

test('export: 全部替换片段 — 跳过项与音频追加', () => {
  const project = {
    shots: [{ id: 'a', resultVideoRef: 'output/a.mp4' }, { id: 'b' }, { id: 'c', resultVideoRef: '   ' }],
    audio: { replacementAudioRef: 'output/voice.wav' },
  };
  const plan = buildPersonReplacementExportPlan({ project, mode: 'all-replacement-clips' });
  assert.equal(plan.title, '导出所有替换片段/音频');
  assert.deepEqual(
    plan.files.map((file) => file.kind),
    ['video', 'audio'],
  );
  assert.deepEqual(plan.files[0], {
    kind: 'video',
    localPath: 'output/a.mp4',
    url: '/output/a.mp4',
    filename: '镜头片段01-替换视频.mp4',
  });
  assert.deepEqual(plan.files[1], {
    kind: 'audio',
    localPath: 'output/voice.wav',
    url: '/output/voice.wav',
    filename: '替换音频.wav',
  });
  assert.deepEqual(plan.skipped, [
    { shotId: 'b', shotName: '镜头片段02', kind: 'video' },
    { shotId: 'c', shotName: '镜头片段03', kind: 'video' },
  ]);
});

test('export: 全部替换片段 — 只有音频也可导出，全空则抛错', () => {
  const audioOnly = buildPersonReplacementExportPlan({
    project: { audio: { replacementAudioRef: 'output/voice.m4a' } },
    mode: 'all-replacement-clips',
  });
  assert.equal(audioOnly.files.length, 1);
  assert.equal(audioOnly.files[0].filename, '替换音频.m4a');
  assert.deepEqual(audioOnly.skipped, []);
  const noExt = buildPersonReplacementExportPlan({
    project: { shots: [{ id: 'a' }], audio: { replacementAudioRef: 'output/voice' } },
    mode: 'all-replacement-clips',
  });
  assert.equal(noExt.files[0].filename, '替换音频.wav');
  const remoteAudio = buildPersonReplacementExportPlan({
    project: { shots: [{ id: 'a' }], audio: { replacementAudioRef: 'blob:1' } },
    mode: 'all-replacement-clips',
  });
  assert.deepEqual(remoteAudio.files[0], {
    kind: 'audio',
    localPath: '',
    url: 'blob:1',
    filename: '替换音频.wav',
  });
  for (const project of [{}, { shots: [] }, { shots: [{ id: 'a' }], audio: {} }, { shots: undefined }]) {
    assert.throws(() => buildPersonReplacementExportPlan({ project, mode: 'all-replacement-clips' }), {
      message: '当前项目还没有可导出的替换片段或音频。',
    });
  }
});

test('export: 全部结果 — 视频/图片/音频顺序与两类跳过项', () => {
  const project = {
    shots: [
      { id: 'a', resultVideoRef: 'output/a.mp4' },
      { id: 'b', replacementImageRef: 'output/b.png' },
      { id: 'c' },
    ],
    audio: { replacementAudioRef: 'output/voice.wav' },
  };
  const plan = buildPersonReplacementExportPlan({ project, mode: 'all-clips-and-images' });
  assert.equal(plan.title, '导出所有替换结果');
  assert.deepEqual(
    plan.files.map((file) => file.kind),
    ['video', 'image', 'audio'],
  );
  assert.deepEqual(plan.files[1], {
    kind: 'image',
    localPath: 'output/b.png',
    url: '/output/b.png',
    filename: '镜头片段02-替换图.png',
  });
  assert.deepEqual(plan.skipped, [
    { shotId: 'a', shotName: '镜头片段01', kind: 'image' },
    { shotId: 'b', shotName: '镜头片段02', kind: 'video' },
    { shotId: 'c', shotName: '镜头片段03', kind: 'video' },
    { shotId: 'c', shotName: '镜头片段03', kind: 'image' },
  ]);
});

test('export: 全部结果 — 图片扩展名回落与全空抛错', () => {
  const nameOf = (ref) =>
    buildPersonReplacementExportPlan({
      project: { shots: [{ id: 'a', replacementImageRef: ref }] },
      mode: 'all-clips-and-images',
    }).files[0].filename;
  assert.equal(nameOf('data/assets/img'), '镜头片段01-替换图.png');
  assert.equal(nameOf('data/assets/img.JPEG'), '镜头片段01-替换图.jpeg');
  assert.equal(nameOf('data/assets/img.webp?w=1'), '镜头片段01-替换图.webp');
  for (const project of [{}, { shots: [] }, { shots: [{ id: 'a' }], audio: {} }]) {
    assert.throws(() => buildPersonReplacementExportPlan({ project, mode: 'all-clips-and-images' }), {
      message: '当前项目还没有可导出的替换片段、音频或替换图。',
    });
  }
});

test('export: 跳过项读容错字段且 shots 非数组等同空', () => {
  const plan = buildPersonReplacementExportPlan({
    project: { shots: [null, 'x', { resultVideoRef: 'output/a.mp4' }, { id: 0, resultVideoRef: '  ' }] },
    mode: 'all-replacement-clips',
  });
  assert.deepEqual(
    plan.files.map((file) => file.filename),
    ['镜头片段03-替换视频.mp4'],
  );
  assert.deepEqual(plan.skipped, [
    { shotId: '', shotName: '镜头片段01', kind: 'video' },
    { shotId: '', shotName: '镜头片段02', kind: 'video' },
    // id 为数字 0 时被 String(x || '') 归一成空串
    { shotId: '', shotName: '镜头片段04', kind: 'video' },
  ]);
  for (const shots of ['nope', {}, 0, null]) {
    assert.throws(
      () => buildPersonReplacementExportPlan({ project: { shots }, mode: 'current-clip' }),
      { message: '请先选择要导出的镜头片段。' },
      JSON.stringify(shots),
    );
  }
});

test('export: 计划不改动入参对象', () => {
  const project = {
    workspace: { selectedShotId: 's1' },
    shots: [{ id: 's1', resultVideoRef: 'output/a.mp4' }],
    audio: { replacementAudioRef: 'output/voice.wav' },
  };
  const snapshot = structuredClone(project);
  const plan = buildPersonReplacementExportPlan({ project, mode: 'all-clips-and-images' });
  assert.deepEqual(project, snapshot);
  assert.notEqual(plan.files[0], project.shots[0]);
});

test('export: 单文件导出走 saveMedia 并补 title', async () => {
  const seen = [];
  let manyCalled = false;
  const result = await exportPersonReplacementMedia({
    project: {
      workspace: { selectedShotId: 's2' },
      shots: [
        { id: 's1', resultVideoRef: 'output/1.mp4' },
        { id: 's2', resultVideoRef: 'output/2.mp4' },
      ],
    },
    mode: 'current-clip',
    saveMedia: async (payload) => {
      seen.push(payload);
      return { count: 2, saved: ['x'] };
    },
    saveMediaFiles: async () => {
      manyCalled = true;
      return { count: 99 };
    },
  });
  assert.equal(manyCalled, false);
  assert.equal(seen.length, 1);
  assert.deepEqual(seen[0], {
    kind: 'video',
    localPath: 'output/2.mp4',
    url: '/output/2.mp4',
    filename: '镜头片段02-替换视频.mp4',
    title: '导出当前片段',
  });
  assert.deepEqual(result, {
    count: 2,
    saved: ['x'],
    mode: 'current-clip',
    requestedCount: 1,
    exportedCount: 2,
    skipped: [],
    skippedCount: 0,
  });
});

test('export: 单文件导出 — exportedCount 回落 count 与 files 长度', async () => {
  const project = { output: { finalVideoRef: 'output/final.mp4' } };
  const run = async (saved) =>
    exportPersonReplacementMedia({
      project,
      mode: 'final-video',
      saveMedia: async () => saved,
      saveMediaFiles: async () => {
        throw new Error('不应走多文件分支');
      },
    });
  assert.equal((await run({})).exportedCount, 1);
  assert.equal((await run({ count: null })).exportedCount, 1);
  assert.equal((await run({ count: 0 })).exportedCount, 0);
  assert.equal((await run(undefined)).exportedCount, 1);
  const bare = await run(undefined);
  assert.deepEqual(bare, {
    mode: 'final-video',
    requestedCount: 1,
    exportedCount: 1,
    skipped: [],
    skippedCount: 0,
  });
});

test('export: 多文件导出走 saveMediaFiles 并统计跳过项', async () => {
  const seen = [];
  const result = await exportPersonReplacementMedia({
    project: {
      shots: [{ id: 'a', resultVideoRef: 'output/a.mp4' }, { id: 'b' }],
      audio: { replacementAudioRef: 'output/voice.wav' },
    },
    mode: 'all-replacement-clips',
    saveMedia: async () => {
      throw new Error('不应走单文件分支');
    },
    saveMediaFiles: async (payload) => {
      seen.push(payload);
      return { count: 5 };
    },
  });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].title, '导出所有替换片段/音频');
  assert.deepEqual(
    seen[0].files.map((file) => file.filename),
    ['镜头片段01-替换视频.mp4', '替换音频.wav'],
  );
  assert.deepEqual(seen[0].files[0], {
    kind: 'video',
    localPath: 'output/a.mp4',
    url: '/output/a.mp4',
    filename: '镜头片段01-替换视频.mp4',
  });
  assert.deepEqual(result, {
    count: 5,
    mode: 'all-replacement-clips',
    requestedCount: 3,
    exportedCount: 5,
    skipped: [{ shotId: 'b', shotName: '镜头片段02', kind: 'video' }],
    skippedCount: 1,
  });
});

test('export: 计划失败时以异常形式冒泡且不调用保存器', async () => {
  let called = false;
  await assert.rejects(
    exportPersonReplacementMedia({
      project: {},
      mode: 'current-clip',
      saveMedia: async () => {
        called = true;
      },
      saveMediaFiles: async () => {
        called = true;
      },
    }),
    { message: '请先选择要导出的镜头片段。' },
  );
  assert.equal(called, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_STORY_PROJECTS, createDemoStoryWorkspaceData } from './storyWorkspaceData.js';

test('the demo project list is a frozen pair of summaries', () => {
  assert.equal(Object.isFrozen(DEMO_STORY_PROJECTS), true);
  assert.deepEqual(DEMO_STORY_PROJECTS, [
    {
      id: 'story-demo-main',
      title: '重生者的诡异任务',
      updatedAt: '今天 10:32',
      episodeCount: 3,
      status: '制作中',
    },
    { id: 'story-demo-empty', title: '未命名故事', updatedAt: '今天 09:57', episodeCount: 1, status: '草稿' },
  ]);
});

test('demo workspace data describes the main demo project', () => {
  const data = createDemoStoryWorkspaceData();
  assert.deepEqual(Object.keys(data), ['project', 'assets', 'episodes']);
  const { project } = data;
  assert.equal(project.id, DEMO_STORY_PROJECTS[0].id);
  assert.equal(project.title, DEMO_STORY_PROJECTS[0].title);
  assert.equal(project.scriptMode, 'plot');
  assert.equal(project.storyType, '男频');
  assert.equal(project.aspectRatio, '16:9');
  assert.equal(project.videoStyleId, 'custom');
  assert.equal(project.videoStylePrompt, '真人写实 · 电影感 · 冷色调');
  assert.equal(project.customVideoStylePrompt, project.videoStylePrompt);
  assert.equal(project.videoStyle, project.videoStylePrompt);
  assert.deepEqual(project.planning, { episodeCount: 3, sceneMaxSeconds: 15, promptMode: 'seedance-2.0' });
  assert.equal(project.planning.episodeCount, DEMO_STORY_PROJECTS[0].episodeCount);
  assert.equal(project.sourceDocument, null);
  assert.ok(project.plotScript.startsWith('《重生者的诡异任务》\n\n'));
  assert.equal(project.narrationScript.split('\n\n').length, 4);
  assert.deepEqual(project.sourceChapters, [
    { id: 'chapter-1', title: '第一章 重生晚自习', content: project.plotScript },
  ]);
  assert.deepEqual(project.chapters, project.sourceChapters);
  assert.notEqual(project.chapters, project.sourceChapters);
  for (const key of ['summary', 'background', 'setting', 'logline']) assert.ok(project[key].length > 0, key);
});

test('demo assets list four characters and three scenes', () => {
  const { assets } = createDemoStoryWorkspaceData();
  assert.deepEqual(
    assets.map((asset) => [asset.id, asset.kind]),
    [
      ['character-chen-mu', 'character'],
      ['character-teacher', 'character'],
      ['character-desk-mate', 'character'],
      ['character-manager', 'character'],
      ['scene-classroom', 'scene'],
      ['scene-canteen', 'scene'],
      ['scene-bank', 'scene'],
    ],
  );
  const [chenMu, teacher] = assets;
  assert.deepEqual(
    chenMu.appearances.map((appearance) => [appearance.id, appearance.name]),
    [
      ['character-chen-mu-normal', '正常状态'],
      ['character-chen-mu-injured', '受伤状态'],
    ],
  );
  // 端口行为：没有外观的素材也带 appearances 键，值为 undefined
  assert.equal(Object.hasOwn(teacher, 'appearances'), true);
  assert.equal(teacher.appearances, undefined);
  assert.ok(
    assets.every((asset) => asset.imageUrl === '' && asset.name && asset.prompt && asset.description),
  );
  assert.equal(assets.find((asset) => asset.id === 'character-manager').occurrences, '第 2、3 集');
});

test('demo episodes keep clip counts and durations consistent', () => {
  const { episodes } = createDemoStoryWorkspaceData();
  assert.deepEqual(
    episodes.map((episode) => [
      episode.id,
      episode.number,
      episode.status,
      episode.clipCount,
      episode.clips.length,
    ]),
    [
      ['episode-1', 1, '待生成', 6, 6],
      ['episode-2', 2, '待拆分', 0, 0],
      ['episode-3', 3, '待拆分', 0, 0],
    ],
  );
  const [first] = episodes;
  assert.deepEqual(
    first.clips.map((clip) => clip.number),
    [1, 2, 3, 4, 5, 6],
  );
  assert.ok(first.clips.every((clip, index) => clip.id === `episode-1-clip-${index + 1}` && clip.prompt));
  const seconds = first.clips.reduce((total, clip) => total + Number.parseFloat(clip.duration), 0);
  assert.equal(seconds, 28);
  assert.equal(first.duration, '00:28');
  assert.deepEqual(
    episodes.slice(1).map((episode) => episode.duration),
    ['--:--', '--:--'],
  );
});

test('each call returns an independent mutable copy', () => {
  const first = createDemoStoryWorkspaceData();
  const second = createDemoStoryWorkspaceData();
  assert.notEqual(first, second);
  assert.equal(Object.isFrozen(first.assets), false);
  first.project.planning.episodeCount = 9;
  first.project.chapters[0].title = 'changed';
  first.assets[0].name = 'changed';
  first.assets[0].appearances[0].name = 'changed';
  first.episodes[0].clips[0].title = 'changed';
  first.episodes[0].clips.push({ id: 'extra' });
  const third = createDemoStoryWorkspaceData();
  for (const data of [second, third]) {
    assert.equal(data.project.planning.episodeCount, 3);
    assert.equal(data.project.chapters[0].title, '第一章 重生晚自习');
    assert.equal(data.assets[0].name, '陈木');
    assert.equal(data.assets[0].appearances[0].name, '正常状态');
    assert.equal(data.episodes[0].clips[0].title, '异常醒来');
    assert.equal(data.episodes[0].clips.length, 6);
  }
});

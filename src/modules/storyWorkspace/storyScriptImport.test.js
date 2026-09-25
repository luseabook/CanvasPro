import test from 'node:test';
import assert from 'node:assert/strict';
import {
  attachUploadedStoryAssetsToEpisodes,
  parseUploadedStoryEpisodeScenes,
  parseUploadedStoryScript,
} from './storyScriptImport.js';

const MULTI_EPISODE_SCRIPT = [
  '《星河》',
  '第一集：开端',
  '内景 客厅 日',
  '张三：你好。',
  '李四（低声）：嗯。',
  '',
  '# 第２集 - 重逢',
  '外景：街道 夜',
  '@王五',
  '走过街角。',
  'Episode 12: Finale',
  'INT. HOUSE - NIGHT',
  '',
  'JOHN',
  'Hello there.',
].join('\n');

test('empty script text is rejected', () => {
  assert.throws(() => parseUploadedStoryScript(), { message: '没有可导入的剧本文本。' });
  assert.throws(() => parseUploadedStoryScript({ sourceText: ' \n\t ' }), {
    message: '没有可导入的剧本文本。',
  });
});

test('episode headings split the script and keep leading text in the first episode', () => {
  const result = parseUploadedStoryScript({
    sourceText: `\n${MULTI_EPISODE_SCRIPT}\n\n`,
    fileName: 'D:\\剧本\\星河.DOCX',
  });
  assert.equal(result.title, '星河');
  assert.equal(result.sourceText, MULTI_EPISODE_SCRIPT);
  assert.deepEqual(
    result.episodes.map((episode) => [episode.id, episode.number, episode.title]),
    [
      ['episode-1', 1, '开端'],
      ['episode-2', 2, '重逢'],
      ['episode-3', 12, 'Finale'],
    ],
  );
  const [first, second, third] = result.episodes;
  assert.ok(first.script.fullText.startsWith('《星河》\n第一集：开端\n'));
  assert.ok(second.script.fullText.startsWith('# 第２集 - 重逢\n'));
  assert.ok(third.script.fullText.endsWith('Hello there.'));
  assert.deepEqual(
    result.chapters.map((chapter) => chapter.title),
    ['第 1 集：开端', '第 2 集：重逢', '第 12 集：Finale'],
  );
  assert.deepEqual(
    result.chapters.map((chapter) => chapter.content),
    result.episodes.map((episode) => episode.script.fullText),
  );
  // 集标题行和首个场景标题之前的文字不进任何场次，只保留在 script.fullText 里
  assert.deepEqual(first.script.scenes, [
    {
      ref: 'episode-1-scene-1',
      heading: '内景 客厅 日',
      characters: ['张三', '李四'],
      body: '张三：你好。\n李四（低声）：嗯。',
      source: 'upload-structured',
    },
  ]);
  assert.deepEqual(
    second.script.scenes.map((scene) => [scene.heading, scene.characters, scene.body]),
    [['外景：街道 夜', ['王五'], '@王五\n走过街角。']],
  );
  assert.deepEqual(
    third.script.scenes.map((scene) => [scene.heading, scene.characters, scene.body]),
    [['INT. HOUSE - NIGHT', ['JOHN'], 'JOHN\nHello there.']],
  );
});

test('uploaded episodes start as completed scripts waiting to be split', () => {
  const [episode] = parseUploadedStoryScript({
    sourceText: '内景 客厅\n张三：你好',
    fileName: 'demo.txt',
  }).episodes;
  const { script, ...fields } = episode;
  assert.deepEqual(fields, {
    id: 'episode-1',
    planningRef: 'episode-1',
    number: 1,
    title: 'demo',
    synopsis: '',
    hook: '',
    sourceChapterIds: ['episode-1'],
    assetRefs: [],
    assetIds: [],
    scriptStatus: 'completed',
    clips: [],
    clipCount: 0,
    characterCount: 0,
    sceneCount: 0,
    propCount: 0,
    duration: '--:--',
    status: '待拆分',
  });
  assert.deepEqual(
    { ...script, scenes: script.scenes.length },
    {
      schemaVersion: 1,
      source: 'upload',
      episodeRef: 'episode-1',
      scenes: 1,
      fullText: '内景 客厅\n张三：你好',
    },
  );
});

test('the story title comes from the file name, then the first line, then the first episode title', () => {
  const title = (sourceText, fileName = '') => parseUploadedStoryScript({ sourceText, fileName }).title;
  assert.equal(title('正文', 'a/b/剧本.md'), '剧本');
  assert.equal(title('正文', 'notes.json'), 'notes.json');
  assert.equal(title('【星河】\n正文', '粘贴文本'), '星河');
  assert.equal(title('“星河”\n正文'), '星河');
  // 端口行为：去壳字符集里没有右书名号「》」
  assert.equal(title('《星河》\n正文'), '星河》');
  assert.equal(title('第1集 开端\n正文'), '开端');
  assert.equal(title('第1集\n正文'), '未命名剧本');
  assert.equal(title('长'.repeat(81) + '\n正文'), '未命名剧本');
  assert.equal(title('长'.repeat(80) + '\n正文'), '长'.repeat(80));
});

test('episode numbers accept Chinese numerals and fall back to the position', () => {
  const sourceText = [
    '第十二集',
    'a',
    '第两百零五话 标题',
    'b',
    '第３回',
    'c',
    'EP.7',
    'd',
    '第零集',
    'e',
    'ep 1０',
    'f',
  ].join('\n');
  const { episodes } = parseUploadedStoryScript({ sourceText });
  assert.deepEqual(
    episodes.map((episode) => [episode.id, episode.number, episode.title]),
    [
      ['episode-1', 12, '第 12 集'],
      ['episode-2', 205, '标题'],
      ['episode-3', 3, '第 3 集'],
      ['episode-4', 7, '第 7 集'],
      ['episode-5', 5, '第 5 集'],
      ['episode-6', 10, '第 10 集'],
    ],
  );
});

test('a script without scene headings becomes one fallback scene', () => {
  const [episode] = parseUploadedStoryScript({
    sourceText: '开场白\n张三：你好\n\nJOHN\nHi',
    fileName: 'story.txt',
  }).episodes;
  assert.equal(episode.title, 'story');
  assert.deepEqual(episode.script.scenes, [
    {
      ref: 'episode-1-scene-1',
      heading: 'story',
      characters: ['张三', 'JOHN'],
      body: '开场白\n张三：你好\n\nJOHN\nHi',
      source: 'upload-fallback',
    },
  ]);
});

test('scene parsing falls back to a single scene when no heading is found', () => {
  assert.deepEqual(parseUploadedStoryEpisodeScenes(), []);
  assert.deepEqual(parseUploadedStoryEpisodeScenes({ fullText: '  \n ' }), []);
  assert.deepEqual(parseUploadedStoryEpisodeScenes({ fullText: '只有正文', fallbackHeading: '  ' }), [
    {
      ref: 'episode-1-scene-1',
      heading: '未命名场次',
      characters: [],
      body: '只有正文',
      source: 'upload-fallback',
    },
  ]);
  assert.equal(
    parseUploadedStoryEpisodeScenes({ fullText: 'INT. ' + 'A'.repeat(116) })[0].source,
    'upload-fallback',
  );
  // 恰好 120 字仍算场景标题；只有标题、没有正文的场次会被丢掉
  assert.deepEqual(parseUploadedStoryEpisodeScenes({ fullText: 'INT. ' + 'A'.repeat(115) }), []);
});

test('scene headings in several conventions start structured scenes', () => {
  const fullText = [
    '1. INT. HOUSE - DAY',
    'EXT. GARDEN',
    '花园里很安静。',
    'I/E CAR - MOVING',
    '车在行驶。',
    '夜 内 卧室',
    '灯灭了。',
    '12、外景 河边',
    '水声。',
    '内外景 走廊',
    '脚步声。',
    '外面下雨了',
    'Interior design matters',
  ].join('\n');
  const scenes = parseUploadedStoryEpisodeScenes({ fullText, episodeRef: 'ep-7' });
  // 端口行为：空正文的场次被过滤后，ref 仍按标题出现的位置编号
  assert.deepEqual(
    scenes.map((scene) => [scene.ref, scene.heading, scene.body]),
    [
      ['ep-7-scene-2', 'EXT. GARDEN', '花园里很安静。'],
      ['ep-7-scene-3', 'I/E CAR - MOVING', '车在行驶。'],
      ['ep-7-scene-4', '夜 内 卧室', '灯灭了。'],
      ['ep-7-scene-5', '12、外景 河边', '水声。'],
      ['ep-7-scene-6', '内外景 走廊', '脚步声。\n外面下雨了\nInterior design matters'],
    ],
  );
  assert.ok(scenes.every((scene) => scene.source === 'upload-structured' && scene.characters.length === 0));
});

test('scene characters come from dialogue cues, @ mentions and screenplay name lines', () => {
  const fullText = [
    '## 第3场 客厅',
    '【王五】（冷笑）：走着瞧',
    '> 张三：来啊',
    '旁白：夜深了。',
    'V.O.: Long ago.',
    '@赵六（画外）',
    '张三：再说一遍',
    '场景2：街道',
    'MARY',
    'Hi.',
    '',
    "ALICE (CONT'D)",
    'Bye.',
    'BOB',
  ].join('\n');
  const scenes = parseUploadedStoryEpisodeScenes({ fullText, episodeRef: 'ep-9' });
  assert.deepEqual(
    scenes.map((scene) => [scene.ref, scene.heading, scene.characters]),
    [
      ['ep-9-scene-1', '第3场 客厅', ['王五', '张三', '赵六']],
      ['ep-9-scene-2', '场景2：街道', ['MARY', 'ALICE']],
    ],
  );
  assert.equal(scenes[1].body, "MARY\nHi.\n\nALICE (CONT'D)\nBye.\nBOB");
});

test('character names longer than 24 characters are ignored', () => {
  const [scene] = parseUploadedStoryEpisodeScenes({ fullText: `@${'甲'.repeat(25)}\n@${'乙'.repeat(24)}` });
  assert.deepEqual(scene.characters, ['乙'.repeat(24)]);
});

test('assets attach to the episodes whose chapter ids they cite', () => {
  const episodes = [{ id: 'episode-1', title: 'A' }, { id: ' episode-2 ' }];
  const assets = [
    { id: 'c1', kind: 'character', planningRef: 'char-ref', sourceChapterIds: ['episode-1'] },
    { id: 's1', kind: 'scene', ref: 'scene-ref', appearances: [{ sourceChapterIds: [' episode-2 '] }, null] },
    { id: 'p1', kind: 'prop', sourceChapterIds: ['episode-1', 'episode-2'] },
    { kind: 'character', sourceChapterIds: ['episode-1'] },
    null,
  ];
  // 端口行为：没有 id 的素材不进 assetRefs / assetIds，但仍计入对应类别的数量
  assert.deepEqual(attachUploadedStoryAssetsToEpisodes(episodes, assets), [
    {
      id: 'episode-1',
      title: 'A',
      assetRefs: ['char-ref', 'p1'],
      assetIds: ['c1', 'p1'],
      characterCount: 2,
      sceneCount: 0,
      propCount: 1,
    },
    {
      id: ' episode-2 ',
      assetRefs: ['scene-ref', 'p1'],
      assetIds: ['s1', 'p1'],
      characterCount: 0,
      sceneCount: 1,
      propCount: 1,
    },
  ]);
  assert.equal('assetRefs' in episodes[0], false);
});

test('attaching tolerates missing lists', () => {
  assert.deepEqual(attachUploadedStoryAssetsToEpisodes(), []);
  assert.deepEqual(attachUploadedStoryAssetsToEpisodes('x', 'y'), []);
  assert.deepEqual(attachUploadedStoryAssetsToEpisodes([{ id: 'e' }], null), [
    { id: 'e', assetRefs: [], assetIds: [], characterCount: 0, sceneCount: 0, propCount: 0 },
  ]);
});

test('parsed episodes accept assets that cite their chapter ids', () => {
  const { episodes, chapters } = parseUploadedStoryScript({
    sourceText: '第1集\n内景 客厅\n张三：嗨\n第2集\n外景 街道\n李四：哦',
  });
  assert.deepEqual(
    chapters.map((chapter) => [chapter.id, chapter.title]),
    [
      ['episode-1', '第 1 集：第 1 集'],
      ['episode-2', '第 2 集：第 2 集'],
    ],
  );
  const [, second] = attachUploadedStoryAssetsToEpisodes(episodes, [
    { id: 'li-si', kind: 'character', sourceChapterIds: [chapters[1].id] },
  ]);
  assert.deepEqual(
    [second.assetIds, second.characterCount, second.script.scenes[0].characters],
    [['li-si'], 1, ['李四']],
  );
});

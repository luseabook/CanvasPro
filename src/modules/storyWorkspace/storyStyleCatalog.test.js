import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORY_STYLE_CATEGORIES,
  STORY_STYLE_CUSTOM_ID,
  STORY_STYLE_PRESETS,
  getStoryStylePreset,
  resolveStoryStyleSelection,
} from './storyStyleCatalog.js';

test('categories and presets form a frozen catalog', () => {
  assert.equal(STORY_STYLE_CUSTOM_ID, 'custom');
  assert.deepEqual(
    STORY_STYLE_CATEGORIES.map((category) => [category.id, category.label]),
    [
      ['all', '全部'],
      ['live', '真人'],
      ['2d', '2D'],
      ['3d', '3D'],
    ],
  );
  assert.equal(Object.isFrozen(STORY_STYLE_CATEGORIES), true);
  assert.ok(STORY_STYLE_CATEGORIES.every((category) => Object.isFrozen(category)));
  assert.equal(Object.isFrozen(STORY_STYLE_PRESETS), true);
  assert.equal(STORY_STYLE_PRESETS.length, 94);
  assert.equal(new Set(STORY_STYLE_PRESETS.map((preset) => preset.id)).size, 94);
  const counts = {};
  for (const preset of STORY_STYLE_PRESETS) counts[preset.category] = (counts[preset.category] || 0) + 1;
  assert.deepEqual(counts, { live: 35, '2d': 30, '3d': 29 });
  assert.equal(STORY_STYLE_PRESETS[0].id, 'retro-atomic-punk');
  assert.equal(STORY_STYLE_PRESETS.at(-1).id, 'pixel-art');
});

test('each preset uses its label as prompt and an available category preview', () => {
  for (const preset of STORY_STYLE_PRESETS) {
    assert.equal(Object.isFrozen(preset), true);
    assert.deepEqual(Object.keys(preset), ['id', 'label', 'category', 'prompt', 'thumbnail']);
    assert.match(preset.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(preset.prompt, preset.label);
    assert.equal(preset.thumbnail, `images/story-styles/${preset.category}.svg`);
    assert.notEqual(preset.category, 'all');
  }
});

test('presets are looked up by trimmed id', () => {
  const pixel = getStoryStylePreset(' pixel-art ');
  assert.equal(pixel, STORY_STYLE_PRESETS.at(-1));
  assert.deepEqual(pixel, {
    id: 'pixel-art',
    label: '像素风',
    category: '2d',
    prompt: '像素风',
    thumbnail: 'images/story-styles/2d.svg',
  });
  assert.equal(getStoryStylePreset('ue5-realistic-render').category, '3d');
  assert.equal(getStoryStylePreset('custom'), null);
  assert.equal(getStoryStylePreset('Pixel-Art'), null);
  assert.equal(getStoryStylePreset(), null);
  assert.equal(getStoryStylePreset(null), null);
});

test('a preset id resolves to that preset and ignores free-text prompts', () => {
  const selection = resolveStoryStyleSelection({
    styleId: 'horror-film',
    stylePrompt: '别的描述',
    videoStyle: '旧风格',
  });
  assert.equal(Object.isFrozen(selection), true);
  assert.deepEqual(selection, {
    styleId: 'horror-film',
    stylePrompt: '恐怖电影风格',
    label: '恐怖电影风格',
    thumbnail: 'images/story-styles/live.svg',
    isCustom: false,
  });
});

test('anything else becomes a custom style prompt', () => {
  assert.deepEqual(resolveStoryStyleSelection({ styleId: 'custom', stylePrompt: '  赛璐璐 · 暖色  ' }), {
    styleId: 'custom',
    stylePrompt: '赛璐璐 · 暖色',
    label: '赛璐璐 · 暖色',
    thumbnail: '',
    isCustom: true,
  });
  assert.equal(
    resolveStoryStyleSelection({ styleId: 'missing', videoStyle: ' 真人写实 ' }).stylePrompt,
    '真人写实',
  );
  const empty = resolveStoryStyleSelection();
  assert.equal(Object.isFrozen(empty), true);
  assert.deepEqual(empty, {
    styleId: 'custom',
    stylePrompt: '',
    label: '自定义风格提示词',
    thumbnail: '',
    isCustom: true,
  });
  // 端口行为：只含空白的 stylePrompt 在 trim 之前就胜出，不会退回 videoStyle
  assert.equal(resolveStoryStyleSelection({ stylePrompt: '   ', videoStyle: '真人写实' }).stylePrompt, '');
});

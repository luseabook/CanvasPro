import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTENT_ORIGIN,
  normalizeTutorialCategories,
  tutorialUrl,
  normalizeTutorialCatalog,
  createBundledTutorialCatalog,
  getTutorialPlayback,
} from './tutorialCatalog.js';

const CATEGORIES = [
  { id: 'guide', title: '指南', layout: 'list', sort: 0 },
  { id: 'basic', title: '基础', layout: 'list', sort: 1 },
  { id: 'play', title: '玩法', layout: 'grid', sort: 2 },
  { id: 'updates', title: '更新', layout: 'list', sort: 3 },
];

const baseCatalog = (over = {}) => ({
  schemaVersion: 1,
  revision: 1,
  guide: { title: '指南', url: 'https://example.com/guide', enabled: true },
  categories: CATEGORIES.map((category) => ({ ...category })),
  tutorials: [],
  updates: [],
  ...over,
});

const tutorial = (over = {}) => ({
  id: 't1',
  title: '标题',
  category: 'basic',
  videoUrl: 'https://example.com/v.mp4',
  description: '',
  duration: '',
  coverUrl: '',
  enabled: true,
  sort: 0,
  ...over,
});

const update = (over = {}) => ({
  id: 'u1',
  version: '1.0.0',
  date: '2026-01-02',
  notes: '说明',
  enabled: true,
  sort: 0,
  ...over,
});

test('normalizeTutorialCategories returns the four built-in categories by default', () => {
  assert.deepEqual(normalizeTutorialCategories(), [
    { id: 'guide', title: 'API 接入指南', layout: 'list', sort: 0 },
    { id: 'basic', title: '画布基础', layout: 'list', sort: 1 },
    { id: 'play', title: '画布玩法', layout: 'grid', sort: 2 },
    { id: 'updates', title: '更新说明', layout: 'list', sort: 3 },
  ]);
});

test('normalizeTutorialCategories trims titles and orders by sort', () => {
  const result = normalizeTutorialCategories([
    { id: 'play', title: ' 玩法 ', layout: 'grid', sort: 5 },
    { id: 'guide', title: '指南', layout: 'list', sort: 0 },
    { id: 'updates', title: '更新', layout: 'list', sort: 3 },
    { id: 'basic', title: '基础', layout: 'list', sort: 1 },
  ]);
  assert.deepEqual(
    result.map((category) => category.id),
    ['guide', 'basic', 'updates', 'play'],
  );
  assert.equal(result[3].title, '玩法');
});

test('normalizeTutorialCategories rejects invalid shapes and limits', () => {
  assert.throws(() => normalizeTutorialCategories([]), /分类数量无效/);
  assert.throws(() => normalizeTutorialCategories('nope'), /分类数量无效/);
  assert.throws(
    () => normalizeTutorialCategories(Array.from({ length: 31 }, () => CATEGORIES[0])),
    /分类数量无效/,
  );
  assert.throws(() => normalizeTutorialCategories([{ ...CATEGORIES[0], id: 'bad id' }]), /分类配置无效/);
  assert.throws(
    () => normalizeTutorialCategories([CATEGORIES[0], { ...CATEGORIES[1], id: 'guide' }]),
    /分类配置无效/,
  );
  assert.throws(() => normalizeTutorialCategories([{ ...CATEGORIES[0], title: '   ' }]), /分类配置无效/);
  assert.throws(
    () => normalizeTutorialCategories([{ ...CATEGORIES[0], title: 'x'.repeat(31) }]),
    /分类配置无效/,
  );
  assert.throws(() => normalizeTutorialCategories([{ ...CATEGORIES[0], sort: -1 }]), /分类配置无效/);
  assert.throws(() => normalizeTutorialCategories([{ ...CATEGORIES[0], sort: 100000 }]), /分类配置无效/);
  assert.throws(() => normalizeTutorialCategories([{ ...CATEGORIES[0], sort: 1.5 }]), /分类配置无效/);
  assert.throws(() => normalizeTutorialCategories([{ ...CATEGORIES[0], layout: 'table' }]), /分类配置无效/);
});

test('normalizeTutorialCategories requires every built-in category', () => {
  assert.throws(
    () => normalizeTutorialCategories(CATEGORIES.filter((category) => category.id !== 'updates')),
    /内置分类缺失/,
  );
});

test('tutorialUrl only accepts credential-free https links', () => {
  assert.equal(tutorialUrl('https://example.com/a'), 'https://example.com/a');
  assert.equal(tutorialUrl('http://example.com/a'), '');
  assert.equal(tutorialUrl('https://user:pass@example.com/a'), '');
  assert.equal(tutorialUrl('javascript:alert(1)'), '');
  assert.equal(tutorialUrl('/relative/path'), '');
  assert.equal(tutorialUrl(''), '');
  assert.equal(tutorialUrl(null), '');
  assert.equal(tutorialUrl('x'.repeat(2049)), '');
});

test('tutorialUrl resolves cover paths against the content origin only when asked', () => {
  const cover = '/api/subscription/canvas-content/covers/a.png';
  assert.equal(tutorialUrl(cover, { cover: true }), CONTENT_ORIGIN + cover);
  assert.equal(tutorialUrl(cover), '');
});

test('normalizeTutorialCatalog keeps a trimmed guide and synthesizes its guide entry', () => {
  const result = normalizeTutorialCatalog(
    baseCatalog({ guide: { title: ' 指南 ', url: 'https://example.com/g', enabled: true } }),
  );
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.revision, 1);
  assert.deepEqual(result.guide, { title: '指南', url: 'https://example.com/g', enabled: true });
  assert.deepEqual(result.guides, [
    {
      id: 'api-guide',
      enabled: true,
      sort: 0,
      title: '指南',
      description: '',
      duration: '',
      videoUrl: 'https://example.com/g',
      coverUrl: '',
      category: 'guide',
    },
  ]);
  assert.deepEqual(result.tutorials, []);
  assert.deepEqual(result.updates, []);
});

test('normalizeTutorialCatalog drops the synthesized guide entry when the guide is disabled', () => {
  const result = normalizeTutorialCatalog(baseCatalog({ guide: { title: '指南', url: '', enabled: false } }));
  assert.deepEqual(result.guide, { title: '指南', url: '', enabled: false });
  assert.deepEqual(result.guides, []);
});

test('normalizeTutorialCatalog rejects an enabled guide without a usable link', () => {
  assert.throws(
    () =>
      normalizeTutorialCatalog(baseCatalog({ guide: { title: '指南', url: 'http://x/y', enabled: true } })),
    /教程指南链接无效/,
  );
});

test('normalizeTutorialCatalog validates the version envelope', () => {
  assert.throws(() => normalizeTutorialCatalog(null), /教程配置版本无效/);
  assert.throws(() => normalizeTutorialCatalog(baseCatalog({ schemaVersion: 2 })), /教程配置版本无效/);
  assert.throws(() => normalizeTutorialCatalog(baseCatalog({ revision: -1 })), /教程配置版本无效/);
  assert.throws(() => normalizeTutorialCatalog(baseCatalog({ revision: 1.5 })), /教程配置版本无效/);
});

test('normalizeTutorialCatalog validates the guide block', () => {
  assert.throws(() => normalizeTutorialCatalog(baseCatalog({ guide: null })), /教程指南配置无效/);
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ guide: { title: '指南', url: '', enabled: 'yes' } })),
    /教程指南配置无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ guide: { title: '   ', url: '', enabled: false } })),
    /教程内容格式无效/,
  );
  assert.throws(
    () =>
      normalizeTutorialCatalog(baseCatalog({ guide: { title: 'x'.repeat(121), url: '', enabled: false } })),
    /教程内容格式无效/,
  );
});

test('normalizeTutorialCatalog normalizes a tutorial entry', () => {
  const result = normalizeTutorialCatalog(
    baseCatalog({ tutorials: [tutorial({ id: ' t1 ', title: ' 标题 ', sort: 2 })] }),
  );
  assert.deepEqual(result.tutorials, [
    {
      id: 't1',
      enabled: true,
      sort: 2,
      title: '标题',
      description: '',
      duration: '',
      videoUrl: 'https://example.com/v.mp4',
      coverUrl: '',
      category: 'basic',
    },
  ]);
});

test('normalizeTutorialCatalog validates tutorial fields', () => {
  assert.throws(() => normalizeTutorialCatalog(baseCatalog({ tutorials: 'nope' })), /教程内容数量无效/);
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: Array.from({ length: 201 }, () => tutorial()) })),
    /教程内容数量无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ enabled: 'yes' })] })),
    /教程排序无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ sort: 1.5 })] })),
    /教程排序无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ sort: -1 })] })),
    /教程排序无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ id: '   ' })] })),
    /教程内容格式无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial(), tutorial({ id: 't1' })] })),
    /教程 ID 重复/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ category: 'nope' })] })),
    /教程链接或分类无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ videoUrl: 'http://x/y' })] })),
    /教程链接或分类无效/,
  );
  assert.throws(
    () =>
      normalizeTutorialCatalog(
        baseCatalog({ tutorials: [tutorial({ coverUrl: 'http://example.com/c.png' })] }),
      ),
    /教程链接或分类无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ description: undefined })] })),
    /教程内容格式无效/,
  );
});

test('normalizeTutorialCatalog drops disabled entries and sorts the rest', () => {
  const result = normalizeTutorialCatalog(
    baseCatalog({
      tutorials: [
        tutorial({ id: 'b', sort: 2 }),
        tutorial({ id: 'a', sort: 1 }),
        tutorial({ id: 'off', sort: 0, enabled: false }),
      ],
    }),
  );
  assert.deepEqual(
    result.tutorials.map((entry) => entry.id),
    ['a', 'b'],
  );
});

test('normalizeTutorialCatalog normalizes update entries', () => {
  const result = normalizeTutorialCatalog(baseCatalog({ updates: [update()] }));
  assert.deepEqual(result.updates, [
    { id: 'u1', enabled: true, sort: 0, version: '1.0.0', date: '2026-01-02', notes: '说明' },
  ]);
});

test('normalizeTutorialCatalog rejects malformed update dates', () => {
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ updates: [update({ date: '2026/01/02' })] })),
    /更新日期无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ updates: [update({ date: '2026-13-01' })] })),
    /更新日期无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ updates: [update({ version: undefined })] })),
    /教程内容格式无效/,
  );
});

test('normalizeTutorialCatalog sorts updates by sort then newest date', () => {
  const result = normalizeTutorialCatalog(
    baseCatalog({
      updates: [
        update({ id: 'old', sort: 1, date: '2025-01-01' }),
        update({ id: 'new', sort: 1, date: '2026-05-01' }),
        update({ id: 'top', sort: 0, date: '2024-01-01' }),
      ],
    }),
  );
  assert.deepEqual(
    result.updates.map((entry) => entry.id),
    ['top', 'new', 'old'],
  );
});

test('normalizeTutorialCatalog honours an explicit guides array', () => {
  const result = normalizeTutorialCatalog(
    baseCatalog({
      guides: [
        {
          id: 'g1',
          title: '自定义指南',
          category: 'guide',
          videoUrl: 'https://example.com/g1',
          description: '',
          duration: '',
          coverUrl: '',
          enabled: true,
          sort: 0,
        },
      ],
    }),
  );
  assert.equal(result.guides.length, 1);
  assert.equal(result.guides[0].id, 'g1');
});

test('createBundledTutorialCatalog derives categories from the item index', () => {
  const result = createBundledTutorialCatalog([
    { title: 'A', url: 'https://example.com/a.mp4' },
    { title: 'B', url: 'https://example.com/b.mp4' },
  ]);
  assert.equal(result.revision, 0);
  assert.deepEqual(result.guide, { title: 'API 接入指南', url: '', enabled: false });
  assert.deepEqual(result.guides, []);
  assert.deepEqual(
    result.tutorials.map((entry) => entry.category),
    ['basic', 'play'],
  );
  assert.deepEqual(
    result.tutorials.map((entry) => entry.id),
    ['bundled-0', 'bundled-1'],
  );
  assert.equal(result.tutorials[0].videoUrl, 'https://example.com/a.mp4');
  assert.deepEqual(result.updates, []);
});

test('createBundledTutorialCatalog keeps an explicit category and adopts the guide item', () => {
  const result = createBundledTutorialCatalog(
    [{ title: 'A', url: 'https://example.com/a.mp4', category: 'play' }],
    [{ title: '指南', url: 'https://example.com/g' }],
  );
  assert.equal(result.tutorials[0].category, 'play');
  assert.deepEqual(result.guide, { title: '指南', url: 'https://example.com/g', enabled: true });
  assert.equal(result.guides.length, 1);
  assert.equal(result.guides[0].id, 'api-guide');
  assert.equal(result.guides[0].videoUrl, 'https://example.com/g');
});

test('getTutorialPlayback resolves a YouTube watch link and thumbnail', () => {
  const playback = getTutorialPlayback('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.deepEqual(playback, {
    type: 'youtube',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  });
});

test('getTutorialPlayback resolves short YouTube links and shorts paths', () => {
  assert.equal(
    getTutorialPlayback('https://youtu.be/dQw4w9WgXcQ').thumbnailUrl,
    'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  );
  assert.equal(
    getTutorialPlayback('https://www.youtube.com/shorts/abcdef').thumbnailUrl,
    'https://i.ytimg.com/vi/abcdef/hqdefault.jpg',
  );
  assert.equal(
    getTutorialPlayback('https://www.youtube-nocookie.com/embed/abcdef').thumbnailUrl,
    'https://i.ytimg.com/vi/abcdef/hqdefault.jpg',
  );
});

test('getTutorialPlayback falls through for unparseable YouTube ids', () => {
  assert.deepEqual(getTutorialPlayback('https://youtu.be/ab'), {
    type: 'external',
    url: 'https://youtu.be/ab',
  });
});

test('getTutorialPlayback builds a bilibili player iframe', () => {
  const playback = getTutorialPlayback('https://www.bilibili.com/video/BV1xx411c7mD?p=3');
  assert.equal(playback.type, 'iframe');
  const url = new URL(playback.url);
  assert.equal(url.origin + url.pathname, 'https://player.bilibili.com/player.html');
  assert.equal(url.searchParams.get('bvid'), 'BV1xx411c7mD');
  assert.equal(url.searchParams.get('page'), '3');
  assert.equal(url.searchParams.get('autoplay'), '0');
});

test('getTutorialPlayback maps av ids onto the aid parameter', () => {
  const playback = getTutorialPlayback('https://bilibili.com/video/av12345/?p=abc');
  const url = new URL(playback.url);
  assert.equal(url.searchParams.get('aid'), '12345');
  assert.equal(url.searchParams.get('page'), '1');
});

test('getTutorialPlayback classifies direct media and unknown links', () => {
  assert.deepEqual(getTutorialPlayback('https://example.com/clip.MP4'), {
    type: 'video',
    url: 'https://example.com/clip.MP4',
  });
  assert.deepEqual(getTutorialPlayback('https://example.com/page'), {
    type: 'external',
    url: 'https://example.com/page',
  });
  assert.equal(getTutorialPlayback('http://example.com/a.mp4'), null);
  assert.equal(getTutorialPlayback(''), null);
  assert.equal(getTutorialPlayback(null), null);
});

test('normalizeTutorialCategories rejects an over-long id', () => {
  assert.throws(
    () => normalizeTutorialCategories([{ ...CATEGORIES[0], id: 'a'.repeat(81) }]),
    /分类配置无效/,
  );
});

test('normalizeTutorialCatalog enforces the sort cap and the text length caps', () => {
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ sort: 100000 })] })),
    /教程排序无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ tutorials: [tutorial({ title: 'x'.repeat(121) })] })),
    /教程内容格式无效/,
  );
  assert.throws(
    () => normalizeTutorialCatalog(baseCatalog({ updates: [update({ notes: 'x'.repeat(12001) })] })),
    /教程内容格式无效/,
  );
});

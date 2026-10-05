export const CONTENT_ORIGIN = 'https://api.ashuoai.com';
const DEFAULT_CATEGORIES = [
  ['guide', 'API 接入指南', 'list'],
  ['basic', '画布基础', 'list'],
  ['play', '画布玩法', 'grid'],
  ['updates', '更新说明', 'list'],
]['map'](([id, title, layout], sort) => ({
  id: id,
  title: title,
  layout: layout,
  sort: sort,
}));
export function normalizeTutorialCategories(list = DEFAULT_CATEGORIES) {
  if (!Array['isArray'](list) || !list['length'] || list['length'] > 30) throw new Error('分类数量无效');
  const map = new Set(),
    list2 = list['map']((id2) => {
      if (
        !id2 ||
        typeof id2['id'] !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/['test'](id2['id']) ||
        map['has'](id2['id']) ||
        typeof id2['title'] !== 'string' ||
        !id2['title']['trim']() ||
        id2['title']['length'] > 30 ||
        !Number['isInteger'](id2['sort']) ||
        id2['sort'] < 0 ||
        id2['sort'] > 0x1869f ||
        !['list', 'grid']['includes'](id2['layout'])
      )
        throw new Error('分类配置无效');
      return (
        map['add'](id2['id']),
        {
          id: id2['id'],
          title: id2['title']['trim'](),
          layout: id2['layout'],
          sort: id2['sort'],
        }
      );
    });
  if (DEFAULT_CATEGORIES['some']((value) => !map['has'](value['id']))) throw new Error('内置分类缺失');
  return list2['sort']((list3, list4) => list3['sort'] - list4['sort']);
}
export function tutorialUrl(list5, { cover: cover = false } = {}) {
  if (typeof list5 !== 'string' || list5['length'] > 2048) return '';
  try {
    const uRL = new URL(
      list5,
      cover && list5['startsWith']('/api/subscription/canvas-content/covers/') ? CONTENT_ORIGIN : undefined,
    );
    return uRL['protocol'] === 'https:' && !uRL['username'] && !uRL['password'] ? uRL['href'] : '';
  } catch {
    return '';
  }
}
export function normalizeTutorialCatalog(enabled) {
  if (
    !enabled ||
    enabled['schemaVersion'] !== 1 ||
    !Number['isInteger'](enabled['revision']) ||
    enabled['revision'] < 0
  )
    throw new Error('教程配置版本无效');
  if (!enabled['guide'] || typeof enabled['guide']['enabled'] !== 'boolean')
    throw new Error('教程指南配置无效');
  const title2 = (list6, item, key = false) => {
      if (typeof list6 !== 'string' || list6['length'] > item || (key && !list6['trim']()))
        throw new Error('教程内容格式无效');
      return list6['trim']();
    },
    guide = {
      title: title2(enabled['guide']['title'], 120, true),
      url: tutorialUrl(enabled['guide']['url']),
      enabled: enabled['guide']['enabled'],
    };
  if (guide['enabled'] && !guide['url']) throw new Error('教程指南链接无效');
  const categories = normalizeTutorialCategories(enabled['categories']),
    index = categories['filter']((result) => !['guide', 'updates']['includes'](result['id']))['map'](
      (data) => data['id'],
    ),
    options = {
      schemaVersion: 1,
      revision: enabled['revision'],
      guide: guide,
      categories: categories,
    },
    target =
      enabled['guides'] ??
      (guide['enabled']
        ? [
            {
              id: 'api-guide',
              category: 'guide',
              title: guide['title'],
              videoUrl: guide['url'],
              description: '',
              coverUrl: '',
              duration: '',
              sort: 0,
              enabled: true,
            },
          ]
        : []);
  for (const source of ['tutorials', 'updates', 'guides']) {
    const list7 = source === 'guides' ? target : enabled[source];
    if (!Array['isArray'](list7) || list7['length'] > 200) throw new Error('教程内容数量无效');
    const map2 = new Set();
    options[source] = list7['map']((enabled2) => {
      if (
        !enabled2 ||
        typeof enabled2['enabled'] !== 'boolean' ||
        !Number['isInteger'](enabled2['sort']) ||
        enabled2['sort'] < 0 ||
        enabled2['sort'] > 0x1869f
      )
        throw new Error('教程排序无效');
      const id3 = title2(enabled2['id'], 80, true);
      if (map2['has'](id3)) throw new Error('教程 ID 重复');
      map2['add'](id3);
      const next = { id: id3, enabled: enabled2['enabled'], sort: enabled2['sort'] };
      if (source !== 'updates') {
        const videoUrl = tutorialUrl(enabled2['videoUrl']),
          coverUrl = enabled2['coverUrl'] ? tutorialUrl(enabled2['coverUrl'], { cover: true }) : '';
        if (
          !videoUrl ||
          (enabled2['coverUrl'] && !coverUrl) ||
          !(source === 'guides' ? ['guide'] : index)['includes'](enabled2['category'])
        )
          throw new Error('教程链接或分类无效');
        Object['assign'](next, {
          title: title2(enabled2['title'], 120, true),
          description: title2(enabled2['description'], 500),
          duration: title2(enabled2['duration'], 24),
          videoUrl: videoUrl,
          coverUrl: coverUrl,
          category: enabled2['category'],
        });
      } else {
        const date = title2(enabled2['date'], 10, true);
        if (!/^\d{4}-\d{2}-\d{2}$/['test'](date) || !Number['isFinite'](Date['parse'](date)))
          throw new Error('更新日期无效');
        Object['assign'](next, {
          version: title2(enabled2['version'], 40, true),
          date: date,
          notes: title2(enabled2['notes'], 12000, true),
        });
      }
      return next;
    })
      ['filter']((current) => current['enabled'])
      ['sort'](
        (list8, list9) =>
          list8['sort'] - list9['sort'] || String(list9['date'] || '')['localeCompare'](list8['date'] || ''),
      );
  }
  return options;
}
export function createBundledTutorialCatalog(tutorials, entry = []) {
  const title3 = entry[0];
  return normalizeTutorialCatalog({
    schemaVersion: 1,
    revision: 0,
    guide: {
      title: title3?.['title'] || 'API 接入指南',
      url: title3?.['url'] || '',
      enabled: Boolean(title3?.['url']),
    },
    tutorials: tutorials['map']((title4, sort2) => ({
      id: 'bundled-' + sort2,
      title: title4['title'],
      category: title4['category'] || (sort2 === 0 ? 'basic' : 'play'),
      description: '',
      duration: '',
      coverUrl: '',
      videoUrl: title4['url'],
      enabled: true,
      sort: sort2,
    })),
    updates: [],
  });
}
export function getTutorialPlayback(record) {
  const url = tutorialUrl(record);
  if (!url) return null;
  const uRL2 = new URL(url),
    list10 = [
      'www.youtube.com',
      'youtube.com',
      'm.youtube.com',
      'www.youtube-nocookie.com',
      'youtube-nocookie.com',
      'youtu.be',
    ];
  if (list10['includes'](uRL2['hostname']['toLowerCase']())) {
    const payload =
      uRL2['hostname']['toLowerCase']() === 'youtu.be'
        ? uRL2['pathname']['replace'](/^\//, '')
        : uRL2['searchParams']['get']('v') ||
          uRL2['pathname']['match'](/^\/(?:shorts|embed)\/([^/?]+)/)?.[1];
    if (/^[a-zA-Z0-9_-]{6,20}$/['test'](payload || ''))
      return {
        type: 'youtube',
        url: url,
        thumbnailUrl: 'https://i.ytimg.com/vi/' + payload + '/hqdefault.jpg',
      };
  }
  if (['www.bilibili.com', 'bilibili.com', 'm.bilibili.com']['includes'](uRL2['hostname'])) {
    const handle = uRL2['pathname']['match'](/^\/video\/(BV[a-zA-Z0-9]+|av\d+)\/?$/);
    if (handle) {
      const url2 = new URL('https://player.bilibili.com/player.html');
      return (
        url2['searchParams']['set'](
          handle[1]['startsWith']('BV') ? 'bvid' : 'aid',
          handle[1]['replace'](/^av/, ''),
        ),
        url2['searchParams']['set'](
          'page',
          /^\d+$/['test'](uRL2['searchParams']['get']('p') || '') ? uRL2['searchParams']['get']('p') : '1',
        ),
        url2['searchParams']['set']('autoplay', '0'),
        { type: 'iframe', url: url2['href'] }
      );
    }
  }
  if (/\.(mp4|webm|ogg)$/i['test'](uRL2['pathname'])) return { type: 'video', url: url };
  return { type: 'external', url: url };
}

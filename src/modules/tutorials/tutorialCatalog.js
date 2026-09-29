export const CONTENT_ORIGIN = 'https://api.ashuoai.com';
const DEFAULT_CATEGORIES = [
  ['guide', 'API\x20接入指南', 'list'],
  ['basic', '画布基础', 'list'],
  ['play', '画布玩法', 'grid'],
  ['updates', '更新说明', 'list'],
]['map'](([_0x173f8f, _0x564715, _0x18762c], _0x8b8e93) => ({
  id: _0x173f8f,
  title: _0x564715,
  layout: _0x18762c,
  sort: _0x8b8e93,
}));
export function normalizeTutorialCategories(_0x1ede48 = DEFAULT_CATEGORIES) {
  if (!Array['isArray'](_0x1ede48) || !_0x1ede48['length'] || _0x1ede48['length'] > 0x1e)
    throw new Error('分类数量无效');
  const _0xb6a964 = new Set(),
    _0x58ed74 = _0x1ede48['map']((_0xb0caf5) => {
      if (
        !_0xb0caf5 ||
        typeof _0xb0caf5['id'] !== 'string' ||
        !/^[a-zA-Z0-9_-]{1,80}$/['test'](_0xb0caf5['id']) ||
        _0xb6a964['has'](_0xb0caf5['id']) ||
        typeof _0xb0caf5['title'] !== 'string' ||
        !_0xb0caf5['title']['trim']() ||
        _0xb0caf5['title']['length'] > 0x1e ||
        !Number['isInteger'](_0xb0caf5['sort']) ||
        _0xb0caf5['sort'] < 0x0 ||
        _0xb0caf5['sort'] > 0x1869f ||
        !['list', 'grid']['includes'](_0xb0caf5['layout'])
      )
        throw new Error('分类配置无效');
      return (
        _0xb6a964['add'](_0xb0caf5['id']),
        {
          id: _0xb0caf5['id'],
          title: _0xb0caf5['title']['trim'](),
          layout: _0xb0caf5['layout'],
          sort: _0xb0caf5['sort'],
        }
      );
    });
  if (DEFAULT_CATEGORIES['some']((_0x19bade) => !_0xb6a964['has'](_0x19bade['id'])))
    throw new Error('内置分类缺失');
  return _0x58ed74['sort']((_0x2abd5d, _0x29fde5) => _0x2abd5d['sort'] - _0x29fde5['sort']);
}
export function tutorialUrl(_0x1da2d2, { cover: cover = ![] } = {}) {
  if (typeof _0x1da2d2 !== 'string' || _0x1da2d2['length'] > 0x800) return '';
  try {
    const _0x8c0e5d = new URL(
      _0x1da2d2,
      cover && _0x1da2d2['startsWith']('/api/subscription/canvas-content/covers/')
        ? CONTENT_ORIGIN
        : undefined,
    );
    return _0x8c0e5d['protocol'] === 'https:' && !_0x8c0e5d['username'] && !_0x8c0e5d['password']
      ? _0x8c0e5d['href']
      : '';
  } catch {
    return '';
  }
}
export function normalizeTutorialCatalog(_0x55807c) {
  if (
    !_0x55807c ||
    _0x55807c['schemaVersion'] !== 0x1 ||
    !Number['isInteger'](_0x55807c['revision']) ||
    _0x55807c['revision'] < 0x0
  )
    throw new Error('教程配置版本无效');
  if (!_0x55807c['guide'] || typeof _0x55807c['guide']['enabled'] !== 'boolean')
    throw new Error('教程指南配置无效');
  const _0x477b6d = (_0x15424d, _0x937c70, _0x3d8c9b = ![]) => {
      if (
        typeof _0x15424d !== 'string' ||
        _0x15424d['length'] > _0x937c70 ||
        (_0x3d8c9b && !_0x15424d['trim']())
      )
        throw new Error('教程内容格式无效');
      return _0x15424d['trim']();
    },
    _0x52e16f = {
      title: _0x477b6d(_0x55807c['guide']['title'], 0x78, !![]),
      url: tutorialUrl(_0x55807c['guide']['url']),
      enabled: _0x55807c['guide']['enabled'],
    };
  if (_0x52e16f['enabled'] && !_0x52e16f['url']) throw new Error('教程指南链接无效');
  const _0x57019e = normalizeTutorialCategories(_0x55807c['categories']),
    _0x4cc9a0 = _0x57019e['filter']((_0x5572bf) => !['guide', 'updates']['includes'](_0x5572bf['id']))['map'](
      (_0x188b76) => _0x188b76['id'],
    ),
    _0x47e534 = {
      schemaVersion: 0x1,
      revision: _0x55807c['revision'],
      guide: _0x52e16f,
      categories: _0x57019e,
    },
    _0x31a106 =
      _0x55807c['guides'] ??
      (_0x52e16f['enabled']
        ? [
            {
              id: 'api-guide',
              category: 'guide',
              title: _0x52e16f['title'],
              videoUrl: _0x52e16f['url'],
              description: '',
              coverUrl: '',
              duration: '',
              sort: 0x0,
              enabled: !![],
            },
          ]
        : []);
  for (const _0x521ef4 of ['tutorials', 'updates', 'guides']) {
    const _0x381e67 = _0x521ef4 === 'guides' ? _0x31a106 : _0x55807c[_0x521ef4];
    if (!Array['isArray'](_0x381e67) || _0x381e67['length'] > 0xc8) throw new Error('教程内容数量无效');
    const _0x385fbc = new Set();
    _0x47e534[_0x521ef4] = _0x381e67['map']((_0x2c8d96) => {
      if (
        !_0x2c8d96 ||
        typeof _0x2c8d96['enabled'] !== 'boolean' ||
        !Number['isInteger'](_0x2c8d96['sort']) ||
        _0x2c8d96['sort'] < 0x0 ||
        _0x2c8d96['sort'] > 0x1869f
      )
        throw new Error('教程排序无效');
      const _0x496d38 = _0x477b6d(_0x2c8d96['id'], 0x50, !![]);
      if (_0x385fbc['has'](_0x496d38)) throw new Error('教程 ID 重复');
      _0x385fbc['add'](_0x496d38);
      const _0xb6feda = { id: _0x496d38, enabled: _0x2c8d96['enabled'], sort: _0x2c8d96['sort'] };
      if (_0x521ef4 !== 'updates') {
        const _0x35fe7d = tutorialUrl(_0x2c8d96['videoUrl']),
          _0x3850f8 = _0x2c8d96['coverUrl'] ? tutorialUrl(_0x2c8d96['coverUrl'], { cover: !![] }) : '';
        if (
          !_0x35fe7d ||
          (_0x2c8d96['coverUrl'] && !_0x3850f8) ||
          !(_0x521ef4 === 'guides' ? ['guide'] : _0x4cc9a0)['includes'](_0x2c8d96['category'])
        )
          throw new Error('教程链接或分类无效');
        Object['assign'](_0xb6feda, {
          title: _0x477b6d(_0x2c8d96['title'], 0x78, !![]),
          description: _0x477b6d(_0x2c8d96['description'], 0x1f4),
          duration: _0x477b6d(_0x2c8d96['duration'], 0x18),
          videoUrl: _0x35fe7d,
          coverUrl: _0x3850f8,
          category: _0x2c8d96['category'],
        });
      } else {
        const _0x1f9648 = _0x477b6d(_0x2c8d96['date'], 0xa, !![]);
        if (!/^\d{4}-\d{2}-\d{2}$/['test'](_0x1f9648) || !Number['isFinite'](Date['parse'](_0x1f9648)))
          throw new Error('更新日期无效');
        Object['assign'](_0xb6feda, {
          version: _0x477b6d(_0x2c8d96['version'], 0x28, !![]),
          date: _0x1f9648,
          notes: _0x477b6d(_0x2c8d96['notes'], 0x2ee0, !![]),
        });
      }
      return _0xb6feda;
    })
      ['filter']((_0x3b7854) => _0x3b7854['enabled'])
      ['sort'](
        (_0x41a45b, _0x147d96) =>
          _0x41a45b['sort'] - _0x147d96['sort'] ||
          String(_0x147d96['date'] || '')['localeCompare'](_0x41a45b['date'] || ''),
      );
  }
  return _0x47e534;
}
export function createBundledTutorialCatalog(_0x5dc4f7, _0x25f027 = []) {
  const _0x16da49 = _0x25f027[0x0];
  return normalizeTutorialCatalog({
    schemaVersion: 0x1,
    revision: 0x0,
    guide: {
      title: _0x16da49?.['title'] || 'API 接入指南',
      url: _0x16da49?.['url'] || '',
      enabled: Boolean(_0x16da49?.['url']),
    },
    tutorials: _0x5dc4f7['map']((_0x41738a, _0x2697e1) => ({
      id: 'bundled-' + _0x2697e1,
      title: _0x41738a['title'],
      category: _0x41738a['category'] || (_0x2697e1 === 0x0 ? 'basic' : 'play'),
      description: '',
      duration: '',
      coverUrl: '',
      videoUrl: _0x41738a['url'],
      enabled: !![],
      sort: _0x2697e1,
    })),
    updates: [],
  });
}
export function getTutorialPlayback(_0x111ab0) {
  const _0x13ddff = tutorialUrl(_0x111ab0);
  if (!_0x13ddff) return null;
  const _0x3d98b9 = new URL(_0x13ddff),
    _0x6c622 = [
      'www.youtube.com',
      'youtube.com',
      'm.youtube.com',
      'www.youtube-nocookie.com',
      'youtube-nocookie.com',
      'youtu.be',
    ];
  if (_0x6c622['includes'](_0x3d98b9['hostname']['toLowerCase']())) {
    const _0x531844 =
      _0x3d98b9['hostname']['toLowerCase']() === 'youtu.be'
        ? _0x3d98b9['pathname']['replace'](/^\//, '')
        : _0x3d98b9['searchParams']['get']('v') ||
          _0x3d98b9['pathname']['match'](/^\/(?:shorts|embed)\/([^/?]+)/)?.[0x1];
    if (/^[a-zA-Z0-9_-]{6,20}$/['test'](_0x531844 || ''))
      return {
        type: 'youtube',
        url: _0x13ddff,
        thumbnailUrl: 'https://i.ytimg.com/vi/' + _0x531844 + '/hqdefault.jpg',
      };
  }
  if (['www.bilibili.com', 'bilibili.com', 'm.bilibili.com']['includes'](_0x3d98b9['hostname'])) {
    const _0x8417fc = _0x3d98b9['pathname']['match'](/^\/video\/(BV[a-zA-Z0-9]+|av\d+)\/?$/);
    if (_0x8417fc) {
      const _0x578e45 = new URL('https://player.bilibili.com/player.html');
      return (
        _0x578e45['searchParams']['set'](
          _0x8417fc[0x1]['startsWith']('BV') ? 'bvid' : 'aid',
          _0x8417fc[0x1]['replace'](/^av/, ''),
        ),
        _0x578e45['searchParams']['set'](
          'page',
          /^\d+$/['test'](_0x3d98b9['searchParams']['get']('p') || '')
            ? _0x3d98b9['searchParams']['get']('p')
            : '1',
        ),
        _0x578e45['searchParams']['set']('autoplay', '0'),
        { type: 'iframe', url: _0x578e45['href'] }
      );
    }
  }
  if (/\.(mp4|webm|ogg)$/i['test'](_0x3d98b9['pathname'])) return { type: 'video', url: _0x13ddff };
  return { type: 'external', url: _0x13ddff };
}

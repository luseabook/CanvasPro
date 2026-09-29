export function normalizeTextResultSources(_0x3b4ed4) {
  const _0x3d6f1d = new Map();
  for (const _0x5474e1 of Array['isArray'](_0x3b4ed4) ? _0x3b4ed4 : []) {
    if (typeof _0x5474e1?.['url'] !== 'string' || _0x5474e1['url']['length'] > 0x2000) continue;
    try {
      const _0x5abed2 = new URL(_0x5474e1['url']);
      if (
        !['http:', 'https:']['includes'](_0x5abed2['protocol']) ||
        _0x5abed2['username'] ||
        _0x5abed2['password']
      )
        continue;
      !_0x3d6f1d['has'](_0x5abed2['href']) &&
        _0x3d6f1d['set'](_0x5abed2['href'], {
          url: _0x5abed2['href'],
          title:
            String(_0x5474e1['title'] || _0x5abed2['hostname'])
              ['trim']()
              ['slice'](0x0, 0x1f4) || _0x5abed2['hostname'],
        });
    } catch {}
    if (_0x3d6f1d['size'] >= 0x64) break;
  }
  return [..._0x3d6f1d['values']()];
}
export function normalizeTextToolUsage(_0x434735) {
  if (!_0x434735 || typeof _0x434735 !== 'object' || Array['isArray'](_0x434735)) return null;
  return Object['fromEntries'](
    ['web_search', 'web_extractor', 'web_search_image', 'image_search']['flatMap']((_0x2e64eb) => {
      const _0x508836 = _0x434735[_0x2e64eb]?.['count'];
      return Number['isSafeInteger'](_0x508836) && _0x508836 >= 0x0
        ? [[_0x2e64eb, { count: _0x508836 }]]
        : [];
    }),
  );
}

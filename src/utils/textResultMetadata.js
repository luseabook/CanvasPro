export function normalizeTextResultSources(value) {
  const map = new Map();
  for (const response of Array['isArray'](value) ? value : []) {
    if (typeof response?.['url'] !== 'string' || response['url']['length'] > 8192) continue;
    try {
      const url = new URL(response['url']);
      if (!['http:', 'https:']['includes'](url['protocol']) || url['username'] || url['password']) continue;
      !map['has'](url['href']) &&
        map['set'](url['href'], {
          url: url['href'],
          title:
            String(response['title'] || url['hostname'])
              ['trim']()
              ['slice'](0, 500) || url['hostname'],
        });
    } catch {}
    if (map['size'] >= 100) break;
  }
  return [...map['values']()];
}
export function normalizeTextToolUsage(enabled) {
  if (!enabled || typeof enabled !== 'object' || Array['isArray'](enabled)) return null;
  return Object['fromEntries'](
    ['web_search', 'web_extractor', 'web_search_image', 'image_search']['flatMap']((item) => {
      const count = enabled[item]?.['count'];
      return Number['isSafeInteger'](count) && count >= 0 ? [[item, { count: count }]] : [];
    }),
  );
}

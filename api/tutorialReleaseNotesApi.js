export const TUTORIAL_RELEASES_URL = 'https://github.com/luseaer-ship-it/CanvasPro/releases';
const API_URL = 'https://api.github.com/repos/luseaer-ship-it/CanvasPro/releases?per_page=100';
export function normalizeTutorialReleases(list) {
  if (!Array['isArray'](list)) throw new Error('更新说明格式无效');
  return list['filter'](
    (enabled) =>
      enabled && !enabled['draft'] && !enabled['prerelease'] && typeof enabled['tag_name'] === 'string',
  )
    ['slice'](0, 100)
    ['map']((tag_name) => ({
      tag_name: tag_name['tag_name']['slice'](0, 100),
      name: String(tag_name['name'] || tag_name['tag_name'])['slice'](0, 200),
      published_at: String(tag_name['published_at'] || '')['slice'](0, 30),
      body: String(tag_name['body'] || '暂无详细说明')
        ['slice'](0, 100000)
        ['replace'](/^\[previewVideoUrl\]:.*$/gim, '')
        ['trim'](),
    }))
    ['sort']((value, item) => item['published_at']['localeCompare'](value['published_at']));
}
export async function fetchTutorialReleases({ signal: signal, timeout: timeout = 10000 } = {}) {
  const signal2 = new AbortController(),
    handler = () => signal2['abort']();
  if (signal?.['aborted']) handler();
  signal?.['addEventListener']('abort', handler, { once: true });
  const setTimeout2 = setTimeout(handler, timeout);
  try {
    const response = await fetch(API_URL, {
      signal: signal2['signal'],
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!response['ok']) throw new Error('GitHub 更新说明加载失败 (' + response['status'] + ')');
    const list2 = await response['text']();
    if (list2['length'] > 8 * 1024 * 1024) throw new Error('更新说明内容过大');
    return normalizeTutorialReleases(JSON['parse'](list2));
  } finally {
    (clearTimeout(setTimeout2), signal?.['removeEventListener']('abort', handler));
  }
}

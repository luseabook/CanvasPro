export const TUTORIAL_RELEASES_URL = 'https://github.com/luseaer-ship-it/CanvasPro/releases';
const API_URL = 'https://api.github.com/repos/luseaer-ship-it/CanvasPro/releases?per_page=100';
export function normalizeTutorialReleases(_0x166634) {
  if (!Array['isArray'](_0x166634)) throw new Error('更新说明格式无效');
  return _0x166634['filter'](
    (_0x502726) =>
      _0x502726 &&
      !_0x502726['draft'] &&
      !_0x502726['prerelease'] &&
      typeof _0x502726['tag_name'] === 'string',
  )
    ['slice'](0x0, 0x64)
    ['map']((_0x2d3923) => ({
      tag_name: _0x2d3923['tag_name']['slice'](0x0, 0x64),
      name: String(_0x2d3923['name'] || _0x2d3923['tag_name'])['slice'](0x0, 0xc8),
      published_at: String(_0x2d3923['published_at'] || '')['slice'](0x0, 0x1e),
      body: String(_0x2d3923['body'] || '暂无详细说明')
        ['slice'](0x0, 0x186a0)
        ['replace'](/^\[previewVideoUrl\]:.*$/gim, '')
        ['trim'](),
    }))
    ['sort']((_0x246c84, _0x1843b9) => _0x1843b9['published_at']['localeCompare'](_0x246c84['published_at']));
}
export async function fetchTutorialReleases({ signal: _0x3ac770, timeout: timeout = 0x2710 } = {}) {
  const _0x819509 = new AbortController(),
    _0x5989ce = () => _0x819509['abort']();
  if (_0x3ac770?.['aborted']) _0x5989ce();
  _0x3ac770?.['addEventListener']('abort', _0x5989ce, { once: !![] });
  const _0x15e2c1 = setTimeout(_0x5989ce, timeout);
  try {
    const _0x445809 = await fetch(API_URL, {
      signal: _0x819509['signal'],
      credentials: 'omit',
      cache: 'no-store',
    });
    if (!_0x445809['ok']) throw new Error('GitHub 更新说明加载失败 (' + _0x445809['status'] + ')');
    const _0x4089ad = await _0x445809['text']();
    if (_0x4089ad['length'] > 0x8 * 0x400 * 0x400) throw new Error('更新说明内容过大');
    return normalizeTutorialReleases(JSON['parse'](_0x4089ad));
  } finally {
    (clearTimeout(_0x15e2c1), _0x3ac770?.['removeEventListener']('abort', _0x5989ce));
  }
}

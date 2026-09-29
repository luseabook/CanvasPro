import { CONTENT_ORIGIN, normalizeTutorialCatalog } from '../src/modules/tutorials/tutorialCatalog.js';
export async function fetchTutorialContent({ signal: _0x47286b, timeout: timeout = 0x1f40 } = {}) {
  const _0x2bbca6 = new AbortController(),
    _0x5ddcfe = () => _0x2bbca6['abort']();
  if (_0x47286b?.['aborted']) _0x5ddcfe();
  _0x47286b?.['addEventListener']('abort', _0x5ddcfe, { once: !![] });
  const _0x4137d0 = setTimeout(_0x5ddcfe, timeout);
  try {
    const _0x5e6dea = await fetch(CONTENT_ORIGIN + '/api/subscription/canvas-content', {
      cache: 'no-store',
      credentials: 'omit',
      signal: _0x2bbca6['signal'],
    });
    if (!_0x5e6dea['ok']) throw new Error('教程加载失败\x20(' + _0x5e6dea['status'] + ')');
    const _0xc1e3fb = await _0x5e6dea['text']();
    if (_0xc1e3fb['length'] > 0x4 * 0x400 * 0x400) throw new Error('教程内容过大');
    return normalizeTutorialCatalog(JSON['parse'](_0xc1e3fb));
  } finally {
    (clearTimeout(_0x4137d0), _0x47286b?.['removeEventListener']('abort', _0x5ddcfe));
  }
}

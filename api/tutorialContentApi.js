import { CONTENT_ORIGIN, normalizeTutorialCatalog } from '../src/modules/tutorials/tutorialCatalog.js';
export async function fetchTutorialContent({ signal: signal, timeout: timeout = 0x1f40 } = {}) {
  const signal2 = new AbortController(),
    handler = () => signal2['abort']();
  if (signal?.['aborted']) handler();
  signal?.['addEventListener']('abort', handler, { once: !![] });
  const setTimeout2 = setTimeout(handler, timeout);
  try {
    const response = await fetch(CONTENT_ORIGIN + '/api/subscription/canvas-content', {
      cache: 'no-store',
      credentials: 'omit',
      signal: signal2['signal'],
    });
    if (!response['ok']) throw new Error('教程加载失败\x20(' + response['status'] + ')');
    const list = await response['text']();
    if (list['length'] > 0x4 * 0x400 * 0x400) throw new Error('教程内容过大');
    return normalizeTutorialCatalog(JSON['parse'](list));
  } finally {
    (clearTimeout(setTimeout2), signal?.['removeEventListener']('abort', handler));
  }
}

import { requester } from './requester.js';
import { normalizeLocalPath } from '../src/utils/localMediaPath.js';
import { buildApiUrl } from './apiUrl.js';
export function deferredMediaPreview(_0x6c5bc) {
  const _0x552021 = normalizeLocalPath(_0x6c5bc?.['localPath']);
  return _0x552021 && /^data\/assets\/_(?:deferred|hosted)\//['test'](_0x552021)
    ? { localPath: _0x552021, url: buildApiUrl(_0x552021) }
    : null;
}
export function withDeferredMediaFiles(
  _0xecd8b8,
  _0xf119cc,
  _0x206320 = (_0x3bb3ba) =>
    requester({
      url: '/api/v2/assets/resolve-files',
      provider: 'local',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON['stringify']({ paths: _0x3bb3ba }),
      timeout: 0x1e * 0x3c * 0x3e8,
    }),
) {
  const _0x534de1 = new Set(),
    _0xc2f94d = new WeakSet();
  function _0x101744(_0x1634e1) {
    if (typeof _0x1634e1 === 'string') {
      const _0x2c186c = normalizeLocalPath(_0x1634e1);
      if (_0x2c186c && /^data\/assets\/_(?:deferred|hosted)\//['test'](_0x2c186c))
        _0x534de1['add'](_0x2c186c);
    } else {
      if (
        _0x1634e1 &&
        typeof _0x1634e1 === 'object' &&
        (Array['isArray'](_0x1634e1) || Object['getPrototypeOf'](_0x1634e1) === Object['prototype']) &&
        !_0xc2f94d['has'](_0x1634e1)
      ) {
        _0xc2f94d['add'](_0x1634e1);
        for (const _0x3fd9ef of Object['values'](_0x1634e1)) _0x101744(_0x3fd9ef);
      }
    }
  }
  _0x101744(_0xecd8b8);
  if (!_0x534de1['size']) return _0xf119cc();
  return _0x206320([..._0x534de1])['then']((_0x21bdb8) => {
    if (_0x21bdb8?.['success'] === ![])
      throw new Error(_0x21bdb8['message'] || '读取所选素材失败，请确认房主仍在线');
    return _0xf119cc();
  });
}

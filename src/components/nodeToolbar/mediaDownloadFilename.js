import { getDownloadUseOriginalFilename } from '../../services/downloadNamingService.js';
const DEFAULT_EXTENSIONS = Object['freeze']({ image: 'png', video: 'mp4', audio: 'mp3' }),
  MEDIA_EXTENSIONS = Object['freeze']({
    image: new Set(['avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'tif', 'tiff', 'webp']),
    video: new Set(['avi', 'm4v', 'mkv', 'mov', 'mp4', 'mpeg', 'mpg', 'webm', 'wmv']),
    audio: new Set([
      'aac',
      'aiff',
      'amr',
      'flac',
      'm4a',
      'mp3',
      'oga',
      'ogg',
      'opus',
      'wav',
      'weba',
      'webm',
      'wma',
    ]),
  });
function trimText(_0x54828b) {
  return String(_0x54828b || '')['trim']();
}
function safeDecode(_0x5dd3ea) {
  try {
    return decodeURIComponent(_0x5dd3ea);
  } catch {
    return _0x5dd3ea;
  }
}
function basenameFromSource(_0x46af4b) {
  const _0x4c894b = trimText(_0x46af4b);
  if (!_0x4c894b || /^(?:blob:|data:)/i['test'](_0x4c894b)) return '';
  try {
    const _0x47bebd = new URL(
      _0x4c894b['replace'](/\\/g, '/'),
      globalThis['location']?.['href'] || 'http://localhost/',
    );
    return safeDecode(_0x47bebd['pathname']['split']('/')['filter'](Boolean)['pop']() || '');
  } catch {
    const _0x5d5bc0 = _0x4c894b['split'](/[?#]/, 0x1)[0x0]['replace'](/\\/g, '/');
    return safeDecode(_0x5d5bc0['split']('/')['filter'](Boolean)['pop']() || '');
  }
}
function sanitizeFilenamePart(_0xc4611) {
  return trimText(_0xc4611)
    ['replace'](/[\\/:*?"<>|\x00-\x1F]/g, '_')
    ['replace'](/[. ]+$/g, '')
    ['trim']();
}
function extensionFromSource(_0x1f77b3, _0x101214) {
  const _0x493a88 = basenameFromSource(_0x1f77b3) || trimText(_0x1f77b3);
  return extensionFromFilename(_0x493a88, _0x101214);
}
function extensionFromFilename(_0x274a53, _0x1e4159) {
  const _0x383f2c = _0x274a53['match'](/\.([a-z0-9]{1,10})$/i),
    _0x438aee = String(_0x383f2c?.[0x1] || '')['toLowerCase']();
  return MEDIA_EXTENSIONS[_0x1e4159]?.['has'](_0x438aee) ? _0x438aee : '';
}
function stripKnownMediaExtension(_0x38cb3a) {
  const _0xfbbae2 = _0x38cb3a['match'](/\.([a-z0-9]{1,10})$/i),
    _0x588b13 = String(_0xfbbae2?.[0x1] || '')['toLowerCase'](),
    _0x5695d6 = Object['values'](MEDIA_EXTENSIONS)['some']((_0x1b20a7) => _0x1b20a7['has'](_0x588b13));
  return _0x5695d6 ? _0x38cb3a['slice'](0x0, -_0xfbbae2[0x0]['length']) : _0x38cb3a;
}
function withExtension(_0x4ff1a5, _0x3d198a) {
  const _0x4d242c = sanitizeFilenamePart(stripKnownMediaExtension(_0x4ff1a5)),
    _0x57efe0 = Math['max'](0x1, 0xa0 - _0x3d198a['length'] - 0x1),
    _0x5e41ee = _0x4d242c['slice'](0x0, _0x57efe0)['replace'](/[. ]+$/g, '');
  return (_0x5e41ee || 'media') + '.' + _0x3d198a;
}
export function resolveNodeMediaDownloadFilename({
  nodeName: _0x51dfcd,
  fileName: _0x165914,
  kind: _0x24ca02,
  sources: sources = [],
  fallbackBase: _0x559ab1,
  useOriginalFilename: useOriginalFilename = getDownloadUseOriginalFilename(),
} = {}) {
  const _0x4eea51 = trimText(_0x24ca02)['toLowerCase'](),
    _0x288440 = DEFAULT_EXTENSIONS[_0x4eea51] || 'bin',
    _0xa58441 = Array['isArray'](sources) ? sources : [sources],
    _0x2edec5 = trimText(_0x165914)['replace'](/\\/g, '/')['split']('/')['pop'](),
    _0x39d2ba =
      extensionFromFilename(_0x2edec5, _0x4eea51) ||
      _0xa58441['map']((_0x2477bf) => extensionFromSource(_0x2477bf, _0x4eea51))['find'](Boolean) ||
      _0x288440,
    _0x26b65c = sanitizeFilenamePart(_0x51dfcd);
  if (!useOriginalFilename && _0x26b65c) return withExtension(_0x26b65c, _0x39d2ba);
  const _0x588e26 =
    sanitizeFilenamePart(_0x2edec5) ||
    _0xa58441['filter']((_0x1b3f71) => !useOriginalFilename || extensionFromSource(_0x1b3f71, _0x4eea51))
      ['map']((_0x49fa30) => sanitizeFilenamePart(basenameFromSource(_0x49fa30)))
      ['find'](Boolean);
  return withExtension(_0x588e26 || _0x26b65c || _0x559ab1 || _0x4eea51 || 'media', _0x39d2ba);
}

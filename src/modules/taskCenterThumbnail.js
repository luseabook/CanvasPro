import { localPathToUrl } from '../utils/localMediaPath.js';
const STILL_IMAGE = /\.(?:png|jpe?g|webp|avif|bmp)$/i;
export function resolveTaskCenterThumbnail(_0x317ec6, _0x3417b9 = '') {
  if (!_0x317ec6 || typeof _0x317ec6 !== 'object') return null;
  const _0xe5dbb1 = ['images', 'videos', 'audios']['find'](
      (_0x86424a) => Array['isArray'](_0x317ec6[_0x86424a]) && _0x317ec6[_0x86424a]['length'],
    ),
    _0xd85861 = _0xe5dbb1 ? _0x317ec6[_0xe5dbb1] : [_0x317ec6],
    _0x161b01 = _0xd85861[0x0] || {},
    _0x2884d2 = _0xe5dbb1
      ? { images: 'image', videos: 'video', audios: 'audio' }[_0xe5dbb1]
      : /video/['test'](_0x3417b9)
        ? 'video'
        : /audio/['test'](_0x3417b9)
          ? 'audio'
          : /image|appearance/['test'](_0x3417b9)
            ? 'image'
            : 'text',
    _0x1f5be5 = [
      'thumbLocalPath',
      'thumbnailLocalPath',
      'posterLocalPath',
      'coverLocalPath',
      'thumbUrl',
      'thumbnailUrl',
      'posterUrl',
      'coverUrl',
    ],
    _0x532428 =
      _0x1f5be5['map']((_0x44ae31) => localPathToUrl(_0x161b01[_0x44ae31]))['find']((_0x3021f6) =>
        STILL_IMAGE['test'](_0x3021f6),
      ) || '';
  return { src: _0x532428, kind: _0x2884d2, count: _0xd85861['length'] };
}

import { THUMBNAIL, IMAGE_COMPRESSION } from '../utils/constants.js';
import { fetchRemoteBlob } from '../../api/projectsV2Api.js';
export async function generateThumbnail(
  _0x2805b6,
  _0x3d1bea = THUMBNAIL.maxWidth,
  _0x54129f = THUMBNAIL.maxHeight,
) {
  if (!_0x2805b6) return '';
  return new Promise((_0x3441a0) => {
    const _0xcbaea8 = new Image();
    ((_0xcbaea8.crossOrigin = 'anonymous'),
      (_0xcbaea8.onload = () => {
        const _0x3e5da2 = document.createElement('canvas'),
          _0x54c88b = _0x3e5da2.getContext('2d');
        let _0x5e92da = _0xcbaea8.naturalWidth,
          _0x41ac98 = _0xcbaea8.naturalHeight;
        _0x5e92da > _0x41ac98
          ? _0x5e92da > _0x3d1bea && ((_0x41ac98 *= _0x3d1bea / _0x5e92da), (_0x5e92da = _0x3d1bea))
          : _0x41ac98 > _0x54129f && ((_0x5e92da *= _0x54129f / _0x41ac98), (_0x41ac98 = _0x54129f));
        ((_0x3e5da2.width = _0x5e92da),
          (_0x3e5da2.height = _0x41ac98),
          _0x54c88b.drawImage(_0xcbaea8, 0, 0, _0x5e92da, _0x41ac98));
        const _0x58d65d = _0x3e5da2.toDataURL(THUMBNAIL.format, THUMBNAIL.quality);
        ((_0x3e5da2.width = 0), (_0x3e5da2.height = 0), _0x3441a0(_0x58d65d));
      }),
      (_0xcbaea8.onerror = () => {
        _0x3441a0('');
      }),
      (_0xcbaea8.src = _0x2805b6));
  });
}
export async function compressImage(
  _0x404129,
  _0xd9290e = IMAGE_COMPRESSION.maxDimension,
  _0x2be007 = IMAGE_COMPRESSION.quality,
) {
  return new Promise((_0x542365, _0x84454d) => {
    const _0x5aca1d = new Image();
    ((_0x5aca1d.crossOrigin = 'Anonymous'),
      (_0x5aca1d.onload = () => {
        let { width: _0xbb21a4, height: _0x232fdd } = _0x5aca1d;
        (_0xbb21a4 > _0xd9290e || _0x232fdd > _0xd9290e) &&
          (_0xbb21a4 > _0x232fdd
            ? ((_0x232fdd = Math.round((_0x232fdd * _0xd9290e) / _0xbb21a4)), (_0xbb21a4 = _0xd9290e))
            : ((_0xbb21a4 = Math.round((_0xbb21a4 * _0xd9290e) / _0x232fdd)), (_0x232fdd = _0xd9290e)));
        const _0x3d8f71 = document.createElement('canvas');
        ((_0x3d8f71.width = _0xbb21a4), (_0x3d8f71.height = _0x232fdd));
        const _0x37711d = _0x3d8f71.getContext('2d');
        (_0x37711d.drawImage(_0x5aca1d, 0, 0, _0xbb21a4, _0x232fdd),
          _0x3d8f71.toBlob(
            (_0x11b8c0) => {
              _0x11b8c0 ? _0x542365(_0x11b8c0) : _0x84454d(new Error('Canvas toBlob failed'));
            },
            IMAGE_COMPRESSION.format,
            _0x2be007,
          ));
      }),
      (_0x5aca1d.onerror = (_0x4780fa) => {
        (console.warn('[imageUtils.js] 跨域或加载失败，跳过本地压缩', _0x4780fa), _0x84454d(_0x4780fa));
      }),
      fetchRemoteBlob(_0x404129)
        .then((_0xfc7218) => {
          _0x5aca1d.src = URL.createObjectURL(_0xfc7218);
        })
        .catch((_0x2de6f3) => {
          _0x5aca1d.src = _0x404129;
        }));
  });
}

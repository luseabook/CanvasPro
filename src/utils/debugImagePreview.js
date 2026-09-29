import { localPathToUrl } from './localMediaPath.js';
const IMAGE_FIELDS = new Set([
  'imageUrls',
  'inputUrls',
  'images',
  'referenceImages',
  'imageUrl',
  'image_url',
  'image',
  'firstFrameUrl',
  'lastFrameUrl',
  'startImageUrl',
  'endImageUrl',
  'maskUrl',
]);
export function resolveDebugImageSource(_0x24ff16) {
  if (typeof _0x24ff16 !== 'string' || !_0x24ff16 || /\*\*\*/['test'](_0x24ff16)) return '';
  if (/\.(?:mp4|webm|mov|mp3|wav|ogg|flac)(?:[?#]|$)/i['test'](_0x24ff16)) return '';
  if (
    /^https?:\/\//i['test'](_0x24ff16) ||
    /^blob:https?:\/\//i['test'](_0x24ff16) ||
    /^data:image\/(?:png|jpeg|jpg|webp|gif|avif|svg\+xml)[;,]/i['test'](_0x24ff16)
  )
    return _0x24ff16;
  return localPathToUrl(_0x24ff16);
}
export function buildDebugJsonPreview(_0x18eb8f, { imageContext: imageContext = ![] } = {}) {
  const _0x4a1363 = JSON['stringify'](_0x18eb8f, null, 0x2) ?? '',
    _0x28eee9 = [];
  let _0xb027da = 0x0;
  function _0x3ddb49(_0x474f32, _0x27e409, _0x2119e5 = ![], _0x539cc9 = 0x0) {
    if (Array['isArray'](_0x474f32))
      _0x474f32['forEach']((_0x2d4f7a, _0x585fd1) =>
        _0x3ddb49(_0x2d4f7a, _0x27e409 + '[' + _0x585fd1 + ']', _0x2119e5, _0x585fd1 + 0x1),
      );
    else {
      if (_0x474f32 && typeof _0x474f32 === 'object')
        Object['entries'](_0x474f32)['forEach'](([_0x1d3763, _0x31df7c]) => {
          if (_0x31df7c === undefined || typeof _0x31df7c === 'function') return;
          const _0x5672c4 = JSON['stringify'](_0x1d3763) + ':';
          ((_0xb027da = _0x4a1363['indexOf'](_0x5672c4, _0xb027da) + _0x5672c4['length']),
            _0x3ddb49(
              _0x31df7c,
              _0x27e409 ? _0x27e409 + '.' + _0x1d3763 : _0x1d3763,
              IMAGE_FIELDS['has'](_0x1d3763) || (_0x2119e5 && ['url', 'ref']['includes'](_0x1d3763)),
              Number(_0x474f32['slot']) || _0x539cc9,
            ));
        });
      else {
        const _0x473085 = JSON['stringify'](_0x474f32) ?? 'null',
          _0x117d6e = _0x4a1363['indexOf'](_0x473085, _0xb027da);
        _0xb027da = _0x117d6e + _0x473085['length'];
        const _0x3355f7 = _0x2119e5 ? resolveDebugImageSource(_0x474f32) : '';
        if (_0x3355f7 && _0x117d6e >= 0x0)
          _0x28eee9['push']({
            start: _0x117d6e,
            end: _0xb027da,
            src: _0x3355f7,
            path: _0x27e409,
            label: _0x539cc9 ? '图' + _0x539cc9 : _0x27e409,
          });
      }
    }
  }
  if (_0x4a1363) _0x3ddb49(JSON['parse'](_0x4a1363), '', imageContext);
  return { content: _0x4a1363, images: _0x28eee9 };
}

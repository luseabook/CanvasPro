import { isAdaptiveRatioLabel } from '../../imageRatioPolicy.js';
export function bailianImage({
  currentBody: _0x1b3d42,
  payload: _0x24cdca,
  inputImages: _0x10f339,
  finalPrompt: _0x33b777,
}) {
  if (_0x10f339['length'] > 0x3) throw new Error('Qwen Image 3.0 最多支持 3 张参考图');
  const _0x42b15f = _0x24cdca['generationParams'] || {},
    _0x2dbb85 = String(_0x24cdca['resolvedRatioLabel'] || _0x42b15f['aspectRatio'] || '1:1'),
    [_0x287c1b, _0xcd9265] = (isAdaptiveRatioLabel(_0x2dbb85) ? '1:1' : _0x2dbb85)
      ['split'](':')
      ['map'](Number);
  if (!(_0x287c1b > 0x0 && _0xcd9265 > 0x0)) throw new Error('无效的图像比例');
  const _0x383ac5 = _0x42b15f['imageSize'] === '2K' ? 0x800 : 0x400,
    _0x48aa01 = Math['floor']((_0x383ac5 * Math['sqrt'](_0x287c1b / _0xcd9265)) / 0x10) * 0x10,
    _0x30a5fd = Math['floor']((_0x383ac5 * Math['sqrt'](_0xcd9265 / _0x287c1b)) / 0x10) * 0x10;
  return {
    ..._0x1b3d42,
    input: {
      messages: [
        {
          role: 'user',
          content: [..._0x10f339['map']((_0x34600d) => ({ image: _0x34600d })), { text: _0x33b777 }],
        },
      ],
    },
    parameters: { ..._0x1b3d42['parameters'], size: _0x48aa01 + '*' + _0x30a5fd },
  };
}
export function bailianVideo({
  currentBody: _0x7cf2c0,
  payload: _0x3a4fd8,
  inputImages: _0x28690f,
  inputVideos: _0x36891c,
  inputAudios: _0x449335,
  finalUrlsBySlot: _0xe1719f,
}) {
  const _0x1ddc6a = _0x3a4fd8['generationParams'] || {},
    _0x5d3d4f = _0x1ddc6a['generation_type'] === 'frame';
  if (_0x5d3d4f && (_0x28690f['length'] > 0x2 || _0x36891c['length'] || _0x449335['length']))
    throw new Error('Wan 3.0 首尾帧模式仅支持 1–2 张图片，不能混入视频或音频');
  if (_0x28690f['length'] > 0xa || _0x36891c['length'] > 0x5 || _0x449335['length'] > 0x5)
    throw new Error('Wan 3.0 参考素材超过数量上限');
  if (_0x5d3d4f && _0xe1719f['lastFrame'] && !_0xe1719f['firstFrame'])
    throw new Error('请先添加首帧图片，再添加尾帧');
  const _0x1708de = _0x5d3d4f
      ? _0x28690f['map']((_0x147304, _0x4bde9f) => ({
          type: _0x4bde9f === 0x0 ? 'first_frame' : 'last_frame',
          url: _0x147304,
        }))
      : [
          ..._0x28690f['map']((_0x3a0fc6) => ({ type: 'reference_image', url: _0x3a0fc6 })),
          ..._0x36891c['map']((_0x4d3e40) => ({ type: 'reference_video', url: _0x4d3e40 })),
          ..._0x449335['map']((_0x3a6a98) => ({ type: 'reference_audio', url: _0x3a6a98 })),
        ],
    _0x2ea310 = _0x1ddc6a['aspectRatio'];
  return {
    ..._0x7cf2c0,
    input: { ..._0x7cf2c0['input'], ...(_0x1708de['length'] ? { media: _0x1708de } : {}) },
    parameters: {
      resolution: _0x1ddc6a['resolution'],
      ratio: isAdaptiveRatioLabel(_0x2ea310) ? 'adaptive' : _0x2ea310,
      duration: Number(_0x1ddc6a['duration']),
      audio: _0x1ddc6a['audio'],
      prompt_extend: _0x1ddc6a['prompt_extend'],
      watermark: _0x1ddc6a['watermark'],
      ...(Number['isInteger'](_0x1ddc6a['seed']) && _0x1ddc6a['seed'] >= 0x0
        ? { seed: _0x1ddc6a['seed'] }
        : {}),
    },
  };
}

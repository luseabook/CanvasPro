import { resolveMinimaxH3Request } from './minimaxH3VideoResolverShared.js';
function createMediaContent(_0x201594, _0x14274b, _0x426faf) {
  return { type: _0x201594, [_0x201594]: { url: _0x426faf }, role: _0x14274b };
}
export function minimaxH3Video({
  currentBody: _0x1e5a99,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x5a8f2c = resolveMinimaxH3Request({
      currentBody: _0x1e5a99,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
      payload: payload,
      finalPrompt: finalPrompt,
      finalUrlsBySlot: finalUrlsBySlot,
      modeFieldId: 'minimax_h3_mode',
      providerLabel: 'MiniMAX',
    }),
    _0x35da51 = [{ type: 'text', text: _0x5a8f2c['prompt'] }];
  return (
    _0x5a8f2c['mode'] === 'reference'
      ? (_0x5a8f2c['referenceImages']['forEach']((_0x41f04f) => {
          _0x35da51['push'](createMediaContent('image_url', 'reference_image', _0x41f04f));
        }),
        _0x5a8f2c['referenceVideos']['forEach']((_0x4031f1) => {
          _0x35da51['push'](createMediaContent('video_url', 'reference_video', _0x4031f1));
        }),
        _0x5a8f2c['referenceAudios']['forEach']((_0x7c5884) => {
          _0x35da51['push'](createMediaContent('audio_url', 'reference_audio', _0x7c5884));
        }))
      : (_0x5a8f2c['firstFrameImage'] &&
          _0x35da51['push'](createMediaContent('image_url', 'first_frame', _0x5a8f2c['firstFrameImage'])),
        _0x5a8f2c['lastFrameImage'] &&
          _0x35da51['push'](createMediaContent('image_url', 'last_frame', _0x5a8f2c['lastFrameImage']))),
    {
      model: String(_0x1e5a99?.['model'] || 'MiniMax-H3')['trim']() || 'MiniMax-H3',
      content: _0x35da51,
      resolution: _0x5a8f2c['resolution'],
      duration: _0x5a8f2c['duration'],
      ratio: _0x5a8f2c['ratio'],
      aigc_watermark: _0x5a8f2c['watermark'],
    }
  );
}

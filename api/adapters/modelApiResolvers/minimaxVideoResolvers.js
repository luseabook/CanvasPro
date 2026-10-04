import { resolveMinimaxH3Request } from './minimaxH3VideoResolverShared.js';
function createMediaContent(type, role, url) {
  return { type: type, [type]: { url: url }, role: role };
}
export function minimaxH3Video({
  currentBody: currentBody,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const text = resolveMinimaxH3Request({
      currentBody: currentBody,
      inputImages: inputImages,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
      payload: payload,
      finalPrompt: finalPrompt,
      finalUrlsBySlot: finalUrlsBySlot,
      modeFieldId: 'minimax_h3_mode',
      providerLabel: 'MiniMAX',
    }),
    content = [{ type: 'text', text: text['prompt'] }];
  return (
    text['mode'] === 'reference'
      ? (text['referenceImages']['forEach']((value) => {
          content['push'](createMediaContent('image_url', 'reference_image', value));
        }),
        text['referenceVideos']['forEach']((item) => {
          content['push'](createMediaContent('video_url', 'reference_video', item));
        }),
        text['referenceAudios']['forEach']((key) => {
          content['push'](createMediaContent('audio_url', 'reference_audio', key));
        }))
      : (text['firstFrameImage'] &&
          content['push'](createMediaContent('image_url', 'first_frame', text['firstFrameImage'])),
        text['lastFrameImage'] &&
          content['push'](createMediaContent('image_url', 'last_frame', text['lastFrameImage']))),
    {
      model: String(currentBody?.['model'] || 'MiniMax-H3')['trim']() || 'MiniMax-H3',
      content: content,
      resolution: text['resolution'],
      duration: text['duration'],
      ratio: text['ratio'],
      aigc_watermark: text['watermark'],
    }
  );
}

import { isAdaptiveRatioLabel } from '../../imageRatioPolicy.js';
export function bailianImage({
  currentBody: currentBody,
  payload: payload,
  inputImages: inputImages,
  finalPrompt: finalPrompt,
}) {
  if (inputImages['length'] > 3) throw new Error('Qwen Image 3.0 最多支持 3 张参考图');
  const value = payload['generationParams'] || {},
    item = String(payload['resolvedRatioLabel'] || value['aspectRatio'] || '1:1'),
    [count, count2] = (isAdaptiveRatioLabel(item) ? '1:1' : item)['split'](':')['map'](Number);
  if (!(count > 0 && count2 > 0)) throw new Error('无效的图像比例');
  const key = value['imageSize'] === '2K' ? 2048 : 1024,
    size = Math['floor']((key * Math['sqrt'](count / count2)) / 16) * 16,
    index = Math['floor']((key * Math['sqrt'](count2 / count)) / 16) * 16;
  return {
    ...currentBody,
    input: {
      messages: [
        {
          role: 'user',
          content: [...inputImages['map']((image) => ({ image: image })), { text: finalPrompt }],
        },
      ],
    },
    parameters: { ...currentBody['parameters'], size: size + '*' + index },
  };
}
export function bailianVideo({
  currentBody: currentBody2,
  payload: payload2,
  inputImages: inputImages2,
  inputVideos: inputVideos,
  inputAudios: inputAudios,
  finalUrlsBySlot: finalUrlsBySlot,
}) {
  const resolution = payload2['generationParams'] || {},
    result = resolution['generation_type'] === 'frame';
  if (result && (inputImages2['length'] > 2 || inputVideos['length'] || inputAudios['length']))
    throw new Error('Wan 3.0 首尾帧模式仅支持 1–2 张图片，不能混入视频或音频');
  if (inputImages2['length'] > 10 || inputVideos['length'] > 5 || inputAudios['length'] > 5)
    throw new Error('Wan 3.0 参考素材超过数量上限');
  if (result && finalUrlsBySlot['lastFrame'] && !finalUrlsBySlot['firstFrame'])
    throw new Error('请先添加首帧图片，再添加尾帧');
  const media = result
      ? inputImages2['map']((url, type) => ({
          type: type === 0 ? 'first_frame' : 'last_frame',
          url: url,
        }))
      : [
          ...inputImages2['map']((url2) => ({ type: 'reference_image', url: url2 })),
          ...inputVideos['map']((url3) => ({ type: 'reference_video', url: url3 })),
          ...inputAudios['map']((url4) => ({ type: 'reference_audio', url: url4 })),
        ],
    data = resolution['aspectRatio'];
  return {
    ...currentBody2,
    input: { ...currentBody2['input'], ...(media['length'] ? { media: media } : {}) },
    parameters: {
      resolution: resolution['resolution'],
      ratio: isAdaptiveRatioLabel(data) ? 'adaptive' : data,
      duration: Number(resolution['duration']),
      audio: resolution['audio'],
      prompt_extend: resolution['prompt_extend'],
      watermark: resolution['watermark'],
      ...(Number['isInteger'](resolution['seed']) && resolution['seed'] >= 0
        ? { seed: resolution['seed'] }
        : {}),
    },
  };
}

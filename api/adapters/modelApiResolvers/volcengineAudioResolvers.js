import { normalizeInputList, stripPrefix } from './sharedResolverUtils.js';
const VOLCENGINE_DOUBAO_AUDIO_REFERENCE_LIMIT = 0x3;
function normalizeIntegerParam(value, item, key, index) {
  const result = Number(value);
  if (!Number['isFinite'](result)) return item;
  return Math['max'](key, Math['min'](index, Math['round'](result)));
}
function normalizeAudioFormat(data) {
  const options = String(data || '')
    ['trim']()
    ['toLowerCase']();
  return ['wav', 'mp3', 'm4a']['includes'](options) ? options : 'mp3';
}
function hasReferenceMention(target, count) {
  const enabled = String(target || '');
  if (!enabled || count <= 0x0) return ![];
  for (let source = 0x1; source <= count; source += 0x1) {
    const regExp = new RegExp('@(音频|audio)\x5cs*' + source + '\x5cb', 'i');
    if (regExp['test'](enabled)) return !![];
  }
  return ![];
}
function normalizeReferenceMentionsForApi(next) {
  return String(next || '')
    ['trim']()
    ['replace'](/@(音频|audio)\s*([1-9]\d*)\b/gi, (current, entry, record) => {
      return '@audio' + Number(record);
    });
}
function withDefaultReferencePrompt(handle, length) {
  const enabled2 = String(handle || '')['trim']();
  if (!enabled2 || length <= 0x0 || hasReferenceMention(enabled2, length))
    return normalizeReferenceMentionsForApi(enabled2);
  const state = Array['from']({ length: length }, (config, scope) => '@audio' + (scope + 0x1))['join']('、');
  return '请参考 ' + state + '\x20的声音特征，' + normalizeReferenceMentionsForApi(enabled2);
}
export function volcengineDoubaoAudioGeneration({
  currentBody: currentBody,
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  modelToken: modelToken = '',
}) {
  const watermark = { ...currentBody },
    input =
      payload?.['generationParams'] &&
      typeof payload['generationParams'] === 'object' &&
      !Array['isArray'](payload['generationParams'])
        ? payload['generationParams']
        : {},
    enabled3 = String(watermark['text_prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!enabled3) throw new Error('Doubao 音频生成需要输入合成文本或效果提示词');
  const list = normalizeInputList(inputAudios)['slice'](0x0, VOLCENGINE_DOUBAO_AUDIO_REFERENCE_LIMIT),
    references = list['map']((audio_url) => ({ audio_url: audio_url })),
    text_prompt = withDefaultReferencePrompt(enabled3, references['length']),
    model =
      modelToken || watermark['model'] || stripPrefix(payload['model'], 'volcengine/') || 'seed-audio-1.0';
  return {
    model: model,
    text_prompt: text_prompt,
    ...(references['length'] > 0x0 ? { references: references } : {}),
    audio_config: {
      format: normalizeAudioFormat(input['format'] ?? watermark['format']),
      sample_rate: 0x5dc0,
      pitch_rate: normalizeIntegerParam(input['pitch'] ?? watermark['pitch'], 0x0, -0xc, 0xc),
      speech_rate: normalizeIntegerParam(input['speechRate'] ?? watermark['speech_rate'], 0x0, -0x32, 0x64),
      loudness_rate: normalizeIntegerParam(
        input['loudnessRate'] ?? watermark['loudness_rate'],
        0x0,
        -0x32,
        0x64,
      ),
    },
    watermark:
      watermark['watermark'] && typeof watermark['watermark'] === 'object' ? watermark['watermark'] : {},
  };
}

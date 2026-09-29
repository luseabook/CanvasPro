import { normalizeInputList, stripPrefix } from './sharedResolverUtils.js';
const VOLCENGINE_DOUBAO_AUDIO_REFERENCE_LIMIT = 0x3;
function normalizeIntegerParam(_0x5a1f20, _0x318f10, _0x2188d0, _0x2f5b1f) {
  const _0x5891ba = Number(_0x5a1f20);
  if (!Number['isFinite'](_0x5891ba)) return _0x318f10;
  return Math['max'](_0x2188d0, Math['min'](_0x2f5b1f, Math['round'](_0x5891ba)));
}
function normalizeAudioFormat(_0x5f468c) {
  const _0x17995b = String(_0x5f468c || '')
    ['trim']()
    ['toLowerCase']();
  return ['wav', 'mp3', 'm4a']['includes'](_0x17995b) ? _0x17995b : 'mp3';
}
function hasReferenceMention(_0x5a8d5e, _0x2472a0) {
  const _0x22fc38 = String(_0x5a8d5e || '');
  if (!_0x22fc38 || _0x2472a0 <= 0x0) return ![];
  for (let _0x24d171 = 0x1; _0x24d171 <= _0x2472a0; _0x24d171 += 0x1) {
    const _0xba84ce = new RegExp('@(音频|audio)\x5cs*' + _0x24d171 + '\x5cb', 'i');
    if (_0xba84ce['test'](_0x22fc38)) return !![];
  }
  return ![];
}
function normalizeReferenceMentionsForApi(_0xddb2ea) {
  return String(_0xddb2ea || '')
    ['trim']()
    ['replace'](/@(音频|audio)\s*([1-9]\d*)\b/gi, (_0x2608ac, _0x3c0221, _0x251464) => {
      return '@audio' + Number(_0x251464);
    });
}
function withDefaultReferencePrompt(_0x39b909, _0x1029ff) {
  const _0x3a1ea8 = String(_0x39b909 || '')['trim']();
  if (!_0x3a1ea8 || _0x1029ff <= 0x0 || hasReferenceMention(_0x3a1ea8, _0x1029ff))
    return normalizeReferenceMentionsForApi(_0x3a1ea8);
  const _0x5d0efc = Array['from'](
    { length: _0x1029ff },
    (_0x38aa38, _0x43833b) => '@audio' + (_0x43833b + 0x1),
  )['join']('、');
  return '请参考 ' + _0x5d0efc + '\x20的声音特征，' + normalizeReferenceMentionsForApi(_0x3a1ea8);
}
export function volcengineDoubaoAudioGeneration({
  currentBody: _0x2ac9b0,
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  modelToken: modelToken = '',
}) {
  const _0x19179a = { ..._0x2ac9b0 },
    _0x1fce89 =
      payload?.['generationParams'] &&
      typeof payload['generationParams'] === 'object' &&
      !Array['isArray'](payload['generationParams'])
        ? payload['generationParams']
        : {},
    _0x5743d0 = String(_0x19179a['text_prompt'] || finalPrompt || payload?.['prompt'] || '')['trim']();
  if (!_0x5743d0) throw new Error('Doubao 音频生成需要输入合成文本或效果提示词');
  const _0x127ba5 = normalizeInputList(inputAudios)['slice'](0x0, VOLCENGINE_DOUBAO_AUDIO_REFERENCE_LIMIT),
    _0x4b92b1 = _0x127ba5['map']((_0x1d8aea) => ({ audio_url: _0x1d8aea })),
    _0x46093e = withDefaultReferencePrompt(_0x5743d0, _0x4b92b1['length']),
    _0x2fb48f =
      modelToken || _0x19179a['model'] || stripPrefix(payload['model'], 'volcengine/') || 'seed-audio-1.0';
  return {
    model: _0x2fb48f,
    text_prompt: _0x46093e,
    ...(_0x4b92b1['length'] > 0x0 ? { references: _0x4b92b1 } : {}),
    audio_config: {
      format: normalizeAudioFormat(_0x1fce89['format'] ?? _0x19179a['format']),
      sample_rate: 0x5dc0,
      pitch_rate: normalizeIntegerParam(_0x1fce89['pitch'] ?? _0x19179a['pitch'], 0x0, -0xc, 0xc),
      speech_rate: normalizeIntegerParam(
        _0x1fce89['speechRate'] ?? _0x19179a['speech_rate'],
        0x0,
        -0x32,
        0x64,
      ),
      loudness_rate: normalizeIntegerParam(
        _0x1fce89['loudnessRate'] ?? _0x19179a['loudness_rate'],
        0x0,
        -0x32,
        0x64,
      ),
    },
    watermark:
      _0x19179a['watermark'] && typeof _0x19179a['watermark'] === 'object' ? _0x19179a['watermark'] : {},
  };
}

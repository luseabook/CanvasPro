import { appendUniqueUrl, normalizeInputList, normalizeInputUrlsBySlot } from './sharedResolverUtils.js';
import { translateMinimaxH3EditorAssetMentions } from '../minimaxH3Prompt.js';
const MINIMAX_H3_RATIOS = new Set(['adaptive', '21:9', '16:9', '4:3', '1:1', '3:4', '9:16']);
function normalizeMode(_0x386f07) {
  const _0x4ca3db = String(_0x386f07 || '')
    ['trim']()
    ['toLowerCase']();
  return _0x4ca3db === 'reference' || _0x4ca3db === 'multimodal' ? 'reference' : 'frames';
}
function normalizeDuration(_0x284f19) {
  const _0x264367 = Math['trunc'](Number(_0x284f19));
  return Number['isFinite'](_0x264367) && _0x264367 >= 0x4 && _0x264367 <= 0xf ? _0x264367 : 0x5;
}
function normalizeResolution(_0x53ba13) {
  return String(_0x53ba13 || '')
    ['trim']()
    ['toUpperCase']() === '768P'
    ? '768P'
    : '2K';
}
function normalizeRatio(_0x57f1dc, { allowAdaptive: _0x4ead56 }) {
  const _0x4a39f1 = String(_0x57f1dc || '')['trim'](),
    _0x3a38e7 = _0x4a39f1['toLowerCase'](),
    _0x2a7ae3 =
      _0x4a39f1 === '自适应' || ['auto', 'default']['includes'](_0x3a38e7)
        ? 'adaptive'
        : _0x3a38e7 || 'adaptive';
  if (!MINIMAX_H3_RATIOS['has'](_0x2a7ae3)) return '16:9';
  return _0x2a7ae3 === 'adaptive' && !_0x4ead56 ? '16:9' : _0x2a7ae3;
}
function collectImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
  slotIds: slotIds = [],
}) {
  const _0x38745d = [],
    _0x4e882c = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x412c48 = new Set(normalizeInputList(slotIds['map']((_0x5ebaab) => _0x4e882c[_0x5ebaab])));
  return (
    slotIds['forEach']((_0x565cba) => appendUniqueUrl(_0x38745d, _0x4e882c[_0x565cba])),
    normalizeInputList(inputImages)['forEach']((_0x7297e0) => {
      if (!_0x412c48['has'](_0x7297e0)) appendUniqueUrl(_0x38745d, _0x7297e0);
    }),
    { images: _0x38745d, slotUrls: _0x4e882c }
  );
}
function resolveFrameInputs({ inputImages: inputImages = [], finalUrlsBySlot: finalUrlsBySlot = {} }) {
  const { images: _0x24ddb4, slotUrls: _0x155f7a } = collectImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['firstFrame', 'lastFrame'],
    }),
    _0x3b2c67 = new Set(normalizeInputList([_0x155f7a['firstFrame'], _0x155f7a['lastFrame']])),
    _0x20752c = normalizeInputList(inputImages)['filter']((_0x5a8f73) => !_0x3b2c67['has'](_0x5a8f73));
  let _0x524d74 = String(_0x155f7a['firstFrame'] || '')['trim'](),
    _0x48cb6d = String(_0x155f7a['lastFrame'] || '')['trim']();
  return (
    !_0x524d74 && _0x20752c['length'] > 0x0 && (_0x524d74 = _0x20752c['shift']()),
    !_0x48cb6d && _0x20752c['length'] > 0x0 && (_0x48cb6d = _0x20752c['shift']()),
    { count: _0x24ddb4['length'], firstFrameImage: _0x524d74, lastFrameImage: _0x48cb6d }
  );
}
export function resolveMinimaxH3Request({
  currentBody: currentBody = {},
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modeFieldId: _0x59f45b,
  providerLabel: _0x463141,
  allowStandaloneAudioReference: allowStandaloneAudioReference = ![],
}) {
  const _0x2c47d6 = { ...currentBody },
    _0x4ee862 = translateMinimaxH3EditorAssetMentions(
      _0x2c47d6['prompt'] || finalPrompt || payload?.['prompt'] || '',
    )['trim']();
  if (!_0x4ee862) throw new Error(_0x463141 + ' MiniMax-H3 prompt is required');
  if (_0x4ee862['length'] > 0x1b58)
    throw new Error(_0x463141 + ' MiniMax-H3 prompt must not exceed 7000 characters');
  const _0x41d4ea = normalizeMode(
      _0x2c47d6[_0x59f45b] || payload?.['generationParams']?.[_0x59f45b] || payload?.[_0x59f45b],
    ),
    _0x4c4a9f = normalizeResolution(_0x2c47d6['resolution']),
    _0x5a9a0e = normalizeDuration(_0x2c47d6['duration']),
    _0x16cf7b = Boolean(_0x2c47d6['aigc_watermark'] ?? _0x2c47d6['watermark'] ?? ![]),
    _0x44cb5b = normalizeInputList(inputVideos),
    _0x1d64ed = normalizeInputList(inputAudios);
  if (_0x41d4ea === 'reference') {
    const { images: _0x54200d } = collectImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
      slotIds: ['referenceImage'],
    });
    if (_0x54200d['length'] > 0x9)
      throw new Error(
        _0x463141 + '\x20MiniMax-H3\x20reference\x20mode\x20supports\x20at\x20most\x209\x20image\x20inputs',
      );
    if (_0x44cb5b['length'] > 0x3)
      throw new Error(_0x463141 + ' MiniMax-H3 reference mode supports at most 3 video inputs');
    if (_0x1d64ed['length'] > 0x3)
      throw new Error(_0x463141 + ' MiniMax-H3 reference mode supports at most 3 audio inputs');
    if (
      !allowStandaloneAudioReference &&
      _0x1d64ed['length'] > 0x0 &&
      _0x54200d['length'] === 0x0 &&
      _0x44cb5b['length'] === 0x0
    )
      throw new Error(
        _0x463141 +
          '\x20MiniMax-H3\x20audio\x20references\x20require\x20an\x20image\x20or\x20video\x20reference',
      );
    return {
      mode: _0x41d4ea,
      prompt: _0x4ee862,
      resolution: _0x4c4a9f,
      duration: _0x5a9a0e,
      watermark: _0x16cf7b,
      ratio: normalizeRatio(
        _0x2c47d6['ratio'] ||
          _0x2c47d6['aspect_ratio'] ||
          payload?.['generationParams']?.['aspectRatio'] ||
          payload?.['aspectRatio'],
        { allowAdaptive: !![] },
      ),
      referenceImages: _0x54200d,
      referenceVideos: _0x44cb5b,
      referenceAudios: _0x1d64ed,
    };
  }
  if (_0x44cb5b['length'] > 0x0 || _0x1d64ed['length'] > 0x0)
    throw new Error(
      _0x463141 +
        ' MiniMax-H3 first-last-frame mode accepts images only; use reference mode for video or audio inputs',
    );
  const _0x2f9083 = resolveFrameInputs({ inputImages: inputImages, finalUrlsBySlot: finalUrlsBySlot });
  if (_0x2f9083['count'] > 0x2)
    throw new Error(_0x463141 + ' MiniMax-H3 first-last-frame mode supports at most 2 image inputs');
  return {
    mode: _0x41d4ea,
    prompt: _0x4ee862,
    resolution: _0x4c4a9f,
    duration: _0x5a9a0e,
    watermark: _0x16cf7b,
    ratio:
      _0x2f9083['count'] > 0x0
        ? 'adaptive'
        : normalizeRatio(
            _0x2c47d6['ratio'] ||
              _0x2c47d6['aspect_ratio'] ||
              payload?.['generationParams']?.['aspectRatio'] ||
              payload?.['aspectRatio'],
            { allowAdaptive: ![] },
          ),
    firstFrameImage: _0x2f9083['firstFrameImage'],
    lastFrameImage: _0x2f9083['lastFrameImage'],
  };
}

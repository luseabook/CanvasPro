import { normalizeRatioLabelText } from '../../imageRatioPolicy.js';
import {
  appendUniqueUrl,
  normalizeInputList,
  normalizeInputUrlsBySlot,
  normalizeOptionalIntegerInRange,
  normalizePositiveInteger,
  stripPrefix,
} from './sharedResolverUtils.js';
function normalizeSeedanceRouteMode(_0x4a0c72) {
  const _0x376444 = String(_0x4a0c72 || '')
    ['trim']()
    ['toLowerCase']();
  if (_0x376444 === 'multimodal2video' || _0x376444 === 'reference') return 'multimodal2video';
  if (_0x376444 === 'frames2video' || _0x376444 === 'frames') return 'frames2video';
  if (_0x376444 === 'image2video' || _0x376444 === 'image' || _0x376444 === 'frame') return 'image2video';
  return 'text2video';
}
function getVolcengineSeedance2Mode(_0x193b5c = {}, _0x311b96 = {}) {
  return normalizeSeedanceRouteMode(
    _0x193b5c?.['dreaminaRouteMode'] ||
      _0x193b5c?.['dreaminaTaskType'] ||
      _0x193b5c?.['generationParams']?.['dreaminaRouteMode'] ||
      _0x311b96['volcengine_seedance_2_mode'] ||
      _0x193b5c?.['generationParams']?.['volcengine_seedance_2_mode'] ||
      _0x193b5c?.['volcengine_seedance_2_mode'],
  );
}
function resolveVolcengineSeedance2TaskType({
  routeMode: routeMode = '',
  frameImageCount: frameImageCount = 0x0,
  referenceImageCount: referenceImageCount = 0x0,
  videoCount: videoCount = 0x0,
  audioCount: audioCount = 0x0,
} = {}) {
  const _0x55c6f8 = normalizeSeedanceRouteMode(routeMode),
    _0x3938d3 = normalizePositiveInteger(frameImageCount, 0x0),
    _0x2b8a1a = normalizePositiveInteger(referenceImageCount, 0x0),
    _0xaf73f8 = normalizePositiveInteger(videoCount, 0x0),
    _0x4bf5f6 = normalizePositiveInteger(audioCount, 0x0);
  if (_0x55c6f8 === 'frames2video') {
    if (_0x3938d3 >= 0x2) return 'frames2video';
    if (_0x3938d3 === 0x1) return 'image2video';
    return 'text2video';
  }
  if (_0x55c6f8 === 'image2video') return 'image2video';
  if (_0x55c6f8 === 'text2video') return 'text2video';
  if (_0x2b8a1a > 0x0 || _0xaf73f8 > 0x0 || _0x4bf5f6 > 0x0) return 'multimodal2video';
  return 'text2video';
}
function getVolcengineSeedance2ModelTier(_0x541567 = '') {
  const _0x374b6f = String(_0x541567 || '')['toLowerCase']();
  if (_0x374b6f['includes']('mini')) return 'mini';
  if (_0x374b6f['includes']('fast')) return 'fast';
  return 'standard';
}
function normalizeVolcengineSeedance2Resolution(_0x2c9de9, _0x2966ab = {}, _0x1aa914 = '') {
  const _0x4d440b = String(_0x2c9de9 || _0x2966ab['defaultResolution'] || '720p')
      ['trim']()
      ['toLowerCase'](),
    _0x26851c = Array['isArray'](_0x2966ab['allowedResolutions'])
      ? _0x2966ab['allowedResolutions']
          ['map']((_0x4e3fa6) =>
            String(_0x4e3fa6 || '')
              ['trim']()
              ['toLowerCase'](),
          )
          ['filter'](Boolean)
      : [];
  if (_0x26851c['length'] > 0x0)
    return _0x26851c['includes'](_0x4d440b)
      ? _0x4d440b
      : _0x26851c['includes'](
            String(_0x2966ab['defaultResolution'] || '')
              ['trim']()
              ['toLowerCase'](),
          )
        ? String(_0x2966ab['defaultResolution'])['trim']()['toLowerCase']()
        : _0x26851c[0x0];
  const _0x2d6279 = getVolcengineSeedance2ModelTier(_0x1aa914);
  if (_0x4d440b === '4k' && _0x2d6279 === 'standard') return '4k';
  if (_0x4d440b === '1080p' && _0x2d6279 === 'standard') return '1080p';
  if (_0x4d440b === '480p') return '480p';
  return '720p';
}
function normalizeVolcengineSeedance2Ratio(_0xc7c8a4, _0x392d27 = {}) {
  const _0xb6952 = String(_0xc7c8a4 || '')['trim']();
  if (!_0xb6952 || _0xb6952 === 'auto' || _0xb6952 === 'default' || _0xb6952 === '自适应')
    return _0x392d27['defaultRatio'] || 'adaptive';
  const _0x45f5d2 = normalizeRatioLabelText(_0xb6952);
  return ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9']['includes'](_0x45f5d2)
    ? _0x45f5d2
    : _0x392d27['defaultRatio'] || 'adaptive';
}
function normalizeVolcengineSeedance2Duration(_0x1dba58, _0x56f4f9 = {}) {
  const _0x25f3a8 = Number(_0x1dba58);
  if (_0x25f3a8 === -0x1 && _0x56f4f9['allowAutoDuration'] !== ![]) return -0x1;
  const _0x58a36a = normalizePositiveInteger(_0x56f4f9['minDuration'], 0x4),
    _0x554b1b = normalizePositiveInteger(_0x56f4f9['maxDuration'], 0xf);
  if (!Number['isFinite'](_0x25f3a8)) {
    const _0x14add5 = Number(_0x56f4f9['defaultDuration']);
    return _0x14add5 === -0x1 && _0x56f4f9['allowAutoDuration'] !== ![]
      ? -0x1
      : Number['isFinite'](_0x14add5)
        ? Math['max'](_0x58a36a, Math['min'](_0x554b1b, Math['trunc'](_0x14add5)))
        : 0x5;
  }
  return Math['max'](_0x58a36a, Math['min'](_0x554b1b, Math['trunc'](_0x25f3a8)));
}
function normalizeVolcengineBoolean(_0x1642af, _0x35f875 = ![]) {
  if (_0x1642af === !![] || _0x1642af === ![]) return _0x1642af;
  if (_0x1642af === undefined || _0x1642af === null || String(_0x1642af)['trim']() === '') return _0x35f875;
  const _0x2e32f2 = String(_0x1642af ?? '')
    ['trim']()
    ['toLowerCase']();
  if (['true', '1', 'yes', 'on']['includes'](_0x2e32f2)) return !![];
  if (['false', '0', 'no', 'off']['includes'](_0x2e32f2)) return ![];
  return _0x35f875;
}
function normalizeVolcengineSeedance2Priority(_0x332225) {
  if (_0x332225 === undefined || _0x332225 === null || String(_0x332225)['trim']() === '') return null;
  const _0x5b1f30 = Number['parseInt'](String(_0x332225)['trim'](), 0xa);
  if (!Number['isFinite'](_0x5b1f30)) return null;
  return Math['max'](0x0, Math['min'](0x9, _0x5b1f30));
}
function normalizeVolcengineSeedance2OutputFormat(_0x48bd37) {
  const _0x5fc9cb = String(_0x48bd37 || 'mp4')
    ['trim']()
    ['toLowerCase']();
  return _0x5fc9cb === 'mov' ? 'mov' : 'mp4';
}
function normalizeVolcengineOmniReferenceTaskType(_0x228e89) {
  const _0x5474a4 = String(_0x228e89 || '')
    ['trim']()
    ['toLowerCase']();
  return ['auto', 'reference', 'edit']['includes'](_0x5474a4) ? _0x5474a4 : '';
}
function getVolcengineSeedance2Policy(_0x58382e) {
  const _0x2b1b41 = _0x58382e?.['extensions']?.['seedanceVideo'];
  return _0x2b1b41 && typeof _0x2b1b41 === 'object' && !Array['isArray'](_0x2b1b41) ? _0x2b1b41 : {};
}
function getVolcengineSlotMedia(_0x34da48 = {}, _0x71217c) {
  return String(normalizeInputUrlsBySlot(_0x34da48)[_0x71217c] || '')['trim']();
}
function collectVolcengineSeedance2FrameImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x475602 = [];
  return (
    appendUniqueUrl(_0x475602, getVolcengineSlotMedia(finalUrlsBySlot, 'firstFrame')),
    appendUniqueUrl(_0x475602, getVolcengineSlotMedia(finalUrlsBySlot, 'lastFrame')),
    normalizeInputList(inputImages)['forEach']((_0x3fd33d) => appendUniqueUrl(_0x475602, _0x3fd33d)),
    _0x475602
  );
}
function collectVolcengineSeedance2ReferenceImages({
  inputImages: inputImages = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
} = {}) {
  const _0x5321c3 = [];
  appendUniqueUrl(_0x5321c3, getVolcengineSlotMedia(finalUrlsBySlot, 'referenceImage'));
  const _0x3c45d8 = new Set(normalizeInputList(Object['values'](normalizeInputUrlsBySlot(finalUrlsBySlot))));
  return (
    normalizeInputList(inputImages)['forEach']((_0x19027e) => {
      if (!_0x3c45d8['has'](_0x19027e)) appendUniqueUrl(_0x5321c3, _0x19027e);
    }),
    _0x5321c3
  );
}
function pushVolcengineContentItem(_0x2e44af, _0x2690b6, _0x411472, _0x46f868) {
  const _0x37ad50 = String(_0x411472 || '')['trim']();
  if (!_0x37ad50) return;
  const _0x53f237 = { type: _0x2690b6 };
  if (_0x2690b6 === 'image_url') _0x53f237['image_url'] = { url: _0x37ad50 };
  else {
    if (_0x2690b6 === 'video_url') _0x53f237['video_url'] = { url: _0x37ad50 };
    else {
      if (_0x2690b6 === 'audio_url') _0x53f237['audio_url'] = { url: _0x37ad50 };
    }
  }
  if (_0x46f868) _0x53f237['role'] = _0x46f868;
  _0x2e44af['push'](_0x53f237);
}
export function volcengineSeedance2Video({
  currentBody: _0x1ec948,
  inputImages: inputImages = [],
  inputVideos: inputVideos = [],
  inputAudios: inputAudios = [],
  payload: payload = {},
  finalPrompt: finalPrompt = '',
  finalUrlsBySlot: finalUrlsBySlot = {},
  modelToken: modelToken = '',
  executionManifest: _0x227665,
}) {
  const _0x803b3b = { ..._0x1ec948 },
    _0x97321e = getVolcengineSeedance2Policy(_0x227665),
    _0x2ea807 = String(_0x803b3b['prompt'] || finalPrompt || payload?.['prompt'] || '')['trim'](),
    _0x46e3a7 = getVolcengineSeedance2Mode(payload, _0x803b3b),
    _0xb35ac = collectVolcengineSeedance2FrameImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x1b891c = collectVolcengineSeedance2ReferenceImages({
      inputImages: inputImages,
      finalUrlsBySlot: finalUrlsBySlot,
    }),
    _0x421923 = normalizeInputList(inputVideos),
    _0x5c007f = normalizeInputList(inputAudios),
    _0x38ad24 = normalizeVolcengineOmniReferenceTaskType(
      _0x803b3b['omni_reference_task_type'] ||
        payload?.['generationParams']?.['omniReferenceTaskType'] ||
        payload?.['generationParams']?.['omni_reference_task_type'],
    ),
    _0x20df70 = resolveVolcengineSeedance2TaskType({
      routeMode: _0x46e3a7,
      frameImageCount: _0xb35ac['length'],
      referenceImageCount: _0x1b891c['length'],
      videoCount: _0x421923['length'],
      audioCount: _0x5c007f['length'],
    }),
    _0x4411b7 = [];
  if (_0x2ea807) _0x4411b7['push']({ type: 'text', text: _0x2ea807 });
  if (_0x20df70 === 'text2video') {
    if (!_0x2ea807) throw new Error('Volcengine Seedance prompt is required');
    if (_0xb35ac['length'] > 0x0 || _0x421923['length'] > 0x0 || _0x5c007f['length'] > 0x0)
      throw new Error('Volcengine Seedance text mode does not accept media input');
  } else {
    if (_0x20df70 === 'image2video') {
      if (_0x421923['length'] > 0x0 || _0x5c007f['length'] > 0x0)
        throw new Error('Volcengine Seedance image mode does not accept video or audio input');
      if (_0xb35ac['length'] < 0x1)
        throw new Error('Volcengine\x20Seedance\x20image\x20mode\x20requires\x201\x20image\x20input');
      pushVolcengineContentItem(_0x4411b7, 'image_url', _0xb35ac[0x0], 'first_frame');
    } else {
      if (_0x20df70 === 'frames2video') {
        if (_0x421923['length'] > 0x0 || _0x5c007f['length'] > 0x0)
          throw new Error('Volcengine Seedance first-last-frame mode only accepts images');
        if (_0xb35ac['length'] < 0x2)
          throw new Error('Volcengine Seedance first-last-frame mode requires 2 image inputs');
        (pushVolcengineContentItem(_0x4411b7, 'image_url', _0xb35ac[0x0], 'first_frame'),
          pushVolcengineContentItem(_0x4411b7, 'image_url', _0xb35ac[0x1], 'last_frame'));
      } else {
        const _0x5d91b4 = normalizePositiveInteger(_0x97321e['maxImageCount'], 0x9),
          _0x2799e3 = normalizePositiveInteger(_0x97321e['maxVideoReferenceCount'], 0x3),
          _0x575a28 = normalizePositiveInteger(_0x97321e['maxAudioReferenceCount'], 0x3),
          _0x682e1f = _0x97321e['allowAudioOnlyReferences'] === !![];
        if (_0x1b891c['length'] + _0x421923['length'] <= 0x0 && !(_0x682e1f && _0x5c007f['length'] > 0x0))
          throw new Error('Volcengine Seedance multimodal mode requires image or video input');
        if (_0x1b891c['length'] > _0x5d91b4)
          throw new Error(
            'Volcengine Seedance multimodal mode supports at most ' + _0x5d91b4 + ' image inputs',
          );
        if (_0x421923['length'] > _0x2799e3)
          throw new Error(
            'Volcengine\x20Seedance\x20multimodal\x20mode\x20supports\x20at\x20most\x20' +
              _0x2799e3 +
              ' video inputs',
          );
        if (_0x5c007f['length'] > _0x575a28)
          throw new Error(
            'Volcengine\x20Seedance\x20multimodal\x20mode\x20supports\x20at\x20most\x20' +
              _0x575a28 +
              ' audio inputs',
          );
        (_0x1b891c['slice'](0x0, _0x5d91b4)['forEach']((_0x359f26) =>
          pushVolcengineContentItem(_0x4411b7, 'image_url', _0x359f26, 'reference_image'),
        ),
          _0x421923['slice'](0x0, _0x2799e3)['forEach']((_0x584061) =>
            pushVolcengineContentItem(_0x4411b7, 'video_url', _0x584061, 'reference_video'),
          ),
          _0x5c007f['slice'](0x0, _0x575a28)['forEach']((_0x1243b8) =>
            pushVolcengineContentItem(_0x4411b7, 'audio_url', _0x1243b8, 'reference_audio'),
          ));
      }
    }
  }
  if (_0x4411b7['length'] === 0x0) throw new Error('Volcengine Seedance request content is empty');
  if (_0x38ad24 === 'edit' && _0x421923['length'] < 0x1)
    throw new Error('Volcengine\x20Seedance\x20edit\x20mode\x20requires\x20a\x20reference\x20video');
  const _0x58f770 = modelToken || _0x803b3b['model'] || stripPrefix(payload['model'], 'volcengine/'),
    _0x17e5f3 =
      _0x97321e['roleImagesRequireAdaptiveRatio'] === !![] &&
      (_0x20df70 === 'image2video' || _0x20df70 === 'frames2video')
        ? 'adaptive'
        : normalizeVolcengineSeedance2Ratio(_0x803b3b['ratio'], _0x97321e),
    _0x5a6690 = _0x38ad24 === 'edit',
    _0x2550b3 = {
      model: _0x58f770,
      content: _0x4411b7,
      resolution: normalizeVolcengineSeedance2Resolution(_0x803b3b['resolution'], _0x97321e, _0x58f770),
      ratio: _0x5a6690 ? 'adaptive' : _0x17e5f3,
      duration: _0x5a6690 ? -0x1 : normalizeVolcengineSeedance2Duration(_0x803b3b['duration'], _0x97321e),
      generate_audio: normalizeVolcengineBoolean(_0x803b3b['generate_audio'], !![]),
      watermark: normalizeVolcengineBoolean(_0x803b3b['watermark'], ![]),
    };
  _0x97321e['supportsOutputFormatParam'] === !![] &&
    (_0x2550b3['output_format'] = normalizeVolcengineSeedance2OutputFormat(_0x803b3b['output_format']));
  normalizeVolcengineBoolean(_0x803b3b['webSearch'], ![]) && (_0x2550b3['tools'] = [{ type: 'web_search' }]);
  const _0x1ea58d = normalizeVolcengineSeedance2Priority(_0x803b3b['priority']);
  if (_0x1ea58d !== null && _0x1ea58d > 0x0) _0x2550b3['priority'] = _0x1ea58d;
  if (_0x97321e['supportsSeedParam'] === !![]) {
    const _0x3f71fd = normalizeOptionalIntegerInRange(_0x803b3b['seed'], { min: -0x1, max: 0x7fffffff });
    if (_0x3f71fd !== null) _0x2550b3['seed'] = _0x3f71fd;
  }
  return (_0x38ad24 && (_0x2550b3['omni_reference_task_type'] = _0x38ad24), _0x2550b3);
}

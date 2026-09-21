import { getModelsByKind, normalizeProviderId, resolveModelExecution } from '../manifests/index.js';
import { translateManifestText } from '../i18n/manifestText.js';
import { t } from '../i18n/index.js';
export const DREAMINA_VIDEO_ROUTE_MODES = ['multimodal2video', 'frames2video', 'multiframe2video'];
export const DREAMINA_VIDEO_TASK_TYPES = [
  'text2video',
  'image2video',
  'frames2video',
  'multiframe2video',
  'multimodal2video',
];
export const DREAMINA_VIDEO_ALLOWED_RATIOS = ['1:1', '3:4', '16:9', '4:3', '9:16', '21:9'];
export const DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS = [
  { label: '1:1', w: 1, h: 1, calc: 1 / 1 },
  { label: '3:4', w: 3, h: 4, calc: 3 / 4 },
  { label: '16:9', w: 16, h: 9, calc: 16 / 9 },
  { label: '4:3', w: 4, h: 3, calc: 4 / 3 },
  { label: '9:16', w: 9, h: 16, calc: 9 / 16 },
  { label: '21:9', w: 21, h: 9, calc: 21 / 9 },
];
function getDreaminaStyleVideoExtension(_0x3f9790) {
  const _0x443b83 = _0x3f9790?.extensions?.dreaminaStyleVideo;
  return _0x443b83 && typeof _0x443b83 === 'object' ? _0x443b83 : null;
}
function getDreaminaStyleVideoCounterpartKey(_0x4dbd63) {
  return String(getDreaminaStyleVideoExtension(_0x4dbd63)?.counterpartKey || '').trim();
}
function normalizeStyleProvider(_0x294da5) {
  const _0x637f3f = normalizeProviderId(_0x294da5);
  return _0x637f3f === 'apimart' || _0x637f3f === 'dreamina' || _0x637f3f === 'volcengine' ? _0x637f3f : '';
}
function toDreaminaStyleVideoOption(_0x39bf3d) {
  const _0x5148ac = getDreaminaStyleVideoExtension(_0x39bf3d) || {};
  return Object.freeze({
    model: _0x39bf3d.modelId,
    title: translateManifestText(_0x5148ac.title || _0x39bf3d.displayName || _0x39bf3d.modelId),
    subtitle: translateManifestText(_0x5148ac.subtitle || _0x39bf3d.description || ''),
    subtitleByTaskType: _0x5148ac.subtitleByTaskType || Object.freeze({}),
    taskTypes: Array.isArray(_0x5148ac.taskTypes)
      ? Object.freeze(_0x5148ac.taskTypes.slice())
      : Object.freeze([]),
    order: Number(_0x5148ac.order || 0),
    counterpartKey: getDreaminaStyleVideoCounterpartKey(_0x39bf3d),
    vip: _0x39bf3d.vip === true,
  });
}
function getDreaminaStyleVideoOptions(_0x12b6d8) {
  const _0x31625b = normalizeStyleProvider(_0x12b6d8);
  return getModelsByKind('video')
    .filter((_0x2bbdbd) => {
      if (!getDreaminaStyleVideoExtension(_0x2bbdbd)) return false;
      if (_0x31625b && _0x2bbdbd.provider !== _0x31625b) return false;
      return true;
    })
    .sort((_0x1e4f78, _0x48ba89) => {
      const _0xb1cc61 = getDreaminaStyleVideoExtension(_0x1e4f78) || {},
        _0x3d541e = getDreaminaStyleVideoExtension(_0x48ba89) || {};
      return (Number(_0xb1cc61.order || 0) || 0) - (Number(_0x3d541e.order || 0) || 0);
    })
    .map(toDreaminaStyleVideoOption);
}
function resolveDreaminaStyleVideoManifest(_0x294a7c, _0x3fa367 = '') {
  const _0x41aba8 = String(_0x294a7c || '').trim(),
    _0x51e94a = normalizeStyleProvider(_0x3fa367),
    _0x9d9577 = Array.from(new Set([_0x51e94a, ''].filter(Boolean)));
  for (const _0x2de874 of _0x9d9577) {
    const _0x2ce647 = resolveModelExecution(_0x41aba8, { providerHint: _0x2de874 }),
      _0x5bc8a2 = _0x2ce647?.modelManifest || null;
    if (!_0x5bc8a2 || !getDreaminaStyleVideoExtension(_0x5bc8a2)) continue;
    if (_0x51e94a && _0x5bc8a2.provider !== _0x51e94a) continue;
    return _0x5bc8a2;
  }
  if (!_0x41aba8) return null;
  const _0x1f7865 = resolveModelExecution(_0x41aba8),
    _0x30ce18 = _0x1f7865?.modelManifest || null;
  if (!_0x30ce18 || !getDreaminaStyleVideoExtension(_0x30ce18)) return null;
  if (_0x51e94a && _0x30ce18.provider !== _0x51e94a) return null;
  return _0x30ce18;
}
function getDefaultDreaminaStyleVideoModel(_0x5210a7, _0x5a7874) {
  const _0x1f5614 = normalizeStyleProvider(_0x5a7874) || 'dreamina',
    _0x5b157c = String(_0x5210a7 || '').trim(),
    _0x37210d = getDreaminaStyleVideoOptions(_0x1f5614),
    _0x532d36 = _0x37210d.find((_0x449fac) => {
      const _0x3c6a24 = resolveDreaminaStyleVideoManifest(_0x449fac.model, _0x1f5614),
        _0xe7ca7c = getDreaminaStyleVideoExtension(_0x3c6a24)?.defaultForTaskTypes || [];
      return Array.isArray(_0xe7ca7c) && _0xe7ca7c.includes(_0x5b157c);
    });
  if (_0x532d36) return _0x532d36.model;
  const _0x148583 = _0x37210d.find((_0x6f9052) => _0x6f9052.taskTypes.includes(_0x5b157c));
  return _0x148583?.model || '';
}
export const APIMART_DREAMINA_VIDEO_DEFAULT_MODEL = getDefaultDreaminaStyleVideoModel(
  'text2video',
  'apimart',
);
export const APIMART_DREAMINA_VIDEO_MODEL_OPTIONS = Object.freeze(getDreaminaStyleVideoOptions('apimart'));
export const VOLCENGINE_DREAMINA_VIDEO_MODEL_OPTIONS = Object.freeze(
  getDreaminaStyleVideoOptions('volcengine'),
);
export const DREAMINA_VIDEO_MODEL_OPTIONS = Object.freeze(getDreaminaStyleVideoOptions('dreamina'));
const IMAGE_ROUTE_EXTRA_MODELS = DREAMINA_VIDEO_MODEL_OPTIONS.filter((_0x2fd5e8) =>
    _0x2fd5e8.taskTypes.includes('image2video'),
  ),
  FRAMES_ROUTE_EXTRA_MODELS = DREAMINA_VIDEO_MODEL_OPTIONS.filter((_0x4c940c) =>
    _0x4c940c.taskTypes.includes('frames2video'),
  ),
  DREAMINA_VIDEO_MODEL_META = new Map(
    DREAMINA_VIDEO_MODEL_OPTIONS.map((_0x427e9b) => [_0x427e9b.model, _0x427e9b]),
  ),
  APIMART_DREAMINA_VIDEO_MODEL_META = new Map(
    APIMART_DREAMINA_VIDEO_MODEL_OPTIONS.map((_0x485340) => [_0x485340.model, _0x485340]),
  ),
  VOLCENGINE_DREAMINA_VIDEO_MODEL_META = new Map(
    VOLCENGINE_DREAMINA_VIDEO_MODEL_OPTIONS.map((_0x457f9a) => [_0x457f9a.model, _0x457f9a]),
  ),
  DREAMINA_ROUTE_LABEL_KEYS = {
    multimodal2video: 'route.multimodal2video',
    frames2video: 'route.frames2video',
    multiframe2video: 'route.multiframe2video',
  },
  DREAMINA_TASK_LABEL_KEYS = {
    text2video: 'task.text2video',
    image2video: 'task.image2video',
    frames2video: 'task.frames2video',
    multiframe2video: 'task.multiframe2video',
    multimodal2video: 'task.multimodal2video',
  },
  DREAMINA_MODE_DISABLED_MAP = { multimodal2video: false, frames2video: false, multiframe2video: true };
function pickFirstNonEmpty(..._0x5c296c) {
  for (const _0x5b723e of _0x5c296c) {
    const _0x4ca22f = String(_0x5b723e || '').trim();
    if (_0x4ca22f) return _0x4ca22f;
  }
  return '';
}
function pickCanonicalOptionValue(_0x56606c, _0x579245, _0x51fa9d) {
  if (!Array.isArray(_0x56606c) || _0x56606c.length === 0) return '';
  const _0x59ad98 = pickFirstNonEmpty(_0x579245, _0x51fa9d, _0x56606c[0]),
    _0x366bc7 = _0x59ad98.toLowerCase(),
    _0xdbd681 = _0x56606c.find(
      (_0x5ceede) =>
        String(_0x5ceede || '')
          .trim()
          .toLowerCase() === _0x366bc7,
    );
  return _0xdbd681 || _0x56606c[0];
}
function dreaminaVideoText(_0x214633, _0x189df7 = {}) {
  return t('dreaminaVideo.' + _0x214633, _0x189df7);
}
export function isDreaminaVideoModel(_0x4acf7a, _0x1410ce) {
  const _0x30ca6f = normalizeStyleProvider(_0x1410ce);
  if (_0x30ca6f === 'dreamina') return true;
  return resolveDreaminaStyleVideoManifest(_0x4acf7a, 'dreamina') !== null;
}
export function isApimartDreaminaVideoModel(_0x521be3, _0x4cfffb) {
  const _0x2afe50 = normalizeStyleProvider(_0x4cfffb);
  if (_0x2afe50 === 'apimart' && !String(_0x521be3 || '').trim()) return true;
  return resolveDreaminaStyleVideoManifest(_0x521be3, 'apimart') !== null;
}
export function isDreaminaStyleVideoModel(_0x5e73b9, _0x476d12) {
  return (
    isDreaminaVideoModel(_0x5e73b9, _0x476d12) ||
    isApimartDreaminaVideoModel(_0x5e73b9, _0x476d12) ||
    resolveDreaminaStyleVideoManifest(_0x5e73b9, 'volcengine') !== null ||
    (normalizeStyleProvider(_0x476d12) === 'volcengine' &&
      resolveDreaminaStyleVideoManifest(_0x5e73b9, 'volcengine') !== null)
  );
}
export function resolveDreaminaStyleVideoProvider(_0x230b08, _0x45268c) {
  const _0x1de90b = normalizeStyleProvider(_0x45268c);
  if (_0x1de90b) return _0x1de90b;
  const _0x14abd4 = resolveDreaminaStyleVideoManifest(_0x230b08);
  return normalizeStyleProvider(_0x14abd4?.provider) || 'dreamina';
}
export function resolveDreaminaStyleVideoCounterpartModel(
  _0x58315a,
  _0x36f5df,
  { taskType: taskType = '' } = {},
) {
  const _0x1574c0 = resolveDreaminaStyleVideoManifest(_0x58315a),
    _0x3165b5 = getDreaminaStyleVideoCounterpartKey(_0x1574c0),
    _0x4d38ba = normalizeStyleProvider(_0x36f5df);
  if (!_0x1574c0 || !_0x3165b5 || !_0x4d38ba) return '';
  const _0x3383c3 = String(taskType || '').trim(),
    _0x22ecab = _0x1574c0.vip === true,
    _0x1f40d5 = getModelsByKind('video')
      .filter((_0x3cea5c) => {
        if (_0x3cea5c.provider !== _0x4d38ba) return false;
        const _0x2c6670 = getDreaminaStyleVideoExtension(_0x3cea5c);
        if (!_0x2c6670) return false;
        if (getDreaminaStyleVideoCounterpartKey(_0x3cea5c) !== _0x3165b5) return false;
        const _0x49539a = Array.isArray(_0x2c6670.taskTypes) ? _0x2c6670.taskTypes : [];
        return !_0x3383c3 || _0x49539a.includes(_0x3383c3);
      })
      .sort((_0x52610b, _0xef6b0c) => {
        const _0x2a2b2e = _0x52610b.vip === _0x22ecab ? 0 : 1,
          _0x2e8f93 = _0xef6b0c.vip === _0x22ecab ? 0 : 1;
        if (_0x2a2b2e !== _0x2e8f93) return _0x2a2b2e - _0x2e8f93;
        const _0x2878f5 = Number(getDreaminaStyleVideoExtension(_0x52610b)?.order || 0) || 0,
          _0x394046 = Number(getDreaminaStyleVideoExtension(_0xef6b0c)?.order || 0) || 0;
        return _0x2878f5 - _0x394046;
      });
  return _0x1f40d5[0]?.modelId || '';
}
export function isDreaminaVideoRouteModeEnabled(_0x47fabc) {
  const _0x1855b0 = normalizeDreaminaVideoRouteMode(_0x47fabc);
  return DREAMINA_MODE_DISABLED_MAP[_0x1855b0] !== true;
}
export function normalizeDreaminaVideoRouteMode(_0x56bbc3, _0x14fad3 = '') {
  const _0x1c910d = String(_0x56bbc3 || '').trim();
  if (DREAMINA_VIDEO_ROUTE_MODES.includes(_0x1c910d)) return _0x1c910d;
  const _0x46aa7d = String(_0x14fad3 || '').trim();
  if (_0x46aa7d === '首尾帧') return 'frames2video';
  if (_0x46aa7d === '智能多帧') return 'multiframe2video';
  return 'multimodal2video';
}
export function normalizeDreaminaVideoModel(_0x42fb0e, _0x190068) {
  const _0x3ced88 = resolveDreaminaStyleVideoManifest(_0x42fb0e, 'dreamina');
  if (_0x3ced88) return _0x3ced88.modelId;
  if (normalizeStyleProvider(_0x190068) === 'dreamina')
    return getDefaultDreaminaStyleVideoModel('text2video', 'dreamina');
  return String(_0x42fb0e || '').trim();
}
export function getDreaminaVideoModelVersion(_0x5ebc4b, _0x4a6c2d) {
  const _0x3711e3 = normalizeDreaminaVideoModel(_0x5ebc4b, _0x4a6c2d),
    _0x4805d7 = resolveDreaminaStyleVideoManifest(_0x3711e3, 'dreamina');
  return _0x4805d7 ? _0x3711e3.replace(/^dreamina\//, '').trim() : '';
}
export function getDreaminaVideoModelMeta(_0x56773d, _0x144b7a) {
  const _0xfa1963 = normalizeDreaminaVideoModel(_0x56773d, _0x144b7a);
  return DREAMINA_VIDEO_MODEL_META.get(_0xfa1963) || null;
}
export function getDreaminaVideoTaskDisplayName(_0x509959) {
  return dreaminaVideoText(DREAMINA_TASK_LABEL_KEYS[String(_0x509959 || '').trim()] || 'task.video');
}
export function getDreaminaVideoRouteDisplayName(_0x3c342e) {
  return dreaminaVideoText(
    DREAMINA_ROUTE_LABEL_KEYS[normalizeDreaminaVideoRouteMode(_0x3c342e)] || 'route.multimodal2video',
  );
}
export function buildDreaminaVideoRouteLabel(_0x10eff2) {
  return getDreaminaVideoRouteDisplayName(_0x10eff2);
}
export function resolveDreaminaVideoTaskType({
  routeMode: routeMode = 'multimodal2video',
  imageCount: imageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const _0x1a3b3e = normalizeDreaminaVideoRouteMode(routeMode),
    _0x26f28a = Number(imageCount) || 0,
    _0x519e14 = Number(videoCount) || 0,
    _0x130b68 = Number(audioCount) || 0;
  if (_0x1a3b3e === 'frames2video') {
    if (_0x26f28a >= 2) return 'frames2video';
    if (_0x26f28a === 1) return 'image2video';
    return 'text2video';
  }
  if (_0x1a3b3e === 'multiframe2video') return 'multiframe2video';
  if (_0x26f28a <= 0 && _0x519e14 <= 0) return _0x130b68 > 0 ? 'multimodal2video' : 'text2video';
  return 'multimodal2video';
}
export function getDreaminaVideoAllowedModels(_0xd50292) {
  const _0x12558b = String(_0xd50292 || '').trim();
  return DREAMINA_VIDEO_MODEL_OPTIONS.filter((_0x90b297) => _0x90b297.taskTypes.includes(_0x12558b));
}
export function getDreaminaVideoDefaultModel(_0xa1e52a) {
  const _0x2579c6 = String(_0xa1e52a || '').trim();
  return getDefaultDreaminaStyleVideoModel(_0x2579c6, 'dreamina');
}
export function isDreaminaVideoTaskModelSupported(_0x208d08, _0x2e4404, _0x2dc7c6) {
  const _0x4aa913 = normalizeDreaminaVideoModel(_0x2e4404, _0x2dc7c6);
  return getDreaminaVideoAllowedModels(_0x208d08).some((_0x3c1470) => _0x3c1470.model === _0x4aa913);
}
export function ensureDreaminaVideoModelForTask(_0x23e403, _0x2877a7, _0x2be4c0) {
  const _0x4387b8 = String(_0x23e403 || '').trim(),
    _0x46b0cf = normalizeDreaminaVideoModel(_0x2877a7, _0x2be4c0);
  if (_0x46b0cf && isDreaminaVideoTaskModelSupported(_0x4387b8, _0x46b0cf, 'dreamina')) return _0x46b0cf;
  return getDreaminaVideoDefaultModel(_0x4387b8);
}
export function normalizeDreaminaVideoAspectRatio(_0x59f187, _0x4a1d1b = {}) {
  const _0x2e781f =
      _0x4a1d1b === true ||
      (_0x4a1d1b && typeof _0x4a1d1b === 'object' && _0x4a1d1b.preserveAdaptive === true),
    _0x4b2a87 = String(_0x59f187 || '').trim();
  if (!_0x4b2a87) return _0x2e781f ? '自适应' : '1:1';
  if (_0x4b2a87 === '自适应' || _0x4b2a87 === '自适应' || _0x4b2a87 === 'auto')
    return _0x2e781f ? '自适应' : '1:1';
  if (_0x4b2a87 === '5:4') return '4:3';
  if (_0x4b2a87 === '4:5') return '3:4';
  if (DREAMINA_VIDEO_ALLOWED_RATIOS.includes(_0x4b2a87)) return _0x4b2a87;
  return _0x2e781f ? '自适应' : '1:1';
}
export function pickClosestDreaminaVideoAdaptiveRatio(_0x5c06c7, _0x1e8e88) {
  const _0x101be9 = Number(_0x5c06c7),
    _0x2c7442 = Number(_0x1e8e88);
  if (!(Number.isFinite(_0x101be9) && _0x101be9 > 0 && Number.isFinite(_0x2c7442) && _0x2c7442 > 0))
    return DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[0];
  const _0x515bc6 = _0x101be9 / _0x2c7442;
  let _0x3500ab = DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[0],
    _0x8225f4 = Math.abs(_0x515bc6 - _0x3500ab.calc);
  for (let _0x4b4428 = 1; _0x4b4428 < DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS.length; _0x4b4428 += 1) {
    const _0x37b308 = DREAMINA_VIDEO_ADAPTIVE_RATIO_OPTIONS[_0x4b4428],
      _0x6be49c = Math.abs(_0x515bc6 - _0x37b308.calc);
    _0x6be49c < _0x8225f4 && ((_0x8225f4 = _0x6be49c), (_0x3500ab = _0x37b308));
  }
  return _0x3500ab;
}
export function getDreaminaVideoTaskParamVisibility(_0x38215e) {
  const _0x1507d2 = String(_0x38215e || '').trim();
  return {
    ratio: true,
    duration: _0x1507d2 !== 'multiframe2video',
    mode: true,
    model: true,
    multiframeAdvanced: false,
    ratioChoices: _0x1507d2 !== 'image2video' && _0x1507d2 !== 'frames2video',
  };
}
export function getDreaminaVideoResolutionOptions(_0x3dfdbc, _0x475e12, _0x233302) {
  const _0xd22256 = String(_0x3dfdbc || '').trim(),
    _0x226208 = ensureDreaminaVideoModelForTask(_0xd22256, _0x475e12, _0x233302),
    _0x2763a9 = resolveDreaminaStyleVideoManifest(_0x226208, 'dreamina'),
    _0x133b4c = getDreaminaStyleVideoExtension(_0x2763a9)?.resolutionOptionsByTaskType?.[_0xd22256];
  return Array.isArray(_0x133b4c) ? _0x133b4c.slice() : [];
}
export function normalizeDreaminaVideoResolution(_0x320d19, _0x3453ea, _0x3f2039, _0x16f91b) {
  const _0x4ce3e4 = getDreaminaVideoResolutionOptions(_0x320d19, _0x3453ea, _0x16f91b);
  if (!_0x4ce3e4.length) return '';
  return pickCanonicalOptionValue(_0x4ce3e4, _0x3f2039, _0x4ce3e4[0]);
}
export function getDreaminaVideoDurationRange(_0x5ef9d2, _0x4f84d0, _0xbe1f71) {
  const _0x447400 = String(_0x5ef9d2 || '').trim();
  if (_0x447400 === 'multiframe2video') return { min: 3, max: 3, step: 1 };
  const _0x56cf47 = ensureDreaminaVideoModelForTask(_0x447400, _0x4f84d0, _0xbe1f71),
    _0x39e7d0 = resolveDreaminaStyleVideoManifest(_0x56cf47, 'dreamina'),
    _0xca0c9a = getDreaminaStyleVideoExtension(_0x39e7d0)?.durationRangeByTaskType?.[_0x447400];
  return _0xca0c9a && typeof _0xca0c9a === 'object'
    ? { min: _0xca0c9a.min, max: _0xca0c9a.max, step: _0xca0c9a.step || 1 }
    : { min: 4, max: 15, step: 1 };
}
export function normalizeDreaminaVideoDuration(_0x5eefc1, _0xcc033a, _0x37098e, _0x5c7b6c) {
  const _0x16ebd9 = getDreaminaVideoDurationRange(_0x5eefc1, _0xcc033a, _0x5c7b6c),
    _0x1ab52c = Number(_0x37098e);
  if (!Number.isFinite(_0x1ab52c)) return _0x16ebd9.min;
  return Math.max(_0x16ebd9.min, Math.min(_0x16ebd9.max, Math.trunc(_0x1ab52c)));
}
export function validateDreaminaVideoRouteSelection({
  routeMode: routeMode = 'multimodal2video',
  taskType: taskType = '',
  imageCount: imageCount = 0,
  videoCount: videoCount = 0,
  audioCount: audioCount = 0,
} = {}) {
  const _0x244e95 = normalizeDreaminaVideoRouteMode(routeMode),
    _0x527563 = String(taskType || '').trim(),
    _0x47ccb8 = Number(imageCount) || 0,
    _0xae766d = Number(videoCount) || 0,
    _0x20eb2a = Number(audioCount) || 0;
  if (_0x244e95 === 'frames2video') {
    if (_0xae766d > 0 || _0x20eb2a > 0) return dreaminaVideoText('validation.framesOnlyImages');
  }
  if (_0x527563 === 'text2video') return '';
  if (_0x527563 === 'image2video') {
    if (_0xae766d > 0 || _0x20eb2a > 0) return dreaminaVideoText('validation.framesOnlyImages');
    if (_0x47ccb8 < 1) return dreaminaVideoText('validation.imageAtLeastOne');
    if (_0x47ccb8 > 1) return dreaminaVideoText('validation.imageAtMostOneSingle');
    return '';
  }
  if (_0x527563 === 'frames2video') {
    if (_0xae766d > 0 || _0x20eb2a > 0) return dreaminaVideoText('validation.framesOnlyImages');
    if (_0x47ccb8 < 2) return dreaminaVideoText('validation.framesNeedTwo');
    if (_0x47ccb8 > 2) return dreaminaVideoText('validation.framesAtMostTwo');
    return '';
  }
  if (_0x527563 === 'multimodal2video') {
    if (_0x47ccb8 <= 0 && _0xae766d <= 0)
      return _0x20eb2a > 0 ? dreaminaVideoText('validation.allReferenceNeedsVisual') : '';
    if (_0x47ccb8 > 9) return dreaminaVideoText('validation.allReferenceMaxImages');
    if (_0xae766d > 3) return dreaminaVideoText('validation.allReferenceMaxVideos');
    if (_0x20eb2a > 3) return dreaminaVideoText('validation.allReferenceMaxAudios');
    return '';
  }
  if (_0x527563 === 'multiframe2video') {
    if (_0xae766d > 0 || _0x20eb2a > 0) return dreaminaVideoText('validation.multiframeOnlyImages');
    if (_0x47ccb8 < 2) return dreaminaVideoText('validation.multiframeAtLeastTwo');
    if (_0x47ccb8 > 20) return dreaminaVideoText('validation.multiframeMaxImages');
    return '';
  }
  return '';
}
export function normalizeDreaminaStyleVideoModel(_0x54398a, _0x3ca3f2) {
  const _0x2c5cd2 = resolveDreaminaStyleVideoProvider(_0x54398a, _0x3ca3f2);
  if (_0x2c5cd2 === 'dreamina') return normalizeDreaminaVideoModel(_0x54398a, _0x3ca3f2);
  const _0x2a9cde = resolveDreaminaStyleVideoManifest(_0x54398a, _0x2c5cd2);
  return _0x2a9cde?.modelId || getDefaultDreaminaStyleVideoModel('text2video', _0x2c5cd2);
}
export function getDreaminaStyleVideoModelVersion(_0x11e822, _0x299608) {
  const _0x20a118 = resolveDreaminaStyleVideoProvider(_0x11e822, _0x299608);
  if (_0x20a118 === 'dreamina') return getDreaminaVideoModelVersion(_0x11e822, _0x299608);
  const _0x151fa7 = normalizeDreaminaStyleVideoModel(_0x11e822, _0x20a118),
    _0x27ca77 = resolveDreaminaStyleVideoManifest(_0x151fa7, _0x20a118);
  return _0x27ca77 ? _0x151fa7.replace(new RegExp('^' + _0x20a118 + '/'), '').trim() : '';
}
export function getDreaminaStyleVideoModelMeta(_0x34a563, _0x3c6809) {
  const _0x200159 = resolveDreaminaStyleVideoProvider(_0x34a563, _0x3c6809);
  if (_0x200159 === 'dreamina') return getDreaminaVideoModelMeta(_0x34a563, _0x3c6809);
  const _0x391ae1 = normalizeDreaminaStyleVideoModel(_0x34a563, _0x200159);
  if (_0x200159 === 'apimart') return APIMART_DREAMINA_VIDEO_MODEL_META.get(_0x391ae1) || null;
  if (_0x200159 === 'volcengine') return VOLCENGINE_DREAMINA_VIDEO_MODEL_META.get(_0x391ae1) || null;
  return null;
}
export function getDreaminaStyleVideoAllowedModels(_0x1f9292, _0x49c932) {
  const _0xf5138f = normalizeStyleProvider(_0x49c932) || 'dreamina';
  if (_0xf5138f === 'dreamina') return getDreaminaVideoAllowedModels(_0x1f9292);
  const _0x30854c = String(_0x1f9292 || '').trim();
  return getDreaminaStyleVideoOptions(_0xf5138f).filter((_0x1f949c) =>
    _0x1f949c.taskTypes.includes(_0x30854c),
  );
}
export function getDreaminaStyleVideoDefaultModel(_0x1d9768, _0x5765ff) {
  const _0x25b839 = normalizeStyleProvider(_0x5765ff) || 'dreamina';
  if (_0x25b839 === 'dreamina') return getDreaminaVideoDefaultModel(_0x1d9768);
  return getDefaultDreaminaStyleVideoModel(_0x1d9768, _0x25b839);
}
export function isDreaminaStyleVideoTaskModelSupported(_0x205374, _0x51b647, _0x3a4531) {
  const _0x27348b = resolveDreaminaStyleVideoProvider(_0x51b647, _0x3a4531),
    _0x385980 = normalizeDreaminaStyleVideoModel(_0x51b647, _0x27348b);
  return getDreaminaStyleVideoAllowedModels(_0x205374, _0x27348b).some(
    (_0x2143b8) => _0x2143b8.model === _0x385980,
  );
}
export function ensureDreaminaStyleVideoModelForTask(_0xb9b48b, _0x223b36, _0x1a6823) {
  const _0x72754b = resolveDreaminaStyleVideoProvider(_0x223b36, _0x1a6823);
  if (_0x72754b === 'dreamina') return ensureDreaminaVideoModelForTask(_0xb9b48b, _0x223b36, _0x1a6823);
  const _0x48d203 = String(_0xb9b48b || '').trim(),
    _0x59bdad = normalizeDreaminaStyleVideoModel(_0x223b36, _0x72754b);
  if (_0x59bdad && isDreaminaStyleVideoTaskModelSupported(_0x48d203, _0x59bdad, _0x72754b)) return _0x59bdad;
  return getDreaminaStyleVideoDefaultModel(_0x48d203, _0x72754b);
}
export function getDreaminaStyleVideoResolutionOptions(_0x55d6b1, _0x50544b, _0x194173) {
  const _0x596520 = resolveDreaminaStyleVideoProvider(_0x50544b, _0x194173);
  if (_0x596520 === 'dreamina') return getDreaminaVideoResolutionOptions(_0x55d6b1, _0x50544b, _0x194173);
  const _0x23fb07 = String(_0x55d6b1 || '').trim(),
    _0x5aee8c = ensureDreaminaStyleVideoModelForTask(_0x23fb07, _0x50544b, _0x596520),
    _0x3ce24f = resolveDreaminaStyleVideoManifest(_0x5aee8c, _0x596520),
    _0x1ccc64 = getDreaminaStyleVideoExtension(_0x3ce24f)?.resolutionOptionsByTaskType?.[_0x23fb07];
  return Array.isArray(_0x1ccc64) ? _0x1ccc64.slice() : [];
}
export function normalizeDreaminaStyleVideoResolution(_0x2d0ae0, _0x4d3a56, _0x47516b, _0x5e99d0) {
  const _0x18b7da = getDreaminaStyleVideoResolutionOptions(_0x2d0ae0, _0x4d3a56, _0x5e99d0);
  if (!_0x18b7da.length) return '';
  return pickCanonicalOptionValue(_0x18b7da, _0x47516b, _0x18b7da.includes('720p') ? '720p' : _0x18b7da[0]);
}
export function getDreaminaStyleVideoDurationRange(_0x389a59, _0x26a258, _0xb9affa) {
  const _0x365642 = resolveDreaminaStyleVideoProvider(_0x26a258, _0xb9affa);
  if (_0x365642 === 'dreamina') return getDreaminaVideoDurationRange(_0x389a59, _0x26a258, _0xb9affa);
  const _0x2638dd = String(_0x389a59 || '').trim();
  if (_0x2638dd === 'multiframe2video') return { min: 3, max: 3, step: 1 };
  const _0x294b91 = normalizeDreaminaStyleVideoModel(_0x26a258, _0x365642),
    _0x282cab = resolveDreaminaStyleVideoManifest(_0x294b91, _0x365642),
    _0x389cfc = getDreaminaStyleVideoExtension(_0x282cab)?.durationRangeByTaskType?.[_0x2638dd];
  return _0x389cfc && typeof _0x389cfc === 'object'
    ? { min: _0x389cfc.min, max: _0x389cfc.max, step: _0x389cfc.step || 1 }
    : { min: 4, max: 15, step: 1 };
}
export function normalizeDreaminaStyleVideoDuration(_0x32c177, _0x5e8351, _0x3fc793, _0x25702c) {
  const _0x3e0d47 = getDreaminaStyleVideoDurationRange(_0x32c177, _0x5e8351, _0x25702c),
    _0x4a0e7d = Number(_0x3fc793);
  if (!Number.isFinite(_0x4a0e7d)) return _0x3e0d47.min;
  return Math.max(_0x3e0d47.min, Math.min(_0x3e0d47.max, Math.trunc(_0x4a0e7d)));
}
export function buildDreaminaStyleVideoNodeNormalizationPatch(_0x209042) {
  const _0x3327a9 = _0x209042 && typeof _0x209042 === 'object' ? _0x209042 : {};
  if (!isDreaminaStyleVideoModel(_0x3327a9.model, _0x3327a9.provider)) return null;
  const _0xba7765 = resolveDreaminaStyleVideoProvider(_0x3327a9.model, _0x3327a9.provider);
  if (_0xba7765 === 'dreamina') return buildDreaminaVideoNodeNormalizationPatch(_0x209042);
  const _0x1d091e = normalizeDreaminaStyleVideoModel(_0x3327a9.model, _0xba7765),
    _0x3ef2bf = normalizeDreaminaVideoRouteMode(_0x3327a9.dreaminaRouteMode, _0x3327a9.mode),
    _0x18afd7 = normalizeDreaminaVideoAspectRatio(_0x3327a9.aspectRatio, { preserveAdaptive: true }),
    _0x32eda9 = resolveDreaminaVideoTaskType({ routeMode: _0x3ef2bf }),
    _0x26c29b = normalizeDreaminaStyleVideoResolution(
      _0x32eda9,
      _0x1d091e,
      _0x3327a9.resolution || _0x3327a9.videoSize,
      _0xba7765,
    ),
    _0x10691d = normalizeDreaminaStyleVideoDuration(_0x32eda9, _0x1d091e, _0x3327a9.duration, _0xba7765),
    _0x5e7dd0 = {};
  return (
    String(_0x3327a9.provider || '')
      .trim()
      .toLowerCase() !== _0xba7765 && (_0x5e7dd0.provider = _0xba7765),
    _0x1d091e && _0x1d091e !== String(_0x3327a9.model || '').trim() && (_0x5e7dd0.model = _0x1d091e),
    _0x3ef2bf !== String(_0x3327a9.dreaminaRouteMode || '').trim() &&
      (_0x5e7dd0.dreaminaRouteMode = _0x3ef2bf),
    _0x18afd7 !== String(_0x3327a9.aspectRatio || '').trim() &&
      String(_0x3327a9.aspectRatio || '').trim() &&
      (_0x5e7dd0.aspectRatio = _0x18afd7),
    _0x26c29b &&
      _0x26c29b !== String(_0x3327a9.resolution || '').trim() &&
      (_0x5e7dd0.resolution = _0x26c29b),
    Number(_0x10691d) !== Number(_0x3327a9.duration) && (_0x5e7dd0.duration = _0x10691d),
    Object.keys(_0x5e7dd0).length > 0 ? _0x5e7dd0 : null
  );
}
export function buildDreaminaVideoNodeNormalizationPatch(_0x59e717) {
  const _0x19c503 = _0x59e717 && typeof _0x59e717 === 'object' ? _0x59e717 : {};
  if (!isDreaminaVideoModel(_0x19c503.model, _0x19c503.provider)) return null;
  const _0x583c20 = normalizeDreaminaVideoModel(_0x19c503.model, _0x19c503.provider),
    _0x307af7 = normalizeDreaminaVideoRouteMode(_0x19c503.dreaminaRouteMode, _0x19c503.mode),
    _0x5e5248 = normalizeDreaminaVideoAspectRatio(_0x19c503.aspectRatio, { preserveAdaptive: true }),
    _0x5c85de = {};
  return (
    String(_0x19c503.provider || '')
      .trim()
      .toLowerCase() !== 'dreamina' && (_0x5c85de.provider = 'dreamina'),
    _0x583c20 && _0x583c20 !== String(_0x19c503.model || '').trim() && (_0x5c85de.model = _0x583c20),
    _0x307af7 !== String(_0x19c503.dreaminaRouteMode || '').trim() &&
      (_0x5c85de.dreaminaRouteMode = _0x307af7),
    _0x5e5248 !== String(_0x19c503.aspectRatio || '').trim() &&
      String(_0x19c503.aspectRatio || '').trim() &&
      (_0x5c85de.aspectRatio = _0x5e5248),
    Object.keys(_0x5c85de).length > 0 ? _0x5c85de : null
  );
}

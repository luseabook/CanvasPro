import {
  resolveModelExecution,
  resolveModelProvider,
  sanitizeModelUiSchemaParams,
} from '../../manifests/index.js';
import { getFixedInputSlotConfigFromManifest, shouldHideFixedInputSlots } from '../fixedInputAssetRefs.js';
import { resolveModelProviderProfileId } from '../modelProviderProfileSelection.js';
import { normalizeStoryAspectRatio } from './storyProjectPlanning.js';
import { normalizeStoryPromptMode, resolveStoryPromptModeDefaultVideoModelId } from './storyPromptModes.js';
import { isStoryWorkspaceModelVisible, resolveStoryWorkspaceModelId } from './storyWorkspaceModelCatalog.js';
const STORY_VIDEO_REFERENCE_DEFAULT_MODE_FIELDS = Object['freeze']({
  'apimart/wan3.0': 'generation_type',
  'apimart/minimax-h3': 'apimart_minimax_h3_mode',
  'minimax/hailuo-h3': 'minimax_h3_mode',
  'runninghub-model/hailuo-h3': 'rh_hailuo_h3_mode',
  'runninghub/2084286867645755393': 'rh_hailuo_h3_mode',
});
function normalizeText(_0x1ad9b1) {
  return String(_0x1ad9b1 || '')['trim']();
}
export function resolveStoryVideoProvider(_0x1a06dc, _0x44c654 = '') {
  return (
    resolveModelProvider(_0x1a06dc, '', { allowProviderHint: ![], allowPrefixInference: ![] }) ||
    resolveModelProvider(_0x1a06dc, _0x44c654)
  );
}
export function resolveStoryPromptModeForVideoModel(_0x58a67b, _0x23322f = 'seedance-2.0') {
  const _0x89c223 = resolveModelExecution(_0x58a67b);
  return normalizeStoryPromptMode(
    _0x89c223?.['modelManifest']?.['extensions']?.['storyWorkspace']?.['promptMode'] || _0x23322f,
    { allowDeveloperModes: !![] },
  );
}
export function syncStoryPromptModeForVideoModel(
  _0x36bc14 = {},
  _0x302ec4 = _0x36bc14?.['models']?.['video'],
  _0x4e6846 = null,
) {
  const _0x300f06 = rememberStoryEpisodeVideoModelSelection(_0x4e6846, _0x302ec4),
    _0x18f158 = _0x36bc14?.['data']?.['project'];
  if (!_0x18f158 || typeof _0x18f158 !== 'object') return _0x300f06;
  const _0x398f93 = normalizeStoryPromptMode(_0x18f158?.['planning']?.['promptMode'], {
      allowDeveloperModes: !![],
    }),
    _0x34392c = resolveStoryPromptModeForVideoModel(_0x302ec4, _0x398f93);
  if (_0x34392c === _0x398f93) return _0x300f06;
  return ((_0x18f158['planning'] = { ...(_0x18f158['planning'] || {}), promptMode: _0x34392c }), !![]);
}
function getStoryVideoDurationSchemaField(_0x16f6e1) {
  const _0x441af8 = resolveModelExecution(_0x16f6e1),
    _0x5d53d0 = Array['isArray'](_0x441af8?.['modelManifest']?.['uiSchema']?.['fields'])
      ? _0x441af8['modelManifest']['uiSchema']['fields']
      : [];
  return _0x5d53d0['find']((_0x4179ed) => normalizeText(_0x4179ed?.['id']) === 'duration') || null;
}
function normalizeDurationSeconds(_0xd70004) {
  const _0x2ff812 = String(_0xd70004 ?? '')['match'](/\d+(?:\.\d+)?/),
    _0x550f26 = Number(_0x2ff812?.[0x0]);
  return Number['isFinite'](_0x550f26) && _0x550f26 > 0x0 ? Number(_0x550f26['toFixed'](0x1)) : 0x0;
}
export function resolveStoryVideoGenerationDurationSeconds(_0x25a0d2, _0x4a4d24 = {}) {
  const _0x59b740 = getStoryVideoDurationSchemaField(_0x25a0d2);
  if (!_0x59b740?.['id']) return 0x0;
  const _0x3648b2 = normalizeStoryVideoGenerationParams(_0x25a0d2, _0x4a4d24);
  return normalizeDurationSeconds(_0x3648b2[_0x59b740['id']]);
}
export function applyStoryVideoGenerationDurationSeconds(_0x3e9c4c, _0x184578 = {}, _0x16bff2 = 0x0) {
  const _0x310e0c = getStoryVideoDurationSchemaField(_0x3e9c4c),
    _0x2fcd2a = normalizeStoryVideoGenerationParams(_0x3e9c4c, _0x184578),
    _0x13d750 = normalizeDurationSeconds(_0x16bff2);
  if (!_0x310e0c?.['id'] || !_0x13d750) return _0x2fcd2a;
  const _0x457f05 = Number(resolveStoryVideoClipDurationConstraints(_0x3e9c4c)?.['maxSeconds']) || 0x0,
    _0x1b2f58 = _0x457f05 > 0x0 ? Math['min'](_0x13d750, _0x457f05) : _0x13d750;
  return normalizeStoryVideoGenerationParams(_0x3e9c4c, { ..._0x2fcd2a, [_0x310e0c['id']]: _0x1b2f58 });
}
export function getStoryClipVideoGenerationDurationOverride(_0x326835 = {}) {
  return normalizeDurationSeconds(_0x326835?.['videoGenerationDurationSec']);
}
export function resolveStoryVideoInitialGenerationDurationSeconds(_0x5abba2, _0x535d9e = 0x0) {
  const _0x4a53e6 = getStoryVideoDurationSchemaField(_0x5abba2),
    _0x5f0f1d = normalizeDurationSeconds(_0x535d9e);
  if (!_0x4a53e6?.['id'] || !_0x5f0f1d) return 0x0;
  const _0x48c0fa = resolveStoryVideoClipDurationConstraints(_0x5abba2),
    _0x2e73c0 = Array['isArray'](_0x48c0fa?.['allowedSeconds']) ? _0x48c0fa['allowedSeconds'] : [];
  if (_0x2e73c0['length'])
    return _0x2e73c0['find']((_0x5281f9) => _0x5281f9 >= _0x5f0f1d) || _0x2e73c0['at'](-0x1) || 0x0;
  const _0xd0b463 = Number(_0x48c0fa?.['minSeconds']) || 0x0,
    _0x25624a = Number(_0x48c0fa?.['maxSeconds']) || 0x0,
    _0x561e83 = Number(_0x48c0fa?.['stepSeconds']) || 0x0;
  let _0x11bd5b = Math['max'](_0xd0b463, _0x5f0f1d);
  if (_0x561e83 > 0x0) {
    const _0xa1bbb0 = _0xd0b463 || 0x0;
    _0x11bd5b = _0xa1bbb0 + Math['ceil']((_0x11bd5b - _0xa1bbb0 - 1e-9) / _0x561e83) * _0x561e83;
  }
  if (_0x25624a > 0x0) _0x11bd5b = Math['min'](_0x11bd5b, _0x25624a);
  return normalizeDurationSeconds(_0x11bd5b);
}
export function initializeStoryClipVideoGenerationDuration(_0x157e78, _0x40d814) {
  if (!_0x157e78 || typeof _0x157e78 !== 'object') return ![];
  if (getStoryClipVideoGenerationDurationOverride(_0x157e78)) return ![];
  const _0x150b98 = normalizeDurationSeconds(
      _0x157e78['durationSec'] || _0x157e78['durationSeconds'] || _0x157e78['duration'],
    ),
    _0x196ade = resolveStoryVideoInitialGenerationDurationSeconds(_0x40d814, _0x150b98);
  if (!_0x196ade) return ![];
  return ((_0x157e78['videoGenerationDurationSec'] = _0x196ade), !![]);
}
export function initializeStoryEpisodeVideoGenerationDurations(_0x3caa5d, _0x3f9b8b) {
  if (!_0x3caa5d || typeof _0x3caa5d !== 'object') return 0x0;
  return (Array['isArray'](_0x3caa5d['clips']) ? _0x3caa5d['clips'] : [])['reduce'](
    (_0x568c20, _0x597d0e) =>
      _0x568c20 + Number(initializeStoryClipVideoGenerationDuration(_0x597d0e, _0x3f9b8b)),
    0x0,
  );
}
export function setStoryClipVideoGenerationDurationOverride(_0x1d7d78, _0x37238e) {
  if (!_0x1d7d78 || typeof _0x1d7d78 !== 'object') return ![];
  const _0x5085bc = normalizeDurationSeconds(_0x37238e),
    _0x1bbac8 = getStoryClipVideoGenerationDurationOverride(_0x1d7d78);
  return (
    !_0x5085bc
      ? delete _0x1d7d78['videoGenerationDurationSec']
      : (_0x1d7d78['videoGenerationDurationSec'] = _0x5085bc),
    _0x1bbac8 !== getStoryClipVideoGenerationDurationOverride(_0x1d7d78)
  );
}
export function resolveStoryClipVideoGenerationParams(_0x21419e, _0x33a234, _0x20b573 = {}) {
  const _0x3e1aea = getStoryClipVideoGenerationDurationOverride(_0x21419e);
  return _0x3e1aea
    ? applyStoryVideoGenerationDurationSeconds(_0x33a234, _0x20b573, _0x3e1aea)
    : normalizeStoryVideoGenerationParams(_0x33a234, _0x20b573);
}
export function resolveStoryClipVideoGenerationDurationSeconds(_0x55f2da, _0xeb0dd, _0x378650 = {}) {
  return (
    resolveStoryVideoGenerationDurationSeconds(
      _0xeb0dd,
      resolveStoryClipVideoGenerationParams(_0x55f2da, _0xeb0dd, _0x378650),
    ) ||
    normalizeDurationSeconds(
      _0x55f2da?.['durationSec'] || _0x55f2da?.['durationSeconds'] || _0x55f2da?.['duration'],
    )
  );
}
export function formatStoryClipVideoGenerationDuration(_0x2638a2, _0x60b71d, _0x5dafec = {}) {
  const _0x3695fa = resolveStoryClipVideoGenerationDurationSeconds(_0x2638a2, _0x60b71d, _0x5dafec);
  return _0x3695fa ? _0x3695fa['toFixed'](0x1) + 's' : '--';
}
export function reconcileStoryClipVideoGenerationDurationChange({
  clip: _0x52446e,
  previousModelId: previousModelId = '',
  modelId: modelId = previousModelId,
  previousGenerationParams: previousGenerationParams = {},
  nextGenerationParams: nextGenerationParams = {},
  generationParamsChanged: generationParamsChanged = ![],
  modelChanged: modelChanged = ![],
} = {}) {
  const _0xf9ba1a = normalizeStoryVideoGenerationParams(previousModelId, previousGenerationParams);
  let _0x7e8188 = normalizeStoryVideoGenerationParams(modelId, nextGenerationParams);
  if (!_0x52446e || modelChanged)
    return { generationParams: _0x7e8188, durationChanged: ![], overrideChanged: ![] };
  const _0x30c33e = resolveStoryVideoGenerationDurationSeconds(previousModelId, _0xf9ba1a),
    _0x204a76 = resolveStoryClipVideoGenerationDurationSeconds(_0x52446e, previousModelId, _0xf9ba1a),
    _0x26dff3 = resolveStoryVideoGenerationDurationSeconds(modelId, _0x7e8188),
    _0x2d9ba3 = Boolean(getStoryClipVideoGenerationDurationOverride(_0x52446e)),
    _0x557ac1 = Boolean(generationParamsChanged) && _0x26dff3 > 0x0 && _0x26dff3 !== _0x204a76,
    _0x54d8e9 = _0x557ac1 ? setStoryClipVideoGenerationDurationOverride(_0x52446e, _0x26dff3) : ![];
  return (
    _0x30c33e > 0x0 &&
      (_0x557ac1 || _0x2d9ba3 || getStoryClipVideoGenerationDurationOverride(_0x52446e)) &&
      (_0x7e8188 = applyStoryVideoGenerationDurationSeconds(modelId, _0x7e8188, _0x30c33e)),
    { generationParams: _0x7e8188, durationChanged: _0x557ac1, overrideChanged: _0x54d8e9 }
  );
}
function getStoryVideoAspectRatioSchemaField(_0x476802) {
  const _0x48f495 = resolveModelExecution(_0x476802),
    _0x34323f = Array['isArray'](_0x48f495?.['modelManifest']?.['uiSchema']?.['fields'])
      ? _0x48f495['modelManifest']['uiSchema']['fields']
      : [];
  return (
    _0x34323f['find'](
      (_0x27c7d6) =>
        normalizeText(_0x27c7d6?.['id']) === 'aspectRatio' ||
        normalizeText(_0x27c7d6?.['displayRole']) === 'aspectRatio',
    ) || null
  );
}
function getStoryVideoSchemaOptionValues(_0x229c90) {
  return (Array['isArray'](_0x229c90?.['options']) ? _0x229c90['options'] : [])
    ['map']((_0x16d2f7) =>
      normalizeText(_0x16d2f7 && typeof _0x16d2f7 === 'object' ? _0x16d2f7['value'] : _0x16d2f7),
    )
    ['filter'](Boolean);
}
export function resolveStoryVideoClipDurationConstraints(_0x1a6980) {
  const _0x22efa0 = getStoryVideoDurationSchemaField(_0x1a6980);
  if (!_0x22efa0) return null;
  const _0x462cab = [
      ...new Set(
        (Array['isArray'](_0x22efa0['options']) ? _0x22efa0['options'] : [])
          ['map']((_0x5d9825) =>
            Number(_0x5d9825 && typeof _0x5d9825 === 'object' ? _0x5d9825['value'] : _0x5d9825),
          )
          ['filter']((_0x31bed0) => Number['isFinite'](_0x31bed0) && _0x31bed0 > 0x0),
      ),
    ]['sort']((_0x4fe60b, _0x40e44f) => _0x4fe60b - _0x40e44f),
    _0x27239f = Number(_0x22efa0['min']),
    _0x1cf4b8 = Number(_0x22efa0['max']),
    _0x45e1de = Number(_0x22efa0['step']),
    _0x5bdbf7 = {
      minSeconds: Number['isFinite'](_0x27239f) && _0x27239f > 0x0 ? _0x27239f : _0x462cab[0x0] || 0x0,
      maxSeconds: Number['isFinite'](_0x1cf4b8) && _0x1cf4b8 > 0x0 ? _0x1cf4b8 : _0x462cab['at'](-0x1) || 0x0,
      stepSeconds: Number['isFinite'](_0x45e1de) && _0x45e1de > 0x0 ? _0x45e1de : 0x0,
      allowedSeconds: _0x462cab,
    };
  return _0x5bdbf7['minSeconds'] || _0x5bdbf7['maxSeconds'] || _0x5bdbf7['allowedSeconds']['length']
    ? _0x5bdbf7
    : null;
}
export function getStoryVideoFixedInputVisibilityKey(_0x3e2116, _0x452e33 = '', _0x57e286 = {}) {
  const _0x1fead0 = resolveModelExecution(_0x3e2116, { providerHint: _0x452e33 }),
    _0x2eb681 = getFixedInputSlotConfigFromManifest(
      { model: _0x3e2116, provider: _0x452e33, generationParams: _0x57e286 },
      { manifest: _0x1fead0?.['modelManifest'] || null },
    );
  if (shouldHideFixedInputSlots(_0x2eb681)) return '';
  return normalizeText(_0x2eb681?.['visibilityLayoutKey']);
}
export function applyStoryVideoInitialModeDefault(_0x26f556, _0x3cc7b6 = {}) {
  const _0x515dd4 = getStoryVideoInitialGenerationDefaults(_0x26f556);
  if (!Object['keys'](_0x515dd4)['length']) return _0x3cc7b6;
  return { ...(_0x3cc7b6 && typeof _0x3cc7b6 === 'object' ? _0x3cc7b6 : {}), ..._0x515dd4 };
}
function getStoryVideoInitialGenerationDefaults(_0x589629) {
  const _0x315027 = STORY_VIDEO_REFERENCE_DEFAULT_MODE_FIELDS[_0x589629],
    _0x153178 = resolveModelExecution(_0x589629),
    _0x480efc = _0x153178?.['modelManifest']?.['extensions']?.['storyWorkspace']?.['defaultGenerationParams'];
  return {
    ...(_0x315027 ? { [_0x315027]: 'reference' } : {}),
    ...(_0x480efc && typeof _0x480efc === 'object' && !Array['isArray'](_0x480efc) ? _0x480efc : {}),
  };
}
export function normalizeStoryVideoGenerationParams(_0x4b4101, _0x586648 = {}) {
  const _0x4f4c1e = _0x586648 && typeof _0x586648 === 'object' ? _0x586648 : {},
    _0x280638 = getStoryVideoInitialGenerationDefaults(_0x4b4101),
    _0x9f0c75 = Object['keys'](_0x280638)['some']((_0x1bad62) => !Object['hasOwn'](_0x4f4c1e, _0x1bad62))
      ? { ..._0x280638, ..._0x4f4c1e }
      : _0x4f4c1e;
  return sanitizeModelUiSchemaParams(_0x4b4101, _0x9f0c75, { includeDefaults: !![] });
}
export function applyStoryAspectRatioToVideoGenerationParams(_0x5cdbd2, _0x3eab50 = {}, _0x732cdc = '16:9') {
  const _0x5353ef = getStoryVideoAspectRatioSchemaField(_0x5cdbd2),
    _0x4267e3 = normalizeStoryVideoGenerationParams(_0x5cdbd2, _0x3eab50);
  if (!_0x5353ef?.['id']) return _0x4267e3;
  const _0x1abf89 = normalizeStoryAspectRatio(_0x732cdc),
    _0xa07377 = getStoryVideoSchemaOptionValues(_0x5353ef);
  if (_0xa07377['length'] && !_0xa07377['includes'](_0x1abf89)) return _0x4267e3;
  return normalizeStoryVideoGenerationParams(_0x5cdbd2, { ..._0x4267e3, [_0x5353ef['id']]: _0x1abf89 });
}
export function seedStoryAspectRatioInVideoGenerationParams(_0x2a29c1, _0x2f386f = {}, _0x358dae = '16:9') {
  const _0x5422a3 = getStoryVideoAspectRatioSchemaField(_0x2a29c1),
    _0x52594f = normalizeStoryVideoGenerationParams(_0x2a29c1, _0x2f386f);
  if (!_0x5422a3?.['id']) return _0x52594f;
  const _0x474ec3 = normalizeText(_0x2f386f?.[_0x5422a3['id']]),
    _0x2c64e3 = getStoryVideoSchemaOptionValues(_0x5422a3);
  if (_0x474ec3 && (!_0x2c64e3['length'] || _0x2c64e3['includes'](_0x474ec3))) return _0x52594f;
  return applyStoryAspectRatioToVideoGenerationParams(_0x2a29c1, _0x52594f, _0x358dae);
}
export function recoverUnavailableStoryVideoModelState(_0x99f216 = {}, { clip: clip = null } = {}) {
  const _0x41e3ae = normalizeText(_0x99f216['models']?.['video']),
    _0x2888f6 = normalizeText(_0x99f216['videoProvider']),
    _0x86b2bb =
      resolveModelExecution(_0x41e3ae) || resolveModelExecution(_0x41e3ae, { providerHint: _0x2888f6 });
  if (
    _0x86b2bb?.['modelManifest']?.['kind'] === 'video' &&
    _0x86b2bb?.['executionManifest']?.['kind'] === 'video' &&
    isStoryWorkspaceModelVisible('video', _0x86b2bb['modelManifest'])
  ) {
    const _0x3e965a = normalizeText(_0x86b2bb['modelManifest']['provider']);
    if (_0x3e965a && _0x3e965a !== _0x2888f6) return ((_0x99f216['videoProvider'] = _0x3e965a), !![]);
    return ![];
  }
  const _0x386b9e = resolveStoryWorkspaceModelId('video'),
    _0x5a07de = resolveModelExecution(_0x386b9e);
  if (
    !_0x386b9e ||
    _0x5a07de?.['modelManifest']?.['kind'] !== 'video' ||
    _0x5a07de?.['executionManifest']?.['kind'] !== 'video'
  )
    return ![];
  const _0xe97d1d =
      _0x99f216['videoGenerationParamsByModel'] &&
      typeof _0x99f216['videoGenerationParamsByModel'] === 'object'
        ? _0x99f216['videoGenerationParamsByModel']
        : {},
    _0x270a0e = _0xe97d1d[_0x386b9e] && typeof _0xe97d1d[_0x386b9e] === 'object' ? _0xe97d1d[_0x386b9e] : {},
    _0x3c4afb = normalizeStoryVideoGenerationParams(
      _0x386b9e,
      seedStoryAspectRatioInVideoGenerationParams(
        _0x386b9e,
        _0x270a0e,
        _0x99f216['data']?.['project']?.['aspectRatio'],
      ),
      { clip: clip },
    );
  return (
    (_0x99f216['models'] = { ...(_0x99f216['models'] || {}), video: _0x386b9e }),
    (_0x99f216['videoProvider'] = normalizeText(_0x5a07de['modelManifest']['provider'])),
    (_0x99f216['videoProviderProfileId'] = resolveModelProviderProfileId({
      model: _0x386b9e,
      providerProfileId: '',
      providerProfileIdByModel: _0x99f216['videoProviderProfileIdByModel'],
    })),
    (_0x99f216['videoGenerationParams'] = _0x3c4afb),
    (_0x99f216['videoGenerationParamsByModel'] = { ..._0xe97d1d, [_0x386b9e]: { ..._0x3c4afb } }),
    !![]
  );
}
export function applyStoryPromptModeVideoModelDefault(_0x36e63b = {}, _0x1e48b4 = 'seedance-2.0') {
  const _0x45d025 = resolveStoryPromptModeDefaultVideoModelId(_0x1e48b4);
  return applyStoryVideoModelDefault(_0x36e63b, _0x45d025);
}
export function applyStoryVideoModelDefault(_0x29f47d = {}, _0x205de4 = '') {
  if (!normalizeText(_0x205de4)) return ![];
  const _0x1af41c = resolveStoryWorkspaceModelId('video', _0x205de4);
  if (!_0x1af41c || _0x1af41c !== _0x205de4) return ![];
  const _0x48fe56 = resolveModelExecution(_0x1af41c);
  if (
    _0x48fe56?.['modelManifest']?.['kind'] !== 'video' ||
    _0x48fe56?.['executionManifest']?.['kind'] !== 'video'
  )
    return ![];
  const _0x27cc89 =
      _0x29f47d['videoGenerationParamsByModel'] &&
      typeof _0x29f47d['videoGenerationParamsByModel'] === 'object'
        ? _0x29f47d['videoGenerationParamsByModel']
        : {},
    _0x7b2c86 = _0x27cc89[_0x1af41c] && typeof _0x27cc89[_0x1af41c] === 'object' ? _0x27cc89[_0x1af41c] : {},
    _0x1cff77 = applyStoryAspectRatioToVideoGenerationParams(
      _0x1af41c,
      normalizeStoryVideoGenerationParams(_0x1af41c, _0x7b2c86),
      _0x29f47d['data']?.['project']?.['aspectRatio'],
    );
  return (
    (_0x29f47d['models'] = { ...(_0x29f47d['models'] || {}), video: _0x1af41c }),
    (_0x29f47d['videoProvider'] = resolveStoryVideoProvider(_0x1af41c)),
    (_0x29f47d['videoProviderProfileId'] = resolveModelProviderProfileId({
      model: _0x1af41c,
      providerProfileId: '',
      providerProfileIdByModel: _0x29f47d['videoProviderProfileIdByModel'],
    })),
    (_0x29f47d['videoGenerationParams'] = _0x1cff77),
    (_0x29f47d['videoGenerationParamsByModel'] = { ..._0x27cc89, [_0x1af41c]: { ..._0x1cff77 } }),
    !![]
  );
}
export function applyStoryEpisodeVideoModelDefault(_0x57798e = {}, _0x6274de = {}) {
  const _0x17d7a8 =
    normalizeText(_0x6274de?.['videoModelId']) ||
    resolveStoryPromptModeDefaultVideoModelId(_0x6274de?.['promptMode']);
  return applyStoryVideoModelDefault(_0x57798e, _0x17d7a8);
}
export function rememberStoryEpisodeVideoModelSelection(_0x10c70e = {}, _0x52ae1b = '') {
  if (!_0x10c70e || typeof _0x10c70e !== 'object' || Array['isArray'](_0x10c70e)) return ![];
  const _0x3c9d65 = normalizeText(_0x52ae1b);
  if (
    !_0x3c9d65 ||
    resolveStoryWorkspaceModelId('video', _0x3c9d65) !== _0x3c9d65 ||
    normalizeText(_0x10c70e['videoModelId']) === _0x3c9d65
  )
    return ![];
  return ((_0x10c70e['videoModelId'] = _0x3c9d65), !![]);
}
export function resolveStoryClipVideoGenerationSettings(
  _0xfeaea0,
  _0x56ca05 = {},
  { fallbackModelId: fallbackModelId = '', fallbackProvider: fallbackProvider = '' } = {},
) {
  const _0x14ead5 = _0x56ca05['modelSettings'] || {},
    _0x53b556 = _0x14ead5['models']?.['video'] || fallbackModelId,
    _0x294877 = resolveStoryWorkspaceModelId('video', _0x53b556),
    _0x3a97f0 = resolveStoryVideoProvider(_0x294877, _0x14ead5['videoProvider'] || fallbackProvider),
    _0x1f654c = _0x14ead5['videoGenerationParamsByModel']?.[_0x294877],
    _0x1da971 = _0x14ead5['videoGenerationParams'],
    _0x51211f =
      _0x1da971 && typeof _0x1da971 === 'object' && Object['keys'](_0x1da971)['length']
        ? _0x1da971
        : _0x1f654c || {},
    _0x55c3b2 = resolveStoryClipVideoGenerationParams(
      _0xfeaea0,
      _0x294877,
      seedStoryAspectRatioInVideoGenerationParams(
        _0x294877,
        _0x51211f,
        _0x56ca05['data']?.['project']?.['aspectRatio'],
      ),
    ),
    _0x541268 = resolveModelProviderProfileId({
      model: _0x294877,
      providerProfileId: _0x14ead5['videoProviderProfileId'],
      providerProfileIdByModel: _0x14ead5['videoProviderProfileIdByModel'],
    });
  return {
    modelId: _0x294877,
    provider: _0x3a97f0,
    providerProfileId: _0x541268,
    generationParams: _0x55c3b2,
  };
}

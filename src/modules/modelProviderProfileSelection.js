import { getModelManifest } from '../manifests/index.js';
import { getProviderConfig } from '../../api/configApi.js';
import {
  normalizeRunningHubModelApiProfileId,
  RUNNINGHUB_SITE_PROFILE_IDS,
} from './runningHubProviderProfiles.js';
export const MODEL_PROVIDER_PROFILE_MEMORY_KEY = 'providerProfileIdByModel';
function isPlainObject(_0x12f293) {
  return !!_0x12f293 && typeof _0x12f293 === 'object' && !Array['isArray'](_0x12f293);
}
function resolveManifest(_0x3e52b9) {
  if (isPlainObject(_0x3e52b9)) return _0x3e52b9;
  const _0x16f349 = String(_0x3e52b9 || '')['trim']();
  return _0x16f349 ? getModelManifest(_0x16f349) : null;
}
export function getModelProviderProfileMemoryKey(_0x4cf3f7) {
  const _0x154658 = resolveManifest(_0x4cf3f7);
  return String(_0x154658?.['modelId'] || _0x4cf3f7 || '')['trim']();
}
export function getModelProviderProfileIds(_0x5c72d0) {
  const _0x1a7bed = resolveManifest(_0x5c72d0),
    _0x3c7c14 = Array['isArray'](_0x1a7bed?.['extensions']?.['providerProfiles'])
      ? _0x1a7bed['extensions']['providerProfiles']
      : [],
    _0x589a2d =
      _0x3c7c14['length'] > 0x0
        ? _0x3c7c14
        : _0x1a7bed?.['provider'] === 'runninghubwf' && _0x1a7bed?.['adapterType'] === 'workflow'
          ? RUNNINGHUB_SITE_PROFILE_IDS
          : [];
  return [...new Set(_0x589a2d['map']((_0x346ae2) => String(_0x346ae2 || '')['trim']())['filter'](Boolean))];
}
export function normalizeModelProviderProfileId(_0x34f0a3, _0x4145c1) {
  const _0x47504b = resolveManifest(_0x34f0a3),
    _0x171c93 = getModelProviderProfileIds(_0x34f0a3);
  if (!_0x171c93['length']) return '';
  const _0x20c09d = String(_0x4145c1 || '')['trim']();
  if (_0x171c93['includes'](_0x20c09d)) return _0x20c09d;
  if (_0x47504b?.['provider'] === 'runninghubwf' && _0x47504b?.['adapterType'] === 'workflow') {
    const _0x333baf = String(getProviderConfig('runninghubwf')?.['providerProfileId'] || '')['trim']();
    if (_0x171c93['includes'](_0x333baf)) return _0x333baf;
  }
  return _0x171c93[0x0];
}
export function resolveModelGenerationProviderProfileId(_0x4ee700, _0x50100e, _0x1c94a1) {
  const _0xed937b = resolveManifest(_0x4ee700),
    _0x3944a4 = isPlainObject(_0x4ee700) ? '' : String(_0x4ee700 || '')['trim'](),
    _0x3ce936 = Boolean(
      _0xed937b?.['provider'] &&
      (isPlainObject(_0x4ee700) || String(_0xed937b['modelId'] || '')['trim']() === _0x3944a4),
    ),
    _0x31286d = String(_0x3ce936 ? _0xed937b['provider'] : _0x50100e || '')
      ['trim']()
      ['toLowerCase'](),
    _0x5a7f09 =
      _0x31286d === 'runninghub' ? '' : normalizeModelProviderProfileId(_0xed937b || _0x4ee700, _0x1c94a1);
  if (_0x5a7f09) return _0x5a7f09;
  const _0x3fb3ac = String(_0x1c94a1 || '')['trim']();
  return _0x31286d === 'runninghub' || (_0x31286d === 'runninghubwf' && _0x3fb3ac)
    ? normalizeRunningHubModelApiProfileId(_0x3fb3ac)
    : '';
}
export function resolveReadyModelProviderProfileId(_0x7aed48, _0x30eb2c, _0xa6f4ff) {
  const _0x45abc1 = getModelProviderProfileIds(_0x7aed48),
    _0x35a27e = normalizeModelProviderProfileId(_0x7aed48, _0x30eb2c);
  if (!_0x35a27e || typeof _0xa6f4ff !== 'function') return _0x35a27e;
  const _0x13ae35 = _0xa6f4ff(_0x35a27e);
  if (_0x13ae35 !== ![]) return _0x35a27e;
  return _0x45abc1['find']((_0x5b0e6a) => _0xa6f4ff(_0x5b0e6a) === !![]) || _0x35a27e;
}
export function sanitizeModelProviderProfileMemory(_0x20c4e2) {
  if (!isPlainObject(_0x20c4e2)) return {};
  const _0x3de7d0 = {};
  return (
    Object['entries'](_0x20c4e2)['forEach'](([_0x5d4fba, _0x292a7d]) => {
      const _0xff1c05 = getModelProviderProfileMemoryKey(_0x5d4fba),
        _0x2eefb9 = normalizeModelProviderProfileId(_0xff1c05, _0x292a7d);
      if (_0xff1c05 && _0x2eefb9) _0x3de7d0[_0xff1c05] = _0x2eefb9;
    }),
    _0x3de7d0
  );
}
export function resolveModelProviderProfileId(_0x5c115a = {}, _0x2ef590 = _0x5c115a?.['model']) {
  const _0x4eed3d = getModelProviderProfileMemoryKey(_0x2ef590);
  if (!_0x4eed3d) return '';
  const _0x21c644 = sanitizeModelProviderProfileMemory(_0x5c115a?.[MODEL_PROVIDER_PROFILE_MEMORY_KEY]),
    _0x3ce2f1 =
      String(_0x5c115a?.['model'] || '')['trim']() === String(_0x2ef590 || '')['trim']()
        ? _0x5c115a?.['providerProfileId'] || _0x21c644[_0x4eed3d]
        : _0x21c644[_0x4eed3d];
  return normalizeModelProviderProfileId(_0x4eed3d, _0x3ce2f1);
}
export function buildModelProviderProfileSelectionPatch(
  _0x1326f4 = {},
  _0x14ce04 = _0x1326f4?.['model'],
  _0x1a903e,
) {
  const _0x3c2a39 = sanitizeModelProviderProfileMemory(_0x1326f4?.[MODEL_PROVIDER_PROFILE_MEMORY_KEY]),
    _0x122f4e = getModelProviderProfileMemoryKey(_0x1326f4?.['model']);
  _0x122f4e &&
    getModelProviderProfileIds(_0x122f4e)['length'] &&
    (_0x3c2a39[_0x122f4e] = normalizeModelProviderProfileId(
      _0x122f4e,
      _0x1326f4?.['providerProfileId'] || _0x3c2a39[_0x122f4e],
    ));
  const _0x33969b = getModelProviderProfileMemoryKey(_0x14ce04),
    _0x11528c = getModelProviderProfileIds(_0x33969b);
  if (!_0x33969b || !_0x11528c['length'])
    return { providerProfileId: '', rhProviderProfileId: '', [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: _0x3c2a39 };
  const _0x5eb757 = _0x1a903e !== undefined && _0x1a903e !== null && String(_0x1a903e)['trim']() !== '',
    _0x36d17d = normalizeModelProviderProfileId(
      _0x33969b,
      _0x5eb757
        ? _0x1a903e
        : _0x3c2a39[_0x33969b] || (_0x122f4e === _0x33969b ? _0x1326f4?.['providerProfileId'] : ''),
    );
  return (
    (_0x3c2a39[_0x33969b] = _0x36d17d),
    { providerProfileId: _0x36d17d, rhProviderProfileId: '', [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: _0x3c2a39 }
  );
}
export function getNextModelProviderProfileId(_0x27e793 = {}) {
  const _0x4befeb = getModelProviderProfileIds(_0x27e793?.['model']);
  if (_0x4befeb['length'] < 0x2) return _0x4befeb[0x0] || '';
  const _0x581e91 = resolveModelProviderProfileId(_0x27e793),
    _0xffa5dc = _0x4befeb['indexOf'](_0x581e91);
  return _0x4befeb[(_0xffa5dc + 0x1 + _0x4befeb['length']) % _0x4befeb['length']];
}

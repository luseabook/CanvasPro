import { createRunningHubMediaUploadApiKeyMissingError } from './mediaUploadErrors.js';
import { getMediaKindLabel } from './mediaUploadErrorDetails.js';
import {
  isConfiguredObjectStorageEnabled,
  isConfiguredObjectStoragePublicUrl,
  OBJECT_STORAGE_UPLOAD_PROVIDER,
} from './objectStorageApi.js';
const USER_MEDIA_STORAGE_PROVIDERS = Object['freeze']({
  FREE_IMAGE_HOST: 'freeImageHost',
  RUNNINGHUB: 'runninghub',
  OBJECT_STORAGE: OBJECT_STORAGE_UPLOAD_PROVIDER,
});
export const DEFAULT_MODEL_API_MEDIA_UPLOAD_PROVIDERS = Object['freeze']({
  image: USER_MEDIA_STORAGE_PROVIDERS['FREE_IMAGE_HOST'],
  video: USER_MEDIA_STORAGE_PROVIDERS['RUNNINGHUB'],
  audio: USER_MEDIA_STORAGE_PROVIDERS['RUNNINGHUB'],
});
function normalizeMediaUrl(_0x3ce913) {
  return String(_0x3ce913 || '')['trim']();
}
function isPrivateIpv4Host(_0x5043ed) {
  const _0x30b089 = String(_0x5043ed || '')
    ['split']('.')
    ['map']((_0x360da5) => Number(_0x360da5));
  if (_0x30b089['length'] !== 0x4 || _0x30b089['some']((_0x2b192a) => !Number['isInteger'](_0x2b192a)))
    return ![];
  const [_0x4934a0, _0xa9c978] = _0x30b089;
  return (
    _0x4934a0 === 0xa ||
    _0x4934a0 === 0x7f ||
    (_0x4934a0 === 0xac && _0xa9c978 >= 0x10 && _0xa9c978 <= 0x1f) ||
    (_0x4934a0 === 0xc0 && _0xa9c978 === 0xa8) ||
    (_0x4934a0 === 0xa9 && _0xa9c978 === 0xfe) ||
    (_0x4934a0 === 0x0 && _0xa9c978 === 0x0)
  );
}
export function isPublicHttpMediaUrl(_0x1ec40b) {
  const _0x31aa3e = normalizeMediaUrl(_0x1ec40b);
  if (!_0x31aa3e) return ![];
  try {
    const _0x4f0e03 = new URL(_0x31aa3e);
    if (_0x4f0e03['protocol'] !== 'http:' && _0x4f0e03['protocol'] !== 'https:') return ![];
    const _0x1b3d48 = _0x4f0e03['hostname']['toLowerCase']();
    if (
      _0x1b3d48 === 'localhost' ||
      _0x1b3d48 === '0.0.0.0' ||
      _0x1b3d48 === '::1' ||
      _0x1b3d48 === '[::1]' ||
      _0x1b3d48['endsWith']('.local') ||
      isPrivateIpv4Host(_0x1b3d48)
    )
      return ![];
    return !![];
  } catch {
    return ![];
  }
}
function isReusableProviderMediaUrl(_0x2ae263) {
  return /^asset:\/\//i['test'](normalizeMediaUrl(_0x2ae263));
}
function isProviderUploadRequired(_0x1ca2f9 = {}) {
  return (
    _0x1ca2f9['forceProviderUpload'] === !![] || _0x1ca2f9['uploadOptions']?.['forceProviderUpload'] === !![]
  );
}
export function isReusableModelApiMediaUrl(_0x5956f1) {
  return isPublicHttpMediaUrl(_0x5956f1) || isReusableProviderMediaUrl(_0x5956f1);
}
function shouldReuseMediaUrl(_0x592a40, _0x1f3808, _0x2be743 = {}) {
  if (isReusableProviderMediaUrl(_0x592a40)) return !![];
  if (!isPublicHttpMediaUrl(_0x592a40)) return ![];
  if (!isProviderUploadRequired(_0x2be743) && isConfiguredObjectStoragePublicUrl(_0x592a40)) return !![];
  if (_0x1f3808?.['provider'] === USER_MEDIA_STORAGE_PROVIDERS['OBJECT_STORAGE']) return ![];
  if (typeof _0x2be743['reusePublicUrls'] === 'boolean') return _0x2be743['reusePublicUrls'];
  return _0x1f3808?.['provider'] === USER_MEDIA_STORAGE_PROVIDERS['RUNNINGHUB'];
}
export function resolveUserMediaStorageUploadTarget(_0x531765 = {}, _0x354d9d = {}, _0x32398a = '') {
  const _0x4ff9a0 = isProviderUploadRequired(_0x354d9d);
  if (isConfiguredObjectStorageEnabled() && !_0x4ff9a0)
    return { provider: USER_MEDIA_STORAGE_PROVIDERS['OBJECT_STORAGE'] };
  const _0x450c5a = String(_0x32398a || _0x354d9d['mediaKind'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x12180d = _0x531765['resolveUserMediaStorageUploadTarget'];
  if (!_0x4ff9a0 && typeof _0x12180d === 'function') {
    const _0x5d5a27 = _0x12180d({ ..._0x354d9d, ...(_0x450c5a ? { mediaKind: _0x450c5a } : {}) }),
      _0xd38f7b = String(_0x5d5a27?.['provider'] || '')['trim']();
    if (_0xd38f7b) return { ..._0x5d5a27, provider: _0xd38f7b };
  }
  const _0x44a9b9 =
    String(_0x354d9d['fallbackProvider'] || '')['trim']() ||
    DEFAULT_MODEL_API_MEDIA_UPLOAD_PROVIDERS[_0x450c5a] ||
    USER_MEDIA_STORAGE_PROVIDERS['RUNNINGHUB'];
  return { provider: _0x44a9b9 };
}
export function resolveRunningHubMediaUploadApiKey(_0x5e44f1 = {}, _0x1dbe50 = {}) {
  const _0xef39fa = String(_0x1dbe50['apiKey'] || '')
    ['trim']()
    ['replace'](/^Bearer\s+/i, '');
  if (_0xef39fa) return _0xef39fa;
  const _0x51f711 = String(_0x1dbe50['providerProfileId'] || 'runninghub')['trim'](),
    _0x4b1775 =
      typeof _0x5e44f1['getProviderConfig'] === 'function'
        ? _0x5e44f1['getProviderConfig'](_0x51f711) || {}
        : {};
  return String(_0x4b1775['modelApiKey'] || _0x4b1775['apiKey'] || '')
    ['trim']()
    ['replace'](/^Bearer\s+/i, '');
}
function resolveMediaProcessor(_0x1635e1, _0x528dda = {}) {
  if (_0x1635e1 === 'image') return _0x528dda['processInputImages'];
  if (_0x1635e1 === 'video') return _0x528dda['processInputVideos'];
  if (_0x1635e1 === 'audio') return _0x528dda['processInputAudios'];
  return null;
}
function assertMediaUploadAvailable(_0x17c862, _0x3748ce, _0x1b624b) {
  if (_0x17c862 === 'image' && typeof _0x3748ce['processInputImages'] !== 'function')
    throw new Error(_0x1b624b + '：缺少图片上传能力，无法准备参考图片，请更新应用后重试');
  if (_0x17c862 === 'video' && typeof _0x3748ce['processInputVideos'] !== 'function')
    throw new Error(_0x1b624b + '：缺少视频上传能力，无法准备参考视频，请更新应用后重试');
  if (_0x17c862 === 'audio' && typeof _0x3748ce['processInputAudios'] !== 'function')
    throw new Error(_0x1b624b + '：缺少音频上传能力，无法准备参考音频，请更新应用后重试');
}
async function uploadViaTarget(_0x67b170, _0x293fbf, _0x4fc8d2, _0x44f16f, _0x4aa83c = {}) {
  const _0x464bd0 = String(_0x4fc8d2?.['provider'] || '')['trim']();
  assertMediaUploadAvailable(_0x67b170, _0x44f16f, _0x464bd0);
  const _0x1a8b9a = resolveMediaProcessor(_0x67b170, _0x44f16f);
  let _0x2b4358 = String(_0x4fc8d2?.['apiKey'] || _0x4aa83c['apiKey'] || '')['trim']();
  if (_0x464bd0 === USER_MEDIA_STORAGE_PROVIDERS['RUNNINGHUB']) {
    _0x2b4358 = resolveRunningHubMediaUploadApiKey(_0x44f16f, { ..._0x4aa83c, apiKey: _0x2b4358 });
    if (!_0x2b4358) throw createRunningHubMediaUploadApiKeyMissingError(_0x67b170);
  }
  const _0x317c73 = {
    ...(_0x4aa83c['uploadOptions'] || {}),
    ...(_0x4fc8d2?.['uploadOptions'] || {}),
    provider: _0x464bd0,
    strictUpload: _0x4aa83c['strictUpload'] !== ![],
    ...(_0x4fc8d2?.['apiUrl'] || _0x4aa83c['apiUrl']
      ? { apiUrl: _0x4fc8d2?.['apiUrl'] || _0x4aa83c['apiUrl'] }
      : {}),
  };
  return await _0x1a8b9a(_0x293fbf, _0x2b4358, _0x317c73);
}
export async function uploadModelApiMediaInputs(_0xd3d49, _0xc9e67c, _0x3df56d, _0x1a0c03 = {}) {
  const _0x5ca34a = String(_0xd3d49 || '')
    ['trim']()
    ['toLowerCase']();
  if (!['image', 'video', 'audio']['includes'](_0x5ca34a))
    throw new Error('Unsupported media upload kind: ' + (_0x5ca34a || _0xd3d49));
  const _0x7266af = Array['isArray'](_0xc9e67c) ? _0xc9e67c['map'](normalizeMediaUrl)['filter'](Boolean) : [];
  if (_0x7266af['length'] === 0x0) return [];
  const _0x15ef89 = resolveUserMediaStorageUploadTarget(_0x3df56d, _0x1a0c03, _0x5ca34a),
    _0x141f7e = new Array(_0x7266af['length'])['fill'](''),
    _0x740ecb = [],
    _0x4d95b4 = [];
  _0x7266af['forEach']((_0x1701d1, _0xb6a6c8) => {
    if (shouldReuseMediaUrl(_0x1701d1, _0x15ef89, _0x1a0c03)) {
      _0x141f7e[_0xb6a6c8] = _0x1701d1;
      return;
    }
    (_0x4d95b4['push'](_0xb6a6c8), _0x740ecb['push'](_0x1701d1));
  });
  if (_0x740ecb['length'] === 0x0) return _0x141f7e['filter'](Boolean);
  const _0x428c70 = await uploadViaTarget(_0x5ca34a, _0x740ecb, _0x15ef89, _0x3df56d, _0x1a0c03);
  _0x4d95b4['forEach']((_0x488c65, _0xe4c8c7) => {
    _0x141f7e[_0x488c65] = String(_0x428c70?.[_0xe4c8c7] || '')['trim']();
  });
  const _0x4e5084 = _0x141f7e['filter'](Boolean);
  if (_0x1a0c03['strictUpload'] !== ![] && _0x4e5084['length'] !== _0x7266af['length']) {
    const _0x1da4f2 = _0x141f7e['flatMap']((_0x5be6b1, _0x5e34e3) => (_0x5be6b1 ? [] : [_0x5e34e3 + 0x1]));
    throw new Error(
      _0x15ef89['provider'] +
        '\x20' +
        getMediaKindLabel(_0x5ca34a) +
        '上传失败：第 ' +
        _0x1da4f2['join']('、') +
        ' 项未返回有效地址，请重试或重新选择素材',
    );
  }
  return _0x4e5084;
}

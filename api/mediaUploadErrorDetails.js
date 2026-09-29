import { ErrorType } from './errors/ApiError.js';
export function getMediaKindLabel(_0xd58a36) {
  return { image: '图片', video: '视频', audio: '音频' }[_0xd58a36] || '素材';
}
function getMediaUploadFailureReason(_0x293ccc, _0x2396cc) {
  const _0x25abcf = String(_0x293ccc?.['message'] || '')['trim'](),
    _0x5ad5be = Number(_0x293ccc?.['status'] ?? _0x293ccc?.['statusCode'] ?? _0x293ccc?.['httpStatus']),
    _0x46d8f2 = _0x293ccc?.['type'],
    _0x4ab2ae = _0x293ccc?.['provider'] === 'remote';
  if (['InputVideoFetchError', 'InputAudioFetchError']['includes'](_0x293ccc?.['name'])) return _0x25abcf;
  if (_0x46d8f2 === ErrorType['TIMEOUT'] || _0x5ad5be === 0x198 || _0x5ad5be === 0x1f8)
    return '请求超时，请检查网络后重试；' + _0x2396cc + '较大时可先压缩或裁剪';
  if (_0x46d8f2 === ErrorType['NETWORK_ERROR'] || _0x46d8f2 === ErrorType['DNS_ERROR'])
    return '网络连接失败，请检查网络或代理设置后重试';
  if (_0x5ad5be === 0x191 || _0x46d8f2 === ErrorType['AUTH_ERROR'])
    return _0x4ab2ae
      ? '源' + _0x2396cc + '访问认证失败，请更新' + _0x2396cc + '链接或重新选择本地' + _0x2396cc
      : '认证失败，请检查上传服务的密钥是否有效';
  if (_0x5ad5be === 0x193 || _0x46d8f2 === ErrorType['FORBIDDEN'])
    return '访问被拒绝，请检查' + _0x2396cc + '访问权限及上传服务权限';
  if (_0x5ad5be === 0x19d) return _0x2396cc + '文件超过上传大小限制，请压缩或裁剪后重试';
  if (_0x5ad5be === 0x1ad || _0x46d8f2 === ErrorType['RATE_LIMIT']) return '请求过于频繁，请稍后重试';
  if (_0x5ad5be >= 0x1f4 && _0x5ad5be <= 0x257)
    return _0x4ab2ae
      ? _0x2396cc + '来源服务暂时不可用，请稍后重试或重新选择本地' + _0x2396cc
      : '上传服务暂时不可用，请稍后重试';
  if (_0x5ad5be === 0x194)
    return _0x4ab2ae
      ? '源' + _0x2396cc + '链接已失效或文件不存在，请更新链接或重新选择' + _0x2396cc
      : _0x2396cc + '文件或上传接口不存在，请重新选择' + _0x2396cc + '或检查上传地址';
  return _0x25abcf || '未获取到有效的' + _0x2396cc + '地址，请重试或重新选择源' + _0x2396cc;
}
export function createMediaUploadError(
  _0x1fc6ef,
  { kind: kind = 'video', label: label = '源' + getMediaKindLabel(kind) + '上传失败' } = {},
) {
  if (_0x1fc6ef?.['name'] === 'AbortError' || _0x1fc6ef?.['message'] === 'CANCELLED') return _0x1fc6ef;
  const _0x4b23ac = getMediaUploadFailureReason(_0x1fc6ef, getMediaKindLabel(kind)),
    _0x47be46 = String(_0x1fc6ef?.['message'] || '')['trim'](),
    _0x1243f5 = Number(_0x1fc6ef?.['status'] ?? _0x1fc6ef?.['statusCode'] ?? _0x1fc6ef?.['httpStatus']),
    _0x1f9b12 = _0x1243f5 >= 0x190 && _0x1243f5 <= 0x257 ? '（HTTP\x20' + _0x1243f5 + '）' : '',
    _0x44d0ff = _0x47be46 && !_0x4b23ac['includes'](_0x47be46) ? '；详情：' + _0x47be46 : '',
    _0xd6ab7e = label + '：' + _0x4b23ac + _0x1f9b12 + _0x44d0ff,
    _0x51327e = new Error(_0xd6ab7e, { cause: _0x1fc6ef });
  for (const _0x4bf95a of ['type', 'code', 'status', 'provider', 'retryable']) {
    if (_0x1fc6ef?.[_0x4bf95a] !== undefined) _0x51327e[_0x4bf95a] = _0x1fc6ef[_0x4bf95a];
  }
  return _0x51327e;
}

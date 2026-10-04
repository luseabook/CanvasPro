import { ErrorType } from './errors/ApiError.js';
export function getMediaKindLabel(value) {
  return { image: '图片', video: '视频', audio: '音频' }[value] || '素材';
}
function getMediaUploadFailureReason(error, item) {
  const key = String(error?.['message'] || '')['trim'](),
    count = Number(error?.['status'] ?? error?.['statusCode'] ?? error?.['httpStatus']),
    index = error?.['type'],
    result = error?.['provider'] === 'remote';
  if (['InputVideoFetchError', 'InputAudioFetchError']['includes'](error?.['name'])) return key;
  if (index === ErrorType['TIMEOUT'] || count === 0x198 || count === 0x1f8)
    return '请求超时，请检查网络后重试；' + item + '较大时可先压缩或裁剪';
  if (index === ErrorType['NETWORK_ERROR'] || index === ErrorType['DNS_ERROR'])
    return '网络连接失败，请检查网络或代理设置后重试';
  if (count === 0x191 || index === ErrorType['AUTH_ERROR'])
    return result
      ? '源' + item + '访问认证失败，请更新' + item + '链接或重新选择本地' + item
      : '认证失败，请检查上传服务的密钥是否有效';
  if (count === 0x193 || index === ErrorType['FORBIDDEN'])
    return '访问被拒绝，请检查' + item + '访问权限及上传服务权限';
  if (count === 0x19d) return item + '文件超过上传大小限制，请压缩或裁剪后重试';
  if (count === 0x1ad || index === ErrorType['RATE_LIMIT']) return '请求过于频繁，请稍后重试';
  if (count >= 0x1f4 && count <= 0x257)
    return result
      ? item + '来源服务暂时不可用，请稍后重试或重新选择本地' + item
      : '上传服务暂时不可用，请稍后重试';
  if (count === 0x194)
    return result
      ? '源' + item + '链接已失效或文件不存在，请更新链接或重新选择' + item
      : item + '文件或上传接口不存在，请重新选择' + item + '或检查上传地址';
  return key || '未获取到有效的' + item + '地址，请重试或重新选择源' + item;
}
export function createMediaUploadError(
  cause,
  { kind: kind = 'video', label: label = '源' + getMediaKindLabel(kind) + '上传失败' } = {},
) {
  if (cause?.['name'] === 'AbortError' || cause?.['message'] === 'CANCELLED') return cause;
  const list = getMediaUploadFailureReason(cause, getMediaKindLabel(kind)),
    data = String(cause?.['message'] || '')['trim'](),
    count2 = Number(cause?.['status'] ?? cause?.['statusCode'] ?? cause?.['httpStatus']),
    options = count2 >= 0x190 && count2 <= 0x257 ? '（HTTP\x20' + count2 + '）' : '',
    target = data && !list['includes'](data) ? '；详情：' + data : '',
    source = label + '：' + list + options + target,
    error2 = new Error(source, { cause: cause });
  for (const next of ['type', 'code', 'status', 'provider', 'retryable']) {
    if (cause?.[next] !== undefined) error2[next] = cause[next];
  }
  return error2;
}

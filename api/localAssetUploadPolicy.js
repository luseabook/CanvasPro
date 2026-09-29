import { ApiError, ErrorType } from './errors/ApiError.js';
import { parseError } from './errors/ErrorParser.js';
const LOCAL_ASSET_UPLOAD_MAX_BYTES = 0x12c * 0x400 * 0x400;
function createUploadSizeError(_0x40abc3, _0x64de29) {
  return new ApiError({
    type: ErrorType['INVALID_PARAMS'],
    message: _0x40abc3,
    provider: 'local',
    status: 0x19d,
    code: 'UPLOAD_TOO_LARGE',
    retryable: ![],
    raw: _0x64de29,
  });
}
export function assertLocalAssetUploadSize(_0x4d77ff) {
  if (Number(_0x4d77ff?.['size']) > LOCAL_ASSET_UPLOAD_MAX_BYTES)
    throw createUploadSizeError('文件大小超出上传上限，单个文件最大支持 300 MB，请压缩或裁剪后重新上传。');
}
export function parseLocalAssetUploadError(_0x1d71d0, _0x3022aa, _0x22dc52) {
  if (Number(_0x22dc52) === 0x19d)
    return createUploadSizeError('文件大小超出服务器上传上限，请压缩或裁剪后重新上传。', _0x3022aa);
  const _0x32be2d = parseError(_0x1d71d0, _0x3022aa, _0x22dc52),
    _0x5791ba = _0x32be2d?.['message'] || '';
  if (/\bENOSPC\b|\[Errno 28\]|\[WinError 112\]|No space left on device/i['test'](_0x5791ba))
    ((_0x32be2d['message'] = '文件上传失败：保存目录所在磁盘空间不足，请清理空间后重新上传。'),
      (_0x32be2d['code'] = 'UPLOAD_DISK_FULL'),
      (_0x32be2d['retryable'] = ![]));
  else {
    if (
      /\bEACCES\b|\bEPERM\b|\[Errno 13\]|\[WinError 5\]|Permission denied|Access is denied/i['test'](
        _0x5791ba,
      )
    )
      ((_0x32be2d['message'] =
        '文件上传失败：保存目录没有写入权限，请检查目录权限或更换保存目录后重新上传。'),
        (_0x32be2d['code'] = 'UPLOAD_PERMISSION_DENIED'),
        (_0x32be2d['retryable'] = ![]));
    else {
      if (_0x5791ba === 'Upload\x20is\x20incomplete')
        ((_0x32be2d['message'] = '文件未传输完整，请重新上传。'),
          (_0x32be2d['code'] = 'UPLOAD_INCOMPLETE'),
          (_0x32be2d['retryable'] = !![]));
      else
        _0x5791ba === 'Unable\x20to\x20allocate\x20staged\x20upload' &&
          ((_0x32be2d['message'] = '无法创建上传临时文件，请检查保存目录的可用空间和写入权限后重新上传。'),
          (_0x32be2d['code'] = 'UPLOAD_STAGING_FAILED'),
          (_0x32be2d['retryable'] = ![]));
    }
  }
  return _0x32be2d;
}

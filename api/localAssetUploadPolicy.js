import { ApiError, ErrorType } from './errors/ApiError.js';
import { parseError } from './errors/ErrorParser.js';
const LOCAL_ASSET_UPLOAD_MAX_BYTES = 300 * 1024 * 1024;
function createUploadSizeError(message, raw) {
  return new ApiError({
    type: ErrorType.INVALID_PARAMS,
    message: message,
    provider: 'local',
    status: 413,
    code: 'UPLOAD_TOO_LARGE',
    retryable: false,
    raw: raw,
  });
}
export function assertLocalAssetUploadSize(value) {
  if (Number(value?.size) > LOCAL_ASSET_UPLOAD_MAX_BYTES)
    throw createUploadSizeError('文件大小超出上传上限，单个文件最大支持 300 MB，请压缩或裁剪后重新上传。');
}
export function parseLocalAssetUploadError(item, key, index) {
  if (Number(index) === 413)
    return createUploadSizeError('文件大小超出服务器上传上限，请压缩或裁剪后重新上传。', key);
  const error = parseError(item, key, index),
    result = error?.message || '';
  if (/\bENOSPC\b|\[Errno 28\]|\[WinError 112\]|No space left on device/i.test(result))
    ((error.message = '文件上传失败：保存目录所在磁盘空间不足，请清理空间后重新上传。'),
      (error.code = 'UPLOAD_DISK_FULL'),
      (error.retryable = false));
  else {
    if (
      /\bEACCES\b|\bEPERM\b|\[Errno 13\]|\[WinError 5\]|Permission denied|Access is denied/i.test(result)
    )
      ((error.message = '文件上传失败：保存目录没有写入权限，请检查目录权限或更换保存目录后重新上传。'),
        (error.code = 'UPLOAD_PERMISSION_DENIED'),
        (error.retryable = false));
    else {
      if (result === 'Upload is incomplete')
        ((error.message = '文件未传输完整，请重新上传。'),
          (error.code = 'UPLOAD_INCOMPLETE'),
          (error.retryable = true));
      else
        result === 'Unable to allocate staged upload' &&
          ((error.message = '无法创建上传临时文件，请检查保存目录的可用空间和写入权限后重新上传。'),
          (error.code = 'UPLOAD_STAGING_FAILED'),
          (error.retryable = false));
    }
  }
  return error;
}

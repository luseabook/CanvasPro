export const RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING = 'RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING';
export const RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE =
  '需要配置 RunningHub API Key 用于上传视频/音频';
export function createRunningHubMediaUploadApiKeyMissingError(value = '') {
  const error = new Error(RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE);
  return (
    (error.name = 'RunningHubMediaUploadApiKeyMissingError'),
    (error.code = RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING),
    (error.provider = 'runninghub'),
    (error.kind = value),
    (error.retryable = false),
    error
  );
}
export function isRunningHubMediaUploadApiKeyMissingError(item) {
  return String(item?.code || '') === RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING;
}

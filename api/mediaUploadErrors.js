export const RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING = 'RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING';
export const RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE =
  '需要配置 RunningHub API Key 用于上传视频/音频';
export function createRunningHubMediaUploadApiKeyMissingError(_0x57b4d7 = '') {
  const _0x347742 = new Error(RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING_MESSAGE);
  return (
    (_0x347742['name'] = 'RunningHubMediaUploadApiKeyMissingError'),
    (_0x347742['code'] = RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING),
    (_0x347742['provider'] = 'runninghub'),
    (_0x347742['kind'] = _0x57b4d7),
    (_0x347742['retryable'] = ![]),
    _0x347742
  );
}
export function isRunningHubMediaUploadApiKeyMissingError(_0x148270) {
  return String(_0x148270?.['code'] || '') === RUNNINGHUB_MEDIA_UPLOAD_API_KEY_MISSING;
}

function pickFirstUploadMessage(value) {
  for (const item of value) {
    if (typeof item === 'string' && item.trim()) return item.trim();
  }
  return '';
}
const RUNNINGHUB_UPLOAD_SUCCESS_CODES = new Set(['0', '200', 'ok', 'success']);
export function hasRunningHubUploadFailureCode(key) {
  const index = key?.code;
  if (index === undefined || index === null || String(index).trim() === '') return false;
  return !RUNNINGHUB_UPLOAD_SUCCESS_CODES.has(String(index).trim().toLowerCase());
}
export function getRunningHubUploadErrorMessage(error) {
  const result = error?.code,
    firstUploadMessage = pickFirstUploadMessage([
      error?.message,
      error?.msg,
      error?.errorMessage,
      error?.error,
      error?.data?.message,
      error?.data?.msg,
      error?.data?.errorMessage,
      error?.data?.error,
    ]);
  if (firstUploadMessage)
    return result === undefined ? firstUploadMessage : firstUploadMessage + ' (code: ' + result + ')';
  return result === undefined ? '未知错误' : '未知错误 (code: ' + result + ')';
}
export function getRunningHubUploadUrl(response) {
  return String(
    response?.data?.download_url ||
      response?.data?.downloadUrl ||
      response?.data?.fileUrl ||
      response?.data?.file_url ||
      response?.data?.url ||
      response?.download_url ||
      response?.downloadUrl ||
      response?.fileUrl ||
      response?.file_url ||
      response?.url ||
      '',
  ).trim();
}
export function isRunningHubUploadResponseSuccessful(data) {
  return !hasRunningHubUploadFailureCode(data) && Boolean(getRunningHubUploadUrl(data));
}

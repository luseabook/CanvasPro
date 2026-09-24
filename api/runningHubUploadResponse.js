function pickFirstUploadMessage(_0x32927d) {
  for (const _0x1140b9 of _0x32927d) {
    if (typeof _0x1140b9 === 'string' && _0x1140b9['trim']()) return _0x1140b9['trim']();
  }
  return '';
}
const RUNNINGHUB_UPLOAD_SUCCESS_CODES = new Set(['0', '200', 'ok', 'success']);
export function hasRunningHubUploadFailureCode(_0x419cec) {
  const _0x43e4c3 = _0x419cec?.['code'];
  if (_0x43e4c3 === undefined || _0x43e4c3 === null || String(_0x43e4c3)['trim']() === '') return ![];
  return !RUNNINGHUB_UPLOAD_SUCCESS_CODES['has'](String(_0x43e4c3)['trim']()['toLowerCase']());
}
export function getRunningHubUploadErrorMessage(_0xed7905) {
  const _0xd8174f = _0xed7905?.['code'],
    _0x47938f = pickFirstUploadMessage([
      _0xed7905?.['message'],
      _0xed7905?.['msg'],
      _0xed7905?.['errorMessage'],
      _0xed7905?.['error'],
      _0xed7905?.['data']?.['message'],
      _0xed7905?.['data']?.['msg'],
      _0xed7905?.['data']?.['errorMessage'],
      _0xed7905?.['data']?.['error'],
    ]);
  if (_0x47938f) return _0xd8174f === undefined ? _0x47938f : _0x47938f + ' (code: ' + _0xd8174f + ')';
  return _0xd8174f === undefined ? '未知错误' : '未知错误 (code: ' + _0xd8174f + ')';
}
export function getRunningHubUploadUrl(_0x2bbab9) {
  return String(
    _0x2bbab9?.['data']?.['download_url'] ||
      _0x2bbab9?.['data']?.['downloadUrl'] ||
      _0x2bbab9?.['data']?.['fileUrl'] ||
      _0x2bbab9?.['data']?.['file_url'] ||
      _0x2bbab9?.['data']?.['url'] ||
      _0x2bbab9?.['download_url'] ||
      _0x2bbab9?.['downloadUrl'] ||
      _0x2bbab9?.['fileUrl'] ||
      _0x2bbab9?.['file_url'] ||
      _0x2bbab9?.['url'] ||
      '',
  )['trim']();
}
export function isRunningHubUploadResponseSuccessful(_0x3e60ab) {
  return !hasRunningHubUploadFailureCode(_0x3e60ab) && Boolean(getRunningHubUploadUrl(_0x3e60ab));
}

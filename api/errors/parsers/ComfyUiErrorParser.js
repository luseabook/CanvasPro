import { ApiError, ErrorType } from '../ApiError.js';
const PROVIDER = 'comfyui',
  MAX_NODE_ERRORS = 0x4,
  MAX_ERROR_TEXT = 0x208;
function isPlainObject(_0xb6eb09) {
  return !!_0xb6eb09 && typeof _0xb6eb09 === 'object' && !Array['isArray'](_0xb6eb09);
}
function normalizeText(_0x183c3f) {
  if (_0x183c3f === undefined || _0x183c3f === null) return '';
  if (typeof _0x183c3f === 'string') return _0x183c3f['trim']();
  if (typeof _0x183c3f === 'number' || typeof _0x183c3f === 'boolean') return String(_0x183c3f);
  if (isPlainObject(_0x183c3f)) {
    const _0x5e8d04 =
      _0x183c3f['message'] ||
      _0x183c3f['details'] ||
      _0x183c3f['detail'] ||
      _0x183c3f['errorMessage'] ||
      _0x183c3f['error_message'] ||
      _0x183c3f['reason'] ||
      _0x183c3f['type'];
    if (_0x5e8d04 !== undefined && _0x5e8d04 !== null && _0x5e8d04 !== _0x183c3f) {
      const _0x342feb = normalizeText(_0x5e8d04);
      if (_0x342feb) return _0x342feb;
    }
    try {
      return JSON['stringify'](_0x183c3f);
    } catch {
      return '';
    }
  }
  return String(_0x183c3f || '')['trim']();
}
function firstText(..._0x4c379b) {
  for (const _0x588c17 of _0x4c379b) {
    const _0x565eb9 = normalizeText(_0x588c17);
    if (_0x565eb9) return _0x565eb9;
  }
  return '';
}
function truncateText(_0x4e88db, _0x4f0839 = MAX_ERROR_TEXT) {
  const _0x11b0a9 = String(_0x4e88db || '')
    ['replace'](/\s+/g, '\x20')
    ['trim']();
  if (_0x11b0a9['length'] <= _0x4f0839) return _0x11b0a9;
  return _0x11b0a9['slice'](0x0, Math['max'](0x0, _0x4f0839 - 0x1))['trim']() + '...';
}
function simplifyComfyUiDetail(_0x4ef24d) {
  const _0x229cf7 = truncateText(_0x4ef24d);
  return _0x229cf7['replace'](/\s+not in\s+\[[\s\S]*$/i, ' not in current ComfyUI list');
}
function getNodeErrors(_0x1f6ab0) {
  if (isPlainObject(_0x1f6ab0?.['node_errors']) && Object['keys'](_0x1f6ab0['node_errors'])['length'] > 0x0)
    return _0x1f6ab0['node_errors'];
  if (isPlainObject(_0x1f6ab0?.['nodeErrors']) && Object['keys'](_0x1f6ab0['nodeErrors'])['length'] > 0x0)
    return _0x1f6ab0['nodeErrors'];
  if (
    isPlainObject(_0x1f6ab0?.['error']?.['node_errors']) &&
    Object['keys'](_0x1f6ab0['error']['node_errors'])['length'] > 0x0
  )
    return _0x1f6ab0['error']['node_errors'];
  if (
    isPlainObject(_0x1f6ab0?.['error']?.['nodeErrors']) &&
    Object['keys'](_0x1f6ab0['error']['nodeErrors'])['length'] > 0x0
  )
    return _0x1f6ab0['error']['nodeErrors'];
  return null;
}
function formatNodeError(_0x41c520, _0x149d09) {
  const _0x52ae84 = isPlainObject(_0x149d09) ? _0x149d09 : {},
    _0x307b59 = firstText(
      _0x52ae84['class_type'],
      _0x52ae84['classType'],
      _0x52ae84['type'],
      _0x52ae84['title'],
      _0x52ae84['name'],
    ),
    _0x13029b = [_0x307b59 || 'node', _0x41c520]['filter'](Boolean)['join']('\x20'),
    _0x23469f = Array['isArray'](_0x52ae84['errors']) ? _0x52ae84['errors'] : [],
    _0x23243a = _0x23469f['slice'](0x0, 0x2)
      ['map']((_0x4927a4) => {
        const _0x204075 = firstText(
          _0x4927a4?.['extra_info']?.['input_name'],
          _0x4927a4?.['extraInfo']?.['inputName'],
          _0x4927a4?.['input_name'],
          _0x4927a4?.['inputName'],
        );
        let _0x1d1507 = simplifyComfyUiDetail(
          firstText(
            _0x4927a4?.['details'],
            _0x4927a4?.['detail'],
            _0x4927a4?.['message'],
            _0x4927a4?.['type'],
          ),
        );
        return (
          _0x204075 &&
            _0x1d1507 &&
            !_0x1d1507['includes'](_0x204075) &&
            (_0x1d1507 = _0x204075 + ':\x20' + _0x1d1507),
          _0x1d1507
        );
      })
      ['filter'](Boolean),
    _0x4e535f = simplifyComfyUiDetail(
      firstText(
        _0x52ae84['message'],
        _0x52ae84['error'],
        _0x52ae84['details'],
        _0x52ae84['detail'],
        _0x52ae84,
      ),
    ),
    _0x5a604a = _0x23243a['length'] ? _0x23243a['join']('；') : _0x4e535f;
  return _0x5a604a ? _0x13029b + ':\x20' + _0x5a604a : '';
}
function formatNodeErrors(_0x2ffe5b) {
  const _0x4474da = getNodeErrors(_0x2ffe5b);
  if (!_0x4474da) return '';
  const _0x4d0625 = Object['entries'](_0x4474da)
      ['slice'](0x0, MAX_NODE_ERRORS)
      ['map'](([_0x1ba92a, _0x5803a3]) => formatNodeError(_0x1ba92a, _0x5803a3))
      ['filter'](Boolean),
    _0x558f70 = Math['max'](0x0, Object['keys'](_0x4474da)['length'] - _0x4d0625['length']);
  return (
    _0x558f70 > 0x0 && _0x4d0625['push']('另有 ' + _0x558f70 + '\x20个节点错误'),
    _0x4d0625['join']('；')
  );
}
function hasComfyUiErrorShape(_0x3b8d65) {
  if (!_0x3b8d65 || typeof _0x3b8d65 !== 'object') return ![];
  return Boolean(
    _0x3b8d65['error'] ||
    _0x3b8d65['message'] ||
    _0x3b8d65['errorMessage'] ||
    _0x3b8d65['error_message'] ||
    getNodeErrors(_0x3b8d65),
  );
}
function resolveErrorType(_0xed1363, _0x2b8995, _0x209636) {
  const _0x2024e6 = String(_0xed1363?.['error']?.['type'] || _0xed1363?.['type'] || '')['toLowerCase'](),
    _0x25f156 = String(_0x209636 || '')['toLowerCase']();
  if (
    _0x2b8995 === 0x190 ||
    _0x2024e6['includes']('validation') ||
    _0x2024e6['includes']('invalid') ||
    _0x25f156['includes']('failed validation') ||
    _0x25f156['includes']('value not in list') ||
    _0x25f156['includes']('not in current comfyui list')
  )
    return ErrorType['INVALID_PARAMS'];
  if (_0x2b8995 >= 0x1f4) return ErrorType['SERVER_ERROR'];
  return ErrorType['TASK_FAILED'];
}
function buildComfyUiErrorMessage(_0x104159, _0x19d426 = 'ComfyUI 工作流执行失败') {
  const _0x227822 = firstText(
      _0x104159?.['error']?.['message'],
      _0x104159?.['message'],
      _0x104159?.['errorMessage'],
      _0x104159?.['error_message'],
      _0x104159?.['error']?.['type'],
    ),
    _0x7aac04 = firstText(_0x104159?.['error']?.['details'], _0x104159?.['details'], _0x104159?.['detail']),
    _0xd94e3e = formatNodeErrors(_0x104159),
    _0x399ecb = [];
  if (_0x227822) _0x399ecb['push'](truncateText(_0x227822));
  if (_0x7aac04 && _0x7aac04 !== _0x227822) _0x399ecb['push'](simplifyComfyUiDetail(_0x7aac04));
  if (_0xd94e3e) _0x399ecb['push'](_0xd94e3e);
  const _0x3815c2 = _0x399ecb['join']('；') || normalizeText(_0x104159) || _0x19d426;
  return _0x3815c2['startsWith']('ComfyUI') ? _0x3815c2 : 'ComfyUI 工作流报错：' + _0x3815c2;
}
export function parseError(_0x26dd44, _0x49ff79 = 0x0) {
  if (!hasComfyUiErrorShape(_0x26dd44) && Number(_0x49ff79) < 0x190) return null;
  const _0x445f2b = buildComfyUiErrorMessage(_0x26dd44, 'ComfyUI 请求失败');
  return new ApiError({
    type: resolveErrorType(_0x26dd44, Number(_0x49ff79) || 0x0, _0x445f2b),
    provider: PROVIDER,
    status: _0x49ff79,
    message: _0x445f2b,
    raw: _0x26dd44,
    retryable: Number(_0x49ff79) >= 0x1f4,
  });
}
export function parseTaskError(_0x565c38) {
  if (!hasComfyUiErrorShape(_0x565c38)) return null;
  const _0x20aa78 = String(_0x565c38?.['status'] || _0x565c38?.['state'] || '')['toLowerCase']();
  if (_0x20aa78 && !['failed', 'fail', 'error', 'cancelled', 'canceled']['includes'](_0x20aa78)) return null;
  return new ApiError({
    type: ErrorType['TASK_FAILED'],
    provider: PROVIDER,
    message: buildComfyUiErrorMessage(_0x565c38),
    raw: _0x565c38,
    retryable: ![],
  });
}
export default { parseError: parseError, parseTaskError: parseTaskError };

const COMMON_ASPECT_RATIO_VALUES = Object['freeze']([
    '1:1',
    '3:4',
    '4:3',
    '9:16',
    '16:9',
    '21:9',
    '3:2',
    '2:3',
  ]),
  COMMON_EDITABLE_PARAM_IDS = new Set([
    'aspectRatio',
    'ratio',
    'size',
    'resolution',
    'width',
    'height',
    'duration',
    'batchSize',
    'max_images',
  ]);
function gcd(_0x40b9b, _0x484fb3) {
  let _0x171364 = Math['abs'](Math['round'](Number(_0x40b9b) || 0x0)),
    _0x175b7a = Math['abs'](Math['round'](Number(_0x484fb3) || 0x0));
  while (_0x175b7a) {
    const _0x5b49f5 = _0x171364 % _0x175b7a;
    ((_0x171364 = _0x175b7a), (_0x175b7a = _0x5b49f5));
  }
  return _0x171364 || 0x1;
}
function normalizeOptionText(_0x42ee43) {
  return String(_0x42ee43 ?? '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/\s+/g, '')
    ['replace'](/[，,]/g, '')
    ['replace'](/×/g, 'x');
}
function getOptionValue(_0x5eeb82) {
  if (_0x5eeb82 && typeof _0x5eeb82 === 'object' && !Array['isArray'](_0x5eeb82))
    return _0x5eeb82['value'] ?? _0x5eeb82['id'] ?? _0x5eeb82['label'] ?? '';
  return _0x5eeb82;
}
function getOptionLabel(_0x15d0ae) {
  if (_0x15d0ae && typeof _0x15d0ae === 'object' && !Array['isArray'](_0x15d0ae))
    return String(_0x15d0ae['label'] ?? _0x15d0ae['selectedLabel'] ?? getOptionValue(_0x15d0ae) ?? '');
  return String(_0x15d0ae ?? '');
}
function findFieldOptionValue(_0xf4730b = {}, _0x43fc77) {
  const _0x3eb360 = Array['isArray'](_0xf4730b['options']) ? _0xf4730b['options'] : [];
  if (_0x3eb360['length'] === 0x0) return _0x43fc77;
  const _0x44c7f9 = normalizeOptionText(_0x43fc77),
    _0x5b93bb = _0x3eb360['find']((_0x48c36c) => {
      const _0x352227 = getOptionValue(_0x48c36c),
        _0x69ed5a = getOptionLabel(_0x48c36c);
      return normalizeOptionText(_0x352227) === _0x44c7f9 || normalizeOptionText(_0x69ed5a) === _0x44c7f9;
    });
  return _0x5b93bb ? getOptionValue(_0x5b93bb) : undefined;
}
function normalizeRatio(_0x1f2e82, _0x2acd6c) {
  const _0x287b02 = Number(_0x1f2e82),
    _0x3f0b38 = Number(_0x2acd6c);
  if (
    !Number['isFinite'](_0x287b02) ||
    !Number['isFinite'](_0x3f0b38) ||
    _0x287b02 <= 0x0 ||
    _0x3f0b38 <= 0x0
  )
    return '';
  const _0x2e7a40 = gcd(_0x287b02, _0x3f0b38);
  return Math['round'](_0x287b02 / _0x2e7a40) + ':' + Math['round'](_0x3f0b38 / _0x2e7a40);
}
function normalizeResolutionLabel(_0x4eebbc) {
  const _0x3e7939 = String(_0x4eebbc || '')['trim']();
  if (!_0x3e7939) return '';
  const _0x3a8a97 = /^(\d{3,4})\s*p$/i['exec'](_0x3e7939);
  if (_0x3a8a97) return _0x3a8a97[0x1] + 'p';
  if (/^([1248])\s*k$/i['test'](_0x3e7939)) return _0x3e7939['replace'](/\s+/g, '')['toUpperCase']();
  return _0x3e7939;
}
function readDimensionHint(_0x4ce0ad) {
  const _0x2e2ce8 = String(_0x4ce0ad || '')['match'](/(\d{3,5})\s*(?:x|×|\*)\s*(\d{3,5})/i);
  if (!_0x2e2ce8) return null;
  const _0x8a115 = Number(_0x2e2ce8[0x1]),
    _0x58dbc1 = Number(_0x2e2ce8[0x2]);
  if (!Number['isFinite'](_0x8a115) || !Number['isFinite'](_0x58dbc1) || _0x8a115 <= 0x0 || _0x58dbc1 <= 0x0)
    return null;
  return {
    width: Math['round'](_0x8a115),
    height: Math['round'](_0x58dbc1),
    aspectRatio: normalizeRatio(_0x8a115, _0x58dbc1),
    resolution: Math['round'](_0x58dbc1) + 'p',
  };
}
function readAspectRatioHint(_0x5acd64, _0x17df70 = null) {
  const _0x5b7ad5 = String(_0x5acd64 || ''),
    _0x1147e3 = _0x5b7ad5['match'](/(\d{1,2})\s*(?::|：|比)\s*(\d{1,2})/);
  if (_0x1147e3) {
    const _0x14d8e4 = normalizeRatio(_0x1147e3[0x1], _0x1147e3[0x2]);
    if (COMMON_ASPECT_RATIO_VALUES['includes'](_0x14d8e4)) return _0x14d8e4;
  }
  if (/横版|横屏|宽屏|\blandscape\b/i['test'](_0x5b7ad5)) return '16:9';
  if (/竖版|竖屏|纵向|\bportrait\b|\bvertical\b/i['test'](_0x5b7ad5)) return '9:16';
  if (/方图|正方形|\bsquare\b/i['test'](_0x5b7ad5)) return '1:1';
  return _0x17df70?.['aspectRatio'] || '';
}
function readResolutionHint(_0x776606, _0x5d9b41 = null) {
  const _0xc5adb2 = String(_0x776606 || ''),
    _0x3a9341 = _0xc5adb2['match'](/\b(720p|1080p|2160p|4k|2k|1k)\b/i);
  if (_0x3a9341) return normalizeResolutionLabel(_0x3a9341[0x1]);
  if (/高清|高分辨率|高画质/['test'](_0xc5adb2)) return '1080p';
  return _0x5d9b41?.['resolution'] || '';
}
function readDurationHint(_0x8a0711) {
  const _0x3c06b7 = String(_0x8a0711 || '')['match'](/(\d+(?:\.\d+)?)\s*(?:秒|seconds?|secs?|s)/i);
  if (!_0x3c06b7) return undefined;
  const _0x1e8820 = Number(_0x3c06b7[0x1]);
  return Number['isFinite'](_0x1e8820) && _0x1e8820 > 0x0 ? _0x1e8820 : undefined;
}
function readBatchSizeHint(_0x20a7bf) {
  const _0x302f5c = String(_0x20a7bf || ''),
    _0x507d53 =
      _0x302f5c['match'](/(?:批量|一次|生成|出)\s*(\d{1,2})\s*(?:张|幅|个图|images?)/i) ||
      _0x302f5c['match'](/(\d{1,2})\s*(?:张|幅)\s*(?:图|图片|照片|海报|封面)/);
  if (!_0x507d53) return undefined;
  const _0xf35dba = Number(_0x507d53[0x1]);
  return Number['isInteger'](_0xf35dba) && _0xf35dba > 0x0 ? _0xf35dba : undefined;
}
const SMALL_CHINESE_NUMBERS = Object['freeze']({
  一: 0x1,
  二: 0x2,
  两: 0x2,
  三: 0x3,
  四: 0x4,
  五: 0x5,
  六: 0x6,
  七: 0x7,
  八: 0x8,
  九: 0x9,
  十: 0xa,
});
function parseSmallPositiveInteger(_0x2d5a34) {
  const _0x3533a4 = String(_0x2d5a34 || '')['trim']();
  if (/^\d{1,2}$/['test'](_0x3533a4)) return Number(_0x3533a4);
  if (Object['prototype']['hasOwnProperty']['call'](SMALL_CHINESE_NUMBERS, _0x3533a4))
    return SMALL_CHINESE_NUMBERS[_0x3533a4];
  const _0x4ce327 = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/['exec'](_0x3533a4);
  if (!_0x4ce327) return undefined;
  return (
    (SMALL_CHINESE_NUMBERS[_0x4ce327[0x1]] || 0x1) * 0xa + (SMALL_CHINESE_NUMBERS[_0x4ce327[0x2]] || 0x0)
  );
}
export function extractAgentDuplicateCountHint(_0x15b694 = '') {
  const _0x463b62 = String(_0x15b694 || ''),
    _0x3ce71a =
      _0x463b62['match'](/(?:复制|克隆|拷贝).{0,12}?([0-9一二两三四五六七八九十]{1,3})\s*(?:份|次|个|张)/i) ||
      _0x463b62['match'](/([0-9一二两三四五六七八九十]{1,3})\s*(?:份|个|张)?\s*(?:副本|拷贝)/i) ||
      _0x463b62['match'](/\b(?:duplicate|copy|clone|make)\b.{0,20}?\b(\d{1,2})\s*(?:copies|times)\b/i),
    _0x4f1076 = parseSmallPositiveInteger(_0x3ce71a?.[0x1]);
  return Number['isInteger'](_0x4f1076) && _0x4f1076 >= 0x1 && _0x4f1076 <= 0xc ? _0x4f1076 : undefined;
}
export function extractAgentParameterHints(_0x5af65b = '') {
  const _0x5e4c21 = readDimensionHint(_0x5af65b),
    _0x59f85d = {},
    _0x4975f0 = new Set();
  _0x5e4c21 &&
    ((_0x59f85d['width'] = _0x5e4c21['width']),
    (_0x59f85d['height'] = _0x5e4c21['height']),
    _0x4975f0['add']('width'),
    _0x4975f0['add']('height'));
  const _0x5d79e2 = readAspectRatioHint(_0x5af65b, _0x5e4c21);
  _0x5d79e2 && ((_0x59f85d['aspectRatio'] = _0x5d79e2), _0x4975f0['add']('aspectRatio'));
  const _0x4de77f = readResolutionHint(_0x5af65b, _0x5e4c21);
  _0x4de77f && ((_0x59f85d['resolution'] = _0x4de77f), _0x4975f0['add']('resolution'));
  const _0xccd286 = readDurationHint(_0x5af65b);
  _0xccd286 !== undefined && ((_0x59f85d['duration'] = _0xccd286), _0x4975f0['add']('duration'));
  const _0x213bf3 = readBatchSizeHint(_0x5af65b);
  return (
    _0x213bf3 !== undefined && ((_0x59f85d['batchSize'] = _0x213bf3), _0x4975f0['add']('batchSize')),
    {
      params: _0x59f85d,
      requestedParamIds: Array['from'](_0x4975f0),
      hasHints: Object['keys'](_0x59f85d)['length'] > 0x0,
    }
  );
}
function fieldLooksLike(_0x2ca1cf = {}, _0x4b90dd, _0x1386e2 = []) {
  const _0xbd701b = String(_0x2ca1cf['id'] || ''),
    _0x5a6496 = _0xbd701b['toLowerCase'](),
    _0x37fc75 = String(_0x2ca1cf['displayRole'] || '')['toLowerCase'](),
    _0x54bb7d = String(_0x2ca1cf['label'] || '')['toLowerCase']();
  return (
    _0x37fc75 === _0x4b90dd ||
    _0x1386e2['includes'](_0xbd701b) ||
    _0x1386e2['some']((_0x1079fc) => _0x1079fc['toLowerCase']() === _0x5a6496) ||
    _0x1386e2['some']((_0x4f96f5) => _0x54bb7d['includes'](_0x4f96f5['toLowerCase']()))
  );
}
function normalizeBatchValue(_0x34681f, _0x56cd23) {
  const _0x21caf2 = findFieldOptionValue(_0x34681f, _0x56cd23);
  return _0x21caf2 !== undefined ? _0x21caf2 : _0x56cd23;
}
export function buildSupportedAgentParamsFromHints(_0x30efef = {}, _0x154661 = {}) {
  const _0x81c04 = Array['isArray'](_0x30efef?.['uiSchema']?.['fields'])
      ? _0x30efef['uiSchema']['fields']
      : [],
    _0x22f31c = _0x154661?.['params'] && typeof _0x154661['params'] === 'object' ? _0x154661['params'] : {},
    _0x453089 = {},
    _0x57ab35 = [],
    _0x224d68 = new Set(_0x154661?.['requestedParamIds'] || Object['keys'](_0x22f31c));
  for (const _0x4c766d of _0x81c04) {
    const _0x57523f = String(_0x4c766d?.['id'] || '')['trim']();
    if (!_0x57523f) continue;
    let _0x32cd7c;
    if (fieldLooksLike(_0x4c766d, 'aspectratio', ['aspectRatio', 'ratio']))
      _0x32cd7c = _0x22f31c['aspectRatio'];
    else {
      if (fieldLooksLike(_0x4c766d, 'resolution', ['resolution', 'quality', 'size']))
        _0x32cd7c = _0x22f31c['resolution'];
      else {
        if (fieldLooksLike(_0x4c766d, 'duration', ['duration', 'seconds'])) _0x32cd7c = _0x22f31c['duration'];
        else {
          if (fieldLooksLike(_0x4c766d, 'batch', ['batchSize', 'max_images', 'count']))
            _0x32cd7c = _0x22f31c['batchSize'];
          else {
            if (_0x57523f === 'width') _0x32cd7c = _0x22f31c['width'];
            else _0x57523f === 'height' && (_0x32cd7c = _0x22f31c['height']);
          }
        }
      }
    }
    if (_0x32cd7c === undefined || _0x32cd7c === '') continue;
    const _0x192660 = findFieldOptionValue(_0x4c766d, _0x32cd7c);
    if (
      Array['isArray'](_0x4c766d['options']) &&
      _0x4c766d['options']['length'] > 0x0 &&
      _0x192660 === undefined
    )
      continue;
    ((_0x453089[_0x57523f] =
      _0x57523f === 'batchSize' || _0x57523f === 'max_images'
        ? normalizeBatchValue(_0x4c766d, _0x32cd7c)
        : _0x192660 !== undefined
          ? _0x192660
          : _0x32cd7c),
      _0x57ab35['push'](_0x57523f));
    fieldLooksLike(_0x4c766d, 'aspectratio', ['aspectRatio', 'ratio']) && _0x224d68['delete']('aspectRatio');
    fieldLooksLike(_0x4c766d, 'resolution', ['resolution', 'quality', 'size']) &&
      _0x224d68['delete']('resolution');
    fieldLooksLike(_0x4c766d, 'duration', ['duration', 'seconds']) && _0x224d68['delete']('duration');
    fieldLooksLike(_0x4c766d, 'batch', ['batchSize', 'max_images', 'count']) &&
      _0x224d68['delete']('batchSize');
    if (_0x57523f === 'width') _0x224d68['delete']('width');
    if (_0x57523f === 'height') _0x224d68['delete']('height');
  }
  return { params: _0x453089, appliedParamIds: _0x57ab35, unsupportedParamIds: Array['from'](_0x224d68) };
}
export function isAgentEditableParamField(_0x2658b5 = {}, _0x1eb486 = {}) {
  const _0x559589 = String(_0x2658b5?.['id'] || '')['trim']();
  if (!_0x559589) return ![];
  const _0x2a58d0 = String(_0x2658b5['type'] || '')['toLowerCase']();
  if (!['segmented', 'select', 'slider', 'stepper', 'toggle', 'text']['includes'](_0x2a58d0)) return ![];
  if (Object['prototype']['hasOwnProperty']['call'](_0x1eb486 || {}, _0x559589)) return !![];
  return (
    COMMON_EDITABLE_PARAM_IDS['has'](_0x559589) ||
    fieldLooksLike(_0x2658b5, 'aspectratio', ['aspectRatio', 'ratio']) ||
    fieldLooksLike(_0x2658b5, 'resolution', ['resolution']) ||
    fieldLooksLike(_0x2658b5, 'duration', ['duration']) ||
    fieldLooksLike(_0x2658b5, 'batch', ['batchSize', 'max_images'])
  );
}

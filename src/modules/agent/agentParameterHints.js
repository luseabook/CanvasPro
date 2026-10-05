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
function gcd(value, item) {
  let key = Math['abs'](Math['round'](Number(value) || 0)),
    index = Math['abs'](Math['round'](Number(item) || 0));
  while (index) {
    const result = key % index;
    ((key = index), (index = result));
  }
  return key || 1;
}
function normalizeOptionText(data) {
  return String(data ?? '')
    ['trim']()
    ['toLowerCase']()
    ['replace'](/\s+/g, '')
    ['replace'](/[，,]/g, '')
    ['replace'](/×/g, 'x');
}
function getOptionValue(el) {
  if (el && typeof el === 'object' && !Array['isArray'](el))
    return el['value'] ?? el['id'] ?? el['label'] ?? '';
  return el;
}
function getOptionLabel(options) {
  if (options && typeof options === 'object' && !Array['isArray'](options))
    return String(options['label'] ?? options['selectedLabel'] ?? getOptionValue(options) ?? '');
  return String(options ?? '');
}
function findFieldOptionValue(options2 = {}, target) {
  const list = Array['isArray'](options2['options']) ? options2['options'] : [];
  if (list['length'] === 0) return target;
  const optionText = normalizeOptionText(target),
    source = list['find']((next) => {
      const optionValue = getOptionValue(next),
        optionLabel = getOptionLabel(next);
      return (
        normalizeOptionText(optionValue) === optionText || normalizeOptionText(optionLabel) === optionText
      );
    });
  return source ? getOptionValue(source) : undefined;
}
function normalizeRatio(current, entry) {
  const count = Number(current),
    count2 = Number(entry);
  if (!Number['isFinite'](count) || !Number['isFinite'](count2) || count <= 0 || count2 <= 0) return '';
  const gcd2 = gcd(count, count2);
  return Math['round'](count / gcd2) + ':' + Math['round'](count2 / gcd2);
}
function normalizeResolutionLabel(record) {
  const enabled = String(record || '')['trim']();
  if (!enabled) return '';
  const payload = /^(\d{3,4})\s*p$/i['exec'](enabled);
  if (payload) return payload[1] + 'p';
  if (/^([1248])\s*k$/i['test'](enabled)) return enabled['replace'](/\s+/g, '')['toUpperCase']();
  return enabled;
}
function readDimensionHint(handle) {
  const enabled2 = String(handle || '')['match'](/(\d{3,5})\s*(?:x|×|\*)\s*(\d{3,5})/i);
  if (!enabled2) return null;
  const count3 = Number(enabled2[1]),
    count4 = Number(enabled2[2]);
  if (!Number['isFinite'](count3) || !Number['isFinite'](count4) || count3 <= 0 || count4 <= 0)
    return null;
  return {
    width: Math['round'](count3),
    height: Math['round'](count4),
    aspectRatio: normalizeRatio(count3, count4),
    resolution: Math['round'](count4) + 'p',
  };
}
function readAspectRatioHint(state, config = null) {
  const scope = String(state || ''),
    input = scope['match'](/(\d{1,2})\s*(?::|：|比)\s*(\d{1,2})/);
  if (input) {
    const ratio = normalizeRatio(input[1], input[2]);
    if (COMMON_ASPECT_RATIO_VALUES['includes'](ratio)) return ratio;
  }
  if (/横版|横屏|宽屏|\blandscape\b/i['test'](scope)) return '16:9';
  if (/竖版|竖屏|纵向|\bportrait\b|\bvertical\b/i['test'](scope)) return '9:16';
  if (/方图|正方形|\bsquare\b/i['test'](scope)) return '1:1';
  return config?.['aspectRatio'] || '';
}
function readResolutionHint(output, value2 = null) {
  const value3 = String(output || ''),
    value4 = value3['match'](/\b(720p|1080p|2160p|4k|2k|1k)\b/i);
  if (value4) return normalizeResolutionLabel(value4[1]);
  if (/高清|高分辨率|高画质/['test'](value3)) return '1080p';
  return value2?.['resolution'] || '';
}
function readDurationHint(value5) {
  const enabled3 = String(value5 || '')['match'](/(\d+(?:\.\d+)?)\s*(?:秒|seconds?|secs?|s)/i);
  if (!enabled3) return undefined;
  const count5 = Number(enabled3[1]);
  return Number['isFinite'](count5) && count5 > 0 ? count5 : undefined;
}
function readBatchSizeHint(value6) {
  const value7 = String(value6 || ''),
    enabled4 =
      value7['match'](/(?:批量|一次|生成|出)\s*(\d{1,2})\s*(?:张|幅|个图|images?)/i) ||
      value7['match'](/(\d{1,2})\s*(?:张|幅)\s*(?:图|图片|照片|海报|封面)/);
  if (!enabled4) return undefined;
  const count6 = Number(enabled4[1]);
  return Number['isInteger'](count6) && count6 > 0 ? count6 : undefined;
}
const SMALL_CHINESE_NUMBERS = Object['freeze']({
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
});
function parseSmallPositiveInteger(value8) {
  const value9 = String(value8 || '')['trim']();
  if (/^\d{1,2}$/['test'](value9)) return Number(value9);
  if (Object['prototype']['hasOwnProperty']['call'](SMALL_CHINESE_NUMBERS, value9))
    return SMALL_CHINESE_NUMBERS[value9];
  const enabled5 = /^([一二三四五六七八九])?十([一二三四五六七八九])?$/['exec'](value9);
  if (!enabled5) return undefined;
  return (SMALL_CHINESE_NUMBERS[enabled5[1]] || 1) * 10 + (SMALL_CHINESE_NUMBERS[enabled5[2]] || 0);
}
export function extractAgentDuplicateCountHint(value10 = '') {
  const value11 = String(value10 || ''),
    value12 =
      value11['match'](/(?:复制|克隆|拷贝).{0,12}?([0-9一二两三四五六七八九十]{1,3})\s*(?:份|次|个|张)/i) ||
      value11['match'](/([0-9一二两三四五六七八九十]{1,3})\s*(?:份|个|张)?\s*(?:副本|拷贝)/i) ||
      value11['match'](/\b(?:duplicate|copy|clone|make)\b.{0,20}?\b(\d{1,2})\s*(?:copies|times)\b/i),
    smallPositiveInteger = parseSmallPositiveInteger(value12?.[1]);
  return Number['isInteger'](smallPositiveInteger) &&
    smallPositiveInteger >= 1 &&
    smallPositiveInteger <= 12
    ? smallPositiveInteger
    : undefined;
}
export function extractAgentParameterHints(value13 = '') {
  const box = readDimensionHint(value13),
    params = {},
    value14 = new Set();
  box &&
    ((params['width'] = box['width']),
    (params['height'] = box['height']),
    value14['add']('width'),
    value14['add']('height'));
  const aspectRatioHint = readAspectRatioHint(value13, box);
  aspectRatioHint && ((params['aspectRatio'] = aspectRatioHint), value14['add']('aspectRatio'));
  const resolutionHint = readResolutionHint(value13, box);
  resolutionHint && ((params['resolution'] = resolutionHint), value14['add']('resolution'));
  const durationHint = readDurationHint(value13);
  durationHint !== undefined && ((params['duration'] = durationHint), value14['add']('duration'));
  const batchSizeHint = readBatchSizeHint(value13);
  return (
    batchSizeHint !== undefined && ((params['batchSize'] = batchSizeHint), value14['add']('batchSize')),
    {
      params: params,
      requestedParamIds: Array['from'](value14),
      hasHints: Object['keys'](params)['length'] > 0,
    }
  );
}
function fieldLooksLike(options3 = {}, value15, list2 = []) {
  const value16 = String(options3['id'] || ''),
    value17 = value16['toLowerCase'](),
    value18 = String(options3['displayRole'] || '')['toLowerCase'](),
    list3 = String(options3['label'] || '')['toLowerCase']();
  return (
    value18 === value15 ||
    list2['includes'](value16) ||
    list2['some']((value19) => value19['toLowerCase']() === value17) ||
    list2['some']((value20) => list3['includes'](value20['toLowerCase']()))
  );
}
function normalizeBatchValue(value21, value22) {
  const fieldOptionValue = findFieldOptionValue(value21, value22);
  return fieldOptionValue !== undefined ? fieldOptionValue : value22;
}
export function buildSupportedAgentParamsFromHints(options4 = {}, value23 = {}) {
  const value24 = Array['isArray'](options4?.['uiSchema']?.['fields']) ? options4['uiSchema']['fields'] : [],
    box2 = value23?.['params'] && typeof value23['params'] === 'object' ? value23['params'] : {},
    params2 = {},
    appliedParamIds = [],
    map = new Set(value23?.['requestedParamIds'] || Object['keys'](box2));
  for (const value25 of value24) {
    const enabled6 = String(value25?.['id'] || '')['trim']();
    if (!enabled6) continue;
    let value26;
    if (fieldLooksLike(value25, 'aspectratio', ['aspectRatio', 'ratio'])) value26 = box2['aspectRatio'];
    else {
      if (fieldLooksLike(value25, 'resolution', ['resolution', 'quality', 'size']))
        value26 = box2['resolution'];
      else {
        if (fieldLooksLike(value25, 'duration', ['duration', 'seconds'])) value26 = box2['duration'];
        else {
          if (fieldLooksLike(value25, 'batch', ['batchSize', 'max_images', 'count']))
            value26 = box2['batchSize'];
          else {
            if (enabled6 === 'width') value26 = box2['width'];
            else enabled6 === 'height' && (value26 = box2['height']);
          }
        }
      }
    }
    if (value26 === undefined || value26 === '') continue;
    const fieldOptionValue2 = findFieldOptionValue(value25, value26);
    if (
      Array['isArray'](value25['options']) &&
      value25['options']['length'] > 0 &&
      fieldOptionValue2 === undefined
    )
      continue;
    ((params2[enabled6] =
      enabled6 === 'batchSize' || enabled6 === 'max_images'
        ? normalizeBatchValue(value25, value26)
        : fieldOptionValue2 !== undefined
          ? fieldOptionValue2
          : value26),
      appliedParamIds['push'](enabled6));
    fieldLooksLike(value25, 'aspectratio', ['aspectRatio', 'ratio']) && map['delete']('aspectRatio');
    fieldLooksLike(value25, 'resolution', ['resolution', 'quality', 'size']) && map['delete']('resolution');
    fieldLooksLike(value25, 'duration', ['duration', 'seconds']) && map['delete']('duration');
    fieldLooksLike(value25, 'batch', ['batchSize', 'max_images', 'count']) && map['delete']('batchSize');
    if (enabled6 === 'width') map['delete']('width');
    if (enabled6 === 'height') map['delete']('height');
  }
  return { params: params2, appliedParamIds: appliedParamIds, unsupportedParamIds: Array['from'](map) };
}
export function isAgentEditableParamField(options5 = {}, value27 = {}) {
  const enabled7 = String(options5?.['id'] || '')['trim']();
  if (!enabled7) return false;
  const value28 = String(options5['type'] || '')['toLowerCase']();
  if (!['segmented', 'select', 'slider', 'stepper', 'toggle', 'text']['includes'](value28)) return false;
  if (Object['prototype']['hasOwnProperty']['call'](value27 || {}, enabled7)) return true;
  return (
    COMMON_EDITABLE_PARAM_IDS['has'](enabled7) ||
    fieldLooksLike(options5, 'aspectratio', ['aspectRatio', 'ratio']) ||
    fieldLooksLike(options5, 'resolution', ['resolution']) ||
    fieldLooksLike(options5, 'duration', ['duration']) ||
    fieldLooksLike(options5, 'batch', ['batchSize', 'max_images'])
  );
}

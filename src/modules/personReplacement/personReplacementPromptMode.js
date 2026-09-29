import { formatPersonReplacementPersonLabel } from './personReplacementPromptIdentity.js';
export const PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING = 'positioning';
export const PERSON_REPLACEMENT_PROMPT_MODE_REGULAR = 'regular';
export const PERSON_REPLACEMENT_PROMPT_MODE_MANUAL = 'manual';
export const PERSON_REPLACEMENT_PROMPT_MODE_TEST = 'annotated-source-test';
export const isPersonReplacementTestModeAvailable = () => globalThis['window']?.['DEV_MODE'] === !![];
export const PERSON_REPLACEMENT_MARKER_COLORS = [
  '--annotate-red',
  '--cyan',
  '--annotate-yellow',
  '--annotate-green',
  '--annotate-purple',
  '--annotate-orange',
  '--group-pink',
  '--cyan-text',
];
export function getPersonReplacementPromptMarker(_0x537131, _0x4ca783, _0x57c3c3, _0x23e698 = 0x0) {
  if (_0x537131 === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL) return null;
  const _0x2589af =
      _0x57c3c3 === 0x1
        ? '人物'
        : _0x57c3c3 === 0x2
          ? ['左侧', '右侧'][_0x4ca783]
          : _0x57c3c3 === 0x3
            ? ['左侧', '中间', '右侧'][_0x4ca783]
            : String(_0x4ca783 + 0x1),
    _0x1f8fbb =
      _0x537131 === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING ||
      _0x537131 === PERSON_REPLACEMENT_PROMPT_MODE_TEST;
  return {
    label: _0x1f8fbb ? formatPersonReplacementPersonLabel(_0x4ca783)['replace']('人物', '') : _0x2589af,
    subject:
      _0x57c3c3 > 0x3
        ? '从左到右第' + (_0x4ca783 + 0x1) + '个人物'
        : _0x57c3c3 === 0x1
          ? '人物'
          : _0x2589af + '人物',
    referenceSlot: _0x23e698,
    colorToken:
      _0x1f8fbb && _0x23e698
        ? PERSON_REPLACEMENT_MARKER_COLORS[_0x4ca783 % PERSON_REPLACEMENT_MARKER_COLORS['length']]
        : '',
  };
}
export function normalizePersonReplacementPromptMode(_0x445831) {
  if (
    _0x445831 === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL ||
    _0x445831 === PERSON_REPLACEMENT_PROMPT_MODE_TEST
  )
    return _0x445831;
  return _0x445831 === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING
    ? PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING
    : PERSON_REPLACEMENT_PROMPT_MODE_REGULAR;
}
function describePromptSubject({ marker: _0x57a9af, person: _0x5523b3 }, _0x577849) {
  if (_0x577849 === PERSON_REPLACEMENT_PROMPT_MODE_TEST) return _0x57a9af['label'] + '框内的人物';
  if (_0x577849 === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING)
    return _0x57a9af['position'] + '（定位图' + _0x57a9af['label'] + '框）的人物';
  const _0x2e71fb = String(_0x5523b3['genderHint'] || '')
      ['trim']()
      ['toLowerCase'](),
    _0x5c381f = ['male', 'man', '男', '男性', '男人']['includes'](_0x2e71fb)
      ? '男人'
      : ['female', 'woman', '女', '女性', '女人']['includes'](_0x2e71fb)
        ? '女人'
        : '人';
  if (_0x57a9af['subject']['startsWith']('从左到右')) return _0x57a9af['subject']['replace'](/人物$/u, '人');
  return {
    左侧人物: '左边的' + _0x5c381f,
    中间人物: '中间的' + _0x5c381f,
    右侧人物: '右边的' + _0x5c381f,
    人物: '中的' + _0x5c381f,
  }[_0x57a9af['subject']];
}
export function describePersonReplacementBoxPosition(_0x5cb98e, _0x427365) {
  const _0x39fed0 = (_0x3effa0) => {
      const _0xfdc04b = _0x3effa0['locator']?.['bbox'] || _0x3effa0['bbox'];
      return { x: _0xfdc04b['x'] + _0xfdc04b['width'] / 0x2, y: _0xfdc04b['y'] + _0xfdc04b['height'] / 0x2 };
    },
    _0x2edb4a = [..._0x427365]['sort'](
      (_0xb67b88, _0x1abc9a) =>
        _0x39fed0(_0xb67b88)['x'] - _0x39fed0(_0x1abc9a)['x'] ||
        _0x39fed0(_0xb67b88)['y'] - _0x39fed0(_0x1abc9a)['y'] ||
        String(_0xb67b88['id'])['localeCompare'](String(_0x1abc9a['id'])),
    );
  return (
    '从左到右第' + (_0x2edb4a['findIndex']((_0x5c07b4) => _0x5c07b4['id'] === _0x5cb98e['id']) + 0x1) + '个'
  );
}
export function buildPersonReplacementPositioningPrompt(
  _0x37c435,
  _0x59ae26 = 0x0,
  _0x426362 = PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
  _0x27fa27 = 0x0,
) {
  const _0x4c021d = {
    'full-person': '完整人物',
    'visible-part': '当前可见部分',
    clothing: '服装',
    'arm-hand': '手臂和手部',
    'face-hair': '脸部和头发',
    feet: '脚部',
  };
  if (_0x426362 === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING)
    return [
      '任务：把图1中指定的人物替换成对应参考图中的人物。' +
        (_0x27fa27 ? '图' + _0x27fa27 + '为人物定位图。' : ''),
      ..._0x37c435['map']((_0x36e628) => {
        const _0x156fe9 = '把图1' + describePromptSubject(_0x36e628, _0x426362);
        return _0x36e628['scopeRequirement']['scope'] === 'full-person'
          ? _0x156fe9 + '替换成' + _0x36e628['reference']['label'] + '中的人物，包含外观和服装。'
          : _0x156fe9 +
              '的' +
              _0x4c021d[_0x36e628['scopeRequirement']['scope']] +
              '替换成' +
              _0x36e628['reference']['label'] +
              '中人物的对应部分。';
      }),
      '去掉画面中的字幕和LOGO。保留原人物的位置、大小、姿态和遮挡关系，除字幕和LOGO外，其余人物及未指定部分保持不变，不补画画外或被遮挡部分。',
      _0x59ae26 ? '背景改用图' + _0x59ae26 + '的场景，不引用其中人物。' : '背景和光线保持不变。',
    ]['join']('\x0a');
  return [
    _0x426362 === PERSON_REPLACEMENT_PROMPT_MODE_TEST
      ? '编辑图1，框和标签仅用于指认要替换的人物，输出时去除这些框和标签。'
      : '任务：把图1中的对应人物替换成参考图中的人物。',
    ..._0x37c435['map']((_0x553abf) =>
      _0x553abf['scopeRequirement']['scope'] === 'full-person'
        ? '把图1' +
          describePromptSubject(_0x553abf, _0x426362) +
          '替换成' +
          _0x553abf['reference']['label'] +
          (_0x426362 === PERSON_REPLACEMENT_PROMPT_MODE_REGULAR ? '中的人物，包含外观和服装' : '') +
          '。'
        : '把图1' +
          describePromptSubject(_0x553abf, _0x426362) +
          '的' +
          _0x4c021d[_0x553abf['scopeRequirement']['scope']] +
          '替换成' +
          _0x553abf['reference']['label'] +
          '中人物的对应部分。',
    ),
    ...(_0x426362 === PERSON_REPLACEMENT_PROMPT_MODE_REGULAR
      ? [
          '保留原人物的位置、大小、姿态和遮挡关系，除字幕和LOGO外，其余人物及未指定部分保持不变，不补画画外或被遮挡部分。',
          '去掉画面字幕和LOGO。',
        ]
      : []),
    _0x59ae26 ? '把图1的背景替换成图' + _0x59ae26 + '的场景。' : '',
  ]
    ['filter'](Boolean)
    ['join']('\x0a');
}
export function composePersonReplacementImagePrompt(_0x5e46d6 = {}, _0x163744 = '') {
  if (_0x5e46d6['promptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL) return String(_0x163744);
  if (!String(_0x163744)['trim']()) return _0x5e46d6['prompt'];
  return [_0x5e46d6['guidedBindingPrompt'], _0x163744]['filter'](Boolean)['join']('\x0a\x0a');
}

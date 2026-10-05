import { formatPersonReplacementPersonLabel } from './personReplacementPromptIdentity.js';
export const PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING = 'positioning';
export const PERSON_REPLACEMENT_PROMPT_MODE_REGULAR = 'regular';
export const PERSON_REPLACEMENT_PROMPT_MODE_MANUAL = 'manual';
export const PERSON_REPLACEMENT_PROMPT_MODE_TEST = 'annotated-source-test';
export const isPersonReplacementTestModeAvailable = () => globalThis['window']?.['DEV_MODE'] === true;
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
export function getPersonReplacementPromptMarker(value, item, subject, referenceSlot = 0) {
  if (value === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL) return null;
  const key =
      subject === 1
        ? '人物'
        : subject === 2
          ? ['左侧', '右侧'][item]
          : subject === 3
            ? ['左侧', '中间', '右侧'][item]
            : String(item + 1),
    label =
      value === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING || value === PERSON_REPLACEMENT_PROMPT_MODE_TEST;
  return {
    label: label ? formatPersonReplacementPersonLabel(item)['replace']('人物', '') : key,
    subject: subject > 3 ? '从左到右第' + (item + 1) + '个人物' : subject === 1 ? '人物' : key + '人物',
    referenceSlot: referenceSlot,
    colorToken:
      label && referenceSlot
        ? PERSON_REPLACEMENT_MARKER_COLORS[item % PERSON_REPLACEMENT_MARKER_COLORS['length']]
        : '',
  };
}
export function normalizePersonReplacementPromptMode(index) {
  if (index === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL || index === PERSON_REPLACEMENT_PROMPT_MODE_TEST)
    return index;
  return index === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING
    ? PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING
    : PERSON_REPLACEMENT_PROMPT_MODE_REGULAR;
}
function describePromptSubject({ marker: marker, person: person }, result) {
  if (result === PERSON_REPLACEMENT_PROMPT_MODE_TEST) return marker['label'] + '框内的人物';
  if (result === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING)
    return marker['position'] + '（定位图' + marker['label'] + '框）的人物';
  const data = String(person['genderHint'] || '')
      ['trim']()
      ['toLowerCase'](),
    options = ['male', 'man', '男', '男性', '男人']['includes'](data)
      ? '男人'
      : ['female', 'woman', '女', '女性', '女人']['includes'](data)
        ? '女人'
        : '人';
  if (marker['subject']['startsWith']('从左到右')) return marker['subject']['replace'](/人物$/u, '人');
  return {
    左侧人物: '左边的' + options,
    中间人物: '中间的' + options,
    右侧人物: '右边的' + options,
    人物: '中的' + options,
  }[marker['subject']];
}
export function describePersonReplacementBoxPosition(target, args) {
  const run = (source) => {
      const x = source['locator']?.['bbox'] || source['bbox'];
      return { x: x['x'] + x['width'] / 2, y: x['y'] + x['height'] / 2 };
    },
    list = [...args]['sort'](
      (next, current) =>
        run(next)['x'] - run(current)['x'] ||
        run(next)['y'] - run(current)['y'] ||
        String(next['id'])['localeCompare'](String(current['id'])),
    );
  return '从左到右第' + (list['findIndex']((entry) => entry['id'] === target['id']) + 1) + '个';
}
export function buildPersonReplacementPositioningPrompt(
  list2,
  record = 0,
  payload = PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
  handle = 0,
) {
  const state = {
    'full-person': '完整人物',
    'visible-part': '当前可见部分',
    clothing: '服装',
    'arm-hand': '手臂和手部',
    'face-hair': '脸部和头发',
    feet: '脚部',
  };
  if (payload === PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING)
    return [
      '任务：把图1中指定的人物替换成对应参考图中的人物。' + (handle ? '图' + handle + '为人物定位图。' : ''),
      ...list2['map']((config) => {
        const scope = '把图1' + describePromptSubject(config, payload);
        return config['scopeRequirement']['scope'] === 'full-person'
          ? scope + '替换成' + config['reference']['label'] + '中的人物，包含外观和服装。'
          : scope +
              '的' +
              state[config['scopeRequirement']['scope']] +
              '替换成' +
              config['reference']['label'] +
              '中人物的对应部分。';
      }),
      '去掉画面中的字幕和LOGO。保留原人物的位置、大小、姿态和遮挡关系，除字幕和LOGO外，其余人物及未指定部分保持不变，不补画画外或被遮挡部分。',
      record ? '背景改用图' + record + '的场景，不引用其中人物。' : '背景和光线保持不变。',
    ]['join']('\n');
  return [
    payload === PERSON_REPLACEMENT_PROMPT_MODE_TEST
      ? '编辑图1，框和标签仅用于指认要替换的人物，输出时去除这些框和标签。'
      : '任务：把图1中的对应人物替换成参考图中的人物。',
    ...list2['map']((input) =>
      input['scopeRequirement']['scope'] === 'full-person'
        ? '把图1' +
          describePromptSubject(input, payload) +
          '替换成' +
          input['reference']['label'] +
          (payload === PERSON_REPLACEMENT_PROMPT_MODE_REGULAR ? '中的人物，包含外观和服装' : '') +
          '。'
        : '把图1' +
          describePromptSubject(input, payload) +
          '的' +
          state[input['scopeRequirement']['scope']] +
          '替换成' +
          input['reference']['label'] +
          '中人物的对应部分。',
    ),
    ...(payload === PERSON_REPLACEMENT_PROMPT_MODE_REGULAR
      ? [
          '保留原人物的位置、大小、姿态和遮挡关系，除字幕和LOGO外，其余人物及未指定部分保持不变，不补画画外或被遮挡部分。',
          '去掉画面字幕和LOGO。',
        ]
      : []),
    record ? '把图1的背景替换成图' + record + '的场景。' : '',
  ]
    ['filter'](Boolean)
    ['join']('\n');
}
export function composePersonReplacementImagePrompt(options2 = {}, output = '') {
  if (options2['promptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_MANUAL) return String(output);
  if (!String(output)['trim']()) return options2['prompt'];
  return [options2['guidedBindingPrompt'], output]['filter'](Boolean)['join']('\n\n');
}

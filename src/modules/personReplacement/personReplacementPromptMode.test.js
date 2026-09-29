import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING,
  PERSON_REPLACEMENT_PROMPT_MODE_REGULAR,
  PERSON_REPLACEMENT_PROMPT_MODE_MANUAL,
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
  isPersonReplacementTestModeAvailable,
  PERSON_REPLACEMENT_MARKER_COLORS,
  getPersonReplacementPromptMarker,
  normalizePersonReplacementPromptMode,
  describePersonReplacementBoxPosition,
  buildPersonReplacementPositioningPrompt,
  composePersonReplacementImagePrompt,
} from './personReplacementPromptMode.js';

const POSITIONING = PERSON_REPLACEMENT_PROMPT_MODE_POSITIONING;
const REGULAR = PERSON_REPLACEMENT_PROMPT_MODE_REGULAR;
const MANUAL = PERSON_REPLACEMENT_PROMPT_MODE_MANUAL;
const TEST_MODE = PERSON_REPLACEMENT_PROMPT_MODE_TEST;

const POS_HEAD = '任务：把图1中指定的人物替换成对应参考图中的人物。';
const POS_TAIL =
  '去掉画面中的字幕和LOGO。保留原人物的位置、大小、姿态和遮挡关系，除字幕和LOGO外，其余人物及未指定部分保持不变，不补画画外或被遮挡部分。';
const REG_HEAD = '任务：把图1中的对应人物替换成参考图中的人物。';
const REG_TAIL_1 =
  '保留原人物的位置、大小、姿态和遮挡关系，除字幕和LOGO外，其余人物及未指定部分保持不变，不补画画外或被遮挡部分。';
const REG_TAIL_2 = '去掉画面字幕和LOGO。';
const TEST_HEAD = '编辑图1，框和标签仅用于指认要替换的人物，输出时去除这些框和标签。';

function marker(over = {}) {
  return {
    marker: {
      position: 'position' in over ? over.position : '左侧',
      label: 'label' in over ? over.label : 'A',
      subject: 'subject' in over ? over.subject : '左侧人物',
    },
    person: { genderHint: 'genderHint' in over ? over.genderHint : '' },
    reference: { label: 'refLabel' in over ? over.refLabel : '人物A' },
    scopeRequirement: { scope: 'scope' in over ? over.scope : 'full-person' },
  };
}

const lines = (prompt) => prompt.split('\n');

test('promptMode: 模式常量与测试模式可用性判定（严格 === true）', () => {
  assert.equal(POSITIONING, 'positioning');
  assert.equal(REGULAR, 'regular');
  assert.equal(MANUAL, 'manual');
  assert.equal(TEST_MODE, 'annotated-source-test');
  const original = globalThis.window;
  try {
    delete globalThis.window;
    assert.equal(isPersonReplacementTestModeAvailable(), false);
    globalThis.window = null;
    assert.equal(isPersonReplacementTestModeAvailable(), false);
    globalThis.window = {};
    assert.equal(isPersonReplacementTestModeAvailable(), false);
    globalThis.window = { DEV_MODE: 1 };
    assert.equal(isPersonReplacementTestModeAvailable(), false);
    globalThis.window = { DEV_MODE: 'true' };
    assert.equal(isPersonReplacementTestModeAvailable(), false);
    globalThis.window = { DEV_MODE: true };
    assert.equal(isPersonReplacementTestModeAvailable(), true);
  } finally {
    if (original === undefined) delete globalThis.window;
    else globalThis.window = original;
  }
  assert.equal(typeof isPersonReplacementTestModeAvailable(), 'boolean');
});

test('promptMode: 标记色表 8 项且未冻结', () => {
  assert.equal(Array.isArray(PERSON_REPLACEMENT_MARKER_COLORS), true);
  assert.equal(PERSON_REPLACEMENT_MARKER_COLORS.length, 8);
  assert.deepEqual(PERSON_REPLACEMENT_MARKER_COLORS, [
    '--annotate-red',
    '--cyan',
    '--annotate-yellow',
    '--annotate-green',
    '--annotate-purple',
    '--annotate-orange',
    '--group-pink',
    '--cyan-text',
  ]);
  assert.equal(Object.isFrozen(PERSON_REPLACEMENT_MARKER_COLORS), false);
});

test('promptMode: manual 模式无论参数一律返回 null', () => {
  for (const args of [[MANUAL, 0, 1, 0], [MANUAL, 5, 4, 3], [MANUAL, 1, 2, 1], [MANUAL]]) {
    assert.equal(getPersonReplacementPromptMarker(...args), null, String(args));
  }
});

test('promptMode: 常规/未知模式的标签与主体文案', () => {
  assert.deepEqual(getPersonReplacementPromptMarker(REGULAR, 0, 1), {
    label: '人物',
    subject: '人物',
    referenceSlot: 0,
    colorToken: '',
  });
  assert.deepEqual(Object.keys(getPersonReplacementPromptMarker(REGULAR, 0, 1)), [
    'label',
    'subject',
    'referenceSlot',
    'colorToken',
  ]);
  const pairs = [
    [0, '左侧'],
    [1, '右侧'],
  ];
  for (const [index, label] of pairs) {
    const result = getPersonReplacementPromptMarker(REGULAR, index, 2);
    assert.equal(result.label, label, String(index));
    assert.equal(result.subject, label + '人物', String(index));
  }
  const triples = ['左侧', '中间', '右侧'];
  triples.forEach((label, index) => {
    const result = getPersonReplacementPromptMarker(REGULAR, index, 3);
    assert.equal(result.label, label, String(index));
    assert.equal(result.subject, label + '人物', String(index));
  });
  assert.deepEqual(getPersonReplacementPromptMarker(REGULAR, 0, 4), {
    label: '1',
    subject: '从左到右第1个人物',
    referenceSlot: 0,
    colorToken: '',
  });
  assert.deepEqual(getPersonReplacementPromptMarker(REGULAR, 3, 4), {
    label: '4',
    subject: '从左到右第4个人物',
    referenceSlot: 0,
    colorToken: '',
  });
  // 未定义/越界 total 走 String(index + 1) 分支
  assert.deepEqual(getPersonReplacementPromptMarker(REGULAR, 0, 0), {
    label: '1',
    subject: '1人物',
    referenceSlot: 0,
    colorToken: '',
  });
  assert.deepEqual(getPersonReplacementPromptMarker(REGULAR, 5, 2), {
    label: undefined,
    subject: 'undefined人物',
    referenceSlot: 0,
    colorToken: '',
  });
  assert.equal(getPersonReplacementPromptMarker('zzz', 0, 2).label, '左侧');
  assert.equal(getPersonReplacementPromptMarker('zzz', 0, 2).colorToken, '');
});

test('promptMode: positioning/test 用字母标签，色卡按槽位取模', () => {
  assert.deepEqual(getPersonReplacementPromptMarker(POSITIONING, 0, 1), {
    label: 'A',
    subject: '人物',
    referenceSlot: 0,
    colorToken: '',
  });
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 25, 4).label, 'Z');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 25, 4).subject, '从左到右第26个人物');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 26, 4).label, 'AA');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 51, 4).label, 'AZ');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 52, 4).label, 'BA');
  assert.deepEqual(getPersonReplacementPromptMarker(TEST_MODE, 1, 2), {
    label: 'B',
    subject: '右侧人物',
    referenceSlot: 0,
    colorToken: '',
  });
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 0, 4, 1).colorToken, '--annotate-red');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 7, 4, 1).colorToken, '--cyan-text');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 8, 4, 1).colorToken, '--annotate-red');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 9, 4, 1).colorToken, '--cyan');
  assert.equal(getPersonReplacementPromptMarker(TEST_MODE, 0, 4, 1).colorToken, '--annotate-red');
  assert.equal(getPersonReplacementPromptMarker(REGULAR, 0, 4, 1).colorToken, '');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 0, 4, 0).colorToken, '');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, 0, 4, '1').colorToken, '--annotate-red');
  // 负索引取到数组越界 → undefined，但键存在
  const negative = getPersonReplacementPromptMarker(POSITIONING, -1, 4, 1);
  assert.equal(negative.colorToken, undefined);
  assert.equal('colorToken' in negative, true);
  assert.equal(negative.label, 'A');
  assert.equal(negative.subject, '从左到右第0个人物');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, -1, 2, 1).label, 'A');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, -1, 2, 1).subject, 'undefined人物');
  assert.equal(getPersonReplacementPromptMarker(POSITIONING, -1, 2, 1).colorToken, undefined);
});

test('promptMode: referenceSlot 原样透传', () => {
  assert.equal(getPersonReplacementPromptMarker(REGULAR, 0, 1, ' r ').referenceSlot, ' r ');
  assert.equal(getPersonReplacementPromptMarker(REGULAR, 0, 1, true).referenceSlot, true);
  assert.equal(getPersonReplacementPromptMarker(REGULAR, 0, 1, null).referenceSlot, null);
  assert.equal(getPersonReplacementPromptMarker(REGULAR, 0, 1).referenceSlot, 0);
});

test('promptMode: normalizePersonReplacementPromptMode 仅 manual/test 直通', () => {
  for (const mode of [MANUAL, TEST_MODE, POSITIONING, REGULAR]) {
    assert.equal(normalizePersonReplacementPromptMode(mode), mode, String(mode));
  }
  for (const mode of [
    undefined,
    null,
    '',
    0,
    false,
    {},
    [],
    'positioning ',
    ' manual',
    'annotated-source-test ',
  ]) {
    assert.equal(normalizePersonReplacementPromptMode(mode), REGULAR, String(mode));
  }
  assert.equal(normalizePersonReplacementPromptMode(), REGULAR);
});

test('promptMode: 定位提示词结构（头部/逐人语句/尾句/背景句）', () => {
  const prompt = buildPersonReplacementPositioningPrompt([marker()]);
  assert.equal(typeof prompt, 'string');
  assert.deepEqual(lines(prompt), [
    POS_HEAD,
    '把图1左侧（定位图A框）的人物替换成人物A中的人物，包含外观和服装。',
    POS_TAIL,
    '背景和光线保持不变。',
  ]);
  const detailed = buildPersonReplacementPositioningPrompt(
    [marker(), marker({ position: '右侧', label: 'B' })],
    3,
    POSITIONING,
    2,
  );
  assert.deepEqual(lines(detailed), [
    POS_HEAD + '图2为人物定位图。',
    '把图1左侧（定位图A框）的人物替换成人物A中的人物，包含外观和服装。',
    '把图1右侧（定位图B框）的人物替换成人物A中的人物，包含外观和服装。',
    POS_TAIL,
    '背景改用图3的场景，不引用其中人物。',
  ]);
  assert.equal(lines(buildPersonReplacementPositioningPrompt([], 0, POSITIONING, 0)).length, 3);
  assert.equal(
    lines(buildPersonReplacementPositioningPrompt([marker()], '0')).at(-1),
    '背景改用图0的场景，不引用其中人物。',
  );
});

test('promptMode: 定位提示词 — 非 full-person 用部件文案，未知 scope 拼 undefined', () => {
  const clothing = buildPersonReplacementPositioningPrompt([marker({ scope: 'clothing' })]);
  assert.equal(lines(clothing)[1], '把图1左侧（定位图A框）的人物的服装替换成人物A中人物的对应部分。');
  const partial = buildPersonReplacementPositioningPrompt([
    marker({ scope: 'visible-part' }),
    marker({ scope: 'feet' }),
  ]);
  assert.equal(lines(partial)[1], '把图1左侧（定位图A框）的人物的当前可见部分替换成人物A中人物的对应部分。');
  assert.equal(lines(partial)[2], '把图1左侧（定位图A框）的人物的脚部替换成人物A中人物的对应部分。');
  const unknown = buildPersonReplacementPositioningPrompt([marker({ scope: 'zzz' })]);
  assert.equal(lines(unknown)[1], '把图1左侧（定位图A框）的人物的undefined替换成人物A中人物的对应部分。');
});

test('promptMode: 常规模式 — 性别提示映射与固定尾句', () => {
  const cases = [
    ['', '人'],
    ['Male', '男人'],
    ['MAN', '男人'],
    [' 男性 ', '男人'],
    ['男', '男人'],
    ['男人', '男人'],
    ['female', '女人'],
    ['woman', '女人'],
    ['女', '女人'],
    [' 女性 ', '女人'],
    [0, '人'],
    [null, '人'],
    ['alien', '人'],
  ];
  for (const [genderHint, kind] of cases) {
    const prompt = buildPersonReplacementPositioningPrompt(
      [marker({ genderHint, scope: 'clothing' })],
      0,
      REGULAR,
    );
    assert.equal(
      lines(prompt)[1],
      '把图1左边的' + kind + '的服装替换成人物A中人物的对应部分。',
      String(genderHint),
    );
  }
  const full = buildPersonReplacementPositioningPrompt([marker()], 0, REGULAR);
  assert.deepEqual(lines(full), [
    REG_HEAD,
    '把图1左边的人替换成人物A中的人物，包含外观和服装。',
    REG_TAIL_1,
    REG_TAIL_2,
  ]);
  assert.equal(
    lines(buildPersonReplacementPositioningPrompt([marker()], 2, REGULAR)).at(-1),
    '把图1的背景替换成图2的场景。',
  );
});

test('promptMode: 常规模式 — 从左到右主体去尾字，映射缺失拼 undefined', () => {
  const across = buildPersonReplacementPositioningPrompt(
    [marker({ subject: '从左到右第2个人物' })],
    0,
    REGULAR,
  );
  assert.equal(lines(across)[1], '把图1从左到右第2个人替换成人物A中的人物，包含外观和服装。');
  const unmapped = buildPersonReplacementPositioningPrompt(
    [marker({ subject: '1人物', scope: 'clothing' })],
    0,
    REGULAR,
  );
  assert.equal(lines(unmapped)[1], '把图1undefined的服装替换成人物A中人物的对应部分。');
  const middle = buildPersonReplacementPositioningPrompt([marker({ subject: '中间人物' })], 0, REGULAR);
  assert.equal(lines(middle)[1], '把图1中间的人替换成人物A中的人物，包含外观和服装。');
});

test('promptMode: 测试模式与未知模式的头部差异', () => {
  const testFull = buildPersonReplacementPositioningPrompt([marker()], 0, TEST_MODE);
  assert.deepEqual(lines(testFull), [TEST_HEAD, '把图1A框内的人物替换成人物A。']);
  const testPart = buildPersonReplacementPositioningPrompt([marker({ scope: 'clothing' })], 0, TEST_MODE);
  assert.equal(lines(testPart)[1], '把图1A框内的人物的服装替换成人物A中人物的对应部分。');
  assert.equal(
    lines(buildPersonReplacementPositioningPrompt([marker()], 2, TEST_MODE)).at(-1),
    '把图1的背景替换成图2的场景。',
  );
  const other = buildPersonReplacementPositioningPrompt([marker({ subject: '中间人物' })], 0, null);
  assert.deepEqual(lines(other), [REG_HEAD, '把图1中间的人替换成人物A。']);
  const otherFull = buildPersonReplacementPositioningPrompt([marker()], 0, null);
  assert.deepEqual(lines(otherFull), [REG_HEAD, '把图1左边的人替换成人物A。']);
  assert.equal(buildPersonReplacementPositioningPrompt([], 0, TEST_MODE), TEST_HEAD);
});

test('promptMode: composePersonReplacementImagePrompt — manual 原样返回', () => {
  assert.equal(
    composePersonReplacementImagePrompt(
      { promptMode: MANUAL, prompt: 'P', guidedBindingPrompt: 'G' },
      '  hi  ',
    ),
    '  hi  ',
  );
  assert.equal(composePersonReplacementImagePrompt({ promptMode: MANUAL }, ''), '');
  assert.equal(composePersonReplacementImagePrompt({ promptMode: MANUAL }, null), 'null');
  assert.equal(composePersonReplacementImagePrompt({ promptMode: MANUAL }, 0), '0');
  assert.equal(composePersonReplacementImagePrompt({ promptMode: MANUAL }, {}), '[object Object]');
  // 显式 undefined 触发默认参数 ''，而不是字符串 'undefined'
  assert.equal(composePersonReplacementImagePrompt({ promptMode: MANUAL }, undefined), '');
});

test('promptMode: composePersonReplacementImagePrompt — 空文本回落 prompt，否则拼引导词', () => {
  assert.equal(composePersonReplacementImagePrompt({ promptMode: REGULAR, prompt: 'P' }, '   '), 'P');
  assert.equal(composePersonReplacementImagePrompt({ promptMode: REGULAR, prompt: 'P' }, ''), 'P');
  assert.equal(composePersonReplacementImagePrompt({ promptMode: REGULAR, prompt: 'P' }, undefined), 'P');
  assert.equal(composePersonReplacementImagePrompt({ prompt: 'P' }, null), '');
  assert.equal(composePersonReplacementImagePrompt({ prompt: 'P' }, 0), '');
  assert.equal(
    composePersonReplacementImagePrompt({ promptMode: 'MANUAL', prompt: 'P', guidedBindingPrompt: 'G' }, ''),
    'P',
  );
  assert.equal(composePersonReplacementImagePrompt({ prompt: '' }, '  '), '');
  assert.equal(composePersonReplacementImagePrompt(), undefined);
  assert.equal(composePersonReplacementImagePrompt({}, ''), undefined);
  assert.equal(composePersonReplacementImagePrompt({}, '   '), undefined);
  assert.equal(composePersonReplacementImagePrompt({ guidedBindingPrompt: 'G' }, '  T  '), 'G\n\n  T  ');
  assert.equal(composePersonReplacementImagePrompt({}, 'T'), 'T');
  assert.equal(composePersonReplacementImagePrompt({ guidedBindingPrompt: '' }, 'T'), 'T');
  assert.equal(composePersonReplacementImagePrompt({ guidedBindingPrompt: 0 }, 'T'), 'T');
  assert.equal(composePersonReplacementImagePrompt({ guidedBindingPrompt: 'G' }, 'T'), 'G\n\nT');
  assert.equal(typeof composePersonReplacementImagePrompt({}, 'x'), 'string');
  assert.equal(typeof composePersonReplacementImagePrompt({ promptMode: MANUAL }, 'x'), 'string');
});

test('promptMode: describePersonReplacementBoxPosition — 按中心 x/y/id 排序', () => {
  const list = [
    { id: 'b', bbox: { x: 30, y: 0, width: 0, height: 0 } },
    { id: 'a', bbox: { x: 0, y: 0, width: 0, height: 0 } },
    {
      id: 'c',
      locator: { bbox: { x: 10, y: 0, width: 0, height: 0 } },
      bbox: { x: 999, y: 0, width: 0, height: 0 },
    },
  ];
  const snapshot = structuredClone(list);
  assert.equal(describePersonReplacementBoxPosition({ id: 'a' }, list), '从左到右第1个');
  assert.equal(describePersonReplacementBoxPosition({ id: 'c' }, list), '从左到右第2个');
  assert.equal(describePersonReplacementBoxPosition({ id: 'b' }, list), '从左到右第3个');
  assert.equal(describePersonReplacementBoxPosition({ id: 'zz' }, list), '从左到右第0个');
  assert.equal(
    describePersonReplacementBoxPosition({ id: 'a', bbox: { x: 500, y: 0, width: 0, height: 0 } }, list),
    '从左到右第1个',
  );
  assert.deepEqual(list, snapshot);
});

test('promptMode: describePersonReplacementBoxPosition — 同名并列按 y 再按 id', () => {
  const yTie = [
    { id: 'high', bbox: { x: 0, y: 10, width: 0, height: 0 } },
    { id: 'low', bbox: { x: 0, y: -10, width: 0, height: 0 } },
  ];
  assert.equal(describePersonReplacementBoxPosition({ id: 'low' }, yTie), '从左到右第1个');
  assert.equal(describePersonReplacementBoxPosition({ id: 'high' }, yTie), '从左到右第2个');
  const idTie = [
    { id: 'cc', bbox: { x: 5, y: 5, width: 0, height: 0 } },
    { id: 'aa', bbox: { x: 5, y: 5, width: 0, height: 0 } },
    { id: 'bb', bbox: { x: 5, y: 5, width: 0, height: 0 } },
  ];
  assert.equal(describePersonReplacementBoxPosition({ id: 'aa' }, idTie), '从左到右第1个');
  assert.equal(describePersonReplacementBoxPosition({ id: 'bb' }, idTie), '从左到右第2个');
  assert.equal(describePersonReplacementBoxPosition({ id: 'cc' }, idTie), '从左到右第3个');
  const width = [
    { id: 'w1', bbox: { x: 10, y: 0, width: 10, height: 0 } },
    { id: 'w2', bbox: { x: 14, y: 0, width: 0, height: 0 } },
  ];
  assert.equal(describePersonReplacementBoxPosition({ id: 'w2' }, width), '从左到右第1个');
  assert.equal(describePersonReplacementBoxPosition({ id: 'w1' }, width), '从左到右第2个');
  // 宽框中心 10 在窄框中心 13 左侧，但宽框右边界 20 在窄框右边界 14 右侧：
  // 只有按中心 x 排序才会得到 c-wide 第 1 个，按右边界排序会翻转。
  const centerVsRight = [
    { id: 'c-wide', bbox: { x: 0, y: 0, width: 20, height: 0 } },
    { id: 'c-narrow', bbox: { x: 12, y: 0, width: 2, height: 0 } },
  ];
  assert.equal(describePersonReplacementBoxPosition({ id: 'c-wide' }, centerVsRight), '从左到右第1个');
  assert.equal(describePersonReplacementBoxPosition({ id: 'c-narrow' }, centerVsRight), '从左到右第2个');
});

test('promptMode: describePersonReplacementBoxPosition — 缺 bbox 时比较器才抛 TypeError', () => {
  // 单元素列表不会触发比较器，因此不抛错
  assert.equal(describePersonReplacementBoxPosition({ id: 'a' }, [{ id: 'a' }]), '从左到右第1个');
  assert.throws(
    () => describePersonReplacementBoxPosition({ id: 'a' }, [{ id: 'a' }, { id: 'b' }]),
    TypeError,
  );
  assert.throws(
    () =>
      describePersonReplacementBoxPosition({ id: 'a' }, [
        { id: 'a', locator: {} },
        { id: 'b', locator: {} },
      ]),
    TypeError,
  );
});

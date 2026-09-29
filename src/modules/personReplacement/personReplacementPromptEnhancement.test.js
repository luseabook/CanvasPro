import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyPersonReplacementPromptEnhancement,
  buildPersonReplacementPromptEnhancementInputs,
  buildPersonReplacementPromptEnhancementPrompt,
  compilePersonReplacementPromptEnhancement,
  createPersonReplacementPromptEnhancementStructuredOutput,
  extractJsonObject,
  parsePersonReplacementPromptEnhancementResult,
  resolvePersonReplacementPromptEnhancementModel,
} from './personReplacementPromptEnhancement.js';

test('promptEnhancement: extractJsonObject 空值/非对象回落 null', () => {
  for (const input of [null, undefined, '', '   ', 'abc', 0, '[1,2]', '{"a":1', 'x}1{', '{bad}']) {
    assert.equal(extractJsonObject(input), null, String(input));
  }
  assert.equal(extractJsonObject({}), null);
  assert.equal(extractJsonObject([]), null);
  assert.equal(extractJsonObject({ text: '   ' }), null);
});

test('promptEnhancement: extractJsonObject output/data/result 优先且原样返回引用', () => {
  const output = { a: 1 };
  assert.equal(extractJsonObject({ output }), output);
  assert.equal(extractJsonObject({ data: output }), output);
  assert.equal(extractJsonObject({ result: output }), output);
  assert.deepEqual(extractJsonObject({ output: {} }), {});
  assert.deepEqual(extractJsonObject({ output: null, data: { d: 4 } }), { d: 4 });
  assert.equal(extractJsonObject({ output: [1, 2] }), null);
  assert.deepEqual(extractJsonObject({ output: { c: 3 }, text: '{"a":1}' }), { c: 3 });
});

test('promptEnhancement: extractJsonObject 文本优先级 text > outputText > content > 自身', () => {
  assert.deepEqual(extractJsonObject({ text: '  {"x": 1}  ' }), { x: 1 });
  assert.deepEqual(extractJsonObject({ outputText: '{"y":2}' }), { y: 2 });
  assert.deepEqual(extractJsonObject({ content: '{"z":3}' }), { z: 3 });
  assert.deepEqual(extractJsonObject({ text: '{"a":1}', outputText: '{"b":2}', content: '{"c":3}' }), {
    a: 1,
  });
  assert.deepEqual(extractJsonObject({ outputText: '{"b":2}', content: '{"c":3}' }), { b: 2 });
  assert.deepEqual(extractJsonObject('{"k":"v"}'), { k: 'v' });
});

test('promptEnhancement: extractJsonObject 取首尾花括号与代码围栏', () => {
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJsonObject('```\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJsonObject('```json{"a":1}```'), { a: 1 });
  assert.deepEqual(extractJsonObject('前言 {"a":1} 后记'), { a: 1 });
  assert.deepEqual(extractJsonObject('} {"a":1}'), { a: 1 });
  assert.deepEqual(extractJsonObject('{"a":{"b":1}}'), { a: { b: 1 } });
  assert.deepEqual(extractJsonObject('前言\n```json\n{"a":1}\n```\n后记'), { a: 1 });
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n``` 尾巴 {"b":2}'), { a: 1 });
  assert.deepEqual(extractJsonObject('```json\n{"a":1}\n```\n中段\n```json\n{"b":2}\n```'), { a: 1 });
  assert.deepEqual(extractJsonObject('```json\n``` {"a":1}'), { a: 1 });
});

test('promptEnhancement: resolveModel 默认值与未配置回落', () => {
  const expected = {
    configured: false,
    displayName: '未配置',
    maxImages: 0,
    modelId: '',
    provider: '',
    providerProfileId: '',
    supportsImage: false,
  };
  assert.deepEqual(resolvePersonReplacementPromptEnhancementModel(), expected);
  assert.deepEqual(resolvePersonReplacementPromptEnhancementModel({}), expected);
  const unknown = resolvePersonReplacementPromptEnhancementModel({
    model: 'unknown/model',
    provider: 'nope',
  });
  assert.equal(unknown.configured, false);
  assert.equal(unknown.displayName, 'unknown/model');
  assert.equal(unknown.maxImages, 0);
  assert.equal(unknown.supportsImage, false);
});

test('promptEnhancement: resolveModel 文本模型的能力与显示名', () => {
  const vision = resolvePersonReplacementPromptEnhancementModel({
    model: 'volcengine/doubao-seed-2-0-pro-260215',
    provider: 'volcengine',
  });
  assert.equal(vision.configured, true);
  assert.equal(vision.displayName, 'Doubao Seed 2.0 Pro');
  assert.equal(vision.maxImages, 8);
  assert.equal(vision.supportsImage, true);
  assert.equal(vision.modelId, 'volcengine/doubao-seed-2-0-pro-260215');
  assert.equal(vision.provider, 'volcengine');
  assert.equal(Number.isInteger(vision.maxImages), true);

  const textOnly = resolvePersonReplacementPromptEnhancementModel({
    model: 'qwen/qwen3.6-plus',
    provider: 'runninghub',
  });
  assert.equal(textOnly.configured, true);
  assert.equal(textOnly.displayName, 'Qwen3.6 Plus');
  assert.equal(textOnly.maxImages, 0);
  assert.equal(textOnly.supportsImage, false);

  const alias = resolvePersonReplacementPromptEnhancementModel({
    model: 'doubao-seed-2-0-pro-260215',
    provider: 'volcengine',
  });
  assert.equal(alias.configured, true);
  assert.equal(alias.modelId, 'doubao-seed-2-0-pro-260215');
  assert.equal(alias.supportsImage, true);

  const trimmed = resolvePersonReplacementPromptEnhancementModel({
    model: '  qwen/qwen3.6-plus  ',
    provider: ' runninghub ',
  });
  assert.equal(trimmed.modelId, 'qwen/qwen3.6-plus');
  assert.equal(trimmed.provider, 'runninghub');
  assert.equal(trimmed.configured, true);
});

test('promptEnhancement: resolveModel configured 需要 model+provider+manifest 三者齐备', () => {
  const noProvider = resolvePersonReplacementPromptEnhancementModel({ model: 'qwen/qwen3.6-plus' });
  assert.equal(noProvider.configured, false);
  assert.equal(noProvider.supportsImage, false);
  assert.equal(noProvider.displayName, 'Qwen3.6 Plus');
  assert.equal(noProvider.provider, '');
  const providerOnly = resolvePersonReplacementPromptEnhancementModel({ provider: 'runninghub' });
  assert.equal(providerOnly.configured, false);
  assert.equal(providerOnly.displayName, '未配置');
  assert.equal(providerOnly.supportsImage, false);
});

test('promptEnhancement: resolveModel providerProfileId 取值与回落', () => {
  const profileOf = (input) => resolvePersonReplacementPromptEnhancementModel(input).providerProfileId;
  assert.equal(profileOf({ model: 'm' }), '');
  assert.equal(profileOf({ model: 'm', providerProfileId: '  p1  ' }), 'p1');
  assert.equal(profileOf({ model: 'm', providerProfileIdByModel: { m: 'p2' } }), 'p2');
  assert.equal(profileOf({ model: '  m  ', providerProfileIdByModel: { m: 'p2' } }), 'p2');
  assert.equal(profileOf({ model: 'm', providerProfileId: '', providerProfileIdByModel: { m: 'p2' } }), 'p2');
  assert.equal(
    profileOf({ model: 'm', providerProfileId: 'p1', providerProfileIdByModel: { m: 'p2' } }),
    'p1',
  );
  assert.equal(profileOf({ model: 'm', providerProfileIdByModel: { other: 'p2' } }), '');
});

test('promptEnhancement: buildInputs 空入参与角色过滤', () => {
  const empty = { bindings: [], imageRefs: [], references: [] };
  assert.deepEqual(buildPersonReplacementPromptEnhancementInputs(), empty);
  assert.deepEqual(buildPersonReplacementPromptEnhancementInputs({}), empty);
  assert.deepEqual(buildPersonReplacementPromptEnhancementInputs({ promptPackage: {} }), empty);
  assert.deepEqual(
    buildPersonReplacementPromptEnhancementInputs({ promptPackage: { referenceImages: 'x', bindings: 'y' } }),
    empty,
  );
  const dropped = buildPersonReplacementPromptEnhancementInputs({
    promptPackage: {
      referenceImages: [
        { role: 'other', ref: 'r1', label: 'x' },
        { role: 'target-scene', ref: '', label: 'x' },
      ],
    },
  });
  assert.deepEqual(dropped, empty);
});

test('promptEnhancement: buildInputs 图片角色 trim、ref 必填、label/slot 原始拼接', () => {
  const promptPackage = {
    referenceImages: [
      { role: ' source-keyframe ', ref: ' r1 ', label: '' },
      { role: 'target-character', ref: 'r2', label: ' 甲 ', slot: 5, targetCharacterId: ' c1 ' },
      { role: 'other', ref: 'r3', label: '外' },
      { role: 'target-scene', ref: '', label: '缺ref' },
      { role: 'person-location-guide', ref: 'r4', slot: 2.9, label: '' },
    ],
  };
  const snapshot = JSON.parse(JSON.stringify(promptPackage));
  const out = buildPersonReplacementPromptEnhancementInputs({ promptPackage });
  assert.deepEqual(out.imageRefs, ['r1', 'r2', 'r4']);
  assert.deepEqual(out.references, [
    { label: '图undefined', ref: 'r1', role: 'source-keyframe', slot: 1, targetCharacterId: '' },
    { label: '甲', ref: 'r2', role: 'target-character', slot: 5, targetCharacterId: 'c1' },
    { label: '图2.9', ref: 'r4', role: 'person-location-guide', slot: 2, targetCharacterId: '' },
  ]);
  assert.deepEqual(promptPackage, snapshot);

  const slotZero = buildPersonReplacementPromptEnhancementInputs({
    promptPackage: { referenceImages: [{ role: 'target-character', ref: 'r', slot: 0, label: '' }] },
  });
  assert.equal(slotZero.references[0].label, '图0');
  assert.equal(slotZero.references[0].slot, 1);

  const slotNegative = buildPersonReplacementPromptEnhancementInputs({
    promptPackage: { referenceImages: [{ role: 'target-character', ref: 'r', slot: -3, label: '' }] },
  });
  assert.equal(slotNegative.references[0].label, '图-3');
  assert.equal(slotNegative.references[0].slot, 1);
});

test('promptEnhancement: buildInputs 绑定 label/markerLabel 拼装与 bbox 归一', () => {
  const out = buildPersonReplacementPromptEnhancementInputs({
    promptPackage: {
      bindings: [
        {
          markerLabel: 'A',
          label: ' 甲 ',
          personId: ' p1 ',
          referenceLabel: ' R1 ',
          replacementScope: ' full-person ',
          bbox: { x: '1', y: null, width: -2, height: NaN },
        },
        { markerLabel: '', label: ' 乙 ', personId: 'p2', referenceLabel: 'R2' },
        { label: '丙', personId: 'p3' },
        { markerLabel: 'D', label: '丁', referenceLabel: 'R4', bbox: 'nope' },
        { markerLabel: 'E', label: '戊', referenceLabel: 'R5', bbox: [] },
        { markerLabel: 'F', label: '己', referenceLabel: 'R6', bbox: 5 },
      ],
    },
  });
  assert.equal(out.bindings.length, 5);
  assert.deepEqual(out.bindings[0], {
    label: 'A（甲）',
    personId: 'p1',
    referenceLabel: 'R1',
    replacementScope: 'full-person',
    bbox: { x: 1, y: 0, width: -2, height: 0 },
  });
  assert.deepEqual(out.bindings[1], {
    label: '乙',
    personId: 'p2',
    referenceLabel: 'R2',
    replacementScope: '',
    bbox: null,
  });
  assert.equal(out.bindings[2].bbox, null);
  assert.deepEqual(out.bindings[3].bbox, { x: 0, y: 0, width: 0, height: 0 });
  assert.equal(out.bindings[4].bbox, null);
  assert.equal(out.bindings[2].replacementScope, '');
  assert.deepEqual(out.references, []);
});

test('promptEnhancement: buildPrompt 角色文案、顺序与空段过滤', () => {
  const bare = buildPersonReplacementPromptEnhancementPrompt();
  assert.equal(typeof bare, 'string');
  assert.ok(bare.startsWith('分析所附图片'));
  assert.ok(bare.endsWith('按指定 JSON Schema 返回，不要附加解释。'));
  assert.ok(bare.includes('图片角色：'));
  assert.ok(bare.includes('应用锁定的绑定事实：'));
  assert.ok(bare.includes('人物与目标参考图的绑定已由应用锁定。'));
  assert.ok(!bare.includes('每个字段最多20字'));

  const promptPackage = {
    referenceImages: [
      { role: 'source-keyframe', ref: 'r1', label: '图1', slot: 1 },
      { role: 'target-character', ref: 'r2', label: '甲', slot: 2 },
      { role: 'target-scene', ref: 'r3', label: '图3', slot: 3 },
      { role: 'person-location-guide', ref: 'r4', label: '图4', slot: 4 },
    ],
  };
  const prompt = buildPersonReplacementPromptEnhancementPrompt({ promptPackage });
  const lines = [
    '- 图1：待修改原图，是构图、人物位置、姿态、动作、裁切、遮挡、光线和背景的唯一基准。',
    '- 甲：目标人物外观参考图，只分析该人物的身份外观、脸发、体型和服装。',
    '- 图3：目标场景参考图，只分析环境、材质、光线与色调，不引用其中人物。',
    '- 图4：人物定位引导图，字母框只用于对应图1中的人物，不作为外观或场景参考。',
  ];
  for (let index = 0; index < lines.length; index++) {
    assert.ok(prompt.includes(lines[index]), lines[index]);
    if (index > 0) assert.ok(prompt.indexOf(lines[index - 1]) < prompt.indexOf(lines[index]), lines[index]);
  }
});

test('promptEnhancement: buildPrompt locationGuide / annotatedSource / guidedBindingPrompt', () => {
  const located = buildPersonReplacementPromptEnhancementPrompt({
    promptPackage: { locationGuide: true, locationGuideSlot: 2 },
  });
  assert.ok(
    located.includes('图2中的字母框对应图1人物，图1是未加标记的原图。每个字段最多20字；已有规则不必重复。'),
  );

  const annotated = buildPersonReplacementPromptEnhancementPrompt({
    promptPackage: { annotatedSource: true },
  });
  assert.ok(
    annotated.includes(
      '图1已叠加应用生成的字母框和参考图号，仅用于指认人物；输出需移除这些标记。每个字段最多20字。',
    ),
  );

  const both = buildPersonReplacementPromptEnhancementPrompt({
    promptPackage: { locationGuide: true, locationGuideSlot: 1, annotatedSource: true },
  });
  assert.ok(both.includes('图1中的字母框对应图1人物'));
  assert.ok(!both.includes('输出需移除这些标记'));

  const guided = buildPersonReplacementPromptEnhancementPrompt({
    promptPackage: { guidedBindingPrompt: '  B1  ' },
  });
  assert.ok(guided.includes('应用锁定的绑定事实：\nB1'));
});

test('promptEnhancement: buildPrompt 显式 inputs 覆盖并与默认推导等价', () => {
  const promptPackage = { referenceImages: [{ role: 'source-keyframe', ref: 'r1', label: '图1', slot: 1 }] };
  assert.equal(
    buildPersonReplacementPromptEnhancementPrompt({ promptPackage }),
    buildPersonReplacementPromptEnhancementPrompt({
      promptPackage,
      inputs: buildPersonReplacementPromptEnhancementInputs({ promptPackage }),
    }),
  );
  const custom = buildPersonReplacementPromptEnhancementPrompt({
    promptPackage: {},
    inputs: { references: [{ role: 'target-character', label: 'Z', ref: 'r' }] },
  });
  assert.ok(custom.includes('- Z：目标人物外观参考图'));
  assert.ok(!buildPersonReplacementPromptEnhancementPrompt({ promptPackage: {} }).includes('- Z：'));
});

test('promptEnhancement: createStructuredOutput 完整结构冻结', () => {
  assert.deepEqual(createPersonReplacementPromptEnhancementStructuredOutput(), {
    name: 'person_replacement_prompt_enhancement',
    strict: true,
    fallback: 'prompt',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['scene', 'people', 'integration'],
      properties: {
        scene: {
          type: 'object',
          additionalProperties: false,
          required: ['composition', 'lighting', 'color', 'focus', 'texture'],
          properties: {
            composition: { type: 'string' },
            lighting: { type: 'string' },
            color: { type: 'string' },
            focus: { type: 'string' },
            texture: { type: 'string' },
          },
        },
        people: {
          type: 'array',
          minItems: 0,
          maxItems: 0,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['label', 'pose', 'gaze', 'expression', 'visibleRange', 'occlusion', 'adaptation'],
            properties: {
              label: { type: 'string', maxLength: 0 },
              pose: { type: 'string' },
              gaze: { type: 'string' },
              expression: { type: 'string' },
              visibleRange: { type: 'string' },
              occlusion: { type: 'string' },
              adaptation: { type: 'string' },
            },
          },
        },
        integration: { type: 'array', minItems: 1, maxItems: 6, items: { type: 'string' } },
      },
    },
  });
});

test('promptEnhancement: createStructuredOutput 标签去空白、去空、限长 8、不去重', () => {
  const out = createPersonReplacementPromptEnhancementStructuredOutput([' b ', 'a', '', '  ', 'b', 'a']);
  const people = out.schema.properties.people;
  assert.deepEqual(people.items.properties.label, { type: 'string', enum: ['b', 'a', 'b', 'a'] });
  assert.equal(people.items.properties.label.maxLength, undefined);
  assert.equal(people.minItems, 4);
  assert.equal(people.maxItems, 4);
  assert.equal(out.strict, true);

  const many = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const sliced = createPersonReplacementPromptEnhancementStructuredOutput(many).schema.properties.people;
  assert.equal(sliced.minItems, 8);
  assert.deepEqual(sliced.items.properties.label.enum, ['1', '2', '3', '4', '5', '6', '7', '8']);

  assert.deepEqual(
    createPersonReplacementPromptEnhancementStructuredOutput('abc').schema.properties.people.items.properties
      .label,
    { type: 'string', maxLength: 0 },
  );
  const source = [' b ', 'a'];
  createPersonReplacementPromptEnhancementStructuredOutput(source);
  assert.deepEqual(source, [' b ', 'a']);
});

test('promptEnhancement: parse 缺 JSON / 空分析直接抛错', () => {
  assert.throws(() => parsePersonReplacementPromptEnhancementResult(null), /未返回可用的结构化分析/);
  assert.throws(() => parsePersonReplacementPromptEnhancementResult('not json'), /未返回可用的结构化分析/);
  assert.throws(() => parsePersonReplacementPromptEnhancementResult('{bad}'), /未返回可用的结构化分析/);
  assert.throws(() => parsePersonReplacementPromptEnhancementResult('{}'), /返回了空分析/);
  assert.throws(
    () => parsePersonReplacementPromptEnhancementResult('{"people":[]}', { personLabels: ['A'] }),
    /返回了空分析/,
  );
  assert.throws(
    () => parsePersonReplacementPromptEnhancementResult('{"scene":{"composition":"   "}}'),
    /返回了空分析/,
  );
});

test('promptEnhancement: parse 场景/人物/融合逐字段 trim 与精度', () => {
  const json = JSON.stringify({
    scene: { composition: ' c ', lighting: 'l', color: '', focus: '  ', texture: 't' },
    people: [
      { label: 'A', pose: 'p1' },
      { label: ' B ', pose: 'p2' },
      { label: 'A', pose: 'p3' },
      { label: 'X', pose: 'px' },
    ],
    integration: ['i1', ' i2 ', '', 'i3', 'i4', 'i5', 'i6', 'i7'],
  });
  const result = parsePersonReplacementPromptEnhancementResult(json, { personLabels: ['B', 'A'] });
  assert.equal(result.people.length, 2);
  assert.equal(result.people[0].label, 'B');
  assert.equal(result.people[0].pose, 'p2');
  assert.equal(result.people[1].label, 'A');
  assert.equal(result.people[1].pose, 'p3');
  assert.deepEqual(Object.keys(result.people[0]), [
    'label',
    'pose',
    'gaze',
    'expression',
    'visibleRange',
    'occlusion',
    'adaptation',
  ]);
  assert.deepEqual(result.scene, {
    composition: 'c',
    lighting: 'l',
    color: '',
    focus: '',
    texture: 't',
  });
  assert.deepEqual(result.integration, ['i1', 'i2', 'i3', 'i4', 'i5', 'i6']);
});

test('promptEnhancement: parse 支持对象入参、缺省标签与重复标签', () => {
  const objectForm = parsePersonReplacementPromptEnhancementResult({
    output: { scene: { composition: 'c' } },
  });
  assert.equal(objectForm.scene.composition, 'c');
  assert.deepEqual(objectForm.people, []);
  assert.deepEqual(objectForm.integration, []);

  const noLabels = parsePersonReplacementPromptEnhancementResult(
    '{"scene":{"composition":"c"},"people":[{"label":"A"}]}',
  );
  assert.deepEqual(noLabels.people, []);

  const duplicates = parsePersonReplacementPromptEnhancementResult('{"scene":{"composition":"c"}}', {
    personLabels: ['A', ' A '],
  });
  assert.equal(duplicates.people.length, 2);
  assert.equal(duplicates.people[0].label, 'A');
  assert.equal(duplicates.people[1].label, 'A');

  const integrationOnly = parsePersonReplacementPromptEnhancementResult('{"integration":[" i1 ","i2"]}');
  assert.deepEqual(integrationOnly.integration, ['i1', 'i2']);
  assert.deepEqual(integrationOnly.scene, {
    composition: '',
    lighting: '',
    color: '',
    focus: '',
    texture: '',
  });
});

test('promptEnhancement: compile 空分析仅剩标题，全字段拼装精确', () => {
  assert.equal(
    compilePersonReplacementPromptEnhancement(),
    'AI 提示词增强（只补充视觉约束，不得改变既定人物绑定）：',
  );
  assert.equal(
    compilePersonReplacementPromptEnhancement({ people: 'x', integration: 'y' }),
    'AI 提示词增强（只补充视觉约束，不得改变既定人物绑定）：',
  );
  const analysis = {
    scene: { composition: 'c1', lighting: ' c2 ', color: '', focus: null, texture: 'c3' },
    people: [
      { label: '甲', pose: 'p1', gaze: '', expression: 'p2' },
      { label: '乙', pose: '', gaze: '', expression: '', visibleRange: '', occlusion: '', adaptation: '' },
      { label: '', pose: 'x' },
    ],
    integration: ['i1', ' i2 ', '', 'i3', 'i4', 'i5', 'i6', 'i7'],
  };
  const snapshot = JSON.parse(JSON.stringify(analysis));
  const compiled = compilePersonReplacementPromptEnhancement(analysis);
  assert.equal(
    compiled,
    [
      'AI 提示词增强（只补充视觉约束，不得改变既定人物绑定）：',
      '- 原图画面：c1；c2；c3。',
      '- 甲：p1；p2。',
      '- 融合要求：i1；i2；i3；i4；i5；i6。',
    ].join('\n'),
  );
  assert.equal(typeof compiled, 'string');
  assert.deepEqual(analysis, snapshot);
});

test('promptEnhancement: apply 手动模式短路且不共享引用', () => {
  const input = { promptMode: 'manual', prompt: 'p', bindings: [{ personId: 'p1' }] };
  const snapshot = JSON.parse(JSON.stringify(input));
  const result = applyPersonReplacementPromptEnhancement(input, {
    prompt: 'X',
    analysis: { scene: { composition: 'c' } },
  });
  assert.deepEqual(result, snapshot);
  assert.equal(result === input, false);
  assert.deepEqual(input, snapshot);
});

test('promptEnhancement: apply 空白增强原样复制且不共享引用', () => {
  const input = { prompt: 'P', bindingPrompt: 0 };
  const unknown = applyPersonReplacementPromptEnhancement(input, { prompt: '   ' });
  assert.deepEqual(unknown, { prompt: 'P', bindingPrompt: 0 });
  assert.equal(unknown === input, false);
  assert.deepEqual(input, { prompt: 'P', bindingPrompt: 0 });
});

test('promptEnhancement: apply 追加到三个绑定字段并过滤空值', () => {
  const result = applyPersonReplacementPromptEnhancement(
    { bindingPrompt: ' B ', prompt: '', guidedBindingPrompt: '  ' },
    { prompt: 'X' },
  );
  assert.deepEqual(result, {
    bindingPrompt: 'B\n\nX',
    guidedBindingPrompt: 'X',
    prompt: 'X',
  });

  const minimal = applyPersonReplacementPromptEnhancement({ bindingPrompt: 'B' });
  assert.equal(minimal.bindingPrompt, 'B\n\nAI 提示词增强（只补充视觉约束，不得改变既定人物绑定）：');
  assert.equal(minimal.guidedBindingPrompt, 'AI 提示词增强（只补充视觉约束，不得改变既定人物绑定）：');
  assert.equal(minimal.prompt, 'AI 提示词增强（只补充视觉约束，不得改变既定人物绑定）：');
});

test('promptEnhancement: apply 源描述分支整体覆盖三个字段', () => {
  const promptPackage = {
    promptMode: 'regular',
    bindings: [{ personId: 'p1', markerLabel: 'A', referenceLabel: 'R', replacementScope: 'full-person' }],
    referenceImages: [],
    sceneReferenceSlot: 0,
  };
  const snapshot = JSON.parse(JSON.stringify(promptPackage));
  const analysis = {
    kind: 'source-descriptions-v1',
    people: [{ personId: 'p1', markerLabel: 'A', description: '原图左上。' }],
  };
  const result = applyPersonReplacementPromptEnhancement(promptPackage, { analysis });
  assert.equal(result.prompt.split('\n').length, 3);
  assert.ok(result.prompt.startsWith('把图1原图左上替换成R中的人物，包含外观和服装。'));
  assert.ok(result.prompt.endsWith('背景和光线保持不变。'));
  assert.ok(result.prompt.includes('去掉画面中的字幕和LOGO。'));
  assert.equal(result.bindingPrompt, result.prompt);
  assert.equal(result.guidedBindingPrompt, result.prompt);
  assert.deepEqual(promptPackage, snapshot);
});

test('promptEnhancement: apply 定位模式追加任务行与定位图标注', () => {
  const promptPackage = {
    promptMode: 'positioning',
    bindings: [{ personId: 'p1', markerLabel: 'A', referenceLabel: 'R', replacementScope: 'full-person' }],
    referenceImages: [],
    locationGuideSlot: 2,
    sceneReferenceSlot: 3,
  };
  const analysis = {
    kind: 'source-descriptions-v1',
    people: [{ personId: 'p1', markerLabel: 'A', description: '原图左上。' }],
  };
  const result = applyPersonReplacementPromptEnhancement(promptPackage, { analysis });
  assert.ok(result.prompt.startsWith('任务：把图1中指定的人物替换成对应参考图中的人物。图2为人物定位图。'));
  assert.ok(result.prompt.includes('把图1原图左上（定位图A框）替换成R中的人物，包含外观和服装。'));
  assert.ok(result.prompt.includes('把图1的背景替换成图3的场景，保持人物光线与场景协调。'));
  assert.equal(result.prompt.split('\n').length, 4);
});

test('promptEnhancement: apply 未满足源描述条件时走通用追加', () => {
  const noBindings = applyPersonReplacementPromptEnhancement(
    { promptMode: 'regular', bindings: [] },
    { analysis: { kind: 'source-descriptions-v1' } },
  );
  assert.ok(noBindings.prompt.includes('AI 提示词增强（只补充视觉约束，不得改变既定人物绑定）：'));

  const otherKind = applyPersonReplacementPromptEnhancement(
    { promptMode: 'regular', bindings: [{ personId: 'p1' }] },
    { analysis: { kind: 'something-else' } },
  );
  assert.ok(otherKind.prompt.includes('AI 提示词增强（只补充视觉约束，不得改变既定人物绑定）：'));
});

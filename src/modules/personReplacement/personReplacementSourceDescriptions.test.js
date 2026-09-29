import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSourceDescriptionRequest,
  compileSourceDescriptions,
  parseSourceDescriptions,
  sourceDescriptionIdentity,
  usesSourceDescriptions,
} from './personReplacementSourceDescriptions.js';

function makeModel(overrides = {}) {
  return {
    promptMode: 'regular',
    bindings: [
      {
        personId: 'p1',
        markerLabel: 'A',
        bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 },
        replacementScope: 'full-person',
        referenceLabel: '参考图2',
      },
    ],
    referenceImages: [{ role: 'source-keyframe', ref: 'data/assets/original/abc.png' }],
    ...overrides,
  };
}

test('usesSourceDescriptions requires a supported prompt mode and at least one binding', () => {
  assert.equal(usesSourceDescriptions(makeModel()), true);
  assert.equal(usesSourceDescriptions(makeModel({ promptMode: 'positioning' })), true);
  assert.equal(usesSourceDescriptions(makeModel({ promptMode: 'legacy' })), false);
  assert.equal(usesSourceDescriptions(makeModel({ bindings: [] })), false);
  assert.equal(usesSourceDescriptions(makeModel({ bindings: undefined })), false);
});

test('sourceDescriptionIdentity captures the keyframe ref and every box', () => {
  const identity = sourceDescriptionIdentity(makeModel());

  assert.deepEqual(identity, {
    evidenceVersion: 2,
    source: 'data/assets/original/abc.png',
    people: [{ personId: 'p1', markerLabel: 'A', bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.2 } }],
  });
});

test('sourceDescriptionIdentity leaves the source undefined without a keyframe', () => {
  const identity = sourceDescriptionIdentity(makeModel({ referenceImages: [] }));

  assert.equal(identity.source, undefined);
});

test('buildSourceDescriptionRequest rejects a model without a source keyframe', () => {
  assert.throws(
    () => buildSourceDescriptionRequest(makeModel({ referenceImages: [] }), ['img']),
    /原人物识别缺少原图/u,
  );
});

test('buildSourceDescriptionRequest rejects an incomplete evidence list', () => {
  assert.throws(() => buildSourceDescriptionRequest(makeModel(), []), /原人物识别图不完整/u);
});

test('buildSourceDescriptionRequest builds a strict schema bound to the labels', () => {
  const model = makeModel({
    bindings: [
      { personId: 'p1', markerLabel: 'A', bbox: { x: 0, y: 0, width: 0.5, height: 0.5 } },
      { personId: 'p2', markerLabel: 'B', bbox: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 } },
    ],
  });
  const request = buildSourceDescriptionRequest(model, ['ref-a', 'ref-b']);

  assert.deepEqual(request.imageRefs, ['ref-a', 'ref-b']);
  assert.ok(request.prompt.includes('[{"label":"A","bbox":{"x":0,"y":0,"width":0.5,"height":0.5}}'));
  assert.ok(request.prompt.includes('"label":"B"'));
  assert.equal(request.structuredOutput.name, 'person_replacement_source_descriptions');
  assert.equal(request.structuredOutput.strict, true);
  assert.equal(request.structuredOutput.fallback, 'prompt');
  const schema = request.structuredOutput.schema;
  assert.deepEqual(schema.required, ['people']);
  assert.equal(schema.properties.people.minItems, 2);
  assert.equal(schema.properties.people.maxItems, 2);
  assert.deepEqual(schema.properties.people.items.properties.label.enum, ['A', 'B']);
  assert.equal(schema.properties.people.items.properties.description.maxLength, 40);
  assert.deepEqual(schema.properties.people.items.required, ['label', 'description', 'ambiguous']);
});

test('parseSourceDescriptions rejects a payload whose people count does not match', () => {
  assert.throws(
    () => parseSourceDescriptions({ people: [] }, makeModel()),
    /原人物识别不完整，请调整选框后重试/u,
  );
  assert.throws(
    () => parseSourceDescriptions({ people: 'nope' }, makeModel()),
    /原人物识别不完整，请调整选框后重试/u,
  );
});

test('parseSourceDescriptions rejects duplicated, ambiguous or oversized descriptions', () => {
  const model = makeModel();
  const bad =
    (description, ambiguous = false) =>
    () =>
      parseSourceDescriptions({ people: [{ label: 'A', description, ambiguous }] }, model);

  assert.throws(
    () =>
      parseSourceDescriptions({ people: [{ label: 'A', description: '一个人', ambiguous: true }] }, model),
    /无法明确识别A框中的原人物/u,
  );
  assert.throws(bad(''), /无法明确识别A框中的原人物/u);
  assert.throws(bad('x'.repeat(41)), /无法明确识别A框中的原人物/u);
  assert.throws(bad('把图1的人替换掉'), /无法明确识别A框中的原人物/u);
  assert.throws(
    () =>
      parseSourceDescriptions(
        {
          people: [
            { label: 'A', description: '一个人', ambiguous: false },
            { label: 'A', description: '另一个人', ambiguous: false },
          ],
        },
        makeModel({
          bindings: [
            { personId: 'p1', markerLabel: 'A', bbox: {} },
            { personId: 'p2', markerLabel: 'A', bbox: {} },
          ],
        }),
      ),
    /无法明确识别A框中的原人物/u,
  );
});

test('parseSourceDescriptions keeps only the matched description per binding', () => {
  const result = parseSourceDescriptions(
    { people: [{ label: 'A', description: '  左侧穿蓝衣的人  ', ambiguous: false }] },
    makeModel(),
  );

  assert.deepEqual(result, {
    kind: 'source-descriptions-v1',
    people: [{ personId: 'p1', markerLabel: 'A', description: '左侧穿蓝衣的人' }],
  });
});

test('compileSourceDescriptions emits the positioning header only in positioning mode', () => {
  const model = makeModel({ promptMode: 'positioning', locationGuideSlot: 3 });
  const parsed = { people: [{ personId: 'p1', markerLabel: 'A', description: '左侧穿蓝衣的人' }] };
  const lines = compileSourceDescriptions(model, parsed).split('\n');

  assert.equal(lines[0], '任务：把图1中指定的人物替换成对应参考图中的人物。图3为人物定位图。');
  assert.equal(lines[1], '把图1左侧穿蓝衣的人（定位图A框）替换成参考图2中的人物，包含外观和服装。');
  assert.equal(lines.at(-1), '背景和光线保持不变。');
});

test('compileSourceDescriptions maps every replacement scope to its Chinese phrase', () => {
  const scopes = {
    'visible-part': '当前可见部分',
    clothing: '服装',
    'arm-hand': '手臂和手部',
    'face-hair': '脸部和头发',
    feet: '脚部',
  };
  for (const [scope, label] of Object.entries(scopes)) {
    const lines = compileSourceDescriptions(
      makeModel({
        bindings: [
          { personId: 'p1', markerLabel: 'A', bbox: {}, replacementScope: scope, referenceLabel: '参考图2' },
        ],
      }),
      { people: [{ personId: 'p1', markerLabel: 'A', description: '左侧穿蓝衣的人' }] },
    ).split('\n');
    assert.equal(lines[0], `把图1左侧穿蓝衣的人的${label}替换成参考图2中人物的对应部分。`);
  }
});

test('compileSourceDescriptions strips trailing punctuation and uses the scene slot', () => {
  const lines = compileSourceDescriptions(makeModel({ sceneReferenceSlot: 5 }), {
    people: [{ personId: 'p1', markerLabel: 'A', description: '左侧穿蓝衣的人。' }],
  }).split('\n');

  assert.equal(lines[0], '把图1左侧穿蓝衣的人替换成参考图2中的人物，包含外观和服装。');
  assert.equal(lines.at(-1), '把图1的背景替换成图5的场景，保持人物光线与场景协调。');
  assert.ok(lines.some((line) => line.includes('去掉画面中的字幕和LOGO。')));
});

test('compileSourceDescriptions rejects unknown scopes and mismatched evidence', () => {
  assert.throws(
    () =>
      compileSourceDescriptions(
        makeModel({
          bindings: [
            {
              personId: 'p1',
              markerLabel: 'A',
              bbox: {},
              replacementScope: 'hat',
              referenceLabel: '参考图2',
            },
          ],
        }),
        { people: [{ personId: 'p1', markerLabel: 'A', description: '一个人' }] },
      ),
    /不支持的人物替换范围/u,
  );
  assert.throws(
    () => compileSourceDescriptions(makeModel(), { people: [] }),
    /原人物描述与当前选框不匹配，请重新识别/u,
  );
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIO_VOICE_TRANSLATION_LANGUAGES,
  buildAudioVoiceTranslationPrompt,
  classifyAudioVoiceTranslationConfigFailure,
  createAudioVoiceTranslationStructuredOutput,
  getAudioVoiceTranslationLanguage,
  parseAudioVoiceTranslationResult,
  resolveAudioVoiceTranslationTargets,
} from './audioVoiceTranslation.js';

const segments = [
  { id: 's1', sourceText: '你好', startMs: 0, endMs: 1000 },
  { id: 's2', sourceText: '再见', startMs: 1000, endMs: 2500 },
];

test('audioVoiceTranslation: 语言表固定 8 项且被冻结', () => {
  assert.equal(AUDIO_VOICE_TRANSLATION_LANGUAGES.length, 8);
  assert.deepEqual(
    AUDIO_VOICE_TRANSLATION_LANGUAGES.map((item) => item.id),
    ['zh-CN', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'pt'],
  );
  assert.equal(Object.isFrozen(AUDIO_VOICE_TRANSLATION_LANGUAGES), true);
  assert.equal(getAudioVoiceTranslationLanguage('  ja  ').name, 'Japanese');
  assert.equal(getAudioVoiceTranslationLanguage('nope'), null);
  assert.equal(getAudioVoiceTranslationLanguage(), null);
});

test('audioVoiceTranslation: 配置失败分类区分「没配 key」与「key 不可用」', () => {
  assert.equal(classifyAudioVoiceTranslationConfigFailure({ message: 'API key 未配置' }), 'missing');
  assert.equal(classifyAudioVoiceTranslationConfigFailure({ message: 'missing API key' }), 'missing');
  assert.equal(classifyAudioVoiceTranslationConfigFailure({ code: 'AUTH_ERROR' }), 'invalid');
  assert.equal(classifyAudioVoiceTranslationConfigFailure({ type: 'forbidden' }), 'invalid');
  assert.equal(classifyAudioVoiceTranslationConfigFailure({ message: 'API key 已失效' }), 'invalid');
  assert.equal(classifyAudioVoiceTranslationConfigFailure({ message: '模型未开通' }), 'invalid');
  assert.equal(classifyAudioVoiceTranslationConfigFailure('未授权'), 'invalid');
  assert.equal(classifyAudioVoiceTranslationConfigFailure({ message: '网络错误' }), '');
  assert.equal(classifyAudioVoiceTranslationConfigFailure(), '');
  assert.equal(classifyAudioVoiceTranslationConfigFailure({ detail: 'no permission' }), 'invalid');
});

test('audioVoiceTranslation: 目标解析区分全量与选中，并过滤已删除句子', () => {
  const all = resolveAudioVoiceTranslationTargets(segments, ['s1', 's2']);
  assert.equal(all.scope, 'all');
  assert.deepEqual(all.targets, [
    { id: 's1', sourceText: '你好', durationMs: 1000 },
    { id: 's2', sourceText: '再见', durationMs: 1500 },
  ]);

  const selected = resolveAudioVoiceTranslationTargets(segments, ['s2']);
  assert.equal(selected.scope, 'selected');
  assert.deepEqual(selected.targets.map((item) => item.id), ['s2']);

  const noneSelected = resolveAudioVoiceTranslationTargets(segments, []);
  assert.equal(noneSelected.scope, 'all', '没选中时按全量');
  assert.equal(noneSelected.targets.length, 2);

  const removed = resolveAudioVoiceTranslationTargets(
    [...segments, { id: 's3', sourceText: '被删', status: 'removed' }],
    [],
  );
  assert.deepEqual(removed.targets.map((item) => item.id), ['s1', 's2']);
  assert.equal(removed.scope, 'all');

  const blank = resolveAudioVoiceTranslationTargets([{ id: 's1', sourceText: '   ' }], []);
  assert.deepEqual(blank.targets, [], '没有文本的句子不进候选');
});

test('audioVoiceTranslation: 提示词带目标语言与句子 JSON，非法输入抛错', () => {
  const prompt = buildAudioVoiceTranslationPrompt({ language: { id: 'en' }, segments });
  assert.ok(prompt.includes('"code":"en"'));
  assert.ok(prompt.includes('"name":"English"'));
  assert.ok(prompt.includes('"id":"s1"'));
  assert.ok(prompt.includes('Translate the following voice-studio dialogue'));
  assert.throws(() => buildAudioVoiceTranslationPrompt({ language: 'nope', segments }), {
    message: '不支持的目标语言。',
  });
  assert.throws(() => buildAudioVoiceTranslationPrompt({ language: 'en', segments: [] }), {
    message: '没有可翻译的句子文本。',
  });
  assert.throws(
    () => buildAudioVoiceTranslationPrompt({ language: 'en', segments: [{ id: 's1', sourceText: '' }] }),
    { message: '没有可翻译的句子文本。' },
  );
});

test('audioVoiceTranslation: 结构化输出按句子 ID 固定枚举与条数', () => {
  const output = createAudioVoiceTranslationStructuredOutput(segments);
  assert.equal(output.name, 'audio_voice_translation');
  assert.equal(output.strict, true);
  assert.equal(output.fallback, 'prompt');
  const translations = output.schema.properties.translations;
  assert.equal(translations.minItems, 2);
  assert.equal(translations.maxItems, 2);
  assert.deepEqual(translations.items.properties.id.enum, ['s1', 's2']);
  assert.equal(output.schema.additionalProperties, false);
  assert.throws(() => createAudioVoiceTranslationStructuredOutput([]), {
    message: '没有可用于结构化输出的句子 ID。',
  });
  assert.throws(() => createAudioVoiceTranslationStructuredOutput([{ id: ' ' }]), {
    message: '没有可用于结构化输出的句子 ID。',
  });
});

test('audioVoiceTranslation: 结果解析要求条数、ID 集合与文本都完整', () => {
  const parsed = parseAudioVoiceTranslationResult(
    JSON.stringify({
      translations: [
        { id: 's2', targetText: '  Goodbye  ' },
        { id: 's1', targetText: 'Hello' },
      ],
    }),
    segments,
  );
  assert.deepEqual(parsed, [
    { id: 's1', targetText: 'Hello' },
    { id: 's2', targetText: 'Goodbye' },
  ]);

  const fromObject = parseAudioVoiceTranslationResult(
    { text: JSON.stringify({ translations: [{ id: 's1', targetText: 'A' }, { id: 's2', targetText: 'B' }] }) },
    segments,
  );
  assert.equal(fromObject.length, 2);

  const cases = [
    [
      JSON.stringify({ translations: [{ id: 's1', targetText: 'A' }] }),
      /翻译结果数量不一致：期望 2 句，实际 1 句。/,
    ],
    [
      JSON.stringify({ translations: [{ id: 's1', targetText: 'A' }, { id: 'zz', targetText: 'B' }] }),
      /翻译结果包含未知句子 ID：zz。/,
    ],
    [
      JSON.stringify({ translations: [{ id: 's1', targetText: 'A' }, { id: 's1', targetText: 'B' }] }),
      /翻译结果包含重复句子 ID：s1。/,
    ],
    [
      JSON.stringify({ translations: [{ id: 's1', targetText: '  ' }, { id: 's2', targetText: 'B' }] }),
      /句子 s1 的翻译结果为空。/,
    ],
    [JSON.stringify({ translations: [] }), /翻译结果数量不一致/],
  ];
  for (const [raw, pattern] of cases) {
    assert.throws(() => parseAudioVoiceTranslationResult(raw, segments), pattern);
  }
  assert.throws(() => parseAudioVoiceTranslationResult('{}', []), {
    message: '翻译请求中的句子 ID 无效或重复。',
  });
  assert.throws(
    () => parseAudioVoiceTranslationResult('{}', [{ id: 's1', sourceText: 'a' }, { id: 's1', sourceText: 'b' }]),
    { message: '翻译请求中的句子 ID 无效或重复。' },
  );
});

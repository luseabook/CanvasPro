import test from 'node:test';
import assert from 'node:assert/strict';

import {
  VIDEO_REPLICATION_PROMPT_MODEL_ID,
  buildVideoReplicationPromptAnalysisPrompt,
  createVideoReplicationPromptStructuredOutput,
  parseVideoReplicationPromptAnalysisResult,
} from './videoReplicationPromptAnalysis.js';

test('videoReplicationPromptAnalysis: defines the structured clip analysis contract', () => {
  const output = createVideoReplicationPromptStructuredOutput();

  assert.equal(VIDEO_REPLICATION_PROMPT_MODEL_ID, 'apimart/gemini-3.8-flash');
  assert.equal(output.name, 'video_replication_clip_analysis');
  assert.equal(output.strict, true);
  assert.equal(output.fallback, 'prompt');
  assert.deepEqual(output.schema.required, [
    'title',
    'synopsis',
    'fullScript',
    'seedancePrompt',
    'camera',
    'sound',
    'segments',
  ]);
  assert.equal(output.schema.properties.segments.items.required.length, 9);
});

test('videoReplicationPromptAnalysis: builds a localized duration-aware analysis prompt', () => {
  const prompt = buildVideoReplicationPromptAnalysisPrompt({
    durationSec: 9,
    targetLocale: 'ja-JP',
    targetLocaleLabel: '日本 · 日语',
    visualStyle: '日系动画电影',
  });

  assert.match(prompt, /日本 · 日语（ja-JP）/);
  assert.match(prompt, /目标生成时长约 9\.00 秒/);
  assert.match(prompt, /目标创作风格：日系动画电影/);
  assert.match(prompt, /seedancePrompt 必须使用清晰的分时段描述/);
  assert.match(prompt, /只返回指定 JSON 对象/);
});

test('videoReplicationPromptAnalysis: parses fenced JSON and normalizes segment values', () => {
  const result = parseVideoReplicationPromptAnalysisResult(
    {
      text: [
        '```json',
        JSON.stringify({
          title: '',
          synopsis: '',
          fullScript: '完整剧本',
          seedancePrompt: '主体动作与运镜',
          camera: '推镜',
          sound: '雨声',
          segments: [
            {
              title: '',
              startSec: -2,
              endSec: '3',
              script: '第一段',
              prompt: '第一段提示',
              visual: '画面',
              camera: '固定',
              dialogue: '对白',
              sound: '环境声',
            },
            {
              startSec: 3,
              endSec: 5,
            },
          ],
        }),
        '```',
      ].join('\n'),
    },
    { durationSec: 5 },
  );

  assert.deepEqual(result, {
    title: '未命名片段',
    synopsis: '主体动作与运镜',
    fullScript: '完整剧本',
    seedancePrompt: '主体动作与运镜',
    camera: '推镜',
    sound: '雨声',
    segments: [
      {
        title: '',
        startSec: 0,
        endSec: 3,
        script: '第一段',
        prompt: '第一段提示',
        visual: '画面',
        camera: '固定',
        dialogue: '对白',
        sound: '环境声',
      },
    ],
    durationSec: 5,
  });
});

test('videoReplicationPromptAnalysis: requires script JSON only when requested', () => {
  assert.throws(
    () => parseVideoReplicationPromptAnalysisResult({ text: 'not json' }, { requireScriptJson: true }),
    /模型未返回有效的创作剧本 JSON/,
  );

  const fallback = parseVideoReplicationPromptAnalysisResult({ text: '原始提示词' });
  assert.equal(fallback.seedancePrompt, '原始提示词');
  assert.equal(fallback.synopsis, '原始提示词');
  assert.deepEqual(fallback.segments, []);
  assert.throws(() => parseVideoReplicationPromptAnalysisResult({ text: '  ' }), /未返回可用的 Seedance 提示词/);
});

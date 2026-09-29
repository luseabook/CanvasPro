import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildVideoReplicationSourceEvidence,
  buildVideoReplicationSourcePrompt,
  buildVideoReplicationSourceTranscript,
  buildVideoReplicationTimingGuidance,
  createVideoReplicationSourceOutput,
  getVideoReplicationDialogueSummary,
  normalizeVideoReplicationSource,
  parseVideoReplicationSourceResult,
} from './videoReplicationSourceAnalysis.js';

function createRawSource(overrides = {}) {
  return {
    videoObserved: true,
    title: 'Original',
    synopsis: 'Alice enters.',
    contentType: 'narrated_story',
    contentTypeReason: 'A narrator frames the scene.',
    sourceLanguage: 'zh',
    characters: [
      {
        id: 'c1',
        name: 'Alice',
        description: 'Alice in a red coat.',
        visualPrompt: '真人写实摄影，Alice 穿红色大衣。',
        role: 'main',
        subjectType: 'person',
        roleEvidence: 'Drives the scene.',
        identityNotes: '',
        representativeTimeSec: 1,
      },
    ],
    events: [
      {
        id: 'e1',
        startSec: 0,
        endSec: 5,
        visual: 'Alice 推门进入房间。',
        camera: '中景固定镜头。',
        sound: '',
        characterIds: ['c1'],
        dialogue: [{ speakerId: 'c1', text: '你好', uncertain: false }],
        voiceover: [{ kind: 'narration', speakerId: '', text: '旁白', uncertain: false }],
        speechOrder: ['dialogue:0', 'voiceover:0'],
        shots: [
          {
            id: 'shot-1',
            startSec: 0,
            endSec: 5,
            visual: 'Alice 推门进入房间。',
            camera: '中景固定镜头。',
            speechRefs: ['dialogue:0', 'voiceover:0'],
          },
        ],
        uncertainties: [],
      },
    ],
    ...overrides,
  };
}

test('videoReplicationSourceAnalysis: summarizes usable speech and pending review counts', () => {
  const summary = getVideoReplicationDialogueSummary({
    events: [
      {
        dialogue: [
          { speakerId: 'c1', text: '你好', uncertain: false },
          { speakerId: '', text: '[听不清]', uncertain: true },
        ],
        voiceover: [{ speakerId: '', text: '旁白', uncertain: true }],
      },
    ],
  });

  assert.deepEqual(summary, {
    total: 2,
    voiceoverTotal: 1,
    pending: 1,
    label: '对白 1 句 · 解说／独白 1 句 · 1 句待核对',
  });
  assert.equal(
    getVideoReplicationDialogueSummary({ events: [] }).label,
    '本次分析未返回可用人声文案',
  );
});

test('videoReplicationSourceAnalysis: parses fenced JSON and rejects unusable analysis', () => {
  const parsed = parseVideoReplicationSourceResult(
    '```json\n' + JSON.stringify(createRawSource()) + '\n```',
    { durationSec: 5 },
  );

  assert.equal(parsed.schemaVersion, 1);
  assert.equal(parsed.events[0].shots[0].speechRefs.length, 2);
  assert.throws(
    () => parseVideoReplicationSourceResult('not json', { durationSec: 5 }),
    /未返回有效 JSON/u,
  );
  assert.throws(
    () =>
      parseVideoReplicationSourceResult(
        JSON.stringify(createRawSource({ videoObserved: false, observationError: '不可读取' })),
        { durationSec: 5 },
      ),
    /模型未确认读取到原视频/u,
  );

  const missingPrompt = createRawSource();
  missingPrompt.characters[0].visualPrompt = '';
  assert.throws(
    () =>
      parseVideoReplicationSourceResult(JSON.stringify(missingPrompt), {
        durationSec: 5,
      }),
    (error) => error.code === 'SOURCE_ANALYSIS_REPAIRABLE',
  );
});

test('videoReplicationSourceAnalysis: schema and prompt lock observed timestamps to source duration', () => {
  const output = createVideoReplicationSourceOutput({ durationSec: 5 });
  const prompt = buildVideoReplicationSourcePrompt({ durationSec: 5 });

  assert.equal(output.strict, true);
  assert.equal(output.schema.properties.events.items.properties.startSec.maximum, 5);
  assert.equal(output.schema.properties.events.items.properties.endSec.maximum, 5);
  assert.match(prompt, /原片时长 5 秒/u);
  assert.match(prompt, /必须实际读取所附视频/u);
  assert.match(prompt, /speechOrder/u);
});

test('videoReplicationSourceAnalysis: transcript preserves ordered dialogue and voiceover labels', () => {
  const normalized = normalizeVideoReplicationSource(createRawSource(), { durationSec: 5 });
  const transcript = buildVideoReplicationSourceTranscript(normalized);

  assert.match(transcript, /\[0–5秒\] Alice 推门进入房间。/u);
  assert.match(transcript, /c1（Alice）：你好/u);
  assert.match(transcript, /解说／旁白：旁白/u);
  assert.ok(transcript.indexOf('c1（Alice）：你好') < transcript.indexOf('解说／旁白：旁白'));
});

test('videoReplicationSourceAnalysis: normalization and evidence expose timing and speech policy', () => {
  const normalized = normalizeVideoReplicationSource(createRawSource(), { durationSec: 5 });
  const evidence = buildVideoReplicationSourceEvidence(
    {
      sourceVideo: { durationSec: 5 },
      replication: { sourceAnalysis: normalized },
    },
    {},
    [],
  );

  assert.equal(normalized.contentType, 'narrated_story');
  assert.equal(normalized.events[0].startSec, 0);
  assert.equal(normalized.events[0].endSec, 5);
  assert.equal(
    buildVideoReplicationTimingGuidance({
      sourceVideo: { durationSec: 5 },
      replication: { sourceAnalysis: normalized },
    }).startsWith('原片时长为 5 秒。'),
    true,
  );
  assert.equal(evidence.sourceDurationSec, 5);
  assert.equal(evidence.speechPolicy.events[0].mode, 'mixed');
  assert.match(evidence.speechGuidance, /dialogue 是人物对白/u);
  assert.match(evidence.instructions, /按已确定的 segmentPlan/u);
  assert.equal(buildVideoReplicationSourceEvidence({}, {}), null);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAudioVoiceHistoryEntry,
  cloneAudioVoiceSegment,
  createAudioVoicePayloadError,
  createAudioVoiceSegmentAfter,
  firstNonEmptyString,
  getVisibleAudioVoiceSegments,
  normalizeAudioVoiceHistory,
  normalizeAudioVoiceSegmentModelSelection,
  prependAudioVoiceHistory,
  prependAudioVoiceHistoryEntries,
  resolveSegmentLocalAudioUrl,
} from './audioVoicePanelSegmentState.js';

test('audioVoicePanelSegmentState: firstNonEmptyString 跳过空白，全空得空串', () => {
  assert.equal(firstNonEmptyString('', '   ', 'x'), 'x');
  assert.equal(firstNonEmptyString(null, undefined, 0), '');
  assert.equal(firstNonEmptyString('  a  ', 'b'), 'a');
});

test('audioVoicePanelSegmentState: resolveSegmentLocalAudioUrl 优先原地址，否则回落本地路径转 URL', () => {
  assert.equal(resolveSegmentLocalAudioUrl('http://cdn/a.mp3', 'data/x.mp3'), 'http://cdn/a.mp3');
  assert.equal(typeof resolveSegmentLocalAudioUrl('   ', 'data/x.mp3'), 'string');
  assert.equal(resolveSegmentLocalAudioUrl('', ''), '');
});

test('audioVoicePanelSegmentState: 历史按时间倒序、最多 5 条、按路径与地址去重', () => {
  const entries = [];
  for (let index = 0; index < 7; index += 1) {
    entries.push({ id: 'h' + index, audioUrl: 'http://cdn/' + index + '.mp3', createdAt: 1000 + index });
  }
  entries.push({ id: 'dup', audioUrl: 'http://cdn/6.mp3', createdAt: 9999 });
  const history = normalizeAudioVoiceHistory([...entries, {}, 'nope']);
  assert.deepEqual(
    history.map((entry) => entry.id),
    ['h6', 'h5', 'h4', 'h3', 'h2'],
    '重复地址只留先出现的那个，再按时间倒序截前 5 条',
  );
  assert.ok(history.every((entry) => entry.audioUrl.startsWith('http://cdn/')));
  assert.equal(normalizeAudioVoiceHistory('nope').length, 0);
});

test('audioVoicePanelSegmentState: 没有可播放地址的历史项被丢掉', () => {
  const history = normalizeAudioVoiceHistory([
    { id: 'ok', audioUrl: 'http://cdn/a.mp3' },
    { id: 'empty' },
    { id: 'blank', audioUrl: '   ', localPath: '' },
  ]);
  assert.deepEqual(history.map((entry) => entry.id), ['ok']);
});

test('audioVoicePanelSegmentState: buildAudioVoiceHistoryEntry 缺地址得 null，有地址补默认 id 与时间', () => {
  assert.equal(buildAudioVoiceHistoryEntry({}, {}), null);
  const entry = buildAudioVoiceHistoryEntry(
    { audioUrl: 'http://cdn/a.mp3', audioDuration: 12.5 },
    { createdAt: 4242, modelId: 'm1', modelLabel: '音色一' },
  );
  assert.equal(entry.createdAt, 4242);
  assert.equal(entry.modelId, 'm1');
  assert.equal(entry.modelLabel, '音色一');
  assert.equal(entry.audioUrl, 'http://cdn/a.mp3');
  assert.equal(entry.audioDuration, 12.5);
  assert.ok(entry.id.startsWith('audio-voice-history-4242-'));
});

test('audioVoicePanelSegmentState: prepend 把新条目放最前并保持上限', () => {
  const history = normalizeAudioVoiceHistory(
    Array.from({ length: 5 }, (_, index) => ({
      id: 'h' + index,
      audioUrl: 'http://cdn/' + index + '.mp3',
      createdAt: 100 + index,
    })),
  );
  const next = prependAudioVoiceHistory(history, {
    id: 'new',
    audioUrl: 'http://cdn/new.mp3',
    createdAt: 10_000,
  });
  assert.equal(next.length, 5);
  assert.equal(next[0].id, 'new');
  assert.equal(next[next.length - 1].id, 'h1', '最旧的一条被挤掉');
  assert.equal(prependAudioVoiceHistoryEntries(history, null).length, 5);
  assert.equal(prependAudioVoiceHistoryEntries(history, []).length, 5);
});

test('audioVoicePanelSegmentState: createAudioVoicePayloadError 带 code', () => {
  const error = createAudioVoicePayloadError('AUDIO_VOICE_NO_SEGMENT');
  assert.ok(error instanceof Error);
  assert.equal(error.code, 'AUDIO_VOICE_NO_SEGMENT');
  assert.equal(error.message, 'AUDIO_VOICE_NO_SEGMENT');
});

test('audioVoicePanelSegmentState: 只保留未删除的句子', () => {
  const segments = [{ id: 'a' }, { id: 'b', status: 'removed' }, { id: 'c', status: 'edited' }];
  assert.deepEqual(getVisibleAudioVoiceSegments(segments).map((item) => item.id), ['a', 'c']);
});

test('audioVoicePanelSegmentState: 模型选择模式按显式模式、默认模型复用、最后回落段落', () => {
  const explicit = normalizeAudioVoiceSegmentModelSelection(
    { voiceModelId: 'm1', voiceModelSelectionMode: 'SEGMENT', taskModelId: 't1' },
    'other',
  );
  assert.deepEqual(
    { voiceModelId: explicit.voiceModelId, mode: explicit.voiceModelSelectionMode, taskModelId: explicit.taskModelId },
    { voiceModelId: 'm1', mode: 'segment', taskModelId: 't1' },
  );

  const globalMode = normalizeAudioVoiceSegmentModelSelection(
    { voiceModelId: 'm1', voiceModelSelectionMode: 'global' },
    'other',
  );
  assert.equal(globalMode.voiceModelId, '');
  assert.equal(globalMode.voiceModelSelectionMode, 'global');

  const reused = normalizeAudioVoiceSegmentModelSelection({ voiceModelId: 'm1', isGenerating: true }, 'm1');
  assert.equal(reused.voiceModelId, '');
  assert.equal(reused.voiceModelSelectionMode, 'global');
  assert.equal(reused.taskModelId, 'm1');

  const recordOnly = normalizeAudioVoiceSegmentModelSelection(
    { voiceModelId: 'm1', convertedAudioHistory: [{ modelId: 'm1' }] },
    'm1',
  );
  assert.equal(recordOnly.voiceModelSelectionMode, 'global');

  const noRecord = normalizeAudioVoiceSegmentModelSelection({ voiceModelId: 'm1' }, 'm1');
  assert.equal(noRecord.voiceModelSelectionMode, 'segment', '没有生成记录时保持段落级选择');
  assert.equal(noRecord.voiceModelId, 'm1');

  const segment = normalizeAudioVoiceSegmentModelSelection({ voiceModelId: 'm1' }, 'other');
  assert.equal(segment.voiceModelId, 'm1');
  assert.equal(segment.voiceModelSelectionMode, 'segment');

  const empty = normalizeAudioVoiceSegmentModelSelection({}, 'm1');
  assert.equal(empty.voiceModelSelectionMode, 'global');
  assert.equal(empty.voiceModelId, '');
});

test('audioVoicePanelSegmentState: cloneAudioVoiceSegment 归一布尔、可空字段与音轨选择', () => {
  const segment = cloneAudioVoiceSegment({
    id: 's1',
    startMs: '10',
    endMs: '20',
    sourceText: '原文',
    sourceAudioUrl: 'http://cdn/s.mp3',
    audioUrl: 'http://cdn/s.mp3',
    activeAudio: 'converted',
    status: 'generating',
    generationDuration: undefined,
    jobError: undefined,
    imitateToneEnabled: 1,
    sourceAudioReady: 0,
    convertedAudioReady: 'yes',
    voiceModelId: '  ',
  });
  assert.equal(segment.id, 's1');
  assert.equal(segment.startMs, 10);
  assert.equal(segment.endMs, 20);
  assert.equal(segment.activeAudio, 'converted');
  assert.equal(segment.status, 'generating');
  assert.equal(segment.generationDuration, null);
  assert.equal(segment.jobError, null);
  assert.equal(segment.imitateToneEnabled, false, '只认严格 true');
  assert.equal(segment.convertedAudioReady, false);
  assert.equal(segment.sourceAudioReady, true, '有源音频地址即就绪');
  assert.equal(segment.voiceModelSelectionMode, 'global');
  assert.equal(segment.voiceModelId, '');
  assert.equal(segment.imitateToneEnabled === true, false);

  const autoId = cloneAudioVoiceSegment({});
  assert.ok(autoId.id.startsWith('segment-'));
  assert.equal(autoId.activeAudio, 'source');
  assert.equal(autoId.status, 'detected');
});

test('audioVoicePanelSegmentState: 新增句子的默认时长与贴合下一句的取中逻辑', () => {
  const tail = createAudioVoiceSegmentAfter({ endMs: 1000 }, null);
  assert.equal(tail.startMs, 1000);
  assert.equal(tail.endMs, 2500);
  assert.equal(tail.status, 'edited');
  assert.equal(tail.voiceModelSelectionMode, 'global');
  assert.ok(tail.id.startsWith('mock-insert-'));

  const far = createAudioVoiceSegmentAfter({ endMs: 1000 }, { startMs: 3000 });
  assert.equal(far.endMs, 2000, '取中点');
  const near = createAudioVoiceSegmentAfter({ endMs: 1000 }, { startMs: 1100 });
  assert.equal(near.endMs, 1200, '至少留 200ms');
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  assignDiarizationSpeakersToTranscriptSegments,
  buildAudioVoiceSegmentCutArgs,
  buildAudioVoiceSpeechSegments,
  buildFunasrGpuTorchInstallArgs,
  buildFunasrTranscriptionArgs,
  buildSortformerDiarizationArgs,
  createAudioVoiceAnalyzeMediaTaskHandler,
  createAudioVoiceModelPrepareMediaTaskHandler,
  createFunasrGpuTorchInstallMediaTaskHandler,
  createFunasrModelPrepareMediaTaskHandler,
  createFunasrRuntimeCheckMediaTaskHandler,
  hasRecognizedTranscriptText,
  mapFunasrProgressToOverall,
  mergeFunasrTranscriptSegments,
  normalizeDiarizationSegments,
  normalizeFunasrEngine,
  normalizeFunasrTranscriptSegments,
  parseSilenceDetectRanges,
} from './audioVoiceAnalyzeTask.js';
import { registerSharedMediaTaskHandlers } from './registerSharedMediaTaskHandlers.js';

function makeTempDir(t, prefix) {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  if (t && typeof t.after === 'function') t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function createAnalyzeRig({
  outputDir,
  modelRoot = 'F:/models/funasr',
  videoMeta = { width: 0, height: 0, duration: 12, fps: 0 },
  hasAudio = true,
  asrResult = null,
  diarizationResult = null,
  runFunasrTranscription = null,
  runSortformerDiarization = null,
  runDoubaoAsrTranscription = null,
  getDoubaoAsrConfig = () => ({ baseUrl: 'https://doubao.example' }),
  getBailianAsrConfig = () => ({ baseUrl: 'https://bailian.example' }),
  runBailianAsrTranscription = null,
  getRuntimeToolOrFallback = null,
  runProcessImpl = null,
} = {}) {
  const processes = [],
    toolCalls = [],
    progressEntries = [],
    funasrCalls = [],
    diarizationCalls = [],
    adapterCalls = [];
  const queue = {
    emitProgress: (task, progress, message, extra) => {
      progressEntries.push({ progress, message, extra });
    },
    runProcess: (task, command, args) => {
      processes.push({ command, args: [...args] });
      if (typeof runProcessImpl === 'function') return runProcessImpl({ task, command, args });
      return Promise.resolve({ stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), code: 0 });
    },
  };
  const handler = createAudioVoiceAnalyzeMediaTaskHandler({
    appRoot: 'F:/CanvasPro',
    createOutputFilename: (prefix, ext) => prefix + '-fixed.' + ext,
    ffprobeHasAudio: async () => hasAudio,
    ffprobeVideoMeta: async () => videoMeta,
    getDoubaoAsrConfig: getDoubaoAsrConfig,
    getBailianAsrConfig: getBailianAsrConfig,
    getFunasrModelRootDir: () => modelRoot,
    getPythonCertificateEnv: () => ({ SSL_CERT_FILE: 'F:/certs/cacert.pem' }),
    getSortformerModelRootDir: () => path.join(modelRoot, '..', 'sortformer-fixed'),
    getOutputDir: () => outputDir,
    getRuntimeToolOrFallback: (name) => {
      toolCalls.push(name);
      if (typeof getRuntimeToolOrFallback === 'function') return getRuntimeToolOrFallback(name);
      return '/runtime/' + name;
    },
    resolveMediaTaskSource: (src) => path.resolve(String(src)),
    resolvePythonCommand: () => 'F:/runtime/python/python.exe',
    runBailianAsrTranscription: (args) => {
      adapterCalls.push({ provider: 'bailian', args });
      return runBailianAsrTranscription
        ? runBailianAsrTranscription(args)
        : Promise.resolve({ segments: [] });
    },
    runDoubaoAsrTranscription: (args) => {
      adapterCalls.push({ provider: 'doubao', args });
      return runDoubaoAsrTranscription ? runDoubaoAsrTranscription(args) : Promise.resolve({});
    },
    runFunasrTranscription: (args) => {
      funasrCalls.push(args);
      return runFunasrTranscription ? runFunasrTranscription(args) : Promise.resolve(asrResult || {});
    },
    runSortformerDiarization: (args) => {
      diarizationCalls.push(args);
      return runSortformerDiarization
        ? runSortformerDiarization(args)
        : Promise.resolve(diarizationResult || {});
    },
    toOutputLocalPath: (folder, name) => 'output/' + folder + '/' + name,
  });
  return {
    handler,
    processes,
    toolCalls,
    progressEntries,
    funasrCalls,
    diarizationCalls,
    adapterCalls,
    ffmpegProcesses: () => processes.filter((entry) => entry.command === '/runtime/ffmpeg'),
    run: (payload = {}) => handler({ taskId: 'audio-voice-1', payload }, queue),
  };
}

test('normalizeFunasrEngine only keeps gpu when explicitly asked', () => {
  assert.equal(normalizeFunasrEngine('GPU'), 'gpu');
  assert.equal(normalizeFunasrEngine(' gpu '), 'gpu');
  assert.equal(normalizeFunasrEngine('cpu'), 'cpu');
  assert.equal(normalizeFunasrEngine(''), 'cpu');
  assert.equal(normalizeFunasrEngine(undefined), 'cpu');
  assert.equal(normalizeFunasrEngine('tpu'), 'cpu');
});

test('parseSilenceDetectRanges pairs start/end markers and closes a dangling start', () => {
  assert.deepEqual(
    parseSilenceDetectRanges(
      ['silence_start: 1.25', 'silence_end: 3.5', 'silence_start: 8', 'silence_end: 9'].join('\n'),
      12,
    ),
    [
      { startSec: 1.25, endSec: 3.5 },
      { startSec: 8, endSec: 9 },
    ],
  );
  assert.deepEqual(parseSilenceDetectRanges('silence_start: 5.5', 10), [
    { startSec: 5.5, endSec: 10 },
  ]);
  assert.deepEqual(parseSilenceDetectRanges('silence_end: 2', 10), []);
  assert.deepEqual(parseSilenceDetectRanges('silence_start: 4', 0), []);
  assert.deepEqual(parseSilenceDetectRanges('', 10), []);
  assert.deepEqual(parseSilenceDetectRanges('silence_start: 6\nsilence_end: 4', 10), [
    { startSec: 6, endSec: 10 },
  ]);
});

test('buildAudioVoiceSpeechSegments inverts silence ranges with padding', () => {
  assert.deepEqual(
    buildAudioVoiceSpeechSegments({
      silenceRanges: [{ startSec: 2, endSec: 4 }],
      durationSec: 8,
      paddingMs: 80,
      minSpeechSec: 0.25,
    }),
    [
      { startMs: 0, endMs: 2080 },
      { startMs: 3920, endMs: 8000 },
    ],
  );
  assert.deepEqual(buildAudioVoiceSpeechSegments({ durationSec: 0 }), []);
  assert.deepEqual(
    buildAudioVoiceSpeechSegments({ silenceRanges: [], durationSec: 5, paddingMs: 0 }),
    [{ startMs: 0, endMs: 5000 }],
  );
});

test('buildAudioVoiceSegmentCutArgs trims a segment to a fixed 192k mp3', () => {
  assert.deepEqual(
    buildAudioVoiceSegmentCutArgs({
      sourceAudioAbs: 'F:/out/source.mp3',
      outAbs: 'F:/out/segment_1.mp3',
      startMs: 1500,
      endMs: 4250,
    }),
    [
      '-y',
      '-ss',
      '1.500',
      '-i',
      'F:/out/source.mp3',
      '-t',
      '2.750',
      '-vn',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '192k',
      'F:/out/segment_1.mp3',
    ],
  );
  const args = buildAudioVoiceSegmentCutArgs({ startMs: 3000, endMs: 3000 });
  assert.equal(args[args.indexOf('-t') + 1], '0.001');
});

test('normalizeFunasrTranscriptSegments clamps to duration and drops empty spans', () => {
  assert.deepEqual(
    normalizeFunasrTranscriptSegments(
      {
        segments: [
          { startMs: -50, endMs: 900, text: '  你好  ' },
          { startMs: 1200, endMs: 1200, text: 'x' },
          { startMs: 2000, endMs: 99000, sourceText: '世界', spk: 'S1' },
        ],
      },
      10,
    ),
    [
      { startMs: 0, endMs: 900, sourceText: '你好' },
      { startMs: 2000, endMs: 10000, sourceText: '世界', speaker: 'S1' },
    ],
  );
  assert.deepEqual(normalizeFunasrTranscriptSegments([{ startMs: 0, endMs: 500 }], 5), [
    { startMs: 0, endMs: 500, sourceText: '' },
  ]);
  assert.deepEqual(normalizeFunasrTranscriptSegments({}, 5), []);
});

test('normalizeDiarizationSegments requires a speaker label', () => {
  assert.deepEqual(
    normalizeDiarizationSegments(
      [
        { startMs: 0, endMs: 1000, label: 'SPEAKER_00' },
        { startMs: 1000, endMs: 2000 },
        { startMs: 2000, endMs: 2000, speaker: 'S1' },
      ],
      10,
    ),
    [{ startMs: 0, endMs: 1000, speaker: 'SPEAKER_00' }],
  );
});

test('mergeFunasrTranscriptSegments merges same-speaker neighbours only', () => {
  assert.deepEqual(
    mergeFunasrTranscriptSegments([
      { startMs: 0, endMs: 1000, sourceText: '你好', speaker: 'S1' },
      { startMs: 1200, endMs: 2000, sourceText: '世界', speaker: 'S1' },
      { startMs: 2200, endMs: 3000, sourceText: '再见', speaker: 'S2' },
    ]),
    [
      { startMs: 0, endMs: 2000, sourceText: '你好世界', speaker: 'S1' },
      { startMs: 2200, endMs: 3000, sourceText: '再见', speaker: 'S2' },
    ],
  );
  assert.deepEqual(
    mergeFunasrTranscriptSegments([
      { startMs: 0, endMs: 1000, sourceText: 'a', speaker: 'S1' },
      { startMs: 5000, endMs: 6000, sourceText: 'b', speaker: 'S1' },
    ]),
    [
      { startMs: 0, endMs: 1000, sourceText: 'a', speaker: 'S1' },
      { startMs: 5000, endMs: 6000, sourceText: 'b', speaker: 'S1' },
    ],
  );
  assert.deepEqual(mergeFunasrTranscriptSegments([{ startMs: 0, endMs: 0, sourceText: 'x' }]), []);
  assert.deepEqual(mergeFunasrTranscriptSegments('nope'), []);
});

test('mergeFunasrTranscriptSegments joins latin text with a space but not han', () => {
  const merged = mergeFunasrTranscriptSegments(
    [
      { startMs: 0, endMs: 1000, sourceText: 'Hello', speaker: 'S1' },
      { startMs: 1100, endMs: 2000, sourceText: 'world', speaker: 'S1' },
    ],
    { maxTextChars: 100 },
  );
  assert.deepEqual(merged, [{ startMs: 0, endMs: 2000, sourceText: 'Hello world', speaker: 'S1' }]);
  const hanMerged = mergeFunasrTranscriptSegments([
    { startMs: 0, endMs: 1000, sourceText: '你好', speaker: 'S1' },
    { startMs: 1100, endMs: 2000, sourceText: '世界', speaker: 'S1' },
  ]);
  assert.deepEqual(hanMerged, [{ startMs: 0, endMs: 2000, sourceText: '你好世界', speaker: 'S1' }]);
  const blankSpeakerMerged = mergeFunasrTranscriptSegments([
    { startMs: 0, endMs: 1000, sourceText: 'Hello' },
    { startMs: 1100, endMs: 2000, sourceText: 'world' },
  ]);
  assert.equal(blankSpeakerMerged.length, 2);
});

test('assignDiarizationSpeakersToTranscriptSegments picks the dominant overlap', () => {
  assert.deepEqual(
    assignDiarizationSpeakersToTranscriptSegments(
      [
        { startMs: 0, endMs: 4000, sourceText: 'a' },
        { startMs: 4000, endMs: 8000, sourceText: 'b' },
      ],
      [
        { startMs: 0, endMs: 3000, speaker: 'S1' },
        { startMs: 3000, endMs: 8000, speaker: 'S2' },
      ],
    ),
    [
      { startMs: 0, endMs: 4000, sourceText: 'a', speaker: 'S1' },
      { startMs: 4000, endMs: 8000, sourceText: 'b', speaker: 'S2' },
    ],
  );
  assert.deepEqual(
    assignDiarizationSpeakersToTranscriptSegments([{ startMs: 0, endMs: 1000, sourceText: 'a' }], []),
    [{ startMs: 0, endMs: 1000, sourceText: 'a' }],
  );
});

test('hasRecognizedTranscriptText only accepts non-blank source text', () => {
  assert.equal(hasRecognizedTranscriptText([{ sourceText: '  ' }]), false);
  assert.equal(hasRecognizedTranscriptText([]), false);
  assert.equal(hasRecognizedTranscriptText([{ sourceText: '你好' }]), true);
});

test('mapFunasrProgressToOverall interpolates the stage window', () => {
  assert.equal(mapFunasrProgressToOverall('model-download', 0), 0.08);
  assert.equal(mapFunasrProgressToOverall('model-download', 1), 0.32);
  assert.equal(mapFunasrProgressToOverall('diarize', 0.5), 0.75);
  assert.equal(mapFunasrProgressToOverall('unknown', 0), 0.42);
  assert.equal(mapFunasrProgressToOverall('diarize', 5), 0.8);
});

test('buildFunasrTranscriptionArgs places --audio and toggles prepare/check flags', () => {
  const run = buildFunasrTranscriptionArgs({
    audioAbs: 'F:/out/source_asr.wav',
    modelRoot: 'F:/models/funasr',
    durationSec: 3.5,
  });
  assert.deepEqual(run.slice(0, 2), ['-m', 'backend.services.funasr_transcription_service']);
  assert.deepEqual(run.slice(2, 4), ['--audio', 'F:/out/source_asr.wav']);
  assert.equal(run[run.indexOf('--duration-ms') + 1], '3500');
  assert.equal(run[run.indexOf('--engine') + 1], 'cpu');
  assert.ok(run.includes('--download-model-if-missing'));
  assert.ok(run.includes('--spk-model'));

  const prepare = buildFunasrTranscriptionArgs({
    audioAbs: 'F:/out/source_asr.wav',
    modelRoot: 'F:/models/funasr',
    durationSec: 1,
    prepareOnly: true,
    engine: 'gpu',
  });
  assert.ok(prepare.includes('--prepare-only'));
  assert.ok(!prepare.includes('--audio'));
  assert.equal(prepare[prepare.indexOf('--engine') + 1], 'gpu');

  const check = buildFunasrTranscriptionArgs({
    modelRoot: 'F:/models/funasr',
    durationSec: 1,
    checkRuntimeOnly: true,
    downloadModelIfMissing: false,
  });
  assert.ok(check.includes('--check-runtime-only'));
  assert.ok(!check.includes('--download-model-if-missing'));
});

test('buildSortformerDiarizationArgs always carries the model url and file', () => {
  const args = buildSortformerDiarizationArgs({
    audioAbs: 'F:/out/source_asr.wav',
    modelRoot: 'F:/models/sortformer',
    durationSec: 2,
  });
  assert.deepEqual(args.slice(0, 2), ['-m', 'backend.services.sortformer_diarization_service']);
  assert.deepEqual(args.slice(2, 4), ['--audio', 'F:/out/source_asr.wav']);
  assert.equal(
    args[args.indexOf('--model-url') + 1],
    'https://huggingface.co/nvidia/diar_streaming_sortformer_4spk-v2.1/resolve/main/diar_streaming_sortformer_4spk-v2.1.nemo',
  );
  assert.equal(args[args.indexOf('--model-file') + 1], 'diar_streaming_sortformer_4spk-v2.1.nemo');
});

test('buildFunasrGpuTorchInstallArgs falls back to the default torch set', () => {
  assert.deepEqual(buildFunasrGpuTorchInstallArgs({}), [
    '-m',
    'pip',
    'install',
    '--upgrade',
    '--prefer-binary',
    '--no-input',
    '--disable-pip-version-check',
    '--index-url',
    'https://download.pytorch.org/whl/cu128',
    'torch==2.11.0+cu128',
    'torchaudio==2.11.0+cu128',
  ]);
  const custom = buildFunasrGpuTorchInstallArgs({
    indexUrl: 'https://mirror.example/whl',
    packages: [' torch==1.0.0 ', ''],
  });
  assert.equal(custom[custom.indexOf('--index-url') + 1], 'https://mirror.example/whl');
  assert.deepEqual(custom.slice(-1), ['torch==1.0.0']);
});

test('a payload without an ASR provider falls back to silence detection', async (t) => {
  const outputDir = makeTempDir(t, 'voice-analyze-silence-'),
    rig = createAnalyzeRig({
      outputDir,
      videoMeta: { width: 0, height: 0, duration: 8, fps: 0 },
      runProcessImpl: ({ args }) =>
        args.includes('-af')
          ? Promise.resolve({
              stdout: Buffer.alloc(0),
              stderr: Buffer.from('silence_start: 2.0\nsilence_end: 4.0\n'),
              code: 0,
            })
          : Promise.resolve({ stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), code: 0 }),
    }),
    result = await rig.run({ src: 'F:/media/base.mp3', args: {} });
  assert.equal(result.success, true);
  assert.equal(result.durationSec, 8);
  assert.equal(result.asr.provider, 'silence');
  assert.equal(result.asr.diarizationProvider, 'none');
  assert.equal(result.sourceAudio.localPath, 'output/AudioVoiceAnalyze/source_audio-fixed.mp3');
  assert.equal(result.sourceAudio.url, '/output/AudioVoiceAnalyze/source_audio-fixed.mp3');
  assert.deepEqual(
    result.segments.map((segment) => [segment.id, segment.startMs, segment.endMs, segment.sourceText]),
    [
      ['audio-voice-segment-1', 0, 2080, ''],
      ['audio-voice-segment-2', 3920, 8000, ''],
    ],
  );
  assert.equal(result.segments[0].sourceAudioUrl, '/output/AudioVoiceSegments/segment_1-fixed.mp3');
  assert.ok(existsSync(path.join(outputDir, 'AudioVoiceAnalyze')));
  assert.ok(existsSync(path.join(outputDir, 'AudioVoiceSegments')));
  assert.equal(rig.ffmpegProcesses().length, 4);
  assert.ok(!rig.funasrCalls.length);
});

test('a funasr payload transcribes, cuts each sentence and stays diarization-free', async (t) => {
  const outputDir = makeTempDir(t, 'voice-analyze-funasr-'),
    rig = createAnalyzeRig({
      outputDir,
      videoMeta: { width: 0, height: 0, duration: 12, fps: 0 },
      asrResult: {
        segments: [
          { startMs: 0, endMs: 3000, sourceText: '你好' },
          { startMs: 3200, endMs: 6000, sourceText: '世界' },
        ],
      },
    }),
    result = await rig.run({
      src: 'F:/media/base.mp4',
      args: { asrProvider: 'funasr', engine: 'gpu', diarizationProvider: 'none' },
    });
  assert.equal(result.asr.provider, 'funasr');
  assert.equal(result.asr.modelRoot, 'F:/models/funasr');
  assert.equal(result.asr.diarizationProvider, 'none');
  assert.equal(result.asr.fallbackReason, '');
  assert.equal(rig.funasrCalls.length, 1);
  assert.equal(rig.funasrCalls[0].engine, 'gpu');
  assert.equal(rig.funasrCalls[0].pythonCommand, 'F:/runtime/python/python.exe');
  assert.deepEqual(rig.funasrCalls[0].certificateEnv, { SSL_CERT_FILE: 'F:/certs/cacert.pem' });
  assert.equal(rig.funasrCalls[0].modelRoot, 'F:/models/funasr');
  assert.ok(!rig.diarizationCalls.length);
  assert.equal(result.segments.length, 2);
  assert.equal(result.segments[0].sourceText, '你好');
  assert.equal('speaker' in result.segments[0], false);
  assert.ok(result.segments[0].sourceAudioLocalPath.startsWith('output/AudioVoiceSegments/'));
});

test('a funasr payload with sortformer assigns speakers from the overlap', async (t) => {
  const outputDir = makeTempDir(t, 'voice-analyze-diar-'),
    rig = createAnalyzeRig({
      outputDir,
      videoMeta: { width: 0, height: 0, duration: 12, fps: 0 },
      asrResult: {
        segments: [
          { startMs: 0, endMs: 3000, sourceText: '你好' },
          { startMs: 3200, endMs: 6000, sourceText: '世界' },
        ],
      },
      diarizationResult: {
        segments: [
          { startMs: 0, endMs: 3000, speaker: 'S1' },
          { startMs: 3000, endMs: 6000, speaker: 'S2' },
        ],
      },
    }),
    result = await rig.run({
      src: 'F:/media/base.mp4',
      args: { asrProvider: 'funasr' },
    });
  assert.equal(result.asr.diarizationProvider, 'sortformer');
  assert.equal(result.asr.diarizationModelRoot, path.join('F:/models/funasr', '..', 'sortformer-fixed'));
  assert.equal(rig.diarizationCalls.length, 1);
  assert.equal(rig.diarizationCalls[0].modelRoot, result.asr.diarizationModelRoot);
  assert.deepEqual(
    result.segments.map((segment) => segment.speaker),
    ['S1', 'S2'],
  );
});

test('a cloud ASR adapter path normalizes segments and reports its base url', async (t) => {
  const outputDir = makeTempDir(t, 'voice-analyze-adapter-'),
    rig = createAnalyzeRig({
      outputDir,
      videoMeta: { width: 0, height: 0, duration: 9, fps: 0 },
      getBailianAsrConfig: () => ({ baseUrl: 'https://bailian.example' }),
      runBailianAsrTranscription: () =>
        Promise.resolve({
          segments: [{ startMs: 0, endMs: 2500, text: '云端识别' }],
        }),
    }),
    result = await rig.run({
      src: 'F:/media/base.mp3',
      args: { asrProvider: 'bailian' },
    });
  assert.equal(result.asr.provider, 'bailian');
  assert.equal(result.asr.baseUrl, 'https://bailian.example');
  assert.equal(result.asr.modelRoot, '');
  assert.equal(result.segments.length, 1);
  assert.equal(result.segments[0].sourceText, '云端识别');
  assert.equal(rig.adapterCalls[0].provider, 'bailian');
  assert.equal(rig.adapterCalls[0].args.durationSec, 9);
  assert.ok(!rig.funasrCalls.length);
  const asrExtract = rig.ffmpegProcesses()[0];
  assert.ok(asrExtract.args.includes('libmp3lame'));
  assert.ok(asrExtract.args.includes('64k'));
});

test('an adapter that returns no text falls back to silence detection with reason empty', async (t) => {
  const outputDir = makeTempDir(t, 'voice-analyze-empty-'),
    rig = createAnalyzeRig({
      outputDir,
      videoMeta: { width: 0, height: 0, duration: 6, fps: 0 },
      runBailianAsrTranscription: () => Promise.resolve({ segments: [] }),
      runProcessImpl: ({ args }) =>
        args.includes('-af')
          ? Promise.resolve({
              stdout: Buffer.alloc(0),
              stderr: Buffer.from('silence_start: 3.0\nsilence_end: 3.5\n'),
              code: 0,
            })
          : Promise.resolve({ stdout: Buffer.alloc(0), stderr: Buffer.alloc(0), code: 0 }),
    }),
    result = await rig.run({
      src: 'F:/media/base.mp3',
      args: { asrProvider: 'bailian' },
    });
  assert.equal(result.asr.provider, 'bailian');
  assert.equal(result.asr.fallbackReason, 'empty');
  assert.equal(result.segments.length, 2);
  assert.deepEqual(
    result.segments.map((segment) => segment.sourceText),
    ['', ''],
  );
});

test('the analyze handler rejects sources without audio and without a duration', async (t) => {
  const outputDir = makeTempDir(t, 'voice-analyze-guards-');
  await assert.rejects(
    () =>
      createAnalyzeRig({
        outputDir,
        hasAudio: false,
        videoMeta: { width: 1920, height: 1080, duration: 5, fps: 30 },
      }).run({ src: 'F:/media/base.mp4', args: {} }),
    /Source video has no audio stream/,
  );
  await assert.rejects(
    () =>
      createAnalyzeRig({
        outputDir,
        hasAudio: false,
        videoMeta: { width: 0, height: 0, duration: 5, fps: 0 },
      }).run({ src: 'F:/media/base.mp3', args: {} }),
    /Source media has no audio stream/,
  );
  await assert.rejects(
    () =>
      createAnalyzeRig({
        outputDir,
        videoMeta: { width: 0, height: 0, duration: 0, fps: 0 },
      }).run({ src: 'F:/media/base.mp4', args: {} }),
    /Source media duration is unavailable/,
  );
  const noModel = createAnalyzeRig({ outputDir, modelRoot: '', videoMeta: { duration: 5 } });
  await assert.rejects(
    () => noModel.run({ src: 'F:/media/base.mp4', args: { asrProvider: 'funasr' } }),
    /FunASR model directory is unavailable/,
  );
  assert.equal(noModel.funasrCalls.length, 0);
});

test('funasr prepare emits a prepare-only transcription', async (t) => {
  const modelRoot = makeTempDir(t, 'voice-funasr-model-'),
    calls = [],
    handler = createFunasrModelPrepareMediaTaskHandler({
      appRoot: 'F:/CanvasPro',
      getFunasrModelRootDir: () => modelRoot,
      getPythonCertificateEnv: () => ({}),
      resolvePythonCommand: () => 'python',
      runFunasrTranscription: (args) => {
        calls.push(args);
        return Promise.resolve({ prepared: true });
      },
    }),
    result = await handler({ taskId: 'p1', payload: { args: { engine: 'gpu' } } }, {
      emitProgress: () => {},
    });
  assert.deepEqual(result, { success: true, provider: 'funasr', engine: 'gpu', ready: true, prepared: true });
  assert.equal(calls[0].prepareOnly, true);
  assert.equal(calls[0].engine, 'gpu');
});

test('funasr prepare rejects a missing model root', async () => {
  const handler = createFunasrModelPrepareMediaTaskHandler({
    getFunasrModelRootDir: () => '',
    resolvePythonCommand: () => 'python',
  });
  await assert.rejects(() => handler({ payload: {} }, {}), /FunASR model directory is unavailable/);
});

test('audio voice model prepare walks both model roots', async (t) => {
  const funasrRoot = makeTempDir(t, 'voice-prepare-funasr-'),
    sortformerRoot = makeTempDir(t, 'voice-prepare-sortformer-');
  const calls = [];
  const handler = createAudioVoiceModelPrepareMediaTaskHandler({
    appRoot: 'F:/CanvasPro',
    getFunasrModelRootDir: () => funasrRoot,
    getPythonCertificateEnv: () => ({}),
    getSortformerModelRootDir: () => sortformerRoot,
    resolvePythonCommand: () => 'python',
    runFunasrTranscription: (args) => {
      calls.push({ kind: 'funasr', args });
      return Promise.resolve({ prepared: true });
    },
    runSortformerDiarization: (args) => {
      calls.push({ kind: 'sortformer', args });
      return Promise.resolve({ prepared: false });
    },
  });
  const result = await handler({ taskId: 'p2', payload: { args: { engine: 'cpu' } } }, {
    emitProgress: () => {},
  });
  assert.deepEqual(result, {
    success: true,
    provider: 'audioVoice',
    asrProvider: 'funasr',
    diarizationProvider: 'sortformer',
    engine: 'cpu',
    ready: true,
    funasrModelRoot: funasrRoot,
    sortformerModelRoot: sortformerRoot,
    prepared: false,
  });
  assert.deepEqual(
    calls.map((entry) => entry.kind),
    ['funasr', 'sortformer'],
  );
  assert.ok(calls.every((entry) => entry.args.prepareOnly === true));
});

test('audio voice model prepare derives the sortformer root from the funasr root', async (t) => {
  const funasrRoot = makeTempDir(t, 'voice-prepare-derive-'),
    calls = [];
  const handler = createAudioVoiceModelPrepareMediaTaskHandler({
    getFunasrModelRootDir: () => funasrRoot,
    getSortformerModelRootDir: () => '',
    resolvePythonCommand: () => 'python',
    runFunasrTranscription: () => Promise.resolve({}),
    runSortformerDiarization: (args) => {
      calls.push(args);
      return Promise.resolve({});
    },
  });
  const result = await handler({ payload: {} }, { emitProgress: () => {} });
  assert.equal(result.sortformerModelRoot, path.join(path.dirname(funasrRoot), 'sortformer'));
  assert.equal(calls[0].modelRoot, result.sortformerModelRoot);
});

test('funasr runtime check reports the probed device', async (t) => {
  const modelRoot = makeTempDir(t, 'voice-runtime-check-');
  const handler = createFunasrRuntimeCheckMediaTaskHandler({
    getFunasrModelRootDir: () => modelRoot,
    getPythonCertificateEnv: () => ({}),
    resolvePythonCommand: () => 'python',
    runFunasrTranscription: () => Promise.resolve({ available: false, code: 'no_cuda', message: 'no gpu', device: 'cpu' }),
  });
  const result = await handler({ payload: { args: { engine: 'gpu' } } }, { emitProgress: () => {} });
  assert.deepEqual(result, {
    success: true,
    provider: 'funasr',
    engine: 'gpu',
    available: false,
    code: 'no_cuda',
    message: 'no gpu',
    device: 'cpu',
  });
});

test('gpu torch install installs then verifies the runtime', async (t) => {
  const modelRoot = makeTempDir(t, 'voice-gpu-torch-');
  const installs = [];
  const handler = createFunasrGpuTorchInstallMediaTaskHandler({
    appRoot: 'F:/CanvasPro',
    getFunasrModelRootDir: () => modelRoot,
    getPythonCertificateEnv: () => ({}),
    resolvePythonCommand: () => 'python',
    runPipInstall: (args) => {
      installs.push(args);
      return Promise.resolve({ code: 0 });
    },
    runFunasrTranscription: () =>
      Promise.resolve({ available: true, device: 'cuda:0', torchVersion: '2.11.0', torchCuda: '12.8' }),
  });
  const queue = {
    emitProgress: () => {},
    runProcess: (task, command, args) => {
      assert.equal(command, 'nvidia-smi');
      return Promise.resolve({ stdout: Buffer.from('NVIDIA GeForce RTX 4090\n'), stderr: Buffer.alloc(0), code: 0 });
    },
  };
  const result = await handler({ taskId: 'g1', payload: {} }, queue);
  assert.deepEqual(result, {
    success: true,
    provider: 'funasr',
    engine: 'gpu',
    gpuName: 'NVIDIA GeForce RTX 4090',
    installed: true,
    verified: true,
    device: 'cuda:0',
    torchVersion: '2.11.0',
    torchCuda: '12.8',
  });
  assert.equal(installs.length, 1);
  assert.ok(installs[0].pipArgs.includes('torch==2.11.0+cu128'));
});

test('gpu torch install surfaces a still-unavailable runtime', async (t) => {
  const modelRoot = makeTempDir(t, 'voice-gpu-torch-fail-');
  const handler = createFunasrGpuTorchInstallMediaTaskHandler({
    getFunasrModelRootDir: () => modelRoot,
    resolvePythonCommand: () => 'python',
    runPipInstall: () => Promise.resolve({ code: 0 }),
    runFunasrTranscription: () => Promise.resolve({ available: false, message: 'cuda missing' }),
  });
  const queue = {
    emitProgress: () => {},
    runProcess: () => Promise.resolve({ stdout: Buffer.from('RTX 3060\n'), stderr: Buffer.alloc(0), code: 0 }),
  };
  await assert.rejects(() => handler({ payload: {} }, queue), /cuda missing/);
  await assert.rejects(
    () =>
      createFunasrGpuTorchInstallMediaTaskHandler({
        getFunasrModelRootDir: () => modelRoot,
        resolvePythonCommand: () => '',
      })({ payload: {} }, queue),
    /Python runtime is unavailable/,
  );
});

test('the shared registration exposes every audio voice handler', () => {
  const registered = new Map();
  registerSharedMediaTaskHandlers(
    { setHandler: (kind, handler) => registered.set(kind, handler) },
    {},
  );
  for (const kind of [
    'audioVoiceAnalyze',
    'audioVoiceModelPrepare',
    'funasrModelPrepare',
    'funasrRuntimeCheck',
    'funasrGpuTorchInstall',
  ]) {
    assert.equal(typeof registered.get(kind), 'function', kind + ' should be registered');
  }
});

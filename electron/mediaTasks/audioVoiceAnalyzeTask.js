import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveApplicationResourceRoot } from '../applicationResourceRoot.js';
import { createAudioVoiceCloudAsrAdapters } from './audioVoiceCloudAsr.js';
import { createProcessStartError, MediaTaskCancelledError } from '../mediaTaskQueue.js';
import { runDoubaoAsrTranscription } from './doubaoAsrClient.js';
export {
  buildDoubaoAsrHeaders,
  buildDoubaoAsrSubmitBody,
  normalizeDoubaoAsrSegments,
  runDoubaoAsrTranscription,
} from './doubaoAsrClient.js';
const __filename = fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename),
  DEFAULT_APP_ROOT = resolveApplicationResourceRoot(path.resolve(__dirname, '..', '..')),
  AUDIO_VOICE_ASR_STAGE = Object.freeze({
    MODEL_DOWNLOAD: 'model-download',
    MODEL_PREPARE: 'model-prepare',
    TRANSCRIBE: 'transcribe',
    DIARIZATION_MODEL_DOWNLOAD: 'diarization-model-download',
    DIARIZATION_MODEL_PREPARE: 'diarization-model-prepare',
    DIARIZE: 'diarize',
    SLICE: 'slice',
  }),
  FUNASR_GPU_TORCH_STAGE = Object.freeze({
    CHECK: 'gpu-torch-check',
    INSTALL: 'gpu-torch-install',
    VERIFY: 'gpu-torch-verify',
  }),
  FUNASR_STAGE_RANGES = Object.freeze({
    'model-download': [0.08, 0.32],
    'model-prepare': [0.32, 0.42],
    transcribe: [0.42, 0.52],
    'diarization-model-download': [0.52, 0.64],
    'diarization-model-prepare': [0.64, 0.7],
    diarize: [0.7, 0.8],
  });
function resolveAsrProgressMessage(stage = '', message = '') {
  const rawMessage = String(message || '').trim();
  if (rawMessage && !/funasr|paraformer|modelscope/i.test(rawMessage)) return rawMessage;
  switch (stage) {
    case AUDIO_VOICE_ASR_STAGE.MODEL_DOWNLOAD:
      return 'Preparing subtitle recognition model';
    case AUDIO_VOICE_ASR_STAGE.MODEL_PREPARE:
      return 'Preparing recognition runtime';
    case AUDIO_VOICE_ASR_STAGE.TRANSCRIBE:
      return 'Recognizing subtitles';
    default:
      return 'Preparing subtitle recognition';
  }
}
const FUNASR_DEFAULT_MODEL = Object.freeze({
    model: 'paraformer-zh',
    vadModel: 'fsmn-vad',
    puncModel: 'ct-punc-c',
    spkModel: 'cam++',
  }),
  SORTFORMER_DEFAULT_MODEL_FILE = 'diar_streaming_sortformer_4spk-v2.1.nemo',
  SORTFORMER_DEFAULT_MODEL_URL =
    'https://huggingface.co/nvidia/diar_streaming_sortformer_4spk-v2.1/resolve/main/diar_streaming_sortformer_4spk-v2.1.nemo',
  FUNASR_TRANSCRIPT_MERGE_DEFAULTS = Object.freeze({
    maxGapMs: 0x320,
    maxDurationMs: 0x2710,
    maxTextChars: 0x64,
  }),
  DIARIZATION_SPEAKER_RECONCILE_DEFAULTS = Object.freeze({ maxBridgeGapMs: 0x78 }),
  DEFAULT_FUNASR_GPU_TORCH_INDEX_URL = 'https://download.pytorch.org/whl/cu128',
  DEFAULT_FUNASR_GPU_TORCH_PACKAGES = Object.freeze([
    'torch==2.11.0+cu128',
    'torchaudio==2.11.0+cu128',
  ]);
function toNumber(value, fallback = 0x0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function normalizePositiveSeconds(value, fallback) {
  const numeric = toNumber(value, fallback);
  return numeric > 0x0 ? numeric : fallback;
}
function normalizeSilenceOptions(options = {}) {
  const noiseDb = Math.round(toNumber(options.noiseDb, -0x23)),
    minSilenceSec = normalizePositiveSeconds(options.minSilenceSec, 0.35),
    paddingMs = Math.max(0x0, Math.round(toNumber(options.paddingMs, 0x50)));
  return { noiseDb: noiseDb, minSilenceSec: minSilenceSec, paddingMs: paddingMs };
}
function normalizeAsrProvider(options = {}) {
  return String(options.asrProvider || '')
    .trim()
    .toLowerCase();
}
function normalizeDiarizationProvider(options = {}) {
  const provider = String(options.diarizationProvider || '')
    .trim()
    .toLowerCase();
  if (['none', 'off', 'disabled', 'false'].includes(provider)) return 'none';
  return 'sortformer';
}
function resolveSortformerModelRootFromFunasrRoot(funasrRoot = '') {
  const rootDir = String(funasrRoot || '').trim();
  if (!rootDir) return '';
  return path.join(path.dirname(path.resolve(rootDir)), 'sortformer');
}
export function normalizeFunasrEngine(engine) {
  return String(engine || '')
    .trim()
    .toLowerCase() === 'gpu'
    ? 'gpu'
    : 'cpu';
}
export function parseSilenceDetectRanges(output = '', durationSec = 0x0) {
  const text = String(output || ''),
    maxSec = Math.max(0x0, toNumber(durationSec, 0x0)),
    pattern = /silence_(start|end):\s*([0-9]+(?:\.[0-9]+)?)/g,
    ranges = [];
  let pendingStart = null,
    match = null;
  while ((match = pattern.exec(text))) {
    const marker = match[0x1],
      seconds = clamp(toNumber(match[0x2], 0x0), 0x0, maxSec || Number.MAX_SAFE_INTEGER);
    if (marker === 'start') {
      pendingStart = seconds;
      continue;
    }
    pendingStart != null &&
      seconds > pendingStart &&
      (ranges.push({ startSec: pendingStart, endSec: seconds }), (pendingStart = null));
  }
  return (
    pendingStart != null &&
      maxSec > pendingStart &&
      ranges.push({ startSec: pendingStart, endSec: maxSec }),
    ranges.sort((left, right) => left.startSec - right.startSec)
  );
}
function mergeShortSpeechSegments(segments, minSpeechSec) {
  const merged = [];
  for (const segment of segments) {
    const durationSec = segment.endSec - segment.startSec;
    if (durationSec >= minSpeechSec || merged.length === 0x0) {
      merged.push({ ...segment });
      continue;
    }
    merged[merged.length - 0x1].endSec = segment.endSec;
  }
  return merged.filter((segment) => segment.endSec - segment.startSec > 0.05);
}
export function buildAudioVoiceSpeechSegments({
  silenceRanges: silenceRanges = [],
  durationSec: durationSec = 0x0,
  paddingMs: paddingMs = 0x50,
  minSpeechSec: minSpeechSec = 0.25,
} = {}) {
  const totalSec = Math.max(0x0, toNumber(durationSec, 0x0));
  if (totalSec <= 0x0) return [];
  const speechRanges = [];
  let cursorSec = 0x0;
  for (const range of silenceRanges) {
    const startSec = clamp(toNumber(range.startSec, 0x0), 0x0, totalSec),
      endSec = clamp(toNumber(range.endSec, startSec), startSec, totalSec);
    if (startSec > cursorSec) speechRanges.push({ startSec: cursorSec, endSec: startSec });
    cursorSec = Math.max(cursorSec, endSec);
  }
  if (cursorSec < totalSec) speechRanges.push({ startSec: cursorSec, endSec: totalSec });
  const normalizedRanges = speechRanges.length
      ? mergeShortSpeechSegments(speechRanges, Math.max(0.05, toNumber(minSpeechSec, 0.25)))
      : [{ startSec: 0x0, endSec: totalSec }],
    paddingSec = Math.max(0x0, toNumber(paddingMs, 0x0)) / 0x3e8,
    segments = [];
  let previousEndSec = 0x0;
  for (const range of normalizedRanges) {
    const startSec = clamp(range.startSec - paddingSec, previousEndSec, totalSec),
      endSec = clamp(range.endSec + paddingSec, startSec, totalSec);
    if (endSec - startSec <= 0.05) continue;
    (segments.push({
      startMs: Math.round(startSec * 0x3e8),
      endMs: Math.round(endSec * 0x3e8),
    }),
      (previousEndSec = endSec));
  }
  return segments.length ? segments : [{ startMs: 0x0, endMs: Math.round(totalSec * 0x3e8) }];
}
function formatSec(milliseconds) {
  return (Math.max(0x0, Number(milliseconds) || 0x0) / 0x3e8).toFixed(0x3);
}
export function buildAudioVoiceSegmentCutArgs({
  sourceAudioAbs: sourceAudioAbs,
  outAbs: outAbs,
  startMs: startMs,
  endMs: endMs,
} = {}) {
  const durationMs = Math.max(0x1, Math.round(Number(endMs || 0x0) - Number(startMs || 0x0)));
  return [
    '-y',
    '-ss',
    formatSec(startMs),
    '-i',
    sourceAudioAbs,
    '-t',
    formatSec(durationMs),
    '-vn',
    '-c:a',
    'libmp3lame',
    '-b:a',
    '192k',
    outAbs,
  ];
}
export function normalizeFunasrTranscriptSegments(result = {}, durationSec = 0x0) {
  const maxMs = Math.max(0x0, Math.round(Number(durationSec || 0x0) * 0x3e8)),
    rawSegments = Array.isArray(result?.segments)
      ? result.segments
      : Array.isArray(result)
        ? result
        : [],
    segments = [];
  for (const rawSegment of rawSegments) {
    const startMs = clamp(
        Math.round(Number(rawSegment?.startMs || 0x0)),
        0x0,
        maxMs || Number.MAX_SAFE_INTEGER,
      ),
      endMs = clamp(
        Math.round(Number(rawSegment?.endMs || 0x0)),
        startMs,
        maxMs || Number.MAX_SAFE_INTEGER,
      );
    if (endMs - startMs <= 0.05) continue;
    const speaker = normalizeSpeakerLabel(
        rawSegment?.speaker ?? rawSegment?.spk ?? rawSegment?.speakerId,
      ),
      segment = {
        startMs: startMs,
        endMs: endMs,
        sourceText: String(rawSegment?.sourceText || rawSegment?.text || '').trim(),
      };
    if (speaker) segment.speaker = speaker;
    segments.push(segment);
  }
  return segments.sort((left, right) => left.startMs - right.startMs);
}
export function normalizeDiarizationSegments(result = {}, durationSec = 0x0) {
  const maxMs = Math.max(0x0, Math.round(Number(durationSec || 0x0) * 0x3e8)),
    rawSegments = Array.isArray(result?.segments)
      ? result.segments
      : Array.isArray(result)
        ? result
        : [],
    segments = [];
  for (const rawSegment of rawSegments) {
    const startMs = clamp(
        Math.round(Number(rawSegment?.startMs || 0x0)),
        0x0,
        maxMs || Number.MAX_SAFE_INTEGER,
      ),
      endMs = clamp(
        Math.round(Number(rawSegment?.endMs || 0x0)),
        startMs,
        maxMs || Number.MAX_SAFE_INTEGER,
      );
    if (endMs - startMs <= 0.05) continue;
    const speaker = normalizeSpeakerLabel(
      rawSegment?.speaker ?? rawSegment?.label ?? rawSegment?.spk ?? rawSegment?.speakerId,
    );
    if (!speaker) continue;
    segments.push({ startMs: startMs, endMs: endMs, speaker: speaker });
  }
  return segments.sort((left, right) => left.startMs - right.startMs);
}
function normalizeSpeakerLabel(value) {
  if (value == null) return '';
  return String(value).trim();
}
function transcriptTextLength(text = '') {
  return Array.from(String(text || '').trim()).length;
}
function joinTranscriptText(left = '', right = '') {
  const leftText = String(left || '').trim(),
    rightText = String(right || '').trim();
  if (!leftText) return rightText;
  if (!rightText) return leftText;
  const lastChar = leftText.slice(-0x1),
    firstChar = rightText.slice(0x0, 0x1),
    needsSpace = /[A-Za-z0-9,.;:!?)]/.test(lastChar) && /[A-Za-z0-9(]/.test(firstChar);
  return '' + leftText + (needsSpace ? ' ' : '') + rightText;
}
function mergeSpeakerLabel(left = '', right = '') {
  const leftLabel = normalizeSpeakerLabel(left),
    rightLabel = normalizeSpeakerLabel(right);
  return leftLabel && rightLabel && leftLabel === rightLabel ? leftLabel : '';
}
function hasStrongTranscriptBoundary(text = '') {
  return /[。！？!?…]$/.test(String(text || '').trim());
}
function canMergeFunasrTranscriptSegments(previous = {}, next = {}, options = {}) {
  if (!mergeSpeakerLabel(previous.speaker, next.speaker)) return false;
  const maxGapMs = Math.max(
      0x0,
      Math.round(toNumber(options.maxGapMs, FUNASR_TRANSCRIPT_MERGE_DEFAULTS.maxGapMs)),
    ),
    maxDurationMs = Math.max(
      0x1,
      Math.round(toNumber(options.maxDurationMs, FUNASR_TRANSCRIPT_MERGE_DEFAULTS.maxDurationMs)),
    ),
    maxTextChars = Math.max(
      0x1,
      Math.round(toNumber(options.maxTextChars, FUNASR_TRANSCRIPT_MERGE_DEFAULTS.maxTextChars)),
    ),
    gapMs = Math.round(Number(next.startMs || 0x0) - Number(previous.endMs || 0x0));
  if (gapMs > maxGapMs) return false;
  const startMs = Math.min(Number(previous.startMs || 0x0), Number(next.startMs || 0x0)),
    endMs = Math.max(Number(previous.endMs || 0x0), Number(next.endMs || 0x0));
  if (endMs - startMs > maxDurationMs) return false;
  const mergedText = joinTranscriptText(previous.sourceText, next.sourceText);
  return transcriptTextLength(mergedText) <= maxTextChars;
}
function shouldBridgeDiarizationSpeakerChange(
  previousTranscript = {},
  nextTranscript = {},
  previousDiarization = {},
  nextDiarization = {},
) {
  const mergedLabel = mergeSpeakerLabel(
    previousTranscript?.speaker ?? previousTranscript?.spk ?? previousTranscript?.speakerId,
    nextTranscript?.speaker ?? nextTranscript?.spk ?? nextTranscript?.speakerId,
  );
  if (!mergedLabel) return false;
  const previousLabel = normalizeSpeakerLabel(previousDiarization?.speaker),
    nextLabel = normalizeSpeakerLabel(nextDiarization?.speaker);
  if (!previousLabel || !nextLabel || previousLabel === nextLabel) return false;
  const gapMs = Math.max(
      0x0,
      Math.round(Number(nextDiarization?.startMs || 0x0) - Number(previousDiarization?.endMs || 0x0)),
    ),
    maxBridgeGapMs = Math.max(
      0x0,
      Math.round(DIARIZATION_SPEAKER_RECONCILE_DEFAULTS.maxBridgeGapMs),
    );
  if (gapMs > maxBridgeGapMs) return false;
  if (
    hasStrongTranscriptBoundary(
      previousDiarization?.sourceText ?? previousTranscript?.sourceText ?? previousTranscript?.text,
    )
  )
    return false;
  return canMergeFunasrTranscriptSegments(
    { ...previousDiarization, speaker: previousLabel },
    { ...nextDiarization, speaker: previousLabel },
  );
}
function reconcileDiarizationSpeakerChanges(transcriptSegments = [], diarizationSegments = []) {
  const transcripts = Array.isArray(transcriptSegments) ? transcriptSegments : [],
    diarizations = (Array.isArray(diarizationSegments) ? diarizationSegments : []).map((segment) => ({
      ...segment,
    }));
  for (let index = 0x1; index < diarizations.length; index += 0x1) {
    const previous = diarizations[index - 0x1],
      current = diarizations[index];
    shouldBridgeDiarizationSpeakerChange(
      transcripts[index - 0x1],
      transcripts[index],
      previous,
      current,
    ) && (current.speaker = normalizeSpeakerLabel(previous.speaker));
  }
  return diarizations;
}
export function mergeFunasrTranscriptSegments(segments = [], options = {}) {
  const merged = [];
  for (const rawSegment of Array.isArray(segments) ? segments : []) {
    const startMs = Math.max(0x0, Math.round(Number(rawSegment?.startMs || 0x0))),
      endMs = Math.max(startMs, Math.round(Number(rawSegment?.endMs || 0x0)));
    if (endMs - startMs <= 0.05) continue;
    const speaker = normalizeSpeakerLabel(
        rawSegment?.speaker ?? rawSegment?.spk ?? rawSegment?.speakerId,
      ),
      segment = {
        startMs: startMs,
        endMs: endMs,
        sourceText: String(rawSegment?.sourceText || rawSegment?.text || '').trim(),
      };
    if (speaker) segment.speaker = speaker;
    const previous = merged[merged.length - 0x1];
    if (previous && canMergeFunasrTranscriptSegments(previous, segment, options)) {
      ((previous.endMs = Math.max(previous.endMs, segment.endMs)),
        (previous.sourceText = joinTranscriptText(previous.sourceText, segment.sourceText)));
      const mergedLabel = mergeSpeakerLabel(previous.speaker, segment.speaker);
      mergedLabel ? (previous.speaker = mergedLabel) : delete previous.speaker;
      continue;
    }
    merged.push(segment);
  }
  return merged;
}
function stripTranscriptSpeakerLabels(segments = []) {
  return (Array.isArray(segments) ? segments : [])
    .map((segment) => ({
      startMs: Math.max(0x0, Math.round(Number(segment?.startMs || 0x0))),
      endMs: Math.max(0x0, Math.round(Number(segment?.endMs || 0x0))),
      sourceText: String(segment?.sourceText || segment?.text || '').trim(),
    }))
    .filter((segment) => segment.endMs > segment.startMs);
}
function overlapMs(left = {}, right = {}) {
  const startMs = Math.max(Number(left.startMs || 0x0), Number(right.startMs || 0x0)),
    endMs = Math.min(Number(left.endMs || 0x0), Number(right.endMs || 0x0));
  return Math.max(0x0, Math.round(endMs - startMs));
}
export function assignDiarizationSpeakersToTranscriptSegments(
  transcriptSegments = [],
  diarizationSegments = [],
) {
  const normalizedDiarization = normalizeDiarizationSegments(diarizationSegments),
    strippedTranscript = stripTranscriptSpeakerLabels(transcriptSegments),
    assigned = strippedTranscript.map((segment) => {
      const speakerMs = new Map();
      for (const diarization of normalizedDiarization) {
        const overlap = overlapMs(segment, diarization);
        if (overlap <= 0x0) continue;
        const speaker = normalizeSpeakerLabel(diarization.speaker);
        if (!speaker) continue;
        speakerMs.set(speaker, (speakerMs.get(speaker) || 0x0) + overlap);
      }
      let bestSpeaker = '',
        bestMs = 0x0;
      for (const [speaker, totalMs] of speakerMs.entries()) {
        totalMs > bestMs && ((bestSpeaker = speaker), (bestMs = totalMs));
      }
      return bestSpeaker ? { ...segment, speaker: bestSpeaker } : segment;
    });
  return reconcileDiarizationSpeakerChanges(transcriptSegments, assigned);
}
export function hasRecognizedTranscriptText(segments = []) {
  return segments.some((segment) => String(segment?.sourceText || '').trim());
}
export function mapFunasrProgressToOverall(stage, progress) {
  const normalizedStage = String(stage || '').trim(),
    range = FUNASR_STAGE_RANGES[normalizedStage] || FUNASR_STAGE_RANGES.transcribe,
    normalizedProgress = clamp(Number(progress || 0x0), 0x0, 0x1);
  return range[0x0] + (range[0x1] - range[0x0]) * normalizedProgress;
}
export function buildFunasrTranscriptionArgs({
  audioAbs: audioAbs,
  modelRoot: modelRoot,
  durationSec: durationSec,
  downloadModelIfMissing: downloadModelIfMissing = true,
  engine: engine = 'cpu',
  model: model = FUNASR_DEFAULT_MODEL.model,
  vadModel: vadModel = FUNASR_DEFAULT_MODEL.vadModel,
  puncModel: puncModel = FUNASR_DEFAULT_MODEL.puncModel,
  spkModel: spkModel = FUNASR_DEFAULT_MODEL.spkModel,
  prepareOnly: prepareOnly = false,
  checkRuntimeOnly: checkRuntimeOnly = false,
} = {}) {
  const args = [
      '-m',
      'backend.services.funasr_transcription_service',
      '--model-root',
      modelRoot,
      '--duration-ms',
      String(Math.max(0x0, Math.round(Number(durationSec || 0x0) * 0x3e8))),
      '--model',
      model,
      '--vad-model',
      vadModel,
      '--punc-model',
      puncModel,
      '--engine',
      normalizeFunasrEngine(engine),
    ],
    normalizedSpkModel = String(spkModel || '').trim();
  if (normalizedSpkModel) args.push('--spk-model', normalizedSpkModel);
  if (checkRuntimeOnly) args.push('--check-runtime-only');
  else
    prepareOnly ? args.push('--prepare-only') : args.splice(0x2, 0x0, '--audio', audioAbs);
  if (downloadModelIfMissing) args.push('--download-model-if-missing');
  return args;
}
export function buildSortformerDiarizationArgs({
  audioAbs: audioAbs,
  modelRoot: modelRoot,
  durationSec: durationSec,
  downloadModelIfMissing: downloadModelIfMissing = true,
  engine: engine = 'cpu',
  modelUrl: modelUrl = SORTFORMER_DEFAULT_MODEL_URL,
  modelFile: modelFile = SORTFORMER_DEFAULT_MODEL_FILE,
  prepareOnly: prepareOnly = false,
  checkRuntimeOnly: checkRuntimeOnly = false,
} = {}) {
  const args = [
    '-m',
    'backend.services.sortformer_diarization_service',
    '--model-root',
    modelRoot,
    '--duration-ms',
    String(Math.max(0x0, Math.round(Number(durationSec || 0x0) * 0x3e8))),
    '--model-url',
    String(modelUrl || SORTFORMER_DEFAULT_MODEL_URL),
    '--model-file',
    String(modelFile || SORTFORMER_DEFAULT_MODEL_FILE),
    '--engine',
    normalizeFunasrEngine(engine),
  ];
  if (checkRuntimeOnly) args.push('--check-runtime-only');
  else
    prepareOnly ? args.push('--prepare-only') : args.splice(0x2, 0x0, '--audio', audioAbs);
  if (downloadModelIfMissing) args.push('--download-model-if-missing');
  return args;
}
export function buildFunasrEnv(modelRoot, baseEnv = process.env, extraEnv = {}) {
  const resolvedRoot = path.resolve(modelRoot),
    cacheDir = path.join(resolvedRoot, 'cache'),
    modelsDir = path.join(resolvedRoot, 'models'),
    torchDir = path.join(resolvedRoot, 'torch'),
    pipCacheDir = path.join(resolvedRoot, 'pip-cache'),
    tmpDir = path.join(resolvedRoot, 'tmp');
  return (
    mkdirSync(cacheDir, { recursive: true }),
    mkdirSync(modelsDir, { recursive: true }),
    mkdirSync(torchDir, { recursive: true }),
    mkdirSync(pipCacheDir, { recursive: true }),
    mkdirSync(tmpDir, { recursive: true }),
    {
      ...baseEnv,
      ...extraEnv,
      AIC_FUNASR_MODEL_ROOT: resolvedRoot,
      MODELSCOPE_CACHE: modelsDir,
      MODELSCOPE_HOME: cacheDir,
      HF_HOME: cacheDir,
      HUGGINGFACE_HUB_CACHE: modelsDir,
      TRANSFORMERS_CACHE: modelsDir,
      TORCH_HOME: torchDir,
      PIP_CACHE_DIR: pipCacheDir,
      PIP_DISABLE_PIP_VERSION_CHECK: '1',
      XDG_CACHE_HOME: cacheDir,
      TMPDIR: tmpDir,
      TEMP: tmpDir,
      TMP: tmpDir,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
    }
  );
}
export function buildSortformerEnv(modelRoot, baseEnv = process.env, extraEnv = {}) {
  const resolvedRoot = path.resolve(modelRoot),
    cacheDir = path.join(resolvedRoot, 'cache'),
    modelsDir = path.join(resolvedRoot, 'models'),
    torchDir = path.join(resolvedRoot, 'torch'),
    pipCacheDir = path.join(resolvedRoot, 'pip-cache'),
    tmpDir = path.join(resolvedRoot, 'tmp');
  return (
    mkdirSync(cacheDir, { recursive: true }),
    mkdirSync(modelsDir, { recursive: true }),
    mkdirSync(torchDir, { recursive: true }),
    mkdirSync(pipCacheDir, { recursive: true }),
    mkdirSync(tmpDir, { recursive: true }),
    {
      ...baseEnv,
      ...extraEnv,
      AIC_SORTFORMER_MODEL_ROOT: resolvedRoot,
      HF_HOME: cacheDir,
      HUGGINGFACE_HUB_CACHE: modelsDir,
      TORCH_HOME: torchDir,
      PIP_CACHE_DIR: pipCacheDir,
      PIP_DISABLE_PIP_VERSION_CHECK: '1',
      XDG_CACHE_HOME: cacheDir,
      TMPDIR: tmpDir,
      TEMP: tmpDir,
      TMP: tmpDir,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      HF_HUB_DISABLE_TELEMETRY: '1',
      WANDB_DISABLED: 'true',
    }
  );
}
function normalizePackageList(packages, fallback = []) {
  const candidates = Array.isArray(packages) ? packages : [],
    normalized = candidates.map((entry) => String(entry || '').trim()).filter(Boolean);
  return normalized.length ? normalized : [...fallback];
}
export function buildFunasrGpuTorchInstallArgs({
  indexUrl: indexUrl = DEFAULT_FUNASR_GPU_TORCH_INDEX_URL,
  packages: packages = DEFAULT_FUNASR_GPU_TORCH_PACKAGES,
} = {}) {
  const resolvedIndexUrl = String(indexUrl || '').trim() || DEFAULT_FUNASR_GPU_TORCH_INDEX_URL,
    resolvedPackages = normalizePackageList(packages, DEFAULT_FUNASR_GPU_TORCH_PACKAGES);
  return [
    '-m',
    'pip',
    'install',
    '--upgrade',
    '--prefer-binary',
    '--no-input',
    '--disable-pip-version-check',
    '--index-url',
    resolvedIndexUrl,
    ...resolvedPackages,
  ];
}
function parseFirstLine(output = '') {
  return (
    String(output || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean) || ''
  );
}
async function detectNvidiaGpuNameForInstall({ queue: queue, task: task } = {}) {
  queue?.emitProgress?.(task, 0.04, 'Checking NVIDIA GPU', {
    stage: FUNASR_GPU_TORCH_STAGE.CHECK,
  });
  const result = await queue.runProcess(task, 'nvidia-smi', [
      '--query-gpu=name',
      '--format=csv,noheader',
    ]),
    gpuName = parseFirstLine(result.stdout?.toString('utf8'));
  if (!gpuName) throw new Error('No NVIDIA GPU was detected');
  return gpuName;
}
export function runPipInstallProcess({
  appRoot: appRoot = DEFAULT_APP_ROOT,
  env: env,
  pipArgs: pipArgs = [],
  pythonCommand: pythonCommand,
  queue: queue,
  spawnImpl: spawnImpl = spawn,
  task: task,
} = {}) {
  if (!pythonCommand) throw new Error('Python runtime is unavailable');
  return new Promise((resolve, reject) => {
    queue?.throwIfCancelled?.(task);
    const child = spawnImpl(pythonCommand, pipArgs, {
      cwd: appRoot,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    task.child = child;
    const stdoutChunks = [],
      stderrChunks = [];
    let progress = 0.12;
    const bumpProgress = (message = 'Installing GPU acceleration component') => {
        ((progress = Math.min(0.88, progress + 0.015)),
          queue?.emitProgress?.(task, progress, message, {
            stage: FUNASR_GPU_TORCH_STAGE.INSTALL,
          }));
      },
      progressTimer = setInterval(() => {
        if (queue?.isCancelled?.(task)) {
          try {
            child.kill();
          } catch {}
          return;
        }
        bumpProgress();
      }, 0x7d0),
      settle = (callback, value) => {
        clearInterval(progressTimer);
        if (task.child === child) task.child = null;
        callback(value);
      },
      handleOutput = (chunk) => {
        const text = Buffer.from(chunk).toString('utf8');
        /downloading|installing|collecting/i.test(text) && bumpProgress('Installing CUDA PyTorch');
      };
    (child.stdout?.on('data', (chunk) => {
      (stdoutChunks.push(Buffer.from(chunk)), handleOutput(chunk));
    }),
      child.stderr?.on('data', (chunk) => {
        (stderrChunks.push(Buffer.from(chunk)), handleOutput(chunk));
      }),
      child.once('error', (error) =>
        settle(reject, createProcessStartError(pythonCommand, pipArgs, { cwd: appRoot }, error, 0x1)),
      ),
      child.once('exit', (code, signal) => {
        if (queue?.isCancelled?.(task)) {
          settle(reject, new MediaTaskCancelledError());
          return;
        }
        if (code === 0x0) {
          settle(resolve, {
            stdout: Buffer.concat(stdoutChunks),
            stderr: Buffer.concat(stderrChunks),
            code: code,
            signal: signal,
          });
          return;
        }
        const message =
          Buffer.concat(stderrChunks).toString('utf8').trim() ||
          Buffer.concat(stdoutChunks).toString('utf8').trim() ||
          'pip install exited with ' + (code ?? signal ?? 'unknown');
        settle(reject, new Error(message));
      }));
  });
}
function parseJsonLine(line) {
  const text = String(line || '').trim();
  if (!text || !text.startsWith('{')) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
export function runFunasrTranscriptionProcess({
  appRoot: appRoot = DEFAULT_APP_ROOT,
  audioAbs: audioAbs,
  downloadModelIfMissing: downloadModelIfMissing = true,
  durationSec: durationSec = 0x0,
  engine: engine = 'cpu',
  modelRoot: modelRoot,
  prepareOnly: prepareOnly = false,
  checkRuntimeOnly: checkRuntimeOnly = false,
  pythonCommand: pythonCommand,
  certificateEnv: certificateEnv = {},
  queue: queue,
  spawnImpl: spawnImpl = spawn,
  task: task,
} = {}) {
  if (!pythonCommand) throw new Error('Python runtime is unavailable');
  if (!modelRoot) throw new Error('FunASR model directory is unavailable');
  return (
    mkdirSync(modelRoot, { recursive: true }),
    new Promise((resolve, reject) => {
      queue?.throwIfCancelled?.(task);
      const args = buildFunasrTranscriptionArgs({
          audioAbs: audioAbs,
          modelRoot: modelRoot,
          durationSec: durationSec,
          downloadModelIfMissing: downloadModelIfMissing,
          engine: engine,
          prepareOnly: prepareOnly,
          checkRuntimeOnly: checkRuntimeOnly,
        }),
        child = spawnImpl(pythonCommand, args, {
          cwd: appRoot,
          env: buildFunasrEnv(modelRoot, process.env, certificateEnv),
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });
      task.child = child;
      let resultMessage = null,
        errorMessage = null,
        stdoutBuffer = '',
        stderrBuffer = '',
        stage = AUDIO_VOICE_ASR_STAGE.MODEL_DOWNLOAD,
        overallProgress = mapFunasrProgressToOverall(stage, 0x0);
      const emitStageProgress = (nextStage, fraction, message = '') => {
          ((stage = String(nextStage || stage)),
            (overallProgress = Math.max(overallProgress, mapFunasrProgressToOverall(stage, fraction))),
            queue?.emitProgress?.(task, overallProgress, resolveAsrProgressMessage(stage, message), {
              stage: stage,
            }));
        },
        progressTimer = setInterval(() => {
          if (queue?.isCancelled?.(task)) {
            try {
              child.kill();
            } catch {}
            return;
          }
          const range = FUNASR_STAGE_RANGES[stage] || FUNASR_STAGE_RANGES.transcribe,
            nextProgress = Math.min(range[0x1] - 0.01, overallProgress + 0.006);
          nextProgress > overallProgress &&
            ((overallProgress = nextProgress),
            queue?.emitProgress?.(task, nextProgress, resolveAsrProgressMessage(stage), {
              stage: stage,
            }));
        }, 0x5dc),
        settle = (callback, value) => {
          clearInterval(progressTimer);
          if (task.child === child) task.child = null;
          callback(value);
        },
        handleLine = (line) => {
          const message = parseJsonLine(line);
          if (!message) return;
          if (message.type === 'progress')
            emitStageProgress(message.stage, message.progress, message.message);
          else {
            if (message.type === 'result') resultMessage = message;
            else message.type === 'error' && (errorMessage = message);
          }
        };
      (child.stdout?.on('data', (chunk) => {
        stdoutBuffer += Buffer.from(chunk).toString('utf8');
        const lines = stdoutBuffer.split(/\r?\n/);
        ((stdoutBuffer = lines.pop() || ''), lines.forEach(handleLine));
      }),
        child.stderr?.on('data', (chunk) => {
          stderrBuffer += Buffer.from(chunk).toString('utf8');
        }),
        child.once('error', (error) =>
          settle(
            reject,
            createProcessStartError(pythonCommand, args, { cwd: appRoot }, error, 0x1),
          ),
        ),
        child.once('exit', (code, signal) => {
          if (stdoutBuffer) handleLine(stdoutBuffer);
          if (queue?.isCancelled?.(task)) {
            settle(reject, new MediaTaskCancelledError());
            return;
          }
          if (code === 0x0 && resultMessage) {
            settle(resolve, resultMessage);
            return;
          }
          const message =
            String(errorMessage?.message || '').trim() ||
            stderrBuffer.trim() ||
            'FunASR exited with ' + (code ?? signal ?? 'unknown');
          settle(reject, new Error(message));
        }));
    })
  );
}
export function runSortformerDiarizationProcess({
  appRoot: appRoot = DEFAULT_APP_ROOT,
  audioAbs: audioAbs,
  downloadModelIfMissing: downloadModelIfMissing = true,
  durationSec: durationSec = 0x0,
  engine: engine = 'cpu',
  modelRoot: modelRoot,
  pythonCommand: pythonCommand,
  certificateEnv: certificateEnv = {},
  prepareOnly: prepareOnly = false,
  checkRuntimeOnly: checkRuntimeOnly = false,
  queue: queue,
  spawnImpl: spawnImpl = spawn,
  task: task,
} = {}) {
  if (!pythonCommand) throw new Error('Python runtime is unavailable');
  if (!modelRoot) throw new Error('Sortformer model directory is unavailable');
  return (
    mkdirSync(modelRoot, { recursive: true }),
    new Promise((resolve, reject) => {
      queue?.throwIfCancelled?.(task);
      const args = buildSortformerDiarizationArgs({
          audioAbs: audioAbs,
          modelRoot: modelRoot,
          durationSec: durationSec,
          downloadModelIfMissing: downloadModelIfMissing,
          engine: engine,
          prepareOnly: prepareOnly,
          checkRuntimeOnly: checkRuntimeOnly,
        }),
        child = spawnImpl(pythonCommand, args, {
          cwd: appRoot,
          env: buildSortformerEnv(modelRoot, process.env, certificateEnv),
          stdio: ['ignore', 'pipe', 'pipe'],
          windowsHide: true,
        });
      task.child = child;
      let resultMessage = null,
        errorMessage = null,
        stdoutBuffer = '',
        stderrBuffer = '',
        progress = 0.52;
      const progressTimer = setInterval(() => {
          if (queue?.isCancelled?.(task)) {
            try {
              child.kill();
            } catch {}
            return;
          }
          ((progress = Math.min(0.79, progress + 0.004)),
            queue?.emitProgress?.(task, progress, 'Preparing speaker separation', {
              stage: AUDIO_VOICE_ASR_STAGE.DIARIZATION_MODEL_PREPARE,
            }));
        }, 0x7d0),
        settle = (callback, value) => {
          clearInterval(progressTimer);
          if (task.child === child) task.child = null;
          callback(value);
        },
        handleLine = (line) => {
          const message = parseJsonLine(line);
          if (!message) return;
          if (message.type === 'progress') {
            const mappedProgress = mapFunasrProgressToOverall(message.stage, message.progress);
            ((progress = Math.max(progress, mappedProgress)),
              queue?.emitProgress?.(
                task,
                progress,
                message.message || 'Separating speakers',
                { stage: message.stage || AUDIO_VOICE_ASR_STAGE.DIARIZE },
              ));
          } else {
            if (message.type === 'result') resultMessage = message;
            else message.type === 'error' && (errorMessage = message);
          }
        };
      (child.stdout?.on('data', (chunk) => {
        stdoutBuffer += Buffer.from(chunk).toString('utf8');
        const lines = stdoutBuffer.split(/\r?\n/);
        ((stdoutBuffer = lines.pop() || ''), lines.forEach(handleLine));
      }),
        child.stderr?.on('data', (chunk) => {
          stderrBuffer += Buffer.from(chunk).toString('utf8');
        }),
        child.once('error', (error) =>
          settle(
            reject,
            createProcessStartError(pythonCommand, args, { cwd: appRoot }, error, 0x1),
          ),
        ),
        child.once('exit', (code, signal) => {
          if (stdoutBuffer) handleLine(stdoutBuffer);
          if (queue?.isCancelled?.(task)) {
            settle(reject, new MediaTaskCancelledError());
            return;
          }
          if (code === 0x0 && resultMessage) {
            settle(resolve, resultMessage);
            return;
          }
          const message =
            String(errorMessage?.message || '').trim() ||
            stderrBuffer.trim() ||
            'Sortformer exited with ' + (code ?? signal ?? 'unknown');
          settle(reject, new Error(message));
        }));
    })
  );
}
async function detectSpeechSegmentsWithSilence({
  durationSec: durationSec,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  options: options,
  queue: queue,
  sourceAbs: sourceAbs,
  task: task,
}) {
  queue.emitProgress(task, 0.12, 'Detecting voice segments', {
    stage: AUDIO_VOICE_ASR_STAGE.TRANSCRIBE,
  });
  const result = await queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), [
      '-hide_banner',
      '-i',
      sourceAbs,
      '-vn',
      '-af',
      'silencedetect=noise=' + options.noiseDb + 'dB:d=' + options.minSilenceSec,
      '-f',
      'null',
      '-',
    ]),
    output = Buffer.concat([
      result.stdout || Buffer.alloc(0x0),
      result.stderr || Buffer.alloc(0x0),
    ]).toString('utf8');
  return buildAudioVoiceSpeechSegments({
    silenceRanges: parseSilenceDetectRanges(output, durationSec),
    durationSec: durationSec,
    paddingMs: options.paddingMs,
  }).map((segment) => ({ ...segment, sourceText: '' }));
}
async function extractAsrAudio({
  asrAudioAbs: asrAudioAbs,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  queue: queue,
  sourceAbs: sourceAbs,
  task: task,
}) {
  (queue.emitProgress(task, 0.04, 'Preparing audio for subtitles', {
    stage: AUDIO_VOICE_ASR_STAGE.MODEL_PREPARE,
  }),
    await queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), [
      '-y',
      '-i',
      sourceAbs,
      '-map',
      '0:a:0',
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'pcm_s16le',
      asrAudioAbs,
    ]));
}
async function extractDoubaoAsrAudio({
  asrAudioAbs: asrAudioAbs,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  queue: queue,
  sourceAbs: sourceAbs,
  task: task,
}) {
  (queue.emitProgress(task, 0.04, 'Preparing audio for subtitles', {
    stage: AUDIO_VOICE_ASR_STAGE.MODEL_PREPARE,
  }),
    await queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), [
      '-y',
      '-i',
      sourceAbs,
      '-map',
      '0:a:0',
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '64k',
      asrAudioAbs,
    ]));
}
export function createAudioVoiceAnalyzeMediaTaskHandler({
  createOutputFilename: createOutputFilename,
  ffprobeHasAudio: ffprobeHasAudio,
  ffprobeVideoMeta: ffprobeVideoMeta,
  getDoubaoAsrConfig: getDoubaoAsrConfig,
  getBailianAsrConfig: getBailianAsrConfig,
  getFunasrModelRootDir: getFunasrModelRootDir,
  getPythonCertificateEnv: getPythonCertificateEnv,
  getSortformerModelRootDir: getSortformerModelRootDir,
  getOutputDir: getOutputDir,
  getRuntimeToolOrFallback: getRuntimeToolOrFallback,
  resolveMediaTaskSource: resolveMediaTaskSource,
  resolvePythonCommand: resolvePythonCommand,
  runDoubaoAsrTranscription: runDoubaoAsrTranscriptionImpl = runDoubaoAsrTranscription,
  runBailianAsrTranscription: runBailianAsrTranscription,
  runFunasrTranscription: runFunasrTranscription = runFunasrTranscriptionProcess,
  runSortformerDiarization: runSortformerDiarization = runSortformerDiarizationProcess,
  toOutputLocalPath: toOutputLocalPath,
  appRoot: appRoot = DEFAULT_APP_ROOT,
}) {
  const adapters = createAudioVoiceCloudAsrAdapters({
    getDoubaoAsrConfig: getDoubaoAsrConfig,
    getBailianAsrConfig: getBailianAsrConfig,
    runDoubaoAsrTranscription: runDoubaoAsrTranscriptionImpl,
    runBailianAsrTranscription: runBailianAsrTranscription,
  });
  return async (task, queue) => {
    const sourceAbs = resolveMediaTaskSource(task.payload.src),
      args = task.payload.args || {},
      silenceOptions = normalizeSilenceOptions(args),
      videoMeta = await ffprobeVideoMeta(queue, task, sourceAbs),
      hasVideoStream = !!(videoMeta.width && videoMeta.height);
    if (!(await ffprobeHasAudio(queue, task, sourceAbs))) {
      if (!hasVideoStream) throw new Error('Source media has no audio stream');
      throw new Error('Source video has no audio stream');
    }
    const durationSec = Math.max(0x0, Number(videoMeta.duration || 0x0));
    if (!(durationSec > 0x0)) throw new Error('Source media duration is unavailable');
    const analyzeDir = path.join(getOutputDir(), 'AudioVoiceAnalyze'),
      segmentsDir = path.join(getOutputDir(), 'AudioVoiceSegments');
    (mkdirSync(analyzeDir, { recursive: true }), mkdirSync(segmentsDir, { recursive: true }));
    const asrProvider = normalizeAsrProvider(args),
      adapter = Object.hasOwn(adapters, asrProvider) ? adapters[asrProvider] : null,
      usesFunasr = asrProvider === 'funasr';
    let fallbackReason = '',
      transcriptSegments = [],
      asrBaseUrl = '',
      funasrModelRoot = '',
      sortformerModelRoot = '',
      diarizationProvider = 'none';
    if (adapter || usesFunasr) {
      queue.emitProgress(task, 0.02, 'Preparing subtitle recognition model', {
        stage: usesFunasr
          ? AUDIO_VOICE_ASR_STAGE.MODEL_DOWNLOAD
          : AUDIO_VOICE_ASR_STAGE.MODEL_PREPARE,
      });
      const asrAudioFilename = createOutputFilename('source_asr', adapter ? 'mp3' : 'wav'),
        asrAudioAbs = path.join(analyzeDir, asrAudioFilename);
      await (adapter ? extractDoubaoAsrAudio : extractAsrAudio)({
        asrAudioAbs: asrAudioAbs,
        getRuntimeToolOrFallback: getRuntimeToolOrFallback,
        queue: queue,
        sourceAbs: sourceAbs,
        task: task,
      });
      if (adapter) {
        const credentials = adapter.getConfig?.() || {};
        asrBaseUrl = String(credentials.baseUrl || credentials.apiUrl || '').trim();
        const rawResult = await adapter.run({
            audioAbs: asrAudioAbs,
            credentials: credentials,
            durationSec: durationSec,
            queue: queue,
            task: task,
          }),
          normalizedSegments = mergeFunasrTranscriptSegments(
            adapter.normalize(rawResult, durationSec),
          );
        hasRecognizedTranscriptText(normalizedSegments)
          ? (transcriptSegments = normalizedSegments)
          : (fallbackReason = 'empty');
      } else {
        funasrModelRoot = String(getFunasrModelRootDir?.() || '').trim();
        if (!funasrModelRoot) throw new Error('FunASR model directory is unavailable');
        (mkdirSync(funasrModelRoot, { recursive: true }),
          (diarizationProvider = normalizeDiarizationProvider(args)));
        const rawResult = await runFunasrTranscription({
            appRoot: appRoot,
            audioAbs: asrAudioAbs,
            downloadModelIfMissing: args.downloadModelIfMissing !== false,
            durationSec: durationSec,
            engine: normalizeFunasrEngine(args.engine),
            modelRoot: funasrModelRoot,
            pythonCommand: resolvePythonCommand?.(),
            certificateEnv: getPythonCertificateEnv?.() || {},
            queue: queue,
            task: task,
          }),
          normalizedSegments = normalizeFunasrTranscriptSegments(rawResult, durationSec);
        let assignedSegments = stripTranscriptSpeakerLabels(normalizedSegments);
        if (diarizationProvider === 'sortformer' && normalizedSegments.length) {
          sortformerModelRoot = String(
            getSortformerModelRootDir?.() || resolveSortformerModelRootFromFunasrRoot(funasrModelRoot),
          ).trim();
          if (!sortformerModelRoot) throw new Error('Sortformer model directory is unavailable');
          (mkdirSync(sortformerModelRoot, { recursive: true }),
            queue.emitProgress(task, 0.52, 'Preparing speaker separation model', {
              stage: AUDIO_VOICE_ASR_STAGE.DIARIZATION_MODEL_DOWNLOAD,
            }));
          const diarizationResult = await runSortformerDiarization({
            appRoot: appRoot,
            audioAbs: asrAudioAbs,
            downloadModelIfMissing: args.downloadModelIfMissing !== false,
            durationSec: durationSec,
            engine: normalizeFunasrEngine(args.engine),
            modelRoot: sortformerModelRoot,
            pythonCommand: resolvePythonCommand?.(),
            certificateEnv: getPythonCertificateEnv?.() || {},
            queue: queue,
            task: task,
          });
          assignedSegments = assignDiarizationSpeakersToTranscriptSegments(
            normalizedSegments,
            normalizeDiarizationSegments(diarizationResult, durationSec),
          );
        }
        const mergedSegments = mergeFunasrTranscriptSegments(assignedSegments);
        hasRecognizedTranscriptText(mergedSegments)
          ? (transcriptSegments = mergedSegments)
          : (fallbackReason = 'empty');
      }
    }
    !transcriptSegments.length &&
      (transcriptSegments = await detectSpeechSegmentsWithSilence({
        durationSec: durationSec,
        getRuntimeToolOrFallback: getRuntimeToolOrFallback,
        options: silenceOptions,
        queue: queue,
        sourceAbs: sourceAbs,
        task: task,
      }));
    const sourceAudioFilename = createOutputFilename('source_audio', 'mp3'),
      sourceAudioAbs = path.join(analyzeDir, sourceAudioFilename),
      sourceAudioLocalPath = toOutputLocalPath('AudioVoiceAnalyze', sourceAudioFilename);
    (queue.emitProgress(task, 0.56, 'Extracting source audio', {
      stage: AUDIO_VOICE_ASR_STAGE.SLICE,
    }),
      await queue.runProcess(task, getRuntimeToolOrFallback('ffmpeg'), [
        '-y',
        '-i',
        sourceAbs,
        '-map',
        '0:a:0',
        '-vn',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '192k',
        sourceAudioAbs,
      ]));
    const segments = [];
    for (let index = 0x0; index < transcriptSegments.length; index += 0x1) {
      const segment = transcriptSegments[index],
        segmentFilename = createOutputFilename('segment_' + (index + 0x1), 'mp3'),
        segmentAbs = path.join(segmentsDir, segmentFilename),
        segmentLocalPath = toOutputLocalPath('AudioVoiceSegments', segmentFilename);
      (queue.emitProgress(
        task,
        Math.min(0.95, 0.62 + (index / Math.max(0x1, transcriptSegments.length)) * 0.33),
        'Cutting sentence audio',
        { stage: AUDIO_VOICE_ASR_STAGE.SLICE },
      ),
        await queue.runProcess(
          task,
          getRuntimeToolOrFallback('ffmpeg'),
          buildAudioVoiceSegmentCutArgs({
            sourceAudioAbs: sourceAudioAbs,
            outAbs: segmentAbs,
            startMs: segment.startMs,
            endMs: segment.endMs,
          }),
        ),
        segments.push({
          id: 'audio-voice-segment-' + (index + 0x1),
          startMs: segment.startMs,
          endMs: segment.endMs,
          sourceText: String(segment.sourceText || ''),
          ...(segment.speaker ? { speaker: segment.speaker } : {}),
          sourceAudioLocalPath: segmentLocalPath,
          sourceAudioUrl: '/' + segmentLocalPath,
        }));
    }
    return {
      success: true,
      durationSec: durationSec,
      sourceAudio: { localPath: sourceAudioLocalPath, url: '/' + sourceAudioLocalPath },
      asr: {
        provider: adapter || usesFunasr ? asrProvider : 'silence',
        baseUrl: asrBaseUrl,
        modelRoot: usesFunasr ? funasrModelRoot : '',
        diarizationProvider: diarizationProvider,
        diarizationModelRoot: sortformerModelRoot,
        fallbackReason: fallbackReason,
      },
      segments: segments,
    };
  };
}
export function createFunasrModelPrepareMediaTaskHandler({
  getFunasrModelRootDir: getFunasrModelRootDir,
  getPythonCertificateEnv: getPythonCertificateEnv,
  resolvePythonCommand: resolvePythonCommand,
  runFunasrTranscription: runFunasrTranscription = runFunasrTranscriptionProcess,
  appRoot: appRoot = DEFAULT_APP_ROOT,
} = {}) {
  return async (task, queue) => {
    const args = task?.payload?.args || {},
      engine = normalizeFunasrEngine(args.engine),
      modelRoot = String(getFunasrModelRootDir?.() || '').trim();
    if (!modelRoot) throw new Error('FunASR model directory is unavailable');
    (mkdirSync(modelRoot, { recursive: true }),
      queue?.emitProgress?.(task, 0.01, 'Preparing subtitle recognition model', {
        stage: AUDIO_VOICE_ASR_STAGE.MODEL_DOWNLOAD,
      }));
    const result = await runFunasrTranscription({
      appRoot: appRoot,
      downloadModelIfMissing: args.downloadModelIfMissing !== false,
      engine: engine,
      modelRoot: modelRoot,
      prepareOnly: true,
      pythonCommand: resolvePythonCommand?.(),
      certificateEnv: getPythonCertificateEnv?.() || {},
      queue: queue,
      task: task,
    });
    return {
      success: true,
      provider: 'funasr',
      engine: engine,
      ready: true,
      prepared: result?.prepared !== false,
    };
  };
}
export function createAudioVoiceModelPrepareMediaTaskHandler({
  getFunasrModelRootDir: getFunasrModelRootDir,
  getPythonCertificateEnv: getPythonCertificateEnv,
  getSortformerModelRootDir: getSortformerModelRootDir,
  resolvePythonCommand: resolvePythonCommand,
  runFunasrTranscription: runFunasrTranscription = runFunasrTranscriptionProcess,
  runSortformerDiarization: runSortformerDiarization = runSortformerDiarizationProcess,
  appRoot: appRoot = DEFAULT_APP_ROOT,
} = {}) {
  return async (task, queue) => {
    const args = task?.payload?.args || {},
      engine = normalizeFunasrEngine(args.engine),
      funasrModelRoot = String(getFunasrModelRootDir?.() || '').trim();
    if (!funasrModelRoot) throw new Error('FunASR model directory is unavailable');
    mkdirSync(funasrModelRoot, { recursive: true });
    const sortformerModelRoot = String(
      getSortformerModelRootDir?.() || resolveSortformerModelRootFromFunasrRoot(funasrModelRoot),
    ).trim();
    if (!sortformerModelRoot) throw new Error('Sortformer model directory is unavailable');
    (mkdirSync(sortformerModelRoot, { recursive: true }),
      queue?.emitProgress?.(task, 0.01, 'Preparing subtitle recognition model', {
        stage: AUDIO_VOICE_ASR_STAGE.MODEL_DOWNLOAD,
      }),
      await runFunasrTranscription({
        appRoot: appRoot,
        downloadModelIfMissing: args.downloadModelIfMissing !== false,
        engine: engine,
        modelRoot: funasrModelRoot,
        prepareOnly: true,
        pythonCommand: resolvePythonCommand?.(),
        certificateEnv: getPythonCertificateEnv?.() || {},
        queue: queue,
        task: task,
      }),
      queue?.emitProgress?.(task, 0.52, 'Preparing speaker separation model', {
        stage: AUDIO_VOICE_ASR_STAGE.DIARIZATION_MODEL_DOWNLOAD,
      }));
    const result = await runSortformerDiarization({
      appRoot: appRoot,
      downloadModelIfMissing: args.downloadModelIfMissing !== false,
      engine: engine,
      modelRoot: sortformerModelRoot,
      prepareOnly: true,
      pythonCommand: resolvePythonCommand?.(),
      certificateEnv: getPythonCertificateEnv?.() || {},
      queue: queue,
      task: task,
    });
    return (
      queue?.emitProgress?.(task, 0x1, 'Audio voice models are ready', {
        stage: AUDIO_VOICE_ASR_STAGE.DIARIZE,
      }),
      {
        success: true,
        provider: 'audioVoice',
        asrProvider: 'funasr',
        diarizationProvider: 'sortformer',
        engine: engine,
        ready: true,
        funasrModelRoot: funasrModelRoot,
        sortformerModelRoot: sortformerModelRoot,
        prepared: result?.prepared !== false,
      }
    );
  };
}
export function createFunasrRuntimeCheckMediaTaskHandler({
  getFunasrModelRootDir: getFunasrModelRootDir,
  getPythonCertificateEnv: getPythonCertificateEnv,
  resolvePythonCommand: resolvePythonCommand,
  runFunasrTranscription: runFunasrTranscription = runFunasrTranscriptionProcess,
  appRoot: appRoot = DEFAULT_APP_ROOT,
} = {}) {
  return async (task, queue) => {
    const args = task?.payload?.args || {},
      engine = normalizeFunasrEngine(args.engine),
      modelRoot = String(getFunasrModelRootDir?.() || '').trim();
    if (!modelRoot) throw new Error('FunASR model directory is unavailable');
    (mkdirSync(modelRoot, { recursive: true }),
      queue?.emitProgress?.(task, 0.01, 'Checking recognition runtime', {
        stage: AUDIO_VOICE_ASR_STAGE.MODEL_PREPARE,
      }));
    const result = await runFunasrTranscription({
      appRoot: appRoot,
      checkRuntimeOnly: true,
      downloadModelIfMissing: false,
      engine: engine,
      modelRoot: modelRoot,
      pythonCommand: resolvePythonCommand?.(),
      certificateEnv: getPythonCertificateEnv?.() || {},
      queue: queue,
      task: task,
    });
    return {
      success: true,
      provider: 'funasr',
      engine: engine,
      available: result?.available !== false,
      code: String(result?.code || ''),
      message: String(result?.message || ''),
      device: String(result?.device || ''),
    };
  };
}
export function createFunasrGpuTorchInstallMediaTaskHandler({
  getFunasrModelRootDir: getFunasrModelRootDir,
  getPythonCertificateEnv: getPythonCertificateEnv,
  resolvePythonCommand: resolvePythonCommand,
  runPipInstall: runPipInstall = runPipInstallProcess,
  runFunasrTranscription: runFunasrTranscription = runFunasrTranscriptionProcess,
  torchIndexUrl: torchIndexUrl = DEFAULT_FUNASR_GPU_TORCH_INDEX_URL,
  torchPackages: torchPackages = DEFAULT_FUNASR_GPU_TORCH_PACKAGES,
  appRoot: appRoot = DEFAULT_APP_ROOT,
} = {}) {
  return async (task, queue) => {
    const args = task?.payload?.args || {},
      modelRoot = String(getFunasrModelRootDir?.() || '').trim();
    if (!modelRoot) throw new Error('FunASR model directory is unavailable');
    mkdirSync(modelRoot, { recursive: true });
    const pythonCommand = resolvePythonCommand?.();
    if (!pythonCommand) throw new Error('Python runtime is unavailable');
    const gpuName = await detectNvidiaGpuNameForInstall({ queue: queue, task: task }),
      pipArgs = buildFunasrGpuTorchInstallArgs({
        indexUrl: args.torchIndexUrl || torchIndexUrl,
        packages: Array.isArray(args.torchPackages) ? args.torchPackages : torchPackages,
      });
    (queue?.emitProgress?.(task, 0.12, 'Installing GPU acceleration component', {
      stage: FUNASR_GPU_TORCH_STAGE.INSTALL,
    }),
      await runPipInstall({
        appRoot: appRoot,
        env: buildFunasrEnv(modelRoot, process.env, getPythonCertificateEnv?.() || {}),
        pipArgs: pipArgs,
        pythonCommand: pythonCommand,
        queue: queue,
        task: task,
      }),
      queue?.emitProgress?.(task, 0.9, 'Verifying GPU acceleration', {
        stage: FUNASR_GPU_TORCH_STAGE.VERIFY,
      }));
    const result = await runFunasrTranscription({
      appRoot: appRoot,
      checkRuntimeOnly: true,
      downloadModelIfMissing: false,
      engine: 'gpu',
      modelRoot: modelRoot,
      pythonCommand: pythonCommand,
      queue: queue,
      task: task,
    });
    if (result?.available === false)
      throw new Error(String(result?.message || 'GPU acceleration is still unavailable'));
    return {
      success: true,
      provider: 'funasr',
      engine: 'gpu',
      gpuName: gpuName,
      installed: true,
      verified: true,
      device: String(result?.device || 'cuda:0'),
      torchVersion: String(result?.torchVersion || ''),
      torchCuda: String(result?.torchCuda || ''),
    };
  };
}

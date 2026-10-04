import { generateAudio, resumeRunningHubAudioTask } from '../../../api/aiAudioApi.js';
import { runLocalMediaClipExport } from '../../../api/localMediaTaskApi.js';
import { buildAudioGenerationResultPatch } from '../../components/audio-node/audioGenerationResultRenderer.js';
import { buildAudioWorkflowItems } from '../../components/audio-node/audioModelMenuHelpers.js';
import { getAudioWorkflowSlots } from '../../components/audio-node/audioWorkflowRefSlots.js';
import { buildAudioWorkflowSelectionPatch } from '../../components/audio-node/audioWorkflowSelectionPatch.js';
import { submitTask } from '../../core/generationTaskRuntime.js';
import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../manifests/index.js';
import { VOLCENGINE_DOUBAO_AUDIO_GENERATION_MODEL_ID } from '../../manifests/audio/modelApi/volcengineAudioModelApiManifests.js';
import { saveRemoteAudioLocallyDetailed } from '../../services/projectService.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
export const STORY_CHARACTER_VOICE_DEFAULT_MODEL_ID = VOLCENGINE_DOUBAO_AUDIO_GENERATION_MODEL_ID;
export const STORY_CHARACTER_VOICE_FALLBACK_LINE = '你好，我已经准备好了，接下来我会保持冷静。';
export const STORY_CHARACTER_VOICE_SAMPLE_MIN_SECONDS = 0x5;
export const STORY_CHARACTER_VOICE_SAMPLE_MAX_SECONDS = 0x5;
export const STORY_CHARACTER_VOICE_SAMPLE_MAX_CHARACTERS = 0x15;
const STORY_CHARACTER_VOICE_SPEECH_UNITS_PER_SECOND = 0x4,
  STORY_CHARACTER_VOICE_SAMPLE_MIN_UNITS =
    STORY_CHARACTER_VOICE_SAMPLE_MIN_SECONDS * STORY_CHARACTER_VOICE_SPEECH_UNITS_PER_SECOND,
  STORY_CHARACTER_VOICE_SAMPLE_MAX_UNITS =
    STORY_CHARACTER_VOICE_SAMPLE_MAX_SECONDS * STORY_CHARACTER_VOICE_SPEECH_UNITS_PER_SECOND;
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function createStoryCharacterVoicePreviewGuard() {
  let item = 0x0,
    key = null;
  return {
    begin({ assetId: assetId = '', source: source = '', audioEl: audioEl = null } = {}) {
      return (
        (key = Object['freeze']({
          generation: ++item,
          assetId: normalizeText(assetId),
          source: normalizeText(source),
          audioEl: audioEl,
        })),
        key
      );
    },
    isCurrent(index) {
      return Boolean(
        index &&
        key &&
        index['generation'] === key['generation'] &&
        index['assetId'] === key['assetId'] &&
        index['source'] === key['source'] &&
        index['audioEl'] === key['audioEl'],
      );
    },
    invalidate() {
      ((item += 0x1), (key = null));
    },
  };
}
function uniqueText(list = []) {
  return [...new Set(list['map'](normalizeText)['filter'](Boolean))];
}
function countStoryCharacterVoiceSpeechUnits(result) {
  return [...normalizeText(result)['replace'](/[\s，。！？!?；;：:、…“”"'‘’（）()《》]/gu, '')]['length'];
}
export function estimateStoryCharacterVoiceDurationSec(options) {
  const countStoryCharacterVoiceSpeechUnits2 = countStoryCharacterVoiceSpeechUnits(options);
  return Number(
    (countStoryCharacterVoiceSpeechUnits2 / STORY_CHARACTER_VOICE_SPEECH_UNITS_PER_SECOND)['toFixed'](0x1),
  );
}
function ensureAuditionSentence(target) {
  const text = normalizeText(target)['replace'](/^[，。！？!?；;：:、\s]+/u, '');
  if (!text || /[。！？!?…]$/u['test'](text)) return text;
  return text + '。';
}
function truncateStoryCharacterVoiceSample(next) {
  const list2 = [];
  let current = 0x0;
  for (const entry of [...normalizeText(next)]) {
    if (list2['length'] >= STORY_CHARACTER_VOICE_SAMPLE_MAX_CHARACTERS - 0x1) break;
    const record = !/[\s，。！？!?；;：:、…“”"'‘’（）()《》]/u['test'](entry);
    if (record && current >= STORY_CHARACTER_VOICE_SAMPLE_MAX_UNITS) break;
    list2['push'](entry);
    if (record) current += 0x1;
  }
  return ensureAuditionSentence(list2['join']('')['replace'](/[，、；;：:\s]+$/u, ''));
}
function buildStoryCharacterVoiceSampleFromCandidates(list3 = []) {
  const list4 = [];
  let handle = 0x0;
  for (const state of uniqueText(list3)) {
    if (handle >= STORY_CHARACTER_VOICE_SAMPLE_MIN_UNITS) break;
    const auditionSentence = ensureAuditionSentence(state);
    if (!auditionSentence) continue;
    (list4['push'](auditionSentence), (handle += countStoryCharacterVoiceSpeechUnits(auditionSentence)));
  }
  return (
    handle < STORY_CHARACTER_VOICE_SAMPLE_MIN_UNITS && list4['push'](STORY_CHARACTER_VOICE_FALLBACK_LINE),
    truncateStoryCharacterVoiceSample(list4['join']('\x20'))
  );
}
function escapeRegExp(config) {
  return String(config || '')['replace'](/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function stripDialogueSpeaker(scope, input) {
  const text2 = normalizeText(scope),
    text3 = normalizeText(input);
  if (!text2 || !text3) return '';
  const escapeRegExp2 = escapeRegExp(text3),
    output = text2['match'](
      new RegExp('(?:^|[\\s，,。！？!?；;])@?' + escapeRegExp2 + '\\s*[：:]\\s*[“"\'‘]?([^\\n”"\'’]+)', 'u'),
    );
  if (output?.[0x1]) return normalizeText(output[0x1])['replace'](/[”"'’]+$/u, '');
  return '';
}
function collectShotDialogues(value2, value3) {
  const value4 = [];
  return (
    (Array['isArray'](value2) ? value2 : [])['forEach']((value5) => {
      (Array['isArray'](value5?.['clips']) ? value5['clips'] : [])['forEach']((value6) => {
        (Array['isArray'](value6?.['shots']) ? value6['shots'] : [])['forEach']((value7) => {
          const stripDialogueSpeaker2 = stripDialogueSpeaker(value7?.['dialogue'], value3);
          if (stripDialogueSpeaker2) value4['push'](stripDialogueSpeaker2);
        });
        const stripDialogueSpeaker3 = stripDialogueSpeaker(value6?.['dialogue'], value3);
        if (stripDialogueSpeaker3) value4['push'](stripDialogueSpeaker3);
      });
    }),
    value4
  );
}
function collectChapterDialogues(value8, value9) {
  const args = Array['isArray'](value8?.['chapters']) ? value8['chapters'] : [],
    value10 = [
      ...args['map']((value11) => value11?.['content']),
      value8?.['plotScript'],
      value8?.['narrationScript'],
    ],
    value12 = [];
  return (
    value10['forEach']((value13) => {
      String(value13 || '')
        ['split'](/\r?\n/u)
        ['forEach']((value14) => {
          const stripDialogueSpeaker4 = stripDialogueSpeaker(value14, value9);
          if (stripDialogueSpeaker4) value12['push'](stripDialogueSpeaker4);
        });
    }),
    value12
  );
}
function collectStoryCharacterDialogueCandidates({
  characterName: characterName = '',
  project: project = {},
  episodes: episodes = [],
} = {}) {
  return uniqueText([
    ...collectShotDialogues(episodes, characterName),
    ...collectChapterDialogues(project, characterName),
  ]);
}
export function extractStoryCharacterDialogue({
  characterName: characterName = '',
  project: project = {},
  episodes: episodes = [],
} = {}) {
  const storyCharacterDialogueCandidates = collectStoryCharacterDialogueCandidates({
    characterName: characterName,
    project: project,
    episodes: episodes,
  });
  return storyCharacterDialogueCandidates[0x0] || '';
}
export function getStoryCharacterVoiceSampleText(options2 = {}) {
  return buildStoryCharacterVoiceSampleFromCandidates(collectStoryCharacterDialogueCandidates(options2));
}
export function normalizeStoryCharacterVoiceReference(options3 = {}) {
  const args2 = options3 && typeof options3 === 'object' && !Array['isArray'](options3) ? options3 : {},
    localPath = normalizeLocalPath(args2['localPath'] || args2['path'] || ''),
    text4 = normalizeText(
      args2['audioUrl'] || args2['displayUrl'] || args2['url'] || localPathToUrl(localPath),
    );
  if (!text4 && !localPath) return null;
  return {
    source: args2['source'] === 'generated' ? 'generated' : 'upload',
    audioUrl: text4 || localPathToUrl(localPath),
    localPath: localPath,
    fileName: normalizeText(args2['fileName'] || args2['name']),
    modelId: normalizeText(args2['modelId']),
    modelLabel: normalizeText(args2['modelLabel']),
    sampleText: normalizeText(args2['sampleText']),
    voiceDescription: normalizeText(args2['voiceDescription']),
    generationParams:
      args2['generationParams'] && typeof args2['generationParams'] === 'object'
        ? { ...args2['generationParams'] }
        : {},
    updatedAt: Number(args2['updatedAt']) || Date['now'](),
  };
}
export const STORY_CHARACTER_VOICE_HISTORY_LIMIT = 0xc;
function getStoryCharacterVoiceReferenceKey(value15 = null) {
  const storyCharacterVoiceReference = normalizeStoryCharacterVoiceReference(value15);
  return normalizeText(
    storyCharacterVoiceReference?.['localPath'] || storyCharacterVoiceReference?.['audioUrl'],
  );
}
export function normalizeStoryCharacterVoiceHistory(list5 = []) {
  const value16 = Array['isArray'](list5) ? list5 : [],
    map = new Set(),
    list6 = [];
  return (
    value16['forEach']((value17) => {
      const storyCharacterVoiceReference2 = normalizeStoryCharacterVoiceReference(value17),
        storyCharacterVoiceReferenceKey = getStoryCharacterVoiceReferenceKey(storyCharacterVoiceReference2);
      if (
        !storyCharacterVoiceReference2 ||
        !storyCharacterVoiceReferenceKey ||
        map['has'](storyCharacterVoiceReferenceKey)
      )
        return;
      (map['add'](storyCharacterVoiceReferenceKey), list6['push'](storyCharacterVoiceReference2));
    }),
    list6['slice'](0x0, STORY_CHARACTER_VOICE_HISTORY_LIMIT)
  );
}
export function replaceStoryCharacterVoiceReference(options4 = {}, value18 = {}) {
  const storyCharacterVoiceReference3 = normalizeStoryCharacterVoiceReference(value18);
  if (!storyCharacterVoiceReference3) return null;
  const args3 = normalizeStoryCharacterVoiceReference(options4['voiceReference']),
    storyCharacterVoiceReferenceKey2 = getStoryCharacterVoiceReferenceKey(storyCharacterVoiceReference3),
    storyCharacterVoiceHistory = normalizeStoryCharacterVoiceHistory([
      ...(args3 ? [args3] : []),
      ...(Array['isArray'](options4['voiceReferenceHistory']) ? options4['voiceReferenceHistory'] : []),
    ])['filter'](
      (value19) => getStoryCharacterVoiceReferenceKey(value19) !== storyCharacterVoiceReferenceKey2,
    );
  return (
    (options4['voiceReference'] = storyCharacterVoiceReference3),
    (options4['voiceReferenceHistory'] = storyCharacterVoiceHistory),
    storyCharacterVoiceReference3
  );
}
export function clearStoryCharacterVoiceReference(options5 = {}) {
  const args4 = normalizeStoryCharacterVoiceReference(options5['voiceReference']);
  return (
    (options5['voiceReferenceHistory'] = normalizeStoryCharacterVoiceHistory([
      ...(args4 ? [args4] : []),
      ...(Array['isArray'](options5['voiceReferenceHistory']) ? options5['voiceReferenceHistory'] : []),
    ])),
    (options5['voiceReference'] = null),
    args4
  );
}
export function restoreStoryCharacterVoiceHistoryReference(options6 = {}, value20 = 0x0) {
  const args5 = normalizeStoryCharacterVoiceHistory(options6['voiceReferenceHistory']),
    value21 = Math['trunc'](Number(value20)),
    enabled = args5[value21];
  if (!enabled) return null;
  const args6 = normalizeStoryCharacterVoiceReference(options6['voiceReference']);
  return (
    (options6['voiceReference'] = enabled),
    (options6['voiceReferenceHistory'] = normalizeStoryCharacterVoiceHistory([
      ...(args6 ? [args6] : []),
      ...args5['filter']((value22, value23) => value23 !== value21),
    ])['filter'](
      (value24) =>
        getStoryCharacterVoiceReferenceKey(value24) !== getStoryCharacterVoiceReferenceKey(enabled),
    )),
    enabled
  );
}
export function hasStoryCharacterVoiceReference(options7 = {}) {
  return Boolean(normalizeStoryCharacterVoiceReference(options7?.['voiceReference']));
}
export function getStoryCharacterVoiceWorkflowItems() {
  return buildAudioWorkflowItems();
}
export function getStoryCharacterVoiceWorkflow(value25 = '') {
  const storyCharacterVoiceWorkflowItems = getStoryCharacterVoiceWorkflowItems();
  return (
    storyCharacterVoiceWorkflowItems['find']((value26) => value26['key'] === normalizeText(value25)) ||
    storyCharacterVoiceWorkflowItems['find'](
      (value27) => value27['key'] === STORY_CHARACTER_VOICE_DEFAULT_MODEL_ID,
    ) ||
    storyCharacterVoiceWorkflowItems[0x0] ||
    null
  );
}
export function createStoryCharacterVoiceEditorDraft({ asset: asset = {}, data: data = {} } = {}) {
  const args7 = normalizeStoryCharacterVoiceReference(asset?.['voiceReference']),
    storyCharacterVoiceWorkflow = getStoryCharacterVoiceWorkflow(
      args7?.['modelId'] || STORY_CHARACTER_VOICE_DEFAULT_MODEL_ID,
    ),
    args8 = {
      model: storyCharacterVoiceWorkflow?.['key'] || STORY_CHARACTER_VOICE_DEFAULT_MODEL_ID,
      audioWorkflowKey: storyCharacterVoiceWorkflow?.['key'] || STORY_CHARACTER_VOICE_DEFAULT_MODEL_ID,
      provider: storyCharacterVoiceWorkflow?.['provider'] || 'volcengine-speech',
      generationParams: args7?.['generationParams'] || {},
      generationParamsByModel:
        args7?.['modelId'] && args7?.['generationParams']
          ? { [args7['modelId']]: { ...args7['generationParams'] } }
          : {},
    },
    value28 = storyCharacterVoiceWorkflow
      ? {
          ...args8,
          ...buildAudioWorkflowSelectionPatch({ nodeData: args8, workflow: storyCharacterVoiceWorkflow }),
        }
      : args8;
  return {
    assetId: normalizeText(asset?.['id']),
    sampleText: buildStoryCharacterVoiceSampleFromCandidates([
      args7?.['sampleText'],
      ...collectStoryCharacterDialogueCandidates({
        characterName: asset?.['name'],
        project: data?.['project'],
        episodes: data?.['episodes'],
      }),
    ]),
    voiceDescription:
      args7?.['voiceDescription'] ||
      normalizeText(asset?.['voiceDescription']) ||
      [normalizeText(asset?.['role']), normalizeText(asset?.['description'])]
        ['filter'](Boolean)
        ['join']('；'),
    nodeData: value28,
    isGenerating: ![],
    error: '',
  };
}
export function selectStoryCharacterVoiceWorkflow(args9 = {}, value29 = '') {
  const storyCharacterVoiceWorkflow2 = getStoryCharacterVoiceWorkflow(value29);
  if (!storyCharacterVoiceWorkflow2) return args9;
  return {
    ...args9,
    nodeData: {
      ...(args9['nodeData'] || {}),
      ...buildAudioWorkflowSelectionPatch({
        nodeData: args9['nodeData'] || {},
        workflow: storyCharacterVoiceWorkflow2,
      }),
    },
    error: '',
  };
}
function buildVoicePrompt({
  asset: asset2,
  sampleText: sampleText,
  voiceDescription: voiceDescription,
  acceptsAudio: acceptsAudio,
}) {
  const text5 = normalizeText(sampleText) || STORY_CHARACTER_VOICE_FALLBACK_LINE;
  if (!acceptsAudio) return text5;
  const text6 = normalizeText(voiceDescription || asset2?.['description']);
  return [
    '任务：生成单一角色的干净对白参考音频。',
    '音频中只保留一个人的声音，不要背景音乐、环境音效、旁白或混响。',
    '角色：' + (normalizeText(asset2?.['name']) || '角色') + '。',
    text6
      ? '声音设定（严格遵循）：' + text6 + '。'
      : '声音设定：根据角色身份设计自然、有辨识度且可长期复用的音色。',
    '演绎要求：保持音色稳定，发音自然，情绪和语气符合角色设定。',
    '台词（只说引号内的内容）：“' + text5 + '”',
  ]
    ['filter'](Boolean)
    ['join']('\x0a');
}
export function buildStoryCharacterVoicePayload({
  asset: asset = {},
  editor: editor = {},
  installId: installId = '',
} = {}) {
  const event = getStoryCharacterVoiceWorkflow(editor?.['nodeData']?.['model']);
  if (!event) throw new Error('当前没有可用的音频模型。');
  const modelExecution = resolveModelExecution(event['key'], { providerHint: event['provider'] });
  if (!modelExecution?.['modelManifest'] || !modelExecution?.['executionManifest'])
    throw new Error('音频模型缺少执行清单：' + event['key']);
  const value30 = modelExecution['modelManifest']['inputSlots'] || {},
    count = Number(value30?.['maxByKind']?.['audio'] || 0x0),
    value31 = Number['isFinite'](count) && count > 0x0,
    count2 = Number(value30?.['minByKind']?.['audio'] || 0x0),
    value32 = Number['isFinite'](count2) && count2 > 0x0,
    storyCharacterVoiceReference4 = normalizeStoryCharacterVoiceReference(asset?.['voiceReference']),
    text7 = normalizeText(
      storyCharacterVoiceReference4?.['audioUrl'] ||
        localPathToUrl(storyCharacterVoiceReference4?.['localPath']),
    ),
    audioWorkflowSlots = getAudioWorkflowSlots(event['key'])[0x0]?.['slot'] || 'audioRef',
    sanitizeModelUiSchemaParams2 = sanitizeModelUiSchemaParams(
      event['key'],
      editor?.['nodeData']?.['generationParams'] || {},
      { includeDefaults: !![] },
    ),
    truncateStoryCharacterVoiceSample2 = truncateStoryCharacterVoiceSample(
      normalizeText(editor?.['sampleText']) || STORY_CHARACTER_VOICE_FALLBACK_LINE,
    );
  return {
    workflow: event,
    payload: {
      nodeId: 'story-character-voice-' + (normalizeText(asset?.['id']) || 'asset'),
      provider: event['provider'],
      adapterType: event['adapterType'],
      audioWorkflowKey: event['key'],
      audioWorkflowLabel: event['label'],
      executionId: event['executionId'],
      prompt: buildVoicePrompt({
        asset: asset,
        sampleText: truncateStoryCharacterVoiceSample2,
        voiceDescription: editor?.['voiceDescription'],
        acceptsAudio: value31,
      }),
      textInputs: [truncateStoryCharacterVoiceSample2],
      audioRefs:
        value32 && text7
          ? [
              {
                refSlot: audioWorkflowSlots,
                url: text7,
                localPath: storyCharacterVoiceReference4?.['localPath'] || '',
                sourceType: 'story-character-voice',
              },
            ]
          : [],
      videoRefs: [],
      generationParams: sanitizeModelUiSchemaParams2,
      installId: normalizeText(installId),
    },
  };
}
function createTaskStore(value33) {
  const args10 = { nodes: { [value33]: { id: value33 } } };
  return {
    getState: () => args10,
    getStateRaw: () => args10,
    updateNodeData(value34, args11 = {}) {
      if (!args10['nodes'][value34]) args10['nodes'][value34] = { id: value34 };
      args10['nodes'][value34] = { ...args10['nodes'][value34], ...args11 };
    },
  };
}
async function persistGeneratedAudio(value35) {
  const text8 = normalizeText(value35);
  if (!text8) return { localPath: '', audioUrl: '' };
  const localPath2 = normalizeLocalPath(text8),
    args12 = localPath2
      ? { localPath: localPath2, audioUrl: localPathToUrl(localPath2) }
      : await saveRemoteAudioLocallyDetailed(text8),
    localPath3 = normalizeLocalPath(
      args12?.['localPath'] || args12?.['originalLocalPath'] || pickResultLocalPath(args12),
    );
  if (!localPath3) throw new Error('生成音频保存到本地失败。');
  return {
    ...(args12 && typeof args12 === 'object' ? args12 : {}),
    localPath: localPath3,
    audioUrl: localPathToUrl(localPath3),
  };
}
export async function trimStoryCharacterVoiceAudio(
  args13 = {},
  { runClipExport: runClipExport = runLocalMediaClipExport } = {},
) {
  const localPath4 = normalizeLocalPath(
    args13?.['localPath'] || args13?.['originalLocalPath'] || pickResultLocalPath(args13),
  );
  if (!localPath4) throw new Error('参考人声音频缺少可裁剪的本地文件。');
  const args14 = await runClipExport(
      {
        outputType: 'audio',
        electronPayload: {
          kind: 'audioCut',
          src: localPath4,
          args: { start: 0x0, end: STORY_CHARACTER_VOICE_SAMPLE_MAX_SECONDS },
        },
      },
      { timeout: 0x927c0 },
    ),
    localPath5 = normalizeLocalPath(args14?.['localPath'] || args14?.['path'] || pickResultLocalPath(args14));
  if (!localPath5) throw new Error('参考人声音频裁剪到\x205\x20秒失败。');
  return {
    ...args13,
    ...(args14 && typeof args14 === 'object' ? args14 : {}),
    localPath: localPath5,
    audioUrl: localPathToUrl(localPath5),
    fileName: normalizeText(args14?.['fileName'] || args14?.['filename'] || args13?.['fileName']),
  };
}
export async function generateStoryCharacterVoice({
  asset: asset = {},
  editor: editor = {},
  installId: installId = '',
  abortController: abortController = new AbortController(),
  onTaskMeta: onTaskMeta = null,
} = {}) {
  const { workflow: workflow, payload: payload2 } = buildStoryCharacterVoicePayload({
      asset: asset,
      editor: editor,
      installId: installId,
    }),
    value36 = payload2['nodeId'],
    taskStore = createTaskStore(value36),
    value37 = Date['now'](),
    submitTask2 = await submitTask(
      {
        sourceNodeId: value36,
        targetNodeId: value36,
        trigger: 'story-character-voice',
        taskType: 'audio-generation',
        provider: payload2['provider'],
        adapterType: payload2['adapterType'],
        modelId: payload2['audioWorkflowKey'],
        executionId: payload2['executionId'],
        payload: payload2,
        async: workflow['async'] === !![],
        cancellable: workflow['cancellable'] === !![],
        resumable: workflow['adapterType'] === 'workflow' || workflow['async'] === !![],
        submit: async (value38, value39) =>
          generateAudio(payload2, {
            signal: value39['signal'] || abortController['signal'],
            runningHubWorkflowQueueLease: value39['runningHubWorkflowQueueLease'],
            onTaskId: (value40) => {
              (value39['onTaskId'](value40),
                onTaskMeta?.({ taskId: value40, payload: payload2, workflow: workflow }));
            },
            onTaskMeta: ({ taskId: taskId2 }) => {
              (value39['onTaskId'](taskId2),
                onTaskMeta?.({ taskId: taskId2, payload: payload2, workflow: workflow }));
            },
          }),
        resultBuilder: async (value41, value42) => {
          const audioGenerationResultPatch = await buildAudioGenerationResultPatch(value41, {
            startedAt: value42['startedAt'] || value37,
            persistAudioOutput: persistGeneratedAudio,
          });
          if (!audioGenerationResultPatch?.['audioUrl'] || !audioGenerationResultPatch?.['localPath'])
            throw new Error('音频模型没有返回可用的声音结果。');
          return trimStoryCharacterVoiceAudio(audioGenerationResultPatch);
        },
        parseError: (value43) => value43?.['message'] || '声音参考生成失败。',
      },
      { store: taskStore, startedAt: value37, abortController: abortController },
    );
  if (submitTask2['status'] !== 'success') throw submitTask2['error'] || new Error('声音参考生成失败。');
  const value44 = taskStore['getState']()['nodes'][value36] || {};
  return normalizeStoryCharacterVoiceReference({
    source: 'generated',
    audioUrl: value44['audioUrl'],
    localPath: value44['localPath'],
    fileName: value44['fileName'],
    modelId: workflow['key'],
    modelLabel: workflow['label'],
    sampleText: payload2['textInputs'][0x0],
    voiceDescription: editor['voiceDescription'],
    generationParams: payload2['generationParams'],
    updatedAt: Date['now'](),
  });
}
export async function resumeStoryCharacterVoice({
  asset: asset = {},
  taskId: taskId = '',
  payload: payload = {},
  signal: signal = null,
} = {}) {
  const text9 = normalizeText(taskId);
  if (!text9) throw new Error('角色声音任务缺少 taskId，无法恢复。');
  const storyCharacterVoiceWorkflow3 = getStoryCharacterVoiceWorkflow(
    payload['audioWorkflowKey'] || payload['model'],
  );
  if (!storyCharacterVoiceWorkflow3) throw new Error('角色声音任务对应的音频模型已不可用。');
  if (
    storyCharacterVoiceWorkflow3['adapterType'] !== 'workflow' &&
    !['runninghub', 'runninghubwf']['includes'](normalizeText(payload['provider']))
  )
    throw new Error('声音模型“' + storyCharacterVoiceWorkflow3['key'] + '”不支持恢复异步任务。');
  const value45 = Date['now'](),
    resumeRunningHubAudioTask2 = await resumeRunningHubAudioTask(
      text9,
      { ...payload, provider: payload['provider'] || storyCharacterVoiceWorkflow3['provider'] },
      { signal: signal },
    ),
    audioGenerationResultPatch2 = await buildAudioGenerationResultPatch(resumeRunningHubAudioTask2, {
      startedAt: value45,
      duration: Date['now']() - value45,
      persistAudioOutput: persistGeneratedAudio,
    });
  if (!audioGenerationResultPatch2?.['audioUrl'] || !audioGenerationResultPatch2?.['localPath'])
    throw new Error('音频模型没有返回可用的声音结果。');
  const trimStoryCharacterVoiceAudio2 = await trimStoryCharacterVoiceAudio(audioGenerationResultPatch2);
  return normalizeStoryCharacterVoiceReference({
    source: 'generated',
    audioUrl: trimStoryCharacterVoiceAudio2['audioUrl'],
    localPath: trimStoryCharacterVoiceAudio2['localPath'],
    fileName: trimStoryCharacterVoiceAudio2['fileName'],
    modelId: storyCharacterVoiceWorkflow3['key'],
    modelLabel: storyCharacterVoiceWorkflow3['label'],
    sampleText: payload['textInputs']?.[0x0],
    voiceDescription: asset['voiceDescription'] || asset['description'],
    generationParams: payload['generationParams'],
    updatedAt: Date['now'](),
  });
}

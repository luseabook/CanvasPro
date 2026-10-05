import { ASPECT_RATIO_FIELD } from '../../manifests/image/modelApi/sharedImageModelApiFields.js';
import { normalizeRunningHubModelApiProfileId } from '../runningHubProviderProfiles.js';
import { normalizeStoryWorkspaceAssetData } from './storyAssetAppearances.js';
import { invalidateStoryEpisodeScriptsFrom } from './storyPlanningData.js';
import { markStoryEpisodeProductionStale } from './storyScriptRevision.js';
import { parseUploadedStoryScript } from './storyScriptImport.js';
import { normalizeStoryScriptMode } from '../../domain/storyGeneration/planningContract.js';
export { normalizeStoryScriptMode } from '../../domain/storyGeneration/planningContract.js';
export {
  STORY_PROMPT_MODE_OPTIONS,
  getStoryPromptModeLabel,
  normalizeStoryPromptMode,
} from './storyPromptModes.js';
import { normalizeStoryPromptMode } from './storyPromptModes.js';
import { STORY_STYLE_CUSTOM_ID, resolveStoryStyleSelection } from './storyStyleCatalog.js';
import { createDemoStoryWorkspaceData } from './storyWorkspaceData.js';
export const STORY_SCRIPT_MAX_CHARACTERS = 100000;
export const STORY_IDEA_MAX_CHARACTERS = 5000;
export const STORY_CUSTOM_STYLE_MAX_CHARACTERS = 500;
export const STORY_EPISODE_COUNT_MIN = 1;
export const STORY_EPISODE_COUNT_MAX = 100;
export const STORY_PUBLIC_EPISODE_COUNT_OPTIONS = Object['freeze']([3, 5, 10, 20]);
export const STORY_DEVELOPER_EPISODE_COUNT_OPTIONS = Object['freeze']([30, 50]);
export const STORY_EPISODE_COUNT_OPTIONS = Object['freeze']([
  ...STORY_PUBLIC_EPISODE_COUNT_OPTIONS,
  ...STORY_DEVELOPER_EPISODE_COUNT_OPTIONS,
]);
export const STORY_SCENE_MAX_SECONDS_OPTIONS = Object['freeze']([15, 30]);
export const STORY_ASPECT_RATIO_OPTIONS = Object['freeze'](
  ASPECT_RATIO_FIELD['options']['map']((args) => Object['freeze']({ ...args })),
);
function normalizeText(value) {
  return String(value || '')['trim']();
}
export function normalizeStoryEpisodeCount(item) {
  const key = Math['trunc'](Number(item));
  return Number['isFinite'](key) && key >= STORY_EPISODE_COUNT_MIN && key <= STORY_EPISODE_COUNT_MAX
    ? key
    : STORY_PUBLIC_EPISODE_COUNT_OPTIONS[0];
}
export function normalizeStorySceneMaxSeconds(index) {
  const result = Math['trunc'](Number(index));
  return STORY_SCENE_MAX_SECONDS_OPTIONS['includes'](result) ? result : 15;
}
export function normalizeStoryProjectPlanning(
  options = {},
  { allowDeveloperPromptModes: allowDeveloperPromptModes = ![] } = {},
) {
  const data = options?.['planning'] && typeof options['planning'] === 'object' ? options['planning'] : {};
  return {
    episodeCount: normalizeStoryEpisodeCount(data['episodeCount']),
    sceneMaxSeconds: normalizeStorySceneMaxSeconds(data['sceneMaxSeconds']),
    promptMode: normalizeStoryPromptMode(data['promptMode'], {
      allowDeveloperModes: allowDeveloperPromptModes,
    }),
  };
}
export function normalizeStoryAspectRatio(target) {
  const text = normalizeText(target);
  return STORY_ASPECT_RATIO_OPTIONS['some']((el) => el['value'] === text) ? text : '16:9';
}
export const STORY_HOME_GENERATION_PROMPTS = Object['freeze']({
  upload: '按原稿结构导入上传剧本，不扩写、不重新分集，直接提取角色、场景与道具。',
  generate: '根据用户提供的一段故事设定，扩写为人物动机完整、冲突清晰、可继续拆分分集的故事剧情。',
  rewrite: '根据用户的改写要求重构参考剧本，生成新的故事蓝图、世界设定与分集规划。',
});
export function getNextStoryScriptMode(source) {
  return normalizeStoryScriptMode(source) === 'narration' ? 'plot' : 'narration';
}
export function getStoryScriptModeHint(next) {
  return normalizeStoryScriptMode(next) === 'narration'
    ? '以第三人称旁白推进，保留少量关键对白，适合单人口播与快速画面切换。'
    : '以人物行动和对白推进，生成标准剧情短剧。';
}
export function resolveStoryTextProviderProfileId(current, entry = '') {
  return normalizeText(current)['toLowerCase']() === 'runninghub'
    ? normalizeRunningHubModelApiProfileId(entry)
    : '';
}
export function buildStoryHomeGenerationRequest({
  mode: mode = 'upload',
  scriptMode: scriptMode = 'plot',
  modelId: modelId = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  scriptFileName: scriptFileName = '',
  scriptText: scriptText = '',
  idea: idea = '',
  rewriteInstruction: rewriteInstruction = '',
  aspectRatio: aspectRatio = '16:9',
  styleId: styleId = STORY_STYLE_CUSTOM_ID,
  stylePrompt: stylePrompt = '',
  videoStyle: videoStyle = '',
  episodeCount: episodeCount = 3,
  sceneMaxSeconds: sceneMaxSeconds = 15,
  promptMode: promptMode = 'seedance-2.0',
  allowDeveloperPromptModes: allowDeveloperPromptModes = ![],
} = {}) {
  if (mode === 'collaborate') return { ok: ![], error: '请先在 AI 协作创作中确认正文，再进入制作。' };
  const args2 = mode === 'generate' || mode === 'rewrite' ? mode : 'upload',
    text2 = normalizeText(idea)['slice'](0, STORY_IDEA_MAX_CHARACTERS),
    text3 = normalizeText(rewriteInstruction)['slice'](0, STORY_IDEA_MAX_CHARACTERS),
    text4 = normalizeText(scriptFileName),
    record = String(scriptText || '')['slice'](0, STORY_SCRIPT_MAX_CHARACTERS);
  if (args2 === 'upload' && !text4) return { ok: ![], error: '请先上传剧本或粘贴文本。' };
  if (args2 === 'upload' && !normalizeText(record))
    return { ok: ![], error: '当前文件尚未解析出可用文本，请使用 TXT、DOCX、文本型 PDF 或粘贴文本。' };
  if (args2 === 'generate' && !text2) return { ok: ![], error: '请先写下一段故事设定。' };
  if (args2 === 'rewrite' && !text4) return { ok: ![], error: '请先上传参考剧本。' };
  if (args2 === 'rewrite' && !normalizeText(record))
    return { ok: ![], error: '当前参考剧本尚未解析出可用文本，请使用 TXT、DOCX 或文本型 PDF。' };
  if (args2 === 'rewrite' && !text3) return { ok: ![], error: '请先填写改写要求。' };
  const storyStyleSelection = resolveStoryStyleSelection({
      styleId: styleId,
      stylePrompt: stylePrompt,
      videoStyle: videoStyle,
    }),
    text5 = normalizeText(provider),
    args3 = resolveStoryTextProviderProfileId(text5, providerProfileId);
  return {
    ok: !![],
    mode: args2,
    scriptMode: args2 !== 'upload' ? normalizeStoryScriptMode(scriptMode) : 'plot',
    prompt: STORY_HOME_GENERATION_PROMPTS[args2],
    modelId: normalizeText(modelId),
    provider: text5,
    ...(args3 ? { providerProfileId: args3 } : {}),
    scriptFileName: args2 !== 'generate' ? text4 : '',
    sourceText: args2 !== 'generate' ? record : '',
    idea: args2 === 'generate' ? text2 : '',
    rewriteInstruction: args2 === 'rewrite' ? text3 : '',
    aspectRatio: normalizeStoryAspectRatio(aspectRatio),
    styleId: storyStyleSelection['styleId'],
    visualStyle: storyStyleSelection['stylePrompt']['slice'](0, STORY_CUSTOM_STYLE_MAX_CHARACTERS),
    ...(args2 !== 'upload' ? { episodeCount: normalizeStoryEpisodeCount(episodeCount) } : {}),
    sceneMaxSeconds: normalizeStorySceneMaxSeconds(sceneMaxSeconds),
    promptMode: normalizeStoryPromptMode(promptMode, { allowDeveloperModes: allowDeveloperPromptModes }),
    maxScriptCharacters: STORY_SCRIPT_MAX_CHARACTERS,
  };
}
export function buildStorySummaryRegenerationRequest(
  options2 = {},
  {
    modelId: modelId = '',
    provider: provider = '',
    providerProfileId: providerProfileId = '',
    allowDeveloperPromptModes: allowDeveloperPromptModes = ![],
  } = {},
) {
  const payload = String(options2?.['sourceDocument']?.['text'] || ''),
    text6 = normalizeText(options2?.['originalCreative']),
    text7 = normalizeText(options2?.['rewriteInstruction']),
    handle =
      options2?.['sourceMode'] === 'upload-rewrite'
        ? 'rewrite'
        : normalizeText(payload)
          ? 'upload'
          : 'generate';
  if (handle === 'generate' && !text6) return { ok: ![], error: '当前项目没有可用于重新生成的原始创意。' };
  if (handle === 'rewrite' && !text7) return { ok: ![], error: '当前项目没有可用于重新生成的改写要求。' };
  const storyStyleSelection2 = resolveStoryStyleSelection({
      styleId: options2?.['videoStyleId'],
      stylePrompt: options2?.['videoStylePrompt'],
      videoStyle: options2?.['videoStyle'],
    }),
    storyProjectPlanning = normalizeStoryProjectPlanning(options2, {
      allowDeveloperPromptModes: allowDeveloperPromptModes,
    }),
    text8 = normalizeText(provider),
    args4 = resolveStoryTextProviderProfileId(text8, providerProfileId);
  return {
    ok: !![],
    mode: handle,
    scriptMode: normalizeStoryScriptMode(options2?.['scriptMode']),
    idea: handle === 'generate' ? text6 : '',
    sourceText: handle !== 'generate' ? payload : '',
    fileName: handle !== 'generate' ? normalizeText(options2?.['sourceDocument']?.['fileName']) : '',
    rewriteInstruction: handle === 'rewrite' ? text7 : '',
    model: normalizeText(modelId),
    provider: text8,
    ...(args4 ? { providerProfileId: args4 } : {}),
    aspectRatio: normalizeStoryAspectRatio(options2?.['aspectRatio']),
    visualStyle: storyStyleSelection2['stylePrompt'],
    planning: {
      episodeCount: storyProjectPlanning['episodeCount'],
      sceneMaxSeconds: storyProjectPlanning['sceneMaxSeconds'],
      promptMode: storyProjectPlanning['promptMode'],
    },
  };
}
export function resolveGeneratedProjectTitle({
  currentTitle: currentTitle = '',
  generatedTitle: generatedTitle = '',
  userEdited: userEdited = ![],
} = {}) {
  const text9 = normalizeText(currentTitle),
    text10 = normalizeText(generatedTitle);
  if (userEdited && text9) return text9;
  return text10 || text9 || '未命名故事';
}
export function normalizeGeneratedStoryContract(options3 = {}) {
  const state = options3 && typeof options3 === 'object' && !Array['isArray'](options3) ? options3 : {};
  return {
    protagonistGoal: normalizeText(state['protagonistGoal']),
    centralConflict: normalizeText(state['centralConflict']),
    stakes: normalizeText(state['stakes']),
    progressionDriver: normalizeText(state['progressionDriver']),
    constraints: normalizeText(state['constraints']),
    climax: normalizeText(state['climax']),
    ending: normalizeText(state['ending']),
  };
}
function normalizeGeneratedStoryPlotBeats(list = []) {
  return (Array['isArray'](list) ? list : [])
    ['map']((config, scope) => ({
      ref: normalizeText(config?.['ref']) || 'plot-beat-' + (scope + 1),
      stage: normalizeText(config?.['stage']),
      event: normalizeText(config?.['event']),
      consequence: normalizeText(config?.['consequence']),
    }))
    ['filter']((input) => input['stage'] || input['event'] || input['consequence']);
}
export function normalizeGeneratedStoryContinuityFacts(list2 = []) {
  return [...new Set((Array['isArray'](list2) ? list2 : [])['map'](normalizeText)['filter'](Boolean))];
}
export function applyGeneratedStoryResult(output, value2 = {}, value3 = {}) {
  const args5 = output && typeof output === 'object' ? output : createDemoStoryWorkspaceData(),
    list3 = Array['isArray'](value2['chapters'])
      ? value2['chapters']
          ['map']((value4, value5) => ({
            id: normalizeText(value4?.['id']) || 'chapter-' + (value5 + 1),
            title: normalizeText(value4?.['title']) || '第 ' + (value5 + 1) + ' 章',
            content: normalizeText(value4?.['content']),
          }))
          ['filter']((value6) => value6['content'])
      : [],
    value7 = list3['map']((value8) => value8['title'] + '\n' + value8['content'])['join']('\n\n');
  return {
    ...args5,
    project: {
      ...(args5['project'] || {}),
      title: resolveGeneratedProjectTitle({
        currentTitle: args5['project']?.['title'],
        generatedTitle: value2['title'],
        userEdited: value3['projectTitleEdited'] === !![],
      }),
      storyType: normalizeText(value2['storyType']),
      targetAudience: normalizeText(value2['targetAudience']),
      summary: normalizeText(value2['storySummary']),
      background: normalizeText(value2['storyBackground']),
      setting: normalizeText(value2['storySetting']),
      coreHook: normalizeText(value2['coreHook']),
      logline: normalizeText(value2['logline']),
      storyContract: value2['storyContract']
        ? normalizeGeneratedStoryContract(value2['storyContract'])
        : normalizeGeneratedStoryContract(args5['project']?.['storyContract']),
      plotBeats: Array['isArray'](value2['plotBeats'])
        ? normalizeGeneratedStoryPlotBeats(value2['plotBeats'])
        : normalizeGeneratedStoryPlotBeats(args5['project']?.['plotBeats']),
      continuityFacts: Array['isArray'](value2['continuityFacts'])
        ? normalizeGeneratedStoryContinuityFacts(value2['continuityFacts'])
        : normalizeGeneratedStoryContinuityFacts(args5['project']?.['continuityFacts']),
      summaryRevision:
        Math['max'](0, Math['trunc'](Number(args5['project']?.['summaryRevision']) || 0)) + 1,
      characters: Array['isArray'](value2['characters'])
        ? value2['characters']['map']((args6) => ({ ...args6 }))
        : [],
      sourceChapters: list3['map']((args7) => ({ ...args7 })),
      chapters: list3,
      plotScript: value7,
      narrationScript: value7,
    },
  };
}
export function invalidateStoryPlanningDownstream(
  options4 = {},
  {
    clearEpisodeOutlines: clearEpisodeOutlines = ![],
    episodeScriptStartIndex: episodeScriptStartIndex = 0,
  } = {},
) {
  const args8 = options4 && typeof options4 === 'object' ? options4 : {},
    args9 = { ...args8 };
  (delete args9['assetExtractionDraft'], delete args9['experimentalAssetExtractionDraft']);
  const args10 = args8['project'] && typeof args8['project'] === 'object' ? args8['project'] : {},
    list4 =
      Array['isArray'](args10['sourceChapters']) && args10['sourceChapters']['length']
        ? args10['sourceChapters']
        : !args10['compiledScript'] && Array['isArray'](args10['chapters'])
          ? args10['chapters']
          : [],
    value9 = Math['max'](0, Math['trunc'](Number(episodeScriptStartIndex) || 0));
  return {
    ...args9,
    project: {
      ...args10,
      ...(clearEpisodeOutlines
        ? { outlineStatus: 'pending', outlineSourceSummaryRevision: 0, storyFacts: [] }
        : {}),
      sourceChapters: list4['map']((args11) => ({ ...args11 })),
      chapters: [],
      plotScript: '',
      narrationScript: '',
      compiledScript: null,
    },
    assets: clearEpisodeOutlines ? [] : args8['assets'] || [],
    episodes: clearEpisodeOutlines
      ? []
      : invalidateStoryEpisodeScriptsFrom(args8['episodes'], value9)['map']((args12, value10) =>
          value10 < value9
            ? args12
            : markStoryEpisodeProductionStale({
                ...args12,
                clips: args8['episodes'][value10]?.['clips'] || [],
                clipCount: args8['episodes'][value10]?.['clips']?.['length'] || 0,
              }),
        ),
  };
}
export function markStorySummaryDownstreamStale(enabled = {}) {
  if (!enabled?.['project'] || typeof enabled['project'] !== 'object') return ![];
  const value11 = enabled['project'];
  value11['summaryRevision'] =
    Math['max'](0, Math['trunc'](Number(value11['summaryRevision']) || 0)) + 1;
  const value12 =
    (Array['isArray'](enabled['episodes']) && enabled['episodes']['length'] > 0) ||
    (Array['isArray'](enabled['assets']) && enabled['assets']['length'] > 0) ||
    normalizeText(value11['outlineStatus']) === 'completed';
  if (value12 && value11['outlineStatus'] !== 'generating')
    return ((value11['outlineStatus'] = 'stale'), !![]);
  return ![];
}
export function createGeneratedStoryProjectData(
  options5 = {},
  {
    projectId: projectId = 'story-' + Date['now'](),
    request: request = {},
    allowDeveloperPromptModes: allowDeveloperPromptModes = ![],
  } = {},
) {
  const storyStyleSelection3 = resolveStoryStyleSelection({
      styleId: request['styleId'],
      stylePrompt: request['visualStyle'],
    }),
    args13 = normalizeStoryWorkspaceAssetData(createDemoStoryWorkspaceData());
  return (
    (args13['project'] = {
      ...args13['project'],
      id: normalizeText(projectId) || 'story-' + Date['now'](),
      title: '未命名故事',
      scriptMode: normalizeStoryScriptMode(request['scriptMode']),
      storyType: '',
      targetAudience: '',
      summary: '',
      background: '',
      setting: '',
      coreHook: '',
      logline: '',
      storyContract: normalizeGeneratedStoryContract(),
      plotBeats: [],
      continuityFacts: [],
      summaryRevision: 0,
      outlineSourceSummaryRevision: 0,
      characters: [],
      sourceChapters: [],
      chapters: [],
      plotScript: '',
      narrationScript: '',
      aspectRatio: normalizeStoryAspectRatio(request['aspectRatio']),
      videoStyleId: storyStyleSelection3['styleId'],
      videoStylePrompt: storyStyleSelection3['stylePrompt'],
      customVideoStylePrompt: storyStyleSelection3['isCustom'] ? storyStyleSelection3['stylePrompt'] : '',
      videoStyle: storyStyleSelection3['label'] || storyStyleSelection3['stylePrompt'],
      planning: {
        episodeCount: normalizeStoryEpisodeCount(request['episodeCount']),
        sceneMaxSeconds: normalizeStorySceneMaxSeconds(request['sceneMaxSeconds']),
        promptMode: normalizeStoryPromptMode(request['promptMode'], {
          allowDeveloperModes: allowDeveloperPromptModes,
        }),
      },
      ...(request['mode'] === 'rewrite' ? { sourceMode: 'upload-rewrite' } : {}),
      sourceDocument:
        request['mode'] === 'upload' || request['mode'] === 'rewrite'
          ? {
              fileName: normalizeText(request['scriptFileName']),
              text: String(request['sourceText'] || ''),
              characterCount: String(request['sourceText'] || '')['length'],
            }
          : null,
      originalCreative:
        request['mode'] === 'upload' || request['mode'] === 'rewrite'
          ? String(request['sourceText'] || '')
          : String(request['idea'] || ''),
      rewriteInstruction: request['mode'] === 'rewrite' ? normalizeText(request['rewriteInstruction']) : '',
      summaryStatus: 'pending',
      outlineStatus: 'pending',
      compiledScript: null,
    }),
    (args13['assets'] = []),
    (args13['episodes'] = []),
    normalizeStoryWorkspaceAssetData(applyGeneratedStoryResult(args13, options5, { projectTitleEdited: ![] }))
  );
}
export function createUploadedStoryProjectData({
  projectId: projectId = 'story-' + Date['now'](),
  request: request = {},
  allowDeveloperPromptModes: allowDeveloperPromptModes = ![],
} = {}) {
  const uploadedStoryScript = parseUploadedStoryScript({
      sourceText: request['sourceText'],
      fileName: request['scriptFileName'],
    }),
    args14 = createGeneratedStoryProjectData(
      {},
      { projectId: projectId, request: request, allowDeveloperPromptModes: allowDeveloperPromptModes },
    );
  return (
    (args14['project'] = {
      ...args14['project'],
      title: uploadedStoryScript['title'],
      sourceMode: 'upload-original',
      summaryStatus: 'skipped',
      outlineStatus: 'completed',
      sourceChapters: uploadedStoryScript['chapters']['map']((args15) => ({ ...args15 })),
      chapters: uploadedStoryScript['chapters'],
      plotScript: uploadedStoryScript['sourceText'],
      narrationScript: uploadedStoryScript['sourceText'],
      compiledScript: {
        revision: 1,
        episodeIds: uploadedStoryScript['episodes']['map']((value13) => value13['id']),
        fullText: uploadedStoryScript['episodes']
          ['map']((value14) => value14['script']['fullText'])
          ['join']('\n\n'),
        confirmedAt: Date['now'](),
      },
    }),
    (args14['episodes'] = uploadedStoryScript['episodes']),
    normalizeStoryWorkspaceAssetData(args14)
  );
}

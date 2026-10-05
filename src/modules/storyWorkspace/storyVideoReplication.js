import { normalizeStoryWorkspaceAssetData } from './storyAssetAppearances.js';
import { resolveStoryPromptModeDefaultVideoModelId } from '../../domain/storyGeneration/promptModes.js';
import { resolveStoryVideoClipDurationConstraints } from './storyVideoGenerationSettings.js';
import {
  buildVideoReplicationSourceEvidence,
  buildVideoReplicationSourceTranscript,
  getVideoReplicationDialogueSummary,
} from '../../domain/storyGeneration/videoReplicationSourceAnalysis.js';
import { getStoryClipDialogueSpeakerAssetIds } from './storyPlanningData.js';
import { parseUploadedStoryEpisodeScenes } from './storyScriptImport.js';
import { localPathToUrl, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { validateStoryReplicationVideoSize } from './storyReplicationVideoLimits.js';
export { STORY_REPLICATION_MAX_VIDEO_BYTES } from './storyReplicationVideoLimits.js';
export const STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_SOURCE_CHARACTERS = 32000;
export const STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_OUTPUT_TOKENS = 16384;
export const STORY_REPLICATION_VIDEO_ACCEPT =
  '.mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo,video/avi,video/msvideo,video/vnd.avi';
export function isStoryVideoReplicationHomeAvailable({ workspaceSurface: workspaceSurface = 'story' } = {}) {
  return workspaceSurface === 'replication';
}
export function resolveStoryVideoReplicationHomeTab(options = {}, value = 'upload') {
  if (options['workspaceSurface'] === 'replication') return 'replication';
  if (value === 'collaborate' && options['developerModeAvailable'] !== !![]) return 'generate';
  const item = ['upload', 'generate', 'collaborate', 'replication']['includes'](value) ? value : 'upload';
  return item === 'replication' && !isStoryVideoReplicationHomeAvailable(options) ? 'upload' : item;
}
export const STORY_REPLICATION_LOCALES = Object['freeze']([
  Object['freeze']({ value: 'source', label: '保留原语言', shortLabel: '原语言' }),
  Object['freeze']({ value: 'zh-CN', label: '中国 · 中文', shortLabel: '中文' }),
  Object['freeze']({ value: 'ja-JP', label: '日本 · 日语', shortLabel: '日语' }),
  Object['freeze']({ value: 'ko-KR', label: '韩国 · 韩语', shortLabel: '韩语' }),
  Object['freeze']({ value: 'en-US', label: '美国 · 英语', shortLabel: '英语' }),
]);
const SUPPORTED_VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi']);
function normalizeText(key) {
  return String(key ?? '')['trim']();
}
export function resolveStoryVideoReplicationClipVoiceAssetIds(options2 = {}, index = {}) {
  if (options2?.['project']?.['sourceMode'] !== 'video-replication') return null;
  return getStoryClipDialogueSpeakerAssetIds(index, options2['assets']);
}
function normalizePositiveNumber(result) {
  const count = Number(result);
  return Number['isFinite'](count) && count > 0 ? count : 0;
}
function stripVideoExtension(data) {
  return normalizeText(data)
    ['replace'](/^.*[\\/]/u, '')
    ['replace'](/\.(?:mp4|mov|avi)$/iu, '')
    ['trim']();
}
function getVideoExtension(error = {}) {
  return normalizeText(error['name'])['split']('.')['pop']()?.['toLowerCase']() || '';
}
function normalizeLocale(target) {
  const text = normalizeText(target);
  return STORY_REPLICATION_LOCALES['some']((el) => el['value'] === text)
    ? text
    : STORY_REPLICATION_LOCALES[0]['value'];
}
function createStableEpisodeId(error2 = {}, source = 0, next = 'story') {
  const list = [
    next,
    normalizeText(error2['name']),
    Number(error2['size']) || 0,
    Number(error2['lastModified']) || 0,
    source,
  ]['join']('|');
  let current = 0x811c9dc5;
  for (let entry = 0; entry < list['length']; entry += 1) {
    ((current ^= list['charCodeAt'](entry)), (current = Math['imul'](current, 0x1000193)));
  }
  return 'replication-episode-' + (current >>> 0)['toString'](36);
}
function normalizeAnalysisSegment(options3 = {}, record = 0, count2 = 0) {
  const startSec = Math['max'](0, Number(options3['startSec']) || 0),
    payload = Number(options3['endSec']),
    handle = Math['max'](1, Number(options3['durationSec']) || 0),
    state = Number['isFinite'](payload) && payload > startSec ? payload : startSec + handle,
    endSec = count2 > 0 ? Math['min'](Math['max'](startSec + 0.1, state), count2) : state;
  return {
    title: normalizeText(options3['title']) || '片段 ' + String(record + 1)['padStart'](2, '0'),
    startSec: startSec,
    endSec: endSec,
    durationSec: Math['max'](0.1, endSec - startSec),
    script: normalizeText(options3['script'] || options3['dialogue'] || options3['visual']),
    prompt: normalizeText(options3['prompt'] || options3['seedancePrompt']),
    visual: normalizeText(options3['visual'] || options3['script']),
    camera: normalizeText(options3['camera']),
    dialogue: normalizeText(options3['dialogue']),
    sound: normalizeText(options3['sound'] || options3['audio']),
  };
}
export function getStoryReplicationLocale(config) {
  const locale = normalizeLocale(config);
  return (
    STORY_REPLICATION_LOCALES['find']((el2) => el2['value'] === locale) || STORY_REPLICATION_LOCALES[0]
  );
}
export function resolveStoryReplicationUploadedVideo(response = {}) {
  const localPath = pickResultLocalPath(response),
    videoRef2 = normalizeText(
      localPath
        ? localPathToUrl(localPath)
        : response?.['displayUrl'] ||
            response?.['url'] ||
            response?.['originalUrl'] ||
            response?.['videoUrl'],
    );
  if (!videoRef2) throw new Error('视频上传结果缺少可用地址。');
  return { videoRef: videoRef2, localPath: localPath };
}
export function findStoryReplicationEpisode(scope, input) {
  return (
    (Array['isArray'](scope?.['episodes']) ? scope['episodes'] : [])['find'](
      (output) => normalizeText(output?.['id']) === normalizeText(input),
    ) || null
  );
}
function buildStoryVideoReplicationEpisodeAssetEvidence(options4 = {}) {
  const value2 = options4?.['replication']?.['analysis'] || {},
    list2 = [],
    videoReplicationSourceEvidence = buildVideoReplicationSourceEvidence(options4);
  if (videoReplicationSourceEvidence)
    list2['push']('原片人物与事件证据：' + JSON['stringify'](videoReplicationSourceEvidence));
  const text2 = normalizeText(value2['synopsis'] || options4?.['synopsis']),
    text3 = normalizeText(value2['camera']),
    text4 = normalizeText(value2['seedancePrompt']);
  if (text2) list2['push']('剧情与空间概述：' + text2);
  if (text3) list2['push']('整体运镜：' + text3);
  if (text4) list2['push']('整体视觉提示：' + text4);
  const args = (Array['isArray'](value2['segments']) ? value2['segments'] : [])
    ['map']((value3, value4) => {
      const list3 = [],
        text5 = normalizeText(value3?.['visual']),
        text6 = normalizeText(value3?.['prompt']),
        text7 = normalizeText(value3?.['camera']);
      if (text5) list3['push']('画面：' + text5);
      if (text6) list3['push']('视觉提示：' + text6);
      if (text7) list3['push']('运镜：' + text7);
      if (!list3['length']) return '';
      const text8 = normalizeText(value3?.['title']);
      return [
        '片段 ' + (value4 + 1) + (text8 ? '「' + text8 + '」' : '') + '：',
        ...list3['map']((value5) => '- ' + value5),
      ]['join']('\n');
    })
    ['filter'](Boolean);
  list2['push'](...args);
  if (!list2['length']) return '';
  return ['【视频解析视觉证据（仅用于角色、场景与道具识别，不是新增剧情）】', ...list2]['join']('\n');
}
export function buildStoryVideoReplicationAssetExtractionProject(options5 = {}) {
  const args2 = options5?.['project'] || {};
  if (args2['sourceMode'] !== 'video-replication') return args2;
  const replicationFrameSources = Array['isArray'](options5['episodes']) ? options5['episodes'] : [],
    list4 = Array['isArray'](args2['chapters']) ? args2['chapters'] : [],
    list5 = list4['length']
      ? list4
      : replicationFrameSources['filter']((value6) => normalizeText(value6?.['script']?.['fullText']))['map'](
          (id, value7) => ({
            id: id['id'],
            title: '第 ' + (id['number'] || value7 + 1) + ' 集：' + (id['title'] || '未命名分集'),
            content: id['script']['fullText'],
          }),
        ),
    chapters = list5['map']((args3, value8) => {
      const value9 =
          replicationFrameSources['find'](
            (value10) => normalizeText(value10?.['id']) === normalizeText(args3?.['id']),
          ) || replicationFrameSources[value8],
        text9 = normalizeText(args3?.['content'] || value9?.['script']?.['fullText']),
        storyVideoReplicationEpisodeAssetEvidence = buildStoryVideoReplicationEpisodeAssetEvidence(value9);
      return {
        ...args3,
        content: [text9, storyVideoReplicationEpisodeAssetEvidence]['filter'](Boolean)['join']('\n\n'),
      };
    });
  return {
    ...args2,
    chapters: chapters,
    replicationFrameSources: replicationFrameSources['filter'](
      (value11) => value11['replication']?.['sourceAnalysis'],
    )['map']((episodeId) => ({
      episodeId: episodeId['id'],
      durationSec: Number(episodeId['sourceVideo']?.['durationSec']) || 0,
      revision: episodeId['replication']['sourceAnalysis']['revision'],
      events: episodeId['replication']['sourceAnalysis']['events']['map'](
        ({ id: id2, startSec: startSec2, endSec: endSec2, visual: visual }) => ({
          id: id2,
          startSec: startSec2,
          endSec: endSec2,
          visual: visual,
        }),
      ),
    })),
  };
}
export function shouldUseStoryVideoReplicationUnifiedAssetLocalization(
  options6 = {},
  {
    maxSourceCharacters: maxSourceCharacters = STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_SOURCE_CHARACTERS,
  } = {},
) {
  if (options6?.['project']?.['sourceMode'] !== 'video-replication') return ![];
  if (options6['assetExtractionDraft'] && typeof options6['assetExtractionDraft'] === 'object') return ![];
  const storyVideoReplicationAssetExtractionProject =
      buildStoryVideoReplicationAssetExtractionProject(options6),
    list6 = Array['isArray'](storyVideoReplicationAssetExtractionProject['chapters'])
      ? storyVideoReplicationAssetExtractionProject['chapters']
      : [],
    value12 = list6['reduce'](
      (value13, value14) => value13 + String(value14?.['content'] || '')['length'],
      0,
    ),
    count3 =
      value12 ||
      (Array['isArray'](options6['episodes']) ? options6['episodes'] : [])['reduce'](
        (value15, value16) => value15 + String(value16?.['script']?.['fullText'] || '')['length'],
        0,
      ),
    value17 = Math['max'](1, Math['trunc'](Number(maxSourceCharacters) || 0));
  return count3 > 0 && count3 <= value17;
}
export function validateStoryReplicationVideoFile(error3 = {}, value18 = '') {
  const text10 = normalizeText(error3['name']),
    videoExtension = getVideoExtension(error3),
    enabled = Math['max'](0, Number(error3['size']) || 0);
  if (!text10) return { ok: ![], error: '视频文件缺少文件名。' };
  if (!SUPPORTED_VIDEO_EXTENSIONS['has'](videoExtension))
    return { ok: ![], error: '“' + text10 + '”格式不支持，仅支持 MP4、MOV、AVI。' };
  const response2 = validateStoryReplicationVideoSize(error3, value18);
  if (!response2['ok']) return response2;
  if (!enabled) return { ok: ![], error: '“' + text10 + '”是空文件。' };
  return { ok: !![], error: '' };
}
export function mergeStoryReplicationSourceFiles(list7 = [], value19 = [], value20 = '') {
  const list8 = [],
    map = new Set();
  return (
    [...(Array['isArray'](list7) ? list7 : []), ...(Array['isArray'](value19) ? value19 : [])]['forEach'](
      (error4) => {
        if (
          !(Array['isArray'](list7) && list7['includes'](error4)) &&
          !validateStoryReplicationVideoFile(error4, value20)['ok']
        )
          return;
        const value21 = [error4['name'], error4['size'], error4['lastModified']]['join'](':');
        if (map['has'](value21)) return;
        (map['add'](value21), list8['push'](error4));
      },
    ),
    list8
  );
}
export function createStoryVideoReplicationProjectData({
  projectId: projectId = 'story-' + Date['now'](),
  files: files = [],
  modelId: modelId = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  targetLocale: targetLocale = 'zh-CN',
  asrProvider: asrProvider = 'volcengine-speech',
  promptMode: promptMode = 'seedance-2.0',
  aspectRatio: aspectRatio = '9:16',
} = {}) {
  const list9 = Array['isArray'](files) ? files : [];
  if (!list9['length']) throw new Error('请先上传至少一条视频。');
  for (const value22 of list9) {
    const response3 = validateStoryReplicationVideoFile(value22, modelId);
    if (!response3['ok']) throw new Error(response3['error']);
  }
  const targetAudience = getStoryReplicationLocale(targetLocale),
    stripVideoExtension2 = stripVideoExtension(list9[0]?.['name']) || '未命名复刻视频',
    title =
      list9['length'] > 1
        ? stripVideoExtension2 + ' 等 ' + list9['length'] + ' 条视频'
        : stripVideoExtension2,
    episodeCount = list9['map']((error5, number) => {
      const id3 = createStableEpisodeId(error5, number, projectId);
      return {
        id: id3,
        planningRef: id3,
        number: number + 1,
        title: stripVideoExtension(error5['name']) || '第 ' + (number + 1) + ' 集',
        synopsis: '',
        hook: '',
        sourceChapterIds: [id3],
        assetRefs: [],
        assetIds: [],
        scriptStatus: 'pending',
        script: null,
        clips: [],
        clipCount: 0,
        characterCount: 0,
        sceneCount: 0,
        propCount: 0,
        durationSec: 0,
        duration: '--:--',
        coverUrl: '',
        status: '解析中',
        sourceVideo: {
          fileName: normalizeText(error5['name']),
          size: Math['max'](0, Number(error5['size']) || 0),
          mimeType: normalizeText(error5['type']),
          videoRef: '',
          posterUrl: '',
          posterLocalPath: '',
          durationSec: 0,
        },
        replication: { status: 'queued', progress: 0, error: '', analysis: null },
      };
    });
  return normalizeStoryWorkspaceAssetData({
    project: {
      id: projectId,
      title: title,
      sourceMode: 'video-replication',
      scriptMode: 'plot',
      storyType: '视频复刻',
      targetAudience: targetAudience['label'],
      videoStyleId: '',
      videoStylePrompt: '',
      customVideoStylePrompt: '',
      videoStyle: '',
      aspectRatio: normalizeText(aspectRatio) || '9:16',
      planning: {
        episodeCount: episodeCount['length'],
        sceneMaxSeconds:
          resolveStoryVideoClipDurationConstraints(resolveStoryPromptModeDefaultVideoModelId(promptMode))?.[
            'maxSeconds'
          ] || 15,
        promptMode: promptMode,
      },
      sourceDocument: null,
      originalCreative: '',
      summary: '',
      chapters: [],
      plotScript: '',
      narrationScript: '',
      summaryStatus: 'skipped',
      outlineStatus: 'completed',
      compiledScript: null,
      replication: {
        targetLocale: targetAudience['value'],
        asrProvider: asrProvider,
        targetLabel: targetAudience['label'],
        modelId: normalizeText(modelId),
        provider: normalizeText(provider),
        providerProfileId: normalizeText(providerProfileId),
        assetLocalizationCompletedAt: 0,
        status: 'analyzing',
        completedCount: 0,
        failedCount: 0,
        totalCount: episodeCount['length'],
      },
      backgroundTasks: [],
    },
    assets: [],
    episodes: episodeCount,
    clipFrames: [],
  });
}
export function isStoryVideoReplicationAssetLocalizationComplete(options7 = {}) {
  return (
    options7?.['project']?.['sourceMode'] === 'video-replication' &&
    Number(options7['project']?.['replication']?.['assetLocalizationCompletedAt']) > 0 &&
    Array['isArray'](options7['assets']) &&
    options7['assets']['some']((value23) => value23?.['kind'] === 'scene')
  );
}
export function markStoryVideoReplicationAssetLocalizationComplete(
  enabled2 = {},
  { completedAt: completedAt = Date['now']() } = {},
) {
  if (enabled2?.['project']?.['sourceMode'] !== 'video-replication') return ![];
  if (
    !Array['isArray'](enabled2['assets']) ||
    !enabled2['assets']['some']((value24) => value24?.['kind'] === 'scene')
  )
    return ![];
  const assetLocalizationCompletedAt = Math['max'](0, Math['trunc'](Number(completedAt) || 0));
  if (!assetLocalizationCompletedAt) return ![];
  return (
    (enabled2['project']['replication'] = {
      ...(enabled2['project']['replication'] || {}),
      assetLocalizationCompletedAt: assetLocalizationCompletedAt,
    }),
    !![]
  );
}
export function invalidateStoryVideoReplicationAssetLocalization(options8 = {}) {
  if (options8?.['project']?.['sourceMode'] !== 'video-replication') return ![];
  const args4 = options8['project']['replication'];
  if (!args4 || !args4['assetLocalizationCompletedAt']) return ![];
  return ((options8['project']['replication'] = { ...args4, assetLocalizationCompletedAt: 0 }), !![]);
}
export function applyStoryVideoReplicationUpload(
  response4 = {},
  {
    file: file = null,
    videoRef: videoRef = '',
    durationSec: durationSec = 0,
    posterUrl: posterUrl = '',
    posterLocalPath: posterLocalPath = '',
  } = {},
) {
  const durationSec2 = normalizePositiveNumber(durationSec);
  ((response4['sourceVideo'] = {
    ...(response4['sourceVideo'] || {}),
    ...(file
      ? {
          fileName: normalizeText(file['name']) || response4['sourceVideo']?.['fileName'],
          size: Math['max'](0, Number(file['size']) || 0),
          mimeType: normalizeText(file['type']),
        }
      : {}),
    videoRef: normalizeText(videoRef),
    durationSec: durationSec2,
    posterUrl: normalizeText(posterUrl),
    posterLocalPath: normalizeText(posterLocalPath),
  }),
    (response4['coverUrl'] = normalizeText(posterUrl || response4['coverUrl'])),
    (response4['durationSec'] = durationSec2));
  const value25 = Math['round'](durationSec2);
  return (
    (response4['duration'] = value25
      ? String(Math['floor'](value25 / 60))['padStart'](2, '0') +
        ':' +
        String(value25 % 60)['padStart'](2, '0')
      : '--:--'),
    (response4['replication'] = {
      ...(response4['replication'] || {}),
      status: 'analyzing',
      progress: 45,
      error: '',
    }),
    (response4['status'] = '解析中'),
    response4
  );
}
export function applyStoryVideoReplicationAnalysis(episodeRef = {}, sourceAnalysis = {}) {
  if (sourceAnalysis['sourceAnalysis']) {
    const sourceAnalysis2 = sourceAnalysis['sourceAnalysis'];
    if (
      episodeRef['replication']?.['sourceAnalysis'] &&
      episodeRef['replication']['sourceAnalysis'] !== sourceAnalysis2
    )
      delete episodeRef['replication']['transcription'];
    const fullText = buildVideoReplicationSourceTranscript(sourceAnalysis2);
    return (
      (episodeRef['title'] = sourceAnalysis2['title'] || episodeRef['title']),
      (episodeRef['synopsis'] = sourceAnalysis2['synopsis']),
      (episodeRef['scriptStatus'] = 'completed'),
      (episodeRef['script'] = {
        schemaVersion: 1,
        source: 'video-replication',
        episodeRef: episodeRef['id'],
        fullText: fullText,
        scenes: parseUploadedStoryEpisodeScenes({
          fullText: fullText,
          episodeRef: episodeRef['id'],
          fallbackHeading: episodeRef['title'],
        }),
        generatedAt: Date['now'](),
      }),
      (episodeRef['replication'] = {
        ...episodeRef['replication'],
        sourceAnalysis: sourceAnalysis2,
        status: 'ready',
        progress: 100,
        error: '',
        message: '',
        analysis: null,
      }),
      (episodeRef['status'] = '待核对'),
      episodeRef
    );
  }
  const endSec3 = normalizePositiveNumber(
      episodeRef['sourceVideo']?.['durationSec'] || sourceAnalysis['durationSec'],
    ),
    list10 = Array['isArray'](sourceAnalysis['segments']) ? sourceAnalysis['segments'] : [],
    segmentCount = list10['map']((value26, value27) => normalizeAnalysisSegment(value26, value27, endSec3))[
      'filter'
    ]((value28) => value28['durationSec'] > 0 && (value28['script'] || value28['prompt']));
  !segmentCount['length'] &&
    segmentCount['push'](
      normalizeAnalysisSegment(
        {
          title: normalizeText(sourceAnalysis['title']) || episodeRef['title'],
          startSec: 0,
          endSec: endSec3 || 15,
          script: normalizeText(sourceAnalysis['fullScript'] || sourceAnalysis['synopsis']),
          prompt: normalizeText(sourceAnalysis['seedancePrompt']),
          camera: normalizeText(sourceAnalysis['camera']),
          sound: normalizeText(sourceAnalysis['sound']),
        },
        0,
        endSec3,
      ),
    );
  const fullText2 =
    normalizeText(sourceAnalysis['fullScript']) ||
    segmentCount['map']((value29) => value29['script'])
      ['filter'](Boolean)
      ['join']('\n\n') ||
    normalizeText(sourceAnalysis['synopsis'] || sourceAnalysis['seedancePrompt']);
  if (!fullText2) throw new Error('视频理解模型未返回可用的本地化剧本。');
  const fallbackHeading =
      normalizeText(sourceAnalysis['title']) || normalizeText(episodeRef['title']) || '未命名分集',
    scenes = parseUploadedStoryEpisodeScenes({
      fullText: fullText2,
      episodeRef: episodeRef['id'],
      fallbackHeading: fallbackHeading,
    });
  return (
    (episodeRef['title'] = fallbackHeading),
    (episodeRef['synopsis'] = normalizeText(sourceAnalysis['synopsis']) || fullText2['slice'](0, 180)),
    (episodeRef['scriptStatus'] = 'completed'),
    (episodeRef['script'] = {
      schemaVersion: 1,
      source: 'video-replication',
      episodeRef: episodeRef['id'],
      scenes: scenes['length']
        ? scenes
        : [
            {
              ref: episodeRef['id'] + '-scene-1',
              heading: fallbackHeading,
              characters: [],
              body: fullText2,
              source: 'video-replication',
            },
          ],
      fullText: fullText2,
      generatedAt: Date['now'](),
    }),
    (episodeRef['clips'] = []),
    (episodeRef['clipCount'] = 0),
    (episodeRef['status'] = '待拆分'),
    (episodeRef['replication'] = {
      ...(episodeRef['replication'] || {}),
      status: 'ready',
      progress: 100,
      error: '',
      analysis: {
        title: fallbackHeading,
        synopsis: episodeRef['synopsis'],
        camera: normalizeText(sourceAnalysis['camera']),
        sound: normalizeText(sourceAnalysis['sound']),
        seedancePrompt: normalizeText(sourceAnalysis['seedancePrompt']),
        segmentCount: segmentCount['length'],
        segments: segmentCount,
      },
      ...(sourceAnalysis['sourceAnalysis'] ? { sourceAnalysis: sourceAnalysis['sourceAnalysis'] } : {}),
      scriptSourceRevision:
        sourceAnalysis['sourceAnalysis']?.['revision'] ||
        episodeRef['replication']?.['sourceAnalysis']?.['revision'] ||
        0,
    }),
    episodeRef
  );
}
export function failStoryVideoReplicationEpisode(response5 = {}, value30 = '') {
  const error6 = normalizeText(value30) || '视频解析失败，请重试。';
  return (
    (response5['status'] = '解析失败'),
    (response5['replication'] = {
      ...(response5['replication'] || {}),
      status: 'failed',
      progress: 0,
      error: error6,
    }),
    response5
  );
}
export function settleInterruptedStoryVideoReplication(
  options9 = {},
  { message: message = '上次视频解析已中断，请点击重试；已完成结果不会重新生成。' } = {},
) {
  if (options9?.['project']?.['sourceMode'] !== 'video-replication') return 0;
  let value31 = 0;
  for (const value32 of options9['episodes'] || []) {
    if (!['queued', 'uploading', 'analyzing']['includes'](value32?.['replication']?.['status'])) continue;
    (failStoryVideoReplicationEpisode(value32, message), (value31 += 1));
  }
  if (value31) syncStoryVideoReplicationProject(options9);
  return value31;
}
export function reorderStoryVideoReplicationEpisodes(list11 = [], value33 = []) {
  const list12 = Array['isArray'](list11) ? list11 : [],
    map2 = new Map(list12['map']((value34) => [normalizeText(value34?.['id']), value34])),
    map3 = new Set(),
    list13 = [];
  return (
    (Array['isArray'](value33) ? value33 : [])['forEach']((value35) => {
      const text11 = normalizeText(value35),
        enabled3 = map2['get'](text11);
      if (!enabled3 || map3['has'](text11)) return;
      (map3['add'](text11), list13['push'](enabled3));
    }),
    list12['forEach']((value36) => {
      const text12 = normalizeText(value36?.['id']);
      if (!text12 || map3['has'](text12)) return;
      (map3['add'](text12), list13['push'](value36));
    }),
    list13['map']((value37, value38) => {
      return ((value37['number'] = value38 + 1), value37);
    })
  );
}
export function syncStoryVideoReplicationProject(options10 = {}) {
  const totalCount = Array['isArray'](options10['episodes']) ? options10['episodes'] : [],
    completedCount = totalCount['filter']((value39) => value39?.['replication']?.['status'] === 'ready'),
    failedCount = totalCount['filter']((value40) => value40?.['replication']?.['status'] === 'failed'),
    status = totalCount['filter']((value41) =>
      ['queued', 'uploading', 'analyzing']['includes'](value41?.['replication']?.['status']),
    ),
    fullText3 = completedCount['map']((value42) => normalizeText(value42?.['script']?.['fullText']))
      ['filter'](Boolean)
      ['join']('\n\n'),
    value43 = options10['project'] || (options10['project'] = {});
  ((value43['replication'] = {
    ...(value43['replication'] || {}),
    status: status['length']
      ? 'analyzing'
      : failedCount['length']
        ? completedCount['length']
          ? 'partial'
          : 'failed'
        : completedCount['length'] === totalCount['length'] && totalCount['length']
          ? 'ready'
          : 'pending',
    completedCount: completedCount['length'],
    failedCount: failedCount['length'],
    totalCount: totalCount['length'],
  }),
    (value43['chapters'] = completedCount['map']((id4) => ({
      id: id4['id'],
      title: '第 ' + id4['number'] + ' 集：' + id4['title'],
      content: id4['script']['fullText'],
    }))),
    (value43['plotScript'] = fullText3),
    (value43['narrationScript'] = fullText3),
    (value43['originalCreative'] = fullText3),
    (value43['summary'] = completedCount['map']((value44) => value44['synopsis'])
      ['filter'](Boolean)
      ['join']('\n')));
  const episodeIds = totalCount['map']((value45) => value45['id']),
    value46 = value43['compiledScript'],
    confirmedAt = Boolean(
      value46 &&
      value46['fullText'] === fullText3 &&
      JSON['stringify'](value46['episodeIds'] || []) === JSON['stringify'](episodeIds),
    );
  return (
    (value43['compiledScript'] =
      completedCount['length'] === totalCount['length'] && totalCount['length']
        ? {
            revision: 1,
            episodeIds: episodeIds,
            fullText: fullText3,
            confirmedAt: confirmedAt ? value46['confirmedAt'] : Date['now'](),
          }
        : null),
    options10
  );
}
export function getStoryVideoReplicationSummary(options11 = {}) {
  syncStoryVideoReplicationProject(options11);
  const status2 = options11['project']?.['replication'] || {};
  return {
    status: status2['status'] || 'pending',
    total: Math['max'](0, Number(status2['totalCount']) || 0),
    completed: Math['max'](0, Number(status2['completedCount']) || 0),
    failed: Math['max'](0, Number(status2['failedCount']) || 0),
    active: (options11['episodes'] || [])['filter']((value47) =>
      ['queued', 'uploading', 'analyzing']['includes'](value47?.['replication']?.['status']),
    )['length'],
  };
}
export function getStoryVideoReplicationFooterState(
  options12 = {},
  { localizing: localizing = ![], planningStatus: planningStatus = '' } = {},
) {
  const storyVideoReplicationSummary = getStoryVideoReplicationSummary(options12),
    value48 = (options12['episodes'] || [])['some']((value49) => {
      const enabled4 = value49['replication']?.['sourceAnalysis'];
      if (!enabled4) return ![];
      const videoReplicationDialogueSummary = getVideoReplicationDialogueSummary(enabled4);
      return (
        videoReplicationDialogueSummary['total'] === 0 || videoReplicationDialogueSummary['pending'] > 0
      );
    }),
    actionLabel = storyVideoReplicationSummary['active'] > 0,
    busy = actionLabel || localizing,
    action = storyVideoReplicationSummary['completed'] > 0,
    enabled5 = (options12['episodes'] || [])['some'](
      (value50) => value50['replication']?.['status'] === 'pending',
    );
  if (localizing)
    return {
      busy: busy,
      action: 'localize-replication-assets',
      actionLabel: '提取元素中',
      actionAttention: ![],
      actionDisabled: !![],
      title: normalizeText(planningStatus) || '正在识别角色、场景与道具',
      hint: '原片分析已保留，提取完成后指定替换人物',
    };
  return {
    busy: busy,
    action: action
      ? 'localize-replication-assets'
      : enabled5
        ? 'analyze-all-replication'
        : 'retry-replication-analysis',
    actionLabel: actionLabel
      ? '解析中'
      : action
        ? '确认分析，下一步：替换人物'
        : enabled5
          ? '开始分析全部待处理视频'
          : '重试失败视频',
    actionAttention: action,
    actionDisabled: actionLabel || (!action && !storyVideoReplicationSummary['failed'] && !enabled5),
    title: actionLabel
      ? '正在整理提取素材，请稍后'
      : action
        ? value48
          ? '原片画面已分析，人声文案待核对'
          : '视频解析完成'
        : storyVideoReplicationSummary['failed']
          ? '已完成 ' +
            storyVideoReplicationSummary['completed'] +
            '/' +
            storyVideoReplicationSummary['total'] +
            ' 条，' +
            storyVideoReplicationSummary['failed'] +
            ' 条解析失败'
          : '等待视频解析',
    hint: actionLabel
      ? '已完成 ' +
        storyVideoReplicationSummary['completed'] +
        '/' +
        storyVideoReplicationSummary['total'] +
        ' 条，解析期间可调整卡片顺序'
      : action
        ? '核对故事和人声文案后，提取原片元素并设置替换；分段提示词在后续生成'
        : '解析失败的视频可重试，已完成结果不会重新生成',
  };
}

import {
  discardStaleStoryEpisodeSplitTransportDraft,
  ensureUniqueStoryEpisodeClipIds,
  normalizeStoryAssetDisplayName,
  normalizeStoryCharacterRole,
  syncStoryEpisodeClipDialogueMentions,
} from './storyPlanningData.js';
import { normalizeStoryClipFrames } from './storyClipFrames.js';
import {
  buildCanvasLocalImageFields,
  resolveCanvasImagePreviewUrl,
} from '../../services/canvasMediaLocalService.js';
import {
  sanitizeStoryAssetPublicDescriptionText,
  sanitizeStoryAssetPublicPromptText,
  stripStoryAssetInternalEvidenceMetadata,
} from '../../../api/utils/storyAssetPublicText.js';
import {
  getWorkspaceAssetAppearance,
  getWorkspaceAssetAppearances,
  getWorkspaceAssetAppearanceStats,
  getWorkspaceAssetBaseAppearance,
} from '../workspaceAssetAppearance.js';
function normalizeText(value) {
  return String(value || '')['trim']();
}
export const STORY_ASSET_STYLE_REFERENCE_MENTION = '@风格参考';
export const STORY_ASSET_REFERENCE_PROMPT_SUFFIX =
  '参考' + STORY_ASSET_STYLE_REFERENCE_MENTION + '的图片风格生成形象';
export function appendStoryAssetReferencePrompt(item = '') {
  const text = normalizeText(item),
    text2 = normalizeText(text['split'](STORY_ASSET_REFERENCE_PROMPT_SUFFIX)['join'](''));
  return [text2, STORY_ASSET_REFERENCE_PROMPT_SUFFIX]['filter'](Boolean)['join']('\n');
}
export function compileStoryAssetReferencePrompt(key = '') {
  return normalizeText(key)['split'](STORY_ASSET_STYLE_REFERENCE_MENTION)['join']('@图片2');
}
export function setStoryAssetAppearanceReferenceImage(enabled = null, index = '') {
  const result = index && typeof index === 'object' ? buildCanvasLocalImageFields(index) : null,
    text3 = normalizeText(result ? result['imageUrl'] : index);
  if (!enabled || typeof enabled !== 'object' || !text3) return false;
  return (
    (enabled['referenceImage'] = result),
    (enabled['referenceImageUrl'] = text3),
    (enabled['prompt'] = appendStoryAssetReferencePrompt(enabled['prompt'])),
    (enabled['error'] = ''),
    true
  );
}
export function clearStoryAssetAppearanceReferenceImage(enabled2 = null) {
  if (!enabled2 || typeof enabled2 !== 'object') return false;
  const data = Boolean(normalizeText(enabled2['referenceImageUrl'])),
    text4 = normalizeText(
      normalizeText(enabled2['prompt'])
        ['split'](STORY_ASSET_REFERENCE_PROMPT_SUFFIX)
        ['join']('')
        ['split'](STORY_ASSET_STYLE_REFERENCE_MENTION)
        ['join'](''),
    ),
    options = text4 !== normalizeText(enabled2['prompt']);
  return (
    (enabled2['referenceImageUrl'] = ''),
    (enabled2['referenceImage'] = null),
    (enabled2['prompt'] = text4),
    data || options
  );
}
function buildLegacyPrompt(options2 = {}) {
  return [
    sanitizeStoryAssetPublicPromptText(options2['description']),
    sanitizeStoryAssetPublicPromptText(options2['prompt']),
  ]
    ['filter'](Boolean)
    ['join']('\n');
}
export function normalizeStoryAssetAppearance(args = {}, target = {}) {
  const text5 = normalizeText(target['assetId']) || 'asset',
    count = Math['max'](0, Math['trunc'](Number(target['index']) || 0)),
    sanitizeStoryAssetPublicPromptText2 =
      sanitizeStoryAssetPublicPromptText(args['prompt']) ||
      sanitizeStoryAssetPublicPromptText(target['fallbackPrompt']);
  return {
    ...args,
    id: normalizeText(args['id']) || text5 + '-appearance-' + (count + 1),
    name: normalizeText(args['name']) || (count === 0 ? '基础形象' : '形象 ' + (count + 1)),
    occurrences: normalizeText(args['occurrences']) || normalizeText(target['occurrences']) || '当前项目',
    description: sanitizeStoryAssetPublicDescriptionText(args['description']),
    scriptFacts: stripStoryAssetInternalEvidenceMetadata(args['scriptFacts']),
    visualDesign: stripStoryAssetInternalEvidenceMetadata(args['visualDesign']),
    prompt: sanitizeStoryAssetPublicPromptText2,
    imageUrl: normalizeText(args['imageUrl']),
    referenceImageUrl: normalizeText(args['referenceImageUrl']),
    error: normalizeText(args['error']),
  };
}
export function normalizeStoryAsset(args2 = {}, source = 0) {
  const text6 = normalizeText(args2['id']) || 'story-asset-' + (source + 1),
    next = ['scene', 'prop']['includes'](args2['kind']) ? args2['kind'] : 'character',
    storyAssetDisplayName = normalizeStoryAssetDisplayName(args2['name'], next, source),
    current =
      Array['isArray'](args2['appearances']) && args2['appearances']['length']
        ? args2['appearances']
        : [
            {
              id: text6 + '-appearance-1',
              name: '基础形象',
              occurrences: args2['occurrences'],
              prompt: buildLegacyPrompt(args2),
              imageUrl: args2['imageUrl'],
              generatedImage: args2['generatedImage'],
            },
          ],
    entry = current['map']((record, count2) =>
      normalizeStoryAssetAppearance(record, {
        assetId: text6,
        index: count2,
        occurrences: args2['occurrences'],
        fallbackPrompt: count2 === 0 ? buildLegacyPrompt(args2) : '',
      }),
    ),
    text7 = normalizeText(args2['baseAppearanceId']),
    payload =
      next === 'character' && entry['length'] > 1
        ? entry['find']((handle) => handle['id'] === text7) ||
          entry['find']((state) => state['isBaseAppearance'] === true) ||
          entry['find']((config) => normalizeText(config['name']) === '基础形象') ||
          entry[0]
        : null;
  return {
    ...args2,
    id: text6,
    kind: next,
    name: storyAssetDisplayName,
    description: sanitizeStoryAssetPublicDescriptionText(args2['description']),
    scriptFacts: stripStoryAssetInternalEvidenceMetadata(args2['scriptFacts']),
    visualDesign: stripStoryAssetInternalEvidenceMetadata(args2['visualDesign']),
    prompt: sanitizeStoryAssetPublicPromptText(args2['prompt']),
    role:
      next === 'character'
        ? normalizeStoryCharacterRole(args2['role'], storyAssetDisplayName)
        : normalizeText(args2['role']),
    baseAppearanceId: payload?.['id'] || '',
    appearances: entry,
  };
}
export function normalizeStoryWorkspaceAssetData(options3 = {}) {
  const args3 = options3 && typeof options3 === 'object' ? options3 : {},
    args4 = { ...args3 };
  if (args3['project']?.['sourceMode'] === 'video-replication') {
    args4['project'] = { ...args3['project'] };
    for (const scope of ['videoStylePrompt', 'videoStyle', 'customVideoStylePrompt']) {
      normalizeText(args4['project'][scope]) === '保留原视频的视觉风格、场景和道具' &&
        (args4['project'][scope] = '');
    }
  }
  const input = args3['project']?.['sourceMode'] === 'video-replication',
    output = Array['isArray'](args3['assets'])
      ? args3['assets']['map']((value2, value3) => normalizeStoryAsset(value2, value3))
      : [],
    value4 = Array['isArray'](args3['episodes'])
      ? args3['episodes']['map']((value5) => {
          const args5 = discardStaleStoryEpisodeSplitTransportDraft(ensureUniqueStoryEpisodeClipIds(value5));
          return {
            ...args5,
            clips: Array['isArray'](args5?.['clips'])
              ? args5['clips']['map']((value6) =>
                  syncStoryEpisodeClipDialogueMentions(value6, output, {
                    includeDialogueVoiceGuidance: input,
                    sourceMode: args3['project']?.['sourceMode'],
                  }),
                )
              : [],
          };
        })
      : [];
  return {
    ...args4,
    assets: output,
    episodes: value4,
    clipFrames: normalizeStoryClipFrames(args3['clipFrames']),
  };
}
export function getStoryAssetAppearances(options4 = {}) {
  return getWorkspaceAssetAppearances(options4);
}
export function getStoryAssetAppearance(options5 = {}, value7 = 0) {
  return getWorkspaceAssetAppearance(options5, value7);
}
export function getStoryAssetBaseAppearance(options6 = {}) {
  return getWorkspaceAssetBaseAppearance(options6);
}
export function getPreferredStoryAssetBaseAppearance(options7 = {}) {
  const storyAssetAppearances = getStoryAssetAppearances(options7);
  return (
    getStoryAssetBaseAppearance(options7) ||
    storyAssetAppearances['find']((value8) => normalizeText(value8['name']) === '基础形象') ||
    storyAssetAppearances[0] ||
    null
  );
}
export function isStoryAssetBaseAppearance(options8 = {}, enabled3 = null) {
  if (options8['kind'] !== 'character' || !enabled3) return false;
  const list = getStoryAssetAppearances(options8);
  if (list['length'] === 1) return normalizeText(list[0]?.['id']) === normalizeText(enabled3['id']);
  const storyAssetBaseAppearance = getStoryAssetBaseAppearance(options8);
  return Boolean(
    storyAssetBaseAppearance &&
    normalizeText(storyAssetBaseAppearance['id']) === normalizeText(enabled3['id']),
  );
}
export function setStoryAssetBaseAppearance(options9 = {}, value9 = '') {
  if (options9['kind'] !== 'character' || getStoryAssetAppearances(options9)['length'] < 2) return false;
  const storyAssetAppearances2 = getStoryAssetAppearances(options9)['find'](
    (value10) => normalizeText(value10['id']) === normalizeText(value9),
  );
  if (!storyAssetAppearances2) return false;
  return ((options9['baseAppearanceId'] = storyAssetAppearances2['id']), true);
}
export function ensureStoryAssetBaseAppearance(options10 = {}) {
  if (options10['kind'] !== 'character' || getStoryAssetAppearances(options10)['length'] < 2) return false;
  if (getStoryAssetBaseAppearance(options10)) return false;
  const preferredStoryAssetBaseAppearance = getPreferredStoryAssetBaseAppearance(options10);
  if (!preferredStoryAssetBaseAppearance) return false;
  return ((options10['baseAppearanceId'] = preferredStoryAssetBaseAppearance['id']), true);
}
export function shouldGenerateStoryAssetBaseAppearanceFirst(options11 = {}, value11 = null) {
  const storyAssetAppearances3 = getStoryAssetAppearances(options11);
  if (options11['kind'] !== 'character' || storyAssetAppearances3['length'] < 2) return false;
  const preferredStoryAssetBaseAppearance2 = getPreferredStoryAssetBaseAppearance(options11);
  if (!preferredStoryAssetBaseAppearance2 || normalizeText(preferredStoryAssetBaseAppearance2['imageUrl']))
    return false;
  return normalizeText(preferredStoryAssetBaseAppearance2['id']) !== normalizeText(value11?.['id']);
}
export function resolveStoryAssetAppearanceOriginalUrl(options12 = {}) {
  const value12 =
    options12['generatedImages']?.[Math['max'](0, Number(options12['activeIndex']) || 0)] ||
    options12['generatedImage'] ||
    {};
  return resolveCanvasImagePreviewUrl(value12) || normalizeText(options12['imageUrl']);
}
export function getStoryAssetAppearanceReferenceUrls(options13 = {}, value13 = null) {
  const storyAssetAppearances4 = getStoryAssetAppearances(options13);
  if (options13['kind'] !== 'character' || storyAssetAppearances4['length'] === 0) return [];
  const enabled4 =
    storyAssetAppearances4['length'] === 1
      ? storyAssetAppearances4[0]
      : getStoryAssetBaseAppearance(options13);
  if (!enabled4 || !normalizeText(value13?.['id'])) return [];
  if (normalizeText(enabled4['id']) === normalizeText(value13['id'])) {
    const canvasImagePreviewUrl =
      resolveCanvasImagePreviewUrl(enabled4['referenceImage'] || {}) ||
      normalizeText(enabled4['referenceImageUrl']);
    if (!canvasImagePreviewUrl) return [];
    return [resolveStoryAssetAppearanceOriginalUrl(enabled4), canvasImagePreviewUrl]['filter'](Boolean);
  }
  if (!normalizeText(enabled4['imageUrl'])) return [];
  return [
    resolveStoryAssetAppearanceOriginalUrl(enabled4),
    resolveCanvasImagePreviewUrl(value13['referenceImage'] || {}) ||
      normalizeText(value13['referenceImageUrl']),
  ]['filter'](Boolean);
}
export function buildStoryAssetAppearanceGenerationTasks(
  list2 = [],
  { includeExisting: includeExisting = false } = {},
) {
  return (Array['isArray'](list2) ? list2 : [])['flatMap']((value14) => {
    const storyAssetAppearances5 = getStoryAssetAppearances(value14),
      list3 = includeExisting
        ? storyAssetAppearances5
        : storyAssetAppearances5['filter']((value15) => !normalizeText(value15['imageUrl']));
    if (value14['kind'] !== 'character' || storyAssetAppearances5['length'] < 2)
      return list3['map']((value16) => ({ asset: value14, appearance: value16 }));
    const preferredStoryAssetBaseAppearance3 = getPreferredStoryAssetBaseAppearance(value14);
    if (
      !preferredStoryAssetBaseAppearance3 ||
      (!includeExisting && normalizeText(preferredStoryAssetBaseAppearance3['imageUrl']))
    )
      return list3['map']((value17) => ({ asset: value14, appearance: value17 }));
    return [...list3]
      ['sort'](
        (value18, value19) =>
          Number(value19['id'] === preferredStoryAssetBaseAppearance3?.['id']) -
          Number(value18['id'] === preferredStoryAssetBaseAppearance3?.['id']),
      )
      ['map']((value20) => ({ asset: value14, appearance: value20 }));
  });
}
export async function runStoryAssetAppearanceGenerationTasks(
  list4 = [],
  handler = null,
  { shouldStop: shouldStop = () => false } = {},
) {
  if (typeof handler !== 'function') return [];
  const args6 = new Map();
  (Array['isArray'](list4) ? list4 : [])['forEach']((value21, value22) => {
    const value23 = value21?.['asset'],
      text8 = normalizeText(value23?.['id']) || value23 || 'story-asset-task-' + value22;
    if (!args6['has'](text8)) args6['set'](text8, []);
    args6['get'](text8)['push']({ task: value21, taskIndex: value22 });
  });
  const value24 = new Array(Array['isArray'](list4) ? list4['length'] : 0);
  return (
    await Promise['all'](
      [...args6['values']()]['map'](async (value25) => {
        for (let value26 = 0; value26 < value25['length']; value26 += 1) {
          const { task: task, taskIndex: taskIndex } = value25[value26];
          if (
            shouldStop({
              task: task,
              taskIndex: taskIndex,
              laneIndex: value26,
              laneLength: value25['length'],
            })
          )
            break;
          value24[taskIndex] = await handler(task, {
            taskIndex: taskIndex,
            laneIndex: value26,
            laneLength: value25['length'],
            remainingTasks: value25['slice'](value26 + 1)['map']((value27) => value27['task']),
          });
        }
      }),
    ),
    value24
  );
}
export function getStoryAssetAppearanceStats(options14 = {}) {
  return getWorkspaceAssetAppearanceStats(options14);
}

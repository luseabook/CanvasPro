import { normalizeImageGenerationResult } from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { normalizeAudioGenerationResult } from '../../components/audio-node/audioGenerationResultRenderer.js';
import { normalizeVideoGenerationResult } from '../../components/video-node/videoGenerationResultRenderer.js';
import { createDefaultStoryboardScriptState } from '../../core/storyboardScriptFactory.js';
import { buildCanvasLocalImageFields } from '../../services/canvasMediaLocalService.js';
import { getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import { resolveOutputMediaSize } from '../../services/mediaRatioService.js';
import { localPathToUrl, normalizeLocalPath } from '../../utils/localMediaPath.js';
import { calculateGroupNodeBounds } from '../groupNodeLayout.js';
import { buildStoryClipCanvasBindingKey, buildStoryLinkedCanvasName } from './storyCanvasBinding.js';
import { buildStoryClipCanvasNodeData } from './storyEpisodeCanvas.js';
import { normalizeStoryClipInputs } from './storyClipInputSlots.js';
import { resolveStoryClipPromptAssetRefs } from './storyClipMentions.js';
const NODE_GAP = 72,
  ASSET_COLUMNS = 5,
  ASSET_CATEGORY_GAP = 180,
  ASSET_CATEGORY_NOTE_HEIGHT = 180,
  ASSET_CATEGORY_MIN_WIDTH = 720,
  STAGE_GAP = 320,
  STAGE_GROUP_COLORS = Object.freeze({
    project: 'var(--indigo)',
    assets: 'var(--green)',
    episode: Object.freeze(['var(--gold)', 'var(--purple)', 'var(--cyan)']),
  });
export const STORY_PROJECT_CANVAS_LAYOUT_VERSION = 4;
export const STORY_PROJECT_CANVAS_NODE_SIZES = Object.freeze({
  'comment-note': Object.freeze({ width: 1400, height: 288 }),
  group: Object.freeze({ width: 512, height: 368 }),
  'source-text': Object.freeze({ width: 720, height: 480 }),
  'source-image': Object.freeze({ width: 512, height: 288 }),
  'source-video': Object.freeze({ width: 512, height: 288 }),
  'source-audio': Object.freeze({ width: 420, height: 180 }),
  'ai-image': Object.freeze({ width: 288, height: 288 }),
  'storyboard-script': Object.freeze({ width: 1024, height: 576 }),
  'ai-video': Object.freeze({ width: 512, height: 288 }),
});
function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}
function normalizeText(item) {
  return String(item || '').trim();
}
function normalizeIndex(index, count) {
  const result = Number(index);
  if (!Number.isFinite(result) || count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.trunc(result)));
}
function normalizeList(list) {
  return Array.isArray(list) ? list.filter(Boolean) : [];
}
export const storyWorkspaceCanvasMaterializationBindingPolicy = Object.freeze({
  getProjectId(data) {
    return normalizeText(data?.storyWorkspaceBinding?.projectId);
  },
  findProjectAnchor({ nodes: nodes = [], projectId: projectId } = {}) {
    const text = normalizeText(projectId);
    if (!text) return null;
    const list2 = (Array.isArray(nodes) ? nodes : []).filter(
      (options) => normalizeText(options?.storyWorkspaceBinding?.projectId) === text,
    );
    return (
      list2.find(
        (target) =>
          target?.storyWorkspaceBinding?.kind === 'stage-group' &&
          target?.storyWorkspaceBinding?.stage === 'project',
      ) ||
      list2.find((source) => source?.storyWorkspaceBinding?.kind === 'stage-group') ||
      list2.find((next) => next?.storyWorkspaceBinding?.kind === 'project-overview') ||
      null
    );
  },
});
function pushLabeledLine(list3, current, entry) {
  const text2 = normalizeText(entry);
  if (text2) list3.push(current + '：' + text2);
}
function getEpisodeLabel(options2 = {}) {
  const count2 = Math.max(0, Math.trunc(Number(options2.number) || 0));
  return [count2 > 0 ? '第 ' + count2 + ' 集' : '分集', normalizeText(options2.title)]
    .filter(Boolean)
    .join(' · ');
}
function getStableKeyPart(record, payload) {
  return normalizeText(record) || payload;
}
function getAssetKindLabel(handle) {
  if (handle === 'scene') return '场景';
  if (handle === 'prop') return '道具';
  return '角色';
}
function getPositiveMediaDimension(...args) {
  for (const state of args) {
    const count3 = Number(state);
    if (Number.isFinite(count3) && count3 > 0) return count3;
  }
  return 0;
}
function resolveStoryAssetCanvasGeometry({
  asset: asset = {},
  appearance: appearance = {},
  activeImage: activeImage = {},
} = {}) {
  const width = STORY_PROJECT_CANVAS_NODE_SIZES['ai-image'],
    box = asObject(appearance.generatedImage),
    box2 = asObject(asset.generatedImage),
    imageWidth = getPositiveMediaDimension(
      appearance.imageWidth,
      appearance.naturalWidth,
      appearance.originalWidth,
      appearance.width,
      activeImage.imageWidth,
      activeImage.naturalWidth,
      activeImage.originalWidth,
      activeImage.width,
      box.imageWidth,
      box.naturalWidth,
      box.originalWidth,
      box.width,
      asset.imageWidth,
      asset.naturalWidth,
      asset.originalWidth,
      asset.width,
      box2.imageWidth,
      box2.naturalWidth,
      box2.originalWidth,
      box2.width,
    ),
    imageHeight = getPositiveMediaDimension(
      appearance.imageHeight,
      appearance.naturalHeight,
      appearance.originalHeight,
      appearance.height,
      activeImage.imageHeight,
      activeImage.naturalHeight,
      activeImage.originalHeight,
      activeImage.height,
      box.imageHeight,
      box.naturalHeight,
      box.originalHeight,
      box.height,
      asset.imageHeight,
      asset.naturalHeight,
      asset.originalHeight,
      asset.height,
      box2.imageHeight,
      box2.naturalHeight,
      box2.originalHeight,
      box2.height,
    );
  if (!(imageWidth > 0 && imageHeight > 0))
    return { width: width.width, height: width.height, imageWidth: 0, imageHeight: 0 };
  return {
    ...getAutoMediaSizeByShortSide(imageWidth, imageHeight),
    imageWidth: imageWidth,
    imageHeight: imageHeight,
  };
}
async function resolveStoryAssetImageRecordSize(asset2 = {}) {
  const storyAssetCanvasGeometry = resolveStoryAssetCanvasGeometry({
    asset: asset2,
    appearance: asset2,
    activeImage: asObject(asset2.generatedImage),
  });
  if (storyAssetCanvasGeometry.imageWidth > 0 && storyAssetCanvasGeometry.imageHeight > 0)
    return asset2;
  const response = asObject(asset2.generatedImage),
    imageWidth2 = await resolveOutputMediaSize({
      localPath: normalizeText(response.localPath || response.originalLocalPath || asset2.localPath),
      imageUrl: normalizeText(asset2.imageUrl || response.imageUrl || response.url),
      sourceUrl: normalizeText(response.sourceUrl),
      thumbUrl: normalizeText(response.thumbUrl),
    });
  return imageWidth2
    ? { ...asset2, imageWidth: imageWidth2.width, imageHeight: imageWidth2.height }
    : asset2;
}
async function resolveStoryProjectAssetImageSizes(list4 = []) {
  return Promise.all(
    normalizeList(list4).map(async (args2) => {
      const list5 = normalizeList(args2.appearances);
      if (!list5.length) return resolveStoryAssetImageRecordSize(args2);
      return {
        ...args2,
        appearances: await Promise.all(list5.map((config) => resolveStoryAssetImageRecordSize(config))),
      };
    }),
  );
}
function createPlanEntry(key2, data2, box3, box4 = {}) {
  const type = normalizeText(data2?.type),
    box5 = STORY_PROJECT_CANVAS_NODE_SIZES[type];
  if (!type || !box5) throw new Error('不支持的项目画布节点类型：' + (type || 'unknown'));
  const width2 = Math.max(1, Number(box4.width) || box5.width),
    height = Math.max(1, Number(box4.height) || box5.height),
    inputConnections = normalizeList(box4.inputConnections)
      .map((event) => {
        if (typeof event === 'string') return { key: normalizeText(event), preferredRefSlot: '' };
        return {
          key: normalizeText(event?.key),
          preferredRefSlot: normalizeText(event?.preferredRefSlot),
        };
      })
      .filter((event2) => event2.key);
  return {
    key: key2,
    type: type,
    data: data2,
    width: width2,
    height: height,
    position: { x: Number(box3?.x) || 0, y: Number(box3?.y) || 0 },
    ...(normalizeText(box4.parentKey) ? { parentKey: normalizeText(box4.parentKey) } : {}),
    ...(normalizeList(box4.inputKeys).length
      ? { inputKeys: normalizeList(box4.inputKeys).map(normalizeText).filter(Boolean) }
      : {}),
    ...(inputConnections.length ? { inputConnections: inputConnections } : {}),
  };
}
export function buildStoryProjectCanvasName(options3 = {}, scope = {}) {
  return buildStoryLinkedCanvasName(options3, scope);
}
export function buildStoryProjectOverviewNodeData({ project: project = {} } = {}) {
  const content2 = [];
  return (
    pushLabeledLine(content2, '项目名称', buildStoryProjectCanvasName(project)),
    pushLabeledLine(content2, '类型', project.storyType),
    pushLabeledLine(content2, '目标受众', project.targetAudience),
    pushLabeledLine(content2, '一句话故事', project.logline),
    pushLabeledLine(content2, '故事摘要', project.summary),
    pushLabeledLine(content2, '故事背景', project.background),
    pushLabeledLine(content2, '世界设定', project.setting),
    pushLabeledLine(content2, '核心钩子', project.coreHook),
    {
      type: 'source-text',
      name: buildStoryProjectCanvasName(project) + ' · 项目设定',
      content: content2.join('\n\n'),
      storyWorkspaceBinding: { projectId: normalizeText(project.id), kind: 'project-overview' },
    }
  );
}
export function buildStoryProjectCopyNodeData({ project: project = {} } = {}) {
  const content3 = [],
    text3 = normalizeText(project.originalCreative || project.sourceDocument?.text);
  if (text3) content3.push('原始创意\n' + text3);
  const text4 = normalizeText(project.plotScript);
  if (text4 && text4 !== text3) content3.push('完整文案\n' + text4);
  const text5 = normalizeText(project.narrationScript);
  return (
    text5 && text5 !== text4 && text5 !== text3 && content3.push('旁白文案\n' + text5),
    {
      type: 'source-text',
      name: buildStoryProjectCanvasName(project) + ' · 完整文案',
      content: content3.join('\n\n---\n\n'),
      storyWorkspaceBinding: { projectId: normalizeText(project.id), kind: 'project-copy' },
    }
  );
}
export function buildStoryAssetCanvasNodeData({
  project: project = {},
  asset: asset = {},
  appearance: appearance = {},
  modelId: modelId = '',
  provider: provider = '',
  generationParams: generationParams = {},
} = {}) {
  const response2 = asObject(appearance.generatedImage),
    imageUrl = normalizeText(
      appearance.imageUrl ||
        response2.imageUrl ||
        response2.url ||
        response2.sourceUrl ||
        asset.imageUrl,
    ),
    images =
      Array.isArray(appearance.generatedImages) && appearance.generatedImages.length
        ? appearance.generatedImages
        : Object.keys(response2).length > 0
          ? [{ ...response2, imageUrl: imageUrl || response2.imageUrl }]
          : imageUrl
            ? [{ url: imageUrl, imageUrl: imageUrl, sourceUrl: imageUrl, thumbUrl: imageUrl }]
            : [],
    images2 = normalizeImageGenerationResult({ images: images }).items,
    mainImageIndex = normalizeIndex(appearance.activeIndex, images2.length),
    activeImage2 = images2[mainImageIndex] || {},
    width3 = resolveStoryAssetCanvasGeometry({
      asset: asset,
      appearance: appearance,
      activeImage: activeImage2,
    }),
    text6 = normalizeText(appearance.name),
    output = !text6 || text6 === '基础形象';
  return {
    type: 'ai-image',
    name: [getAssetKindLabel(asset.kind), normalizeText(asset.name), output ? '' : text6]
      .filter(Boolean)
      .join(' · '),
    prompt: normalizeText(
      appearance.prompt || asset.prompt || appearance.description || asset.description,
    ),
    model: normalizeText(appearance.modelId || appearance.generation?.modelId || modelId),
    provider: normalizeText(appearance.provider || appearance.generation?.provider || provider),
    generationParams: { ...asObject(generationParams), ...asObject(appearance.generationParams) },
    images: images2,
    mainImageIndex: mainImageIndex,
    isImagesExpanded: false,
    imageUrl: normalizeText(activeImage2.imageUrl || activeImage2.url || imageUrl),
    sourceUrl: normalizeText(activeImage2.sourceUrl),
    thumbUrl: normalizeText(activeImage2.thumbUrl),
    localPath: normalizeText(activeImage2.localPath),
    originalLocalPath: normalizeText(activeImage2.originalLocalPath),
    displayLocalPath: normalizeText(activeImage2.displayLocalPath),
    thumbLocalPath: normalizeText(activeImage2.thumbLocalPath),
    sourceId: normalizeText(activeImage2.sourceId),
    thumbId: normalizeText(activeImage2.thumbId),
    width: width3.width,
    height: width3.height,
    ...(width3.imageWidth > 0 && width3.imageHeight > 0
      ? { imageWidth: width3.imageWidth, imageHeight: width3.imageHeight }
      : {}),
    storyWorkspaceBinding: {
      projectId: normalizeText(project.id),
      kind: 'asset-image',
      assetId: normalizeText(asset.id),
      appearanceId: normalizeText(appearance.id),
      assetKind: normalizeText(asset.kind) || 'character',
    },
  };
}
export function buildStoryEpisodeCopyNodeData({ project: project = {}, episode: episode = {} } = {}) {
  const content4 = [];
  (pushLabeledLine(content4, '分集', getEpisodeLabel(episode)),
    pushLabeledLine(content4, '本集梗概', episode.synopsis),
    pushLabeledLine(content4, '本集钩子', episode.hook || episode.coreHook));
  const text7 = normalizeText(
    typeof episode.script === 'string' ? episode.script : episode.script?.fullText,
  );
  if (text7) content4.push('完整剧本\n' + text7);
  return {
    type: 'source-text',
    name: getEpisodeLabel(episode) + ' · 分集文案',
    content: content4.join('\n\n'),
    storyWorkspaceBinding: {
      projectId: normalizeText(project.id),
      episodeId: normalizeText(episode.id),
      kind: 'episode-copy',
    },
  };
}
function buildAssetLookup(list6 = []) {
  const map = new Map();
  return (
    normalizeList(list6).forEach((value2) => {
      [value2.id, value2.planningRef]
        .map(normalizeText)
        .filter(Boolean)
        .forEach((value3) => {
          map.set(value3, value2);
        });
    }),
    map
  );
}
function describeShotAssets(value4, map2) {
  const promise = { character: [], scene: [], prop: [], all: [] };
  return (
    normalizeList(value4).forEach((value5) => {
      const text8 = normalizeText(value5?.assetRef),
        error = map2.get(text8);
      if (!error) return;
      const text9 = normalizeText(error.name) || text8,
        text10 = normalizeText(value5?.appearanceRef),
        error2 = normalizeList(error.appearances).find(
          (value6) =>
            normalizeText(value6?.id) === text10 || normalizeText(value6?.planningRef) === text10,
        ),
        value7 =
          error2 && normalizeText(error2.name) !== '基础形象'
            ? text9 + ' · ' + normalizeText(error2.name)
            : text9,
        value8 = ['character', 'scene', 'prop'].includes(error.kind) ? error.kind : 'character';
      if (!promise[value8].includes(value7)) promise[value8].push(value7);
      if (!promise.all.includes(value7)) promise.all.push(value7);
    }),
    promise
  );
}
export function buildStoryEpisodeStoryboardNodeData({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
} = {}) {
  const assetLookup = buildAssetLookup(assets),
    rows = [];
  normalizeList(episode.clips).forEach((value9, value10) => {
    normalizeList(value9.shots).forEach((value11, value12) => {
      const promise2 = describeShotAssets(value11.assetUsages, assetLookup),
        count4 = Number(value11.durationSec || value11.durationSeconds);
      rows.push({
        镜号:
          Math.max(1, Math.trunc(Number(value9.number) || value10 + 1)) + '-' + (value12 + 1),
        时长:
          normalizeText(value11.time) || (Number.isFinite(count4) && count4 > 0 ? count4 + 's' : ''),
        场景: promise2.scene.join('、'),
        画面描述: normalizeText(value11.visual),
        角色: promise2.character.join('、'),
        角色描述: promise2.character.join('、'),
        角色动作: normalizeText(value11.action),
        情绪: normalizeText(value11.emotion || value9.creativeIntent),
        参考: promise2.all.join('、'),
        图片提示词: normalizeText(value11.imagePrompt),
        视频提示词: normalizeText(value11.videoPrompt || value9.prompt),
        对白: [normalizeText(value11.dialogue), normalizeText(value11.voiceover)]
          .filter(Boolean)
          .join('\n'),
        音效: normalizeText(value11.audio),
      });
    });
  });
  const name2 = getEpisodeLabel(episode) + ' · 分镜表';
  return {
    type: 'storyboard-script',
    name: name2,
    storyboardScript: createDefaultStoryboardScriptState({
      title: name2,
      mediaMode: 'video',
      rows: rows,
    }),
    storyWorkspaceBinding: {
      projectId: normalizeText(project.id),
      episodeId: normalizeText(episode.id),
      kind: 'episode-storyboard',
    },
  };
}
function buildStoryStageAnnotationNodeData({
  project: project = {},
  episode: episode = null,
  stage: stage = '',
  title: title = '',
  content: content = '',
} = {}) {
  return {
    type: 'comment-note',
    name: normalizeText(title),
    content: normalizeText(content),
    style: { fontSize: 40, textColor: 'white', backgroundColor: 'transparent' },
    storyWorkspaceBinding: {
      projectId: normalizeText(project.id),
      episodeId: normalizeText(episode?.id),
      kind: 'stage-annotation',
      stage: normalizeText(stage),
      canvasScope: 'project',
    },
  };
}
function normalizeStoryAssetKind(value13) {
  const text11 = normalizeText(value13);
  return ['character', 'scene', 'prop'].includes(text11) ? text11 : 'character';
}
function buildStoryClipInputMediaLocation(response3 = {}) {
  const text12 = normalizeText(
      response3?.url ||
        response3?.localUrl ||
        response3?.imageUrl ||
        response3?.videoUrl ||
        response3?.audioUrl ||
        response3?.localPath,
    ),
    localPath = normalizeLocalPath(text12);
  return { localPath: localPath, url: localPathToUrl(localPath) || text12 };
}
function buildStoryClipInputCanvasNodeData({
  project: project = {},
  episode: episode = {},
  clip: clip = {},
  input: input = {},
  kind: kind = 'image',
  inputIndex: inputIndex = 0,
} = {}) {
  const localPath2 = buildStoryClipInputMediaLocation(input);
  if (!localPath2.url) return null;
  const episodeLabel = getEpisodeLabel(episode),
    value14 = Math.max(1, Math.trunc(Number(clip.number) || 1)),
    value15 = { image: '图片入参', video: '视频入参', audio: '音频入参' }[kind] || '媒体入参',
    name3 =
      normalizeText(input.name) ||
      episodeLabel + ' · 片段 ' + value14 + ' · ' + value15 + ' ' + (inputIndex + 1),
    storyWorkspaceBinding = {
      projectId: normalizeText(project.id),
      episodeId: normalizeText(episode.id),
      clipId: normalizeText(clip.id),
      kind: 'clip-input',
      inputKind: kind,
      slotId: normalizeText(input.slotId),
      canvasScope: 'project',
    };
  if (kind === 'video') {
    const videos = normalizeVideoGenerationResult({
      videos: [{ localPath: localPath2.localPath, videoUrl: localPath2.url }],
    }).items[0];
    return {
      type: 'source-video',
      name: name3,
      videos: videos ? [videos] : [],
      mainVideoIndex: 0,
      videoUrl: normalizeText(videos?.videoUrl || localPath2.url),
      localPath: normalizeText(videos?.localPath || localPath2.localPath),
      storyWorkspaceBinding: storyWorkspaceBinding,
    };
  }
  if (kind === 'audio') {
    const audios = normalizeAudioGenerationResult({
      audios: [{ localPath: localPath2.localPath, audioUrl: localPath2.url }],
    }).items[0];
    return {
      type: 'source-audio',
      name: name3,
      fileName: name3,
      audios: audios ? [audios] : [],
      mainAudioIndex: 0,
      audioUrl: normalizeText(audios?.audioUrl || localPath2.url),
      localPath: normalizeText(audios?.localPath || localPath2.localPath),
      storyWorkspaceBinding: storyWorkspaceBinding,
    };
  }
  const images3 = normalizeImageGenerationResult({
    images: [
      {
        localPath: localPath2.localPath,
        imageUrl: localPath2.url,
        sourceUrl: localPath2.url,
        ...buildCanvasLocalImageFields(input),
      },
    ],
  }).items[0];
  return {
    type: 'source-image',
    name: name3,
    images: images3 ? [images3] : [],
    mainImageIndex: 0,
    imageUrl: normalizeText(images3?.imageUrl || localPath2.url),
    sourceUrl: normalizeText(images3?.sourceUrl || localPath2.url),
    localPath: normalizeText(images3?.localPath || localPath2.localPath),
    ...buildCanvasLocalImageFields(images3 || {}),
    storyWorkspaceBinding: storyWorkspaceBinding,
  };
}
function findStoryAssetCanvasRecord(list7 = [], value16 = {}) {
  const text13 = normalizeText(
      value16.storyAssetId || value16.sourceStoryAssetId || value16.assetRef || value16.assetId,
    ),
    text14 = normalizeText(
      value16.appearanceId || value16.appearanceRef || value16.storyAppearanceId,
    ),
    storyClipInputMediaLocation = buildStoryClipInputMediaLocation(value16).url,
    list8 = normalizeList(list7).filter(
      (value17) => !text13 || normalizeList(value17.assetRefs).includes(text13),
    ),
    value18 = list8.find(
      (value19) => text14 && normalizeList(value19.appearanceRefs).includes(text14),
    );
  if (value18) return value18;
  if (storyClipInputMediaLocation) {
    const list9 = normalizeList(list7).find((value20) =>
      normalizeList(value20.imageRefs).includes(storyClipInputMediaLocation),
    );
    if (list9) return list9;
  }
  return text13 ? list8[0] || null : null;
}
function buildStoryClipCanvasInputPlan({
  project: project = {},
  episode: episode = {},
  clip: clip = {},
  assets: assets = [],
  assetRecords: assetRecords = [],
  clipKey: clipKey = '',
} = {}) {
  const map3 = new Map(),
    handler = (value21, value22 = '') => {
      const key3 = normalizeText(value21);
      if (!key3) return;
      const preferredRefSlot = normalizeText(value22),
        enabled = map3.get(key3);
      (!enabled || (!enabled.preferredRefSlot && preferredRefSlot)) &&
        map3.set(key3, { key: key3, preferredRefSlot: preferredRefSlot });
    },
    handler2 = (value23, value24 = '') => {
      const event3 = findStoryAssetCanvasRecord(assetRecords, value23);
      if (event3?.key) handler(event3.key, value24);
      return event3;
    };
  ([
    ...normalizeList(clip.assetUsages),
    ...normalizeList(clip.shots).flatMap((value25) => normalizeList(value25?.assetUsages)),
  ].forEach((value26) => handler2(value26)),
    normalizeList(clip.assetIds).forEach((assetId) => {
      handler2({ assetId: assetId });
    }),
    resolveStoryClipPromptAssetRefs(clip.prompt, { assets: assets, episode: episode }).forEach(
      (value27) => handler2(value27),
    ));
  const inputEntries = [],
    storyClipInputs = normalizeStoryClipInputs(clip.inputs);
  return (
    ['image', 'video', 'audio'].forEach((kind2) => {
      normalizeList(storyClipInputs[kind2]).forEach((input2, inputIndex2) => {
        const text15 = normalizeText(input2.slotId),
          value28 = handler2(input2, text15);
        if (value28) return;
        const data3 = buildStoryClipInputCanvasNodeData({
          project: project,
          episode: episode,
          clip: clip,
          input: input2,
          kind: kind2,
          inputIndex: inputIndex2,
        });
        if (!data3) return;
        const encodeURIComponent2 = encodeURIComponent(text15 || kind2 + '-' + (inputIndex2 + 1)),
          key4 = clipKey + ':input:' + kind2 + ':' + encodeURIComponent2;
        (inputEntries.push({
          key: key4,
          data: data3,
          width: STORY_PROJECT_CANVAS_NODE_SIZES[data3.type].width,
          height: STORY_PROJECT_CANVAS_NODE_SIZES[data3.type].height,
        }),
          handler(key4, text15));
      });
    }),
    { inputEntries: inputEntries, inputConnections: [...map3.values()] }
  );
}
function getPlanBounds(list10 = []) {
  const list11 = normalizeList(list10);
  if (!list11.length) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  const left = Math.min(...list11.map((value29) => value29.position.x)),
    top = Math.min(...list11.map((value30) => value30.position.y)),
    right = Math.max(...list11.map((box6) => box6.position.x + box6.width)),
    bottom = Math.max(...list11.map((box7) => box7.position.y + box7.height));
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: right - left,
    height: bottom - top,
  };
}
function wrapStoryStageEntriesInGroup({
  entries: entries = [],
  project: project = {},
  episode: episode = null,
  key: key = '',
  stage: stage = '',
  name: name = '',
  color: color = 'var(--indigo)',
} = {}) {
  const list12 = normalizeList(entries).filter((value31) => value31.type !== 'group');
  if (!list12.length) return [];
  const width4 = calculateGroupNodeBounds(
      list12.map((x) => ({
        x: x.position.x,
        y: x.position.y,
        width: x.width,
        height: x.height,
      })),
    ),
    parentKey = normalizeText(key),
    planEntry = createPlanEntry(
      parentKey,
      {
        type: 'group',
        name: normalizeText(name),
        color: color,
        width: width4.width,
        height: width4.height,
        storyWorkspaceBinding: {
          projectId: normalizeText(project.id),
          episodeId: normalizeText(episode?.id),
          kind: 'stage-group',
          stage: normalizeText(stage),
          canvasScope: 'project',
        },
      },
      { x: width4.x, y: width4.y },
      { width: width4.width, height: width4.height },
    );
  return [planEntry, ...list12.map((args3) => ({ ...args3, parentKey: parentKey }))];
}
function appendHorizontalStoryStage(list13, list14, value32) {
  const box8 = getPlanBounds(list14),
    value33 = value32 - box8.left,
    value34 = -box8.top;
  return (
    list13.push(
      ...list14.map((x2) => ({
        ...x2,
        position: { x: x2.position.x + value33, y: x2.position.y + value34 },
      })),
    ),
    value32 + box8.width + STAGE_GAP
  );
}
function appendVerticalStoryStage(list15, list16, value35, value36) {
  const box9 = getPlanBounds(list16),
    value37 = value35 - box9.left,
    value38 = value36 - box9.top;
  return (
    list15.push(
      ...list16.map((x3) => ({
        ...x3,
        position: { x: x3.position.x + value37, y: x3.position.y + value38 },
      })),
    ),
    value36 + box9.height + STAGE_GAP
  );
}
export function buildStoryProjectCanvasPlan({
  project: project = {},
  assets: assets = [],
  episodes: episodes = [],
  imageModelId: imageModelId = '',
  imageProvider: imageProvider = '',
  imageGenerationParams: imageGenerationParams = {},
  videoModelId: videoModelId = '',
  videoProvider: videoProvider = '',
  videoGenerationParams: videoGenerationParams = {},
} = {}) {
  const value39 = [],
    height2 = STORY_PROJECT_CANVAS_NODE_SIZES['comment-note'],
    x4 = STORY_PROJECT_CANVAS_NODE_SIZES['source-text'],
    box10 = STORY_PROJECT_CANVAS_NODE_SIZES['ai-video'];
  let appendHorizontalStoryStage2 = 0;
  const entries2 = [],
    y = height2.height + NODE_GAP;
  (entries2.push(
    createPlanEntry(
      'stage:project:annotation',
      buildStoryStageAnnotationNodeData({
        project: project,
        stage: 'project',
        title: '阶段 1 · 项目设定',
        content: '项目摘要、世界设定与完整文案。',
      }),
      { x: 0, y: 0 },
    ),
  ),
    entries2.push(
      createPlanEntry('project:overview', buildStoryProjectOverviewNodeData({ project: project }), {
        x: 0,
        y: y,
      }),
    ));
  const storyProjectCopyNodeData = buildStoryProjectCopyNodeData({ project: project });
  normalizeText(storyProjectCopyNodeData.content) &&
    entries2.push(
      createPlanEntry('project:copy', storyProjectCopyNodeData, { x: x4.width + NODE_GAP, y: y }),
    );
  appendHorizontalStoryStage2 = appendHorizontalStoryStage(
    value39,
    wrapStoryStageEntriesInGroup({
      entries: entries2,
      project: project,
      key: 'stage:project:group',
      stage: 'project',
      name: '阶段 1 · 项目设定',
      color: STAGE_GROUP_COLORS.project,
    }),
    appendHorizontalStoryStage2,
  );
  const entries3 = [],
    assetRecords2 = [];
  normalizeList(assets).forEach((prompt, value40) => {
    const list17 = normalizeList(prompt.appearances),
      list18 =
        list17.length > 0
          ? list17
          : [
              {
                id:
                  getStableKeyPart(prompt.id || prompt.planningRef, 'asset-' + (value40 + 1)) +
                  '-base',
                name: '基础形象',
                prompt: prompt.prompt,
                imageUrl: prompt.imageUrl,
                generatedImage: prompt.generatedImage,
              },
            ];
    list18.forEach((appearance2, value41) => {
      const stableKeyPart = getStableKeyPart(
          prompt.id || prompt.planningRef,
          'asset-' + (value40 + 1),
        ),
        stableKeyPart2 = getStableKeyPart(
          appearance2.id || appearance2.planningRef,
          'appearance-' + (value41 + 1),
        ),
        data4 = buildStoryAssetCanvasNodeData({
          project: project,
          asset: prompt,
          appearance: appearance2,
          modelId: imageModelId,
          provider: imageProvider,
          generationParams: imageGenerationParams,
        }),
        width5 = Math.max(
          1,
          Number(data4.width) || STORY_PROJECT_CANVAS_NODE_SIZES['ai-image'].width,
        ),
        height3 = Math.max(
          1,
          Number(data4.height) || STORY_PROJECT_CANVAS_NODE_SIZES['ai-image'].height,
        );
      assetRecords2.push({
        key: 'asset:' + stableKeyPart + ':' + stableKeyPart2,
        data: data4,
        width: width5,
        height: height3,
        kind: normalizeStoryAssetKind(prompt.kind),
        assetRefs: [prompt.id, prompt.planningRef].map(normalizeText).filter(Boolean),
        appearanceRefs: [appearance2.id, appearance2.planningRef]
          .map(normalizeText)
          .filter(Boolean),
        imageRefs: [
          appearance2.imageUrl,
          appearance2.localPath,
          data4.imageUrl,
          data4.localPath,
          data4.sourceUrl,
          data4.images?.[0]?.imageUrl,
          data4.images?.[0]?.localPath,
        ]
          .map((url) => buildStoryClipInputMediaLocation({ url: url }).url)
          .filter(Boolean),
      });
    });
  });
  const list19 = [
      { kind: 'character', title: '角色素材', content: '人物角色及其形象。' },
      { kind: 'scene', title: '场景素材', content: '场景环境及其视觉参考。' },
      { kind: 'prop', title: '道具素材', content: '道具及其视觉参考。' },
    ],
    value42 = height2.height + NODE_GAP;
  let y2 = value42,
    width6 = height2.width;
  (list19.forEach((title2) => {
    const list20 = assetRecords2.filter((value43) => value43.kind === title2.kind),
      list21 = [];
    for (let value44 = 0; value44 < list20.length; value44 += ASSET_COLUMNS) {
      const items = list20.slice(value44, value44 + ASSET_COLUMNS);
      list21.push({
        items: items,
        width: items.reduce(
          (value45, box11, count5) => value45 + box11.width + (count5 > 0 ? NODE_GAP : 0),
          0,
        ),
        height: Math.max(...items.map((box12) => box12.height)),
      });
    }
    const width7 = Math.max(ASSET_CATEGORY_MIN_WIDTH, ...list21.map((box13) => box13.width));
    ((width6 = Math.max(width6, width7)),
      entries3.push(
        createPlanEntry(
          'stage:assets:' + title2.kind + ':annotation',
          buildStoryStageAnnotationNodeData({
            project: project,
            stage: 'assets-' + title2.kind,
            title: title2.title,
            content: title2.content,
          }),
          { x: 0, y: y2 },
          { width: width7, height: ASSET_CATEGORY_NOTE_HEIGHT },
        ),
      ));
    let y3 = y2 + ASSET_CATEGORY_NOTE_HEIGHT + NODE_GAP;
    list21.forEach((box14) => {
      let x5 = 0;
      (box14.items.forEach((width8) => {
        (entries3.push(
          createPlanEntry(
            width8.key,
            width8.data,
            { x: x5, y: y3 },
            { width: width8.width, height: width8.height },
          ),
        ),
          (x5 += width8.width + NODE_GAP));
      }),
        (y3 += box14.height + NODE_GAP));
    });
    const value46 = list21.length ? y3 - NODE_GAP : y2 + ASSET_CATEGORY_NOTE_HEIGHT;
    y2 = value46 + ASSET_CATEGORY_GAP;
  }),
    entries3.unshift(
      createPlanEntry(
        'stage:assets:annotation',
        buildStoryStageAnnotationNodeData({
          project: project,
          stage: 'assets',
          title: '阶段 2 · 素材设定',
          content: '角色、场景和道具素材。',
        }),
        { x: 0, y: 0 },
        { width: width6, height: height2.height },
      ),
    ),
    (appendHorizontalStoryStage2 = appendHorizontalStoryStage(
      value39,
      wrapStoryStageEntriesInGroup({
        entries: entries3,
        project: project,
        key: 'stage:assets:group',
        stage: 'assets',
        name: '阶段 2 · 素材设定',
        color: STAGE_GROUP_COLORS.assets,
      }),
      appendHorizontalStoryStage2,
    )));
  const value47 = appendHorizontalStoryStage2;
  let appendVerticalStoryStage2 = 0;
  return (
    normalizeList(episodes)
      .slice(0, 1)
      .forEach((episode2, episodeIndex) => {
        const entries4 = [],
          stableKeyPart3 = getStableKeyPart(
            episode2.id || episode2.planningRef,
            'episode-' + (episodeIndex + 1),
          ),
          list22 = [
            createPlanEntry(
              'episode:' + stableKeyPart3 + ':copy',
              buildStoryEpisodeCopyNodeData({ project: project, episode: episode2 }),
              { x: 0, y: 0 },
            ),
          ],
          list23 = normalizeList(episode2.clips).map((clip2, clipIndex) => {
            const clipKey2 = buildStoryClipCanvasBindingKey({
                episode: episode2,
                clip: clip2,
                episodeIndex: episodeIndex,
                clipIndex: clipIndex,
              }),
              inputPlan = buildStoryClipCanvasInputPlan({
                project: project,
                episode: episode2,
                clip: clip2,
                assets: assets,
                assetRecords: assetRecords2,
                clipKey: clipKey2,
              }),
              inputLaneWidth = inputPlan.inputEntries.reduce(
                (value48, box15, count6) => value48 + box15.width + (count6 > 0 ? NODE_GAP : 0),
                0,
              ),
              clipData = buildStoryClipCanvasNodeData({
                project: project,
                episode: episode2,
                clip: clip2,
                modelId: videoModelId,
                provider: videoProvider,
                generationParams: videoGenerationParams,
              });
            return (
              (clipData.storyWorkspaceBinding = {
                ...asObject(clipData.storyWorkspaceBinding),
                kind: 'clip-video',
                canvasScope: 'project',
              }),
              { clipKey: clipKey2, clipData: clipData, inputPlan: inputPlan, inputLaneWidth: inputLaneWidth }
            );
          }),
          count7 = Math.max(0, ...list23.map((value49) => value49.inputLaneWidth)),
          x6 = count7 > 0 ? count7 + NODE_GAP : 0;
        let y4 = x4.height + NODE_GAP;
        list23.forEach(({ clipKey: clipKey3, clipData: clipData2, inputPlan: inputPlan2 }) => {
          let x7 = 0;
          (inputPlan2.inputEntries.forEach((width9) => {
            (list22.push(
              createPlanEntry(
                width9.key,
                width9.data,
                { x: x7, y: y4 },
                { width: width9.width, height: width9.height },
              ),
            ),
              (x7 += width9.width + NODE_GAP));
          }),
            list22.push(
              createPlanEntry(
                clipKey3,
                clipData2,
                { x: x6, y: y4 },
                { inputConnections: inputPlan2.inputConnections },
              ),
            ));
          const value50 = Math.max(
            box10.height,
            ...inputPlan2.inputEntries.map((box16) => box16.height),
          );
          y4 += value50 + NODE_GAP;
        });
        const value51 = Math.max(x4.width, count7, x6 + box10.width);
        entries4.push(
          createPlanEntry(
            'episode:' + stableKeyPart3 + ':annotation',
            buildStoryStageAnnotationNodeData({
              project: project,
              episode: episode2,
              stage: 'episode-' + (episodeIndex + 1),
              title: getEpisodeLabel(episode2) + ' · 分集制作',
              content: '本集文案和视频片段。',
            }),
            { x: 0, y: 0 },
            { width: Math.max(height2.width, value51), height: height2.height },
          ),
        );
        const value52 = height2.height + NODE_GAP;
        (entries4.push(
          ...list22.map((x8) => ({
            ...x8,
            position: { x: x8.position.x, y: x8.position.y + value52 },
          })),
        ),
          (appendVerticalStoryStage2 = appendVerticalStoryStage(
            value39,
            wrapStoryStageEntriesInGroup({
              entries: entries4,
              project: project,
              episode: episode2,
              key: 'episode:' + stableKeyPart3 + ':group',
              stage: 'episode-' + (episodeIndex + 1),
              name: getEpisodeLabel(episode2),
              color: STAGE_GROUP_COLORS.episode[episodeIndex % STAGE_GROUP_COLORS.episode.length],
            }),
            value47,
            appendVerticalStoryStage2,
          )));
      }),
    value39
  );
}
function buildStoryProjectPlanLayout(list24 = []) {
  return Object.fromEntries(
    normalizeList(list24).map((box17) => [
      box17.key,
      {
        x: Number(box17.position?.x) || 0,
        y: Number(box17.position?.y) || 0,
        width: Number(box17.width) || 0,
        height: Number(box17.height) || 0,
        parentKey: normalizeText(box17.parentKey),
      },
    ]),
  );
}
function storyProjectLayoutsMatch(options4 = {}, value53 = {}) {
  const asObject2 = asObject(options4),
    asObject3 = asObject(value53),
    list25 = Object.keys(asObject2).sort(),
    list26 = Object.keys(asObject3).sort();
  if (
    list25.length !== list26.length ||
    list25.some((value54, value55) => value54 !== list26[value55])
  )
    return false;
  return list26.every((value56) => {
    const box18 = asObject(asObject2[value56]),
      box19 = asObject(asObject3[value56]);
    return (
      Number(box18.x) === Number(box19.x) &&
      Number(box18.y) === Number(box19.y) &&
      Number(box18.width) === Number(box19.width) &&
      Number(box18.height) === Number(box19.height) &&
      normalizeText(box18.parentKey) === normalizeText(box19.parentKey)
    );
  });
}
function shouldReflowStoryProjectCanvas(value57, value58) {
  return (
    Math.trunc(Number(value57?.layoutVersion) || 0) !== STORY_PROJECT_CANVAS_LAYOUT_VERSION ||
    !storyProjectLayoutsMatch(value57?.layout, value58)
  );
}
async function rollbackStoryProjectCanvasMutation({
  adapter: adapter,
  canvasId: canvasId = '',
  reused: reused = false,
  mutationSnapshot: mutationSnapshot,
} = {}) {
  if (!reused && typeof adapter?.deleteCanvas === 'function')
    try {
      if ((await adapter.deleteCanvas(canvasId, { skipDirtyConfirm: true })) !== false) return true;
    } catch {}
  if (mutationSnapshot && typeof adapter?.restoreMutationSnapshot === 'function')
    try {
      return (await adapter.restoreMutationSnapshot(mutationSnapshot, { canvasId: canvasId })) !== false;
    } catch {}
  return false;
}
export async function syncStoryProjectCanvas({
  project: project = {},
  assets: assets = [],
  episodes: episodes = [],
  imageModelId: imageModelId = '',
  imageProvider: imageProvider = '',
  imageGenerationParams: imageGenerationParams = {},
  videoModelId: videoModelId = '',
  videoProvider: videoProvider = '',
  videoGenerationParams: videoGenerationParams = {},
  adapter: adapter2,
} = {}) {
  const list27 = [
    'canvasExists',
    'switchCanvas',
    'createCanvas',
    'renameCanvas',
    'nodeExists',
    'createNode',
    'updateNode',
  ];
  if (list27.some((value59) => typeof adapter2?.[value59] !== 'function'))
    throw new Error('syncStoryProjectCanvas requires a complete canvas adapter');
  const canvasName = buildStoryProjectCanvasName(project, normalizeList(episodes)[0]),
    assets2 = await resolveStoryProjectAssetImageSizes(assets),
    list28 = buildStoryProjectCanvasPlan({
      project: project,
      assets: assets2,
      episodes: episodes,
      imageModelId: imageModelId,
      imageProvider: imageProvider,
      imageGenerationParams: imageGenerationParams,
      videoModelId: videoModelId,
      videoProvider: videoProvider,
      videoGenerationParams: videoGenerationParams,
    });
  if (list28.some((value60) => value60.parentKey) && typeof adapter2.setNodeParent !== 'function')
    throw new Error('剧本项目画布适配器缺少节点分组能力');
  if (
    list28.some((value61) => normalizeList(value61.inputConnections).length) &&
    typeof adapter2.connectNodes !== 'function'
  )
    throw new Error('剧本项目画布适配器缺少节点连线能力');
  const asObject4 = asObject(project.canvasBinding),
    text16 = normalizeText(asObject4.canvasId),
    reused2 = Boolean(text16 && (await adapter2.canvasExists(text16)));
  let canvasId2 = '';
  if (reused2) {
    const value62 = await adapter2.switchCanvas(text16);
    if (value62 === false) throw new Error('无法切换到已绑定的项目画布：' + text16);
    canvasId2 = text16;
  } else {
    canvasId2 = normalizeText(await adapter2.createCanvas(canvasName));
    if (!canvasId2) throw new Error('新建项目画布后未获得活动画布 ID');
  }
  const asObject5 = asObject(asObject4.nodes),
    layout = buildStoryProjectPlanLayout(list28),
    reflowed = reused2 ? shouldReflowStoryProjectCanvas(asObject4, layout) : false,
    nodes2 = {},
    nodes3 = [];
  let createdCount = 0,
    updatedCount = 0,
    deletedCount = 0;
  const sequenceKey = 'story-project:' + (normalizeText(project.id) || canvasId2),
    mutationSnapshot2 = await adapter2.createMutationSnapshot?.({ canvasId: canvasId2 });
  try {
    if (reused2) {
      const list29 = [];
      for (const [value63, value64] of Object.entries(asObject5)) {
        if (value63 in layout) continue;
        const text17 = normalizeText(value64);
        text17 && (await adapter2.nodeExists(text17, canvasId2)) && list29.push(text17);
      }
      if (list29.length) {
        if (typeof adapter2.deleteNodes !== 'function')
          throw new Error('剧本项目画布适配器缺少旧节点清理能力');
        const list30 = [...new Set(list29)];
        if ((await adapter2.deleteNodes(list30, { canvasId: canvasId2 })) === false)
          throw new Error('清理已失效的剧本项目画布节点失败');
        deletedCount = list30.length;
      }
    }
    for (const key5 of list28) {
      const text18 = normalizeText(asObject5[key5.key]),
        value65 = Boolean(reused2 && text18 && (await adapter2.nodeExists(text18, canvasId2))),
        node = value65
          ? await adapter2.updateNode(text18, key5.data, {
              canvasId: canvasId2,
              key: key5.key,
              type: key5.type,
              width: key5.width,
              height: key5.height,
              ...(reflowed ? { position: key5.position } : {}),
            })
          : await adapter2.createNode(key5.data, {
              canvasId: canvasId2,
              key: key5.key,
              type: key5.type,
              width: key5.width,
              height: key5.height,
              position: key5.position,
              sequenceKey: sequenceKey,
              parentNodeId: normalizeText(nodes2[key5.parentKey]),
            });
      if (value65) updatedCount += 1;
      else createdCount += 1;
      const nodeId = normalizeText(node?.id || (value65 ? text18 : ''));
      if (!nodeId) throw new Error('同步项目画布节点失败：' + (key5.data.name || key5.key));
      ((nodes2[key5.key] = nodeId), nodes3.push({ ...key5, nodeId: nodeId, node: node }));
    }
    for (const event4 of list28) {
      if (!event4.parentKey) continue;
      const text19 = normalizeText(nodes2[event4.key]),
        text20 = normalizeText(nodes2[event4.parentKey]);
      if (!text19 || !text20) throw new Error('剧本项目画布分组缺少节点：' + event4.key);
      if ((await adapter2.setNodeParent(text19, text20, { canvasId: canvasId2 })) === false)
        throw new Error('剧本项目画布节点分组失败：' + event4.key);
    }
    for (const event5 of list28) {
      const text21 = normalizeText(nodes2[event5.key]);
      for (const event6 of normalizeList(event5.inputConnections)) {
        const text22 = normalizeText(nodes2[event6?.key]);
        if (!text22 || !text21)
          throw new Error('剧本项目画布连线缺少节点：' + event6?.key + ' → ' + event5.key);
        if (
          (await adapter2.connectNodes(text22, text21, {
            canvasId: canvasId2,
            preferredRefSlot: normalizeText(event6?.preferredRefSlot),
          })) === false
        )
          throw new Error('剧本项目画布节点连线失败：' + event6?.key + ' → ' + event5.key);
      }
    }
    (await adapter2.renameCanvas?.(canvasId2, canvasName),
      adapter2.commit?.(),
      typeof adapter2.focusNodes === 'function' &&
        (await adapter2.focusNodes(
          nodes3.map((value66) => value66.nodeId),
          { padding: 80, durationMs: 0, maxZoom: 0.2 },
        )));
  } catch (value67) {
    await rollbackStoryProjectCanvasMutation({
      adapter: adapter2,
      canvasId: canvasId2,
      reused: reused2,
      mutationSnapshot: mutationSnapshot2,
    });
    throw value67;
  }
  const binding = {
    canvasId: canvasId2,
    layoutVersion: STORY_PROJECT_CANVAS_LAYOUT_VERSION,
    nodes: nodes2,
    layout: layout,
  };
  return {
    canvasId: canvasId2,
    canvasName: canvasName,
    reused: reused2,
    createdCount: createdCount,
    updatedCount: updatedCount,
    deletedCount: deletedCount,
    reflowed: reflowed,
    nodes: nodes3,
    binding: binding,
    canvasBinding: binding,
  };
}

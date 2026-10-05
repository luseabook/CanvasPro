import { normalizeImageGenerationResult } from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { normalizeVideoGenerationResult } from '../../components/video-node/videoGenerationResultRenderer.js';
import { localPathToUrl, normalizeLocalPath } from '../../utils/localMediaPath.js';
import { getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import { resolveOutputMediaSize } from '../../services/mediaRatioService.js';
import { buildPersonReplacementPromptPackage } from './personReplacementPromptCompiler.js';
import { materializePersonReplacementGuide } from './personReplacementLocationGuideCanvas.js';
import { createPersonReplacementImagePromptRequestResolver } from './personReplacementImageGeneration.js';
import {
  PERSON_REPLACEMENT_PROMPT_MODE_TEST,
  isPersonReplacementTestModeAvailable,
} from './personReplacementPromptMode.js';
import { calculateGroupNodeBounds } from '../groupNodeLayout.js';
import {
  getPersonReplacementImageResults,
  getPersonReplacementVideoResults,
  resolvePersonReplacementVideoSourceRef,
} from './personReplacementProject.js';
import { resolveGenerationResultSelection } from '../../core/generationResultRenderer.js';
const NODE_GAP = 72,
  SECTION_GAP = 180,
  STAGE_GAP = 320,
  ASSET_COLUMNS = 5,
  STAGE_GROUP_COLORS = Object['freeze']({
    assets: 'var(--indigo)',
    image: 'var(--green)',
    video: 'var(--gold)',
    voice: 'var(--purple)',
    composite: 'var(--cyan)',
  });
export const PERSON_REPLACEMENT_CANVAS_SCOPES = Object['freeze']({ CLIPS: 'clips', PROJECT: 'project' });
export const PERSON_REPLACEMENT_CANVAS_LAYOUT_VERSION = 9;
export const PERSON_REPLACEMENT_CANVAS_NODE_SIZES = Object['freeze']({
  'comment-note': Object['freeze']({ width: 1400, height: 288 }),
  group: Object['freeze']({ width: 512, height: 368 }),
  'source-text': Object['freeze']({ width: 720, height: 480 }),
  'source-image': Object['freeze']({ width: 288, height: 288 }),
  'ai-image': Object['freeze']({ width: 288, height: 288 }),
  'source-video': Object['freeze']({ width: 512, height: 288 }),
  'ai-video': Object['freeze']({ width: 512, height: 288 }),
  'source-audio': Object['freeze']({ width: 420, height: 180 }),
  'ai-audio': Object['freeze']({ width: 420, height: 180 }),
});
function asObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value) ? value : {};
}
function normalizeText(item) {
  return String(item || '')['trim']();
}
export const personReplacementCanvasMaterializationBindingPolicy = Object['freeze']({
  getProjectId(key) {
    return normalizeText(key?.['personReplacementBinding']?.['projectId']);
  },
  findProjectAnchor({ nodes: nodes = [], projectId: projectId } = {}) {
    const text = normalizeText(projectId);
    if (!text) return null;
    const list = (Array['isArray'](nodes) ? nodes : [])['filter'](
      (index) => normalizeText(index?.['personReplacementBinding']?.['projectId']) === text,
    );
    return (
      list['find'](
        (result) =>
          result?.['personReplacementBinding']?.['kind'] === 'stage-group' &&
          result?.['personReplacementBinding']?.['stage'] === 'assets',
      ) ||
      list['find']((data) => data?.['personReplacementBinding']?.['kind'] === 'stage-group') ||
      list['find']((options) => options?.['personReplacementBinding']?.['kind'] === 'project-overview') ||
      list[0] ||
      null
    );
  },
});
function normalizePromptDisplayText(target) {
  return String(target || '')
    ['replace'](/<br\b[^>]*\/?>/gi, '\n')
    ['replace'](/<\/(?:div|p|section|article|blockquote|li)>/gi, '\n')
    ['replace'](/<li\b[^>]*>/gi, '- ')
    ['replace'](/<[^>]+>/g, '')
    ['replace'](/&nbsp;|&#160;/gi, ' ')
    ['replace'](/&lt;/gi, '<')
    ['replace'](/&gt;/gi, '>')
    ['replace'](/&quot;/gi, '"')
    ['replace'](/&#39;|&apos;/gi, '\'')
    ['replace'](/&amp;/gi, '&')
    ['replace'](/\n{3,}/g, '\n\n')
    ['trim']();
}
function normalizeList(list2) {
  return Array['isArray'](list2) ? list2['filter'](Boolean) : [];
}
function normalizeScope(next) {
  return next === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
    ? PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT']
    : PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'];
}
function normalizeWorkspaceStep(options2 = {}) {
  const current = Math['trunc'](Number(options2['workspace']?.['step']) || Number(options2['step']) || 1);
  return Math['max'](1, Math['min'](5, current));
}
function getWorkspaceStepName(entry) {
  return ['', '素材设定', '图像替换', '视频替换', '声音克隆', '合成视频'][
    Math['max'](1, Math['min'](5, Math['trunc'](Number(entry) || 1)))
  ];
}
function formatSequence(record) {
  return String(record + 1)['padStart'](2, '0');
}
function createPlanEntry(
  key2,
  data2,
  box,
  { width: width = 0, height: height = 0, parentKey: parentKey = '', inputKeys: inputKeys = [] } = {},
) {
  const type2 = normalizeText(data2?.['type']),
    box2 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES[type2],
    width2 = Number(width) || box2?.['width'],
    height2 = Number(height) || box2?.['height'];
  if (!type2 || !width2 || !height2) throw new Error('不支持的人物替换画布节点类型：' + (type2 || 'unknown'));
  return {
    key: key2,
    type: type2,
    data: data2,
    width: width2,
    height: height2,
    position: { x: Number(box?.['x']) || 0, y: Number(box?.['y']) || 0 },
    ...(normalizeText(parentKey) ? { parentKey: normalizeText(parentKey) } : {}),
    ...(normalizeList(inputKeys)['length']
      ? { inputKeys: normalizeList(inputKeys)['map'](normalizeText)['filter'](Boolean) }
      : {}),
  };
}
function buildMediaLocation(payload) {
  const text2 = normalizeText(payload),
    localPath = normalizeLocalPath(text2);
  return { localPath: localPath, url: localPathToUrl(localPath) };
}
function normalizeInlineLocationGuideRef(handle, state = false) {
  const text3 = normalizeText(handle);
  return state && /^data:image\/svg\+xml(?:;|,)/i['test'](text3) ? text3 : '';
}
function buildBinding(config, input = {}) {
  return { projectId: normalizeText(config?.['id']), ...asObject(input) };
}
const PERSON_REPLACEMENT_LOCATION_GUIDE_SUBDIR = 'person-replacement-guides';
function buildInlineSvgSignature(output) {
  const list3 = normalizeText(output);
  let value2 = 0x811c9dc5;
  for (let value3 = 0; value3 < list3['length']; value3 += 1) {
    ((value2 ^= list3['charCodeAt'](value3)), (value2 = Math['imul'](value2, 0x1000193)));
  }
  return 'svg-' + (value2 >>> 0)['toString'](16)['padStart'](8, '0');
}
function buildInlineSvgBlob(value4) {
  const list4 = normalizeText(value4),
    count = list4['indexOf'](','),
    value5 = count >= 0 ? list4['slice'](0, count) : '',
    enabled = count >= 0 ? list4['slice'](count + 1) : '';
  if (!/^data:image\/svg\+xml(?:;|$)/i['test'](value5) || !enabled)
    throw new Error('人物定位图不是有效的 SVG 数据');
  const run = globalThis['Blob'];
  if (typeof run !== 'function') throw new Error('当前环境无法保存人物定位图');
  if (/;base64(?:;|$)/i['test'](value5)) {
    const run2 = globalThis['atob'];
    if (typeof run2 !== 'function') throw new Error('当前环境无法解码人物定位图');
    const list5 = run2(enabled),
      uint8Array = new Uint8Array(list5['length']);
    for (let value6 = 0; value6 < list5['length']; value6 += 1) {
      uint8Array[value6] = list5['charCodeAt'](value6);
    }
    return new run([uint8Array], { type: 'image/svg+xml' });
  }
  try {
    return new run([decodeURIComponent(enabled)], { type: 'image/svg+xml' });
  } catch {
    throw new Error('人物定位图 SVG 数据无法解码');
  }
}
function normalizeSavedLocationGuideRef(response = {}) {
  return normalizeLocalPath(
    response?.['originalLocalPath'] ||
      response?.['localPath'] ||
      response?.['path'] ||
      response?.['url'] ||
      '',
  );
}
function applyPersistedLocationGuide(value7, project2, imageRef2, locationGuideSignature, args) {
  const name2 = asObject(value7?.['data']),
    binding2 = {
      ...asObject(name2['personReplacementBinding']),
      locationGuideSignature: locationGuideSignature,
    };
  value7['data'] = {
    ...name2,
    ...buildPersonReplacementImageCanvasNodeData({
      project: project2,
      imageRef: imageRef2,
      results: [{ ...args, localPath: imageRef2 }],
      name: name2['name'],
      type: name2['type'] || value7['type'],
      prompt: name2['prompt'],
      binding: binding2,
    }),
    imageWidth: name2['imageWidth'],
    imageHeight: name2['imageHeight'],
  };
}
async function materializePersonReplacementLocationGuides({
  plan: plan = [],
  project: project = {},
  adapter: adapter,
  canReuseCanvas: canReuseCanvas = false,
  previousNodes: previousNodes = {},
  canvasId: canvasId = '',
  saveOutputBlob: saveOutputBlob = null,
  createLocationGuide: createLocationGuide,
} = {}) {
  for (const entry2 of normalizeList(plan)) {
    const asObject2 = asObject(entry2?.['data']?.['personReplacementBinding']);
    if (asObject2['locationGuide'] || asObject2['annotatedSource']) {
      await materializePersonReplacementGuide({
        entry: entry2,
        project: project,
        adapter: adapter,
        canReuseCanvas: canReuseCanvas,
        previousNodes: previousNodes,
        canvasId: canvasId,
        saveOutputBlob: saveOutputBlob,
        buildNodeData: buildPersonReplacementImageCanvasNodeData,
        createLocationGuide: createLocationGuide,
      });
      continue;
    }
    if (asObject2['kind'] !== 'person-location-guide') continue;
    const text4 = normalizeText(
      entry2?.['data']?.['imageUrl'] || entry2?.['data']?.['images']?.[0]?.['imageUrl'],
    );
    if (!/^data:image\/svg\+xml(?:;|,)/i['test'](text4)) continue;
    const inlineSvgSignature = buildInlineSvgSignature(text4);
    let localPath2 = '',
      value8 = {};
    const text5 = normalizeText(previousNodes[entry2['key']]);
    if (
      canReuseCanvas &&
      text5 &&
      typeof adapter?.['getNode'] === 'function' &&
      (await adapter['nodeExists'](text5, canvasId))
    ) {
      const value9 = await adapter['getNode'](text5, canvasId);
      ((value8 = value9?.['images']?.[0] || value9 || {}),
        normalizeText(value9?.['personReplacementBinding']?.['locationGuideSignature']) ===
          inlineSvgSignature &&
          (localPath2 = normalizeLocalPath(
            value9?.['originalLocalPath'] ||
              value9?.['localPath'] ||
              value9?.['displayLocalPath'] ||
              value9?.['images']?.[0]?.['originalLocalPath'] ||
              value9?.['images']?.[0]?.['localPath'] ||
              '',
          )));
    }
    if (!localPath2) {
      if (typeof saveOutputBlob !== 'function') throw new Error('人物定位图本地保存服务不可用');
      const saveOutputBlob2 = await saveOutputBlob(buildInlineSvgBlob(text4), {
        ext: 'svg',
        subDir: PERSON_REPLACEMENT_LOCATION_GUIDE_SUBDIR,
        kind: 'image',
      });
      ((localPath2 = normalizeSavedLocationGuideRef(saveOutputBlob2)), (value8 = saveOutputBlob2));
      if (!localPath2) throw new Error('人物定位图保存后未返回本地路径');
    }
    applyPersistedLocationGuide(entry2, project, localPath2, inlineSvgSignature, value8);
  }
}
function buildPersonReplacementVideoCanvasNodeData({
  project: project = {},
  videoRef: videoRef = '',
  results: results = [],
  activeIndex: activeIndex = 0,
  name: name = '',
  type: type = 'ai-video',
  prompt: prompt = '',
  binding: binding = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  providerProfileIdByModel: providerProfileIdByModel = {},
  generationParams: generationParams = {},
  allowEmpty: allowEmpty = false,
} = {}) {
  const localPath3 = buildMediaLocation(videoRef),
    { items: items, activeIndex: activeIndex2 } = resolveGenerationResultSelection(
      normalizeVideoGenerationResult({
        videos: results['length']
          ? results
          : localPath3['url']
            ? [{ localPath: localPath3['localPath'], videoUrl: localPath3['url'] }]
            : [],
      })['items'],
      activeIndex,
    ),
    enabled2 = items[activeIndex2];
  if (!enabled2?.['videoUrl'] && !allowEmpty)
    throw new Error((normalizeText(name) || '视频') + '缺少可加入画布的媒体地址');
  return {
    type: type,
    name: normalizeText(name) || '人物替换视频',
    prompt: normalizeText(prompt),
    videos: items,
    mainVideoIndex: activeIndex2,
    isVideosExpanded: false,
    videoUrl: normalizeText(enabled2?.['videoUrl']),
    localPath: normalizeText(enabled2?.['localPath']),
    displayLocalPath: normalizeText(enabled2?.['displayLocalPath']),
    posterLocalPath: normalizeText(enabled2?.['posterLocalPath']),
    thumbId: normalizeText(enabled2?.['thumbId']),
    thumbUrl: normalizeText(enabled2?.['thumbUrl']),
    ...(normalizeText(model) ? { model: normalizeText(model) } : {}),
    ...(normalizeText(provider) ? { provider: normalizeText(provider) } : {}),
    ...(normalizeText(providerProfileId) ? { providerProfileId: normalizeText(providerProfileId) } : {}),
    ...(Object['keys'](asObject(providerProfileIdByModel))['length']
      ? { providerProfileIdByModel: { ...asObject(providerProfileIdByModel) } }
      : {}),
    ...(Object['keys'](asObject(generationParams))['length']
      ? { generationParams: { ...asObject(generationParams) } }
      : {}),
    personReplacementBinding: buildBinding(project, binding),
  };
}
function buildPersonReplacementImageCanvasNodeData({
  project: project = {},
  imageRef: imageRef = '',
  results: results = [],
  activeIndex: activeIndex = 0,
  name: name = '',
  type: type = 'ai-image',
  prompt: prompt = '',
  binding: binding = {},
  model: model = '',
  provider: provider = '',
  providerProfileId: providerProfileId = '',
  providerProfileIdByModel: providerProfileIdByModel = {},
  generationParams: generationParams = {},
  allowEmpty: allowEmpty = false,
  allowInlineSvg: allowInlineSvg = false,
} = {}) {
  const localPath4 = buildMediaLocation(imageRef),
    imageUrl = normalizeInlineLocationGuideRef(imageRef, allowInlineSvg),
    value10 = localPath4['url']
      ? normalizeImageGenerationResult({
          images: [
            { localPath: localPath4['localPath'], imageUrl: localPath4['url'], sourceUrl: localPath4['url'] },
          ],
        })['items'][0]
      : imageUrl
        ? { imageUrl: imageUrl, sourceUrl: imageUrl, localPath: '' }
        : null,
    { items: items2, activeIndex: activeIndex3 } = resolveGenerationResultSelection(
      results['length']
        ? normalizeImageGenerationResult({ images: results })['items']
        : value10
          ? [value10]
          : [],
      activeIndex,
    ),
    enabled3 = items2[activeIndex3];
  if (!enabled3?.['imageUrl'] && !allowEmpty)
    throw new Error((normalizeText(name) || '图片') + '缺少可加入画布的媒体地址');
  return {
    type: type,
    name: normalizeText(name) || '人物替换图片',
    prompt: normalizeText(prompt),
    images: items2,
    mainImageIndex: activeIndex3,
    isImagesExpanded: false,
    imageUrl: normalizeText(enabled3?.['imageUrl']),
    sourceUrl: normalizeText(enabled3?.['sourceUrl']),
    thumbUrl: normalizeText(enabled3?.['thumbUrl']),
    localPath: normalizeText(enabled3?.['localPath']),
    originalLocalPath: normalizeText(enabled3?.['originalLocalPath']),
    displayLocalPath: normalizeText(enabled3?.['displayLocalPath']),
    thumbLocalPath: normalizeText(enabled3?.['thumbLocalPath']),
    sourceId: normalizeText(enabled3?.['sourceId']),
    thumbId: normalizeText(enabled3?.['thumbId']),
    ...(normalizeText(model) ? { model: normalizeText(model) } : {}),
    ...(normalizeText(provider) ? { provider: normalizeText(provider) } : {}),
    ...(normalizeText(providerProfileId) ? { providerProfileId: normalizeText(providerProfileId) } : {}),
    ...(Object['keys'](asObject(providerProfileIdByModel))['length']
      ? { providerProfileIdByModel: { ...asObject(providerProfileIdByModel) } }
      : {}),
    ...(Object['keys'](asObject(generationParams))['length']
      ? { generationParams: { ...asObject(generationParams) } }
      : {}),
    personReplacementBinding: buildBinding(project, binding),
  };
}
function resolveShotImageCanvasGeometry(options3 = {}) {
  const width3 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-image'],
    imageWidth = Math['max'](0, Number(options3?.['frame']?.['width']) || 0),
    imageHeight = Math['max'](0, Number(options3?.['frame']?.['height']) || 0);
  if (!(imageWidth > 0 && imageHeight > 0))
    return { width: width3['width'], height: width3['height'], imageWidth: 0, imageHeight: 0 };
  return {
    ...getAutoMediaSizeByShortSide(imageWidth, imageHeight),
    imageWidth: imageWidth,
    imageHeight: imageHeight,
  };
}
function applyImageCanvasGeometry(args2, box3, { source: source = false } = {}) {
  const imageWidth2 = Math['max'](0, Number(box3?.['imageWidth']) || 0),
    imageHeight2 = Math['max'](0, Number(box3?.['imageHeight']) || 0);
  return {
    ...args2,
    width: Math['max'](1, Number(box3?.['width']) || 1),
    height: Math['max'](1, Number(box3?.['height']) || 1),
    ...(imageWidth2 > 0 && imageHeight2 > 0
      ? { imageWidth: imageWidth2, imageHeight: imageHeight2 }
      : {}),
    ...(source ? { needsAutoResize: false } : {}),
  };
}
function resolveShotVideoCanvasGeometry(options4 = {}) {
  const width4 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-video'],
    videoWidth = Math['max'](0, Number(options4?.['frame']?.['width']) || 0),
    videoHeight = Math['max'](0, Number(options4?.['frame']?.['height']) || 0);
  if (!(videoWidth > 0 && videoHeight > 0))
    return { width: width4['width'], height: width4['height'], videoWidth: 0, videoHeight: 0 };
  return {
    ...getAutoMediaSizeByShortSide(videoWidth, videoHeight),
    videoWidth: videoWidth,
    videoHeight: videoHeight,
  };
}
function applyVideoCanvasGeometry(args3, box4) {
  const naturalWidth = Math['max'](0, Number(box4?.['videoWidth']) || 0),
    naturalHeight = Math['max'](0, Number(box4?.['videoHeight']) || 0),
    width5 = Math['max'](1, Number(box4?.['width']) || 1),
    height3 = Math['max'](1, Number(box4?.['height']) || 1),
    value11 = naturalWidth > 0 && naturalHeight > 0;
  return {
    ...args3,
    width: width5,
    height: height3,
    ...(value11
      ? {
          naturalWidth: naturalWidth,
          naturalHeight: naturalHeight,
          videoWidth: naturalWidth,
          videoHeight: naturalHeight,
          selectedVideoWidth: naturalWidth,
          selectedVideoHeight: naturalHeight,
          needsAutoResize: false,
          videos: normalizeList(args3?.['videos'])['map']((args4) => ({
            ...args4,
            videoWidth: naturalWidth,
            videoHeight: naturalHeight,
          })),
        }
      : {}),
  };
}
function resolveAppearanceImageCanvasGeometry(box5 = {}) {
  const width6 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-image'],
    imageWidth3 = Math['max'](
      0,
      Number(box5?.['imageWidth'] || box5?.['naturalWidth'] || box5?.['originalWidth'] || box5?.['width']) ||
        0,
    ),
    imageHeight3 = Math['max'](
      0,
      Number(
        box5?.['imageHeight'] || box5?.['naturalHeight'] || box5?.['originalHeight'] || box5?.['height'],
      ) || 0,
    );
  if (!(imageWidth3 > 0 && imageHeight3 > 0))
    return { width: width6['width'], height: width6['height'], imageWidth: 0, imageHeight: 0 };
  return {
    ...getAutoMediaSizeByShortSide(imageWidth3, imageHeight3),
    imageWidth: imageWidth3,
    imageHeight: imageHeight3,
  };
}
async function resolveProjectAppearanceImageSizes(args5 = {}) {
  const characters = await Promise['all'](
    normalizeList(args5['characters'])['map'](async (args6) => {
      const appearances = await Promise['all'](
        normalizeList(args6?.['appearances'])['map'](async (response2) => {
          const appearanceImageCanvasGeometry = resolveAppearanceImageCanvasGeometry(response2);
          if (
            appearanceImageCanvasGeometry['imageWidth'] > 0 &&
            appearanceImageCanvasGeometry['imageHeight'] > 0
          )
            return response2;
          const text6 = normalizeText(
            response2?.['imageUrl'] || response2?.['imageRef'] || response2?.['url'],
          );
          if (!text6) return response2;
          const localPath5 = buildMediaLocation(text6),
            imageWidth4 = await resolveOutputMediaSize({
              localPath: localPath5['localPath'],
              imageUrl: localPath5['url'],
            });
          return imageWidth4
            ? { ...response2, imageWidth: imageWidth4['width'], imageHeight: imageWidth4['height'] }
            : response2;
        }),
      );
      return { ...args6, appearances: appearances };
    }),
  );
  return { ...args5, characters: characters };
}
async function resolveProjectShotImageSizes(args7 = {}) {
  const shots = await Promise['all'](
    normalizeList(args7['shots'])['map'](async (args8) => {
      const shotImageCanvasGeometry = resolveShotImageCanvasGeometry(args8);
      if (shotImageCanvasGeometry['imageWidth'] > 0 && shotImageCanvasGeometry['imageHeight'] > 0)
        return args8;
      const list6 = [
        ...new Set(
          [normalizeText(args8?.['keyframeRef']), normalizeText(args8?.['replacementImageRef'])]['filter'](
            Boolean,
          ),
        ),
      ];
      if (!list6['length']) return args8;
      const width7 = (
        await Promise['all'](
          list6['map'](async (value12) => {
            const localPath6 = buildMediaLocation(value12);
            return resolveOutputMediaSize({
              localPath: localPath6['localPath'],
              imageUrl: localPath6['url'],
            });
          }),
        )
      )['find'](Boolean);
      return width7
        ? {
            ...args8,
            frame: {
              ...asObject(args8?.['frame']),
              width: width7['width'],
              height: width7['height'],
            },
          }
        : args8;
    }),
  );
  return { ...args7, shots: shots };
}
function buildPersonReplacementSourceAudioNodeData({
  project: project = {},
  audioRef: audioRef = '',
  name: name = '',
  binding: binding = {},
} = {}) {
  const audioUrl = buildMediaLocation(audioRef);
  if (!audioUrl['url']) throw new Error((normalizeText(name) || '音频') + '缺少可加入画布的媒体地址');
  return {
    type: 'source-audio',
    name: normalizeText(name) || '原音频片段',
    fileName: normalizeText(name) || '原音频片段',
    audioUrl: audioUrl['url'],
    localPath: audioUrl['localPath'],
    personReplacementBinding: buildBinding(project, binding),
  };
}
function buildPersonReplacementAudioCanvasNodeData({
  project: project = {},
  audioRef: audioRef = '',
  name: name = '',
  prompt: prompt = '',
  model: model = '',
  binding: binding = {},
  allowEmpty: allowEmpty = false,
} = {}) {
  const audioUrl2 = buildMediaLocation(audioRef);
  if (!audioUrl2['url'] && !allowEmpty)
    throw new Error((normalizeText(name) || '音频') + '缺少可加入画布的媒体地址');
  const audios = audioUrl2['url']
    ? [{ audioUrl: audioUrl2['url'], src: audioUrl2['url'], localPath: audioUrl2['localPath'] }]
    : [];
  return {
    type: 'ai-audio',
    name: normalizeText(name) || '替换音频',
    prompt: normalizeText(prompt),
    audios: audios,
    mainAudioIndex: 0,
    audioUrl: audioUrl2['url'],
    localPath: audioUrl2['localPath'],
    ...(normalizeText(model) ? { model: normalizeText(model), audioWorkflowKey: normalizeText(model) } : {}),
    personReplacementBinding: buildBinding(project, binding),
  };
}
function buildStageAnnotationNodeData({
  project: project = {},
  stage: stage = '',
  title: title = '',
  content: content = '',
  isProjectAnchor: isProjectAnchor = false,
} = {}) {
  const canvasScope2 = PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'];
  return {
    type: 'comment-note',
    name: normalizeText(title),
    content: normalizeText(content),
    style: { fontSize: 40, textColor: 'white', backgroundColor: 'transparent' },
    personReplacementBinding: buildBinding(project, {
      kind: isProjectAnchor ? 'project-overview' : 'stage-annotation',
      stage: normalizeText(stage),
      canvasScope: canvasScope2,
    }),
  };
}
function getCharacterAppearanceRecords(options5 = {}) {
  const list7 = [];
  return (
    normalizeList(options5['characters'])['forEach']((prompt2, value13) => {
      const characterId = normalizeText(prompt2?.['id']) || 'character-' + (value13 + 1),
        list8 = normalizeList(prompt2?.['appearances']),
        list9 = normalizeList(prompt2?.['imageRefs'])['map']((imageUrl2, name3) => ({
          id: 'image-' + (name3 + 1),
          name: name3 === 0 ? '基础形象' : '形象 ' + (name3 + 1),
          imageUrl: imageUrl2,
          prompt: prompt2?.['description'],
        })),
        list10 = list8['length']
          ? list8
          : list9['length']
            ? list9
            : [{ id: 'base', name: '基础形象', imageUrl: '', prompt: prompt2?.['description'] }];
      list10['forEach']((box6, value14) => {
        const appearanceId = normalizeText(box6?.['id']) || 'appearance-' + (value14 + 1);
        list7['push']({
          key: 'asset:' + characterId + ':' + appearanceId,
          characterId: characterId,
          appearanceId: appearanceId,
          characterName: normalizeText(prompt2?.['name']) || '目标人物' + (value13 + 1),
          appearanceName: normalizeText(box6?.['name']),
          imageRef: normalizeText(box6?.['imageUrl'] || box6?.['imageRef'] || box6?.['url']),
          prompt: normalizeText(box6?.['prompt'] || prompt2?.['description']),
          imageWidth: Math['max'](
            0,
            Number(
              box6?.['imageWidth'] || box6?.['naturalWidth'] || box6?.['originalWidth'] || box6?.['width'],
            ) || 0,
          ),
          imageHeight: Math['max'](
            0,
            Number(
              box6?.['imageHeight'] ||
                box6?.['naturalHeight'] ||
                box6?.['originalHeight'] ||
                box6?.['height'],
            ) || 0,
          ),
        });
      });
    }),
    list7
  );
}
function appendAssetStage(list11, project3, y, list12) {
  const box7 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'],
    list13 = [];
  for (let value15 = 0; value15 < list12['length']; value15 += ASSET_COLUMNS) {
    const list14 = list12['slice'](value15, value15 + ASSET_COLUMNS),
      items3 = list14['map']((appearance) => ({
        appearance: appearance,
        geometry: resolveAppearanceImageCanvasGeometry(appearance),
      }));
    list13['push']({
      items: items3,
      width: items3['reduce'](
        (value16, value17, count2) =>
          value16 + value17['geometry']['width'] + (count2 > 0 ? NODE_GAP : 0),
        0,
      ),
      height: Math['max'](...items3['map']((value18) => value18['geometry']['height'])),
    });
  }
  list11['push'](
    createPlanEntry(
      'stage:assets:annotation',
      buildStageAnnotationNodeData({
        project: project3,
        stage: 'assets',
        title: '阶段 1 · 人物素材',
        content: '人物素材及形象参考图。',
        isProjectAnchor: true,
      }),
      { x: 0, y: y },
    ),
  );
  const y2 = y + box7['height'] + NODE_GAP;
  let value19 = 0;
  return (
    list13['forEach']((box8) => {
      let x = 0;
      (box8['items']['forEach'](({ appearance: appearance2, geometry: geometry }) => {
        (list11['push'](
          createPlanEntry(
            appearance2['key'],
            applyImageCanvasGeometry(
              buildPersonReplacementImageCanvasNodeData({
                project: project3,
                imageRef: appearance2['imageRef'],
                name: [appearance2['characterName'], appearance2['appearanceName']]
                  ['filter'](Boolean)
                  ['join'](' · '),
                prompt: appearance2['prompt'],
                model: project3['settings']?.['characterImageModelId'],
                provider: project3['settings']?.['characterImageProvider'],
                providerProfileId: project3['settings']?.['characterImageProviderProfileId'],
                providerProfileIdByModel: project3['settings']?.['characterImageProviderProfileIdByModel'],
                generationParams: project3['settings']?.['characterImageGenerationParams'],
                allowEmpty: true,
                binding: {
                  characterId: appearance2['characterId'],
                  appearanceId: appearance2['appearanceId'],
                  kind: 'character-image',
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              geometry,
            ),
            { x: x, y: y2 + value19 },
            { width: geometry['width'], height: geometry['height'] },
          ),
        ),
          (x += geometry['width'] + NODE_GAP));
      }),
        (value19 += box8['height'] + NODE_GAP));
    }),
    list13['length'] ? y2 + value19 - NODE_GAP : y + box7['height']
  );
}
function buildShotPromptPackage(project4, shot) {
  const promptPackage = buildPersonReplacementPromptPackage({ project: project4, shot: shot });
  if (
    promptPackage['promptMode'] === PERSON_REPLACEMENT_PROMPT_MODE_TEST &&
    !isPersonReplacementTestModeAvailable()
  )
    throw new Error('测试模式仅限开发者，请切回其他替换模式后加入画布。');
  const shot2 = globalThis['document']?.['createElement']
      ? shot
      : { ...shot, imagePrompt: normalizePromptDisplayText(shot?.['imagePrompt']) },
    prompt3 = createPersonReplacementImagePromptRequestResolver()({
      project: project4,
      shot: shot2,
      promptPackage: promptPackage,
    });
  return {
    ...promptPackage,
    prompt: prompt3['requestPrompt'],
    referenceImages: [
      ...promptPackage['referenceImages'],
      ...prompt3['promptAssetRefs']['map']((ref, value20) => ({
        ref: ref['url'],
        role: 'prompt-reference',
        slot: promptPackage['referenceImages']['length'] + value20 + 1,
      })),
    ],
  };
}
function resolveAssetKeyForReference(value21, list15) {
  const text7 = normalizeText(value21?.['targetCharacterId']),
    text8 = normalizeText(value21?.['targetAppearanceId']),
    event = list15['find'](
      (value22) => value22['characterId'] === text7 && (!text8 || value22['appearanceId'] === text8),
    );
  if (event) return event['key'];
  const text9 = normalizeText(value21?.['ref']);
  return list15['find']((value23) => value23['imageRef'] === text9)?.['key'] || '';
}
function appendImageReplacementStage(list16, project5, y3, value24) {
  const box9 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'],
    box10 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['source-text'];
  list16['push'](
    createPlanEntry(
      'stage:image:annotation',
      buildStageAnnotationNodeData({
        project: project5,
        stage: 'image',
        title: '阶段 2 · 图像替换',
        content: '关键帧、人物素材和提示词共同连到替换结果图。',
      }),
      { x: 0, y: y3 },
    ),
  );
  let y4 = y3 + box9['height'] + NODE_GAP;
  return (
    normalizeList(project5['shots'])['forEach']((imageRef3, value25) => {
      const shotId = normalizeText(imageRef3?.['id']) || 'shot-' + (value25 + 1),
        formatSequence2 = formatSequence(value25),
        annotatedSource = buildShotPromptPackage(project5, imageRef3),
        inputKeys2 = [];
      let x2 = 0;
      const width8 = resolveShotImageCanvasGeometry(imageRef3),
        imageRef4 = normalizeText(
          annotatedSource['referenceImages'][0]?.['ref'] || imageRef3?.['keyframeRef'],
        );
      if (imageRef4) {
        const value26 = 'shot:' + shotId + ':keyframe';
        (list16['push'](
          createPlanEntry(
            value26,
            applyImageCanvasGeometry(
              buildPersonReplacementImageCanvasNodeData({
                project: project5,
                imageRef: imageRef4,
                name: '镜头片段' + formatSequence2 + ' · 关键帧',
                type: 'source-image',
                binding: {
                  shotId: shotId,
                  kind: 'source-keyframe',
                  ...(annotatedSource['annotatedSource']
                    ? { annotatedSource: annotatedSource['annotatedSource'] }
                    : {}),
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              width8,
              { source: true },
            ),
            { x: x2, y: y4 },
            { width: width8['width'], height: width8['height'] },
          ),
        ),
          inputKeys2['push'](value26),
          (x2 += width8['width'] + NODE_GAP));
      }
      for (const imageRef5 of normalizeList(annotatedSource['referenceImages'])['filter'](
        (value27) => value27['role'] !== 'source-keyframe',
      )) {
        const assetKeyForReference = resolveAssetKeyForReference(imageRef5, value24);
        if (assetKeyForReference) {
          if (!inputKeys2['includes'](assetKeyForReference)) inputKeys2['push'](assetKeyForReference);
          continue;
        }
        const allowInlineSvg2 = imageRef5['role'] === 'person-location-guide',
          value28 = allowInlineSvg2
            ? 'shot:' + shotId + ':location-guide'
            : 'shot:' + shotId + ':reference:' + imageRef5['slot'];
        (list16['push'](
          createPlanEntry(
            value28,
            applyImageCanvasGeometry(
              buildPersonReplacementImageCanvasNodeData({
                project: project5,
                imageRef: imageRef5['ref'],
                name: '镜头片段' + formatSequence2 + ' · 图' + imageRef5['slot'],
                type: 'source-image',
                allowInlineSvg: allowInlineSvg2,
                binding: {
                  shotId: shotId,
                  kind: imageRef5['role'],
                  ...(allowInlineSvg2 ? { locationGuide: annotatedSource['locationGuide'] } : {}),
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              width8,
              { source: true },
            ),
            { x: x2, y: y4 },
            { width: width8['width'], height: width8['height'] },
          ),
        ),
          inputKeys2['push'](value28),
          (x2 += width8['width'] + NODE_GAP));
      }
      const content2 = annotatedSource['prompt'],
        value29 = 'shot:' + shotId + ':prompt';
      (list16['push'](
        createPlanEntry(
          value29,
          {
            type: 'source-text',
            name: '镜头片段' + formatSequence2 + ' · 图像替换提示词',
            content: content2,
            personReplacementBinding: buildBinding(project5, {
              shotId: shotId,
              kind: 'image-prompt',
              canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
            }),
          },
          { x: x2, y: y4 },
        ),
      ),
        inputKeys2['push'](value29),
        (x2 += box10['width'] + NODE_GAP),
        list16['push'](
          createPlanEntry(
            'shot:' + shotId + ':replacement-image',
            applyImageCanvasGeometry(
              buildPersonReplacementImageCanvasNodeData({
                project: project5,
                imageRef: imageRef3?.['replacementImageRef'],
                results: getPersonReplacementImageResults(imageRef3),
                activeIndex: imageRef3?.['replacementImage']?.['activeIndex'],
                name: '镜头片段' + formatSequence2 + ' · 替换结果图',
                prompt: '',
                model: project5['settings']?.['replacementImageModelId'],
                provider: project5['settings']?.['replacementImageProvider'],
                providerProfileId: project5['settings']?.['replacementImageProviderProfileId'],
                providerProfileIdByModel: project5['settings']?.['replacementImageProviderProfileIdByModel'],
                generationParams: project5['settings']?.['replacementImageGenerationParams'],
                allowEmpty: true,
                binding: {
                  shotId: shotId,
                  kind: 'replacement-image',
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              width8,
            ),
            { x: x2, y: y4 },
            { width: width8['width'], height: width8['height'], inputKeys: inputKeys2 },
          ),
        ),
        (y4 += Math['max'](width8['height'], box10['height']) + SECTION_GAP));
    }),
    Math['max'](y3 + box9['height'], y4 - SECTION_GAP)
  );
}
function appendVideoReplacementStage(list17, project6, y5) {
  const box11 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'];
  list17['push'](
    createPlanEntry(
      'stage:video:annotation',
      buildStageAnnotationNodeData({
        project: project6,
        stage: 'video',
        title: '阶段 3 · 视频替换',
        content: '原视频片段与替换结果图共同连到替换视频。',
      }),
      { x: 0, y: y5 },
    ),
  );
  let y6 = y5 + box11['height'] + NODE_GAP;
  return (
    normalizeList(project6['shots'])['forEach']((videoRef2, value30) => {
      const shotId2 = normalizeText(videoRef2?.['id']) || 'shot-' + (value30 + 1),
        formatSequence3 = formatSequence(value30),
        inputKeys3 = [];
      let x3 = 0;
      const width9 = resolveShotVideoCanvasGeometry(videoRef2),
        videoRef3 =
          resolvePersonReplacementVideoSourceRef(videoRef2) || normalizeText(videoRef2?.['sourceVideoRef']);
      if (videoRef3) {
        const value31 = 'shot:' + shotId2 + ':original-video';
        (list17['push'](
          createPlanEntry(
            value31,
            applyVideoCanvasGeometry(
              buildPersonReplacementVideoCanvasNodeData({
                project: project6,
                videoRef: videoRef3,
                name: '镜头片段' + formatSequence3 + ' · 原视频',
                type: 'source-video',
                binding: {
                  shotId: shotId2,
                  kind: 'original-video',
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              width9,
            ),
            { x: x3, y: y6 },
            { width: width9['width'], height: width9['height'] },
          ),
        ),
          inputKeys3['push'](value31),
          (x3 += width9['width'] + NODE_GAP));
      }
      const value32 = 'shot:' + shotId2 + ':replacement-image';
      (inputKeys3['push'](value32),
        list17['push'](
          createPlanEntry(
            'shot:' + shotId2 + ':replacement-video',
            applyVideoCanvasGeometry(
              buildPersonReplacementVideoCanvasNodeData({
                project: project6,
                videoRef: videoRef2?.['resultVideoRef'],
                results: getPersonReplacementVideoResults(videoRef2),
                activeIndex: videoRef2?.['replacementVideo']?.['activeIndex'],
                name: '镜头片段' + formatSequence3 + ' · 替换视频',
                prompt: videoRef2?.['videoPrompt'],
                model: project6['settings']?.['replacementModelId'],
                providerProfileId: project6['settings']?.['replacementVideoProviderProfileId'],
                providerProfileIdByModel: project6['settings']?.['replacementVideoProviderProfileIdByModel'],
                generationParams: project6['settings']?.['replacementVideoGenerationParams'],
                allowEmpty: true,
                binding: {
                  shotId: shotId2,
                  kind: 'replacement-video',
                  canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
                },
              }),
              width9,
            ),
            { x: x3, y: y6 },
            { width: width9['width'], height: width9['height'], inputKeys: inputKeys3 },
          ),
        ),
        (y6 += width9['height'] + SECTION_GAP));
    }),
    Math['max'](y5 + box11['height'], y6 - SECTION_GAP)
  );
}
function getVoiceSegments(options6 = {}) {
  const list18 = [];
  return (
    Object['entries'](asObject(options6['audio']?.['voiceStudioState']))['forEach'](([value33, value34]) => {
      normalizeList(value34?.['audioVoiceAnalysis']?.['segments'])['forEach']((value35, value36) => {
        list18['push']({
          ...asObject(value35),
          sourceId: normalizeText(value33) || 'source',
          segmentId: normalizeText(value35?.['id']) || 'segment-' + (value36 + 1),
        });
      });
    }),
    list18
  );
}
function appendVoiceReplacementStage(list19, project7, y7) {
  const box12 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'],
    box13 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-audio'];
  list19['push'](
    createPlanEntry(
      'stage:voice:annotation',
      buildStageAnnotationNodeData({
        project: project7,
        stage: 'voice',
        title: '阶段 4 · 声音克隆',
        content:
          '使用源音频时，源音频连到替换音频；使用参考音频时，原音频与参考音频共同连到替换音频。总合成音频独立展示。',
      }),
      { x: 0, y: y7 },
    ),
  );
  const y8 = y7 + box12['height'] + NODE_GAP;
  let y9 = y8,
    value37 = y7 + box12['height'],
    value38 = 0;
  getVoiceSegments(project7)['forEach']((audioRef2, value39) => {
    const sourceId = normalizeText(audioRef2['sourceId']),
      segmentId = normalizeText(audioRef2['segmentId']),
      formatSequence4 = formatSequence(value39),
      inputKeys4 = [];
    let x4 = 0;
    const audioRef3 = normalizeText(audioRef2['sourceAudioLocalPath'] || audioRef2['sourceAudioUrl']);
    if (audioRef3) {
      const value40 = 'voice:' + sourceId + ':' + segmentId + ':source-audio';
      (list19['push'](
        createPlanEntry(
          value40,
          buildPersonReplacementSourceAudioNodeData({
            project: project7,
            audioRef: audioRef3,
            name: '声音片段' + formatSequence4 + ' · 原音频片段',
            binding: {
              sourceId: sourceId,
              segmentId: segmentId,
              kind: 'source-audio-segment',
              canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
            },
          }),
          { x: x4, y: y9 },
        ),
      ),
        inputKeys4['push'](value40),
        (x4 += box13['width'] + NODE_GAP));
    }
    const audioRef4 = normalizeText(audioRef2['voiceRefAudioLocalPath'] || audioRef2['voiceRefAudioUrl']);
    if (audioRef4) {
      const value41 = 'voice:' + sourceId + ':' + segmentId + ':reference-audio';
      (list19['push'](
        createPlanEntry(
          value41,
          buildPersonReplacementSourceAudioNodeData({
            project: project7,
            audioRef: audioRef4,
            name: normalizeText(audioRef2['voiceRefName']) || '声音片段' + formatSequence4 + ' · 参考音频',
            binding: {
              sourceId: sourceId,
              segmentId: segmentId,
              kind: 'reference-audio',
              canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
            },
          }),
          { x: x4, y: y9 },
        ),
      ),
        inputKeys4['push'](value41),
        (x4 += box13['width'] + NODE_GAP));
    }
    const value42 = 'voice:' + sourceId + ':' + segmentId + ':replacement-audio';
    (list19['push'](
      createPlanEntry(
        value42,
        buildPersonReplacementAudioCanvasNodeData({
          project: project7,
          audioRef: audioRef2['convertedAudioLocalPath'] || audioRef2['convertedAudioUrl'],
          name: '声音片段' + formatSequence4 + ' · 替换音频',
          prompt: audioRef2['targetText'] || audioRef2['sourceText'],
          model: audioRef2['voiceModelId'],
          allowEmpty: true,
          binding: {
            sourceId: sourceId,
            segmentId: segmentId,
            kind: 'replacement-audio-segment',
            canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
          },
        }),
        { x: x4, y: y9 },
        { inputKeys: inputKeys4 },
      ),
    ),
      (value38 = Math['max'](value38, x4 + box13['width'])),
      (value37 = Math['max'](value37, y9 + box13['height'])),
      (y9 += box13['height'] + SECTION_GAP));
  });
  const audioRef5 = normalizeText(project7['audio']?.['replacementAudioRef']);
  if (audioRef5) {
    const x5 = value38 ? value38 + NODE_GAP : 0;
    (list19['push'](
      createPlanEntry(
        'voice:timeline',
        buildPersonReplacementSourceAudioNodeData({
          project: project7,
          audioRef: audioRef5,
          name: '替换音频 · 总合成音频',
          binding: {
            kind: 'replacement-audio-timeline',
            canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
          },
        }),
        { x: x5, y: y8 },
      ),
    ),
      (value37 = Math['max'](value37, y8 + box13['height'])));
  }
  return value37;
}
function appendCompositeStage(list20, project8, y10) {
  const box14 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note'],
    box15 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['source-video'];
  list20['push'](
    createPlanEntry(
      'stage:composite:annotation',
      buildStageAnnotationNodeData({
        project: project8,
        stage: 'composite',
        title: '阶段 5 · 最终合成对比',
        content: '原视频与最终替换视频用于效果对比。',
      }),
      { x: 0, y: y10 },
    ),
  );
  const y11 = y10 + box14['height'] + NODE_GAP;
  let x6 = 0;
  const list21 = normalizeList(project8['sources']),
    count3 = list21['findIndex']((value43) => normalizeText(value43?.['videoRef']));
  if (count3 >= 0) {
    const value44 = list21[count3],
      videoRef4 = normalizeText(value44['videoRef']),
      sourceId2 = normalizeText(value44?.['id']) || 'source-' + (count3 + 1);
    (list20['push'](
      createPlanEntry(
        'project:source:' + sourceId2 + ':comparison-video',
        buildPersonReplacementVideoCanvasNodeData({
          project: project8,
          videoRef: videoRef4,
          name: '原视频 · 对比',
          type: 'source-video',
          binding: {
            sourceId: sourceId2,
            kind: 'comparison-source-video',
            canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
          },
        }),
        { x: x6 * (box15['width'] + NODE_GAP), y: y11 },
      ),
    ),
      (x6 += 1));
  }
  const videoRef5 = normalizeText(
    project8['output']?.['finalVideoRef'] || project8['output']?.['visualMasterRef'],
  );
  return (
    videoRef5 &&
      list20['push'](
        createPlanEntry(
          'project:composite-output',
          buildPersonReplacementVideoCanvasNodeData({
            project: project8,
            videoRef: videoRef5,
            name: (normalizeText(project8['title']) || '人物替换项目') + ' · 最终替换视频',
            type: 'source-video',
            binding: { kind: 'composite-output', canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'] },
          }),
          { x: x6 * (box15['width'] + NODE_GAP), y: y11 },
        ),
      ),
    y11 + box15['height']
  );
}
export function buildPersonReplacementOutputCanvasNodeData({
  project: project = {},
  videoRef: videoRef = '',
} = {}) {
  return buildPersonReplacementVideoCanvasNodeData({
    project: project,
    videoRef: videoRef,
    name: (normalizeText(project['title']) || '人物替换项目') + ' · 合成视频',
    type: 'source-video',
    binding: { kind: 'composite-output', canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'] },
  });
}
function buildReplacementClipPlan(project9, canvasScope3) {
  const list22 = [];
  let x7 = 0;
  return (
    normalizeList(project9['shots'])['forEach']((activeIndex4, value45) => {
      const videoRef6 = normalizeText(activeIndex4?.['resultVideoRef']);
      if (!videoRef6) return;
      const shotId3 = normalizeText(activeIndex4?.['id']) || 'shot-' + (value45 + 1),
        width10 = resolveShotVideoCanvasGeometry(activeIndex4);
      (list22['push'](
        createPlanEntry(
          'shot:' + shotId3 + ':replacement-video',
          applyVideoCanvasGeometry(
            buildPersonReplacementVideoCanvasNodeData({
              project: project9,
              videoRef: videoRef6,
              name: '镜头片段' + formatSequence(value45) + ' · 替换视频',
              results: getPersonReplacementVideoResults(activeIndex4),
              activeIndex: activeIndex4?.['replacementVideo']?.['activeIndex'],
              binding: { shotId: shotId3, kind: 'replacement-video', canvasScope: canvasScope3 },
            }),
            width10,
          ),
          { x: x7, y: 0 },
          { width: width10['width'], height: width10['height'] },
        ),
      ),
        (x7 += width10['width'] + NODE_GAP));
    }),
    list22
  );
}
function getPlanBounds(value46) {
  const list23 = normalizeList(value46);
  if (!list23['length']) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
  const left = Math['min'](...list23['map']((value47) => value47['position']['x'])),
    top = Math['min'](...list23['map']((value48) => value48['position']['y'])),
    right = Math['max'](...list23['map']((box16) => box16['position']['x'] + box16['width'])),
    bottom = Math['max'](...list23['map']((box17) => box17['position']['y'] + box17['height']));
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: right - left,
    height: bottom - top,
  };
}
function wrapStageEntriesInGroup({
  entries: entries,
  project: project10,
  stage: stage2,
  name: name4,
  canvasScope: canvasScope = PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'],
} = {}) {
  const list24 = normalizeList(entries)['filter']((value49) => value49['type'] !== 'group');
  if (!list24['length']) return [];
  const parentKey2 = 'stage:' + normalizeText(stage2) + ':group',
    width11 = calculateGroupNodeBounds(
      list24['map']((x8) => ({
        x: x8['position']['x'],
        y: x8['position']['y'],
        width: x8['width'],
        height: x8['height'],
      })),
    ),
    planEntry = createPlanEntry(
      parentKey2,
      {
        type: 'group',
        name: normalizeText(name4),
        color: STAGE_GROUP_COLORS[normalizeText(stage2)] || 'var(--indigo)',
        width: width11['width'],
        height: width11['height'],
        personReplacementBinding: buildBinding(project10, {
          kind: 'stage-group',
          stage: normalizeText(stage2),
          canvasScope: canvasScope,
        }),
      },
      { x: width11['x'], y: width11['y'] },
      { width: width11['width'], height: width11['height'] },
    );
  return [planEntry, ...list24['map']((args9) => ({ ...args9, parentKey: parentKey2 }))];
}
function appendHorizontalStage(list25, list26, value50) {
  const box18 = getPlanBounds(list26),
    value51 = value50 - box18['left'],
    value52 = -box18['top'];
  return (
    list25['push'](
      ...list26['map']((x9) => ({
        ...x9,
        position: { x: x9['position']['x'] + value51, y: x9['position']['y'] + value52 },
      })),
    ),
    value50 + box18['width'] + STAGE_GAP
  );
}
function buildProjectCanvasPlan(project11) {
  const value53 = [],
    characterAppearanceRecords = getCharacterAppearanceRecords(project11),
    workspaceStep = normalizeWorkspaceStep(project11);
  let appendHorizontalStage2 = 0;
  const run3 = ({ stage: stage3, name: name5, buildStage: buildStage }) => {
    const entries2 = [];
    buildStage(entries2);
    const wrapStageEntriesInGroup2 = wrapStageEntriesInGroup({
      entries: entries2,
      project: project11,
      stage: stage3,
      name: name5,
    });
    appendHorizontalStage2 = appendHorizontalStage(value53, wrapStageEntriesInGroup2, appendHorizontalStage2);
  };
  return (
    run3({
      stage: 'assets',
      name: '阶段 1 · 素材设定',
      buildStage: (value54) => {
        appendAssetStage(value54, project11, 0, characterAppearanceRecords);
      },
    }),
    workspaceStep >= 2 &&
      run3({
        stage: 'image',
        name: '阶段 2 · 图像替换',
        buildStage: (value55) => {
          appendImageReplacementStage(value55, project11, 0, characterAppearanceRecords);
        },
      }),
    workspaceStep >= 3 &&
      run3({
        stage: 'video',
        name: '阶段 3 · 视频替换',
        buildStage: (value56) => {
          appendVideoReplacementStage(value56, project11, 0);
        },
      }),
    workspaceStep >= 4 &&
      run3({
        stage: 'voice',
        name: '阶段 4 · 声音克隆',
        buildStage: (value57) => {
          appendVoiceReplacementStage(value57, project11, 0);
        },
      }),
    workspaceStep >= 5 &&
      run3({
        stage: 'composite',
        name: '阶段 5 · 合成视频',
        buildStage: (value58) => {
          appendCompositeStage(value58, project11, 0);
        },
      }),
    value53
  );
}
function clonePlanEntryForScope(args10, canvasScope4, map) {
  const args11 = asObject(args10['data']?.['personReplacementBinding']),
    list27 = normalizeList(args10['inputKeys'])
      ['map'](normalizeText)
      ['filter']((value59) => map['has'](value59)),
    text10 = normalizeText(args10['parentKey']),
    value60 = {
      ...args10,
      data: { ...args10['data'], personReplacementBinding: { ...args11, canvasScope: canvasScope4 } },
    };
  (delete value60['inputKeys'], delete value60['parentKey']);
  if (list27['length']) value60['inputKeys'] = list27;
  if (text10 && map['has'](text10)) value60['parentKey'] = text10;
  return value60;
}
function normalizePlanOrigin(list28) {
  const value61 = Math['min'](...list28['map']((value62) => Number(value62['position']?.['x']) || 0)),
    value63 = Math['min'](...list28['map']((value64) => Number(value64['position']?.['y']) || 0));
  return list28['map']((args12) => ({
    ...args12,
    position: {
      x: (Number(args12['position']?.['x']) || 0) - value61,
      y: (Number(args12['position']?.['y']) || 0) - value63,
    },
  }));
}
function reflowCurrentVideoPlan(list29, project12) {
  const args13 = list29['find']((event2) => event2['key'] === 'stage:video:annotation'),
    map2 = new Map(list29['map']((event3) => [event3['key'], event3]));
  let y12 = PERSON_REPLACEMENT_CANVAS_NODE_SIZES['comment-note']['height'] + NODE_GAP;
  const entries3 = args13 ? [{ ...args13, position: { x: 0, y: 0 }, parentKey: '' }] : [];
  return (
    normalizeList(project12['shots'])['forEach']((value65, value66) => {
      const text11 = normalizeText(value65?.['id']) || 'shot-' + (value66 + 1),
        box19 = map2['get']('shot:' + text11 + ':original-video'),
        box20 = map2['get']('shot:' + text11 + ':replacement-image'),
        box21 = map2['get']('shot:' + text11 + ':replacement-video');
      let x10 = 0,
        value67 = Math['max'](
          Number(box20?.['height']) || 0,
          Number(box19?.['height']) || 0,
          Number(box21?.['height']) || 0,
          PERSON_REPLACEMENT_CANVAS_NODE_SIZES['ai-video']['height'],
        );
      (box20 &&
        (entries3['push']({ ...box20, position: { x: x10, y: y12 }, parentKey: '' }),
        (x10 += box20['width'] + NODE_GAP),
        (value67 = Math['max'](value67, box20['height']))),
        box19 &&
          (entries3['push']({ ...box19, position: { x: x10, y: y12 }, parentKey: '' }),
          (x10 += box19['width'] + NODE_GAP)),
        box21 && entries3['push']({ ...box21, position: { x: x10, y: y12 }, parentKey: '' }),
        (y12 += value67 + SECTION_GAP));
    }),
    normalizePlanOrigin(
      wrapStageEntriesInGroup({
        entries: entries3,
        project: project12,
        stage: 'video',
        name: '阶段 3 · 视频替换',
        canvasScope: PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'],
      }),
    )
  );
}
function buildCurrentInterfacePlan(value68) {
  const workspaceStep2 = normalizeWorkspaceStep(value68),
    list30 = buildProjectCanvasPlan(value68),
    value69 = (event4) => {
      if (workspaceStep2 === 1)
        return event4['key']['startsWith']('stage:assets:') || event4['key']['startsWith']('asset:');
      if (workspaceStep2 === 2)
        return (
          event4['key']['startsWith']('stage:assets:') ||
          event4['key']['startsWith']('asset:') ||
          event4['key']['startsWith']('stage:image:') ||
          /^shot:[^:]+:(?:keyframe|location-guide|prompt|replacement-image)$/['test'](event4['key'])
        );
      if (workspaceStep2 === 3)
        return (
          event4['key']['startsWith']('stage:video:') ||
          /^shot:[^:]+:(?:replacement-image|original-video|replacement-video)$/['test'](event4['key'])
        );
      if (workspaceStep2 === 4)
        return event4['key']['startsWith']('stage:voice:') || event4['key']['startsWith']('voice:');
      return false;
    },
    list31 = list30['filter'](value69),
    value70 = new Set(list31['map']((event5) => event5['key'])),
    value71 = list31['map']((value72) =>
      clonePlanEntryForScope(value72, PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'], value70),
    );
  return workspaceStep2 === 3 ? reflowCurrentVideoPlan(value71, value68) : normalizePlanOrigin(value71);
}
export function buildPersonReplacementCanvasPlan({
  project: project = {},
  scope: scope = PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'],
} = {}) {
  const scope2 = normalizeScope(scope);
  if (scope2 === PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'])
    return normalizeWorkspaceStep(project) < 5
      ? buildCurrentInterfacePlan(project)
      : buildReplacementClipPlan(project, scope2);
  return buildProjectCanvasPlan(project);
}
function buildPlanLayout(list32 = []) {
  return Object['fromEntries'](
    normalizeList(list32)['map']((box22) => [
      box22['key'],
      {
        x: Number(box22['position']?.['x']) || 0,
        y: Number(box22['position']?.['y']) || 0,
        width: Number(box22['width']) || 0,
        height: Number(box22['height']) || 0,
      },
    ]),
  );
}
function hasSameGeometry(box23 = {}, box24 = {}) {
  return (
    Number(box23['x']) === Number(box24['x']) &&
    Number(box23['y']) === Number(box24['y']) &&
    Number(box23['width']) === Number(box24['width']) &&
    Number(box23['height']) === Number(box24['height'])
  );
}
async function shouldReflowManagedNodes({
  plan: plan = [],
  planLayout: planLayout = {},
  previousBinding: previousBinding = {},
  adapter: adapter2,
  canvasId: canvasId = '',
} = {}) {
  const asObject3 = asObject(previousBinding['nodes']),
    list33 = plan['map']((event6) => event6['key']),
    list34 = Object['keys'](asObject3);
  if (
    list33['length'] !== list34['length'] ||
    list33['some']((value73) => !normalizeText(asObject3[value73])) ||
    list34['some']((value74) => !(value74 in planLayout))
  )
    return true;
  const asObject4 = asObject(previousBinding['layout']);
  if (Object['keys'](asObject4)['length'])
    return list33['some'](
      (value75) => !hasSameGeometry(asObject(asObject4[value75]), asObject(planLayout[value75])),
    );
  if (typeof adapter2?.['getNode'] !== 'function') return false;
  for (const box25 of plan) {
    const text12 = normalizeText(asObject3[box25['key']]);
    if (!text12 || !(await adapter2['nodeExists'](text12, canvasId))) return true;
    const box26 = await adapter2['getNode'](text12, canvasId);
    if (
      Number(box26?.['width']) !== Number(box25['width']) ||
      Number(box26?.['height']) !== Number(box25['height'])
    )
      return true;
  }
  return true;
}
async function rollbackCanvasMutation({
  adapter: adapter3,
  canvasId: canvasId = '',
  reused: reused = false,
  mutationSnapshot: mutationSnapshot,
} = {}) {
  if (!reused && typeof adapter3?.['deleteCanvas'] === 'function')
    try {
      const value76 = await adapter3['deleteCanvas'](canvasId, { skipDirtyConfirm: true });
      if (value76 !== false) return true;
    } catch {}
  if (typeof adapter3?.['restoreMutationSnapshot'] === 'function' && mutationSnapshot)
    try {
      return (await adapter3['restoreMutationSnapshot'](mutationSnapshot, { canvasId: canvasId })) !== false;
    } catch {}
  return false;
}
export async function syncPersonReplacementCanvas({
  project: project = {},
  scope: scope = PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'],
  adapter: adapter4,
  saveOutputBlob: saveOutputBlob = null,
  createLocationGuide: createLocationGuide2,
} = {}) {
  const list35 = ['canvasExists', 'switchCanvas', 'createCanvas', 'nodeExists', 'createNode', 'updateNode'];
  if (list35['some']((value77) => typeof adapter4?.[value77] !== 'function'))
    throw new Error('人物替换画布适配器不完整');
  const scope3 = normalizeScope(scope),
    workspaceStep3 = normalizeWorkspaceStep(project),
    value78 = scope3 === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'] || workspaceStep3 <= 2,
    value79 =
      scope3 === PERSON_REPLACEMENT_CANVAS_SCOPES['PROJECT'] ||
      workspaceStep3 === 2 ||
      workspaceStep3 === 3,
    [characters2, shots2] = await Promise['all']([
      value78 ? resolveProjectAppearanceImageSizes(project) : project,
      value79 ? resolveProjectShotImageSizes(project) : project,
    ]),
    project13 = { ...project, characters: characters2['characters'], shots: shots2['shots'] },
    plan2 = buildPersonReplacementCanvasPlan({ project: project13, scope: scope3 });
  if (!plan2['length']) throw new Error('当前项目还没有可同步到画布的内容。');
  if (plan2['some']((value80) => value80['parentKey']) && typeof adapter4?.['setNodeParent'] !== 'function')
    throw new Error('人物替换画布适配器缺少节点分组能力');
  if (
    plan2['some']((value81) => normalizeList(value81['inputKeys'])['length']) &&
    typeof adapter4?.['connectNodes'] !== 'function'
  )
    throw new Error('人物替换画布适配器缺少节点连线能力');
  const text13 = normalizeText(project['title']) || '人物替换项目',
    canvasName =
      scope3 === PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'] && workspaceStep3 < 5
        ? text13 + ' · ' + getWorkspaceStepName(workspaceStep3)
        : text13,
    previousBinding2 = asObject(project['output']?.['canvasBinding']),
    text14 = normalizeText(previousBinding2['canvasId']),
    text15 = normalizeText(previousBinding2['scope']) === scope3,
    value82 =
      scope3 !== PERSON_REPLACEMENT_CANVAS_SCOPES['CLIPS'] ||
      Math['trunc'](Number(previousBinding2['workspaceStep']) || 0) === workspaceStep3,
    value83 =
      Math['trunc'](Number(previousBinding2['layoutVersion']) || 0) ===
      PERSON_REPLACEMENT_CANVAS_LAYOUT_VERSION,
    canReuseCanvas2 = Boolean(
      text14 && text15 && value82 && value83 && (await adapter4['canvasExists'](text14)),
    );
  let canvasId2 = '';
  if (canReuseCanvas2) {
    const value84 = await adapter4['switchCanvas'](text14);
    if (value84 === false) throw new Error('无法切换到已绑定的人物替换画布：' + text14);
    canvasId2 = text14;
  } else canvasId2 = normalizeText(await adapter4['createCanvas'](canvasName));
  if (!canvasId2) throw new Error('新建人物替换画布后未获得活动画布 ID');
  const previousNodes2 = asObject(previousBinding2['nodes']),
    planLayout2 = buildPlanLayout(plan2),
    reflowed = canReuseCanvas2
      ? await shouldReflowManagedNodes({
          plan: plan2,
          planLayout: planLayout2,
          previousBinding: previousBinding2,
          adapter: adapter4,
          canvasId: canvasId2,
        })
      : false,
    nodes2 = {},
    nodes3 = [];
  let createdCount = 0,
    updatedCount = 0,
    deletedCount = 0;
  const sequenceKey = 'person-replacement:' + (normalizeText(project['id']) || canvasId2),
    mutationSnapshot2 = await adapter4['createMutationSnapshot']?.({ canvasId: canvasId2 });
  try {
    await materializePersonReplacementLocationGuides({
      plan: plan2,
      project: project13,
      adapter: adapter4,
      canReuseCanvas: canReuseCanvas2,
      previousNodes: previousNodes2,
      canvasId: canvasId2,
      saveOutputBlob: saveOutputBlob,
      createLocationGuide: createLocationGuide2,
    });
    if (canReuseCanvas2) {
      const list36 = [];
      for (const [value85, value86] of Object['entries'](previousNodes2)) {
        if (value85 in planLayout2) continue;
        const text16 = normalizeText(value86);
        text16 && (await adapter4['nodeExists'](text16, canvasId2)) && list36['push'](text16);
      }
      if (list36['length']) {
        if (typeof adapter4['deleteNodes'] !== 'function')
          throw new Error('人物替换画布适配器缺少托管节点清理能力');
        const value87 = await adapter4['deleteNodes']([...new Set(list36)], { canvasId: canvasId2 });
        if (value87 === false) throw new Error('清理已失效的人物替换画布节点失败');
        deletedCount = new Set(list36)['size'];
      }
    }
    for (const key3 of plan2) {
      const text17 = normalizeText(previousNodes2[key3['key']]),
        value88 = Boolean(canReuseCanvas2 && text17 && (await adapter4['nodeExists'](text17, canvasId2))),
        node = value88
          ? await adapter4['updateNode'](text17, key3['data'], {
              canvasId: canvasId2,
              key: key3['key'],
              type: key3['type'],
              width: key3['width'],
              height: key3['height'],
              ...(reflowed ? { position: key3['position'] } : {}),
            })
          : await adapter4['createNode'](key3['data'], {
              canvasId: canvasId2,
              key: key3['key'],
              type: key3['type'],
              width: key3['width'],
              height: key3['height'],
              position: key3['position'],
              sequenceKey: sequenceKey,
              parentNodeId: normalizeText(nodes2[key3['parentKey']]),
            });
      if (value88) updatedCount += 1;
      else createdCount += 1;
      const nodeId = normalizeText(node?.['id'] || (value88 ? text17 : ''));
      if (!nodeId) throw new Error('同步人物替换画布节点失败：' + (key3['data']['name'] || key3['key']));
      ((nodes2[key3['key']] = nodeId), nodes3['push']({ ...key3, nodeId: nodeId, node: node }));
    }
    for (const event7 of plan2) {
      if (!event7['parentKey']) continue;
      const text18 = normalizeText(nodes2[event7['key']]),
        text19 = normalizeText(nodes2[event7['parentKey']]);
      if (!text18 || !text19) throw new Error('人物替换画布分组缺少节点：' + event7['key']);
      const value89 = await adapter4['setNodeParent'](text18, text19, { canvasId: canvasId2 });
      if (value89 === false) throw new Error('人物替换画布节点分组失败：' + event7['key']);
    }
    for (const targetKey of plan2) {
      const text20 = normalizeText(nodes2[targetKey['key']]);
      for (const sourceKey of normalizeList(targetKey['inputKeys'])) {
        const text21 = normalizeText(nodes2[sourceKey]);
        if (!text21 || !text20)
          throw new Error('人物替换画布连线缺少节点：' + sourceKey + ' → ' + targetKey['key']);
        const value90 = await adapter4['connectNodes'](text21, text20, {
          canvasId: canvasId2,
          sourceKey: sourceKey,
          targetKey: targetKey['key'],
        });
        if (value90 === false)
          throw new Error('人物替换画布节点连线失败：' + sourceKey + ' → ' + targetKey['key']);
      }
    }
    (await adapter4['renameCanvas']?.(canvasId2, canvasName),
      adapter4['commit']?.(),
      typeof adapter4['focusNodes'] === 'function' &&
        (await adapter4['focusNodes'](
          nodes3['map']((value91) => value91['nodeId']),
          { padding: 80, durationMs: 0, maxZoom: 0.2 },
        )));
  } catch (value92) {
    await rollbackCanvasMutation({
      adapter: adapter4,
      canvasId: canvasId2,
      reused: canReuseCanvas2,
      mutationSnapshot: mutationSnapshot2,
    });
    throw value92;
  }
  const binding3 = {
    canvasId: canvasId2,
    scope: scope3,
    workspaceStep: workspaceStep3,
    layoutVersion: PERSON_REPLACEMENT_CANVAS_LAYOUT_VERSION,
    nodes: nodes2,
    layout: planLayout2,
  };
  return {
    canvasId: canvasId2,
    canvasName: canvasName,
    scope: scope3,
    nodes: nodes3,
    reused: canReuseCanvas2,
    reflowed: reflowed,
    createdCount: createdCount,
    updatedCount: updatedCount,
    deletedCount: deletedCount,
    binding: binding3,
    canvasBinding: binding3,
  };
}

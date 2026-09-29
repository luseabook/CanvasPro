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
const NODE_GAP = 0x48,
  ASSET_COLUMNS = 0x5,
  ASSET_CATEGORY_GAP = 0xb4,
  ASSET_CATEGORY_NOTE_HEIGHT = 0xb4,
  ASSET_CATEGORY_MIN_WIDTH = 0x2d0,
  STAGE_GAP = 0x140,
  STAGE_GROUP_COLORS = Object['freeze']({
    project: 'var(--indigo)',
    assets: 'var(--green)',
    episode: Object['freeze'](['var(--gold)', 'var(--purple)', 'var(--cyan)']),
  });
export const STORY_PROJECT_CANVAS_LAYOUT_VERSION = 0x4;
export const STORY_PROJECT_CANVAS_NODE_SIZES = Object['freeze']({
  'comment-note': Object['freeze']({ width: 0x578, height: 0x120 }),
  group: Object['freeze']({ width: 0x200, height: 0x170 }),
  'source-text': Object['freeze']({ width: 0x2d0, height: 0x1e0 }),
  'source-image': Object['freeze']({ width: 0x200, height: 0x120 }),
  'source-video': Object['freeze']({ width: 0x200, height: 0x120 }),
  'source-audio': Object['freeze']({ width: 0x1a4, height: 0xb4 }),
  'ai-image': Object['freeze']({ width: 0x120, height: 0x120 }),
  'storyboard-script': Object['freeze']({ width: 0x400, height: 0x240 }),
  'ai-video': Object['freeze']({ width: 0x200, height: 0x120 }),
});
function asObject(_0x22f158) {
  return _0x22f158 && typeof _0x22f158 === 'object' && !Array['isArray'](_0x22f158) ? _0x22f158 : {};
}
function normalizeText(_0x180eb1) {
  return String(_0x180eb1 || '')['trim']();
}
function normalizeIndex(_0x4a727f, _0x1ec13c) {
  const _0x2ca793 = Number(_0x4a727f);
  if (!Number['isFinite'](_0x2ca793) || _0x1ec13c <= 0x0) return 0x0;
  return Math['max'](0x0, Math['min'](_0x1ec13c - 0x1, Math['trunc'](_0x2ca793)));
}
function normalizeList(_0x23bb1f) {
  return Array['isArray'](_0x23bb1f) ? _0x23bb1f['filter'](Boolean) : [];
}
export const storyWorkspaceCanvasMaterializationBindingPolicy = Object['freeze']({
  getProjectId(_0x1a6ea2) {
    return normalizeText(_0x1a6ea2?.['storyWorkspaceBinding']?.['projectId']);
  },
  findProjectAnchor({ nodes: nodes = [], projectId: _0x35d571 } = {}) {
    const _0x181d79 = normalizeText(_0x35d571);
    if (!_0x181d79) return null;
    const _0x2cb217 = (Array['isArray'](nodes) ? nodes : [])['filter'](
      (_0x54cea5) => normalizeText(_0x54cea5?.['storyWorkspaceBinding']?.['projectId']) === _0x181d79,
    );
    return (
      _0x2cb217['find'](
        (_0x25a20c) =>
          _0x25a20c?.['storyWorkspaceBinding']?.['kind'] === 'stage-group' &&
          _0x25a20c?.['storyWorkspaceBinding']?.['stage'] === 'project',
      ) ||
      _0x2cb217['find']((_0x161623) => _0x161623?.['storyWorkspaceBinding']?.['kind'] === 'stage-group') ||
      _0x2cb217['find'](
        (_0x1853b9) => _0x1853b9?.['storyWorkspaceBinding']?.['kind'] === 'project-overview',
      ) ||
      null
    );
  },
});
function pushLabeledLine(_0x19d832, _0x2de124, _0x22ace7) {
  const _0x4299cf = normalizeText(_0x22ace7);
  if (_0x4299cf) _0x19d832['push'](_0x2de124 + '：' + _0x4299cf);
}
function getEpisodeLabel(_0x2e744f = {}) {
  const _0x92ec05 = Math['max'](0x0, Math['trunc'](Number(_0x2e744f['number']) || 0x0));
  return [_0x92ec05 > 0x0 ? '第\x20' + _0x92ec05 + '\x20集' : '分集', normalizeText(_0x2e744f['title'])]
    ['filter'](Boolean)
    ['join'](' · ');
}
function getStableKeyPart(_0x42478a, _0x2e8173) {
  return normalizeText(_0x42478a) || _0x2e8173;
}
function getAssetKindLabel(_0x3159f0) {
  if (_0x3159f0 === 'scene') return '场景';
  if (_0x3159f0 === 'prop') return '道具';
  return '角色';
}
function getPositiveMediaDimension(..._0x340168) {
  for (const _0x1d5e4e of _0x340168) {
    const _0xc774b4 = Number(_0x1d5e4e);
    if (Number['isFinite'](_0xc774b4) && _0xc774b4 > 0x0) return _0xc774b4;
  }
  return 0x0;
}
function resolveStoryAssetCanvasGeometry({
  asset: asset = {},
  appearance: appearance = {},
  activeImage: activeImage = {},
} = {}) {
  const _0x391311 = STORY_PROJECT_CANVAS_NODE_SIZES['ai-image'],
    _0x161db6 = asObject(appearance['generatedImage']),
    _0x454b2f = asObject(asset['generatedImage']),
    _0x53d7de = getPositiveMediaDimension(
      appearance['imageWidth'],
      appearance['naturalWidth'],
      appearance['originalWidth'],
      appearance['width'],
      activeImage['imageWidth'],
      activeImage['naturalWidth'],
      activeImage['originalWidth'],
      activeImage['width'],
      _0x161db6['imageWidth'],
      _0x161db6['naturalWidth'],
      _0x161db6['originalWidth'],
      _0x161db6['width'],
      asset['imageWidth'],
      asset['naturalWidth'],
      asset['originalWidth'],
      asset['width'],
      _0x454b2f['imageWidth'],
      _0x454b2f['naturalWidth'],
      _0x454b2f['originalWidth'],
      _0x454b2f['width'],
    ),
    _0x213b4d = getPositiveMediaDimension(
      appearance['imageHeight'],
      appearance['naturalHeight'],
      appearance['originalHeight'],
      appearance['height'],
      activeImage['imageHeight'],
      activeImage['naturalHeight'],
      activeImage['originalHeight'],
      activeImage['height'],
      _0x161db6['imageHeight'],
      _0x161db6['naturalHeight'],
      _0x161db6['originalHeight'],
      _0x161db6['height'],
      asset['imageHeight'],
      asset['naturalHeight'],
      asset['originalHeight'],
      asset['height'],
      _0x454b2f['imageHeight'],
      _0x454b2f['naturalHeight'],
      _0x454b2f['originalHeight'],
      _0x454b2f['height'],
    );
  if (!(_0x53d7de > 0x0 && _0x213b4d > 0x0))
    return { width: _0x391311['width'], height: _0x391311['height'], imageWidth: 0x0, imageHeight: 0x0 };
  return {
    ...getAutoMediaSizeByShortSide(_0x53d7de, _0x213b4d),
    imageWidth: _0x53d7de,
    imageHeight: _0x213b4d,
  };
}
async function resolveStoryAssetImageRecordSize(_0x4a2875 = {}) {
  const _0x5f256e = resolveStoryAssetCanvasGeometry({
    asset: _0x4a2875,
    appearance: _0x4a2875,
    activeImage: asObject(_0x4a2875['generatedImage']),
  });
  if (_0x5f256e['imageWidth'] > 0x0 && _0x5f256e['imageHeight'] > 0x0) return _0x4a2875;
  const _0x31bee4 = asObject(_0x4a2875['generatedImage']),
    _0x25c46a = await resolveOutputMediaSize({
      localPath: normalizeText(
        _0x31bee4['localPath'] || _0x31bee4['originalLocalPath'] || _0x4a2875['localPath'],
      ),
      imageUrl: normalizeText(_0x4a2875['imageUrl'] || _0x31bee4['imageUrl'] || _0x31bee4['url']),
      sourceUrl: normalizeText(_0x31bee4['sourceUrl']),
      thumbUrl: normalizeText(_0x31bee4['thumbUrl']),
    });
  return _0x25c46a
    ? { ..._0x4a2875, imageWidth: _0x25c46a['width'], imageHeight: _0x25c46a['height'] }
    : _0x4a2875;
}
async function resolveStoryProjectAssetImageSizes(_0x21fe97 = []) {
  return Promise['all'](
    normalizeList(_0x21fe97)['map'](async (_0x1622c7) => {
      const _0x43a0f1 = normalizeList(_0x1622c7['appearances']);
      if (!_0x43a0f1['length']) return resolveStoryAssetImageRecordSize(_0x1622c7);
      return {
        ..._0x1622c7,
        appearances: await Promise['all'](
          _0x43a0f1['map']((_0x4465e1) => resolveStoryAssetImageRecordSize(_0x4465e1)),
        ),
      };
    }),
  );
}
function createPlanEntry(_0x56accd, _0x16068c, _0x173efa, _0x548ddb = {}) {
  const _0xb5b153 = normalizeText(_0x16068c?.['type']),
    _0x4515a0 = STORY_PROJECT_CANVAS_NODE_SIZES[_0xb5b153];
  if (!_0xb5b153 || !_0x4515a0) throw new Error('不支持的项目画布节点类型：' + (_0xb5b153 || 'unknown'));
  const _0xeaf807 = Math['max'](0x1, Number(_0x548ddb['width']) || _0x4515a0['width']),
    _0x5e43eb = Math['max'](0x1, Number(_0x548ddb['height']) || _0x4515a0['height']),
    _0x8ef7a1 = normalizeList(_0x548ddb['inputConnections'])
      ['map']((_0x8304b2) => {
        if (typeof _0x8304b2 === 'string') return { key: normalizeText(_0x8304b2), preferredRefSlot: '' };
        return {
          key: normalizeText(_0x8304b2?.['key']),
          preferredRefSlot: normalizeText(_0x8304b2?.['preferredRefSlot']),
        };
      })
      ['filter']((_0x384c8c) => _0x384c8c['key']);
  return {
    key: _0x56accd,
    type: _0xb5b153,
    data: _0x16068c,
    width: _0xeaf807,
    height: _0x5e43eb,
    position: { x: Number(_0x173efa?.['x']) || 0x0, y: Number(_0x173efa?.['y']) || 0x0 },
    ...(normalizeText(_0x548ddb['parentKey']) ? { parentKey: normalizeText(_0x548ddb['parentKey']) } : {}),
    ...(normalizeList(_0x548ddb['inputKeys'])['length']
      ? { inputKeys: normalizeList(_0x548ddb['inputKeys'])['map'](normalizeText)['filter'](Boolean) }
      : {}),
    ...(_0x8ef7a1['length'] ? { inputConnections: _0x8ef7a1 } : {}),
  };
}
export function buildStoryProjectCanvasName(_0x11f23a = {}, _0x57095b = {}) {
  return buildStoryLinkedCanvasName(_0x11f23a, _0x57095b);
}
export function buildStoryProjectOverviewNodeData({ project: project = {} } = {}) {
  const _0x310a9b = [];
  return (
    pushLabeledLine(_0x310a9b, '项目名称', buildStoryProjectCanvasName(project)),
    pushLabeledLine(_0x310a9b, '类型', project['storyType']),
    pushLabeledLine(_0x310a9b, '目标受众', project['targetAudience']),
    pushLabeledLine(_0x310a9b, '一句话故事', project['logline']),
    pushLabeledLine(_0x310a9b, '故事摘要', project['summary']),
    pushLabeledLine(_0x310a9b, '故事背景', project['background']),
    pushLabeledLine(_0x310a9b, '世界设定', project['setting']),
    pushLabeledLine(_0x310a9b, '核心钩子', project['coreHook']),
    {
      type: 'source-text',
      name: buildStoryProjectCanvasName(project) + ' · 项目设定',
      content: _0x310a9b['join']('\x0a\x0a'),
      storyWorkspaceBinding: { projectId: normalizeText(project['id']), kind: 'project-overview' },
    }
  );
}
export function buildStoryProjectCopyNodeData({ project: project = {} } = {}) {
  const _0x520a9f = [],
    _0x3d6b54 = normalizeText(project['originalCreative'] || project['sourceDocument']?.['text']);
  if (_0x3d6b54) _0x520a9f['push']('原始创意\n' + _0x3d6b54);
  const _0xd369f4 = normalizeText(project['plotScript']);
  if (_0xd369f4 && _0xd369f4 !== _0x3d6b54) _0x520a9f['push']('完整文案\n' + _0xd369f4);
  const _0x21ca9a = normalizeText(project['narrationScript']);
  return (
    _0x21ca9a &&
      _0x21ca9a !== _0xd369f4 &&
      _0x21ca9a !== _0x3d6b54 &&
      _0x520a9f['push']('旁白文案\x0a' + _0x21ca9a),
    {
      type: 'source-text',
      name: buildStoryProjectCanvasName(project) + '\x20·\x20完整文案',
      content: _0x520a9f['join']('\x0a\x0a---\x0a\x0a'),
      storyWorkspaceBinding: { projectId: normalizeText(project['id']), kind: 'project-copy' },
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
  const _0x34e3cc = asObject(appearance['generatedImage']),
    _0x4efe95 = normalizeText(
      appearance['imageUrl'] ||
        _0x34e3cc['imageUrl'] ||
        _0x34e3cc['url'] ||
        _0x34e3cc['sourceUrl'] ||
        asset['imageUrl'],
    ),
    _0x8750c8 =
      Array['isArray'](appearance['generatedImages']) && appearance['generatedImages']['length']
        ? appearance['generatedImages']
        : Object['keys'](_0x34e3cc)['length'] > 0x0
          ? [{ ..._0x34e3cc, imageUrl: _0x4efe95 || _0x34e3cc['imageUrl'] }]
          : _0x4efe95
            ? [{ url: _0x4efe95, imageUrl: _0x4efe95, sourceUrl: _0x4efe95, thumbUrl: _0x4efe95 }]
            : [],
    _0x18899f = normalizeImageGenerationResult({ images: _0x8750c8 })['items'],
    _0x22c28b = normalizeIndex(appearance['activeIndex'], _0x18899f['length']),
    _0x579db7 = _0x18899f[_0x22c28b] || {},
    _0x231da7 = resolveStoryAssetCanvasGeometry({
      asset: asset,
      appearance: appearance,
      activeImage: _0x579db7,
    }),
    _0xc22ae = normalizeText(appearance['name']),
    _0x35fbdd = !_0xc22ae || _0xc22ae === '基础形象';
  return {
    type: 'ai-image',
    name: [getAssetKindLabel(asset['kind']), normalizeText(asset['name']), _0x35fbdd ? '' : _0xc22ae]
      ['filter'](Boolean)
      ['join'](' · '),
    prompt: normalizeText(
      appearance['prompt'] || asset['prompt'] || appearance['description'] || asset['description'],
    ),
    model: normalizeText(appearance['modelId'] || appearance['generation']?.['modelId'] || modelId),
    provider: normalizeText(appearance['provider'] || appearance['generation']?.['provider'] || provider),
    generationParams: { ...asObject(generationParams), ...asObject(appearance['generationParams']) },
    images: _0x18899f,
    mainImageIndex: _0x22c28b,
    isImagesExpanded: ![],
    imageUrl: normalizeText(_0x579db7['imageUrl'] || _0x579db7['url'] || _0x4efe95),
    sourceUrl: normalizeText(_0x579db7['sourceUrl']),
    thumbUrl: normalizeText(_0x579db7['thumbUrl']),
    localPath: normalizeText(_0x579db7['localPath']),
    originalLocalPath: normalizeText(_0x579db7['originalLocalPath']),
    displayLocalPath: normalizeText(_0x579db7['displayLocalPath']),
    thumbLocalPath: normalizeText(_0x579db7['thumbLocalPath']),
    sourceId: normalizeText(_0x579db7['sourceId']),
    thumbId: normalizeText(_0x579db7['thumbId']),
    width: _0x231da7['width'],
    height: _0x231da7['height'],
    ...(_0x231da7['imageWidth'] > 0x0 && _0x231da7['imageHeight'] > 0x0
      ? { imageWidth: _0x231da7['imageWidth'], imageHeight: _0x231da7['imageHeight'] }
      : {}),
    storyWorkspaceBinding: {
      projectId: normalizeText(project['id']),
      kind: 'asset-image',
      assetId: normalizeText(asset['id']),
      appearanceId: normalizeText(appearance['id']),
      assetKind: normalizeText(asset['kind']) || 'character',
    },
  };
}
export function buildStoryEpisodeCopyNodeData({ project: project = {}, episode: episode = {} } = {}) {
  const _0x37444e = [];
  (pushLabeledLine(_0x37444e, '分集', getEpisodeLabel(episode)),
    pushLabeledLine(_0x37444e, '本集梗概', episode['synopsis']),
    pushLabeledLine(_0x37444e, '本集钩子', episode['hook'] || episode['coreHook']));
  const _0x47c0cd = normalizeText(
    typeof episode['script'] === 'string' ? episode['script'] : episode['script']?.['fullText'],
  );
  if (_0x47c0cd) _0x37444e['push']('完整剧本\n' + _0x47c0cd);
  return {
    type: 'source-text',
    name: getEpisodeLabel(episode) + ' · 分集文案',
    content: _0x37444e['join']('\x0a\x0a'),
    storyWorkspaceBinding: {
      projectId: normalizeText(project['id']),
      episodeId: normalizeText(episode['id']),
      kind: 'episode-copy',
    },
  };
}
function buildAssetLookup(_0x146f6d = []) {
  const _0x7a935a = new Map();
  return (
    normalizeList(_0x146f6d)['forEach']((_0x2be1e3) => {
      [_0x2be1e3['id'], _0x2be1e3['planningRef']]
        ['map'](normalizeText)
        ['filter'](Boolean)
        ['forEach']((_0x3b0c3d) => {
          _0x7a935a['set'](_0x3b0c3d, _0x2be1e3);
        });
    }),
    _0x7a935a
  );
}
function describeShotAssets(_0x478ec0, _0x2b9783) {
  const _0x44e13b = { character: [], scene: [], prop: [], all: [] };
  return (
    normalizeList(_0x478ec0)['forEach']((_0x4975e5) => {
      const _0x346cb2 = normalizeText(_0x4975e5?.['assetRef']),
        _0x4a4432 = _0x2b9783['get'](_0x346cb2);
      if (!_0x4a4432) return;
      const _0x46fda7 = normalizeText(_0x4a4432['name']) || _0x346cb2,
        _0x18ede2 = normalizeText(_0x4975e5?.['appearanceRef']),
        _0x2fd853 = normalizeList(_0x4a4432['appearances'])['find'](
          (_0x303b50) =>
            normalizeText(_0x303b50?.['id']) === _0x18ede2 ||
            normalizeText(_0x303b50?.['planningRef']) === _0x18ede2,
        ),
        _0x8bded9 =
          _0x2fd853 && normalizeText(_0x2fd853['name']) !== '基础形象'
            ? _0x46fda7 + '\x20·\x20' + normalizeText(_0x2fd853['name'])
            : _0x46fda7,
        _0x16fc71 = ['character', 'scene', 'prop']['includes'](_0x4a4432['kind'])
          ? _0x4a4432['kind']
          : 'character';
      if (!_0x44e13b[_0x16fc71]['includes'](_0x8bded9)) _0x44e13b[_0x16fc71]['push'](_0x8bded9);
      if (!_0x44e13b['all']['includes'](_0x8bded9)) _0x44e13b['all']['push'](_0x8bded9);
    }),
    _0x44e13b
  );
}
export function buildStoryEpisodeStoryboardNodeData({
  project: project = {},
  episode: episode = {},
  assets: assets = [],
} = {}) {
  const _0x897daf = buildAssetLookup(assets),
    _0x77affe = [];
  normalizeList(episode['clips'])['forEach']((_0x4a6d83, _0x2a36f0) => {
    normalizeList(_0x4a6d83['shots'])['forEach']((_0x589f23, _0x4a6ca7) => {
      const _0x163126 = describeShotAssets(_0x589f23['assetUsages'], _0x897daf),
        _0x3698f8 = Number(_0x589f23['durationSec'] || _0x589f23['durationSeconds']);
      _0x77affe['push']({
        镜号:
          Math['max'](0x1, Math['trunc'](Number(_0x4a6d83['number']) || _0x2a36f0 + 0x1)) +
          '-' +
          (_0x4a6ca7 + 0x1),
        时长:
          normalizeText(_0x589f23['time']) ||
          (Number['isFinite'](_0x3698f8) && _0x3698f8 > 0x0 ? _0x3698f8 + 's' : ''),
        场景: _0x163126['scene']['join']('、'),
        画面描述: normalizeText(_0x589f23['visual']),
        角色: _0x163126['character']['join']('、'),
        角色描述: _0x163126['character']['join']('、'),
        角色动作: normalizeText(_0x589f23['action']),
        情绪: normalizeText(_0x589f23['emotion'] || _0x4a6d83['creativeIntent']),
        参考: _0x163126['all']['join']('、'),
        图片提示词: normalizeText(_0x589f23['imagePrompt']),
        视频提示词: normalizeText(_0x589f23['videoPrompt'] || _0x4a6d83['prompt']),
        对白: [normalizeText(_0x589f23['dialogue']), normalizeText(_0x589f23['voiceover'])]
          ['filter'](Boolean)
          ['join']('\x0a'),
        音效: normalizeText(_0x589f23['audio']),
      });
    });
  });
  const _0x9c789a = getEpisodeLabel(episode) + ' · 分镜表';
  return {
    type: 'storyboard-script',
    name: _0x9c789a,
    storyboardScript: createDefaultStoryboardScriptState({
      title: _0x9c789a,
      mediaMode: 'video',
      rows: _0x77affe,
    }),
    storyWorkspaceBinding: {
      projectId: normalizeText(project['id']),
      episodeId: normalizeText(episode['id']),
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
    style: { fontSize: 0x28, textColor: 'white', backgroundColor: 'transparent' },
    storyWorkspaceBinding: {
      projectId: normalizeText(project['id']),
      episodeId: normalizeText(episode?.['id']),
      kind: 'stage-annotation',
      stage: normalizeText(stage),
      canvasScope: 'project',
    },
  };
}
function normalizeStoryAssetKind(_0x3cb158) {
  const _0x3c09e9 = normalizeText(_0x3cb158);
  return ['character', 'scene', 'prop']['includes'](_0x3c09e9) ? _0x3c09e9 : 'character';
}
function buildStoryClipInputMediaLocation(_0x37ab12 = {}) {
  const _0x343b4c = normalizeText(
      _0x37ab12?.['url'] ||
        _0x37ab12?.['localUrl'] ||
        _0x37ab12?.['imageUrl'] ||
        _0x37ab12?.['videoUrl'] ||
        _0x37ab12?.['audioUrl'] ||
        _0x37ab12?.['localPath'],
    ),
    _0x4665fa = normalizeLocalPath(_0x343b4c);
  return { localPath: _0x4665fa, url: localPathToUrl(_0x4665fa) || _0x343b4c };
}
function buildStoryClipInputCanvasNodeData({
  project: project = {},
  episode: episode = {},
  clip: clip = {},
  input: input = {},
  kind: kind = 'image',
  inputIndex: inputIndex = 0x0,
} = {}) {
  const _0x1a5873 = buildStoryClipInputMediaLocation(input);
  if (!_0x1a5873['url']) return null;
  const _0x1a2600 = getEpisodeLabel(episode),
    _0x16289d = Math['max'](0x1, Math['trunc'](Number(clip['number']) || 0x1)),
    _0x1c3faa = { image: '图片入参', video: '视频入参', audio: '音频入参' }[kind] || '媒体入参',
    _0x1b61ee =
      normalizeText(input['name']) ||
      _0x1a2600 + ' · 片段 ' + _0x16289d + '\x20·\x20' + _0x1c3faa + '\x20' + (inputIndex + 0x1),
    _0x2a6d92 = {
      projectId: normalizeText(project['id']),
      episodeId: normalizeText(episode['id']),
      clipId: normalizeText(clip['id']),
      kind: 'clip-input',
      inputKind: kind,
      slotId: normalizeText(input['slotId']),
      canvasScope: 'project',
    };
  if (kind === 'video') {
    const _0x4cc913 = normalizeVideoGenerationResult({
      videos: [{ localPath: _0x1a5873['localPath'], videoUrl: _0x1a5873['url'] }],
    })['items'][0x0];
    return {
      type: 'source-video',
      name: _0x1b61ee,
      videos: _0x4cc913 ? [_0x4cc913] : [],
      mainVideoIndex: 0x0,
      videoUrl: normalizeText(_0x4cc913?.['videoUrl'] || _0x1a5873['url']),
      localPath: normalizeText(_0x4cc913?.['localPath'] || _0x1a5873['localPath']),
      storyWorkspaceBinding: _0x2a6d92,
    };
  }
  if (kind === 'audio') {
    const _0x30806c = normalizeAudioGenerationResult({
      audios: [{ localPath: _0x1a5873['localPath'], audioUrl: _0x1a5873['url'] }],
    })['items'][0x0];
    return {
      type: 'source-audio',
      name: _0x1b61ee,
      fileName: _0x1b61ee,
      audios: _0x30806c ? [_0x30806c] : [],
      mainAudioIndex: 0x0,
      audioUrl: normalizeText(_0x30806c?.['audioUrl'] || _0x1a5873['url']),
      localPath: normalizeText(_0x30806c?.['localPath'] || _0x1a5873['localPath']),
      storyWorkspaceBinding: _0x2a6d92,
    };
  }
  const _0x2027b2 = normalizeImageGenerationResult({
    images: [
      {
        localPath: _0x1a5873['localPath'],
        imageUrl: _0x1a5873['url'],
        sourceUrl: _0x1a5873['url'],
        ...buildCanvasLocalImageFields(input),
      },
    ],
  })['items'][0x0];
  return {
    type: 'source-image',
    name: _0x1b61ee,
    images: _0x2027b2 ? [_0x2027b2] : [],
    mainImageIndex: 0x0,
    imageUrl: normalizeText(_0x2027b2?.['imageUrl'] || _0x1a5873['url']),
    sourceUrl: normalizeText(_0x2027b2?.['sourceUrl'] || _0x1a5873['url']),
    localPath: normalizeText(_0x2027b2?.['localPath'] || _0x1a5873['localPath']),
    ...buildCanvasLocalImageFields(_0x2027b2 || {}),
    storyWorkspaceBinding: _0x2a6d92,
  };
}
function findStoryAssetCanvasRecord(_0x5954ba = [], _0x1bcf9d = {}) {
  const _0x3027d3 = normalizeText(
      _0x1bcf9d['storyAssetId'] ||
        _0x1bcf9d['sourceStoryAssetId'] ||
        _0x1bcf9d['assetRef'] ||
        _0x1bcf9d['assetId'],
    ),
    _0x1eb35a = normalizeText(
      _0x1bcf9d['appearanceId'] || _0x1bcf9d['appearanceRef'] || _0x1bcf9d['storyAppearanceId'],
    ),
    _0x28936b = buildStoryClipInputMediaLocation(_0x1bcf9d)['url'],
    _0x44b95f = normalizeList(_0x5954ba)['filter'](
      (_0xb351f9) => !_0x3027d3 || normalizeList(_0xb351f9['assetRefs'])['includes'](_0x3027d3),
    ),
    _0x501f56 = _0x44b95f['find'](
      (_0x2e0f71) => _0x1eb35a && normalizeList(_0x2e0f71['appearanceRefs'])['includes'](_0x1eb35a),
    );
  if (_0x501f56) return _0x501f56;
  if (_0x28936b) {
    const _0x4f4b27 = normalizeList(_0x5954ba)['find']((_0x14dcb2) =>
      normalizeList(_0x14dcb2['imageRefs'])['includes'](_0x28936b),
    );
    if (_0x4f4b27) return _0x4f4b27;
  }
  return _0x3027d3 ? _0x44b95f[0x0] || null : null;
}
function buildStoryClipCanvasInputPlan({
  project: project = {},
  episode: episode = {},
  clip: clip = {},
  assets: assets = [],
  assetRecords: assetRecords = [],
  clipKey: clipKey = '',
} = {}) {
  const _0x5532ae = new Map(),
    _0x2c7d78 = (_0x565a2b, _0x3faeb5 = '') => {
      const _0x42d930 = normalizeText(_0x565a2b);
      if (!_0x42d930) return;
      const _0x306ff5 = normalizeText(_0x3faeb5),
        _0x2470c3 = _0x5532ae['get'](_0x42d930);
      (!_0x2470c3 || (!_0x2470c3['preferredRefSlot'] && _0x306ff5)) &&
        _0x5532ae['set'](_0x42d930, { key: _0x42d930, preferredRefSlot: _0x306ff5 });
    },
    _0x4465a5 = (_0x3ba568, _0x446927 = '') => {
      const _0x595383 = findStoryAssetCanvasRecord(assetRecords, _0x3ba568);
      if (_0x595383?.['key']) _0x2c7d78(_0x595383['key'], _0x446927);
      return _0x595383;
    };
  ([
    ...normalizeList(clip['assetUsages']),
    ...normalizeList(clip['shots'])['flatMap']((_0x5e7ac0) => normalizeList(_0x5e7ac0?.['assetUsages'])),
  ]['forEach']((_0x148785) => _0x4465a5(_0x148785)),
    normalizeList(clip['assetIds'])['forEach']((_0x5d17cb) => {
      _0x4465a5({ assetId: _0x5d17cb });
    }),
    resolveStoryClipPromptAssetRefs(clip['prompt'], { assets: assets, episode: episode })['forEach'](
      (_0x5e3a1a) => _0x4465a5(_0x5e3a1a),
    ));
  const _0x1dd4fc = [],
    _0x3e48e1 = normalizeStoryClipInputs(clip['inputs']);
  return (
    ['image', 'video', 'audio']['forEach']((_0x522075) => {
      normalizeList(_0x3e48e1[_0x522075])['forEach']((_0x25ca5e, _0x5dd1e4) => {
        const _0x1c7833 = normalizeText(_0x25ca5e['slotId']),
          _0x404a3e = _0x4465a5(_0x25ca5e, _0x1c7833);
        if (_0x404a3e) return;
        const _0x58564c = buildStoryClipInputCanvasNodeData({
          project: project,
          episode: episode,
          clip: clip,
          input: _0x25ca5e,
          kind: _0x522075,
          inputIndex: _0x5dd1e4,
        });
        if (!_0x58564c) return;
        const _0x5abc0d = encodeURIComponent(_0x1c7833 || _0x522075 + '-' + (_0x5dd1e4 + 0x1)),
          _0x39e730 = clipKey + ':input:' + _0x522075 + ':' + _0x5abc0d;
        (_0x1dd4fc['push']({
          key: _0x39e730,
          data: _0x58564c,
          width: STORY_PROJECT_CANVAS_NODE_SIZES[_0x58564c['type']]['width'],
          height: STORY_PROJECT_CANVAS_NODE_SIZES[_0x58564c['type']]['height'],
        }),
          _0x2c7d78(_0x39e730, _0x1c7833));
      });
    }),
    { inputEntries: _0x1dd4fc, inputConnections: [..._0x5532ae['values']()] }
  );
}
function getPlanBounds(_0x136ba0 = []) {
  const _0x88a1bb = normalizeList(_0x136ba0);
  if (!_0x88a1bb['length']) return { left: 0x0, top: 0x0, right: 0x0, bottom: 0x0, width: 0x0, height: 0x0 };
  const _0x4bdf09 = Math['min'](..._0x88a1bb['map']((_0x30486c) => _0x30486c['position']['x'])),
    _0x3725ba = Math['min'](..._0x88a1bb['map']((_0x5740de) => _0x5740de['position']['y'])),
    _0x5df669 = Math['max'](
      ..._0x88a1bb['map']((_0x5545e4) => _0x5545e4['position']['x'] + _0x5545e4['width']),
    ),
    _0x5b7e07 = Math['max'](
      ..._0x88a1bb['map']((_0x16a1b5) => _0x16a1b5['position']['y'] + _0x16a1b5['height']),
    );
  return {
    left: _0x4bdf09,
    top: _0x3725ba,
    right: _0x5df669,
    bottom: _0x5b7e07,
    width: _0x5df669 - _0x4bdf09,
    height: _0x5b7e07 - _0x3725ba,
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
  const _0x1892ff = normalizeList(entries)['filter']((_0x2f33ce) => _0x2f33ce['type'] !== 'group');
  if (!_0x1892ff['length']) return [];
  const _0x2224f2 = calculateGroupNodeBounds(
      _0x1892ff['map']((_0x5008bb) => ({
        x: _0x5008bb['position']['x'],
        y: _0x5008bb['position']['y'],
        width: _0x5008bb['width'],
        height: _0x5008bb['height'],
      })),
    ),
    _0xf20a40 = normalizeText(key),
    _0x3410fa = createPlanEntry(
      _0xf20a40,
      {
        type: 'group',
        name: normalizeText(name),
        color: color,
        width: _0x2224f2['width'],
        height: _0x2224f2['height'],
        storyWorkspaceBinding: {
          projectId: normalizeText(project['id']),
          episodeId: normalizeText(episode?.['id']),
          kind: 'stage-group',
          stage: normalizeText(stage),
          canvasScope: 'project',
        },
      },
      { x: _0x2224f2['x'], y: _0x2224f2['y'] },
      { width: _0x2224f2['width'], height: _0x2224f2['height'] },
    );
  return [_0x3410fa, ..._0x1892ff['map']((_0x104ada) => ({ ..._0x104ada, parentKey: _0xf20a40 }))];
}
function appendHorizontalStoryStage(_0x2c30e8, _0x3bb224, _0x2643b0) {
  const _0x16cc36 = getPlanBounds(_0x3bb224),
    _0x581486 = _0x2643b0 - _0x16cc36['left'],
    _0x2f7291 = -_0x16cc36['top'];
  return (
    _0x2c30e8['push'](
      ..._0x3bb224['map']((_0x23452b) => ({
        ..._0x23452b,
        position: { x: _0x23452b['position']['x'] + _0x581486, y: _0x23452b['position']['y'] + _0x2f7291 },
      })),
    ),
    _0x2643b0 + _0x16cc36['width'] + STAGE_GAP
  );
}
function appendVerticalStoryStage(_0xe4af09, _0x3a2c28, _0x35f73b, _0x3a9832) {
  const _0x40498b = getPlanBounds(_0x3a2c28),
    _0x4207ca = _0x35f73b - _0x40498b['left'],
    _0x50a8d9 = _0x3a9832 - _0x40498b['top'];
  return (
    _0xe4af09['push'](
      ..._0x3a2c28['map']((_0x8ad39d) => ({
        ..._0x8ad39d,
        position: { x: _0x8ad39d['position']['x'] + _0x4207ca, y: _0x8ad39d['position']['y'] + _0x50a8d9 },
      })),
    ),
    _0x3a9832 + _0x40498b['height'] + STAGE_GAP
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
  const _0x474377 = [],
    _0x3b9c64 = STORY_PROJECT_CANVAS_NODE_SIZES['comment-note'],
    _0x208a04 = STORY_PROJECT_CANVAS_NODE_SIZES['source-text'],
    _0x1fd7c4 = STORY_PROJECT_CANVAS_NODE_SIZES['ai-video'];
  let _0x4f13b4 = 0x0;
  const _0x24e71f = [],
    _0x30e276 = _0x3b9c64['height'] + NODE_GAP;
  (_0x24e71f['push'](
    createPlanEntry(
      'stage:project:annotation',
      buildStoryStageAnnotationNodeData({
        project: project,
        stage: 'project',
        title: '阶段 1 · 项目设定',
        content: '项目摘要、世界设定与完整文案。',
      }),
      { x: 0x0, y: 0x0 },
    ),
  ),
    _0x24e71f['push'](
      createPlanEntry('project:overview', buildStoryProjectOverviewNodeData({ project: project }), {
        x: 0x0,
        y: _0x30e276,
      }),
    ));
  const _0x1463e6 = buildStoryProjectCopyNodeData({ project: project });
  normalizeText(_0x1463e6['content']) &&
    _0x24e71f['push'](
      createPlanEntry('project:copy', _0x1463e6, { x: _0x208a04['width'] + NODE_GAP, y: _0x30e276 }),
    );
  _0x4f13b4 = appendHorizontalStoryStage(
    _0x474377,
    wrapStoryStageEntriesInGroup({
      entries: _0x24e71f,
      project: project,
      key: 'stage:project:group',
      stage: 'project',
      name: '阶段\x201\x20·\x20项目设定',
      color: STAGE_GROUP_COLORS['project'],
    }),
    _0x4f13b4,
  );
  const _0x5f60bb = [],
    _0x1de10a = [];
  normalizeList(assets)['forEach']((_0x4d668e, _0x5256bf) => {
    const _0x1f27d9 = normalizeList(_0x4d668e['appearances']),
      _0x201428 =
        _0x1f27d9['length'] > 0x0
          ? _0x1f27d9
          : [
              {
                id:
                  getStableKeyPart(
                    _0x4d668e['id'] || _0x4d668e['planningRef'],
                    'asset-' + (_0x5256bf + 0x1),
                  ) + '-base',
                name: '基础形象',
                prompt: _0x4d668e['prompt'],
                imageUrl: _0x4d668e['imageUrl'],
                generatedImage: _0x4d668e['generatedImage'],
              },
            ];
    _0x201428['forEach']((_0x132e07, _0x1f9fd9) => {
      const _0x6d0736 = getStableKeyPart(
          _0x4d668e['id'] || _0x4d668e['planningRef'],
          'asset-' + (_0x5256bf + 0x1),
        ),
        _0x4fcf24 = getStableKeyPart(
          _0x132e07['id'] || _0x132e07['planningRef'],
          'appearance-' + (_0x1f9fd9 + 0x1),
        ),
        _0x182762 = buildStoryAssetCanvasNodeData({
          project: project,
          asset: _0x4d668e,
          appearance: _0x132e07,
          modelId: imageModelId,
          provider: imageProvider,
          generationParams: imageGenerationParams,
        }),
        _0x3fa174 = Math['max'](
          0x1,
          Number(_0x182762['width']) || STORY_PROJECT_CANVAS_NODE_SIZES['ai-image']['width'],
        ),
        _0xad902e = Math['max'](
          0x1,
          Number(_0x182762['height']) || STORY_PROJECT_CANVAS_NODE_SIZES['ai-image']['height'],
        );
      _0x1de10a['push']({
        key: 'asset:' + _0x6d0736 + ':' + _0x4fcf24,
        data: _0x182762,
        width: _0x3fa174,
        height: _0xad902e,
        kind: normalizeStoryAssetKind(_0x4d668e['kind']),
        assetRefs: [_0x4d668e['id'], _0x4d668e['planningRef']]['map'](normalizeText)['filter'](Boolean),
        appearanceRefs: [_0x132e07['id'], _0x132e07['planningRef']]['map'](normalizeText)['filter'](Boolean),
        imageRefs: [
          _0x132e07['imageUrl'],
          _0x132e07['localPath'],
          _0x182762['imageUrl'],
          _0x182762['localPath'],
          _0x182762['sourceUrl'],
          _0x182762['images']?.[0x0]?.['imageUrl'],
          _0x182762['images']?.[0x0]?.['localPath'],
        ]
          ['map']((_0x481a02) => buildStoryClipInputMediaLocation({ url: _0x481a02 })['url'])
          ['filter'](Boolean),
      });
    });
  });
  const _0x21a46e = [
      { kind: 'character', title: '角色素材', content: '人物角色及其形象。' },
      { kind: 'scene', title: '场景素材', content: '场景环境及其视觉参考。' },
      { kind: 'prop', title: '道具素材', content: '道具及其视觉参考。' },
    ],
    _0x4005f6 = _0x3b9c64['height'] + NODE_GAP;
  let _0x29bbf0 = _0x4005f6,
    _0x1e0145 = _0x3b9c64['width'];
  (_0x21a46e['forEach']((_0x3da376) => {
    const _0x3885ce = _0x1de10a['filter']((_0x1cc153) => _0x1cc153['kind'] === _0x3da376['kind']),
      _0x1b64de = [];
    for (let _0x30baa2 = 0x0; _0x30baa2 < _0x3885ce['length']; _0x30baa2 += ASSET_COLUMNS) {
      const _0x1930e8 = _0x3885ce['slice'](_0x30baa2, _0x30baa2 + ASSET_COLUMNS);
      _0x1b64de['push']({
        items: _0x1930e8,
        width: _0x1930e8['reduce'](
          (_0x35424d, _0x547896, _0x425443) =>
            _0x35424d + _0x547896['width'] + (_0x425443 > 0x0 ? NODE_GAP : 0x0),
          0x0,
        ),
        height: Math['max'](..._0x1930e8['map']((_0x18c64f) => _0x18c64f['height'])),
      });
    }
    const _0x212438 = Math['max'](
      ASSET_CATEGORY_MIN_WIDTH,
      ..._0x1b64de['map']((_0x5ec749) => _0x5ec749['width']),
    );
    ((_0x1e0145 = Math['max'](_0x1e0145, _0x212438)),
      _0x5f60bb['push'](
        createPlanEntry(
          'stage:assets:' + _0x3da376['kind'] + ':annotation',
          buildStoryStageAnnotationNodeData({
            project: project,
            stage: 'assets-' + _0x3da376['kind'],
            title: _0x3da376['title'],
            content: _0x3da376['content'],
          }),
          { x: 0x0, y: _0x29bbf0 },
          { width: _0x212438, height: ASSET_CATEGORY_NOTE_HEIGHT },
        ),
      ));
    let _0x5bf3e1 = _0x29bbf0 + ASSET_CATEGORY_NOTE_HEIGHT + NODE_GAP;
    _0x1b64de['forEach']((_0x3c627b) => {
      let _0x388c07 = 0x0;
      (_0x3c627b['items']['forEach']((_0x389281) => {
        (_0x5f60bb['push'](
          createPlanEntry(
            _0x389281['key'],
            _0x389281['data'],
            { x: _0x388c07, y: _0x5bf3e1 },
            { width: _0x389281['width'], height: _0x389281['height'] },
          ),
        ),
          (_0x388c07 += _0x389281['width'] + NODE_GAP));
      }),
        (_0x5bf3e1 += _0x3c627b['height'] + NODE_GAP));
    });
    const _0x1eeea6 = _0x1b64de['length'] ? _0x5bf3e1 - NODE_GAP : _0x29bbf0 + ASSET_CATEGORY_NOTE_HEIGHT;
    _0x29bbf0 = _0x1eeea6 + ASSET_CATEGORY_GAP;
  }),
    _0x5f60bb['unshift'](
      createPlanEntry(
        'stage:assets:annotation',
        buildStoryStageAnnotationNodeData({
          project: project,
          stage: 'assets',
          title: '阶段 2 · 素材设定',
          content: '角色、场景和道具素材。',
        }),
        { x: 0x0, y: 0x0 },
        { width: _0x1e0145, height: _0x3b9c64['height'] },
      ),
    ),
    (_0x4f13b4 = appendHorizontalStoryStage(
      _0x474377,
      wrapStoryStageEntriesInGroup({
        entries: _0x5f60bb,
        project: project,
        key: 'stage:assets:group',
        stage: 'assets',
        name: '阶段 2 · 素材设定',
        color: STAGE_GROUP_COLORS['assets'],
      }),
      _0x4f13b4,
    )));
  const _0x3360d6 = _0x4f13b4;
  let _0x2561f1 = 0x0;
  return (
    normalizeList(episodes)
      ['slice'](0x0, 0x1)
      ['forEach']((_0x20b811, _0x27a631) => {
        const _0x7c5172 = [],
          _0x4fadac = getStableKeyPart(
            _0x20b811['id'] || _0x20b811['planningRef'],
            'episode-' + (_0x27a631 + 0x1),
          ),
          _0x513306 = [
            createPlanEntry(
              'episode:' + _0x4fadac + ':copy',
              buildStoryEpisodeCopyNodeData({ project: project, episode: _0x20b811 }),
              { x: 0x0, y: 0x0 },
            ),
          ],
          _0x37bd21 = normalizeList(_0x20b811['clips'])['map']((_0x4f7372, _0x2dfb36) => {
            const _0x85d464 = buildStoryClipCanvasBindingKey({
                episode: _0x20b811,
                clip: _0x4f7372,
                episodeIndex: _0x27a631,
                clipIndex: _0x2dfb36,
              }),
              _0x1348f1 = buildStoryClipCanvasInputPlan({
                project: project,
                episode: _0x20b811,
                clip: _0x4f7372,
                assets: assets,
                assetRecords: _0x1de10a,
                clipKey: _0x85d464,
              }),
              _0x39b5fb = _0x1348f1['inputEntries']['reduce'](
                (_0x4a2a90, _0x1ae80e, _0x8ce7e7) =>
                  _0x4a2a90 + _0x1ae80e['width'] + (_0x8ce7e7 > 0x0 ? NODE_GAP : 0x0),
                0x0,
              ),
              _0x49ae4a = buildStoryClipCanvasNodeData({
                project: project,
                episode: _0x20b811,
                clip: _0x4f7372,
                modelId: videoModelId,
                provider: videoProvider,
                generationParams: videoGenerationParams,
              });
            return (
              (_0x49ae4a['storyWorkspaceBinding'] = {
                ...asObject(_0x49ae4a['storyWorkspaceBinding']),
                kind: 'clip-video',
                canvasScope: 'project',
              }),
              { clipKey: _0x85d464, clipData: _0x49ae4a, inputPlan: _0x1348f1, inputLaneWidth: _0x39b5fb }
            );
          }),
          _0x224869 = Math['max'](0x0, ..._0x37bd21['map']((_0x34c4ac) => _0x34c4ac['inputLaneWidth'])),
          _0x3314a3 = _0x224869 > 0x0 ? _0x224869 + NODE_GAP : 0x0;
        let _0x3c6a05 = _0x208a04['height'] + NODE_GAP;
        _0x37bd21['forEach'](({ clipKey: _0x28b6ee, clipData: _0x2a281c, inputPlan: _0x305ea6 }) => {
          let _0x28e994 = 0x0;
          (_0x305ea6['inputEntries']['forEach']((_0x4a98f5) => {
            (_0x513306['push'](
              createPlanEntry(
                _0x4a98f5['key'],
                _0x4a98f5['data'],
                { x: _0x28e994, y: _0x3c6a05 },
                { width: _0x4a98f5['width'], height: _0x4a98f5['height'] },
              ),
            ),
              (_0x28e994 += _0x4a98f5['width'] + NODE_GAP));
          }),
            _0x513306['push'](
              createPlanEntry(
                _0x28b6ee,
                _0x2a281c,
                { x: _0x3314a3, y: _0x3c6a05 },
                { inputConnections: _0x305ea6['inputConnections'] },
              ),
            ));
          const _0x304a29 = Math['max'](
            _0x1fd7c4['height'],
            ..._0x305ea6['inputEntries']['map']((_0x2cc62b) => _0x2cc62b['height']),
          );
          _0x3c6a05 += _0x304a29 + NODE_GAP;
        });
        const _0x272cee = Math['max'](_0x208a04['width'], _0x224869, _0x3314a3 + _0x1fd7c4['width']);
        _0x7c5172['push'](
          createPlanEntry(
            'episode:' + _0x4fadac + ':annotation',
            buildStoryStageAnnotationNodeData({
              project: project,
              episode: _0x20b811,
              stage: 'episode-' + (_0x27a631 + 0x1),
              title: getEpisodeLabel(_0x20b811) + '\x20·\x20分集制作',
              content: '本集文案和视频片段。',
            }),
            { x: 0x0, y: 0x0 },
            { width: Math['max'](_0x3b9c64['width'], _0x272cee), height: _0x3b9c64['height'] },
          ),
        );
        const _0x21bd88 = _0x3b9c64['height'] + NODE_GAP;
        (_0x7c5172['push'](
          ..._0x513306['map']((_0x241cd0) => ({
            ..._0x241cd0,
            position: { x: _0x241cd0['position']['x'], y: _0x241cd0['position']['y'] + _0x21bd88 },
          })),
        ),
          (_0x2561f1 = appendVerticalStoryStage(
            _0x474377,
            wrapStoryStageEntriesInGroup({
              entries: _0x7c5172,
              project: project,
              episode: _0x20b811,
              key: 'episode:' + _0x4fadac + ':group',
              stage: 'episode-' + (_0x27a631 + 0x1),
              name: getEpisodeLabel(_0x20b811),
              color: STAGE_GROUP_COLORS['episode'][_0x27a631 % STAGE_GROUP_COLORS['episode']['length']],
            }),
            _0x3360d6,
            _0x2561f1,
          )));
      }),
    _0x474377
  );
}
function buildStoryProjectPlanLayout(_0x180a23 = []) {
  return Object['fromEntries'](
    normalizeList(_0x180a23)['map']((_0x1e71d9) => [
      _0x1e71d9['key'],
      {
        x: Number(_0x1e71d9['position']?.['x']) || 0x0,
        y: Number(_0x1e71d9['position']?.['y']) || 0x0,
        width: Number(_0x1e71d9['width']) || 0x0,
        height: Number(_0x1e71d9['height']) || 0x0,
        parentKey: normalizeText(_0x1e71d9['parentKey']),
      },
    ]),
  );
}
function storyProjectLayoutsMatch(_0x2ad319 = {}, _0x91dcff = {}) {
  const _0x36b387 = asObject(_0x2ad319),
    _0x21ada8 = asObject(_0x91dcff),
    _0x3c7628 = Object['keys'](_0x36b387)['sort'](),
    _0x4d8b7b = Object['keys'](_0x21ada8)['sort']();
  if (
    _0x3c7628['length'] !== _0x4d8b7b['length'] ||
    _0x3c7628['some']((_0x58e5e8, _0x7e181d) => _0x58e5e8 !== _0x4d8b7b[_0x7e181d])
  )
    return ![];
  return _0x4d8b7b['every']((_0x3d7dba) => {
    const _0x49d487 = asObject(_0x36b387[_0x3d7dba]),
      _0x31203f = asObject(_0x21ada8[_0x3d7dba]);
    return (
      Number(_0x49d487['x']) === Number(_0x31203f['x']) &&
      Number(_0x49d487['y']) === Number(_0x31203f['y']) &&
      Number(_0x49d487['width']) === Number(_0x31203f['width']) &&
      Number(_0x49d487['height']) === Number(_0x31203f['height']) &&
      normalizeText(_0x49d487['parentKey']) === normalizeText(_0x31203f['parentKey'])
    );
  });
}
function shouldReflowStoryProjectCanvas(_0x4ef5f4, _0x41ae20) {
  return (
    Math['trunc'](Number(_0x4ef5f4?.['layoutVersion']) || 0x0) !== STORY_PROJECT_CANVAS_LAYOUT_VERSION ||
    !storyProjectLayoutsMatch(_0x4ef5f4?.['layout'], _0x41ae20)
  );
}
async function rollbackStoryProjectCanvasMutation({
  adapter: _0xc05c8f,
  canvasId: canvasId = '',
  reused: reused = ![],
  mutationSnapshot: _0x536e83,
} = {}) {
  if (!reused && typeof _0xc05c8f?.['deleteCanvas'] === 'function')
    try {
      if ((await _0xc05c8f['deleteCanvas'](canvasId, { skipDirtyConfirm: !![] })) !== ![]) return !![];
    } catch {}
  if (_0x536e83 && typeof _0xc05c8f?.['restoreMutationSnapshot'] === 'function')
    try {
      return (await _0xc05c8f['restoreMutationSnapshot'](_0x536e83, { canvasId: canvasId })) !== ![];
    } catch {}
  return ![];
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
  adapter: _0x3e2a38,
} = {}) {
  const _0x6f903c = [
    'canvasExists',
    'switchCanvas',
    'createCanvas',
    'renameCanvas',
    'nodeExists',
    'createNode',
    'updateNode',
  ];
  if (_0x6f903c['some']((_0x447bfe) => typeof _0x3e2a38?.[_0x447bfe] !== 'function'))
    throw new Error('syncStoryProjectCanvas requires a complete canvas adapter');
  const _0x30cf95 = buildStoryProjectCanvasName(project, normalizeList(episodes)[0x0]),
    _0x1a76a0 = await resolveStoryProjectAssetImageSizes(assets),
    _0x2a555a = buildStoryProjectCanvasPlan({
      project: project,
      assets: _0x1a76a0,
      episodes: episodes,
      imageModelId: imageModelId,
      imageProvider: imageProvider,
      imageGenerationParams: imageGenerationParams,
      videoModelId: videoModelId,
      videoProvider: videoProvider,
      videoGenerationParams: videoGenerationParams,
    });
  if (
    _0x2a555a['some']((_0xfc6047) => _0xfc6047['parentKey']) &&
    typeof _0x3e2a38['setNodeParent'] !== 'function'
  )
    throw new Error('剧本项目画布适配器缺少节点分组能力');
  if (
    _0x2a555a['some']((_0x30ab6c) => normalizeList(_0x30ab6c['inputConnections'])['length']) &&
    typeof _0x3e2a38['connectNodes'] !== 'function'
  )
    throw new Error('剧本项目画布适配器缺少节点连线能力');
  const _0x383fd4 = asObject(project['canvasBinding']),
    _0x5bf457 = normalizeText(_0x383fd4['canvasId']),
    _0x4dc9c3 = Boolean(_0x5bf457 && (await _0x3e2a38['canvasExists'](_0x5bf457)));
  let _0x4a9685 = '';
  if (_0x4dc9c3) {
    const _0x2f7c97 = await _0x3e2a38['switchCanvas'](_0x5bf457);
    if (_0x2f7c97 === ![]) throw new Error('无法切换到已绑定的项目画布：' + _0x5bf457);
    _0x4a9685 = _0x5bf457;
  } else {
    _0x4a9685 = normalizeText(await _0x3e2a38['createCanvas'](_0x30cf95));
    if (!_0x4a9685) throw new Error('新建项目画布后未获得活动画布 ID');
  }
  const _0x52404e = asObject(_0x383fd4['nodes']),
    _0x4c99ab = buildStoryProjectPlanLayout(_0x2a555a),
    _0x58fdad = _0x4dc9c3 ? shouldReflowStoryProjectCanvas(_0x383fd4, _0x4c99ab) : ![],
    _0x47b032 = {},
    _0xf896d2 = [];
  let _0x466eb5 = 0x0,
    _0x107b03 = 0x0,
    _0x17180c = 0x0;
  const _0x2770c3 = 'story-project:' + (normalizeText(project['id']) || _0x4a9685),
    _0x1f0ffa = await _0x3e2a38['createMutationSnapshot']?.({ canvasId: _0x4a9685 });
  try {
    if (_0x4dc9c3) {
      const _0x5aa8a5 = [];
      for (const [_0xb7fc24, _0x3d1c06] of Object['entries'](_0x52404e)) {
        if (_0xb7fc24 in _0x4c99ab) continue;
        const _0x330e23 = normalizeText(_0x3d1c06);
        _0x330e23 && (await _0x3e2a38['nodeExists'](_0x330e23, _0x4a9685)) && _0x5aa8a5['push'](_0x330e23);
      }
      if (_0x5aa8a5['length']) {
        if (typeof _0x3e2a38['deleteNodes'] !== 'function')
          throw new Error('剧本项目画布适配器缺少旧节点清理能力');
        const _0x316586 = [...new Set(_0x5aa8a5)];
        if ((await _0x3e2a38['deleteNodes'](_0x316586, { canvasId: _0x4a9685 })) === ![])
          throw new Error('清理已失效的剧本项目画布节点失败');
        _0x17180c = _0x316586['length'];
      }
    }
    for (const _0x4695a4 of _0x2a555a) {
      const _0x2cbf62 = normalizeText(_0x52404e[_0x4695a4['key']]),
        _0x5f3a64 = Boolean(_0x4dc9c3 && _0x2cbf62 && (await _0x3e2a38['nodeExists'](_0x2cbf62, _0x4a9685))),
        _0x21fa74 = _0x5f3a64
          ? await _0x3e2a38['updateNode'](_0x2cbf62, _0x4695a4['data'], {
              canvasId: _0x4a9685,
              key: _0x4695a4['key'],
              type: _0x4695a4['type'],
              width: _0x4695a4['width'],
              height: _0x4695a4['height'],
              ...(_0x58fdad ? { position: _0x4695a4['position'] } : {}),
            })
          : await _0x3e2a38['createNode'](_0x4695a4['data'], {
              canvasId: _0x4a9685,
              key: _0x4695a4['key'],
              type: _0x4695a4['type'],
              width: _0x4695a4['width'],
              height: _0x4695a4['height'],
              position: _0x4695a4['position'],
              sequenceKey: _0x2770c3,
              parentNodeId: normalizeText(_0x47b032[_0x4695a4['parentKey']]),
            });
      if (_0x5f3a64) _0x107b03 += 0x1;
      else _0x466eb5 += 0x1;
      const _0x4fc2a9 = normalizeText(_0x21fa74?.['id'] || (_0x5f3a64 ? _0x2cbf62 : ''));
      if (!_0x4fc2a9)
        throw new Error('同步项目画布节点失败：' + (_0x4695a4['data']['name'] || _0x4695a4['key']));
      ((_0x47b032[_0x4695a4['key']] = _0x4fc2a9),
        _0xf896d2['push']({ ..._0x4695a4, nodeId: _0x4fc2a9, node: _0x21fa74 }));
    }
    for (const _0xe6e3e5 of _0x2a555a) {
      if (!_0xe6e3e5['parentKey']) continue;
      const _0x71d13b = normalizeText(_0x47b032[_0xe6e3e5['key']]),
        _0x140b9e = normalizeText(_0x47b032[_0xe6e3e5['parentKey']]);
      if (!_0x71d13b || !_0x140b9e) throw new Error('剧本项目画布分组缺少节点：' + _0xe6e3e5['key']);
      if ((await _0x3e2a38['setNodeParent'](_0x71d13b, _0x140b9e, { canvasId: _0x4a9685 })) === ![])
        throw new Error('剧本项目画布节点分组失败：' + _0xe6e3e5['key']);
    }
    for (const _0x295953 of _0x2a555a) {
      const _0x582eec = normalizeText(_0x47b032[_0x295953['key']]);
      for (const _0x51fdc7 of normalizeList(_0x295953['inputConnections'])) {
        const _0x50f3e7 = normalizeText(_0x47b032[_0x51fdc7?.['key']]);
        if (!_0x50f3e7 || !_0x582eec)
          throw new Error('剧本项目画布连线缺少节点：' + _0x51fdc7?.['key'] + '\x20→\x20' + _0x295953['key']);
        if (
          (await _0x3e2a38['connectNodes'](_0x50f3e7, _0x582eec, {
            canvasId: _0x4a9685,
            preferredRefSlot: normalizeText(_0x51fdc7?.['preferredRefSlot']),
          })) === ![]
        )
          throw new Error('剧本项目画布节点连线失败：' + _0x51fdc7?.['key'] + ' → ' + _0x295953['key']);
      }
    }
    (await _0x3e2a38['renameCanvas']?.(_0x4a9685, _0x30cf95),
      _0x3e2a38['commit']?.(),
      typeof _0x3e2a38['focusNodes'] === 'function' &&
        (await _0x3e2a38['focusNodes'](
          _0xf896d2['map']((_0x2302aa) => _0x2302aa['nodeId']),
          { padding: 0x50, durationMs: 0x0, maxZoom: 0.2 },
        )));
  } catch (_0x3561dc) {
    await rollbackStoryProjectCanvasMutation({
      adapter: _0x3e2a38,
      canvasId: _0x4a9685,
      reused: _0x4dc9c3,
      mutationSnapshot: _0x1f0ffa,
    });
    throw _0x3561dc;
  }
  const _0xd2428d = {
    canvasId: _0x4a9685,
    layoutVersion: STORY_PROJECT_CANVAS_LAYOUT_VERSION,
    nodes: _0x47b032,
    layout: _0x4c99ab,
  };
  return {
    canvasId: _0x4a9685,
    canvasName: _0x30cf95,
    reused: _0x4dc9c3,
    createdCount: _0x466eb5,
    updatedCount: _0x107b03,
    deletedCount: _0x17180c,
    reflowed: _0x58fdad,
    nodes: _0xf896d2,
    binding: _0xd2428d,
    canvasBinding: _0xd2428d,
  };
}

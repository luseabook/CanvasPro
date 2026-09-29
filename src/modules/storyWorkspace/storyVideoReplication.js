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
export const STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_SOURCE_CHARACTERS = 0x7d00;
export const STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_OUTPUT_TOKENS = 0x4000;
export const STORY_REPLICATION_VIDEO_ACCEPT =
  '.mp4,.mov,.avi,video/mp4,video/quicktime,video/x-msvideo,video/avi,video/msvideo,video/vnd.avi';
export function isStoryVideoReplicationHomeAvailable({ workspaceSurface: workspaceSurface = 'story' } = {}) {
  return workspaceSurface === 'replication';
}
export function resolveStoryVideoReplicationHomeTab(_0x243f9c = {}, _0x26ac33 = 'upload') {
  if (_0x243f9c['workspaceSurface'] === 'replication') return 'replication';
  if (_0x26ac33 === 'collaborate' && _0x243f9c['developerModeAvailable'] !== !![]) return 'generate';
  const _0x3ede37 = ['upload', 'generate', 'collaborate', 'replication']['includes'](_0x26ac33)
    ? _0x26ac33
    : 'upload';
  return _0x3ede37 === 'replication' && !isStoryVideoReplicationHomeAvailable(_0x243f9c)
    ? 'upload'
    : _0x3ede37;
}
export const STORY_REPLICATION_LOCALES = Object['freeze']([
  Object['freeze']({ value: 'source', label: '保留原语言', shortLabel: '原语言' }),
  Object['freeze']({ value: 'zh-CN', label: '中国 · 中文', shortLabel: '中文' }),
  Object['freeze']({ value: 'ja-JP', label: '日本 · 日语', shortLabel: '日语' }),
  Object['freeze']({ value: 'ko-KR', label: '韩国\x20·\x20韩语', shortLabel: '韩语' }),
  Object['freeze']({ value: 'en-US', label: '美国 · 英语', shortLabel: '英语' }),
]);
const SUPPORTED_VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'avi']);
function normalizeText(_0xf952d4) {
  return String(_0xf952d4 ?? '')['trim']();
}
export function resolveStoryVideoReplicationClipVoiceAssetIds(_0xd181e9 = {}, _0x5760dd = {}) {
  if (_0xd181e9?.['project']?.['sourceMode'] !== 'video-replication') return null;
  return getStoryClipDialogueSpeakerAssetIds(_0x5760dd, _0xd181e9['assets']);
}
function normalizePositiveNumber(_0x450074) {
  const _0x5581d8 = Number(_0x450074);
  return Number['isFinite'](_0x5581d8) && _0x5581d8 > 0x0 ? _0x5581d8 : 0x0;
}
function stripVideoExtension(_0x316883) {
  return normalizeText(_0x316883)
    ['replace'](/^.*[\\/]/u, '')
    ['replace'](/\.(?:mp4|mov|avi)$/iu, '')
    ['trim']();
}
function getVideoExtension(_0xf50fe6 = {}) {
  return normalizeText(_0xf50fe6['name'])['split']('.')['pop']()?.['toLowerCase']() || '';
}
function normalizeLocale(_0x2a8ad9) {
  const _0x4d4a71 = normalizeText(_0x2a8ad9);
  return STORY_REPLICATION_LOCALES['some']((_0x41b688) => _0x41b688['value'] === _0x4d4a71)
    ? _0x4d4a71
    : STORY_REPLICATION_LOCALES[0x0]['value'];
}
function createStableEpisodeId(_0x27eb72 = {}, _0x5049f2 = 0x0, _0x25a21e = 'story') {
  const _0x492aff = [
    _0x25a21e,
    normalizeText(_0x27eb72['name']),
    Number(_0x27eb72['size']) || 0x0,
    Number(_0x27eb72['lastModified']) || 0x0,
    _0x5049f2,
  ]['join']('|');
  let _0x20379b = 0x811c9dc5;
  for (let _0x27246f = 0x0; _0x27246f < _0x492aff['length']; _0x27246f += 0x1) {
    ((_0x20379b ^= _0x492aff['charCodeAt'](_0x27246f)), (_0x20379b = Math['imul'](_0x20379b, 0x1000193)));
  }
  return 'replication-episode-' + (_0x20379b >>> 0x0)['toString'](0x24);
}
function normalizeAnalysisSegment(_0x97694c = {}, _0x16992d = 0x0, _0x5909c9 = 0x0) {
  const _0x3f86c3 = Math['max'](0x0, Number(_0x97694c['startSec']) || 0x0),
    _0x40c0e3 = Number(_0x97694c['endSec']),
    _0x1ff892 = Math['max'](0x1, Number(_0x97694c['durationSec']) || 0x0),
    _0x160e55 = Number['isFinite'](_0x40c0e3) && _0x40c0e3 > _0x3f86c3 ? _0x40c0e3 : _0x3f86c3 + _0x1ff892,
    _0x519da8 = _0x5909c9 > 0x0 ? Math['min'](Math['max'](_0x3f86c3 + 0.1, _0x160e55), _0x5909c9) : _0x160e55;
  return {
    title: normalizeText(_0x97694c['title']) || '片段 ' + String(_0x16992d + 0x1)['padStart'](0x2, '0'),
    startSec: _0x3f86c3,
    endSec: _0x519da8,
    durationSec: Math['max'](0.1, _0x519da8 - _0x3f86c3),
    script: normalizeText(_0x97694c['script'] || _0x97694c['dialogue'] || _0x97694c['visual']),
    prompt: normalizeText(_0x97694c['prompt'] || _0x97694c['seedancePrompt']),
    visual: normalizeText(_0x97694c['visual'] || _0x97694c['script']),
    camera: normalizeText(_0x97694c['camera']),
    dialogue: normalizeText(_0x97694c['dialogue']),
    sound: normalizeText(_0x97694c['sound'] || _0x97694c['audio']),
  };
}
export function getStoryReplicationLocale(_0x54cc38) {
  const _0x1b0043 = normalizeLocale(_0x54cc38);
  return (
    STORY_REPLICATION_LOCALES['find']((_0x434dd5) => _0x434dd5['value'] === _0x1b0043) ||
    STORY_REPLICATION_LOCALES[0x0]
  );
}
export function resolveStoryReplicationUploadedVideo(_0x5c7a80 = {}) {
  const _0x12cef0 = pickResultLocalPath(_0x5c7a80),
    _0x3ccdbf = normalizeText(
      _0x12cef0
        ? localPathToUrl(_0x12cef0)
        : _0x5c7a80?.['displayUrl'] ||
            _0x5c7a80?.['url'] ||
            _0x5c7a80?.['originalUrl'] ||
            _0x5c7a80?.['videoUrl'],
    );
  if (!_0x3ccdbf) throw new Error('视频上传结果缺少可用地址。');
  return { videoRef: _0x3ccdbf, localPath: _0x12cef0 };
}
export function findStoryReplicationEpisode(_0x207918, _0x4a0171) {
  return (
    (Array['isArray'](_0x207918?.['episodes']) ? _0x207918['episodes'] : [])['find'](
      (_0x2a63bb) => normalizeText(_0x2a63bb?.['id']) === normalizeText(_0x4a0171),
    ) || null
  );
}
function buildStoryVideoReplicationEpisodeAssetEvidence(_0xb3f9f0 = {}) {
  const _0x1ecf07 = _0xb3f9f0?.['replication']?.['analysis'] || {},
    _0x468510 = [],
    _0x12879f = buildVideoReplicationSourceEvidence(_0xb3f9f0);
  if (_0x12879f) _0x468510['push']('原片人物与事件证据：' + JSON['stringify'](_0x12879f));
  const _0x348182 = normalizeText(_0x1ecf07['synopsis'] || _0xb3f9f0?.['synopsis']),
    _0x54fe22 = normalizeText(_0x1ecf07['camera']),
    _0xe03a2 = normalizeText(_0x1ecf07['seedancePrompt']);
  if (_0x348182) _0x468510['push']('剧情与空间概述：' + _0x348182);
  if (_0x54fe22) _0x468510['push']('整体运镜：' + _0x54fe22);
  if (_0xe03a2) _0x468510['push']('整体视觉提示：' + _0xe03a2);
  const _0x5000eb = (Array['isArray'](_0x1ecf07['segments']) ? _0x1ecf07['segments'] : [])
    ['map']((_0x22411c, _0x21de1a) => {
      const _0x4dfaa1 = [],
        _0x497ca3 = normalizeText(_0x22411c?.['visual']),
        _0x357040 = normalizeText(_0x22411c?.['prompt']),
        _0x3c3110 = normalizeText(_0x22411c?.['camera']);
      if (_0x497ca3) _0x4dfaa1['push']('画面：' + _0x497ca3);
      if (_0x357040) _0x4dfaa1['push']('视觉提示：' + _0x357040);
      if (_0x3c3110) _0x4dfaa1['push']('运镜：' + _0x3c3110);
      if (!_0x4dfaa1['length']) return '';
      const _0x2a2376 = normalizeText(_0x22411c?.['title']);
      return [
        '片段\x20' + (_0x21de1a + 0x1) + (_0x2a2376 ? '「' + _0x2a2376 + '」' : '') + '：',
        ..._0x4dfaa1['map']((_0xc57ec7) => '-\x20' + _0xc57ec7),
      ]['join']('\x0a');
    })
    ['filter'](Boolean);
  _0x468510['push'](..._0x5000eb);
  if (!_0x468510['length']) return '';
  return ['【视频解析视觉证据（仅用于角色、场景与道具识别，不是新增剧情）】', ..._0x468510]['join']('\x0a');
}
export function buildStoryVideoReplicationAssetExtractionProject(_0x6c7b4a = {}) {
  const _0x3e0e45 = _0x6c7b4a?.['project'] || {};
  if (_0x3e0e45['sourceMode'] !== 'video-replication') return _0x3e0e45;
  const _0x527baa = Array['isArray'](_0x6c7b4a['episodes']) ? _0x6c7b4a['episodes'] : [],
    _0x5d42a5 = Array['isArray'](_0x3e0e45['chapters']) ? _0x3e0e45['chapters'] : [],
    _0x567288 = _0x5d42a5['length']
      ? _0x5d42a5
      : _0x527baa['filter']((_0x11dfc3) => normalizeText(_0x11dfc3?.['script']?.['fullText']))['map'](
          (_0x1c7bd8, _0x2b31b2) => ({
            id: _0x1c7bd8['id'],
            title:
              '第\x20' +
              (_0x1c7bd8['number'] || _0x2b31b2 + 0x1) +
              ' 集：' +
              (_0x1c7bd8['title'] || '未命名分集'),
            content: _0x1c7bd8['script']['fullText'],
          }),
        ),
    _0x1dc7cc = _0x567288['map']((_0x46de4f, _0x4d1bd5) => {
      const _0x3dd800 =
          _0x527baa['find'](
            (_0x529f1e) => normalizeText(_0x529f1e?.['id']) === normalizeText(_0x46de4f?.['id']),
          ) || _0x527baa[_0x4d1bd5],
        _0x5b2c0f = normalizeText(_0x46de4f?.['content'] || _0x3dd800?.['script']?.['fullText']),
        _0x30b219 = buildStoryVideoReplicationEpisodeAssetEvidence(_0x3dd800);
      return { ..._0x46de4f, content: [_0x5b2c0f, _0x30b219]['filter'](Boolean)['join']('\x0a\x0a') };
    });
  return {
    ..._0x3e0e45,
    chapters: _0x1dc7cc,
    replicationFrameSources: _0x527baa['filter']((_0x233b1) => _0x233b1['replication']?.['sourceAnalysis'])[
      'map'
    ]((_0x26babf) => ({
      episodeId: _0x26babf['id'],
      durationSec: Number(_0x26babf['sourceVideo']?.['durationSec']) || 0x0,
      revision: _0x26babf['replication']['sourceAnalysis']['revision'],
      events: _0x26babf['replication']['sourceAnalysis']['events']['map'](
        ({ id: _0xfe0b45, startSec: _0x791b33, endSec: _0x103866, visual: _0x50e065 }) => ({
          id: _0xfe0b45,
          startSec: _0x791b33,
          endSec: _0x103866,
          visual: _0x50e065,
        }),
      ),
    })),
  };
}
export function shouldUseStoryVideoReplicationUnifiedAssetLocalization(
  _0x4dbd38 = {},
  {
    maxSourceCharacters: maxSourceCharacters = STORY_VIDEO_REPLICATION_UNIFIED_ASSET_MAX_SOURCE_CHARACTERS,
  } = {},
) {
  if (_0x4dbd38?.['project']?.['sourceMode'] !== 'video-replication') return ![];
  if (_0x4dbd38['assetExtractionDraft'] && typeof _0x4dbd38['assetExtractionDraft'] === 'object') return ![];
  const _0x360b5b = buildStoryVideoReplicationAssetExtractionProject(_0x4dbd38),
    _0x2da922 = Array['isArray'](_0x360b5b['chapters']) ? _0x360b5b['chapters'] : [],
    _0x41fc67 = _0x2da922['reduce'](
      (_0x392c68, _0x54925f) => _0x392c68 + String(_0x54925f?.['content'] || '')['length'],
      0x0,
    ),
    _0x124c3a =
      _0x41fc67 ||
      (Array['isArray'](_0x4dbd38['episodes']) ? _0x4dbd38['episodes'] : [])['reduce'](
        (_0x22c516, _0x4f9837) => _0x22c516 + String(_0x4f9837?.['script']?.['fullText'] || '')['length'],
        0x0,
      ),
    _0x45704e = Math['max'](0x1, Math['trunc'](Number(maxSourceCharacters) || 0x0));
  return _0x124c3a > 0x0 && _0x124c3a <= _0x45704e;
}
export function validateStoryReplicationVideoFile(_0x1a4174 = {}, _0x4737ef = '') {
  const _0x1d932e = normalizeText(_0x1a4174['name']),
    _0x2637f0 = getVideoExtension(_0x1a4174),
    _0x48e65e = Math['max'](0x0, Number(_0x1a4174['size']) || 0x0);
  if (!_0x1d932e) return { ok: ![], error: '视频文件缺少文件名。' };
  if (!SUPPORTED_VIDEO_EXTENSIONS['has'](_0x2637f0))
    return { ok: ![], error: '“' + _0x1d932e + '”格式不支持，仅支持\x20MP4、MOV、AVI。' };
  const _0x45ffd7 = validateStoryReplicationVideoSize(_0x1a4174, _0x4737ef);
  if (!_0x45ffd7['ok']) return _0x45ffd7;
  if (!_0x48e65e) return { ok: ![], error: '“' + _0x1d932e + '”是空文件。' };
  return { ok: !![], error: '' };
}
export function mergeStoryReplicationSourceFiles(_0x25f982 = [], _0x155707 = [], _0x13ced1 = '') {
  const _0x4cf1ed = [],
    _0xdc0720 = new Set();
  return (
    [...(Array['isArray'](_0x25f982) ? _0x25f982 : []), ...(Array['isArray'](_0x155707) ? _0x155707 : [])][
      'forEach'
    ]((_0x18d6fb) => {
      if (
        !(Array['isArray'](_0x25f982) && _0x25f982['includes'](_0x18d6fb)) &&
        !validateStoryReplicationVideoFile(_0x18d6fb, _0x13ced1)['ok']
      )
        return;
      const _0x4f8e64 = [_0x18d6fb['name'], _0x18d6fb['size'], _0x18d6fb['lastModified']]['join'](':');
      if (_0xdc0720['has'](_0x4f8e64)) return;
      (_0xdc0720['add'](_0x4f8e64), _0x4cf1ed['push'](_0x18d6fb));
    }),
    _0x4cf1ed
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
  const _0x2421a5 = Array['isArray'](files) ? files : [];
  if (!_0x2421a5['length']) throw new Error('请先上传至少一条视频。');
  for (const _0x28a35d of _0x2421a5) {
    const _0x1cd6be = validateStoryReplicationVideoFile(_0x28a35d, modelId);
    if (!_0x1cd6be['ok']) throw new Error(_0x1cd6be['error']);
  }
  const _0x4cc4ef = getStoryReplicationLocale(targetLocale),
    _0x2d593c = stripVideoExtension(_0x2421a5[0x0]?.['name']) || '未命名复刻视频',
    _0x30edd5 = _0x2421a5['length'] > 0x1 ? _0x2d593c + ' 等 ' + _0x2421a5['length'] + ' 条视频' : _0x2d593c,
    _0xcc12e = _0x2421a5['map']((_0x217ec1, _0x5cba0d) => {
      const _0x57cd7c = createStableEpisodeId(_0x217ec1, _0x5cba0d, projectId);
      return {
        id: _0x57cd7c,
        planningRef: _0x57cd7c,
        number: _0x5cba0d + 0x1,
        title: stripVideoExtension(_0x217ec1['name']) || '第\x20' + (_0x5cba0d + 0x1) + '\x20集',
        synopsis: '',
        hook: '',
        sourceChapterIds: [_0x57cd7c],
        assetRefs: [],
        assetIds: [],
        scriptStatus: 'pending',
        script: null,
        clips: [],
        clipCount: 0x0,
        characterCount: 0x0,
        sceneCount: 0x0,
        propCount: 0x0,
        durationSec: 0x0,
        duration: '--:--',
        coverUrl: '',
        status: '解析中',
        sourceVideo: {
          fileName: normalizeText(_0x217ec1['name']),
          size: Math['max'](0x0, Number(_0x217ec1['size']) || 0x0),
          mimeType: normalizeText(_0x217ec1['type']),
          videoRef: '',
          posterUrl: '',
          posterLocalPath: '',
          durationSec: 0x0,
        },
        replication: { status: 'queued', progress: 0x0, error: '', analysis: null },
      };
    });
  return normalizeStoryWorkspaceAssetData({
    project: {
      id: projectId,
      title: _0x30edd5,
      sourceMode: 'video-replication',
      scriptMode: 'plot',
      storyType: '视频复刻',
      targetAudience: _0x4cc4ef['label'],
      videoStyleId: '',
      videoStylePrompt: '',
      customVideoStylePrompt: '',
      videoStyle: '',
      aspectRatio: normalizeText(aspectRatio) || '9:16',
      planning: {
        episodeCount: _0xcc12e['length'],
        sceneMaxSeconds:
          resolveStoryVideoClipDurationConstraints(resolveStoryPromptModeDefaultVideoModelId(promptMode))?.[
            'maxSeconds'
          ] || 0xf,
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
        targetLocale: _0x4cc4ef['value'],
        asrProvider: asrProvider,
        targetLabel: _0x4cc4ef['label'],
        modelId: normalizeText(modelId),
        provider: normalizeText(provider),
        providerProfileId: normalizeText(providerProfileId),
        assetLocalizationCompletedAt: 0x0,
        status: 'analyzing',
        completedCount: 0x0,
        failedCount: 0x0,
        totalCount: _0xcc12e['length'],
      },
      backgroundTasks: [],
    },
    assets: [],
    episodes: _0xcc12e,
    clipFrames: [],
  });
}
export function isStoryVideoReplicationAssetLocalizationComplete(_0xc14b9c = {}) {
  return (
    _0xc14b9c?.['project']?.['sourceMode'] === 'video-replication' &&
    Number(_0xc14b9c['project']?.['replication']?.['assetLocalizationCompletedAt']) > 0x0 &&
    Array['isArray'](_0xc14b9c['assets']) &&
    _0xc14b9c['assets']['some']((_0x63bb92) => _0x63bb92?.['kind'] === 'scene')
  );
}
export function markStoryVideoReplicationAssetLocalizationComplete(
  _0x4f63c1 = {},
  { completedAt: completedAt = Date['now']() } = {},
) {
  if (_0x4f63c1?.['project']?.['sourceMode'] !== 'video-replication') return ![];
  if (
    !Array['isArray'](_0x4f63c1['assets']) ||
    !_0x4f63c1['assets']['some']((_0x35608f) => _0x35608f?.['kind'] === 'scene')
  )
    return ![];
  const _0x3a62b1 = Math['max'](0x0, Math['trunc'](Number(completedAt) || 0x0));
  if (!_0x3a62b1) return ![];
  return (
    (_0x4f63c1['project']['replication'] = {
      ...(_0x4f63c1['project']['replication'] || {}),
      assetLocalizationCompletedAt: _0x3a62b1,
    }),
    !![]
  );
}
export function invalidateStoryVideoReplicationAssetLocalization(_0x33abc9 = {}) {
  if (_0x33abc9?.['project']?.['sourceMode'] !== 'video-replication') return ![];
  const _0x53452d = _0x33abc9['project']['replication'];
  if (!_0x53452d || !_0x53452d['assetLocalizationCompletedAt']) return ![];
  return ((_0x33abc9['project']['replication'] = { ..._0x53452d, assetLocalizationCompletedAt: 0x0 }), !![]);
}
export function applyStoryVideoReplicationUpload(
  _0x29cac9 = {},
  {
    file: file = null,
    videoRef: videoRef = '',
    durationSec: durationSec = 0x0,
    posterUrl: posterUrl = '',
    posterLocalPath: posterLocalPath = '',
  } = {},
) {
  const _0x37cd89 = normalizePositiveNumber(durationSec);
  ((_0x29cac9['sourceVideo'] = {
    ...(_0x29cac9['sourceVideo'] || {}),
    ...(file
      ? {
          fileName: normalizeText(file['name']) || _0x29cac9['sourceVideo']?.['fileName'],
          size: Math['max'](0x0, Number(file['size']) || 0x0),
          mimeType: normalizeText(file['type']),
        }
      : {}),
    videoRef: normalizeText(videoRef),
    durationSec: _0x37cd89,
    posterUrl: normalizeText(posterUrl),
    posterLocalPath: normalizeText(posterLocalPath),
  }),
    (_0x29cac9['coverUrl'] = normalizeText(posterUrl || _0x29cac9['coverUrl'])),
    (_0x29cac9['durationSec'] = _0x37cd89));
  const _0xa5b3f6 = Math['round'](_0x37cd89);
  return (
    (_0x29cac9['duration'] = _0xa5b3f6
      ? String(Math['floor'](_0xa5b3f6 / 0x3c))['padStart'](0x2, '0') +
        ':' +
        String(_0xa5b3f6 % 0x3c)['padStart'](0x2, '0')
      : '--:--'),
    (_0x29cac9['replication'] = {
      ...(_0x29cac9['replication'] || {}),
      status: 'analyzing',
      progress: 0x2d,
      error: '',
    }),
    (_0x29cac9['status'] = '解析中'),
    _0x29cac9
  );
}
export function applyStoryVideoReplicationAnalysis(_0x3094eb = {}, _0x43c5dd = {}) {
  if (_0x43c5dd['sourceAnalysis']) {
    const _0x504f87 = _0x43c5dd['sourceAnalysis'];
    if (
      _0x3094eb['replication']?.['sourceAnalysis'] &&
      _0x3094eb['replication']['sourceAnalysis'] !== _0x504f87
    )
      delete _0x3094eb['replication']['transcription'];
    const _0x2b8b27 = buildVideoReplicationSourceTranscript(_0x504f87);
    return (
      (_0x3094eb['title'] = _0x504f87['title'] || _0x3094eb['title']),
      (_0x3094eb['synopsis'] = _0x504f87['synopsis']),
      (_0x3094eb['scriptStatus'] = 'completed'),
      (_0x3094eb['script'] = {
        schemaVersion: 0x1,
        source: 'video-replication',
        episodeRef: _0x3094eb['id'],
        fullText: _0x2b8b27,
        scenes: parseUploadedStoryEpisodeScenes({
          fullText: _0x2b8b27,
          episodeRef: _0x3094eb['id'],
          fallbackHeading: _0x3094eb['title'],
        }),
        generatedAt: Date['now'](),
      }),
      (_0x3094eb['replication'] = {
        ..._0x3094eb['replication'],
        sourceAnalysis: _0x504f87,
        status: 'ready',
        progress: 0x64,
        error: '',
        message: '',
        analysis: null,
      }),
      (_0x3094eb['status'] = '待核对'),
      _0x3094eb
    );
  }
  const _0x4c2756 = normalizePositiveNumber(
      _0x3094eb['sourceVideo']?.['durationSec'] || _0x43c5dd['durationSec'],
    ),
    _0x1ec195 = Array['isArray'](_0x43c5dd['segments']) ? _0x43c5dd['segments'] : [],
    _0x7af363 = _0x1ec195['map']((_0x585f21, _0x4427d5) =>
      normalizeAnalysisSegment(_0x585f21, _0x4427d5, _0x4c2756),
    )['filter'](
      (_0x5a92bb) => _0x5a92bb['durationSec'] > 0x0 && (_0x5a92bb['script'] || _0x5a92bb['prompt']),
    );
  !_0x7af363['length'] &&
    _0x7af363['push'](
      normalizeAnalysisSegment(
        {
          title: normalizeText(_0x43c5dd['title']) || _0x3094eb['title'],
          startSec: 0x0,
          endSec: _0x4c2756 || 0xf,
          script: normalizeText(_0x43c5dd['fullScript'] || _0x43c5dd['synopsis']),
          prompt: normalizeText(_0x43c5dd['seedancePrompt']),
          camera: normalizeText(_0x43c5dd['camera']),
          sound: normalizeText(_0x43c5dd['sound']),
        },
        0x0,
        _0x4c2756,
      ),
    );
  const _0xa1f813 =
    normalizeText(_0x43c5dd['fullScript']) ||
    _0x7af363['map']((_0x1ec8d7) => _0x1ec8d7['script'])
      ['filter'](Boolean)
      ['join']('\x0a\x0a') ||
    normalizeText(_0x43c5dd['synopsis'] || _0x43c5dd['seedancePrompt']);
  if (!_0xa1f813) throw new Error('视频理解模型未返回可用的本地化剧本。');
  const _0x210a6d = normalizeText(_0x43c5dd['title']) || normalizeText(_0x3094eb['title']) || '未命名分集',
    _0x48516d = parseUploadedStoryEpisodeScenes({
      fullText: _0xa1f813,
      episodeRef: _0x3094eb['id'],
      fallbackHeading: _0x210a6d,
    });
  return (
    (_0x3094eb['title'] = _0x210a6d),
    (_0x3094eb['synopsis'] = normalizeText(_0x43c5dd['synopsis']) || _0xa1f813['slice'](0x0, 0xb4)),
    (_0x3094eb['scriptStatus'] = 'completed'),
    (_0x3094eb['script'] = {
      schemaVersion: 0x1,
      source: 'video-replication',
      episodeRef: _0x3094eb['id'],
      scenes: _0x48516d['length']
        ? _0x48516d
        : [
            {
              ref: _0x3094eb['id'] + '-scene-1',
              heading: _0x210a6d,
              characters: [],
              body: _0xa1f813,
              source: 'video-replication',
            },
          ],
      fullText: _0xa1f813,
      generatedAt: Date['now'](),
    }),
    (_0x3094eb['clips'] = []),
    (_0x3094eb['clipCount'] = 0x0),
    (_0x3094eb['status'] = '待拆分'),
    (_0x3094eb['replication'] = {
      ...(_0x3094eb['replication'] || {}),
      status: 'ready',
      progress: 0x64,
      error: '',
      analysis: {
        title: _0x210a6d,
        synopsis: _0x3094eb['synopsis'],
        camera: normalizeText(_0x43c5dd['camera']),
        sound: normalizeText(_0x43c5dd['sound']),
        seedancePrompt: normalizeText(_0x43c5dd['seedancePrompt']),
        segmentCount: _0x7af363['length'],
        segments: _0x7af363,
      },
      ...(_0x43c5dd['sourceAnalysis'] ? { sourceAnalysis: _0x43c5dd['sourceAnalysis'] } : {}),
      scriptSourceRevision:
        _0x43c5dd['sourceAnalysis']?.['revision'] ||
        _0x3094eb['replication']?.['sourceAnalysis']?.['revision'] ||
        0x0,
    }),
    _0x3094eb
  );
}
export function failStoryVideoReplicationEpisode(_0x5be8f1 = {}, _0x21e01f = '') {
  const _0x1d811e = normalizeText(_0x21e01f) || '视频解析失败，请重试。';
  return (
    (_0x5be8f1['status'] = '解析失败'),
    (_0x5be8f1['replication'] = {
      ...(_0x5be8f1['replication'] || {}),
      status: 'failed',
      progress: 0x0,
      error: _0x1d811e,
    }),
    _0x5be8f1
  );
}
export function settleInterruptedStoryVideoReplication(
  _0x4d29a9 = {},
  { message: message = '上次视频解析已中断，请点击重试；已完成结果不会重新生成。' } = {},
) {
  if (_0x4d29a9?.['project']?.['sourceMode'] !== 'video-replication') return 0x0;
  let _0x1b10e5 = 0x0;
  for (const _0x1a6fa2 of _0x4d29a9['episodes'] || []) {
    if (!['queued', 'uploading', 'analyzing']['includes'](_0x1a6fa2?.['replication']?.['status'])) continue;
    (failStoryVideoReplicationEpisode(_0x1a6fa2, message), (_0x1b10e5 += 0x1));
  }
  if (_0x1b10e5) syncStoryVideoReplicationProject(_0x4d29a9);
  return _0x1b10e5;
}
export function reorderStoryVideoReplicationEpisodes(_0x3abc29 = [], _0x236f86 = []) {
  const _0x3141ff = Array['isArray'](_0x3abc29) ? _0x3abc29 : [],
    _0x2db577 = new Map(_0x3141ff['map']((_0xebfefb) => [normalizeText(_0xebfefb?.['id']), _0xebfefb])),
    _0x18b7e8 = new Set(),
    _0x41463f = [];
  return (
    (Array['isArray'](_0x236f86) ? _0x236f86 : [])['forEach']((_0x25c2e2) => {
      const _0x1ac88b = normalizeText(_0x25c2e2),
        _0x17e2af = _0x2db577['get'](_0x1ac88b);
      if (!_0x17e2af || _0x18b7e8['has'](_0x1ac88b)) return;
      (_0x18b7e8['add'](_0x1ac88b), _0x41463f['push'](_0x17e2af));
    }),
    _0x3141ff['forEach']((_0x6c6b27) => {
      const _0x271c90 = normalizeText(_0x6c6b27?.['id']);
      if (!_0x271c90 || _0x18b7e8['has'](_0x271c90)) return;
      (_0x18b7e8['add'](_0x271c90), _0x41463f['push'](_0x6c6b27));
    }),
    _0x41463f['map']((_0x5dda78, _0x558fea) => {
      return ((_0x5dda78['number'] = _0x558fea + 0x1), _0x5dda78);
    })
  );
}
export function syncStoryVideoReplicationProject(_0x2ea2a1 = {}) {
  const _0xa063fb = Array['isArray'](_0x2ea2a1['episodes']) ? _0x2ea2a1['episodes'] : [],
    _0x4feea4 = _0xa063fb['filter']((_0x5e347f) => _0x5e347f?.['replication']?.['status'] === 'ready'),
    _0x2177a7 = _0xa063fb['filter']((_0x55c2b4) => _0x55c2b4?.['replication']?.['status'] === 'failed'),
    _0x6f4063 = _0xa063fb['filter']((_0x45115d) =>
      ['queued', 'uploading', 'analyzing']['includes'](_0x45115d?.['replication']?.['status']),
    ),
    _0xdbe426 = _0x4feea4['map']((_0x11bb19) => normalizeText(_0x11bb19?.['script']?.['fullText']))
      ['filter'](Boolean)
      ['join']('\x0a\x0a'),
    _0x504da7 = _0x2ea2a1['project'] || (_0x2ea2a1['project'] = {});
  ((_0x504da7['replication'] = {
    ...(_0x504da7['replication'] || {}),
    status: _0x6f4063['length']
      ? 'analyzing'
      : _0x2177a7['length']
        ? _0x4feea4['length']
          ? 'partial'
          : 'failed'
        : _0x4feea4['length'] === _0xa063fb['length'] && _0xa063fb['length']
          ? 'ready'
          : 'pending',
    completedCount: _0x4feea4['length'],
    failedCount: _0x2177a7['length'],
    totalCount: _0xa063fb['length'],
  }),
    (_0x504da7['chapters'] = _0x4feea4['map']((_0x47e691) => ({
      id: _0x47e691['id'],
      title: '第\x20' + _0x47e691['number'] + '\x20集：' + _0x47e691['title'],
      content: _0x47e691['script']['fullText'],
    }))),
    (_0x504da7['plotScript'] = _0xdbe426),
    (_0x504da7['narrationScript'] = _0xdbe426),
    (_0x504da7['originalCreative'] = _0xdbe426),
    (_0x504da7['summary'] = _0x4feea4['map']((_0x1621c6) => _0x1621c6['synopsis'])
      ['filter'](Boolean)
      ['join']('\x0a')));
  const _0x40d632 = _0xa063fb['map']((_0x55c537) => _0x55c537['id']),
    _0x2142e2 = _0x504da7['compiledScript'],
    _0x3a5210 = Boolean(
      _0x2142e2 &&
      _0x2142e2['fullText'] === _0xdbe426 &&
      JSON['stringify'](_0x2142e2['episodeIds'] || []) === JSON['stringify'](_0x40d632),
    );
  return (
    (_0x504da7['compiledScript'] =
      _0x4feea4['length'] === _0xa063fb['length'] && _0xa063fb['length']
        ? {
            revision: 0x1,
            episodeIds: _0x40d632,
            fullText: _0xdbe426,
            confirmedAt: _0x3a5210 ? _0x2142e2['confirmedAt'] : Date['now'](),
          }
        : null),
    _0x2ea2a1
  );
}
export function getStoryVideoReplicationSummary(_0x3f87c7 = {}) {
  syncStoryVideoReplicationProject(_0x3f87c7);
  const _0x40119e = _0x3f87c7['project']?.['replication'] || {};
  return {
    status: _0x40119e['status'] || 'pending',
    total: Math['max'](0x0, Number(_0x40119e['totalCount']) || 0x0),
    completed: Math['max'](0x0, Number(_0x40119e['completedCount']) || 0x0),
    failed: Math['max'](0x0, Number(_0x40119e['failedCount']) || 0x0),
    active: (_0x3f87c7['episodes'] || [])['filter']((_0x369d41) =>
      ['queued', 'uploading', 'analyzing']['includes'](_0x369d41?.['replication']?.['status']),
    )['length'],
  };
}
export function getStoryVideoReplicationFooterState(
  _0x1f654a = {},
  { localizing: localizing = ![], planningStatus: planningStatus = '' } = {},
) {
  const _0x2d6300 = getStoryVideoReplicationSummary(_0x1f654a),
    _0xf5542a = (_0x1f654a['episodes'] || [])['some']((_0x40709a) => {
      const _0x2116fa = _0x40709a['replication']?.['sourceAnalysis'];
      if (!_0x2116fa) return ![];
      const _0x7d0c8e = getVideoReplicationDialogueSummary(_0x2116fa);
      return _0x7d0c8e['total'] === 0x0 || _0x7d0c8e['pending'] > 0x0;
    }),
    _0x56e2d5 = _0x2d6300['active'] > 0x0,
    _0x40c522 = _0x56e2d5 || localizing,
    _0x832a67 = _0x2d6300['completed'] > 0x0,
    _0x51c7b2 = (_0x1f654a['episodes'] || [])['some'](
      (_0xde9f5f) => _0xde9f5f['replication']?.['status'] === 'pending',
    );
  if (localizing)
    return {
      busy: _0x40c522,
      action: 'localize-replication-assets',
      actionLabel: '提取元素中',
      actionAttention: ![],
      actionDisabled: !![],
      title: normalizeText(planningStatus) || '正在识别角色、场景与道具',
      hint: '原片分析已保留，提取完成后指定替换人物',
    };
  return {
    busy: _0x40c522,
    action: _0x832a67
      ? 'localize-replication-assets'
      : _0x51c7b2
        ? 'analyze-all-replication'
        : 'retry-replication-analysis',
    actionLabel: _0x56e2d5
      ? '解析中'
      : _0x832a67
        ? '确认分析，下一步：替换人物'
        : _0x51c7b2
          ? '开始分析全部待处理视频'
          : '重试失败视频',
    actionAttention: _0x832a67,
    actionDisabled: _0x56e2d5 || (!_0x832a67 && !_0x2d6300['failed'] && !_0x51c7b2),
    title: _0x56e2d5
      ? '正在整理提取素材，请稍后'
      : _0x832a67
        ? _0xf5542a
          ? '原片画面已分析，人声文案待核对'
          : '视频解析完成'
        : _0x2d6300['failed']
          ? '已完成\x20' +
            _0x2d6300['completed'] +
            '/' +
            _0x2d6300['total'] +
            ' 条，' +
            _0x2d6300['failed'] +
            '\x20条解析失败'
          : '等待视频解析',
    hint: _0x56e2d5
      ? '已完成 ' + _0x2d6300['completed'] + '/' + _0x2d6300['total'] + ' 条，解析期间可调整卡片顺序'
      : _0x832a67
        ? '核对故事和人声文案后，提取原片元素并设置替换；分段提示词在后续生成'
        : '解析失败的视频可重试，已完成结果不会重新生成',
  };
}

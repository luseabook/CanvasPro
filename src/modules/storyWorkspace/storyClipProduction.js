import { renderRequestDebugButton } from '../debugRequestWindow.js';
import { renderStoryClipQualityNotes } from './storyClipQualityPresentation.js';
import { resolveAssetMentionRef } from '../assetMentionRegistry.js';
import { renderAIGenVideoModelSelectorMarkup } from '../../components/aigenVideo/modelSelector.js';
import {
  renderVideoPromptEditorMarkup,
  renderVideoReferenceBarMarkup,
} from '../../components/video-node/promptInputSurface.js';
import { resolveModelExecution } from '../../manifests/index.js';
import {
  buildFixedInputAssetSlotMapFromRefs,
  getFixedInputSlotConfigFromManifest,
  shouldHideFixedInputSlots,
} from '../fixedInputAssetRefs.js';
import { sanitizePromptHtmlForCommit } from '../nodePromptShared.js';
import { STORY_PROMPT_LANGUAGES } from '../../domain/storyGeneration/promptLanguage.js';
import { canGenerateStoryClipAdjustment } from './storyClipAdjustmentMenu.js';
import { t } from '../../i18n/index.js';
import { buildStoryClipInputSlotViewModel } from './storyClipInputSlots.js';
import { getRecoverableStoryClipVideoTask, buildStoryClipVideoPayload } from './storyClipGeneration.js';
import { renderStoryGenerationSpinner } from './storyAsyncButtonPresentation.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { renderWorkspaceVideoPlaybackControls } from '../workspaceVideoPlaybackControls.js';
import { renderStoryClipPromptMentions, resolveStoryClipPromptAssetRefs } from './storyClipMentions.js';
import { normalizeDurationSeconds } from './storyPlanningData.js';
import { resolveStoryVideoReplicationClipVoiceAssetIds } from './storyVideoReplication.js';
import { renderStoryKeyframeIcon } from './storyWorkspaceIcons.js';
import { renderStoryMediaHistoryMenu } from './storyMediaHistory.js';
import { VIDEO_CLIP_ICON_SVG } from '../../components/nodeToolbar/videoToolbarHtml.js';
import { renderWorkspaceCardDeleteControl } from '../workspaceAssetPresentation.js';
import {
  formatStoryClipVideoGenerationDuration,
  resolveStoryClipVideoGenerationParams,
} from './storyVideoGenerationSettings.js';
import { STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS } from './storyWorkspaceModelCatalog.js';
import { isStoryClipAdjustmentGenerating, normalizeStoryClipPromptHistory } from './storyClipAdjustment.js';
import {
  STORY_PROMPT_MODE_OPTIONS,
  isStoryMinimaxH3PromptMode,
  getStoryPromptModeLabel,
  normalizeStoryMinimaxH3OfficialTags,
  normalizeStoryPromptMode,
} from './storyPromptModes.js';
function escapeHtml(_0x4eea5f) {
  return String(_0x4eea5f ?? '')
    ['replace'](/&/g, '&amp;')
    ['replace'](/</g, '&lt;')
    ['replace'](/>/g, '&gt;')
    ['replace'](/"/g, '&quot;')
    ['replace'](/'/g, '&#39;');
}
function normalizeText(_0x133ae7) {
  return String(_0x133ae7 || '')['trim']();
}
function formatPromptHistorySavedAt(_0x55d5a9) {
  const _0x58e4ec = new Date(Number(_0x55d5a9));
  if (!Number['isFinite'](_0x58e4ec['getTime']()) || Number(_0x55d5a9) <= 0x0) return '时间未记录';
  const _0x33d652 = (_0xb6a482) => String(_0xb6a482)['padStart'](0x2, '0');
  return (
    _0x58e4ec['getFullYear']() +
    '-' +
    _0x33d652(_0x58e4ec['getMonth']() + 0x1) +
    '-' +
    _0x33d652(_0x58e4ec['getDate']()) +
    '\x20' +
    _0x33d652(_0x58e4ec['getHours']()) +
    ':' +
    _0x33d652(_0x58e4ec['getMinutes']())
  );
}
function getPromptHistoryPreview(_0x1a1f5b) {
  return normalizeText(
    String(_0x1a1f5b || '')
      ['replace'](/<br\s*\/?\s*>/gi, '\x20')
      ['replace'](/<[^>]+>/g, '\x20')
      ['replace'](/&nbsp;/gi, '\x20')
      ['replace'](/&lt;/gi, '<')
      ['replace'](/&gt;/gi, '>')
      ['replace'](/&quot;/gi, '\x22')
      ['replace'](/&#39;|&apos;/gi, '\x27')
      ['replace'](/&amp;/gi, '&')
      ['replace'](/\s+/g, '\x20'),
  )['slice'](0x0, 0x60);
}
function getVideoResults(_0xa1bae = {}) {
  return Array['isArray'](_0xa1bae?.['video']?.['results'])
    ? _0xa1bae['video']['results']['filter']((_0x494755) => _0x494755 && typeof _0x494755 === 'object')
    : [];
}
function getActiveVideoResultIndex(_0x2c899f = {}, _0x266745 = getVideoResults(_0x2c899f)) {
  if (!_0x266745['length']) return 0x0;
  const _0x33cb1 = Math['trunc'](Number(_0x2c899f?.['video']?.['activeIndex']) || 0x0);
  return Math['max'](0x0, Math['min'](_0x266745['length'] - 0x1, _0x33cb1));
}
function removeVideoResult(_0x14b71b = {}, _0x129de4) {
  const _0x2fb9a7 = getVideoResults(_0x14b71b),
    _0x40b238 = Number(_0x129de4),
    _0x389ac3 = getActiveVideoResultIndex(_0x14b71b, _0x2fb9a7);
  if (
    _0x2fb9a7['length'] < 0x2 ||
    !Number['isInteger'](_0x40b238) ||
    _0x40b238 < 0x0 ||
    _0x40b238 >= _0x2fb9a7['length']
  )
    return {
      changed: ![],
      clip: _0x14b71b,
      results: _0x2fb9a7,
      activeIndex: _0x389ac3,
      activeResultChanged: ![],
      direction: '',
    };
  const _0x3258f0 = _0x2fb9a7[_0x389ac3],
    _0x390755 = _0x2fb9a7['filter']((_0x2181b1, _0x58bbe5) => _0x58bbe5 !== _0x40b238),
    _0x3e9f10 =
      _0x40b238 < _0x389ac3
        ? _0x389ac3 - 0x1
        : _0x40b238 === _0x389ac3
          ? Math['min'](_0x40b238, _0x390755['length'] - 0x1)
          : _0x389ac3,
    _0xd2661 = _0x390755[_0x3e9f10] !== _0x3258f0;
  return {
    changed: !![],
    clip: {
      ..._0x14b71b,
      video: { ...(_0x14b71b?.['video'] || {}), results: _0x390755, activeIndex: _0x3e9f10 },
    },
    results: _0x390755,
    activeIndex: _0x3e9f10,
    activeResultChanged: _0xd2661,
    direction: _0xd2661 && _0x40b238 >= _0x390755['length'] ? 'previous' : _0xd2661 ? 'next' : '',
  };
}
function resolveVideoResultUrl(_0x44e626 = {}) {
  return (
    [
      localPathToUrl(_0x44e626['displayLocalPath']),
      localPathToUrl(_0x44e626['localPath']),
      _0x44e626['videoUrl'],
      _0x44e626['url'],
      _0x44e626['displayUrl'],
    ]
      ['map']((_0x4a625b) => normalizeText(_0x4a625b))
      ['find'](Boolean) || ''
  );
}
function resolveVideoResultPosterUrl(_0x250744 = {}) {
  return (
    [
      _0x250744['posterUrl'],
      _0x250744['thumbUrl'],
      _0x250744['thumbnailUrl'],
      _0x250744['coverUrl'],
      localPathToUrl(_0x250744['posterLocalPath']),
      localPathToUrl(_0x250744['thumbLocalPath']),
      localPathToUrl(_0x250744['thumbnailLocalPath']),
    ]
      ['map']((_0x595804) => normalizeText(_0x595804))
      ['find'](Boolean) || ''
  );
}
function renderVideoThumbnail(_0x4c31bb, { className: className = '', label: label = '视频缩略图' } = {}) {
  const _0x5e398f = resolveVideoResultPosterUrl(_0x4c31bb);
  if (_0x5e398f)
    return (
      '<img class="' +
      escapeHtml(className) +
      '" src="' +
      escapeHtml(_0x5e398f) +
      '\x22\x20alt=\x22' +
      escapeHtml(label) +
      '" loading="lazy" draggable="false">'
    );
  const _0x562007 = resolveVideoResultUrl(_0x4c31bb);
  if (_0x562007)
    return (
      '<video class="' +
      escapeHtml(className) +
      '\x22\x20src=\x22' +
      escapeHtml(_0x562007) +
      '\x22\x20aria-label=\x22' +
      escapeHtml(label) +
      '" muted playsinline preload="metadata"></video>'
    );
  return '';
}
function getAdjacentVideoResultIndex(_0x2b36b9 = {}, _0x5301cf = 0x1) {
  const _0x40d238 = getVideoResults(_0x2b36b9);
  if (_0x40d238['length'] < 0x2) return getActiveVideoResultIndex(_0x2b36b9, _0x40d238);
  const _0x3efe9a = getActiveVideoResultIndex(_0x2b36b9, _0x40d238),
    _0x27e836 = Number(_0x5301cf) < 0x0 ? -0x1 : 0x1;
  return (_0x3efe9a + _0x27e836 + _0x40d238['length']) % _0x40d238['length'];
}
function renderVideoHistoryMenu(_0x389b49 = {}) {
  const _0xfb4219 = getVideoResults(_0x389b49),
    _0x4c146c = getActiveVideoResultIndex(_0x389b49, _0xfb4219);
  return renderStoryMediaHistoryMenu({
    title: _0x389b49?.['title'] || '片段视频',
    results: _0xfb4219,
    activeIndex: _0x4c146c,
    menuLabel: (_0x389b49?.['title'] || '片段') + '历史视频',
    getItemStatus: (_0x40022f, _0x104c90) => (_0x104c90 === _0x4c146c ? '当前播放' : '点击切换'),
    renderMedia: (_0x2723d4, _0x5bae80) =>
      renderVideoThumbnail(_0x2723d4, {
        className: 'story-media-history-thumbnail story-clip-video-history-thumbnail',
        label: (_0x389b49?.['title'] || '片段') + ' · 版本 ' + (_0x5bae80 + 0x1),
      }),
    getItemAttributes: (_0x17e802, _0xc3f106) =>
      'data-story-action="select-video-result" data-story-clip-id="' +
      escapeHtml(_0x389b49?.['id']) +
      '" data-story-video-result-index="' +
      _0xc3f106 +
      '\x22',
    renderItemAction: (_0x4c360c, _0x5bafad) =>
      renderWorkspaceCardDeleteControl({
        className: 'story-media-history-delete',
        ariaLabel: '删除版本\x20' + (_0x5bafad + 0x1),
        actionAttributes: {
          'data-story-action': 'delete-video-result',
          'data-story-clip-id': _0x389b49?.['id'],
          'data-story-video-result-index': _0x5bafad,
        },
      }),
  });
}
function renderGenerationSpinner() {
  return renderStoryGenerationSpinner();
}
function renderTimelineVideoThumbnail(_0x2a8925 = {}) {
  const _0x4e11de = getVideoResults(_0x2a8925),
    _0x492797 = _0x4e11de[getActiveVideoResultIndex(_0x2a8925, _0x4e11de)] || null;
  return _0x492797
    ? renderVideoThumbnail(_0x492797, {
        className: 'story-clip-card-thumbnail',
        label: '片段 ' + _0x2a8925['number'] + ' 视频缩略图',
      })
    : '';
}
function getSelectedEpisode(_0x7fc0df) {
  const _0x182f19 = Array['isArray'](_0x7fc0df?.['data']?.['episodes']) ? _0x7fc0df['data']['episodes'] : [];
  return (
    _0x182f19['find']((_0xb9c24c) => _0xb9c24c['id'] === _0x7fc0df?.['selectedEpisodeId']) ||
    _0x182f19[0x0] ||
    null
  );
}
function getSelectedClip(_0x1e7f00, _0xb94b7d) {
  const _0x362b25 = Array['isArray'](_0xb94b7d?.['clips']) ? _0xb94b7d['clips'] : [];
  return (
    _0x362b25['find']((_0x448b64) => _0x448b64['id'] === _0x1e7f00?.['selectedClipId']) ||
    _0x362b25[0x0] ||
    null
  );
}
function getAdjacentClipId(_0xcd8a83 = [], _0x211538 = '', _0x5e87ee = 0x1) {
  const _0x1f9616 = (Array['isArray'](_0xcd8a83) ? _0xcd8a83 : [])['filter']((_0x34b54b) =>
    normalizeText(_0x34b54b?.['id']),
  );
  if (!_0x1f9616['length']) return '';
  const _0xbe59e = _0x1f9616['findIndex']((_0x3de2d3) => _0x3de2d3['id'] === _0x211538),
    _0x5c90cc = _0xbe59e >= 0x0 ? _0xbe59e : 0x0,
    _0x2ba7ed = Number(_0x5e87ee) < 0x0 ? -0x1 : 0x1,
    _0x45c618 = (_0x5c90cc + _0x2ba7ed + _0x1f9616['length']) % _0x1f9616['length'];
  return _0x1f9616[_0x45c618]['id'];
}
function selectBatchTargets(_0x1c81f6 = [], _0x1b3b25 = []) {
  const _0x5f1235 = new Set(
    (Array['isArray'](_0x1b3b25) ? _0x1b3b25 : [])
      ['map']((_0x4dc186) => normalizeText(_0x4dc186))
      ['filter'](Boolean),
  );
  return (Array['isArray'](_0x1c81f6) ? _0x1c81f6 : [])['filter']((_0x3a46e5) =>
    _0x5f1235['has'](normalizeText(_0x3a46e5?.['id'])),
  );
}
async function runBatch(_0x10bc98 = [], _0x463362 = null, { onProgress: onProgress = null } = {}) {
  if (typeof _0x463362 !== 'function') return [];
  const _0x152df0 = Array['isArray'](_0x10bc98) ? _0x10bc98 : [];
  let _0x6560b1 = 0x0;
  return Promise['all'](
    _0x152df0['map'](async (_0x599aa8, _0x381d06) => {
      let _0x1bcd2f;
      try {
        _0x1bcd2f = await _0x463362(_0x599aa8, { index: _0x381d06, total: _0x152df0['length'] });
      } catch (_0x1b7337) {
        _0x1bcd2f = { ok: ![], error: _0x1b7337 };
      }
      return (
        (_0x6560b1 += 0x1),
        onProgress?.({
          completed: _0x6560b1,
          total: _0x152df0['length'],
          index: _0x381d06,
          target: _0x599aa8,
          result: _0x1bcd2f,
        }),
        _0x1bcd2f
      );
    }),
  );
}
function getGeneratingClipIds(_0x493329 = {}, _0x363f23 = null) {
  const _0x1d16a7 = new Set(
      (Array['isArray'](_0x493329?.['generatingClipIds']) ? _0x493329['generatingClipIds'] : [])
        ['map']((_0x14f9cb) => normalizeText(_0x14f9cb))
        ['filter'](Boolean),
    ),
    _0x30a96a = normalizeText(_0x493329?.['generatingClipId']);
  if (_0x30a96a) _0x1d16a7['add'](_0x30a96a);
  const _0x6a1343 = [..._0x1d16a7];
  if (!_0x363f23) return _0x6a1343;
  const _0x2e7bef = new Set(
    (Array['isArray'](_0x363f23?.['clips']) ? _0x363f23['clips'] : [])
      ['map']((_0x37aae5) => normalizeText(_0x37aae5?.['id']))
      ['filter'](Boolean),
  );
  return _0x6a1343['filter']((_0x213e1d) => _0x2e7bef['has'](_0x213e1d));
}
function setClipGenerationRunning(_0x4dd8c9, _0x1445ec, _0x354c7d = !![]) {
  if (!_0x4dd8c9 || typeof _0x4dd8c9 !== 'object') return [];
  const _0x173efe = normalizeText(_0x1445ec),
    _0x476b34 = new Set(getGeneratingClipIds(_0x4dd8c9));
  if (_0x173efe) {
    if (_0x354c7d) _0x476b34['add'](_0x173efe);
    else _0x476b34['delete'](_0x173efe);
  }
  return (
    (_0x4dd8c9['generatingClipIds'] = [..._0x476b34]),
    (_0x4dd8c9['generatingClipId'] = _0x4dd8c9['generatingClipIds'][0x0] || ''),
    [..._0x4dd8c9['generatingClipIds']]
  );
}
function getGenerationState(_0x143038 = {}, _0x2fe6 = null) {
  const _0x237815 = normalizeText(_0x2fe6?.['id']),
    _0x1a6e2e = _0x143038?.['clipBatchGenerationByEpisode'],
    _0x58c3c3 = Boolean(
      _0x237815 &&
      _0x1a6e2e &&
      typeof _0x1a6e2e === 'object' &&
      !Array['isArray'](_0x1a6e2e) &&
      Object['hasOwn'](_0x1a6e2e, _0x237815),
    ),
    _0x2340e5 = _0x58c3c3 ? _0x1a6e2e[_0x237815] : null,
    _0x36d487 = getGeneratingClipIds(_0x143038, _0x2fe6);
  return {
    generatingClipIds: _0x36d487,
    isBatchGenerating: _0x58c3c3,
    batchLabel: normalizeText(_0x2340e5?.['label']),
    batchCancelRequested: _0x2340e5?.['cancelRequested'] === !![],
    busy: _0x58c3c3 || _0x36d487['length'] > 0x0,
  };
}
function setEpisodeBatchRunning(_0x36ca89, _0x113de2, _0x343bc6 = !![], _0x34792e = '', _0x3995fe = {}) {
  if (!_0x36ca89 || typeof _0x36ca89 !== 'object') return null;
  const _0x39ff51 = normalizeText(_0x113de2);
  if (!_0x39ff51) return null;
  const _0x22a772 = _0x36ca89['clipBatchGenerationByEpisode'],
    _0x5bf1b6 = {
      ...(_0x22a772 && typeof _0x22a772 === 'object' && !Array['isArray'](_0x22a772) ? _0x22a772 : {}),
    };
  if (_0x343bc6)
    _0x5bf1b6[_0x39ff51] = {
      ...(_0x5bf1b6[_0x39ff51] || {}),
      ...(_0x3995fe && typeof _0x3995fe === 'object' ? _0x3995fe : {}),
      label: normalizeText(_0x34792e),
    };
  else delete _0x5bf1b6[_0x39ff51];
  return ((_0x36ca89['clipBatchGenerationByEpisode'] = _0x5bf1b6), _0x5bf1b6[_0x39ff51] || null);
}
function getClipInputSurface(_0x29f463, _0x4935da, _0x2ddee7) {
  if (!_0x2ddee7) return '';
  const _0x4b0911 = resolveModelExecution(_0x29f463['models']['video'], {
      providerHint: _0x29f463['videoProvider'],
    }),
    _0x575eeb = buildStoryClipInputSlotViewModel({
      modelId: _0x29f463['models']['video'],
      provider: _0x29f463['videoProvider'],
      inputs: _0x2ddee7['inputs'],
    }),
    _0x5bc9db = {
      model: _0x29f463['models']['video'],
      provider: _0x29f463['videoProvider'],
      generationParams: _0x29f463['videoGenerationParams'],
    },
    _0x18017b = getFixedInputSlotConfigFromManifest(_0x5bc9db, {
      manifest: _0x4b0911?.['modelManifest'] || null,
    }),
    _0x1c1864 = shouldHideFixedInputSlots(_0x18017b) ? null : _0x18017b,
    _0x101f46 = _0x575eeb['slots']['filter']((_0x55ae97) => _0x55ae97['input']?.['url']),
    _0x3abdee = Object['fromEntries'](
      _0x101f46['map']((_0x112385) => [_0x112385['id'], { ..._0x112385['input'], kind: _0x112385['kind'] }]),
    ),
    _0x35ab8a = new Set(
      _0x101f46['map'](
        (_0x4023a7) => normalizeText(_0x4023a7['kind']) + ':' + normalizeText(_0x4023a7['input']?.['url']),
      )['filter'](Boolean),
    ),
    _0x136592 = resolveStoryVideoReplicationClipVoiceAssetIds(_0x29f463?.['data'], _0x2ddee7),
    _0x1261cd = resolveStoryClipPromptAssetRefs(_0x2ddee7?.['prompt'] || '', {
      assets: Array['isArray'](_0x29f463?.['data']?.['assets']) ? _0x29f463['data']['assets'] : [],
      episode: _0x4935da,
      clipFrames: Array['isArray'](_0x29f463?.['data']?.['clipFrames'])
        ? _0x29f463['data']['clipFrames']
        : [],
      resolveExternalAssetRef: resolveAssetMentionRef,
      voiceAssetIds: _0x136592,
    })
      ['map']((_0x187baa, _0x3cfe7b) => ({
        ..._0x187baa,
        type: normalizeText(_0x187baa?.['type'] || _0x187baa?.['kind']),
        kind: normalizeText(_0x187baa?.['type'] || _0x187baa?.['kind']),
        url: normalizeText(_0x187baa?.['url']),
        thumbUrl: normalizeText(_0x187baa?.['thumbUrl'] || _0x187baa?.['url']),
        name: normalizeText(_0x187baa?.['name'] || _0x187baa?.['label']) || '素材 ' + (_0x3cfe7b + 0x1),
        refSlot: normalizeText(_0x187baa?.['refSlot'] || _0x187baa?.['slotId']),
      }))
      ['filter'](
        (_0x6b92a7) =>
          _0x6b92a7['kind'] &&
          _0x6b92a7['url'] &&
          !_0x35ab8a['has'](_0x6b92a7['kind'] + ':' + _0x6b92a7['url']),
      );
  let _0x393eb1 = _0x1261cd['filter']((_0x368be2) => _0x368be2['kind'] === 'image');
  const _0x317ebc = [];
  if (_0x4b0911?.['modelManifest']?.['extensions']?.['rhAiApp'] && _0x1c1864) {
    const _0x50b19f = buildFixedInputAssetSlotMapFromRefs(_0x1261cd, {
        slotOrderByType: _0x1c1864['slotOrderByType'],
        visibleSlots: _0x1c1864['visibleSlots'],
        occupiedSlots: _0x101f46['map']((_0x2c94cb) => _0x2c94cb['id']),
        exclusiveGroups: _0x1c1864['exclusiveGroups'],
        slotById: _0x1c1864['slotById'],
      }),
      _0x14e261 = new Set();
    (Object['entries'](_0x50b19f)['forEach'](([_0x528a8b, _0x314722]) => {
      if (!_0x314722?.['url']) return;
      const _0x36f591 = normalizeText(_0x314722['type'] || _0x314722['kind']);
      ((_0x3abdee[_0x528a8b] = { ..._0x314722, kind: _0x36f591, slotId: _0x528a8b }),
        _0x317ebc['push'](_0x528a8b),
        _0x14e261['add'](_0x36f591 + ':' + normalizeText(_0x314722['url'])));
    }),
      (_0x393eb1 = _0x393eb1['filter'](
        (_0x2c1669) => !_0x14e261['has'](_0x2c1669['kind'] + ':' + _0x2c1669['url']),
      )));
  }
  return {
    fixedInputConfig: _0x1c1864,
    inputsBySlot: _0x3abdee,
    inputs: _0x101f46['map']((_0x1dee3b) => ({
      ..._0x1dee3b['input'],
      kind: _0x1dee3b['kind'],
      slotId: _0x1dee3b['id'],
    })),
    readOnlyInputs: _0x393eb1,
    readOnlyFixedInputSlots: _0x317ebc,
  };
}
function getInputReferenceCounts(_0x2c7247) {
  const _0xe79c50 =
      _0x2c7247?.['inputs'] && typeof _0x2c7247['inputs'] === 'object' ? _0x2c7247['inputs'] : {},
    _0x39f562 = (_0x88fdc0) =>
      (Array['isArray'](_0xe79c50[_0x88fdc0]) ? _0xe79c50[_0x88fdc0] : [])['filter']((_0x36c6ee) =>
        normalizeText(_0x36c6ee?.['url']),
      )['length'];
  return { imageCount: _0x39f562('image'), videoCount: _0x39f562('video'), audioCount: _0x39f562('audio') };
}
function getUsedReferenceCounts(
  _0x171430,
  {
    assets: assets = [],
    episode: episode = null,
    clipFrames: clipFrames = [],
    voiceAssetIds: voiceAssetIds = null,
  } = {},
) {
  const _0x221722 = { imageCount: 0x0, audioCount: 0x0, videoCount: 0x0 },
    _0x240eb5 = new Set(),
    _0x1e7d5d = (_0x3f43fc, _0x34f40f = '') => {
      const _0x5ca257 = normalizeText(_0x3f43fc?.['type'] || _0x3f43fc?.['kind'] || _0x34f40f),
        _0x477cce = normalizeText(_0x3f43fc?.['url']);
      if (!Object['hasOwn'](_0x221722, _0x5ca257 + 'Count') || !_0x477cce) return;
      const _0x1c2330 = _0x5ca257 + ':' + _0x477cce;
      if (_0x240eb5['has'](_0x1c2330)) return;
      (_0x240eb5['add'](_0x1c2330), (_0x221722[_0x5ca257 + 'Count'] += 0x1));
    },
    _0x7b81a3 = _0x171430?.['inputs'] && typeof _0x171430['inputs'] === 'object' ? _0x171430['inputs'] : {};
  return (
    ['image', 'audio', 'video']['forEach']((_0x5e0e08) => {
      (Array['isArray'](_0x7b81a3[_0x5e0e08]) ? _0x7b81a3[_0x5e0e08] : [])['forEach']((_0x2f392d) =>
        _0x1e7d5d(_0x2f392d, _0x5e0e08),
      );
    }),
    resolveStoryClipPromptAssetRefs(_0x171430?.['prompt'] || '', {
      assets: assets,
      episode: episode,
      clipFrames: clipFrames,
      resolveExternalAssetRef: resolveAssetMentionRef,
      voiceAssetIds: voiceAssetIds,
    })['forEach']((_0xe13c72) => _0x1e7d5d(_0xe13c72)),
    _0x221722
  );
}
function renderReferenceSummary(
  _0x4185c7,
  {
    assets: assets = [],
    episode: episode = null,
    clipFrames: clipFrames = [],
    voiceAssetIds: voiceAssetIds = null,
  } = {},
) {
  const _0x198788 = getUsedReferenceCounts(_0x4185c7, {
      assets: assets,
      episode: episode,
      clipFrames: clipFrames,
      voiceAssetIds: voiceAssetIds,
    }),
    _0xc0c73f =
      '参考素材，图片 ' +
      _0x198788['imageCount'] +
      '，音频\x20' +
      _0x198788['audioCount'] +
      '，视频\x20' +
      _0x198788['videoCount'];
  return (
    '<div class="story-clip-reference-summary" data-story-clip-reference-summary role="status" aria-live="polite" aria-label="' +
    _0xc0c73f +
    '">\n    <span>图片：<strong data-story-reference-count="image">' +
    _0x198788['imageCount'] +
    '</strong></span>\n    <span>音频：<strong data-story-reference-count="audio">' +
    _0x198788['audioCount'] +
    '</strong></span>\x0a\x20\x20\x20\x20<span>视频：<strong\x20data-story-reference-count=\x22video\x22>' +
    _0x198788['videoCount'] +
    '</strong></span>\n  </div>'
  );
}
function renderSelectionControls(_0x50bc25, _0x42eafa, _0x9079cd = null) {
  const _0x313314 = Array['isArray'](_0x42eafa?.['clips']) ? _0x42eafa['clips'] : [],
    _0x161d63 = Array['isArray'](_0x50bc25?.['selectedClipGenerationIds'])
      ? _0x50bc25['selectedClipGenerationIds']
      : [],
    _0x13af32 = selectBatchTargets(_0x313314, _0x161d63),
    _0x2db1b9 = _0x13af32['length'],
    _0x2529fd = getGenerationState(_0x50bc25, _0x42eafa),
    { generatingClipIds: _0x59cab5 } = _0x2529fd,
    _0x4db553 = _0x9079cd || getSelectedClip(_0x50bc25, _0x42eafa),
    _0x1ee49a = _0x50bc25?.['clipSelectionMode'] ? _0x13af32[0x0] : _0x4db553,
    _0x5db47e = _0x50bc25?.['clipSelectionMode'] && _0x2db1b9 > 0x1,
    _0x41aef6 = !_0x50bc25?.['clipSelectionMode'] || _0x2db1b9 === 0x1,
    _0xafa0dc =
      _0x41aef6 &&
      Boolean(
        _0x1ee49a &&
        (_0x59cab5['includes'](normalizeText(_0x1ee49a['id'])) ||
          getRecoverableStoryClipVideoTask(_0x1ee49a)),
      ),
    _0x31b9ed = _0x50bc25?.['clipSelectionMode']
      ? _0x2db1b9 === 0x0 ||
        _0x2529fd['isBatchGenerating'] ||
        (_0x5db47e ? _0x59cab5['length'] > 0x0 : _0xafa0dc)
      : !_0x4db553 || _0x2529fd['isBatchGenerating'] || _0xafa0dc,
    _0x1380ba = normalizeText(_0x1ee49a?.['generation']?.['status'])['toLowerCase']() === 'queued',
    _0x3d17e5 = '批量生成视频' + (_0x2db1b9 ? '\x20(' + _0x2db1b9 + ')' : ''),
    _0x588348 = _0x2529fd['isBatchGenerating']
      ? _0x3d17e5
      : _0xafa0dc
        ? _0x1380ba
          ? '排队中'
          : '生成中'
        : _0x50bc25?.['clipSelectionMode'] && _0x2db1b9 > 0x1
          ? _0x3d17e5
          : '生成本片段',
    _0x4224e8 = Boolean(_0x2529fd['isBatchGenerating'] || _0xafa0dc),
    _0x4b9bab =
      renderRequestDebugButton('data-story-action="debug-clip-video"') +
      '<button type="button" class="story-workbench-action-button story-main-action-button" data-story-action="generate-clip-video" aria-busy="' +
      _0x4224e8 +
      '\x22\x20' +
      (_0x31b9ed ? 'disabled' : '') +
      '>' +
      (_0x4224e8 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
      _0x588348 +
      '</button>',
    _0x165dbb = _0x2529fd['isBatchGenerating']
      ? '<button type="button" class="story-secondary-button" data-story-action="cancel-clip-batch-generation" ' +
        (_0x2529fd['batchCancelRequested'] ? 'disabled' : '') +
        '>' +
        (_0x2529fd['batchCancelRequested'] ? '正在停止' : '停止批量生成') +
        '</button>'
      : '',
    _0x185833 =
      '<div\x20class=\x22story-clip-selection-actions\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-secondary-button\x22\x20data-story-action=\x22select-all-clips\x22\x20aria-pressed=\x22' +
      (_0x2db1b9 > 0x0 && _0x2db1b9 === _0x313314['length']) +
      '\x22\x20' +
      (!_0x313314['length'] ? 'disabled' : '') +
      '>' +
      (_0x2db1b9 > 0x0 && _0x2db1b9 === _0x313314['length'] ? '取消全选' : '全选') +
      '</button>\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      _0x165dbb +
      '\n        ' +
      _0x4b9bab +
      '\n      </div>';
  return '<div class="story-clip-selection-controls">' + _0x185833 + '</div>';
}
function renderAdjustmentBar(_0x4cdd70, _0x1e0737, _0x59ed92 = null) {
  if (_0x4cdd70?.['clipAdjustmentOpen'] !== !![]) return '';
  const _0x5ad066 = isStoryClipAdjustmentGenerating(_0x4cdd70, _0x59ed92, _0x1e0737),
    _0x145534 = normalizeStoryPromptMode(
      _0x1e0737?.['promptMode'] ||
        _0x59ed92?.['promptMode'] ||
        _0x4cdd70?.['data']?.['project']?.['planning']?.['promptMode'],
      { allowDeveloperModes: !![] },
    ),
    _0x26cb23 = normalizeStoryPromptMode(_0x4cdd70?.['clipAdjustmentPromptMode'] || _0x145534, {
      allowDeveloperModes: !![],
    }),
    _0x2b23ad = canGenerateStoryClipAdjustment(_0x4cdd70, _0x59ed92, _0x1e0737);
  return (
    '<div class="story-clip-adjustment-bar" data-story-clip-adjustment-bar>\n    <div class="story-clip-adjustment-selectors">\n    <div class="story-clip-adjustment-mode" data-story-clip-adjustment-mode data-story-adjustment-kind="mode">\n      <button type="button" class="story-clip-adjustment-mode-trigger" data-story-action="toggle-clip-adjustment-mode" aria-haspopup="listbox" aria-expanded="' +
    (_0x4cdd70?.['clipAdjustmentPromptModeOpen'] === !![]) +
    '\x22\x20' +
    (_0x5ad066 ? 'disabled' : '') +
    '>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<strong\x20data-story-clip-adjustment-mode-label>' +
    escapeHtml(getStoryPromptModeLabel(_0x26cb23)) +
    '</strong>\n      </button>\n      <div class="story-clip-adjustment-mode-menu" role="listbox" aria-label="提示词模式" ' +
    (_0x4cdd70?.['clipAdjustmentPromptModeOpen'] === !![] ? '' : 'hidden') +
    '>\n        ' +
    STORY_PROMPT_MODE_OPTIONS['map'](
      (_0x1b549a) =>
        '<button type="button" class="' +
        (_0x1b549a['value'] === _0x26cb23 ? 'is-selected' : '') +
        '" data-story-action="select-clip-adjustment-mode" data-story-clip-adjustment-mode-option="' +
        escapeHtml(_0x1b549a['value']) +
        '" role="option" aria-selected="' +
        (_0x1b549a['value'] === _0x26cb23) +
        '\x22>' +
        escapeHtml(_0x1b549a['label']) +
        '</button>',
    )['join']('') +
    '\n      </div>\n    </div>\n    <div class="story-clip-adjustment-mode" data-story-clip-adjustment-mode data-story-adjustment-kind="language">\n      <button type="button" class="story-clip-adjustment-mode-trigger" data-story-action="toggle-clip-adjustment-mode" aria-label="语言转换" aria-haspopup="listbox" aria-expanded="' +
    (_0x4cdd70?.['clipAdjustmentLanguageOpen'] === !![]) +
    '\x22\x20' +
    (_0x5ad066 ? 'disabled' : '') +
    '>\n        <strong data-story-clip-adjustment-mode-label>' +
    escapeHtml(
      STORY_PROMPT_LANGUAGES['find'](
        (_0x3a6ba7) => _0x3a6ba7['value'] === _0x4cdd70?.['clipAdjustmentLanguage'],
      )?.['label'] || '语言转换',
    ) +
    '</strong>\x0a\x20\x20\x20\x20\x20\x20</button>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-clip-adjustment-mode-menu\x22\x20role=\x22listbox\x22\x20aria-label=\x22语言转换\x22\x20' +
    (_0x4cdd70?.['clipAdjustmentLanguageOpen'] ? '' : 'hidden') +
    '>\n        ' +
    [{ value: '', label: '保持当前语言' }, ...STORY_PROMPT_LANGUAGES]
      ['map'](
        (_0x68f2ad) =>
          '<button type="button" class="' +
          (_0x68f2ad['value'] === (_0x4cdd70?.['clipAdjustmentLanguage'] || '') ? 'is-selected' : '') +
          '" data-story-action="select-clip-adjustment-mode" data-story-clip-adjustment-mode-option="' +
          _0x68f2ad['value'] +
          '" role="option" aria-selected="' +
          (_0x68f2ad['value'] === (_0x4cdd70?.['clipAdjustmentLanguage'] || '')) +
          '\x22>' +
          _0x68f2ad['label'] +
          '</button>',
      )
      ['join']('') +
    '\n      </div>\n    </div></div>\n    <div class="story-clip-adjustment-compose">\n      <input type="text" data-story-clip-adjustment-instruction maxlength="600" value="' +
    escapeHtml(_0x4cdd70?.['clipAdjustmentInstruction'] || '') +
    '" placeholder="可选：补充这一段还要怎么调整" aria-label="AI 调整说明" ' +
    (_0x5ad066 ? 'disabled' : '') +
    '>\n      <button type="button" class="story-workbench-action-button" data-story-action="generate-clip-adjustment" ' +
    (_0x5ad066 || !_0x2b23ad ? 'disabled' : '') +
    '\x20aria-busy=\x22' +
    _0x5ad066 +
    '\x22>' +
    (_0x5ad066 ? renderStoryGenerationSpinner({ button: !![] }) : '') +
    (_0x5ad066 ? '生成中' : '生成') +
    '</button>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20</div>'
  );
}
function shouldCloseAdjustmentOnOutsideClick(_0x5f3327, _0x5ac880) {
  return (
    _0x5f3327?.['clipAdjustmentOpen'] === !![] && !_0x5ac880?.['closest']?.('.story-clip-adjustment-control')
  );
}
function shouldClosePromptHistoryOnOutsideClick(_0x323952, _0xdae028) {
  return (
    _0x323952?.['clipPromptHistoryOpen'] === !![] &&
    !_0xdae028?.['closest']?.('[data-story-clip-prompt-history]')
  );
}
function renderPromptHistoryControl(_0x4f1a01, _0x320dc3) {
  const _0xf5dfa2 = normalizeStoryClipPromptHistory(_0x320dc3?.['promptHistory']);
  if (!_0xf5dfa2['length']) return '';
  const _0x5bc8fb = _0x4f1a01?.['clipPromptHistoryOpen'] === !![];
  return (
    '<div class="story-clip-prompt-history" data-story-clip-prompt-history>\n    <button type="button" class="story-clip-prompt-history-trigger" data-story-action="toggle-clip-prompt-history" aria-label="提示词历史" aria-haspopup="dialog" aria-expanded="' +
    _0x5bc8fb +
    '">\n      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3.8 12a8.2 8.2 0 1 0 2.4-5.8L4 8.4M4 4.8v3.6h3.6M12 7.8v4.7l3.1 1.8"/></svg>\n    </button>\n    <section class="story-clip-prompt-history-panel" data-story-clip-prompt-history-panel role="dialog" aria-label="提示词历史" ' +
    (_0x5bc8fb ? '' : 'hidden') +
    '>\n      <header><strong>提示词历史</strong><span>最近 ' +
    _0xf5dfa2['length'] +
    ' 个已确认版本</span></header>\n      <div class="story-clip-prompt-history-list">\n        ' +
    _0xf5dfa2['map']((_0x5daed6) => {
      const _0x93c63f =
          _0x5daed6['durationSec'] > 0x0 ? _0x5daed6['durationSec']['toFixed'](0x1) + 's' : '时长未记录',
        _0x370d9e = getPromptHistoryPreview(_0x5daed6['promptHtml']) || '空提示词';
      return (
        '<button type="button" class="story-clip-prompt-history-item" data-story-action="restore-clip-prompt-history" data-story-clip-prompt-history-id="' +
        escapeHtml(_0x5daed6['id']) +
        '" aria-label="恢复 ' +
        escapeHtml(getStoryPromptModeLabel(_0x5daed6['promptMode'])) +
        ' 历史提示词">\n            <span class="story-clip-prompt-history-item-meta"><strong>' +
        escapeHtml(getStoryPromptModeLabel(_0x5daed6['promptMode'])) +
        '\x20·\x20' +
        _0x93c63f +
        '</strong><small>' +
        escapeHtml(formatPromptHistorySavedAt(_0x5daed6['savedAt'])) +
        '</small></span>\n            <span class="story-clip-prompt-history-item-preview">' +
        escapeHtml(_0x370d9e) +
        '</span>\n            <span class="story-clip-prompt-history-item-action">恢复</span>\n          </button>'
      );
    })['join']('') +
    '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</section>\x0a\x20\x20</div>'
  );
}
function renderAdjustmentControl(_0xf67464, _0x2172ef, _0x11cdb2 = null) {
  if (_0x2172ef?.['promptAdjustment']?.['candidate']) return '';
  const _0x1a134f = isStoryClipAdjustmentGenerating(_0xf67464, _0x11cdb2, _0x2172ef),
    _0x354eb5 =
      '<div class="story-clip-adjustment-header">\n    ' +
      renderPromptHistoryControl(_0xf67464, _0x2172ef) +
      '\x0a\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-clip-adjustment-trigger\x22\x20data-story-action=\x22toggle-clip-adjustment\x22\x20aria-expanded=\x22' +
      (_0xf67464?.['clipAdjustmentOpen'] === !![]) +
      '\x22\x20' +
      (_0x1a134f ? 'disabled' : '') +
      '><span\x20aria-hidden=\x22true\x22>✦</span>AI\x20调整</button>\x0a\x20\x20</div>';
  return (
    '<div class="story-clip-adjustment-control">\n    ' +
    _0x354eb5 +
    '\n    ' +
    renderAdjustmentBar(_0xf67464, _0x2172ef, _0x11cdb2) +
    '\x0a\x20\x20</div>'
  );
}
function renderPromptComparison(_0x41b6bd) {
  const _0xb98d09 = _0x41b6bd?.['promptAdjustment']?.['candidate'];
  if (!_0xb98d09) return '';
  const _0x16cf50 = normalizeDurationSeconds(
      _0xb98d09['sourceDurationSeconds'] || _0x41b6bd?.['durationSec'] || _0x41b6bd?.['duration'],
    ),
    _0x2e0738 = normalizeDurationSeconds(_0xb98d09['candidateDurationSeconds'] || _0x16cf50),
    _0x415d97 = normalizeStoryPromptMode(_0xb98d09['sourcePromptMode'] || _0x41b6bd?.['promptMode'], {
      allowDeveloperModes: !![],
    }),
    _0x32b90b = normalizeStoryPromptMode(_0xb98d09['targetPromptMode'] || _0x415d97, {
      allowDeveloperModes: !![],
    }),
    _0x4ac920 = (_0x216ab8) => (_0x216ab8 > 0x0 ? _0x216ab8['toFixed'](0x1) + 's' : '--');
  return (
    '<div\x20class=\x22story-clip-prompt-comparison\x22\x20data-story-clip-prompt-comparison>\x0a\x20\x20\x20\x20<header>\x0a\x20\x20\x20\x20\x20\x20<span>AI\x20调整完成</span>\x0a\x20\x20\x20\x20\x20\x20<strong>选择这个片段要使用的提示词版本</strong>\x0a\x20\x20\x20\x20</header>\x0a\x20\x20\x20\x20<div\x20class=\x22story-clip-prompt-comparison-grid\x22>\x0a\x20\x20\x20\x20\x20\x20<article>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-clip-prompt-version-title\x22><strong>原版本\x20·\x20' +
    escapeHtml(getStoryPromptModeLabel(_0x415d97)) +
    '</strong><span>总时长 ' +
    _0x4ac920(_0x16cf50) +
    '</span></div>\n        <div class="story-clip-prompt-version-content">' +
    sanitizePromptHtmlForCommit(_0xb98d09['sourcePromptHtml']) +
    '</div>\n        <button type="button" data-story-action="keep-current-clip-prompt">保留原版本</button>\n      </article>\n      <article class="is-ai-version">\n        <div class="story-clip-prompt-version-title"><strong>AI 调整后 · ' +
    escapeHtml(getStoryPromptModeLabel(_0x32b90b)) +
    '</strong><span>总时长 ' +
    _0x4ac920(_0x2e0738) +
    '</span></div>\n        <div class="story-clip-prompt-version-content">' +
    sanitizePromptHtmlForCommit(_0xb98d09['promptHtml']) +
    '</div>\n        <div class="story-clip-prompt-version-actions">\n          <button type="button" class="story-regenerate-button" data-story-action="regenerate-clip-adjustment">重新生成</button>\n          <button type="button" class="story-workbench-action-button" data-story-action="use-ai-clip-prompt">使用 AI 版本</button>\n        </div>\n      </article>\n    </div>\n  </div>'
  );
}
function renderPromptSurface(_0x2c4078, _0x1998b3, _0x154652) {
  try {
    const _0x55515c = getClipInputSurface(_0x2c4078, _0x1998b3, _0x154652),
      _0x5b625f = resolveStoryClipVideoGenerationParams(
        _0x154652,
        _0x2c4078['models']['video'],
        _0x2c4078['videoGenerationParams'],
      ),
      _0x2fce90 = {
        ...(_0x2c4078['videoGenerationParamsByModel'] || {}),
        [_0x2c4078['models']['video']]: { ..._0x5b625f },
      },
      _0x58df2c = normalizeStoryPromptMode(
        _0x154652?.['promptMode'] ||
          _0x1998b3?.['promptMode'] ||
          _0x2c4078?.['data']?.['project']?.['planning']?.['promptMode'],
        { allowDeveloperModes: !![] },
      ),
      _0x2619df = isStoryMinimaxH3PromptMode(_0x58df2c)
        ? normalizeStoryMinimaxH3OfficialTags(_0x154652?.['prompt'] || '')
        : _0x154652?.['prompt'] || '',
      _0x3c5920 = renderStoryClipPromptMentions(_0x2619df, {
        assets: Array['isArray'](_0x2c4078?.['data']?.['assets']) ? _0x2c4078['data']['assets'] : [],
        episode: _0x1998b3,
        clipFrames: Array['isArray'](_0x2c4078?.['data']?.['clipFrames'])
          ? _0x2c4078['data']['clipFrames']
          : [],
      }),
      _0x299e3b = isStoryClipAdjustmentGenerating(_0x2c4078, _0x1998b3, _0x154652),
      _0x20982a = Boolean(_0x154652?.['promptAdjustment']?.['candidate']);
    return (
      '<div class="story-video-node-prompt text-prompt-panel" data-story-clip-prompt-surface>\n      ' +
      renderStoryClipQualityNotes(_0x1998b3, _0x154652, escapeHtml) +
      '\n      <div class="story-clip-prompt-toolbar">\n        ' +
      renderVideoReferenceBarMarkup({ ..._0x55515c, attachmentButtonHtml: '' }) +
      '\n        ' +
      renderAdjustmentControl(_0x2c4078, _0x154652, _0x1998b3) +
      '\n      </div>\n      ' +
      (_0x299e3b
        ? '<div class="story-clip-prompt-adjustment-loading" role="status" aria-live="polite" aria-busy="true">\n            ' +
          renderGenerationSpinner() +
          '\n            <strong>正在调整当前片段提示词</strong>\n            <span>其他片段不受影响</span>\n          </div>'
        : _0x20982a
          ? renderPromptComparison(_0x154652)
          : renderVideoPromptEditorMarkup({
              promptHtml: _0x3c5920,
              placeholder: t('aigenVideoNode.prompt.placeholder'),
              attributes: 'data-story-clip-prompt',
            })) +
      '\n      <div class="story-clip-model-bar prompt-panel-footer">\n        ' +
      renderAIGenVideoModelSelectorMarkup({
        modelId: _0x2c4078['models']['video'],
        provider: _0x2c4078['videoProvider'],
        generationParams: _0x5b625f,
        generationParamsByModel: _0x2fce90,
        providerProfileId: _0x2c4078['videoProviderProfileId'],
        providerProfileIdByModel: _0x2c4078['videoProviderProfileIdByModel'],
        referenceCounts: getInputReferenceCounts(_0x154652),
        showSchemaControls: !![],
        className: 'story-clip-video-model-selector',
        runningHubWorkflowAllowedModelIds: STORY_WORKSPACE_RUNNINGHUB_WORKFLOW_MODEL_IDS,
      }) +
      '\n        <span class="story-clip-provider-profile-control" data-story-video-provider-profile></span>\n        <div class="story-clip-generation-actions">\n          ' +
      renderSelectionControls(_0x2c4078, _0x1998b3, _0x154652) +
      '\n        </div>\n      </div>\n    </div>'
    );
  } catch (_0x3655ed) {
    return (
      '<div\x20class=\x22story-inline-error\x22>' +
      escapeHtml(_0x3655ed?.['message'] || '当前模型输入槽不可用') +
      '</div>'
    );
  }
}
function renderVideoResultSwitchButton(_0x5cddad, _0x4ba09c) {
  const _0x571ba2 = _0x5cddad === 'previous',
    _0x4261ab = _0x571ba2 ? 'previous-video-result' : 'next-video-result',
    _0x1be958 = _0x571ba2 ? '切换到上一个历史视频' : '切换到下一个历史视频',
    _0x4fd2ae = _0x571ba2 ? 'story-video-result-switch--previous' : 'story-video-result-switch--next',
    _0x324ad4 = _0x571ba2 ? 'm6.5 14.5 5.5-5.5 5.5 5.5' : 'm6.5 9.5 5.5 5.5 5.5-5.5';
  return (
    '<button type="button" class="story-appearance-arrow story-video-result-switch ' +
    _0x4fd2ae +
    '" data-story-action="' +
    _0x4261ab +
    '" data-story-clip-id="' +
    escapeHtml(_0x4ba09c?.['id']) +
    '\x22\x20aria-label=\x22' +
    _0x1be958 +
    '"><svg class="story-appearance-arrow-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="' +
    _0x324ad4 +
    '"/></svg></button>'
  );
}
function renderVideoPlaybackControls(_0x25635d, _0x135d4d) {
  const _0x3034db = escapeHtml(_0x25635d?.['id']);
  return renderWorkspaceVideoPlaybackControls({
    label: '视频',
    playLabel: '播放视频',
    playTitle: '播放视频',
    controlsAttributes: { 'data-story-video-controls': !![] },
    playAttributes: { 'data-story-video-play': !![] },
    currentTimeAttributes: { 'data-story-video-time-current': !![] },
    progressAttributes: { 'data-story-video-progress': !![] },
    progressFillAttributes: { 'data-story-video-progress-fill': !![] },
    totalTimeAttributes: { 'data-story-video-time-total': !![] },
    volumeAttributes: { 'data-story-video-volume': !![] },
    volumeToggleAttributes: { 'data-story-video-volume-toggle': !![] },
    slots: {
      beforeVolume:
        '<button type="button" class="video-snap-btn story-video-snap-btn" data-story-action="capture-video-frame" data-story-clip-id="' +
        _0x3034db +
        '\x22\x20data-story-video-result-index=\x22' +
        _0x135d4d +
        '" aria-label="获取当前帧" title="获取当前帧">\n        ' +
        renderStoryKeyframeIcon() +
        '\n      </button>\n      <button type="button" class="video-snap-btn story-video-snap-btn story-video-clip-btn" data-story-action="trim-video" data-story-clip-id="' +
        _0x3034db +
        '" data-story-video-result-index="' +
        _0x135d4d +
        '" aria-label="裁剪视频" title="裁剪视频">\n        ' +
        VIDEO_CLIP_ICON_SVG +
        '\x0a\x20\x20\x20\x20\x20\x20</button>',
    },
  });
}
function renderVideoPreview(_0x205c55, { isGenerating: isGenerating = ![] } = {}) {
  const _0x22315f = getVideoResults(_0x205c55),
    _0x13b945 = getActiveVideoResultIndex(_0x205c55, _0x22315f),
    _0x5cbae7 = _0x22315f[_0x13b945] || {},
    _0x2cb885 = resolveVideoResultUrl(_0x5cbae7),
    _0x21e216 = normalizeText(_0x205c55?.['generation']?.['status'])['toLowerCase'](),
    _0xdb5b30 =
      isGenerating || ['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](_0x21e216);
  if (_0xdb5b30)
    return (
      '<div class="story-video-empty story-video-loading" role="status" aria-live="polite" aria-busy="true">\n      ' +
      renderGenerationSpinner() +
      '\x0a\x20\x20\x20\x20\x20\x20<strong>视频生成中</strong>\x0a\x20\x20\x20\x20\x20\x20<p>正在等待生成结果，完成后会自动显示。</p>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22storyboard-script-loading-bar\x22\x20aria-hidden=\x22true\x22><div\x20class=\x22storyboard-script-loading-bar-fill\x22></div></div>\x0a\x20\x20\x20\x20</div>'
    );
  if (_0x2cb885) {
    const _0xce6081 = _0x22315f['length'] > 0x1;
    return (
      '<div class="story-video-result" data-story-video-result-index="' +
      _0x13b945 +
      '">\n      <div class="story-video-stage">\n        ' +
      (_0xce6081 ? renderVideoResultSwitchButton('previous', _0x205c55) : '') +
      '\n        <video data-story-video-player data-story-video-url="' +
      escapeHtml(_0x2cb885) +
      '" playsinline preload="auto"></video>\n        ' +
      (_0xce6081 ? renderVideoResultSwitchButton('next', _0x205c55) : '') +
      '\n        ' +
      renderVideoPlaybackControls(_0x205c55, _0x13b945) +
      '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20\x20\x20<div\x20class=\x22story-video-result-meta\x22><strong>视频结果</strong><span>' +
      (_0x13b945 + 0x1) +
      '/' +
      _0x22315f['length'] +
      '</span></div>\n    </div>'
    );
  }
  const _0x58a6a5 = _0x205c55?.['generation']?.['error'] || '',
    _0x196d1b = _0x58a6a5 ? 'story-video-empty story-video-error' : 'story-video-empty';
  return (
    '<div class="' +
    _0x196d1b +
    '">\n    <strong>视频结果</strong>\n    <p>' +
    escapeHtml(_0x58a6a5 || '生成完成后将在这里预览本片段视频。') +
    '</p>\n  </div>'
  );
}
function renderTimeline(
  _0x5e1389,
  _0x4dd088,
  {
    selectionMode: selectionMode = ![],
    selectedClipIds: selectedClipIds = [],
    pendingDeleteClipId: pendingDeleteClipId = '',
    generatingClipIds: generatingClipIds = [],
    adjustingClipIds: adjustingClipIds = [],
    modelId: modelId = '',
    generationParams: generationParams = {},
  } = {},
) {
  const _0x33837a = Array['isArray'](_0x5e1389?.['clips']) ? _0x5e1389['clips'] : [],
    _0x35393e = new Set(
      (Array['isArray'](selectedClipIds) ? selectedClipIds : [])['map']((_0x2c2c2e) =>
        normalizeText(_0x2c2c2e),
      ),
    ),
    _0x3aa761 = new Set(
      (Array['isArray'](generatingClipIds) ? generatingClipIds : [])
        ['map']((_0x5c2cba) => normalizeText(_0x5c2cba))
        ['filter'](Boolean),
    );
  return (
    '<div\x20class=\x22story-clip-timeline\x20' +
    (selectionMode ? 'is-selection-mode' : '') +
    '">\n    <div class="story-clip-timeline-header">\n      <span>' +
    escapeHtml(_0x5e1389?.['duration'] || '--:--') +
    '</span>\n      <small>' +
    (selectionMode ? '点击片段选择需要生成的视频' : '点击片段切换提示词和视频结果') +
    '</small>\x0a\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20<div\x20class=\x22story-clip-strip\x22\x20data-story-marquee-surface=\x22clips\x22>\x0a\x20\x20\x20\x20\x20\x20' +
    _0x33837a['map']((_0x203895, _0x4fb7e4) => {
      const _0xc1b4e9 = normalizeText(_0x203895['id']),
        _0x1b2ff9 = adjustingClipIds['includes'](_0xc1b4e9),
        _0x363113 = getVideoResults(_0x203895),
        _0x30393e = renderTimelineVideoThumbnail(_0x203895),
        _0x11b7fa = normalizeText(_0x203895?.['generation']?.['status'])['toLowerCase'](),
        _0x44b762 =
          _0x3aa761['has'](_0xc1b4e9) ||
          ['pending', 'queued', 'recovering', 'running', 'submitting']['includes'](_0x11b7fa),
        _0x75b10e = _0x35393e['has'](_0xc1b4e9),
        _0x476f23 = !_0x44b762 && normalizeText(pendingDeleteClipId) === _0xc1b4e9,
        _0xa58a6c =
          '<div\x20class=\x22story-clip-card-shell' +
          (_0x44b762 ? ' is-generating' : '') +
          (_0x476f23 ? ' is-delete-confirming' : '') +
          '\x22\x20data-story-video-history=\x22' +
          (_0x363113['length'] > 0x1) +
          '" data-story-clip-id="' +
          escapeHtml(_0x203895['id']) +
          '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<button\x20type=\x22button\x22\x20class=\x22story-clip-card\x20' +
          (_0x203895['id'] === _0x4dd088 ? 'is-selected' : '') +
          '\x20' +
          (selectionMode ? 'is-selection-mode' : '') +
          '\x20' +
          (_0x75b10e ? 'is-checked' : '') +
          (_0x30393e ? '\x20has-video-thumbnail' : '') +
          '" data-story-clip-id="' +
          escapeHtml(_0x203895['id']) +
          '\x22\x20data-story-marquee-item\x20data-story-marquee-id=\x22' +
          escapeHtml(_0x203895['id']) +
          '" aria-pressed="' +
          (selectionMode ? String(_0x75b10e) : 'false') +
          '\x22\x20aria-busy=\x22' +
          _0x44b762 +
          '">\n            ' +
          (_0x30393e
            ? '<span class="story-clip-card-media" aria-hidden="true">' + _0x30393e + '</span>'
            : '') +
          '\n            <span class="story-clip-card-copy"><strong>片段' +
          escapeHtml(String(_0x203895['number'] || _0x4fb7e4 + 0x1)['padStart'](0x2, '0')) +
          '</strong><small\x20data-story-clip-duration=\x22' +
          escapeHtml(_0x203895['id']) +
          '\x22>' +
          escapeHtml(formatStoryClipVideoGenerationDuration(_0x203895, modelId, generationParams)) +
          '</small></span>\n          </button>\n          ' +
          (_0x1b2ff9 && !_0x44b762
            ? '<span class="story-clip-card-adjusting generation-loading-surface" role="status" aria-busy="true" aria-label="正在调整提示词"><span class="generation-loading-shimmer" aria-hidden="true"></span><span class="generation-loading-label">正在调整提示词</span></span>'
            : '') +
          '\n          ' +
          (_0x44b762
            ? '<span\x20class=\x22story-clip-card-loading\x20generation-loading-surface\x22\x20role=\x22status\x22\x20aria-busy=\x22true\x22\x20aria-label=\x22片段\x20' +
              escapeHtml(_0x203895['number']) +
              ' 视频生成中">' +
              renderGenerationSpinner() +
              '</span>'
            : selectionMode || _0x1b2ff9
              ? ''
              : renderWorkspaceCardDeleteControl({
                  className: 'story-clip-delete-trigger',
                  ariaLabel: '删除片段 ' + _0x203895['number'] + '：' + (_0x203895['title'] || '未命名片段'),
                  actionAttributes: {
                    'data-story-action': 'request-delete-clip',
                    'data-story-clip-delete-id': _0x203895['id'],
                    hidden: _0x476f23,
                  },
                }) +
                '\n          <div class="story-project-delete-confirm story-clip-delete-confirm" ' +
                (_0x476f23 ? '' : 'hidden') +
                ' aria-label="确认删除片段 ' +
                escapeHtml(_0x203895['number']) +
                '">\n            <button type="button" class="confirm-btn confirm-cancel" data-story-action="cancel-delete-clip" data-story-clip-delete-id="' +
                escapeHtml(_0x203895['id']) +
                '">取消</button>\n            <button type="button" class="confirm-btn confirm-ok" data-story-action="confirm-delete-clip" data-story-clip-delete-id="' +
                escapeHtml(_0x203895['id']) +
                '">删除</button>\n          </div>') +
          '\n        </div>';
      if (_0x4fb7e4 >= _0x33837a['length'] - 0x1) return _0xa58a6c;
      const _0x9b36a9 = _0x33837a[_0x4fb7e4 + 0x1];
      return (
        _0xa58a6c +
        '<button type="button" class="story-clip-insert-button" data-story-insert-after-clip-id="' +
        escapeHtml(_0x203895['id']) +
        '" aria-label="在片段 ' +
        escapeHtml(_0x203895['number']) +
        ' 和片段 ' +
        escapeHtml(_0x9b36a9?.['number']) +
        ' 之间新增片段"><span aria-hidden="true">+</span></button>'
      );
    })['join']('') +
    '\n    </div>\n  </div>'
  );
}
function renderEpisode(_0x470fb9 = {}, _0x1c1ff5 = null, _0x3284cd = null) {
  const _0x144dfb = _0x1c1ff5 || getSelectedEpisode(_0x470fb9),
    _0x2eb013 = _0x3284cd || getSelectedClip(_0x470fb9, _0x144dfb),
    _0x5432a8 = Array['isArray'](_0x470fb9?.['data']?.['assets']) ? _0x470fb9['data']['assets'] : [],
    _0x3a6eb4 = Array['isArray'](_0x470fb9?.['data']?.['clipFrames']) ? _0x470fb9['data']['clipFrames'] : [],
    _0x22ebb4 = resolveStoryVideoReplicationClipVoiceAssetIds(_0x470fb9?.['data'], _0x2eb013);
  return {
    get referenceCounts() {
      return getUsedReferenceCounts(_0x2eb013, {
        assets: _0x5432a8,
        episode: _0x144dfb,
        clipFrames: _0x3a6eb4,
        voiceAssetIds: _0x22ebb4,
      });
    },
    get referenceSummary() {
      return renderReferenceSummary(_0x2eb013, {
        assets: _0x5432a8,
        episode: _0x144dfb,
        clipFrames: _0x3a6eb4,
        voiceAssetIds: _0x22ebb4,
      });
    },
    get referenceBar() {
      return renderVideoReferenceBarMarkup({
        ...getClipInputSurface(_0x470fb9, _0x144dfb, _0x2eb013),
        attachmentButtonHtml: '',
      });
    },
    get selectionControls() {
      return renderSelectionControls(_0x470fb9, _0x144dfb, _0x2eb013);
    },
    get adjustmentBar() {
      return renderAdjustmentBar(_0x470fb9, _0x2eb013, _0x144dfb);
    },
    get adjustmentControl() {
      return renderAdjustmentControl(_0x470fb9, _0x2eb013, _0x144dfb);
    },
    get promptSurface() {
      return renderPromptSurface(_0x470fb9, _0x144dfb, _0x2eb013);
    },
    get videoPreview() {
      const _0x24404d = getGenerationState(_0x470fb9, _0x144dfb);
      return renderVideoPreview(_0x2eb013, {
        isGenerating: _0x24404d['generatingClipIds']['includes'](normalizeText(_0x2eb013?.['id'])),
      });
    },
    get videoResults() {
      return getVideoResults(_0x2eb013);
    },
    get activeVideoResultIndex() {
      return getActiveVideoResultIndex(_0x2eb013);
    },
    get videoHistoryMenu() {
      return renderVideoHistoryMenu(_0x2eb013);
    },
    getAdjacentVideoResultIndex(_0x5c24c0) {
      return getAdjacentVideoResultIndex(_0x2eb013, _0x5c24c0);
    },
    get timeline() {
      const _0x37ea3c = getGenerationState(_0x470fb9, _0x144dfb);
      return renderTimeline(_0x144dfb, _0x2eb013?.['id'], {
        selectionMode: _0x470fb9?.['clipSelectionMode'],
        selectedClipIds: _0x470fb9?.['selectedClipGenerationIds'],
        pendingDeleteClipId: _0x470fb9?.['pendingDeleteClipId'],
        generatingClipIds: _0x37ea3c['generatingClipIds'],
        adjustingClipIds: (_0x144dfb?.['clips'] || [])
          ['filter']((_0x399682) => isStoryClipAdjustmentGenerating(_0x470fb9, _0x144dfb, _0x399682))
          ['map']((_0x23c8b1) => _0x23c8b1['id']),
        modelId: _0x470fb9?.['models']?.['video'],
        generationParams: _0x470fb9?.['videoGenerationParams'],
      });
    },
  };
}
function createRuntime({
  state: _0x3acf1b,
  projectAdapter: projectAdapter = {},
  generationAdapter: generationAdapter = {},
  projectionAdapter: projectionAdapter = {},
} = {}) {
  if (!_0x3acf1b || typeof _0x3acf1b !== 'object') throw new Error('[storyClipProduction] state is required');
  if (typeof projectAdapter['createToken'] !== 'function')
    throw new Error('[storyClipProduction] projectAdapter.createToken is required');
  if (typeof generationAdapter['createController'] !== 'function')
    throw new Error('[storyClipProduction] generationAdapter.createController is required');
  const _0x5b8ca9 =
      generationAdapter['controllers'] instanceof Map ? generationAdapter['controllers'] : new Map(),
    _0x2edb7a = new Map(),
    _0x117d0e = (_0x309f91) => projectAdapter['isLive']?.(_0x309f91) !== ![],
    _0x1e6038 = (_0x32161b) => projectAdapter['isCurrent']?.(_0x32161b) !== ![],
    _0x25fd9b = (_0x24f2e4, _0x36481f, _0x52a02b) =>
      [_0x24f2e4?.['projectId'], _0x36481f?.['id'], _0x52a02b?.['id']]['map'](normalizeText)['join'](':'),
    _0x57be89 = (_0x49ea3e, _0x5222a2) =>
      [_0x49ea3e?.['projectId'], _0x5222a2?.['id']]['map'](normalizeText)['join'](':'),
    _0x4649d3 = () => {
      if (projectionAdapter['refreshGeneration']?.() === !![]) return !![];
      return (projectionAdapter['render']?.(), ![]);
    };
  function _0x1aedd6({ episode: _0x2f98cb, clip: _0x2963e7, projectToken: _0x1ac192 }) {
    return {
      ok: ![],
      cancelled: !![],
      reason: 'batch-cancelled',
      projectToken: _0x1ac192,
      episodeId: _0x2f98cb?.['id'] || '',
      clipId: _0x2963e7?.['id'] || '',
    };
  }
  function _0x50f8bf({
    episode: _0x1dd41c,
    clip: _0x495265,
    displayedClip: _0x479eff,
    projectToken: _0x4ddee8,
  }) {
    const _0xbcb426 =
        generationAdapter['resolvePrompt']?.({
          state: _0x3acf1b,
          episode: _0x1dd41c,
          clip: _0x495265,
          displayedClip: _0x479eff,
          projectToken: _0x4ddee8,
        }) || {},
      _0x3c6d63 =
        generationAdapter['resolveSettings']?.({
          state: _0x3acf1b,
          episode: _0x1dd41c,
          clip: _0x495265,
          projectToken: _0x4ddee8,
        }) || {};
    return {
      projectId: _0x4ddee8['projectId'],
      episodeId: _0x1dd41c['id'],
      modelId: _0x3c6d63['modelId'],
      provider: _0x3c6d63['provider'],
      providerProfileId: _0x3c6d63['providerProfileId'],
      prompt: _0xbcb426['prompt'],
      generationParams: _0x3c6d63['generationParams'],
      inputs: _0x495265['inputs'],
      assetInputRefs: _0xbcb426['assetInputRefs'],
    };
  }
  function _0x3a1236() {
    const _0x260a76 = getSelectedEpisode(_0x3acf1b),
      _0x46c17c = getSelectedClip(_0x3acf1b, _0x260a76),
      _0x5838b0 = _0x3acf1b['clipSelectionMode']
        ? selectBatchTargets(_0x260a76?.['clips'], _0x3acf1b['selectedClipGenerationIds'])
        : [_0x46c17c];
    if (!_0x260a76 || !_0x5838b0[0x0]) throw new Error('请先选择片段');
    const _0x569177 = _0x50f8bf({
      episode: _0x260a76,
      clip: _0x5838b0[0x0],
      displayedClip: _0x46c17c,
      projectToken: projectAdapter['createToken'](),
    });
    return buildStoryClipVideoPayload(_0x569177);
  }
  async function _0x269835({
    episode: _0x2f28d6,
    clip: _0x4cb371,
    displayedClip: _0x58ff08,
    projectToken: _0x18ab6f,
    batch: batch = null,
    batchRun: batchRun = null,
  }) {
    if (batchRun?.['cancelRequested'])
      return _0x1aedd6({ episode: _0x2f28d6, clip: _0x4cb371, projectToken: _0x18ab6f });
    const _0x43ec4b = _0x25fd9b(_0x18ab6f, _0x2f28d6, _0x4cb371);
    if (
      !_0x2f28d6 ||
      !_0x4cb371 ||
      getGenerationState(_0x3acf1b, _0x2f28d6)['generatingClipIds']['includes'](
        normalizeText(_0x4cb371['id']),
      ) ||
      getRecoverableStoryClipVideoTask(_0x4cb371) ||
      _0x5b8ca9['has'](_0x43ec4b)
    )
      return { ok: ![], reason: 'unavailable' };
    let _0x29e81e = null,
      _0x1a4f5e = '',
      _0x59a494 = '';
    try {
      const _0x236eaf = _0x50f8bf({
        episode: _0x2f28d6,
        clip: _0x4cb371,
        displayedClip: _0x58ff08,
        projectToken: _0x18ab6f,
      });
      if (!normalizeText(_0x236eaf['prompt'])) return { ok: ![], reason: 'empty-prompt' };
      const _0x387578 = _0x236eaf;
      ((_0x1a4f5e = normalizeText(_0x387578['modelId'])), (_0x59a494 = normalizeText(_0x387578['provider'])));
      const _0x108d46 = normalizeText(
        await generationAdapter['resolveInstallId']?.({
          state: _0x3acf1b,
          episode: _0x2f28d6,
          clip: _0x4cb371,
          projectToken: _0x18ab6f,
          modelId: _0x1a4f5e,
          provider: _0x59a494,
        }),
      );
      if (batchRun?.['cancelRequested'])
        return _0x1aedd6({ episode: _0x2f28d6, clip: _0x4cb371, projectToken: _0x18ab6f });
      _0x29e81e = generationAdapter['createController']({
        state: _0x3acf1b,
        episode: _0x2f28d6,
        clip: _0x4cb371,
        projectToken: _0x18ab6f,
        batch: batch,
      });
      if (!_0x29e81e || typeof _0x29e81e['generate'] !== 'function')
        throw new Error('story clip generation controller is unavailable');
      (_0x5b8ca9['set'](_0x43ec4b, _0x29e81e), batchRun?.['controllers']['add'](_0x29e81e));
      if (batchRun?.['cancelRequested'])
        return _0x1aedd6({ episode: _0x2f28d6, clip: _0x4cb371, projectToken: _0x18ab6f });
      projectAdapter['register']?.(_0x18ab6f);
      _0x1e6038(_0x18ab6f) && (setClipGenerationRunning(_0x3acf1b, _0x4cb371['id'], !![]), _0x4649d3());
      const _0x483c88 = await _0x29e81e['generate']({ ..._0x236eaf, installId: _0x108d46 });
      if (!_0x117d0e(_0x18ab6f))
        return { ok: ![], reason: 'stale-project', modelId: _0x1a4f5e, provider: _0x59a494 };
      const _0x1ebbfc = normalizeText(_0x483c88?.['status'])['toLowerCase']();
      if (
        batchRun?.['cancelRequested'] &&
        (_0x483c88?.['ok'] === ![] || ['cancelled', 'canceled', 'paused']['includes'](_0x1ebbfc))
      )
        return _0x1aedd6({ episode: _0x2f28d6, clip: _0x4cb371, projectToken: _0x18ab6f });
      if (_0x483c88?.['ok'] === ![] || ['cancelled', 'canceled', 'error', 'failed']['includes'](_0x1ebbfc)) {
        const _0x45e3af = _0x483c88?.['error'],
          _0x103080 =
            _0x45e3af instanceof Error
              ? _0x45e3af
              : new Error(normalizeText(_0x45e3af?.['message'] || _0x45e3af) || '片段视频生成失败');
        return {
          ok: ![],
          type: 'single-failed',
          error: _0x103080,
          projectToken: _0x18ab6f,
          episodeId: _0x2f28d6['id'],
          clipId: _0x4cb371['id'],
          modelId: _0x1a4f5e,
          provider: _0x59a494,
        };
      }
      return (
        await projectionAdapter['persist']?.({ immediate: !![] }),
        {
          ok: !![],
          type: 'single-complete',
          result: _0x483c88,
          projectToken: _0x18ab6f,
          episodeId: _0x2f28d6['id'],
          clipId: _0x4cb371['id'],
          modelId: _0x1a4f5e,
          provider: _0x59a494,
        }
      );
    } catch (_0x51eb59) {
      if (!_0x117d0e(_0x18ab6f))
        return { ok: ![], reason: 'stale-project', modelId: _0x1a4f5e, provider: _0x59a494 };
      if (batchRun?.['cancelRequested'])
        return _0x1aedd6({ episode: _0x2f28d6, clip: _0x4cb371, projectToken: _0x18ab6f });
      return {
        ok: ![],
        type: 'single-failed',
        error: _0x51eb59,
        projectToken: _0x18ab6f,
        episodeId: _0x2f28d6?.['id'] || '',
        clipId: _0x4cb371?.['id'] || '',
        modelId: _0x1a4f5e,
        provider: _0x59a494,
      };
    } finally {
      _0x29e81e && _0x5b8ca9['get'](_0x43ec4b) === _0x29e81e && _0x5b8ca9['delete'](_0x43ec4b);
      if (_0x29e81e) batchRun?.['controllers']['delete'](_0x29e81e);
      _0x29e81e &&
        _0x1e6038(_0x18ab6f) &&
        (setClipGenerationRunning(_0x3acf1b, _0x4cb371?.['id'], ![]), _0x4649d3());
    }
  }
  async function _0x5be15b({ episode: _0x4175aa, targets: _0x1a5a74, projectToken: _0x1161dc }) {
    const _0x27a2df = new Set(
        _0x1a5a74['map']((_0x380aaf) => normalizeText(_0x380aaf?.['id']))['filter'](Boolean),
      ),
      _0x14cfd1 = projectAdapter['createBatch']?.('clip-videos', {
        episodeId: _0x4175aa['id'],
        total: _0x1a5a74['length'],
        completed: 0x0,
        targetClipIds: [..._0x27a2df],
        pendingClipIds: [..._0x27a2df],
        label: '批量生成\x200/' + _0x1a5a74['length'],
      }) || {
        id: 'clip-videos:' + normalizeText(_0x1161dc?.['projectId']) + ':' + Date['now'](),
        type: 'clip-videos',
        episodeId: _0x4175aa['id'],
        total: _0x1a5a74['length'],
        completed: 0x0,
      },
      _0x43ee43 = {
        batch: _0x14cfd1,
        projectToken: _0x1161dc,
        episodeId: normalizeText(_0x4175aa['id']),
        controllers: new Set(),
        cancelRequested: ![],
      },
      _0x59c6b5 = _0x57be89(_0x1161dc, _0x4175aa);
    (_0x2edb7a['set'](_0x59c6b5, _0x43ee43),
      setEpisodeBatchRunning(_0x3acf1b, _0x4175aa['id'], !![], '批量生成\x200/' + _0x1a5a74['length'], {
        batchId: _0x14cfd1['id'],
        cancelRequested: ![],
      }));
    let _0x149097 = 0x0,
      _0x273563 = 0x0,
      _0x2d8af8 = 0x0,
      _0x141097 = null,
      _0x42c6d7 = ![];
    _0x4649d3();
    try {
      await runBatch(
        _0x1a5a74,
        (_0x2ed748) =>
          _0x269835({
            episode: _0x4175aa,
            clip: _0x2ed748,
            displayedClip: null,
            projectToken: _0x1161dc,
            batch: _0x14cfd1,
            batchRun: _0x43ee43,
          }),
        {
          onProgress: ({ completed: _0x44d302, total: _0x261b0b, target: _0x557935, result: _0x154b20 }) => {
            if (!_0x117d0e(_0x1161dc)) return;
            _0x27a2df['delete'](normalizeText(_0x557935?.['id']));
            const _0x4e9c0 = _0x43ee43['cancelRequested']
              ? '正在停止批量生成 · 已结束 ' + _0x44d302 + '/' + _0x261b0b
              : '批量生成 ' + _0x44d302 + '/' + _0x261b0b;
            projectAdapter['syncBatch']?.(_0x1161dc, _0x14cfd1, {
              completed: _0x44d302,
              pendingClipIds: [..._0x27a2df],
              cancelRequested: _0x43ee43['cancelRequested'],
              label: _0x4e9c0,
            });
            if (_0x154b20?.['ok']) _0x149097 += 0x1;
            else
              _0x154b20?.['cancelled'] || _0x154b20?.['reason'] === 'batch-cancelled'
                ? (_0x2d8af8 += 0x1)
                : ((_0x273563 += 0x1),
                  (_0x141097 ||= _0x154b20),
                  !_0x42c6d7 &&
                    _0x154b20?.['error'] &&
                    (_0x42c6d7 =
                      projectionAdapter['present']?.({
                        type: 'provider-error',
                        error: _0x154b20['error'],
                        modelId: _0x154b20['modelId'],
                        provider: _0x154b20['provider'],
                      }) === !![]));
            _0x1e6038(_0x1161dc) &&
              (setEpisodeBatchRunning(_0x3acf1b, _0x4175aa['id'], !![], _0x4e9c0, {
                batchId: _0x14cfd1['id'],
                cancelRequested: _0x43ee43['cancelRequested'],
              }),
              _0x4649d3());
          },
        },
      );
    } finally {
      (_0x2edb7a['get'](_0x59c6b5) === _0x43ee43 && _0x2edb7a['delete'](_0x59c6b5),
        _0x1e6038(_0x1161dc) &&
          (setEpisodeBatchRunning(_0x3acf1b, _0x4175aa['id'], ![]),
          await projectionAdapter['persist']?.({ immediate: !![] }),
          _0x4649d3()));
    }
    if (!_0x117d0e(_0x1161dc)) return ![];
    return (
      projectionAdapter['present']?.({
        type: 'batch-complete',
        projectToken: _0x1161dc,
        episodeId: _0x4175aa['id'],
        clipId: _0x1a5a74[0x0]?.['id'] || '',
        succeeded: _0x149097,
        failed: _0x273563,
        cancelled: _0x2d8af8,
        cancelRequested: _0x43ee43['cancelRequested'],
        firstFailure: _0x141097,
        suppressToast: _0x42c6d7,
      }),
      _0x149097 > 0x0
    );
  }
  async function _0xc6afb7() {
    const _0x34b7e1 = getSelectedEpisode(_0x3acf1b),
      _0x33c40b = normalizeText(_0x34b7e1?.['id']),
      _0x54cd36 = projectAdapter['createToken'](),
      _0x841bf2 = _0x57be89(_0x54cd36, _0x34b7e1);
    let _0x575756 = _0x2edb7a['get'](_0x841bf2);
    if (!_0x575756) {
      const _0x129122 = _0x3acf1b['clipBatchGenerationByEpisode']?.[_0x33c40b],
        _0x3e52b3 = _0x841bf2 + ':',
        _0x9fe1fc = new Set(
          [..._0x5b8ca9['entries']()]
            ['filter'](([_0x3a0639]) => normalizeText(_0x3a0639)['startsWith'](_0x3e52b3))
            ['map'](([, _0x210d8a]) => _0x210d8a),
        );
      if (!_0x129122?.['batchId'] || !_0x9fe1fc['size']) return ![];
      _0x575756 = {
        batch: { id: _0x129122['batchId'], type: 'clip-videos', episodeId: _0x33c40b },
        projectToken: _0x54cd36,
        episodeId: _0x33c40b,
        controllers: _0x9fe1fc,
        cancelRequested: _0x129122['cancelRequested'] === !![],
      };
    }
    if (!_0x575756 || _0x575756['cancelRequested']) return ![];
    _0x575756['cancelRequested'] = !![];
    const _0xccf3d7 = '正在停止批量生成';
    return (
      projectAdapter['syncBatch']?.(_0x575756['projectToken'], _0x575756['batch'], {
        type: 'clip-videos-stopped',
        cancelRequested: !![],
        pendingClipIds: [],
        label: _0xccf3d7,
      }),
      _0x1e6038(_0x575756['projectToken']) &&
        (setEpisodeBatchRunning(_0x3acf1b, _0x33c40b, !![], _0xccf3d7, {
          batchId: _0x575756['batch']['id'],
          cancelRequested: !![],
        }),
        _0x4649d3()),
      await Promise['allSettled'](
        [..._0x575756['controllers']]['map']((_0xff02ef) => {
          if (typeof _0xff02ef?.['cancel'] === 'function') return _0xff02ef['cancel']();
          return _0xff02ef?.['pause']?.();
        }),
      ),
      !![]
    );
  }
  async function _0x2ef6a7() {
    const _0x51718b = getSelectedEpisode(_0x3acf1b),
      _0x35cd0f = getGenerationState(_0x3acf1b, _0x51718b);
    if (_0x35cd0f['isBatchGenerating']) return ![];
    const _0x16c143 = getSelectedClip(_0x3acf1b, _0x51718b),
      _0x166c0c = _0x3acf1b['clipSelectionMode']
        ? selectBatchTargets(_0x51718b?.['clips'], _0x3acf1b['selectedClipGenerationIds'])
        : [];
    if (_0x3acf1b['clipSelectionMode'] && _0x166c0c['length'] > 0x1) {
      if (_0x35cd0f['busy']) return ![];
      return _0x5be15b({
        episode: _0x51718b,
        targets: _0x166c0c,
        projectToken: projectAdapter['createToken'](),
      });
    }
    const _0x113eb3 = _0x3acf1b['clipSelectionMode'] ? _0x166c0c[0x0] : _0x16c143;
    if (!_0x113eb3) return (projectionAdapter['present']?.({ type: 'selection-missing' }), ![]);
    const _0x10bbe6 = projectAdapter['createToken'](),
      _0x2005a2 = await _0x269835({
        episode: _0x51718b,
        clip: _0x113eb3,
        displayedClip: _0x16c143,
        projectToken: _0x10bbe6,
      });
    if (_0x2005a2['reason'] === 'empty-prompt')
      return (projectionAdapter['present']?.({ ..._0x2005a2, type: 'empty-prompt' }), ![]);
    if (_0x2005a2['type']) projectionAdapter['present']?.(_0x2005a2);
    return _0x2005a2['ok'] === !![];
  }
  return Object['freeze']({
    generateSelection: _0x2ef6a7,
    previewSelection: _0x3a1236,
    cancelBatch: _0xc6afb7,
  });
}
export const storyClipProduction = Object['freeze']({
  createRuntime: createRuntime,
  getAdjacentClipId: getAdjacentClipId,
  getInputReferenceCounts: getInputReferenceCounts,
  removeVideoResult: removeVideoResult,
  renderTimelineVideoThumbnail: renderTimelineVideoThumbnail,
  selectBatchTargets: selectBatchTargets,
  runBatch: runBatch,
  getGenerationState: getGenerationState,
  setClipGenerationRunning: setClipGenerationRunning,
  setEpisodeBatchRunning: setEpisodeBatchRunning,
  shouldCloseAdjustmentOnOutsideClick: shouldCloseAdjustmentOnOutsideClick,
  shouldClosePromptHistoryOnOutsideClick: shouldClosePromptHistoryOnOutsideClick,
  renderEpisode: renderEpisode,
});

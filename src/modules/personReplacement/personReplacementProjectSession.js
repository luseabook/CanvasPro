import {
  formatPersonReplacementPersonLabel,
  getPersonReplacementCrossRoleSourceCharacterIds,
  isGeneratedPersonReplacementLabel,
  normalizePersonReplacementProject,
} from './personReplacementProject.js';
import {
  buildPersonReplacementSourceCharacters,
  normalizePersonReplacementIdentityCorrectionDrafts,
} from './personReplacementSourceIdentity.js';
import {
  getRecoverablePersonReplacementImageTask,
  normalizePersonReplacementAssetPromptPresetId,
  normalizePersonReplacementImageGenerationsByShotId,
  normalizePersonReplacementImageGenerationState,
  updatePersonReplacementImageGenerationState,
} from './personReplacementImageGeneration.js';
import {
  getRecoverablePersonReplacementVideoTask,
  isPersonReplacementVideoGenerationActive,
  normalizePersonReplacementVideoGenerationsByShotId,
  normalizePersonReplacementVideoGenerationState,
  updatePersonReplacementVideoGenerationState,
} from './personReplacementVideoGeneration.js';
import { getPersonReplacementAccessibleStep } from './personReplacementWorkflow.js';
import {
  getWorkspaceProjectTaskPresentation,
  normalizeWorkspaceProjectSortOrder,
} from '../workspaceProjectHome.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import { syncPersonReplacementPromptReferences } from './personReplacementPromptReferenceReview.js';
import { getPersonReplacementAudioSavedName } from './personReplacementVoiceLibrary.js';
import { normalizeWorkspaceAssetDetailSplitRatio } from '../workspaceAssetSettingsShell.js';
import { reportReplacementTaskCenter } from './personReplacementTaskCenterProjection.js';
const PRESENTATION_MODES = new Set(['none', 'render', 'state']),
  ACTIVE_CHARACTER_APPEARANCE_STATUSES = new Set(['queued', 'submitting', 'running']),
  ACTIVE_RUNTIME_TASK_STATUSES = new Set(['queued', 'submitting', 'running']),
  FAILED_PROJECT_TASK_STATUSES = new Set(['failed', 'interrupted']),
  ACTIVE_SOURCE_ANALYSIS_STATUSES = new Set([
    'uploading',
    'cutting',
    'extracting-keyframes',
    'detecting',
    'identifying',
    'running',
  ]),
  INTERRUPTED_CHARACTER_APPEARANCE_ERROR = '页面刷新后生成任务已中断，请重新生成。',
  INTERRUPTED_PROJECT_TASK_ERROR = '页面刷新后任务已中断，请重试。',
  PERSON_REPLACEMENT_LAYOUT_DEFAULTS = Object['freeze']({ left: 0x18, right: 0x20, centerTop: 0x44 }),
  PERSON_REPLACEMENT_VOICE_LAYOUT_DEFAULTS = Object['freeze']({ assetsEnd: 0x10, sourcesEnd: 0x26 }),
  PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_DEFAULT = 0x140;
export const PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE = Object['freeze']({ min: 0xf0, max: 0x2d0 });
const WORKSPACE_PROJECT_PROJECTION_FIELDS = new Set([
  'libraryProjects',
  'libraryAssets',
  'sourcePreviewRefs',
  'persistenceState',
]);
function normalizeText(_0x5ccc51) {
  return String(_0x5ccc51 ?? '')['trim']();
}
function cloneJson(_0x19b5f2) {
  return JSON['parse'](JSON['stringify'](_0x19b5f2));
}
function clamp(_0xb032f3, _0x4574d3, _0x26c9b7, _0x59bf2b = _0x4574d3) {
  const _0x225a6c = Number(_0xb032f3);
  return Number['isFinite'](_0x225a6c)
    ? Math['min'](_0x26c9b7, Math['max'](_0x4574d3, _0x225a6c))
    : _0x59bf2b;
}
function normalizeMediaUrl(_0x40aa1a) {
  const _0x416c52 = normalizeText(_0x40aa1a);
  if (!_0x416c52) return '';
  return localPathToUrl(_0x416c52) || _0x416c52;
}
function normalizeLibraryAssetForProjectSession(_0x40b994 = {}, _0x5bc3fe = 0x0) {
  const _0x103a41 =
      normalizeText(_0x40b994['assetId'] || _0x40b994['sourceAssetId'] || _0x40b994['id']) ||
      'asset-' + (_0x5bc3fe + 0x1),
    _0x5d95fa = Math['max'](
      0x0,
      Math['trunc'](Number(_0x40b994['itemIndex'] ?? _0x40b994['sourceItemIndex']) || 0x0),
    ),
    _0x61eb3 = (normalizeText(_0x40b994['type'] || _0x40b994['mediaKind']) || 'image')['toLowerCase'](),
    _0x598f5d = normalizeText(_0x40b994['assetName']) || normalizeText(_0x40b994['name']) || '画布素材',
    _0x1f2732 = normalizeMediaUrl(_0x40b994['thumbUrl'] || _0x40b994['thumbnailUrl']),
    _0x182035 = normalizeMediaUrl(
      _0x40b994['url'] ||
        _0x40b994['sourceUrl'] ||
        (_0x61eb3 === 'audio' ? _0x40b994['audioUrl'] : _0x40b994['imageUrl']),
    ),
    _0x438ffa = _0x61eb3 === 'audio' ? '音频' : _0x61eb3 === 'video' ? '视频' : '图片',
    _0xe10c5c =
      _0x61eb3 === 'audio'
        ? getPersonReplacementAudioSavedName(_0x40b994)
        : normalizeText(_0x40b994['name']) || _0x598f5d;
  return {
    ..._0x40b994,
    id: 'library-' + _0x103a41 + '-' + _0x5d95fa,
    sourceAssetId: _0x103a41,
    sourceItemIndex: _0x5d95fa,
    kind: 'library',
    mediaKind: _0x61eb3,
    name: _0xe10c5c,
    ...(_0x61eb3 === 'audio' ? { savedName: _0xe10c5c } : {}),
    assetName: _0x598f5d,
    role: _0x438ffa + '素材',
    occurrences: '来自画布素材',
    description:
      _0x61eb3 === 'audio'
        ? ''
        : normalizeText(_0x40b994['description']) || '来自画布素材「' + _0x598f5d + '」',
    prompt: '',
    imageUrl: _0x61eb3 === 'image' ? _0x182035 || _0x1f2732 : _0x1f2732,
    audioUrl: _0x61eb3 === 'audio' ? _0x182035 : '',
    thumbnailUrl: _0x1f2732,
    sourceUrl: _0x182035 || _0x1f2732,
    isLibraryAsset: !![],
  };
}
function getActiveCharacterAppearanceKeys(_0xdaa808 = {}) {
  return new Set(
    (Array['isArray'](_0xdaa808['characters']) ? _0xdaa808['characters'] : [])['flatMap']((_0x1a12fa) =>
      (Array['isArray'](_0x1a12fa?.['appearances']) ? _0x1a12fa['appearances'] : [])
        ['filter'](
          (_0x6d58f8) =>
            !normalizeText(_0x6d58f8?.['imageUrl']) &&
            !normalizeText(_0x6d58f8?.['error']) &&
            ACTIVE_CHARACTER_APPEARANCE_STATUSES['has'](
              normalizeText(_0x6d58f8?.['generationStatus'])['toLowerCase'](),
            ),
        )
        ['map']((_0x4f4dee) => normalizeText(_0x1a12fa?.['id']) + ':' + normalizeText(_0x4f4dee?.['id']))
        ['filter']((_0x41841d) => !_0x41841d['startsWith'](':') && !_0x41841d['endsWith'](':')),
    ),
  );
}
export function normalizePersonReplacementLayout(_0x45053c = {}) {
  const _0xdd1e18 = _0x45053c && typeof _0x45053c === 'object' ? _0x45053c : {};
  return {
    left: clamp(_0xdd1e18['left'], 0x12, 0x26, PERSON_REPLACEMENT_LAYOUT_DEFAULTS['left']),
    right: clamp(_0xdd1e18['right'], 0x18, 0x2a, PERSON_REPLACEMENT_LAYOUT_DEFAULTS['right']),
    centerTop: clamp(_0xdd1e18['centerTop'], 0x26, 0x52, PERSON_REPLACEMENT_LAYOUT_DEFAULTS['centerTop']),
  };
}
export function normalizePersonReplacementAssetDetailSplitRatio(_0xf9352c) {
  return normalizeWorkspaceAssetDetailSplitRatio(_0xf9352c);
}
export function normalizePersonReplacementVoiceLayout(_0xc9914e = {}) {
  const _0x598bed = _0xc9914e && typeof _0xc9914e === 'object' ? _0xc9914e : {},
    _0xeffd3d = clamp(
      _0x598bed['assetsEnd'],
      0x10,
      0x20,
      PERSON_REPLACEMENT_VOICE_LAYOUT_DEFAULTS['assetsEnd'],
    );
  return {
    assetsEnd: _0xeffd3d,
    sourcesEnd: clamp(
      _0x598bed['sourcesEnd'],
      _0xeffd3d + 0x10,
      0x3c,
      Math['max'](PERSON_REPLACEMENT_VOICE_LAYOUT_DEFAULTS['sourcesEnd'], _0xeffd3d + 0x10),
    ),
  };
}
export function normalizePersonReplacementCompositeSidebarWidth(_0x37585f) {
  return clamp(
    _0x37585f,
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE['min'],
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE['max'],
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_DEFAULT,
  );
}
export function normalizePersonReplacementPersistenceState(_0x13d642 = {}) {
  const _0x2d631f = _0x13d642 && typeof _0x13d642 === 'object' ? _0x13d642 : {},
    _0x17c22a = ['idle', 'pending', 'saving', 'saved', 'error']['includes'](_0x2d631f['status'])
      ? _0x2d631f['status']
      : 'saved';
  return {
    status: _0x17c22a,
    error: normalizeText(_0x2d631f['error']),
    retryAttempt: Math['max'](0x0, Math['trunc'](Number(_0x2d631f['retryAttempt']) || 0x0)),
  };
}
export function isPersonReplacementSourceProcessing(_0x3d0e36 = {}) {
  const _0x10871f = _0x3d0e36?.['workspace'] || {},
    _0x21b9da = normalizeText(_0x10871f['sourceAnalysis']?.['status'])['toLowerCase'](),
    _0x42c287 = normalizeText(_0x10871f['videoPreparation']?.['status'])['toLowerCase']();
  return _0x42c287 === 'running' || ACTIVE_SOURCE_ANALYSIS_STATUSES['has'](_0x21b9da);
}
export function getPersonReplacementProjectTaskSummary(_0x4252e3 = {}) {
  const _0x2e0d3d = _0x4252e3?.['workspace'] || {},
    _0x58853a = normalizeText(_0x2e0d3d['sourceAnalysis']?.['status'])['toLowerCase'](),
    _0x223868 = normalizeText(_0x2e0d3d['videoPreparation']?.['status'])['toLowerCase']();
  if (isPersonReplacementSourceProcessing(_0x4252e3)) {
    const _0x3a7314 = _0x223868 === 'running',
      _0x24d2b2 = Math['round'](
        clamp(
          _0x3a7314 ? _0x2e0d3d['videoPreparation']?.['progress'] : _0x2e0d3d['sourceAnalysis']?.['progress'],
          0x0,
          0x64,
          0x0,
        ),
      );
    return {
      activeCount: 0x1,
      failedCount: 0x0,
      label: (_0x3a7314 ? '正在准备镜头' : '视频处理中') + ' · ' + _0x24d2b2 + '%',
    };
  }
  const _0x3e5461 = new Set(),
    _0x2dcf07 = new Set();
  (_0x58853a === 'failed' || _0x223868 === 'failed') && _0x2dcf07['add']('source:processing');
  const _0x2ba8b0 = (_0x4d178e, _0x447559, _0x53d91e) => {
      const _0x5b037f = normalizeText(_0x447559);
      if (!_0x5b037f) return;
      const _0x5cd299 = normalizeText(_0x53d91e)['toLowerCase']();
      if (ACTIVE_RUNTIME_TASK_STATUSES['has'](_0x5cd299))
        (_0x3e5461['add'](_0x4d178e + ':' + _0x5b037f), _0x2dcf07['delete'](_0x4d178e + ':' + _0x5b037f));
      else FAILED_PROJECT_TASK_STATUSES['has'](_0x5cd299) && _0x2dcf07['add'](_0x4d178e + ':' + _0x5b037f);
    },
    _0x499040 = (_0x20f105, _0x1385de = {}) => {
      if (!_0x1385de || typeof _0x1385de !== 'object' || Array['isArray'](_0x1385de)) return;
      Object['entries'](_0x1385de)['forEach'](([_0x58d82c, _0x1d3f05]) => {
        _0x2ba8b0(_0x20f105, _0x58d82c, _0x1d3f05?.['status']);
      });
    };
  (_0x499040('image', _0x2e0d3d['imageGenerationsByShotId']),
    _0x499040('video', _0x2e0d3d['videoGenerationsByShotId']));
  const _0x3b9c5f = (_0x1188d6, _0xce60ea = {}) => {
    _0x2ba8b0(_0x1188d6, _0xce60ea?.['shotId'], _0xce60ea?.['status']);
  };
  return (
    _0x3b9c5f('image', _0x2e0d3d['imageGeneration']),
    _0x3b9c5f('video', _0x2e0d3d['videoGeneration']),
    (Array['isArray'](_0x2e0d3d['generatingAppearanceKeys']) ? _0x2e0d3d['generatingAppearanceKeys'] : [])
      ['map'](normalizeText)
      ['filter'](Boolean)
      ['forEach']((_0x196012) => {
        _0x3e5461['add']('appearance:' + _0x196012);
      }),
    (Array['isArray'](_0x4252e3?.['characters']) ? _0x4252e3['characters'] : [])['forEach']((_0x24de67) => {
      (Array['isArray'](_0x24de67?.['appearances']) ? _0x24de67['appearances'] : [])['forEach'](
        (_0x3413f5) => {
          const _0x9c251b = normalizeText(_0x24de67?.['id']) + ':' + normalizeText(_0x3413f5?.['id']),
            _0x504fd1 = normalizeText(_0x3413f5?.['generationStatus'])['toLowerCase']();
          if (ACTIVE_CHARACTER_APPEARANCE_STATUSES['has'](_0x504fd1))
            (_0x3e5461['add']('appearance:' + _0x9c251b), _0x2dcf07['delete']('appearance:' + _0x9c251b));
          else FAILED_PROJECT_TASK_STATUSES['has'](_0x504fd1) && _0x2dcf07['add']('appearance:' + _0x9c251b);
        },
      );
    }),
    (Array['isArray'](_0x4252e3?.['shots']) ? _0x4252e3['shots'] : [])['forEach']((_0x55bfda) => {
      _0x2ba8b0('video', _0x55bfda?.['id'], _0x55bfda?.['generationStatus']);
    }),
    getWorkspaceProjectTaskPresentation({ activeCount: _0x3e5461['size'], failedCount: _0x2dcf07['size'] })
  );
}
export function normalizePersonReplacementWorkspaceProject(_0x2be682 = {}) {
  const _0x383ea7 = _0x2be682 && typeof _0x2be682 === 'object' ? _0x2be682 : {},
    _0x29566b = normalizePersonReplacementProject(_0x383ea7),
    _0x5e914c =
      _0x383ea7['workspace'] && typeof _0x383ea7['workspace'] === 'object' ? _0x383ea7['workspace'] : {},
    _0x212275 = normalizeText(_0x5e914c['selectedShotId'] || _0x383ea7['selectedShotId']),
    _0x294cf3 = _0x29566b['shots']['some']((_0x4129b8) => _0x4129b8['id'] === _0x212275)
      ? _0x212275
      : _0x29566b['shots'][0x0]?.['id'] || '',
    _0x101a11 = normalizeText(_0x5e914c['selectedCharacterId']),
    _0x93d779 = _0x29566b['characters']['some']((_0x315f3b) => _0x315f3b['id'] === _0x101a11)
      ? _0x101a11
      : _0x29566b['characters'][0x0]?.['id'] || '',
    _0x4d4ca6 = normalizeText(_0x5e914c['selectedSceneId']),
    _0x53eaae = _0x29566b['scenes']['some']((_0x23945a) => _0x23945a['id'] === _0x4d4ca6)
      ? _0x4d4ca6
      : _0x29566b['scenes'][0x0]?.['id'] || '',
    _0xba3b1c = normalizeText(_0x5e914c['selectedAudioAssetId']),
    _0x4eb0d7 = _0x29566b['audioAssets']['some']((_0x12ae53) => _0x12ae53['id'] === _0xba3b1c)
      ? _0xba3b1c
      : _0x29566b['audioAssets'][0x0]?.['id'] || '',
    _0x2fdafb = normalizeText(_0x5e914c['selectedVoiceSourceId']),
    _0x276f0e = _0x29566b['sources']['some']((_0xfcc91f) => _0xfcc91f['id'] === _0x2fdafb)
      ? _0x2fdafb
      : _0x29566b['sources'][0x0]?.['id'] || '',
    _0x569265 = Array['isArray'](_0x383ea7['libraryAssets'])
      ? _0x383ea7['libraryAssets']
          ['filter']((_0x117b94) =>
            ['image', 'audio']['includes'](
              (normalizeText(_0x117b94?.['type'] || _0x117b94?.['mediaKind']) || 'image')['toLowerCase'](),
            ),
          )
          ['map'](normalizeLibraryAssetForProjectSession)
      : [],
    _0x52e39d = normalizeText(_0x5e914c['selectedLibraryAssetId']),
    _0x5c2b39 = _0x569265['some']((_0x3f15a8) => _0x3f15a8['id'] === _0x52e39d)
      ? _0x52e39d
      : _0x569265[0x0]?.['id'] || '',
    _0x4c8fae =
      _0x383ea7['sourcePreviewRefs'] && typeof _0x383ea7['sourcePreviewRefs'] === 'object'
        ? _0x383ea7['sourcePreviewRefs']
        : {},
    _0x2ebc92 = Object['fromEntries'](
      _0x29566b['sources']
        ['map']((_0x1dc38b) => [_0x1dc38b['id'], normalizeText(_0x4c8fae[_0x1dc38b['id']])])
        ['filter'](([, _0x16f3de]) => _0x16f3de['startsWith']('blob:')),
    ),
    _0x44df24 = getActiveCharacterAppearanceKeys(_0x29566b),
    _0x2b1552 = Math['trunc'](clamp(_0x5e914c['step'] ?? _0x383ea7['step'], 0x1, 0x5, 0x1)),
    _0x580e4a = normalizePersonReplacementImageGenerationState(_0x5e914c['imageGeneration']),
    _0x2d6382 = normalizePersonReplacementImageGenerationsByShotId(
      _0x5e914c['imageGenerationsByShotId'],
      _0x29566b['shots'],
      _0x580e4a,
    ),
    _0x35e71e = Object['values'](_0x2d6382)['find']((_0x1abaf5) => _0x1abaf5['status'] === 'running'),
    _0x371937 = normalizePersonReplacementVideoGenerationState(_0x5e914c['videoGeneration']),
    _0x378f0e = normalizePersonReplacementVideoGenerationsByShotId(
      _0x5e914c['videoGenerationsByShotId'],
      _0x29566b['shots'],
      _0x371937,
    ),
    _0xb456eb = Object['values'](_0x378f0e)['find'](isPersonReplacementVideoGenerationActive);
  return {
    ..._0x29566b,
    persistenceState: normalizePersonReplacementPersistenceState(_0x383ea7['persistenceState']),
    ...(Object['keys'](_0x2ebc92)['length'] ? { sourcePreviewRefs: _0x2ebc92 } : {}),
    libraryProjects: Array['isArray'](_0x383ea7['libraryProjects']) ? _0x383ea7['libraryProjects'] : [],
    libraryAssets: _0x569265,
    workspace: {
      view: _0x5e914c['view'] === 'project' ? 'project' : 'home',
      step: getPersonReplacementAccessibleStep(_0x29566b, _0x2b1552),
      selectedShotId: _0x294cf3,
      selectedShotIds: Array['isArray'](_0x5e914c['selectedShotIds'])
        ? _0x5e914c['selectedShotIds']
            ['map'](normalizeText)
            ['filter']((_0xe1abd2) =>
              _0x29566b['shots']['some']((_0x2c8d2f) => _0x2c8d2f['id'] === _0xe1abd2),
            )
        : [],
      shotSelectionMode: _0x5e914c['shotSelectionMode'] === !![],
      selectedCharacterId: _0x93d779,
      selectedSceneId: _0x53eaae,
      selectedAudioAssetId: _0x4eb0d7,
      selectedLibraryAssetId: _0x5c2b39,
      selectedVoiceSourceId: _0x276f0e,
      characterAssetTab: ['character', 'scene', 'audio', 'library']['includes'](
        _0x5e914c['characterAssetTab'],
      )
        ? _0x5e914c['characterAssetTab']
        : 'character',
      replacementLayout: normalizePersonReplacementLayout(_0x5e914c['replacementLayout']),
      voiceLayout: normalizePersonReplacementVoiceLayout(_0x5e914c['voiceLayout']),
      assetPromptPresetId: normalizePersonReplacementAssetPromptPresetId(_0x5e914c['assetPromptPresetId']),
      selectedAssetIds: Array['isArray'](_0x5e914c['selectedAssetIds'])
        ? _0x5e914c['selectedAssetIds']['map'](normalizeText)['filter'](Boolean)
        : [],
      assetSelectionMode: _0x5e914c['assetSelectionMode'] === !![],
      assetAppearanceIndexes:
        _0x5e914c['assetAppearanceIndexes'] && typeof _0x5e914c['assetAppearanceIndexes'] === 'object'
          ? { ..._0x5e914c['assetAppearanceIndexes'] }
          : {},
      assetSplitRatio: clamp(_0x5e914c['assetSplitRatio'], 0x1c, 0x48, 0x32),
      assetDetailSplitRatio: normalizePersonReplacementAssetDetailSplitRatio(
        _0x5e914c['assetDetailSplitRatio'],
      ),
      compositeSidebarWidth: normalizePersonReplacementCompositeSidebarWidth(
        _0x5e914c['compositeSidebarWidth'],
      ),
      compositePreviewMode:
        _0x5e914c['compositePreviewMode'] === 'full' &&
        Boolean(_0x29566b['output']['originalMasterRef']) &&
        Boolean(_0x29566b['output']['finalVideoRef'] || _0x29566b['output']['visualMasterRef'])
          ? 'full'
          : 'shot',
      generatingAppearanceKeys: Array['isArray'](_0x5e914c['generatingAppearanceKeys'])
        ? _0x5e914c['generatingAppearanceKeys']
            ['map'](normalizeText)
            ['filter']((_0x5231f1) => _0x44df24['has'](_0x5231f1))
        : [],
      imageGeneration:
        _0x580e4a['status'] === 'running' && _0x2d6382[_0x580e4a['shotId']]?.['status'] === 'running'
          ? _0x2d6382[_0x580e4a['shotId']]
          : _0x35e71e || _0x580e4a,
      imageGenerationsByShotId: _0x2d6382,
      videoGeneration:
        isPersonReplacementVideoGenerationActive(_0x371937) &&
        isPersonReplacementVideoGenerationActive(_0x378f0e[_0x371937['shotId']])
          ? _0x378f0e[_0x371937['shotId']]
          : _0xb456eb || _0x371937,
      videoGenerationsByShotId: _0x378f0e,
      videoPreparation: _0x5e914c['videoPreparation'] || { status: 'idle', progress: 0x0, error: '' },
      sourceAnalysis: _0x5e914c['sourceAnalysis'] || { status: 'idle', progress: 0x0 },
      smartClipSettingsOpen: _0x5e914c['smartClipSettingsOpen'] === !![],
      identityAnalysis: _0x5e914c['identityAnalysis'] || {
        status: 'idle',
        modelId: '',
        stats: {},
        error: '',
      },
      selectedIdentityIds: Array['isArray'](_0x5e914c['selectedIdentityIds'])
        ? _0x5e914c['selectedIdentityIds']
            ['map'](normalizeText)
            ['filter']((_0x5c2a41) =>
              _0x29566b['sourceCharacters']['some']((_0x518256) => _0x518256['id'] === _0x5c2a41),
            )
        : [],
      removedCustomPersonLabels: [
        ...new Set(
          (Array['isArray'](_0x5e914c['removedCustomPersonLabels'])
            ? _0x5e914c['removedCustomPersonLabels']
            : [])
            ['map'](normalizeText)
            ['filter']((_0x11d8bc) => _0x11d8bc && !isGeneratedPersonReplacementLabel(_0x11d8bc)),
        ),
      ],
      identityCorrectionDrafts: normalizePersonReplacementIdentityCorrectionDrafts(
        _0x5e914c['identityCorrectionDrafts'],
        _0x29566b['shots'],
        _0x29566b['sourceCharacters'],
      ),
      characterImageGeneration: _0x5e914c['characterImageGeneration'] || {
        status: 'idle',
        characterId: '',
        appearanceId: '',
        error: '',
      },
      projectSearchQuery: normalizeText(_0x5e914c['projectSearchQuery']),
      projectSortOrder: normalizeWorkspaceProjectSortOrder(_0x5e914c['projectSortOrder']),
      showArchivedProjects: _0x5e914c['showArchivedProjects'] === !![],
      openProjectMenuId: normalizeText(_0x5e914c['openProjectMenuId']),
      pendingDeleteProjectId: normalizeText(_0x5e914c['pendingDeleteProjectId']),
    },
  };
}
export function createPersonReplacementWorkspaceProject(_0x135b14 = {}, _0xda2c4a = {}) {
  const _0x77ee09 = _0x135b14 && typeof _0x135b14 === 'object' ? _0x135b14 : {},
    _0x32cf28 = normalizePersonReplacementProject(_0x77ee09),
    _0x2a92e4 =
      _0xda2c4a?.['workspace'] && typeof _0xda2c4a['workspace'] === 'object' ? _0xda2c4a['workspace'] : {},
    _0x147d71 =
      _0x77ee09['workspace'] && typeof _0x77ee09['workspace'] === 'object' ? _0x77ee09['workspace'] : {},
    _0x4b8d16 = _0x32cf28['shots']['map']((_0x4eda01, _0x1eeb1e) => ({
      ..._0x4eda01,
      title:
        normalizeText(
          _0x77ee09['shots']?.['find']?.((_0x49f0c1) => _0x49f0c1?.['id'] === _0x4eda01['id'])?.['title'],
        ) || '片段\x20' + String(_0x1eeb1e + 0x1)['padStart'](0x2, '0'),
      thumbnailUrl: normalizeMediaUrl(_0x4eda01['keyframeRef']),
      keyframeUrl: normalizeMediaUrl(_0x4eda01['keyframeRef']),
      persons: _0x4eda01['people']['map']((_0x59f175, _0x53d429) => ({
        ..._0x59f175,
        label: normalizeText(_0x59f175['label']) || formatPersonReplacementPersonLabel(_0x53d429),
      })),
    })),
    _0x155166 = {
      ..._0x2a92e4,
      ..._0x147d71,
      selectedShotId:
        _0x147d71['selectedShotId'] ||
        _0x77ee09['selectedShotId'] ||
        _0x2a92e4['selectedShotId'] ||
        _0x4b8d16[0x0]?.['id'] ||
        '',
    },
    _0x19da54 = Array['isArray'](_0x77ee09['libraryAssets']),
    _0x12e9de = normalizePersonReplacementWorkspaceProject({
      ..._0x32cf28,
      shots: _0x4b8d16,
      libraryProjects: _0x77ee09['libraryProjects'] || [],
      libraryAssets: _0x19da54 ? _0x77ee09['libraryAssets'] : [],
      workspace: _0x155166,
    });
  return {
    ..._0x12e9de,
    workspace: {
      ..._0x12e9de['workspace'],
      selectedLibraryAssetId: _0x19da54
        ? _0x12e9de['workspace']['selectedLibraryAssetId']
        : normalizeText(_0x155166['selectedLibraryAssetId']),
    },
    selectedShotId: _0x12e9de['workspace']['selectedShotId'],
    step: _0x12e9de['workspace']['step'],
    source: {
      ..._0x12e9de['source'],
      name: _0x12e9de['source']['fileName'],
      analysisStatus: _0x12e9de['source']['processingStatus'],
      analysisProgress: _0x12e9de['source']['processingProgress'],
      shotCount: _0x4b8d16['length'],
      keyframeCount: _0x4b8d16['filter']((_0xc4d724) => _0xc4d724['keyframeRef'])['length'],
    },
    shots: _0x4b8d16,
  };
}
function stripWorkspaceProjectProjection(_0x595bd8 = {}) {
  if (!_0x595bd8 || typeof _0x595bd8 !== 'object' || Array['isArray'](_0x595bd8)) return {};
  return Object['fromEntries'](
    Object['entries'](_0x595bd8)['filter'](
      ([_0x1721b7]) => !WORKSPACE_PROJECT_PROJECTION_FIELDS['has'](_0x1721b7),
    ),
  );
}
export function normalizeReplacementStudioApplicationProject(_0x20b573 = {}, _0x2d3113 = {}) {
  return stripWorkspaceProjectProjection(
    createPersonReplacementWorkspaceProject(
      stripWorkspaceProjectProjection(_0x20b573),
      stripWorkspaceProjectProjection(_0x2d3113),
    ),
  );
}
function applyEditedShotMappings(_0x10150e = {}) {
  const _0x486d4a = (Array['isArray'](_0x10150e['shots']) ? _0x10150e['shots'] : [])['map']((_0x4f4256) => ({
      ..._0x4f4256,
      people: Array['isArray'](_0x4f4256['persons'])
        ? _0x4f4256['persons']['map']((_0x3f09d5) => ({ ..._0x3f09d5 }))
        : Array['isArray'](_0x4f4256['people'])
          ? _0x4f4256['people']['map']((_0x283523) => ({ ..._0x283523 }))
          : [],
    })),
    _0x5153e1 = getPersonReplacementCrossRoleSourceCharacterIds({ shots: _0x486d4a }),
    _0x1d706d = new Map(
      (Array['isArray'](_0x10150e['mappings']) ? _0x10150e['mappings'] : [])
        ['map']((_0x3d4bc3) => [
          normalizeText(_0x3d4bc3?.['sourceCharacterId']),
          normalizeText(_0x3d4bc3?.['targetCharacterId']),
        ])
        ['filter'](([_0xf71a61]) => _0xf71a61 && !_0x5153e1['has'](_0xf71a61)),
    );
  return (
    _0x486d4a['forEach']((_0xcc506a) =>
      _0xcc506a['people']['forEach']((_0x5f338f) => {
        const _0x3173d8 = normalizeText(_0x5f338f['sourceCharacterId']),
          _0x40cdeb = normalizeText(_0x5f338f['targetCharacterId']);
        _0x3173d8 &&
          _0x40cdeb &&
          _0x5f338f['projectMappingDisabled'] !== !![] &&
          !_0x5153e1['has'](_0x3173d8) &&
          !_0x1d706d['has'](_0x3173d8) &&
          _0x1d706d['set'](_0x3173d8, _0x40cdeb);
      }),
    ),
    {
      shots: _0x486d4a['map']((_0x3ed65e) => ({
        ..._0x3ed65e,
        people: _0x3ed65e['people']['map']((_0x1a4d53) => ({
          ..._0x1a4d53,
          targetCharacterId:
            normalizeText(_0x1a4d53['targetCharacterId']) ||
            (_0x1a4d53['projectMappingDisabled'] === !![]
              ? ''
              : _0x1d706d['get'](normalizeText(_0x1a4d53['sourceCharacterId']))) ||
            '',
        })),
      })),
      mappings: [..._0x1d706d['entries']()]
        ['filter'](([_0x234f12, _0x45c6ce]) => _0x234f12 && _0x45c6ce)
        ['map'](([_0x483bb1, _0x3608c5]) => ({ sourceCharacterId: _0x483bb1, targetCharacterId: _0x3608c5 })),
    }
  );
}
function reconcileWorkspaceProject(_0x34f190, _0x8c519c, _0x29ba22) {
  const _0x485f96 = applyEditedShotMappings(_0x8c519c);
  return {
    ..._0x8c519c,
    audio: {
      ..._0x8c519c['audio'],
      selectedSourceId:
        _0x29ba22 === 'voice-source'
          ? normalizeText(_0x8c519c['workspace']?.['selectedVoiceSourceId']) ||
            _0x34f190['audio']?.['selectedSourceId']
          : _0x8c519c['audio']?.['selectedSourceId'],
      voiceStudioState: {
        ...(_0x8c519c['audio']?.['voiceStudioState'] || {}),
        ...(_0x34f190['audio']?.['voiceStudioState'] || {}),
      },
    },
    shots: _0x485f96['shots'],
    sourceCharacters: buildPersonReplacementSourceCharacters(
      _0x485f96['shots'],
      _0x34f190['sourceCharacters'],
    ),
    mappings: _0x485f96['mappings'],
  };
}
function settleInterruptedCharacterAppearanceGenerations(_0x2e6e1b = {}) {
  const _0x5a5425 = _0x2e6e1b && typeof _0x2e6e1b === 'object' ? _0x2e6e1b : {},
    _0x4f2d85 = new Set(
      Array['isArray'](_0x5a5425['workspace']?.['generatingAppearanceKeys'])
        ? _0x5a5425['workspace']['generatingAppearanceKeys']['map'](normalizeText)['filter'](Boolean)
        : [],
    );
  let _0x5e5724 = _0x4f2d85['size'] > 0x0;
  const _0x56424c = (Array['isArray'](_0x5a5425['characters']) ? _0x5a5425['characters'] : [])['map'](
    (_0x1e61a8) => {
      let _0x1fa0a0 = ![];
      const _0x35b859 = (Array['isArray'](_0x1e61a8?.['appearances']) ? _0x1e61a8['appearances'] : [])['map'](
        (_0x1b2787) => {
          const _0x3b7ea3 = normalizeText(_0x1e61a8?.['id']) + ':' + normalizeText(_0x1b2787?.['id']),
            _0x28e67e = normalizeText(_0x1b2787?.['generationStatus'])['toLowerCase'](),
            _0x51f93f = Boolean(normalizeText(_0x1b2787?.['imageUrl'])),
            _0x23d395 = _0x4f2d85['has'](_0x3b7ea3),
            _0x36a908 = ACTIVE_CHARACTER_APPEARANCE_STATUSES['has'](_0x28e67e);
          if (!_0x23d395 && !_0x36a908) return _0x1b2787;
          if (_0x51f93f) {
            const _0xd06716 = _0x28e67e !== 'succeeded' || Boolean(normalizeText(_0x1b2787?.['error']));
            return (
              (_0x1fa0a0 = _0x1fa0a0 || _0xd06716),
              _0xd06716 ? { ..._0x1b2787, generationStatus: 'succeeded', error: '' } : _0x1b2787
            );
          }
          if (!_0x36a908 && ['failed', 'cancelled']['includes'](_0x28e67e)) return _0x1b2787;
          return (
            (_0x1fa0a0 = !![]),
            {
              ..._0x1b2787,
              generationStatus: 'failed',
              error: normalizeText(_0x1b2787?.['error']) || INTERRUPTED_CHARACTER_APPEARANCE_ERROR,
            }
          );
        },
      );
      if (!_0x1fa0a0) return _0x1e61a8;
      return ((_0x5e5724 = !![]), { ..._0x1e61a8, appearances: _0x35b859 });
    },
  );
  if (!_0x5e5724) return { project: _0x5a5425, changed: ![] };
  return {
    project: {
      ..._0x5a5425,
      characters: _0x56424c,
      workspace: { ..._0x5a5425['workspace'], generatingAppearanceKeys: [] },
    },
    changed: !![],
  };
}
export function settleInterruptedReplacementStudioProjectTasks(
  _0x18bb64 = {},
  {
    preserveRecoverableTasks: preserveRecoverableTasks = !![],
    message: message = INTERRUPTED_PROJECT_TASK_ERROR,
  } = {},
) {
  const _0x19c719 = settleInterruptedCharacterAppearanceGenerations(_0x18bb64),
    _0x23916e = _0x19c719['project'];
  let _0x27d6e3 = _0x19c719['changed'];
  const _0x3cfc4b = { ...(_0x23916e['workspace'] || {}) },
    _0x5764dd = new Set(
      Object['entries'](_0x3cfc4b['videoGenerationsByShotId'] || {})['flatMap'](([_0xbfb4, _0x37b91e]) =>
        preserveRecoverableTasks &&
        getRecoverablePersonReplacementVideoTask({ ..._0x37b91e, shotId: _0xbfb4 })
          ? [normalizeText(_0xbfb4)]
          : [],
      ),
    ),
    _0x15dc6f = preserveRecoverableTasks
      ? getRecoverablePersonReplacementVideoTask(_0x3cfc4b['videoGeneration'])
      : null;
  _0x15dc6f && _0x5764dd['add'](normalizeText(_0x3cfc4b['videoGeneration']?.['shotId']));
  const _0x1aebf9 = normalizeText(_0x3cfc4b['sourceAnalysis']?.['status'])['toLowerCase']();
  ACTIVE_SOURCE_ANALYSIS_STATUSES['has'](_0x1aebf9) &&
    ((_0x3cfc4b['sourceAnalysis'] = {
      ..._0x3cfc4b['sourceAnalysis'],
      status: 'failed',
      error: normalizeText(_0x3cfc4b['sourceAnalysis']?.['error']) || message,
    }),
    (_0x27d6e3 = !![]));
  const _0x5120f3 = normalizeText(_0x3cfc4b['identityAnalysis']?.['status'])['toLowerCase']();
  ACTIVE_RUNTIME_TASK_STATUSES['has'](_0x5120f3) &&
    ((_0x3cfc4b['identityAnalysis'] = {
      ..._0x3cfc4b['identityAnalysis'],
      status: 'failed',
      error: normalizeText(_0x3cfc4b['identityAnalysis']?.['error']) || message,
    }),
    (_0x27d6e3 = !![]));
  normalizeText(_0x3cfc4b['videoPreparation']?.['status'])['toLowerCase']() === 'running' &&
    ((_0x3cfc4b['videoPreparation'] = {
      ..._0x3cfc4b['videoPreparation'],
      status: 'failed',
      error: normalizeText(_0x3cfc4b['videoPreparation']?.['error']) || message,
    }),
    (_0x27d6e3 = !![]));
  const _0x54ec8a = (Array['isArray'](_0x23916e['sources']) ? _0x23916e['sources'] : [])['map'](
      (_0x5a33d5) => {
        const _0x57e93b = normalizeText(_0x5a33d5?.['processingStatus'])['toLowerCase']();
        if (!ACTIVE_SOURCE_ANALYSIS_STATUSES['has'](_0x57e93b)) return _0x5a33d5;
        _0x27d6e3 = !![];
        if (_0x57e93b === 'uploading' && normalizeText(_0x5a33d5?.['videoRef']))
          return { ..._0x5a33d5, processingStatus: 'ready-to-start', error: '' };
        return {
          ..._0x5a33d5,
          processingStatus: 'failed',
          error: normalizeText(_0x5a33d5?.['error']) || message,
        };
      },
    ),
    _0x23880d = (Array['isArray'](_0x23916e['shots']) ? _0x23916e['shots'] : [])['map']((_0x46ea4d) => {
      let _0x2d7e7e = _0x46ea4d,
        _0x3b7d33 = ![];
      normalizeText(_0x46ea4d?.['analysisStatus'])['toLowerCase']() === 'running' &&
        ((_0x2d7e7e = { ..._0x2d7e7e, analysisStatus: 'failed', reviewRequired: !![] }), (_0x3b7d33 = !![]));
      normalizeText(_0x46ea4d?.['materializationStatus'])['toLowerCase']() === 'running' &&
        ((_0x2d7e7e = {
          ..._0x2d7e7e,
          materializationStatus:
            normalizeText(_0x46ea4d?.['videoRef']) &&
            Boolean(_0x46ea4d?.['materializedIsReversed']) === Boolean(_0x46ea4d?.['isReversed'])
              ? 'succeeded'
              : 'failed',
          materializationProgress:
            normalizeText(_0x46ea4d?.['videoRef']) &&
            Boolean(_0x46ea4d?.['materializedIsReversed']) === Boolean(_0x46ea4d?.['isReversed'])
              ? 0x64
              : 0x0,
        }),
        (_0x3b7d33 =
          _0x3b7d33 ||
          !normalizeText(_0x46ea4d?.['videoRef']) ||
          Boolean(_0x46ea4d?.['materializedIsReversed']) !== Boolean(_0x46ea4d?.['isReversed'])));
      ACTIVE_RUNTIME_TASK_STATUSES['has'](normalizeText(_0x46ea4d?.['generationStatus'])['toLowerCase']()) &&
        !_0x5764dd['has'](normalizeText(_0x46ea4d?.['id'])) &&
        ((_0x2d7e7e = {
          ..._0x2d7e7e,
          generationStatus: normalizeText(_0x46ea4d?.['resultVideoRef']) ? 'succeeded' : 'failed',
        }),
        (_0x3b7d33 = _0x3b7d33 || !normalizeText(_0x46ea4d?.['resultVideoRef'])));
      if (!_0x3b7d33 && _0x2d7e7e === _0x46ea4d) return _0x46ea4d;
      return (
        (_0x27d6e3 = !![]),
        { ..._0x2d7e7e, ...(_0x3b7d33 ? { error: normalizeText(_0x46ea4d?.['error']) || message } : {}) }
      );
    }),
    _0x2fe29d = (_0x5c64ab, _0x3245a9, { getRecoverableTask: getRecoverableTask = null } = {}) => {
      const _0x15c094 = normalizeText(_0x5c64ab?.['status'])['toLowerCase']();
      if (!ACTIVE_RUNTIME_TASK_STATUSES['has'](_0x15c094)) return _0x5c64ab;
      if (typeof getRecoverableTask === 'function' && getRecoverableTask(_0x5c64ab)) return _0x5c64ab;
      const _0x3f3a05 = normalizeText(_0x5c64ab?.['shotId']),
        _0xe2c63b = _0x23880d['find']((_0x12d5d0) => normalizeText(_0x12d5d0?.['id']) === _0x3f3a05),
        _0x12c0db = Boolean(normalizeText(_0xe2c63b?.[_0x3245a9]));
      return (
        (_0x27d6e3 = !![]),
        {
          ..._0x5c64ab,
          status: _0x12c0db ? 'succeeded' : 'failed',
          error: _0x12c0db ? '' : normalizeText(_0x5c64ab?.['error']) || message,
        }
      );
    };
  ((_0x3cfc4b['imageGeneration'] = _0x2fe29d(_0x3cfc4b['imageGeneration'], 'replacementImageRef', {
    getRecoverableTask: preserveRecoverableTasks ? getRecoverablePersonReplacementImageTask : null,
  })),
    Object['entries'](_0x3cfc4b['imageGenerationsByShotId'] || {})['forEach'](([_0x1117ad, _0x125a94]) => {
      const _0x465028 = _0x2fe29d({ ..._0x125a94, shotId: _0x1117ad }, 'replacementImageRef', {
        getRecoverableTask: preserveRecoverableTasks ? getRecoverablePersonReplacementImageTask : null,
      });
      Object['assign'](_0x3cfc4b, updatePersonReplacementImageGenerationState(_0x3cfc4b, _0x465028));
    }),
    (_0x3cfc4b['videoGeneration'] = _0x2fe29d(_0x3cfc4b['videoGeneration'], 'resultVideoRef', {
      getRecoverableTask: preserveRecoverableTasks ? getRecoverablePersonReplacementVideoTask : null,
    })),
    Object['entries'](_0x3cfc4b['videoGenerationsByShotId'] || {})['forEach'](([_0x13c7ef, _0x43b8e0]) => {
      const _0x39865a = _0x2fe29d({ ..._0x43b8e0, shotId: _0x13c7ef }, 'resultVideoRef', {
        getRecoverableTask: preserveRecoverableTasks ? getRecoverablePersonReplacementVideoTask : null,
      });
      Object['assign'](_0x3cfc4b, updatePersonReplacementVideoGenerationState(_0x3cfc4b, _0x39865a));
    }));
  if (!_0x27d6e3) return { project: _0x23916e, changed: ![] };
  return {
    project: { ..._0x23916e, sources: _0x54ec8a, shots: _0x23880d, workspace: _0x3cfc4b },
    changed: !![],
  };
}
export function createReplacementStudioProjectSession({
  initialProject: initialProject = {},
  now: now = () => new Date()['toISOString'](),
} = {}) {
  let _0x3b49b4 = normalizeReplacementStudioApplicationProject(initialProject, {}),
    _0x4a6623 = ![],
    _0x597494 = { rememberProject: null, presentProject: null, schedulePersistence: null };
  const _0x6348f0 = new Set(),
    _0x17376c = () => {
      if (_0x4a6623) throw new Error('Replacement Studio Project Session has been destroyed');
    },
    _0x1d76a7 = () => cloneJson(_0x3b49b4),
    _0x520024 = ({
      previousProject: _0x3f0aa7,
      reason: _0x15ab5c,
      source: _0x5e2d08,
      presentation: _0x5529eb,
      persist: _0x48c84f,
    }) => {
      const _0x28f1ec = _0x1d76a7();
      reportReplacementTaskCenter(_0x28f1ec);
      let _0x1a322c;
      const _0x5737ff = Object['freeze']({
        project: _0x28f1ec,
        get previousProject() {
          return (_0x1a322c ??= cloneJson(_0x3f0aa7));
        },
        reason: _0x15ab5c,
        source: _0x5e2d08,
        presentation: _0x5529eb,
        persist: _0x48c84f,
      });
      _0x6348f0['forEach']((_0x50724e) => _0x50724e(_0x5737ff));
      if (_0x48c84f) _0x597494['rememberProject']?.(_0x28f1ec);
      _0x5529eb !== 'none' &&
        _0x597494['presentProject']?.({
          project: _0x28f1ec,
          presentation: _0x5529eb,
          reason: _0x15ab5c,
          source: _0x5e2d08,
        });
      if (_0x48c84f) _0x597494['schedulePersistence']?.();
    },
    _0xc2c4b6 = (
      _0x713dcf,
      {
        persist: persist = !![],
        presentation: presentation = 'render',
        reason: reason = 'application-change',
        source: source = 'application',
        touchUpdatedAt: touchUpdatedAt = !![],
      } = {},
    ) => {
      _0x17376c();
      if (!PRESENTATION_MODES['has'](presentation))
        throw new TypeError('Unsupported Replacement Studio presentation mode: ' + presentation);
      const _0x2bb9f5 = _0x3b49b4,
        _0x422427 = _0x713dcf && typeof _0x713dcf === 'object' ? _0x713dcf : {};
      return (
        (_0x3b49b4 = normalizeReplacementStudioApplicationProject(
          { ..._0x422427, ...(touchUpdatedAt ? { updatedAt: now() } : {}) },
          _0x2bb9f5,
        )),
        (_0x3b49b4 = syncPersonReplacementPromptReferences(_0x2bb9f5, _0x3b49b4)),
        _0x520024({
          previousProject: _0x2bb9f5,
          reason: normalizeText(reason),
          source: normalizeText(source) || 'application',
          presentation: presentation,
          persist: persist === !![],
        }),
        _0x1d76a7()
      );
    };
  return Object['freeze']({
    connect(_0x344b0f = {}) {
      (_0x17376c(),
        (_0x597494 = {
          rememberProject:
            typeof _0x344b0f['rememberProject'] === 'function' ? _0x344b0f['rememberProject'] : null,
          presentProject:
            typeof _0x344b0f['presentProject'] === 'function' ? _0x344b0f['presentProject'] : null,
          schedulePersistence:
            typeof _0x344b0f['schedulePersistence'] === 'function' ? _0x344b0f['schedulePersistence'] : null,
        }));
    },
    getProject: _0x1d76a7,
    replace: _0xc2c4b6,
    commitWorkspaceProject(_0x2e4576, { reason: reason = '' } = {}) {
      return (
        _0x17376c(),
        _0xc2c4b6(
          reconcileWorkspaceProject(
            _0x3b49b4,
            _0x2e4576 && typeof _0x2e4576 === 'object' ? _0x2e4576 : {},
            normalizeText(reason),
          ),
          { persist: !![], presentation: 'none', reason: reason, source: 'workspace' },
        )
      );
    },
    subscribe(_0x40ec99) {
      _0x17376c();
      if (typeof _0x40ec99 !== 'function') return () => {};
      return (_0x6348f0['add'](_0x40ec99), () => _0x6348f0['delete'](_0x40ec99));
    },
    destroy() {
      if (_0x4a6623) return;
      ((_0x4a6623 = !![]),
        _0x6348f0['clear'](),
        (_0x597494 = { rememberProject: null, presentProject: null, schedulePersistence: null }));
    },
  });
}

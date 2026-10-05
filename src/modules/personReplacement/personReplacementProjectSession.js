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
  PERSON_REPLACEMENT_LAYOUT_DEFAULTS = Object['freeze']({ left: 24, right: 32, centerTop: 0x44 }),
  PERSON_REPLACEMENT_VOICE_LAYOUT_DEFAULTS = Object['freeze']({ assetsEnd: 16, sourcesEnd: 38 }),
  PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_DEFAULT = 320;
export const PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE = Object['freeze']({ min: 240, max: 720 });
const WORKSPACE_PROJECT_PROJECTION_FIELDS = new Set([
  'libraryProjects',
  'libraryAssets',
  'sourcePreviewRefs',
  'persistenceState',
]);
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneJson(item) {
  return JSON['parse'](JSON['stringify'](item));
}
function clamp(key, index, result, data = index) {
  const options = Number(key);
  return Number['isFinite'](options) ? Math['min'](result, Math['max'](index, options)) : data;
}
function normalizeMediaUrl(target) {
  const text = normalizeText(target);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
function normalizeLibraryAssetForProjectSession(error2 = {}, next = 0) {
  const sourceAssetId =
      normalizeText(error2['assetId'] || error2['sourceAssetId'] || error2['id']) || 'asset-' + (next + 1),
    sourceItemIndex = Math['max'](
      0,
      Math['trunc'](Number(error2['itemIndex'] ?? error2['sourceItemIndex']) || 0),
    ),
    mediaKind = (normalizeText(error2['type'] || error2['mediaKind']) || 'image')['toLowerCase'](),
    assetName = normalizeText(error2['assetName']) || normalizeText(error2['name']) || '画布素材',
    thumbnailUrl = normalizeMediaUrl(error2['thumbUrl'] || error2['thumbnailUrl']),
    sourceUrl = normalizeMediaUrl(
      error2['url'] ||
        error2['sourceUrl'] ||
        (mediaKind === 'audio' ? error2['audioUrl'] : error2['imageUrl']),
    ),
    role = mediaKind === 'audio' ? '音频' : mediaKind === 'video' ? '视频' : '图片',
    name =
      mediaKind === 'audio'
        ? getPersonReplacementAudioSavedName(error2)
        : normalizeText(error2['name']) || assetName;
  return {
    ...error2,
    id: 'library-' + sourceAssetId + '-' + sourceItemIndex,
    sourceAssetId: sourceAssetId,
    sourceItemIndex: sourceItemIndex,
    kind: 'library',
    mediaKind: mediaKind,
    name: name,
    ...(mediaKind === 'audio' ? { savedName: name } : {}),
    assetName: assetName,
    role: role + '素材',
    occurrences: '来自画布素材',
    description:
      mediaKind === 'audio'
        ? ''
        : normalizeText(error2['description']) || '来自画布素材「' + assetName + '」',
    prompt: '',
    imageUrl: mediaKind === 'image' ? sourceUrl || thumbnailUrl : thumbnailUrl,
    audioUrl: mediaKind === 'audio' ? sourceUrl : '',
    thumbnailUrl: thumbnailUrl,
    sourceUrl: sourceUrl || thumbnailUrl,
    isLibraryAsset: true,
  };
}
function getActiveCharacterAppearanceKeys(options2 = {}) {
  return new Set(
    (Array['isArray'](options2['characters']) ? options2['characters'] : [])['flatMap']((current) =>
      (Array['isArray'](current?.['appearances']) ? current['appearances'] : [])
        ['filter'](
          (entry) =>
            !normalizeText(entry?.['imageUrl']) &&
            !normalizeText(entry?.['error']) &&
            ACTIVE_CHARACTER_APPEARANCE_STATUSES['has'](
              normalizeText(entry?.['generationStatus'])['toLowerCase'](),
            ),
        )
        ['map']((record) => normalizeText(current?.['id']) + ':' + normalizeText(record?.['id']))
        ['filter']((enabled) => !enabled['startsWith'](':') && !enabled['endsWith'](':')),
    ),
  );
}
export function normalizePersonReplacementLayout(options3 = {}) {
  const box = options3 && typeof options3 === 'object' ? options3 : {};
  return {
    left: clamp(box['left'], 18, 38, PERSON_REPLACEMENT_LAYOUT_DEFAULTS['left']),
    right: clamp(box['right'], 24, 42, PERSON_REPLACEMENT_LAYOUT_DEFAULTS['right']),
    centerTop: clamp(box['centerTop'], 38, 82, PERSON_REPLACEMENT_LAYOUT_DEFAULTS['centerTop']),
  };
}
export function normalizePersonReplacementAssetDetailSplitRatio(payload) {
  return normalizeWorkspaceAssetDetailSplitRatio(payload);
}
export function normalizePersonReplacementVoiceLayout(options4 = {}) {
  const handle = options4 && typeof options4 === 'object' ? options4 : {},
    assetsEnd = clamp(handle['assetsEnd'], 16, 32, PERSON_REPLACEMENT_VOICE_LAYOUT_DEFAULTS['assetsEnd']);
  return {
    assetsEnd: assetsEnd,
    sourcesEnd: clamp(
      handle['sourcesEnd'],
      assetsEnd + 16,
      60,
      Math['max'](PERSON_REPLACEMENT_VOICE_LAYOUT_DEFAULTS['sourcesEnd'], assetsEnd + 16),
    ),
  };
}
export function normalizePersonReplacementCompositeSidebarWidth(state) {
  return clamp(
    state,
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE['min'],
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_RANGE['max'],
    PERSON_REPLACEMENT_COMPOSITE_SIDEBAR_WIDTH_DEFAULT,
  );
}
export function normalizePersonReplacementPersistenceState(options5 = {}) {
  const response = options5 && typeof options5 === 'object' ? options5 : {},
    status2 = ['idle', 'pending', 'saving', 'saved', 'error']['includes'](response['status'])
      ? response['status']
      : 'saved';
  return {
    status: status2,
    error: normalizeText(response['error']),
    retryAttempt: Math['max'](0, Math['trunc'](Number(response['retryAttempt']) || 0)),
  };
}
export function isPersonReplacementSourceProcessing(options6 = {}) {
  const config = options6?.['workspace'] || {},
    text2 = normalizeText(config['sourceAnalysis']?.['status'])['toLowerCase'](),
    text3 = normalizeText(config['videoPreparation']?.['status'])['toLowerCase']();
  return text3 === 'running' || ACTIVE_SOURCE_ANALYSIS_STATUSES['has'](text2);
}
export function getPersonReplacementProjectTaskSummary(options7 = {}) {
  const scope = options7?.['workspace'] || {},
    text4 = normalizeText(scope['sourceAnalysis']?.['status'])['toLowerCase'](),
    text5 = normalizeText(scope['videoPreparation']?.['status'])['toLowerCase']();
  if (isPersonReplacementSourceProcessing(options7)) {
    const input = text5 === 'running',
      output = Math['round'](
        clamp(
          input ? scope['videoPreparation']?.['progress'] : scope['sourceAnalysis']?.['progress'],
          0,
          100,
          0,
        ),
      );
    return {
      activeCount: 1,
      failedCount: 0,
      label: (input ? '正在准备镜头' : '视频处理中') + ' · ' + output + '%',
    };
  }
  const activeCount = new Set(),
    failedCount = new Set();
  (text4 === 'failed' || text5 === 'failed') && failedCount['add']('source:processing');
  const run = (value2, value3, value4) => {
      const text6 = normalizeText(value3);
      if (!text6) return;
      const text7 = normalizeText(value4)['toLowerCase']();
      if (ACTIVE_RUNTIME_TASK_STATUSES['has'](text7))
        (activeCount['add'](value2 + ':' + text6), failedCount['delete'](value2 + ':' + text6));
      else FAILED_PROJECT_TASK_STATUSES['has'](text7) && failedCount['add'](value2 + ':' + text6);
    },
    handler = (value5, enabled2 = {}) => {
      if (!enabled2 || typeof enabled2 !== 'object' || Array['isArray'](enabled2)) return;
      Object['entries'](enabled2)['forEach'](([value6, response2]) => {
        run(value5, value6, response2?.['status']);
      });
    };
  (handler('image', scope['imageGenerationsByShotId']), handler('video', scope['videoGenerationsByShotId']));
  const run2 = (value7, response3 = {}) => {
    run(value7, response3?.['shotId'], response3?.['status']);
  };
  return (
    run2('image', scope['imageGeneration']),
    run2('video', scope['videoGeneration']),
    (Array['isArray'](scope['generatingAppearanceKeys']) ? scope['generatingAppearanceKeys'] : [])
      ['map'](normalizeText)
      ['filter'](Boolean)
      ['forEach']((value8) => {
        activeCount['add']('appearance:' + value8);
      }),
    (Array['isArray'](options7?.['characters']) ? options7['characters'] : [])['forEach']((value9) => {
      (Array['isArray'](value9?.['appearances']) ? value9['appearances'] : [])['forEach']((value10) => {
        const text8 = normalizeText(value9?.['id']) + ':' + normalizeText(value10?.['id']),
          text9 = normalizeText(value10?.['generationStatus'])['toLowerCase']();
        if (ACTIVE_CHARACTER_APPEARANCE_STATUSES['has'](text9))
          (activeCount['add']('appearance:' + text8), failedCount['delete']('appearance:' + text8));
        else FAILED_PROJECT_TASK_STATUSES['has'](text9) && failedCount['add']('appearance:' + text8);
      });
    }),
    (Array['isArray'](options7?.['shots']) ? options7['shots'] : [])['forEach']((value11) => {
      run('video', value11?.['id'], value11?.['generationStatus']);
    }),
    getWorkspaceProjectTaskPresentation({
      activeCount: activeCount['size'],
      failedCount: failedCount['size'],
    })
  );
}
export function normalizePersonReplacementWorkspaceProject(options8 = {}) {
  const value12 = options8 && typeof options8 === 'object' ? options8 : {},
    args = normalizePersonReplacementProject(value12),
    view = value12['workspace'] && typeof value12['workspace'] === 'object' ? value12['workspace'] : {},
    text10 = normalizeText(view['selectedShotId'] || value12['selectedShotId']),
    selectedShotId = args['shots']['some']((value13) => value13['id'] === text10)
      ? text10
      : args['shots'][0]?.['id'] || '',
    text11 = normalizeText(view['selectedCharacterId']),
    selectedCharacterId = args['characters']['some']((value14) => value14['id'] === text11)
      ? text11
      : args['characters'][0]?.['id'] || '',
    text12 = normalizeText(view['selectedSceneId']),
    selectedSceneId = args['scenes']['some']((value15) => value15['id'] === text12)
      ? text12
      : args['scenes'][0]?.['id'] || '',
    text13 = normalizeText(view['selectedAudioAssetId']),
    selectedAudioAssetId = args['audioAssets']['some']((value16) => value16['id'] === text13)
      ? text13
      : args['audioAssets'][0]?.['id'] || '',
    text14 = normalizeText(view['selectedVoiceSourceId']),
    selectedVoiceSourceId = args['sources']['some']((value17) => value17['id'] === text14)
      ? text14
      : args['sources'][0]?.['id'] || '',
    libraryAssets = Array['isArray'](value12['libraryAssets'])
      ? value12['libraryAssets']
          ['filter']((value18) =>
            ['image', 'audio']['includes'](
              (normalizeText(value18?.['type'] || value18?.['mediaKind']) || 'image')['toLowerCase'](),
            ),
          )
          ['map'](normalizeLibraryAssetForProjectSession)
      : [],
    text15 = normalizeText(view['selectedLibraryAssetId']),
    selectedLibraryAssetId = libraryAssets['some']((value19) => value19['id'] === text15)
      ? text15
      : libraryAssets[0]?.['id'] || '',
    value20 =
      value12['sourcePreviewRefs'] && typeof value12['sourcePreviewRefs'] === 'object'
        ? value12['sourcePreviewRefs']
        : {},
    sourcePreviewRefs = Object['fromEntries'](
      args['sources']
        ['map']((value21) => [value21['id'], normalizeText(value20[value21['id']])])
        ['filter'](([, value22]) => value22['startsWith']('blob:')),
    ),
    map = getActiveCharacterAppearanceKeys(args),
    value23 = Math['trunc'](clamp(view['step'] ?? value12['step'], 1, 5, 1)),
    imageGeneration = normalizePersonReplacementImageGenerationState(view['imageGeneration']),
    imageGenerationsByShotId = normalizePersonReplacementImageGenerationsByShotId(
      view['imageGenerationsByShotId'],
      args['shots'],
      imageGeneration,
    ),
    value24 = Object['values'](imageGenerationsByShotId)['find'](
      (response4) => response4['status'] === 'running',
    ),
    personReplacementVideoGenerationState = normalizePersonReplacementVideoGenerationState(
      view['videoGeneration'],
    ),
    videoGenerationsByShotId = normalizePersonReplacementVideoGenerationsByShotId(
      view['videoGenerationsByShotId'],
      args['shots'],
      personReplacementVideoGenerationState,
    ),
    value25 = Object['values'](videoGenerationsByShotId)['find'](isPersonReplacementVideoGenerationActive);
  return {
    ...args,
    persistenceState: normalizePersonReplacementPersistenceState(value12['persistenceState']),
    ...(Object['keys'](sourcePreviewRefs)['length'] ? { sourcePreviewRefs: sourcePreviewRefs } : {}),
    libraryProjects: Array['isArray'](value12['libraryProjects']) ? value12['libraryProjects'] : [],
    libraryAssets: libraryAssets,
    workspace: {
      view: view['view'] === 'project' ? 'project' : 'home',
      step: getPersonReplacementAccessibleStep(args, value23),
      selectedShotId: selectedShotId,
      selectedShotIds: Array['isArray'](view['selectedShotIds'])
        ? view['selectedShotIds']
            ['map'](normalizeText)
            ['filter']((value26) => args['shots']['some']((value27) => value27['id'] === value26))
        : [],
      shotSelectionMode: view['shotSelectionMode'] === true,
      selectedCharacterId: selectedCharacterId,
      selectedSceneId: selectedSceneId,
      selectedAudioAssetId: selectedAudioAssetId,
      selectedLibraryAssetId: selectedLibraryAssetId,
      selectedVoiceSourceId: selectedVoiceSourceId,
      characterAssetTab: ['character', 'scene', 'audio', 'library']['includes'](view['characterAssetTab'])
        ? view['characterAssetTab']
        : 'character',
      replacementLayout: normalizePersonReplacementLayout(view['replacementLayout']),
      voiceLayout: normalizePersonReplacementVoiceLayout(view['voiceLayout']),
      assetPromptPresetId: normalizePersonReplacementAssetPromptPresetId(view['assetPromptPresetId']),
      selectedAssetIds: Array['isArray'](view['selectedAssetIds'])
        ? view['selectedAssetIds']['map'](normalizeText)['filter'](Boolean)
        : [],
      assetSelectionMode: view['assetSelectionMode'] === true,
      assetAppearanceIndexes:
        view['assetAppearanceIndexes'] && typeof view['assetAppearanceIndexes'] === 'object'
          ? { ...view['assetAppearanceIndexes'] }
          : {},
      assetSplitRatio: clamp(view['assetSplitRatio'], 28, 72, 50),
      assetDetailSplitRatio: normalizePersonReplacementAssetDetailSplitRatio(view['assetDetailSplitRatio']),
      compositeSidebarWidth: normalizePersonReplacementCompositeSidebarWidth(view['compositeSidebarWidth']),
      compositePreviewMode:
        view['compositePreviewMode'] === 'full' &&
        Boolean(args['output']['originalMasterRef']) &&
        Boolean(args['output']['finalVideoRef'] || args['output']['visualMasterRef'])
          ? 'full'
          : 'shot',
      generatingAppearanceKeys: Array['isArray'](view['generatingAppearanceKeys'])
        ? view['generatingAppearanceKeys']['map'](normalizeText)['filter']((value28) => map['has'](value28))
        : [],
      imageGeneration:
        imageGeneration['status'] === 'running' &&
        imageGenerationsByShotId[imageGeneration['shotId']]?.['status'] === 'running'
          ? imageGenerationsByShotId[imageGeneration['shotId']]
          : value24 || imageGeneration,
      imageGenerationsByShotId: imageGenerationsByShotId,
      videoGeneration:
        isPersonReplacementVideoGenerationActive(personReplacementVideoGenerationState) &&
        isPersonReplacementVideoGenerationActive(
          videoGenerationsByShotId[personReplacementVideoGenerationState['shotId']],
        )
          ? videoGenerationsByShotId[personReplacementVideoGenerationState['shotId']]
          : value25 || personReplacementVideoGenerationState,
      videoGenerationsByShotId: videoGenerationsByShotId,
      videoPreparation: view['videoPreparation'] || { status: 'idle', progress: 0, error: '' },
      sourceAnalysis: view['sourceAnalysis'] || { status: 'idle', progress: 0 },
      smartClipSettingsOpen: view['smartClipSettingsOpen'] === true,
      identityAnalysis: view['identityAnalysis'] || {
        status: 'idle',
        modelId: '',
        stats: {},
        error: '',
      },
      selectedIdentityIds: Array['isArray'](view['selectedIdentityIds'])
        ? view['selectedIdentityIds']
            ['map'](normalizeText)
            ['filter']((value29) => args['sourceCharacters']['some']((value30) => value30['id'] === value29))
        : [],
      removedCustomPersonLabels: [
        ...new Set(
          (Array['isArray'](view['removedCustomPersonLabels']) ? view['removedCustomPersonLabels'] : [])
            ['map'](normalizeText)
            ['filter']((value31) => value31 && !isGeneratedPersonReplacementLabel(value31)),
        ),
      ],
      identityCorrectionDrafts: normalizePersonReplacementIdentityCorrectionDrafts(
        view['identityCorrectionDrafts'],
        args['shots'],
        args['sourceCharacters'],
      ),
      characterImageGeneration: view['characterImageGeneration'] || {
        status: 'idle',
        characterId: '',
        appearanceId: '',
        error: '',
      },
      projectSearchQuery: normalizeText(view['projectSearchQuery']),
      projectSortOrder: normalizeWorkspaceProjectSortOrder(view['projectSortOrder']),
      showArchivedProjects: view['showArchivedProjects'] === true,
      openProjectMenuId: normalizeText(view['openProjectMenuId']),
      pendingDeleteProjectId: normalizeText(view['pendingDeleteProjectId']),
    },
  };
}
export function createPersonReplacementWorkspaceProject(options9 = {}, value32 = {}) {
  const libraryProjects = options9 && typeof options9 === 'object' ? options9 : {},
    args2 = normalizePersonReplacementProject(libraryProjects),
    args3 = value32?.['workspace'] && typeof value32['workspace'] === 'object' ? value32['workspace'] : {},
    selectedShotId2 =
      libraryProjects['workspace'] && typeof libraryProjects['workspace'] === 'object'
        ? libraryProjects['workspace']
        : {},
    shots = args2['shots']['map']((persons, value33) => ({
      ...persons,
      title:
        normalizeText(
          libraryProjects['shots']?.['find']?.((value34) => value34?.['id'] === persons['id'])?.['title'],
        ) || '片段 ' + String(value33 + 1)['padStart'](2, '0'),
      thumbnailUrl: normalizeMediaUrl(persons['keyframeRef']),
      keyframeUrl: normalizeMediaUrl(persons['keyframeRef']),
      persons: persons['people']['map']((args4, value35) => ({
        ...args4,
        label: normalizeText(args4['label']) || formatPersonReplacementPersonLabel(value35),
      })),
    })),
    workspace = {
      ...args3,
      ...selectedShotId2,
      selectedShotId:
        selectedShotId2['selectedShotId'] ||
        libraryProjects['selectedShotId'] ||
        args3['selectedShotId'] ||
        shots[0]?.['id'] ||
        '',
    },
    libraryAssets2 = Array['isArray'](libraryProjects['libraryAssets']),
    selectedShotId3 = normalizePersonReplacementWorkspaceProject({
      ...args2,
      shots: shots,
      libraryProjects: libraryProjects['libraryProjects'] || [],
      libraryAssets: libraryAssets2 ? libraryProjects['libraryAssets'] : [],
      workspace: workspace,
    });
  return {
    ...selectedShotId3,
    workspace: {
      ...selectedShotId3['workspace'],
      selectedLibraryAssetId: libraryAssets2
        ? selectedShotId3['workspace']['selectedLibraryAssetId']
        : normalizeText(workspace['selectedLibraryAssetId']),
    },
    selectedShotId: selectedShotId3['workspace']['selectedShotId'],
    step: selectedShotId3['workspace']['step'],
    source: {
      ...selectedShotId3['source'],
      name: selectedShotId3['source']['fileName'],
      analysisStatus: selectedShotId3['source']['processingStatus'],
      analysisProgress: selectedShotId3['source']['processingProgress'],
      shotCount: shots['length'],
      keyframeCount: shots['filter']((value36) => value36['keyframeRef'])['length'],
    },
    shots: shots,
  };
}
function stripWorkspaceProjectProjection(enabled3 = {}) {
  if (!enabled3 || typeof enabled3 !== 'object' || Array['isArray'](enabled3)) return {};
  return Object['fromEntries'](
    Object['entries'](enabled3)['filter'](
      ([value37]) => !WORKSPACE_PROJECT_PROJECTION_FIELDS['has'](value37),
    ),
  );
}
export function normalizeReplacementStudioApplicationProject(options10 = {}, value38 = {}) {
  return stripWorkspaceProjectProjection(
    createPersonReplacementWorkspaceProject(
      stripWorkspaceProjectProjection(options10),
      stripWorkspaceProjectProjection(value38),
    ),
  );
}
function applyEditedShotMappings(options11 = {}) {
  const shots2 = (Array['isArray'](options11['shots']) ? options11['shots'] : [])['map']((args5) => ({
      ...args5,
      people: Array['isArray'](args5['persons'])
        ? args5['persons']['map']((args6) => ({ ...args6 }))
        : Array['isArray'](args5['people'])
          ? args5['people']['map']((args7) => ({ ...args7 }))
          : [],
    })),
    map2 = getPersonReplacementCrossRoleSourceCharacterIds({ shots: shots2 }),
    map3 = new Map(
      (Array['isArray'](options11['mappings']) ? options11['mappings'] : [])
        ['map']((value39) => [
          normalizeText(value39?.['sourceCharacterId']),
          normalizeText(value39?.['targetCharacterId']),
        ])
        ['filter'](([value40]) => value40 && !map2['has'](value40)),
    );
  return (
    shots2['forEach']((value41) =>
      value41['people']['forEach']((value42) => {
        const text16 = normalizeText(value42['sourceCharacterId']),
          text17 = normalizeText(value42['targetCharacterId']);
        text16 &&
          text17 &&
          value42['projectMappingDisabled'] !== true &&
          !map2['has'](text16) &&
          !map3['has'](text16) &&
          map3['set'](text16, text17);
      }),
    ),
    {
      shots: shots2['map']((people) => ({
        ...people,
        people: people['people']['map']((args8) => ({
          ...args8,
          targetCharacterId:
            normalizeText(args8['targetCharacterId']) ||
            (args8['projectMappingDisabled'] === true
              ? ''
              : map3['get'](normalizeText(args8['sourceCharacterId']))) ||
            '',
        })),
      })),
      mappings: [...map3['entries']()]
        ['filter'](([value43, value44]) => value43 && value44)
        ['map'](([sourceCharacterId, targetCharacterId]) => ({
          sourceCharacterId: sourceCharacterId,
          targetCharacterId: targetCharacterId,
        })),
    }
  );
}
function reconcileWorkspaceProject(value45, args9, selectedSourceId) {
  const shots3 = applyEditedShotMappings(args9);
  return {
    ...args9,
    audio: {
      ...args9['audio'],
      selectedSourceId:
        selectedSourceId === 'voice-source'
          ? normalizeText(args9['workspace']?.['selectedVoiceSourceId']) ||
            value45['audio']?.['selectedSourceId']
          : args9['audio']?.['selectedSourceId'],
      voiceStudioState: {
        ...(args9['audio']?.['voiceStudioState'] || {}),
        ...(value45['audio']?.['voiceStudioState'] || {}),
      },
    },
    shots: shots3['shots'],
    sourceCharacters: buildPersonReplacementSourceCharacters(shots3['shots'], value45['sourceCharacters']),
    mappings: shots3['mappings'],
  };
}
function settleInterruptedCharacterAppearanceGenerations(options12 = {}) {
  const project = options12 && typeof options12 === 'object' ? options12 : {},
    map4 = new Set(
      Array['isArray'](project['workspace']?.['generatingAppearanceKeys'])
        ? project['workspace']['generatingAppearanceKeys']['map'](normalizeText)['filter'](Boolean)
        : [],
    );
  let enabled4 = map4['size'] > 0;
  const characters = (Array['isArray'](project['characters']) ? project['characters'] : [])['map'](
    (args10) => {
      let enabled5 = false;
      const appearances = (Array['isArray'](args10?.['appearances']) ? args10['appearances'] : [])['map'](
        (args11) => {
          const text18 = normalizeText(args10?.['id']) + ':' + normalizeText(args11?.['id']),
            text19 = normalizeText(args11?.['generationStatus'])['toLowerCase'](),
            value46 = Boolean(normalizeText(args11?.['imageUrl'])),
            enabled6 = map4['has'](text18),
            enabled7 = ACTIVE_CHARACTER_APPEARANCE_STATUSES['has'](text19);
          if (!enabled6 && !enabled7) return args11;
          if (value46) {
            const value47 = text19 !== 'succeeded' || Boolean(normalizeText(args11?.['error']));
            return (
              (enabled5 = enabled5 || value47),
              value47 ? { ...args11, generationStatus: 'succeeded', error: '' } : args11
            );
          }
          if (!enabled7 && ['failed', 'cancelled']['includes'](text19)) return args11;
          return (
            (enabled5 = true),
            {
              ...args11,
              generationStatus: 'failed',
              error: normalizeText(args11?.['error']) || INTERRUPTED_CHARACTER_APPEARANCE_ERROR,
            }
          );
        },
      );
      if (!enabled5) return args10;
      return ((enabled4 = true), { ...args10, appearances: appearances });
    },
  );
  if (!enabled4) return { project: project, changed: false };
  return {
    project: {
      ...project,
      characters: characters,
      workspace: { ...project['workspace'], generatingAppearanceKeys: [] },
    },
    changed: true,
  };
}
export function settleInterruptedReplacementStudioProjectTasks(
  options13 = {},
  {
    preserveRecoverableTasks: preserveRecoverableTasks = true,
    message: message = INTERRUPTED_PROJECT_TASK_ERROR,
  } = {},
) {
  const settleInterruptedCharacterAppearanceGenerations2 =
      settleInterruptedCharacterAppearanceGenerations(options13),
    project2 = settleInterruptedCharacterAppearanceGenerations2['project'];
  let enabled8 = settleInterruptedCharacterAppearanceGenerations2['changed'];
  const workspace2 = { ...(project2['workspace'] || {}) },
    map5 = new Set(
      Object['entries'](workspace2['videoGenerationsByShotId'] || {})['flatMap'](([shotId, args12]) =>
        preserveRecoverableTasks && getRecoverablePersonReplacementVideoTask({ ...args12, shotId: shotId })
          ? [normalizeText(shotId)]
          : [],
      ),
    ),
    value48 = preserveRecoverableTasks
      ? getRecoverablePersonReplacementVideoTask(workspace2['videoGeneration'])
      : null;
  value48 && map5['add'](normalizeText(workspace2['videoGeneration']?.['shotId']));
  const text20 = normalizeText(workspace2['sourceAnalysis']?.['status'])['toLowerCase']();
  ACTIVE_SOURCE_ANALYSIS_STATUSES['has'](text20) &&
    ((workspace2['sourceAnalysis'] = {
      ...workspace2['sourceAnalysis'],
      status: 'failed',
      error: normalizeText(workspace2['sourceAnalysis']?.['error']) || message,
    }),
    (enabled8 = true));
  const text21 = normalizeText(workspace2['identityAnalysis']?.['status'])['toLowerCase']();
  ACTIVE_RUNTIME_TASK_STATUSES['has'](text21) &&
    ((workspace2['identityAnalysis'] = {
      ...workspace2['identityAnalysis'],
      status: 'failed',
      error: normalizeText(workspace2['identityAnalysis']?.['error']) || message,
    }),
    (enabled8 = true));
  normalizeText(workspace2['videoPreparation']?.['status'])['toLowerCase']() === 'running' &&
    ((workspace2['videoPreparation'] = {
      ...workspace2['videoPreparation'],
      status: 'failed',
      error: normalizeText(workspace2['videoPreparation']?.['error']) || message,
    }),
    (enabled8 = true));
  const sources = (Array['isArray'](project2['sources']) ? project2['sources'] : [])['map']((args13) => {
      const text22 = normalizeText(args13?.['processingStatus'])['toLowerCase']();
      if (!ACTIVE_SOURCE_ANALYSIS_STATUSES['has'](text22)) return args13;
      enabled8 = true;
      if (text22 === 'uploading' && normalizeText(args13?.['videoRef']))
        return { ...args13, processingStatus: 'ready-to-start', error: '' };
      return {
        ...args13,
        processingStatus: 'failed',
        error: normalizeText(args13?.['error']) || message,
      };
    }),
    shots4 = (Array['isArray'](project2['shots']) ? project2['shots'] : [])['map']((value49) => {
      let args14 = value49,
        enabled9 = false;
      normalizeText(value49?.['analysisStatus'])['toLowerCase']() === 'running' &&
        ((args14 = { ...args14, analysisStatus: 'failed', reviewRequired: true }), (enabled9 = true));
      normalizeText(value49?.['materializationStatus'])['toLowerCase']() === 'running' &&
        ((args14 = {
          ...args14,
          materializationStatus:
            normalizeText(value49?.['videoRef']) &&
            Boolean(value49?.['materializedIsReversed']) === Boolean(value49?.['isReversed'])
              ? 'succeeded'
              : 'failed',
          materializationProgress:
            normalizeText(value49?.['videoRef']) &&
            Boolean(value49?.['materializedIsReversed']) === Boolean(value49?.['isReversed'])
              ? 100
              : 0,
        }),
        (enabled9 =
          enabled9 ||
          !normalizeText(value49?.['videoRef']) ||
          Boolean(value49?.['materializedIsReversed']) !== Boolean(value49?.['isReversed'])));
      ACTIVE_RUNTIME_TASK_STATUSES['has'](normalizeText(value49?.['generationStatus'])['toLowerCase']()) &&
        !map5['has'](normalizeText(value49?.['id'])) &&
        ((args14 = {
          ...args14,
          generationStatus: normalizeText(value49?.['resultVideoRef']) ? 'succeeded' : 'failed',
        }),
        (enabled9 = enabled9 || !normalizeText(value49?.['resultVideoRef'])));
      if (!enabled9 && args14 === value49) return value49;
      return (
        (enabled8 = true),
        { ...args14, ...(enabled9 ? { error: normalizeText(value49?.['error']) || message } : {}) }
      );
    }),
    handler2 = (response5, value50, { getRecoverableTask: getRecoverableTask = null } = {}) => {
      const text23 = normalizeText(response5?.['status'])['toLowerCase']();
      if (!ACTIVE_RUNTIME_TASK_STATUSES['has'](text23)) return response5;
      if (typeof getRecoverableTask === 'function' && getRecoverableTask(response5)) return response5;
      const text24 = normalizeText(response5?.['shotId']),
        value51 = shots4['find']((value52) => normalizeText(value52?.['id']) === text24),
        status3 = Boolean(normalizeText(value51?.[value50]));
      return (
        (enabled8 = true),
        {
          ...response5,
          status: status3 ? 'succeeded' : 'failed',
          error: status3 ? '' : normalizeText(response5?.['error']) || message,
        }
      );
    };
  ((workspace2['imageGeneration'] = handler2(workspace2['imageGeneration'], 'replacementImageRef', {
    getRecoverableTask: preserveRecoverableTasks ? getRecoverablePersonReplacementImageTask : null,
  })),
    Object['entries'](workspace2['imageGenerationsByShotId'] || {})['forEach'](([shotId2, args15]) => {
      const value53 = handler2({ ...args15, shotId: shotId2 }, 'replacementImageRef', {
        getRecoverableTask: preserveRecoverableTasks ? getRecoverablePersonReplacementImageTask : null,
      });
      Object['assign'](workspace2, updatePersonReplacementImageGenerationState(workspace2, value53));
    }),
    (workspace2['videoGeneration'] = handler2(workspace2['videoGeneration'], 'resultVideoRef', {
      getRecoverableTask: preserveRecoverableTasks ? getRecoverablePersonReplacementVideoTask : null,
    })),
    Object['entries'](workspace2['videoGenerationsByShotId'] || {})['forEach'](([shotId3, args16]) => {
      const value54 = handler2({ ...args16, shotId: shotId3 }, 'resultVideoRef', {
        getRecoverableTask: preserveRecoverableTasks ? getRecoverablePersonReplacementVideoTask : null,
      });
      Object['assign'](workspace2, updatePersonReplacementVideoGenerationState(workspace2, value54));
    }));
  if (!enabled8) return { project: project2, changed: false };
  return {
    project: { ...project2, sources: sources, shots: shots4, workspace: workspace2 },
    changed: true,
  };
}
export function createReplacementStudioProjectSession({
  initialProject: initialProject = {},
  now: now = () => new Date()['toISOString'](),
} = {}) {
  let replacementStudioApplicationProject = normalizeReplacementStudioApplicationProject(initialProject, {}),
    value55 = false,
    value56 = { rememberProject: null, presentProject: null, schedulePersistence: null };
  const map6 = new Set(),
    handler3 = () => {
      if (value55) throw new Error('Replacement Studio Project Session has been destroyed');
    },
    getProject = () => cloneJson(replacementStudioApplicationProject),
    handler4 = ({
      previousProject: previousProject2,
      reason: reason2,
      source: source2,
      presentation: presentation2,
      persist: persist2,
    }) => {
      const project3 = getProject();
      reportReplacementTaskCenter(project3);
      let value57;
      const value58 = Object['freeze']({
        project: project3,
        get previousProject() {
          return (value57 ??= cloneJson(previousProject2));
        },
        reason: reason2,
        source: source2,
        presentation: presentation2,
        persist: persist2,
      });
      map6['forEach']((handler5) => handler5(value58));
      if (persist2) value56['rememberProject']?.(project3);
      presentation2 !== 'none' &&
        value56['presentProject']?.({
          project: project3,
          presentation: presentation2,
          reason: reason2,
          source: source2,
        });
      if (persist2) value56['schedulePersistence']?.();
    },
    replace = (
      value59,
      {
        persist: persist = true,
        presentation: presentation = 'render',
        reason: reason = 'application-change',
        source: source = 'application',
        touchUpdatedAt: touchUpdatedAt = true,
      } = {},
    ) => {
      handler3();
      if (!PRESENTATION_MODES['has'](presentation))
        throw new TypeError('Unsupported Replacement Studio presentation mode: ' + presentation);
      const previousProject3 = replacementStudioApplicationProject,
        args17 = value59 && typeof value59 === 'object' ? value59 : {};
      return (
        (replacementStudioApplicationProject = normalizeReplacementStudioApplicationProject(
          { ...args17, ...(touchUpdatedAt ? { updatedAt: now() } : {}) },
          previousProject3,
        )),
        (replacementStudioApplicationProject = syncPersonReplacementPromptReferences(
          previousProject3,
          replacementStudioApplicationProject,
        )),
        handler4({
          previousProject: previousProject3,
          reason: normalizeText(reason),
          source: normalizeText(source) || 'application',
          presentation: presentation,
          persist: persist === true,
        }),
        getProject()
      );
    };
  return Object['freeze']({
    connect(options14 = {}) {
      (handler3(),
        (value56 = {
          rememberProject:
            typeof options14['rememberProject'] === 'function' ? options14['rememberProject'] : null,
          presentProject:
            typeof options14['presentProject'] === 'function' ? options14['presentProject'] : null,
          schedulePersistence:
            typeof options14['schedulePersistence'] === 'function' ? options14['schedulePersistence'] : null,
        }));
    },
    getProject: getProject,
    replace: replace,
    commitWorkspaceProject(value60, { reason: reason = '' } = {}) {
      return (
        handler3(),
        replace(
          reconcileWorkspaceProject(
            replacementStudioApplicationProject,
            value60 && typeof value60 === 'object' ? value60 : {},
            normalizeText(reason),
          ),
          { persist: true, presentation: 'none', reason: reason, source: 'workspace' },
        )
      );
    },
    subscribe(value61) {
      handler3();
      if (typeof value61 !== 'function') return () => {};
      return (map6['add'](value61), () => map6['delete'](value61));
    },
    destroy() {
      if (value55) return;
      ((value55 = true),
        map6['clear'](),
        (value56 = { rememberProject: null, presentProject: null, schedulePersistence: null }));
    },
  });
}

export const STORY_WORKSPACE_PERSISTENCE_VERSION = 1;
function cloneJson(enabled) {
  if (!enabled || typeof enabled !== 'object') return enabled;
  return JSON['parse'](JSON['stringify'](enabled));
}
function normalizeText(value) {
  return String(value || '')['trim']();
}
function normalizeEpisodeAssetRailTab(item) {
  const text = normalizeText(item);
  return ['assets', 'frames', 'library']['includes'](text) ? text : 'assets';
}
function clonePersistableStoryData(key) {
  return filterPersistableStoryData(cloneJson(key));
}
function filterPersistableStoryData(enabled2) {
  if (!enabled2 || typeof enabled2 !== 'object') return enabled2;
  if (enabled2['project']?.['sourceMode'] === 'video-replication') {
    if (enabled2['project']['replication']) delete enabled2['project']['replication']['requirements'];
    for (const index of enabled2['episodes'] || []) {
      if (index['replication']) delete index['replication']['requirements'];
    }
  }
  return (
    Array['isArray'](enabled2['clipFrames']) &&
      (enabled2['clipFrames'] = enabled2['clipFrames']['filter'](
        (result) =>
          result?.['captureSavePending'] !== !![] &&
          result?.['isTransient'] !== !![] &&
          ![result?.['imageUrl'], result?.['videoUrl'], result?.['thumbUrl'], result?.['posterUrl']]['some'](
            (data) => normalizeText(data)['startsWith']('blob:'),
          ),
      )),
    enabled2
  );
}
function clonePersistableProjects(options) {
  return (Array['isArray'](options) ? options : [])['map']((target) => {
    const cloneJson2 = cloneJson(target);
    if (cloneJson2?.['data']) cloneJson2['data'] = filterPersistableStoryData(cloneJson2['data']);
    return cloneJson2;
  });
}
export function createStoryWorkspaceSnapshot(hasCreatedProject = {}) {
  const source = Array['isArray'](hasCreatedProject['projects']) ? hasCreatedProject['projects'] : [];
  return {
    schemaVersion: STORY_WORKSPACE_PERSISTENCE_VERSION,
    savedAt: Date['now'](),
    activeProjectId: normalizeText(hasCreatedProject['data']?.['project']?.['id']),
    hasCreatedProject: hasCreatedProject['hasCreatedProject'] === !![],
    projectTitleEdited: hasCreatedProject['projectTitleEdited'] === !![],
    projects: clonePersistableProjects(source),
    currentData: clonePersistableStoryData(hasCreatedProject['data']),
    models: cloneJson(hasCreatedProject['models'] || {}),
    modelProviders: {
      text: normalizeText(hasCreatedProject['textProvider']),
      image: normalizeText(hasCreatedProject['imageProvider']),
      video: normalizeText(hasCreatedProject['videoProvider']),
    },
    modelProviderProfiles: {
      text: normalizeText(hasCreatedProject['textProviderProfileId']),
      video: normalizeText(hasCreatedProject['videoProviderProfileId']),
      videoByModel: cloneJson(hasCreatedProject['videoProviderProfileIdByModel'] || {}),
    },
    modelParams: {
      image: cloneJson(hasCreatedProject['imageGenerationParams'] || {}),
      imageByModel: cloneJson(hasCreatedProject['imageGenerationParamsByModel'] || {}),
      video: cloneJson(hasCreatedProject['videoGenerationParams'] || {}),
      videoByModel: cloneJson(hasCreatedProject['videoGenerationParamsByModel'] || {}),
    },
    ui: {
      view: normalizeText(hasCreatedProject['view']) || 'home',
      step: hasCreatedProject['step'] === 0 ? 0 : Number(hasCreatedProject['step']) || 1,
      homeTab: ['upload', 'generate', 'collaborate', 'replication']['includes'](hasCreatedProject['homeTab'])
        ? hasCreatedProject['homeTab']
        : 'upload',
      replicationTargetLocale: normalizeText(hasCreatedProject['replicationTargetLocale']) || 'zh-CN',
      replicationAsrProvider:
        normalizeText(hasCreatedProject['replicationAsrProvider']) || 'volcengine-speech',
      scriptMode: hasCreatedProject['scriptMode'] === 'narration' ? 'narration' : 'plot',
      uploadInputMode: hasCreatedProject['uploadInputMode'] === 'paste' ? 'paste' : 'file',
      idea: String(hasCreatedProject['idea'] || ''),
      scriptFileName: String(hasCreatedProject['scriptFileName'] || ''),
      scriptText: String(hasCreatedProject['scriptText'] || ''),
      scriptCharacterCount: Number['isFinite'](hasCreatedProject['scriptCharacterCount'])
        ? hasCreatedProject['scriptCharacterCount']
        : null,
      assetFilter: normalizeText(hasCreatedProject['assetFilter']) || 'character',
      assetSplitRatio: Number(hasCreatedProject['assetSplitRatio']) || 50,
      assetDetailSplitRatio: Number(hasCreatedProject['assetDetailSplitRatio']) || 50,
      episodeAssetPanelRatio: Number(hasCreatedProject['episodeAssetPanelRatio']) || 22,
      episodeEditorPanelRatio: Number(hasCreatedProject['episodeEditorPanelRatio']) || 0x22,
      episodeAssetRailTab: normalizeEpisodeAssetRailTab(hasCreatedProject['episodeAssetRailTab']),
      assetAppearanceIndexes: cloneJson(hasCreatedProject['assetAppearanceIndexes'] || {}),
      outlineSectionOpenState: cloneJson(hasCreatedProject['outlineSectionOpenState'] || {}),
      pageScrollPositions: cloneJson(hasCreatedProject['pageScrollPositions'] || {}),
      experimentalSplitMode: hasCreatedProject['experimentalSplitMode'] === !![],
      selectedAssetId: normalizeText(hasCreatedProject['selectedAssetId']),
      selectedEpisodeId: normalizeText(hasCreatedProject['selectedEpisodeId']),
      selectedClipId: normalizeText(hasCreatedProject['selectedClipId']),
      characterVoiceEditor: hasCreatedProject['characterVoiceEditor']
        ? { ...cloneJson(hasCreatedProject['characterVoiceEditor']), isGenerating: ![] }
        : null,
    },
  };
}
export function normalizeStoryWorkspaceSnapshot(models) {
  if (!models || typeof models !== 'object' || Array['isArray'](models)) return null;
  if (Number(models['schemaVersion']) !== STORY_WORKSPACE_PERSISTENCE_VERSION) return null;
  if (!models['currentData']?.['project'] || !Array['isArray'](models['currentData']?.['episodes']))
    return null;
  const ui = models['ui'] && typeof models['ui'] === 'object' ? cloneJson(models['ui']) : {};
  return (
    delete ui['replicationRequirements'],
    {
      ...models,
      projects: clonePersistableProjects(models['projects']),
      currentData: clonePersistableStoryData(models['currentData']),
      models: models['models'] && typeof models['models'] === 'object' ? cloneJson(models['models']) : {},
      modelProviders:
        models['modelProviders'] && typeof models['modelProviders'] === 'object'
          ? cloneJson(models['modelProviders'])
          : {},
      modelProviderProfiles:
        models['modelProviderProfiles'] && typeof models['modelProviderProfiles'] === 'object'
          ? cloneJson(models['modelProviderProfiles'])
          : {},
      modelParams:
        models['modelParams'] && typeof models['modelParams'] === 'object'
          ? cloneJson(models['modelParams'])
          : {},
      ui: ui,
    }
  );
}
export function isEmptyStoryWorkspaceSnapshotPayload(next) {
  return (
    next == null ||
    (typeof next === 'object' && !Array['isArray'](next) && Object['keys'](next)['length'] === 0)
  );
}
export function parseStoryWorkspaceSnapshotPayload(current) {
  const storyWorkspaceSnapshot = normalizeStoryWorkspaceSnapshot(current);
  if (!storyWorkspaceSnapshot && !isEmptyStoryWorkspaceSnapshotPayload(current))
    throw new Error('剧本工作室存档格式无效');
  return storyWorkspaceSnapshot;
}
export function mergeStoryWorkspaceHydratedProjects(args = [], entry = []) {
  const list = Array['isArray'](args) ? [...args] : [],
    handler = (record) => String(record?.['id'] || record?.['data']?.['project']?.['id'] || '')['trim'](),
    map = new Set(list['map'](handler));
  return (
    (Array['isArray'](entry) ? entry : [])['forEach']((payload) => {
      const enabled3 = handler(payload);
      if (!enabled3 || map['has'](enabled3)) return;
      (list['push'](payload), map['add'](enabled3));
    }),
    list
  );
}
export function hasStoryWorkspaceSnapshotChanged(enabled4, enabled5) {
  if (enabled4 === enabled5) return ![];
  if (!enabled4 || !enabled5) return !![];
  try {
    const cloneJson3 = cloneJson(enabled4),
      cloneJson4 = cloneJson(enabled5);
    return (
      delete cloneJson3['savedAt'],
      delete cloneJson4['savedAt'],
      JSON['stringify'](cloneJson3) !== JSON['stringify'](cloneJson4)
    );
  } catch {
    return !![];
  }
}

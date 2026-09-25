export const STORY_WORKSPACE_PERSISTENCE_VERSION = 0x1;
function cloneJson(_0x2f66f2) {
  if (!_0x2f66f2 || typeof _0x2f66f2 !== 'object') return _0x2f66f2;
  return JSON['parse'](JSON['stringify'](_0x2f66f2));
}
function normalizeText(_0x16688a) {
  return String(_0x16688a || '')['trim']();
}
function normalizeEpisodeAssetRailTab(_0x56f7c2) {
  const _0xe7ec92 = normalizeText(_0x56f7c2);
  return ['assets', 'frames', 'library']['includes'](_0xe7ec92) ? _0xe7ec92 : 'assets';
}
function clonePersistableStoryData(_0x1c6d5c) {
  return filterPersistableStoryData(cloneJson(_0x1c6d5c));
}
function filterPersistableStoryData(_0x534e7d) {
  if (!_0x534e7d || typeof _0x534e7d !== 'object') return _0x534e7d;
  if (_0x534e7d['project']?.['sourceMode'] === 'video-replication') {
    if (_0x534e7d['project']['replication']) delete _0x534e7d['project']['replication']['requirements'];
    for (const _0x23735d of _0x534e7d['episodes'] || []) {
      if (_0x23735d['replication']) delete _0x23735d['replication']['requirements'];
    }
  }
  return (
    Array['isArray'](_0x534e7d['clipFrames']) &&
      (_0x534e7d['clipFrames'] = _0x534e7d['clipFrames']['filter'](
        (_0x1f75dd) =>
          _0x1f75dd?.['captureSavePending'] !== !![] &&
          _0x1f75dd?.['isTransient'] !== !![] &&
          ![
            _0x1f75dd?.['imageUrl'],
            _0x1f75dd?.['videoUrl'],
            _0x1f75dd?.['thumbUrl'],
            _0x1f75dd?.['posterUrl'],
          ]['some']((_0xa46e7f) => normalizeText(_0xa46e7f)['startsWith']('blob:')),
      )),
    _0x534e7d
  );
}
function clonePersistableProjects(_0x160133) {
  return (Array['isArray'](_0x160133) ? _0x160133 : [])['map']((_0x5a5425) => {
    const _0x57b036 = cloneJson(_0x5a5425);
    if (_0x57b036?.['data']) _0x57b036['data'] = filterPersistableStoryData(_0x57b036['data']);
    return _0x57b036;
  });
}
export function createStoryWorkspaceSnapshot(_0x308fa9 = {}) {
  const _0x53edb4 = Array['isArray'](_0x308fa9['projects']) ? _0x308fa9['projects'] : [];
  return {
    schemaVersion: STORY_WORKSPACE_PERSISTENCE_VERSION,
    savedAt: Date['now'](),
    activeProjectId: normalizeText(_0x308fa9['data']?.['project']?.['id']),
    hasCreatedProject: _0x308fa9['hasCreatedProject'] === !![],
    projectTitleEdited: _0x308fa9['projectTitleEdited'] === !![],
    projects: clonePersistableProjects(_0x53edb4),
    currentData: clonePersistableStoryData(_0x308fa9['data']),
    models: cloneJson(_0x308fa9['models'] || {}),
    modelProviders: {
      text: normalizeText(_0x308fa9['textProvider']),
      image: normalizeText(_0x308fa9['imageProvider']),
      video: normalizeText(_0x308fa9['videoProvider']),
    },
    modelProviderProfiles: {
      text: normalizeText(_0x308fa9['textProviderProfileId']),
      video: normalizeText(_0x308fa9['videoProviderProfileId']),
      videoByModel: cloneJson(_0x308fa9['videoProviderProfileIdByModel'] || {}),
    },
    modelParams: {
      image: cloneJson(_0x308fa9['imageGenerationParams'] || {}),
      imageByModel: cloneJson(_0x308fa9['imageGenerationParamsByModel'] || {}),
      video: cloneJson(_0x308fa9['videoGenerationParams'] || {}),
      videoByModel: cloneJson(_0x308fa9['videoGenerationParamsByModel'] || {}),
    },
    ui: {
      view: normalizeText(_0x308fa9['view']) || 'home',
      step: _0x308fa9['step'] === 0x0 ? 0x0 : Number(_0x308fa9['step']) || 0x1,
      homeTab: ['upload', 'generate', 'collaborate', 'replication']['includes'](_0x308fa9['homeTab'])
        ? _0x308fa9['homeTab']
        : 'upload',
      replicationTargetLocale: normalizeText(_0x308fa9['replicationTargetLocale']) || 'zh-CN',
      replicationAsrProvider: normalizeText(_0x308fa9['replicationAsrProvider']) || 'volcengine-speech',
      scriptMode: _0x308fa9['scriptMode'] === 'narration' ? 'narration' : 'plot',
      uploadInputMode: _0x308fa9['uploadInputMode'] === 'paste' ? 'paste' : 'file',
      idea: String(_0x308fa9['idea'] || ''),
      scriptFileName: String(_0x308fa9['scriptFileName'] || ''),
      scriptText: String(_0x308fa9['scriptText'] || ''),
      scriptCharacterCount: Number['isFinite'](_0x308fa9['scriptCharacterCount'])
        ? _0x308fa9['scriptCharacterCount']
        : null,
      assetFilter: normalizeText(_0x308fa9['assetFilter']) || 'character',
      assetSplitRatio: Number(_0x308fa9['assetSplitRatio']) || 0x32,
      assetDetailSplitRatio: Number(_0x308fa9['assetDetailSplitRatio']) || 0x32,
      episodeAssetPanelRatio: Number(_0x308fa9['episodeAssetPanelRatio']) || 0x16,
      episodeEditorPanelRatio: Number(_0x308fa9['episodeEditorPanelRatio']) || 0x22,
      episodeAssetRailTab: normalizeEpisodeAssetRailTab(_0x308fa9['episodeAssetRailTab']),
      assetAppearanceIndexes: cloneJson(_0x308fa9['assetAppearanceIndexes'] || {}),
      outlineSectionOpenState: cloneJson(_0x308fa9['outlineSectionOpenState'] || {}),
      pageScrollPositions: cloneJson(_0x308fa9['pageScrollPositions'] || {}),
      experimentalSplitMode: _0x308fa9['experimentalSplitMode'] === !![],
      selectedAssetId: normalizeText(_0x308fa9['selectedAssetId']),
      selectedEpisodeId: normalizeText(_0x308fa9['selectedEpisodeId']),
      selectedClipId: normalizeText(_0x308fa9['selectedClipId']),
      characterVoiceEditor: _0x308fa9['characterVoiceEditor']
        ? { ...cloneJson(_0x308fa9['characterVoiceEditor']), isGenerating: ![] }
        : null,
    },
  };
}
export function normalizeStoryWorkspaceSnapshot(_0x3fab69) {
  if (!_0x3fab69 || typeof _0x3fab69 !== 'object' || Array['isArray'](_0x3fab69)) return null;
  if (Number(_0x3fab69['schemaVersion']) !== STORY_WORKSPACE_PERSISTENCE_VERSION) return null;
  if (!_0x3fab69['currentData']?.['project'] || !Array['isArray'](_0x3fab69['currentData']?.['episodes']))
    return null;
  const _0x105da0 = _0x3fab69['ui'] && typeof _0x3fab69['ui'] === 'object' ? cloneJson(_0x3fab69['ui']) : {};
  return (
    delete _0x105da0['replicationRequirements'],
    {
      ..._0x3fab69,
      projects: clonePersistableProjects(_0x3fab69['projects']),
      currentData: clonePersistableStoryData(_0x3fab69['currentData']),
      models:
        _0x3fab69['models'] && typeof _0x3fab69['models'] === 'object' ? cloneJson(_0x3fab69['models']) : {},
      modelProviders:
        _0x3fab69['modelProviders'] && typeof _0x3fab69['modelProviders'] === 'object'
          ? cloneJson(_0x3fab69['modelProviders'])
          : {},
      modelProviderProfiles:
        _0x3fab69['modelProviderProfiles'] && typeof _0x3fab69['modelProviderProfiles'] === 'object'
          ? cloneJson(_0x3fab69['modelProviderProfiles'])
          : {},
      modelParams:
        _0x3fab69['modelParams'] && typeof _0x3fab69['modelParams'] === 'object'
          ? cloneJson(_0x3fab69['modelParams'])
          : {},
      ui: _0x105da0,
    }
  );
}
export function isEmptyStoryWorkspaceSnapshotPayload(_0x3ae411) {
  return (
    _0x3ae411 == null ||
    (typeof _0x3ae411 === 'object' &&
      !Array['isArray'](_0x3ae411) &&
      Object['keys'](_0x3ae411)['length'] === 0x0)
  );
}
export function parseStoryWorkspaceSnapshotPayload(_0xabbc89) {
  const _0x4b86c6 = normalizeStoryWorkspaceSnapshot(_0xabbc89);
  if (!_0x4b86c6 && !isEmptyStoryWorkspaceSnapshotPayload(_0xabbc89))
    throw new Error('剧本工作室存档格式无效');
  return _0x4b86c6;
}
export function mergeStoryWorkspaceHydratedProjects(_0x13e823 = [], _0x4b1d79 = []) {
  const _0x5a2bad = Array['isArray'](_0x13e823) ? [..._0x13e823] : [],
    _0x40f568 = (_0x38c5bd) =>
      String(_0x38c5bd?.['id'] || _0x38c5bd?.['data']?.['project']?.['id'] || '')['trim'](),
    _0x325f5a = new Set(_0x5a2bad['map'](_0x40f568));
  return (
    (Array['isArray'](_0x4b1d79) ? _0x4b1d79 : [])['forEach']((_0x590bad) => {
      const _0x44f8d6 = _0x40f568(_0x590bad);
      if (!_0x44f8d6 || _0x325f5a['has'](_0x44f8d6)) return;
      (_0x5a2bad['push'](_0x590bad), _0x325f5a['add'](_0x44f8d6));
    }),
    _0x5a2bad
  );
}
export function hasStoryWorkspaceSnapshotChanged(_0x526565, _0x5553ee) {
  if (_0x526565 === _0x5553ee) return ![];
  if (!_0x526565 || !_0x5553ee) return !![];
  try {
    const _0x15e60a = cloneJson(_0x526565),
      _0xcccb94 = cloneJson(_0x5553ee);
    return (
      delete _0x15e60a['savedAt'],
      delete _0xcccb94['savedAt'],
      JSON['stringify'](_0x15e60a) !== JSON['stringify'](_0xcccb94)
    );
  } catch {
    return !![];
  }
}

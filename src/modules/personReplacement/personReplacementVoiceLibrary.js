function normalizeText(value) {
  return String(value ?? '')['trim']();
}
const GENERIC_AUDIO_ITEM_NAMES = new Set(['人声', '声音', '音频', '源音频', '生成音频', 'AI音频', 'AI 音频']);
function normalizeItemIndex(item) {
  return Math['max'](0x0, Math['trunc'](Number(item) || 0x0));
}
function getLibrarySourceKey(options = {}) {
  const text = normalizeText(options['sourceAssetId'] || options['assetId']);
  if (!text) return '';
  return text + ':' + normalizeItemIndex(options['sourceItemIndex'] ?? options['itemIndex']);
}
export function getPersonReplacementLibraryAudioRef(response = {}) {
  return normalizeText(response['audioUrl'] || response['sourceUrl'] || response['url']);
}
export function getPersonReplacementAudioSavedName(error = {}) {
  const text2 = normalizeText(error['savedName']);
  if (text2) return text2;
  const text3 = normalizeText(error['name']),
    text4 = normalizeText(error['assetName']);
  if (text4 && (!text3 || GENERIC_AUDIO_ITEM_NAMES['has'](text3))) return text4;
  return text3 || text4 || '未命名音频';
}
export function getPersonReplacementProjectAudioAssets(options2 = {}) {
  return (Array['isArray'](options2['audioAssets']) ? options2['audioAssets'] : [])['filter'](
    (key) => normalizeText(key?.['mediaKind'] || key?.['type'])['toLowerCase']() === 'audio',
  );
}
export function getPersonReplacementVoiceLibraryBoundCharacters(options3 = {}, index = {}) {
  const text5 = normalizeText(index['id']),
    librarySourceKey = getLibrarySourceKey(index);
  return (Array['isArray'](options3['characters']) ? options3['characters'] : [])['filter']((result) => {
    const enabled = result?.['voiceReference'];
    if (!enabled || normalizeText(enabled['source'])['toLowerCase']() !== 'library') return ![];
    if (text5 && normalizeText(enabled['libraryAssetId']) === text5) return !![];
    return Boolean(librarySourceKey && getLibrarySourceKey(enabled) === librarySourceKey);
  });
}
export function buildPersonReplacementLibraryVoiceReference(
  options4 = {},
  {
    audioUrl: audioUrl = getPersonReplacementLibraryAudioRef(options4),
    localPath: localPath = '',
    updatedAt: updatedAt = Date['now'](),
  } = {},
) {
  const audioUrl2 = normalizeText(audioUrl);
  if (!audioUrl2) throw new Error('所选音频缺少可用地址。');
  return {
    audioUrl: audioUrl2,
    localPath: normalizeText(localPath),
    fileName: getPersonReplacementAudioSavedName(options4),
    source: 'library',
    libraryAssetId: normalizeText(options4['id']),
    sourceAssetId: normalizeText(options4['sourceAssetId'] || options4['assetId']),
    sourceItemIndex: normalizeItemIndex(options4['sourceItemIndex'] ?? options4['itemIndex']),
    updatedAt: updatedAt,
  };
}
export function bindPersonReplacementCharacterVoice({
  project: project,
  request: request = {},
  showToast: showToast,
  addLibraryAssetsToProject: addLibraryAssetsToProject,
  normalizeLocalPath: normalizeLocalPath,
  resolveMediaUrl: resolveMediaUrl,
  setProject: setProject,
}) {
  const text6 = normalizeText(request['characterId']),
    assetId = request['asset'] && typeof request['asset'] === 'object' ? request['asset'] : {},
    error2 = project['characters']['find']((data) => data['id'] === text6);
  if (!error2) return (showToast('要添加声音的人设不存在。', 'warn'), null);
  if (normalizeText(assetId['mediaKind'] || assetId['type'])['toLowerCase']() !== 'audio')
    return (showToast('请选择音频素材。', 'warn'), null);
  const personReplacementLibraryAudioRef = getPersonReplacementLibraryAudioRef(assetId);
  if (!personReplacementLibraryAudioRef) return (showToast('所选音频缺少可用地址。', 'warn'), null);
  const localPath2 = normalizeLocalPath(personReplacementLibraryAudioRef);
  !project['audioAssets']['some'](
    (target) => getPersonReplacementLibraryAudioRef(target) === personReplacementLibraryAudioRef,
  ) &&
    (project = addLibraryAssetsToProject({
      targetKind: 'audio',
      sourceAssets: [assetId],
      assetRefs: [
        {
          assetId: assetId['sourceAssetId'] || assetId['assetId'],
          itemIndex: assetId['sourceItemIndex'] ?? assetId['itemIndex'],
        },
      ],
      notify: ![],
    })['project']);
  const voiceReference = buildPersonReplacementLibraryVoiceReference(assetId, {
      audioUrl: resolveMediaUrl(personReplacementLibraryAudioRef),
      localPath: localPath2,
    }),
    characters = project['characters']['map']((args) =>
      args['id'] === text6
        ? {
            ...args,
            voiceRef: localPath2 || personReplacementLibraryAudioRef,
            voiceReference: voiceReference,
          }
        : args,
    ),
    project2 = setProject({ ...project, characters: characters });
  return (showToast('已为「' + error2['name'] + '」添加声音。', 'success'), { project: project2 });
}

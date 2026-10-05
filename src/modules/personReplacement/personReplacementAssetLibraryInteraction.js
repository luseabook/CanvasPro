import { playAssetCreateFly } from '../assetCreateFly.js';
import { getPersonReplacementLibraryAudioRef } from './personReplacementVoiceLibrary.js';
import { PERSON_REPLACEMENT_WORKSPACE_INTENTS } from './personReplacementWorkspaceIntentPort.js';
export function requestPersonReplacementLibraryAssignment({
  project: project,
  selectedAssetIds: selectedAssetIds,
  targetKind: targetKind,
  root: root,
  documentObject: documentObject,
  windowObject: windowObject,
  hasWorkspaceIntent: hasWorkspaceIntent,
  runIntent: runIntent,
}) {
  const list = project['libraryAssets']['filter']((value) => {
    if (!selectedAssetIds['includes'](value['id'])) return ![];
    if (targetKind === 'audio')
      return (
        normalizeText(value?.['mediaKind'])['toLowerCase']() === 'audio' &&
        Boolean(getPersonReplacementLibraryAudioRef(value))
      );
    return (
      normalizeText(value?.['mediaKind'])['toLowerCase']() === 'image' &&
      Boolean(normalizeText(value?.['sourceUrl'] || value?.['imageUrl']))
    );
  });
  if (!list['length']) {
    windowObject?.['showToast']?.(
      targetKind === 'audio' ? '请选择总素材中的音频后再加入项目。' : '请选择总素材中的图片后再加入项目。',
      'warn',
    );
    return;
  }
  const enabled = hasWorkspaceIntent(PERSON_REPLACEMENT_WORKSPACE_INTENTS['ADD_LIBRARY_ASSETS_TO_PROJECT']);
  if (targetKind === 'scene' && !enabled) {
    windowObject?.['showToast']?.('当前场景素材导入能力尚未初始化。', 'warn');
    return;
  }
  const newPersonReplacementLibraryAssets = getNewPersonReplacementLibraryAssets(project, list, targetKind),
    assetRefs = list['map']((assetId) => ({
      assetId: assetId['sourceAssetId'],
      itemIndex: assetId['sourceItemIndex'],
    })),
    promise = runIntent(
      enabled
        ? PERSON_REPLACEMENT_WORKSPACE_INTENTS['ADD_LIBRARY_ASSETS_TO_PROJECT']
        : PERSON_REPLACEMENT_WORKSPACE_INTENTS['ADD_LIBRARY_ASSETS_TO_CHARACTERS'],
      enabled ? { assetRefs: assetRefs, targetKind: targetKind } : { assetRefs: assetRefs },
    ),
    handler = (item) =>
      playPersonReplacementLibraryAssetsIntoProjectTab(
        root,
        newPersonReplacementLibraryAssets,
        item?.['addedCount'],
        targetKind,
        documentObject,
        windowObject,
      );
  if (promise?.['then']) void promise['then'](handler);
  else handler(promise);
  return promise;
}
function normalizeText(key) {
  return String(key ?? '')['trim']();
}
function getLibraryAssetSourceKey(options = {}) {
  return (
    normalizeText(options['sourceAssetId']) +
    ':' +
    Math['max'](0, Math['trunc'](Number(options['sourceItemIndex']) || 0))
  );
}
function getRenderableElementRect(el) {
  const box = el?.['getBoundingClientRect']?.();
  return box?.['width'] > 0 && box?.['height'] > 0 ? box : null;
}
function resolveLibraryAssetFlySource(el2, index, list2 = []) {
  const el3 = list2['find']((el4) => normalizeText(el4?.['dataset']?.['storyAssetId']) === index['id']),
    contentElement = el3?.['querySelector']?.('.story-asset-card-image'),
    fromRect = getRenderableElementRect(contentElement);
  if (fromRect) return { fromRect: fromRect, contentElement: contentElement };
  const el5 = Array['from'](el2?.['querySelectorAll']?.('[data-story-asset-prompt-asset-id]') || [])['find'](
      (el6) => normalizeText(el6?.['dataset']?.['storyAssetPromptAssetId']) === index['id'],
    ),
    contentElement2 = el5?.['closest']?.('.story-asset-detail')?.['querySelector']?.('.story-asset-preview'),
    fromRect2 = getRenderableElementRect(contentElement2);
  return fromRect2 ? { fromRect: fromRect2, contentElement: contentElement2 } : null;
}
export function getNewPersonReplacementLibraryAssets(options2 = {}, list3 = [], result = 'character') {
  const data =
      result === 'scene'
        ? options2['scenes']
        : result === 'audio'
          ? options2['audioAssets']
          : options2['characters'],
    map = new Set(
      (Array['isArray'](data) ? data : [])
        ['filter']((target) => normalizeText(target?.['sourceOrigin']) === 'library')
        ['map']((source) => getLibraryAssetSourceKey(source)),
    );
  return list3['filter']((next) => !map['has'](getLibraryAssetSourceKey(next)));
}
export function playPersonReplacementLibraryAssetsIntoProjectTab(
  el7,
  list4 = [],
  current = 0,
  entry = 'character',
  documentObject2 = globalThis['document'],
  windowObject2 = globalThis['window'],
) {
  const enabled2 = Math['min'](list4['length'], Math['max'](0, Math['trunc'](Number(current) || 0)));
  if (!enabled2) return ![];
  const toElement = el7?.['querySelector']?.('[data-asset-tab="' + entry + '"]');
  if (!toElement) return ![];
  const record = Array['from'](el7?.['querySelectorAll']?.('[data-story-asset-id]') || []);
  return (
    list4['slice'](0, enabled2)['forEach']((payload) => {
      const args = resolveLibraryAssetFlySource(el7, payload, record);
      if (!args) return;
      playAssetCreateFly({
        ...args,
        toElement: toElement,
        documentObject: documentObject2,
        windowObject: windowObject2,
      });
    }),
    !![]
  );
}
export async function addPersonReplacementAppearanceToLibraryWithFly(
  toElement2,
  characterId,
  appearanceId,
  handle,
  handler2,
  documentObject3,
  windowObject3,
) {
  const contentElement3 = toElement2?.['querySelector']?.(
      '.person-replacement-assets-page .story-asset-detail .story-asset-preview',
    ),
    fromRect3 = contentElement3?.['getBoundingClientRect']?.() || null,
    response = await handler2(handle, {
      characterId: characterId?.['id'],
      appearanceId: appearanceId?.['id'],
    });
  if (!response?.['ok'] || !contentElement3 || !fromRect3) return null;
  return playAssetCreateFly({
    fromRect: fromRect3,
    contentElement: contentElement3,
    toElement: toElement2?.['querySelector']?.('[data-asset-tab="library"]'),
    documentObject: documentObject3,
    windowObject: windowObject3,
  });
}

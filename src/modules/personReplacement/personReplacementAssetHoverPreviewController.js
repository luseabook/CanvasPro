import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  buildWorkspaceAssetHoverPreviewContent,
  isWorkspaceAssetHoverLandscape,
} from '../workspaceAssetPresentation.js';
import { getWorkspaceAssetHoverCard, getWorkspaceAssetHoverCardId } from '../workspaceAssetHover.js';
import {
  getWorkspaceAssetAppearances,
  getWorkspaceAssetBaseAppearance,
} from '../workspaceAssetAppearance.js';
import {
  PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementImageResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementVideoImageInput,
} from './personReplacementProject.js';
import { getPersonReplacementVoiceLibraryBoundCharacters } from './personReplacementVoiceLibrary.js';
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
function normalizeMediaUrl(index) {
  const text = normalizeText(index);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
function getCharacterAppearance(result, data = '') {
  const list = getWorkspaceAssetAppearances(result);
  return (
    list['find']((options) => options['id'] === data) ||
    getWorkspaceAssetBaseAppearance(result) ||
    list[0] ||
    null
  );
}
function getCharacterVoiceUrl(options2 = {}) {
  return normalizeMediaUrl(
    options2['voiceReference']?.['audioUrl'] ||
      options2['voiceReference']?.['localPath'] ||
      options2['voiceRef'],
  );
}
function resolveVideoShotReferencePreview(target, source) {
  const personReplacementVideoImageInput = resolvePersonReplacementVideoImageInput(target, source),
    list2 = Array['isArray'](personReplacementVideoImageInput?.['referenceOptions'])
      ? personReplacementVideoImageInput['referenceOptions']
      : [],
    next = Math['max'](
      0,
      Math['min'](
        Math['max'](0, list2['length'] - 1),
        Math['trunc'](Number(personReplacementVideoImageInput?.['activeReferenceIndex']) || 0),
      ),
    ),
    isCharacterReference = list2[next] || null;
  return isCharacterReference
    ? {
        isCharacterReference:
          isCharacterReference['kind'] === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
        referenceImageRef: normalizeText(isCharacterReference['imageRef']),
      }
    : null;
}
export function createPersonReplacementAssetHoverPreviewController({
  getRoot: getRoot = () => null,
  getProject: getProject = () => ({}),
  getSelectedAppearance: getSelectedAppearance = () => null,
  isTargetAssetDragActive: isTargetAssetDragActive = () => false,
  documentObject: documentObject = globalThis['document'],
  windowObject: windowObject = globalThis,
} = {}) {
  let current = 0,
    entry = 0,
    record = 0,
    el = null,
    payload = '',
    enabled = null,
    handle = false;
  const run = () => getRoot()?.['querySelector']?.('[data-story-asset-hover-preview]'),
    handler = (el2) => {
      const state = el2?.['closest']?.('.person-replacement-prompt-reference-inputs'),
        config = state ? el2?.['querySelector']?.('.ref-thumb-media') : null,
        imageUrl = normalizeMediaUrl(
          config?.['currentSrc'] || config?.['getAttribute']?.('src') || config?.['src'],
        );
      if (!imageUrl) return null;
      const slotId = normalizeText(el2?.['dataset']?.['slot']) || 'input',
        label = normalizeText(el2?.['getAttribute']?.('aria-label')) || '模型入参 ' + slotId;
      return {
        id: 'prompt-reference:' + slotId + ':' + imageUrl,
        slotId: slotId,
        label: label,
        imageUrl: imageUrl,
      };
    },
    handler2 = (el3) =>
      getWorkspaceAssetHoverCard(el3, {
        selector: '[data-story-asset-id], [data-story-reference-asset], [data-story-asset-hover-id]',
      }) ||
      el3?.['closest']?.('.person-replacement-prompt-reference-inputs .ref-thumb-wrap[data-slot]') ||
      null,
    handler3 = (scope) =>
      normalizeText(
        getWorkspaceAssetHoverCardId(scope, {
          datasetKeys: ['storyAssetHoverId', 'storyAssetId', 'storyReferenceAsset'],
        }),
      ) ||
      handler(scope)?.['id'] ||
      '',
    handler4 = (el4) => {
      if (!el4 || !enabled) return false;
      return (
        handler3(el4) === enabled['assetId'] &&
        normalizeText(el4['dataset']?.['shotId']) === enabled['shotId'] &&
        normalizeText(el4['dataset']?.['personId']) === enabled['personId']
      );
    },
    hide = () => {
      ((payload = ''), (el = null));
      const el5 = run();
      (el5?.['classList']?.['remove']?.('is-visible'),
        el5?.['classList']?.['remove']?.('is-prompt-reference-preview'),
        el5?.['setAttribute']?.('aria-hidden', 'true'));
    },
    handler5 = () => {
      current = 0;
      const el6 = run();
      if (!el6?.['classList']?.['contains']?.('is-visible')) return;
      const box = el6['getBoundingClientRect']?.();
      if (!box) return;
      const input =
          windowObject?.['innerWidth'] || documentObject?.['documentElement']?.['clientWidth'] || 1024,
        output =
          windowObject?.['innerHeight'] || documentObject?.['documentElement']?.['clientHeight'] || 768,
        value2 = 14,
        value3 = 10,
        value4 = Math['max'](value3, input - box['width'] - value3),
        value5 = Math['max'](value3, output - box['height'] - value3),
        box2 = el?.['getBoundingClientRect']?.(),
        value6 =
          Number(box2?.['width']) > 0 &&
          Number['isFinite'](Number(box2?.['left'])) &&
          Number['isFinite'](Number(box2?.['top'])),
        value7 = value6
          ? Number(box2['left']) + (Number(box2['width']) - box['width']) / 2
          : entry + value2,
        value8 = value6 ? Number(box2['top']) - box['height'] - value2 : record + value2;
      ((el6['style']['left'] = Math['round'](Math['min'](Math['max'](value3, value7), value4)) + 'px'),
        (el6['style']['top'] = Math['round'](Math['min'](Math['max'](value3, value8), value5)) + 'px'));
    },
    handler6 = (event, { anchor: anchor = null } = {}) => {
      ((entry = Number(event?.['clientX'] || 0)),
        (record = Number(event?.['clientY'] || 0)),
        (el = anchor));
      if (current) return;
      typeof windowObject?.['requestAnimationFrame'] === 'function'
        ? (current = windowObject['requestAnimationFrame'](handler5))
        : handler5();
    },
    handler7 = (el7) => {
      el7?.['querySelectorAll']?.('[data-story-asset-hover-image]')?.['forEach']?.((el8) => {
        const run2 = () => {
          const isWorkspaceAssetHoverLandscape2 = isWorkspaceAssetHoverLandscape(
            el8['naturalWidth'],
            el8['naturalHeight'],
          );
          (el8['closest']?.('.story-asset-hover-preview-item')?.['classList']?.['toggle']?.(
            'is-landscape',
            isWorkspaceAssetHoverLandscape2,
          ),
            el8['closest']?.('.story-asset-hover-preview-cell')?.['classList']?.['toggle']?.(
              'is-landscape',
              isWorkspaceAssetHoverLandscape2,
            ),
            handler5());
        };
        if (el8['complete'] && Number(el8['naturalWidth']) > 0) run2();
        else el8['addEventListener']?.('load', run2, { once: true });
      });
    },
    show = (el9, value9) => {
      const el10 = getRoot(),
        project = getProject();
      if (
        handle ||
        !el9 ||
        el9['closest']?.('.story-assets-page .story-asset-card-shell') ||
        value9?.['pointerType'] === 'touch' ||
        project['workspace']['view'] !== 'project' ||
        el10?.['classList']?.['contains']?.('is-marquee-selecting') ||
        isTargetAssetDragActive()
      )
        return (hide(), false);
      const name = handler(el9),
        enabled2 = el9['dataset']?.['personReplacementAudioLibraryAsset'] === 'true',
        id =
          normalizeText(
            getWorkspaceAssetHoverCardId(el9, {
              datasetKeys: ['storyAssetHoverId', 'storyAssetId', 'storyReferenceAsset'],
            }),
          ) ||
          name?.['id'] ||
          '';
      if (handler4(el9)) return (hide(), false);
      const text2 = normalizeText(el9['dataset']?.['storyAssetHoverAppearanceId']),
        value10 =
          project['workspace']['step'] === 2 &&
          Boolean(el9['closest']?.('.person-replacement-target-assets')),
        enabled3 =
          project['workspace']['step'] === 2 &&
          Boolean(value10 || el9['closest']?.('[data-person-replacement-person-drop]')),
        value11 = el9['dataset']?.['personReplacementReplacementAssetKind'] === 'scene',
        mediaOnly =
          project['workspace']['step'] === 3 &&
          el9['dataset']?.['personReplacementVideoShotHoverPreview'] === 'true',
        enabled4 =
          project['workspace']['step'] === 3 &&
          el9['dataset']?.['personReplacementVideoReferenceHoverPreview'] === 'true',
        enabled5 =
          project['workspace']['step'] === 5 &&
          el9['dataset']?.['personReplacementCompositeShotHoverPreview'] === 'true',
        selectedAssetId = Boolean(name),
        sourceShotIndex =
          mediaOnly || enabled4 || enabled5
            ? project['shots']['findIndex']((value12) => normalizeText(value12?.['id']) === id)
            : -1,
        value13 = sourceShotIndex >= 0 ? project['shots'][sourceShotIndex] : null,
        personReplacementImageResults = getPersonReplacementImageResults(value13),
        personReplacementActiveImageResultIndex = getPersonReplacementActiveImageResultIndex(
          value13,
          personReplacementImageResults,
        ),
        personReplacementImageResultRef =
          resolvePersonReplacementImageResultRef(
            personReplacementImageResults[personReplacementActiveImageResultIndex],
          ) || normalizeText(value13?.['replacementImageRef']),
        id2 = mediaOnly && value13 ? resolveVideoShotReferencePreview(project, value13) : null,
        value14 = value13
          ? {
              id: id,
              kind: 'scene',
              name: '片段' + String(sourceShotIndex + 1)['padStart'](2, '0'),
              appearances: [
                {
                  id: 'source-frame',
                  name: '原片关键帧',
                  imageUrl: normalizeMediaUrl(value13['keyframeRef']),
                },
                {
                  id: id2?.['isCharacterReference'] ? 'character-reference' : 'replacement-frame',
                  name: id2?.['isCharacterReference'] ? '人物入参图' : '当前替换图',
                  imageUrl: normalizeMediaUrl(id2?.['referenceImageRef'] || personReplacementImageResultRef),
                },
              ],
            }
          : null,
        value15 = enabled4
          ? project['shots']['find'](
              (value16) => normalizeText(value16?.['id']) === normalizeText(el9['dataset']?.['shotId']),
            ) ||
            value13 ||
            null
          : null,
        value17 = value15 ? resolvePersonReplacementVideoImageInput(project, value15) : null,
        list3 = Array['isArray'](value17?.['referenceOptions']) ? value17['referenceOptions'] : [],
        value18 = Math['max'](
          0,
          Math['min'](
            Math['max'](0, list3['length'] - 1),
            Math['trunc'](Number(el9['dataset']?.['personReplacementVideoReferenceIndex']) || 0),
          ),
        ),
        resultIndex = Math['max'](
          0,
          Math['trunc'](Number(el9['dataset']?.['personReplacementVideoReferenceResultIndex']) || 0),
        ),
        text3 = normalizeText(el9['dataset']?.['personReplacementVideoReferenceSourceShotId'])
          ? personReplacementImageResults[resultIndex]
          : null,
        imageRef = resolvePersonReplacementImageResultRef(text3),
        value19 = imageRef
          ? { imageRef: imageRef, sourceShotIndex: sourceShotIndex, resultIndex: resultIndex }
          : list3[value18],
        value20 = value19?.['imageRef']
          ? {
              id: id,
              kind: 'scene',
              name: Number['isInteger'](value19['sourceShotIndex'])
                ? '片段' +
                  (value19['sourceShotIndex'] + 1) +
                  '.图片' +
                  ((value19['resultIndex'] || 0) + 1)
                : '替换参考图 ' + (value18 + 1),
              appearances: [
                {
                  id: 'video-reference-' + value18,
                  name: '替换参考图',
                  imageUrl: normalizeMediaUrl(value19['imageRef']),
                },
              ],
            }
          : null,
        value21 =
          enabled5 && value13
            ? {
                id: id,
                kind: 'scene',
                name:
                  normalizeText(value13['title']) ||
                  '片段' + String(sourceShotIndex + 1)['padStart'](2, '0'),
                appearances: [
                  {
                    id: 'composite-thumbnail',
                    name: '片段缩略图',
                    imageUrl: normalizeMediaUrl(personReplacementImageResultRef || value13['keyframeRef']),
                  },
                ],
              }
            : null,
        value22 = selectedAssetId
          ? {
              id: id,
              kind: 'scene',
              name: name['label'],
              appearances: [{ id: name['slotId'], name: name['label'], imageUrl: name['imageUrl'] }],
            }
          : null,
        enabled6 =
          !selectedAssetId &&
          !mediaOnly &&
          !enabled4 &&
          !enabled5 &&
          (value11 ||
            (project['workspace']['step'] === 1 && project['workspace']['characterAssetTab'] === 'scene')),
        value23 =
          !enabled6 &&
          !enabled2 &&
          !selectedAssetId &&
          !enabled3 &&
          !mediaOnly &&
          !enabled4 &&
          !enabled5 &&
          project['workspace']['characterAssetTab'] === 'library',
        value24 =
          !enabled6 &&
          !selectedAssetId &&
          !enabled3 &&
          !mediaOnly &&
          !enabled4 &&
          !enabled5 &&
          (enabled2 || project['workspace']['characterAssetTab'] === 'audio'),
        list4 =
          project['workspace']['characterAssetTab'] === 'audio'
            ? project['audioAssets']
            : project['libraryAssets'],
        error = value24 ? list4['find']((value25) => normalizeText(value25?.['id']) === id) : null,
        appearances = error
          ? getPersonReplacementVoiceLibraryBoundCharacters(project, error)
              ['map']((id3) => {
                const workspaceAssetBaseAppearance =
                  getWorkspaceAssetBaseAppearance(id3) ||
                  getWorkspaceAssetAppearances(id3)['find']((value26) =>
                    normalizeText(value26?.['imageUrl']),
                  );
                return {
                  id: id3['id'],
                  name: normalizeText(id3['name']) || '未命名人设',
                  imageUrl: normalizeMediaUrl(workspaceAssetBaseAppearance?.['imageUrl']),
                };
              })
              ['filter']((value27) => value27['imageUrl'])
          : [],
        enabled7 = appearances['length']
          ? {
              id: id,
              kind: 'character',
              name: normalizeText(error?.['name']) || '音频绑定人设',
              appearances: appearances,
            }
          : null,
        list5 = enabled6
          ? project['scenes']
          : value23
            ? project['libraryAssets']
            : value24
              ? list4
              : project['characters'],
        args =
          value22 ||
          value21 ||
          value20 ||
          value14 ||
          enabled7 ||
          list5['find']((value28) => normalizeText(value28?.['id']) === id);
      if (value24 && !enabled7) return (hide(), false);
      const el11 = run(),
        selectedAppearanceId = selectedAssetId
          ? value22?.['appearances']?.[0]
          : enabled5
            ? value21?.['appearances']?.[0]
            : enabled4
              ? value20?.['appearances']?.[0]
              : mediaOnly
                ? value14?.['appearances']?.[1]
                : value24
                  ? enabled7?.['appearances']?.[0]
                  : args?.['isLibraryAsset']
                    ? args
                    : text2
                      ? getCharacterAppearance(args, text2)
                      : getSelectedAppearance(args),
        value29 = value24
          ? enabled7
          : enabled3 && selectedAppearanceId
            ? { ...args, appearances: [selectedAppearanceId] }
            : args,
        workspaceAssetHoverPreviewContent = buildWorkspaceAssetHoverPreviewContent(value29, {
          selectedAssetId:
            selectedAssetId || mediaOnly || enabled4 || enabled5
              ? id
              : enabled3
                ? id
                : value24 && project['workspace']['characterAssetTab'] === 'audio'
                  ? project['workspace']['selectedAudioAssetId']
                  : value23 || value24
                    ? project['workspace']['selectedLibraryAssetId']
                    : enabled6
                      ? project['workspace']['selectedSceneId']
                      : project['workspace']['selectedCharacterId'],
          selectedAppearanceId: selectedAppearanceId?.['id'],
          mediaOnly:
            mediaOnly ||
            enabled4 ||
            enabled5 ||
            selectedAssetId ||
            value24 ||
            [1, 2]['includes'](project['workspace']['step']),
          getAppearances: getWorkspaceAssetAppearances,
          hasVoiceReference: (value30) => Boolean(getCharacterVoiceUrl(value30)),
        });
      if (!el11 || !workspaceAssetHoverPreviewContent) return (hide(), false);
      const value31 =
        id +
        ':' +
        (selectedAppearanceId?.['id'] || '') +
        ':' +
        workspaceAssetHoverPreviewContent['mediaOnly'] +
        ':' +
        workspaceAssetHoverPreviewContent['appearances']
          ['map']((value32) => (value32?.['id'] || '') + ':' + (value32?.['imageUrl'] || ''))
          ['join']('|');
      return (
        (payload = id),
        el11['dataset']['signature'] !== value31 &&
          ((el11['dataset']['signature'] = value31),
          el11['style']['setProperty'](
            '--story-asset-hover-columns',
            String(workspaceAssetHoverPreviewContent['columns']),
          ),
          (el11['innerHTML'] = workspaceAssetHoverPreviewContent['html']),
          handler7(el11)),
        el11['classList']['toggle']('is-prompt-reference-preview', selectedAssetId),
        el11['classList']['add']('is-visible'),
        el11['setAttribute']('aria-hidden', 'false'),
        handler6(value9, { anchor: selectedAssetId ? el9 : null }),
        true
      );
    },
    handlePointerOver = (event2) => {
      const root = getRoot();
      if (event2['target']?.['closest']?.('.person-replacement-detection-label')) {
        hide();
        return;
      }
      const enabled8 = handler2(event2['target']);
      if (!enabled8 || !root?.['contains']?.(enabled8)) return;
      if (event2['relatedTarget'] && enabled8['contains']?.(event2['relatedTarget'])) return;
      show(enabled8, event2);
    },
    handlePointerMove = (event3) => {
      const root2 = getRoot();
      if (event3['target']?.['closest']?.('.person-replacement-detection-label')) {
        if (payload) hide();
        return;
      }
      const enabled9 = handler2(event3['target']);
      if (!enabled9 || !root2?.['contains']?.(enabled9)) {
        if (!isTargetAssetDragActive()) enabled = null;
        if (payload) hide();
        return;
      }
      show(enabled9, event3);
    },
    handlePointerOut = (event4) => {
      const enabled10 = handler2(event4['target']);
      !isTargetAssetDragActive() && handler4(enabled10) && (enabled = null);
      if (!enabled10 || handler3(enabled10) !== payload) return;
      if (event4['relatedTarget'] && enabled10['contains']?.(event4['relatedTarget'])) return;
      hide();
    };
  return Object['freeze']({
    blockDropTarget(value33 = null) {
      enabled = value33
        ? {
            assetId: normalizeText(value33['assetId']),
            shotId: normalizeText(value33['shotId']),
            personId: normalizeText(value33['personId']),
          }
        : null;
    },
    destroy() {
      if (handle) return;
      ((handle = true),
        current &&
          typeof windowObject?.['cancelAnimationFrame'] === 'function' &&
          windowObject['cancelAnimationFrame'](current),
        (current = 0),
        (enabled = null),
        hide());
    },
    handlePointerMove: handlePointerMove,
    handlePointerOut: handlePointerOut,
    handlePointerOver: handlePointerOver,
    hide: hide,
    show: show,
  });
}

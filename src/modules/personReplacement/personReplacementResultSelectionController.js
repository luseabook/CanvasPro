import {
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementActiveVideoResultIndex,
  getPersonReplacementImageResults,
  getPersonReplacementVideoResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementImageSourceRef,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoResultRef,
} from './personReplacementProject.js';
import { reconcilePersonReplacementShotGenerationState } from './personReplacementShotMapping.js';
import { setPersonReplacementImageResultAsReference } from './personReplacementImageIteration.js';
import { setPersonReplacementVideoResultAsReference } from './personReplacementVideoIteration.js';
import {
  selectPersonReplacementVideoReference,
  switchPersonReplacementVideoReferenceResult,
} from './personReplacementVideoReference.js';
import {
  PERSON_REPLACEMENT_OUTPUT_TRANSITIONS,
  transitionPersonReplacementOutput,
} from './personReplacementOutputLineage.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createPersonReplacementResultSelectionController({
  getProject: getProject,
  updateProject: updateProject,
  getShotSwitchDirection: getShotSwitchDirection,
  captureImagePreviewSlide: captureImagePreviewSlide,
  captureMiddlePreviewSlide: captureMiddlePreviewSlide,
  captureVideoResultSlide: captureVideoResultSlide,
  playImagePreviewTransition: playImagePreviewTransition,
  playMiddlePreviewTransition: playMiddlePreviewTransition,
  playVideoResultTransition: playVideoResultTransition,
  scrollShotCardIntoView: scrollShotCardIntoView,
  captureResultHistoryMenu: captureResultHistoryMenu = () => null,
  restoreResultHistoryMenu: restoreResultHistoryMenu = () => {},
  windowObject: windowObject = globalThis['window'] || globalThis,
} = {}) {
  if (
    typeof getProject !== 'function' ||
    typeof updateProject !== 'function' ||
    typeof getShotSwitchDirection !== 'function' ||
    typeof captureImagePreviewSlide !== 'function' ||
    typeof captureMiddlePreviewSlide !== 'function' ||
    typeof captureVideoResultSlide !== 'function' ||
    typeof playImagePreviewTransition !== 'function' ||
    typeof playMiddlePreviewTransition !== 'function' ||
    typeof playVideoResultTransition !== 'function' ||
    typeof scrollShotCardIntoView !== 'function'
  )
    throw new TypeError('Person replacement result selection requires project and presentation adapters.');
  const run = (item, key = !![]) =>
      key
        ? transitionPersonReplacementOutput(item, {
            type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE'],
          })
        : item,
    selectImageResult = (
      index,
      result,
      { selectShot: selectShot = !![], direction: direction = '' } = {},
    ) => {
      const shots = getProject(),
        text = normalizeText(index),
        enabled = shots['shots']['find']((data) => data['id'] === text),
        results = getPersonReplacementImageResults(enabled);
      if (!enabled || !results['length']) return ![];
      const personReplacementActiveImageResultIndex = getPersonReplacementActiveImageResultIndex(
          enabled,
          results,
        ),
        activeIndex = Math['max'](
          0x0,
          Math['min'](results['length'] - 0x1, Math['trunc'](Number(result) || 0x0)),
        ),
        options = Object['prototype']['hasOwnProperty']['call'](results[activeIndex], 'userPrompt'),
        imagePrompt = normalizeText(results[activeIndex]?.['userPrompt']),
        enabled2 = Boolean(options && imagePrompt !== normalizeText(enabled['imagePrompt']));
      if (
        activeIndex === personReplacementActiveImageResultIndex &&
        (!selectShot || text === normalizeText(shots['workspace']['selectedShotId'])) &&
        !enabled2
      )
        return ![];
      const target = selectShot && text !== normalizeText(shots['workspace']['selectedShotId']),
        source =
          direction ||
          (target
            ? getShotSwitchDirection(text)
            : activeIndex > personReplacementActiveImageResultIndex
              ? 'next'
              : 'previous'),
        next = captureImagePreviewSlide(),
        replacementImageRef = resolvePersonReplacementImageResultRef(results[activeIndex]);
      (updateProject(
        {
          ...shots,
          shots: shots['shots']['map']((args) =>
            args['id'] === text
              ? {
                  ...args,
                  replacementImage: {
                    ...(args['replacementImage'] || {}),
                    results: results,
                    activeIndex: activeIndex,
                  },
                  replacementImageRef: replacementImageRef,
                  ...(options ? { imagePrompt: imagePrompt } : {}),
                }
              : args,
          ),
          workspace: {
            ...shots['workspace'],
            selectedShotId: selectShot ? text : shots['workspace']['selectedShotId'],
          },
        },
        'replacement-image-result',
      ),
        playImagePreviewTransition(source || 'next', next));
      if (selectShot) scrollShotCardIntoView(text);
      return !![];
    },
    switchImageResult = (current, entry, args2 = {}) => {
      const record = getProject(),
        text2 = normalizeText(entry ?? record['workspace']['selectedShotId']),
        enabled3 = record['shots']['find']((payload) => payload['id'] === text2),
        list = getPersonReplacementImageResults(enabled3);
      if (!enabled3 || list['length'] < 0x2) return ![];
      const personReplacementActiveImageResultIndex2 = getPersonReplacementActiveImageResultIndex(
          enabled3,
          list,
        ),
        handle =
          (personReplacementActiveImageResultIndex2 + Math['sign'](Number(current) || 0x0) + list['length']) %
          list['length'];
      return selectImageResult(text2, handle, {
        ...args2,
        direction: Math['sign'](Number(current) || 0x0) < 0x0 ? 'previous' : 'next',
      });
    },
    setImageReference = (state, resultIndex) => {
      const config = getProject(),
        shotId = normalizeText(state),
        enabled4 = config['shots']['find']((scope) => scope['id'] === shotId),
        list2 = getPersonReplacementImageResults(enabled4),
        count = Math['trunc'](Number(resultIndex));
      if (!enabled4 || !Number['isInteger'](count) || count < 0x0 || count >= list2['length']) return ![];
      const personReplacementActiveImageResultIndex3 = getPersonReplacementActiveImageResultIndex(
          enabled4,
          list2,
        ),
        input = config['shots']['find'](
          (output) => output['id'] === normalizeText(config['workspace']['selectedShotId']),
        ),
        personReplacementImageSourceRef = resolvePersonReplacementImageSourceRef(input),
        personReplacementImageResultRef = resolvePersonReplacementImageResultRef(list2[count]),
        value2 =
          personReplacementImageResultRef === normalizeText(enabled4['imageIterationReferenceRef'])
            ? normalizeText(enabled4['keyframeRef'])
            : personReplacementImageResultRef,
        value3 = shotId !== normalizeText(config['workspace']['selectedShotId']),
        value4 = value3 || count !== personReplacementActiveImageResultIndex3,
        value5 = value3 || value2 !== personReplacementImageSourceRef,
        value6 = value3
          ? getShotSwitchDirection(shotId)
          : count > personReplacementActiveImageResultIndex3
            ? 'next'
            : 'previous',
        value7 = value4 ? captureImagePreviewSlide() : null,
        value8 = value5 ? captureMiddlePreviewSlide() : null,
        captureResultHistoryMenu2 = captureResultHistoryMenu(),
        setPersonReplacementImageResultAsReference2 = setPersonReplacementImageResultAsReference(config, {
          shotId: shotId,
          resultIndex: resultIndex,
        });
      if (!setPersonReplacementImageResultAsReference2['changed']) return ![];
      updateProject(
        reconcilePersonReplacementShotGenerationState(
          setPersonReplacementImageResultAsReference2['project'],
          new Set(setPersonReplacementImageResultAsReference2['changedShotIds']),
        ),
        'replacement-image-reference',
      );
      value4 && playImagePreviewTransition(value6 || 'next', value7);
      value5 && playMiddlePreviewTransition(value6 || 'next', value8);
      if (value3) scrollShotCardIntoView(shotId);
      return (
        restoreResultHistoryMenu(captureResultHistoryMenu2),
        windowObject?.['showToast']?.(
          setPersonReplacementImageResultAsReference2['clearedReference']
            ? '已取消下一轮参考图。'
            : '已设为下一轮参考图；人物绑定保持不变。',
          'success',
        ),
        !![]
      );
    },
    deleteImageResult = (value9, value10) => {
      const shots2 = getProject(),
        timelineShotId = normalizeText(value9),
        enabled5 = shots2['shots']['find']((value11) => value11['id'] === timelineShotId),
        list3 = getPersonReplacementImageResults(enabled5),
        count2 = Number(value10);
      if (
        !enabled5 ||
        list3['length'] < 0x2 ||
        !Number['isInteger'](count2) ||
        count2 < 0x0 ||
        count2 >= list3['length']
      )
        return ![];
      const captureResultHistoryMenu3 = captureResultHistoryMenu(),
        personReplacementActiveImageResultIndex4 = getPersonReplacementActiveImageResultIndex(
          enabled5,
          list3,
        ),
        personReplacementImageResultRef2 = resolvePersonReplacementImageResultRef(
          list3[personReplacementActiveImageResultIndex4],
        ),
        results2 = list3['filter']((value12, value13) => value13 !== count2),
        activeIndex2 =
          count2 < personReplacementActiveImageResultIndex4
            ? personReplacementActiveImageResultIndex4 - 0x1
            : count2 === personReplacementActiveImageResultIndex4
              ? Math['min'](count2, results2['length'] - 0x1)
              : personReplacementActiveImageResultIndex4,
        replacementImageRef2 = resolvePersonReplacementImageResultRef(results2[activeIndex2]),
        value14 = Object['prototype']['hasOwnProperty']['call'](results2[activeIndex2], 'userPrompt'),
        imagePrompt2 = normalizeText(results2[activeIndex2]?.['userPrompt']),
        value15 = replacementImageRef2 !== personReplacementImageResultRef2;
      return (
        updateProject(
          {
            ...shots2,
            shots: shots2['shots']['map']((args3) =>
              args3['id'] === timelineShotId
                ? {
                    ...args3,
                    replacementImage: {
                      ...(args3['replacementImage'] || {}),
                      results: results2,
                      activeIndex: activeIndex2,
                    },
                    replacementImageRef: replacementImageRef2,
                    ...(value15 && value14 ? { imagePrompt: imagePrompt2 } : {}),
                  }
                : args3,
            ),
          },
          'delete-replacement-image-result',
          { timelineShotId: timelineShotId },
        ),
        restoreResultHistoryMenu(captureResultHistoryMenu3),
        !![]
      );
    },
    selectVideoResult = (value16, value17, { direction: direction = '' } = {}) => {
      const shots3 = getProject(),
        text3 = normalizeText(value16),
        enabled6 = shots3['shots']['find']((value18) => value18['id'] === text3),
        results3 = getPersonReplacementVideoResults(enabled6);
      if (!enabled6 || !results3['length']) return ![];
      const personReplacementActiveVideoResultIndex = getPersonReplacementActiveVideoResultIndex(
          enabled6,
          results3,
        ),
        activeIndex3 = Math['max'](
          0x0,
          Math['min'](results3['length'] - 0x1, Math['trunc'](Number(value17) || 0x0)),
        );
      if (activeIndex3 === personReplacementActiveVideoResultIndex) return ![];
      const value19 =
          direction || (activeIndex3 > personReplacementActiveVideoResultIndex ? 'next' : 'previous'),
        value20 = captureVideoResultSlide(),
        resultVideoRef = resolvePersonReplacementVideoResultRef(results3[activeIndex3]);
      return (
        updateProject(
          run({
            ...shots3,
            shots: shots3['shots']['map']((args4) =>
              args4['id'] === text3
                ? {
                    ...args4,
                    replacementVideo: {
                      ...(args4['replacementVideo'] || {}),
                      results: results3,
                      activeIndex: activeIndex3,
                    },
                    resultVideoRef: resultVideoRef,
                    generationStatus: 'succeeded',
                    error: '',
                  }
                : args4,
            ),
          }),
          'replacement-video-result',
        ),
        playVideoResultTransition(value19, value20),
        !![]
      );
    },
    deleteVideoResult = (value21, value22) => {
      const shots4 = getProject(),
        text4 = normalizeText(value21),
        enabled7 = shots4['shots']['find']((value23) => value23['id'] === text4),
        list4 = getPersonReplacementVideoResults(enabled7),
        count3 = Number(value22);
      if (
        !enabled7 ||
        list4['length'] < 0x2 ||
        !Number['isInteger'](count3) ||
        count3 < 0x0 ||
        count3 >= list4['length']
      )
        return ![];
      const captureResultHistoryMenu4 = captureResultHistoryMenu(),
        personReplacementActiveVideoResultIndex2 = getPersonReplacementActiveVideoResultIndex(
          enabled7,
          list4,
        ),
        personReplacementVideoResultRef = resolvePersonReplacementVideoResultRef(
          list4[personReplacementActiveVideoResultIndex2],
        ),
        results4 = list4['filter']((value24, value25) => value25 !== count3),
        activeIndex4 =
          count3 < personReplacementActiveVideoResultIndex2
            ? personReplacementActiveVideoResultIndex2 - 0x1
            : count3 === personReplacementActiveVideoResultIndex2
              ? Math['min'](count3, results4['length'] - 0x1)
              : personReplacementActiveVideoResultIndex2,
        resultVideoRef2 = resolvePersonReplacementVideoResultRef(results4[activeIndex4]),
        value26 = resultVideoRef2 !== personReplacementVideoResultRef;
      return (
        updateProject(
          run(
            {
              ...shots4,
              shots: shots4['shots']['map']((args5) =>
                args5['id'] === text4
                  ? {
                      ...args5,
                      replacementVideo: {
                        ...(args5['replacementVideo'] || {}),
                        results: results4,
                        activeIndex: activeIndex4,
                      },
                      resultVideoRef: resultVideoRef2,
                      ...(value26 ? { generationStatus: 'succeeded', error: '' } : {}),
                    }
                  : args5,
              ),
            },
            value26,
          ),
          'delete-replacement-video-result',
        ),
        restoreResultHistoryMenu(captureResultHistoryMenu4),
        !![]
      );
    },
    setVideoReference = (shotId2, resultIndex2) => {
      const value27 = getProject(),
        setPersonReplacementVideoResultAsReference2 = setPersonReplacementVideoResultAsReference(value27, {
          shotId: shotId2,
          resultIndex: resultIndex2,
        });
      if (!setPersonReplacementVideoResultAsReference2['changed']) return ![];
      const value28 = setPersonReplacementVideoResultAsReference2['project']['workspace']['selectedShotId'],
        value29 = value27['shots']['find']((value30) => value30['id'] === value28),
        value31 = value28 !== value27['workspace']['selectedShotId'],
        personReplacementActiveVideoResultIndex3 =
          getPersonReplacementActiveVideoResultIndex(value29) !== Math['trunc'](Number(resultIndex2)),
        value32 = value31
          ? getShotSwitchDirection(value28)
          : Number(resultIndex2) > getPersonReplacementActiveVideoResultIndex(value29)
            ? 'next'
            : 'previous',
        value33 = captureMiddlePreviewSlide(),
        value34 = value31 || personReplacementActiveVideoResultIndex3 ? captureVideoResultSlide() : null,
        captureResultHistoryMenu5 = captureResultHistoryMenu();
      (updateProject(
        run(setPersonReplacementVideoResultAsReference2['project'], personReplacementActiveVideoResultIndex3),
        'replacement-video-reference',
      ),
        playMiddlePreviewTransition(value32 || 'next', value33));
      (value31 || personReplacementActiveVideoResultIndex3) &&
        playVideoResultTransition(value32 || 'next', value34);
      if (value31) scrollShotCardIntoView(value28);
      return (
        restoreResultHistoryMenu(captureResultHistoryMenu5),
        windowObject?.['showToast']?.(
          setPersonReplacementVideoResultAsReference2['clearedReference']
            ? '已取消下一轮参考视频。'
            : '已设为下一轮原视频；人物绑定保持不变。',
          'success',
        ),
        !![]
      );
    },
    switchVideoResult = (value35, value36) => {
      const value37 = getProject(),
        text5 = normalizeText(value36 ?? value37['workspace']['selectedShotId']),
        enabled8 = value37['shots']['find']((value38) => value38['id'] === text5),
        list5 = getPersonReplacementVideoResults(enabled8);
      if (!enabled8 || list5['length'] < 0x2) return ![];
      const personReplacementActiveVideoResultIndex4 = getPersonReplacementActiveVideoResultIndex(
          enabled8,
          list5,
        ),
        value39 =
          (personReplacementActiveVideoResultIndex4 +
            Math['sign'](Number(value35) || 0x0) +
            list5['length']) %
          list5['length'];
      return selectVideoResult(text5, value39, {
        direction: Math['sign'](Number(value35) || 0x0) < 0x0 ? 'previous' : 'next',
      });
    },
    selectVideoReference = (
      value40,
      value41,
      {
        sourceShotId: sourceShotId = '',
        resultIndex: resultIndex3,
        referencePersonId: referencePersonId = '',
        referenceKind: referenceKind = '',
      } = {},
    ) => {
      const value42 = getProject(),
        targetShotId = normalizeText(value40),
        enabled9 = value42['shots']['find']((value43) => value43['id'] === targetShotId),
        personReplacementVideoImageInput = resolvePersonReplacementVideoImageInput(value42, enabled9),
        list6 = Array['isArray'](personReplacementVideoImageInput['referenceOptions'])
          ? personReplacementVideoImageInput['referenceOptions']
          : [];
      if (!enabled9 || !list6['length']) return ![];
      const value44 = Math['max'](
          0x0,
          Math['min'](list6['length'] - 0x1, Math['trunc'](Number(value41) || 0x0)),
        ),
        value45 = list6[value44],
        personReplacementVideoReference = selectPersonReplacementVideoReference(value42, {
          targetShotId: targetShotId,
          sourceShotId: normalizeText(sourceShotId) || normalizeText(value45?.['sourceShotId']),
          resultIndex: Number['isInteger'](Math['trunc'](Number(resultIndex3)))
            ? Math['trunc'](Number(resultIndex3))
            : value45?.['resultIndex'],
          referencePersonId:
            normalizeText(referencePersonId) || normalizeText(value45?.['reference']?.['personId']),
          referenceKind: normalizeText(referenceKind) || normalizeText(value45?.['kind']),
        });
      if (!personReplacementVideoReference['changed']) return ![];
      return (updateProject(personReplacementVideoReference['project'], 'video-reference-change'), !![]);
    },
    switchVideoReferenceResult = ({
      targetShotId: targetShotId2,
      sourceShotId: sourceShotId2,
      currentResultIndex: currentResultIndex,
      delta: delta,
    } = {}) => {
      const value46 = getProject(),
        switchPersonReplacementVideoReferenceResult2 = switchPersonReplacementVideoReferenceResult(value46, {
          targetShotId: targetShotId2 ?? value46['workspace']['selectedShotId'],
          sourceShotId: sourceShotId2,
          currentResultIndex: currentResultIndex,
          delta: delta,
        });
      if (!switchPersonReplacementVideoReferenceResult2['changed']) return ![];
      return (
        updateProject(switchPersonReplacementVideoReferenceResult2['project'], 'video-reference-change'),
        !![]
      );
    };
  return Object['freeze']({
    deleteImageResult: deleteImageResult,
    deleteVideoResult: deleteVideoResult,
    selectImageResult: selectImageResult,
    selectVideoReference: selectVideoReference,
    selectVideoResult: selectVideoResult,
    setImageReference: setImageReference,
    setVideoReference: setVideoReference,
    switchImageResult: switchImageResult,
    switchVideoReferenceResult: switchVideoReferenceResult,
    switchVideoResult: switchVideoResult,
  });
}

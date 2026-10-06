import {
  PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
  PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
  getPersonReplacementActiveImageResultIndex,
  getPersonReplacementImageResults,
  resolvePersonReplacementImageResultRef,
  resolvePersonReplacementVideoImageInput,
} from './personReplacementProject.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function getShot(item, key) {
  const text = normalizeText(key);
  return (
    (Array.isArray(item?.shots) ? item.shots : []).find(
      (index) => normalizeText(index?.id) === text,
    ) || null
  );
}
function updateSourceImageResult(args, results, activeIndex) {
  const result = results[activeIndex],
    replacementImageRef = resolvePersonReplacementImageResultRef(result);
  if (!args || !replacementImageRef) return null;
  const data = Object.prototype.hasOwnProperty.call(result, 'userPrompt');
  return {
    ...args,
    replacementImage: {
      ...(args.replacementImage || {}),
      results: results,
      activeIndex: activeIndex,
    },
    replacementImageRef: replacementImageRef,
    ...(data ? { imagePrompt: normalizeText(result?.userPrompt) } : {}),
  };
}
export function selectPersonReplacementVideoReference(
  project = {},
  {
    targetShotId: targetShotId,
    sourceShotId: sourceShotId,
    resultIndex: resultIndex,
    referencePersonId: referencePersonId,
    referenceKind: referenceKind = PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
  } = {},
) {
  const text2 = normalizeText(targetShotId),
    sourceShotId2 = normalizeText(sourceShotId),
    shot = getShot(project, text2);
  if (!shot) return { changed: false, project: project };
  if (referenceKind === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE) {
    const list =
        resolvePersonReplacementVideoImageInput(project, shot, 'character-reference').referenceOptions?.filter((options) => options?.kind === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE) || [],
      text3 = normalizeText(referencePersonId),
      enabled =
        list.find((target) => normalizeText(target?.reference?.personId) === text3) ||
        (!text3 ? list[0] : null),
      replacementVideoReferencePersonId = normalizeText(enabled?.reference?.personId);
    if (!enabled || !replacementVideoReferencePersonId) return { changed: false, project: project };
    if (
      shot.replacementVideoReferenceKind === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE &&
      normalizeText(shot.replacementVideoReferencePersonId) === replacementVideoReferencePersonId
    )
      return { changed: false, project: project };
    return {
      changed: true,
      project: {
        ...project,
        shots: project.shots.map((args2) =>
          normalizeText(args2?.id) === text2
            ? {
                ...args2,
                replacementVideoReferenceKind: PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE,
                replacementVideoReferencePersonId: replacementVideoReferencePersonId,
              }
            : args2,
        ),
      },
    };
  }
  const shot2 = getShot(project, sourceShotId2),
    list2 = getPersonReplacementImageResults(shot2),
    resultIndex2 = Math.trunc(Number(resultIndex));
  if (!shot2 || !Number.isInteger(resultIndex2) || resultIndex2 < 0 || resultIndex2 >= list2.length)
    return { changed: false, project: project };
  const updateSourceImageResult2 = updateSourceImageResult(shot2, list2, resultIndex2),
    imageRef = normalizeText(updateSourceImageResult2?.replacementImageRef);
  if (!updateSourceImageResult2 || !imageRef) return { changed: false, project: project };
  const source =
    shot.replacementVideoReferenceKind === PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE &&
    normalizeText(shot.replacementVideoReferenceSourceShotId) === sourceShotId2 &&
    normalizeText(shot.replacementVideoReferenceImageRef) === imageRef &&
    getPersonReplacementActiveImageResultIndex(shot2, list2) === resultIndex2;
  if (source) return { changed: false, project: project };
  return {
    changed: true,
    sourceShotId: sourceShotId2,
    resultIndex: resultIndex2,
    imageRef: imageRef,
    project: {
      ...project,
      shots: project.shots.map((next) => {
        const text4 = normalizeText(next?.id);
        let current = text4 === sourceShotId2 ? updateSourceImageResult2 : next;
        if (text4 === text2) {
          const { replacementVideoReferencePersonId: replacementVideoReferencePersonId2, ...args3 } = current;
          current = {
            ...args3,
            replacementVideoReferenceKind: PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_REPLACEMENT_IMAGE,
            replacementVideoReferenceSourceShotId: sourceShotId2,
            replacementVideoReferenceImageRef: imageRef,
          };
        }
        return current;
      }),
    },
  };
}
export function switchPersonReplacementVideoReferenceResult(
  project2 = {},
  {
    targetShotId: targetShotId2,
    sourceShotId: sourceShotId3,
    currentResultIndex: currentResultIndex,
    delta: delta,
  } = {},
) {
  const targetShotId3 = normalizeText(targetShotId2),
    sourceShotId4 = normalizeText(sourceShotId3),
    shot3 = getShot(project2, targetShotId3),
    shot4 = getShot(project2, sourceShotId4),
    list3 = getPersonReplacementImageResults(shot4);
  if (!shot3 || !shot4 || list3.length < 2) return { changed: false, project: project2 };
  const count = Math.trunc(Number(currentResultIndex)),
    entry =
      Number.isInteger(count) && count >= 0 && count < list3.length
        ? count
        : getPersonReplacementActiveImageResultIndex(shot4, list3),
    enabled2 = Math.sign(Number(delta) || 0);
  if (!enabled2) return { changed: false, project: project2 };
  const resultIndex3 = (entry + enabled2 + list3.length) % list3.length,
    personReplacementVideoImageInput = resolvePersonReplacementVideoImageInput(
      project2,
      shot3,
      'first-frame',
    ),
    record =
      personReplacementVideoImageInput.referenceOptions?.[
        personReplacementVideoImageInput.activeReferenceIndex
      ],
    payload =
      shot3.replacementVideoReferenceKind !== PERSON_REPLACEMENT_VIDEO_REFERENCE_KIND_CHARACTER_IMAGE &&
      normalizeText(record?.sourceShotId) === sourceShotId4;
  if (payload)
    return selectPersonReplacementVideoReference(project2, {
      targetShotId: targetShotId3,
      sourceShotId: sourceShotId4,
      resultIndex: resultIndex3,
    });
  const imageRef2 = updateSourceImageResult(shot4, list3, resultIndex3);
  if (!imageRef2) return { changed: false, project: project2 };
  return {
    changed: true,
    sourceShotId: sourceShotId4,
    resultIndex: resultIndex3,
    imageRef: imageRef2.replacementImageRef,
    project: {
      ...project2,
      shots: project2.shots.map((handle) =>
        normalizeText(handle?.id) === sourceShotId4 ? imageRef2 : handle,
      ),
    },
  };
}

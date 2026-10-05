import {
  getPersonReplacementImageResults,
  resolvePersonReplacementImageResultRef,
} from './personReplacementProject.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function setPersonReplacementImageResultAsReference(
  project = {},
  { shotId: shotId = '', resultIndex: resultIndex = 0 } = {},
) {
  const selectedShotId = normalizeText(shotId),
    shots = Array['isArray'](project?.['shots']) ? project['shots'] : [],
    count = shots['findIndex']((item) => normalizeText(item?.['id']) === selectedShotId),
    args = shots[count],
    results = getPersonReplacementImageResults(args),
    activeIndex = Math['trunc'](Number(resultIndex)),
    replacementImageRef = resolvePersonReplacementImageResultRef(results[activeIndex]);
  if (
    count < 0 ||
    !Number['isInteger'](activeIndex) ||
    activeIndex < 0 ||
    activeIndex >= results['length'] ||
    !replacementImageRef
  )
    return { project: project, changed: false, changedShotIds: [], imageRef: '' };
  const imageRef = normalizeText(args?.['keyframeRef']),
    text = normalizeText(args?.['imageIterationReferenceRef']),
    args2 = {
      ...args,
      replacementImage: {
        ...(args?.['replacementImage'] || {}),
        results: results,
        activeIndex: activeIndex,
      },
      replacementImageRef: replacementImageRef,
    },
    project2 = (key) => ({
      ...project,
      shots: shots['map']((index, result) => (result === count ? key : index)),
      workspace: { ...(project?.['workspace'] || {}), selectedShotId: selectedShotId },
    });
  if (replacementImageRef === text) {
    const data = { ...args2 };
    return (
      delete data['imageIterationReferenceRef'],
      {
        project: project2(data),
        changed: true,
        changedShotIds: [selectedShotId],
        imageRef: imageRef,
        clearedReference: true,
      }
    );
  }
  const options = { ...args2, imageIterationReferenceRef: replacementImageRef };
  return {
    project: project2(options),
    changed: true,
    changedShotIds: [selectedShotId],
    imageRef: replacementImageRef,
  };
}

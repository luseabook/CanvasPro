import {
  getPersonReplacementVideoResults,
  resolvePersonReplacementVideoResultRef,
  resolvePersonReplacementVideoSourceRef,
} from './personReplacementProject.js';
export function setPersonReplacementVideoResultAsReference(
  args = {},
  { shotId: shotId = '', resultIndex: resultIndex = 0 } = {},
) {
  const value = String(shotId ?? '')['trim'](),
    item = Array['isArray'](args['shots']) ? args['shots'] : [],
    args2 = item['find']((key) => key['id'] === value),
    personReplacementVideoResults = getPersonReplacementVideoResults(args2),
    count = Math['trunc'](Number(resultIndex)),
    personReplacementVideoResultRef = resolvePersonReplacementVideoResultRef(
      personReplacementVideoResults[count],
    );
  if (
    !args2 ||
    !Number['isInteger'](count) ||
    count < 0 ||
    count >= personReplacementVideoResults['length'] ||
    !personReplacementVideoResultRef
  )
    return { project: args, changed: false };
  const index = personReplacementVideoResultRef === args2['videoIterationReferenceRef'],
    result = {
      ...args2,
      replacementVideo: {
        ...args2['replacementVideo'],
        results: personReplacementVideoResults,
        activeIndex: count,
      },
      resultVideoRef: personReplacementVideoResultRef,
    };
  (delete result['videoIterationInputRef'], delete result['videoIterationInputIsReversed']);
  if (index) delete result['videoIterationReferenceRef'];
  else result['videoIterationReferenceRef'] = personReplacementVideoResultRef;
  return {
    changed: true,
    clearedReference: index,
    project: {
      ...args,
      shots: item['map']((data) => (data === args2 ? result : data)),
      workspace: { ...args['workspace'], selectedShotId: value },
    },
  };
}
export function reversePersonReplacementVideoIteration({
  project: project,
  shot: shot,
  isReversed: isReversed,
  sourceRef: sourceRef,
  getProject: getProject,
  setProject: setProject,
  enqueueMediaTask: enqueueMediaTask,
  resolveMediaRef: resolveMediaRef,
  isDestroyed: isDestroyed,
}) {
  const options = shot['videoIterationReferenceRef'];
  if (resolvePersonReplacementVideoSourceRef(shot) !== sourceRef)
    throw new Error('当前参考视频已变化，请重新打开裁剪。');
  const target = (async () => {
    const response = await enqueueMediaTask(
        { kind: 'videoReverse', src: sourceRef },
        { wait: true, timeout: 600000 },
      ),
      personReplacementVideoResultRef2 = resolvePersonReplacementVideoResultRef(resolveMediaRef(response));
    if (response?.['success'] === false || !personReplacementVideoResultRef2)
      throw new Error(response?.['error'] || '参考视频倒放失败。');
    const args3 = getProject(),
      source = args3['shots']['find']((next) => next['id'] === shot['id']);
    if (
      isDestroyed() ||
      args3['id'] !== project['id'] ||
      source?.['videoIterationReferenceRef'] !== options ||
      resolvePersonReplacementVideoSourceRef(source) !== sourceRef
    )
      return { ok: false, stale: true };
    const current = setProject(
      {
        ...args3,
        shots: args3['shots']['map']((args4) =>
          args4 === source
            ? {
                ...args4,
                videoIterationInputRef: personReplacementVideoResultRef2,
                videoIterationInputIsReversed: isReversed === true,
              }
            : args4,
        ),
      },
      { renderWorkspace: false },
    );
    return { ok: true, project: current };
  })();
  return { project: project, completion: target };
}

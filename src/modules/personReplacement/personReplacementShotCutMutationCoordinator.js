import { reversePersonReplacementVideoIteration } from './personReplacementVideoIteration.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneJson(item) {
  return JSON['parse'](JSON['stringify'](item));
}
export function createPersonReplacementShotCutMutationCoordinator() {
  let key = 0;
  const map = new Map(),
    invalidate = () => {
      return ((key += 1), key);
    },
    acceptRevision = (index) => {
      const count = Number(index);
      if (count > 0) return ((key = Math['max'](key, count)), count);
      return invalidate();
    },
    isCurrent = (result) => Number(result) === key,
    trackReverseCompletion = ({ projectId: projectId, shotId: shotId, completion: completion }) => {
      const data = projectId + '\x00' + shotId,
        options = { projectId: projectId, shotId: shotId, completion: null };
      return (
        (options['completion'] = Promise['resolve'](completion)['finally'](() => {
          map['get'](data) === options && map['delete'](data);
        })),
        map['set'](data, options),
        options['completion']
      );
    },
    waitForActiveReverse = async ({ projectId: projectId2, shotIds: shotIds = null } = {}) => {
      const map2 = shotIds instanceof Set ? shotIds : null,
        list = [...map['values']()]
          ['filter'](
            (target) =>
              target['projectId'] === normalizeText(projectId2) && (!map2 || map2['has'](target['shotId'])),
          )
          ['map']((source) => source['completion']);
      if (list['length']) await Promise['allSettled'](list);
    };
  return {
    acceptRevision: acceptRevision,
    getRevision: () => key,
    invalidate: invalidate,
    isCurrent: isCurrent,
    nextRevision: invalidate,
    trackReverseCompletion: trackReverseCompletion,
    waitForActiveReverse: waitForActiveReverse,
  };
}
export function createPersonReplacementShotReverseOperation({
  coordinator: coordinator,
  getProject: getProject,
  setProject: setProject,
  snapshot: snapshot,
  showToast: showToast,
  updateShotCutRanges: updateShotCutRanges,
  enqueueMediaTask: enqueueMediaTask,
  resolveMediaRef: resolveMediaRef,
  isDestroyed: isDestroyed = () => ![],
} = {}) {
  return function run({
    shotId: shotId2,
    isReversed: isReversed = ![],
    iterationReferenceRef: iterationReferenceRef = '',
    sourceRef: sourceRef = '',
  } = {}) {
    const project = getProject(),
      shotId3 = normalizeText(shotId2),
      shot = project['shots']['find']((next) => normalizeText(next['id']) === shotId3);
    if (!shot) throw new Error('未找到需要倒放的片段');
    if (iterationReferenceRef) {
      if (shot['videoIterationReferenceRef'] !== iterationReferenceRef)
        throw new Error('当前参考视频已变化，请重新打开裁剪。');
      return reversePersonReplacementVideoIteration({
        project: project,
        shot: shot,
        isReversed: isReversed,
        sourceRef: sourceRef,
        getProject: getProject,
        setProject: setProject,
        enqueueMediaTask: enqueueMediaTask,
        resolveMediaRef: resolveMediaRef,
        isDestroyed: isDestroyed,
      });
    }
    const projectId3 = normalizeText(project['id']),
      isReversed2 = isReversed === !![],
      current = shot['isReversed'] === !![],
      materializedIsReversed = shot['materializedIsReversed'] === !![],
      revision = coordinator['nextRevision'](),
      entry = current !== isReversed2,
      materializationStatus = Boolean(shot['videoRef']) && materializedIsReversed === isReversed2,
      record = {
        ...project,
        shots: project['shots']['map']((args) =>
          args['id'] === shotId3
            ? {
                ...args,
                isReversed: isReversed2,
                materializedIsReversed: materializedIsReversed,
                materializationStatus: materializationStatus ? 'succeeded' : 'running',
                materializationProgress: materializationStatus ? 100 : 0,
                ...(entry
                  ? { replacementImage: { results: [], activeIndex: 0 }, replacementImageRef: '' }
                  : {}),
                error: '',
              }
            : args,
        ),
        ...(entry
          ? {
              workspace: {
                ...project['workspace'],
                imageGeneration: { status: 'idle', shotId: '', error: '' },
                imageGenerationsByShotId: {},
                videoGeneration: { status: 'idle', shotId: '', error: '' },
                videoGenerationsByShotId: {},
                videoPreparation: { status: 'idle', progress: 0, error: '' },
              },
            }
          : {}),
      },
      project2 = setProject(record, { renderWorkspace: ![] });
    if (materializationStatus)
      return {
        project: project2,
        completion: coordinator['trackReverseCompletion']({
          projectId: projectId3,
          shotId: shotId3,
          completion: Promise['resolve']({ ok: !![], project: cloneJson(project2), changedShotCount: 0 }),
        }),
      };
    const ranges = project2['shots']['map']((shotId4) => ({
        shotId: shotId4['id'],
        sourceId: shotId4['sourceId'],
        startSec: shotId4['startTimeSec'],
        endSec: shotId4['endTimeSec'],
        ...(shotId4['isReversed'] === !![] ? { isReversed: !![] } : {}),
      })),
      completion2 = updateShotCutRanges({
        ranges: ranges,
        selectedShotId: project2['workspace']['selectedShotId'] || shotId3,
        renderWorkspace: ![],
        notify: ![],
        revision: revision,
      })
        ['then']((ok) => ({ ok: ok?.['stale'] !== !![], ...ok }))
        ['catch']((error) => {
          const error2 = error?.['message'] || '视频倒放失败，请重试。',
            shots = getProject();
          return (
            !isDestroyed() &&
              coordinator['isCurrent'](revision) &&
              normalizeText(shots['id']) === projectId3 &&
              (setProject(
                {
                  ...shots,
                  shots: shots['shots']['map']((args2) =>
                    args2['id'] === shotId3
                      ? {
                          ...args2,
                          materializationStatus: 'failed',
                          materializationProgress: 0,
                          error: error2,
                        }
                      : args2,
                  ),
                },
                { renderWorkspace: ![] },
              ),
              showToast(error2, 'error')),
            { ok: ![], project: snapshot(), error: error2, stale: !coordinator['isCurrent'](revision) }
          );
        });
    return {
      project: project2,
      completion: coordinator['trackReverseCompletion']({
        projectId: projectId3,
        shotId: shotId3,
        completion: completion2,
      }),
    };
  };
}

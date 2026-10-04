import { PERSON_REPLACEMENT_CUT_EPSILON_SEC } from './personReplacementShotCutModel.js';
import { materializePersonReplacementShotPlayback } from './personReplacementShotReverse.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function cloneJson(item) {
  return JSON['parse'](JSON['stringify'](item));
}
export function createPersonReplacementVideoPreparationRunner({
  getProject: getProject,
  getProjectById: getProjectById = null,
  setProject: setProject,
  setProjectById: setProjectById = null,
  isDestroyed: isDestroyed = () => ![],
  waitForActiveReverse: waitForActiveReverse,
  fetchVideoMeta: fetchVideoMeta,
  resolveDurationSec: resolveDurationSec,
  enqueueMediaTask: enqueueMediaTask,
  resolveMediaRef: resolveMediaRef,
  showToast: showToast,
} = {}) {
  return async function run({
    projectId: projectId = '',
    shotIds: shotIds = null,
    notify: notify = !![],
    renderWorkspace: renderWorkspace = !![],
  } = {}) {
    const shotIds2 =
        Array['isArray'](shotIds) && shotIds['length']
          ? new Set(shotIds['map'](normalizeText)['filter'](Boolean))
          : null,
      handler = () => {
        const text = normalizeText(projectId);
        return text && typeof getProjectById === 'function' ? getProjectById(text) : getProject();
      },
      handler2 = (key, index = {}) =>
        typeof setProjectById === 'function'
          ? setProjectById(key?.['id'], key, index)
          : setProject(key, index),
      projectId2 = normalizeText(projectId || handler()?.['id']);
    await waitForActiveReverse({ projectId: projectId2, shotIds: shotIds2 });
    let shots = handler();
    if (isDestroyed() || normalizeText(shots['id']) !== projectId2)
      return { ok: ![], stale: !![], failures: [], project: cloneJson(shots) };
    const list = shots['shots']['filter'](
      (enabled) =>
        (!shotIds2 || shotIds2['has'](enabled['id'])) &&
        (!enabled['videoRef'] ||
          enabled['materializationStatus'] !== 'succeeded' ||
          Boolean(enabled['materializedIsReversed']) !== Boolean(enabled['isReversed'])),
    );
    if (!list['length'])
      return (
        (shots['workspace']['videoPreparation']?.['status'] !== 'succeeded' ||
          Number(shots['workspace']['videoPreparation']?.['progress']) !== 0x64 ||
          normalizeText(shots['workspace']['videoPreparation']?.['error'])) &&
          (shots = handler2(
            {
              ...shots,
              workspace: {
                ...shots['workspace'],
                videoPreparation: { status: 'succeeded', progress: 0x64, error: '' },
              },
            },
            { renderWorkspace: renderWorkspace },
          )),
        { ok: !![], project: cloneJson(shots) }
      );
    shots = handler2(
      {
        ...shots,
        workspace: {
          ...shots['workspace'],
          videoPreparation: { status: 'running', progress: 0x0, error: '' },
        },
        shots: shots['shots']['map']((error) =>
          list['some']((result) => result['id'] === error['id'])
            ? {
                ...error,
                materializationStatus: 'running',
                materializationProgress: 0x0,
                error: error['analysisStatus'] === 'failed' ? error['error'] : '',
              }
            : error,
        ),
      },
      { renderWorkspace: renderWorkspace },
    );
    const failures = [];
    for (let data = 0x0; data < list['length']; data += 0x1) {
      const shotId = list[data]['id'],
        shotId2 = shots['shots']['find']((options) => options['id'] === shotId),
        target = shots['sources']['find']((source) => source['id'] === shotId2?.['sourceId']),
        sourceVideoRef = shotId2?.['sourceVideoRef'] || target?.['videoRef'] || '';
      try {
        if (!shotId2 || !sourceVideoRef) throw new Error('镜头缺少原始视频地址');
        let endSec = Number(shotId2['endTimeSec']) || 0x0;
        if (!(endSec > shotId2['startTimeSec'])) {
          if (typeof fetchVideoMeta !== 'function') throw new Error('无法读取镜头结束时间');
          const next = resolveDurationSec(await fetchVideoMeta(sourceVideoRef));
          if (!(next > shotId2['startTimeSec'])) throw new Error('无法读取原视频时长');
          endSec = next;
        }
        const outputFps = [0x10, 0x18, 0x1e]['includes'](Math['round'](Number(shotId2['outputFps'])))
            ? Math['round'](Number(shotId2['outputFps']))
            : 0x18,
          range = {
            shotId: shotId2['id'],
            sourceId: shotId2['sourceId'],
            startSec: shotId2['startTimeSec'],
            endSec: endSec,
            ...(shotId2['isReversed'] === !![] ? { isReversed: !![] } : {}),
          },
          { videoRef: videoRef, videoRefIsCropped: videoRefIsCropped } =
            await materializePersonReplacementShotPlayback({
              currentShot: { ...shotId2, endTimeSec: endSec },
              range: range,
              isNewShot: ![],
              sourceVideoRef: sourceVideoRef,
              outputFps: outputFps,
              epsilonSec: PERSON_REPLACEMENT_CUT_EPSILON_SEC,
              enqueueMediaTask: enqueueMediaTask,
              resolveMediaRef: resolveMediaRef,
            }),
          shots2 = handler(),
          enabled2 = shots2['shots']['find']((current) => current['id'] === shotId);
        if (isDestroyed() || normalizeText(shots2['id']) !== projectId2)
          return { ok: ![], stale: !![], failures: failures, project: cloneJson(shots2) };
        if (!enabled2 || Boolean(enabled2['isReversed']) !== Boolean(shotId2['isReversed'])) {
          shots = shots2;
          continue;
        }
        const progress = Math['round'](((data + 0x1) / list['length']) * 0x64);
        shots = handler2(
          {
            ...shots2,
            shots: shots2['shots']['map']((error2) =>
              error2['id'] === shotId
                ? {
                    ...error2,
                    sourceVideoRef: sourceVideoRef,
                    endTimeSec: endSec,
                    durationSec: Math['max'](0x0, endSec - error2['startTimeSec']),
                    videoRef: videoRef,
                    videoRefIsCropped: videoRefIsCropped,
                    outputFps: outputFps,
                    materializedIsReversed: shotId2['isReversed'] === !![],
                    materializationStatus: 'succeeded',
                    materializationProgress: 0x64,
                    error: error2['analysisStatus'] === 'failed' ? error2['error'] : '',
                  }
                : error2,
            ),
            workspace: {
              ...shots2['workspace'],
              videoPreparation: { status: 'running', progress: progress, error: '' },
            },
          },
          { renderWorkspace: ![] },
        );
      } catch (error3) {
        const message = error3?.['message'] || '镜头切片失败';
        failures['push']({ shotId: shotId, message: message });
        const shots3 = handler();
        shots = handler2(
          {
            ...shots3,
            shots: shots3['shots']['map']((error4) =>
              error4['id'] === shotId
                ? {
                    ...error4,
                    materializationStatus: 'failed',
                    materializationProgress: 0x0,
                    error:
                      error4['analysisStatus'] === 'failed'
                        ? [error4['error'], message]['filter'](Boolean)['join']('；')
                        : message,
                  }
                : error4,
            ),
            workspace: {
              ...shots3['workspace'],
              videoPreparation: {
                status: 'running',
                progress: Math['round'](((data + 0x1) / list['length']) * 0x64),
                error: message,
              },
            },
          },
          { renderWorkspace: ![] },
        );
      }
    }
    const status = failures['length'] ? 'failed' : 'succeeded',
      error5 = failures['map']((error6) => error6['message'])['join']('；'),
      args = handler();
    shots = handler2(
      {
        ...args,
        workspace: {
          ...args['workspace'],
          videoPreparation: { status: status, progress: 0x64, error: error5 },
        },
      },
      { renderWorkspace: renderWorkspace },
    );
    if (notify) {
      if (failures['length']) showToast(error5 || '部分镜头切片失败。', 'error');
      else showToast('已准备\x20' + list['length'] + ' 个固定帧率镜头。', 'success');
    }
    return { ok: failures['length'] === 0x0, failures: failures, project: shots };
  };
}

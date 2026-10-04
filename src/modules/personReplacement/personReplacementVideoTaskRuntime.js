import { buildPersonReplacementVideoRequest } from './personReplacementVideoRequest.js';
import {
  PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
  PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE,
  resolvePersonReplacementVideoImageInput,
  resolvePersonReplacementVideoResultRef,
} from './personReplacementProject.js';
import {
  appendPersonReplacementVideoResults,
  resolvePersonReplacementVideoSlotState,
} from './personReplacementVideoInputs.js';
import {
  isPersonReplacementVideoGenerationActive,
  getRecoverablePersonReplacementVideoTask,
  resolvePersonReplacementVideoGenerationState,
  updatePersonReplacementVideoGenerationState,
} from './personReplacementVideoGeneration.js';
import {
  hasPersonReplacementGenerationTaskIdentityChanged,
  projectPersonReplacementGenerationTaskIdentity,
} from './personReplacementGenerationTaskIdentity.js';
import {
  PERSON_REPLACEMENT_OUTPUT_TRANSITIONS,
  transitionPersonReplacementOutput,
} from './personReplacementOutputLineage.js';
import {
  getSuccessfulVideoGenerationItems,
  getVideoGenerationResultError,
} from '../../components/video-node/videoGenerationResultRenderer.js';
import { resolveModelExecution, resolveModelProvider } from '../../manifests/index.js';
import {
  cancelRunningHubVideoTask,
  resumeAsyncVideoTask,
  resumeRunningHubVideoTask,
} from '../../../api/aiVideoApi.js';
import { resolveRunningHubWorkflowAccess } from '../../../api/configApi.js';
import { normalizeLocalPath } from '../../utils/localMediaPath.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
function resolveLocalVideoResultRef(response = {}) {
  return (
    [
      response?.['localPath'],
      response?.['displayLocalPath'],
      response?.['videoUrl'],
      response?.['url'],
      typeof response === 'string' ? response : '',
    ]
      ['map'](normalizeLocalPath)
      ['find'](Boolean) || ''
  );
}
function cloneJson(item) {
  return item && typeof item === 'object' ? JSON['parse'](JSON['stringify'](item)) : item;
}
function createRequestId() {
  const key = globalThis['crypto']?.['randomUUID']?.();
  return (
    'replacement-video-request-' + (key || Date['now']() + '-' + Math['round'](Math['random']() * 0x186a0))
  );
}
function normalizeStableRevisionValue(list) {
  if (Array['isArray'](list)) return list['map'](normalizeStableRevisionValue);
  if (list && typeof list === 'object')
    return Object['fromEntries'](
      Object['entries'](list)
        ['sort'](([index], [result]) => index['localeCompare'](result))
        ['map'](([data, options]) => [data, normalizeStableRevisionValue(options)]),
    );
  return list;
}
function normalizeSlotRevision(options2 = {}) {
  return normalizeStableRevisionValue(
    Object['fromEntries'](
      Object['entries'](options2 && typeof options2 === 'object' ? options2 : {})['map'](
        ([target, response2]) => [
          target,
          {
            kind: normalizeText(response2?.['kind']),
            url: normalizeText(response2?.['url']),
            modelId: normalizeText(response2?.['modelId']),
          },
        ],
      ),
    ),
  );
}
export function createPersonReplacementVideoGenerationRevision({
  project: project = {},
  shot: shot = {},
  imageInput: imageInput = resolvePersonReplacementVideoImageInput(project, shot),
} = {}) {
  return JSON['stringify']({
    projectId: normalizeText(project?.['id']),
    shotId: normalizeText(shot?.['id']),
    videoRef: normalizeText(shot?.['videoRef']),
    videoIterationReferenceRef: normalizeText(shot?.['videoIterationReferenceRef']),
    videoIterationInputRef: normalizeText(shot?.['videoIterationInputRef']),
    videoPrompt: normalizeText(shot?.['videoPrompt']),
    imageMode: normalizeText(imageInput?.['mode']),
    imageRef: normalizeText(imageInput?.['imageRef']),
    referenceKind: normalizeText(imageInput?.['referenceKind']),
    outputFps: Number(shot?.['outputFps']) || 0x0,
    subjectCount:
      imageInput?.['mode'] === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE
        ? 0x1
        : (Array['isArray'](shot?.['people']) ? shot['people'] : [])['filter']((source) =>
            normalizeText(source?.['targetCharacterId']),
          )['length'],
    slotEntries: normalizeSlotRevision(shot?.['replacementVideoInputsBySlot']),
  });
}
function resolveImageInputWarning(error = {}) {
  if (error['mode'] === PERSON_REPLACEMENT_VIDEO_INPUT_MODE_CHARACTER_REFERENCE)
    return normalizeText(error['message']) || '请先在图像替换中为当前片段绑定一个人物参考图。';
  return '请先生成对应的替换首帧。';
}
async function resumePersonReplacementVideoTask(next, providerHint, current = {}) {
  const modelExecution =
    resolveModelExecution(providerHint?.['model']) ||
    resolveModelExecution(providerHint?.['model'], { providerHint: providerHint?.['provider'] });
  if (modelExecution?.['executionManifest']?.['adapterType'] === 'workflow')
    return resumeRunningHubVideoTask(next, providerHint, current);
  return resumeAsyncVideoTask(next, providerHint, current);
}
async function cancelPersonReplacementVideoTask({
  taskId: taskId,
  providerProfileId: providerProfileId = '',
} = {}) {
  const apiKey = await resolveRunningHubWorkflowAccess(providerProfileId);
  if (!apiKey['apiKey']) throw new Error('未配置\x20RunningHub\x20API\x20Key，无法取消远端任务');
  return cancelRunningHubVideoTask({
    apiKey: apiKey['apiKey'],
    taskId: taskId,
    providerProfileId: providerProfileId || apiKey['providerProfileId'],
  });
}
export function createPersonReplacementVideoTaskRuntime({
  getProject: getProject,
  getProjectById: getProjectById = null,
  setProject: setProject,
  setProjectById: setProjectById = null,
  runPreparation: runPreparation,
  generateReplacementVideo: generateReplacementVideo,
  resumeReplacementVideo: resumeReplacementVideo = resumePersonReplacementVideoTask,
  cancelReplacementVideo: cancelReplacementVideo = cancelPersonReplacementVideoTask,
  resolveInstallId: resolveInstallId = async () => '',
  persistNow: persistNow = async () => {},
  showToast: showToast = () => {},
  notifyGenerationCompleted: notifyGenerationCompleted = () => {},
  now: now = () => new Date()['toISOString'](),
  createId: createId = createRequestId,
} = {}) {
  if (typeof getProject !== 'function' || typeof setProject !== 'function')
    throw new Error('Person\x20replacement\x20video\x20task\x20runtime\x20requires\x20project\x20access');
  let entry = ![],
    record = null,
    payload = '';
  const list2 = [],
    map = new Map(),
    handler = (handle = '') => {
      const text = normalizeText(handle);
      return text && typeof getProjectById === 'function' ? getProjectById(text) : getProject();
    },
    handler2 = (state) =>
      typeof setProjectById === 'function'
        ? setProjectById(state?.['id'], state, { renderWorkspace: ![] })
        : setProject(state, { renderWorkspace: ![] }),
    acceptUploadedResult = ({
      shotId: shotId = '',
      videoRef: videoRef = '',
      playbackVideoRef: playbackVideoRef = '',
      posterRef: posterRef = '',
      assetId: assetId = '',
      derivativeStatus: derivativeStatus = '',
      videoProxyStatus: videoProxyStatus = '',
      fileName: fileName = '',
      createdAt: createdAt = now(),
      expectedProjectId: expectedProjectId = '',
      expectedShotRevision: expectedShotRevision = '',
    } = {}) => {
      if (entry) return null;
      const project2 = getProject(),
        selectedShotId = normalizeText(shotId),
        videoUrl = normalizeText(videoRef),
        displayLocalPath = normalizeText(playbackVideoRef) || videoUrl;
      if (
        !normalizeText(expectedProjectId) ||
        normalizeText(project2?.['id']) !== normalizeText(expectedProjectId)
      )
        return null;
      const shot2 = project2?.['shots']?.['find'](
        (config) => normalizeText(config?.['id']) === selectedShotId,
      );
      if (!shot2 || !videoUrl) return null;
      if (
        !normalizeText(expectedShotRevision) ||
        createPersonReplacementVideoGenerationRevision({ project: project2, shot: shot2 }) !==
          normalizeText(expectedShotRevision)
      )
        return null;
      const replacementVideo = appendPersonReplacementVideoResults(shot2, [
          {
            videoUrl: videoUrl,
            localPath: videoUrl,
            ...(displayLocalPath !== videoUrl ? { displayLocalPath: displayLocalPath } : {}),
            ...(normalizeText(posterRef)
              ? { thumbnailUrl: normalizeText(posterRef), posterLocalPath: normalizeText(posterRef) }
              : {}),
            ...(normalizeText(assetId) ? { assetId: normalizeText(assetId) } : {}),
            ...(normalizeText(derivativeStatus) ? { derivativeStatus: normalizeText(derivativeStatus) } : {}),
            ...(normalizeText(videoProxyStatus) ? { videoProxyStatus: normalizeText(videoProxyStatus) } : {}),
            source: 'upload',
            fileName: normalizeText(fileName) || '上传替换视频',
            createdAt: createdAt,
          },
        ]),
        resultVideoRef = resolvePersonReplacementVideoResultRef(
          replacementVideo['results'][replacementVideo['activeIndex']],
        );
      return handler2(
        transitionPersonReplacementOutput(
          {
            ...project2,
            shots: project2['shots']['map']((args) =>
              normalizeText(args?.['id']) === selectedShotId
                ? {
                    ...args,
                    replacementVideo: replacementVideo,
                    resultVideoRef: resultVideoRef,
                    generationStatus: 'succeeded',
                    error: '',
                  }
                : args,
            ),
            workspace: { ...project2['workspace'], selectedShotId: selectedShotId },
          },
          { type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE'] },
        ),
      );
    },
    handler3 = (
      { projectId: projectId, shotId: shotId2, requestId: requestId, revision: revision },
      args2 = {},
      { persistIdentity: persistIdentity = ![] } = {},
    ) => {
      if (!handler4({ projectId: projectId, shotId: shotId2, requestId: requestId, revision: revision }))
        return ![];
      const shots = handler(projectId),
        args3 = shots['workspace']?.['videoGenerationsByShotId']?.[shotId2] || {},
        generationStatus = { ...args3, ...args2, shotId: shotId2, requestId: requestId },
        enabled =
          Object['keys'](generationStatus)['some'](
            (scope) => !Object['is'](generationStatus[scope], args3[scope]),
          ) || Object['keys'](args3)['some']((input) => !Object['hasOwn'](generationStatus, input));
      if (!enabled) return !![];
      return (
        handler2({
          ...shots,
          shots: shots['shots']['map']((args4) =>
            args4['id'] === shotId2
              ? {
                  ...args4,
                  generationStatus:
                    generationStatus['status'] === 'failed'
                      ? 'failed'
                      : generationStatus['status'] === 'succeeded'
                        ? 'succeeded'
                        : 'running',
                  ...(generationStatus['status'] === 'failed'
                    ? { error: normalizeText(generationStatus['error']) }
                    : {}),
                }
              : args4,
          ),
          workspace: updatePersonReplacementVideoGenerationState(shots['workspace'], generationStatus),
        }),
        persistIdentity &&
          normalizeText(generationStatus['taskId']) &&
          hasPersonReplacementGenerationTaskIdentityChanged(args3, generationStatus) &&
          void Promise['resolve'](persistNow())['catch'](() => {}),
        !![]
      );
    },
    handler4 = ({ projectId: projectId2, shotId: shotId3, requestId: requestId2, revision: revision2 }) => {
      if (entry) return ![];
      const project3 = handler(projectId2);
      if (normalizeText(project3?.['id']) !== projectId2) return ![];
      const shot3 = project3?.['shots']?.['find']((output) => normalizeText(output?.['id']) === shotId3);
      if (!shot3) return ![];
      const value2 = project3['workspace']?.['videoGenerationsByShotId']?.[shotId3];
      if (normalizeText(value2?.['requestId']) !== requestId2) return ![];
      return createPersonReplacementVideoGenerationRevision({ project: project3, shot: shot3 }) === revision2;
    },
    handler5 = ({ projectId: projectId3, shotId: shotId4, requestId: requestId3 }) => {
      if (entry) return ![];
      const shots2 = handler(projectId3);
      if (normalizeText(shots2?.['id']) !== projectId3) return ![];
      const response3 = shots2['workspace']?.['videoGenerationsByShotId']?.[shotId4];
      if (
        normalizeText(response3?.['requestId']) !== requestId3 ||
        !['queued', 'submitting', 'running']['includes'](
          normalizeText(response3?.['status'])['toLowerCase'](),
        )
      )
        return ![];
      return (
        handler2({
          ...shots2,
          shots: shots2['shots']['map']((args5) =>
            args5['id'] === shotId4 && args5['generationStatus'] === 'running'
              ? { ...args5, generationStatus: 'pending' }
              : args5,
          ),
          workspace: updatePersonReplacementVideoGenerationState(shots2['workspace'], {
            status: 'idle',
            shotId: shotId4,
            error: '',
          }),
        }),
        !![]
      );
    },
    handler6 = (value3 = '') => ({
      ok: ![],
      stale: !![],
      failures: [],
      project: cloneJson(handler(value3)),
    }),
    handler7 = () => {
      if (record) return record;
      return (
        (record = (async () => {
          while (list2['length']) {
            const projectId4 = list2['shift']();
            payload = projectId4['projectId'];
            if (entry || !handler(projectId4['projectId'])) {
              (projectId4['resolve'](handler6(projectId4['projectId'])), (payload = ''));
              continue;
            }
            try {
              const value4 =
                typeof runPreparation === 'function'
                  ? await runPreparation({
                      projectId: projectId4['projectId'],
                      shotIds: projectId4['prepareAll'] ? null : [...projectId4['shotIds']],
                      notify: projectId4['notify'],
                      renderWorkspace: projectId4['renderWorkspace'],
                    })
                  : { ok: !![], failures: [], project: cloneJson(handler(projectId4['projectId'])) };
              projectId4['resolve'](entry ? handler6(projectId4['projectId']) : value4);
            } catch (value5) {
              projectId4['reject'](value5);
            } finally {
              payload === projectId4['projectId'] && (payload = '');
            }
          }
        })()['finally'](() => {
          record = null;
        })),
        record
      );
    },
    prepare = (notify = {}) => {
      if (entry) return Promise['resolve'](handler6(notify?.['projectId']));
      const projectId5 = normalizeText(notify?.['projectId'] || getProject()?.['id']),
        list3 = Array['isArray'](notify?.['shotIds'])
          ? notify['shotIds']['map'](normalizeText)['filter'](Boolean)
          : [],
        value6 = list2['at'](-0x1);
      if (value6 && value6['projectId'] === projectId5) {
        if (!list3['length']) value6['prepareAll'] = !![];
        (list3['forEach']((value7) => value6['shotIds']['add'](value7)),
          (value6['notify'] = value6['notify'] || notify?.['notify'] !== ![]),
          (value6['renderWorkspace'] = value6['renderWorkspace'] || notify?.['renderWorkspace'] !== ![]));
        const value8 = new Promise((resolve2, reject2) => {
          value6['listeners']['push']({ resolve: resolve2, reject: reject2 });
        });
        return (handler7(), value8);
      }
      let run, handler8;
      const value9 = new Promise((value10, value11) => {
          ((run = value10), (handler8 = value11));
        }),
        value12 = {
          projectId: projectId5,
          prepareAll: !list3['length'],
          shotIds: new Set(list3),
          notify: notify?.['notify'] !== ![],
          renderWorkspace: notify?.['renderWorkspace'] !== ![],
          listeners: [],
          resolve(value13) {
            (run(value13), this['listeners']['forEach']((promise) => promise['resolve'](value13)));
          },
          reject(value14) {
            (handler8(value14), this['listeners']['forEach']((promise2) => promise2['reject'](value14)));
          },
        };
      return (list2['push'](value12), handler7(), value9);
    },
    generate = async ({
      projectId: projectId6 = '',
      shotId: shotId5,
      notifyCompletion: notifyCompletion = !![],
      recoveryTask: recoveryTask = null,
    } = {}) => {
      const shotId6 = normalizeText(shotId5);
      let projectId7 = handler(projectId6),
        shot4 = projectId7?.['shots']?.['find']((value15) => normalizeText(value15?.['id']) === shotId6);
      if (!shot4 || entry) return null;
      const args6 = getRecoverablePersonReplacementVideoTask(
          projectId7['workspace']?.['videoGenerationsByShotId']?.[shotId6],
        ),
        providerHint2 = recoveryTask ? { ...args6, ...recoveryTask } : null;
      if (!providerHint2 && args6) return null;
      let imageInput2 = resolvePersonReplacementVideoImageInput(projectId7, shot4);
      if (imageInput2['status'] !== 'ready')
        return (showToast(resolveImageInputWarning(imageInput2), 'warn'), null);
      let slotState = resolvePersonReplacementVideoSlotState(projectId7, shot4);
      if (!slotState['slotEntries']['sourceVideo']?.['url']) {
        const value16 = await prepare({ projectId: projectId7?.['id'], shotIds: [shotId6] });
        if (value16?.['stale'] || entry) return { ok: ![], stale: !![], shotId: shotId6 };
        ((projectId7 = handler(projectId7?.['id'])),
          (shot4 = projectId7?.['shots']?.['find']((value17) => normalizeText(value17?.['id']) === shotId6)),
          (slotState = resolvePersonReplacementVideoSlotState(projectId7, shot4)));
      }
      if (!slotState['slotEntries']['sourceVideo']?.['url'])
        return (showToast(shot4?.['error'] || '对应镜头尚未完成切片。', 'warn'), null);
      imageInput2 = resolvePersonReplacementVideoImageInput(projectId7, shot4);
      if (imageInput2['status'] !== 'ready')
        return (showToast(imageInput2['message'] || '当前图片入参不可用。', 'warn'), null);
      if (
        providerHint2
          ? typeof resumeReplacementVideo !== 'function'
          : typeof generateReplacementVideo !== 'function'
      )
        return (showToast('视频生成服务尚未初始化。', 'error'), null);
      const projectId8 = normalizeText(projectId7?.['id']),
        value18 = projectId8 + ':video:' + shotId6;
      if (map['has'](value18)) return null;
      const requestId4 = normalizeText(providerHint2?.['requestId']) || normalizeText(createId()),
        revision3 = createPersonReplacementVideoGenerationRevision({
          project: projectId7,
          shot: shot4,
          imageInput: imageInput2,
        }),
        modelId =
          normalizeText(providerHint2?.['modelId']) ||
          projectId7['settings']['replacementModelId'] ||
          PERSON_REPLACEMENT_DEFAULT_VIDEO_MODEL_ID,
        resolvedExecution =
          resolveModelExecution(modelId) ||
          resolveModelExecution(modelId, { providerHint: providerHint2?.['provider'] }),
        provider =
          normalizeText(providerHint2?.['provider']) ||
          normalizeText(resolvedExecution?.['modelManifest']?.['provider']) ||
          resolveModelProvider(modelId),
        providerProfileId2 =
          normalizeText(providerHint2?.['providerProfileId']) ||
          normalizeText(projectId7['settings']['replacementVideoProviderProfileId']),
        executionId =
          normalizeText(providerHint2?.['executionId']) ||
          normalizeText(resolvedExecution?.['executionManifest']?.['id']),
        startedAt = Number(providerHint2?.['startedAt']) || Date['now'](),
        abortController = new AbortController(),
        value19 = {
          projectId: projectId8,
          shotId: shotId6,
          requestId: requestId4,
          revision: revision3,
          abortController: abortController,
          taskId: normalizeText(providerHint2?.['taskId']),
        };
      (map['set'](value18, value19),
        handler2({
          ...projectId7,
          workspace: updatePersonReplacementVideoGenerationState(projectId7['workspace'], {
            status: providerHint2 ? 'running' : 'submitting',
            shotId: shotId6,
            requestId: requestId4,
            taskId: normalizeText(providerHint2?.['taskId']),
            modelId: modelId,
            provider: provider,
            providerProfileId: providerProfileId2,
            executionId: executionId,
            startedAt: startedAt,
            useOpenapiQuery: providerHint2?.['useOpenapiQuery'] === !![],
            error: '',
          }),
          shots: projectId7['shots']['map']((args7) =>
            args7['id'] === shotId6 ? { ...args7, generationStatus: 'running' } : args7,
          ),
        }));
      try {
        const installId = await resolveInstallId(modelId);
        if (!handler4({ projectId: projectId8, shotId: shotId6, requestId: requestId4, revision: revision3 }))
          return (
            handler5({ projectId: projectId8, shotId: shotId6, requestId: requestId4 }),
            { ok: ![], stale: !![], shotId: shotId6 }
          );
        const personReplacementVideoRequest = buildPersonReplacementVideoRequest({
            currentProject: projectId7,
            shot: shot4,
            modelId: modelId,
            provider: provider,
            providerProfileId: providerProfileId2,
            resolvedExecution: resolvedExecution,
            installId: installId,
            imageInput: imageInput2,
            slotState: slotState,
          }),
          handler9 = (taskId2, meta = {}) => {
            const args8 = handler(projectId8)?.['workspace']?.['videoGenerationsByShotId']?.[shotId6] || {},
              args9 = projectPersonReplacementGenerationTaskIdentity({
                taskId: taskId2,
                meta: meta,
                defaults: {
                  modelId: modelId,
                  provider: provider,
                  providerProfileId: providerProfileId2,
                  executionId: executionId,
                  startedAt: startedAt,
                  ...args8,
                },
              });
            if (!args9['taskId']) return;
            ((value19['taskId'] = args9['taskId']),
              handler3(value19, { status: 'running', ...args9, error: '' }, { persistIdentity: !![] }));
          },
          value20 = {
            signal: abortController['signal'],
            useOpenapiQuery: providerHint2?.['useOpenapiQuery'] === !![],
            onTaskId: (value21) => handler9(value21),
            onTaskMeta: (options3 = {}) => handler9(options3['taskId'], options3),
            onRunningHubWorkflowQueueChange: (response4 = {}) => {
              const status =
                normalizeText(response4['status'])['toLowerCase']() === 'queued' ? 'queued' : 'running';
              handler3(value19, { status: status, error: '' });
            },
          },
          value22 = providerHint2
            ? await resumeReplacementVideo(providerHint2['taskId'], personReplacementVideoRequest, value20)
            : await generateReplacementVideo(personReplacementVideoRequest, value20);
        if (!handler4({ projectId: projectId8, shotId: shotId6, requestId: requestId4, revision: revision3 }))
          return (
            handler5({ projectId: projectId8, shotId: shotId6, requestId: requestId4 }),
            { ok: ![], stale: !![], shotId: shotId6 }
          );
        const now2 = now(),
          list4 = getSuccessfulVideoGenerationItems(value22),
          list5 = list4['map']((args10) => ({
            ...args10,
            localPath: resolveLocalVideoResultRef(args10),
            createdAt: normalizeText(args10?.['createdAt']) || now2,
          }))['filter']((value23) => value23['localPath']);
        if (!list5['length'])
          throw new Error(
            list4['map']((value24) => normalizeText(value24?.['localSaveError'] || value24?.['saveError']))[
              'find'
            ](Boolean) ||
              getVideoGenerationResultError(value22) ||
              '视频生成结果缺少可用地址',
          );
        const shots3 = handler(projectId8),
          value25 = shots3['shots']['find']((value26) => value26['id'] === shotId6),
          replacementVideo2 = appendPersonReplacementVideoResults(value25, list5),
          resultVideoRef2 = resolvePersonReplacementVideoResultRef(
            replacementVideo2['results'][replacementVideo2['activeIndex']],
          ),
          value27 = {
            ...shots3,
            shots: shots3['shots']['map']((args11) =>
              args11['id'] === shotId6
                ? {
                    ...args11,
                    replacementVideo: replacementVideo2,
                    resultVideoRef: resultVideoRef2,
                    generationStatus: 'succeeded',
                    error: '',
                  }
                : args11,
            ),
            workspace: updatePersonReplacementVideoGenerationState(shots3['workspace'], {
              status: 'succeeded',
              shotId: shotId6,
              requestId: requestId4,
              error: '',
            }),
          };
        handler2(
          transitionPersonReplacementOutput(value27, {
            type: PERSON_REPLACEMENT_OUTPUT_TRANSITIONS['INVALIDATE'],
          }),
        );
        let enabled2 = !![];
        try {
          await persistNow();
        } catch {
          enabled2 = ![];
        }
        if (!handler4({ projectId: projectId8, shotId: shotId6, requestId: requestId4, revision: revision3 }))
          return (
            handler5({ projectId: projectId8, shotId: shotId6, requestId: requestId4 }),
            { ok: ![], stale: !![], shotId: shotId6 }
          );
        return (
          (!enabled2 || notifyCompletion === ![]) &&
            showToast(
              enabled2 ? '视频替换已生成。' : '视频替换已生成，项目数据正在重试保存，请暂时不要刷新。',
              enabled2 ? 'success' : 'warn',
            ),
          notifyCompletion !== ![] &&
            notifyGenerationCompleted({ kind: 'video', mediaRef: resultVideoRef2, projectId: projectId8 }),
          { project: cloneJson(handler(projectId8)), ok: !![], shotId: shotId6 }
        );
      } catch (error2) {
        if (!handler4({ projectId: projectId8, shotId: shotId6, requestId: requestId4, revision: revision3 }))
          return (
            handler5({ projectId: projectId8, shotId: shotId6, requestId: requestId4 }),
            { ok: ![], stale: !![], shotId: shotId6 }
          );
        const error3 = error2?.['getUserMessage']?.() || error2?.['message'] || '视频替换生成失败',
          shots4 = handler(projectId8),
          value28 = handler2({
            ...shots4,
            shots: shots4['shots']['map']((args12) =>
              args12['id'] === shotId6 ? { ...args12, generationStatus: 'failed', error: error3 } : args12,
            ),
            workspace: updatePersonReplacementVideoGenerationState(shots4['workspace'], {
              status: 'failed',
              shotId: shotId6,
              requestId: requestId4,
              error: error3,
            }),
          });
        return { project: cloneJson(value28), ok: ![], shotId: shotId6, error: error3 };
      } finally {
        map['get'](value18)?.['requestId'] === requestId4 && map['delete'](value18);
      }
    },
    resume = async ({
      projectId: projectId9 = '',
      shotId: shotId7,
      notifyCompletion: notifyCompletion = !![],
    } = {}) => {
      const shotId8 = normalizeText(shotId7),
        projectId10 = handler(projectId9),
        recoveryTask2 = getRecoverablePersonReplacementVideoTask(
          projectId10?.['workspace']?.['videoGenerationsByShotId']?.[shotId8],
        );
      if (!recoveryTask2 || entry) return null;
      return generate({
        projectId: projectId10?.['id'],
        shotId: shotId8,
        notifyCompletion: notifyCompletion,
        recoveryTask: recoveryTask2,
      });
    },
    cancel = async ({ projectId: projectId11 = '', shotId: shotId9 } = {}) => {
      const shotId10 = normalizeText(shotId9),
        shots5 = handler(projectId11),
        enabled3 = shots5?.['shots']?.['find']((value29) => normalizeText(value29?.['id']) === shotId10),
        personReplacementVideoGenerationState = resolvePersonReplacementVideoGenerationState(
          shots5?.['workspace'],
          shotId10,
        );
      if (
        !enabled3 ||
        entry ||
        !isPersonReplacementVideoGenerationActive(personReplacementVideoGenerationState)
      )
        return null;
      const text2 = normalizeText(shots5['id']) + ':video:' + shotId10,
        value30 = map['get'](text2),
        text3 = normalizeText(personReplacementVideoGenerationState['requestId']),
        value31 = value30 && (!text3 || normalizeText(value30['requestId']) === text3) ? value30 : null,
        taskId3 = normalizeText(personReplacementVideoGenerationState['taskId'] || value31?.['taskId']),
        providerProfileId3 = normalizeText(
          personReplacementVideoGenerationState['providerProfileId'] ||
            shots5['settings']?.['replacementVideoProviderProfileId'],
        ),
        generationStatus2 = Boolean(
          normalizeText(enabled3['resultVideoRef']) ||
          (Array['isArray'](enabled3['replacementVideo']?.['results']) &&
            enabled3['replacementVideo']['results']['length']),
        );
      handler2({
        ...shots5,
        shots: shots5['shots']['map']((args13) =>
          args13['id'] === shotId10
            ? { ...args13, generationStatus: generationStatus2 ? 'succeeded' : 'pending', error: '' }
            : args13,
        ),
        workspace: updatePersonReplacementVideoGenerationState(shots5['workspace'], {
          status: 'idle',
          shotId: shotId10,
          error: '',
        }),
      });
      value31 && (map['delete'](text2), value31['abortController']?.['abort']?.());
      let remoteCancelled = !taskId3;
      if (taskId3 && typeof cancelReplacementVideo === 'function')
        try {
          (await cancelReplacementVideo({
            taskId: taskId3,
            providerProfileId: providerProfileId3,
            modelId: normalizeText(personReplacementVideoGenerationState['modelId']),
            provider: normalizeText(personReplacementVideoGenerationState['provider']),
          }),
            (remoteCancelled = !![]));
        } catch (error4) {
          const text4 =
            normalizeText(error4?.['getUserMessage']?.() || error4?.['message']) ||
            'RunningHub 远端任务取消失败';
          showToast('已停止本地等待，但' + text4, 'warn');
        }
      if (remoteCancelled) showToast('视频替换已取消。', 'info');
      return { ok: !![], shotId: shotId10, taskId: taskId3, remoteCancelled: remoteCancelled };
    },
    resumeRecoverable = async () => {
      if (entry) return [];
      const value32 = getProject(),
        text5 = normalizeText(value32?.['id']),
        list6 = Object['entries'](value32?.['workspace']?.['videoGenerationsByShotId'] || {})['flatMap'](
          ([value33, value34]) =>
            getRecoverablePersonReplacementVideoTask(value34) ? [normalizeText(value33)] : [],
        ),
        value35 = await Promise['allSettled'](list6['map']((shotId11) => resume({ shotId: shotId11 })));
      if (entry || !handler(text5)) return [];
      return value35;
    };
  return {
    acceptUploadedResult: acceptUploadedResult,
    prepare: prepare,
    generate: generate,
    cancel: cancel,
    resume: resume,
    resumeRecoverable: resumeRecoverable,
    hasActiveTasks: () => Boolean(record || list2['length'] || map['size']),
    getActiveGenerationCount: () => map['size'],
    hasActiveTasksForProject: (value36) => {
      const text6 = normalizeText(value36);
      if (!text6) return ![];
      return (
        list2['some']((value37) => value37['projectId'] === text6) ||
        payload === text6 ||
        [...map['values']()]['some']((value38) => value38['projectId'] === text6)
      );
    },
    destroy: () => {
      if (entry) return;
      (map['forEach']((value39) => {
        (value39['abortController']?.['abort']?.(), !normalizeText(value39['taskId']) && handler5(value39));
      }),
        map['clear'](),
        list2['splice'](0x0)['forEach']((promise3) => {
          promise3['resolve'](handler6());
        }),
        (entry = !![]));
    },
  };
}

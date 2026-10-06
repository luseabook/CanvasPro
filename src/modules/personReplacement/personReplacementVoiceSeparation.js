import {
  cancelRunningHubAudioTask,
  resumeAudioSeparationTask,
  runAudioSeparation,
} from '../../../api/aiAudioApi.js';
import { resolveRunningHubWorkflowAccess } from '../../../api/configApi.js';
import { localPathToUrl, normalizeLocalPath, pickResultLocalPath } from '../../utils/localMediaPath.js';
import { saveRemoteAudioLocallyDetailed } from '../../services/projectService.js';
import {
  createPersonReplacementVoiceSeparationRevision,
  isPersonReplacementVoiceSeparationActive,
  normalizePersonReplacementVoiceSeparationState,
  resolvePersonReplacementVoiceSeparationState,
  updatePersonReplacementVoiceSeparationState,
} from './personReplacementVoiceSeparationState.js';
function normalizeText(value) {
  return String(value ?? '').trim();
}
function cloneJson(item) {
  return item && typeof item === 'object' ? JSON.parse(JSON.stringify(item)) : item;
}
function createRequestId() {
  const key = globalThis.crypto?.randomUUID?.();
  return (
    'replacement-voice-separation-' + (key || Date.now() + '-' + Math.round(Math.random() * 100000))
  );
}
function resolveSeparationResultUrls(options = {}) {
  const list = Array.isArray(options?.audios) ? options.audios : [],
    vocalsAudioUrl = normalizeText(
      options.vocalsAudioUrl ||
        list.find((index) => normalizeText(index?.role).toLowerCase() === 'vocals')?.audioUrl ||
        list[0]?.audioUrl,
    ),
    backgroundAudioUrl = normalizeText(
      options.backgroundAudioUrl ||
        list.find((result) => normalizeText(result?.role).toLowerCase() === 'background')?.audioUrl ||
        list[1]?.audioUrl,
    );
  if (!vocalsAudioUrl || !backgroundAudioUrl) throw new Error('人声分离完成，但返回结果缺少人声或背景声音频');
  return { vocalsAudioUrl: vocalsAudioUrl, backgroundAudioUrl: backgroundAudioUrl };
}
async function persistSeparatedAudio(data, handler, target = {}) {
  const source = await handler(data, target),
    localPath = normalizeLocalPath(pickResultLocalPath(source)),
    localUrl = normalizeText(source?.localUrl || source?.audioUrl || localPathToUrl(localPath));
  if (!localPath || !localUrl) throw new Error('清晰人声已生成，但保存到本地失败');
  return { localPath: localPath, localUrl: localUrl };
}
async function cancelRemoteSeparationTask({
  taskId: taskId2,
  providerProfileId: providerProfileId = '',
} = {}) {
  const apiKey = await resolveRunningHubWorkflowAccess(providerProfileId);
  if (!apiKey?.apiKey) throw new Error('未配置 RunningHub API Key，无法取消远端任务');
  return cancelRunningHubAudioTask({
    apiKey: apiKey.apiKey,
    taskId: taskId2,
    providerProfileId: providerProfileId || apiKey.providerProfileId,
  });
}
export function createPersonReplacementVoiceSeparationRuntime({
  getProject: getProject,
  setProject: setProject,
  runSeparation: runSeparation = runAudioSeparation,
  resumeSeparation: resumeSeparation = resumeAudioSeparationTask,
  cancelSeparation: cancelSeparation = cancelRemoteSeparationTask,
  saveAudio: saveAudio = saveRemoteAudioLocallyDetailed,
  persistNow: persistNow = async () => {},
  onStateChange: onStateChange = () => {},
  showToast: showToast = () => {},
  now: now = () => new Date().toISOString(),
  createId: createId = createRequestId,
} = {}) {
  if (typeof getProject !== 'function' || typeof setProject !== 'function')
    throw new TypeError('Voice separation runtime requires project access');
  let enabled = false;
  const map = new Map(),
    handler2 = (next, current) => normalizeText(next) + ':' + normalizeText(current),
    handler3 = (entry, record) =>
      (Array.isArray(entry?.sources) ? entry.sources : []).find(
        (payload) => normalizeText(payload?.id) === normalizeText(record),
      ),
    handler4 = ({
      projectId: projectId,
      sourceId: sourceId,
      requestId: requestId,
      inputRevision: inputRevision,
    }) => {
      const project = getProject(),
        source2 = handler3(project, sourceId),
        personReplacementVoiceSeparationState = resolvePersonReplacementVoiceSeparationState(
          project,
          sourceId,
        );
      return (
        !enabled &&
        normalizeText(project?.id) === normalizeText(projectId) &&
        normalizeText(personReplacementVoiceSeparationState.requestId) === normalizeText(requestId) &&
        createPersonReplacementVoiceSeparationRevision({ project: project, source: source2 }) ===
          inputRevision
      );
    },
    handler5 = (sourceId2, args = {}, { persistIdentity: persistIdentity = false } = {}) => {
      if (!handler4(sourceId2)) return null;
      const args2 = getProject(),
        args3 = resolvePersonReplacementVoiceSeparationState(args2, sourceId2.sourceId),
        personReplacementVoiceSeparationState2 = normalizePersonReplacementVoiceSeparationState({
          ...args3,
          ...args,
          sourceId: sourceId2.sourceId,
          requestId: sourceId2.requestId,
          inputRevision: sourceId2.inputRevision,
        }),
        handle = setProject(
          {
            ...args2,
            audio: updatePersonReplacementVoiceSeparationState(
              args2.audio,
              personReplacementVoiceSeparationState2,
            ),
          },
          { renderWorkspace: false },
        );
      return (
        onStateChange({
          sourceId: sourceId2.sourceId,
          state: cloneJson(personReplacementVoiceSeparationState2),
          project: cloneJson(handle || getProject()),
        }),
        persistIdentity &&
          personReplacementVoiceSeparationState2.taskId !== args3.taskId &&
          void Promise.resolve(persistNow()).catch(() => {}),
        personReplacementVoiceSeparationState2
      );
    },
    handler6 = ({
      project: project2,
      source: source3,
      requestId: requestId2,
      inputRevision: inputRevision2,
    }) => {
      const args4 = resolvePersonReplacementVoiceSeparationState(project2, source3.id),
        personReplacementVoiceSeparationState3 = normalizePersonReplacementVoiceSeparationState({
          ...args4,
          sourceId: source3.id,
          status: 'submitting',
          requestId: requestId2,
          inputRevision: inputRevision2,
          taskId: '',
          providerProfileId: '',
          startedAt: now(),
          completedAt: '',
          error: '',
        }),
        state = setProject(
          {
            ...project2,
            audio: updatePersonReplacementVoiceSeparationState(
              project2.audio,
              personReplacementVoiceSeparationState3,
            ),
          },
          { renderWorkspace: false },
        );
      return (
        onStateChange({
          sourceId: source3.id,
          state: cloneJson(personReplacementVoiceSeparationState3),
          project: cloneJson(state || getProject()),
        }),
        personReplacementVoiceSeparationState3
      );
    },
    handler7 = async ({
      projectId: projectId2,
      sourceId: sourceId3,
      sourceVideoRef: sourceVideoRef,
      requestId: requestId3,
      inputRevision: inputRevision3,
      taskId: taskId = '',
      providerProfileId: providerProfileId = '',
      resume: resume = false,
      runtime: runtime,
    }) => {
      const config = {
        projectId: projectId2,
        sourceId: sourceId3,
        requestId: requestId3,
        inputRevision: inputRevision3,
      };
      try {
        const scope = resume
            ? await resumeSeparation(
                taskId,
                { providerProfileId: providerProfileId },
                { signal: runtime.abortController.signal, pollImmediately: true },
              )
            : await runSeparation(
                { audioUrl: localPathToUrl(sourceVideoRef) || sourceVideoRef },
                {
                  signal: runtime.abortController.signal,
                  onTaskMeta: (options2 = {}) => {
                    ((runtime.taskId = normalizeText(options2.taskId)),
                      (runtime.providerProfileId = normalizeText(options2.providerProfileId)),
                      handler5(
                        config,
                        {
                          status: 'running',
                          taskId: runtime.taskId,
                          providerProfileId: runtime.providerProfileId,
                        },
                        { persistIdentity: true },
                      ));
                  },
                  onTaskId: (input) => {
                    ((runtime.taskId = normalizeText(input)),
                      handler5(
                        config,
                        { status: 'running', taskId: runtime.taskId },
                        { persistIdentity: true },
                      ));
                  },
                },
              ),
          separationResultUrls = resolveSeparationResultUrls(scope);
        if (!handler4(config)) return null;
        const [vocalsAudioRef, backgroundAudioRef] = await Promise.all([
          persistSeparatedAudio(separationResultUrls.vocalsAudioUrl, saveAudio, {
            signal: runtime.abortController.signal,
          }),
          persistSeparatedAudio(separationResultUrls.backgroundAudioUrl, saveAudio, {
            signal: runtime.abortController.signal,
          }),
        ]);
        if (!handler4(config)) return null;
        const output = handler5(config, {
          status: 'succeeded',
          taskId: normalizeText(scope?.taskId || runtime.taskId),
          providerProfileId: runtime.providerProfileId || providerProfileId,
          completedAt: now(),
          vocalsAudioRef: vocalsAudioRef.localPath,
          vocalsAudioUrl: vocalsAudioRef.localUrl,
          backgroundAudioRef: backgroundAudioRef.localPath,
          backgroundAudioUrl: backgroundAudioRef.localUrl,
          error: '',
        });
        try {
          await persistNow();
        } catch {}
        return (showToast('清晰人声提取完成，已自动用于声音克隆。', 'success'), output);
      } catch (error) {
        if (runtime.abortController.signal.aborted || enabled) return null;
        const error2 = normalizeText(error?.message || error) || '清晰人声提取失败',
          value2 = handler5(config, { status: 'failed', completedAt: now(), error: error2 });
        return (showToast('清晰人声提取失败：' + error2, 'error'), value2);
      } finally {
        const value3 = handler2(projectId2, sourceId3);
        if (map.get(value3) === runtime) map.delete(value3);
      }
    },
    handler8 = ({ project: project3, source: source4, state: state2, resume: resume = false }) => {
      const projectId3 = normalizeText(project3.id),
        sourceId4 = normalizeText(source4.id),
        value4 = handler2(projectId3, sourceId4),
        value5 = map.get(value4);
      if (value5?.promise) return value5.promise;
      const runtime2 = {
        abortController: new AbortController(),
        taskId: normalizeText(state2.taskId),
        providerProfileId: normalizeText(state2.providerProfileId),
        promise: null,
      };
      return (
        (runtime2.promise = handler7({
          projectId: projectId3,
          sourceId: sourceId4,
          sourceVideoRef: source4.videoRef,
          requestId: state2.requestId,
          inputRevision: state2.inputRevision,
          taskId: state2.taskId,
          providerProfileId: state2.providerProfileId,
          resume: resume,
          runtime: runtime2,
        })),
        map.set(value4, runtime2),
        runtime2.promise
      );
    },
    extract = (value6 = '') => {
      if (enabled) return Promise.resolve(null);
      const project4 = getProject(),
        source5 = handler3(project4, value6);
      if (!source5?.videoRef)
        return (showToast('原始视频不可用，无法提取清晰人声。', 'warn'), Promise.resolve(null));
      const personReplacementVoiceSeparationState4 = resolvePersonReplacementVoiceSeparationState(
        project4,
        source5.id,
      );
      if (isPersonReplacementVoiceSeparationActive(personReplacementVoiceSeparationState4))
        return resume2(source5.id);
      const requestId4 = normalizeText(createId()),
        inputRevision4 = createPersonReplacementVoiceSeparationRevision({
          project: project4,
          source: source5,
        }),
        state3 = handler6({
          project: project4,
          source: source5,
          requestId: requestId4,
          inputRevision: inputRevision4,
        });
      return (
        showToast('正在从原始视频中提取清晰人声…', 'info'),
        handler8({ project: getProject(), source: source5, state: state3 })
      );
    },
    resume2 = (value7 = '') => {
      if (enabled) return Promise.resolve(null);
      const project5 = getProject(),
        source6 = handler3(project5, value7),
        state4 = resolvePersonReplacementVoiceSeparationState(project5, value7);
      if (!source6?.videoRef || !isPersonReplacementVoiceSeparationActive(state4))
        return Promise.resolve(null);
      const inputRevision5 = createPersonReplacementVoiceSeparationRevision({
        project: project5,
        source: source6,
      });
      if (!state4.taskId || state4.inputRevision !== inputRevision5) {
        const value8 = Boolean(state4.inputRevision && state4.inputRevision !== inputRevision5),
          personReplacementVoiceSeparationState5 = normalizePersonReplacementVoiceSeparationState({
            ...state4,
            status: 'failed',
            inputRevision: inputRevision5,
            taskId: '',
            providerProfileId: '',
            completedAt: now(),
            error: '人声提取任务已中断，请重新提取。',
            ...(value8
              ? { vocalsAudioRef: '', vocalsAudioUrl: '', backgroundAudioRef: '', backgroundAudioUrl: '' }
              : {}),
          }),
          value9 = setProject(
            {
              ...project5,
              audio: updatePersonReplacementVoiceSeparationState(
                project5.audio,
                personReplacementVoiceSeparationState5,
              ),
            },
            { renderWorkspace: false },
          );
        return (
          onStateChange({
            sourceId: source6.id,
            state: cloneJson(personReplacementVoiceSeparationState5),
            project: cloneJson(value9 || getProject()),
          }),
          Promise.resolve(null)
        );
      }
      return handler8({ project: project5, source: source6, state: state4, resume: true });
    },
    cancel = async (value10 = '') => {
      if (enabled) return false;
      const projectId4 = getProject(),
        sourceId5 = handler3(projectId4, value10),
        requestId5 = resolvePersonReplacementVoiceSeparationState(projectId4, value10);
      if (!sourceId5 || !isPersonReplacementVoiceSeparationActive(requestId5)) return false;
      const value11 = {
          projectId: projectId4.id,
          sourceId: sourceId5.id,
          requestId: requestId5.requestId,
          inputRevision: requestId5.inputRevision,
        },
        value12 = handler2(projectId4.id, sourceId5.id),
        value13 = map.get(value12);
      (value13?.abortController?.abort?.(),
        map.delete(value12),
        handler5(value11, { status: 'cancelled', completedAt: now(), error: '' }));
      const taskId3 = normalizeText(requestId5.taskId || value13?.taskId);
      if (taskId3)
        try {
          await cancelSeparation({
            taskId: taskId3,
            providerProfileId: requestId5.providerProfileId || value13?.providerProfileId || '',
          });
        } catch (value14) {
          console.warn('[replacementStudio] voice separation cancel failed', value14);
          const error3 = '已停止本地等待，但云端任务取消失败，可能仍在运行。请到任务平台确认状态。';
          return (handler5(value11, { error: error3 }), showToast(error3, 'warn'), true);
        }
      return (showToast('已取消清晰人声提取。', 'info'), true);
    };
  return Object.freeze({
    extract: extract,
    resume: resume2,
    cancel: cancel,
    destroy() {
      if (enabled) return;
      ((enabled = true),
        map.forEach((value15) => value15.abortController?.abort?.()),
        map.clear());
    },
  });
}

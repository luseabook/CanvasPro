import appStore from '../../core/stores/appStore.js';
import { generateId } from '../../core/math.js';
import { getModelDisplayName, getModelProvider } from '../../config/modelConfig.js';
import { buildSourceMediaNodePayload, getAutoMediaSizeByShortSide } from '../../services/fileService.js';
import {
  OUTPUT_RATIO_SWITCH_THRESHOLD,
  calcDisplaySizeByMedia,
  resolveInputRatioBasis,
  resolveOutputMediaSize,
  shouldSwitchToOutputRatio,
} from '../../services/mediaRatioService.js';
import { calcSafeSpawnPosNearNode } from '../nodeSpawn.js';
import { generateImage } from '../../../api/aiImageApi.js';
import {
  buildAsyncTaskPatch,
  buildDreaminaTaskPatch,
  buildRunningHubTaskPatch,
  isDreaminaTaskModel,
  isRunningHubModelApiTaskModel,
  isRunningHubTaskModel,
  persistRunningHubResumeCache,
} from './taskPatch.js';
import {
  buildImageGenerationFailurePatch,
  buildImageGenerationResultPatch,
} from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { buildGenerationStartPatch } from '../../core/generationTaskLifecycle.js';
import { isTaskCancelled } from '../../core/generationTaskUiState.js';
const SCENE_CONFIG = {
  erase: {
    idPrefix: 'source-image-erase',
    pendingName: '擦除生成中...',
    resultName: '擦除结果',
    failureName: '擦除生成失败',
    successToast: '擦除生成成功',
  },
  repaint: {
    idPrefix: 'source-image-repaint',
    pendingName: '重绘生成中...',
    resultName: '重绘结果',
    failureName: '重绘生成失败',
    successToast: '重绘生成成功',
  },
};
export const resolveGenerationRuntime = ({ model: model, provider: provider } = {}) => {
  const model2 = String(model || '').trim(),
    provider2 = String(provider || getModelProvider(model2) || '').trim(),
    isRunningHubTask = isRunningHubTaskModel(model2, provider2),
    isDreaminaTask = isDreaminaTaskModel(model2, provider2);
  return {
    model: model2,
    provider: provider2,
    isRunningHubTask: isRunningHubTask,
    isDreaminaTask: isDreaminaTask,
    isAsyncTask: !isRunningHubTask && !isDreaminaTask,
    asyncProvider: provider2.toLowerCase(),
    useOpenapiByModel: isRunningHubModelApiTaskModel(model2, provider2),
  };
};
export const buildGenerationOutputText = ({
  model: model3,
  prompt: prompt,
  errorMessage: errorMessage = '',
} = {}) => {
  const list = ['模型: ' + getModelDisplayName(model3), '提示词: ' + String(prompt || '').trim()];
  return (
    errorMessage && list.push('错误: ' + (String(errorMessage || '').trim() || '未知错误')),
    list.join('\n')
  );
};
const persistGenerationRuntimeIfNeeded = (value) => {
  (value?.isRunningHubTask || value?.isDreaminaTask || value?.isAsyncTask) && persistRunningHubResumeCache();
};
export const buildGenerationRuntimePatch = ({
  phase: phase,
  runtime: runtime,
  latestNode: latestNode,
  startTime: startTime,
  taskId: taskId = '',
  taskProvider: taskProvider = '',
  useOpenapiQuery: useOpenapiQuery = false,
  errorMessage: errorMessage = '',
} = {}) => {
  const taskId2 = String(
    taskId || latestNode?.rhTaskId || latestNode?.dreaminaSubmitId || latestNode?.asyncTaskId || '',
  ).trim();
  if (runtime?.isRunningHubTask)
    return buildRunningHubTaskPatch({
      taskId: taskId2,
      status: phase,
      startedAt: startTime,
      recovering: false,
      useOpenapiQuery:
        phase === 'pending'
          ? runtime.useOpenapiByModel
          : phase === 'running'
            ? useOpenapiQuery === true ||
              latestNode?.rhTaskUseOpenapiQuery === true ||
              runtime.useOpenapiByModel
            : latestNode?.rhTaskUseOpenapiQuery === true || runtime.useOpenapiByModel,
    });
  if (runtime?.isDreaminaTask)
    return buildDreaminaTaskPatch({
      submitId: taskId2,
      status: phase === 'running' ? 'pending' : phase,
      phase: phase === 'success' ? 'done' : phase === 'failed' ? 'failed' : 'generating',
      label:
        phase === 'success'
          ? '已完成'
          : phase === 'failed'
            ? errorMessage || '生成失败'
            : phase === 'running'
              ? '生成中'
              : '提交中',
      startedAt: startTime,
      recovering: false,
    });
  if (runtime?.isAsyncTask)
    return buildAsyncTaskPatch({
      provider: String(taskProvider || latestNode?.asyncTaskProvider || runtime.asyncProvider || '').trim(),
      kind: 'image',
      taskId: taskId2,
      status: phase,
      startedAt: startTime,
      recovering: false,
    });
  return {};
};
const updateGenerationRuntimeNode = ({
  nodeId: nodeId,
  runtime: runtime2,
  startTime: startTime2,
  phase: phase2,
  taskId: taskId = '',
  taskProvider: taskProvider = '',
  useOpenapiQuery: useOpenapiQuery = false,
  errorMessage: errorMessage = '',
} = {}) => {
  const taskId3 = String(taskId || '').trim();
  if (!taskId3 && phase2 === 'running') return;
  const latestNode2 = appStore.getState().nodes?.[nodeId];
  if (!latestNode2) return;
  if (isTaskCancelled(latestNode2)) return;
  (appStore.updateNodeData(nodeId, {
    ...buildGenerationRuntimePatch({
      phase: phase2,
      runtime: runtime2,
      latestNode: latestNode2,
      startTime: startTime2,
      taskId:
        taskId3 || latestNode2?.rhTaskId || latestNode2?.dreaminaSubmitId || latestNode2?.asyncTaskId || '',
      taskProvider: taskProvider,
      useOpenapiQuery: useOpenapiQuery,
      errorMessage: errorMessage,
    }),
  }),
    persistGenerationRuntimeIfNeeded(runtime2));
};
export const runGenerationResultFlow = async ({
  scene: scene,
  built: built,
  sourceNode: sourceNode,
  fallbackModel: fallbackModel,
  fallbackProvider: fallbackProvider,
  exitController: exitController,
  notify: notify = (item, key) => window.showToast?.(item, key),
} = {}) => {
  if (!built?.payload) return;
  const name = SCENE_CONFIG[scene];
  if (!name) throw new Error('未知生成场景: ' + scene);
  const provider3 = resolveGenerationRuntime({
      model: built?.payload?.model || fallbackModel,
      provider: built?.payload?.provider || fallbackProvider,
    }),
    prompt2 = String(built?.payload?.prompt || '').trim(),
    startedAt = Date.now(),
    index = built.inputUrl;
  let id = null;
  const run = () => {
    if (!id) return false;
    return isTaskCancelled(appStore.getState().nodes?.[id]);
  };
  try {
    const result = Number(built?.naturalWidth) || sourceNode?.width || 1,
      data = Number(built?.naturalHeight) || sourceNode?.height || 1,
      { width: width, height: height } = getAutoMediaSizeByShortSide(result, data),
      { x: x, y: y } = calcSafeSpawnPosNearNode(appStore.getState().nodes, sourceNode, width, height);
    ((id = generateId(name.idPrefix)),
      appStore.addNode(
        buildSourceMediaNodePayload({
          id: id,
          type: 'source-image',
          x: x,
          y: y,
          width: width,
          height: height,
          needsAutoResize: false,
          name: name.pendingName,
          src: '',
          ...buildGenerationStartPatch({ startedAt: startedAt }),
          provider: provider3.provider,
          model: provider3.model,
          ...(provider3.isRunningHubTask
            ? { rhSourceNodeId: sourceNode?.id || '', rhToolbarTaskType: 'image-' + scene }
            : {}),
          ...buildGenerationRuntimePatch({ phase: 'pending', runtime: provider3, startTime: startedAt }),
          outputText: buildGenerationOutputText({ model: provider3.model, prompt: prompt2 }),
        }),
      ),
      persistGenerationRuntimeIfNeeded(provider3),
      appStore.setSelectedNodes([id]));
    typeof window.v2FocusOnNodes === 'function'
      ? window.v2FocusOnNodes([sourceNode?.id, id])
      : window.v2FocusOnNode?.(id);
    exitController?.({ silent: true });
    const localPath = await generateImage(built.payload, {
      onTaskMeta: ({ taskId: taskId4, useOpenapiQuery: useOpenapiQuery2, provider: provider4 }) => {
        updateGenerationRuntimeNode({
          nodeId: id,
          runtime: provider3,
          startTime: startedAt,
          phase: 'running',
          taskId: taskId4,
          taskProvider: provider4,
          useOpenapiQuery: useOpenapiQuery2,
        });
      },
      onTaskId: (taskId5) => {
        updateGenerationRuntimeNode({
          nodeId: id,
          runtime: provider3,
          startTime: startedAt,
          phase: 'running',
          taskId: taskId5,
        });
      },
    });
    if (run()) return;
    if (localPath?.error) throw new Error(localPath.error);
    const latestNode3 = appStore.getState().nodes?.[id],
      duration = latestNode3?.generationStartTime ? Date.now() - latestNode3.generationStartTime : 0,
      box = resolveInputRatioBasis(
        { width: built?.naturalWidth, height: built?.naturalHeight },
        { width: sourceNode?.width, height: sourceNode?.height },
      ),
      box2 = await resolveOutputMediaSize({
        localPath: localPath.localPath,
        imageUrl: localPath.imageUrl,
        sourceUrl: localPath.sourceUrl,
        thumbUrl: localPath.thumbUrl,
        src: localPath.imageUrl || localPath.sourceUrl || localPath.thumbUrl || '',
      }),
      width2 =
        box2 &&
        shouldSwitchToOutputRatio(
          box.width,
          box.height,
          box2.width,
          box2.height,
          OUTPUT_RATIO_SWITCH_THRESHOLD,
        )
          ? calcDisplaySizeByMedia(box2.width, box2.height)
          : calcDisplaySizeByMedia(box.width, box.height);
    (appStore.updateNodeData(id, {
      ...buildImageGenerationResultPatch(localPath, { startedAt: startedAt, duration: duration }),
      name: name.resultName,
      width: width2.width,
      height: width2.height,
      ...buildGenerationRuntimePatch({
        phase: 'success',
        runtime: provider3,
        latestNode: latestNode3,
        startTime: startedAt,
      }),
      outputText: buildGenerationOutputText({ model: provider3.model, prompt: prompt2 }),
    }),
      persistGenerationRuntimeIfNeeded(provider3),
      notify(name.successToast, 'success'));
  } catch (error) {
    if (!id) throw error;
    if (run()) return;
    const latestNode4 = appStore.getState().nodes?.[id],
      duration2 = latestNode4?.generationStartTime ? Date.now() - latestNode4.generationStartTime : 0,
      error2 = error?.message || '未知错误';
    (appStore.updateNodeData(id, {
      ...buildImageGenerationFailurePatch({ error: error2, startedAt: startedAt, duration: duration2 }),
      name: name.failureName,
      ...buildGenerationRuntimePatch({
        phase: 'failed',
        runtime: provider3,
        latestNode: latestNode4,
        startTime: startedAt,
        errorMessage: error2,
      }),
      outputText: buildGenerationOutputText({
        model: provider3.model,
        prompt: prompt2,
        errorMessage: error2,
      }),
    }),
      persistGenerationRuntimeIfNeeded(provider3));
  } finally {
    index && URL.revokeObjectURL(index);
  }
};

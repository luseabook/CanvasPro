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
export const resolveGenerationRuntime = ({ model: _0x757173, provider: _0x36805b } = {}) => {
  const _0x1851d7 = String(_0x757173 || '').trim(),
    _0x4e18d2 = String(_0x36805b || getModelProvider(_0x1851d7) || '').trim(),
    _0x306e9f = isRunningHubTaskModel(_0x1851d7, _0x4e18d2),
    _0x141728 = isDreaminaTaskModel(_0x1851d7, _0x4e18d2);
  return {
    model: _0x1851d7,
    provider: _0x4e18d2,
    isRunningHubTask: _0x306e9f,
    isDreaminaTask: _0x141728,
    isAsyncTask: !_0x306e9f && !_0x141728,
    asyncProvider: _0x4e18d2.toLowerCase(),
    useOpenapiByModel: isRunningHubModelApiTaskModel(_0x1851d7, _0x4e18d2),
  };
};
export const buildGenerationOutputText = ({
  model: _0x4369d9,
  prompt: _0x58aa65,
  errorMessage: errorMessage = '',
} = {}) => {
  const _0x33633e = ['模型: ' + getModelDisplayName(_0x4369d9), '提示词: ' + String(_0x58aa65 || '').trim()];
  return (
    errorMessage && _0x33633e.push('错误: ' + (String(errorMessage || '').trim() || '未知错误')),
    _0x33633e.join('\n')
  );
};
const persistGenerationRuntimeIfNeeded = (_0x30e76d) => {
  (_0x30e76d?.isRunningHubTask || _0x30e76d?.isDreaminaTask || _0x30e76d?.isAsyncTask) &&
    persistRunningHubResumeCache();
};
export const buildGenerationRuntimePatch = ({
  phase: _0x4fddf5,
  runtime: _0x541a8b,
  latestNode: _0x51e57b,
  startTime: _0x32b02b,
  taskId: taskId = '',
  taskProvider: taskProvider = '',
  useOpenapiQuery: useOpenapiQuery = false,
  errorMessage: errorMessage = '',
} = {}) => {
  const _0x2f1e69 = String(
    taskId || _0x51e57b?.rhTaskId || _0x51e57b?.dreaminaSubmitId || _0x51e57b?.asyncTaskId || '',
  ).trim();
  if (_0x541a8b?.isRunningHubTask)
    return buildRunningHubTaskPatch({
      taskId: _0x2f1e69,
      status: _0x4fddf5,
      startedAt: _0x32b02b,
      recovering: false,
      useOpenapiQuery:
        _0x4fddf5 === 'pending'
          ? _0x541a8b.useOpenapiByModel
          : _0x4fddf5 === 'running'
            ? useOpenapiQuery === true ||
              _0x51e57b?.rhTaskUseOpenapiQuery === true ||
              _0x541a8b.useOpenapiByModel
            : _0x51e57b?.rhTaskUseOpenapiQuery === true || _0x541a8b.useOpenapiByModel,
    });
  if (_0x541a8b?.isDreaminaTask)
    return buildDreaminaTaskPatch({
      submitId: _0x2f1e69,
      status: _0x4fddf5 === 'running' ? 'pending' : _0x4fddf5,
      phase: _0x4fddf5 === 'success' ? 'done' : _0x4fddf5 === 'failed' ? 'failed' : 'generating',
      label:
        _0x4fddf5 === 'success'
          ? '已完成'
          : _0x4fddf5 === 'failed'
            ? errorMessage || '生成失败'
            : _0x4fddf5 === 'running'
              ? '生成中'
              : '提交中',
      startedAt: _0x32b02b,
      recovering: false,
    });
  if (_0x541a8b?.isAsyncTask)
    return buildAsyncTaskPatch({
      provider: String(taskProvider || _0x51e57b?.asyncTaskProvider || _0x541a8b.asyncProvider || '').trim(),
      kind: 'image',
      taskId: _0x2f1e69,
      status: _0x4fddf5,
      startedAt: _0x32b02b,
      recovering: false,
    });
  return {};
};
const updateGenerationRuntimeNode = ({
  nodeId: _0x277380,
  runtime: _0x41e976,
  startTime: _0x4af1e4,
  phase: _0x4d6b0f,
  taskId: taskId = '',
  taskProvider: taskProvider = '',
  useOpenapiQuery: useOpenapiQuery = false,
  errorMessage: errorMessage = '',
} = {}) => {
  const _0x287f08 = String(taskId || '').trim();
  if (!_0x287f08 && _0x4d6b0f === 'running') return;
  const _0xdfe258 = appStore.getState().nodes?.[_0x277380];
  if (!_0xdfe258) return;
  if (isTaskCancelled(_0xdfe258)) return;
  (appStore.updateNodeData(_0x277380, {
    ...buildGenerationRuntimePatch({
      phase: _0x4d6b0f,
      runtime: _0x41e976,
      latestNode: _0xdfe258,
      startTime: _0x4af1e4,
      taskId: _0x287f08 || _0xdfe258?.rhTaskId || _0xdfe258?.dreaminaSubmitId || _0xdfe258?.asyncTaskId || '',
      taskProvider: taskProvider,
      useOpenapiQuery: useOpenapiQuery,
      errorMessage: errorMessage,
    }),
  }),
    persistGenerationRuntimeIfNeeded(_0x41e976));
};
export const runGenerationResultFlow = async ({
  scene: _0x556b84,
  built: _0x5eb369,
  sourceNode: _0x3b2a70,
  fallbackModel: _0x2c19d9,
  fallbackProvider: _0x9d6071,
  exitController: _0x2eb700,
  notify: notify = (_0xd1f5e, _0x269003) => window.showToast?.(_0xd1f5e, _0x269003),
} = {}) => {
  if (!_0x5eb369?.payload) return;
  const _0x235050 = SCENE_CONFIG[_0x556b84];
  if (!_0x235050) throw new Error('未知生成场景: ' + _0x556b84);
  const _0x17b65c = resolveGenerationRuntime({
      model: _0x5eb369?.payload?.model || _0x2c19d9,
      provider: _0x5eb369?.payload?.provider || _0x9d6071,
    }),
    _0x12422d = String(_0x5eb369?.payload?.prompt || '').trim(),
    _0x5672bc = Date.now(),
    _0x4160f2 = _0x5eb369.inputUrl;
  let _0x578b3b = null;
  const _0x5e3896 = () => {
    if (!_0x578b3b) return false;
    return isTaskCancelled(appStore.getState().nodes?.[_0x578b3b]);
  };
  try {
    const _0x15931e = Number(_0x5eb369?.naturalWidth) || _0x3b2a70?.width || 1,
      _0x4127ff = Number(_0x5eb369?.naturalHeight) || _0x3b2a70?.height || 1,
      { width: _0x31ed5a, height: _0x2b1ef5 } = getAutoMediaSizeByShortSide(_0x15931e, _0x4127ff),
      { x: _0x46e9ed, y: _0x5a8de4 } = calcSafeSpawnPosNearNode(
        appStore.getState().nodes,
        _0x3b2a70,
        _0x31ed5a,
        _0x2b1ef5,
      );
    ((_0x578b3b = generateId(_0x235050.idPrefix)),
      appStore.addNode(
        buildSourceMediaNodePayload({
          id: _0x578b3b,
          type: 'source-image',
          x: _0x46e9ed,
          y: _0x5a8de4,
          width: _0x31ed5a,
          height: _0x2b1ef5,
          needsAutoResize: false,
          name: _0x235050.pendingName,
          src: '',
          ...buildGenerationStartPatch({ startedAt: _0x5672bc }),
          provider: _0x17b65c.provider,
          model: _0x17b65c.model,
          ...(_0x17b65c.isRunningHubTask
            ? { rhSourceNodeId: _0x3b2a70?.id || '', rhToolbarTaskType: 'image-' + _0x556b84 }
            : {}),
          ...buildGenerationRuntimePatch({ phase: 'pending', runtime: _0x17b65c, startTime: _0x5672bc }),
          outputText: buildGenerationOutputText({ model: _0x17b65c.model, prompt: _0x12422d }),
        }),
      ),
      persistGenerationRuntimeIfNeeded(_0x17b65c),
      appStore.setSelectedNodes([_0x578b3b]));
    typeof window.v2FocusOnNodes === 'function'
      ? window.v2FocusOnNodes([_0x3b2a70?.id, _0x578b3b])
      : window.v2FocusOnNode?.(_0x578b3b);
    _0x2eb700?.({ silent: true });
    const _0x10dc2e = await generateImage(_0x5eb369.payload, {
      onTaskMeta: ({ taskId: _0x1d45b4, useOpenapiQuery: _0x1c10dc, provider: _0x30750a }) => {
        updateGenerationRuntimeNode({
          nodeId: _0x578b3b,
          runtime: _0x17b65c,
          startTime: _0x5672bc,
          phase: 'running',
          taskId: _0x1d45b4,
          taskProvider: _0x30750a,
          useOpenapiQuery: _0x1c10dc,
        });
      },
      onTaskId: (_0x1722c2) => {
        updateGenerationRuntimeNode({
          nodeId: _0x578b3b,
          runtime: _0x17b65c,
          startTime: _0x5672bc,
          phase: 'running',
          taskId: _0x1722c2,
        });
      },
    });
    if (_0x5e3896()) return;
    if (_0x10dc2e?.error) throw new Error(_0x10dc2e.error);
    const _0x562d79 = appStore.getState().nodes?.[_0x578b3b],
      _0xd97fef = _0x562d79?.generationStartTime ? Date.now() - _0x562d79.generationStartTime : 0,
      _0x35a69d = resolveInputRatioBasis(
        { width: _0x5eb369?.naturalWidth, height: _0x5eb369?.naturalHeight },
        { width: _0x3b2a70?.width, height: _0x3b2a70?.height },
      ),
      _0x32e19f = await resolveOutputMediaSize({
        localPath: _0x10dc2e.localPath,
        imageUrl: _0x10dc2e.imageUrl,
        sourceUrl: _0x10dc2e.sourceUrl,
        thumbUrl: _0x10dc2e.thumbUrl,
        src: _0x10dc2e.imageUrl || _0x10dc2e.sourceUrl || _0x10dc2e.thumbUrl || '',
      }),
      _0x14932e =
        _0x32e19f &&
        shouldSwitchToOutputRatio(
          _0x35a69d.width,
          _0x35a69d.height,
          _0x32e19f.width,
          _0x32e19f.height,
          OUTPUT_RATIO_SWITCH_THRESHOLD,
        )
          ? calcDisplaySizeByMedia(_0x32e19f.width, _0x32e19f.height)
          : calcDisplaySizeByMedia(_0x35a69d.width, _0x35a69d.height);
    (appStore.updateNodeData(_0x578b3b, {
      ...buildImageGenerationResultPatch(_0x10dc2e, { startedAt: _0x5672bc, duration: _0xd97fef }),
      name: _0x235050.resultName,
      width: _0x14932e.width,
      height: _0x14932e.height,
      ...buildGenerationRuntimePatch({
        phase: 'success',
        runtime: _0x17b65c,
        latestNode: _0x562d79,
        startTime: _0x5672bc,
      }),
      outputText: buildGenerationOutputText({ model: _0x17b65c.model, prompt: _0x12422d }),
    }),
      persistGenerationRuntimeIfNeeded(_0x17b65c),
      notify(_0x235050.successToast, 'success'));
  } catch (_0x4e0806) {
    if (!_0x578b3b) throw _0x4e0806;
    if (_0x5e3896()) return;
    const _0x46fae3 = appStore.getState().nodes?.[_0x578b3b],
      _0x15ef62 = _0x46fae3?.generationStartTime ? Date.now() - _0x46fae3.generationStartTime : 0,
      _0x30a1fe = _0x4e0806?.message || '未知错误';
    (appStore.updateNodeData(_0x578b3b, {
      ...buildImageGenerationFailurePatch({ error: _0x30a1fe, startedAt: _0x5672bc, duration: _0x15ef62 }),
      name: _0x235050.failureName,
      ...buildGenerationRuntimePatch({
        phase: 'failed',
        runtime: _0x17b65c,
        latestNode: _0x46fae3,
        startTime: _0x5672bc,
        errorMessage: _0x30a1fe,
      }),
      outputText: buildGenerationOutputText({
        model: _0x17b65c.model,
        prompt: _0x12422d,
        errorMessage: _0x30a1fe,
      }),
    }),
      persistGenerationRuntimeIfNeeded(_0x17b65c));
  } finally {
    _0x4160f2 && URL.revokeObjectURL(_0x4160f2);
  }
};

import {
  getImageGenerationResultError,
  getSuccessfulImageGenerationItems,
  normalizeImageGenerationResult,
} from '../../components/aigenImage/imageGenerationResultRenderer.js';
import { resolveModelExecution } from '../../manifests/index.js';
import {
  resumeAsyncImageTask,
  resumeDreaminaImageTask,
  resumeRunningHubImageTask,
} from '../../../api/aiImageApi.js';
import { buildStoryBackgroundTaskId, getStoryBackgroundTasks } from './storyBackgroundTasks.js';
import {
  ensureStoryAssetBaseAppearance,
  getStoryAssetAppearanceReferenceUrls,
  getStoryAssetAppearances,
  shouldGenerateStoryAssetBaseAppearanceFirst,
} from './storyAssetAppearances.js';
import {
  buildStoryAssetGenerationPayload,
  isStoryAssetAppearanceLoading,
  setStoryAssetAppearanceGenerating,
  setStoryAssetVoiceGenerating,
} from './storyAssetGenerationState.js';
import { createStoryAssetImageLocalization } from './storyAssetImageOutputLocalization.js';
import {
  applyStoryCharacterAssetPromptPreset,
  applyStorySceneAssetPromptPreset,
} from './storyAssetPromptPresets.js';
import { replaceStoryCharacterVoiceReference, resumeStoryCharacterVoice } from './storyCharacterVoice.js';
import { sanitizeStoryTaskResumePayload } from './storyProjectTaskToken.js';
function normalizeText(value) {
  return String(value ?? '')['trim']();
}
export function createStoryAssetGenerationController({
  state: state,
  activeRecoveries: activeRecoveries,
  activeExecutions: activeExecutions,
  isWorkspaceDestroyed: isWorkspaceDestroyed = () => false,
  hasImageGenerator: hasImageGenerator = () => false,
  generateImage: generateImage,
  createProjectToken: createProjectToken,
  createProjectTokenForData: createProjectTokenForData,
  isProjectTaskLive: isProjectTaskLive,
  isProjectTaskCurrent: isProjectTaskCurrent,
  registerProjectData: registerProjectData = () => {},
  waitForRecoveryManifest: waitForRecoveryManifest,
  startBackgroundTask: startBackgroundTask,
  updateBackgroundTask: updateBackgroundTask,
  finishBackgroundTask: finishBackgroundTask,
  schedulePersistence: schedulePersistence = () => {},
  render: render = () => {},
  findAsset: findAsset,
  getSelectedAppearance: getSelectedAppearance,
  showToast: showToast = () => {},
  showTaskApiKeyError: showTaskApiKeyError = () => false,
  showTaskResultToast: showTaskResultToast = () => {},
  notifyTaskResult: notifyTaskResult = () => {},
  showNavigableTaskResultToast: showNavigableTaskResultToast = () => {},
} = {}) {
  if (!state || !activeRecoveries || !activeExecutions)
    throw new TypeError('Story asset generation requires state and recovery owners.');
  if (
    typeof generateImage !== 'function' ||
    typeof createProjectToken !== 'function' ||
    typeof createProjectTokenForData !== 'function' ||
    typeof isProjectTaskLive !== 'function' ||
    typeof isProjectTaskCurrent !== 'function' ||
    typeof waitForRecoveryManifest !== 'function' ||
    typeof startBackgroundTask !== 'function' ||
    typeof updateBackgroundTask !== 'function' ||
    typeof finishBackgroundTask !== 'function' ||
    typeof findAsset !== 'function' ||
    typeof getSelectedAppearance !== 'function'
  )
    throw new TypeError('Story asset generation requires task and asset adapters.');
  const getAppearanceGenerationContext = (item, args, key = {}) => {
      const modelId = normalizeText(key['modelId']) || state['models']['image'],
        provider = normalizeText(key['provider']) || state['imageProvider'],
        generationParams =
          key['generationParams'] && typeof key['generationParams'] === 'object'
            ? key['generationParams']
            : state['imageGenerationParams'],
        text = normalizeText(key['promptPresetId']) || state['assetPromptPresetId'],
        text2 = normalizeText(key['scenePromptPresetId']) || state['sceneAssetPromptPresetId'],
        prompt =
          item['kind'] === 'character'
            ? applyStoryCharacterAssetPromptPreset(text, args['prompt'])
            : item['kind'] === 'scene'
              ? applyStorySceneAssetPromptPreset(text2, args['prompt'])
              : args['prompt'],
        mapReferenceImageToImage2 = Boolean(normalizeText(args['referenceImageUrl'])),
        payload = buildStoryAssetGenerationPayload({
          asset: { ...args, prompt: prompt },
          modelId: modelId,
          provider: provider,
          generationParams: generationParams,
          referenceImageUrls: getStoryAssetAppearanceReferenceUrls(item, args),
          mapReferenceImageToImage2: mapReferenceImageToImage2,
        });
      return {
        payload: payload,
        execution: resolveModelExecution(payload['model'], { providerHint: payload['provider'] }),
      };
    },
    applyResult = (index, result, data) => {
      const imageGenerationResult = normalizeImageGenerationResult(data),
        list = getSuccessfulImageGenerationItems(imageGenerationResult),
        response = list[0],
        text3 = normalizeText(
          response?.['imageUrl'] || response?.['url'] || response?.['sourceUrl'] || response?.['thumbUrl'],
        );
      if (!text3)
        throw new Error(getImageGenerationResultError(imageGenerationResult) || '图像生成结果缺少可用图片');
      return (
        (result['imageUrl'] = text3),
        (result['generatedImage'] = { ...response }),
        (result['generatedImages'] = list['map']((args2) => ({ ...args2 }))),
        (result['activeIndex'] = 0),
        (result['error'] = ''),
        ensureStoryAssetBaseAppearance(index),
        response
      );
    },
    resumable = (options = {}) => {
      const target = options['execution']?.['modelManifest'],
        source = options['execution']?.['executionManifest'];
      return Boolean(
        source?.['adapterType'] === 'workflow' ||
        target?.['async'] === true ||
        source?.['extensions']?.['taskPolling'],
      );
    },
    requestAppearanceImage = async (asset, appearance, batch = {}) => {
      const modelId2 = getAppearanceGenerationContext(asset, appearance, batch),
        projectToken = batch['projectToken'] || createProjectToken(),
        args3 = createStoryAssetImageLocalization({
          asset: asset,
          appearance: appearance,
          projectToken: projectToken,
          isLive: isProjectTaskLive,
          applyResult: applyResult,
          onLocalized: () => schedulePersistence({ immediate: true }),
        }),
        id = buildStoryBackgroundTaskId('asset-image', {
          assetId: asset?.['id'],
          appearanceId: appearance?.['id'],
        });
      startBackgroundTask(projectToken, {
        id: id,
        type: 'asset-image',
        scope: { assetId: asset?.['id'], appearanceId: appearance?.['id'] },
        label: '生成' + (normalizeText(asset?.['name']) || '素材') + '形象',
        message: '正在等待图片生成结果',
        modelId: modelId2['payload']?.['model'],
        provider: modelId2['payload']?.['provider'],
        providerProfileId:
          modelId2['payload']?.['providerProfileId'] || modelId2['payload']?.['rhProviderProfileId'],
        executionId: modelId2['execution']?.['executionManifest']?.['id'],
        resumePayload: sanitizeStoryTaskResumePayload(modelId2['payload']),
        batch: batch['batch'],
      });
      try {
        const onTaskId = (next) => {
            const remoteTaskId = normalizeText(next);
            if (!remoteTaskId || !isProjectTaskLive(projectToken)) return;
            updateBackgroundTask(projectToken, id, {
              status: 'running',
              message: '图片任务已提交，正在等待结果',
              resumable: resumable(modelId2),
              remoteTaskId: remoteTaskId,
              resumePayload: sanitizeStoryTaskResumePayload(modelId2['payload']),
            });
          },
          current = await generateImage(modelId2['payload'], {
            ...args3['options'],
            onTaskId: onTaskId,
            onTaskMeta: ({ taskId: taskId } = {}) => onTaskId(taskId),
          });
        if (!isProjectTaskLive(projectToken)) return false;
        return (
          applyResult(asset, appearance, current),
          args3['commitRemote'](),
          finishBackgroundTask(projectToken, id, { status: 'succeeded', message: '素材图片生成完成' }),
          true
        );
      } catch (error) {
        isProjectTaskLive(projectToken) &&
          finishBackgroundTask(projectToken, id, {
            status: 'failed',
            message: '素材图片生成失败',
            error: error?.['getUserMessage']?.() || error?.['message'] || '图像生成失败。',
          });
        error['storyAssetGenerationContext'] = modelId2;
        throw error;
      }
    },
    resumeImageTask = async (modelId3, projectToken2 = createProjectToken()) => {
      const entry = projectToken2['projectId'] + ':' + modelId3['id'];
      if (activeRecoveries['has'](entry) || activeExecutions['has'](entry) || isWorkspaceDestroyed())
        return false;
      (activeRecoveries['add'](entry), activeExecutions['add'](entry), registerProjectData(projectToken2));
      if (isProjectTaskCurrent(projectToken2)) {
        setStoryAssetAppearanceGenerating(
          state,
          modelId3['scope']?.['assetId'],
          modelId3['scope']?.['appearanceId'],
          true,
        );
        if (state['view'] === 'project' && state['step'] === 2) render();
      }
      try {
        const enabled = await waitForRecoveryManifest({
          modelId: modelId3['modelId'],
          provider: modelId3['provider'],
        });
        if (!isProjectTaskLive(projectToken2) || isWorkspaceDestroyed()) return false;
        if (!enabled)
          throw new Error('图片模型缺少 manifest 或 execution manifest：' + modelId3['modelId']);
        const asset2 = projectToken2['data']?.['assets']?.['find'](
            (record) => normalizeText(record?.['id']) === normalizeText(modelId3['scope']?.['assetId']),
          ),
          appearance2 = getStoryAssetAppearances(asset2)['find'](
            (handle) => normalizeText(handle?.['id']) === normalizeText(modelId3['scope']?.['appearanceId']),
          );
        if (!asset2 || !appearance2) throw new Error('素材图片任务对应的角色或形象已不存在。');
        const storyAssetImageLocalization = createStoryAssetImageLocalization({
            asset: asset2,
            appearance: appearance2,
            projectToken: projectToken2,
            isLive: isProjectTaskLive,
            applyResult: applyResult,
            onLocalized: () => schedulePersistence({ immediate: true }),
          }),
          config = {
            ...(modelId3['resumePayload'] && typeof modelId3['resumePayload'] === 'object'
              ? modelId3['resumePayload']
              : {}),
            model: modelId3['modelId'],
            provider: modelId3['provider'],
          },
          modelExecution = resolveModelExecution(modelId3['modelId'], { providerHint: modelId3['provider'] });
        let resumeDreaminaImageTask2 = null;
        if (modelId3['provider'] === 'dreamina')
          resumeDreaminaImageTask2 = await resumeDreaminaImageTask(
            modelId3['remoteTaskId'],
            config,
            storyAssetImageLocalization['options'],
          );
        else
          modelExecution?.['executionManifest']?.['adapterType'] === 'workflow' ||
          ['runninghub', 'runninghubwf']['includes'](modelId3['provider'])
            ? (resumeDreaminaImageTask2 = await resumeRunningHubImageTask(
                modelId3['remoteTaskId'],
                config,
                storyAssetImageLocalization['options'],
              ))
            : (resumeDreaminaImageTask2 = await resumeAsyncImageTask(
                modelId3['remoteTaskId'],
                config,
                storyAssetImageLocalization['options'],
              ));
        if (!isProjectTaskLive(projectToken2)) return false;
        return (
          applyResult(asset2, appearance2, resumeDreaminaImageTask2),
          storyAssetImageLocalization['commitRemote'](),
          finishBackgroundTask(projectToken2, modelId3['id'], {
            status: 'succeeded',
            message: '素材图片任务已恢复并生成完成',
          }),
          schedulePersistence({ immediate: true }),
          isProjectTaskCurrent(projectToken2) &&
            state['view'] === 'project' &&
            state['step'] === 2 &&
            render(),
          showNavigableTaskResultToast('素材图片任务已恢复并生成完成。', 'success', projectToken2, {
            step: 2,
            assetId: modelId3['scope']?.['assetId'],
          }),
          true
        );
      } catch (error2) {
        if (!isProjectTaskLive(projectToken2)) return false;
        return (
          finishBackgroundTask(projectToken2, modelId3['id'], {
            status: 'failed',
            message: '素材图片任务恢复失败',
            error: error2?.['message'] || '素材图片任务恢复失败。',
          }),
          showTaskResultToast(error2?.['message'] || '素材图片任务恢复失败。', 'error', error2),
          false
        );
      } finally {
        (activeRecoveries['delete'](entry), activeExecutions['delete'](entry));
        if (isProjectTaskCurrent(projectToken2)) {
          setStoryAssetAppearanceGenerating(
            state,
            modelId3['scope']?.['assetId'],
            modelId3['scope']?.['appearanceId'],
            false,
          );
          if (state['view'] === 'project' && state['step'] === 2) render();
        }
      }
    },
    resumeVoiceTask = async (modelId4, scope = createProjectToken()) => {
      const input = scope['projectId'] + ':' + modelId4['id'];
      if (activeRecoveries['has'](input) || activeExecutions['has'](input) || isWorkspaceDestroyed())
        return false;
      (activeRecoveries['add'](input), activeExecutions['add'](input), registerProjectData(scope));
      if (isProjectTaskCurrent(scope)) {
        setStoryAssetVoiceGenerating(state, modelId4['scope']?.['assetId'], true);
        if (state['view'] === 'project' && state['step'] === 2) render();
      }
      try {
        const enabled2 = await waitForRecoveryManifest({
          modelId: modelId4['modelId'],
          provider: modelId4['provider'],
        });
        if (!isProjectTaskLive(scope) || isWorkspaceDestroyed()) return false;
        if (!enabled2)
          throw new Error('声音模型缺少 manifest 或 execution manifest：' + modelId4['modelId']);
        const asset3 = scope['data']?.['assets']?.['find'](
          (output) => normalizeText(output?.['id']) === normalizeText(modelId4['scope']?.['assetId']),
        );
        if (!asset3) throw new Error('角色声音任务对应的角色已不存在。');
        const resumeStoryCharacterVoice2 = await resumeStoryCharacterVoice({
          asset: asset3,
          taskId: modelId4['remoteTaskId'],
          payload: modelId4['resumePayload'] || {},
        });
        if (!resumeStoryCharacterVoice2 || !isProjectTaskLive(scope)) return false;
        return (
          replaceStoryCharacterVoiceReference(asset3, resumeStoryCharacterVoice2),
          finishBackgroundTask(scope, modelId4['id'], {
            status: 'succeeded',
            message: '角色声音任务已恢复并生成完成',
          }),
          schedulePersistence({ immediate: true }),
          isProjectTaskCurrent(scope) && state['view'] === 'project' && state['step'] === 2 && render(),
          showNavigableTaskResultToast('角色声音任务已恢复并生成完成。', 'success', scope, {
            step: 2,
            assetId: modelId4['scope']?.['assetId'],
          }),
          true
        );
      } catch (error3) {
        if (!isProjectTaskLive(scope)) return false;
        return (
          finishBackgroundTask(scope, modelId4['id'], {
            status: 'failed',
            message: '角色声音任务恢复失败',
            error: error3?.['message'] || '角色声音任务恢复失败。',
          }),
          showTaskResultToast(error3?.['message'] || '角色声音任务恢复失败。', 'error', error3),
          false
        );
      } finally {
        (activeRecoveries['delete'](input), activeExecutions['delete'](input));
        if (isProjectTaskCurrent(scope)) {
          setStoryAssetVoiceGenerating(state, modelId4['scope']?.['assetId'], false);
          normalizeText(state['characterVoiceEditor']?.['assetId']) ===
            normalizeText(modelId4['scope']?.['assetId']) &&
            (state['characterVoiceEditor']['isGenerating'] = false);
          if (state['view'] === 'project' && state['step'] === 2) render();
        }
      }
    },
    resumePersistedTasks = (value2 = state['data']) => {
      const value3 = createProjectTokenForData(value2),
        list2 = getStoryBackgroundTasks(value2)['filter'](
          (response2) =>
            ['asset-image', 'asset-voice']['includes'](response2['type']) &&
            response2['resumable'] &&
            response2['remoteTaskId'] &&
            ['queued', 'submitting', 'pending', 'running', 'recovering']['includes'](response2['status']),
        );
      return (
        list2['forEach']((value4) => {
          value4['type'] === 'asset-voice'
            ? void resumeVoiceTask(value4, value3)
            : void resumeImageTask(value4, value3);
        }),
        list2['length']
      );
    },
    showGenerationError = (details, { showFallbackToast: showFallbackToast = true } = {}) => {
      const providerId = details?.['storyAssetGenerationContext'] || {},
        showTaskApiKeyError2 = showTaskApiKeyError(details, {
          providerId: providerId['payload']?.['provider'] || state['imageProvider'],
          model: providerId['payload']?.['model'] || state['models']['image'],
          adapterType: providerId['execution']?.['executionManifest']?.['adapterType'] || '',
        });
      if (!showTaskApiKeyError2 && showFallbackToast)
        showTaskResultToast(
          details?.['getUserMessage']?.() || details?.['message'] || '图像生成失败，请稍后重试。',
          'error',
          details,
        );
      else
        !showTaskApiKeyError2 &&
          notifyTaskResult(
            null,
            details?.['getUserMessage']?.() || details?.['message'] || '图像生成失败，请稍后重试。',
            'error',
            { details: details },
          );
      return showTaskApiKeyError2;
    },
    generateSelected = async () => {
      const assetId = findAsset(state['selectedAssetId']),
        enabled3 = assetId ? getSelectedAppearance(state, assetId) : null;
      if (
        !assetId ||
        !enabled3 ||
        assetId['isLibraryAsset'] ||
        isStoryAssetAppearanceLoading(state, assetId['id'], enabled3['id'])
      )
        return;
      if (!normalizeText(enabled3['prompt'])) {
        showToast('请先填写提示词。', 'warn');
        return;
      }
      if (shouldGenerateStoryAssetBaseAppearanceFirst(assetId, enabled3)) {
        showToast('请先生成基础形象，再生成其他形象。', 'warn');
        return;
      }
      if (!hasImageGenerator()) {
        showToast('图像生成服务尚未初始化。', 'error');
        return;
      }
      const projectToken3 = createProjectToken();
      (setStoryAssetAppearanceGenerating(state, assetId['id'], enabled3['id'], true),
        (enabled3['error'] = ''),
        render());
      try {
        await requestAppearanceImage(assetId, enabled3, { projectToken: projectToken3 });
        if (!isProjectTaskLive(projectToken3)) return false;
        return (
          showNavigableTaskResultToast('当前形象已生成。', 'success', projectToken3, {
            step: 2,
            assetId: assetId['id'],
          }),
          schedulePersistence({ immediate: true }),
          true
        );
      } catch (error4) {
        if (!isProjectTaskLive(projectToken3)) return false;
        return (
          (enabled3['error'] = error4?.['getUserMessage']?.() || error4?.['message'] || '生成失败'),
          showGenerationError(error4),
          false
        );
      } finally {
        isProjectTaskCurrent(projectToken3) &&
          (setStoryAssetAppearanceGenerating(state, assetId['id'], enabled3['id'], false), render());
      }
    };
  return Object['freeze']({
    previewSelected: () => {
      const enabled4 = findAsset(state['selectedAssetId']),
        enabled5 = enabled4 ? getSelectedAppearance(state, enabled4) : null;
      if (!enabled4 || !enabled5) throw new Error('请先选择素材形象');
      return getAppearanceGenerationContext(enabled4, enabled5);
    },
    applyImageResult: applyResult,
    canResumeImageTask: resumable,
    generateSelected: generateSelected,
    getAppearanceGenerationContext: getAppearanceGenerationContext,
    requestAppearanceImage: requestAppearanceImage,
    resumeImageTask: resumeImageTask,
    resumePersistedTasks: resumePersistedTasks,
    resumeVoiceTask: resumeVoiceTask,
    showGenerationError: showGenerationError,
  });
}

import { generateVideo, resumeAsyncVideoTask, resumeRunningHubVideoTask } from '../../../api/aiVideoApi.js';
import {
  cancelTask as cancelTask_2,
  resumeTask as resumeTask_2,
  submitTask as submitTask_2,
} from '../../core/generationTaskRuntime.js';
import {
  createGenerationResumePlan,
  createGenerationSubmitPlan,
} from '../../core/generationExecutionPlan.js';
import { getTaskMessage, resolveGenerationUiState } from '../../core/generationTaskUiState.js';
import {
  buildVideoGenerationResultPatch,
  normalizeVideoGenerationResult,
} from '../../components/video-node/videoGenerationResultRenderer.js';
import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../manifests/index.js';
import { getGenerationInputRatioMediaSize } from '../generationRatioSource.js';
import { applyVideoAdaptiveAspectRatio } from '../videoAspectRatioExecution.js';
import { getFixedInputSlotConfigFromManifest } from '../fixedInputAssetRefs.js';
const MEDIA_KINDS = Object['freeze'](['image', 'video', 'audio']),
  RECOVERABLE_VIDEO_TASK_STATUSES = new Set(['pending', 'queued', 'recovering', 'running', 'submitting']);
function asObject(value) {
  return value && typeof value === 'object' && !Array['isArray'](value) ? value : {};
}
function normalizeText(item) {
  return String(item || '')['trim']();
}
function resolveStoryClipVideoExecution(key, providerHint = '') {
  return resolveModelExecution(key) || resolveModelExecution(key, { providerHint: providerHint });
}
function resolveStoryClipTaskTargetId(options = {}, index = {}) {
  return (
    normalizeText(options['targetId']) ||
    'story-clip:' +
      (normalizeText(options['projectId']) || 'project') +
      ':' +
      (normalizeText(options['episodeId']) || 'episode') +
      ':' +
      (normalizeText(index['id']) || 'clip')
  );
}
export function getRecoverableStoryClipVideoTask(options2 = {}) {
  const response = asObject(options2?.['generation']),
    status = normalizeText(response['status'])['toLowerCase'](),
    taskId = normalizeText(response['taskId']),
    modelId = normalizeText(response['modelId'] || options2?.['modelId']);
  if (!RECOVERABLE_VIDEO_TASK_STATUSES['has'](status) || !taskId || !modelId) return null;
  const providerProfileId2 = normalizeText(response['providerProfileId'] || options2?.['providerProfileId']);
  return {
    status: status,
    taskId: taskId,
    modelId: modelId,
    provider: normalizeText(response['provider'] || options2?.['provider']),
    ...(providerProfileId2 ? { providerProfileId: providerProfileId2 } : {}),
    executionId: normalizeText(response['executionId']),
    startedAt: Number(response['startedAt'] || 0),
    ...(response['useOpenapiQuery'] === !![] ? { useOpenapiQuery: !![] } : {}),
  };
}
async function resumeVideoGenerationTask(result, args, data = {}) {
  const model = resolveStoryClipVideoExecution(args?.['model'], args?.['provider']),
    target = model?.['modelManifest']
      ? {
          ...args,
          model: model['modelManifest']['modelId'],
          provider: model['modelManifest']['provider'],
        }
      : args;
  if (model?.['executionManifest']?.['adapterType'] === 'workflow')
    return resumeRunningHubVideoTask(result, target, data);
  return resumeAsyncVideoTask(result, target, data);
}
function isAsyncStoryClipVideoExecution(source, next) {
  return (
    next?.['adapterType'] === 'modelApi' &&
    (source?.['async'] === !![] || Boolean(next?.['extensions']?.['taskPolling']))
  );
}
function normalizeInputItem(url, kind, current) {
  const response2 = typeof url === 'string' ? { url: url } : asObject(url),
    url2 = normalizeText(
      response2['url'] ||
        response2['localUrl'] ||
        response2['imageUrl'] ||
        response2['videoUrl'] ||
        response2['audioUrl'] ||
        response2['localPath'],
    );
  if (!url2) throw new Error('片段视频的第 ' + (current + 1) + ' 个' + kind + '输入缺少可用地址');
  return {
    ...response2,
    kind: kind,
    url: url2,
    slotId: normalizeText(response2['slotId'] || response2['refSlot']),
  };
}
function normalizeInputs(options3 = {}) {
  const asObject2 = asObject(options3);
  return Object['fromEntries'](
    MEDIA_KINDS['map']((entry) => {
      const record = entry + 's',
        payload = asObject2[entry] ?? asObject2[record] ?? [],
        list = Array['isArray'](payload) ? payload : payload ? [payload] : [];
      return [entry, list['map']((handle, state) => normalizeInputItem(handle, entry, state))];
    }),
  );
}
function mergePromptAssetInputRefs(options4 = {}, config = []) {
  const inputs2 = normalizeInputs(options4),
    map = new Set(
      MEDIA_KINDS['flatMap']((scope) =>
        inputs2[scope]['map']((response3) => scope + ':' + normalizeText(response3['url'])),
      ),
    );
  return (
    (Array['isArray'](config) ? config : [])['forEach']((input, output) => {
      const text = normalizeText(input?.['type'] || input?.['kind']);
      if (!MEDIA_KINDS['includes'](text)) return;
      const response4 = normalizeInputItem(input, text, output),
        value2 = text + ':' + response4['url'];
      if (map['has'](value2)) return;
      (map['add'](value2),
        inputs2[text]['push']({
          ...response4,
          slotId: normalizeText(input?.['refSlot'] || input?.['slotId']),
        }));
    }),
    inputs2
  );
}
function resolveKindLimit(value3, value4) {
  const value5 = Number(value3?.['maxByKind']?.[value4]);
  if (Number['isFinite'](value5)) return Math['max'](0, Math['trunc'](value5));
  const count = (value3?.['fixedSlots'] || [])['filter'](
    (value6) => normalizeText(value6?.['kind']) === value4,
  )['length'];
  return count > 0 ? count : Number['POSITIVE_INFINITY'];
}
function assignFixedSlots(manifest, args2, value7, value8 = {}) {
  const list2 = Array['isArray'](args2?.['fixedSlots'])
      ? [...args2['fixedSlots']]['sort'](
          (value9, value10) =>
            Number(value9?.['displayOrder'] || 0) - Number(value10?.['displayOrder'] || 0),
        )
      : [],
    value11 = list2['some']((value12) => value12?.['showWhen'] || value12?.['hideWhen']),
    value13 = value11 ? getFixedInputSlotConfigFromManifest(value8, { manifest: manifest }) : null,
    map2 = value11
      ? new Set(value13?.['visibleSlots'] || [])
      : new Set(list2['map']((value14) => normalizeText(value14?.['id']))['filter'](Boolean)),
    list3 = list2['filter']((value15) => map2['has'](normalizeText(value15?.['id']))),
    map3 = new Map(
      list2['map']((value16) => [normalizeText(value16?.['id']), value16])['filter'](([value17]) => value17),
    ),
    map4 = new Map();
  for (const value18 of MEDIA_KINDS) {
    for (const enabled of value7[value18]) {
      if (!enabled['slotId']) continue;
      const enabled2 = map3['get'](enabled['slotId']);
      if (!enabled2) throw new Error('视频模型未声明输入槽“' + enabled['slotId'] + '”');
      if (normalizeText(enabled2['kind']) !== value18)
        throw new Error(
          '输入槽“' + enabled['slotId'] + '”只接受 ' + enabled2['kind'] + '，不能接收 ' + value18,
        );
      if (map4['has'](enabled['slotId']))
        throw new Error('输入槽“' + enabled['slotId'] + '”只能接入一个素材');
      map4['set'](enabled['slotId'], enabled);
    }
  }
  for (const value19 of MEDIA_KINDS) {
    const value20 = list3['filter'](
      (value21) =>
        normalizeText(value21?.['kind']) === value19 && !map4['has'](normalizeText(value21?.['id'])),
    );
    for (const value22 of value7[value19]) {
      if (value22['slotId']) continue;
      const value23 = value20['shift']();
      if (value23) map4['set'](normalizeText(value23['id']), value22);
    }
  }
  for (const value24 of list3) {
    const text2 = normalizeText(value24?.['id']);
    if (value24?.['required'] === !![] && text2 && !map4['has'](text2))
      throw new Error('视频模型缺少必需输入：' + (normalizeText(value24['label']) || text2));
  }
  for (const value25 of args2?.['exclusiveGroups'] || []) {
    const list4 = Array['isArray'](value25?.['slots'])
      ? value25['slots']['map'](normalizeText)['filter']((value26) => map2['has'](value26))
      : [];
    if (list4['length'] === 0) continue;
    const value27 = list4['filter']((value28) => map4['has'](value28))['length'],
      value29 = Number(value25?.['min']),
      value30 = Number(value25?.['max']),
      text3 = normalizeText(value25?.['label'] || value25?.['id']) || '互斥输入组';
    if (Number['isFinite'](value29) && value27 < value29)
      throw new Error(text3 + '至少需要 ' + Math['max'](0, Math['trunc'](value29)) + ' 个输入');
    if (Number['isFinite'](value30) && value27 > value30)
      throw new Error(text3 + '最多允许 ' + Math['max'](0, Math['trunc'](value30)) + ' 个输入');
  }
  return map4;
}
export function validateStoryClipVideoInputs(value31, value32 = {}, value33 = {}) {
  const asObject3 = asObject(value31?.['inputSlots']),
    map5 = new Set(
      (Array['isArray'](asObject3['allowedKinds']) ? asObject3['allowedKinds'] : [])
        ['map'](normalizeText)
        ['filter'](Boolean),
    ),
    inputs3 = normalizeInputs(value32);
  for (const value34 of MEDIA_KINDS) {
    const count2 = inputs3[value34]['length'];
    if (count2 > 0 && !map5['has'](value34))
      throw new Error(
        '视频模型“' + (value31?.['displayName'] || value31?.['modelId']) + '”不支持' + value34 + '输入',
      );
    const kindLimit = resolveKindLimit(asObject3, value34);
    if (count2 > kindLimit) {
      if (value34 === 'audio')
        throw new Error('参考音频不能超过 ' + kindLimit + ' 个，当前为 ' + count2 + ' 个');
      throw new Error(
        '视频模型“' +
          (value31?.['displayName'] || value31?.['modelId']) +
          '”最多支持 ' +
          kindLimit +
          ' 个' +
          value34 +
          '输入，当前为 ' +
          count2 +
          ' 个',
      );
    }
    const value35 = Number(asObject3?.['minByKind']?.[value34]);
    if (Number['isFinite'](value35) && count2 < value35)
      throw new Error(
        '视频模型“' +
          (value31?.['displayName'] || value31?.['modelId']) +
          '”至少需要 ' +
          Math['max'](0, Math['trunc'](value35)) +
          ' 个' +
          value34 +
          '输入',
      );
  }
  return { inputs: inputs3, assignedSlots: assignFixedSlots(value31, asObject3, inputs3, value33) };
}
function assignSlotPayloadFields(value36, map6) {
  const value37 = {};
  for (const [enabled3, response5] of map6['entries']()) {
    ((value37[enabled3] = response5['url']), (value36[enabled3] = response5['url']));
    if (!enabled3['toLowerCase']()['endsWith']('url')) value36[enabled3 + 'Url'] = response5['url'];
  }
  if (Object['keys'](value37)['length'] > 0) value36['inputUrlsBySlot'] = value37;
}
export function buildStoryClipVideoPayload({
  modelId: modelId2,
  provider: provider = '',
  prompt: prompt = '',
  generationParams: generationParams = {},
  inputs: inputs = {},
  assetInputRefs: assetInputRefs = [],
  installId: installId = '',
  providerProfileId: providerProfileId = '',
} = {}) {
  const storyClipVideoExecution = resolveStoryClipVideoExecution(modelId2, provider);
  if (!storyClipVideoExecution?.['modelManifest'] || !storyClipVideoExecution?.['executionManifest'])
    throw new Error('视频模型缺少 manifest 或 execution manifest：' + (normalizeText(modelId2) || '(empty)'));
  const { modelManifest: modelManifest, executionManifest: executionManifest } = storyClipVideoExecution;
  if (modelManifest['kind'] !== 'video' || executionManifest['kind'] !== 'video')
    throw new Error('模型“' + modelManifest['modelId'] + '”不是视频生成模型');
  const generationParams2 = sanitizeModelUiSchemaParams(modelManifest['modelId'], generationParams),
    validateStoryClipVideoInputs2 = validateStoryClipVideoInputs(
      modelManifest,
      mergePromptAssetInputRefs(inputs, assetInputRefs),
      {
        generationParams: generationParams2,
      },
    ),
    images = validateStoryClipVideoInputs2['inputs']['image']['map']((response6) => response6['url']),
    videos = validateStoryClipVideoInputs2['inputs']['video']['map']((response7) => response7['url']),
    audios = validateStoryClipVideoInputs2['inputs']['audio']['map']((response8) => response8['url']),
    payload2 = {
      ...generationParams2,
      prompt: String(prompt || ''),
      model: modelManifest['modelId'],
      provider: modelManifest['provider'],
      generationParams: { ...generationParams2 },
      images: images,
      videos: videos,
      audios: audios,
      inputUrls: images,
      inputImages: images,
      inputVideos: videos,
      inputAudios: audios,
    };
  images[0] &&
    ((payload2['image'] = images[0]),
    (payload2['imageUrl'] = images[0]),
    (payload2['refImageUrl'] = images[0]));
  if (videos[0]) payload2['videoUrl'] = videos[0];
  if (audios[0]) payload2['audioUrl'] = audios[0];
  if (normalizeText(installId)) payload2['installId'] = normalizeText(installId);
  normalizeText(providerProfileId) && (payload2['providerProfileId'] = normalizeText(providerProfileId));
  assignSlotPayloadFields(payload2, validateStoryClipVideoInputs2['assignedSlots']);
  const sourceWidth = getGenerationInputRatioMediaSize(
    validateStoryClipVideoInputs2['inputs'],
    modelManifest,
  );
  return (
    applyVideoAdaptiveAspectRatio(payload2, {
      nodeData: { generationParams: generationParams2 },
      modelManifest: modelManifest,
      provider: modelManifest['provider'],
      model: modelManifest['modelId'],
      sourceWidth: sourceWidth?.['width'] || 0,
      sourceHeight: sourceWidth?.['height'] || 0,
    }),
    { payload: payload2, modelManifest: modelManifest, executionManifest: executionManifest }
  );
}
function getResultKey(value38) {
  return normalizeText(
    value38?.['localPath'] ||
      value38?.['videoUrl'] ||
      value38?.['displayLocalPath'] ||
      value38?.['thumbId'] ||
      value38?.['thumbUrl'],
  );
}
function appendVideoResults(list5 = [], value39 = []) {
  const list6 = Array['isArray'](list5) ? list5['map']((args3) => ({ ...args3 })) : [],
    map7 = new Set(list6['map'](getResultKey)['filter'](Boolean));
  for (const args4 of value39) {
    const resultKey = getResultKey(args4);
    if (resultKey && map7['has'](resultKey)) continue;
    list6['push']({ ...args4 });
    if (resultKey) map7['add'](resultKey);
  }
  return list6;
}
function mapRuntimeStatus(value40) {
  const generationUiState = resolveGenerationUiState(value40);
  if (generationUiState === 'error') return 'failed';
  if (generationUiState === 'submitting' || generationUiState === 'recovering') return 'running';
  return generationUiState;
}
function isShallowRecordEqual(options5 = {}, value41 = {}) {
  const list7 = Object['keys'](options5),
    list8 = Object['keys'](value41);
  return (
    list7['length'] === list8['length'] &&
    list7['every']((value42) => Object['is'](options5[value42], value41[value42]))
  );
}
export function createStoryClipTaskStoreAdapter({
  targetId: targetId,
  getClip: getClip,
  updateClip: updateClip,
  initialTaskNode: initialTaskNode = {},
} = {}) {
  const id = normalizeText(targetId);
  if (!id) throw new Error('story clip task store requires targetId');
  if (typeof getClip !== 'function' || typeof updateClip !== 'function')
    throw new Error('story clip task store requires getClip() and updateClip()');
  let useOpenapiQuery = { id: id, type: 'story-clip-video-task', ...initialTaskNode };
  const run = (videos2 = {}) => {
    useOpenapiQuery = { ...useOpenapiQuery, ...videos2 };
    const args5 = asObject(getClip()),
      args6 = asObject(args5['generation']),
      args7 = asObject(args5['video']),
      list9 = Array['isArray'](videos2['videos'])
        ? normalizeVideoGenerationResult({ videos: videos2['videos'] })['items']
        : [],
      results =
        list9['length'] > 0
          ? appendVideoResults(args7['results'], list9)
          : Array['isArray'](args7['results'])
            ? args7['results']
            : [],
      activeIndex =
        list9['length'] > 0
          ? Math['max'](0, results['length'] - 1)
          : Number(args7['activeIndex'] || 0),
      generation = {
        ...args6,
        status: mapRuntimeStatus(useOpenapiQuery),
        taskId: normalizeText(
          useOpenapiQuery['rhTaskId'] || useOpenapiQuery['asyncTaskId'] || useOpenapiQuery['taskId'],
        ),
        provider: normalizeText(useOpenapiQuery['taskProvider'] || useOpenapiQuery['provider']),
        providerProfileId: normalizeText(useOpenapiQuery['providerProfileId']),
        modelId: normalizeText(useOpenapiQuery['taskModelId'] || useOpenapiQuery['model']),
        executionId: normalizeText(useOpenapiQuery['taskExecutionId']),
        useOpenapiQuery: useOpenapiQuery['rhTaskUseOpenapiQuery'] === !![],
        startedAt: Number(useOpenapiQuery['generationStartTime'] || 0),
        duration:
          useOpenapiQuery['generationDuration'] === null ||
          useOpenapiQuery['generationDuration'] === undefined
            ? null
            : Number(useOpenapiQuery['generationDuration']),
        error: mapRuntimeStatus(useOpenapiQuery) === 'failed' ? getTaskMessage(useOpenapiQuery) : '',
      },
      video = { ...args7, results: results, activeIndex: activeIndex };
    if (isShallowRecordEqual(args6, generation) && isShallowRecordEqual(args7, video)) return ![];
    return (updateClip({ ...args5, generation: generation, video: video }), !![]);
  };
  return {
    getState: () => ({ nodes: { [id]: useOpenapiQuery } }),
    getStateRaw: () => ({ nodes: { [id]: useOpenapiQuery } }),
    updateNodeData(value43, value44) {
      if (normalizeText(value43) !== id) throw new Error('unknown story clip task target: ' + value43);
      run(value44);
    },
    addNode(args8) {
      if (normalizeText(args8?.['id']) !== id)
        throw new Error('invalid story clip task node: ' + (args8?.['id'] || ''));
      useOpenapiQuery = { ...useOpenapiQuery, ...args8 };
    },
  };
}
export function createStoryClipGenerationController({
  getClip: getClip2,
  updateClip: updateClip2,
  submitTask: submitTask = submitTask_2,
  resumeTask: resumeTask = resumeTask_2,
  cancelTask: cancelTask = cancelTask_2,
  runVideoGeneration: runVideoGeneration = generateVideo,
  resumeVideoGeneration: resumeVideoGeneration = resumeVideoGenerationTask,
} = {}) {
  if (typeof getClip2 !== 'function' || typeof updateClip2 !== 'function')
    throw new Error('story clip generation requires getClip() and updateClip()');
  let enabled4 = null;
  async function generate(prompt2 = {}) {
    if (enabled4) throw new Error('当前片段已有视频生成任务正在运行');
    const asObject4 = asObject(getClip2()),
      targetId2 = resolveStoryClipTaskTargetId(prompt2, asObject4),
      model2 = buildStoryClipVideoPayload({
        ...prompt2,
        prompt: prompt2['prompt'] ?? asObject4['prompt'],
      }),
      store = createStoryClipTaskStoreAdapter({
        targetId: targetId2,
        getClip: getClip2,
        updateClip: updateClip2,
        initialTaskNode: {
          model: model2['modelManifest']['modelId'],
          provider: model2['modelManifest']['provider'],
          taskModelId: model2['modelManifest']['modelId'],
          taskProvider: model2['modelManifest']['provider'],
          taskExecutionId: model2['executionManifest']['id'],
          adapterType: model2['executionManifest']['adapterType'],
          providerProfileId: normalizeText(model2['payload']['providerProfileId']),
        },
      }),
      abortController = new AbortController();
    enabled4 = {
      targetId: targetId2,
      store: store,
      abortController: abortController,
      modelManifest: model2['modelManifest'],
    };
    const resumable = isAsyncStoryClipVideoExecution(model2['modelManifest'], model2['executionManifest']);
    let rhTaskUseOpenapiQuery = ![];
    const generationSubmitPlan = createGenerationSubmitPlan({
      kind: 'video',
      sourceNodeId: targetId2,
      targetNodeId: targetId2,
      trigger: 'story-workspace',
      completionFeedback: ![],
      taskType: 'story-clip-video-generation',
      provider: model2['modelManifest']['provider'],
      adapterType: model2['executionManifest']['adapterType'],
      modelId: model2['modelManifest']['modelId'],
      executionId: model2['executionManifest']['id'],
      payload: model2['payload'],
      cancellable: model2['modelManifest']['cancellable'] === !![],
      resumable: resumable || model2['executionManifest']['adapterType'] === 'workflow',
      pauseOnAbort: 'afterTaskId',
      async: resumable,
      submit: (value45, signal = {}) =>
        runVideoGeneration(value45, {
          signal: signal['signal'],
          runningHubWorkflowQueueLease: signal['runningHubWorkflowQueueLease'],
          onRunningHubWorkflowQueueChange: signal['onRunningHubWorkflowQueueChange'],
          onTaskId: (value46) => {
            (signal['onTaskId']?.(value46),
              rhTaskUseOpenapiQuery && signal['updateTaskNode']?.({ rhTaskUseOpenapiQuery: !![] }));
          },
          onTaskMeta: ({ taskId: taskId2, useOpenapiQuery: useOpenapiQuery2 } = {}) => {
            ((rhTaskUseOpenapiQuery = useOpenapiQuery2 === !![]),
              signal['onTaskId']?.(taskId2),
              signal['updateTaskNode']?.({ rhTaskUseOpenapiQuery: rhTaskUseOpenapiQuery }));
          },
        }),
      resultBuilder: (value47, startedAt) =>
        buildVideoGenerationResultPatch(normalizeVideoGenerationResult(value47), {
          startedAt: startedAt['startedAt'],
          duration: Date['now']() - startedAt['startedAt'],
        }),
      failureBuilder: (error) => ({ jobError: normalizeText(error?.['message']) || '视频生成失败' }),
    });
    try {
      const response9 = await submitTask(generationSubmitPlan, {
        store: store,
        abortController: abortController,
      });
      if (response9?.['status'] !== 'pending' && enabled4?.['targetId'] === targetId2) enabled4 = null;
      return response9;
    } catch (value48) {
      if (enabled4?.['targetId'] === targetId2) enabled4 = null;
      throw value48;
    }
  }
  async function resume(options6 = {}) {
    if (enabled4) throw new Error('当前片段已有视频生成任务正在运行');
    const asObject5 = asObject(getClip2()),
      providerProfileId3 = {
        ...(getRecoverableStoryClipVideoTask(asObject5) || {}),
        ...(options6['taskId'] ? { taskId: normalizeText(options6['taskId']) } : {}),
        ...(options6['modelId'] ? { modelId: normalizeText(options6['modelId']) } : {}),
        ...(options6['provider'] ? { provider: normalizeText(options6['provider']) } : {}),
        ...(options6['providerProfileId']
          ? { providerProfileId: normalizeText(options6['providerProfileId']) }
          : {}),
        ...(options6['executionId'] ? { executionId: normalizeText(options6['executionId']) } : {}),
        ...(options6['startedAt'] ? { startedAt: Number(options6['startedAt']) } : {}),
        ...(options6['useOpenapiQuery'] === !![] ? { useOpenapiQuery: !![] } : {}),
      };
    if (!providerProfileId3['taskId']) throw new Error('片段视频任务缺少 taskId，无法恢复轮询');
    if (!providerProfileId3['modelId']) throw new Error('片段视频任务缺少 modelId，无法恢复轮询');
    const storyClipVideoExecution2 = resolveStoryClipVideoExecution(
      providerProfileId3['modelId'],
      providerProfileId3['provider'],
    );
    if (!storyClipVideoExecution2?.['modelManifest'] || !storyClipVideoExecution2?.['executionManifest'])
      throw new Error(
        '视频模型缺少 manifest 或 execution manifest：' + providerProfileId3['modelId'],
      );
    const { modelManifest: modelManifest2, executionManifest: executionManifest2 } = storyClipVideoExecution2;
    if (modelManifest2['kind'] !== 'video' || executionManifest2['kind'] !== 'video')
      throw new Error('模型“' + modelManifest2['modelId'] + '”不是视频生成模型');
    const async2 = isAsyncStoryClipVideoExecution(modelManifest2, executionManifest2),
      enabled5 = executionManifest2['adapterType'] === 'workflow';
    if (!async2 && !enabled5)
      throw new Error('视频模型“' + modelManifest2['modelId'] + '”不支持恢复异步任务');
    const targetId3 = resolveStoryClipTaskTargetId(options6, asObject5),
      generationStartTime = Number(providerProfileId3['startedAt'] || Date['now']()),
      payload3 = {
        model: modelManifest2['modelId'],
        provider: modelManifest2['provider'],
        ...(providerProfileId3['providerProfileId']
          ? { providerProfileId: providerProfileId3['providerProfileId'] }
          : {}),
      },
      store2 = createStoryClipTaskStoreAdapter({
        targetId: targetId3,
        getClip: getClip2,
        updateClip: updateClip2,
        initialTaskNode: {
          model: modelManifest2['modelId'],
          provider: modelManifest2['provider'],
          taskModelId: modelManifest2['modelId'],
          taskProvider: modelManifest2['provider'],
          taskExecutionId: executionManifest2['id'],
          adapterType: executionManifest2['adapterType'],
          providerProfileId: providerProfileId3['providerProfileId'],
          generationStartTime: generationStartTime,
          asyncTaskId: providerProfileId3['taskId'],
          asyncTaskStatus: 'running',
          asyncTaskStartedAt: generationStartTime,
          asyncTaskProvider: modelManifest2['provider'],
          asyncTaskKind: 'video',
          taskResumable: !![],
          rhTaskUseOpenapiQuery: providerProfileId3['useOpenapiQuery'] === !![],
        },
      }),
      abortController2 = new AbortController();
    enabled4 = {
      targetId: targetId3,
      store: store2,
      abortController: abortController2,
      modelManifest: modelManifest2,
    };
    const generationResumePlan = createGenerationResumePlan({
      kind: 'video',
      sourceNodeId: targetId3,
      targetNodeId: targetId3,
      trigger: 'story-workspace-recovery',
      completionFeedback: ![],
      taskType: 'story-clip-video-generation',
      provider: modelManifest2['provider'],
      adapterType: executionManifest2['adapterType'],
      modelId: modelManifest2['modelId'],
      executionId: executionManifest2['id'],
      payload: payload3,
      taskId: providerProfileId3['taskId'],
      startedAt: generationStartTime,
      cancellable: modelManifest2['cancellable'] === !![],
      resumable: !![],
      pauseOnAbort: !![],
      async: async2,
      poll: ({ taskId: taskId3, payload: payload4, signal: signal2 }) =>
        resumeVideoGeneration(taskId3, payload4, {
          signal: signal2,
          useOpenapiQuery: providerProfileId3['useOpenapiQuery'] === !![],
        }),
      resultBuilder: (value49, startedAt2) =>
        buildVideoGenerationResultPatch(normalizeVideoGenerationResult(value49), {
          startedAt: startedAt2['startedAt'],
          duration: Date['now']() - startedAt2['startedAt'],
        }),
      failureBuilder: (error2) => ({
        jobError: normalizeText(error2?.['message']) || '视频任务恢复失败',
      }),
    });
    try {
      const response10 = await resumeTask(generationResumePlan, {
        store: store2,
        abortController: abortController2,
        startedAt: generationStartTime,
      });
      if (response10?.['status'] !== 'pending' && enabled4?.['targetId'] === targetId3) enabled4 = null;
      return response10;
    } catch (value50) {
      if (enabled4?.['targetId'] === targetId3) enabled4 = null;
      throw value50;
    }
  }
  async function cancel() {
    if (!enabled4) return { ok: ![], reason: 'missing-target' };
    const store3 = enabled4,
      response11 = await cancelTask(store3['targetId'], {
        store: store3['store'],
        cancellable: store3['modelManifest']?.['cancellable'] === !![],
        abortLocal: !![],
      });
    if (response11?.['ok'] && enabled4?.['targetId'] === store3['targetId']) enabled4 = null;
    return response11;
  }
  function pause() {
    if (!enabled4) return { ok: ![], reason: 'missing-target' };
    const targetId4 = enabled4['targetId'];
    return (enabled4['abortController']['abort'](), { ok: !![], status: 'pausing', targetId: targetId4 });
  }
  return {
    generate: generate,
    resume: resume,
    cancel: cancel,
    pause: pause,
    getActiveTargetId: () => enabled4?.['targetId'] || '',
  };
}

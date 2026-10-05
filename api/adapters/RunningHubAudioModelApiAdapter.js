import { getExecutionManifest, sanitizeModelUiSchemaParams } from '../../src/manifests/index.js';
import { buildBodyFromMapping } from './modelApiMappingEngine.js';
import { uploadModelApiMediaInputs } from '../mediaInputUploadRouter.js';
import { processInputAudiosPreserveOrder } from '../audioUploadApi.js';
import { processInputImagesPreserveOrder } from '../imageUploadApi.js';
import {
  buildRunningHubModelApiUrl,
  getRunningHubProviderProfileId,
  resolveRunningHubModelApiProfileId,
  resolveRunningHubModelApiBaseUrl,
} from '../../src/modules/runningHubProviderProfiles.js';
import { validateRunningHubAudioParameters } from './runningHubAudioValidation.js';
function throwIfAborted(value) {
  if (value?.['aborted']) throw new DOMException('生成已中断', 'AbortError');
}
function normalizeRefs(item, key, index) {
  const list = (key['inputSlots']?.['fixedSlots'] || [])['filter']((result) => result['kind'] === index),
    list2 =
      item[index + 'Refs'] ||
      item['input' + index[0]['toUpperCase']() + index['slice'](1) + 'Urls'] ||
      [],
    map = new Set();
  return list2['map']((args) => {
    const response = typeof args === 'string' ? { url: args } : { ...args };
    let enabled = String(response['refSlot'] || '')['trim']();
    if (enabled && !list['some']((data) => data['id'] === enabled))
      throw new Error('参考素材槽位无效，请重新连接');
    if (!enabled) enabled = list['find']((options) => !map['has'](options['id']))?.['id'] || '';
    return (
      map['add'](enabled),
      { ...response, refSlot: enabled, url: String(response['url'] || '')['trim']() }
    );
  });
}
const TRANSFORMS = Object['freeze']({
  audioSlot: (target, { context: context, spec: spec }) => context['audioBySlot'][spec['slot']],
  first: (source) => source?.[0],
  lines: (next) =>
    String(next || '')
      ['split'](/\r?\n/)
      ['map']((current) => current['trim']())
      ['filter'](Boolean),
  secondsToMilliseconds: (entry) => Math['round'](Number(entry) * 1000),
  parenthesisFilter: (record) => (record ? 100 : 0),
});
export async function buildRunningHubCatalogRequest(args2, enabled2, payload, handle = {}) {
  const { modelManifest: modelManifest, executionManifest: executionManifest } = payload,
    enabled3 = executionManifest['extensions']?.['audioModelApi'];
  if (
    !enabled3 ||
    modelManifest['provider'] !== 'runninghub' ||
    executionManifest['adapterType'] !== 'modelApi'
  )
    throw new Error('RunningHub 音频执行配置缺失');
  throwIfAborted(args2['signal']);
  const runningHubModelApiProfileId = resolveRunningHubModelApiProfileId(
      modelManifest['modelId'],
      getRunningHubProviderProfileId(args2),
    ),
    state = handle['getProviderConfig']?.(runningHubModelApiProfileId) || {},
    enabled4 = String(state['modelApiKey'] || args2['apiKey'] || state['apiKey'] || '')['trim']();
  if (!enabled4) throw new Error('RunningHub API Key 未配置，请在设置中配置');
  const refs = normalizeRefs(args2, modelManifest, 'audio'),
    refs2 = normalizeRefs(args2, modelManifest, 'image'),
    config = args2['generationParams'] || {};
  validateRunningHubAudioParameters(modelManifest, enabled3, enabled2, config, refs, refs2);
  const sanitizeModelUiSchemaParams2 = sanitizeModelUiSchemaParams(modelManifest['modelId'], config, {
      includeDefaults: true,
    }),
    scope = {
      getProviderConfig: handle['getProviderConfig'],
      processInputAudios: handle['processInputAudios'] || processInputAudiosPreserveOrder,
      processInputImages: handle['processInputImages'] || processInputImagesPreserveOrder,
    },
    input = {
      apiKey: enabled4,
      providerProfileId: runningHubModelApiProfileId,
      apiUrl: resolveRunningHubModelApiBaseUrl(runningHubModelApiProfileId),
      strictUpload: true,
      uploadOptions: { signal: args2['signal'] },
    },
    output = refs['length']
      ? await uploadModelApiMediaInputs(
          'audio',
          refs['map']((value2) => value2['url']),
          scope,
          input,
        )
      : [];
  throwIfAborted(args2['signal']);
  const value3 = refs2['length']
    ? await uploadModelApiMediaInputs(
        'image',
        refs2['map']((value4) => value4['url']),
        scope,
        input,
      )
    : [];
  throwIfAborted(args2['signal']);
  if (
    output['length'] !== refs['length'] ||
    output['some']((enabled5) => !enabled5) ||
    value3['length'] !== refs2['length']
  )
    throw new Error('参考素材上传不完整');
  const value5 = Object['fromEntries'](refs['map']((value6, value7) => [value6['refSlot'], output[value7]])),
    args3 = await buildBodyFromMapping({
      bodyMapping: executionManifest['bodyMapping'],
      context: {
        payload: { ...args2, generationParams: sanitizeModelUiSchemaParams2 },
        finalPrompt: enabled2,
        inputAudios: output,
        inputImages: value3,
        audioBySlot: value5,
      },
      transforms: TRANSFORMS,
    }),
    enabled6 = enabled3['rules']?.['voiceOverride'];
  if (
    enabled6 &&
    (!enabled6['mode'] || config[enabled6['mode']] === 'custom') &&
    String(sanitizeModelUiSchemaParams2[enabled6['custom']] || '')['trim']()
  )
    args3[enabled6['target']] = String(sanitizeModelUiSchemaParams2[enabled6['custom']])['trim']();
  if (enabled3['rules']?.['controlMode'] === 'murekaBgm' && !enabled2) delete args3['prompt'];
  const value8 = [];
  for (const args4 of enabled3['preparations'] || []) {
    if (args4['toggle'] && sanitizeModelUiSchemaParams2[args4['toggle']] !== true) continue;
    if (args3[args4['targetField']]) continue;
    const enabled7 = value5[args4['slot']];
    if (!enabled7) continue;
    const executionManifest2 = getExecutionManifest(args4['executionId']);
    if (
      !executionManifest2?.['extensions']?.['audioPreparation'] ||
      executionManifest2['provider'] !== 'runninghub'
    )
      throw new Error('RunningHub 音频前处理配置缺失');
    value8['push']({
      ...args4,
      apiUrl: buildRunningHubModelApiUrl(runningHubModelApiProfileId, executionManifest2['endpoint']),
      body: { [args4['inputField']]: enabled7, ...(args4['purpose'] ? { purpose: args4['purpose'] } : {}) },
    });
  }
  const args5 = String(args2['installId'] || '')['trim']();
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json', ...(args5 ? { 'X-AIC-Install-Id': args5 } : {}) },
    body: {
      apiUrl: buildRunningHubModelApiUrl(runningHubModelApiProfileId, executionManifest['endpoint']),
      apiKey: enabled4,
      ...args3,
    },
    responseMapping: executionManifest['responseMapping'],
    isProxy: true,
    adapterTrace: {
      source: 'manifest',
      modelId: modelManifest['modelId'],
      executionId: executionManifest['id'],
    },
    meta: {
      provider: 'runninghub',
      adapterType: 'modelApi',
      model: modelManifest['modelId'],
      executionId: executionManifest['id'],
      providerProfileId: runningHubModelApiProfileId,
      rhProviderProfileId: runningHubModelApiProfileId,
      apiUrl: resolveRunningHubModelApiBaseUrl(runningHubModelApiProfileId),
      isRunningHubAudioModelApi: true,
      audioWorkflowKey: modelManifest['modelId'],
      audioWorkflowLabel: modelManifest['displayName'],
      nodeId: String(args2['nodeId'] || ''),
      installId: args5,
      prompt: enabled2,
      preparations: value8,
    },
  };
}
function extractPreparationValue(value9, value10) {
  const value11 = Array['isArray'](value9?.['results']) ? value9['results'] : [],
    list3 = value11['filter'](
      (response2) => response2?.['outputType'] === 'text' && typeof response2['text'] === 'string',
    )
      ['map']((response3) => response3['text']['trim']())
      ['filter'](Boolean);
  if (value10 === 'id') {
    if (list3['length'] !== 1 || !/^[A-Za-z0-9_-]{1,64}$/['test'](list3[0]))
      throw new Error('Mureka 前处理未返回有效素材 ID');
    return { id: list3[0] };
  }
  for (const value12 of list3) {
    let value13;
    try {
      value13 = JSON['parse'](value12);
    } catch {
      continue;
    }
    if (
      value13 &&
      typeof value13 === 'object' &&
      typeof value13['coverFeatureId'] === 'string' &&
      value13['coverFeatureId']['trim']()
    )
      return value13;
  }
  throw new Error('翻唱前处理未返回 coverFeatureId；请核对厂商返回格式，或关闭先提取原曲特征使用直接翻唱');
}
export async function prepareRunningHubCatalogRequest(
  dom,
  { submitAndPoll: submitAndPoll, signal: signal } = {},
) {
  const list4 = dom['meta']?.['preparations'] || [];
  if (!list4['length']) return dom;
  const enabled8 = { ...dom['body'] };
  for (const args6 of list4) {
    throwIfAborted(signal);
    const value14 = await submitAndPoll({
      ...dom,
      body: { apiUrl: args6['apiUrl'], apiKey: enabled8['apiKey'], ...args6['body'] },
      meta: { ...dom['meta'], preparations: [] },
    });
    throwIfAborted(signal);
    const extractPreparationValue2 = extractPreparationValue(value14, args6['resultType']);
    enabled8[args6['targetField']] =
      args6['resultType'] === 'id'
        ? extractPreparationValue2['id']
        : extractPreparationValue2['coverFeatureId']['trim']();
    if (args6['resultType'] === 'coverFeatures' && !enabled8['lyrics'])
      enabled8['lyrics'] = String(extractPreparationValue2['lyrics'] || '')['trim']();
    if (
      args6['resultType'] === 'coverFeatures' &&
      (enabled8['lyrics']['length'] < 10 || enabled8['lyrics']['length'] > 1000)
    )
      throw new Error('翻唱前处理后的歌词必须为 10–1000 字符');
  }
  return { ...dom, body: enabled8, meta: { ...dom['meta'], preparations: [] } };
}

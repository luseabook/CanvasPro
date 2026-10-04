import { ensureConfig, getProviderConfig } from './configApi.js';
import { processInputAudiosPreserveOrder } from './audioUploadApi.js';
import { cancelRunningHubTask } from './runninghubTaskApi.js';
import { requester } from './requester.js';
import { runTaskSingleFlight } from './taskSingleFlight.js';
import { formatRunningHubFailureMessage } from './errors/parsers/RunningHubErrorParser.js';
import {
  RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID,
  RH_AUDIO_SEPARATION_MODEL_ID,
  resolveModelExecution,
} from '../src/manifests/index.js';
const POLL_MAX_COUNT = 0x1c2,
  POLL_INTERVAL_MS = 0x7d0;
export async function cancelRunningHubAudioTask({ apiKey: apiKey, taskId: taskId } = {}) {
  return cancelRunningHubTask({ apiKey: apiKey, taskId: taskId });
}
function getAudioSeparationExecutionManifest() {
  const modelExecution = resolveModelExecution(RH_AUDIO_SEPARATION_MODEL_ID)?.executionManifest;
  if (!modelExecution)
    throw new Error('RunningHub audio workflow manifest missing: ' + RH_AUDIO_SEPARATION_MODEL_ID);
  return modelExecution;
}
function getAudioSeparationResultNodeIds() {
  const audioSeparationExecutionManifest = getAudioSeparationExecutionManifest()?.mapping?.resultNodes || {},
    vocals = String(audioSeparationExecutionManifest.vocals || '').trim(),
    background = String(audioSeparationExecutionManifest.background || '').trim();
  if (!vocals || !background)
    throw new Error(
      'RunningHub audio workflow manifest missing result nodes: ' + RH_AUDIO_SEPARATION_MODEL_ID,
    );
  return { vocals: vocals, background: background };
}
function sleep(value) {
  return new Promise((item) => setTimeout(item, value));
}
function normalizeRhInstanceType(key) {
  return String(key || 'default').trim() === 'plus' ? 'plus' : 'default';
}
function normalizeTextList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item2) => String(item2 || '').trim()).filter(Boolean);
}
function normalizeRefList(list2) {
  if (!Array.isArray(list2)) return [];
  return list2
    .map((edgeId) => {
      if (!edgeId || typeof edgeId !== 'object') return null;
      const url = String(edgeId.url || '').trim();
      if (!url) return null;
      return {
        edgeId: edgeId.edgeId ? String(edgeId.edgeId) : '',
        sourceId: edgeId.sourceId ? String(edgeId.sourceId) : '',
        sourceType: edgeId.sourceType ? String(edgeId.sourceType) : '',
        refSlot: edgeId.refSlot ? String(edgeId.refSlot) : '',
        url: url,
      };
    })
    .filter(Boolean);
}
function parseResponseData(enabled) {
  if (!enabled) return {};
  if (typeof enabled === 'object') return enabled;
  const enabled2 = String(enabled || '').trim();
  if (!enabled2) return {};
  try {
    return JSON.parse(enabled2);
  } catch {}
  const list3 = enabled2.split('\n').filter((item3) => item3.trim().startsWith('data:'));
  if (list3.length > 0) {
    const index = list3[list3.length - 1].replace(/^data:\s*/, '');
    try {
      return JSON.parse(index);
    } catch {}
  }
  throw new Error('无法解析 RunningHub 音频接口响应');
}
function getTaskId(result) {
  return String(
    result?.taskId ||
      result?.task_id ||
      result?.data?.taskId ||
      result?.data?.task_id ||
      result?.data?.id ||
      result?.id ||
      '',
  ).trim();
}
function getApiErrorMessage(error, data = '音频生成失败') {
  return formatRunningHubFailureMessage(
    error,
    error?.message || error?.error || error?.msg || error?.data?.message || error?.data?.error || data,
  );
}
function isLikelyAudioUrl(options) {
  const enabled3 = String(options || '').trim();
  if (!enabled3) return false;
  if (!/^https?:\/\//i.test(enabled3) && !enabled3.startsWith('/')) return false;
  return /\.(wav|mp3|m4a|flac|aac|ogg|opus|wma|amr|aif|aiff|caf|webm)(\?|#|$)/i.test(enabled3);
}
function extractAudioResultEntries(target) {
  const list4 = [],
    map = new WeakSet(),
    list5 = ['audioUrl', 'audio_url', 'url', 'fileUrl', 'download_url', 'output', 'mediaUrl'],
    handler = (list6, source = '') => {
      if (list6 == null) return;
      if (Array.isArray(list6)) {
        list6.forEach((item4) => handler(item4, source));
        return;
      }
      if (typeof list6 === 'object') {
        handler2(list6, source);
        return;
      }
      const audioUrl = String(list6 || '').trim();
      if (!audioUrl) return;
      list4.push({ nodeId: String(source || '').trim(), audioUrl: audioUrl });
    },
    handler2 = (list7, next = '') => {
      if (list7 == null) return;
      if (Array.isArray(list7)) {
        list7.forEach((item5) => handler2(item5, next));
        return;
      }
      if (typeof list7 !== 'object') return;
      if (map.has(list7)) return;
      map.add(list7);
      const current = String(list7.nodeId || list7.node_id || next || '').trim();
      (list5.forEach((item6) => {
        Object.prototype.hasOwnProperty.call(list7, item6) && handler(list7[item6], current);
      }),
        Object.entries(list7).forEach(([entry, record]) => {
          if (entry === 'nodeId' || entry === 'node_id' || list5.includes(entry)) return;
          record && typeof record === 'object' && handler2(record, current);
        }));
    };
  handler2(target);
  const list8 = [],
    map2 = new Set();
  for (const payload of list4) {
    const nodeId = String(payload?.nodeId || '').trim(),
      audioUrl2 = String(payload?.audioUrl || '').trim();
    if (!audioUrl2) continue;
    const handle = nodeId + '::' + audioUrl2;
    if (map2.has(handle)) continue;
    (map2.add(handle), list8.push({ nodeId: nodeId, audioUrl: audioUrl2 }));
  }
  const list9 = list8.filter((item7) => isLikelyAudioUrl(item7.audioUrl));
  return list9.length ? list9 : list8;
}
function extractAudioUrls(state) {
  return extractAudioResultEntries(state).map((item8) => item8.audioUrl);
}
function normalizeAudioTaskResult(list10, config, scope = 1) {
  const audioUrl3 = Array.isArray(list10)
    ? list10.map((item9) => String(item9 || '').trim()).filter(Boolean)
    : [];
  if (audioUrl3.length < Math.max(1, Number(scope) || 1))
    throw new Error(String(config || '任务已完成，但未提取到音频地址'));
  return {
    audioUrl: audioUrl3[0],
    isBatch: audioUrl3.length > 1,
    audios: audioUrl3.map((audioUrl4) => ({ audioUrl: audioUrl4 })),
  };
}
function normalizeAudioSeparationTaskResult(list11, input) {
  const audioSeparationResultNodeIds = getAudioSeparationResultNodeIds(),
    list12 = Array.isArray(list11)
      ? list11
          .map((item10) => ({
            nodeId: String(item10?.nodeId || '').trim(),
            audioUrl: String(item10?.audioUrl || '').trim(),
          }))
          .filter((enabled4) => !!enabled4.audioUrl)
      : [],
    output = list12.some(
      (item11) =>
        item11.nodeId === audioSeparationResultNodeIds.vocals ||
        item11.nodeId === audioSeparationResultNodeIds.background,
    );
  let audioUrl5 = list12;
  if (output) {
    const args = list12.find((item12) => item12.nodeId === audioSeparationResultNodeIds.vocals) || null,
      args2 = list12.find((item13) => item13.nodeId === audioSeparationResultNodeIds.background) || null;
    if (!args || !args2) throw new Error(String(input || '任务已完成，但未提取到人声和背景声音频地址'));
    audioUrl5 = [
      { ...args, role: 'vocals' },
      { ...args2, role: 'background' },
    ];
  } else
    audioUrl5 = list12
      .slice(0, 2)
      .map((args3, role) => ({ ...args3, role: role === 0 ? 'vocals' : 'background' }));
  if (audioUrl5.length < 2) throw new Error(String(input || '任务已完成，但未提取到人声和背景声音频地址'));
  return {
    audioUrl: audioUrl5[0].audioUrl,
    isBatch: true,
    vocalsAudioUrl: audioUrl5[0].audioUrl,
    backgroundAudioUrl: audioUrl5[1].audioUrl,
    audios: audioUrl5.map((audioUrl6) => ({
      audioUrl: audioUrl6.audioUrl,
      nodeId: audioUrl6.nodeId,
      role: audioUrl6.role,
    })),
  };
}
function normalizeAdvancedVoiceClonePrompt(value2) {
  return String(value2 || '')
    .trim()
    .replace(/(^|\s+)@?音频1\s*[:：]?\s*/g, '$1[speaker_1]: ')
    .replace(/(^|\s+)@?音频2\s*[:：]?\s*/g, '$1[speaker_2]: ')
    .replace(/\s+(\[speaker_[12]\]:)/g, '\n$1')
    .trim();
}
function getMappingNode(value3, value4, value5) {
  const value6 = value3?.[value4],
    nodeId2 = String(value6?.nodeId || '').trim(),
    fieldName = String(value6?.fieldName || '').trim();
  if (!nodeId2 || !fieldName) throw new Error('音频工作流 manifest 缺少 ' + value5 + ' 节点映射');
  return { nodeId: nodeId2, fieldName: fieldName };
}
function createNodeInfo(nodeId3, fieldValue, description = '') {
  return {
    nodeId: nodeId3.nodeId,
    fieldName: nodeId3.fieldName,
    fieldValue: fieldValue,
    ...(description ? { description: description } : {}),
  };
}
const KNOWN_AUDIO_REF_SLOTS = new Set([
  'audioRef',
  'audioTarget',
  'audio1',
  'audio2',
  'audio',
  'sourceAudio',
  'referenceAudio',
]);
function normalizeAudioItemsBySlotOrder(
  list13 = [],
  value7 = [],
  { remapKnownForeignSlots: remapKnownForeignSlots = true } = {},
) {
  const refSlot = (Array.isArray(value7) ? value7 : [])
    .map((item14) => String(item14 || '').trim())
    .filter(Boolean);
  if (refSlot.length === 0) return list13;
  const map3 = new Set();
  return (Array.isArray(list13) ? list13 : []).map((args4) => {
    const refSlot2 = String(args4?.refSlot || '').trim();
    if (refSlot2 && refSlot.includes(refSlot2) && !map3.has(refSlot2))
      return (map3.add(refSlot2), { ...args4, refSlot: refSlot2 });
    if (refSlot2 && remapKnownForeignSlots !== true && KNOWN_AUDIO_REF_SLOTS.has(refSlot2))
      return { ...args4, refSlot: refSlot2 };
    const refSlot3 = refSlot.find((item15) => !map3.has(item15)) || '';
    if (!refSlot3) return { ...args4, refSlot: refSlot.includes(refSlot2) ? refSlot2 : '' };
    return (map3.add(refSlot3), { ...args4, refSlot: refSlot3 });
  });
}
function buildNodeInfoList(value8, value9, enabled5) {
  const value10 = value8?.mapping || {},
    value11 = String(value10?.preset || '').trim();
  if (value11 === 'rh-audio-indextts2-clone') {
    const list14 = normalizeAudioItemsBySlotOrder(value9, ['audioRef', 'audio2'], {
        remapKnownForeignSlots: false,
      }),
      map4 = new Map(list14.map((item16) => [String(item16.refSlot || ''), item16])),
      response = map4.get('audioRef') || null,
      response2 = map4.get('audio2') || null;
    if (!response?.url) throw new Error('indextts2音色克隆需要参考音色');
    const enabled6 = !!response2?.url;
    if (!enabled6 && !enabled5) throw new Error('indextts2音色克隆需要提示词内容');
    const mappingNode = getMappingNode(value10, 'refAudioNode', '参考音色'),
      mappingNode2 = getMappingNode(value10, 'audio2Node', '音频2'),
      mappingNode3 = getMappingNode(value10, 'promptNode', '提示词'),
      mappingNode4 = getMappingNode(value10, 'indexNode', '模型选择'),
      list15 = [createNodeInfo(mappingNode, response.url, '克隆声音')];
    enabled6 && list15.push(createNodeInfo(mappingNode2, response2.url, '音频2'));
    const value12 = enabled6 ? (enabled5 ? '1' : '2') : '0';
    return (
      list15.push(
        createNodeInfo(mappingNode3, enabled5, '提示词'),
        createNodeInfo(mappingNode4, value12, '模型选择'),
      ),
      list15
    );
  }
  if (value11 === 'rh-audio-voice-convert') {
    const list16 = normalizeAudioItemsBySlotOrder(value9, ['audioRef', 'audioTarget']),
      map5 = new Map(list16.map((item17) => [String(item17.refSlot || ''), item17])),
      response3 = map5.get('audioRef') || null,
      response4 = map5.get('audioTarget') || null;
    if (!response3?.url || !response4?.url) throw new Error('音色转换需要参考音色和目标音色');
    const mappingNode5 = getMappingNode(value10, 'refAudioNode', '参考音色'),
      mappingNode6 = getMappingNode(value10, 'targetAudioNode', '目标音色');
    return [createNodeInfo(mappingNode5, response3.url), createNodeInfo(mappingNode6, response4.url)];
  }
  if (value11 === 'rh-audio-advanced-voice-clone') {
    const list17 = normalizeAudioItemsBySlotOrder(value9, ['audio1', 'audio2']),
      map6 = new Map(list17.map((item18) => [String(item18.refSlot || ''), item18])),
      response5 = map6.get('audio1') || null,
      response6 = map6.get('audio2') || null;
    if (!enabled5) throw new Error('进阶声音克隆需要提示词内容');
    const mappingNode7 = getMappingNode(value10, 'audio1Node', '音频1'),
      mappingNode8 = getMappingNode(value10, 'audio2Node', '音频2'),
      mappingNode9 = getMappingNode(value10, 'promptNode', '提示词'),
      mappingNode10 = getMappingNode(value10, 'indexNode', '音频数量'),
      list18 = [];
    return (
      response5?.url && list18.push(createNodeInfo(mappingNode7, response5.url, 'audio')),
      response6?.url && list18.push(createNodeInfo(mappingNode8, response6.url, 'audio')),
      list18.push(
        createNodeInfo(mappingNode9, normalizeAdvancedVoiceClonePrompt(enabled5), 'prompt'),
        createNodeInfo(
          mappingNode10,
          String([response5?.url, response6?.url].filter(Boolean).length),
          'index',
        ),
      ),
      list18
    );
  }
  throw new Error('未选择可用的音频工作流');
}
export async function buildGenerateAudioRequest(value13) {
  await ensureConfig();
  const provider = String(value13?.provider || 'runninghubwf').trim(),
    audioWorkflowKey = String(value13?.audioWorkflowKey || '').trim(),
    executionId = resolveModelExecution(audioWorkflowKey),
    enabled7 = String(executionId?.executionManifest?.appId || '').trim();
  if (!executionId || !enabled7) throw new Error('未选择可用的音频工作流');
  const providerConfig = getProviderConfig('runninghubwf'),
    apiKey2 = String(value13?.apiKey || providerConfig?.apiKey || '').trim();
  if (!apiKey2) throw new Error('RunningHub API Key 未配置');
  const textInputs = normalizeTextList(value13?.textInputs),
    value14 = String(value13?.prompt || '').trim(),
    prompt = value14 || textInputs.join('\n').trim(),
    instanceType = normalizeRhInstanceType(value13?.rhInstanceType),
    audioRefs = normalizeRefList(value13?.audioRefs),
    videoRefs = normalizeRefList(value13?.videoRefs),
    processInputAudiosPreserveOrder2 = await processInputAudiosPreserveOrder(
      audioRefs.map((response7) => response7.url),
      apiKey2,
    ),
    value15 = audioRefs
      .map((args5, value16) => ({
        ...args5,
        url: String(processInputAudiosPreserveOrder2[value16] || '').trim(),
      }))
      .filter((response8) => !!response8.url),
    nodeInfoList = buildNodeInfoList(executionId.executionManifest, value15, prompt),
    installId = String(value13?.installId || '').trim();
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json', ...(installId ? { 'X-AIC-Install-Id': installId } : {}) },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + enabled7,
      apiKey: apiKey2,
      nodeInfoList: nodeInfoList,
      instanceType: instanceType,
      usePersonalQueue: 'false',
    },
    meta: {
      provider: provider,
      audioWorkflowKey: audioWorkflowKey,
      audioWorkflowLabel: String(value13?.audioWorkflowLabel || '').trim(),
      model:
        audioWorkflowKey === RH_AUDIO_ADVANCED_VOICE_CLONE_MODEL_ID
          ? executionId.modelManifest.modelId
          : audioWorkflowKey,
      executionId: executionId.executionManifest.id,
      nodeId: String(value13?.nodeId || '').trim(),
      installId: installId,
      rhInstanceType: instanceType,
      prompt: prompt,
      textInputs: textInputs,
      audioRefs: audioRefs,
      videoRefs: videoRefs,
    },
  };
}
export async function buildAudioSeparationRequest(response9 = {}) {
  await ensureConfig();
  const model = RH_AUDIO_SEPARATION_MODEL_ID,
    executionId2 = getAudioSeparationExecutionManifest(),
    enabled8 = String(executionId2?.appId || '').trim(),
    nodeId4 = executionId2?.mapping?.sourceAudioNode;
  if (!enabled8 || !nodeId4?.nodeId || !nodeId4?.fieldName)
    throw new Error('RunningHub audio workflow manifest missing: ' + model);
  const providerConfig2 = getProviderConfig('runninghubwf'),
    apiKey3 = String(response9?.apiKey || providerConfig2?.apiKey || '').trim();
  if (!apiKey3) throw new Error('RunningHub API Key 未配置');
  const sourceAudioUrl = String(response9?.audioUrl || response9?.src || response9?.url || '').trim();
  if (!sourceAudioUrl) throw new Error('人声分离需要可用音频');
  const processInputAudiosPreserveOrder3 = await processInputAudiosPreserveOrder([sourceAudioUrl], apiKey3),
    fieldValue2 = String(processInputAudiosPreserveOrder3?.[0] || '').trim();
  if (!fieldValue2) throw new Error('人声分离音频上传失败');
  const instanceType2 = normalizeRhInstanceType(response9?.rhInstanceType);
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/run/ai-app/' + enabled8,
      apiKey: apiKey3,
      nodeInfoList: [
        {
          nodeId: nodeId4.nodeId,
          fieldName: nodeId4.fieldName,
          fieldValue: fieldValue2,
          description: 'audio',
        },
      ],
      instanceType: instanceType2,
      usePersonalQueue: 'false',
    },
    meta: {
      provider: 'runninghubwf',
      model: model,
      executionId: executionId2.id,
      adapterTrace: { source: 'manifest', executionId: executionId2.id, modelId: model },
      nodeId: String(response9?.nodeId || '').trim(),
      rhInstanceType: instanceType2,
      sourceAudioUrl: sourceAudioUrl,
      uploadedAudioUrl: fieldValue2,
    },
  };
}
async function pollRunningHubAudioTask(taskId2, apiKey4, signal = {}) {
  if (signal?.signal?.aborted) throw new Error('CANCELLED');
  for (let value17 = 0; value17 < POLL_MAX_COUNT; value17++) {
    if (signal?.signal?.aborted) throw new Error('CANCELLED');
    await sleep(POLL_INTERVAL_MS);
    if (signal?.signal?.aborted) throw new Error('CANCELLED');
    const requester2 = await requester({
        url: '/api/v2/proxy/image',
        method: 'POST',
        provider: 'runninghubwf',
        timeout: 0x7530,
        signal: signal?.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiUrl: 'https://www.runninghub.cn/openapi/v2/query',
          apiKey: apiKey4,
          taskId: taskId2,
        }),
        responseType: 'auto',
      }),
      responseData = parseResponseData(requester2),
      count = Number(responseData?.code);
    if (Number.isFinite(count)) {
      if (count === 0x324 || count === 0x32d) continue;
      if (count !== 0) throw new Error(getApiErrorMessage(responseData, '音频任务轮询失败'));
    }
    const response10 =
        responseData?.data && typeof responseData.data === 'object' ? responseData.data : responseData,
      value18 = String(response10?.status || '').toUpperCase();
    if (['COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(value18)) {
      if (extractAudioUrls(response10).length === 0) continue;
      return response10;
    }
    if (['FAILED', 'FAIL', 'ERROR', 'CANCELLED'].includes(value18))
      throw new Error(getApiErrorMessage(response10, '音频任务执行失败'));
  }
  throw new Error('音频任务超时，请稍后重试');
}
export async function resumeAudioSeparationTask(value19, value20 = {}, value21 = {}) {
  await ensureConfig();
  const providerConfig3 = getProviderConfig('runninghubwf'),
    enabled9 = String(value20?.apiKey || providerConfig3?.apiKey || '').trim();
  if (!enabled9) throw new Error('RunningHub API Key 未配置');
  const taskId3 = String(value19 || '').trim();
  if (!taskId3) throw new Error('缺少 RunningHub 音频任务ID');
  return runTaskSingleFlight(
    { provider: 'runninghubwf', kind: 'audio-separation', taskId: taskId3 },
    async () => {
      const pollRunningHubAudioTask2 = await pollRunningHubAudioTask(taskId3, enabled9, value21);
      return {
        taskId: taskId3,
        ...normalizeAudioSeparationTaskResult(
          extractAudioResultEntries(pollRunningHubAudioTask2),
          '任务已完成，但未提取到人声和背景声音频地址',
        ),
      };
    },
  );
}
export async function resumeRunningHubAudioTask(value22, value23 = {}, value24 = {}) {
  await ensureConfig();
  const providerConfig4 = getProviderConfig('runninghubwf'),
    enabled10 = String(value23?.apiKey || providerConfig4?.apiKey || '').trim();
  if (!enabled10) throw new Error('RunningHub API Key 未配置');
  const taskId4 = String(value22 || '').trim();
  if (!taskId4) throw new Error('缺少 RunningHub 音频任务ID');
  return runTaskSingleFlight({ provider: 'runninghubwf', kind: 'audio', taskId: taskId4 }, async () => {
    const pollRunningHubAudioTask3 = await pollRunningHubAudioTask(taskId4, enabled10, value24);
    return {
      taskId: taskId4,
      ...normalizeAudioTaskResult(
        extractAudioUrls(pollRunningHubAudioTask3),
        '任务已完成，但未提取到音频地址',
      ),
    };
  });
}
export async function runAudioSeparation(options2 = {}, signal2 = {}) {
  const url2 = await buildAudioSeparationRequest(options2),
    requester3 = await requester({
      url: url2.url,
      method: 'POST',
      provider: 'runninghubwf',
      timeout: 0x1d4c0,
      signal: signal2?.signal,
      headers: url2.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(url2.body),
      responseType: 'auto',
    }),
    responseData2 = parseResponseData(requester3),
    count2 = Number(responseData2?.code);
  if (Number.isFinite(count2) && count2 !== 0)
    throw new Error(getApiErrorMessage(responseData2, '音频任务创建失败'));
  const taskId5 = getTaskId(responseData2);
  if (!taskId5)
    return normalizeAudioSeparationTaskResult(
      extractAudioResultEntries(responseData2),
      '音频任务创建成功但未返回人声和背景声音频地址',
    );
  (signal2?.onTaskMeta?.({
    taskId: String(taskId5),
    useOpenapiQuery: true,
    apiKey: String(url2?.body?.apiKey || '').trim(),
  }),
    signal2?.onTaskId?.(String(taskId5)));
  const pollRunningHubAudioTask4 = await pollRunningHubAudioTask(taskId5, url2.body.apiKey, signal2);
  return {
    taskId: taskId5,
    ...normalizeAudioSeparationTaskResult(
      extractAudioResultEntries(pollRunningHubAudioTask4),
      '任务已完成，但未提取到人声和背景声音频地址',
    ),
  };
}
export async function generateAudio(value25, signal3 = {}) {
  const url3 = await buildGenerateAudioRequest(value25),
    requester4 = await requester({
      url: url3.url,
      method: 'POST',
      provider: 'runninghubwf',
      timeout: 0x1d4c0,
      signal: signal3?.signal,
      headers: url3.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(url3.body),
      responseType: 'auto',
    }),
    error2 = parseResponseData(requester4);
  if (String(error2?.code || '') === 'SUBSCRIPTION_REQUIRED') {
    const error3 = new Error(error2?.message || '该模型为 VIP，请先激活 CDKEY/订阅');
    ((error3.code = 'SUBSCRIPTION_REQUIRED'),
      (error3.contactText = error2?.contactText || ''),
      (error3.contactUrl = error2?.contactUrl || ''),
      (error3.requiredModelId = String(error2?.requiredModelId || '').trim()),
      (error3.subscriptionStatus = String(error2?.subscriptionStatus || '').trim()),
      (error3.reasonCode = String(error2?.reasonCode || '').trim()));
    throw error3;
  }
  const count3 = Number(error2?.code);
  if (Number.isFinite(count3) && count3 !== 0)
    throw new Error(getApiErrorMessage(error2, '音频任务创建失败'));
  const taskId6 = getTaskId(error2);
  if (!taskId6) return normalizeAudioTaskResult(extractAudioUrls(error2), '音频任务创建成功但未返回 taskId');
  (signal3?.onTaskMeta?.({
    taskId: String(taskId6),
    useOpenapiQuery: true,
    apiKey: String(url3?.body?.apiKey || '').trim(),
  }),
    signal3?.onTaskId?.(String(taskId6)));
  const pollRunningHubAudioTask5 = await pollRunningHubAudioTask(taskId6, url3.body.apiKey, signal3);
  return {
    taskId: taskId6,
    ...normalizeAudioTaskResult(extractAudioUrls(pollRunningHubAudioTask5), '任务已完成，但未提取到音频地址'),
  };
}

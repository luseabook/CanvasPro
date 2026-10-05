import { resolveModelExecution } from '../../src/manifests/index.js';
import {
  buildComfyUiPromptFromManifest,
  getComfyUiPayloadPathValue,
} from './ComfyUiWorkflowMappingAdapter.js';
export const DEFAULT_COMFYUI_BASE_URL = 'http://127.0.0.1:8188';
const COMFYUI_BATCH_SEED_MODULO = 0x100000000,
  CUSTOM_WORKFLOW_MEDIA_INPUT_SOURCES = new Set(['imageInput', 'videoInput', 'audioInput']);
function normalizeText(value, item = '') {
  const key = String(value ?? '')['trim']();
  return key || item;
}
export function normalizeComfyUiBaseUrl(index) {
  const text = normalizeText(index, DEFAULT_COMFYUI_BASE_URL),
    result = /^[a-z][a-z0-9+.-]*:\/\//i['test'](text);
  try {
    const uRL = new URL(result ? text : 'http://' + text);
    return ((uRL['search'] = ''), (uRL['hash'] = ''), uRL['toString']()['replace'](/\/+$/, ''));
  } catch {
    const enabled2 = text['replace'](/[?#].*$/, '')['replace'](/\/+$/, '');
    if (!enabled2) return DEFAULT_COMFYUI_BASE_URL;
    return result ? enabled2 : 'http://' + enabled2;
  }
}
function normalizeBaseUrl(data) {
  return normalizeComfyUiBaseUrl(data);
}
function isPrivateIpv4(options) {
  const list = String(options || '')
    ['split']('.')
    ['map']((target) => Number(target));
  if (list['length'] !== 4 || list['some']((source) => !Number['isInteger'](source))) return false;
  const [count, count2] = list;
  return (
    count === 10 ||
    count === 0x7f ||
    (count === 172 && count2 >= 16 && count2 <= 0x1f) ||
    (count === 192 && count2 === 168) ||
    (count === 169 && count2 === 254)
  );
}
export function shouldAllowCloudComfyUiBaseUrl(next) {
  try {
    const uRL2 = new URL(normalizeBaseUrl(next)),
      enabled3 = uRL2['hostname']['replace'](/^\[|\]$/g, '')['toLowerCase']();
    if (!enabled3 || enabled3 === 'localhost' || enabled3['endsWith']('.localhost')) return false;
    if (isPrivateIpv4(enabled3)) return false;
    if (enabled3 === '::1' || enabled3['startsWith']('fc') || enabled3['startsWith']('fd')) return false;
    return true;
  } catch {
    return false;
  }
}
function createClientId() {
  return 'aic_' + Date['now']() + '_' + Math['random']()['toString'](36)['slice'](2, 10);
}
function normalizeInteger(current) {
  const entry = String(current ?? '')['trim']();
  if (!/^-?\d+$/['test'](entry)) return null;
  const record = Number(entry);
  if (!Number['isFinite'](record)) return null;
  return Math['trunc'](record);
}
function isComfyUiSeedInputName(payload) {
  const handle = String(payload || '')
    ['trim']()
    ['toLowerCase']();
  return handle === 'seed' || handle['endsWith']('_seed');
}
function getComfyUiBatchSeedContext(options2 = {}) {
  const count3 = Number['parseInt'](options2?.['__aicBatchSize'], 10),
    batchIndex = Number['parseInt'](options2?.['__aicBatchIndex'], 10);
  if (!Number['isFinite'](count3) || count3 <= 1) return null;
  if (!Number['isFinite'](batchIndex) || batchIndex < 0) return null;
  const nonce = normalizeInteger(options2?.['__aicBatchSeedNonce']) || 0;
  return { batchIndex: batchIndex, nonce: nonce };
}
function buildComfyUiBatchSeedValue(state, config) {
  const integer = normalizeInteger(state);
  if (integer === null) return state;
  const scope = config['nonce'] + config['batchIndex'],
    input =
      (((integer + scope) % COMFYUI_BATCH_SEED_MODULO) + COMFYUI_BATCH_SEED_MODULO) %
      COMFYUI_BATCH_SEED_MODULO;
  return typeof state === 'string' ? String(input) : input;
}
function createComfyUiMappedSeedKey(output, value2) {
  return (
    String(output || '')['trim']() +
    '::' +
    String(value2 || '')
      ['trim']()
      ['toLowerCase']()
  );
}
function getUserMappedComfyUiSeedInputs(options3 = {}) {
  const list2 = Array['isArray'](options3?.['inputs']) ? options3['inputs'] : [],
    value3 = new Set();
  return (
    list2['forEach']((value4) => {
      const value5 = String(value4?.['source'] || 'param')['trim'](),
        value6 = String(value4?.['inputName'] || value4?.['fieldName'] || '')['trim']();
      if (value5 !== 'param' || !isComfyUiSeedInputName(value6)) return;
      value3['add'](createComfyUiMappedSeedKey(value4?.['nodeId'], value6));
    }),
    value3
  );
}
function isCustomComfyUiWorkflowExecution(value7, value8) {
  return Boolean(value7?.['extensions']?.['comfyUiWorkflow'] || value8?.['extensions']?.['comfyui']);
}
function relaxCustomWorkflowMediaInputMappings(args = null, { enabled: enabled = false } = {}) {
  if (!enabled || !args || typeof args !== 'object' || Array['isArray'](args)) return args;
  const inputs = Array['isArray'](args['inputs'])
    ? args['inputs']['map']((args2) =>
        CUSTOM_WORKFLOW_MEDIA_INPUT_SOURCES['has'](String(args2?.['source'] || '')['trim']())
          ? { ...args2, required: false }
          : args2,
      )
    : args['inputs'];
  return { ...args, inputs: inputs };
}
function applyComfyUiBatchSeedOffset(value9, value10 = {}, value11 = {}) {
  const comfyUiBatchSeedContext = getComfyUiBatchSeedContext(value10);
  if (!comfyUiBatchSeedContext) return value9;
  const map = getUserMappedComfyUiSeedInputs(value11);
  return (
    Object['entries'](value9 || {})['forEach'](([value12, value13]) => {
      const enabled4 = value13?.['inputs'];
      if (!enabled4 || typeof enabled4 !== 'object' || Array['isArray'](enabled4)) return;
      Object['entries'](enabled4)['forEach'](([value14, value15]) => {
        if (!isComfyUiSeedInputName(value14)) return;
        if (map['has'](createComfyUiMappedSeedKey(value12, value14))) return;
        if (Array['isArray'](value15)) return;
        enabled4[value14] = buildComfyUiBatchSeedValue(value15, comfyUiBatchSeedContext);
      });
    }),
    value9
  );
}
function getProviderConfig(value16) {
  if (typeof value16?.['getProviderConfig'] !== 'function') return {};
  return value16['getProviderConfig']('comfyui') || {};
}
function normalizeBaseUrlMode(value17) {
  const value18 = String(value17?.['extensions']?.['comfyui']?.['baseUrlMode'] || '')
    ['trim']()
    ['toLowerCase']();
  return value18 === 'cloud' ? 'cloud' : 'local';
}
function resolveComfyUiBaseUrl(value19, value20, value21) {
  const providerConfig = getProviderConfig(value21),
    value22 =
      value19?.['comfyuiBaseUrl'] ||
      value19?.['baseUrl'] ||
      value20?.['extensions']?.['comfyui']?.['baseUrl'] ||
      value20?.['extensions']?.['comfyui']?.['defaultBaseUrl'];
  if (value22) return normalizeBaseUrl(value22);
  if (normalizeBaseUrlMode(value20) === 'cloud') {
    const value23 = providerConfig['cloudApiUrl'] || providerConfig['cloudBaseUrl'] || '';
    if (!normalizeText(value23)) throw new Error('ComfyUI 云端地址未配置，请先在设置里填写云端 ComfyUI 地址');
    return normalizeBaseUrl(value23);
  }
  return normalizeBaseUrl(providerConfig['apiUrl'] || providerConfig['baseUrl'] || DEFAULT_COMFYUI_BASE_URL);
}
function resolvePayloadValue(value24, value25 = [], value26 = undefined, value27 = false) {
  const list3 = Array['isArray'](value25) ? value25 : [value25];
  for (const value28 of list3['filter'](Boolean)) {
    const comfyUiPayloadPathValue = getComfyUiPayloadPathValue(value24, value28);
    if (value27 && comfyUiPayloadPathValue !== undefined && comfyUiPayloadPathValue !== null)
      return comfyUiPayloadPathValue;
    if (
      comfyUiPayloadPathValue !== undefined &&
      comfyUiPayloadPathValue !== null &&
      String(comfyUiPayloadPathValue)['trim']() !== ''
    )
      return comfyUiPayloadPathValue;
  }
  return value26;
}
function getGenerationParamFallbackFields(list4 = []) {
  return list4['filter']((value29) => value29 && !String(value29)['startsWith']('generationParams.'))['map'](
    (value30) => 'generationParams.' + value30,
  );
}
function isComfyUiMediaUiInputName(value31) {
  const value32 = String(value31 || '')
    ['trim']()
    ['toLowerCase']();
  return value32 === 'imageui' || value32 === 'videoui' || value32 === 'audioui';
}
function normalizeComfyUiSlotKey(value33) {
  return String(value33 ?? '')['trim']();
}
function getComfyUiMediaInputSlotCandidates(options4 = {}) {
  const list5 = [
    options4?.['field'],
    options4?.['slot'],
    options4?.['urlField'],
    options4?.['inputName'],
    options4?.['fieldName'],
  ];
  return Array['from'](new Set(list5['map'](normalizeComfyUiSlotKey)['filter'](Boolean)));
}
function getComfyUiMediaRefUrl(el, value34 = 'image') {
  if (typeof el === 'string') return normalizeText(el);
  if (!el || typeof el !== 'object' || Array['isArray'](el)) return '';
  const value35 = String(value34 || 'image')
      ['trim']()
      ['toLowerCase'](),
    value36 =
      value35 === 'audio'
        ? el['audioUrl'] || el['audio']
        : value35 === 'video'
          ? el['videoUrl'] || el['video']
          : el['imageUrl'] || el['image'];
  return normalizeText(el['url'] || el['sourceUrl'] || el['src'] || el['value'] || value36);
}
function getComfyUiMediaRefSlot(error) {
  if (!error || typeof error !== 'object' || Array['isArray'](error)) return '';
  return normalizeComfyUiSlotKey(
    error['refSlot'] || error['slot'] || error['field'] || error['id'] || error['name'],
  );
}
function resolveComfyUiMediaValueFromRefs(options5 = {}, value37 = {}, value38 = 'image') {
  const comfyUiMediaInputSlotCandidates = getComfyUiMediaInputSlotCandidates(value37),
    map2 = new Set(comfyUiMediaInputSlotCandidates),
    value39 =
      options5?.['inputUrlsBySlot'] &&
      typeof options5['inputUrlsBySlot'] === 'object' &&
      !Array['isArray'](options5['inputUrlsBySlot'])
        ? options5['inputUrlsBySlot']
        : {};
  for (const value40 of comfyUiMediaInputSlotCandidates) {
    const text2 = normalizeText(value39[value40]);
    if (text2) return text2;
  }
  const value41 = String(value38 || 'image')
      ['trim']()
      ['toLowerCase'](),
    value42 = [
      options5?.[value41 + 'Refs'],
      options5?.[value41 + 's'],
      options5?.['mediaRefs'],
      options5?.['inputRefs'],
      options5?.['assetInputRefs'],
      options5?.['providerAssetRefs'],
    ]['filter'](Array['isArray']);
  for (const value43 of value42) {
    for (const value44 of value43) {
      const comfyUiMediaRefSlot = getComfyUiMediaRefSlot(value44);
      if (!map2['has'](comfyUiMediaRefSlot)) continue;
      const comfyUiMediaRefUrl = getComfyUiMediaRefUrl(value44, value41);
      if (comfyUiMediaRefUrl) return comfyUiMediaRefUrl;
    }
  }
  const value45 = Math['max'](0, Number(value37?.['inputIndex']) || 0);
  for (const value46 of value42) {
    const comfyUiMediaRefUrl2 = getComfyUiMediaRefUrl(value46[value45], value41);
    if (comfyUiMediaRefUrl2) return comfyUiMediaRefUrl2;
  }
  if (Array['isArray'](options5?.['inputUrls'])) return normalizeText(options5['inputUrls'][value45]);
  return '';
}
function omitComfyUiMediaUiInputMappings(enabled5 = {}) {
  if (!enabled5 || typeof enabled5 !== 'object' || Array['isArray'](enabled5)) return enabled5;
  let args3 = enabled5;
  if (Array['isArray'](enabled5['inputs'])) {
    const inputs2 = enabled5['inputs']['filter'](
      (value47) => !isComfyUiMediaUiInputName(value47?.['inputName'] || value47?.['fieldName']),
    );
    if (inputs2['length'] !== enabled5['inputs']['length']) args3 = { ...args3, inputs: inputs2 };
  }
  if (Array['isArray'](enabled5['nodeInputs'])) {
    const nodeInputs = enabled5['nodeInputs']['filter'](
      (value48) => !isComfyUiMediaUiInputName(value48?.['inputName'] || value48?.['fieldName']),
    );
    nodeInputs['length'] !== enabled5['nodeInputs']['length'] &&
      (args3 = { ...args3, nodeInputs: nodeInputs });
  }
  return args3;
}
async function resolveComfyUiMediaInput(payload2, item2, kind, value49, baseUrl2) {
  if (isComfyUiMediaUiInputName(item2?.['inputName'] || item2?.['fieldName'])) return '';
  const value50 = String(item2?.['field'] || item2?.['slot'] || item2?.['urlField'] || '')['trim'](),
    args4 = [value50, ...(Array['isArray'](item2?.['fields']) ? item2['fields'] : [])]['filter'](Boolean),
    value51 = [...args4, ...getGenerationParamFallbackFields(args4)];
  let payloadValue = resolvePayloadValue(payload2, value51, undefined, item2?.['allowEmpty'] === true);
  if (
    (payloadValue === undefined || payloadValue === null || String(payloadValue)['trim']() === '') &&
    Array['isArray'](payload2?.['inputUrls']) &&
    kind === 'image'
  ) {
    const value52 = Math['max'](0, Number(item2?.['inputIndex']) || 0);
    payloadValue = payload2['inputUrls'][value52];
  }
  (payloadValue === undefined || payloadValue === null || String(payloadValue)['trim']() === '') &&
    (payloadValue = resolveComfyUiMediaValueFromRefs(payload2, item2, kind));
  if (payloadValue === undefined || payloadValue === null || String(payloadValue)['trim']() === '') {
    if (item2?.['required']) throw new Error(item2['missingMessage'] || 'Missing ComfyUI ' + kind + ' input');
    return '';
  }
  if (typeof value49?.['uploadInputToComfyUi'] === 'function')
    return value49['uploadInputToComfyUi'](payloadValue, {
      baseUrl: baseUrl2,
      kind: kind,
      item: item2,
      payload: payload2,
    });
  return String(payloadValue || '')['trim']();
}
function normalizeComfyUiOutputType(value53, value54 = '') {
  const list6 = String(value53 || value54 || '')
    ['trim']()
    ['toLowerCase']();
  if (list6['includes']('video') || list6 === 'gifs' || list6 === 'gif') return 'video';
  if (list6['includes']('audio')) return 'audio';
  return 'image';
}
function normalizeComfyUiFileItem(error2, value55, value56) {
  if (!error2 || typeof error2 !== 'object' || Array['isArray'](error2)) return null;
  const filename = normalizeText(error2['filename'] || error2['name'] || error2['file']);
  if (!filename) return null;
  return {
    nodeId: String(value56 || ''),
    filename: filename,
    subfolder: normalizeText(error2['subfolder']),
    type: normalizeText(error2['type'], 'output'),
    mediaType: normalizeComfyUiOutputType(value55),
    format: normalizeText(error2['format']),
  };
}
function getComfyUiHistorySnapshot(enabled6) {
  if (!enabled6 || typeof enabled6 !== 'object' || Array['isArray'](enabled6)) return null;
  if (enabled6['outputs'] && typeof enabled6['outputs'] === 'object') return enabled6;
  const value57 = Object['values'](enabled6)['find'](
    (value58) => value58 && typeof value58 === 'object' && value58['outputs'],
  );
  return value57 || null;
}
function getComfyUiNodeErrors(enabled7) {
  if (!enabled7 || typeof enabled7 !== 'object' || Array['isArray'](enabled7)) return null;
  if (
    enabled7['node_errors'] &&
    typeof enabled7['node_errors'] === 'object' &&
    Object['keys'](enabled7['node_errors'])['length'] > 0
  )
    return enabled7['node_errors'];
  if (
    enabled7['nodeErrors'] &&
    typeof enabled7['nodeErrors'] === 'object' &&
    Object['keys'](enabled7['nodeErrors'])['length'] > 0
  )
    return enabled7['nodeErrors'];
  if (
    enabled7['error']?.['node_errors'] &&
    typeof enabled7['error']['node_errors'] === 'object' &&
    Object['keys'](enabled7['error']['node_errors'])['length'] > 0
  )
    return enabled7['error']['node_errors'];
  if (
    enabled7['error']?.['nodeErrors'] &&
    typeof enabled7['error']['nodeErrors'] === 'object' &&
    Object['keys'](enabled7['error']['nodeErrors'])['length'] > 0
  )
    return enabled7['error']['nodeErrors'];
  return null;
}
function normalizeComfyUiStatusText(error3) {
  if (error3 && typeof error3 === 'object' && !Array['isArray'](error3))
    return normalizeText(
      error3['status_str'] ||
        error3['status'] ||
        error3['state'] ||
        error3['phase'] ||
        error3['message'] ||
        error3['type'],
    )['toLowerCase']();
  return normalizeText(error3)['toLowerCase']();
}
function isComfyUiFailureStatus(value59) {
  const comfyUiStatusText = normalizeComfyUiStatusText(value59);
  return /failed|failure|error|exception|cancelled|canceled/['test'](comfyUiStatusText);
}
function hasComfyUiErrorShape(response) {
  if (!response || typeof response !== 'object' || Array['isArray'](response)) return false;
  return Boolean(
    response['error'] || getComfyUiNodeErrors(response) || isComfyUiFailureStatus(response['status']),
  );
}
function getComfyUiHistoryErrorSnapshot(enabled8) {
  if (!enabled8 || typeof enabled8 !== 'object' || Array['isArray'](enabled8)) return null;
  if (hasComfyUiErrorShape(enabled8)) return enabled8;
  return (
    Object['values'](enabled8)['find'](
      (value60) =>
        value60 && typeof value60 === 'object' && !Array['isArray'](value60) && hasComfyUiErrorShape(value60),
    ) || null
  );
}
function getComfyUiFailureMessage(error4) {
  const error5 = error4?.['status'];
  return normalizeText(
    error4?.['error']?.['message'] ||
      error4?.['errorMessage'] ||
      error4?.['error_message'] ||
      error4?.['message'] ||
      error5?.['message'] ||
      error5?.['status_str'] ||
      error4?.['error']?.['type'] ||
      'ComfyUI task failed',
  );
}
export function buildComfyUiViewUrl(value61, value62, value63 = {}) {
  const baseUrl3 = normalizeBaseUrl(value61),
    value64 = value63['allowCloudBaseUrl'] ?? shouldAllowCloudComfyUiBaseUrl(baseUrl3),
    map3 = new URLSearchParams();
  (map3['set']('baseUrl', baseUrl3),
    map3['set']('filename', value62['filename']),
    map3['set']('type', value62['type'] || 'output'));
  if (value62['subfolder']) map3['set']('subfolder', value62['subfolder']);
  if (value64) map3['set']('allowCloudBaseUrl', '1');
  return '/api/v2/comfyui/view?' + map3['toString']();
}
export function collectComfyUiOutputFiles(value65, value66 = {}) {
  const comfyUiHistorySnapshot = getComfyUiHistorySnapshot(value65),
    enabled9 = comfyUiHistorySnapshot?.['outputs'];
  if (!enabled9 || typeof enabled9 !== 'object' || Array['isArray'](enabled9)) return [];
  const map4 = new Set(
      Array['isArray'](value66['outputNodes'])
        ? value66['outputNodes']['map']((value67) => String(value67))
        : [],
    ),
    list7 = [];
  return (
    Object['entries'](enabled9)['forEach'](([value68, enabled10]) => {
      if (map4['size'] > 0 && !map4['has'](String(value68))) return;
      if (!enabled10 || typeof enabled10 !== 'object' || Array['isArray'](enabled10)) return;
      Object['entries'](enabled10)['forEach'](([value69, value70]) => {
        const list8 = Array['isArray'](value70) ? value70 : [];
        list8['forEach']((value71) => {
          const comfyUiFileItem = normalizeComfyUiFileItem(value71, value69, value68);
          if (comfyUiFileItem) list7['push'](comfyUiFileItem);
        });
      });
    }),
    list7
  );
}
export function normalizeComfyUiHistoryResult(
  value72,
  {
    baseUrl: baseUrl = DEFAULT_COMFYUI_BASE_URL,
    resultConfig: resultConfig = {},
    allowCloudBaseUrl: allowCloudBaseUrl = undefined,
  } = {},
) {
  const list9 = collectComfyUiOutputFiles(value72, resultConfig);
  if (list9['length'] === 0) {
    const error6 = getComfyUiHistoryErrorSnapshot(value72);
    if (error6) {
      const node_errors = getComfyUiNodeErrors(error6),
        message = getComfyUiFailureMessage(error6);
      return {
        status: 'FAILED',
        error: error6['error'] || message,
        message: message,
        ...(node_errors ? { node_errors: node_errors, nodeErrors: node_errors } : {}),
        raw: error6,
        images: [],
        videos: [],
        audios: [],
        results: [],
      };
    }
    return { status: 'RUNNING', images: [], videos: [], audios: [], results: [] };
  }
  const results = list9['map']((args5) => ({
      ...args5,
      url: buildComfyUiViewUrl(baseUrl, args5, { allowCloudBaseUrl: allowCloudBaseUrl }),
    })),
    images = results['filter']((value73) => value73['mediaType'] === 'image'),
    videos = results['filter']((value74) => value74['mediaType'] === 'video'),
    audios = results['filter']((value75) => value75['mediaType'] === 'audio');
  return {
    status: 'COMPLETED',
    images: images,
    image_urls: images['map']((response2) => response2['url']),
    videos: videos,
    video_urls: videos['map']((response3) => response3['url']),
    audios: audios,
    audio_urls: audios['map']((response4) => response4['url']),
    results: results['map']((url) => ({
      url: url['url'],
      imageUrl: url['mediaType'] === 'image' ? url['url'] : undefined,
      videoUrl: url['mediaType'] === 'video' ? url['url'] : undefined,
      audioUrl: url['mediaType'] === 'audio' ? url['url'] : undefined,
      nodeId: url['nodeId'],
      filename: url['filename'],
      type: url['mediaType'],
    })),
  };
}
async function buildComfyUiWorkflowRequest({
  payload: payload3,
  finalPrompt: finalPrompt,
  ctx: ctx,
  expectedKind: expectedKind,
}) {
  const modelExecution = resolveModelExecution(payload3?.['model'], { providerHint: 'comfyui' }),
    executionId = modelExecution?.['executionManifest'];
  if (!executionId || executionId['provider'] !== 'comfyui' || executionId['adapterType'] !== 'workflow')
    throw new Error('ComfyUI workflow manifest missing: ' + (payload3?.['model'] || ''));
  if (expectedKind && executionId['kind'] !== expectedKind)
    throw new Error('ComfyUI ' + expectedKind + ' workflow manifest missing: ' + (payload3?.['model'] || ''));
  const baseUrl4 = resolveComfyUiBaseUrl(payload3, executionId, ctx),
    allowCloudBaseUrl2 = shouldAllowCloudComfyUiBaseUrl(baseUrl4),
    mapping = omitComfyUiMediaUiInputMappings(
      relaxCustomWorkflowMediaInputMappings(executionId['mapping'], {
        enabled: isCustomComfyUiWorkflowExecution(modelExecution?.['modelManifest'], executionId),
      }),
    ),
    prompt = await buildComfyUiPromptFromManifest({
      mapping: mapping,
      payload: payload3,
      finalPrompt: finalPrompt,
      sourceResolvers: {
        imageInput: ({ item: item3 }) => resolveComfyUiMediaInput(payload3, item3, 'image', ctx, baseUrl4),
        videoInput: ({ item: item4 }) => resolveComfyUiMediaInput(payload3, item4, 'video', ctx, baseUrl4),
        audioInput: ({ item: item5 }) => resolveComfyUiMediaInput(payload3, item5, 'audio', ctx, baseUrl4),
      },
    });
  applyComfyUiBatchSeedOffset(prompt, payload3, mapping);
  const clientId = normalizeText(payload3?.['comfyuiClientId'], createClientId()),
    taskIdPath = executionId['result'] || {};
  return {
    url: '/api/v2/comfyui/prompt',
    headers: { 'Content-Type': 'application/json' },
    body: {
      baseUrl: baseUrl4,
      prompt: prompt,
      clientId: clientId,
      ...(allowCloudBaseUrl2 ? { allowCloudBaseUrl: true } : {}),
    },
    isAsync: true,
    taskIdPath: taskIdPath['taskIdPath'] || 'prompt_id',
    responseMapping: {
      taskIdPath: taskIdPath['taskIdPath'] || 'prompt_id',
      resultPaths: taskIdPath['resultPaths'] || ['images[].url', 'image_urls[]', 'results[].url'],
      statusPath: 'status',
    },
    taskPolling: {
      mode: 'comfyui-history',
      baseUrl: baseUrl4,
      allowCloudBaseUrl: allowCloudBaseUrl2,
      statusPath: 'status',
      resultPaths: taskIdPath['resultPaths'] || ['images[].url', 'image_urls[]', 'results[].url'],
    },
    adapterTrace: {
      source: 'manifest',
      executionId: executionId['id'],
      modelId: payload3['model'],
      provider: 'comfyui',
    },
    resultExtractor: (value76) =>
      normalizeComfyUiHistoryResult(value76, {
        baseUrl: baseUrl4,
        resultConfig: taskIdPath,
        allowCloudBaseUrl: allowCloudBaseUrl2,
      }),
  };
}
export async function buildImageRequest(payload4, finalPrompt2, ctx2 = {}) {
  return buildComfyUiWorkflowRequest({
    payload: payload4,
    finalPrompt: finalPrompt2,
    ctx: ctx2,
    expectedKind: 'image',
  });
}
export async function buildVideoRequest(payload5, finalPrompt3, ctx3 = {}) {
  return buildComfyUiWorkflowRequest({
    payload: payload5,
    finalPrompt: finalPrompt3,
    ctx: ctx3,
    expectedKind: 'video',
  });
}
export async function buildAudioRequest(payload6, finalPrompt4, ctx4 = {}) {
  return buildComfyUiWorkflowRequest({
    payload: payload6,
    finalPrompt: finalPrompt4,
    ctx: ctx4,
    expectedKind: 'audio',
  });
}

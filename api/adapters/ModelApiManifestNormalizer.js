import {
  getRunningHubProviderProfileId,
  remapRunningHubModelApiUrl,
  resolveRunningHubModelApiBaseUrl,
  resolveRunningHubModelApiProfileId,
} from '../../src/modules/runningHubProviderProfiles.js';
import { normalizeModelProviderProfileId } from '../../src/modules/modelProviderProfileSelection.js';
import { parseRatioLabel } from '../imageRatioPolicy.js';
import { normalizeTextStructuredOutput } from './textStructuredOutput.js';
import { resolveModelExecution, sanitizeModelUiSchemaParams } from '../../src/manifests/index.js';
import { isAdaptiveRatioLabel, resolveProviderRatioPayload } from '../imageRatioPolicy.js';
import { ApiError } from '../errors/index.js';
import { buildBodyFromMapping } from './modelApiMappingEngine.js';
import {
  getModelApiBodyResolver,
  getModelApiEndpointResolver,
  normalizeApimartNanoBanana2Resolution,
  normalizeApimartGptImage2Resolution,
} from './modelApiResolvers/index.js';
function normalizeManifestOptionKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function findVideoAspectRatioField(item) {
  return (Array.isArray(item?.uiSchema?.fields) ? item.uiSchema.fields : []).find(
    (item2) => String(item2?.id || '').trim() === 'aspectRatio',
  );
}
function pickFirstConcreteVideoAspectRatio(key) {
  const videoAspectRatioField = findVideoAspectRatioField(key),
    index = Array.isArray(videoAspectRatioField?.options) ? videoAspectRatioField.options : [];
  for (const el of index) {
    const list = String(el?.value ?? el ?? '').trim();
    if (list && list.includes(':') && !isAdaptiveRatioLabel(list)) return list;
  }
  return '';
}
function resolvePayloadAspectRatioInput(options = {}, result = null) {
  const data =
    options?.generationParams &&
    typeof options.generationParams === 'object' &&
    !Array.isArray(options.generationParams)
      ? options.generationParams
      : {};
  if (Object.prototype.hasOwnProperty.call(data, 'aspectRatio')) return data.aspectRatio;
  for (const target of ['aspectRatio', 'aspect_ratio', 'size']) {
    if (Object.prototype.hasOwnProperty.call(options || {}, target)) return options[target];
  }
  return findVideoAspectRatioField(result)?.defaultValue ?? '';
}
function applyVideoAspectRatioExecutionFallback(args = {}, source = null) {
  if (!findVideoAspectRatioField(source)) return args;
  const next = source?.extensions?.ratioPolicy || source?.ratioPolicy || {};
  if (next?.preserveAdaptive === true) return args;
  const payloadAspectRatioInput = resolvePayloadAspectRatioInput(args, source);
  if (!isAdaptiveRatioLabel(payloadAspectRatioInput)) return args;
  const current = String(args?.resolvedRatioLabel || '').trim(),
    aspectRatio =
      current && !isAdaptiveRatioLabel(current) ? current : pickFirstConcreteVideoAspectRatio(source);
  if (!aspectRatio) return args;
  return {
    ...args,
    aspectRatio: aspectRatio,
    resolvedRatioLabel: aspectRatio,
    generationParams: { ...(args.generationParams || {}), aspectRatio: aspectRatio },
  };
}
function mergeRootAspectRatioIntoGenerationParams(options2 = {}, args2 = {}) {
  const entry = args2 && typeof args2 === 'object' && !Array.isArray(args2) ? { ...args2 } : {},
    record =
      options2?.generationParams &&
      typeof options2.generationParams === 'object' &&
      !Array.isArray(options2.generationParams)
        ? options2.generationParams
        : {};
  if (Object.prototype.hasOwnProperty.call(record, 'aspectRatio')) return entry;
  if (String(options2?.resolvedRatioLabel || '').trim()) return entry;
  return (
    Object.prototype.hasOwnProperty.call(options2 || {}, 'aspectRatio') &&
      !isAdaptiveRatioLabel(options2.aspectRatio) &&
      (entry.aspectRatio = options2.aspectRatio),
    entry
  );
}
function resolveMappedModelValue(enabled, payload) {
  if (!enabled) return '';
  if (typeof enabled === 'string') return enabled;
  if (typeof enabled !== 'object' || Array.isArray(enabled)) return '';
  const handle = String(payload?.imageSize || '')
      .trim()
      .toUpperCase(),
    state = enabled.byImageSize || {};
  return (handle && state[handle]) || enabled.default || enabled.model || '';
}
export function resolveExecutionModelToken(config, scope) {
  let input = config.model || scope.model || '';
  const manifestOptionKey = normalizeManifestOptionKey(scope.mode ?? scope.generationParams?.mode);
  let enabled2 = false;
  if (manifestOptionKey && config.modeModels) {
    const mappedModelValue = resolveMappedModelValue(config.modeModels[manifestOptionKey], scope);
    mappedModelValue && ((input = mappedModelValue), (enabled2 = true));
  }
  const manifestOptionKey2 = normalizeManifestOptionKey(
    scope.rhModelRoute ?? scope.generationParams?.rhModelRoute,
  );
  if (manifestOptionKey2 && config.routeModels) {
    const mappedModelValue2 = resolveMappedModelValue(config.routeModels[manifestOptionKey2], scope);
    mappedModelValue2 && ((input = mappedModelValue2), (enabled2 = true));
  }
  if (config.imageSizeModels && !enabled2) {
    const output = String(scope.imageSize || '')
      .trim()
      .toUpperCase();
    input = config.imageSizeModels[output] || config.imageSizeModels.default || input;
  }
  return input;
}
function resolveApiKey(value2, value3, value4) {
  const value5 = value4.getProviderConfig(value2);
  if (value2 === 'runninghub') return value5.modelApiKey || value3.apiKey;
  return value5.apiKey || value3.apiKey;
}
function throwMissingApiKey(value6) {
  throw ApiError.authError(value6, null, 'API Key 未配置（厂商：' + (value6 || 'unknown') + '）');
}
function getManifestMaxInputCount(value7, value8) {
  const value9 = Number(value7?.inputSlots?.maxByKind?.[value8]);
  return Number.isFinite(value9) ? Math.max(0, value9) : null;
}
function getImageInputUploadPolicy(options3 = {}) {
  const value10 = options3.executionManifest?.extensions?.imageInputUpload;
  return value10 && typeof value10 === 'object' && !Array.isArray(value10) ? value10 : null;
}
function shouldApplyImageInputUploadPolicy(enabled3) {
  if (!enabled3) return false;
  const list2 = Array.isArray(enabled3.inputKinds)
    ? enabled3.inputKinds.map((item3) =>
        String(item3 || '')
          .trim()
          .toLowerCase(),
      )
    : ['image'];
  return list2.includes('image');
}
async function resolveConfiguredImageInputUpload(value11, value12, value13, value14, baseUrl = {}) {
  const applyInputQualityProfile = getImageInputUploadPolicy(baseUrl);
  if (!shouldApplyImageInputUploadPolicy(applyInputQualityProfile)) return { handled: false, urls: [] };
  const value15 = String(applyInputQualityProfile.provider || '').trim(),
    value16 = value15.toLowerCase().replace(/[\s_-]+/g, '');
  if (value16 === 'freeimagehost') {
    if (typeof value14.processInputImages !== 'function')
      throw new Error((value11 || 'modelApi') + ' image input upload is not available');
    const urls = await value14.processInputImages(value12, '', {
      applyInputQualityProfile: applyInputQualityProfile.applyInputQualityProfile !== false,
      provider: 'freeImageHost',
      strictUpload: applyInputQualityProfile.strictUpload !== false,
    });
    return { handled: true, urls: urls };
  }
  if (value16 === 'volcenginefiles') {
    if (typeof value14.uploadInputsToVolcengineFiles !== 'function')
      throw new Error('Volcengine file upload is not available');
    const urls2 = await value14.uploadInputsToVolcengineFiles(value12, value13, {
      baseUrl: baseUrl.baseUrl,
      kind: 'image',
      model: baseUrl.executionManifest?.model,
    });
    return { handled: true, urls: urls2 };
  }
  throw new Error('Unsupported image input upload provider: ' + value15);
}
function getMediaInputUploadPolicy(options4 = {}, value17) {
  const value18 = String(value17 || '')
      .trim()
      .toLowerCase(),
    value19 = value18 === 'video' ? 'videoInputUpload' : value18 === 'audio' ? 'audioInputUpload' : '',
    value20 = value19 ? options4.executionManifest?.extensions?.[value19] : null;
  return value20 && typeof value20 === 'object' && !Array.isArray(value20) ? value20 : null;
}
function shouldApplyMediaInputUploadPolicy(enabled4, value21) {
  if (!enabled4) return false;
  const value22 = String(value21 || '')
      .trim()
      .toLowerCase(),
    list3 = Array.isArray(enabled4.inputKinds)
      ? enabled4.inputKinds.map((item4) =>
          String(item4 || '')
            .trim()
            .toLowerCase(),
        )
      : [value22];
  return list3.includes(value22);
}
function getUploadProviderConfig(value23, value24) {
  return typeof value23.getProviderConfig === 'function' ? value23.getProviderConfig(value24) : {};
}
async function resolveConfiguredMediaInputUpload(value25, value26, value27, value28, value29 = {}) {
  const strictUpload = getMediaInputUploadPolicy(value29, value26);
  if (!shouldApplyMediaInputUploadPolicy(strictUpload, value26)) return { handled: false, urls: [] };
  const value30 = String(strictUpload.provider || '').trim(),
    value31 = value30.toLowerCase().replace(/[\s_-]+/g, '');
  if (value31 !== 'apimart') throw new Error('Unsupported ' + value26 + ' input upload provider: ' + value30);
  const apiUrl = getUploadProviderConfig(value28, 'apimart'),
    value32 = {
      provider: 'apimart',
      strictUpload: strictUpload.strictUpload !== false,
      apiUrl: apiUrl.apiUrl,
      permanent: strictUpload.permanent === true,
      uploadTimeout: strictUpload.uploadTimeout,
    };
  if (value26 === 'video') {
    if (typeof value28.processInputVideos !== 'function')
      throw new Error((value25 || 'modelApi') + ' video input upload is not available');
    const urls3 = await value28.processInputVideos(value27, apiUrl.apiKey || '', value32);
    return { handled: true, urls: urls3 };
  }
  if (value26 === 'audio') {
    if (typeof value28.processInputAudios !== 'function')
      throw new Error((value25 || 'modelApi') + ' audio input upload is not available');
    const urls4 = await value28.processInputAudios(value27, apiUrl.apiKey || '', value32);
    return { handled: true, urls: urls4 };
  }
  throw new Error('Unsupported media input upload kind: ' + value26);
}
async function resolveInputImages(provider, value33, value34, value35, baseUrl2 = {}) {
  const manifestMaxInputCount = getManifestMaxInputCount(baseUrl2.modelManifest, 'image');
  if (manifestMaxInputCount === 0) return [];
  const list4 = Array.isArray(value33.inputUrls) ? value33.inputUrls : [];
  if (list4.length === 0) return [];
  const value36 = manifestMaxInputCount === null ? list4 : list4.slice(0, manifestMaxInputCount),
    configuredImageInputUpload = await resolveConfiguredImageInputUpload(
      provider,
      value36,
      value34,
      value35,
      baseUrl2,
    );
  if (configuredImageInputUpload.handled) return configuredImageInputUpload.urls;
  if (provider === 'ppio') {
    const value37 = value35.getProviderConfig('grsai'),
      value38 = value37.apiKey || value33.apiKey,
      list5 = await value35.processInputImages(value36, value38, {
        applyInputQualityProfile: true,
        provider: 'grsai',
      });
    if (list5.length === 0) throw new Error('参考素材上传云端失败，无法继续生成');
    return list5;
  }
  if (provider === 'volcengine') {
    if (typeof value35.uploadInputsToVolcengineFiles !== 'function')
      throw new Error('Volcengine file upload is not available');
    return value35.uploadInputsToVolcengineFiles(value36, value34, {
      baseUrl: baseUrl2.baseUrl,
      kind: 'image',
      model: baseUrl2.executionManifest?.model,
    });
  }
  if (provider === 'agnes')
    return value35.processInputImages(value36, '', {
      applyInputQualityProfile: true,
      provider: 'freeImageHost',
      strictUpload: true,
    });
  return value35.processInputImages(value36, value34, {
    applyInputQualityProfile: true,
    provider: provider,
    strictUpload: provider === 'apimart' || provider === 'runninghub',
  });
}
function normalizeInputUrlsBySlot(enabled5) {
  if (!enabled5 || typeof enabled5 !== 'object' || Array.isArray(enabled5)) return {};
  return Object.fromEntries(
    Object.entries(enabled5)
      .map(([value39, value40]) => [String(value39 || '').trim(), String(value40 || '').trim()])
      .filter(([value41, value42]) => value41 && value42),
  );
}
function getOrderedInputSlotEntries(options5 = {}, value43 = null) {
  const inputUrlsBySlot = normalizeInputUrlsBySlot(options5),
    list6 = Array.isArray(value43?.inputSlots?.fixedSlots) ? value43.inputSlots.fixedSlots : [],
    list7 = list6
      .filter((item5) => String(item5?.kind || '').trim() === 'image')
      .map((item6) => String(item6?.id || '').trim())
      .filter(Boolean),
    map = new Set(),
    list8 = [];
  return (
    list7.forEach((slot) => {
      const url = inputUrlsBySlot[slot];
      if (!url || map.has(slot)) return;
      (list8.push({ slot: slot, url: url }), map.add(slot));
    }),
    Object.entries(inputUrlsBySlot).forEach(([slot2, url2]) => {
      if (map.has(slot2)) return;
      (list8.push({ slot: slot2, url: url2 }), map.add(slot2));
    }),
    list8
  );
}
async function resolveInputImagesBySlot(value44, args3, value45, value46, value47 = {}) {
  const list9 = getOrderedInputSlotEntries(args3?.inputUrlsBySlot, value47.modelManifest);
  if (list9.length === 0) return {};
  const manifestMaxInputCount2 = getManifestMaxInputCount(value47.modelManifest, 'image'),
    inputUrls = manifestMaxInputCount2 === null ? list9 : list9.slice(0, Math.max(0, manifestMaxInputCount2)),
    inputImages = await resolveInputImages(
      value44,
      { ...args3, inputUrls: inputUrls.map((response) => response.url) },
      value45,
      value46,
      value47,
    );
  return Object.fromEntries(
    inputUrls
      .map((item7, value48) => [item7.slot, String(inputImages[value48] || '').trim()])
      .filter(([, value49]) => value49),
  );
}
function normalizeInputList(list10) {
  return Array.isArray(list10) ? list10.map((item8) => String(item8 || '').trim()).filter(Boolean) : [];
}
function collectVideoInputUrls(value50) {
  return Array.from(
    new Set(
      [
        String(value50.videoUrl || '').trim(),
        ...normalizeInputList(value50.videos),
        ...normalizeInputList(value50.videoUrls),
      ].filter(Boolean),
    ),
  );
}
function collectAudioInputUrls(value51) {
  return Array.from(
    new Set(
      [
        String(value51.audioUrl || '').trim(),
        ...normalizeInputList(value51.audios),
        ...normalizeInputList(value51.audioUrls),
      ].filter(Boolean),
    ),
  );
}
function collectVideoImageInputUrls(value52) {
  const list11 = Array.isArray(value52.images)
    ? value52.images
    : Array.isArray(value52.inputUrls)
      ? value52.inputUrls
      : [];
  return Array.from(new Set(list11.map((item9) => String(item9 || '').trim()).filter(Boolean)));
}
function omitSlotImageUrlsFromVideoInputs(args4 = {}) {
  const map2 = new Set(
    Object.values(normalizeInputUrlsBySlot(args4.inputUrlsBySlot))
      .map((item10) => String(item10 || '').trim())
      .filter(Boolean),
  );
  if (map2.size === 0) return args4;
  const images = (list12) =>
    Array.isArray(list12) ? list12.filter((item11) => !map2.has(String(item11 || '').trim())) : list12;
  return { ...args4, images: images(args4.images), inputUrls: images(args4.inputUrls) };
}
const VIDEO_MODEL_API_PROVIDERS = new Set(['agnes', 'apimart', 'runninghub', 'volcengine']);
function getProviderUploadLabel(value53) {
  const value54 = String(value53 || '')
    .trim()
    .toLowerCase();
  if (value54 === 'agnes') return 'Agnes AI';
  if (value54 === 'runninghub') return 'RunningHub';
  if (value54 === 'apimart') return 'APIMART';
  if (value54 === 'volcengine') return 'Volcengine';
  return value54 || 'Model API';
}
function isVolcengineContentGenerationMediaUrl(value55) {
  return /^(?:https?:|data:|asset:\/\/)/i.test(String(value55 || '').trim());
}
function getVolcengineContentGenerationMediaLabel(value56) {
  if (value56 === 'image') return '图片';
  if (value56 === 'video') return '视频';
  if (value56 === 'audio') return '音频';
  return '素材';
}
function normalizeVolcengineContentGenerationMediaUrls(value57, value58) {
  const volcengineContentGenerationMediaLabel = getVolcengineContentGenerationMediaLabel(value58);
  return normalizeInputList(value57).map((item12) => {
    if (isVolcengineContentGenerationMediaUrl(item12)) return item12;
    throw new Error(
      '火山方舟 Seedance 2.0 ' +
        volcengineContentGenerationMediaLabel +
        '入参需要公网 URL、Base64 data URI 或 asset:// 素材 ID；当前本地文件不能通过 Files API 作为 content.' +
        value58 +
        '_url.url 使用',
    );
  });
}
async function resolveVideoInputImages(value59, value60, value61, value62 = {}) {
  const provider2 = String(value62.provider || 'apimart')
      .trim()
      .toLowerCase(),
    providerUploadLabel = getProviderUploadLabel(provider2),
    manifestMaxInputCount3 = getManifestMaxInputCount(value62.modelManifest, 'image');
  if (manifestMaxInputCount3 === 0) return [];
  const list13 = collectVideoImageInputUrls(value59);
  if (list13.length === 0) return [];
  const value63 =
      manifestMaxInputCount3 === null ? list13 : list13.slice(0, Math.max(0, manifestMaxInputCount3)),
    configuredImageInputUpload2 = await resolveConfiguredImageInputUpload(
      provider2,
      value63,
      value60,
      value61,
      value62,
    );
  if (configuredImageInputUpload2.handled)
    return Array.isArray(configuredImageInputUpload2.urls)
      ? configuredImageInputUpload2.urls.map((item13) => String(item13 || '').trim()).filter(Boolean)
      : [];
  if (provider2 === 'volcengine') return normalizeVolcengineContentGenerationMediaUrls(value63, 'image');
  if (typeof value61.processInputImages !== 'function')
    throw new Error(providerUploadLabel + ' image input upload is not available');
  if (provider2 === 'agnes') {
    const list14 = await value61.processInputImages(value63, '', {
      applyInputQualityProfile: true,
      provider: 'freeImageHost',
      strictUpload: true,
    });
    return Array.isArray(list14) ? list14.map((item14) => String(item14 || '').trim()).filter(Boolean) : [];
  }
  const list15 = await value61.processInputImages(value63, value60, {
    applyInputQualityProfile: true,
    provider: provider2,
    strictUpload: true,
  });
  return Array.isArray(list15) ? list15.map((item15) => String(item15 || '').trim()).filter(Boolean) : [];
}
async function resolveInputVideos(value64, value65, value66, value67 = {}) {
  const provider3 = String(value67.provider || 'apimart')
      .trim()
      .toLowerCase(),
    providerUploadLabel2 = getProviderUploadLabel(provider3),
    manifestMaxInputCount4 = getManifestMaxInputCount(value67.modelManifest, 'video');
  if (manifestMaxInputCount4 === 0) return [];
  const list16 = collectVideoInputUrls(value64);
  if (list16.length === 0) return [];
  const value68 = manifestMaxInputCount4 === null ? list16 : list16.slice(0, manifestMaxInputCount4),
    configuredMediaInputUpload = await resolveConfiguredMediaInputUpload(
      provider3,
      'video',
      value68,
      value66,
      value67,
    );
  if (configuredMediaInputUpload.handled)
    return Array.isArray(configuredMediaInputUpload.urls)
      ? configuredMediaInputUpload.urls.map((item16) => String(item16 || '').trim()).filter(Boolean)
      : [];
  if (provider3 === 'volcengine') return normalizeVolcengineContentGenerationMediaUrls(value68, 'video');
  if (typeof value66.processInputVideos !== 'function')
    throw new Error(providerUploadLabel2 + ' video input upload is not available');
  const list17 = await value66.processInputVideos(value68, value65, {
    provider: provider3,
    strictUpload: true,
  });
  if (!Array.isArray(list17) || list17.length === 0)
    throw new Error(providerUploadLabel2 + ' video upload failed');
  return list17.map((item17) => String(item17 || '').trim()).filter(Boolean);
}
async function resolveInputAudios(value69, value70, value71, value72 = {}) {
  const provider4 = String(value72.provider || 'apimart')
      .trim()
      .toLowerCase(),
    providerUploadLabel3 = getProviderUploadLabel(provider4),
    manifestMaxInputCount5 = getManifestMaxInputCount(value72.modelManifest, 'audio');
  if (manifestMaxInputCount5 === 0) return [];
  const list18 = collectAudioInputUrls(value69);
  if (list18.length === 0) return [];
  const value73 = manifestMaxInputCount5 === null ? list18 : list18.slice(0, manifestMaxInputCount5),
    configuredMediaInputUpload2 = await resolveConfiguredMediaInputUpload(
      provider4,
      'audio',
      value73,
      value71,
      value72,
    );
  if (configuredMediaInputUpload2.handled)
    return Array.isArray(configuredMediaInputUpload2.urls)
      ? configuredMediaInputUpload2.urls.map((item18) => String(item18 || '').trim()).filter(Boolean)
      : [];
  if (provider4 === 'volcengine') return normalizeVolcengineContentGenerationMediaUrls(value73, 'audio');
  if (typeof value71.processInputAudios !== 'function')
    throw new Error(providerUploadLabel3 + ' audio input upload is not available');
  const list19 = await value71.processInputAudios(value73, value70, {
    provider: provider4,
    strictUpload: true,
  });
  if (!Array.isArray(list19) || list19.length === 0)
    throw new Error(providerUploadLabel3 + ' audio upload failed');
  return list19.map((item19) => String(item19 || '').trim()).filter(Boolean);
}
function resolveProviderRatioSize(ratioLabel, { context: context }) {
  const model = context.payload || {};
  if (model.suppressAspectRatio) return undefined;
  const value74 = String(ratioLabel || model.resolvedRatioLabel || model.aspectRatio || '')
      .trim()
      .toLowerCase(),
    value75 = value74 === 'auto' || value74 === 'adaptive' || value74 === 'default' || value74 === '自适应',
    apimartSeedreamPolicy = getApimartSeedreamPolicy(context);
  if (apimartSeedreamPolicy.preserveAdaptiveInputRatio === true && value75 && hasSeedreamInputImages(context))
    return 'auto';
  const imageSize = context.body?.resolution || model.imageSize || '2K',
    providerRatioPayload = resolveProviderRatioPayload({
      provider: context.provider,
      model: model.model,
      ratioLabel: ratioLabel || model.resolvedRatioLabel || model.aspectRatio,
      imageSize: imageSize,
      suppressAspectRatio: model.suppressAspectRatio,
    });
  return providerRatioPayload?.params?.size || undefined;
}
function firstArrayItem(value76) {
  if (Array.isArray(value76)) return value76[0] || undefined;
  return value76 || undefined;
}
function secondArrayItem(value77) {
  if (Array.isArray(value77)) return value77[1] || undefined;
  return undefined;
}
function normalizeBooleanParam(value78) {
  if (value78 === true || value78 === false) return value78;
  const value79 = String(value78 ?? '')
    .trim()
    .toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(value79)) return true;
  if (['false', '0', 'no', 'off', ''].includes(value79)) return false;
  return Boolean(value78);
}
function normalizeApimartImageCount(value80) {
  const value81 = Number.parseInt(String(value80 ?? '').trim(), 10);
  if (!Number.isFinite(value81)) return 1;
  return Math.max(1, Math.min(4, value81));
}
function normalizeApimartQwenImageCount(value82) {
  const value83 = Number.parseInt(String(value82 ?? '').trim(), 10);
  if (!Number.isFinite(value83)) return 1;
  return Math.max(1, Math.min(6, value83));
}
function normalizeApimartQwenImageResolution(value84) {
  const value85 = String(value84 || '1K')
    .trim()
    .toUpperCase();
  return value85 === '2K' ? '2K' : '1K';
}
function getApimartSeedreamPolicy(options6 = {}) {
  const value86 = options6.executionManifest?.extensions?.apimartSeedream;
  return value86 && typeof value86 === 'object' && !Array.isArray(value86) ? value86 : {};
}
function getVolcengineSeedreamPolicy(options7 = {}) {
  const value87 = options7.executionManifest?.extensions?.volcengineSeedream;
  return value87 && typeof value87 === 'object' && !Array.isArray(value87) ? value87 : {};
}
function normalizeResolutionList(list20) {
  return Array.isArray(list20)
    ? list20
        .map((item20) =>
          String(item20 || '')
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean)
    : [];
}
function normalizeApimartSeedreamResolution(value88, { context: context2 } = {}) {
  const apimartSeedreamPolicy2 = getApimartSeedreamPolicy(context2),
    value89 = String(value88 || '2K')
      .trim()
      .toUpperCase(),
    list21 = normalizeResolutionList(apimartSeedreamPolicy2.allowedResolutions);
  return list21.includes(value89) ? value89 : '2K';
}
function normalizeVolcengineSeedreamResolution(value90, { context: context3 } = {}) {
  const volcengineSeedreamPolicy = getVolcengineSeedreamPolicy(context3),
    value91 = String(volcengineSeedreamPolicy.defaultResolution || '2K')
      .trim()
      .toUpperCase(),
    value92 = String(value90 || value91)
      .trim()
      .toUpperCase(),
    list22 = normalizeResolutionList(volcengineSeedreamPolicy.allowedResolutions);
  return list22.includes(value92) ? value92 : value91;
}
function hasSeedreamInputImages(options8 = {}) {
  if (Array.isArray(options8.inputImages) && options8.inputImages.length > 0) return true;
  const value93 = options8.payload || {},
    list23 = [value93.inputUrls, value93.image_urls, value93.imageUrls, value93.image, value93.images];
  return list23.some((list24) =>
    Array.isArray(list24)
      ? list24.some((item21) => String(item21 || '').trim())
      : String(list24 || '').trim(),
  );
}
function hasManifestInputImages(options9 = {}) {
  if (Array.isArray(options9.inputImages) && options9.inputImages.length > 0) return true;
  const value94 = options9.payload || {},
    list25 = [value94.inputUrls, value94.image_urls, value94.imageUrls, value94.image, value94.images];
  return (
    list25.some((list26) =>
      Array.isArray(list26)
        ? list26.some((item22) => String(item22 || '').trim())
        : String(list26 || '').trim(),
    ) || Object.values(normalizeInputUrlsBySlot(value94.inputUrlsBySlot)).some(Boolean)
  );
}
function normalizeApimartSeedreamImageCount(value95, { context: context4 } = {}) {
  const apimartSeedreamPolicy3 = getApimartSeedreamPolicy(context4),
    value96 = Number.parseInt(String(value95 ?? '').trim(), 10),
    value97 = Number.isFinite(value96) ? value96 : 1,
    count = Number.parseInt(String(apimartSeedreamPolicy3.maxBatchSize ?? 1).trim(), 10),
    value98 = Number.isFinite(count) && count >= 1 ? count : 1,
    value99 = Math.max(1, Math.min(value98, value97));
  if (!hasSeedreamInputImages(context4)) {
    const count2 = Number.parseInt(String(apimartSeedreamPolicy3.textToImageBatchSize ?? '').trim(), 10);
    if (Number.isFinite(count2) && count2 >= 1) return Math.min(value99, count2);
  }
  return value99;
}
function normalizeVolcengineSeedreamCountValue(value100, value101 = {}) {
  const volcengineSeedreamPolicy2 = getVolcengineSeedreamPolicy(value101),
    value102 = Number.parseInt(String(value100 ?? '').trim(), 10),
    value103 = Number.isFinite(value102) ? value102 : 1,
    count3 = Number.parseInt(String(volcengineSeedreamPolicy2.maxBatchSize ?? 1).trim(), 10),
    value104 = Number.isFinite(count3) && count3 >= 1 ? count3 : 1;
  return Math.max(1, Math.min(value104, value103));
}
function normalizeVolcengineSeedreamImageCount(value105, { context: context5 } = {}) {
  const volcengineSeedreamCountValue = normalizeVolcengineSeedreamCountValue(value105, context5);
  return volcengineSeedreamCountValue > 1 ? volcengineSeedreamCountValue : undefined;
}
function resolveVolcengineSeedreamSequentialMode(value106, { context: context6 } = {}) {
  const volcengineSeedreamCountValue2 = normalizeVolcengineSeedreamCountValue(value106, context6);
  return volcengineSeedreamCountValue2 > 1 ? 'auto' : 'disabled';
}
function resolveVolcengineSeedreamSize(value107, { context: context7 } = {}) {
  const model2 = context7?.payload || {},
    volcengineSeedreamPolicy3 = getVolcengineSeedreamPolicy(context7),
    imageSize2 = normalizeVolcengineSeedreamResolution(model2.imageSize, { context: context7 });
  if (model2.suppressAspectRatio) return imageSize2;
  const ratioLabel2 = String(value107 || model2.resolvedRatioLabel || model2.aspectRatio || '').trim(),
    value108 = ratioLabel2.toLowerCase(),
    value109 = !ratioLabel2 || value108 === 'auto' || value108 === 'adaptive' || value108 === '自适应';
  if (
    volcengineSeedreamPolicy3.preserveAdaptiveInputRatio === true &&
    volcengineSeedreamPolicy3.supportsAdaptiveSize === true &&
    value109 &&
    hasSeedreamInputImages(context7)
  )
    return 'adaptive';
  const providerRatioPayload2 = resolveProviderRatioPayload({
      provider: context7.provider,
      model: model2.model,
      ratioLabel: ratioLabel2 || model2.resolvedRatioLabel || model2.aspectRatio || '1:1',
      imageSize: imageSize2,
      suppressAspectRatio: false,
    }),
    value110 = providerRatioPayload2?.resolvedRatioLabel || '1:1',
    value111 =
      volcengineSeedreamPolicy3.dimensionMapByResolution &&
      typeof volcengineSeedreamPolicy3.dimensionMapByResolution === 'object'
        ? volcengineSeedreamPolicy3.dimensionMapByResolution[imageSize2]
        : null;
  if (value111?.[value110]) return value111[value110];
  const count4 = Number(providerRatioPayload2?.params?.width),
    count5 = Number(providerRatioPayload2?.params?.height);
  if (Number.isFinite(count4) && count4 > 0 && Number.isFinite(count5) && count5 > 0)
    return Math.round(count4) + 'x' + Math.round(count5);
  return imageSize2;
}
function normalizeApimartWanImageResolution(value112, { context: context8 } = {}) {
  const value113 = String(value112 || '2K')
      .trim()
      .toUpperCase(),
    value114 = String(context8?.modelToken || '')
      .trim()
      .toLowerCase();
  if (value113 === '1K') return '1K';
  if (value113 === '4K' && value114 === 'wan2.7-image-pro' && !hasManifestInputImages(context8)) return '4K';
  return '2K';
}
function normalizeApimartVideoResolutionUpper(value115) {
  const value116 = String(value115 || '720P')
    .trim()
    .toUpperCase();
  if (value116 === '1080P') return '1080P';
  if (value116 === '720P') return '720P';
  if (value116 === '540P') return '540P';
  if (value116 === '480P') return '480P';
  return '720P';
}
function normalizeApimartVideoResolutionLower(value117) {
  const value118 = String(value117 || '720p')
    .trim()
    .toLowerCase();
  if (value118 === '1080p') return '1080p';
  return '720p';
}
function normalizeApimartVeo3VideoResolution(value119) {
  const value120 = String(value119 || '720p')
    .trim()
    .toLowerCase();
  if (value120 === '4k') return '4k';
  if (value120 === '1080p') return '1080p';
  return '720p';
}
function normalizeApimartViduQ3ModelToken(dom = {}) {
  return String(
    dom?.modelToken ||
      dom?.body?.model ||
      dom?.payload?.generationParams?.mode ||
      dom?.payload?.mode ||
      'viduq3-turbo',
  )
    .trim()
    .toLowerCase();
}
function normalizeApimartViduVideoResolution(value121, { context: context9 } = {}) {
  const value122 = String(value121 || '720p')
      .trim()
      .toLowerCase(),
    apimartViduQ3ModelToken = normalizeApimartViduQ3ModelToken(context9);
  if (apimartViduQ3ModelToken === 'viduq3-mix') return value122 === '1080p' ? '1080p' : '720p';
  if (value122 === '540p' || value122 === '720p' || value122 === '1080p') return value122;
  return '720p';
}
function normalizeApimartViduVideoDuration(value123, { context: context10 } = {}) {
  const apimartViduQ3ModelToken2 = normalizeApimartViduQ3ModelToken(context10),
    value124 = apimartViduQ3ModelToken2 === 'viduq3' ? 3 : 1,
    value125 = 16,
    value126 = Number(value123),
    value127 = 5,
    value128 = Number.isFinite(value126) ? Math.trunc(value126) : value127;
  return Math.min(value125, Math.max(value124, value128));
}
function normalizeApimartHailuoVideoResolution(value129) {
  const value130 = String(value129 || '768p')
    .trim()
    .toLowerCase();
  if (value130 === '512p' || value130 === '768p' || value130 === '1080p') return value130;
  return '768p';
}
function normalizeApimartHailuoVideoDuration(value131, { context: context11 } = {}) {
  const value132 = String(
    context11?.body?.resolution ||
      context11?.payload?.generationParams?.resolution ||
      context11?.payload?.resolution ||
      '',
  )
    .trim()
    .toLowerCase();
  if (value132 === '1080p') return 5;
  return Number(value131) === 10 ? 10 : 5;
}
function normalizeApimartHailuo23VideoResolution(value133) {
  const value134 = String(value133 || '768p')
    .trim()
    .toLowerCase();
  if (value134 === '1080p') return '1080p';
  return '768p';
}
function normalizeApimartHailuo23VideoDuration(value135, { context: context12 } = {}) {
  const value136 = String(
    context12?.body?.resolution ||
      context12?.payload?.generationParams?.resolution ||
      context12?.payload?.resolution ||
      '',
  )
    .trim()
    .toLowerCase();
  if (value136 === '1080p') return 6;
  return Number(value135) === 10 ? 10 : 6;
}
function normalizeApimartVideoRatio(value137) {
  const enabled6 = String(value137 ?? '').trim(),
    value138 = enabled6.toLowerCase();
  if (
    !enabled6 ||
    value138 === 'auto' ||
    value138 === 'adaptive' ||
    value138 === 'default' ||
    enabled6 === '自适应' ||
    enabled6 === '默认'
  )
    return undefined;
  return enabled6;
}
const AGNES_IMAGE_SIZE_BY_RATIO = Object.freeze({
    '1:1': '1024x1024',
    '4:3': '1024x768',
    '3:4': '768x1024',
    '3:2': '1024x682',
    '2:3': '682x1024',
    '16:9': '1024x576',
    '9:16': '576x1024',
  }),
  AGNES_VIDEO_DIMENSIONS_BY_RATIO = Object.freeze({
    '1:1': Object.freeze({ width: 0x400, height: 0x400 }),
    '4:3': Object.freeze({ width: 0x400, height: 0x300 }),
    '3:4': Object.freeze({ width: 0x300, height: 0x400 }),
    '3:2': Object.freeze({ width: 0x480, height: 0x300 }),
    '2:3': Object.freeze({ width: 0x300, height: 0x480 }),
    '16:9': Object.freeze({ width: 0x480, height: 0x288 }),
    '9:16': Object.freeze({ width: 0x288, height: 0x480 }),
  });
function normalizeAgnesRatioLabel(value139, value140 = '4:3') {
  const value141 = String(value139 || '').trim();
  if (/^\d+x\d+$/i.test(value141)) return value141.toLowerCase();
  const enabled7 = value141.replace(/\s+/g, '').replace('：', ':').toLowerCase();
  if (!enabled7 || ['auto', 'adaptive', 'default'].includes(enabled7)) return value140;
  const enabled8 = /^(\d+)[/:x](\d+)$/i.exec(enabled7);
  if (!enabled8) return value140;
  return Number(enabled8[1]) + ':' + Number(enabled8[2]);
}
function normalizeAgnesVideoResolution(value142, value143 = {}) {
  const value144 = String(
    value142 ||
      value143?.payload?.generationParams?.resolution ||
      value143?.payload?.resolution ||
      value143?.payload?.videoSize ||
      '720P',
  )
    .trim()
    .toUpperCase();
  return value144 === '1080P' ? '1080P' : '720P';
}
function normalizeAgnesImageSize(value145, { context: context13 } = {}) {
  const value146 =
      value145 ||
      context13?.payload?.resolvedRatioLabel ||
      context13?.payload?.generationParams?.aspectRatio ||
      context13?.payload?.aspectRatio,
    value147 = String(value146 || '').trim();
  if (/^\d+x\d+$/i.test(value147)) return value147.toLowerCase();
  const agnesRatioLabel = normalizeAgnesRatioLabel(value146, '4:3');
  return AGNES_IMAGE_SIZE_BY_RATIO[agnesRatioLabel] || AGNES_IMAGE_SIZE_BY_RATIO['4:3'];
}
function resolveAgnesVideoDimensions(value148, value149 = {}) {
  const value150 =
      value148 ||
      value149?.payload?.resolvedRatioLabel ||
      value149?.payload?.generationParams?.aspectRatio ||
      value149?.payload?.aspectRatio,
    agnesRatioLabel2 = normalizeAgnesRatioLabel(value150, '3:2'),
    box = AGNES_VIDEO_DIMENSIONS_BY_RATIO[agnesRatioLabel2] || AGNES_VIDEO_DIMENSIONS_BY_RATIO['3:2'];
  if (normalizeAgnesVideoResolution('', value149) !== '1080P') return box;
  return Object.freeze({
    width: Math.round(box.width * 1.5),
    height: Math.round(box.height * 1.5),
  });
}
function normalizeAgnesVideoWidth(value151, { context: context14 } = {}) {
  return resolveAgnesVideoDimensions(value151, context14).width;
}
function normalizeAgnesVideoHeight(value152, { context: context15 } = {}) {
  return resolveAgnesVideoDimensions(value152, context15).height;
}
function normalizeAgnesVideoNumFrames(value153, { spec: spec } = {}) {
  const count6 = Number(value153),
    value154 = Number.isFinite(count6) && count6 > 0 ? count6 : 5,
    value155 = Number.isFinite(Number(spec?.frameRate)) ? Number(spec.frameRate) : 24,
    value156 = Number.isFinite(Number(spec?.min)) ? Math.trunc(Number(spec.min)) : 49,
    value157 = Number.isFinite(Number(spec?.max)) ? Math.trunc(Number(spec.max)) : 0x1b9,
    value158 = Math.max(1, value156),
    value159 = Math.max(value158, value157),
    value160 = Math.max(value158, Math.round(value154 * value155) + 1),
    value161 = Math.min(value160, value159),
    value162 = Math.round((value161 - 1) / 8) * 8 + 1;
  return Math.min(value159, Math.max(value158, value162));
}
function normalizeApimartOptionalText(value163) {
  const enabled9 = String(value163 ?? '').trim(),
    value164 = enabled9.toLowerCase();
  if (!enabled9 || value164 === 'auto' || value164 === 'none') return undefined;
  return enabled9;
}
function normalizeApimartOptionalInteger(value165) {
  const enabled10 = String(value165 ?? '').trim(),
    value166 = enabled10.toLowerCase();
  if (!enabled10 || value166 === 'auto' || value166 === 'none') return undefined;
  const value167 = Number(enabled10);
  return Number.isFinite(value167) ? Math.trunc(value167) : undefined;
}
function resolveSeedModeValue(options10 = {}, value168 = 'seed_mode', value169 = 'fixed') {
  const value170 = String(value168 || 'seed_mode').trim(),
    value171 =
      options10?.generationParams &&
      typeof options10.generationParams === 'object' &&
      !Array.isArray(options10.generationParams)
        ? options10.generationParams
        : {},
    value172 =
      value171[value170] ?? value171.seedMode ?? options10[value170] ?? options10.seedMode ?? value169,
    value173 = String(value172 ?? value169)
      .trim()
      .toLowerCase();
  return value173 === 'random' ? 'random' : 'fixed';
}
function generateIntegerSeed(value174, value175) {
  const value176 = Math.min(value174, value175),
    value177 = Math.max(value174, value175);
  return value176 + Math.floor(Math.random() * (value177 - value176 + 1));
}
function normalizeAgnesVideoSeed(value178, { context: context16, spec: spec2 } = {}) {
  const seedModeValue = resolveSeedModeValue(
    context16?.payload || {},
    spec2?.modeField,
    spec2?.defaultMode || 'random',
  );
  if (seedModeValue === 'random') {
    const value179 = Number.isFinite(Number(spec2?.min)) ? Math.trunc(Number(spec2.min)) : 0,
      value180 = Number.isFinite(Number(spec2?.max)) ? Math.trunc(Number(spec2.max)) : 0x7fffffff;
    return generateIntegerSeed(value179, value180);
  }
  return normalizeApimartOptionalInteger(value178);
}
function normalizeIntegerRange(value181, { spec: spec3 } = {}) {
  const value182 = Number(value181),
    value183 = Number.isFinite(Number(spec3?.fallback)) ? Math.trunc(Number(spec3.fallback)) : 0,
    value184 = Number.isFinite(value182) ? Math.trunc(value182) : value183,
    value185 = Number.isFinite(Number(spec3?.min)) ? Math.trunc(Number(spec3.min)) : value184,
    value186 = Number.isFinite(Number(spec3?.max)) ? Math.trunc(Number(spec3.max)) : value184;
  return Math.min(Math.max(value184, value185), value186);
}
function formatAllowedImageCounts(list27) {
  if (list27.length <= 1) return String(list27[0] ?? '');
  if (list27.length === 2) return list27[0] + ' or ' + list27[1];
  return list27.slice(0, -1).join(', ') + ', or ' + list27.at(-1);
}
function normalizeImageCountOptions(value187, { spec: spec4 } = {}) {
  const list28 = (Array.isArray(value187) ? value187 : [])
    .map((item23) => String(item23 || '').trim())
    .filter(Boolean);
  if (list28.length === 0) return list28;
  const list29 = (Array.isArray(spec4?.allowedCounts) ? spec4.allowedCounts : [])
    .map((item24) => Number(item24))
    .filter((count7) => Number.isInteger(count7) && count7 >= 0);
  if (list29.length === 0 || list29.includes(list28.length)) return list28;
  const value188 = String(spec4?.label || 'This model').trim() || 'This model';
  throw new Error(value188 + ' supports only ' + formatAllowedImageCounts(list29) + ' reference images');
}
function normalizeApimartKlingVideoMode(value189) {
  const value190 = String(value189 || '')
    .trim()
    .toLowerCase();
  return value190 === 'pro' ? 'pro' : 'std';
}
function normalizeApimartKlingVideoMode4k(value191) {
  const value192 = String(value191 || '')
    .trim()
    .toLowerCase();
  if (value192 === '4k') return '4k';
  return value192 === 'pro' ? 'pro' : 'std';
}
function normalizeRunningHubKlingVideoMode(value193) {
  return normalizeApimartKlingVideoMode(value193);
}
function normalizeRunningHubKlingV3Model(value194) {
  const value195 = String(value194 || '')
    .trim()
    .toLowerCase();
  if (value195 === '4k') return '4k';
  if (value195 === 'pro') return 'pro';
  return 'std';
}
function normalizeRunningHubKlingV3AspectRatio(value196) {
  const apimartVideoRatio = normalizeApimartVideoRatio(value196);
  return ['16:9', '9:16', '1:1'].includes(apimartVideoRatio) ? apimartVideoRatio : undefined;
}
function normalizeRunningHubKlingV3Duration(value197) {
  const value198 = Math.trunc(Number(value197)),
    value199 = Number.isFinite(value198) ? value198 : 5;
  return String(Math.min(15, Math.max(3, value199)));
}
function normalizeRunningHubKlingV3CfgScale(value200) {
  const value201 = Number(value200);
  if (!Number.isFinite(value201)) return 0.5;
  return Math.min(1, Math.max(0, Math.round(value201 * 10) / 10));
}
function normalizeRunningHubKlingV3ShotType(value202) {
  const value203 = String(value202 || '')
    .trim()
    .toLowerCase();
  return value203 === 'intelligence' ? 'intelligence' : 'customize';
}
function normalizeRunningHubKlingO3Model(value204) {
  return normalizeRunningHubKlingV3Model(value204);
}
function normalizeRunningHubKlingO3AspectRatio(value205) {
  return normalizeRunningHubKlingV3AspectRatio(value205);
}
function normalizeRunningHubKlingO3Duration(value206) {
  return normalizeRunningHubKlingV3Duration(value206);
}
function normalizeRunningHubKlingO3ShotType(value207) {
  return normalizeRunningHubKlingV3ShotType(value207);
}
function normalizeRunningHubKlingO1AspectRatio(value208) {
  const value209 = String(value208 || '9:16').trim();
  return ['16:9', '9:16', '1:1'].includes(value209) ? value209 : '9:16';
}
function normalizeRunningHubKlingO1Duration(value210) {
  const value211 = Number(value210);
  return Number.isFinite(value211) && Math.trunc(value211) === 10 ? '10' : '5';
}
function normalizeRunningHubHailuo02Duration(value212) {
  const value213 = Number(value212);
  return Number.isFinite(value213) && Math.trunc(value213) === 10 ? '10' : '6';
}
function normalizeRunningHubHailuo23Duration(value214) {
  const value215 = Number(value214);
  return Number.isFinite(value215) && Math.trunc(value215) === 10 ? '10' : '6';
}
function normalizeRunningHubHappyHorseResolution(value216) {
  return normalizeApimartVideoResolutionLower(value216);
}
function normalizeRunningHubHappyHorseAspectRatio(value217) {
  const apimartVideoRatio2 = normalizeApimartVideoRatio(value217);
  return ['16:9', '9:16', '1:1', '4:3', '3:4'].includes(apimartVideoRatio2) ? apimartVideoRatio2 : undefined;
}
function normalizeRunningHubHappyHorseDuration(value218) {
  const value219 = Math.trunc(Number(value218)),
    value220 = Number.isFinite(value219) ? value219 : 5;
  return String(Math.min(15, Math.max(3, value220)));
}
function normalizeRunningHubHappyHorseAudioSetting(value221) {
  const value222 = String(value221 || '')
    .trim()
    .toLowerCase();
  return value222 === 'origin' ? 'origin' : 'auto';
}
function normalizeRunningHubSeedance2Resolution(value223) {
  const value224 = String(value223 || '720p')
    .trim()
    .toLowerCase();
  if (value224 === 'native1080p') return 'native1080p';
  if (['480p', '720p', '1080p', '2k', '4k'].includes(value224)) return value224;
  return '720p';
}
function normalizeRunningHubSeedance2Duration(value225) {
  const value226 = Math.trunc(Number(value225)),
    value227 = Number.isFinite(value226) ? value226 : 5;
  return String(Math.min(15, Math.max(4, value227)));
}
function normalizeRunningHubSeedance2Ratio(value228) {
  const enabled11 = String(value228 ?? '').trim(),
    value229 = enabled11.toLowerCase();
  if (
    !enabled11 ||
    value229 === 'auto' ||
    value229 === 'adaptive' ||
    value229 === 'default' ||
    enabled11 === '自适应' ||
    enabled11 === '默认'
  )
    return 'adaptive';
  return ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9'].includes(enabled11) ? enabled11 : 'adaptive';
}
function normalizeRunningHubVeo3Resolution(value230) {
  const value231 = String(value230 || '720p')
    .trim()
    .toLowerCase();
  if (value231 === '4k') return '4k';
  if (value231 === '1080p') return '1080p';
  return '720p';
}
function normalizeRunningHubVeo3AspectRatio(value232) {
  const apimartVideoRatio3 = normalizeApimartVideoRatio(value232);
  return ['16:9', '9:16'].includes(apimartVideoRatio3) ? apimartVideoRatio3 : undefined;
}
function normalizeRunningHubVeo3Duration(value233) {
  const value234 = Math.trunc(Number(value233));
  return [4, 6, 8].includes(value234) ? String(value234) : '8';
}
function normalizeRunningHubWan27Mode(dom2 = {}) {
  const value235 = String(
    dom2?.payload?.generationParams?.wan27_mode ||
      dom2?.payload?.wan27_mode ||
      dom2?.body?.wan27_mode ||
      'image',
  )
    .trim()
    .toLowerCase();
  return value235 === 'video' || value235 === 'reference' || value235 === 'edit' ? value235 : 'image';
}
function normalizeRunningHubWan27Resolution(value236) {
  const value237 = String(value236 || '720P')
    .trim()
    .toUpperCase();
  return value237 === '1080P' ? '1080P' : '720P';
}
function normalizeRunningHubWan27AspectRatio(value238) {
  const apimartVideoRatio4 = normalizeApimartVideoRatio(value238);
  return ['16:9', '9:16', '1:1', '4:3', '3:4'].includes(apimartVideoRatio4) ? apimartVideoRatio4 : undefined;
}
function normalizeRunningHubWan27Duration(value239, { context: context17 } = {}) {
  const count8 = Math.trunc(Number(value239)),
    runningHubWan27Mode = normalizeRunningHubWan27Mode(context17);
  if (runningHubWan27Mode === 'edit') {
    if (count8 === 0) return '0';
    const value240 = Number.isFinite(count8) ? count8 : 5;
    return String(Math.min(10, Math.max(2, value240)));
  }
  const value241 = Number.isFinite(count8) ? count8 : 5;
  return String(Math.min(15, Math.max(5, value241)));
}
function resolveApimartGoogleSearch(value242, { context: context18 }) {
  const value243 = context18?.payload || {};
  return normalizeBooleanParam(value242) || normalizeBooleanParam(value243.google_image_search);
}
function resolveApimartGoogleImageSearch(value244, { context: context19 }) {
  const value245 = context19?.body || {},
    value246 = context19?.payload || {};
  return (
    normalizeBooleanParam(value244) && normalizeBooleanParam(value245.google_search ?? value246.google_search)
  );
}
const BODY_MAPPING_TRANSFORMS = Object.freeze({
  apimartNanoBanana2Resolution: (value247) => normalizeApimartNanoBanana2Resolution(value247),
  apimartGptImage2Resolution: (value248) => normalizeApimartGptImage2Resolution(value248),
  apimartImageCount: normalizeApimartImageCount,
  apimartQwenImageCount: normalizeApimartQwenImageCount,
  apimartQwenImageResolution: normalizeApimartQwenImageResolution,
  apimartSeedreamResolution: normalizeApimartSeedreamResolution,
  apimartSeedreamImageCount: normalizeApimartSeedreamImageCount,
  volcengineSeedreamSize: resolveVolcengineSeedreamSize,
  volcengineSeedreamImageCount: normalizeVolcengineSeedreamImageCount,
  volcengineSeedreamSequentialMode: resolveVolcengineSeedreamSequentialMode,
  apimartWanImageResolution: normalizeApimartWanImageResolution,
  apimartVideoResolutionUpper: normalizeApimartVideoResolutionUpper,
  apimartVideoResolutionLower: normalizeApimartVideoResolutionLower,
  apimartVeo3VideoResolution: normalizeApimartVeo3VideoResolution,
  apimartViduVideoResolution: normalizeApimartViduVideoResolution,
  apimartViduVideoDuration: normalizeApimartViduVideoDuration,
  apimartHailuoVideoResolution: normalizeApimartHailuoVideoResolution,
  apimartHailuoVideoDuration: normalizeApimartHailuoVideoDuration,
  apimartHailuo23VideoResolution: normalizeApimartHailuo23VideoResolution,
  apimartHailuo23VideoDuration: normalizeApimartHailuo23VideoDuration,
  apimartVideoRatio: normalizeApimartVideoRatio,
  agnesImageSize: normalizeAgnesImageSize,
  agnesVideoWidth: normalizeAgnesVideoWidth,
  agnesVideoHeight: normalizeAgnesVideoHeight,
  agnesVideoNumFrames: normalizeAgnesVideoNumFrames,
  agnesVideoSeed: normalizeAgnesVideoSeed,
  apimartOptionalText: normalizeApimartOptionalText,
  apimartOptionalInteger: normalizeApimartOptionalInteger,
  integerRange: normalizeIntegerRange,
  imageCountOptions: normalizeImageCountOptions,
  apimartKlingVideoMode: normalizeApimartKlingVideoMode,
  apimartKlingVideoMode4k: normalizeApimartKlingVideoMode4k,
  runninghubKlingVideoMode: normalizeRunningHubKlingVideoMode,
  runninghubKlingV3Model: normalizeRunningHubKlingV3Model,
  runninghubKlingV3AspectRatio: normalizeRunningHubKlingV3AspectRatio,
  runninghubKlingV3Duration: normalizeRunningHubKlingV3Duration,
  runninghubKlingV3CfgScale: normalizeRunningHubKlingV3CfgScale,
  runninghubKlingV3ShotType: normalizeRunningHubKlingV3ShotType,
  runninghubKlingO3Model: normalizeRunningHubKlingO3Model,
  runninghubKlingO3AspectRatio: normalizeRunningHubKlingO3AspectRatio,
  runninghubKlingO3Duration: normalizeRunningHubKlingO3Duration,
  runninghubKlingO3ShotType: normalizeRunningHubKlingO3ShotType,
  runninghubKlingO1AspectRatio: normalizeRunningHubKlingO1AspectRatio,
  runninghubKlingO1Duration: normalizeRunningHubKlingO1Duration,
  runninghubHailuo02Duration: normalizeRunningHubHailuo02Duration,
  runninghubHailuo23Duration: normalizeRunningHubHailuo23Duration,
  runninghubHappyHorseResolution: normalizeRunningHubHappyHorseResolution,
  runninghubHappyHorseAspectRatio: normalizeRunningHubHappyHorseAspectRatio,
  runninghubHappyHorseDuration: normalizeRunningHubHappyHorseDuration,
  runninghubHappyHorseAudioSetting: normalizeRunningHubHappyHorseAudioSetting,
  runninghubSeedance2Resolution: normalizeRunningHubSeedance2Resolution,
  runninghubSeedance2Duration: normalizeRunningHubSeedance2Duration,
  runninghubSeedance2Ratio: normalizeRunningHubSeedance2Ratio,
  runninghubVeo3Resolution: normalizeRunningHubVeo3Resolution,
  runninghubVeo3AspectRatio: normalizeRunningHubVeo3AspectRatio,
  runninghubVeo3Duration: normalizeRunningHubVeo3Duration,
  runninghubWan27Resolution: normalizeRunningHubWan27Resolution,
  runninghubWan27AspectRatio: normalizeRunningHubWan27AspectRatio,
  runninghubWan27Duration: normalizeRunningHubWan27Duration,
  apimartGoogleSearch: resolveApimartGoogleSearch,
  apimartGoogleImageSearch: resolveApimartGoogleImageSearch,
  booleanParam: normalizeBooleanParam,
  first: firstArrayItem,
  second: secondArrayItem,
  providerRatioSize: resolveProviderRatioSize,
});
function resolveRequestManifest(args5, providerHint, value249) {
  let effectivePayload = args5,
    model3 = resolveModelExecution(args5.model, { providerHint: providerHint });
  if (
    providerHint &&
    (!model3?.modelManifest || model3.modelManifest.provider !== providerHint) &&
    !String(args5.model || '').includes('/')
  ) {
    const model4 = providerHint + '/' + args5.model,
      modelExecution = resolveModelExecution(model4);
    modelExecution?.modelManifest?.provider === providerHint &&
      ((model3 = modelExecution), (effectivePayload = { ...args5, model: model4 }));
  }
  model3?.canonicalModelId &&
    model3.canonicalModelId !== String(args5.model || '').trim() &&
    (effectivePayload = { ...args5, model: model3.canonicalModelId });
  const modelManifest = model3?.modelManifest,
    executionManifest = model3?.executionManifest;
  if (
    !modelManifest ||
    !executionManifest ||
    modelManifest.adapterType !== 'modelApi' ||
    executionManifest.adapterType !== 'modelApi' ||
    modelManifest.kind !== value249 ||
    executionManifest.kind !== value249
  )
    return null;
  const provider5 = modelManifest.provider;
  if (providerHint && provider5 !== providerHint) return null;
  return {
    provider: provider5,
    modelManifest: modelManifest,
    executionManifest: executionManifest,
    effectivePayload: effectivePayload,
  };
}
export async function buildManifestMappedBody(bodyMapping) {
  const currentBody = await buildBodyFromMapping({
      bodyMapping: bodyMapping.executionManifest.bodyMapping,
      context: bodyMapping,
      transforms: BODY_MAPPING_TRANSFORMS,
    }),
    enabled12 = bodyMapping.executionManifest.extensions?.bodyResolver;
  if (!enabled12) return currentBody;
  const run = getModelApiBodyResolver(enabled12);
  if (typeof run !== 'function') throw new Error('Unsupported model API bodyResolver: ' + enabled12);
  return run({ ...bodyMapping, currentBody: currentBody });
}
function resolveDefaultApiUrl(value250, value251, value252) {
  const value253 =
    value250 === 'grsai'
      ? String(value251.apiUrl || '')
          .replace(/\/v1\/?$/, '')
          .replace(/\/+$/, '')
      : String(value251.apiUrl || '').replace(/\/+$/, '');
  return '' + value253 + value252.endpoint;
}
export function resolveManifestTaskPolling(provider6, value254, executionId, modelId) {
  const enabled13 = executionId.extensions?.taskPolling;
  if (!enabled13 || typeof enabled13 !== 'object' || Array.isArray(enabled13)) return null;
  const value255 = String(value254.apiUrl || '')
      .replace(/\/v1\/?$/, '')
      .replace(/\/+$/, ''),
    urlTemplate = String(enabled13.urlTemplate || '').trim();
  return {
    method:
      String(enabled13.method || 'GET')
        .trim()
        .toUpperCase() || 'GET',
    mode: String(enabled13.mode || 'task-proxy').trim() || 'task-proxy',
    urlTemplate: urlTemplate.replace('{baseUrl}', value255),
    headersMode: String(enabled13.headersMode || 'bearer').trim() || 'bearer',
    provider: provider6,
    executionId: executionId.id,
    modelId: modelId?.modelManifest?.modelId || '',
  };
}
export function resolveManifestApiUrl(provider7, cfg, executionManifest2, args6) {
  const enabled14 = executionManifest2.extensions?.endpointResolver;
  if (!enabled14) return resolveDefaultApiUrl(provider7, cfg, executionManifest2);
  const run2 = getModelApiEndpointResolver(enabled14);
  if (typeof run2 !== 'function') throw new Error('Unsupported model API endpointResolver: ' + enabled14);
  const enabled15 = run2({
    provider: provider7,
    cfg: cfg,
    executionManifest: executionManifest2,
    ...args6,
  });
  if (!enabled15) throw new Error('Model API endpointResolver returned empty url: ' + enabled14);
  return enabled15;
}
export async function buildVideoRequestFromManifest(modelId2, finalPrompt, ctx, value256 = {}) {
  const value257 = String(value256.expectedProvider || '')
      .trim()
      .toLowerCase(),
    requestManifest = resolveRequestManifest(modelId2, value257, 'video');
  if (!requestManifest) return null;
  const {
    provider: provider8,
    modelManifest: modelManifest2,
    executionManifest: executionManifest3,
    effectivePayload: effectivePayload2,
  } = requestManifest;
  if (!VIDEO_MODEL_API_PROVIDERS.has(provider8)) return null;
  const sanitizeModelUiSchemaParams2 = sanitizeModelUiSchemaParams(
      modelManifest2.modelId,
      effectivePayload2.generationParams,
      {
        includeDefaults: true,
      },
    ),
    payload2 = applyVideoAspectRatioExecutionFallback(
      {
        ...effectivePayload2,
        generationParams: mergeRootAspectRatioIntoGenerationParams(
          effectivePayload2,
          sanitizeModelUiSchemaParams2,
        ),
      },
      modelManifest2,
    ),
    baseUrl3 = ctx.getProviderConfig(provider8),
    apiKey = resolveApiKey(provider8, payload2, ctx);
  !apiKey && throwMissingApiKey(provider8);
  const enabled16 = executionManifest3.extensions?.bodyResolver === 'apimartSeedanceVideo',
    finalUrlsBySlot = enabled16
      ? {}
      : await resolveInputImagesBySlot(provider8, payload2, apiKey, ctx, {
          modelManifest: modelManifest2,
          baseUrl: baseUrl3.apiUrl,
          executionManifest: executionManifest3,
        }),
    enabled17 = Object.keys(finalUrlsBySlot).length > 0,
    args7 = enabled17
      ? Object.values(finalUrlsBySlot)
          .map((item25) => String(item25 || '').trim())
          .filter(Boolean)
      : [],
    args8 =
      !enabled16 && (!enabled17 || provider8 === 'runninghub')
        ? await resolveVideoInputImages(
            enabled17 && provider8 === 'runninghub' ? omitSlotImageUrlsFromVideoInputs(payload2) : payload2,
            apiKey,
            ctx,
            {
              modelManifest: executionManifest3.extensions?.bodyResolver ? null : modelManifest2,
              provider: provider8,
              baseUrl: baseUrl3.apiUrl,
              executionManifest: executionManifest3,
            },
          )
        : [],
    finalUrls = enabled16 ? [] : enabled17 ? Array.from(new Set([...args7, ...args8])) : args8,
    inputVideos = enabled16
      ? []
      : await resolveInputVideos(payload2, apiKey, ctx, {
          modelManifest: modelManifest2,
          provider: provider8,
          baseUrl: baseUrl3.apiUrl,
          executionManifest: executionManifest3,
        }),
    inputAudios = enabled16
      ? []
      : await resolveInputAudios(payload2, apiKey, ctx, {
          modelManifest: modelManifest2,
          provider: provider8,
          baseUrl: baseUrl3.apiUrl,
          executionManifest: executionManifest3,
        }),
    modelToken = resolveExecutionModelToken(executionManifest3, payload2),
    value258 = {
      provider: provider8,
      modelManifest: modelManifest2,
      executionManifest: executionManifest3,
      payload: payload2,
      finalPrompt: finalPrompt,
      modelToken: modelToken,
      apiKey: apiKey,
      ctx: ctx,
      finalUrls: finalUrls,
      finalUrlsBySlot: finalUrlsBySlot,
      inputImages: finalUrls,
      inputVideos: inputVideos,
      inputAudios: inputAudios,
    },
    args9 = await buildManifestMappedBody(value258);
  return {
    url: '/api/v2/proxy/image',
    headers: executionManifest3.headers || { 'Content-Type': 'application/json' },
    body: {
      apiUrl: resolveManifestApiUrl(provider8, baseUrl3, executionManifest3, value258),
      apiKey: apiKey,
      ...args9,
    },
    responseMapping: executionManifest3.responseMapping,
    taskPolling: resolveManifestTaskPolling(provider8, baseUrl3, executionManifest3, value258),
    useOpenapiQuery: provider8 === 'runninghub',
    adapterTrace: { source: 'manifest', executionId: executionManifest3.id, modelId: modelId2.model },
  };
}
export async function buildTextRequestFromManifest(value259, finalPrompt2, ctx2, value260 = {}) {
  const value261 = String(value260.expectedProvider || '')
      .trim()
      .toLowerCase(),
    requestManifest2 = resolveRequestManifest(value259, value261, 'text');
  if (!requestManifest2) return null;
  const {
      provider: provider9,
      modelManifest: modelManifest3,
      executionManifest: executionManifest4,
      effectivePayload: effectivePayload3,
    } = requestManifest2,
    baseUrl4 = ctx2.getProviderConfig(provider9),
    apiKey2 = resolveApiKey(provider9, effectivePayload3, ctx2) || baseUrl4.apiKey;
  if (!apiKey2) throwMissingApiKey(provider9);
  const modelToken2 = resolveExecutionModelToken(executionManifest4, effectivePayload3),
    value262 = {
      provider: provider9,
      modelManifest: modelManifest3,
      executionManifest: executionManifest4,
      payload: effectivePayload3,
      finalPrompt: finalPrompt2,
      modelToken: modelToken2,
      apiKey: apiKey2,
      ctx: ctx2,
      inputImages: [],
      inputVideos: [],
      inputAudios: [],
    };
  if (executionManifest4.endpointMode === 'responses') {
    if (typeof ctx2.buildVolcengineResponsesUserContent !== 'function')
      throw new Error('responses text manifest requires user content resolver');
    const value263 =
        typeof ctx2.resolveChatCompletionInputUrls === 'function'
          ? ctx2.resolveChatCompletionInputUrls({
              providerId: provider9,
              mediaPolicy: executionManifest4.extensions?.chatCompletionInputPolicy,
              inputUrls: effectivePayload3.inputUrls || [],
              inputImageUrls: effectivePayload3.inputImageUrls || [],
              inputVideoUrls: effectivePayload3.inputVideoUrls || [],
            })
          : effectivePayload3.inputImageUrls || effectivePayload3.inputUrls || [],
      content = await ctx2.buildVolcengineResponsesUserContent(finalPrompt2, value263, apiKey2, provider9, {
        mediaPolicy: executionManifest4.extensions?.chatCompletionInputPolicy,
        inputImageUrls: effectivePayload3.inputImageUrls || [],
        inputVideoUrls: effectivePayload3.inputVideoUrls || [],
        baseUrl: baseUrl4.apiUrl,
        model: modelToken2,
        videoFps: executionManifest4.extensions?.volcengineFiles?.videoFps,
      });
    return {
      url: '/api/v2/proxy/completions',
      headers: executionManifest4.headers || { 'Content-Type': 'application/json' },
      body: {
        apiUrl: resolveManifestApiUrl(provider9, baseUrl4, executionManifest4, value262),
        apiKey: apiKey2,
        model: modelToken2,
        stream: false,
        ...(effectivePayload3.systemPrompt ? { instructions: effectivePayload3.systemPrompt } : {}),
        input: [{ role: 'user', content: content }],
      },
      responseMapping: executionManifest4.responseMapping,
      isProxy: true,
      adapterTrace: {
        source: 'manifest',
        executionId: executionManifest4.id,
        modelId: effectivePayload3.model,
      },
    };
  }
  if (executionManifest4.endpointMode === 'chat-completion') {
    if (typeof ctx2.buildChatCompletionUserContent !== 'function')
      throw new Error('chat-completion text manifest requires user content resolver');
    const value264 =
        typeof ctx2.resolveChatCompletionInputUrls === 'function'
          ? ctx2.resolveChatCompletionInputUrls({
              providerId: provider9,
              mediaPolicy: executionManifest4.extensions?.chatCompletionInputPolicy,
              inputUrls: effectivePayload3.inputUrls || [],
              inputImageUrls: effectivePayload3.inputImageUrls || [],
              inputVideoUrls: effectivePayload3.inputVideoUrls || [],
            })
          : effectivePayload3.inputImageUrls || effectivePayload3.inputUrls || [],
      content2 = await ctx2.buildChatCompletionUserContent(finalPrompt2, value264, apiKey2, provider9, {
        mediaPolicy: executionManifest4.extensions?.chatCompletionInputPolicy,
        inputImageUrls: effectivePayload3.inputImageUrls || [],
        inputVideoUrls: effectivePayload3.inputVideoUrls || [],
      });
    return {
      url: '/api/v2/proxy/completions',
      headers: executionManifest4.headers || { 'Content-Type': 'application/json' },
      body: {
        apiUrl: resolveManifestApiUrl(provider9, baseUrl4, executionManifest4, value262),
        apiKey: apiKey2,
        model: modelToken2,
        stream: false,
        messages: [
          { role: 'system', content: effectivePayload3.systemPrompt || 'You are a helpful assistant.' },
          { role: 'user', content: content2 },
        ],
      },
      responseMapping: executionManifest4.responseMapping,
      isProxy: true,
      adapterTrace: {
        source: 'manifest',
        executionId: executionManifest4.id,
        modelId: effectivePayload3.model,
      },
    };
  }
  const list30 = Array.isArray(effectivePayload3.inputImageUrls) ? effectivePayload3.inputImageUrls : [];
  if (list30.length === 0) throw new Error('RunningHub image-to-text manifest requires an image input');
  const imageUrl = await ctx2.buildRunningHubTextImageUrl(list30, apiKey2);
  if (!imageUrl) throw new Error('RunningHub image-to-text image upload failed');
  return {
    url: '/api/v2/proxy/image',
    headers: executionManifest4.headers || { 'Content-Type': 'application/json' },
    body: {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/' + executionManifest4.model,
      apiKey: apiKey2,
      prompt: finalPrompt2,
      imageUrl: imageUrl,
    },
    responseMapping: executionManifest4.responseMapping,
    isProxy: true,
    adapterTrace: {
      source: 'manifest',
      executionId: executionManifest4.id,
      modelId: effectivePayload3.model,
    },
  };
}
export async function buildImageRequestFromManifest(modelId3, finalPrompt3, ctx3, value265 = {}) {
  const value266 = String(value265.expectedProvider || '')
      .trim()
      .toLowerCase(),
    requestManifest3 = resolveRequestManifest(modelId3, value266, 'image');
  if (!requestManifest3) return null;
  const {
    provider: provider10,
    modelManifest: modelManifest4,
    executionManifest: executionManifest5,
    effectivePayload: effectivePayload4,
  } = requestManifest3;
  if (!['agnes', 'apimart', 'ppio', 'grsai', 'runninghub', 'volcengine'].includes(provider10)) return null;
  const baseUrl5 = ctx3.getProviderConfig(provider10),
    apiKey3 = resolveApiKey(provider10, modelId3, ctx3);
  !apiKey3 && throwMissingApiKey(provider10);
  const finalUrlsBySlot2 = await resolveInputImagesBySlot(provider10, effectivePayload4, apiKey3, ctx3, {
      modelManifest: modelManifest4,
      executionManifest: executionManifest5,
      baseUrl: baseUrl5.apiUrl,
    }),
    value267 = Object.keys(finalUrlsBySlot2).length > 0,
    finalUrls2 = value267
      ? Object.values(finalUrlsBySlot2)
      : await resolveInputImages(provider10, effectivePayload4, apiKey3, ctx3, {
          modelManifest: modelManifest4,
          executionManifest: executionManifest5,
          baseUrl: baseUrl5.apiUrl,
        }),
    modelToken3 = resolveExecutionModelToken(executionManifest5, effectivePayload4),
    value268 = {
      provider: provider10,
      modelManifest: modelManifest4,
      executionManifest: executionManifest5,
      payload: effectivePayload4,
      finalPrompt: finalPrompt3,
      modelToken: modelToken3,
      apiKey: apiKey3,
      ctx: ctx3,
      finalUrls: finalUrls2,
      finalUrlsBySlot: finalUrlsBySlot2,
      inputImages: finalUrls2,
      inputVideos: [],
      inputAudios: [],
    },
    args10 = await buildManifestMappedBody(value268),
    value269 = provider10 === 'runninghub';
  return {
    url: '/api/v2/proxy/image',
    headers: executionManifest5.headers || { 'Content-Type': 'application/json' },
    body: {
      apiUrl: resolveManifestApiUrl(provider10, baseUrl5, executionManifest5, value268),
      apiKey: apiKey3,
      ...args10,
    },
    responseMapping: executionManifest5.responseMapping,
    taskPolling: resolveManifestTaskPolling(provider10, baseUrl5, executionManifest5, value268),
    adapterTrace: { source: 'manifest', executionId: executionManifest5.id, modelId: modelId3.model },
    ...(value269
      ? {
          isAsync: true,
          taskIdPath:
            executionManifest5.responseMapping?.taskIdPath ||
            executionManifest5.result?.taskIdPath ||
            'taskId',
          useOpenapiQuery: true,
          pollUrlBuilder: () => 'https://www.runninghub.cn/openapi/v2/query',
          resultExtractor: (response2) => {
            if (response2.status === 'COMPLETED' && Array.isArray(response2.results))
              return response2.results
                .map((response3) => response3.url || response3.imageUrl || response3.videoUrl)
                .filter(Boolean);
            return [];
          },
        }
      : {}),
  };
}

function pickDefaultConcreteVideoAspectRatio(value270) {
  const videoAspectRatioField2 = findVideoAspectRatioField(value270),
    value271 = Array['isArray'](videoAspectRatioField2?.['options']) ? videoAspectRatioField2['options'] : [];
  let enabled18 = '';
  for (const value272 of value271) {
    const list31 = String(value272?.['value'] ?? value272 ?? '')['trim']();
    if (list31 && list31['includes'](':') && !isAdaptiveRatioLabel(list31)) {
      if (list31 === '1:1') return list31;
      if (!enabled18) enabled18 = list31;
    }
  }
  return enabled18;
}

function mergeUiSchemaDefaultsIntoPayload(args11 = {}, value273 = null) {
  const value274 = Array['isArray'](value273?.['uiSchema']?.['fields']) ? value273['uiSchema']['fields'] : [];
  if (value274['length'] === 0x0) return args11;
  const value275 =
    args11?.['generationParams'] &&
    typeof args11['generationParams'] === 'object' &&
    !Array['isArray'](args11['generationParams'])
      ? { ...args11['generationParams'] }
      : {};
  value274['forEach']((value276) => {
    const enabled19 = String(value276?.['id'] || '')['trim']();
    if (!enabled19 || Object['prototype']['hasOwnProperty']['call'](value275, enabled19)) return;
    if (enabled19 === 'aspectRatio' && String(args11?.['resolvedRatioLabel'] || '')['trim']()) {
      value275[enabled19] = args11['resolvedRatioLabel'];
      return;
    }
    Object['prototype']['hasOwnProperty']['call'](args11 || {}, enabled19) &&
      (value275[enabled19] = args11[enabled19]);
  });
  const sanitizeModelUiSchemaParams3 = sanitizeModelUiSchemaParams(value273['modelId'], value275, {
      includeDefaults: !![],
    }),
    value277 = { ...args11, generationParams: sanitizeModelUiSchemaParams3 };
  return (
    value274['forEach']((value278) => {
      const enabled20 = String(value278?.['id'] || '')['trim']();
      if (!enabled20 || Object['prototype']['hasOwnProperty']['call'](value277, enabled20)) return;
      Object['prototype']['hasOwnProperty']['call'](sanitizeModelUiSchemaParams3, enabled20) &&
        (value277[enabled20] = sanitizeModelUiSchemaParams3[enabled20]);
    }),
    value277
  );
}

function resolveProviderConfig(value279, value280, value281) {
  const runningHubProviderProfileId = getRunningHubProviderProfileId(value280),
    modelProviderProfileId = normalizeModelProviderProfileId(
      value280?.['model'],
      runningHubProviderProfileId,
    ),
    value282 =
      modelProviderProfileId ||
      (value279 === 'runninghub'
        ? resolveRunningHubModelApiProfileId(value280?.['model'], runningHubProviderProfileId)
        : value279),
    args12 = value281['getProviderConfig'](value282);
  if (value279 !== 'runninghub') return args12;
  return { ...args12, apiUrl: resolveRunningHubModelApiBaseUrl(value282) };
}

function isCustomProviderId(value283) {
  return /^custom_[a-z0-9_-]+$/i['test'](String(value283 || '')['trim']());
}

const AIC_IMAGE_TASK_PROBE_CONTROL_KEY = '__aicAllowTaskProbe',
  AIC_MODEL_CATALOG_ID_KEY = '__aicModelCatalogId';

function buildModelCatalogIdentity(value284, value285) {
  const value286 = String(value285?.['modelId'] || '')['trim']();
  return value284 === 'binghuo' && value286 ? { [AIC_MODEL_CATALOG_ID_KEY]: value286 } : {};
}

function supportsManifestImageTaskPolling(value287) {
  return Boolean(
    value287 &&
    (String(value287['urlTemplate'] || '')['trim']() ||
      String(value287['mode'] || '')['trim']() === 'comfyui-history'),
  );
}

function isCustomProviderModelManifest(value288) {
  const value289 = value288?.['extensions']?.['customProvider'];
  return Boolean(value289 && typeof value289 === 'object' && !Array['isArray'](value289));
}

function isSupportedModelApiProvider(value290, value291 = new Set()) {
  const value292 = String(value290 || '')
    ['trim']()
    ['toLowerCase']();
  return value291['has'](value292) || isCustomProviderId(value292);
}

function collectRawImageInputUrls(options11 = {}, value293 = null) {
  const list32 = getOrderedInputSlotEntries(options11?.['inputUrlsBySlot'], value293),
    list33 =
      list32['length'] > 0x0
        ? list32['map']((value294) => value294['url'])
        : Array['isArray'](options11?.['inputUrls'])
          ? options11['inputUrls']
          : [];
  return Array['from'](
    new Set(list33['map']((value295) => String(value295 || '')['trim']())['filter'](Boolean)),
  );
}

function collectResolverOwnedImageInputUrls(options12 = {}, value296 = null) {
  const rawImageInputUrls = collectRawImageInputUrls(options12, value296),
    manifestMaxInputCount6 = getManifestMaxInputCount(value296, 'image');
  return manifestMaxInputCount6 === null
    ? rawImageInputUrls
    : rawImageInputUrls['slice'](0x0, Math['max'](0x0, manifestMaxInputCount6));
}

function resolveInputRouteExecutionManifest(args13, value297, value298) {
  const value299 = args13?.['extensions']?.['inputRoutes'],
    args14 =
      value299 && typeof value299 === 'object' && !Array['isArray'](value299) ? value299['image'] : null;
  if (
    !args14 ||
    typeof args14 !== 'object' ||
    Array['isArray'](args14) ||
    collectRawImageInputUrls(value297, value298)['length'] === 0x0
  )
    return args13;
  return {
    ...args13,
    ...args14,
    extensions: { ...(args13?.['extensions'] || {}), ...(args14['extensions'] || {}) },
  };
}

function isMultipartFormExecution(value300) {
  return (
    String(value300?.['requestEncoding'] || '')
      ['trim']()
      ['toLowerCase']() === 'multipart/form-data'
  );
}

async function resolveMultipartInputImages(value301, value302, value303) {
  if (typeof value303['loadInputImageBlob'] !== 'function')
    throw new Error('Model API multipart image input loader is not available');
  const list34 = collectRawImageInputUrls(value301, value302),
    manifestMaxInputCount7 = getManifestMaxInputCount(value302, 'image'),
    value304 = manifestMaxInputCount7 === null ? list34 : list34['slice'](0x0, manifestMaxInputCount7),
    list35 = [];
  for (const value305 of value304) {
    const value306 = await value303['loadInputImageBlob'](value305);
    if (typeof Blob === 'undefined' || !(value306 instanceof Blob))
      throw new Error('Model API multipart image input did not resolve to a file');
    list35['push'](value306);
  }
  return list35;
}

function multipartFileName(value307, value308) {
  const value309 = String(value307?.['type'] || '')
      ['trim']()
      ['toLowerCase'](),
    value310 =
      value309 === 'image/jpeg'
        ? 'jpg'
        : value309 === 'image/webp'
          ? 'webp'
          : value309 === 'image/gif'
            ? 'gif'
            : 'png';
  return 'image-' + (value308 + 0x1) + '.' + value310;
}

function appendMultipartValue(value311, value312, list36, value313 = 0x0) {
  if (list36 === undefined || list36 === null || list36 === '') return;
  if (typeof Blob !== 'undefined' && list36 instanceof Blob) {
    value311['append'](value312, list36, multipartFileName(list36, value313));
    return;
  }
  if (Array['isArray'](list36)) {
    list36['forEach']((value314, value315) => appendMultipartValue(value311, value312, value314, value315));
    return;
  }
  if (typeof list36 === 'object') {
    value311['append'](value312, JSON['stringify'](list36));
    return;
  }
  value311['append'](value312, String(list36));
}

function buildMultipartFormData(options13 = {}) {
  const formData = new FormData();
  return (
    Object['entries'](options13 || {})['forEach'](([value316, value317]) => {
      appendMultipartValue(formData, value316, value317);
    }),
    formData
  );
}

function resolveCustomProviderAssetUploadApiUrl(value318, value319) {
  const enabled21 = String(value318 || '')['trim'](),
    enabled22 = String(value319 || '')['trim']();
  if (!enabled21 || !enabled22['startsWith']('/'))
    throw new Error(
      'Custom\x20provider\x20asset\x20upload\x20manifest\x20is\x20missing\x20a\x20relative\x20endpoint',
    );
  let uRL, uRL2;
  try {
    ((uRL = new URL(enabled21)), (uRL2 = new URL(enabled22, uRL['origin'])));
  } catch {
    throw new Error('Custom\x20provider\x20asset\x20upload\x20manifest\x20has\x20an\x20invalid\x20endpoint');
  }
  if (uRL2['origin'] !== uRL['origin'] || uRL2['search'] || uRL2['hash'])
    throw new Error('Custom provider asset upload endpoint must remain on the provider origin');
  return uRL2['toString']();
}

function getCustomProviderAssetUploadOptions(args15, value320) {
  return {
    provider: 'customProviderAsset',
    apiUrl: resolveCustomProviderAssetUploadApiUrl(value320, args15['endpoint']),
    multipartField: String(args15['multipartField'] || 'file')['trim']() || 'file',
    responsePath: String(args15['responsePath'] || 'url')['trim']() || 'url',
    ...(args15['formFields'] ? { formFields: args15['formFields'] } : {}),
    forceProviderUpload: args15['forceProviderUpload'] === !![],
    allowedExtensions: Array['isArray'](args15['allowedExtensions']) ? args15['allowedExtensions'] : [],
    maxBytes: args15['maxBytes'],
    uploadTimeout: args15['uploadTimeout'],
    compress: args15['compress'] === !![],
    applyInputQualityProfile: args15['applyInputQualityProfile'] === !![],
    strictUpload: args15['strictUpload'] !== ![],
  };
}

function isApimartPrivateAssetUrl(value321) {
  return /^asset:\/\//i['test'](String(value321 || '')['trim']());
}

function assertNoUnsupportedApimartAssetUrls(value322, value323, value324 = {}, value325 = 'image') {
  if (
    String(value322 || '')
      ['trim']()
      ['toLowerCase']() !== 'apimart'
  )
    return;
  if (value324['executionManifest']?.['extensions']?.['allowApimartAssetUrls'] === !![]) return;
  const inputList = normalizeInputList(value323)['find'](isApimartPrivateAssetUrl);
  if (!inputList) return;
  const value326 = value325 === 'video' ? '视频' : value325 === 'audio' ? '音频' : '图片';
  throw new Error(
    'APIMart ' +
      value326 +
      '输入不支持\x20asset://\x20私有素材\x20URL；请连接原始素材，或使用可公网访问的\x20' +
      value326 +
      ' URL 后重试',
  );
}

function validateStrictVideoInputCounts(value327, value328, value329) {
  if (value329?.['extensions']?.['strictInputCounts'] !== !![]) return;
  const value330 = {
      image: Array['from'](
        new Set([...collectRawImageInputUrls(value327, value328), ...collectVideoImageInputUrls(value327)]),
      ),
      video: collectVideoInputUrls(value327),
      audio: collectAudioInputUrls(value327),
    },
    value331 = { image: '参考图', video: '参考视频', audio: '参考音频' };
  for (const [value332, value333] of Object['entries'](value330)) {
    const manifestMaxInputCount8 = getManifestMaxInputCount(value328, value332),
      enabled23 = value328?.['inputSlots']?.['allowedKinds'],
      value334 =
        manifestMaxInputCount8 === null &&
        Array['isArray'](enabled23) &&
        !enabled23['map']((value335) => String(value335 || '')['trim']())['includes'](value332)
          ? 0x0
          : manifestMaxInputCount8;
    if (value334 !== null && value333['length'] > value334)
      throw new Error(
        (value328['displayName'] || '当前模型') +
          '最多支持 ' +
          value334 +
          '\x20个' +
          value331[value332] +
          '，当前传入\x20' +
          value333['length'] +
          ' 个，请删减后重试',
      );
  }
}

function resolveStrictUiSchemaFieldLabel(value336) {
  const value337 = String(value336?.['id'] || '')['trim'](),
    value338 = { aspectRatio: '比例', batchSize: '生成数量', imageSize: '图片分辨率', qualityLevel: '质量' };
  return value338[value337] || String(value336?.['label'] || value337 || '参数')['trim']();
}

function readExplicitUiSchemaValue(value339, value340) {
  const value341 =
    value339?.['generationParams'] &&
    typeof value339['generationParams'] === 'object' &&
    !Array['isArray'](value339['generationParams'])
      ? value339['generationParams']
      : {};
  if (Object['prototype']['hasOwnProperty']['call'](value341, value340))
    return { provided: !![], value: value341[value340] };
  if (Object['prototype']['hasOwnProperty']['call'](value339 || {}, value340))
    return { provided: !![], value: value339[value340] };
  return { provided: ![], value: undefined };
}

function isSameStrictUiSchemaOption(value342, value343) {
  const value344 = Number(value342),
    value345 = Number(value343);
  if (
    String(value342 ?? '')['trim']() !== '' &&
    String(value343 ?? '')['trim']() !== '' &&
    Number['isFinite'](value344) &&
    Number['isFinite'](value345)
  )
    return value344 === value345;
  return (
    String(value342 ?? '')
      ['trim']()
      ['toLowerCase']() ===
    String(value343 ?? '')
      ['trim']()
      ['toLowerCase']()
  );
}

function validateStrictModelUiSchemaParams(value346, value347, value348) {
  if (value348?.['extensions']?.['strictUiSchemaParams'] !== !![]) return;
  const value349 = Array['isArray'](value347?.['uiSchema']?.['fields']) ? value347['uiSchema']['fields'] : [],
    value350 = String(value347?.['displayName'] || value347?.['modelId'] || '当前模型')['trim']();
  for (const value351 of value349) {
    const enabled24 = String(value351?.['id'] || '')['trim']();
    if (!enabled24) continue;
    const el2 = readExplicitUiSchemaValue(value346, enabled24);
    if (
      !el2['provided'] ||
      el2['value'] === undefined ||
      el2['value'] === null ||
      String(el2['value'])['trim']() === ''
    )
      continue;
    const list37 = (Array['isArray'](value351?.['options']) ? value351['options'] : [])['map']((value352) =>
        value352 && typeof value352 === 'object' && !Array['isArray'](value352)
          ? value352['value']
          : value352,
      ),
      strictUiSchemaFieldLabel = resolveStrictUiSchemaFieldLabel(value351);
    if (
      list37['length'] > 0x0 &&
      !list37['some']((value353) => isSameStrictUiSchemaOption(value353, el2['value']))
    )
      throw new Error(
        '便宜渠道\x20' +
          value350 +
          '\x20的' +
          strictUiSchemaFieldLabel +
          '不支持“' +
          el2['value'] +
          '”，可选：' +
          list37['join'](' / '),
      );
    const value354 = String(value351?.['type'] || '')
      ['trim']()
      ['toLowerCase']();
    if (value354 === 'toggle') {
      const value355 = String(el2['value'])['trim']()['toLowerCase']();
      if (
        el2['value'] !== !![] &&
        el2['value'] !== ![] &&
        !['true', 'false', '1', '0', 'yes', 'no', 'on', 'off']['includes'](value355)
      )
        throw new Error('便宜渠道\x20' + value350 + '\x20的' + strictUiSchemaFieldLabel + '只能开启或关闭');
      continue;
    }
    if (!['slider', 'stepper']['includes'](value354) || list37['length'] > 0x0) continue;
    const value356 = Number(el2['value']),
      value357 = Number(value351?.['min']),
      value358 = Number(value351?.['max']),
      count9 = Number(value351?.['step']);
    if (!Number['isFinite'](value356))
      throw new Error('便宜渠道 ' + value350 + '\x20的' + strictUiSchemaFieldLabel + '必须是数字');
    if (Number['isFinite'](value357) && value356 < value357)
      throw new Error('便宜渠道 ' + value350 + '\x20的' + strictUiSchemaFieldLabel + '不能小于 ' + value357);
    if (Number['isFinite'](value358) && value356 > value358)
      throw new Error(
        '便宜渠道\x20' + value350 + '\x20的' + strictUiSchemaFieldLabel + '不能大于\x20' + value358,
      );
    if (
      Number['isFinite'](count9) &&
      count9 > 0x0 &&
      Number['isFinite'](value357) &&
      Math['abs']((value356 - value357) / count9 - Math['round']((value356 - value357) / count9)) > 1e-9
    )
      throw new Error(
        '便宜渠道 ' + value350 + '\x20的' + strictUiSchemaFieldLabel + '必须按 ' + count9 + ' 递增',
      );
  }
}

function validateStrictImageInputCounts(value359, value360, value361) {
  if (value361?.['extensions']?.['strictInputCounts'] !== !![]) return;
  const manifestMaxInputCount9 = getManifestMaxInputCount(value360, 'image');
  if (manifestMaxInputCount9 === null) return;
  const list38 = Array['from'](
    new Set(
      [
        ...collectRawImageInputUrls(value359, value360),
        ...(Array['isArray'](value359?.['images']) ? value359['images'] : []),
      ]
        ['map']((value362) => String(value362 || '')['trim']())
        ['filter'](Boolean),
    ),
  );
  if (list38['length'] <= manifestMaxInputCount9) return;
  throw new Error(
    (value360['displayName'] || '当前模型') +
      '最多支持\x20' +
      manifestMaxInputCount9 +
      ' 张参考图，当前传入 ' +
      list38['length'] +
      ' 张，请删减后重试',
  );
}

const IMAGE_MODEL_API_PROVIDERS = new Set([
  'bailian',
  'agnes',
  'apimart',
  'binghuo',
  'ppio',
  'grsai',
  'runninghub',
  'volcengine',
]);
const AUDIO_MODEL_API_PROVIDERS = new Set(['volcengine-speech']);

function isVolcengineFileId(value363) {
  return /^file-[A-Za-z0-9_-]+/['test'](String(value363 || '')['trim']());
}

function throwVolcengineFilesApiInputError(value364) {
  const volcengineContentGenerationMediaLabel2 = getVolcengineContentGenerationMediaLabel(value364);
  throw new Error(
    'Volcengine Seedance ' +
      volcengineContentGenerationMediaLabel2 +
      '\x20input\x20cannot\x20use\x20Files\x20API\x20file_id\x20directly;\x20use\x20a\x20public\x20URL\x20or\x20asset://\x20asset\x20ID',
  );
}

function assertNoVolcengineFileIds(value365, value366) {
  for (const value367 of normalizeInputList(value365)) {
    if (isVolcengineFileId(value367)) throwVolcengineFilesApiInputError(value366);
  }
}

function resolveVolcengineContentGenerationMediaUrls(value368, value369) {
  const volcengineContentGenerationMediaLabel3 = getVolcengineContentGenerationMediaLabel(value369),
    list39 = [];
  for (const value370 of normalizeInputList(value368)) {
    if (isVolcengineContentGenerationMediaUrl(value370)) {
      list39['push'](value370);
      continue;
    }
    isVolcengineFileId(value370) && throwVolcengineFilesApiInputError(value369);
    throw new Error(
      'Volcengine\x20Seedance\x20' +
        volcengineContentGenerationMediaLabel3 +
        ' input needs a public URL or asset:// asset ID; local files require an upload channel that returns a model-usable URL',
    );
  }
  return list39;
}

function normalizeCustomProviderOpenAiImageSize(value371, { context: context20 } = {}) {
  const value372 = context20?.['payload'] || {},
    value373 = String(
      value371 || value372?.['generationParams']?.['imageSize'] || value372?.['imageSize'] || '1024x1024',
    )['trim'](),
    value374 = value373['match'](/^(\d{2,5})\s*[xX×]\s*(\d{2,5})$/);
  if (value374) return Number(value374[0x1]) + 'x' + Number(value374[0x2]);
  const enabled25 = String(
    value372?.['generationParams']?.['aspectRatio'] ||
      value372?.['resolvedRatioLabel'] ||
      value372?.['aspectRatio'] ||
      '',
  )['trim']();
  if (!enabled25 || isAdaptiveRatioLabel(enabled25)) return '1024x1024';
  const ratioLabel3 = parseRatioLabel(enabled25);
  if (!ratioLabel3) return '1024x1024';
  const count10 = ratioLabel3['w'] / ratioLabel3['h'];
  if (Math['abs'](count10 - 0x1) < 0.05) return '1024x1024';
  return count10 > 0x1 ? '1536x1024' : '1024x1536';
}

function normalizeCustomProviderDocumentedValueMap(value375, { spec: spec5 } = {}) {
  const value376 = Array['isArray'](spec5?.['values']) ? spec5['values'] : [],
    enabled26 = value376['find'](
      (value377) =>
        value377 &&
        (Object['is'](value377['uiValue'], value375) || String(value377['uiValue']) === String(value375)),
    );
  if (!enabled26 || !Object['prototype']['hasOwnProperty']['call'](enabled26, 'requestValue'))
    throw new Error('Custom provider documented value mapping is missing for the selected option');
  return enabled26['requestValue'];
}

function normalizeCustomProviderDimensionMap(value378, { context: context21, spec: spec6 } = {}) {
  const value379 = context21?.['payload'] || {},
    value380 = value379['generationParams'] || {},
    value381 = value380['imageSize'] ?? value379['imageSize'],
    value382 =
      value378 ?? value380['aspectRatio'] ?? value379['resolvedRatioLabel'] ?? value379['aspectRatio'],
    list40 = Array['isArray'](spec6?.['values']) ? spec6['values'] : [],
    enabled27 = list40['find'](
      (value383) =>
        value383 &&
        String(value383['imageSize']) === String(value381) &&
        String(value383['aspectRatio']) === String(value382),
    );
  if (!enabled27 || !Object['prototype']['hasOwnProperty']['call'](enabled27, 'requestValue'))
    throw new Error(
      'Custom provider documented dimension mapping is missing for the selected resolution and ratio',
    );
  return enabled27['requestValue'];
}

function normalizeNumberParam(value384) {
  if (value384 === undefined || value384 === null || String(value384)['trim']() === '') return undefined;
  const value385 = Number(value384);
  return Number['isFinite'](value385) ? value385 : undefined;
}

function normalizeIntegerParam(value386) {
  const numberParam = normalizeNumberParam(value386);
  return Number['isFinite'](numberParam) ? Math['trunc'](numberParam) : undefined;
}

function normalizeStringParam(value387) {
  if (value387 === undefined || value387 === null) return undefined;
  return String(value387);
}

const AGNES_IMAGE_SIZE_SCALE_BY_QUALITY = Object['freeze']({ '1K': 0x1, '2K': 0x2, '3K': 0x3, '4K': 0x4 });

function normalizeAgnesImageQuality(value388, value389 = '1K') {
  const value390 = String(value388 || '')
    ['trim']()
    ['toUpperCase']();
  return Object['prototype']['hasOwnProperty']['call'](AGNES_IMAGE_SIZE_SCALE_BY_QUALITY, value390)
    ? value390
    : value389;
}

function normalizeAgnesVideoFrameRate(value391, { spec: spec7 } = {}) {
  const value392 = Number(value391),
    value393 = Number['isFinite'](Number(spec7?.['fallback']))
      ? Math['trunc'](Number(spec7['fallback']))
      : 0x18,
    value394 = Number['isFinite'](value392) ? Math['trunc'](value392) : value393,
    value395 = Number['isFinite'](Number(spec7?.['min'])) ? Math['trunc'](Number(spec7['min'])) : 0x1,
    value396 = Number['isFinite'](Number(spec7?.['max'])) ? Math['trunc'](Number(spec7['max'])) : 0x3c;
  return Math['min'](Math['max'](value394, value395), value396);
}

function resolveAgnesVideoFrameRate(options14 = {}, value397 = {}) {
  const value398 = [
    options14?.['body']?.['frame_rate'],
    options14?.['payload']?.['generationParams']?.['frame_rate'],
    options14?.['payload']?.['generationParams']?.['frameRate'],
    options14?.['payload']?.['frame_rate'],
    options14?.['payload']?.['frameRate'],
    value397?.['frameRate'],
  ];
  for (const value399 of value398) {
    if (value399 === undefined || value399 === null || String(value399)['trim']() === '') continue;
    return normalizeAgnesVideoFrameRate(value399, {
      spec: {
        min: value397?.['frameRateMin'],
        max: value397?.['frameRateMax'],
        fallback: value397?.['frameRate'],
      },
    });
  }
  return normalizeAgnesVideoFrameRate(undefined, {
    spec: {
      min: value397?.['frameRateMin'],
      max: value397?.['frameRateMax'],
      fallback: value397?.['frameRate'],
    },
  });
}

function normalizeRunningHubSeedance25Duration(value400) {
  const value401 = Math['trunc'](Number(value400));
  if (value401 === -0x1) return '-1';
  const value402 = Number['isFinite'](value401) ? value401 : -0x1;
  return value402 === -0x1 ? '-1' : String(Math['min'](0x1e, Math['max'](0x4, value402)));
}

const CUSTOM_PROVIDER_TASK_SUCCESS_STATUS_ALIASES = Object['freeze']([
    'succeeded',
    'success',
    'completed',
    'complete',
    'done',
    'finished',
  ]),
  CUSTOM_PROVIDER_TASK_FAILURE_STATUS_ALIASES = Object['freeze']([
    'failed',
    'failure',
    'fail',
    'error',
    'cancelled',
    'canceled',
    'expired',
  ]);

const SAFE_MANIFEST_ERROR_RULE_TYPES = new Set([
  'AUTH_ERROR',
  'CONTENT_FILTERED',
  'FORBIDDEN',
  'INSUFFICIENT_BALANCE',
  'INVALID_PARAMS',
  'MODEL_UNAVAILABLE',
  'NETWORK_ERROR',
  'RATE_LIMIT',
  'SERVER_ERROR',
  'SERVICE_UNAVAILABLE',
  'TASK_FAILED',
  'TIMEOUT',
  'UNKNOWN',
]);

export function resolveManifestErrorRules(options15 = {}) {
  const value403 = options15?.['extensions']?.['errorRules'];
  if (!Array['isArray'](value403)) return [];
  return value403['slice'](0x0, 0xc)['flatMap']((enabled28) => {
    if (!enabled28 || typeof enabled28 !== 'object' || Array['isArray'](enabled28)) return [];
    const value404 = String(enabled28['phase'] || 'any')
        ['trim']()
        ['toLowerCase'](),
      value405 = String(enabled28['type'] || '')
        ['trim']()
        ['toUpperCase'](),
      args16 = [
        ...new Set(
          (Array['isArray'](enabled28['httpStatuses']) ? enabled28['httpStatuses'] : [])
            ['map']((value406) => Number(value406))
            ['filter']((count11) => Number['isInteger'](count11) && count11 >= 0x190 && count11 <= 0x257),
        ),
      ]['slice'](0x0, 0xc),
      list41 = [
        ...new Set(
          (Array['isArray'](enabled28['messageIncludesAny']) ? enabled28['messageIncludesAny'] : [])
            ['map']((value407) =>
              String(value407 || '')
                ['replace'](/\s+/g, '\x20')
                ['trim'](),
            )
            ['filter']((value408) => value408 && value408['length'] <= 0xf0),
        ),
      ]['slice'](0x0, 0x6);
    if (
      !['any', 'submit', 'poll']['includes'](value404) ||
      !SAFE_MANIFEST_ERROR_RULE_TYPES['has'](value405) ||
      typeof enabled28['retryable'] !== 'boolean' ||
      (args16['length'] === 0x0 && list41['length'] === 0x0)
    )
      return [];
    const args17 = String(enabled28['userMessage'] || '')
        ['replace'](/\s+/g, '\x20')
        ['trim']()
        ['slice'](0x0, 0x1f4),
      args18 = String(enabled28['hint'] || '')
        ['replace'](/\s+/g, '\x20')
        ['trim']()
        ['slice'](0x0, 0x1f4);
    return [
      {
        phase: value404,
        ...(args16['length'] > 0x0 ? { httpStatuses: args16 } : {}),
        ...(list41['length'] > 0x0 ? { messageIncludesAny: list41 } : {}),
        type: value405,
        retryable: enabled28['retryable'],
        ...(args17 ? { userMessage: args17 } : {}),
        ...(args18 ? { hint: args18 } : {}),
      },
    ];
  });
}

function doesResolverOwnInputResolution(value409) {
  const value410 = value409?.['extensions'] || {};
  return (
    value410['resolverOwnsInputs'] === !![] ||
    String(value410['inputResolutionMode'] || '')['trim']() === 'resolverOwned'
  );
}

function getFixedInputSlotOrderByKind(value411 = null, value412 = '') {
  const value413 = String(value412 || '')['trim'](),
    list42 = Array['isArray'](value411?.['inputSlots']?.['fixedSlots'])
      ? value411['inputSlots']['fixedSlots']
      : [];
  return list42['filter']((value414) => String(value414?.['kind'] || '')['trim']() === value413)
    ['map']((value415) => String(value415?.['id'] || '')['trim']())
    ['filter'](Boolean);
}

function getAudioRefUrl(options16 = {}) {
  return String(options16?.['url'] || options16?.['audioUrl'] || options16?.['src'] || '')['trim']();
}

function orderAudioRefsByManifestSlots(list43 = [], value416 = null) {
  const list44 = (Array['isArray'](list43) ? list43 : [])['filter']((value417) => getAudioRefUrl(value417)),
    fixedInputSlotOrderByKind = getFixedInputSlotOrderByKind(value416, 'audio');
  if (fixedInputSlotOrderByKind['length'] === 0x0 || list44['length'] <= 0x1) return list44;
  const enabled29 = new Set(),
    value418 = [];
  return (
    fixedInputSlotOrderByKind['forEach']((value419) => {
      const count12 = list44['findIndex'](
        (value420, value421) =>
          !enabled29['has'](value421) && String(value420?.['refSlot'] || '')['trim']() === value419,
      );
      if (count12 < 0x0) return;
      (enabled29['add'](count12), value418['push'](list44[count12]));
    }),
    list44['forEach']((value422, value423) => {
      if (!enabled29['has'](value423)) value418['push'](value422);
    }),
    value418
  );
}

function mergeAudioRefsIntoPayload(args19 = {}, value424 = null) {
  const value425 = Array['isArray'](args19?.['audioRefs']) ? args19['audioRefs'] : [],
    args20 = orderAudioRefsByManifestSlots(value425, value424)
      ['map']((value426) => getAudioRefUrl(value426))
      ['filter'](Boolean);
  if (args20['length'] === 0x0) return args19;
  const args21 = normalizeInputList(args19['audioUrls']),
    enabled30 = new Set(args20);
  return {
    ...args19,
    audioUrls: [...args21['filter']((value427) => !enabled30['has'](value427)), ...args20],
  };
}

function createModelApiRequestId() {
  const value428 = Math['random']()['toString'](0x10)['slice'](0x2, 0xa);
  return Date['now']() + '-' + value428;
}

function buildTaskProxyHeaders(args22, value429, value430) {
  const value431 = { ...(args22 || {}) },
    value432 = String(value430?.['extensions']?.['apiKeyHeader'] || '')['trim']();
  value432 &&
    value429 &&
    !Object['prototype']['hasOwnProperty']['call'](value431, value432) &&
    (value431[value432] = value429);
  const value433 = String(value430?.['extensions']?.['requestIdHeader'] || '')['trim']();
  value433 &&
    !Object['keys'](value431)['some'](
      (value434) => value434['toLowerCase']() === value433['toLowerCase'](),
    ) &&
    (value431[value433] = createModelApiRequestId());
  const value435 = String(value430?.['extensions']?.['resourceId'] || '')['trim']();
  return (
    value435 &&
      !Object['keys'](value431)['some']((value436) => value436['toLowerCase']() === 'x-api-resource-id') &&
      (value431['X-Api-Resource-Id'] = value435),
    value431
  );
}

export async function buildAudioRequestFromManifest(value437, value438, value439, value440 = {}) {
  const value441 = String(value440['expectedProvider'] || '')
      ['trim']()
      ['toLowerCase'](),
    requestManifest4 = resolveRequestManifest(value437, value441, 'audio');
  if (!requestManifest4) return null;
  const {
    provider: provider11,
    modelManifest: modelManifest5,
    executionManifest: executionManifest6,
    effectivePayload: effectivePayload5,
  } = requestManifest4;
  if (!isSupportedModelApiProvider(provider11, AUDIO_MODEL_API_PROVIDERS)) return null;
  const audioRefsIntoPayload = mergeAudioRefsIntoPayload(effectivePayload5, modelManifest5),
    uiSchemaDefaultsIntoPayload = mergeUiSchemaDefaultsIntoPayload(audioRefsIntoPayload, modelManifest5),
    providerConfig = resolveProviderConfig(provider11, uiSchemaDefaultsIntoPayload, value439),
    apiKey4 = resolveApiKey(provider11, uiSchemaDefaultsIntoPayload, value439, providerConfig);
  !apiKey4 && throwMissingApiKey(provider11);
  const inputImagesBySlot = await resolveInputImagesBySlot(
      provider11,
      uiSchemaDefaultsIntoPayload,
      apiKey4,
      value439,
      {
        modelManifest: modelManifest5,
        provider: provider11,
        baseUrl: providerConfig['apiUrl'],
        executionManifest: executionManifest6,
      },
    ),
    value442 =
      Object['keys'](inputImagesBySlot)['length'] > 0x0
        ? Object['values'](inputImagesBySlot)
        : await resolveInputImages(provider11, uiSchemaDefaultsIntoPayload, apiKey4, value439, {
            modelManifest: modelManifest5,
            provider: provider11,
            baseUrl: providerConfig['apiUrl'],
            executionManifest: executionManifest6,
          }),
    inputAudios2 = await resolveInputAudios(uiSchemaDefaultsIntoPayload, apiKey4, value439, {
      modelManifest: modelManifest5,
      provider: provider11,
      baseUrl: providerConfig['apiUrl'],
      executionManifest: executionManifest6,
    }),
    executionModelToken = resolveExecutionModelToken(executionManifest6, uiSchemaDefaultsIntoPayload),
    value443 = {
      provider: provider11,
      modelManifest: modelManifest5,
      executionManifest: executionManifest6,
      payload: uiSchemaDefaultsIntoPayload,
      finalPrompt: value438,
      modelToken: executionModelToken,
      apiKey: apiKey4,
      ctx: value439,
      inputImages: value442,
      inputVideos: [],
      inputAudios: inputAudios2,
    },
    args23 = await buildManifestMappedBody(value443),
    manifestApiUrl = resolveManifestApiUrl(provider11, providerConfig, executionManifest6, value443),
    value444 = String(executionManifest6['extensions']?.['proxyMode'] || '')
      ['trim']()
      ['toLowerCase']();
  if (value444 === 'task')
    return {
      url: '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(manifestApiUrl),
      headers: buildTaskProxyHeaders(
        executionManifest6['headers'] || { 'Content-Type': 'application/json' },
        apiKey4,
        executionManifest6,
      ),
      body: args23,
      responseMapping: executionManifest6['responseMapping'],
      errorRules: resolveManifestErrorRules(executionManifest6),
      adapterTrace: {
        source: 'manifest',
        executionId: executionManifest6['id'],
        modelId: uiSchemaDefaultsIntoPayload['model'],
      },
      meta: {
        provider: provider11,
        adapterType: 'modelApi',
        audioWorkflowKey: modelManifest5['modelId'],
        audioWorkflowLabel: modelManifest5['displayName'] || modelManifest5['modelId'],
        model: modelManifest5['modelId'],
        executionId: executionManifest6['id'],
        isManifestAudioModelApi: !![],
      },
    };
  return {
    url: '/api/v2/proxy/image',
    headers: executionManifest6['headers'] || { 'Content-Type': 'application/json' },
    body: { apiUrl: manifestApiUrl, apiKey: apiKey4, ...args23 },
    responseMapping: executionManifest6['responseMapping'],
    errorRules: resolveManifestErrorRules(executionManifest6),
    adapterTrace: {
      source: 'manifest',
      executionId: executionManifest6['id'],
      modelId: uiSchemaDefaultsIntoPayload['model'],
    },
    meta: {
      provider: provider11,
      adapterType: 'modelApi',
      audioWorkflowKey: modelManifest5['modelId'],
      audioWorkflowLabel: modelManifest5['displayName'] || modelManifest5['modelId'],
      model: modelManifest5['modelId'],
      executionId: executionManifest6['id'],
      isManifestAudioModelApi: !![],
    },
  };
}

function normalizeTextMaxOutputTokens(value445) {
  const count13 = Math['trunc'](Number(value445) || 0x0);
  return count13 > 0x0 ? count13 : 0x0;
}

function resolveGeminiNativeVideoApiUrl(value446, value447, value448, value449) {
  const value450 = value448['extensions']?.['geminiNativeVideo'],
    enabled31 = String(value450?.['endpointTemplate'] || '')['trim']();
  if (!enabled31 || !enabled31['includes']('{model}'))
    throw new Error('Gemini native video manifest requires an endpointTemplate with {model}');
  const value451 = enabled31['replace']('{model}', encodeURIComponent(value449['modelToken'])),
    defaultApiUrl = resolveDefaultApiUrl(value446, value447, { endpoint: value451 });
  return value446 === 'runninghub'
    ? remapRunningHubModelApiUrl(defaultApiUrl, value449?.['payload']?.['providerProfileId'])
    : defaultApiUrl;
}

function buildGeminiNativeThinkingConfig(value452, value453) {
  const value454 = String(value452?.['type'] || '')
    ['trim']()
    ['toLowerCase']();
  if (value454 !== 'disabled') return {};
  const value455 = value453?.['thinkingControl'];
  if (value455?.['disabledUnsupported'] === !![])
    throw new Error('当前 Gemini 模型不支持关闭思考，请改用支持无思考模式的模型');
  const count14 = Number(value455?.['disabledBudget']);
  if (!Number['isFinite'](count14) || count14 < 0x0) return {};
  return {
    thinkingConfig: {
      thinkingBudget: Math['trunc'](count14),
      includeThoughts: value455?.['includeThoughts'] === !![],
    },
  };
}

function buildGeminiNativeGenerationConfig(value456, args24, value457, value458) {
  const args25 = normalizeTextStructuredOutput(value456);
  return {
    ...(args24 ? { maxOutputTokens: args24 } : {}),
    ...buildGeminiNativeThinkingConfig(value457, value458),
    ...(args25 ? { responseMimeType: 'application/json', responseJsonSchema: args25['schema'] } : {}),
  };
}

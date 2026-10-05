import { resolveProviderRatioPayload } from '../imageRatioPolicy.js';
import {
  applyApimartPrivateAvatarAssetsToUrls,
  isApimartSeedance2PrivateAvatarModel,
} from './apimartPrivateAvatarAssetResolver.js';
import { normalizeApimartBaseUrl } from '../apimartUploadApi.js';
const APIMART_DIMENSION_TARGET_PIXELS = Object.freeze({
    '1K': 1024 * 1024,
    '2K': 2048 * 2048,
    '3K': 2560 * 2560,
    '4K': 2880 * 2880,
  }),
  APIMART_DIMENSION_DEFAULT_RESOLUTION = '2K',
  APIMART_DIMENSION_ALIGN = 8,
  APIMART_DIMENSION_MIN = 512,
  APIMART_DIMENSION_MAX = 8192;
function parseRatioLabel(value) {
  const [item, key] = String(value || '1:1').split(':'),
    w = Number.parseFloat(item),
    h = Number.parseFloat(key);
  if (!(w > 0 && h > 0)) return { w: 1, h: 1 };
  return { w: w, h: h };
}
function alignDimension(index) {
  const result = Math.round(Number(index || 0) / APIMART_DIMENSION_ALIGN) * APIMART_DIMENSION_ALIGN;
  return Math.max(APIMART_DIMENSION_MIN, Math.min(APIMART_DIMENSION_MAX, result));
}
function resolveDimensionsByResolutionAndRatio(data, options) {
  const target = String(data || '')
      .trim()
      .toUpperCase(),
    source =
      APIMART_DIMENSION_TARGET_PIXELS[target] ||
      APIMART_DIMENSION_TARGET_PIXELS[APIMART_DIMENSION_DEFAULT_RESOLUTION],
    { w: w2, h: h2 } = parseRatioLabel(options),
    next = w2 / h2,
    current = Math.sqrt(source / next),
    entry = current * next;
  return { width: alignDimension(entry), height: alignDimension(current) };
}
function isApimartGptImage2Model(record) {
  const payload = String(record || '')
    .trim()
    .toLowerCase();
  return payload === 'apimart/gpt-image-2' || payload === 'gpt-image-2';
}
function isApimartSeedanceVideoModel(handle) {
  return String(handle || '')
    .trim()
    .replace(/^apimart\//, '')
    .startsWith('doubao-seedance-');
}
function normalizeSeedanceVideoSize(state) {
  const enabled = String(state || '').trim();
  if (!enabled) return '16:9';
  if (enabled === '自适应' || enabled.toLowerCase() === 'auto') return 'adaptive';
  if (
    enabled === '1:1' ||
    enabled === '3:4' ||
    enabled === '16:9' ||
    enabled === '4:3' ||
    enabled === '9:16' ||
    enabled === '21:9' ||
    enabled === 'adaptive'
  )
    return enabled;
  return '16:9';
}
function normalizeSeedanceAspectRatio(config) {
  const scope = String(config || '').trim();
  if (
    scope === '1:1' ||
    scope === '3:4' ||
    scope === '16:9' ||
    scope === '4:3' ||
    scope === '9:16' ||
    scope === '21:9'
  )
    return scope;
  return '16:9';
}
function isPresentValue(input) {
  return input !== undefined && input !== null && String(input).trim() !== '';
}
function normalizeGptImage2Resolution(output) {
  const value2 = String(output || '')
    .trim()
    .toUpperCase();
  if (value2 === '1K' || value2 === '2K' || value2 === '4K') return value2.toLowerCase();
  return '2k';
}
export function normalizeTextModel(value3) {
  if (value3 === 'apimart/gpt-5.4') return 'gpt-5.4-apimart';
  if (String(value3 || '').startsWith('apimart/')) return String(value3).replace(/^apimart\//, '');
  return value3;
}
export function getTextProxyApiUrl(value4) {
  return value4 + '/v1/chat/completions';
}
export async function buildImageRequest(model, prompt, value5) {
  if (!model.model) throw new Error('未指定模型，无法发起图像生成请求');
  const value6 = value5.getProviderConfig('apimart'),
    apiUrl = normalizeApimartBaseUrl(value6.apiUrl),
    apiKey = value6.apiKey || model.apiKey;
  if (!apiKey) throw new Error('API Key 未配置，无法发起图像生成请求');
  const list = await value5.processInputImages(model.inputUrls, apiKey, {
      applyInputQualityProfile: true,
      provider: 'apimart',
      strictUpload: true,
    }),
    value7 = {
      'apimart/nano-banana-2': 'gemini-3.1-flash-image-preview',
      'apimart/nano-banana-pro': 'gemini-3-pro-image-preview',
      'apimart/nano-banana-dot': 'gemini-2.5-flash-image-preview',
      'apimart/gpt-image-2': 'gpt-image-2',
      'apimart/seedream-5.0-lite': 'doubao-seedream-5-0-lite',
      'apimart/seedream-4.5': 'doubao-seedance-4-5',
      'apimart/seedream-4.0': 'doubao-seedance-4-0',
    },
    model2 = value7[model.model] || model.model.replace('apimart/', ''),
    enabled2 =
      model.model === 'apimart/seedream-4.0' ||
      model.model === 'apimart/seedream-4.5' ||
      model.model === 'apimart/seedream-5.0-lite';
  let imageSize = model.imageSize || '2K';
  (model.model === 'apimart/seedream-4.5' || model.model === 'apimart/seedream-5.0-lite') &&
    imageSize === '1K' &&
    (imageSize = '2K');
  model.model === 'apimart/seedream-5.0-lite' && imageSize === '4K' && (imageSize = '3K');
  isApimartGptImage2Model(model.model) && (imageSize = normalizeGptImage2Resolution(imageSize));
  const providerRatioPayload = resolveProviderRatioPayload({
      provider: 'apimart',
      model: model.model,
      ratioLabel: model.resolvedRatioLabel || model.aspectRatio,
      imageSize: imageSize,
      suppressAspectRatio: model.suppressAspectRatio,
    }),
    box = { model: model2, prompt: prompt, n: 1, ...(!enabled2 && { resolution: imageSize }) };
  if (!model.suppressAspectRatio && providerRatioPayload?.params?.size) {
    if (enabled2) {
      const box2 = resolveDimensionsByResolutionAndRatio(imageSize, providerRatioPayload.params.size);
      ((box.width = box2.width), (box.height = box2.height));
    } else box.size = providerRatioPayload.params.size;
  }
  return (
    list.length > 0 && (box.image_urls = list),
    {
      url: '/api/v2/proxy/image',
      headers: { 'Content-Type': 'application/json' },
      body: { apiUrl: apiUrl + '/v1/images/generations', apiKey: apiKey, ...box },
    }
  );
}
export async function buildVideoRequest(duration, prompt2, value8) {
  if (!duration.model) throw new Error('未指定视频模型，无法发起视频生成请求');
  const value9 = value8.getProviderConfig('apimart'),
    apiUrl2 = normalizeApimartBaseUrl(value9.apiUrl),
    apiKey2 = value9.apiKey || duration.apiKey;
  if (!apiKey2) throw new Error('API Key 未配置（厂商：Apimart），无法发起视频生成请求');
  const value10 = {
      'apimart/luma-ray-v2': 'luma-ray-v2',
      'apimart/kling-v1-5': 'kling-v1-5-gen-video',
      'apimart/happyhorse-1.0': 'happyhorse-1.0',
      'apimart/doubao-seedance-2.0-fast': 'doubao-seedance-2.0-fast',
      'apimart/doubao-seedance-2.0': 'doubao-seedance-2.0',
      'apimart/doubao-seedance-2.0-fast-face': 'doubao-seedance-2.0-fast-face',
      'apimart/doubao-seedance-2.0-face': 'doubao-seedance-2.0-face',
      'apimart/doubao-seedance-1-5-pro': 'doubao-seedance-1-5-pro',
      'apimart/doubao-seedance-1-0-pro-fast': 'doubao-seedance-1-0-pro-fast',
      'apimart/doubao-seedance-1-0-pro-quality': 'doubao-seedance-1-0-pro-quality',
    },
    model3 = value10[duration.model] || duration.model.replace('apimart/', ''),
    isApimartSeedanceVideoModel2 = isApimartSeedanceVideoModel(model3),
    enabled3 = model3.startsWith('doubao-seedance-2.0'),
    enabled4 = isApimartSeedance2PrivateAvatarModel(model3),
    value11 = model3 === 'doubao-seedance-1-5-pro',
    value12 = model3.startsWith('doubao-seedance-1-0-pro-'),
    value13 = model3 === 'doubao-seedance-1-0-pro-fast',
    list2 = [];
  if (Array.isArray(duration.videos)) list2.push(...duration.videos);
  if (Array.isArray(duration.videoUrls)) list2.push(...duration.videoUrls);
  const value14 = String(duration.videoUrl || '').trim();
  if (value14) list2.unshift(value14);
  const list3 = applyApimartPrivateAvatarAssetsToUrls(
    Array.from(new Set(list2.map((item2) => String(item2 || '').trim()).filter(Boolean))),
    duration,
    { sourceKind: 'video', enabled: enabled4 },
  );
  if (isApimartSeedanceVideoModel2 && !enabled3 && list3.length > 0)
    throw new Error('该 APIMart Seedance 模型暂不支持视频参考');
  const list4 =
    list3.length > 0 && (!isApimartSeedanceVideoModel2 || enabled3) && value8.processInputVideos
      ? await value8.processInputVideos(list3, apiKey2, { provider: 'apimart', strictUpload: true })
      : [];
  if (list3.length > 0 && list4.length <= 0) throw new Error('APIMART 源视频上传失败');
  const list5 = applyApimartPrivateAvatarAssetsToUrls(
    [
      String(duration.first || duration.firstFrameUrl || '').trim(),
      String(duration.last || duration.lastFrameUrl || '').trim(),
    ].filter(Boolean),
    duration,
    { sourceKind: 'image', enabled: enabled4 },
  );
  let list6 = [];
  if (value13 && list5.length > 1) throw new Error('Seedance 1.0 Pro Fast 不支持尾帧图，请切换 Quality 模型');
  if (isApimartSeedanceVideoModel2 && list5.length > 0 && value8.processInputImages) {
    const value15 = await value8.processInputImages(list5, apiKey2, {
        applyInputQualityProfile: true,
        provider: 'apimart',
        strictUpload: true,
      }),
      url = String(value15?.[0] || '').trim(),
      url2 = String(value15?.[1] || '').trim();
    list6 = [
      url ? { url: url, role: 'first_frame' } : null,
      url2 ? { url: url2, role: 'last_frame' } : null,
    ].filter(Boolean);
  }
  const value16 = Array.isArray(duration.images)
      ? duration.images
      : Array.isArray(duration.inputUrls)
        ? duration.inputUrls
        : [],
    list7 = applyApimartPrivateAvatarAssetsToUrls(value16, duration, {
      sourceKind: 'image',
      enabled: enabled4,
    }),
    value17 = isApimartSeedanceVideoModel2 && list6.length <= 0,
    list8 =
      value17 && list7.length > 0 && value8.processInputImages
        ? await value8.processInputImages(list7, apiKey2, {
            applyInputQualityProfile: true,
            provider: 'apimart',
            strictUpload: true,
          })
        : [],
    list9 = [];
  if (Array.isArray(duration.audios)) list9.push(...duration.audios);
  if (Array.isArray(duration.audioUrls)) list9.push(...duration.audioUrls);
  const value18 = String(duration.audioUrl || '').trim();
  if (value18) list9.unshift(value18);
  const list10 = applyApimartPrivateAvatarAssetsToUrls(
    Array.from(new Set(list9.map((item3) => String(item3 || '').trim()).filter(Boolean))),
    duration,
    { sourceKind: 'audio', enabled: enabled4 },
  );
  if (isApimartSeedanceVideoModel2 && !enabled3 && list10.length > 0)
    throw new Error('该 APIMart Seedance 模型暂不支持音频参考');
  const list11 =
    enabled3 && list10.length > 0 && value8.processInputAudios
      ? await value8.processInputAudios(list10, apiKey2, { provider: 'apimart', strictUpload: true })
      : [];
  if (isApimartSeedanceVideoModel2 && list10.length > 0 && list11.length <= 0)
    throw new Error('APIMART 源音频上传失败');
  if (isApimartSeedanceVideoModel2) {
    const args = {
      model: model3,
      prompt: prompt2,
      duration: duration.duration || 5,
      resolution: duration.resolution || (value12 ? '1080p' : '720p'),
    };
    enabled3
      ? (args.size = normalizeSeedanceVideoSize(duration.aspectRatio || duration.size))
      : (args.aspect_ratio = normalizeSeedanceAspectRatio(duration.aspectRatio || duration.aspect_ratio));
    if (isPresentValue(duration.seed)) args.seed = duration.seed;
    value11 && (duration.audio === true || duration.generateAudio === true) && (args.audio = true);
    value11 && duration.camerafixed === true && (args.camerafixed = true);
    if (list6.length > 0) args.image_with_roles = list6;
    else {
      if (list8.length > 0) {
        const value19 = enabled3 ? 9 : value11 ? 2 : 1;
        args.image_urls = list8.slice(0, value19);
      }
    }
    return (
      enabled3 && list6.length <= 0 && list4.length > 0 && (args.video_urls = list4.slice(0, 3)),
      enabled3 && list6.length <= 0 && list11.length > 0 && (args.audio_urls = list11.slice(0, 3)),
      {
        url: '/api/v2/proxy/image',
        headers: { 'Content-Type': 'application/json' },
        body: { apiUrl: apiUrl2 + '/v1/videos/generations', apiKey: apiKey2, ...args },
      }
    );
  }
  let enabled5 = '';
  if (list4.length > 0) enabled5 = String(list4[0] || '').trim();
  else {
    if (value14 && value8.processInputVideos) {
      const value20 = await value8.processInputVideos([value14], apiKey2, {
        provider: 'apimart',
        strictUpload: true,
      });
      enabled5 = String(value20?.[0] || '').trim();
      if (!enabled5) throw new Error('APIMART 源视频上传失败');
    }
  }
  const list12 =
      duration.inputUrls && duration.inputUrls.length > 0 && value8.processInputImages
        ? await value8.processInputImages(duration.inputUrls, apiKey2, {
            applyInputQualityProfile: true,
            provider: 'apimart',
            strictUpload: true,
          })
        : [],
    args2 = {
      model: model3,
      prompt: prompt2,
      size: duration.aspectRatio || '16:9',
      quality: duration.videoSize || 'standard',
    };
  if (duration.duration) args2.duration = duration.duration;
  if (duration.resolution) args2.resolution = duration.resolution;
  if (enabled5) args2.video_url = enabled5;
  if (list12.length > 0) args2.image_urls = list12;
  return {
    url: '/api/v2/proxy/image',
    headers: { 'Content-Type': 'application/json' },
    body: { apiUrl: apiUrl2 + '/v1/videos/generations', apiKey: apiKey2, ...args2 },
  };
}

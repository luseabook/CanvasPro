import { pickClosestRatio, resolveProviderRatioPayload } from '../imageRatioPolicy.js';
const PPIO_MIN_PIXELS = 0xa00 * 0x5a0,
  PPIO_MAX_PIXELS = 0x9ec290,
  PPIO_MIN_RATIO = 1 / 16,
  PPIO_MAX_RATIO = 16,
  PPIO_ALIGN_STEP = 64,
  PPIO_DEFAULT_SIZE = '2048x2048',
  PPIO_DEFAULT_QUALITY = '2K',
  PPIO_DEFAULT_RATIO = '1:1',
  PPIO_QUALITY_PIXEL_MAP = Object.freeze({
    '1K': 0x400 * 0x400,
    '2K': 0x800 * 0x800,
    '3K': 0xa00 * 0xa00,
    '4K': 0xb40 * 0xb40,
  }),
  PPIO_RATIO_OPTIONS = Object.freeze([
    Object.freeze({ label: '1:1', w: 1, h: 1 }),
    Object.freeze({ label: '9:16', w: 9, h: 16 }),
    Object.freeze({ label: '16:9', w: 16, h: 9 }),
    Object.freeze({ label: '3:4', w: 3, h: 4 }),
    Object.freeze({ label: '4:3', w: 4, h: 3 }),
    Object.freeze({ label: '3:2', w: 3, h: 2 }),
    Object.freeze({ label: '2:3', w: 2, h: 3 }),
    Object.freeze({ label: '5:4', w: 5, h: 4 }),
    Object.freeze({ label: '4:5', w: 4, h: 5 }),
    Object.freeze({ label: '21:9', w: 21, h: 9 }),
  ]),
  PPIO_RATIO_LABEL_SET = new Set(PPIO_RATIO_OPTIONS.map((item) => item.label));
function normalizePpioQuality(value) {
  const key = String(value || '')
    .trim()
    .toUpperCase();
  return PPIO_QUALITY_PIXEL_MAP[key] ? key : PPIO_DEFAULT_QUALITY;
}
function normalizePpioAspectRatioLabel(index) {
  const enabled = String(index || '').trim();
  if (!enabled) return PPIO_DEFAULT_RATIO;
  const list = enabled.replace(/[：∶]/g, ':').replace(/\s+/g, ''),
    result = list.toLowerCase();
  if (result === 'auto' || result === 'adaptive' || list === '自适应' || list === '默认')
    return PPIO_DEFAULT_RATIO;
  if (!list.includes(':')) return PPIO_DEFAULT_RATIO;
  const [data, options] = list.split(':'),
    count = Number.parseFloat(data),
    count2 = Number.parseFloat(options);
  if (!(count > 0 && count2 > 0)) return PPIO_DEFAULT_RATIO;
  const closestRatio = pickClosestRatio(count, count2, PPIO_RATIO_OPTIONS);
  return PPIO_RATIO_LABEL_SET.has(closestRatio) ? closestRatio : PPIO_DEFAULT_RATIO;
}
function calculatePpioSizeFromTargetPixels(target, source) {
  const [next, current] = String(source || PPIO_DEFAULT_RATIO).split(':'),
    entry = Number.parseFloat(next) || 1,
    record = Number.parseFloat(current) || 1,
    payload = Math.max(PPIO_MIN_RATIO, Math.min(PPIO_MAX_RATIO, entry / record)),
    handle = Math.max(
      PPIO_MIN_PIXELS,
      Math.min(PPIO_MAX_PIXELS, Number(target) || PPIO_QUALITY_PIXEL_MAP['2K']),
    );
  let state = Math.round(Math.sqrt(handle / payload)),
    config = Math.round(state * payload);
  return (
    (config = Math.max(PPIO_ALIGN_STEP, Math.round(config / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    (state = Math.max(PPIO_ALIGN_STEP, Math.round(state / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    config + 'x' + state
  );
}
function buildPpioSizeTable() {
  const scope = Object.entries(PPIO_QUALITY_PIXEL_MAP).map(([input, output]) => {
    const value2 = PPIO_RATIO_OPTIONS.map((item2) => [
      item2.label,
      calculatePpioSizeFromTargetPixels(output, item2.label),
    ]);
    return [input, Object.freeze(Object.fromEntries(value2))];
  });
  return Object.freeze(Object.fromEntries(scope));
}
const PPIO_SIZE_TABLE = buildPpioSizeTable();
function resolvePpioSize(value3, value4) {
  const ppioQuality = normalizePpioQuality(value3),
    ppioAspectRatioLabel = normalizePpioAspectRatioLabel(value4);
  return (
    PPIO_SIZE_TABLE?.[ppioQuality]?.[ppioAspectRatioLabel] ||
    PPIO_SIZE_TABLE?.[PPIO_DEFAULT_QUALITY]?.[PPIO_DEFAULT_RATIO] ||
    PPIO_DEFAULT_SIZE
  );
}
async function buildPpioSeedreamRequest(value5, model, prompt, value6, value7 = {}) {
  const { imageField: imageField = 'image', supportBatch: supportBatch = false } = value7,
    value8 = value6.getProviderConfig('ppio'),
    apiUrl = value8.apiUrl.replace(/\/+$/, ''),
    apiKey = value8.apiKey || model.apiKey;
  if (!apiKey) throw new Error('PPIO API Key 未配置，无法发起图像生成请求');
  const value9 = value6.getProviderConfig('grsai'),
    value10 = value9.apiKey || model.apiKey,
    list2 = await value6.processInputImages(model.inputUrls, value10, {
      applyInputQualityProfile: true,
      provider: 'grsai',
    });
  if (model.inputUrls?.length > 0 && list2.length === 0)
    throw new Error('参考素材上传云端失败，无法继续生成');
  const providerRatioPayload = resolveProviderRatioPayload({
      provider: 'ppio',
      model: model.model,
      ratioLabel: model.resolvedRatioLabel || model.aspectRatio,
      imageSize: model.imageSize,
      suppressAspectRatio: model.suppressAspectRatio,
    }),
    args = {
      prompt: prompt,
      watermark: false,
      ...(!model.suppressImageSize && {
        size: resolvePpioSize(model.imageSize, providerRatioPayload?.resolvedRatioLabel || model.aspectRatio),
      }),
    };
  return (
    value5 !== '4.0' && (args.optimize_prompt_options = { mode: 'standard' }),
    supportBatch && model.batchSize && model.batchSize > 1 && (args.max_images = model.batchSize),
    list2.length > 0 && (args[imageField] = list2),
    {
      url: '/api/v2/proxy/image',
      headers: { 'Content-Type': 'application/json' },
      body: { apiUrl: apiUrl + '/v3/seedream-' + value5, apiKey: apiKey, ...args },
    }
  );
}
export async function buildImageRequest(value11, value12, value13) {
  if (value11.model === 'ppio/seedream-5.0-lite')
    return buildPpioSeedreamRequest('5.0-lite', value11, value12, value13, { imageField: 'image' });
  if (value11.model === 'ppio/seedream-4.5')
    return buildPpioSeedreamRequest('4.5', value11, value12, value13, { imageField: 'image' });
  if (value11.model === 'ppio/seedream-4.0')
    return buildPpioSeedreamRequest('4.0', value11, value12, value13, {
      imageField: 'images',
      supportBatch: true,
    });
  throw new Error('PPIO 暂不支持模型 ' + (value11.model || '(未指定)'));
}
export function getTextProxyApiUrl(value14) {
  return value14 + '/openai/v1';
}

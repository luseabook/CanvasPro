import {
  normalizeRatioLabelText,
  parseRatioLabel,
  resolveProviderRatioPayload,
} from '../../imageRatioPolicy.js';
import {
  isRunningHubModelWithoutImageSizeParam,
  normalizeImageSizeForProviderModel,
  shouldOmitImageSizeParam,
} from '../../../src/modules/imageModelCapabilities.js';
import {
  NANO_BANANA_FAMILIES,
  getNanoBananaAllowedRatioLabels,
  normalizeNanoBananaRatioForFamily,
  resolveNanoBananaSelectionFromModel,
} from '../../../src/modules/nanoBananaModeRules.js';
import { resolveModelExecution } from '../../../src/manifests/index.js';
import {
  normalizeInputUrlsBySlot,
  normalizeInputUrlsBySlot as normalizeInputUrlsBySlot_2,
  stripPrefix,
} from './sharedResolverUtils.js';
const PPIO_MIN_PIXELS = 2560 * 1440,
  PPIO_MAX_PIXELS = 0x9ec290,
  PPIO_MIN_RATIO = 1 / 16,
  PPIO_MAX_RATIO = 16,
  PPIO_ALIGN_STEP = 64,
  PPIO_DEFAULT_SIZE = '2048x2048',
  PPIO_DEFAULT_QUALITY = '2K',
  PPIO_DEFAULT_RATIO = '1:1',
  PPIO_QUALITY_PIXEL_MAP = Object['freeze']({
    '1K': 1024 * 1024,
    '2K': 2048 * 2048,
    '3K': 2560 * 2560,
    '4K': 2880 * 2880,
  }),
  PPIO_RATIO_OPTIONS = Object['freeze']([
    Object['freeze']({ label: '1:1', w: 1, h: 1 }),
    Object['freeze']({ label: '9:16', w: 9, h: 16 }),
    Object['freeze']({ label: '16:9', w: 16, h: 9 }),
    Object['freeze']({ label: '3:4', w: 3, h: 4 }),
    Object['freeze']({ label: '4:3', w: 4, h: 3 }),
    Object['freeze']({ label: '3:2', w: 3, h: 2 }),
    Object['freeze']({ label: '2:3', w: 2, h: 3 }),
    Object['freeze']({ label: '5:4', w: 5, h: 4 }),
    Object['freeze']({ label: '4:5', w: 4, h: 5 }),
    Object['freeze']({ label: '21:9', w: 21, h: 9 }),
  ]),
  PPIO_RATIO_LABEL_SET = new Set(PPIO_RATIO_OPTIONS['map']((item) => item['label'])),
  RUNNINGHUB_MODEL_DIMENSION_MIN = 512,
  RUNNINGHUB_MODEL_DIMENSION_MAX = 8192,
  RUNNINGHUB_MODEL_DIMENSION_ALIGN = 8,
  RUNNINGHUB_MODEL_DEFAULT_QUALITY = '2K',
  RUNNINGHUB_MODEL_DEFAULT_RATIO = '1:1',
  RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP = Object['freeze']({
    '1K': 1024 * 1024,
    '2K': 2048 * 2048,
    '3K': 2560 * 2560,
    '4K': 2880 * 2880,
  }),
  RUNNINGHUB_MODEL_RATIO_LIST = Object['freeze']([
    '1:1',
    '9:16',
    '16:9',
    '3:4',
    '4:3',
    '3:2',
    '2:3',
    '5:4',
    '4:5',
    '21:9',
  ]),
  RUNNINGHUB_MODEL_RATIO_SET = new Set(RUNNINGHUB_MODEL_RATIO_LIST);
export function normalizeApimartGptImage2Resolution(key) {
  const index = String(key || '')
    ['trim']()
    ['toUpperCase']();
  if (index === '1K' || index === '2K' || index === '4K') return index['toLowerCase']();
  return '2k';
}
export function normalizeApimartNanoBanana2Resolution(result) {
  const data = String(result || '')
    ['trim']()
    ['toUpperCase']();
  if (data === '1K' || data === '2K' || data === '4K') return data;
  return '2K';
}
export function apimartGptImage2Image({ currentBody: currentBody2, payload: payload2 }) {
  return {
    ...currentBody2,
    resolution: normalizeApimartGptImage2Resolution(currentBody2['resolution'] || payload2['imageSize']),
  };
}
function hasApimartGrokImagineImageInput(list = []) {
  return Array['isArray'](list) && list['some']((options) => String(options || '')['trim']());
}
export function apimartGrokImagineImage({ currentBody: currentBody = {}, finalUrls: finalUrls = [] }) {
  const model = Array['isArray'](finalUrls) ? String(finalUrls[0] || '')['trim']() : '',
    target = {
      ...currentBody,
      model: model ? 'grok-imagine-1.5-edit-apimart' : 'grok-imagine-1.5-apimart',
    };
  delete target['image_urls'];
  if (model) target['image_url'] = model;
  else delete target['image_url'];
  return target;
}
export function apimartGrokImagineImageEndpoint({
  cfg: cfg,
  executionManifest: executionManifest,
  finalUrls: finalUrls = [],
}) {
  const source = String(cfg?.['apiUrl'] || '')['replace'](/\/+$/, ''),
    hasApimartGrokImagineImageInput2 = hasApimartGrokImagineImageInput(finalUrls)
      ? '/v1/images/edits'
      : String(executionManifest?.['endpoint'] || '/v1/images/generations')['trim']();
  return '' + source + (hasApimartGrokImagineImageInput2 || '/v1/images/generations');
}
function inferGeminiImageMimeType(next) {
  let current = '';
  try {
    const uRL = new URL(String(next || ''));
    if (uRL['protocol'] !== 'https:' && uRL['protocol'] !== 'http:') throw new Error('unsupported protocol');
    current = uRL['pathname']['toLowerCase']();
  } catch {
    throw new Error('Gemini image input upload did not return a public URL');
  }
  if (/\.jpe?g$/['test'](current)) return 'image/jpeg';
  if (/\.webp$/['test'](current)) return 'image/webp';
  if (/\.gif$/['test'](current)) return 'image/gif';
  if (/\.avif$/['test'](current)) return 'image/avif';
  return 'image/png';
}
export async function customProviderGeminiImage({
  currentBody: currentBody = {},
  finalPrompt: finalPrompt = '',
  finalUrls: finalUrls = [],
}) {
  const text = String(currentBody['prompt'] || finalPrompt || '')['trim'](),
    args =
      currentBody['generationConfig'] &&
      typeof currentBody['generationConfig'] === 'object' &&
      !Array['isArray'](currentBody['generationConfig'])
        ? currentBody['generationConfig']
        : {},
    entry = { ...currentBody };
  (delete entry['model'], delete entry['prompt']);
  const parts = [{ text: text }],
    record = Array['isArray'](finalUrls)
      ? finalUrls['map']((handle) => String(handle || '')['trim']())['filter'](Boolean)
      : [];
  for (const file_uri of record) {
    parts['push']({ file_data: { mime_type: inferGeminiImageMimeType(file_uri), file_uri: file_uri } });
  }
  return (
    (entry['contents'] = [{ role: 'user', parts: parts }]),
    (entry['generationConfig'] = { ...args, responseModalities: ['IMAGE'] }),
    entry
  );
}
export function customProviderGeminiImageEndpoint({
  cfg: cfg2,
  executionManifest: executionManifest2,
  modelToken: modelToken,
}) {
  const state = String(executionManifest2?.['endpoint'] || '')['trim']();
  if (!/^\/v1(?:alpha|beta)?\/models\/\{model\}:generateContent$/['test'](state))
    throw new Error('Invalid custom provider Gemini image endpoint template');
  const enabled = String(modelToken || '')['trim']();
  if (!enabled) throw new Error('Missing custom provider Gemini image model');
  let uRL2;
  try {
    uRL2 = new URL(String(cfg2?.['apiUrl'] || ''));
  } catch {
    throw new Error('Invalid custom provider Gemini image base URL');
  }
  if (uRL2['protocol'] !== 'https:' && uRL2['protocol'] !== 'http:')
    throw new Error('Invalid custom provider Gemini image base URL protocol');
  const config = state['replace']('{model}', encodeURIComponent(enabled));
  return new URL(config, uRL2['origin'])['toString']();
}
const APIMART_MIDJOURNEY_MODEL_OPTIONS = Object['freeze']({
  'v8.2': Object['freeze']({ version: '8.2', niji: ![] }),
  8.2: Object['freeze']({ version: '8.2', niji: ![] }),
  'v8.1': Object['freeze']({ version: '8.1', niji: ![] }),
  8.1: Object['freeze']({ version: '8.1', niji: ![] }),
  v7: Object['freeze']({ version: '7', niji: ![] }),
  7: Object['freeze']({ version: '7', niji: ![] }),
  'v6.1': Object['freeze']({ version: '6.1', niji: ![] }),
  6.1: Object['freeze']({ version: '6.1', niji: ![] }),
  'v5.2': Object['freeze']({ version: '5.2', niji: ![] }),
  5.2: Object['freeze']({ version: '5.2', niji: ![] }),
  'v5.1': Object['freeze']({ version: '5.1', niji: ![] }),
  5.1: Object['freeze']({ version: '5.1', niji: ![] }),
  niji7: Object['freeze']({ version: '7', niji: !![] }),
  'niji-7': Object['freeze']({ version: '7', niji: !![] }),
  'niji 7': Object['freeze']({ version: '7', niji: !![] }),
  niji6: Object['freeze']({ version: '6', niji: !![] }),
  'niji-6': Object['freeze']({ version: '6', niji: !![] }),
  'niji 6': Object['freeze']({ version: '6', niji: !![] }),
});
function resolveApimartMidjourneyModel(options2 = {}) {
  const scope =
      options2['mjModel'] ||
      options2['midjourneyModel'] ||
      options2['version'] ||
      options2['generationParams']?.['mjModel'] ||
      'v8.2',
    input = String(scope || '')
      ['trim']()
      ['toLowerCase']();
  return APIMART_MIDJOURNEY_MODEL_OPTIONS[input] || APIMART_MIDJOURNEY_MODEL_OPTIONS['v8.2'];
}
function normalizeApimartMidjourneyNumber(output, { integer: integer = ![] } = {}) {
  const enabled2 = String(output ?? '')['trim']();
  if (!enabled2 || enabled2['toLowerCase']() === 'auto' || enabled2['toLowerCase']() === 'none')
    return undefined;
  const value2 = Number(enabled2);
  if (!Number['isFinite'](value2)) return undefined;
  return integer ? Math['trunc'](value2) : value2;
}
function normalizeApimartMidjourneyBoolean(value3) {
  if (value3 === !![] || value3 === ![]) return value3;
  const enabled3 = String(value3 ?? '')
    ['trim']()
    ['toLowerCase']();
  if (!enabled3) return ![];
  return enabled3 === 'true' || enabled3 === '1' || enabled3 === 'yes';
}
function omitApimartMidjourneyAdaptiveSize(value4) {
  const enabled4 = String(value4 || '')['trim'](),
    value5 = enabled4['toLowerCase']();
  return (
    !enabled4 || enabled4 === '自适应' || value5 === 'auto' || value5 === 'adaptive' || value5 === 'default'
  );
}
function assignApimartMidjourneyNumber(value6, value7, value8, value9 = {}) {
  const apimartMidjourneyNumber = normalizeApimartMidjourneyNumber(value8, value9);
  if (apimartMidjourneyNumber !== undefined) value6[value7] = apimartMidjourneyNumber;
}
function assignApimartMidjourneyBoolean(value10, value11, value12) {
  if (normalizeApimartMidjourneyBoolean(value12)) value10[value11] = !![];
}
export function apimartMidjourneyImage({
  currentBody: currentBody = {},
  payload: payload = {},
  finalPrompt: finalPrompt2,
  finalUrls: finalUrls = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const version = resolveApimartMidjourneyModel(payload),
    inputUrlsBySlot = normalizeInputUrlsBySlot(finalUrlsBySlot),
    enabled5 = Object['keys'](inputUrlsBySlot)['length'] > 0,
    list2 = [];
  if (inputUrlsBySlot['imageUrl']) list2['push'](inputUrlsBySlot['imageUrl']);
  else
    !enabled5 &&
      Array['isArray'](finalUrls) &&
      finalUrls['map']((value13) => String(value13 || '')['trim']())
        ['filter'](Boolean)
        ['forEach']((value14) => {
          if (!list2['includes'](value14)) list2['push'](value14);
        });
  const value15 = {
    prompt: finalPrompt2 || currentBody['prompt'] || '',
    version: version['version'],
    ...(version['niji'] ? { niji: !![] } : {}),
  };
  !omitApimartMidjourneyAdaptiveSize(currentBody['size']) && (value15['size'] = currentBody['size']);
  const value16 = String(currentBody['speed'] || payload['speed'] || '')
    ['trim']()
    ['toLowerCase']();
  (value16 === 'relax' || value16 === 'fast' || value16 === 'turbo') && (value15['speed'] = value16);
  const value17 = String(currentBody['quality'] || payload['quality'] || '1')['trim']();
  if (value17) value15['quality'] = value17;
  if (list2['length'] > 0) value15['image_urls'] = list2;
  if (inputUrlsBySlot['cref']) value15['cref'] = inputUrlsBySlot['cref'];
  if (inputUrlsBySlot['sref']) value15['sref'] = inputUrlsBySlot['sref'];
  if (inputUrlsBySlot['dref']) value15['dref'] = inputUrlsBySlot['dref'];
  assignApimartMidjourneyNumber(value15, 'seed', currentBody['seed'], { integer: !![] });
  currentBody['negative_prompt'] &&
    (value15['negative_prompt'] = String(currentBody['negative_prompt'])['trim']());
  (assignApimartMidjourneyNumber(value15, 'stylize', currentBody['stylize'], { integer: !![] }),
    assignApimartMidjourneyNumber(value15, 'chaos', currentBody['chaos'], { integer: !![] }),
    assignApimartMidjourneyNumber(value15, 'weird', currentBody['weird'], { integer: !![] }));
  list2['length'] > 0 && assignApimartMidjourneyNumber(value15, 'iw', currentBody['iw']);
  inputUrlsBySlot['cref'] &&
    assignApimartMidjourneyNumber(value15, 'cw', currentBody['cw'], { integer: !![] });
  inputUrlsBySlot['sref'] &&
    assignApimartMidjourneyNumber(value15, 'sw', currentBody['sw'], { integer: !![] });
  inputUrlsBySlot['dref'] && assignApimartMidjourneyNumber(value15, 'dw', currentBody['dw']);
  const value18 =
    (!version['niji'] &&
      (version['version'] === '6.1' || version['version'] === '5.2' || version['version'] === '5.1')) ||
    (version['niji'] && version['version'] === '6');
  value18 && assignApimartMidjourneyNumber(value15, 'stop', currentBody['stop'], { integer: !![] });
  (assignApimartMidjourneyBoolean(value15, 'tile', currentBody['tile']),
    assignApimartMidjourneyBoolean(value15, 'raw', currentBody['raw']));
  (version['version'] === '8.2' || version['version'] === '8.1' || version['version'] === '7') &&
    assignApimartMidjourneyBoolean(value15, 'draft', currentBody['draft']);
  (version['version'] === '8.2' || version['version'] === '8.1') &&
    assignApimartMidjourneyBoolean(value15, 'hd', currentBody['hd']);
  if (currentBody['extra']) value15['extra'] = String(currentBody['extra'])['trim']();
  return value15;
}
function pickClosestPpioRatio(value19, value20) {
  const value21 = Number(value19 || 1) / Number(value20 || 1);
  let value22 = PPIO_RATIO_OPTIONS[0],
    value23 = Number['POSITIVE_INFINITY'];
  for (const value24 of PPIO_RATIO_OPTIONS) {
    const value25 = Math['abs'](value24['w'] / value24['h'] - value21);
    value25 < value23 && ((value23 = value25), (value22 = value24));
  }
  return value22['label'];
}
function normalizePpioQuality(value26) {
  const value27 = String(value26 || '')
    ['trim']()
    ['toUpperCase']();
  return PPIO_QUALITY_PIXEL_MAP[value27] ? value27 : PPIO_DEFAULT_QUALITY;
}
function normalizePpioAspectRatioLabel(value28) {
  const enabled6 = String(value28 || '')['trim']();
  if (!enabled6) return PPIO_DEFAULT_RATIO;
  const list3 = normalizeRatioLabelText(enabled6),
    value29 = list3['toLowerCase']();
  if (value29 === 'auto' || value29 === 'adaptive' || list3 === '自适应' || list3 === '默认')
    return PPIO_DEFAULT_RATIO;
  if (!list3['includes'](':')) return PPIO_DEFAULT_RATIO;
  const [value30, value31] = list3['split'](':'),
    count = Number['parseFloat'](value30),
    count2 = Number['parseFloat'](value31);
  if (!(count > 0 && count2 > 0)) return PPIO_DEFAULT_RATIO;
  const closestPpioRatio = pickClosestPpioRatio(count, count2);
  return PPIO_RATIO_LABEL_SET['has'](closestPpioRatio) ? closestPpioRatio : PPIO_DEFAULT_RATIO;
}
function calculatePpioSizeFromTargetPixels(value32, value33) {
  const [value34, value35] = String(value33 || PPIO_DEFAULT_RATIO)['split'](':'),
    value36 = Number['parseFloat'](value34) || 1,
    value37 = Number['parseFloat'](value35) || 1,
    value38 = Math['max'](PPIO_MIN_RATIO, Math['min'](PPIO_MAX_RATIO, value36 / value37)),
    value39 = Math['max'](
      PPIO_MIN_PIXELS,
      Math['min'](Number(value32) || PPIO_QUALITY_PIXEL_MAP['2K'], PPIO_MAX_PIXELS),
    );
  let value40 = Math['round'](Math['sqrt'](value39 / value38)),
    value41 = Math['round'](value40 * value38);
  return (
    (value41 = Math['max'](PPIO_ALIGN_STEP, Math['round'](value41 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    (value40 = Math['max'](PPIO_ALIGN_STEP, Math['round'](value40 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    value41 + 'x' + value40
  );
}
function resolvePpioSize(value42, value43) {
  const ppioQuality = normalizePpioQuality(value42),
    ppioAspectRatioLabel = normalizePpioAspectRatioLabel(value43),
    value44 = PPIO_QUALITY_PIXEL_MAP[ppioQuality] || PPIO_QUALITY_PIXEL_MAP['2K'];
  return calculatePpioSizeFromTargetPixels(value44, ppioAspectRatioLabel) || PPIO_DEFAULT_SIZE;
}
export function ppioImageSize({
  currentBody: currentBody3,
  payload: payload3,
  modelToken: modelToken2,
  finalUrls: finalUrls2,
  executionManifest: executionManifest3,
  modelManifest: modelManifest,
}) {
  const value45 = modelToken2 || stripPrefix(payload3['model'], 'ppio/'),
    value46 = { ...currentBody3 },
    args2 =
      executionManifest3?.['extensions']?.['ppioImage'] || modelManifest?.['extensions']?.['ppioImage'] || {};
  return (
    !payload3['suppressImageSize'] &&
      (value46['size'] = resolvePpioSize(
        payload3['imageSize'],
        payload3['resolvedRatioLabel'] || payload3['aspectRatio'],
      )),
    args2['optimizePromptOptions'] &&
      (value46['optimize_prompt_options'] = { ...args2['optimizePromptOptions'] }),
    args2['batchSizeField'] &&
      payload3['batchSize'] &&
      payload3['batchSize'] > 1 &&
      (value46[args2['batchSizeField']] = payload3['batchSize']),
    finalUrls2['length'] > 0 && (value46[args2['imageInputField'] || 'image'] = finalUrls2),
    value46
  );
}
function normalizeGrsaiImageModel(value47) {
  const enabled7 = String(value47 || '')['trim']();
  if (!enabled7) return 'nano-banana-pro-vt';
  return enabled7['replace'](/^grsai\//i, '');
}
const GRSAI_NANO_BANANA_IMAGE_SIZE_SET = new Set(['1K', '2K']),
  GRSAI_NANO_BANANA_4K_IMAGE_SIZE_SET = new Set(['1K', '2K', '4K']);
function getGrsaiNanoBananaSelection(value48) {
  const nanoBananaSelectionFromModel = resolveNanoBananaSelectionFromModel(value48, '2K', 'grsai');
  if (
    !nanoBananaSelectionFromModel ||
    nanoBananaSelectionFromModel['family'] === NANO_BANANA_FAMILIES['GPT_IMAGE_2']
  )
    return null;
  return nanoBananaSelectionFromModel;
}
function getGrsaiImageSizePolicy(value49) {
  const modelExecution = resolveModelExecution(value49, { providerHint: 'grsai' }),
    value50 = modelExecution?.['modelManifest']?.['extensions']?.['imageSizePolicy'];
  return value50 && typeof value50 === 'object' ? value50 : null;
}
function normalizeGrsaiNanoBananaImageSize(value51, value52 = '') {
  const grsaiImageSizePolicy = getGrsaiImageSizePolicy(value52),
    value53 = String(grsaiImageSizePolicy?.['fixedSize'] || '')
      ['trim']()
      ['toUpperCase']();
  if (value53) return value53;
  const value54 = String(value51 || '')
      ['trim']()
      ['toUpperCase'](),
    map = grsaiImageSizePolicy?.['allow4KSelection']
      ? GRSAI_NANO_BANANA_4K_IMAGE_SIZE_SET
      : GRSAI_NANO_BANANA_IMAGE_SIZE_SET;
  return map['has'](value54) ? value54 : '2K';
}
function getGrsaiGptImage2Policy(value55) {
  if (value55 && typeof value55 === 'object' && !Array['isArray'](value55)) return value55;
  const modelExecution2 = resolveModelExecution(value55, { providerHint: 'grsai' }),
    value56 = modelExecution2?.['modelManifest']?.['extensions']?.['gptImage2'];
  return value56 && typeof value56 === 'object' && !Array['isArray'](value56) ? value56 : null;
}
function getGrsaiGptImage2PixelSizesByRatio(value57) {
  const grsaiGptImage2Policy = getGrsaiGptImage2Policy(value57)?.['pixelSizesByRatio'];
  return grsaiGptImage2Policy &&
    typeof grsaiGptImage2Policy === 'object' &&
    !Array['isArray'](grsaiGptImage2Policy)
    ? grsaiGptImage2Policy
    : {};
}
function normalizeGrsaiNanoBananaAspectRatio(value58, value59) {
  const ratioLabelText = normalizeRatioLabelText(value58),
    value60 = ratioLabelText['toLowerCase']();
  if (
    !ratioLabelText ||
    value60 === 'auto' ||
    value60 === 'adaptive' ||
    value60 === 'default' ||
    ratioLabelText === '自适应' ||
    ratioLabelText === '默认'
  )
    return 'auto';
  const ratioLabel = parseRatioLabel(ratioLabelText);
  if (!ratioLabel) return 'auto';
  const value61 = ratioLabel['label'],
    map2 = new Set(getNanoBananaAllowedRatioLabels(value59));
  return map2['has'](value61) ? value61 : normalizeNanoBananaRatioForFamily(value61, value59);
}
function normalizeGrsaiGptImage2ImageSize(value62, value63) {
  const grsaiGptImage2Policy2 = getGrsaiGptImage2Policy(value63),
    map3 = new Set(
      (Array['isArray'](grsaiGptImage2Policy2?.['allowedSizes'])
        ? grsaiGptImage2Policy2['allowedSizes']
        : ['1K'])['map']((value64) =>
        String(value64 || '')
          ['trim']()
          ['toUpperCase'](),
      ),
    ),
    value65 = String(grsaiGptImage2Policy2?.['defaultSize'] || '1K')
      ['trim']()
      ['toUpperCase'](),
    value66 = String(value62 || '')
      ['trim']()
      ['toUpperCase']();
  if (map3['has'](value66)) return value66;
  return map3['has'](value65) ? value65 : '1K';
}
function normalizePixelSize(value67) {
  const enabled8 = String(value67 || '')
    ['trim']()
    ['match'](/^(\d{2,5})\s*[xX]\s*(\d{2,5})$/);
  if (!enabled8) return '';
  return enabled8[1] + 'x' + enabled8[2];
}
function getGrsaiGptImage2RatioOptionsForSize(value68, value69) {
  const grsaiGptImage2PixelSizesByRatio = getGrsaiGptImage2PixelSizesByRatio(value69);
  return Object['keys'](grsaiGptImage2PixelSizesByRatio)
    ['filter']((value70) => grsaiGptImage2PixelSizesByRatio[value70]?.[value68])
    ['map']((label2) => {
      const value71 = parseRatioLabel(label2) || { w: 1, h: 1 };
      return Object['freeze']({ label: label2, value: value71['w'] / value71['h'] });
    });
}
function getDefaultGrsaiGptImage2PixelSize(value72, value73) {
  return value72['1:1']?.[value73] || value72['1:1']?.['1K'] || '1024x1024';
}
function pickClosestGrsaiGptImage2RatioLabel(value74, value75, value76) {
  const ratioLabel2 = parseRatioLabel(value74),
    value77 = ratioLabel2 ? ratioLabel2['w'] / ratioLabel2['h'] : 1,
    grsaiGptImage2RatioOptionsForSize = getGrsaiGptImage2RatioOptionsForSize(value75, value76);
  let value78 = grsaiGptImage2RatioOptionsForSize[0] || { label: '1:1', value: 1 },
    value79 = Number['POSITIVE_INFINITY'];
  for (const el of grsaiGptImage2RatioOptionsForSize) {
    const value80 = Math['abs'](value77 - el['value']);
    value80 < value79 && ((value78 = el), (value79 = value80));
  }
  return value78?.['label'] || '1:1';
}
function normalizeGrsaiGptImage2AspectRatio(value81, value82, value83) {
  const grsaiGptImage2PixelSizesByRatio2 = getGrsaiGptImage2PixelSizesByRatio(value83),
    pixelSize = normalizePixelSize(value81);
  if (pixelSize) return pixelSize;
  const ratioLabelText2 = normalizeRatioLabelText(value81),
    value84 = ratioLabelText2['toLowerCase']();
  if (
    !ratioLabelText2 ||
    value84 === 'auto' ||
    value84 === 'adaptive' ||
    value84 === 'default' ||
    ratioLabelText2 === '自适应' ||
    ratioLabelText2 === '默认'
  )
    return getDefaultGrsaiGptImage2PixelSize(grsaiGptImage2PixelSizesByRatio2, value82);
  const ratioLabel3 = parseRatioLabel(ratioLabelText2),
    value85 = ratioLabel3?.['label'] || '1:1',
    value86 = grsaiGptImage2PixelSizesByRatio2[value85]?.[value82];
  if (value86) return value86;
  const closestGrsaiGptImage2RatioLabel = pickClosestGrsaiGptImage2RatioLabel(value85, value82, value83);
  return (
    grsaiGptImage2PixelSizesByRatio2[closestGrsaiGptImage2RatioLabel]?.[value82] ||
    getDefaultGrsaiGptImage2PixelSize(grsaiGptImage2PixelSizesByRatio2, value82)
  );
}
export function grsaiImage({
  payload: payload4,
  finalPrompt: finalPrompt3,
  modelToken: modelToken3,
  finalUrls: finalUrls3,
}) {
  const model2 = normalizeGrsaiImageModel(modelToken3 || payload4['model'] || 'nano-banana-pro-vt'),
    grsaiNanoBananaSelection = getGrsaiNanoBananaSelection(model2),
    value87 = payload4['resolvedRatioLabel'] || payload4['aspectRatio'],
    aspectRatio2 = grsaiNanoBananaSelection
      ? normalizeGrsaiNanoBananaAspectRatio(value87, grsaiNanoBananaSelection['family'])
      : value87,
    imageSize2 = grsaiNanoBananaSelection
      ? normalizeGrsaiNanoBananaImageSize(payload4['imageSize'], model2)
      : payload4['imageSize'] || '2K';
  return {
    model: model2,
    prompt: finalPrompt3,
    images: finalUrls3,
    replyType: 'json',
    ...(!payload4['suppressImageSize'] && !shouldOmitImageSizeParam(model2) && { imageSize: imageSize2 }),
    ...(!payload4['suppressAspectRatio'] && aspectRatio2 && { aspectRatio: aspectRatio2 }),
  };
}
export function grsaiGptImage2Image({
  payload: payload5,
  finalPrompt: finalPrompt4,
  modelToken: modelToken4,
  finalUrls: finalUrls4,
  currentBody: currentBody = {},
  executionManifest: executionManifest4,
}) {
  const model3 = normalizeGrsaiImageModel(modelToken4 || payload5['model'] || 'gpt-image-2'),
    value88 = payload5['generationParams']?.['mode'] ?? payload5['mode'],
    value89 =
      executionManifest4?.['extensions']?.['gptImage2ByMode']?.[value88] ||
      executionManifest4?.['extensions']?.['gptImage2'] ||
      model3,
    value90 = payload5['generationParams']?.['aspectRatio'],
    grsaiGptImage2ImageSize = normalizeGrsaiGptImage2ImageSize(
      payload5['generationParams']?.['imageSize'] ?? payload5['imageSize'],
      value89,
    ),
    aspectRatio3 = normalizeGrsaiGptImage2AspectRatio(
      (!isAdaptiveRatioInput(value90) ? value90 : payload5['resolvedRatioLabel']) || payload5['aspectRatio'],
      grsaiGptImage2ImageSize,
      value89,
    );
  return {
    ...currentBody,
    model: model3,
    prompt: finalPrompt4,
    images: finalUrls4,
    replyType: currentBody['replyType'] || 'json',
    ...(!payload5['suppressAspectRatio'] && aspectRatio3 && { aspectRatio: aspectRatio3 }),
  };
}
function normalizeRunningHubModelId(value91) {
  return stripPrefix(value91, 'runninghub-model/');
}
function getRunningHubImageExecutionPolicy({
  executionManifest: executionManifest5,
  modelManifest: modelManifest2,
} = {}) {
  const value92 =
    executionManifest5?.['extensions']?.['runningHubImage'] ||
    modelManifest2?.['extensions']?.['runningHubImage'];
  return value92 && typeof value92 === 'object' && !Array['isArray'](value92) ? value92 : {};
}
function normalizeRunningHubImageRoute(options3 = {}) {
  const value93 = String(options3?.['rhModelRoute'] ?? options3?.['generationParams']?.['rhModelRoute'] ?? '')
    ['trim']()
    ['toLowerCase']();
  return value93 || 'low';
}
function isPlainRunningHubPolicyObject(value94) {
  return value94 && typeof value94 === 'object' && !Array['isArray'](value94);
}
function pickRunningHubRouteValue(value95, value96) {
  if (!isPlainRunningHubPolicyObject(value95)) return undefined;
  if (Object['prototype']['hasOwnProperty']['call'](value95, value96)) return value95[value96];
  if (Object['prototype']['hasOwnProperty']['call'](value95, 'default')) return value95['default'];
  return undefined;
}
function pickRunningHubPolicyValue(value97, value98, value99) {
  const runningHubRouteValue = pickRunningHubRouteValue(value97?.[value98 + 'ByRoute'], value99);
  return runningHubRouteValue !== undefined ? runningHubRouteValue : value97?.[value98];
}
function mergeRunningHubRoutePolicyObject(value100, value101, value102) {
  const args3 = isPlainRunningHubPolicyObject(value100?.[value101]) ? value100[value101] : {},
    args4 = pickRunningHubRouteValue(value100?.[value101 + 'ByRoute'], value102);
  if (!isPlainRunningHubPolicyObject(args4)) return args3;
  return { ...args3, ...args4 };
}
function resolveRunningHubImageRoutePolicy(args5, value103 = {}) {
  const route = normalizeRunningHubImageRoute(value103);
  return {
    ...args5,
    route: route,
    textEndpoint: pickRunningHubPolicyValue(args5, 'textEndpoint', route),
    inputEndpoint: pickRunningHubPolicyValue(args5, 'inputEndpoint', route),
    omitResolution: pickRunningHubPolicyValue(args5, 'omitResolution', route),
    quality: pickRunningHubPolicyValue(args5, 'quality', route),
    omitAspectRatio: pickRunningHubPolicyValue(args5, 'omitAspectRatio', route),
    aspectRatioValueMap: pickRunningHubPolicyValue(args5, 'aspectRatioValueMap', route),
    omitAspectRatioWhenInput: pickRunningHubPolicyValue(args5, 'omitAspectRatioWhenInput', route),
    inputSlotBodyFields: pickRunningHubPolicyValue(args5, 'inputSlotBodyFields', route),
    constantParams: mergeRunningHubRoutePolicyObject(args5, 'constantParams', route),
    defaultParams: mergeRunningHubRoutePolicyObject(args5, 'defaultParams', route),
    bodyParamTypes: mergeRunningHubRoutePolicyObject(args5, 'bodyParamTypes', route),
    bodyParamInputModes: mergeRunningHubRoutePolicyObject(args5, 'bodyParamInputModes', route),
  };
}
function resolveRunningHubModelEndpoint({
  hasInputImages: hasInputImages2,
  executionManifest: executionManifest6,
  modelManifest: modelManifest3,
  payload: payload6,
}) {
  const runningHubImageRoutePolicy = resolveRunningHubImageRoutePolicy(
    getRunningHubImageExecutionPolicy({
      executionManifest: executionManifest6,
      modelManifest: modelManifest3,
    }),
    payload6,
  );
  if (!hasInputImages2) return runningHubImageRoutePolicy['textEndpoint'] || 'text-to-image';
  return runningHubImageRoutePolicy['inputEndpoint'] || 'image-to-image';
}
function normalizeRunningHubBodyParamValue(value104, value105) {
  const value106 = String(value105 || 'string')
    ['trim']()
    ['toLowerCase']();
  if (value106 === 'boolean') {
    if (value104 === !![] || value104 === ![]) return value104;
    const value107 = String(value104 ?? '')
      ['trim']()
      ['toLowerCase']();
    if (['true', '1', 'yes', 'on']['includes'](value107)) return !![];
    if (['false', '0', 'no', 'off', '']['includes'](value107)) return ![];
    return Boolean(value104);
  }
  if (value106 === 'integer') {
    const value108 = Number['parseInt'](String(value104 ?? '')['trim'](), 10);
    return Number['isFinite'](value108) ? value108 : null;
  }
  if (value106 === 'number') {
    const value109 = Number(value104);
    return Number['isFinite'](value109) ? value109 : null;
  }
  return String(value104 ?? '')['trim']();
}
function normalizeRunningHubAspectRatioValueMap(value110) {
  return value110 && typeof value110 === 'object' && !Array['isArray'](value110) ? value110 : {};
}
function hasRunningHubAspectRatioValueMap(value111) {
  return (
    Object['keys'](normalizeRunningHubAspectRatioValueMap(value111?.['aspectRatioValueMap']))['length'] > 0
  );
}
function resolveRunningHubMappedAspectRatio(value112, value113) {
  const enabled9 = String(value112 || '')['trim']();
  if (!enabled9) return '';
  const runningHubAspectRatioValueMap = normalizeRunningHubAspectRatioValueMap(
      value113?.['aspectRatioValueMap'],
    ),
    list4 = Object['entries'](runningHubAspectRatioValueMap)
      ['map'](([value114, value115]) => [normalizeRatioLabelText(value114), String(value115 || '')['trim']()])
      ['filter'](([value116, value117]) => value116 && value117);
  if (list4['length'] === 0) return enabled9;
  const ratioLabelText3 = normalizeRatioLabelText(enabled9),
    value118 = list4['find'](([value119]) => value119 === ratioLabelText3);
  if (value118) return value118[1];
  const value120 = ratioLabelText3['toLowerCase'](),
    value121 = list4['find'](([, value122]) => value122['toLowerCase']() === value120);
  if (value121) return value121[1];
  const ratioLabel4 = parseRatioLabel(ratioLabelText3);
  if (!ratioLabel4) return enabled9;
  const value123 = ratioLabel4['w'] / ratioLabel4['h'];
  let value124 = null,
    value125 = Number['POSITIVE_INFINITY'];
  return (
    list4['forEach'](([value126, value127]) => {
      const ratioLabel5 = parseRatioLabel(value126);
      if (!ratioLabel5) return;
      const value128 = Math['abs'](ratioLabel5['w'] / ratioLabel5['h'] - value123);
      value128 < value125 && ((value124 = value127), (value125 = value128));
    }),
    value124 || enabled9
  );
}
function assignRunningHubInputSlotFields(value129, value130, value131) {
  const enabled10 =
    value130?.['inputSlotBodyFields'] &&
    typeof value130['inputSlotBodyFields'] === 'object' &&
    !Array['isArray'](value130['inputSlotBodyFields'])
      ? value130['inputSlotBodyFields']
      : null;
  if (!enabled10) return {};
  const inputUrlsBySlot_2 = normalizeInputUrlsBySlot_2(value131);
  return (
    Object['entries'](enabled10)['forEach'](([value132, value133]) => {
      const value134 = String(value133 || '')['trim'](),
        value135 = inputUrlsBySlot_2[String(value132 || '')['trim']()];
      if (value134 && value135) value129[value134] = value135;
    }),
    inputUrlsBySlot_2
  );
}
function shouldIncludeRunningHubPolicyParam(value136, value137, enabled11) {
  const value138 =
      value137?.['conditionalParams'] &&
      typeof value137['conditionalParams'] === 'object' &&
      !Array['isArray'](value137['conditionalParams'])
        ? value137['conditionalParams']
        : {},
    enabled12 = String(value138[value136] || '')['trim']();
  if (!enabled12) return !![];
  return !!enabled11?.[enabled12];
}
function shouldIncludeRunningHubParamForInputMode(value139, value140, enabled13) {
  const value141 =
      value140?.['bodyParamInputModes'] &&
      typeof value140['bodyParamInputModes'] === 'object' &&
      !Array['isArray'](value140['bodyParamInputModes'])
        ? value140['bodyParamInputModes']
        : {},
    enabled14 = String(value141[value139] || '')
      ['trim']()
      ['toLowerCase']();
  if (!enabled14) return !![];
  if (enabled14 === 'textonly' || enabled14 === 'text-only') return !enabled13;
  if (enabled14 === 'inputonly' || enabled14 === 'input-only') return enabled13;
  return !![];
}
function assignRunningHubPolicyParams(
  value142,
  value143,
  value144,
  value145,
  { hasInputImages: hasInputImages = ![] } = {},
) {
  const value146 =
    value144?.['constantParams'] &&
    typeof value144['constantParams'] === 'object' &&
    !Array['isArray'](value144['constantParams'])
      ? value144['constantParams']
      : {};
  Object['entries'](value146)['forEach'](([value147, value148]) => {
    if (!shouldIncludeRunningHubPolicyParam(value147, value144, value145)) return;
    if (!shouldIncludeRunningHubParamForInputMode(value147, value144, hasInputImages)) return;
    value142[value147] = value148;
  });
  const value149 =
    value144?.['bodyParamTypes'] &&
    typeof value144['bodyParamTypes'] === 'object' &&
    !Array['isArray'](value144['bodyParamTypes'])
      ? value144['bodyParamTypes']
      : {};
  Object['entries'](value149)['forEach'](([value150, value151]) => {
    if (Object['prototype']['hasOwnProperty']['call'](value142, value150)) return;
    if (!Object['prototype']['hasOwnProperty']['call'](value143 || {}, value150)) return;
    if (!shouldIncludeRunningHubPolicyParam(value150, value144, value145)) return;
    if (!shouldIncludeRunningHubParamForInputMode(value150, value144, hasInputImages)) return;
    const value152 = value143[value150];
    if (value152 === undefined || value152 === null) return;
    if (typeof value152 === 'string' && value152['trim']() === '') return;
    const runningHubBodyParamValue = normalizeRunningHubBodyParamValue(value152, value151);
    if (runningHubBodyParamValue === null || runningHubBodyParamValue === '') return;
    value142[value150] = runningHubBodyParamValue;
  });
  const value153 =
    value144?.['defaultParams'] &&
    typeof value144['defaultParams'] === 'object' &&
    !Array['isArray'](value144['defaultParams'])
      ? value144['defaultParams']
      : {};
  Object['entries'](value153)['forEach'](([value154, value155]) => {
    if (Object['prototype']['hasOwnProperty']['call'](value142, value154)) return;
    if (!shouldIncludeRunningHubPolicyParam(value154, value144, value145)) return;
    if (!shouldIncludeRunningHubParamForInputMode(value154, value144, hasInputImages)) return;
    value142[value154] = value155;
  });
}
function normalizeRunningHubModelQuality(value156) {
  const value157 = String(value156 || '')
    ['trim']()
    ['toUpperCase']();
  return RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[value157] ? value157 : RUNNINGHUB_MODEL_DEFAULT_QUALITY;
}
function normalizeRunningHubModelRatio(value158) {
  const enabled15 = String(value158 || '')['trim']();
  if (!enabled15) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const list5 = normalizeRatioLabelText(enabled15),
    value159 = list5['toLowerCase']();
  if (value159 === 'auto' || value159 === 'default' || value159 === 'original' || value159 === 'adaptive')
    return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  if (!list5['includes'](':')) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const [value160, value161] = list5['split'](':'),
    count3 = Number['parseFloat'](value160),
    count4 = Number['parseFloat'](value161);
  if (!(count3 > 0 && count4 > 0)) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const value162 = count3 + ':' + count4;
  return RUNNINGHUB_MODEL_RATIO_SET['has'](value162) ? value162 : RUNNINGHUB_MODEL_DEFAULT_RATIO;
}
function alignRunningHubDimension(value163) {
  const value164 =
    Math['round'](Number(value163 || 0) / RUNNINGHUB_MODEL_DIMENSION_ALIGN) *
    RUNNINGHUB_MODEL_DIMENSION_ALIGN;
  return Math['max'](RUNNINGHUB_MODEL_DIMENSION_MIN, Math['min'](RUNNINGHUB_MODEL_DIMENSION_MAX, value164));
}
function resolveRunningHubModelDimensions(value165, value166) {
  const runningHubModelQuality = normalizeRunningHubModelQuality(value165),
    runningHubModelRatio = normalizeRunningHubModelRatio(value166),
    [value167, value168] = runningHubModelRatio['split'](':'),
    value169 = Number['parseFloat'](value167) || 1,
    value170 = Number['parseFloat'](value168) || 1,
    value171 =
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[runningHubModelQuality] ||
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[RUNNINGHUB_MODEL_DEFAULT_QUALITY],
    value172 = value169 / value170,
    value173 = Math['sqrt'](value171 / value172),
    value174 = value173 * value172;
  return { width: alignRunningHubDimension(value174), height: alignRunningHubDimension(value173) };
}
function isAdaptiveRatioInput(value175) {
  const enabled16 = String(value175 || '')['trim']();
  if (!enabled16) return !![];
  const list6 = normalizeRatioLabelText(enabled16),
    value176 = list6['toLowerCase']();
  if (/^\d+x\d+$/i['test'](list6)) return ![];
  return (
    value176 === 'auto' ||
    value176 === 'default' ||
    value176 === 'adaptive' ||
    value176 === 'original' ||
    !list6['includes'](':')
  );
}
export function runninghubImage({
  payload: payload7,
  finalPrompt: finalPrompt5,
  modelToken: modelToken5,
  finalUrls: finalUrls5,
  finalUrlsBySlot: finalUrlsBySlot = {},
  executionManifest: executionManifest7,
  modelManifest: modelManifest4,
}) {
  const runningHubModelId = normalizeRunningHubModelId(modelToken5),
    quality = resolveRunningHubImageRoutePolicy(
      getRunningHubImageExecutionPolicy({
        executionManifest: executionManifest7,
        modelManifest: modelManifest4,
      }),
      payload7,
    ),
    model4 = modelManifest4?.['modelId'] || 'runninghub-model/' + runningHubModelId,
    enabled17 =
      quality['omitResolution'] === !![] || isRunningHubModelWithoutImageSizeParam(payload7['model']),
    imageSize3 =
      normalizeImageSizeForProviderModel({
        model: model4,
        provider: 'runninghub',
        imageSize: payload7['imageSize'],
      }) || payload7['imageSize'],
    value177 = { '1K': '1k', '2K': '2k', '4K': '4k' },
    resolution = value177[imageSize3] || '2k',
    providerRatioPayload = resolveProviderRatioPayload({
      provider: 'runninghub',
      model: 'runninghub-model/' + runningHubModelId,
      ratioLabel: payload7['resolvedRatioLabel'] || payload7['aspectRatio'],
      imageSize: imageSize3,
      suppressAspectRatio: payload7['suppressAspectRatio'],
    }),
    value178 = String(providerRatioPayload?.['params']?.['aspectRatio'] || '')['trim'](),
    value179 = payload7['resolvedRatioLabel'] || payload7['aspectRatio'],
    aspectRatio4 = resolveRunningHubMappedAspectRatio(
      hasRunningHubAspectRatioValueMap(quality) ? value179 || value178 : value178,
      quality,
    ),
    value180 = aspectRatio4['toLowerCase'](),
    value181 =
      quality['aspectRatioMode'] === 'dimensions' ||
      modelManifest4?.['extensions']?.['ratioPolicy']?.['capability'] === 'dimensions',
    width = value181
      ? providerRatioPayload?.['ratioCapability'] === 'dimensions'
        ? {
            width: Number(providerRatioPayload?.['params']?.['width']) || 2048,
            height: Number(providerRatioPayload?.['params']?.['height']) || 2048,
          }
        : resolveRunningHubModelDimensions(imageSize3, payload7['aspectRatio'])
      : null,
    enabled18 =
      value181 ||
      quality['omitAspectRatio'] === !![] ||
      (quality['omitAspectRatioWhenInput'] === !![] && finalUrls5['length'] > 0) ||
      payload7['suppressAspectRatio'] ||
      isAdaptiveRatioInput(value179) ||
      !aspectRatio4 ||
      value180 === 'auto' ||
      value180 === 'default' ||
      value180 === 'adaptive' ||
      value180 === 'original',
    value182 = {
      prompt: finalPrompt5 || '',
      ...(value181
        ? { width: width?.['width'] || 2048, height: width?.['height'] || 2048 }
        : !enabled17
          ? { resolution: resolution }
          : {}),
      ...(quality['quality'] ? { quality: quality['quality'] } : {}),
      ...(!enabled18 && { aspectRatio: aspectRatio4 }),
      ...(payload7['negativePrompt'] && { negativePrompt: payload7['negativePrompt'] }),
      ...(payload7['seed'] && { seed: payload7['seed'] }),
    },
    assignRunningHubInputSlotFields2 = assignRunningHubInputSlotFields(value182, quality, finalUrlsBySlot);
  return (
    assignRunningHubPolicyParams(value182, payload7, quality, assignRunningHubInputSlotFields2, {
      hasInputImages: finalUrls5['length'] > 0,
    }),
    finalUrls5['length'] > 0 && !quality['inputSlotBodyFields'] && (value182['imageUrls'] = finalUrls5),
    value182
  );
}
export function runninghubImageEndpoint({
  modelToken: modelToken6,
  finalUrls: finalUrls6,
  executionManifest: executionManifest8,
  modelManifest: modelManifest5,
  payload: payload8,
}) {
  const runningHubModelId2 = normalizeRunningHubModelId(modelToken6),
    runningHubModelEndpoint = resolveRunningHubModelEndpoint({
      hasInputImages: finalUrls6['length'] > 0,
      executionManifest: executionManifest8,
      modelManifest: modelManifest5,
      payload: payload8,
    });
  return 'https://www.runninghub.cn/openapi/v2/' + runningHubModelId2 + '/' + runningHubModelEndpoint;
}

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
const PPIO_MIN_PIXELS = 0xa00 * 0x5a0,
  PPIO_MAX_PIXELS = 0x9ec290,
  PPIO_MIN_RATIO = 0x1 / 0x10,
  PPIO_MAX_RATIO = 0x10,
  PPIO_ALIGN_STEP = 0x40,
  PPIO_DEFAULT_SIZE = '2048x2048',
  PPIO_DEFAULT_QUALITY = '2K',
  PPIO_DEFAULT_RATIO = '1:1',
  PPIO_QUALITY_PIXEL_MAP = Object['freeze']({
    '1K': 0x400 * 0x400,
    '2K': 0x800 * 0x800,
    '3K': 0xa00 * 0xa00,
    '4K': 0xb40 * 0xb40,
  }),
  PPIO_RATIO_OPTIONS = Object['freeze']([
    Object['freeze']({ label: '1:1', w: 0x1, h: 0x1 }),
    Object['freeze']({ label: '9:16', w: 0x9, h: 0x10 }),
    Object['freeze']({ label: '16:9', w: 0x10, h: 0x9 }),
    Object['freeze']({ label: '3:4', w: 0x3, h: 0x4 }),
    Object['freeze']({ label: '4:3', w: 0x4, h: 0x3 }),
    Object['freeze']({ label: '3:2', w: 0x3, h: 0x2 }),
    Object['freeze']({ label: '2:3', w: 0x2, h: 0x3 }),
    Object['freeze']({ label: '5:4', w: 0x5, h: 0x4 }),
    Object['freeze']({ label: '4:5', w: 0x4, h: 0x5 }),
    Object['freeze']({ label: '21:9', w: 0x15, h: 0x9 }),
  ]),
  PPIO_RATIO_LABEL_SET = new Set(PPIO_RATIO_OPTIONS['map']((_0x3a29cc) => _0x3a29cc['label'])),
  RUNNINGHUB_MODEL_DIMENSION_MIN = 0x200,
  RUNNINGHUB_MODEL_DIMENSION_MAX = 0x2000,
  RUNNINGHUB_MODEL_DIMENSION_ALIGN = 0x8,
  RUNNINGHUB_MODEL_DEFAULT_QUALITY = '2K',
  RUNNINGHUB_MODEL_DEFAULT_RATIO = '1:1',
  RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP = Object['freeze']({
    '1K': 0x400 * 0x400,
    '2K': 0x800 * 0x800,
    '3K': 0xa00 * 0xa00,
    '4K': 0xb40 * 0xb40,
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
export function normalizeApimartGptImage2Resolution(_0x53e526) {
  const _0x336467 = String(_0x53e526 || '')
    ['trim']()
    ['toUpperCase']();
  if (_0x336467 === '1K' || _0x336467 === '2K' || _0x336467 === '4K') return _0x336467['toLowerCase']();
  return '2k';
}
export function normalizeApimartNanoBanana2Resolution(_0x47d7f3) {
  const _0x3bda88 = String(_0x47d7f3 || '')
    ['trim']()
    ['toUpperCase']();
  if (_0x3bda88 === '1K' || _0x3bda88 === '2K' || _0x3bda88 === '4K') return _0x3bda88;
  return '2K';
}
export function apimartGptImage2Image({ currentBody: _0x41aafb, payload: _0x1afbf4 }) {
  return {
    ..._0x41aafb,
    resolution: normalizeApimartGptImage2Resolution(_0x41aafb['resolution'] || _0x1afbf4['imageSize']),
  };
}
function hasApimartGrokImagineImageInput(_0x35f20c = []) {
  return Array['isArray'](_0x35f20c) && _0x35f20c['some']((_0x69ad06) => String(_0x69ad06 || '')['trim']());
}
export function apimartGrokImagineImage({ currentBody: currentBody = {}, finalUrls: finalUrls = [] }) {
  const _0x8b2cd7 = Array['isArray'](finalUrls) ? String(finalUrls[0x0] || '')['trim']() : '',
    _0x3826a9 = {
      ...currentBody,
      model: _0x8b2cd7 ? 'grok-imagine-1.5-edit-apimart' : 'grok-imagine-1.5-apimart',
    };
  delete _0x3826a9['image_urls'];
  if (_0x8b2cd7) _0x3826a9['image_url'] = _0x8b2cd7;
  else delete _0x3826a9['image_url'];
  return _0x3826a9;
}
export function apimartGrokImagineImageEndpoint({
  cfg: _0x3fb302,
  executionManifest: _0x214991,
  finalUrls: finalUrls = [],
}) {
  const _0x1be383 = String(_0x3fb302?.['apiUrl'] || '')['replace'](/\/+$/, ''),
    _0x1b12cb = hasApimartGrokImagineImageInput(finalUrls)
      ? '/v1/images/edits'
      : String(_0x214991?.['endpoint'] || '/v1/images/generations')['trim']();
  return '' + _0x1be383 + (_0x1b12cb || '/v1/images/generations');
}
function inferGeminiImageMimeType(_0x5455b0) {
  let _0xe475a0 = '';
  try {
    const _0x334235 = new URL(String(_0x5455b0 || ''));
    if (_0x334235['protocol'] !== 'https:' && _0x334235['protocol'] !== 'http:')
      throw new Error('unsupported protocol');
    _0xe475a0 = _0x334235['pathname']['toLowerCase']();
  } catch {
    throw new Error('Gemini image input upload did not return a public URL');
  }
  if (/\.jpe?g$/['test'](_0xe475a0)) return 'image/jpeg';
  if (/\.webp$/['test'](_0xe475a0)) return 'image/webp';
  if (/\.gif$/['test'](_0xe475a0)) return 'image/gif';
  if (/\.avif$/['test'](_0xe475a0)) return 'image/avif';
  return 'image/png';
}
export async function customProviderGeminiImage({
  currentBody: currentBody = {},
  finalPrompt: finalPrompt = '',
  finalUrls: finalUrls = [],
}) {
  const _0x1121e3 = String(currentBody['prompt'] || finalPrompt || '')['trim'](),
    _0x13e817 =
      currentBody['generationConfig'] &&
      typeof currentBody['generationConfig'] === 'object' &&
      !Array['isArray'](currentBody['generationConfig'])
        ? currentBody['generationConfig']
        : {},
    _0x49eefb = { ...currentBody };
  (delete _0x49eefb['model'], delete _0x49eefb['prompt']);
  const _0x3b9817 = [{ text: _0x1121e3 }],
    _0x33ce4d = Array['isArray'](finalUrls)
      ? finalUrls['map']((_0x30278b) => String(_0x30278b || '')['trim']())['filter'](Boolean)
      : [];
  for (const _0x5560de of _0x33ce4d) {
    _0x3b9817['push']({ file_data: { mime_type: inferGeminiImageMimeType(_0x5560de), file_uri: _0x5560de } });
  }
  return (
    (_0x49eefb['contents'] = [{ role: 'user', parts: _0x3b9817 }]),
    (_0x49eefb['generationConfig'] = { ..._0x13e817, responseModalities: ['IMAGE'] }),
    _0x49eefb
  );
}
export function customProviderGeminiImageEndpoint({
  cfg: _0x2f65fb,
  executionManifest: _0x5460e3,
  modelToken: _0x1bd637,
}) {
  const _0x6cdac1 = String(_0x5460e3?.['endpoint'] || '')['trim']();
  if (!/^\/v1(?:alpha|beta)?\/models\/\{model\}:generateContent$/['test'](_0x6cdac1))
    throw new Error('Invalid custom provider Gemini image endpoint template');
  const _0x2a5d9b = String(_0x1bd637 || '')['trim']();
  if (!_0x2a5d9b) throw new Error('Missing custom provider Gemini image model');
  let _0x2800a2;
  try {
    _0x2800a2 = new URL(String(_0x2f65fb?.['apiUrl'] || ''));
  } catch {
    throw new Error('Invalid custom provider Gemini image base URL');
  }
  if (_0x2800a2['protocol'] !== 'https:' && _0x2800a2['protocol'] !== 'http:')
    throw new Error('Invalid custom provider Gemini image base URL protocol');
  const _0x5bf0fb = _0x6cdac1['replace']('{model}', encodeURIComponent(_0x2a5d9b));
  return new URL(_0x5bf0fb, _0x2800a2['origin'])['toString']();
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
  'niji\x207': Object['freeze']({ version: '7', niji: !![] }),
  niji6: Object['freeze']({ version: '6', niji: !![] }),
  'niji-6': Object['freeze']({ version: '6', niji: !![] }),
  'niji\x206': Object['freeze']({ version: '6', niji: !![] }),
});
function resolveApimartMidjourneyModel(_0x81c5a0 = {}) {
  const _0x1e2bf7 =
      _0x81c5a0['mjModel'] ||
      _0x81c5a0['midjourneyModel'] ||
      _0x81c5a0['version'] ||
      _0x81c5a0['generationParams']?.['mjModel'] ||
      'v8.2',
    _0x5d3aff = String(_0x1e2bf7 || '')
      ['trim']()
      ['toLowerCase']();
  return APIMART_MIDJOURNEY_MODEL_OPTIONS[_0x5d3aff] || APIMART_MIDJOURNEY_MODEL_OPTIONS['v8.2'];
}
function normalizeApimartMidjourneyNumber(_0x81954f, { integer: integer = ![] } = {}) {
  const _0x389161 = String(_0x81954f ?? '')['trim']();
  if (!_0x389161 || _0x389161['toLowerCase']() === 'auto' || _0x389161['toLowerCase']() === 'none')
    return undefined;
  const _0x4b28ba = Number(_0x389161);
  if (!Number['isFinite'](_0x4b28ba)) return undefined;
  return integer ? Math['trunc'](_0x4b28ba) : _0x4b28ba;
}
function normalizeApimartMidjourneyBoolean(_0x1b1646) {
  if (_0x1b1646 === !![] || _0x1b1646 === ![]) return _0x1b1646;
  const _0x2a4249 = String(_0x1b1646 ?? '')
    ['trim']()
    ['toLowerCase']();
  if (!_0x2a4249) return ![];
  return _0x2a4249 === 'true' || _0x2a4249 === '1' || _0x2a4249 === 'yes';
}
function omitApimartMidjourneyAdaptiveSize(_0x3de861) {
  const _0x5ad63e = String(_0x3de861 || '')['trim'](),
    _0x596ce6 = _0x5ad63e['toLowerCase']();
  return (
    !_0x5ad63e ||
    _0x5ad63e === '自适应' ||
    _0x596ce6 === 'auto' ||
    _0x596ce6 === 'adaptive' ||
    _0x596ce6 === 'default'
  );
}
function assignApimartMidjourneyNumber(_0x5aed17, _0x30e6a9, _0x305b3c, _0x4d58cd = {}) {
  const _0x48a11b = normalizeApimartMidjourneyNumber(_0x305b3c, _0x4d58cd);
  if (_0x48a11b !== undefined) _0x5aed17[_0x30e6a9] = _0x48a11b;
}
function assignApimartMidjourneyBoolean(_0x508528, _0x3c96b8, _0x509ea7) {
  if (normalizeApimartMidjourneyBoolean(_0x509ea7)) _0x508528[_0x3c96b8] = !![];
}
export function apimartMidjourneyImage({
  currentBody: currentBody = {},
  payload: payload = {},
  finalPrompt: _0x7fdd8c,
  finalUrls: finalUrls = [],
  finalUrlsBySlot: finalUrlsBySlot = {},
}) {
  const _0x367612 = resolveApimartMidjourneyModel(payload),
    _0x3d6f0b = normalizeInputUrlsBySlot(finalUrlsBySlot),
    _0x10f2cc = Object['keys'](_0x3d6f0b)['length'] > 0x0,
    _0x442feb = [];
  if (_0x3d6f0b['imageUrl']) _0x442feb['push'](_0x3d6f0b['imageUrl']);
  else
    !_0x10f2cc &&
      Array['isArray'](finalUrls) &&
      finalUrls['map']((_0x3e3c55) => String(_0x3e3c55 || '')['trim']())
        ['filter'](Boolean)
        ['forEach']((_0x594867) => {
          if (!_0x442feb['includes'](_0x594867)) _0x442feb['push'](_0x594867);
        });
  const _0x45bfc9 = {
    prompt: _0x7fdd8c || currentBody['prompt'] || '',
    version: _0x367612['version'],
    ...(_0x367612['niji'] ? { niji: !![] } : {}),
  };
  !omitApimartMidjourneyAdaptiveSize(currentBody['size']) && (_0x45bfc9['size'] = currentBody['size']);
  const _0x5924a7 = String(currentBody['speed'] || payload['speed'] || '')
    ['trim']()
    ['toLowerCase']();
  (_0x5924a7 === 'relax' || _0x5924a7 === 'fast' || _0x5924a7 === 'turbo') &&
    (_0x45bfc9['speed'] = _0x5924a7);
  const _0x36118a = String(currentBody['quality'] || payload['quality'] || '1')['trim']();
  if (_0x36118a) _0x45bfc9['quality'] = _0x36118a;
  if (_0x442feb['length'] > 0x0) _0x45bfc9['image_urls'] = _0x442feb;
  if (_0x3d6f0b['cref']) _0x45bfc9['cref'] = _0x3d6f0b['cref'];
  if (_0x3d6f0b['sref']) _0x45bfc9['sref'] = _0x3d6f0b['sref'];
  if (_0x3d6f0b['dref']) _0x45bfc9['dref'] = _0x3d6f0b['dref'];
  assignApimartMidjourneyNumber(_0x45bfc9, 'seed', currentBody['seed'], { integer: !![] });
  currentBody['negative_prompt'] &&
    (_0x45bfc9['negative_prompt'] = String(currentBody['negative_prompt'])['trim']());
  (assignApimartMidjourneyNumber(_0x45bfc9, 'stylize', currentBody['stylize'], { integer: !![] }),
    assignApimartMidjourneyNumber(_0x45bfc9, 'chaos', currentBody['chaos'], { integer: !![] }),
    assignApimartMidjourneyNumber(_0x45bfc9, 'weird', currentBody['weird'], { integer: !![] }));
  _0x442feb['length'] > 0x0 && assignApimartMidjourneyNumber(_0x45bfc9, 'iw', currentBody['iw']);
  _0x3d6f0b['cref'] && assignApimartMidjourneyNumber(_0x45bfc9, 'cw', currentBody['cw'], { integer: !![] });
  _0x3d6f0b['sref'] && assignApimartMidjourneyNumber(_0x45bfc9, 'sw', currentBody['sw'], { integer: !![] });
  _0x3d6f0b['dref'] && assignApimartMidjourneyNumber(_0x45bfc9, 'dw', currentBody['dw']);
  const _0x387085 =
    (!_0x367612['niji'] &&
      (_0x367612['version'] === '6.1' || _0x367612['version'] === '5.2' || _0x367612['version'] === '5.1')) ||
    (_0x367612['niji'] && _0x367612['version'] === '6');
  _0x387085 && assignApimartMidjourneyNumber(_0x45bfc9, 'stop', currentBody['stop'], { integer: !![] });
  (assignApimartMidjourneyBoolean(_0x45bfc9, 'tile', currentBody['tile']),
    assignApimartMidjourneyBoolean(_0x45bfc9, 'raw', currentBody['raw']));
  (_0x367612['version'] === '8.2' || _0x367612['version'] === '8.1' || _0x367612['version'] === '7') &&
    assignApimartMidjourneyBoolean(_0x45bfc9, 'draft', currentBody['draft']);
  (_0x367612['version'] === '8.2' || _0x367612['version'] === '8.1') &&
    assignApimartMidjourneyBoolean(_0x45bfc9, 'hd', currentBody['hd']);
  if (currentBody['extra']) _0x45bfc9['extra'] = String(currentBody['extra'])['trim']();
  return _0x45bfc9;
}
function pickClosestPpioRatio(_0x7b59b5, _0x42d435) {
  const _0x46ad21 = Number(_0x7b59b5 || 0x1) / Number(_0x42d435 || 0x1);
  let _0x5cf5da = PPIO_RATIO_OPTIONS[0x0],
    _0x3ebf53 = Number['POSITIVE_INFINITY'];
  for (const _0x25e523 of PPIO_RATIO_OPTIONS) {
    const _0x2020fe = Math['abs'](_0x25e523['w'] / _0x25e523['h'] - _0x46ad21);
    _0x2020fe < _0x3ebf53 && ((_0x3ebf53 = _0x2020fe), (_0x5cf5da = _0x25e523));
  }
  return _0x5cf5da['label'];
}
function normalizePpioQuality(_0x3b079f) {
  const _0x301b8b = String(_0x3b079f || '')
    ['trim']()
    ['toUpperCase']();
  return PPIO_QUALITY_PIXEL_MAP[_0x301b8b] ? _0x301b8b : PPIO_DEFAULT_QUALITY;
}
function normalizePpioAspectRatioLabel(_0x1d3bad) {
  const _0x439768 = String(_0x1d3bad || '')['trim']();
  if (!_0x439768) return PPIO_DEFAULT_RATIO;
  const _0x1a8683 = normalizeRatioLabelText(_0x439768),
    _0x416b5b = _0x1a8683['toLowerCase']();
  if (_0x416b5b === 'auto' || _0x416b5b === 'adaptive' || _0x1a8683 === '自适应' || _0x1a8683 === '默认')
    return PPIO_DEFAULT_RATIO;
  if (!_0x1a8683['includes'](':')) return PPIO_DEFAULT_RATIO;
  const [_0x156dcc, _0x44082a] = _0x1a8683['split'](':'),
    _0xa7b990 = Number['parseFloat'](_0x156dcc),
    _0x26c7c0 = Number['parseFloat'](_0x44082a);
  if (!(_0xa7b990 > 0x0 && _0x26c7c0 > 0x0)) return PPIO_DEFAULT_RATIO;
  const _0x3bc5b4 = pickClosestPpioRatio(_0xa7b990, _0x26c7c0);
  return PPIO_RATIO_LABEL_SET['has'](_0x3bc5b4) ? _0x3bc5b4 : PPIO_DEFAULT_RATIO;
}
function calculatePpioSizeFromTargetPixels(_0x506bac, _0x40cd8c) {
  const [_0x159411, _0x17b74d] = String(_0x40cd8c || PPIO_DEFAULT_RATIO)['split'](':'),
    _0xc1a8e0 = Number['parseFloat'](_0x159411) || 0x1,
    _0x18c5ca = Number['parseFloat'](_0x17b74d) || 0x1,
    _0x24168d = Math['max'](PPIO_MIN_RATIO, Math['min'](PPIO_MAX_RATIO, _0xc1a8e0 / _0x18c5ca)),
    _0x5d031f = Math['max'](
      PPIO_MIN_PIXELS,
      Math['min'](Number(_0x506bac) || PPIO_QUALITY_PIXEL_MAP['2K'], PPIO_MAX_PIXELS),
    );
  let _0x2294d1 = Math['round'](Math['sqrt'](_0x5d031f / _0x24168d)),
    _0x58f6fa = Math['round'](_0x2294d1 * _0x24168d);
  return (
    (_0x58f6fa = Math['max'](PPIO_ALIGN_STEP, Math['round'](_0x58f6fa / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    (_0x2294d1 = Math['max'](PPIO_ALIGN_STEP, Math['round'](_0x2294d1 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    _0x58f6fa + 'x' + _0x2294d1
  );
}
function resolvePpioSize(_0x366b1a, _0x3400a2) {
  const _0x48a23a = normalizePpioQuality(_0x366b1a),
    _0x51bba6 = normalizePpioAspectRatioLabel(_0x3400a2),
    _0x322294 = PPIO_QUALITY_PIXEL_MAP[_0x48a23a] || PPIO_QUALITY_PIXEL_MAP['2K'];
  return calculatePpioSizeFromTargetPixels(_0x322294, _0x51bba6) || PPIO_DEFAULT_SIZE;
}
export function ppioImageSize({
  currentBody: _0xf5f0f5,
  payload: _0x333172,
  modelToken: _0x4aacf4,
  finalUrls: _0x1d64d0,
  executionManifest: _0x5624ee,
  modelManifest: _0x1debf2,
}) {
  const _0x220336 = _0x4aacf4 || stripPrefix(_0x333172['model'], 'ppio/'),
    _0x3ad202 = { ..._0xf5f0f5 },
    _0x171145 = _0x5624ee?.['extensions']?.['ppioImage'] || _0x1debf2?.['extensions']?.['ppioImage'] || {};
  return (
    !_0x333172['suppressImageSize'] &&
      (_0x3ad202['size'] = resolvePpioSize(
        _0x333172['imageSize'],
        _0x333172['resolvedRatioLabel'] || _0x333172['aspectRatio'],
      )),
    _0x171145['optimizePromptOptions'] &&
      (_0x3ad202['optimize_prompt_options'] = { ..._0x171145['optimizePromptOptions'] }),
    _0x171145['batchSizeField'] &&
      _0x333172['batchSize'] &&
      _0x333172['batchSize'] > 0x1 &&
      (_0x3ad202[_0x171145['batchSizeField']] = _0x333172['batchSize']),
    _0x1d64d0['length'] > 0x0 && (_0x3ad202[_0x171145['imageInputField'] || 'image'] = _0x1d64d0),
    _0x3ad202
  );
}
function normalizeGrsaiImageModel(_0x31c63b) {
  const _0xa44982 = String(_0x31c63b || '')['trim']();
  if (!_0xa44982) return 'nano-banana-pro-vt';
  return _0xa44982['replace'](/^grsai\//i, '');
}
const GRSAI_NANO_BANANA_IMAGE_SIZE_SET = new Set(['1K', '2K']),
  GRSAI_NANO_BANANA_4K_IMAGE_SIZE_SET = new Set(['1K', '2K', '4K']);
function getGrsaiNanoBananaSelection(_0x25d904) {
  const _0x133acc = resolveNanoBananaSelectionFromModel(_0x25d904, '2K', 'grsai');
  if (!_0x133acc || _0x133acc['family'] === NANO_BANANA_FAMILIES['GPT_IMAGE_2']) return null;
  return _0x133acc;
}
function getGrsaiImageSizePolicy(_0x44569d) {
  const _0x4833c6 = resolveModelExecution(_0x44569d, { providerHint: 'grsai' }),
    _0x89da98 = _0x4833c6?.['modelManifest']?.['extensions']?.['imageSizePolicy'];
  return _0x89da98 && typeof _0x89da98 === 'object' ? _0x89da98 : null;
}
function normalizeGrsaiNanoBananaImageSize(_0x2475be, _0x55eabc = '') {
  const _0x1fd41e = getGrsaiImageSizePolicy(_0x55eabc),
    _0x56463a = String(_0x1fd41e?.['fixedSize'] || '')
      ['trim']()
      ['toUpperCase']();
  if (_0x56463a) return _0x56463a;
  const _0x156b57 = String(_0x2475be || '')
      ['trim']()
      ['toUpperCase'](),
    _0x2a93de = _0x1fd41e?.['allow4KSelection']
      ? GRSAI_NANO_BANANA_4K_IMAGE_SIZE_SET
      : GRSAI_NANO_BANANA_IMAGE_SIZE_SET;
  return _0x2a93de['has'](_0x156b57) ? _0x156b57 : '2K';
}
function getGrsaiGptImage2Policy(_0x5381b5) {
  if (_0x5381b5 && typeof _0x5381b5 === 'object' && !Array['isArray'](_0x5381b5)) return _0x5381b5;
  const _0x26a05d = resolveModelExecution(_0x5381b5, { providerHint: 'grsai' }),
    _0x144e7c = _0x26a05d?.['modelManifest']?.['extensions']?.['gptImage2'];
  return _0x144e7c && typeof _0x144e7c === 'object' && !Array['isArray'](_0x144e7c) ? _0x144e7c : null;
}
function getGrsaiGptImage2PixelSizesByRatio(_0x31262b) {
  const _0x28a12e = getGrsaiGptImage2Policy(_0x31262b)?.['pixelSizesByRatio'];
  return _0x28a12e && typeof _0x28a12e === 'object' && !Array['isArray'](_0x28a12e) ? _0x28a12e : {};
}
function normalizeGrsaiNanoBananaAspectRatio(_0x31d3e1, _0x34b29e) {
  const _0x60e87b = normalizeRatioLabelText(_0x31d3e1),
    _0x3a5176 = _0x60e87b['toLowerCase']();
  if (
    !_0x60e87b ||
    _0x3a5176 === 'auto' ||
    _0x3a5176 === 'adaptive' ||
    _0x3a5176 === 'default' ||
    _0x60e87b === '自适应' ||
    _0x60e87b === '默认'
  )
    return 'auto';
  const _0x154d4a = parseRatioLabel(_0x60e87b);
  if (!_0x154d4a) return 'auto';
  const _0x5b7a7d = _0x154d4a['label'],
    _0x3c2d9e = new Set(getNanoBananaAllowedRatioLabels(_0x34b29e));
  return _0x3c2d9e['has'](_0x5b7a7d) ? _0x5b7a7d : normalizeNanoBananaRatioForFamily(_0x5b7a7d, _0x34b29e);
}
function normalizeGrsaiGptImage2ImageSize(_0x39e239, _0x8c81ba) {
  const _0x2fac59 = getGrsaiGptImage2Policy(_0x8c81ba),
    _0x204d9c = new Set(
      (Array['isArray'](_0x2fac59?.['allowedSizes']) ? _0x2fac59['allowedSizes'] : ['1K'])['map'](
        (_0x22e81d) =>
          String(_0x22e81d || '')
            ['trim']()
            ['toUpperCase'](),
      ),
    ),
    _0x729d60 = String(_0x2fac59?.['defaultSize'] || '1K')
      ['trim']()
      ['toUpperCase'](),
    _0x3815d0 = String(_0x39e239 || '')
      ['trim']()
      ['toUpperCase']();
  if (_0x204d9c['has'](_0x3815d0)) return _0x3815d0;
  return _0x204d9c['has'](_0x729d60) ? _0x729d60 : '1K';
}
function normalizePixelSize(_0x54eab8) {
  const _0x8997d1 = String(_0x54eab8 || '')
    ['trim']()
    ['match'](/^(\d{2,5})\s*[xX]\s*(\d{2,5})$/);
  if (!_0x8997d1) return '';
  return _0x8997d1[0x1] + 'x' + _0x8997d1[0x2];
}
function getGrsaiGptImage2RatioOptionsForSize(_0x5f2d62, _0x3aae98) {
  const _0x17fcd4 = getGrsaiGptImage2PixelSizesByRatio(_0x3aae98);
  return Object['keys'](_0x17fcd4)
    ['filter']((_0x21c76f) => _0x17fcd4[_0x21c76f]?.[_0x5f2d62])
    ['map']((_0x49dfb2) => {
      const _0x31b24f = parseRatioLabel(_0x49dfb2) || { w: 0x1, h: 0x1 };
      return Object['freeze']({ label: _0x49dfb2, value: _0x31b24f['w'] / _0x31b24f['h'] });
    });
}
function getDefaultGrsaiGptImage2PixelSize(_0x3c8ecc, _0x5ed4b3) {
  return _0x3c8ecc['1:1']?.[_0x5ed4b3] || _0x3c8ecc['1:1']?.['1K'] || '1024x1024';
}
function pickClosestGrsaiGptImage2RatioLabel(_0x5ec1aa, _0x1179a9, _0x5b6257) {
  const _0x4a40ac = parseRatioLabel(_0x5ec1aa),
    _0x44765e = _0x4a40ac ? _0x4a40ac['w'] / _0x4a40ac['h'] : 0x1,
    _0x1fac05 = getGrsaiGptImage2RatioOptionsForSize(_0x1179a9, _0x5b6257);
  let _0x2f8bdc = _0x1fac05[0x0] || { label: '1:1', value: 0x1 },
    _0xf030ef = Number['POSITIVE_INFINITY'];
  for (const _0x3d050b of _0x1fac05) {
    const _0x25bec5 = Math['abs'](_0x44765e - _0x3d050b['value']);
    _0x25bec5 < _0xf030ef && ((_0x2f8bdc = _0x3d050b), (_0xf030ef = _0x25bec5));
  }
  return _0x2f8bdc?.['label'] || '1:1';
}
function normalizeGrsaiGptImage2AspectRatio(_0x2c3b9b, _0xefcb91, _0x171d7c) {
  const _0x5d0abb = getGrsaiGptImage2PixelSizesByRatio(_0x171d7c),
    _0x229747 = normalizePixelSize(_0x2c3b9b);
  if (_0x229747) return _0x229747;
  const _0x3e2186 = normalizeRatioLabelText(_0x2c3b9b),
    _0x1a9482 = _0x3e2186['toLowerCase']();
  if (
    !_0x3e2186 ||
    _0x1a9482 === 'auto' ||
    _0x1a9482 === 'adaptive' ||
    _0x1a9482 === 'default' ||
    _0x3e2186 === '自适应' ||
    _0x3e2186 === '默认'
  )
    return getDefaultGrsaiGptImage2PixelSize(_0x5d0abb, _0xefcb91);
  const _0x115970 = parseRatioLabel(_0x3e2186),
    _0x469389 = _0x115970?.['label'] || '1:1',
    _0xf159b1 = _0x5d0abb[_0x469389]?.[_0xefcb91];
  if (_0xf159b1) return _0xf159b1;
  const _0x3467ab = pickClosestGrsaiGptImage2RatioLabel(_0x469389, _0xefcb91, _0x171d7c);
  return _0x5d0abb[_0x3467ab]?.[_0xefcb91] || getDefaultGrsaiGptImage2PixelSize(_0x5d0abb, _0xefcb91);
}
export function grsaiImage({
  payload: _0x2aae6c,
  finalPrompt: _0x4dacec,
  modelToken: _0x1c0043,
  finalUrls: _0x1df776,
}) {
  const _0x4c865f = normalizeGrsaiImageModel(_0x1c0043 || _0x2aae6c['model'] || 'nano-banana-pro-vt'),
    _0x1ced60 = getGrsaiNanoBananaSelection(_0x4c865f),
    _0x3db870 = _0x2aae6c['resolvedRatioLabel'] || _0x2aae6c['aspectRatio'],
    _0x1aff97 = _0x1ced60 ? normalizeGrsaiNanoBananaAspectRatio(_0x3db870, _0x1ced60['family']) : _0x3db870,
    _0x4151f3 = _0x1ced60
      ? normalizeGrsaiNanoBananaImageSize(_0x2aae6c['imageSize'], _0x4c865f)
      : _0x2aae6c['imageSize'] || '2K';
  return {
    model: _0x4c865f,
    prompt: _0x4dacec,
    images: _0x1df776,
    replyType: 'json',
    ...(!_0x2aae6c['suppressImageSize'] && !shouldOmitImageSizeParam(_0x4c865f) && { imageSize: _0x4151f3 }),
    ...(!_0x2aae6c['suppressAspectRatio'] && _0x1aff97 && { aspectRatio: _0x1aff97 }),
  };
}
export function grsaiGptImage2Image({
  payload: _0x5d59b1,
  finalPrompt: _0xba996c,
  modelToken: _0x33d36d,
  finalUrls: _0xfb75bb,
  currentBody: currentBody = {},
  executionManifest: _0x50cfe4,
}) {
  const _0xdd0689 = normalizeGrsaiImageModel(_0x33d36d || _0x5d59b1['model'] || 'gpt-image-2'),
    _0x2ede83 = _0x5d59b1['generationParams']?.['mode'] ?? _0x5d59b1['mode'],
    _0x48d7fb =
      _0x50cfe4?.['extensions']?.['gptImage2ByMode']?.[_0x2ede83] ||
      _0x50cfe4?.['extensions']?.['gptImage2'] ||
      _0xdd0689,
    _0x57d813 = _0x5d59b1['generationParams']?.['aspectRatio'],
    _0x5667d4 = normalizeGrsaiGptImage2ImageSize(
      _0x5d59b1['generationParams']?.['imageSize'] ?? _0x5d59b1['imageSize'],
      _0x48d7fb,
    ),
    _0x1799c7 = normalizeGrsaiGptImage2AspectRatio(
      (!isAdaptiveRatioInput(_0x57d813) ? _0x57d813 : _0x5d59b1['resolvedRatioLabel']) ||
        _0x5d59b1['aspectRatio'],
      _0x5667d4,
      _0x48d7fb,
    );
  return {
    ...currentBody,
    model: _0xdd0689,
    prompt: _0xba996c,
    images: _0xfb75bb,
    replyType: currentBody['replyType'] || 'json',
    ...(!_0x5d59b1['suppressAspectRatio'] && _0x1799c7 && { aspectRatio: _0x1799c7 }),
  };
}
function normalizeRunningHubModelId(_0x468d53) {
  return stripPrefix(_0x468d53, 'runninghub-model/');
}
function getRunningHubImageExecutionPolicy({ executionManifest: _0x56e7e7, modelManifest: _0x59ea7c } = {}) {
  const _0x228acc =
    _0x56e7e7?.['extensions']?.['runningHubImage'] || _0x59ea7c?.['extensions']?.['runningHubImage'];
  return _0x228acc && typeof _0x228acc === 'object' && !Array['isArray'](_0x228acc) ? _0x228acc : {};
}
function normalizeRunningHubImageRoute(_0x106e50 = {}) {
  const _0x26ac01 = String(
    _0x106e50?.['rhModelRoute'] ?? _0x106e50?.['generationParams']?.['rhModelRoute'] ?? '',
  )
    ['trim']()
    ['toLowerCase']();
  return _0x26ac01 || 'low';
}
function isPlainRunningHubPolicyObject(_0x1f9742) {
  return _0x1f9742 && typeof _0x1f9742 === 'object' && !Array['isArray'](_0x1f9742);
}
function pickRunningHubRouteValue(_0x1e121c, _0x175bc5) {
  if (!isPlainRunningHubPolicyObject(_0x1e121c)) return undefined;
  if (Object['prototype']['hasOwnProperty']['call'](_0x1e121c, _0x175bc5)) return _0x1e121c[_0x175bc5];
  if (Object['prototype']['hasOwnProperty']['call'](_0x1e121c, 'default')) return _0x1e121c['default'];
  return undefined;
}
function pickRunningHubPolicyValue(_0x504d86, _0x275b10, _0xc13175) {
  const _0x213f9b = pickRunningHubRouteValue(_0x504d86?.[_0x275b10 + 'ByRoute'], _0xc13175);
  return _0x213f9b !== undefined ? _0x213f9b : _0x504d86?.[_0x275b10];
}
function mergeRunningHubRoutePolicyObject(_0x320c03, _0x2f0f12, _0x571e31) {
  const _0x465039 = isPlainRunningHubPolicyObject(_0x320c03?.[_0x2f0f12]) ? _0x320c03[_0x2f0f12] : {},
    _0x443675 = pickRunningHubRouteValue(_0x320c03?.[_0x2f0f12 + 'ByRoute'], _0x571e31);
  if (!isPlainRunningHubPolicyObject(_0x443675)) return _0x465039;
  return { ..._0x465039, ..._0x443675 };
}
function resolveRunningHubImageRoutePolicy(_0x34415b, _0x4276c3 = {}) {
  const _0xa5fb31 = normalizeRunningHubImageRoute(_0x4276c3);
  return {
    ..._0x34415b,
    route: _0xa5fb31,
    textEndpoint: pickRunningHubPolicyValue(_0x34415b, 'textEndpoint', _0xa5fb31),
    inputEndpoint: pickRunningHubPolicyValue(_0x34415b, 'inputEndpoint', _0xa5fb31),
    omitResolution: pickRunningHubPolicyValue(_0x34415b, 'omitResolution', _0xa5fb31),
    quality: pickRunningHubPolicyValue(_0x34415b, 'quality', _0xa5fb31),
    omitAspectRatio: pickRunningHubPolicyValue(_0x34415b, 'omitAspectRatio', _0xa5fb31),
    aspectRatioValueMap: pickRunningHubPolicyValue(_0x34415b, 'aspectRatioValueMap', _0xa5fb31),
    omitAspectRatioWhenInput: pickRunningHubPolicyValue(_0x34415b, 'omitAspectRatioWhenInput', _0xa5fb31),
    inputSlotBodyFields: pickRunningHubPolicyValue(_0x34415b, 'inputSlotBodyFields', _0xa5fb31),
    constantParams: mergeRunningHubRoutePolicyObject(_0x34415b, 'constantParams', _0xa5fb31),
    defaultParams: mergeRunningHubRoutePolicyObject(_0x34415b, 'defaultParams', _0xa5fb31),
    bodyParamTypes: mergeRunningHubRoutePolicyObject(_0x34415b, 'bodyParamTypes', _0xa5fb31),
    bodyParamInputModes: mergeRunningHubRoutePolicyObject(_0x34415b, 'bodyParamInputModes', _0xa5fb31),
  };
}
function resolveRunningHubModelEndpoint({
  hasInputImages: _0x2ea774,
  executionManifest: _0x41341a,
  modelManifest: _0x5bf998,
  payload: _0x3f01c9,
}) {
  const _0x3e5cb8 = resolveRunningHubImageRoutePolicy(
    getRunningHubImageExecutionPolicy({ executionManifest: _0x41341a, modelManifest: _0x5bf998 }),
    _0x3f01c9,
  );
  if (!_0x2ea774) return _0x3e5cb8['textEndpoint'] || 'text-to-image';
  return _0x3e5cb8['inputEndpoint'] || 'image-to-image';
}
function normalizeRunningHubBodyParamValue(_0x166c30, _0x56a8a9) {
  const _0x5b32f9 = String(_0x56a8a9 || 'string')
    ['trim']()
    ['toLowerCase']();
  if (_0x5b32f9 === 'boolean') {
    if (_0x166c30 === !![] || _0x166c30 === ![]) return _0x166c30;
    const _0x4ffee3 = String(_0x166c30 ?? '')
      ['trim']()
      ['toLowerCase']();
    if (['true', '1', 'yes', 'on']['includes'](_0x4ffee3)) return !![];
    if (['false', '0', 'no', 'off', '']['includes'](_0x4ffee3)) return ![];
    return Boolean(_0x166c30);
  }
  if (_0x5b32f9 === 'integer') {
    const _0x88a808 = Number['parseInt'](String(_0x166c30 ?? '')['trim'](), 0xa);
    return Number['isFinite'](_0x88a808) ? _0x88a808 : null;
  }
  if (_0x5b32f9 === 'number') {
    const _0x1259a3 = Number(_0x166c30);
    return Number['isFinite'](_0x1259a3) ? _0x1259a3 : null;
  }
  return String(_0x166c30 ?? '')['trim']();
}
function normalizeRunningHubAspectRatioValueMap(_0x19b8f3) {
  return _0x19b8f3 && typeof _0x19b8f3 === 'object' && !Array['isArray'](_0x19b8f3) ? _0x19b8f3 : {};
}
function hasRunningHubAspectRatioValueMap(_0xa6c3de) {
  return (
    Object['keys'](normalizeRunningHubAspectRatioValueMap(_0xa6c3de?.['aspectRatioValueMap']))['length'] > 0x0
  );
}
function resolveRunningHubMappedAspectRatio(_0x1c4c0f, _0x2cbff2) {
  const _0x4cd959 = String(_0x1c4c0f || '')['trim']();
  if (!_0x4cd959) return '';
  const _0xc528b8 = normalizeRunningHubAspectRatioValueMap(_0x2cbff2?.['aspectRatioValueMap']),
    _0x99ee8d = Object['entries'](_0xc528b8)
      ['map'](([_0x3cdac2, _0x34f461]) => [
        normalizeRatioLabelText(_0x3cdac2),
        String(_0x34f461 || '')['trim'](),
      ])
      ['filter'](([_0x5cb657, _0x58c038]) => _0x5cb657 && _0x58c038);
  if (_0x99ee8d['length'] === 0x0) return _0x4cd959;
  const _0x11fbb4 = normalizeRatioLabelText(_0x4cd959),
    _0xae0dd1 = _0x99ee8d['find'](([_0x1741fc]) => _0x1741fc === _0x11fbb4);
  if (_0xae0dd1) return _0xae0dd1[0x1];
  const _0x1e6fdc = _0x11fbb4['toLowerCase'](),
    _0x86c7c0 = _0x99ee8d['find'](([, _0x2110b8]) => _0x2110b8['toLowerCase']() === _0x1e6fdc);
  if (_0x86c7c0) return _0x86c7c0[0x1];
  const _0xf68cc6 = parseRatioLabel(_0x11fbb4);
  if (!_0xf68cc6) return _0x4cd959;
  const _0x12dea0 = _0xf68cc6['w'] / _0xf68cc6['h'];
  let _0x5148d7 = null,
    _0x4a3e44 = Number['POSITIVE_INFINITY'];
  return (
    _0x99ee8d['forEach'](([_0x273991, _0x499ee3]) => {
      const _0x2762a3 = parseRatioLabel(_0x273991);
      if (!_0x2762a3) return;
      const _0x1237dc = Math['abs'](_0x2762a3['w'] / _0x2762a3['h'] - _0x12dea0);
      _0x1237dc < _0x4a3e44 && ((_0x5148d7 = _0x499ee3), (_0x4a3e44 = _0x1237dc));
    }),
    _0x5148d7 || _0x4cd959
  );
}
function assignRunningHubInputSlotFields(_0x51da63, _0x5a0df5, _0x319c3a) {
  const _0x67ccb4 =
    _0x5a0df5?.['inputSlotBodyFields'] &&
    typeof _0x5a0df5['inputSlotBodyFields'] === 'object' &&
    !Array['isArray'](_0x5a0df5['inputSlotBodyFields'])
      ? _0x5a0df5['inputSlotBodyFields']
      : null;
  if (!_0x67ccb4) return {};
  const _0x30422e = normalizeInputUrlsBySlot_2(_0x319c3a);
  return (
    Object['entries'](_0x67ccb4)['forEach'](([_0x4194e3, _0xa7de1f]) => {
      const _0x52da42 = String(_0xa7de1f || '')['trim'](),
        _0xcf29d1 = _0x30422e[String(_0x4194e3 || '')['trim']()];
      if (_0x52da42 && _0xcf29d1) _0x51da63[_0x52da42] = _0xcf29d1;
    }),
    _0x30422e
  );
}
function shouldIncludeRunningHubPolicyParam(_0x41c311, _0x7c30df, _0x4f251c) {
  const _0x91eec =
      _0x7c30df?.['conditionalParams'] &&
      typeof _0x7c30df['conditionalParams'] === 'object' &&
      !Array['isArray'](_0x7c30df['conditionalParams'])
        ? _0x7c30df['conditionalParams']
        : {},
    _0x87489f = String(_0x91eec[_0x41c311] || '')['trim']();
  if (!_0x87489f) return !![];
  return !!_0x4f251c?.[_0x87489f];
}
function shouldIncludeRunningHubParamForInputMode(_0x3ba51d, _0xb8f9be, _0x15e131) {
  const _0x225982 =
      _0xb8f9be?.['bodyParamInputModes'] &&
      typeof _0xb8f9be['bodyParamInputModes'] === 'object' &&
      !Array['isArray'](_0xb8f9be['bodyParamInputModes'])
        ? _0xb8f9be['bodyParamInputModes']
        : {},
    _0x57f73 = String(_0x225982[_0x3ba51d] || '')
      ['trim']()
      ['toLowerCase']();
  if (!_0x57f73) return !![];
  if (_0x57f73 === 'textonly' || _0x57f73 === 'text-only') return !_0x15e131;
  if (_0x57f73 === 'inputonly' || _0x57f73 === 'input-only') return _0x15e131;
  return !![];
}
function assignRunningHubPolicyParams(
  _0x2f6de3,
  _0x53812a,
  _0x3471d7,
  _0x4d1f09,
  { hasInputImages: hasInputImages = ![] } = {},
) {
  const _0x223cb3 =
    _0x3471d7?.['constantParams'] &&
    typeof _0x3471d7['constantParams'] === 'object' &&
    !Array['isArray'](_0x3471d7['constantParams'])
      ? _0x3471d7['constantParams']
      : {};
  Object['entries'](_0x223cb3)['forEach'](([_0x8455d9, _0x16ec0c]) => {
    if (!shouldIncludeRunningHubPolicyParam(_0x8455d9, _0x3471d7, _0x4d1f09)) return;
    if (!shouldIncludeRunningHubParamForInputMode(_0x8455d9, _0x3471d7, hasInputImages)) return;
    _0x2f6de3[_0x8455d9] = _0x16ec0c;
  });
  const _0x59143c =
    _0x3471d7?.['bodyParamTypes'] &&
    typeof _0x3471d7['bodyParamTypes'] === 'object' &&
    !Array['isArray'](_0x3471d7['bodyParamTypes'])
      ? _0x3471d7['bodyParamTypes']
      : {};
  Object['entries'](_0x59143c)['forEach'](([_0x23cd9c, _0x19822c]) => {
    if (Object['prototype']['hasOwnProperty']['call'](_0x2f6de3, _0x23cd9c)) return;
    if (!Object['prototype']['hasOwnProperty']['call'](_0x53812a || {}, _0x23cd9c)) return;
    if (!shouldIncludeRunningHubPolicyParam(_0x23cd9c, _0x3471d7, _0x4d1f09)) return;
    if (!shouldIncludeRunningHubParamForInputMode(_0x23cd9c, _0x3471d7, hasInputImages)) return;
    const _0x58f8bf = _0x53812a[_0x23cd9c];
    if (_0x58f8bf === undefined || _0x58f8bf === null) return;
    if (typeof _0x58f8bf === 'string' && _0x58f8bf['trim']() === '') return;
    const _0x107b41 = normalizeRunningHubBodyParamValue(_0x58f8bf, _0x19822c);
    if (_0x107b41 === null || _0x107b41 === '') return;
    _0x2f6de3[_0x23cd9c] = _0x107b41;
  });
  const _0x343215 =
    _0x3471d7?.['defaultParams'] &&
    typeof _0x3471d7['defaultParams'] === 'object' &&
    !Array['isArray'](_0x3471d7['defaultParams'])
      ? _0x3471d7['defaultParams']
      : {};
  Object['entries'](_0x343215)['forEach'](([_0x234bb8, _0x1bd506]) => {
    if (Object['prototype']['hasOwnProperty']['call'](_0x2f6de3, _0x234bb8)) return;
    if (!shouldIncludeRunningHubPolicyParam(_0x234bb8, _0x3471d7, _0x4d1f09)) return;
    if (!shouldIncludeRunningHubParamForInputMode(_0x234bb8, _0x3471d7, hasInputImages)) return;
    _0x2f6de3[_0x234bb8] = _0x1bd506;
  });
}
function normalizeRunningHubModelQuality(_0x51a939) {
  const _0x345e8f = String(_0x51a939 || '')
    ['trim']()
    ['toUpperCase']();
  return RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[_0x345e8f] ? _0x345e8f : RUNNINGHUB_MODEL_DEFAULT_QUALITY;
}
function normalizeRunningHubModelRatio(_0x5562e6) {
  const _0x301b45 = String(_0x5562e6 || '')['trim']();
  if (!_0x301b45) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const _0x378bd8 = normalizeRatioLabelText(_0x301b45),
    _0x3fb82b = _0x378bd8['toLowerCase']();
  if (_0x3fb82b === 'auto' || _0x3fb82b === 'default' || _0x3fb82b === 'original' || _0x3fb82b === 'adaptive')
    return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  if (!_0x378bd8['includes'](':')) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const [_0x351710, _0x303826] = _0x378bd8['split'](':'),
    _0x112f28 = Number['parseFloat'](_0x351710),
    _0x1861be = Number['parseFloat'](_0x303826);
  if (!(_0x112f28 > 0x0 && _0x1861be > 0x0)) return RUNNINGHUB_MODEL_DEFAULT_RATIO;
  const _0x569d67 = _0x112f28 + ':' + _0x1861be;
  return RUNNINGHUB_MODEL_RATIO_SET['has'](_0x569d67) ? _0x569d67 : RUNNINGHUB_MODEL_DEFAULT_RATIO;
}
function alignRunningHubDimension(_0x4a0ecf) {
  const _0x4b5583 =
    Math['round'](Number(_0x4a0ecf || 0x0) / RUNNINGHUB_MODEL_DIMENSION_ALIGN) *
    RUNNINGHUB_MODEL_DIMENSION_ALIGN;
  return Math['max'](RUNNINGHUB_MODEL_DIMENSION_MIN, Math['min'](RUNNINGHUB_MODEL_DIMENSION_MAX, _0x4b5583));
}
function resolveRunningHubModelDimensions(_0x5a24da, _0x13d0d6) {
  const _0x6866c2 = normalizeRunningHubModelQuality(_0x5a24da),
    _0x5d2554 = normalizeRunningHubModelRatio(_0x13d0d6),
    [_0x254ad6, _0x2343f9] = _0x5d2554['split'](':'),
    _0x5da558 = Number['parseFloat'](_0x254ad6) || 0x1,
    _0x4269cd = Number['parseFloat'](_0x2343f9) || 0x1,
    _0x344481 =
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[_0x6866c2] ||
      RUNNINGHUB_MODEL_QUALITY_PIXEL_MAP[RUNNINGHUB_MODEL_DEFAULT_QUALITY],
    _0x5a57a2 = _0x5da558 / _0x4269cd,
    _0x1e2c7d = Math['sqrt'](_0x344481 / _0x5a57a2),
    _0x131144 = _0x1e2c7d * _0x5a57a2;
  return { width: alignRunningHubDimension(_0x131144), height: alignRunningHubDimension(_0x1e2c7d) };
}
function isAdaptiveRatioInput(_0x139fb3) {
  const _0x47e699 = String(_0x139fb3 || '')['trim']();
  if (!_0x47e699) return !![];
  const _0x4d0543 = normalizeRatioLabelText(_0x47e699),
    _0x232eb9 = _0x4d0543['toLowerCase']();
  if (/^\d+x\d+$/i['test'](_0x4d0543)) return ![];
  return (
    _0x232eb9 === 'auto' ||
    _0x232eb9 === 'default' ||
    _0x232eb9 === 'adaptive' ||
    _0x232eb9 === 'original' ||
    !_0x4d0543['includes'](':')
  );
}
export function runninghubImage({
  payload: _0x4ab582,
  finalPrompt: _0x513e75,
  modelToken: _0x3547de,
  finalUrls: _0x577586,
  finalUrlsBySlot: finalUrlsBySlot = {},
  executionManifest: _0x4dde92,
  modelManifest: _0x447409,
}) {
  const _0x521806 = normalizeRunningHubModelId(_0x3547de),
    _0x30c6dc = resolveRunningHubImageRoutePolicy(
      getRunningHubImageExecutionPolicy({ executionManifest: _0x4dde92, modelManifest: _0x447409 }),
      _0x4ab582,
    ),
    _0x539da6 = _0x447409?.['modelId'] || 'runninghub-model/' + _0x521806,
    _0x357613 =
      _0x30c6dc['omitResolution'] === !![] || isRunningHubModelWithoutImageSizeParam(_0x4ab582['model']),
    _0x44ad43 =
      normalizeImageSizeForProviderModel({
        model: _0x539da6,
        provider: 'runninghub',
        imageSize: _0x4ab582['imageSize'],
      }) || _0x4ab582['imageSize'],
    _0x33b731 = { '1K': '1k', '2K': '2k', '4K': '4k' },
    _0x4a380a = _0x33b731[_0x44ad43] || '2k',
    _0x57cd56 = resolveProviderRatioPayload({
      provider: 'runninghub',
      model: 'runninghub-model/' + _0x521806,
      ratioLabel: _0x4ab582['resolvedRatioLabel'] || _0x4ab582['aspectRatio'],
      imageSize: _0x44ad43,
      suppressAspectRatio: _0x4ab582['suppressAspectRatio'],
    }),
    _0x307983 = String(_0x57cd56?.['params']?.['aspectRatio'] || '')['trim'](),
    _0x4f8228 = _0x4ab582['resolvedRatioLabel'] || _0x4ab582['aspectRatio'],
    _0x430386 = resolveRunningHubMappedAspectRatio(
      hasRunningHubAspectRatioValueMap(_0x30c6dc) ? _0x4f8228 || _0x307983 : _0x307983,
      _0x30c6dc,
    ),
    _0x4cc3de = _0x430386['toLowerCase'](),
    _0x5095a0 =
      _0x30c6dc['aspectRatioMode'] === 'dimensions' ||
      _0x447409?.['extensions']?.['ratioPolicy']?.['capability'] === 'dimensions',
    _0x4c4023 = _0x5095a0
      ? _0x57cd56?.['ratioCapability'] === 'dimensions'
        ? {
            width: Number(_0x57cd56?.['params']?.['width']) || 0x800,
            height: Number(_0x57cd56?.['params']?.['height']) || 0x800,
          }
        : resolveRunningHubModelDimensions(_0x44ad43, _0x4ab582['aspectRatio'])
      : null,
    _0x2e6c52 =
      _0x5095a0 ||
      _0x30c6dc['omitAspectRatio'] === !![] ||
      (_0x30c6dc['omitAspectRatioWhenInput'] === !![] && _0x577586['length'] > 0x0) ||
      _0x4ab582['suppressAspectRatio'] ||
      isAdaptiveRatioInput(_0x4f8228) ||
      !_0x430386 ||
      _0x4cc3de === 'auto' ||
      _0x4cc3de === 'default' ||
      _0x4cc3de === 'adaptive' ||
      _0x4cc3de === 'original',
    _0x475aac = {
      prompt: _0x513e75 || '',
      ...(_0x5095a0
        ? { width: _0x4c4023?.['width'] || 0x800, height: _0x4c4023?.['height'] || 0x800 }
        : !_0x357613
          ? { resolution: _0x4a380a }
          : {}),
      ...(_0x30c6dc['quality'] ? { quality: _0x30c6dc['quality'] } : {}),
      ...(!_0x2e6c52 && { aspectRatio: _0x430386 }),
      ...(_0x4ab582['negativePrompt'] && { negativePrompt: _0x4ab582['negativePrompt'] }),
      ...(_0x4ab582['seed'] && { seed: _0x4ab582['seed'] }),
    },
    _0x323667 = assignRunningHubInputSlotFields(_0x475aac, _0x30c6dc, finalUrlsBySlot);
  return (
    assignRunningHubPolicyParams(_0x475aac, _0x4ab582, _0x30c6dc, _0x323667, {
      hasInputImages: _0x577586['length'] > 0x0,
    }),
    _0x577586['length'] > 0x0 && !_0x30c6dc['inputSlotBodyFields'] && (_0x475aac['imageUrls'] = _0x577586),
    _0x475aac
  );
}
export function runninghubImageEndpoint({
  modelToken: _0xcb8e7a,
  finalUrls: _0x587987,
  executionManifest: _0xc22d94,
  modelManifest: _0x2e6792,
  payload: _0x1715c6,
}) {
  const _0x4baed5 = normalizeRunningHubModelId(_0xcb8e7a),
    _0x2d3b18 = resolveRunningHubModelEndpoint({
      hasInputImages: _0x587987['length'] > 0x0,
      executionManifest: _0xc22d94,
      modelManifest: _0x2e6792,
      payload: _0x1715c6,
    });
  return 'https://www.runninghub.cn/openapi/v2/' + _0x4baed5 + '/' + _0x2d3b18;
}

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
  PPIO_RATIO_LABEL_SET = new Set(PPIO_RATIO_OPTIONS.map((_0x32e0e1) => _0x32e0e1.label));
function normalizePpioQuality(_0x2c0244) {
  const _0x277a0c = String(_0x2c0244 || '')
    .trim()
    .toUpperCase();
  return PPIO_QUALITY_PIXEL_MAP[_0x277a0c] ? _0x277a0c : PPIO_DEFAULT_QUALITY;
}
function normalizePpioAspectRatioLabel(_0x28c198) {
  const _0x3262a8 = String(_0x28c198 || '').trim();
  if (!_0x3262a8) return PPIO_DEFAULT_RATIO;
  const _0x299b01 = _0x3262a8.replace(/[：∶]/g, ':').replace(/\s+/g, ''),
    _0x56807e = _0x299b01.toLowerCase();
  if (_0x56807e === 'auto' || _0x56807e === 'adaptive' || _0x299b01 === '自适应' || _0x299b01 === '默认')
    return PPIO_DEFAULT_RATIO;
  if (!_0x299b01.includes(':')) return PPIO_DEFAULT_RATIO;
  const [_0x162ccd, _0x2d823f] = _0x299b01.split(':'),
    _0x57730d = Number.parseFloat(_0x162ccd),
    _0x3ff2c7 = Number.parseFloat(_0x2d823f);
  if (!(_0x57730d > 0 && _0x3ff2c7 > 0)) return PPIO_DEFAULT_RATIO;
  const _0x369169 = pickClosestRatio(_0x57730d, _0x3ff2c7, PPIO_RATIO_OPTIONS);
  return PPIO_RATIO_LABEL_SET.has(_0x369169) ? _0x369169 : PPIO_DEFAULT_RATIO;
}
function calculatePpioSizeFromTargetPixels(_0x400c0b, _0x20bccc) {
  const [_0x243d49, _0x47a0ad] = String(_0x20bccc || PPIO_DEFAULT_RATIO).split(':'),
    _0xe87be4 = Number.parseFloat(_0x243d49) || 1,
    _0x2f4d22 = Number.parseFloat(_0x47a0ad) || 1,
    _0x51c6cf = Math.max(PPIO_MIN_RATIO, Math.min(PPIO_MAX_RATIO, _0xe87be4 / _0x2f4d22)),
    _0x5d047f = Math.max(
      PPIO_MIN_PIXELS,
      Math.min(PPIO_MAX_PIXELS, Number(_0x400c0b) || PPIO_QUALITY_PIXEL_MAP['2K']),
    );
  let _0x175035 = Math.round(Math.sqrt(_0x5d047f / _0x51c6cf)),
    _0x5f0587 = Math.round(_0x175035 * _0x51c6cf);
  return (
    (_0x5f0587 = Math.max(PPIO_ALIGN_STEP, Math.round(_0x5f0587 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    (_0x175035 = Math.max(PPIO_ALIGN_STEP, Math.round(_0x175035 / PPIO_ALIGN_STEP) * PPIO_ALIGN_STEP)),
    _0x5f0587 + 'x' + _0x175035
  );
}
function buildPpioSizeTable() {
  const _0x4ae2d9 = Object.entries(PPIO_QUALITY_PIXEL_MAP).map(([_0x45fed8, _0x42a47f]) => {
    const _0x480404 = PPIO_RATIO_OPTIONS.map((_0x57b577) => [
      _0x57b577.label,
      calculatePpioSizeFromTargetPixels(_0x42a47f, _0x57b577.label),
    ]);
    return [_0x45fed8, Object.freeze(Object.fromEntries(_0x480404))];
  });
  return Object.freeze(Object.fromEntries(_0x4ae2d9));
}
const PPIO_SIZE_TABLE = buildPpioSizeTable();
function resolvePpioSize(_0x240ecc, _0x16b3e8) {
  const _0x5d9e36 = normalizePpioQuality(_0x240ecc),
    _0x31f3e7 = normalizePpioAspectRatioLabel(_0x16b3e8);
  return (
    PPIO_SIZE_TABLE?.[_0x5d9e36]?.[_0x31f3e7] ||
    PPIO_SIZE_TABLE?.[PPIO_DEFAULT_QUALITY]?.[PPIO_DEFAULT_RATIO] ||
    PPIO_DEFAULT_SIZE
  );
}
async function buildPpioSeedreamRequest(_0x132434, _0x45f150, _0xe87ef3, _0x5c04bf, _0x13d763 = {}) {
  const { imageField: imageField = 'image', supportBatch: supportBatch = false } = _0x13d763,
    _0x23af95 = _0x5c04bf.getProviderConfig('ppio'),
    _0x5080a3 = _0x23af95.apiUrl.replace(/\/+$/, ''),
    _0x2b18f8 = _0x23af95.apiKey || _0x45f150.apiKey;
  if (!_0x2b18f8) throw new Error('PPIO API Key 未配置，无法发起图像生成请求');
  const _0x178668 = _0x5c04bf.getProviderConfig('grsai'),
    _0x2c3783 = _0x178668.apiKey || _0x45f150.apiKey,
    _0x46a917 = await _0x5c04bf.processInputImages(_0x45f150.inputUrls, _0x2c3783, {
      applyInputQualityProfile: true,
      provider: 'grsai',
    });
  if (_0x45f150.inputUrls?.length > 0 && _0x46a917.length === 0)
    throw new Error('参考素材上传云端失败，无法继续生成');
  const _0x4a9e2e = resolveProviderRatioPayload({
      provider: 'ppio',
      model: _0x45f150.model,
      ratioLabel: _0x45f150.resolvedRatioLabel || _0x45f150.aspectRatio,
      imageSize: _0x45f150.imageSize,
      suppressAspectRatio: _0x45f150.suppressAspectRatio,
    }),
    _0x3cdab9 = {
      prompt: _0xe87ef3,
      watermark: false,
      ...(!_0x45f150.suppressImageSize && {
        size: resolvePpioSize(_0x45f150.imageSize, _0x4a9e2e?.resolvedRatioLabel || _0x45f150.aspectRatio),
      }),
    };
  return (
    _0x132434 !== '4.0' && (_0x3cdab9.optimize_prompt_options = { mode: 'standard' }),
    supportBatch &&
      _0x45f150.batchSize &&
      _0x45f150.batchSize > 1 &&
      (_0x3cdab9.max_images = _0x45f150.batchSize),
    _0x46a917.length > 0 && (_0x3cdab9[imageField] = _0x46a917),
    {
      url: '/api/v2/proxy/image',
      headers: { 'Content-Type': 'application/json' },
      body: { apiUrl: _0x5080a3 + '/v3/seedream-' + _0x132434, apiKey: _0x2b18f8, ..._0x3cdab9 },
    }
  );
}
export async function buildImageRequest(_0x24bad0, _0x8201d8, _0xc38a03) {
  if (_0x24bad0.model === 'ppio/seedream-5.0-lite')
    return buildPpioSeedreamRequest('5.0-lite', _0x24bad0, _0x8201d8, _0xc38a03, { imageField: 'image' });
  if (_0x24bad0.model === 'ppio/seedream-4.5')
    return buildPpioSeedreamRequest('4.5', _0x24bad0, _0x8201d8, _0xc38a03, { imageField: 'image' });
  if (_0x24bad0.model === 'ppio/seedream-4.0')
    return buildPpioSeedreamRequest('4.0', _0x24bad0, _0x8201d8, _0xc38a03, {
      imageField: 'images',
      supportBatch: true,
    });
  throw new Error('PPIO 暂不支持模型 ' + (_0x24bad0.model || '(未指定)'));
}
export function getTextProxyApiUrl(_0x4100a2) {
  return _0x4100a2 + '/openai/v1';
}

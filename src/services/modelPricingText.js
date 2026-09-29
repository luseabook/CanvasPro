import { getLocale } from '../i18n/index.js';
const WORDS = {
  cnySecond: ['元 / 秒', 'CNY / second'],
  cnyImage: ['元\x20/\x20张', 'CNY / image'],
  cnyCall: ['元 / 次', 'CNY\x20/\x20request'],
  price: ['参考价', 'Reference price'],
  loading: ['参考价查询中', 'Loading reference price'],
  unavailable: ['参考价暂不可用', 'Reference price unavailable'],
  estimate: ['参考价', 'Reference price'],
  reference: ['参考价', 'Reference price'],
  free: ['免费', 'Free'],
  input: ['输入', 'Input'],
  output: ['输出', 'Output'],
  cached_input: ['缓存读取', 'Cache read'],
  explicit_cached_input: ['显式缓存读取', 'Explicit cache read'],
  cache_write: ['缓存写入', 'Cache\x20write'],
  cache_write_5m: ['缓存写入 · 5 分钟', 'Cache write · 5 min'],
  cache_write_1h: ['缓存写入 · 1 小时', 'Cache\x20write\x20·\x201\x20hour'],
  output_thinking: ['思考输出', 'Thinking output'],
  text_input: ['文本输入', 'Text input'],
  cached_text_input: ['文本缓存读取', 'Cached text input'],
  image_input: ['图片输入', 'Image input'],
  cached_image_input: ['图片缓存读取', 'Cached image input'],
  text_output: ['文本输出', 'Text\x20output'],
  image_output: ['图片输出', 'Image\x20output'],
  tokenUnit: ['美元 / 百万 tokens', 'USD\x20/\x20million\x20tokens'],
  second: ['美元 / 秒', 'USD / second'],
  image: ['美元\x20/\x20张', 'USD / image'],
  call: ['美元 / 次', 'USD / request'],
  inputImage: ['参考图输入', 'Reference image input'],
  storage: ['缓存存储', 'Cache storage'],
  usd_per_1000_queries: ['美元 / 千次调用', 'USD / 1,000 queries'],
  usd_per_page: ['美元 / 页', 'USD / page'],
  usd_per_million_token_hours: ['美元 / 百万 token·小时', 'USD / million token-hours'],
  web_search: ['联网搜索', 'Web search'],
  web_extractor: ['网页读取', 'Web extraction'],
  web_search_image: ['文字搜图', 'Image search'],
  image_search: ['以图搜图', 'Reverse image search'],
  google_web_search: ['Google 搜索', 'Google search'],
  code_interpreter: ['代码执行', 'Code interpreter'],
  tier: ['输入 token 档位', 'Input token tier'],
  unlimited: ['无上限', 'Unlimited'],
  listed: [
    '仅供参考，以账号实际账单为准。',
    'For\x20reference\x20only;\x20your\x20account\x20invoice\x20is\x20authoritative.',
  ],
  variable: [
    '费用受输出用量、参考素材和附加工具影响，不代表最终扣费。',
    'Output usage, references and tools may change the final charge.',
  ],
  unknown: [
    '厂商暂未提供可确认单位的公开价格。',
    'The provider has not published a price with a confirmed billing unit.',
  ],
  stale: ['上次价格（已过期）', 'Last known price (expired)'],
  updated: ['更新时间', 'Updated'],
  refreshFailed: [
    '刷新失败，保留上次价格；稍后重新打开重试。',
    'Refresh failed; showing the last price. Reopen later to retry.',
  ],
  timeWindow: ['当前时段', 'Current time window'],
  referenceVideo: ['参考视频', 'Reference video'],
  original: ['原价', 'List price'],
  total: ['参考价', 'Reference price'],
  parameterQuote: [
    '按当前生成参数查询，未计入参考素材的实际用量。',
    'Based on generation parameters; actual reference media usage is excluded.',
  ],
  textToImageQuote: [
    '此处为该模型的文生图基础参考价；图生图费用以实际账单为准。',
    'Text-to-image base reference price for this model; image editing charges follow the actual invoice.',
  ],
};
export function priceText(_0x4ff16e) {
  return WORDS[_0x4ff16e]?.[getLocale() === 'en-US' ? 0x1 : 0x0] || _0x4ff16e;
}
export function formatPrice(_0x4b8814, _0x4859fa = 'USD') {
  const _0x3cc95e = _0x4859fa === 'USD' ? '$' : _0x4859fa === 'CNY' ? '¥' : _0x4859fa + '\x20';
  if (_0x4b8814 === 0x0) return _0x3cc95e + '0';
  if (_0x4b8814 > 0x0 && _0x4b8814 < 0.000001) return '<' + _0x3cc95e + '0.000001';
  return (
    '' +
    _0x3cc95e +
    Number(_0x4b8814)['toLocaleString']('en-US', { minimumFractionDigits: 0x2, maximumFractionDigits: 0x6 })
  );
}

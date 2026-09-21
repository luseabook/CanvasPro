import { PROVIDERS_META, getApimartApiUrlForRoute } from '../src/modules/providers.js';
import { post, request } from './apiBase.js';
import { normalizeApimartBaseUrl } from './apimartUploadApi.js';
const TEST_TIMEOUT_MS = 0x7530,
  TEST_UPLOAD_TIMEOUT_MS = 0xea60,
  DEFAULT_PROVIDER_TEST_IDS = Object.freeze([
    'apimart',
    'volcengine',
    'agnes',
    'grsai',
    'ppio',
    'runninghub',
    'openai',
  ]),
  COMPLETION_FALLBACKS = Object.freeze({
    apimart: { model: 'deepseek-v4-flash', basePath: 'v1', label: 'DeepSeek V4 Flash' },
    agnes: { model: 'agnes-2.0-flash', basePath: 'v1', label: 'Agnes 2.0 Flash' },
    grsai: { model: 'gemini-3.1-pro', basePath: 'v1', label: 'Gemini 3.1 Pro' },
    ppio: { basePath: 'openai/v1' },
  }),
  GRSAI_COMPLETION_TEST_MESSAGE = '你好',
  STEP_LABELS = Object.freeze({
    config: '配置',
    auth: '密钥',
    model: '模型',
    balance: '余额',
    upload: '上传',
  }),
  SKIPPED_UPLOAD_PROVIDERS = Object.freeze({
    openai: 'OpenAI 兼容接口通常直接接收远程 URL，本轮不做独立上传测试',
    ppio: '派欧云当前链路不需要独立厂商上传，本轮只检测密钥和模型列表',
    volcengine: '火山方舟当前先检测 API Key 和服务连通性，模型素材上传待模型接入时验证',
    agnes: 'Agnes AI 兼容接口当前先检测 API Key 和服务连通性，素材沿模型链路上传',
  }),
  ONE_PIXEL_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
function isPlainObject(_0x5f2b8b) {
  return !!_0x5f2b8b && typeof _0x5f2b8b === 'object' && !Array.isArray(_0x5f2b8b);
}
function normalizeProviderId(_0x2fc2bb) {
  return String(_0x2fc2bb || '')
    .trim()
    .toLowerCase();
}
function trimSlashes(_0x1f8089) {
  return String(_0x1f8089 || '').replace(/^\/+|\/+$/g, '');
}
function normalizeBaseUrl(_0xdf4dda) {
  return String(_0xdf4dda || '')
    .trim()
    .replace(/\/+$/, '');
}
function joinUrl(_0x481e64, _0x8b5a28) {
  const _0x1f8846 = normalizeBaseUrl(_0x481e64),
    _0x4d4bdc = trimSlashes(_0x8b5a28);
  if (!_0x1f8846) return _0x4d4bdc;
  if (!_0x4d4bdc) return _0x1f8846;
  return _0x1f8846 + '/' + _0x4d4bdc;
}
function providerLabel(_0x55c026) {
  return PROVIDERS_META?.[_0x55c026]?.label || _0x55c026;
}
function providerConfigWithDefaults(_0x480195, _0x5c4aa7 = {}) {
  const _0x40c843 = isPlainObject(_0x5c4aa7) ? _0x5c4aa7 : {},
    _0x363533 = _0x480195 === 'grsai' ? PROVIDERS_META?.[_0x480195]?.defaultUrl || '' : '',
    _0x3b88e9 = _0x480195 === 'apimart' ? getApimartApiUrlForRoute(_0x40c843.routeId) : '';
  return {
    apiUrl: normalizeBaseUrl(
      _0x363533 || _0x40c843.apiUrl || _0x3b88e9 || PROVIDERS_META?.[_0x480195]?.defaultUrl || '',
    ),
    apiKey: String(_0x40c843.apiKey || '')
      .trim()
      .replace(/^Bearer\s+/i, ''),
    modelApiKey: String(_0x40c843.modelApiKey || '')
      .trim()
      .replace(/^Bearer\s+/i, ''),
  };
}
function stripKnownOpenAiTail(_0x200035) {
  return normalizeBaseUrl(_0x200035)
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/models$/i, '');
}
function buildModelsProbeUrl(_0x3b317f, _0x2ce6c6) {
  const _0x2753ae = normalizeProviderId(_0x3b317f),
    _0x3a8bf1 = stripKnownOpenAiTail(_0x2ce6c6);
  if (!_0x3a8bf1 || _0x3a8bf1.includes(':generateContent')) return '';
  if (_0x2753ae === 'ppio') return joinUrl(_0x3a8bf1.replace(/\/openai\/v1$/i, ''), 'openai/v1/models');
  if (/\/v\d+(?:beta)?$/i.test(_0x3a8bf1) || /\/openai\/v1$/i.test(_0x3a8bf1))
    return joinUrl(_0x3a8bf1, 'models');
  return joinUrl(_0x3a8bf1, 'v1/models');
}
function buildCompletionProbeUrl(_0x1d7bd2, _0x527f11) {
  const _0x20cd4d = COMPLETION_FALLBACKS[_0x1d7bd2];
  if (!_0x20cd4d) return '';
  const _0xbbf45f = stripKnownOpenAiTail(_0x527f11);
  if (!_0xbbf45f || _0xbbf45f.includes(':generateContent')) return '';
  if (_0x1d7bd2 === 'ppio') return joinUrl(_0xbbf45f.replace(/\/openai\/v1$/i, ''), _0x20cd4d.basePath);
  if (/\/v\d+(?:beta)?$/i.test(_0xbbf45f)) return _0xbbf45f;
  return joinUrl(_0xbbf45f, _0x20cd4d.basePath);
}
function buildVolcenginePingProbeUrl(_0x23e22d) {
  const _0x3db84a = stripKnownOpenAiTail(_0x23e22d);
  if (!_0x3db84a || _0x3db84a.includes(':generateContent')) return '';
  const _0x149ec0 = _0x3db84a.replace(/\/api\/v3$/i, '').replace(/\/api\/coding\/v3$/i, '');
  return joinUrl(_0x149ec0, 'ping');
}
function buildApimartBalanceProbeUrls(_0x170f09) {
  const _0x600e63 = stripKnownOpenAiTail(_0x170f09);
  if (!_0x600e63 || _0x600e63.includes(':generateContent')) return [];
  if (/\/v\d+(?:beta)?$/i.test(_0x600e63))
    return [joinUrl(_0x600e63, 'user/balance'), joinUrl(_0x600e63, 'balance')];
  return [joinUrl(_0x600e63, 'v1/user/balance'), joinUrl(_0x600e63, 'v1/balance')];
}
function buildRunningHubAccountStatusProbeUrl(_0x20b2ec) {
  const _0x405043 = normalizeBaseUrl(
    _0x20b2ec || PROVIDERS_META?.runninghub?.defaultUrl || 'https://www.runninghub.cn',
  )
    .replace(/\/openapi\/v2(?:\/.*)?$/i, '')
    .replace(/\/uc\/openapi\/accountStatus$/i, '');
  return joinUrl(_0x405043, 'uc/openapi/accountStatus');
}
function buildGrsaiApiKeyCreditsProbeUrl(_0x2ead94) {
  const _0xbef559 = normalizeBaseUrl(
    _0x2ead94 || PROVIDERS_META?.grsai?.defaultUrl || 'https://grsai.dakka.com.cn',
  )
    .replace(/\/v\d+(?:beta)?$/i, '')
    .replace(/\/client\/openapi\/getAPIKeyCredits$/i, '');
  return joinUrl(_0xbef559, 'client/openapi/getAPIKeyCredits');
}
function buildGrsaiAccountCreditsProbeUrl(_0xe79030) {
  const _0x422e19 = normalizeBaseUrl(
    _0xe79030 || PROVIDERS_META?.grsai?.defaultUrl || 'https://grsai.dakka.com.cn',
  )
    .replace(/\/v\d+(?:beta)?$/i, '')
    .replace(/\/client\/openapi\/getCredits$/i, '')
    .replace(/\/client\/common\/getCredits(?:\?.*)?$/i, '');
  return joinUrl(_0x422e19, 'client/openapi/getCredits');
}
function buildGrsaiCommonCreditsProbeUrl(_0x327085, _0x40574d) {
  const _0x38bc7d = normalizeBaseUrl(
    _0x327085 || PROVIDERS_META?.grsai?.defaultUrl || 'https://grsai.dakka.com.cn',
  )
    .replace(/\/v\d+(?:beta)?$/i, '')
    .replace(/\/client\/openapi\/getCredits$/i, '')
    .replace(/\/client\/openapi\/getAPIKeyCredits$/i, '')
    .replace(/\/client\/common\/getCredits(?:\?.*)?$/i, '');
  return joinUrl(_0x38bc7d, 'client/common/getCredits') + '?apikey=' + encodeURIComponent(_0x40574d);
}
function toFiniteNumber(_0x136821) {
  if (_0x136821 === null || _0x136821 === undefined || _0x136821 === '') return null;
  const _0x30fb54 = Number(_0x136821);
  return Number.isFinite(_0x30fb54) ? _0x30fb54 : null;
}
function formatBalanceNumber(_0x21d6f1) {
  const _0x441ef1 = toFiniteNumber(_0x21d6f1);
  if (_0x441ef1 === null) return '';
  return new Intl['NumberFormat']('zh-CN', { maximumFractionDigits: 6 }).format(_0x441ef1);
}
function formatCurrencyLabel(_0x163898) {
  const _0x3f0200 = String(_0x163898 || '')
    .trim()
    .toUpperCase();
  if (!_0x3f0200 || _0x3f0200 === 'CNY' || _0x3f0200 === 'RMB' || _0x3f0200 === 'CNH') return '人民币';
  return _0x3f0200;
}
export function normalizeApimartBalancePayload(_0x2dba0a = {}) {
  const _0x4fb493 =
    isPlainObject(_0x2dba0a?.data) && !Array.isArray(_0x2dba0a.data) ? _0x2dba0a.data : _0x2dba0a;
  if (!isPlainObject(_0x4fb493) || _0x4fb493.success === false) return null;
  const _0x48665e = _0x4fb493.unlimited_quota === true,
    _0x29f429 = toFiniteNumber(_0x4fb493.remain_balance ?? _0x4fb493.remaining_balance ?? _0x4fb493.balance),
    _0x247a66 = _0x48665e ? null : _0x29f429,
    _0x37fe4b = toFiniteNumber(_0x4fb493.used_balance);
  if (!_0x48665e && _0x247a66 === null) return null;
  const _0x4e656a = _0x247a66 === null ? '' : formatBalanceNumber(_0x247a66),
    _0x45315c = [];
  if (_0x48665e) _0x45315c.push('额度不限');
  if (_0x4e656a) _0x45315c.push('剩余余额：' + _0x4e656a + ' 美元');
  return {
    unlimited: _0x48665e,
    remaining: _0x247a66,
    used: _0x37fe4b,
    displayText: _0x48665e ? '余额 不限' : _0x4e656a ? '余额 ' + _0x4e656a + ' 美元' : '余额 已读取',
    detailText: _0x45315c.join('；') || 'APIMart 余额已读取',
  };
}
function normalizeRunningHubAccountStatusPayload(_0x552068 = {}) {
  const _0x511920 =
    isPlainObject(_0x552068?.data) && !Array.isArray(_0x552068.data) ? _0x552068.data : _0x552068;
  if (!isPlainObject(_0x511920)) return null;
  if (_0x511920.success === false) return null;
  if (_0x511920.code !== undefined && Number(_0x511920.code) !== 0) return null;
  const _0x25d9e4 =
      isPlainObject(_0x511920.data) && !Array.isArray(_0x511920.data) ? _0x511920.data : _0x511920,
    _0x24216f = toFiniteNumber(_0x25d9e4.remainCoins ?? _0x25d9e4.remain_coins ?? _0x25d9e4.coins),
    _0x2eb51b = toFiniteNumber(
      _0x25d9e4.remainMoney ?? _0x25d9e4.remain_money ?? _0x25d9e4.money ?? _0x25d9e4.balance,
    );
  if (_0x24216f === null && _0x2eb51b === null) return null;
  const _0x593ddc =
    String(_0x25d9e4.currency || 'CNY')
      .trim()
      .toUpperCase() || 'CNY';
  return {
    coins: _0x24216f,
    money: _0x2eb51b,
    currency: _0x593ddc,
    apiType: String(_0x25d9e4.apiType || _0x25d9e4.api_type || '').trim(),
  };
}
export function normalizeRunningHubBalancePayload({ workflow: _0x4df6ec, model: _0x28fa41 } = {}) {
  const _0x328500 = normalizeRunningHubAccountStatusPayload(_0x4df6ec),
    _0x246a11 = normalizeRunningHubAccountStatusPayload(_0x28fa41),
    _0x373e34 = _0x328500?.coins ?? null,
    _0x1579ea = _0x246a11?.money ?? null;
  if (_0x373e34 === null && _0x1579ea === null) return null;
  const _0x7b75be = _0x246a11?.currency || _0x328500?.currency || 'CNY',
    _0x9b37d4 = formatCurrencyLabel(_0x7b75be),
    _0x48ad57 = formatBalanceNumber(_0x373e34),
    _0x2150ae = formatBalanceNumber(_0x1579ea),
    _0x492432 = [],
    _0x47ea77 = [];
  return (
    _0x48ad57 && (_0x492432.push('积分 ' + _0x48ad57), _0x47ea77.push('工作流积分：' + _0x48ad57)),
    _0x2150ae &&
      (_0x492432.push('钱包 ' + _0x2150ae + ' ' + _0x9b37d4),
      _0x47ea77.push('模型钱包：' + _0x2150ae + ' ' + _0x9b37d4)),
    {
      workflowCredits: _0x373e34,
      modelWallet: _0x1579ea,
      currency: _0x7b75be,
      currencyLabel: _0x9b37d4,
      displayText: _0x492432.join(' · ') || '余额 已读取',
      detailText: _0x47ea77.join('；') || 'RunningHUB 账户信息已读取',
    }
  );
}
function isSuccessfulGrsaiPayload(_0x3f44eb) {
  if (!isPlainObject(_0x3f44eb)) return true;
  if (_0x3f44eb.success === false || _0x3f44eb.ok === false) return false;
  const _0x45d252 = _0x3f44eb.code ?? _0x3f44eb.statusCode;
  if (_0x45d252 !== undefined) {
    const _0x382a18 = Number(_0x45d252);
    return _0x382a18 === 0 || _0x382a18 === 200;
  }
  return true;
}
function unwrapGrsaiCreditsPayload(_0x272a12) {
  if (!isPlainObject(_0x272a12)) return _0x272a12;
  if (!isSuccessfulGrsaiPayload(_0x272a12)) return null;
  if (_0x272a12.data !== undefined) return unwrapGrsaiCreditsPayload(_0x272a12.data);
  if (_0x272a12.result !== undefined) return unwrapGrsaiCreditsPayload(_0x272a12.result);
  return _0x272a12;
}
function extractGrsaiCreditsValue(_0x4e54bf, _0x448fcc = new Set()) {
  const _0xe67afd = toFiniteNumber(_0x4e54bf);
  if (_0xe67afd !== null) return _0xe67afd;
  if (!isPlainObject(_0x4e54bf) || _0x448fcc.has(_0x4e54bf)) return null;
  _0x448fcc.add(_0x4e54bf);
  const _0x53a4da = [
    'currentCredits',
    'availableCredits',
    'remainingCredits',
    'remainCredits',
    'remain_credits',
    'remaining_credits',
    'accountCredits',
    'account_credits',
    'totalCredits',
    'total_credits',
    'apiKeyCredits',
    'api_key_credits',
    'credits',
    'credit',
    'balance',
    'amount',
  ];
  for (const _0x555a48 of _0x53a4da) {
    if (_0x4e54bf[_0x555a48] === undefined) continue;
    const _0x4473d3 = extractGrsaiCreditsValue(_0x4e54bf[_0x555a48], _0x448fcc);
    if (_0x4473d3 !== null) return _0x4473d3;
  }
  for (const _0xa5557e of ['account', 'user', 'wallet', 'quota']) {
    if (_0x4e54bf[_0xa5557e] === undefined) continue;
    const _0x362d90 = extractGrsaiCreditsValue(_0x4e54bf[_0xa5557e], _0x448fcc);
    if (_0x362d90 !== null) return _0x362d90;
  }
  return null;
}
export function normalizeGrsaiBalancePayload(_0x5e4482 = {}, _0x30aba3 = {}) {
  const _0x346090 = unwrapGrsaiCreditsPayload(_0x5e4482);
  if (_0x346090 === null) return null;
  const _0x151465 = toFiniteNumber(extractGrsaiCreditsValue(_0x346090));
  if (_0x151465 === null) return null;
  const _0x3f95c9 = formatBalanceNumber(_0x151465),
    _0xcb4276 = _0x30aba3.source || 'account',
    _0x1515fd = _0xcb4276 === 'apiKey' ? 'API Key 积分' : '账户积分';
  return {
    credits: _0x151465,
    source: _0xcb4276,
    displayText: '积分 ' + _0x3f95c9,
    detailText: _0x1515fd + '：' + _0x3f95c9,
  };
}
function stringifyProbePayload(_0x1b532e) {
  if (_0x1b532e == null) return '';
  if (typeof _0x1b532e === 'string') return _0x1b532e;
  try {
    return JSON.stringify(_0x1b532e);
  } catch {
    return String(_0x1b532e || '');
  }
}
function probeText(_0x5e8070 = {}) {
  return [
    _0x5e8070.status ? 'HTTP ' + _0x5e8070.status : '',
    _0x5e8070.error || '',
    stringifyProbePayload(_0x5e8070.data),
  ]
    .filter(Boolean)
    .join(' ');
}
function normalizeErrorText(_0x23381e = '') {
  return String(_0x23381e || '')
    .replace(/\s+/g, ' ')
    .trim();
}
function isAuthFailure(_0x472d85 = {}) {
  const _0x28cf47 = Number(_0x472d85.status || 0);
  if (_0x28cf47 === 0x191 || _0x28cf47 === 0x193) return true;
  const _0x332645 = probeText(_0x472d85).toLowerCase();
  return /(?:\b401\b|\b403\b|unauthorized|forbidden|authentication|authorization|invalid\s+(?:api\s*)?key|invalid\s+token|api\s*key\s+invalid|apikey|bearer|access\s*token|鉴权|认证|未授权|无权限|密钥|令牌)/i.test(
    _0x332645,
  );
}
function classifyProbeFailure(_0x162724 = {}, _0x3a56f5 = 'provider_error') {
  const _0xc77460 = Number(_0x162724.status || 0),
    _0x54444b = probeText(_0x162724).toLowerCase();
  if (isAuthFailure(_0x162724)) return 'auth_failed';
  if (
    _0xc77460 === 0 ||
    /timeout|timed out|network|failed to fetch|dns|econn|请求超时|网络请求失败/i.test(_0x54444b)
  )
    return 'network_failed';
  if (_0xc77460 === 0x1ad || /rate limit|too many requests|限流|请求过于频繁/i.test(_0x54444b))
    return 'rate_limited';
  if (/insufficient|quota|balance|billing|credit|payment|额度|余额|欠费|付费|账户余额/i.test(_0x54444b))
    return 'quota_or_balance';
  if (
    /model.+(?:not found|not exist|unavailable|no access)|模型.*(?:不存在|不可用|无权限|未开通)|no permission.*model/i.test(
      _0x54444b,
    )
  )
    return 'model_unavailable';
  if (
    _0xc77460 === 0x194 ||
    /not found|invalid url|unsupported endpoint|cannot post|cannot get|接口地址|地址不兼容/i.test(_0x54444b)
  )
    return 'bad_base_url';
  return _0x3a56f5;
}
function humanizeCategory(_0x279179, _0x290080, _0x413bde = '连接测试未通过') {
  const _0xc43dd4 = providerLabel(_0x290080),
    _0x18e185 = {
      missing_key: _0xc43dd4 + ' 的 API Key 还没填写。',
      missing_url: _0xc43dd4 + ' 的接口地址未配置。',
      auth_failed: _0xc43dd4 + ' 的 API Key 无效、过期，或没有访问权限。',
      network_failed: '无法连到 ' + _0xc43dd4 + '，请检查网络、本地服务或防火墙。',
      rate_limited: _0xc43dd4 + ' 返回限流，请稍后再试。',
      quota_or_balance: _0xc43dd4 + ' 账户额度或余额可能不足。',
      model_unavailable: _0xc43dd4 + ' 的测试模型不可访问，可能未开通该模型或模型名不兼容。',
      bad_base_url: _0xc43dd4 + ' 的接口地址不兼容，请检查 Base URL 是否填对。',
      upload_failed: _0xc43dd4 + ' 上传链路未通过，参考图/视频上传可能会失败。',
      provider_error: _0xc43dd4 + ' 返回异常，稍后重试或查看厂商后台状态。',
      unsupported: _0xc43dd4 + ' 暂不支持连接测试。',
    };
  return _0x18e185[_0x279179] || _0x413bde;
}
function isSuccessfulProbe(_0x33776e = {}) {
  if (!_0x33776e.success) return false;
  const _0x2de86f = Number(_0x33776e.status || 0);
  if (_0x2de86f && (_0x2de86f < 200 || _0x2de86f >= 0x12c)) return false;
  return !isAuthFailure(_0x33776e);
}
function summarizeFailure(_0x4055c1 = {}, _0x462925 = '连接测试未通过') {
  const _0x2e6747 = probeText(_0x4055c1).trim();
  if (!_0x2e6747) return _0x462925;
  return _0x2e6747.length > 180 ? _0x2e6747.slice(0, 177) + '...' : _0x2e6747;
}
function makeStep(_0x45a729, _0x2c3d0b, _0x3747e1, _0x322fdb = '', _0x5f0c86 = {}) {
  return {
    id: _0x45a729,
    label: STEP_LABELS[_0x45a729] || _0x45a729,
    ok: Boolean(_0x2c3d0b),
    skipped: _0x5f0c86.skipped === true,
    message: _0x3747e1,
    detail: normalizeErrorText(_0x322fdb),
    category: _0x5f0c86.category || '',
  };
}
function pass(_0x3777cb, _0x457666 = '连接测试通过', _0x31ed8a = []) {
  return {
    ok: true,
    providerId: _0x3777cb,
    label: providerLabel(_0x3777cb),
    message: '通过',
    summary: '连接测试通过',
    detail: _0x457666,
    category: '',
    suggestion: '',
    steps: _0x31ed8a,
  };
}
function fail(_0xbec2f9, _0x391c7b, _0x44ee31 = [], _0x290b55 = 'provider_error') {
  return {
    ok: false,
    providerId: _0xbec2f9,
    label: providerLabel(_0xbec2f9),
    message: '未通过',
    error: String(_0x391c7b || '连接测试未通过'),
    summary: String(_0x391c7b || '连接测试未通过'),
    category: _0x290b55,
    suggestion: humanizeCategory(_0x290b55, _0xbec2f9, _0x391c7b),
    steps: _0x44ee31,
  };
}
function finishProviderResult(_0xf9c0f7, _0x39d12d = []) {
  const _0x30f7f3 = _0x39d12d.find((_0x3834c3) => !_0x3834c3.ok && !_0x3834c3.skipped),
    _0x53d384 = _0x39d12d.filter((_0x490863) => _0x490863.ok),
    _0x5afaa9 = _0x39d12d.filter((_0x524d33) => _0x524d33.skipped);
  if (!_0x30f7f3) {
    const _0xdcbbf8 = _0x39d12d.map((_0x3a0244) => _0x3a0244.label + ': ' + _0x3a0244.message).join('；');
    return pass(_0xf9c0f7, _0xdcbbf8 || '连接测试通过', _0x39d12d);
  }
  const _0xdf60f8 = _0x30f7f3.category || 'provider_error',
    _0x2cde76 = _0x30f7f3.message || humanizeCategory(_0xdf60f8, _0xf9c0f7),
    _0x464e8c = _0x39d12d.map((_0x217c09) => {
      const _0x565e68 = _0x217c09.skipped ? '跳过' : _0x217c09.ok ? '通过' : '失败';
      return '' + _0x217c09.label + _0x565e68 + ': ' + _0x217c09.message;
    });
  return {
    ok: false,
    partial: _0x53d384.length > 0 || _0x5afaa9.length > 0,
    providerId: _0xf9c0f7,
    label: providerLabel(_0xf9c0f7),
    message: _0x53d384.length > 0 ? '部分通过' : '未通过',
    error: _0x2cde76,
    summary: _0x2cde76,
    detail: _0x464e8c.join('；'),
    category: _0xdf60f8,
    suggestion: humanizeCategory(_0xdf60f8, _0xf9c0f7, _0x2cde76),
    steps: _0x39d12d,
  };
}
async function getModelsProbe(_0x22c811, _0x532d93, _0x507205) {
  const _0x22fc80 = await request(
    '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x532d93),
    { method: 'GET', headers: { Authorization: 'Bearer ' + _0x507205 } },
    TEST_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(_0x22fc80)) return makeStep('auth', true, 'API Key 可用，模型列表可访问', 'models');
  const _0x5d1729 = classifyProbeFailure(_0x22fc80);
  return {
    ...makeStep('auth', false, humanizeCategory(_0x5d1729, _0x22c811), summarizeFailure(_0x22fc80), {
      category: _0x5d1729,
    }),
    authFailed: isAuthFailure(_0x22fc80),
  };
}
async function completionFallbackProbe(_0x59e0b6, _0xbad7a, _0x228fb6) {
  const _0x1c0b4f = COMPLETION_FALLBACKS[_0x59e0b6],
    _0x3067af = buildCompletionProbeUrl(_0x59e0b6, _0xbad7a);
  if (!_0x1c0b4f?.model || !_0x3067af)
    return makeStep('model', true, '模型列表可访问，未执行额外模型调用', 'no completion fallback', {
      skipped: true,
    });
  const _0x1295c5 = {
    apiUrl: _0x3067af,
    apiKey: _0x228fb6,
    model: _0x1c0b4f.model,
    stream: false,
    messages: [{ role: 'user', content: _0x59e0b6 === 'grsai' ? GRSAI_COMPLETION_TEST_MESSAGE : 'ping' }],
  };
  _0x59e0b6 !== 'grsai' && (_0x1295c5.max_tokens = 1);
  const _0x347b7c = await post('/api/v2/proxy/completions', _0x1295c5, TEST_TIMEOUT_MS);
  if (isSuccessfulProbe(_0x347b7c))
    return makeStep(
      'model',
      true,
      '测试模型 ' + (_0x1c0b4f.label || _0x1c0b4f.model) + ' 可访问',
      'chat-completions',
    );
  const _0x479c29 = classifyProbeFailure(_0x347b7c, 'model_unavailable');
  return makeStep('model', false, humanizeCategory(_0x479c29, _0x59e0b6), summarizeFailure(_0x347b7c), {
    category: _0x479c29,
  });
}
async function apimartBalanceProbe(_0x428b90, _0x5e3729) {
  const _0x5810b0 = buildApimartBalanceProbeUrls(_0x5e3729.apiUrl);
  if (_0x5810b0.length <= 0)
    return {
      step: makeStep('balance', true, '余额接口地址不可用，已跳过', 'no balance endpoint', {
        skipped: true,
      }),
      balance: null,
    };
  let _0x5d60ce = null;
  for (const _0x255eab of _0x5810b0) {
    const _0x446e06 = await request(
      '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x255eab),
      { method: 'GET', headers: { Authorization: 'Bearer ' + _0x5e3729.apiKey } },
      TEST_TIMEOUT_MS,
    );
    _0x5d60ce = _0x446e06;
    if (isSuccessfulProbe(_0x446e06)) {
      const _0x4bc920 = normalizeApimartBalancePayload(_0x446e06.data);
      if (_0x4bc920)
        return {
          step: makeStep(
            'balance',
            true,
            _0x4bc920.detailText || 'APIMart 余额已读取',
            _0x255eab.includes('/user/balance') ? 'apimart-user-balance' : 'apimart-token-balance',
          ),
          balance: _0x4bc920,
        };
    }
  }
  return {
    step: makeStep(
      'balance',
      true,
      '余额暂未返回，连接测试继续',
      summarizeFailure(_0x5d60ce, 'APIMart 余额接口未返回可识别数据'),
      { skipped: true },
    ),
    balance: null,
  };
}
async function grsaiCreditsRequest(_0x55b209, _0x144153) {
  if (_0x55b209.id === 'account')
    return request(
      buildGrsaiAccountCreditsProbeUrl(_0x144153.apiUrl),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: _0x144153.apiKey }),
      },
      TEST_TIMEOUT_MS,
    );
  if (_0x55b209.id === 'common')
    return request(
      buildGrsaiCommonCreditsProbeUrl(_0x144153.apiUrl, _0x144153.apiKey),
      { method: 'GET', headers: { Authorization: 'Bearer ' + _0x144153.apiKey } },
      TEST_TIMEOUT_MS,
    );
  return request(
    buildGrsaiApiKeyCreditsProbeUrl(_0x144153.apiUrl),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + _0x144153.apiKey },
      body: JSON.stringify({ apikey: _0x144153.apiKey }),
    },
    TEST_TIMEOUT_MS,
  );
}
async function grsaiBalanceProbe(_0x1edd51) {
  const _0x1e811a = [
    { id: 'account', source: 'account', detail: 'grsai-account-credits' },
    { id: 'common', source: 'account', detail: 'grsai-common-credits' },
    { id: 'apiKey', source: 'apiKey', detail: 'grsai-api-key-credits' },
  ];
  let _0x220ab2 = null,
    _0x6114fb = null;
  for (const _0x142e6e of _0x1e811a) {
    const _0x5dde88 = await grsaiCreditsRequest(_0x142e6e, _0x1edd51);
    _0x6114fb = _0x5dde88;
    if (!isSuccessfulProbe(_0x5dde88)) continue;
    const _0x5e9546 = normalizeGrsaiBalancePayload(_0x5dde88.data, { source: _0x142e6e.source });
    if (!_0x5e9546) continue;
    if (_0x5e9546.credits > 0)
      return {
        step: makeStep('balance', true, _0x5e9546.detailText || 'GRSAI 积分已读取', _0x142e6e.detail),
        balance: _0x5e9546,
      };
    if (!_0x220ab2) _0x220ab2 = { balance: _0x5e9546, detail: _0x142e6e.detail };
  }
  if (_0x220ab2)
    return {
      step: makeStep('balance', true, _0x220ab2.balance.detailText || 'GRSAI 积分已读取', _0x220ab2.detail),
      balance: _0x220ab2.balance,
    };
  return {
    step: makeStep(
      'balance',
      true,
      '积分暂未返回，连接测试继续',
      summarizeFailure(_0x6114fb, 'GRSAI 积分接口未返回可识别数据'),
      { skipped: true },
    ),
    balance: null,
  };
}
async function runningHubAccountStatusProbe(_0x50cce8, _0xb96a43) {
  const _0x576963 = String(_0xb96a43 || '').trim();
  if (!_0x576963) return null;
  const _0x505c9a = buildRunningHubAccountStatusProbeUrl(_0x50cce8.apiUrl),
    _0x381a2e = await post(
      '/api/v2/proxy/image',
      { apiUrl: _0x505c9a, apiKey: _0x576963, apikey: _0x576963 },
      TEST_TIMEOUT_MS,
    );
  return isSuccessfulProbe(_0x381a2e) ? _0x381a2e.data : null;
}
async function runningHubBalanceProbe(_0x455270) {
  const [_0x523ab0, _0x4a6080] = await Promise.all([
      runningHubAccountStatusProbe(_0x455270, _0x455270.apiKey),
      runningHubAccountStatusProbe(_0x455270, _0x455270.modelApiKey),
    ]),
    _0x54da9f = normalizeRunningHubBalancePayload({ workflow: _0x523ab0, model: _0x4a6080 });
  if (_0x54da9f)
    return {
      step: makeStep(
        'balance',
        true,
        _0x54da9f.detailText || 'RunningHUB 账户信息已读取',
        'runninghub-account-status',
      ),
      balance: _0x54da9f,
    };
  return {
    step: makeStep(
      'balance',
      true,
      '账户信息暂未返回，连接测试继续',
      'RunningHUB 账户信息接口未返回可识别数据',
      { skipped: true },
    ),
    balance: null,
  };
}
function createTinyPngBlob() {
  const _0x29d667 =
      typeof atob === 'function'
        ? atob(ONE_PIXEL_PNG_BASE64)
        : Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64').toString('binary'),
    _0x3d02d5 = new Uint8Array(_0x29d667.length);
  for (let _0x3635ac = 0; _0x3635ac < _0x29d667.length; _0x3635ac++) {
    _0x3d02d5[_0x3635ac] = _0x29d667.charCodeAt(_0x3635ac);
  }
  return new Blob([_0x3d02d5], { type: 'image/png' });
}
async function grsaiUploadProbe(_0x2b1602, _0x48f472) {
  const _0x470047 = await request(
    'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(_0x48f472 ? { Authorization: 'Bearer ' + _0x48f472 } : {}),
      },
      body: JSON.stringify({ sux: 'png' }),
    },
    TEST_UPLOAD_TIMEOUT_MS,
  );
  if (!isSuccessfulProbe(_0x470047) || !_0x470047.data?.data) {
    const _0x1d9431 = classifyProbeFailure(_0x470047, 'upload_failed');
    return makeStep(
      'upload',
      false,
      humanizeCategory(_0x1d9431 === 'provider_error' ? 'upload_failed' : _0x1d9431, _0x2b1602),
      summarizeFailure(_0x470047, 'GRSAI 上传凭证获取失败'),
      { category: _0x1d9431 === 'provider_error' ? 'upload_failed' : _0x1d9431 },
    );
  }
  const { token: _0xc0b892, key: _0x40966f, url: _0x4fabb4 } = _0x470047.data.data;
  if (!_0xc0b892 || !_0x40966f || !_0x4fabb4)
    return makeStep('upload', false, 'GRSAI 上传凭证返回不完整。', stringifyProbePayload(_0x470047.data), {
      category: 'upload_failed',
    });
  const _0x22fd2a = new FormData();
  (_0x22fd2a.append('token', _0xc0b892),
    _0x22fd2a.append('key', _0x40966f),
    _0x22fd2a.append('file', createTinyPngBlob(), 'aic-connection-test.png'));
  const _0x3612f4 = await request(_0x4fabb4, { method: 'POST', body: _0x22fd2a }, TEST_UPLOAD_TIMEOUT_MS);
  if (isSuccessfulProbe(_0x3612f4)) return makeStep('upload', true, '上传链路可用', 'qiniu');
  const _0x21aa4c = classifyProbeFailure(_0x3612f4, 'upload_failed');
  return makeStep(
    'upload',
    false,
    humanizeCategory(_0x21aa4c === 'provider_error' ? 'upload_failed' : _0x21aa4c, _0x2b1602),
    summarizeFailure(_0x3612f4, 'GRSAI 上传失败'),
    { category: _0x21aa4c === 'provider_error' ? 'upload_failed' : _0x21aa4c },
  );
}
async function apimartUploadProbe(_0x1cc4ec, _0x448a8e) {
  const _0x4a9416 = new FormData();
  (_0x4a9416.append('file', createTinyPngBlob(), 'aic-connection-test.png'),
    _0x4a9416.append('contentType', 'image/png'),
    _0x4a9416.append('fileExtension', 'png'),
    _0x4a9416.append('permanent', '0'),
    _0x4a9416.append('apiKey', _0x448a8e.apiKey),
    _0x4a9416.append('apiUrl', normalizeApimartBaseUrl(_0x448a8e.apiUrl)));
  const _0x3829d5 = await post('/api/v2/proxy/apimart-upload', _0x4a9416, TEST_UPLOAD_TIMEOUT_MS);
  if (isSuccessfulProbe(_0x3829d5) && (_0x3829d5.data?.cdnUrl || _0x3829d5.data?.url))
    return makeStep('upload', true, '上传链路可用', 'apimart-upload');
  const _0x1d9343 = classifyProbeFailure(_0x3829d5, 'upload_failed');
  return makeStep(
    'upload',
    false,
    humanizeCategory(_0x1d9343 === 'provider_error' ? 'upload_failed' : _0x1d9343, _0x1cc4ec),
    summarizeFailure(_0x3829d5, 'APIMart 上传失败'),
    { category: _0x1d9343 === 'provider_error' ? 'upload_failed' : _0x1d9343 },
  );
}
async function runningHubUploadProbe(_0x184e68, _0x11e4f3) {
  if (!_0x11e4f3)
    return makeStep('upload', true, '未填写模型 API Key，跳过模型上传链路', 'no model api key', {
      skipped: true,
    });
  const _0x4b8c56 = 'https://www.runninghub.cn/openapi/v2/media/upload/binary',
    _0x5a1e79 = new FormData();
  _0x5a1e79.append('file', createTinyPngBlob(), 'aic-connection-test.png');
  const _0x478864 = await request(
    '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(_0x4b8c56),
    { method: 'POST', headers: { Authorization: 'Bearer ' + _0x11e4f3 }, body: _0x5a1e79 },
    TEST_UPLOAD_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(_0x478864) && _0x478864.data?.data?.download_url)
    return makeStep('upload', true, '上传链路可用', 'runninghub-upload');
  const _0x594e45 = classifyProbeFailure(_0x478864, 'upload_failed');
  return makeStep(
    'upload',
    false,
    humanizeCategory(_0x594e45 === 'provider_error' ? 'upload_failed' : _0x594e45, _0x184e68),
    summarizeFailure(_0x478864, 'RunningHUB 上传失败'),
    { category: _0x594e45 === 'provider_error' ? 'upload_failed' : _0x594e45 },
  );
}
async function uploadProbe(_0x57fac9, _0x5523e5) {
  if (_0x57fac9 === 'grsai') return grsaiUploadProbe(_0x57fac9, _0x5523e5.apiKey);
  if (_0x57fac9 === 'apimart') return apimartUploadProbe(_0x57fac9, _0x5523e5);
  if (_0x57fac9 === 'runninghub') return runningHubUploadProbe(_0x57fac9, _0x5523e5.modelApiKey);
  return makeStep(
    'upload',
    true,
    SKIPPED_UPLOAD_PROVIDERS[_0x57fac9] || '当前厂商无需独立上传检测',
    'skipped',
    { skipped: true },
  );
}
async function openAiLikeProviderProbe(_0x791268, _0xa775cd) {
  const _0x9c0ceb = providerConfigWithDefaults(_0x791268, _0xa775cd),
    _0x45db1a = [];
  let _0x588399 = null,
    _0x174551 = false;
  if (!_0x9c0ceb.apiKey)
    return (
      _0x45db1a.push(makeStep('config', false, 'API Key 未填写', '', { category: 'missing_key' })),
      finishProviderResult(_0x791268, _0x45db1a)
    );
  if (!_0x9c0ceb.apiUrl)
    return (
      _0x45db1a.push(makeStep('config', false, '接口地址未配置', '', { category: 'missing_url' })),
      finishProviderResult(_0x791268, _0x45db1a)
    );
  _0x45db1a.push(makeStep('config', true, '接口地址和 API Key 已填写'));
  const _0x5c274c = _0x791268 === 'grsai' ? '' : buildModelsProbeUrl(_0x791268, _0x9c0ceb.apiUrl);
  if (_0x5c274c) {
    const _0x26c6aa = await getModelsProbe(_0x791268, _0x5c274c, _0x9c0ceb.apiKey);
    if (_0x26c6aa.ok) (_0x45db1a.push(_0x26c6aa), (_0x174551 = true));
    else {
      if (_0x26c6aa.authFailed || !COMPLETION_FALLBACKS[_0x791268]?.model)
        return (_0x45db1a.push(_0x26c6aa), finishProviderResult(_0x791268, _0x45db1a));
      else
        _0x45db1a.push(
          makeStep('auth', true, '模型列表不可用，已改用轻量模型调用继续检测', _0x26c6aa.detail, {
            skipped: true,
          }),
        );
    }
  }
  _0x791268 === 'apimart' && _0x174551
    ? _0x45db1a.push(
        makeStep('model', true, '模型列表可访问，未执行额外模型调用', 'models', { skipped: true }),
      )
    : _0x45db1a.push(await completionFallbackProbe(_0x791268, _0x9c0ceb.apiUrl, _0x9c0ceb.apiKey));
  if (_0x45db1a.some((_0xd0494c) => !_0xd0494c.ok && !_0xd0494c.skipped))
    return finishProviderResult(_0x791268, _0x45db1a);
  if (_0x791268 === 'apimart') {
    const _0x264834 = await apimartBalanceProbe(_0x791268, _0x9c0ceb);
    (_0x45db1a.push(_0x264834.step), (_0x588399 = _0x264834.balance));
  } else {
    if (_0x791268 === 'grsai') {
      const _0x486415 = await grsaiBalanceProbe(_0x9c0ceb);
      (_0x45db1a.push(_0x486415.step), (_0x588399 = _0x486415.balance));
    }
  }
  _0x45db1a.push(await uploadProbe(_0x791268, _0x9c0ceb));
  const _0x27ad4b = finishProviderResult(_0x791268, _0x45db1a);
  return _0x588399 ? { ..._0x27ad4b, balance: _0x588399 } : _0x27ad4b;
}
function runningHubProbePassed(_0x3e07e8 = {}) {
  if (isAuthFailure(_0x3e07e8)) return false;
  if (_0x3e07e8.success) return true;
  const _0x5b8c16 = Number(_0x3e07e8.status || 0);
  return _0x5b8c16 >= 0x190 && _0x5b8c16 < 0x1f4;
}
async function runningHubWorkflowProbe(_0x5a048b) {
  const _0x1d795b = await post(
    '/api/v2/runninghubwf/query',
    { apiKey: _0x5a048b, taskId: 'aic-connection-test' },
    TEST_TIMEOUT_MS,
  );
  return runningHubProbePassed(_0x1d795b)
    ? makeStep('auth', true, '工作流 API Key 可用', 'workflow')
    : makeStep(
        'auth',
        false,
        humanizeCategory(classifyProbeFailure(_0x1d795b), 'runninghub'),
        summarizeFailure(_0x1d795b, '工作流 API Key 测试未通过'),
        { category: classifyProbeFailure(_0x1d795b) },
      );
}
async function runningHubModelProbe(_0x245793) {
  const _0x5d0432 = await post(
    '/api/v2/proxy/image',
    {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/query',
      apiKey: _0x245793,
      taskId: 'aic-connection-test',
    },
    TEST_TIMEOUT_MS,
  );
  return runningHubProbePassed(_0x5d0432)
    ? makeStep('model', true, '模型 API Key 可用', 'model-api')
    : makeStep(
        'model',
        false,
        humanizeCategory(classifyProbeFailure(_0x5d0432, 'model_unavailable'), 'runninghub'),
        summarizeFailure(_0x5d0432, '模型 API Key 测试未通过'),
        { category: classifyProbeFailure(_0x5d0432, 'model_unavailable') },
      );
}
async function runningHubProviderProbe(_0x5abaff) {
  const _0x58e901 = providerConfigWithDefaults('runninghub', _0x5abaff),
    _0x149292 = [],
    _0x503bea = [];
  let _0x48eaa6 = null;
  if (_0x58e901.apiKey) _0x149292.push(runningHubWorkflowProbe(_0x58e901.apiKey));
  if (_0x58e901.modelApiKey) _0x149292.push(runningHubModelProbe(_0x58e901.modelApiKey));
  if (_0x149292.length === 0)
    return (
      _0x503bea.push(makeStep('config', false, 'API Key 未填写', '', { category: 'missing_key' })),
      finishProviderResult('runninghub', _0x503bea)
    );
  _0x503bea.push(makeStep('config', true, '已填写至少一个 RunningHUB API Key'));
  const _0x24c459 = await Promise.all(_0x149292);
  _0x503bea.push(..._0x24c459);
  const _0x359285 = await runningHubBalanceProbe(_0x58e901);
  (_0x503bea.push(_0x359285.step), (_0x48eaa6 = _0x359285.balance));
  !_0x503bea.some((_0x139cfe) => !_0x139cfe.ok && !_0x139cfe.skipped) &&
    _0x503bea.push(await uploadProbe('runninghub', _0x58e901));
  const _0x183061 = finishProviderResult('runninghub', _0x503bea);
  return _0x48eaa6 ? { ..._0x183061, balance: _0x48eaa6 } : _0x183061;
}
async function volcengineProviderProbe(_0x480bca) {
  const _0x291796 = providerConfigWithDefaults('volcengine', _0x480bca),
    _0xfbec26 = [];
  if (!_0x291796.apiKey)
    return (
      _0xfbec26.push(makeStep('config', false, 'API Key 未填写', '', { category: 'missing_key' })),
      finishProviderResult('volcengine', _0xfbec26)
    );
  if (!_0x291796.apiUrl)
    return (
      _0xfbec26.push(makeStep('config', false, '接口地址未配置', '', { category: 'missing_url' })),
      finishProviderResult('volcengine', _0xfbec26)
    );
  _0xfbec26.push(makeStep('config', true, '接口地址和 API Key 已填写'));
  const _0x216ccd = buildVolcenginePingProbeUrl(_0x291796.apiUrl);
  if (!_0x216ccd)
    return (
      _0xfbec26.push(
        makeStep('auth', false, '接口地址不兼容', _0x291796.apiUrl, { category: 'bad_base_url' }),
      ),
      finishProviderResult('volcengine', _0xfbec26)
    );
  const _0x200916 = await request(
    '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(_0x216ccd),
    { method: 'GET', headers: { Authorization: 'Bearer ' + _0x291796.apiKey } },
    TEST_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(_0x200916))
    return (
      _0xfbec26.push(makeStep('auth', true, '方舟 API Key 可用，服务可访问', 'ping')),
      _0xfbec26.push(await uploadProbe('volcengine', _0x291796)),
      finishProviderResult('volcengine', _0xfbec26)
    );
  const _0x208760 = classifyProbeFailure(_0x200916);
  return (
    _0xfbec26.push(
      makeStep(
        'auth',
        false,
        humanizeCategory(_0x208760, 'volcengine'),
        summarizeFailure(_0x200916, '火山方舟 ping 测试未通过'),
        { category: _0x208760 },
      ),
    ),
    finishProviderResult('volcengine', _0xfbec26)
  );
}
export async function testProviderConnection(_0xaa4aeb, _0x48cfea = {}) {
  const _0x266152 = normalizeProviderId(_0xaa4aeb);
  if (!DEFAULT_PROVIDER_TEST_IDS.includes(_0x266152))
    return fail(_0x266152 || 'unknown', '暂不支持该厂商的连接测试');
  if (_0x266152 === 'runninghub') return runningHubProviderProbe(_0x48cfea);
  if (_0x266152 === 'volcengine') return volcengineProviderProbe(_0x48cfea);
  return openAiLikeProviderProbe(_0x266152, _0x48cfea);
}
export async function testProviderConnections(_0x11a251 = {}, _0x2c07d3 = DEFAULT_PROVIDER_TEST_IDS) {
  const _0x3cfea1 = isPlainObject(_0x11a251?.providers) ? _0x11a251.providers : {},
    _0x8f0f1a = await Promise.all(
      _0x2c07d3.map(async (_0x4fa077) => {
        const _0x51eccb = normalizeProviderId(_0x4fa077),
          _0x25dfff = await testProviderConnection(_0x51eccb, _0x3cfea1[_0x51eccb] || {});
        return [_0x51eccb, _0x25dfff];
      }),
    );
  return Object.fromEntries(_0x8f0f1a);
}

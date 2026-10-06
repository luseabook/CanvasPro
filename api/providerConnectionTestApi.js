import { PROVIDERS_META, getApimartApiUrlForRoute } from '../src/modules/providers.js';
import { post, request } from './apiBase.js';
import { normalizeApimartBaseUrl } from './apimartUploadApi.js';
const TEST_TIMEOUT_MS = 30000,
  TEST_UPLOAD_TIMEOUT_MS = 60000,
  DEFAULT_PROVIDER_TEST_IDS = Object.freeze([
    'apimart',
    'volcengine',
    'agnes',
    'agnes-domestic',
    'grsai',
    'ppio',
    'runninghub',
    'openai',
  ]),
  COMPLETION_FALLBACKS = Object.freeze({
    apimart: { model: 'deepseek-v4-flash', basePath: 'v1', label: 'DeepSeek V4 Flash' },
    // Agnes 2.0 Flash is deprecated by the vendor and returns empty content, so the probe uses
    // the current flash model instead.
    agnes: { model: 'agnes-3.0-flash', basePath: 'v1', label: 'Agnes 3.0 Flash' },
    'agnes-domestic': { model: 'agnes-3.0-flash', basePath: 'v1', label: 'Agnes 3.0 Flash' },
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
    'agnes-domestic': 'Agnes AI 国内线路当前先检测 API Key 和服务连通性，素材沿模型链路上传',
  }),
  ONE_PIXEL_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';
function isPlainObject(enabled) {
  return !!enabled && typeof enabled === 'object' && !Array.isArray(enabled);
}
function normalizeProviderId(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
function trimSlashes(item) {
  return String(item || '').replace(/^\/+|\/+$/g, '');
}
function normalizeBaseUrl(key) {
  return String(key || '')
    .trim()
    .replace(/\/+$/, '');
}
function joinUrl(index, result) {
  const baseUrl = normalizeBaseUrl(index),
    trimSlashes2 = trimSlashes(result);
  if (!baseUrl) return trimSlashes2;
  if (!trimSlashes2) return baseUrl;
  return baseUrl + '/' + trimSlashes2;
}
function providerLabel(data) {
  return PROVIDERS_META?.[data]?.label || data;
}
function providerConfigWithDefaults(options, target = {}) {
  const isPlainObject2 = isPlainObject(target) ? target : {},
    source = options === 'grsai' ? PROVIDERS_META?.[options]?.defaultUrl || '' : '',
    next = options === 'apimart' ? getApimartApiUrlForRoute(isPlainObject2.routeId) : '';
  return {
    apiUrl: normalizeBaseUrl(
      source || isPlainObject2.apiUrl || next || PROVIDERS_META?.[options]?.defaultUrl || '',
    ),
    apiKey: String(isPlainObject2.apiKey || '')
      .trim()
      .replace(/^Bearer\s+/i, ''),
    modelApiKey: String(isPlainObject2.modelApiKey || '')
      .trim()
      .replace(/^Bearer\s+/i, ''),
  };
}
function stripKnownOpenAiTail(current) {
  return normalizeBaseUrl(current)
    .replace(/\/chat\/completions$/i, '')
    .replace(/\/models$/i, '');
}
function buildModelsProbeUrl(entry, record) {
  const providerId = normalizeProviderId(entry),
    list = stripKnownOpenAiTail(record);
  if (!list || list.includes(':generateContent')) return '';
  if (providerId === 'ppio') return joinUrl(list.replace(/\/openai\/v1$/i, ''), 'openai/v1/models');
  if (/\/v\d+(?:beta)?$/i.test(list) || /\/openai\/v1$/i.test(list)) return joinUrl(list, 'models');
  return joinUrl(list, 'v1/models');
}
function buildCompletionProbeUrl(payload, handle) {
  const enabled2 = COMPLETION_FALLBACKS[payload];
  if (!enabled2) return '';
  const list2 = stripKnownOpenAiTail(handle);
  if (!list2 || list2.includes(':generateContent')) return '';
  if (payload === 'ppio') return joinUrl(list2.replace(/\/openai\/v1$/i, ''), enabled2.basePath);
  if (/\/v\d+(?:beta)?$/i.test(list2)) return list2;
  return joinUrl(list2, enabled2.basePath);
}
function buildVolcenginePingProbeUrl(state) {
  const list3 = stripKnownOpenAiTail(state);
  if (!list3 || list3.includes(':generateContent')) return '';
  const config = list3.replace(/\/api\/v3$/i, '').replace(/\/api\/coding\/v3$/i, '');
  return joinUrl(config, 'ping');
}
function buildApimartBalanceProbeUrls(scope) {
  const list4 = stripKnownOpenAiTail(scope);
  if (!list4 || list4.includes(':generateContent')) return [];
  if (/\/v\d+(?:beta)?$/i.test(list4)) return [joinUrl(list4, 'user/balance'), joinUrl(list4, 'balance')];
  return [joinUrl(list4, 'v1/user/balance'), joinUrl(list4, 'v1/balance')];
}
function buildRunningHubAccountStatusProbeUrl(input) {
  const baseUrl2 = normalizeBaseUrl(
    input || PROVIDERS_META?.runninghub?.defaultUrl || 'https://www.runninghub.cn',
  )
    .replace(/\/openapi\/v2(?:\/.*)?$/i, '')
    .replace(/\/uc\/openapi\/accountStatus$/i, '');
  return joinUrl(baseUrl2, 'uc/openapi/accountStatus');
}
function buildGrsaiApiKeyCreditsProbeUrl(output) {
  const baseUrl3 = normalizeBaseUrl(
    output || PROVIDERS_META?.grsai?.defaultUrl || 'https://grsai.dakka.com.cn',
  )
    .replace(/\/v\d+(?:beta)?$/i, '')
    .replace(/\/client\/openapi\/getAPIKeyCredits$/i, '');
  return joinUrl(baseUrl3, 'client/openapi/getAPIKeyCredits');
}
function buildGrsaiAccountCreditsProbeUrl(value2) {
  const baseUrl4 = normalizeBaseUrl(
    value2 || PROVIDERS_META?.grsai?.defaultUrl || 'https://grsai.dakka.com.cn',
  )
    .replace(/\/v\d+(?:beta)?$/i, '')
    .replace(/\/client\/openapi\/getCredits$/i, '')
    .replace(/\/client\/common\/getCredits(?:\?.*)?$/i, '');
  return joinUrl(baseUrl4, 'client/openapi/getCredits');
}
function buildGrsaiCommonCreditsProbeUrl(value3, value4) {
  const baseUrl5 = normalizeBaseUrl(
    value3 || PROVIDERS_META?.grsai?.defaultUrl || 'https://grsai.dakka.com.cn',
  )
    .replace(/\/v\d+(?:beta)?$/i, '')
    .replace(/\/client\/openapi\/getCredits$/i, '')
    .replace(/\/client\/openapi\/getAPIKeyCredits$/i, '')
    .replace(/\/client\/common\/getCredits(?:\?.*)?$/i, '');
  return joinUrl(baseUrl5, 'client/common/getCredits') + '?apikey=' + encodeURIComponent(value4);
}
function toFiniteNumber(value5) {
  if (value5 === null || value5 === undefined || value5 === '') return null;
  const value6 = Number(value5);
  return Number.isFinite(value6) ? value6 : null;
}
function formatBalanceNumber(value7) {
  const toFiniteNumber2 = toFiniteNumber(value7);
  if (toFiniteNumber2 === null) return '';
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 6 }).format(toFiniteNumber2);
}
function formatCurrencyLabel(value8) {
  const enabled3 = String(value8 || '')
    .trim()
    .toUpperCase();
  if (!enabled3 || enabled3 === 'CNY' || enabled3 === 'RMB' || enabled3 === 'CNH') return '人民币';
  return enabled3;
}
export function normalizeApimartBalancePayload(options2 = {}) {
  const response = isPlainObject(options2?.data) && !Array.isArray(options2.data) ? options2.data : options2;
  if (!isPlainObject(response) || response.success === false) return null;
  const unlimited = response.unlimited_quota === true,
    toFiniteNumber3 = toFiniteNumber(
      response.remain_balance ?? response.remaining_balance ?? response.balance,
    ),
    remaining = unlimited ? null : toFiniteNumber3,
    used = toFiniteNumber(response.used_balance);
  if (!unlimited && remaining === null) return null;
  const value9 = remaining === null ? '' : formatBalanceNumber(remaining),
    detailText = [];
  if (unlimited) detailText.push('额度不限');
  if (value9) detailText.push('剩余余额：' + value9 + ' 美元');
  return {
    unlimited: unlimited,
    remaining: remaining,
    used: used,
    displayText: unlimited ? '余额 不限' : value9 ? '余额 ' + value9 + ' 美元' : '余额 已读取',
    detailText: detailText.join('；') || 'APIMart 余额已读取',
  };
}
function normalizeRunningHubAccountStatusPayload(options3 = {}) {
  const response2 = isPlainObject(options3?.data) && !Array.isArray(options3.data) ? options3.data : options3;
  if (!isPlainObject(response2)) return null;
  if (response2.success === false) return null;
  if (response2.code !== undefined && Number(response2.code) !== 0) return null;
  const isPlainObject3 =
      isPlainObject(response2.data) && !Array.isArray(response2.data) ? response2.data : response2,
    coins = toFiniteNumber(isPlainObject3.remainCoins ?? isPlainObject3.remain_coins ?? isPlainObject3.coins),
    money = toFiniteNumber(
      isPlainObject3.remainMoney ??
        isPlainObject3.remain_money ??
        isPlainObject3.money ??
        isPlainObject3.balance,
    );
  if (coins === null && money === null) return null;
  const currency =
    String(isPlainObject3.currency || 'CNY')
      .trim()
      .toUpperCase() || 'CNY';
  return {
    coins: coins,
    money: money,
    currency: currency,
    apiType: String(isPlainObject3.apiType || isPlainObject3.api_type || '').trim(),
  };
}
export function normalizeRunningHubBalancePayload({ workflow: workflow, model: model } = {}) {
  const runningHubAccountStatusPayload = normalizeRunningHubAccountStatusPayload(workflow),
    runningHubAccountStatusPayload2 = normalizeRunningHubAccountStatusPayload(model),
    workflowCredits = runningHubAccountStatusPayload?.coins ?? null,
    modelWallet = runningHubAccountStatusPayload2?.money ?? null;
  if (workflowCredits === null && modelWallet === null) return null;
  const currency2 =
      runningHubAccountStatusPayload2?.currency || runningHubAccountStatusPayload?.currency || 'CNY',
    currencyLabel = formatCurrencyLabel(currency2),
    formatBalanceNumber2 = formatBalanceNumber(workflowCredits),
    formatBalanceNumber3 = formatBalanceNumber(modelWallet),
    displayText = [],
    detailText2 = [];
  return (
    formatBalanceNumber2 &&
      (displayText.push('积分 ' + formatBalanceNumber2),
      detailText2.push('工作流积分：' + formatBalanceNumber2)),
    formatBalanceNumber3 &&
      (displayText.push('钱包 ' + formatBalanceNumber3 + ' ' + currencyLabel),
      detailText2.push('模型钱包：' + formatBalanceNumber3 + ' ' + currencyLabel)),
    {
      workflowCredits: workflowCredits,
      modelWallet: modelWallet,
      currency: currency2,
      currencyLabel: currencyLabel,
      displayText: displayText.join(' · ') || '余额 已读取',
      detailText: detailText2.join('；') || 'RunningHUB 账户信息已读取',
    }
  );
}
function isSuccessfulGrsaiPayload(response3) {
  if (!isPlainObject(response3)) return true;
  if (response3.success === false || response3.ok === false) return false;
  const value10 = response3.code ?? response3.statusCode;
  if (value10 !== undefined) {
    const count = Number(value10);
    return count === 0 || count === 200;
  }
  return true;
}
function unwrapGrsaiCreditsPayload(value11) {
  if (!isPlainObject(value11)) return value11;
  if (!isSuccessfulGrsaiPayload(value11)) return null;
  if (value11.data !== undefined) return unwrapGrsaiCreditsPayload(value11.data);
  if (value11.result !== undefined) return unwrapGrsaiCreditsPayload(value11.result);
  return value11;
}
function extractGrsaiCreditsValue(value12, map = new Set()) {
  const toFiniteNumber4 = toFiniteNumber(value12);
  if (toFiniteNumber4 !== null) return toFiniteNumber4;
  if (!isPlainObject(value12) || map.has(value12)) return null;
  map.add(value12);
  const value13 = [
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
  for (const value14 of value13) {
    if (value12[value14] === undefined) continue;
    const extractGrsaiCreditsValue2 = extractGrsaiCreditsValue(value12[value14], map);
    if (extractGrsaiCreditsValue2 !== null) return extractGrsaiCreditsValue2;
  }
  for (const value15 of ['account', 'user', 'wallet', 'quota']) {
    if (value12[value15] === undefined) continue;
    const extractGrsaiCreditsValue3 = extractGrsaiCreditsValue(value12[value15], map);
    if (extractGrsaiCreditsValue3 !== null) return extractGrsaiCreditsValue3;
  }
  return null;
}
export function normalizeGrsaiBalancePayload(options4 = {}, value16 = {}) {
  const unwrapGrsaiCreditsPayload2 = unwrapGrsaiCreditsPayload(options4);
  if (unwrapGrsaiCreditsPayload2 === null) return null;
  const credits = toFiniteNumber(extractGrsaiCreditsValue(unwrapGrsaiCreditsPayload2));
  if (credits === null) return null;
  const formatBalanceNumber4 = formatBalanceNumber(credits),
    source2 = value16.source || 'account',
    detailText3 = source2 === 'apiKey' ? 'API Key 积分' : '账户积分';
  return {
    credits: credits,
    source: source2,
    displayText: '积分 ' + formatBalanceNumber4,
    detailText: detailText3 + '：' + formatBalanceNumber4,
  };
}
function stringifyProbePayload(value17) {
  if (value17 == null) return '';
  if (typeof value17 === 'string') return value17;
  try {
    return JSON.stringify(value17);
  } catch {
    return String(value17 || '');
  }
}
function probeText(response4 = {}) {
  return [
    response4.status ? 'HTTP ' + response4.status : '',
    response4.error || '',
    stringifyProbePayload(response4.data),
  ]
    .filter(Boolean)
    .join(' ');
}
function normalizeErrorText(value18 = '') {
  return String(value18 || '')
    .replace(/\s+/g, ' ')
    .trim();
}
function isAuthFailure(response5 = {}) {
  const count2 = Number(response5.status || 0);
  if (count2 === 401 || count2 === 403) return true;
  const probeText2 = probeText(response5).toLowerCase();
  return /(?:\b401\b|\b403\b|unauthorized|forbidden|authentication|authorization|invalid\s+(?:api\s*)?key|invalid\s+token|api\s*key\s+invalid|apikey|bearer|access\s*token|鉴权|认证|未授权|无权限|密钥|令牌)/i.test(
    probeText2,
  );
}
function classifyProbeFailure(response6 = {}, value19 = 'provider_error') {
  const count3 = Number(response6.status || 0),
    probeText3 = probeText(response6).toLowerCase();
  if (isAuthFailure(response6)) return 'auth_failed';
  if (
    count3 === 0 ||
    /timeout|timed out|network|failed to fetch|dns|econn|请求超时|网络请求失败/i.test(probeText3)
  )
    return 'network_failed';
  if (count3 === 429 || /rate limit|too many requests|限流|请求过于频繁/i.test(probeText3))
    return 'rate_limited';
  if (/insufficient|quota|balance|billing|credit|payment|额度|余额|欠费|付费|账户余额/i.test(probeText3))
    return 'quota_or_balance';
  if (
    /model.+(?:not found|not exist|unavailable|no access)|模型.*(?:不存在|不可用|无权限|未开通)|no permission.*model/i.test(
      probeText3,
    )
  )
    return 'model_unavailable';
  if (
    count3 === 404 ||
    /not found|invalid url|unsupported endpoint|cannot post|cannot get|接口地址|地址不兼容/i.test(probeText3)
  )
    return 'bad_base_url';
  return value19;
}
function humanizeCategory(value20, value21, value22 = '连接测试未通过') {
  const missing_key = providerLabel(value21),
    value23 = {
      missing_key: missing_key + ' 的 API Key 还没填写。',
      missing_url: missing_key + ' 的接口地址未配置。',
      auth_failed: missing_key + ' 的 API Key 无效、过期，或没有访问权限。',
      network_failed: '无法连到 ' + missing_key + '，请检查网络、本地服务或防火墙。',
      rate_limited: missing_key + ' 返回限流，请稍后再试。',
      quota_or_balance: missing_key + ' 账户额度或余额可能不足。',
      model_unavailable: missing_key + ' 的测试模型不可访问，可能未开通该模型或模型名不兼容。',
      bad_base_url: missing_key + ' 的接口地址不兼容，请检查 Base URL 是否填对。',
      upload_failed: missing_key + ' 上传链路未通过，参考图/视频上传可能会失败。',
      provider_error: missing_key + ' 返回异常，稍后重试或查看厂商后台状态。',
      unsupported: missing_key + ' 暂不支持连接测试。',
    };
  return value23[value20] || value22;
}
function isSuccessfulProbe(response7 = {}) {
  if (!response7.success) return false;
  const count4 = Number(response7.status || 0);
  if (count4 && (count4 < 200 || count4 >= 300)) return false;
  return !isAuthFailure(response7);
}
function summarizeFailure(options5 = {}, value24 = '连接测试未通过') {
  const list5 = probeText(options5).trim();
  if (!list5) return value24;
  return list5.length > 180 ? list5.slice(0, 177) + '...' : list5;
}
function makeStep(id, value25, message, value26 = '', skipped = {}) {
  return {
    id: id,
    label: STEP_LABELS[id] || id,
    ok: Boolean(value25),
    skipped: skipped.skipped === true,
    message: message,
    detail: normalizeErrorText(value26),
    category: skipped.category || '',
  };
}
function pass(providerId2, detail = '连接测试通过', steps = []) {
  return {
    ok: true,
    providerId: providerId2,
    label: providerLabel(providerId2),
    message: '通过',
    summary: '连接测试通过',
    detail: detail,
    category: '',
    suggestion: '',
    steps: steps,
  };
}
function fail(providerId3, value27, steps2 = [], category = 'provider_error') {
  return {
    ok: false,
    providerId: providerId3,
    label: providerLabel(providerId3),
    message: '未通过',
    error: String(value27 || '连接测试未通过'),
    summary: String(value27 || '连接测试未通过'),
    category: category,
    suggestion: humanizeCategory(category, providerId3, value27),
    steps: steps2,
  };
}
function finishProviderResult(providerId4, steps3 = []) {
  const error = steps3.find((response8) => !response8.ok && !response8.skipped),
    partial = steps3.filter((response9) => response9.ok),
    list6 = steps3.filter((item2) => item2.skipped);
  if (!error) {
    const value28 = steps3.map((error2) => error2.label + ': ' + error2.message).join('；');
    return pass(providerId4, value28 || '连接测试通过', steps3);
  }
  const category2 = error.category || 'provider_error',
    error3 = error.message || humanizeCategory(category2, providerId4),
    detail2 = steps3.map((error4) => {
      const value29 = error4.skipped ? '跳过' : error4.ok ? '通过' : '失败';
      return '' + error4.label + value29 + ': ' + error4.message;
    });
  return {
    ok: false,
    partial: partial.length > 0 || list6.length > 0,
    providerId: providerId4,
    label: providerLabel(providerId4),
    message: partial.length > 0 ? '部分通过' : '未通过',
    error: error3,
    summary: error3,
    detail: detail2.join('；'),
    category: category2,
    suggestion: humanizeCategory(category2, providerId4, error3),
    steps: steps3,
  };
}
async function getModelsProbe(value30, value31, value32) {
  const request2 = await request(
    '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(value31),
    { method: 'GET', headers: { Authorization: 'Bearer ' + value32 } },
    TEST_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(request2)) return makeStep('auth', true, 'API Key 可用，模型列表可访问', 'models');
  const category3 = classifyProbeFailure(request2);
  return {
    ...makeStep('auth', false, humanizeCategory(category3, value30), summarizeFailure(request2), {
      category: category3,
    }),
    authFailed: isAuthFailure(request2),
  };
}
async function completionFallbackProbe(content, value33, apiKey) {
  const model2 = COMPLETION_FALLBACKS[content],
    apiUrl = buildCompletionProbeUrl(content, value33);
  if (!model2?.model || !apiUrl)
    return makeStep('model', true, '模型列表可访问，未执行额外模型调用', 'no completion fallback', {
      skipped: true,
    });
  const value34 = {
    apiUrl: apiUrl,
    apiKey: apiKey,
    model: model2.model,
    stream: false,
    messages: [{ role: 'user', content: content === 'grsai' ? GRSAI_COMPLETION_TEST_MESSAGE : 'ping' }],
  };
  content !== 'grsai' && (value34.max_tokens = 1);
  const post2 = await post('/api/v2/proxy/completions', value34, TEST_TIMEOUT_MS);
  if (isSuccessfulProbe(post2))
    return makeStep(
      'model',
      true,
      '测试模型 ' + (model2.label || model2.model) + ' 可访问',
      'chat-completions',
    );
  const category4 = classifyProbeFailure(post2, 'model_unavailable');
  return makeStep('model', false, humanizeCategory(category4, content), summarizeFailure(post2), {
    category: category4,
  });
}
async function apimartBalanceProbe(value35, value36) {
  const list7 = buildApimartBalanceProbeUrls(value36.apiUrl);
  if (list7.length <= 0)
    return {
      step: makeStep('balance', true, '余额接口地址不可用，已跳过', 'no balance endpoint', {
        skipped: true,
      }),
      balance: null,
    };
  let value37 = null;
  for (const list8 of list7) {
    const request3 = await request(
      '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(list8),
      { method: 'GET', headers: { Authorization: 'Bearer ' + value36.apiKey } },
      TEST_TIMEOUT_MS,
    );
    value37 = request3;
    if (isSuccessfulProbe(request3)) {
      const balance = normalizeApimartBalancePayload(request3.data);
      if (balance)
        return {
          step: makeStep(
            'balance',
            true,
            balance.detailText || 'APIMart 余额已读取',
            list8.includes('/user/balance') ? 'apimart-user-balance' : 'apimart-token-balance',
          ),
          balance: balance,
        };
    }
  }
  return {
    step: makeStep(
      'balance',
      true,
      '余额暂未返回，连接测试继续',
      summarizeFailure(value37, 'APIMart 余额接口未返回可识别数据'),
      { skipped: true },
    ),
    balance: null,
  };
}
async function grsaiCreditsRequest(value38, token) {
  if (value38.id === 'account')
    return request(
      buildGrsaiAccountCreditsProbeUrl(token.apiUrl),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.apiKey }),
      },
      TEST_TIMEOUT_MS,
    );
  if (value38.id === 'common')
    return request(
      buildGrsaiCommonCreditsProbeUrl(token.apiUrl, token.apiKey),
      { method: 'GET', headers: { Authorization: 'Bearer ' + token.apiKey } },
      TEST_TIMEOUT_MS,
    );
  return request(
    buildGrsaiApiKeyCreditsProbeUrl(token.apiUrl),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token.apiKey },
      body: JSON.stringify({ apikey: token.apiKey }),
    },
    TEST_TIMEOUT_MS,
  );
}
async function grsaiBalanceProbe(value39) {
  const value40 = [
    { id: 'account', source: 'account', detail: 'grsai-account-credits' },
    { id: 'common', source: 'account', detail: 'grsai-common-credits' },
    { id: 'apiKey', source: 'apiKey', detail: 'grsai-api-key-credits' },
  ];
  let balance2 = null,
    value41 = null;
  for (const source3 of value40) {
    const grsaiCreditsRequest2 = await grsaiCreditsRequest(source3, value39);
    value41 = grsaiCreditsRequest2;
    if (!isSuccessfulProbe(grsaiCreditsRequest2)) continue;
    const balance3 = normalizeGrsaiBalancePayload(grsaiCreditsRequest2.data, { source: source3.source });
    if (!balance3) continue;
    if (balance3.credits > 0)
      return {
        step: makeStep('balance', true, balance3.detailText || 'GRSAI 积分已读取', source3.detail),
        balance: balance3,
      };
    if (!balance2) balance2 = { balance: balance3, detail: source3.detail };
  }
  if (balance2)
    return {
      step: makeStep('balance', true, balance2.balance.detailText || 'GRSAI 积分已读取', balance2.detail),
      balance: balance2.balance,
    };
  return {
    step: makeStep(
      'balance',
      true,
      '积分暂未返回，连接测试继续',
      summarizeFailure(value41, 'GRSAI 积分接口未返回可识别数据'),
      { skipped: true },
    ),
    balance: null,
  };
}
async function runningHubAccountStatusProbe(value42, value43) {
  const apiKey2 = String(value43 || '').trim();
  if (!apiKey2) return null;
  const apiUrl2 = buildRunningHubAccountStatusProbeUrl(value42.apiUrl),
    post3 = await post(
      '/api/v2/proxy/image',
      { apiUrl: apiUrl2, apiKey: apiKey2, apikey: apiKey2 },
      TEST_TIMEOUT_MS,
    );
  return isSuccessfulProbe(post3) ? post3.data : null;
}
async function runningHubBalanceProbe(value44) {
  const [workflow2, model3] = await Promise.all([
      runningHubAccountStatusProbe(value44, value44.apiKey),
      runningHubAccountStatusProbe(value44, value44.modelApiKey),
    ]),
    balance4 = normalizeRunningHubBalancePayload({ workflow: workflow2, model: model3 });
  if (balance4)
    return {
      step: makeStep(
        'balance',
        true,
        balance4.detailText || 'RunningHUB 账户信息已读取',
        'runninghub-account-status',
      ),
      balance: balance4,
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
  const list9 =
      typeof atob === 'function'
        ? atob(ONE_PIXEL_PNG_BASE64)
        : Buffer.from(ONE_PIXEL_PNG_BASE64, 'base64').toString('binary'),
    uint8Array = new Uint8Array(list9.length);
  for (let value45 = 0; value45 < list9.length; value45++) {
    uint8Array[value45] = list9.charCodeAt(value45);
  }
  return new Blob([uint8Array], { type: 'image/png' });
}
async function grsaiUploadProbe(value46, value47) {
  const request4 = await request(
    'https://grsai.dakka.com.cn/client/resource/newUploadTokenZH',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(value47 ? { Authorization: 'Bearer ' + value47 } : {}),
      },
      body: JSON.stringify({ sux: 'png' }),
    },
    TEST_UPLOAD_TIMEOUT_MS,
  );
  if (!isSuccessfulProbe(request4) || !request4.data?.data) {
    const category5 = classifyProbeFailure(request4, 'upload_failed');
    return makeStep(
      'upload',
      false,
      humanizeCategory(category5 === 'provider_error' ? 'upload_failed' : category5, value46),
      summarizeFailure(request4, 'GRSAI 上传凭证获取失败'),
      { category: category5 === 'provider_error' ? 'upload_failed' : category5 },
    );
  }
  const { token: token2, key: key2, url: url } = request4.data.data;
  if (!token2 || !key2 || !url)
    return makeStep('upload', false, 'GRSAI 上传凭证返回不完整。', stringifyProbePayload(request4.data), {
      category: 'upload_failed',
    });
  const body = new FormData();
  (body.append('token', token2),
    body.append('key', key2),
    body.append('file', createTinyPngBlob(), 'aic-connection-test.png'));
  const request5 = await request(url, { method: 'POST', body: body }, TEST_UPLOAD_TIMEOUT_MS);
  if (isSuccessfulProbe(request5)) return makeStep('upload', true, '上传链路可用', 'qiniu');
  const category6 = classifyProbeFailure(request5, 'upload_failed');
  return makeStep(
    'upload',
    false,
    humanizeCategory(category6 === 'provider_error' ? 'upload_failed' : category6, value46),
    summarizeFailure(request5, 'GRSAI 上传失败'),
    { category: category6 === 'provider_error' ? 'upload_failed' : category6 },
  );
}
async function apimartUploadProbe(value48, value49) {
  const formData = new FormData();
  (formData.append('file', createTinyPngBlob(), 'aic-connection-test.png'),
    formData.append('contentType', 'image/png'),
    formData.append('fileExtension', 'png'),
    formData.append('permanent', '0'),
    formData.append('apiKey', value49.apiKey),
    formData.append('apiUrl', normalizeApimartBaseUrl(value49.apiUrl)));
  const post4 = await post('/api/v2/proxy/apimart-upload', formData, TEST_UPLOAD_TIMEOUT_MS);
  if (isSuccessfulProbe(post4) && (post4.data?.cdnUrl || post4.data?.url))
    return makeStep('upload', true, '上传链路可用', 'apimart-upload');
  const category7 = classifyProbeFailure(post4, 'upload_failed');
  return makeStep(
    'upload',
    false,
    humanizeCategory(category7 === 'provider_error' ? 'upload_failed' : category7, value48),
    summarizeFailure(post4, 'APIMart 上传失败'),
    { category: category7 === 'provider_error' ? 'upload_failed' : category7 },
  );
}
async function runningHubUploadProbe(value50, enabled4) {
  if (!enabled4)
    return makeStep('upload', true, '未填写模型 API Key，跳过模型上传链路', 'no model api key', {
      skipped: true,
    });
  const value51 = 'https://www.runninghub.cn/openapi/v2/media/upload/binary',
    body2 = new FormData();
  body2.append('file', createTinyPngBlob(), 'aic-connection-test.png');
  const request6 = await request(
    '/api/v2/proxy/upload?apiUrl=' + encodeURIComponent(value51),
    { method: 'POST', headers: { Authorization: 'Bearer ' + enabled4 }, body: body2 },
    TEST_UPLOAD_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(request6) && request6.data?.data?.download_url)
    return makeStep('upload', true, '上传链路可用', 'runninghub-upload');
  const category8 = classifyProbeFailure(request6, 'upload_failed');
  return makeStep(
    'upload',
    false,
    humanizeCategory(category8 === 'provider_error' ? 'upload_failed' : category8, value50),
    summarizeFailure(request6, 'RunningHUB 上传失败'),
    { category: category8 === 'provider_error' ? 'upload_failed' : category8 },
  );
}
async function uploadProbe(value52, value53) {
  if (value52 === 'grsai') return grsaiUploadProbe(value52, value53.apiKey);
  if (value52 === 'apimart') return apimartUploadProbe(value52, value53);
  if (value52 === 'runninghub') return runningHubUploadProbe(value52, value53.modelApiKey);
  return makeStep(
    'upload',
    true,
    SKIPPED_UPLOAD_PROVIDERS[value52] || '当前厂商无需独立上传检测',
    'skipped',
    { skipped: true },
  );
}
async function openAiLikeProviderProbe(value54, value55) {
  const providerConfigWithDefaults2 = providerConfigWithDefaults(value54, value55),
    list10 = [];
  let balance5 = null,
    value56 = false;
  if (!providerConfigWithDefaults2.apiKey)
    return (
      list10.push(makeStep('config', false, 'API Key 未填写', '', { category: 'missing_key' })),
      finishProviderResult(value54, list10)
    );
  if (!providerConfigWithDefaults2.apiUrl)
    return (
      list10.push(makeStep('config', false, '接口地址未配置', '', { category: 'missing_url' })),
      finishProviderResult(value54, list10)
    );
  list10.push(makeStep('config', true, '接口地址和 API Key 已填写'));
  const value57 = value54 === 'grsai' ? '' : buildModelsProbeUrl(value54, providerConfigWithDefaults2.apiUrl);
  if (value57) {
    const response10 = await getModelsProbe(value54, value57, providerConfigWithDefaults2.apiKey);
    if (response10.ok) (list10.push(response10), (value56 = true));
    else {
      if (response10.authFailed || !COMPLETION_FALLBACKS[value54]?.model)
        return (list10.push(response10), finishProviderResult(value54, list10));
      else
        list10.push(
          makeStep('auth', true, '模型列表不可用，已改用轻量模型调用继续检测', response10.detail, {
            skipped: true,
          }),
        );
    }
  }
  value54 === 'apimart' && value56
    ? list10.push(makeStep('model', true, '模型列表可访问，未执行额外模型调用', 'models', { skipped: true }))
    : list10.push(
        await completionFallbackProbe(
          value54,
          providerConfigWithDefaults2.apiUrl,
          providerConfigWithDefaults2.apiKey,
        ),
      );
  if (list10.some((response11) => !response11.ok && !response11.skipped))
    return finishProviderResult(value54, list10);
  if (value54 === 'apimart') {
    const apimartBalanceProbe2 = await apimartBalanceProbe(value54, providerConfigWithDefaults2);
    (list10.push(apimartBalanceProbe2.step), (balance5 = apimartBalanceProbe2.balance));
  } else {
    if (value54 === 'grsai') {
      const grsaiBalanceProbe2 = await grsaiBalanceProbe(providerConfigWithDefaults2);
      (list10.push(grsaiBalanceProbe2.step), (balance5 = grsaiBalanceProbe2.balance));
    }
  }
  list10.push(await uploadProbe(value54, providerConfigWithDefaults2));
  const args = finishProviderResult(value54, list10);
  return balance5 ? { ...args, balance: balance5 } : args;
}
function runningHubProbePassed(response12 = {}) {
  if (isAuthFailure(response12)) return false;
  if (response12.success) return true;
  const count5 = Number(response12.status || 0);
  return count5 >= 400 && count5 < 500;
}
async function runningHubWorkflowProbe(apiKey3) {
  const post5 = await post(
    '/api/v2/runninghubwf/query',
    { apiKey: apiKey3, taskId: 'aic-connection-test' },
    TEST_TIMEOUT_MS,
  );
  return runningHubProbePassed(post5)
    ? makeStep('auth', true, '工作流 API Key 可用', 'workflow')
    : makeStep(
        'auth',
        false,
        humanizeCategory(classifyProbeFailure(post5), 'runninghub'),
        summarizeFailure(post5, '工作流 API Key 测试未通过'),
        { category: classifyProbeFailure(post5) },
      );
}
async function runningHubModelProbe(apiKey4) {
  const post6 = await post(
    '/api/v2/proxy/image',
    {
      apiUrl: 'https://www.runninghub.cn/openapi/v2/query',
      apiKey: apiKey4,
      taskId: 'aic-connection-test',
    },
    TEST_TIMEOUT_MS,
  );
  return runningHubProbePassed(post6)
    ? makeStep('model', true, '模型 API Key 可用', 'model-api')
    : makeStep(
        'model',
        false,
        humanizeCategory(classifyProbeFailure(post6, 'model_unavailable'), 'runninghub'),
        summarizeFailure(post6, '模型 API Key 测试未通过'),
        { category: classifyProbeFailure(post6, 'model_unavailable') },
      );
}
async function runningHubProviderProbe(value58) {
  const providerConfigWithDefaults3 = providerConfigWithDefaults('runninghub', value58),
    list11 = [],
    list12 = [];
  let balance6 = null;
  if (providerConfigWithDefaults3.apiKey)
    list11.push(runningHubWorkflowProbe(providerConfigWithDefaults3.apiKey));
  if (providerConfigWithDefaults3.modelApiKey)
    list11.push(runningHubModelProbe(providerConfigWithDefaults3.modelApiKey));
  if (list11.length === 0)
    return (
      list12.push(makeStep('config', false, 'API Key 未填写', '', { category: 'missing_key' })),
      finishProviderResult('runninghub', list12)
    );
  list12.push(makeStep('config', true, '已填写至少一个 RunningHUB API Key'));
  const args2 = await Promise.all(list11);
  list12.push(...args2);
  const runningHubBalanceProbe2 = await runningHubBalanceProbe(providerConfigWithDefaults3);
  (list12.push(runningHubBalanceProbe2.step), (balance6 = runningHubBalanceProbe2.balance));
  !list12.some((response13) => !response13.ok && !response13.skipped) &&
    list12.push(await uploadProbe('runninghub', providerConfigWithDefaults3));
  const args3 = finishProviderResult('runninghub', list12);
  return balance6 ? { ...args3, balance: balance6 } : args3;
}
async function volcengineProviderProbe(value59) {
  const providerConfigWithDefaults4 = providerConfigWithDefaults('volcengine', value59),
    list13 = [];
  if (!providerConfigWithDefaults4.apiKey)
    return (
      list13.push(makeStep('config', false, 'API Key 未填写', '', { category: 'missing_key' })),
      finishProviderResult('volcengine', list13)
    );
  if (!providerConfigWithDefaults4.apiUrl)
    return (
      list13.push(makeStep('config', false, '接口地址未配置', '', { category: 'missing_url' })),
      finishProviderResult('volcengine', list13)
    );
  list13.push(makeStep('config', true, '接口地址和 API Key 已填写'));
  const volcenginePingProbeUrl = buildVolcenginePingProbeUrl(providerConfigWithDefaults4.apiUrl);
  if (!volcenginePingProbeUrl)
    return (
      list13.push(
        makeStep('auth', false, '接口地址不兼容', providerConfigWithDefaults4.apiUrl, {
          category: 'bad_base_url',
        }),
      ),
      finishProviderResult('volcengine', list13)
    );
  const request7 = await request(
    '/api/v2/proxy/task?apiUrl=' + encodeURIComponent(volcenginePingProbeUrl),
    { method: 'GET', headers: { Authorization: 'Bearer ' + providerConfigWithDefaults4.apiKey } },
    TEST_TIMEOUT_MS,
  );
  if (isSuccessfulProbe(request7))
    return (
      list13.push(makeStep('auth', true, '方舟 API Key 可用，服务可访问', 'ping')),
      list13.push(await uploadProbe('volcengine', providerConfigWithDefaults4)),
      finishProviderResult('volcengine', list13)
    );
  const category9 = classifyProbeFailure(request7);
  return (
    list13.push(
      makeStep(
        'auth',
        false,
        humanizeCategory(category9, 'volcengine'),
        summarizeFailure(request7, '火山方舟 ping 测试未通过'),
        { category: category9 },
      ),
    ),
    finishProviderResult('volcengine', list13)
  );
}
export async function testProviderConnection(value60, value61 = {}) {
  const providerId5 = normalizeProviderId(value60);
  if (!DEFAULT_PROVIDER_TEST_IDS.includes(providerId5))
    return fail(providerId5 || 'unknown', '暂不支持该厂商的连接测试');
  if (providerId5 === 'runninghub') return runningHubProviderProbe(value61);
  if (providerId5 === 'volcengine') return volcengineProviderProbe(value61);
  return openAiLikeProviderProbe(providerId5, value61);
}
export async function testProviderConnections(options6 = {}, list14 = DEFAULT_PROVIDER_TEST_IDS) {
  const isPlainObject4 = isPlainObject(options6?.providers) ? options6.providers : {},
    value62 = await Promise.all(
      list14.map(async (value63) => {
        const providerId6 = normalizeProviderId(value63),
          testProviderConnection2 = await testProviderConnection(
            providerId6,
            isPlainObject4[providerId6] || {},
          );
        return [providerId6, testProviderConnection2];
      }),
    );
  return Object.fromEntries(value62);
}

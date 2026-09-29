import { openSettingsPanelToField } from "./settings/panelSettings.js";
const API_KEY_ACTION_LABEL = "去设置",
  PROVIDER_ALIASES = Object["freeze"]({
    runninghubwf: "runninghub",
    "runninghub-workflow": "runninghub",
    "runninghub-model": "runninghub",
    apimart: "apimart",
    "agnes-domestic": "agnes-domestic",
    agnes: "agnes",
    volcengine: "volcengine",
    "volcengine-ark": "volcengine",
    "volcengine-speech": "volcengine-speech",
    grsai: "grsai",
    ppio: "ppio",
    aicanvas: "aicanvas",
    openai: "openai",
  }),
  PROVIDER_MESSAGE_PATTERNS = Object["freeze"]([
    ["runninghub-international", /running\s*hub.*(?:国际版|international)/i],
    ["runninghub", /running\s*hub|runninghub|runninghubwf/i],
    ["apimart", /apimart/i],
    ["volcengine-speech", /火山语音|volcengine[-_\s]*speech/i],
    ["volcengine", /火山方舟|volcengine|ark/i],
    ["grsai", /grsai/i],
    ["ppio", /ppio|派欧/i],
    ["agnes", /agnes/i],
    ["openai", /openai/i],
  ]);
function normalizeProviderId(_0x23f3c8) {
  const _0x4dbc6d = String(_0x23f3c8 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (!_0x4dbc6d) return "";
  return PROVIDER_ALIASES[_0x4dbc6d] || _0x4dbc6d;
}
function isRunningHubModelKeyRequest({
  keyType: _0x2b54c9,
  adapterType: _0x31b0f3,
  model: _0x15c8ce,
  message: _0x4d5369,
} = {}) {
  const _0x588f3b = String(_0x2b54c9 || "")
    ["trim"]()
    ["toLowerCase"]();
  if (
    _0x588f3b === "model" ||
    _0x588f3b === "modelapi" ||
    _0x588f3b === "model-api"
  )
    return !![];
  if (
    String(_0x31b0f3 || "")
      ["trim"]()
      ["toLowerCase"]() === "modelapi"
  )
    return !![];
  if (
    String(_0x15c8ce || "")
      ["trim"]()
      ["toLowerCase"]()
      ["startsWith"]("runninghub-model/")
  )
    return !![];
  return /(model\s*api\s*key|模型\s*api\s*(key|密钥)|企业级[-\s]*共享)/i[
    "test"
  ](String(_0x4d5369 || ""));
}
export function getProviderApiKeyFieldIds(_0x280cdd = {}) {
  const _0x55d145 = normalizeProviderId(
    _0x280cdd["providerId"] || _0x280cdd["provider"],
  );
  if (!_0x55d145) return [];
  if (["runninghub", "runninghub-international"]["includes"](_0x55d145)) {
    const _0x449537 = "providerKey-" + _0x55d145,
      _0x31e3fb = _0x449537 + "-model";
    return isRunningHubModelKeyRequest(_0x280cdd)
      ? [_0x31e3fb, _0x449537]
      : [_0x449537, _0x31e3fb];
  }
  return ["providerKey-" + _0x55d145];
}
export function openProviderApiKeySettings(_0x1224b0 = {}) {
  const _0x16d3fd = Array["isArray"](_0x1224b0["fieldIds"])
    ? _0x1224b0["fieldIds"]
    : getProviderApiKeyFieldIds(_0x1224b0);
  return openSettingsPanelToField({
    paneName: "api-input",
    fieldIds: _0x16d3fd,
    select: !![],
    highlight: !![],
  });
}
export function showProviderApiKeyMissingToast(_0x804816, _0x1cd8a1 = {}) {
  const _0x5df326 = String(_0x804816 || "")["trim"]() || "请先填写 API Key",
    _0x270fb3 = () =>
      openProviderApiKeySettings({ ..._0x1cd8a1, message: _0x5df326 }),
    _0x14e52b = globalThis["window"]?.["showToast"];
  if (typeof _0x14e52b !== "function") return (_0x270fb3(), !![]);
  return (
    _0x14e52b(_0x5df326, _0x1cd8a1["type"] || "warn", _0x1cd8a1["duration"], {
      actionLabel: _0x1cd8a1["actionLabel"] || API_KEY_ACTION_LABEL,
      onAction: _0x270fb3,
    }),
    !![]
  );
}
export function inferProviderIdFromApiKeyMessage(_0x11c71f) {
  const _0x3113d6 = String(_0x11c71f || "")["trim"](),
    _0x594104 = _0x3113d6["match"](/厂商[:：]\s*([A-Za-z0-9_-]+)/i);
  if (_0x594104?.[0x1]) return normalizeProviderId(_0x594104[0x1]);
  for (const [_0x441d6e, _0x48571c] of PROVIDER_MESSAGE_PATTERNS) {
    if (_0x48571c["test"](_0x3113d6)) return _0x441d6e;
  }
  return "";
}
export function isApiKeyMissingMessage(_0x35506c) {
  const _0x5d8f18 = String(_0x35506c || "")["trim"]();
  if (
    /火山方舟当前账号尚未开通模型/["test"](_0x5d8f18) ||
    (/has\s+not\s+activated\s+the\s+model/i["test"](_0x5d8f18) &&
      /activate\s+the\s+model\s+service/i["test"](_0x5d8f18))
  )
    return !![];
  if (!/api\s*key/i["test"](_0x5d8f18)) return ![];
  return /(未配置|未填写|还没填写|请先[^，。]*(?:配置|填写)|先[^，。]*(?:配置|填写)|缺少|未提供|需要配置|missing|not configured|is not configured|not provided|not set|set\s+.*api\s*key|add\s+.*api\s*key|enter\s+.*api\s*key)/i[
    "test"
  ](_0x5d8f18);
}
export function isApiKeyConfigurationMessage(_0x775aee) {
  const _0xf6ab25 = String(_0x775aee || "")["trim"]();
  if (isApiKeyMissingMessage(_0xf6ab25)) return !![];
  if (/请先(?:在设置中)?验证[^，。]*api\s*(?:key\s*)?连接/i["test"](_0xf6ab25))
    return !![];
  if (!/api\s*key/i["test"](_0xf6ab25)) return ![];
  return /(无效|失效|过期|错误|校验失败|验证失败|认证失败|鉴权失败|未授权|无权限|被禁用|invalid|expired|unauthori[sz]ed|forbidden|denied|authentication|authorization)/i[
    "test"
  ](_0xf6ab25);
}
export function showProviderApiKeyMissingToastForError(
  _0xe0265a,
  _0x31011a = {},
) {
  const _0x148d48 = String(
      (typeof _0xe0265a?.["getUserMessage"] === "function" &&
        _0xe0265a["getUserMessage"]()) ||
        _0xe0265a?.["message"] ||
        _0xe0265a ||
        "",
    )["trim"](),
    _0x1b951b = String(_0xe0265a?.["code"] || "")
      ["trim"]()
      ["toUpperCase"](),
    _0x337593 = String(_0xe0265a?.["type"] || "")
      ["trim"]()
      ["toUpperCase"]();
  if (
    String(_0xe0265a?.["keyType"] || "")
      ["trim"]()
      ["toLowerCase"]() === "clilogin"
  )
    return ![];
  if (
    !isApiKeyConfigurationMessage(_0x148d48) &&
    _0x1b951b !== "MODEL_CREDENTIAL_MISSING" &&
    _0x337593 !== "AUTH_ERROR"
  )
    return ![];
  const _0x29f2f1 =
    normalizeProviderId(_0x31011a["providerId"] || _0x31011a["provider"]) ||
    normalizeProviderId(_0xe0265a?.["provider"] || _0xe0265a?.["providerId"]) ||
    inferProviderIdFromApiKeyMessage(_0x148d48);
  return (
    showProviderApiKeyMissingToast(_0x31011a["message"] || _0x148d48, {
      ..._0x31011a,
      providerId: _0x29f2f1,
      fieldIds: _0x31011a["fieldIds"] || _0xe0265a?.["fieldIds"],
      keyType: _0x31011a["keyType"] || _0xe0265a?.["keyType"],
      adapterType: _0x31011a["adapterType"] || _0xe0265a?.["adapterType"],
      model: _0x31011a["model"] || _0x31011a["modelId"] || _0xe0265a?.["model"],
    }),
    !![]
  );
}

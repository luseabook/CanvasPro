import { fetchUserSettingsFromServer, saveUserSettingsToServer } from '../../api/userSettingsApi.js';
import {
  fetchSubscriptionStatus,
  activateCdkey,
  clearSubscriptionAuthorization as clearSubscriptionAuthorization_2,
} from '../../api/subscriptionApi.js';
import { t } from '../i18n/index.js';
const subscriptionGateManifest = {
  schemaVersion: '1.0',
  gates: [
    {
      key: 'runninghubVideoV54',
      modelId: 'runninghub/2041741496667348994',
      workflowId: '2041741496667348994',
      displayName: '视频编辑V5.4',
      aliases: ['video_edit_v54', 'video_edit.pro'],
      legacyAliases: [
        {
          value: '2041741496667348994',
          deleteWhen:
            'Remove after subscriptionAccess tests, backend subscription gate tests, entitlement payloads, and saved projects all stop accepting bare RunningHub workflow IDs for this gate.',
        },
      ],
    },
    {
      key: 'runninghubVideoBerniniV1',
      modelId: 'runninghub/2062515720147259393',
      workflowId: '2062515720147259393',
      displayName: '新全能视频替换BERNINI V1',
      aliases: ['video_edit_v54', 'video_edit.pro', 'ai-app/2062515720147259393'],
    },
    {
      key: 'runninghubVideoScail2V1',
      modelId: 'runninghub/2064961300823896065',
      workflowId: '2064961300823896065',
      displayName: '视频编辑Scail V1',
      aliases: ['video_edit_v54', 'video_edit.pro', 'ai-app/2064961300823896065'],
    },
    {
      key: 'runninghubVideoScailV2',
      modelId: 'runninghub/2065463417577762818',
      workflowId: '2065463417577762818',
      displayName: '视频编辑Scail V2',
      aliases: ['video_edit_v54', 'video_edit.pro', 'ai-app/2065463417577762818'],
    },
    {
      key: 'runninghubVideoHd',
      modelId: 'runninghub/2047787809091620866',
      workflowId: '2047787809091620866',
      displayName: '视频高清',
      aliases: ['video_hd_vip', 'video_hd.pro', 'ai-app/2047787809091620866'],
      legacyAliases: [
        {
          value: '2047787809091620866',
          deleteWhen:
            'Remove after subscriptionAccess tests, backend subscription gate tests, entitlement payloads, and saved projects all stop accepting bare RunningHub workflow IDs for this gate.',
        },
      ],
    },
    {
      key: 'runninghubCommercialDigitalHuman',
      modelId: 'runninghub/2055639633148563458',
      workflowId: '2055639633148563458',
      displayName: '商业级数字人',
      aliases: ['commercial_digital_human', 'commercial_digital_human.pro', 'ai-app/2055639633148563458'],
    },
    {
      key: 'runninghubAdvancedVoiceClone',
      modelId: 'runninghub/2050165249344585729',
      workflowId: '2050165249344585729',
      displayName: '进阶声音克隆',
      aliases: ['advanced_voice_clone', 'voice_clone.pro', 'ai-app/2050165249344585729'],
      legacyAliases: [
        {
          value: '2050165249344585729',
          deleteWhen:
            'Remove after subscriptionAccess tests, backend subscription gate tests, entitlement payloads, and saved projects all stop accepting bare RunningHub workflow IDs for this gate.',
        },
      ],
    },
    {
      key: 'dreaminaVideoVip',
      modelId: 'dreamina/video_vip',
      workflowId: '',
      displayName: '即梦视频',
      aliases: ['dreamina_video_vip', 'dreamina.video_vip'],
      providers: ['dreamina'],
      modelPrefixes: ['dreamina/'],
    },
    {
      key: 'audioVoiceStudio',
      modelId: 'feature/audio_voice_studio',
      workflowId: '',
      displayName: '语音工作室',
      aliases: ['audio_voice_studio', 'voice_studio.pro'],
      providers: ['aicanvas'],
      allowAnyActiveSubscription: true,
    },
    {
      key: 'replacementStudio',
      modelId: 'feature/replacement_studio',
      workflowId: '',
      displayName: '替换工作室',
      aliases: ['replacement_studio', 'replacement_studio.pro'],
      providers: ['aicanvas'],
      allowAnyActiveSubscription: true,
    },
    {
      key: 'replicationStudio',
      modelId: 'feature/replication_studio',
      workflowId: '',
      displayName: '复刻工作室',
      aliases: [],
      providers: ['aicanvas'],
      allowAnyActiveSubscription: true,
    },
    {
      key: 'runninghubAiApp',
      modelId: 'feature/rh_ai_app',
      workflowId: '',
      displayName: 'RH AI应用',
      aliases: ['rh_ai_app', 'runninghub_ai_app.pro'],
      modelPrefixes: ['runninghub/ai-app-'],
      allowAnyActiveSubscription: true,
    },
    {
      key: 'binghuoVideo',
      modelId: 'feature/binghuo_video',
      workflowId: '',
      displayName: '便宜渠道视频',
      aliases: ['binghuo_video', 'binghuo_video.pro'],
      providers: ['binghuo'],
      modelPrefixes: ['binghuo/'],
      allowAnyActiveSubscription: true,
    },
    {
      key: 'customProvider',
      modelId: 'feature/custom_provider',
      workflowId: '',
      displayName: '自定义中转站',
      aliases: ['custom_provider', 'custom_provider.pro'],
      allowAnyActiveSubscription: true,
    },
  ],
};
function freezeSubscriptionGateLegacyAlias(value, item) {
  const el = value && typeof value === 'object' ? value : {},
    value2 = String(el.value || '').trim(),
    deleteWhen = String(el.deleteWhen || '').trim();
  if (!value2 || !deleteWhen)
    throw new Error('Invalid subscription gate legacy alias: ' + (item || 'unknown'));
  return Object.freeze({ value: value2, deleteWhen: deleteWhen });
}
function freezeSubscriptionGateEntry(key) {
  const allowAnyActiveSubscription = key && typeof key === 'object' ? key : {},
    key2 = String(allowAnyActiveSubscription.key || '').trim();
  return Object.freeze({
    key: key2,
    modelId: String(allowAnyActiveSubscription.modelId || '').trim(),
    workflowId: String(allowAnyActiveSubscription.workflowId || '').trim(),
    additionalWorkflowIds: Object.freeze(
      Array.isArray(allowAnyActiveSubscription.additionalWorkflowIds)
        ? allowAnyActiveSubscription.additionalWorkflowIds
            .map((item2) => String(item2 || '').trim())
            .filter(Boolean)
        : [],
    ),
    displayName: String(allowAnyActiveSubscription.displayName || '').trim(),
    aliases: Object.freeze(
      Array.isArray(allowAnyActiveSubscription.aliases)
        ? allowAnyActiveSubscription.aliases.map((item3) => String(item3 || '').trim()).filter(Boolean)
        : [],
    ),
    legacyAliases: Object.freeze(
      Array.isArray(allowAnyActiveSubscription.legacyAliases)
        ? allowAnyActiveSubscription.legacyAliases.map((item4) =>
            freezeSubscriptionGateLegacyAlias(item4, key2),
          )
        : [],
    ),
    providers: Object.freeze(
      Array.isArray(allowAnyActiveSubscription.providers)
        ? allowAnyActiveSubscription.providers
            .map((item5) =>
              String(item5 || '')
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean)
        : [],
    ),
    modelPrefixes: Object.freeze(
      Array.isArray(allowAnyActiveSubscription.modelPrefixes)
        ? allowAnyActiveSubscription.modelPrefixes.map((item6) => String(item6 || '').trim()).filter(Boolean)
        : [],
    ),
    allowAnyActiveSubscription: allowAnyActiveSubscription.allowAnyActiveSubscription === true,
  });
}
function requireSubscriptionGateEntries() {
  const index = String(subscriptionGateManifest?.schemaVersion || '').trim(),
    list = subscriptionGateManifest?.gates;
  if (index !== '1.0' || !Array.isArray(list)) throw new Error('Invalid subscription gate manifest');
  const list2 = list.map((item7) => freezeSubscriptionGateEntry(item7));
  if (list2.some((enabled) => !enabled.modelId))
    throw new Error('Invalid subscription gate manifest entry: missing modelId');
  return Object.freeze(list2);
}
export const SUBSCRIPTION_GATE_MANIFESTS = requireSubscriptionGateEntries();
const SUBSCRIPTION_GATE_CANONICAL_EXCLUDES = new Set(
    Array.isArray(subscriptionGateManifest?.canonicalExcludes)
      ? subscriptionGateManifest.canonicalExcludes.map((item8) => String(item8 || '').trim()).filter(Boolean)
      : [],
  ),
  SUBSCRIPTION_GATE_BY_KEY = Object.freeze(
    Object.fromEntries(
      SUBSCRIPTION_GATE_MANIFESTS.filter((event) => event.key).map((event2) => [event2.key, event2]),
    ),
  );
function requireSubscriptionGateModelId(result) {
  const enabled2 = SUBSCRIPTION_GATE_BY_KEY[result];
  if (!enabled2?.modelId) throw new Error('Missing subscription gate manifest entry: ' + result);
  return enabled2.modelId;
}
function getSubscriptionGateAlias(data, options) {
  const enabled3 = String(options || '').trim();
  if (!enabled3) return '';
  return getSubscriptionGateAliasValues(data).find((item9) => item9.startsWith(enabled3)) || '';
}
function getSubscriptionGateAliasValues(target) {
  return [
    ...(Array.isArray(target?.aliases) ? target.aliases : []),
    ...(Array.isArray(target?.legacyAliases) ? target.legacyAliases.map((el2) => el2.value) : []),
  ]
    .map((item10) => String(item10 || '').trim())
    .filter(Boolean);
}
export const DEFAULT_VIP_GATE_MODEL_ID = requireSubscriptionGateModelId('runninghubVideoV54');
export const V54_VIP_MODEL_ID = DEFAULT_VIP_GATE_MODEL_ID;
export const RH_VIDEO_HD_VIP_MODEL_ID = requireSubscriptionGateModelId('runninghubVideoHd');
export const RH_VIDEO_HD_VIP_AI_APP_MODEL_ID = getSubscriptionGateAlias(
  SUBSCRIPTION_GATE_BY_KEY.runninghubVideoHd,
  'ai-app/',
);
export const RH_ADVANCED_VOICE_CLONE_VIP_MODEL_ID = requireSubscriptionGateModelId(
  'runninghubAdvancedVoiceClone',
);
export const RH_ADVANCED_VOICE_CLONE_VIP_AI_APP_MODEL_ID = getSubscriptionGateAlias(
  SUBSCRIPTION_GATE_BY_KEY.runninghubAdvancedVoiceClone,
  'ai-app/',
);
export const DREAMINA_VIDEO_VIP_MODEL_ID = requireSubscriptionGateModelId('dreaminaVideoVip');
export const AUDIO_VOICE_STUDIO_VIP_MODEL_ID = requireSubscriptionGateModelId('audioVoiceStudio');
export const REPLACEMENT_STUDIO_VIP_MODEL_ID = requireSubscriptionGateModelId('replacementStudio');
export const REPLICATION_STUDIO_VIP_MODEL_ID = requireSubscriptionGateModelId('replicationStudio');
export const RH_AI_APP_VIP_MODEL_ID = requireSubscriptionGateModelId('runninghubAiApp');
export const CUSTOM_PROVIDER_VIP_MODEL_ID = requireSubscriptionGateModelId('customProvider');
export const VIDEO_VIP_MODEL_IDS = Array.from(
  new Set(SUBSCRIPTION_GATE_MANIFESTS.map((item11) => item11.modelId)),
);
const VIDEO_VIP_MODEL_ID_SET = new Set(VIDEO_VIP_MODEL_IDS),
  SUBSCRIPTION_GATE_BY_MODEL_ID = Object.freeze(
    Object.fromEntries(SUBSCRIPTION_GATE_MANIFESTS.map((item11) => [item11.modelId, item11])),
  ),
  VIP_MODEL_ID_CANONICAL_ALIASES = Object.freeze(
    Object.fromEntries(
      SUBSCRIPTION_GATE_MANIFESTS.flatMap((item12) => [
        [item12.modelId, item12.modelId],
        ...getSubscriptionGateAliasValues(item12).map((item13) => [item13, item12.modelId]),
        ...(item12.workflowId ? [['runninghub/' + item12.workflowId, item12.modelId]] : []),
      ]).filter(([source, next]) => source && next),
    ),
  ),
  VIP_MODEL_PROVIDER_RULES = SUBSCRIPTION_GATE_MANIFESTS.flatMap((item14) =>
    item14.providers.map((item15) => [item15, item14.modelId]),
  ),
  VIP_MODEL_PREFIX_RULES = SUBSCRIPTION_GATE_MANIFESTS.flatMap((item16) =>
    item16.modelPrefixes.map((item17) => [item17, item16.modelId]),
  ),
  VIP_MODEL_ID_CANONICAL_EXCLUDES = SUBSCRIPTION_GATE_CANONICAL_EXCLUDES,
  VIP_MODEL_DISPLAY_NAMES = Object.freeze(
    Object.fromEntries(
      SUBSCRIPTION_GATE_MANIFESTS.map((item18) => [item18.modelId, item18.displayName || item18.modelId]),
    ),
  ),
  VIP_MODEL_KEY_ALIAS_MAP = Object.freeze(
    Object.fromEntries(
      SUBSCRIPTION_GATE_MANIFESTS.map((item19) => [
        item19.modelId,
        Object.freeze([item19.modelId, ...getSubscriptionGateAliasValues(item19)]),
      ]),
    ),
  ),
  normalizeVipModelId = (current) => {
    const enabled4 = String(current || '').trim();
    if (!enabled4) return '';
    if (VIP_MODEL_ID_CANONICAL_EXCLUDES.has(enabled4)) return enabled4;
    const entry = VIP_MODEL_ID_CANONICAL_ALIASES[enabled4];
    if (entry) return entry;
    const record = VIP_MODEL_PREFIX_RULES.find(([payload]) => enabled4.startsWith(payload));
    if (record) return record[1];
    return enabled4;
  },
  INSTALL_ID_KEY = 'aic-install-id',
  DEVICE_ID_KEY = 'aic-device-id',
  V54_LOCAL_UNLOCK_KEY = 'aic-v54-vip-unlocked',
  SUBSCRIPTION_CONTACT_IMAGE_URL_FALLBACK = 'https://api.ashuoai.com/static/contact/wechat.png',
  SUBSCRIPTION_CONTACT_WECHAT_FALLBACK = 'yumengashuo';
let _fetchSubscriptionStatusImpl = fetchSubscriptionStatus,
  _activateCdkeyImpl = activateCdkey,
  _clearSubscriptionAuthorizationImpl = clearSubscriptionAuthorization_2;
function getSubscriptionContactTextFallback(locale = '') {
  return t('settings.subscription.contact', {}, locale ? { locale: locale } : {});
}
function isDefaultSubscriptionContactText(handle) {
  const enabled5 = String(handle || '').trim();
  if (!enabled5) return true;
  return (
    enabled5 === getSubscriptionContactTextFallback('zh-CN') ||
    enabled5 === getSubscriptionContactTextFallback('en-US')
  );
}
function normalizeSubscriptionContactText(state) {
  const config = String(state || '').trim();
  return isDefaultSubscriptionContactText(config) ? '' : config;
}
export function createDefaultSubscriptionState() {
  return {
    loading: false,
    status: 'none',
    expiresAt: null,
    entitledModelKeys: [],
    entitledModelIds: [],
    error: null,
    lastSyncAt: 0,
    contactText: '',
    contactUrl: SUBSCRIPTION_CONTACT_IMAGE_URL_FALLBACK,
    contactWechat: SUBSCRIPTION_CONTACT_WECHAT_FALLBACK,
    deviceId: '',
  };
}
function _normalizeStatus(scope) {
  const input = String(scope || '')
    .trim()
    .toLowerCase();
  if (input === 'active') return 'active';
  if (input === 'expired') return 'expired';
  return 'none';
}
export function isActivationRequestAccepted(output) {
  const response = output && typeof output === 'object' ? output : {};
  return (
    response?.success === true ||
    Number(response?.code) === 0 ||
    String(response?.status || '')
      .trim()
      .toLowerCase() === 'active'
  );
}
export function isActivationConfirmed(value3, value4) {
  return isActivationRequestAccepted(value3) && isSubscriptionActive(value4 || {});
}
function _toExpirySeconds(value5) {
  if (value5 == null || value5 === '') return null;
  const count = Number(value5);
  if (Number.isFinite(count) && count > 0)
    return count > 100000000000 ? Math.floor(count / 1000) : Math.floor(count);
  const count2 = Date.parse(String(value5));
  if (!Number.isFinite(count2) || count2 <= 0) return null;
  return Math.floor(count2 / 1000);
}
export function extractSubscriptionExpiresAt(value6) {
  const value7 = value6 && typeof value6 === 'object' ? value6 : {},
    value8 = value7.data && typeof value7.data === 'object' ? value7.data : value7,
    value9 =
      value8?.expiresAt ??
      value8?.expires_at ??
      value8?.expireAt ??
      value8?.expire_at ??
      value8?.expiryAt ??
      value8?.expiry_at ??
      value8?.expiry ??
      value8?.expiredAt ??
      value8?.expired_at ??
      value8?.endAt ??
      value8?.end_at ??
      value8?.validUntil ??
      value8?.valid_until ??
      value8?.deadlineAt ??
      value8?.deadline_at ??
      value8?.deadline ??
      null;
  return _toExpirySeconds(value9);
}
export function isSubscriptionActive(response2) {
  return _normalizeStatus(response2?.status) === 'active';
}
export function resolveVipGateModelId(value10, value11 = '') {
  const vipModelId = normalizeVipModelId(value10);
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES.has(vipModelId)) return vipModelId;
  if (VIDEO_VIP_MODEL_ID_SET.has(vipModelId)) return vipModelId;
  const value12 = String(value11 || '')
      .trim()
      .toLowerCase(),
    value13 = value12 ? VIP_MODEL_PROVIDER_RULES.find(([value14]) => value14 === value12) : null;
  if (value13) return value13[1];
  return vipModelId;
}
export function getVipModelDisplayName(value15, value16 = '') {
  const vipGateModelId = resolveVipGateModelId(value15, value16);
  return VIP_MODEL_DISPLAY_NAMES[vipGateModelId] || vipGateModelId || 'model';
}
export function isVipModel(value17, value18 = '') {
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES.has(String(value17 || '').trim())) return false;
  const vipGateModelId2 = resolveVipGateModelId(value17, value18);
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES.has(vipGateModelId2)) return false;
  return VIDEO_VIP_MODEL_ID_SET.has(vipGateModelId2);
}
function getVipModelKeyAliases(value19) {
  const vipModelId2 = normalizeVipModelId(value19);
  return Array.from(new Set(VIP_MODEL_KEY_ALIAS_MAP[vipModelId2] || []));
}
export function setLocalVipUnlocked(value20) {
  try {
    value20
      ? globalThis.localStorage?.setItem(V54_LOCAL_UNLOCK_KEY, '1')
      : globalThis.localStorage?.removeItem(V54_LOCAL_UNLOCK_KEY);
  } catch {}
}
export function isModelAllowed(value21, value22, value23 = '') {
  const value24 = String(value21 || '').trim(),
    vipGateModelId3 = resolveVipGateModelId(value24, value23);
  if (!isVipModel(vipGateModelId3)) return true;
  if (!isSubscriptionActive(value22 || {})) return false;
  if (SUBSCRIPTION_GATE_BY_MODEL_ID[vipGateModelId3]?.allowAnyActiveSubscription) return true;
  const value25 = value22 && typeof value22 === 'object' ? value22 : {},
    list3 = Array.isArray(value25.entitledModelIds)
      ? value25.entitledModelIds.map((item20) => normalizeVipModelId(item20)).filter(Boolean)
      : [];
  if (list3.length > 0) return list3.includes(vipGateModelId3);
  const list4 = Array.isArray(value25.entitledModelKeys)
    ? value25.entitledModelKeys
        .map((item21) =>
          String(item21 || '')
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean)
    : [];
  if (list4.length > 0) {
    const list5 = getVipModelKeyAliases(vipGateModelId3);
    if (list5.length === 0) return false;
    return list5.some((item22) => list4.includes(String(item22).toLowerCase()));
  }
  return true;
}
function _generateInstallId() {
  const list6 = Date.now() + '-' + Math.random();
  let value26 = 0;
  for (let value27 = 0; value27 < list6.length; value27 += 1) {
    value26 = (value26 * 31 + list6.charCodeAt(value27)) >>> 0;
  }
  return 'aic-' + Date.now().toString(36) + '-' + value26.toString(36);
}
function _generateDeviceId() {
  return 'aicdev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
function _publishInstallId(value28) {
  const enabled6 = String(value28 || '').trim();
  if (!enabled6) return '';
  try {
    window.__aicInstallId = enabled6;
  } catch {}
  try {
    globalThis.__aicInstallId = enabled6;
  } catch {}
  return enabled6;
}
function _publishDeviceId(value29) {
  const enabled7 = String(value29 || '').trim();
  if (!enabled7) return '';
  try {
    window.__aicDeviceId = enabled7;
  } catch {}
  try {
    globalThis.__aicDeviceId = enabled7;
  } catch {}
  try {
    localStorage.setItem(DEVICE_ID_KEY, enabled7);
  } catch {}
  return enabled7;
}
function _clearPublishedSubscriptionIdentity() {
  try {
    delete window.__aicInstallId;
  } catch {}
  try {
    delete window.__aicDeviceId;
  } catch {}
  try {
    delete globalThis.__aicInstallId;
  } catch {}
  try {
    delete globalThis.__aicDeviceId;
  } catch {}
}
function _clearLocalSubscriptionIdentity() {
  try {
    localStorage.removeItem(INSTALL_ID_KEY);
  } catch {}
  try {
    localStorage.removeItem(DEVICE_ID_KEY);
  } catch {}
  (setLocalVipUnlocked(false), _clearPublishedSubscriptionIdentity());
}
export async function ensureDeviceId(value30 = '') {
  const installId = String(
    value30 || globalThis.window?.__aicInstallId || globalThis.__aicInstallId || '',
  ).trim();
  try {
    const value31 = await globalThis.window?.aiCanvasDesktop?.getDeviceId?.({ installId: installId }),
      value32 = String(value31 || '').trim();
    if (value32) return _publishDeviceId(value32);
  } catch {}
  try {
    const value33 = String(localStorage.getItem(DEVICE_ID_KEY) || '').trim();
    if (value33) return _publishDeviceId(value33);
  } catch {}
  const value34 = installId || _generateDeviceId();
  return _publishDeviceId(value34);
}
export async function ensureInstallId() {
  try {
    const value35 = String(localStorage.getItem(INSTALL_ID_KEY) || '').trim();
    if (value35) return (_publishInstallId(value35), await ensureDeviceId(value35), value35);
  } catch {}
  let args = {};
  try {
    args = (await fetchUserSettingsFromServer()) || {};
  } catch {
    args = {};
  }
  const value36 = String(args.installId || '').trim();
  if (value36) {
    try {
      localStorage.setItem(INSTALL_ID_KEY, value36);
    } catch {}
    return (_publishInstallId(value36), await ensureDeviceId(value36), value36);
  }
  const installId2 = _generateInstallId();
  try {
    localStorage.setItem(INSTALL_ID_KEY, installId2);
  } catch {}
  try {
    await saveUserSettingsToServer({ ...args, installId: installId2 });
  } catch {}
  return (_publishInstallId(installId2), await ensureDeviceId(installId2), installId2);
}
export function normalizeSubscriptionPayload(value37) {
  const args2 = createDefaultSubscriptionState(),
    value38 = value37 && typeof value37 === 'object' ? value37 : {},
    response3 = value38.data && typeof value38.data === 'object' ? value38.data : value38,
    value39 = String(response3?.status || response3?.subscriptionStatus || response3?.state || '')
      .trim()
      .toLowerCase(),
    status = _normalizeStatus(value39),
    expiresAt = extractSubscriptionExpiresAt(response3),
    list7 = Array.isArray(response3?.entitledModelIds)
      ? response3.entitledModelIds
      : Array.isArray(response3?.entitled_model_ids)
        ? response3.entitled_model_ids
        : Array.isArray(response3?.modelIds)
          ? response3.modelIds
          : [],
    entitledModelIds = list7.map((item23) => normalizeVipModelId(item23)).filter(Boolean),
    list8 = Array.isArray(response3?.entitledModelKeys)
      ? response3.entitledModelKeys
      : Array.isArray(response3?.entitled_model_keys)
        ? response3.entitled_model_keys
        : Array.isArray(response3?.modelKeys)
          ? response3.modelKeys
          : [],
    entitledModelKeys = list8.map((item24) => String(item24 || '').trim()).filter(Boolean),
    value40 = response3?.contactText ?? response3?.contact_text ?? args2.contactText,
    value41 = response3?.contactUrl ?? response3?.contact_url ?? args2.contactUrl,
    value42 =
      response3?.contactWechat ??
      response3?.contact_wechat ??
      response3?.wechatId ??
      response3?.wechat_id ??
      response3?.wechat ??
      args2.contactWechat,
    value43 = response3?.deviceId ?? response3?.device_id ?? args2.deviceId;
  return {
    ...args2,
    status: status,
    expiresAt: expiresAt,
    entitledModelKeys: entitledModelKeys,
    entitledModelIds: entitledModelIds,
    contactText: normalizeSubscriptionContactText(value40),
    contactUrl: String(value41 || args2.contactUrl),
    contactWechat: String(value42 || args2.contactWechat),
    deviceId: String(value43 || ''),
  };
}
export async function pullSubscriptionState(value44) {
  const deviceId = await ensureDeviceId(value44),
    _fetchSubscriptionStatusImpl2 = await _fetchSubscriptionStatusImpl(value44, deviceId),
    subscriptionPayload = normalizeSubscriptionPayload(_fetchSubscriptionStatusImpl2 || {});
  return (setLocalVipUnlocked(isSubscriptionActive(subscriptionPayload)), subscriptionPayload);
}
export async function submitCdkey(installId3, cdkey) {
  const deviceId2 = await ensureDeviceId(installId3),
    _activateCdkeyImpl2 = await _activateCdkeyImpl({
      installId: installId3,
      cdkey: cdkey,
      deviceId: deviceId2,
    });
  return _activateCdkeyImpl2 && typeof _activateCdkeyImpl2 === 'object' ? _activateCdkeyImpl2 : {};
}
export async function clearSubscriptionAuthorization() {
  const installId4 = String(globalThis.window?.__aicInstallId || globalThis.__aicInstallId || '').trim(),
    deviceId3 = String(globalThis.window?.__aicDeviceId || globalThis.__aicDeviceId || '').trim(),
    _clearSubscriptionAuthorizationImpl2 = await _clearSubscriptionAuthorizationImpl({
      installId: installId4,
      deviceId: deviceId3,
    });
  return (
    _clearLocalSubscriptionIdentity(),
    _clearSubscriptionAuthorizationImpl2 && typeof _clearSubscriptionAuthorizationImpl2 === 'object'
      ? _clearSubscriptionAuthorizationImpl2
      : {}
  );
}
export function __setSubscriptionApiForTest({
  fetchSubscriptionStatusImpl: fetchSubscriptionStatusImpl,
  activateCdkeyImpl: activateCdkeyImpl,
  clearSubscriptionAuthorizationImpl: clearSubscriptionAuthorizationImpl,
} = {}) {
  ((_fetchSubscriptionStatusImpl =
    typeof fetchSubscriptionStatusImpl === 'function'
      ? fetchSubscriptionStatusImpl
      : fetchSubscriptionStatus),
    (_activateCdkeyImpl = typeof activateCdkeyImpl === 'function' ? activateCdkeyImpl : activateCdkey),
    (_clearSubscriptionAuthorizationImpl =
      typeof clearSubscriptionAuthorizationImpl === 'function'
        ? clearSubscriptionAuthorizationImpl
        : clearSubscriptionAuthorization_2));
}

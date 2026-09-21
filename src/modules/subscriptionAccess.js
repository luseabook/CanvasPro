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
  ],
};
function freezeSubscriptionGateLegacyAlias(_0x536189, _0x1c8328) {
  const _0x3e4ccd = _0x536189 && typeof _0x536189 === 'object' ? _0x536189 : {},
    _0x4468a = String(_0x3e4ccd.value || '').trim(),
    _0x227d6f = String(_0x3e4ccd.deleteWhen || '').trim();
  if (!_0x4468a || !_0x227d6f)
    throw new Error('Invalid subscription gate legacy alias: ' + (_0x1c8328 || 'unknown'));
  return Object.freeze({ value: _0x4468a, deleteWhen: _0x227d6f });
}
function freezeSubscriptionGateEntry(_0x22fe38) {
  const _0x374a73 = _0x22fe38 && typeof _0x22fe38 === 'object' ? _0x22fe38 : {},
    _0x545bef = String(_0x374a73.key || '').trim();
  return Object.freeze({
    key: _0x545bef,
    modelId: String(_0x374a73.modelId || '').trim(),
    workflowId: String(_0x374a73.workflowId || '').trim(),
    displayName: String(_0x374a73.displayName || '').trim(),
    aliases: Object.freeze(
      Array.isArray(_0x374a73.aliases)
        ? _0x374a73.aliases.map((_0x4d7b20) => String(_0x4d7b20 || '').trim()).filter(Boolean)
        : [],
    ),
    legacyAliases: Object.freeze(
      Array.isArray(_0x374a73.legacyAliases)
        ? _0x374a73.legacyAliases.map((_0x1ed6df) => freezeSubscriptionGateLegacyAlias(_0x1ed6df, _0x545bef))
        : [],
    ),
    providers: Object.freeze(
      Array.isArray(_0x374a73.providers)
        ? _0x374a73.providers
            .map((_0x18e024) =>
              String(_0x18e024 || '')
                .trim()
                .toLowerCase(),
            )
            .filter(Boolean)
        : [],
    ),
    modelPrefixes: Object.freeze(
      Array.isArray(_0x374a73.modelPrefixes)
        ? _0x374a73.modelPrefixes.map((_0x4b6e24) => String(_0x4b6e24 || '').trim()).filter(Boolean)
        : [],
    ),
  });
}
function requireSubscriptionGateEntries() {
  const _0x5dc4e6 = String(subscriptionGateManifest?.schemaVersion || '').trim(),
    _0x4c6b60 = subscriptionGateManifest?.gates;
  if (_0x5dc4e6 !== '1.0' || !Array.isArray(_0x4c6b60)) throw new Error('Invalid subscription gate manifest');
  const _0x1ce6b8 = _0x4c6b60.map((_0x5540b4) => freezeSubscriptionGateEntry(_0x5540b4));
  if (_0x1ce6b8.some((_0xb9f9fd) => !_0xb9f9fd.modelId))
    throw new Error('Invalid subscription gate manifest entry: missing modelId');
  return Object.freeze(_0x1ce6b8);
}
export const SUBSCRIPTION_GATE_MANIFESTS = requireSubscriptionGateEntries();
const SUBSCRIPTION_GATE_CANONICAL_EXCLUDES = new Set(
    Array.isArray(subscriptionGateManifest?.canonicalExcludes)
      ? subscriptionGateManifest.canonicalExcludes
          .map((_0x165d3e) => String(_0x165d3e || '').trim())
          .filter(Boolean)
      : [],
  ),
  SUBSCRIPTION_GATE_BY_KEY = Object.freeze(
    Object.fromEntries(
      SUBSCRIPTION_GATE_MANIFESTS.filter((_0x2c94a2) => _0x2c94a2.key).map((_0x3778b7) => [
        _0x3778b7.key,
        _0x3778b7,
      ]),
    ),
  );
function requireSubscriptionGateModelId(_0x589980) {
  const _0x4a43b7 = SUBSCRIPTION_GATE_BY_KEY[_0x589980];
  if (!_0x4a43b7?.modelId) throw new Error('Missing subscription gate manifest entry: ' + _0x589980);
  return _0x4a43b7.modelId;
}
function getSubscriptionGateAlias(_0xc943df, _0x156fbe) {
  const _0x4fac43 = String(_0x156fbe || '').trim();
  if (!_0x4fac43) return '';
  return getSubscriptionGateAliasValues(_0xc943df).find((_0xd00ea5) => _0xd00ea5.startsWith(_0x4fac43)) || '';
}
function getSubscriptionGateAliasValues(_0x39b542) {
  return [
    ...(Array.isArray(_0x39b542?.aliases) ? _0x39b542.aliases : []),
    ...(Array.isArray(_0x39b542?.legacyAliases)
      ? _0x39b542.legacyAliases.map((_0x122f9e) => _0x122f9e.value)
      : []),
  ]
    .map((_0x43a5b0) => String(_0x43a5b0 || '').trim())
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
export const VIDEO_VIP_MODEL_IDS = Array.from(
  new Set(SUBSCRIPTION_GATE_MANIFESTS.map((_0x5066df) => _0x5066df.modelId)),
);
const VIDEO_VIP_MODEL_ID_SET = new Set(VIDEO_VIP_MODEL_IDS),
  VIP_MODEL_ID_CANONICAL_ALIASES = Object.freeze(
    Object.fromEntries(
      SUBSCRIPTION_GATE_MANIFESTS.flatMap((_0x3545df) => [
        [_0x3545df.modelId, _0x3545df.modelId],
        ...getSubscriptionGateAliasValues(_0x3545df).map((_0x3d16cc) => [_0x3d16cc, _0x3545df.modelId]),
        ...(_0x3545df.workflowId ? [['runninghub/' + _0x3545df.workflowId, _0x3545df.modelId]] : []),
      ]).filter(([_0x441fb6, _0x3bd13e]) => _0x441fb6 && _0x3bd13e),
    ),
  ),
  VIP_MODEL_PROVIDER_RULES = SUBSCRIPTION_GATE_MANIFESTS.flatMap((_0x4ec85b) =>
    _0x4ec85b.providers.map((_0x47f43d) => [_0x47f43d, _0x4ec85b.modelId]),
  ),
  VIP_MODEL_PREFIX_RULES = SUBSCRIPTION_GATE_MANIFESTS.flatMap((_0x5e7778) =>
    _0x5e7778.modelPrefixes.map((_0x1351b9) => [_0x1351b9, _0x5e7778.modelId]),
  ),
  VIP_MODEL_ID_CANONICAL_EXCLUDES = SUBSCRIPTION_GATE_CANONICAL_EXCLUDES,
  VIP_MODEL_DISPLAY_NAMES = Object.freeze(
    Object.fromEntries(
      SUBSCRIPTION_GATE_MANIFESTS.map((_0x1fea35) => [
        _0x1fea35.modelId,
        _0x1fea35.displayName || _0x1fea35.modelId,
      ]),
    ),
  ),
  VIP_MODEL_KEY_ALIAS_MAP = Object.freeze(
    Object.fromEntries(
      SUBSCRIPTION_GATE_MANIFESTS.map((_0x13d435) => [
        _0x13d435.modelId,
        Object.freeze([_0x13d435.modelId, ...getSubscriptionGateAliasValues(_0x13d435)]),
      ]),
    ),
  ),
  normalizeVipModelId = (_0xd61e1b) => {
    const _0xfbee73 = String(_0xd61e1b || '').trim();
    if (!_0xfbee73) return '';
    if (VIP_MODEL_ID_CANONICAL_EXCLUDES.has(_0xfbee73)) return _0xfbee73;
    const _0x143bf0 = VIP_MODEL_ID_CANONICAL_ALIASES[_0xfbee73];
    if (_0x143bf0) return _0x143bf0;
    const _0x26a06c = VIP_MODEL_PREFIX_RULES.find(([_0x5b4fe6]) => _0xfbee73.startsWith(_0x5b4fe6));
    if (_0x26a06c) return _0x26a06c[1];
    return _0xfbee73;
  },
  INSTALL_ID_KEY = 'aic-install-id',
  DEVICE_ID_KEY = 'aic-device-id',
  V54_LOCAL_UNLOCK_KEY = 'aic-v54-vip-unlocked',
  SUBSCRIPTION_CONTACT_IMAGE_URL_FALLBACK = 'https://api.ashuoai.com/static/contact/wechat.png',
  SUBSCRIPTION_CONTACT_WECHAT_FALLBACK = 'yumengashuo';
let _fetchSubscriptionStatusImpl = fetchSubscriptionStatus,
  _activateCdkeyImpl = activateCdkey,
  _clearSubscriptionAuthorizationImpl = clearSubscriptionAuthorization_2;
function getSubscriptionContactTextFallback(_0x5d8348 = '') {
  return t('settings.subscription.contact', {}, _0x5d8348 ? { locale: _0x5d8348 } : {});
}
function isDefaultSubscriptionContactText(_0x1a9748) {
  const _0x5b214b = String(_0x1a9748 || '').trim();
  if (!_0x5b214b) return true;
  return (
    _0x5b214b === getSubscriptionContactTextFallback('zh-CN') ||
    _0x5b214b === getSubscriptionContactTextFallback('en-US')
  );
}
function normalizeSubscriptionContactText(_0x480aff) {
  const _0x2cb4e8 = String(_0x480aff || '').trim();
  return isDefaultSubscriptionContactText(_0x2cb4e8) ? '' : _0x2cb4e8;
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
function _normalizeStatus(_0x8dcd8f) {
  const _0x3fbae5 = String(_0x8dcd8f || '')
    .trim()
    .toLowerCase();
  if (_0x3fbae5 === 'active') return 'active';
  if (_0x3fbae5 === 'expired') return 'expired';
  return 'none';
}
export function isActivationRequestAccepted(_0x23c139) {
  const _0x30b1d5 = _0x23c139 && typeof _0x23c139 === 'object' ? _0x23c139 : {};
  return (
    _0x30b1d5?.success === true ||
    Number(_0x30b1d5?.code) === 0 ||
    String(_0x30b1d5?.status || '')
      .trim()
      .toLowerCase() === 'active'
  );
}
export function isActivationConfirmed(_0x2adbf5, _0x158dbc) {
  return isActivationRequestAccepted(_0x2adbf5) && isSubscriptionActive(_0x158dbc || {});
}
function _toExpirySeconds(_0x4a3b0c) {
  if (_0x4a3b0c == null || _0x4a3b0c === '') return null;
  const _0xbb39c0 = Number(_0x4a3b0c);
  if (Number.isFinite(_0xbb39c0) && _0xbb39c0 > 0)
    return _0xbb39c0 > 0x174876e800 ? Math.floor(_0xbb39c0 / 0x3e8) : Math.floor(_0xbb39c0);
  const _0x2043c3 = Date.parse(String(_0x4a3b0c));
  if (!Number.isFinite(_0x2043c3) || _0x2043c3 <= 0) return null;
  return Math.floor(_0x2043c3 / 0x3e8);
}
export function extractSubscriptionExpiresAt(_0x4fb991) {
  const _0x1efb5c = _0x4fb991 && typeof _0x4fb991 === 'object' ? _0x4fb991 : {},
    _0x42684e = _0x1efb5c.data && typeof _0x1efb5c.data === 'object' ? _0x1efb5c.data : _0x1efb5c,
    _0x29e75b =
      _0x42684e?.expiresAt ??
      _0x42684e?.expires_at ??
      _0x42684e?.expireAt ??
      _0x42684e?.expire_at ??
      _0x42684e?.expiryAt ??
      _0x42684e?.expiry_at ??
      _0x42684e?.expiry ??
      _0x42684e?.expiredAt ??
      _0x42684e?.expired_at ??
      _0x42684e?.endAt ??
      _0x42684e?.end_at ??
      _0x42684e?.validUntil ??
      _0x42684e?.valid_until ??
      _0x42684e?.deadlineAt ??
      _0x42684e?.deadline_at ??
      _0x42684e?.deadline ??
      null;
  return _toExpirySeconds(_0x29e75b);
}
export function isSubscriptionActive(_0x489a88) {
  return _normalizeStatus(_0x489a88?.status) === 'active';
}
export function resolveVipGateModelId(_0xd6ac08, _0x2e3929 = '') {
  const _0x55b688 = normalizeVipModelId(_0xd6ac08);
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES.has(_0x55b688)) return _0x55b688;
  if (VIDEO_VIP_MODEL_ID_SET.has(_0x55b688)) return _0x55b688;
  const _0x446e3e = String(_0x2e3929 || '')
      .trim()
      .toLowerCase(),
    _0x4288e9 = _0x446e3e ? VIP_MODEL_PROVIDER_RULES.find(([_0xafa64f]) => _0xafa64f === _0x446e3e) : null;
  if (_0x4288e9) return _0x4288e9[1];
  return _0x55b688;
}
export function getVipModelDisplayName(_0x3be6e0, _0x586202 = '') {
  const _0x2e0ed3 = resolveVipGateModelId(_0x3be6e0, _0x586202);
  return VIP_MODEL_DISPLAY_NAMES[_0x2e0ed3] || _0x2e0ed3 || 'model';
}
export function isVipModel(_0x424565, _0x4fe9b0 = '') {
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES.has(String(_0x424565 || '').trim())) return false;
  const _0x431b5b = resolveVipGateModelId(_0x424565, _0x4fe9b0);
  if (VIP_MODEL_ID_CANONICAL_EXCLUDES.has(_0x431b5b)) return false;
  return VIDEO_VIP_MODEL_ID_SET.has(_0x431b5b);
}
function getVipModelKeyAliases(_0xacb1fe) {
  const _0x3a63ba = normalizeVipModelId(_0xacb1fe);
  return Array.from(new Set(VIP_MODEL_KEY_ALIAS_MAP[_0x3a63ba] || []));
}
export function setLocalVipUnlocked(_0x32a831) {
  try {
    _0x32a831
      ? globalThis.localStorage?.setItem(V54_LOCAL_UNLOCK_KEY, '1')
      : globalThis.localStorage?.removeItem(V54_LOCAL_UNLOCK_KEY);
  } catch {}
}
export function isModelAllowed(_0x9ad14f, _0xe80c8f, _0x3f5439 = '') {
  const _0x285e73 = String(_0x9ad14f || '').trim(),
    _0xa93a85 = resolveVipGateModelId(_0x285e73, _0x3f5439);
  if (!isVipModel(_0xa93a85)) return true;
  if (!isSubscriptionActive(_0xe80c8f || {})) return false;
  const _0x48c026 = _0xe80c8f && typeof _0xe80c8f === 'object' ? _0xe80c8f : {},
    _0x2fcf3c = Array.isArray(_0x48c026.entitledModelIds)
      ? _0x48c026.entitledModelIds.map((_0x19e907) => normalizeVipModelId(_0x19e907)).filter(Boolean)
      : [];
  if (_0x2fcf3c.length > 0) return _0x2fcf3c.includes(_0xa93a85);
  const _0x473dd9 = Array.isArray(_0x48c026.entitledModelKeys)
    ? _0x48c026.entitledModelKeys
        .map((_0x5475a4) =>
          String(_0x5475a4 || '')
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean)
    : [];
  if (_0x473dd9.length > 0) {
    const _0x368249 = getVipModelKeyAliases(_0xa93a85);
    if (_0x368249.length === 0) return false;
    return _0x368249.some((_0x3868c8) => _0x473dd9.includes(String(_0x3868c8).toLowerCase()));
  }
  return true;
}
function _generateInstallId() {
  const _0x3a43a7 = Date.now() + '-' + Math.random();
  let _0x5d0d7e = 0;
  for (let _0x4fb718 = 0; _0x4fb718 < _0x3a43a7.length; _0x4fb718 += 1) {
    _0x5d0d7e = (_0x5d0d7e * 31 + _0x3a43a7.charCodeAt(_0x4fb718)) >>> 0;
  }
  return 'aic-' + Date.now().toString(36) + '-' + _0x5d0d7e.toString(36);
}
function _generateDeviceId() {
  return 'aicdev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
}
function _publishInstallId(_0x208f96) {
  const _0x241152 = String(_0x208f96 || '').trim();
  if (!_0x241152) return '';
  try {
    window.__aicInstallId = _0x241152;
  } catch {}
  try {
    globalThis.__aicInstallId = _0x241152;
  } catch {}
  return _0x241152;
}
function _publishDeviceId(_0x229861) {
  const _0x362a06 = String(_0x229861 || '').trim();
  if (!_0x362a06) return '';
  try {
    window.__aicDeviceId = _0x362a06;
  } catch {}
  try {
    globalThis.__aicDeviceId = _0x362a06;
  } catch {}
  try {
    localStorage.setItem(DEVICE_ID_KEY, _0x362a06);
  } catch {}
  return _0x362a06;
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
export async function ensureDeviceId(_0x3bfd09 = '') {
  const _0x2dea57 = String(
    _0x3bfd09 || globalThis.window?.__aicInstallId || globalThis.__aicInstallId || '',
  ).trim();
  try {
    const _0x556351 = await globalThis.window?.aiCanvasDesktop?.getDeviceId?.({ installId: _0x2dea57 }),
      _0x4ed5fb = String(_0x556351 || '').trim();
    if (_0x4ed5fb) return _publishDeviceId(_0x4ed5fb);
  } catch {}
  try {
    const _0x55e650 = String(localStorage.getItem(DEVICE_ID_KEY) || '').trim();
    if (_0x55e650) return _publishDeviceId(_0x55e650);
  } catch {}
  const _0x982fe2 = _0x2dea57 || _generateDeviceId();
  return _publishDeviceId(_0x982fe2);
}
export async function ensureInstallId() {
  try {
    const _0x26fc2b = String(localStorage.getItem(INSTALL_ID_KEY) || '').trim();
    if (_0x26fc2b) return (_publishInstallId(_0x26fc2b), await ensureDeviceId(_0x26fc2b), _0x26fc2b);
  } catch {}
  let _0x6734f6 = {};
  try {
    _0x6734f6 = (await fetchUserSettingsFromServer()) || {};
  } catch {
    _0x6734f6 = {};
  }
  const _0x3fa04b = String(_0x6734f6.installId || '').trim();
  if (_0x3fa04b) {
    try {
      localStorage.setItem(INSTALL_ID_KEY, _0x3fa04b);
    } catch {}
    return (_publishInstallId(_0x3fa04b), await ensureDeviceId(_0x3fa04b), _0x3fa04b);
  }
  const _0x158fc1 = _generateInstallId();
  try {
    localStorage.setItem(INSTALL_ID_KEY, _0x158fc1);
  } catch {}
  try {
    await saveUserSettingsToServer({ ..._0x6734f6, installId: _0x158fc1 });
  } catch {}
  return (_publishInstallId(_0x158fc1), await ensureDeviceId(_0x158fc1), _0x158fc1);
}
export function normalizeSubscriptionPayload(_0x429063) {
  const _0x51f78b = createDefaultSubscriptionState(),
    _0x5b225a = _0x429063 && typeof _0x429063 === 'object' ? _0x429063 : {},
    _0x2cbf6c = _0x5b225a.data && typeof _0x5b225a.data === 'object' ? _0x5b225a.data : _0x5b225a,
    _0x152dec = String(_0x2cbf6c?.status || _0x2cbf6c?.subscriptionStatus || _0x2cbf6c?.state || '')
      .trim()
      .toLowerCase(),
    _0xff4196 = _normalizeStatus(_0x152dec),
    _0x13935c = extractSubscriptionExpiresAt(_0x2cbf6c),
    _0x1aa6c6 = Array.isArray(_0x2cbf6c?.entitledModelIds)
      ? _0x2cbf6c.entitledModelIds
      : Array.isArray(_0x2cbf6c?.entitled_model_ids)
        ? _0x2cbf6c.entitled_model_ids
        : Array.isArray(_0x2cbf6c?.modelIds)
          ? _0x2cbf6c.modelIds
          : [],
    _0x1475c7 = _0x1aa6c6.map((_0x2dd05b) => normalizeVipModelId(_0x2dd05b)).filter(Boolean),
    _0xaf29e3 = Array.isArray(_0x2cbf6c?.entitledModelKeys)
      ? _0x2cbf6c.entitledModelKeys
      : Array.isArray(_0x2cbf6c?.entitled_model_keys)
        ? _0x2cbf6c.entitled_model_keys
        : Array.isArray(_0x2cbf6c?.modelKeys)
          ? _0x2cbf6c.modelKeys
          : [],
    _0x1788c3 = _0xaf29e3.map((_0x206613) => String(_0x206613 || '').trim()).filter(Boolean),
    _0x208506 = _0x2cbf6c?.contactText ?? _0x2cbf6c?.contact_text ?? _0x51f78b.contactText,
    _0x25b539 = _0x2cbf6c?.contactUrl ?? _0x2cbf6c?.contact_url ?? _0x51f78b.contactUrl,
    _0x147179 =
      _0x2cbf6c?.contactWechat ??
      _0x2cbf6c?.contact_wechat ??
      _0x2cbf6c?.wechatId ??
      _0x2cbf6c?.wechat_id ??
      _0x2cbf6c?.wechat ??
      _0x51f78b.contactWechat,
    _0x15a8bb = _0x2cbf6c?.deviceId ?? _0x2cbf6c?.device_id ?? _0x51f78b.deviceId;
  return {
    ..._0x51f78b,
    status: _0xff4196,
    expiresAt: _0x13935c,
    entitledModelKeys: _0x1788c3,
    entitledModelIds: _0x1475c7,
    contactText: normalizeSubscriptionContactText(_0x208506),
    contactUrl: String(_0x25b539 || _0x51f78b.contactUrl),
    contactWechat: String(_0x147179 || _0x51f78b.contactWechat),
    deviceId: String(_0x15a8bb || ''),
  };
}
export async function pullSubscriptionState(_0x10fc86) {
  const _0x31f754 = await ensureDeviceId(_0x10fc86),
    _0x1a26a2 = await _fetchSubscriptionStatusImpl(_0x10fc86, _0x31f754),
    _0x257b04 = normalizeSubscriptionPayload(_0x1a26a2 || {});
  return (setLocalVipUnlocked(isSubscriptionActive(_0x257b04)), _0x257b04);
}
export async function submitCdkey(_0x21bce4, _0x443049) {
  const _0x5e3a23 = await ensureDeviceId(_0x21bce4),
    _0x1596b9 = await _activateCdkeyImpl({ installId: _0x21bce4, cdkey: _0x443049, deviceId: _0x5e3a23 });
  return _0x1596b9 && typeof _0x1596b9 === 'object' ? _0x1596b9 : {};
}
export async function clearSubscriptionAuthorization() {
  const _0xf373d1 = String(globalThis.window?.__aicInstallId || globalThis.__aicInstallId || '').trim(),
    _0x1c6055 = String(globalThis.window?.__aicDeviceId || globalThis.__aicDeviceId || '').trim(),
    _0x569829 = await _clearSubscriptionAuthorizationImpl({ installId: _0xf373d1, deviceId: _0x1c6055 });
  return (_clearLocalSubscriptionIdentity(), _0x569829 && typeof _0x569829 === 'object' ? _0x569829 : {});
}
export function __setSubscriptionApiForTest({
  fetchSubscriptionStatusImpl: _0x41bda1,
  activateCdkeyImpl: _0x15c6b8,
  clearSubscriptionAuthorizationImpl: _0x352b49,
} = {}) {
  ((_fetchSubscriptionStatusImpl = typeof _0x41bda1 === 'function' ? _0x41bda1 : fetchSubscriptionStatus),
    (_activateCdkeyImpl = typeof _0x15c6b8 === 'function' ? _0x15c6b8 : activateCdkey),
    (_clearSubscriptionAuthorizationImpl =
      typeof _0x352b49 === 'function' ? _0x352b49 : clearSubscriptionAuthorization_2));
}

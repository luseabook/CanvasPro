export const AGNES_DOMESTIC_PROFILE_ID = 'agnes-domestic';
export const AGNES_INTERNATIONAL_PROFILE_ID = 'agnes';
export const AGNES_MODEL_API_PROFILE_IDS = Object['freeze']([
  AGNES_DOMESTIC_PROFILE_ID,
  AGNES_INTERNATIONAL_PROFILE_ID,
]);
export const AGNES_MODEL_API_PROFILES = Object['freeze']({
  [AGNES_DOMESTIC_PROFILE_ID]: Object['freeze']({
    id: AGNES_DOMESTIC_PROFILE_ID,
    label: 'Agnes\x20AI（国内）',
    shortLabel: '国内',
    switchLabel: 'Agnes AI 国内版',
    credentialLabel: 'API Key',
    region: 'domestic',
    apiUrl: 'https://api.agnes-ai.cn',
  }),
  [AGNES_INTERNATIONAL_PROFILE_ID]: Object['freeze']({
    id: AGNES_INTERNATIONAL_PROFILE_ID,
    label: 'Agnes\x20AI（国际）',
    shortLabel: '国际',
    switchLabel: 'Agnes\x20AI\x20国际版',
    credentialLabel: 'API Key',
    region: 'international',
    apiUrl: 'https://apihub.agnes-ai.com',
  }),
});
export function getAgnesModelApiProfile(_0x1c4af1) {
  const _0x5e256e = String(_0x1c4af1 || '')['trim']();
  return AGNES_MODEL_API_PROFILES[_0x5e256e] || AGNES_MODEL_API_PROFILES[AGNES_DOMESTIC_PROFILE_ID];
}

export const MINIMAX_DOMESTIC_PROFILE_ID = 'minimax';
export const MINIMAX_INTERNATIONAL_PROFILE_ID = 'minimax-international';
export const MINIMAX_MODEL_API_PROFILE_IDS = Object['freeze']([
  MINIMAX_DOMESTIC_PROFILE_ID,
  MINIMAX_INTERNATIONAL_PROFILE_ID,
]);
export const MINIMAX_MODEL_API_PROFILES = Object['freeze']({
  [MINIMAX_DOMESTIC_PROFILE_ID]: Object['freeze']({
    id: MINIMAX_DOMESTIC_PROFILE_ID,
    label: 'MiniMAX官方（国内版）',
    shortLabel: '国内',
    switchLabel: 'MiniMAX 官方国内版',
    credentialLabel: 'API Key',
    region: 'domestic',
    apiUrl: 'https://api.minimaxi.com',
  }),
  [MINIMAX_INTERNATIONAL_PROFILE_ID]: Object['freeze']({
    id: MINIMAX_INTERNATIONAL_PROFILE_ID,
    label: 'MiniMAX官方（国际版）',
    shortLabel: '国际',
    switchLabel: 'MiniMAX 官方国际版',
    credentialLabel: 'API Key',
    region: 'international',
    apiUrl: 'https://api.minimax.io',
  }),
});
export function getMinimaxModelApiProfile(_0x1a4fb8) {
  const _0x28518c = String(_0x1a4fb8 || '')['trim']();
  return MINIMAX_MODEL_API_PROFILES[_0x28518c] || MINIMAX_MODEL_API_PROFILES[MINIMAX_DOMESTIC_PROFILE_ID];
}

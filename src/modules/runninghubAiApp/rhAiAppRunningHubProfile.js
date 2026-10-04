import { getProviderConfig } from '../../../api/configApi.js';
import {
  RUNNINGHUB_INTERNATIONAL_PROFILE_ID,
  normalizeRunningHubModelApiProfileId,
} from '../runningHubProviderProfiles.js';
export function assertRunningHubDefinitionProfile(value, item) {
  let key;
  try {
    key = JSON['parse'](value);
  } catch {
    return;
  }
  if (key?.['providerProfileId'] && key['providerProfileId'] !== item)
    throw new Error('站点与已获取配置不一致，请在当前站点重新获取配置，或切回原站点');
}
export function getDefaultRunningHubProfileId() {
  return normalizeRunningHubModelApiProfileId(getProviderConfig('runninghubwf')?.['providerProfileId']);
}
export function getRunningHubProfileShortLabel(index) {
  return normalizeRunningHubModelApiProfileId(index) === RUNNINGHUB_INTERNATIONAL_PROFILE_ID
    ? '国际'
    : '国内';
}
export function syncRunningHubProfileBadge(el, result, enabled = !![]) {
  const el2 = el?.['querySelector']?.("[data-role='preview-runninghub-runtime-label']");
  if (!el2) return ![];
  return ((el2['hidden'] = !enabled), (el2['textContent'] = getRunningHubProfileShortLabel(result)), !![]);
}

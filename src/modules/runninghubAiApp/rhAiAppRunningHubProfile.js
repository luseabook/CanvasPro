import { getProviderConfig } from '../../../api/configApi.js';
import {
  RUNNINGHUB_INTERNATIONAL_PROFILE_ID,
  normalizeRunningHubModelApiProfileId,
} from '../runningHubProviderProfiles.js';
export function assertRunningHubDefinitionProfile(_0x4b0899, _0x1f3166) {
  let _0x1bcd6d;
  try {
    _0x1bcd6d = JSON['parse'](_0x4b0899);
  } catch {
    return;
  }
  if (_0x1bcd6d?.['providerProfileId'] && _0x1bcd6d['providerProfileId'] !== _0x1f3166)
    throw new Error('站点与已获取配置不一致，请在当前站点重新获取配置，或切回原站点');
}
export function getDefaultRunningHubProfileId() {
  return normalizeRunningHubModelApiProfileId(getProviderConfig('runninghubwf')?.['providerProfileId']);
}
export function getRunningHubProfileShortLabel(_0x34f30a) {
  return normalizeRunningHubModelApiProfileId(_0x34f30a) === RUNNINGHUB_INTERNATIONAL_PROFILE_ID
    ? '国际'
    : '国内';
}
export function syncRunningHubProfileBadge(_0xbf89ac, _0x233e24, _0x1136b3 = !![]) {
  const _0x4581b0 = _0xbf89ac?.['querySelector']?.("[data-role='preview-runninghub-runtime-label']");
  if (!_0x4581b0) return ![];
  return (
    (_0x4581b0['hidden'] = !_0x1136b3),
    (_0x4581b0['textContent'] = getRunningHubProfileShortLabel(_0x233e24)),
    !![]
  );
}

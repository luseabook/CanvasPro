import {
  buildModelProviderProfileSelectionPatch,
  getModelProviderProfileIds,
  getNextModelProviderProfileId,
  resolveReadyModelProviderProfileId,
  resolveModelProviderProfileId,
} from '../../modules/modelProviderProfileSelection.js';
import { getModelProviderProfile } from '../../modules/modelProviderProfiles.js';
import {
  RUNNINGHUB_DOMESTIC_PROFILE_ID,
  RUNNINGHUB_INTERNATIONAL_PROFILE_ID,
} from '../../modules/runningHubProviderProfiles.js';
import { API_CONFIG_CHANGED_EVENT } from '../../../api/configApi.js';
import {
  ensureModelGenerationReadiness,
  getModelGenerationReadiness,
} from '../../services/modelGenerationReadiness.js';
import { getModelManifest } from '../../manifests/index.js';
import { showProviderApiKeyMissingToast } from '../../modules/providerApiKeyMissingToast.js';
import { escapeNodeMenuHtml } from './nodeModelMenu.js';
export function getModelProviderProfileShortLabel(value) {
  const item = String(value || '')['trim'](),
    modelProviderProfile = getModelProviderProfile(item);
  return String(modelProviderProfile?.['shortLabel'] || '')['trim']() || item;
}
export function getModelProviderProfileStyleId(key) {
  const index = String(key || '')['trim'](),
    modelProviderProfile2 = getModelProviderProfile(index)?.['region'];
  if (modelProviderProfile2 === 'domestic') return RUNNINGHUB_DOMESTIC_PROFILE_ID;
  if (modelProviderProfile2 === 'international') return RUNNINGHUB_INTERNATIONAL_PROFILE_ID;
  return index;
}
export function buildModelProviderProfileBadgesHtml(result, { vip: vip = ![] } = {}) {
  const list = getModelProviderProfileIds(result);
  if (!list['length'] && !vip) return '';
  const data = list['map']((options) => {
      const modelProviderProfile3 = getModelProviderProfile(options),
        target = modelProviderProfile3?.['region']
          ? modelProviderProfile3['region'] === 'international'
          : options['endsWith']('-international'),
        source = target
          ? 'model-provider-profile-badge--international'
          : 'model-provider-profile-badge--domestic';
      return (
        '<span class="floating-menu-badge floating-menu-badge-inline model-provider-profile-badge ' +
        source +
        '">' +
        escapeNodeMenuHtml(getModelProviderProfileShortLabel(options)) +
        '</span>'
      );
    })['join'](''),
    next = vip
      ? '<span class="floating-menu-badge floating-menu-badge-inline floating-menu-badge-warning">VIP</span>'
      : '';
  return '<span class="model-provider-profile-badges">' + data + next + '</span>';
}
function getProviderProfileAdapterType(current) {
  return getModelManifest(current)?.['adapterType'] === 'workflow' ? 'workflow' : 'modelApi';
}
export function getModelProviderProfileReadiness(modelId, providerProfileId) {
  return getModelGenerationReadiness({
    modelId: modelId,
    providerProfileId: providerProfileId,
    adapterType: getProviderProfileAdapterType(modelId),
  });
}
function ensureProfileReadiness(modelId2, providerProfileId2) {
  return ensureModelGenerationReadiness({
    modelId: modelId2,
    providerProfileId: providerProfileId2,
    adapterType: getProviderProfileAdapterType(modelId2),
  });
}
function readinessToAvailability(response) {
  if (response?.['status'] === 'loading') return null;
  return response?.['ready'] === !![];
}
export function resolveConfiguredModelProviderProfileId(
  options2 = {},
  handler = getModelProviderProfileReadiness,
) {
  const modelProviderProfileId = resolveModelProviderProfileId(options2);
  return resolveReadyModelProviderProfileId(options2?.['model'], modelProviderProfileId, (entry) =>
    readinessToAvailability(handler(options2?.['model'], entry)),
  );
}
export function getProfileSwitchConfigurationMessage(record, payload = '') {
  const modelProviderProfile4 = getModelProviderProfile(record),
    handle =
      String(modelProviderProfile4?.['switchLabel'] || '')['trim']() ||
      getModelProviderProfileShortLabel(record) + '线路',
    providerProfileAdapterType =
      getProviderProfileAdapterType(payload) === 'workflow'
        ? '工作流 API Key'
        : String(modelProviderProfile4?.['credentialLabel'] || '模型 API Key')['trim'](),
    state = /^[A-Za-z]/['test'](providerProfileAdapterType) ? ' ' : '';
  return '切换到 ' + handle + '需配置' + state + providerProfileAdapterType;
}
function showProfileConfigurationRequired(fieldIds, providerId, model) {
  const keyType = getProviderProfileAdapterType(model);
  showProviderApiKeyMissingToast(getProfileSwitchConfigurationMessage(providerId, model), {
    providerId: providerId,
    fieldIds: fieldIds?.['fieldIds'],
    keyType: keyType === 'workflow' ? 'workflow' : 'modelApi',
    adapterType: keyType,
    model: model,
  });
}
export async function requestModelProviderProfileSelection({
  nodeData: nodeData = {},
  targetProfileId: targetProfileId,
  getProfileReadiness: getProfileReadiness = getModelProviderProfileReadiness,
  ensureProfileReady: ensureProfileReady = ensureProfileReadiness,
  onChange: onChange,
  onUnavailable: onUnavailable = showProfileConfigurationRequired,
} = {}) {
  const enabled = String(nodeData?.['model'] || '')['trim'](),
    enabled2 = String(targetProfileId || '')['trim']();
  if (!enabled || !enabled2) return { changed: ![], readiness: null };
  let readiness = getProfileReadiness(enabled, enabled2);
  readiness?.['status'] === 'loading' &&
    (readiness = await ensureProfileReady(enabled, enabled2)['catch'](() => readiness));
  if (!readiness?.['ready'])
    return (onUnavailable?.(readiness, enabled2, enabled), { changed: ![], readiness: readiness });
  const patch = buildModelProviderProfileSelectionPatch(nodeData, enabled, enabled2);
  return (onChange?.(patch), { changed: !![], readiness: readiness, patch: patch });
}
export function createModelProviderProfileControl({
  panel: panel,
  getNodeData: getNodeData,
  onChange: onChange2,
  getProfileReadiness: getProfileReadiness = getModelProviderProfileReadiness,
  ensureProfileReady: ensureProfileReady = ensureProfileReadiness,
  onUnavailable: onUnavailable = showProfileConfigurationRequired,
} = {}) {
  let el = null,
    el2 = null;
  const run = () => {
      if (!panel) return null;
      if (el?.['parentNode'] === panel) return el;
      const config = panel['querySelector']?.('.model-provider-profile-toggle');
      if (config) return ((el = config), el);
      const el3 = panel['ownerDocument']?.['createElement']?.('button');
      if (!el3) return null;
      return (
        (el3['type'] = 'button'),
        (el3['className'] = 'model-provider-profile-toggle'),
        el3['addEventListener']('pointerdown', (event) => {
          (event['preventDefault'](), event['stopPropagation']());
        }),
        el3['addEventListener']('click', (event2) => {
          (event2['preventDefault'](), event2['stopPropagation']());
          const nodeData2 = getNodeData?.() || {},
            targetProfileId2 = getNextModelProviderProfileId(nodeData2);
          if (!targetProfileId2) return;
          void requestModelProviderProfileSelection({
            nodeData: nodeData2,
            targetProfileId: targetProfileId2,
            getProfileReadiness: getProfileReadiness,
            ensureProfileReady: ensureProfileReady,
            onChange: onChange2,
            onUnavailable: onUnavailable,
          });
        }),
        panel['appendChild'](el3),
        (el = el3),
        el
      );
    },
    sync = () => {
      if (!panel) return;
      const args = getNodeData?.() || {},
        list2 = getModelProviderProfileIds(args?.['model']),
        enabled3 = list2['length'] > 1;
      panel['classList']?.['toggle']('has-model-provider-profile-toggle', enabled3);
      if (!enabled3) {
        el?.['classList']?.['add']('is-hidden');
        return;
      }
      const el4 = run();
      if (!el4) return;
      const modelProviderProfileId2 = resolveModelProviderProfileId(args),
        configuredModelProviderProfileId = resolveConfiguredModelProviderProfileId(args, getProfileReadiness);
      let scope = args;
      if (configuredModelProviderProfileId && configuredModelProviderProfileId !== modelProviderProfileId2) {
        const args2 = buildModelProviderProfileSelectionPatch(
          args,
          args?.['model'],
          configuredModelProviderProfileId,
        );
        (onChange2?.(args2), (scope = { ...args, ...args2 }));
      }
      const nextModelProviderProfileId = getNextModelProviderProfileId(scope),
        modelProviderProfileShortLabel = getModelProviderProfileShortLabel(configuredModelProviderProfileId),
        modelProviderProfileShortLabel2 = getModelProviderProfileShortLabel(nextModelProviderProfileId),
        profileReadiness = getProfileReadiness(scope?.['model'], nextModelProviderProfileId),
        availability = readinessToAvailability(profileReadiness) === ![];
      (el4['classList']['remove']('is-hidden'),
        (!el2 || el2['parentNode'] !== el4) &&
          ((el2 = panel['ownerDocument']['createElement']('span')),
          (el2['className'] = 'button-press-label'),
          (el4['textContent'] = ''),
          el4['appendChild'](el2)),
        (el2['textContent'] = modelProviderProfileShortLabel),
        (el4['dataset']['providerProfileId'] = getModelProviderProfileStyleId(
          configuredModelProviderProfileId,
        )),
        (el4['dataset']['providerProfileValue'] = configuredModelProviderProfileId),
        (el4['title'] = availability
          ? getProfileSwitchConfigurationMessage(nextModelProviderProfileId, scope?.['model'])
          : '当前' + modelProviderProfileShortLabel + '线路，点击切换到' + modelProviderProfileShortLabel2),
        el4['setAttribute']('aria-label', el4['title']));
    },
    remove = () => {
      (globalThis['window']?.['removeEventListener']?.(API_CONFIG_CHANGED_EVENT, sync),
        panel?.['classList']?.['remove']('has-model-provider-profile-toggle'),
        el?.['remove']?.(),
        (el = null),
        (el2 = null));
    };
  return (
    sync(),
    globalThis['window']?.['addEventListener']?.(API_CONFIG_CHANGED_EVENT, sync),
    { sync: sync, remove: remove }
  );
}

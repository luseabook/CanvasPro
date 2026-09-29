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
export function getModelProviderProfileShortLabel(_0x136c71) {
  const _0x52b88b = String(_0x136c71 || '')['trim'](),
    _0x436056 = getModelProviderProfile(_0x52b88b);
  return String(_0x436056?.['shortLabel'] || '')['trim']() || _0x52b88b;
}
export function getModelProviderProfileStyleId(_0x20f5bc) {
  const _0x4a11e7 = String(_0x20f5bc || '')['trim'](),
    _0x4f7935 = getModelProviderProfile(_0x4a11e7)?.['region'];
  if (_0x4f7935 === 'domestic') return RUNNINGHUB_DOMESTIC_PROFILE_ID;
  if (_0x4f7935 === 'international') return RUNNINGHUB_INTERNATIONAL_PROFILE_ID;
  return _0x4a11e7;
}
export function buildModelProviderProfileBadgesHtml(_0x1eeae, { vip: vip = ![] } = {}) {
  const _0x15d3be = getModelProviderProfileIds(_0x1eeae);
  if (!_0x15d3be['length'] && !vip) return '';
  const _0x16682e = _0x15d3be['map']((_0x21fcc1) => {
      const _0x4eaee9 = getModelProviderProfile(_0x21fcc1),
        _0xc697ba = _0x4eaee9?.['region']
          ? _0x4eaee9['region'] === 'international'
          : _0x21fcc1['endsWith']('-international'),
        _0x5642f9 = _0xc697ba
          ? 'model-provider-profile-badge--international'
          : 'model-provider-profile-badge--domestic';
      return (
        '<span\x20class=\x22floating-menu-badge\x20floating-menu-badge-inline\x20model-provider-profile-badge\x20' +
        _0x5642f9 +
        '\x22>' +
        escapeNodeMenuHtml(getModelProviderProfileShortLabel(_0x21fcc1)) +
        '</span>'
      );
    })['join'](''),
    _0x1344f1 = vip
      ? '<span class="floating-menu-badge floating-menu-badge-inline floating-menu-badge-warning">VIP</span>'
      : '';
  return '<span class="model-provider-profile-badges">' + _0x16682e + _0x1344f1 + '</span>';
}
function getProviderProfileAdapterType(_0x4c1526) {
  return getModelManifest(_0x4c1526)?.['adapterType'] === 'workflow' ? 'workflow' : 'modelApi';
}
export function getModelProviderProfileReadiness(_0x52d894, _0x2b5059) {
  return getModelGenerationReadiness({
    modelId: _0x52d894,
    providerProfileId: _0x2b5059,
    adapterType: getProviderProfileAdapterType(_0x52d894),
  });
}
function ensureProfileReadiness(_0x251617, _0x3bb7ec) {
  return ensureModelGenerationReadiness({
    modelId: _0x251617,
    providerProfileId: _0x3bb7ec,
    adapterType: getProviderProfileAdapterType(_0x251617),
  });
}
function readinessToAvailability(_0x353b70) {
  if (_0x353b70?.['status'] === 'loading') return null;
  return _0x353b70?.['ready'] === !![];
}
export function resolveConfiguredModelProviderProfileId(
  _0x19e189 = {},
  _0x8c670c = getModelProviderProfileReadiness,
) {
  const _0x1c4725 = resolveModelProviderProfileId(_0x19e189);
  return resolveReadyModelProviderProfileId(_0x19e189?.['model'], _0x1c4725, (_0x440682) =>
    readinessToAvailability(_0x8c670c(_0x19e189?.['model'], _0x440682)),
  );
}
export function getProfileSwitchConfigurationMessage(_0x4dc404, _0x355c5d = '') {
  const _0x3e758a = getModelProviderProfile(_0x4dc404),
    _0x2047f4 =
      String(_0x3e758a?.['switchLabel'] || '')['trim']() ||
      getModelProviderProfileShortLabel(_0x4dc404) + '线路',
    _0x5bc03f =
      getProviderProfileAdapterType(_0x355c5d) === 'workflow'
        ? '工作流 API Key'
        : String(_0x3e758a?.['credentialLabel'] || '模型 API Key')['trim'](),
    _0x6b610e = /^[A-Za-z]/['test'](_0x5bc03f) ? '\x20' : '';
  return '切换到 ' + _0x2047f4 + '需配置' + _0x6b610e + _0x5bc03f;
}
function showProfileConfigurationRequired(_0x335fd0, _0x3da651, _0x1db853) {
  const _0x3298d4 = getProviderProfileAdapterType(_0x1db853);
  showProviderApiKeyMissingToast(getProfileSwitchConfigurationMessage(_0x3da651, _0x1db853), {
    providerId: _0x3da651,
    fieldIds: _0x335fd0?.['fieldIds'],
    keyType: _0x3298d4 === 'workflow' ? 'workflow' : 'modelApi',
    adapterType: _0x3298d4,
    model: _0x1db853,
  });
}
export async function requestModelProviderProfileSelection({
  nodeData: nodeData = {},
  targetProfileId: _0x3bf34a,
  getProfileReadiness: getProfileReadiness = getModelProviderProfileReadiness,
  ensureProfileReady: ensureProfileReady = ensureProfileReadiness,
  onChange: _0x21961c,
  onUnavailable: onUnavailable = showProfileConfigurationRequired,
} = {}) {
  const _0x451d6c = String(nodeData?.['model'] || '')['trim'](),
    _0x33380c = String(_0x3bf34a || '')['trim']();
  if (!_0x451d6c || !_0x33380c) return { changed: ![], readiness: null };
  let _0x1f547f = getProfileReadiness(_0x451d6c, _0x33380c);
  _0x1f547f?.['status'] === 'loading' &&
    (_0x1f547f = await ensureProfileReady(_0x451d6c, _0x33380c)['catch'](() => _0x1f547f));
  if (!_0x1f547f?.['ready'])
    return (onUnavailable?.(_0x1f547f, _0x33380c, _0x451d6c), { changed: ![], readiness: _0x1f547f });
  const _0x114070 = buildModelProviderProfileSelectionPatch(nodeData, _0x451d6c, _0x33380c);
  return (_0x21961c?.(_0x114070), { changed: !![], readiness: _0x1f547f, patch: _0x114070 });
}
export function createModelProviderProfileControl({
  panel: _0x4eee60,
  getNodeData: _0x3e9993,
  onChange: _0xab0754,
  getProfileReadiness: getProfileReadiness = getModelProviderProfileReadiness,
  ensureProfileReady: ensureProfileReady = ensureProfileReadiness,
  onUnavailable: onUnavailable = showProfileConfigurationRequired,
} = {}) {
  let _0x2b1158 = null,
    _0x5c40b1 = null;
  const _0x17b204 = () => {
      if (!_0x4eee60) return null;
      if (_0x2b1158?.['parentNode'] === _0x4eee60) return _0x2b1158;
      const _0x46dd90 = _0x4eee60['querySelector']?.('.model-provider-profile-toggle');
      if (_0x46dd90) return ((_0x2b1158 = _0x46dd90), _0x2b1158);
      const _0x3242b1 = _0x4eee60['ownerDocument']?.['createElement']?.('button');
      if (!_0x3242b1) return null;
      return (
        (_0x3242b1['type'] = 'button'),
        (_0x3242b1['className'] = 'model-provider-profile-toggle'),
        _0x3242b1['addEventListener']('pointerdown', (_0x461f79) => {
          (_0x461f79['preventDefault'](), _0x461f79['stopPropagation']());
        }),
        _0x3242b1['addEventListener']('click', (_0x82572) => {
          (_0x82572['preventDefault'](), _0x82572['stopPropagation']());
          const _0x79b291 = _0x3e9993?.() || {},
            _0x5f0492 = getNextModelProviderProfileId(_0x79b291);
          if (!_0x5f0492) return;
          void requestModelProviderProfileSelection({
            nodeData: _0x79b291,
            targetProfileId: _0x5f0492,
            getProfileReadiness: getProfileReadiness,
            ensureProfileReady: ensureProfileReady,
            onChange: _0xab0754,
            onUnavailable: onUnavailable,
          });
        }),
        _0x4eee60['appendChild'](_0x3242b1),
        (_0x2b1158 = _0x3242b1),
        _0x2b1158
      );
    },
    _0x4915a4 = () => {
      if (!_0x4eee60) return;
      const _0x762804 = _0x3e9993?.() || {},
        _0x2f7a9c = getModelProviderProfileIds(_0x762804?.['model']),
        _0x11e6ec = _0x2f7a9c['length'] > 0x1;
      _0x4eee60['classList']?.['toggle']('has-model-provider-profile-toggle', _0x11e6ec);
      if (!_0x11e6ec) {
        _0x2b1158?.['classList']?.['add']('is-hidden');
        return;
      }
      const _0x77fd68 = _0x17b204();
      if (!_0x77fd68) return;
      const _0x2863a2 = resolveModelProviderProfileId(_0x762804),
        _0x4ae7aa = resolveConfiguredModelProviderProfileId(_0x762804, getProfileReadiness);
      let _0x59b888 = _0x762804;
      if (_0x4ae7aa && _0x4ae7aa !== _0x2863a2) {
        const _0x1c3ee5 = buildModelProviderProfileSelectionPatch(_0x762804, _0x762804?.['model'], _0x4ae7aa);
        (_0xab0754?.(_0x1c3ee5), (_0x59b888 = { ..._0x762804, ..._0x1c3ee5 }));
      }
      const _0x2d0ac2 = getNextModelProviderProfileId(_0x59b888),
        _0x436d7e = getModelProviderProfileShortLabel(_0x4ae7aa),
        _0x487704 = getModelProviderProfileShortLabel(_0x2d0ac2),
        _0x586cfa = getProfileReadiness(_0x59b888?.['model'], _0x2d0ac2),
        _0x529e3a = readinessToAvailability(_0x586cfa) === ![];
      (_0x77fd68['classList']['remove']('is-hidden'),
        (!_0x5c40b1 || _0x5c40b1['parentNode'] !== _0x77fd68) &&
          ((_0x5c40b1 = _0x4eee60['ownerDocument']['createElement']('span')),
          (_0x5c40b1['className'] = 'button-press-label'),
          (_0x77fd68['textContent'] = ''),
          _0x77fd68['appendChild'](_0x5c40b1)),
        (_0x5c40b1['textContent'] = _0x436d7e),
        (_0x77fd68['dataset']['providerProfileId'] = getModelProviderProfileStyleId(_0x4ae7aa)),
        (_0x77fd68['dataset']['providerProfileValue'] = _0x4ae7aa),
        (_0x77fd68['title'] = _0x529e3a
          ? getProfileSwitchConfigurationMessage(_0x2d0ac2, _0x59b888?.['model'])
          : '当前' + _0x436d7e + '线路，点击切换到' + _0x487704),
        _0x77fd68['setAttribute']('aria-label', _0x77fd68['title']));
    },
    _0x155d6d = () => {
      (globalThis['window']?.['removeEventListener']?.(API_CONFIG_CHANGED_EVENT, _0x4915a4),
        _0x4eee60?.['classList']?.['remove']('has-model-provider-profile-toggle'),
        _0x2b1158?.['remove']?.(),
        (_0x2b1158 = null),
        (_0x5c40b1 = null));
    };
  return (
    _0x4915a4(),
    globalThis['window']?.['addEventListener']?.(API_CONFIG_CHANGED_EVENT, _0x4915a4),
    { sync: _0x4915a4, remove: _0x155d6d }
  );
}

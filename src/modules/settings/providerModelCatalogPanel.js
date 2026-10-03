import { t } from '../../i18n/index.js';
import { getModelManifest } from '../../manifests/index.js';
import {
  PROVIDER_MODEL_KINDS,
  getProviderModelCatalogOwnerProviderId,
  readProviderModelCatalog,
} from './providerModelCatalog.js';

const PANEL_ID_PREFIX = 'providerModels-';
const KIND_LABEL_KEY = Object.freeze({
  text: 'settings.apiInput.models.text',
  image: 'settings.apiInput.models.image',
  video: 'settings.apiInput.models.video',
});

function tr(_0x21f7c9, _0x1a0d05 = {}) {
  let _0x4d0a9e = t(_0x21f7c9);
  for (const [_0x4a1f8d, _0x29f0b9] of Object.entries(_0x1a0d05 || {}))
    _0x4d0a9e = _0x4d0a9e.split('{' + _0x4a1f8d + '}').join(String(_0x29f0b9 ?? ''));
  return _0x4d0a9e;
}

function escapeHtml(_0x2b6f1a) {
  return String(_0x2b6f1a ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resolveProviderModelAppModelId(_0x3f2a1c, _0x4c8b9e) {
  return getProviderModelCatalogOwnerProviderId(_0x3f2a1c) + '/' + String(_0x4c8b9e || '').trim();
}

/**
 * 三种状态：
 *   builtin —— 软件内置的模型，始终可用，行被锁定；
 *   dynamic —— 由这份清单动态登记进来的模型，已可用但可以取消勾选；
 *   none    —— 还没接入，勾选后保存即登记。
 */
export function getProviderModelRowState(_0x1a2c3f, _0x45d0a1) {
  const _0x53c1c6 = getModelManifest(resolveProviderModelAppModelId(_0x1a2c3f, _0x45d0a1));
  if (!_0x53c1c6) return 'none';
  return _0x53c1c6.extensions?.providerModelCatalog ? 'dynamic' : 'builtin';
}

export function isProviderModelIntegrated(_0x1a2c3f, _0x45d0a1) {
  return getProviderModelRowState(_0x1a2c3f, _0x45d0a1) !== 'none';
}

export function getProviderModelCatalogPanelId(_0x123456) {
  return PANEL_ID_PREFIX + _0x123456;
}

export function renderProviderModelCatalogPanel({
  documentObject: documentObject = globalThis.document,
  providerId: _0x30e5a1,
  catalog: _0x392b1d,
  statusText: statusText = '',
  message: _0x1a0c4f = '',
  messageKind: _0x242cb4 = 'info',
} = {}) {
  const _0x4c1d5f = documentObject?.getElementById?.(getProviderModelCatalogPanelId(_0x30e5a1));
  if (!_0x4c1d5f) return null;
  const { models: _0x2a0d0c } = readProviderModelCatalog({ modelCatalog: _0x392b1d });
  if (_0x2a0d0c.length === 0 && !_0x1a0c4f) {
    (_0x4c1d5f.classList?.remove?.('is-active'), (_0x4c1d5f.hidden = true), (_0x4c1d5f.innerHTML = ''));
    return null;
  }
  const _0x3e4f07 = _0x2a0d0c
    .map((_0x10f2a2) => {
      const _0x4f2b91 = getProviderModelRowState(_0x30e5a1, _0x10f2a2.id),
        _0x3a0c9b = _0x4f2b91 !== 'none',
        _0x5e7a3d = _0x4f2b91 === 'builtin',
        _0x437f0f = escapeHtml(_0x10f2a2.id);
      return [
        '<label class="settings-provider-model-row' + (_0x3a0c9b ? ' is-integrated' : '') + '">',
        '<input type="checkbox" data-provider-model-id="' + _0x437f0f + '"' +
          (_0x5e7a3d || _0x10f2a2.enabled ? ' checked' : '') +
          (_0x5e7a3d ? ' disabled' : '') + ' />',
        '<span class="settings-provider-model-name">' + _0x437f0f + '</span>',
        '<span class="settings-provider-model-tag' + (_0x3a0c9b ? ' is-integrated' : '') + '">' +
          escapeHtml(tr(_0x3a0c9b ? 'settings.apiInput.models.matched' : 'settings.apiInput.models.unmatched')) +
          '</span>',
        _0x4f2b91 === 'none'
          ? '<select class="settings-provider-model-kind" data-provider-model-kind="' +
            _0x437f0f +
            '" aria-label="' +
            _0x437f0f +
            '">' +
            PROVIDER_MODEL_KINDS.map(
              (_0x2d1d60) =>
                '<option value="' +
                _0x2d1d60 +
                '"' +
                (_0x10f2a2.kind === _0x2d1d60 ? ' selected' : '') +
                '>' +
                escapeHtml(tr(KIND_LABEL_KEY[_0x2d1d60])) +
                '</option>',
            ).join('') +
            '</select>'
          : '',
        '</label>',
      ].join('');
    })
    .join('');
  _0x4c1d5f.innerHTML =
    '<div class="settings-provider-models-head">' +
    '<span class="settings-provider-models-title">' +
    escapeHtml(tr('settings.apiInput.models.selectHint')) +
    '</span>' +
    '<span class="settings-provider-models-status">' +
    escapeHtml(statusText) +
    '</span>' +
    '<button type="button" class="settings-provider-models-save" data-provider-model-save="' +
    escapeHtml(_0x30e5a1) +
    '">' +
    escapeHtml(tr('settings.apiInput.models.save')) +
    '</button>' +
    '</div>' +
    (_0x1a0c4f
      ? '<div class="settings-provider-models-message is-' + _0x242cb4 + '">' + escapeHtml(_0x1a0c4f) + '</div>'
      : '') +
    '<div class="settings-provider-models-list">' +
    _0x3e4f07 +
    '</div>';
  ((_0x4c1d5f.hidden = false), _0x4c1d5f.classList?.add?.('is-active'));
  return _0x4c1d5f;
}

export function readProviderModelCatalogSelection(_0x3594a7, _0x4f0d69) {
  const _0x2b5da0 = _0x3594a7?.getElementById?.(getProviderModelCatalogPanelId(_0x4f0d69));
  if (!_0x2b5da0) return [];
  const _0x5c7b1c = new Map();
  _0x2b5da0.querySelectorAll?.('[data-provider-model-id]')?.forEach?.((_0x2f5a1a) => {
    const _0x1d3d70 = String(_0x2f5a1a?.dataset?.providerModelId || '').trim();
    if (_0x1d3d70) _0x5c7b1c.set(_0x1d3d70, _0x2f5a1a.checked === true);
  });
  const _0x4e1e0d = new Map();
  _0x2b5da0.querySelectorAll?.('[data-provider-model-kind]')?.forEach?.((_0x2d5b6b) => {
    const _0x5a3d3d = String(_0x2d5b6b?.dataset?.providerModelKind || '').trim(),
      _0x3c0cbe = String(_0x2d5b6b?.value || '').trim();
    if (_0x5a3d3d && PROVIDER_MODEL_KINDS.includes(_0x3c0cbe)) _0x4e1e0d.set(_0x5a3d3d, _0x3c0cbe);
  });
  return [..._0x5c7b1c.entries()].map(([_0x33e13d, _0x361d95]) => ({
    id: _0x33e13d,
    kind: _0x4e1e0d.get(_0x33e13d) || '',
    enabled: _0x361d95 || getProviderModelRowState(_0x4f0d69, _0x33e13d) === 'builtin',
  }));
}

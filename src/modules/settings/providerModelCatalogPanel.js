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

function tr(value, item = {}) {
  let t2 = t(value);
  for (const [key, index] of Object.entries(item || {}))
    t2 = t2.split('{' + key + '}').join(String(index ?? ''));
  return t2;
}

function escapeHtml(result) {
  return String(result ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resolveProviderModelAppModelId(data, options) {
  return getProviderModelCatalogOwnerProviderId(data) + '/' + String(options || '').trim();
}

/**
 * 三种状态：
 *   builtin —— 软件内置的模型，始终可用，行被锁定；
 *   dynamic —— 由这份清单动态登记进来的模型，已可用但可以取消勾选；
 *   none    —— 还没接入，勾选后保存即登记。
 */
export function getProviderModelRowState(target, source) {
  const modelManifest = getModelManifest(resolveProviderModelAppModelId(target, source));
  if (!modelManifest) return 'none';
  return modelManifest.extensions?.providerModelCatalog ? 'dynamic' : 'builtin';
}

export function isProviderModelIntegrated(target, source) {
  return getProviderModelRowState(target, source) !== 'none';
}

export function getProviderModelCatalogPanelId(next) {
  return PANEL_ID_PREFIX + next;
}

export function renderProviderModelCatalogPanel({
  documentObject: documentObject = globalThis.document,
  providerId: providerId,
  catalog: catalog,
  statusText: statusText = '',
  message: message = '',
  messageKind: messageKind = 'info',
} = {}) {
  const el = documentObject?.getElementById?.(getProviderModelCatalogPanelId(providerId));
  if (!el) return null;
  const { models: models } = readProviderModelCatalog({ modelCatalog: catalog });
  if (models.length === 0 && !message) {
    (el.classList?.remove?.('is-active'), (el.hidden = true), (el.innerHTML = ''));
    return null;
  }
  const current = models
    .map((item2) => {
      const providerModelRowState = getProviderModelRowState(providerId, item2.id),
        entry = providerModelRowState !== 'none',
        record = providerModelRowState === 'builtin',
        escapeHtml2 = escapeHtml(item2.id);
      return [
        '<label class="settings-provider-model-row' + (entry ? ' is-integrated' : '') + '">',
        '<input type="checkbox" data-provider-model-id="' +
          escapeHtml2 +
          '"' +
          (record || item2.enabled ? ' checked' : '') +
          (record ? ' disabled' : '') +
          ' />',
        '<span class="settings-provider-model-name">' + escapeHtml2 + '</span>',
        '<span class="settings-provider-model-tag' +
          (entry ? ' is-integrated' : '') +
          '">' +
          escapeHtml(tr(entry ? 'settings.apiInput.models.matched' : 'settings.apiInput.models.unmatched')) +
          '</span>',
        providerModelRowState === 'none'
          ? '<select class="settings-provider-model-kind" data-provider-model-kind="' +
            escapeHtml2 +
            '" aria-label="' +
            escapeHtml2 +
            '">' +
            PROVIDER_MODEL_KINDS.map(
              (item3) =>
                '<option value="' +
                item3 +
                '"' +
                (item2.kind === item3 ? ' selected' : '') +
                '>' +
                escapeHtml(tr(KIND_LABEL_KEY[item3])) +
                '</option>',
            ).join('') +
            '</select>'
          : '',
        '</label>',
      ].join('');
    })
    .join('');
  el.innerHTML =
    '<div class="settings-provider-models-head">' +
    '<span class="settings-provider-models-title">' +
    escapeHtml(tr('settings.apiInput.models.selectHint')) +
    '</span>' +
    '<span class="settings-provider-models-status">' +
    escapeHtml(statusText) +
    '</span>' +
    '<button type="button" class="settings-provider-models-save" data-provider-model-save="' +
    escapeHtml(providerId) +
    '">' +
    escapeHtml(tr('settings.apiInput.models.save')) +
    '</button>' +
    '</div>' +
    (message
      ? '<div class="settings-provider-models-message is-' +
        messageKind +
        '">' +
        escapeHtml(message) +
        '</div>'
      : '') +
    '<div class="settings-provider-models-list">' +
    current +
    '</div>';
  ((el.hidden = false), el.classList?.add?.('is-active'));
  return el;
}

export function readProviderModelCatalogSelection(payload, handle) {
  const el2 = payload?.getElementById?.(getProviderModelCatalogPanelId(handle));
  if (!el2) return [];
  const map = new Map();
  el2.querySelectorAll?.('[data-provider-model-id]')?.forEach?.((el3) => {
    const state = String(el3?.dataset?.providerModelId || '').trim();
    if (state) map.set(state, el3.checked === true);
  });
  const kind = new Map();
  el2.querySelectorAll?.('[data-provider-model-kind]')?.forEach?.((el4) => {
    const config = String(el4?.dataset?.providerModelKind || '').trim(),
      scope = String(el4?.value || '').trim();
    if (config && PROVIDER_MODEL_KINDS.includes(scope)) kind.set(config, scope);
  });
  return [...map.entries()].map(([id, enabled]) => ({
    id: id,
    kind: kind.get(id) || '',
    enabled: enabled || getProviderModelRowState(handle, id) === 'builtin',
  }));
}

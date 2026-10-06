import { API_CONFIG_CHANGED_EVENT, ensureConfig, isApiConfigLoaded } from '../../api/configApi.js';
import { CLI_PROVIDER_STATUS_CHANGED_EVENT } from '../../api/cliProviderApi.js';
import { DREAMINA_CLI_STATUS_CHANGED_EVENT } from '../../api/dreaminaCliApi.js';
import {
  ensureModelGenerationReadiness,
  getModelGenerationReadiness,
} from '../services/modelGenerationReadiness.js';
import {
  getModelProviderProfileIds,
  resolveReadyModelProviderProfileId,
} from './modelProviderProfileSelection.js';
import { t } from '../i18n/index.js';
import { showCliLoginMissingToast } from './cliLoginMissingToast.js';
import { showProviderApiKeyMissingToast } from './providerApiKeyMissingToast.js';
import {
  MODEL_MENU_PREFERENCE_CHANGED_EVENT,
  modelMenuPreferenceStore,
} from '../core/stores/modelMenuPreferenceStore.js';
import { syncModelMenuVisibility } from './modelMenuVisibility.js';
import { syncModelMenuPrices } from '../components/shared/modelMenuPricing.js';
const CREDENTIAL_BUTTON_CLASS = 'is-credential-required',
  CREDENTIAL_BADGE_SELECTOR = '[data-model-credential-badge]',
  CREDENTIAL_MENU_ITEM_SELECTOR = ['.node-menu-item[data-value]', '.node-menu-item[data-credential-model]'].join(', '),
  CREDENTIAL_STATUS_EVENTS = Object.freeze([
    API_CONFIG_CHANGED_EVENT,
    CLI_PROVIDER_STATUS_CHANGED_EVENT,
    DREAMINA_CLI_STATUS_CHANGED_EVENT,
    MODEL_MENU_PREFERENCE_CHANGED_EVENT,
  ]),
  CREDENTIAL_STATUS_SUBSCRIPTIONS = new WeakMap(),
  CREDENTIAL_STATUS_REVISIONS = new WeakMap(),
  MODEL_CREDENTIAL_MENU_SYNC_STATES = new WeakMap(),
  MODEL_CREDENTIAL_ITEM_SYNC_STATES = new WeakMap();
function getCredentialStatusRevision(el = globalThis.window) {
  if (!el?.addEventListener) return null;
  let enabled = CREDENTIAL_STATUS_REVISIONS.get(el);
  if (!enabled) {
    enabled = { revision: 0 };
    const value = () => {
      enabled.revision += 1;
    };
    (CREDENTIAL_STATUS_EVENTS.forEach((item) => {
      el.addEventListener(item, value, true);
    }),
      CREDENTIAL_STATUS_REVISIONS.set(el, enabled));
  }
  return enabled.revision;
}
function bindModelCredentialStatusEvents(key, el2 = globalThis.window) {
  if (typeof key !== 'function' || !el2?.addEventListener) return () => {};
  let store = CREDENTIAL_STATUS_SUBSCRIPTIONS.get(el2);
  if (!store) {
    const listeners = new Set(),
      dispatch = (index) => {
        [...listeners].forEach((handler) => handler(index));
      };
    ((store = { dispatch: dispatch, listeners: listeners }),
      CREDENTIAL_STATUS_SUBSCRIPTIONS.set(el2, store),
      CREDENTIAL_STATUS_EVENTS.forEach((result) => {
        el2.addEventListener(result, dispatch);
      }));
  }
  store.listeners.add(key);
  let enabled2 = true;
  return () => {
    if (!enabled2) return;
    ((enabled2 = false), store.listeners.delete(key));
    if (store.listeners.size > 0) return;
    (CREDENTIAL_STATUS_EVENTS.forEach((data) => {
      el2.removeEventListener?.(data, store.dispatch);
    }),
      CREDENTIAL_STATUS_SUBSCRIPTIONS.delete(el2));
  };
}
function getMenuItemCredentialContext(el3) {
  return {
    modelId: String(el3?.dataset?.credentialModel || el3?.dataset?.value || '').trim(),
    providerId: String(el3?.dataset?.provider || '').trim(),
  };
}
function showMissingCredential(providerId) {
  if (!providerId || providerId.status !== 'missing') return false;
  if (providerId.requirementType === 'cliLogin')
    return (
      showCliLoginMissingToast(providerId.message, {
        providerId: providerId.cliProviderId,
        fieldIds: providerId.fieldIds,
      }),
      true
    );
  return (
    showProviderApiKeyMissingToast(providerId.message, {
      providerId: providerId.configProviderId || providerId.providerId,
      fieldIds: providerId.fieldIds,
      keyType: providerId.keyType,
      adapterType: providerId.adapterType,
      model: providerId.modelId,
    }),
    true
  );
}
export function guardModelGenerationCredentials(options = {}) {
  let response = getModelGenerationReadiness(options);
  if (response.status === 'loading' && options.waitForConfig === true)
    return ensureModelGenerationReadiness(options).then((target) => {
      if (target.ready) return target;
      return (showMissingCredential(target), target);
    });
  if (response.status === 'loading')
    return { ...response, ready: true, status: 'deferred', reason: 'runtime-check-pending' };
  if (response.ready) return response;
  return (showMissingCredential(response), response);
}
export function resetModelCredentialButtonState(el4) {
  if (!el4) return;
  const source = el4.dataset || {};
  (el4.classList?.remove(CREDENTIAL_BUTTON_CLASS),
    source.credentialUiApplied === 'true' &&
      (source.credentialHadTitle === 'true'
        ? el4.setAttribute?.('title', source.credentialOriginalTitle || '')
        : el4.removeAttribute?.('title'),
      source.credentialHadAriaLabel === 'true'
        ? el4.setAttribute?.('aria-label', source.credentialOriginalAriaLabel || '')
        : el4.removeAttribute?.('aria-label'),
      el4.style && (el4.style.cursor = source.credentialOriginalCursor || '')),
    delete source.credentialProvider,
    delete source.credentialField,
    delete source.credentialUiApplied,
    delete source.credentialHadTitle,
    delete source.credentialOriginalTitle,
    delete source.credentialHadAriaLabel,
    delete source.credentialOriginalAriaLabel,
    delete source.credentialOriginalCursor);
}
export function applyModelCredentialButtonState(el5, next = {}) {
  if (!el5) return null;
  const error = getModelGenerationReadiness(next);
  resetModelCredentialButtonState(el5);
  if (error.status !== 'missing') return error;
  const current = el5.dataset || {};
  return (
    (current.credentialUiApplied = 'true'),
    (current.credentialHadTitle = String(el5.hasAttribute?.('title'))),
    (current.credentialOriginalTitle = el5.getAttribute?.('title') || ''),
    (current.credentialHadAriaLabel = String(el5.hasAttribute?.('aria-label'))),
    (current.credentialOriginalAriaLabel = el5.getAttribute?.('aria-label') || ''),
    (current.credentialOriginalCursor = el5.style?.cursor || ''),
    el5.classList?.add(CREDENTIAL_BUTTON_CLASS),
    (current.credentialProvider = error.configProviderId || error.providerId),
    (current.credentialField = error.credentialField),
    (el5.disabled = false),
    (el5.title = error.message),
    el5.setAttribute?.('aria-label', error.message),
    (el5.style.cursor = 'var(--link-cursor)'),
    error
  );
}
export function bindModelCredentialButtonState(el6, entry = {}) {
  if (!el6) return () => {};
  const run =
      typeof entry.getCredentialOptions === 'function'
        ? entry.getCredentialOptions
        : () => entry.credentialOptions || {},
    handler2 = () => {
      if (el6.isConnected === false) return null;
      if (typeof entry.onRefresh === 'function') return entry.onRefresh(el6);
      const enabled3 = run();
      if (!enabled3) return (resetModelCredentialButtonState(el6), null);
      return applyModelCredentialButtonState(el6, enabled3);
    },
    bindModelCredentialStatusEvents2 = bindModelCredentialStatusEvents(
      handler2,
      entry.windowObject || globalThis.window,
    );
  if (entry.syncOnBind !== false) handler2();
  return bindModelCredentialStatusEvents2;
}
function clearMenuItemCredentialState(el7) {
  (el7.classList?.remove('needs-model-credential'),
    el7.classList?.remove('needs-model-api-authorization'));
  if (el7.dataset.credentialHadTitle === 'true')
    el7.setAttribute?.('title', el7.dataset.credentialOriginalTitle || '');
  else el7.dataset.credentialStateApplied === 'true' && el7.removeAttribute?.('title');
  (delete el7.dataset.credentialMissing,
    delete el7.dataset.credentialProvider,
    delete el7.dataset.credentialField,
    delete el7.dataset.credentialKeyType,
    delete el7.dataset.credentialFieldIds,
    delete el7.dataset.credentialMessage,
    delete el7.dataset.credentialResolvedProviderProfileId,
    delete el7.dataset.credentialStateApplied,
    delete el7.dataset.credentialHadTitle,
    delete el7.dataset.credentialOriginalTitle,
    el7.querySelector?.(CREDENTIAL_BADGE_SELECTOR)?.remove?.());
}
function markMenuItemCredentialMissing(el8, error2, el9) {
  ((el8.dataset.credentialStateApplied = 'true'),
    (el8.dataset.credentialHadTitle = String(el8.hasAttribute?.('title'))),
    (el8.dataset.credentialOriginalTitle = el8.getAttribute?.('title') || ''),
    el8.classList?.add('needs-model-credential'));
  const record = error2.requirementType !== 'cliLogin';
  record && el8.classList?.add('needs-model-api-authorization');
  ((el8.dataset.credentialMissing = 'true'),
    (el8.dataset.credentialProvider = error2.configProviderId || error2.providerId),
    (el8.dataset.credentialField = error2.credentialField),
    (el8.dataset.credentialKeyType = error2.keyType || ''),
    (el8.dataset.credentialFieldIds = JSON.stringify(error2.fieldIds || [])),
    (el8.dataset.credentialMessage = error2.message),
    el8.setAttribute?.('title', error2.message));
  const el10 = el9?.createElement?.('span');
  if (!el10) return;
  ((el10.className = 'floating-menu-badge floating-menu-badge-warning model-credential-badge'),
    (el10.dataset.modelCredentialBadge = 'true'),
    (el10.textContent = t('settings.apiInput.readiness.requiredShort')),
    el8.appendChild?.(el10));
}
function getMenuItemCredentialStateSignature(error3, payload) {
  return JSON.stringify([
    payload || '',
    error3?.status || '',
    error3?.reason || '',
    error3?.requirementType || '',
    error3?.configProviderId || error3?.providerId || '',
    error3?.credentialField || '',
    error3?.keyType || '',
    error3?.fieldIds || [],
    error3?.message || '',
    t('settings.apiInput.readiness.requiredShort'),
  ]);
}
function hasExpectedMenuItemCredentialState(el11, response2) {
  const handle = response2?.status === 'missing',
    enabled4 = el11.classList?.contains?.('needs-model-credential') === true,
    enabled5 = Boolean(el11.querySelector?.(CREDENTIAL_BADGE_SELECTOR));
  return handle ? enabled4 && enabled5 : !enabled4 && !enabled5;
}
function applyMenuItemCredentialState(el12, response3, state, config) {
  const menuItemCredentialStateSignature = getMenuItemCredentialStateSignature(response3, state);
  if (
    MODEL_CREDENTIAL_ITEM_SYNC_STATES.get(el12) === menuItemCredentialStateSignature &&
    hasExpectedMenuItemCredentialState(el12, response3)
  )
    return;
  (clearMenuItemCredentialState(el12),
    state && (el12.dataset.credentialResolvedProviderProfileId = state),
    response3?.status === 'missing' && markMenuItemCredentialMissing(el12, response3, config),
    MODEL_CREDENTIAL_ITEM_SYNC_STATES.set(el12, menuItemCredentialStateSignature));
}
function getMenuItemProviderProfileId(item2, scope, modelId, providerId2, input) {
  const output =
      input !== undefined
        ? input
        : scope.getProviderProfileId?.({ item: item2, modelId: modelId, providerId: providerId2 }),
    value2 = output || item2.dataset?.providerProfileId || '',
    list = getModelProviderProfileIds(modelId);
  if (list.length === 0) return value2;
  if (list.length === 1) return list[0];
  return resolveReadyModelProviderProfileId(modelId, value2, (providerProfileId) => {
    const response4 = getModelGenerationReadiness({
      modelId: modelId,
      provider: providerId2,
      providerProfileId: providerProfileId,
    });
    if (response4.status === 'loading') return null;
    return response4.ready;
  });
}
function getMenuCredentialSyncDescriptor(el13, value3) {
  const items = [...el13.querySelectorAll(CREDENTIAL_MENU_ITEM_SELECTOR)],
    value4 = value3.windowObject || globalThis.window,
    credentialStatusRevision = getCredentialStatusRevision(value4);
  if (credentialStatusRevision === null) return { cacheKey: null, items: items };
  const list2 = value3.getProviderProfileId;
  if (
    typeof list2 === 'function' &&
    list2.length > 0 &&
    typeof value3.getCredentialSyncKey !== 'function'
  )
    return { cacheKey: null, items: items };
  let value5 = '',
    sharedProviderProfileId;
  try {
    const value6 = list2?.();
    ((value5 = String(value6 || '')),
      (typeof list2 !== 'function' || list2.length === 0) && (sharedProviderProfileId = value5));
  } catch {
    return { cacheKey: null, items: items };
  }
  const value7 = String(value3.getCredentialSyncKey?.() || ''),
    value8 = items.map((el14) =>
      [
        el14.dataset?.credentialModel || '',
        el14.dataset?.value || '',
        el14.dataset?.provider || '',
        el14.dataset?.providerProfileId || '',
      ].join('\x1f'),
    ).join('\x1e'),
    t2 = t('settings.apiInput.readiness.requiredShort');
  return {
    cacheKey: [
      credentialStatusRevision,
      value5,
      value7,
      t2,
      value8,
      modelMenuPreferenceStore.getState().hideUnconfigured,
    ].join('\x1d'),
    items: items,
    sharedProviderProfileId: sharedProviderProfileId,
  };
}
function isSameMenuCredentialSync(value9, value10) {
  return Boolean(
    value9 &&
    value9.cacheKey === value10.cacheKey &&
    value9.items.length === value10.items.length &&
    value10.items.every((value11, value12) => value9.items[value12] === value11),
  );
}
export function syncModelCredentialMenu(el15, value13 = {}) {
  if (!el15?.querySelectorAll) return;
  const run2 = () => {
    const value14 = value13.documentObject || globalThis.document,
      cacheKey = getMenuCredentialSyncDescriptor(el15, value13);
    syncModelMenuPrices(el15, cacheKey.items);
    const value15 = MODEL_CREDENTIAL_MENU_SYNC_STATES.get(el15);
    if (cacheKey.cacheKey !== null && isSameMenuCredentialSync(value15, cacheKey))
      return value15.promise;
    const value16 = { cacheKey: cacheKey.cacheKey, items: cacheKey.items, promise: null };
    cacheKey.cacheKey !== null
      ? MODEL_CREDENTIAL_MENU_SYNC_STATES.set(el15, value16)
      : MODEL_CREDENTIAL_MENU_SYNC_STATES.delete(el15);
    const run3 = () =>
      cacheKey.cacheKey === null || MODEL_CREDENTIAL_MENU_SYNC_STATES.get(el15) === value16;
    return (
      (value16.promise = Promise.resolve()
        .then(() =>
          Promise.all(
            cacheKey.items.map(async (value17) => {
              if (!run3()) return;
              const { modelId: modelId2, providerId: providerId3 } = getMenuItemCredentialContext(value17),
                value18 = {
                  modelId: modelId2,
                  provider: providerId3,
                  providerProfileId: getMenuItemProviderProfileId(
                    value17,
                    value13,
                    modelId2,
                    providerId3,
                    cacheKey.sharedProviderProfileId,
                  ),
                };
              let modelGenerationReadiness = getModelGenerationReadiness(value18);
              modelGenerationReadiness.reason === 'cli-status-loading' &&
                (modelGenerationReadiness = await ensureModelGenerationReadiness(value18).catch(
                  () => modelGenerationReadiness,
                ));
              if (!run3()) return;
              applyMenuItemCredentialState(
                value17,
                modelGenerationReadiness,
                value18.providerProfileId,
                value14,
              );
            }),
          ),
        )
        .then(() => {
          if (!run3()) return MODEL_CREDENTIAL_MENU_SYNC_STATES.get(el15)?.promise;
          syncModelMenuVisibility(el15, cacheKey.items, value13);
        })),
      value16.promise
    );
  };
  if (isApiConfigLoaded()) return run2();
  return ensureConfig()
    .catch(() => {})
    .then(run2);
}
export function bindModelCredentialMenu(el16, value19 = {}) {
  if (!el16?.addEventListener) return () => {};
  const value20 = value19.windowObject || globalThis.window;
  getCredentialStatusRevision(value20);
  const run4 = () => {
      void syncModelCredentialMenu(el16, value19);
    },
    value21 = (event) => {
      if (value19.guardSelection === false) return;
      const el17 = event.target?.closest?.(CREDENTIAL_MENU_ITEM_SELECTOR);
      if (!el17 || !el16.contains?.(el17)) return;
      const { modelId: modelId3, providerId: providerId4 } = getMenuItemCredentialContext(el17),
        providerProfileId2 = getMenuItemProviderProfileId(el17, value19, modelId3, providerId4);
      providerProfileId2 && (el17.dataset.credentialResolvedProviderProfileId = providerProfileId2);
      const response5 = getModelGenerationReadiness({
        modelId: modelId3,
        provider: providerId4,
        providerProfileId: providerProfileId2,
      });
      if (response5.status !== 'missing') return;
      (event.preventDefault?.(),
        event.stopImmediatePropagation?.(),
        event.stopPropagation?.(),
        showMissingCredential(response5));
    };
  el16.addEventListener('click', value21, true);
  const run5 =
    value19.listenConfigChanges === false ? () => {} : bindModelCredentialStatusEvents(run4, value20);
  return (
    run4(),
    () => {
      (el16.removeEventListener?.('click', value21, true), run5());
    }
  );
}

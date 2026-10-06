import { modelMenuPreferenceStore } from '../core/stores/modelMenuPreferenceStore.js';
import { getModelGenerationReadiness } from '../services/modelGenerationReadiness.js';
import { getModelProviderProfileIds } from './modelProviderProfileSelection.js';
import { openProviderApiKeySettings } from './providerApiKeyMissingToast.js';
import { t } from '../i18n/index.js';
import { getCachedCliProviderStatus } from '../../api/cliProviderApi.js';
import { getCachedDreaminaCliStatus } from '../../api/dreaminaCliApi.js';
const previousDisplay = new WeakMap(),
  filteredMenus = new WeakSet();
function setHidden(el, value) {
  if (!el?.style || !el?.dataset) return;
  if (value) {
    if (!previousDisplay.has(el)) previousDisplay.set(el, el.style.display);
    ((el.dataset.modelMenuHidden = 'true'), (el.style.display = 'none'));
  } else
    previousDisplay.has(el) &&
      ((el.style.display = previousDisplay.get(el)),
      previousDisplay.delete(el),
      delete el.dataset.modelMenuHidden);
}
export function isModelMenuEntryUnconfigured(args, handler = getModelGenerationReadiness) {
  const list = getModelProviderProfileIds(args.modelId);
  return (list.length ? list : [args.providerProfileId]).every((providerProfileId) => {
    const item = handler({ ...args, providerProfileId: providerProfileId });
    if (item.reason === 'cli-login-missing') {
      const enabled =
        item.cliProviderId === 'dreamina'
          ? getCachedDreaminaCliStatus()
          : getCachedCliProviderStatus(item.cliProviderId);
      return !enabled?.authConfigured && !enabled?.error;
    }
    return item.reason === 'credential-missing';
  });
}
export function syncModelMenuVisibility(el2, list2, key = {}) {
  const enabled2 = modelMenuPreferenceStore.getState().hideUnconfigured;
  if (!enabled2 && !filteredMenus.has(el2)) return;
  if (enabled2) filteredMenus.add(el2);
  else filteredMenus.delete(el2);
  list2.forEach((providerProfileId2) => {
    setHidden(
      providerProfileId2,
      enabled2 &&
        isModelMenuEntryUnconfigured({
          modelId: String(
            providerProfileId2.dataset?.credentialModel ||
              providerProfileId2.dataset?.value ||
              '',
          ),
          provider: String(providerProfileId2.dataset?.provider || ''),
          providerProfileId: providerProfileId2.dataset?.providerProfileId || '',
        }),
    );
  });
  const index = [...el2.querySelectorAll('[data-node-menu-submenu]')];
  index.reverse().forEach((provider) => {
    const el3 = el2.querySelector?.(provider.dataset?.nodeMenuSubmenu);
    if (!el3) return;
    const list3 = list2.filter((result) => el3.contains(result)),
      data =
        enabled2 &&
        (list3.length > 0
          ? list3.every((el4) => el4.dataset?.modelMenuHidden === 'true')
          : Boolean(provider.dataset?.credentialProvider) &&
            isModelMenuEntryUnconfigured({
              modelId: '',
              provider: provider.dataset.credentialProvider,
            }));
    (setHidden(provider, data),
      data && ((el3.style.display = 'none'), el3.classList?.remove('open')));
  });
  let el5 = el2.querySelector?.('[data-model-menu-empty]');
  const enabled3 =
    enabled2 &&
    list2.length > 0 &&
    list2.every((el6) => el6.dataset?.modelMenuHidden === 'true');
  if (enabled3 && !el5) {
    const el7 = key.documentObject || el2.ownerDocument || globalThis.document;
    ((el5 = el7?.createElement?.('button')),
      el5 &&
        ((el5.type = 'button'),
        (el5.className = 'floating-menu-item model-menu-configuration-empty'),
        (el5.dataset.modelMenuEmpty = 'true'),
        el5.addEventListener('click', (event) => {
          (event.stopPropagation(),
            openProviderApiKeySettings({ fieldIds: ['hideUnconfiguredProviders'] }));
        }),
        el2.appendChild(el5)));
  }
  el5 &&
    ((el5.textContent =
      t('settings.apiInput.catalog.noConfiguredModels') +
      ' · ' +
      t('settings.apiInput.catalog.configureModels')),
    (el5.hidden = !enabled3),
    (el5.style.display = enabled3 ? '' : 'none'));
}

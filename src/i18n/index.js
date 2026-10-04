import zh_CN from './messages/zh-CN.js';
import en_US from './messages/en-US.js';
export const DEFAULT_LOCALE = 'zh-CN';
export const SUPPORTED_LOCALES = Object.freeze(['zh-CN', 'en-US']);
const STORAGE_KEY = 'aicanvas.locale',
  dictionaries = Object.freeze({ 'zh-CN': zh_CN, 'en-US': en_US }),
  localeAliases = Object.freeze({
    zh: 'zh-CN',
    'zh-cn': 'zh-CN',
    'zh-hans': 'zh-CN',
    cn: 'zh-CN',
    en: 'en-US',
    'en-us': 'en-US',
  }),
  listeners = new Set();
let currentLocale = DEFAULT_LOCALE;
function canUseStorage() {
  try {
    return !!globalThis.localStorage;
  } catch (value) {
    return false;
  }
}
function readStoredLocale() {
  if (!canUseStorage()) return '';
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) || '';
  } catch (item) {
    return '';
  }
}
function persistLocale(key) {
  if (!canUseStorage()) return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, key);
  } catch (index) {}
}
export function normalizeLocale(result) {
  const enabled = String(result || '').trim();
  if (!enabled) return '';
  if (SUPPORTED_LOCALES.includes(enabled)) return enabled;
  const data = enabled.toLowerCase().replace('_', '-');
  if (localeAliases[data]) return localeAliases[data];
  const options = data.split('-')[0];
  return localeAliases[options] || '';
}
function readNavigatorLocale() {
  const target = globalThis.navigator,
    source = [...(Array.isArray(target?.languages) ? target.languages : []), target?.language];
  for (const next of source) {
    const locale = normalizeLocale(next);
    if (locale) return locale;
  }
  return '';
}
function readPath(current, entry) {
  const record = String(entry || '')
    .split('.')
    .filter(Boolean);
  let enabled2 = current;
  for (const payload of record) {
    if (!enabled2 || typeof enabled2 !== 'object' || !(payload in enabled2)) return undefined;
    enabled2 = enabled2[payload];
  }
  return enabled2;
}
function interpolate(handle, state = {}) {
  return String(handle).replace(/\{(\w+)\}/g, (config, scope) => {
    if (!(scope in state)) return config;
    const input = state[scope];
    return input == null ? '' : String(input);
  });
}
function applyDocumentLocale(locale2) {
  const dom = globalThis.document;
  if (!dom?.documentElement) return;
  ((dom.documentElement.lang = locale2), (dom.documentElement.dir = 'ltr'));
  if (dom.title != null) dom.title = t('app.documentTitle', {}, { locale: locale2 });
}
function notifyLocaleChange(locale3) {
  (listeners.forEach((handler) => {
    try {
      handler(locale3);
    } catch (output) {
      console.error('[i18n] locale listener failed', output);
    }
  }),
    typeof globalThis.CustomEvent === 'function' &&
      typeof globalThis.dispatchEvent === 'function' &&
      globalThis.dispatchEvent(new CustomEvent('aicanvas:locale-change', { detail: { locale: locale3 } })));
}
export function getLocale() {
  return currentLocale;
}
export function setLocale(value2, value3 = {}) {
  const locale4 = normalizeLocale(value2) || DEFAULT_LOCALE,
    value4 = locale4 !== currentLocale;
  currentLocale = locale4;
  if (value3.persist !== false) persistLocale(locale4);
  applyDocumentLocale(locale4);
  if (value4 && value3.notify !== false) notifyLocaleChange(locale4);
  return currentLocale;
}
export function initI18n(persist = {}) {
  const value5 = persist.useNavigatorLocale === true,
    locale5 =
      normalizeLocale(persist.locale) ||
      normalizeLocale(readStoredLocale()) ||
      (value5 ? readNavigatorLocale() : '') ||
      DEFAULT_LOCALE;
  return setLocale(locale5, { persist: persist.persist === true, notify: persist.notify === true });
}
export function onLocaleChange(value6) {
  if (typeof value6 !== 'function') return () => {};
  return (listeners.add(value6), () => listeners.delete(value6));
}
export function t(value7, value8 = {}, value9 = {}) {
  const locale6 = normalizeLocale(value9.locale) || currentLocale,
    path =
      readPath(dictionaries[locale6], value7) ?? readPath(dictionaries[DEFAULT_LOCALE], value7) ?? value7;
  return interpolate(path, value8);
}
function getScopedElements(value10, value11) {
  const el = value10 || globalThis.document;
  if (!el) return [];
  const list = [];
  return (
    typeof el.matches === 'function' && el.matches(value11) && list.push(el),
    typeof el.querySelectorAll === 'function' && list.push(...Array.from(el.querySelectorAll(value11))),
    list
  );
}
const ATTRIBUTE_BINDINGS = Object.freeze([
  Object.freeze({ keyAttr: 'data-i18n-title', targetAttr: 'title' }),
  Object.freeze({ keyAttr: 'data-i18n-placeholder', targetAttr: 'placeholder' }),
  Object.freeze({ keyAttr: 'data-i18n-aria-label', targetAttr: 'aria-label' }),
  Object.freeze({ keyAttr: 'data-i18n-alt', targetAttr: 'alt' }),
  Object.freeze({ keyAttr: 'data-i18n-tooltip', targetAttr: 'data-tooltip' }),
  Object.freeze({ keyAttr: 'data-i18n-tooltip-right', targetAttr: 'data-tooltip-right' }),
]);
export function applyI18n(value12 = globalThis.document) {
  (getScopedElements(value12, '[data-i18n]').forEach((el2) => {
    const enabled3 = el2.getAttribute('data-i18n');
    if (!enabled3) return;
    el2.textContent = t(enabled3);
  }),
    ATTRIBUTE_BINDINGS.forEach(({ keyAttr: keyAttr, targetAttr: targetAttr }) => {
      getScopedElements(value12, '[' + keyAttr + ']').forEach((el3) => {
        const enabled4 = el3.getAttribute(keyAttr);
        if (!enabled4) return;
        el3.setAttribute(targetAttr, t(enabled4));
      });
    }),
    applyDocumentLocale(currentLocale));
}
function getCustomLocaleSelectParts(el4) {
  const control = el4?.closest?.('.settings-preset-select');
  if (!control) return {};
  const trigger = control.querySelector?.('[data-i18n-locale-trigger]'),
    triggerText = control.querySelector?.('[data-i18n-locale-trigger-text]'),
    menu = control.querySelector?.('[data-i18n-locale-menu]'),
    options2 = menu?.querySelectorAll ? Array.from(menu.querySelectorAll('[data-i18n-locale-option]')) : [];
  return {
    control: control,
    trigger: trigger,
    triggerText: triggerText,
    menu: menu,
    options: options2,
  };
}
function getLocaleSelectOptionLabel(value13, value14, list2 = []) {
  const el5 = value13?.options ? Array.from(value13.options).find((el6) => el6.value === value14) : null,
    el7 = list2.find((el8) => el8.dataset?.value === value14);
  return el5?.textContent || el7?.textContent || value14;
}
function setCustomLocaleMenuOpen(
  el9,
  enabled5,
  { focusOption: focusOption = false, focusTrigger: focusTrigger = false } = {},
) {
  const {
    control: control2,
    trigger: trigger2,
    menu: menu2,
    options: options3,
  } = getCustomLocaleSelectParts(el9);
  if (!control2 || !trigger2 || !menu2) return;
  const enabled6 = !!enabled5;
  (control2.classList?.toggle('is-open', enabled6),
    trigger2.setAttribute?.('aria-expanded', enabled6 ? 'true' : 'false'),
    (menu2.hidden = !enabled6));
  if (enabled6 && focusOption) {
    const el10 =
      options3.find((el11) => el11.dataset?.value === el9.value && !el11.disabled) ||
      options3.find((el12) => !el12.disabled);
    el10?.focus?.();
  } else !enabled6 && focusTrigger && trigger2.focus?.();
}
function isCustomLocaleMenuOpen(value15) {
  return !!getCustomLocaleSelectParts(value15).control?.classList?.contains('is-open');
}
function moveCustomLocaleOptionFocus(el13, value16) {
  const { options: options4 } = getCustomLocaleSelectParts(el13),
    list3 = options4.filter((el14) => !el14.disabled);
  if (list3.length === 0) return;
  const value17 = el13?.ownerDocument?.activeElement || globalThis.document?.activeElement;
  let count = list3.indexOf(value17);
  count < 0 && (count = list3.findIndex((el15) => el15.dataset?.value === el13.value));
  const value18 = (Math.max(count, 0) + value16 + list3.length) % list3.length;
  list3[value18]?.focus?.();
}
function commitLocaleSelect(el16, value19) {
  (setLocale(el16.value), applyI18n(value19), syncLocaleSelects(value19));
}
function syncCustomLocaleSelect(el17) {
  const { triggerText: triggerText2, options: options5 } = getCustomLocaleSelectParts(el17);
  if (!triggerText2 && options5.length === 0) return;
  const value20 = el17.value || currentLocale;
  (triggerText2 && (triggerText2.textContent = getLocaleSelectOptionLabel(el17, value20, options5)),
    options5.forEach((el18) => {
      const value21 = el18.dataset?.value === value20;
      (el18.classList?.toggle('is-active', value21),
        el18.setAttribute?.('aria-selected', value21 ? 'true' : 'false'));
    }));
}
function bindCustomLocaleSelect(el19, value22) {
  const { control: control3, trigger: trigger3, menu: menu3 } = getCustomLocaleSelectParts(el19);
  if (!control3 || !trigger3 || !menu3 || trigger3.dataset?.i18nLocaleBound === '1') return;
  ((trigger3.dataset.i18nLocaleBound = '1'),
    trigger3.addEventListener?.('click', () => {
      setCustomLocaleMenuOpen(el19, !isCustomLocaleMenuOpen(el19), { focusOption: true });
    }),
    trigger3.addEventListener?.('keydown', (event) => {
      (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') &&
        (event.preventDefault?.(), setCustomLocaleMenuOpen(el19, true, { focusOption: true }));
    }),
    menu3.addEventListener?.('click', (event2) => {
      const el20 = event2.target?.closest?.('[data-i18n-locale-option]');
      if (!el20 || el20.disabled) return;
      ((el19.value = el20.dataset?.value || el19.value),
        commitLocaleSelect(el19, value22),
        setCustomLocaleMenuOpen(el19, false, { focusTrigger: true }));
    }),
    menu3.addEventListener?.('keydown', (event3) => {
      if (event3.key === 'Escape')
        (event3.preventDefault?.(), setCustomLocaleMenuOpen(el19, false, { focusTrigger: true }));
      else {
        if (event3.key === 'ArrowDown') (event3.preventDefault?.(), moveCustomLocaleOptionFocus(el19, 1));
        else {
          if (event3.key === 'ArrowUp') (event3.preventDefault?.(), moveCustomLocaleOptionFocus(el19, -1));
          else {
            if (event3.key === 'Enter' || event3.key === ' ') {
              event3.preventDefault?.();
              const el21 = el19?.ownerDocument?.activeElement?.closest?.('[data-i18n-locale-option]');
              if (!el21 || el21.disabled) return;
              ((el19.value = el21.dataset?.value || el19.value),
                commitLocaleSelect(el19, value22),
                setCustomLocaleMenuOpen(el19, false, { focusTrigger: true }));
            }
          }
        }
      }
    }));
  const el22 = el19?.ownerDocument || globalThis.document;
  el22?.addEventListener?.('pointerdown', (event4) => {
    if (!isCustomLocaleMenuOpen(el19)) return;
    if (typeof control3.contains === 'function' && control3.contains(event4.target)) return;
    setCustomLocaleMenuOpen(el19, false);
  });
}
function syncLocaleSelects(value23 = globalThis.document) {
  getScopedElements(value23, '[data-i18n-locale-select]').forEach((el23) => {
    if ('value' in el23) el23.value = currentLocale;
    syncCustomLocaleSelect(el23);
  });
}
function bindLocaleSelects(value24 = globalThis.document) {
  getScopedElements(value24, '[data-i18n-locale-select]').forEach((el24) => {
    (el24.dataset?.i18nLocaleBound !== '1' &&
      ((el24.dataset.i18nLocaleBound = '1'),
      el24.addEventListener?.('change', () => {
        commitLocaleSelect(el24, value24);
      })),
      bindCustomLocaleSelect(el24, value24));
  });
}
export function initI18nDomBindings(value25 = globalThis.document) {
  return (
    initI18n(),
    applyI18n(value25),
    bindLocaleSelects(value25),
    syncLocaleSelects(value25),
    onLocaleChange(() => {
      (applyI18n(value25), syncLocaleSelects(value25));
    })
  );
}

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
  } catch (_0x19bcee) {
    return false;
  }
}
function readStoredLocale() {
  if (!canUseStorage()) return '';
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) || '';
  } catch (_0x21e32d) {
    return '';
  }
}
function persistLocale(_0x283618) {
  if (!canUseStorage()) return;
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, _0x283618);
  } catch (_0x54f444) {}
}
export function normalizeLocale(_0x260d10) {
  const _0x3d08ae = String(_0x260d10 || '').trim();
  if (!_0x3d08ae) return '';
  if (SUPPORTED_LOCALES.includes(_0x3d08ae)) return _0x3d08ae;
  const _0x2890a4 = _0x3d08ae.toLowerCase().replace('_', '-');
  if (localeAliases[_0x2890a4]) return localeAliases[_0x2890a4];
  const _0x2f556b = _0x2890a4.split('-')[0];
  return localeAliases[_0x2f556b] || '';
}
function readNavigatorLocale() {
  const _0x556f6b = globalThis.navigator,
    _0x33fde2 = [...(Array.isArray(_0x556f6b?.languages) ? _0x556f6b.languages : []), _0x556f6b?.language];
  for (const _0x28ca2b of _0x33fde2) {
    const _0x98bed3 = normalizeLocale(_0x28ca2b);
    if (_0x98bed3) return _0x98bed3;
  }
  return '';
}
function readPath(_0x5b3750, _0x38479a) {
  const _0x29cefc = String(_0x38479a || '')
    .split('.')
    .filter(Boolean);
  let _0x4777b8 = _0x5b3750;
  for (const _0xa6a6bc of _0x29cefc) {
    if (!_0x4777b8 || typeof _0x4777b8 !== 'object' || !(_0xa6a6bc in _0x4777b8)) return undefined;
    _0x4777b8 = _0x4777b8[_0xa6a6bc];
  }
  return _0x4777b8;
}
function interpolate(_0x310c60, _0x537f7e = {}) {
  return String(_0x310c60).replace(/\{(\w+)\}/g, (_0x490389, _0x1f3ae0) => {
    if (!(_0x1f3ae0 in _0x537f7e)) return _0x490389;
    const _0x237bd1 = _0x537f7e[_0x1f3ae0];
    return _0x237bd1 == null ? '' : String(_0x237bd1);
  });
}
function applyDocumentLocale(_0x5aa32d) {
  const _0x45bc4f = globalThis.document;
  if (!_0x45bc4f?.documentElement) return;
  ((_0x45bc4f.documentElement.lang = _0x5aa32d), (_0x45bc4f.documentElement.dir = 'ltr'));
  if (_0x45bc4f.title != null) _0x45bc4f.title = t('app.documentTitle', {}, { locale: _0x5aa32d });
}
function notifyLocaleChange(_0x395113) {
  (listeners.forEach((_0x220990) => {
    try {
      _0x220990(_0x395113);
    } catch (_0x270e44) {
      console.error('[i18n] locale listener failed', _0x270e44);
    }
  }),
    typeof globalThis.CustomEvent === 'function' &&
      typeof globalThis.dispatchEvent === 'function' &&
      globalThis.dispatchEvent(new CustomEvent('aicanvas:locale-change', { detail: { locale: _0x395113 } })));
}
export function getLocale() {
  return currentLocale;
}
export function setLocale(_0x138fe3, _0x166756 = {}) {
  const _0x416cf7 = normalizeLocale(_0x138fe3) || DEFAULT_LOCALE,
    _0x7454c5 = _0x416cf7 !== currentLocale;
  currentLocale = _0x416cf7;
  if (_0x166756.persist !== false) persistLocale(_0x416cf7);
  applyDocumentLocale(_0x416cf7);
  if (_0x7454c5 && _0x166756.notify !== false) notifyLocaleChange(_0x416cf7);
  return currentLocale;
}
export function initI18n(_0x28de06 = {}) {
  const _0x10f93a = _0x28de06.useNavigatorLocale === true,
    _0xe0be44 =
      normalizeLocale(_0x28de06.locale) ||
      normalizeLocale(readStoredLocale()) ||
      (_0x10f93a ? readNavigatorLocale() : '') ||
      DEFAULT_LOCALE;
  return setLocale(_0xe0be44, { persist: _0x28de06.persist === true, notify: _0x28de06.notify === true });
}
export function onLocaleChange(_0x5d3b27) {
  if (typeof _0x5d3b27 !== 'function') return () => {};
  return (listeners.add(_0x5d3b27), () => listeners.delete(_0x5d3b27));
}
export function t(_0x5b0e3b, _0x3edfe3 = {}, _0x138b8f = {}) {
  const _0x504312 = normalizeLocale(_0x138b8f.locale) || currentLocale,
    _0x22d05f =
      readPath(dictionaries[_0x504312], _0x5b0e3b) ??
      readPath(dictionaries[DEFAULT_LOCALE], _0x5b0e3b) ??
      _0x5b0e3b;
  return interpolate(_0x22d05f, _0x3edfe3);
}
function getScopedElements(_0x1d1577, _0x203c94) {
  const _0x4b5706 = _0x1d1577 || globalThis.document;
  if (!_0x4b5706) return [];
  const _0x122a44 = [];
  return (
    typeof _0x4b5706.matches === 'function' && _0x4b5706.matches(_0x203c94) && _0x122a44.push(_0x4b5706),
    typeof _0x4b5706.querySelectorAll === 'function' &&
      _0x122a44.push(...Array.from(_0x4b5706.querySelectorAll(_0x203c94))),
    _0x122a44
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
export function applyI18n(_0x2c22bd = globalThis.document) {
  (getScopedElements(_0x2c22bd, '[data-i18n]').forEach((_0x5832cb) => {
    const _0x2c48af = _0x5832cb.getAttribute('data-i18n');
    if (!_0x2c48af) return;
    _0x5832cb.textContent = t(_0x2c48af);
  }),
    ATTRIBUTE_BINDINGS.forEach(({ keyAttr: _0x7b793c, targetAttr: _0x1d5db1 }) => {
      getScopedElements(_0x2c22bd, '[' + _0x7b793c + ']').forEach((_0x381c5b) => {
        const _0xa0448a = _0x381c5b.getAttribute(_0x7b793c);
        if (!_0xa0448a) return;
        _0x381c5b.setAttribute(_0x1d5db1, t(_0xa0448a));
      });
    }),
    applyDocumentLocale(currentLocale));
}
function getCustomLocaleSelectParts(_0x24f0ba) {
  const _0x43d61c = _0x24f0ba?.closest?.('.settings-preset-select');
  if (!_0x43d61c) return {};
  const _0x4bf9a5 = _0x43d61c.querySelector?.('[data-i18n-locale-trigger]'),
    _0x235d2c = _0x43d61c.querySelector?.('[data-i18n-locale-trigger-text]'),
    _0x1ff9ea = _0x43d61c.querySelector?.('[data-i18n-locale-menu]'),
    _0x19d7d3 = _0x1ff9ea?.querySelectorAll
      ? Array.from(_0x1ff9ea.querySelectorAll('[data-i18n-locale-option]'))
      : [];
  return {
    control: _0x43d61c,
    trigger: _0x4bf9a5,
    triggerText: _0x235d2c,
    menu: _0x1ff9ea,
    options: _0x19d7d3,
  };
}
function getLocaleSelectOptionLabel(_0x1b55d5, _0x51f431, _0x540ae6 = []) {
  const _0x29b8c8 = _0x1b55d5?.options
      ? Array.from(_0x1b55d5.options).find((_0x45196c) => _0x45196c.value === _0x51f431)
      : null,
    _0x356330 = _0x540ae6.find((_0x4521db) => _0x4521db.dataset?.value === _0x51f431);
  return _0x29b8c8?.textContent || _0x356330?.textContent || _0x51f431;
}
function setCustomLocaleMenuOpen(
  _0x49e053,
  _0x121c0d,
  { focusOption: focusOption = false, focusTrigger: focusTrigger = false } = {},
) {
  const {
    control: _0xf50e79,
    trigger: _0x376b44,
    menu: _0x3d8be2,
    options: _0x475ddd,
  } = getCustomLocaleSelectParts(_0x49e053);
  if (!_0xf50e79 || !_0x376b44 || !_0x3d8be2) return;
  const _0x34d664 = !!_0x121c0d;
  (_0xf50e79.classList?.toggle('is-open', _0x34d664),
    _0x376b44.setAttribute?.('aria-expanded', _0x34d664 ? 'true' : 'false'),
    (_0x3d8be2.hidden = !_0x34d664));
  if (_0x34d664 && focusOption) {
    const _0x27d18d =
      _0x475ddd.find((_0x4ecbc2) => _0x4ecbc2.dataset?.value === _0x49e053.value && !_0x4ecbc2.disabled) ||
      _0x475ddd.find((_0x163dc1) => !_0x163dc1.disabled);
    _0x27d18d?.focus?.();
  } else !_0x34d664 && focusTrigger && _0x376b44.focus?.();
}
function isCustomLocaleMenuOpen(_0x4cd606) {
  return !!getCustomLocaleSelectParts(_0x4cd606).control?.classList?.contains('is-open');
}
function moveCustomLocaleOptionFocus(_0x3499a9, _0x38e4fd) {
  const { options: _0x114c49 } = getCustomLocaleSelectParts(_0x3499a9),
    _0x5b0044 = _0x114c49.filter((_0x39271b) => !_0x39271b.disabled);
  if (_0x5b0044.length === 0) return;
  const _0x3a017a = _0x3499a9?.ownerDocument?.activeElement || globalThis.document?.activeElement;
  let _0x317259 = _0x5b0044.indexOf(_0x3a017a);
  _0x317259 < 0 &&
    (_0x317259 = _0x5b0044.findIndex((_0x150c02) => _0x150c02.dataset?.value === _0x3499a9.value));
  const _0x462188 = (Math.max(_0x317259, 0) + _0x38e4fd + _0x5b0044.length) % _0x5b0044.length;
  _0x5b0044[_0x462188]?.focus?.();
}
function commitLocaleSelect(_0x32ffbf, _0x5e6147) {
  (setLocale(_0x32ffbf.value), applyI18n(_0x5e6147), syncLocaleSelects(_0x5e6147));
}
function syncCustomLocaleSelect(_0x338f18) {
  const { triggerText: _0x4cf70a, options: _0x130357 } = getCustomLocaleSelectParts(_0x338f18);
  if (!_0x4cf70a && _0x130357.length === 0) return;
  const _0xf65094 = _0x338f18.value || currentLocale;
  (_0x4cf70a && (_0x4cf70a.textContent = getLocaleSelectOptionLabel(_0x338f18, _0xf65094, _0x130357)),
    _0x130357.forEach((_0x29de3b) => {
      const _0x460e97 = _0x29de3b.dataset?.value === _0xf65094;
      (_0x29de3b.classList?.toggle('is-active', _0x460e97),
        _0x29de3b.setAttribute?.('aria-selected', _0x460e97 ? 'true' : 'false'));
    }));
}
function bindCustomLocaleSelect(_0x575589, _0x395aa9) {
  const { control: _0x1f7a3e, trigger: _0x2b6be7, menu: _0x2b1a62 } = getCustomLocaleSelectParts(_0x575589);
  if (!_0x1f7a3e || !_0x2b6be7 || !_0x2b1a62 || _0x2b6be7.dataset?.i18nLocaleBound === '1') return;
  ((_0x2b6be7.dataset.i18nLocaleBound = '1'),
    _0x2b6be7.addEventListener?.('click', () => {
      setCustomLocaleMenuOpen(_0x575589, !isCustomLocaleMenuOpen(_0x575589), { focusOption: true });
    }),
    _0x2b6be7.addEventListener?.('keydown', (_0x2ea630) => {
      (_0x2ea630.key === 'ArrowDown' || _0x2ea630.key === 'Enter' || _0x2ea630.key === ' ') &&
        (_0x2ea630.preventDefault?.(), setCustomLocaleMenuOpen(_0x575589, true, { focusOption: true }));
    }),
    _0x2b1a62.addEventListener?.('click', (_0x4b0299) => {
      const _0x569e2d = _0x4b0299.target?.closest?.('[data-i18n-locale-option]');
      if (!_0x569e2d || _0x569e2d.disabled) return;
      ((_0x575589.value = _0x569e2d.dataset?.value || _0x575589.value),
        commitLocaleSelect(_0x575589, _0x395aa9),
        setCustomLocaleMenuOpen(_0x575589, false, { focusTrigger: true }));
    }),
    _0x2b1a62.addEventListener?.('keydown', (_0x4321a6) => {
      if (_0x4321a6.key === 'Escape')
        (_0x4321a6.preventDefault?.(), setCustomLocaleMenuOpen(_0x575589, false, { focusTrigger: true }));
      else {
        if (_0x4321a6.key === 'ArrowDown')
          (_0x4321a6.preventDefault?.(), moveCustomLocaleOptionFocus(_0x575589, 1));
        else {
          if (_0x4321a6.key === 'ArrowUp')
            (_0x4321a6.preventDefault?.(), moveCustomLocaleOptionFocus(_0x575589, -1));
          else {
            if (_0x4321a6.key === 'Enter' || _0x4321a6.key === ' ') {
              _0x4321a6.preventDefault?.();
              const _0x57860e =
                _0x575589?.ownerDocument?.activeElement?.closest?.('[data-i18n-locale-option]');
              if (!_0x57860e || _0x57860e.disabled) return;
              ((_0x575589.value = _0x57860e.dataset?.value || _0x575589.value),
                commitLocaleSelect(_0x575589, _0x395aa9),
                setCustomLocaleMenuOpen(_0x575589, false, { focusTrigger: true }));
            }
          }
        }
      }
    }));
  const _0x3f5f16 = _0x575589?.ownerDocument || globalThis.document;
  _0x3f5f16?.addEventListener?.('pointerdown', (_0xf527f4) => {
    if (!isCustomLocaleMenuOpen(_0x575589)) return;
    if (typeof _0x1f7a3e.contains === 'function' && _0x1f7a3e.contains(_0xf527f4.target)) return;
    setCustomLocaleMenuOpen(_0x575589, false);
  });
}
function syncLocaleSelects(_0x3067c6 = globalThis.document) {
  getScopedElements(_0x3067c6, '[data-i18n-locale-select]').forEach((_0x389398) => {
    if ('value' in _0x389398) _0x389398.value = currentLocale;
    syncCustomLocaleSelect(_0x389398);
  });
}
function bindLocaleSelects(_0x5aaccb = globalThis.document) {
  getScopedElements(_0x5aaccb, '[data-i18n-locale-select]').forEach((_0x557f73) => {
    (_0x557f73.dataset?.i18nLocaleBound !== '1' &&
      ((_0x557f73.dataset.i18nLocaleBound = '1'),
      _0x557f73.addEventListener?.('change', () => {
        commitLocaleSelect(_0x557f73, _0x5aaccb);
      })),
      bindCustomLocaleSelect(_0x557f73, _0x5aaccb));
  });
}
export function initI18nDomBindings(_0x2c8f70 = globalThis.document) {
  return (
    initI18n(),
    applyI18n(_0x2c8f70),
    bindLocaleSelects(_0x2c8f70),
    syncLocaleSelects(_0x2c8f70),
    onLocaleChange(() => {
      (applyI18n(_0x2c8f70), syncLocaleSelects(_0x2c8f70));
    })
  );
}

import { logDiagnosticEvent } from './diagnosticsService.js';
import { t } from '../i18n/index.js';
export function normalizeHttpExternalUrl(_0x3a195f) {
  const _0x25fe3c = String(_0x3a195f || '').trim();
  if (!_0x25fe3c) return '';
  try {
    const _0x4c13b7 = new URL(_0x25fe3c);
    if (_0x4c13b7.protocol !== 'http:' && _0x4c13b7.protocol !== 'https:') return '';
    return ((_0x4c13b7.username = ''), (_0x4c13b7.password = ''), _0x4c13b7.toString());
  } catch {
    return '';
  }
}
function getElectronShellApi() {
  const _0x19e75c = globalThis.window?.electronAPI?.shell;
  return _0x19e75c && typeof _0x19e75c.openExternal === 'function' ? _0x19e75c : null;
}
function openExternalInBrowser(_0x2c9bc3) {
  const _0x34388d = document.createElement('a');
  return (
    (_0x34388d.href = _0x2c9bc3),
    (_0x34388d.target = '_blank'),
    (_0x34388d.rel = 'noopener noreferrer'),
    _0x34388d.click(),
    { ok: true, url: _0x2c9bc3 }
  );
}
export async function openExternalLink(_0x31ab0d, _0x57379c = {}) {
  const _0x2c2d89 = normalizeHttpExternalUrl(_0x31ab0d),
    _0x19213a = String(_0x57379c.label || t('coreServices.externalLink.externalLink'));
  if (!_0x2c2d89) {
    void logDiagnosticEvent({
      type: 'external_link.renderer_blocked',
      level: 'warn',
      source: 'renderer',
      message: 'Renderer blocked invalid external link',
      context: { label: _0x19213a },
    });
    throw new Error(t('coreServices.externalLink.blocked'));
  }
  const _0x369e8e = getElectronShellApi();
  if (_0x369e8e) return await _0x369e8e.openExternal(_0x2c2d89);
  return openExternalInBrowser(_0x2c2d89);
}
export async function openExternalLinkWithClipboardFallback(
  _0x30b51c,
  _0x31ac0e = t('coreServices.externalLink.link'),
) {
  const _0x26f7ca = normalizeHttpExternalUrl(_0x30b51c);
  if (!_0x26f7ca) throw new Error(t('coreServices.externalLink.missing', { label: _0x31ac0e }));
  try {
    return (await openExternalLink(_0x26f7ca, { label: _0x31ac0e }), true);
  } catch {
    try {
      return (await navigator.clipboard?.writeText?.(_0x26f7ca), false);
    } catch {
      return false;
    }
  }
}
export function initExternalLinkHandlers(_0x297e5f = document) {
  if (globalThis.window?.__aiCanvasExternalLinksInstalled) return;
  ((globalThis.window.__aiCanvasExternalLinksInstalled = true),
    _0x297e5f.addEventListener('click', (_0x202d95) => {
      const _0x331f3a = _0x202d95.target?.closest?.(
        "[data-external-url],a[href^='http://'],a[href^='https://']",
      );
      if (!_0x331f3a) return;
      const _0x585a48 = _0x331f3a.dataset?.externalUrl || _0x331f3a.getAttribute?.('href') || '';
      if (!_0x585a48) return;
      (_0x202d95.preventDefault(),
        void openExternalLink(_0x585a48, {
          label:
            _0x331f3a.getAttribute?.('aria-label') ||
            _0x331f3a.getAttribute?.('title') ||
            t('coreServices.externalLink.externalLink'),
        }).catch((_0x27a6c0) => {
          globalThis.window?.showToast?.(
            _0x27a6c0?.message || t('coreServices.externalLink.openFailed'),
            'error',
          );
        }));
    }));
}

import { logDiagnosticEvent } from './diagnosticsService.js';
import { t } from '../i18n/index.js';
export function normalizeHttpExternalUrl(value) {
  const enabled = String(value || '').trim();
  if (!enabled) return '';
  try {
    const uRL = new URL(enabled);
    if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:') return '';
    return ((uRL.username = ''), (uRL.password = ''), uRL.toString());
  } catch {
    return '';
  }
}
function getElectronShellApi() {
  const item = globalThis.window?.electronAPI?.shell;
  return item && typeof item.openExternal === 'function' ? item : null;
}
function openExternalInBrowser(url) {
  const el = document.createElement('a');
  return (
    (el.href = url),
    (el.target = '_blank'),
    (el.rel = 'noopener noreferrer'),
    el.click(),
    { ok: true, url: url }
  );
}
export async function openExternalLink(key, index = {}) {
  const httpExternalUrl = normalizeHttpExternalUrl(key),
    label = String(index.label || t('coreServices.externalLink.externalLink'));
  if (!httpExternalUrl) {
    void logDiagnosticEvent({
      type: 'external_link.renderer_blocked',
      level: 'warn',
      source: 'renderer',
      message: 'Renderer blocked invalid external link',
      context: { label: label },
    });
    throw new Error(t('coreServices.externalLink.blocked'));
  }
  const electronShellApi = getElectronShellApi();
  if (electronShellApi) return await electronShellApi.openExternal(httpExternalUrl);
  return openExternalInBrowser(httpExternalUrl);
}
export async function openExternalLinkWithClipboardFallback(
  result,
  label2 = t('coreServices.externalLink.link'),
) {
  const httpExternalUrl2 = normalizeHttpExternalUrl(result);
  if (!httpExternalUrl2) throw new Error(t('coreServices.externalLink.missing', { label: label2 }));
  try {
    return (await openExternalLink(httpExternalUrl2, { label: label2 }), true);
  } catch {
    try {
      return (await navigator.clipboard?.writeText?.(httpExternalUrl2), false);
    } catch {
      return false;
    }
  }
}
export function initExternalLinkHandlers(el2 = document) {
  if (globalThis.window?.__aiCanvasExternalLinksInstalled) return;
  ((globalThis.window.__aiCanvasExternalLinksInstalled = true),
    el2.addEventListener('click', (event) => {
      const label3 = event.target?.closest?.("[data-external-url],a[href^='http://'],a[href^='https://']");
      if (!label3) return;
      const enabled2 = label3.dataset?.externalUrl || label3.getAttribute?.('href') || '';
      if (!enabled2) return;
      (event.preventDefault(),
        void openExternalLink(enabled2, {
          label:
            label3.getAttribute?.('aria-label') ||
            label3.getAttribute?.('title') ||
            t('coreServices.externalLink.externalLink'),
        }).catch((error) => {
          globalThis.window?.showToast?.(
            error?.message || t('coreServices.externalLink.openFailed'),
            'error',
          );
        }));
    }));
}

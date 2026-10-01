import { onLocaleChange, t } from '../i18n/index.js';

const DEFAULT_PRODUCT_NAME = 'Canvas';
let productName = DEFAULT_PRODUCT_NAME;

function normalizeProductName(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 80);
}

function replaceProductName(value) {
  return String(value || '')
    .replace(/updream canvas/gi, productName)
    .replace(/\bCanvas\b/g, productName);
}

function applyProductBranding() {
  if (typeof document === 'undefined') return;
  document.title = replaceProductName(t('app.documentTitle')) || productName;
  const wordmark = document.querySelector('[data-product-name="wordmark"]');
  if (wordmark) wordmark.textContent = productName;
  const aboutTitle = document.querySelector('[data-product-name="about"]');
  if (aboutTitle) aboutTitle.textContent = productName;
  const aboutLogo = document.querySelector('[data-product-name-alt]');
  if (aboutLogo) aboutLogo.alt = `${productName} Logo`;
  const aboutFooter = document.querySelector('[data-product-name-footer]');
  if (aboutFooter) aboutFooter.textContent = replaceProductName(t('about.footer'));
  for (const input of document.querySelectorAll('[data-product-name-placeholder]')) {
    input.placeholder = replaceProductName(t('settings.fileSave.rootDir.placeholder'));
  }
}

async function loadCachedClientConfig() {
  try {
    const response = await fetch('/api/client-config', { cache: 'no-store' });
    if (!response.ok) return;
    const body = await response.json();
    const config = body?.data && typeof body.data === 'object' ? body.data : body;
    const nextName = normalizeProductName(config?.product_display_name || config?.productDisplayName);
    if (nextName) {
      productName = nextName;
      applyProductBranding();
    }
  } catch {}
}

onLocaleChange(applyProductBranding);
if (typeof window !== 'undefined') {
  window.addEventListener('canvas:product-display-name', (event) => {
    const nextName = normalizeProductName(event?.detail?.displayName);
    if (!nextName) return;
    productName = nextName;
    applyProductBranding();
  });
}

applyProductBranding();
void loadCachedClientConfig();

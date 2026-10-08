import { onLocaleChange, t } from '../i18n/index.js';
import { applyBrandIdentity } from './brandIdentity.js';
import { loadClientConfig, onClientConfigChange } from './clientConfigStore.js';

const DEFAULT_PRODUCT_NAME = 'Canvas';
let productName = DEFAULT_PRODUCT_NAME;
let brandConfig = null;

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

function applyBrandIdentityToDocument() {
  if (typeof document === 'undefined') return;
  applyBrandIdentity(document, brandConfig);
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
  applyBrandIdentityToDocument();
}

function consumeClientConfig(config) {
  if (!config || typeof config !== 'object') return;
  const nextName = normalizeProductName(config.product_display_name || config.productDisplayName);
  if (nextName) productName = nextName;
  if (config.brand && typeof config.brand === 'object') brandConfig = config.brand;
  applyProductBranding();
}

async function loadCachedClientConfig() {
  const config = await loadClientConfig();
  if (config) consumeClientConfig(config);
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
onClientConfigChange(consumeClientConfig);
void loadCachedClientConfig();

/** 测试用：重置品牌状态。 */
export function resetProductBranding() {
  productName = DEFAULT_PRODUCT_NAME;
  brandConfig = null;
}

export { applyProductBranding };

import { onLocaleChange, t } from '../i18n/index.js';
import { applyBrandIdentity } from './brandIdentity.js';
import { loadClientConfig, onClientConfigChange } from './clientConfigStore.js';

// 换牌：产品名（正文/关于页用 OneFrame），而 logo 处的中文简称固定为「一帧」。
// 两者刻意分开：正文里写「一帧 OneFrame」会过于冗长，而 logo 只放英文又丢了中文识别度。
const DEFAULT_PRODUCT_NAME = 'OneFrame';
const PRODUCT_WORDMARK = '一帧';
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
    .replace(/SHUO Canvas/gi, productName)
    .replace(/AI[-\s]?CanvasPro/gi, productName)
    .replace(/\bAiCanvas\b/gi, productName)
    .replace(/\bAICanvas\b/g, productName)
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
  if (wordmark) wordmark.textContent = PRODUCT_WORDMARK;
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

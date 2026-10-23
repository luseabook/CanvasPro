import { t } from '../i18n/index.js';
export const GENERATE_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>';
export const GENERATE_LOADING_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
export const GENERATE_CANCEL_ICON_HTML =
  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><g class="v2-task-cancel-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></g><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>';
// 图标源字符串只有三个常量，规范化结果按字符串缓存即可。
const normalizedIconCache = new Map();
/**
 * 只在图标真的变了时才写 innerHTML。
 *
 * 直接赋值同一个 HTML 也会重建整棵子树：带 CSS 动画的图标（加载中的旋转圈）会因此
 * 从 0 度重新开始，按钮每次状态刷新看起来都「顿」一下。
 *
 * ⚠ 不能拿 `el.innerHTML` 直接跟源字符串比：浏览器会把刚写进去的 HTML 重新序列化
 * （自闭合标签 `<line/>` 变 `<line>`、`style` 补分号与空格、属性顺序变化），于是
 * 「永远不相等」→ 每次都重写，去抖等于没做（217 批真机验收实测）。比较前先用
 * `<template>` 把源字符串过一遍同一个序列化器，拿到浏览器眼里的规范形态。
 */
function normalizedIconHtml(iconHtml) {
  if (typeof document === 'undefined' || !document.createElement) return iconHtml;
  const cached = normalizedIconCache.get(iconHtml);
  if (cached !== undefined) return cached;
  const template = document.createElement('template');
  template.innerHTML = iconHtml;
  normalizedIconCache.set(iconHtml, template.innerHTML);
  return template.innerHTML;
}
function setGenerateButtonIcon(el, iconHtml) {
  if (!el) return;
  if (el.innerHTML !== normalizedIconHtml(iconHtml)) el.innerHTML = iconHtml;
}
function generateButtonText(value, item = {}) {
  return t('previewGenerateButton.' + value, item);
}
function normalizeTitle(key) {
  const generateButtonText2 = generateButtonText('generate');
  return String(key || generateButtonText2).trim() || generateButtonText2;
}
function applyTooltip(el, index) {
  if (!el?.dataset) return;
  const result = String(index || '').trim();
  if (result) el.dataset.tooltip = result;
  else delete el.dataset.tooltip;
}
export function setGenerateButtonLoadingUi(
  el2,
  {
    title: title = generateButtonText('generate'),
    tooltip: tooltip = '',
    disabled: disabled = true,
    ariaLabel: ariaLabel = '',
  } = {},
) {
  if (!el2) return;
  el2.disabled = disabled === true;
  if (el2.style) el2.style.color = '';
  (el2.classList?.remove?.('is-rh-busy', 'is-task-cancel'), applyTooltip(el2, tooltip));
  const title2 = normalizeTitle(ariaLabel || title);
  (el2.setAttribute?.('aria-label', title2),
    (el2.title = normalizeTitle(title)),
    setGenerateButtonIcon(el2, GENERATE_LOADING_ICON_HTML));
}
export function setGenerateButtonCancellableUi(
  el3,
  {
    title: title = generateButtonText('clickCancelTask'),
    tooltip: tooltip = generateButtonText('clickCancelTask'),
    ariaLabel: ariaLabel = generateButtonText('cancelGenerate'),
    color: color = 'var(--white)',
    busy: busy = false,
  } = {},
) {
  if (!el3) return;
  el3.disabled = false;
  if (el3.style) el3.style.color = color;
  (el3.classList?.toggle?.('is-rh-busy', busy === true),
    el3.classList?.add?.('is-task-cancel'),
    applyTooltip(el3, tooltip),
    el3.setAttribute?.('aria-label', String(ariaLabel || generateButtonText('cancelGenerate'))),
    (el3.title = String(title || generateButtonText('clickCancelTask'))),
    setGenerateButtonIcon(el3, GENERATE_CANCEL_ICON_HTML));
}
export function resetGenerateButtonIdleUi(el4, generateButtonText3 = generateButtonText('generate')) {
  if (!el4) return;
  el4.disabled = false;
  if (el4.style) el4.style.color = '';
  (el4.classList?.remove?.('is-rh-busy', 'is-task-cancel'),
    applyTooltip(el4, ''),
    el4.setAttribute?.('aria-label', normalizeTitle(generateButtonText3)),
    (el4.title = normalizeTitle(generateButtonText3)),
    setGenerateButtonIcon(el4, GENERATE_ICON_HTML));
}
export function setPreviewGenerateButtonLoading(data) {
  setGenerateButtonLoadingUi(data);
}
export function resetPreviewGenerateButton(options, generateButtonText4 = generateButtonText('generate')) {
  resetGenerateButtonIdleUi(options, generateButtonText4);
}
export function createPreviewGenerateButtonCallbacks(
  target,
  generateButtonText5 = generateButtonText('generate'),
) {
  return {
    onStart() {
      setPreviewGenerateButtonLoading(target?.btnEl);
    },
    onStop() {
      (resetPreviewGenerateButton(target?.btnEl, generateButtonText5), target?._updateSubmitButtonState?.());
    },
  };
}

/**
 * 后台品牌配置的落地逻辑（关于页署名 / 外链 / 页脚 / 反馈群）。
 *
 * 刻意做成**无 import 的纯函数模块**：productBranding.js 依赖 i18n 与全局 document，
 * 在 node 单测里加载会牵扯一大片；而这段逻辑正是需要被测试覆盖的部分
 * （换牌时这里漏改过一次，作者署名与外链都指向了旧品牌）。
 */
const ABOUT_LINK_LABEL_ATTR = '[data-i18n="about.bilibili"]';

/** 只接受无用户信息的 http(s) 链接：后台配错时宁可不换，也不能指向 javascript: 之类协议。 */
export function safeExternalUrl(value) {
  const text = String(value || '').trim();
  if (!/^https?:\/\/[^\s]+$/i.test(text)) return '';
  try {
    const parsed = new URL(text);
    if (parsed.username || parsed.password) return '';
  } catch {
    return '';
  }
  return text;
}

/**
 * 把 brand 配置写进 DOM。只覆盖后台**显式配置过**的项，其余保持内置文案，
 * 这样「后台没配」不会把界面洗成空白。
 */
export function applyBrandIdentity(root, brand) {
  if (!root || typeof root.querySelector !== 'function') return;
  const config = brand && typeof brand === 'object' ? brand : {};

  const author = String(config.author || '').trim();
  if (author) {
    const node = root.querySelector('[data-brand-author]');
    if (node) node.textContent = author;
  }

  // 关于页外链：取第一条合法链接覆盖内置按钮（换了就换，不留旧地址）
  const links = Array.isArray(config.aboutLinks) ? config.aboutLinks : [];
  const first = links.find((item) => item && safeExternalUrl(item.url));
  if (first) {
    const button = root.querySelector('[data-brand-about-link]');
    if (button) {
      button.dataset.externalUrl = safeExternalUrl(first.url);
      const label = button.querySelector(ABOUT_LINK_LABEL_ATTR);
      const text = String(first.label || '').trim();
      if (label && text) label.textContent = text;
    }
  }

  const footer = String(config.footer || '').trim();
  if (footer) {
    const node = root.querySelector('[data-product-name-footer]');
    if (node) node.textContent = footer;
  }

  const qrUrl = safeExternalUrl(config.feedbackQrUrl);
  if (qrUrl) {
    const image = typeof root.getElementById === 'function'
      ? root.getElementById('feedbackGroupQrImage')
      : root.querySelector('#feedbackGroupQrImage');
    if (image) image.src = qrUrl;
  }

  const wechat = String(config.feedbackWechat || '').trim();
  if (wechat) {
    const node = root.querySelector('[data-brand-feedback-desc]');
    if (node) node.textContent = `如果失效请加:${wechat} 备注来意`;
  }
}

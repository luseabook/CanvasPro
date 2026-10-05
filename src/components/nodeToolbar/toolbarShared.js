import { t } from '../../i18n/index.js';
function toolbarText(value, item = {}) {
  return t('nodeToolbar.common.' + value, item);
}
export function showDevToast(text, key = '') {
  document.querySelectorAll('.v2-dev-toast').forEach((el) => el.remove());
  const el2 = document.createElement('div');
  el2.className = 'v2-dev-toast';
  if (key) {
    const el3 = document.createElement('div');
    ((el3.className = 'v2-dev-toast-icon'), (el3.textContent = key), el2.appendChild(el3));
  }
  const el4 = document.createElement('span');
  ((el4.className = 'v2-dev-toast-text'),
    (el4.textContent = toolbarText('developmentSuffix', { text: text })),
    el2.appendChild(el4),
    document.body.appendChild(el2),
    el2.offsetHeight,
    el2.classList.add('is-visible'),
    setTimeout(() => {
      (el2.classList.remove('is-visible'), setTimeout(() => el2.remove(), 300));
    }, 2000));
}

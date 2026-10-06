import { openExternalLink } from '../services/externalLinkService.js';
import { getLocale, onLocaleChange, t } from '../i18n/index.js';
function webReferenceText(value, item = {}) {
  return t('webReferenceCard.' + value, item);
}
function toText(key, index = '') {
  const result = String(key || '').trim();
  return result || index;
}
function formatCapturedAt(data) {
  const options = new Date(data);
  if (!Number.isFinite(options.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(getLocale(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(options);
  } catch {
    return options.toISOString().slice(0, 16).replace('T', ' ');
  }
}
function getHost(target) {
  try {
    return new URL(target).hostname;
  } catch {
    return '';
  }
}
export class WebReferenceCardNode {
  constructor(source) {
    ((this._data = source),
      (this.id = source.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component web-reference-card-component'),
      (this._unsubscribeLocale = null));
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const el = document.createElement('article');
    ((el.className = 'node-card web-reference-card'),
      (this._screenshot = document.createElement('img')),
      (this._screenshot.className = 'web-reference-card-shot'),
      (this._screenshot.alt = ''),
      (this._screenshot.referrerPolicy = 'no-referrer'));
    const el2 = document.createElement('div');
    return (
      (el2.className = 'web-reference-card-body'),
      (this._title = document.createElement('h3')),
      (this._title.className = 'web-reference-card-title'),
      (this._meta = document.createElement('div')),
      (this._meta.className = 'web-reference-card-meta'),
      (this._selectedText = document.createElement('p')),
      (this._selectedText.className = 'web-reference-card-selection'),
      (this._openButton = document.createElement('button')),
      (this._openButton.type = 'button'),
      (this._openButton.className = 'web-reference-card-open'),
      (this._openButton.textContent = webReferenceText('openSource')),
      this._openButton.addEventListener('pointerdown', (event) => event.stopPropagation()),
      this._openButton.addEventListener('click', () => this._openSource()),
      el2.appendChild(this._title),
      el2.appendChild(this._meta),
      el2.appendChild(this._selectedText),
      el2.appendChild(this._openButton),
      el.appendChild(this._screenshot),
      el.appendChild(el2),
      this.el.replaceChildren(el),
      this._syncDom(),
      this.el
    );
  }
  ['_openSource']() {
    const toText2 = toText(this._data?.webPageUrl);
    if (!toText2) return;
    void openExternalLink(toText2, { label: webReferenceText('sourceLabel') }).catch((error) => {
      globalThis.window?.showToast?.(error?.message || webReferenceText('openFailed'), 'error');
    });
  }
  ['_syncDom']() {
    const toText3 = toText(this._data?.webSourceTitle, webReferenceText('sourceLabel')),
      toText4 = toText(this._data?.webPageUrl),
      host = getHost(toText4),
      formatCapturedAt2 = formatCapturedAt(this._data?.webCapturedAt),
      toText5 = toText(this._data?.webSelectedText),
      toText6 = toText(this._data?.webScreenshotUrl);
    if (this._title) this._title.textContent = toText3;
    (this._meta &&
      ((this._meta.textContent = [host || toText4, formatCapturedAt2].filter(Boolean).join(' · ')),
      (this._meta.title = toText4)),
      this._selectedText &&
        ((this._selectedText.textContent = toText5 || webReferenceText('noSelection')),
        (this._selectedText.hidden = !toText5)),
      this._screenshot &&
        (toText6.startsWith('data:image/')
          ? ((this._screenshot.src = toText6), (this._screenshot.hidden = false))
          : (this._screenshot.removeAttribute('src'), (this._screenshot.hidden = true))),
      this._openButton &&
        ((this._openButton.textContent = webReferenceText('openSource')),
        (this._openButton.disabled = !toText4)));
  }
  ['update'](next) {
    ((this._data = next), this._syncDom());
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncDom());
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(), (this._unsubscribeLocale = null));
  }
}

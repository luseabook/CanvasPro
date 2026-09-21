import { openExternalLink } from '../services/externalLinkService.js';
import { getLocale, onLocaleChange, t } from '../i18n/index.js';
function webReferenceText(_0x453b62, _0x4f0688 = {}) {
  return t('webReferenceCard.' + _0x453b62, _0x4f0688);
}
function toText(_0xf05950, _0x44e85a = '') {
  const _0x5c9811 = String(_0xf05950 || '').trim();
  return _0x5c9811 || _0x44e85a;
}
function formatCapturedAt(_0x183d21) {
  const _0x3aed48 = new Date(_0x183d21);
  if (!Number.isFinite(_0x3aed48.getTime())) return '';
  try {
    return new Intl['DateTimeFormat'](getLocale(), {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(_0x3aed48);
  } catch {
    return _0x3aed48.toISOString().slice(0, 16).replace('T', ' ');
  }
}
function getHost(_0x1c5f96) {
  try {
    return new URL(_0x1c5f96).hostname;
  } catch {
    return '';
  }
}
export class WebReferenceCardNode {
  constructor(_0x1a4b10) {
    ((this._data = _0x1a4b10),
      (this.id = _0x1a4b10.id),
      (this.el = document.createElement('div')),
      (this.el.className = 'v2-node-component web-reference-card-component'),
      (this._unsubscribeLocale = null));
  }
  ['mount']() {
    this._subscribeLocaleChanges();
    const _0x450a8f = document.createElement('article');
    ((_0x450a8f.className = 'node-card web-reference-card'),
      (this._screenshot = document.createElement('img')),
      (this._screenshot.className = 'web-reference-card-shot'),
      (this._screenshot.alt = ''),
      (this._screenshot.referrerPolicy = 'no-referrer'));
    const _0x45826d = document.createElement('div');
    return (
      (_0x45826d.className = 'web-reference-card-body'),
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
      this._openButton.addEventListener('pointerdown', (_0x1e9414) => _0x1e9414.stopPropagation()),
      this._openButton.addEventListener('click', () => this._openSource()),
      _0x45826d.appendChild(this._title),
      _0x45826d.appendChild(this._meta),
      _0x45826d.appendChild(this._selectedText),
      _0x45826d.appendChild(this._openButton),
      _0x450a8f.appendChild(this._screenshot),
      _0x450a8f.appendChild(_0x45826d),
      this.el.replaceChildren(_0x450a8f),
      this._syncDom(),
      this.el
    );
  }
  ['_openSource']() {
    const _0x4f81ea = toText(this._data?.webPageUrl);
    if (!_0x4f81ea) return;
    void openExternalLink(_0x4f81ea, { label: webReferenceText('sourceLabel') }).catch((_0x5ac7c4) => {
      globalThis.window?.showToast?.(_0x5ac7c4?.message || webReferenceText('openFailed'), 'error');
    });
  }
  ['_syncDom']() {
    const _0x1d09f4 = toText(this._data?.webSourceTitle, webReferenceText('sourceLabel')),
      _0x38210e = toText(this._data?.webPageUrl),
      _0x58e7fd = getHost(_0x38210e),
      _0x1fd746 = formatCapturedAt(this._data?.webCapturedAt),
      _0x1747f5 = toText(this._data?.webSelectedText),
      _0x528fc4 = toText(this._data?.webScreenshotUrl);
    if (this._title) this._title.textContent = _0x1d09f4;
    (this._meta &&
      ((this._meta.textContent = [_0x58e7fd || _0x38210e, _0x1fd746].filter(Boolean).join(' · ')),
      (this._meta.title = _0x38210e)),
      this._selectedText &&
        ((this._selectedText.textContent = _0x1747f5 || webReferenceText('noSelection')),
        (this._selectedText.hidden = !_0x1747f5)),
      this._screenshot &&
        (_0x528fc4.startsWith('data:image/')
          ? ((this._screenshot.src = _0x528fc4), (this._screenshot.hidden = false))
          : (this._screenshot.removeAttribute('src'), (this._screenshot.hidden = true))),
      this._openButton &&
        ((this._openButton.textContent = webReferenceText('openSource')),
        (this._openButton.disabled = !_0x38210e)));
  }
  ['update'](_0x22ec84) {
    ((this._data = _0x22ec84), this._syncDom());
  }
  ['_subscribeLocaleChanges']() {
    if (this._unsubscribeLocale) return;
    this._unsubscribeLocale = onLocaleChange(() => this._syncDom());
  }
  ['unmount']() {
    (this._unsubscribeLocale?.(), (this._unsubscribeLocale = null));
  }
}

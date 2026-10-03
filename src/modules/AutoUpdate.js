import {
  applyUpdateFromServer,
  checkLocalUpdatePreviewFromServer,
  checkUpdateFromServer,
  pingUpdateCheckFromServer,
} from '../../api/updateApi.js';
import { getLocale, t } from '../i18n/index.js';
import { openExternalLink } from '../services/externalLinkService.js';
const CHECK_INTERVAL = 60 * 60 * 0x3e8,
  FALLBACK_RELEASE_URL = 'https://github.com/ashuoAI/AI-CanvasPro/releases/latest',
  _NS = 'http://www.w3.org/2000/svg';
let _dismissedSignature = '',
  _activeBannerInfo = null,
  _desktopUpdateInfo = null,
  _desktopUpdateUnsubscribe = null,
  _desktopUpdaterActive = false,
  _desktopInstallAfterDownload = false;
let desktopErrorEventSequence = 0;
let lastDesktopErrorEventId = null;
function autoUpdateText(_0x5eb5c6, _0x3fd1a6 = {}) {
  return t('autoUpdate.' + _0x5eb5c6, _0x3fd1a6);
}
function _getUpdateSignature(_0xb30098) {
  if (!_0xb30098 || typeof _0xb30098 !== 'object') return '';
  return [
    _0xb30098.previewOnly ? 'preview' : 'update',
    _0xb30098.localVersion || '',
    _0xb30098.remoteVersion || '',
    _0xb30098.downloadUrl || '',
    _0xb30098.previewVideoUrl || '',
    _0xb30098.notes || '',
  ].join('|');
}
function _removeBanner() {
  const _0x5c83e9 = document.getElementById('update-banner'),
    _0x143bb8 = document.getElementById('update-banner-backdrop');
  (_0x5c83e9?.classList?.remove?.('open'),
    _0x143bb8?.classList?.remove?.('open'),
    _0x5c83e9?.remove?.(),
    _0x143bb8?.remove?.(),
    (_activeBannerInfo = null),
    document.removeEventListener('keydown', _handleBannerKeydown));
}
function _dismissBanner(_0x3eae6c) {
  (_removeBanner(), (_dismissedSignature = _getUpdateSignature(_0x3eae6c)));
}
function _handleBannerKeydown(_0x4d62c5) {
  if (_0x4d62c5.key !== 'Escape' || !document.getElementById('update-banner')) return;
  (_0x4d62c5.preventDefault(), _removeBanner());
}
function _createSvgIcon(_0x24daa2, _0x4f73b1 = {}) {
  const _0x85f203 = document.createElementNS(_NS, 'svg');
  if (_0x4f73b1.spin) _0x85f203.classList.add('spin');
  (_0x85f203.setAttribute('viewBox', '0 0 24 24'),
    _0x85f203.setAttribute('fill', 'none'),
    _0x85f203.setAttribute('stroke', 'currentColor'),
    _0x85f203.setAttribute('stroke-width', '2.2'),
    _0x85f203.setAttribute('stroke-linecap', 'round'),
    _0x85f203.setAttribute('stroke-linejoin', 'round'));
  const _0x49e5ca = document.createElementNS(_NS, 'path');
  return (_0x49e5ca.setAttribute('d', _0x24daa2), _0x85f203.appendChild(_0x49e5ca), _0x85f203);
}
function _createSpinSvg(_0x5b670f) {
  const _0x59f3b1 = _createSvgIcon('M21 12a9 9 0 1 1-6.219-8.56', { spin: _0x5b670f }),
    _0xbbff75 = document.createElementNS(_NS, 'polyline');
  return (_0xbbff75.setAttribute('points', '16 3 21 3 21 8'), _0x59f3b1.appendChild(_0xbbff75), _0x59f3b1);
}
function _createDownloadSvg() {
  const _0x5e9be3 = document.createElementNS(_NS, 'svg');
  return (
    _0x5e9be3.setAttribute('viewBox', '0 0 24 24'),
    _0x5e9be3.setAttribute('fill', 'none'),
    _0x5e9be3.setAttribute('stroke', 'currentColor'),
    _0x5e9be3.setAttribute('stroke-width', '2.2'),
    _0x5e9be3.setAttribute('stroke-linecap', 'round'),
    _0x5e9be3.setAttribute('stroke-linejoin', 'round'),
    ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'].forEach((_0x521475) => {
      const _0x54e9c5 = document.createElementNS(_NS, 'path');
      (_0x54e9c5.setAttribute('d', _0x521475), _0x5e9be3.appendChild(_0x54e9c5));
    }),
    _0x5e9be3
  );
}
function _createUpdateSvg() {
  const _0x223235 = document.createElementNS(_NS, 'svg');
  return (
    _0x223235.setAttribute('viewBox', '0 0 24 24'),
    _0x223235.setAttribute('fill', 'none'),
    _0x223235.setAttribute('stroke', 'currentColor'),
    _0x223235.setAttribute('stroke-width', '2.2'),
    _0x223235.setAttribute('stroke-linecap', 'round'),
    _0x223235.setAttribute('stroke-linejoin', 'round'),
    ['M12 16V4', 'M7 9l5-5 5 5', 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'].forEach((_0x4be21b) => {
      const _0x4c2c1c = document.createElementNS(_NS, 'path');
      (_0x4c2c1c.setAttribute('d', _0x4be21b), _0x223235.appendChild(_0x4c2c1c));
    }),
    _0x223235
  );
}
function _setBtnContent(_0x25c9e6, _0x492923, _0x35dde8) {
  if (!_0x25c9e6) return;
  (_0x25c9e6.replaceChildren(),
    _0x25c9e6.appendChild(_0x492923 ? _createSpinSvg(true) : _createDownloadSvg()),
    _0x25c9e6.appendChild(document.createTextNode(' ' + _0x35dde8)));
}
function _formatPercent(_0x11c552) {
  const _0x1376e1 = Math.max(0, Math.min(100, Number(_0x11c552 || 0)));
  return Math.round(_0x1376e1) + '%';
}
function _formatPubDate(_0x1e883a) {
  if (!_0x1e883a) return '';
  const _0x470bda = new Date(_0x1e883a);
  if (Number.isNaN(_0x470bda.getTime())) return String(_0x1e883a);
  return _0x470bda.toLocaleString(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function _decodeHtmlText(_0x121776) {
  const _0x1446d8 = String(_0x121776 || '');
  if (!_0x1446d8) return '';
  const _0x1ef73f = document.createElement('textarea');
  return ((_0x1ef73f.innerHTML = _0x1446d8), _0x1ef73f.value);
}
function _htmlNotesToText(_0x45352c) {
  let _0x479ba7 = String(_0x45352c || '').trim();
  if (!/<\/?[a-z][\s\S]*>/i.test(_0x479ba7)) return _0x479ba7;
  return (
    (_0x479ba7 = _0x479ba7
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|h[1-6]|li|ul|ol|section|article|blockquote)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, '')),
    _decodeHtmlText(_0x479ba7)
  );
}
function _buildNotesText(_0x2d4c5a) {
  const _0x106a96 = _htmlNotesToText(_0x2d4c5a)
    .split(/\r?\n/)
    .map((_0x2bc0b9) => _0x2bc0b9.trim())
    .filter(Boolean);
  if (!_0x106a96.length) return autoUpdateText('notes.empty');
  return _0x106a96.join('\n');
}
function _cleanNotesHeading(_0x3272d7) {
  return String(_0x3272d7 || '')
    .replace(/^[\s#*>\-•]+/, '')
    .replace(/^[🎉✨🐛🔧✅⚠️📌]+\s*/u, '')
    .replace(/[：:]\s*$/, '')
    .trim();
}
function _isVersionTitleLine(_0x127209) {
  return /^(?:🎉\s*)?v?\d+(?:\.\d+){1,3}\s*版本更新/u.test(
    String(_0x127209 || '')
      .trim()
      .toLowerCase(),
  );
}
function _isReleaseFooterLine(_0x4e58bc) {
  const _0x312cfe = String(_0x4e58bc || '').trim();
  if (!_0x312cfe) return false;
  return (
    /^(?:AI-CanvasPro|updream-canvas)[！!]/u.test(_0x312cfe) ||
    /^注[：:]/u.test(_0x312cfe) ||
    /^BUG问题/u.test(_0x312cfe) ||
    /^https?:\/\//i.test(_0x312cfe) ||
    /反馈文档[：:]/u.test(_0x312cfe)
  );
}
function _isReleaseMetaLine(_0x1662c8) {
  return /^\[[a-zA-Z][a-zA-Z0-9_-]*\]\s*:/u.test(String(_0x1662c8 || '').trim());
}
function _parseUpdateNotes(_0x5ce111) {
  const _0x4a7f75 = _buildNotesText(_0x5ce111)
      .split(/\r?\n/)
      .map((_0x40ebf1) => _0x40ebf1.trim())
      .filter(Boolean)
      .filter((_0x265cda) => !_isVersionTitleLine(_0x265cda))
      .filter((_0x27cd16) => !_isReleaseMetaLine(_0x27cd16)),
    _0x2738f5 = [],
    _0xcc0cc2 = [],
    _0x364e3a = [];
  let _0x35d635 = null,
    _0x3c436a = false;
  const _0x4ed2f0 = (_0x16a683 = autoUpdateText('notes.defaultSectionTitle')) => {
    return (
      !_0x35d635 &&
        ((_0x35d635 = { title: _0x16a683, items: [], paragraphs: [] }), _0xcc0cc2.push(_0x35d635)),
      _0x35d635
    );
  };
  return (
    _0x4a7f75.forEach((_0x14a51b) => {
      if (_0x3c436a || _isReleaseFooterLine(_0x14a51b)) {
        ((_0x3c436a = true), _0x364e3a.push(_0x14a51b));
        return;
      }
      const _0x7900c4 = /^[-*•]\s+/.test(_0x14a51b),
        _0x194727 = _0x14a51b.replace(/^[-*•]\s+/, '').trim(),
        _0x1f0118 = _cleanNotesHeading(_0x14a51b),
        _0x557e3e =
          !_0x7900c4 &&
          /[：:]$/.test(_0x14a51b) &&
          /新增|修复|优化|更新|说明|注意|已知|内容/u.test(_0x1f0118);
      if (_0x557e3e && _0x1f0118) {
        ((_0x35d635 = { title: _0x1f0118, items: [], paragraphs: [] }), _0xcc0cc2.push(_0x35d635));
        return;
      }
      if (!_0x35d635 && !_0x7900c4) {
        _0x2738f5.push(_0x14a51b);
        return;
      }
      const _0x5bc213 = _0x4ed2f0();
      if (_0x7900c4 && _0x194727) {
        _0x5bc213.items.push(_0x194727);
        return;
      }
      _0x5bc213.paragraphs.push(_0x14a51b);
    }),
    {
      intro: _0x2738f5,
      sections: _0xcc0cc2.length
        ? _0xcc0cc2
        : [
            {
              title: autoUpdateText('notes.defaultSectionTitle'),
              items: [autoUpdateText('notes.empty')],
              paragraphs: [],
            },
          ],
      footer: _0x364e3a,
    }
  );
}
function _appendTextWithLinks(_0x3dcfae, _0x510882) {
  const _0x2b56de = String(_0x510882 || ''),
    _0x25894c = /(https?:\/\/[^\s]+)/gi;
  let _0x436b8d = 0,
    _0x1d39a5 = _0x25894c.exec(_0x2b56de);
  while (_0x1d39a5) {
    _0x1d39a5.index > _0x436b8d &&
      _0x3dcfae.appendChild(document.createTextNode(_0x2b56de.slice(_0x436b8d, _0x1d39a5.index)));
    const _0x5757ab = _0x1d39a5[0].replace(/[),.;，。；）]+$/u, ''),
      _0x892b4f = _0x1d39a5[0].slice(_0x5757ab.length),
      _0x4d4900 = document.createElement('a');
    ((_0x4d4900.className = 'update-banner-note-link'),
      (_0x4d4900.href = _0x5757ab),
      (_0x4d4900.dataset.externalUrl = _0x5757ab),
      (_0x4d4900.textContent = _0x5757ab),
      _0x3dcfae.appendChild(_0x4d4900));
    if (_0x892b4f) _0x3dcfae.appendChild(document.createTextNode(_0x892b4f));
    ((_0x436b8d = _0x1d39a5.index + _0x1d39a5[0].length), (_0x1d39a5 = _0x25894c.exec(_0x2b56de)));
  }
  _0x436b8d < _0x2b56de.length && _0x3dcfae.appendChild(document.createTextNode(_0x2b56de.slice(_0x436b8d)));
}
function _createNotesPanel(_0x4ad9a0) {
  const _0xa60e9f = _parseUpdateNotes(_0x4ad9a0),
    _0x3978ab = document.createElement('div');
  ((_0x3978ab.className = 'update-banner-notes'), (_0x3978ab.id = 'update-banner-notes'));
  const _0x2ffb4a = document.createElement('div');
  ((_0x2ffb4a.className = 'update-banner-section-title'),
    (_0x2ffb4a.textContent = autoUpdateText('notes.defaultSectionTitle')));
  const _0x343ae2 = document.createElement('div');
  _0x343ae2.className = 'update-banner-notes-scroll';
  if (_0xa60e9f.intro.length) {
    const _0x162fc4 = document.createElement('div');
    ((_0x162fc4.className = 'update-banner-note-intro'),
      _0xa60e9f.intro.forEach((_0x3d7c63) => {
        const _0x4d56ed = document.createElement('p');
        ((_0x4d56ed.className = 'update-banner-note-paragraph'),
          _appendTextWithLinks(_0x4d56ed, _0x3d7c63),
          _0x162fc4.appendChild(_0x4d56ed));
      }),
      _0x343ae2.appendChild(_0x162fc4));
  }
  _0xa60e9f.sections.forEach((_0x3ddabb) => {
    const _0x4e58ba = document.createElement('section');
    _0x4e58ba.className = 'update-banner-note-section';
    const _0x176e21 = document.createElement('div');
    ((_0x176e21.className = 'update-banner-note-heading'),
      (_0x176e21.textContent = _0x3ddabb.title),
      _0x4e58ba.appendChild(_0x176e21),
      _0x3ddabb.paragraphs.forEach((_0x7ecbda) => {
        const _0x5e2855 = document.createElement('p');
        ((_0x5e2855.className = 'update-banner-note-paragraph'),
          _appendTextWithLinks(_0x5e2855, _0x7ecbda),
          _0x4e58ba.appendChild(_0x5e2855));
      }));
    if (_0x3ddabb.items.length) {
      const _0x5c86e5 = document.createElement('ul');
      ((_0x5c86e5.className = 'update-banner-note-list'),
        _0x3ddabb.items.forEach((_0x47f758) => {
          const _0x4300af = document.createElement('li');
          (_appendTextWithLinks(_0x4300af, _0x47f758), _0x5c86e5.appendChild(_0x4300af));
        }),
        _0x4e58ba.appendChild(_0x5c86e5));
    }
    _0x343ae2.appendChild(_0x4e58ba);
  });
  if (_0xa60e9f.footer.length) {
    const _0x586c91 = document.createElement('section');
    _0x586c91.className = 'update-banner-note-footer';
    const _0x43f4c3 = document.createElement('div');
    ((_0x43f4c3.className = 'update-banner-note-footer-title'),
      (_0x43f4c3.textContent = autoUpdateText('notes.releaseFooterTitle')),
      _0x586c91.appendChild(_0x43f4c3),
      _0xa60e9f.footer.forEach((_0x3c462f) => {
        const _0x28dd42 = document.createElement('p');
        ((_0x28dd42.className = 'update-banner-note-paragraph'),
          _appendTextWithLinks(_0x28dd42, _0x3c462f),
          _0x586c91.appendChild(_0x28dd42));
      }),
      _0x343ae2.appendChild(_0x586c91));
  }
  return (_0x3978ab.appendChild(_0x2ffb4a), _0x3978ab.appendChild(_0x343ae2), _0x3978ab);
}
function _normalizeHttpUrl(_0x100f5c) {
  const _0x18cfd8 = String(_0x100f5c || '').trim();
  if (!_0x18cfd8) return '';
  const _0x470a72 = _0x18cfd8.startsWith('//') ? 'https:' + _0x18cfd8 : _0x18cfd8;
  if (!/^https?:\/\//i.test(_0x470a72)) return '';
  try {
    const _0x21e4b9 = new URL(_0x470a72);
    if (_0x21e4b9.protocol !== 'http:' && _0x21e4b9.protocol !== 'https:') return '';
    return _0x21e4b9.toString();
  } catch (_0x228db9) {
    return '';
  }
}
function _isDirectVideoUrl(_0x57334c) {
  try {
    return /\.(mp4|webm|ogg|m4v|mov)$/i.test(new URL(_0x57334c).pathname);
  } catch (_0x14e54b) {
    return false;
  }
}
function _isBilibiliHost(_0x8719e7) {
  const _0x343e58 = String(_0x8719e7 || '').toLowerCase();
  return _0x343e58 === 'bilibili.com' || _0x343e58.endsWith('.bilibili.com');
}
function _buildBilibiliPlayerUrl(_0x40503f) {
  try {
    const _0x29f8f5 = new URL(_0x40503f);
    if (!_isBilibiliHost(_0x29f8f5.hostname)) return '';
    if (_0x29f8f5.hostname.toLowerCase() === 'player.bilibili.com')
      return (_0x29f8f5.searchParams.set('autoplay', '0'), _0x29f8f5.toString());
    const _0x5b0b7a = _0x29f8f5.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/),
      _0x175ab7 = _0x29f8f5.pathname.match(/\/video\/av(\d+)/i);
    if (!_0x5b0b7a && !_0x175ab7) return '';
    const _0x2b076b = new URL('https://player.bilibili.com/player.html');
    return (
      _0x5b0b7a
        ? _0x2b076b.searchParams.set('bvid', _0x5b0b7a[1])
        : _0x2b076b.searchParams.set('aid', _0x175ab7[1]),
      _0x2b076b.searchParams.set('page', _0x29f8f5.searchParams.get('p') || '1'),
      _0x2b076b.searchParams.set('autoplay', '0'),
      _0x2b076b.toString()
    );
  } catch (_0x4b8d4f) {
    return '';
  }
}
function _createPreviewVideo(_0x509a41) {
  const _0x4416fb = _normalizeHttpUrl(_0x509a41?.previewVideoUrl || _0x509a41?.preview_video_url);
  if (!_0x4416fb) return null;
  const _0x14c43e = document.createElement('div');
  _0x14c43e.className = 'update-banner-video-wrap';
  const _0x21c80c = document.createElement('div');
  _0x21c80c.className = 'update-banner-video-shell';
  if (_isDirectVideoUrl(_0x4416fb)) {
    const _0x21e2b0 = document.createElement('video');
    return (
      (_0x21e2b0.className = 'update-banner-video'),
      (_0x21e2b0.controls = true),
      (_0x21e2b0.playsInline = true),
      (_0x21e2b0.preload = 'metadata'),
      (_0x21e2b0.src = _0x4416fb),
      _0x21c80c.appendChild(_0x21e2b0),
      _0x14c43e.appendChild(_0x21c80c),
      _0x14c43e
    );
  }
  const _0x160dd4 = document.createElement('iframe');
  return (
    (_0x160dd4.className = 'update-banner-video-frame'),
    (_0x160dd4.src = _buildBilibiliPlayerUrl(_0x4416fb) || _0x4416fb),
    (_0x160dd4.loading = 'lazy'),
    (_0x160dd4.allow = 'autoplay; fullscreen; picture-in-picture'),
    (_0x160dd4.allowFullscreen = true),
    (_0x160dd4.referrerPolicy = 'no-referrer-when-downgrade'),
    _0x21c80c.appendChild(_0x160dd4),
    _0x14c43e.appendChild(_0x21c80c),
    _0x14c43e
  );
}
function _createTutorialVideoList(_0x57f3d2) {
  const _0x91544b = Array.isArray(_0x57f3d2) ? _0x57f3d2 : [],
    _0xb772f3 = _0x91544b
      .map((_0x286357) => ({
        title: String(_0x286357?.title || '').trim(),
        url: String(_0x286357?.url || '').trim(),
      }))
      .filter((_0x3f15cf) => _0x3f15cf.title && _normalizeHttpUrl(_0x3f15cf.url));
  if (!_0xb772f3.length) return null;
  const _0x3ec1da = document.createElement('div');
  return (
    (_0x3ec1da.className = 'update-banner-video-list'),
    _0xb772f3.forEach((_0x479d97) => {
      const _0x17fb23 = document.createElement('section');
      _0x17fb23.className = 'update-banner-video-item';
      const _0xaf0bf7 = document.createElement('div');
      ((_0xaf0bf7.className = 'update-banner-video-item-title'), (_0xaf0bf7.textContent = _0x479d97.title));
      const _0x4b37c7 = _createPreviewVideo({ previewVideoUrl: _0x479d97.url });
      _0x17fb23.appendChild(_0xaf0bf7);
      if (_0x4b37c7) _0x17fb23.appendChild(_0x4b37c7);
      _0x3ec1da.appendChild(_0x17fb23);
    }),
    _0x3ec1da
  );
}
function _openDownload(_0x3a53d6) {
  const _0x157e44 = _0x3a53d6?.downloadUrl || _0x3a53d6?.releaseUrl || FALLBACK_RELEASE_URL;
  void openExternalLink(_0x157e44, { label: autoUpdateText('externalLabels.download') }).catch(() => {
    window.showToast?.(autoUpdateText('toasts.openDownloadFailed'), 'error');
  });
}
function _openReleasePage(_0x44b9e2) {
  const _0xafb012 = _0x44b9e2?.releaseUrl || FALLBACK_RELEASE_URL;
  void openExternalLink(_0xafb012, { label: autoUpdateText('externalLabels.releasePage') }).catch(() => {
    window.showToast?.(autoUpdateText('toasts.openReleaseFailed'), 'error');
  });
}
function _setDownloadFallback(_0x3bf09d, _0x26088a) {
  const _0xb5803b = document.getElementById('update-banner-btn'),
    _0x4b0ee6 = document.getElementById('update-banner-sub');
  (_0x4b0ee6 && _0x26088a && ((_0x4b0ee6.textContent = _0x26088a), _0x4b0ee6.classList.add('is-error')),
    _0xb5803b?.classList?.add?.('is-download'),
    _setBtnContent(_0xb5803b, false, autoUpdateText('buttons.downloadLatest')),
    _0xb5803b && ((_0xb5803b.disabled = false), (_0xb5803b.onclick = () => _openDownload(_0x3bf09d))));
}
function _setUpdateProgress(_0x8407de, _0x3d1f8c = '') {
  const _0x4dffa9 = document.getElementById('update-banner-progress'),
    _0x514ec7 = document.getElementById('update-banner-progress-bar'),
    _0x4d51cc = document.getElementById('update-banner-progress-text');
  if (!_0x4dffa9 || !_0x514ec7 || !_0x4d51cc) return;
  const _0x4e619e = _formatPercent(_0x8407de);
  ((_0x4dffa9.hidden = false),
    (_0x514ec7.style.width = _0x4e619e),
    (_0x4d51cc.textContent = _0x3d1f8c || autoUpdateText('progress.downloading', { percent: _0x4e619e })));
}
function _setDesktopDownloadInPlace(_0x461628 = {}, { retrying: retrying = false } = {}) {
  const _0x50346e = document.getElementById('update-banner');
  if (!_0x50346e) return false;
  const _0x7998eb = document.getElementById('update-banner-sub'),
    _0xc31030 = document.getElementById('update-banner-btn'),
    _0x389cdf = document.getElementById('update-banner-close'),
    _0x2676a4 = Number(_0x461628.retryCount || 0),
    _0x4cd20a = retrying
      ? autoUpdateText('progress.retrying', { count: _0x2676a4 })
      : autoUpdateText('progress.downloading', { percent: '0%' });
  _0x7998eb &&
    (_0x7998eb.classList.remove('is-error'),
    (_0x7998eb.textContent = retrying
      ? autoUpdateText('status.autoRetry')
      : autoUpdateText('status.downloadingAutoInstall')));
  (_setUpdateProgress(0, _0x4cd20a),
    _setBtnContent(
      _0xc31030,
      true,
      retrying ? autoUpdateText('buttons.retrying') : autoUpdateText('buttons.downloading'),
    ));
  if (_0xc31030) _0xc31030.disabled = true;
  if (_0x389cdf) _0x389cdf.disabled = true;
  return true;
}
function _showBanner(_0x4f4700, _0x28344d = {}) {
  if (_0x28344d.replace) _removeBanner();
  if (!_0x28344d.ignoreDismissed && _dismissedSignature === _getUpdateSignature(_0x4f4700)) return;
  if (document.getElementById('update-banner')) return;
  const _0x76d9a4 = _0x4f4700.hasUpdate !== false,
    _0x496730 = _0x4f4700.remoteVersion || autoUpdateText('versions.newVersion'),
    _0x40aa74 = _0x4f4700.localVersion || autoUpdateText('versions.currentVersion'),
    _0x389541 = _formatPubDate(_0x4f4700.pubDate),
    _0x187c2f = Boolean(_0x4f4700.previewOnly),
    _0x3fe1b8 = document.createElement('div');
  ((_0x3fe1b8.id = 'update-banner'), (_0x3fe1b8.className = 'update-banner'));
  const _0x493278 = document.createElement('div');
  ((_0x493278.id = 'update-banner-backdrop'),
    (_0x493278.className = 'update-banner-backdrop'),
    _0x493278.setAttribute('aria-hidden', 'true'));
  const _0x18d6f8 = document.createElement('div');
  _0x18d6f8.className = 'update-banner-header';
  const _0x4a4666 = document.createElement('span');
  ((_0x4a4666.className = 'update-banner-icon'),
    _0x4a4666.setAttribute('aria-hidden', 'true'),
    _0x4a4666.appendChild(_createUpdateSvg()));
  const _0x48896d = document.createElement('div');
  _0x48896d.className = 'update-banner-header-title';
  if (_0x4f4700.titleText) _0x48896d.textContent = _0x4f4700.titleText;
  else {
    const _0x995a59 = document.createElement('span');
    ((_0x995a59.textContent = autoUpdateText('banner.versionUpdateTitle', { version: _0x496730 })),
      _0x48896d.appendChild(_0x995a59));
    if (_0x40aa74) {
      const _0x477860 = document.createElement('span');
      ((_0x477860.className = 'update-banner-header-current'),
        (_0x477860.textContent = autoUpdateText('banner.currentVersionSuffix', { version: _0x40aa74 })),
        _0x48896d.appendChild(_0x477860));
    }
  }
  const _0x28dbeb = document.createElement('button');
  ((_0x28dbeb.type = 'button'),
    (_0x28dbeb.className = 'update-banner-close'),
    (_0x28dbeb.id = 'update-banner-close'),
    _0x28dbeb.setAttribute('aria-label', autoUpdateText('banner.closeAria')),
    (_0x28dbeb.title = autoUpdateText('buttons.close')),
    (_0x28dbeb.textContent = '×'),
    _0x18d6f8.appendChild(_0x4a4666),
    _0x18d6f8.appendChild(_0x48896d),
    _0x18d6f8.appendChild(_0x28dbeb));
  const _0x370999 = document.createElement('div');
  _0x370999.className = 'update-banner-text';
  const _0x18e032 = document.createElement('div');
  ((_0x18e032.className = 'update-banner-sub'),
    (_0x18e032.id = 'update-banner-sub'),
    (_0x18e032.textContent =
      _0x4f4700.subtitleText ||
      (_0x187c2f
        ? autoUpdateText('banner.subtitleCurrent', { localVersion: _0x40aa74 })
        : _0x389541
          ? autoUpdateText('banner.subtitleWithDate', { localVersion: _0x40aa74, pubDate: _0x389541 })
          : _0x76d9a4
            ? autoUpdateText('banner.subtitleCurrent', { localVersion: _0x40aa74 })
            : autoUpdateText('banner.subtitleNoUpdate', {
                localVersion: _0x40aa74,
                remoteVersion: _0x496730,
              }))));
  const _0x3818be = document.createElement('div');
  ((_0x3818be.className = 'update-banner-progress'),
    (_0x3818be.id = 'update-banner-progress'),
    (_0x3818be.hidden = !_0x4f4700.showProgress));
  const _0x30dde1 = document.createElement('div');
  _0x30dde1.className = 'update-banner-progress-track';
  const _0x3371a8 = document.createElement('div');
  ((_0x3371a8.className = 'update-banner-progress-bar'),
    (_0x3371a8.id = 'update-banner-progress-bar'),
    (_0x3371a8.style.width = _formatPercent(_0x4f4700.progressPercent)));
  const _0x2ffe4f = document.createElement('div');
  ((_0x2ffe4f.className = 'update-banner-progress-text'),
    (_0x2ffe4f.id = 'update-banner-progress-text'),
    (_0x2ffe4f.textContent =
      _0x4f4700.progressText ||
      autoUpdateText('progress.downloading', { percent: _formatPercent(_0x4f4700.progressPercent) })),
    _0x30dde1.appendChild(_0x3371a8),
    _0x3818be.appendChild(_0x30dde1),
    _0x3818be.appendChild(_0x2ffe4f));
  const _0x5bc252 = _createNotesPanel(_0x4f4700.notes),
    _0x2b8494 = _createPreviewVideo(_0x4f4700),
    _0x2545ad = _createTutorialVideoList(_0x4f4700.tutorialVideos);
  if (!_0x4f4700.hideSubtitle) _0x370999.appendChild(_0x18e032);
  _0x370999.appendChild(_0x3818be);
  if (_0x2b8494) _0x370999.appendChild(_0x2b8494);
  if (_0x2545ad) _0x370999.appendChild(_0x2545ad);
  if (!_0x4f4700.hideNotes) _0x370999.appendChild(_0x5bc252);
  const _0x126603 = document.createElement('div');
  _0x126603.className = 'update-banner-actions';
  if (!_0x4f4700.hideCancelButton) {
    const _0x2d85b1 = document.createElement('button');
    ((_0x2d85b1.type = 'button'),
      (_0x2d85b1.className = 'update-banner-btn update-banner-btn-secondary'),
      (_0x2d85b1.textContent =
        _0x4f4700.cancelText ||
        (_0x187c2f ? autoUpdateText('buttons.close') : autoUpdateText('buttons.cancel'))),
      (_0x2d85b1.onclick = () => {
        if (typeof _0x4f4700.cancelAction === 'function') {
          _0x4f4700.cancelAction(_0x4f4700);
          return;
        }
        _removeBanner();
      }),
      _0x126603.appendChild(_0x2d85b1));
  }
  if (!_0x187c2f && _0x76d9a4 && !_0x4f4700.disableSkip) {
    const _0xe394b1 = document.createElement('button');
    ((_0xe394b1.type = 'button'),
      (_0xe394b1.className = 'update-banner-btn update-banner-btn-secondary'),
      (_0xe394b1.textContent = autoUpdateText('buttons.skipVersion')),
      (_0xe394b1.onclick = () => _dismissBanner(_0x4f4700)),
      _0x126603.appendChild(_0xe394b1));
  }
  const _0x12eac9 = document.createElement('button');
  ((_0x12eac9.type = 'button'),
    (_0x12eac9.className = 'update-banner-btn'),
    (_0x12eac9.id = 'update-banner-btn'));
  if (_0x187c2f)
    (_0x12eac9.classList.add('is-primary'),
      _setBtnContent(_0x12eac9, false, _0x4f4700.previewCloseText || autoUpdateText('buttons.gotIt')),
      (_0x12eac9.onclick = () => _removeBanner()));
  else {
    if (_0x4f4700.installDownloadedUpdate)
      (_0x12eac9.classList.add('is-primary'),
        _setBtnContent(_0x12eac9, false, autoUpdateText('buttons.restartInstall')),
        (_0x12eac9.onclick = () => _installDownloadedDesktopUpdate(_0x12eac9)));
    else {
      if (_0x4f4700.retryDesktopDownload)
        (_0x12eac9.classList.add('is-primary'),
          _setBtnContent(_0x12eac9, false, autoUpdateText('buttons.retryDownloadInstall')),
          (_0x12eac9.onclick = () => _downloadDesktopUpdate(_0x12eac9)));
      else {
        if (_0x4f4700.startDesktopDownload)
          (_0x12eac9.classList.add('is-primary'),
            _setBtnContent(_0x12eac9, false, autoUpdateText('buttons.downloadInstall')),
            (_0x12eac9.onclick = () => _downloadDesktopUpdate(_0x12eac9)));
        else {
          if (_0x4f4700.canHotApply)
            (_0x12eac9.classList.add('is-primary'),
              _setBtnContent(_0x12eac9, false, autoUpdateText('buttons.updateNow')),
              (_0x12eac9.onclick = () => _doApply(_0x4f4700)));
          else
            !_0x76d9a4
              ? (_0x12eac9.classList.add('is-download'),
                _setBtnContent(_0x12eac9, false, autoUpdateText('buttons.viewRelease')),
                (_0x12eac9.onclick = () => _openReleasePage(_0x4f4700)))
              : (_0x12eac9.classList.add('is-download'),
                _setBtnContent(_0x12eac9, false, autoUpdateText('buttons.downloadLatest')),
                (_0x12eac9.onclick = () => _openDownload(_0x4f4700)));
        }
      }
    }
  }
  (_0x126603.appendChild(_0x12eac9),
    _0x3fe1b8.appendChild(_0x18d6f8),
    _0x3fe1b8.appendChild(_0x370999),
    _0x3fe1b8.appendChild(_0x126603),
    document.body.appendChild(_0x493278),
    document.body.appendChild(_0x3fe1b8),
    _0x493278.classList.add('open'),
    _0x3fe1b8.classList.add('open'),
    (_activeBannerInfo = _0x4f4700),
    document.addEventListener('keydown', _handleBannerKeydown),
    (_0x28dbeb.onclick = () => _removeBanner()));
}
async function _downloadDesktopUpdate(_0x301b8b) {
  const _0x49ec48 = window.aiCanvasDesktop;
  if (!_0x49ec48?.downloadUpdate) return;
  (_setBtnContent(_0x301b8b, true, autoUpdateText('buttons.preparingDownload')),
    (_0x301b8b.disabled = true),
    (_desktopInstallAfterDownload = true));
  try {
    await _0x49ec48.downloadUpdate();
  } catch (_0x1fda35) {
    ((_desktopInstallAfterDownload = false),
      (_0x301b8b.disabled = false),
      _setBtnContent(_0x301b8b, false, autoUpdateText('buttons.downloadInstall')),
      window.showToast?.(autoUpdateText('toasts.downloadFailed')));
  }
}
async function _installDownloadedDesktopUpdate(_0x556375) {
  const _0x2c908f = window.aiCanvasDesktop;
  if (!_0x2c908f?.installDownloadedUpdate) return;
  _setBtnContent(_0x556375, true, autoUpdateText('buttons.restarting'));
  if (_0x556375) _0x556375.disabled = true;
  try {
    await _0x2c908f.installDownloadedUpdate();
  } catch (_0x397e5f) {
    if (_0x556375) _0x556375.disabled = false;
    (_setBtnContent(_0x556375, false, autoUpdateText('buttons.restartInstall')),
      window.showToast?.(autoUpdateText('toasts.restartInstallFailed')));
  }
}
async function _doApply(_0x20e57f) {
  if (_0x20e57f?.previewOnly) {
    window.showToast?.(autoUpdateText('toasts.previewOnly'));
    return;
  }
  if (!_0x20e57f?.canHotApply) {
    _openDownload(_0x20e57f);
    return;
  }
  const _0x41bc77 = document.getElementById('update-banner-btn'),
    _0x1f8381 = document.getElementById('update-banner-sub');
  (_0x1f8381?.classList?.remove?.('is-error'),
    _0x41bc77?.classList?.remove?.('is-download'),
    _setBtnContent(_0x41bc77, true, autoUpdateText('buttons.updating')));
  if (_0x41bc77) _0x41bc77.disabled = true;
  try {
    const _0xd9962d = await applyUpdateFromServer();
    if (_0xd9962d.success) {
      _setBtnContent(_0x41bc77, true, autoUpdateText('buttons.restartingWait'));
      const _0x47d599 = Date.now() + 0x7530,
        _0x3a1418 = async () => {
          if (Date.now() > _0x47d599) {
            location.reload();
            return;
          }
          try {
            const _0x23cafd = await pingUpdateCheckFromServer();
            if (_0x23cafd) {
              location.reload();
              return;
            }
          } catch (_0x4fad4d) {}
          setTimeout(_0x3a1418, 0x320);
        };
      setTimeout(_0x3a1418, 0x7d0);
      return;
    }
    _setDownloadFallback(
      _0x20e57f,
      autoUpdateText('errors.hotApplyFailed', {
        error: _0xd9962d.error || autoUpdateText('errors.unknownManualDownload'),
      }),
    );
  } catch (_0x45707d) {
    _setDownloadFallback(_0x20e57f, autoUpdateText('errors.networkManualDownload'));
  }
}
async function _checkUpdate() {
  if (window.aiCanvasDesktop?.isElectron || _desktopUpdaterActive) return;
  try {
    const _0x3ab390 = await checkUpdateFromServer();
    if (_0x3ab390?.hasUpdate) _showBanner(_0x3ab390);
  } catch (_0x37b682) {}
}
function _normalizeDesktopUpdateInfo(_0x54efeb) {
  const _0x15b58b = _0x54efeb && typeof _0x54efeb === 'object' ? _0x54efeb : {};
  return {
    version: String(_0x15b58b.version || '').trim(),
    releaseDate: _0x15b58b.releaseDate || '',
    releaseNotes: String(_0x15b58b.releaseNotes || '').trim(),
    previewVideoUrl: String(_0x15b58b.previewVideoUrl || _0x15b58b.preview_video_url || '').trim(),
  };
}
function _formatDesktopRemoteVersion(_0x38ace5) {
  const _0x40922c = String(_0x38ace5 || '').trim();
  if (!_0x40922c || _0x40922c === autoUpdateText('versions.newVersion'))
    return autoUpdateText('versions.newVersion');
  return _0x40922c.startsWith('V') ? _0x40922c : 'V' + _0x40922c;
}
async function _getDesktopLocalVersion() {
  try {
    const _0x2d97d2 = await window.aiCanvasDesktop?.getAppVersion?.();
    return _0x2d97d2 ? 'V' + _0x2d97d2 : autoUpdateText('versions.unknownVersion');
  } catch (_0x362b7d) {
    return autoUpdateText('versions.unknownVersion');
  }
}
async function _showDesktopUpdateBanner(_0x210c5a, _0x316fd3 = {}) {
  const _0x5bf2cb = _normalizeDesktopUpdateInfo(_0x316fd3.info || _desktopUpdateInfo);
  if (_0x5bf2cb.version) _desktopUpdateInfo = _0x5bf2cb;
  const _0x5b69af = _0x5bf2cb.version || autoUpdateText('versions.newVersion'),
    _0x59bdf9 = await _getDesktopLocalVersion(),
    _0x30504a = _formatDesktopRemoteVersion(_0x5b69af),
    _0x2a7e3e = _0x5bf2cb.releaseNotes || autoUpdateText('desktop.downloadedNotes'),
    _0xd44b06 = _0x210c5a === 'downloaded',
    _0x46b2c5 = _0x210c5a === 'downloading',
    _0x19e055 = _0x210c5a === 'retrying',
    _0x3938d4 = Number(_0x316fd3.percent || 0),
    _0x51de2f = _0x19e055
      ? autoUpdateText('progress.retrying', { count: Number(_0x316fd3.retryCount || 0) })
      : autoUpdateText('progress.downloading', { percent: _formatPercent(_0x3938d4) });
  _showBanner(
    {
      hasUpdate: true,
      localVersion: _0x59bdf9,
      remoteVersion: _0x30504a,
      pubDate: _0x5bf2cb.releaseDate || '',
      subtitleText: _0xd44b06
        ? autoUpdateText('desktop.subtitleDownloaded', { localVersion: _0x59bdf9, remoteVersion: _0x30504a })
        : _0x46b2c5 || _0x19e055
          ? autoUpdateText('desktop.subtitleDownloading', {
              localVersion: _0x59bdf9,
              remoteVersion: _0x30504a,
            })
          : autoUpdateText('desktop.subtitleAvailable', {
              localVersion: _0x59bdf9,
              remoteVersion: _0x30504a,
            }),
      notes: _0x2a7e3e,
      previewVideoUrl: _0xd44b06 ? '' : _0x5bf2cb.previewVideoUrl,
      canHotApply: false,
      startDesktopDownload: !_0xd44b06 && !_0x46b2c5 && !_0x19e055,
      installDownloadedUpdate: _0xd44b06,
      showProgress: _0x46b2c5 || _0x19e055,
      hideNotes: _0xd44b06,
      progressPercent: _0x3938d4,
      progressText: _0x51de2f,
      cancelText: _0xd44b06 ? autoUpdateText('buttons.later') : autoUpdateText('buttons.cancel'),
      disableSkip: true,
      hideSubtitle: false,
    },
    { replace: true, ignoreDismissed: true },
  );
}
async function _showDesktopDownloadFailedBanner(_0x4cc612 = {}) {
  const _0x3446bb = _normalizeDesktopUpdateInfo(_0x4cc612.info || _desktopUpdateInfo);
  if (_0x3446bb.version) _desktopUpdateInfo = _0x3446bb;
  const _0x588b7d = _0x3446bb.version || autoUpdateText('versions.newVersion'),
    _0x42b054 = await _getDesktopLocalVersion(),
    _0x313c07 = _formatDesktopRemoteVersion(_0x588b7d),
    _0x5412e6 = Number(_0x4cc612.retryCount || 0),
    _0x2b3eba = Number(_0x4cc612.maxRetries || 0),
    _0x123f8d = _0x4cc612.message || autoUpdateText('desktop.downloadFailedMessage');
  _showBanner(
    {
      hasUpdate: true,
      localVersion: _0x42b054,
      remoteVersion: _0x313c07,
      pubDate: _0x3446bb.releaseDate || '',
      subtitleText: _0x2b3eba
        ? autoUpdateText('desktop.downloadFailedWithRetries', {
            message: _0x123f8d,
            retryCount: _0x5412e6,
            maxRetries: _0x2b3eba,
          })
        : _0x123f8d,
      notes: _0x3446bb.releaseNotes || autoUpdateText('desktop.downloadFailedNotes'),
      previewVideoUrl: '',
      canHotApply: false,
      retryDesktopDownload: true,
      showProgress: false,
      hideNotes: true,
      cancelText: autoUpdateText('buttons.viewRelease'),
      cancelAction: () => _openReleasePage({ releaseUrl: FALLBACK_RELEASE_URL }),
      disableSkip: true,
      hideSubtitle: false,
    },
    { replace: true, ignoreDismissed: true },
  );
}
function _desktopEventFromState(_0x3ef6f4 = {}) {
  if (_0x3ef6f4.latestEvent) return _0x3ef6f4.latestEvent;
  if (!_0x3ef6f4.state || _0x3ef6f4.state === 'idle') return null;
  const _0x17ccd3 = {
      checking: 'checking',
      available: 'available',
      downloading: 'download-started',
      downloaded: 'downloaded',
      error: 'download-failed',
      installing: 'installing',
    },
    _0x20ff49 = _0x17ccd3[_0x3ef6f4.state];
  if (!_0x20ff49) return null;
  return {
    type: _0x20ff49,
    state: _0x3ef6f4.state,
    info: _0x3ef6f4.latestInfo || null,
    retryCount: _0x3ef6f4.retryCount || 0,
    maxRetries: _0x3ef6f4.maxRetries || 0,
  };
}
function _handleDesktopUpdaterEvent(_0x17f006) {
  if (!_0x17f006 || typeof _0x17f006 !== 'object') return;
  if (_0x17f006.type === 'checking') {
    _desktopUpdaterActive = true;
    return;
  }
  if (_0x17f006.type === 'available') {
    ((_desktopUpdaterActive = true), void _showDesktopUpdateBanner('available', _0x17f006));
    return;
  }
  if (_0x17f006.type === 'download-started') {
    _desktopUpdaterActive = true;
    if (_setDesktopDownloadInPlace(_0x17f006)) return;
    void _showDesktopUpdateBanner('downloading', _0x17f006);
    return;
  }
  if (_0x17f006.type === 'download-retry') {
    _desktopUpdaterActive = true;
    if (_setDesktopDownloadInPlace(_0x17f006, { retrying: true })) return;
    void _showDesktopUpdateBanner('retrying', _0x17f006);
    return;
  }
  if (_0x17f006.type === 'download-progress') {
    _desktopUpdaterActive = true;
    if (!document.getElementById('update-banner-progress')) {
      void _showDesktopUpdateBanner('downloading', _0x17f006);
      return;
    }
    _setUpdateProgress(
      _0x17f006.percent,
      autoUpdateText('progress.downloading', { percent: _formatPercent(_0x17f006.percent) }),
    );
    return;
  }
  if (_0x17f006.type === 'downloaded') {
    _desktopUpdaterActive = true;
    if (_desktopInstallAfterDownload) {
      _desktopInstallAfterDownload = false;
      const _0x1d758d = document.getElementById('update-banner-btn'),
        _0x30fc55 = document.getElementById('update-banner-sub');
      _0x30fc55 &&
        (_0x30fc55.classList.remove('is-error'),
        (_0x30fc55.textContent = autoUpdateText('status.downloadedRestarting')));
      _setBtnContent(_0x1d758d, true, autoUpdateText('buttons.restartingInstall'));
      if (_0x1d758d) _0x1d758d.disabled = true;
      void _installDownloadedDesktopUpdate(_0x1d758d);
      return;
    }
    void _showDesktopUpdateBanner('downloaded', _0x17f006);
    return;
  }
  if (_0x17f006.type === 'download-failed') {
    ((_desktopUpdaterActive = true),
      (_desktopInstallAfterDownload = false),
      void _showDesktopDownloadFailedBanner(_0x17f006));
    return;
  }
  if (_0x17f006.type === 'not-available') {
    _desktopUpdaterActive = false;
    if (_0x17f006.manual) window.showToast?.(autoUpdateText('toasts.alreadyLatest'));
    return;
  }
  if (_0x17f006.type === 'installing') {
    ((_desktopUpdaterActive = true), window.showToast?.(autoUpdateText('toasts.installing')));
    return;
  }
  if (_0x17f006.type === 'error') {
    _desktopInstallAfterDownload = false;
    if (_0x17f006.skipped) return;
    if (_0x17f006.eventId != null && _0x17f006.eventId === lastDesktopErrorEventId) return;
    lastDesktopErrorEventId = _0x17f006.eventId ?? null;
    desktopErrorEventSequence += 1;
    // Background update checks fail routinely (offline, missing release feed) and the raw
    // error message embeds the whole HTTP response header dump, which used to be toasted
    // across the bottom of the canvas. Only surface manual checks, with localized copy.
    if (_0x17f006.manual) window.showToast?.(autoUpdateText('toasts.desktopCheckFailed'), 'warn');
  }
}
function _bindDesktopUpdaterEvents() {
  const _0xec1fd8 = window.aiCanvasDesktop;
  if (!_0xec1fd8?.onUpdaterEvent || _desktopUpdateUnsubscribe) return;
  ((_desktopUpdateUnsubscribe = _0xec1fd8.onUpdaterEvent(_handleDesktopUpdaterEvent)),
    void _0xec1fd8
      .getUpdateState?.()
      .then((_0x3aca34) => {
        const _0x4139b4 = _desktopEventFromState(_0x3aca34);
        if (_0x4139b4) _handleDesktopUpdaterEvent(_0x4139b4);
      })
      .catch(() => {}));
}
export function initAutoUpdate() {
  (_bindDesktopUpdaterEvents(),
    setTimeout(_checkUpdate, 0x1388),
    setTimeout(_checkUpdate, 0x4e20),
    setInterval(_checkUpdate, CHECK_INTERVAL));
}
export async function showManualUpdateCheck() {
  if (window.aiCanvasDesktop?.isElectron) {
    const errorsBeforeCheck = desktopErrorEventSequence;
    try {
      (window.showToast?.(autoUpdateText('toasts.checkingDesktop')),
        await window.aiCanvasDesktop.checkForUpdates?.());
    } catch (_0x386dc0) {
      if (desktopErrorEventSequence === errorsBeforeCheck)
        window.showToast?.(autoUpdateText('toasts.desktopCheckFailed'), 'warning');
    }
    return;
  }
  try {
    window.showToast?.(autoUpdateText('toasts.checkingUpdate'));
    const _0x2d819b = await checkUpdateFromServer({ force: true, includeCurrent: true });
    if (_0x2d819b?.remoteVersion || _0x2d819b?.notes || _0x2d819b?.releaseUrl) {
      _showBanner(_0x2d819b, { replace: true, ignoreDismissed: true });
      return;
    }
    window.showToast?.(autoUpdateText('toasts.noRemoteInfo'));
  } catch (_0x30e665) {
    window.showToast?.(autoUpdateText('toasts.remoteCheckFailed'));
  }
}
export async function showLocalUpdatePreview() {
  try {
    window.showToast?.(autoUpdateText('toasts.generatingPreview'));
    const _0xa19721 = await checkLocalUpdatePreviewFromServer();
    if (_0xa19721?.previewOnly && (_0xa19721?.remoteVersion || _0xa19721?.notes)) {
      _showBanner(_0xa19721, { replace: true, ignoreDismissed: true });
      return;
    }
    window.showToast?.(autoUpdateText('toasts.noLocalPreview'));
  } catch (_0x48e282) {
    window.showToast?.(autoUpdateText('toasts.localPreviewFailed'));
  }
}
export function showTutorialVideoPanel(_0xf625b8) {
  const _0x5e8ecd = Array.isArray(_0xf625b8)
    ? _0xf625b8
    : [{ title: autoUpdateText('tutorial.defaultTitle'), url: _0xf625b8 }];
  _showBanner(
    {
      previewOnly: true,
      hasUpdate: false,
      localVersion: '',
      remoteVersion: autoUpdateText('tutorial.title'),
      titleText: autoUpdateText('tutorial.title'),
      subtitleText: autoUpdateText('tutorial.subtitle'),
      notes: '',
      tutorialVideos: _0x5e8ecd,
      canHotApply: false,
      hideNotes: true,
      hideCancelButton: true,
      previewCloseText: autoUpdateText('buttons.close'),
    },
    { replace: true, ignoreDismissed: true },
  );
}

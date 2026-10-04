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
function autoUpdateText(value, item = {}) {
  return t('autoUpdate.' + value, item);
}
function _getUpdateSignature(enabled) {
  if (!enabled || typeof enabled !== 'object') return '';
  return [
    enabled.previewOnly ? 'preview' : 'update',
    enabled.localVersion || '',
    enabled.remoteVersion || '',
    enabled.downloadUrl || '',
    enabled.previewVideoUrl || '',
    enabled.notes || '',
  ].join('|');
}
function _removeBanner() {
  const el = document.getElementById('update-banner'),
    el2 = document.getElementById('update-banner-backdrop');
  (el?.classList?.remove?.('open'),
    el2?.classList?.remove?.('open'),
    el?.remove?.(),
    el2?.remove?.(),
    (_activeBannerInfo = null),
    document.removeEventListener('keydown', _handleBannerKeydown));
}
function _dismissBanner(key) {
  (_removeBanner(), (_dismissedSignature = _getUpdateSignature(key)));
}
function _handleBannerKeydown(event) {
  if (event.key !== 'Escape' || !document.getElementById('update-banner')) return;
  (event.preventDefault(), _removeBanner());
}
function _createSvgIcon(index, result = {}) {
  const el3 = document.createElementNS(_NS, 'svg');
  if (result.spin) el3.classList.add('spin');
  (el3.setAttribute('viewBox', '0 0 24 24'),
    el3.setAttribute('fill', 'none'),
    el3.setAttribute('stroke', 'currentColor'),
    el3.setAttribute('stroke-width', '2.2'),
    el3.setAttribute('stroke-linecap', 'round'),
    el3.setAttribute('stroke-linejoin', 'round'));
  const el4 = document.createElementNS(_NS, 'path');
  return (el4.setAttribute('d', index), el3.appendChild(el4), el3);
}
function _createSpinSvg(spin) {
  const el5 = _createSvgIcon('M21 12a9 9 0 1 1-6.219-8.56', { spin: spin }),
    el6 = document.createElementNS(_NS, 'polyline');
  return (el6.setAttribute('points', '16 3 21 3 21 8'), el5.appendChild(el6), el5);
}
function _createDownloadSvg() {
  const el7 = document.createElementNS(_NS, 'svg');
  return (
    el7.setAttribute('viewBox', '0 0 24 24'),
    el7.setAttribute('fill', 'none'),
    el7.setAttribute('stroke', 'currentColor'),
    el7.setAttribute('stroke-width', '2.2'),
    el7.setAttribute('stroke-linecap', 'round'),
    el7.setAttribute('stroke-linejoin', 'round'),
    ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'].forEach((item2) => {
      const el8 = document.createElementNS(_NS, 'path');
      (el8.setAttribute('d', item2), el7.appendChild(el8));
    }),
    el7
  );
}
function _createUpdateSvg() {
  const el9 = document.createElementNS(_NS, 'svg');
  return (
    el9.setAttribute('viewBox', '0 0 24 24'),
    el9.setAttribute('fill', 'none'),
    el9.setAttribute('stroke', 'currentColor'),
    el9.setAttribute('stroke-width', '2.2'),
    el9.setAttribute('stroke-linecap', 'round'),
    el9.setAttribute('stroke-linejoin', 'round'),
    ['M12 16V4', 'M7 9l5-5 5 5', 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2'].forEach((item3) => {
      const el10 = document.createElementNS(_NS, 'path');
      (el10.setAttribute('d', item3), el9.appendChild(el10));
    }),
    el9
  );
}
function _setBtnContent(el11, data, options) {
  if (!el11) return;
  (el11.replaceChildren(),
    el11.appendChild(data ? _createSpinSvg(true) : _createDownloadSvg()),
    el11.appendChild(document.createTextNode(' ' + options)));
}
function _formatPercent(target) {
  const source = Math.max(0, Math.min(100, Number(target || 0)));
  return Math.round(source) + '%';
}
function _formatPubDate(enabled2) {
  if (!enabled2) return '';
  const next = new Date(enabled2);
  if (Number.isNaN(next.getTime())) return String(enabled2);
  return next.toLocaleString(getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function _decodeHtmlText(current) {
  const enabled3 = String(current || '');
  if (!enabled3) return '';
  const el12 = document.createElement('textarea');
  return ((el12.innerHTML = enabled3), el12.value);
}
function _htmlNotesToText(entry) {
  let record = String(entry || '').trim();
  if (!/<\/?[a-z][\s\S]*>/i.test(record)) return record;
  return (
    (record = record
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(?:p|div|h[1-6]|li|ul|ol|section|article|blockquote)>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, '')),
    _decodeHtmlText(record)
  );
}
function _buildNotesText(payload) {
  const list = _htmlNotesToText(payload)
    .split(/\r?\n/)
    .map((item4) => item4.trim())
    .filter(Boolean);
  if (!list.length) return autoUpdateText('notes.empty');
  return list.join('\n');
}
function _cleanNotesHeading(handle) {
  return String(handle || '')
    .replace(/^[\s#*>\-•]+/, '')
    .replace(/^[🎉✨🐛🔧✅⚠️📌]+\s*/u, '')
    .replace(/[：:]\s*$/, '')
    .trim();
}
function _isVersionTitleLine(state) {
  return /^(?:🎉\s*)?v?\d+(?:\.\d+){1,3}\s*版本更新/u.test(
    String(state || '')
      .trim()
      .toLowerCase(),
  );
}
function _isReleaseFooterLine(config) {
  const enabled4 = String(config || '').trim();
  if (!enabled4) return false;
  return (
    /^(?:AI-CanvasPro|updream-canvas)[！!]/u.test(enabled4) ||
    /^注[：:]/u.test(enabled4) ||
    /^BUG问题/u.test(enabled4) ||
    /^https?:\/\//i.test(enabled4) ||
    /反馈文档[：:]/u.test(enabled4)
  );
}
function _isReleaseMetaLine(scope) {
  return /^\[[a-zA-Z][a-zA-Z0-9_-]*\]\s*:/u.test(String(scope || '').trim());
}
function _parseUpdateNotes(input) {
  const list2 = _buildNotesText(input)
      .split(/\r?\n/)
      .map((item5) => item5.trim())
      .filter(Boolean)
      .filter((item6) => !_isVersionTitleLine(item6))
      .filter((item7) => !_isReleaseMetaLine(item7)),
    intro = [],
    sections = [],
    footer = [];
  let enabled5 = null,
    output = false;
  const run = (title = autoUpdateText('notes.defaultSectionTitle')) => {
    return (
      !enabled5 && ((enabled5 = { title: title, items: [], paragraphs: [] }), sections.push(enabled5)),
      enabled5
    );
  };
  return (
    list2.forEach((item8) => {
      if (output || _isReleaseFooterLine(item8)) {
        ((output = true), footer.push(item8));
        return;
      }
      const enabled6 = /^[-*•]\s+/.test(item8),
        value2 = item8.replace(/^[-*•]\s+/, '').trim(),
        title2 = _cleanNotesHeading(item8),
        value3 = !enabled6 && /[：:]$/.test(item8) && /新增|修复|优化|更新|说明|注意|已知|内容/u.test(title2);
      if (value3 && title2) {
        ((enabled5 = { title: title2, items: [], paragraphs: [] }), sections.push(enabled5));
        return;
      }
      if (!enabled5 && !enabled6) {
        intro.push(item8);
        return;
      }
      const value4 = run();
      if (enabled6 && value2) {
        value4.items.push(value2);
        return;
      }
      value4.paragraphs.push(item8);
    }),
    {
      intro: intro,
      sections: sections.length
        ? sections
        : [
            {
              title: autoUpdateText('notes.defaultSectionTitle'),
              items: [autoUpdateText('notes.empty')],
              paragraphs: [],
            },
          ],
      footer: footer,
    }
  );
}
function _appendTextWithLinks(el13, value5) {
  const list3 = String(value5 || ''),
    value6 = /(https?:\/\/[^\s]+)/gi;
  let value7 = 0,
    value8 = value6.exec(list3);
  while (value8) {
    value8.index > value7 && el13.appendChild(document.createTextNode(list3.slice(value7, value8.index)));
    const list4 = value8[0].replace(/[),.;，。；）]+$/u, ''),
      value9 = value8[0].slice(list4.length),
      el14 = document.createElement('a');
    ((el14.className = 'update-banner-note-link'),
      (el14.href = list4),
      (el14.dataset.externalUrl = list4),
      (el14.textContent = list4),
      el13.appendChild(el14));
    if (value9) el13.appendChild(document.createTextNode(value9));
    ((value7 = value8.index + value8[0].length), (value8 = value6.exec(list3)));
  }
  value7 < list3.length && el13.appendChild(document.createTextNode(list3.slice(value7)));
}
function _createNotesPanel(value10) {
  const _parseUpdateNotes2 = _parseUpdateNotes(value10),
    el15 = document.createElement('div');
  ((el15.className = 'update-banner-notes'), (el15.id = 'update-banner-notes'));
  const el16 = document.createElement('div');
  ((el16.className = 'update-banner-section-title'),
    (el16.textContent = autoUpdateText('notes.defaultSectionTitle')));
  const el17 = document.createElement('div');
  el17.className = 'update-banner-notes-scroll';
  if (_parseUpdateNotes2.intro.length) {
    const el18 = document.createElement('div');
    ((el18.className = 'update-banner-note-intro'),
      _parseUpdateNotes2.intro.forEach((item9) => {
        const value11 = document.createElement('p');
        ((value11.className = 'update-banner-note-paragraph'),
          _appendTextWithLinks(value11, item9),
          el18.appendChild(value11));
      }),
      el17.appendChild(el18));
  }
  _parseUpdateNotes2.sections.forEach((item10) => {
    const el19 = document.createElement('section');
    el19.className = 'update-banner-note-section';
    const el20 = document.createElement('div');
    ((el20.className = 'update-banner-note-heading'),
      (el20.textContent = item10.title),
      el19.appendChild(el20),
      item10.paragraphs.forEach((item11) => {
        const value12 = document.createElement('p');
        ((value12.className = 'update-banner-note-paragraph'),
          _appendTextWithLinks(value12, item11),
          el19.appendChild(value12));
      }));
    if (item10.items.length) {
      const el21 = document.createElement('ul');
      ((el21.className = 'update-banner-note-list'),
        item10.items.forEach((item12) => {
          const value13 = document.createElement('li');
          (_appendTextWithLinks(value13, item12), el21.appendChild(value13));
        }),
        el19.appendChild(el21));
    }
    el17.appendChild(el19);
  });
  if (_parseUpdateNotes2.footer.length) {
    const el22 = document.createElement('section');
    el22.className = 'update-banner-note-footer';
    const el23 = document.createElement('div');
    ((el23.className = 'update-banner-note-footer-title'),
      (el23.textContent = autoUpdateText('notes.releaseFooterTitle')),
      el22.appendChild(el23),
      _parseUpdateNotes2.footer.forEach((item13) => {
        const value14 = document.createElement('p');
        ((value14.className = 'update-banner-note-paragraph'),
          _appendTextWithLinks(value14, item13),
          el22.appendChild(value14));
      }),
      el17.appendChild(el22));
  }
  return (el15.appendChild(el16), el15.appendChild(el17), el15);
}
function _normalizeHttpUrl(value15) {
  const enabled7 = String(value15 || '').trim();
  if (!enabled7) return '';
  const value16 = enabled7.startsWith('//') ? 'https:' + enabled7 : enabled7;
  if (!/^https?:\/\//i.test(value16)) return '';
  try {
    const uRL = new URL(value16);
    if (uRL.protocol !== 'http:' && uRL.protocol !== 'https:') return '';
    return uRL.toString();
  } catch (value17) {
    return '';
  }
}
function _isDirectVideoUrl(value18) {
  try {
    return /\.(mp4|webm|ogg|m4v|mov)$/i.test(new URL(value18).pathname);
  } catch (value19) {
    return false;
  }
}
function _isBilibiliHost(value20) {
  const value21 = String(value20 || '').toLowerCase();
  return value21 === 'bilibili.com' || value21.endsWith('.bilibili.com');
}
function _buildBilibiliPlayerUrl(value22) {
  try {
    const uRL2 = new URL(value22);
    if (!_isBilibiliHost(uRL2.hostname)) return '';
    if (uRL2.hostname.toLowerCase() === 'player.bilibili.com')
      return (uRL2.searchParams.set('autoplay', '0'), uRL2.toString());
    const enabled8 = uRL2.pathname.match(/\/video\/(BV[a-zA-Z0-9]+)/),
      enabled9 = uRL2.pathname.match(/\/video\/av(\d+)/i);
    if (!enabled8 && !enabled9) return '';
    const uRL3 = new URL('https://player.bilibili.com/player.html');
    return (
      enabled8 ? uRL3.searchParams.set('bvid', enabled8[1]) : uRL3.searchParams.set('aid', enabled9[1]),
      uRL3.searchParams.set('page', uRL2.searchParams.get('p') || '1'),
      uRL3.searchParams.set('autoplay', '0'),
      uRL3.toString()
    );
  } catch (value23) {
    return '';
  }
}
function _createPreviewVideo(value24) {
  const _normalizeHttpUrl2 = _normalizeHttpUrl(value24?.previewVideoUrl || value24?.preview_video_url);
  if (!_normalizeHttpUrl2) return null;
  const el24 = document.createElement('div');
  el24.className = 'update-banner-video-wrap';
  const el25 = document.createElement('div');
  el25.className = 'update-banner-video-shell';
  if (_isDirectVideoUrl(_normalizeHttpUrl2)) {
    const value25 = document.createElement('video');
    return (
      (value25.className = 'update-banner-video'),
      (value25.controls = true),
      (value25.playsInline = true),
      (value25.preload = 'metadata'),
      (value25.src = _normalizeHttpUrl2),
      el25.appendChild(value25),
      el24.appendChild(el25),
      el24
    );
  }
  const value26 = document.createElement('iframe');
  return (
    (value26.className = 'update-banner-video-frame'),
    (value26.src = _buildBilibiliPlayerUrl(_normalizeHttpUrl2) || _normalizeHttpUrl2),
    (value26.loading = 'lazy'),
    (value26.allow = 'autoplay; fullscreen; picture-in-picture'),
    (value26.allowFullscreen = true),
    (value26.referrerPolicy = 'no-referrer-when-downgrade'),
    el25.appendChild(value26),
    el24.appendChild(el25),
    el24
  );
}
function _createTutorialVideoList(value27) {
  const list5 = Array.isArray(value27) ? value27 : [],
    list6 = list5
      .map((response) => ({
        title: String(response?.title || '').trim(),
        url: String(response?.url || '').trim(),
      }))
      .filter((response2) => response2.title && _normalizeHttpUrl(response2.url));
  if (!list6.length) return null;
  const el26 = document.createElement('div');
  return (
    (el26.className = 'update-banner-video-list'),
    list6.forEach((previewVideoUrl) => {
      const el27 = document.createElement('section');
      el27.className = 'update-banner-video-item';
      const el28 = document.createElement('div');
      ((el28.className = 'update-banner-video-item-title'), (el28.textContent = previewVideoUrl.title));
      const _createPreviewVideo2 = _createPreviewVideo({ previewVideoUrl: previewVideoUrl.url });
      el27.appendChild(el28);
      if (_createPreviewVideo2) el27.appendChild(_createPreviewVideo2);
      el26.appendChild(el27);
    }),
    el26
  );
}
function _openDownload(value28) {
  const value29 = value28?.downloadUrl || value28?.releaseUrl || FALLBACK_RELEASE_URL;
  void openExternalLink(value29, { label: autoUpdateText('externalLabels.download') }).catch(() => {
    window.showToast?.(autoUpdateText('toasts.openDownloadFailed'), 'error');
  });
}
function _openReleasePage(value30) {
  const value31 = value30?.releaseUrl || FALLBACK_RELEASE_URL;
  void openExternalLink(value31, { label: autoUpdateText('externalLabels.releasePage') }).catch(() => {
    window.showToast?.(autoUpdateText('toasts.openReleaseFailed'), 'error');
  });
}
function _setDownloadFallback(value32, value33) {
  const el29 = document.getElementById('update-banner-btn'),
    el30 = document.getElementById('update-banner-sub');
  (el30 && value33 && ((el30.textContent = value33), el30.classList.add('is-error')),
    el29?.classList?.add?.('is-download'),
    _setBtnContent(el29, false, autoUpdateText('buttons.downloadLatest')),
    el29 && ((el29.disabled = false), (el29.onclick = () => _openDownload(value32))));
}
function _setUpdateProgress(value34, value35 = '') {
  const el31 = document.getElementById('update-banner-progress'),
    el32 = document.getElementById('update-banner-progress-bar'),
    el33 = document.getElementById('update-banner-progress-text');
  if (!el31 || !el32 || !el33) return;
  const percent = _formatPercent(value34);
  ((el31.hidden = false),
    (el32.style.width = percent),
    (el33.textContent = value35 || autoUpdateText('progress.downloading', { percent: percent })));
}
function _setDesktopDownloadInPlace(options2 = {}, { retrying: retrying = false } = {}) {
  const enabled10 = document.getElementById('update-banner');
  if (!enabled10) return false;
  const el34 = document.getElementById('update-banner-sub'),
    el35 = document.getElementById('update-banner-btn'),
    el36 = document.getElementById('update-banner-close'),
    count = Number(options2.retryCount || 0),
    value36 = retrying
      ? autoUpdateText('progress.retrying', { count: count })
      : autoUpdateText('progress.downloading', { percent: '0%' });
  el34 &&
    (el34.classList.remove('is-error'),
    (el34.textContent = retrying
      ? autoUpdateText('status.autoRetry')
      : autoUpdateText('status.downloadingAutoInstall')));
  (_setUpdateProgress(0, value36),
    _setBtnContent(
      el35,
      true,
      retrying ? autoUpdateText('buttons.retrying') : autoUpdateText('buttons.downloading'),
    ));
  if (el35) el35.disabled = true;
  if (el36) el36.disabled = true;
  return true;
}
function _showBanner(enabled11, enabled12 = {}) {
  if (enabled12.replace) _removeBanner();
  if (!enabled12.ignoreDismissed && _dismissedSignature === _getUpdateSignature(enabled11)) return;
  if (document.getElementById('update-banner')) return;
  const enabled13 = enabled11.hasUpdate !== false,
    version = enabled11.remoteVersion || autoUpdateText('versions.newVersion'),
    version2 = enabled11.localVersion || autoUpdateText('versions.currentVersion'),
    pubDate = _formatPubDate(enabled11.pubDate),
    enabled14 = Boolean(enabled11.previewOnly),
    el37 = document.createElement('div');
  ((el37.id = 'update-banner'), (el37.className = 'update-banner'));
  const el38 = document.createElement('div');
  ((el38.id = 'update-banner-backdrop'),
    (el38.className = 'update-banner-backdrop'),
    el38.setAttribute('aria-hidden', 'true'));
  const el39 = document.createElement('div');
  el39.className = 'update-banner-header';
  const el40 = document.createElement('span');
  ((el40.className = 'update-banner-icon'),
    el40.setAttribute('aria-hidden', 'true'),
    el40.appendChild(_createUpdateSvg()));
  const el41 = document.createElement('div');
  el41.className = 'update-banner-header-title';
  if (enabled11.titleText) el41.textContent = enabled11.titleText;
  else {
    const el42 = document.createElement('span');
    ((el42.textContent = autoUpdateText('banner.versionUpdateTitle', { version: version })),
      el41.appendChild(el42));
    if (version2) {
      const el43 = document.createElement('span');
      ((el43.className = 'update-banner-header-current'),
        (el43.textContent = autoUpdateText('banner.currentVersionSuffix', { version: version2 })),
        el41.appendChild(el43));
    }
  }
  const el44 = document.createElement('button');
  ((el44.type = 'button'),
    (el44.className = 'update-banner-close'),
    (el44.id = 'update-banner-close'),
    el44.setAttribute('aria-label', autoUpdateText('banner.closeAria')),
    (el44.title = autoUpdateText('buttons.close')),
    (el44.textContent = '×'),
    el39.appendChild(el40),
    el39.appendChild(el41),
    el39.appendChild(el44));
  const el45 = document.createElement('div');
  el45.className = 'update-banner-text';
  const el46 = document.createElement('div');
  ((el46.className = 'update-banner-sub'),
    (el46.id = 'update-banner-sub'),
    (el46.textContent =
      enabled11.subtitleText ||
      (enabled14
        ? autoUpdateText('banner.subtitleCurrent', { localVersion: version2 })
        : pubDate
          ? autoUpdateText('banner.subtitleWithDate', { localVersion: version2, pubDate: pubDate })
          : enabled13
            ? autoUpdateText('banner.subtitleCurrent', { localVersion: version2 })
            : autoUpdateText('banner.subtitleNoUpdate', {
                localVersion: version2,
                remoteVersion: version,
              }))));
  const el47 = document.createElement('div');
  ((el47.className = 'update-banner-progress'),
    (el47.id = 'update-banner-progress'),
    (el47.hidden = !enabled11.showProgress));
  const el48 = document.createElement('div');
  el48.className = 'update-banner-progress-track';
  const el49 = document.createElement('div');
  ((el49.className = 'update-banner-progress-bar'),
    (el49.id = 'update-banner-progress-bar'),
    (el49.style.width = _formatPercent(enabled11.progressPercent)));
  const el50 = document.createElement('div');
  ((el50.className = 'update-banner-progress-text'),
    (el50.id = 'update-banner-progress-text'),
    (el50.textContent =
      enabled11.progressText ||
      autoUpdateText('progress.downloading', { percent: _formatPercent(enabled11.progressPercent) })),
    el48.appendChild(el49),
    el47.appendChild(el48),
    el47.appendChild(el50));
  const _createNotesPanel2 = _createNotesPanel(enabled11.notes),
    _createPreviewVideo3 = _createPreviewVideo(enabled11),
    _createTutorialVideoList2 = _createTutorialVideoList(enabled11.tutorialVideos);
  if (!enabled11.hideSubtitle) el45.appendChild(el46);
  el45.appendChild(el47);
  if (_createPreviewVideo3) el45.appendChild(_createPreviewVideo3);
  if (_createTutorialVideoList2) el45.appendChild(_createTutorialVideoList2);
  if (!enabled11.hideNotes) el45.appendChild(_createNotesPanel2);
  const el51 = document.createElement('div');
  el51.className = 'update-banner-actions';
  if (!enabled11.hideCancelButton) {
    const el52 = document.createElement('button');
    ((el52.type = 'button'),
      (el52.className = 'update-banner-btn update-banner-btn-secondary'),
      (el52.textContent =
        enabled11.cancelText ||
        (enabled14 ? autoUpdateText('buttons.close') : autoUpdateText('buttons.cancel'))),
      (el52.onclick = () => {
        if (typeof enabled11.cancelAction === 'function') {
          enabled11.cancelAction(enabled11);
          return;
        }
        _removeBanner();
      }),
      el51.appendChild(el52));
  }
  if (!enabled14 && enabled13 && !enabled11.disableSkip) {
    const el53 = document.createElement('button');
    ((el53.type = 'button'),
      (el53.className = 'update-banner-btn update-banner-btn-secondary'),
      (el53.textContent = autoUpdateText('buttons.skipVersion')),
      (el53.onclick = () => _dismissBanner(enabled11)),
      el51.appendChild(el53));
  }
  const el54 = document.createElement('button');
  ((el54.type = 'button'), (el54.className = 'update-banner-btn'), (el54.id = 'update-banner-btn'));
  if (enabled14)
    (el54.classList.add('is-primary'),
      _setBtnContent(el54, false, enabled11.previewCloseText || autoUpdateText('buttons.gotIt')),
      (el54.onclick = () => _removeBanner()));
  else {
    if (enabled11.installDownloadedUpdate)
      (el54.classList.add('is-primary'),
        _setBtnContent(el54, false, autoUpdateText('buttons.restartInstall')),
        (el54.onclick = () => _installDownloadedDesktopUpdate(el54)));
    else {
      if (enabled11.retryDesktopDownload)
        (el54.classList.add('is-primary'),
          _setBtnContent(el54, false, autoUpdateText('buttons.retryDownloadInstall')),
          (el54.onclick = () => _downloadDesktopUpdate(el54)));
      else {
        if (enabled11.startDesktopDownload)
          (el54.classList.add('is-primary'),
            _setBtnContent(el54, false, autoUpdateText('buttons.downloadInstall')),
            (el54.onclick = () => _downloadDesktopUpdate(el54)));
        else {
          if (enabled11.canHotApply)
            (el54.classList.add('is-primary'),
              _setBtnContent(el54, false, autoUpdateText('buttons.updateNow')),
              (el54.onclick = () => _doApply(enabled11)));
          else
            !enabled13
              ? (el54.classList.add('is-download'),
                _setBtnContent(el54, false, autoUpdateText('buttons.viewRelease')),
                (el54.onclick = () => _openReleasePage(enabled11)))
              : (el54.classList.add('is-download'),
                _setBtnContent(el54, false, autoUpdateText('buttons.downloadLatest')),
                (el54.onclick = () => _openDownload(enabled11)));
        }
      }
    }
  }
  (el51.appendChild(el54),
    el37.appendChild(el39),
    el37.appendChild(el45),
    el37.appendChild(el51),
    document.body.appendChild(el38),
    document.body.appendChild(el37),
    el38.classList.add('open'),
    el37.classList.add('open'),
    (_activeBannerInfo = enabled11),
    document.addEventListener('keydown', _handleBannerKeydown),
    (el44.onclick = () => _removeBanner()));
}
async function _downloadDesktopUpdate(el55) {
  const enabled15 = window.aiCanvasDesktop;
  if (!enabled15?.downloadUpdate) return;
  (_setBtnContent(el55, true, autoUpdateText('buttons.preparingDownload')),
    (el55.disabled = true),
    (_desktopInstallAfterDownload = true));
  try {
    await enabled15.downloadUpdate();
  } catch (value37) {
    ((_desktopInstallAfterDownload = false),
      (el55.disabled = false),
      _setBtnContent(el55, false, autoUpdateText('buttons.downloadInstall')),
      window.showToast?.(autoUpdateText('toasts.downloadFailed')));
  }
}
async function _installDownloadedDesktopUpdate(el56) {
  const enabled16 = window.aiCanvasDesktop;
  if (!enabled16?.installDownloadedUpdate) return;
  _setBtnContent(el56, true, autoUpdateText('buttons.restarting'));
  if (el56) el56.disabled = true;
  try {
    await enabled16.installDownloadedUpdate();
  } catch (value38) {
    if (el56) el56.disabled = false;
    (_setBtnContent(el56, false, autoUpdateText('buttons.restartInstall')),
      window.showToast?.(autoUpdateText('toasts.restartInstallFailed')));
  }
}
async function _doApply(enabled17) {
  if (enabled17?.previewOnly) {
    window.showToast?.(autoUpdateText('toasts.previewOnly'));
    return;
  }
  if (!enabled17?.canHotApply) {
    _openDownload(enabled17);
    return;
  }
  const el57 = document.getElementById('update-banner-btn'),
    el58 = document.getElementById('update-banner-sub');
  (el58?.classList?.remove?.('is-error'),
    el57?.classList?.remove?.('is-download'),
    _setBtnContent(el57, true, autoUpdateText('buttons.updating')));
  if (el57) el57.disabled = true;
  try {
    const error = await applyUpdateFromServer();
    if (error.success) {
      _setBtnContent(el57, true, autoUpdateText('buttons.restartingWait'));
      const value39 = Date.now() + 0x7530,
        async2 = async () => {
          if (Date.now() > value39) {
            location.reload();
            return;
          }
          try {
            const pingUpdateCheckFromServer2 = await pingUpdateCheckFromServer();
            if (pingUpdateCheckFromServer2) {
              location.reload();
              return;
            }
          } catch (value40) {}
          setTimeout(async2, 0x320);
        };
      setTimeout(async2, 0x7d0);
      return;
    }
    _setDownloadFallback(
      enabled17,
      autoUpdateText('errors.hotApplyFailed', {
        error: error.error || autoUpdateText('errors.unknownManualDownload'),
      }),
    );
  } catch (value41) {
    _setDownloadFallback(enabled17, autoUpdateText('errors.networkManualDownload'));
  }
}
async function _checkUpdate() {
  if (window.aiCanvasDesktop?.isElectron || _desktopUpdaterActive) return;
  try {
    const checkUpdateFromServer2 = await checkUpdateFromServer();
    if (checkUpdateFromServer2?.hasUpdate) _showBanner(checkUpdateFromServer2);
  } catch (value42) {}
}
function _normalizeDesktopUpdateInfo(value43) {
  const releaseDate = value43 && typeof value43 === 'object' ? value43 : {};
  return {
    version: String(releaseDate.version || '').trim(),
    releaseDate: releaseDate.releaseDate || '',
    releaseNotes: String(releaseDate.releaseNotes || '').trim(),
    previewVideoUrl: String(releaseDate.previewVideoUrl || releaseDate.preview_video_url || '').trim(),
  };
}
function _formatDesktopRemoteVersion(value44) {
  const enabled18 = String(value44 || '').trim();
  if (!enabled18 || enabled18 === autoUpdateText('versions.newVersion'))
    return autoUpdateText('versions.newVersion');
  return enabled18.startsWith('V') ? enabled18 : 'V' + enabled18;
}
async function _getDesktopLocalVersion() {
  try {
    const value45 = await window.aiCanvasDesktop?.getAppVersion?.();
    return value45 ? 'V' + value45 : autoUpdateText('versions.unknownVersion');
  } catch (value46) {
    return autoUpdateText('versions.unknownVersion');
  }
}
async function _showDesktopUpdateBanner(value47, value48 = {}) {
  const pubDate2 = _normalizeDesktopUpdateInfo(value48.info || _desktopUpdateInfo);
  if (pubDate2.version) _desktopUpdateInfo = pubDate2;
  const value49 = pubDate2.version || autoUpdateText('versions.newVersion'),
    localVersion = await _getDesktopLocalVersion(),
    remoteVersion = _formatDesktopRemoteVersion(value49),
    notes = pubDate2.releaseNotes || autoUpdateText('desktop.downloadedNotes'),
    subtitleText = value47 === 'downloaded',
    showProgress = value47 === 'downloading',
    enabled19 = value47 === 'retrying',
    progressPercent = Number(value48.percent || 0),
    progressText = enabled19
      ? autoUpdateText('progress.retrying', { count: Number(value48.retryCount || 0) })
      : autoUpdateText('progress.downloading', { percent: _formatPercent(progressPercent) });
  _showBanner(
    {
      hasUpdate: true,
      localVersion: localVersion,
      remoteVersion: remoteVersion,
      pubDate: pubDate2.releaseDate || '',
      subtitleText: subtitleText
        ? autoUpdateText('desktop.subtitleDownloaded', {
            localVersion: localVersion,
            remoteVersion: remoteVersion,
          })
        : showProgress || enabled19
          ? autoUpdateText('desktop.subtitleDownloading', {
              localVersion: localVersion,
              remoteVersion: remoteVersion,
            })
          : autoUpdateText('desktop.subtitleAvailable', {
              localVersion: localVersion,
              remoteVersion: remoteVersion,
            }),
      notes: notes,
      previewVideoUrl: subtitleText ? '' : pubDate2.previewVideoUrl,
      canHotApply: false,
      startDesktopDownload: !subtitleText && !showProgress && !enabled19,
      installDownloadedUpdate: subtitleText,
      showProgress: showProgress || enabled19,
      hideNotes: subtitleText,
      progressPercent: progressPercent,
      progressText: progressText,
      cancelText: subtitleText ? autoUpdateText('buttons.later') : autoUpdateText('buttons.cancel'),
      disableSkip: true,
      hideSubtitle: false,
    },
    { replace: true, ignoreDismissed: true },
  );
}
async function _showDesktopDownloadFailedBanner(error2 = {}) {
  const pubDate3 = _normalizeDesktopUpdateInfo(error2.info || _desktopUpdateInfo);
  if (pubDate3.version) _desktopUpdateInfo = pubDate3;
  const value50 = pubDate3.version || autoUpdateText('versions.newVersion'),
    localVersion2 = await _getDesktopLocalVersion(),
    remoteVersion2 = _formatDesktopRemoteVersion(value50),
    retryCount = Number(error2.retryCount || 0),
    subtitleText2 = Number(error2.maxRetries || 0),
    message = error2.message || autoUpdateText('desktop.downloadFailedMessage');
  _showBanner(
    {
      hasUpdate: true,
      localVersion: localVersion2,
      remoteVersion: remoteVersion2,
      pubDate: pubDate3.releaseDate || '',
      subtitleText: subtitleText2
        ? autoUpdateText('desktop.downloadFailedWithRetries', {
            message: message,
            retryCount: retryCount,
            maxRetries: subtitleText2,
          })
        : message,
      notes: pubDate3.releaseNotes || autoUpdateText('desktop.downloadFailedNotes'),
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
function _desktopEventFromState(state2 = {}) {
  if (state2.latestEvent) return state2.latestEvent;
  if (!state2.state || state2.state === 'idle') return null;
  const value51 = {
      checking: 'checking',
      available: 'available',
      downloading: 'download-started',
      downloaded: 'downloaded',
      error: 'download-failed',
      installing: 'installing',
    },
    type = value51[state2.state];
  if (!type) return null;
  return {
    type: type,
    state: state2.state,
    info: state2.latestInfo || null,
    retryCount: state2.retryCount || 0,
    maxRetries: state2.maxRetries || 0,
  };
}
function _handleDesktopUpdaterEvent(enabled20) {
  if (!enabled20 || typeof enabled20 !== 'object') return;
  if (enabled20.type === 'checking') {
    _desktopUpdaterActive = true;
    return;
  }
  if (enabled20.type === 'available') {
    ((_desktopUpdaterActive = true), void _showDesktopUpdateBanner('available', enabled20));
    return;
  }
  if (enabled20.type === 'download-started') {
    _desktopUpdaterActive = true;
    if (_setDesktopDownloadInPlace(enabled20)) return;
    void _showDesktopUpdateBanner('downloading', enabled20);
    return;
  }
  if (enabled20.type === 'download-retry') {
    _desktopUpdaterActive = true;
    if (_setDesktopDownloadInPlace(enabled20, { retrying: true })) return;
    void _showDesktopUpdateBanner('retrying', enabled20);
    return;
  }
  if (enabled20.type === 'download-progress') {
    _desktopUpdaterActive = true;
    if (!document.getElementById('update-banner-progress')) {
      void _showDesktopUpdateBanner('downloading', enabled20);
      return;
    }
    _setUpdateProgress(
      enabled20.percent,
      autoUpdateText('progress.downloading', { percent: _formatPercent(enabled20.percent) }),
    );
    return;
  }
  if (enabled20.type === 'downloaded') {
    _desktopUpdaterActive = true;
    if (_desktopInstallAfterDownload) {
      _desktopInstallAfterDownload = false;
      const el59 = document.getElementById('update-banner-btn'),
        el60 = document.getElementById('update-banner-sub');
      el60 &&
        (el60.classList.remove('is-error'),
        (el60.textContent = autoUpdateText('status.downloadedRestarting')));
      _setBtnContent(el59, true, autoUpdateText('buttons.restartingInstall'));
      if (el59) el59.disabled = true;
      void _installDownloadedDesktopUpdate(el59);
      return;
    }
    void _showDesktopUpdateBanner('downloaded', enabled20);
    return;
  }
  if (enabled20.type === 'download-failed') {
    ((_desktopUpdaterActive = true),
      (_desktopInstallAfterDownload = false),
      void _showDesktopDownloadFailedBanner(enabled20));
    return;
  }
  if (enabled20.type === 'not-available') {
    _desktopUpdaterActive = false;
    if (enabled20.manual) window.showToast?.(autoUpdateText('toasts.alreadyLatest'));
    return;
  }
  if (enabled20.type === 'installing') {
    ((_desktopUpdaterActive = true), window.showToast?.(autoUpdateText('toasts.installing')));
    return;
  }
  if (enabled20.type === 'error') {
    _desktopInstallAfterDownload = false;
    if (enabled20.skipped) return;
    if (enabled20.eventId != null && enabled20.eventId === lastDesktopErrorEventId) return;
    lastDesktopErrorEventId = enabled20.eventId ?? null;
    desktopErrorEventSequence += 1;
    // Background update checks fail routinely (offline, missing release feed) and the raw
    // error message embeds the whole HTTP response header dump, which used to be toasted
    // across the bottom of the canvas. Only surface manual checks, with localized copy.
    if (enabled20.manual) window.showToast?.(autoUpdateText('toasts.desktopCheckFailed'), 'warn');
  }
}
function _bindDesktopUpdaterEvents() {
  const enabled21 = window.aiCanvasDesktop;
  if (!enabled21?.onUpdaterEvent || _desktopUpdateUnsubscribe) return;
  ((_desktopUpdateUnsubscribe = enabled21.onUpdaterEvent(_handleDesktopUpdaterEvent)),
    void enabled21
      .getUpdateState?.()
      .then((value52) => {
        const _desktopEventFromState2 = _desktopEventFromState(value52);
        if (_desktopEventFromState2) _handleDesktopUpdaterEvent(_desktopEventFromState2);
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
    } catch (value53) {
      if (desktopErrorEventSequence === errorsBeforeCheck)
        window.showToast?.(autoUpdateText('toasts.desktopCheckFailed'), 'warning');
    }
    return;
  }
  try {
    window.showToast?.(autoUpdateText('toasts.checkingUpdate'));
    const checkUpdateFromServer3 = await checkUpdateFromServer({ force: true, includeCurrent: true });
    if (
      checkUpdateFromServer3?.remoteVersion ||
      checkUpdateFromServer3?.notes ||
      checkUpdateFromServer3?.releaseUrl
    ) {
      _showBanner(checkUpdateFromServer3, { replace: true, ignoreDismissed: true });
      return;
    }
    window.showToast?.(autoUpdateText('toasts.noRemoteInfo'));
  } catch (value54) {
    window.showToast?.(autoUpdateText('toasts.remoteCheckFailed'));
  }
}
export async function showLocalUpdatePreview() {
  try {
    window.showToast?.(autoUpdateText('toasts.generatingPreview'));
    const checkLocalUpdatePreviewFromServer2 = await checkLocalUpdatePreviewFromServer();
    if (
      checkLocalUpdatePreviewFromServer2?.previewOnly &&
      (checkLocalUpdatePreviewFromServer2?.remoteVersion || checkLocalUpdatePreviewFromServer2?.notes)
    ) {
      _showBanner(checkLocalUpdatePreviewFromServer2, { replace: true, ignoreDismissed: true });
      return;
    }
    window.showToast?.(autoUpdateText('toasts.noLocalPreview'));
  } catch (value55) {
    window.showToast?.(autoUpdateText('toasts.localPreviewFailed'));
  }
}
export function showTutorialVideoPanel(url) {
  const tutorialVideos = Array.isArray(url)
    ? url
    : [{ title: autoUpdateText('tutorial.defaultTitle'), url: url }];
  _showBanner(
    {
      previewOnly: true,
      hasUpdate: false,
      localVersion: '',
      remoteVersion: autoUpdateText('tutorial.title'),
      titleText: autoUpdateText('tutorial.title'),
      subtitleText: autoUpdateText('tutorial.subtitle'),
      notes: '',
      tutorialVideos: tutorialVideos,
      canHotApply: false,
      hideNotes: true,
      hideCancelButton: true,
      previewCloseText: autoUpdateText('buttons.close'),
    },
    { replace: true, ignoreDismissed: true },
  );
}

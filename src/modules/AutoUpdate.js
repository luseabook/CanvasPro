import {
  applyUpdateFromServer,
  checkLocalUpdatePreviewFromServer,
  checkUpdateFromServer,
  pingUpdateCheckFromServer,
} from '../../api/updateApi.js';
import { getLocale, t } from '../i18n/index.js';
import { desktopBridge } from '../services/desktopBridge.js';
import {
  createLatestStartupVisualTaskQueue,
  isStartupVisualComplete,
  waitForStartupVisualComplete,
} from '../services/startupVisualReadiness.js';
import {
  AUTO_UPDATE_PRIMARY_ACTIONS,
  ensureDesktopUpdateAvailable,
  resolveAutoUpdatePrimaryAction,
} from './autoUpdatePolicy.js';
const CHECK_INTERVAL = 60 * 60 * 1000,
  _NS = 'http://www.w3.org/2000/svg';
let _dismissedSignature = '',
  _activeBannerInfo = null,
  _desktopUpdateInfo = null,
  _desktopUpdateUnsubscribe = null,
  _desktopUpdaterActive = false,
  _desktopInstallAfterDownload = false,
  _desktopBannerRequestSequence = 0;
const _startupBannerQueue = createLatestStartupVisualTaskQueue(),
  _startupAutomaticToastQueue = createLatestStartupVisualTaskQueue();
function autoUpdateText(value, item = {}) {
  return t('autoUpdate.' + value, item);
}
function _getUpdateSignature(enabled) {
  if (!enabled || typeof enabled !== 'object') return '';
  return [
    enabled['previewOnly'] ? 'preview' : 'update',
    enabled['localVersion'] || '',
    enabled['remoteVersion'] || '',
    enabled['downloadUrl'] || '',
    enabled['previewVideoUrl'] || '',
    enabled['notes'] || '',
  ]['join']('|');
}
function _removeBanner() {
  _startupBannerQueue['clear']();
  const el = document['getElementById']('update-banner'),
    el2 = document['getElementById']('update-banner-backdrop');
  (el?.['classList']?.['remove']?.('open'),
    el2?.['classList']?.['remove']?.('open'),
    el?.['remove']?.(),
    el2?.['remove']?.(),
    (_activeBannerInfo = null),
    document['removeEventListener']('keydown', _handleBannerKeydown));
}
function _dismissBanner(key) {
  (_removeBanner(), (_dismissedSignature = _getUpdateSignature(key)));
}
function _handleBannerKeydown(event) {
  if (event['key'] !== 'Escape' || !document['getElementById']('update-banner')) return;
  event['preventDefault']();
  if (typeof _activeBannerInfo?.['closeAction'] === 'function') {
    _activeBannerInfo['closeAction'](_activeBannerInfo);
    return;
  }
  _removeBanner();
}
function _createSvgIcon(index, result = {}) {
  const el3 = document['createElementNS'](_NS, 'svg');
  if (result['spin']) el3['classList']['add']('spin');
  (el3['setAttribute']('viewBox', '0 0 24 24'),
    el3['setAttribute']('fill', 'none'),
    el3['setAttribute']('stroke', 'currentColor'),
    el3['setAttribute']('stroke-width', '2.2'),
    el3['setAttribute']('stroke-linecap', 'round'),
    el3['setAttribute']('stroke-linejoin', 'round'));
  const el4 = document['createElementNS'](_NS, 'path');
  return (el4['setAttribute']('d', index), el3['appendChild'](el4), el3);
}
function _createSpinSvg(spin) {
  const el5 = _createSvgIcon('M21 12a9 9 0 1 1-6.219-8.56', { spin: spin }),
    el6 = document['createElementNS'](_NS, 'polyline');
  return (
    el6['setAttribute']('points', '16 3 21 3 21 8'),
    el5['appendChild'](el6),
    el5
  );
}
function _createDownloadSvg() {
  const el7 = document['createElementNS'](_NS, 'svg');
  return (
    el7['setAttribute']('viewBox', '0 0 24 24'),
    el7['setAttribute']('fill', 'none'),
    el7['setAttribute']('stroke', 'currentColor'),
    el7['setAttribute']('stroke-width', '2.2'),
    el7['setAttribute']('stroke-linecap', 'round'),
    el7['setAttribute']('stroke-linejoin', 'round'),
    ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3']['forEach']((data) => {
      const el8 = document['createElementNS'](_NS, 'path');
      (el8['setAttribute']('d', data), el7['appendChild'](el8));
    }),
    el7
  );
}
function _createUpdateSvg() {
  const el9 = document['createElementNS'](_NS, 'svg');
  return (
    el9['setAttribute']('viewBox', '0 0 24 24'),
    el9['setAttribute']('fill', 'none'),
    el9['setAttribute']('stroke', 'currentColor'),
    el9['setAttribute']('stroke-width', '2.2'),
    el9['setAttribute']('stroke-linecap', 'round'),
    el9['setAttribute']('stroke-linejoin', 'round'),
    ['M12 16V4', 'M7 9l5-5 5 5', 'M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2']['forEach']((options) => {
      const el10 = document['createElementNS'](_NS, 'path');
      (el10['setAttribute']('d', options), el9['appendChild'](el10));
    }),
    el9
  );
}
function _setBtnContent(el11, target, source) {
  if (!el11) return;
  (el11['replaceChildren'](),
    el11['appendChild'](target ? _createSpinSvg(true) : _createDownloadSvg()),
    el11['appendChild'](document['createTextNode'](' ' + source)));
}
function _formatPercent(next) {
  const current = Math['max'](0, Math['min'](100, Number(next || 0)));
  return Math['round'](current) + '%';
}
function _formatBannerVersion(entry) {
  return String(entry || '')
    ['trim']()
    ['replace'](/^[vV](?=\d)/, '');
}
function _formatPubDate(enabled2) {
  if (!enabled2) return '';
  const record = new Date(enabled2);
  if (Number['isNaN'](record['getTime']())) return String(enabled2);
  return record['toLocaleString'](getLocale(), {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
function _decodeHtmlText(payload) {
  const enabled3 = String(payload || '');
  if (!enabled3) return '';
  const el12 = document['createElement']('textarea');
  return ((el12['innerHTML'] = enabled3), el12['value']);
}
function _htmlNotesToText(handle) {
  let state = String(handle || '')['trim']();
  if (!/<\/?[a-z][\s\S]*>/i['test'](state)) return state;
  return (
    (state = state['replace'](/<br\s*\/?>/gi, '\n')
      ['replace'](/<\/(?:p|div|h[1-6]|li|ul|ol|section|article|blockquote)>/gi, '\n')
      ['replace'](/<li[^>]*>/gi, '- ')
      ['replace'](/<[^>]+>/g, '')),
    _decodeHtmlText(state)
  );
}
function _buildNotesText(config) {
  const list = _htmlNotesToText(config)
    ['split'](/\r?\n/)
    ['map']((scope) => scope['trim']())
    ['filter'](Boolean);
  if (!list['length']) return autoUpdateText('notes.empty');
  return list['join']('\n');
}
function _cleanNotesHeading(input) {
  return String(input || '')
    ['replace'](/^[\s#*>\-•]+/, '')
    ['replace'](/^[🎉✨🐛🔧✅⚠️📌]+\s*/u, '')
    ['replace'](/[：:]\s*$/, '')
    ['trim']();
}
function _isVersionTitleLine(output) {
  return /^(?:🎉\s*)?v?\d+(?:\.\d+){1,3}\s*版本更新/u['test'](
    String(output || '')
      ['trim']()
      ['toLowerCase'](),
  );
}
function _isReleaseFooterLine(value2) {
  const enabled4 = String(value2 || '')['trim']();
  if (!enabled4) return false;
  return (
    /^感谢各位/u['test'](enabled4) ||
    /^(?:SHUO Canvas|AI-CanvasPro)[！!]/u['test'](enabled4) ||
    /^windows版本.*下载链接[：:]/iu['test'](enabled4) ||
    /^注[：:]/u['test'](enabled4) ||
    /^BUG问题/u['test'](enabled4) ||
    /^https?:\/\//i['test'](enabled4) ||
    /反馈文档[：:]/u['test'](enabled4)
  );
}
function _isReleaseMetaLine(value3) {
  return /^\[[a-zA-Z][a-zA-Z0-9_-]*\]\s*:/u['test'](String(value3 || '')['trim']());
}
function _parseUpdateNotes(value4) {
  const list2 = _buildNotesText(value4)
      ['split'](/\r?\n/)
      ['map']((value5) => value5['trim']())
      ['filter'](Boolean)
      ['filter']((value6) => !_isVersionTitleLine(value6))
      ['filter']((value7) => !_isReleaseMetaLine(value7)),
    intro = [],
    sections = [],
    footer = [];
  let enabled5 = null,
    value8 = false;
  const run = (title = autoUpdateText('notes.defaultSectionTitle')) => {
    return (
      !enabled5 &&
        ((enabled5 = { title: title, items: [], paragraphs: [] }), sections['push'](enabled5)),
      enabled5
    );
  };
  return (
    list2['forEach']((value9) => {
      if (value8 || _isReleaseFooterLine(value9)) {
        ((value8 = true), footer['push'](value9));
        return;
      }
      const enabled6 = /^[-*•]\s+/['test'](value9),
        value10 = value9['replace'](/^[-*•]\s+/, '')['trim'](),
        title2 = _cleanNotesHeading(value9),
        value11 =
          !enabled6 &&
          /[：:]$/['test'](value9) &&
          /新增|修复|优化|更新|说明|注意|已知|内容/u['test'](title2);
      if (value11 && title2) {
        ((enabled5 = { title: title2, items: [], paragraphs: [] }), sections['push'](enabled5));
        return;
      }
      if (!enabled5 && !enabled6) {
        intro['push'](value9);
        return;
      }
      const value12 = run();
      if (enabled6 && value10) {
        value12['items']['push'](value10);
        return;
      }
      value12['paragraphs']['push'](value9);
    }),
    {
      intro: intro,
      sections: sections['length']
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
export const __autoUpdateNotesForTest = Object['freeze']({ parse: _parseUpdateNotes });
function _appendTextWithLinks(el13, value13) {
  const list3 = String(value13 || ''),
    value14 = /(https?:\/\/[^\s]+)/gi;
  let value15 = 0,
    value16 = value14['exec'](list3);
  while (value16) {
    value16['index'] > value15 &&
      el13['appendChild'](document['createTextNode'](list3['slice'](value15, value16['index'])));
    const list4 = value16[0]['replace'](/[),.;，。；）]+$/u, ''),
      value17 = value16[0]['slice'](list4['length']),
      el14 = document['createElement']('a');
    ((el14['className'] = 'update-banner-note-link'),
      (el14['href'] = list4),
      (el14['dataset']['externalUrl'] = list4),
      (el14['textContent'] = list4),
      el13['appendChild'](el14));
    if (value17) el13['appendChild'](document['createTextNode'](value17));
    ((value15 = value16['index'] + value16[0]['length']), (value16 = value14['exec'](list3)));
  }
  value15 < list3['length'] &&
    el13['appendChild'](document['createTextNode'](list3['slice'](value15)));
}
function _createNotesPanel(value18) {
  const _parseUpdateNotes2 = _parseUpdateNotes(value18),
    el15 = document['createElement']('div');
  ((el15['className'] = 'update-banner-notes'), (el15['id'] = 'update-banner-notes'));
  const el16 = document['createElement']('div');
  ((el16['className'] = 'update-banner-section-title'),
    (el16['textContent'] = autoUpdateText('notes.defaultSectionTitle')));
  const el17 = document['createElement']('div');
  el17['className'] = 'update-banner-notes-scroll';
  if (_parseUpdateNotes2['intro']['length']) {
    const el18 = document['createElement']('div');
    ((el18['className'] = 'update-banner-note-intro'),
      _parseUpdateNotes2['intro']['forEach']((value19) => {
        const value20 = document['createElement']('p');
        ((value20['className'] = 'update-banner-note-paragraph'),
          _appendTextWithLinks(value20, value19),
          el18['appendChild'](value20));
      }),
      el17['appendChild'](el18));
  }
  _parseUpdateNotes2['sections']['forEach']((value21) => {
    const el19 = document['createElement']('section');
    el19['className'] = 'update-banner-note-section';
    const el20 = document['createElement']('div');
    ((el20['className'] = 'update-banner-note-heading'),
      (el20['textContent'] = value21['title']),
      el19['appendChild'](el20),
      value21['paragraphs']['forEach']((value22) => {
        const value23 = document['createElement']('p');
        ((value23['className'] = 'update-banner-note-paragraph'),
          _appendTextWithLinks(value23, value22),
          el19['appendChild'](value23));
      }));
    if (value21['items']['length']) {
      const el21 = document['createElement']('ul');
      ((el21['className'] = 'update-banner-note-list'),
        value21['items']['forEach']((value24) => {
          const value25 = document['createElement']('li');
          (_appendTextWithLinks(value25, value24), el21['appendChild'](value25));
        }),
        el19['appendChild'](el21));
    }
    el17['appendChild'](el19);
  });
  if (_parseUpdateNotes2['footer']['length']) {
    const el22 = document['createElement']('section');
    el22['className'] = 'update-banner-note-footer';
    const el23 = document['createElement']('div');
    ((el23['className'] = 'update-banner-note-footer-title'),
      (el23['textContent'] = autoUpdateText('notes.releaseFooterTitle')),
      el22['appendChild'](el23),
      _parseUpdateNotes2['footer']['forEach']((value26) => {
        const value27 = document['createElement']('p');
        ((value27['className'] = 'update-banner-note-paragraph'),
          _appendTextWithLinks(value27, value26),
          el22['appendChild'](value27));
      }),
      el17['appendChild'](el22));
  }
  return (el15['appendChild'](el16), el15['appendChild'](el17), el15);
}
function _normalizeHttpUrl(value28) {
  const enabled7 = String(value28 || '')['trim']();
  if (!enabled7) return '';
  const value29 = enabled7['startsWith']('//') ? 'https:' + enabled7 : enabled7;
  if (!/^https?:\/\//i['test'](value29)) return '';
  try {
    const uRL = new URL(value29);
    if (uRL['protocol'] !== 'http:' && uRL['protocol'] !== 'https:') return '';
    return uRL['toString']();
  } catch (value30) {
    return '';
  }
}
function _isDirectVideoUrl(value31) {
  try {
    return /\.(mp4|webm|ogg|m4v|mov)$/i['test'](new URL(value31)['pathname']);
  } catch (value32) {
    return false;
  }
}
function _isBilibiliHost(value33) {
  const value34 = String(value33 || '')['toLowerCase']();
  return value34 === 'bilibili.com' || value34['endsWith']('.bilibili.com');
}
function _buildBilibiliPlayerUrl(value35) {
  try {
    const uRL2 = new URL(value35);
    if (!_isBilibiliHost(uRL2['hostname'])) return '';
    if (uRL2['hostname']['toLowerCase']() === 'player.bilibili.com')
      return (uRL2['searchParams']['set']('autoplay', '0'), uRL2['toString']());
    const enabled8 = uRL2['pathname']['match'](/\/video\/(BV[a-zA-Z0-9]+)/),
      enabled9 = uRL2['pathname']['match'](/\/video\/av(\d+)/i);
    if (!enabled8 && !enabled9) return '';
    const uRL3 = new URL('https://player.bilibili.com/player.html');
    return (
      enabled8
        ? uRL3['searchParams']['set']('bvid', enabled8[1])
        : uRL3['searchParams']['set']('aid', enabled9[1]),
      uRL3['searchParams']['set']('page', uRL2['searchParams']['get']('p') || '1'),
      uRL3['searchParams']['set']('autoplay', '0'),
      uRL3['toString']()
    );
  } catch (value36) {
    return '';
  }
}
function _createPreviewVideo(value37) {
  const _normalizeHttpUrl2 = _normalizeHttpUrl(value37?.['previewVideoUrl'] || value37?.['preview_video_url']);
  if (!_normalizeHttpUrl2) return null;
  const el24 = document['createElement']('div');
  el24['className'] = 'update-banner-video-wrap';
  const el25 = document['createElement']('div');
  el25['className'] = 'update-banner-video-shell';
  if (_isDirectVideoUrl(_normalizeHttpUrl2)) {
    const value38 = document['createElement']('video');
    return (
      (value38['className'] = 'update-banner-video'),
      (value38['controls'] = true),
      (value38['playsInline'] = true),
      (value38['preload'] = 'metadata'),
      (value38['src'] = _normalizeHttpUrl2),
      el25['appendChild'](value38),
      el24['appendChild'](el25),
      el24
    );
  }
  const value39 = document['createElement']('iframe');
  return (
    (value39['className'] = 'update-banner-video-frame'),
    (value39['src'] = _buildBilibiliPlayerUrl(_normalizeHttpUrl2) || _normalizeHttpUrl2),
    (value39['loading'] = 'lazy'),
    (value39['allow'] = 'autoplay; fullscreen; picture-in-picture'),
    (value39['allowFullscreen'] = true),
    (value39['referrerPolicy'] = 'no-referrer-when-downgrade'),
    el25['appendChild'](value39),
    el24['appendChild'](el25),
    el24
  );
}
function _createTutorialVideoList(value40) {
  const list5 = Array['isArray'](value40) ? value40 : [],
    list6 = list5['map']((response) => ({
      title: String(response?.['title'] || '')['trim'](),
      url: String(response?.['url'] || '')['trim'](),
    }))['filter']((response2) => response2['title'] && _normalizeHttpUrl(response2['url']));
  if (!list6['length']) return null;
  const el26 = document['createElement']('div');
  return (
    (el26['className'] = 'update-banner-video-list'),
    list6['forEach']((previewVideoUrl) => {
      const el27 = document['createElement']('section');
      el27['className'] = 'update-banner-video-item';
      const el28 = document['createElement']('div');
      ((el28['className'] = 'update-banner-video-item-title'),
        (el28['textContent'] = previewVideoUrl['title']));
      const _createPreviewVideo2 = _createPreviewVideo({ previewVideoUrl: previewVideoUrl['url'] });
      el27['appendChild'](el28);
      if (_createPreviewVideo2) el27['appendChild'](_createPreviewVideo2);
      el26['appendChild'](el27);
    }),
    el26
  );
}
function _createTutorialLinkList(value41) {
  const list7 = Array['isArray'](value41) ? value41 : [],
    list8 = list7['map']((response3) => ({
      title: String(response3?.['title'] || '')['trim'](),
      url: _normalizeHttpUrl(response3?.['url']),
    }))['filter']((response4) => response4['title'] && response4['url']);
  if (!list8['length']) return null;
  const el29 = document['createElement']('div');
  return (
    (el29['className'] = 'update-banner-tutorial-links'),
    list8['forEach']((title3) => {
      const el30 = document['createElement']('div');
      el30['className'] = 'update-banner-tutorial-link';
      const el31 = document['createElement']('span');
      ((el31['className'] = 'update-banner-tutorial-link-label'),
        (el31['textContent'] = autoUpdateText('tutorial.linkLabel', { title: title3['title'] })));
      const el32 = document['createElement']('a');
      ((el32['className'] = 'update-banner-note-link'),
        (el32['href'] = title3['url']),
        (el32['dataset']['externalUrl'] = title3['url']),
        (el32['textContent'] = title3['url']),
        el30['appendChild'](el31),
        el30['appendChild'](el32),
        el29['appendChild'](el30));
    }),
    el29
  );
}
function _isDesktopProgramUpdateAvailable(options2 = {}) {
  return options2['desktopUpdaterUnavailable'] !== true && desktopBridge['app']['isAvailable']();
}
function _setProgramUpdateFallback(value42, value43) {
  const el33 = document['getElementById']('update-banner-btn'),
    el34 = document['getElementById']('update-banner-sub');
  el34 &&
    value43 &&
    ((el34['hidden'] = false),
    (el34['textContent'] = value43),
    el34['classList']['add']('is-error'));
  el33?.['classList']?.['remove']?.('is-download');
  if (!el33) return;
  const _isDesktopProgramUpdateAvailable2 = _isDesktopProgramUpdateAvailable(value42);
  (_setBtnContent(
    el33,
    false,
    _isDesktopProgramUpdateAvailable2
      ? autoUpdateText('buttons.downloadInstall')
      : autoUpdateText('buttons.programUpdateUnavailable'),
  ),
    (el33['disabled'] = !_isDesktopProgramUpdateAvailable2),
    (el33['onclick'] = _isDesktopProgramUpdateAvailable2
      ? () => _downloadDesktopUpdate(el33, { ensureAvailable: true })
      : null));
}
function _setUpdateProgress(value44, value45 = '') {
  const el35 = document['getElementById']('update-banner-progress'),
    el36 = document['getElementById']('update-banner-progress-bar'),
    el37 = document['getElementById']('update-banner-progress-text');
  if (!el35 || !el36 || !el37) return;
  const percent = _formatPercent(value44);
  ((el35['hidden'] = false),
    (el36['style']['width'] = percent),
    (el37['textContent'] = value45 || autoUpdateText('progress.downloading', { percent: percent })));
}
function _setDesktopDownloadInPlace(options3 = {}, { retrying: retrying = false } = {}) {
  const enabled10 = document['getElementById']('update-banner');
  if (!enabled10) return false;
  const el38 = document['getElementById']('update-banner-sub'),
    el39 = document['getElementById']('update-banner-btn'),
    el40 = document['getElementById']('update-banner-close'),
    value46 = document['getElementById']('update-banner-cancel'),
    count = Number(options3['retryCount'] || 0),
    value47 = retrying
      ? autoUpdateText('progress.retrying', { count: count })
      : autoUpdateText('progress.downloading', { percent: '0%' });
  el38 &&
    ((el38['hidden'] = false),
    el38['classList']['remove']('is-error'),
    (el38['textContent'] = retrying
      ? autoUpdateText('status.autoRetry')
      : autoUpdateText('status.downloadingAutoInstall')));
  (_setUpdateProgress(0, value47),
    _setBtnContent(
      el39,
      true,
      retrying ? autoUpdateText('buttons.retrying') : autoUpdateText('buttons.downloading'),
    ));
  if (el39) el39['disabled'] = true;
  if (value46) value46['onclick'] = _cancelDesktopUpdateDownload;
  return (
    el40 && ((el40['disabled'] = false), (el40['onclick'] = _cancelDesktopUpdateDownload)),
    (_activeBannerInfo = { ...(_activeBannerInfo || {}), closeAction: _cancelDesktopUpdateDownload }),
    true
  );
}
function _showBanner(enabled11, enabled12 = {}) {
  if (_startupBannerQueue['defer'](() => _showBanner(enabled11, enabled12))) return;
  if (enabled12['replace']) _removeBanner();
  if (!enabled12['ignoreDismissed'] && _dismissedSignature === _getUpdateSignature(enabled11)) return;
  if (document['getElementById']('update-banner')) return;
  const value48 = enabled11['hasUpdate'] !== false,
    version = _formatBannerVersion(enabled11['remoteVersion'] || autoUpdateText('versions.newVersion')),
    version2 = _formatBannerVersion(enabled11['localVersion'] || autoUpdateText('versions.currentVersion')),
    pubDate = _formatPubDate(enabled11['pubDate']),
    enabled13 = Boolean(enabled11['previewOnly']),
    el41 = document['createElement']('div');
  ((el41['id'] = 'update-banner'), (el41['className'] = 'update-banner'));
  const el42 = document['createElement']('div');
  ((el42['id'] = 'update-banner-backdrop'),
    (el42['className'] = 'update-banner-backdrop'),
    el42['setAttribute']('aria-hidden', 'true'));
  const el43 = document['createElement']('div');
  el43['className'] = 'update-banner-header';
  const el44 = document['createElement']('span');
  ((el44['className'] = 'update-banner-icon'),
    el44['setAttribute']('aria-hidden', 'true'),
    el44['appendChild'](_createUpdateSvg()));
  const el45 = document['createElement']('div');
  el45['className'] = 'update-banner-header-title';
  if (enabled11['titleText']) el45['textContent'] = enabled11['titleText'];
  else {
    const el46 = document['createElement']('span');
    ((el46['textContent'] = autoUpdateText('banner.versionUpdateTitle', { version: version })),
      el45['appendChild'](el46));
    if (version2) {
      const el47 = document['createElement']('span');
      ((el47['className'] = 'update-banner-header-current'),
        (el47['textContent'] = autoUpdateText('banner.currentVersionSuffix', { version: version2 })),
        el45['appendChild'](el47));
    }
  }
  const el48 = document['createElement']('button');
  ((el48['type'] = 'button'),
    (el48['className'] = 'update-banner-close'),
    (el48['id'] = 'update-banner-close'),
    el48['setAttribute']('aria-label', autoUpdateText('banner.closeAria')),
    (el48['title'] = autoUpdateText('buttons.close')),
    (el48['textContent'] = '×'),
    el43['appendChild'](el44),
    el43['appendChild'](el45),
    el43['appendChild'](el48));
  const el49 = document['createElement']('div');
  el49['className'] = 'update-banner-text';
  const el50 = document['createElement']('div');
  ((el50['className'] = 'update-banner-sub'), (el50['id'] = 'update-banner-sub'));
  const value49 = enabled13
      ? ''
      : pubDate
        ? autoUpdateText('banner.subtitleWithDate', { localVersion: version2, pubDate: pubDate })
        : value48
          ? ''
          : autoUpdateText('banner.subtitleNoUpdate', { localVersion: version2, remoteVersion: version }),
    enabled14 = enabled11['subtitleText'] || value49;
  ((el50['textContent'] = enabled14), (el50['hidden'] = !enabled14));
  const el51 = document['createElement']('div');
  ((el51['className'] = 'update-banner-progress'),
    (el51['id'] = 'update-banner-progress'),
    (el51['hidden'] = !enabled11['showProgress']));
  const el52 = document['createElement']('div');
  el52['className'] = 'update-banner-progress-track';
  const el53 = document['createElement']('div');
  ((el53['className'] = 'update-banner-progress-bar'),
    (el53['id'] = 'update-banner-progress-bar'),
    (el53['style']['width'] = _formatPercent(enabled11['progressPercent'])));
  const el54 = document['createElement']('div');
  ((el54['className'] = 'update-banner-progress-text'),
    (el54['id'] = 'update-banner-progress-text'),
    (el54['textContent'] =
      enabled11['progressText'] ||
      autoUpdateText('progress.downloading', { percent: _formatPercent(enabled11['progressPercent']) })),
    el52['appendChild'](el53),
    el51['appendChild'](el52),
    el51['appendChild'](el54));
  const _createNotesPanel2 = _createNotesPanel(enabled11['notes']),
    _createPreviewVideo3 = _createPreviewVideo(enabled11),
    _createTutorialLinkList2 = _createTutorialLinkList(enabled11['tutorialLinks']),
    _createTutorialVideoList2 = _createTutorialVideoList(enabled11['tutorialVideos']);
  if (_createTutorialLinkList2) el49['appendChild'](_createTutorialLinkList2);
  if (!enabled11['hideSubtitle']) el49['appendChild'](el50);
  el49['appendChild'](el51);
  if (_createPreviewVideo3) el49['appendChild'](_createPreviewVideo3);
  if (_createTutorialVideoList2) el49['appendChild'](_createTutorialVideoList2);
  if (!enabled11['hideNotes']) el49['appendChild'](_createNotesPanel2);
  const el55 = document['createElement']('div');
  el55['className'] = 'update-banner-actions';
  if ((value48 || enabled13) && !enabled11['hideCancelButton']) {
    const el56 = document['createElement']('button');
    ((el56['type'] = 'button'),
      (el56['className'] = 'update-banner-btn update-banner-btn-secondary'),
      (el56['id'] = 'update-banner-cancel'),
      (el56['textContent'] =
        enabled11['cancelText'] ||
        (enabled13 ? autoUpdateText('buttons.close') : autoUpdateText('buttons.cancel'))),
      (el56['onclick'] = () => {
        if (typeof enabled11['cancelAction'] === 'function') {
          enabled11['cancelAction'](enabled11);
          return;
        }
        _removeBanner();
      }),
      el55['appendChild'](el56));
  }
  if (!enabled13 && value48 && !enabled11['disableSkip']) {
    const el57 = document['createElement']('button');
    ((el57['type'] = 'button'),
      (el57['className'] = 'update-banner-btn update-banner-btn-secondary'),
      (el57['textContent'] = autoUpdateText('buttons.skipVersion')),
      (el57['onclick'] = () => _dismissBanner(enabled11)),
      el55['appendChild'](el57));
  }
  const el58 = document['createElement']('button');
  ((el58['type'] = 'button'),
    (el58['className'] = 'update-banner-btn'),
    (el58['id'] = 'update-banner-btn'));
  const autoUpdatePrimaryAction = resolveAutoUpdatePrimaryAction(enabled11, {
    desktopUpdaterAvailable: _isDesktopProgramUpdateAvailable(enabled11),
  });
  if (enabled13)
    (el58['classList']['add']('is-primary'),
      _setBtnContent(el58, false, enabled11['previewCloseText'] || autoUpdateText('buttons.gotIt')),
      (el58['onclick'] = () => _removeBanner()));
  else {
    if (autoUpdatePrimaryAction === AUTO_UPDATE_PRIMARY_ACTIONS['INSTALL_DESKTOP'])
      (el58['classList']['add']('is-primary'),
        _setBtnContent(el58, false, autoUpdateText('buttons.restartInstall')),
        (el58['onclick'] = () => _installDownloadedDesktopUpdate(el58)));
    else {
      if (autoUpdatePrimaryAction === AUTO_UPDATE_PRIMARY_ACTIONS['RETRY_DESKTOP'])
        (el58['classList']['add']('is-primary'),
          _setBtnContent(el58, false, autoUpdateText('buttons.retryDownloadInstall')),
          (el58['onclick'] = () => _downloadDesktopUpdate(el58)));
      else {
        if (autoUpdatePrimaryAction === AUTO_UPDATE_PRIMARY_ACTIONS['DOWNLOAD_DESKTOP'])
          (el58['classList']['add']('is-primary'),
            _setBtnContent(el58, false, autoUpdateText('buttons.downloadInstall')),
            (el58['onclick'] = () =>
              _downloadDesktopUpdate(el58, { ensureAvailable: !enabled11['startDesktopDownload'] })));
        else {
          if (autoUpdatePrimaryAction === AUTO_UPDATE_PRIMARY_ACTIONS['HOT_APPLY'])
            (el58['classList']['add']('is-primary'),
              _setBtnContent(el58, false, autoUpdateText('buttons.updateNow')),
              (el58['onclick'] = () => _doApply(enabled11)));
          else
            autoUpdatePrimaryAction === AUTO_UPDATE_PRIMARY_ACTIONS['CLOSE']
              ? (el58['classList']['add']('is-primary'),
                _setBtnContent(el58, false, autoUpdateText('buttons.gotIt')),
                (el58['onclick'] = () => _removeBanner()))
              : (_setBtnContent(el58, false, autoUpdateText('buttons.programUpdateUnavailable')),
                (el58['disabled'] = true));
        }
      }
    }
  }
  (el55['appendChild'](el58),
    el41['appendChild'](el43),
    el41['appendChild'](el49),
    el41['appendChild'](el55),
    document['body']['appendChild'](el42),
    document['body']['appendChild'](el41),
    el42['classList']['add']('open'),
    el41['classList']['add']('open'),
    (_activeBannerInfo = enabled11),
    document['addEventListener']('keydown', _handleBannerKeydown),
    (el48['onclick'] = () => {
      if (typeof enabled11['closeAction'] === 'function') {
        enabled11['closeAction'](enabled11);
        return;
      }
      _removeBanner();
    }));
}
async function _cancelDesktopUpdateDownload() {
  const enabled15 = desktopBridge['app'];
  ((_desktopInstallAfterDownload = false), _removeBanner());
  if (!enabled15['isAvailable']()) return;
  try {
    const response5 = await enabled15['cancelUpdateDownload']();
    if (response5?.['ok'] === false) {
      window['showToast']?.(autoUpdateText('toasts.cancelDownloadFailed'), 'error');
      return;
    }
    response5?.['cancelled'] !== false && window['showToast']?.(autoUpdateText('toasts.downloadCancelled'));
  } catch (value50) {
    window['showToast']?.(autoUpdateText('toasts.cancelDownloadFailed'), 'error');
  }
}
async function _downloadDesktopUpdate(el59, { ensureAvailable: ensureAvailable = false } = {}) {
  const enabled16 = desktopBridge['app'];
  if (!enabled16['isAvailable']()) return;
  (_setBtnContent(el59, true, autoUpdateText('buttons.preparingDownload')),
    (el59['disabled'] = true),
    (_desktopInstallAfterDownload = true));
  try {
    if (ensureAvailable) {
      const desktopUpdateAvailable = await ensureDesktopUpdateAvailable(enabled16);
      if (desktopUpdateAvailable?.['state'] === 'downloaded') {
        await _installDownloadedDesktopUpdate(el59);
        return;
      }
    }
    const response6 = await enabled16['downloadUpdate']();
    if (response6?.['ok'] === false && !response6?.['cancelled'])
      throw new Error('desktop update download failed');
  } catch (value51) {
    ((_desktopInstallAfterDownload = false),
      (el59['disabled'] = false),
      _setBtnContent(el59, false, autoUpdateText('buttons.downloadInstall')),
      window['showToast']?.(autoUpdateText('toasts.programUpdateFailed'), 'error'));
  }
}
async function _installDownloadedDesktopUpdate(el60) {
  const enabled17 = desktopBridge['app'];
  if (!enabled17['isAvailable']()) return;
  _setBtnContent(el60, true, autoUpdateText('buttons.restarting'));
  if (el60) el60['disabled'] = true;
  try {
    await enabled17['installDownloadedUpdate']();
  } catch (value52) {
    if (el60) el60['disabled'] = false;
    (_setBtnContent(el60, false, autoUpdateText('buttons.restartInstall')),
      window['showToast']?.(autoUpdateText('toasts.restartInstallFailed')));
  }
}
async function _doApply(enabled18) {
  if (enabled18?.['previewOnly']) {
    window['showToast']?.(autoUpdateText('toasts.previewOnly'));
    return;
  }
  if (!enabled18?.['canHotApply']) {
    _setProgramUpdateFallback(enabled18, autoUpdateText('errors.programUpdateRequired'));
    return;
  }
  const el61 = document['getElementById']('update-banner-btn'),
    el62 = document['getElementById']('update-banner-sub');
  (el62?.['classList']?.['remove']?.('is-error'),
    el61?.['classList']?.['remove']?.('is-download'),
    _setBtnContent(el61, true, autoUpdateText('buttons.updating')));
  if (el61) el61['disabled'] = true;
  try {
    const error = await applyUpdateFromServer();
    if (error['success']) {
      _setBtnContent(el61, true, autoUpdateText('buttons.restartingWait'));
      const value53 = Date['now']() + 30000,
        async2 = async () => {
          if (Date['now']() > value53) {
            location['reload']();
            return;
          }
          try {
            const pingUpdateCheckFromServer2 = await pingUpdateCheckFromServer();
            if (pingUpdateCheckFromServer2) {
              location['reload']();
              return;
            }
          } catch (value54) {}
          setTimeout(async2, 800);
        };
      setTimeout(async2, 2000);
      return;
    }
    _setProgramUpdateFallback(
      enabled18,
      autoUpdateText('errors.hotApplyFailed', {
        error: error['error'] || autoUpdateText('errors.unknownProgramUpdate'),
      }),
    );
  } catch (value55) {
    _setProgramUpdateFallback(enabled18, autoUpdateText('errors.networkProgramUpdate'));
  }
}
async function _checkUpdate() {
  if (desktopBridge['isElectron'] || _desktopUpdaterActive) return;
  try {
    const checkUpdateFromServer2 = await checkUpdateFromServer();
    if (checkUpdateFromServer2?.['hasUpdate']) _showBanner(checkUpdateFromServer2);
  } catch (value56) {}
}
function _normalizeDesktopUpdateInfo(value57) {
  const releaseDate = value57 && typeof value57 === 'object' ? value57 : {};
  return {
    version: String(releaseDate['version'] || '')['trim'](),
    releaseDate: releaseDate['releaseDate'] || '',
    releaseNotes: String(releaseDate['releaseNotes'] || '')['trim'](),
    previewVideoUrl: String(releaseDate['previewVideoUrl'] || releaseDate['preview_video_url'] || '')['trim'](),
  };
}
function _formatDesktopRemoteVersion(value58) {
  const enabled19 = String(value58 || '')['trim']();
  if (!enabled19 || enabled19 === autoUpdateText('versions.newVersion'))
    return autoUpdateText('versions.newVersion');
  return enabled19['startsWith']('V') ? enabled19 : 'V' + enabled19;
}
function _getPageLocalVersion() {
  const value59 = document['querySelector']('meta[name="app-version"]')?.['getAttribute']('content');
  return String(value59 || '')['trim']();
}
function _isRemoteVersionNewer(value60, value61, value62 = false) {
  const run2 = (value63) =>
      String(value63 || '')
        ['replace'](/^[vV]/, '')
        ['match'](/\d+/g)
        ?.['map'](Number) || [],
    list9 = run2(value60),
    list10 = run2(value61);
  if (!list9['length'] || !list10['length']) return Boolean(value62);
  const value64 = Math['max'](list9['length'], list10['length']);
  for (let value65 = 0; value65 < value64; value65 += 1) {
    const value66 = list9[value65] || 0,
      value67 = list10[value65] || 0;
    if (value67 !== value66) return value67 > value66;
  }
  return false;
}
async function _getDesktopLocalVersion() {
  try {
    const value68 = await desktopBridge['app']['getAppVersion']();
    return value68 ? 'V' + value68 : autoUpdateText('versions.unknownVersion');
  } catch (value69) {
    return autoUpdateText('versions.unknownVersion');
  }
}
async function _showManualUpdateResult(options4 = {}, subtitleText = '') {
  const pubDate2 = options4 && typeof options4 === 'object' ? options4 : {},
    _normalizeDesktopUpdateInfo2 = _normalizeDesktopUpdateInfo(pubDate2),
    localVersion = _getPageLocalVersion() || pubDate2['localVersion'] || (await _getDesktopLocalVersion()),
    remoteVersion =
      pubDate2['remoteVersion'] ||
      (_normalizeDesktopUpdateInfo2['version']
        ? _formatDesktopRemoteVersion(_normalizeDesktopUpdateInfo2['version'])
        : autoUpdateText('versions.unknownVersion'));
  _showBanner(
    {
      ...pubDate2,
      hasUpdate: false,
      previewOnly: false,
      localVersion: localVersion,
      remoteVersion: remoteVersion,
      pubDate: pubDate2['pubDate'] || _normalizeDesktopUpdateInfo2['releaseDate'] || '',
      subtitleText: subtitleText || pubDate2['subtitleText'] || autoUpdateText('toasts.alreadyLatest'),
      notes: pubDate2['notes'] || _normalizeDesktopUpdateInfo2['releaseNotes'] || '',
      canHotApply: false,
    },
    { replace: true, ignoreDismissed: true },
  );
}
async function _showDesktopUpdateBanner(value70, value71 = {}) {
  const value72 = ++_desktopBannerRequestSequence,
    pubDate3 = _normalizeDesktopUpdateInfo(value71['info'] || _desktopUpdateInfo);
  if (pubDate3['version']) _desktopUpdateInfo = pubDate3;
  const value73 = pubDate3['version'] || autoUpdateText('versions.newVersion'),
    localVersion2 = await _getDesktopLocalVersion();
  if (value72 !== _desktopBannerRequestSequence) return;
  const remoteVersion2 = _formatDesktopRemoteVersion(value73),
    notes = pubDate3['releaseNotes'] || autoUpdateText('desktop.downloadedNotes'),
    subtitleText2 = value70 === 'downloaded',
    showProgress = value70 === 'downloading',
    enabled20 = value70 === 'retrying',
    progressPercent = Number(value71['percent'] || 0),
    progressText = enabled20
      ? autoUpdateText('progress.retrying', { count: Number(value71['retryCount'] || 0) })
      : autoUpdateText('progress.downloading', { percent: _formatPercent(progressPercent) });
  _showBanner(
    {
      hasUpdate: true,
      localVersion: localVersion2,
      remoteVersion: remoteVersion2,
      pubDate: pubDate3['releaseDate'] || '',
      subtitleText: subtitleText2
        ? autoUpdateText('desktop.subtitleDownloaded', { localVersion: localVersion2, remoteVersion: remoteVersion2 })
        : showProgress || enabled20
          ? autoUpdateText('desktop.subtitleDownloading', {
              localVersion: localVersion2,
              remoteVersion: remoteVersion2,
            })
          : autoUpdateText('desktop.subtitleAvailable', {
              localVersion: localVersion2,
              remoteVersion: remoteVersion2,
            }),
      notes: notes,
      previewVideoUrl: subtitleText2 ? '' : pubDate3['previewVideoUrl'],
      canHotApply: false,
      startDesktopDownload: !subtitleText2 && !showProgress && !enabled20,
      installDownloadedUpdate: subtitleText2,
      showProgress: showProgress || enabled20,
      hideNotes: subtitleText2,
      progressPercent: progressPercent,
      progressText: progressText,
      cancelText: subtitleText2 ? autoUpdateText('buttons.later') : autoUpdateText('buttons.cancel'),
      cancelAction: showProgress || enabled20 ? _cancelDesktopUpdateDownload : null,
      closeAction: showProgress || enabled20 ? _cancelDesktopUpdateDownload : null,
      disableSkip: true,
      hideSubtitle: false,
    },
    { replace: true, ignoreDismissed: true },
  );
}
async function _showDesktopDownloadFailedBanner(options5 = {}) {
  const value74 = ++_desktopBannerRequestSequence,
    pubDate4 = _normalizeDesktopUpdateInfo(options5['info'] || _desktopUpdateInfo);
  if (pubDate4['version']) _desktopUpdateInfo = pubDate4;
  const value75 = pubDate4['version'] || autoUpdateText('versions.newVersion'),
    localVersion3 = await _getDesktopLocalVersion();
  if (value74 !== _desktopBannerRequestSequence) return;
  const remoteVersion3 = _formatDesktopRemoteVersion(value75),
    retryCount = Number(options5['retryCount'] || 0),
    subtitleText3 = Number(options5['maxRetries'] || 0),
    message = autoUpdateText('desktop.downloadFailedMessage');
  _showBanner(
    {
      hasUpdate: true,
      localVersion: localVersion3,
      remoteVersion: remoteVersion3,
      pubDate: pubDate4['releaseDate'] || '',
      subtitleText: subtitleText3
        ? autoUpdateText('desktop.downloadFailedWithRetries', {
            message: message,
            retryCount: retryCount,
            maxRetries: subtitleText3,
          })
        : message,
      notes: pubDate4['releaseNotes'] || autoUpdateText('desktop.downloadFailedNotes'),
      previewVideoUrl: '',
      canHotApply: false,
      retryDesktopDownload: true,
      showProgress: false,
      hideNotes: true,
      cancelText: autoUpdateText('buttons.later'),
      disableSkip: true,
      hideSubtitle: false,
    },
    { replace: true, ignoreDismissed: true },
  );
}
function _desktopEventFromState(state2 = {}) {
  if (state2['latestEvent']) return state2['latestEvent'];
  if (!state2['state'] || state2['state'] === 'idle') return null;
  const value76 = {
      checking: 'checking',
      available: 'available',
      downloading: 'download-started',
      downloaded: 'downloaded',
      error: 'download-failed',
      installing: 'installing',
    },
    type = value76[state2['state']];
  if (!type) return null;
  return {
    type: type,
    state: state2['state'],
    info: state2['latestInfo'] || null,
    retryCount: state2['retryCount'] || 0,
    maxRetries: state2['maxRetries'] || 0,
  };
}
function _handleDesktopUpdaterEvent(enabled21) {
  if (!enabled21 || typeof enabled21 !== 'object') return;
  if (enabled21['type'] === 'checking') {
    ((_desktopBannerRequestSequence += 1), _startupBannerQueue['clear'](), (_desktopUpdaterActive = true));
    return;
  }
  if (enabled21['type'] === 'available') {
    ((_desktopUpdaterActive = true),
      _startupAutomaticToastQueue['clear'](),
      void _showDesktopUpdateBanner('available', enabled21));
    return;
  }
  if (enabled21['type'] === 'download-started') {
    ((_desktopBannerRequestSequence += 1), (_desktopUpdaterActive = true));
    if (_setDesktopDownloadInPlace(enabled21)) return;
    void _showDesktopUpdateBanner('downloading', enabled21);
    return;
  }
  if (enabled21['type'] === 'download-retry') {
    ((_desktopBannerRequestSequence += 1), (_desktopUpdaterActive = true));
    if (_setDesktopDownloadInPlace(enabled21, { retrying: true })) return;
    void _showDesktopUpdateBanner('retrying', enabled21);
    return;
  }
  if (enabled21['type'] === 'download-progress') {
    ((_desktopBannerRequestSequence += 1), (_desktopUpdaterActive = true));
    if (!document['getElementById']('update-banner-progress')) {
      void _showDesktopUpdateBanner('downloading', enabled21);
      return;
    }
    _setUpdateProgress(
      enabled21['percent'],
      autoUpdateText('progress.downloading', { percent: _formatPercent(enabled21['percent']) }),
    );
    return;
  }
  if (enabled21['type'] === 'downloaded') {
    _desktopUpdaterActive = true;
    if (_desktopInstallAfterDownload) {
      ((_desktopBannerRequestSequence += 1), (_desktopInstallAfterDownload = false));
      const el63 = document['getElementById']('update-banner-btn'),
        el64 = document['getElementById']('update-banner-sub');
      el64 &&
        (el64['classList']['remove']('is-error'),
        (el64['textContent'] = autoUpdateText('status.downloadedRestarting')));
      _setBtnContent(el63, true, autoUpdateText('buttons.restartingInstall'));
      if (el63) el63['disabled'] = true;
      void _installDownloadedDesktopUpdate(el63);
      return;
    }
    void _showDesktopUpdateBanner('downloaded', enabled21);
    return;
  }
  if (enabled21['type'] === 'download-failed') {
    ((_desktopUpdaterActive = true),
      (_desktopInstallAfterDownload = false),
      void _showDesktopDownloadFailedBanner(enabled21));
    return;
  }
  if (enabled21['type'] === 'download-cancelled') {
    ((_desktopBannerRequestSequence += 1),
      (_desktopUpdaterActive = true),
      (_desktopInstallAfterDownload = false),
      _removeBanner());
    return;
  }
  if (enabled21['type'] === 'not-available') {
    ((_desktopBannerRequestSequence += 1),
      _startupBannerQueue['clear'](),
      (_desktopUpdaterActive = false),
      _startupAutomaticToastQueue['clear']());
    enabled21['manual'] &&
      void _showManualUpdateResult(enabled21['info'], autoUpdateText('toasts.alreadyLatest'));
    return;
  }
  if (enabled21['type'] === 'installing') {
    ((_desktopBannerRequestSequence += 1),
      (_desktopUpdaterActive = true),
      window['showToast']?.(autoUpdateText('toasts.installing')));
    return;
  }
  if (enabled21['type'] === 'error') {
    if (enabled21['skipped']) return;
    ((_desktopBannerRequestSequence += 1),
      _startupBannerQueue['clear'](),
      (_desktopInstallAfterDownload = false));
    const autoUpdateText2 = autoUpdateText('toasts.updateFailed');
    if (enabled21['manual']) {
      void _showManualUpdateResult(enabled21['info'], autoUpdateText2);
      return;
    }
    _showAutomaticUpdateToast(autoUpdateText2);
  }
}
function _showAutomaticUpdateToast(value77) {
  const run3 = () => window['showToast']?.(value77);
  if (isStartupVisualComplete()) {
    run3();
    return;
  }
  if (_startupAutomaticToastQueue['defer'](run3)) return;
  void waitForStartupVisualComplete()['then'](run3);
}
function _bindDesktopUpdaterEvents() {
  const enabled22 = desktopBridge['app'];
  if (!enabled22['isAvailable']() || _desktopUpdateUnsubscribe) return;
  ((_desktopUpdateUnsubscribe = enabled22['onUpdaterEvent'](_handleDesktopUpdaterEvent)),
    void enabled22['getUpdateState']()
      ['then']((value78) => {
        const _desktopEventFromState2 = _desktopEventFromState(value78);
        if (_desktopEventFromState2) _handleDesktopUpdaterEvent(_desktopEventFromState2);
      })
      ['catch'](() => {}));
}
export function initAutoUpdate() {
  (_bindDesktopUpdaterEvents(),
    setTimeout(_checkUpdate, 5000),
    setTimeout(_checkUpdate, 20000),
    setInterval(_checkUpdate, CHECK_INTERVAL));
}
export async function showManualUpdateCheck() {
  window['showToast']?.(autoUpdateText('toasts.checkingUpdate'));
  let desktopUpdaterUnavailable = false;
  if (desktopBridge['app']['isAvailable']())
    try {
      const value79 = await desktopBridge['app']['checkForUpdates'](),
        enabled23 = value79?.['skipped'] === true && value79?.['reason'] === 'not-packaged';
      desktopUpdaterUnavailable = enabled23;
      if (!enabled23) {
        value79?.['state'] === 'idle' &&
          !document['getElementById']('update-banner') &&
          (await _showManualUpdateResult({}, autoUpdateText('toasts.alreadyLatest')));
        return;
      }
    } catch (value80) {
      await _showManualUpdateResult({}, autoUpdateText('toasts.desktopCheckFailed'));
      return;
    }
  try {
    let args = await checkUpdateFromServer({ force: true, includeCurrent: true });
    if (!args?.['remoteVersion'] && !args?.['notes'] && !args?.['releaseUrl'])
      try {
        const checkLocalUpdatePreviewFromServer2 = await checkLocalUpdatePreviewFromServer();
        if (checkLocalUpdatePreviewFromServer2?.['remoteVersion'] || checkLocalUpdatePreviewFromServer2?.['notes'] || checkLocalUpdatePreviewFromServer2?.['releaseUrl'])
          args = checkLocalUpdatePreviewFromServer2;
      } catch (value81) {}
    if (args?.['remoteVersion'] || args?.['notes'] || args?.['releaseUrl']) {
      const localVersion4 = _getPageLocalVersion() || args['localVersion'],
        hasUpdate = _isRemoteVersionNewer(
          localVersion4,
          args['remoteVersion'],
          args['hasUpdate'] === true,
        ),
        value82 = {
          ...args,
          hasUpdate: hasUpdate,
          previewOnly: false,
          localVersion: localVersion4,
          desktopUpdaterUnavailable: desktopUpdaterUnavailable,
        };
      hasUpdate
        ? _showBanner(value82, { replace: true, ignoreDismissed: true })
        : await _showManualUpdateResult(value82, autoUpdateText('toasts.alreadyLatest'));
      return;
    }
    await _showManualUpdateResult(args, autoUpdateText('toasts.noRemoteInfo'));
  } catch (value83) {
    await _showManualUpdateResult({}, autoUpdateText('toasts.remoteCheckFailed'));
  }
}
export async function showLocalUpdatePreview() {
  try {
    window['showToast']?.(autoUpdateText('toasts.generatingPreview'));
    const checkLocalUpdatePreviewFromServer3 = await checkLocalUpdatePreviewFromServer();
    if (checkLocalUpdatePreviewFromServer3?.['previewOnly'] && (checkLocalUpdatePreviewFromServer3?.['remoteVersion'] || checkLocalUpdatePreviewFromServer3?.['notes'])) {
      _showBanner(checkLocalUpdatePreviewFromServer3, { replace: true, ignoreDismissed: true });
      return;
    }
    window['showToast']?.(autoUpdateText('toasts.noLocalPreview'));
  } catch (value84) {
    window['showToast']?.(autoUpdateText('toasts.localPreviewFailed'));
  }
}
export function showTutorialVideoPanel(url, tutorialLinks = []) {
  const tutorialVideos = Array['isArray'](url)
      ? url
      : [{ title: autoUpdateText('tutorial.defaultTitle'), url: url }],
    version3 = _formatBannerVersion(_getPageLocalVersion()),
    remoteVersion4 = version3
      ? autoUpdateText('tutorial.versionedTitle', { version: version3 })
      : autoUpdateText('tutorial.title');
  _showBanner(
    {
      previewOnly: true,
      hasUpdate: false,
      localVersion: '',
      remoteVersion: remoteVersion4,
      titleText: remoteVersion4,
      subtitleText: autoUpdateText('tutorial.subtitle'),
      notes: '',
      tutorialLinks: tutorialLinks,
      tutorialVideos: tutorialVideos,
      canHotApply: false,
      hideNotes: true,
      hideCancelButton: true,
      previewCloseText: autoUpdateText('buttons.close'),
    },
    { replace: true, ignoreDismissed: true },
  );
}

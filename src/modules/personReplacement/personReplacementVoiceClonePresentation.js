import { renderAudioPlaybackSurface } from '../../components/audio-node/audioPlaybackSurface.js';
import { renderGenerationErrorCardMarkup } from '../../components/generationErrorCard.js';
import { localPathToUrl } from '../../utils/localMediaPath.js';
import {
  getWorkspaceAssetAppearances,
  getWorkspaceAssetBaseAppearance,
} from '../workspaceAssetAppearance.js';
import { renderPersonReplacementVoicePreviewPlayer } from './personReplacementAssetPresentation.js';
import { normalizePersonReplacementVoiceLayout } from './personReplacementProjectSession.js';
import {
  isPersonReplacementVoiceSeparationActive,
  resolvePersonReplacementVoiceSeparationState,
} from './personReplacementVoiceSeparationState.js';
function normalizeText(_0x39a044) {
  return String(_0x39a044 ?? '')['trim']();
}
function escapeHtml(_0x41bd67) {
  return String(_0x41bd67 ?? '')
    ['replaceAll']('&', '&amp;')
    ['replaceAll']('<', '&lt;')
    ['replaceAll']('>', '&gt;')
    ['replaceAll']('\x22', '&quot;')
    ['replaceAll']('\x27', '&apos;');
}
function normalizeMediaUrl(_0x4043f6) {
  const _0x9305a = normalizeText(_0x4043f6);
  if (!_0x9305a) return '';
  return localPathToUrl(_0x9305a) || _0x9305a;
}
function formatClock(_0x5971dc) {
  const _0x341e7d = Math['max'](0x0, Number(_0x5971dc) || 0x0),
    _0x386a55 = Math['floor'](_0x341e7d / 0x3c),
    _0x317cc4 = Math['floor'](_0x341e7d % 0x3c);
  return String(_0x386a55)['padStart'](0x2, '0') + ':' + String(_0x317cc4)['padStart'](0x2, '0');
}
function getCharacterAppearance(_0x6f756f = {}) {
  const _0x3e5277 = getWorkspaceAssetAppearances(_0x6f756f);
  return getWorkspaceAssetBaseAppearance(_0x6f756f) || _0x3e5277[0x0] || null;
}
function getCharacterVoiceUrl(_0x3ad679 = {}) {
  return normalizeMediaUrl(
    _0x3ad679['voiceReference']?.['audioUrl'] ||
      _0x3ad679['voiceReference']?.['localPath'] ||
      _0x3ad679['voiceRef'],
  );
}
export function getPersonReplacementVoiceCloneCharacters(_0x153f0f = {}) {
  return Array['isArray'](_0x153f0f['characters']) ? _0x153f0f['characters'] : [];
}
export function renderPersonReplacementVoiceCloneCharacterCards(_0x41de52) {
  const _0x360e2a = getPersonReplacementVoiceCloneCharacters(_0x41de52);
  return _0x360e2a['map']((_0xca9c40) => {
    const _0x15afb7 = getCharacterAppearance(_0xca9c40),
      _0x50462b = normalizeMediaUrl(_0x15afb7?.['imageUrl']),
      _0x3de740 = getCharacterVoiceUrl(_0xca9c40),
      _0x488bc7 = Boolean(_0x3de740),
      _0x5bbc10 = renderPersonReplacementVoicePreviewPlayer(
        { ..._0xca9c40, kind: 'character' },
        { className: 'person-replacement-voice-asset-preview', showWaveform: ![] },
      );
    return (
      '<article class="person-replacement-voice-asset-shell' +
      (_0x488bc7 ? ' has-audio' : ' is-missing-audio') +
      '">\n      <button type="button" class="person-replacement-voice-asset-card' +
      (_0x488bc7 ? '\x20has-audio' : ' is-missing-audio') +
      '" data-person-replacement-action="select-voice-asset" data-person-replacement-voice-asset-id="' +
      escapeHtml(_0xca9c40['id']) +
      '" data-character-id="' +
      escapeHtml(_0xca9c40['id']) +
      '\x22\x20' +
      (_0x488bc7 ? 'draggable=\x22true\x22' : 'disabled') +
      ' aria-label="' +
      escapeHtml(_0x488bc7 ? '加载' + _0xca9c40['name'] + '的人物音频' : _0xca9c40['name'] + '无音频') +
      '\x22>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-voice-asset-image\x22>' +
      (_0x50462b
        ? '<img src="' + escapeHtml(_0x50462b) + '" alt="' + escapeHtml(_0xca9c40['name']) + '\x22>'
        : '<span aria-hidden="true">人</span>') +
      '</span>\n        <span class="person-replacement-voice-asset-copy"><strong>' +
      escapeHtml(_0xca9c40['name']) +
      '</strong><small>' +
      (_0x488bc7 ? '选择人物素材，使用对应声音' : '无音频') +
      '</small></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-voice-asset-status' +
      (_0x488bc7 ? '\x20is-ready' : '\x20is-empty') +
      '\x22>' +
      (_0x488bc7 ? '可用' : '无音频') +
      '</span>\n      </button>\n      ' +
      _0x5bbc10 +
      '\x0a\x20\x20\x20\x20</article>'
    );
  })['join']('');
}
function renderVoiceCloneCharacterAssets(_0x37a4e6) {
  const _0x223ca9 = renderPersonReplacementVoiceCloneCharacterCards(_0x37a4e6);
  return (
    '<aside class="person-replacement-voice-assets" aria-label="人物音频素材">\n    <header class="person-replacement-voice-column-heading"><strong>人物素材</strong><small>显示当前项目的全部人物</small></header>\n    <div class="person-replacement-voice-asset-list">' +
    (_0x223ca9 || '<p class="person-replacement-inline-empty">暂无人物素材</p>') +
    '</div>\n    <p class="person-replacement-voice-column-hint">点击右侧句子的“+”后选择高亮人物，也可将人物直接拖入“+”。</p>\n  </aside>'
  );
}
export function renderPersonReplacementVoiceCloneSourceCards(_0x3f3cf2) {
  const _0x224722 = Array['isArray'](_0x3f3cf2['sources']) ? _0x3f3cf2['sources'] : [],
    _0x18c2d0 = Array['isArray'](_0x3f3cf2['shots']) ? _0x3f3cf2['shots'] : [];
  return _0x224722['map']((_0x1bdd05, _0xfcc1be) => {
    const _0x402c08 = _0x1bdd05['id'] === _0x3f3cf2['workspace']['selectedVoiceSourceId'],
      _0x53403 =
        _0x18c2d0['find'](
          (_0x332c48) => _0x332c48?.['sourceId'] === _0x1bdd05['id'] && _0x332c48?.['keyframeRef'],
        )?.['keyframeRef'] || '',
      _0x4ad3f2 = normalizeMediaUrl(_0x1bdd05['thumbnailRef'] || _0x53403),
      _0x176ce3 = normalizeMediaUrl(
        _0x3f3cf2['sourcePreviewRefs']?.[_0x1bdd05['id']] || _0x1bdd05['videoRef'],
      ),
      _0x3fa2c9 = normalizeMediaUrl(_0x1bdd05['videoRef']),
      _0x5a8856 = resolvePersonReplacementVoiceSeparationState(_0x3f3cf2, _0x1bdd05['id']),
      _0x2589b8 = isPersonReplacementVoiceSeparationActive(_0x5a8856),
      _0x16917c = normalizeMediaUrl(_0x5a8856['vocalsAudioRef'] || _0x5a8856['vocalsAudioUrl']),
      _0x4bf850 = Boolean(_0x16917c),
      _0x22cd75 = _0x1bdd05['fileName'] || '视频 ' + (_0xfcc1be + 0x1),
      _0x3f3144 = Number(_0x1bdd05['durationSec']),
      _0xa7d1f = Number['isFinite'](_0x3f3144) && _0x3f3144 > 0x0 ? formatClock(_0x3f3144) : '完整视频',
      _0x10f88e = _0x4ad3f2
        ? '<img src="' +
          escapeHtml(_0x4ad3f2) +
          '" alt="' +
          escapeHtml(_0x22cd75 + '\x20视频封面') +
          '\x22\x20decoding=\x22async\x22\x20draggable=\x22false\x22>'
        : _0x176ce3
          ? '<video muted playsinline preload="metadata" src="' + escapeHtml(_0x176ce3) + '"></video>'
          : '<span\x20aria-hidden=\x22true\x22>视频</span>',
      _0x45e33b = renderAudioPlaybackSurface({
        audioUrl: _0x3fa2c9,
        className: 'person-replacement-voice-source-player',
        playLabel: '播放' + _0x22cd75 + '的原始声音',
        pauseLabel: '暂停' + _0x22cd75 + '的原始声音',
        dataAttributes: {
          'data-person-replacement-voice-track': 'original',
          'data-person-replacement-voice-track-source-id': _0x1bdd05['id'],
        },
      }),
      _0x4b479b = _0x4bf850
        ? renderAudioPlaybackSurface({
            audioUrl: _0x16917c,
            className: 'person-replacement-voice-source-player\x20is-clean-voice',
            playLabel: '播放' + _0x22cd75 + '的清晰人声',
            pauseLabel: '暂停' + _0x22cd75 + '的清晰人声',
            dataAttributes: {
              'data-person-replacement-voice-track': 'vocals',
              'data-person-replacement-voice-track-source-id': _0x1bdd05['id'],
            },
          })
        : '',
      _0x5eb66f = _0x2589b8
        ? '提取清晰人声'
        : _0x4bf850
          ? '已提取清晰人声'
          : _0x5a8856['status'] === 'failed'
            ? '重试'
            : '提取清晰人声',
      _0x5b4d8d = _0x2589b8
        ? _0x4bf850
          ? '正在更新，当前继续使用上次结果'
          : '正在分离人声与背景声…'
        : _0x4bf850
          ? '已自动设为声音克隆输入'
          : '',
      _0x36c394 = _0x5a8856['status'] === 'failed' ? _0x5a8856['error'] || '提取失败，请重试' : '',
      _0x259f47 = _0x36c394
        ? renderGenerationErrorCardMarkup({
            errorMessage: _0x36c394,
            title: '提取失败',
            className: 'person-replacement-voice-error-card',
            role: 'alert',
          })
        : '',
      _0x3dfb90 = _0x2589b8
        ? '正在提取清晰人声，点击可取消'
        : _0x4bf850
          ? '已提取清晰人声，点击可重新提取'
          : _0x5eb66f,
      _0x7dd25a = _0x2589b8
        ? '<span class="storyboard-script-loading-spinner person-replacement-voice-extraction-spinner" aria-hidden="true"></span>'
        : '';
    return (
      '<article class="person-replacement-voice-source-shell' +
      (_0x402c08 ? ' is-selected' : '') +
      (_0x2589b8 ? ' is-extracting' : '') +
      '\x22\x20data-person-replacement-voice-source-shell\x20data-source-id=\x22' +
      escapeHtml(_0x1bdd05['id']) +
      '">\n      <div class="person-replacement-voice-source-summary">\n        <button type="button" class="person-replacement-voice-source-card' +
      (_0x402c08 ? ' is-selected' : '') +
      '" data-person-replacement-action="select-voice-source" data-source-id="' +
      escapeHtml(_0x1bdd05['id']) +
      '" aria-pressed="' +
      _0x402c08 +
      '" aria-label="' +
      escapeHtml('检测完整原始视频：' + _0x22cd75) +
      '">\n          <span class="person-replacement-voice-source-thumb">' +
      _0x10f88e +
      '</span>\n          <span class="person-replacement-voice-source-copy"><strong>' +
      escapeHtml(_0x22cd75) +
      '</strong><small>' +
      escapeHtml(_0xa7d1f) +
      '\x20·\x20原始上传</small></span>\x0a\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20<span\x20class=\x22person-replacement-voice-source-state\x22>' +
      (_0x402c08 ? '当前' : '选择') +
      '</span>\n        </button>\n        <button type="button" class="person-replacement-voice-extraction-action' +
      (_0x2589b8 ? ' is-cancel is-loading' : '') +
      (_0x4bf850 && !_0x2589b8 ? ' is-success' : '') +
      '" data-person-replacement-action="' +
      (_0x2589b8 ? 'cancel-voice-separation' : 'extract-clean-voice') +
      '" data-source-id="' +
      escapeHtml(_0x1bdd05['id']) +
      '\x22\x20title=\x22' +
      escapeHtml(_0x3dfb90) +
      '" aria-label="' +
      escapeHtml(_0x3dfb90) +
      '" aria-busy="' +
      _0x2589b8 +
      '\x22' +
      (_0x3fa2c9 ? '' : ' disabled') +
      '>' +
      _0x7dd25a +
      '<span>' +
      escapeHtml(_0x5eb66f) +
      '</span></button>\n      </div>\n      <div class="person-replacement-voice-source-details">\n        <section class="person-replacement-voice-track" aria-label="原始声音">\n          <div class="person-replacement-voice-track-heading"><strong>原始声音</strong><small>来自完整原始视频</small></div>\n          ' +
      _0x45e33b +
      '\n        </section>\n        ' +
      (_0x4bf850
        ? '<section class="person-replacement-voice-track is-clean-voice" aria-label="清晰人声">\n          <div class="person-replacement-voice-track-heading"><strong>清晰人声</strong><span>克隆输入</span></div>\n          ' +
          _0x4b479b +
          '\n        </section>'
        : '') +
      '\x0a\x20\x20\x20\x20\x20\x20\x20\x20' +
      _0x259f47 +
      '\n        ' +
      (_0x5b4d8d
        ? '<footer class="person-replacement-voice-extraction-footer"><span class="person-replacement-voice-extraction-status" title="' +
          escapeHtml(_0x5b4d8d) +
          '\x22>' +
          escapeHtml(_0x5b4d8d) +
          '</span></footer>'
        : '') +
      '\x0a\x20\x20\x20\x20\x20\x20</div>\x0a\x20\x20\x20\x20</article>'
    );
  })['join']('');
}
function renderVoiceCloneSources(_0x52a0d9) {
  const _0x73ad7e = renderPersonReplacementVoiceCloneSourceCards(_0x52a0d9);
  return (
    '<aside\x20class=\x22person-replacement-voice-sources\x22\x20aria-label=\x22原始上传视频\x22>\x0a\x20\x20\x20\x20<header\x20class=\x22person-replacement-voice-column-heading\x22><strong>原始视频</strong><small>声音检测始终使用最初上传的完整视频</small></header>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-voice-source-list\x22>' +
    (_0x73ad7e || '<p class="person-replacement-inline-empty">请先在项目首页上传视频</p>') +
    '</div>\n  </aside>'
  );
}
function renderVoiceLayoutSplitter(_0x2f45d0, _0x4d7221) {
  const _0x1723d7 = _0x2f45d0 === 'assets',
    _0x40de86 = _0x1723d7 ? _0x4d7221['assetsEnd'] : _0x4d7221['sourcesEnd'],
    _0x2d0ba5 = _0x1723d7 ? 0x10 : _0x4d7221['assetsEnd'] + 0x10,
    _0x1b20d2 = _0x1723d7 ? _0x4d7221['sourcesEnd'] - 0x10 : 0x3c,
    _0xb4d411 = _0x1723d7 ? '调整原始视频栏宽度' : '调整人物素材栏宽度';
  return (
    '<div class="person-replacement-voice-layout-splitter panel-resize-handle panel-resize-handle--transient is-' +
    _0x2f45d0 +
    '" data-person-replacement-voice-layout-splitter="' +
    _0x2f45d0 +
    '\x22\x20role=\x22separator\x22\x20aria-orientation=\x22vertical\x22\x20aria-label=\x22' +
    _0xb4d411 +
    '" aria-valuemin="' +
    Math['round'](_0x2d0ba5) +
    '\x22\x20aria-valuemax=\x22' +
    Math['round'](_0x1b20d2) +
    '" aria-valuenow="' +
    Math['round'](_0x40de86) +
    '" tabindex="0"></div>'
  );
}
export function applyPersonReplacementVoiceLayoutToElement(_0x3b796e, _0x341b89) {
  const _0x7e2774 = normalizePersonReplacementVoiceLayout(_0x341b89);
  (_0x3b796e?.['style']?.['setProperty']?.(
    '--person-replacement-voice-assets-end',
    _0x7e2774['assetsEnd'] + '%',
  ),
    _0x3b796e?.['style']?.['setProperty']?.(
      '--person-replacement-voice-sources-end',
      _0x7e2774['sourcesEnd'] + '%',
    ));
  const _0x4db41d = _0x3b796e?.['querySelector']?.(
      '[data-person-replacement-voice-layout-splitter="assets"]',
    ),
    _0x48672a = _0x3b796e?.['querySelector']?.('[data-person-replacement-voice-layout-splitter="sources"]');
  return (
    _0x4db41d?.['setAttribute']?.('aria-valuemax', String(Math['round'](_0x7e2774['sourcesEnd'] - 0x10))),
    _0x4db41d?.['setAttribute']?.('aria-valuenow', String(Math['round'](_0x7e2774['assetsEnd']))),
    _0x48672a?.['setAttribute']?.('aria-valuemin', String(Math['round'](_0x7e2774['assetsEnd'] + 0x10))),
    _0x48672a?.['setAttribute']?.('aria-valuenow', String(Math['round'](_0x7e2774['sourcesEnd']))),
    _0x7e2774
  );
}
export function renderPersonReplacementVoiceClonePage(_0x9431ce, { footerHtml: footerHtml = '' } = {}) {
  const _0x471dc4 = normalizePersonReplacementVoiceLayout(_0x9431ce['workspace']['voiceLayout']);
  return (
    '<div\x20class=\x22person-replacement-voice-page\x22>\x0a\x20\x20\x20\x20<div\x20class=\x22person-replacement-voice-layout\x22\x20data-person-replacement-voice-layout\x20style=\x22--person-replacement-voice-assets-end:' +
    _0x471dc4['assetsEnd'] +
    '%;--person-replacement-voice-sources-end:' +
    _0x471dc4['sourcesEnd'] +
    '%\x22>\x0a\x20\x20\x20\x20\x20\x20' +
    renderVoiceCloneSources(_0x9431ce) +
    '\n      ' +
    renderVoiceLayoutSplitter('assets', _0x471dc4) +
    '\n      ' +
    renderVoiceCloneCharacterAssets(_0x9431ce) +
    '\n      ' +
    renderVoiceLayoutSplitter('sources', _0x471dc4) +
    '\n      <section class="person-replacement-voice-studio-column" aria-label="声音克隆工作区"><div class="person-replacement-voice-studio-host" data-person-replacement-voice-studio-host></div></section>\n    </div>\n    ' +
    footerHtml +
    '\n  </div>'
  );
}

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
function normalizeText(value) {
  return String(value ?? '').trim();
}
function escapeHtml(item) {
  return String(item ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&apos;');
}
function normalizeMediaUrl(key) {
  const text = normalizeText(key);
  if (!text) return '';
  return localPathToUrl(text) || text;
}
function formatClock(index) {
  const result = Math.max(0, Number(index) || 0),
    data = Math.floor(result / 60),
    options = Math.floor(result % 60);
  return String(data).padStart(2, '0') + ':' + String(options).padStart(2, '0');
}
function getCharacterAppearance(options2 = {}) {
  const workspaceAssetAppearances = getWorkspaceAssetAppearances(options2);
  return getWorkspaceAssetBaseAppearance(options2) || workspaceAssetAppearances[0] || null;
}
function getCharacterVoiceUrl(options3 = {}) {
  return normalizeMediaUrl(
    options3.voiceReference?.audioUrl ||
      options3.voiceReference?.localPath ||
      options3.voiceRef,
  );
}
export function getPersonReplacementVoiceCloneCharacters(options4 = {}) {
  return Array.isArray(options4.characters) ? options4.characters : [];
}
export function renderPersonReplacementVoiceCloneCharacterCards(target) {
  const list = getPersonReplacementVoiceCloneCharacters(target);
  return list.map((error) => {
    const characterAppearance = getCharacterAppearance(error),
      mediaUrl = normalizeMediaUrl(characterAppearance?.imageUrl),
      characterVoiceUrl = getCharacterVoiceUrl(error),
      source = Boolean(characterVoiceUrl),
      renderPersonReplacementVoicePreviewPlayer2 = renderPersonReplacementVoicePreviewPlayer(
        { ...error, kind: 'character' },
        { className: 'person-replacement-voice-asset-preview', showWaveform: false },
      );
    return (
      '<article class="person-replacement-voice-asset-shell' +
      (source ? ' has-audio' : ' is-missing-audio') +
      '">\n      <button type="button" class="person-replacement-voice-asset-card' +
      (source ? ' has-audio' : ' is-missing-audio') +
      '" data-person-replacement-action="select-voice-asset" data-person-replacement-voice-asset-id="' +
      escapeHtml(error.id) +
      '" data-character-id="' +
      escapeHtml(error.id) +
      '" ' +
      (source ? 'draggable="true"' : 'disabled') +
      ' aria-label="' +
      escapeHtml(source ? '加载' + error.name + '的人物音频' : error.name + '无音频') +
      '">\n        <span class="person-replacement-voice-asset-image">' +
      (mediaUrl
        ? '<img src="' + escapeHtml(mediaUrl) + '" alt="' + escapeHtml(error.name) + '">'
        : '<span aria-hidden="true">人</span>') +
      '</span>\n        <span class="person-replacement-voice-asset-copy"><strong>' +
      escapeHtml(error.name) +
      '</strong><small>' +
      (source ? '选择人物素材，使用对应声音' : '无音频') +
      '</small></span>\n        <span class="person-replacement-voice-asset-status' +
      (source ? ' is-ready' : ' is-empty') +
      '">' +
      (source ? '可用' : '无音频') +
      '</span>\n      </button>\n      ' +
      renderPersonReplacementVoicePreviewPlayer2 +
      '\n    </article>'
    );
  }).join('');
}
function renderVoiceCloneCharacterAssets(next) {
  const renderPersonReplacementVoiceCloneCharacterCards2 =
    renderPersonReplacementVoiceCloneCharacterCards(next);
  return (
    '<aside class="person-replacement-voice-assets" aria-label="人物音频素材">\n    <header class="person-replacement-voice-column-heading"><strong>人物素材</strong><small>显示当前项目的全部人物</small></header>\n    <div class="person-replacement-voice-asset-list">' +
    (renderPersonReplacementVoiceCloneCharacterCards2 ||
      '<p class="person-replacement-inline-empty">暂无人物素材</p>') +
    '</div>\n    <p class="person-replacement-voice-column-hint">点击右侧句子的“+”后选择高亮人物，也可将人物直接拖入“+”。</p>\n  </aside>'
  );
}
export function renderPersonReplacementVoiceCloneSourceCards(current) {
  const list2 = Array.isArray(current.sources) ? current.sources : [],
    list3 = Array.isArray(current.shots) ? current.shots : [];
  return list2.map((entry, record) => {
    const payload = entry.id === current.workspace.selectedVoiceSourceId,
      handle =
        list3.find((state) => state?.sourceId === entry.id && state?.keyframeRef)?.keyframeRef || '',
      mediaUrl2 = normalizeMediaUrl(entry.thumbnailRef || handle),
      mediaUrl3 = normalizeMediaUrl(current.sourcePreviewRefs?.[entry.id] || entry.videoRef),
      audioUrl = normalizeMediaUrl(entry.videoRef),
      response = resolvePersonReplacementVoiceSeparationState(current, entry.id),
      isPersonReplacementVoiceSeparationActive2 = isPersonReplacementVoiceSeparationActive(response),
      audioUrl2 = normalizeMediaUrl(response.vocalsAudioRef || response.vocalsAudioUrl),
      config = Boolean(audioUrl2),
      scope = entry.fileName || '视频 ' + (record + 1),
      count = Number(entry.durationSec),
      input = Number.isFinite(count) && count > 0 ? formatClock(count) : '完整视频',
      output = mediaUrl2
        ? '<img src="' +
          escapeHtml(mediaUrl2) +
          '" alt="' +
          escapeHtml(scope + ' 视频封面') +
          '" decoding="async" draggable="false">'
        : mediaUrl3
          ? '<video muted playsinline preload="metadata" src="' + escapeHtml(mediaUrl3) + '"></video>'
          : '<span aria-hidden="true">视频</span>',
      renderAudioPlaybackSurface2 = renderAudioPlaybackSurface({
        audioUrl: audioUrl,
        className: 'person-replacement-voice-source-player',
        playLabel: '播放' + scope + '的原始声音',
        pauseLabel: '暂停' + scope + '的原始声音',
        dataAttributes: {
          'data-person-replacement-voice-track': 'original',
          'data-person-replacement-voice-track-source-id': entry.id,
        },
      }),
      value2 = config
        ? renderAudioPlaybackSurface({
            audioUrl: audioUrl2,
            className: 'person-replacement-voice-source-player is-clean-voice',
            playLabel: '播放' + scope + '的清晰人声',
            pauseLabel: '暂停' + scope + '的清晰人声',
            dataAttributes: {
              'data-person-replacement-voice-track': 'vocals',
              'data-person-replacement-voice-track-source-id': entry.id,
            },
          })
        : '',
      value3 = isPersonReplacementVoiceSeparationActive2
        ? '提取清晰人声'
        : config
          ? '已提取清晰人声'
          : response.status === 'failed'
            ? '重试'
            : '提取清晰人声',
      value4 = isPersonReplacementVoiceSeparationActive2
        ? config
          ? '正在更新，当前继续使用上次结果'
          : '正在分离人声与背景声…'
        : config
          ? '已自动设为声音克隆输入'
          : '',
      errorMessage = response.status === 'failed' ? response.error || '提取失败，请重试' : '',
      value5 = errorMessage
        ? renderGenerationErrorCardMarkup({
            errorMessage: errorMessage,
            title: '提取失败',
            className: 'person-replacement-voice-error-card',
            role: 'alert',
          })
        : '',
      value6 = isPersonReplacementVoiceSeparationActive2
        ? '正在提取清晰人声，点击可取消'
        : config
          ? '已提取清晰人声，点击可重新提取'
          : value3,
      value7 = isPersonReplacementVoiceSeparationActive2
        ? '<span class="storyboard-script-loading-spinner person-replacement-voice-extraction-spinner" aria-hidden="true"></span>'
        : '';
    return (
      '<article class="person-replacement-voice-source-shell' +
      (payload ? ' is-selected' : '') +
      (isPersonReplacementVoiceSeparationActive2 ? ' is-extracting' : '') +
      '" data-person-replacement-voice-source-shell data-source-id="' +
      escapeHtml(entry.id) +
      '">\n      <div class="person-replacement-voice-source-summary">\n        <button type="button" class="person-replacement-voice-source-card' +
      (payload ? ' is-selected' : '') +
      '" data-person-replacement-action="select-voice-source" data-source-id="' +
      escapeHtml(entry.id) +
      '" aria-pressed="' +
      payload +
      '" aria-label="' +
      escapeHtml('检测完整原始视频：' + scope) +
      '">\n          <span class="person-replacement-voice-source-thumb">' +
      output +
      '</span>\n          <span class="person-replacement-voice-source-copy"><strong>' +
      escapeHtml(scope) +
      '</strong><small>' +
      escapeHtml(input) +
      ' · 原始上传</small></span>\n          <span class="person-replacement-voice-source-state">' +
      (payload ? '当前' : '选择') +
      '</span>\n        </button>\n        <button type="button" class="person-replacement-voice-extraction-action' +
      (isPersonReplacementVoiceSeparationActive2 ? ' is-cancel is-loading' : '') +
      (config && !isPersonReplacementVoiceSeparationActive2 ? ' is-success' : '') +
      '" data-person-replacement-action="' +
      (isPersonReplacementVoiceSeparationActive2 ? 'cancel-voice-separation' : 'extract-clean-voice') +
      '" data-source-id="' +
      escapeHtml(entry.id) +
      '" title="' +
      escapeHtml(value6) +
      '" aria-label="' +
      escapeHtml(value6) +
      '" aria-busy="' +
      isPersonReplacementVoiceSeparationActive2 +
      '"' +
      (audioUrl ? '' : ' disabled') +
      '>' +
      value7 +
      '<span>' +
      escapeHtml(value3) +
      '</span></button>\n      </div>\n      <div class="person-replacement-voice-source-details">\n        <section class="person-replacement-voice-track" aria-label="原始声音">\n          <div class="person-replacement-voice-track-heading"><strong>原始声音</strong><small>来自完整原始视频</small></div>\n          ' +
      renderAudioPlaybackSurface2 +
      '\n        </section>\n        ' +
      (config
        ? '<section class="person-replacement-voice-track is-clean-voice" aria-label="清晰人声">\n          <div class="person-replacement-voice-track-heading"><strong>清晰人声</strong><span>克隆输入</span></div>\n          ' +
          value2 +
          '\n        </section>'
        : '') +
      '\n        ' +
      value5 +
      '\n        ' +
      (value4
        ? '<footer class="person-replacement-voice-extraction-footer"><span class="person-replacement-voice-extraction-status" title="' +
          escapeHtml(value4) +
          '">' +
          escapeHtml(value4) +
          '</span></footer>'
        : '') +
      '\n      </div>\n    </article>'
    );
  }).join('');
}
function renderVoiceCloneSources(value8) {
  const renderPersonReplacementVoiceCloneSourceCards2 = renderPersonReplacementVoiceCloneSourceCards(value8);
  return (
    '<aside class="person-replacement-voice-sources" aria-label="原始上传视频">\n    <header class="person-replacement-voice-column-heading"><strong>原始视频</strong><small>声音检测始终使用最初上传的完整视频</small></header>\n    <div class="person-replacement-voice-source-list">' +
    (renderPersonReplacementVoiceCloneSourceCards2 ||
      '<p class="person-replacement-inline-empty">请先在项目首页上传视频</p>') +
    '</div>\n  </aside>'
  );
}
function renderVoiceLayoutSplitter(value9, value10) {
  const value11 = value9 === 'assets',
    value12 = value11 ? value10.assetsEnd : value10.sourcesEnd,
    value13 = value11 ? 16 : value10.assetsEnd + 16,
    value14 = value11 ? value10.sourcesEnd - 16 : 60,
    value15 = value11 ? '调整原始视频栏宽度' : '调整人物素材栏宽度';
  return (
    '<div class="person-replacement-voice-layout-splitter panel-resize-handle panel-resize-handle--transient is-' +
    value9 +
    '" data-person-replacement-voice-layout-splitter="' +
    value9 +
    '" role="separator" aria-orientation="vertical" aria-label="' +
    value15 +
    '" aria-valuemin="' +
    Math.round(value13) +
    '" aria-valuemax="' +
    Math.round(value14) +
    '" aria-valuenow="' +
    Math.round(value12) +
    '" tabindex="0"></div>'
  );
}
export function applyPersonReplacementVoiceLayoutToElement(el, value16) {
  const personReplacementVoiceLayout = normalizePersonReplacementVoiceLayout(value16);
  (el?.style?.setProperty?.(
    '--person-replacement-voice-assets-end',
    personReplacementVoiceLayout.assetsEnd + '%',
  ),
    el?.style?.setProperty?.(
      '--person-replacement-voice-sources-end',
      personReplacementVoiceLayout.sourcesEnd + '%',
    ));
  const el2 = el?.querySelector?.('[data-person-replacement-voice-layout-splitter="assets"]'),
    el3 = el?.querySelector?.('[data-person-replacement-voice-layout-splitter="sources"]');
  return (
    el2?.setAttribute?.(
      'aria-valuemax',
      String(Math.round(personReplacementVoiceLayout.sourcesEnd - 16)),
    ),
    el2?.setAttribute?.(
      'aria-valuenow',
      String(Math.round(personReplacementVoiceLayout.assetsEnd)),
    ),
    el3?.setAttribute?.(
      'aria-valuemin',
      String(Math.round(personReplacementVoiceLayout.assetsEnd + 16)),
    ),
    el3?.setAttribute?.(
      'aria-valuenow',
      String(Math.round(personReplacementVoiceLayout.sourcesEnd)),
    ),
    personReplacementVoiceLayout
  );
}
export function renderPersonReplacementVoiceClonePage(value17, { footerHtml: footerHtml = '' } = {}) {
  const personReplacementVoiceLayout2 = normalizePersonReplacementVoiceLayout(
    value17.workspace.voiceLayout,
  );
  return (
    '<div class="person-replacement-voice-page">\n    <div class="person-replacement-voice-layout" data-person-replacement-voice-layout style="--person-replacement-voice-assets-end:' +
    personReplacementVoiceLayout2.assetsEnd +
    '%;--person-replacement-voice-sources-end:' +
    personReplacementVoiceLayout2.sourcesEnd +
    '%">\n      ' +
    renderVoiceCloneSources(value17) +
    '\n      ' +
    renderVoiceLayoutSplitter('assets', personReplacementVoiceLayout2) +
    '\n      ' +
    renderVoiceCloneCharacterAssets(value17) +
    '\n      ' +
    renderVoiceLayoutSplitter('sources', personReplacementVoiceLayout2) +
    '\n      <section class="person-replacement-voice-studio-column" aria-label="声音克隆工作区"><div class="person-replacement-voice-studio-host" data-person-replacement-voice-studio-host></div></section>\n    </div>\n    ' +
    footerHtml +
    '\n  </div>'
  );
}
